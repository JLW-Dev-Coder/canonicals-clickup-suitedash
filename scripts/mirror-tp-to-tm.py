#!/usr/bin/env python3
"""
Mirror Tax Prep deal-phase subtask trees into Tax Monitor.

Reads each source TP phase task, walks its subtree, creates matching tasks
under the corresponding TM phase. Idempotent via id-map JSON.

Usage:
    $env:CLICKUP_API_TOKEN = "pk_..."
    python scripts/mirror-tp-to-tm.py [--dry-run]
"""
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

import requests

API = "https://api.clickup.com/api/v2"
TOKEN = os.environ.get("CLICKUP_API_TOKEN")
if not TOKEN:
    sys.exit("ERROR: CLICKUP_API_TOKEN not set")

HEADERS = {"Authorization": TOKEN, "Content-Type": "application/json"}

# Source (TP) -> Target (TM) phase root task IDs
PHASE_PAIRS = [
    ("86e17nh4x", "86dzm3e0x"),  # Phase 1 — Lead Capture & Intake
    ("86e17nh4z", "86dzm3e11"),  # Phase 2 — Qualify & Segment
    ("86e17nh51", "86dzm3e15"),  # Phase 3 — Prospect Demo Call (TM renamed in chat)
    ("86e17nh52", "86dzm3e1e"),  # Phase 4 — Offer & Close
    ("86e17nh53", "86dzm3e1n"),  # Phase 5 — Client Onboarding & Setup
    ("86e17nh55", "86dzm3e1u"),  # Phase 6 — Early Wins & Results
    ("86e17nh57", "86dzm3e1w"),  # Phase 7 — Upsell, Referral & Testimonial
]

TM_LIST_ID = "901709298927"  # Tax Monitor Setup list

IDMAP_PATH = Path(__file__).parent / "mirror-tp-to-tm.idmap.json"
DRY_RUN = "--dry-run" in sys.argv


def load_idmap() -> dict[str, str]:
    if IDMAP_PATH.exists():
        return json.loads(IDMAP_PATH.read_text())
    return {}


def save_idmap(m: dict[str, str]) -> None:
    # Never persist during a dry run: in --dry-run, api_post returns fake
    # "DRY-<ts>" ids. If those were written to the idmap, the subsequent live
    # run would load them and skip every source task (creating nothing).
    if DRY_RUN:
        return
    IDMAP_PATH.write_text(json.dumps(m, indent=2, sort_keys=True))


def rewrite(text: str | None) -> str | None:
    """Apply Tax Prep -> Tax Monitor string substitutions."""
    if not text:
        return text
    # Order matters: longest match first
    subs = [
        ("Tax Prep Pro", "Tax Monitor Pro"),
        ("tax prep pro", "tax monitor pro"),
        ("TPP", "TMP"),
        ("Tax Prep", "Tax Monitor"),
        ("tax prep", "tax monitor"),
    ]
    for old, new in subs:
        text = text.replace(old, new)
    return text


def api_get(path: str, params: dict | None = None) -> dict:
    r = requests.get(f"{API}{path}", headers=HEADERS, params=params or {}, timeout=30)
    r.raise_for_status()
    return r.json()


def api_post(path: str, body: dict, params: dict | None = None) -> dict:
    if DRY_RUN:
        print(f"  [DRY] POST {path} name={body.get('name','?')[:60]}")
        return {"id": f"DRY-{int(time.time()*1000)}"}
    r = requests.post(f"{API}{path}", headers=HEADERS, json=body, params=params or {}, timeout=30)
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text}")
        r.raise_for_status()
    return r.json()


def get_task(task_id: str) -> dict:
    return api_get(f"/task/{task_id}", params={"include_subtasks": "true"})


def get_checklists(task_id: str) -> list[dict]:
    """Checklists come back in get_task response, but items need separate calls in some API versions.
    The v2 task endpoint includes checklists with items by default."""
    data = api_get(f"/task/{task_id}")
    return data.get("checklists", [])


def list_subtask_ids(task: dict) -> list[str]:
    """Return direct-child subtask IDs in source order."""
    return [s["id"] for s in (task.get("subtasks") or [])]


def build_custom_fields(source_task: dict) -> list[dict]:
    """Copy custom field values from source. ClickUp will accept any field IDs
    that exist on the target list; mismatched fields are silently ignored by the API,
    but we filter for safety."""
    out = []
    for cf in source_task.get("custom_fields", []):
        val = cf.get("value")
        if val is None or val == "":
            continue
        # Skip empty arrays
        if isinstance(val, list) and len(val) == 0:
            continue
        # For dropdown, value is the option index; need the option ID
        if cf.get("type") == "drop_down":
            opts = cf.get("type_config", {}).get("options", [])
            try:
                idx = int(val)
                opt_id = opts[idx]["id"]
                out.append({"id": cf["id"], "value": opt_id})
            except (ValueError, IndexError, KeyError):
                continue
        elif cf.get("type") == "labels":
            # value is a list of option IDs already
            out.append({"id": cf["id"], "value": val})
        else:
            out.append({"id": cf["id"], "value": val})
    return out


def create_mirror(source_task: dict, parent_id: str, list_id: str) -> str:
    name = rewrite(source_task["name"])
    description = rewrite(source_task.get("description") or "")

    body: dict[str, Any] = {
        "name": name,
        "parent": parent_id,
    }
    if description:
        body["markdown_description"] = description

    cfs = build_custom_fields(source_task)
    if cfs:
        body["custom_fields"] = cfs

    # Preserve task_type if it's the "Journey" custom type
    custom_item_id = source_task.get("custom_item_id")
    if custom_item_id:
        body["custom_item_id"] = custom_item_id

    print(f"  Creating: {name[:70]}")
    resp = api_post(f"/list/{list_id}/task", body)
    new_id = resp["id"]

    # Copy checklists
    for cl in source_task.get("checklists", []):
        cl_name = rewrite(cl.get("name", ""))
        if not DRY_RUN:
            cl_resp = api_post(f"/task/{new_id}/checklist", {"name": cl_name})
            cl_id = cl_resp.get("checklist", {}).get("id") or cl_resp.get("id")
            for item in cl.get("items", []):
                item_name = rewrite(item.get("name", ""))
                api_post(f"/checklist/{cl_id}/checklist_item", {"name": item_name})
        else:
            print(f"    [DRY] checklist: {cl_name}")

    return new_id


def walk(source_id: str, target_parent_id: str, idmap: dict[str, str], depth: int = 0) -> None:
    indent = "  " * depth

    # Skip if already mirrored
    if source_id in idmap:
        print(f"{indent}SKIP (already mapped): {source_id} -> {idmap[source_id]}")
        new_parent_id = idmap[source_id]
    else:
        print(f"{indent}Fetching source {source_id}")
        source_task = get_task(source_id)
        new_parent_id = create_mirror(source_task, target_parent_id, TM_LIST_ID)
        idmap[source_id] = new_parent_id
        save_idmap(idmap)
        time.sleep(0.1)  # gentle rate limit

    # Recurse into source children
    source_task = get_task(source_id)
    for child_id in list_subtask_ids(source_task):
        walk(child_id, new_parent_id, idmap, depth + 1)


def main() -> None:
    idmap = load_idmap()
    print(f"Loaded idmap with {len(idmap)} existing entries")
    if DRY_RUN:
        print("=== DRY RUN — no writes ===")

    for tp_phase_id, tm_phase_id in PHASE_PAIRS:
        print(f"\n=== Phase: TP {tp_phase_id} -> TM {tm_phase_id} ===")
        # Don't mirror the phase root itself — it already exists in TM.
        # Just walk its children into the TM phase as parent.
        source_phase = get_task(tp_phase_id)
        for child_id in list_subtask_ids(source_phase):
            walk(child_id, tm_phase_id, idmap)

    print(f"\nDone. Final idmap: {len(idmap)} entries written to {IDMAP_PATH}")


if __name__ == "__main__":
    main()
