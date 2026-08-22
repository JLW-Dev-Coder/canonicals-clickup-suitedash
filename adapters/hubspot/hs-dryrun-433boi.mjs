// DRY RUN the 433-B(OIC) provisioning against the live portal. Creates nothing, ever.
//
//   node adapters/hubspot/hs-dryrun-433boi.mjs
//   -> adapters/hubspot/433boi.provisioning-dryrun.md
//
// THREE BUCKETS, AND THE MIDDLE ONE IS THE REPORT'S REASON TO EXIST
// -----------------------------------------------------------------
//   EXISTS AND MATCHES   the property is live and its type, fieldType and option VALUE SET are
//                        what this form needs. Nothing to do. Not a decision.
//   EXISTS AND DIFFERS   the property is live and one of those three disagrees. hs-provision
//                        SKIPS an existing property - it creates, it does not patch - so a
//                        divergence is not a thing that gets fixed by running the provisioner
//                        again. It is a DECISION, and this file's job is to put both
//                        definitions side by side so someone can make it.
//   NEW                  not on the portal. This is what gets created, and each one costs a
//                        name that can never be withdrawn.
//
// HEADROOM IS REPORTED BEFORE THE FIRST CREATE AND NOT AFTER THE LAST, and the STOP is BEFORE
// the loop rather than inside it. HubSpot publishes the numeric ceiling only inside the 400 it
// returns from a create that would cross it, so nothing short of crossing it reads the number;
// the arithmetic is stated against the documented 1,000-custom-property ceiling, the same basis
// hs-verify-provision.mjs uses, and the endpoints that might state it outright are probed and
// their answers recorded verbatim - including their 403s and 404s, reported as 403s and 404s.
//
// AND TWO CHECKS THIS FORM NEEDS THAT 433-A(OIC)'s DRY RUN DID NOT
// -----------------------------------------------------------------
//   THE PREFIX IS UNUSED.   Every name here is `irs433boi_`, a prefix this portal has never
//                           seen. If ANY name under it is already live, something created
//                           properties for this form outside this pass, and a dry run that
//                           reported them as "exists and matches" would be reporting agreement
//                           with an object nobody in this repo made.
//   THE TWIN TABLE IS RE-READ FROM THE PORTAL.  33 of these names have a live shared twin
//                           `irs433_<fact>`. The derivation adjudicated each by category; this
//                           re-reads them from the LIVE portal, because "the backbone file says
//                           it exists" and "the portal holds it" are different claims and only
//                           the second one is what a provisioning run collides with.

import { readFileSync, writeFileSync } from 'node:fs';
import { hs } from './hs-lib.mjs';
import { DIVERGENCE_DECISIONS as DECISIONS } from './433boi.divergence-decisions.mjs';

const CEILING = 1000;
const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433boi.json', 'utf8'));
const props = defs.properties;
if (!props.length) { console.error('STOP - fields.433boi.json defines no properties. Re-run derive-names-433boi.mjs --emit.'); process.exit(3); }

const all = (await hs('/crm/v3/properties/contacts')).results || [];
if (all.length < 100) {
  console.error(`STOP - the portal returned ${all.length} contact properties. A portal with 400+ HubSpot-defined properties cannot answer that, so this read failed rather than finding an empty portal. Refusing to report "everything is new".`);
  process.exit(3);
}
const live = new Map(all.map((p) => [p.name, p]));
const custom = all.filter((p) => !p.hubspotDefined);
const liveGroups = new Map(((await hs('/crm/v3/properties/contacts/groups')).results || []).map((g) => [g.name, g]));

// --- the ceiling, probed rather than assumed ---------------------------------------------------
const probes = [];
for (const path of ['/crm/v3/properties/contacts/limits', '/properties/v2/contacts/properties/limits', '/account-info/v3/usage-limits']) {
  try { probes.push(`${path} -> ${JSON.stringify(await hs(path)).slice(0, 300)}`); }
  catch (e) { probes.push(`${path} -> ${e.status}`); }
}
let tier = '(not read)';
try { const a = await hs('/account-info/v3/details'); tier = `portalId ${a.portalId}, tier ${a.accountType}`; } catch (e) { tier = `account-info/v3/details -> ${e.status}`; }

// --- classify ----------------------------------------------------------------------------------
const optVals = (o) => (o || []).map((x) => x.value).sort().join('|');
const matches = [], differs = [], fresh = [], cosmetic = [];
for (const p of props) {
  const l = live.get(p.hs_name);
  if (!l) { fresh.push(p); continue; }
  const d = [];
  if (l.type !== p.type) d.push({ what: 'type', live: l.type, needed: p.type });
  if (l.fieldType !== p.fieldType) d.push({ what: 'fieldType', live: l.fieldType, needed: p.fieldType });
  if (optVals(l.options) !== optVals(p.options)) d.push({ what: 'option values', live: optVals(l.options) || '(none)', needed: optVals(p.options) || '(none)' });
  if (d.length) differs.push({ p, l, d });
  else {
    matches.push({ p, l });
    const c = [];
    if (l.groupName !== p.group) c.push(`group: live "${l.groupName}", this form would have used "${p.group}"`);
    if (l.label !== p.label) c.push(`label: live "${l.label}", this form would have used "${p.label}"`);
    if ((l.description || '') !== p.description) c.push('description differs (live description was written by the form that created it)');
    if (c.length) cosmetic.push({ p, l, c });
  }
}

// --- the prefix, and the twins, read from the LIVE portal ---------------------------------------
const livePrefixed = custom.filter((p) => p.name.startsWith('irs433boi_'));
const twins = [];
for (const p of props) {
  const twin = `irs433_${p.fact}`;
  if (live.has(twin)) twins.push({ p, twin, l: live.get(twin) });
}

const before = custom.length;
const added = fresh.length;
const after = before + added;
const groupsToCreate = defs.groups.filter((g) => !liveGroups.has(g.name));

// --- report ------------------------------------------------------------------------------------
const L = [];
const say = (s = '') => L.push(s);
say('# 433-B(OIC) provisioning dry run');
say('');
say('Nothing was created by this run. Definitions from `adapters/hubspot/fields.433boi.json`, which');
say('`derive-names-433boi.mjs` rebuilds from the crosswalk classification - no name in it was typed.');
say('');
say('## Headroom, before the first create');
say('');
say(`- portal holds **${before}** custom contact properties today (${all.length} total, ${all.length - before} HubSpot-defined)`);
say(`- this pass would add **${added}**`);
say(`- resulting count **${after}**, leaving **${CEILING - after}** against the documented ${CEILING.toLocaleString()}-custom-property ceiling`);
say(`- ${tier}`);
say('');
say('The ceiling is stated, not read. HubSpot publishes the number only inside the 400 returned by a create');
say('that would cross it, so nothing short of crossing it reads it. The endpoints that might state it were probed:');
say('');
for (const p of probes) say(`- \`${p}\``);
say('');
say(after > CEILING ? '**STOP** - this pass would cross the ceiling, and the stop is BEFORE the loop rather than inside it.' : `Under the ceiling by ${CEILING - after}. Proceed.`);
say('');
say('## Property groups');
say('');
for (const g of defs.groups) say(`- \`${g.name}\` (${g.label}) - ${liveGroups.has(g.name) ? 'exists' : '**would be created**'}`);
say('');
say('## Summary');
say('');
say('| bucket | count |');
say('|---|---|');
say(`| exists and matches | ${matches.length} |`);
say(`| exists and DIFFERS | ${differs.length} |`);
say(`| new (would be created) | ${fresh.length} |`);
say(`| **total definitions** | **${props.length}** |`);
say('');
say(`The `.concat('`irs433boi_`', ` prefix is live on **${livePrefixed.length}** propert(ies) today.`));
say('');

say('## Exists and DIFFERS');
say('');
say('An existing property whose type, fieldType or option values disagree with what this form needs is a');
say('DECISION, not an update: `hs-provision.mjs` skips a property that already exists and never patches one,');
say('so running the provisioner will not change any of these and the form will read whatever is live.');
say('');
if (!differs.length) {
  say(`**None**, and on this form that is a consequence rather than a coincidence. A divergence needs a property that already exists; this form reuses none, because the classification's subject ruling gives every one of its ${props.length} facts a form-specific \`irs433boi_\` name. \`adapters/hubspot/433boi.divergence-decisions.mjs\` is empty for the same reason and says so.`);
} else {
  for (const { p, l, d } of differs) {
    say(`### \`${p.hs_name}\`  (input key \`${p.key}\`, crosswalk ${p.entry}, ${p.category})`);
    say('');
    say('| | live definition | what 433-B(OIC) needs |');
    say('|---|---|---|');
    for (const x of d) say(`| ${x.what} | \`${x.live}\` | \`${x.needed}\` |`);
    say(`| label | ${l.label} | ${p.label} |`);
    say(`| group | ${l.groupName} | ${p.group} |`);
    say('');
    say(`Live description: ${l.description || '_(none)_'}`);
    say('');
    say(`Would be: ${p.description}`);
    say('');
    const dec = DECISIONS[p.hs_name];
    if (!dec) say('**NO RECORDED DECISION.** This is a STOP: see the run output.');
    else {
      say(`**Decision:** ${dec.decision}`);
      say('');
      say(dec.why);
      say('');
      say(`_What happens to a taxpayer whose stored value this form cannot print:_ ${dec.what_happens_to_a_value_this_form_cannot_print}`);
      say('');
    }
  }
}
say('');

say('## The live twins, re-read from the portal');
say('');
say('Every derived name whose shared twin `irs433_<fact>` is LIVE ON THE PORTAL RIGHT NOW. The derivation');
say('adjudicated each of these by category against the per-form definition files; this list is read from the');
say('portal instead, because "the backbone file names it" and "the portal holds it" are different claims and');
say('only the second is what a provisioning run collides with. None of them is a collision: the names this pass');
say('would create carry the `irs433boi_` prefix and the twins carry `irs433_`, so no create touches one.');
say('');
say(`${twins.length} of the ${props.length} facts have a live shared twin.`);
say('');
say('| input key | entry | category | would create | live twin | twin type |');
say('|---|---|---|---|---|---|');
for (const t of twins) say(`| \`${t.p.key}\` | ${t.p.entry} | ${t.p.category} | \`${t.p.hs_name}\` | \`${t.twin}\` | ${t.l.type}/${t.l.fieldType} |`);
say('');

say('## New - would be created');
say('');
say(`${fresh.length} properties, ${fresh.filter((p) => p.scope === 'shared').length} shared and ${fresh.filter((p) => p.scope !== 'shared').length} form-specific.`);
say('');
say('| derived name | input key | entry | category | scope | type/fieldType |');
say('|---|---|---|---|---|---|');
for (const p of fresh) say(`| \`${p.hs_name}\` | \`${p.key}\` | ${p.entry} | ${p.category} | ${p.scope} | ${p.type}/${p.fieldType} |`);
say('');

say('## Exists and matches');
say('');
say(`${matches.length} properties this form reuses without creating anything.`);
say('');
if (!matches.length) say('None.');
else {
  say('| derived name | input key | entry | category |');
  say('|---|---|---|---|');
  for (const { p } of matches) say(`| \`${p.hs_name}\` | \`${p.key}\` | ${p.entry} | ${p.category} |`);
}
say('');

say('## Cosmetic differences on reused properties');
say('');
if (!cosmetic.length) say(`None - there are ${matches.length} reused properties.`);
else {
  say('| property | difference |');
  say('|---|---|');
  for (const { p, c } of cosmetic) say(`| \`${p.hs_name}\` | ${c.join('; ')} |`);
}
say('');

writeFileSync('adapters/hubspot/433boi.provisioning-dryrun.md', L.join('\n') + '\n');
console.log('433-B(OIC) dry run - NOTHING CREATED.');
console.log(`  exists and matches ${matches.length}, exists and DIFFERS ${differs.length}, new ${fresh.length}, total ${props.length}`);
console.log(`  groups to create: ${groupsToCreate.length ? groupsToCreate.map((g) => g.name).join(', ') : 'none'}`);
console.log(`  irs433boi_ properties live on the portal today: ${livePrefixed.length}`);
console.log(`  live shared twins re-read from the portal: ${twins.length}`);
console.log(`  HEADROOM  before ${before}  added ${added}  after ${after}  left ${CEILING - after} (ceiling ${CEILING})`);
console.log('  report -> adapters/hubspot/433boi.provisioning-dryrun.md');

const stops = [];
if (after > CEILING) stops.push(`this pass would take the portal to ${after} custom properties, past the ${CEILING} ceiling. Stopping BEFORE the first create rather than partway through the loop.`);
// THE PREFIX CHECK. A name under this form's prefix that this pass did not put there was made
// by something outside it, and reporting it as "exists and matches" would be agreement with an
// object nobody in this repo created.
for (const p of livePrefixed) {
  if (!props.some((d) => d.hs_name === p.name)) stops.push(`"${p.name}" is live under this form's irs433boi_ prefix and fields.433boi.json defines no property of that name. Something created it outside this pass; a dry run cannot say what it is for.`);
}
const undecided = differs.filter(({ p }) => !DECISIONS[p.hs_name]);
for (const { p, d } of undecided) stops.push(`"${p.hs_name}" exists and differs on ${d.map((x) => x.what).join(', ')}, and no decision is recorded for it. hs-provision.mjs would silently skip it, which is indistinguishable from having decided to keep the live definition.`);
const stale = Object.keys(DECISIONS).filter((n) => !differs.some(({ p }) => p.hs_name === n));
for (const n of stale) stops.push(`a decision is recorded for "${n}", which no longer differs from what this form needs. A decision about a divergence that has gone away is a decision nobody will re-read; remove it or find out what changed.`);
if (stops.length) {
  console.error(`\nSTOP - ${stops.length} unresolved item(s):`);
  for (const s of stops) console.error('  ' + s);
  process.exit(3);
}
console.log(`  every divergence has a recorded decision (${Object.keys(DECISIONS).length} recorded, ${differs.length} divergence(s) found).`);
