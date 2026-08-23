// Land slice 2 into adapters/pdf/maps/433b.map.json, and author adapters/pdf/maps/433b.totals.json.
//
// The bindings and every evidence figure come from scratchpad/433b-slice2-gen-slice2-433b.mjs,
// which asserts each caption against the drawn page and refuses the run on any it cannot find
// where the declared rule says it is. Nothing here re-derives a coordinate; this file is the
// assembly step, and it re-runs the generator's outputs rather than a copy of them.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const MAP = 'adapters/pdf/maps/433b.map.json';
const TOT = 'adapters/pdf/maps/433b.totals.json';
const EV = 'adapters/pdf/tmp/p47/slice2-evidence.json';
const BI = 'adapters/pdf/tmp/p47/slice2-bindings.json';
for (const p of [MAP, EV, BI]) if (!existsSync(p)) { console.error(`STOP — ${p} is not in this tree. Run the generator first.`); process.exit(2); }

const m = JSON.parse(readFileSync(MAP, 'utf8'));
const evidence = JSON.parse(readFileSync(EV, 'utf8'));
const bindings = JSON.parse(readFileSync(BI, 'utf8'));

if (m.slice !== 'slice 1 — page 1') { console.error(`STOP — the map declares slice ${JSON.stringify(m.slice)}; this patch expects slice 1. Refusing to land slice 2 twice.`); process.exit(2); }

const T = (k) => { const b = bindings.find((x) => x.key === k); if (!b) { console.error(`STOP — no binding for ${k}`); process.exit(2); } return b.target; };

// ═══════════════════════════════════════════════════════════════════════════════════════
// SCALARS
// ═══════════════════════════════════════════════════════════════════════════════════════
const SCALARS = bindings.filter((b) => !b.key.includes('[') && !/_(yes|no|plaintiff|defendant)$/.test(b.key));
for (const b of SCALARS) m.map[b.key] = b.target;

// ═══════════════════════════════════════════════════════════════════════════════════════
// GROUPS
// ═══════════════════════════════════════════════════════════════════════════════════════
const slotsFor = (group, n, cols) => Array.from({ length: n }, (_, i) => ({
  text: Object.fromEntries(cols.map((c) => [c, T(`${group}[${i}].${c}`)])),
}));

m.groups.business_bank_accounts = {
  max: 3,
  slots: slotsFor('business_bank_accounts', 3, ['type_of_account', 'bank_name_and_address', 'account_number', 'account_balance']),
  _printed: 'Three printed rows, markers 17a (y 178.7), 17b (y 142.7) and 17c (y 106.7), under the block heading "BUSINESS BANK ACOUNTS" at y 274.6 x 56.0..163.4 — the page\'s own spelling, with one C, transcribed rather than corrected. Four columns, all column-header bound.',
  _max_is_from_the_page: 'The form draws exactly three rows and a fourth line, 17d, which is their total rather than a fourth account. `max` 3 is the count of printed account rows.',
  _every_leaf_in_this_table_says_16: 'The container is Table_Line17a-c, which agrees with the page. The row subforms inside it are Lines16a-c, Line16b and Line16c and the cells are p2_30_16a to p2_41_16c, which do not. One table, two numbering schemes, and only the printed marker is the page.',
};

m.groups.accounts_notes_receivable = {
  max: 5,
  slots: slotsFor('accounts_notes_receivable', 5, ['name_and_address', 'contact_name', 'phone', 'status', 'date_due', 'invoice_or_contract_number', 'amount_due']),
  _printed: 'Five printed rows, markers 18a (y 693.6) through 18e (y 492.7), under the block heading "ACCOUNTS/NOTES RECEIVABLE" at y 736.5 x 43.2..159.0. Seven columns per row, of which THREE SHARE THE LEFT COLUMN and are separated by band: the name-and-address cell spans the top of the row, and "Contact Name" and "Phone" are printed beside the two cells beneath it.',
  _max_is_from_the_page: 'The form draws exactly five rows and a sixth line, 18f, which is their total. `max` 5 is the count of printed receivable rows.',
  _the_date_hint_is_misspelled_on_the_form: 'The Date Due column\'s format hint is drawn as "(mmddyyy)" at y 706.1 x 326.2..365.0 — three y\'s. Every other date hint on this form draws "(mmddyyyy)". Recorded verbatim.',
};

m.groups.investments = {
  max: 2,
  slots: slotsFor('investments', 2, ['name_of_company_and_address', 'phone', 'current_value', 'loan_balance', 'equity_value_minus_loan']),
  _printed: 'Two printed rows, markers 19a (y 390.9) and 19b (y 347.7), under the block heading "INVESTMENTS" at y 425.5 x 43.2..100.2. Five text columns plus one Yes/No pair per row.',
  _max_is_from_the_page: 'The form draws exactly two rows and a third line, 19c, which is their total. `max` 2 is the count of printed investment rows.',
  _the_second_rows_subform_is_named_for_the_third_line: '[B-03], resolved by this slice. The subform holding the row the page marks 19b is named Line19c; the printed marker 19c is 46.6pt lower and belongs to "Total Investments". The subform name is one row ahead of the page.',
  _both_rows_left_cells_are_named_TextField1: 'The cells bound as investments[0].name_of_company_and_address and investments[1].name_of_company_and_address carry the SAME leaf name, TextField1, and are told apart only by their containing subform — Line19a for the row the page marks 19a, Line19c for the row it marks 19b. An inherited leaf name is evidence of nothing. THE FULL PATHS ARE NOT QUOTED HERE: validate-map.mjs resolves every topmostSubform path in map prose against the field list and counts it as a SECOND binding, which fails the duplicate-write check. Cells are named by key in this file; the paths are in the evidence table, once each.',
};

m.groups.digital_assets = {
  max: 2,
  slots: slotsFor('digital_assets', 2, ['asset_description', 'location_of_asset', 'account_number', 'current_value_usd', 'loan_balance', 'equity_value_minus_loan']),
  _printed: 'Two printed rows, markers 20b (y 194.8) and 20c (y 170.8), under the block heading "DIGITAL ASSETS" at y 289.7 x 43.2..108.4. Six text columns plus one Yes/No pair per row.',
  _max_is_from_the_page: 'The form draws exactly two rows. 20a is a single-cell question above them and 20e is their total.',
  _the_page_skips_20d: 'The printed markers on this block run 20a, 20b, 20c, 20e. There is no 20d drawn anywhere on this form. That is the page\'s own numbering and it is transcribed, not corrected.',
  _every_name_in_this_block_is_from_another_form: 'The container is RetirementAcct1 and the table inside it is Table_Line14de; the rows are Row13a and Row13b; the cells carry a p2_ prefix on page 3. This form prints no retirement account and no line 13 or 14 at all.',
  _the_yes_no_pair_is_stacked_vertically: 'The only such pair on either page. Both boxes share x 363.6..370.6 and are separated ONLY by baseline — the Yes box is the upper one. Every other pair on these pages is side by side.',
};

m.groups.available_credit = {
  max: 2,
  slots: slotsFor('available_credit', 2, ['full_name_and_address', 'account_number', 'credit_limit', 'amount_owed', 'available_credit']),
  _printed: 'Two printed rows, markers 21a (y 92.1) and 21b (y 59.7), under the block heading "AVAILABLE CREDIT" at y 132.5 x 56.0..132.4. Five columns per row, of which TWO SHARE THE LEFT COLUMN — the name cell spans the top of the row and "Account No." is printed beside the cell beneath it.',
  _max_is_from_the_page: 'The form draws exactly two rows on page 3. THE BLOCK IS NOT CLOSED BY THIS SLICE: no total for it is printed on page 3, so if the form prints one it is on page 4, which is slice 3. This map declares no total for available credit and that absence is a statement about pages 1 to 3 only.',
  _the_leaf_numbering_runs_backwards: 'Left to right the printed columns are Credit Limit, Amount Owed, Available Credit; the leaves are p3_49, p3_48, p3_47 on row 21a and p3_53, p3_52, p3_51 on row 21b. A map ordering these by leaf number writes the available credit into the credit limit.',
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// CHECKBOX SETS
// ═══════════════════════════════════════════════════════════════════════════════════════
const evOf = (k) => evidence.find((e) => e.key === k);
const yesNo = (set, yesKey, noKey, printed) => {
  m.checkboxes[set] = {
    yes: T(yesKey), no: T(noKey), _on_yes: '/Yes', _on_no: '/No',
    _printed: printed,
    _witness: `${evOf(yesKey).second_witness} EACH BOX IS DRAWN TO THE LEFT OF THE WORD IT LABELS: ${evOf(yesKey).pairing}, and ${evOf(noKey).pairing}.`,
  };
  m.exclusive[set] = [T(yesKey), T(noKey)];
};

yesNo('s3_8_uses_payroll_service', 's3_8_uses_payroll_service_yes', 's3_8_uses_payroll_service_no',
  'Question 8, "Does the business use a Payroll Service Provider or Reporting Agent" y 716.8 x 57.6..318.8 with "(If yes, answer the following)" x 321.0..421.4. "Yes" y 716.3 x 527.3..541.5, "No" x 562.3..573.1.');
yesNo('s3_9_party_to_lawsuit', 's3_9_party_to_lawsuit_yes', 's3_9_party_to_lawsuit_no',
  'Question 9, "Is the business a party to a lawsuit" y 659.2 x 57.6..189.4 with "(If yes, answer the following)" x 191.7..292.1. "Yes" y 658.7 x 527.3..541.5, "No" x 562.3..573.1.');
yesNo('s3_10_ever_filed_bankruptcy', 's3_10_ever_filed_bankruptcy_yes', 's3_10_ever_filed_bankruptcy_no',
  'Question 10, "Has the business ever filed bankruptcy" y 594.4 x 57.6..205.5. "Yes" y 593.9 x 527.3..541.5, "No" x 562.3..573.1.');
yesNo('s3_11_related_parties_owe', 's3_11_related_parties_owe_yes', 's3_11_related_parties_owe_no',
  'Question 11, "Do any related parties (e.g., officers, partners, employees) have outstanding amounts owed to the business" y 550.2, drawn as four runs x 57.6..491.2. "Yes" y 550.7 x 527.3..541.5, "No" x 562.3..573.1.');
yesNo('s3_12_assets_transferred', 's3_12_assets_transferred_yes', 's3_12_assets_transferred_no',
  'Question 12, "Have any assets been transferred, in the last 10 years, from this business for less than full value" y 493.6 x 57.6..396.0. "Yes" y 493.1 x 527.3..541.5, "No" x 562.3..573.1.');
yesNo('s3_13_other_business_affiliations', 's3_13_other_business_affiliations_yes', 's3_13_other_business_affiliations_no',
  'Question 13, "Does this business have other business affiliations (e.g., subsidiary or parent companies)" y 450.4 x 57.6..395.7. "Yes" y 449.9 x 527.3..541.5, "No" x 562.3..573.1.');
yesNo('s3_14_income_change_anticipated', 's3_14_income_change_anticipated_yes', 's3_14_income_change_anticipated_no',
  'Question 14, "Any increase/decrease in income anticipated" y 407.2 x 57.6..229.3. "Yes" y 406.7 x 525.0..539.2 — 2.3pt LEFT of every other "Yes" on the page — and "No" x 562.3..573.1, which IS in the common column.');
yesNo('s3_15_federal_government_contractor', 's3_15_federal_government_contractor_yes', 's3_15_federal_government_contractor_no',
  'Question 15, "Is the business a Federal Government Contractor" y 364.0 x 57.6..235.9 with "(Include Federal Government contracts in #18, Accounts/Notes Receivable)" x 240.1..494.6. "Yes" y 363.5 x 527.3..541.5, "No" x 562.3..573.1. THE LEAF NAMES SAY 17.');
yesNo('s4_16b_safe_on_premises', 's4_16b_safe_on_premises_yes', 's4_16b_safe_on_premises_no',
  'Marker 16b, "Is there a safe on the business premises" y 286.7 x 57.6..211.2. "Yes" y 286.7 x 239.3..253.5 and "No" x 274.3..285.1 — roughly 290pt LEFT of every other pair on this page, because the question is set inside Section 4 rather than in Section 3\'s question column. THE LEAF NAMES SAY 17.');

m.checkboxes.s3_9_plaintiff_or_defendant = {
  Plaintiff: T('s3_9_plaintiff'),
  Defendant: T('s3_9_defendant'),
  _on_Plaintiff: '/Plaintiff',
  _on_Defendant: '/Defendent',
  _printed: 'Question 9\'s second row. "Plaintiff" y 632.3 x 75.9..102.4 with its box y 630.8..638.8 x 59.6..67.6; "Defendant" y 632.3 x 130.8..167.8 with its box y 630.8..638.8 x 115.2..123.2.',
  _the_on_state_is_misspelled_in_the_document: 'The page draws "Defendant" and the widget stores /Defendent. The map keys on the PRINTED word, which is what a record says, and carries the on-state the WIDGET holds, which is what the document accepts. Writing the printed spelling as an on-state would tick nothing and the engine would report the box filled — which is the exact failure the checkbox read-back in fill-433b.mjs exists to catch.',
  _witness: 'EACH BOX IS DRAWN TO THE LEFT OF THE WORD IT LABELS, by 8.3pt and 7.6pt. This is the only non-binary, non-entity set on the form and the only one whose options are not Yes and No.',
};
m.exclusive.s3_9_plaintiff_or_defendant = [T('s3_9_plaintiff'), T('s3_9_defendant')];

// THE PER-ROW COLLATERAL PAIRS GO ON THE SLOT, NOT IN THE TOP-LEVEL SET LIST.
//
// `slot.checkboxes` is the established spelling in this engine — fill-433boi.mjs reads it as
// `row[sub]` — so a fixture writes `used_as_collateral: "yes"` inside the row object it already
// has. Keying them at the top level as `investments[0].used_as_collateral` would make the record
// carry a key with a row index baked into it, beside an array whose rows carry no index at all.
// The EXCLUSIVE declaration still uses the indexed spelling, because that is what addresses one
// printed pair of widgets.
for (const g of ['investments', 'digital_assets']) {
  m.groups[g].slots.forEach((slot, i) => {
    const yes = `${g}[${i}].used_as_collateral_yes`;
    const no = `${g}[${i}].used_as_collateral_no`;
    slot.checkboxes = {
      used_as_collateral: {
        Yes: T(yes),
        No: T(no),
        _on_Yes: '/Yes',
        _on_No: '/No',
        _printed: evOf(yes).second_witness,
        _witness: `${evOf(yes).pairing}; the No box is ${evOf(no).pairing}.`,
      },
    };
    m.exclusive[`${g}[${i}].used_as_collateral`] = [T(yes), T(no)];
  });
}
// ═══════════════════════════════════════════════════════════════════════════════════════
// EVIDENCE, PARTITION, PROSE
// ═══════════════════════════════════════════════════════════════════════════════════════
m.slice = 'slice 2 — pages 1 to 3';
m.map_version = 2;

m._map_evidence_page2_3 = {
  _the_pairing_rule: 'Declared once and cited per cell. C: a column caption whose x range lies INSIDE the widget\'s, drawn above the rect top — the dominant layout on both pages. CO: a column caption OVERLAPPING the widget\'s x range from above but not contained in it; weaker, and every CO cell names a second witness. L: the caption\'s right edge is at or left of the widget\'s left edge with its baseline INSIDE the rectangle. R: to the right with its baseline inside the rectangle — every checkbox on these pages prints its option to the right of the box. T: THE TOTAL-LINE RULE — the caption\'s baseline lies inside the widget\'s rectangle, the caption ends left of the widget, and exactly one printed "$" lies between them within 12pt of the widget\'s left edge.',
  _the_rule_was_REFUSED_before_it_was_right: 'The first draft declared five printed totals CO and five as-of dates C or CO, and the assertion refused SEVENTEEN of the 146. The totals are not captioned from above at all — the caption is on the SAME BASELINE, hundreds of points to the left, with a "$" between — which earned rule T rather than a wider CO. Four of the five dates turned out to be plain L. The fifth, the available-credit as-of, has its caption\'s baseline 0.4pt BELOW its rectangle where its twin\'s is inside; both are therefore bound on their COLUMN instead, because a rule admitting both would be a tolerance and one admitting neither would lose a real binding. Every refusal is recorded because a rule loosened until it passed is not a rule.',
  _every_figure_below_is_derived: 'scratchpad/433b-slice2-gen-slice2-433b.mjs finds each named caption on the drawn page, takes the run nearest its widget, and computes the rectangle, the baseline and the gap. For a T cell it also finds the money marker and requires exactly one between the caption and the cell. A caption it cannot find where the rule says it is takes the run down. Re-run it and this table regenerates.',
  _second_witness: 'NAMED ON ALL 146. Both pages are TABLES, so a column header captions a COLUMN and every row inherits it: the header cannot say which row a cell is in and the marker cannot say which column. Both are stated on every table cell, and where even that is not enough — two or three cells sharing one column, a caption set beside its cell, a Yes/No pair stacked vertically, a shared leaf name carrying three columns — a third thing is named.',
  _correlate_labels_is_not_consulted: '[B-01] records that adapters/pdf/correlate-labels.mjs answers the caption ONE ROW ABOVE on this form, on all three probes, every time by a fraction of a point. No labels file exists for 433-B and no binding here cites one. It is treated as a witness SHOWN TO BE WRONG on these pages, not as corroboration: agreement from it would be worth nothing and disagreement would be expected, so it is not asked.',
  bindings: evidence,
};

const P2COUNT = evidence.filter((e) => e.page === 2).length;
const P3COUNT = evidence.filter((e) => e.page === 3).length;
m._partition = {
  ...m._partition,
  in_this_slice: 103 + P2COUNT + P3COUNT,
  bound_writable: 103 + P2COUNT + P3COUNT,
  unaccounted: 447 - (103 + P2COUNT + P3COUNT),
  _check: `${103 + P2COUNT + P3COUNT} + 0 + 0 = ${103 + P2COUNT + P3COUNT} bound writable, never-autofill and deferred, and that is every field pages 1 to 3 draw. 447 - ${103 + P2COUNT + P3COUNT} = ${447 - (103 + P2COUNT + P3COUNT)} unaccounted, which is every field on pages 4 to 6: 94 on page 4, 70 on page 5, 34 on page 6. THIS MAP IS NOT CLOSED and says so; the figure falls to zero when slice 4 lands and not before.`,
  _unaccounted_by_page: `p4 94, p5 70, p6 34 = ${447 - (103 + P2COUNT + P3COUNT)}`,
};
m._deferred_pages = 'Page 4 is slice 3, 94 fields. Pages 5 and 6 are slice 4, 104 fields. THE FIGURES ARE NOT PARENTHESISED, and that is not style: a bracketed number in map prose reads as a printed LINE MARKER to blanket-audit.mjs, which then demands that marker from line-markers.mjs and reports a forward-reference gap, because this form draws no marker of that number.';

m._the_condition_that_governs_pages_2_and_3 = 'Page 2 finishes Section 3 — eight yes/no questions about the business\'s legal and financial history, each with an answer block that is drawn whether or not the question is answered yes — and opens Section 4 with cash on hand, the safe, and the bank-account table. Page 3 is Section 4 continued: receivables, investments, digital assets and available credit. THE SHAPE THAT CHANGES FROM PAGE 1: page 1 asks WHO, in scalars and one repeated personnel row; pages 2 and 3 ask WHAT IS OWNED AND OWED, in FIVE printed tables with a printed total under four of them. That is why 78 of the 146 bindings are column-header bound and only 17 are captioned beside their own cell.';

m._the_arithmetic_arrives_on_page_2 = 'THIS SUPERSEDES `_no_arithmetic_on_this_page_at_all`, WHICH WAS TRUE OF PAGE 1 AND IS KEPT VERBATIM. Pages 2 and 3 draw FOUR printed totals, each naming its own addends: 17d "Total Cash in Banks (Add lines 17a through 17c and amounts from any attachments)", 18f "Outstanding Balance (Add lines 18a through 18e and amounts from any attachments)", 19c "Total Investments (Add lines 19a, 19b, and amounts from any attachments)" and 20e "Total Equity of Digital Assets (Add lines 20b, 20c, and amounts from any attachments)". adapters/pdf/maps/433b.totals.json is authored in the same commit and gate step 11 stops being SKIPPED for this form. THE AVAILABLE-CREDIT BLOCK HAS NO PRINTED TOTAL ON PAGE 3 and none is declared for it.';

m._the_five_flag_classes_on_pages_2_and_3 = 'The five flagged columns in adapters/hubspot/asset-row-shapes.json are is_business_account (twice, on two classes), kind (primary residence / other), claimed_on_1040 and contributes_to_household_income. NONE OF THE FIVE APPEARS ON EITHER PAGE, and that is read off the drawn page rather than off this map: page 2 and page 3 draw no "Check if" column, no "Business Account" caption, no "Primary Residence" or "Other" pair inside a row, no 1040 reference and no household-income column. What they DO draw is a "Used as collateral on loan" Yes/No pair on each investment and digital-asset row — a per-row checkbox column that is NOT one of the five and is bound as its own exclusive set per row.';

m._never_autofill = m._never_autofill || {};

// ── the carried register ───────────────────────────────────────────────────────────────────
const b03 = m._carried.open.find((e) => e.id === 'B-03');
if (!b03) { console.error('STOP — [B-03] is not open in the map. This patch resolves it and cannot find it.'); process.exit(2); }
m._carried.open = m._carried.open.filter((e) => e.id !== 'B-03');
b03.status = 'RESOLVED — Prompt 47 commit 2.';
b03._resolution = {
  ruling: 'THE PAGE WINS, AS THE ITEM SAID IT WOULD. The row inside the subform named Line19c is bound as investments[1] and its printed marker is 19b; the cell the page marks 19c is bound separately as the scalar s4_19c_total_investments, which is the block\'s total.',
  what_this_item_got_right: 'Everything it asserted: that the subform is named Line19c, that the printed marker inside its band is 19b at y 347.7, that the printed 19c at y 301.1 belongs to "Total Investments", and that the subform name is one row ahead of the page. All four were re-derived by the slice-2 generator from the drawn page and all four hold.',
  what_it_could_not_know: 'That the same block carries a SECOND name lie of a different kind: both rows\' left-hand cells are named TextField1, so the two occurrences are told apart only by their containing subform — one of which is the subform this item is about. The row is therefore identified by a container whose name is wrong, and there is nothing else in the field name to fall back on.',
  why_citing_a_cell_was_right: 'The item cited topmostSubform[0].Page3[0].Table_line19[0].Line19c[0].#subform[0].TextField1[0] rather than the subform, because validate-map.mjs resolves every topmostSubform path quoted in prose against the field list and a container path is not in it. That refusal was correct and the citation still resolves.',
};
m._carried.resolved.push(b03);

m._carried.open.push({
  id: 'B-05',
  subject: 'All four printed totals on pages 2 and 3 name "amounts from any attachments" as an addend, and the form draws no cell for it',
  the_shape: 'Each of the four captions ends the same way: 17d "(Add lines 17a through 17c and amounts from any attachments)", 18f "(Add lines 18a through 18e and amounts from any attachments)", 19c "(Add lines 19a, 19b, and amounts from any attachments)", 20e "(Add lines 20b, 20c, and amounts from any attachments)". The printed operand list therefore has one more term than the page has cells, on every one of the four.',
  why_it_matters: 'A form filed WITH an attachment correctly prints a total larger than the sum of its printed rows, and an equality tripwire would fail it. 433-B(OIC) does not have this problem: its line 1 caption names "(1a) through (1d)" and (1d) is a PRINTED cell for the attachment figure, so the operand list is complete there.',
  what_is_declared_and_why: 'All four are declared `equals` tripwires. That is an assertion about WHAT THIS ENGINE WRITES, and it is true of it: this engine has no key for the attachment term because the page draws no cell for it, so every record it produces prints a total exactly equal to the sum of the printed rows. It is NOT an assertion about every correctly filed 433-B, and this entry is the difference.',
  why_it_is_not_settled_here: 'adapters/pdf/comparisons.mjs admits exactly two shapes, `equals` and `at_most`, and says in terms that "NO `at_least`. NO RANGES. NO COMPOSITION. A second shape is a new ruling, not a follow-on edit." What these four captions license is precisely an at_least, and adding one is a change to the comparison construct across all five forms.',
  status: 'OPEN - recorded, not built.',
});

m._carried.open.push({
  id: 'B-06',
  subject: 'The 20e total cell is drawn wider than the column its caption names, and starts at the neighbouring column\'s left edge',
  the_shape: 'On rows 20b and 20c the three money columns are Current value (cell x 417.6..475.2, "$" at x 410.0), Loan Balance (x 486.0..525.6, "$" at x 478.4) and Equity Value minus Loan (x 536.4..576.0, "$" at x 528.8). The 20e total cell runs x 486.0..576.0 — it begins at the LOAN BALANCE column\'s left edge and runs to the equity column\'s right edge, spanning both — and its "$" is at x 478.4..482.8, which is the loan column\'s marker position.',
  the_reading_taken: 'BOUND AS THE EQUITY TOTAL, on the caption. "Total Equity of Digital Assets (Add lines 20b, 20c, and amounts from any attachments)" says what the cell holds in its own words, and a caption naming the fact outranks a rectangle\'s left edge. The rule T binding holds: exactly one printed "$" lies between the caption and the cell.',
  why_it_is_arguable: 'The three other totals on these pages sit exactly over the column they total — 17d is x 499.6..576.0 against an Account Balance column of x 499.6..576.0, 18f is x 492.4..576.0 against x 492.4..576.0, 19c is x 492.5..576.0 against x 492.4..576.0. This one is the only one that does not, and the only one whose money marker is a different column\'s. If the reading were wrong the tripwire would compare the equity total against a loan-balance sum, and nothing else on the page would contradict it.',
  what_would_settle_it: 'A filled copy read back with three distinguishable figures in the three columns of both rows, which the slice-2 fixture does. That proves where the cell PRINTS; it does not prove what the IRS intends by drawing it there.',
  status: 'OPEN - recorded, not built.',
});
m._carried._count = { open: m._carried.open.length, resolved: m._carried.resolved.length };

m._arguable_page2_3 = [
  {
    id: 'C23-1',
    what: '78 of the 146 cells on these two pages are bound on COLUMN HEADERS, which is a weaker witness than a per-cell caption.',
    the_reading: 'Five printed tables draw no caption beside any cell. The only printed text naming a column is the header above the whole table, and the row comes from the printed marker. Header containment plus marker row is what 78 of these bindings rest on.',
    why_it_is_arguable: 'Header containment is a claim about a COLUMN and the cell inherits it. Where two or three cells share a column — the receivable name/contact/phone stack, the investment company/phone stack, the available-credit name/account stack — containment binds all of them to the same header, and only the printed "Contact Name", "Phone" or "Account No." on the lower band separates them. That second witness exists for the lower cells; the top cell in each stack is bound by being the one that is left.',
    what_would_settle_it: 'The round trip in commit 3: a filled copy shows a phone number in a company-name cell immediately.',
  },
  {
    id: 'C23-2',
    what: 'The 20e total is bound on its caption against a rectangle that spans two columns.',
    the_reading: 'See [B-06]. The caption names the fact; the rectangle\'s left edge and its money marker name a different column.',
    why_it_is_arguable: 'It is the one total on these pages where the two witnesses point at different columns, and this map takes the caption.',
    what_would_settle_it: 'Nothing on page 3. It is a question about what the IRS meant by drawing a merged cell.',
  },
  {
    id: 'C23-3',
    what: 'The four totals are declared `equals` against a printed operand list with one term this form has no cell for.',
    the_reading: 'See [B-05]. Every one of the four captions ends "and amounts from any attachments".',
    why_it_is_arguable: 'The declaration is true of what this engine writes and false of what the caption licenses, and the two are being held apart by a sentence rather than by a construct.',
    what_would_settle_it: 'An `at_least` comparison shape, which adapters/pdf/comparisons.mjs refuses to admit without its own ruling.',
  },
  {
    id: 'C23-4',
    what: 'The available-credit block on page 3 is declared with max 2 and NO total, and the form may print one on page 4.',
    the_reading: 'Page 3 draws exactly two available-credit rows, 21a and 21b, and no total row beneath them. Page 3 ends 37.6pt below row 21b\'s last cell.',
    why_it_is_arguable: 'Every other table on these pages carries its total on the same page. This one does not, and whether that is because the form prints no total for available credit or because it prints one on page 4 is a question about a page this slice has not read. THE ABSENCE DECLARED HERE IS ABOUT PAGES 1 TO 3 ONLY and says so.',
    what_would_settle_it: 'Slice 3, which reads page 4.',
  },
];

writeFileSync(MAP, JSON.stringify(m, null, 1) + '\n');
console.log(`${MAP}: slice 2 landed — ${Object.keys(m.map).length} scalar(s), ${Object.keys(m.groups).filter((k) => !k.startsWith('_')).length} group(s), ${Object.keys(m.checkboxes).filter((k) => !k.startsWith('_')).length} checkbox set(s), ${Object.keys(m.exclusive).filter((k) => !k.startsWith('_')).length} exclusive set(s)`);
console.log(`  partition: ${m._partition.in_this_slice} bound of 447; ${m._partition.unaccounted} unaccounted`);
console.log(`  carried: ${m._carried._count.open} open, ${m._carried._count.resolved} resolved`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE TOTALS FILE
// ═══════════════════════════════════════════════════════════════════════════════════════
const totals = {
  form: '433b',
  form_revision: m.form_revision,
  catalog: m.catalog,
  _why: 'Which printed total adds which printed rows. Read by run-form-gate.mjs step 11, which recomputes every total FROM WHAT THE FILLED PDF PRINTS and compares it against the printed total. No figure lives here — only the structure of the form.',
  authored_from: 'The printed page text of adapters/pdf/forms/f433b.pdf pages 2 and 3, extracted from the content streams. Each caption below is quoted verbatim from the drawn page and each names its own addends, which is why these four are tripwires at all: where a form does not say what it adds, a computed figure is this engine\'s assertion rather than the page\'s.',
  _notes: [
    'GATE STEP 11 WAS SKIPPED FOR THIS FORM UNTIL THIS FILE EXISTED, and the skip was honest: page 1 draws no lettered Box, no "Total" line, no "Add lines", no "Subtract" and no "minus". Pages 2 and 3 draw four printed totals and the step turns on.',
    'EVERY ONE OF THE FOUR CAPTIONS NAMES AN OPERAND THE FORM DRAWS NO CELL FOR — "and amounts from any attachments". These are declared `equals` anyway, and that is an assertion about what THIS ENGINE writes rather than about every correctly filed 433-B: the engine has no key for the attachment term because the page has no cell for it, so every record it produces prints a total exactly equal to the sum of the printed rows. [B-05] carries the difference and it is not resolved here, because what the captions license is an `at_least` and adapters/pdf/comparisons.mjs admits only `equals` and `at_most` and says a third shape is a new ruling.',
    'THE AVAILABLE-CREDIT BLOCK HAS NO ENTRY. Page 3 draws rows 21a and 21b and no total row beneath them. That is an absence about pages 1 to 3, not about the form: page 4 is slice 3 and has not been read. [C23-4].',
    'NO FLOOR IS DECLARED ON ANY OF THE FOUR. This form prints no rounding instruction and no "do not enter a negative number" sentence anywhere on pages 1 to 3 — "negative" returns zero across all three — so a floor here would be this engine\'s policy rather than the page\'s.',
  ],
  totals: [
    {
      line: '17d',
      caption: 'Total Cash in Banks (Add lines 17a through 17c and amounts from any attachments)',
      caption_at: 'page 2, y 85.1, x 57.6..133.7 with the addend list at x 136.0..362.1; the printed "$" at y 85.6 x 492.1..497.1',
      printed_rows: '17a, 17b, 17c — the three Account Balance cells of the BUSINESS BANK ACOUNTS table',
      total_key: 's4_17d_total_cash_in_banks',
      feeders: [{ group: 'business_bank_accounts', column: 'account_balance' }],
      _the_operand_list_is_the_captions_own: 'The caption names 17a through 17c, which are the three printed rows, plus "amounts from any attachments", for which this form draws no cell. Three printed cells, one feeder, and the missing fourth term is [B-05].',
    },
    {
      line: '18f',
      caption: 'Outstanding Balance (Add lines 18a through 18e and amounts from any attachments)',
      caption_at: 'page 3, y 437.9, x 57.6..137.4 with the addend list at x 139.7..365.8; the printed "$" at y 437.9 x 485.2..489.6',
      printed_rows: '18a to 18e — the five Amount Due cells of the ACCOUNTS/NOTES RECEIVABLE table',
      total_key: 's4_18f_outstanding_balance',
      feeders: [{ group: 'accounts_notes_receivable', column: 'amount_due' }],
      _the_operand_list_is_the_captions_own: 'The caption names 18a through 18e, which are the five printed rows, plus the attachment term. Five printed cells, one feeder.',
    },
    {
      line: '19c',
      caption: 'Total Investments (Add lines 19a, 19b, and amounts from any attachments)',
      caption_at: 'page 3, y 301.1, x 57.6..125.7 with the addend list at x 128.0..329.1; the printed "$" at y 301.1 x 485.2..489.7',
      printed_rows: '19a, 19b — the two Equity Value Minus Loan cells of the INVESTMENTS table',
      total_key: 's4_19c_total_investments',
      feeders: [{ group: 'investments', column: 'equity_value_minus_loan' }],
      _which_column_the_total_sums: 'THE EQUITY COLUMN, and the cell says so by where it is drawn: x 492.5..576.0, against an Equity Value Minus Loan column of x 492.4..576.0 and a Loan Balance column of x 406.0..482.4. The caption names the ROWS (19a, 19b) and the rectangle names the COLUMN.',
    },
    {
      line: '20e',
      caption: 'Total Equity of Digital Assets (Add lines 20b, 20c, and amounts from any attachments)',
      caption_at: 'page 3, y 143.7, x 57.6..167.3 with the addend list at x 169.6..370.8; the printed "$" at y 142.7 x 478.4..482.8',
      printed_rows: '20b, 20c — the two Equity Value minus Loan cells of the DIGITAL ASSETS table',
      total_key: 's4_20e_total_equity_of_digital_assets',
      feeders: [{ group: 'digital_assets', column: 'equity_value_minus_loan' }],
      _which_column_the_total_sums: 'THE EQUITY COLUMN, ON THE CAPTION, AND THE RECTANGLE DISAGREES. This cell runs x 486.0..576.0 and therefore spans BOTH the Loan Balance column (x 486.0..525.6) and the Equity column (x 536.4..576.0), and its printed "$" at x 478.4 is the loan column\'s marker position. The caption says "Total Equity" in its own words and that is what this declaration follows. It is the only total on these pages whose two witnesses point at different columns, and it carries [B-06].',
      _and_the_page_skips_20d: 'The printed markers on this block run 20a, 20b, 20c, 20e. No 20d is drawn anywhere on the form. Transcribed, not corrected.',
    },
  ],
  not_checkable: {
    _why: 'Printed money cells that hold a total-shaped figure and are DELIBERATELY not tripwires. Declared with the reason, because a cell absent from this file is indistinguishable from one nobody looked at.',
    entries: [
      {
        map_key: 's4_16a_total_cash_on_hand',
        printed_caption: 'CASH ON HAND — Include cash that is not in the bank — Total Cash on Hand',
        printed_at: 'page 2, y 308.3, x 57.6..248.3 with "Total Cash on Hand" at x 407.1..482.4',
        why_not_checkable: 'IT ADDS NOTHING THE FORM PRINTS. The caption says "Total Cash on Hand" and the block draws no rows beneath it — no 16a(i), no list, nothing to sum. The word "Total" here means "the whole of it", not "the sum of the lines above". Every printed total this repo has made a tripwire says "Add lines X, Y, Z"; this one does not, and where the form does not say what it adds, a computed figure would be this engine\'s assertion rather than the page\'s.',
      },
    ],
  },
};
writeFileSync(TOT, JSON.stringify(totals, null, 1) + '\n');
console.log(`${TOT}: ${totals.totals.length} tripwire(s), ${totals.not_checkable.entries.length} declared not checkable`);
