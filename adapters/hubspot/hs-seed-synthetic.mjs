// Create (or delete) ONE synthetic contact carrying a representative spread of the 433
// backbone, so the round trip can be proven against a live HubSpot record.
//
//   node adapters/hubspot/hs-seed-synthetic.mjs seed <form> [samplePath]
//   node adapters/hubspot/hs-seed-synthetic.mjs seed [samples/433a.sample.json]   (433-A implied)
//   node adapters/hubspot/hs-seed-synthetic.mjs delete <contactId>
//
// SYNTHETIC ONLY. The source record must declare `_synthetic: true` or this refuses to run —
// the VLP no-customer-PII rule means a round-trip probe must never be built by copying a real
// contact, and "I'll remember to use the fixture" is not a control.
//
// The email lands in the reserved `example.com` DOMAIN (RFC 2606). The `.invalid` TLD is the
// stronger choice and HubSpot rejects it outright (INVALID_EMAIL) - see the note by `properties`.
//
// This is deliberately the MIRROR of the form's hs-fetch script: groups serialize to JSON here and
// parse back there, checkbox values translate to HubSpot's option values here and back to the
// map's option keys there. Writing the two against one another is what makes the round trip a
// test rather than a demonstration — a shared misunderstanding would have to be symmetric to
// survive, and the PDF read-back at the end does not share it.

import { readFileSync } from 'fs';
import { hs, stop, isStop } from './hs-lib.mjs';
import { loadBindings } from './bindings.mjs';

const [action, arg] = process.argv.slice(2);

if (action === 'delete') {
  if (!arg) { console.error('usage: ... delete <contactId>'); stop(1); }
  await hs(`/crm/v3/objects/contacts/${arg}`, { method: 'DELETE' });
  // Verified rather than assumed: a 2xx on the archive call is HubSpot accepting the request.
  let gone = false;
  try {
    await hs(`/crm/v3/objects/contacts/${arg}`);
  } catch (e) { if (isStop(e)) throw e;
    gone = e.status === 404;
  }
  console.log(gone ? `deleted ${arg} — verified gone (GET returns 404)` : `DELETE returned 2xx but ${arg} is still readable. Check the portal.`);
  stop(gone ? 0 : 3);
}

if (action !== 'seed') {
  console.error('usage: node adapters/hubspot/hs-seed-synthetic.mjs seed|delete [arg]');
  stop(1);
}

// `seed [form] [samplePath]`. The original call was `seed [samplePath]` with 433-A implied, so
// a first argument that looks like a path is still read that way — the form is only ever
// ambiguous with a path if someone names a form "samples/...".
const looksLikePath = (s) => !!s && (s.includes('/') || s.endsWith('.json'));
const form = looksLikePath(arg) ? '433a' : (arg || '433a');
const samplePath = looksLikePath(arg) ? arg : (process.argv[4] || `samples/${form}.sample.json`);

const sample = JSON.parse(readFileSync(samplePath, 'utf8'));
// The repo's convention is that `_synthetic` carries a DESCRIPTION of what makes the fixture
// synthetic, not a bare boolean — the 433-A sample's value names the placeholder ranges it
// uses. Accept either shape, require it to be non-empty, and ECHO it, so the operator sees the
// claim being relied on rather than just the fact that a key was present.
// THE DECLARATION LIVES IN ONE OF TWO PLACES, AND BOTH ARE READ.
//
// 433-A, 433-A(OIC), 433-B(OIC) and 433-F put `_synthetic` at the TOP level. All five 433-B
// fixtures put it inside `_fixture`, beside the rest of that form's per-fixture prose — which is
// a reasonable place for it and is where that form's generator has always written it.
//
// This file read only the top level, because when it was written no fixture used the other
// shape. It would therefore have REFUSED every 433-B fixture with "does not declare _synthetic"
// about a fixture that declares it in as many words. The failure would have been loud, which is
// the good case; the bad case is the one this comment forecloses — someone reading that message
// and adding a second top-level `_synthetic` to the fixture, leaving two spellings of one claim
// that can later disagree.
//
// BOTH ARE READ, THE SOURCE IS PRINTED, AND CARRYING BOTH IS A STOP. A fixture declaring the
// claim twice is the parallel-list defect, and the right time to refuse it is before it exists.
const topDecl = typeof sample._synthetic === 'string' ? sample._synthetic.trim() : sample._synthetic;
const nestedRaw = sample._fixture?._synthetic;
const nestedDecl = typeof nestedRaw === 'string' ? nestedRaw.trim() : nestedRaw;
if (topDecl && nestedDecl) {
  console.error(`REFUSING: ${samplePath} declares _synthetic BOTH at the top level and inside _fixture. Two spellings of one claim can disagree; keep one.`);
  stop(2);
}
const declaration = topDecl || nestedDecl;
const declaredAt = topDecl ? '_synthetic' : nestedDecl ? '_fixture._synthetic' : null;
if (!declaration) {
  console.error(`REFUSING: ${samplePath} declares _synthetic at neither the top level nor inside _fixture. A round-trip probe is never built from a real contact.`);
  stop(2);
}
console.log(`source declares synthetic (at ${declaredAt}): ${typeof declaration === 'string' ? declaration.slice(0, 160) + (declaration.length > 160 ? '…' : '') : declaration}`);
console.log('');

// One normalized binding list per form: generated from the map for 433-A, crosswalked to the
// backbone for every form after it. See bindings.mjs for why those two cannot be one file, and
// why `kind` is decided there rather than in each caller.
const bindings = loadBindings(form);
console.log(`bindings: ${bindings.length} for ${form} (from ${bindings[0]?.origin})`);

// `example.com` is RFC 2606 reserved and can never be assigned to anyone, which is the
// property that matters. The `.invalid` TLD is reserved by the same RFC and would be the
// stronger choice, but HubSpot validates the TLD against a public list and rejects it outright
// (INVALID_EMAIL) — so the reserved DOMAIN is the strongest form that survives the API.
const properties = {
  // ONE FORM CAN NEED MORE THAN ONE PROBE, AND THE ADDRESS USED TO SAY OTHERWISE.
  //
  // `synthetic-${form}-roundtrip@example.com` is one address per form, and HubSpot treats email
  // as the contact identity: the second seed for a form returns 409 CONFLICT naming the first
  // probe's id. That was invisible for five forms because each is saturated by ONE record.
  // 433-D is not — its subject is a property of the RECORD, so proving the form needs an
  // individual record AND an entity record, and the branch that cannot be seeded is the branch
  // that does not get round-tripped.
  //
  // The discriminator is the FIXTURE, so the address carries the fixture's own basename. Every
  // one still ends in the reserved @example.com domain and still contains "synthetic", which is
  // both halves of the signature hs-preflight.mjs uses to find a probe nobody registered.
  email: `synthetic-${form}-${samplePath.split('/').pop().replace(/\.json$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}@example.com`,
  firstname: 'Synthetic',
  lastname: `Roundtrip Probe ${form.toUpperCase()}`,
};

// Mirrors normalize() in fill-433a.mjs. The sample stores some yes/no answers as real JSON
// booleans, and the fill engine reads `false` as "no" — so a seeder that stringifies it to
// "false" and compares against the map's option keys disagrees with the engine about what the
// fixture says. Same class of defect as the two this round trip exists to catch, on the write
// side rather than the read side.
const normalizeOption = (v) => (v === true ? 'yes' : v === false ? 'no' : String(v).trim().toLowerCase());

const written = { scalar: 0, checkboxes: 0, groups: 0 };
const skipped = [];

for (const p of bindings) {
  // A fixture may name an input by any spelling the FILL ENGINE accepts — the bare `pay_freq`
  // and `household_size` predate the prefix rule and read naturally that way. The canonical
  // key wins; the aliases are the crosswalk's own record of what else the engine answers to,
  // not a guess made here.
  const source = [p.key, ...(p.aliases || [])].find((k) => sample[k] !== undefined && sample[k] !== null && sample[k] !== '');
  if (!source) continue;
  const v = sample[source];

  if (p.kind === 'group') {
    if (!Array.isArray(v)) { skipped.push(`${source}: expected array in the sample, got ${typeof v}`); continue; }
    properties[p.hs_name] = JSON.stringify(v);   // parsed back by the form's hs-fetch script
    written.groups++;
    continue;
  }

  if (p.kind === 'option') {
    // The sample speaks the MAP's option keys ("yes"). HubSpot stores the provisioned option
    // VALUE ("true"). Invert the recorded table rather than re-deriving the rule.
    const want = normalizeOption(v);

    // A LONE TICK CARRIES NO TRANSLATION TABLE, AND UNTIL 433-D NO FORM HAD ONE THE SEEDER COULD SEE.
    //
    // `map_option_by_value` inverts a map `checkboxes.<key>` OPTION INDEX — a table of option
    // key to widget target. A LONE TICK has no index: the map names one target, or a list of
    // targets where the form is mirrored, and the answer is simply whether the box is ticked.
    // So the definition carries `map_option_by_value: null` and there is nothing to invert.
    //
    // This line used to be `Object.entries(p.map_option_by_value)` unguarded, and on 433-D it
    // threw "Cannot convert undefined or null to object" — loudly, which is the good case. It
    // was unreachable before because every option row on the other five forms is an option set:
    // measured, 21 / 42 / 20 / 29 / 4 option rows on 433-A, 433-A(OIC), 433-B, 433-B(OIC) and
    // 433-F, and NOT ONE of them without a table. 433-D has three, and they are exactly the
    // three keys the mirrored-lone-tick key-space fix admitted.
    //
    // The booleans are the check_here spellings the engines already accept in both directions,
    // and a value in neither set is SKIPPED BY NAME rather than written as a string HubSpot
    // would reject or, worse, store.
    if (!p.map_option_by_value) {
      const asBool = want === 'yes' || want === 'true' ? 'true' : want === 'no' || want === 'false' ? 'false' : null;
      if (!asBool) { skipped.push(`${source}: lone-tick value ${JSON.stringify(v)} is neither of [yes, no, true, false]. A lone tick answers whether the box is ticked and nothing else.`); continue; }
      properties[p.hs_name] = asBool;
      written.checkboxes++;
      continue;
    }
    const toHs = Object.entries(p.map_option_by_value).find(([, mapKey]) => String(mapKey).toLowerCase() === want);
    if (!toHs) { skipped.push(`${source}: sample value ${JSON.stringify(v)} is not one of [${Object.values(p.map_option_by_value).join(', ')}]`); continue; }
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
console.log(`  total ${form} bindings populated: ${written.scalar + written.checkboxes + written.groups} of ${bindings.length}`);
console.log(created.id);
