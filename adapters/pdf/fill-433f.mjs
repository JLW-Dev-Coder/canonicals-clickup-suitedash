import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const mapDoc = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
const data   = JSON.parse(readFileSync(process.argv[2] || 'samples/433f.sample.json', 'utf8'));
const std    = existsSync('adapters/pdf/maps/433f.standards.json')
  ? JSON.parse(readFileSync('adapters/pdf/maps/433f.standards.json', 'utf8')) : null;
const pdf    = await PDFDocument.load(readFileSync(mapDoc.pdf));
const form   = pdf.getForm();

let filled = 0; const skipped = [];
const setText = (name, val) => {
  if (val === undefined || val === null || val === '') return;
  try { form.getTextField(name).setText(String(val)); filled++; } catch { skipped.push(name); }
};

// composite name + address
const comp = mapDoc.special?.composite_name_address;
if (comp) { const parts = comp.from.map(k => data[k]).filter(Boolean); if (parts.length) setText(comp.pdf, parts.join(comp.join)); }

// scalar 1:1
for (const [key, name] of Object.entries(mapDoc.map)) {
  if (comp && comp.from.includes(key)) continue;
  setText(name, data[key]);
}

// repeatable groups (array input, else scalar fallback)
const overflow = [];
for (const [g, def] of Object.entries(mapDoc.groups || {})) {
  let rows = Array.isArray(data[def.array]) ? data[def.array] : null;
  if (!rows) rows = (def.fallback || [])
    .map(fb => { const r = {}; for (const [sub, key] of Object.entries(fb)) r[sub] = data[key]; return r; })
    .filter(r => Object.values(r).some(v => v !== undefined && v !== null && v !== ''));
  rows.forEach((row, i) => {
    if (i >= def.slots.length) { overflow.push(`${g}[${i}]`); return; }
    for (const [sub, name] of Object.entries(def.slots[i])) setText(name, row[sub]);
  });
}

// IRS allowable standards (National food-group by household size + OOP by age)
let allowedFilled = 0;
if (std && mapDoc.allowed) {
  const before = filled;
  const rawHH = parseInt(data.household_size ?? data['433f_hh_size'] ?? '', 10);
  const hhKey = String(Math.min(4, Math.max(1, rawHH || 1)));
  const natl = std.national[hhKey];
  const A = mapDoc.allowed.national_by_household;
  if (natl && A) {
    setText(A.food, natl.food); setText(A.housekeeping, natl.housekeeping);
    setText(A.apparel, natl.apparel); setText(A.personal_care, natl.personal_care);
    setText(A.misc, natl.misc);
    const total = rawHH > 4 ? std.national['4'].total + std.national_addl_total * (rawHH - 4) : natl.total;
    setText(A.total, total);
  }
  const oop = data.age_band === '65_over' ? std.oop['65_over'] : std.oop['under_65'];
  if (mapDoc.allowed.oop_by_age && (data.age_band || rawHH)) setText(mapDoc.allowed.oop_by_age, oop);
  allowedFilled = filled - before;
}

mkdirSync('adapters/pdf/out', { recursive: true });
const outPath = `adapters/pdf/out/433f_filled_${data.intake_id || 'sample'}.pdf`;
writeFileSync(outPath, await pdf.save());
console.log(`filled ${filled} fields (${allowedFilled} allowable-standard) -> ${outPath}`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0,4).join(', ')}${skipped.length>4?' ...':''}`);
if (overflow.length) console.log(`OVERFLOW: ${overflow.join(', ')}`);
if (filled === 0) { console.error('0 fields filled — STOP.'); process.exit(2); }
