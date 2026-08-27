# Item A — what universe produces 884?

Live portal read on this run: **1364** contact properties, of which **959** are custom (`hubspotDefined === false`, `archived=false`) and **405** are HubSpot-defined.

Target under test: **884**. Candidates evaluated: **23**, each a predicate over what the portal returned on this run.

## RECOVERED — 3 candidate universe(s) land on 884 exactly

- **custom, excluding portal group "irs433d"** = 884 — that group holds 75
- **custom created strictly before 2026-08-27** = 884 — the portal as it stood before one of this project's provisioning runs
- **custom created on or before 2026-08-24** = 884 — the portal as it stood after one of this project's provisioning runs

So 884 was a correct count of a different universe, not a wrong count of this one.

## Every candidate, by distance from the target

| candidate universe | count | delta |
|---|---:|---:|
| custom, excluding portal group "irs433d" <br><sub>that group holds 75</sub> | 884 | 0 |
| custom created strictly before 2026-08-27 <br><sub>the portal as it stood before one of this project's provisioning runs</sub> | 884 | 0 |
| custom created on or before 2026-08-24 <br><sub>the portal as it stood after one of this project's provisioning runs</sub> | 884 | 0 |
| sum of every fields.*.json row (rows, not distinct names) <br><sub>counts a reused name once per binding form</sub> | 836 | -48 |
| custom, excluding readOnlyDefinition <br><sub>a definition this portal will not let anyone edit</sub> | 952 | +68 |
| custom, excluding hidden | 956 | +72 |
| every CUSTOM property, archived=false — THE FIGURE THIS PROJECT USES <br><sub>hubspotDefined === false, live</sub> | 959 | +75 |
| custom, excluding calculated <br><sub>calculated properties have no stored value to migrate</sub> | 959 | +75 |
| custom created on or before 2026-08-27 <br><sub>the portal as it stood after one of this project's provisioning runs</sub> | 959 | +75 |
| custom created strictly before 2026-08-24 <br><sub>the portal as it stood before one of this project's provisioning runs</sub> | 777 | -107 |
| custom created on or before 2026-08-22 <br><sub>the portal as it stood after one of this project's provisioning runs</sub> | 777 | -107 |
| custom carrying a declared prefix (irs433*/vlp) <br><sub>the subset this project named</sub> | 707 | -177 |
| custom named by a row in fields.*.json <br><sub>the properties this repo binds</sub> | 706 | -178 |
| custom created strictly before 2026-08-22 <br><sub>the portal as it stood before one of this project's provisioning runs</sub> | 663 | -221 |
| custom created on or before 2026-08-20 <br><sub>the portal as it stood after one of this project's provisioning runs</sub> | 663 | -221 |
| custom created strictly before 2026-08-20 <br><sub>the portal as it stood before one of this project's provisioning runs</sub> | 542 | -342 |
| custom created on or before 2026-08-18 <br><sub>the portal as it stood after one of this project's provisioning runs</sub> | 542 | -342 |
| every custom property including archived <br><sub>338 archived custom propert(ies) exist on this portal</sub> | 1297 | +413 |
| every property on the contact object <br><sub>includes the 405 HubSpot-defined ones</sub> | 1364 | +480 |
| custom created strictly before 2026-08-18 <br><sub>the portal as it stood before one of this project's provisioning runs</sub> | 300 | -584 |
| custom created on or before 2026-08-14 <br><sub>the portal as it stood after one of this project's provisioning runs</sub> | 300 | -584 |
| custom carrying NO declared prefix | 252 | -632 |
| custom created strictly before 2026-08-14 <br><sub>the portal as it stood before one of this project's provisioning runs</sub> | 252 | -632 |

## Does anything in the tree still count 884?

```text
adapters/hubspot/433b.provisioning-dryrun.md:9:- portal holds **884** custom contact properties today (1289 total, 405 HubSpot-defined)
adapters/hubspot/433b.provisioning-dryrun.md:11:- resulting count **884**, leaving **116** against the documented 1,000-custom-property ceiling
adapters/hubspot/433b.provisioning-dryrun.md:26:Under the ceiling by 116: 884 + 0 = 884. Proceed.
adapters/hubspot/433b.provisioning-readback.md:17:Portal now holds **884** custom contact properties (1289 total, 405 HubSpot-defined).
adapters/hubspot/433d.provisioning-dryrun.md:9:- portal holds **884** custom contact properties today (1289 total, 405 HubSpot-defined)
adapters/hubspot/433d.provisioning-dryrun.md:25:Under the ceiling by 41: 884 + 75 = 959. Proceed.
adapters/hubspot/hs-dryrun-433d.mjs:34:// 884 custom properties as this form's; one written as startsWith('irs433d') without the
adapters/hubspot/post-pass-sweep.mjs:266:    why: 'A STRUCTURAL CLAIM ABOUT STRINGS, asked of every ordered pair of this form\'s prefixes rather than of one hand-written pair. Every prefix in this series begins "irs433" and only the character at index 6 separates them, so a test written without the separator would count all 884 custom properties as this form\'s. The claim is false on every portal in every state and cannot move when a pass runs — which is exactly [PP-11] on the predecessor, generalised from one comparison to a loop over a derived set because this form has three prefixes and not two.' },
adapters/pdf/RULES.md:797:incident: the portal held **884 custom contact properties against a documented ceiling of 1,000**
adapters/pdf/assert-reachability.mjs:292:    reason: 'CREATES PERMANENT HUBSPOT PROPERTIES. HubSpot does not free a name and the portal holds 884 of a documented 1,000 ([R-32]), so a suite that ran this on every regression would spend the headroom the next form needs. It is driven by hand, after [R-23]\'s derive-assert-dry-run sequence.' },
Binary file adapters/pdf/forms/f433a.pdf matches
Binary file adapters/pdf/forms/f433aoi.pdf matches
Binary file adapters/pdf/forms/f433b.pdf matches
Binary file adapters/pdf/forms/f433boi.pdf matches
Binary file adapters/pdf/forms/f433d.pdf matches
Binary file adapters/pdf/forms/f433f.pdf matches
Binary file adapters/pdf/forms/f433h.pdf matches
scratchpad/433b-slice3-author-slice3-fixtures.mjs:89:    monthly_payment: '884.00', final_payment_date: '07012029', equity: '17700.00',
scratchpad/p52-rules-30-31-32.mjs:77:incident: the portal held **884 custom contact properties against a documented ceiling of 1,000**
```
