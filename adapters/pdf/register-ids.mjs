// EVERY ID-KEYED REGISTER IN THIS ENGINE, AND THE ASSERTION THAT AN ID NAMES ONE THING.
//
// CLI:  node adapters/pdf/register-ids.mjs [--verbose]
// Exit: 0 = every register's ids are unique and no id is defined in two registers,
//       3 = at least one collision (each is named), 2 = a register could not be read.
//
// WHY THIS EXISTS — [D-07], and it was found by a collision rather than by design.
// ------------------------------------------------------------------------------
// A new count-sweep MANIFEST entry for 433-B(OIC)'s page-1 structural prose was written as
// [S-25]. That id was already in use by the crosswalk-classification disposition. Nothing
// complained. The two entries co-existed under one id, and the blanket audit then reported an
// EMPTY DEMAND for [S-25] -> align-block.mjs on 433-A(OIC) — attributing that form's
// classification sites to a citation written about 433-B(OIC) coordinates. The symptom
// appeared two tools away from the cause and named neither.
//
// An id is how a disposition is referred to from prose, from EMPTY_DEMAND, from FORWARD, from
// a map's `_carried`, and from the report a person reads. Two entries under one id means a
// citation can be paid by the wrong disposition. Until this file existed nothing asserted that
// they were distinct, and the engine carried TWELVE within-register duplicates and THIRTY-NINE
// cross-register ones while every sweep in it reported clean.
//
// TWO NAMESPACES, AND THE SECOND IS WHY A BLANKET "IDS ARE GLOBALLY UNIQUE" WOULD BE WRONG.
// ------------------------------------------------------------------------------------------
//   engine    — the id names one thing across the whole engine. Every in-code register, the
//               cross-form carried register, the probe register, the name-lie registry, the
//               crosswalk classifications.
//   form:<f>  — the id names one thing WITHIN one form. A printed heading called
//               PERSONAL_BANK_ACCOUNTS exists on 433-A and on 433-F and they are the same
//               printed heading on two different pages of two different forms; asserting those
//               apart would be asserting a falsehood. So form-scoped ids are unique within
//               their form and free against other forms — but NEVER free against the engine
//               namespace, because a form-scoped id colliding with an engine one is exactly
//               the [C-23] case: 433-A(OIC) carried C-23 as a RESOLVED item of its own while
//               the cross-form register carried C-23 as an OPEN engine-wide one.
//
// AND A THIRD RELATION THAT IS NOT A NAMESPACE. A `view` register REFERS to ids defined in
// another register — 433-B(OIC)'s `_arguable_page1` names B6, B7 and B8, which are the same
// three items its `_carried.open` holds. Asserting those apart would break a deliberate link.
// So a view is asserted the other way: every id in it MUST exist in its target. That is a
// stronger check than uniqueness, and it is the check that catches a view drifting off the
// register it is a view of.
//
// ENUMERATED, NEVER GLOBBED, except where the glob declares what it sweeps. REGISTERS below
// names each in-code register explicitly. The per-form registers ARE derived from
// adapters/pdf/maps/*.map.json — a glob — because a form that arrives must enter these counts
// without anyone remembering to add it; what that glob sweeps is declared in `_swept` and
// printed on every run, and a map on disk that this file cannot read is a STOP rather than a
// register that contributes nothing.

import { readFileSync, readdirSync } from 'node:fs';
import { VACUOUS, SELECTIONS, PARALLEL, FIGURES } from './guard-sweep.mjs';
import { MANIFEST } from './count-sweep.mjs';
import { PREDICATES, DECLARED, RETIRED } from './exclusion-sweep.mjs';
import { BOUNDARIES } from './sweep-boundary.mjs';
import { COMPLETENESS } from './blanket-audit.mjs';
import { OVERRIDES } from './success-sweep.mjs';
import { ABSENCE_SHAPES } from './absence-sweep.mjs';
import { DECLARED as ABSENCE_DECLARED } from './absence-declared.mjs';
import { CONTROLS } from './control-char-scan.mjs';
import { STANDARD as FIRING_STANDARD } from './firing-proofs.mjs';
// THE [D-18] POST-PASS REGISTER. Its PP ids name questions a per-form portal tool asks of the
// live portal, and they have to be unique against every other register for the same reason
// [D-07] gives: a citation can otherwise be paid by the wrong disposition.
import { QUESTIONS as POST_PASS_QUESTIONS } from '../hubspot/post-pass-sweep.mjs';
import { CLAIMS as FIRING_CLAIMS } from './assert-firing-proofs.mjs';
import { REGISTRY as RX_REGISTRY, ADOPTERS as RX_ADOPTERS } from './regex-self-assert.mjs';
// THE THREE ADOPTERS THIS FILE DOES NOT OTHERWISE PULL IN. A regex registers itself when its
// module LOADS, so the size of that register depends on the importing tool's import graph — and
// a register whose size depends on who is looking is not a register. Imported statically rather
// than through loadAdopters(), because a top-level await here would propagate to validate-map.mjs
// and through it to gate step 3. `assertAdoptersLoaded()` below is what keeps this list honest:
// it is DERIVED against ADOPTERS rather than counted, so an adopter added there and forgotten
// here is a STOP rather than a quietly smaller register.
// It fired on its first run and named enumerate-shadowing.mjs, which this file imports
// ABSENCE_SHAPES-style registers from but not the module itself. That is the check working:
// the rx register would have been one entry short and nothing else would have said so.
import './assert-y-convention.mjs';
import './rounding.mjs';
import './line-markers.mjs';
import './enumerate-shadowing.mjs';
import { parseRules, RULES_PATH } from './assert-rules.mjs';

const MAPS = 'adapters/pdf/maps';

/** Ids off an array of entries. A non-string id is a STOP, not a skip: an entry with no id is
 *  an entry no citation can reach, and silently dropping it would under-count the register. */
const idsOf = (label, arr) => {
  const out = [];
  arr.forEach((e, i) => {
    if (typeof e?.id !== 'string' || !e.id.trim()) throw new Error(`${label}[${i}] has no string \`id\` — every entry of an id-keyed register must be citable`);
    out.push(e.id);
  });
  return out;
};

/** A JSON artefact, read from disk. ENOENT is absence and is reported; a parse failure THROWS,
 *  because an unreadable register and an empty one must never report the same figure. */
const json = (p) => {
  let raw;
  try { raw = readFileSync(p, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  return JSON.parse(raw);
};

/** Every form with a map on disk. Declared here rather than typed so a new form enters. */
export const MAPPED_FORMS = () =>
  readdirSync(MAPS).filter((f) => f.endsWith('.map.json')).map((f) => f.replace('.map.json', '')).sort();

// ---------------------------------------------------------------------------------------
// THE MANIFEST OF REGISTERS.
// ---------------------------------------------------------------------------------------
// Each entry: a label, a scope, and a reader that returns the ids. `view` names the register
// whose ids this one refers to. Nothing here is a count; every figure is derived by reading.
/**
 * Every module regex-self-assert.mjs declares as an adopter must actually be loaded here, or
 * the rx register this file counts is a partial one wearing a whole one's name. Derived on both
 * sides — the expected set from ADOPTERS, the loaded set from the registrations themselves — so
 * neither is a figure anyone typed.
 */
const assertAdoptersLoaded = () => {
  const loaded = new Set([...RX_REGISTRY.values()].map((r) => r.module.split('/').pop()));
  const missing = RX_ADOPTERS.map((m) => m.split('/').pop()).filter((f) => !loaded.has(f));
  if (missing.length) throw new Error(
    `regex-self-assert.mjs declares ${RX_ADOPTERS.length} adopter(s) and ${missing.length} of them contributed no registration here: ${missing.join(', ')}.\n` +
    '      Either that module lost its rx() registrations, or register-ids.mjs is not importing it and is about to count a register smaller than the one that exists.');
};

/**
 * A REGISTER THAT DECLARES ITS OWN SIZE IS COMPARED AGAINST IT — the ENGINE-WIDE ones, which
 * nothing else reaches.
 *
 * count-sweep.mjs [S-07] already does this for `_carried._count.open` and `.resolved`, but its
 * manifest entry keys on `file: /\.map\.json$/` and its whole context is built per form, so the
 * ENGINE-WIDE `_carried.cross-form.json` was outside it. That register's `_count.resolved` said
 * 7 against 8 entries at 8132a0d and nothing in the tree compared them. Found by re-deriving it
 * during Prompt 46; the number is now derived on write and asserted here on every run.
 *
 * Enumerated, not globbed: each file names the scalar and the array it counts.
 */
const DECLARED_SIZES = [
  { file: `${MAPS}/_carried.cross-form.json`, pairs: [
    ['_count.open', (d) => d.open.length, 'open[]'],
    ['_count.resolved', (d) => d.resolved.length, 'resolved[]'],
  ] },
  { file: `${MAPS}/_cross-form-coordinates.json`, pairs: [
    ['_count', (d) => d.declarations.length, 'declarations[]'],
  ] },
  { file: `${MAPS}/_subjects.cross-form.json`, pairs: [
    ['_count.pairs', (d) => d.pairs.length, 'pairs[]'],
    // `forms` is an OBJECT keyed by form id, not an array, and the derivation says so rather
    // than reaching for `.length` and finding undefined.
    ['_count.forms', (d) => Object.keys(d.forms).length, 'the keys of forms{}'],
    // `quotes` is an object too, keyed by the quote's own label. Derived from its KEYS.
    ['_count.quotes', (d) => Object.values(d.forms).reduce((n, f) => n + Object.keys(f.quotes || {}).length, 0), 'the keys of every forms[*].quotes{} summed'],
  ] },
  { file: 'adapters/hubspot/probe-register.json', pairs: [
    ['_count.probes', (d) => d.probes.length, 'probes[]'],
  ] },
];

const assertDeclaredSizes = () => {
  const bad = [];
  for (const { file, pairs } of DECLARED_SIZES) {
    const doc = json(file);
    if (!doc) continue;                       // ENOENT is absence; json() throws on unparseable
    for (const [path, derive, from] of pairs) {
      const claimed = path.split('.').reduce((o, k) => (o === undefined || o === null ? o : o[k]), doc);
      if (claimed === undefined) { bad.push(`${file} declares no \`${path}\` — a register that states its size everywhere else and not here is the one nobody checks`); continue; }
      let derived;
      // A derivation that THROWS is a STOP, never a skip: it means the register's shape moved
      // under the reader, and "I could not count it" must not report as "it agrees".
      try { derived = derive(doc); }
      catch (e) { bad.push(`${file} \`${path}\` claims ${claimed} and the derivation over ${from} threw: ${e.message}`); continue; }
      if (claimed !== derived) bad.push(`${file} \`${path}\` claims ${claimed}; ${from} derives ${derived}`);
    }
  }
  if (bad.length) throw new Error(`DECLARED SIZE DISAGREES WITH THE REGISTER — ${bad.length}:\n      ${bad.join('\n      ')}`);
};

export const REGISTERS = () => {
  const R = [];
  const add = (label, scope, ids, extra = {}) => R.push({ label, scope, ids, ...extra });

  // --- in-code registers, enumerated -----------------------------------------------------
  add('guard-sweep.mjs:VACUOUS',        'engine', idsOf('VACUOUS', VACUOUS));
  add('guard-sweep.mjs:SELECTIONS',     'engine', idsOf('SELECTIONS', SELECTIONS));
  add('guard-sweep.mjs:PARALLEL',       'engine', idsOf('PARALLEL', PARALLEL));
  add('guard-sweep.mjs:FIGURES',        'engine', idsOf('FIGURES', FIGURES));
  add('count-sweep.mjs:MANIFEST',       'engine', idsOf('MANIFEST', MANIFEST));
  add('exclusion-sweep.mjs:PREDICATES', 'engine', idsOf('PREDICATES', PREDICATES));
  add('exclusion-sweep.mjs:DECLARED',   'engine', idsOf('DECLARED', DECLARED));
  add('exclusion-sweep.mjs:RETIRED',    'engine', idsOf('RETIRED', RETIRED));
  add('blanket-audit.mjs:COMPLETENESS', 'engine', idsOf('COMPLETENESS', COMPLETENESS));
  add('success-sweep.mjs:OVERRIDES',    'engine', idsOf('OVERRIDES', OVERRIDES));
  add('sweep-boundary.mjs:BOUNDARIES',  'engine', idsOf('BOUNDARIES', BOUNDARIES));
  add('absence-sweep.mjs:ABSENCE_SHAPES', 'engine', idsOf('ABSENCE_SHAPES', ABSENCE_SHAPES));
  add('absence-declared.mjs:DECLARED',    'engine', idsOf('absence.DECLARED', ABSENCE_DECLARED));
  add('control-char-scan.mjs:CONTROLS',   'engine', idsOf('CONTROLS', CONTROLS));
  add('firing-proofs.mjs:STANDARD',       'engine', idsOf('FIRING_STANDARD', FIRING_STANDARD));
  add('assert-firing-proofs.mjs:CLAIMS',  'engine', idsOf('FIRING_CLAIMS', FIRING_CLAIMS));
  add('post-pass-sweep.mjs:QUESTIONS', 'engine', idsOf('POST_PASS_QUESTIONS', POST_PASS_QUESTIONS));
  assertAdoptersLoaded();
  assertDeclaredSizes();
  add('regex-self-assert.mjs:REGISTRY',   'engine', idsOf('rx.REGISTRY', [...RX_REGISTRY.values()]));

  // THE STANDING RULES. Not a JSON register and not an in-code array: the ids live in the
  // headings of adapters/pdf/RULES.md, which is what a prompt cites and therefore what has to
  // be unique. Read through assert-rules.mjs's own parser rather than re-scanned here — a
  // second reading of a population is a second answer to the question the id exists to make
  // one answer to, which is the shape [D-11]'s fix committed and its own sweep caught.
  // ENGINE-SCOPED, not form-scoped: a rule is a statement about how work is done on every
  // form, so an R- id colliding with anything anywhere is a collision.
  {
    const parsed = parseRules(readFileSync(RULES_PATH, 'utf8'));
    // A DOCUMENT THAT WILL NOT PARSE CONTRIBUTES NO IDS, AND THAT IS THE ONE STATE THIS MUST
    // NOT BE QUIET ABOUT. assert-rules.mjs exits 2 on it, and it runs in the same suite; what
    // would be wrong is for THIS register to report a clean sweep over an empty contribution,
    // which is [R-04] exactly. So an unparseable document is added as a single synthetic id
    // that can never be legal, and the sweep reports it rather than counting zero.
    if (!parsed.rules.length) add('RULES.md:rules', 'engine', idsOf('RULES.md', [{ id: 'R-UNREADABLE' }]));
    else add('RULES.md:rules', 'engine', idsOf('RULES.md', parsed.rules));
  }

  // --- engine-wide JSON registers, enumerated --------------------------------------------
  const cross = json(`${MAPS}/_carried.cross-form.json`);
  if (cross) {
    add('_carried.cross-form.json:open',     'engine', idsOf('cross-form.open', cross.open || []));
    add('_carried.cross-form.json:resolved', 'engine', idsOf('cross-form.resolved', cross.resolved || []));
  }
  const probes = json('adapters/hubspot/probe-register.json');
  if (probes) add('probe-register.json:probes', 'engine', idsOf('probes', probes.probes || []));
  const xf = json(`${MAPS}/_cross-form-coordinates.json`);
  if (xf) add('_cross-form-coordinates.json:declarations', 'engine', idsOf('cross-form-coordinates', xf.declarations || []));

  // --- per-form registers, from the map glob ---------------------------------------------
  // A map that exists and will not parse throws out of json() and takes the run down. That is
  // deliberate: a register nobody could read must never contribute the same zero as an empty one.
  for (const f of MAPPED_FORMS()) {
    const m = json(`${MAPS}/${f}.map.json`);
    if (!m) continue;
    const carried = [...(m._carried?.open || []), ...(m._carried?.resolved || [])];
    if (carried.length) add(`${f}.map.json:_carried`, `form:${f}`, idsOf(`${f}._carried`, carried));
    for (const k of Object.keys(m).filter((k) => /^_arguable(_|$)/.test(k))) {
      const ids = idsOf(`${f}.${k}`, m[k] || []);
      // A page's arguable list is a VIEW of the map's own carried register when its ids are
      // already carried there, and a register in its own right when they are not. Both shapes
      // are in use — 433-B(OIC) links, 433-A(OIC) numbers its own P4-n — and which one it is
      // is DERIVED from the ids rather than declared, so a map cannot pick the reading that
      // makes its own collision legal.
      const carriedSet = new Set(carried.map((e) => e.id));
      const isView = ids.length > 0 && ids.every((i) => carriedSet.has(i));
      add(`${f}.map.json:${k}`, `form:${f}`, ids, isView ? { view: `${f}.map.json:_carried` } : {});
    }
    const rb = m.rounding?.blocks;
    if (Array.isArray(rb) && rb.length) add(`${f}.map.json:rounding.blocks`, `form:${f}`, idsOf(`${f}.rounding.blocks`, rb));
    const heads = json(`${MAPS}/${f}.headings.json`);
    if (heads?.headings?.length) add(`${f}.headings.json:headings`, `form:${f}`, idsOf(`${f}.headings`, heads.headings));
    const lies = json(`${MAPS}/${f}.name-lies.json`);
    if (lies?.entries?.length) add(`${f}.name-lies.json:entries`, 'engine', idsOf(`${f}.name-lies`, lies.entries));
    const cls = json(`${MAPS}/${f}.crosswalk-classification.json`);
    if (cls?.entries?.length) add(`${f}.crosswalk-classification.json:entries`, 'engine', idsOf(`${f}.classification`, cls.entries));
  }

  // --- HubSpot-side registers, enumerated ------------------------------------------------
  const shapes = json('adapters/hubspot/asset-row-shapes.json');
  if (shapes) {
    if (shapes.arguable?.length) add('asset-row-shapes.json:arguable', 'engine', idsOf('asset-row-shapes.arguable', shapes.arguable));
    // `defects_found_while_specifying` mixes ids of its own (D1, D2) with a REFERENCE to the
    // cross-form register (D-05, the row_class item). Derived the same way an arguable page is:
    // a view only if every id is already carried in the register it points at.
    const d = shapes.defects_found_while_specifying || [];
    if (d.length) {
      const ids = idsOf('asset-row-shapes.defects', d);
      const crossIds = new Set([...(cross?.open || []), ...(cross?.resolved || [])].map((e) => e.id));
      add('asset-row-shapes.json:defects_found_while_specifying', 'engine', ids,
        // `ids.length > 0 &&` is not decoration: `[].every(...)` is true, so an empty defect
        // list would declare itself a VIEW of the cross-form register and then be excluded from
        // the collision pass entirely — an empty input turning the check off. Guarded locally
        // rather than by the enclosing `if (d.length)`, because a guard that lives one scope out
        // is a guard the next edit can move away from.
        ids.length > 0 && ids.every((i) => crossIds.has(i)) ? { view: '_carried.cross-form.json:resolved' } : { partial_view_of: '_carried.cross-form.json' });
    }
  }
  for (const f of ['433f', '433aoi']) {
    const cw = json(`adapters/hubspot/crosswalk.${f}.json`);
    if (cw?.arguable?.length) add(`crosswalk.${f}.json:arguable`, 'engine', idsOf(`crosswalk.${f}.arguable`, cw.arguable));
  }
  return R;
};

// The one glob this file uses, declared. A glob is a STOP unless it says what it sweeps.
export const SWEPT = () => ({
  globbed: `${MAPS}/*.map.json`,
  resolves_to: MAPPED_FORMS(),
  and_their_sidecars: ['.headings.json', '.name-lies.json', '.crosswalk-classification.json'],
  enumerated_registers: 'every in-code register and every HubSpot-side artefact is named individually in REGISTERS()',
});

// ---------------------------------------------------------------------------------------
// THE ASSERTIONS.
// ---------------------------------------------------------------------------------------
export const runRegisterIdSweep = (registers = REGISTERS()) => {
  const problems = [];

  // 1. WITHIN A REGISTER. The [S-25] case: two entries, one id, one silently shadowing the
  //    other at every lookup that keys on id.
  for (const r of registers) {
    const seen = new Map();
    r.ids.forEach((id, i) => { if (!seen.has(id)) seen.set(id, []); seen.get(id).push(i); });
    for (const [id, at] of seen) if (at.length > 1)
      problems.push(`DUPLICATE  [${id}]  is defined ${at.length} times in ${r.label} (entries ${at.join(', ')}).\n      Two entries under one id means a citation can be paid by the wrong one. Renumber all but the first.`);
  }

  // 2. A VIEW MUST NOT DRIFT OFF WHAT IT IS A VIEW OF. Checked before the collision pass,
  //    because a view's ids are deliberately shared and must be excluded from it.
  const byLabel = new Map(registers.map((r) => [r.label, r]));
  for (const r of registers) {
    if (!r.view) continue;
    const target = byLabel.get(r.view);
    if (!target) { problems.push(`VIEW TARGET MISSING  ${r.label} declares itself a view of ${r.view}, which is not a register this sweep reads.`); continue; }
    const have = new Set(target.ids);
    for (const id of r.ids) if (!have.has(id))
      problems.push(`VIEW ORPHAN  [${id}]  appears in ${r.label}, which is a view of ${r.view}, and ${r.view} does not define it.\n      Either the item left the register it is a view of, or the view invented an id.`);
  }

  // 3. ACROSS REGISTERS. Same id, two registers, two things.
  //    engine x engine  — always a collision.
  //    form   x engine  — always a collision: a form-scoped id is free against OTHER FORMS,
  //                       never against the engine. This is the [C-23] case.
  //    form:a x form:b  — not a collision. The same printed heading on two forms is one
  //                       heading, and asserting it apart would assert a falsehood.
  //    form:a x form:a  — a collision unless one is a declared view of the other.
  const where = new Map();
  for (const r of registers) {
    if (r.view) continue;                       // a view defines nothing; it refers
    for (const id of new Set(r.ids)) {
      if (!where.has(id)) where.set(id, []);
      where.get(id).push(r);
    }
  }
  for (const [id, regs] of where) {
    if (regs.length < 2) continue;
    for (let i = 0; i < regs.length; i++) for (let j = i + 1; j < regs.length; j++) {
      const a = regs[i], b = regs[j];
      const bothForm = a.scope.startsWith('form:') && b.scope.startsWith('form:');
      if (bothForm && a.scope !== b.scope) continue;                 // different forms: legal
      const kind = a.scope === b.scope ? `both ${a.scope}-scoped` : `${a.scope} and ${b.scope}`;
      problems.push(`COLLISION  [${id}]  is defined in ${a.label} AND in ${b.label} (${kind}).\n      One id, two registers, two things. A citation of [${id}] cannot say which it means.`);
    }
  }
  return { registers, problems, where };
};

// ---------------------------------------------------------------------------------------
// THE CANARY. A new instrument is the least trustworthy object in the repo.
// ---------------------------------------------------------------------------------------
// Three planted defects, one of each kind the sweep claims to find, driven through the SAME
// runRegisterIdSweep the real run uses rather than through a second copy of the comparison.
// Expected yield is exactly three, and each is matched by its kind — a canary that counted
// only the total would pass with three duplicates and no collision check running at all.
export const CANARY = [
  { label: 'canary:A', scope: 'engine',    ids: ['Z-01', 'Z-02', 'Z-01'] },   // 1 duplicate
  { label: 'canary:B', scope: 'engine',    ids: ['Z-02'] },                   // 1 engine x engine collision with A
  { label: 'canary:C', scope: 'form:zzz',  ids: ['Z-09'], view: 'canary:A' }, // 1 view orphan
];
export const runCanary = () => {
  const { problems } = runRegisterIdSweep(CANARY);
  const kinds = { DUPLICATE: 0, COLLISION: 0, 'VIEW ORPHAN': 0 };
  for (const p of problems) for (const k of Object.keys(kinds)) if (p.startsWith(k)) kinds[k]++;
  const ok = problems.length === 3 && kinds.DUPLICATE === 1 && kinds.COLLISION === 1 && kinds['VIEW ORPHAN'] === 1;
  return { ok, problems: problems.length, kinds };
};

export const reportRegisterIdSweep = (s, { verbose = false } = {}) => {
  const engine = s.registers.filter((r) => r.scope === 'engine');
  const form   = s.registers.filter((r) => r.scope.startsWith('form:'));
  const views  = s.registers.filter((r) => r.view);
  const total  = s.registers.reduce((n, r) => n + r.ids.length, 0);
  const swept  = SWEPT();
  const canary = runCanary();
  console.log(`register-id sweep: ${s.registers.length} id-keyed register(s) — ${engine.length} engine-scoped, ${form.length} form-scoped, of which ${views.length} are views`);
  console.log(`                   ${total} id(s) read; ${s.where.size} distinct id(s) defined outside a view`);
  console.log(`                   glob: ${swept.globbed} -> ${swept.resolves_to.join(', ')}; every other register is named individually`);
  console.log(`                   canary: ${canary.ok ? 'holds' : 'DEAD'} (${canary.problems} planted defect(s) found — ${Object.entries(canary.kinds).map(([k, v]) => `${v} ${k}`).join(', ')}; expected 1 of each)`);
  if (verbose) for (const r of s.registers)
    console.log(`    ${r.label.padEnd(52)} ${String(r.ids.length).padStart(3)} id(s)  ${r.scope}${r.view ? `  VIEW OF ${r.view}` : ''}`);
  if (!canary.ok) {
    console.error('CANARY DEAD — the register-id sweep did not find its own planted defects. Every "0 collisions" in this run is meaningless. STOP.');
    return (s.problems.length || 0) + 1;
  }
  if (!s.problems.length) {
    console.log(`OK — every one of those ${s.registers.length} registers has unique ids, no id is defined in two registers that could be confused, and every view resolves.`);
    return 0;
  }
  console.error(`REGISTER-ID SWEEP — ${s.problems.length} problem(s):`);
  s.problems.forEach((p) => console.error(`  ${p}`));
  return s.problems.length;
};

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('register-ids.mjs')) {
  const s = runRegisterIdSweep();
  process.exit(reportRegisterIdSweep(s, { verbose: process.argv.includes('--verbose') }) ? 3 : 0);
}
