// Fetch one HubSpot contact and emit the intake record fill-433aoi.mjs consumes.
//
//   node adapters/hubspot/hs-fetch-433aoi.mjs <contactId>
//   -> samples/433aoi.from-hubspot-<contactId>.json
//
// WRITTEN AGAINST hs-fetch-433a.mjs AND hs-fetch-433f.mjs, and carrying the same three shape
// defects those two were rebuilt around. Each of the three was SILENT - successful exit, valid
// PDF, wrong or empty page - so each is handled explicitly and asserted rather than assumed:
//
//   1  BARE VERSUS PREFIXED LOOKUPS. This form's engine reads its input keys straight out of
//      the map, with no bare/prefixed fallback helper at all, so the key this file emits IS
//      the key the engine looks up. There is nothing to get wrong per key and everything to
//      get wrong per SET, which is why the assertion at the bottom checks every emitted key
//      against what the engine can actually consume rather than trusting that claim.
//
//   2  GROUP TABLES ARRIVING AS JSON TEXT. HubSpot holds each repeatable table as ONE textarea
//      containing a JSON array. fill-433aoi.mjs tests `Array.isArray(data[def.source])` and
//      otherwise treats the group as having ZERO rows - no error, valid PDF, empty table. So
//      every group is parsed here and anything that does not parse to an array of row objects
//      is a HARD STOP.
//
//   3  OPTION VALUES. Three constructs, not two, and the third is this form's own. `checkboxes`
//      are named-option sets resolved by fill-433aoi's applyOption against the map's option
//      keys; `check_here` is a LONE box whose engine accepts yes/no/true/false and whose
//      negative answer is the box left blank. Both translate through the recorded
//      `map_option_by_value` table and neither re-derives the rule here.
//
// AND ONE THIS FORM ADDS: ROW COLUMNS ARE MEASURED AGAINST THE SLOTS, NOT AGAINST row_shape.
// 433-A(OIC) prints quick-sale columns on four asset tables that 433-A does not print at all,
// and it binds those tables to the SHARED backbone properties - so a row stored by 433-A is
// legitimately missing `quick_sale_value` and `quick_sale_equity`, and this form cannot fill
// its page from it. That is reported as a missing COLUMN, by name, because a quick-sale cell
// left blank is a discounted asset figure the offer calculation is built on.

import { readFileSync, writeFileSync } from 'fs';
import { hs, stop, isStop } from './hs-lib.mjs';
import { loadBindings, consumableKeys } from './bindings.mjs';
import { slotColumnsOf } from '../pdf/check-row-shape.mjs';

const contactId = process.argv[2];
if (!contactId) {
  console.error('usage: node adapters/hubspot/hs-fetch-433aoi.mjs <contactId>');
  stop(1);
}

const form = '433aoi';
const bindings = loadBindings(form);
const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));

// The group NAME and the input KEY differ on this form - groups.5ab_real_property is fed by
// `real_property` - so slotColumnsOf, which is keyed by group name, needs the inverse.
const groupNameByKey = {};
for (const [g, d] of Object.entries(mapDoc.groups || {})) if (!g.startsWith('_')) groupNameByKey[d.source || g] = g;

// --- read --------------------------------------------------------------------------------------
// The property list travels in the BODY of a batch read, not the querystring. 238 names is
// roughly 6 KB of URL; a querystring that gets truncated fails by DROPPING properties, which
// reads downstream as "the contact had no value there" - indistinguishable from a real blank.
// Same reason as hs-fetch-433a.mjs and hs-fetch-433f.mjs.
const props = [...new Set(bindings.map((b) => b.hs_name))];
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
    } catch (e) { if (isStop(e)) throw e;
      errors.push(`${b.hs_name} (-> ${b.key}): not valid JSON. A repeatable table is stored as a JSON array; the fill engine would have printed ZERO rows for it without saying so. ${e.message}`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push(`${b.hs_name} (-> ${b.key}): parsed to ${typeof parsed}, expected an ARRAY of row objects. The fill engine tests Array.isArray and silently prints nothing otherwise.`);
      continue;
    }
    const gName = groupNameByKey[b.key];
    const slotCols = gName ? slotColumnsOf(mapDoc, gName) : null;
    if (slotCols && slotCols.length) {
      parsed.forEach((row, i) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          errors.push(`${b.hs_name}[${i}]: row is not an object`);
          return;
        }
        const missing = slotCols.filter((c) => !(c in row));
        if (missing.length) {
          errors.push(`${b.hs_name}[${i}]: carries no key for ${missing.length} of the ${slotCols.length} column(s) ${gName}'s slots declare - missing [${missing.join(', ')}]; row supplies [${Object.keys(row).join(', ')}]. Those cells would print empty with no error.`);
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
      errors.push(`${b.hs_name} (-> ${b.key}): stored value ${JSON.stringify(raw)} is not one of the provisioned option values [${Object.keys(b.map_option_by_value || {}).join(', ')}]. This is the pay-period case if it is a pay-period property: the live option set is a superset of what 433-A(OIC) prints, and a value this form has no box for stops here rather than printing nothing.`);
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
// A key this file emits that the engine cannot consume is a value that never reaches the page,
// and nothing downstream mentions it.
const consumed = consumableKeys(form, mapDoc);
const orphans = Object.keys(record).filter((k) => k !== 'intake_id' && !consumed.has(k));
if (orphans.length) {
  errors.push(`${orphans.length} emitted key(s) are not consumed by the ${form} fill engine: ${orphans.join(', ')}`);
}
// And the reverse, as a NOTE rather than an error: which consumable keys the contact held no
// value for. A blank cell on a financial statement is a legitimate answer, so this cannot be a
// failure - but a fetch that quietly returns 12 of 238 values and a fetch that returns 230 look
// identical from the exit code, and the difference is the whole point of a round trip.
const filled = Object.keys(record).length - 1;

if (errors.length) {
  console.error(`REFUSING TO WRITE - ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ${e}`);
  stop(3);
}

const out = `samples/${form}.from-hubspot-${contactId}.json`;
writeFileSync(out, JSON.stringify(record, null, 2) + '\n');

console.log(`fetched ${filled} value(s) across ${bindings.length} bound propert(ies) -> ${out}`);
console.log(`  scalar ${coerced.scalar}, options translated ${coerced.options}, group tables parsed to arrays ${coerced.groups}`);
console.log(`  every emitted key is consumed by the ${form} engine (${consumed.size} consumable keys)`);
