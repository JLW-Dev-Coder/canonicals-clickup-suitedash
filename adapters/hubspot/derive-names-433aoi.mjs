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

const argv = process.argv.slice(2);
const usePortal = argv.includes('--portal');
const emit = argv.includes('--emit');

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
const groupSourceByName = {};
for (const [g, d] of Object.entries(MAP.groups || {})) if (!g.startsWith('_')) groupSourceByName[g] = d.source || g;

const keySpace = new Map(); // input key -> construct
for (const k of Object.keys(MAP.map || {})) if (!k.startsWith('_')) keySpace.set(k, 'map');
for (const [k, v] of Object.entries(MAP.checkboxes || {})) if (!k.startsWith('_') && v && typeof v === 'object' && !Array.isArray(v)) keySpace.set(k, 'checkboxes');
for (const [k, v] of Object.entries(MAP.check_here || {})) if (!k.startsWith('_') && v && typeof v === 'object' && typeof v.target === 'string') keySpace.set(k, 'check_here');
for (const src of Object.values(groupSourceByName)) keySpace.set(src, 'groups');

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
const MECHANISM = {
  // A prefix glob is only safe where the prefix belongs to ONE entry. `s2_sp_` does not: it
  // also matches the pay-period and business-interest cells, which are two other questions
  // under two other entries. So X-04's five spouse counterparts are derived by SUBSTITUTION
  // from the five taxpayer keys it names verbatim - which is what "counterparts" means and
  // what a prefix cannot express. The first draft of this table used the prefix, and the
  // count check below is what caught it.
  'X-04': { kind: 'counterpart_substitution', phrase: 'and the five spouse counterparts', from: 's2_tp_', to: 's2_sp_', expect: 5 },
  'X-14': { kind: 'prefix_glob', phrase: '7b_* as five scalars', prefix: '7b_', expect: 5 },
  'X-18': { kind: 'prefix_glob', phrase: '8c_* digital-asset block', prefix: '8c_', expect: 8 },
  'X-26': {
    kind: 'prefix_glob', phrase: 'and the five 31_spouse_* counterparts', prefix: '31_', expect: 5,
    note: 'THE PHRASE AND ITS OWN GLOB DISAGREE. Four keys match 31_spouse_* literally; the fifth counterpart is 31_total_spouse_income, which does not. The COUNT of five is right and the glob is one short, so the mechanism is read as the glob over the 31_ prefix, which yields exactly the five the phrase claims. Reported rather than silently widened.',
  },
};

const entryById = new Map(CLS.entries.map((e) => [e.id, e]));
const verbatim = (entry, key) => {
  const prose = String(entry.oic || '');
  const re = new RegExp(`(^|[^A-Za-z0-9_])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_]|$)`);
  if (re.test(prose)) return 'verbatim';
  for (const [g, src] of Object.entries(groupSourceByName)) {
    if (src === key && new RegExp(`(^|[^A-Za-z0-9_])groups\\.${g}([^A-Za-z0-9_]|$)`).test(prose)) return `verbatim (as groups.${g})`;
  }
  return null;
};

// Per-entry coverage: what the entry names verbatim, plus what its declared mechanism adds.
const coverage = new Map(); // entry id -> Map(key -> how)
for (const e of CLS.entries) {
  const got = new Map();
  for (const k of keySpace.keys()) { const how = verbatim(e, k); if (how) got.set(k, how); }
  const m = MECHANISM[e.id];
  if (m) {
    const added = [];
    if (m.kind === 'prefix_glob') { for (const k of keySpace.keys()) if (!got.has(k) && k.startsWith(m.prefix)) added.push(k); }
    else if (m.kind === 'counterpart_substitution') { for (const v of [...got.keys()]) { const c = v.replace(m.from, m.to); if (c !== v && keySpace.has(c) && !got.has(c)) added.push(c); } }
    if (!String(e.oic || '').includes(m.phrase)) STOP('A2', `${e.id} was expected to carry the phrase "${m.phrase}" in its oic field and does not. The mechanism cannot read its own input, which is not the same as there being nothing to check.`);
    if (added.length !== m.expect) STOP('A2', `${e.id} mechanism ${m.kind} expected to add ${m.expect} key(s) and added ${added.length}: [${added.join(', ')}]. A mechanism whose count does not hold is covering the wrong keys.`);
    for (const k of added) got.set(k, m.kind);
    if (m.note) notes.push(`${e.id}: ${m.note}`);
  }
  coverage.set(e.id, got);
}
for (const id of Object.keys(MECHANISM)) if (!entryById.has(id)) STOP('A2', `naming mechanism declared for ${id}, which is not an entry in the classification.`);

const namesKey = (entry, key) => coverage.get(entry.id)?.get(key) || null;

const namedBy = new Map(); // key -> [entry ids that name it]
for (const e of CLS.entries) for (const k of coverage.get(e.id).keys()) namedBy.set(k, [...(namedBy.get(k) || []), e.id]);

const ambiguous = [...namedBy.entries()].filter(([, ids]) => ids.length > 1);
for (const [k, ids] of ambiguous) STOP('A2', `input key "${k}" is named by ${ids.length} entries (${ids.join(', ')}). A key covered twice is a key whose category depends on which entry you read.`);

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

  for (const d of derived) {
    if (portal.has(d.hs_name) && !d.backbone_key) {
      STOP('A7', `"${d.key}" derives "${d.hs_name}", which already exists on the portal, and its row claims no backbone_key. Either it is the same fact and the row must say which 433-A key it reuses, or it is a different fact and the name is taken.`);
    }
    if (d.scope === 'form-specific' && portal.has('irs433_' + d.fact)) {
      STOP('A8', `"${d.key}" is form-specific and derives "${d.hs_name}", but irs433_${d.fact} ALREADY EXISTS on the portal for the same fact. Creating this would be a permanent duplicate. Re-read the classification entry: this is what X-17 looked like before it was corrected.`);
    }
  }
  portal.custom = custom;
}
exactButNew = derived.filter((d) => d.category === 'exact' && d.scope === 'shared' && !backboneNames.has(d.hs_name) && !(portal && portal.has(d.hs_name)));
const exactOffBackbone = derived.filter((d) => d.category === 'exact' && d.scope === 'shared' && !backboneNames.has(d.hs_name) && portal && portal.has(d.hs_name));

// ---------------------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------------------
const L = [];
const say = (s = '') => L.push(s);
const catCount = {};
for (const d of derived) catCount[d.category] = (catCount[d.category] || 0) + 1;
const scopeCount = { shared: derived.filter((d) => d.scope === 'shared').length, 'form-specific': derived.filter((d) => d.scope === 'form-specific').length };

say('# 433-A(OIC) property-name derivation');
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

say('## `exact` keys that still create a NEW shared property');
say('');
say('`exact` means a 433-A value needs no transformation to become the OIC value. It does not mean a property exists.');
say('These are the keys where it does not, and each is a place the two forms ask one fact at a different granularity -');
say('so each is a shared property this pass creates under a category that invited reuse. Reported individually because');
say('that is exactly the combination worth a second look before a name becomes permanent.');
say('');
if (!usePortal) say('_Portal not read; this list is against `fields.433a.json` only and will over-report facts 433-F contributed._');
say('');
if (!exactButNew.length) say('None.');
else {
  say('| key | entry | derived name | what 433-A holds instead |');
  say('|---|---|---|---|');
  for (const d of exactButNew) say(`| \`${d.key}\` | ${d.entry} | \`${d.hs_name}\` | ${d.backbone_key ? 'row claims backbone key `' + d.backbone_key + '`, which produced no property of this name' : 'the fact at a different granularity, or nothing'} |`);
}
say('');
if (usePortal && exactOffBackbone.length) {
  say('And these `exact` keys reuse a shared property that is live but is NOT in `fields.433a.json`, because another form in the series contributed it:');
  say('');
  say('| key | entry | reused property | contributed by |');
  say('|---|---|---|---|');
  for (const d of exactOffBackbone) say(`| \`${d.key}\` | ${d.entry} | \`${d.hs_name}\` | \`${d.backbone_key || '(unclaimed)'}\` |`);
  say('');
}

say('## Full derivation');
say('');
say('| key | construct | entry | category | scope | fact | derived name | reuses |');
say('|---|---|---|---|---|---|---|---|');
for (const d of derived) say(`| \`${d.key}\` | ${d.construct} | ${d.entry} | ${d.category} | ${d.scope} | \`${d.fact}\` | \`${d.hs_name}\` | ${d.backbone_key ? '`' + d.backbone_key + '`' : '-'} |`);
say('');
if (notes.length) { say('## Mechanism notes'); say(''); for (const n of notes) say(`- ${n}`); say(''); }

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
  writeFileSync('adapters/hubspot/fields.433aoi.json', JSON.stringify({
    meta: {
      form: '433aoi', form_revision: MAP.form_revision, catalog: MAP.catalog,
      derived_from: 'adapters/hubspot/crosswalk.433aoi.json + adapters/pdf/maps/433aoi.crosswalk-classification.json',
      deriver: 'adapters/hubspot/derive-names-433aoi.mjs',
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
console.log(`  lie-registry echoes: ${echoes.length}; exact-but-new-shared: ${exactButNew.length}.`);
if (usePortal) {
  const before = portal.custom.length;
  const toCreate = derived.filter((d) => !portal.has(d.hs_name));
  console.log(`  HEADROOM: portal holds ${before} custom contact properties; this pass would add ${toCreate.length}; ${1000 - before - toCreate.length} left against the documented 1,000 ceiling.`);
  if (before + toCreate.length > 1000) STOP('A12', `this pass would take the portal to ${before + toCreate.length} custom properties, past the 1,000 ceiling. STOPPING before the first create rather than partway through one.`);
}
console.log('  report -> adapters/hubspot/433aoi.naming-derivation.md');
if (stops.length) {
  console.error(`\nSTOP - ${stops.length} assertion failure(s):`);
  for (const s of stops) console.error('  ' + s);
  process.exit(3);
}
console.log('all assertions passed.');
