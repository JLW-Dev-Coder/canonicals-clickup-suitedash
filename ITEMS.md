---
slug: ITEMS
module_type: meta-inventory
sd_item_id: null
platform: meta
cu_page_id: REPLACE_WITH_CU_PAGE_ID_FOR_ITEMS_DOC
cu_url: REPLACE
cu_parent_page_id: REPLACE
cu_path: "(Inventory B doc page inside the CU list 901707259094)"
last_synced: 2026-05-08
last_editor: JLW
status: live
---

# ITEMS.md — Item-Specific Module Inventory (Inventory B)

**Question this answers:** For this specific item, which modules have been instantiated and where do they live?

**Source of truth:** This file (repo). Synced to CU as a doc page inside the list at [https://app.clickup.com/8402511/v/li/901707259094](https://app.clickup.com/8402511/v/li/901707259094).

**Governing canonical:** [`vlp-platform/.claude/canonicals/canonical-cu-sd-sync.md`](../vlp-platform/.claude/canonicals/canonical-cu-sd-sync.md) §11.2

**Sync direction:** Repo → CU on every update. Push via `npm run sync:cu -- push ITEMS`.

---

## Status legend

- ✅ **live** — repo file exists, pushed to CU, deployed in SD
- 📝 **draft** — repo file exists with TODOs, not yet in SD
- 🔵 **stub** — CU page exists but no repo file yet (legacy / pre-system)
- ⬜ **not started** — neither CU nor repo for this item × module
- 🚫 **n/a** — module doesn't apply to this item

---

## Item 29355 — Tax Prep Pro (platform: tpp)

### Deal branch — Stacks

| Stack | CSS | JS | SD stack name | SD pages consuming | Notes |
|-------|-----|-----|---------------|---------------------|-------|
| `29355_Stacks_LMS` | 🔵 | 🔵 | (TBD) | (TBD) | CU pages exist; repo files not yet created |
| `29355_Stacks_Pages` | 🔵 | 🔵 | `29355_Stacks_All_Pages_CSS_JS` | `/i/tax-prep-pro-showcase` | CU pages exist; repo files seeded as placeholders, awaiting first `npm run sync:cu -- pull` |

### Order branch — M-series

| # | Module | Status | Repo path | CU page |
|---|--------|--------|-----------|---------|
| M001 | Appointments | 🔵 | — | (link in CU) |
| M002 | Auto-Templates | 🔵 | — | (link in CU) |
| M003 | Business Sectors | 🔵 | — | (link in CU) |
| M004 | Circles | 🔵 | — | (link in CU) |
| M005 | Content Categories | 🔵 | — | (link in CU) |
| M006 | Custom Fields | 🔵 | — | (link in CU) |
| M007 | Dashes | 🔵 | — | (link in CU) |
| M008 | Document Generators | 🔵 | — | (link in CU) |
| M009 | Drip Sequences | 🔵 | — | (link in CU) |
| M010 | Marketing Audience | 🔵 | — | (link in CU) |
| M011 | Flows | 🔵 | — | (link in CU) |
| M012 | Forms | 🔵 | — | (link in CU) |
| M013 | Invoice Items | 🔵 | — | (link in CU) |
| M014 | Landing Pages | 🔵 | — | (link in CU) |
| M015 | Menus | 🔵 | — | (link in CU) |
| M016 | Platform Branding | 🔵 | — | (link in CU) |
| M017 | Portal Pages | 🔵 | — | (link in CU) |
| M018 | Projects | 🔵 | — | (link in CU) |
| M019 | Proposals | 🔵 | — | (link in CU) |
| M020 | Tasks | 🔵 | — | (link in CU) |
| M021 | LMS (shell) | 🔵 | — | (link in CU) |

### Order branch — LMS Courses (under M021)

| LMS # | Title | Track | Status | Repo path | CU page |
|---|---|---|---|---|---|
| 1 | Tax Prep Pro Setup Guide — How We Configured Your SuiteDash | Provider | 🔵 | `canonicals/tpp/29355/order/m021-lms/lms-1-course.md` (placeholder) | [80djf-707897](https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-707897) |

---

## How to update this file

**Automatic** (RC handles via `cu-create.ts`):
- New row added when `npm run cu:create` succeeds (currently logged as a manual prompt; structured-text auto-edit deferred)

**Manual** (Owner edits directly):
- Status changes (e.g., 🔵 stub → ✅ live after capturing a legacy module)
- Adding new platform/item sections
- Marking modules as 🚫 n/a

After any manual edit, run `npm run sync:cu -- push ITEMS`.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-05-08 | Initial inventory. Item 29355 seeded with all M-modules + 2 stacks + LMS 1 course. All marked 🔵 stub pending repo capture. Bonus removed per Owner. | JLW |
