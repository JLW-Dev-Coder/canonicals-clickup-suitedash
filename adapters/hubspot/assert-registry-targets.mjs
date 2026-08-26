// EVERY ROW IN A DEFINITION REGISTER MUST NAME A TARGET THAT RESOLVES.
//
// CLI:  node adapters/hubspot/assert-registry-targets.mjs [--portal] [--verbose]
// Exit: 0 = every row in every register resolves, every derived figure agrees, canary live
//       2 = a row's target does not resolve, a figure disagrees, a register is unreadable,
//           or the canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DEFECT THAT EARNED IT — [D-19]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// adapters/hubspot/fields.registry.json declared 382 contact properties. THREE HUNDRED AND
// THIRTY-FOUR of them named properties that do not exist on the portal and never have — the
// short abbreviated names of a pre-map intake sketch, for four forms that each went on to get
// a generated fields.<form>.json under a different naming scheme entirely. Every row in every
// one of those generated files IS live. The registry's rows for the same forms were live in
// nothing.
//
// It was found by looking, after 433-B provisioned, and it was found SEVEN ROWS AT A TIME:
// the carried item names the seven for 433b because those were the ones somebody happened to
// read. The other 327 had been in the same state for as long, and nothing in the tree could
// have told anyone.
//
// A ROW STANDING OVER NOTHING IS WORSE THAN AN ABSENT ROW, because it reads as coverage.
// adapters/pdf/render-review.mjs falls back to this file for any form with no generated file;
// for most of this project's life that fallback would have named seven properties that do not
// exist, and reported seven empty cells indistinguishable from a filer who left them blank.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// TWO TIERS, AND THE OFFLINE ONE IS THE ONE THAT WOULD HAVE CAUGHT IT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   TIER 1, OFFLINE, ALWAYS RUNS. A row's target resolves IN THIS TREE:
//     [RT-1] its form has no generated fields.<form>.json — because if one exists it is
//            authoritative for that form and the provisioner drops the registry's rows for it,
//            so those rows define nothing and are read by nobody. This condition alone would
//            have fired the day the first generated file landed, three forms before anyone
//            read the portal.
//     [RT-2] its `group` is a group this same register declares.
//     [RT-3] its `form` is one this register's `meta.forms` declares.
//     [RT-4] every figure in the register's own `_count` block re-derives and agrees, and
//            `meta.property_count` agrees with the rows present.
//
//   TIER 2, PORTAL, RUNS WITH --portal AND FROM hs-preflight.mjs:
//     [RT-5] the row's `hs_name` is live on the portal.
//
// The offline tier is not the weaker half. A portal read establishes what is true right now;
// [RT-1] establishes that the row cannot be READ by anything, which is a property of the tree
// and is what actually made those 334 rows harmless-looking for so long.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE FORM-KEY SPELLING, WHICH IS WHY [RT-1] IS NOT A ONE-LINE LOOKUP
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The registry spelled 433-A(OIC) as `433aoic`. Every generated file, every map and every gate
// spells it `433aoi`. New-HubSpotProperties.ps1 matches a generated file to a registry form by
// `meta.form` equality, so the registry's 116 `433aoic` rows were NEVER superseded by
// fields.433aoi.json and would have been carried into a provisioning run under names that
// collide with nothing and mean nothing. A spelling that differs by one letter is exactly the
// shape a supersession test fails silently on, so this file resolves a form key through a
// declared alias table rather than by equality, and an unaliased key that matches no generated
// file is reported as such rather than passed.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { examined } from '../pdf/examined.mjs';
import { stop, isStop } from './hs-lib.mjs';

const DIR = 'adapters/hubspot';
const VERBOSE = process.argv.includes('--verbose');

// ---------------------------------------------------------------------------------------
// THE REGISTERS THIS FILE JUDGES, DECLARED AND THEN DERIVED IN BOTH DIRECTIONS.
//
// A definition register is a file in this directory shaped {meta, groups, properties}. The
// classifier is on the SHAPE and not on the name, so a second registry that arrives is judged
// without anyone remembering to add it — and a file here that has the shape and is not in the
// declared roles below is a STOP rather than a silent pass.
// ---------------------------------------------------------------------------------------
export const REGISTER_DIR = DIR;
export const REGISTER_FILTER = (name) => name.startsWith('fields.') && name.endsWith('.json');
export const REGISTER_CLASSIFIER = (doc) =>
  doc && typeof doc === 'object' && doc.meta && Array.isArray(doc.groups) && Array.isArray(doc.properties);
export const REGISTER_SWEEP_DECLARATION =
  `${DIR}/ (non-recursive) — name starts "fields." and ends ".json"; classified by the shape {meta, groups, properties} declared in the file`;

/**
 * A register is either GENERATED FROM A MAP or HAND-AUTHORED. The two are judged differently
 * and the difference is read from the file, never from its name: a generated file declares
 * `meta.generated_from`, and that declaration is what [R-19] requires of it anyway.
 */
export const roleOf = (doc) => (doc.meta.generated_from ? 'generated' : 'hand-authored');

/**
 * THE FORM-KEY ALIASES. The left side is a spelling that appears in a hand-authored register;
 * the right side is the spelling the tree uses everywhere else. An alias is a CLAIM about two
 * names being one form, so each is stated with the evidence for it rather than assumed.
 */
export const FORM_ALIASES = [
  { from: '433aoic', to: '433aoi',
    why: 'The registry spelled 433-A(OIC) with a trailing c; adapters/pdf/maps/433aoi.map.json, fields.433aoi.json and every gate spell it without. The HubSpot GROUP is irs433aoic under both spellings, which is what made the two look like one name for as long as they did.' },
];
const canonicalForm = (f) => (FORM_ALIASES.find((a) => a.from === f) || { to: f }).to;

export const readRegisters = () => {
  const out = [];
  for (const name of readdirSync(REGISTER_DIR).filter(REGISTER_FILTER).sort()) {
    const path = `${REGISTER_DIR}/${name}`;
    let doc = null, unreadable = null;
    try { doc = JSON.parse(readFileSync(path, 'utf8')); }
    catch (e) { if (isStop(e)) throw e; unreadable = e.message; }
    out.push({ path, name, doc, unreadable, classified: REGISTER_CLASSIFIER(doc) });
  }
  return out;
};

/** Which forms have a generated definition file, derived from the files themselves. */
export const generatedForms = (registers) => {
  const m = new Map();
  for (const r of registers) {
    if (!r.doc || !r.classified) continue;
    if (roleOf(r.doc) !== 'generated') continue;
    m.set(r.doc.meta.form, r.path);
  }
  return m;
};

// ---------------------------------------------------------------------------------------
// THE CONDITIONS, NAMED SEPARATELY SO A REPORT CAN SAY WHICH ONE WAS THE WEAK ONE.
// ---------------------------------------------------------------------------------------
export const CONDITIONS = [
  { id: 'RT-1', name: 'no generated rival', asks: 'the row\'s form has no generated fields.<form>.json, which would be authoritative and make this row unreadable' },
  { id: 'RT-2', name: 'group declared',     asks: 'the row\'s `group` is declared by the same register' },
  { id: 'RT-3', name: 'form declared',      asks: 'the row\'s `form` is in the register\'s own meta.forms' },
  { id: 'RT-4', name: 'figures derive',     asks: 'every figure the register states about itself re-derives from its own rows' },
  { id: 'RT-5', name: 'target is live',     asks: 'the row\'s hs_name is a property that exists on the portal (--portal only)' },
];

/**
 * Judge ONE hand-authored register. Returns a list of problems, each naming its condition.
 * `generated` is the form -> path map; `live` is a Set of live property names, or null when
 * the portal was not read (which makes [RT-5] UNASKED and says so, rather than passed).
 */
export const judgeRegister = (reg, generated, live) => {
  const problems = [];
  const doc = reg.doc;

  // [RT-1] — the condition that would have fired first, and years earliest.
  //
  // IT IS ASKED OF HAND-AUTHORED REGISTERS ONLY, and the first draft asked it of every register
  // — so each of the five generated files reported itself as its own rival and the run printed
  // seven problems on a tree with two. A generated file IS the authority for its form; the
  // condition is about a SECOND definition source standing beside one, and a file cannot stand
  // beside itself.
  const clashes = new Map();
  if (roleOf(doc) === 'hand-authored') {
    for (const p of doc.properties) {
      const canon = canonicalForm(p.form);
      if (generated.has(canon)) clashes.set(p.form, generated.get(canon));
    }
  }
  for (const [form, path] of clashes) {
    const rows = doc.properties.filter((p) => p.form === form);
    const alias = FORM_ALIASES.find((a) => a.from === form);
    problems.push(`[RT-1] no generated rival — ${reg.path} holds ${rows.length} row(s) for form ${JSON.stringify(form)}` +
      `${alias ? ` (canonically ${JSON.stringify(alias.to)}: ${alias.why})` : ''} and ${path} is generated from that form's closed map. ` +
      'A generated file is authoritative for its form and the provisioner drops these rows, so they define nothing and nothing reads them. ' +
      'A row standing over nothing reads as coverage and is worse than an absent row ([D-19]).');
  }

  // [RT-2] and [RT-3].
  const declaredGroups = new Set(doc.groups.map((g) => g.name));
  // A HAND-AUTHORED REGISTER DECLARES `meta.forms`; A GENERATED ONE DECLARES `meta.form`.
  // Reading only the plural made every generated register report every one of its rows as
  // naming an undeclared form — 717 problems on a tree with none. A register that carries
  // NEITHER key is not a register with no forms: it is one this condition cannot be asked of,
  // and it is reported as that rather than as 100% failure.
  const declaredForms = new Set(
    Array.isArray(doc.meta.forms) ? doc.meta.forms : typeof doc.meta.form === 'string' ? [doc.meta.form] : [],
  );
  const formsDeclared = Array.isArray(doc.meta.forms) || typeof doc.meta.form === 'string';
  if (!formsDeclared)
    problems.push(`[RT-3] form declared — ${reg.path} declares neither meta.forms nor meta.form, so no row in it can be asked which form it belongs to.`);
  for (const p of doc.properties) {
    if (!declaredGroups.has(p.group))
      problems.push(`[RT-2] group declared — row ${JSON.stringify(p.key)} names group ${JSON.stringify(p.group)}, which ${reg.path} does not declare. Its property group has no home in the file that creates it.`);
    if (formsDeclared && !declaredForms.has(p.form))
      problems.push(`[RT-3] form declared — row ${JSON.stringify(p.key)} names form ${JSON.stringify(p.form)}, which is not in this register's meta.forms [${[...declaredForms].join(', ')}].`);
  }
  // A group nobody claims is the same defect facing the other way.
  const claimed = new Set(doc.properties.map((p) => p.group));
  for (const g of doc.groups) {
    if (!claimed.has(g.name))
      problems.push(`[RT-2] group declared — ${reg.path} declares group ${JSON.stringify(g.name)} and no row in it names that group. A group row that gives no property a home disposes of nothing.`);
  }

  // [RT-4] — every figure the file states about itself, re-derived.
  const derived = {
    properties: doc.properties.length,
    groups: doc.groups.length,
    forms: new Set(doc.properties.map((p) => p.form)).size,
    pii_rows: doc.properties.filter((p) => p.pii === true).length,
    rows_with_options: doc.properties.filter((p) => Array.isArray(p.options) && p.options.length > 0).length,
  };
  if (doc.meta.property_count !== undefined && doc.meta.property_count !== derived.properties)
    problems.push(`[RT-4] figures derive — ${reg.path} states meta.property_count ${doc.meta.property_count} and holds ${derived.properties} row(s).`);
  const stated = doc._count;
  if (stated) {
    for (const k of Object.keys(stated)) {
      if (k.startsWith('_')) continue;
      if (derived[k] === undefined) {
        problems.push(`[RT-4] figures derive — ${reg.path} _count states ${JSON.stringify(k)}, which this file cannot derive. A figure nothing re-derives is a typed count.`);
        continue;
      }
      if (stated[k] !== derived[k])
        problems.push(`[RT-4] figures derive — ${reg.path} _count.${k} states ${stated[k]}; derived from its own rows: ${derived[k]}.`);
    }
  }

  // [RT-5] — the portal. UNASKED is reported as unasked.
  if (live) {
    const dead = doc.properties.filter((p) => !live.has(p.hs_name));
    if (dead.length)
      problems.push(`[RT-5] target is live — ${dead.length} of ${doc.properties.length} row(s) in ${reg.path} name a property that is NOT on the portal: ${dead.map((p) => p.hs_name).join(', ')}.`);
  }
  return { problems, derived };
};

// ---------------------------------------------------------------------------------------
// THE CANARY. Every detector carries one ([R-17]). It plants one violation of each OFFLINE
// condition against a synthetic register inside this process, and — the direction a
// presence-only canary would miss — asserts that a CONFORMING register raises nothing.
// ---------------------------------------------------------------------------------------
const CONFORMING = () => ({
  path: '(canary)/fields.canary.json',
  doc: {
    meta: { forms: ['cnry'], property_count: 1 },
    groups: [{ name: 'cnrygrp', label: 'Canary' }],
    properties: [{ key: 'cnry_a', hs_name: 'cnry_a', form: 'cnry', group: 'cnrygrp', pii: false, options: null }],
    _count: { properties: 1, groups: 1, forms: 1, pii_rows: 0, rows_with_options: 0 },
  },
});

export const runCanary = () => {
  const dead = [];
  const gen = new Map([['othr', 'adapters/hubspot/fields.othr.json']]);
  const planted = [
    { want: null, make: (r) => r },
    { want: '[RT-1]', make: (r) => { r.doc.properties[0].form = 'othr'; r.doc.meta.forms = ['othr']; return r; } },
    { want: '[RT-2]', make: (r) => { r.doc.properties[0].group = 'nosuch'; return r; } },
    { want: '[RT-2]', make: (r) => { r.doc.groups.push({ name: 'orphan', label: 'Nobody' }); return r; } },
    { want: '[RT-3]', make: (r) => { r.doc.meta.forms = ['else']; return r; } },
    { want: '[RT-4]', make: (r) => { r.doc.meta.property_count = 99; return r; } },
    { want: '[RT-4]', make: (r) => { r.doc._count.pii_rows = 7; return r; } },
    { want: '[RT-4]', make: (r) => { r.doc._count.invented = 1; return r; } },
    { want: '[RT-5]', make: (r) => r, live: new Set() },
  ];
  for (const p of planted) {
    const out = judgeRegister(p.make(CONFORMING()), gen, p.live || null);
    if (p.want === null) {
      if (out.problems.length) dead.push(`the CONFORMING register was refused: ${out.problems.join(' | ')}. A judge that refuses everything proves nothing.`);
      continue;
    }
    if (!out.problems.some((x) => x.startsWith(p.want))) dead.push(`a planted ${p.want} violation was NOT caught. Got: ${out.problems.length ? out.problems.join(' | ') : '(no problems at all)'}`);
  }
  // AND THE ALIAS MUST BE LIVE. [RT-1] resolving `433aoic` to `433aoi` is the whole reason the
  // supersession test in New-HubSpotProperties.ps1 was not enough, so a canary that never
  // exercised an ALIASED form key would pass on a judge that compared form keys by equality.
  const aliased = CONFORMING();
  aliased.doc.properties[0].form = '433aoic';
  aliased.doc.meta.forms = ['433aoic'];
  const aliasOut = judgeRegister(aliased, new Map([['433aoi', 'adapters/hubspot/fields.433aoi.json']]), null);
  if (!aliasOut.problems.some((x) => x.startsWith('[RT-1]')))
    dead.push('an ALIASED form key (433aoic -> 433aoi) was not resolved, so a register spelling a form one letter differently would be judged as having no generated rival.');
  const distinct = new Set(planted.filter((p) => p.want).map((p) => p.want));
  if (distinct.size !== CONDITIONS.length)
    dead.push(`the canary plants ${distinct.size} of the ${CONDITIONS.length} declared conditions; a condition nothing plants is a condition nothing has proved live.`);
  return { live: !dead.length, planted: planted.length + 1, conditions: distinct.size, dead };
};

// ---------------------------------------------------------------------------------------
// THE RUN.
// ---------------------------------------------------------------------------------------
export const run = async ({ portal = false } = {}) => {
  const problems = [];
  console.log('REGISTRY-TARGET AUDIT — every row in every definition register must name a target that resolves ([D-19]).');
  console.log('');

  const canary = runCanary();
  console.log(`canary: ${canary.live ? 'holds' : 'DEAD'} (${canary.planted} planted case(s) across ${canary.conditions} of ${CONDITIONS.length} declared condition(s), plus the alias)`);
  if (!canary.live) {
    for (const d of canary.dead) console.error(`STOP — canary: ${d}`);
    console.error('STOP — the judge cannot be trusted, so nothing below is reported.');
    return 2;
  }

  console.log('');
  console.log(`the conditions, ${CONDITIONS.length} separate:`);
  for (const c of CONDITIONS) console.log(`  [${c.id}] ${c.name.padEnd(19)} ${c.asks}`);

  console.log('');
  console.log(`register sweep: ${REGISTER_SWEEP_DECLARATION}`);
  const registers = readRegisters();
  for (const r of registers) {
    if (r.unreadable) problems.push(`UNREADABLE REGISTER — ${r.path}: ${r.unreadable}. A register this tool cannot parse is a STOP; it is not a register that passed.`);
    else if (!r.classified) problems.push(`${r.path} matches the register filter and does not carry the shape {meta, groups, properties}. A file this tool cannot judge is named rather than skipped.`);
  }
  const good = registers.filter((r) => r.classified);
  const generated = generatedForms(good);
  const hand = good.filter((r) => roleOf(r.doc) === 'hand-authored');
  console.log(`  ${registers.length} file(s) swept; ${good.length} carry the register shape — ${generated.size} generated from a map, ${hand.length} hand-authored`);
  for (const [form, path] of [...generated].sort()) console.log(`    generated    ${String(form).padEnd(9)} ${path}`);
  for (const r of hand) console.log(`    hand-authored ${String((r.doc.meta.forms || []).join(',')).padEnd(8)} ${r.path}`);

  let live = null;
  if (portal) {
    const { listAll } = await import('./hs-lib.mjs');
    const all = await listAll('/crm/v3/properties/contacts');
    if (all.length < 400) {
      console.error(`STOP — the portal returned ${all.length} contact properties. That read failed; it did not find an empty portal, and an unreadable portal must never be read as agreement.`);
      return 2;
    }
    live = new Set(all.map((p) => p.name));
    console.log(`  portal read: ${live.size} live contact propert(ies) — [RT-5] is ASKED on this run`);
  } else {
    console.log('  portal NOT read — [RT-5] is UNASKED on this run, which is a different fact from passed. Pass --portal to ask it.');
  }

  console.log('');
  // EVERY REGISTER IS JUDGED, GENERATED ONES INCLUDED. [RT-1] cannot fire on a generated file
  // (it has no rival by construction) and the other four can, which is the point: a generated
  // register that drifted from its own _count or named a group it does not declare would be
  // exactly as unreadable as the 334 rows this file exists for.
  let rowsJudged = 0;
  for (const r of good) {
    const out = judgeRegister(r, generated, live);
    rowsJudged += r.doc.properties.length;
    const tag = roleOf(r.doc) === 'generated' ? 'generated   ' : 'hand-authored';
    console.log(`  ${tag} ${r.path.padEnd(40)} ${String(r.doc.properties.length).padStart(4)} row(s), ${String(r.doc.groups.length).padStart(2)} group(s) — ${out.problems.length ? `${out.problems.length} PROBLEM(S)` : 'every row resolves'}`);
    if (VERBOSE) for (const k of Object.keys(out.derived)) console.log(`      derived ${k}: ${out.derived[k]}`);
    for (const p of out.problems) problems.push(p);
  }
  examined('assert-registry-targets', 'engine', rowsJudged, 'definition-register-rows');

  console.log('');
  if (problems.length) {
    for (const p of problems) console.error(`STOP — ${p}`);
    console.error(`ASSERT-REGISTRY-TARGETS FAILED — ${problems.length} problem(s).`);
    return 2;
  }
  console.log(`OK — ${rowsJudged} row(s) across ${good.length} definition register(s) judged against ${CONDITIONS.length} separate conditions; ` +
    `${live ? 'every row names a property that is live on the portal' : '[RT-5] unasked on this run'}, every group is claimed, every form is declared, ` +
    `and every figure each register states about itself re-derives from its own rows. The judge proved itself on ${canary.planted} planted case(s).`);
  return 0;
};

if (import.meta.main) stop(await run({ portal: process.argv.includes('--portal') }));
