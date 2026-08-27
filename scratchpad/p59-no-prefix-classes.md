# Item C — the 252 `no-declared-prefix` properties, classified

Derived 2026-08-27T22:39:27.815Z against the live portal. Population: **959** live custom contact properties, of which **252** carry none of this project's declared prefixes.

## Method

- **Project epoch**, derived: `2026-08-14T03:57:37.974Z` — the earliest `createdAt` among the 706 properties this repo's `fields.*.json` name. Not typed.
- **Witness (a)** for class 3: `createdAt` at or after the epoch.
- **Witness (b)** for class 3: the internal name appears in a tracked file in this repo (`git grep -F` over all 252 names at once). 6 matched.
- Either witness alone puts a property in class 3. Neither clears it alone — a false negative here is a naming defect that ships.
- **Class 1 vs class 2**, derived from the portal: a group holding at least one `hubspotDefined` property is a group HubSpot ships (15 such groups); a group holding none was created by whoever created its properties. No product-name list is hardcoded.

## Result

| class | what it is | count |
|---|---|---:|
| 1 | portal-authored — HubSpot-native or portal-default, predating this work | 137 |
| 2 | integration-authored — created by a third-party product | 115 |
| 3 | **RC-authored but unprefixed** | **0** |
| | total | 252 |

### Observation — names this repo mentions that PREDATE the project

**5.** Each appears as a whole word in a tracked file and was created before the project epoch, so this repo REFERS to it and did not create it. Listed because the first draft of this file or-ed the two witnesses together and reported these as class 3; separating them is the correction, and the observation is worth keeping.

- `blindness` · group `contactinformation` · created 2022-03-22T21:36:27.766Z
- `dba` · group `contactinformation` · created 2021-12-15T00:34:33.557Z
- `dependents` · group `contactinformation` · created 2022-01-05T22:27:28.792Z
- `ein` · group `contactinformation` · created 2021-12-05T00:40:27.495Z
- `tags` · group `contactinformation` · created 2022-06-07T20:09:31.968Z

### Class 3 — RC-authored but unprefixed

**Empty.** No property outside the declared prefix vocabulary was created at or after the project epoch, and none is named in any tracked file in this repo. There is no unprefixed RC property and therefore no naming defect at this scale.

### Class 2 — integration-authored, by group

- `growthdrive` — 23
- `calendly` — 20
- `chargebeecustomerinfo` — 20
- `chargebeesubscriptioninfo` — 15
- `chargebeecustomproperties` — 15
- `suitedash` — 13
- `zoom` — 5
- `ip__sync_extension__sync_extension` — 2
- `webhook_site` — 1
- `clickup` — 1

### Class 1 — portal-authored, by group

- `contactinformation` — 128
- `contact_activity` — 6
- `deal_information` — 2
- `sales_properties` — 1

## What the headroom of 41 is headroom against

The ceiling is **1000** custom properties on the contact object and the portal holds **959**, leaving **41**.

That headroom is pressure from a population this project only partly authored:

- **707** (73.7%) carry a declared prefix or fall in class 3 — properties this project created.
- **252** (26.3%) were authored by the portal or by a connected integration, of which 115 are integration-authored and 137 portal-authored.

So a migration off this object has to carry 707 properties of this project's making, not 959; and the 41 remaining slots are consumed by any of the three authors, only one of which this project controls. Reclaiming space is available in a population this project did not author and cannot unilaterally retire.
