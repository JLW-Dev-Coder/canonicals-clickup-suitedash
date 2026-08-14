import { readFileSync } from 'fs';
const mapDoc    = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json','utf8'));
const fieldsDoc = JSON.parse(readFileSync('adapters/pdf/maps/433f.fields.json','utf8'));
const names = new Set(fieldsDoc.fields.map(f => f.name));

const targets = Object.entries(mapDoc.map);
if (mapDoc.special?.composite_name_address)
  targets.push(['composite_name_address', mapDoc.special.composite_name_address.pdf]);

const missing = targets.filter(([k, v]) => !names.has(v));
console.log(`map targets: ${targets.length}, PDF fields: ${names.size}`);
if (missing.length) {
  console.error(`MISSING ${missing.length} map target(s) not found verbatim in 433f.fields.json (Principal must fix the map):`);
  missing.forEach(([k, v]) => console.error(`  ${k} -> ${v}`));
  process.exit(2);
}
console.log('OK — every map target exists verbatim in the PDF field list.');
