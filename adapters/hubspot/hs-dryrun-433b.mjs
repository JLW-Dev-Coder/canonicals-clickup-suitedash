// DRY RUN the 433-B provisioning against the live portal. Creates nothing, ever.
//
//   node adapters/hubspot/hs-dryrun-433b.mjs
//   -> adapters/hubspot/433b.provisioning-dryrun.md
//
// FOUR BUCKETS ON THIS FORM, WHERE EVERY PREDECESSOR HAD THREE
// -------------------------------------------------------------
//   REUSE — EXISTS      the row is classified `exact`, binds a property 433-B(OIC) created, and
//                       that property IS live. This is the bucket no form before 433-B had, and
//                       an entry that is MISSING from it is a STOP: a reuse naming a property
//                       nobody created would be a creation under the predecessor's prefix,
//                       recording the wrong form as its creator permanently.
//   EXISTS AND MATCHES  live, and its type, fieldType and option VALUE SET are what this form
//                       needs, without this form claiming a reuse. Nothing to do.
//   EXISTS AND DIFFERS  live and one of those three disagrees. hs-provision SKIPS an existing
//                       property — it creates, it does not patch — so a divergence is not fixed
//                       by running the provisioner again. It is a DECISION.
//   NEW                 not on the portal. This is what gets created, and each one costs a name
//                       that can never be withdrawn.
//
// HEADROOM IS REPORTED BEFORE THE FIRST CREATE AND NOT AFTER THE LAST, and the STOP is BEFORE
// the loop rather than inside it. HubSpot publishes the numeric ceiling only inside the 400 it
// returns from a create that would cross it, so nothing short of crossing it reads the number;
// the arithmetic is stated against the documented 1,000-custom-property ceiling and the endpoints
// that might state it outright are probed and their answers recorded verbatim.
//
// AND THE REUSES' DESCRIPTIONS ARE A REPORTED DIFFERENCE, NOT A SILENT ONE
// ------------------------------------------------------------------------
// The nine reused properties were created by the 433-B(OIC) pass, so their LIVE descriptions name
// that form alone. Prompt-50 ruling 1 requires each reused property's description to name BOTH
// forms it serves. hs-provision.mjs cannot do it — it never patches — so this run reports the
// difference per property and names the tool that closes it. Reporting it as "cosmetic" and
// stopping there would be the sentence-softening the boundary register exists to refuse: it is
// cosmetic as far as READING A VALUE BACK goes, and it is the whole of a standing ruling as far
// as a person looking at the portal goes.

import { readFileSync, writeFileSync } from 'node:fs';
import { hs } from './hs-lib.mjs';
import { DIVERGENCE_DECISIONS as DECISIONS } from './433b.divergence-decisions.mjs';

const CEILING = 1000;
const CREATE_PREFIX = 'irs433b_';
const REUSE_PREFIX = 'irs433boi_';

const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433b.json', 'utf8'));
const props = defs.properties;
if (!props.length) { console.error('STOP - fields.433b.json defines no properties. Re-run derive-names-433b.mjs --portal --emit.'); process.exit(3); }

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
const stops = [];
const reuseOk = [], reuseMissing = [], matches = [], differs = [], fresh = [], cosmetic = [], reuseDescr = [];
for (const p of props) {
  const l = live.get(p.hs_name);
  const isReuse = p.scope === 'reuse';

  if (isReuse && !l) {
    // THE STOP THIS BUCKET EXISTS FOR.
    reuseMissing.push(p);
    stops.push(`REUSE NAMES A PROPERTY THAT IS NOT LIVE — "${p.key}" reuses "${p.hs_name}" and the portal does not hold it. `
      + `A reuse must bind something that exists; provisioning this would CREATE it under the ${REUSE_PREFIX} prefix and record 433-B(OIC) as its creator forever.`);
    continue;
  }
  if (!l) { fresh.push(p); continue; }

  const d = [];
  if (l.type !== p.type) d.push({ what: 'type', live: l.type, needed: p.type });
  if (l.fieldType !== p.fieldType) d.push({ what: 'fieldType', live: l.fieldType, needed: p.fieldType });
  if (optVals(l.options) !== optVals(p.options)) d.push({ what: 'option values', live: optVals(l.options) || '(none)', needed: optVals(p.options) || '(none)' });

  if (d.length) { differs.push({ p, l, d }); continue; }

  if (isReuse) reuseOk.push({ p, l }); else matches.push({ p, l });

  const c = [];
  if (l.groupName !== p.group) c.push(`group: live "${l.groupName}", this form would have used "${p.group}"`);
  if (l.label !== p.label) c.push(`label: live "${l.label}", this form would have used "${p.label}"`);
  if ((l.description || '') !== p.description) {
    c.push('description differs');
    if (isReuse) reuseDescr.push({ p, l });
  }
  if (c.length) cosmetic.push({ p, l, c, isReuse });
}

// A DIVERGENCE WITH NO RECORDED DECISION IS A STOP, not a table row.
for (const { p } of differs) if (!DECISIONS[p.hs_name]) stops.push(`UNDECIDED DIVERGENCE — "${p.hs_name}" (input key "${p.key}") is live and disagrees with what this form needs, and adapters/hubspot/433b.divergence-decisions.mjs records no decision for it.`);

// --- the CREATE prefix must be unused, read from the LIVE portal --------------------------------
// If ANY irs433b_ name is already live, something created properties for this form outside this
// pass, and a dry run reporting them as "exists and matches" would be reporting agreement with an
// object nobody in this repo made.
// THE QUESTION IS "IS ANY NAME UNDER OUR PREFIX ONE WE DID NOT DECLARE", NOT "IS THE PREFIX
// USED AT ALL", AND THE FIRST DRAFT ASKED THE SECOND.
//
// Before the first create the two questions have the same answer, and 433-B(OIC)'s dry run — the
// file this one was written from — only ever ran before its creates. So this STOPped on every
// run AFTER the provisioning pass it exists to precede, naming all 107 properties it had just
// correctly created. A guard tuned to fire constantly gets turned off ([R-10]), and this one
// would have been, one run after it started being useful.
//
// What it should catch is unchanged and is now stated precisely: a live name under this form's
// prefix that this form's definitions do NOT declare means something outside this pass created
// properties for this form. A PARTIAL run is also still caught — some but not all declared names
// live is reported by name, because that is the state an interrupted create loop leaves.
const declaredNames = new Set(props.map((p) => p.hs_name));
const livePrefixed = custom.filter((p) => p.name.startsWith(CREATE_PREFIX));
const undeclaredLive = livePrefixed.filter((p) => !declaredNames.has(p.name));
const declaredCreates = props.filter((p) => p.scope !== 'reuse');
const declaredLive = declaredCreates.filter((p) => live.has(p.hs_name));

if (undeclaredLive.length) stops.push(`${undeclaredLive.length} live propert(ies) carry this form's ${CREATE_PREFIX} prefix and are NOT declared by fields.433b.json: ${undeclaredLive.map((p) => p.name).join(', ')}. `
  + 'Something outside this pass created properties for this form, and a dry run reporting them as "exists and matches" would be reporting agreement with an object nobody in this repo made.');
else if (declaredLive.length && declaredLive.length < declaredCreates.length) stops.push(`PARTIAL PROVISIONING — ${declaredLive.length} of this form's ${declaredCreates.length} declared names are live and ${declaredCreates.length - declaredLive.length} are not. `
  + 'That is the state an interrupted create loop leaves: some names permanent and the rest not. Missing: '
  + declaredCreates.filter((p) => !live.has(p.hs_name)).map((p) => p.hs_name).join(', '));

const provisioningState = declaredLive.length === 0 ? 'BEFORE the first create — no declared name is live'
  : declaredLive.length === declaredCreates.length ? 'AFTER a complete pass — every declared name is live'
    : `PARTIAL — ${declaredLive.length} of ${declaredCreates.length} declared names live`;

// AND THE PREFIX TEST IS ASSERTED, because irs433boi_ names all start with "irs433b" and only the
// underscore separates the two prefixes. A test written without it would count all 113 of
// 433-B(OIC)'s properties as this form's and report a STOP on every run.
if (custom.some((p) => p.name.startsWith(REUSE_PREFIX) && p.name.startsWith(CREATE_PREFIX)))
  stops.push(`PREFIX TEST BROKEN — a live ${REUSE_PREFIX} name is matching ${CREATE_PREFIX}. The underscore is what separates them and this run's prefix test is not using it.`);

// --- the twins, read from the LIVE portal ------------------------------------------------------
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
say('# 433-B provisioning dry run');
say('');
say('Nothing was created by this run. Produced by `node adapters/hubspot/hs-dryrun-433b.mjs`.');
say('Definitions from `adapters/hubspot/fields.433b.json`, which `derive-names-433b.mjs` rebuilds from the');
say('crosswalk classification — no name in it was typed.');
say('');
say('## Headroom, before the first create');
say('');
say(`- portal holds **${before}** custom contact properties today (${all.length} total, ${all.length - before} HubSpot-defined)`);
say(`- this pass would add **${added}**`);
say(`- resulting count **${after}**, leaving **${CEILING - after}** against the documented ${CEILING.toLocaleString()}-custom-property ceiling`);
say(`- ${tier}`);
say('');
say(`**The ${added} to be added is not the ${props.length} definitions.** ${reuseOk.length + reuseMissing.length} of them are REUSES that bind properties`);
say('433-B(OIC) already created, and a reuse costs no headroom. That distinction is the whole of this form\'s');
say('difference from its predecessors, and stating the definition count as the create count would overstate');
say(`the cost of this pass by ${reuseOk.length + reuseMissing.length}.`);
say('');
say('The ceiling is stated, not read. HubSpot publishes the number only inside the 400 returned by a create');
say('that would cross it, so nothing short of crossing it reads it. The endpoints that might state it were probed:');
say('');
for (const p of probes) say(`- \`${p}\``);
say('');
say(after > CEILING
  ? `**STOP** — ${before} + ${added} = ${after}, which is ${after - CEILING} past the ${CEILING.toLocaleString()} ceiling. The stop is BEFORE the loop rather than inside it: a create loop that runs out of ceiling partway through leaves some names permanent and the rest not, and there is no way back from that.`
  : `Under the ceiling by ${CEILING - after}: ${before} + ${added} = ${after}. Proceed.`);
say('');
say('## Property groups');
say('');
for (const g of defs.groups) say(`- \`${g.name}\` (${g.label}) — ${liveGroups.has(g.name) ? 'exists' : '**would be created**'}`);
say('');
say('## Summary');
say('');
say('| bucket | count |');
say('|---|---|');
say(`| REUSE — exists, binds a 433-B(OIC) property | ${reuseOk.length} |`);
say(`| REUSE — **NOT LIVE (STOP)** | ${reuseMissing.length} |`);
say(`| exists and matches (not claimed as a reuse) | ${matches.length} |`);
say(`| exists and DIFFERS | ${differs.length} |`);
say(`| new (would be created) | ${fresh.length} |`);
say(`| **total definitions** | **${props.length}** |`);
say('');
say(`The \`${CREATE_PREFIX}\` prefix is live on **${livePrefixed.length}** propert(ies) today, **${undeclaredLive.length}** of them NOT declared by this form; the \`${REUSE_PREFIX}\` prefix on **${custom.filter((p) => p.name.startsWith(REUSE_PREFIX)).length}**.`);
say('');
say(`**Provisioning state, read from the portal: ${provisioningState}.**`);
say('');
say('This run is a NO-OP precisely when that line says AFTER a complete pass — which is what makes running it again');
say('after provisioning a proof rather than a formality. The state is READ rather than assumed: the first draft of');
say('this file assumed it was always running BEFORE the creates and STOPped on every run after them, naming all 107');
say('properties it had just correctly made. A guard tuned to fire constantly gets turned off ([R-10]). What it');
say('actually needed to ask is whether any live name under this form\'s prefix is one this form does not declare,');
say('and that question has the same answer before the creates and a useful one after.');
say('');

say('## REUSE — the nine, re-read from the portal');
say('');
say('The first reuse bucket in this series. Each row is classified `exact` in the crosswalk classification and');
say('binds a property `irs433boi_` records 433-B(OIC) as having created, per [R-06]. **A reuse that is not live');
say('is a STOP**, because provisioning it would create the name under the predecessor\'s prefix and attribute it');
say('to the form that did not make it, permanently.');
say('');
if (reuseMissing.length) {
  say('**STOP — these reuses name properties the portal does not hold:**');
  for (const p of reuseMissing) say(`- \`${p.hs_name}\` (input key \`${p.key}\`, crosswalk ${p.entry})`);
  say('');
}
say('| input key | entry | binds | live type | this form needs | agrees |');
say('|---|---|---|---|---|---|');
for (const { p, l } of reuseOk) say(`| \`${p.key}\` | ${p.entry} | \`${p.hs_name}\` | ${l.type}/${l.fieldType} | ${p.type}/${p.fieldType} | ${l.type === p.type && l.fieldType === p.fieldType ? 'yes' : '**no**'} |`);
say('');

say('## The reused properties\' descriptions, and the standing ruling on them');
say('');
say('Ruling 1 requires each reused property\'s description to name **both** forms it serves. These nine were');
say('created by the 433-B(OIC) pass, so their live descriptions name that form alone — "at create time" for');
say('these properties was a previous cycle. `hs-provision.mjs` cannot close it: it creates and never patches,');
say('and teaching it to patch would change what the provisioner is ([R-12]).');
say('');
if (!reuseDescr.length) say(`**None** — all ${reuseOk.length} reused properties already carry a description naming both forms.`);
else {
  say(`${reuseDescr.length} of ${reuseOk.length} reused properties carry a live description that does not name 433-B. Closed by`);
  say('`adapters/hubspot/hs-describe-reused-433b.mjs`, which patches **descriptions and nothing else** and reads');
  say('each one back from the portal on a separate request.');
  say('');
  say('| property | live description (names one form) | would become (names both) |');
  say('|---|---|---|');
  for (const { p, l } of reuseDescr) say(`| \`${p.hs_name}\` | ${(l.description || '_(none)_').replace(/\|/g, '\\|')} | ${p.description.replace(/\|/g, '\\|')} |`);
}
say('');

say('## Exists and DIFFERS');
say('');
say('An existing property whose type, fieldType or option values disagree with what this form needs is a');
say('DECISION, not an update: `hs-provision.mjs` skips a property that already exists and never patches one,');
say('so running the provisioner will not change any of these and the form will read whatever is live.');
say('');
if (!differs.length) {
  say('**None**, and on this form that is a consequence rather than a coincidence — of two things, and both are');
  say('checked rather than assumed. The 107 names this form CREATES carry a prefix this portal has never seen,');
  say('re-read above as live on ' + livePrefixed.length + ' properties, and nothing can diverge from a property that does not exist.');
  say('The 9 it REUSES all exist, and `derive-names-433b.mjs` A9R asserts each one\'s live type and fieldType');
  say('against its crosswalk row — so a type divergence on a reuse takes the DERIVATION down, two steps before');
  say('this run. `adapters/hubspot/433b.divergence-decisions.mjs` is empty and says exactly that.');
} else {
  for (const { p, l, d } of differs) {
    say(`### \`${p.hs_name}\`  (input key \`${p.key}\`, crosswalk ${p.entry}, ${p.category})`);
    say('');
    say('| | live definition | what 433-B needs |');
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
    }
    say('');
  }
}
say('');

say('## The live twins, re-read from the portal');
say('');
say('Every derived name whose shared twin `irs433_<fact>` is LIVE ON THE PORTAL RIGHT NOW. The derivation');
say('adjudicated each of these by category; this list is read from the portal instead, because "the backbone');
say('file names it" and "the portal holds it" are different claims and only the second is what a provisioning');
say('run collides with. None is a collision: the names this pass creates carry `irs433b_` and the twins carry');
say('`irs433_`, so no create touches one.');
say('');
say(`${twins.length} of the ${props.length} facts have a live shared twin.`);
say('');
say('| input key | entry | category | this pass | live twin | twin type |');
say('|---|---|---|---|---|---|');
for (const t of twins) say(`| \`${t.p.key}\` | ${t.p.entry} | ${t.p.category} | \`${t.p.hs_name}\`${t.p.scope === 'reuse' ? ' _(reuse)_' : ''} | \`${t.twin}\` | ${t.l.type}/${t.l.fieldType} |`);
say('');

say('## New — would be created');
say('');
say(`${fresh.length} properties, all form-specific under \`${CREATE_PREFIX}\`.`);
say('');
say('| derived name | input key | entry | category | type/fieldType |');
say('|---|---|---|---|---|');
for (const p of fresh) say(`| \`${p.hs_name}\` | \`${p.key}\` | ${p.entry} | ${p.category} | ${p.type}/${p.fieldType} |`);
say('');

say('## Exists and matches, without this form claiming a reuse');
say('');
if (!matches.length) say('**None.** Every live property this form binds is a declared reuse, which is what the classification says: nine `exact` rows and no others.');
else {
  say(`${matches.length} propert(ies).`);
  say('');
  say('| derived name | input key | entry | category |');
  say('|---|---|---|---|');
  for (const { p } of matches) say(`| \`${p.hs_name}\` | \`${p.key}\` | ${p.entry} | ${p.category} |`);
}
say('');

say('## Cosmetic differences');
say('');
if (!cosmetic.length) say('None.');
else {
  say('| property | reuse | difference |');
  say('|---|---|---|');
  for (const { p, c, isReuse } of cosmetic) say(`| \`${p.hs_name}\` | ${isReuse ? 'yes' : 'no'} | ${c.join('; ')} |`);
}
say('');

writeFileSync('adapters/hubspot/433b.provisioning-dryrun.md', L.join('\n') + '\n');
console.log('433-B dry run - NOTHING CREATED.');
console.log(`  REUSE exists ${reuseOk.length}, REUSE NOT LIVE ${reuseMissing.length}, matches ${matches.length}, DIFFERS ${differs.length}, new ${fresh.length}, total ${props.length}`);
console.log(`  groups to create: ${groupsToCreate.length ? groupsToCreate.map((g) => g.name).join(', ') : 'none'}`);
console.log(`  ${CREATE_PREFIX} live on the portal today: ${livePrefixed.length}; ${REUSE_PREFIX} live: ${custom.filter((p) => p.name.startsWith(REUSE_PREFIX)).length}`);
console.log(`  live shared twins re-read from the portal: ${twins.length}`);
console.log(`  reused properties whose live description names one form only: ${reuseDescr.length}`);
console.log(`  HEADROOM  before ${before}  added ${added}  after ${after}  left ${CEILING - after} (ceiling ${CEILING})`);
console.log('  report -> adapters/hubspot/433b.provisioning-dryrun.md');
if (stops.length) {
  console.error(`\nSTOP - ${stops.length} condition(s):`);
  for (const s of stops) console.error('  ' + s);
  process.exitCode = 3;
}
