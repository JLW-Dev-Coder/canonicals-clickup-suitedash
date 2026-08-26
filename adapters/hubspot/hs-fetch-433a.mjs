// Fetch one HubSpot contact and emit the intake record fill-433a.mjs consumes.
//
//   node adapters/hubspot/hs-fetch-433a.mjs <contactId>
//   -> samples/433a.from-hubspot-<contactId>.json
//
// KEY SHAPE — THE BUG THIS FILE EXISTS TO NOT REPEAT
// -------------------------------------------------
// 433-F's fetch layer keyed its output by the registry's LOGICAL key, and every 433-F logical
// key carries a form prefix (`433f_pay_freq`). The checkbox layer read BARE names off `data`.
// The result was a PDF with not one box ticked, no error, no skip, and a successful exit.
//
// 433-A does not have that mismatch to begin with — fill-433a.mjs reads `data[<map key>]`
// everywhere, and the map's keys are bare (`1a_full_name`, `marital_status`,
// `household_members`) — so this file emits exactly `p.key` from the generated definitions,
// which IS the map input key. The point is that this is now ASSERTED at the bottom of this
// file against the map itself rather than believed, because the failure mode is silence.
//
// TWO COERCIONS, BOTH OF WHICH ARE THE SAME CLASS OF DEFECT
// ---------------------------------------------------------
// A value that survives the round trip in the wrong SHAPE is worse than one that does not
// survive at all, because the engine reports success either way.
//
//   GROUPS. HubSpot holds each repeatable table as ONE textarea containing a JSON array. The
//   fill engine does `Array.isArray(data[source]) ? ... : []` — so handing it the raw STRING
//   prints zero rows, silently, with no error and a valid PDF. Every group is parsed here, and
//   a value that does not parse to an array is a HARD STOP rather than an empty table.
//
//   YES/NO CHECKBOXES. HubSpot's booleancheckbox stores the literal "true"/"false". The fill
//   engine's resolveOption matches against the MAP's option keys ("yes"/"no"), and its
//   normalize() turns a real boolean into yes/no but leaves the STRING "true" as "true". So
//   "true" resolves against nothing. The translation is not re-derived here — it is read from
//   `map_option_by_value`, which the generator wrote when it chose the option values.

import { readFileSync, writeFileSync } from 'fs';
import { hs, chunk, stop, isStop } from './hs-lib.mjs';
import { slotColumnsOf } from '../pdf/check-row-shape.mjs';

const contactId = process.argv[2];
if (!contactId) {
  console.error('usage: node adapters/hubspot/hs-fetch-433a.mjs <contactId>');
  stop(1);
}

const form = '433a';
const defs = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));
const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));

// --- read ------------------------------------------------------------------------------------
// The property list travels in the BODY of a batch read. A 186-name querystring is within the
// URL ceiling today, but the series grows and a URL that gets truncated fails by DROPPING
// properties, which reads downstream as "the contact had no value there".
const props = defs.properties.map((p) => p.hs_name);
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

// --- build the record ------------------------------------------------------------------------
const record = { intake_id: `HS-${contactId}` };
const errors = [];
const coerced = { groups: 0, checkboxes: 0, scalar: 0 };

for (const p of defs.properties) {
  const raw = hsProps[p.hs_name];
  if (raw === undefined || raw === null || String(raw).trim() === '') continue;

  if (p.source.startsWith('groups')) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) { if (isStop(e)) throw e;
      errors.push(`${p.hs_name} (-> ${p.key}): not valid JSON. A repeatable table is stored as a JSON array; the fill engine would have printed ZERO rows for it without saying so. ${e.message}`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push(`${p.hs_name} (-> ${p.key}): parsed to ${typeof parsed}, expected an ARRAY of row objects. The fill engine tests Array.isArray and silently prints nothing otherwise.`);
      continue;
    }
    // ROW SHAPE. This file had no column check at all — a row keyed by another form's
    // vocabulary parsed to a valid array, cleared every test here, and printed its cells
    // empty. Since the v3 re-key the tables are SHARED, so a row written for one form is
    // routinely handed to the other and the mismatch is no longer hypothetical.
    //
    // Measured against the SLOTS. The property's own row_shape is the CANONICAL row — the
    // union across the series — and a column 433-A prints no cell for (is_business_account,
    // an investment's account_number) is legitimately absent from a record fed to 433-A.
    const slotCols = slotColumnsOf(mapDoc, p.key);
    if (slotCols && slotCols.length) {
      parsed.forEach((row, i) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          errors.push(`${p.hs_name}[${i}]: row is not an object`);
          return;
        }
        const missing = slotCols.filter((c) => !(c in row));
        if (missing.length) {
          errors.push(`${p.hs_name}[${i}]: carries no key for ${missing.length} of the ${slotCols.length} column(s) ${form}'s slots declare — missing [${missing.join(', ')}]; row supplies [${Object.keys(row).join(', ')}]. Those cells would print empty with no error.`);
        }
      });
    }
    record[p.key] = parsed;
    coerced.groups++;
    continue;
  }

  if (p.source === 'checkboxes' && p.map_option_by_value) {
    const mapped = p.map_option_by_value[String(raw)];
    if (mapped === undefined) {
      errors.push(`${p.hs_name} (-> ${p.key}): stored value ${JSON.stringify(raw)} is not one of the provisioned option values [${Object.keys(p.map_option_by_value).join(', ')}]. The fill engine would reject it as an unresolvable option.`);
      continue;
    }
    record[p.key] = mapped;
    coerced.checkboxes++;
    continue;
  }

  record[p.key] = raw;
  coerced.scalar++;
}

// --- assert the key shape against the MAP, not against belief --------------------------------
// The map is what fill-433a.mjs iterates. A key this file emits that the map does not consume
// is a value that will never reach the page, and the engine will not mention it.
const consumed = new Set([
  ...Object.keys(mapDoc.map || {}),
  ...Object.keys(mapDoc.split || {}),
  ...Object.keys(mapDoc.checkboxes || {}),
  ...Object.entries(mapDoc.groups || {}).map(([g, d]) => (d && d.source) || g),
  mapDoc.allowed?.national_standards_total?.input,
  ...(mapDoc.allowed?.out_of_pocket_health?.inputs || []),
].filter(Boolean));

const orphans = Object.keys(record).filter((k) => k !== 'intake_id' && !consumed.has(k));
if (orphans.length) {
  errors.push(`${orphans.length} emitted key(s) are not consumed by ${form}.map.json: ${orphans.join(', ')}`);
}

if (errors.length) {
  console.error(`REFUSING TO WRITE — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ${e}`);
  stop(3);
}

const out = `samples/${form}.from-hubspot-${contactId}.json`;
writeFileSync(out, JSON.stringify(record, null, 2) + '\n');

const n = Object.keys(record).length - 1;
console.log(`fetched ${n} value(s) -> ${out}`);
console.log(`  scalar ${coerced.scalar}, checkboxes translated ${coerced.checkboxes}, group tables parsed to arrays ${coerced.groups}`);
console.log(`  every emitted key is consumed by ${form}.map.json (${consumed.size} consumable keys)`);
