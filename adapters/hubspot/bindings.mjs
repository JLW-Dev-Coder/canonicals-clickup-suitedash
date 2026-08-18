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

export function loadBindings(form) {
  if (form === '433a') return fromGeneratedFields(form);
  return fromCrosswalk(form);
}

// Form one: names were generated from the map, and the generator recorded which map construct
// produced each property in `source`.
function fromGeneratedFields(form) {
  const doc = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));
  return doc.properties.map((p) => ({
    key: p.key,
    hs_name: p.hs_name,
    kind: p.source.startsWith('groups') ? 'group' : p.source === 'checkboxes' && p.map_option_by_value ? 'option' : 'scalar',
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
    ...Object.keys(mapDoc.split || {}),
    ...Object.entries(mapDoc.checkboxes || {})
      .filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v) && !v.index)
      .map(([k]) => k),
    ...Object.values(mapDoc.groups || {})
      .filter((d) => d && Array.isArray(d.slots))
      .map((d) => d.array || d.source),
    mapDoc.allowed?.national_standards_total?.input,
    ...(mapDoc.allowed?.out_of_pocket_health?.inputs || []),
  ].filter(Boolean);

  // 433-F's engine reads five inputs the map names only TARGETS for. Listed from reading
  // fill-433f.mjs, and mirrored in validate-crosswalk.mjs — an unticked checkbox and an
  // unasked question print identically, so neither list may quietly shrink.
  const extra = {
    '433f': ['433f_address_differs', '433f_pay_freq', '433f_spouse_pay_freq', '433f_hh_size', '433f_age_band'],
  };
  return new Set([...base, ...(extra[form] || [])]);
}
