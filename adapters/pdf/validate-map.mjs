// Validates every PDF field target in a map against the form's enumerated field list.
//
// CLI:  node adapters/pdf/validate-map.mjs [form]      (default 433f)
//
// The walk is SCHEMA-AGNOSTIC ON PURPOSE. Earlier this file enumerated known keys
// (`map`, `groups`, `allowed`, `checkboxes`, `exclusive`), which meant a target
// authored under a key the validator had never heard of was silently never checked
// — precisely the failure this engine exists to prevent. Now: recurse the entire
// map object and collect every string value that looks like a field target, at any
// depth, under any key, including `_deferred` (which is never filled but must still
// name fields that actually exist).
//
// Exits 2 on any missing target or on a revision-pin mismatch.

import { readFileSync, existsSync } from 'fs';
import { readFormRevisionWithPages } from './read-form-revision.mjs';
import { auditRounding, reportRounding } from './rounding.mjs';
import { runCountSweep, reportCountSweep } from './count-sweep.mjs';

const form      = process.argv[2] || '433f';
const mapPath   = `adapters/pdf/maps/${form}.map.json`;
const mapDoc    = JSON.parse(readFileSync(mapPath, 'utf8'));
const fieldsDoc = JSON.parse(readFileSync(mapDoc.fields_source || `adapters/pdf/maps/${form}.fields.json`, 'utf8'));
const names     = new Set(fieldsDoc.fields.map(f => f.name));

// A target is any string rooted at the AcroForm's top-level subform. Prose notes,
// file paths and revision pins never start that way, so nothing needs an exclusion list.
const TARGET_PREFIX = 'topmostSubform[0].';
const targets = [];
(function walk(node, path) {
  if (typeof node === 'string') {
    if (node.startsWith(TARGET_PREFIX)) targets.push([path, node]);
    return;
  }
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
  if (node && typeof node === 'object')
    return Object.entries(node).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
})(mapDoc, '');

const unique = new Set(targets.map(([, v]) => v));
console.log(`form ${form}: ${targets.length} target reference(s), ${unique.size} unique, from ${mapPath}; PDF fields: ${names.size}`);

const missing = targets.filter(([, v]) => !names.has(v));
if (missing.length) {
  console.error(`MISSING ${missing.length} target(s) not found verbatim in ${mapDoc.fields_source || `${form}.fields.json`}:`);
  missing.forEach(([k, v]) => console.error(`  ${k} -> ${v}`));
  process.exit(2);
}
console.log('OK — every target in the map (any key, any depth, including _deferred) exists verbatim in the PDF field list.');

// Revision pinning. A map is authored against ONE printed revision: the IRS renumbers
// lines between revisions, so the same field name can move to a different cell. Pinning
// makes that fail loudly here instead of silently mis-filling a filed form.
if (mapDoc.form_revision) {
  const info = await readFormRevisionWithPages(mapDoc.form);
  const revOk = info.revision === mapDoc.form_revision;
  const catOk = !mapDoc.catalog || info.catalog === mapDoc.catalog;
  console.log(`revision pin: map declares Rev. ${mapDoc.form_revision}${mapDoc.catalog ? ` / Cat ${mapDoc.catalog}` : ''}; PDF prints Rev. ${info.revision ?? '(none)'}${info.catalog ? ` / Cat ${info.catalog}` : ''}`);
  if (!revOk || !catOk) {
    console.error(`REVISION MISMATCH — ${info.file} is not the revision this map was authored against.`);
    if (!revOk) console.error(`  form_revision: map "${mapDoc.form_revision}" vs PDF "${info.revision ?? '(none)'}"`);
    if (!catOk) console.error(`  catalog:       map "${mapDoc.catalog}" vs PDF "${info.catalog ?? '(none)'}"`);
    console.error('  Re-author the map against the new revision — do NOT just bump the pin.');
    process.exit(2);
  }
  console.log('OK — loaded PDF matches the pinned revision.');
}

// ---------------------------------------------------------------------------------------
// THE NAME-LIE REGISTRY.
//
// `<form>.name-lies.json` records every AcroForm leaf name on this form that is known to
// describe something other than the cell it names. It binds nothing and is read by no fill
// engine. It is asserted HERE, and the assertion is the whole reason it is a file rather
// than prose in a slice report: prose cannot notice when it stops being true.
//
// Two things are checked, and only two, because only two are checkable without re-deriving
// the reading the entry records:
//   1. the declared `path` EXISTS — verbatim in the field list for a leaf, or as the prefix
//      of at least one enumerated field for a `container` (a subform is not a field);
//   2. a declared `bound_to` RESOLVES THROUGH THE MAP TO EXACTLY THAT PATH. This is the
//      assertion that matters. A lie entry says "map key K points at field F, and F's name
//      lies about F". If someone later 'fixes' the map by repointing K at the field the
//      NAME suggests, the entry silently becomes a description of nothing — and the repoint
//      is exactly the defect the registry exists to prevent. Checked, so it cannot.
// The printed captions and coordinates are NOT asserted. Re-reading them out of the PDF to
// compare against a transcription of the same read is circular; they are quoted verbatim so
// a person can re-measure them with align-block.mjs and line-markers.mjs.
const liesPath = `adapters/pdf/maps/${form}.name-lies.json`;
if (!existsSync(liesPath)) {
  console.log(`name-lie registry: no ${liesPath} — this form declares none. (Not a failure: only forms whose leaf names have been read AND found wrong carry one.)`);
} else {
  const lies = JSON.parse(readFileSync(liesPath, 'utf8'));
  // `page_imprecise` is the third status, added in slice 5. A name that UNDERSTATES a cell the
  // printed page also understates is neither a lie nor a control: admitting it as a lie would
  // stop the lie total meaning "the name disagrees with the page", and dropping it entirely
  // would make 433-B(OIC) re-litigate the same fork from nothing.
  const KINDS = new Set(['lie', 'container', 'inherited', 'control', 'page_imprecise']);
  // Which kinds the ACTIVE LIE total counts. The other kinds are recorded and not counted, and
  // this set is the one place that says which is which.
  const COUNTED_AS_LIE = new Set(['lie', 'container']);
  const problems = [];

  // Resolve a `bound_to` the way the map itself addresses cells: a scalar `map` key, or a
  // group cell written "group[row].column" — the same spelling `exclusive` and the totals
  // predicate use. One spelling across the repo, so a path cannot be right here and wrong
  // three files away.
  const resolveBinding = (b) => {
    if (typeof b !== 'string') return { how: 'not a string' };
    const scalar = mapDoc.map?.[b];
    if (typeof scalar === 'string') return { target: scalar, how: `map."${b}"` };
    const m = /^([A-Za-z0-9_]+)\[(\d+)\]\.(.+)$/.exec(b);
    if (m) {
      const slot = mapDoc.groups?.[m[1]]?.slots?.[Number(m[2])];
      const t = slot?.text?.[m[3]] ?? slot?.[m[3]];
      if (typeof t === 'string') return { target: t, how: `groups.${m[1]}.slots[${m[2]}].text.${m[3]}` };
      return { how: `groups.${m[1]}.slots[${m[2]}] has no column "${m[3]}"` };
    }
    return { how: `"${b}" is neither a \`map\` key nor a "group[row].column" cell` };
  };

  const seen = new Map();
  for (const e of lies.entries || []) {
    const id = e.id || '(no id)';
    if (!KINDS.has(e.kind)) problems.push(`${id}: kind "${e.kind}" is not one of ${[...KINDS].join(', ')}`);
    if (typeof e.path !== 'string' || !e.path.startsWith(TARGET_PREFIX)) { problems.push(`${id}: \`path\` is missing or is not rooted at ${TARGET_PREFIX}`); continue; }
    if (seen.has(e.path)) problems.push(`${id}: declares the same \`path\` as ${seen.get(e.path)} — one cell, one entry`);
    else seen.set(e.path, id);

    if (e.kind === 'container') {
      const kids = [...names].filter(n => n.startsWith(e.path + '.')).length;
      if (!kids) problems.push(`${id}: container path has NO enumerated descendants — ${e.path}`);
    } else if (!names.has(e.path)) {
      problems.push(`${id}: path not found verbatim in the PDF field list — ${e.path}`);
    }

    if (e.bound_to !== null && e.bound_to !== undefined) {
      const r = resolveBinding(e.bound_to);
      if (!r.target) problems.push(`${id}: \`bound_to\` does not resolve — ${r.how}`);
      else if (r.target !== e.path)
        problems.push(`${id}: \`bound_to\` "${e.bound_to}" resolves through ${r.how} to a DIFFERENT field.\n      registry says: ${e.path}\n      map points at: ${r.target}\n      One of the two is wrong. If the map was 'corrected' toward what the leaf name suggests, this is that correction being caught.`);
    } else if (e.kind !== 'container' && !e.not_bound_because) {
      problems.push(`${id}: \`bound_to\` is null and no \`not_bound_because\` says why`);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════════════
  // THE META-RULE. Written here, beside the sentence that proved it.
  //
  //   WHEN A DEFECT CLASS EARNS A GUARD, THE SAME COMMIT ENUMERATES EVERY INSTANCE OF THAT
  //   CLASS IN THE SAME ARTEFACT AND DISPOSES OF EACH — derived, or declared underivable
  //   with the reason. A guard applied only where the defect was noticed is a guard that
  //   certifies its own blind spot.
  //
  // This file is where that rule was earned. It once carried, right here, a derivation of the
  // registry's `_tally` from `entries[]`, with the reason in plain English: "a retyped count
  // drifting from the list underneath it is exactly how 'eleven' survived three slices when
  // the honest figure was ten." That guard was correct, it worked, and it was built once and
  // applied once. Three more retyped counts sat in this same file, one key over, unguarded —
  // and `_partition` was ALREADY self-contradicting on the day the guard shipped beside it.
  //
  // Two slices later the same shape happened again, one level down: the fix for `_partition`
  // added a check for `_unaccounted_by_page` whose regex reached disk with its backslashes
  // eaten, so it matched nothing — and the check was written `if (nums.length && ...)`, which
  // turned "I could not read my input" into "I agree". Dead from the commit that introduced
  // it, with PASS printed underneath.
  //
  // So every count in this repo now goes through adapters/pdf/count-sweep.mjs, which
  // enumerates EVERY claim site across the map and every sidecar and requires each to be in
  // exactly one of two states. There is no third state, an unreadable extraction is a STOP
  // rather than a pass, and the `_tally` derivation that used to live here lives there — with
  // two more keys than it ever checked, because `bound_today` was being printed straight out
  // of the file as though it were a result.
  console.log(`name-lie registry: ${liesPath} — ${(lies.entries || []).length} entries; every count it declares is derived and checked by adapters/pdf/count-sweep.mjs [S-11, S-12, S-13].`);
  console.log('OK — every declared path exists, no path is declared twice, and every declared binding resolves through the map to exactly the field the registry names.');
}

// ---------------------------------------------------------------------------------------
// EVERY MAP DECLARES ITS PARTITION AND ITS CARRIED-QUESTIONS LEDGER. BOTH. ALWAYS.
//
// A SKIP IS NOT A PASS. Both declarations were optional, and 433-A and 433-F declared
// neither — so the guards that derive and check them passed those two forms by finding
// nothing to check, and a map that DROPPED a declaration would have passed the same way.
// That is the no-declared-state defect for the third time in this repo: silence read as
// agreement. A missing declaration is a STOP, not a skip.
//
// The counts inside them are not checked here. They are checked, along with every other
// count this map or any of its sidecars states about itself, by the sweep below.
{
  const missing = [];
  if (!mapDoc._partition) missing.push('`_partition` — what this map accounts for, against what the form holds. Derive it: form_fields_total, in_this_slice, bound_writable, excluded_never_autofill, deferred, unaccounted, plus `_check` and `_unaccounted_by_page`.');
  if (!mapDoc._carried)   missing.push('`_carried` — the questions one slice raised and no slice has answered, with `open[]`, `resolved[]` and a derived `_count`. A map with no open question declares an empty ledger; it does not omit one.');
  if (missing.length) {
    console.error(`MANDATORY DECLARATION MISSING — ${mapPath} declares ${missing.length} of the two required self-descriptions not at all:`);
    missing.forEach(m => console.error(`  ${m}`));
    console.error('  A map that declares nothing passes every check that derives what it declares. That is why this is a STOP.');
    process.exit(2);
  }
  console.log(`mandatory declarations: _partition and _carried both present on ${mapPath}.`);
}

// ---------------------------------------------------------------------------------------
// THE COUNT SWEEP. See adapters/pdf/count-sweep.mjs for the meta-rule it enforces and for
// the enumeration itself. Every count this map, its totals file, its headings file, its
// name-lie registry, the shared row-class spec, the crosswalk and the IRS standards sidecar
// state about themselves is either DERIVED AND CHECKED here, or declared underivable with
// the reason. A claim site in neither state is a STOP.
const sweep = await runCountSweep(form);
if (reportCountSweep(sweep, { verbose: process.argv.includes('--sweep') }) > 0) process.exit(2);

// ---------------------------------------------------------------------------------------
// THE ROUNDING DECLARATION.
//
// Asserted here rather than as a twelfth gate step, because it is a statement the map makes
// about itself and this is the step that checks those. See adapters/pdf/rounding.mjs for what
// each block must carry and why `none_printed` has to be said out loud.
//
// The totals declaration is loaded ONLY for the cross-check — every money cell it references
// must sit in exactly one rounding block. That is the assertion that makes "a money cell added
// later with no rounding declaration is a STOP" true rather than aspirational: a new total
// cannot be authored without either declaring its block or tripping this.
const totalsPath = `adapters/pdf/maps/${form}.totals.json`;
const totalsDoc  = existsSync(totalsPath) ? JSON.parse(readFileSync(totalsPath, 'utf8')) : null;
if (mapDoc.rounding && !totalsDoc)
  console.log(`rounding: NOTE — ${totalsPath} does not exist, so the money-cell cross-check cannot run. Reported, not passed.`);
if (reportRounding(auditRounding(mapDoc, totalsDoc), mapPath) > 0) process.exit(2);
