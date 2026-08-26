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

import { readFileSync, readdirSync } from 'fs';
import { hs, stop } from './hs-lib.mjs';

const form = process.argv[2] || '433a';
const doc = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));

// --- what the portal is EXPECTED to hold is the definition file PLUS every crosswalk extension
//
// A later form can need an option value an earlier form never printed. 433-F prints a
// Semi-monthly pay-period box that 433-A does not, so irs433_tp_pay_period — which
// fields.433a.json declares with four options — correctly carries five once 433-F is
// provisioned. Without this, verifying 433-A after that point reports a DIFF on a property
// that is exactly right, and a check that cries wolf is a check people stop running.
//
// So the expected option set is the UNION: the declaring form's list, plus anything a
// crosswalk in this repo has recorded as an additive extension. It is read from the crosswalk
// files rather than listed here, so the next form's extension needs no edit to this file.
const optionExtensions = new Map();     // hs_name -> Set(added values)
const extensionSource = new Map();      // hs_name -> which crosswalk asked for it
for (const f of readdirSync('adapters/hubspot').filter((n) => /^crosswalk\..+\.json$/.test(n))) {
  const xw = JSON.parse(readFileSync(`adapters/hubspot/${f}`, 'utf8'));
  for (const e of xw.option_extensions || []) {
    if (!optionExtensions.has(e.hs_name)) optionExtensions.set(e.hs_name, new Set());
    for (const a of e.add) optionExtensions.get(e.hs_name).add(String(a.value));
    extensionSource.set(e.hs_name, f);
  }
}

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
    const extended = optionExtensions.get(p.hs_name);
    const want = [...new Set([...p.options.map((o) => String(o.value)), ...(extended || [])])].sort().join(',');
    const got = (l.options || []).map((o) => String(o.value)).sort().join(',');
    if (want !== got) {
      const via = extended ? ` (expected set includes the extension from ${extensionSource.get(p.hs_name)})` : '';
      diffs.push(`options [${got}] != [${want}]${via}`);
    }
  }
  if (diffs.length) mismatched.push(`${p.hs_name}: ${diffs.join('; ')}`);
}

if (optionExtensions.size) {
  console.log(`option extensions folded into the expected set: ${optionExtensions.size} property/ies`);
  for (const [n, vals] of optionExtensions) console.log(`  ${n} += [${[...vals].join(', ')}]  (${extensionSource.get(n)})`);
  console.log('');
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

if (missing.length || mismatched.length) stop(3);
console.log('');
console.log('verified: portal matches the definition file.');
