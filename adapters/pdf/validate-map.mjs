import { readFileSync } from 'fs';
import { readFormRevisionWithPages } from './read-form-revision.mjs';
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

// Array values only — `exclusive` also carries `_note` prose, same as `special`.
for (const [set, list] of Object.entries(mapDoc.exclusive || {}))
  if (Array.isArray(list)) list.forEach((n, i) => targets.push([`exclusive.${set}[${i}]`, n]));

const missing = targets.filter(([k, v]) => !names.has(v));
console.log(`map targets: ${targets.length} (scalar + composite + slots + allowed + checkboxes + exclusive), PDF fields: ${names.size}`);
if (missing.length) {
  console.error(`MISSING ${missing.length} target(s) not found verbatim in 433f.fields.json:`);
  missing.forEach(([k, v]) => console.error(`  ${k} -> ${v}`));
  process.exit(2);
}
console.log('OK — every map target (scalars, slots, allowed, checkboxes, exclusive) exists verbatim in the PDF field list.');

// Revision pinning. A map is authored against ONE printed revision: the IRS renumbers
// lines between revisions, so the same field name can move to a different cell. Pinning
// makes that fail loudly here instead of silently mis-filling a filed form.
if (mapDoc.form_revision) {
  const info = await readFormRevisionWithPages(mapDoc.form);
  const revOk = info.revision === mapDoc.form_revision;
  const catOk = !mapDoc.catalog || info.catalog === mapDoc.catalog;
  console.log(`revision pin: map declares Rev. ${mapDoc.form_revision}${mapDoc.catalog ? ` / Cat ${mapDoc.catalog}` : ''}; PDF prints Rev. ${info.revision ?? '(none)'}${info.catalog ? ` / Cat ${info.catalog}` : ''}`);
  if (!revOk || !catOk) {
    console.error(`REVISION MISMATCH — ${mapDoc.pdf} is not the revision this map was authored against.`);
    if (!revOk) console.error(`  form_revision: map "${mapDoc.form_revision}" vs PDF "${info.revision ?? '(none)'}"`);
    if (!catOk) console.error(`  catalog:       map "${mapDoc.catalog}" vs PDF "${info.catalog ?? '(none)'}"`);
    console.error('  Re-author the map against the new revision — do NOT just bump the pin.');
    process.exit(2);
  }
  console.log('OK — loaded PDF matches the pinned revision.');
}
