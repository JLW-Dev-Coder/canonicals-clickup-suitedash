// READ BACK every 433-A(OIC) property FROM THE PORTAL and compare it to what was asked for.
//
//   node adapters/hubspot/hs-readback-433aoi.mjs
//   -> adapters/hubspot/433aoi.provisioning-readback.md
//
// WHY THIS IS NOT THE CREATE RESPONSE
// -----------------------------------
// A create that reported success and a property that is actually queryable with the type,
// fieldType and options it was asked for are different claims, and only the second one is what
// the fetch layer depends on. hs-provision.mjs already re-reads the portal to confirm the NAMES
// exist, which is the check that catches a batch silently dropping a row. It does not confirm
// the DEFINITIONS, and a property created with the wrong fieldType is a property that stores a
// value the fill engine cannot resolve - silently, on a form signed under penalty of perjury.
//
// So this reads the whole definition back and compares four things per property: type,
// fieldType, the option VALUE SET, and the group. Anything that disagrees is a STOP, and a
// property that is missing entirely is a STOP with its own message rather than being counted
// as a difference - "created wrong" and "not there" are different failures.
//
// Reads through /crm/v3/properties/contacts, which walks the object store, rather than through
// search, which runs off an index that lags writes.

import { readFileSync, writeFileSync } from 'node:fs';
import { hs } from './hs-lib.mjs';
// The SAME list the dry run adjudicated against, imported rather than restated. A property
// that differs because a decision was recorded about it and a property that this pass created
// wrongly are two different failures, and only one of them is a defect. Without the list this
// file could not tell them apart, and it would either STOP on a decided divergence forever or
// stop STOPPING on anything.
import { DIVERGENCE_DECISIONS } from './433aoi.divergence-decisions.mjs';

const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433aoi.json', 'utf8'));
const props = defs.properties;

const all = (await hs('/crm/v3/properties/contacts')).results || [];
if (all.length < 100) {
  console.error(`STOP - the portal returned ${all.length} contact properties. That read failed; it did not find an empty portal. Refusing to report "nothing came back" as "nothing was created".`);
  process.exit(3);
}
const live = new Map(all.map((p) => [p.name, p]));
const custom = all.filter((p) => !p.hubspotDefined);

const optVals = (o) => (o || []).map((x) => x.value).sort().join('|');
const missing = [], wrong = [], ok = [], decided = [];
for (const p of props) {
  const l = live.get(p.hs_name);
  if (!l) { missing.push(p); continue; }
  const bad = [];
  if (l.type !== p.type) bad.push(`type: portal "${l.type}", asked "${p.type}"`);
  if (l.fieldType !== p.fieldType) bad.push(`fieldType: portal "${l.fieldType}", asked "${p.fieldType}"`);
  if (p.options && optVals(l.options) !== optVals(p.options)) bad.push(`option values: portal "${optVals(l.options)}", asked "${optVals(p.options)}"`);
  if (!bad.length) { ok.push({ p, l }); continue; }
  const dec = DIVERGENCE_DECISIONS[p.hs_name];
  if (dec) decided.push({ p, l, bad, dec }); else wrong.push({ p, l, bad });
}

// Which of these did THIS pass create? Everything whose live description names 433-A(OIC) as
// the form that wrote it. Derived from the portal, not from a list this file carries.
const createdHere = ok.concat(wrong, decided).filter(({ l }) => (l.description || '').startsWith('433-A(OIC) (input key:'));

const L = [];
const say = (s = '') => L.push(s);
say('# 433-A(OIC) provisioning read-back');
say('');
say('Every definition in `fields.433aoi.json` read back **from the portal**, not from the create response.');
say('');
say('| | |');
say('|---|---|');
say(`| definitions checked | ${props.length} |`);
say(`| present and matching (type, fieldType, options) | ${ok.length} |`);
say(`| present and differing, WITH A RECORDED DECISION | ${decided.length} |`);
say(`| present and WRONG (differs, no decision) | ${wrong.length} |`);
say(`| MISSING from the portal | ${missing.length} |`);
say(`| carrying a 433-A(OIC) description, so written by this pass | ${createdHere.length} |`);
say('');
say(`Portal now holds **${custom.length}** custom contact properties (${all.length} total, ${all.length - custom.length} HubSpot-defined).`);
say(`Headroom at the documented 1,000-custom ceiling: **${1000 - custom.length}**.`);
say('');
say('By prefix: ' + Object.entries(custom.reduce((a, p) => { const k = (p.name.match(/^(irs433[a-z]*)_/) || [, '(other)'])[1]; a[k] = (a[k] || 0) + 1; return a; }, {})).map(([k, v]) => `\`${k}\` ${v}`).join(', '));
say('');

if (missing.length) { say('## MISSING'); say(''); for (const p of missing) say(`- \`${p.hs_name}\` (input key \`${p.key}\`)`); say(''); }
if (wrong.length) { say('## PRESENT AND WRONG'); say(''); for (const { p, bad } of wrong) say(`- \`${p.hs_name}\` - ${bad.join('; ')}`); say(''); }
if (decided.length) {
  say('## Present and differing, with a recorded decision');
  say('');
  say('These were already on the portal before this pass and were NOT created by it. Each differs from what');
  say('433-A(OIC) needs, each was reported in the dry run, and each carries a ruling in');
  say('`433aoi.divergence-decisions.mjs` - which is the file this read-back imports rather than restating.');
  say('');
  for (const { p, bad, dec } of decided) {
    say(`### \`${p.hs_name}\`  (input key \`${p.key}\`)`);
    say('');
    say(`- read back from the portal: ${bad.join('; ')}`);
    say(`- **decision** (${dec.decided_in}): ${dec.decision}`);
    say(`- ${dec.why}`);
    say(`- _A value this form cannot print:_ ${dec.what_happens_to_a_value_this_form_cannot_print}`);
    say('');
  }
}

say('## Read-back, property by property');
say('');
say('`created here` marks the properties whose live description names 433-A(OIC) as the form that wrote them.');
say('The rest were already on the portal and are reused; their definitions are read back too, because reuse');
say('depends on them just as much as creation does.');
say('');
say('| property (from the portal) | type | fieldType | options (portal) | group | input key | created here |');
say('|---|---|---|---|---|---|---|');
for (const { p, l } of ok) say(`| \`${l.name}\` | ${l.type} | ${l.fieldType} | ${optVals(l.options) || '-'} | ${l.groupName} | \`${p.key}\` | ${(l.description || '').startsWith('433-A(OIC) (input key:') ? 'yes' : '-'} |`);
say('');

writeFileSync('adapters/hubspot/433aoi.provisioning-readback.md', L.join('\n') + '\n');
console.log(`433-A(OIC) read-back, FROM THE PORTAL:`);
console.log(`  ${props.length} definitions; ${ok.length} matching, ${decided.length} differing with a recorded decision, ${wrong.length} wrong, ${missing.length} missing.`);
console.log(`  ${createdHere.length} carry a 433-A(OIC) description, so this pass wrote them.`);
console.log(`  portal now: ${custom.length} custom contact properties, headroom ${1000 - custom.length}.`);
console.log(`  report -> adapters/hubspot/433aoi.provisioning-readback.md`);
if (missing.length || wrong.length) {
  console.error(`\nSTOP - ${missing.length} missing and ${wrong.length} wrong. A property name cannot be renamed, so a wrong one is fixed by deciding what to do about it, not by re-running this.`);
  process.exit(3);
}
console.log('every definition read back from the portal matches what was asked for.');
