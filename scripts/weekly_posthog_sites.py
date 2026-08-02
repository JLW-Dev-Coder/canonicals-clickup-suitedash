"""
Weekly PostHog -> Sites-list "Site Traffic" subtask writer (with backfill).

For each 7-day window ending on a Saturday S, pulls per-host $pageview
engagement from PostHog and writes it as a structured
"Site Traffic [YYYY-MM-DD Dayname]" subtask under the matching site task in
the ClickUp "Sites" list, setting six raw-count / date custom fields. Two
ratio CFs (Page/Session, Engagement Rate) are ClickUp *formula* fields and
are never written -- ClickUp derives them.

Runs Saturdays at 14:00 UTC via GitHub Actions (current trailing week only).
A `backfill_from` Saturday (workflow_dispatch input / BACKFILL_FROM env / CLI
arg) re-queries PostHog per prior window and upserts each week. Backfill is
idempotent: an existing week's subtask is updated in place, never duplicated.

Environment variables required:
  POSTHOG_API_KEY        Personal API key with project:read scope
  POSTHOG_PROJECT_ID     Numeric project ID
  POSTHOG_HOST           e.g. https://us.posthog.com (no trailing slash)
  CLICKUP_API_TOKEN      Personal API token

Optional:
  BACKFILL_FROM          A Saturday YYYY-MM-DD (snapped to that week's
                         Saturday if a non-Saturday is given). If set, every
                         week from that Saturday through BACKFILL_TO (default:
                         the most recent Saturday) is (re)written.
  BACKFILL_TO            A Saturday YYYY-MM-DD bounding the *end* of the
                         backfill range, so a single window can be pinned and
                         run on its own (BACKFILL_FROM == BACKFILL_TO). Never
                         allowed past the most recent Saturday -- we do not
                         write windows that have not closed yet.

CLI:
  python scripts/weekly_posthog_sites.py [FROM] [TO] [--dry-run]
    positional 1 YYYY-MM-DD  same as BACKFILL_FROM (CLI wins over env)
    positional 2 YYYY-MM-DD  same as BACKFILL_TO   (CLI wins over env)
    --dry-run                query PostHog + read the roster, print the planned
                             per-site writes (with the subtask id each one
                             resolves to), and touch nothing in ClickUp

Every live window ends with a post-write reconciliation guard: PostHog is
re-queried for the same window through the same function, ClickUp is re-read,
and the stored custom-field values and subtask counts must agree. A mismatch
prints the offending host/field and aborts the run non-zero rather than
leaving a half-written week that looks complete.
"""

import os
import sys
import json
import datetime as dt
import urllib.request
import urllib.error

# Encoding guard (Windows cp1252 default would crash on em-dashes, arrows).
# GHA Ubuntu runners default to UTF-8 but keep this guard for local dev runs.
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# ─── Canonical constants (verified 2026-07-18) ──────────────────────────
SITES_LIST_ID = "901715084230"
RUN_SUMMARY_TASK_ID = "86e2285zc"  # optional one-line audit comment per run

# Site Traffic subtasks are set to the "archive" status to match JLW's
# hand-made template subtask (86e2db660). The Sites-list default status is
# "hold" (yellow); left unset, new subtasks would inherit "hold". "archive"
# is a valid settable status on this list (type=done, color #aa8d80).
SUBTASK_STATUS = "archive"

# The six writable custom fields. The two ratio CFs (PostHog Page/Session,
# PostHog Engagement Rate) are formula fields -- ClickUp derives them, so we
# never write them.
CF_PAGE_VIEWS = "6dbf3237-1105-4cbf-a36f-162f0292ea51"      # number
CF_UNIQUE_VISITORS = "5473cad9-8dc2-432d-9b8d-7eb04d03b802"  # number
CF_SESSIONS = "5836f37d-de29-47b2-b71d-09be77d456bb"         # number
CF_INTERNAL_NAVS = "f706493a-fbff-4a3c-a6e7-1d41a7c07374"    # number
CF_TRACK_START = "a0305241-8b03-4e9c-878c-f4af3ee88549"      # date
CF_TRACK_END = "1e1fb3b2-be4e-4990-b087-d62ffcd5e341"        # date

# The four count fields the reconciliation guard re-checks after writing.
# (row key, custom field id, human label for the failure line)
GUARD_FIELDS = (
    ("pageviews", CF_PAGE_VIEWS, "page views"),
    ("unique_visitors", CF_UNIQUE_VISITORS, "unique visitors"),
    ("sessions", CF_SESSIONS, "sessions"),
    ("internal_navs", CF_INTERNAL_NAVS, "internal navs"),
)

# Date custom fields are written at 11:00:00 UTC, not 00:00 UTC. This exactly
# reproduces the hand-made example subtask's stored epochs
# (2026-07-11 -> 1783767600000, 2026-07-17 -> 1784286000000) and keeps the
# displayed calendar day correct for US-timezone viewers (a UTC-midnight epoch
# renders as the previous day for anyone behind UTC).
DATE_CF_HOUR_UTC = 11

# Host -> roster-task-host aliases for known spelling gaps.
#   key   = host as PostHog reports it ($host, normalized)
#   value = host as the site task is named in the Sites list (normalized)
# Intentionally EMPTY: PostHog reports the 280e site as "280ea.virtuallaunch.pro"
# and the roster task is literally named "https://280ea.virtuallaunch.pro", so it
# maps directly with no alias. (The original spec's "280ea -> 280e" alias was
# based on a misremembered task name and would have skipped the site entirely.)
HOST_ALIASES: dict[str, str] = {}

# ─── Internal (Owner) traffic exclusion ─────────────────────────────────
# The Owner's own browsing was being counted as audience. Verified against
# PostHog 2026-07-25: for the week ending 07-24, green.virtuallaunch.pro
# reported 82 unique visitors of which 80 pageviews were the Owner's own four
# devices, and 280ea.virtuallaunch.pro reported 19 pageviews of which 6 were
# external.
#
# Matched on IP, deliberately NOT on geo. San Diego / El Cajon was an analysis
# proxy only -- California is the #1 target state for 280EA outreach, so a geo
# filter would silently delete real prospects from the Owner's own reporting.
#
# The IPv6 suffix rotates per device (privacy extensions); the /64 network
# prefix is the stable handle. Residential allocations can still move: if the
# ISP re-leases either address this predicate matches nothing and the numbers
# quietly re-inflate. That is why the run reports its excluded count -- a drop
# to zero is the drift signal. Update these values, do not remove the filter.
INTERNAL_IPV4 = "98.176.144.178"
INTERNAL_IPV6_PREFIX = "2600:8801:8d1a:2600:"

INTERNAL_TRAFFIC_SQL = (
    f"(coalesce(toString(properties.$ip), '') = '{INTERNAL_IPV4}'"
    f" OR coalesce(toString(properties.$ip), '') LIKE '{INTERNAL_IPV6_PREFIX}%')"
)

# ─── Env ────────────────────────────────────────────────────────────────
POSTHOG_API_KEY = os.environ["POSTHOG_API_KEY"]
POSTHOG_PROJECT_ID = os.environ["POSTHOG_PROJECT_ID"]
POSTHOG_HOST = os.environ["POSTHOG_HOST"].rstrip("/")
CLICKUP_API_TOKEN = os.environ["CLICKUP_API_TOKEN"]


# ─── HTTP helpers ───────────────────────────────────────────────────────
def _http(method: str, url: str, headers: dict, body: dict | None = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            text = resp.read().decode("utf-8")
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"HTTP {e.code} {e.reason} on {method} {url}\n")
        sys.stderr.write(e.read().decode("utf-8", errors="replace") + "\n")
        raise


def http_post(url: str, headers: dict, body: dict) -> dict:
    return _http("POST", url, headers, body)


def http_get(url: str, headers: dict) -> dict:
    return _http("GET", url, headers)


def http_put(url: str, headers: dict, body: dict) -> dict:
    return _http("PUT", url, headers, body)


# ─── PostHog ────────────────────────────────────────────────────────────
def run_hogql(query: str) -> list[dict]:
    url = f"{POSTHOG_HOST}/api/projects/{POSTHOG_PROJECT_ID}/query/"
    headers = {
        "Authorization": f"Bearer {POSTHOG_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {"query": {"kind": "HogQLQuery", "query": query}}
    resp = http_post(url, headers, body)
    columns = resp.get("columns") or []
    rows = resp.get("results") or []
    return [dict(zip(columns, row)) for row in rows]


def fetch_window(window_start: dt.date, window_end_excl: dt.date) -> tuple[list[dict], int]:
    """Per-host external pageview totals + internal navs for [window_start, window_end_excl).

    Owner traffic (see INTERNAL_TRAFFIC_SQL) is excluded from every metric.
    Returns (rows, excluded_pageview_count) where the count covers the whole
    window across all hosts, including hosts dropped for having no external
    traffic.
    """
    start = window_start.isoformat()
    end = window_end_excl.isoformat()
    totals_q = f"""
    SELECT properties.$host AS host,
           countIf(NOT {INTERNAL_TRAFFIC_SQL}) AS pageviews,
           uniqIf(distinct_id, NOT {INTERNAL_TRAFFIC_SQL}) AS unique_visitors,
           uniqIf(properties.$session_id, NOT {INTERNAL_TRAFFIC_SQL}) AS sessions,
           countIf({INTERNAL_TRAFFIC_SQL}) AS excluded_pageviews
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= '{start} 00:00:00'
      AND timestamp <  '{end} 00:00:00'
    GROUP BY host
    ORDER BY pageviews DESC
    LIMIT 100
    """
    navs_q = f"""
    SELECT properties.$host AS host,
           count() AS internal_navs
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= '{start} 00:00:00'
      AND timestamp <  '{end} 00:00:00'
      AND properties.$prev_pageview_pathname IS NOT NULL
      AND NOT {INTERNAL_TRAFFIC_SQL}
    GROUP BY host
    ORDER BY internal_navs DESC
    LIMIT 100
    """
    totals = run_hogql(totals_q)
    navs_by_host = {r["host"]: r["internal_navs"] for r in run_hogql(navs_q)}
    # Sum before dropping empties -- a host whose traffic was entirely internal
    # still contributed to the excluded count and must not vanish from it.
    excluded_total = sum(int(r.get("excluded_pageviews") or 0) for r in totals)
    merged = []
    for r in totals:
        if not r["pageviews"]:
            # No external traffic this window. Previously such a host produced
            # no row at all; keep that behaviour so no all-zero subtask is written.
            continue
        merged.append(
            {
                "host": r["host"],
                "pageviews": r["pageviews"],
                "unique_visitors": r["unique_visitors"],
                "sessions": r["sessions"],
                "internal_navs": navs_by_host.get(r["host"], 0),
            }
        )
    return merged, excluded_total


# ─── ClickUp ────────────────────────────────────────────────────────────
CLICKUP_BASE = "https://api.clickup.com/api/v2"
CLICKUP_HEADERS = {
    "Authorization": CLICKUP_API_TOKEN,
    "Content-Type": "application/json",
}


def fetch_sites_and_subtasks() -> tuple[dict, set, dict, dict]:
    """
    Walk the Sites list (parents + subtasks, incl. closed-status tasks) with
    pagination. Returns:
      roster        : {normalized_host -> site_task_id} for uniquely-named parents
      ambiguous     : {normalized_host} that map to >1 parent task
      subtask_index : {(parent_id, subtask_name) -> subtask_id}
      subtask_cf    : {(parent_id, subtask_name) -> {custom_field_id -> value}}
                      -- the values ClickUp actually has stored, which is what
                      the reconciliation guard compares against.
    """
    norm_to_ids: dict[str, list[str]] = {}
    subtask_index: dict[tuple[str, str], str] = {}
    subtask_cf: dict[tuple[str, str], dict] = {}
    page = 0
    while True:
        url = (
            f"{CLICKUP_BASE}/list/{SITES_LIST_ID}/task"
            f"?archived=false&include_closed=true&subtasks=true&page={page}"
        )
        resp = http_get(url, CLICKUP_HEADERS)
        tasks = resp.get("tasks", [])
        for t in tasks:
            parent = t.get("parent")
            if parent:
                key = (parent, t["name"])
                subtask_index[key] = t["id"]
                subtask_cf[key] = {
                    cf["id"]: cf.get("value") for cf in (t.get("custom_fields") or [])
                }
            else:
                norm_to_ids.setdefault(normalize_host(t["name"]), []).append(t["id"])
        if resp.get("last_page") or not tasks:
            break
        page += 1

    roster = {n: ids[0] for n, ids in norm_to_ids.items() if len(ids) == 1}
    ambiguous = {n for n, ids in norm_to_ids.items() if len(ids) > 1}
    return roster, ambiguous, subtask_index, subtask_cf


def cf_int(cf_values: dict, field_id: str) -> int | None:
    """Read a ClickUp number CF back as an int. ClickUp returns numbers as
    strings ("209") and omits the key entirely when the field was never set;
    None means 'not stored', which is never equal to a real count."""
    v = cf_values.get(field_id)
    if v is None or v == "":
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def create_subtask(parent_id: str, name: str) -> str:
    resp = http_post(
        f"{CLICKUP_BASE}/list/{SITES_LIST_ID}/task",
        CLICKUP_HEADERS,
        {"name": name, "parent": parent_id, "status": SUBTASK_STATUS},
    )
    return resp["id"]


def set_task_status(task_id: str, status: str) -> None:
    http_put(
        f"{CLICKUP_BASE}/task/{task_id}",
        CLICKUP_HEADERS,
        {"status": status},
    )


def set_custom_field(task_id: str, field_id: str, value) -> None:
    http_post(
        f"{CLICKUP_BASE}/task/{task_id}/field/{field_id}",
        CLICKUP_HEADERS,
        {"value": value},
    )


def post_run_summary(text: str) -> None:
    http_post(
        f"{CLICKUP_BASE}/task/{RUN_SUMMARY_TASK_ID}/comment",
        CLICKUP_HEADERS,
        {"comment_text": text, "notify_all": False},
    )


# ─── Mapping / dates ────────────────────────────────────────────────────
def normalize_host(name: str) -> str:
    n = (name or "").strip().lower()
    if n.startswith("https://"):
        n = n[len("https://"):]
    elif n.startswith("http://"):
        n = n[len("http://"):]
    return n.rstrip("/")


def map_host_to_site(host: str, roster: dict, ambiguous: set) -> tuple[str, str]:
    """Return (kind, detail): ('match', task_id) | ('ambiguous', norm) | ('skip', norm)."""
    if not host:
        return ("skip", "(empty host)")
    n = normalize_host(host)
    n = normalize_host(HOST_ALIASES.get(n, n))  # apply alias, then re-normalize target
    if n in ambiguous:
        return ("ambiguous", n)
    tid = roster.get(n)
    if tid:
        return ("match", tid)
    return ("skip", n)


def most_recent_saturday(d: dt.date) -> dt.date:
    """Saturday on or before d (weekday(): Mon=0 .. Sat=5 .. Sun=6)."""
    return d - dt.timedelta(days=(d.weekday() - 5) % 7)


def date_cf_ms(d: dt.date) -> int:
    """Epoch ms at DATE_CF_HOUR_UTC on date d (matches the hand-made example)."""
    stamp = dt.datetime(d.year, d.month, d.day, DATE_CF_HOUR_UTC, 0, 0, tzinfo=dt.timezone.utc)
    return int(stamp.timestamp() * 1000)


def week_windows(saturday_from: dt.date, saturday_to: dt.date) -> list[dt.date]:
    weeks = []
    s = saturday_from
    while s <= saturday_to:
        weeks.append(s)
        s = s + dt.timedelta(days=7)
    return weeks


# ─── Upsert ─────────────────────────────────────────────────────────────
def upsert_site_subtask(
    parent_id: str,
    name: str,
    row: dict,
    tracked_start: dt.date,
    tracked_end: dt.date,
    subtask_index: dict,
    dry_run: bool,
) -> tuple[str, str | None]:
    """Create-or-update the Site Traffic subtask and set the six CFs.

    Returns (action, subtask_id). In dry-run the id is the existing subtask this
    write would land on, or None if it would create -- that is what makes
    "update, not duplicate" checkable before a backfill touches anything.
    """
    key = (parent_id, name)
    exists = key in subtask_index
    if dry_run:
        return ("would-update" if exists else "would-create", subtask_index.get(key))

    if exists:
        sub_id = subtask_index[key]
        # create_subtask() sets SUBTASK_STATUS on the create body, so only the
        # update path needs an explicit status PUT to normalize an existing
        # subtask that was written before this (list default was "hold").
        set_task_status(sub_id, SUBTASK_STATUS)
        action = "updated"
    else:
        sub_id = create_subtask(parent_id, name)
        subtask_index[key] = sub_id
        action = "created"

    set_custom_field(sub_id, CF_PAGE_VIEWS, row["pageviews"])
    set_custom_field(sub_id, CF_UNIQUE_VISITORS, row["unique_visitors"])
    set_custom_field(sub_id, CF_SESSIONS, row["sessions"])
    set_custom_field(sub_id, CF_INTERNAL_NAVS, row["internal_navs"])
    set_custom_field(sub_id, CF_TRACK_START, date_cf_ms(tracked_start))
    set_custom_field(sub_id, CF_TRACK_END, date_cf_ms(tracked_end))
    return (action, sub_id)


# ─── Post-write reconciliation guard ────────────────────────────────────
def reconcile_window(
    window_start: dt.date,
    window_end_excl: dt.date,
    name: str,
    written: dict,
    planned: int,
    pre_label_count: int,
    created: int,
) -> list[str]:
    """Verify a window's writes actually landed and still match PostHog.

    Three independent asserts, because "the numbers looked plausible" is how a
    half-written week gets mistaken for a complete one:

      1. Values -- re-query PostHog for the *same* window via fetch_window(), so
         the external-only filter and both statements are identical by
         construction rather than by copy, then compare against the values
         ClickUp has stored (read back, not the values we believe we sent).
      2. Write count -- every host row the writer decided to write must have
         produced exactly one recorded write. A silently dropped host is the
         failure mode this catches.
      3. Subtask count -- the number of subtasks carrying this week's date label
         must have moved by exactly the number we created, which catches a
         duplicate as well as a vanished subtask.

    Returns a list of human-readable failures; empty means the window is sound.
    """
    failures: list[str] = []

    rows, _ = fetch_window(window_start, window_end_excl)
    requeried = {r["host"]: r for r in rows}
    _, _, subtask_index, subtask_cf = fetch_sites_and_subtasks()

    if len(written) != planned:
        failures.append(
            f"write count: writer decided to write {planned} host row(s) but "
            f"recorded {len(written)} completed write(s)"
        )

    post_label_count = sum(1 for (_p, n) in subtask_index if n == name)
    expected_label_count = pre_label_count + created
    if post_label_count != expected_label_count:
        failures.append(
            f"subtask count: subtasks named '{name}' went {pre_label_count} -> "
            f"{post_label_count}, expected {expected_label_count} "
            f"({created} created this window)"
        )

    for host, w in sorted(written.items()):
        key = (w["parent_id"], name)
        sub_id = subtask_index.get(key)
        if sub_id is None:
            failures.append(
                f"{host}: no subtask '{name}' found under parent {w['parent_id']} after writing"
            )
            continue
        if sub_id != w["subtask_id"]:
            failures.append(
                f"{host}: subtask id changed under us — wrote {w['subtask_id']}, "
                f"re-read {sub_id}"
            )
        r2 = requeried.get(host)
        if r2 is None:
            failures.append(
                f"{host}: had a row at write time but is absent from the re-query"
            )
            continue
        stored_cfs = subtask_cf.get(key, {})
        for row_key, field_id, label in GUARD_FIELDS:
            stored = cf_int(stored_cfs, field_id)
            expected = int(r2[row_key] or 0)
            if stored != expected:
                failures.append(
                    f"{host} [{label}] subtask={sub_id}: written={stored} "
                    f"re-queried={expected}"
                )
    return failures


# ─── Main ───────────────────────────────────────────────────────────────
def parse_args(argv: list[str]) -> tuple[str | None, str | None, bool]:
    dry_run = "--dry-run" in argv
    positional = [a for a in argv[1:] if not a.startswith("-")]
    backfill = positional[0] if len(positional) > 0 else os.environ.get("BACKFILL_FROM") or None
    backfill_to = positional[1] if len(positional) > 1 else os.environ.get("BACKFILL_TO") or None
    if backfill is not None:
        backfill = backfill.strip() or None
    if backfill_to is not None:
        backfill_to = backfill_to.strip() or None
    return backfill, backfill_to, dry_run


def main() -> int:
    backfill_from, backfill_to, dry_run = parse_args(sys.argv)

    today = dt.date.today()
    latest_closed = most_recent_saturday(today)
    s_end = latest_closed
    if backfill_to:
        try:
            raw_to = dt.datetime.strptime(backfill_to, "%Y-%m-%d").date()
        except ValueError:
            print(f"ERROR: backfill_to '{backfill_to}' is not YYYY-MM-DD")
            return 1
        s_end = most_recent_saturday(raw_to)
        if s_end != raw_to:
            print(f"[note] backfill_to {raw_to} is not a Saturday; snapped to {s_end}")
        if s_end > latest_closed:
            print(
                f"ERROR: backfill_to {s_end} is past the most recent closed "
                f"Saturday {latest_closed}; refusing to write an open window"
            )
            return 1
    if backfill_from:
        try:
            raw = dt.datetime.strptime(backfill_from, "%Y-%m-%d").date()
        except ValueError:
            print(f"ERROR: backfill_from '{backfill_from}' is not YYYY-MM-DD")
            return 1
        s_start = most_recent_saturday(raw)
        if s_start != raw:
            print(f"[note] backfill_from {raw} is not a Saturday; snapped to {s_start}")
    else:
        s_start = s_end

    if s_start > s_end:
        print(f"ERROR: backfill start Saturday {s_start} is after most recent Saturday {s_end}")
        return 1

    weeks = week_windows(s_start, s_end)
    mode = "DRY-RUN" if dry_run else "LIVE"
    print(f"[{mode}] today={today} weeks={[w.isoformat() for w in weeks]} "
          f"({len(weeks)} window(s))")

    print("Fetching Sites roster + existing subtasks ...")
    roster, ambiguous, subtask_index, _subtask_cf = fetch_sites_and_subtasks()
    print(f"  roster: {len(roster)} site task(s); ambiguous names: {len(ambiguous)}; "
          f"existing subtasks indexed: {len(subtask_index)}")

    total_written = 0
    total_excluded = 0
    empty_weeks: list[str] = []
    skipped_hosts: set[str] = set()
    ambiguous_hits: set[str] = set()
    errors: list[str] = []
    guard_failures: list[str] = []

    for s in weeks:
        window_start = s - dt.timedelta(days=7)  # inclusive 00:00 UTC
        window_end_excl = s                       # exclusive 00:00 UTC
        tracked_start = window_start              # Traffic Tracked Start Date
        tracked_end = s - dt.timedelta(days=1)    # last full day counted
        name = f"Site Traffic [{s:%Y-%m-%d %A}]"
        # Counted before this window's writes so the guard can assert the
        # label's subtask count moved by exactly the number we created.
        pre_label_count = sum(1 for (_p, n) in subtask_index if n == name)

        print(f"\n=== Week ending {s} — window [{window_start} .. {window_end_excl}) "
              f"— '{name}' ===")
        rows, excluded_this_week = fetch_window(window_start, window_end_excl)
        total_excluded += excluded_this_week
        if not rows:
            print("  PostHog returned zero rows for all hosts — skipping (no writes).")
            empty_weeks.append(s.isoformat())
            continue

        planned = 0
        created = 0
        written: dict[str, dict] = {}

        for row in rows:
            host = row["host"]
            kind, detail = map_host_to_site(host, roster, ambiguous)
            label = (f"pv={row['pageviews']} uniq={row['unique_visitors']} "
                     f"sess={row['sessions']} navs={row['internal_navs']}")
            if kind == "ambiguous":
                ambiguous_hits.add(f"{host} -> {detail}")
                print(f"  AMBIGUOUS  {host}: normalizes to a name matching >1 site task "
                      f"({detail}) — skipping, not guessing.")
                continue
            if kind == "skip":
                skipped_hosts.add(host or "(empty host)")
                print(f"  skip       {host}  ({label})")
                continue
            planned += 1
            try:
                action, sub_id = upsert_site_subtask(
                    detail, name, row, tracked_start, tracked_end, subtask_index, dry_run
                )
                total_written += 1  # "planned" in dry-run, "written" when live
                if not dry_run:
                    if action == "created":
                        created += 1
                    written[host] = {"parent_id": detail, "subtask_id": sub_id, **row}
                sub_label = f" subtask={sub_id}" if sub_id else " subtask=(new)"
                print(f"  {action:<12} {host}  ({label})  parent={detail}{sub_label}")
            except Exception as e:  # noqa: BLE001 - keep going; one site must not abort the run
                errors.append(f"{s} {host}: {e}")
                print(f"  ERROR        {host}: {e}")

        if dry_run:
            continue

        print(f"  [guard] reconciling {len(written)} written host(s) "
              f"against a PostHog re-query ...")
        failures = reconcile_window(
            window_start, window_end_excl, name, written, planned, pre_label_count, created
        )
        if failures:
            print(f"  [guard] FAILED for week ending {s}:")
            for f in failures:
                print(f"    - {f}")
            guard_failures.extend(f"{s}: {f}" for f in failures)
            print("  [guard] halting — remaining windows will not be processed.")
            break
        print(f"  [guard] OK — {len(written)} host(s) reconciled; subtasks named "
              f"'{name}': {pre_label_count} -> {pre_label_count + created}")

    print("\n──────────────────────────────────────────────")
    print(f"weeks processed : {[w.isoformat() for w in weeks]}")
    print(f"empty weeks     : {empty_weeks or 'none'}")
    print(f"site subtasks {'planned' if dry_run else 'written'}: {total_written}")
    print(f"hosts skipped   : {sorted(skipped_hosts) or 'none'}")
    print(f"ambiguous hosts : {sorted(ambiguous_hits) or 'none'}")
    print(f"internal pageviews excluded: {total_excluded}")
    print(f"errors          : {errors or 'none'}")
    print(f"guard failures  : {guard_failures or 'none'}")

    if total_excluded == 0:
        print(
            "\n[WARN] The internal-traffic filter matched zero pageviews across "
            "every window. Either the Owner genuinely did not browse any tracked "
            "site, or the Owner's IP allocation has moved and the reported "
            "figures are re-inflated. Verify INTERNAL_IPV4 / INTERNAL_IPV6_PREFIX "
            "against a recent $pageview before trusting this run."
        )

    if not dry_run:
        skipped_str = ", ".join(sorted(skipped_hosts)) if skipped_hosts else "none"
        summary = (
            f"Weekly PostHog -> Sites subtasks · "
            f"weeks {weeks[0].isoformat()}..{weeks[-1].isoformat()} ({len(weeks)} window(s)) · "
            f"{total_written} site-subtask(s) upserted · "
            f"{total_excluded} internal pageview(s) excluded · "
            f"{len(empty_weeks)} empty week(s) · "
            f"{len(skipped_hosts)} host(s) skipped: {skipped_str}"
        )
        if errors:
            summary += f" · {len(errors)} ERROR(s)"
        if guard_failures:
            summary += f" · {len(guard_failures)} RECONCILIATION FAILURE(s) — run halted"
        try:
            post_run_summary(summary)
            print(f"\nPosted run-summary comment to {RUN_SUMMARY_TASK_ID}.")
        except Exception as e:  # noqa: BLE001 - comment is best-effort audit trail
            print(f"\n[warn] failed to post run-summary comment: {e}")

    return 1 if (errors or guard_failures) else 0


if __name__ == "__main__":
    sys.exit(main())
