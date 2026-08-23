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
import { ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';
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
  // `checkboxes` also carries DECLARATIONS beside its targets. `_binds` names which group and
  // canonical column each row-level construct is for — read by fill-433f.mjs to pair a flag
  // array with its group, and by assert-row-shape-spec [A2] to answer whether the map binds a
  // column at all. It is not a widget target and no record supplies a value for it, so a
  // crosswalk row for it would be a property provisioned for a declaration.
  //
  // Excluded BY SHAPE and by the `_` convention this repo uses throughout for prose and
  // declarations, the same way the `split` filter above excludes its own prose keys — never by
  // name, so a second declaration needs no edit here.
    .filter(([k, v]) => !k.startsWith('_')
      && v && typeof v === 'object' && !Array.isArray(v) && !v.index)
    .map(([k]) => k),
  ...Object.entries(map.groups || {})
    .filter(([k, d]) => !k.startsWith('_') && d && Array.isArray(d.slots))
    .map(([k, d]) => d.array || d.source || k),
  // `check_here` — A LONE BOX WITH NO COUNTERPART CELL, and a fifth engine-input block this
  // file did not know about. 433-A(OIC) declares 17 and 433-B(OIC) 10; the other three forms
  // declare none, which is exactly why its absence went unnoticed on the one form this guard
  // used to run on. fill-433aoi.mjs:195 and fill-433boi.mjs:186 both iterate it and read
  // `data[key]`, so every one of those 27 keys IS an engine input.
  //
  // THE TWO ENGINES FILTER IT DIFFERENTLY — fill-433aoi.mjs requires a string `target`,
  // fill-433boi.mjs skips the `_` prefix — so the filter here is the INTERSECTION of the two,
  // which is the only set both engines agree they read. Widening it to either engine's own
  // rule alone would put a key in this space that the other engine never reads.
  ...Object.entries(map.check_here || {})
    .filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object' && typeof v.target === 'string')
    .map(([k]) => k),
  ...(ENGINE_EXTRA_INPUTS[form] || []),
]);

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
    if (r.classification === 'exact') {
      if (!backboneByName.has(r.hs_name)) errs.push(`${r.key}: classed exact but ${r.hs_name} is not on the backbone`);
      // The backbone owns the type. Restating it here is how the two drift.
      if (r.type || r.fieldType) errs.push(`${r.key}: an exact row must not restate a type — the backbone owns it`);
    } else {
      if (backboneByName.has(r.hs_name)) errs.push(`${r.key}: classed ${r.classification} but ${r.hs_name} ALREADY EXISTS on the backbone — reuse it`);
      if (!r.type || !r.fieldType) errs.push(`${r.key}: a ${r.classification} row must declare type + fieldType`);
      if (!r.why) errs.push(`${r.key}: no reason given for creating a permanent name`);
    }
  }
  assertion('A6', 'every exact row reuses a backbone name; every new row declares a type and a reason', rows.length, 'classified-rows');

  // --- A7. option extensions must be additive, on a property that can take options -------------
  let optAdds = 0;
  for (const e of xw.option_extensions || []) {
    const p = backboneByName.get(e.hs_name);
    if (!p) { errs.push(`option_extension targets unknown property ${e.hs_name}`); continue; }
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

  gap('A4', 'no hs_name used twice',
    `The derived artefact carries no hs_name column at all. The name is derived downstream by adapters/hubspot/derive-names-${form}.mjs and lives in the naming-derivation report. Deriving it a SECOND time here would be a second implementation of the derivation — the shape [D-11] committed and its own sweep caught.`,
    'adapters/hubspot/assert-intake-keys.mjs, and the naming-derivation report’s own dry-run and read-back records.');
  gap('A5', 'names legal, lowercase, under 100 chars, prefix matching classification',
    'Same cause — no hs_name, and no classification column either. The prefix half additionally has no meaning on this shape: [R-06] rules that a form-specific prefix records which form CREATED a name, not which form owns it, so a prefix-versus-classification test is not the question a derived crosswalk is asking.',
    `adapters/hubspot/derive-names-${form}.mjs asserts name legality at derivation, and [R-23] admits no property before derive, assert and dry-run.`);
  gap('A6', 'reuse before creating, enforced by classification',
    'No classification column. The derived rows carry backbone_key instead, and that IS checked — as A3 above, which is the reuse question asked of the column this shape actually has.',
    'A3 above, reported with its own count on this run, plus adapters/hubspot/reclassify-against-backbone.mjs.');
  gap('A7', 'option extensions additive and targeting an enumeration',
    'The derived artefact has no option_extensions key at all; its option values live in the naming-derivation report.',
    'adapters/hubspot/assert-intake-keys.mjs, which examines this form’s option values and reports a non-zero count for it.');

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
