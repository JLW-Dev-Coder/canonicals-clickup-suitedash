// Pair every AcroForm widget with the printed text drawn next to it.
//
// Why this exists: field names on these forms carry no meaning (`p2_t23_14a[0]`), and
// Rev. 6-2026 renumbered lines relative to Rev. 7-2022, so no knowledge from the older
// form transfers. Inferring a field's meaning from its name is the same class of error
// as inventing a field name — and it fails SILENTLY, because a wrong-but-real target
// passes the validator and mis-fills a cell on a filed form. So the label is extracted
// mechanically from the PDF and the map is authored against that.
//
// Geometry comes from two sources that must share one coordinate space:
//   - widget rects  <- pdf-lib   (PDF user space, origin at MediaBox lower-left, y up)
//   - text items    <- pdfjs-dist (same space; NO rotated viewport is applied)
// Both are verified against the MediaBox below; a non-zero origin is reported, not
// silently absorbed.
//
// CLI: node adapters/pdf/correlate-labels.mjs <form>
// Out: adapters/pdf/maps/<form>.labels.json   full per-widget candidate record
//      adapters/pdf/maps/<form>.labels.txt    reading order, one line per widget

import { readFileSync, writeFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry } from './page-geometry.mjs';

const form = process.argv[2] || '433a';
const src = `adapters/pdf/forms/f${form}.pdf`;
const outJson = `adapters/pdf/maps/${form}.labels.json`;
const outTxt = `adapters/pdf/maps/${form}.labels.txt`;

const TOL = 2;          // point slack on the overlap tests

const bytes = readFileSync(src);

// Both coordinate sets come from page-geometry.mjs so that this tool and verify-headings.mjs
// can never disagree about where a widget is. See that file for the MediaBox reasoning.
const text = await readPrintedText(bytes);
const { widgets: geometry, fieldNames, originNotes, pageCount } = await readWidgetGeometry(bytes);
// ----------------------------------------------------------------- correlation
const round = (n) => Math.round(n * 10) / 10;

function candidates(pageIdx, r) {
  const items = text[pageIdx]?.items || [];
  const left = [], right = [], above = [], inside = [], near = [];

  for (const t of items) {
    const vOverlap = t.y1 < r.y2 + TOL && t.y2 > r.y1 - TOL;
    const hOverlap = t.x1 < r.x2 + TOL && t.x2 > r.x1 - TOL;

    if (t.x2 <= r.x1 + TOL && vOverlap) left.push({ text: t.str, distance: round(r.x1 - t.x2) });
    // RIGHT is not decoration: every checkbox on this form prints its option to the
    // right of the box ("[ ] Weekly  [ ] Monthly"). Without it the four pay-period
    // boxes all collapse onto the same caption and the Yes/No pairs are
    // indistinguishable — which would make the P10 exclusive sets unauthorable.
    if (t.x1 >= r.x2 - TOL && vOverlap) right.push({ text: t.str, distance: round(t.x1 - r.x2) });
    if (t.y1 >= r.y2 - TOL && hOverlap) above.push({ text: t.str, distance: round(t.y1 - r.y2) });

    const cx = (t.x1 + t.x2) / 2, cy = (t.y1 + t.y2) / 2;
    if (cx >= r.x1 - TOL && cx <= r.x2 + TOL && cy >= r.y1 - TOL && cy <= r.y2 + TOL)
      inside.push({ text: t.str, distance: 0 });

    const dx = Math.max(r.x1 - t.x2, t.x1 - r.x2, 0);
    const dy = Math.max(r.y1 - t.y2, t.y1 - r.y2, 0);
    near.push({ text: t.str, distance: round(Math.hypot(dx, dy)) });
  }

  const byDist = (a, b) => a.distance - b.distance;
  return {
    left: left.sort(byDist).slice(0, 3),
    right: right.sort(byDist).slice(0, 3),
    above: above.sort(byDist).slice(0, 3),
    inside: inside.slice(0, 3),
    nearest: near.sort(byDist).slice(0, 5),
  };
}
const EMPTY = { left: [], right: [], above: [], inside: [], nearest: [] };

// Choosing the label.
//
// Nearest-in-any-direction is NOT good enough here. The closest text to a widget is
// very often the printed line marker ("1a", "19a") or a bare currency "$", and on this
// form those frequently belong to the ADJACENT cell — the 1a name box has "1c" sitting
// 0.0pt to its left. Taking the raw nearest yields a confident, useless, sometimes
// wrong-row label.
//
// So: drop markers and punctuation, then take the nearest DESCRIPTIVE text across
// left/above/inside (the form's dominant pattern is a caption ~3pt ABOVE its entry box,
// with left-side labels on the Yes/No checkbox rows). The line marker is then recovered
// separately from the SAME direction bucket at a comparable distance, so the marker
// always belongs to the row that supplied the label.
const isMarker = (s) => /^\(?\d{1,2}[a-z]?\)?[.:]?$/i.test(s);
const isDescriptive = (s) => s.length >= 2 && /[A-Za-z]/.test(s) && !isMarker(s);

/** Nearest descriptive candidate across the given buckets, in order. */
function nearestDescriptive(c, dirs) {
  let winner = null;
  for (const dir of dirs) {
    for (const cand of c[dir] || []) {
      if (!isDescriptive(cand.text)) continue;
      if (!winner || cand.distance < winner.distance) winner = { ...cand, dir, pool: c[dir] };
    }
  }
  return winner;
}

/** Marker from the same bucket that supplied the label, at a comparable distance. */
function markerFor(winner) {
  if (!winner) return '';
  const m = winner.pool
    .filter(x => isMarker(x.text))
    .sort((a, b) => Math.abs(a.distance - winner.distance) - Math.abs(b.distance - winner.distance))[0];
  return m && Math.abs(m.distance - winner.distance) <= 2 ? m.text : '';
}

function pickLabel(c, type) {
  if (type === 'PDFCheckBox') {
    // A checkbox needs TWO pieces to be mappable: which question it belongs to, and
    // which option this particular box is. The option is printed to its right; the
    // question is the caption above or left of the group.
    const opt = nearestDescriptive(c, ['right']) || nearestDescriptive(c, ['nearest']);
    const ctx = nearestDescriptive(c, ['above', 'left']);
    const marker = markerFor(ctx) || markerFor(opt);
    const option = opt?.text ?? '';
    const context = ctx && ctx.text !== option ? ctx.text : '';
    const best = [marker, context, option && `[${option}]`].filter(Boolean).join(' ');
    return { label: option || context, option, context, marker, dir: opt?.dir ?? ctx?.dir ?? '', best };
  }

  const winner =
    nearestDescriptive(c, ['above', 'left', 'inside']) ||
    nearestDescriptive(c, ['right']) ||
    nearestDescriptive(c, ['nearest']);
  if (!winner) return { label: '', option: '', context: '', marker: '', dir: '', best: '' };
  const marker = markerFor(winner);
  return {
    label: winner.text,
    option: '',
    context: '',
    marker,
    dir: winner.dir,
    best: marker ? `${marker} ${winner.text}` : winner.text,
  };
}

const records = [];
for (const g of geometry) {
  const { name, type } = g;
  if (g.rect === null) {
    records.push({ name, type, page: null, rect: null, candidates: EMPTY, marker: '', label: '', option: '', context: '', labelFrom: '', best: '' });
    continue;
  }
  const r = { x1: g.rect[0], y1: g.rect[1], x2: g.rect[2], y2: g.rect[3] };
  const pageIdx = g.page === null ? null : g.page - 1;
  const c = pageIdx === null ? EMPTY : candidates(pageIdx, r);
  const p = pickLabel(c, type);
  records.push({
    name,
    type,
    widget: g.widget,
    widgets: g.widgets,
    page: g.page,
    rect: [round(r.x1), round(r.y1), round(r.x2), round(r.y2)],
    candidates: c,
    marker: p.marker,       // printed line marker, from the bucket that supplied the label
    label: p.label,         // printed caption, verbatim
    option: p.option,       // checkboxes only: this box's own option, printed to its right
    context: p.context,     // checkboxes only: the question the box belongs to
    labelFrom: p.dir,       // which direction supplied it
    best: p.best,           // composed from the parts above — every part extracted, none invented
  });
}

// ------------------------------------------------------------------ self-check
// A correlation tool that is quietly off by one row is worse than no tool, because
// everything downstream inherits the error. These three pairings are known from the
// printed form; if any fails, nothing is written.
const allText = (rec) =>
  [...rec.candidates.left, ...rec.candidates.above, ...rec.candidates.inside, ...rec.candidates.nearest]
    .map(x => x.text).join(' | ');

const find = (n) => records.find(r => r.name === n);
const checks = [];

const c1 = find('topmostSubform[0].Page1[0].c1[0].Lines1a-b[0].p1-t4[0]');
checks.push({
  label: 'Page-1 taxpayer name field -> label containing "Name"',
  field: c1?.name,
  best: c1?.best ?? '(field not found)',
  all: c1 ? allText(c1) : '',
  pass: !!c1 && /name/i.test(c1.best),
});

const vehicles = records.filter(r => /Page3\[0\]\.Line18a\[0\]/.test(r.name));
const vehHit = vehicles.find(r => /(year|make|model|mileage)/i.test(r.best));
checks.push({
  label: 'Page3 Line18a vehicle field -> Year / Make / Model / Mileage',
  field: vehHit?.name ?? vehicles[0]?.name,
  best: (vehHit ?? vehicles[0])?.best ?? '(no Line18a fields found)',
  all: vehHit ? allText(vehHit) : (vehicles[0] ? allText(vehicles[0]) : ''),
  pass: !!vehHit,
});

const irs = find('topmostSubform[0].Page4[0].IRS35[0]');
checks.push({
  label: 'Page4[0].IRS35[0] -> IRS-allowed / standards column',
  field: irs?.name,
  best: irs?.best ?? '(field not found)',
  all: irs ? allText(irs) : '',
  pass: !!irs && /(irs|allow|standard)/i.test(irs.best),
});

console.log(`form ${form}: ${fieldNames.length} fields, ${records.length} widgets, ${pageCount} pages`);
if (originNotes.length) console.log(`NOTE non-zero MediaBox origin: ${originNotes.join('; ')}`);
console.log('--- self-check ---');
for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.label}`);
  console.log(`      field : ${c.field}`);
  console.log(`      best  : ${JSON.stringify(c.best)}`);
  console.log(`      all   : ${c.all}`);
}
if (checks.some(c => !c.pass)) {
  console.error('SELF-CHECK FAILED — no output written. STOP and report the actual correlated text to Principal.');
  process.exit(2);
}

// --------------------------------------------------------------------- outputs
const unlabelled = records.filter(r => !r.best);
const pct = ((unlabelled.length / records.length) * 100);

writeFileSync(outJson, JSON.stringify({
  form,
  source: src,
  fieldCount: fieldNames.length,
  widgetCount: records.length,
  pages: pageCount,
  unlabelledWidgets: unlabelled.length,
  generator: 'adapters/pdf/correlate-labels.mjs',
  note: 'Extracted mechanically. Labels are what the tool found in the drawn text — nothing here is hand-written.',
  widgets: records,
}, null, 2));

// Reading order: page, then top-to-bottom (y descends in PDF space), then left-to-right.
// Rows are banded to 4pt so a cell that sits a point high does not jump its row.
const ordered = [...records].sort((a, b) =>
  (a.page ?? 999) - (b.page ?? 999) ||
  Math.round((b.rect?.[3] ?? 0) / 4) - Math.round((a.rect?.[3] ?? 0) / 4) ||
  (a.rect?.[0] ?? 0) - (b.rect?.[0] ?? 0));

writeFileSync(outTxt, ordered.map(r => `p${r.page ?? '?'} | ${r.best} | ${r.name}`).join('\n') + '\n');

const namesInTxt = new Set(ordered.map(r => r.name));
const namesInJson = new Set(records.map(r => r.name));
const missingTxt = fieldNames.filter(n => !namesInTxt.has(n));
const missingJson = fieldNames.filter(n => !namesInJson.has(n));

console.log('--- counts ---');
console.log(`fields in .json: ${namesInJson.size}/${fieldNames.length}   fields in .txt: ${namesInTxt.size}/${fieldNames.length}`);
console.log(`unlabelled widgets (no candidate in ANY direction): ${unlabelled.length} of ${records.length} (${pct.toFixed(1)}%)`);
if (pct > 15) console.log(`QUALITY WARNING: unlabelled rate ${pct.toFixed(1)}% exceeds ~15% — report this to Principal rather than treating the output as complete.`);
console.log(`wrote ${outJson}`);
console.log(`wrote ${outTxt}`);
if (missingTxt.length || missingJson.length) {
  console.error(`MISSING from outputs — json:${missingJson.length} txt:${missingTxt.length}`);
  process.exit(2);
}
