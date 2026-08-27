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
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// TWO CROSSWALK SHAPES, AND THIS GUARD USED TO KNOW ONE — [D-16]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// This file threw a raw TypeError on 433-A(OIC) and 433-B(OIC) and a raw ENOENT on 433-A, so
// on THREE of five forms it had never examined a single row. It was invoked by hand, per form,
// and had only ever been pointed at the form it was written for. A guard nobody points at a
// form is indistinguishable from a guard that passes on it — [R-04] exactly — and
// adapters/pdf/assert-examined.mjs is what made the pairs visible as NOT REPORTED.
//
// THE TWO SHAPES, read off the artefacts rather than off a list of form names:
//
//   AUTHORED   key, consumed_by, printed_label, classification, hs_name, backbone_key,
//              backbone_label, why. The name is IN the artefact. crosswalk.433f.json.
//   DERIVED    key, entry, fact, backbone_key, type, fieldType, type_basis, pii. There is
//              NO hs_name — the name is derived downstream by adapters/hubspot/derive-names-
//              <form>.mjs and lives in the naming-derivation report. crosswalk.433aoi.json
//              and crosswalk.433boi.json.
//
// THE SHAPE IS DETECTED FROM THE ROWS, NEVER FROM THE FORM NAME. A per-form list here would be
// [R-06]'s prefix defect in a new place: it would assert only that no other form had worn this
// shape YET. A crosswalk MIXING the two shapes is a STOP, because a partial name column is the
// one state under which "no name used twice" silently checks a subset and reports a pass.
//
// WHAT EACH SHAPE CAN CARRY. Four of this file's assertions need a name or a classification the
// derived artefact does not contain. They are NOT skipped silently, and they are NOT faked by
// deriving the name a second time here — a second implementation of the derivation is the shape
// [D-11] committed and its own sweep caught. They are DECLARED, COUNTED and printed on every
// run, each naming what covers it instead. The derived path gains an assertion the authored one
// cannot make in exchange: the deriver's own type contract, which is where its rows carry their
// meaning.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A MISSING CROSSWALK FILE IS NOT AUTOMATICALLY A SKIP
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433-A has no crosswalk and never will: it IS the backbone every other form is read against.
// That one form is NOT APPLICABLE, and which form it is comes from the backbone PATH below
// rather than from a typed form name, so the two cannot drift into naming different forms. For
// ANY OTHER form a missing crosswalk is a STOP, because "the guard skipped because it could not
// read its input" is precisely the failure a guard exists to prevent.

import { existsSync, readFileSync } from 'fs';
import { ENGINE_EXTRA_INPUTS, keySpaceOf } from './classification-coverage.mjs';
import { examined } from '../pdf/examined.mjs';

const form = process.argv[2];
if (!form) {
  console.error('usage: node adapters/hubspot/validate-crosswalk.mjs <form>');
  process.exit(2);
}

const BACKBONE_PATH = 'adapters/hubspot/fields.433a.json';
const BACKBONE_FORM = /fields\.([^.]+)\.json$/.exec(BACKBONE_PATH)[1];

const xwPath = `adapters/hubspot/crosswalk.${form}.json`;
if (!existsSync(xwPath)) {
  if (form === BACKBONE_FORM) {
    console.log(`form ${form}: NOT APPLICABLE — ${form} has no crosswalk because it IS the backbone`);
    console.log(`  (${BACKBONE_PATH}), the artefact every other form is validated AGAINST. This is not a`);
    console.log('  zero and it is not a skip: there is no crosswalk here to be right or wrong about.');
    process.exit(0);
  }
  console.error(`STOP — ${xwPath} does not exist, and ${form} is not the backbone form (${BACKBONE_FORM}).`);
  console.error('  A guard that cannot read its input has not passed. Nothing was examined.');
  process.exit(2);
}

const xw = JSON.parse(readFileSync(xwPath, 'utf8'));
const map = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
const back = JSON.parse(readFileSync(BACKBONE_PATH, 'utf8'));

const backboneByName = new Map(back.properties.map((p) => [p.hs_name, p]));
const backboneByKey = new Map(back.properties.map((p) => [p.key, p]));

// ═══════════════════════════════════════════════════════════════════════════════════════
// A `backbone_key` MAY NAME A PROPERTY ANOTHER FORM CREATED — [R-06], and [D-16] found it
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Two 433-A(OIC) rows cite `433f_biz_name` and `433f_exp_rent`, and neither is in
// fields.433a.json. They are not broken: they are deliberate rebinds onto properties 433-F
// created, and the second of them IS the monthly-rent rebind [R-06] cites as its precedent.
// [R-06] rules that a form-specific prefix records which form CREATED a name, not which form
// owns it — so a row rebinding onto another form's property is doing exactly what that rule
// licenses, and a guard that reads one field file cannot see it. This guard reported both as
// "does not exist on the backbone" the moment [D-16] let it run on the form at all.
//
// THE BACKBONE WINS, AND THE OTHER FILES ARE CONSULTED ONLY FOR WHAT IT DOES NOT HOLD. That
// ordering is not a convenience. Five logical keys — bank_accounts, investment_accounts,
// digital_assets, vehicles, business_income_expense_route — exist in more than one field file
// under DIFFERENT hs_names, because they are the same words about DIFFERENT LEGAL PERSONS,
// which is the subject axis [R-06] exists to name. Four of the five are cited as a
// backbone_key today (by 433-F and 433-A(OIC)) and every one of those citations means 433-A's.
// Letting the backbone settle any key it holds makes all four unambiguous by construction.
//
// A key the backbone does NOT hold, appearing in two other field files under two names, is a
// STOP rather than a first-match. Nothing cites such a key today; the check is here so that
// the day one does, it is not resolved by directory order.
const OTHER_FIELD_FILES = ['433a', '433f', '433aoi', '433boi']
  .filter((f) => f !== form && f !== BACKBONE_FORM)
  .map((f) => `adapters/hubspot/fields.${f}.json`)
  .filter((p) => existsSync(p));

const elsewhereByKey = new Map();   // key -> [{ file, prop }]
for (const p of OTHER_FIELD_FILES) {
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  for (const prop of doc.properties || []) {
    if (backboneByKey.has(prop.key)) continue;          // the backbone has already settled it
    if (!elsewhereByKey.has(prop.key)) elsewhereByKey.set(prop.key, []);
    elsewhereByKey.get(prop.key).push({ file: p, prop });
  }
}

/** The property a `backbone_key` names, or a reason it names none. */
const resolveBackboneKey = (key) => {
  if (backboneByKey.has(key)) return { prop: backboneByKey.get(key), where: BACKBONE_PATH };
  const found = elsewhereByKey.get(key) || [];
  const names = new Set(found.map((f) => f.prop.hs_name));
  if (names.size > 1)
    return { ambiguous: found.map((f) => `${f.file} -> ${f.prop.hs_name}`) };
  if (found.length) return { prop: found[0].prop, where: found[0].file };
  return {};
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// AND THE SAME QUESTION ASKED OF A NAME — the half [D-16] left open
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [D-16]'s closing sentence is "A guard reading one field file cannot see a rebind [R-06]
// licenses." It built resolveBackboneKey() for the KEY side and left the NAME side reading
// backboneByName, which is fields.433a.json and nothing else. Two assertions ask a question
// of a name and both were therefore half-blind:
//
//   A6 says an `exact` row must name a property that already exists. Reading one file, a row
//      reusing a property 433-F created is reported as reusing nothing — a FALSE STOP on
//      exactly the act [R-06] licenses.
//   A6 also says a `new_shared` or `form_specific` row must NOT name one that already
//      exists. Reading one file, a row about to create a SECOND property under a name another
//      form already created passes — and HubSpot does not delete a property, so that is a
//      permanent duplicate in a portal with a hard ceiling. This is the direction that costs.
//   A7 says an option extension must target a real enumeration, and reads the same one file.
//
// THE UNIVERSE IS "NAMES THAT EXIST", AND A REUSE IS NOT AN EXISTENCE. A field file row that
// cites a `backbone_key` is REUSING a name some other form created; counting it as a creation
// would make 433-F look like a duplicator of the two properties 433-A(OIC) rebinds onto — the
// rebind read backwards. So the universe is the backbone in full, plus every row in every other
// provisioned field file that CREATES (cites no backbone_key). A name created in two
// non-backbone files is a STOP rather than a first match, for resolveBackboneKey()'s reason.
const creatorByName = new Map();   // hs_name -> [{ file, prop }] — creations only
for (const p of OTHER_FIELD_FILES) {
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  for (const prop of doc.properties || []) {
    if (prop.backbone_key) continue;                     // a reuse, not a creation
    if (backboneByName.has(prop.hs_name)) continue;      // the backbone has already settled it
    if (!creatorByName.has(prop.hs_name)) creatorByName.set(prop.hs_name, []);
    creatorByName.get(prop.hs_name).push({ file: p, prop });
  }
}

/** The property an hs_name already names, and where, or a reason it names none. */
const resolveName = (name) => {
  if (backboneByName.has(name)) return { prop: backboneByName.get(name), where: BACKBONE_PATH };
  const found = creatorByName.get(name) || [];
  if (found.length > 1) return { ambiguous: found.map((f) => `${f.file} -> ${f.prop.key}`) };
  if (found.length) return { prop: found[0].prop, where: found[0].file };
  return {};
};

// A GROUP'S INPUT KEY IS ITS `array`, ITS `source`, OR THE GROUP'S OWN NAME — and the third
// fallback is not a guess. It is what the fill engines actually do, read off each of them:
//   fill-433a.mjs    data[def.source || gName]
//   fill-433aoi.mjs  data[def.source || gName]
//   fill-433boi.mjs  def.array || def.source || g
//   fill-433b.mjs    input(g)         <- the group NAME only; declares neither array nor source
//   fill-433f.mjs    data[def.array]  <- declares `array` on all eight of its groups
// Without the group-name fallback all eight of 433-B's groups collapsed to a single
// `undefined`, which this file then reported as "MISSING binding for engine input: undefined":
// eight real engine inputs missing from the key space, and one input that does not exist added
// to it — on a form whose crosswalk is empty, so nothing else contradicted it.
// THE ENGINE INPUTS, FROM THE ONE SELECTOR. Until this commit this file derived its own key
// space, thirty lines of it, and the two derivations were EACH BLIND WHERE THE OTHER SAW.
// This one read `special.composite_name_address` and `split`, which keySpaceOf() did not:
// SEVEN keys on 433-A and FOUR on 433-F. keySpaceOf() reads a mirrored lone tick, which this
// one did not: THREE on 433-D, and it was this file that rejected them as "EXTRA binding not
// consumed by the engine" when the 433-D crosswalk first ran against it.
//
// classification-coverage.mjs was created to end exactly this, and its own header says why —
// "A REIMPLEMENTATION IS A NEW INSTRUMENT AND IS NOT EVIDENCE ABOUT THE OLD ONE". It ended it
// for the two derive-names tools and left the reimplementation standing in the file that runs
// at GATE STEP 3, which is the one place a wrong key space stops a form from being filed.
//
// Every filter that lived here is now in the selector with the reason it was written for: the
// `split` prose filter, the `_binds` row-level exclusion cross-checked against `groups`, the
// `check_here` intersection of what both engines read, the `slots` filter on groups, and the
// subject route — a dependent cell reaches one of TWO properties, so its printed key is not an
// input key and the two branch keys and the discriminator are.
const { keySpace: engineInputMap, problems: keySpaceProblems } = keySpaceOf(map);
if (keySpaceProblems.length) {
  console.error(`STOP — the key space for ${form} could not be derived:`);
  keySpaceProblems.forEach((p) => console.error(`  ${p}`));
  process.exit(2);
}
for (const k of (ENGINE_EXTRA_INPUTS[form] || [])) if (!engineInputMap.has(k)) engineInputMap.set(k, 'engine');
const engineInputs = new Set(engineInputMap.keys());

const rows = xw.bindings;
if (!Array.isArray(rows)) {
  console.error(`STOP — ${xwPath} carries no \`bindings\` array. Nothing was examined.`);
  process.exit(2);
}
const keys = new Set(rows.map((r) => r.key));
const errs = [];

// ── which shape is this, and is it ONE shape? ────────────────────────────────────────────────
const named = rows.filter((r) => r.hs_name !== undefined).length;
const classed = rows.filter((r) => r.classification !== undefined).length;
if (rows.length && named !== 0 && named !== rows.length) {
  console.error(`STOP — MIXED CROSSWALK SHAPE: ${named} of ${rows.length} row(s) carry hs_name.`);
  console.error('  A partial name column is the one state under which "no hs_name used twice" checks a');
  console.error('  subset and reports a pass. Neither shape is assumed; nothing was examined.');
  process.exit(2);
}
if (rows.length && classed !== 0 && classed !== rows.length) {
  console.error(`STOP — MIXED CROSSWALK SHAPE: ${classed} of ${rows.length} row(s) carry classification.`);
  console.error('  Same reason as hs_name: a partial classification column makes the reuse check vacuous');
  console.error('  on the rows that lack it. Nothing was examined.');
  process.exit(2);
}
// An EMPTY crosswalk carries no shape evidence at all. It is read as AUTHORED, which is the
// stricter of the two, and the fact that the shape was ASSUMED rather than read is printed —
// because "this file has the authored shape" and "this file has no rows to tell" are different
// facts, and only one of them is a reading.
const shapeEvidence = rows.length === 0 ? 'ASSUMED — no rows to read a shape from' : 'read from the rows';
const AUTHORED = rows.length === 0 ? true : named === rows.length;
const SHAPE = AUTHORED ? 'authored' : 'derived';

// Every assertion this file makes, what it needs, and what it examined. A gap is DECLARED with
// its reason and COUNTED; it is never a silent skip and never a bare pass.
const ran = [];
const gaps = [];
const assertion = (id, what, n, universe) => {
  ran.push({ id, what, n });
  examined('validate-crosswalk', form, n, universe);
};
const gap = (id, what, why, covered) => gaps.push({ id, what, why, covered });

// --- A1. exactly one row per engine input ----------------------------------------------------
// Both directions matter. A missing row is a blank cell nobody asked about; an extra row is a
// property provisioned for a key nothing reads, which looks identical in the CRM to a property
// somebody forgot to fill. BOTH SHAPES CARRY THIS — it needs only `key`.
for (const k of engineInputs) if (!keys.has(k)) errs.push(`MISSING binding for engine input: ${k}`);
for (const r of rows) if (!engineInputs.has(r.key)) errs.push(`EXTRA binding not consumed by the engine: ${r.key}`);
assertion('A1', 'every engine input bound, and no binding the engine does not consume', engineInputs.size, 'engine-input-keys');

// --- A2. no key used twice --------------------------------------------------------------------
const seenKey = new Set();
for (const r of rows) {
  if (seenKey.has(r.key)) errs.push(`duplicate key: ${r.key}`);
  seenKey.add(r.key);
}
assertion('A2', 'no engine input bound twice', rows.length, 'crosswalk-rows');

// --- A3. a declared backbone_key resolves ------------------------------------------------------
// BOTH SHAPES CARRY THIS: the derived rows carry `backbone_key` too, null where the fact is new.
// It is the reuse question asked of the column the derived shape actually has.
let bkChecked = 0;
for (const r of rows) {
  if (!r.backbone_key) continue;
  bkChecked++;
  const hit = resolveBackboneKey(r.backbone_key);
  if (hit.ambiguous)
    errs.push(`${r.key}: backbone_key ${r.backbone_key} is not on the backbone and names DIFFERENT properties in two field files — ${hit.ambiguous.join(' | ')}. Resolving it by file order would pick one legal person's fact for another's.`);
  else if (!hit.prop)
    errs.push(`${r.key}: backbone_key ${r.backbone_key} exists in no provisioned field file`);
  else if (r.hs_name !== undefined && hit.prop.hs_name !== r.hs_name)
    errs.push(`${r.key}: backbone_key ${r.backbone_key} feeds ${hit.prop.hs_name}, not ${r.hs_name}`);
}
assertion('A3', 'every declared backbone_key resolves to a provisioned property', bkChecked, 'rows-declaring-a-backbone-key');

if (AUTHORED) {
  // --- A4. no name used twice -----------------------------------------------------------------
  const seenName = new Map();
  for (const r of rows) {
    if (seenName.has(r.hs_name)) errs.push(`duplicate hs_name: ${r.hs_name} (from ${seenName.get(r.hs_name)} and ${r.key}) — two inputs would overwrite each other in the CRM`);
    seenName.set(r.hs_name, r.key);
  }
  assertion('A4', 'no hs_name used twice', rows.length, 'named-rows');

  // --- A5. names are permanent, so they are checked before they exist -------------------------
  for (const r of rows) {
    if (typeof r.hs_name !== 'string') { errs.push(`${r.key}: hs_name is not a string`); continue; }
    if (r.hs_name !== r.hs_name.toLowerCase()) errs.push(`not lowercase: ${r.hs_name} — HubSpot lowercases silently and the crosswalk would disagree with the portal forever`);
    if (!/^[a-z][a-z0-9_]*$/.test(r.hs_name)) errs.push(`illegal HubSpot property name: ${r.hs_name}`);
    if (r.hs_name.length > 100) errs.push(`name over 100 chars: ${r.hs_name}`);
    const want = r.classification === 'form_specific' ? `irs${form}_` : 'irs433_';
    if (!r.hs_name.startsWith(want)) errs.push(`${r.key}: classed ${r.classification} so the name must start ${want}, got ${r.hs_name}`);
  }
  assertion('A5', 'every name legal, lowercase, under 100 chars, prefixed to match its classification', rows.length, 'named-rows');

  // --- A6. reuse before creating, enforced -----------------------------------------------------
  for (const r of rows) {
    const already = resolveName(r.hs_name);
    if (already.ambiguous) errs.push(`${r.key}: ${r.hs_name} is CREATED in two field files — ${already.ambiguous.join(' | ')}. Two forms creating one name is a duplicate nobody can resolve by file order.`);
    if (r.classification === 'exact') {
      if (!already.prop) errs.push(`${r.key}: classed exact but ${r.hs_name} exists in no provisioned field file`);
      // The owning file owns the type. Restating it here is how the two drift.
      if (r.type || r.fieldType) errs.push(`${r.key}: an exact row must not restate a type — ${already.where || 'the backbone'} owns it`);
    } else {
      if (already.prop) errs.push(`${r.key}: classed ${r.classification} but ${r.hs_name} ALREADY EXISTS in ${already.where} — reuse it. HubSpot does not delete a property.`);
      if (!r.type || !r.fieldType) errs.push(`${r.key}: a ${r.classification} row must declare type + fieldType`);
      if (!r.why) errs.push(`${r.key}: no reason given for creating a permanent name`);
    }
  }
  assertion('A6', 'every exact row reuses a name that exists in some provisioned field file; every new row names one that exists nowhere and declares a type and a reason', rows.length, 'classified-rows');

  // --- A7. option extensions must be additive, on a property that can take options -------------
  let optAdds = 0;
  for (const e of xw.option_extensions || []) {
    const hit = resolveName(e.hs_name);
    if (hit.ambiguous) { errs.push(`option_extension targets ${e.hs_name}, which is created in two field files — ${hit.ambiguous.join(' | ')}`); continue; }
    const p = hit.prop;
    if (!p) { errs.push(`option_extension targets unknown property ${e.hs_name} — it exists in no provisioned field file`); continue; }
    if (p.type !== 'enumeration') { errs.push(`option_extension targets non-enumeration ${e.hs_name} (${p.type})`); continue; }
    for (const add of e.add) {
      optAdds++;
      if ((p.options || []).some((o) => String(o.value) === String(add.value)))
        errs.push(`${e.hs_name}: option ${add.value} already declared on the backbone`);
    }
  }
  assertion('A7', 'every option extension is additive and targets an enumeration', optAdds, 'option-values-added');

  // --- A8. the declared counts are part of the artifact, so they are checked too ---------------
  const c = { exact: 0, new_shared: 0, form_specific: 0 };
  for (const r of rows) {
    if (!(r.classification in c)) { errs.push(`${r.key}: unknown classification ${r.classification}`); continue; }
    c[r.classification]++;
  }
  const m = (xw.meta && xw.meta.counts) || {};
  let counted = 0;
  const check = (name, want, got) => { counted++; if (want !== got) errs.push(`meta.counts.${name} says ${want}, rows say ${got}`); };
  check('total_input_keys', m.total_input_keys, rows.length);
  check('exact', m.exact, c.exact);
  check('new_shared', m.new_shared, c.new_shared);
  check('form_specific', m.form_specific, c.form_specific);
  check('to_provision', m.to_provision, c.new_shared + c.form_specific);
  check('option_extensions', m.option_extensions, (xw.option_extensions || []).length);
  assertion('A8', 'every declared count in meta.counts matches the rows', counted, 'declared-counts');

  console.log(`form ${form}: ${engineInputs.size} engine input(s), ${rows.length} crosswalk row(s) — AUTHORED shape (${shapeEvidence})`);
  console.log(`  exact ${c.exact} (reused)   new shared ${c.new_shared}   ${form}-only ${c.form_specific}   -> to provision ${c.new_shared + c.form_specific}`);
  console.log(`  option extensions on existing properties: ${(xw.option_extensions || []).length}`);
  console.log(`  rows flagged arguable: ${rows.filter((r) => r.arguable).length}, collected into ${(xw.arguable || []).length} entr(ies) for Principal`);
} else {
  // ── the derived path ─────────────────────────────────────────────────────────────────────
  // What it CAN assert: the deriver's own contract. Every row it wrote must declare the type it
  // will provision, the fieldType, the basis those were chosen on, whether the fact is PII, and
  // the classification entry it came from. A row missing one of the five is a property that
  // would be created permanently with a shape nobody decided.
  let typed = 0;
  for (const r of rows) {
    typed++;
    if (!r.type) errs.push(`${r.key}: derived row declares no type`);
    if (!r.fieldType) errs.push(`${r.key}: derived row declares no fieldType`);
    if (!r.type_basis) errs.push(`${r.key}: derived row declares no type_basis — the type was chosen on no stated ground`);
    if (typeof r.pii !== 'boolean') errs.push(`${r.key}: derived row declares no pii boolean`);
    if (!r.entry) errs.push(`${r.key}: derived row cites no classification entry`);
  }
  assertion('A9', 'every derived row declares type, fieldType, type_basis, pii and its classification entry', typed, 'derived-rows');

  // meta.counts on the derived shape has its OWN vocabulary, and one of the two forms carrying
  // this shape declares none at all. Only what IS declared is checked, and the number checked is
  // reported — so a form declaring nothing shows here as a zero rather than as a silent pass.
  const m = (xw.meta && xw.meta.counts) || {};
  let counted = 0;
  if (m.total_input_keys !== undefined) {
    counted++;
    if (m.total_input_keys !== rows.length) errs.push(`meta.counts.total_input_keys says ${m.total_input_keys}, rows say ${rows.length}`);
  }
  if (m.to_provision !== undefined) {
    counted++;
    const toProvision = rows.filter((r) => !r.backbone_key).length;
    if (m.to_provision !== toProvision) errs.push(`meta.counts.to_provision says ${m.to_provision}, rows with no backbone_key say ${toProvision}`);
  }
  assertion('A10', 'every declared count in meta.counts matches the rows', counted, 'declared-counts');

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // A4, A5, A6, A7 — THE FOUR [D-16] DECLARED UNASKABLE ON THIS SHAPE, AND WHAT CHANGED
  // ═══════════════════════════════════════════════════════════════════════════════════════
  //
  // [D-16] weighed two options and took the second: split by shape and drop the three name
  // assertions plus A7, because the derived crosswalk carries no hs_name and no classification.
  // Both statements are still true OF THE CROSSWALK. What the item did not consider is a THIRD
  // artefact: adapters/hubspot/fields.<form>.json, which the deriver itself writes, which is
  // machine-readable JSON rather than the naming-derivation .md the item rejected as option 1,
  // which carries hs_name, scope, backbone_key, type, fieldType and options on every row, and
  // which declares its generator and is checked by generator-guard.mjs ([R-19]).
  //
  // READING IT IS NOT A SECOND DERIVATION. [D-16]'s objection to deriving the name here was
  // that it would be "a second implementation of the derivation — the shape [D-11] committed".
  // That objection is exactly right and it does not apply to reading the derivation's OUTPUT.
  // No name is computed below; every one is read.
  //
  // AND THE STALENESS OBJECTION IS ANSWERED BY MAKING IT LOUD. The field file could lag the
  // crosswalk. So the join is asserted TOTAL IN BOTH DIRECTIONS before any of the four runs: a
  // crosswalk row with no property, or a property with no crosswalk row, is a STOP naming the
  // regeneration command. A partial join is the one state under which "no name used twice"
  // checks a subset and reports a pass — [D-16]'s own words about the mixed-shape crosswalk,
  // one artefact along.
  const FIELDS = `adapters/hubspot/fields.${form}.json`;
  if (!existsSync(FIELDS)) {
    // A form derived but never provisioned. Still four gaps, and now for a reason that names
    // the missing artefact rather than the missing column.
    for (const [id, what] of [['A4', 'no hs_name used twice'], ['A5', 'names legal, lowercase, under 100 chars, prefix matching classification'],
      ['A6', 'reuse before creating'], ['A7', 'option sets additive against the property they reuse']])
      gap(id, what, `${FIELDS} is not in this tree, so the names this form will provision do not exist yet in any artefact. Run adapters/hubspot/derive-names-${form}.mjs.`,
        'nothing — this is a real gap, not a covered one, and it is named as such.');
  } else {
    const ff = JSON.parse(readFileSync(FIELDS, 'utf8'));
    const props = ff.properties || [];
    const propByKey = new Map(props.map((p) => [p.key, p]));
    const rowKeys = new Set(rows.map((r) => r.key));
    const noProp = rows.filter((r) => !propByKey.has(r.key)).map((r) => r.key);
    const noRow = props.filter((p) => !rowKeys.has(p.key)).map((p) => p.key);
    if (noProp.length || noRow.length)
      errs.push(`${FIELDS} and the crosswalk do not join: ${noProp.length} crosswalk row(s) have no property (${noProp.slice(0, 5).join(', ')}${noProp.length > 5 ? ', …' : ''}) ` +
        `and ${noRow.length} propert(ies) have no crosswalk row (${noRow.slice(0, 5).join(', ')}${noRow.length > 5 ? ', …' : ''}). ` +
        `The field file is stale relative to the crosswalk; re-run adapters/hubspot/derive-names-${form}.mjs. Validating it in this state would check a subset and report a pass.`);

    // --- A4. no hs_name used twice ------------------------------------------------------------
    const seenName = new Map();
    for (const p of props) {
      if (seenName.has(p.hs_name)) errs.push(`${p.key}: hs_name ${p.hs_name} is already used by ${seenName.get(p.hs_name)} — one property cannot hold two facts about one filer`);
      else seenName.set(p.hs_name, p.key);
    }
    assertion('A4', 'no hs_name used twice', props.length, 'named-rows');

    // --- A5. legality and prefix --------------------------------------------------------------
    // THE PREFIX HALF IS ASKED ONLY OF A CREATION, and that is [R-06] rather than a softening.
    // A prefix records which form CREATED a name; a row REUSING one keeps the creator's prefix,
    // so demanding this form's prefix of a rebind would forbid the rebind [R-06] licenses.
    for (const p of props) {
      if (p.hs_name !== p.hs_name.toLowerCase()) errs.push(`not lowercase: ${p.hs_name} — HubSpot lowercases silently and the registry would disagree with the portal forever`);
      if (!/^[a-z][a-z0-9_]*$/.test(p.hs_name)) errs.push(`illegal HubSpot property name: ${p.hs_name}`);
      if (p.hs_name.length > 100) errs.push(`name over 100 chars: ${p.hs_name}`);
      if (p.backbone_key) continue;
      const want = p.scope === 'form-specific' ? `irs${form}_` : 'irs433_';
      if (!p.hs_name.startsWith(want)) errs.push(`${p.key}: scope ${p.scope} so a name this form CREATES must start ${want}, got ${p.hs_name}`);
    }
    assertion('A5', 'every name legal, lowercase, under 100 chars, and every name this form CREATES prefixed to match its scope', props.length, 'named-rows');

    // --- A6. reuse before creating -------------------------------------------------------------
    // Asked through the same resolveName() the authored path uses, so the two shapes cannot
    // drift into two answers about one portal.
    let creates = 0, reuses = 0;
    for (const p of props) {
      const already = resolveName(p.hs_name);
      if (already.ambiguous) { errs.push(`${p.key}: ${p.hs_name} is CREATED in two field files — ${already.ambiguous.join(' | ')}`); continue; }
      if (p.backbone_key) {
        reuses++;
        if (!already.prop) errs.push(`${p.key}: cites backbone_key ${p.backbone_key} and reuses ${p.hs_name}, which exists in no provisioned field file`);
        else if (already.prop.hs_name !== p.hs_name) errs.push(`${p.key}: reuses ${p.hs_name} but ${p.backbone_key} names ${already.prop.hs_name}`);
      } else {
        creates++;
        if (already.prop) errs.push(`${p.key}: creates ${p.hs_name}, which ALREADY EXISTS in ${already.where} — reuse it. HubSpot does not delete a property and this portal's ceiling is hard.`);
        if (!p.type || !p.fieldType) errs.push(`${p.key}: a created property must declare type + fieldType`);
        if (!p.type_basis) errs.push(`${p.key}: a created property must declare the ground its type was chosen on`);
      }
    }
    assertion('A6', `every reuse names a property that exists (${reuses}) and every creation names one that does not (${creates})`, props.length, 'classified-rows');

    // --- A7. option sets ------------------------------------------------------------------------
    // The derived shape has no `option_extensions` key, and [D-16] read that as the assertion
    // having no subject. It has one: a REUSED property carrying options is an option extension
    // by another spelling, and the same two questions apply — is the target an enumeration, and
    // is every value additive against what the owning file already declares?
    let optValues = 0;
    for (const p of props) {
      if (!p.options) continue;
      if (p.type !== 'enumeration') { errs.push(`${p.key}: declares options on a ${p.type} property, which cannot take them`); continue; }
      optValues += p.options.length;
      if (!p.backbone_key) continue;
      const owner = resolveName(p.hs_name).prop;
      if (!owner || !owner.options) continue;
      const have = new Set(owner.options.map((o) => String(o.value)));
      const removed = owner.options.filter((o) => !p.options.some((x) => String(x.value) === String(o.value)));
      if (removed.length) errs.push(`${p.key}: reuses ${p.hs_name} and DROPS option(s) ${removed.map((o) => o.value).join(', ')} the owning file declares. An extension is additive; a removal breaks every record already carrying the value.`);
    }
    assertion('A7', 'every option set sits on an enumeration, and every reused property keeps every option value its owner declares', optValues, 'option-values');
  }

  console.log(`form ${form}: ${engineInputs.size} engine input(s), ${rows.length} crosswalk row(s) — DERIVED shape (${shapeEvidence})`);
  console.log(`  rows citing a backbone_key: ${bkChecked}   rows citing none (to provision): ${rows.length - bkChecked}`);
}

// ── what ran, and what could not ─────────────────────────────────────────────────────────────
console.log(`  ASSERTIONS RUN ${ran.length}:`);
for (const a of ran) console.log(`    [${a.id}] ${String(a.n).padStart(4)} examined — ${a.what}`);
if (gaps.length) {
  console.log(`  ASSERTIONS THIS SHAPE CANNOT CARRY ${gaps.length}, declared and counted rather than skipped:`);
  for (const g of gaps) {
    console.log(`    [${g.id}] ${g.what}`);
    console.log(`          why not here: ${g.why}`);
    console.log(`          covered instead by: ${g.covered}`);
  }
  console.log(`  [D-16] is the carried item these ${gaps.length} declaration(s) belong to.`);
} else {
  console.log('  ASSERTIONS THIS SHAPE CANNOT CARRY 0 — every assertion this file makes ran on this form.');
}
const totalExamined = ran.reduce((s, a) => s + a.n, 0);
// THE SENTENCE CARRIES THE FINDING COUNT — [R-11], and success-sweep.mjs required it. An
// earlier draft ended "...rather than printing OK", which is a success word printed BEFORE the
// error jump below: a failing run reached it and the last thing it said was that nothing was
// wrong. The condition this reports on is "did this guard look at anything", and the condition
// the reader needs beside it is "did it find anything", so both are in the line.
if (totalExamined === 0) {
  console.log(`  ZERO EXAMINED ACROSS EVERY ASSERTION on ${form}, with ${errs.length} problem(s) found.`);
  console.log('  A guard that examined nothing has not been tested on this form, whatever its exit code');
  console.log('  turns out to be — [R-04]. The verdict is below; this line is the size of the input.');
}

if (errs.length) {
  console.error(`\n${errs.length} problem(s) — the crosswalk is not usable:`);
  errs.forEach((e) => console.error(`  ${e}`));
  process.exit(2);
}
console.log(`OK — ${SHAPE} shape, ${ran.length} assertion(s) run over ${totalExamined} examined item(s), ${gaps.length} declared gap(s).`);
