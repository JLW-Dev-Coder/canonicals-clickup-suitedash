// Which mapped cells on a page are MONEY, on the evidence the page prints.
//
//   node adapters/pdf/money-probe.mjs <form> [page,page,...]
//   node adapters/pdf/money-probe.mjs 433aoi 2,3,4
//
// WHY THIS IS ITS OWN TOOL
// ------------------------
// adapters/pdf/rounding.mjs will only round a cell the map DECLARES as money, and never one
// that merely looks numeric — because `2c_number_of_units` holds 1.2345 units of a digital
// asset, sits inside a block that rounds, and would be silently corrupted into "1" by any
// numeric-shape rule, with every total on the page still reconciling.
//
// That makes the money declaration a hand-authored list, and a hand-authored list needs
// evidence. This is the evidence: for every mapped text target on a page, it reports the
// printed text drawn immediately to the cell's LEFT in the same vertical band, and flags the
// cell MONEY$ when that text ends in a "$" drawn within 14pt.
//
// WHAT IT PROVES AND WHAT IT DOES NOT
// -----------------------------------
// A MONEY$ flag is strong evidence: the form drew a currency symbol against that cell and
// against no other. The absence of a flag is NOT evidence of the reverse — 433-A(OIC) prints
// five money cells with no "$" at all — on page 3 the real-property listing price and the two
// mortgage payment cells, and on page 5 line (29) and Box C, whose left-scan finds the neighbouring
// "Box C" title and the page footer where the currency symbol would be. Each is identified by its
// printed CAPTION instead and each is named in its block's `_money_without_a_printed_dollar_sign`. So the tool narrows the reading; it does not make it.
//
// The 14pt threshold is the widest gap any true "$" on 433-A(OIC) sits at (the Section 4 payroll
// cell, 5.8pt) with room to spare, and the narrowest FALSE neighbour is 11pt of unrelated
// caption text that does not end in "$" — so the two tests are independent and both must hold.
//
// COORDINATES are PDF user space from page-geometry.mjs, the same source align-block.mjs and
// verify-headings.mjs read, so those three can never disagree about where anything is.

import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry } from './page-geometry.mjs';

const [form, pageArg] = process.argv.slice(2);
if (!form) {
  console.error('usage: node adapters/pdf/money-probe.mjs <form> [page,page,...]');
  process.exit(2);
}
const pages = (pageArg || '').split(',').filter(Boolean).map(Number);
const map   = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
const bytes = readFileSync(`adapters/pdf/forms/f${form}.pdf`);
const text  = await readPrintedText(bytes);
const { widgets } = await readWidgetGeometry(bytes);
const byName = new Map(widgets.filter(w => w.rect).map(w => [w.name, w]));
const r1 = (n) => Math.round(n * 10) / 10;

const MAX_GAP = 14;   // see header

const entries = [];
for (const [k, t] of Object.entries(map.map || {})) entries.push({ key: k, target: t });
for (const [g, d] of Object.entries(map.groups || {}))
  (d.slots || []).forEach((s, i) => {
    for (const [c, t] of Object.entries(s.text || {})) entries.push({ key: `${g}[${i}].${c}`, target: t });
  });

let money = 0, seen = 0;
for (const e of entries) {
  const w = byName.get(e.target);
  if (!w) { console.log(`  ??     ${e.key}  (target names no widget)`); continue; }
  const [x1, y1, , y2] = w.rect;
  if (pages.length && !pages.includes(w.page)) continue;
  seen++;
  const left = (text[w.page - 1]?.items || [])
    .filter(t => t.y2 > y1 - 4 && t.y1 < y2 + 4 && t.x2 <= x1 + 2)
    .sort((a, b) => (x1 - a.x2) - (x1 - b.x2));
  const near = left[0];
  const gap  = near ? r1(x1 - near.x2) : null;
  const isMoney = !!near && /\$\s*$/.test(near.str) && gap <= MAX_GAP;
  if (isMoney) money++;
  console.log(`  ${isMoney ? 'MONEY$' : '  .   '} p${w.page} y=${String(r1(y2)).padStart(6)} x=${String(r1(x1)).padStart(6)}  ${e.key.padEnd(50)} left=${gap === null ? '    -' : String(gap).padStart(5)}pt  ${JSON.stringify(near ? near.str.slice(-44) : '')}`);
}
console.log('');
console.log(`  ${money} of ${seen} mapped text cell(s)${pages.length ? ` on page(s) ${pages.join(', ')}` : ''} carry a printed "$" within ${MAX_GAP}pt to their left.`);
console.log('  A cell with no flag is NOT thereby proven non-money — read its printed caption. See the header.');
