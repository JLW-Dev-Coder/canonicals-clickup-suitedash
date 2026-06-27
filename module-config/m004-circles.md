---
config_for: circle
last_updated: 2026-06-27
authored_by: RC
sd_modal_path: CRM → Circles → Circle → Edit (Reference Title, Description, CRM Targets, Status, Color)
source: Reverse-engineered from the 13 live TPP Circle CU pages on 2026-06-27 (the children of `Item: 29355 – Circles`, CU 80djf-700417, under the Deal branch). See "Provenance" below.
---

# Module Config — M004 Circles (`circle`)

Schema for a single SuiteDash **Circle** record. Each canonical instance (`body_type: circle`) mirrors one circle's configuration as it appears in the SD Circle editor, plus the two `circle/manageUsers/` admin URLs SuiteDash exposes (secure + app host).

## Provenance (reverse-engineered)

This schema was **reverse-engineered on 2026-06-27** from the **13 live TPP Circle CU pages** authored by JLW under `Item: 29355 – Circles` (CU `80djf-700417`, a child of the Deal branch `80djf-699817`):

**Phase circles (Deal pipeline, 7):**
- `Circle 1 — [29355] Deal Phase 1 — Lead Capture & Intake` (CU 80djf-700437)
- `Circle 2 — [29355] Deal Phase 2 — Qualify & Segment` (CU 80djf-700457)
- `Circle 3 — [29355] Deal Phase 3 — Prospect Discovery Call` (CU 80djf-700477)
- `Circle 4 — [29355] Deal Phase 4 — Offer & Close` (CU 80djf-700497)
- `Circle 5 — [29355] Deal Phase 5 — Client Onboarding & Setup` (CU 80djf-700517)
- `Circle 6 — [29355] Deal Phase 6 — Early Wins & Results` (CU 80djf-700537)
- `Circle 7 — [29355] Deal Phase 7 — Upsell, Referral & Testimonial` (CU 80djf-700557)

**Invoice / Plan circles (6):**
- `Circle 8 — [29355] Invoice Add-On 1 — Tax Prep Setup — Member Addition — Member Paid` (CU 80djf-701817)
- `Circle 9 — [29355] Invoice Item 1 — Tax Prep Setup — Member Paid` (CU 80djf-701797)
- `Circle 10 — [29355] Plan 1 — Tax Prep Setup — Ongoing Support — Cancelled` (CU 80djf-710077)
- `Circle 11 — [29355] Plan 1 — Tax Prep Setup — Ongoing Support — Created/Paid` (CU 80djf-710097)
- `Circle 12 — [29355] Plan 1 — Tax Prep Setup — Ongoing Support — Expired` (CU 80djf-710117)
- `Circle 13 — [29355] Plan 1 — Tax Prep Setup — Ongoing Support — Unpaid` (CU 80djf-710057)

### Two observed body shapes

The 13 live bodies fall into **two distinct shapes**:

1. **Phase circle (Circles 1–7)** — the full body: two `circle/manageUsers/` URLs, a `## Configuration` block (`### Circle Settings` with Reference Title / Description / CRM Targets / Status / Color), and a `## Reference` block (Phase Position / Previous Phase / Next Phase / Linked Modules).
2. **Invoice / Plan circle (Circles 8–13)** — a **minimal** body: **only** the two `circle/manageUsers/` URLs. No `## Configuration` / `## Reference` sections were authored live for these six. Mirrored verbatim (not a stub — this is the authoritative live state).

The schema below declares the **union** of all sections (the full Phase-circle shape). Invoice/Plan circles populate only the two URLs at the top and stop there.

Template patterned after **`module-config/m001-appointments.md`** (the most recently-authored multi-section reverse-engineered config); structurally closest match.

## Body type / wrapper rule

`body_type: circle` is **content/markdown** — **no** `<style>` or `<script>` wrapper (CLAUDE.md rule 10). Confirmed against all 13 live bodies (zero wrappers present). The `Description` field is presented inside a fenced code block in the live bodies; the **fence language tag varies and is a CU auto-highlight artifact** (observed: `kotlin`, `cs`, `plain`) — it carries no meaning and is preserved verbatim when mirroring.

## Frontmatter additions for this type

```yaml
# Add these to the base canonical-cu-sd-sync.md §5 frontmatter:
body_type: circle
title: "{live CU page title, em-dash preserved — e.g. Circle 1 — [29355] Deal Phase 1 — Lead Capture & Intake}"
parent_slug: 29355-deal-circles   # registry key of the Item: {ID} – Circles parent
```

---

## SD editor — section-by-section config

Walk the live Circle body top to bottom. Values below are `{TODO}` placeholders; fill them at create-time (never ship `{...}` literals in a canonical body — CLAUDE.md rule 5).

### Circle admin URLs (head of every body — all 13)

The two SuiteDash circle member-management URLs (secure + app host). These appear at the top of **every** circle body, Phase and Invoice/Plan alike:

```
https://secure.virtuallaunch.pro/circle/manageUsers/{secure_circle_id}?filter=clear
https://app.virtuallaunch.pro/circle/manageUsers/{app_circle_id}?filter=clear
```

> **Invoice / Plan circles (8–13) stop here.** Their live bodies contain only these two URLs. Everything below this point applies to **Phase circles (1–7)** only.

### Configuration → Circle Settings

#### Reference Title

The circle's internal reference label (single line). Observed form: `Circle: [{item}] Deal: Phase {N} -- {Phase Name}` (note the body uses `--`, not an em-dash, inside the reference title).

```
{TODO: Circle: [29355] Deal: Phase {N} -- {Phase Name}}
```

#### Description

Rich text describing the circle's purpose and the enter/exit conditions. Presented in the live bodies as a fenced code block (fence language is a CU auto-highlight artifact — `kotlin` | `cs` | `plain` observed; preserve whatever live shows).

```
{TODO: 1–2 sentence description with enter/exit criteria}
```

#### CRM Targets

The CRM target audience(s) for the circle. Observed values: `Prospects, Leads` | `Prospects` | `Clients`.

```
{TODO: Prospects, Leads | Prospects | Clients}
```

#### Status

```
{TODO: Active | Inactive}
```

(All 7 observed Phase circles are `Active`.)

#### Color

Hex or descriptive value. **Not yet set** in any of the 7 observed Phase circles — all carry the literal placeholder text below, preserved verbatim:

```
(To be confirmed in SuiteDash circle settings)
```

### Reference

#### Phase Position

Where this circle sits in the pipeline. Observed form: `Phase {N} of 7 -- Deal Pipeline (Item 29355)`.

```
{TODO: Phase {N} of 7 -- Deal Pipeline (Item 29355)}
```

#### Previous Phase

The preceding circle's reference title. **Conditional — absent in Circle 1** (the first phase has no predecessor). Present in Circles 2–7.

```
{TODO: Circle: [29355] Deal: Phase {N-1} -- {Name}   (omit for the first phase)}
```

#### Next Phase

The following circle's reference title. Present in all Phase circles. **The last phase (Circle 7)** carries the end-of-pipeline sentinel instead of a circle reference:

```
{TODO: Circle: [29355] Deal: Phase {N+1} -- {Name}}
# Last phase uses: (End of pipeline -- post-engagement workflows)
```

#### Linked Modules

Bullet list of the modules this circle belongs to. **Conditional — absent in Circle 1**; present in Circles 2–7. Observed content is constant:

```
*   M004 Circles
*   Item 29355 -- Tax Prep Setup
```

---

## Conditional / optional fields (summary)

| Field | Phase circles 1–7 | Invoice/Plan circles 8–13 | Notes |
|---|---|---|---|
| Circle admin URLs (×2) | ✅ all | ✅ all | Only content present in 8–13 |
| `## Configuration` block | ✅ all | ✗ none | — |
| Reference Title | ✅ all | ✗ | — |
| Description (fenced) | ✅ all | ✗ | Fence lang is a CU artifact |
| CRM Targets | ✅ all | ✗ | Prospects,Leads / Prospects / Clients |
| Status | ✅ all (`Active`) | ✗ | — |
| Color | ✅ all (placeholder text) | ✗ | Never set live yet |
| `## Reference` block | ✅ all | ✗ none | — |
| Phase Position | ✅ all | ✗ | — |
| Previous Phase | ✗ Circle 1 only; ✅ 2–7 | ✗ | First phase has no predecessor |
| Next Phase | ✅ all (Circle 7 = sentinel) | ✗ | — |
| Linked Modules | ✗ Circle 1 only; ✅ 2–7 | ✗ | Constant `M004 Circles` / `Item 29355` |

---

## Canonical path convention

Circle instances live under the **Deal** branch (the live `Item: {ID} – Circles` parent is a child of the Deal branch page), mirroring `deal/appts/`:

```
canonicals/{platform}/{sd_item_id}/deal/circles/{circle-slug}.md
```

`computeModulePath` in `scripts/_lib/paths.ts` has no branch for `circle` today — first instances are placed by hand. If a `cu:create` flow is added for circles, extend `paths.ts` to mirror the convention above.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-06-27 | Initial schema, reverse-engineered from the 13 live TPP Circle CU pages under `Item: 29355 – Circles` (CU 80djf-700417). Two body shapes documented (full Phase circle 1–7; minimal Invoice/Plan circle 8–13). M004 flipped ⬜ → ✅. | RC |
