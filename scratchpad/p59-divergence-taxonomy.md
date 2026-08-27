# Item D — divergence taxonomy

Derived 2026-08-27T22:48:09.408Z. Population **959** live custom contact properties; **149** carry at least one divergence.

Kinds: **5** — 4 DISAGREEMENT, 1 ABSENCE.

## The split, and why it exists

Prompt 59 ruled the portal authoritative for definition and `fields.*.json` authoritative for binding and classification. 59-A records that the ruling presumes both sides carry an entry. Where one does not, the ruling resolves nothing, and this tool does not invent one.

| kind | side | occurrences | properties | example |
|---|---|---:|---:|---|
| `description` | **DISAGREEMENT** | 147 | 133 | `irs433_accounts_notes_receivable` |
| `creator-ambiguous` | **DISAGREEMENT** | 116 | 116 | `irs433_address` |
| `label` | **DISAGREEMENT** | 40 | 39 | `irs433_bank_accounts` |
| `options` | **DISAGREEMENT** | 4 | 2 | `irs433_sp_pay_period` |
| `live-but-unbound` | **ABSENCE** | 1 | 1 | `irs433aoi_monthly_rent_payment` |

## DISAGREEMENT kinds — the 59 ruling governs, work proceeds

### `description` — 147 occurrence(s) across 133 propert(ies)

Both sides carry an entry and they differ. Recorded against the record; not reconciled.

Example:

- `irs433_accounts_notes_receivable` — portal and fields.433a.json (433a) hold different description text

### `creator-ambiguous` — 116 occurrence(s) across 116 propert(ies)

Both sides carry an entry and they differ. Recorded against the record; not reconciled.

Example:

- `irs433_address` — non-reuse rows on 433a, 433aoi

### `label` — 40 occurrence(s) across 39 propert(ies)

Both sides carry an entry and they differ. Recorded against the record; not reconciled.

Example:

- `irs433_bank_accounts` — portal "[433] Bank accounts (JSON array; 4 rows fit 433-A)" vs fields.433aoi.json (433aoi) "[433] Bank accounts"

### `options` — 4 occurrence(s) across 2 propert(ies)

Both sides carry an entry and they differ. Recorded against the record; not reconciled.

Example:

- `irs433_sp_pay_period` — portal has 5 option(s), fields.433a.json (433a) has 4; or a label, value or position differs

## ABSENCE kinds — NO SIDE PICKED, ruling OWED

### `live-but-unbound` — 1 occurrence(s) across 1 propert(ies)

**The absent side:** fields.*.json has no row — no binding authority exists to consult

**No side is picked.** Every affected record carries `divergence.ruling = "OWED"` in the export. The derived binding, classification and backbone fields on those records already read *not derivable* with their reason, which is the honest state and not a resolution.

Example:

- `irs433aoi_monthly_rent_payment` — live on the portal and carrying this project's "irs433aoi" prefix, but no field file in this repo holds a row for it

Every member:

- `irs433aoi_monthly_rent_payment` — live on the portal and carrying this project's "irs433aoi" prefix, but no field file in this repo holds a row for it

## The wider absence, stated so it is not confused with the flagged kind

- **253** live properties have no row in any `fields.*.json`.
- Of those, **1** carry one of this project's declared prefixes and are flagged `live-but-unbound` — a property this project named and no longer binds.
- The remaining **252** carry no project prefix and are item C's classes 1 and 2: portal-authored and integration-authored properties this repo never bound and was never going to. Their absence from `fields.*.json` is expected and is not a divergence.
- In the other direction: **0** field row(s) name a property that is not live.
