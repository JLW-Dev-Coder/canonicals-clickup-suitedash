<!--
Status: Authoritative
Last updated: 2026-06-17
Owner: JLW (Principal Engineer review required for changes)
Scope: ClickUp DOMSSS space list IDs + MCP connector usage notes
-->

# canonical-domsss-list-ids.md

Quick-reference IDs for the six DOMSSS spaces in the Lenore, Inc. ClickUp
workspace (`8402511`). Each space has two lists: an **Inbox** (intended for
incoming API-routed items — SMS, DMs, inbound email — for JLW or invited
operators to triage) and a **Working File** (active work for that
department).

PE consults this doc when directing task moves, filter queries, or creates
across DOMSSS without having to re-walk the workspace hierarchy.

---

## 1. Workspace

| Name | ID |
|------|----|
| Lenore, Inc. (Workspace root) | `8402511` |

---

## 2. DOMSSS spaces and lists

| Space | Space ID | List | List ID |
|-------|----------|------|---------|
| **D**evelopment | `90170949332` | Development Inbox | `901703483062` |
| **D**evelopment | `90170949332` | Development Working File | `901703483063` |
| **O**perations | `10506762` | Operations Inbox | `900602092933` |
| **O**perations | `10506762` | Operations Working File | `138236871` |
| **M**arketing | `90100202136` | Marketing Inbox | `901700025284` |
| **M**arketing | `90100202136` | Marketing Working File | `33654399` |
| **S**ales | `90100202140` | Sales Inbox | `901700009986` |
| **S**ales | `90100202140` | Sales Working File | `901001627856` |
| **S**ervices | `38463770` | Services Inbox | `901700050364` |
| **S**ervices | `38463770` | Services Working File | `901000824810` |
| **S**upport | `90100202144` | Support Inbox | `901700015249` |
| **S**upport | `90100202144` | Support Working File | `901001227858` |

Note: Operations uses legacy short-form IDs (`10506762`, `138236871`) from
an older workspace era. They're valid and current — don't "fix" them.

---

## 3. Intended usage of Inbox vs Working File

- **Inbox** — destination for incoming API-routed items: SMS replies, social
  DMs, inbound email triage tasks. Surface for JLW or invited operators
  (future) to claim and process. Not a planning surface.
- **Working File** — active department work. This is the surface that shows
  up in the Sales Working File / Marketing Working File / etc. List Views
  PE references in screenshots.

When PE says "move this to Marketing," default to **Marketing Working File**
unless PE explicitly says "Marketing Inbox."

---

## 4. ClickUp MCP connector — usage notes

Lessons learned operating the ClickUp MCP from chat and from Claude Code.
RC should read these before any task-move, doc-update, or filter-query
session.

### 4.1 Parameter quirks

- `clickup_get_document_pages` / `clickup_update_document_page` /
  `clickup_list_document_pages` / `clickup_create_document_page` take
  `document_id` + `page_id` only. **No `workspace_id` parameter** — calls
  succeed without it. Drafts that include `workspace_id` will fail or be
  silently ignored.
- `clickup_update_document_page` requires the **full page body** (whole-page
  replace, not a diff). Read first, edit in memory, write the full result.
- `clickup_move_task` takes `task_id` + `list_id` (destination). The task
  IDs are the short form (e.g. `86e1w03bk`), not the URL slug.
- `clickup_filter_tasks` with `list_ids: ["<id>"]` returns every task in
  that list with name, ID, status, priority, due date, and current list
  context. This is the fastest way to find task IDs by name.

### 4.2 Reliability patterns

- **Stale page IDs after manual reorgs.** If `not_found_or_authorized`
  fires on a doc page update, page IDs may have shifted from a manual
  ClickUp UI reorg. Re-run `clickup_list_document_pages` with
  `max_page_depth: -1` before retrying.
- **Rapid sequential `clickup_create_document_page` calls** on the same
  parent can silently produce duplicates. After a batch create, list the
  branch to verify count.
- **Whole-page replace, not diff.** When editing a page, always read the
  current content first — never assume the prior content from chat
  context. SuiteDash docs and ClickUp docs both get manually edited
  outside of MCP sessions.

### 4.3 Quick task-move recipe (Sales WF → Marketing WF example)

```text
1. clickup_filter_tasks { list_ids: ["901001627856"] }
   → returns all Sales Working File tasks with IDs
2. Identify target task IDs by name match
3. For each task: clickup_move_task { task_id: "<id>", list_id: "33654399" }
   → moves to Marketing Working File
4. Confirm by re-filtering destination list, or by chat screenshot
```

---

## 5. Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-06-17 | Created canonical with DOMSSS IDs + MCP notes | PE (Chat Claude) → RC commit |
