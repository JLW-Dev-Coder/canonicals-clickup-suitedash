// Fetch one HubSpot contact and emit the intake record fill-433boi.mjs consumes.
//
//   node adapters/hubspot/hs-fetch-433boi.mjs <contactId>
//   -> samples/433boi.from-hubspot-<contactId>.json
//
// WRITTEN AGAINST THE THREE FETCHERS THAT CAME BEFORE IT, and carrying the same three shape
// defects those were rebuilt around. Each was SILENT - successful exit, valid PDF, wrong or
// empty page - so each is handled explicitly and asserted rather than assumed:
//
//   1  BARE VERSUS PREFIXED LOOKUPS. This form's engine reads its input keys straight out of
//      the map, with no bare/prefixed fallback helper, so the key this file emits IS the key
//      the engine looks up. There is nothing to get wrong per key and everything to get wrong
//      per SET, which is why the assertion at the bottom checks every emitted key against what
//      the engine can actually consume rather than trusting that claim.
//
//   2  GROUP TABLES ARRIVING AS JSON TEXT. HubSpot holds each repeatable table as ONE textarea
//      containing a JSON array. fill-433boi.mjs tests `Array.isArray(data[def.source])` and
//      otherwise treats the group as having ZERO rows - no error, valid PDF, empty table. So
//      every group is parsed here and anything that does not parse to an array of row objects
//      is a HARD STOP.
//
//   3  OPTION VALUES. Three constructs on 433-A(OIC); FOUR here. `checkboxes` are named-option
//      sets resolved by fill-433boi's applyOption against the map's option keys; `check_here`
//      is a LONE box whose engine accepts yes/no/true/false. Both translate through the
//      recorded `map_option_by_value` table and neither re-derives the rule here.
//
// AND THE FOURTH CONSTRUCT, WHICH IS THIS FORM'S OWN: THE DECLARED RECORD SHAPE.
// `business_income_expense_route` is an input the engine reads and the map names NO CELL for.
// It is not in `map`, not in `checkboxes`, not in `check_here` and not a group source; it
// reaches the key space through ENGINE_EXTRA_INPUTS, and it is the one input on this form whose
// ABSENCE is a gate STOP rather than a blank cell. So it is checked explicitly at the bottom:
// a record emitted without it cannot be gated at all, and saying so here is better than saying
// it eleven steps later in a run that had already filled a PDF.
//
// AND ONE THIS FORM INHERITS: ROW COLUMNS ARE MEASURED AGAINST THE SLOTS, NOT AGAINST row_shape.
// The asset tables here bind FORM-SPECIFIC properties rather than the shared backbone ones, so
// the missing-column case that 433-A(OIC) has - a row stored by 433-A carrying no quick-sale
// value - cannot arise from another form. It can still arise from a row somebody wrote by hand,
// and a quick-sale cell left blank is a discounted asset figure the offer calculation is built
// on, so the column is still reported by name.

import { readFileSync, writeFileSync } from 'fs';
import { hs } from './hs-lib.mjs';
import { loadBindings, consumableKeys } from './bindings.mjs';
import { slotColumnsOf } from '../pdf/check-row-shape.mjs';
import { loadRecordShape, statesOf } from '../pdf/record-shape.mjs';

const contactId = process.argv[2];
if (!contactId) {
  console.error('usage: node adapters/hubspot/hs-fetch-433boi.mjs <contactId>');
  process.exit(1);
}

const form = '433boi';
const bindings = loadBindings(form);
const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));

// The group NAME and the input KEY differ on this form - groups.1ac_bank_accounts is fed by
// `bank_accounts` - so slotColumnsOf, which resolves by group name OR array OR source, is given
// the source key directly and the inverse map is kept for the error messages.
const groupNameByKey = {};
for (const [g, d] of Object.entries(mapDoc.groups || {})) if (!g.startsWith('_')) groupNameByKey[d.source || g] = g;

// --- read --------------------------------------------------------------------------------------
// The property list travels in the BODY of a batch read, not the querystring. 113 names is
// roughly 3 KB of URL; a querystring that gets truncated fails by DROPPING properties, which
// reads downstream as "the contact had no value there" - indistinguishable from a real blank.
// Same reason as the other three fetchers.
const props = [...new Set(bindings.map((b) => b.hs_name))];
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

// --- build the record ----------------------------------------------------------------------------
const record = { intake_id: `HS-${contactId}` };
const errors = [];
const coerced = { scalar: 0, options: 0, groups: 0 };

for (const b of bindings) {
  const raw = hsProps[b.hs_name];
  if (raw === undefined || raw === null || String(raw).trim() === '') continue;

  if (b.kind === 'group') {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
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
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          errors.push(`${b.hs_name}[${i}]: row is not an object`);
          return;
        }
        const missing = slotCols.filter((c) => !(c in row));
        if (missing.length) {
          errors.push(`${b.hs_name}[${i}]: carries no key for ${missing.length} of the ${slotCols.length} column(s) ${groupNameByKey[b.key]}'s slots declare - missing [${missing.join(', ')}]; row supplies [${Object.keys(row).join(', ')}]. Those cells would print empty with no error.`);
        }
      });
    }
    record[b.key] = parsed;
    coerced.groups++;
    continue;
  }

  if (b.kind === 'option') {
    const mapped = b.map_option_by_value?.[String(raw)];
    if (mapped === undefined) {
      errors.push(`${b.hs_name} (-> ${b.key}): stored value ${JSON.stringify(raw)} is not one of the provisioned option values [${Object.keys(b.map_option_by_value || {}).join(', ')}]. A value this form has no box for stops here rather than printing nothing.`);
      continue;
    }
    record[b.key] = mapped;
    coerced.options++;
    continue;
  }

  record[b.key] = raw;
  coerced.scalar++;
}

// --- assert the key shape against the ENGINE, not against belief ------------------------------
const consumed = consumableKeys(form, mapDoc);
const orphans = Object.keys(record).filter((k) => k !== 'intake_id' && !consumed.has(k));
if (orphans.length) {
  errors.push(`${orphans.length} emitted key(s) are not consumed by the ${form} fill engine: ${orphans.join(', ')}`);
}

// --- THE DECLARED ROUTE, WHICH IS THE ONE INPUT WHOSE ABSENCE IS A STOP -----------------------
// Every other key on this form is a printed cell, and a blank printed cell is a legitimate
// answer on a financial statement. This one is not a cell at all: gate step 11 refuses a record
// that declares no state, because defaulting it would choose a filing route on the filer's
// behalf. A fetch that emits a record without it produces a file that cannot be gated, and
// finding that out here is better than finding it out after a PDF has been written.
const RS = loadRecordShape(mapDoc);
for (const d of RS.declarations) {
  const v = record[d.input];
  if (v === undefined) {
    errors.push(`the record carries no "${d.input}". This form draws ${statesOf(d).length} printed routes to ${(d.governs || []).join(', ')} and the filed page cannot tell them apart, so gate step 11 STOPs on a record that declares none. The contact's ${bindings.find((b) => b.key === d.input)?.hs_name ?? '(unbound)'} is empty.`);
  } else if (!statesOf(d).includes(String(v))) {
    errors.push(`the record carries "${d.input}" = ${JSON.stringify(v)}, which is not one of the states the map declares (${statesOf(d).join(', ')}).`);
  }
}

const filled = Object.keys(record).length - 1;

if (errors.length) {
  console.error(`REFUSING TO WRITE - ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(3);
}

const out = `samples/${form}.from-hubspot-${contactId}.json`;
writeFileSync(out, JSON.stringify(record, null, 2) + '\n');

console.log(`fetched ${filled} value(s) across ${bindings.length} bound propert(ies) -> ${out}`);
console.log(`  scalar ${coerced.scalar}, options translated ${coerced.options}, group tables parsed to arrays ${coerced.groups}`);
console.log(`  every emitted key is consumed by the ${form} engine (${consumed.size} consumable keys)`);
console.log(`  declared route: ${RS.declarations.map((d) => `${d.input} = ${JSON.stringify(record[d.input])}`).join('; ') || '(none declared by the map)'}`);
