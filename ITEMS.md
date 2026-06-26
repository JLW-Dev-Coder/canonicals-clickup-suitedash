---
slug: ITEMS
body_type: meta-inventory
sd_item_id: null
platform: meta
cu_page_id: 80djf-708317
cu_url: 'https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-708317'
cu_parent_page_id: ''
cu_path: (Inventory B doc page at doc root inside CU list 901707259094)
last_synced: '2026-05-08'
last_editor: JLW
status: live
---

# ITEMS.md - Item-Specific Module Inventory (Inventory B)

**Question:** For this specific item, which modules have been instantiated and where do they live?

**Source of truth:** This file. Synced to CU as a doc page inside the list at https://app.clickup.com/8402511/v/li/901707259094.

**Sync direction:** Repo → CU on every update. Push via `npm run sync:cu -- push ITEMS`.

---

## Status legend

- ✅ live — repo file exists, pushed to CU, deployed in SD
- 📝 draft — repo file exists with TODOs, not yet in SD
- 🔵 stub — CU page exists but no repo file yet
- ⬜ not started — neither CU nor repo
- 🚫 n/a — module doesn't apply to this item

---

## Item 29355 — Tax Prep Pro (platform: tpp)

### Deal branch — Stacks

| Stack | CSS | JS | SD stack name | SD pages consuming | Notes |
|-------|-----|-----|---------------|---------------------|-------|
| `29355_Stacks_LMS` | 🔵 | 🔵 | (TBD) | (TBD) | CU page exists; repo files not yet created |
| `29355_Stacks_Pages` | ✅ | ✅ | `29355_Stacks_All_Pages_CSS_JS` | `/i/tax-prep-pro-showcase` | Live |

### Order branch — M-series

| # | Module | Status | Repo path | CU page |
|---|--------|--------|-----------|---------|
| M001 | Appointments | ✅ | `canonicals/tpp/29355/deal/appts/` (4 appts — see sub-table below) | [Item: 29355 – Appts](https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-700377) |
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

### Appointments (under M001)

The four Appointment Generators. CU parent `Item: 29355 – Appts` (80djf-700377) lives under the **Deal** branch (not the Order branch); canonicals mirror that location under `deal/appts/`. All four indicator colors `#f97316`, all assigned/notified to Staff – Super Admin.

| Appt | Generator name | Status | Repo path | CU page |
|---|---|---|---|---|
| Demo Appt | Tax Prep Setup — Demo | ✅ | `canonicals/tpp/29355/deal/appts/appt-tax-prep-setup-demo-appt.md` | https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-701657 |
| Discovery Appt | Tax Prep Setup — Digital Coffee | ✅ | `canonicals/tpp/29355/deal/appts/appt-tax-prep-setup-discovery-appt.md` | https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-701237 |
| Onboarding Support | Tax Prep Setup — Onboarding Support | ✅ | `canonicals/tpp/29355/deal/appts/appt-tax-prep-setup-onboarding-support.md` | https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-709617 |
| Exit/Offboarding Support | Tax Prep Setup — Exit/Offboarding Support | ✅ | `canonicals/tpp/29355/deal/appts/appt-tax-prep-setup-exit-offboarding-support.md` | https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-709777 |

### Order branch — LMS Courses (under M021)

| LMS # | Title | Track | Status | Repo path | CU page |
|---|---|---|---|---|---|
| 1 | Tax Prep Pro Setup Guide - How We Configured Your SuiteDash | Provider | ✅ | `canonicals/tpp/29355/order/m021-lms/lms-1-course.md` | https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-707897 |

---

## Item 29352 — Tax Monitor (platform: tmp)

> Tax Monitor Setup lives in a **separate CU doc** (`80djf-83557`) from Tax Prep (`80djf-83497`). Only **M001 Appointments** is tracked here so far — other modules (Stacks, LMS, M002–M021, etc.) are out of scope for this task and intentionally not seeded.

### Order branch — M-series

| # | Module | Status | Repo path | CU page |
|---|--------|--------|-----------|---------|
| M001 | Appointments | ✅ | `canonicals/tmp/29352/deal/appts/` (4 appts — see sub-table below) | [Item: 29352 – Appts](https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737317) |

### Appointments (under M001)

The four Appointment Generators, mirrored 1:1 from the TPP siblings with `Tax Prep → Tax Monitor` swapped (per JLW's mirror rule). CU parent `Item: 29352 – Appts` (80djf-737317) lives under the **Deal** branch (`Tax Monitor Setup – Deal`, 80djf-717277), mirroring the TPP convention. All four indicator colors `#f97316`, all assigned/notified to Staff – Super Admin. Icon reuses the shared TPP asset `Item: 29355 – JLW_200x200_head`. Calendar URLs + automation links are still TPP placeholders pending SD config — see [`notes/sd-appt-generator-config-tmp-mirror.md`](notes/sd-appt-generator-config-tmp-mirror.md). (✅ = repo + CU live; SD Appointment Generator config is the pending manual follow-up.)

| Appt | Generator name | Status | Repo path | CU page |
|---|---|---|---|---|
| Demo Appt | Tax Monitor Setup — Demo | ✅ | `canonicals/tmp/29352/deal/appts/appt-tax-monitor-setup-demo-appt.md` | https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737357 |
| Discovery Appt | Tax Monitor Setup — Digital Coffee | ✅ | `canonicals/tmp/29352/deal/appts/appt-tax-monitor-setup-discovery-appt.md` | https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737337 |
| Onboarding Support | Tax Monitor Setup — Onboarding Support | ✅ | `canonicals/tmp/29352/deal/appts/appt-tax-monitor-setup-onboarding-support.md` | https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737397 |
| Exit/Offboarding Support | Tax Monitor Setup — Exit/Offboarding Support | ✅ | `canonicals/tmp/29352/deal/appts/appt-tax-monitor-setup-exit-offboarding-support.md` | https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737377 |

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-05-08 | Initial inventory. Item 29355 seeded. | JLW |
| 2026-06-26 | M001 Appointments flipped 🔵 → ✅. Authored 4 appt canonicals under `deal/appts/` from live CU (Demo, Discovery, Onboarding Support, Exit/Offboarding Support). Added Appointments sub-table. CU parent `Item: 29355 – Appts` (80djf-700377) is under the Deal branch. | RC |
| 2026-06-26 | Seeded **Item 29352 — Tax Monitor** (platform: tmp, CU doc `80djf-83557`) with M001 Appointments ✅ + 4 appt sub-rows, mirrored 1:1 from the TPP siblings (`Tax Prep → Tax Monitor`). Only M001 seeded; other modules out of scope. ITEMS.md repo updated but **not** pushed to CU (Inventory B sync out of this task's scope). | RC |
