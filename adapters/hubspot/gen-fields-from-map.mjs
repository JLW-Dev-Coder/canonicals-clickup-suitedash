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

const SHARED_PREFIX = 'irs433';            // a fact the 433 SERIES shares
const FORM_PREFIX = `irs${form}`;          // irs433a — a fact only this form carries
const isProse = (k) => k.startsWith('_');  // `_why` / `_note` keys are documentation, not bindings

// --- naming: FACT-LEVEL, NOT FORM-LEVEL --------------------------------------------------
// A HubSpot property does not know which form it serves. The map already translates a fact to
// a cell, differently per form, so putting the form name in the property name bought nothing
// and cost a duplicate copy of every shared fact per form — seven forms at ~186 properties
// each is ~1,300, which does not fit under the ceiling even starting from an empty portal.
//
// So the property is named for the FACT, and the map is left to say where that fact prints.
// Concretely: the 433-A input key carries 433-A's PRINTED LINE MARKER as its own prefix
// ("1a_full_name", "S7_period_from"), and that marker is 433-A's alone — the same fact sits on
// a different line on 433-F and a different one again on 433-B. Stripping the marker is what
// turns a 433-A input key into a series fact.
//
//   1a_full_name              -> irs433_full_name
//   85_bizexp_repairs_and_...  -> irs433_bizexp_repairs_and_maintenance
//
// The input key survives on the property as `key`, so the fetch layer can still look up which
// 433-A cell feeds it and a reviewer can still find the cell on the page.

// The printed line marker a key carries as its prefix ("1a_full_name" -> "1a", "S7_..." -> "S7").
// Reported as line_ref so a reviewer can find the cell on the page; null when the key names a
// concept the form does not number (marital_status, the allowable inputs).
const lineRef = (key) => {
  const m = /^(S?\d+[a-z]?)_/i.exec(key);
  return m ? m[1] : null;
};

const stripMarker = (key) => key.replace(/^(S?\d+[a-z]?)_/i, '');

// --- facts whose stripped name is NOT yet a usable series name ----------------------------
// Two failure modes, both of which only bite after the name is permanent:
//
// COLLISION. Two different 433-A lines strip to one name while naming two different
// real-world values. Merging them would let one fact overwrite the other in the CRM.
//   9b/9c trust: 9b is the trust you are a BENEFICIARY of, 9c is the one you act as TRUSTEE
//   or fiduciary for. The map already distinguishes their EINs (trust_ein / trustee_ein), so
//   the names here follow that split rather than inventing a third vocabulary.
//   Lines 73-76 are FOUR SLOTS of one repeating "other business income" row. The slot ordinal
//   is a property of the table, not of 433-A's page, so it belongs in the series name; 433-A's
//   line numbers do not. Lines 33/34 are the same construct on the personal income table and
//   are renamed to match, so one convention covers both.
//
// RESIDUAL 433-A LINE REFERENCE. The stripped name still quotes a 433-A line number, which
// means nothing on any other form in the series. These are renamed to say what the cell IS.
const FACT_RENAME = {
  '9c_trust_name': 'trustee_trust_name',

  '33_income_other_description': 'income_other_1_description',
  '33_income_other_amount': 'income_other_1_amount',
  '34_income_other2_description': 'income_other_2_description',
  '34_income_other2_amount': 'income_other_2_amount',

  '73_bizinc_other_description': 'bizinc_other_1_description',
  '73_bizinc_other_amount': 'bizinc_other_1_amount',
  '74_bizinc_other_description': 'bizinc_other_2_description',
  '74_bizinc_other_amount': 'bizinc_other_2_amount',
  '75_bizinc_other_description': 'bizinc_other_3_description',
  '75_bizinc_other_amount': 'bizinc_other_3_amount',
  '76_bizinc_other_description': 'bizinc_other_4_description',
  '76_bizinc_other_amount': 'bizinc_other_4_amount',

  // "line 20" is 433-A's printed numbering for Other Personal Property. The group and its
  // total both quoted it.
  'property_line_20': 'other_personal_property',
  '20c_total_equity_property_line_20': 'total_equity_other_personal_property',

  // "not in 68 to 71" quotes four 433-A line numbers to mean "not already counted above".
  '72_bizinc_cash_receipts_not_in_68_to_71': 'bizinc_cash_receipts_not_otherwise_listed',
};

const factName = (key) => FACT_RENAME[key] ?? stripMarker(key);

// --- scope: shared by default -------------------------------------------------------------
// SHARED IS THE DEFAULT AND THE TIE-BREAK. A shared name can be used by one form; a
// form-scoped name cannot be used by two, and no name can ever be withdrawn. The asymmetry
// runs one way, so the default follows it.
//
// This set is where a fact that is CLEARLY unique to this form goes, with its reason. It is
// deliberately EMPTY, and that is a finding rather than an omission: 433-A's personal sections
// are very nearly a subset of 433-A(OIC), its income-and-expenses table is the table 433-F and
// 433-H also print, and its self-employment sections cover the ground 433-B covers. Working
// through all 186 facts, not one is clearly unique to 433-A and nowhere else in the series.
//
// There is also a structural reason the set must be empty AT THIS POINT IN THE SERIES: a fact
// can only be SHOWN to be 433-A-only once the other six maps exist to check it against. Until
// then every "unique to 433-A" claim is a guess, and the tie-break says a guess resolves to
// shared.
//
// The `irs433a_` namespace stays reserved. The first later form whose map proves a 433-A fact
// has no counterpart adds that fact here, and only that fact.
const FORM_SPECIFIC = new Set([
  // (empty — see above)
]);

const scopeOf = (key) => (FORM_SPECIFIC.has(key) ? form : 'shared');
const hsName = (key) =>
  `${scopeOf(key) === 'shared' ? SHARED_PREFIX : FORM_PREFIX}_${factName(key)}`.toLowerCase();

const humanize = (key) => {
  const s = factName(key).replace(/_/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
};

// The label no longer claims the property belongs to 433-A, because a shared property does
// not. Provenance moves to the DESCRIPTION, where it can name the form and line without
// implying ownership.
const label = (key, extra = '') => `[433] ${humanize(key)}${extra}`;

const describe = (key, pii) => {
  const ref = lineRef(key);
  const parts = [
    `433-A${ref ? ` line ${ref}` : ''} (input key: ${key}).`,
    scopeOf(key) === 'shared'
      ? 'Shared across the 433 series - named for the fact, not the form.'
      : `Specific to form ${form}.`,
  ];
  if (pii) parts.push('PII - handle per VLP PII rule.');
  return parts.join(' ');
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
  const pii = extra.pii ?? PII.test(key);
  const scope = scopeOf(key);
  properties.push({
    key,                             // the 433-A INPUT KEY that feeds this property. The fetch
                                     // layer keys its output record by exactly this, because
                                     // fill-433a.mjs reads `data[<map key>]` throughout.
    fact: factName(key),             // the series-level fact name, form marker stripped
    scope,                           // 'shared' | '433a'
    hs_name: hsName(key),
    form,                            // which form's map GENERATED this row (not ownership)
    field: key,
    label: extra.label ?? label(key),
    description: describe(key, pii),
    group: scope === 'shared' ? SHARED_PREFIX : FORM_PREFIX,
    type: extra.type,
    fieldType: extra.fieldType,
    options: extra.options ?? null,
    pii,
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
    // The printed-row cap is 433-A's, so it is stated as 433-A's rather than as the fact's.
    label: `[433] ${humanize(key)} (JSON array; ${cap} rows fit 433-A)`,
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
  // THE assertion for fact-level naming. Stripping the form marker is exactly the step that
  // can merge two distinct facts into one name, and a merge is invisible afterwards: the two
  // 433-A cells simply start overwriting each other in the CRM with no error anywhere. Any
  // collision belongs in FACT_RENAME with a reason, so this is a hard stop, not a warning.
  if (seen.has(p.hs_name)) {
    errors.push(
      `duplicate name: ${p.hs_name} (from "${seen.get(p.hs_name)}" and "${p.key}") ` +
      `— two 433-A input keys strip to one fact name. Add the distinguishing name to FACT_RENAME.`,
    );
  }
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
    naming_rule:
      'FACT-LEVEL. irs433_<fact> for a fact the 433 series shares; irs<form>_<fact> only where a fact is ' +
      'clearly unique to one form. The fact name is the map input key with the form\'s PRINTED LINE MARKER ' +
      'stripped (1a_full_name -> full_name), because that marker is 433-A\'s alone and the same fact prints ' +
      'on a different line on every other form. Shared is the default AND the tie-break: a shared name can be ' +
      'used by one form, a form-scoped name cannot be used by two, and no name can ever be withdrawn. ' +
      'Lowercase throughout — HubSpot silently lowercases stored names, so a mixed-case definition drifts ' +
      'from the portal permanently.',
    counts: {},
  },
  // Only groups that actually carry a property are declared, so provisioning never creates an
  // empty group in the CRM for a namespace nothing uses yet.
  groups: [
    { name: SHARED_PREFIX, label: 'Form 433 series (shared)', displayOrder: 0 },
    { name: FORM_PREFIX, label: `Form ${form.replace(/^433/, '433-').toUpperCase()} (form-specific)`, displayOrder: 1 },
  ].filter((g) => properties.some((p) => p.group === g.name)),
  properties,
};

const bySource = {};
for (const p of properties) {
  const s = p.source.split(' ')[0];
  bySource[s] = (bySource[s] || 0) + 1;
}
const shared = properties.filter((p) => p.scope === 'shared').length;
const formOnly = properties.length - shared;
doc.meta.counts = {
  total: properties.length,
  shared,
  form_specific: formOnly,
  by_construct: bySource,
  pii: properties.filter((p) => p.pii).length,
  renamed_facts: properties.filter((p) => p.fact !== stripMarker(p.key)).length,
};

writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n');
console.log(`${form}: ${properties.length} properties -> ${outPath}`);
console.log(`  scope: ${shared} shared (irs433_), ${formOnly} form-specific (${FORM_PREFIX}_)`);
console.log(`  by map construct: ${Object.entries(bySource).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`  flagged PII: ${doc.meta.counts.pii}`);
console.log(`  facts renamed off their stripped name: ${doc.meta.counts.renamed_facts}`);
