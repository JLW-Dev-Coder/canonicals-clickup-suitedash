// Prompt 49 ruling 6 — 433-B map slice 4, pages 5 and 6, 104 fields. THE MAP CLOSES.
//
//   node scratchpad/433b-slice4-gen-slice4-433b.mjs
//
// EVERY EVIDENCE FIGURE IN THE MAP IS DERIVED HERE AND ASSERTED AGAINST THE DRAWN PAGE, exactly
// as slices 1, 2 and 3 do. A binding row names its target and the PRINTED TEXT it is bound to;
// this file looks that text up on the page and asserts the geometric relation its declared
// pairing rule requires. A caption it cannot find where the rule says it is takes the run down.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE LEAF-NAME OFFSET CONTINUES ON BOTH PAGES, AND IT IS PINNED BY NAME, NOT COUNTED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Page 4 was one printed marker behind on all 94 widgets, with two coincidental agreements
// named. Pages 5 and 6 continue it, in two different notations, and the exceptions are again
// named individually rather than absorbed into a number ([R-07]).
//
//   PAGE 5, LETTERED. Printed 24a-24d carry leaf token 23a-23d; printed 24e-24g carry 23e-23g;
//   printed 25a and 25b carry 24a and 24b. The widgets that are NOT one behind are named
//   individually in NOT_OFFSET below and the run prints how many took each state — NO COUNT IS
//   TYPED HERE, because a typed one drifts and a named set cannot ([R-07]). They are: the four
//   equipment lender/lessor PHONE cells, tokened 76b-79b against a form that ends at 50; the
//   24h block total, tokened 23e, which is the token of the 24e row on the same page; and the
//   25c block total, tokened 24d, in a block that has no row d.
//
//   PAGE 6, NUMBERED. The tokens are trailing decimals — GrssMnthly25, ActlMnthly36, FillIn30 —
//   and every numbered widget but one is one behind. THE ONE IS ActlMnthly36[1], the printed-38
//   expense cell: two behind, and sharing its leaf name with the printed-37 cell above it. The
//   four *_Sec5 widgets carry the SECTION number rather than a line number and are named too.
//
// The offset is ASSERTED per widget, both ways: a widget in a printed band whose token equals
// its own printed marker stops this run unless it is named as an exception, and an exception
// that turns out to be offset after all stops it too.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// [B-01]: correlate-labels.mjs CONTRIBUTES NOTHING ON THIS FORM, AND SAYING SO IS THE POINT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Run against 433-B it FAILS ITS OWN SELF-CHECK on the page-1 county probe and exits 2 without
// writing, so there is no adapters/pdf/maps/433b.labels.json in this tree and no page-5 or
// page-6 answer from it to agree or disagree with. Its probes are NOT retuned: the guard exists
// to catch the tool, and fitting the guard to the tool would end the only mechanism that has
// ever contradicted it on this form. EVERY BINDING BELOW THEREFORE RESTS ON GEOMETRY AND
// PRINTED TEXT ALONE. A silent absence would read as agreement; this is the absence said out
// loud, and it is re-derived on every run of this file rather than quoted from slice 3.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE PAIRING RULES — the form's four, plus one this page needed and one it did not
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   C   COLUMN CAPTION CONTAINED. The caption's x range lies INSIDE the widget's and its
//       baseline is above the widget's rect top.
//   CO  COLUMN CAPTION OVERLAPPING from above, not contained. Weaker; every CO cell names a
//       second witness. ONE CELL ON THESE PAGES TAKES IT, and it misses containment by 0.1pt,
//       which is exactly the kind of miss a tolerance would swallow ([R-09]).
//   L   immediately left: the caption's right edge is at or left of the widget's left edge and
//       its baseline is INSIDE the rectangle.
//   R   immediately right, baseline INSIDE the rectangle. The 25a and 25b Secured/Unsecured
//       boxes take it.
//   T   THE TOTAL-LINE RULE. The caption's baseline lies inside the widget's rectangle, the
//       caption ends left of the widget, and exactly one printed "$" lies between them within
//       12pt of the widget's left edge.
//   RS  RIGHT ON THE SAME PRINTED LINE — NEW ON THIS PAGE, AND DECLARED RATHER THAN BORROWED.
//       Page 6's two accounting-method boxes sit at y 719.6..727.6 and their printed labels
//       "Cash" and "Accrual" are drawn at baseline 718.7 — 0.9pt BELOW the box bottom. R does
//       not hold and IS NOT WIDENED TO MAKE IT HOLD: no tolerance in any comparison. RS is a
//       different relation and it is tolerance-free — on one printed baseline, each box takes
//       the unique printed run lying to its right and left of the next box (or of the line
//       end). Both boxes are additionally settled by a SECOND, INDEPENDENT witness: the PDF
//       on-state each stores is /Cash and /Accrual, the printed words themselves.

import { readFileSync, writeFileSync } from 'node:fs';
import { readWidgetGeometry, readPrintedText, baselineOfRun } from '../adapters/pdf/page-geometry.mjs';

const stop = (m) => { console.error(`STOP — ${m}`); process.exit(2); };
const r1 = (n) => Math.round(n * 10) / 10;

const bytes = readFileSync('adapters/pdf/forms/f433b.pdf');
const { widgets } = await readWidgetGeometry(bytes);
const pages = await readPrintedText(bytes);
const runsOn = (p) => pages[p - 1].items.map((t) => ({ str: t.str, y: r1(baselineOfRun(t)), x1: r1(t.x1), x2: r1(t.x2) }));
const widgetsOn = (p) => new Map(widgets.filter((w) => w.page === p)
  .map((w) => [w.name, { rect: w.rect.map(r1), maxLen: w.maxLen ?? null, type: w.type }]));

const R5 = runsOn(5), R6 = runsOn(6);
const W5 = widgetsOn(5), W6 = widgetsOn(6);
const P5 = 'topmostSubform[0].Page5[0].', P6 = 'topmostSubform[0].Page6[0].';

// ── [B-01] RE-DERIVED, NOT QUOTED ───────────────────────────────────────────────────────────
// The claim "correlate-labels.mjs contributes nothing here" is a claim about this tree and is
// checked against this tree on every run. A labels file that appeared would mean the tool now
// has an opinion about these pages, and this generator's headers would be asserting an absence
// that had ended.
const LABELS = 'adapters/pdf/maps/433b.labels.json';
try { readFileSync(LABELS); stop(`${LABELS} now EXISTS. Every header in this file states that correlate-labels.mjs wrote nothing on 433-B, so a labels file is a contradicted absence, not a bonus witness. Read it, decide whether it agrees, and rewrite the claim.`); }
catch (e) { if (e.code !== 'ENOENT') stop(`${LABELS} could not be read for a reason other than absence: ${e.message}`); }
console.log(`[B-01] re-derived: ${LABELS} is absent, so no binding below has a labels-file witness.`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE PRINTED MARKERS, READ OFF THE PAGES
// ═══════════════════════════════════════════════════════════════════════════════════════
const M5 = R5.filter((t) => /^2[45][a-h]$/.test(t.str) && t.x1 < 60).sort((a, b) => b.y - a.y);
const WANT5 = ['24a', '24b', '24c', '24d', '24e', '24f', '24g', '24h', '25a', '25b', '25c'];
if (M5.map((m) => m.str).join(',') !== WANT5.join(','))
  stop(`page 5 printed markers are ${M5.map((m) => m.str).join(',')}, expected ${WANT5.join(',')}`);
const markerY5 = Object.fromEntries(M5.map((m) => [m.str, m.y]));
console.log(`page 5 printed markers: ${M5.map((m) => `${m.str}@y${m.y}`).join(' ')}`);

const M6 = R6.filter((t) => /^(2[6-9]|3[0-9]|4[0-9]|50)$/.test(t.str) && (Math.abs(t.x1 - 38) < 1.5 || Math.abs(t.x1 - 304.4) < 1.5));
const INCOME_MARKERS = M6.filter((m) => m.x1 < 100).sort((a, b) => b.y - a.y).map((m) => m.str);
const EXPENSE_MARKERS = M6.filter((m) => m.x1 > 300).sort((a, b) => b.y - a.y).map((m) => m.str);
const WANT_INC = ['26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'];
const WANT_EXP = ['37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50'];
if (INCOME_MARKERS.join(',') !== WANT_INC.join(',')) stop(`page 6 income markers are ${INCOME_MARKERS.join(',')}, expected ${WANT_INC.join(',')}`);
if (EXPENSE_MARKERS.join(',') !== WANT_EXP.join(',')) stop(`page 6 expense markers are ${EXPENSE_MARKERS.join(',')}, expected ${WANT_EXP.join(',')}`);
const markerY6 = Object.fromEntries(M6.map((m) => [`${m.x1 < 100 ? 'i' : 'e'}${m.str}`, m.y]));
console.log(`page 6 printed markers: income ${INCOME_MARKERS.join(',')} | expense ${EXPENSE_MARKERS.join(',')}`);

// ── the band a page-5 printed marker owns ───────────────────────────────────────────────────
const bandOf5 = (mk) => {
  const i = WANT5.indexOf(mk);
  return { top: markerY5[mk] + 12, bot: i + 1 < WANT5.length ? markerY5[WANT5[i + 1]] + 12 : 30 };
};
const bandFor5 = (name) => {
  const w = W5.get(name) || stop(`no widget named ${name} on page 5`);
  const mid = (w.rect[1] + w.rect[3]) / 2;
  return WANT5.find((m) => { const b = bandOf5(m); return mid < b.top && mid >= b.bot; }) || null;
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE OFFSET, ASSERTED PER WIDGET — PAGE 5
// ═══════════════════════════════════════════════════════════════════════════════════════
const tok5 = (n) => { const m = /_(\d{1,2}[a-z])(?:[A-Za-z0-9]*)?\[\d+\]$/.exec(n); return m ? m[1] : null; };
const OFFSET5 = { '24a': '23a', '24b': '23b', '24c': '23c', '24d': '23d', '24e': '23e', '24f': '23f', '24g': '23g', '24h': '23h', '25a': '24a', '25b': '24b', '25c': '24c' };

// THE FOUR PAGE-5 WIDGETS THE OFFSET DOES NOT DESCRIBE, EACH NAMED. Not "four exceptions" — a
// count would let one be swapped for another and still agree ([R-07]).
const NOT_OFFSET = {
  [`${P5}Lender-Phone1[0].p5_74_76b[0]`]: 'token 76b. NO PRINTED MARKER 76 EXISTS ANYWHERE ON THIS FORM, which ends at 50. The four equipment lender/lessor PHONE cells carry 76b, 77b, 78b and 79b — a scheme borrowed from somewhere off this form entirely. Page 4 does the same thing with p4_43_59b, p4_54_69b, p4_64_69b and p4_74_79b, and p4_74_79b and this page\'s p5_74_79b differ ONLY in the page token: two cells on two pages under one leaf stem.',
  [`${P5}Lender-Phone2[0].p5_74_77b[0]`]: 'token 77b, same scheme as 76b above.',
  [`${P5}Lender-Phone3[0].p5_74_78b[0]`]: 'token 78b, same scheme as 76b above.',
  [`${P5}Lender-Phone4[0].p5_74_79b[0]`]: 'token 79b, same scheme as 76b above, and the one that collides across pages with page 4\'s p4_74_79b.',
  [`${P5}p5_00_23e[0]`]: 'THE 24h TOTAL, token 23e. One behind would be 23h. 23e is the token of the 24e INTANGIBLE ROW, whose equity cell is p5_34_23e[0] on the same page — so this page carries the token 23e twice, on the block total and on a row three lines above it. A binder taking the total by leaf stem would write the total into the 24e row.',
  [`${P5}p5_63_24d[0]`]: 'THE 25c TOTAL, token 24d. One behind would be 24c. There are only two liability rows, 25a and 25b, so 24d names a row this block does not have; the name looks inherited from a four-row block.',
};

const agree5 = [], offset5 = [], exception5 = [];
for (const [name] of W5) {
  const mk = bandFor5(name) || stop(`${name} falls in no printed marker band on page 5`);
  const t = tok5(name);
  if (NOT_OFFSET[name]) { exception5.push({ name, mk, t }); continue; }
  if (t === null) stop(`${name} carries no row token and is not named in NOT_OFFSET. A cell whose name says nothing must be declared, not assumed.`);
  if (t === mk) { agree5.push({ name, mk }); continue; }
  if (t !== OFFSET5[mk]) stop(`${name} sits in printed band ${mk} and carries token ${t}; the offset predicts ${OFFSET5[mk]} and it is not in NOT_OFFSET. The offset is not what this file says it is.`);
  offset5.push({ name, mk, t });
}
for (const n of Object.keys(NOT_OFFSET)) if (!W5.has(n)) stop(`NOT_OFFSET names ${n}, which is not a page-5 widget.`);
if (agree5.length) stop(`page 5 has ${agree5.length} widget(s) whose token EQUALS their printed marker: ${agree5.map((a) => a.name).join(', ')}. Page 4 had two such coincidences and named them; these are unnamed.`);
console.log(`page 5 offset: ${offset5.length} widget(s) exactly one printed marker behind, ${exception5.length} named exception(s), ${agree5.length} agreeing with their printed marker.`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE OFFSET, ASSERTED PER WIDGET — PAGE 6
// ═══════════════════════════════════════════════════════════════════════════════════════
const tok6 = (n) => { const m = /(\d{1,2})\[\d+\]$/.exec(n); return m ? Number(m[1]) : null; };
const laneOf = (w) => (w.rect[0] < 310 ? 'i' : 'e');
const NOT_OFFSET6 = {
  [`${P6}TotalExpenses[0].ActlMnthly36[1]`]: 'TWO printed markers behind, not one: it is the printed-38 cell and its token is 36. It is also a DUPLICATE LEAF NAME — ActlMnthly36[0] one row above it is the printed-37 cell, so one leaf name spells two different printed expense lines. Everything else numbered on this page is exactly one behind.',
  [`${P6}p6_01_Sec5[0]`]: 'the accounting-method Cash box. Its trailing "5" is the SECTION number, not a line number: the two boxes and the two period dates are all named *_Sec5, and Section 5 is what page 6 is. No printed line marker applies.',
  [`${P6}p6_01_Sec5[1]`]: 'the accounting-method Accrual box, same Sec5 scheme.',
  [`${P6}p6_1_Sec5[0]`]: 'the period FROM date, same Sec5 scheme.',
  [`${P6}p6_2_Sec5[0]`]: 'the period TO date, same Sec5 scheme.',
};
const offset6 = [], exception6 = [], agree6 = [];
for (const [name, w] of W6) {
  if (NOT_OFFSET6[name]) { exception6.push(name); continue; }
  const t = tok6(name);
  if (t === null) stop(`${name} carries no numeric token and is not named in NOT_OFFSET6.`);
  const lane = laneOf(w);
  const hit = M6.find((m) => m.y >= w.rect[1] && m.y <= w.rect[3] && (lane === 'i' ? m.x1 < 100 : m.x1 > 300));
  if (!hit) stop(`${name} has no printed ${lane === 'i' ? 'income' : 'expense'} marker with its baseline inside the widget rectangle.`);
  const delta = Number(hit.str) - t;
  if (delta === 0) { agree6.push(name); continue; }
  if (delta !== 1) stop(`${name} is printed ${hit.str} and tokened ${t}: ${delta} behind, not 1, and it is not in NOT_OFFSET6.`);
  offset6.push({ name, printed: hit.str, t });
}
for (const n of Object.keys(NOT_OFFSET6)) if (!W6.has(n)) stop(`NOT_OFFSET6 names ${n}, which is not a page-6 widget.`);
if (agree6.length) stop(`page 6 has ${agree6.length} widget(s) whose token EQUALS their printed marker, unnamed: ${agree6.join(', ')}`);
console.log(`page 6 offset: ${offset6.length} widget(s) exactly one printed marker behind, ${exception6.length} named exception(s), ${agree6.length} agreeing.`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE PAIRING PREDICATES. Each returns the printed run it paired with, or stops.
// ═══════════════════════════════════════════════════════════════════════════════════════
const findRun = (runs, text, at) => {
  const hits = runs.filter((t) => t.str === text && (at === undefined || Math.abs(t.y - at) < 0.05));
  if (!hits.length) stop(`the printed run ${JSON.stringify(text)}${at !== undefined ? ` at y ${at}` : ''} is not drawn on that page`);
  return hits;
};
const W = (p, n) => (p === 5 ? W5 : W6).get(n) || stop(`${n} is not a page-${p} widget`);

/**
 * C: the column caption is drawn above the cell and AT LEAST ONE RUN OF ITS STACK is contained
 * in the cell's x range. That "at least one" is slice 3's declared predicate, not a loosening
 * invented here: a header phrase is set as several runs on several baselines and the widest of
 * them can overhang the lane by a point while the phrase plainly captions the column. The
 * equipment stack has one such overhang and it would have been reported as a CO by a
 * per-run test — "Current Loan" runs x 333.0..379.8 against a cell at x 334.0..388.8, 1.0pt
 * left — while "Balance" on the next baseline is contained. The run that CARRIES the
 * containment is what gets recorded, and the runs that only overlap are recorded beside it, so
 * the reader can see which is which rather than being told the phrase is contained.
 */
const pairC = (p, name, text, at) => {
  const w = W(p, name);
  const stack = Array.isArray(text) ? text.flatMap((s) => findRun(p === 5 ? R5 : R6, s)) : findRun(p === 5 ? R5 : R6, text, at);
  const above = stack.filter((t) => t.y > w.rect[3]);
  if (!above.length) stop(`C failed for ${name}: no run of ${JSON.stringify(text)} is drawn above y ${w.rect[3]}`);
  const cand = above.filter((t) => t.x1 >= w.rect[0] && t.x2 <= w.rect[2]);
  if (!cand.length) stop(`C failed for ${name}: no run of ${JSON.stringify(text)} above the cell is contained in x ${w.rect[0]}..${w.rect[2]}; every run only overlaps. That is a CO and must say so.`);
  const hit = cand.sort((a, b) => a.y - b.y)[0];
  hit._overlapping = above.filter((t) => !cand.includes(t)).map((t) => `${JSON.stringify(t.str)} y ${t.y} x ${t.x1}..${t.x2}`);
  return hit;
};
/** CO: caption overlaps the widget's x from above but is not contained. */
const pairCO = (p, name, text, at) => {
  const w = W(p, name);
  const cand = findRun(p === 5 ? R5 : R6, text, at)
    .filter((t) => t.y > w.rect[3] && t.x2 > w.rect[0] && t.x1 < w.rect[2] && !(t.x1 >= w.rect[0] && t.x2 <= w.rect[2]));
  if (!cand.length) stop(`CO failed for ${name}: no run ${JSON.stringify(text)} overlaps x ${w.rect[0]}..${w.rect[2]} from above WITHOUT being contained. If it is contained, it is a C and must say so.`);
  return cand.sort((a, b) => a.y - b.y)[0];
};
/** L: caption right edge at or left of the widget's left edge, baseline inside the rect. */
const pairL = (p, name, text, at) => {
  const w = W(p, name);
  const cand = findRun(p === 5 ? R5 : R6, text, at).filter((t) => t.x2 <= w.rect[0] && t.y >= w.rect[1] && t.y <= w.rect[3]);
  if (!cand.length) stop(`L failed for ${name}: no run ${JSON.stringify(text)} ends at or left of x ${w.rect[0]} with its baseline inside y ${w.rect[1]}..${w.rect[3]}`);
  return cand.sort((a, b) => b.x2 - a.x2)[0];  // the nearest one to the left
};
/** R: caption starts at or right of the widget's right edge, baseline inside the rect. */
const pairR = (p, name, text, at) => {
  const w = W(p, name);
  const cand = findRun(p === 5 ? R5 : R6, text, at).filter((t) => t.x1 >= w.rect[2] && t.y >= w.rect[1] && t.y <= w.rect[3]);
  if (!cand.length) stop(`R failed for ${name}: no run ${JSON.stringify(text)} starts at or right of x ${w.rect[2]} with its baseline inside y ${w.rect[1]}..${w.rect[3]}`);
  return cand.sort((a, b) => a.x1 - b.x1)[0];
};
/** T: the total-line rule. Returns the caption and the money marker it required. */
const pairT = (p, name, text) => {
  const w = W(p, name), runs = p === 5 ? R5 : R6;
  const cap = findRun(runs, text).filter((t) => t.y >= w.rect[1] && t.y <= w.rect[3] && t.x2 < w.rect[0]);
  if (!cap.length) stop(`T failed for ${name}: no run ${JSON.stringify(text)} has its baseline inside y ${w.rect[1]}..${w.rect[3]} and ends left of x ${w.rect[0]}`);
  const money = runs.filter((t) => t.str === '$' && t.y >= w.rect[1] && t.y <= w.rect[3] && t.x2 <= w.rect[0] && w.rect[0] - t.x2 <= 12);
  if (money.length !== 1) stop(`T failed for ${name}: ${money.length} printed "$" lie between the caption and the cell within 12pt, not exactly 1`);
  return { cap: cap[0], money: money[0] };
};
/** RS: right on the same printed baseline, the unique run before the next box. Page 6 only. */
const pairRS = (name, nextBoxLeft) => {
  const w = W(6, name);
  const line = R6.filter((t) => Math.abs(t.y - 718.7) < 0.05 && t.x1 >= w.rect[2] && (nextBoxLeft === null || t.x2 <= nextBoxLeft));
  if (line.length !== 1) stop(`RS failed for ${name}: ${line.length} printed run(s) lie to its right on baseline 718.7 before the next box, not exactly 1`);
  return line[0];
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE BINDINGS
// ═══════════════════════════════════════════════════════════════════════════════════════
const B = [];
const seenTarget = new Set(), seenKey = new Set();
const add = (page, key, target, run, pairing, witness, extra = {}) => {
  const w = W(page, target);
  if (seenTarget.has(target)) stop(`${target} bound twice — second by ${key}`);
  if (seenKey.has(key)) stop(`key ${key} bound twice`);
  seenTarget.add(target); seenKey.add(key);
  B.push({
    key, target, page,
    widget: `y ${w.rect[1]}..${w.rect[3]}, x ${w.rect[0]}..${w.rect[2]}, maxLen ${w.maxLen}`,
    printed: run.str,
    printed_at: `y ${run.y}, x ${run.x1}..${run.x2}`,
    pairing, second_witness: witness, ...extra,
  });
};

// ── page 5: BUSINESS EQUIPMENT rows 24a-24d ─────────────────────────────────────────────────
const EQUIP = [
  { mk: '24a', t: '23a', lp: 'Lender-Phone1', n: [1, 2, 3, 4, 5, 6, 7, 8, 9], phone: 'p5_74_76b' },
  { mk: '24b', t: '23b', lp: 'Lender-Phone2', n: [10, 11, 12, 13, 14, 15, 16, 17, 18], phone: 'p5_74_77b' },
  { mk: '24c', t: '23c', lp: 'Lender-Phone3', n: [19, 20, 21, 22, 23, 24, 25, 26, 27], phone: 'p5_74_78b' },
  { mk: '24d', t: '23d', lp: 'Lender-Phone4', n: [28, 29, 30, 31, 32, 33, 34, 35, 36], phone: 'p5_74_79b' },
];
// The column header stack, drawn ONCE above row 24a and captioning all four rows.
const GRID = [
  { col: 'purchase_lease_date', phrase: 'Purchase/Lease Date (mmddyyyy)', text: ['Purchase/', 'Lease Date', '(mmddyyyy)'], i: 1, money: false },
  { col: 'current_fmv', phrase: 'Current Fair Market Value (FMV)', text: ['Current Fair', 'Market Value', '(FMV)'], i: 2, money: true },
  { col: 'current_loan_balance', phrase: 'Current Loan Balance', text: ['Current Loan', 'Balance'], i: 3, money: true },
  { col: 'monthly_payment', phrase: 'Amount of Monthly Payment', text: ['Amount of', 'Monthly', 'Payment'], i: 4, money: true },
  { col: 'final_payment_date', phrase: 'Date of Final Payment (mmddyyyy)', text: ['Date of Final', 'Payment'], i: 5, money: false },
  { col: 'equity', phrase: 'Equity FMV Minus Loan', text: ['Equity', 'FMV Minus Loan'], i: 6, money: true },
];
const rowMarkerWitness5 = (mk, extra) => `Row fixed by the printed marker ${mk} at y ${markerY5[mk]}, x ${M5.find((m) => m.str === mk).x1}. ${extra}`;

EQUIP.forEach((r, ri) => {
  const sub = `${P5}Line${r.t}[0].`;
  // asset description
  add(5, `business_equipment[${ri}].asset_description`, `${sub}p5_${r.n[0]}_${r.t}[0]`,
    pairC(5, `${sub}p5_${r.n[0]}_${r.t}[0]`, 'Asset Description'), 'C — row caption contained, above the cell',
    rowMarkerWitness5(r.mk, `Column fixed by "Asset Description", which is drawn once per equipment row and nowhere else on the page; the printed block heading "BUSINESS EQUIPMENT AND INTANGIBLE ASSETS" at y 733.1 x 43.2..228.3 opens the band. maxLen 30.`));
  // the six grid columns
  for (const g of GRID) {
    const target = `${sub}p5_${r.n[g.i]}_${r.t}[0]`;
    const run = pairC(5, target, g.text);
    add(5, `business_equipment[${ri}].${g.col}`, target, { ...run, str: g.phrase },
      'C — column caption stack, at least one run contained, above the cell',
      rowMarkerWitness5(r.mk, `Column fixed by the header stack ${JSON.stringify(g.phrase)}, drawn ONCE above row 24a and captioning all four equipment rows. The run carrying the containment is ${JSON.stringify(run.str)} at y ${run.y}, x ${run.x1}..${run.x2}, inside this cell's x ${W5.get(target).rect[0]}..${W5.get(target).rect[2]}` +
        (run._overlapping.length ? `; the other run(s) of the stack only OVERLAP and are named rather than absorbed: ${run._overlapping.join('; ')}` : '; every run of the stack is contained') + '. ' +
        (g.money
          ? `A printed "$" is drawn immediately left of this cell on every one of the four equipment rows, and the widget carries maxLen ${W5.get(target).maxLen}.`
          : `NO printed "$" is drawn left of this cell on any row, and the widget carries maxLen ${W5.get(target).maxLen}, the width of the printed (mmddyyyy) hint.`)));
  }
  // location, lender, phone
  const loc = `${P5}p5_${r.n[7]}_${r.t}[0]`;
  add(5, `business_equipment[${ri}].location_of_asset`, loc, pairC(5, loc, 'Location of asset'),
    'C — row caption contained, above the cell',
    rowMarkerWitness5(r.mk, 'Column fixed by "Location of asset" with its qualifiers "(Street, City, State, ZIP code)" and "and County" drawn on the same baseline to its right; the cell is the full-width left half of the row\'s second band.'));
  const lend = `${P5}${r.lp}[0].p5_${r.n[8]}_${r.t}[0]`;
  add(5, `business_equipment[${ri}].lender_name_address`, lend, pairC(5, lend, 'Lender/Lessor Name, Address,'),
    'C — row caption contained, above the cell',
    rowMarkerWitness5(r.mk, 'Column fixed by "Lender/Lessor Name, Address," with "(Street, City, State, ZIP code)" and "and Phone" on the same baseline; the cell is the right half of the row\'s second band and the phone cell below it takes the "and Phone" part.'));
  const ph = `${P5}${r.lp}[0].${r.phone}[0]`;
  add(5, `business_equipment[${ri}].lender_phone`, ph, pairL(5, ph, 'Phone'),
    'L — caption immediately left, baseline inside the rectangle',
    rowMarkerWitness5(r.mk, `Column fixed by the printed "Phone" ending at x ${pairL(5, ph, 'Phone').x2}, left of the cell at x ${W5.get(ph).rect[0]}, with its baseline inside the rectangle. THE LEAF NAME IS ${r.phone} AND IT IS EVIDENCE OF NOTHING — see NOT_OFFSET.`));
});

// ── page 5: INTANGIBLE ASSETS rows 24e-24g ──────────────────────────────────────────────────
['e', 'f', 'g'].forEach((t, ri) => {
  const mk = `24${t}`;
  const desc = `${P5}p5_28_23${t}[0]`;
  add(5, `intangible_assets[${ri}].description`, desc, pairC(5, desc, 'Intangible Asset Description'),
    'C — row caption contained, above the cell',
    rowMarkerWitness5(mk, 'Column fixed by "Intangible Asset Description", drawn once per intangible row. The printed instruction "List intangible assets in 24e through 24g (licenses, patents, logos, domain names, trademarks, copyrights, software, mining claims, goodwill and trade secrets.)" at y 725.1 names these three rows by their printed markers.'));
  const eq = `${P5}p5_34_23${t}[0]`;
  add(5, `intangible_assets[${ri}].equity`, eq, pairC(5, eq, 'Equity', 703.5),
    'C — column caption contained, above the cell',
    rowMarkerWitness5(mk, `Column fixed by the same "Equity" header the four equipment rows use, at x 531.7..555.5 inside this cell's x 521.2..576. A printed "$" is drawn immediately left of it at x 514, and the widget carries maxLen ${W5.get(eq).maxLen}. THE INTANGIBLE ROWS DRAW NO FMV AND NO LOAN CELL — two cells per row, not eight — so the "FMV Minus Loan" half of the header has no operands here; see [B-07].`));
});

// ── page 5: the 24h total ───────────────────────────────────────────────────────────────────
{
  const t24h = pairT(5, `${P5}p5_00_23e[0]`, 'Total Equity');
  add(5, 's4_24h_total_equity_business_equipment', `${P5}p5_00_23e[0]`, t24h.cap,
    'T — total-line rule: caption baseline inside the rectangle, caption left of the cell, one printed "$" between them within 12pt',
    `Row fixed by the printed marker 24h at y ${markerY5['24h']}. The operand list is the caption's own: "(Add lines 24a through 24g and amounts from any attachments)" drawn on the same baseline at x 105.1..331.6. The money marker is at y ${t24h.money.y}, x ${t24h.money.x1}..${t24h.money.x2}, ${r1(W5.get(`${P5}p5_00_23e[0]`).rect[0] - t24h.money.x2)}pt left of the cell. THE LEAF NAME IS p5_00_23e AND IT NAMES THE 24e ROW — see NOT_OFFSET.`);
}

// ── page 5: BUSINESS LIABILITIES rows 25a and 25b ───────────────────────────────────────────
const LIAB = [
  { mk: '25a', sub: `${P5}BusinessLiablities[0].p5_37_24a[0]`, box: `${P5}Secured[0].p5_1_24a[`,
    cells: { date_pledged: `${P5}DatePledged[0].p5_39_24a[0]`, balance_owed: `${P5}BalancedOwned[0].p5_40_24a[0]`,
      final_payment_date: `${P5}DateFinalPay[0].p5_41_24a[0]`, payment_amount: `${P5}Payment[0].p5_42_24a[0]` },
    contact: [`${P5}p5_00_24a[0]`, `${P5}p5_00_24a[1]`, `${P5}p5_00_24a[2]`, `${P5}p5_00_24a[3]`] },
  { mk: '25b', sub: `${P5}p5_43_24b[0]`, box: `${P5}SecUNsec24b[0].p5_5_24b[`,
    cells: { date_pledged: `${P5}p5_45_24b[0]`, balance_owed: `${P5}p5_46_24b[0]`,
      final_payment_date: `${P5}p5_47_24b[0]`, payment_amount: `${P5}p5_48_24b[0]` },
    contact: [`${P5}p5_49_24b[0]`, `${P5}p5_50_24b[0]`, `${P5}p5_51_24b[0]`, `${P5}p5_52_24b[0]`] },
];
const LIAB_COLS = [
  { col: 'date_pledged', text: 'Date Pledged', at: 243.5, rule: 'C' },
  { col: 'balance_owed', text: 'Balance Owed', at: 240.5, rule: 'CO' },
  { col: 'final_payment_date', text: 'Date of Final', at: 247.5, rule: 'C' },
  { col: 'payment_amount', text: 'Payment', at: 243.5, rule: 'C' },
];
const CONTACT = [
  { col: 'name', text: 'Name' },
  { col: 'street_address', text: 'Street Address' },
  { col: 'city_state_zip', text: 'City/State/ZIP code' },
  { col: 'phone', text: 'Phone' },
];
LIAB.forEach((r, ri) => {
  add(5, `business_liabilities[${ri}].description`, r.sub, pairC(5, r.sub, 'Description:'),
    'C — row caption contained, above the cell',
    rowMarkerWitness5(r.mk, 'Column fixed twice over: the row caption "Description:" drawn on the marker\'s own baseline, and the column header "Business Liabilities" at y 240.5 x 56.0..123.9 above the block. The printed block heading "BUSINESS LIABILITIES" at y 260.3 x 58.0..146.1 opens the band.'));
  for (const c of LIAB_COLS) {
    const target = r.cells[c.col];
    const run = c.rule === 'CO' ? pairCO(5, target, c.text, c.at) : pairC(5, target, c.text, c.at);
    const w = W5.get(target);
    add(5, `business_liabilities[${ri}].${c.col}`, target, run,
      c.rule === 'CO' ? 'CO — column caption OVERLAPPING from above, not contained' : 'C — column caption contained, above the cell',
      rowMarkerWitness5(r.mk,
        c.rule === 'CO'
          ? `THIS IS THE ONE CO CELL ON EITHER PAGE AND IT MISSES CONTAINMENT BY 0.1pt: "Balance Owed" runs x ${run.x1}..${run.x2} and the cell x ${w.rect[0]}..${w.rect[2]}, so the caption starts ${r1(w.rect[0] - run.x1)}pt left of the cell's left edge. It is reported as CO rather than rounded into a C, because a tolerance that swallowed 0.1pt is the shape [R-09] forbids. THE SECOND WITNESS IS DECISIVE: a printed "$" is drawn at y ${ri === 0 ? 196.7 : 128.3} x 370.0 immediately left of this cell on both rows and left of no other cell in this block except the payment amount, and the widget carries maxLen ${w.maxLen}, the money width. The two date columns beside it carry maxLen 8 and no "$".`
          : `Column fixed by the header stack drawn once above row 25a at x ${w.rect[0]}..${w.rect[2]}. ` +
            (c.col === 'payment_amount'
              ? `A printed "$" is drawn immediately left of this cell on both rows and the widget carries maxLen ${w.maxLen}. The header is two runs, "Payment" at y 243.5 x 524.2..555.8 and "Amount" at y 236.5 x 526.0..554.0; the "Payment" at y 240.5 x 457.4..485.8 belongs to the DATE OF FINAL PAYMENT stack and is not contained in this cell.`
              : `NO printed "$" is drawn left of this cell on either row and the widget carries maxLen ${w.maxLen}, the width of the printed (mmddyyyy) hint drawn under the header.`)));
  }
  // the secured / unsecured pair
  for (const [i, opt] of [[0, 'Secured'], [1, 'Unsecured']]) {
    const target = `${r.box}${i}]`;
    add(5, `business_liabilities_${r.mk}_secured_or_unsecured.${opt}`, target, pairR(5, target, opt),
      'R — option printed immediately right of the box, baseline inside the rectangle',
      rowMarkerWitness5(r.mk, `The pair is captioned by the column header "Secured/" at y 243.5 x 257.3..289.9 and "Unsecured" at y 236.5 x 254.1..293.1 above the block. THE BOX'S OWN PDF ON-STATE IS /${opt}, the printed word itself, which settles the option independently of the geometry.`), { on_state: `/${opt}` });
  }
  // the four contact cells
  r.contact.forEach((target, ci) => {
    const c = CONTACT[ci];
    add(5, `business_liabilities[${ri}].${c.col}`, target, pairL(5, target, c.text),
      'L — caption immediately left, baseline inside the rectangle',
      rowMarkerWitness5(r.mk, `Column fixed by the printed "${c.text}" ending left of the cell with its baseline inside the rectangle. ` +
        (ri === 0
          ? 'ALL FOUR OF ROW 25a\'s CONTACT CELLS SHARE ONE LEAF NAME, p5_00_24a, distinguished only by index [0] to [3]; row 25b spells the same four cells p5_49_24b, p5_50_24b, p5_51_24b and p5_52_24b. Two rows, two naming schemes, and the indexed one carries no column information at all.'
          : 'Row 25b spells these four cells with four distinct leaf names where row 25a uses one indexed name; the binding rests on the printed caption on both rows, not on either scheme.')));
  });
});

// ── page 5: the 25c total ───────────────────────────────────────────────────────────────────
{
  const t25c = pairT(5, `${P5}p5_63_24d[0]`, 'Total Payments');
  add(5, 's4_25c_total_payments', `${P5}p5_63_24d[0]`, t25c.cap,
    'T — total-line rule: caption baseline inside the rectangle, caption left of the cell, one printed "$" between them within 12pt',
    `Row fixed by the printed marker 25c at y ${markerY5['25c']}. The operand list is the caption's own: "(Add lines 25a and 25b and amounts from any attachments)" at x 119.1..331.3. The money marker is at y ${t25c.money.y}, x ${t25c.money.x1}..${t25c.money.x2}, ${r1(W5.get(`${P5}p5_63_24d[0]`).rect[0] - t25c.money.x2)}pt left of the cell. THE CELL IS WIDER THAN THE COLUMN IT SUMS — x 491.0..576.0 against a Payment Amount lane of 514.0..576.0 — which is the [B-06] resemblance page 4 also carries; the witnesses agree here for the same reason they do there and it is recorded at _the_25c_cell_is_not_the_B06_shape. THE LEAF NAME IS p5_63_24d AND THIS BLOCK HAS NO ROW d.`);
}

// ── page 6: Section 5 ───────────────────────────────────────────────────────────────────────
{
  const cash = `${P6}p6_01_Sec5[0]`, accrual = `${P6}p6_01_Sec5[1]`;
  const nextBoxLeft = W6.get(accrual).rect[0];
  add(6, 's5_accounting_method.Cash', cash, pairRS(cash, nextBoxLeft),
    'RS — right on the same printed baseline, the unique run between this box and the next',
    `R DOES NOT HOLD HERE AND IS NOT WIDENED TO MAKE IT: the box runs y ${W6.get(cash).rect[1]}..${W6.get(cash).rect[3]} and "Cash" is drawn at baseline 718.7, ${r1(W6.get(cash).rect[1] - 718.7)}pt BELOW the box bottom. Three printed runs share baseline 718.7 — "Accounting Method Used:" x 36.0..135.1, "Cash" x 159.1..177.6 and "Accrual" x 208.5..235.4 — and exactly one lies between this box and the next. SECOND WITNESS, INDEPENDENT OF ALL GEOMETRY: the box's PDF on-state is /Cash.`, { on_state: '/Cash' });
  add(6, 's5_accounting_method.Accrual', accrual, pairRS(accrual, null),
    'RS — right on the same printed baseline, the unique run between this box and the line end',
    `Same relation as the Cash box: "Accrual" at x 208.5..235.4 is the only run right of this box on baseline 718.7. SECOND WITNESS: the box's PDF on-state is /Accrual.`, { on_state: '/Accrual' });

  const from = `${P6}p6_1_Sec5[0]`, to = `${P6}p6_2_Sec5[0]`;
  add(6, 's5_period_from', from, pairL(6, from, '(mmddyyyy)', 686.9),
    'L — caption immediately left, baseline inside the rectangle',
    `The printed sentence is "Income and Expenses during the period" x 38.0..189.7 followed by "(mmddyyyy)" x 191.9..234.6 on baseline 686.9; this cell takes the FIRST (mmddyyyy) and the TO cell takes the run "to (mmddyyyy)" at x 383.4..435.4. The two are distinguished by which printed run is immediately left of which cell, and by the word "to" belonging to the second. maxLen ${W6.get(from).maxLen} on both.`);
  add(6, 's5_period_to', to, pairL(6, to, 'to (mmddyyyy)'),
    'L — caption immediately left, baseline inside the rectangle',
    `The run is "to (mmddyyyy)" at x 383.4..435.4, which carries the word "to" and is the only run left of this cell on its baseline. maxLen ${W6.get(to).maxLen}.`);
}

// income lines 26-30 and the total at 36
const INCOME = [
  { printed: '26', key: 's5_26_gross_receipts', leaf: 'GrssMnthly25', label: 'Gross Receipts from Sales/Services' },
  { printed: '27', key: 's5_27_gross_rental_income', leaf: 'GrossMnthly26', label: 'Gross Rental Income' },
  { printed: '28', key: 's5_28_interest_income', leaf: 'GrossMnthly27', label: 'Interest Income' },
  { printed: '29', key: 's5_29_dividends', leaf: 'GrossMnthly28', label: 'Dividends' },
  { printed: '30', key: 's5_30_cash_receipts', leaf: 'GroosMnthly29', label: 'Cash Receipts (Not included in lines 26-29)' },
];
const OTHER_INCOME = [
  { printed: '31', amount: 'GrossMnthly30', desc: 'FillIn30' },
  { printed: '32', amount: 'GrossMnthly31', desc: 'FillIn31' },
  { printed: '33', amount: 'GrossMnthly32', desc: 'FillIn32' },
  { printed: '34', amount: 'GrossMnthly33', desc: 'FillIn33' },
  { printed: '35', amount: 'GrossMnthly34', desc: 'FillIn34' },
];
const EXPENSES = [
  { printed: '37', key: 's5_37_materials_purchased', leaf: 'ActlMnthly36[0]', label: 'Materials Purchased' },
  { printed: '38', key: 's5_38_inventory_purchased', leaf: 'ActlMnthly36[1]', label: 'Inventory Purchased' },
  { printed: '39', key: 's5_39_gross_wages_and_salaries', leaf: 'ActlMntly38', label: 'Gross Wages & Salaries' },
  { printed: '40', key: 's5_40_rent', leaf: 'ActlMnthly39', label: 'Rent' },
  { printed: '41', key: 's5_41_supplies', leaf: 'ActlMnthly40', label: 'Supplies' },
  { printed: '42', key: 's5_42_utilities_telephone', leaf: 'ActlMnthly41', label: 'Utilities/Telephone' },
  { printed: '43', key: 's5_43_vehicle_gasoline_oil', leaf: 'ActlMnthly42', label: 'Vehicle Gasoline/Oil' },
  { printed: '44', key: 's5_44_repairs_and_maintenance', leaf: 'ActlMnhtly43', label: 'Repairs & Maintenance' },
  { printed: '45', key: 's5_45_insurance', leaf: 'ActlMnthly44', label: 'Insurance' },
  { printed: '46', key: 's5_46_current_taxes', leaf: 'ActlMnthly45', label: 'Current Taxes' },
  { printed: '47', key: 's5_47_other_expenses', leaf: 'ActlMnthly46', label: 'Other Expenses (Specify)' },
  { printed: '48', key: 's5_48_irs_allowable_installment_payments', leaf: 'ActlMnthly47', label: 'IRS Use Only-Allowable Installment Payments' },
];
const markerWitness6 = (lane, printed, label, extra) =>
  `Row fixed by the printed marker ${printed} at y ${markerY6[`${lane}${printed}`]}, x ${lane === 'i' ? 38 : 304.4}, whose baseline lies inside this cell's rectangle, AND by the printed item name "${label}" drawn on that same baseline immediately right of the marker. ${extra}`;

for (const r of INCOME) {
  const target = `${P6}TotalIncome[0].${r.leaf}[0]`;
  add(6, r.key, target, pairC(6, target, 'Gross Monthly'),
    'C — column caption contained, above the cell',
    markerWitness6('i', r.printed, r.label, `Column fixed by the header "Gross Monthly" at y 636.0 x 233.0..285.4, contained in this cell's x 226.0..302.4, under the block caption "Total Monthly Business Income" at y 653.5 x 109.4..229.0. A printed "$" is drawn at x 218.8 immediately left of the cell and the widget carries maxLen ${W6.get(target).maxLen}.`));
}
OTHER_INCOME.forEach((r, ri) => {
  const amt = `${P6}TotalIncome[0].${r.amount}[0]`;
  add(6, `other_income[${ri}].amount`, amt, pairC(6, amt, 'Gross Monthly'),
    'C — column caption contained, above the cell',
    markerWitness6('i', r.printed, 'Other Income (Specify below)', `The five rows 31-35 draw NO printed item name of their own — the single caption "Other Income (Specify below)" at y 572.1 x 53.6..159.1 sits above all five and the filer names each one in the cell beside it. Column fixed by the "Gross Monthly" header; a printed "$" at x 218.8 is immediately left of the cell; maxLen ${W6.get(amt).maxLen}.`));
  const desc = `${P6}TotalIncome[0].${r.desc}[0]`;
  add(6, `other_income[${ri}].description`, desc, pairC(6, desc, 'Other Income (Specify below)'),
    'C — the block caption contained, above the cell',
    markerWitness6('i', r.printed, 'Other Income (Specify below)', `This is the SPECIFY cell the caption's own word points at. It is the only cell in the income lane left of the amount column, x 47.0..216.0, maxLen ${W6.get(desc).maxLen}, and rows 26-30 draw no such cell because their item names are printed.`));
});
{
  const tot = `${P6}TotalIncome[0].GrossMnthly35[0]`;
  add(6, 's5_36_total_income', tot, pairC(6, tot, 'Gross Monthly'),
    'C — column caption contained, above the cell',
    markerWitness6('i', '36', 'Total Income', `The operand list is the caption's own: "(Add lines 26 through 35)" at y 507.3 x 105.7..195.2. T does not apply — this total sits IN the income column rather than on a total line of its own, so it takes the column caption like every other cell in the lane, and the printed "$" at x 218.8 is the column's marker, not a total-line marker. maxLen ${W6.get(tot).maxLen}.`));
}
for (const r of EXPENSES) {
  const leaf = r.leaf.includes('[') ? r.leaf : `${r.leaf}[0]`;
  const target = `${P6}TotalExpenses[0].${leaf}`;
  add(6, r.key, target, pairC(6, target, 'Actual Monthly'),
    'C — column caption contained, above the cell',
    markerWitness6('e', r.printed, r.label, `Column fixed by the header "Actual Monthly" at y 635.9 x 502.5..555.9, contained in this cell's x 492.4..576.0, under the block caption "Total Monthly Business Expenses" at y 653.5 x 375.1..503.3. A printed "$" is drawn at x 485.2 immediately left of the cell.` +
      (r.printed === '38' ? ' THIS CELL\'S LEAF NAME IS ActlMnthly36[1] — the same leaf name the printed-37 cell above it carries, and two printed markers behind rather than one. See NOT_OFFSET6.' : '')));
}
{
  const te = `${P6}TotalExpenses[0].ActlMnthly48[0]`;
  add(6, 's5_49_total_expenses', te, pairC(6, te, 'Actual Monthly'),
    'C — column caption contained, above the cell',
    markerWitness6('e', '49', 'Total Expenses', 'The operand list is the caption\'s own: "(Add lines 37 through 48)" at y 496.5 x 380.6..470.1. One of those operands, line 48, is an IRS-use cell this engine never writes — declared at _never_autofill and carried into the tripwire declaration rather than assumed away.'));
  const ni = `${P6}TotalExpenses[0].ActlMnthly49[0]`;
  add(6, 's5_50_net_income', ni, pairC(6, ni, 'Actual Monthly'),
    'C — column caption contained, above the cell',
    markerWitness6('e', '50', 'Net Income', 'The relation is the caption\'s own: "(Line 36 minus Line 49)" at y 485.7 x 366.2..448.4. It is a DIFFERENCE and the printed order is stated, which is what makes it checkable; the same construct 433-B(OIC) Box D uses.'));
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// EVERY WIDGET ON BOTH PAGES IS BOUND EXACTLY ONCE
// ═══════════════════════════════════════════════════════════════════════════════════════
const allTargets = [...W5.keys(), ...W6.keys()];
const unbound = allTargets.filter((n) => !seenTarget.has(n));
if (unbound.length) stop(`${unbound.length} widget(s) on pages 5 and 6 are bound by nothing: ${unbound.join(', ')}`);
if (seenTarget.size !== allTargets.length) stop(`${seenTarget.size} bindings against ${allTargets.length} widgets`);
console.log(`bindings: ${B.length} — page 5 ${B.filter((b) => b.page === 5).length}, page 6 ${B.filter((b) => b.page === 6).length}; every widget on both pages bound exactly once.`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE FIVE FLAG CLASSES, EACH A CHECKED PRESENCE OR A CHECKED ABSENCE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// THE PROBE IS PER RUN, AND THE JOINED-TEXT PROBE IS RUN BESIDE IT AND COMPARED.
//
// The first draft of this block joined every run on a page with a space and searched the
// result — which is what the page-4 slice does and what count-sweep does for its absence
// claims. On page 6 THAT PRODUCED A HIT THE PAGE DOES NOT DRAW: the banner "Section 5: Monthly
// Income/Expenses Statement for Business" is followed by the run "Accounting Method Used:", and
// the join makes "Business Accounting". A phrase manufactured at a run boundary is not a phrase
// on the page, and an absence claim refuted by one is refuted by the reader rather than by the
// form ([R-05] in the other direction — the evidence could not have supported the conclusion).
//
// So the per-run count is THE answer, the joined count is computed anyway, and any difference
// is named with the runs that made it. Reporting only the per-run figure would silently drop
// the fact that this page's text can manufacture one.
const FLAG_PROBES = ['primary residence', 'business account', 'check if', '1040', 'household'];
const rx = (s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
const flag = {}, manufactured = [];
for (const p of [5, 6]) {
  const runs = p === 5 ? R5 : R6;
  for (const probe of FLAG_PROBES) {
    const perRun = runs.reduce((n, t) => n + (t.str.toLowerCase().match(rx(probe)) || []).length, 0);
    const joinedN = (runs.map((t) => t.str).join(' ').toLowerCase().match(rx(probe)) || []).length;
    flag[`p${p}:${probe}`] = perRun;
    if (joinedN !== perRun) {
      // name the boundary that made it
      const at = [];
      for (let i = 0; i + 1 < runs.length; i++)
        if (`${runs[i].str} ${runs[i + 1].str}`.toLowerCase().includes(probe)) at.push(`${JSON.stringify(runs[i].str)} + ${JSON.stringify(runs[i + 1].str)}`);
      manufactured.push(`p${p} ${JSON.stringify(probe)}: per-run ${perRun}, joined ${joinedN} — manufactured at ${at.join(' | ') || '(a boundary this scan could not name)'}`);
    }
  }
}
const boxes5 = [...W5.values()].filter((w) => w.type === 'PDFCheckBox').length;
const boxes6 = [...W6.values()].filter((w) => w.type === 'PDFCheckBox').length;
console.log(`flag-class probes, per run: ${Object.entries(flag).map(([k, v]) => `${k}=${v}`).join(' ')}`);
for (const m of manufactured) console.log(`  JOIN ARTEFACT — ${m}`);
console.log(`checkbox widgets: page 5 ${boxes5}, page 6 ${boxes6}`);
const nonZero = Object.entries(flag).filter(([, v]) => v > 0);
if (nonZero.length) stop(`a flag-class phrase is drawn on these pages and the map declares none: ${nonZero.map(([k, v]) => `${k}x${v}`).join(', ')}. Read it and decide.`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════════════
const out = {
  bindings: B,
  offset: {
    page5: { offset: offset5.length, exceptions: Object.fromEntries(Object.entries(NOT_OFFSET).map(([k, v]) => [k.replace('topmostSubform[0].', ''), v])), agreeing: agree5.length },
    page6: { offset: offset6.length, exceptions: Object.fromEntries(Object.entries(NOT_OFFSET6).map(([k, v]) => [k.replace('topmostSubform[0].', ''), v])), agreeing: agree6.length },
  },
  flags: { probes: flag, join_artefacts: manufactured, checkbox_widgets: { page5: boxes5, page6: boxes6 } },
  markers: { page5: WANT5.map((m) => `${m}@y${markerY5[m]}`), page6_income: WANT_INC, page6_expense: WANT_EXP },
};
writeFileSync('adapters/pdf/tmp/slice4.derived.json', JSON.stringify(out, null, 1) + '\n');
console.log('derived evidence -> adapters/pdf/tmp/slice4.derived.json');
console.log(`pairing rules used: ${[...new Set(B.map((b) => b.pairing.split(' ')[0]))].sort().join(', ')}`);
for (const rule of [...new Set(B.map((b) => b.pairing.split(' ')[0]))].sort())
  console.log(`  ${rule.padEnd(3)} ${B.filter((b) => b.pairing.startsWith(rule + ' ')).length} cell(s)`);
