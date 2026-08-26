// Fetch one HubSpot contact and emit the intake record fill-433f.mjs consumes.
//
//   node adapters/hubspot/hs-fetch-433f.mjs <contactId>
//   -> samples/433f.from-hubspot-<contactId>.json
//
// REBUILT ON THE SHARED BACKBONE. The previous version read fields.registry.json, filtered to
// `form === '433f'`, and emitted the old registry's per-form logical key. Those properties are
// gone and that naming scheme with them. The names now come from crosswalk.433f.json, where
// each 433-F input key is bound to whichever irs433_ fact already carried it:
// irs433_county_of_residence feeds 433f_county, and nothing about either name says so — which
// is precisely why the binding is READ from the crosswalk and never derived here.
//
// THE THREE SHAPE DEFECTS, ALL CARRIED FORWARD
// --------------------------------------------
// Every one of these was SILENT — successful exit, valid PDF, wrong or empty page. Each was
// found by looking rather than by anything failing, so each is handled explicitly and asserted
// rather than assumed.
//
//   1  BARE VERSUS PREFIXED LOOKUPS. The defect that cost 433-F its entire checkbox layer. The
//      old fetch keyed its record by prefixed names (`433f_pay_freq`) while fill-433f.mjs's
//      checkbox block read BARE ones (`pay_freq`), so on a real HubSpot record not one box was
//      ticked — no error, no skip, exit 0. The engine now reads through `input()`, which tries
//      the bare name then the prefixed one; this file emits the PREFIXED form, which that
//      helper resolves. Group arrays are the exception and are emitted BARE, because
//      `data[def.array]` has no prefix fallback at all. Neither of those claims is trusted:
//      the assertion at the bottom checks every emitted key against what the engine can
//      actually consume.
//
//   2  GROUP TABLES ARRIVING AS JSON TEXT. HubSpot holds each repeatable table as ONE textarea
//      containing a JSON array. The fill engine tests `Array.isArray(data[def.array])` and
//      otherwise falls through to the scalar fallback, which a HubSpot record never populates
//      — so handing it the raw STRING prints an EMPTY table, silently. Every group is parsed
//      here, and anything that does not parse to an array of rows is a HARD STOP.
//
//   3  booleancheckbox STORING "true"/"false". The map's option keys are yes/no; HubSpot's
//      booleancheckbox stores the literal strings "true"/"false". fill-433f.mjs's truthy()
//      happens to accept both, which makes this the most dangerous of the three — it works by
//      luck on the one flag 433-F has today and stops working the moment a yes/no pair is
//      added that goes through resolveOption instead. The translation is applied from
//      `map_option_by_value`, the table the crosswalk RECORDED when it chose the option
//      values, and is never re-derived.

import { readFileSync, writeFileSync } from 'fs';
import { hs, stop, isStop } from './hs-lib.mjs';
import { loadBindings, consumableKeys } from './bindings.mjs';
import { slotColumnsOf } from '../pdf/check-row-shape.mjs';

const contactId = process.argv[2];
if (!contactId) {
  console.error('usage: node adapters/hubspot/hs-fetch-433f.mjs <contactId>');
  stop(1);
}

const form = '433f';
const bindings = loadBindings(form);
const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));

// --- read ------------------------------------------------------------------------------------
// The property list travels in the BODY of a batch read, not the querystring. A URL that gets
// truncated fails by DROPPING properties, which reads downstream as "the contact had no value
// there" — indistinguishable from a real blank. Same reason as hs-fetch-433a.mjs.
const props = bindings.map((b) => b.hs_name);
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
const coerced = { scalar: 0, options: 0, groups: 0 };

for (const b of bindings) {
  const raw = hsProps[b.hs_name];
  if (raw === undefined || raw === null || String(raw).trim() === '') continue;

  if (b.kind === 'group') {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) { if (isStop(e)) throw e;
      errors.push(`${b.hs_name} (-> ${b.key}): not valid JSON. A repeatable table is stored as a JSON array; the fill engine would have printed ZERO rows for it without saying so. ${e.message}`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push(`${b.hs_name} (-> ${b.key}): parsed to ${typeof parsed}, expected an ARRAY of row objects. The fill engine tests Array.isArray and silently prints nothing otherwise.`);
      continue;
    }
    // A row whose COLUMN KEYS belong to another form's map prints an empty slot exactly as
    // silently as a raw string does.
    //
    // THIS USED TO ACCEPT A PARTIAL MATCH — "at least one column in common" — and that was not
    // a check. A backbone receivable row keyed {name, address, amount_owed} against a slot
    // declaring {name, address, amount_due} matched two of three, cleared it, and printed
    // Amount Owed empty. So the requirement is now EVERY COLUMN THE SLOTS DECLARE.
    //
    // Measured against the SLOTS, not against the crosswalk's row_shape. Since the v3 re-key a
    // shared table's row_shape is the CANONICAL row — the union across the series — and a
    // column this form prints no cell for is legitimately absent from a record fed to it.
    // irs433_investments carries `phone` for 433-A; 433-F prints no phone cell for an
    // investment and must not fail for its absence. The slots are what this engine will read.
    const slotCols = slotColumnsOf(mapDoc, b.key);
    if (slotCols && slotCols.length) {
      parsed.forEach((row, i) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          errors.push(`${b.hs_name}[${i}]: row is not an object`);
          return;
        }
        const missing = slotCols.filter((c) => !(c in row));
        if (missing.length) {
          errors.push(`${b.hs_name}[${i}]: carries no key for ${missing.length} of the ${slotCols.length} column(s) ${form}'s slots declare — missing [${missing.join(', ')}]; row supplies [${Object.keys(row).join(', ')}]. Those cells would print empty with no error.`);
        }
      });
    }
    record[b.key] = parsed;
    coerced.groups++;
    continue;
  }

  if (b.kind === 'option') {
    const mapped = b.map_option_by_value[String(raw)];
    if (mapped === undefined) {
      errors.push(`${b.hs_name} (-> ${b.key}): stored value ${JSON.stringify(raw)} is not one of the provisioned option values [${Object.keys(b.map_option_by_value).join(', ')}]. The fill engine would reject it as an unresolvable option.`);
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
// This is the check that would have caught defect 1 the day it was introduced. A key this file
// emits that the engine cannot consume is a value that never reaches the page, and nothing
// downstream mentions it.
const consumed = consumableKeys(form, mapDoc);
const orphans = Object.keys(record).filter((k) => k !== 'intake_id' && !consumed.has(k));
if (orphans.length) {
  errors.push(`${orphans.length} emitted key(s) are not consumed by the ${form} fill engine: ${orphans.join(', ')}`);
}

if (errors.length) {
  console.error(`REFUSING TO WRITE — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ${e}`);
  stop(3);
}

const out = `samples/${form}.from-hubspot-${contactId}.json`;
writeFileSync(out, JSON.stringify(record, null, 2) + '\n');

const n = Object.keys(record).length - 1;
console.log(`fetched ${n} value(s) across ${bindings.length} bound propert(ies) -> ${out}`);
console.log(`  scalar ${coerced.scalar}, options translated ${coerced.options}, group tables parsed to arrays ${coerced.groups}`);
console.log(`  every emitted key is consumed by the ${form} engine (${consumed.size} consumable keys)`);
