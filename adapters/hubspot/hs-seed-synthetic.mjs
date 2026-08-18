// Create (or delete) ONE synthetic contact carrying a representative spread of the 433
// backbone, so the round trip can be proven against a live HubSpot record.
//
//   node adapters/hubspot/hs-seed-synthetic.mjs seed [samples/433a.sample.json]
//   node adapters/hubspot/hs-seed-synthetic.mjs delete <contactId>
//
// SYNTHETIC ONLY. The source record must declare `_synthetic: true` or this refuses to run —
// the VLP no-customer-PII rule means a round-trip probe must never be built by copying a real
// contact, and "I'll remember to use the fixture" is not a control.
//
// The email lands in the reserved `.invalid` TLD (RFC 2606), which can never route anywhere.
//
// This is deliberately the MIRROR of hs-fetch-433a.mjs: groups serialize to JSON here and
// parse back there, checkbox values translate to HubSpot's option values here and back to the
// map's option keys there. Writing the two against one another is what makes the round trip a
// test rather than a demonstration — a shared misunderstanding would have to be symmetric to
// survive, and the PDF read-back at the end does not share it.

import { readFileSync } from 'fs';
import { hs } from './hs-lib.mjs';

const [action, arg] = process.argv.slice(2);

if (action === 'delete') {
  if (!arg) { console.error('usage: ... delete <contactId>'); process.exit(1); }
  await hs(`/crm/v3/objects/contacts/${arg}`, { method: 'DELETE' });
  // Verified rather than assumed: a 2xx on the archive call is HubSpot accepting the request.
  let gone = false;
  try {
    await hs(`/crm/v3/objects/contacts/${arg}`);
  } catch (e) {
    gone = e.status === 404;
  }
  console.log(gone ? `deleted ${arg} — verified gone (GET returns 404)` : `DELETE returned 2xx but ${arg} is still readable. Check the portal.`);
  process.exit(gone ? 0 : 3);
}

if (action !== 'seed') {
  console.error('usage: node adapters/hubspot/hs-seed-synthetic.mjs seed|delete [arg]');
  process.exit(1);
}

const samplePath = arg || 'samples/433a.sample.json';
const sample = JSON.parse(readFileSync(samplePath, 'utf8'));
// The repo's convention is that `_synthetic` carries a DESCRIPTION of what makes the fixture
// synthetic, not a bare boolean — the 433-A sample's value names the placeholder ranges it
// uses. Accept either shape, require it to be non-empty, and ECHO it, so the operator sees the
// claim being relied on rather than just the fact that a key was present.
const declaration = typeof sample._synthetic === 'string' ? sample._synthetic.trim() : sample._synthetic;
if (!declaration) {
  console.error(`REFUSING: ${samplePath} does not declare _synthetic. A round-trip probe is never built from a real contact.`);
  process.exit(2);
}
console.log(`source declares synthetic: ${typeof declaration === 'string' ? declaration.slice(0, 160) + (declaration.length > 160 ? '…' : '') : declaration}`);
console.log('');

const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433a.json', 'utf8'));

// `example.com` is RFC 2606 reserved and can never be assigned to anyone, which is the
// property that matters. The `.invalid` TLD is reserved by the same RFC and would be the
// stronger choice, but HubSpot validates the TLD against a public list and rejects it outright
// (INVALID_EMAIL) — so the reserved DOMAIN is the strongest form that survives the API.
const properties = {
  email: 'synthetic-433a-roundtrip@example.com',
  firstname: 'Synthetic',
  lastname: 'Roundtrip Probe 433A',
};

// Mirrors normalize() in fill-433a.mjs. The sample stores some yes/no answers as real JSON
// booleans, and the fill engine reads `false` as "no" — so a seeder that stringifies it to
// "false" and compares against the map's option keys disagrees with the engine about what the
// fixture says. Same class of defect as the two this round trip exists to catch, on the write
// side rather than the read side.
const normalizeOption = (v) => (v === true ? 'yes' : v === false ? 'no' : String(v).trim().toLowerCase());

const written = { scalar: 0, checkboxes: 0, groups: 0 };
const skipped = [];

for (const p of defs.properties) {
  const v = sample[p.key];
  if (v === undefined || v === null || v === '') continue;

  if (p.source.startsWith('groups')) {
    if (!Array.isArray(v)) { skipped.push(`${p.key}: expected array in the sample, got ${typeof v}`); continue; }
    properties[p.hs_name] = JSON.stringify(v);   // parsed back by hs-fetch-433a.mjs
    written.groups++;
    continue;
  }

  if (p.source === 'checkboxes' && p.map_option_by_value) {
    // The sample speaks the MAP's option keys ("yes"). HubSpot stores the provisioned option
    // VALUE ("true"). Invert the recorded table rather than re-deriving the rule.
    const want = normalizeOption(v);
    const toHs = Object.entries(p.map_option_by_value).find(([, mapKey]) => String(mapKey).toLowerCase() === want);
    if (!toHs) { skipped.push(`${p.key}: sample value ${JSON.stringify(v)} is not one of [${Object.values(p.map_option_by_value).join(', ')}]`); continue; }
    properties[p.hs_name] = toHs[0];
    written.checkboxes++;
    continue;
  }

  properties[p.hs_name] = String(v);
  written.scalar++;
}

if (skipped.length) {
  console.log(`skipped ${skipped.length} field(s):`);
  for (const s of skipped) console.log(`  ${s}`);
}

const created = await hs('/crm/v3/objects/contacts', { method: 'POST', body: { properties } });
console.log(`created synthetic contact ${created.id}`);
console.log(`  wrote ${written.scalar} scalar, ${written.checkboxes} checkbox, ${written.groups} group table(s)`);
console.log(`  total 433 properties populated: ${written.scalar + written.checkboxes + written.groups} of ${defs.properties.length}`);
console.log(created.id);
