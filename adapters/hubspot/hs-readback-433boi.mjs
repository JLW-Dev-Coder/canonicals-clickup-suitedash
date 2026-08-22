// READ BACK every 433-B(OIC) property FROM THE PORTAL and compare it to what was asked for.
//
//   node adapters/hubspot/hs-readback-433boi.mjs
//   -> adapters/hubspot/433boi.provisioning-readback.md
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
//
// AND THE OPTION SET IS RE-ASSERTED AGAINST THE ENGINE, from the portal side.
// adapters/hubspot/assert-intake-keys.mjs asserts that every value a DEFINITION emits resolves
// against the spellings the fill engine accepts. That is the definition file's claim. This
// asserts the same thing about what the PORTAL actually holds, because the two can differ: an
// option silently dropped or renamed at create time would leave a live property whose stored
// values the engine cannot resolve, and the definition file would still look right.

import { readFileSync, writeFileSync } from 'node:fs';
import { hs } from './hs-lib.mjs';
import { DIVERGENCE_DECISIONS } from './433boi.divergence-decisions.mjs';
import { loadRecordShape, statesOf } from '../pdf/record-shape.mjs';

const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433boi.json', 'utf8'));
const props = defs.properties;
const MAP = JSON.parse(readFileSync('adapters/pdf/maps/433boi.map.json', 'utf8'));

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
  if (l.groupName !== p.group) bad.push(`group: portal "${l.groupName}", asked "${p.group}"`);
  if (!bad.length) { ok.push({ p, l }); continue; }
  const dec = DIVERGENCE_DECISIONS[p.hs_name];
  if (dec) decided.push({ p, l, bad, dec }); else wrong.push({ p, l, bad });
}

// ── THE WRITER-RESOLVER ASSERTION, FROM THE PORTAL SIDE ───────────────────────────────────
// Every option VALUE the live property holds must be a key the definition's map_option_by_value
// translates, and every value it translates TO must be a spelling this form's engine accepts.
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
  if (p.source === 'checkboxes') { accepted = Object.keys(MAP.checkboxes[p.key] || {}).filter((k) => !k.startsWith('_')); where = `433boi.map.json checkboxes.${p.key}`; }
  else if (p.source === 'check_here') { accepted = [...CHECK_HERE_ACCEPTS]; where = 'the check_here spellings fill-433boi.mjs accepts'; }
  else if (routeStates[p.key]) { accepted = routeStates[p.key]; where = `433boi.map.json record_shape declaration for "${p.key}"`; }
  if (!accepted) { optionProblems.push(`${p.hs_name}: this check cannot find the set of values the engine accepts for construct "${p.source}". An unreadable input is not a pass.`); continue; }
  // Both directions. A live option value the table does not translate reaches the fetch layer
  // and is REFUSED there, which is loud and correct; a translated value the engine cannot
  // resolve reaches the page as nothing, which is silent and is the case that matters.
  for (const o of (l.options || [])) {
    optionValues++;
    const to = p.map_option_by_value[String(o.value)];
    if (to === undefined) { optionProblems.push(`${p.hs_name}: the portal holds option value ${JSON.stringify(o.value)} and the definition's map_option_by_value does not translate it. A contact stored with it would stop the fetch.`); continue; }
    if (!accepted.includes(String(to))) optionProblems.push(`${p.hs_name}: the portal's option ${JSON.stringify(o.value)} translates to ${JSON.stringify(to)}, and ${where} accepts only [${accepted.join(', ')}]. That value would reach the page as nothing, with no error.`);
  }
}

// Which of these did THIS pass create? Everything whose live description names 433-B(OIC) as
// the form that wrote it. Derived from the portal, not from a list this file carries.
const createdHere = ok.concat(wrong, decided).filter(({ l }) => (l.description || '').startsWith('433-B(OIC) (input key:'));

const L = [];
const say = (s = '') => L.push(s);
say('# 433-B(OIC) provisioning read-back');
say('');
say('Every definition in `fields.433boi.json` read back **from the portal**, not from the create response.');
say('');
say('| | |');
say('|---|---|');
say(`| definitions checked | ${props.length} |`);
say(`| present and matching (type, fieldType, options, group) | ${ok.length} |`);
say(`| present and differing, WITH A RECORDED DECISION | ${decided.length} |`);
say(`| present and WRONG (differs, no decision) | ${wrong.length} |`);
say(`| MISSING from the portal | ${missing.length} |`);
say(`| carrying a 433-B(OIC) description, so written by this pass | ${createdHere.length} |`);
say('');
say(`Portal now holds **${custom.length}** custom contact properties (${all.length} total, ${all.length - custom.length} HubSpot-defined).`);
say(`Headroom at the documented 1,000-custom ceiling: **${1000 - custom.length}**.`);
say('');
say('By prefix: ' + Object.entries(custom.reduce((a, p) => { const k = (p.name.match(/^(irs433[a-z]*)_/) || [, '(other)'])[1]; a[k] = (a[k] || 0) + 1; return a; }, {})).sort().map(([k, v]) => `\`${k}\` ${v}`).join(', '));
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

if (missing.length) { say('## MISSING'); say(''); for (const p of missing) say(`- \`${p.hs_name}\` (input key \`${p.key}\`)`); say(''); }
if (wrong.length) { say('## PRESENT AND WRONG'); say(''); for (const { p, bad } of wrong) say(`- \`${p.hs_name}\` - ${bad.join('; ')}`); say(''); }
if (decided.length) {
  say('## Present and differing, with a recorded decision');
  say('');
  for (const { p, bad, dec } of decided) {
    say(`### \`${p.hs_name}\`  (input key \`${p.key}\`)`);
    say('');
    say(`- read back from the portal: ${bad.join('; ')}`);
    say(`- **decision** (${dec.decided_in}): ${dec.decision}`);
    say(`- ${dec.why}`);
    say('');
  }
}

say('## Read-back, property by property');
say('');
say('`created here` marks the properties whose live description names 433-B(OIC) as the form that wrote them.');
say('On this form that is expected to be all of them: the subject ruling gives every fact a form-specific name,');
say('so this pass reuses nothing and every row below is a property it created.');
say('');
say('| property (from the portal) | type | fieldType | options (portal) | group | input key | created here |');
say('|---|---|---|---|---|---|---|');
for (const { p, l } of ok) say(`| \`${l.name}\` | ${l.type} | ${l.fieldType} | ${optVals(l.options) || '-'} | ${l.groupName} | \`${p.key}\` | ${(l.description || '').startsWith('433-B(OIC) (input key:') ? 'yes' : '-'} |`);
say('');

writeFileSync('adapters/hubspot/433boi.provisioning-readback.md', L.join('\n') + '\n');
console.log('433-B(OIC) read-back, FROM THE PORTAL:');
console.log(`  ${props.length} definitions; ${ok.length} matching, ${decided.length} differing with a recorded decision, ${wrong.length} wrong, ${missing.length} missing.`);
console.log(`  ${createdHere.length} carry a 433-B(OIC) description, so this pass wrote them.`);
console.log(`  option values re-asserted from the portal: ${optionValues} across ${optionChecked} propert(ies); ${optionProblems.length} problem(s).`);
console.log(`  portal now: ${custom.length} custom contact properties, headroom ${1000 - custom.length}.`);
console.log('  report -> adapters/hubspot/433boi.provisioning-readback.md');
if (missing.length || wrong.length || optionProblems.length) {
  console.error(`\nSTOP - ${missing.length} missing, ${wrong.length} wrong, ${optionProblems.length} option problem(s). A property name cannot be renamed, so a wrong one is fixed by deciding what to do about it, not by re-running this.`);
  process.exit(3);
}
console.log('every definition read back from the portal matches what was asked for, and every live option value resolves against the engine.');
