import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';

const form = process.argv[2] || '433f';
const src  = `adapters/pdf/forms/f${form}.pdf`;
const out  = `adapters/pdf/maps/${form}.fields.json`;

const pdf  = await PDFDocument.load(readFileSync(src));
const acro = pdf.getForm();
const fields = acro.getFields().map(f => ({ name: f.getName(), type: f.constructor.name }));

writeFileSync(out, JSON.stringify({ form, source: src, count: fields.length, fields }, null, 2));
console.log(`${form}: ${fields.length} fillable fields -> ${out}`);
if (fields.length === 0) {
  console.error('NO ACROFORM FIELDS FOUND — the PDF may be XFA-only or flattened. STOP and report to Principal.');
  process.exit(2);
}
