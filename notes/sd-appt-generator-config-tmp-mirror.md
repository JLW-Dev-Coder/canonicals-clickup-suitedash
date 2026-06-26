# SD Appointment Generator config — Tax Monitor (Item 29352) mirror

**Purpose:** Reference for manually configuring the four **Tax Monitor** SuiteDash Appointment Generators
(`CRM → Appointments → Appointment Generator → Edit Generator`). Each block is extracted from its
canonical (`canonicals/tmp/29352/deal/appts/`) using the schema in
[`module-config/m001-appointments.md`](../module-config/m001-appointments.md).

**Source:** mirrored 1:1 from the TPP siblings under `Item: 29355 – Appts` with `Tax Prep → Tax Monitor`
swapped (JLW's mirror rule — no monitoring-semantics rewrite). The CU pages live in the **Tax Monitor**
doc `80djf-83557` under `Tax Monitor Setup – Deal > Item: 29352 – Appts` (`80djf-737317`).

## Legend
- **Populated** — value carried over from the canonical body (verify against live SD).
- **`[MIRROR FROM TPP SIBLING]`** — requires live SD inspection / a TMP-specific value the canonical can't supply.
- **`[TBD]`** — an open decision flagged below.

## Cross-cutting flags (apply to all four)
1. **Calendar-Only Settings (calendar IDs).** The two `updateCalendar/<id>` URLs in each canonical are the
   **TPP** calendar IDs (placeholders). The TMP generators need their **own** calendar IDs →
   `[MIRROR FROM TPP SIBLING]` once the TMP generators exist in SD.
2. **Icon `[TBD]`.** All four reference the shared TPP asset `Item: 29355 – JLW_200x200_head`
   (intentionally reused). **Decision:** kept as the 29355 shared asset (per JLW). Confirm whether TMP
   should keep this shared icon or use a TMP-specific asset.
3. **Automation links.** The Booked/Rescheduled/Canceled/Completed rows show **TPP** automation pages
   (e.g. `80djf-7229xx`, in doc `80djf-83497`) with text swapped to "Tax Monitor". These are placeholders —
   wire each trigger to the real **TMP** automation when built → `[MIRROR FROM TPP SIBLING]`.
4. **Pricing.** Not present in any observed body (all free calls). `_n/a — free_` unless SD says otherwise →
   `[MIRROR FROM TPP SIBLING]` for any paid config.
5. **Content note — "filing steps" (Discovery).** Kept verbatim per JLW's mirror rule. Tax Monitor is IRS
   compliance monitoring (not return filing), so this clause has no clean TM analog — revisit during SD copy review.

---

## 1. Demo Appt
- **CU page:** [Appt - Tax Monitor Setup - Demo Appt](https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737357) (`80djf-737357`)
- **Canonical:** `canonicals/tmp/29352/deal/appts/appt-tax-monitor-setup-demo-appt.md`
- **Generator name:** `Tax Monitor Setup — Demo`
- **Slug / internal name:** `appt-tax-monitor-setup-demo-appt`
- **Calendar IDs:** `[MIRROR FROM TPP SIBLING]` (canonical carries TPP `28162` / `28482`)
- **Public Description:**
  > Book this demo appointment to review how your Tax Monitor Setup can work inside your client portal.
  >
  > During the call, we'll walk through the setup structure, including client intake, document collection, payment flow, e-signature steps, client communication, project tracking, delivery, and offboarding.
  >
  > This appointment is for tax professionals who want a clearer, more organized tax monitor workflow that helps clients know what to do next and helps the practice track each return from start to finish.
  >
  > The goal is to show you the process, answer questions, and determine whether this setup fits your tax monitor practice.
- **Staff assigned:** Staff – Super Admin
- **Notification recipients:** Staff – Super Admin
- **Icon:** `Item: 29355 – JLW_200x200_head` (shared) `[TBD]`
- **Success Message:**
  > Your Tax Monitor Setup — Demo is booked.
  >
  > I'll review what you shared ahead of the demo so we can use the time well. You'll receive a confirmation email shortly with the meeting link and details.
  >
  > Looking forward to connecting.
- **Button Text:** `Book My Demo`
- **Indicator Color:** `#f97316`
- **Visibility:** Visible to all CRM Targets `ON` · Show/Hide for Circle(s) `OFF`
- **Pricing:** `_n/a — free_` / `[MIRROR FROM TPP SIBLING]`
- **Automations:** `[MIRROR FROM TPP SIBLING]`
  - Booked → (TPP) `80djf-722897` · Rescheduled → `80djf-722917` · Canceled → `80djf-722937` · Completed → `80djf-722957`

---

## 2. Discovery Appt
- **CU page:** [Appt - Tax Monitor Setup - Discovery Appt](https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737337) (`80djf-737337`)
- **Canonical:** `canonicals/tmp/29352/deal/appts/appt-tax-monitor-setup-discovery-appt.md`
- **Generator name:** `Tax Monitor Setup — Digital Coffee`
- **Slug / internal name:** `appt-tax-monitor-setup-discovery-appt`
- **Calendar IDs:** `[MIRROR FROM TPP SIBLING]` (canonical carries TPP `28160` / `28481`)
- **Public Description:**
  > This setup call is for tax professionals who want help organizing or improving their tax monitor client workflow before, during, or after tax season.
  >
  > We'll review your current setup, identify where clients may be getting stuck, and discuss how to make your intake, document collection, client communication, payment flow, e-signature process, filing steps, and delivery process easier to manage. _(← "filing steps" kept verbatim — see cross-cutting flag 5)_
  >
  > I'm Jamie (JLW). I help tax pros build cleaner operational systems so clients know what to do next, staff can track the work, and fewer things fall through the cracks.
  >
  > This is not a sales call. It's a practical setup conversation focused on your tax monitor process and how to make it more structured, visible, and repeatable.
- **Staff assigned:** Staff – Super Admin
- **Notification recipients:** Staff – Super Admin
- **Icon:** `Item: 29355 – JLW_200x200_head` (shared) `[TBD]`
- **Success Message:**
  > Your Tax Monitor Setup — Digital Coffee is booked.
  >
  > I'll review what you shared ahead of our conversation so we can use the time well. You'll receive a confirmation email shortly with the meeting link and details.
  >
  > Looking forward to connecting.
- **Button Text:** `Coffee's Ready - Let's Chat`
- **Indicator Color:** `#f97316`
- **Visibility:** Visible to all CRM Targets `ON` · Show/Hide for Circle(s) `OFF`
- **Pricing:** `_n/a — free_` / `[MIRROR FROM TPP SIBLING]`
- **Automations:** `[MIRROR FROM TPP SIBLING]`
  - Booked → (TPP) `80djf-722797` · Rescheduled → `80djf-722817` · Canceled → `80djf-722837` · Completed → `80djf-722857`

---

## 3. Onboarding Support
- **CU page:** [Appt - Tax Monitor Setup - Onboarding Support](https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737397) (`80djf-737397`)
- **Canonical:** `canonicals/tmp/29352/deal/appts/appt-tax-monitor-setup-onboarding-support.md`
- **Generator name:** `Tax Monitor Setup — Onboarding Support`
- **Slug / internal name:** `appt-tax-monitor-setup-onboarding-support`
- **Calendar IDs:** `[MIRROR FROM TPP SIBLING]` (canonical carries TPP `28181` / `28485`)
- **Public Description:**
  > Book this onboarding appointment to review the next steps for your Tax Monitor Setup and what to expect.
  >
  > We'll walk through the workflow, including intake, document collection, service agreements, payments, e-signatures, client communication, project tracking, delivery, and offboarding.
  >
  > This call is for tax professionals and service bureaus that want a more organized tax monitor process inside a branded SuiteDash workspace.
  >
  > The goal is to answer questions and confirm whether this setup fits your practice, team, or members.
- **Staff assigned:** Staff – Super Admin
- **Notification recipients:** Staff – Super Admin
- **Icon:** `Item: 29355 – JLW_200x200_head` (shared) `[TBD]`
- **Success Message:**
  > Your Tax Monitor — Onboarding Support is booked.
  >
  > I'll review what you shared ahead of the demo so we can use the time well. You'll receive a confirmation email shortly with the meeting link and details.
  >
  > Looking forward to connecting.
- **Button Text:** `Book Support`
- **Indicator Color:** `#f97316`
- **Visibility:** Visible to all CRM Targets `ON` · Show/Hide for Circle(s) `OFF`
- **Pricing:** `_n/a — free_` / `[MIRROR FROM TPP SIBLING]`
- **Automations:** `[MIRROR FROM TPP SIBLING]`
  - Booked → (TPP) `80djf-723157` · Rescheduled → `80djf-723117` · Canceled → `80djf-723097` · Completed → `80djf-723137`

---

## 4. Exit/Offboarding Support
- **CU page:** [Appt - Tax Monitor Setup - Exit/Offboarding Support](https://app.clickup.com/8402511/v/dc/80djf-83557/80djf-737377) (`80djf-737377`)
- **Canonical:** `canonicals/tmp/29352/deal/appts/appt-tax-monitor-setup-exit-offboarding-support.md`
- **Generator name:** `Tax Monitor Setup — Exit/Offboarding Support`
- **Slug / internal name:** `appt-tax-monitor-setup-exit-offboarding-support`
- **Calendar IDs:** `[MIRROR FROM TPP SIBLING]` (canonical carries TPP `28182` / `28484`)
- **Public Description:**
  > Book this exit/offboarding appointment to review your completed Tax Monitor Setup and confirm you're ready to use the workflow with clients.
  >
  > We'll walk through what was delivered, review the key setup areas, answer final questions, and confirm any remaining handoff items.
  >
  > This call is for tax professionals and service bureaus that want a clear transition from setup to active use inside their branded SuiteDash workspace.
  >
  > The goal is to make sure you understand the process, know where everything is located, and are ready to begin using the setup with your practice, team, or members.
- **Staff assigned:** Staff – Super Admin
- **Notification recipients:** Staff – Super Admin
- **Icon:** `Item: 29355 – JLW_200x200_head` (shared) `[TBD]`
- **Success Message:**
  > Your Tax Monitor — Exit/Offboarding Support is booked.
  >
  > I'll review what you shared ahead of the demo so we can use the time well. You'll receive a confirmation email shortly with the meeting link and details.
  >
  > Looking forward to connecting.
- **Button Text:** `Book Support`
- **Indicator Color:** `#f97316`
- **Visibility:** Visible to all CRM Targets `ON` · Show/Hide for Circle(s) `OFF`
- **Pricing:** `_n/a — free_` / `[MIRROR FROM TPP SIBLING]`
- **Automations:** `[MIRROR FROM TPP SIBLING]`
  - Booked → (TPP) `80djf-723037` · Rescheduled → `80djf-723057` · Canceled → `80djf-722997` · Completed → `80djf-723017`

---

## Field coverage summary

| Field | Demo | Discovery | Onboarding | Exit/Offboarding |
|---|---|---|---|---|
| Generator name | ✅ | ✅ | ✅ | ✅ |
| Public Description | ✅ | ✅ | ✅ | ✅ |
| Staff assigned / notified | ✅ | ✅ | ✅ | ✅ |
| Success Message | ✅ | ✅ | ✅ | ✅ |
| Button Text | ✅ | ✅ | ✅ | ✅ |
| Indicator Color | ✅ | ✅ | ✅ | ✅ |
| Appointment Visibility | ✅ | ✅ | ✅ | ✅ |
| Icon | `[TBD]` shared | `[TBD]` shared | `[TBD]` shared | `[TBD]` shared |
| Calendar IDs | `[MIRROR]` | `[MIRROR]` | `[MIRROR]` | `[MIRROR]` |
| Pricing | `[MIRROR]` | `[MIRROR]` | `[MIRROR]` | `[MIRROR]` |
| Automations (×4 triggers) | `[MIRROR]` | `[MIRROR]` | `[MIRROR]` | `[MIRROR]` |
