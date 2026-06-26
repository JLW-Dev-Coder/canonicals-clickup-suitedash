---
config_for: appt
last_updated: 2026-06-26
authored_by: RC
sd_modal_path: CRM → Appointments → Appointment Generator → Edit Generator
source: Reverse-engineered from live TPP appt CU pages on 2026-06-26 (the four children of `Item: 29355 – Appts`, CU 80djf-700377). See "Provenance" below.
---

# Module Config — M001 Appointments (`appt`)

Schema for a single SuiteDash **Appointment Generator** record. Each canonical instance (`body_type: appt`) mirrors one generator's configuration, section-for-section, as it appears in the SD Appointment Generator editor.

## Provenance (reverse-engineered)

This schema was **reverse-engineered on 2026-06-26** from the four live TPP appt CU pages authored by JLW under `Item: 29355 – Appts` (CU `80djf-700377`):

- `Appt — Tax Prep Setup — Demo Appt` (CU 80djf-701657)
- `Appt — Tax Prep Setup — Discovery Appt` (CU 80djf-701237)
- `Appt — Tax Prep Setup — Onboarding Support` (CU 80djf-709617)
- `Appt — Tax Prep Setup — Exit/Offboarding Support` (CU 80djf-709777)

Observed deltas vs. the SD Appointment Generator modal's full section set:

- **Pricing Options** does **not** appear in any of the four observed bodies — all four are free calls. It is declared below (from the SD modal's known section set) and marked `_n/a — free_` by default; fill only for paid generators.
- **Appointment Visibility** **does** appear in all four bodies and is declared, even though it was not in the original ask's enumerated section list.
- The live bodies present these as a **flat sequence of `### SD-field` headers** (no `##` grouping). The `##` groupings below mirror the SD editor's logical sections for readability; an authored instance body may keep the flat sequence to match CU exactly.

## Body type / wrapper rule

`body_type: appt` is **content/markdown** — **no** `<style>` or `<script>` wrapper (CLAUDE.md rule 10). Confirmed against all four live bodies (zero wrappers present).

## Frontmatter additions for this type

```yaml
# Add these to the base canonical-cu-sd-sync.md §5 frontmatter:
body_type: appt
title: "{live CU page title, em-dash preserved — e.g. Appt — Tax Prep Setup — Demo Appt}"
parent_slug: 29355-deal-appts   # registry key of the Item: {ID} – Appts parent
appt_generator_name: "{SD Appointment Generator name — e.g. Tax Prep Setup — Demo}"
```

---

## SD editor — section-by-section config

Walk the SD Appointment Generator editor top to bottom. Values below are `{TODO}` placeholders; fill them at create-time (never ship `{...}` literals in a canonical body — CLAUDE.md rule 5).

### Calendar-Only Settings

The two calendar admin/embed URLs that head each live body (SuiteDash exposes the generator's calendar at both the secure and app hosts):

```
https://secure.virtuallaunch.pro/appointment/updateCalendar/{secure_calendar_id}
https://app.virtuallaunch.pro/appointment/updateCalendar/{app_calendar_id}
```

### Basic Appointment Information

#### Appointment Generator

The generator name (single line, em-dash form per JLW's live state).

```
{appt_generator_name}
```

#### Public Description

Rich text shown to the booker. 3–4 short paragraphs.

```
{TODO: public-facing description}
```

### Pricing Options

_Not present in the four observed free-call bodies. Declared from the SD modal section set. For a free generator, leave as `_n/a — free_`._

#### Pricing model

```
{TODO: Free | Paid}
```

#### Price / Currency

```
{TODO: amount + currency, or _n/a — free_}
```

### Assignment & Notification Settings

#### Which Staff Member will be assigned to Events booked on this Appointment Generator?

```
{TODO: Staff member — link to Staff CU page}
```

#### Select Staff Members whom will be notified when an Appointment is created.

```
{TODO: Staff member(s) — link(s) to Staff CU page(s)}
```

### Styling Options

#### Icon

```
{TODO: Icon asset — link to asset CU page}
```

#### Success Message

The popup + email confirmation copy shown after booking. Single line title followed by a short body.

```
{TODO: success message title + body}
```

#### Button Text

```
{TODO: booking button label}
```

#### Appointment Indicator Color

Hex value (observed brand value across all four: `#f97316`).

```
{TODO: #hex}
```

### Appointment Visibility

#### Visible to all CRM Targets

```
{TODO: ON | OFF}
```

#### Show/Hide for specific Circle(s)

```
{TODO: ON | OFF (+ circle list if ON)}
```

### Appointment Automations

Each trigger references the matching `Auto — {generator} — {Trigger}` CU automation page. Observed naming: `Auto — Tax Prep Setup — {Variant} — {Booked | Rescheduled | Cancelled | Completed}`.
(Note: SD labels the cancel trigger **Canceled**; the linked automation page name uses **Cancelled**.)

#### Trigger Automations when an Appointment for this Appointment Generator is Booked

```
{TODO: 80djf-xxxxx — Auto — ... — Booked (link)}
```

#### Trigger Automations when an Appointment for this Appointment Generator is Rescheduled

```
{TODO: 80djf-xxxxx — Auto — ... — Rescheduled (link)}
```

#### Trigger Automations when an Appointment for this Appointment Generator is Canceled

```
{TODO: 80djf-xxxxx — Auto — ... — Cancelled (link)}
```

#### Trigger Automations when an Appointment for this Appointment Generator is Completed

```
{TODO: 80djf-xxxxx — Auto — ... — Completed (link)}
```

---

## Canonical path convention

Appt instances live under the **Deal** branch (the live `Item: {ID} – Appts` parent is a child of the Deal branch page), mirroring `deal/stacks/`:

```
canonicals/{platform}/{sd_item_id}/deal/appts/{appt-slug}.md
```

`computeModulePath` in `scripts/_lib/paths.ts` has no branch for `appt` today — first instances are placed by hand. If a `cu:create` flow is added for appts, extend `paths.ts` to mirror the convention above.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-06-26 | Initial schema, reverse-engineered from the four live TPP appt CU pages under `Item: 29355 – Appts`. M001 flipped ⬜ → ✅. | RC |
