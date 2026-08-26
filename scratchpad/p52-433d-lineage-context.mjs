// For every occurrence in 433d.lineage.json, print the runs PRINTED NEAR the cell on BOTH forms,
// so the per-occurrence verdict is authored from the page rather than from the leaf name — which
// is the whole of [R-08] and the reason a name-level verdict is refused.
import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry, baselineOfRun } from '../adapters/pdf/page-geometry.mjs';

const cache = new Map();
const load = async (form) => {
  if (cache.has(form)) return cache.get(form);
  const bytes = readFileSync(`adapters/pdf/forms/f${form}.pdf`);
  const v = { pages: await readPrintedText(bytes), geo: await readWidgetGeometry(bytes) };
  cache.set(form, v);
  return v;
};

/** Runs whose baseline is within `pad` of the rect vertically and near it horizontally. */
const near = (pages, page, rect, pad = 16) => {
  const [x0, y0, x1, y1] = rect;
  return (pages[page - 1]?.items || [])
    .map((t) => ({ t, b: baselineOfRun(t) }))
    .filter(({ t, b }) => b >= y0 - pad && b <= y1 + pad && t.x2 >= x0 - 240 && t.x1 <= x1 + 120)
    .sort((a, b) => (b.b - a.b) || (a.t.x1 - b.t.x1))
    .map(({ t, b }) => `y ${b.toFixed(1)} x ${t.x1.toFixed(1)}..${t.x2.toFixed(1)}  ${JSON.stringify(t.str).slice(0, 105)}`);
};

const TARGETS = [
  ['433d', 'form1[0].Page1_Part1[0].Agreement[0].Title[0]'],
  ['433d', 'form1[0].Page3_Part2[0].Agreement[0].Title[0]'],
  ['433d', 'form1[0].Page1_Part1[0].YourSignature[0]'],
  ['433a', 'topmostSubform[0].Page1[0].c2[0].Line3a[0].tab_order[0].Title[0]'],
  ['433aoi', 'topmostSubform[0].F433-A-OIC_Page4[0].Section4[0].OtherBusinessInterests[0].Title[0]'],
  ['433boi', 'topmostSubform[0].F433-B-OIC_Page1[0].PartnerInfo1[0].Title[0]'],
  ['433boi', 'topmostSubform[0].F433-B-OIC_Page6[0].Title[0]'],
  ['433f', 'topmostSubform[0].Page2[0].YourSignature[0]'],
];

for (const [form, path] of TARGETS) {
  const { pages, geo } = await load(form);
  const w = geo.widgets.find((x) => x.name === path);
  console.log(`\n===== ${form}  ${path}`);
  if (!w) { console.log('  NOT FOUND in widget geometry — a target this file cannot locate is reported, not skipped.'); continue; }
  console.log(`  page ${w.page}  rect [${w.rect.join(', ')}]`);
  for (const l of near(pages, w.page, w.rect)) console.log(`    ${l}`);
}
