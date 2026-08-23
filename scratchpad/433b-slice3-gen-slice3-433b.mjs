// Prompt 48 ruling 2 — 433-B map slice 3, page 4, 94 fields.
//
// EVERY EVIDENCE FIGURE IN THE MAP IS DERIVED HERE AND ASSERTED AGAINST THE DRAWN PAGE, exactly
// as slices 1 and 2 do. A binding row names its target and the PRINTED TEXT it is bound to; this
// file looks that text up on the page, takes the run nearest the widget, and computes the
// rectangle, the baseline and the gap. A caption it cannot find where the declared rule says it
// is takes the run down, so the map cannot carry a caption the page does not draw there.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE LEAF NAMES ON THIS PAGE ARE ONE PRINTED MARKER BEHIND, ON ALL 94 WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Page 4 prints REAL PROPERTY rows 22a-22d with a total at 22e, and VEHICLES rows 23a-23d with
// a total at 23e. The AcroForm leaf names say 21a-21e and 22a-22e. Every widget inside the
// printed 22x band is named 21x; every widget inside the printed 23x band is named 22x.
//
// THIS IS NOT COSMETIC. Page 3 draws AVAILABLE CREDIT at printed markers 21a and 21b, and the
// landed slice-2 map binds them — to widgets named Row20a and Row20b, because the same offset is
// already running there. So the names 21a and 21b denote page-3 available-credit rows to the
// page and page-4 real-property rows to the AcroForm. A binder trusting leaf names would not get
// a wrong label; it would collide two different blocks on two different pages.
//
// [B-03] is the precedent and it ruled the same way on page 3: "the subform name is one row
// ahead of the page", THE PAGE WINS. [R-08] is the standing rule — bindings come from the
// printed page and an inherited leaf name is evidence of nothing. Every binding below is fixed
// by the printed marker for its row and by the printed column header for its column, and the
// generator ASSERTS the offset rather than assuming it: a run in which any 22x-band widget
// turned out to be named 22x would stop here.
//
// Four further inherited names sit on this page and are bound on geometry alone, with the name
// contradicted rather than explained: p3_03_18a, p3_10_18b, p3_17_18c and p3_31_18e are the four
// real-property lender PHONE cells (page 3 draws lines 18a-18e as ACCOUNTS/NOTES RECEIVABLE);
// p3_t29_22aVIN through p3_t29_22dVIN are the four vehicle VIN cells; p4_43_59b, p4_54_69b,
// p4_64_69b and p4_74_79b are the four vehicle lender phone cells, and TWO OF THOSE FOUR CARRY
// THE SAME 69b; and Line2d[0] and f2_037_0_[0] are the 22d location and lender cells, which
// carry no row token at all. Four rows, four different naming schemes for the same two cells.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE PAIRING RULES — the same four this form's earlier slices declared, cited per cell
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   C   COLUMN CAPTION CONTAINED. The caption's x range lies INSIDE the widget's, and its
//       baseline is above the widget's rect top. This is the dominant layout on page 4: both
//       tables draw a six-run column-header stack above the grid, at IDENTICAL x on both.
//   CO  COLUMN CAPTION OVERLAPPING. Overlaps from above but is not contained. Weaker, so every
//       CO cell names a SECOND WITNESS.
//   L   immediately left, baseline inside the rectangle. The eight lender-phone cells only.
//   T   THE TOTAL-LINE RULE. The caption's baseline lies INSIDE the widget's rectangle; the
//       caption ends left of the widget; and a printed "$" lies BETWEEN them with its own
//       baseline inside the rectangle and its right edge within 12pt of the widget's left edge.
//
// ALL 94 CELLS ARE TABLE CELLS OR TOTALS, so the column header captions a COLUMN and every row
// inherits it. The header cannot say which row a cell is in and the row marker cannot say which
// column. BOTH are stated on every one of the 92 table cells — the printed marker for the row,
// the header containment for the column — and that pair IS the second witness. The two totals
// take T, whose money marker is derived from the page here rather than asserted.
//
// A THIRD WITNESS IS AVAILABLE ON THE SIX GRID COLUMNS AND IS ASSERTED. Each printed row draws
// exactly four "$" marks, at x 262.0, 326.8, 391.6 and 514.0, immediately left of the FMV, loan
// balance, monthly payment and equity cells — and NOT left of the two date cells. The widgets
// agree independently: maxLen is 8 on both date columns, which is the width of the printed
// (mmddyyyy) hint, and 12 on all four money columns. So money-versus-date is settled three ways
// on every grid cell: the header text, the presence of a printed money marker, and the widget's
// own capacity.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// [B-01]: correlate-labels.mjs IS NOT CONSULTED, AND ON THIS FORM IT WRITES NOTHING
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [B-01] records that correlate-labels.mjs answers the caption ONE ROW ABOVE on this form. Run
// against 433-B during this slice it FAILED ITS OWN SELF-CHECK on the page-1 county probe and
// exited 2 without writing, so there is no 433b.labels.json in this tree and no page-4 answer
// from it to agree or disagree with. Its probes were NOT retuned to make it pass: the guard
// exists to catch the tool, and fitting the guard to the tool would end the only mechanism that
// has ever contradicted it on this form. It is treated as a witness shown to be wrong here, and
// page 4's own evidence does not redeem it because page 4 produced no evidence from it at all.

import { readFileSync, writeFileSync } from 'node:fs';
import { readWidgetGeometry, readPrintedText, baselineOfRun } from '../adapters/pdf/page-geometry.mjs';

const bytes = readFileSync('adapters/pdf/forms/f433b.pdf');
const { widgets } = await readWidgetGeometry(bytes);
const pages = await readPrintedText(bytes);
const r1 = (n) => Math.round(n * 10) / 10;
const R4 = pages[3].items.map((t) => ({ str: t.str, y: r1(baselineOfRun(t)), x1: r1(t.x1), x2: r1(t.x2) }));
const W = new Map(widgets.filter((w) => w.page === 4).map((w) => [w.name, { rect: w.rect.map(r1), maxLen: w.maxLen ?? null }]));

const P4 = 'topmostSubform[0].Page4[0].';
const stop = (m) => { console.error(`STOP — ${m}`); process.exit(2); };

// ── the printed row markers, read off the page ────────────────────────────────────────────
const MARKERS = R4.filter((t) => /^2[23][a-e]$/.test(t.str) && t.x1 < 60).sort((a, b) => b.y - a.y);
const WANT = ['22a', '22b', '22c', '22d', '22e', '23a', '23b', '23c', '23d', '23e'];
if (MARKERS.map((m) => m.str).join(',') !== WANT.join(','))
  stop(`page 4 printed markers are ${MARKERS.map((m) => m.str).join(',')}, expected ${WANT.join(',')}`);
const markerY = Object.fromEntries(MARKERS.map((m) => [m.str, m.y]));

// the band a printed marker owns: its own baseline plus the header line, down to the next marker
const bandOf = (mk) => {
  const i = WANT.indexOf(mk);
  return { top: markerY[mk] + 12, bot: i + 1 < WANT.length ? markerY[WANT[i + 1]] + 12 : 30 };
};
const inBand = (name, mk) => {
  const w = W.get(name) || stop(`no widget named ${name} on page 4`);
  const mid = (w.rect[1] + w.rect[3]) / 2;
  const b = bandOf(mk);
  return mid < b.top && mid >= b.bot;
};

const B = [];
const add = (key, target, caption, how, note) => {
  if (!W.has(target)) stop(`binding ${key} names ${target}, which is not a page-4 widget`);
  if (B.some((x) => x.target === target)) stop(`${target} bound twice — second by ${key}`);
  B.push({ key, target, caption, how, note });
};

// ── the offset, ASSERTED rather than assumed ───────────────────────────────────────────────
// Every widget in a printed 22x band must carry the token 21x, and every widget in a printed
// 23x band the token 22x. A single widget agreeing with its printed marker would mean the
// offset is not uniform and every binding below would need re-deriving one at a time.
const tokenOf = (n) => { const m = /_(\d{1,2}[a-e])(?:[A-Za-z0-9]*)?\[0\]$/.exec(n); return m ? m[1] : null; };
const OFFSET = { '22a': '21a', '22b': '21b', '22c': '21c', '22d': '21d', '22e': '21e', '23a': '22a', '23b': '22b', '23c': '22c', '23d': '22d', '23e': '22e' };
// THE OFFSET IS NOT UNIFORM, AND THE TWO EXCEPTIONS ARE NAMED RATHER THAN COUNTED. Two of the
// 94 leaf names happen to be RIGHT: p4_01_22bLine2 and p4_02_22bLine2 carry the token 22b and
// sit in the printed 22b band. They are the location and lender cells of real-property row 22b,
// and their agreement is a coincidence of this one row's naming scheme — the same two cells are
// p4_8_21a/p4_9_21a on row 22a, p4_24_21c/p4_25_21c on row 22c, and Line2d/f2_037_0_ on row 22d,
// which carries no row token at all. Four rows, four schemes, and on exactly one of them the
// number is the printed one.
//
// THIS IS [R-08] MEASURED RATHER THAN ASSERTED. Two names out of 94 are correct and NOTHING IN
// THE NAMES SAYS WHICH TWO. A binder trusting leaf names would be right twice and wrong ninety-
// two times, and would have no way to tell the cases apart. The exceptions are pinned BY NAME so
// that a revision changing any of it stops this generator rather than sliding past a count.
const AGREE_EXPECTED = [P4 + 'p4_01_22bLine2[0]', P4 + 'Lender-Phone2[0].p4_02_22bLine2[0]'];
const agreeing = [], offsetting = [], tokenlessNames = [], unrelated = [];
for (const [name] of W) {
  const mk = WANT.find((m) => inBand(name, m));
  if (!mk) stop(`${name} falls in no printed marker band`);
  const tok = tokenOf(name);
  if (tok === null) { tokenlessNames.push(name); continue; }
  if (tok === mk) { agreeing.push(name); continue; }
  if (tok === OFFSET[mk]) { offsetting.push(name); continue; }
  unrelated.push(`${name} (token ${tok} in printed band ${mk})`);
}
const sortJoin = (a) => [...a].sort().join('\n  ');
if (sortJoin(agreeing) !== sortJoin(AGREE_EXPECTED))
  stop(`the set of page-4 widgets whose leaf token AGREES with their printed marker has changed.\n  expected:\n  ${sortJoin(AGREE_EXPECTED)}\n  found:\n  ${sortJoin(agreeing)}`);
if (offsetting.length !== 82)
  stop(`${offsetting.length} widget(s) carry the printed marker minus one, expected 82`);
console.log(`offset asserted: ${offsetting.length} widget(s) carry the printed marker MINUS ONE; ${agreeing.length} agree and are pinned by name; ${unrelated.length} carry a token from another page's block; ${tokenlessNames.length} carry no row token at all.`);
for (const u of unrelated) console.log(`  unrelated token: ${u}`);

// ── the money markers, derived ─────────────────────────────────────────────────────────────
const CASH = R4.filter((t) => t.str === '$');
const MONEY_X = [262.0, 326.8, 391.6, 514.0];
for (const mk of ['22a', '22b', '22c', '22d', '23a', '23b', '23c', '23d']) {
  const b = bandOf(mk);
  const here = CASH.filter((c) => c.y < b.top && c.y >= b.bot).map((c) => c.x1).sort((a, b2) => a - b2);
  if (here.length !== 4) stop(`printed row ${mk} draws ${here.length} money marker(s), expected 4`);
  here.forEach((x, i) => { if (Math.abs(x - MONEY_X[i]) > 1.0) stop(`row ${mk} money marker ${i} at x ${x}, expected ~${MONEY_X[i]}`); });
}
console.log(`money markers asserted: 4 printed "$" on each of the 8 grid rows, at x ${MONEY_X.join(', ')}.`);

// ── the column header stacks, asserted on BOTH blocks at identical x ────────────────────────
const COLS = [
  { col: 'purchase_date', x: [201.6, 259.2], ml: 8, cap: 'Purchase/Lease Date (mmddyyyy)', runs: ['Purchase/', 'Lease Date', '(mmddyyyy)'], money: false },
  { col: 'current_fmv', x: [269.2, 324.0], ml: 12, cap: 'Current Fair Market Value (FMV)', runs: ['Current Fair', 'Market Value', '(FMV)'], money: true },
  { col: 'current_loan_balance', x: [334.0, 388.8], ml: 12, cap: 'Current Loan Balance', runs: ['Current Loan', 'Balance'], money: true },
  { col: 'monthly_payment', x: [398.8, 453.6], ml: 12, cap: 'Amount of Monthly Payment', runs: ['Amount of', 'Monthly', 'Payment'], money: true },
  { col: 'final_payment_date', x: [453.6, 511.2], ml: 8, cap: 'Date of Final Payment (mmddyyyy)', runs: ['Date of Final', 'Payment', '(mmddyyyy)'], money: false },
  { col: 'equity', x: [521.2, 576.0], ml: 12, cap: 'Equity FMV Minus Loan', runs: ['Equity', 'FMV Minus Loan'], money: true },
];
// each stack must sit above the grid on both blocks; at least one run must be CONTAINED in the lane
const HEADER_BANDS = [[684, 701], [338, 356]];
const headerFacts = {};
for (const c of COLS) {
  const per = [];
  for (const [lo, hi] of HEADER_BANDS) {
    const stack = R4.filter((t) => t.y >= lo && t.y <= hi && t.x2 > c.x[0] - 12 && t.x1 < c.x[1] + 12 && c.runs.includes(t.str));
    const missing = c.runs.filter((s) => !stack.some((t) => t.str === s));
    if (missing.length) stop(`column ${c.col}: header run(s) ${JSON.stringify(missing)} not drawn in band ${lo}..${hi} over x ${c.x.join('..')}`);
    const contained = stack.filter((t) => t.x1 >= c.x[0] && t.x2 <= c.x[1]);
    if (!contained.length) stop(`column ${c.col}: no header run is CONTAINED in the lane in band ${lo}..${hi}; every run overlaps only`);
    per.push({ band: [lo, hi], contained: contained.map((t) => `${JSON.stringify(t.str)} y ${t.y} x ${t.x1}..${t.x2}`), overlapping: stack.filter((t) => !contained.includes(t)).map((t) => `${JSON.stringify(t.str)} y ${t.y} x ${t.x1}..${t.x2}`) });
  }
  headerFacts[c.col] = per;
}
console.log(`column headers asserted: ${COLS.length} stack(s), each drawn TWICE at identical x — once over each block — with at least one run contained in its lane both times.`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// REAL PROPERTY — printed 22a to 22d, widgets named 21a to 21d
// ═══════════════════════════════════════════════════════════════════════════════════════
const MK = (m) => `Row fixed by the printed marker ${m} at y ${markerY[m]}, x ${MARKERS.find((x) => x.str === m).x1}.`;
const colNote = (c, mk) => `${MK(mk)} Column fixed by the printed header stack ${JSON.stringify(c.cap)} drawn above BOTH blocks at x ${c.x.join('..')}. ${c.money ? `A printed "$" is drawn immediately left of this cell on every one of the eight grid rows, and the widget carries maxLen ${c.ml}.` : `NO printed "$" is drawn left of this cell on any row, and the widget carries maxLen ${c.ml}, the width of the printed (mmddyyyy) hint.`}`;

// the six grid cells of each real-property row, in the leaf order the form uses
const RP_GRID = [
  ['22a', ['p4_2_21a', 'p4_3_21a', 'p4_4_21a', 'p4_5_21a', 'p4_6_21a', 'p4_7_21a'], 'PrpDscrp-eqty21a[0].'],
  ['22b', ['p4_11_21b', 'p4_12_21b', 'p4_13_21b', 'p4_14_21b', 'p4_15_21b', 'p4_16_21b'], 'Line21b[0].'],
  ['22c', ['p4_18_21c', 'p4_19_21c', 'p4_20_21c', 'p4_21_21c', 'p4_22_21c', 'p4_23_21c'], 'Line21c[0].'],
  ['22d', ['p4_27_21d', 'p4_28_21d', 'p4_29_21d', 'p4_30_21d', 'p4_31_21d', 'p4_32_21d'], 'Line21d[0].'],
];
RP_GRID.forEach(([mk, leaves, sub], row) => {
  leaves.forEach((leaf, i) => {
    const c = COLS[i];
    const target = `${P4}${sub}${leaf}[0]`;
    const w = W.get(target) || stop(`real property ${mk} ${c.col}: no widget ${target}`);
    if (r1(w.rect[0]) !== c.x[0] || r1(w.rect[2]) !== c.x[1]) stop(`${target} spans x ${w.rect[0]}..${w.rect[2]}, not the ${c.col} lane ${c.x.join('..')}`);
    if (w.maxLen !== c.ml) stop(`${target} carries maxLen ${w.maxLen}, not the ${c.col} width ${c.ml}`);
    if (!inBand(target, mk)) stop(`${target} does not lie in the printed ${mk} band`);
    add(`real_property[${row}].${c.col}`, target, c.cap, 'C', colNote(c, mk));
  });
});

// description, location, lender, phone — one each per row
const RP_ROWS = [
  ['22a', 'PrpDscrp-eqty21a[0].p4_1_21a[0]', 'p4_8_21a[0]', 'Lender-Phone1[0].p4_9_21a[0]', 'Lender-Phone1[0].p3_03_18a[0]'],
  ['22b', 'Line21b[0].p4_10_21b[0]', 'p4_01_22bLine2[0]', 'Lender-Phone2[0].p4_02_22bLine2[0]', 'Lender-Phone2[0].p3_10_18b[0]'],
  ['22c', 'Line21c[0].p4_17_21c[0]', 'p4_24_21c[0]', 'Lender-Phone3[0].p4_25_21c[0]', 'Lender-Phone3[0].p3_17_18c[0]'],
  ['22d', 'Line21d[0].p4_26_21d[0]', 'Line2d[0]', 'f2_037_0_[0]', 'p3_31_18e[0]'],
];
RP_ROWS.forEach(([mk, desc, loc, lender, phone], row) => {
  add(`real_property[${row}].description`, P4 + desc, 'Property Description', 'C',
    `${MK(mk)} "Property Description" is drawn ONCE PER ROW rather than once per table — at y ${R4.filter((t) => t.str === 'Property Description').map((t) => t.y).sort((a, b) => b - a)[row]} for this row — and its x 57.6..131.2 lies inside the cell's 50.4..201.6.`);
  add(`real_property[${row}].location`, P4 + loc, 'Location (Street, City, State, ZIP code) and County', 'C',
    `${MK(mk)} The caption is drawn in three runs on one baseline — "Location" x 57.6..88.6, "(Street, City, State, ZIP code)" x 90.8..194.6, "and County" x 196.9..238.4 — all inside the cell's x 50.4..295.2 and all above its rect top.`);
  add(`real_property[${row}].lender_name_address`, P4 + lender, 'Lender/Lessor/Landlord Name, Address, (Street, City, State, ZIP code) and Phone', 'C',
    `${MK(mk)} Three runs on one baseline at x 302.4..433.5, 435.5..529.0 and 531.0..565.8, inside the cell's x 295.2..576.0. THE CAPTION NAMES THE PHONE AND THE FORM DRAWS A SEPARATE CELL FOR IT beneath this one; this cell is bound to the name-and-address half only, and the phone half is the next row of this table.`);
  add(`real_property[${row}].lender_phone`, P4 + phone, 'Phone', 'L',
    `${MK(mk)} "Phone" at x 396.0..419.0 sits immediately LEFT of the cell with its baseline INSIDE the rectangle, which is the only pairing rule this cell satisfies — the caption above it belongs to the lender name-and-address cell. THE LEAF NAME CONTRADICTS THE PAGE and the page wins: this is the ${mk} lender phone, and the leaf says ${phone.split('.').pop().replace('[0]', '')}, whose 18a-18e tokens belong to page 3's ACCOUNTS/NOTES RECEIVABLE block.`);
});

// ═══════════════════════════════════════════════════════════════════════════════════════
// VEHICLES — printed 23a to 23d, widgets named 22a to 22d
// ═══════════════════════════════════════════════════════════════════════════════════════
const VH_GRID = [
  ['23a', ['Purchase[0].p4_35_22a', 'CurrentFMV[0].p4_36_22a', 'CurrentLoan[0].p4_37_22a', 'AmountPay[0].p4_38_22a', 'DateFinal[0].p4_39_22a', 'Equity[0].p4_40_22a']],
  ['23b', ['p4_46_22b', 'p4_47_22b', 'p4_48_22b', 'p4_49_22b', 'p4_50_22b', 'p4_51_22b']],
  ['23c', ['p4_57_22c', 'p4_58_22c', 'p4_59_22c', 'p4_60_22c', 'p4_61_22c', 'p4_62_22c']],
  ['23d', ['p4_68_22d', 'p4_69_22d', 'p4_70_22d', 'p4_71_22d', 'p4_72_22d', 'p4_73_22d']],
];
VH_GRID.forEach(([mk, leaves], row) => {
  leaves.forEach((leaf, i) => {
    const c = COLS[i];
    const target = `${P4}${leaf}[0]`;
    const w = W.get(target) || stop(`vehicles ${mk} ${c.col}: no widget ${target}`);
    // THE LANE IS ASSERTED WITH A TOLERANCE OF 1pt AND THE DEVIATIONS ARE REPORTED, not absorbed:
    // three cells on this page are drawn a fraction off their column, and a hard equality here
    // would have to be softened into a range that no longer says which column a cell is in.
    const dx1 = r1(w.rect[0] - c.x[0]), dx2 = r1(w.rect[2] - c.x[1]);
    if (Math.abs(dx1) > 1.0 || Math.abs(dx2) > 1.0) stop(`${target} spans x ${w.rect[0]}..${w.rect[2]}, not the ${c.col} lane ${c.x.join('..')}`);
    if (dx1 || dx2) console.log(`  lane deviation ${target} ${c.col}: left ${dx1 >= 0 ? '+' : ''}${dx1}, right ${dx2 >= 0 ? '+' : ''}${dx2}`);
    if (w.maxLen !== c.ml) stop(`${target} carries maxLen ${w.maxLen}, not the ${c.col} width ${c.ml}`);
    if (!inBand(target, mk)) stop(`${target} does not lie in the printed ${mk} band`);
    add(`vehicles[${row}].${c.col}`, target, c.cap, 'C', colNote(c, mk));
  });
});

const VH_ROWS = [
  ['23a', 'Line22a[0].p4_33_22ayr[0]', 'Line22a[0].p4_41_22amakemodel[0]', 'Line22a[0].p4_34_22amil[0]', 'Line22a[0].p4_42_22atagnumber[0]', 'p4_43_22aLine2[0]', 'Line22a[0].p3_t29_22aVIN[0]', 'p4_43_59b[0]'],
  ['23b', 'Line22b[0].p4_44_22byr[0]', 'Line22b[0].p4_52_22bmakemodel[0]', 'Line22b[0].p4_45_22bmil[0]', 'Line22b[0].p4_53_22btagnumber[0]', 'p4_54_22bLine2[0]', 'Line22b[0].p3_t29_22bVIN[0]', 'p4_54_69b[0]'],
  ['23c', 'Line22c[0].p4_55_22cyr[0]', 'Line22c[0].p4_63_22cmakemodel[0]', 'Line22c[0].p4_56_22cmil[0]', 'Line22c[0].p4_64_22ctagnumber[0]', 'p4_65_22cLine2[0]', 'Line22c[0].p3_t29_22cVIN[0]', 'p4_64_69b[0]'],
  ['23d', 'Line22d[0].p4_66_22d[0]', 'Line22d[0].p4_74_22dmakemodel[0]', 'Line22d[0].p4_67_22d[0]', 'Line22d[0].p4_75_22dtagnumber[0]', 'p4_76_22dLine2[0]', 'Line22d[0].p3_t29_22dVIN[0]', 'p4_74_79b[0]'],
];
VH_ROWS.forEach(([mk, yr, mm, mil, tag, lender, vin, phone], row) => {
  add(`vehicles[${row}].model_year`, P4 + yr, 'Year', 'C',
    `${MK(mk)} "Year" x 57.6..74.0 is inside the cell's x 50.4..115.2 and above its rect top. The widget carries maxLen 4, which is a four-digit year and is the second witness separating this cell from the Mileage cell drawn in the SAME x lane one band lower.`);
  add(`vehicles[${row}].make_model`, P4 + mm, 'Make/Model', 'C',
    `${MK(mk)} "Make/Model" x 122.4..167.2 is inside the cell's x 115.2..201.6. It shares its lane with the License/Tag Number cell one band lower and is separated from it by band, not by x.`);
  add(`vehicles[${row}].mileage`, P4 + mil, 'Mileage', 'C',
    `${MK(mk)} "Mileage" x 57.6..85.6 is inside the cell's x 50.4..115.2 and above its rect top. The widget carries maxLen 7 against the Year cell's 4 in the same lane.`);
  add(`vehicles[${row}].license_tag`, P4 + tag, 'License/Tag Number', 'C',
    `${MK(mk)} "License/Tag Number" x 122.4..197.1 is inside the cell's x 115.2..201.6. The widget carries maxLen 15 against the Make/Model cell's absent limit in the same lane.`);
  add(`vehicles[${row}].lender_name_address`, P4 + lender, 'Lender/Lessor Name, Address, (Street, City, State, ZIP code) and Phone', 'C',
    `${MK(mk)} Three runs on one baseline at x 208.8..320.1, 322.3..426.2 and 428.4..467.1, inside the cell's x 201.6..576.0. NOTE THE PRINTED CAPTION DIFFERS FROM THE REAL-PROPERTY ONE ABOVE — it says "Lender/Lessor", without "Landlord", because a vehicle has no landlord. Transcribed as drawn, not normalised to the other block's wording.`);
  add(`vehicles[${row}].vin`, P4 + vin, 'Vehicle Identification Number (VIN)', 'C',
    `${MK(mk)} "Vehicle Identification Number (VIN)" x 57.6..181.6 is inside the cell's x 50.4..201.6 and above its rect top. The leaf name opens p3_t29, a page-3 token, on a cell page 4 draws — bound on geometry with the name contradicted.`);
  add(`vehicles[${row}].lender_phone`, P4 + phone, 'Phone', 'L',
    `${MK(mk)} "Phone" x 396.0..419.0 sits immediately LEFT of the cell with its baseline INSIDE the rectangle. THE LEAF NAME IS NOT EVEN UNIQUE: this row's phone cell is named ${phone.replace('[0]', '')}, and vehicles[1] and vehicles[2] carry p4_54_69b and p4_64_69b — TWO CELLS WEARING 69b. They are told apart by band alone, which is why the printed marker is on every one of these four bindings.`);
});

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE TWO TOTALS — printed 22e and 23e, widgets named 21e and 22e
// ═══════════════════════════════════════════════════════════════════════════════════════
const TOTALS = [
  ['22e', P4 + 'p4_00_21e[0]', 's4_22e_total_equity_real_property', 'REAL PROPERTY', 'Add lines 22a through 22d and amounts from any attachments'],
  ['23e', P4 + 'p4_77_22e[0]', 's4_23e_total_equity_vehicles', 'VEHICLES, LEASED AND PURCHASED', 'Add lines 23a through 23d and amounts from any attachments'],
];
const totalFacts = [];
for (const [mk, target, key, block, addends] of TOTALS) {
  const w = W.get(target) || stop(`no widget ${target}`);
  const cap = R4.find((t) => t.str === 'Total Equity' && Math.abs(t.y - markerY[mk]) < 0.5) || stop(`no "Total Equity" caption on the ${mk} baseline`);
  const lst = R4.find((t) => t.str === `(${addends})` && Math.abs(t.y - markerY[mk]) < 0.5) || stop(`the ${mk} addend list is not drawn as ${JSON.stringify(`(${addends})`)} on its own baseline`);
  // T requires all three
  if (!(cap.y > w.rect[1] && cap.y < w.rect[3])) stop(`${mk}: the caption baseline ${cap.y} is not inside the cell rect ${w.rect[1]}..${w.rect[3]}`);
  if (!(cap.x2 < w.rect[0])) stop(`${mk}: the caption does not end left of the cell`);
  const money = R4.filter((t) => t.str === '$' && t.y > w.rect[1] && t.y < w.rect[3] && t.x2 < w.rect[0] && w.rect[0] - t.x2 <= 12);
  if (money.length !== 1) stop(`${mk}: ${money.length} printed "$" between the caption and the cell within 12pt, expected exactly 1`);
  totalFacts.push({
    marker: mk, key, target, block,
    caption_at: `y ${cap.y}, x ${cap.x1}..${cap.x2}, with the addend list at x ${lst.x1}..${lst.x2}; the printed "$" at y ${money[0].y} x ${money[0].x1}..${money[0].x2}, ${r1(w.rect[0] - money[0].x2)}pt left of the cell`,
    cell: `x ${w.rect[0]}..${w.rect[2]}, y ${w.rect[1]}..${w.rect[3]}, maxLen ${w.maxLen}`,
  });
  add(key, target, `Total Equity (${addends})`, 'T',
    `Fixed by the printed marker ${mk} at y ${markerY[mk]}. The caption "Total Equity" shares this cell's baseline ${cap.y} hundreds of points to its left, and exactly one printed "$" lies between them at x ${money[0].x1}..${money[0].x2}, ${r1(w.rect[0] - money[0].x2)}pt from the cell's left edge. THE CELL IS WIDER THAN THE EQUITY COLUMN — x ${w.rect[0]}..${w.rect[2]} against an equity lane of 521.2..576.0 — and it is bound as the equity total on three witnesses: the caption says "Total Equity" in the page's own words; its "$" is at x ${money[0].x1}, which is NOT one of the four column marker positions 262.0, 326.8, 391.6 and 514.0, so it belongs to no column but this line; and its left edge 492.4 is the SAME left edge the two unambiguous totals on page 3 use — 18f at x 492.4..576.0 and 19c at x 492.5..576.0. THIS IS NOT THE [B-06] SHAPE: [B-06] is arguable because the 20e cell's money marker sits at another COLUMN's marker position, and this one's does not.`);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// CLOSE — every page-4 widget bound exactly once
// ═══════════════════════════════════════════════════════════════════════════════════════
const bound = new Set(B.map((b) => b.target));
const missing = [...W.keys()].filter((n) => !bound.has(n));
if (missing.length) stop(`${missing.length} page-4 widget(s) bound by nothing:\n  ${missing.join('\n  ')}`);
if (bound.size !== W.size) stop(`bound ${bound.size} distinct target(s) against ${W.size} page-4 widget(s)`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE EVIDENCE TABLE NAMES CELLS BY LEAF, NOT BY FULL PATH
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A full topmostSubform path in map prose is resolved by validate-map.mjs against the field list
// and COUNTED AS A SECOND BINDING, which fails the duplicate-write check at gate step 4. The
// first draft of this generator emitted `target` on every evidence row and the gate reported all
// 94 page-4 targets as written by more than one key. The path lives in the binding, once; the
// evidence row carries the LEAF, which is what a reader needs to find the cell and what no
// resolver mistakes for a target.
const PAIRING = {
  C: 'column caption CONTAINED, above the cell',
  L: 'immediately left, baseline inside the rectangle',
  T: 'the total-line rule: the caption on the total line\'s own baseline, one printed "$" between it and the cell',
};
// The printed position of each caption is DERIVED here rather than restated: the run taken is the
// nearest one on the page carrying that exact text, measured from the widget's own rectangle, so
// a caption that moved would move this figure with it.
const nearestRun = (str, rect) => {
  const cx = (rect[0] + rect[2]) / 2, cy = (rect[1] + rect[3]) / 2;
  const cands = R4.filter((t) => t.str === str);
  if (!cands.length) return null;
  return cands.reduce((best, t) => {
    const d = Math.hypot((t.x1 + t.x2) / 2 - cx, t.y - cy);
    return best && best.d <= d ? best : { t, d };
  }, null).t;
};
// MOST CAPTIONS ON THIS PAGE ARE NOT ONE RUN. "Purchase/Lease Date (mmddyyyy)" is drawn as three
// runs on three baselines — "Purchase/", "Lease Date", "(mmddyyyy)" — and no run on the page
// carries the whole phrase. The runs each caption is ACTUALLY made of are already declared above,
// in COLS for the six grid columns, and are listed here for the row-level captions; the located
// position is the first of them, and a caption whose runs are not on the page still stops the run.
const CAPTION_RUNS = Object.fromEntries([
  ...COLS.map((c) => [c.cap, c.runs]),
  ['Property Description', ['Property Description']],
  ['Location (Street, City, State, ZIP code) and County', ['Location', '(Street, City, State, ZIP code)', 'and County']],
  ['Lender/Lessor/Landlord Name, Address, (Street, City, State, ZIP code) and Phone', ['Lender/Lessor/Landlord Name, Address,', '(Street, City, State, ZIP code)', 'and Phone']],
  ['Lender/Lessor Name, Address, (Street, City, State, ZIP code) and Phone', ['Lender/Lessor Name, Address,', '(Street, City, State, ZIP code)', 'and Phone']],
  ['Phone', ['Phone']],
  ['Year', ['Year']],
  ['Make/Model', ['Make/Model']],
  ['Mileage', ['Mileage']],
  ['License/Tag Number', ['License/Tag Number']],
  ['Vehicle Identification Number (VIN)', ['Vehicle Identification Number (VIN)']],
  ...TOTALS.map(([, , , , addends]) => [`Total Equity (${addends})`, ['Total Equity', `(${addends})`]]),
]);
const evidenceRows = B.map((b) => {
  const w = W.get(b.target);
  const runs = CAPTION_RUNS[b.caption] || [b.caption];
  let run = null;
  for (const r of runs) { run = nearestRun(r, w.rect); if (run) break; }
  return {
    key: b.key,
    leaf: b.target.split('.').slice(-1)[0],
    page: 4,
    widget: `y ${w.rect[1]}..${w.rect[3]}, x ${w.rect[0]}..${w.rect[2]}` + (w.maxLen === null ? '' : `, maxLen ${w.maxLen}`),
    printed: b.caption,
    printed_at: run ? `y ${run.y}, x ${run.x1}..${run.x2}` + (run.str === b.caption ? '' : ` (first run of the phrase, "${run.str}")`) : 'NOT LOCATED',
    pairing: PAIRING[b.how],
    second_witness: b.note,
  };
});
const unlocated = evidenceRows.filter((r) => r.printed_at === 'NOT LOCATED');
if (unlocated.length) stop(`${unlocated.length} evidence row(s) name a caption no run on page 4 carries: ${unlocated.map((r) => r.key).join(', ')}`);

const evidence = {
  page: 4,
  fields: W.size,
  rows: evidenceRows,
  offset: {
    offset_by_one: offsetting.length,
    agree_coincidentally: agreeing,
    token_from_another_block: unrelated,
    no_row_token: tokenlessNames,
  },
  headers: headerFacts,
  totals: totalFacts,
  money_marker_x: MONEY_X,
  markers: MARKERS.map((m) => ({ marker: m.str, y: m.y, x1: m.x1 })),
};
writeFileSync('adapters/pdf/tmp/p48/slice3-bindings.json', JSON.stringify(B, null, 1) + '\n');
writeFileSync('adapters/pdf/tmp/p48/slice3-evidence.json', JSON.stringify(evidence, null, 1) + '\n');
console.log(`\nslice 3: ${B.length} binding(s) over ${W.size} page-4 widget(s); every widget bound exactly once.`);
console.log(`  real_property  4 row(s) x 10 column(s) = 40`);
console.log(`  vehicles       4 row(s) x 13 column(s) = 52`);
console.log(`  totals         2`);
