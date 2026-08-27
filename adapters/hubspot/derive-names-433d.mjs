// DERIVES EVERY 433-D HubSpot property name from the crosswalk classification. Nothing here is
// typed; a name is a prefix plus a row's fact, and which prefix is decided by the entry's
// CATEGORY. No property is created by this file.
//
//   node adapters/hubspot/derive-names-433d.mjs --portal          # read the portal, write the report
//   node adapters/hubspot/derive-names-433d.mjs --portal --emit   # ... and emit fields.433d.json
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IS DIFFERENT ABOUT THIS FORM, AND IT IS THE PREFIX
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Every deriver before this one had ONE predecessor prefix. 433-B binds `irs433boi_` and nothing
// else; 433-B(OIC) reused nothing at all. 433-D REUSES FROM TWO DIFFERENT FORMS AT ONCE — the
// individual branch of its subject route binds `irs433_tp_ssn_itin`, which 433-A created, and the
// entity branch binds `irs433boi_employer_identification_number`, which 433-B(OIC) created. One
// PREDECESSOR_PREFIX constant cannot express that.
//
// So on a reuse row the name comes from the ENTRY'S OWN `reuse_of`, and the fact is what checks
// it: the derived name must END with `_<fact>`, so a reuse whose fact and whose name describe
// different things is a STOP rather than a silent binding. The entry decides the prefix; the row
// decides the tail; neither alone can name a property.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE SUBJECT ASSERTION IS THE OPPOSITE SHAPE TO 433-B'S, AND THAT IS THE POINT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// derive-names-433b.mjs asserts COINCIDE with its predecessor and MUTUALLY EXCLUSIVE with the
// other three, and every reuse rests on the first verdict. 433-D COINCIDES WITH ALL FIVE — a
// triangle no other three forms in this repo make, because 433-A and 433-B coincide with 433-D
// and are mutually exclusive with each other. The register recorded that and REFUSED to resolve
// it: the subject is per RECORD on this form, so the axis alone settles nothing.
//
// What settles it per key is the SUBJECT CLASS. A dependent or conditional cell has a FIXED
// subject — the route sends one branch elsewhere, and a conditional cell exists for one legal
// person and is asserted empty on the other — so the reuse test can be asked. An INDEPENDENT
// cell has a per-record subject, and a property shared with a form whose subject is fixed would
// hold, on the other branch, a fact about the wrong legal person under a name saying otherwise.
//
// A9S IS THAT RULING MADE INTO AN ASSERTION: every reuse row on this form must be a cell the map
// classes dependent or conditional. A reuse on an independent cell is refused in as many words,
// even though the subject register licenses it, and that is [R-29] — a coinciding subject says
// which reuses are PERMISSIBLE and nothing about how many there will be.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A11C — CASE-INSENSITIVE INJECTIVITY, AND IT HAS ALREADY BITTEN THIS FORM
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// HubSpot lowercases a property name silently. Two derived names differing only in case are ONE
// property, and the second create either fails or overwrites — permanently, on a portal that does
// not free a name. This is not hypothetical on 433-D: the map's own `_key_overrides` exists
// because `Date1` and `Date2` collided at MAP level with `date1` and `date2`. A11 already
// requires every name to be lower-snake-case, which makes A11C's population empty today — and an
// assertion whose population is empty is exactly the vacuous guard this engine keeps finding, so
// A11C is PROVED ON A PLANTED PAIR on every run rather than being reported as a bare pass.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { refuseDowngrade, stampFor } from './no-downgrade.mjs';
import { keySpaceOf, coverageOf, ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';
import { assertGenerator, generatorMeta, selfPath } from './generator-guard.mjs';
import { isStop, stop as halt } from './hs-lib.mjs';

const argv = process.argv.slice(2);
const usePortal = argv.includes('--portal');
const emit = argv.includes('--emit');

const R = (p) => JSON.parse(readFileSync(p, 'utf8'));
const MAP = R('adapters/pdf/maps/433d.map.json');
const CLS = R('adapters/pdf/maps/433d.crosswalk-classification.json');
const XW = R('adapters/hubspot/crosswalk.433d.json');

const PREFIX = 'irs433d_';
const REUSE_CATEGORY = 'exact';
const SUBJECT_CATEGORY = 'same-question-different-subject';
const SERVICE_CATEGORY = 'third-subject-the-service';
const OPERATOR_CATEGORY = 'operator-input';
// The categories with NO DEFAULT. A row in one of these must carry its own scope and reason.
const MIDDLE = new Set([
  'superset', 'asymmetric-the-other-way', 'different-predicate-same-caption',
  'different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition',
]);

const stops = [];
const notes = [];
const STOP = (id, msg) => stops.push(`[${id}] ${msg}`);

// ---------------------------------------------------------------------------------------
// A13  THE PREFIX. Asserted before anything is derived, because every later check that asks
//      "is this one of ours" rests on it. Both predecessor prefixes are checked against it.
// ---------------------------------------------------------------------------------------
for (const other of ['irs433_', 'irs433boi_', 'irs433b_', 'irs433aoi_']) {
  if (other.startsWith(PREFIX))
    STOP('A13', `"${other}" starts with "${PREFIX}". Every name that prefix created would be read as this form's and no collision check below would be asking about the right set.`);
}
if (!`${PREFIX}x`.startsWith('irs433') || 'irs433_x'.startsWith(PREFIX))
  STOP('A13', 'the prefix does not behave as this file documents: the "d" is what separates irs433d_ from irs433_, and a test written without it would match both.');

// ---------------------------------------------------------------------------------------
// A0/A1/A2  THE KEY SPACE AND THE COVERAGE, from the shared selector rather than re-derived.
//           The subject route is applied there, so `433d_taxpayer` is not a member and the two
//           branch keys and the discriminator are.
// ---------------------------------------------------------------------------------------
const { keySpace, problems: keySpaceProblems, routes } = keySpaceOf(MAP);
for (const p of keySpaceProblems) STOP('A0', p);
for (const k of (ENGINE_EXTRA_INPUTS['433d'] || [])) if (!keySpace.has(k)) keySpace.set(k, 'engine');
if (keySpace.size < 60)
  STOP('A0', `the key space read only ${keySpace.size} keys out of 433d.map.json, which cannot be right for a form with ${MAP._partition?.bound_writable} bound targets. Refusing to derive names against an input this file could not read.`);
if (routes.length !== 1)
  STOP('A0', `the map declares ${routes.length} subject route(s) and this form has exactly one. Every reuse on the identifier rests on the route being applied.`);

const bindings = XW.bindings || [];
if (!bindings.length) STOP('A0', 'crosswalk.433d.json carries no bindings. Nothing was derived, and an empty derivation is not a derivation that found nothing.');

const boundKeys = new Set(bindings.map((b) => b.key));
for (const k of keySpace.keys()) if (!boundKeys.has(k)) STOP('A1', `engine input "${k}" has no crosswalk row. The engine reads it and no property would hold it.`);
for (const b of bindings) if (!keySpace.has(b.key)) STOP('A1', `crosswalk row "${b.key}" is not an engine input. A property would be provisioned for a cell nothing reads.`);

const { coverage, problems: coverageProblems, notes: coverageNotes } = coverageOf(CLS, MAP, '433d');
for (const p of coverageProblems) STOP('A2', p);
notes.push(...coverageNotes);
const entryById = new Map(CLS.entries.map((e) => [e.id, e]));

// THE SUBJECT CLASS OF A KEY, read out of the map the same way the map derives its keys.
const keyOfStem = (s) => (MAP._key_overrides || {})[s]
  || `433d_${s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/_+/g, '_').toLowerCase()}`;
const classByKey = new Map();
for (const [stem, d] of Object.entries(MAP.subject_classes || {})) {
  if (stem.startsWith('_') || !d?.class) continue;
  classByKey.set(keyOfStem(stem), d.class);
}
// The two branch keys inherit the dependent cell's class; the discriminator names no printed cell.
for (const r of routes) { classByKey.set(r.individual, 'dependent'); classByKey.set(r.entity, 'dependent'); }
if (classByKey.size < 60) STOP('A0', `only ${classByKey.size} keys resolved to a subject class out of ${Object.keys(MAP.subject_classes || {}).length} declared stems. A9S below rests on this reading.`);

// ---------------------------------------------------------------------------------------
// A4  THE SUBJECT RULING. On this form it is the OPPOSITE shape to 433-B's: the register says
//     COINCIDE with all five, and that verdict LICENSES reuse without settling any of it.
// ---------------------------------------------------------------------------------------
const SUBJ = CLS.subject;
if (!SUBJ || typeof SUBJ.the_ruling !== 'string' || typeof SUBJ.this_form !== 'string')
  STOP('A4', 'the classification declares no usable `subject` block. Every reuse on this form rests on that ruling, and a reuse with no recorded ruling behind it is a permanent binding nobody decided.');

const SUBJECTS = R('adapters/pdf/maps/_subjects.cross-form.json');
if (!Array.isArray(SUBJECTS.pairs) || !SUBJECTS.pairs.length)
  STOP('A4', '_subjects.cross-form.json carries no `pairs` array. The subject register is the INPUT to every reuse on this form and this file could not read it.');
else if (!SUBJECTS.pairs.every((p) => p.a && p.b && p.relation))
  STOP('A4', '_subjects.cross-form.json has rows without `a`, `b` or `relation`. The register\'s shape is not what this reader assumes, so no verdict below is a reading.');
const pairVerdict = (a, b) => {
  const hit = (SUBJECTS.pairs || []).find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));
  return hit ? hit.relation : null;
};
const OTHERS = Object.keys(SUBJECTS.forms || {}).filter((f) => f !== '433d').sort();
const verdicts = {};
for (const other of OTHERS) {
  const v = pairVerdict('433d', other);
  verdicts[other] = v;
  if (v !== 'COINCIDE')
    STOP('A4', `the subject register says 433d / ${other} is ${JSON.stringify(v)}, not COINCIDE. Every reuse on this form is licensed by that verdict; without it no key may bind an existing property.`);
}
// AND THE TRIANGLE IS ASSERTED RATHER THAN DESCRIBED. 433-A and 433-B coincide with this form
// and are MUTUALLY EXCLUSIVE with each other. If that stopped being true, the whole reason this
// form's reuse verdict cannot be read off the register would have gone, and the per-key ruling
// below would be resting on a sentence about a register that no longer says it.
if (pairVerdict('433a', '433b') !== 'MUTUALLY EXCLUSIVE')
  STOP('A4', `the register says 433a / 433b is ${JSON.stringify(pairVerdict('433a', '433b'))}, not MUTUALLY EXCLUSIVE. The triangle is what makes this form's per-key subject-class ruling necessary; without it the classification's governing finding describes nothing.`);

for (const e of CLS.entries) {
  if (e.category !== SUBJECT_CATEGORY && e.category !== SERVICE_CATEGORY) continue;
  if (!e.subject_reason || String(e.subject_reason).length < 120)
    STOP('A4', `${e.id} is ${e.category} and its subject_reason is ${e.subject_reason ? String(e.subject_reason).length + ' characters' : 'absent'}. The category derives a form-specific name from a default, so each entry has to name the subjects and the state of the world in which they hold different values.`);
}

// ---------------------------------------------------------------------------------------
// [R-32]  HEADROOM, PROJECTED BEFORE THE FIRST NAME IS DERIVED — a bound, never a count.
// ---------------------------------------------------------------------------------------
const CEILING = 1000;
const stemBound = new Set(bindings.map((b) => b.fact)).size;
notes.push(`[R-32] projection, stated as a BOUND and not a count: at most ${stemBound} new properties (one per distinct fact) and at least 0 (every fact could in principle bind an existing property). No number between the two is printed, because a number between them is an invented reuse rate — [R-29].`);

// ---------------------------------------------------------------------------------------
// A3  Category read from the entry; middle categories must declare their own scope.
// ---------------------------------------------------------------------------------------
const namesKey = (entry, key) => coverage.get(entry.id)?.get(key) || null;
const derived = [];
for (const b of bindings) {
  const e = entryById.get(b.entry);
  if (!e) { STOP('A3', `"${b.key}" names entry ${b.entry}, which does not exist in the classification.`); continue; }
  const how = namesKey(e, b.key);

  const cat = e.category;
  let scope, basis, hs_name;

  if (cat === REUSE_CATEGORY) {
    if (e.scope !== 'reuse') { STOP('A3', `${b.entry} is ${REUSE_CATEGORY} and its entry declares scope "${e.scope}". On this form exact MEANS reuse; an exact entry that does not say so is a category and a decision disagreeing.`); continue; }
    if (!e.reuse_of) { STOP('A3', `${b.entry} is ${REUSE_CATEGORY} and names no reuse_of. On a form with TWO predecessor prefixes there is no default to fall back on.`); continue; }
    scope = 'reuse';
    hs_name = e.reuse_of;
    basis = `category ${REUSE_CATEGORY} + subject class ${classByKey.get(b.key)} -> binds the existing ${hs_name.slice(0, hs_name.indexOf('_') + 1)} property, per [R-06]`;
    // THE FACT IS WHAT CHECKS THE NAME. The entry supplies the prefix; the row supplies the
    // tail; a reuse whose name and whose fact describe different things is a STOP.
    if (!hs_name.endsWith(`_${b.fact}`))
      STOP('A9R', `"${b.key}" is classified ${REUSE_CATEGORY}, its entry names reuse_of "${hs_name}" and its row declares fact "${b.fact}". The name does not end with "_${b.fact}", so the entry and the row are describing different properties and nothing here decides which is right.`);
  }
  else if (cat === 'new' || cat === SUBJECT_CATEGORY || cat === SERVICE_CATEGORY || cat === OPERATOR_CATEGORY) {
    scope = 'form-specific';
    basis = cat === 'new' ? `category new -> ${PREFIX}`
      : cat === SUBJECT_CATEGORY ? `category ${SUBJECT_CATEGORY} -> ${PREFIX}, by a per-entry subject ruling A4 refuses to let go unstated`
      : cat === SERVICE_CATEGORY ? `category ${SERVICE_CATEGORY} -> ${PREFIX}; the cell's subject is the Service, so no reuse is conceivable rather than merely absent`
      : `category ${OPERATOR_CATEGORY} -> ${PREFIX}; the key names no printed cell, so there is no printed fact to have a counterpart`;
    hs_name = PREFIX + b.fact;
  }
  else if (MIDDLE.has(cat)) {
    if (!b.scope || !b.scope_reason) { STOP('A3', `"${b.key}" is ${cat}, one of the categories where the wrong call is permanent, and its row declares no ${!b.scope ? 'scope' : 'scope_reason'}. There is no default for this category.`); continue; }
    if (b.scope !== 'reuse' && b.scope !== 'form-specific') { STOP('A3', `"${b.key}" declares scope "${b.scope}", which is neither reuse nor form-specific.`); continue; }
    if (String(b.scope_reason).length < 60) { STOP('A3', `"${b.key}" declares a scope_reason of ${String(b.scope_reason).length} characters. The ruling has to answer whether one property could ever hold two values at one moment; it cannot do that in a phrase.`); continue; }
    if (b.scope === 'reuse') STOP('A3', `"${b.key}" is ${cat} and declares scope "reuse". Only ${REUSE_CATEGORY} binds an existing property on this form; a middle category claiming a reuse would take a name on a correspondence its own category says is not identity.`);
    scope = b.scope; basis = `category ${cat} -> per-row ruling: ${b.scope}`; hs_name = PREFIX + b.fact;
  }
  else { STOP('A3', `"${b.key}" is bound to ${b.entry}, whose category "${cat}" is not one this deriver knows.`); continue; }

  if (!/^[a-z][a-z0-9_]*$/.test(String(b.fact || ''))) { STOP('A11', `"${b.key}" declares fact "${b.fact}", which is not lower-snake-case. HubSpot lowercases stored names, so a mixed-case definition drifts from the portal permanently.`); continue; }
  if (!/^[a-z][a-z0-9_]{0,99}$/.test(hs_name)) { STOP('A11', `derived name "${hs_name}" for "${b.key}" is not a legal HubSpot property name.`); continue; }

  derived.push({ ...b, construct: keySpace.get(b.key), subject_class: classByKey.get(b.key) || null, category: cat, scope, basis, named_by: how, hs_name });
}

// ---------------------------------------------------------------------------------------
// A9S  EVERY REUSE IS A CELL WITH A FIXED SUBJECT. The classification's governing finding,
//      made checkable: an INDEPENDENT cell's subject is the record's, so a property shared with
//      a form whose subject is the FORM'S would hold the wrong legal person's fact on one branch.
// ---------------------------------------------------------------------------------------
for (const d of derived) {
  if (d.scope !== 'reuse') continue;
  if (d.subject_class === 'dependent' || d.subject_class === 'conditional') continue;
  STOP('A9S', `"${d.key}" binds the existing property "${d.hs_name}" and the map classes its cell subject-${d.subject_class ?? 'UNCLASSED'}. Only a dependent or conditional cell has a fixed subject on this form; an independent cell takes its subject from the RECORD, so on the other branch that property would hold a fact about the wrong legal person under a name saying otherwise, permanently. The register's COINCIDE verdict licenses the reuse and does not settle it ([R-29]).`);
}

// ---------------------------------------------------------------------------------------
// A5  ASSERTION ONE: no two derived names collide with each other.
// ---------------------------------------------------------------------------------------
const byName = new Map();
for (const d of derived) byName.set(d.hs_name, [...(byName.get(d.hs_name) || []), d.key]);
const selfCollisions = [];
for (const [n, ks] of byName) if (ks.length > 1) {
  selfCollisions.push({ name: n, keys: ks });
  STOP('A5', `${ks.length} keys derive the same name "${n}": ${ks.join(', ')}. One property cannot hold two of this form's cells.`);
}

// ---------------------------------------------------------------------------------------
// A11C  CASE-INSENSITIVE INJECTIVITY, PROVED ON A PLANTED PAIR.
//
// The check itself is two lines. What makes it worth anything is the plant: A11 already forces
// every name to lower-snake-case, so the real population can never contain a case-differing
// pair, and a check reporting PASS over a population that cannot be non-empty is the vacuous
// guard this engine has removed a dozen of. So a pair that DIFFERS ONLY IN CASE is run through
// the same comparator on every run, and the comparator must catch it. If it stops catching it,
// that is a STOP — the assertion below is then certifying nothing.
// ---------------------------------------------------------------------------------------
const caseIndex = (names) => {
  const m = new Map();
  for (const n of names) m.set(n.toLowerCase(), [...(m.get(n.toLowerCase()) || []), n]);
  return [...m.values()].filter((v) => new Set(v).size > 1);
};
const PLANT = ['irs433d_date1', 'irs433d_Date1'];
const plantCaught = caseIndex(PLANT).length === 1;
if (!plantCaught)
  STOP('A11C', `the case-insensitive comparator did not catch the planted pair ${PLANT.join(' / ')}. Every verdict it gives below is worthless until it does. THIS IS NOT HYPOTHETICAL ON THIS FORM: adapters/pdf/maps/433d.map.json carries _key_overrides precisely because Date1 and Date2 collided with date1 and date2 at map level.`);
const conforming = caseIndex(['irs433d_date1', 'irs433d_date2']).length === 0;
if (!conforming)
  STOP('A11C', 'the case-insensitive comparator reported a collision between two names that differ properly. A comparator that flags everything is [R-10] and gets turned off.');
const caseCollisions = caseIndex(derived.map((d) => d.hs_name));
for (const c of caseCollisions)
  STOP('A11C', `${c.length} derived names differ only in case and are ONE property on HubSpot: ${c.join(', ')}. The second create would fail or overwrite, permanently, on a portal that does not free a name.`);

// ---------------------------------------------------------------------------------------
// A9  ASSERTION THREE: no derived name echoes a name on ANY lie registry. The registries are
//     DISCOVERED — 433-D has none of its own, so a check written against `433d.name-lies.json`
//     would read nothing and report clean, which is [R-17]'s shape.
// ---------------------------------------------------------------------------------------
// EVERY MAP TARGET, BY PATH. A 433-D stem binds BOTH drawn copies, so one key owns two paths
// and both must resolve to it — the mirror is why a lineage occurrence on page 3 names the same
// cell as its twin on page 1.
const keyOfTarget = new Map();
for (const [k, v] of Object.entries(MAP.map || {})) {
  if (k.startsWith('_')) continue;
  for (const p of (Array.isArray(v) ? v : [v])) if (typeof p === 'string') keyOfTarget.set(p, k);
}
if (keyOfTarget.size < 100) STOP('A9', `only ${keyOfTarget.size} widget paths resolved to an input key out of a map binding ${MAP._partition?.bound_writable} targets. The lie registry's per-cell verdict below rests on this index.`);

const stem = (leaf) => String(leaf).replace(/\[\d+\].*$/, '').replace(/\s*\(.*$/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const LIE_FILES = readdirSync('adapters/pdf/maps').filter((f) => f.endsWith('.name-lies.json')).sort();
if (!LIE_FILES.length) STOP('A9', 'no name-lie registry was found in adapters/pdf/maps/. A check that read no registry cannot report that nothing echoed one.');
const activeLies = [];
const controlStems = new Set();
for (const f of LIE_FILES) {
  const doc = R(`adapters/pdf/maps/${f}`);
  for (const e of (doc.entries || [])) {
    if (e.kind === 'lie' || e.kind === 'container') activeLies.push({ ...e, registry: f });
    if (e.kind === 'control') controlStems.add(stem(e.leaf));
  }
}
// AND THE LINEAGE REPORTS' CONTRADICTING OCCURRENCES ARE THE SAME KIND OF OBJECT, read as
// registries in their own right. 433-D has a lineage file too and it is read here.
for (const f of readdirSync('adapters/pdf/maps').filter((x) => /\.lineage(-\w+)?\.json$/.test(x)).sort()) {
  let doc; try { doc = R(`adapters/pdf/maps/${f}`); } catch (e) { if (isStop(e)) throw e; continue; }
  for (const o of (doc.occurrences || [])) {
    if (String(o.verdict || '').toUpperCase().startsWith('CONTRADICTS'))
      // THE CELL IS RESOLVED FROM THE OCCURRENCE'S `path`, NOT LEFT NULL.
      //
      // A lineage occurrence records a WIDGET PATH and no input key. The first draft read
      // `bound_to` only, got null for every 433-D occurrence, and every hit below then came back
      // BENIGN with the reason "the lie sits on another cell" — a TRUE verdict resting on a FALSE
      // statement, which is [R-02] exactly. DLN-01 and DLN-02 sit on `433d_title` and on nothing
      // else. Resolved through the map's own targets, so the reason is a reading.
      activeLies.push({ id: o.id || `lineage:${o.leaf}`, leaf: o.leaf, bound_to: o.bound_to || o.key || keyOfTarget.get(o.path) || null, registry: `${f} (CONTRADICTS occurrence)`, path: o.path });
  }
}
if (!activeLies.length) STOP('A9', `${LIE_FILES.length} registr(ies) were read and not one active lie came out of them. That is not the state of this tree; refusing to report "nothing echoed a lie" from a reading that found no lies to echo.`);
const echoes = [];
for (const lie of activeLies) {
  const s = stem(lie.leaf);
  if (!s || s.length < 4) continue;
  if (lie.bound_to) {
    // WHAT COUNTS AS ECHOING A LIE ON ITS OWN CELL, AND IT IS NOT "CONTAINS THE STEM".
    //
    // The registry records that a LEAF NAME misdescribes a cell. A property ECHOES that lie when
    // it is named for the leaf AND NOTHING ELSE — the fact IS the stem, so the property carries
    // the misdescription forward with nothing to distinguish it. A fact that contains the stem
    // and adds the words that say whose title it is ANSWERS the lie rather than repeating it:
    // `irs_employee_title` is the opposite of the mistake DLN-01 records, and refusing it would
    // be a guard that cannot be satisfied, which is [R-10].
    const d = derived.find((x) => x.key === lie.bound_to);
    if (d && d.fact === s) STOP('A9', `"${lie.bound_to}" derives "${d.hs_name}", whose fact IS the stem of the ACTIVE LIE ${lie.id} sitting on that very cell (leaf ${lie.leaf}, registry ${lie.registry}). The property would be named after what the form CALLS the cell and not after what the cell HOLDS, permanently.`);
  }
  for (const d of derived) if (d.hs_name.includes(s)) {
    const sameCell = lie.bound_to === d.key;
    const answers = sameCell && d.fact !== s;
    const sameForm = String(lie.registry).startsWith('433d.');
    echoes.push({
      lie: lie.id, registry: lie.registry, leaf: lie.leaf, stem: s, key: d.key, hs_name: d.hs_name,
      also_a_control: controlStems.has(s),
      benign: !sameCell || answers,
      reason: sameCell && !answers
        ? 'NOT BENIGN — the lie sits on THIS key and the fact IS its stem. The property would be named after what the form calls the cell rather than after what the cell holds, permanently.'
        : answers
          ? `BENIGN, AND IT ANSWERS THE LIE. ${lie.id} sits on THIS cell and records that the leaf name "${lie.leaf}" misdescribes it. The derived fact is "${d.fact}", not "${s}" — it carries the stem and adds the words that say whose it is, which is the opposite of the mistake the registry records.`
        : sameForm
          ? `BENIGN — the stem is shared but the lie sits on ${lie.bound_to ?? 'another cell'}, not on ${d.key}. Same form, different cell.`
          : `BENIGN — the lie is on another form (${lie.registry}) and sits on ${lie.bound_to ?? 'another cell'}. A leaf name misdescribing one cell on one form says nothing about a name derived from THIS form's printed caption for a different cell.`,
    });
  }
}

// ---------------------------------------------------------------------------------------
// A8  THE TWIN TABLE. A form-specific fact whose shared `irs433_` twin is already live is
//     either a duplicate of a fact the series holds or a category owing a per-row ruling.
// ---------------------------------------------------------------------------------------
const backbone = new Map();
const FIELD_FILES = readdirSync('adapters/hubspot').filter((f) => /^fields\.\w+\.json$/.test(f) && f !== 'fields.registry.json' && f !== 'fields.433d.json').sort();
for (const file of FIELD_FILES) {
  let doc; try { doc = R(`adapters/hubspot/${file}`); } catch (e) { if (isStop(e)) throw e; continue; }
  const form = file.replace(/^fields\./, '').replace(/\.json$/, '');
  for (const p of (doc.properties || [])) if (String(p.hs_name).startsWith('irs433_')) backbone.set(p.hs_name, [...(backbone.get(p.hs_name) || []), form]);
}
if (backbone.size < 50) STOP('A8', `the backbone read only ${backbone.size} shared irs433_ names out of ${FIELD_FILES.length} per-form definition file(s). That is not a series with five provisioned forms; refusing to run the twin check against an input this file could not read.`);

// THE PREDECESSOR’S INPUT KEY FOR A REUSED NAME, read out of the creator’s own definitions
// file. A reuse row records which key on the OTHER form holds this same fact, and inventing
// that value — or leaving it null — would make validate-crosswalk.mjs A6 read the row as a
// creation of a name that already exists, which is what it did to 433-B’s nine reuses on the
// run before that field was populated.
const creatorKeyByName = new Map();
for (const file of FIELD_FILES) {
  let doc; try { doc = R(`adapters/hubspot/${file}`); } catch (e) { if (isStop(e)) throw e; continue; }
  for (const p of (doc.properties || [])) if (!creatorKeyByName.has(p.hs_name)) creatorKeyByName.set(p.hs_name, p.key ?? null);
}
const creatorKeyOf = (name) => creatorKeyByName.get(name) ?? null;
const twins = [];
for (const d of derived) {
  if (d.scope !== 'form-specific') continue;
  const twin = `irs433_${d.fact}`;
  if (!backbone.has(twin)) continue;
  // WHAT ADJUDICATES. Every middle category carries a per-row ruling; the subject category and
  // the Service category each carry a per-entry `subject_reason` A4 refuses to let go unstated.
  // `new` does not adjudicate, and that is the whole use of this check: `new` ASSERTS THERE IS
  // NOTHING TO ADJUDICATE, so a live twin under it is a contradiction inside the file.
  const adjudicated = MIDDLE.has(d.category) || d.category === SUBJECT_CATEGORY || d.category === SERVICE_CATEGORY;
  twins.push({ key: d.key, entry: d.entry, category: d.category, hs_name: d.hs_name, twin, contributors: backbone.get(twin), adjudicated });
  if (!adjudicated) STOP('A8', `"${d.key}" is form-specific under category "${d.category}" and its shared twin "${twin}" is already on the backbone (contributed by ${backbone.get(twin).join('+')}). That category adjudicates nothing about a live twin, so this is either a duplicate of a fact the series already holds or a category that should carry a per-row ruling.`);
}

// ---------------------------------------------------------------------------------------
// A7 / A12  THE PORTAL. No derived name may collide with a live property holding a different
//           fact; headroom is read BEFORE the first create and not after the last.
// ---------------------------------------------------------------------------------------
let portal = null, headroom = null, customCount = null, wouldCreate = null;
const liveHits = [];
if (usePortal) {
  const { hs } = await import('./hs-lib.mjs');
  const all = (await hs('/crm/v3/properties/contacts')).results || [];
  if (!all.length) STOP('A7', 'the portal returned zero contact properties. That is not a portal with 400+ HubSpot-defined properties; refusing to treat an unreadable read as "nothing exists".');
  portal = new Map(all.map((p) => [p.name, p]));
  customCount = all.filter((p) => !p.hubspotDefined).length;
  headroom = CEILING - customCount;
  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').includes(`433-D (input key: ${d.key})`);
  for (const d of derived) {
    if (!portal.has(d.hs_name)) continue;
    const live = portal.get(d.hs_name);
    if (d.scope === 'reuse') {
      liveHits.push({ ...d, live_type: `${live.type}/${live.fieldType}`, benign: true, reason: `EXPECTED — this row is classified ${REUSE_CATEGORY} and binds a property an earlier form created. A reuse that did NOT hit would be the failure.` });
      // AND IT MUST BE THE SAME SHAPE. A reused property cannot be two types, and hs-provision
      // never patches one, so the form would read back whatever is live.
      if (live.type !== d.type || live.fieldType !== d.fieldType)
        STOP('A9R', `"${d.key}" reuses "${d.hs_name}", which is live as ${live.type}/${live.fieldType} and this row declares ${d.type}/${d.fieldType}. A reused property cannot be two types.`);
      continue;
    }
    if (oursByDescription(d)) { liveHits.push({ ...d, live_type: `${live.type}/${live.fieldType}`, benign: true, reason: 'EXPECTED — created by an earlier run of this same pass; its live description names this form and this key.' }); continue; }
    liveHits.push({ ...d, live_type: `${live.type}/${live.fieldType}`, benign: false, reason: 'NOT EXPECTED — a live property under a name this form would create, whose description does not name this form and this key, and whose row claims no reuse.' });
    STOP('A7', `"${d.key}" derives "${d.hs_name}", which already exists on the portal, its row claims no reuse, and its live description does not name this form and this key. Either it is the same fact and the row must say which key it reuses, or it is a different fact and the name is taken.`);
  }
  // A REUSE MUST BIND SOMETHING THAT EXISTS. A reuse naming a property nobody created is not a
  // reuse; it is a creation under the PREDECESSOR's prefix, recording the wrong form as its
  // creator forever, and no guard downstream could tell.
  for (const d of derived) {
    if (d.scope !== 'reuse') continue;
    if (!portal.has(d.hs_name))            // A9R: the reuse target must be LIVE
      STOP('A9R', `"${d.key}" is classified ${REUSE_CATEGORY} and derives "${d.hs_name}", which is NOT live on the portal. A reuse must bind a property that exists; creating it here would record 433-D as the author of a name under another form's prefix, permanently.`);
  }
  // A12  HEADROOM, BEFORE THE FIRST CREATE.
  wouldCreate = derived.filter((d) => d.scope !== 'reuse' && !portal.has(d.hs_name)).length;
  if (wouldCreate > headroom)
    STOP('A12', `this form would create ${wouldCreate} properties and the portal has headroom for ${headroom} (${customCount} custom of a documented ceiling of ${CEILING}). [R-32]: a projection that exceeds the headroom is a STOP and a decision for the Principal, never a partial provisioning run.`);
}

const statusOf = (d) => {
  if (!portal) return 'portal not read';
  const l = portal.get(d.hs_name);
  if (!l) return '**would be created**';
  if (d.scope === 'reuse') return `REUSED - live, created by ${d.hs_name.startsWith('irs433boi_') ? '433-B(OIC)' : '433-A'}`;
  if ((l.description || '').includes(`433-D (input key: ${d.key})`)) return 'created by this pass';
  return 'already live - contributed by another form in the series';
};

// ---------------------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------------------
const L = [];
const say = (s = '') => L.push(s);
const catCount = {};
for (const d of derived) catCount[d.category] = (catCount[d.category] || 0) + 1;
const reuseRows = derived.filter((d) => d.scope === 'reuse');
const newRows = derived.filter((d) => d.scope !== 'reuse');

say('# 433-D property-name derivation');
say(stampFor(usePortal, usePortal ? `portal read; ${derived.length} derived name(s) checked against it` : 'run without --portal; every per-key verdict below is "portal not read"'));
say('');
say(`Produced by \`node adapters/hubspot/derive-names-433d.mjs${usePortal ? ' --portal' : ''}${emit ? ' --emit' : ''}\`. Re-run it and this report regenerates.`);
say('');
say(`Derived from \`adapters/pdf/maps/433d.crosswalk-classification.json\` (${CLS.entries.length} entries) against`);
say(`\`adapters/pdf/maps/433d.map.json\` and \`adapters/hubspot/crosswalk.433d.json\` (${bindings.length} bindings).`);
say(`No name below was typed. A form-specific name is \`${PREFIX}\` plus the row's fact; a REUSE takes its name from the entry's own \`reuse_of\`, asserted to end with \`_<fact>\` so the entry and the row cannot describe different properties.`);
say('');
say('| | |');
say('|---|---|');
say(`| input keys (map key space) | ${keySpace.size - (ENGINE_EXTRA_INPUTS['433d'] || []).length} |`);
say(`| declared engine inputs the map names no cell for | ${(ENGINE_EXTRA_INPUTS['433d'] || []).length} |`);
say(`| **key universe** | **${keySpace.size}** |`);
say(`| bindings | ${bindings.length} |`);
say(`| names derived | ${derived.length} |`);
say(`| **REUSED (an existing property, created by an earlier form)** | **${reuseRows.length}** |`);
say(`| **NEW (\`${PREFIX}\`, this form creates)** | **${newRows.length}** |`);
say('');
say('By construct: ' + Object.entries(derived.reduce((a, d) => ((a[d.construct] = (a[d.construct] || 0) + 1), a), {})).map(([k, v]) => `${k} ${v}`).join(', '));
say('By category: ' + Object.entries(catCount).map(([k, v]) => `${k} ${v}`).join(', '));
say('By subject class: ' + Object.entries(derived.reduce((a, d) => ((a[d.subject_class ?? 'none'] = (a[d.subject_class ?? 'none'] || 0) + 1), a), {})).map(([k, v]) => `${k} ${v}`).join(', '));
say('');

say('## The subject, and why the register does not settle this form');
say('');
say(`> ${SUBJ.the_ruling}`);
say('');
say(`- **This form's subject:** ${SUBJ.this_form}`);
say(`- **Subject register, re-read at run time:** ${OTHERS.map((f) => `433d / ${f} = ${verdicts[f]}`).join('; ')}.`);
say(`- **The triangle, re-read at run time:** 433a / 433b = ${pairVerdict('433a', '433b')}. Two forms this one coincides with are mutually exclusive with each other, which is why the axis alone cannot settle a key.`);
say('');
say(`**A9S** asserts the consequence: every one of the ${reuseRows.length} reuse row(s) is a cell the map classes subject-DEPENDENT or subject-CONDITIONAL, and therefore a cell with a FIXED subject. Not one subject-INDEPENDENT cell reuses anything, on a form whose register verdict licenses reuse against all five predecessors — [R-29].`);
say('');

say('## The reuses, one at a time');
say('');
if (!reuseRows.length) say('**None.**');
else {
  say('| input key | subject class | entry | fact | binds (existing) | live type | ruling |');
  say('|---|---|---|---|---|---|---|');
  for (const d of reuseRows) {
    const live = portal?.get(d.hs_name);
    say(`| \`${d.key}\` | ${d.subject_class} | ${d.entry} | \`${d.fact}\` | \`${d.hs_name}\` | ${live ? `${live.type}/${live.fieldType}` : (portal ? '**ABSENT**' : 'portal not read')} | ${entryById.get(d.entry).scope_reason} |`);
  }
}
say('');

say('## Every key where a counterpart exists and reuse was REFUSED');
say('');
say('> The governing question is not "is this the same fact" but **"would one property serving both forms ever have to hold two different values for one taxpayer at one moment."**');
say('');
const refused = derived.filter((d) => d.scope !== 'reuse' && (d.category === SUBJECT_CATEGORY || MIDDLE.has(d.category)));
say(`${refused.length} key(s) across ${new Set(refused.map((r) => r.entry)).size} entr(ies). Each names the counterpart it declined and why; a refusal with no stated reason is a classifier default, and a default applied without thought would refuse every reuse on a form whose subject coincides with all five.`);
say('');
for (const id of [...new Set(refused.map((r) => r.entry))].sort()) {
  const e = entryById.get(id);
  say(`### ${id} — ${e.category}`);
  say('');
  say(e.why);
  say('');
  if (e.subject_reason) { say(`> **Subject:** ${e.subject_reason}`); say(''); }
  say(`> **Scope:** ${e.scope_reason}`);
  say('');
  for (const r of refused.filter((x) => x.entry === id)) say(`- \`${r.key}\` (subject class **${r.subject_class ?? 'none'}**) -> \`${r.hs_name}\``);
  say('');
}

say('## The categories with no default, entry by entry');
say('');
for (const cat of [...MIDDLE].sort()) {
  const rows = derived.filter((d) => d.category === cat);
  say(`### ${cat} — ${rows.length} key(s), ${rows.filter((r) => r.scope === 'reuse').length} reuse / ${rows.filter((r) => r.scope !== 'reuse').length} form-specific`);
  say('');
  if (!rows.length) { say('_No entry on this form is classified this way._'); say(''); continue; }
  for (const id of [...new Set(rows.map((r) => r.entry))].sort()) {
    say(`**${id}** — ${entryById.get(id).why}`);
    say('');
    say(`> ${entryById.get(id).scope_reason}`);
    say('');
    for (const r of rows.filter((r) => r.entry === id)) say(`- \`${r.key}\` -> \`${r.hs_name}\` (**${r.scope}**)`);
    say('');
  }
}

say('## Assertion A5 — no two derived names collide');
say('');
say(`- ${byName.size} distinct names over ${derived.length} keys. ${selfCollisions.length} collision(s).`);
if (selfCollisions.length) for (const c of selfCollisions) say(`  - **${c.name}**: ${c.keys.join(', ')}`);
say('');

say('## Assertion A11C — case-insensitive injectivity, proved on a planted pair');
say('');
say('HubSpot lowercases a property name silently, so two names differing only in case are ONE property and the second create fails or overwrites — permanently, on a portal that does not free a name.');
say('');
say(`- **The plant:** \`${PLANT.join('\` / \`')}\` — differing only in case. The comparator ${plantCaught ? '**caught it**' : '**DID NOT CATCH IT — STOP**'}.`);
say(`- **The conforming pair:** \`irs433d_date1\` / \`irs433d_date2\` — ${conforming ? 'not flagged, correctly' : '**flagged — STOP**'}. A comparator that flags everything is [R-10] and gets turned off.`);
say(`- **The real population:** ${derived.length} derived names, ${new Set(derived.map((d) => d.hs_name.toLowerCase())).size} distinct under lowercasing. ${caseCollisions.length} collision(s).`);
say('');
say('The plant is not decoration. A11 forces every name to lower-snake-case, so the real population **cannot** contain a case-differing pair, and an assertion reporting PASS over a population that cannot be non-empty is the vacuous guard this engine has removed a dozen of. **This form is where it would have bitten:** `433d.map.json` carries `_key_overrides` because `Date1` and `Date2` collided with `date1` and `date2` at map level, one layer below this one.');
say('');

say('## Assertion A7 — no derived name collides with a live property holding a different fact');
say('');
if (!usePortal) say('- **Portal not read.** Pass `--portal`. This section states nothing about the portal.');
else {
  say(`${liveHits.length} derived name(s) are LIVE on the portal right now. Every hit is reported, benign or not, with its reason.`);
  say('');
  if (!liveHits.length) say('**None.**');
  else {
    say('| input key | derived name | scope | live type | benign | reason |');
    say('|---|---|---|---|---|---|');
    for (const h of liveHits) say(`| \`${h.key}\` | \`${h.hs_name}\` | ${h.scope} | ${h.live_type} | ${h.benign ? 'yes' : '**NO — STOP**'} | ${h.reason} |`);
  }
}
say('');

say('## Assertion A12 — headroom, read before the first create');
say('');
if (!usePortal) say('- **Portal not read.** Pass `--portal`.');
else {
  say(`- Portal holds **${customCount}** custom contact properties against a documented ceiling of **${CEILING}**. **Headroom ${headroom}.**`);
  say(`- This form would create **${wouldCreate}** propert(ies) and reuse **${reuseRows.length}**.`);
  say(`- [R-32]'s pre-classification BOUND was at most ${stemBound} (one per distinct fact) and at least zero. No number between the two was projected, because a number between them is an invented reuse rate ([R-29]).`);
}
say('');

say('## Assertion A9 — no derived name echoes a name on any lie registry');
say('');
say(`${LIE_FILES.length} name-lies registr(ies) read: ${LIE_FILES.join(', ')}, plus every lineage file's CONTRADICTS occurrences. ${activeLies.length} active lie(s) across them.`);
say('');
say('433-D has **no name-lies file of its own**. The registries are DISCOVERED from the tree rather than named, because a check written against `433d.name-lies.json` would have read nothing and reported clean — [R-17]. A run that found no registry, or no lie in any registry, is a STOP.');
say('');
if (!echoes.length) say('**No derived name contains the stem of any active lie, on any registry.**');
else {
  say(`${echoes.length} hit(s), ${echoes.filter((e) => e.benign).length} benign and ${echoes.filter((e) => !e.benign).length} not. **Every hit is reported with its reason, benign or not** — a hit nobody adjudicated and no hit at all must not print the same.`);
  say('');
  say('| lie | registry | leaf | stem | key | derived name | also a control | verdict |');
  say('|---|---|---|---|---|---|---|---|');
  for (const e of echoes) say(`| ${e.lie} | ${e.registry} | \`${e.leaf}\` | \`${e.stem}\` | \`${e.key}\` | \`${e.hs_name}\` | ${e.also_a_control ? 'yes' : 'no'} | ${e.reason} |`);
}
say('');

say('## Assertion A8 — the twin table');
say('');
if (!twins.length) say('**None.** No form-specific derived fact matches a live shared `irs433_` name.');
else {
  say(`${twins.length} of the ${derived.length} derived names have a live shared twin on the backbone.`);
  say('');
  say('| input key | entry | category | derived name | live twin | contributed by | adjudicated |');
  say('|---|---|---|---|---|---|---|');
  for (const t of twins) say(`| \`${t.key}\` | ${t.entry} | ${t.category} | \`${t.hs_name}\` | \`${t.twin}\` | ${t.contributors.join(', ')} | ${t.adjudicated ? 'yes' : '**NO — STOP**'} |`);
}
say('');

say('## Full derivation');
say('');
say('| key | construct | subject class | entry | category | scope | fact | derived name | status |');
say('|---|---|---|---|---|---|---|---|---|');
for (const d of derived) say(`| \`${d.key}\` | ${d.construct} | ${d.subject_class ?? '—'} | ${d.entry} | ${d.category} | ${d.scope} | \`${d.fact}\` | \`${d.hs_name}\` | ${statusOf(d)} |`);
say('');
if (notes.length) { say('## Mechanism notes'); say(''); for (const n of notes) say(`- ${n}`); say(''); }

for (const l of refuseDowngrade({ path: 'adapters/hubspot/433d.naming-derivation.md', wouldVerify: usePortal, label: '433d.naming-derivation.md' })) console.log(l);
writeFileSync('adapters/hubspot/433d.naming-derivation.md', L.join('\n') + '\n');

// ---------------------------------------------------------------------------------------
// EMIT the provisioning definitions, in the shape hs-provision.mjs already reads.
// ---------------------------------------------------------------------------------------
if (emit && !stops.length) {
  const label = (d) => {
    const words = d.fact.replace(/_/g, ' ');
    return `[433-D] ${words.charAt(0).toUpperCase()}${words.slice(1)}`.slice(0, 100);
  };
  // THE GROUP OF A REUSE ROW IS THE CREATOR'S, DERIVED FROM THE NAME AND NOT TYPED. A reused
  // property already sits somewhere and hs-provision.mjs never patches one, so naming this
  // form's group on it would declare a home the property does not have. 433-D is the first form
  // to reuse from TWO creators, so a single predecessor constant cannot answer this either.
  const GROUP_OF_PREFIX = { irs433_: 'irs433', irs433a_: 'irs433a', irs433aoi_: 'irs433aoic', irs433b_: 'irs433b', irs433boi_: 'irs433boic', irs433f_: 'irs433f' };
  const groupOfReuse = (name) => {
    const hit = Object.keys(GROUP_OF_PREFIX).filter((p) => name.startsWith(p)).sort((a, b) => b.length - a.length)[0];
    if (!hit) { STOP('A10', `reuse row derives "${name}", whose prefix matches no known creator group. A definition row cannot declare a home it cannot name.`); return null; }
    return GROUP_OF_PREFIX[hit];
  };
  const creatorOfReuse = (name) => {
    const hit = Object.keys(GROUP_OF_PREFIX).filter((p) => name.startsWith(p)).sort((a, b) => b.length - a.length)[0];
    return hit === 'irs433_' ? '433a' : hit ? hit.replace(/^irs/, '').replace(/_$/, '') : null;
  };
  const props = derived.map((d) => {
    const desc = d.scope === 'reuse'
      ? [
        `Serves Form 433-D (input key: ${d.key}) as well as the form that created it.`,
        `Bound by 433-D under [R-06] — the prefix records which form created the name rather than which form owns it. The cell is subject-${d.subject_class}, so its subject is FIXED by the route or by a conditional and cannot be the wrong legal person on the other branch of the record.`,
        `Crosswalk ${d.entry}, classified ${d.category}.`,
        d.pii ? 'PII - handle per VLP PII rule.' : '',
      ].filter(Boolean).join(' ')
      : [
        `433-D (input key: ${d.key}).`,
        'Specific to Form 433-D.',
        `Crosswalk ${d.entry}, classified ${d.category}.`,
        d.pii ? 'PII - handle per VLP PII rule.' : '',
      ].filter(Boolean).join(' ');
    return {
      key: d.key, fact: d.fact, scope: d.scope, hs_name: d.hs_name, form: '433d', field: d.key,
      label: label(d), description: desc,
      group: d.scope === 'reuse' ? groupOfReuse(d.hs_name) : 'irs433d',
      type: d.type, fieldType: d.fieldType,
      options: d.options || null,
      map_option_by_value: d.map_option_by_value || null,
      pii: !!d.pii, line_ref: null, source: d.construct, type_basis: d.type_basis,
      // 433-D DECLARES NO GROUPS AT ALL — its map has no `groups` block, so no row is a table.
      // Written as null explicitly rather than omitted, because a missing key and a declared
      // absence read the same to a consumer and only one of them is a statement.
      row_shape: null, entry: d.entry, category: d.category, subject_class: d.subject_class,
      // A REUSE DECLARES ITSELF WITH `backbone_key`, the convention already in the tree:
      // validate-crosswalk.mjs A6 reads exactly this field to tell a reuse from a creation, and
      // A5 skips the prefix check on a row that carries it — a row REUSING a name keeps the
      // creator's prefix, so demanding this form's prefix of a rebind would forbid the rebind
      // [R-06] licenses. The value is the PREDECESSOR'S input key, read out of the creator's own
      // definitions file rather than guessed.
      backbone_key: d.scope === 'reuse' ? (creatorKeyOf(d.hs_name) ?? null) : (d.backbone_key ?? null),
      reuse_of: d.scope === 'reuse' ? d.hs_name : null,
      created_by_form: d.scope === 'reuse' ? creatorOfReuse(d.hs_name) : '433d',
      consumed_by: `fill-433d.mjs (input key ${d.key})`,
    };
  });
  const SELF = selfPath(process.argv[1]);
  const gguard = assertGenerator('adapters/hubspot/fields.433d.json', SELF, { adopt: process.argv.includes('--adopt') });
  console.log(`generator guard: adapters/hubspot/fields.433d.json -> ${gguard.verdict}${gguard.declared ? ` (declares ${gguard.declared})` : ''}`);
  writeFileSync('adapters/hubspot/fields.433d.json', JSON.stringify({
    meta: {
      form: '433d', form_revision: MAP.form_revision, catalog: MAP.catalog,
      derived_from: 'adapters/hubspot/crosswalk.433d.json + adapters/pdf/maps/433d.crosswalk-classification.json',
      deriver: 'adapters/hubspot/derive-names-433d.mjs',
      ...generatorMeta(SELF, { generated_from: 'adapters/hubspot/crosswalk.433d.json + adapters/pdf/maps/433d.crosswalk-classification.json' }),
      naming_rule: `exact -> REUSES the property the entry's own \`reuse_of\` names, creating nothing, per [R-06]; every other category -> ${PREFIX}<fact>. A REUSE TAKES ITS PREFIX FROM THE ENTRY AND ITS TAIL FROM THE ROW'S FACT, asserted to agree, because this is the first form in the series to reuse from TWO creators at once and no single predecessor constant can express that. NOTHING HERE IS TYPED: re-running the deriver rebuilds this file, and a category change changes a name.`,
      the_subject_ruling: SUBJ?.the_ruling,
      what_is_new_about_this_form: 'THE SUBJECT REGISTER CALLS 433-D COINCIDE WITH ALL FIVE MAPPED FORMS, INCLUDING WITH TWO IT CALLS MUTUALLY EXCLUSIVE WITH EACH OTHER. That verdict LICENSES reuse and settles none of it, because this form prints no eligibility text and takes its subject from the RECORD. What settles a key is its SUBJECT CLASS: a dependent or conditional cell has a FIXED subject and can be tested; an independent cell cannot, because a property shared with a form whose subject is the FORM’S would hold a fact about the wrong legal person on the other branch. A9S asserts it — every reuse row here is a dependent or conditional cell, and not one independent cell reuses anything.',
      counts: {
        total: props.length,
        reused: props.filter((p) => p.scope === 'reuse').length,
        created_by_this_form: props.filter((p) => p.scope !== 'reuse').length,
        pii: props.filter((p) => p.pii).length,
        _derived_by: 'adapters/hubspot/derive-names-433d.mjs from the rows below, never typed ([R-07]).',
      },
    },
    // ONLY GROUPS A ROW ACTUALLY NAMES ARE DECLARED. A group row that gives no property a home
    // disposes of nothing, and assert-registry-targets.mjs [RT-2] is what found that on 433-B.
    groups: [
      { name: 'irs433', label: 'Form 433 series (shared)', displayOrder: 0 },
      { name: 'irs433boic', label: 'Form 433-B(OIC)', displayOrder: 4 },
      { name: 'irs433d', label: 'Form 433-D', displayOrder: 6 },
    ].filter((g) => props.some((p) => p.group === g.name)),
    properties: props,
  }, null, 1) + '\n');
  console.log(`emitted adapters/hubspot/fields.433d.json — ${props.length} definition(s), ${props.filter((p) => p.scope !== 'reuse').length} to create, ${props.filter((p) => p.scope === 'reuse').length} reused.`);
}

// ---------------------------------------------------------------------------------------
// VERDICT. The success sentence is guarded by the condition it reports on — [R-11].
// ---------------------------------------------------------------------------------------
if (stops.length) {
  console.error(`STOP - ${stops.length} assertion failure(s) deriving 433-D property names:`);
  stops.forEach((s) => console.error(`  ${s}`));
  // halt(), NOT process.exit(). [XC-1]: this file reaches the portal, and process.exit() after a
  // request aborts the process before the declared code reaches the caller — a tool that failed
  // its assertions reporting a code nobody set. halt() jumps and the code it declares is the one
  // the caller sees.
  halt(2);
}
console.log(`433-D naming derivation: ${derived.length} name(s) from ${keySpace.size} input key(s) — ${reuseRows.length} reuse, ${newRows.length} form-specific.`);
console.log(`  A11C proved on a planted case-differing pair; ${caseCollisions.length} case collision(s) in the real population.`);
console.log(`  wrote adapters/hubspot/433d.naming-derivation.md`);
