// Compare two filled PDFs cell by cell.
//
//   node adapters/pdf/compare-filled.mjs <baseline.pdf> <candidate.pdf>
//
// WHAT THIS IS FOR
// ----------------
// Migrating a form onto a different set of HubSpot properties changes where the values come
// from and must change nothing about the page. That is an assertion, and it can only be
// checked against a run of the SAME form and the SAME engine from the OLD source — so the
// control is a filled PDF, not a diff of the code that made it.
//
// COMPARE VALUES, NOT BYTES. Two runs of pdf-lib over the same input do not produce identical
// files: the trailer, object ordering and the regenerated appearance streams all move. A byte
// comparison therefore reports a difference on every run and proves nothing, which is worse
// than no check at all because it trains people to ignore it. So every AcroForm field is read
// back and compared by VALUE — text by string, checkboxes by checked state.
//
// A MISSING CELL IS A DIFFERENCE. Both directions are reported: a cell the baseline filled and
// the candidate left blank is exactly the failure a crosswalk regression produces, and it is
// the one that a "did anything break" eyeball never catches, because a blank cell on a form
// looks like a blank cell on a form.

import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { readFileSync } from 'node:fs';

const [basePath, candPath] = process.argv.slice(2);
if (!basePath || !candPath) {
  console.error('usage: node adapters/pdf/compare-filled.mjs <baseline.pdf> <candidate.pdf>');
  process.exit(2);
}

async function readCells(path) {
  const doc = await PDFDocument.load(readFileSync(path));
  const cells = new Map();
  for (const f of doc.getForm().getFields()) {
    const name = f.getName();
    if (f instanceof PDFTextField) cells.set(name, { kind: 'text', value: f.getText() ?? '' });
    else if (f instanceof PDFCheckBox) cells.set(name, { kind: 'check', value: f.isChecked() ? 'CHECKED' : '' });
  }
  return cells;
}

const base = await readCells(basePath);
const cand = await readCells(candPath);

const names = [...new Set([...base.keys(), ...cand.keys()])].sort();
const diffs = [];
let comparedNonEmpty = 0;
let identicalNonEmpty = 0;
let textCells = 0;
let checkCells = 0;

for (const n of names) {
  const b = base.get(n);
  const c = cand.get(n);
  if (!b || !c) { diffs.push(`${n}: present in only one document (${b ? basePath : candPath})`); continue; }
  if (b.kind !== c.kind) { diffs.push(`${n}: field kind ${b.kind} vs ${c.kind}`); continue; }

  const bv = String(b.value);
  const cv = String(c.value);
  if (bv !== '' || cv !== '') {
    comparedNonEmpty++;
    if (b.kind === 'text') textCells++; else checkCells++;
  }
  if (bv === cv) { if (bv !== '') identicalNonEmpty++; continue; }

  const why =
    bv !== '' && cv === '' ? 'BASELINE FILLED IT, CANDIDATE DID NOT' :
    bv === '' && cv !== '' ? 'CANDIDATE FILLED IT, BASELINE DID NOT' :
    'both filled it, differently';
  diffs.push(`${n}\n      ${why}\n      baseline : ${JSON.stringify(bv)}\n      candidate: ${JSON.stringify(cv)}`);
}

console.log(`baseline : ${basePath}`);
console.log(`candidate: ${candPath}`);
console.log(`fields in each: ${base.size} / ${cand.size}`);
console.log(`cells carrying a value in at least one document: ${comparedNonEmpty} (${textCells} text, ${checkCells} checkbox)`);
console.log(`  identical: ${identicalNonEmpty}`);
console.log(`  differing: ${diffs.length}`);

if (diffs.length) {
  console.error('');
  console.error(`NOT CONTENT-IDENTICAL — ${diffs.length} difference(s):`);
  for (const d of diffs) console.error(`  ${d}`);
  process.exit(2);
}

console.log('');
console.log('CONTENT-IDENTICAL — every AcroForm cell holds the same value in both documents.');
