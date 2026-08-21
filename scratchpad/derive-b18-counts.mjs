// [B18] — DERIVES the size of the unconverted coordinate prose on 433-B(OIC).
//
//   node scratchpad/derive-b18-counts.mjs
//
// [B18] records that the slice-1 and slice-2 evidence in 433boi.map.json quotes y values in
// BOTH conventions — some as text baselines, some as run tops — and that the landed prose is
// not rewritten to match the convention slice 3 declared. What it did not carry was HOW BIG
// the unconverted set is, and a carried item whose size nobody has measured is the shape this
// project removes. This derives it.
//
// THE UNIVERSE, DECLARED
//   regions   the slice-1 and slice-2 evidence blocks of adapters/pdf/maps/433boi.map.json,
//             named individually below. Slice 3's blocks are EXCLUDED: they are already in the
//             declared convention and _the_y_convention_in_this_file says so.
//   sites     every `y NNN.N` in those regions that is quoted TOGETHER WITH an x span in the
//             same clause — "y 635.9, x 176.4..273.3". That is how this repo quotes a PRINTED
//             TEXT RUN. A y quoted inside a `[x0, y0, x1, y1]` widget rect is NOT in the
//             universe: a rect legitimately states a top and a bottom, and counting those as
//             convention errors would inflate the answer with cells that are not wrong.
//   verdict   for each distinct y: is it drawn as a text BASELINE on the page it belongs to,
//             as a run TOP, as both, or as neither? Compared at 0.2pt, which is tighter than
//             align-block's 0.75 because these are transcriptions of exact values.
//
// NEITHER IS A STOP, NOT A ZERO. A quoted y that is neither a baseline nor a run top is a
// coordinate this derivation could not account for, and reporting it as "not a convention
// error" would be reading an unreadable input as agreement.
import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry } from '../adapters/pdf/page-geometry.mjs';

const SLICE_1_AND_2_REGIONS = [
  '_the_condition_that_governs_page_1',
  '_printed_headings_and_markers_first',
  '_no_lettered_box_on_this_page',
  '_map_evidence',
  '_nesting_note',
  '_arguable_page1',
  '_the_condition_that_governs_pages_2_and_3',
  '_printed_headings_and_markers_pages_2_and_3',
  '_the_four_names_that_lie_on_pages_2_and_3',
  '_Vehicle1_Mileage_1_AND_LicenseTagNumber_1_DRAW_ON_VEHICLE_ROW_2',
  '_map_evidence_pages_2_and_3',
  '_arguable_pages_2_and_3',
];

// "y 635.9, x 176.4..273.3" and "y 635.9 x 176.4..273.3" — a y with an x span beside it.
const RUN_QUOTE = /\by\s(\d+\.\d)[, ]+\s*x\s(\d+\.\d)/g;

const map = JSON.parse(readFileSync('adapters/pdf/maps/433boi.map.json', 'utf8'));
const pages = await readPrintedText(readFileSync('adapters/pdf/forms/f433boi.pdf'));
const baselines = new Set(), tops = new Set();
for (const pg of pages) for (const it of pg.items) { baselines.add(+it.y1.toFixed(1)); tops.add(+it.y2.toFixed(1)); }
// A THIRD SET, AND ADDING IT IS A FINDING RATHER THAN A CONVENIENCE. Four quoted y values —
// 476.6, 417.6, 390.2 and 386.6 — are neither a drawn baseline nor a drawn run top. They are
// WIDGET EDGES quoted in the run-quote syntax: "y 390.2, x 36.2..183.8" names the top of the
// field under "Frequency of tax deposits", whose caption baseline is 394.7. The first draft of
// this derivation assumed "y N, x N" always names a printed run and reported them UNACCOUNTED,
// which is the state that stopped it — an unreadable input must never be read as agreement.
// They are classified as widget edges rather than folded into either text verdict, because a
// widget edge is not in the wrong convention; it is a different kind of coordinate.
const widgetEdges = new Set();
for (const w of (await readWidgetGeometry(readFileSync('adapters/pdf/forms/f433boi.pdf'))).widgets) {
  if (!w.rect) continue;
  widgetEdges.add(+w.rect[1].toFixed(1)); widgetEdges.add(+w.rect[3].toFixed(1));
}

const ys = [];
const walk = (n) => {
  if (typeof n === 'string') { for (const m of n.matchAll(RUN_QUOTE)) ys.push(Number(m[1])); return; }
  if (Array.isArray(n)) return n.forEach(walk);
  if (n && typeof n === 'object') return Object.values(n).forEach(walk);
};
let regionsFound = 0;
for (const r of SLICE_1_AND_2_REGIONS) { if (map[r] !== undefined) { regionsFound += 1; walk(map[r]); } }
if (regionsFound !== SLICE_1_AND_2_REGIONS.length) {
  console.error(`STOP — ${SLICE_1_AND_2_REGIONS.length - regionsFound} declared region(s) are not present in the map. A universe that names a region the artefact does not hold is a universe nobody has checked.`);
  process.exit(2);
}

const near = (s, v) => { for (const x of s) if (Math.abs(x - v) <= 0.2) return true; return false; };
const distinct = [...new Set(ys)];
const onlyTop  = distinct.filter((v) => !near(baselines, v) && near(tops, v));
const onlyBase = distinct.filter((v) => near(baselines, v) && !near(tops, v));
const both     = distinct.filter((v) => near(baselines, v) && near(tops, v));
const unclassifiedText = distinct.filter((v) => !near(baselines, v) && !near(tops, v));
const widgetY = unclassifiedText.filter((v) => near(widgetEdges, v));
const neither  = unclassifiedText.filter((v) => !near(widgetEdges, v));

console.log(`[B18] unconverted coordinate prose on 433-B(OIC), derived`);
console.log(`  regions: ${regionsFound} slice-1 and slice-2 evidence block(s), named in this file`);
console.log(`  sites:   ${ys.length} "y N, x N" quotation(s), ${distinct.length} distinct y value(s)`);
console.log(`  drawn ONLY as a run top:   ${onlyTop.length}`);
console.log(`  drawn ONLY as a baseline:  ${onlyBase.length}`);
console.log(`  drawn as BOTH:             ${both.length}   (a y that is one run's baseline and another's top — no verdict is available for these from geometry alone)`);
console.log(`  a WIDGET EDGE, not a text run: ${widgetY.length}${widgetY.length ? `   ${widgetY.join(', ')}` : ''}`);
console.log(`  UNACCOUNTED:              ${neither.length}${neither.length ? `   ${neither.join(', ')}` : ''}`);
if (neither.length) {
  console.error('  UNACCOUNTED — a quoted y that is neither a drawn baseline nor a drawn run top. Reporting it as "not a convention error" would read an unreadable input as agreement.');
  process.exit(2);
}
