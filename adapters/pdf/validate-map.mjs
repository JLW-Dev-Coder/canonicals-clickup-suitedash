import { readFileSync } from 'fs';
const mapDoc    = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
const fieldsDoc = JSON.parse(readFileSync('adapters/pdf/maps/433f.fields.json', 'utf8'));
const names = new Set(fieldsDoc.fields.map(f => f.name));

const targets = Object.entries(mapDoc.map);
if (mapDoc.special?.composite_name_address) targets.push(['composite', mapDoc.special.composite_name_address.pdf]);
for (const [g, def] of Object.entries(mapDoc.groups || {}))
  def.slots.forEach((slot, i) => { for (const [sub, name] of Object.entries(slot)) targets.push([`${g}[${i}].${sub}`, name]); });
if (mapDoc.allowed) {
  for (const [k, v] of Object.entries(mapDoc.allowed.national_by_household || {})) targets.push([`allowed.${k}`, v]);
  if (mapDoc.allowed.oop_by_age) targets.push(['allowed.oop', mapDoc.allowed.oop_by_age]);
}
if (mapDoc.checkboxes) {
  const cb = mapDoc.checkboxes;
  if (cb.address_differs) targets.push(['cb.address_differs', cb.address_differs]);
  (cb.account_business || []).forEach((n, i) => targets.push([`cb.account_business[${i}]`, n]));
  (cb.real_estate || []).forEach((o, i) => {
    if (o.primary) targets.push([`cb.real_estate[${i}].primary`, o.primary]);
    if (o.other) targets.push([`cb.real_estate[${i}].other`, o.other]);
  });
  (cb.pay_freq?.you || []).forEach((n, i) => targets.push([`cb.pay_freq.you[${i}]`, n]));
  (cb.pay_freq?.spouse || []).forEach((n, i) => targets.push([`cb.pay_freq.spouse[${i}]`, n]));
}

const missing = targets.filter(([k, v]) => !names.has(v));
console.log(`map targets: ${targets.length} (scalar + composite + slots + allowed + checkboxes), PDF fields: ${names.size}`);
if (missing.length) {
  console.error(`MISSING ${missing.length} target(s) not found verbatim in 433f.fields.json:`);
  missing.forEach(([k, v]) => console.error(`  ${k} -> ${v}`));
  process.exit(2);
}
console.log('OK — every map target (scalars, slots, allowed, checkboxes) exists verbatim in the PDF field list.');
