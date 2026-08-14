import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const mapDoc = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
const data   = JSON.parse(readFileSync(process.argv[2] || 'samples/433f.sample.json', 'utf8'));
const pdf    = await PDFDocument.load(readFileSync(mapDoc.pdf));
const form   = pdf.getForm();

let filled = 0; const skipped = [];
const setText = (pdfName, value) => {
  try { form.getTextField(pdfName).setText(String(value)); filled++; }
  catch { skipped.push(pdfName); }
};

// composite name + address -> single PDF field
const comp = mapDoc.special?.composite_name_address;
if (comp) {
  const parts = comp.from.map(k => data[k]).filter(Boolean);
  if (parts.length) setText(comp.pdf, parts.join(comp.join));
}
// straight 1:1 map
for (const [key, pdfName] of Object.entries(mapDoc.map)) {
  if (comp && comp.from.includes(key)) continue;
  const v = data[key];
  if (v === undefined || v === null || v === '') continue;
  setText(pdfName, v);
}

mkdirSync('adapters/pdf/out', { recursive: true });
const outPath = `adapters/pdf/out/433f_filled_${data.intake_id || 'sample'}.pdf`;
writeFileSync(outPath, await pdf.save());
console.log(`filled ${filled} fields -> ${outPath}`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0,5).join(', ')}${skipped.length>5?' ...':''}`);
if (filled === 0) { console.error('0 fields filled — check map/sample keys. STOP.'); process.exit(2); }
