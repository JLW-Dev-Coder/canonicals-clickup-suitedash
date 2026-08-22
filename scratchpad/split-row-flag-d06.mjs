// [D-06] — SPLIT `row_flag` INTO A PRINTED COLUMN AND A ROUTING DISCRIMINATOR.
//
// One-shot migration of adapters/hubspot/asset-row-shapes.json. Recorded in the commit that
// produced the change; every value it writes is quoted below from the printed page, and
// adapters/pdf/assert-row-shape-spec.mjs re-derives each one on every run.
//
// WHAT THE PRINTED EVIDENCE SAID, AND WHY IT IS NOT [D-06]'s THREE-AND-TWO.
//
// [D-06] split the five flagged columns three load-bearing / two inert. That split was measured
// on MAP REACHABILITY — is the column bound on an accepting group — and not on the printed page.
// Read off the page instead, all five are drawn as checkboxes SOMEWHERE, and the three
// "load-bearing" ones are drawn on 433-F and simply not bound:
//
//   is_business_account   433-F prints "Check if / Business Account" as a column header over
//                         BOTH accounts tables, and draws AccountsTable[n].#subform[m].CheckBox11
//                         in every row. Four widgets. The map binds none of them.
//   kind                  433-F prints "Primary Residence" and "Other" beside each real-estate
//                         row and draws PR1/CO1 and PR2/CO2. Four widgets. The map binds none.
//
// So the two concepts are not two GROUPS OF COLUMNS. They are two ROLES ONE COLUMN PLAYS ON
// DIFFERENT FORMS: 433-A routes bank rows to line 13 or line 65 and prints no flag, while 433-F
// prints the flag and has one table. That is why one key could never carry it, and it is why
// both new keys are keyed BY FORM. A verdict per occurrence, never per name.

import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/hubspot/asset-row-shapes.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));

// ── the two definitions, now each attached to the key that carries it ──────────────────
doc.meta.how_to_read.row_flag =
  'A ROUTING DISCRIMINATOR: a column the engine reads off the row and the form draws NO CELL FOR. '
  + 'Keyed BY FORM — `{ "<form>": "<why>" }` — because the same column is a discriminator on one form '
  + 'and a printed checkbox on another, which is what made one key impossible. '
  + 'adapters/pdf/assert-row-shape-spec.mjs [A2] excuses the column from the reachability check on a '
  + 'form this names AND ASSERTS THE EXCUSAL: the column must be reachable on that form\'s accepting '
  + 'group neither as text nor as a checkbox. An excusal that excuses a bound column is a STOP.';

doc.meta.how_to_read.printed_as_checkbox =
  'A PRINTED CHECKBOX COLUMN: the form draws a checkbox cell for this column. Keyed BY FORM, and the '
  + 'value carries the evidence — the printed label\'s (page, baseline, x1) in the declared y convention, '
  + 'and the widget names the form draws. [A2] CHECKS these rather than excusing them: the column must be '
  + 'bound in the accepting group\'s `checkboxes` (not its `text`), unless `printed_but_unmapped_on` names '
  + 'the form, which is itself checked. This is the half of the old `row_flag` that was being excused from '
  + 'a check it would have passed.';

doc.meta.how_to_read.printed_but_unmapped_on = doc.meta.how_to_read.printed_but_unmapped_on
  || 'The form PRINTS a cell for this column and the map does not bind it. A declared, reasoned gap — and '
  + 'checked, not trusted: naming a form that DOES bind the column is a stale declaration and a STOP.';

// ── the five columns, per occurrence ────────────────────────────────────────────────────
const at = (page, y, x1) => ({ page, y, x1 });

const EDIT = {
  'bank_account.is_business_account': {
    row_flag: {
      '433a': 'NO CELL. 433-A prints two separate bank tables — line 13 (personal) and line 65 (business) — under different headings, and no box anywhere asks which a row is. The engine reads the column to decide WHICH TABLE the row goes in. This is the discriminator that lets 433-A\'s two tables share one row shape.',
      '433aoi': 'NO CELL. Same two-table shape as 433-A: 1ab_bank_accounts and 8ab_business_bank_accounts, no printed flag on either.',
      '433boi': 'NO CELL, AND NOTHING LEFT TO ROUTE. This form has one bank table and its banner is "Business Asset Information", so the column would be true on every row it ever writes. Constant rather than discriminating — recorded as a distinct state rather than smoothed into "routing", because a constant that nothing reads is a column the next form should be asked about again. [B12].',
    },
    printed_as_checkbox: {
      '433f': {
        printed_label: [at(1, 527.5, 525.5), at(1, 518.5, 508.2)],
        widgets: [
          'topmostSubform[0].Page1[0].AccountsTable[0].#subform[1].CheckBox11[0]',
          'topmostSubform[0].Page1[0].AccountsTable[0].#subform[2].CheckBox11[1]',
        ],
        why: 'The PERSONAL BANK ACCOUNTS table prints "Check if" over "Business Account" as its last column header and draws one checkbox in each of its two rows. A printed cell, not a routing flag.',
      },
    },
    printed_but_unmapped_on: '433f',
    _why_unmapped_on_433f: 'The 433-F map binds the four text columns of this table and not the box. The gap is real and now declared: before this split the column was excused by `row_flag` on a premise the page contradicts, so nothing said the box was unbound. [A2] now names it.',
  },

  'investment.is_business_account': {
    row_flag: {
      '433a': 'NO CELL AND NO ROUTING. Line 14\'s printed instruction already sweeps in business entities, so 433-A has one investments table and prints no flag. The column is simply unused here — recorded as its own reason rather than called "routing", because calling an unused column a discriminator is how a key ends up meaning two things.',
      '433aoi': 'NO CELL. One investments table (2ab_investment_accounts), no printed flag.',
      '433boi': 'NO CELL. One investments table and every row is a business row, as on the bank table. [B12].',
    },
    printed_as_checkbox: {
      '433f': {
        printed_label: [at(1, 441.1, 525.5), at(1, 432.1, 508.2)],
        widgets: [
          'topmostSubform[0].Page1[0].AccountsTable[1].#subform[1].CheckBox11[0]',
          'topmostSubform[0].Page1[0].AccountsTable[1].#subform[2].CheckBox11[1]',
        ],
        why: 'The INVESTMENTS table repeats the same "Check if / Business Account" header and draws its own pair of boxes. Two printed tables, two headers, four boxes in all.',
      },
    },
    printed_but_unmapped_on: '433f',
    _why_unmapped_on_433f: 'As on the bank table above.',
  },

  'real_property.kind': {
    row_flag: {
      '433a': 'NO CELL. 433-A prints one real-property table and asks for a free-text description; nothing on the page asks which kind of property a row is.',
      '433aoi': 'NO CELL. Same shape as 433-A.',
      '433boi': 'NO CELL. One real-estate table and the form asks nothing about the kind beyond the description.',
    },
    printed_as_checkbox: {
      '433f': {
        printed_label: [at(1, 224.5, 49.0), at(1, 224.5, 134.6), at(1, 181.3, 49.0), at(1, 181.3, 134.6)],
        widgets: [
          'topmostSubform[0].Page1[0].real_estate[0].row1[0].description[0].PR1[0]',
          'topmostSubform[0].Page1[0].real_estate[0].row1[0].description[0].CO1[0]',
          'topmostSubform[0].Page1[0].real_estate[0].row2[0].description[0].PR2[0]',
          'topmostSubform[0].Page1[0].real_estate[0].row2[0].description[0].CO2[0]',
        ],
        why: '433-F prints "Primary Residence" and "Other" INSIDE each real-estate row, beside the description, and draws a PRn/COn pair per row. Two rows, four boxes.',
      },
    },
    printed_but_unmapped_on: '433f',
    _why_unmapped_on_433f: 'fill-433f.mjs deliberately leaves both boxes blank rather than inferring "primary" from a description that happens to read "Primary residence" — no backbone column supplies the fact. That decision is unchanged; what changes is that the gap is now a DECLARED unmapped printed cell instead of a column excused as unprinted.',
  },

  'household_member.claimed_on_1040': {
    printed_as_checkbox: {
      '433a': {
        printed_label: [at(1, 525.0, 393.8)],
        widgets: ['topmostSubform[0].Page1[0].c2[0].Table1[0].Row1[0].Dependent[0].CB_06[0]', 'topmostSubform[0].Page1[0].c2[0].Table1[0].Row1[0].Dependent[0].CB_07[0]'],
        why: 'The household table prints "Claimed as a dependent" as a column header and draws a yes/no pair in every row. Bound, and now CHECKED rather than excused.',
      },
      '433aoi': {
        printed_label: [at(1, 337.3, 391.6)],
        widgets: ['topmostSubform[0].F433-A-OIC_Page1[0].Section1[0].dependentListing[0].Row1[0].Dependent[0].CB_06[0]', 'topmostSubform[0].F433-A-OIC_Page1[0].Section1[0].dependentListing[0].Row1[0].Dependent[0].CB_07[0]'],
        why: 'The same header and the same yes/no pair under Section1.dependentListing.',
      },
    },
  },

  'household_member.contributes_to_household_income': {
    printed_as_checkbox: {
      '433a': {
        printed_label: [at(1, 525.0, 505.4)],
        widgets: ['topmostSubform[0].Page1[0].c2[0].Table1[0].Row1[0].Contributes[0].CB_08[0]', 'topmostSubform[0].Page1[0].c2[0].Table1[0].Row1[0].Contributes[0].CB_09[0]'],
        why: 'The household table prints "Contributes to" as the next column header and draws its own yes/no pair per row.',
      },
      '433aoi': {
        printed_label: [at(1, 337.3, 503.7)],
        widgets: ['topmostSubform[0].F433-A-OIC_Page1[0].Section1[0].dependentListing[0].Row1[0].Contributes[0].CB_08[0]', 'topmostSubform[0].F433-A-OIC_Page1[0].Section1[0].dependentListing[0].Row1[0].Contributes[0].CB_09[0]'],
        why: 'The same header and the same pair.',
      },
    },
  },
};

let touched = 0;
for (const c of doc.classes || []) {
  for (const col of c.canonical_row || []) {
    const k = `${c.class_id}.${col.key}`;
    if (!EDIT[k]) {
      if (col.row_flag !== undefined) throw new Error(`unmigrated row_flag at ${k} — the migration's own list is incomplete`);
      continue;
    }
    if (col.row_flag !== true) throw new Error(`${k} does not carry row_flag:true — the tree is not the one this migration was written against`);
    delete col.row_flag;
    Object.assign(col, EDIT[k]);
    touched++;
  }
}
if (touched !== Object.keys(EDIT).length) throw new Error(`migrated ${touched} column(s), the list names ${Object.keys(EDIT).length}`);

doc.rulings_recorded = doc.rulings_recorded || {};
doc.rulings_recorded['D-06'] = {
  ruling: 'SPLIT THE KEY, AND KEY BOTH HALVES BY FORM.',
  what_changed: '`row_flag` keeps the consuming code\'s meaning — a routing discriminator the form draws no cell for — and `printed_as_checkbox` carries the artefact\'s. Both are maps from form to evidence, because the printed page says the same column is one thing on 433-A and the other on 433-F.',
  what_the_printed_evidence_corrected: '[D-06] reported the five columns splitting three load-bearing and two inert. That was measured on MAP REACHABILITY. Read off the printed page, all five are drawn as checkboxes somewhere: is_business_account and kind are printed on 433-F ("Check if / Business Account" over both accounts tables; "Primary Residence"/"Other" in each real-estate row) and simply not bound. So the split is not three-and-two by column; it is per (column, form), and three columns gained a declared `printed_but_unmapped_on: 433f` that nothing had ever said out loud.',
  what_it_widens: '[A2] now CHECKS every printed_as_checkbox occurrence — it must be bound in the accepting group\'s `checkboxes` and not its `text` — and ASSERTS every row_flag excusal, which must be reachable on that form as neither. The old blanket excused five columns and checked none of them.',
};

writeFileSync(P, JSON.stringify(doc, null, 1) + '\n');
console.log(`migrated ${touched} column(s) in ${P}`);
