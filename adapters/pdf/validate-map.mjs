import { readFileSync } from 'fs';
const mapDoc    = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
const fieldsDoc = JSON.parse(readFileSync('adapters/pdf/maps/433f.fields.json', 'utf8'));
const names = new Set(fieldsDoc.fields.map(f => f.name));

const targets = Object.entries(mapDoc.map);
if (mapDoc.special?.composite_name_address) targets.push(['composite_name_address', mapDoc.special.composite_name_address.pdf]);
for (const [g, def] of Object.entries(mapDoc.groups || {}))
  def.slots.forEach((slot, i) => { for (const [sub, name] of Object.entries(slot)) targets.push([`${g}[${i}].${sub}`, name]); });

const missing = targets.filter(([k, v]) => !names.has(v));
console.log(`map targets: ${targets.length} (scalar + composite + group slots), PDF fields: ${names.size}`);
if (missing.length) {
  console.error(`MISSING ${missing.length} target(s) not found verbatim in 433f.fields.json (Principal must fix the map):`);
  missing.forEach(([k, v]) => console.error(`  ${k} -> ${v}`));
  process.exit(2);
}
console.log('OK — every map target (including repeatable slots) exists verbatim in the PDF field list.');
