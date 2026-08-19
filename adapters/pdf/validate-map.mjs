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
  const KINDS = new Set(['lie', 'container', 'inherited', 'control']);
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

  const t = lies._tally || {};
  console.log(`name-lie registry: ${liesPath} — ${(lies.entries || []).length} entries (${t.active_lies ?? '?'} active lies, ${t.controls_verified_true ?? '?'} verified-true controls, ${t.bound_today ?? '?'} bound today)`);
  if (problems.length) {
    console.error(`NAME-LIE REGISTRY — ${problems.length} problem(s):`);
    problems.forEach(m => console.error(`  ${m}`));
    process.exit(2);
  }
  console.log('OK — every declared path exists, no path is declared twice, and every declared binding resolves through the map to exactly the field the registry names.');
}

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
