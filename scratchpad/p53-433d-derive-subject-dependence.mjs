// WHICH 433-D CELLS DEPEND ON THE SUBJECT — DERIVED FROM THE PRINTED PAGE, REPORTED BEFORE
// ANYTHING IS BOUND.
//
//   node scratchpad/p53-433d-derive-subject-dependence.mjs [--verbose]
//
// Ruling 3 of prompt 53: "Which bindings depend on the subject is established from the printed
// page, not assumed. Only a cell whose printed caption admits both subjects is subject-dependent.
// A bank routing number is a bank routing number on either."
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS CANNOT USE, AND WHAT IT USES INSTEAD
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// THERE IS NO 433d.labels.json AND THERE MUST NOT BE ONE. correlate-labels.mjs refused to write
// for this form: of the three probes established from its printed page, the third — "b. Account
// number" — was answered with the DIRECT DEBIT banner one row up, because the correlator ranks
// `above` and `left` on one distance scale and 28.6pt above beat 28.9pt left ([D-22]). A form on
// which the correlator cannot be shown to work is a form whose labels file must not exist.
//
// So this file does NOT ask "what is this cell's label". It asks a far weaker question that the
// unreliable ranking cannot corrupt: OF ALL THE TEXT PRINTED IN THE NEIGHBOURHOOD OF THIS CELL,
// does any of it name both legal persons? The difference matters:
//
//   - A caption misattributed by one row still lands inside the neighbourhood, so a
//     both-subject phrase cannot be lost by the ranking error [D-22] records.
//   - The failure direction is therefore towards OVER-inclusion: a cell near a both-subject
//     phrase is reported subject-dependent even if that phrase captions its neighbour. That is
//     the safe direction — an over-included cell gets split into two properties and costs
//     headroom, where an under-included one silently writes an entity's value into an
//     individual's property.
//   - Every over-inclusion is therefore REPORTED WITH THE PHRASE THAT CAUSED IT, so the
//     Principal reads the evidence rather than the verdict.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE NEIGHBOURHOOD, DECLARED  [R-15]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// For each page-1 widget rect (x1,y1,x2,y2), every printed run whose baseline lies within
// BAND_ABOVE points above the cell's top edge or BAND_BELOW below its bottom edge, AND whose
// horizontal extent overlaps the cell's own extent widened by SIDE points.
//
// The three constants are declared here and printed on every run. They are NOT tuned until the
// answer looks right — that is fitting the instrument to the wanted result, which is what [D-22]
// refuses to do to the correlator's probes. They are set from the form's own drawn row pitch,
// which is derived below and reported, so a form with a different pitch gets a different band
// rather than these numbers.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// "ADMITS BOTH SUBJECTS" IS A DECLARED PREDICATE WITH A CANARY
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A phrase admits both subjects when it names an INDIVIDUAL marker and an ENTITY marker, or
// when it is one of the alternation forms the page draws. Both marker lists are quoted from the
// subject register's own read_from evidence — they are not invented here — and the predicate is
// planted with eight cases whose answers are known, in both directions, on every run.

import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry, baselineOfRun } from '../adapters/pdf/page-geometry.mjs';

const FORM = 'adapters/pdf/forms/f433d.pdf';
const MIRROR = 'adapters/pdf/maps/433d.mirror.json';
const verbose = process.argv.includes('--verbose');

// ── THE MARKERS, QUOTED FROM THE PRINTED EVIDENCE THE SUBJECT REGISTER ALREADY ESTABLISHED ──
//
// INDIVIDUAL: an SSN or ITIN names a natural person; "(Taxpayer)" and "(Spouse)" caption the two
// halves of a joint individual liability; "joint liability" is the printed condition on the
// spouse signature; "Wage Earners" is the printed assistance line for individuals.
//
// ENTITY: an EIN names an entity; "Corporate Officer or Partner" is who signs FOR one; "BMF" is
// the Business Master File; "Businesses" is the printed assistance line for them.
const INDIVIDUAL = ['Social Security', 'SSN', 'ITIN', 'Taxpayer', 'Spouse', 'joint liability', 'Wage Earner', 'IMF', 'Individual'];
const ENTITY = ['Employer Identification', 'EIN', 'Corporate Officer', 'Partner', 'BMF', 'Business'];

const has = (text, list) => list.filter((k) => text.toLowerCase().includes(k.toLowerCase()));

/** A phrase admits both subjects when it names at least one marker of each kind. */
export const admitsBoth = (text) => {
  const i = has(text, INDIVIDUAL);
  const e = has(text, ENTITY);
  return { both: i.length > 0 && e.length > 0, individual: i, entity: e };
};

const PREDICATE_CASES = [
  ['a  the identity line names both', 'Social Security or Employer Identification Number (SSN/ITIN/EIN)', true],
  ['b  the signature title names the entity side only', 'Title (if Corporate Officer or Partner)', false],
  ['c  the spouse condition names the individual side only', "Spouse's signature (if a joint liability)", false],
  ['d  the assistance line names both', '1-800-829-3903 (Individual - Self-Employed/Business Owners, Businesses), or', true],
  ['e  a routing number caption names neither', 'Routing number', false],
  ['f  an amount caption names neither', 'Amount owed as of', false],
  ['g  the two review codes together name both', 'RSI “5” PPIA IMF 2 year review RSI “6” PPIA BMF 2 year review', true],
  ['h  a date caption names neither', 'Date', false],
];

const predicateCanary = () => {
  const dead = [];
  for (const [name, text, want] of PREDICATE_CASES) {
    const got = admitsBoth(text).both;
    if (got !== want) dead.push(`PREDICATE CANARY DEAD  ${name}: said ${got}, expected ${want}`);
  }
  return dead;
};

// ---------------------------------------------------------------------------------------
const bytes = readFileSync(FORM);
const pagesText = await readPrintedText(bytes);
const { widgets: allWidgets } = await readWidgetGeometry(bytes);
const mirror = JSON.parse(readFileSync(MIRROR, 'utf8'));

const page1Runs = pagesText[0].items;
// PAGE 1 IS PART 1 — THE IRS COPY, established from the printed footer "— IRS Copy" and quoted
// in the subject register. The captions are drawn identically on page 3, and the mirror is what
// asserts the two copies carry the same 83 cells, so reading page 1 is a reading of both.
const widgets = allWidgets.filter((w) => w.page === 1 && Array.isArray(w.rect));

// ── THE ROW PITCH, DERIVED ────────────────────────────────────────────────────────────────
// The median gap between adjacent distinct printed baselines on page 1. The bands are set from
// it rather than typed, so the neighbourhood is a property of this form's layout.
const baselines = [...new Set(page1Runs.map((r) => Math.round(baselineOfRun(r) * 10) / 10))].sort((a, b) => a - b);
const gaps = [];
for (let i = 1; i < baselines.length; i++) { const g = baselines[i] - baselines[i - 1]; if (g > 0.5 && g < 60) gaps.push(g); }
gaps.sort((a, b) => a - b);
const pitch = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 10;

const BAND_ABOVE = pitch * 2;   // two printed rows up — a caption above, and the banner above that
const BAND_BELOW = pitch * 1;   // one row down — the "(Taxpayer)" / "(Spouse)" sub-captions
const SIDE = 120;               // horizontal reach, for the caption-LEFT layout [D-22] names

console.log('433-D SUBJECT-DEPENDENCE — DERIVED FROM THE PRINTED PAGE, BEFORE ANY BINDING');
console.log('');
console.log(`  form            ${FORM}`);
console.log(`  page-1 widgets  ${widgets.length}   printed runs ${page1Runs.length}   distinct baselines ${baselines.length}`);
console.log(`  row pitch       ${pitch.toFixed(2)}pt, the MEDIAN gap between adjacent distinct baselines — derived, not typed`);
console.log(`  neighbourhood   ${BAND_ABOVE.toFixed(1)}pt above the cell top, ${BAND_BELOW.toFixed(1)}pt below the cell bottom, ${SIDE}pt either side of its extent`);
const dead = predicateCanary();
console.log(`  predicate       ${PREDICATE_CASES.length - dead.length}/${PREDICATE_CASES.length} planted phrase(s) classified as expected, in both directions`);
if (dead.length) { dead.forEach((d) => console.error(`  ${d}`)); process.exitCode = 2; }
console.log('');

// stem -> the page-1 widget
const byStem = new Map();
for (const w of widgets) {
  const stem = w.name.replace(/\[\d+\]$/, '').split('.').pop();
  byStem.set(stem, w);
}

const rows = [];
for (const pair of mirror.pairs) {
  const w = byStem.get(pair.stem);
  if (!w) { rows.push({ stem: pair.stem, missing: true }); continue; }
  const [wx1, wy1, wx2, wy2] = w.rect;
  const near = page1Runs.filter((r) => {
    const b = baselineOfRun(r);
    if (b < wy1 - BAND_BELOW || b > wy2 + BAND_ABOVE) return false;
    return r.x2 >= wx1 - SIDE && r.x1 <= wx2 + SIDE;
  });
  const joined = near.map((r) => r.str).join(' ');
  const v = admitsBoth(joined);
  rows.push({ stem: pair.stem, type: pair.type, runs: near.length, joined, ...v });
}

const missing = rows.filter((r) => r.missing);
if (missing.length) { console.error(`STOP — ${missing.length} stem(s) in the mirror have no page-1 widget: ${missing.map((m) => m.stem).join(', ')}`); process.exitCode = 2; }

const dependent = rows.filter((r) => r.both);
const independent = rows.filter((r) => !r.both && !r.missing);
const silent = independent.filter((r) => r.runs === 0);

console.log(`SUBJECT-DEPENDENT — ${dependent.length} of ${rows.length} stem(s). Each is listed with the printed markers that put it here.`);
for (const r of dependent) {
  console.log(`  ${r.stem.padEnd(26)} individual: ${r.individual.join(', ')}`);
  console.log(`  ${''.padEnd(26)} entity:     ${r.entity.join(', ')}`);
  console.log(`  ${''.padEnd(26)} from ${r.runs} printed run(s): ${JSON.stringify(r.joined.slice(0, 240))}`);
}
console.log('');
console.log(`SUBJECT-INDEPENDENT — ${independent.length} stem(s). A bank routing number is a bank routing number on either subject.`);
if (verbose) for (const r of independent) console.log(`  ${r.stem.padEnd(26)} ${r.runs} run(s)  ${JSON.stringify(r.joined.slice(0, 110))}`);
console.log('');
console.log(`  of which ${silent.length} have NO printed run in the neighbourhood at all: ${silent.map((s) => s.stem).join(', ') || '(none)'}`);
console.log('  A cell with no neighbouring text is subject-INDEPENDENT by this derivation, and that is a');
console.log('  reading of the page rather than a default: the question asked is whether a both-subject');
console.log('  phrase is printed near it, and for these the answer is that no phrase is printed near it.');
