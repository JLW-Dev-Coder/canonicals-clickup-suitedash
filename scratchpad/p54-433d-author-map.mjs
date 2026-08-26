// 433-D'S MAP, AUTHORED FROM THE PROVED MIRROR AND THE DERIVED CLASS TABLE.
//
//   node scratchpad/p54-433d-author-map.mjs [--check]
//
//   writes adapters/pdf/maps/433d.map.json, 433d.totals.json, 433d.headings.json
//   --check re-derives and compares without writing; a difference is a STOP
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// NOTHING HERE IS TRANSCRIBED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Every TARGET comes out of adapters/pdf/maps/433d.mirror.json, which gen-mirror.mjs derives
// from the widget geometry of the pinned blank and assert-mirror.mjs rebuilds and compares on
// every sweep. Every CLASS, SIDE and CAPTION comes out of adapters/pdf/maps/433d.subject-classes
// .json, which is re-derived byte for byte on every `npm run sweeps:deep`. This file joins them
// and adds three things that are decisions rather than readings, each declared below.
//
// THE INPUT KEY IS AN IDENTIFIER AND CARRIES NO CLAIM. It is `433d_` plus the leaf stem in snake
// case, and that is the ONE place a leaf name is used for anything on this form. [R-08] says a
// leaf name is evidence of nothing, and it is not evidence here: the key names no cell and
// asserts no meaning. What identifies the cell is the TARGET PAIR, from the geometry, and what
// says what the cell IS is the printed `caption` carried beside every binding. On this form the
// stems happen to be unusually descriptive -- `RoutingNumber3`, `SpouseSignature` -- and that is
// the reason to be careful rather than the reason to relax: 433-A's leaf names are swapped
// against its printed columns, and a reader who takes `433d_spouse_signature` as the evidence is
// reading the same kind of object that was wrong there.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE THREE DECISIONS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 1. THE EXCLUSIVE SETS ARE DERIVED, NOT LISTED. An exclusive set is a PRINTED SERIES all of
//    whose members are checkboxes -- the same series derivation the class table uses, which
//    knows nothing about checkboxes. Three come out: the RSI column, the AI column and the lien
//    column. The three LONE ticks (the W-4 box, the debit self-identifier and the pre-assessed
//    modules box) are in no series and are bound as lone ticks, which is a derived distinction
//    rather than a judgement about which boxes look like a group.
//
//    THE PRINTED GROUND IS NOT EQUALLY STRONG FOR ALL THREE AND IS NOT PRETENDED TO BE. The lien
//    column prints "(Check one box below)" verbatim above it. The RSI and AI columns print
//    "Check the appropriate boxes:", which does not say one per column; what carries them is
//    that each column's three captions are three VALUES OF ONE NAMED INDICATOR -- RSI "1",
//    RSI "5", RSI "6" -- which is readable from the captions themselves. Both grounds are
//    written into the map beside their sets.
//
// 2. ONE EXCLUSIVE SET PER PRINTED SET PER COPY, so six rather than three. Both copies of a
//    mirrored cell receive the same value, so an exclusive set spanning both copies would hold
//    TWO checked boxes on every correctly filled form and fail by construction. The set is a
//    claim about one printed column on one printed page, and this form draws each column twice.
//
// 3. THE DEPENDENT CELL'S ROUTE NAMES TWO INPUT KEYS AND ONE TARGET PAIR. There is one printed
//    box for the identifier and the record supplies it from `433d_tin_ssn_itin` or
//    `433d_tin_ein` according to `433d_subject`. Two properties, one cell, a declared
//    discriminator -- which is what [SC-6] requires of a dependent class and what a conditional
//    class is forbidden from having.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readForm } from '../adapters/pdf/caption-candidates.mjs';

const MIRROR = 'adapters/pdf/maps/433d.mirror.json';
const CLASSES = 'adapters/pdf/maps/433d.subject-classes.json';
const check = process.argv.includes('--check');

const mirror = JSON.parse(readFileSync(MIRROR, 'utf8'));
const classes = JSON.parse(readFileSync(CLASSES, 'utf8'));
const fields = JSON.parse(readFileSync('adapters/pdf/maps/433d.fields.json', 'utf8'));
const page = await readForm('433d');
if (page.stop) { console.error(`STOP — ${page.stop}`); process.exit(2); }

const snake = (s) => s
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
  .replace(/_+/g, '_')
  .toLowerCase();

// THE SNAKE-CASE KEY IS NOT INJECTIVE ON THIS FORM, AND THE PARTITION IS WHAT SAID SO.
// 433-D draws FOUR cells whose leaf stems differ from another stem ONLY IN CASE: `Date1` in the
// signature row and `date1` in the increase table, and the same for 2. Lowercasing collapses
// each pair onto one key, so the first draft of this generator silently bound 68 text stems
// instead of 70 -- two targets written by a key that had already been used and then overwritten
// -- and the derived partition reported 162 bound of 168 with 4 UNACCOUNTED. It was not caught
// by reading the map. It was caught because the partition is derived from this map's own
// targets and compared against the field list, which is the check [R-07] exists for.
//
// The override names the PRINTED ROW each cell sits in, which is neutral about what the cell
// means; the caption over both of them is the single word "Date" and it is carried in
// subject_classes like every other binding. Injectivity is then ASSERTED rather than assumed,
// because an override table is exactly the kind of thing that goes stale when a form is
// re-enumerated.
const KEY_OVERRIDE = {
  Date1: '433d_signature_row_date_left',
  Date2: '433d_signature_row_date_right',
};
const KEY = (stem) => KEY_OVERRIDE[stem] || `433d_${snake(stem)}`;
const byStem = new Map(classes.stems.map((s) => [s.stem, s]));
const pairOf = new Map(mirror.pairs.map((p) => [p.stem, p]));
const stops = [];

// ── the exclusive sets, derived ────────────────────────────────────────────────────────────
const cbStems = new Set(mirror.pairs.filter((p) => p.type === 'PDFCheckBox').map((p) => p.stem));
const stemOf = (name) => name.replace(/\[\d+\]$/, '').split('.').pop();
const cbSeries = page.series
  .map((s) => s.members.map(stemOf))
  .filter((m) => m.every((x) => cbStems.has(x)))
  .map((m) => m.slice().sort((a, b) => (pairOf.get(a) ? 0 : 1) - (pairOf.get(b) ? 0 : 1) || a.localeCompare(b)));
const inASet = new Set(cbSeries.flat());
const loneTicks = [...cbStems].filter((s) => !inASet.has(s)).sort();

const SET_GROUND = {
  RSI: 'The three captions of this drawn column are three VALUES OF ONE NAMED INDICATOR — "RSI “1” no further review", "RSI “5” PPIA IMF 2 year review", "RSI “6” PPIA BMF 2 year review". One indicator cannot hold two values, and that is readable from the captions themselves. The heading printed over the block is "Check the appropriate boxes:", PLURAL, which is what licenses one tick in this column AND one in the AI column and is quoted here because it does NOT by itself say one per column.',
  AI: 'The same ground as the RSI column: "AI “0” Not a PPIA", "AI “1” Field Asset PPIA", "AI “2” All other PPIAs" are three values of one named indicator, and the block heading "Check the appropriate boxes:" is plural.',
  LIEN: 'PRINTED VERBATIM, and it is the only one of the three sets whose exclusivity the page states in as many words: "A NOTICE OF FEDERAL TAX LIEN" over "(Check one box below)", above the four options HAS ALREADY BEEN FILED / WILL BE FILED IMMEDIATELY / WILL BE FILED WHEN TAX IS ASSESSED / MAY BE FILED IF THIS AGREEMENT DEFAULTS.',
};
const groundFor = (members) => members[0].startsWith('RSI') ? SET_GROUND.RSI : members[0].startsWith('AI') ? SET_GROUND.AI : SET_GROUND.LIEN;
const setName = (members) => members[0].startsWith('RSI') ? '433d_review_status_indicator' : members[0].startsWith('AI') ? '433d_agreement_indicator' : '433d_lien_determination';

// ── build ──────────────────────────────────────────────────────────────────────────────────
const map = {}, checkboxes = { _binds_why: '' }, exclusive = {}, subject_classes = {};
const optionOf = (stem) => stem.replace(/^(RSI|AI)/, '').toLowerCase() || stem.toLowerCase();

for (const p of mirror.pairs) {
  const cls = byStem.get(p.stem);
  if (!cls) { stops.push(`${p.stem}: the mirror declares this pair and the class table carries no class for it.`); continue; }
  const targets = [p.page1, p.page3];
  const entry = { class: cls.class, caption: cls.decided_by, pairing: cls.pairing };
  if (cls.class === 'dependent') {
    entry.route = { individual: '433d_tin_ssn_itin', entity: '433d_tin_ein', discriminator: '433d_subject' };
    entry._why = 'ONE PRINTED BOX, TWO KINDS OF VALUE. The caption over it offers a Social Security or ITIN number OR an Employer Identification Number, and which one a filed 433-D carries is the whole of what makes its subject an individual or an entity. One property would have to hold two facts about two legal persons for one filer at one moment.';
  } else if (cls.class === 'conditional') {
    entry.empty_unless = cls.side;
    entry._why = `THE PAGE SAYS THIS CELL EXISTS FOR THE ${cls.side.toUpperCase()} SUBJECT ONLY, at ${JSON.stringify(cls.decided_by)}. It gets an emptiness assertion and no second property: it is one fact that is sometimes absent, not two facts. On a record declaring the other subject a value here is a STOP.`;
  }
  subject_classes[p.stem] = entry;

  if (p.type === 'PDFTextField') { map[KEY(p.stem)] = targets; continue; }
  if (loneTicks.includes(p.stem)) checkboxes[KEY(p.stem)] = targets;
}

for (const members of cbSeries) {
  const name = setName(members);
  const opts = { _ground: groundFor(members) };
  for (const m of members) opts[optionOf(m)] = [pairOf.get(m).page1, pairOf.get(m).page3];
  checkboxes[name] = opts;
  exclusive[`${name}__irs_copy`] = members.map((m) => pairOf.get(m).page1);
  exclusive[`${name}__taxpayer_copy`] = members.map((m) => pairOf.get(m).page3);
}
checkboxes._binds_why = `THREE OPTION SETS AND ${loneTicks.length} LONE TICKS, and which is which is DERIVED. An option set is a printed series every member of which is a checkbox — the same geometric series derivation the class table uses, which knows nothing about widget types. The lone ticks are the checkboxes in no such series: ${loneTicks.join(', ')}. Each option key is the printed value of the indicator, never a widget name.`;

const never = fields.fields.map((f) => f.name).filter((n) => n.includes('hyperlink'));
const bound = new Set([...Object.values(map).flat(), ...Object.values(checkboxes).filter((v) => Array.isArray(v)).flat(),
  ...cbSeries.flatMap((m) => m.flatMap((x) => [pairOf.get(x).page1, pairOf.get(x).page3]))]);

const doc = {
  form: '433d',
  form_revision: '7-2024',
  catalog: '16644M',
  hs_name_rule: "HubSpot property = 'irs' + <key> (e.g. 433d_routing_number1 -> irs433d_routing_number1). NOT SETTLED HERE: 433-D's crosswalk classification decides which keys bind an EXISTING property and which create one, and no property is created until its name is derived, asserted and dry-run ([R-23]).",
  pdf: 'adapters/pdf/forms/f433d.pdf',
  fields_source: 'adapters/pdf/maps/433d.fields.json',
  slice: 'COMPLETE - every field on 433-D is mapped or explicitly excluded',
  _generator: 'scratchpad/p54-433d-author-map.mjs',
  _authored_from: {
    targets: 'adapters/pdf/maps/433d.mirror.json — every target pair, from the widget geometry of the pinned blank. NO TARGET IS TYPED IN THIS MAP.',
    classes: 'adapters/pdf/maps/433d.subject-classes.json — every class, side and printed caption, re-derived byte for byte on every `npm run sweeps:deep`.',
    exclusive_sets: 'the printed series derivation in adapters/pdf/caption-candidates.mjs, filtered to series whose members are all checkboxes.',
  },
  _key_overrides: KEY_OVERRIDE,
  _key_overrides_why: 'THE SNAKE-CASE KEY IS NOT INJECTIVE ON THIS FORM. 433-D draws `Date1` in the signature row and `date1` in the increase table, and the same for 2 -- four stems, two keys, once lowercased. The first draft of the generator bound 68 text stems instead of 70 and the DERIVED PARTITION is what reported it: 162 bound of 168 with 4 unaccounted. The override names the printed ROW rather than a meaning, and injectivity is asserted over every stem on every run, in both directions -- a collision is a STOP and so is an override naming a stem the mirror does not declare.',
  _the_input_key_is_an_identifier: "It is `433d_` plus the leaf stem in snake case and it CARRIES NO CLAIM ABOUT THE CELL. [R-08]: a leaf name is evidence of nothing. What identifies the cell is the target pair, from the geometry; what says what the cell is, is the `caption` carried beside every binding in `subject_classes`, read off the printed page. 433-D's stems are unusually descriptive and that is a reason for this sentence rather than a reason to relax — 433-A's leaf names are swapped against its printed columns.",
  _the_mirror: {
    declaration: 'adapters/pdf/maps/433d.mirror.json',
    _why_every_binding_is_a_pair: 'THIS FORM DRAWS EVERY CELL TWICE — page 1 is "Part 1 — IRS Copy" and page 3 is "Part 2 — Taxpayer’s Copy" — and both copies of one fact must carry one value. Every binding below names BOTH targets. A stem bound to one copy only is a STOP at [M-07], and a filled document whose two copies disagree is a STOP at [M-08], read from the filled bytes rather than from the fill engine’s report.',
    _why_this_is_not_a_duplicate_write: 'The duplicate-write guard is keyed on the TARGET: it refuses a target written by more than one key. Each key here writes two DIFFERENT targets, so the guard stays fully on for this form and needs no exemption. The mirror is a declaration that owes MORE than the guard did, not less: [M-07] refuses a stem bound to one copy only, in both directions, and [M-08] refuses a filled document whose two copies disagree, read from the saved bytes rather than from the fill engine’s own report.',
  },
  map,
  checkboxes,
  exclusive,
  _exclusive_why: 'SIX SETS FOR THREE PRINTED COLUMNS: one per column per COPY. Both copies of a mirrored cell receive the same value, so a set spanning both pages would hold two checked boxes on every correctly filled form and fail by construction. A set is a claim about one printed column on one printed page and this form draws each column twice.',
  subject_classes,
  _subject_classes_why: 'THE THREE-CLASS DISCRIMINATOR, and each class owes the map a different thing — asserted at [SC-6] in adapters/pdf/assert-subject-class.mjs. DEPENDENT declares a route with two input keys and a discriminator. CONDITIONAL declares `empty_unless` and may NOT declare a route: a cell that exists for one subject only has no second subject to route to, and the second property could only ever be empty. INDEPENDENT declares neither: an emptiness assertion over an independent cell would fire on a correctly filled form.',
  allowed: {
    _why: '433-D prints no IRS-allowable expense column and no collection financial standards. The block exists solely to carry the never-autofill list, which is the convention 433-A(OIC) established for a form with no `allowed` column.',
    _never_autofill: never,
    _never_autofill_why: 'THE TWO PDFButtons ON PAGE 4, and neither is a cell a filer fills: they are hyperlinks inside the INSTRUCTIONS TO TAXPAYER prose. They are also the reason the mirror declares an exclusion by name — this stem appears exactly twice, so a completeness check phrased as "every stem appears twice" would have counted them as the 84th mirrored fact and been satisfied by a pair of buttons.',
  },
  _deferred: {
    _why: 'EMPTY, AND SAID SO RATHER THAN OMITTED. A deferred target is one the map has bound to nothing because the reading is unresolved; 433-D has none, because the mirror accounts for all 166 data cells and the two page-4 buttons are understood and deliberately blank, which is the stronger claim and belongs under `_never_autofill`.',
  },
  _partition: {
    _why: 'Declared as the map is authored, mandatory in validate-map.mjs, and every figure derived by this generator from the field list, the mirror and this map’s own targets rather than counted by hand.',
    form_fields_total: fields.fields.length,
    in_this_slice: fields.fields.length,
    bound_writable: bound.size,
    excluded_never_autofill: never.length,
    deferred: 0,
    unaccounted: fields.fields.length - bound.size - never.length,
    _check: `${bound.size} + ${never.length} + 0 = ${bound.size + never.length}, against ${fields.fields.length} enumerated fields. ${fields.fields.length} - ${bound.size + never.length} = ${fields.fields.length - bound.size - never.length} unaccounted. The 166 bound targets are 83 mirrored pairs; page-geometry.mjs reports 83 widgets on page 1, 0 on page 2, 83 on page 3 and 2 on page 4.`,
    _unaccounted_by_page: '0 unaccounted. ZERO UNACCOUNTED, AND THE BREAKDOWN IS STATED RATHER THAN LEFT EMPTY. Page 1: 83 bound. PAGE 2 CARRIES NO WIDGETS AT ALL — that is derived from the geometry reader returning every widget on every page and page 2 contributing none, not inferred from a low count. Page 3: 83 bound. Page 4: 2, both excluded by name above.',
  },
  _carried: {
    _why: 'The questions this map raised and no slice has answered. An arguable item is reported in full, carries an id and is not resolved ([R-20]).',
    open: [
      { id: 'DM-1',
        subject: 'THE RECORD DECLARES ITS OWN SUBJECT AND NOTHING ON THE FILED PAGE CONFIRMS IT. `433d_subject` is what routes the identifier cell and what every emptiness assertion is asked against, and it is supplied by the record rather than read from the document.',
        why_it_is_not_a_defect_today: 'The engine has no other source for it. The subject register records that 433-D is the first form whose subject is NOT a property of the form: "One filed 433-D is about a natural person; the next is about a corporation; the form is the same form and nothing printed on it distinguishes them except which identifier the filer wrote." The discriminator therefore cannot be derived from the blank, and a record that declares nothing is refused rather than defaulted.',
        what_would_settle_it: 'A cross-check against the identifier the record supplies: an SSN or ITIN is nine digits in one printed shape and an EIN in another, so a record declaring `entity` and supplying an SSN-shaped identifier is contradicting itself. That is a second witness the engine could hold and does not, and it is not built here because inventing a format predicate for a taxpayer identification number in the commit that lands the map is exactly the adjacent change that has twice reproduced the defect class it was meant to close.',
        status: 'OPEN' },
      { id: 'DM-2',
        subject: 'NO SINGLE RECORD CAN SATURATE THIS FORM, and that is a property of the form rather than of the fixture. Five cells are subject-CONDITIONAL — three exist only for an individual, two only for an entity — so on any record at least two mapped text cells are REQUIRED to be empty.',
        why_it_matters: 'Gate step 10 in saturated mode fails on any mapped text cell an acceptance record left empty, and that rule is right: a count quietly coming in low is indistinguishable from the map being wrong. On this form the rule and the page disagree, and the disagreement is real rather than a gap in the fixture.',
        what_stands_in_the_meantime: 'The exemption is DERIVED from this map’s own `empty_unless` declarations against the record’s declared subject, reported BY NAME on every run, and it is two-directional: a cell required to be empty that carries a value FAILS at the same step. So the saturation rule is not weakened for this form, it is stated for a form whose cells are not all reachable at once.',
        status: 'OPEN' },
    ],
    resolved: [],
    _count: { open: 2, resolved: 0 },
  },
};

// INJECTIVITY, ASSERTED. Two stems sharing a key means the second binding silently replaces
// the first and two real cells go unbound; the partition catches it downstream, and this
// catches it at the cause with both stems named.
{
  const seen = new Map();
  for (const p of mirror.pairs) {
    const k = KEY(p.stem);
    if (seen.has(k)) stops.push(`KEY COLLISION — the stems ${JSON.stringify(seen.get(k))} and ${JSON.stringify(p.stem)} both yield the input key ${JSON.stringify(k)}. One binding would silently overwrite the other and two drawn cells would go unbound.`);
    seen.set(k, p.stem);
  }
  for (const stem of Object.keys(KEY_OVERRIDE))
    if (!pairOf.has(stem)) stops.push(`STALE OVERRIDE — KEY_OVERRIDE names ${JSON.stringify(stem)} and the mirror declares no such stem. An override standing over nothing is an override nobody re-derives.`);
}
if (stops.length) { console.error(`STOP — ${stops.length} problem(s):`); stops.forEach((s) => console.error(`  ${s}`)); process.exit(2); }

const totals = {
  form: '433d',
  form_revision: '7-2024',
  catalog: '16644M',
  _why: 'A TOTALS FILE DECLARING NO TOTALS, WHICH HAS TO BE SAID OUT LOUD. run-form-gate.mjs step 11 FAILS a map that declares itself COMPLETE and carries no totals file — it promised the whole form and cannot prove its own arithmetic — and SKIPS a partial slice that carries none. 433-D declares COMPLETE and prints no total anywhere, so the honest artefact is this one: the declaration that the absence was read rather than the absence of a declaration, which reads identically from outside and proves nothing.',
  authored_from: 'the printed page text of all four pages of adapters/pdf/forms/f433d.pdf, extracted from the content streams. THE ABSENCE IS DERIVED AND RE-DERIVED: adapters/pdf/count-sweep.mjs compares the claimed zero below against the drawn page on every run.',
  _what_this_form_is: '433-D is an AGREEMENT, not a collection information statement. It collects identity, the kinds of taxes and periods, one amount owed, a payment schedule, bank routing and account digits, signatures and an IRS-use block. Nothing on it is computed from anything else on it, which is why there is no arithmetic to trip a wire.',
  totals: [],
  _none_printed: {
    claimed_add_lines_runs: 0,
    claimed_total_runs: 0,
    claimed_minus_runs: 0,
    _how: 'Every drawn run of all four pages joined and searched for /Add lines?/, /\\bTotals?\\b/ and /minus/, case-insensitively. All three return zero. Page 2 draws no runs at all and returns zero for the trivial reason, which is stated rather than counted as evidence.',
  },
  not_checkable: { entries: [] },
};

const headings = {
  form: '433d',
  form_revision: '7-2024',
  catalog: '16644M',
  _what: 'The printed heading each mapped GROUP’s rows must sit beneath. Read by adapters/pdf/verify-headings.mjs.',
  _why_it_is_empty_and_that_is_a_declaration: '433-D DECLARES NO REPEATABLE GROUP, so there is no group row for a heading to stand over. That is not the absence of a reading: the form draws no table with more than one row anywhere on either copy. Its two increase/decrease rows are the closest thing and they are bound as SCALARS — date1/amount1/payment1 and date2/amount2/payment2 — because the page prints exactly two and prints them as two captioned rows rather than as a table with a repeating unit, so a group of maximum two would be a construct this page does not draw. The file exists so that step 9 runs and reports zero rather than failing for want of a heading declaration, and so that a later slice adding a group finds the mechanism here.',
  headings: [],
  groups: {},
};

const write = (path, obj) => {
  const text = JSON.stringify(obj, null, 1) + '\n';
  if (check) {
    if (!existsSync(path)) { console.error(`STOP — ${path} does not exist.`); process.exit(2); }
    if (readFileSync(path, 'utf8') !== text) { console.error(`STOP — ${path} does not match what re-derivation produces.`); process.exit(2); }
    console.log(`OK — ${path} re-derives`);
  } else { writeFileSync(path, text); console.log(`wrote ${path}`); }
};

write('adapters/pdf/maps/433d.map.json', doc);
write('adapters/pdf/maps/433d.totals.json', totals);
write('adapters/pdf/maps/433d.headings.json', headings);

console.log('');
console.log(`433-D MAP — ${Object.keys(map).length} text stem(s) + ${Object.keys(checkboxes).filter((k) => !k.startsWith('_')).length} checkbox construct(s), each bound to BOTH copies`);
console.log(`  exclusive sets   ${Object.keys(exclusive).length} (${cbSeries.length} printed column(s) x 2 copies)`);
console.log(`  lone ticks       ${loneTicks.length}: ${loneTicks.join(', ')}`);
console.log(`  classes          ${Object.values(subject_classes).filter((x) => x.class === 'dependent').length} dependent, ${Object.values(subject_classes).filter((x) => x.class === 'conditional').length} conditional, ${Object.values(subject_classes).filter((x) => x.class === 'independent').length} independent`);
console.log(`  partition        ${doc._partition.bound_writable} bound + ${doc._partition.excluded_never_autofill} never-autofill + 0 deferred = ${doc._partition.bound_writable + doc._partition.excluded_never_autofill} of ${doc._partition.form_fields_total}; unaccounted ${doc._partition.unaccounted}`);
