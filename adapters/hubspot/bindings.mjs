// One normalized binding list per form, whatever artifact the form's names came from.
//
//   import { loadBindings } from './bindings.mjs';
//   loadBindings('433a')  ->  from fields.433a.json   (names GENERATED from the map)
//   loadBindings('433f')  ->  from crosswalk.433f.json (names CROSSWALKED to the backbone)
//
// WHY THE TWO SOURCES CANNOT JUST BE ONE FILE
// -------------------------------------------
// 433-A was first, so every fact it held became a new name and a mechanical transform of its
// map produced all 186. Every form after it mostly reuses names that already exist, and the
// reused ones cannot be told from the new ones by any string rule — 433f_county and
// irs433_county_of_residence are one fact sharing no substring. So form one is generated and
// forms two onward are crosswalked, and that difference is permanent.
//
// What must NOT differ is the shape the fetch layer and the seeder read, because those two
// are written against each other and a round trip only proves something if both sides speak
// the same vocabulary. That is this file: it flattens both artifacts to the same rows.
//
// THE `kind` FIELD IS THE WHOLE POINT. All three of the defects that cost 433-F its round trip
// were a value arriving in the right place in the WRONG SHAPE, and each one was silent:
//
//   group   HubSpot holds a repeatable table as ONE textarea of JSON. The fill engine tests
//           Array.isArray and prints ZERO rows otherwise — no error, valid PDF, exit 0.
//   option  HubSpot's booleancheckbox stores the literal "true"/"false"; the fill engine
//           resolves against the map's option keys ("yes"/"no") and matches neither.
//   scalar  everything else, which is the only case that is safe to pass through untouched.
//
// Deciding `kind` here, once, from what the artifact recorded, is what keeps the fetch layer
// and the seeder from each re-deriving it and drifting apart.

import { readFileSync } from 'fs';
import { ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE WRITER-RESOLVER BOUNDARY — ONE CONSTRUCT VOCABULARY, DECLARED AND ASSERTED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The WRITER of `source` is a generator: gen-fields-from-map.mjs, derive-names-433aoi.mjs,
// derive-names-433boi.mjs. The RESOLVER is this file, which decided `kind` by comparing that
// string to literals — `p.source === 'groups'`, `=== 'checkboxes'`, `=== 'check_here'` — and
// worked ONLY BECAUSE THE SPELLINGS HAPPEN TO MATCH. Nothing asserted they did. That is a
// writer-resolver coincidence, the class Prompt 43 ruling 2 covers, and its failure is silent
// in the worst way: a construct name this file does not recognise falls through to `scalar`,
// the fetch layer passes the stored value through untranslated, and an untranslated "true" or
// "grid" happens to work today because the option values and the record states are spelled
// identically. It would stop working the moment either moved, with no error and a valid PDF.
//
// So the vocabulary is DECLARED here, both readers use it, and
// adapters/hubspot/assert-intake-keys.mjs asserts at the boundary — on EVERY form, including
// the ones where it is inert — that every construct a generator actually wrote is a construct
// this table names. An unknown construct is a STOP, not a scalar.
//
// THE LEADING WORD IS THE CONSTRUCT. 433-A's generator writes prose into `source`
// ("groups (5 printed slots x 6 columns, serialized)", "split (2 printed boxes, 1 property)"),
// which is why `fromGeneratedFields` used `startsWith('groups')` and the other reader used
// equality — two normalisers for one field. `constructOf` is the one normaliser.
/** The construct a `source` value names, whatever prose the generator appended to it. */
export const constructOf = (source) => String(source ?? '').trim().split(' ')[0];

/**
 * EVERY MAP CONSTRUCT A GENERATOR MAY WRITE, AND THE SHAPE THE FETCH LAYER MUST GIVE IT.
 *
 *   group   a repeatable table, stored as ONE textarea of JSON. The fill engine tests
 *           Array.isArray and prints ZERO rows otherwise — no error, valid PDF, exit 0.
 *   option  a value that must be translated through `map_option_by_value` before the fill
 *           engine can resolve it against the map's own option keys.
 *   scalar  everything else, the only case safe to pass through untouched.
 *
 * `engine` — an input the engine reads that the map names no cell for — is `scalar` HERE and
 * is overridden to `option` by the row's own `map_option_by_value`, which is the discriminator
 * that does not depend on the construct name at all. Its one instance,
 * `business_income_expense_route`, is an ENUMERATION on both OIC forms.
 */
export const CONSTRUCT_KIND = {
  map: 'scalar',
  split: 'scalar',
  allowed: 'scalar',
  engine: 'scalar',
  groups: 'group',
  checkboxes: 'option',
  check_here: 'option',
  // THE TWO SUBJECT-ROUTE CONSTRUCTS. A subject-DEPENDENT cell does not reach one property; it
  // reaches one of two on a declaration the record makes, so keySpaceOf() removes its printed key
  // and puts three in its place. Both branch keys are ordinary text cells on the page and are
  // therefore `scalar`. The DISCRIMINATOR is scalar too, for the same reason `engine` is: the
  // engine reads it bare, the map names no cell for it, and its values are the record's declared
  // subject rather than option keys the map has to translate. A row that IS an enumeration still
  // comes out as `option`, because `kindOf` lets `map_option_by_value` override the construct
  // name — the discriminator carries `options` and no `map_option_by_value`, which is exactly
  // that distinction doing its work.
  route: 'scalar',
  'route-discriminator': 'scalar',
};

/**
 * The kind for one artefact row. THE ROW'S OWN DECLARATION WINS over the construct name:
 * anything carrying a `map_option_by_value` is an option, whatever produced it.
 * Returns null for a construct the vocabulary does not name — the caller decides, and every
 * caller in this repo treats null as a STOP rather than as a scalar.
 */
export const kindOf = (row) => {
  if (row.map_option_by_value) return 'option';
  const k = CONSTRUCT_KIND[constructOf(row.source)];
  return k === undefined ? null : k;
};

/**
 * WHAT HAPPENS AT THE BOUNDARY WHEN THE TWO SIDES DISAGREE. Not a fallback to `scalar` — that
 * is the silent path this whole block exists to close — and not a warning, because the caller
 * is about to hand the value to a fill engine that will accept it and print nothing.
 */
const unknownConstruct = (form, row) => {
  throw new Error(
    `BINDING KIND — fields.${form}.json declares key ${JSON.stringify(row.key)} with source ` +
    `${JSON.stringify(row.source)}, whose construct ${JSON.stringify(constructOf(row.source))} is not in ` +
    `bindings.mjs CONSTRUCT_KIND (${Object.keys(CONSTRUCT_KIND).join(', ')}).\n` +
    `  The generator that wrote this file and the resolver that reads it have parted on a spelling.\n` +
    `  Falling through to "scalar" would pass the stored value to the fill engine untranslated, which\n` +
    `  reaches the page as nothing on a valid PDF with exit 0. Declare the construct or fix the writer.`);
};

/**
 * WHICH ARTEFACT, AND THEREFORE WHETHER `source` IS READ AT ALL.
 *
 * Exported so adapters/hubspot/assert-intake-keys.mjs can scope the construct assertion to the
 * forms whose rows this file actually resolves through `source`, WITHOUT restating the
 * dispatch. A second copy of "which forms take the derived path" is a second answer to the
 * question loadBindings exists to answer once.
 */
// THE SOURCE IS READ FROM WHAT THE ARTEFACT CARRIES, not from a list of form names.
//
// It WAS a list of form names, and 433-B is what that cost. Its crosswalk carries no `hs_name`
// — the name is derived from the classification's category, the same shape 433-A(OIC) and
// 433-B(OIC) use — but the list did not name it, so it fell through to 'crosswalk' and
// loadBindings returned 116 rows whose hs_name was `undefined`. SILENTLY: undefined is a legal
// thing to put in a Set of property names to request, so the fetch would have asked the portal
// for one nameless property, found nothing, and reported an empty contact.
//
// A per-form list asserts only that no other form has worn this shape yet, which is [R-06]'s
// prefix defect in a new place. The shape is now DETECTED — a crosswalk whose rows carry
// `hs_name` is the authored shape, one whose rows do not is the derived shape — which is the
// same rule validate-crosswalk.mjs settled on for the same reason ([D-16]).
export const bindingSourceOf = (form) => {
  if (form === '433a') return 'generated';
  let xw;
  try { xw = JSON.parse(readFileSync(`adapters/hubspot/crosswalk.${form}.json`, 'utf8')); }
  catch { return 'derived'; }        // no crosswalk at all -> the fields file is the only source
  const rows = xw.bindings || [];
  if (!rows.length) return 'crosswalk';
  const named = rows.filter((r) => r.hs_name !== undefined).length;
  // A PARTIAL NAME COLUMN IS A STOP, for the same reason validate-crosswalk makes it one: it is
  // the single state under which a name-based check runs on a subset and reports a pass.
  if (named && named !== rows.length)
    throw new Error(`STOP — crosswalk.${form}.json carries hs_name on ${named} of ${rows.length} rows. `
      + 'A partial name column cannot be read as either shape, and guessing would make every name-based check ask about a subset.');
  return named === rows.length ? 'crosswalk' : 'derived';
};

/** True where `kind` is decided from the generator's `source` string. */
export const readsSourceConstruct = (form) => bindingSourceOf(form) !== 'crosswalk';

export function loadBindings(form) {
  if (form === '433a') return fromGeneratedFields(form);
  // 433-A(OIC), 433-B(OIC) and 433-B take the DERIVED path rather than falling through to
  // fromCrosswalk: their crosswalks bind a key to a classification ENTRY and name a FACT, and
  // the property name is DERIVED from the entry's category — so those crosswalks carry no
  // `hs_name` at all and fromCrosswalk produces bindings whose hs_name is undefined. Silently,
  // because undefined is a legal thing to put in a Set of property names to request.
  //
  // WHICH PATH IS NO LONGER A LIST OF FORM NAMES. It was, and 433-B fell through it — 116 rows,
  // every hs_name undefined. bindingSourceOf() now reads the shape off the rows.
  return bindingSourceOf(form) === 'derived' ? fromDerivedFields(form) : fromCrosswalk(form);
}

// FORM THREE: names were DERIVED, not crosswalked by hand and not generated by a string rule.
// crosswalk.433aoi.json binds a key to a classification ENTRY and names a fact; the name comes
// from the entry's CATEGORY, and derive-names-433aoi.mjs writes the result to fields.433aoi.json.
// So the artefact this reads has the same SHAPE as form one's and a different PROVENANCE, which
// is why it gets its own branch rather than being folded into fromGeneratedFields: that function
// infers `kind` from `source.startsWith('groups')` and from `source === 'checkboxes'`, and this
// form has a fourth construct - `check_here`, the lone box with no counterpart cell - which that
// rule would silently classify as a scalar. A lone box read as a scalar passes the value through
// untranslated, and an untranslated "true" happens to work today, which is the most dangerous
// kind of wrong: it would stop working the moment the option table changed and nothing would say
// so. Decided here, once, from what the artefact recorded.
function fromDerivedFields(form) {
  const doc = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));
  return doc.properties.map((p) => ({
    key: p.key,
    hs_name: p.hs_name,
    // ONE VOCABULARY, DECLARED AT THE TOP OF THIS FILE AND ASSERTED AT THE BOUNDARY BY
    // adapters/hubspot/assert-intake-keys.mjs. This used to be a chain of literal comparisons
    // against `p.source`, matching the generator's spellings by coincidence; an unrecognised
    // construct fell through to `scalar` and the fetch layer passed the value through
    // untranslated, silently. `kindOf` returns null instead, and null is a STOP.
    kind: kindOf(p) ?? unknownConstruct(form, p),
    map_option_by_value: p.map_option_by_value || null,
    row_shape: p.row_shape || null,
    aliases: [],
    classification: p.category,
    entry: p.entry,
    origin: `fields.${form}.json`,
  }));
}

// Form one: names were generated from the map, and the generator recorded which map construct
// produced each property in `source`.
function fromGeneratedFields(form) {
  const doc = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));
  return doc.properties.map((p) => ({
    key: p.key,
    hs_name: p.hs_name,
    // THE SAME VOCABULARY AS FORM THREE'S READER, WHICH IT WAS NOT BEFORE. This read
    // `startsWith('groups')` while the other read `=== 'groups'` — two normalisers for one
    // field, agreeing only because 433-A's generator appends prose and the derivers do not.
    // `constructOf` is the one normaliser and `CONSTRUCT_KIND` the one table. Proved a no-op on
    // all three generated forms: 186 + 239 + 113 bindings, 0 kinds move.
    kind: kindOf(p) ?? unknownConstruct(form, p),
    map_option_by_value: p.map_option_by_value || null,
    row_shape: null,
    aliases: [],
    origin: `fields.${form}.json`,
  }));
}

// Form two onward: names were crosswalked. A row carries `row_shape` if it is a serialized
// table and `map_option_by_value` if the stored value needs translating — so `kind` is read
// off the artifact rather than guessed from the name, which is what the 433f_pay_freq /
// 433f_hh_size pair would defeat (one is an option, one is a plain number, both are "freq or
// count"-looking keys).
function fromCrosswalk(form) {
  const xw = JSON.parse(readFileSync(`adapters/hubspot/crosswalk.${form}.json`, 'utf8'));
  return xw.bindings.map((r) => ({
    key: r.key,
    hs_name: r.hs_name,
    kind: Array.isArray(r.row_shape) ? 'group' : r.map_option_by_value ? 'option' : 'scalar',
    map_option_by_value: r.map_option_by_value || null,
    row_shape: r.row_shape || null,
    // Other spellings of the same input the FILL ENGINE also accepts (`household_size` for
    // 433f_hh_size, the bare `pay_freq`). The fetch layer emits the canonical `key`; the
    // seeder needs the aliases, because a hand-authored fixture predates the prefix rule and
    // reads naturally in the bare form.
    aliases: r.also_accepted_by_engine || [],
    classification: r.classification,
    origin: `crosswalk.${form}.json`,
  }));
}

// Every input key the fill engine for `form` can actually consume, from the map plus the
// inputs the engine reads through its own helpers. A key the fetch layer emits that is not in
// here never reaches the page, and the engine will not mention it.
export function consumableKeys(form, mapDoc) {
  const base = [
    ...(mapDoc.special?.composite_name_address?.from || []),
    ...Object.keys(mapDoc.map || {}),
    // `split` carries prose keys beside its definitions. The fill engines skip any entry with
    // no `parts` array, so those are not consumable inputs — filtered the same way the engine
    // skips them, and mirrored in validate-crosswalk.mjs.
    ...Object.entries(mapDoc.split || {})
      .filter(([, v]) => v && typeof v === 'object' && Array.isArray(v.parts))
      .map(([k]) => k),
    ...Object.entries(mapDoc.checkboxes || {})
      .filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v) && !v.index)
      .map(([k]) => k),
    // `check_here` — the lone box with no counterpart cell, a construct 433-A(OIC) needs and
    // neither earlier map declares. Filtered the same way the fill engine skips it: an entry
    // without a string `target` is the block's own `_why` prose, not an input. Adding it here
    // is a no-op for 433-A and 433-F, whose maps have no check_here block at all — but a key
    // the fetch layer emits that is not in this set is reported as an ORPHAN, so leaving the
    // construct out would have failed all seventeen of them for the wrong reason.
    ...Object.entries(mapDoc.check_here || {})
      .filter(([, v]) => v && typeof v === 'object' && typeof v.target === 'string')
      .map(([k]) => k),
    // A GROUP'S INPUT KEY IS ITS `array`, ITS `source`, OR THE GROUP'S OWN NAME — and the third
    // fallback is not a guess, it is what the fill engines do, read off each of them:
    //   fill-433a.mjs    data[def.source || gName]
    //   fill-433aoi.mjs  data[def.source || gName]
    //   fill-433boi.mjs  def.array || def.source || g
    //   fill-433b.mjs    input(g)        <- the group NAME only; declares neither array nor source
    //   fill-433f.mjs    data[def.array]
    // Without the name fallback all fourteen of 433-B's groups collapsed to `undefined`, so
    // every group key the fetch layer emitted was reported an ORPHAN — "not consumed by the
    // engine" — about the fourteen keys the engine reads by name. This is [D-16]'s finding in
    // validate-crosswalk.mjs, standing unfixed one module along, and Object.values() is what hid
    // it: the fallback needs the key and Object.values throws it away.
    ...Object.entries(mapDoc.groups || {})
      .filter(([g, d]) => !g.startsWith('_') && d && Array.isArray(d.slots))
      .map(([g, d]) => d.array || d.source || g),
    mapDoc.allowed?.national_standards_total?.input,
    ...(mapDoc.allowed?.out_of_pocket_health?.inputs || []),
  ].filter(Boolean);

  // THE ENGINE'S EXTRA INPUTS — the ones the map names only TARGETS for, or names no cell for
  // at all. IMPORTED from adapters/hubspot/classification-coverage.mjs rather than restated.
  //
  // It WAS restated here: a literal `{ '433f': [five keys] }`, a copy of the table that module
  // exports, in the file whose own header explains why the fetch layer and the seeder must not
  // each re-derive the same thing. That is the parallel-list defect guard-sweep.mjs enumerates,
  // sitting in this repo since the table was moved, and it stayed harmless only because nothing
  // had been added to the table since. 433-B(OIC)'s `business_income_expense_route` is the
  // addition that would have split them: the fetch layer would emit a key this function calls
  // unconsumable, and hs-fetch would report the route as an ORPHAN and refuse to write.
  return new Set([...base, ...(ENGINE_EXTRA_INPUTS[form] || [])]);
}
