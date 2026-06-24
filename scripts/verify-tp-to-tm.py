#!/usr/bin/env python3
"""
Verify the TP -> TM mirror produced by mirror-tp-to-tm.py.

Read-only. Fetches each pair from the idmap, diffs name/description/
checklists/custom-fields/child-count, writes a JSON report.

Usage:
    $env:PYTHONUTF8 = "1"
    $env:CLICKUP_API_TOKEN = "pk_..."
    python scripts/verify-tp-to-tm.py
"""
import json
import os
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

IDMAP_PATH = Path(__file__).parent / "mirror-tp-to-tm.idmap.json"
REPORT_PATH = Path(__file__).parent / "verify-tp-to-tm.report.json"


def rewrite(text: str | None) -> str | None:
    """MUST match mirror-tp-to-tm.py rewrite() exactly."""
    if not text:
        return text
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


def get_task(task_id: str) -> dict:
    r = requests.get(
        f"{API}/task/{task_id}",
        headers=HEADERS,
        params={"include_subtasks": "true"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def normalize_cf(cf_list: list[dict]) -> dict[str, Any]:
    """Build {field_id: normalized_value} for non-empty fields.
    Dropdown: store option ID (resolved from index).
    Labels: store sorted list of option IDs.
    Other: store value verbatim.
    """
    out = {}
    for cf in cf_list or []:
        val = cf.get("value")
        if val is None or val == "":
            continue
        if isinstance(val, list) and len(val) == 0:
            continue
        ftype = cf.get("type")
        if ftype == "drop_down":
            opts = cf.get("type_config", {}).get("options", [])
            try:
                idx = int(val)
                out[cf["id"]] = opts[idx]["id"]
            except (ValueError, IndexError, KeyError):
                out[cf["id"]] = f"<unresolved:{val}>"
        elif ftype == "labels":
            out[cf["id"]] = sorted(val) if isinstance(val, list) else val
        else:
            out[cf["id"]] = val
    return out


def normalize_checklists(cls: list[dict]) -> list[dict]:
    """Return list of {name, items: [item_name, ...]} in source order."""
    return [
        {
            "name": cl.get("name", ""),
            "items": [item.get("name", "") for item in (cl.get("items") or [])],
        }
        for cl in (cls or [])
    ]


def child_count(task: dict) -> int:
    return len(task.get("subtasks") or [])


def diff_pair(tp_id: str, tm_id: str) -> dict:
    """Return a dict of mismatches for this pair. Empty dict = clean."""
    mismatches: dict[str, Any] = {}

    try:
        tp = get_task(tp_id)
    except Exception as e:
        return {"fatal": f"failed to fetch TP {tp_id}: {e}"}
    try:
        tm = get_task(tm_id)
    except Exception as e:
        return {"fatal": f"failed to fetch TM {tm_id}: {e}"}

    # Name
    expected_name = rewrite(tp.get("name") or "")
    actual_name = tm.get("name") or ""
    if expected_name != actual_name:
        mismatches["name"] = {"expected": expected_name, "actual": actual_name}

    # Description
    expected_desc = rewrite(tp.get("description") or "") or ""
    actual_desc = tm.get("description") or ""
    if expected_desc.strip() != actual_desc.strip():
        mismatches["description"] = {
            "expected_len": len(expected_desc),
            "actual_len": len(actual_desc),
            "expected_head": expected_desc[:200],
            "actual_head": actual_desc[:200],
        }

    # Checklists
    tp_cls = normalize_checklists(tp.get("checklists") or [])
    tm_cls = normalize_checklists(tm.get("checklists") or [])
    expected_cls = [
        {"name": rewrite(c["name"]), "items": [rewrite(i) for i in c["items"]]}
        for c in tp_cls
    ]
    if expected_cls != tm_cls:
        mismatches["checklists"] = {
            "expected_count": len(expected_cls),
            "actual_count": len(tm_cls),
            "expected": expected_cls,
            "actual": tm_cls,
        }

    # Custom fields — only check fields present on both
    tp_cf = normalize_cf(tp.get("custom_fields") or [])
    tm_cf = normalize_cf(tm.get("custom_fields") or [])
    shared_ids = set(tp_cf.keys()) & set(tm_cf.keys())
    cf_diffs = {}
    for fid in shared_ids:
        if tp_cf[fid] != tm_cf[fid]:
            cf_diffs[fid] = {"expected": tp_cf[fid], "actual": tm_cf[fid]}
    # Also flag TP-only non-empty fields (might mean the mirror dropped them)
    tp_only = set(tp_cf.keys()) - set(tm_cf.keys())
    if tp_only:
        cf_diffs["_tp_only_fields"] = sorted(tp_only)
    if cf_diffs:
        mismatches["custom_fields"] = cf_diffs

    # Child count — TM must be >= TP (additive preserves pre-existing TM children)
    tp_kids = child_count(tp)
    tm_kids = child_count(tm)
    if tm_kids < tp_kids:
        mismatches["child_count"] = {"tp": tp_kids, "tm": tm_kids, "issue": "TM has fewer children than TP"}

    return mismatches


def main() -> None:
    if not IDMAP_PATH.exists():
        sys.exit(f"ERROR: {IDMAP_PATH} not found")
    idmap = json.loads(IDMAP_PATH.read_text())
    print(f"Loaded {len(idmap)} pairs from idmap")

    pairs = list(idmap.items())
    report = {
        "total_pairs": len(pairs),
        "clean": 0,
        "mismatched": 0,
        "fatal": 0,
        "mismatches": {},
    }

    for i, (tp_id, tm_id) in enumerate(pairs, 1):
        if i % 20 == 0 or i == len(pairs):
            print(f"  [{i}/{len(pairs)}] checking {tp_id} -> {tm_id}")
        result = diff_pair(tp_id, tm_id)
        if not result:
            report["clean"] += 1
        elif "fatal" in result:
            report["fatal"] += 1
            report["mismatches"][f"{tp_id}->{tm_id}"] = result
        else:
            report["mismatched"] += 1
            report["mismatches"][f"{tp_id}->{tm_id}"] = result
        time.sleep(0.1)  # gentle rate limit

    REPORT_PATH.write_text(json.dumps(report, indent=2, sort_keys=True, ensure_ascii=False))

    print()
    print("=" * 60)
    print(f"Total pairs:    {report['total_pairs']}")
    print(f"Clean:          {report['clean']}")
    print(f"Mismatched:     {report['mismatched']}")
    print(f"Fatal (fetch):  {report['fatal']}")
    print("=" * 60)
    print(f"Report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
