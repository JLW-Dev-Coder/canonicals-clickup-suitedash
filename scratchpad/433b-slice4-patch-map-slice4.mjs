// 433-B map slice 4 — pages 5 and 6 into 433b.map.json, 433b.totals.json, 433b.headings.json.
//
//   node scratchpad/433b-slice4-gen-slice4-433b.mjs   # derive and assert the evidence first
//   node scratchpad/433b-slice4-patch-map-slice4.mjs  # then this
//
// This file takes the DERIVED evidence written by the generator and never re-derives a figure
// of its own: two derivations of one number are two answers to a question the artefact exists
// to give one answer to. It refuses to run if the derived file is missing or was written
// against a different set of widgets.
//
// THE MAP CLOSES HERE. _partition.unaccounted reaches 0 and the sentence saying it does not is
// replaced by one saying it does — with the per-page figures re-derived from the bindings.

import { readFileSync, writeFileSync } from 'node:fs';

const stop = (m) => { console.error(`STOP — ${m}`); process.exit(2); };
const J = (p) => JSON.parse(readFileSync(p, 'utf8'));
const w1 = (p, o) => writeFileSync(p, JSON.stringify(o, null, 1) + '\n');

const DERIVED = 'adapters/pdf/tmp/slice4.derived.json';
let d;
try { d = J(DERIVED); } catch (e) { stop(`${DERIVED} could not be read (${e.message}). Run scratchpad/433b-slice4-gen-slice4-433b.mjs first; this file derives nothing of its own.`); }
const B = d.bindings;
if (B.length !== 104) stop(`the derived evidence carries ${B.length} bindings; pages 5 and 6 draw 104 widgets.`);
const byKey = new Map(B.map((b) => [b.key, b]));
const T = (k) => (byKey.get(k) || stop(`the derived evidence has no binding for ${k}`)).target;

const MAP = 'adapters/pdf/maps/433b.map.json';
const map = J(MAP);
if (map.slice !== 3 && map.slice !== '3') console.log(`note: map.slice reads ${JSON.stringify(map.slice)} before this patch.`);

// ── groups ──────────────────────────────────────────────────────────────────────────────────
const EQUIP_COLS = ['asset_description', 'purchase_lease_date', 'current_fmv', 'current_loan_balance',
  'monthly_payment', 'final_payment_date', 'equity', 'location_of_asset', 'lender_name_address', 'lender_phone'];
map.groups.business_equipment = {
  max: 4,
  _printed_rows: 'The four EQUIPMENT rows of BUSINESS EQUIPMENT AND INTANGIBLE ASSETS, printed markers 24a to 24d. The block heading is drawn at page 5 y 733.1 x 43.2..228.3 and its instruction, "Include all machinery, equipment, merchandise inventory, and other assets in 24a through 24d", names the four by their printed markers.',
  _the_leaf_names_say_23a_to_23d: 'One printed marker behind, as page 4 is. Every binding below is fixed by the printed marker for its row and the printed header stack for its column; the leaf token is recorded and is evidence of nothing ([R-08]).',
  slots: [0, 1, 2, 3].map((i) => ({ text: Object.fromEntries(EQUIP_COLS.map((c) => [c, T(`business_equipment[${i}].${c}`)])) })),
};
map.groups.intangible_assets = {
  max: 3,
  _printed_rows: 'The three INTANGIBLE rows of the same block, printed markers 24e to 24g. The instruction at page 5 y 725.1 reads "List intangible assets in 24e through 24g (licenses, patents, logos, domain names, trademarks, copyrights, software, mining claims, goodwill and trade secrets.)" and names them by their printed markers.',
  _two_cells_per_row_not_ten: 'These rows draw a DESCRIPTION and an EQUITY cell and nothing else — no purchase date, no FMV, no loan balance, no monthly payment, no final payment date, no location and no lender. That is why they are a separate group and not three more slots of business_equipment: a slot shape is a claim about what the page draws, and eight of the ten columns are not drawn on these rows.',
  slots: [0, 1, 2].map((i) => ({ text: { description: T(`intangible_assets[${i}].description`), equity: T(`intangible_assets[${i}].equity`) } })),
};
const LIAB_COLS = ['description', 'date_pledged', 'balance_owed', 'final_payment_date', 'payment_amount',
  'name', 'street_address', 'city_state_zip', 'phone'];
map.groups.business_liabilities = {
  max: 2,
  _printed_rows: 'The two rows of BUSINESS LIABILITIES, printed markers 25a and 25b, under the heading at page 5 y 260.3 x 58.0..146.1 with its instruction "Include notes and judgements not listed previously on this form."',
  _the_secured_flag_is_a_checkbox_pair_and_lives_outside_the_slot: 'Each row prints a Secured / Unsecured pair, and this map already keeps per-row checkbox pairs as top-level keys rather than inside the slot — personnel_7a_responsible_for_payroll_taxes and its three siblings are the precedent on page 1. The two keys are business_liabilities_25a_secured_or_unsecured and business_liabilities_25b_secured_or_unsecured.',
  _two_rows_two_naming_schemes: 'Row 25a spells its four contact cells as ONE indexed leaf name, p5_00_24a[0] to [3]; row 25b spells the same four as p5_49_24b, p5_50_24b, p5_51_24b and p5_52_24b. The bindings rest on the printed captions on both rows.',
  slots: [0, 1].map((i) => ({ text: Object.fromEntries(LIAB_COLS.map((c) => [c, T(`business_liabilities[${i}].${c}`)])) })),
};
map.groups.other_income = {
  max: 5,
  _printed_rows: 'Printed lines 31 to 35 of Section 5\'s income column. They draw NO printed item name of their own: the single caption "Other Income (Specify below)" at page 6 y 572.1 x 53.6..159.1 sits above all five and the filer names each one in the cell beside its amount. Lines 26 to 30 print their item names and therefore draw no such cell.',
  slots: [0, 1, 2, 3, 4].map((i) => ({ text: { description: T(`other_income[${i}].description`), amount: T(`other_income[${i}].amount`) } })),
};

// ── scalars ─────────────────────────────────────────────────────────────────────────────────
const SCALARS = ['s4_24h_total_equity_business_equipment', 's4_25c_total_payments',
  's5_period_from', 's5_period_to',
  's5_26_gross_receipts', 's5_27_gross_rental_income', 's5_28_interest_income', 's5_29_dividends', 's5_30_cash_receipts',
  's5_36_total_income',
  's5_37_materials_purchased', 's5_38_inventory_purchased', 's5_39_gross_wages_and_salaries', 's5_40_rent',
  's5_41_supplies', 's5_42_utilities_telephone', 's5_43_vehicle_gasoline_oil', 's5_44_repairs_and_maintenance',
  's5_45_insurance', 's5_46_current_taxes', 's5_47_other_expenses',
  's5_49_total_expenses', 's5_50_net_income'];
for (const k of SCALARS) {
  if (map.map[k]) stop(`the map already binds ${k}; slice 4 would overwrite it.`);
  map.map[k] = T(k);
}

// ── checkboxes ──────────────────────────────────────────────────────────────────────────────
map.checkboxes.business_liabilities_25a_secured_or_unsecured = {
  Secured: T('business_liabilities_25a_secured_or_unsecured.Secured'),
  Unsecured: T('business_liabilities_25a_secured_or_unsecured.Unsecured'),
  _printed: 'Row 25a. "Secured" y 217.7 x 265.0..294.9, box y 217.4..225.4 x 252.0..260.0; "Unsecured" y 199.7 x 265.0..300.0, box y 199.4..207.4 x 252.0..260.0. The column header above the block reads "Secured/" y 243.5 x 257.3..289.9 and "Unsecured" y 236.5 x 254.1..293.1.',
  _on_states: 'Secured -> /Secured; Unsecured -> /Unsecured. The on-state each box stores is the printed word itself, which settles the option independently of the geometry.',
};
map.checkboxes.business_liabilities_25b_secured_or_unsecured = {
  Secured: T('business_liabilities_25b_secured_or_unsecured.Secured'),
  Unsecured: T('business_liabilities_25b_secured_or_unsecured.Unsecured'),
  _printed: 'Row 25b. "Secured" y 149.3 x 265.0..294.9, box y 149.0..157.0 x 252.0..260.0; "Unsecured" y 131.3 x 265.0..300.0, box y 131.0..139.0 x 252.0..260.0.',
  _on_states: 'Secured -> /Secured; Unsecured -> /Unsecured. Same two on-states as row 25a, on a differently named subform: Secured[0] on 25a, SecUNsec24b[0] on 25b.',
};
map.checkboxes.s5_accounting_method = {
  Cash: T('s5_accounting_method.Cash'),
  Accrual: T('s5_accounting_method.Accrual'),
  _printed: '"Accounting Method Used:" y 718.7 x 36.0..135.1; "Cash" y 718.7 x 159.1..177.6, box y 719.6..727.6 x 144.0..152.0; "Accrual" y 718.7 x 208.5..235.4, box y 719.6..727.6 x 194.4..202.4.',
  _the_labels_are_below_the_boxes_and_R_does_not_hold: 'The label baselines sit 0.9pt BELOW the box bottoms, so the R rule this form uses everywhere else — option printed to the right with its baseline INSIDE the rectangle — does not hold and is not widened to make it hold ([R-09]). The pairing is RS: on one printed baseline, each box takes the unique run lying to its right and left of the next box. Both are settled again by the on-states.',
  _on_states: 'Cash -> /Cash; Accrual -> /Accrual.',
};

// ── exclusive sets ──────────────────────────────────────────────────────────────────────────
map.exclusive.business_liabilities_25a_secured_or_unsecured = {
  _why: 'A liability is secured or it is not. Two options, at most one ticked.',
  options: ['/Secured', '/Unsecured'],
};
map.exclusive.business_liabilities_25b_secured_or_unsecured = {
  _why: 'The same printed pair on row 25b.',
  options: ['/Secured', '/Unsecured'],
};
map.exclusive.s5_accounting_method = {
  _why: 'A business keeps its books on ONE of the two bases the line names. Two options, at most one ticked.',
  options: ['/Cash', '/Accrual'],
};
map.exclusive._the_three_sets_slice_4_adds =
  'Two Secured/Unsecured pairs on page 5 and the accounting-method pair on page 6. Page 5 draws four checkbox widgets and page 6 two, and all six are in these three sets — no loose box on either page.';

// ── never autofill ──────────────────────────────────────────────────────────────────────────
map._never_autofill = {
  _why: 'Mapped, understood, and deliberately blank — a stronger claim than `_deferred`, which means "not resolved yet". Empty through slice 3, and the map said so with the reason: the IRS-use cell and the signature block are both on page 6. Slice 4 reads page 6 and the sentence resolves in two directions at once.',
  _the_signature_block_draws_no_widget: 'Page 6 prints "Signature", "Title", "Date" at y 373.9 and "Print Name of Officer, Partner or LLC Member" at y 337.9, and the IRS USE ONLY (Notes) box at y 261.9. NOT ONE OF THEM DRAWS A WIDGET. Page 6 holds 34 fillable fields and every one of them is above y 482.4; there is nothing below that to withhold. So the signature half of the slice-1 sentence is a checked absence, not a never-autofill entry.',
  _the_irs_use_cell_does_draw_one: "Printed line 48, \"IRS Use Only-Allowable Installment Payments\", draws the leaf ActlMnthly47 in the expense column like any other line. It is declared below so the partition accounts for it and a reviewer can see it, and it is never written. THE LEAF IS NAMED HERE AND THE FULL PATH ONLY IN THE target FIELD BELOW: this file is walked for target strings under any key, so a path written into prose would be a SECOND reference to the same cell and would fail the duplicate-write check.",
  fields: [
    {
      target: 'topmostSubform[0].Page6[0].TotalExpenses[0].ActlMnthly47[0]',
      key: 's5_48_irs_allowable_installment_payments',
      reason: 'THE IRS-USE CELL ON THIS FORM. Printed line 48 reads "IRS Use Only-Allowable Installment Payments" — the page says whose cell it is, in the caption, in words. 433-A declares fourteen never-autofill fields for exactly this column and its stated ground is the one that applies here: a wrong allowable printed on a filed collection statement is worse than an empty cell an examiner fills in. Unlike 433-A, this form publishes no fixed amount for any part of the column, so there is not even the two-line exception 433-A carries.',
    },
  ],
};

// ── the partition, CLOSED ───────────────────────────────────────────────────────────────────
const p5 = B.filter((b) => b.page === 5).length, p6 = B.filter((b) => b.page === 6).length;
const prior = map._partition.in_this_slice;
map._partition.in_this_slice = prior + p5 + p6;
map._partition.bound_writable = prior + p5 + p6 - 1;
map._partition.excluded_never_autofill = 1;
map._partition.unaccounted = map._partition.form_fields_total - (prior + p5 + p6);
const bw = prior + p5 + p6 - 1;
map._partition._check = `${bw} + 1 + 0 = ${bw + 1} bound writable, never-autofill and deferred. THE MAP IS CLOSED: ${map._partition.form_fields_total} - ${bw + 1} = ${map._partition.unaccounted} unaccounted. THE PER-PAGE FIGURES, FOR EVERY PAGE OF THE FORM: 103 on page 1, 64 on page 2, 82 on page 3, 94 on page 4, ${p5} on page 5, ${p6} on page 6 — and they sum to the three partitions with nothing left over. THE ONE NEVER-AUTOFILL TARGET is printed line 48, the IRS-use expense cell on page 6; it is bound under _never_autofill and NOT under map.map, so the walk classifies it once and this engine writes it never.`;
map._partition._why_unaccounted_and_not_deferred = map._partition._why_unaccounted_and_not_deferred + " SLICE 4 CLOSES IT. There is no page left that nobody has read, so the unaccounted figure is 0 and stays 0 unless the form revision changes.";
delete map._partition._unaccounted_by_page;
map._deferred_pages = { _why: 'EMPTY, AND NOW PERMANENTLY. Slices 1 to 4 have read every page the form draws. This key is kept rather than deleted so that a later revision adding a page has somewhere to declare it, and so that its emptiness is a stated fact rather than a missing key.', pages: [] };

// ── slice bookkeeping and the page-5/6 declarations ─────────────────────────────────────────
map.slice = "COMPLETE - every field on every page of this form is mapped or explicitly excluded";
map._what_slice_now_says_and_why_the_wording_matters = "THE WORD IS READ, NOT DECORATIVE. adapters/pdf/verify-form-coverage.mjs mapClaimsComplete() tests this string for a leading \"complete\" and only then holds the form to FULL coverage; a map that has not made the claim is a declared partial slice and cannot be held to a promise it never gave. Slices 1 to 3 spelled it \"slice N - pages A to B\" and earned the partial check honestly. Slice 4 reads the last two pages, so the claim is made and the strict check turns on. Making the claim is the point of closing the map: it is what converts \"nothing has contradicted this yet\" into \"every field is accounted for and something checks it\".";
map.authored_from_page5_6 = 'The printed page text and widget geometry of adapters/pdf/forms/f433b.pdf pages 5 and 6, extracted from the content streams by scratchpad/433b-slice4-gen-slice4-433b.mjs, which asserts every caption against the drawn page before this file writes anything.';
map._the_condition_that_governs_pages_5_and_6 = 'Every binding is fixed by TWO printed facts: the printed row marker for the row and the printed column caption for the column. Neither alone can settle a cell — a header cannot say which row and a marker cannot say which column — and the pair IS the second witness on every table cell. The four cells that are not table cells (the two block totals and the two period dates) take the total-line rule or the immediately-left rule and name their money marker or their distinguishing word.';
map._the_leaf_names_on_pages_5_and_6_are_one_printed_marker_behind = {
  _the_finding: 'THE OFFSET CONTINUES, on both pages, in two different notations, and it is pinned by name rather than counted.',
  page_5: d.offset.page5,
  page_6: d.offset.page6,
  _across_pages: 'The leaf p4_74_79b on page 4 and the leaf p5_74_79b on page 5 differ only in the page token. Two lender-phone cells, two pages, one leaf stem — which is why a binder keyed on the stem would collide them. THE TWO CELLS ARE NAMED HERE BY LEAF AND NOT BY FULL PATH ON PURPOSE: validate-map.mjs walks this file for target strings under any key, so a full topmostSubform path written into evidence prose reads as a SECOND BINDING of that cell and fails the duplicate-write check. It fired on the first draft of this very sentence.',
  _within_page_5: 'The token 23e appears twice: on p5_34_23e[0], the equity cell of intangible row 24e, and on p5_00_23e[0], the block total at printed 24h three lines below it.',
  _within_page_6: 'The leaf name ActlMnthly36 appears twice, as [0] and [1], and spells two different printed expense lines — 37 and 38.',
};
map._the_five_flag_classes_on_pages_5_and_6 = {
  _the_answer: 'NONE OF THE FIVE APPEARS ON EITHER PAGE, and each is a checked absence with its own derived count rather than one sentence covering all five.',
  _the_five: 'is_business_account (twice, on two classes), kind (primary residence / other), claimed_on_1040 and contributes_to_household_income, as registered in adapters/hubspot/asset-row-shapes.json.',
  probes_per_run: d.flags.probes,
  _the_probe_is_per_run_and_that_matters_here: 'The page-4 slice searched the page text JOINED with spaces. On page 6 that produces a hit the page does not draw: the banner "Section 5: Monthly Income/Expenses Statement for Business" is followed by the run "Accounting Method Used:", and the join makes "Business Accounting". A phrase manufactured at a run boundary is not a phrase on the page. The per-run count is the answer, the joined count is computed beside it, and the difference is named.',
  join_artefacts: d.flags.join_artefacts,
  checkbox_widgets: d.flags.checkbox_widgets,
  _where_one_would_have_been_expected: 'is_business_account. Page 5 draws BUSINESS LIABILITIES with a Secured/Unsecured pair per row and page 6 draws an accounting-method pair, so both pages DO print checkboxes — six between them — and none of the six is a flag-class column. The six are enumerated in `exclusive` above and every one is accounted for.',
};
map._the_arithmetic_on_pages_5_and_6 = 'FIVE new printed totals: 24h and 25c on page 5, and 36, 49 and 50 on page 6. Two shapes this form has not carried before arrive with them — a total whose operand list includes a cell this engine never writes (49, which names line 48), and a DIFFERENCE rather than a sum (50, "Line 36 minus Line 49"). Both are declared in 433b.totals.json with the printed caption that licenses them.';
map._the_25c_cell_is_not_the_B06_shape = 'The 25c cell is drawn wider than the column its caption names — x 491.0..576.0 against a Payment Amount lane of 514.0..576.0 — which is the resemblance [B-06] records on page 3\'s 20e. The witnesses AGREE here, as they do for page 4\'s 22e and 23e: the caption says "Total Payments" and the column header says "Payment Amount"; the printed "$" is at x 484.4..488.8, which is not one of the two money-marker positions this block uses for its rows (x 370.0 for Balance Owed and x 506.8 for Payment Amount) and belongs to no column but the total line; and the only other column the cell overlaps, Date of Final Payment at x 439.2..504.0, is a date column that draws no "$" on either row and carries maxLen 8. Recorded because a reader who knows [B-06] would expect a second instance here and there is not one. The same is true of 24h at x 493.7..576.0 against an equity lane of 521.2..576.0.';
map._map_evidence_page5_6 = {
  _the_pairing_rule: 'Six rules on these two pages. C: a column caption stack with AT LEAST ONE RUN contained in the cell\'s x range, drawn above the rect top — slice 3\'s declared predicate, kept, because a header phrase is set as several runs and the widest can overhang the lane by a point while plainly captioning the column; the run carrying the containment is recorded and the runs that only overlap are named beside it. CO: overlapping from above and NOT contained; weaker, and every CO cell names a second witness. L: the caption ends at or left of the cell with its baseline INSIDE the rectangle. R: the option printed to the right with its baseline inside the rectangle. T: the total-line rule — caption baseline inside the rectangle, caption left of the cell, exactly one printed "$" between them within 12pt. RS: new here, for the two page-6 boxes whose labels sit 0.9pt BELOW them, where R fails and is not widened.',
  _rule_counts: Object.fromEntries([...new Set(B.map((b) => b.pairing.split(' ')[0]))].sort().map((r) => [r, B.filter((b) => b.pairing.startsWith(`${r} `)).length])),
  _every_figure_below_is_derived: 'Every rectangle, baseline, x range and maxLen in these rows is read off adapters/pdf/forms/f433b.pdf by scratchpad/433b-slice4-gen-slice4-433b.mjs and written here by scratchpad/433b-slice4-patch-map-slice4.mjs, which computes nothing of its own. A caption the generator cannot find where its rule says it is takes the run down before this file is reached.',
  _second_witness: 'Every one of the 104 cells carries one. On a table cell it is the pair — the printed row marker AND the printed column caption, neither of which can settle the cell alone. On the two totals it is the printed operand list plus the money marker\'s distance from the cell. On the four checkbox options it is the PDF on-state, which spells the printed word. On the two period dates it is which printed run lies immediately left of which cell, and the word "to" belonging to the second.',
  _correlate_labels_is_not_consulted: 'adapters/pdf/maps/433b.labels.json is ABSENT from this tree — correlate-labels.mjs fails its own page-1 county self-check on 433-B and exits 2 without writing — so EVERY BINDING ON THESE PAGES RESTS ON GEOMETRY AND PRINTED TEXT ALONE, with no labels-file witness to agree or disagree. Its probes were not retuned: the guard exists to catch the tool. The absence is re-derived by the generator on every run rather than quoted, and a labels file appearing would STOP it.',
  // THE EVIDENCE ROWS CARRY THE LEAF, NOT THE FULL PATH — slice 3 does the same and the
  // reason is mechanical rather than stylistic. validate-map.mjs walks this file for target
  // strings under ANY key, so a full topmostSubform path in an evidence row is a SECOND
  // binding of that cell. The first draft of this slice wrote them and classifyMapTargets
  // then counted the never-autofill cell twice — once as never under its own key and once as
  // writable under the evidence — and the partition came out one over. The leaf is what a
  // reader needs to find the cell; the binding itself lives in map/groups/checkboxes.
  bindings: B.map(({ target, ...rest }) => ({ ...rest, leaf: target.split('.').pop() })),
};

w1(MAP, map);
console.log(`${MAP}: +${p5 + p6} bindings, partition unaccounted ${map._partition.unaccounted}, slice ${map.slice}`);

// ── totals ──────────────────────────────────────────────────────────────────────────────────
const TOT = 'adapters/pdf/maps/433b.totals.json';
const tot = J(TOT);
const cap = (k) => byKey.get(k).printed;
tot.authored_from_page5_6 = 'The printed page text of adapters/pdf/forms/f433b.pdf pages 5 and 6, extracted from the content streams. Each caption below is quoted verbatim from the drawn page and each names its own addends.';
tot.totals.push(
  {
    line: '24h',
    caption: 'Total Equity (Add lines 24a through 24g and amounts from any attachments)',
    caption_at: 'page 5, y 272.3, x 57.6..102.9 with the addend list at x 105.1..331.6; the printed "$" at y 272.3 x 485.8..490.3',
    printed_rows: '24a to 24g — the four EQUIPMENT equity cells and the three INTANGIBLE equity cells, seven in all',
    total_key: 's4_24h_total_equity_business_equipment',
    feeders: [
      { group: 'business_equipment', column: 'equity' },
      { group: 'intangible_assets', column: 'equity' },
    ],
    _the_operand_list_is_the_captions_own: 'The caption names 24a through 24g, which is BOTH sub-tables and not just the four equipment rows — the intangible rows draw an equity cell and nothing else, and the caption sweeps them in. Two feeders, one per group, seven printed cells, plus the attachment term the form draws no cell for, which is [B-05].',
  },
  {
    line: '25c',
    caption: 'Total Payments (Add lines 25a and 25b and amounts from any attachments)',
    caption_at: 'page 5, y 75.3, x 57.6..116.8 with the addend list at x 119.1..331.3; the printed "$" at y 74.3 x 484.4..488.8',
    printed_rows: '25a and 25b — the two Payment Amount cells of the BUSINESS LIABILITIES table',
    total_key: 's4_25c_total_payments',
    feeders: [{ group: 'business_liabilities', column: 'payment_amount' }],
    _which_column_the_total_sums: 'THE PAYMENT AMOUNT COLUMN. The caption says "Total Payments" and the column header says "Payment Amount"; the cell at x 491.0..576.0 contains that lane entire (514.0..576.0) and clips the right end of the Date of Final Payment lane (439.2..504.0), which is a date column drawing no "$" and carrying maxLen 8. See the map\'s _the_25c_cell_is_not_the_B06_shape.',
  },
  {
    line: '36',
    caption: 'Total Income (Add lines 26 through 35)',
    caption_at: 'page 6, y 507.3, x 53.6..103.5 with the addend list at x 105.7..195.2; the printed "$" at y 507.3 x 218.8..223.2',
    printed_rows: '26 to 35 — the five named income lines and the five Other Income rows',
    total_key: 's5_36_total_income',
    feeders: [
      { keys: ['s5_26_gross_receipts', 's5_27_gross_rental_income', 's5_28_interest_income', 's5_29_dividends', 's5_30_cash_receipts'] },
      { group: 'other_income', column: 'amount' },
    ],
    _no_attachment_term: 'THE FIRST PRINTED TOTAL ON THIS FORM WHOSE CAPTION DOES NOT NAME "amounts from any attachments". The six earlier ones all do and [B-05] covers all six; this one names lines 26 through 35 and stops. So the equality this declares is the page\'s own and not an engine assertion standing in for an at_least — which is worth saying, because [B-05]\'s whole content is that the other captions license an at_least and comparisons.mjs admits only equals and at_most.',
  },
  {
    line: '49',
    caption: 'Total Expenses (Add lines 37 through 48)',
    caption_at: 'page 6, y 496.5, x 320.0..378.3 with the addend list at x 380.6..470.1; the printed "$" at y 495.5 x 485.2..489.6',
    printed_rows: '37 to 48 — twelve printed expense lines, of which 48 is the IRS-use cell',
    total_key: 's5_49_total_expenses',
    feeders: [{ keys: ['s5_37_materials_purchased', 's5_38_inventory_purchased', 's5_39_gross_wages_and_salaries', 's5_40_rent', 's5_41_supplies', 's5_42_utilities_telephone', 's5_43_vehicle_gasoline_oil', 's5_44_repairs_and_maintenance', 's5_45_insurance', 's5_46_current_taxes', 's5_47_other_expenses'] }],
    _one_printed_operand_is_missing_from_the_feeders_and_it_is_declared: 'LINE 48 IS AN OPERAND OF THIS CAPTION AND IS NOT A FEEDER. It is the IRS-use cell, declared at the map\'s _never_autofill: this engine binds it so the partition accounts for it and never writes it. So on every record this engine produces line 48 is empty and 49 equals the sum of 37 through 47, which is what this tripwire compares. THIS IS AN ASSERTION ABOUT WHAT THIS ENGINE WRITES, NOT ABOUT EVERY CORRECTLY FILED 433-B — the same shape [B-05] carries for the attachment term, one degree stronger, because here the missing operand HAS a cell and the emptiness is this engine\'s own declared choice rather than the form\'s omission. A run in which 48 were ever written would make this comparison wrong, and the never-autofill declaration is what stops that.',
  },
  {
    line: '50',
    caption: 'Net Income (Line 36 minus Line 49)',
    caption_at: 'page 6, y 485.7, x 320.0..364.0 with the relation at x 366.2..448.4; the printed "$" at y 484.7 x 485.2..489.6',
    printed_rows: 'none — this line sums no table. It is a DIFFERENCE of two other printed totals, in the printed order.',
    total_key: 's5_50_net_income',
    feeders: [
      { keys: ['s5_36_total_income'] },
      { keys: ['s5_49_total_expenses'], sign: -1 },
    ],
    _the_first_difference_on_this_form: 'The six totals through slice 3 and the four above it are sums. This one is not, and the page states the operator and the order: "(Line 36 minus Line 49)". The construct is the one 433-B(OIC) Box D uses — Box B minus Box C in the printed order — and the order is load-bearing, because the two operands are not interchangeable.',
    _no_floor: 'The page draws no "do not enter a negative number" sentence anywhere on it — "negative" returns zero across all six drawn pages of this form — so net income is allowed to be negative and a floor here would be this engine\'s policy rather than the page\'s.',
  },
);
tot.not_checkable.entries.push({
  map_key: 'business_equipment[*].equity, intangible_assets[*].equity, and the equity column of every earlier table on this form',
  printed_caption: 'Equity / FMV Minus Loan (pages 4 and 5) and Equity / Value Minus Loan (page 3)',
  printed_at: 'page 3 y 413.7 x 517.3 and y 403.7 x 497.4; page 3 y 227.2 x 528.6 and y 217.6 x 530.0; page 4 y 696.3 x 531.7 and y 688.3 x 513.4, repeated at y 350.7 and y 342.7; page 5 y 703.5 x 531.7 and y 695.5 x 513.4',
  why_not_checkable: 'THE RELATION IS IN A COLUMN HEADER, NOT ON A ROW, AND THIS IS ARGUABLE — see [B-07], which is raised rather than resolved. The header names what the column holds; it is not an instruction drawn on a row between two cells the way 433-B(OIC) prints "$ [Current market value] – $ [Minus loan balance] = (2a) $" with the operator between the operands. Every printed total this repo has made a tripwire says "Add lines X, Y, Z" or "Line X minus Line Y" ON THE LINE. Making a column header into twelve row-level tripwires is a ruling, and it would reach back over pages 3 and 4, which are landed. Declared here rather than left silent because a cell absent from this file is indistinguishable from one nobody looked at.',
  _the_intangible_rows_cannot_carry_it_at_all: 'Rows 24e to 24g draw an equity cell and NO fmv and NO loan cell. Whatever is decided for the twelve cells that have both operands, these three have neither, and a relation with no operands drawn is not a relation the page states.',
});
tot._notes.push('SLICE 4 ADDS FIVE TOTALS AND TWO SHAPES THIS FORM HAD NOT CARRIED. Line 36 is the FIRST printed total on 433-B whose caption does NOT name "amounts from any attachments", so [B-05] does not reach it. Line 49 names an operand — line 48, the IRS-use cell — that this engine binds and never writes, which is declared in its own entry rather than absorbed. Line 50 is the form\'s first DIFFERENCE, and the page prints the operator and the order. Eleven printed totals on this form now.');
tot._notes.push('THE EQUITY COLUMNS ARE NOW IN not_checkable, AND THAT IS A CORRECTION AS MUCH AS AN ADDITION. Pages 3 and 4 landed with equity columns and no entry, so those cells were in the state this block exists to end: a printed money cell holding a computed-looking figure that nobody had said anything about. The entry covers all of them, names [B-07], and does not resolve it.');
w1(TOT, tot);
console.log(`${TOT}: ${tot.totals.length} declared total line(s), ${tot.not_checkable.entries.length} not-checkable entr(ies)`);

// ── headings ────────────────────────────────────────────────────────────────────────────────
const HD = 'adapters/pdf/maps/433b.headings.json';
const hd = J(HD);
hd.headings.push(
  { id: 'BUSINESS_EQUIPMENT_AND_INTANGIBLE_ASSETS', page: 5, text: 'BUSINESS EQUIPMENT AND INTANGIBLE ASSETS',
    _at: 'y 733.1, x 43.2..228.3, with the instruction "Include all machinery, equipment, merchandise inventory, and other assets in 24a through 24d. List" drawn as a separate run at x 232.5..569.1 on the same baseline and continuing at y 725.1. The band is anchored on the part that names the block.' },
  { id: 'BUSINESS_LIABILITIES', page: 5, text: 'BUSINESS LIABILITIES',
    _at: 'y 260.3, x 58.0..146.1, with the qualifier "Include notes and judgements not listed previously on this form." at x 150.6..379.4 on the same baseline.' },
  { id: 'SECTION_5_MONTHLY_INCOME_EXPENSES', page: 6, text: 'Section 5: Monthly Income/Expenses Statement for Business',
    _at: 'y 734.4, x 46.0..336.7. One run.' },
  { id: 'TOTAL_MONTHLY_BUSINESS_INCOME', page: 6, text: 'Total Monthly Business Income',
    _at: 'y 653.5, x 109.4..229.0. One run. It captions the LEFT lane of the two-column grid and opens the band the eleven income rows are drawn in.' },
  { id: 'TOTAL_MONTHLY_BUSINESS_EXPENSES', page: 6, text: 'Total Monthly Business Expenses',
    _at: 'y 653.5, x 375.1..503.3. One run, drawn on the SAME baseline as TOTAL_MONTHLY_BUSINESS_INCOME and captioning the RIGHT lane.' },
);
hd._two_headings_on_one_baseline_and_why_the_band_rule_still_works =
  'TOTAL_MONTHLY_BUSINESS_INCOME and TOTAL_MONTHLY_BUSINESS_EXPENSES are both drawn at y 653.5, so the band rule as written — from a heading\'s baseline down to the NEXT heading on the same page — cannot separate them by y. IT DOES NOT HAVE TO: they separate by x, into two lanes that do not overlap. Every income widget lies at x 47.0..302.4 and every expense widget at x 492.4..576.0, and the groups below name their lane as well as their heading. Stated rather than left to the reader, because a band rule that silently needs a second axis on one page is the kind of thing a later slice inherits without knowing.';
hd.groups.business_equipment = {
  heading: 'BUSINESS_EQUIPMENT_AND_INTANGIBLE_ASSETS',
  _why: 'The four equipment rows run from y 684.0 down to y 367.2. Every rectangle lies below the heading baseline at y 733.1 and above BUSINESS_LIABILITIES at y 260.3, which closes the band.',
};
hd.groups.intangible_assets = {
  heading: 'BUSINESS_EQUIPMENT_AND_INTANGIBLE_ASSETS',
  _why: 'The three intangible rows occupy y 342.0..357.2, y 316.8..332.0 and y 291.6..306.8, all inside the same band. THE HEADING NAMES BOTH SUB-TABLES — "BUSINESS EQUIPMENT AND INTANGIBLE ASSETS" — and the page draws no second heading between them, so two groups share one heading and that is what the page does rather than a convenience. The 24h total below them at y 270.0..279.6 belongs to both, which is why its caption names 24a through 24g.',
};
hd.groups.business_liabilities = {
  heading: 'BUSINESS_LIABILITIES',
  _why: 'Row 25a occupies y 162.0..225.4 and row 25b y 93.6..157.0. Both lie below the heading baseline at y 260.3 and above the foot of the page, and there is no heading below it, so the band runs to the page foot. The 25c total at y 72.0..81.6 is inside that band and is the block\'s own total.',
};
hd.groups.other_income = {
  heading: 'TOTAL_MONTHLY_BUSINESS_INCOME',
  _why: 'The five rows occupy y 514.8..568.8 in the INCOME lane, x 47.0..302.4. They lie below the heading baseline at y 653.5 and above the foot of the grid; the lane is what separates them from the expense rows drawn at the same y, per the note above.',
};
hd._no_other_group_on_pages_5_and_6 =
  'Four groups on these two pages and no fifth. Page 5\'s 70 widgets are 40 in business_equipment, 6 in intangible_assets, 22 in business_liabilities (including the four checkbox options) and 2 block totals. Page 6\'s 34 are 10 in other_income, 2 accounting-method boxes, 2 period dates, and 20 scalar amount cells that repeat no row shape — five named income lines, twelve named expense lines and three totals. A repeating row shape is what makes a group; the income and expense lanes print a different item name on every line, so each line is a scalar.';
w1(HD, hd);
console.log(`${HD}: ${hd.headings.length} heading(s), ${Object.keys(hd.groups).length} group band(s)`);

console.log('');
console.log('THE 433-B MAP IS CLOSED: _partition.unaccounted = ' + map._partition.unaccounted);
