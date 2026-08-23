// DERIVE the HubSpot property name for every bound key on 433-A(OIC), and assert the result.
//
//   node adapters/hubspot/derive-names-433aoi.mjs            # offline: A1-A6, A9-A11
//   node adapters/hubspot/derive-names-433aoi.mjs --portal   # adds A7, A8 and A12 against the live portal
//   node adapters/hubspot/derive-names-433aoi.mjs --portal --emit
//
// WHY A DERIVER AND NOT A TABLE OF NAMES
// --------------------------------------
// A HubSpot property name cannot be renamed after creation. So the name is never typed: it is
// computed from the crosswalk classification's CATEGORY for the key, which is read out of
// 433aoi.crosswalk-classification.json at run time. crosswalk.433aoi.json binds a key to an
// ENTRY and names a FACT; this file turns (category, fact) into a name. A category and a name
// therefore cannot disagree, because only one of them exists.
//
//   exact                             -> irs433_<fact>      shared across the 433 series
//   new                               -> irs433aoi_<fact>   form-specific
//   superset                          |
//   different-arithmetic-same-name    |  the row MUST declare scope + scope_reason.
//   different-shape                   |  No default. A row without them is a STOP.
//   same-fact-different-decomposition |
//   asymmetric-the-other-way          -> binds no OIC key. A row claiming one is a STOP.
//
// THE ASSERTION THAT FOUND THE MOST
// ---------------------------------
// A1 compares the classification's coverage against the map's KEY SPACE. The classification
// had asserted "every bound key on the form is covered by an entry" and nothing had ever
// checked it, because the sweep counts ENTRIES and no tool had ever counted KEYS. It was true
// of 207 of 238 keys. A blanket that is true of almost everything in its scope is exactly the
// shape that survives review, so this check runs before any property is created rather than
// after, and it is a STOP rather than a warning.
//
// A GUARD THAT CANNOT READ ITS INPUT SAYS SO
// ------------------------------------------
// Every extraction below declares what it expects to find and STOPs when it finds less. The
// naming-mechanism table is the one place this matters most: a prefix glob whose prefix
// matches nothing, or a counted phrase whose count is wrong, is reported as a broken
// mechanism and not as "nothing to check".

import { readFileSync, writeFileSync } from 'node:fs';
import { refuseDowngrade, stampFor } from './no-downgrade.mjs';
import { assertGenerator, generatorMeta, selfPath } from './generator-guard.mjs';

const argv = process.argv.slice(2);
const usePortal = argv.includes('--portal');
const emit = argv.includes('--emit');

import { keySpaceOf, coverageOf, ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';

const R = (p) => JSON.parse(readFileSync(p, 'utf8'));
const MAP = R('adapters/pdf/maps/433aoi.map.json');
const CLS = R('adapters/pdf/maps/433aoi.crosswalk-classification.json');
const XW = R('adapters/hubspot/crosswalk.433aoi.json');
const LIES = R('adapters/pdf/maps/433aoi.name-lies.json');

const MIDDLE_FOUR = new Set(['superset', 'different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition']);
const stops = [];
const notes = [];
const STOP = (id, msg) => stops.push(`[${id}] ${msg}`);

// ---------------------------------------------------------------------------------------
// THE KEY SPACE, derived from the map. Never typed.
// ---------------------------------------------------------------------------------------
// IMPORTED, NOT REBUILT. adapters/hubspot/classification-coverage.mjs holds the one key space
// and the one reading of what an entry names, because adapters/pdf/blanket-audit.mjs [K-01]
// counts the same thing and a second copy there answered 232 of 238 against this file's 238 of
// 238 - two instruments, two answers, one claim. See that module's header.
const { keySpace, groupSource: groupSourceByName } = keySpaceOf(MAP);
// [B24]. THE ENGINE'S OWN INPUTS, WHICH THE MAP NAMES NO CELL FOR. `business_income_expense_route`
// is declared in this map's `record_shape` block and read straight off the record by
// adapters/pdf/record-shape.mjs; `keySpaceOf` reads the map's map/checkboxes/check_here/groups
// constructs and cannot see it. Left out, a 433-A(OIC) record fetched from HubSpot could not carry
// the route at all and the gate STOPped on it — a finished form whose records cannot carry an
// input its engine requires. Same line as derive-names-433boi.mjs, reading the same table.
for (const k of (ENGINE_EXTRA_INPUTS['433aoi'] || [])) if (!keySpace.has(k)) keySpace.set(k, 'engine');

if (keySpace.size < 200) STOP('A0', `the key space read only ${keySpace.size} keys out of 433aoi.map.json, which cannot be right for a form with ${MAP._partition?.bound_writable} bound fields. Refusing to derive names against an input this file could not read.`);

// ---------------------------------------------------------------------------------------
// A1  Every input key has exactly one binding, and every binding names an input key.
// ---------------------------------------------------------------------------------------
const bindings = XW.bindings || [];
const byKey = new Map();
for (const b of bindings) {
  if (byKey.has(b.key)) STOP('A1', `crosswalk.433aoi.json binds "${b.key}" twice. A key with two rows is a key with two property names.`);
  byKey.set(b.key, b);
}
for (const k of keySpace.keys()) if (!byKey.has(k)) STOP('A1', `input key "${k}" (${keySpace.get(k)}) has NO binding. It would reach the page from no property.`);
for (const b of bindings) if (!keySpace.has(b.key)) STOP('A1', `crosswalk.433aoi.json binds "${b.key}", which the 433-A(OIC) fill engine cannot consume - it is in neither map, checkboxes, check_here nor any group source.`);

// ---------------------------------------------------------------------------------------
// A2  Does the entry the row names actually NAME that key, in its own `oic` prose?
//
// Scanned over `oic` ONLY, never `why`: a `why` that cross-references another entry's key
// would otherwise read as a second claim on it, which is the duplicate-write defect one level
// up. Four naming mechanisms, each mechanically checkable; anything else is a STOP.
// ---------------------------------------------------------------------------------------
const { coverage, namedBy, problems: coverageProblems, notes: coverageNotes, MECHANISM } = coverageOf(CLS, MAP, '433aoi');
for (const p of coverageProblems) STOP(p.id, p.msg);
notes.push(...coverageNotes);

const entryById = new Map(CLS.entries.map((e) => [e.id, e]));

const namesKey = (entry, key) => coverage.get(entry.id)?.get(key) || null;


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
  if (cat === 'asymmetric-the-other-way') { STOP('A3', `"${b.key}" is bound to ${b.entry}, which is asymmetric-the-other-way. That category means 433-A prints it and this form does not; it can bind no key on this form.`); continue; }
  if (cat === 'exact') { scope = 'shared'; basis = 'category exact -> irs433_'; }
  else if (cat === 'new') { scope = 'form-specific'; basis = 'category new -> irs433aoi_'; }
  else if (MIDDLE_FOUR.has(cat)) {
    if (!b.scope || !b.scope_reason) { STOP('A3', `"${b.key}" is ${cat}, one of the four categories where the wrong call is permanent, and its row declares no ${!b.scope ? 'scope' : 'scope_reason'}. There is no default for this category.`); continue; }
    if (b.scope !== 'shared' && b.scope !== 'form-specific') { STOP('A3', `"${b.key}" declares scope "${b.scope}", which is neither shared nor form-specific.`); continue; }
    if (String(b.scope_reason).length < 60) { STOP('A3', `"${b.key}" declares a scope_reason of ${String(b.scope_reason).length} characters. The ruling has to answer whether one property could ever hold two values at one moment; it cannot do that in a phrase.`); continue; }
    scope = b.scope; basis = `category ${cat} -> per-entry ruling: ${b.scope}`;
  } else { STOP('A3', `"${b.key}" is bound to ${b.entry}, whose category "${cat}" is not one this deriver knows.`); continue; }

  if (!/^[a-z][a-z0-9_]*$/.test(String(b.fact || ''))) { STOP('A11', `"${b.key}" declares fact "${b.fact}", which is not lower-snake-case. HubSpot lowercases stored names, so a mixed-case definition drifts from the portal permanently.`); continue; }
  const hs_name = (scope === 'shared' ? 'irs433_' : 'irs433aoi_') + b.fact;
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
// A9  The lie registry. Twenty-two active lies on this form; a property named after one of
//     them is permanent. Two checks: a STOP on the key the lie actually sits on, and a
//     form-wide echo report that has to be adjudicated rather than assumed harmless.
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
// A10 An `exact` row whose derived shared name is NOT already on the backbone. `exact` is the
//     category that invites reuse, so a new name under it is reported individually.
// ---------------------------------------------------------------------------------------
// Computed AFTER the portal read below, because "not on the 433-A backbone" and "does not
// exist anywhere" are different claims: 433-F contributed shared facts that fields.433a.json
// has never heard of, and reporting one of those as a new property would be false.
const backboneNames = new Set(R('adapters/hubspot/fields.433a.json').properties.map((p) => p.hs_name));
let exactButNew = [];

// ---------------------------------------------------------------------------------------
// PORTAL CHECKS
//   A7  the derived name is already live and this row does not claim it
//   A8  a form-specific row whose shared twin irs433_<fact> is already live  (the X-17 catch)
//   A12 headroom
// ---------------------------------------------------------------------------------------
let portal = null;
if (usePortal) {
  const { hs } = await import('./hs-lib.mjs');
  const all = (await hs('/crm/v3/properties/contacts')).results || [];
  if (!all.length) STOP('A7', 'the portal returned zero contact properties. That is not a portal with 400+ HubSpot-defined properties; refusing to treat an unreadable read as "nothing exists".');
  portal = new Map(all.map((p) => [p.name, p]));
  const custom = all.filter((p) => !p.hubspotDefined);

  // A7 asks "is this name already taken by something else". Once this pass has run, most of
  // these names are taken BY THIS PASS, and a guard that cannot tell those apart would fire on
  // every re-run and be turned off. The discriminator is read from the PORTAL and not from a
  // list this file carries: hs-provision writes the input key into the description, so a
  // property whose live description names this form and THIS key is one we created, and any
  // other occupant of the name is still a STOP.
  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').startsWith(`433-A(OIC) (input key: ${d.key})`);
  for (const d of derived) {
    if (portal.has(d.hs_name) && !d.backbone_key && !oursByDescription(d)) {
      STOP('A7', `"${d.key}" derives "${d.hs_name}", which already exists on the portal, its row claims no backbone_key, and its live description does not name this form and this key. Either it is the same fact and the row must say which 433-A key it reuses, or it is a different fact and the name is taken.`);
    }
    if (d.scope === 'form-specific' && portal.has('irs433_' + d.fact)) {
      STOP('A8', `"${d.key}" is form-specific and derives "${d.hs_name}", but irs433_${d.fact} ALREADY EXISTS on the portal for the same fact. Creating this would be a permanent duplicate. Re-read the classification entry: this is what X-17 looked like before it was corrected.`);
    }
  }
  portal.custom = custom;
}
// THE DURABLE LIST is "exact, shared, and NOT a fact fields.433a.json carries" - which does not
// change when this pass creates the properties. An earlier draft filtered on "does not exist on
// the portal", so re-running it after provisioning reported zero and the finding vanished from
// its own report. A report whose finding disappears once the work is done is a report that only
// ever documents the future.
exactButNew = derived.filter((d) => d.category === 'exact' && d.scope === 'shared' && !backboneNames.has(d.hs_name));
const statusOf = (d) => {
  if (!portal) return 'portal not read';
  const l = portal.get(d.hs_name);
  if (!l) return '**would be created**';
  if ((l.description || '').startsWith('433-A(OIC) (input key: ' + d.key + ')')) return 'created by this pass';
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
const scopeCount = { shared: derived.filter((d) => d.scope === 'shared').length, 'form-specific': derived.filter((d) => d.scope === 'form-specific').length };

say('# 433-A(OIC) property-name derivation');
// THE STAMP. Written first so a future run can read this file's own answer rather than
// re-deriving it from prose. See adapters/hubspot/no-downgrade.mjs.
say(stampFor(usePortal, usePortal ? `portal read; ${derivedCountForStamp()} derived name(s) checked against it` : 'run without --portal; every per-key verdict below is "portal not read"'));
say('');
say(`Derived from \`adapters/pdf/maps/433aoi.crosswalk-classification.json\` (${CLS.entries.length} entries) against`);
say(`\`adapters/pdf/maps/433aoi.map.json\` (${keySpace.size} input keys) and \`adapters/hubspot/crosswalk.433aoi.json\` (${bindings.length} bindings).`);
say('No name below was typed. Each is `irs433_` or `irs433aoi_` plus the row\'s fact, with the prefix chosen by the entry\'s CATEGORY.');
say('');
say('| | |');
say('|---|---|');
say(`| input keys (from the map) | ${keySpace.size} |`);
say(`| bindings | ${bindings.length} |`);
say(`| names derived | ${derived.length} |`);
say(`| shared (\`irs433_\`) | ${scopeCount.shared} |`);
say(`| form-specific (\`irs433aoi_\`) | ${scopeCount['form-specific']} |`);
say(`| already on the backbone | ${derived.filter((d) => backboneNames.has(d.hs_name)).length} |`);
say('');
say('By construct: ' + Object.entries(derived.reduce((a, d) => ((a[d.construct] = (a[d.construct] || 0) + 1), a), {})).map(([k, v]) => `${k} ${v}`).join(', '));
say('By category: ' + Object.entries(catCount).map(([k, v]) => `${k} ${v}`).join(', '));
say('');

say('## The middle four, one at a time');
say('');
say('> The governing question is not "is this the same fact" but **"would one property serving both forms ever have to hold two different values for one taxpayer at one moment."**');
say('');
for (const cat of ['superset', 'different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition']) {
  const rows = derived.filter((d) => d.category === cat);
  say(`### ${cat} - ${rows.length} key(s), ${rows.filter((r) => r.scope === 'shared').length} shared / ${rows.filter((r) => r.scope === 'form-specific').length} form-specific`);
  say('');
  const entries = [...new Set(rows.map((r) => r.entry))].sort();
  for (const id of entries) {
    const rs = rows.filter((r) => r.entry === id);
    say(`**${id}** - ${entryById.get(id).oic}`);
    say('');
    for (const r of rs) say(`- \`${r.key}\` -> \`${r.hs_name}\` (**${r.scope}**) - ${r.scope_reason}`);
    say('');
  }
}

say('## Assertion 2 - name collisions');
say('');
say(`- No two of the ${derived.length} derived names collide with each other: ${byName.size} distinct names over ${derived.length} keys.`);
if (usePortal) {
  const live = derived.filter((d) => portal.has(d.hs_name));
  say(`- ${live.length} derived name(s) already exist on the portal, and every one is claimed by its row's \`backbone_key\` (assertion A7).`);
  say(`- ${derived.length - live.length} derived name(s) do not exist yet.`);
} else say('- Portal checks (A7, A8) not run: pass `--portal`.');
say('');

say('## Assertion 3 - the lie registry');
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

say('## `exact` keys whose fact the 433-A backbone does not carry');
say('');
say('`exact` means a 433-A value needs no transformation to become the OIC value. It does NOT mean a property exists.');
say('These are the keys where it does not: each is a place the two forms ask one fact at a different granularity, and');
say('each therefore takes a shared name under a category that invited reuse. Reported individually because that is');
say('exactly the combination worth a second look before a name becomes permanent.');
say('');
say('The list is against `fields.433a.json` and does not shrink once the properties are created - the `status` column');
say('says what happened, so the finding survives the work being done.');
say('');
if (!exactButNew.length) say('None.');
else {
  say('| key | entry | derived name | what 433-A holds instead | status |');
  say('|---|---|---|---|---|');
  for (const d of exactButNew) say(`| \`${d.key}\` | ${d.entry} | \`${d.hs_name}\` | ${d.backbone_key ? 'row claims backbone key `' + d.backbone_key + '`, which produced no property of this name' : 'the fact at a different granularity, or nothing'} | ${statusOf(d)} |`);
}
say('');

say('## Full derivation');
say('');
say('| key | construct | entry | category | scope | fact | derived name | reuses |');
say('|---|---|---|---|---|---|---|---|');
for (const d of derived) say(`| \`${d.key}\` | ${d.construct} | ${d.entry} | ${d.category} | ${d.scope} | \`${d.fact}\` | \`${d.hs_name}\` | ${d.backbone_key ? '`' + d.backbone_key + '`' : '-'} |`);
say('');
if (notes.length) { say('## Mechanism notes'); say(''); for (const n of notes) say(`- ${n}`); say(''); }

// RULING 4 — a portal-verified report is not replaced by a not-run one on a missing flag.
for (const l of refuseDowngrade({ path: 'adapters/hubspot/433aoi.naming-derivation.md', wouldVerify: usePortal, label: '433aoi.naming-derivation.md' })) console.log(l);
writeFileSync('adapters/hubspot/433aoi.naming-derivation.md', L.join('\n') + '\n');

// ---------------------------------------------------------------------------------------
// EMIT the provisioning definitions, in the shape hs-provision.mjs already reads.
// ---------------------------------------------------------------------------------------
if (emit && !stops.length) {
  const label = (d) => {
    const words = d.fact.replace(/_/g, ' ');
    return `[${d.scope === 'shared' ? '433' : '433-A(OIC)'}] ${words.charAt(0).toUpperCase()}${words.slice(1)}`.slice(0, 100);
  };
  const slotCols = (key) => {
    const g = Object.entries(groupSourceByName).find(([, src]) => src === key);
    if (!g) return null;
    const def = MAP.groups[g[0]];
    const cols = new Set();
    for (const s of def.slots || []) { for (const c of Object.keys(s.text || {})) cols.add(c); for (const c of Object.keys(s.checkboxes || {})) cols.add(c); }
    // And the class the row states, wherever the map declares one. THE TWO DERIVERS MUST AGREE:
    // gen-fields-from-map.mjs already publishes `row_class.column` in the row shape it writes,
    // and `irs433_household_members` is ONE property with a definition file on each side. A
    // property with two definition files follows whichever provisioner ran last, so a row shape
    // naming the class column on one side and not the other would make the intake contract for
    // that property depend on run order. Added when D-05 gave the last twelve groups a
    // row_class; before that no 433-A(OIC) class column reached this file at all.
    if (def.row_class?.column) cols.add(def.row_class.column);
    return [...cols];
  };
  const props = derived.map((d) => {
    const rowShape = d.construct === 'groups' ? slotCols(d.key) : null;
    const desc = [
      `433-A(OIC) (input key: ${d.key}).`,
      d.scope === 'shared' ? 'Shared across the 433 series - named for the fact, not the form.' : 'Specific to Form 433-A(OIC).',
      `Crosswalk ${d.entry}, classified ${d.category}.`,
      rowShape ? `JSON array of row objects with keys: ${rowShape.join(', ')}.` : '',
      d.pii ? 'PII - handle per VLP PII rule.' : '',
    ].filter(Boolean).join(' ');
    return {
      key: d.key, fact: d.fact, scope: d.scope, hs_name: d.hs_name, form: '433aoi', field: d.key,
      label: label(d), description: desc,
      group: d.scope === 'shared' ? 'irs433' : 'irs433aoic',
      type: d.type, fieldType: d.fieldType,
      options: d.options || null,
      map_option_by_value: d.map_option_by_value || null,
      pii: !!d.pii, line_ref: null, source: d.construct, type_basis: d.type_basis,
      row_shape: rowShape, entry: d.entry, category: d.category, backbone_key: d.backbone_key,
    };
  });
  // THE GENERATOR GUARD - see adapters/hubspot/generator-guard.mjs. This file declared its
  // producer under the key `deriver` while the other two field files used `generator`, and an
  // assertion cannot find a key by meaning. Both are now written: `generator` is the key the
  // guard reads, one spelling across all three files.
  const SELF = selfPath(process.argv[1]);
  const gguard = assertGenerator('adapters/hubspot/fields.433aoi.json', SELF, { adopt: process.argv.includes('--adopt') });
  console.log(`generator guard: adapters/hubspot/fields.433aoi.json -> ${gguard.verdict}${gguard.declared ? ` (declares ${gguard.declared})` : ''}`);
  writeFileSync('adapters/hubspot/fields.433aoi.json', JSON.stringify({
    meta: {
      form: '433aoi', form_revision: MAP.form_revision, catalog: MAP.catalog,
      derived_from: 'adapters/hubspot/crosswalk.433aoi.json + adapters/pdf/maps/433aoi.crosswalk-classification.json',
      deriver: 'adapters/hubspot/derive-names-433aoi.mjs',
      ...generatorMeta(SELF, { generated_from: 'adapters/hubspot/crosswalk.433aoi.json + adapters/pdf/maps/433aoi.crosswalk-classification.json' }),
      naming_rule: 'Ruling 5. exact -> irs433_<fact>; new -> irs433aoi_<fact>; the middle four by a per-entry ruling recorded on each crosswalk row. NOTHING HERE IS TYPED: re-running the deriver rebuilds this file, and a category change changes a name.',
      counts: { total: props.length, shared: props.filter((p) => p.scope === 'shared').length, form_specific: props.filter((p) => p.scope !== 'shared').length, pii: props.filter((p) => p.pii).length },
    },
    groups: [
      { name: 'irs433', label: 'Form 433 series (shared)', displayOrder: 0 },
      { name: 'irs433aoic', label: 'Form 433-A(OIC)', displayOrder: 3 },
    ],
    properties: props,
  }, null, 1) + '\n');
  console.log(`emitted adapters/hubspot/fields.433aoi.json (${props.length} definitions)`);
}

// ---------------------------------------------------------------------------------------
console.log(`433-A(OIC) naming derivation: ${derived.length} name(s) from ${keySpace.size} input key(s).`);
console.log(`  shared ${scopeCount.shared} / form-specific ${scopeCount['form-specific']}; ${derived.filter((d) => backboneNames.has(d.hs_name)).length} already on the backbone.`);
console.log(`  lie-registry echoes: ${echoes.length}; exact keys off the 433-A backbone: ${exactButNew.length}.`);
if (usePortal) {
  const before = portal.custom.length;
  const toCreate = derived.filter((d) => !portal.has(d.hs_name));
  console.log(`  HEADROOM: portal holds ${before} custom contact properties; this pass would add ${toCreate.length}; ${1000 - before - toCreate.length} left against the documented 1,000 ceiling.`);
  if (before + toCreate.length > 1000) STOP('A12', `this pass would take the portal to ${before + toCreate.length} custom properties, past the 1,000 ceiling. STOPPING before the first create rather than partway through one.`);
}
console.log('  report -> adapters/hubspot/433aoi.naming-derivation.md');
// AND THE SENTENCE UNDERNEATH IT, WHICH USED TO PRINT EITHER WAY.
//
// This read, unconditionally, directly below its own "STOP - 1 assertion failure(s)":
//
//     console.log('all assertions passed.');
//
// The exit code was right on every run. The last line a reader sees was wrong on every
// failing one. `process.exitCode = 3` is precisely what let it survive: it is an ASSIGNMENT,
// not a jump, so execution fell straight through — where every other terminal success message
// in this engine sits after `process.exit()` or `return`, which do jump. That one-character
// difference between a call and an assignment is the whole defect.
//
// It was found by grepping for the phrase for an unrelated reason, which is to say by luck.
// adapters/pdf/success-sweep.mjs is the check that replaces the luck, and its canary holds
// this exact arrangement — a jumping guard, then a non-jumping guard, then a bare success
// line — so a classifier that stops recognising it fails loudly instead of reporting clean.
if (stops.length) {
  console.error(`\nSTOP - ${stops.length} assertion failure(s):`);
  for (const s of stops) console.error('  ' + s);
  // exitCode, not exit(): calling process.exit() while the fetch keep-alive sockets are still
  // open trips a libuv assertion on Windows, and a guard whose FAILURE path crashes is a guard
  // whose failure is easy to mistake for a crash. Setting the code lets node drain and exit 3.
  process.exitCode = 3;
} else {
  console.log('all assertions passed.');
}
