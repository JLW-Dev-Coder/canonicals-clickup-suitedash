// Generate the HubSpot property definitions for one form DIRECTLY FROM ITS CLOSED MAP.
//
// CLI:  node adapters/hubspot/gen-fields-from-map.mjs <form>
// Out:  adapters/hubspot/fields.<form>.json   (the shape New-HubSpotProperties.ps1 reads)
//
// WHY GENERATED AND NOT HAND-AUTHORED
// -----------------------------------
// The map is the only thing that knows which input keys the fill engine actually consumes.
// A hand-authored property list drifts from it the moment a key is added, and the drift is
// invisible: a property nobody writes to and a key nobody provisioned both look like an
// empty cell on the filled form. Generating from the map means the two cannot disagree —
// re-run this and diff.
//
// PROPERTY NAMES ARE PERMANENT. HubSpot will not rename a property, so every name here is a
// one-way decision. Two rules protect that:
//
//   LOWERCASE THROUGHOUT. HubSpot silently lowercases the name it stores. A definition
//   carrying `irs433a_S7_accounting_method` would provision as `irs433a_s7_accounting_method`
//   and the registry would then disagree with the live portal forever, over a difference no
//   error message ever mentions. So the name is lowercased HERE and asserted below.
//
//   ONE PROPERTY PER REAL-WORLD VALUE, NOT PER PRINTED BOX. The map's `split` construct
//   exists precisely because the FORM splits one value across two abutting boxes — a phone
//   number into area code and subscriber number, an EIN into two and seven digits. Those are
//   one value each. Provisioning them as two fields would push the form's printing quirk into
//   the CRM permanently and make every intake ask for half a phone number.
//
// GROUP INPUTS ARE ONE SERIALIZED PROPERTY EACH, NOT ONE PER SLOT.
// 433-A repeats fourteen tables. Indexing them per slot (bank_accounts row 3, column
// account_balance, and so on) would need 280 properties for the tables alone, 452 for the
// form. The portal already carries 634 custom contact properties against HubSpot's 1,000
// ceiling, so the indexed shape does not fit and could not be walked back once created.
// The serialized shape needs 14, costs nothing at fill time (the engine already wants an
// ARRAY per group — see `groups[].source` in the map), and keeps a table's row count a
// property of the record rather than of the schema. The trade is real and worth stating:
// a serialized column cannot be filtered or reported on natively inside HubSpot.

import { readFileSync, writeFileSync } from 'fs';

const form = process.argv[2];
if (!form) {
  console.error('usage: node adapters/hubspot/gen-fields-from-map.mjs <form>');
  process.exit(2);
}

const mapPath = `adapters/pdf/maps/${form}.map.json`;
const outPath = `adapters/hubspot/fields.${form}.json`;
const mapDoc  = JSON.parse(readFileSync(mapPath, 'utf8'));

const PREFIX = `irs${form}`;               // irs433a — the group name too, matching the registry
const isProse = (k) => k.startsWith('_');  // `_why` / `_note` keys are documentation, not bindings

// --- naming ------------------------------------------------------------------------------
// Lowercased once, here, and then asserted. See the note above on why this is not cosmetic.
const hsName = (key) => `${PREFIX}_${key}`.toLowerCase();

// The printed line marker a key carries as its prefix ("1a_full_name" -> "1a", "S7_..." -> "S7").
// Reported as line_ref so a reviewer can find the cell on the page; null when the key names a
// concept the form does not number (marital_status, the allowable inputs).
const lineRef = (key) => {
  const m = /^(S?\d+[a-z]?)_/i.exec(key);
  return m ? m[1] : null;
};

const humanize = (key) => {
  const s = key.replace(/^(S?\d+[a-z]?)_/i, '').replace(/_/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
};

const label = (key, extra = '') => {
  const ref = lineRef(key);
  return `[${form}] ${ref ? `${ref} ` : ''}${humanize(key)}${extra}`;
};

// --- PII ---------------------------------------------------------------------------------
// Flags the property so the provisioner stamps the PII description on it. Deliberately
// over-broad: a false positive costs a description line, a false negative puts a taxpayer
// identifier into a field nobody knew to treat carefully.
const PII = /(ssn|itin|_dob|dob$|name|address|phone|email|account_number|acct|vin|license|tag|policy_number|ein|title_holders|invoice)/i;

// --- type inference ----------------------------------------------------------------------
// ORDERED RULES, AND THE ORDER IS THE WHOLE DESIGN. A flat "does the name contain a money
// word" test gets this form wrong in both directions, and every one of those errors is a
// number cell that will silently refuse a real value once provisioned:
//
//   13_accounts_balance_as_of      contains "balance" and is a DATE — the column header
//                                  "As of mmddyyyy" over the bank table, not an amount.
//   1c_county_of_residence         contains "count" and is a place name.
//   8c_dual_citizenship_country    same.
//   85_bizexp_repairs_and_maintenance   contains no money word at all and is money.
//   36_exp_food_clothing_misc      same.
//
// So DATE and FREE-TEXT are decided FIRST, and only what survives both is tested for money.
//
// Money is then decided STRUCTURALLY, from the printed-line number the key carries as its
// own prefix, not from a vocabulary of money words. Lines 12-20 are the asset totals, 21-51
// are the monthly income and living-expense table, and 64-90 are the business income and
// expense tables — every printed cell in those bands is a dollar figure except the ones the
// date and free-text rules already took. That is a fact about the FORM, so it survives a
// key being renamed, and it is why lines like 54 (an EIN) and 57 (a website) stay text
// despite sitting between the bands.
//
// Dates stay STRING, never HubSpot's `date` type: the form prints an 8-character mmddyyyy
// cell, HubSpot's date type round-trips as epoch milliseconds in UTC, and that conversion is
// one more place for a filed collection statement to be wrong by a day.

// Runs first. `_as_of` is the one that matters most — it is a column header, not an amount.
const DATEISH = /(_as_of$|_date$|_date_|_dob$|_from$|_to$|_when$|_when_)/i;

// Runs second. Prose cells: descriptions, explanations, addresses, places, listings.
const FREETEXT = /(_desc$|_description$|_explain$|_subject$|_contents$|_assets$|_location|_address|name_and_address|names_with|_to_whom_or_where)/i;

// Counts and percentages — numbers that are not currency, and that sit outside the money bands.
const COUNTISH = /(_count$|_years$|_months$|dependents_claimed|number_of_employees|household_size|pct_)/i;

// Money outside the printed bands, named explicitly rather than by a broad token sweep.
const MONEYISH = /(_amount$|_value$|_value_at_|_balance$|_equity$|_total|total_|payroll)/i;

// The printed-line bands, from the form's own layout. See the note above.
const MONEY_BANDS = [[12, 20], [21, 51], [64, 90]];
const printedLineNo = (key) => {
  const m = /^(\d+)/.exec(key);
  return m ? parseInt(m[1], 10) : null;
};
const inMoneyBand = (key) => {
  const n = printedLineNo(key);
  return n !== null && MONEY_BANDS.some(([lo, hi]) => n >= lo && n <= hi);
};

const typeFor = (key) => {
  if (DATEISH.test(key))   return { type: 'string', fieldType: 'text',     basis: 'date cell (mmddyyyy), kept as string' };
  if (FREETEXT.test(key))  return { type: 'string', fieldType: 'textarea', basis: 'prose cell' };
  if (COUNTISH.test(key))  return { type: 'number', fieldType: 'number',   basis: 'count or percentage' };
  if (inMoneyBand(key))    return { type: 'number', fieldType: 'number',   basis: `money — printed line ${printedLineNo(key)} falls in a money band` };
  if (MONEYISH.test(key))  return { type: 'number', fieldType: 'number',   basis: 'money — named amount outside the printed bands' };
  return { type: 'string', fieldType: 'text', basis: 'identifier or short text' };
};

// --- properties --------------------------------------------------------------------------
const properties = [];
const push = (key, extra) => {
  properties.push({
    key,
    hs_name: hsName(key),
    form,
    field: key,
    label: extra.label ?? label(key),
    group: PREFIX,
    type: extra.type,
    fieldType: extra.fieldType,
    options: extra.options ?? null,
    pii: extra.pii ?? PII.test(key),
    line_ref: lineRef(key),
    source: extra.source,            // which map construct produced this property
    type_basis: extra.basis,         // WHY this type — so the review can check the reasoning
  });
};

// 1. scalar 1:1 — `map`
for (const key of Object.keys(mapDoc.map || {})) {
  if (isProse(key)) continue;
  push(key, { ...typeFor(key), source: 'map' });
}

// 2. `split` — ONE property per real value, never one per printed box.
for (const [key, def] of Object.entries(mapDoc.split || {})) {
  if (isProse(key) || !def || !Array.isArray(def.parts)) continue;
  const digits = def.parts.reduce((n, p) => n + (p.chars ?? 0), 0);
  push(key, {
    type: 'string', fieldType: 'text', basis: 'one real-world value the FORM splits across printed boxes',
    label: `${label(key)} (${digits} digits, one value)`,
    source: `split (${def.parts.length} printed boxes, 1 property)`,
  });
}

// 3. `checkboxes` — the map's own option keys BECOME the property's option values, so a value
//    chosen in HubSpot is a value the fill engine already knows how to resolve. Inventing
//    prettier values here would put a translation table between the CRM and the form.
for (const [key, options] of Object.entries(mapDoc.checkboxes || {})) {
  if (isProse(key) || !options || typeof options !== 'object' || Array.isArray(options)) continue;
  const values = Object.keys(options);
  const yesno = values.length === 2 && values.every(v => /^(yes|no)$/i.test(v));
  push(key, {
    type: 'enumeration',
    fieldType: yesno ? 'booleancheckbox' : 'select',
    basis: yesno ? 'yes/no checkbox pair' : `named-option checkbox set (${values.length} options)`,
    options: values.map((v, i) => ({
      label: v.charAt(0).toUpperCase() + v.slice(1).replace(/[-_]/g, ' '),
      value: yesno ? String(/^yes$/i.test(v)) : v,
      displayOrder: i,
    })),
    source: 'checkboxes',
  });
}

// 4. `groups` — one serialized property per table. See the header note for why not per slot.
for (const [gName, def] of Object.entries(mapDoc.groups || {})) {
  if (isProse(gName) || !def || !Array.isArray(def.slots)) continue;
  const key  = def.source || gName;
  const cap  = Math.min(def.max ?? def.slots.length, def.slots.length);
  const cols = new Set();
  for (const s of def.slots) {
    Object.keys(s.text || {}).forEach(c => cols.add(c));
    Object.keys(s.checkboxes || {}).forEach(c => cols.add(c));
  }
  push(key, {
    type: 'string', fieldType: 'textarea', basis: 'repeatable table, serialized as a JSON array',
    label: `[${form}] ${def.printed_line ? `${def.printed_line} ` : ''}${humanize(key)} (JSON array, up to ${cap} printed rows)`,
    pii: true,   // every table on this form carries account numbers, addresses or holder names
    source: `groups (${cap} printed slots x ${cols.size} columns, serialized)`,
    row_shape: [...cols],
  });
}

// 5. the allowable-expense inputs, by the names the engine reads (fill-433a.mjs HH/U65/O65).
//    Read from the MAP's own declaration so a rename there cannot silently orphan a property.
const allowedInputs = [
  mapDoc.allowed?.national_standards_total?.input,
  ...(mapDoc.allowed?.out_of_pocket_health?.inputs || []),
].filter(Boolean);
for (const key of allowedInputs) {
  push(key, { type: 'number', fieldType: 'number', pii: false, source: 'allowed', basis: 'headcount feeding an IRS allowable-standard lookup' });
}

// --- assertions --------------------------------------------------------------------------
// Every one of these is a defect that would only surface AFTER the names were permanent.
const errors = [];
const seen = new Map();
for (const p of properties) {
  if (p.hs_name !== p.hs_name.toLowerCase()) errors.push(`not lowercase: ${p.hs_name}`);
  if (!/^[a-z][a-z0-9_]*$/.test(p.hs_name))  errors.push(`illegal HubSpot property name: ${p.hs_name}`);
  if (p.hs_name.length > 100)                errors.push(`name over 100 chars: ${p.hs_name}`);
  if (seen.has(p.hs_name)) errors.push(`duplicate name: ${p.hs_name} (from "${seen.get(p.hs_name)}" and "${p.key}")`);
  seen.set(p.hs_name, p.key);
}
if (errors.length) {
  console.error(`${errors.length} problem(s) — nothing written:`);
  errors.forEach(e => console.error(`  ${e}`));
  process.exit(2);
}

const doc = {
  meta: {
    form,
    form_revision: mapDoc.form_revision,
    catalog: mapDoc.catalog,
    generated_from: mapPath,
    map_version: mapDoc.map_version,
    map_slice: mapDoc.slice,
    generator: 'adapters/hubspot/gen-fields-from-map.mjs',
    group_input_shape: 'serialized — one textarea property per repeatable table, holding a JSON array of row objects. NOT one property per slot: that shape needs 452 properties for this form against 366 free against HubSpot\'s 1,000-custom-property ceiling, and property names cannot be withdrawn.',
    naming_rule: 'irs<form>_<map input key>, lowercase throughout. HubSpot silently lowercases stored names, so a mixed-case definition drifts from the portal permanently.',
    counts: {},
  },
  groups: [{ name: PREFIX, label: `Form ${form.replace(/^433/, '433-').toUpperCase()}`, displayOrder: 0 }],
  properties,
};

const bySource = {};
for (const p of properties) {
  const s = p.source.split(' ')[0];
  bySource[s] = (bySource[s] || 0) + 1;
}
doc.meta.counts = { total: properties.length, by_construct: bySource, pii: properties.filter(p => p.pii).length };

writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n');
console.log(`${form}: ${properties.length} properties -> ${outPath}`);
console.log(`  by map construct: ${Object.entries(bySource).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`  flagged PII: ${doc.meta.counts.pii}`);
