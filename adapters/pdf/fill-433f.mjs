import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const mapDoc = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
const data   = JSON.parse(readFileSync(process.argv[2] || 'samples/433f.sample.json', 'utf8'));
const pdf    = await PDFDocument.load(readFileSync(mapDoc.pdf));
const form   = pdf.getForm();

let filled = 0; const skipped = [];
const setText = (name, val) => {
  if (val === undefined || val === null || val === '') return;
  try { form.getTextField(name).setText(String(val)); filled++; } catch { skipped.push(name); }
};

// composite name + address -> single field
const comp = mapDoc.special?.composite_name_address;
if (comp) { const parts = comp.from.map(k => data[k]).filter(Boolean); if (parts.length) setText(comp.pdf, parts.join(comp.join)); }

// scalar 1:1
for (const [key, name] of Object.entries(mapDoc.map)) {
  if (comp && comp.from.includes(key)) continue;
  setText(name, data[key]);
}

// repeatable groups: array input fills slots in order; else scalar fallback fills first slot(s)
const overflow = [];
for (const [g, def] of Object.entries(mapDoc.groups || {})) {
  let rows = Array.isArray(data[def.array]) ? data[def.array] : null;
  if (!rows) {
    rows = (def.fallback || [])
      .map(fb => { const r = {}; for (const [sub, key] of Object.entries(fb)) r[sub] = data[key]; return r; })
      .filter(r => Object.values(r).some(v => v !== undefined && v !== null && v !== ''));
  }
  rows.forEach((row, i) => {
    if (i >= def.slots.length) { overflow.push(`${g}[${i}]`); return; }
    for (const [sub, name] of Object.entries(def.slots[i])) setText(name, row[sub]);
  });
}

mkdirSync('adapters/pdf/out', { recursive: true });
const outPath = `adapters/pdf/out/433f_filled_${data.intake_id || 'sample'}.pdf`;
writeFileSync(outPath, await pdf.save());
console.log(`filled ${filled} fields -> ${outPath}`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0,4).join(', ')}${skipped.length>4?' ...':''}`);
if (overflow.length) console.log(`OVERFLOW (more input rows than form slots): ${overflow.join(', ')}`);
if (filled === 0) { console.error('0 fields filled — STOP.'); process.exit(2); }
