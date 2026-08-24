// [D-19] — THE REGISTRY KEEPS ONLY THE ROWS WHOSE TARGETS RESOLVE.
//
//   node scratchpad/d19-registry-surgery.mjs [--apply]
//
// WHAT D-19 CARRIED, AND WHAT THE READ FOUND INSTEAD
// --------------------------------------------------
// The carried item names SEVEN stale rows for form 433b. Read against the portal on this run,
// the true figure is derived below and it is not seven: every registry row for EVERY IRS form
// is dead, and only the `vlp` rows are live. The seven were the visible corner of it, found
// because 433-B had just been provisioned and somebody looked.
//
// WHETHER A SECOND DEFINITION SOURCE EXISTS — THE QUESTION THE RULING SAYS TO SETTLE FIRST
// ----------------------------------------------------------------------------------------
// For an IRS form: NO. Its registry rows name properties that do not exist, under a naming
// scheme nothing provisions, for forms that each carry a generated `fields.<form>.json` whose
// every row IS live. Nothing reads the registry rows for those forms except a fallback that
// the generated file pre-empts. They describe nothing, so deleting them hides no relationship.
//
// For `vlp`: the registry is not a SECOND definition source, it is the ONLY one. There is no
// fields.vlp.json, all 48 rows are live, and the organizer routing properties have no map to
// generate them from. Those rows stay, and the file says so out loud rather than leaving a
// reader to infer it from what survived.
//
// This script PRINTS what it would do and changes nothing without --apply.

import { readFileSync, writeFileSync } from 'node:fs';
import { listAll } from '../adapters/hubspot/hs-lib.mjs';

const PATH = 'adapters/hubspot/fields.registry.json';
const APPLY = process.argv.includes('--apply');

const reg = JSON.parse(readFileSync(PATH, 'utf8'));
const all = await listAll('/crm/v3/properties/contacts');
if (all.length < 400) {
  console.error(`STOP — the portal returned ${all.length} contact properties. That read failed; it did not find an empty portal.`);
  process.exit(2);
}
const live = new Set(all.map((p) => p.name));
const liveGroups = new Set(all.map((p) => p.groupName));

// --- what each row's target does, derived per form ----------------------------------------
const byForm = new Map();
for (const p of reg.properties) {
  if (!byForm.has(p.form)) byForm.set(p.form, { rows: [], dead: [] });
  const b = byForm.get(p.form);
  b.rows.push(p);
  if (!live.has(p.hs_name)) b.dead.push(p.hs_name);
}
console.log(`${PATH}: ${reg.properties.length} row(s) across ${byForm.size} form(s), read against ${all.length} live contact propert(ies).`);
for (const [form, b] of byForm) {
  console.log(`  ${form.padEnd(9)} ${String(b.rows.length).padStart(4)} row(s), ${b.dead.length} whose target is NOT live on the portal`);
}

// --- and whether that form has a generated definition file whose rows ARE live -------------
const generated = new Map();
for (const f of ['433a', '433aoi', '433b', '433boi', '433f']) {
  const doc = JSON.parse(readFileSync(`adapters/hubspot/fields.${f}.json`, 'utf8'));
  const dead = doc.properties.filter((p) => !live.has(p.hs_name)).length;
  generated.set(doc.meta.form, { file: `fields.${f}.json`, rows: doc.properties.length, dead });
}
console.log('');
console.log('the generated per-form definition files, read against the same portal:');
for (const [form, g] of generated) console.log(`  ${form.padEnd(9)} ${g.file.padEnd(20)} ${String(g.rows).padStart(4)} row(s), ${g.dead} not live`);

// --- the disposition, DERIVED: a form goes when every one of its rows is dead --------------
const doomedForms = [...byForm].filter(([, b]) => b.dead.length === b.rows.length).map(([f]) => f);
const keptForms = [...byForm].filter(([, b]) => b.dead.length !== b.rows.length).map(([f]) => f);
console.log('');
console.log(`forms whose EVERY row is dead: ${doomedForms.join(', ') || '(none)'}`);
console.log(`forms with at least one live row: ${keptForms.join(', ') || '(none)'}`);
for (const [form, b] of byForm) {
  if (b.dead.length !== 0 && b.dead.length !== b.rows.length) {
    console.error(`STOP — form ${form} is PARTIALLY dead (${b.dead.length} of ${b.rows.length}). This script disposes of whole forms; a partial state needs reading, not a sweep.`);
    process.exit(2);
  }
}

const keptProps = reg.properties.filter((p) => keptForms.includes(p.form));
const claimedGroups = new Set(keptProps.map((p) => p.group));
const keptGroups = reg.groups.filter((g) => claimedGroups.has(g.name));
const droppedGroups = reg.groups.filter((g) => !claimedGroups.has(g.name));
console.log('');
console.log(`groups: ${reg.groups.length} declared, ${keptGroups.length} still claimed by a row in this file, ${droppedGroups.length} dropped`);
for (const g of droppedGroups) console.log(`  dropped ${g.name.padEnd(12)} ${liveGroups.has(g.name) ? 'IS a live group on the portal, and the generated file for its form declares it' : 'is NOT a live group on the portal at all'}`);

if (!APPLY) { console.log(''); console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0); }

// --- apply ---------------------------------------------------------------------------------
const out = {
  meta: {
    schema_version: '1.1',
    convention: reg.meta.convention,
    name_prefix: reg.meta.name_prefix,
    forms: keptForms,
    property_count: keptProps.length,
    _what_this_file_is: 'THE DEFINITION SOURCE FOR EVERY FORM THAT HAS NO GENERATED fields.<form>.json. That is now the organizer routing properties and nothing else. A form with a closed map gets its definitions from adapters/hubspot/gen-fields-from-map.mjs, which knows which keys the fill engine actually consumes; this file was authored before any of those maps existed.',
    _what_was_removed_and_why: '[D-19]. Every IRS-form row in this file named a property that DOES NOT EXIST on the portal, under a short abbreviated naming scheme from the pre-map intake sketch that nothing has ever provisioned. Each of those forms carries a generated definition file whose every row IS live. A row standing over nothing reads as coverage and is worse than an absent row, so they are gone rather than annotated. The removed set, its size and the read that established it are recorded in the [D-19] resolution in adapters/pdf/maps/_carried.cross-form.json.',
    _why_the_survivors_are_not_a_second_definition_source: 'They are the FIRST and ONLY one. There is no fields.vlp.json and there is no vlp map to generate one from: the organizer routing properties are not read off a printed page. Deleting them would delete the definitions themselves.',
    _the_assertion_that_stands_over_it: 'adapters/hubspot/assert-registry-targets.mjs — every row in this file must name a form with no generated definition file, must name a group this file declares, and (with --portal) must name a property that is live. A row can no longer outlive the thing it describes.',
  },
  groups: keptGroups,
  properties: keptProps,
  _count: {
    _derived_by: 'adapters/hubspot/assert-registry-targets.mjs re-derives every figure here on every run; a typed figure that disagrees is a STOP. Nothing in this block is maintained by hand.',
    properties: keptProps.length,
    groups: keptGroups.length,
    forms: keptForms.length,
    pii_rows: keptProps.filter((p) => p.pii === true).length,
    rows_with_options: keptProps.filter((p) => Array.isArray(p.options) && p.options.length > 0).length,
  },
};
writeFileSync(PATH, JSON.stringify(out, null, 2) + '\n');
console.log('');
console.log(`APPLIED — ${PATH} now holds ${out.properties.length} propert(ies) and ${out.groups.length} group(s), down from ${reg.properties.length} and ${reg.groups.length}.`);
console.log(`  removed ${reg.properties.length - out.properties.length} propert(ies) across ${doomedForms.length} form(s): ${doomedForms.join(', ')}`);
