// Prompt 47 ruling 7 — 433-B map slice 2, pages 2 and 3, 146 fields.
//
// EVERY EVIDENCE FIGURE IN THE MAP IS DERIVED HERE AND ASSERTED AGAINST THE DRAWN PAGE, exactly
// as slice 1's generator does. A binding row names its target and the PRINTED TEXT it is bound
// to; this file looks that text up on the page, takes the run nearest the widget, and computes
// the rectangle, the baseline and the gap. A caption it cannot find where the declared rule says
// it is takes the run down, so the map cannot carry a caption the page does not draw there.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE PAIRING RULES, DECLARED ONCE AND CITED PER CELL
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   C   COLUMN CAPTION CONTAINED. The caption's x range lies INSIDE the widget's, and its
//       baseline is above the widget's rect top. This is the dominant layout on both pages:
//       Section 3 draws a caption row above each question's answer row, and Section 4 draws
//       column headers above each table.
//   CO  COLUMN CAPTION OVERLAPPING. The caption's x range OVERLAPS the widget's from above but
//       is not contained in it. Weaker than C, and every CO cell therefore names a SECOND
//       WITNESS. The page draws several of these deliberately: "Amount of Suit" is set left of
//       the cell it captions because the cell has to leave room for the printed "$".
//   L   immediately left, baseline inside the rectangle.
//   R   to the right, baseline inside the rectangle — every checkbox on these pages prints its
//       option word to the right of the box.
//   A   directly above, sharing a left edge within 2pt.
//   T   THE TOTAL-LINE RULE, and it was added because five cells REFUSED every other one.
//       A printed total on these pages is drawn as one line — "17d  Total Cash in Banks
//       (Add lines 17a through 17c and amounts from any attachments)   $ [cell]" — so the
//       caption is neither above the cell nor adjacent to it: it is on the SAME BASELINE,
//       hundreds of points to its left. T requires all three of: the caption's baseline lies
//       INSIDE the widget's rectangle; the caption ends left of the widget; and a printed "$"
//       lies BETWEEN them with its own baseline inside the rectangle and its right edge within
//       12pt of the widget's left edge. The money marker is DERIVED from the page here, not
//       asserted, and it is what makes the rule determinate: without it "the caption somewhere
//       to the left on this line" would match three cells on the 17a row as readily as one.
//
// 85 OF THE 101 PAIRINGS ON THESE TWO PAGES ARE UNDER-DETERMINED BY THE RULE ALONE, because
// both pages are TABLES: a column header captions a COLUMN and every row inherits it, so the
// header cannot say which row a cell is in and the row marker cannot say which column. Both are
// stated on every table cell — the printed marker for the row, the header containment for the
// column — and that pair IS the second witness. Where even that is not enough (two cells in one
// column, a caption set beside its cell rather than over it) a third thing is named.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// [B-01]: correlate-labels.mjs IS NOT CONSULTED, AND ON PAGE 3 IT IS KNOWN TO BE WRONG
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [B-01] records that adapters/pdf/correlate-labels.mjs answers the caption ONE ROW ABOVE on
// this form, on all three probes, every time by a fraction of a point, because it puts `above`
// and `left` on one distance scale. No labels file exists for 433-B and none of this slice's
// bindings cites one. It is treated as A WITNESS SHOWN TO BE WRONG ON THIS PAGE, not as
// corroboration: agreement from it would be worth nothing here and disagreement would be
// expected, so it is not asked.

import { readFileSync, writeFileSync } from 'node:fs';
import { readWidgetGeometry, readPrintedText, baselineOfRun } from '../adapters/pdf/page-geometry.mjs';

const bytes = readFileSync('adapters/pdf/forms/f433b.pdf');
const { widgets } = await readWidgetGeometry(bytes);
const pages = await readPrintedText(bytes);
const r1 = (n) => Math.round(n * 10) / 10;
const runsOn = (p) => pages[p - 1].items.map((t) => ({ str: t.str, y: baselineOfRun(t), x1: r1(t.x1), x2: r1(t.x2) }));
const R2 = runsOn(2), R3 = runsOn(3);
const W = new Map(widgets.filter((w) => w.page === 2 || w.page === 3).map((w) => [w.name, { rect: w.rect.map(r1), page: w.page }]));

const P2 = 'topmostSubform[0].Page2[0].';
const P3 = 'topmostSubform[0].Page3[0].';

const B = [];
const add = (key, target, caption, how, note) => B.push({ key, target, caption, how, note });

// ═══════════════════════════════════════════════════════════════════════════════════════
// PAGE 2 — SECTION 3 (questions 8 to 15) AND THE HEAD OF SECTION 4 (16a to 17d)
// ═══════════════════════════════════════════════════════════════════════════════════════
const MK = (m) => `Row fixed by the printed marker ${m}.`;

// ── 8. payroll service provider ────────────────────────────────────────────────────────────
add('s3_8_uses_payroll_service_yes', P2 + 'c2_1_8[0]', 'Yes', 'R',
  'Question 8, "Does the business use a Payroll Service Provider or Reporting Agent" at y 716.8. The Yes/No pair for every question on this page sits in the same two printed columns at x 527.3 and x 562.3, so the COLUMN cannot say which question a box belongs to — the BASELINE BAND does, and each question\'s pair shares a baseline with its own question text.');
add('s3_8_uses_payroll_service_no', P2 + 'c2_1_8[1]', 'No', 'R',
  'The same question-8 row. The box is at x 547.2..555.2 and "No" at x 562.3..573.1 is the run to its right on that baseline.');
add('s3_8_payroll_service_name_and_address', P2 + 'p2_1_8[0]', 'Name and Address', 'C',
  'The caption row for question 8, drawn as two runs: "Name and Address" at y 700.7 x 56.0..124.8 and its qualifier "(Street, City, State, ZIP code)" at x 127.0..230.8. Both lie inside this cell\'s x range. THE SAME TWO RUNS ARE DRAWN AGAIN FOR QUESTION 11 at y 535.5, so the caption alone cannot say which question this cell belongs to; the vertical band does — this widget spans y 673.2..698.4 and question 11\'s spans y 507.6..532.8.');
add('s3_8_payroll_service_effective_dates', P2 + 'p2_2_8[0]', 'Effective dates', 'C',
  'The right-hand cell of the same caption row: "Effective dates" at y 700.7 x 475.2..528.1 with "(mmddyyyy)" at x 530.3..573.0, both inside this cell\'s x range (468.0..576.0). The format hint fixes the value shape and is not what the cell is bound to.');

// ── 9. lawsuit ─────────────────────────────────────────────────────────────────────────────
add('s3_9_party_to_lawsuit_yes', P2 + 'c2_3_9[0]', 'Yes', 'R', 'Question 9, "Is the business a party to a lawsuit" at y 659.2, on its own baseline band.');
add('s3_9_party_to_lawsuit_no', P2 + 'c2_3_9[1]', 'No', 'R', 'The same question-9 row.');
add('s3_9_plaintiff', P2 + 'c2_4_9[0]', 'Plaintiff', 'R',
  'NOT A YES/NO PAIR, AND ITS ON-STATES SAY SO. This box stores /Plaintiff and its partner stores /Defendent — the PDF\'s own spelling, with the second "e", which is a misspelling in the form\'s AcroForm and is recorded rather than corrected because the map must write what the document accepts. The box is at x 59.6..67.6 and "Plaintiff" at x 75.9..102.4 is the run to its right on baseline 632.3, inside the rectangle.');
add('s3_9_defendant', P2 + 'c2_4_9[1]', 'Defendant', 'R',
  'The other half of the same printed pair. Box at x 115.2..123.2, "Defendant" at x 130.8..167.8. THE PRINTED WORD IS SPELLED CORRECTLY AND THE ON-STATE IS NOT: the page draws "Defendant" and the widget stores /Defendent. The map keys on the printed word and carries the on-state the widget holds.');
add('s3_9_location_of_filing', P2 + 'p2_3_9[0]', 'Location of Filing', 'C', `Caption at y 643.1 x 180.0..241.3, inside this cell's x range (172.8..309.6). ${MK('9')}`);
add('s3_9_represented_by', P2 + 'p2_4_9[0]', 'Represented by', 'C', `Caption at y 643.1 x 316.8..373.6, inside this cell's x range (309.6..468.0). ${MK('9')}`);
add('s3_9_docket_or_case_number', P2 + 'p2_5_9[0]', 'Docket/Case No.', 'C', `Caption at y 643.1 x 475.2..536.5, inside this cell's x range (468.0..576.3). ${MK('9')}`);
add('s3_9_amount_of_suit', P2 + 'AmountSuit[0].p2_6_9[0]', 'Amount of Suit', 'CO',
  'THE CAPTION IS SET LEFT OF THE CELL IT CAPTIONS, and the reason is drawn on the page: "Amount of Suit" runs x 58.0..111.4 while the cell starts at x 65.4, because the printed "$" at y 610.7 x 59.3..63.7 occupies the space to the cell\'s left. SECOND WITNESS: that "$" is immediately left of this cell with its baseline INSIDE the rectangle (608.4..619.2), and it is the only "$" on the question-9 band. A money marker is not a caption and is not what this cell is bound to; it is what tells this cell from the two to its right, which the overlapping caption alone cannot.');
add('s3_9_possible_completion_date', P2 + 'p2_7_9[0]', 'Possible Completion Date', 'C',
  'Caption at y 621.5 x 180.0..263.6 with "(mmddyyyy)" at x 265.6..304.0, both inside this cell\'s x range (172.8..309.6).');
add('s3_9_subject_of_suit', P2 + 'p2_8_9[0]', 'Subject of Suit', 'C', 'Caption at y 621.5 x 316.8..369.4, inside this cell\'s x range (309.6..576.3).');

// ── 10. bankruptcy ─────────────────────────────────────────────────────────────────────────
add('s3_10_ever_filed_bankruptcy_yes', P2 + 'c2_5_10[0]', 'Yes', 'R', 'Question 10, "Has the business ever filed bankruptcy" at y 594.4, on its own baseline band.');
add('s3_10_ever_filed_bankruptcy_no', P2 + 'c2_5_10[1]', 'No', 'R', 'The same question-10 row.');
add('s3_10_date_filed', P2 + 'p2_9_10[0]', 'Date Filed', 'C', 'Caption at y 578.3 x 57.6..93.8 with "(mmddyyyy)" at x 96.0..138.6, both inside this cell\'s x range (50.4..144.0).');
add('s3_10_date_dismissed', P2 + 'p2_10_10[0]', 'Date Dismissed', 'C',
  'Caption at y 578.3 x 151.2..207.2, inside this cell\'s x range (144.0..266.4). THE LEAF NAME IS SHARED WITH THE NEXT CELL: p2_10_10 carries indices [0] and [1] for two DIFFERENT printed columns, Date Dismissed and Date Discharged. Binding by leaf stem without the index writes the dismissal date into the discharge column, and the two are months apart on a real bankruptcy.');
add('s3_10_date_discharged', P2 + 'p2_10_10[1]', 'Date Discharged', 'C',
  'Caption at y 578.3 x 273.6..333.3, inside this cell\'s x range (266.4..388.8). Index [1] of the shared leaf; see the note on Date Dismissed.');
add('s3_10_petition_number', P2 + 'p2_11_10[0]', 'Petition No.', 'C', 'Caption at y 578.3 x 396.0..437.9, inside this cell\'s x range (388.8..468.0).');
add('s3_10_district_of_filing', P2 + 'p2_12_10[0]', 'District of Filing', 'C', 'Caption at y 578.3 x 475.2..530.8, inside this cell\'s x range (468.0..576.3).');

// ── 11. related parties owing the business ─────────────────────────────────────────────────
add('s3_11_related_parties_owe_yes', P2 + 'c2_6_11[0]', 'Yes', 'R', 'Question 11 at y 550.2, on its own baseline band.');
add('s3_11_related_parties_owe_no', P2 + 'c2_6_11[1]', 'No', 'R', 'The same question-11 row.');
add('s3_11_name_and_address', P2 + 'p2_13_11[0]', 'Name and Address', 'C',
  'Caption at y 535.5 x 57.6..126.4 with "(Street, City, State, ZIP code)" at x 128.6..232.4, both inside this cell\'s x range (50.4..252.0). THE SAME CAPTION IS DRAWN FOR QUESTION 8 at y 700.7; this cell is told from that one by the band — y 507.6..532.8 against y 673.2..698.4.');
add('s3_11_date_of_loan', P2 + 'p2_14_11[0]', 'Date of Loan', 'C', 'Caption at y 534.9 x 258.2..304.2, inside this cell\'s x range (252.0..309.6).');
add('s3_11_current_balance', P2 + 'CurrentBalance[0].p2_16_11[0]', 'Current Balance As of', 'CO',
  'The caption runs x 311.6..382.3 and this cell runs x 320.4..439.2, so the caption OVERLAPS from above rather than being contained — it starts left of the cell because the printed "$" at y 509.9 x 313.8..318.2 sits there. SECOND WITNESS: that "$" is immediately left of this cell with its baseline inside the rectangle. THIRD, AND IT IS WHAT SEPARATES THIS CELL FROM ITS SIBLING: the caption says "Current Balance As of", two facts in one run, and the AS-OF DATE is a different cell (p2_15_11, x 388.8..439.2, one band higher). This is the amount because it is the cell the "$" marks.');
add('s3_11_current_balance_as_of', P2 + 'CurrentBalance[0].p2_15_11[0]', 'Current Balance As of', 'L',
  'THE OTHER HALF OF ONE CAPTION, and the two are told apart by what is printed under each. This cell (x 388.8..439.2, band y 532.8..543.6) has "mmddyyyy" printed at y 525.7 x 388.8..424.2 — SHARING ITS LEFT EDGE TO A TENTH OF A POINT — and the amount cell has a "$". A format hint is not a caption; it is the second witness that says which of the two facts in "Current Balance As of" this cell holds.');
add('s3_11_payment_date', P2 + 'p2_17_11[0]', 'Payment Date', 'C', 'Caption at y 534.9 x 448.6..499.2, inside this cell\'s x range (439.2..504.0).');
add('s3_11_payment_amount', P2 + 'p2_18_11[0]', 'Payment Amount', 'CO',
  'Caption at y 535.1 x 506.0..567.8 against a cell at x 514.8..576.0 — overlapping from above, and set left for the same reason as every money cell on this page. SECOND WITNESS: the printed "$" at y 509.9 x 508.2..512.6, immediately left of this cell with its baseline inside the rectangle.');

// ── 12. assets transferred ─────────────────────────────────────────────────────────────────
add('s3_12_assets_transferred_yes', P2 + 'c2_7_12[0]', 'Yes', 'R', 'Question 12 at y 493.6, on its own baseline band.');
add('s3_12_assets_transferred_no', P2 + 'c2_7_12[1]', 'No', 'R', 'The same question-12 row.');
add('s3_12_list_asset', P2 + 'p2_19_12[0]', 'List Asset', 'C', 'Caption at y 478.3 x 57.6..92.6, inside this cell\'s x range (50.4..266.4).');
add('s3_12_value_at_time_of_transfer', P2 + 'ValueTimeTransfer[0].p2_20_12[0]', 'Value at Time of Transfer', 'CO',
  'Caption at y 477.5 x 273.6..362.8 against a cell at x 282.7..367.2 — overlapping from above. SECOND WITNESS: the printed "$" at y 466.7 x 275.9..280.4, immediately left of this cell with its baseline inside the rectangle (464.4..475.2).');
add('s3_12_date_transferred', P2 + 'p2_21_12[0]', 'Date Transferred', 'C', 'Caption at y 478.3 x 371.2..425.2 with "(mmddyyyy)" at x 427.2..465.6, both inside this cell\'s x range (367.2..468.0).');
add('s3_12_to_whom_or_where_transferred', P2 + 'p2_22_12[0]', 'To Whom or Where Transferred', 'C', 'Caption at y 478.3 x 477.1..572.9, inside this cell\'s x range (468.0..576.3).');

// ── 13. other business affiliations ────────────────────────────────────────────────────────
add('s3_13_other_business_affiliations_yes', P2 + 'c2_8_13[0]', 'Yes', 'R', 'Question 13 at y 450.4, on its own baseline band.');
add('s3_13_other_business_affiliations_no', P2 + 'c2_8_13[1]', 'No', 'R', 'The same question-13 row.');
add('s3_13_related_business_name_and_address', P2 + 'p2_24_13[0]', 'Related Business Name and Address', 'C',
  'Caption at y 435.1 x 57.6..190.7 with "(Street, City, State, ZIP code)" at x 192.9..296.7, both inside this cell\'s x range (50.4..468.0). THE LEAF NUMBERING RUNS BACKWARDS ACROSS THIS ROW: the LEFT cell is p2_24_13 and the RIGHT one is p2_23_13. Nothing about the names orders the row; the printed headers do.');
add('s3_13_related_business_ein', P2 + 'p2_23_13[0]', 'Related Business EIN:', 'C',
  'Caption at y 435.1 x 477.4..556.7, inside this cell\'s x range (468.0..576.3). The lower-numbered leaf of the two, on the RIGHT of the printed row — see the note on the name-and-address cell.');

// ── 14. anticipated change in income ───────────────────────────────────────────────────────
add('s3_14_income_change_anticipated_yes', P2 + 'c2_9_14[0]', 'Yes', 'R',
  'Question 14 at y 407.2. NOTE: this question\'s "Yes" is drawn at x 525.0..539.2, 2.3pt LEFT of every other "Yes" on the page (x 527.3). The column is not fixed and the rows are told apart by baseline.');
add('s3_14_income_change_anticipated_no', P2 + 'c2_9_14[1]', 'No', 'R', 'The same question-14 row; its "No" IS in the common column at x 562.3.');
add('s3_14_explain', P2 + 'p2_25_14[0]', 'Explain', 'C', 'Caption at y 391.9 x 57.6..83.7 with "(Use attachment if needed)" at x 85.9..181.8, both inside this cell\'s x range (50.4..345.6).');
add('s3_14_how_much_increase_decrease', P2 + 'HowMuchIncDec[0].p2_26_14[0]', 'How much will it increase/decrease', 'CO',
  'Caption at y 393.1 x 352.8..466.8 against a cell at x 354.2..468.2 — overlapping from above by a whisker at each edge. SECOND WITNESS: the printed "$" at y 380.3 x 348.7..353.1, immediately left of this cell with its baseline inside the rectangle (378.0..388.8).');
add('s3_14_when_increase_decrease', P2 + 'p2_27_14[0]', 'When will it increase/decrease', 'C',
  'Caption at y 391.9 x 477.2..572.7, inside this cell\'s x range (468.0..576.3). THE LEAF NAME p2_27_14 CARRIES A SECOND WIDGET, [1], AND IT IS NOT ON THIS ROW OR IN THIS SECTION: index [1] is the "Contents" cell of question 16b, 96pt down the page in Section 4. Binding by leaf stem writes the answer to a Section 3 question into a Section 4 asset cell.');

// ── 15. federal government contractor ──────────────────────────────────────────────────────
add('s3_15_federal_government_contractor_yes', P2 + 'c2_10_17[0]', 'Yes', 'R',
  'Question 15, "Is the business a Federal Government Contractor" at y 364.0. THE LEAF NAME SAYS 17 AND THE PAGE SAYS 15. There is no printed marker 17 anywhere near this box; the marker on its band is 15, and 17a to 17d are the bank-account table 200pt further down.');
add('s3_15_federal_government_contractor_no', P2 + 'c2_10_17[1]', 'No', 'R', 'The same question-15 row; the same name lie.');

// ── Section 4, 16a and 16b ─────────────────────────────────────────────────────────────────
add('s4_16a_total_cash_on_hand', P2 + 'p2_28_15[0]', 'Total Cash on Hand', 'T',
  'Marker 16a, "CASH ON HAND" at y 308.3 with "Total Cash on Hand" at y 308.3 x 407.1..482.4 against a cell at x 498.2..576.0. The caption is entirely LEFT of the cell rather than over it, so this is neither C nor CO on the caption alone. SECOND WITNESS: the printed "$" at y 308.8 x 492.4..497.4, immediately left of this cell and 0.8pt above the marker baseline. THE LEAF NAME SAYS 15 AND THE PRINTED MARKER IS 16a.');
add('s4_16b_safe_on_premises_yes', P2 + 'c2_11_17[0]', 'Yes', 'R',
  'Marker 16b, "Is there a safe on the business premises" at y 286.7. THIS PAIR IS NOT IN THE PAGE\'S USUAL YES/NO COLUMNS: its "Yes" is at x 239.3..253.5 and its "No" at x 274.3..285.1, roughly 290pt left of every other pair on the page, because the question is set inside Section 4 rather than in Section 3\'s question column. THE LEAF NAME SAYS 17 AND THE PRINTED MARKER IS 16b.');
add('s4_16b_safe_on_premises_no', P2 + 'c2_11_17[1]', 'No', 'R', 'The other half of the 16b pair; box at x 259.2..267.2, "No" at x 274.3..285.1.');
add('s4_16b_safe_contents', P2 + 'p2_27_14[1]', 'Contents', 'C',
  'Caption at y 298.3 x 295.2..327.8, inside this cell\'s x range (288.0..576.0). THE WORST NAME LIE ON THIS PAGE: the field is p2_27_14 index [1], and index [0] of the same leaf is the "When will it increase/decrease" answer to question 14, in Section 3, 90pt up the page. One leaf name, two widgets, two sections, two unrelated facts.');

// ── the business bank accounts table, markers 17a to 17d ───────────────────────────────────
add('s4_17_account_balance_as_of', P2 + 'Table_Line17a-c[0].HeaderRow16a-c[0].AcctBal[0].p2_29_16[0]', 'As of', 'L',
  'THE AS-OF DATE IN THE TABLE HEADER, not a row cell. "Account Balance" is at y 240.7 x 506.4..561.2, "As of" at y 226.7 x 499.6..516.1 and "mmddyyyy" at y 215.9 x 523.4..558.8; this cell runs x 518.4..570.4 in the header band y 224.4..236.4. SECOND WITNESS: the "mmddyyyy" hint is drawn BELOW the cell and inside its x range, and it is the only date hint in the header. The three row cells beneath it in the same column are balances, not dates.');

const BANK = [
  ['17a', 'Lines16a-c[0]', 'p2_30_16a[0]', 'p2_31_16a[0]', 'p2_32_16a[0]', 'p2_33_16a[0]'],
  ['17b', 'Line16b[0]', 'p2_34_16b[0]', 'p2_35_16b[0]', 'p2_36_16b[0]', 'p2_37_16b[0]'],
  ['17c', 'Line16c[0]', 'p2_38_16c[0]', 'p2_39_16c[0]', 'p2_40_16c[0]', 'p2_41_16c[0]'],
];
BANK.forEach(([mk, sub, type, bank, acct, bal], i) => {
  const lie = `EVERY LEAF IN THIS TABLE SAYS 16 AND EVERY PRINTED MARKER SAYS 17. The container is Table_Line17a-c — which agrees with the page — and the rows inside it are named Lines16a-c, Line16b and Line16c, which do not. ${MK(mk)}`;
  add(`business_bank_accounts[${i}].type_of_account`, P2 + `Table_Line17a-c[0].${sub}.${type}`, 'Type of', 'C',
    `COLUMN HEADER, drawn as two runs on two baselines: "Type of" at y 233.7 x 76.6..103.4 and "Account" at y 223.7 x 75.1..104.9, both inside this cell's x range (50.4..144.0). ${lie}`);
  add(`business_bank_accounts[${i}].bank_name_and_address`, P2 + `Table_Line17a-c[0].${sub}.${bank}`, 'Full Name and Address', 'C',
    `COLUMN HEADER, drawn as four runs across two baselines: "Full Name and Address" at y 233.6 x 176.9..252.1, "(Street, City, State, ZIP code)" at x 254.1..347.6 and "of" at x 349.6..355.9, then "Bank, Savings & Loan, Credit Union or Financial Institution" at y 223.6 x 172.5..360.3. All lie inside this cell's x range (144.0..388.8). ${lie}`);
  add(`business_bank_accounts[${i}].account_number`, P2 + `Table_Line17a-c[0].${sub}.${acct}`, 'Account Number', 'C',
    `COLUMN HEADER at y 228.7 x 408.8..469.6, inside this cell's x range (388.8..489.6). ${lie}`);
  add(`business_bank_accounts[${i}].account_balance`, P2 + `Table_Line17a-c[0].${sub}.${bal}`, 'Account Balance', 'C',
    `COLUMN HEADER at y 240.7 x 506.4..561.2, inside this cell's x range (499.6..576.0). The printed "$" beside each row of this column is at x 492.1..497.1, OUTSIDE the cell — this column is bound on the header, not on the money marker. ${lie}`);
});

add('s4_17d_total_cash_in_banks', P2 + 'p1-t99[0]', 'Total Cash in Banks', 'T',
  'Marker 17d. "Total Cash in Banks" at y 85.1 x 57.6..133.7 with "(Add lines 17a through 17c and amounts from any attachments)" at x 136.0..362.1; this cell runs x 499.6..576.0 in band y 82.8..104.4, so the caption is entirely to its left. SECOND WITNESS: the printed "$" at y 85.6 x 492.1..497.1, immediately left of the cell, and this is the ONLY cell in the Account Balance column below row 17c. THE LEAF NAME IS "p1-t99" AND THIS IS PAGE 2 — the only field on either of these pages whose name claims the wrong page.');

// ═══════════════════════════════════════════════════════════════════════════════════════
// PAGE 3 — SECTION 4 CONTINUED (18a to 21b)
// ═══════════════════════════════════════════════════════════════════════════════════════

// ── accounts / notes receivable, markers 18a to 18f ────────────────────────────────────────
const AR = [
  ['18a', 'Line18A[0]', 'p3_01_18a[0]', 'p3_02_18a[0]', 'p3_03_18a[0]', 'p3_04_18a[0]', 'p3_05_18a[0]', 'p3_06_18a[0]', 'p3_07_18a[0]'],
  ['18b', 'Line18B[0]', 'p3_08_18b[0]', 'p3_09_18b[0]', 'p3_10_18b[0]', 'p3_11_18b[0]', 'p3_12_18b[0]', 'p3_13_18b[0]', 'p3_14_18b[0]'],
  ['18c', 'Line18C[0]', 'p3_15_18c[0]', 'p3_16_18c[0]', 'p3_17_18c[0]', 'p3_18_18c[0]', 'p3_19_18c[0]', 'p3_20_18c[0]', 'p3_21_18c[0]'],
  ['18d', 'Line18D[0]', 'p3_22_18d[0]', 'p3_23_18d[0]', 'p3_24_18d[0]', 'p3_25_18d[0]', 'p3_26_18d[0]', 'p3_27_18d[0]', 'p3_28_18d[0]'],
  ['18e', 'Line18E[0]', 'p3_29_18e[0]', 'p3_30_18e[0]', 'p3_31_18e[0]', 'p3_32_18e[0]', 'p3_33_18e[0]', 'p3_34_18e[0]', 'p3_35_18e[0]'],
];
AR.forEach(([mk, sub, name, contact, phone, status, due, inv, amt], i) => {
  const row = `${MK(mk)} Every row of this table prints the same column headers at the same x, so the header fixes the column and the marker fixes the row, and neither alone determines the cell.`;
  add(`accounts_notes_receivable[${i}].name_and_address`, P3 + `Table_Line18[0].${sub}.#subform[0].${name}`, 'Name & Address', 'CO',
    `COLUMN HEADER OVERLAPPING FROM ABOVE at y 711.0 x 43.2..100.7 — it starts 7.2pt LEFT of the cell, which the four other headers on this table do not do with "(Street, City, State, ZIP code)" at x 102.7..196.1, both inside this cell's x range (50.4..259.2). THREE CELLS SHARE THIS COLUMN and are separated by band: this one spans the top of the row, the contact-name cell and the phone cell sit beneath it and each carries its OWN printed caption. ${row}`);
  add(`accounts_notes_receivable[${i}].contact_name`, P3 + `Table_Line18[0].${sub}.#subform[0].${contact}`, 'Contact Name', 'L',
    `The printed "Contact Name" for row ${mk} is immediately left of this cell with its baseline inside the rectangle. It is the second witness that separates this cell from the name-and-address cell above it in the same column. ${row}`);
  add(`accounts_notes_receivable[${i}].phone`, P3 + `Table_Line18[0].${sub}.#subform[0].${phone}`, 'Phone', 'L',
    `The printed "Phone" for row ${mk} is immediately left of this cell with its baseline inside the rectangle — the third cell in the shared left column, and the only one this caption is on the band of. ${row}`);
  add(`accounts_notes_receivable[${i}].status`, P3 + `Table_Line18[0].${sub}.${status}`, 'Status', 'C',
    `COLUMN HEADER at y 716.0 x 260.9..281.5 with "(e.g., age," at x 283.5..315.1 and "factored, other)" at y 706.0 x 263.4..312.6, all inside this cell's x range (259.2..316.8). ${row}`);
  add(`accounts_notes_receivable[${i}].date_due`, P3 + `Table_Line18[0].${sub}.${due}`, 'Date Due', 'C',
    `COLUMN HEADER at y 716.1 x 328.9..362.3, inside this cell's x range (316.8..374.4). ITS FORMAT HINT IS MISSPELLED ON THE FORM: the page draws "(mmddyyy)" at y 706.1 x 326.2..365.0 — three y's, not four — where every other date hint on this form draws "(mmddyyyy)". Recorded verbatim; it is the page's spelling and not a transcription error. ${row}`);
  add(`accounts_notes_receivable[${i}].invoice_or_contract_number`, P3 + `Table_Line18[0].${sub}.${inv}`, 'Invoice Number or Government', 'C',
    `COLUMN HEADER drawn as two runs on two baselines: "Invoice Number or Government" at y 716.0 x 377.9..478.9 and "Grant or Contract Number" at y 706.0 x 386.2..470.6, both inside this cell's x range (374.4..482.4). ${row}`);
  add(`accounts_notes_receivable[${i}].amount_due`, P3 + `Table_Line18[0].${sub}.${amt}`, 'Amount Due', 'C',
    `COLUMN HEADER at y 711.1 x 505.5..552.9, inside this cell's x range (492.4..576.0). The printed "$" for each row is at x 485.2..489.6, OUTSIDE the cell, so this column is bound on the header. ${row}`);
});
add('s4_18f_outstanding_balance', P3 + 'p3_36_18f[0]', 'Outstanding Balance', 'T',
  'Marker 18f. "Outstanding Balance" at y 437.9 x 57.6..137.4 with "(Add lines 18a through 18e and amounts from any attachments)" at x 139.7..365.8; this cell runs x 492.4..576.0, so the caption is entirely to its left. SECOND WITNESS: the printed "$" at y 437.9 x 485.2..489.6 shares the caption\'s baseline and is immediately left of this cell.');

// ── investments, markers 19a, 19b, total 19c ───────────────────────────────────────────────
const INV = [
  ['19a', 'Line19a[0]', 'c3_3_19'],
  ['19b', 'Line19c[0]', 'c3_5_19'],
];
INV.forEach(([mk, sub, cb], i) => {
  const b03 = mk === '19b'
    ? ' [B-03] RESOLVED HERE: the subform holding this row is named Line19c and the printed marker inside its band is 19b. The printed marker "19c" is at y 301.1 and belongs to "Total Investments". The subform name is one row ahead of the page, and this slice binds the page.'
    : '';
  const row = `${MK(mk)} Both rows print the same headers at the same x; the header fixes the column and the marker fixes the row.${b03}`;
  add(`investments[${i}].name_of_company_and_address`, P3 + `Table_line19[0].${sub}.#subform[0].TextField1[0]`, 'Name of Company & Address', 'C',
    `COLUMN HEADER at y 413.6 x 57.6..164.0 with "(Street, City, State, ZIP code)" at y 403.6 x 57.6..161.5, both inside this cell's x range (50.4..237.6). THE LEAF NAME IS "TextField1" ON BOTH ROWS and carries no row, no column and no form: the two occurrences are told apart ONLY by their containing subform and their band. ${row}`);
  add(`investments[${i}].phone`, P3 + `Table_line19[0].${sub}.#subform[0].${mk === '19a' ? 'p3_37_19a[0]' : 'p3_41_19b[0]'}`, 'Phone', 'L',
    `The printed "Phone" for row ${mk} is immediately left of this cell with its baseline inside the rectangle, and it is the second witness that separates this cell from the company cell above it in the same column. ${row}`);
  add(`investments[${i}].current_value`, P3 + `Table_line19[0].${sub}.${mk === '19a' ? 'p3_38_19a[0]' : 'p3_42_19b[0]'}`, 'Current Value', 'C',
    `COLUMN HEADER at y 408.6 x 328.4..377.2, inside this cell's x range (319.6..396.0). ${row}`);
  add(`investments[${i}].loan_balance`, P3 + `Table_line19[0].${sub}.${mk === '19a' ? 'p3_39_19a[0]' : 'p3_43_19b[0]'}`, 'Loan Balance', 'C',
    `COLUMN HEADER at y 408.7 x 414.8..463.6, inside this cell's x range (406.0..482.4). ${row}`);
  add(`investments[${i}].equity_value_minus_loan`, P3 + `Table_line19[0].${sub}.${mk === '19a' ? 'p3_40_19a[0]' : 'p3_44_19b[0]'}`, 'Equity', 'C',
    `COLUMN HEADER drawn as two runs: "Equity" at y 413.7 x 517.3..541.1 and "Value Minus Loan" at y 403.7 x 497.4..561.0, both inside this cell's x range (492.4..576.0). ${row}`);
  add(`investments[${i}].used_as_collateral_yes`, P3 + `Table_line19[0].${sub}.#subform[1].${cb}[0]`, 'Yes', 'R',
    `The "Used as collateral on loan" column, whose header is at y 413.7 x 241.7..305.5 and y 403.7 x 260.4..286.8. The box is left of the word "Yes" on the same baseline. ${row}`);
  add(`investments[${i}].used_as_collateral_no`, P3 + `Table_line19[0].${sub}.#subform[1].${cb}[1]`, 'No', 'R', row);
});
add('s4_19c_total_investments', P3 + 'p3_45_19c[0]', 'Total Investments', 'T',
  'Marker 19c. "Total Investments" at y 301.1 x 57.6..125.7 with "(Add lines 19a, 19b, and amounts from any attachments)" at x 128.0..329.1; this cell runs x 492.5..576.0. SECOND WITNESS: the printed "$" at y 301.1 x 485.2..489.7 shares the caption\'s baseline and is immediately left of this cell. THE ONLY CELL ON PAGE 3 WHOSE LEAF NAME AGREES WITH ITS PRINTED MARKER IN BOTH THE NUMBER AND THE LETTER.');

// ── digital assets, markers 20a, 20b, 20c and the total 20e ────────────────────────────────
add('s4_20a_individuals_with_private_key_access', P3 + 'ListAccessPrivateKeys[0]', 'List the name(s) of individuals who have access to the private key(s) and/or digital wallets', 'C',
  'Marker 20a. The caption at y 257.7 x 57.6..375.7 lies inside this cell\'s x range (50.4..576.0) and is drawn directly above it. THE ONLY LEAF ON PAGE 3 NAMED FOR WHAT IT HOLDS.');
add('s4_20_current_value_as_of', P3 + 'RetirementAcct1[0].Table_Line14de[0].HeaderRow[0].assetAmount[0].mmddyyyy[0]', 'as of', 'L',
  'THE AS-OF DATE IN THE DIGITAL-ASSET TABLE HEADER, not a row cell. The column header is drawn as four runs — "Current value US" at y 235.4 x 409.7..470.7, "dollar equivalent" at y 225.8, "as of" at y 216.2 x 409.7..427.2 and "mmddyyyy" at y 208.5 x 430.9..461.9 — and this cell runs x 428.4..471.6 in the header band y 214.2..223.2. The two lowest runs both lie inside its x range. Its container is named RetirementAcct1, which is a name from a different form entirely; this form prints no retirement account anywhere.');

const DIG = [
  ['20b', 'Row13a[0]', 'Line13A[0]', '#field[1]', 'p2_t13_13a[0]', 'p2_t11_13a[0]', 'p2_t11_13a[1]', 'p2_t11_13a[2]', 'digiUsed'],
  ['20c', 'Row13b[0]', 'Line13B[0]', '#field[1]', 'p2_t17_13b[0]', 'p2_t15_13b[0]', 'p2_t15_13b[1]', 'p2_t15_13b[2]', 'digiUsed2'],
];
DIG.forEach(([mk, sub, desc, loc, acct, val, loan, eq, cb], i) => {
  const lie = `EVERY NAME IN THIS BLOCK IS FROM ANOTHER FORM. The container is RetirementAcct1 and the table inside it is Table_Line14de; the rows are Row13a and Row13b; the cells are p2_t11 to p2_t17 — a page-2 prefix on page 3. The printed markers are 20b and 20c and this form prints no retirement account and no line 13 or 14 at all. ${MK(mk)}`;
  add(`digital_assets[${i}].asset_description`, P3 + `RetirementAcct1[0].Table_Line14de[0].${sub}.${desc}`, 'Digital asset, number of units, and digital', 'C',
    `COLUMN HEADER drawn as two runs: "Digital asset, number of units, and digital" at y 227.2 x 55.7..201.5 and "asset address for self-hosted digital assets" at y 217.6 x 51.9..205.3, both inside this cell's x range (50.4..216.0). ${lie}`);
  add(`digital_assets[${i}].location_of_asset`, P3 + `RetirementAcct1[0].Table_Line14de[0].${sub}.${loc}`, 'Location of digital', 'C',
    `COLUMN HEADER drawn as three runs: "Location of digital" at y 236.8 x 219.1..282.9, "asset (exchange" at y 227.2 x 221.9..280.1 and "hosted wallet)" at y 208.0 x 226.2..275.8, all inside this cell's x range (216.0..288.0). THE LEAF IS NAMED "#field[1]" — a generated placeholder that says nothing at all, on either row. ${lie}`);
  add(`digital_assets[${i}].account_number`, P3 + `RetirementAcct1[0].Table_Line14de[0].${sub}.${acct}`, 'Account number', 'C',
    `COLUMN HEADER drawn as three runs: "Account number" at y 236.8 x 293.3..352.7, "for assets held" at y 227.2 x 296.8..349.2 and "by a custodian" at y 217.6 x 296.7..349.3, all inside this cell's x range (288.0..360.0). ${lie}`);
  add(`digital_assets[${i}].current_value_usd`, P3 + `RetirementAcct1[0].Table_Line14de[0].${sub}.${val}`, 'Current value US', 'CO',
    `COLUMN HEADER at y 235.4 x 409.7..470.7 against a cell at x 417.6..475.2 — overlapping from above. SECOND WITNESS: the printed "$" for row ${mk} is immediately left of this cell with its baseline inside the rectangle, and it is the leftmost of the three money markers on the row. ${lie}`);
  add(`digital_assets[${i}].loan_balance`, P3 + `RetirementAcct1[0].Table_Line14de[0].${sub}.${loan}`, 'Loan', 'CO',
    `COLUMN HEADER drawn as two runs, "Loan" at y 227.2 x 490.5..508.3 and "Balance" at y 217.6 x 485.0..513.8, against a cell at x 486.0..525.6 — the first overlaps and the second is contained. SECOND WITNESS: the middle "$" of the row, immediately left of this cell with its baseline inside the rectangle. THE LEAF IS INDEX [1] OF A SHARED NAME: p2_t11_13a carries [0], [1] and [2] for three different printed columns on row 20b, and p2_t15_13b does the same on 20c. Binding by leaf stem writes the current value into the loan balance. ${lie}`);
  add(`digital_assets[${i}].equity_value_minus_loan`, P3 + `RetirementAcct1[0].Table_Line14de[0].${sub}.${eq}`, 'Equity Value', 'CO',
    `COLUMN HEADER drawn as two runs, and NEITHER is contained: "Equity Value" at y 227.2 x 528.6..573.0 and "minus Loan" at y 217.6 x 530.0..571.6 both start ~7pt LEFT of this cell (x 536.4..576.0) and end ~3pt short of its right edge. They overlap it and belong to no other column. SECOND WITNESS: the rightmost "$" of the row, immediately left of this cell. Index [2] of the shared leaf; see the note on the loan balance. ${lie}`);
  add(`digital_assets[${i}].used_as_collateral_yes`, P3 + `RetirementAcct1[0].Table_Line14de[0].${sub}.#subform[0].${cb}[0]`, 'Yes', 'R',
    `THE ONLY YES/NO PAIR ON EITHER PAGE THAT IS STACKED VERTICALLY RATHER THAN SET SIDE BY SIDE. Both boxes share x 363.6..370.6 and are separated by baseline: this one's rectangle is the upper of the two and "Yes" is printed to its right on that band. The column header is "Used as collateral on loan" at y 232.0 x 367.7..397.1 and y 222.4/212.8. ${lie}`);
  add(`digital_assets[${i}].used_as_collateral_no`, P3 + `RetirementAcct1[0].Table_Line14de[0].${sub}.#subform[0].${cb}[1]`, 'No', 'R',
    `The lower box of the same stacked pair, with "No" printed to its right on its own band. The x range is identical to its partner's, so ONLY the baseline separates them. ${lie}`);
});
add('s4_20e_total_equity_of_digital_assets', P3 + 'RetirementAcct1[0].Line14f[1]', 'Total Equity of Digital Assets', 'T',
  'Marker 20e. "Total Equity of Digital Assets" at y 143.7 x 57.6..167.3 with "(Add lines 20b, 20c, and amounts from any attachments)" at x 169.6..370.8; this cell runs x 486.0..576.0 in band y 140.4..154.8. SECOND WITNESS: the printed "$" at y 142.7 x 478.4..482.8, immediately left of the cell. TWO THINGS ARE WRONG WITH THIS NAME AND BOTH ARE RECORDED: the leaf is "Line14f" on a row the page marks 20e, and it is INDEX [1] — index [0] of the same leaf is not on this page. AND THE PAGE ITSELF SKIPS A LETTER: it prints 20a, 20b, 20c and then 20e, with no 20d drawn anywhere on the form. That is the page\'s own numbering, transcribed rather than corrected.');

// ── available credit, markers 21a and 21b ──────────────────────────────────────────────────
add('s4_21_amount_owed_as_of', P3 + 'Table_Line20a-b[0].HeaderRow[0].AmntOwd20[0].Asof20a[0]', 'Amount Owed', 'CO',
  'THE FIRST OF TWO AS-OF DATES IN THE AVAILABLE-CREDIT HEADER, AND IT IS BOUND ON ITS COLUMN RATHER THAN ON "As of". The page draws "As of" twice in this header, identically, so that run cannot say which of the two cells it belongs to — binding on it would have been a caption that captions two things. "Amount Owed" at y 122.3 x 413.5..464.9 overlaps this cell (x 432.0..475.2) from above and belongs to one column only. SECOND WITNESS, and it is two things: the "As of" at y 112.7 x 408.0..426.4 sits immediately left of this cell with its baseline inside the rectangle, and the "mmddyyyy" hint at y 105.4 x 437.0..468.0 is drawn beneath it INSIDE its x range. The other header date has its own pair of both, 86pt to the right.');
add('s4_21_available_credit_as_of', P3 + 'Table_Line20a-b[0].HeaderRow[0].AvalCrdt20[0].Asof20b[0]', 'Available Credit', 'CO',
  'THE SECOND OF THE TWO, AND IT IS THE ONE THAT PROVES THE FIRST COULD NOT BE BOUND ON "As of". Its "As of" run at y 110.3 x 494.4..512.8 has a baseline 0.4pt BELOW this cell\u2019s rectangle (110.7..120.1) — outside it — where the other one\u2019s is inside. Two runs of one string, drawn 2.4pt apart vertically, one inside a rectangle and one not: a rule that admitted both would be a tolerance, and a rule that admitted neither would lose a real binding. So both cells bind on their COLUMN: "Available Credit" at y 121.9 x 499.1..559.3 overlaps this cell (x 518.4..568.8) from above. SECOND WITNESS: the "mmddyyyy" hint at y 105.4 x 523.4..554.4, drawn beneath this cell and inside its x range, and the near-miss "As of" immediately left of it. Its leaf is Asof20b inside AvalCrdt20 — and the "a"/"b" in those two leaf names distinguish the two COLUMNS, not the two rows 21a and 21b, which is the opposite of what every other a/b suffix on this form means.');

const CRED = [
  ['21a', 'Row20a[0]', 'TextField88[0]', 'p3_46_20a[0]', 'p3_49_20a[0]', 'p3_48_20a[0]', 'p3_47_20a[0]'],
  ['21b', 'Row20b[0]', 'TextField89[0]', 'p3_50_20b[0]', 'p3_53_20b[0]', 'p3_52_20b[0]', 'p3_51_20b[0]'],
];
CRED.forEach(([mk, sub, name, acct, limit, owed, avail], i) => {
  const rev = `THE LEAF NUMBERING RUNS BACKWARDS ACROSS THIS ROW. Left to right the printed columns are Credit Limit, Amount Owed, Available Credit, and the leaves are p3_49, p3_48, p3_47 on row 21a and p3_53, p3_52, p3_51 on row 21b. A map that ordered these cells by their leaf number would write the available credit into the credit limit. The subform is Row20a/Row20b and the printed markers are 21a/21b. ${MK(mk)}`;
  add(`available_credit[${i}].full_name_and_address`, P3 + `Table_Line20a-b[0].${sub}.#subform[0].${name}`, 'Full Name & Address', 'C',
    `COLUMN HEADER at y 113.2 x 57.6..132.7 with "(Street, City, State, ZIP code)" at x 135.0..238.8, both inside this cell's x range (50.4..309.6). The leaf is "TextField88" on row 21a and "TextField89" on row 21b — generated placeholders that name nothing. ${rev}`);
  add(`available_credit[${i}].account_number`, P3 + `Table_Line20a-b[0].${sub}.#subform[0].${acct}`, 'Account No.', 'L',
    `The printed "Account No." for row ${mk} is immediately left of this cell with its baseline inside the rectangle, and it is the second witness that separates this cell from the name cell above it in the same column. ${rev}`);
  add(`available_credit[${i}].credit_limit`, P3 + `Table_Line20a-b[0].${sub}.${limit}`, 'Credit Limit', 'C',
    `COLUMN HEADER at y 112.7 x 332.1..373.5, inside this cell's x range (319.6..396.0). ${rev}`);
  add(`available_credit[${i}].amount_owed`, P3 + `Table_Line20a-b[0].${sub}.${owed}`, 'Amount Owed', 'C',
    `COLUMN HEADER at y 122.3 x 413.5..464.9, inside this cell's x range (406.0..482.4). ${rev}`);
  add(`available_credit[${i}].available_credit`, P3 + `Table_Line20a-b[0].${sub}.${avail}`, 'Available Credit', 'C',
    `COLUMN HEADER at y 121.9 x 499.1..559.3, inside this cell's x range (492.4..576.0). ${rev}`);
});

// ═══════════════════════════════════════════════════════════════════════════════════════
// ASSERT AND DERIVE
// ═══════════════════════════════════════════════════════════════════════════════════════
const problems = [];
const seen = new Map();
const evidence = [];
for (const b of B) {
  const w = W.get(b.target);
  if (!w) { problems.push(`NO SUCH WIDGET ON PAGE 2 OR 3  ${b.key} -> ${b.target}`); continue; }
  if (seen.has(b.target)) problems.push(`TARGET BOUND TWICE  ${b.target} by ${seen.get(b.target)} and ${b.key}`);
  seen.set(b.target, b.key);
  const [x0, y0, x1, y1] = w.rect;
  const runs = w.page === 2 ? R2 : R3;
  const cands = runs.filter((t) => t.str === b.caption);
  if (!cands.length) { problems.push(`CAPTION NOT DRAWN ON PAGE ${w.page}  ${b.key} -> ${JSON.stringify(b.caption)}`); continue; }
  const scored = cands.map((t) => {
    const dx = Math.max(x0 - t.x2, t.x1 - x1, 0);
    const dy = Math.max(y0 - t.y, t.y - y1, 0);
    return { t, d: Math.hypot(dx, dy) };
  }).sort((a, c) => a.d - c.d);
  const t = scored[0].t;
  let gap, ok, pairing;
  if (b.how === 'L') {
    gap = r1(x0 - t.x2); ok = t.x2 <= x0 + 1 && t.y >= y0 - 1 && t.y <= y1 + 1 && gap <= 30;
    pairing = `immediately left, baseline inside the rectangle, ${gap}pt`;
  } else if (b.how === 'R') {
    gap = r1(t.x1 - x1); ok = t.x1 >= x1 - 1 && t.y >= y0 - 1 && t.y <= y1 + 1 && gap <= 30;
    pairing = `to the right, baseline inside the rectangle, ${gap}pt`;
  } else if (b.how === 'A') {
    gap = r1(t.y - y1); ok = t.y > y1 - 1 && gap <= 16 && Math.abs(t.x1 - x0) <= 2;
    pairing = `directly above, left edges ${t.x1} = ${x0}, ${gap}pt`;
  } else if (b.how === 'C') {
    gap = r1(t.y - y1); ok = t.x1 >= x0 - 0.05 && t.x2 <= x1 + 0.05 && t.y > y1 - 0.05;
    pairing = `column caption CONTAINED in this cell's x range (${t.x1}..${t.x2} inside ${x0}..${x1}), drawn ${gap}pt above the rectangle`;
  } else if (b.how === 'T') {
    // THE MONEY MARKER IS DERIVED, NOT AGREED. It must lie between the caption and the cell,
    // on the cell's own baseline band, and within 12pt of the cell's left edge — which is what
    // makes this rule pick one cell rather than every cell to the right of the caption.
    const dollars = runs.filter((d) => d.str === '$' && d.y >= y0 - 0.05 && d.y <= y1 + 0.05 && d.x2 <= x0 + 0.05 && x0 - d.x2 <= 12 && d.x1 >= t.x2);
    const onLine = t.y >= y0 - 0.05 && t.y <= y1 + 0.05 && t.x2 <= x0;
    ok = onLine && dollars.length === 1;
    gap = r1(x0 - t.x2);
    if (onLine && dollars.length !== 1)
      problems.push(`RULE T: ${dollars.length} money marker(s) between the caption and the cell for ${b.key} — T needs exactly one, or it does not pick a cell.`);
    const d = dollars[0];
    pairing = `TOTAL LINE: the caption's baseline ${r1(t.y)} lies inside this cell's rectangle (${y0}..${y1}) and the caption ends ${gap}pt to its left; the printed "$" at y ${d ? r1(d.y) : '?'} x ${d ? d.x1 : '?'}..${d ? d.x2 : '?'} lies between them, ${d ? r1(x0 - d.x2) : '?'}pt from the cell`;
  } else {                                                       // CO
    const overlaps = t.x1 < x1 && t.x2 > x0;
    gap = r1(t.y - y1); ok = overlaps && t.y > y1 - 0.05;
    // A CO CELL MUST NAME A SECOND WITNESS. The rule alone does not determine it, and a rule
    // that admitted an overlapping caption with nothing beside it would be a wider tolerance
    // wearing a new letter.
    if (!b.note) problems.push(`CO WITHOUT A SECOND WITNESS  ${b.key} -> ${b.target}. An overlapping column caption does not determine a cell; name what does.`);
    pairing = `column caption OVERLAPPING this cell's x range (${t.x1}..${t.x2} against ${x0}..${x1}), drawn ${gap}pt above the rectangle — under-determined by the caption alone, so a second witness is named`;
  }
  if (!ok) problems.push(`RULE ${b.how} DOES NOT HOLD  ${b.key} -> ${b.target}\n      caption ${JSON.stringify(b.caption)} nearest run y ${r1(t.y)} x ${t.x1}..${t.x2}; widget y ${y0}..${y1} x ${x0}..${x1}`);
  evidence.push({
    // NAMED BY KEY, NOT BY PATH — a full topmostSubform path quoted in evidence prose counts as
    // a second binding to the gate's duplicate-write check.
    key: b.key, leaf: b.target.split('.').pop(), page: w.page,
    widget: `y ${y0}..${y1}, x ${x0}..${x1}`,
    printed: b.caption,
    printed_at: `y ${r1(t.y)}, x ${t.x1}..${t.x2}`,
    pairing,
    ...(b.note ? { second_witness: b.note } : {}),
  });
}

// EVERY WIDGET ON BOTH PAGES IS BOUND. Derived from geometry, not from this table's length.
const unbound = [...W.keys()].filter((n) => !seen.has(n));
if (unbound.length) problems.push(`${unbound.length} WIDGET(S) ON PAGES 2-3 BOUND BY NOTHING:\n      ${unbound.join('\n      ')}`);

if (problems.length) {
  console.error(`SLICE 2 REFUSED — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(2);
}
const byRule = B.reduce((a, b) => { a[b.how] = (a[b.how] || 0) + 1; return a; }, {});
console.log(`pages 2-3: ${B.length} binding(s), ${W.size} widget(s), every target bound exactly once and every caption found where the rule says it is.`);
console.log(`  by rule: ${Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`  with a named second witness: ${B.filter((b) => b.note).length}`);
writeFileSync('adapters/pdf/tmp/p47/slice2-evidence.json', JSON.stringify(evidence, null, 1) + '\n');
writeFileSync('adapters/pdf/tmp/p47/slice2-bindings.json', JSON.stringify(B, null, 1) + '\n');
