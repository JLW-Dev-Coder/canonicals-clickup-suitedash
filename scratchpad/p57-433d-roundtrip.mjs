// FIXTURE -> PORTAL -> FETCHED RECORD, compared key by key, and then the FILLED PDF read back.
// The comparison is against the SEEDED fixture, and the PDF read is off the document itself.
import { readFileSync } from 'node:fs';
import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';

const [fixturePath, fetchedPath, pdfPath] = process.argv.slice(2);
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const fetched = JSON.parse(readFileSync(fetchedPath, 'utf8'));

const isKey = (k) => !k.startsWith('_') && k !== 'intake_id';
const fKeys = Object.keys(fixture).filter(isKey).filter((k) => fixture[k] !== undefined && fixture[k] !== null && String(fixture[k]).trim() !== '');
const gKeys = Object.keys(fetched).filter(isKey);

const norm = (v) => String(v).trim();
const same = [], differ = [], onlyFixture = [], onlyFetched = [];
for (const k of fKeys) {
  if (!(k in fetched)) { onlyFixture.push(k); continue; }
  (norm(fixture[k]) === norm(fetched[k]) ? same : differ).push({ k, fixture: fixture[k], fetched: fetched[k] });
}
for (const k of gKeys) if (!fKeys.includes(k)) onlyFetched.push(k);

console.log(`ROUND TRIP  ${fixturePath}  ->  portal  ->  ${fetchedPath}`);
console.log(`  fixture keys carrying a value: ${fKeys.length}`);
console.log(`  fetched keys:                  ${gKeys.length}`);
console.log(`  IDENTICAL after the round trip: ${same.length}`);
console.log(`  DIFFERENT:                      ${differ.length}`);
for (const d of differ) console.log(`      ${d.k}: fixture ${JSON.stringify(d.fixture)} -> fetched ${JSON.stringify(d.fetched)}`);
console.log(`  in the fixture, absent from the fetch: ${onlyFixture.length}${onlyFixture.length ? ' — ' + onlyFixture.join(', ') : ''}`);
console.log(`  in the fetch, absent from the fixture: ${onlyFetched.length}${onlyFetched.length ? ' — ' + onlyFetched.join(', ') : ''}`);

// --- and the PDF, read off the document -------------------------------------------------------
const pdf = await PDFDocument.load(readFileSync(pdfPath));
const form = pdf.getForm();
let text = 0, ticked = 0, blank = 0;
for (const f of form.getFields()) {
  if (f instanceof PDFTextField) { const v = f.getText(); if (v && v.trim()) text++; else blank++; }
  else if (f instanceof PDFCheckBox) { if (f.isChecked()) ticked++; }
}
console.log(`  FILLED PDF ${pdfPath}: ${text} text field(s) carrying a value, ${ticked} checkbox(es) ticked, ${blank} text field(s) blank`);

const problems = differ.length + onlyFixture.length;
if (problems) { console.error(`\nSTOP - ${problems} key(s) did not survive the round trip.`); process.exit(3); }
console.log('\nOK - every value the fixture carried came back from the portal identical, and the PDF was filled from it.');
