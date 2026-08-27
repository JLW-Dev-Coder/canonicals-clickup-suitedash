// Fetch one HubSpot contact and emit the intake record fill-433d.mjs consumes.
//
//   node adapters/hubspot/hs-fetch-433d.mjs <contactId>
//   -> samples/433d.from-hubspot-<contactId>.json
//
// WRITTEN AGAINST THE FIVE FETCHERS THAT CAME BEFORE IT, and carrying the same three shape
// defects those were rebuilt around. Each was SILENT — successful exit, valid PDF, wrong or
// empty page — so each is handled explicitly and asserted rather than assumed:
//
//   1  BARE VERSUS PREFIXED LOOKUPS. Every 433-D input key already carries the `433d_` prefix in
//      the map itself, so the bare/prefixed trap the other four walked into has no purchase here.
//      That is a property of this form and not a reason to skip the check: the emitted keys are
//      asserted against consumableKeys() below, which is what would catch a spelling either way.
//
//   2  GROUP TABLES ARRIVING AS JSON TEXT. 433-D DECLARES NO GROUPS AT ALL — its map has no
//      `groups` block, so no property on this form is a table. That is a CHECKED ABSENCE printed
//      on every run, not a section quietly omitted ([R-04]), and the assertion below refuses a
//      binding of kind `group` rather than assuming none can arrive.
//
//   3  OPTION VALUES. HubSpot's booleancheckbox stores the literal "true"/"false"; the fill
//      engine matches against the map's PRINTED OPTION WORDS, and an unrecognised option is a
//      HARD FAILURE in that engine rather than a skip. Every option value is translated through
//      the recorded `map_option_by_value` table and the rule is not re-derived here.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// AND THE TWO THIS FORM ADDS, WHICH ARE WHY IT IS THE SIXTH AND NOT THE FIRST
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// THE SUBJECT IS AN INPUT AND THE RECORD MUST CARRY IT. `433d_subject` names no printed cell.
// The fill engine reads it to decide which of two properties the identifier comes from and which
// conditional cells it must assert empty, and a record that declares nothing is REFUSED rather
// than defaulted. A fetcher that emitted no subject would produce a record the gate stops on —
// loudly, which is fine — but a fetcher that emitted the WRONG subject would produce a record
// that fills cleanly and puts an entity's EIN in the individual branch. So the subject is read
// from the contact like any other property and its value is checked against the two the map
// declares.
//
// THE THREE REUSED PROPERTIES ARE NOT UNDER THIS FORM'S PREFIX, AND THEY ARE NOT ALL UNDER ONE
// PREFIX EITHER. 433-D binds `irs433_tp_ssn_itin` (433-A), `irs433_sp_ssn_itin` (433-A) and
// `irs433boi_employer_identification_number` (433-B(OIC)). A batch read assembled from this
// form's prefix would request three names that do not exist and report three empty cells —
// indistinguishable from a contact that left them blank, and on this form one of those three is
// the taxpayer identifier the whole agreement is against. The property list comes from
// loadBindings(), which reads the emitted definitions, so no prefix is assembled here at all, and
// the reused names actually requested are asserted against the definitions rather than assumed.

import { readFileSync, writeFileSync } from 'fs';
import { hs, stop, isStop } from './hs-lib.mjs';
import { loadBindings, consumableKeys } from './bindings.mjs';
import { loadRecordShape, statesOf } from '../pdf/record-shape.mjs';

const contactId = process.argv[2];
if (!contactId) {
  console.error('usage: node adapters/hubspot/hs-fetch-433d.mjs <contactId>');
  stop(1);
}

const form = '433d';
const bindings = loadBindings(form);
const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
const defs = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));

// A BINDING WITH NO NAME IS A STOP. `undefined` is a legal thing to put in a Set of property
// names to request, and a batch read that asks for it comes back with an empty contact.
const nameless = bindings.filter((b) => !b.hs_name);
if (nameless.length) {
  console.error(`STOP — ${nameless.length} of ${bindings.length} binding(s) carry no hs_name: ${nameless.slice(0, 5).map((b) => b.key).join(', ')}${nameless.length > 5 ? ' …' : ''}`);
  console.error('  The batch read would request a nameless property and report an empty contact. See bindings.mjs bindingSourceOf().');
  stop(3);
}

// 433-D DECLARES NO GROUPS. Refused rather than assumed: a binding of kind `group` arriving here
// would mean the map grew a table and this fetcher has no reader for it, which would print zero
// rows with no error — the exact silence the group handling in the other five exists for.
const groupRows = bindings.filter((b) => b.kind === 'group');
if (groupRows.length) {
  console.error(`STOP — ${groupRows.length} binding(s) are repeatable tables and 433-D declares no groups: ${groupRows.map((b) => b.key).join(', ')}.`);
  console.error('  This fetcher has no group reader because this form has no groups. A table arriving here would be parsed by nothing and print zero rows without saying so.');
  stop(3);
}

// THE REUSED NAMES MUST ACTUALLY BE IN THE REQUEST, under their own creators' prefixes.
const reuseNames = new Set(defs.properties.filter((p) => p.scope === 'reuse').map((p) => p.hs_name));
const requested = new Set(bindings.map((b) => b.hs_name));
const missingReuse = [...reuseNames].filter((n) => !requested.has(n));
if (missingReuse.length) {
  console.error(`STOP — ${missingReuse.length} reused propert(ies) are not in the batch read: ${missingReuse.join(', ')}.`);
  console.error('  Those cells would come back empty and read as a contact that left them blank.');
  stop(3);
}

// THE SUBJECT ROUTE, READ OUT OF THE MAP. Its two branch properties and its discriminator are
// what the engine resolves the identifier through, and this fetcher must be able to name all
// three before it asks the portal for anything.
const ROUTES = Object.entries(mapDoc.subject_classes || {})
  .filter(([s, d]) => !s.startsWith('_') && d?.class === 'dependent' && d.route)
  .map(([stem, d]) => ({ stem, ...d.route }));
if (ROUTES.length !== 1) {
  console.error(`STOP — the map declares ${ROUTES.length} subject route(s) and this form has exactly one. The identifier would be read from a branch nothing chose.`);
  stop(3);
}
const ROUTE = ROUTES[0];
const SIDES = ['individual', 'entity'];

// --- read --------------------------------------------------------------------------------------
// The property list travels in the BODY of a batch read, not the querystring. A querystring that
// gets truncated fails by DROPPING properties, which reads downstream as "the contact had no
// value there" — indistinguishable from a real blank.
const props = [...requested];
const res = await hs('/crm/v3/objects/contacts/batch/read', {
  method: 'POST',
  body: { properties: props, inputs: [{ id: contactId }] },
});
const found = (res.results || [])[0];
if (!found) {
  console.error(`No contact ${contactId} (or it holds none of the ${props.length} requested properties).`);
  stop(2);
}
const hsProps = found.properties || {};

// --- build the record --------------------------------------------------------------------------
const record = { intake_id: `HS-${contactId}` };
const errors = [];
const coerced = { scalar: 0, options: 0 };
let fromReused = 0;

for (const b of bindings) {
  const raw = hsProps[b.hs_name];
  if (raw === undefined || raw === null || String(raw).trim() === '') continue;
  if (reuseNames.has(b.hs_name)) fromReused++;

  if (b.kind === 'option') {
    const mapped = b.map_option_by_value?.[String(raw)];
    if (mapped === undefined) {
      errors.push(`${b.hs_name} (-> ${b.key}): stored value ${JSON.stringify(raw)} is not one of the provisioned option values [${Object.keys(b.map_option_by_value || {}).join(', ')}]. fill-433d.mjs treats an unrecognised option as a HARD FAILURE, so this stops here rather than filing a form that asserts nothing where the filer said something.`);
      continue;
    }
    record[b.key] = mapped;
    coerced.options++;
    continue;
  }

  record[b.key] = raw;
  coerced.scalar++;
}

// --- assert the key shape against the ENGINE, not against belief -------------------------------
const consumed = consumableKeys(form, mapDoc);
const orphans = Object.keys(record).filter((k) => k !== 'intake_id' && !consumed.has(k));
if (orphans.length) errors.push(`${orphans.length} emitted key(s) are not consumed by the ${form} fill engine: ${orphans.join(', ')}`);

// --- THE SUBJECT, AND IT IS THIS FORM'S OWN ASSERTION -------------------------------------------
//
// A record with no subject is refused by the gate, which is loud. A record with the WRONG subject
// fills cleanly and puts one legal person's identifier in the other one's property. So the value
// is checked against the two the map declares, and the branch it selects is checked for having a
// value at all — an entity record whose EIN property was empty would produce a filed agreement
// with no taxpayer identifier on it and nothing anywhere saying so.
const subject = record[ROUTE.discriminator];
if (subject === undefined) {
  errors.push(`the record carries no "${ROUTE.discriminator}". The fill engine reads it to route the identifier and to decide which conditional cells must be empty; a record that declares nothing is REFUSED rather than defaulted, so this would fail at the gate. It is emitted from the contact like any other property, so an absent value means the property held nothing.`);
} else if (!SIDES.includes(String(subject))) {
  errors.push(`the record carries "${ROUTE.discriminator}" = ${JSON.stringify(subject)}, which is neither of the two subjects the map declares (${SIDES.join(', ')}).`);
} else {
  const chosen = ROUTE[String(subject)];
  const other = ROUTE[SIDES.find((s) => s !== String(subject))];
  if (record[chosen] === undefined)
    errors.push(`the record declares subject "${subject}" and carries no "${chosen}". The filed agreement would print no taxpayer identifier at all, on a document signed under penalty of perjury, and the fill engine has nothing to refuse — the cell is simply empty.`);
  if (record[other] !== undefined)
    errors.push(`the record declares subject "${subject}" and ALSO carries "${other}", which is the other branch of the same printed box. One box cannot hold two identifiers; the engine would write one of them and the record asserts both.`);
}

// --- the declared record shape: a CHECKED ABSENCE on this form ----------------------------------
const RS = loadRecordShape(mapDoc);
for (const d of RS.declarations) {
  const v = record[d.input];
  if (v === undefined) errors.push(`the record carries no "${d.input}", and the map declares it a route. Gate step 11 STOPs on a record that declares none.`);
  else if (!statesOf(d).includes(String(v))) errors.push(`the record carries "${d.input}" = ${JSON.stringify(v)}, which is not one of the states the map declares (${statesOf(d).join(', ')}).`);
}

const filled = Object.keys(record).length - 1;

if (errors.length) {
  console.error(`REFUSING TO WRITE — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ${e}`);
  stop(3);
}

const out = `samples/${form}.from-hubspot-${contactId}.json`;
writeFileSync(out, JSON.stringify(record, null, 2) + '\n');

console.log(`fetched ${filled} value(s) across ${bindings.length} bound propert(ies) -> ${out}`);
console.log(`  scalar ${coerced.scalar}, options translated ${coerced.options}, group tables 0 — 433-D declares NO groups, which is a checked absence and not an omitted section`);
console.log(`  requested ${props.length} propert(ies): ${props.length - reuseNames.size} under irs433d_ and ${reuseNames.size} REUSED under their creators' prefixes (${[...reuseNames].join(', ')}); ${fromReused} of the reused ones carried a value`);
console.log(`  every emitted key is consumed by the ${form} engine (${consumed.size} consumable keys)`);
console.log(`  declared subject: ${ROUTE.discriminator} = ${JSON.stringify(subject)} -> identifier read from ${ROUTE[String(subject)]}; the other branch (${ROUTE[SIDES.find((s) => s !== String(subject))]}) is asserted absent`);
console.log(`  declared record shape: ${RS.declarations.length ? RS.declarations.map((d) => `${d.input} = ${JSON.stringify(record[d.input])}`).join('; ') : 'NONE — 433-D declares no record shape, and that is a checked absence rather than a section omitted'}`);
