// Print the printed text and the AcroForm widgets of one page BAND in one coordinate space.
//
//   node adapters/pdf/align-block.mjs <form> <page 1-based> [yMin] [yMax]
//   node adapters/pdf/align-block.mjs 433aoi 6 250 470
//
// WHY THIS IS ITS OWN TOOL
// ------------------------
// correlate-labels.mjs answers "what text is nearest this widget", one widget at a time, and
// that is the right question for most of a form. It is the WRONG question for a block whose
// widgets outnumber its captions: a grid where thirty widgets sit under two printed headings
// collapses — every widget in a column reports the same caption, and the report reads as if
// the correlation succeeded. Nothing about a per-widget nearest-neighbour answer can show
// that, because each individual answer is correct.
//
// So this tool refuses to choose. It lays the two things side by side, sorted the way the page
// reads, and leaves the pairing to whoever is authoring the map. What it adds over reading the
// PDF in a viewer is the numbers: a printed column header's x-RANGE and a widget's x, which is
// the only evidence that says which column a cell is in when the captions have run out.
//
// Three blocks on 433-A needed it — sheet 3, sheet 6, and the Section 7 grid where thirty
// widgets collapsed onto two captions — and each was found by the widget count exceeding the
// caption count in the band, not by anything failing.
//
// /MaxLen IS REPORTED HERE because it is the input constraint that the fill engines hard-stop
// on. A column authored against a 12-character cell and a 36-character cell in the same
// printed row is a defect the geometry alone does not show.
//
// COORDINATES are PDF user space from page-geometry.mjs — the same source correlate-labels.mjs
// and verify-headings.mjs read, so those three can never disagree about where anything is.
// y ASCENDS up the page, so a band is given as [yMin, yMax] and the output reads top-down.

import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry } from './page-geometry.mjs';

const [form, pageArg, yMinArg, yMaxArg] = process.argv.slice(2);
if (!form || !pageArg) {
  console.error('usage: node adapters/pdf/align-block.mjs <form> <page 1-based> [yMin] [yMax]');
  process.exit(2);
}
const pageNo = Number(pageArg);          // 1-based, as readWidgetGeometry reports it
const page = pageNo - 1;                 // 0-based, as readPrintedText indexes it
const yMin = yMinArg === undefined ? -Infinity : Number(yMinArg);
const yMax = yMaxArg === undefined ? Infinity : Number(yMaxArg);

const src = `adapters/pdf/forms/f${form}.pdf`;
const bytes = readFileSync(src);
const text = await readPrintedText(bytes);
const { widgets, pageCount } = await readWidgetGeometry(bytes);

const r1 = (n) => Math.round(n * 10) / 10;
const pad = (n, w) => String(n).padStart(w);

// Band to 3pt so a caption sitting a point high does not sort above the row it belongs to.
// Same banding correlate-labels.mjs uses for reading order, for the same reason.
const byRow = (ay, ax, by, bx) => Math.round(by / 3) - Math.round(ay / 3) || ax - bx;

const items = (text[page]?.items || []).filter((t) => t.y1 >= yMin && t.y2 <= yMax);
const ws = widgets.filter((w) => w.page === pageNo && w.rect && w.rect[3] >= yMin && w.rect[1] <= yMax);

console.log(`${src} — page ${pageNo} of ${pageCount}, band y ${yMin}..${yMax}`);
console.log(`  ${items.length} printed text item(s), ${ws.length} widget(s)`);
if (ws.length > items.length) {
  console.log('  NOTE more widgets than printed items in this band — the captions cannot be');
  console.log('       one-per-widget, which is the condition this tool exists for.');
}

console.log('\n--- PRINTED (y descending, then x) ---');
for (const t of [...items].sort((a, b) => byRow(a.y2, a.x1, b.y2, b.x1))) {
  console.log(`  y=${pad(r1(t.y2), 6)}  x=${pad(r1(t.x1), 6)}..${pad(r1(t.x2), 6)}  ${JSON.stringify(t.str)}`);
}

console.log('\n--- WIDGETS (y descending, then x) ---');
for (const w of [...ws].sort((a, b) => byRow(a.rect[3], a.rect[0], b.rect[3], b.rect[0]))) {
  const len = w.maxLen === undefined || w.maxLen === null ? '   -' : pad(w.maxLen, 4);
  console.log(`  y=${pad(r1(w.rect[3]), 6)}  x=${pad(r1(w.rect[0]), 6)}..${pad(r1(w.rect[2]), 6)}  /MaxLen=${len}  ${w.name}`);
}
