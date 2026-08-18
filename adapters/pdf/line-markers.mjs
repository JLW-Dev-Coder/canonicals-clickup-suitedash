// Every printed line marker on a form, with its page and its y, plus the widget nearest to it.
//
//   node adapters/pdf/line-markers.mjs <form>
//
// WHY THE MARKERS ARE EXTRACTED SEPARATELY
// ----------------------------------------
// A map is authored BY LINE — "line 18a", "line (39)" — because that is how the taxpayer, the
// examiner and the instructions all refer to a cell. The AcroForm names look like they encode
// the same thing (`p2_t23_14a[0]`, `Interest_Dividends[1]`) and on 433-A they systematically
// DO NOT: every internal suffix lagged the printed line by one, form-wide. A map author who
// reads `14a` off a field name and writes it into the map has recorded a line number that is
// off by one everywhere, and nothing downstream can tell, because both numbers exist.
//
// So the marker is read from the DRAWN TEXT and the widget is attached to it by geometry. What
// the name says is reported alongside, never used.
//
// WHAT COUNTS AS A MARKER differs by form and is not guessed. 433-A prints bare "18a"; the OIC
// forms print parenthesised "(39)" and lettered "Box D". Both spellings are accepted, and a
// form printing neither reports zero rather than inventing a pattern that fits.

import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry } from './page-geometry.mjs';

const form = process.argv[2];
if (!form) {
  console.error('usage: node adapters/pdf/line-markers.mjs <form>');
  process.exit(2);
}
const src = `adapters/pdf/forms/f${form}.pdf`;
const bytes = readFileSync(src);
const text = await readPrintedText(bytes);
const { widgets, pageCount } = await readWidgetGeometry(bytes);

// "18a" / "18a." / "(39)" / "(39) $" — the trailing "$" is the currency glyph the IRS sets in
// the same run as the marker on the OIC forms, so it is stripped rather than treated as text.
// "Box D" is a marker in its own right: the OIC totals are referred to by box, not by line.
const LINE = /^\(?(\d{1,2}[a-z]?)\)?[.:]?\s*\$?$/i;
// Anchored at the START of the drawn run, not searched anywhere in it. 433-A(OIC) sets the box
// label and its caption as ONE run ("Box G Future Remaining Income"), so an exact-match pattern
// finds Boxes A-F and misses G and H entirely — the two that carry the offer calculation. A
// pattern that searched anywhere would instead match the body sentence "Enter the total from
// Box F", which is prose about a box on another page and numbers nothing.
const BOX = /^Box\s+([A-Z])\b/i;

const r1 = (n) => Math.round(n * 10) / 10;
const rows = [];
for (let p = 0; p < pageCount; p++) {
  for (const t of text[p]?.items || []) {
    const line = (t.str.match(LINE) || [])[1];
    const box = (t.str.match(BOX) || [])[1];
    if (!line && !box) continue;
    rows.push({
      page: p + 1,
      marker: box ? `Box ${box.toUpperCase()}` : line,
      kind: box ? 'box' : 'line',
      y: r1(t.y2),
      x1: r1(t.x1),
      x2: r1(t.x2),
      text: t.str,
    });
  }
}

// The widget this marker belongs to: same page, vertically overlapping the marker's band, and
// the nearest one to its RIGHT. Markers on these forms sit left of the cell they number — on
// 433-A(OIC)'s Section 7 the marker IS the only thing that identifies the row, because the
// caption above every cell in that column is the column header, shared by all of them.
// Matched by BAND CONTAINMENT, not by top-edge proximity. A marker is set at its own baseline
// and the cell it numbers is a box around that baseline, so the two top edges differ by however
// tall the box is — on 433-A(OIC)'s line (39) that is 9.9pt, which a top-edge tolerance either
// misses or has to be widened so far that it starts catching the row above.
// RANKED BY VERTICAL CENTRE, not by array order. Containment alone is not enough: 433-A(OIC)'s
// Section 7 money cells are tall enough that two consecutive cells both contain a marker's y,
// and both sit at the same x. Taking the first match then hands line (33) to the widget for
// line (32) — an off-by-one that looks entirely plausible and is exactly what this tool exists
// to prevent. Distance from the marker to each candidate's vertical centre separates them.
const TOL_Y = 2;
const attach = (m) => {
  const mid = (w) => (w.rect[1] + w.rect[3]) / 2;
  const cands = widgets
    .filter((w) => w.page === m.page && w.rect
      && m.y >= w.rect[1] - TOL_Y && m.y <= w.rect[3] + TOL_Y
      && w.rect[0] >= m.x2 - TOL_Y)
    .sort((a, b) => Math.abs(mid(a) - m.y) - Math.abs(mid(b) - m.y) || a.rect[0] - b.rect[0]);
  return cands[0] || null;
};

console.log(`${src} — ${pageCount} pages, ${rows.length} printed marker(s)`);
let attached = 0;
for (let p = 1; p <= pageCount; p++) {
  const onPage = rows.filter((r) => r.page === p).sort((a, b) => b.y - a.y || a.x1 - b.x1);
  console.log(`\n--- page ${p}: ${onPage.length} marker(s) ---`);
  for (const m of onPage) {
    const w = attach(m);
    if (w) attached++;
    console.log(
      `  ${String(m.marker).padStart(6)}  y=${String(m.y).padStart(6)}  x=${String(m.x1).padStart(6)}..${String(m.x2).padStart(6)}  ` +
      `-> ${w ? w.name : '(no widget to its right on this row)'}`
    );
  }
}
console.log(`\n${attached} of ${rows.length} marker(s) have a widget on the same row to their right.`);
