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

import { PDFDocument, PDFName, PDFArray } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const form = process.argv[2] || '433a';
const src = `adapters/pdf/forms/f${form}.pdf`;
const outJson = `adapters/pdf/maps/${form}.labels.json`;
const outTxt = `adapters/pdf/maps/${form}.labels.txt`;

const TOL = 2;          // point slack on the overlap tests
const MERGE_GAP = 1.2;  // merge adjacent text runs only on clear intra-phrase kerning splits

const bytes = readFileSync(src);

// ---------------------------------------------------------------- text geometry
const doc = await pdfjs.getDocument({
  data: new Uint8Array(bytes),
  disableFontFace: true,
  isEvalSupported: false,
  useSystemFonts: false,
  verbosity: 0,
}).promise;

/** Text items for one page, as boxes in PDF user space. */
async function pageText(pageNo) {
  const page = await doc.getPage(pageNo);
  const view = page.view; // [x0, y0, x1, y1]
  const tc = await page.getTextContent();
  const raw = [];
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue;
    const x = it.transform[4];
    const y = it.transform[5];          // baseline
    const w = it.width || 0;
    const h = it.height || Math.abs(it.transform[3]) || 7;
    raw.push({ str: it.str, x1: x, y1: y, x2: x + w, y2: y + h });
  }
  // Merge only tight same-baseline splits. Over-merging invents compound labels that
  // span table cells, and a wrong label is worse than a short one.
  raw.sort((a, b) => (Math.abs(a.y1 - b.y1) > 0.8 ? b.y1 - a.y1 : a.x1 - b.x1));
  const merged = [];
  for (const t of raw) {
    const prev = merged[merged.length - 1];
    if (prev && Math.abs(prev.y1 - t.y1) <= 0.8 && t.x1 - prev.x2 >= -0.5 && t.x1 - prev.x2 < MERGE_GAP) {
      prev.str += t.str;
      prev.x2 = Math.max(prev.x2, t.x2);
      prev.y2 = Math.max(prev.y2, t.y2);
      continue;
    }
    merged.push({ ...t });
  }
  return { view, items: merged.map(t => ({ ...t, str: t.str.replace(/\s+/g, ' ').trim() })).filter(t => t.str) };
}

const pageCount = doc.numPages;
const text = [];
for (let p = 1; p <= pageCount; p++) text.push(await pageText(p));

// ------------------------------------------------------------- widget geometry
const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
const pages = pdf.getPages();

// MediaBox origin check — the two coordinate sets are only comparable at origin 0,0.
const originNotes = [];
pages.forEach((pg, i) => {
  const mb = pg.getMediaBox();
  if (mb.x !== 0 || mb.y !== 0) originNotes.push(`page ${i + 1} MediaBox origin (${mb.x}, ${mb.y})`);
});

// Resolve each widget's page by scanning the pages' /Annots for its ref. The widget's
// own /P entry is absent on some widgets of these forms, so /P is the fallback, not
// the source of truth.
const dictToRef = new Map();
for (const [ref, obj] of pdf.context.enumerateIndirectObjects()) dictToRef.set(obj, ref);

const refTagToPage = new Map();
pages.forEach((pg, i) => {
  const annots = pdf.context.lookup(pg.node.get(PDFName.of('Annots')));
  if (!(annots instanceof PDFArray)) return;
  for (let k = 0; k < annots.size(); k++) {
    const entry = annots.get(k);
    if (entry?.tag) refTagToPage.set(entry.tag, i);
  }
});
const pageRefTagToIndex = new Map();
pages.forEach((pg, i) => {
  const ref = dictToRef.get(pg.node);
  if (ref) pageRefTagToIndex.set(ref.tag, i);
});

function widgetPage(w) {
  const ref = dictToRef.get(w.dict);
  if (ref && refTagToPage.has(ref.tag)) return refTagToPage.get(ref.tag);
  const p = w.dict.get(PDFName.of('P'));      // fallback only
  if (p?.tag && pageRefTagToIndex.has(p.tag)) return pageRefTagToIndex.get(p.tag);
  return null;
}

// ----------------------------------------------------------------- correlation
const round = (n) => Math.round(n * 10) / 10;

function candidates(pageIdx, r) {
  const items = text[pageIdx]?.items || [];
  const left = [], above = [], inside = [], near = [];

  for (const t of items) {
    const vOverlap = t.y1 < r.y2 + TOL && t.y2 > r.y1 - TOL;
    const hOverlap = t.x1 < r.x2 + TOL && t.x2 > r.x1 - TOL;

    if (t.x2 <= r.x1 + TOL && vOverlap) left.push({ text: t.str, distance: round(r.x1 - t.x2) });
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
    above: above.sort(byDist).slice(0, 3),
    inside: inside.slice(0, 3),
    nearest: near.sort(byDist).slice(0, 5),
  };
}

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

function pickLabel(c) {
  const pools = [
    ['above', c.above], ['left', c.left], ['inside', c.inside],
  ];
  let winner = null;
  for (const [dir, pool] of pools) {
    for (const cand of pool) {
      if (!isDescriptive(cand.text)) continue;
      if (!winner || cand.distance < winner.distance) winner = { ...cand, dir, pool };
    }
  }
  if (!winner) {
    const n = c.nearest.find(x => isDescriptive(x.text));
    if (n) winner = { ...n, dir: 'nearest', pool: c.nearest };
  }
  if (!winner) return { label: '', marker: '', dir: '', best: '' };

  // Marker from the same bucket, nearest to the winner's own distance.
  const marker = winner.pool
    .filter(x => isMarker(x.text))
    .sort((a, b) => Math.abs(a.distance - winner.distance) - Math.abs(b.distance - winner.distance))[0];
  const m = marker && Math.abs(marker.distance - winner.distance) <= 2 ? marker.text : '';
  return { label: winner.text, marker: m, dir: winner.dir, best: (m ? `${m} ${winner.text}` : winner.text) };
}

const records = [];
const fields = pdf.getForm().getFields();
for (const f of fields) {
  const name = f.getName();
  const type = f.constructor.name;
  const widgets = f.acroField.getWidgets();
  if (widgets.length === 0) {
    records.push({ name, type, page: null, rect: null, candidates: { left: [], above: [], inside: [], nearest: [] }, marker: '', label: '', labelFrom: '', best: '' });
    continue;
  }
  widgets.forEach((w, wi) => {
    const pageIdx = widgetPage(w);
    const g = w.getRectangle();
    const r = { x1: g.x, y1: g.y, x2: g.x + g.width, y2: g.y + g.height };
    const c = pageIdx === null ? { left: [], above: [], inside: [], nearest: [] } : candidates(pageIdx, r);
    const p = pickLabel(c);
    records.push({
      name,
      type,
      widget: wi,
      widgets: widgets.length,
      page: pageIdx === null ? null : pageIdx + 1,
      rect: [round(r.x1), round(r.y1), round(r.x2), round(r.y2)],
      candidates: c,
      marker: p.marker,       // printed line marker, from the same direction as `label`
      label: p.label,         // printed descriptive caption, verbatim
      labelFrom: p.dir,       // which direction supplied it
      best: p.best,           // `marker + label` — both extracted, nothing invented
    });
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

console.log(`form ${form}: ${fields.length} fields, ${records.length} widgets, ${pageCount} pages`);
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
  fieldCount: fields.length,
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
const missingTxt = fields.map(f => f.getName()).filter(n => !namesInTxt.has(n));
const missingJson = fields.map(f => f.getName()).filter(n => !namesInJson.has(n));

console.log('--- counts ---');
console.log(`fields in .json: ${namesInJson.size}/${fields.length}   fields in .txt: ${namesInTxt.size}/${fields.length}`);
console.log(`unlabelled widgets (no candidate in ANY direction): ${unlabelled.length} of ${records.length} (${pct.toFixed(1)}%)`);
if (pct > 15) console.log(`QUALITY WARNING: unlabelled rate ${pct.toFixed(1)}% exceeds ~15% — report this to Principal rather than treating the output as complete.`);
console.log(`wrote ${outJson}`);
console.log(`wrote ${outTxt}`);
if (missingTxt.length || missingJson.length) {
  console.error(`MISSING from outputs — json:${missingJson.length} txt:${missingTxt.length}`);
  process.exit(2);
}
