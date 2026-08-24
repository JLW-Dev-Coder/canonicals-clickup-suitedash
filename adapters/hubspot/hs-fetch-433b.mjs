// Fetch one HubSpot contact and emit the intake record fill-433b.mjs consumes.
//
//   node adapters/hubspot/hs-fetch-433b.mjs <contactId>
//   -> samples/433b.from-hubspot-<contactId>.json
//
// WRITTEN AGAINST THE FOUR FETCHERS THAT CAME BEFORE IT, and carrying the same three shape
// defects those were rebuilt around. Each was SILENT — successful exit, valid PDF, wrong or
// empty page — so each is handled explicitly and asserted rather than assumed:
//
//   1  BARE VERSUS PREFIXED LOOKUPS. fill-433b.mjs reads every input through
//      `input(name) => data[name] ?? data['433b_' + name]`, wired in BEFORE this fetcher
//      existed precisely so the trap could not be walked into a second time. This file emits
//      the BARE key, which that helper resolves first.
//
//   2  GROUP TABLES ARRIVING AS JSON TEXT. HubSpot holds each repeatable table as ONE textarea
//      containing a JSON array. fill-433b.mjs tests `Array.isArray(input(g))` and otherwise
//      treats the group as having ZERO rows — no error, valid PDF, empty table. So every group
//      is parsed here and anything that does not parse to an array of row objects is a HARD STOP.
//
//   3  OPTION VALUES. HubSpot's booleancheckbox stores the literal "true"/"false"; the fill
//      engine's applyOption matches against the map's PRINTED OPTION WORDS ("Yes", "No",
//      "Partnership", "Cash"), and an unrecognised option is a HARD FAILURE in that engine
//      rather than a skip. Every option value is translated through the recorded
//      `map_option_by_value` table and the rule is not re-derived here.
//
// AND THE ONE THIS FORM ADDS, WHICH IS THE REASON IT IS THE FIFTH AND NOT THE FIRST:
// NINE OF ITS PROPERTIES ARE NOT ITS OWN. 433-B binds nine properties `irs433boi_` records
// 433-B(OIC) as having created ([R-06]). The batch read must ask for them under THAT prefix, and
// a fetcher that built its request from this form's prefix would silently request nine names
// that do not exist and report nine empty cells — indistinguishable from a contact that left
// them blank. The property list comes from loadBindings(), which reads the emitted definitions,
// so the prefix is never assembled here at all; and the count of reused names actually requested
// is asserted against the definitions below rather than assumed.
//
// A NOTE ON WHAT THIS FORM DOES NOT HAVE. 433-B declares no record shape, no `special` block and
// no `allowed` block, so the route check 433-A(OIC) and 433-B(OIC) carry has no subject here.
// That is a checked absence, printed on every run, not a section quietly omitted ([R-04]).

import { readFileSync, writeFileSync } from 'fs';
import { hs } from './hs-lib.mjs';
import { loadBindings, consumableKeys } from './bindings.mjs';
import { slotColumnsOf } from '../pdf/check-row-shape.mjs';
import { loadRecordShape, statesOf } from '../pdf/record-shape.mjs';

const contactId = process.argv[2];
if (!contactId) {
  console.error('usage: node adapters/hubspot/hs-fetch-433b.mjs <contactId>');
  process.exit(1);
}

const form = '433b';
const bindings = loadBindings(form);
const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
const defs = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));

// A BINDING WITH NO NAME IS A STOP, and this is the assertion 433-B earned. bindings.mjs used to
// choose its reader from a LIST OF FORM NAMES; this form's crosswalk carries no `hs_name` (the
// name is derived from the classification's category) and the list did not name it, so
// loadBindings returned 116 rows whose hs_name was `undefined` — and `undefined` is a legal thing
// to put in a Set of property names to request. The reader now detects the shape from the rows,
// and this checks the result rather than trusting it.
const nameless = bindings.filter((b) => !b.hs_name);
if (nameless.length) {
  console.error(`STOP — ${nameless.length} of ${bindings.length} binding(s) carry no hs_name: ${nameless.slice(0, 5).map((b) => b.key).join(', ')}${nameless.length > 5 ? ' …' : ''}`);
  console.error('  The batch read would request a nameless property and report an empty contact. See bindings.mjs bindingSourceOf().');
  process.exit(3);
}

// AND THE NINE REUSED NAMES MUST ACTUALLY BE IN THE REQUEST, under the predecessor's prefix.
const reuseNames = new Set(defs.properties.filter((p) => p.scope === 'reuse').map((p) => p.hs_name));
const requested = new Set(bindings.map((b) => b.hs_name));
const missingReuse = [...reuseNames].filter((n) => !requested.has(n));
if (missingReuse.length) {
  console.error(`STOP — ${missingReuse.length} reused propert(ies) are not in the batch read: ${missingReuse.join(', ')}.`);
  console.error('  Those cells would come back empty and read as a contact that left them blank.');
  process.exit(3);
}

// 433-B's groups declare neither `array` nor `source`; fill-433b.mjs reads `input(g)`, the group
// NAME. slotColumnsOf resolves by name OR array OR source, so the key is handed to it directly.
const groupNameByKey = {};
for (const [g, d] of Object.entries(mapDoc.groups || {})) if (!g.startsWith('_')) groupNameByKey[d.array || d.source || g] = g;

// --- read --------------------------------------------------------------------------------------
// The property list travels in the BODY of a batch read, not the querystring. 116 names is
// roughly 3 KB of URL; a querystring that gets truncated fails by DROPPING properties, which
// reads downstream as "the contact had no value there" — indistinguishable from a real blank.
const props = [...requested];
const res = await hs('/crm/v3/objects/contacts/batch/read', {
  method: 'POST',
  body: { properties: props, inputs: [{ id: contactId }] },
});
const found = (res.results || [])[0];
if (!found) {
  console.error(`No contact ${contactId} (or it holds none of the ${props.length} requested properties).`);
  process.exit(2);
}
const hsProps = found.properties || {};

// --- build the record --------------------------------------------------------------------------
const record = { intake_id: `HS-${contactId}` };
const errors = [];
const coerced = { scalar: 0, options: 0, groups: 0 };
let fromReused = 0;

for (const b of bindings) {
  const raw = hsProps[b.hs_name];
  if (raw === undefined || raw === null || String(raw).trim() === '') continue;
  if (reuseNames.has(b.hs_name)) fromReused++;

  if (b.kind === 'group') {
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) {
      errors.push(`${b.hs_name} (-> ${b.key}): not valid JSON. A repeatable table is stored as a JSON array; the fill engine would have printed ZERO rows for it without saying so. ${e.message}`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push(`${b.hs_name} (-> ${b.key}): parsed to ${typeof parsed}, expected an ARRAY of row objects. The fill engine tests Array.isArray and silently prints nothing otherwise.`);
      continue;
    }
    const slotCols = slotColumnsOf(mapDoc, b.key);
    if (slotCols && slotCols.length) {
      parsed.forEach((row, i) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) { errors.push(`${b.hs_name}[${i}]: row is not an object`); return; }
        const missing = slotCols.filter((c) => !(c in row));
        if (missing.length) errors.push(`${b.hs_name}[${i}]: carries no key for ${missing.length} of the ${slotCols.length} column(s) ${groupNameByKey[b.key]}'s slots declare — missing [${missing.join(', ')}]; row supplies [${Object.keys(row).join(', ')}]. Those cells would print empty with no error.`);
      });
    }
    record[b.key] = parsed;
    coerced.groups++;
    continue;
  }

  if (b.kind === 'option') {
    const mapped = b.map_option_by_value?.[String(raw)];
    if (mapped === undefined) {
      errors.push(`${b.hs_name} (-> ${b.key}): stored value ${JSON.stringify(raw)} is not one of the provisioned option values [${Object.keys(b.map_option_by_value || {}).join(', ')}]. fill-433b.mjs treats an unrecognised option as a HARD FAILURE, so this stops here rather than filing a form that asserts nothing where the filer said something.`);
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

// --- the declared route: a CHECKED ABSENCE on this form ----------------------------------------
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
  process.exit(3);
}

const out = `samples/${form}.from-hubspot-${contactId}.json`;
writeFileSync(out, JSON.stringify(record, null, 2) + '\n');

console.log(`fetched ${filled} value(s) across ${bindings.length} bound propert(ies) -> ${out}`);
console.log(`  scalar ${coerced.scalar}, options translated ${coerced.options}, group tables parsed to arrays ${coerced.groups}`);
console.log(`  requested ${props.length} propert(ies): ${props.length - reuseNames.size} under irs433b_ and ${reuseNames.size} REUSED under irs433boi_; ${fromReused} of the reused ones carried a value`);
console.log(`  every emitted key is consumed by the ${form} engine (${consumed.size} consumable keys)`);
console.log(`  declared route: ${RS.declarations.length ? RS.declarations.map((d) => `${d.input} = ${JSON.stringify(record[d.input])}`).join('; ') : 'NONE — 433-B declares no record shape, and that is a checked absence rather than a section omitted'}`);
