// Check one form's crosswalk against its map and against the shared backbone.
//
//   node adapters/hubspot/validate-crosswalk.mjs <form>
//
// WHY THIS IS A SCRIPT AND NOT A READ-THROUGH
// -------------------------------------------
// A crosswalk fails in ways reading does not catch. A key the engine consumes and the
// crosswalk forgot is a cell that stays blank on a filed form with nothing reporting it. A
// row classed "new" whose name already exists on the backbone is the duplication the reset
// existed to end, re-introduced by hand. A row classed "exact" pointing at a property that
// does not exist is a fetch that returns nothing. All three look fine on the page.
//
// Five more forms follow this one, so the check is a command rather than a habit.
//
// THE ENGINE'S INPUT SURFACE IS NOT ALL IN THE MAP. `map`, `split`, `checkboxes` and the
// group `array` names are declared there, but the fill engine ALSO reads a handful of inputs
// the map only names targets for — the allowable-standard inputs and the checkbox flags it
// resolves through its own `input()` helper. Those are listed per form below, from reading
// the engine, because a crosswalk that covers only the map would silently omit them and the
// gate would not notice: an unticked checkbox and an unasked question print identically.

import { readFileSync } from 'fs';
import { ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';

const form = process.argv[2];
if (!form) {
  console.error('usage: node adapters/hubspot/validate-crosswalk.mjs <form>');
  process.exit(2);
}

// Inputs the fill engine reads that the map does not name as input keys — sourced from the
// engine, per form. MOVED to adapters/hubspot/classification-coverage.mjs and imported back,
// because adapters/pdf/blanket-audit.mjs [K-09] counts the same key space to prove [S-22]'s
// forward reference to this file, and a second copy of the table there would be the
// parallel-list defect guard-sweep.mjs exists to enumerate. The first draft of that counter
// did rebuild the key space without these five and reported five live bindings as
// unconsumable — the list disagreeing with its copy, on its first run.

const xw = JSON.parse(readFileSync(`adapters/hubspot/crosswalk.${form}.json`, 'utf8'));
const map = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
const back = JSON.parse(readFileSync('adapters/hubspot/fields.433a.json', 'utf8'));

const backboneByName = new Map(back.properties.map((p) => [p.hs_name, p]));
const backboneByKey = new Map(back.properties.map((p) => [p.key, p]));

const engineInputs = new Set([
  ...(map.special?.composite_name_address?.from || []),
  ...Object.keys(map.map || {}),
  // `split` carries prose keys alongside its definitions (`_why`, and on 433-F a note on why
  // the two Section C keys are scalars rather than row columns). The fill engines skip any
  // entry without a `parts` array, so those keys are not engine inputs and a crosswalk row for
  // one would be a property provisioned for a comment. Filtered the same way the engine skips
  // them, rather than by name, so a third prose key needs no edit here.
  ...Object.entries(map.split || {})
    .filter(([, v]) => v && typeof v === 'object' && Array.isArray(v.parts))
    .map(([k]) => k),
  ...Object.entries(map.checkboxes || {})
    .filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v) && !v.index)
    .map(([k]) => k),
  ...Object.values(map.groups || {})
    .filter((d) => d && Array.isArray(d.slots))
    .map((d) => d.array || d.source),
  ...(ENGINE_EXTRA_INPUTS[form] || []),
]);

const rows = xw.bindings;
const keys = new Set(rows.map((r) => r.key));
const errs = [];

// --- 1. exactly one row per engine input ----------------------------------------------------
// Both directions matter. A missing row is a blank cell nobody asked about; an extra row is a
// property provisioned for a key nothing reads, which looks identical in the CRM to a property
// somebody forgot to fill.
for (const k of engineInputs) if (!keys.has(k)) errs.push(`MISSING binding for engine input: ${k}`);
for (const r of rows) if (!engineInputs.has(r.key)) errs.push(`EXTRA binding not consumed by the engine: ${r.key}`);

// --- 2. no key and no name used twice -------------------------------------------------------
const seenKey = new Set();
const seenName = new Map();
for (const r of rows) {
  if (seenKey.has(r.key)) errs.push(`duplicate key: ${r.key}`);
  seenKey.add(r.key);
  if (seenName.has(r.hs_name)) errs.push(`duplicate hs_name: ${r.hs_name} (from ${seenName.get(r.hs_name)} and ${r.key}) — two inputs would overwrite each other in the CRM`);
  seenName.set(r.hs_name, r.key);
}

// --- 3. names are permanent, so they are checked before they exist --------------------------
for (const r of rows) {
  if (r.hs_name !== r.hs_name.toLowerCase()) errs.push(`not lowercase: ${r.hs_name} — HubSpot lowercases silently and the crosswalk would disagree with the portal forever`);
  if (!/^[a-z][a-z0-9_]*$/.test(r.hs_name)) errs.push(`illegal HubSpot property name: ${r.hs_name}`);
  if (r.hs_name.length > 100) errs.push(`name over 100 chars: ${r.hs_name}`);
  const want = r.classification === 'form_specific' ? `irs${form}_` : 'irs433_';
  if (!r.hs_name.startsWith(want)) errs.push(`${r.key}: classed ${r.classification} so the name must start ${want}, got ${r.hs_name}`);
}

// --- 4. reuse before creating, enforced ------------------------------------------------------
for (const r of rows) {
  if (r.classification === 'exact') {
    if (!backboneByName.has(r.hs_name)) errs.push(`${r.key}: classed exact but ${r.hs_name} is not on the backbone`);
    if (r.backbone_key) {
      const b = backboneByKey.get(r.backbone_key);
      if (!b) errs.push(`${r.key}: backbone_key ${r.backbone_key} does not exist`);
      else if (b.hs_name !== r.hs_name) errs.push(`${r.key}: backbone_key ${r.backbone_key} feeds ${b.hs_name}, not ${r.hs_name}`);
    }
    // The backbone owns the type. Restating it here is how the two drift.
    if (r.type || r.fieldType) errs.push(`${r.key}: an exact row must not restate a type — the backbone owns it`);
  } else {
    if (backboneByName.has(r.hs_name)) errs.push(`${r.key}: classed ${r.classification} but ${r.hs_name} ALREADY EXISTS on the backbone — reuse it`);
    if (!r.type || !r.fieldType) errs.push(`${r.key}: a ${r.classification} row must declare type + fieldType`);
    if (!r.why) errs.push(`${r.key}: no reason given for creating a permanent name`);
  }
}

// --- 5. option extensions must be additive, on a property that can take options --------------
for (const e of xw.option_extensions || []) {
  const p = backboneByName.get(e.hs_name);
  if (!p) { errs.push(`option_extension targets unknown property ${e.hs_name}`); continue; }
  if (p.type !== 'enumeration') { errs.push(`option_extension targets non-enumeration ${e.hs_name} (${p.type})`); continue; }
  for (const add of e.add) {
    if ((p.options || []).some((o) => String(o.value) === String(add.value)))
      errs.push(`${e.hs_name}: option ${add.value} already declared on the backbone`);
  }
}

// --- 6. the declared counts are part of the artifact, so they are checked too ----------------
const c = { exact: 0, new_shared: 0, form_specific: 0 };
for (const r of rows) {
  if (!(r.classification in c)) { errs.push(`${r.key}: unknown classification ${r.classification}`); continue; }
  c[r.classification]++;
}
const m = xw.meta.counts || {};
const check = (name, want, got) => { if (want !== got) errs.push(`meta.counts.${name} says ${want}, rows say ${got}`); };
check('total_input_keys', m.total_input_keys, rows.length);
check('exact', m.exact, c.exact);
check('new_shared', m.new_shared, c.new_shared);
check('form_specific', m.form_specific, c.form_specific);
check('to_provision', m.to_provision, c.new_shared + c.form_specific);
check('option_extensions', m.option_extensions, (xw.option_extensions || []).length);

console.log(`form ${form}: ${engineInputs.size} engine input(s), ${rows.length} crosswalk row(s)`);
console.log(`  exact ${c.exact} (reused)   new shared ${c.new_shared}   ${form}-only ${c.form_specific}   -> to provision ${c.new_shared + c.form_specific}`);
console.log(`  option extensions on existing properties: ${(xw.option_extensions || []).length}`);
console.log(`  rows flagged arguable: ${rows.filter((r) => r.arguable).length}, collected into ${(xw.arguable || []).length} entr(ies) for Principal`);

if (errs.length) {
  console.error(`\n${errs.length} problem(s) — the crosswalk is not usable:`);
  errs.forEach((e) => console.error(`  ${e}`));
  process.exit(2);
}
console.log('OK — covers exactly the engine inputs, reuses every fact the backbone already has, and creates no name twice.');
