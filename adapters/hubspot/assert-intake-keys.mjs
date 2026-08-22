// THE WRITER-RESOLVER KEY ASSERTION — every form, including the ones where it is a no-op.
//
//   node adapters/hubspot/assert-intake-keys.mjs [form ...]
//   exit 0 = every spelling one component emits is a spelling the component that consumes it
//            can resolve, on every mapped form
//   exit 2 = a spelling could not be resolved, or the check could not read one of its inputs
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Prompt 42 found a money value written unrounded under a key spelling the resolver could not
// consume. It was harmless only because nothing had consumed it yet, and the ruling that came
// out of it is standing:
//
//   ANY KEY SPELLING ONE COMPONENT EMITS AND ANOTHER CONSUMES IS ASSERTED AT THE BOUNDARY,
//   ON EVERY FORM INCLUDING THOSE WHERE THE FEATURE IS INERT, SO THE NO-OP IS PROVED
//   RATHER THAN ASSUMED.
//
// This engine has two such boundaries between HubSpot and the page, and both are silent when
// they break — no error, a valid PDF, exit 0:
//
//   OPTION VALUES   hs-fetch-<form>.mjs translates a stored value through the property's
//                   `map_option_by_value` and writes the RESULT into the record. The fill
//                   engine then resolves that result against the map's own option keys. If the
//                   two spellings disagree, no box is checked and nothing says so.
//   ROW SHAPES      a group property's `row_shape` is the column list an intake form is built
//                   against and the list hs-fetch checks a stored row against. The fill engine
//                   reads the map's SLOT columns. A column in one and not the other is a cell
//                   that prints empty on a signed financial statement.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A FORM WITH NOTHING TO CHECK IS REPORTED AS PROVING A NO-OP, NEVER SKIPPED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433-A carries no `row_shape` on any of its fourteen group properties — its generator predates
// the field — so the row-shape half of this check has nothing to compare there. That is a
// DECLARED no-op with a reason printed on the run, not a form quietly missing from the table.
// The distinction is the whole point of the ruling: "no rows to check" and "every row checks
// out" are indistinguishable from an exit code.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// AN UNRESOLVABLE SPELLING IS A STOP UNLESS IT IS REGISTERED, AND A REGISTRATION IS A CLAIM
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// KNOWN_UNRESOLVABLE below is the exclusion register. Every entry names the form, the key, the
// value, WHAT HAPPENS when a record carries it, and the carried id it is filed under. An
// unregistered unresolvable spelling is a STOP; a registered one is REPORTED on every run, so
// it cannot fade into a passing line. An entry whose value is no longer unresolvable is also a
// STOP — a registration for a problem that has gone away is a registration nobody re-reads.

import { readFileSync, existsSync } from 'node:fs';
import { loadBindings, constructOf, CONSTRUCT_KIND, readsSourceConstruct, bindingSourceOf } from './bindings.mjs';
import { MAPPED_FORMS } from '../pdf/resolve-fixture.mjs';
import { ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';
import { loadRecordShape, statesOf } from '../pdf/record-shape.mjs';

const R = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Spellings a lone check-here box and a bare truthy flag accept, from the fill engines. */
const TRUTHY_SPELLINGS = ['yes', 'no', 'true', 'false'];

/**
 * PER-FORM RESOLVERS FOR THE KEYS WHOSE ACCEPTED SET IS NOT THE MAP'S OWN CHECKBOX BLOCK.
 * Declared rather than guessed: 433-F's engine reads `input('pay_freq')` through a prefix
 * helper and resolves it against `checkboxes.pay_freq.index` after normalising the string, and
 * no rule over the key name alone could have found that.
 */
const RESOLVERS = {
  '433f': {
    '433f_address_differs': () => ({ accepted: TRUTHY_SPELLINGS, where: 'fill-433f.mjs truthy(input("address_differs"))' }),
    '433f_pay_freq': (MAP) => ({ accepted: Object.keys(MAP.checkboxes?.pay_freq?.index || {}), where: 'fill-433f.mjs freqIndex against checkboxes.pay_freq.index', normalise: true }),
    '433f_spouse_pay_freq': (MAP) => ({ accepted: Object.keys(MAP.checkboxes?.pay_freq?.index || {}), where: 'fill-433f.mjs freqIndex against checkboxes.pay_freq.index', normalise: true }),
    '433f_age_band': () => ({ accepted: ['under_65', '65_over'], where: 'fill-433f.mjs, which reads std.oop["65_over"] when age_band is "65_over" and std.oop["under_65"] otherwise' }),
  },
};

/** The engine's own normalisation, where it has one. */
const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/[\s._-]/g, '');

/**
 * ROW COLUMNS A FILL ENGINE CONSUMES THAT ARE NOT SLOT TEXT CELLS.
 *
 * A slot binds a column to a printed text target. Some columns are read by the engine to decide
 * which CHECKBOX to tick instead, and those bind no text target at all — so a universe built
 * from slot columns alone reports them as columns nothing prints, which is false. Declared per
 * form from reading the engine, the same standard ENGINE_EXTRA_INPUTS is held to.
 */
const GROUP_FLAG_COLUMNS = {
  '433f': {
    bank_accounts: ['is_business_account'],   // fill-433f.mjs -> checkboxes.account_business_bank[i]
    investments: ['is_business_account'],     // fill-433f.mjs -> checkboxes.account_business_investments[i]
    real_estate: ['kind'],                    // fill-433f.mjs -> checkboxes.real_estate[i].primary / .other
  },
};

/**
 * THE UNIVERSE A DECLARED COLUMN HAS TO BE CONSUMED IN, AND IT IS NOT ONE FORM.
 *
 * `irs433_investments` is ONE table property that 433-A, 433-F and 433-A(OIC) all bind, and each
 * prints a different subset of its columns: 433-F prints a phone and no quick-sale value, 433-A(OIC)
 * prints a quick-sale value and no phone. A row stored by one form is legitimately missing columns
 * the other prints — hs-fetch-433aoi.mjs says so in its own header — so a column this form does not
 * print is only a defect if NO form that shares the property prints it and no engine reads it.
 *
 * The first draft of this check compared each row_shape against ONE form's slots and reported
 * eleven columns as collecting values nothing prints. Eight were its own reader missing 433-F's
 * flat slot shape; three were this: a figure quoted against the wrong universe.
 */
const consumedColumnsFor = (hsName, allForms) => {
  const cols = new Set();
  for (const { form, group, MAP } of (allForms.get(hsName) || [])) {
    const def = MAP.groups[group];
    if (!def) continue;
    for (const s of def.slots || []) {
      const text = s.text || s;
      for (const [c, t] of Object.entries(text)) if (typeof t === 'string' && t.startsWith('topmostSubform[0]')) cols.add(c);
      for (const c of Object.keys(s.checkboxes || {})) cols.add(c);
    }
    if (def.row_class?.column) cols.add(def.row_class.column);
    for (const c of (GROUP_FLAG_COLUMNS[form]?.[group] || [])) cols.add(c);
  }
  return cols;
};

export const KNOWN_UNRESOLVABLE = [
  {
    form: '433f', key: '433f_pay_freq', value: 'other', carried: 'F-04',
    what_happens: 'fill-433f.mjs normalises the value and looks it up in checkboxes.pay_freq.index, which holds weekly/biweekly/semimonthly/monthly and nothing else. "other" is not there, freqIndex returns undefined, NO BOX IS CHECKED and the run exits 0 with a valid PDF that says nothing about the pay period.',
    why_it_is_registered_rather_than_fixed: 'THE FORM PRINTS NO OTHER BOX. 433-F draws Weekly / Bi-weekly / Semi-monthly / Monthly and no fourth option, which adapters/hubspot/433aoi.divergence-decisions.mjs already records from the other direction: irs433_tp_pay_period carries five options because 433-F needed semi-monthly, and 433-A(OIC) prints four. So the value is legitimately storable on the shared property and legitimately unprintable on this form. What is WRONG is that it is unprintable SILENTLY: the correct behaviour is the one 433-A(OIC) already has, where fill-433aoi pushes an optionError and writes no PDF. Fixing that is a change to a live form\'s fill engine and to a provisioned property\'s option set, neither of which belongs in a 433-B(OIC) provisioning pass.',
  },
  {
    form: '433f', key: '433f_spouse_pay_freq', value: 'other', carried: 'F-04',
    what_happens: 'Identical to the taxpayer side above, on the spouse row of the same printed block.',
    why_it_is_registered_rather_than_fixed: 'Same cause, same decision. Reading two identically-caused cases two different ways would be worse than reading them both wrong.',
  },
];


// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY. A new instrument is the least trustworthy object in the repo, and this one has
// already been wrong twice before it ran clean: it read only the nested slot shape, so every
// 433-F group reported a slot-column set of size zero; and it judged WIDE against one form's
// slots when the property is shared by three. Both drafts EXITED NON-ZERO, which is the
// forgiving direction. The direction that matters is the other one, so each of the three
// detectors is fired here against an input it MUST refuse, on every run, and a detector that
// does not bite is a STOP before any real form is read.
// ═══════════════════════════════════════════════════════════════════════════════════════
const canaryFailures = [];
{
  const TARGET = 'topmostSubform[0].Canary[0].cell[0]';
  const fakeMap = {
    checkboxes: { cb_two_options: { alpha: TARGET, beta: TARGET, _printed: 'prose, not an option' } },
    check_here: {},
    groups: {
      canary_table: { source: 'canary_rows', slots: [{ text: { printed_col: TARGET } }], row_class: { column: 'asset_class', accepts: ['canary'] } },
    },
  };
  const tables = new Map([['irs433_canary', [{ form: 'canary', group: 'canary_table', MAP: fakeMap }]]]);

  // 1. an option value the accepted set does not carry
  const accepted = Object.keys(fakeMap.checkboxes.cb_two_options).filter((k) => !k.startsWith('_') && k !== 'index');
  if (accepted.length !== 2) canaryFailures.push('the accepted-set reader did not find exactly the two declared options on a two-option checkbox block; it found ' + accepted.length + '.');
  if (accepted.includes('gamma')) canaryFailures.push('the accepted-set reader admitted a value the block does not declare.');

  // 2. a row shape SHORT of a column the form's own slots bind
  const slotCols = consumedColumnsFor('irs433_canary', tables);
  if (!slotCols.has('printed_col')) canaryFailures.push('the column reader did not find a nested slot text column.');
  if (!slotCols.has('asset_class')) canaryFailures.push('the column reader did not find the declared row_class column.');
  if (slotCols.has('never_declared')) canaryFailures.push('the column reader invented a column no slot binds.');

  // 3. the flat slot shape, which the first draft could not read at all
  const flatMap = { checkboxes: {}, check_here: {}, groups: { flat_table: { source: 'flat_rows', slots: [{ flat_col: TARGET }] } } };
  const flatCols = consumedColumnsFor('irs433_flat', new Map([['irs433_flat', [{ form: 'canary', group: 'flat_table', MAP: flatMap }]]]));
  if (!flatCols.has('flat_col')) canaryFailures.push('the column reader still cannot read a FLAT slot shape, which is the defect this canary was written for.');

  // 4. the cross-form union: a column one sharer prints is consumed for all of them
  const shared = consumedColumnsFor('irs433_shared', new Map([['irs433_shared', [
    { form: 'canary', group: 'a', MAP: { groups: { a: { source: 's', slots: [{ text: { only_on_a: TARGET } }] } } } },
    { form: 'canary2', group: 'b', MAP: { groups: { b: { source: 's', slots: [{ text: { only_on_b: TARGET } }] } } } },
  ]]]));
  if (!(shared.has('only_on_a') && shared.has('only_on_b'))) canaryFailures.push('the cross-form union did not take the union: a column printed by one sharer was not consumed for the property.');
  if (shared.has('printed_col')) canaryFailures.push('the cross-form union leaked a column from another property.');
}
if (canaryFailures.length) {
  console.error('CANARY DID NOT BITE — refusing to report on any real form:');
  canaryFailures.forEach((f) => console.error('  ' + f));
  process.exit(2);
}

const forms = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const LIST = forms.length ? forms : MAPPED_FORMS();

// EVERY MAPPED FORM'S GROUPS, KEYED BY THE PROPERTY THEY BIND. Built before the per-form loop
// because the row-shape universe is cross-form: see consumedColumnsFor above.
const universeGaps = [];
const tablesByProperty = new Map();
for (const form of MAPPED_FORMS()) {
  let MAP, bindings;
  // AN UNREADABLE FORM IS RECORDED, NOT SKIPPED. This pre-pass builds the cross-form universe a
  // WIDE verdict is judged against, so a form dropped here silently NARROWS that universe and a
  // column another form legitimately prints starts looking like a column nothing prints. The
  // per-form loop below reports the same failure for any form in LIST; this catch exists because
  // the pre-pass walks EVERY mapped form even when LIST is one of them, so a form outside LIST
  // would otherwise fail here and be reported nowhere at all.
  try { MAP = R(`adapters/pdf/maps/${form}.map.json`); bindings = loadBindings(form); }
  catch (e) { universeGaps.push(`${form}: ${e.message}`); continue; }
  const groupBy = {};
  for (const [g, d] of Object.entries(MAP.groups || {})) if (!g.startsWith('_')) groupBy[d.source || d.array || g] = g;
  for (const b of bindings) if (b.kind === 'group' && groupBy[b.key]) {
    if (!tablesByProperty.has(b.hs_name)) tablesByProperty.set(b.hs_name, []);
    tablesByProperty.get(b.hs_name).push({ form, group: groupBy[b.key], MAP });
  }
}

const problems = [];
for (const g of universeGaps) problems.push(`UNIVERSE GAP  ${g}. This form could not be read into the cross-form table universe, so a column another form prints could be reported as a column nothing prints. A narrowed universe is not a smaller answer to the same question; it is an answer to a different one.`);
const registered = new Set(KNOWN_UNRESOLVABLE.map((k) => `${k.form}|${k.key}|${k.value}`));
const hitRegistrations = new Set();
const rows = [];
const constructRows = [];

for (const form of LIST) {
  let MAP, bindings;
  try { MAP = R(`adapters/pdf/maps/${form}.map.json`); } catch (e) { problems.push(`UNREADABLE MAP  ${form}: ${e.message}. A form whose map cannot be read is not a form with nothing to check.`); continue; }
  try { bindings = loadBindings(form); } catch (e) { problems.push(`UNREADABLE BINDINGS  ${form}: ${e.message}. Same reason.`); continue; }

  // ── THE THIRD BOUNDARY: CONSTRUCT NAMES ───────────────────────────────────────────────
  //
  // bindings.mjs decides a property's `kind` from the `source` string a GENERATOR wrote, and
  // until Prompt 44 it did so by comparing that string to literals — matching the generator's
  // spellings by coincidence, with nothing asserting they matched. An unrecognised construct
  // fell through to `scalar`, and a scalar is passed to the fill engine untranslated: an
  // option value that needed translating reaches the page as nothing, on a valid PDF, exit 0.
  //
  // `constructOf` and `CONSTRUCT_KIND` are IMPORTED, never restated — a second copy of the
  // vocabulary here would be a second answer to the question the vocabulary exists to make one
  // answer to, which is the parallel-list defect guard-sweep.mjs enumerates.
  //
  // ASSERTED ON EVERY FORM INCLUDING THE INERT ONES. 433-F takes the crosswalk path and its
  // rows carry no `source` at all, so this half has nothing to compare there — REPORTED as a
  // proved no-op, never skipped, because "no constructs to check" and "every construct checks
  // out" are indistinguishable from an exit code.
  let constructRow = { form, constructs: [], rows: 0, path: 'crosswalk (no `source` field)' };
  try {
    const artefact = `adapters/hubspot/fields.${form}.json`;
    const doc = existsSync(artefact) ? R(artefact) : null;
    if (doc?.properties) {
      const seen = new Map();
      for (const p of doc.properties) {
        const c = constructOf(p.source);
        if (!seen.has(c)) seen.set(c, []);
        seen.get(c).push(p.key);
      }
      const reads = readsSourceConstruct(form);
      constructRow = { form, constructs: [...seen.keys()].sort(), rows: doc.properties.length, path: artefact, reads,
        unknown: [...seen.keys()].filter((c) => CONSTRUCT_KIND[c] === undefined) };
      for (const [c, keys] of seen) {
        if (CONSTRUCT_KIND[c] !== undefined) continue;
        const where = `${artefact} writes source construct ${JSON.stringify(c)} on ${keys.length} propert(ies) ` +
          `(${keys.slice(0, 4).join(', ')}${keys.length > 4 ? ', …' : ''}), and bindings.mjs CONSTRUCT_KIND names only ` +
          `[${Object.keys(CONSTRUCT_KIND).join(', ')}].`;
        if (reads) {
          problems.push(
            `UNKNOWN CONSTRUCT  ${where} This form's kind is resolved THROUGH that string, so the generator that ` +
            `writes this file and the resolver that reads it have parted on a spelling — and the resolver's answer ` +
            `for an unknown construct used to be the silent one.`);
        } else {
          // INERT, AND REPORTED RATHER THAN INVISIBLE. bindingSourceOf says this form takes the
          // crosswalk path, so nothing reads its `source` and no value is mis-shaped today.
          // It is still a divergence: the artefact's vocabulary is not the vocabulary, and the
          // day this form moves to the derived path those rows throw. Carried, not silenced.
          constructRow.inertDivergence = (constructRow.inertDivergence || []).concat(
            `${where} INERT: bindingSourceOf("${form}") is "${bindingSourceOf(form)}", so this file's \`source\` is read by nothing. [D-13]`);
        }
      }
      // AND THE OTHER DIRECTION. A construct the vocabulary names that NO generator has ever
      // written on any form is a resolver branch nothing exercises — reported across the whole
      // LIST below rather than per form, since a construct live on one form is live.
    }
  } catch (e) { problems.push(`UNREADABLE DEFINITIONS  ${form}: ${e.message}. The construct vocabulary could not be compared, which is not the same as it agreeing.`); }
  constructRows.push(constructRow);

  const cbKeys = new Set(Object.entries(MAP.checkboxes || {}).filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object' && !Array.isArray(v)).map(([k]) => k));
  const chKeys = new Set(Object.entries(MAP.check_here || {}).filter(([k, v]) => !k.startsWith('_') && v && typeof v.target === 'string').map(([k]) => k));
  const groupBySource = {};
  for (const [g, d] of Object.entries(MAP.groups || {})) if (!g.startsWith('_')) groupBySource[d.source || d.array || g] = g;
  const RS = loadRecordShape(MAP);
  const routeStates = {};
  for (const d of RS.declarations) routeStates[d.input] = statesOf(d);
  const extras = new Set(ENGINE_EXTRA_INPUTS[form] || []);

  const optionRows = bindings.filter((b) => b.map_option_by_value);
  const groupRows = bindings.filter((b) => b.kind === 'group');
  const withShape = groupRows.filter((b) => Array.isArray(b.row_shape));

  // ── option values ────────────────────────────────────────────────────────────────────
  let optionChecked = 0, optionValues = 0;
  for (const b of optionRows) {
    let acc = null;
    const custom = RESOLVERS[form]?.[b.key];
    if (custom) acc = custom(MAP);
    else if (cbKeys.has(b.key)) acc = { accepted: Object.keys(MAP.checkboxes[b.key]).filter((k) => !k.startsWith('_') && k !== 'index'), where: `${form}.map.json checkboxes.${b.key}` };
    else if (chKeys.has(b.key)) acc = { accepted: TRUTHY_SPELLINGS, where: `the check_here spellings fill-${form}.mjs accepts` };
    else if (extras.has(b.key) && routeStates[b.key]) acc = { accepted: routeStates[b.key], where: `${form}.map.json record_shape declaration for "${b.key}"` };
    if (!acc || !acc.accepted.length) {
      problems.push(`UNREADABLE ACCEPTED SET  ${form}/${b.key} declares map_option_by_value and this check cannot find the set of values the engine accepts for it. An unreadable input is reported, never passed: declare a resolver in RESOLVERS.`);
      continue;
    }
    optionChecked++;
    const accepted = acc.normalise ? acc.accepted.map(norm) : acc.accepted;
    for (const v of new Set(Object.values(b.map_option_by_value).map(String))) {
      optionValues++;
      const ok = accepted.includes(acc.normalise ? norm(v) : v);
      if (ok) continue;
      const id = `${form}|${b.key}|${v}`;
      if (registered.has(id)) { hitRegistrations.add(id); continue; }
      problems.push(
        `UNRESOLVABLE SPELLING  ${form}/${b.key} emits ${JSON.stringify(v)} and ${acc.where} accepts only [${acc.accepted.join(', ')}].\n`
        + `      The fetch layer would write that value into the record and the fill engine would resolve nothing, with no error and a valid PDF.`);
    }
  }

  // ── row shapes ───────────────────────────────────────────────────────────────────────
  let shapeChecked = 0;
  for (const b of withShape) {
    const g = groupBySource[b.key];
    if (!g) { problems.push(`NO GROUP  ${form}/${b.key} carries a row_shape and no group in ${form}.map.json has it as a source. The shape describes a table the engine does not have.`); continue; }
    const def = MAP.groups[g];
    const cols = new Set();
    // TWO SLOT SHAPES EXIST IN THIS TREE AND BOTH ARE READ, never assumed. 433-A, 433-A(OIC) and
    // 433-B(OIC) nest a slot's text cells under `text`; 433-F writes them FLAT as column ->
    // target. adapters/pdf/assert-overflow.mjs already reads both — `lastSlot.text || lastSlot` —
    // and the first draft of this file read only the nested one, which made every 433-F group
    // report a slot-column set of SIZE ZERO and therefore every declared column "wide". That is
    // an instrument reporting eight defects that are its own, on its first run, which is what a
    // new instrument is for until it has been held to something that already worked.
    for (const s of def.slots || []) {
      const text = s.text || s;
      for (const [c, t] of Object.entries(text)) if (typeof t === 'string' && t.startsWith('topmostSubform[0]')) cols.add(c);
      for (const c of Object.keys(s.checkboxes || {})) cols.add(c);
    }
    if (def.row_class?.column) cols.add(def.row_class.column);
    const declared = new Set(b.row_shape);
    const missing = [...cols].filter((c) => !declared.has(c));
    shapeChecked++;
    // SHORT is judged against THIS form's own cells: this form prints the cell and the property's
    // declared shape has no key for it, which is a cell that prints empty on a signed statement.
    if (missing.length) problems.push(`ROW SHAPE SHORT  ${form}/${b.key} (groups.${g}) declares no column for [${missing.join(', ')}], which the map's slots do declare. A stored row would carry no key for those cells and they would print empty.`);
    // WIDE is judged against EVERY form that binds the same table property, because that is the
    // universe the stored row actually lives in.
    const everywhere = consumedColumnsFor(b.hs_name, tablesByProperty);
    const orphanCols = [...declared].filter((c) => !everywhere.has(c));
    if (orphanCols.length) {
      const sharers = (tablesByProperty.get(b.hs_name) || []).map((x) => x.form).join(', ');
      problems.push(`ROW SHAPE WIDE  ${form}/${b.key} declares [${orphanCols.join(', ')}] on ${b.hs_name}, and NO form that binds that property prints or reads those columns (bound by: ${sharers}). An intake form built from this shape collects a value nothing anywhere prints.`);
    }
  }

  rows.push({ form, optionRows: optionRows.length, optionChecked, optionValues, groupRows: groupRows.length, withShape: withShape.length, shapeChecked });
}

// A REGISTRATION FOR A PROBLEM THAT HAS GONE AWAY IS A STOP.
for (const k of KNOWN_UNRESOLVABLE) {
  const id = `${k.form}|${k.key}|${k.value}`;
  if (LIST.includes(k.form) && !hitRegistrations.has(id)) {
    problems.push(`STALE REGISTRATION  ${k.form}/${k.key} is registered as emitting the unresolvable value ${JSON.stringify(k.value)} and this run did not find it. Either the value is gone, in which case remove the registration, or the check stopped looking.`);
  }
}

console.log(`intake-key assertion: ${LIST.length} mapped form(s) — ${LIST.join(', ')}`);
console.log('');
console.log('  CONSTRUCT VOCABULARY — bindings.mjs CONSTRUCT_KIND, asserted on every form including the inert ones');
for (const c of constructRows) {
  const reads = c.reads === undefined ? 'no definitions file'
    : c.reads ? 'kind IS resolved through `source`'
      : `kind is NOT resolved through \`source\` (${bindingSourceOf(c.form)} path)`;
  console.log(`  ${c.form.padEnd(9)} ${String(c.rows).padStart(4)} row(s)   ${reads}`);
  console.log(`             constructs written: ${c.constructs.length ? c.constructs.join(', ') : `(none — ${c.path})`}`);
  // THE FIGURES, NOT A VERDICT. Each line names how many constructs the artefact writes, how
  // many of them the vocabulary holds, and how many the resolver reads — so a form with nothing
  // to compare prints 0 of 0 read rather than a sentence that reads as a pass.
  const known = c.constructs.filter((x) => CONSTRUCT_KIND[x] !== undefined).length;
  console.log(`             ${c.constructs.length} construct(s) written, ${known} named by CONSTRUCT_KIND, ${c.reads ? c.constructs.length : 0} read by the resolver (${c.reads ? 'derived/generated' : bindingSourceOf(c.form)} path)`);
  for (const d of (c.inertDivergence || [])) console.log(`             DIVERGENCE, inert and reported every run: ${d}`);
}
console.log('');
console.log('  FORM      option rows  resolved  values  group rows  with row_shape  shapes checked');
for (const r of rows) {
  console.log(`  ${r.form.padEnd(9)} ${String(r.optionRows).padStart(11)} ${String(r.optionChecked).padStart(9)} ${String(r.optionValues).padStart(7)} ${String(r.groupRows).padStart(11)} ${String(r.withShape).padStart(15)} ${String(r.shapeChecked).padStart(15)}`);
  // THE NO-OP, PROVED AND PRINTED. Silence here would be indistinguishable from a pass.
  if (!r.optionRows) console.log(`             no-op proved: ${r.form} declares no property with map_option_by_value, so the option half of this check has nothing to compare and says so.`);
  if (r.groupRows && !r.withShape) console.log(`             no-op proved: ${r.form} has ${r.groupRows} group propert(ies) and none carries a row_shape, so the row-shape half has nothing to compare. That is the artefact's shape, not an empty result.`);
}
console.log('');
if (KNOWN_UNRESOLVABLE.length) {
  console.log(`  ${hitRegistrations.size} registered unresolvable spelling(s) found, of ${KNOWN_UNRESOLVABLE.length} registered:`);
  for (const k of KNOWN_UNRESOLVABLE) console.log(`    ${k.form}/${k.key} = ${JSON.stringify(k.value)}  [${k.carried}]  ${k.what_happens.slice(0, 120)}...`);
  console.log('');
}

if (problems.length) {
  console.error(`ASSERT-INTAKE-KEYS FAILED — ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(2);
}
const totals = rows.reduce((a, r) => ({ values: a.values + r.optionValues, props: a.props + r.optionChecked, shapes: a.shapes + r.shapeChecked }), { values: 0, props: 0, shapes: 0 });
// THE SUCCESS MESSAGE IS GUARDED BY WHAT IT REPORTS ON. Its first draft claimed every declared
// row shape was "exactly its group's slot columns", which stopped being what the check asserts
// the moment WIDE moved to the cross-form universe — a sentence describing an older check,
// printed by the newer one, on every passing run.
console.log(`ASSERT-INTAKE-KEYS PASSED — ${totals.values} option value(s) across ${totals.props} propert(ies) each resolve against the spellings their own form engine accepts; ${totals.shapes} declared row shape(s) carry every column their own form slots bind and no column that NO form sharing the property consumes; ${KNOWN_UNRESOLVABLE.length} registered exception(s), every one of them found.`);
