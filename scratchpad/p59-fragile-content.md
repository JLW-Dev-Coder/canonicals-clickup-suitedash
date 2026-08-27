# Item E, second half — does the population contain content the round trip damages?

Scanned 2026-08-27T22:37:02.628Z. Population: **959** live custom contact properties, every string field of each — name, label, groupName, description, and every option label and value.

Damaged classes taken from `scratchpad/p59-projection-probe.md` (read, not restated): **8**.

## Result, per damaged class

| class | what it is | occurrences | distinct properties |
|---|---|---:|---:|
| `E2` | a backtick | 0 | 0 |
| `E3b` | a word wrapped in underscores (markdown emphasis) | 0 | 0 |
| `E4a` | the string opens with a hash | 0 | 0 |
| `E4b` | the string opens with a hyphen or asterisk bullet | 0 | 0 |
| `E4c` | the string opens with an ordinal marker | 0 | 0 |
| `E6b` | a word wrapped in asterisks (markdown emphasis) | 0 | 0 |
| `E6d` | a backslash escape sequence | 0 | 0 |
| `E8` | leading or trailing whitespace | 433 | 18 |

### `E2` — a backtick

**None.** No string in the population exercises this class, so the round trip cannot damage the data through it.

### `E3b` — a word wrapped in underscores (markdown emphasis)

**None.** No string in the population exercises this class, so the round trip cannot damage the data through it.

### `E4a` — the string opens with a hash

**None.** No string in the population exercises this class, so the round trip cannot damage the data through it.

### `E4b` — the string opens with a hyphen or asterisk bullet

**None.** No string in the population exercises this class, so the round trip cannot damage the data through it.

### `E4c` — the string opens with an ordinal marker

**None.** No string in the population exercises this class, so the round trip cannot damage the data through it.

### `E6b` — a word wrapped in asterisks (markdown emphasis)

**None.** No string in the population exercises this class, so the round trip cannot damage the data through it.

### `E6d` — a backslash escape sequence

**None.** No string in the population exercises this class, so the round trip cannot damage the data through it.

### `E8` — leading or trailing whitespace

**433 occurrence(s) across 18 propert(ies).** Each is content a ClickUp-rendered description would alter, and each is carried verbatim in the JSON export instead.

- `business_income_tax__1120___select` · `options[2].label` · "Form 1118 - Sch A  Foreign Tax Credit - Schedule A "
- `business_income_tax__1120___select` · `options[3].label` · "Form 1118 - Sch B  Foreign Tax Credit - Schedule B "
- `business_income_tax__1120___select` · `options[4].label` · "Form 1118 - Sch B & C Foreign Tax Credit - Schedules B and C "
- `business_income_tax__1120___select` · `options[5].label` · "Form 1118 - Sch D  Foreign Tax Credit - Schedule D "
- `business_income_tax__1120___select` · `options[6].label` · "Form 1118 - Sch E  Foreign Tax Credit - Schedule E "
- `business_income_tax__1120___select` · `options[13].label` · "Form 1118 - Sch G  Foreign Tax Credit - Schedule G "
- `business_income_tax__1120___select` · `options[14].label` · "Form 1118 - Sch H  Foreign Tax Credit - Schedule H "
- `business_income_tax__1120___select` · `options[15].label` · "Form 1118 - Sch H cont  Foreign Tax Credit - Schedule H (continued) "
- `business_income_tax__1120___select` · `options[16].label` · "Form 1118 - Sch I  Foreign Tax Credit - Schedule I "
- `business_income_tax__1120___select` · `options[17].label` · "Form 1118 - Sch I cont  Foreign Tax Credit - Schedule I (continued) "
- `business_income_tax__1120___select` · `options[18].label` · "Form 1118 - Sch J  Foreign Tax Credit - Schedule J "
- `business_income_tax__1120___select` · `options[19].label` · "Form 1118 - Sch J cont  Foreign Tax Credit - Schedule J (continued) "
- `business_income_tax__1120___select` · `options[20].label` · "Form 1118 - Sch K  Foreign Tax Credit - Schedule K "
- `business_income_tax__1120___select` · `options[21].label` · "Form 1118 - Sch K cont  Foreign Tax Credit - Schedule K (continued) "
- `business_income_tax__1120___select` · `options[33].label` · "Form 1120-H U.S. Return for Homeowner's Associations "
- `business_income_tax__1120___select` · `options[37].label` · "Form 1122 Authorization to Include Subsidiary Company "
- `business_income_tax__1120___select` · `options[38].label` · "Form 1125-A Cost of Goods Sold "
- `business_income_tax__1120___select` · `options[45].label` · "Form 114  Report of Foreign Bank and Financial Accounts "
- `business_income_tax__1120___select` · `options[49].label` · "Form 114 pg 5  Financial Accounts for Consolidated Corp Filers "
- `business_income_tax__1120___select` · `options[50].label` · "Form 114 pg 6  Late Filing Reason "
- `business_income_tax__1120___select` · `options[58].label` · "Form 2439 Notice to Shareholder of LT Capital Gain "
- `business_income_tax__1120___select` · `options[73].label` · "Form 3468 pg 3 Investment Credit, page 3 "
- `business_income_tax__1120___select` · `options[74].label` · "Form 3800 pg 1-2 General Business Credit, pages 1 and 2 "
- `business_income_tax__1120___select` · `options[75].label` · "Form 3800 pg 3 General Business Credit, page 3 "
- `business_income_tax__1120___select` · `options[81].label` · "Form 4466 Application for Refund of Overpmt of ES Tax "
- `business_income_tax__1120___select` · `options[82].label` · "Form 4562 Depreciation and Amortization "
- `business_income_tax__1120___select` · `options[84].label` · "Form 4684 pg 2 Casualties and Thefts, page 2 "
- `business_income_tax__1120___select` · `options[85].label` · "Form 4684 pg 3 Casualties and Thefts, page 3 "
- `business_income_tax__1120___select` · `options[86].label` · "Form 4684 pg 4 Casualties and Thefts, page 4 "
- `business_income_tax__1120___select` · `options[95].label` · "Form 5471 - Sch H  Form 5471 - Schedule H "
- `business_income_tax__1120___select` · `options[111].label` · "Form 5471 - Sch R  Form 5471 - Schedule R "
- `business_income_tax__1120___select` · `options[117].label` · "Form 5471 Wks A  Form 5471 - Worksheet A, page 1 "
- `business_income_tax__1120___select` · `options[118].label` · "Form 5471 Wks A pg 2 Form 5471 - Worksheet A, page 2 "
- `business_income_tax__1120___select` · `options[119].label` · "Form 5471 Wks A pg 3 Form 5471 - Worksheet A, page 3 "
- `business_income_tax__1120___select` · `options[122].label` · "Form 5471 Wks E-1  Form 5471 - Schedule E-1 in Functional Currency "
- `business_income_tax__1120___select` · `options[123].label` · "Form 5471 Wks E-1 pg 2  Form 5471 - Schedule E-1 in Functional Currency "
- `business_income_tax__1120___select` · `options[128].label` · "Form 5884-A Employee Retention Credit "
- `business_income_tax__1120___select` · `options[130].label` · "Form 6478 Credit for Alcohol Used as Fuel "
- `business_income_tax__1120___select` · `options[132].label` · "Form 6781 Gains and Losses from Contracts and Straddles "
- `business_income_tax__1120___select` · `options[134].label` · "Form 7004 - Attachment  Consolidated Member Listing for 7004 "
- …and 393 more.

## What this means for the export and for B2

- 433 occurrence(s) across 18 propert(ies) sit in a class the ClickUp round trip damages.
- The JSON export is the authoritative channel and carries every byte verbatim, so nothing here is lost by this repo.
- What it constrains is the DESCRIPTION B2 writes: any of the strings above, pasted raw into a ClickUp description, comes back altered. B2 must fence or escape them, or accept that the rendered description is not byte-faithful for those records and treat the JSON as the source of truth.
- Intraword underscore is PRESERVED, which is the class that matters most here and the one every property name depends on.
