import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'fs';

const form = process.argv[2] || '433f';
const pdf  = await PDFDocument.load(readFileSync(`adapters/pdf/forms/f${form}.pdf`));
const acro = pdf.getForm();

const boxes = [];
for (const f of acro.getFields()) {
  if (f.constructor.name !== 'PDFCheckBox') continue;
  let on = '';
  try { f.check(); on = String(f.acroField.getValue()); f.uncheck(); } catch (e) { on = 'ERR:' + e.message; }
  boxes.push({ name: f.getName(), on });
}

console.log(`${form}: ${boxes.length} checkboxes`);
for (const b of boxes) console.log(`  on=${b.on.padEnd(12)} ${b.name}`);
