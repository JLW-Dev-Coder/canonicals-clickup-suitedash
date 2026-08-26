// READ BACK every 433-B property FROM THE PORTAL and compare it to what was asked for.
//
//   node adapters/hubspot/hs-readback-433b.mjs
//   -> adapters/hubspot/433b.provisioning-readback.md
//
// WHY THIS IS NOT THE CREATE RESPONSE
// -----------------------------------
// A create that reported success and a property that is actually queryable with the type,
// fieldType and options it was asked for are different claims, and only the second is what the
// fetch layer depends on ([R-23]). hs-provision.mjs re-reads the portal to confirm the NAMES
// exist; it does not confirm the DEFINITIONS, and a property created with the wrong fieldType
// stores a value the fill engine cannot resolve — silently, on a form signed under penalty of
// perjury.
//
// AND ON THIS FORM THE READ-BACK HAS A SECOND JOB, BECAUSE NINE PROPERTIES WERE NOT CREATED.
// 433-B binds nine properties 433-B(OIC) made ([R-06]). For those, "present and matching" is not
// evidence this pass did anything — they were present before it ran. So the two are separated:
//
//   CREATED HERE   the live description names 433-B and this key. This pass wrote it.
//   REUSED         declared `scope: "reuse"`; must be live, must match on type and fieldType,
//                  and its live description must name BOTH forms — which is prompt-50 ruling 1,
//                  closed by hs-describe-reused-433b.mjs and VERIFIED here rather than assumed.
//
// A reused property that is MISSING is a STOP of its own kind: it would mean the provisioner
// created it under the predecessor's prefix, recording the wrong form as its creator forever.

import { readFileSync, writeFileSync } from 'node:fs';
import { hs, stop } from './hs-lib.mjs';
import { DIVERGENCE_DECISIONS } from './433b.divergence-decisions.mjs';
import { loadRecordShape, statesOf } from '../pdf/record-shape.mjs';

const CEILING = 1000;
const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433b.json', 'utf8'));
const props = defs.properties;
const MAP = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));

const all = (await hs('/crm/v3/properties/contacts')).results || [];
if (all.length < 100) {
  console.error(`STOP - the portal returned ${all.length} contact properties. That read failed; it did not find an empty portal. Refusing to report "nothing came back" as "nothing was created".`);
  stop(3);
}
const live = new Map(all.map((p) => [p.name, p]));
const custom = all.filter((p) => !p.hubspotDefined);

const optVals = (o) => (o || []).map((x) => x.value).sort().join('|');
const missing = [], missingReuse = [], wrong = [], ok = [], decided = [];
for (const p of props) {
  const l = live.get(p.hs_name);
  if (!l) { (p.scope === 'reuse' ? missingReuse : missing).push(p); continue; }
  const bad = [];
  if (l.type !== p.type) bad.push(`type: portal "${l.type}", asked "${p.type}"`);
  if (l.fieldType !== p.fieldType) bad.push(`fieldType: portal "${l.fieldType}", asked "${p.fieldType}"`);
  if (p.options && optVals(l.options) !== optVals(p.options)) bad.push(`option values: portal "${optVals(l.options)}", asked "${optVals(p.options)}"`);
  // THE GROUP IS NOT CHECKED ON A REUSE. A reused property keeps the group the form that CREATED
  // it put it in — irs433boic — and this form's definition says so. Demanding this form's group
  // of a rebind is the same error as demanding this form's prefix, which [R-06] forbids.
  if (p.scope !== 'reuse' && l.groupName !== p.group) bad.push(`group: portal "${l.groupName}", asked "${p.group}"`);
  if (!bad.length) { ok.push({ p, l }); continue; }
  const dec = DIVERGENCE_DECISIONS[p.hs_name];
  if (dec) decided.push({ p, l, bad, dec }); else wrong.push({ p, l, bad });
}

// ── THE WRITER-RESOLVER ASSERTION, FROM THE PORTAL SIDE ───────────────────────────────────
const CHECK_HERE_ACCEPTS = new Set(['yes', 'no', 'true', 'false']);
const RS = loadRecordShape(MAP);
const routeStates = {};
for (const d of RS.declarations) routeStates[d.input] = statesOf(d);
const optionProblems = [];
let optionChecked = 0, optionValues = 0;
for (const { p, l } of ok.concat(decided)) {
  if (!p.map_option_by_value) continue;
  optionChecked++;
  let accepted = null, where = null;
  if (p.source === 'checkboxes') { accepted = Object.keys(MAP.checkboxes[p.key] || {}).filter((k) => !k.startsWith('_')); where = `433b.map.json checkboxes.${p.key}`; }
  else if (p.source === 'check_here') { accepted = [...CHECK_HERE_ACCEPTS]; where = 'the check_here spellings fill-433b.mjs accepts'; }
  else if (routeStates[p.key]) { accepted = routeStates[p.key]; where = `433b.map.json record_shape declaration for "${p.key}"`; }
  if (!accepted) { optionProblems.push(`${p.hs_name}: this check cannot find the set of values the engine accepts for construct "${p.source}". An unreadable input is not a pass.`); continue; }
  for (const o of (l.options || [])) {
    optionValues++;
    const to = p.map_option_by_value[String(o.value)];
    if (to === undefined) { optionProblems.push(`${p.hs_name}: the portal holds option value ${JSON.stringify(o.value)} and the definition's map_option_by_value does not translate it. A contact stored with it would stop the fetch.`); continue; }
    if (!accepted.includes(String(to))) optionProblems.push(`${p.hs_name}: the portal's option ${JSON.stringify(o.value)} translates to ${JSON.stringify(to)}, and ${where} accepts only [${accepted.join(', ')}]. That value would reach the page as nothing, with no error.`);
  }
}

// ── RULING 1, VERIFIED FROM THE PORTAL ────────────────────────────────────────────────────
// Every reused property's LIVE description must name both forms. Read here rather than trusted,
// because hs-describe-reused-433b.mjs patching successfully and the portal holding the result
// are different facts.
const reuseRows = props.filter((p) => p.scope === 'reuse');
// Same test, same reason, same canary as hs-describe-reused-433b.mjs: `/433-B\b/` matches INSIDE
// "433-B(OIC)", so the first draft read every predecessor-only description as naming both and
// this section would have certified ruling 1 satisfied over a portal nothing had touched.
const namesOwnForm = (d) => /433-B(?!\(OIC\))/.test(String(d || ''));
const namesPredecessor = (d) => /433-B\(OIC\)/.test(String(d || ''));
const namesBoth = (d) => namesOwnForm(d) && namesPredecessor(d);
{
  const onlyPredecessor = '433-B(OIC) (input key: s1_business_name). Specific to Form 433-B(OIC).';
  const both = 'Serves BOTH Form 433-B (input key: s1_business_name) and Form 433-B(OIC) (input key: s1_business_name).';
  const dead = [];
  if (namesBoth(onlyPredecessor)) dead.push('a description naming ONLY 433-B(OIC) was read as naming both.');
  if (!namesBoth(both)) dead.push('a description naming BOTH forms was read as naming one.');
  if (dead.length) { console.error('STOP — the both-forms test is dead:\n  ' + dead.join('\n  ')); stop(3); }
}
const reuseDescOk = [], reuseDescShort = [];
for (const p of reuseRows) {
  const l = live.get(p.hs_name);
  if (!l) continue;
  (namesBoth(l.description) ? reuseDescOk : reuseDescShort).push({ p, l });
}

// Which of these did THIS pass create? Everything whose live description names 433-B as the form
// that wrote it. Derived from the portal, not from a list this file carries.
const createdHere = ok.concat(wrong, decided).filter(({ l }) => (l.description || '').startsWith('433-B (input key:'));

const L = [];
const say = (s = '') => L.push(s);
say('# 433-B provisioning read-back');
say('');
say('Produced by `node adapters/hubspot/hs-readback-433b.mjs`. Every definition in `fields.433b.json` read back');
say('**from the portal**, not from the create response.');
say('');
say('| | |');
say('|---|---|');
say(`| definitions checked | ${props.length} |`);
say(`| present and matching (type, fieldType, options, group) | ${ok.length} |`);
say(`| present and differing, WITH A RECORDED DECISION | ${decided.length} |`);
say(`| present and WRONG (differs, no decision) | ${wrong.length} |`);
say(`| MISSING from the portal | ${missing.length} |`);
say(`| **REUSED and MISSING (STOP)** | ${missingReuse.length} |`);
say(`| **created by this pass** (live description names 433-B and the key) | ${createdHere.length} |`);
say(`| **reused** (created by 433-B(OIC), bound under [R-06]) | ${reuseRows.length} |`);
say('');
say(`Portal now holds **${custom.length}** custom contact properties (${all.length} total, ${all.length - custom.length} HubSpot-defined).`);
say(`Headroom at the documented ${CEILING.toLocaleString()}-custom ceiling: **${CEILING - custom.length}**.`);
say('');
say('By prefix: ' + Object.entries(custom.reduce((a, p) => { const k = (p.name.match(/^(irs433[a-z]*)_/) || [, '(other)'])[1]; a[k] = (a[k] || 0) + 1; return a; }, {})).sort().map(([k, v]) => `\`${k}\` ${v}`).join(', '));
say('');
say('**`created by this pass` plus `reused` is the whole of this form, and the two are counted separately on purpose.**');
say('A reused property was present before this pass ran, so "present and matching" says nothing about what this');
say('pass did to it. Nine of the 116 were bound rather than created, and they cost no headroom.');
say('');

say('## Ruling 1 — every reused property names both forms it serves, read from the portal');
say('');
say('Each of these nine was created by the 433-B(OIC) pass, so "at create time" for them was a previous cycle.');
say('`hs-provision.mjs` cannot close it — it creates and never patches — so `hs-describe-reused-433b.mjs` patches');
say('descriptions and nothing else. **This section is the portal\'s answer, not that tool\'s.**');
say('');
say(`${reuseDescOk.length} of ${reuseRows.length} reused propert(ies) carry a live description naming both forms.`);
say('');
if (reuseDescShort.length) {
  say('**These do not:**');
  say('');
  say('| property | live description |');
  say('|---|---|');
  for (const { p, l } of reuseDescShort) say(`| \`${p.hs_name}\` | ${(l.description || '_(none)_').replace(/\|/g, '\\|').slice(0, 200)} |`);
  say('');
}
say('| property | 433-B input key | 433-B(OIC) input key | live type | names both |');
say('|---|---|---|---|---|');
for (const p of reuseRows) {
  const l = live.get(p.hs_name);
  say(`| \`${p.hs_name}\` | \`${p.key}\` | \`${p.backbone_key}\` | ${l ? `${l.type}/${l.fieldType}` : '**ABSENT**'} | ${l && namesBoth(l.description) ? 'yes' : '**no**'} |`);
}
say('');

say('## The option values, re-asserted from the portal side');
say('');
say('`assert-intake-keys.mjs` asserts that every value a DEFINITION emits resolves against the spellings this');
say('form\'s engine accepts. This asserts the same thing about what the PORTAL actually holds, because the two');
say('can differ: an option silently dropped or renamed at create time leaves a live property whose stored values');
say('the engine cannot resolve, and the definition file still looks right.');
say('');
say(`${optionValues} live option value(s) across ${optionChecked} propert(ies) checked in both directions.`);
say('');
if (!optionProblems.length) say('**No problem.** Every live option value is translated by its definition, and every value it translates to is a spelling the engine accepts.');
else for (const p of optionProblems) say(`- **${p}**`);
say('');

if (missingReuse.length) { say('## REUSED AND MISSING — STOP'); say(''); for (const p of missingReuse) say(`- \`${p.hs_name}\` (input key \`${p.key}\`) — a reuse must bind a property that exists.`); say(''); }
if (missing.length) { say('## MISSING'); say(''); for (const p of missing) say(`- \`${p.hs_name}\` (input key \`${p.key}\`)`); say(''); }
if (wrong.length) { say('## PRESENT AND WRONG'); say(''); for (const { p, bad } of wrong) say(`- \`${p.hs_name}\` — ${bad.join('; ')}`); say(''); }
if (decided.length) {
  say('## Present and differing, with a recorded decision');
  say('');
  for (const { p, bad, dec } of decided) {
    say(`### \`${p.hs_name}\`  (input key \`${p.key}\`)`);
    say('');
    say(`- read back from the portal: ${bad.join('; ')}`);
    say(`- **decision**: ${dec.decision}`);
    say(`- ${dec.why}`);
    say('');
  }
}

say('## Read-back, property by property');
say('');
say('`created here` marks the properties whose live description names 433-B as the form that wrote them, and');
say('`reused` marks the nine this form binds rather than creates. Every row is read from the portal.');
say('');
say('| property (from the portal) | type | fieldType | options (portal) | group | input key | origin |');
say('|---|---|---|---|---|---|---|');
for (const { p, l } of ok) {
  const origin = p.scope === 'reuse' ? 'reused (433-B(OIC))'
    : (l.description || '').startsWith('433-B (input key:') ? 'created here' : '-';
  say(`| \`${l.name}\` | ${l.type} | ${l.fieldType} | ${optVals(l.options) || '-'} | ${l.groupName} | \`${p.key}\` | ${origin} |`);
}
say('');

writeFileSync('adapters/hubspot/433b.provisioning-readback.md', L.join('\n') + '\n');
console.log('433-B read-back, FROM THE PORTAL:');
console.log(`  ${props.length} definitions; ${ok.length} matching, ${decided.length} differing with a recorded decision, ${wrong.length} wrong, ${missing.length} missing, ${missingReuse.length} REUSED-and-missing.`);
console.log(`  created by this pass ${createdHere.length}; reused ${reuseRows.length} (${reuseDescOk.length} naming both forms).`);
console.log(`  option values re-asserted from the portal: ${optionValues} across ${optionChecked} propert(ies); ${optionProblems.length} problem(s).`);
console.log(`  portal now: ${custom.length} custom contact properties, headroom ${CEILING - custom.length}.`);
console.log('  report -> adapters/hubspot/433b.provisioning-readback.md');
if (missing.length || missingReuse.length || wrong.length || optionProblems.length || reuseDescShort.length) {
  console.error(`\nSTOP - ${missing.length} missing, ${missingReuse.length} reused-and-missing, ${wrong.length} wrong, ${optionProblems.length} option problem(s), ${reuseDescShort.length} reused propert(ies) not naming both forms.`);
  console.error('  A property name cannot be renamed, so a wrong one is fixed by deciding what to do about it, not by re-running this.');
  stop(3);
}
console.log('every definition read back from the portal matches what was asked for, every live option value resolves against the engine, and every reused property names both forms.');
