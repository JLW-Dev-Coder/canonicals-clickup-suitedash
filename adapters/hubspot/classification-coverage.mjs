// WHICH INPUT KEYS A CROSSWALK CLASSIFICATION ACTUALLY COVERS — one implementation, shared.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THIS IS A MODULE AND NOT A FUNCTION INSIDE derive-names-433aoi.mjs
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The classification's completeness blanket — "every bound key on the form is covered by an
// entry" — was true of 207 of 238 keys and false of 31, and it survived because the sweep
// watching it counted ENTRIES while the claim was about KEYS. Assertion A1 in
// derive-names-433aoi.mjs is the counter that finally measured the right set.
//
// The blanket audit needs that same figure, and the first draft of its [K-01] counter
// APPROXIMATED it: verbatim substring plus a naive `foo_*` glob. It reported 232 of 238 and
// named six keys as uncovered that A1 covers — because A1 does not read `s2_sp_` as a glob at
// all. `s2_sp_` also matches the pay-period and business-interest cells, so X-04's five spouse
// counterparts are derived by SUBSTITUTION from the five taxpayer keys it names verbatim, and
// a prefix cannot express that. Two instruments, two answers, about one claim.
//
//   A REIMPLEMENTATION IS A NEW INSTRUMENT AND IS NOT EVIDENCE ABOUT THE OLD ONE.
//
// So the coverage decision moved here and both callers import it. There is one key space, one
// mechanism table and one reading of what an entry names — which is also what makes the
// GRANULARITY declaration checkable, because granularity is a property of HOW an entry names
// its keys and there is now exactly one place that decides.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE THREE WAYS AN ENTRY CAN NAME A KEY, AND WHAT EACH ONE CLAIMS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   verbatim      the key, or `groups.<name>` for a group's source key, appears in the
//                 entry's own `oic` prose. The narrowest claim: the author looked at this
//                 cell. GRANULARITY `enumerated`.
//   prefix_glob   the entry writes `8c_*` and means every key with that prefix. Exactly
//                 enumerable and therefore checkable, and it covers cells its author may
//                 never have looked at. GRANULARITY `glob`.
//   counterpart_substitution
//                 the entry names N keys verbatim and says "and the five spouse
//                 counterparts"; the counterparts are derived by rewriting one stem into
//                 another. GRANULARITY `derived-counterpart`.
//
// A mechanism must state how many keys it expects to add, and adding a different number is a
// STOP: a mechanism whose count does not hold is covering the wrong keys. That check caught
// this table's own first draft.

import { readFileSync } from 'node:fs';

/**
 * INPUTS THE FILL ENGINE READS THAT THE MAP DOES NOT NAME AS INPUT KEYS. Sourced from the
 * engine, per form, and stated rather than guessed from the map's shape — an unticked checkbox
 * and an unasked question print identically, so a key space built only from the map omits five
 * of 433-F's 97 inputs in silence.
 *
 * HERE RATHER THAN IN validate-crosswalk.mjs SO THERE IS ONE LIST. Two consumers need it —
 * that validator and adapters/pdf/blanket-audit.mjs [K-09], which counts the same key space to
 * prove count-sweep [S-22]'s forward reference. A copy in the second place is the parallel-list
 * defect guard-sweep.mjs enumerates, and the audit's first draft committed exactly that.
 */
export const ENGINE_EXTRA_INPUTS = {
  '433f': [
    '433f_address_differs',   // fill-433f.mjs: input('address_differs') -> checkboxes.address_differs
    '433f_pay_freq',          // fill-433f.mjs: input('pay_freq')        -> checkboxes.pay_freq.you
    '433f_spouse_pay_freq',   // fill-433f.mjs: input('spouse_pay_freq') -> checkboxes.pay_freq.spouse
    '433f_hh_size',           // fill-433f.mjs: data.household_size ?? data['433f_hh_size']
    '433f_age_band',          // fill-433f.mjs: input('age_band')        -> allowed.oop_by_age
  ],
  '433boi': [
    // THE DECLARED RECORD SHAPE. run-form-gate.mjs step 11 resolves it through
    // adapters/pdf/record-shape.mjs `stateFromRecord`, which reads `record[d.input]` BARE — the
    // key is the one the map's `record_shape` block declares and nothing prefixes it. It names
    // no printed cell, so `keySpaceOf` cannot see it, and a record that declares no state is a
    // gate STOP rather than a default. An input the engine reads and the key space cannot see
    // is a property nobody provisions, which is exactly what happened on 433-A(OIC).
    'business_income_expense_route',
  ],
  '433aoi': [
    // [B24], CLOSED. This entry was DELIBERATELY ABSENT for one prompt and the absence was
    // recorded as a claim: adapters/pdf/maps/433aoi.map.json declares the SAME
    // `business_income_expense_route` over its lines (17) and (29) and its engine reads it the
    // same way, so factually the row always belonged here. Adding it put the key in this form's
    // key space, where assertion A1 of derive-names-433aoi.mjs correctly STOPped until the key
    // had a binding — and clearing that STOP meant creating a PERMANENT HubSpot name, which is
    // not something to do as a side effect of another form's pass. Prompt 44 is the pass that
    // does it, with the full discipline for one property: derived, asserted against the live
    // portal and the lie registry, dry-run with headroom, created through node fetch, read back.
    //
    // UNTIL THEN THE 433-A(OIC) ROUND TRIP COULD NOT CARRY THE ROUTE: the fetch layer emitted no
    // such key, and gate step 11 STOPs on a record that declares no state. A finished form whose
    // records cannot carry an input the engine requires is not finished.
    'business_income_expense_route',
  ],
};

/**
 * THE KEY SPACE THE FILL ENGINE CAN CONSUME, derived from the map and never typed.
 * `map` scalars, `checkboxes` option sets AND LONE TICKS, `check_here` boxes, one source key
 * per group.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * THE CHECKBOX PREDICATE, AND THE DEFECT IT CARRIED UNTIL THIS COMMIT
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * The predicate was `typeof v === 'object' && !Array.isArray(v)`, which admits an OPTION SET —
 * a value-to-target object — and nothing else. That is not a statement about which checkbox
 * constructs are engine inputs; it is a statement about ONE of the shapes they are written in,
 * and the other shapes were dropped in silence. [R-14]: an exclusion that is a property of the
 * reading is not an exclusion.
 *
 * WHAT IT DROPPED, MEASURED RATHER THAN FEARED. 433-D draws its whole agreement twice — an IRS
 * copy on page 1 and a taxpayer copy on page 3 — so a LONE TICK on that form is one key with
 * TWO targets, written as an array. Three of its six checkbox constructs are lone ticks:
 * `433d_submit_a_new`, `433d_unable_to_make`, `433d_check_box_if`. All three vanished from the
 * key space, and the classification's own one-key-one-entry assertion then STOPped naming them
 * as "not an engine input on this form" — an assertion firing correctly against an input that
 * was wrong. The classification was right; the key space was reporting a mirrored tick as a
 * cell that does not exist. [R-05] in the small: what the reader cannot see and what the page
 * does not print are different facts.
 *
 * THE FOUR DECLARED SHAPES. Each is a shape the maps in this tree actually use, and a value in
 * none of them is a STOP rather than a silent drop — the fourth state is refused, [R-35].
 *
 *   object, not array   an OPTION SET: printed option value -> target(s). One property holding
 *                       which option was ticked. Every form in the tree has these.
 *   array of strings    a LONE TICK with one target per drawn copy. 433-D's three (two targets
 *                       each, the mirror); 433-F's would be here but for `_binds`, below.
 *   string              a LONE TICK with a single target. 433-F's `address_differs`.
 *   anything else       STOP. It is not classified and it is not dropped.
 *
 * THE ONE DECLARED EXCLUSION, AND IT IS READ OUT OF THE MAP. `checkboxes._binds` declares which
 * checkbox constructs are ROW-LEVEL — a column of a repeatable group rather than a scalar input.
 * On 433-F that is `account_business_bank`, `account_business_investments` and `real_estate`,
 * each declared `{group, column}`. Their fact reaches the engine through the GROUP'S SOURCE KEY,
 * which this function already adds, so admitting them as scalars would put a second key in the
 * key space for a fact the group already carries — a duplicate property on a portal with a hard
 * ceiling, which is [X-17]'s class. The exclusion is therefore a DECLARATION in the map, checked
 * against `groups`, and not a property of the predicate's shape test.
 *
 * THE ALIAS, AND WHY IT IS DERIVED. Every fill engine in this tree resolves an input as
 * `data[name] ?? data[PREFIX + name]`, PREFIX being the map's own form id. So a bare map key and
 * its prefixed spelling are ONE member under two spellings, not two members. 433-F is the only
 * form where that bites: the map writes `address_differs` and ENGINE_EXTRA_INPUTS names
 * `433f_address_differs`, which is the spelling `crosswalk.433f.json` binds and the live
 * property `irs433_address_differs_from_last_return` is provisioned under. The PREFIXED spelling
 * is therefore canonical — it is the one the registry, the fetch layer and the portal already
 * agree on — and the bare one is recorded as its alias rather than admitted beside it. Before
 * this commit that row in ENGINE_EXTRA_INPUTS was the only reason the key was in the key space
 * at all; it is now a declared alias of a key the predicate can see, which is the stronger state.
 */
export const keySpaceOf = (mapDoc) => {
  const problems = [];
  const groupSource = {};
  // A GROUP CONTRIBUTES ITS SOURCE KEY, AND THE SPELLING IS `array || source || name`.
  // validate-crosswalk.mjs read it that way and this function read `source || name`; the two
  // agree on every map in the tree today, and agreeing today is not the same as being one
  // reading. The `slots` filter is likewise its: a group with no slot list is not a repeatable
  // table the engine feeds, and a crosswalk row for one would be a property nobody writes.
  for (const [g, d] of Object.entries(mapDoc.groups || {})) if (!g.startsWith('_') && d && Array.isArray(d.slots)) groupSource[g] = d.array || d.source || g;
  const keySpace = new Map();
  for (const k of Object.keys(mapDoc.map || {})) if (!k.startsWith('_')) keySpace.set(k, 'map');

  // THE ROW-LEVEL CONSTRUCTS, DECLARED IN THE MAP AND CHECKED AGAINST `groups`. A `_binds` row
  // naming a group this map does not declare is a STOP: it would excuse a key on a claim about
  // a group that is not there, which is the sentence-narrowing [R-14] exists to refuse.
  const rowLevel = new Map();
  for (const [k, d] of Object.entries((mapDoc.checkboxes || {})._binds || {})) {
    if (!d || typeof d !== 'object' || typeof d.group !== 'string' || typeof d.column !== 'string')
      problems.push(`checkboxes._binds["${k}"] does not declare both a group and a column.`);
    else if (!Object.prototype.hasOwnProperty.call(groupSource, d.group))
      problems.push(`checkboxes._binds["${k}"] names group "${d.group}", which this map does not declare. A row-level exclusion resting on a group that is not there excuses a key on nothing.`);
    else rowLevel.set(k, d);
  }

  const shapeOf = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? 'option_set'
    : (Array.isArray(v) && v.length && v.every((t) => typeof t === 'string')) ? 'lone_tick_multi_target'
    : (typeof v === 'string' && v) ? 'lone_tick_single_target'
    : null;

  const checkboxShape = new Map();
  for (const [k, v] of Object.entries(mapDoc.checkboxes || {})) {
    if (k.startsWith('_')) continue;
    if (rowLevel.has(k)) continue;                       // declared row-level; the group source key carries the fact
    const shape = shapeOf(v);
    if (!shape) { problems.push(`checkboxes["${k}"] is in none of the three declared shapes (option set, lone tick as array of targets, lone tick as a single target) and is not declared row-level in checkboxes._binds. It is refused rather than dropped.`); continue; }
    checkboxShape.set(k, shape);
    keySpace.set(k, 'checkboxes');
  }

  for (const [k, v] of Object.entries(mapDoc.check_here || {})) if (!k.startsWith('_') && v && typeof v === 'object' && typeof v.target === 'string') keySpace.set(k, 'check_here');
  for (const src of Object.values(groupSource)) keySpace.set(src, 'groups');

  // ── THE TWO BLOCKS THIS FUNCTION COULD NOT SEE UNTIL THIS COMMIT ────────────────────────
  //
  // adapters/hubspot/validate-crosswalk.mjs carried its own key-space derivation, and the two
  // were each blind where the other saw. This function missed `special.composite_name_address`
  // and `split`, which is SEVEN keys on 433-A and FOUR on 433-F; that one missed the mirrored
  // lone tick, which is three on 433-D. One key space read two ways is the exact defect this
  // module’s own header was written about — "a reimplementation is a new instrument and is not
  // evidence about the old one" — and the module was created to end it and then left one
  // reimplementation standing in the file that runs at gate step 3.
  //
  // THE COMPOSITE SOURCE KEYS. 433-F joins a name and an address into one printed widget and
  // declares the two keys it joins. The engine reads both; neither appears in `map`.
  for (const k of (mapDoc.special?.composite_name_address?.from || [])) if (!k.startsWith('_')) keySpace.set(k, 'special');
  //
  // THE SPLIT PARENTS. A `split` entry with a `parts` array is one value the engine cuts into
  // several widgets — a telephone number into area code and line, an EIN into two halves. The
  // PARENT is the input key and the parts are targets. Entries without a `parts` array are
  // prose, and are filtered the way the engines skip them rather than by name.
  for (const [k, v] of Object.entries(mapDoc.split || {}))
    if (!k.startsWith('_') && v && typeof v === 'object' && Array.isArray(v.parts)) keySpace.set(k, 'split');

  // ── THE SUBJECT ROUTE, WHERE THE MAP DECLARES ONE ───────────────────────────────────────
  //
  // A subject-DEPENDENT cell does not reach ONE property. It reaches one of two, on a
  // declaration the record makes, so its printed key is not an input key at all: the two branch
  // keys are, and so is the discriminator, which names no printed cell. [R-35] is the ruling
  // that made this a class rather than an else branch. It is applied HERE rather than in each
  // caller because prompt 55’s classification author and this cycle’s crosswalk author had each
  // written their own copy of it, which is the parallel list again one level down.
  const routes = [];
  for (const [stem, d] of Object.entries(mapDoc.subject_classes || {})) {
    if (stem.startsWith('_') || !d || d.class !== 'dependent' || !d.route) continue;
    const { individual, entity, discriminator } = d.route;
    if (!individual || !entity || !discriminator) { problems.push(`subject_classes["${stem}"] is dependent and its route does not declare all of individual, entity and discriminator. A dependent cell with an incomplete route reaches nothing.`); continue; }
    routes.push({ stem, individual, entity, discriminator });
  }

  // APPLYING THE ROUTE. The dependent cell’s own key leaves the key space and the three keys
  // the engine actually reads take its place. The printed key is derived from the stem the same
  // way the map derives it — through `_key_overrides` first, then the camel-to-snake rule — so a
  // stem this function cannot resolve to a member is reported rather than assumed absent.
  for (const r of routes) {
    const override = (mapDoc._key_overrides || {})[r.stem];
    const derived = override || `${mapDoc.form}_${r.stem.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/_+/g, '_').toLowerCase()}`;
    if (keySpace.has(derived)) keySpace.delete(derived);
    else problems.push(`subject_classes["${r.stem}"] declares a route and its printed key "${derived}" is not in the key space. The substitution below would then ADD three keys without removing the one they replace.`);
    keySpace.set(r.individual, 'route');
    keySpace.set(r.entity, 'route');
    keySpace.set(r.discriminator, 'route-discriminator');
    r.replaced = derived;
  }

  // THE PREFIX ALIAS. `data[name] ?? data[PREFIX + name]` in every fill engine makes these one
  // member; the prefixed spelling wins where ENGINE_EXTRA_INPUTS declares it, because that is
  // the spelling the crosswalk, the registry and the live portal are already provisioned under.
  const PREFIX = `${mapDoc.form || ''}_`;
  const aliases = new Map();
  const extras = new Set(ENGINE_EXTRA_INPUTS[mapDoc.form] || []);
  for (const k of [...keySpace.keys()]) {
    if (k.startsWith(PREFIX)) continue;
    const prefixed = PREFIX + k;
    if (!extras.has(prefixed)) continue;
    keySpace.set(prefixed, keySpace.get(k));
    keySpace.delete(k);
    aliases.set(k, prefixed);
  }

  return { keySpace, groupSource, rowLevel, checkboxShape, aliases, routes, problems };

};

/**
 * THE NAMING MECHANISMS, per form. An entry that covers keys it does not spell out must
 * declare how, and the declaration is checked against its own stated count.
 */
export const MECHANISMS = {
  '433aoi': {
    // A prefix glob is only safe where the prefix belongs to ONE entry. `s2_sp_` does not: it
    // also matches the pay-period and business-interest cells, which are two other questions
    // under two other entries. So X-04's five spouse counterparts are derived by SUBSTITUTION
    // from the five taxpayer keys it names verbatim - which is what "counterparts" means and
    // what a prefix cannot express. The first draft of this table used the prefix, and the
    // count check is what caught it.
    'X-04': { kind: 'counterpart_substitution', phrase: 'and the five spouse counterparts', from: 's2_tp_', to: 's2_sp_', expect: 5 },
    // A GLOB IS A STOP UNLESS IT DECLARES WHAT IT SWEEPS. `expect: N` says how many and never
    // which, and X-18 is what that costs: it wrote `8c_*`, its prose named SIX facts of a
    // digital-asset block, and the prefix matched EIGHT keys - the extra two being a TOTAL and
    // the CHECKBOX that gates the block, neither of them a fact of the block and neither ever
    // looked at. X-18 is now enumerated and has no mechanism at all. The two globs that remain
    // each declare `sweeps`, the exact key list, and the check below refuses a set that differs
    // from it in either direction. A count can be satisfied by the wrong keys; a list cannot.
    'X-14': {
      kind: 'prefix_glob', phrase: '7b_* as five scalars', prefix: '7b_', expect: 5,
      sweeps: ['7b_description_of_asset', '7b_current_market_value', '7b_quick_sale_value', '7b_minus_loan_balance', '7b_total_remaining_furniture'],
    },
    'X-26': {
      kind: 'prefix_glob', phrase: 'and the five 31_spouse_* counterparts', prefix: '31_', expect: 5,
      sweeps: ['31_spouse_gross_wages', '31_spouse_social_security', '31_spouse_pensions', '31_spouse_other_income', '31_total_spouse_income'],
      note: 'THE PHRASE AND ITS OWN GLOB DISAGREE. Four keys match 31_spouse_* literally; the fifth counterpart is 31_total_spouse_income, which does not. The COUNT of five is right and the glob is one short, so the mechanism is read as the glob over the 31_ prefix, which yields exactly the five the phrase claims. Reported rather than silently widened, and now enumerated in `sweeps` so the widening is a list somebody can disagree with rather than a prefix nobody read.',
    },
  },
  // DECLARED EMPTY, NOT ABSENT. 433-B(OIC)'s classification names every key it covers verbatim —
  // no prefix glob, no counterpart substitution — so every entry derives `enumerated`, which is
  // the granularity standard C-21 settled. `MECHANISMS[form] || {}` would make an absent row and
  // a declared-empty row behave identically, and they are different statements: one says nobody
  // looked, the other says somebody looked and there is nothing to declare.
  '433boi': {},
  // DECLARED EMPTY for the same reason, and on this form the declaration carries a second one.
  // 433-B's classification is the first in the series that REUSES names, and a mechanism here
  // would be the obvious way to write "and the nine reused keys" — which is exactly the claim
  // that must stay enumerated, because a glob covering a reuse decision would name keys whose
  // permanence nobody looked at. Every entry names every key verbatim.
  '433b': {},
};

/** The granularity each mechanism kind carries, and the granularity of a bare verbatim naming. */
export const GRANULARITY_OF = {
  verbatim: 'enumerated',
  enumerated_keys: 'enumerated',
  prefix_glob: 'glob',
  counterpart_substitution: 'derived-counterpart',
};

/**
 * WHAT EACH ENTRY COVERS. Returns:
 *   coverage  Map(entryId -> Map(key -> how))   `how` is 'verbatim', 'verbatim (as groups.x)',
 *                                               'prefix_glob' or 'counterpart_substitution'
 *   namedBy   Map(key -> [entryId])
 *   problems  the A2-class failures: a mechanism that cannot read its own phrase, a mechanism
 *             whose added count differs from what it declared, a mechanism for an entry that
 *             does not exist, and a key named by more than one entry.
 *   notes     mechanism notes worth surfacing.
 */
export const coverageOf = (classDoc, mapDoc, form) => {
  const { keySpace, groupSource } = keySpaceOf(mapDoc);
  // THE ENGINE'S EXTRA INPUTS ARE PART OF THE KEY SPACE THE CLASSIFICATION MUST COVER, and they
  // are folded in HERE rather than in each caller — coverageCount() feeds blanket-audit [K-01]
  // and coverageOf() feeds every deriver, and two key spaces answering one completeness claim is
  // the two-instruments-one-claim defect this module's header is about. A form with no row in
  // ENGINE_EXTRA_INPUTS is untouched, which is how 433-A(OIC) and 433-F stay where they were.
  for (const k of (ENGINE_EXTRA_INPUTS[form] || [])) if (!keySpace.has(k)) keySpace.set(k, 'engine');
  const MECHANISM = MECHANISMS[form] || {};
  const entryById = new Map((classDoc.entries || []).map(e => [e.id, e]));
  const problems = [], notes = [];

  // AN ENTRY MAY NAME ITS KEYS AS A LIST, AND A LIST IS THE STRONGEST FORM THERE IS.
  //
  // The three naming mechanisms this module documents all read PROSE, because the first three
  // classifications were authored as prose and the reader was built for what existed. 433-D is
  // authored the other way: every entry carries an explicit `keys` array, checked against the
  // key space by its own generator on every run, with no glob and no count standing in for a
  // list — which is [R-15] and is the granularity standard this module already names
  // `enumerated`. Read only the prose and this file reports 0 of 78 covered on that form, which
  // is the reader unable to see its input rather than a classification that covers nothing:
  // exactly the shape [R-17] names, arriving through the module written to end it.
  //
  // IT WIDENS NOTHING ON THE OTHER FIVE FORMS. None of their entries carries a `keys` array, so
  // this branch is never taken there and the prose reader decides every one of their keys as
  // before. A key in the array that is not in the key space is not admitted here either — the
  // key space is still what bounds the answer, and the generator STOPs on such a key anyway.
  const enumeratedKeys = (entry, key) =>
    (Array.isArray(entry.keys) && entry.keys.includes(key)) ? 'enumerated_keys' : null;

  const verbatim = (entry, key) => {
    const prose = String(entry.oic || '');
    const re = new RegExp(`(^|[^A-Za-z0-9_])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_]|$)`);
    if (re.test(prose)) return 'verbatim';
    for (const [g, src] of Object.entries(groupSource)) {
      if (src === key && new RegExp(`(^|[^A-Za-z0-9_])groups\\.${g}([^A-Za-z0-9_]|$)`).test(prose)) return `verbatim (as groups.${g})`;
    }
    return null;
  };

  const coverage = new Map();
  for (const e of (classDoc.entries || [])) {
    const got = new Map();
    for (const k of keySpace.keys()) { const how = enumeratedKeys(e, k) || verbatim(e, k); if (how) got.set(k, how); }
    const m = MECHANISM[e.id];
    if (m) {
      const added = [];
      if (m.kind === 'prefix_glob') { for (const k of keySpace.keys()) if (!got.has(k) && k.startsWith(m.prefix)) added.push(k); }
      else if (m.kind === 'counterpart_substitution') { for (const v of [...got.keys()]) { const c = v.replace(m.from, m.to); if (c !== v && keySpace.has(c) && !got.has(c)) added.push(c); } }
      if (!String(e.oic || '').includes(m.phrase)) problems.push({ id: 'A2', msg: `${e.id} was expected to carry the phrase "${m.phrase}" in its oic field and does not. The mechanism cannot read its own input, which is not the same as there being nothing to check.` });
      if (added.length !== m.expect) problems.push({ id: 'A2', msg: `${e.id} mechanism ${m.kind} expected to add ${m.expect} key(s) and added ${added.length}: [${added.join(', ')}]. A mechanism whose count does not hold is covering the wrong keys.` });
      // A GLOB IS A STOP UNLESS IT DECLARES WHAT IT SWEEPS. The count above is satisfiable by
      // the wrong keys; this is not. Both directions are failures: a key swept that the list
      // does not name is a cell nobody classified, and a key the list names that the glob no
      // longer matches is a claim about a cell that has moved out from under it.
      if (m.kind === 'prefix_glob') {
        if (!Array.isArray(m.sweeps)) problems.push({ id: 'A2', msg: `${e.id} declares a prefix_glob over "${m.prefix}" and no \`sweeps\` list. A glob makes a claim over a set its author never enumerated; declaring how MANY keys it takes is not declaring WHICH.` });
        else {
          const declared = new Set(m.sweeps);
          const undeclared = added.filter(k => !declared.has(k));
          const missing = m.sweeps.filter(k => !added.includes(k));
          if (undeclared.length) problems.push({ id: 'A2', msg: `${e.id} glob "${m.prefix}" swept ${undeclared.length} key(s) its \`sweeps\` list does not name: [${undeclared.join(', ')}]. That is a cell carried into a category nobody looked at it for.` });
          if (missing.length) problems.push({ id: 'A2', msg: `${e.id} glob "${m.prefix}" declares ${missing.length} key(s) it did not sweep: [${missing.join(', ')}]. A declaration for a key the glob no longer reaches is a claim about a cell that has moved out from under it.` });
        }
      }
      for (const k of added) got.set(k, m.kind);
      if (m.note) notes.push(`${e.id}: ${m.note}`);
    }
    coverage.set(e.id, got);
  }
  for (const id of Object.keys(MECHANISM)) if (!entryById.has(id)) problems.push({ id: 'A2', msg: `naming mechanism declared for ${id}, which is not an entry in the classification.` });

  const namedBy = new Map();
  for (const e of (classDoc.entries || [])) for (const k of coverage.get(e.id).keys()) namedBy.set(k, [...(namedBy.get(k) || []), e.id]);
  for (const [k, ids] of namedBy) if (ids.length > 1) problems.push({ id: 'A2', msg: `input key "${k}" is named by ${ids.length} entries (${ids.join(', ')}). A key covered twice is a key whose category depends on which entry you read.` });

  return { keySpace, groupSource, coverage, namedBy, problems, notes, MECHANISM };
};

/**
 * THE COMPLETENESS FIGURE ITSELF, for [K-01] and for A1. Covered against the universe, with
 * the uncovered keys named — because "232 of 238" without the six is a figure nobody can act on.
 */
export const coverageCount = (form) => {
  const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
  const classDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.crosswalk-classification.json`, 'utf8'));
  const { keySpace, namedBy } = coverageOf(classDoc, mapDoc, form);
  const keys = [...keySpace.keys()];
  const uncoveredList = keys.filter(k => !namedBy.has(k));
  return { universe: keys.length, covered: keys.length - uncoveredList.length, uncoveredList };
};

/**
 * THE GRANULARITY OF EVERY ENTRY, derived from HOW it names its keys rather than declared by
 * hand. C-21 is the question of what a glob is allowed to claim; it cannot be answered while
 * two entries of the same shape carry different granularity and nothing says so.
 */
export const granularityOf = (classDoc, mapDoc, form) => {
  const { coverage, MECHANISM } = coverageOf(classDoc, mapDoc, form);
  const out = [];
  for (const e of (classDoc.entries || [])) {
    const hows = new Set([...coverage.get(e.id).values()].map(h => (h.startsWith('verbatim') ? 'verbatim' : h)));
    const kinds = [...hows].map(h => GRANULARITY_OF[h] || h).sort();
    out.push({
      id: e.id,
      keys: coverage.get(e.id).size,
      // An entry naming nothing in the key space covers no key — legitimate for
      // `asymmetric-the-other-way`, whose whole content is a 433-A fact this form does not print.
      granularity: kinds.length === 0 ? 'names-no-key-on-this-form' : kinds.join('+'),
      mechanism: MECHANISM[e.id]?.kind ?? null,
    });
  }
  return out;
};
