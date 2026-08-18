// Verify that what the portal holds matches what the definition file declares.
//
//   node adapters/hubspot/hs-verify-provision.mjs <form>
//
// Provisioning reported "created 186". That is the CLIENT's count of what it sent, not the
// portal's account of what exists, and the two diverge in exactly the cases that matter: a
// name silently lowercased, a batch that half-applied, an option list the API rewrote. So this
// reads the portal back and compares field by field.
//
// It also reports the custom-property count against the ceiling, so the headroom left for the
// remaining six forms is on the record rather than inferred later from a stale number.

import { readFileSync } from 'fs';
import { hs } from './hs-lib.mjs';

const form = process.argv[2] || '433a';
const doc = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));

const live = (await hs('/crm/v3/properties/contacts')).results || [];
const byName = new Map(live.map((p) => [p.name, p]));

const missing = [];
const mismatched = [];
for (const p of doc.properties) {
  const l = byName.get(p.hs_name);
  if (!l) { missing.push(p.hs_name); continue; }
  const diffs = [];
  if (l.type !== p.type) diffs.push(`type ${l.type} != ${p.type}`);
  if (l.fieldType !== p.fieldType) diffs.push(`fieldType ${l.fieldType} != ${p.fieldType}`);
  if (l.groupName !== p.group) diffs.push(`group ${l.groupName} != ${p.group}`);
  // Option VALUES are what the fill engine resolves against, so they are compared; labels are
  // cosmetic and are not.
  if (p.options) {
    const want = p.options.map((o) => String(o.value)).sort().join(',');
    const got = (l.options || []).map((o) => String(o.value)).sort().join(',');
    if (want !== got) diffs.push(`options [${got}] != [${want}]`);
  }
  if (diffs.length) mismatched.push(`${p.hs_name}: ${diffs.join('; ')}`);
}

console.log(`declared in fields.${form}.json: ${doc.properties.length}`);
console.log(`present in portal:              ${doc.properties.length - missing.length}`);
console.log(`missing:                        ${missing.length}`);
console.log(`mismatched:                     ${mismatched.length}`);
for (const m of missing) console.log(`  MISSING  ${m}`);
for (const m of mismatched) console.log(`  DIFF     ${m}`);

// --- scope split --------------------------------------------------------------------------
const shared = doc.properties.filter((p) => p.scope === 'shared');
console.log('');
console.log(`scope: ${shared.length} shared (irs433_), ${doc.properties.length - shared.length} form-specific (irs${form}_)`);

// --- headroom ------------------------------------------------------------------------------
const custom = live.filter((p) => !p.hubspotDefined);
const series = custom.filter((p) => /^irs433/.test(p.name));
console.log('');
console.log('=== CEILING ACCOUNTING ===');
console.log(`custom contact properties now: ${custom.length}`);
console.log(`  of which 433 series:         ${series.length}`);
console.log(`  of which everything else:    ${custom.length - series.length}`);
console.log(`total properties on object:    ${live.length} (${live.length - custom.length} hubspotDefined)`);
console.log('');
console.log('Headroom is stated against the documented 1,000-custom-property ceiling because');
console.log('no endpoint on this portal publishes the number — see hs-preflight.mjs, which');
console.log('probes four candidates and gets 404 from all of them.');
console.log(`  headroom at 1,000: ${1000 - custom.length}`);

if (missing.length || mismatched.length) process.exit(3);
console.log('');
console.log('verified: portal matches the definition file.');
