// DERIVE the HubSpot property name for every bound key on 433-B(OIC), and assert the result.
//
//   node adapters/hubspot/derive-names-433boi.mjs            # offline: A0-A6, A9-A11, A13
//   node adapters/hubspot/derive-names-433boi.mjs --portal   # adds A7, A8 and A12 against the portal
//   node adapters/hubspot/derive-names-433boi.mjs --portal --emit
//
// WHY A DERIVER AND NOT A TABLE OF NAMES
// --------------------------------------
// A HubSpot property name cannot be renamed after creation. So the name is never typed: it is
// computed from the crosswalk classification's CATEGORY for the key, read out of
// 433boi.crosswalk-classification.json at run time. crosswalk.433boi.json binds a key to an
// ENTRY and names a FACT; this file turns (category, subject, fact) into a name. A category and
// a name therefore cannot disagree, because only one of them exists.
//
//   exact                             -> irs433_<fact>       shared across the 433 series
//   new                               -> irs433boi_<fact>    form-specific
//   same-question-different-subject   -> irs433boi_<fact>    form-specific, by the subject ruling
//   superset                          |
//   different-arithmetic-same-name    |  the row MUST declare scope + scope_reason.
//   different-shape                   |  No default. A row without them is a STOP.
//   same-fact-different-decomposition |
//   asymmetric-the-other-way          -> binds no key. A row claiming one is a STOP.
//
// THE EIGHTH CATEGORY, AND WHY IT IS NOT A HIDING PLACE
// -----------------------------------------------------
// `same-question-different-subject` derives a form-specific name from a DEFAULT, which is
// exactly what the middle four are forbidden from doing. The difference is that its default has
// one recorded ruling behind it, in the classification's `subject` block, and A4 below ASSERTS
// the consequence rather than trusting it: every entry in the category must carry a
// `subject_reason` naming the two subjects and the state of the world in which they differ, and
// no row in it may declare `shared`. A default with a checked ruling behind it is not the same
// object as a default nobody wrote down — which is the whole distinction this repo keeps making.
//
// THE TWIN TABLE REPLACES A BLANKET STOP
// ---------------------------------------
// derive-names-433aoi.mjs A8 STOPs when a form-specific row's shared twin `irs433_<fact>` is
// already live, because on that form such a row was a mistake — X-17 was one. On THIS form it is
// the expected state for sixty-odd facts, because the subject ruling says the question is the
// predecessor's and the answer is not. A blanket STOP here would have to be turned off, and a
// guard that gets turned off is worse than no guard. So A8 reports EVERY twin in a table, with
// the category that adjudicated it, and STOPs only on a twin under a category that adjudicates
// nothing. Nothing is silent and nothing is disabled.

import { readFileSync, writeFileSync } from 'node:fs';
import { refuseDowngrade, stampFor } from './no-downgrade.mjs';
import { assertGenerator, generatorMeta, selfPath } from './generator-guard.mjs';
import { keySpaceOf, coverageOf, ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';

const argv = process.argv.slice(2);
const usePortal = argv.includes('--portal');
const emit = argv.includes('--emit');

const R = (p) => JSON.parse(readFileSync(p, 'utf8'));
const MAP = R('adapters/pdf/maps/433boi.map.json');
const CLS = R('adapters/pdf/maps/433boi.crosswalk-classification.json');
const XW = R('adapters/hubspot/crosswalk.433boi.json');
const LIES = R('adapters/pdf/maps/433boi.name-lies.json');

const MIDDLE_FOUR = new Set(['superset', 'different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition']);
const SUBJECT_CATEGORY = 'same-question-different-subject';
const stops = [];
const notes = [];
const STOP = (id, msg) => stops.push(`[${id}] ${msg}`);

// ---------------------------------------------------------------------------------------
// A0  THE KEY SPACE, derived from the map plus the engine inputs the map names no cell for.
// ---------------------------------------------------------------------------------------
// IMPORTED, NOT REBUILT — one key space, one reading of what an entry names, shared with
// blanket-audit [K-01]. `business_income_expense_route` reaches it through ENGINE_EXTRA_INPUTS,
// which is where the engine's own extra inputs are declared for every form.
const { keySpace, groupSource: groupSourceByName } = keySpaceOf(MAP);
for (const k of (ENGINE_EXTRA_INPUTS['433boi'] || [])) if (!keySpace.has(k)) keySpace.set(k, 'engine');

if (keySpace.size < 100) STOP('A0', `the key space read only ${keySpace.size} keys out of 433boi.map.json, which cannot be right for a form with ${MAP._partition?.bound_writable} bound fields. Refusing to derive names against an input this file could not read.`);

// ---------------------------------------------------------------------------------------
// A1  Every input key has exactly one binding, and every binding names an input key.
//     THE KEY-COUNTER, not an entry-counter. The classification's completeness blanket says
//     "every bound key on the form is covered"; that blanket was true of 207 of 238 keys on the
//     last form and the sweep watching it counted ENTRIES. This counts KEYS.
// ---------------------------------------------------------------------------------------
const bindings = XW.bindings || [];
const byKey = new Map();
for (const b of bindings) {
  if (byKey.has(b.key)) STOP('A1', `crosswalk.433boi.json binds "${b.key}" twice. A key with two rows is a key with two property names.`);
  byKey.set(b.key, b);
}
for (const k of keySpace.keys()) if (!byKey.has(k)) STOP('A1', `input key "${k}" (${keySpace.get(k)}) has NO binding. It would reach the page from no property.`);
for (const b of bindings) if (!keySpace.has(b.key)) STOP('A1', `crosswalk.433boi.json binds "${b.key}", which the 433-B(OIC) fill engine cannot consume - it is in neither map, checkboxes, check_here, any group source, nor the declared engine inputs.`);

// ---------------------------------------------------------------------------------------
// A2  Does the entry the row names actually NAME that key, in its own `oic` prose?
// ---------------------------------------------------------------------------------------
const { coverage, namedBy, problems: coverageProblems, notes: coverageNotes } = coverageOf(CLS, MAP, '433boi');
for (const p of coverageProblems) STOP(p.id, p.msg);
notes.push(...coverageNotes);
const entryById = new Map(CLS.entries.map((e) => [e.id, e]));
const namesKey = (entry, key) => coverage.get(entry.id)?.get(key) || null;

// ---------------------------------------------------------------------------------------
// A4  THE SUBJECT RULING, ASSERTED RATHER THAN TRUSTED.
// ---------------------------------------------------------------------------------------
const SUBJ = CLS.subject;
if (!SUBJ || typeof SUBJ.the_ruling !== 'string' || typeof SUBJ.this_form !== 'string' || !SUBJ.predecessors) {
  STOP('A4', 'the classification declares no usable `subject` block. Every form-specific default on this form rests on that ruling, and a default with no recorded ruling behind it is the thing the middle four exist to forbid.');
}
for (const e of CLS.entries) {
  if (e.category !== SUBJECT_CATEGORY) continue;
  if (!e.subject_reason || String(e.subject_reason).length < 120) {
    STOP('A4', `${e.id} is ${SUBJECT_CATEGORY} and its subject_reason is ${e.subject_reason ? String(e.subject_reason).length + ' characters' : 'absent'}. The category derives a form-specific name from a default, so each entry has to name the two subjects and the state of the world in which they hold different values; it cannot do that in a phrase.`);
  }
}

// ---------------------------------------------------------------------------------------
// A3  Category read from the entry; middle four must declare their own scope.
// ---------------------------------------------------------------------------------------
const derived = [];
for (const b of bindings) {
  const e = entryById.get(b.entry);
  if (!e) { STOP('A3', `"${b.key}" names entry ${b.entry}, which does not exist in the classification.`); continue; }
  const how = namesKey(e, b.key);
  if (!how) STOP('A2', `"${b.key}" is bound to ${b.entry}, and ${b.entry}'s own oic field does not name it - not verbatim, not by any declared mechanism. Either the entry does not cover this key or the mechanism is undeclared.`);

  const cat = e.category;
  let scope, basis;
  if (cat === 'asymmetric-the-other-way') { STOP('A3', `"${b.key}" is bound to ${b.entry}, which is asymmetric-the-other-way. That category means a predecessor prints it and this form does not; it can bind no key on this form.`); continue; }
  else if (cat === 'exact') {
    // Live, and used zero times on this form. Kept rather than removed: a branch that cannot
    // fire today is a branch the next form needs, and deleting it would make `exact` mean
    // nothing here while meaning "shared" everywhere else.
    scope = 'shared'; basis = 'category exact -> irs433_';
    STOP('A4', `"${b.key}" is classified exact, which derives a SHARED name, and the classification's subject ruling says no fact whose subject is the filing entity may take one. Either this key's subject genuinely coincides with a predecessor's - in which case say so in the entry and amend \`subject\` - or the category is wrong.`);
  }
  else if (cat === 'new') { scope = 'form-specific'; basis = 'category new -> irs433boi_'; }
  else if (cat === SUBJECT_CATEGORY) { scope = 'form-specific'; basis = `category ${SUBJECT_CATEGORY} -> irs433boi_, by the classification's subject ruling`; }
  else if (MIDDLE_FOUR.has(cat)) {
    if (!b.scope || !b.scope_reason) { STOP('A3', `"${b.key}" is ${cat}, one of the four categories where the wrong call is permanent, and its row declares no ${!b.scope ? 'scope' : 'scope_reason'}. There is no default for this category.`); continue; }
    if (b.scope !== 'shared' && b.scope !== 'form-specific') { STOP('A3', `"${b.key}" declares scope "${b.scope}", which is neither shared nor form-specific.`); continue; }
    if (String(b.scope_reason).length < 60) { STOP('A3', `"${b.key}" declares a scope_reason of ${String(b.scope_reason).length} characters. The ruling has to answer whether one property could ever hold two values at one moment; it cannot do that in a phrase.`); continue; }
    if (b.scope === 'shared') STOP('A4', `"${b.key}" is ${cat} and declares scope "shared". The classification's subject ruling says no fact whose subject is the filing entity may take a shared name, and this row's own scope_reason would have to overturn that ruling rather than sit beside it.`);
    scope = b.scope; basis = `category ${cat} -> per-row ruling: ${b.scope}`;
  } else { STOP('A3', `"${b.key}" is bound to ${b.entry}, whose category "${cat}" is not one this deriver knows.`); continue; }

  if (!/^[a-z][a-z0-9_]*$/.test(String(b.fact || ''))) { STOP('A11', `"${b.key}" declares fact "${b.fact}", which is not lower-snake-case. HubSpot lowercases stored names, so a mixed-case definition drifts from the portal permanently.`); continue; }
  const hs_name = (scope === 'shared' ? 'irs433_' : 'irs433boi_') + b.fact;
  if (!/^[a-z][a-z0-9_]{0,99}$/.test(hs_name)) { STOP('A11', `derived name "${hs_name}" for "${b.key}" is not a legal HubSpot property name.`); continue; }

  derived.push({ ...b, construct: keySpace.get(b.key), category: cat, scope, basis, named_by: how, hs_name });
}

// ---------------------------------------------------------------------------------------
// A5  No two keys derive the same name.
// ---------------------------------------------------------------------------------------
const byName = new Map();
for (const d of derived) byName.set(d.hs_name, [...(byName.get(d.hs_name) || []), d.key]);
for (const [n, ks] of byName) if (ks.length > 1) STOP('A5', `${ks.length} keys derive the same name "${n}": ${ks.join(', ')}. One property cannot hold two of this form's cells.`);

// ---------------------------------------------------------------------------------------
// A6  The row shape a group property declares is the map's slot columns, not a guess.
//     THE WRITER-RESOLVER BOUNDARY, asserted here for this form and, by
//     adapters/hubspot/assert-intake-keys.mjs, for every form including the ones where the
//     construct is inert.
// ---------------------------------------------------------------------------------------
const slotCols = (key) => {
  const g = Object.entries(groupSourceByName).find(([, src]) => src === key);
  if (!g) return null;
  const def = MAP.groups[g[0]];
  const cols = new Set();
  for (const s of def.slots || []) { for (const c of Object.keys(s.text || {})) cols.add(c); for (const c of Object.keys(s.checkboxes || {})) cols.add(c); }
  if (def.row_class?.column) cols.add(def.row_class.column);
  return [...cols];
};
for (const d of derived) {
  if (d.construct !== 'groups') continue;
  const cols = slotCols(d.key);
  if (!cols || !cols.length) STOP('A6', `"${d.key}" is a group source and the map yields no slot columns for it. A group property whose row shape cannot be read would be provisioned with no intake contract at all.`);
}

// ---------------------------------------------------------------------------------------
// A13 THE OPTION VALUES A PROPERTY DECLARES MUST RESOLVE TO SOMETHING THE ENGINE CONSUMES.
//     A key spelling one component emits and another consumes, asserted at the boundary.
// ---------------------------------------------------------------------------------------
const CHECK_HERE_ACCEPTS = new Set(['yes', 'no', 'true', 'false']);
// THE DECLARED STATES ARE READ BY THE ENGINE'S OWN READER, never re-derived here. loadRecordShape
// normalises the declaration and statesOf() is the one place that decides what a state is; a second
// reading of the same block in this file would be a second definition of the route's vocabulary.
const { loadRecordShape, statesOf } = await import('../pdf/record-shape.mjs');
const RS = loadRecordShape(MAP);
const routeStates = {};
for (const d of RS.declarations) routeStates[d.input] = statesOf(d);
for (const d of derived) {
  const mob = d.map_option_by_value;
  if (!mob) {
    if (d.construct === 'checkboxes' || d.construct === 'check_here') STOP('A13', `"${d.key}" is a ${d.construct} input and its row declares no map_option_by_value. The fetch layer would pass the stored value through untranslated, and an untranslated value that happens to work today is the most dangerous kind of wrong.`);
    continue;
  }
  const emitted = [...new Set(Object.values(mob).map(String))];
  let accepted = null, where = null;
  if (d.construct === 'checkboxes') { accepted = Object.keys(MAP.checkboxes[d.key] || {}).filter((k) => !k.startsWith('_')); where = `433boi.map.json checkboxes.${d.key}`; }
  else if (d.construct === 'check_here') { accepted = [...CHECK_HERE_ACCEPTS]; where = 'the check_here spellings fill-433boi.mjs accepts'; }
  else if (d.construct === 'engine' && routeStates[d.key]) { accepted = routeStates[d.key]; where = `433boi.map.json record_shape declaration for "${d.key}"`; }
  if (!accepted) { STOP('A13', `"${d.key}" declares map_option_by_value and this check cannot find the set of values the engine accepts for it (construct ${d.construct}). An unreadable input is not a pass.`); continue; }
  const bad = emitted.filter((v) => !accepted.includes(v));
  if (bad.length) STOP('A13', `"${d.key}" maps stored values to [${emitted.join(', ')}], and ${bad.map((x) => JSON.stringify(x)).join(', ')} ${bad.length === 1 ? 'is not one' : 'are not'} of the values ${where} declares (${accepted.join(', ')}). A spelling the fetch layer emits that the engine cannot resolve reaches the page as nothing, silently.`);
}

// ---------------------------------------------------------------------------------------
// A9  The lie registry. A property named after what the form CALLS a cell rather than after
//     what the cell holds is permanent.
// ---------------------------------------------------------------------------------------
const stem = (leaf) => String(leaf).replace(/\[\d+\].*$/, '').replace(/\s*\(.*$/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const activeLies = LIES.entries.filter((e) => e.kind === 'lie' || e.kind === 'container');
const controlStems = new Set(LIES.entries.filter((e) => e.kind === 'control').map((e) => stem(e.leaf)));
if (activeLies.length !== LIES._tally.active_lies) STOP('A9', `the lie registry declares ${LIES._tally.active_lies} active lies and entries[] yields ${activeLies.length}. Refusing to run the echo check against a registry whose own count does not hold.`);

const echoes = [];
for (const lie of activeLies) {
  const s = stem(lie.leaf);
  if (!s) { STOP('A9', `lie ${lie.id} has a leaf name this check could not reduce to a stem ("${lie.leaf}"). An unreadable input is not a pass.`); continue; }
  if (lie.bound_to) {
    const d = derived.find((x) => x.key === lie.bound_to);
    if (d && d.hs_name.includes(s)) STOP('A9', `"${lie.bound_to}" derives "${d.hs_name}", which echoes the ACTIVE LIE ${lie.id} sitting on that very cell (leaf ${lie.leaf}). The property would be named after what the form calls the cell and not after what the cell holds, permanently.`);
  }
  for (const d of derived) if (d.hs_name.includes(s)) echoes.push({ lie: lie.id, leaf: lie.leaf, stem: s, key: d.key, hs_name: d.hs_name, also_a_control: controlStems.has(s) });
}

// ---------------------------------------------------------------------------------------
// THE BACKBONE, AND THE TWIN TABLE
// ---------------------------------------------------------------------------------------
const backbone = new Map();
for (const [file, form] of [['fields.433a.json', '433a'], ['fields.433f.json', '433f'], ['fields.433aoi.json', '433aoi']]) {
  let doc; try { doc = R(`adapters/hubspot/${file}`); } catch { continue; }
  for (const p of (doc.properties || [])) if (String(p.hs_name).startsWith('irs433_')) backbone.set(p.hs_name, [...(backbone.get(p.hs_name) || []), form]);
}
if (backbone.size < 50) STOP('A8', `the backbone read only ${backbone.size} shared irs433_ names out of the three per-form definition files. That is not a series with three provisioned forms; refusing to run the twin check against an input this file could not read.`);
const ADJUDICATES = new Set([SUBJECT_CATEGORY, ...MIDDLE_FOUR]);
const twins = [];
for (const d of derived) {
  if (d.scope !== 'form-specific') continue;
  const twin = `irs433_${d.fact}`;
  if (!backbone.has(twin)) continue;
  const adjudicated = ADJUDICATES.has(d.category);
  twins.push({ key: d.key, entry: d.entry, category: d.category, hs_name: d.hs_name, twin, contributors: backbone.get(twin), adjudicated });
  if (!adjudicated) STOP('A8', `"${d.key}" is form-specific under category "${d.category}" and its shared twin "${twin}" is already on the backbone (contributed by ${backbone.get(twin).join('+')}). That category adjudicates nothing about a live twin, so this is either a duplicate of a fact the series already holds or a category that should be same-question-different-subject with a subject_reason.`);
}

// ---------------------------------------------------------------------------------------
// PORTAL CHECKS: A7 the name is already live and this row does not claim it; A12 headroom.
// ---------------------------------------------------------------------------------------
let portal = null;
if (usePortal) {
  const { hs } = await import('./hs-lib.mjs');
  const all = (await hs('/crm/v3/properties/contacts')).results || [];
  if (!all.length) STOP('A7', 'the portal returned zero contact properties. That is not a portal with 400+ HubSpot-defined properties; refusing to treat an unreadable read as "nothing exists".');
  portal = new Map(all.map((p) => [p.name, p]));
  // NAMES THIS FORM AND THIS KEY — not BEGINS WITH them. [D-18], fourth instance: the 433-B
  // pass rewrote nine reused descriptions to "Serves BOTH Form 433-B (input key: A) and Form
  // 433-B(OIC) (input key: B)...", and this predicate — true on every run for the whole life
  // of this form until then — went false on four of them, STOPping the deriver at [A7].
  // The "(OIC)" between the form name and the paren is what keeps the two tokens disjoint,
  // where /433-B\b/ was not: that regex matches INSIDE "433-B(OIC)" and is the second
  // instance [D-18] records.
  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').includes(`433-B(OIC) (input key: ${d.key})`);
  for (const d of derived) {
    if (portal.has(d.hs_name) && !d.backbone_key && !oursByDescription(d)) {
      STOP('A7', `"${d.key}" derives "${d.hs_name}", which already exists on the portal, its row claims no backbone_key, and its live description does not name this form and this key. Either it is the same fact and the row must say which predecessor key it reuses, or it is a different fact and the name is taken.`);
    }
  }
  portal.custom = all.filter((p) => !p.hubspotDefined);
}
const statusOf = (d) => {
  if (!portal) return 'portal not read';
  const l = portal.get(d.hs_name);
  if (!l) return '**would be created**';
  // The same reading as A7's, for the same reason: a description naming two forms still
  // names this one. Reported "already live - contributed by another form" before this fix.
  if ((l.description || '').includes('433-B(OIC) (input key: ' + d.key + ')')) return 'created by this pass';
  return 'already live - contributed by another form in the series';
};

// ---------------------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------------------
const L = [];
const say = (s = '') => L.push(s);
const derivedCountForStamp = () => derived.length;
const catCount = {};
for (const d of derived) catCount[d.category] = (catCount[d.category] || 0) + 1;
const scopeCount = { shared: derived.filter((d) => d.scope === 'shared').length, 'form-specific': derived.filter((d) => d.scope !== 'shared').length };

say('# 433-B(OIC) property-name derivation');
// THE STAMP. Written first so a future run can read this file's own answer rather than
// re-deriving it from prose. See adapters/hubspot/no-downgrade.mjs.
say(stampFor(usePortal, usePortal ? `portal read; ${derivedCountForStamp()} derived name(s) checked against it` : 'run without --portal; every per-key verdict below is "portal not read"'));
say('');
say(`Derived from \`adapters/pdf/maps/433boi.crosswalk-classification.json\` (${CLS.entries.length} entries) against`);
say(`\`adapters/pdf/maps/433boi.map.json\` and \`adapters/hubspot/crosswalk.433boi.json\` (${bindings.length} bindings).`);
say('No name below was typed. Each is `irs433_` or `irs433boi_` plus the row\'s fact, with the prefix chosen by the entry\'s CATEGORY and the classification\'s subject ruling.');
say('');
say('| | |');
say('|---|---|');
say(`| input keys (map key space) | ${keySpace.size - (ENGINE_EXTRA_INPUTS['433boi'] || []).length} |`);
say(`| declared engine inputs the map names no cell for | ${(ENGINE_EXTRA_INPUTS['433boi'] || []).length} |`);
say(`| **key universe** | **${keySpace.size}** |`);
say(`| bindings | ${bindings.length} |`);
say(`| names derived | ${derived.length} |`);
say(`| shared (\`irs433_\`) | ${scopeCount.shared} |`);
say(`| form-specific (\`irs433boi_\`) | ${scopeCount['form-specific']} |`);
say('');
say('By construct: ' + Object.entries(derived.reduce((a, d) => ((a[d.construct] = (a[d.construct] || 0) + 1), a), {})).map(([k, v]) => `${k} ${v}`).join(', '));
say('By category: ' + Object.entries(catCount).map(([k, v]) => `${k} ${v}`).join(', '));
say('');
say('## The ruling that governs every name on this form');
say('');
say(`> ${SUBJ.the_ruling}`);
say('');
say(`- **This form\'s subject:** ${SUBJ.this_form}`);
for (const [f, s] of Object.entries(SUBJ.predecessors)) say(`- **${f}:** ${s}`);
say('');
say(SUBJ.the_test_applied);
say('');
say(SUBJ.the_consequence_stated_plainly);
say('');

say('## The middle four and the eighth, entry by entry');
say('');
say('> The governing question is not "is this the same fact" but **"would one property serving both forms ever have to hold two different values for one taxpayer at one moment."**');
say('');
for (const cat of ['superset', 'different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition']) {
  const rows = derived.filter((d) => d.category === cat);
  say(`### ${cat} - ${rows.length} key(s), ${rows.filter((r) => r.scope === 'shared').length} shared / ${rows.filter((r) => r.scope !== 'shared').length} form-specific`);
  say('');
  if (!rows.length) { say('_No entry on this form is classified this way._'); say(''); continue; }
  for (const id of [...new Set(rows.map((r) => r.entry))].sort()) {
    say(`**${id}** - ${entryById.get(id).why}`);
    say('');
    for (const r of rows.filter((r) => r.entry === id)) say(`- \`${r.key}\` -> \`${r.hs_name}\` (**${r.scope}**) - ${r.scope_reason}`);
    say('');
  }
}
say(`### ${SUBJECT_CATEGORY} - ${derived.filter((d) => d.category === SUBJECT_CATEGORY).length} key(s), all form-specific`);
say('');
say('Each entry carries a `subject_reason` naming the two subjects and the state of the world in which they hold different values. A4 refuses an entry in this category whose reason is under 120 characters, and refuses any row in it that declares `shared`.');
say('');
for (const e of CLS.entries.filter((e) => e.category === SUBJECT_CATEGORY)) {
  say(`**${e.id}** (${derived.filter((d) => d.entry === e.id).length} key(s)) - ${e.why}`);
  say('');
  say(`> ${e.subject_reason}`);
  say('');
}

say('## Assertion A5 - name collisions');
say('');
say(`- No two of the ${derived.length} derived names collide with each other: ${byName.size} distinct names over ${derived.length} keys.`);
if (usePortal) {
  const live = derived.filter((d) => portal.has(d.hs_name));
  say(`- ${live.length} derived name(s) already exist on the portal.`);
  say(`- ${derived.length - live.length} derived name(s) do not exist yet.`);
} else say('- Portal checks (A7, A12) not run: pass `--portal`.');
say('');

say('## Assertion A8 - the twin table');
say('');
say('Every form-specific name whose shared twin `irs433_<fact>` is ALREADY LIVE on the backbone. On this form that is the');
say('expected state and not a defect: the fact is spelled the predecessor\'s way on purpose, so that the pair is visible here');
say('rather than hidden behind a name chosen to dodge the check. A twin under a category that adjudicates nothing is a STOP.');
say('');
if (!twins.length) say('**None.** No derived fact matches a live shared name.');
else {
  say(`${twins.length} of the ${derived.length} derived names have a live shared twin.`);
  say('');
  say('| input key | entry | category | derived name | live twin | contributed by | adjudicated |');
  say('|---|---|---|---|---|---|---|');
  for (const t of twins) say(`| \`${t.key}\` | ${t.entry} | ${t.category} | \`${t.hs_name}\` | \`${t.twin}\` | ${t.contributors.join(', ')} | ${t.adjudicated ? 'yes' : '**NO - STOP**'} |`);
}
say('');

say('## Assertion A9 - the lie registry');
say('');
say(`${activeLies.length} active lies on this form, derived from \`entries[]\` by kind. A derived name is checked twice: once against the lie sitting on that very key, and once form-wide.`);
say('');
if (!echoes.length) say('**No derived name contains the stem of any active lie.** No hit on either check.');
else {
  say('| lie | leaf | stem | key | derived name | also a control |');
  say('|---|---|---|---|---|---|');
  for (const e of echoes) say(`| ${e.lie} | \`${e.leaf}\` | \`${e.stem}\` | \`${e.key}\` | \`${e.hs_name}\` | ${e.also_a_control ? 'yes' : 'no'} |`);
}
say('');

say('## Full derivation');
say('');
say('| key | construct | entry | category | scope | fact | derived name | status |');
say('|---|---|---|---|---|---|---|---|');
for (const d of derived) say(`| \`${d.key}\` | ${d.construct} | ${d.entry} | ${d.category} | ${d.scope} | \`${d.fact}\` | \`${d.hs_name}\` | ${statusOf(d)} |`);
say('');
if (notes.length) { say('## Mechanism notes'); say(''); for (const n of notes) say(`- ${n}`); say(''); }

// RULING 4 — a portal-verified report is not replaced by a not-run one on a missing flag.
for (const l of refuseDowngrade({ path: 'adapters/hubspot/433boi.naming-derivation.md', wouldVerify: usePortal, label: '433boi.naming-derivation.md' })) console.log(l);
writeFileSync('adapters/hubspot/433boi.naming-derivation.md', L.join('\n') + '\n');

// ---------------------------------------------------------------------------------------
// EMIT the provisioning definitions, in the shape hs-provision.mjs already reads.
// ---------------------------------------------------------------------------------------
if (emit && !stops.length) {
  const label = (d) => {
    const words = d.fact.replace(/_/g, ' ');
    return `[${d.scope === 'shared' ? '433' : '433-B(OIC)'}] ${words.charAt(0).toUpperCase()}${words.slice(1)}`.slice(0, 100);
  };
  const props = derived.map((d) => {
    const rowShape = d.construct === 'groups' ? slotCols(d.key) : null;
    const desc = [
      `433-B(OIC) (input key: ${d.key}).`,
      d.scope === 'shared' ? 'Shared across the 433 series - named for the fact, not the form.' : 'Specific to Form 433-B(OIC).',
      `Crosswalk ${d.entry}, classified ${d.category}.`,
      rowShape ? `JSON array of row objects with keys: ${rowShape.join(', ')}.` : '',
      d.pii ? 'PII - handle per VLP PII rule.' : '',
    ].filter(Boolean).join(' ');
    return {
      key: d.key, fact: d.fact, scope: d.scope, hs_name: d.hs_name, form: '433boi', field: d.key,
      label: label(d), description: desc,
      group: d.scope === 'shared' ? 'irs433' : 'irs433boic',
      type: d.type, fieldType: d.fieldType,
      options: d.options || null,
      map_option_by_value: d.map_option_by_value || null,
      pii: !!d.pii, line_ref: null, source: d.construct, type_basis: d.type_basis,
      row_shape: rowShape, entry: d.entry, category: d.category, backbone_key: d.backbone_key ?? null,
    };
  });
  const SELF = selfPath(process.argv[1]);
  const gguard = assertGenerator('adapters/hubspot/fields.433boi.json', SELF, { adopt: process.argv.includes('--adopt') });
  console.log(`generator guard: adapters/hubspot/fields.433boi.json -> ${gguard.verdict}${gguard.declared ? ` (declares ${gguard.declared})` : ''}`);
  writeFileSync('adapters/hubspot/fields.433boi.json', JSON.stringify({
    meta: {
      form: '433boi', form_revision: MAP.form_revision, catalog: MAP.catalog,
      derived_from: 'adapters/hubspot/crosswalk.433boi.json + adapters/pdf/maps/433boi.crosswalk-classification.json',
      deriver: 'adapters/hubspot/derive-names-433boi.mjs',
      ...generatorMeta(SELF, { generated_from: 'adapters/hubspot/crosswalk.433boi.json + adapters/pdf/maps/433boi.crosswalk-classification.json' }),
      naming_rule: 'exact -> irs433_<fact>; new and same-question-different-subject -> irs433boi_<fact>; the middle four by a per-row ruling recorded on each crosswalk row. NOTHING HERE IS TYPED: re-running the deriver rebuilds this file, and a category change changes a name.',
      the_subject_ruling: SUBJ.the_ruling,
      counts: { total: props.length, shared: props.filter((p) => p.scope === 'shared').length, form_specific: props.filter((p) => p.scope !== 'shared').length, pii: props.filter((p) => p.pii).length },
    },
    // ONLY GROUPS A ROW ACTUALLY NAMES ARE DECLARED — the same rule
    // adapters/hubspot/gen-fields-from-map.mjs has always applied, and this deriver did not.
    // fields.433boi.json declared `irs433` and not one of its 113 rows names it. A group row
    // that gives no property a home disposes of nothing, which is [D-19] facing the other
    // way, and assert-registry-targets.mjs [RT-2] is what found it.
    groups: [
      { name: 'irs433', label: 'Form 433 series (shared)', displayOrder: 0 },
      { name: 'irs433boic', label: 'Form 433-B(OIC)', displayOrder: 4 },
    ].filter((g) => props.some((p) => p.group === g.name)),
    properties: props,
  }, null, 1) + '\n');
  console.log(`emitted adapters/hubspot/fields.433boi.json (${props.length} definitions)`);
}

// ---------------------------------------------------------------------------------------
console.log(`433-B(OIC) naming derivation: ${derived.length} name(s) from ${keySpace.size} input key(s) (${keySpace.size - (ENGINE_EXTRA_INPUTS['433boi'] || []).length} from the map + ${(ENGINE_EXTRA_INPUTS['433boi'] || []).length} declared engine input).`);
console.log(`  shared ${scopeCount.shared} / form-specific ${scopeCount['form-specific']}.`);
console.log(`  live shared twins: ${twins.length} (${twins.filter((t) => !t.adjudicated).length} unadjudicated); lie-registry echoes: ${echoes.length}.`);
if (usePortal) {
  const before = portal.custom.length;
  const toCreate = derived.filter((d) => !portal.has(d.hs_name));
  console.log(`  HEADROOM: portal holds ${before} custom contact properties; this pass would add ${toCreate.length}; ${1000 - before - toCreate.length} left against the documented 1,000 ceiling.`);
  if (before + toCreate.length > 1000) STOP('A12', `this pass would take the portal to ${before + toCreate.length} custom properties, past the 1,000 ceiling. STOPPING before the first create rather than partway through one.`);
}
console.log('  report -> adapters/hubspot/433boi.naming-derivation.md');
if (stops.length) {
  console.error(`\nSTOP - ${stops.length} assertion failure(s):`);
  for (const s of stops) console.error('  ' + s);
  process.exitCode = 3;
} else {
  console.log('all assertions passed.');
}
