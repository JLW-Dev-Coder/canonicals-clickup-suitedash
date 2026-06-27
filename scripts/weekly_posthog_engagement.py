"""
Weekly PostHog cross-site engagement check.

Runs Saturdays at 14:00 UTC via GitHub Actions. Pulls 7-day PostHog
pageview/engagement data, updates ClickUp task 86e2285zc in place by
replacing the "Latest report" and "Prior week" sections of its description,
posts a comment with the full report (permanent archive), and closes the
task to trigger ClickUp's recurrence (which re-opens the same task ID).

Environment variables required:
  POSTHOG_API_KEY        Personal API key with project:read scope
  POSTHOG_PROJECT_ID     Numeric project ID
  POSTHOG_HOST           e.g. https://us.posthog.com (no trailing slash)
  CLICKUP_API_TOKEN      Personal API token
"""

import os
import sys
import json
import datetime as dt
from typing import Any
import urllib.request
import urllib.error

# Encoding guard (Windows cp1252 default would crash on em-dashes, arrows, etc.)
# GHA Ubuntu runners default to UTF-8 but keep this guard for local dev runs.
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# ─── Canonical constants ────────────────────────────────────────────────
RECURRING_TASK_ID = "86e2285zc"
MARKETING_WORKING_FILE_LIST_ID = "33654399"  # for reference; not used here

# Anchor strings — must match the task description exactly.
ANCHOR_LATEST = "## Latest report (overwritten weekly by script)"
ANCHOR_PRIOR = "## Prior week (overwritten weekly by script — used for delta calc)"

CLOSED_STATUS = "Closed"

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


def http_put(url: str, headers: dict, body: dict) -> dict:
    return _http("PUT", url, headers, body)


def http_get(url: str, headers: dict) -> dict:
    return _http("GET", url, headers)


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


def fetch_window(start: dt.date, end: dt.date) -> dict[str, list[dict]]:
    start_str = start.isoformat()
    end_str = end.isoformat()
    totals_q = f"""
    SELECT properties.$host AS host,
           count() AS pageviews,
           count(DISTINCT distinct_id) AS unique_visitors,
           count(DISTINCT properties.$session_id) AS sessions
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= '{start_str} 00:00:00'
      AND timestamp <  '{end_str} 00:00:00'
    GROUP BY host
    ORDER BY pageviews DESC
    LIMIT 100
    """
    navs_q = f"""
    SELECT properties.$host AS host,
           count() AS internal_navs
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= '{start_str} 00:00:00'
      AND timestamp <  '{end_str} 00:00:00'
      AND properties.$prev_pageview_pathname IS NOT NULL
    GROUP BY host
    ORDER BY internal_navs DESC
    LIMIT 100
    """
    utm_q = f"""
    SELECT properties.$host AS host,
           properties.utm_source AS utm_source,
           count() AS pageviews,
           count(DISTINCT distinct_id) AS unique_visitors
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= '{start_str} 00:00:00'
      AND timestamp <  '{end_str} 00:00:00'
    GROUP BY host, utm_source
    ORDER BY pageviews DESC
    LIMIT 100
    """
    return {
        "totals": run_hogql(totals_q),
        "navs": run_hogql(navs_q),
        "utm": run_hogql(utm_q),
    }


# ─── ClickUp ────────────────────────────────────────────────────────────
CLICKUP_BASE = "https://api.clickup.com/api/v2"
CLICKUP_HEADERS = {
    "Authorization": CLICKUP_API_TOKEN,
    "Content-Type": "application/json",
}


def get_task(task_id: str) -> dict:
    return http_get(f"{CLICKUP_BASE}/task/{task_id}?include_markdown_description=true", CLICKUP_HEADERS)


def update_task_description(task_id: str, new_markdown: str) -> dict:
    return http_put(
        f"{CLICKUP_BASE}/task/{task_id}",
        CLICKUP_HEADERS,
        {"markdown_description": new_markdown},
    )


def update_task_status(task_id: str, status: str) -> dict:
    return http_put(
        f"{CLICKUP_BASE}/task/{task_id}",
        CLICKUP_HEADERS,
        {"status": status},
    )


def post_task_comment(task_id: str, markdown: str) -> dict:
    # ClickUp's comment endpoint expects comment_text; markdown is preserved.
    return http_post(
        f"{CLICKUP_BASE}/task/{task_id}/comment",
        CLICKUP_HEADERS,
        {"comment_text": markdown, "notify_all": False},
    )


# ─── Composition ────────────────────────────────────────────────────────
def compose_engagement_table(data: dict[str, list[dict]]) -> str:
    navs_by_host = {row["host"]: row["internal_navs"] for row in data["navs"]}
    lines = [
        "| Host | Pageviews | Unique visitors | Sessions | Pages/session | Internal navs | Engagement rate |",
        "|---|---|---|---|---|---|---|",
    ]
    for row in data["totals"]:
        host = row["host"] or "(unknown)"
        pv = row["pageviews"]
        uv = row["unique_visitors"]
        sess = row["sessions"]
        navs = navs_by_host.get(row["host"], 0)
        pages_per_sess = f"{pv / sess:.2f}" if sess else "—"
        eng_rate = f"~{round(100 * navs / pv)}%" if pv else "—"
        lines.append(
            f"| {host} | {pv} | {uv} | {sess} | {pages_per_sess} | {navs} | {eng_rate} |"
        )
    return "\n".join(lines)


def compose_utm_table(data: dict[str, list[dict]]) -> str:
    tagged = [r for r in data["utm"] if r.get("utm_source")]
    if not tagged:
        return "_No UTM-tagged sources this week._"
    lines = [
        "| Host | Source | Pageviews | Visitors |",
        "|---|---|---|---|",
    ]
    for r in tagged:
        lines.append(
            f"| {r['host']} | {r['utm_source']} | {r['pageviews']} | {r['unique_visitors']} |"
        )
    return "\n".join(lines)


def compute_deltas(current: dict, prior: dict | None) -> str:
    if prior is None:
        return "_First automated run — no prior week parseable from description._"
    cur_by_host = {r["host"]: r for r in current["totals"]}
    prev_by_host = {r["host"]: r for r in prior["totals"]}
    cur_navs = {r["host"]: r["internal_navs"] for r in current["navs"]}
    prev_navs = {r["host"]: r["internal_navs"] for r in prior["navs"]}
    all_hosts = sorted(set(cur_by_host) | set(prev_by_host))
    bullets = []
    for host in all_hosts:
        cur = cur_by_host.get(host, {"pageviews": 0, "unique_visitors": 0})
        prv = prev_by_host.get(host, {"pageviews": 0, "unique_visitors": 0})
        dpv = cur["pageviews"] - prv["pageviews"]
        duv = cur["unique_visitors"] - prv["unique_visitors"]
        cpv, cnv = cur["pageviews"], cur_navs.get(host, 0)
        ppv, pnv = prv["pageviews"], prev_navs.get(host, 0)
        cer = (cnv / cpv) if cpv else 0
        per = (pnv / ppv) if ppv else 0
        der = cer - per
        if abs(dpv) >= 10 or abs(duv) >= 5 or abs(der) >= 0.10:
            arrow_pv = "↑" if dpv > 0 else "↓" if dpv < 0 else "→"
            arrow_er = "↑" if der > 0 else "↓" if der < 0 else "→"
            bullets.append(
                f"- **{host}**: pageviews {arrow_pv}{abs(dpv)} "
                f"(visitors {duv:+d}), engagement rate {arrow_er} "
                f"{abs(der)*100:.0f}pp ({per*100:.0f}% → {cer*100:.0f}%)"
            )
    return "\n".join(bullets) if bullets else "_No host moved meaningfully week-over-week._"


def compose_report_body(
    window_start: dt.date,
    window_end: dt.date,
    current: dict,
    deltas_md: str,
) -> str:
    """The shared body used for both the description section AND the archive comment."""
    return (
        f"_Window: {window_start.isoformat()} → {window_end.isoformat()} (7 days, UTC)_\n\n"
        f"### Engagement\n\n{compose_engagement_table(current)}\n\n"
        f"### UTM-tagged sources\n\n{compose_utm_table(current)}\n\n"
        f"### Week-over-week deltas\n\n{deltas_md}\n"
    )


# ─── Description section manipulation ───────────────────────────────────
def split_description(desc: str) -> tuple[str, str, str]:
    """
    Splits the description into (spec_section, latest_section, prior_section).
    Spec is everything before ANCHOR_LATEST.
    Latest is from ANCHOR_LATEST up to (but not including) ANCHOR_PRIOR.
    Prior is from ANCHOR_PRIOR to end of string.

    Raises ValueError if anchors not found — caller should treat as fatal.
    """
    i_latest = desc.find(ANCHOR_LATEST)
    i_prior = desc.find(ANCHOR_PRIOR)
    if i_latest < 0 or i_prior < 0 or i_prior < i_latest:
        raise ValueError(
            f"Description anchors not found or out of order. "
            f"Latest idx={i_latest}, Prior idx={i_prior}"
        )
    spec = desc[:i_latest].rstrip() + "\n\n"
    latest = desc[i_latest:i_prior].rstrip() + "\n\n"
    prior = desc[i_prior:].rstrip() + "\n"
    return spec, latest, prior


def extract_report_body(section: str) -> str:
    """
    Given a 'Latest report' or 'Prior week' section (starting with its anchor),
    return everything after the anchor line, stripped.
    """
    lines = section.splitlines()
    if not lines:
        return ""
    # Drop the anchor line itself
    return "\n".join(lines[1:]).strip()


def parse_prior_from_body(body: str) -> dict | None:
    """
    Parse the engagement table out of a report body. Returns dict with
    'totals' and 'navs' arrays, or None if unparseable.
    """
    if not body or body.startswith("_No report yet") or body.startswith("_First automated run"):
        return None
    lines = body.splitlines()
    in_table = False
    table_rows = []
    for line in lines:
        if line.startswith("| Host |"):
            in_table = True
            continue
        if in_table and line.startswith("|---"):
            continue
        if in_table:
            if not line.strip().startswith("|"):
                break
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 6:
                table_rows.append(cells)
    if not table_rows:
        return None
    totals, navs = [], []
    for row in table_rows:
        try:
            host = row[0]
            pv = int(row[1])
            uv = int(row[2])
            sess = int(row[3])
            nav_count = int(row[5])
        except (ValueError, IndexError):
            continue
        totals.append({"host": host, "pageviews": pv, "unique_visitors": uv, "sessions": sess})
        navs.append({"host": host, "internal_navs": nav_count})
    return {"totals": totals, "navs": navs} if totals else None


# ─── Main ───────────────────────────────────────────────────────────────
def main() -> int:
    # 7-day window: today (exclusive upper bound) minus 7 days
    today = dt.date.today()
    window_end = today
    window_start = window_end - dt.timedelta(days=7)
    date_label = window_end.isoformat()

    print(f"[1/6] Fetching task {RECURRING_TASK_ID}")
    task = get_task(RECURRING_TASK_ID)
    desc = task.get("markdown_description") or task.get("description") or ""
    if not desc:
        print("ERROR: task has empty description")
        return 1

    print("[2/6] Splitting description by anchors")
    try:
        spec, latest_section, prior_section = split_description(desc)
    except ValueError as e:
        print(f"ERROR: {e}")
        print("Description must contain both anchor headers. Aborting.")
        return 1

    print("[3/6] Parsing prior week from current 'Latest report' section")
    prior_body = extract_report_body(latest_section)
    prior_data = parse_prior_from_body(prior_body)

    print(f"[4/6] Pulling PostHog data for {window_start} → {window_end}")
    current = fetch_window(window_start, window_end)

    deltas_md = compute_deltas(current, prior_data)
    new_body = compose_report_body(window_start, window_end, current, deltas_md)

    new_latest_section = (
        f"{ANCHOR_LATEST}\n\n"
        f"_Generated {dt.datetime.utcnow().isoformat()}Z — week ending {date_label}_\n\n"
        f"{new_body}"
    )
    # Prior week section gets the OLD latest body (without the anchor line).
    new_prior_body = prior_body if prior_body else "_No prior week data parseable yet._"
    new_prior_section = (
        f"{ANCHOR_PRIOR}\n\n"
        f"_Rolled forward from prior week's 'Latest report' on {dt.datetime.utcnow().isoformat()}Z_\n\n"
        f"{new_prior_body}\n"
    )
    new_desc = spec + new_latest_section.rstrip() + "\n\n" + new_prior_section

    print("[5/6] Updating task description")
    update_task_description(RECURRING_TASK_ID, new_desc)

    comment_md = (
        f"## Weekly engagement report — week ending {date_label}\n\n"
        f"{new_body}\n"
        f"_Spec: see task description_"
    )
    print("[6/6] Posting archive comment + closing task")
    post_task_comment(RECURRING_TASK_ID, comment_md)
    update_task_status(RECURRING_TASK_ID, CLOSED_STATUS)

    print(f"Done. Task closed; ClickUp will recur per task's recurrence rule.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
