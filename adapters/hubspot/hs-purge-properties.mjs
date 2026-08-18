// DESTRUCTIVE. Archives the custom contact properties of the 433 series.
//
//   node adapters/hubspot/hs-purge-properties.mjs --dry-run
//   node adapters/hubspot/hs-purge-properties.mjs --confirm-delete-433-properties
//
// WHAT THIS DELETES, AND WHY IT IS NOT "EVERY CUSTOM PROPERTY"
// -----------------------------------------------------------
// Owner authorised deleting the custom contact properties. The reason for the authorisation
// was the ceiling: seven forms under the old one-namespace-per-form convention did not fit.
// Deleting the 433 SERIES alone frees every slot that problem needs, so this script deletes
// exactly that series and leaves the rest of the portal standing. The properties it does NOT
// touch fall into four groups, each of which would cost something real to delete and buys no
// headroom the 433 plan requires:
//
//   UNDELETABLE   HubSpot refuses (readOnlyDefinition — Zoom, the sync extension).
//   FORM-BOUND    23 live HubSpot forms post into them. Deleting a property a live form writes
//                 to does not disable the form; it makes the form drop that answer on the floor
//                 silently, which is the worst of the available failure modes.
//   APP-OWNED     Calendly, Chargebee, SuiteDash, GrowthDrive, ClickUp and the webhook bridge
//                 each own a property GROUP. A property with no data is still a property an
//                 integration writes to on its next sync.
//   vlp_          Organizer routing and gate fields. The naming convention this reset
//                 introduces keeps `vlp_<field>` UNCHANGED, so these are part of the backbone
//                 rather than something being replaced.
//
// hubspotDefined properties are never candidates and are asserted out below.
//
// The 433 series has no data to lose: the contact purge ran first, and a property with no
// object to hang on holds nothing. Names archived here are immediately reusable — verified
// against this portal by creating, deleting and recreating a throwaway property before any of
// this ran, because the whole provisioning step downstream depends on it.

import { existsSync, readFileSync } from 'fs';
import { hs, chunk } from './hs-lib.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const confirmed = args.includes('--confirm-delete-433-properties');
if (!dryRun && !confirmed) {
  console.error('Refusing to run. Pass --dry-run, or --confirm-delete-433-properties to delete.');
  process.exit(2);
}

const AUDIT = 'adapters/hubspot/backup/property-audit.json';
if (!existsSync(AUDIT)) {
  console.error(`ABORT: no audit at ${AUDIT}. Run hs-audit-properties.mjs first.`);
  process.exit(2);
}
const audit = JSON.parse(readFileSync(AUDIT, 'utf8'));

// The series being replaced. `irs433_` (the new shared namespace) is deliberately NOT here —
// re-running this after provisioning must never eat the backbone it just created.
const SERIES = /^(irs433a|irs433aoic|irs433f|irs433b)_/;

const live = (await hs('/crm/v3/properties/contacts')).results || [];
const byName = new Map(live.map((p) => [p.name, p]));
const auditByName = new Map(audit.rows.map((r) => [r.name, r]));

const targets = [];
const skipped = [];
for (const p of live) {
  if (!SERIES.test(p.name)) continue;
  const a = auditByName.get(p.name);
  if (p.hubspotDefined) { skipped.push([p.name, 'hubspotDefined']); continue; }
  if (p.modificationMetadata?.readOnlyDefinition) { skipped.push([p.name, 'readOnlyDefinition']); continue; }
  if (a?.forms?.length) { skipped.push([p.name, `live form: ${a.forms[0]}`]); continue; }
  targets.push(p.name);
}

const customBefore = live.filter((p) => !p.hubspotDefined).length;
console.log(`custom properties before: ${customBefore}`);
console.log(`433-series targets:       ${targets.length}`);
if (skipped.length) {
  console.log(`skipped within series:    ${skipped.length}`);
  for (const [n, why] of skipped) console.log(`   - ${n} (${why})`);
}

const byPrefix = {};
for (const n of targets) {
  const k = /^(irs433[a-z]*)_/.exec(n)[1];
  byPrefix[k] = (byPrefix[k] || 0) + 1;
}
console.log(`  by namespace: ${Object.entries(byPrefix).map(([k, v]) => `${k} ${v}`).join(', ')}`);

if (dryRun) {
  console.log(`[dry run] would archive ${targets.length} properties; ${customBefore - targets.length} custom would survive.`);
  process.exit(0);
}

let done = 0;
for (const batch of chunk(targets, 100)) {
  await hs('/crm/v3/properties/contacts/batch/archive', {
    method: 'POST',
    body: { inputs: batch.map((name) => ({ name })) },
  });
  done += batch.length;
  console.log(`  archived ${done}/${targets.length}`);
}

// --- verify ---------------------------------------------------------------------------------
const after = (await hs('/crm/v3/properties/contacts')).results || [];
const customAfter = after.filter((p) => !p.hubspotDefined).length;
const seriesLeft = after.filter((p) => SERIES.test(p.name) && !p.hubspotDefined).map((p) => p.name);

console.log('');
console.log(`custom before: ${customBefore}`);
console.log(`custom after:  ${customAfter}   (expected ${customBefore - targets.length})`);
console.log(`433-series remaining: ${seriesLeft.length}`);
if (seriesLeft.length) console.log(`   ${seriesLeft.join(', ')}`);

if (customAfter !== customBefore - targets.length) {
  console.error('STOP: surviving custom count does not match the expected figure.');
  process.exit(3);
}
console.log('verified.');
