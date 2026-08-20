// Emit the HubSpot property definitions a form's crosswalk says are NEW.
//
//   node adapters/hubspot/gen-fields-from-crosswalk.mjs <form>
//   -> adapters/hubspot/fields.<form>.json   (the shape New-HubSpotProperties.ps1 reads)
//
// WHY THIS EXISTS ALONGSIDE gen-fields-from-map.mjs
// ------------------------------------------------
// gen-fields-from-map.mjs generated 433-A's 186 properties by transforming its map keys —
// strip the printed line marker, name the fact. That worked because 433-A was FIRST: every
// key it held became a name, so a mechanical rule could produce all of them.
//
// Every form after the first is a different problem. Most of its facts already have names,
// and the ones that do not cannot be told apart from the ones that do by any string rule —
// 433f_county and irs433_county_of_residence are one fact and share no substring. So the
// decision moves to the crosswalk, made once by hand and reviewable, and this file only
// TRANSCRIBES it into the provisioner's shape.
//
// THE CONSEQUENCE, STATED: this generator cannot catch a wrong match, because it has no
// independent view of the facts. What it can catch is a match that contradicts the artifacts
// — a "new" name that already exists, a type the backbone already owns — and
// validate-crosswalk.mjs does exactly that. Run it first; this file refuses to run if the
// crosswalk has not been validated in the same breath.
//
// ONLY THE ADDITIONS ARE EMITTED. Rows classed `exact` name a property the backbone already
// owns and are deliberately absent from the output: re-declaring them here would give one
// property two definition files, and the day those disagree the portal follows whichever ran
// last. The crosswalk stays the single record of what feeds what.

import { readFileSync, writeFileSync } from 'fs';
import { assertGenerator, generatorMeta, selfPath } from './generator-guard.mjs';
import { execFileSync } from 'node:child_process';

const form = process.argv[2];
if (!form) {
  console.error('usage: node adapters/hubspot/gen-fields-from-crosswalk.mjs <form>');
  process.exit(2);
}

// Refuse to transcribe an unvalidated crosswalk. The failures validate-crosswalk.mjs catches
// are exactly the ones that are invisible after the names are permanent.
try {
  execFileSync(process.execPath, ['adapters/hubspot/validate-crosswalk.mjs', form], { stdio: 'inherit' });
} catch {
  console.error(`\nvalidate-crosswalk.mjs failed for ${form} — nothing written.`);
  process.exit(2);
}

const xwPath = `adapters/hubspot/crosswalk.${form}.json`;
const outPath = `adapters/hubspot/fields.${form}.json`;
const xw = JSON.parse(readFileSync(xwPath, 'utf8'));

const SHARED_PREFIX = 'irs433';
const FORM_PREFIX = `irs${form}`;
const FORM_LABEL = form.replace(/^433/, '433-').toUpperCase();

const humanize = (name) => {
  const s = name.replace(/^irs433f?_/, '').replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const properties = [];
for (const r of xw.bindings) {
  if (r.classification === 'exact') continue;   // already owned by the backbone — see header

  const scope = r.classification === 'form_specific' ? form : 'shared';
  const isTable = Array.isArray(r.row_shape);

  const parts = [
    `${FORM_LABEL}: ${r.printed_label} (input key: ${r.key}).`,
    scope === 'shared'
      ? 'Shared across the 433 series - named for the fact, not the form.'
      : `Specific to form ${FORM_LABEL} - see crosswalk.${form}.json entry ${r.key} for why this one could not be shared.`,
  ];
  // A serialized table is unreadable without its row shape, and the shape lives in one map.
  // Anyone reaching for this property from another form needs to see that before they try.
  if (isTable) parts.push(`JSON array of row objects with keys: ${r.row_shape.join(', ')}.`);
  if (r.pii) parts.push('PII - handle per VLP PII rule.');

  properties.push({
    key: r.key,
    scope,
    hs_name: r.hs_name,
    form,
    field: r.key,
    label: `[433] ${humanize(r.hs_name)}${isTable ? ` (JSON array; ${r.row_shape.length} columns)` : ''}`,
    description: parts.join(' '),
    group: scope === 'shared' ? SHARED_PREFIX : FORM_PREFIX,
    type: r.type,
    fieldType: r.fieldType,
    options: r.options ?? null,
    map_option_by_value: r.map_option_by_value ?? null,
    pii: !!r.pii,
    source: isTable ? `groups (serialized: ${r.row_shape.join(', ')})` : r.consumed_by,
    type_basis: r.type_basis,
    classification: r.classification,
  });
}

// Only groups something actually lands in, so provisioning never creates an empty namespace.
const groups = [
  { name: SHARED_PREFIX, label: 'Form 433 series (shared)', displayOrder: 0 },
  { name: FORM_PREFIX, label: `Form ${FORM_LABEL} (form-specific)`, displayOrder: 1 },
].filter((g) => properties.some((p) => p.group === g.name));

const shared = properties.filter((p) => p.scope === 'shared').length;
const doc = {
  meta: {
    form,
    form_revision: xw.meta.form_revision,
    catalog: xw.meta.catalog,
    generated_from: xwPath,
    generator: 'adapters/hubspot/gen-fields-from-crosswalk.mjs',
    naming_rule: xw.meta.what_this_is,
    contains:
      'ONLY the properties this form ADDS. The rows the crosswalk classed `exact` bind to ' +
      'properties the backbone already owns and are deliberately not re-declared here — one ' +
      'property with two definition files follows whichever provisioner ran last.',
    reused_not_recreated: xw.meta.counts.exact,
    counts: {
      total: properties.length,
      shared,
      form_specific: properties.length - shared,
      pii: properties.filter((p) => p.pii).length,
    },
  },
  groups,
  properties,
};

// THE GENERATOR GUARD - see adapters/hubspot/generator-guard.mjs. This file's output is the
// one that was overwritten by the wrong tool, so the assertion is not hypothetical here.
const SELF = selfPath(process.argv[1]);
const guard = assertGenerator(outPath, SELF, { adopt: process.argv.includes('--adopt') });
doc.meta = { ...doc.meta, ...generatorMeta(SELF, { generated_from: xwPath }) };
console.log(`generator guard: ${outPath} -> ${guard.verdict}${guard.declared ? ` (declares ${guard.declared})` : ''}`);

writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n');
console.log('');
console.log(`${form}: ${properties.length} NEW properties -> ${outPath}`);
console.log(`  scope: ${shared} shared (${SHARED_PREFIX}_), ${properties.length - shared} form-specific (${FORM_PREFIX}_)`);
console.log(`  reused rather than recreated: ${xw.meta.counts.exact} already on the backbone`);
console.log(`  flagged PII: ${doc.meta.counts.pii}`);
