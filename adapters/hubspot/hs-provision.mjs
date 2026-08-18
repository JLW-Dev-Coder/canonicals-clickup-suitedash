// Provision HubSpot custom properties + groups from the generated per-form definitions.
//
//   node adapters/hubspot/hs-provision.mjs <form> [--dry-run]
//   node adapters/hubspot/hs-provision.mjs 433f --dry-run
//
// WHY THIS EXISTS ALONGSIDE New-HubSpotProperties.ps1
// ---------------------------------------------------
// The PowerShell provisioner cannot send this repo's property descriptions. PowerShell 5.1's
// Invoke-RestMethod encodes a string body as ISO-8859-1 unless it is handed raw bytes, so every
// non-ASCII character in a description leaves as 0x3F and HubSpot rejects the whole batch:
//
//   ! batch 0 failed: Invalid input JSON on line 153, column 72: Invalid UTF-8 middle byte 0x3f
//
// Four 433-F descriptions carry an em-dash, transcribed from the form's own printed label. The
// batch is all-or-nothing, so four characters blocked twenty-seven property creations.
//
// It failed loudly, which is the good case. The bad case is the one this file removes: a
// provisioner that mangles a description SUCCEEDS whenever the mangled character happens to be
// legal, and a property name is immutable. hs-lib.mjs already states the rule this restores —
// "every call in this reset is either destructive or permanent, so the transport is node's
// fetch throughout" — and creating an immutable name is exactly that kind of call.
//
// SEMANTICS ARE THE POWERSHELL SCRIPT'S, DELIBERATELY UNCHANGED
//   - the generated fields.<form>.json is authoritative for its form
//   - a property that already exists is SKIPPED, never patched: this script creates, it does
//     not migrate, and a definition drifting from a live property is a separate decision
//   - groups are created before the properties that land in them
//   - --dry-run prints exactly what would be created and touches nothing

import { readFileSync } from 'node:fs';
import { hs } from './hs-lib.mjs';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const form = argv.filter((a) => !a.startsWith('--'))[0];
if (!form) {
  console.error('usage: node adapters/hubspot/hs-provision.mjs <form> [--dry-run]');
  process.exit(2);
}
const objectType = 'contacts';

const defs = JSON.parse(readFileSync(`adapters/hubspot/fields.${form}.json`, 'utf8'));
const props = defs.properties || [];
const groups = defs.groups || [];
console.log(`${form}: ${props.length} generated definition(s), ${groups.length} group(s) -> ${objectType}${dryRun ? '  [DRY RUN]' : ''}`);

// --- what is already there ------------------------------------------------------------------
const liveGroups = new Set(((await hs(`/crm/v3/properties/${objectType}/groups`)).results || []).map((g) => g.name));
const liveProps = new Set(((await hs(`/crm/v3/properties/${objectType}`)).results || []).map((p) => p.name));
console.log(`  portal holds ${liveProps.size} ${objectType} propert(ies) and ${liveGroups.size} group(s) today`);

// --- groups -------------------------------------------------------------------------------
for (const g of groups) {
  if (liveGroups.has(g.name)) { console.log(`  group exists: ${g.name}`); continue; }
  if (dryRun) { console.log(`  [dry] create group ${g.name} (${g.label})`); continue; }
  await hs(`/crm/v3/properties/${objectType}/groups`, { method: 'POST', body: { name: g.name, label: g.label, displayOrder: g.displayOrder } });
  console.log(`  + group ${g.name}`);
}

// --- properties ----------------------------------------------------------------------------
const toCreate = props.filter((p) => !liveProps.has(p.hs_name)).map((p) => {
  const body = { name: p.hs_name, label: p.label, type: p.type, fieldType: p.fieldType, groupName: p.group };
  if (p.options) body.options = p.options.map((o) => ({ label: o.label, value: o.value, displayOrder: o.displayOrder }));
  if (p.description) body.description = p.description;
  else if (p.pii) body.description = 'PII - handle per VLP PII rule';
  return body;
});
console.log(`  to create: ${toCreate.length} (skipping ${props.length - toCreate.length} already present)`);
if (!toCreate.length) { console.log('  nothing to do.'); process.exit(0); }

for (const b of toCreate) console.log(`    ${dryRun ? '[dry] ' : ''}${b.name}  ${b.type}/${b.fieldType}  in ${b.groupName}`);
if (dryRun) { console.log(`[dry run] would create ${toCreate.length} propert(ies). Nothing was written.`); process.exit(0); }

let created = 0;
for (let i = 0; i < toCreate.length; i += 100) {
  const chunk = toCreate.slice(i, i + 100);
  await hs(`/crm/v3/properties/${objectType}/batch/create`, { method: 'POST', body: { inputs: chunk } });
  created += chunk.length;
  console.log(`  + created ${chunk.length} (total ${created})`);
}

// Read the portal back rather than trusting the response: a create that reported success and a
// name that is actually queryable are different claims, and only the second one is the one the
// fetch layer depends on.
const after = new Set(((await hs(`/crm/v3/properties/${objectType}`)).results || []).map((p) => p.name));
const notThere = toCreate.filter((b) => !after.has(b.name));
if (notThere.length) {
  console.error(`  ${notThere.length} propert(ies) reported created but are not in the portal: ${notThere.map((b) => b.name).join(', ')}`);
  process.exit(3);
}
console.log(`done. created ${created} propert(ies); all ${created} read back from the portal.`);
console.log(`  ${objectType} custom properties now: ${[...after].length} total on the object`);
