// DERIVE the HubSpot property name for every bound key on 433-B, and assert the result.
//
//   node adapters/hubspot/derive-names-433b.mjs            # offline: A0-A6, A9-A11, A13
//   node adapters/hubspot/derive-names-433b.mjs --portal   # adds A7, A8 and A12 against the portal
//   node adapters/hubspot/derive-names-433b.mjs --portal --emit
//
// WHY A DERIVER AND NOT A TABLE OF NAMES
// --------------------------------------
// A HubSpot property name cannot be renamed after creation. So the name is never typed: it is
// computed from the crosswalk classification's CATEGORY for the key, read out of
// 433b.crosswalk-classification.json at run time. crosswalk.433b.json binds a key to an ENTRY
// and names a FACT; this file turns (category, scope, fact) into a name. A category and a name
// therefore cannot disagree, because only one of them exists.
//
// THE THING THIS FORM DOES THAT NO FORM BEFORE IT DID: IT REUSES.
// ---------------------------------------------------------------
// Every predecessor came out 100% form-specific, and `exact` was a branch that had never fired.
// adapters/pdf/maps/_subjects.cross-form.json records 433-B / 433-B(OIC) as COINCIDE, so [R-06]'s
// prefix half applies here for the first time:
//
//     "irs433boi_ records WHICH FORM CREATED A NAME, not which form owns it, and where 433-B
//      and 433-B(OIC) share a fact about the same subject, 433-B binds the existing property,
//      PREFIX AND ALL."
//
// So on this form `exact` derives an EXISTING irs433boi_ name and creates nothing:
//
//   exact                             -> irs433boi_<fact>   REUSE. Must already exist. A9R.
//   new                               -> irs433b_<fact>     form-specific
//   superset                          |
//   asymmetric-the-other-way          |
//   different-predicate-same-caption  |  the row MUST declare scope + scope_reason.
//   different-arithmetic-same-name    |  No default. A row without them is a STOP.
//   different-shape                   |
//   same-fact-different-decomposition |
//
// `asymmetric-the-other-way` IS A BINDING CATEGORY HERE, AND ON 433-B(OIC) IT WAS NOT.
// derive-names-433boi.mjs STOPs on any row in it, because there it meant "a predecessor prints
// this and this form does not", which can bind no key. On 433-B it means something else and the
// difference is the whole point of the category: the predecessor's QUESTION IS THE WIDER ONE
// (433-B(OIC) asks about litigation "currently, or in the past"; 433-B asks "is the business a
// party to a lawsuit"), while this form still prints its own cells and still needs properties for
// them. Treated as one of the middle categories — no default, a per-row ruling required — rather
// than as a STOP or as a free-standing pass.
//
// THE PREFIX PAIR IS ASSERTED, NOT ASSUMED. `irs433b_` and `irs433boi_` differ, but only by the
// underscore: `"irs433boi_business_name".startsWith("irs433b")` is TRUE and
// `.startsWith("irs433b_")` is FALSE. A13 below asserts exactly that, because a prefix test
// written without the underscore would classify all 113 of 433-B(OIC)'s properties as this
// form's and every collision check downstream would then be asking about the wrong set.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { refuseDowngrade, stampFor } from './no-downgrade.mjs';
import { assertGenerator, generatorMeta, selfPath } from './generator-guard.mjs';
import { keySpaceOf, coverageOf, ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';
import { slotColumnsOf } from '../pdf/check-row-shape.mjs';
import { isStop } from './hs-lib.mjs';

const argv = process.argv.slice(2);
const usePortal = argv.includes('--portal');
const emit = argv.includes('--emit');

const R = (p) => JSON.parse(readFileSync(p, 'utf8'));
const MAP = R('adapters/pdf/maps/433b.map.json');
const CLS = R('adapters/pdf/maps/433b.crosswalk-classification.json');
const XW = R('adapters/hubspot/crosswalk.433b.json');

const PREFIX = 'irs433b_';
const PREDECESSOR_PREFIX = 'irs433boi_';
const REUSE_CATEGORY = 'exact';
const SUBJECT_CATEGORY = 'same-question-different-subject';
// The categories with NO DEFAULT. A row in one of these must carry its own scope and reason.
const MIDDLE = new Set([
  'superset', 'asymmetric-the-other-way', 'different-predicate-same-caption',
  'different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition',
]);
const stops = [];
const notes = [];
const STOP = (id, msg) => stops.push(`[${id}] ${msg}`);

// ---------------------------------------------------------------------------------------
// A13  THE PREFIX PAIR. Asserted before anything is derived, because every later check that
//      asks "is this one of ours" rests on it.
// ---------------------------------------------------------------------------------------
if (PREDECESSOR_PREFIX.startsWith(PREFIX))
  STOP('A13', `"${PREDECESSOR_PREFIX}" starts with "${PREFIX}". Every name the predecessor created would be read as this form's and no collision check below would be asking about the right set.`);
if (!`${PREDECESSOR_PREFIX}business_name`.startsWith('irs433b') || `${PREDECESSOR_PREFIX}business_name`.startsWith(PREFIX))
  STOP('A13', 'the prefix pair does not behave as this file documents: the underscore is what separates them and a test written without it would match both.');

// ---------------------------------------------------------------------------------------
// A0/A1/A2  THE KEY SPACE AND THE COVERAGE, from the shared module rather than re-derived.
// ---------------------------------------------------------------------------------------
const { keySpace } = keySpaceOf(MAP);
for (const k of (ENGINE_EXTRA_INPUTS['433b'] || [])) if (!keySpace.has(k)) keySpace.set(k, 'engine');
const bindings = XW.bindings || [];
if (!bindings.length) STOP('A0', 'crosswalk.433b.json carries no bindings. Nothing was derived, and an empty derivation is not a derivation that found nothing.');

const boundKeys = new Set(bindings.map((b) => b.key));
for (const k of keySpace.keys()) if (!boundKeys.has(k)) STOP('A1', `engine input "${k}" has no crosswalk row. The engine reads it and no property would hold it.`);
for (const b of bindings) if (!keySpace.has(b.key)) STOP('A1', `crosswalk row "${b.key}" is not an engine input. A property would be provisioned for a cell nothing reads.`);

const { coverage, problems: coverageProblems, notes: coverageNotes } = coverageOf(CLS, MAP, '433b');
for (const p of coverageProblems) STOP('A2', p);
notes.push(...coverageNotes);
const entryById = new Map(CLS.entries.map((e) => [e.id, e]));
const namesKey = (entry, key) => coverage.get(entry.id)?.get(key) || null;

// ---------------------------------------------------------------------------------------
// A4  THE SUBJECT RULING, ASSERTED RATHER THAN TRUSTED — and on this form it licenses reuse,
//     which makes asserting it more important rather than less.
// ---------------------------------------------------------------------------------------
const SUBJ = CLS.subject;
if (!SUBJ || typeof SUBJ.the_ruling !== 'string' || typeof SUBJ.this_form !== 'string' || typeof SUBJ.the_predecessor !== 'string')
  STOP('A4', 'the classification declares no usable `subject` block. Every reuse on this form rests on that ruling, and a reuse with no recorded ruling behind it is a permanent binding nobody decided.');

// THE SUBJECT REGISTER IS THE INPUT, NOT THIS FILE'S OPINION. [R-06] and prompt-50 ruling 1
// both say the coincidence is established from the register; asserting it here means a change
// to the register that contradicted the classification would STOP rather than provision.
const SUBJECTS = R('adapters/pdf/maps/_subjects.cross-form.json');
// THE FIELD IS `relation` AND THE LOOKUP SAYS SO. A reader that guessed at the key name would
// return undefined for every pair and A4 would then STOP on all four — loud, but for the wrong
// reason, and the first draft of this function did exactly that. The shape is asserted before it
// is trusted, so "the register does not say COINCIDE" and "this file cannot read the register"
// stay different facts ([R-17]).
if (!Array.isArray(SUBJECTS.pairs) || !SUBJECTS.pairs.length)
  STOP('A4', '_subjects.cross-form.json carries no `pairs` array. The subject register is the INPUT to every reuse on this form and this file could not read it.');
else if (!SUBJECTS.pairs.every((p) => p.a && p.b && p.relation))
  STOP('A4', '_subjects.cross-form.json has rows without `a`, `b` or `relation`. The register\'s shape is not what this reader assumes, so no verdict below is a reading.');
const pairVerdict = (a, b) => {
  const hit = (SUBJECTS.pairs || []).find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));
  return hit ? hit.relation : null;
};
const vB_BOI = pairVerdict('433b', '433boi');
if (vB_BOI !== 'COINCIDE')
  STOP('A4', `the subject register says 433b / 433boi is ${JSON.stringify(vB_BOI)}, not COINCIDE. Every reuse on this form is licensed by that verdict; without it no key may bind an existing property.`);
for (const other of ['433a', '433f', '433aoi']) {
  const v = pairVerdict('433b', other);
  if (v !== 'MUTUALLY EXCLUSIVE')
    STOP('A4', `the subject register says 433b / ${other} is ${JSON.stringify(v)}, not MUTUALLY EXCLUSIVE. The classification excludes ${other} as a reuse candidate on the strength of that verdict.`);
}
// AND EVERY same-question-different-subject ENTRY MUST NAME THE TWO SUBJECTS. The category
// derives a form-specific name from a default; a default with no recorded ruling behind it is
// the thing the middle categories exist to forbid, so the ruling is required and its length is
// checked — a phrase cannot name two subjects and the state of the world in which they differ.
for (const e of CLS.entries) {
  if (e.category !== SUBJECT_CATEGORY) continue;
  if (!e.subject_reason || String(e.subject_reason).length < 120)
    STOP('A4', `${e.id} is ${SUBJECT_CATEGORY} and its subject_reason is ${e.subject_reason ? String(e.subject_reason).length + ' characters' : 'absent'}. The category derives a form-specific name from a default, so each entry has to name the two subjects and the state of the world in which they hold different values.`);
  // AND IT MUST NAME THE FORM IT IS COMPARED AGAINST. An entry in this category whose
  // compared_against lists only 433boi is claiming a subject difference with a form the register
  // says COINCIDES with this one — which is the opposite of what the category means.
  const others = (e.compared_against || []).filter((f) => f !== '433boi');
  if (!others.length)
    STOP('A4', `${e.id} is ${SUBJECT_CATEGORY} and its compared_against names only 433boi, whose subject the register says COINCIDES with this form's. The category means the counterpart belongs to a MUTUALLY EXCLUSIVE subject, so the entry must name the form that carries it.`);
  for (const f of others) {
    const v = pairVerdict('433b', f);
    if (v !== 'MUTUALLY EXCLUSIVE')
      STOP('A4', `${e.id} is ${SUBJECT_CATEGORY} and names ${f} in compared_against, and the register says 433b / ${f} is ${JSON.stringify(v)}. The category rests on the subjects being mutually exclusive.`);
  }
}

// ---------------------------------------------------------------------------------------
// THE PREDECESSOR'S PROVISIONED NAMES — the only set a reuse may bind.
// ---------------------------------------------------------------------------------------
const BOI = R('adapters/hubspot/fields.433boi.json');
const boiByName = new Map((BOI.properties || []).map((p) => [p.hs_name, p]));
if (boiByName.size < 100)
  STOP('A9R', `fields.433boi.json yielded only ${boiByName.size} properties. That is not the 113-property definition file this form reuses from; refusing to check reuses against an input this file could not read.`);

// ---------------------------------------------------------------------------------------
// A3  Category read from the entry; middle categories must declare their own scope.
// ---------------------------------------------------------------------------------------
const derived = [];
for (const b of bindings) {
  const e = entryById.get(b.entry);
  if (!e) { STOP('A3', `"${b.key}" names entry ${b.entry}, which does not exist in the classification.`); continue; }
  const how = namesKey(e, b.key);
  if (!how) STOP('A2', `"${b.key}" is bound to ${b.entry}, and ${b.entry}'s own oic field does not name it — not verbatim, not by any declared mechanism. Either the entry does not cover this key or the mechanism is undeclared.`);

  const cat = e.category;
  let scope, basis, hs_name;

  if (cat === REUSE_CATEGORY) {
    // THE BRANCH THAT HAD NEVER FIRED IN THIS SERIES.
    if (e.scope !== 'reuse') { STOP('A3', `${b.entry} is ${REUSE_CATEGORY} and its entry declares scope "${e.scope}". On this form exact MEANS reuse; an exact entry that does not say so is a category and a decision disagreeing.`); continue; }
    scope = 'reuse';
    basis = `category ${REUSE_CATEGORY} + subject register COINCIDE -> binds the existing ${PREDECESSOR_PREFIX} property, per [R-06]`;
    hs_name = PREDECESSOR_PREFIX + b.fact;
    // A9R  A REUSE MUST BIND SOMETHING THAT EXISTS. A reuse naming a property nobody created is
    // not a reuse — it is a creation under the predecessor's prefix, which would attribute this
    // form's new property to the form that did not make it, permanently.
    if (!boiByName.has(hs_name))
      STOP('A9R', `"${b.key}" is classified ${REUSE_CATEGORY} and derives "${hs_name}", which does NOT exist in fields.433boi.json. A reuse must bind a property that exists; this would create one under the predecessor's prefix and record the wrong form as its creator forever.`);
    else {
      const p = boiByName.get(hs_name);
      // AND IT MUST BE THE SAME SHAPE. Reusing a property whose type disagrees means one of the
      // two forms writes a value the other cannot read back.
      if (p.type !== b.type || p.fieldType !== b.fieldType)
        STOP('A9R', `"${b.key}" reuses "${hs_name}", which is live as ${p.type}/${p.fieldType} and this row declares ${b.type}/${b.fieldType}. A reused property cannot be two types, and hs-provision.mjs never patches one, so the form would read whatever is live.`);
      if (!e.reuse_of || !e.reuse_of.includes(hs_name))
        STOP('A9R', `"${b.key}" derives the reuse "${hs_name}" and its entry ${b.entry} does not name it in \`reuse_of\`. The entry is where the decision is recorded; a reuse the entry does not name is one nobody ruled.`);
    }
  }
  else if (cat === 'new') { scope = 'form-specific'; basis = `category new -> ${PREFIX}`; hs_name = PREFIX + b.fact; }
  else if (cat === SUBJECT_CATEGORY) {
    // THE EIGHTH CATEGORY, AND WHY IT IS NOT A HIDING PLACE. It derives a form-specific name
    // from a DEFAULT, which is what the middle categories are forbidden from doing. The
    // difference is that its default has one recorded ruling behind it — the subject register's
    // MUTUALLY EXCLUSIVE verdict against the form that carries the counterpart — and A4 asserts
    // the consequence rather than trusting it.
    scope = 'form-specific';
    basis = `category ${SUBJECT_CATEGORY} -> ${PREFIX}, by the subject register's MUTUALLY EXCLUSIVE verdict against the form that carries the counterpart`;
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

  derived.push({ ...b, construct: keySpace.get(b.key), category: cat, scope, basis, named_by: how, hs_name });
}

// ---------------------------------------------------------------------------------------
// A5  ASSERTION ONE OF THE THREE: no two derived names collide with each other.
// ---------------------------------------------------------------------------------------
const byName = new Map();
for (const d of derived) byName.set(d.hs_name, [...(byName.get(d.hs_name) || []), d.key]);
const selfCollisions = [];
for (const [n, ks] of byName) if (ks.length > 1) {
  selfCollisions.push({ name: n, keys: ks });
  STOP('A5', `${ks.length} keys derive the same name "${n}": ${ks.join(', ')}. One property cannot hold two of this form's cells.`);
}

// ---------------------------------------------------------------------------------------
// A6  The row shape a group property declares is the map's slot columns, not a guess.
// ---------------------------------------------------------------------------------------
// THE ROW SHAPE COMES FROM THE CANONICAL READER, NOT FROM A SECOND IMPLEMENTATION.
//
// The first draft of this function rolled its own: `Object.keys(slot.text)` plus
// `Object.keys(slot.checkbox || slot.check)`. 433-B's slots spell that sub-key `checkboxes`, so
// `used_as_collateral` was dropped from the row shape of `investments` and `digital_assets` —
// two columns the map's slots DO declare, which a stored row would then carry no key for and
// which would print empty with no error. assert-intake-keys.mjs caught it as ROW SHAPE SHORT the
// moment 433-B's bindings started resolving.
//
// A REIMPLEMENTATION IS A NEW INSTRUMENT AND IS NOT EVIDENCE ABOUT THE OLD ONE — the sentence
// classification-coverage.mjs's header is built around. adapters/pdf/check-row-shape.mjs is what
// assert-intake-keys, the fetch layer and the gate all read a row shape with; this now reads it
// with the same one, so the four cannot disagree about what a row is. It also picks up
// `row_composites`, which the hand-rolled version knew nothing about.
const slotCols = (key) => {
  const cols = slotColumnsOf(MAP, key);
  if (!cols) { STOP('A6', `"${key}" is a group source key and no group in the map declares it.`); return null; }
  if (!cols.length) { STOP('A6', `group source "${key}" resolves to a group whose slots declare no columns.`); return null; }
  return cols;
};

// ---------------------------------------------------------------------------------------
// A9  ASSERTION THREE OF THE THREE: no derived name echoes a name on ANY lie registry.
//
// "ANY" IS THE WORD AND IT IS LOAD-BEARING. 433-B has no name-lies file of its own — the
// lineage report is where its inherited-name verdicts live — so a check written against
// `433b.name-lies.json` would read nothing and report clean, which is [R-17]'s shape. The
// registries are DISCOVERED, every one in the tree is read, and the count is printed; a run
// that found no registry at all is a STOP rather than a pass.
// ---------------------------------------------------------------------------------------
const stem = (leaf) => String(leaf).replace(/\[\d+\].*$/, '').replace(/\s*\(.*$/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const LIE_FILES = ['433aoi.name-lies.json', '433boi.name-lies.json', '433b.name-lies.json']
  .filter((f) => existsSync(`adapters/pdf/maps/${f}`));
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
// AND THE LINEAGE REPORT'S CONTRADICTING OCCURRENCES ARE THE SAME KIND OF OBJECT. 433-B's own
// inherited-name findings live there rather than in a name-lies file, and an occurrence judged
// CONTRADICTS is a leaf name that means something other than what it says — which is what a lie
// registry records. Read as a fourth registry and labelled as such.
const LINEAGE = R('adapters/pdf/maps/433b.lineage.json');
for (const o of (LINEAGE.occurrences || [])) {
  if (String(o.verdict || '').toUpperCase().startsWith('CONTRADICTS'))
    activeLies.push({ id: o.id || `lineage:${o.leaf}`, leaf: o.leaf, bound_to: o.bound_to || o.key || null, registry: '433b.lineage.json (CONTRADICTS occurrence)' });
}
const echoes = [];
for (const lie of activeLies) {
  const s = stem(lie.leaf);
  if (!s || s.length < 4) continue;
  if (lie.bound_to) {
    const d = derived.find((x) => x.key === lie.bound_to);
    if (d && d.hs_name.includes(s)) STOP('A9', `"${lie.bound_to}" derives "${d.hs_name}", which echoes the ACTIVE LIE ${lie.id} sitting on that very cell (leaf ${lie.leaf}, registry ${lie.registry}). The property would be named after what the form calls the cell and not after what the cell holds, permanently.`);
  }
  for (const d of derived) if (d.hs_name.includes(s)) {
    // EVERY HIT IS CLASSIFIED AND EVERY CLASSIFICATION CARRIES ITS REASON, benign or not —
    // prompt-50 ruling 4. A hit reported as a bare table row is a hit nobody adjudicated, and
    // "no hits" and "hits nobody looked at" must not print the same.
    //
    // A hit is BENIGN when the lie is on ANOTHER FORM and sits on a cell this key is not. The
    // lie registry records that a LEAF NAME misdescribes ONE CELL; a derived name sharing that
    // stem is only echoing the lie if it is naming that cell, or a cell whose caption the same
    // stem misdescribes. `bound_to` is what tells the two apart, and the per-cell STOP above is
    // the branch that fires when they are the same cell.
    const sameCell = lie.bound_to === d.key;
    const sameForm = String(lie.registry).startsWith('433b.');
    echoes.push({
      lie: lie.id, registry: lie.registry, leaf: lie.leaf, stem: s, key: d.key, hs_name: d.hs_name,
      also_a_control: controlStems.has(s),
      benign: !sameCell,
      reason: sameCell
        ? `NOT BENIGN — the lie sits on THIS key. The property would be named after what the form calls the cell rather than after what the cell holds, permanently.`
        : sameForm
          ? `BENIGN — the stem is shared but the lie sits on ${lie.bound_to ?? 'another cell'}, not on ${d.key}. Same form, different cell.`
          : `BENIGN — the lie is on another form (${lie.registry}) and sits on ${lie.bound_to ?? 'another cell'}. A leaf name misdescribing one cell on one form says nothing about a name derived from THIS form's printed caption for a different cell.`,
    });
  }
}

// ---------------------------------------------------------------------------------------
// THE BACKBONE, AND THE TWIN TABLE. Same instrument as the predecessor's, one prefix along.
// ---------------------------------------------------------------------------------------
const backbone = new Map();
for (const [file, form] of [['fields.433a.json', '433a'], ['fields.433f.json', '433f'], ['fields.433aoi.json', '433aoi']]) {
  let doc; try { doc = R(`adapters/hubspot/${file}`); } catch (e) { if (isStop(e)) throw e; continue; }
  for (const p of (doc.properties || [])) if (String(p.hs_name).startsWith('irs433_')) backbone.set(p.hs_name, [...(backbone.get(p.hs_name) || []), form]);
}
if (backbone.size < 50) STOP('A8', `the backbone read only ${backbone.size} shared irs433_ names out of the three per-form definition files. That is not a series with three provisioned forms; refusing to run the twin check against an input this file could not read.`);
const twins = [];
for (const d of derived) {
  if (d.scope !== 'form-specific') continue;
  const twin = `irs433_${d.fact}`;
  if (!backbone.has(twin)) continue;
  // WHAT COUNTS AS ADJUDICATED, AND WHY `same-question-different-subject` DOES.
  //
  // Every middle category adjudicates because every one of them carries a PER-ROW ruling. The
  // subject category adjudicates too, on a different instrument: A4 above refuses any entry in
  // it whose `subject_reason` is under 120 characters AND any entry whose `compared_against`
  // does not name a form the register calls MUTUALLY EXCLUSIVE. So a live twin under it has
  // been ruled on — by the entry, against the register — rather than passed over.
  //
  // `new` does not adjudicate, and that is the whole use of this check: `new` ASSERTS THERE IS
  // NOTHING TO ADJUDICATE. A live twin under it is a contradiction in the file, and eleven of
  // them were exactly that — six entries calling facts new that 433-A prints. They are the
  // subject category now, and this line is what moved them.
  const adjudicated = MIDDLE.has(d.category) || d.category === SUBJECT_CATEGORY;
  twins.push({ key: d.key, entry: d.entry, category: d.category, hs_name: d.hs_name, twin, contributors: backbone.get(twin), adjudicated });
  if (!adjudicated) STOP('A8', `"${d.key}" is form-specific under category "${d.category}" and its shared twin "${twin}" is already on the backbone (contributed by ${backbone.get(twin).join('+')}). That category adjudicates nothing about a live twin, so this is either a duplicate of a fact the series already holds or a category that should carry a per-row ruling.`);
}

// ---------------------------------------------------------------------------------------
// A7  ASSERTION TWO OF THE THREE: no derived name collides with a LIVE property holding a
//     different fact. A12: headroom, before the first create and not after the last.
// ---------------------------------------------------------------------------------------
let portal = null;
const liveHits = [];
if (usePortal) {
  const { hs } = await import('./hs-lib.mjs');
  const all = (await hs('/crm/v3/properties/contacts')).results || [];
  if (!all.length) STOP('A7', 'the portal returned zero contact properties. That is not a portal with 400+ HubSpot-defined properties; refusing to treat an unreadable read as "nothing exists".');
  portal = new Map(all.map((p) => [p.name, p]));
  // NAMES THIS FORM AND THIS KEY — not BEGINS WITH them. This form is not broken today,
  // because A7 returns on every `scope === "reuse"` row before reaching this predicate and
  // the reuses are the only rows whose descriptions name two forms. It is the SAME LATENT
  // DEFECT as the one [D-18]'s fourth instance made live on 433-B(OIC), and it goes live the
  // first time any later form re-describes an irs433b_ property this form created. Repaired
  // in the same place and the same commit, because a class repaired on one form and left on
  // its neighbour is the reproduction [R-12] says to expect.
  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').includes(`433-B (input key: ${d.key})`);
  for (const d of derived) {
    if (!portal.has(d.hs_name)) continue;
    const live = portal.get(d.hs_name);
    // A REUSE IS SUPPOSED TO HIT. That is what makes it a reuse, and reporting it as a collision
    // would be the guard tuned to fire constantly that [R-10] says gets turned off. It is
    // reported in the hit table with its reason, so nothing is silent.
    if (d.scope === 'reuse') { liveHits.push({ ...d, live_type: `${live.type}/${live.fieldType}`, benign: true, reason: `EXPECTED — this row is classified ${REUSE_CATEGORY} and binds the property 433-B(OIC) created. A reuse that did NOT hit would be the failure.` }); continue; }
    if (oursByDescription(d)) { liveHits.push({ ...d, live_type: `${live.type}/${live.fieldType}`, benign: true, reason: 'EXPECTED — created by an earlier run of this same pass; its live description names this form and this key.' }); continue; }
    liveHits.push({ ...d, live_type: `${live.type}/${live.fieldType}`, benign: false, reason: 'NOT EXPECTED — a live property under a name this form would create, whose description does not name this form and this key, and whose row claims no reuse.' });
    STOP('A7', `"${d.key}" derives "${d.hs_name}", which already exists on the portal, its row claims no reuse, and its live description does not name this form and this key. Either it is the same fact and the row must say which key it reuses, or it is a different fact and the name is taken.`);
  }
  portal.custom = all.filter((p) => !p.hubspotDefined);
}
const statusOf = (d) => {
  if (!portal) return 'portal not read';
  const l = portal.get(d.hs_name);
  if (!l) return '**would be created**';
  if (d.scope === 'reuse') return 'REUSED - live, created by 433-B(OIC)';
  // The same reading as A7's, for the same reason.
  if ((l.description || '').includes(`433-B (input key: ${d.key})`)) return 'created by this pass';
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

say('# 433-B property-name derivation');
say(stampFor(usePortal, usePortal ? `portal read; ${derived.length} derived name(s) checked against it` : 'run without --portal; every per-key verdict below is "portal not read"'));
say('');
// THE PRODUCING TOOL, NAMED IN THE REPORT ITSELF. sweep-boundary [SB-14] excuses these files
// from count-sweep on the ground that each describes ONE RUN against a live external system, and
// its crosscheck asks the checkable half of that: a document naming no tool is not a run report,
// and the excusal does not cover it. Written here rather than left to be inferred.
say(`Produced by \`node adapters/hubspot/derive-names-433b.mjs${usePortal ? ' --portal' : ''}${emit ? ' --emit' : ''}\`. Re-run it and this report regenerates.`);
say('');
say(`Derived from \`adapters/pdf/maps/433b.crosswalk-classification.json\` (${CLS.entries.length} entries) against`);
say(`\`adapters/pdf/maps/433b.map.json\` and \`adapters/hubspot/crosswalk.433b.json\` (${bindings.length} bindings).`);
say(`No name below was typed. Each is \`${PREFIX}\` or \`${PREDECESSOR_PREFIX}\` plus the row's fact, with the prefix chosen by the entry's CATEGORY and the subject register's verdict.`);
say('');
say('| | |');
say('|---|---|');
say(`| input keys (map key space) | ${keySpace.size - (ENGINE_EXTRA_INPUTS['433b'] || []).length} |`);
say(`| declared engine inputs the map names no cell for | ${(ENGINE_EXTRA_INPUTS['433b'] || []).length} |`);
say(`| **key universe** | **${keySpace.size}** |`);
say(`| bindings | ${bindings.length} |`);
say(`| names derived | ${derived.length} |`);
say(`| **REUSED (\`${PREDECESSOR_PREFIX}\`, created by 433-B(OIC))** | **${reuseRows.length}** |`);
say(`| **NEW (\`${PREFIX}\`, this form creates)** | **${newRows.length}** |`);
say('');
say('By construct: ' + Object.entries(derived.reduce((a, d) => ((a[d.construct] = (a[d.construct] || 0) + 1), a), {})).map(([k, v]) => `${k} ${v}`).join(', '));
say('By category: ' + Object.entries(catCount).map(([k, v]) => `${k} ${v}`).join(', '));
say('');

say('## The reuse, which is the first in this series');
say('');
say(`> ${SUBJ.the_ruling}`);
say('');
say(`- **This form's subject:** ${SUBJ.this_form}`);
say(`- **The predecessor:** ${SUBJ.the_predecessor}`);
say(`- **Subject register, re-read at run time:** 433b / 433boi = ${vB_BOI}; 433b / 433a, 433f, 433aoi = MUTUALLY EXCLUSIVE.`);
say('');
say(`${reuseRows.length} of ${derived.length} keys bind a property that already exists. Each one is asserted to exist in \`fields.433boi.json\`, to carry the same type and fieldType, and to be named by its entry's own \`reuse_of\`.`);
say('');
say('| input key | entry | fact | binds (existing) | live type | ruling |');
say('|---|---|---|---|---|---|');
for (const d of reuseRows) {
  const p = boiByName.get(d.hs_name);
  say(`| \`${d.key}\` | ${d.entry} | \`${d.fact}\` | \`${d.hs_name}\` | ${p ? `${p.type}/${p.fieldType}` : '**ABSENT**'} | ${entryById.get(d.entry).scope_reason} |`);
}
say('');

say('## The categories with no default, entry by entry');
say('');
say('> The governing question is not "is this the same fact" but **"would one property serving both forms ever have to hold two different values for one taxpayer at one moment."**');
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

say('## Assertion A9 — no derived name echoes a name on any lie registry');
say('');
say(`${LIE_FILES.length + 1} registr(ies) read: ${[...LIE_FILES, '433b.lineage.json (CONTRADICTS occurrences)'].join(', ')}. ${activeLies.length} active lie(s) across them.`);
say('');
say('433-B has **no name-lies file of its own** — its inherited-name verdicts live in `433b.lineage.json`, where 10 of 17 judged occurrences CONTRADICT the printed column. A check written against `433b.name-lies.json` alone would have read nothing and reported clean, so the registries are discovered and a run that found none is a STOP.');
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
say('| key | construct | entry | category | scope | fact | derived name | status |');
say('|---|---|---|---|---|---|---|---|');
for (const d of derived) say(`| \`${d.key}\` | ${d.construct} | ${d.entry} | ${d.category} | ${d.scope} | \`${d.fact}\` | \`${d.hs_name}\` | ${statusOf(d)} |`);
say('');
if (notes.length) { say('## Mechanism notes'); say(''); for (const n of notes) say(`- ${n}`); say(''); }

for (const l of refuseDowngrade({ path: 'adapters/hubspot/433b.naming-derivation.md', wouldVerify: usePortal, label: '433b.naming-derivation.md' })) console.log(l);
writeFileSync('adapters/hubspot/433b.naming-derivation.md', L.join('\n') + '\n');

// ---------------------------------------------------------------------------------------
// EMIT the provisioning definitions, in the shape hs-provision.mjs already reads.
// ---------------------------------------------------------------------------------------
if (emit && !stops.length) {
  const label = (d) => {
    const words = d.fact.replace(/_/g, ' ');
    return `[433-B] ${words.charAt(0).toUpperCase()}${words.slice(1)}`.slice(0, 100);
  };
  const props = derived.map((d) => {
    const rowShape = d.construct === 'groups' ? slotCols(d.key) : null;
    // A REUSED PROPERTY'S DESCRIPTION NAMES BOTH FORMS IT SERVES — prompt-50 ruling 1, and it
    // is written AT CREATE TIME because hs-provision.mjs never patches a property that exists.
    const desc = d.scope === 'reuse'
      ? [
        `Serves BOTH Form 433-B (input key: ${d.key}) and Form 433-B(OIC) (input key: ${boiByName.get(d.hs_name)?.key ?? 'see fields.433boi.json'}).`,
        'Created by the 433-B(OIC) pass; bound by 433-B under [R-06] — the two forms share this fact about the same subject, the business entity, and the prefix records which form created the name rather than which form owns it.',
        `Crosswalk ${d.entry}, classified ${d.category}.`,
        rowShape ? `JSON array of row objects with keys: ${rowShape.join(', ')}.` : '',
        d.pii ? 'PII - handle per VLP PII rule.' : '',
      ].filter(Boolean).join(' ')
      : [
        `433-B (input key: ${d.key}).`,
        'Specific to Form 433-B.',
        `Crosswalk ${d.entry}, classified ${d.category}.`,
        rowShape ? `JSON array of row objects with keys: ${rowShape.join(', ')}.` : '',
        d.pii ? 'PII - handle per VLP PII rule.' : '',
      ].filter(Boolean).join(' ');
    return {
      key: d.key, fact: d.fact, scope: d.scope, hs_name: d.hs_name, form: '433b', field: d.key,
      label: label(d), description: desc,
      group: d.scope === 'reuse' ? 'irs433boic' : 'irs433b',
      type: d.type, fieldType: d.fieldType,
      options: d.options || null,
      map_option_by_value: d.map_option_by_value || null,
      pii: !!d.pii, line_ref: null, source: d.construct, type_basis: d.type_basis,
      row_shape: rowShape, entry: d.entry, category: d.category,
      // A REUSE DECLARES ITSELF WITH `backbone_key`, WHICH IS THE CONVENTION ALREADY IN THE TREE
      // AND NOT A SECOND ONE INVENTED HERE. validate-crosswalk.mjs A6 reads exactly this field to
      // tell a reuse from a creation, and A5 skips the prefix check on a row that carries it —
      // "a prefix records which form CREATED a name; a row REUSING one keeps the creator's
      // prefix, so demanding this form's prefix of a rebind would forbid the rebind [R-06]
      // licenses". The value is the PREDECESSOR'S INPUT KEY, the same shape as the two 433-A(OIC)
      // rows that cite 433-F keys, one of which is the monthly-rent rebind [R-06] names as its
      // own precedent. Inventing a `reuse_of` field instead would have left A6 reading every one
      // of these nine as a creation of a name that already exists — which is what it did, out
      // loud, on the run before this line.
      backbone_key: d.scope === 'reuse' ? (boiByName.get(d.hs_name)?.key ?? null) : (d.backbone_key ?? null),
      reuse_of: d.scope === 'reuse' ? d.hs_name : null,
      created_by_form: d.scope === 'reuse' ? '433boi' : '433b',
    };
  });
  const SELF = selfPath(process.argv[1]);
  const gguard = assertGenerator('adapters/hubspot/fields.433b.json', SELF, { adopt: process.argv.includes('--adopt') });
  console.log(`generator guard: adapters/hubspot/fields.433b.json -> ${gguard.verdict}${gguard.declared ? ` (declares ${gguard.declared})` : ''}`);
  writeFileSync('adapters/hubspot/fields.433b.json', JSON.stringify({
    meta: {
      form: '433b', form_revision: MAP.form_revision, catalog: MAP.catalog,
      derived_from: 'adapters/hubspot/crosswalk.433b.json + adapters/pdf/maps/433b.crosswalk-classification.json',
      deriver: 'adapters/hubspot/derive-names-433b.mjs',
      ...generatorMeta(SELF, { generated_from: 'adapters/hubspot/crosswalk.433b.json + adapters/pdf/maps/433b.crosswalk-classification.json' }),
      naming_rule: `exact -> REUSES the existing ${PREDECESSOR_PREFIX}<fact>, creating nothing, per [R-06] and the subject register's COINCIDE verdict; new -> ${PREFIX}<fact>; the six categories with no default by a per-row ruling recorded on each crosswalk row. NOTHING HERE IS TYPED: re-running the deriver rebuilds this file, and a category change changes a name.`,
      the_subject_ruling: SUBJ.the_ruling,
      the_reuse_is_the_first_in_this_series: 'Every predecessor came out 100% form-specific because its subject was new. 433-B is the first form whose subject COINCIDES with one already provisioned, so `exact` fires here for the first time and binds properties the irs433boi_ prefix records 433-B(OIC) as having created.',
      counts: {
        total: props.length,
        reused: props.filter((p) => p.scope === 'reuse').length,
        created_by_this_form: props.filter((p) => p.scope !== 'reuse').length,
        pii: props.filter((p) => p.pii).length,
      },
    },
    // ONLY GROUPS A ROW ACTUALLY NAMES ARE DECLARED — the same rule
    // adapters/hubspot/gen-fields-from-map.mjs has always applied, and this deriver did not.
    // fields.433b.json declared `irs433` and not one of its 116 rows names it: every shared
    // fact on this form binds a property 433-B(OIC) already created, and those sit in
    // irs433boic. A group row that gives no property a home disposes of nothing, which is
    // [D-19] facing the other way, and assert-registry-targets.mjs [RT-2] is what found it.
    groups: [
      { name: 'irs433', label: 'Form 433 series (shared)', displayOrder: 0 },
      { name: 'irs433boic', label: 'Form 433-B(OIC)', displayOrder: 4 },
      { name: 'irs433b', label: 'Form 433-B', displayOrder: 5 },
    ].filter((g) => props.some((p) => p.group === g.name)),
    properties: props,
  }, null, 1) + '\n');
  console.log(`emitted adapters/hubspot/fields.433b.json (${props.length} definitions)`);
}

// ---------------------------------------------------------------------------------------
console.log(`433-B naming derivation: ${derived.length} name(s) from ${keySpace.size} input key(s).`);
console.log(`  REUSED ${reuseRows.length} (existing ${PREDECESSOR_PREFIX} properties) / NEW ${newRows.length} (${PREFIX}).`);
console.log(`  live shared twins: ${twins.length} (${twins.filter((t) => !t.adjudicated).length} unadjudicated); lie-registry echoes: ${echoes.length} over ${LIE_FILES.length + 1} registr(ies).`);
if (usePortal) {
  const before = portal.custom.length;
  const toCreate = derived.filter((d) => d.scope !== 'reuse' && !portal.has(d.hs_name));
  console.log(`  live-name hits: ${liveHits.length} (${liveHits.filter((h) => !h.benign).length} not benign).`);
  console.log(`  HEADROOM: portal holds ${before} custom contact properties; this pass would add ${toCreate.length}; ${1000 - before - toCreate.length} left against the documented 1,000 ceiling.`);
  if (before + toCreate.length > 1000) STOP('A12', `this pass would take the portal to ${before + toCreate.length} custom properties, past the 1,000 ceiling. STOPPING before the first create rather than partway through one.`);
}
console.log('  report -> adapters/hubspot/433b.naming-derivation.md');
if (stops.length) {
  console.error(`\nSTOP - ${stops.length} assertion failure(s):`);
  for (const s of stops) console.error('  ' + s);
  process.exitCode = 3;
} else {
  console.log('all assertions passed.');
}
