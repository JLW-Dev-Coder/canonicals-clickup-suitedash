// DRY RUN the 433-D provisioning against the live portal. Creates nothing, ever.
//
//   node adapters/hubspot/hs-dryrun-433d.mjs
//   -> adapters/hubspot/433d.provisioning-dryrun.md
//
// FOUR BUCKETS, AND ON THIS FORM THE REUSE BUCKET HAS TWO CREATORS
// ----------------------------------------------------------------
//   REUSE — EXISTS      the row is classified `exact`, binds a property an EARLIER form created,
//                       and that property IS live. 433-B was the first form with this bucket and
//                       drew all nine of its reuses from one predecessor, so it could carry the
//                       predecessor's prefix in a constant. 433-D cannot: two of its three
//                       reuses are 433-A's `irs433_` and the third is 433-B(OIC)'s
//                       `irs433boi_`. The prefixes are DERIVED from the rows' own `reuse_of`
//                       here, and a reuse prefix with no live member is a STOP rather than a
//                       create wearing another form's attribution.
//   EXISTS AND MATCHES  live, and its type, fieldType and option VALUE SET are what this form
//                       needs, without this form claiming a reuse. Nothing to do.
//   EXISTS AND DIFFERS  live and one of those three disagrees. hs-provision SKIPS an existing
//                       property — it creates, it does not patch — so a divergence is not fixed
//                       by running the provisioner again. It is a DECISION.
//   NEW                 not on the portal. This is what gets created, and each one costs a name
//                       that can never be withdrawn.
//
// HEADROOM IS REPORTED BEFORE THE FIRST CREATE AND NOT AFTER THE LAST, and the STOP is BEFORE
// the loop rather than inside it — [R-32]. HubSpot publishes the numeric ceiling only inside the
// 400 it returns from a create that would cross it, so nothing short of crossing it reads the
// number; the arithmetic is stated against the documented 1,000-custom-property ceiling and the
// endpoints that might state it outright are probed and their answers recorded verbatim.
//
// THE PREFIX TEST IS ASSERTED IN BOTH DIRECTIONS, BECAUSE THIS FORM HAS THE WORST CASE IN THE
// SERIES FOR IT. Every prefix here begins `irs433`: this form creates `irs433d_`, reuses
// `irs433_` and `irs433boi_`, and its siblings hold `irs433b_` and `irs433aoi_`. Only the
// character at index 6 separates them. A test written as startsWith('irs433') would count all
// 884 custom properties as this form's; one written as startsWith('irs433d') without the
// separator would be right today and wrong the day a name like `irs433dd_` exists. So the
// separator is part of every prefix constant here and the disjointness is PROVED against the
// live portal on every run rather than reasoned about in this comment.

import { readFileSync, writeFileSync } from 'node:fs';
import { hs, stop, isStop } from './hs-lib.mjs';
import { DIVERGENCE_DECISIONS as DECISIONS } from './433d.divergence-decisions.mjs';

const CEILING = 1000;
const CREATE_PREFIX = 'irs433d_';

const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433d.json', 'utf8'));
const props = defs.properties;
if (!props.length) { console.error('STOP - fields.433d.json defines no properties. Re-run derive-names-433d.mjs --portal --emit.'); stop(3); }

// THE REUSE PREFIXES ARE DERIVED FROM THE ROWS, NEVER TYPED. [R-07]: a figure without its
// universe is not a figure, and the universe here is "the prefixes this form's own reuse rows
// name". A constant would have made this form's second creator invisible.
const PREFIX_RE = /^(irs433[a-z]*_)/;
if (PREFIX_RE.source.indexOf('\\') !== -1 || !PREFIX_RE.test('irs433boi_x') || !PREFIX_RE.test('irs433_x') || PREFIX_RE.test('irs433x')) {
  console.error('STOP - the prefix reader does not read. It must accept irs433_ and irs433boi_ and refuse a name with no separator, and it does not, so every prefix derived below would be derived by something that cannot read a prefix ([R-17]).');
  stop(3);
}
const reuseRows = props.filter((p) => p.scope === 'reuse');
const reusePrefixes = [...new Set(reuseRows.map((p) => (String(p.hs_name).match(PREFIX_RE) || [])[1]).filter(Boolean))].sort();
const creatingForms = new Set(reuseRows.map((p) => p.created_by_form));
if (reuseRows.length && reusePrefixes.length !== creatingForms.size) {
  console.error(`STOP - ${reuseRows.length} reuse row(s) name ${reusePrefixes.length} distinct prefix(es) but ${creatingForms.size} distinct creating form(s). One prefix per creator is what makes a prefix readable as an attribution at all.`);
  stop(3);
}

const all = (await hs('/crm/v3/properties/contacts')).results || [];
if (all.length < 100) {
  console.error(`STOP - the portal returned ${all.length} contact properties. A portal with 400+ HubSpot-defined properties cannot answer that, so this read failed rather than finding an empty portal. Refusing to report "everything is new".`);
  stop(3);
}
const live = new Map(all.map((p) => [p.name, p]));
const custom = all.filter((p) => !p.hubspotDefined);
const liveGroups = new Map(((await hs('/crm/v3/properties/contacts/groups')).results || []).map((g) => [g.name, g]));

// --- the ceiling, probed rather than assumed ---------------------------------------------------
const probes = [];
for (const path of ['/crm/v3/properties/contacts/limits', '/properties/v2/contacts/properties/limits', '/account-info/v3/usage-limits']) {
  try { probes.push(`${path} -> ${JSON.stringify(await hs(path)).slice(0, 300)}`); }
  catch (e) { if (isStop(e)) throw e; probes.push(`${path} -> ${e.status}`); }
}
let tier = '(not read)';
try { const a = await hs('/account-info/v3/details'); tier = `portalId ${a.portalId}, tier ${a.accountType}`; } catch (e) { if (isStop(e)) throw e; tier = `account-info/v3/details -> ${e.status}`; }

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
      + `A reuse must bind something that exists; provisioning this would CREATE it under ${p.created_by_form}'s prefix and record that form as its creator forever.`);
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
for (const { p } of differs) if (!DECISIONS[p.hs_name]) stops.push(`UNDECIDED DIVERGENCE — "${p.hs_name}" (input key "${p.key}") is live and disagrees with what this form needs, and adapters/hubspot/433d.divergence-decisions.mjs records no decision for it.`);

// --- the CREATE prefix, read from the LIVE portal ----------------------------------------------
// THE QUESTION IS "IS ANY NAME UNDER OUR PREFIX ONE WE DID NOT DECLARE", NOT "IS THE PREFIX USED
// AT ALL". The second question has the same answer as the first only before the creates, and a
// guard that STOPs on every run after the pass it precedes gets turned off ([R-10]) — which is
// the defect 433-B's dry run committed and repaired, inherited here already repaired.
const declaredNames = new Set(props.map((p) => p.hs_name));
const livePrefixed = custom.filter((p) => p.name.startsWith(CREATE_PREFIX));
const undeclaredLive = livePrefixed.filter((p) => !declaredNames.has(p.name));
const declaredCreates = props.filter((p) => p.scope !== 'reuse');
const declaredLive = declaredCreates.filter((p) => live.has(p.hs_name));

if (undeclaredLive.length) stops.push(`${undeclaredLive.length} live propert(ies) carry this form's ${CREATE_PREFIX} prefix and are NOT declared by fields.433d.json: ${undeclaredLive.map((p) => p.name).join(', ')}. `
  + 'Something outside this pass created properties for this form, and a dry run reporting them as "exists and matches" would be reporting agreement with an object nobody in this repo made.');
else if (declaredLive.length && declaredLive.length < declaredCreates.length) stops.push(`PARTIAL PROVISIONING — ${declaredLive.length} of this form's ${declaredCreates.length} declared names are live and ${declaredCreates.length - declaredLive.length} are not. `
  + 'That is the state an interrupted create loop leaves: some names permanent and the rest not. Missing: '
  + declaredCreates.filter((p) => !live.has(p.hs_name)).map((p) => p.hs_name).join(', '));

const provisioningState = declaredLive.length === 0 ? 'BEFORE the first create — no declared name is live'
  : declaredLive.length === declaredCreates.length ? 'AFTER a complete pass — every declared name is live'
    : `PARTIAL — ${declaredLive.length} of ${declaredCreates.length} declared names live`;

// --- prefix disjointness, PROVED against the live portal ---------------------------------------
const allPrefixes = [CREATE_PREFIX, ...reusePrefixes];
const prefixCounts = allPrefixes.map((pre) => ({ pre, n: custom.filter((p) => p.name.startsWith(pre)).length }));
for (const a of allPrefixes) for (const b of allPrefixes) {
  if (a === b) continue;
  const both = custom.filter((p) => p.name.startsWith(a) && p.name.startsWith(b));
  if (both.length) stops.push(`PREFIX TEST BROKEN — ${both.length} live name(s) match BOTH "${a}" and "${b}": ${both.slice(0, 5).map((p) => p.name).join(', ')}. The separator is what divides these prefixes and this run's test is not using it.`);
}
for (const { pre, n } of prefixCounts) {
  if (pre !== CREATE_PREFIX && n === 0) stops.push(`REUSE PREFIX "${pre}" HAS NO LIVE MEMBERS. This form's reuse rows name it as an earlier form's prefix; a prefix with nothing under it is not an earlier form's prefix, and every reuse resting on it is a create wearing another form's attribution.`);
}

// --- the twins, read from the LIVE portal ------------------------------------------------------
const twins = [];
for (const p of props) {
  const twin = `irs433_${p.fact}`;
  if (twin !== p.hs_name && live.has(twin)) twins.push({ p, twin, l: live.get(twin) });
}

const before = custom.length;
const added = fresh.length;
const after = before + added;
const groupsToCreate = defs.groups.filter((g) => !liveGroups.has(g.name));

// --- report ------------------------------------------------------------------------------------
const L = [];
const say = (s = '') => L.push(s);
const bar = (s) => String(s).split('|').join('\\|');
say('# 433-D provisioning dry run');
say('');
say('Nothing was created by this run. Produced by `node adapters/hubspot/hs-dryrun-433d.mjs`.');
say('Definitions from `adapters/hubspot/fields.433d.json`, which `derive-names-433d.mjs` rebuilds from the');
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
say(`earlier forms already created — under ${reusePrefixes.join(' and ')} — and a reuse costs no headroom. Stating the`);
say(`definition count as the create count would overstate the cost of this pass by ${reuseOk.length + reuseMissing.length}.`);
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
say(`| REUSE — exists, binds an earlier form's property | ${reuseOk.length} |`);
say(`| REUSE — **NOT LIVE (STOP)** | ${reuseMissing.length} |`);
say(`| exists and matches (not claimed as a reuse) | ${matches.length} |`);
say(`| exists and DIFFERS | ${differs.length} |`);
say(`| new (would be created) | ${fresh.length} |`);
say(`| **total definitions** | **${props.length}** |`);
say('');
say('### The prefixes, counted on the live portal and proved disjoint');
say('');
say('| prefix | role | live custom properties |');
say('|---|---|---|');
for (const { pre, n } of prefixCounts) say(`| \`${pre}\` | ${pre === CREATE_PREFIX ? 'this form creates under it' : 'this form reuses from it'} | ${n} |`);
say('');
say(`Disjointness is asserted from the portal in both directions across all ${allPrefixes.length} prefixes: no live name may match two of them.`);
say('Every prefix in this series begins `irs433` and only the character at index 6 separates them, so the separator');
say('is part of each constant and the test is proved rather than reasoned about. The reuse prefixes are DERIVED');
say('from the rows\' own `reuse_of`, never typed — a constant would have made this form\'s second creator invisible.');
say('');
say(`**Provisioning state, read from the portal: ${provisioningState}.**`);
say('');
say('This run is a NO-OP precisely when that line says AFTER a complete pass — which is what makes running it again');
say('after provisioning a proof rather than a formality.');
say('');

say('## REUSE — the three, re-read from the portal');
say('');
say('**This is the first form in the series whose reuses come from TWO creators.** Each row is classified `exact`');
say('in the crosswalk classification and binds a property whose prefix records the form that created it, per');
say('[R-06]. **A reuse that is not live is a STOP**, because provisioning it would create the name under the');
say('predecessor\'s prefix and attribute it to the form that did not make it, permanently.');
say('');
if (reuseMissing.length) {
  say('**STOP — these reuses name properties the portal does not hold:**');
  for (const p of reuseMissing) say(`- \`${p.hs_name}\` (input key \`${p.key}\`, crosswalk ${p.entry})`);
  say('');
}
say('| input key | subject class | entry | binds | created by | live type | this form needs | agrees |');
say('|---|---|---|---|---|---|---|---|');
for (const { p, l } of reuseOk) say(`| \`${p.key}\` | ${p.subject_class} | ${p.entry} | \`${p.hs_name}\` | ${p.created_by_form} | ${l.type}/${l.fieldType} | ${p.type}/${p.fieldType} | ${l.type === p.type && l.fieldType === p.fieldType ? 'yes' : '**no**'} |`);
say('');
say('Every one of the three is a cell the map classes subject-DEPENDENT or subject-CONDITIONAL — a cell with a');
say('FIXED subject. `derive-names-433d.mjs` A9S refuses a reuse on any other class, which is why no');
say('subject-INDEPENDENT cell on this form binds an existing property even though the subject register licenses');
say('reuse against all five predecessors ([R-29]).');
say('');

say('## The reused properties\' descriptions, and the standing ruling on them');
say('');
say('The standing ruling requires each reused property\'s description to name **every** form it serves. These three');
say('were created by earlier passes, so "at create time" for them was a previous cycle. `hs-provision.mjs` cannot');
say('close it: it creates and never patches, and teaching it to patch would change what the provisioner is ([R-12]).');
say('');
if (!reuseDescr.length) say(`**None** — all ${reuseOk.length} reused properties already carry a description naming this form.`);
else {
  say(`${reuseDescr.length} of ${reuseOk.length} reused properties carry a live description that does not name 433-D. Closed by`);
  say('`adapters/hubspot/hs-describe-reused-433d.mjs`, which patches **descriptions and nothing else** and reads');
  say('each one back from the portal on a separate request.');
  say('');
  say('| property | created by | live description | would become |');
  say('|---|---|---|---|');
  for (const { p, l } of reuseDescr) say(`| \`${p.hs_name}\` | ${p.created_by_form} | ${bar(l.description || '_(none)_')} | ${bar(p.description)} |`);
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
  say(`checked rather than assumed. The ${declaredCreates.length} names this form CREATES carry a prefix the portal holds ${livePrefixed.length} name(s) under,`);
  say('re-read above, and nothing can diverge from a property that does not exist. The 3 it REUSES all exist, and');
  say('`derive-names-433d.mjs` A9R asserts each one\'s live type and fieldType against its crosswalk row — so a type');
  say('divergence on a reuse takes the DERIVATION down, two steps before this run.');
  say('`adapters/hubspot/433d.divergence-decisions.mjs` is empty and says exactly that.');
} else {
  for (const { p, l, d } of differs) {
    say(`### \`${p.hs_name}\`  (input key \`${p.key}\`, crosswalk ${p.entry}, ${p.category})`);
    say('');
    say('| | live definition | what 433-D needs |');
    say('|---|---|---|');
    for (const x of d) say(`| ${x.what} | \`${x.live}\` | \`${x.needed}\` |`);
    say(`| label | ${bar(l.label)} | ${bar(p.label)} |`);
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
say('Every derived name whose shared twin `irs433_<fact>` is LIVE ON THE PORTAL RIGHT NOW and is not the name the');
say('row already binds. The derivation adjudicated each of these by category (A8); this list is read from the');
say('portal instead, because "the backbone file names it" and "the portal holds it" are different claims and only');
say('the second is what a provisioning run collides with. None is a collision: the names this pass creates carry');
say('`irs433d_` and the twins carry `irs433_`, which the disjointness proof above covers.');
say('');
say(`${twins.length} of the ${props.length} facts have a live shared twin that is not already the row's own binding.`);
say('');
say('| input key | entry | category | this pass | live twin | twin type |');
say('|---|---|---|---|---|---|');
for (const t of twins) say(`| \`${t.p.key}\` | ${t.p.entry} | ${t.p.category} | \`${t.p.hs_name}\`${t.p.scope === 'reuse' ? ' _(reuse)_' : ''} | \`${t.twin}\` | ${t.l.type}/${t.l.fieldType} |`);
say('');

say('## New — would be created');
say('');
say(`${fresh.length} properties, all form-specific under \`${CREATE_PREFIX}\`.`);
say('');
say('| derived name | input key | entry | category | subject class | type/fieldType |');
say('|---|---|---|---|---|---|');
for (const p of fresh) say(`| \`${p.hs_name}\` | \`${p.key}\` | ${p.entry} | ${p.category} | ${p.subject_class ?? '—'} | ${p.type}/${p.fieldType} |`);
say('');

say('## Exists and matches, without this form claiming a reuse');
say('');
if (!matches.length) say('**None.** Every live property this form binds is a declared reuse, which is what the classification says: three `exact` rows and no others.');
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
  for (const { p, c, isReuse } of cosmetic) say(`| \`${p.hs_name}\` | ${isReuse ? 'yes' : 'no'} | ${bar(c.join('; '))} |`);
}
say('');

writeFileSync('adapters/hubspot/433d.provisioning-dryrun.md', L.join('\n') + '\n');
console.log('433-D dry run - NOTHING CREATED.');
console.log(`  REUSE exists ${reuseOk.length}, REUSE NOT LIVE ${reuseMissing.length}, matches ${matches.length}, DIFFERS ${differs.length}, new ${fresh.length}, total ${props.length}`);
console.log(`  reuse prefixes DERIVED from the rows: ${reusePrefixes.join(', ')} (${reuseRows.length} reuse row(s), ${creatingForms.size} creating form(s): ${[...creatingForms].join(', ')})`);
console.log(`  groups to create: ${groupsToCreate.length ? groupsToCreate.map((g) => g.name).join(', ') : 'none'}`);
for (const { pre, n } of prefixCounts) console.log(`  prefix ${pre} live on the portal today: ${n}`);
console.log(`  live shared twins re-read from the portal: ${twins.length}`);
console.log(`  reused properties whose live description does not name this form: ${reuseDescr.length}`);
console.log(`  provisioning state, read from the portal: ${provisioningState}`);
console.log(`  HEADROOM  before ${before}  added ${added}  after ${after}  left ${CEILING - after} (ceiling ${CEILING})`);
console.log('  report -> adapters/hubspot/433d.provisioning-dryrun.md');
if (stops.length) {
  console.error(`\nSTOP - ${stops.length} condition(s):`);
  for (const s of stops) console.error('  ' + s);
  process.exitCode = 3;
}
