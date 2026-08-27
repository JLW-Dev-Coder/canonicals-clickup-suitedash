// AUTHORS adapters/hubspot/crosswalk.433d.json — one row per engine input key of 433-D.
//
//   node scratchpad/p57-433d-crosswalk-author.mjs
//   node scratchpad/p57-433d-crosswalk-author.mjs --check    # re-derive and compare bytes
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT A CROSSWALK ROW CARRIES, AND WHAT IT DELIBERATELY DOES NOT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A row carries the FACT and the SHAPE. It does not carry a NAME.
// adapters/hubspot/derive-names-433d.mjs turns (category, scope, fact) into an hs_name and is
// the only place in this repo where a 433-D property name exists. A category and a name cannot
// disagree here, because only one of them is written down.
//
// THE KEY SPACE IS READ, NOT TYPED. Every key comes from keySpaceOf() — the same selector
// validate-crosswalk.mjs, the coverage counter and adapters/hubspot/assert-key-space.mjs use —
// with the subject ROUTE applied by the SELECTOR rather than by either author: `433d_taxpayer` is
// replaced by the two branch keys and the discriminator, because that cell does not reach one
// property, it reaches one of two on a declaration the record makes.
//
// THE FACTS ARE READ OUT OF THE CLASSIFICATION, NOT RE-DECIDED HERE. Every entry in
// 433d.crosswalk-classification.json already names a fact per key, ruled with its reason. This
// file adds the TYPE and nothing else, and a key whose fact this file cannot find in the
// classification is a STOP — the two files cannot drift into naming different facts, because
// only one of them names any.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE TYPES, AND THE TWO DECISIONS THAT ARE NOT OBVIOUS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// THE COMBS ARE `string/text`, NOT `number/number`. Twenty-six cells hold one character each of
// a routing or account number. They are identifiers and not quantities: a leading zero is
// meaningful, no total is computed from them, and [R-09]'s money-by-declaration half is the
// same argument from the other side — a blanket numeric rule corrupts a value silently and
// nothing downstream disagrees. 433-D declares no rounding block at all.
//
// `433d_on_the` IS `string/text` AND NOT A NUMBER. The printed sentence is "and $ ___ on the
// ___", and a filer writes "15th" or "1st" as often as "15". Typing it as a number would refuse
// what the page invites, and the engine writes what the record holds.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { keySpaceOf, ENGINE_EXTRA_INPUTS } from '../adapters/hubspot/classification-coverage.mjs';

const SELF = 'scratchpad/p57-433d-crosswalk-author.mjs';
const OUT = 'adapters/hubspot/crosswalk.433d.json';
const check = process.argv.includes('--check');

const R = (p) => JSON.parse(readFileSync(p, 'utf8'));
const MAP = R('adapters/pdf/maps/433d.map.json');
const CLS = R('adapters/pdf/maps/433d.crosswalk-classification.json');

const stops = [];
const STOP = (m) => stops.push(m);

// ── the key space, with the route applied, exactly as the classification applies it ────────
const { keySpace: ks, problems: ksProblems, routes } = keySpaceOf(MAP);
for (const p of ksProblems) STOP(`the key space could not be derived: ${p}`);
for (const k of (ENGINE_EXTRA_INPUTS['433d'] || [])) ks.set(k, 'engine');
// THE ROUTE IS THE SELECTOR’S. keySpaceOf() substitutes it, so this file reads ROUTE only to
// key its own shape table. Asserted and not assumed: a selector that stopped applying it would
// leave the printed key in the space and this file would bind a key the engine never reads.
const ROUTE = MAP.subject_classes?.Taxpayer?.route;
if (!ROUTE?.individual || !ROUTE?.entity || !ROUTE?.discriminator) STOP('the map declares no usable subject route on Taxpayer.');
else if (!routes.some((r) => r.replaced === '433d_taxpayer' && r.individual === ROUTE.individual && r.entity === ROUTE.entity && r.discriminator === ROUTE.discriminator))
  STOP('keySpaceOf() did not apply the Taxpayer route; the key space still describes one printed box rather than the three keys the engine reads.');
const keySpace = new Set(ks.keys());

// ── the fact and the entry of each key, read out of the classification ─────────────────────
const entryOfKey = new Map(), factOfKey = new Map();
for (const e of CLS.entries) for (const k of e.keys) {
  if (entryOfKey.has(k)) STOP(`key "${k}" is claimed by ${entryOfKey.get(k)} and again by ${e.id}.`);
  entryOfKey.set(k, e.id);
  const f = e.facts ? e.facts[k] : e.fact;
  if (!f) STOP(`${e.id} names key "${k}" and declares no fact for it.`);
  else factOfKey.set(k, f);
}
const entryById = new Map(CLS.entries.map((e) => [e.id, e]));

// ── the shapes ─────────────────────────────────────────────────────────────────────────────
const IDENT = 'identifier or short text';
const COMB = 'ONE PRINTED CHARACTER CELL of a comb. An identifier fragment, never a quantity: a leading zero is meaningful and no total is computed from it.';
const DATE = 'date cell, stored as printed text';
const LONG = 'multi-line printed cell, stored as text';
const MONEY = 'money cell — and 433-D declares NO rounding block, so it is written and compared TO THE CENT.';
const TICK = 'lone printed tick, drawn once on each of the two copies';
const NAMED = (n) => `named-option checkbox set (${n} options)`;
const OPERATOR = 'OPERATOR INPUT. It names no printed cell; the engine reads it to route the identifier and to decide which conditional cells it must assert empty. A record declaring nothing is REFUSED, never defaulted.';

const t = (basis = IDENT, pii = false) => ({ type: 'string', fieldType: 'text', type_basis: basis, pii });
const g = (pii = false) => ({ type: 'string', fieldType: 'textarea', type_basis: LONG, pii });
const d = () => ({ type: 'string', fieldType: 'text', type_basis: DATE, pii: false });
const m = () => ({ type: 'number', fieldType: 'number', type_basis: MONEY, pii: false });
const tick = () => ({
  type: 'enumeration', fieldType: 'booleancheckbox', type_basis: TICK, pii: false,
  options: [{ label: 'Yes', value: 'true', displayOrder: 0 }, { label: 'No', value: 'false', displayOrder: 1 }],
});
// A NAMED-OPTION SET TAKES ITS VALUES FROM THE MAP, never from this file. Retyping the printed
// words here would be a second spelling of the same list, which assert-intake-keys.mjs refuses.
const slug = (o) => o.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const named = (key) => {
  const src = MAP.checkboxes[key];
  if (!src || typeof src !== 'object' || Array.isArray(src)) { STOP(`checkboxes["${key}"] is not an option set; a named-option row cannot be built from it.`); return t(); }
  const opts = Object.keys(src).filter((k) => !k.startsWith('_'));
  if (!opts.length) { STOP(`checkboxes["${key}"] declares no options.`); return t(); }
  return {
    type: 'enumeration', fieldType: 'select', type_basis: NAMED(opts.length), pii: false,
    options: opts.map((o, i) => ({ label: o, value: slug(o), displayOrder: i })),
    map_option_by_value: Object.fromEntries(opts.map((o) => [slug(o), o])),
  };
};

const range = (base, n, from = 1) => Array.from({ length: n }, (_, i) => `${base}${i + from}`);

// ── the shape of every key ─────────────────────────────────────────────────────────────────
const S = {
  // the route
  [ROUTE.individual]: t('identifier — a Social Security or Individual Taxpayer Identification Number', true),
  [ROUTE.entity]: t('identifier — an Employer Identification Number'),
  [ROUTE.discriminator]: {
    type: 'enumeration', fieldType: 'select', type_basis: OPERATOR, pii: false,
    options: [{ label: 'individual', value: 'individual', displayOrder: 0 }, { label: 'entity', value: 'entity', displayOrder: 1 }],
  },
  // identity
  '433d_name_and_address': g(true),
  '433d_spouse': t('identifier — a Social Security or Individual Taxpayer Identification Number', true),
  '433d_home': t('telephone number as printed', true),
  '433d_work_cell_business': t('telephone number as printed', true),
  '433d_or_write': g(),
  // the liability
  '433d_kinds_of_taxes': t(), '433d_tax_periods': t(), '433d_as_of': d(), '433d_amount_owed': m(),
  // the terms
  '433d_dollar_amount': m(), '433d_date_paid': d(), '433d_and_dollar_amount': m(),
  '433d_on_the': t('the day of the month an instalment falls due, AS PRINTED — the page invites "15th" as readily as "15", so it is text and not a number'),
  // the two scheduled increases
  ...Object.fromEntries([1, 2].flatMap((i) => [[`433d_date${i}`, d()], [`433d_amount${i}`, m()], [`433d_payment${i}`, m()]])),
  // assent and rider
  '433d_initial': t('the filer’s initials, as written on the page'),
  '433d_additional_conditions': g(),
  // the combs
  ...Object.fromEntries(range('433d_routing_number', 9).map((k) => [k, t(COMB, true)])),
  ...Object.fromEntries(range('433d_account_number', 17).map((k) => [k, t(COMB, true)])),
  // signatures
  '433d_your_signature': t('the typed name standing for a signature', true),
  '433d_signature_row_date_left': d(), '433d_signature_row_date_right': d(),
  '433d_title_if': t(), '433d_spouse_signature': t('the typed name standing for a signature', true),
  // FOR IRS USE ONLY
  ...Object.fromEntries(range('433d_agreement_locator_number', 4).map((k) => [k, t(COMB)])),
  ...Object.fromEntries(range('433d_agreement_review_cycle', 6).map((k) => [k, t(COMB)])),
  '433d_earliest_csed': d(),
  '433d_originator_id': t(), '433d_originator_code': t(),
  '433d_name': t(), '433d_title': t(), '433d_agreement_examined': t(), '433d_date3': d(),
  // the lone ticks and the three option sets
  '433d_submit_a_new': tick(), '433d_unable_to_make': tick(), '433d_check_box_if': tick(),
  '433d_review_status_indicator': named('433d_review_status_indicator'),
  '433d_agreement_indicator': named('433d_agreement_indicator'),
  '433d_lien_determination': named('433d_lien_determination'),
};

// ── the rows ───────────────────────────────────────────────────────────────────────────────
const bindings = [];
for (const k of [...keySpace].sort()) {
  const shape = S[k];
  if (!shape) { STOP(`engine input "${k}" has no declared shape in this file. A row with no type is a property nobody can create.`); continue; }
  const id = entryOfKey.get(k);
  const e = entryById.get(id);
  if (!e) { STOP(`engine input "${k}" is covered by no classification entry.`); continue; }
  const row = { key: k, entry: id, fact: factOfKey.get(k), ...shape, backbone_key: null };
  if (e.scope === 'reuse') {
    if (!e.reuse_of) { STOP(`${id} is scope reuse and names no reuse_of.`); continue; }
    row.reuse_of = e.reuse_of;
    row.reuse_reason = e.scope_reason;
  } else {
    row.scope = e.scope;
    row.scope_reason = e.scope_reason;
  }
  bindings.push(row);
}
for (const k of entryOfKey.keys()) if (!keySpace.has(k)) STOP(`the classification covers "${k}", which is not an engine input on this form.`);
for (const k of Object.keys(S)) if (!keySpace.has(k)) STOP(`this file declares a shape for "${k}", which is not an engine input on this form.`);

if (stops.length) {
  console.error(`STOP — ${stops.length} problem(s) authoring ${OUT}:`);
  stops.forEach((s) => console.error('  ' + s));
  process.exit(2);
}

const byShape = {};
for (const b of bindings) byShape[`${b.type}/${b.fieldType}`] = (byShape[`${b.type}/${b.fieldType}`] || 0) + 1;

const doc = {
  meta: {
    form: '433d',
    _generated_by: SELF,
    form_revision: MAP.form_revision,
    catalog: MAP.catalog,
    covers_slices: MAP.slice,
    classification: 'adapters/pdf/maps/433d.crosswalk-classification.json',
    _what_a_row_carries: 'THE FACT AND THE SHAPE, NEVER A NAME. adapters/hubspot/derive-names-433d.mjs is the only place a 433-D property name exists; it derives one from the entry’s category and this row’s fact, so a category and a name cannot disagree because only one of them is written down.',
    _the_key_space: 'READ FROM adapters/hubspot/classification-coverage.mjs keySpaceOf(), with the subject ROUTE applied: `433d_taxpayer` is replaced by the two branch keys and the discriminator, because that printed cell does not reach one property — it reaches one of two, on a declaration the record makes. The discriminator names no printed cell and is an ENGINE_EXTRA_INPUTS-shaped operator input.',
    _the_combs: 'TWENTY-SIX ROWS ARE ONE PRINTED CHARACTER EACH — nine routing digits and seventeen account characters. They are typed `string/text` and not `number/number`: a leading zero is meaningful in a routing number, no total is computed from any of them, and a blanket numeric rule would corrupt the value silently with nothing downstream disagreeing. That is [R-09]’s money-by-declaration half read from the other side, and 433-D declares no rounding block at all.',
    _pii: 'PII IS DECLARED PER ROW. The identifier on either branch, the spouse’s identifier, both telephone cells, the name-and-address block, both signature cells and every one of the twenty-six comb cells carry taxpayer identifying data. The FOR IRS USE ONLY combs do NOT: an agreement locator number and a review cycle are the Service’s own reference numbers.',
  },
  bindings,
  not_provisioned: [],
  arguable: [],
  _count: {
    bindings: bindings.length,
    key_universe: keySpace.size,
    by_shape: byShape,
    _derived_by: SELF,
    _why: 'DERIVED ON EVERY RUN FROM THE ROWS THEMSELVES, never typed ([R-07]). `key_universe` is keySpaceOf()’s size with the route applied, and `bindings` must equal it — a crosswalk that binds fewer keys than the engine reads is a property nobody provisions.',
  },
};

if (bindings.length !== keySpace.size) { console.error(`STOP — ${bindings.length} row(s) against a key space of ${keySpace.size}.`); process.exit(2); }

const text = JSON.stringify(doc, null, 1) + '\n';
if (check) {
  if (!existsSync(OUT)) { console.error(`STOP — ${OUT} is absent; nothing to check against.`); process.exit(2); }
  const have = readFileSync(OUT, 'utf8');
  if (have !== text) { console.error(`STOP — ${OUT} does not match what re-derivation produces.`); process.exit(2); }
  console.log(`OK — ${OUT} regenerates byte-identical from ${SELF} (${bindings.length} rows).`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT}`);
  console.log(`  ${bindings.length} row(s) over a key space of ${keySpace.size} — counted BY KEY`);
  console.log(`  by shape: ${Object.entries(byShape).map(([s, n]) => `${n} ${s}`).join(', ')}`);
  console.log(`  reuse rows: ${bindings.filter((b) => b.reuse_of).length}; PII rows: ${bindings.filter((b) => b.pii).length}`);
}
