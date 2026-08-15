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

import { readFileSync } from 'fs';
import { readFormRevisionWithPages } from './read-form-revision.mjs';

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
