// READ BACK every 433-D property FROM THE PORTAL and compare it to what was asked for.
//
//   node adapters/hubspot/hs-readback-433d.mjs
//   -> adapters/hubspot/433d.provisioning-readback.md
//
// WHY THIS IS NOT THE CREATE RESPONSE
// -----------------------------------
// A create that reported success and a property that is actually queryable with the type,
// fieldType and options it was asked for are different claims, and only the second is what the
// fetch layer depends on ([R-23]). hs-provision.mjs re-reads the portal to confirm the NAMES
// exist; it does not confirm the DEFINITIONS, and a property created with the wrong fieldType
// stores a value the fill engine cannot resolve — silently, on a document signed under penalty
// of perjury.
//
// THREE PROPERTIES WERE NOT CREATED, AND THEY COME FROM TWO DIFFERENT FORMS
// -------------------------------------------------------------------------
// 433-B was the first form to bind properties it did not create, and all nine of its reuses came
// from one predecessor. 433-D binds three from two: irs433_tp_ssn_itin and irs433_sp_ssn_itin
// from 433-A, and irs433boi_employer_identification_number from 433-B(OIC). For those, "present
// and matching" is not evidence this pass did anything — they were present before it ran. So:
//
//   CREATED HERE   the live description opens "433-D (input key: …)". This pass wrote it.
//   REUSED         declared `scope: "reuse"`; must be live, must match on type and fieldType,
//                  and its live description must NAME THIS FORM — the standing ruling, closed by
//                  hs-describe-reused-433d.mjs and VERIFIED here rather than assumed.
//
// A reused property that is MISSING is a STOP of its own kind: it would mean the provisioner
// created it under the predecessor's prefix, recording the wrong form as its creator forever.
//
// AND THE GROUP IS NOT CHECKED ON A REUSE, for [R-06]'s reason: a reused property keeps the group
// the form that CREATED it put it in — irs433 for two of these, irs433boic for the third — and
// demanding this form's group of a rebind is the same error as demanding this form's prefix.
//
// THE SUBJECT ROUTE IS READ BACK TOO, AND NO PREDECESSOR HAS ONE. `irs433d_subject` is the
// operator input that decides which of the two identifier properties a record's value reaches.
// Its stored value is read BARE by the engine — the definition carries no map_option_by_value —
// so the option set the portal holds IS the set of spellings the engine will ever see, and it is
// asserted equal to the branch names the map's route declares. A third option live on that
// property would be a value the engine cannot route, stored under a name that says it can.

import { readFileSync, writeFileSync } from 'node:fs';
import { hs, stop } from './hs-lib.mjs';
import { DIVERGENCE_DECISIONS } from './433d.divergence-decisions.mjs';

const CEILING = 1000;
const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433d.json', 'utf8'));
const props = defs.properties;
const MAP = JSON.parse(readFileSync('adapters/pdf/maps/433d.map.json', 'utf8'));

const ROUTES = Object.entries(MAP.subject_classes || {}).filter(([, v]) => v && v.route).map(([stem, v]) => ({ stem, ...v.route }));
if (ROUTES.length !== 1) { console.error(`STOP - the map declares ${ROUTES.length} subject route(s) and this form has exactly one. Every reuse on the identifier and the whole of the route section below rest on reading it.`); stop(3); }
const ROUTE = ROUTES[0];
const BRANCHES = ['individual', 'entity'];

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
  if (p.scope !== 'reuse' && l.groupName !== p.group) bad.push(`group: portal "${l.groupName}", asked "${p.group}"`);
  if (!bad.length) { ok.push({ p, l }); continue; }
  const dec = DIVERGENCE_DECISIONS[p.hs_name];
  if (dec) decided.push({ p, l, bad, dec }); else wrong.push({ p, l, bad });
}

// ── THE WRITER-RESOLVER ASSERTION, FROM THE PORTAL SIDE ───────────────────────────────────
// Every live option value must be a spelling THIS FORM'S ENGINE accepts. The definition file can
// be right and the portal wrong: an option silently dropped or renamed at create time leaves a
// property whose stored values the fill engine cannot resolve, and nothing local looks different.
const optionProblems = [];
let optionChecked = 0, optionValues = 0;
for (const { p, l } of ok.concat(decided)) {
  if (p.type !== 'enumeration') continue;
  optionChecked++;
  let accepted = null, where = null;
  if (p.source === 'checkboxes') {
    const cb = MAP.checkboxes[p.key];
    if (Array.isArray(cb) || typeof cb === 'string') {
      // A LONE TICK. The map names widget targets, not option keys — the construct the key-space
      // predicate used to drop in silence — so the values the engine accepts are the booleans.
      accepted = ['true', 'false']; where = `the boolean spellings a lone tick accepts (433d.map.json checkboxes.${p.key} names ${Array.isArray(cb) ? cb.length : 1} widget target(s), not option keys)`;
    } else if (cb && typeof cb === 'object') {
      accepted = Object.keys(cb).filter((k) => !k.startsWith('_')); where = `433d.map.json checkboxes.${p.key}`;
    }
  } else if (p.source === 'route-discriminator') {
    accepted = BRANCHES; where = `433d.map.json subject_classes.${ROUTE.stem}.route, whose branches are the only values the engine can route`;
  }
  if (!accepted) { optionProblems.push(`${p.hs_name}: this check cannot find the set of values the engine accepts for construct "${p.source}". An unreadable input is not a pass ([R-04]).`); continue; }
  if (!(l.options || []).length) { optionProblems.push(`${p.hs_name}: the portal holds ZERO options on an enumeration. A property with no option can store no value, and reporting that as "every option resolves" would be the vacuous pass this check exists to refuse.`); continue; }
  for (const o of (l.options || [])) {
    optionValues++;
    const to = p.map_option_by_value ? p.map_option_by_value[String(o.value)] : String(o.value);
    if (to === undefined) { optionProblems.push(`${p.hs_name}: the portal holds option value ${JSON.stringify(o.value)} and the definition's map_option_by_value does not translate it. A contact stored with it would stop the fetch.`); continue; }
    if (!accepted.includes(String(to))) optionProblems.push(`${p.hs_name}: the portal's option ${JSON.stringify(o.value)} translates to ${JSON.stringify(to)}, and ${where} accepts only [${accepted.join(', ')}]. That value would reach the page as nothing, with no error.`);
  }
}

// ── THE SUBJECT ROUTE, READ BACK FROM THE PORTAL ──────────────────────────────────────────
const routeRows = [];
const routeProblems = [];
{
  const discRow = props.find((p) => p.key === ROUTE.discriminator);
  const discLive = discRow && live.get(discRow.hs_name);
  if (!discRow) routeProblems.push(`the definitions carry no row for the discriminator "${ROUTE.discriminator}" the map's route declares.`);
  else if (!discLive) routeProblems.push(`the discriminator property "${discRow.hs_name}" is not live. Without it a record declares no subject and the identifier reaches neither branch.`);
  else {
    const liveOpts = (discLive.options || []).map((o) => String(o.value)).sort();
    if (liveOpts.join('|') !== [...BRANCHES].sort().join('|')) routeProblems.push(`the discriminator "${discRow.hs_name}" holds options [${liveOpts.join(', ')}] and the map's route declares branches [${BRANCHES.join(', ')}]. A value the engine cannot route would be storable under a name saying it can.`);
    routeRows.push({ what: 'discriminator', key: ROUTE.discriminator, hs_name: discRow.hs_name, l: discLive, note: `options [${liveOpts.join(', ')}]` });
  }
  for (const b of BRANCHES) {
    const k = ROUTE[b];
    const row = props.find((p) => p.key === k);
    const l = row && live.get(row.hs_name);
    if (!row) { routeProblems.push(`the definitions carry no row for the "${b}" branch key "${k}".`); continue; }
    if (!l) { routeProblems.push(`the "${b}" branch binds "${row.hs_name}" and the portal does not hold it.`); continue; }
    routeRows.push({ what: `${b} branch`, key: k, hs_name: row.hs_name, l, note: `${row.scope}, created by ${row.created_by_form}` });
  }
  const branchNames = new Set(BRANCHES.map((b) => props.find((p) => p.key === ROUTE[b])?.hs_name).filter(Boolean));
  if (branchNames.size !== BRANCHES.length) routeProblems.push('the two branches resolve to fewer than two distinct properties. One property serving both branches would hold an SSN on one filed copy and an EIN on the next, under one name.');
}

// ── THE STANDING RULING, VERIFIED FROM THE PORTAL ─────────────────────────────────────────
// Every reused property's LIVE description must name this form. Read here rather than trusted:
// hs-describe-reused-433d.mjs patching successfully and the portal holding the result are
// different facts.
const reuseRows = props.filter((p) => p.scope === 'reuse');
const namesThisForm = (d) => /433-D\b/.test(String(d || ''));
{
  // THE CANARY, because the predecessor's version of this test was DEAD ON ARRIVAL: /433-B\b/
  // matches inside "433-B(OIC)", so every predecessor-only description read as naming both and
  // the tool certified a ruling over a portal nothing had touched ([D-18], second instance).
  const beforeAny = '433-A line 2 (input key: 2_sp_ssn_itin). Shared across the 433 series - named for the fact, not the form.';
  const afterOurs = beforeAny + ' Also written by Form 433-D (input key: 433d_spouse).';
  const otherForms = 'Serves BOTH Form 433-B (input key: s1_ein) and Form 433-B(OIC) (input key: s1_ein).';
  const dead = [];
  if (namesThisForm(beforeAny)) dead.push('a description naming only 433-A was read as naming 433-D.');
  if (namesThisForm(otherForms)) dead.push('a description naming 433-B and 433-B(OIC) was read as naming 433-D.');
  if (!namesThisForm(afterOurs)) dead.push('a description that DOES name 433-D was read as not naming it.');
  if (dead.length) { console.error('STOP — the names-this-form test is dead:\n  ' + dead.join('\n  ')); stop(3); }
}
const reuseDescOk = [], reuseDescShort = [];
for (const p of reuseRows) {
  const l = live.get(p.hs_name);
  if (!l) continue;
  (namesThisForm(l.description) ? reuseDescOk : reuseDescShort).push({ p, l });
}

// Which of these did THIS pass create? Derived from the portal, not from a list this file carries.
const createdHere = ok.concat(wrong, decided).filter(({ l }) => (l.description || '').startsWith('433-D (input key:'));

const L = [];
const say = (s = '') => L.push(s);
const bar = (s) => String(s).split('|').join('\\|');
say('# 433-D provisioning read-back');
say('');
say('Produced by `node adapters/hubspot/hs-readback-433d.mjs`. Every definition in `fields.433d.json` read back');
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
say(`| **created by this pass** (live description opens "433-D (input key:") | ${createdHere.length} |`);
say(`| **reused** (created by an earlier form, bound under [R-06]) | ${reuseRows.length} |`);
say('');
say(`Portal now holds **${custom.length}** custom contact properties (${all.length} total, ${all.length - custom.length} HubSpot-defined).`);
say(`Headroom at the documented ${CEILING.toLocaleString()}-custom ceiling: **${CEILING - custom.length}**.`);
say('');
say('By prefix: ' + Object.entries(custom.reduce((a, p) => { const k = (p.name.match(/^(irs433[a-z]*)_/) || [, '(other)'])[1]; a[k] = (a[k] || 0) + 1; return a; }, {})).sort().map(([k, v]) => `\`${k}\` ${v}`).join(', '));
say('');
say('**`created by this pass` plus `reused` is the whole of this form, and the two are counted separately on');
say('purpose.** A reused property was present before this pass ran, so "present and matching" says nothing about');
say(`what this pass did to it. ${reuseRows.length} of the ${props.length} were bound rather than created, and they cost no headroom.`);
say('');

say('## The subject route, read back from the portal');
say('');
say('**No predecessor in this series has one.** 433-D takes its subject from the RECORD rather than from the form,');
say('so one printed identifier box reaches one of two properties on a declaration the record makes. The');
say('discriminator is an operator input naming no printed cell, and the engine reads its stored value BARE — the');
say('definition carries no `map_option_by_value` — so the option set the portal holds IS the set of spellings the');
say('engine will ever see. It is asserted equal to the branch names the map declares.');
say('');
say('| role | input key | property | live type | note |');
say('|---|---|---|---|---|');
for (const r of routeRows) say(`| ${r.what} | \`${r.key}\` | \`${r.hs_name}\` | ${r.l.type}/${r.l.fieldType} | ${r.note} |`);
say('');
if (!routeProblems.length) say('**No problem.** The discriminator holds exactly the branches the route declares, both branch properties are live, and the two branches are two distinct properties — which is the whole point: one property serving both would hold an SSN on one filed copy and an EIN on the next, under one name.');
else for (const p of routeProblems) say(`- **${p}**`);
say('');

say('## The standing ruling — every reused property names this form, read from the portal');
say('');
say('These three were created by earlier passes, so "at create time" for them was a previous cycle.');
say('`hs-provision.mjs` cannot close it — it creates and never patches — so `hs-describe-reused-433d.mjs` patches');
say('descriptions and nothing else. **This section is the portal\'s answer, not that tool\'s.**');
say('');
say('The patch APPENDS and never replaces. Two of these three carry the backbone convention — "Shared across the');
say('433 series - named for the fact, not the form" — and rewriting that to enumerate forms would erase a');
say('convention to satisfy a later one, which is what [R-21] refuses. The creator attribution and the shared');
say('sentence both stay; this form is added after them.');
say('');
say(`${reuseDescOk.length} of ${reuseRows.length} reused propert(ies) carry a live description naming 433-D.`);
say('');
if (reuseDescShort.length) {
  say('**These do not:**');
  say('');
  say('| property | live description |');
  say('|---|---|');
  for (const { p, l } of reuseDescShort) say(`| \`${p.hs_name}\` | ${bar(l.description || '_(none)_').slice(0, 300)} |`);
  say('');
}
say('| property | 433-D input key | created by | live type | live group | names 433-D |');
say('|---|---|---|---|---|---|');
for (const p of reuseRows) {
  const l = live.get(p.hs_name);
  say(`| \`${p.hs_name}\` | \`${p.key}\` | ${p.created_by_form} | ${l ? `${l.type}/${l.fieldType}` : '**ABSENT**'} | ${l ? l.groupName : '—'} | ${l && namesThisForm(l.description) ? 'yes' : '**no**'} |`);
}
say('');

say('## The option values, re-asserted from the portal side');
say('');
say('`assert-intake-keys.mjs` asserts that every value a DEFINITION emits resolves against the spellings this');
say('form\'s engine accepts. This asserts the same thing about what the PORTAL actually holds, because the two');
say('can differ: an option silently dropped or renamed at create time leaves a live property whose stored values');
say('the engine cannot resolve, and the definition file still looks right. An enumeration the portal holds with');
say('ZERO options is reported as a problem rather than as a clean pass over an empty set ([R-04]).');
say('');
say(`${optionValues} live option value(s) across ${optionChecked} enumeration propert(ies) checked in both directions.`);
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
say('`created here` marks the properties whose live description opens with this form and this key, and `reused`');
say('marks the three this form binds rather than creates. Every row is read from the portal.');
say('');
say('| property (from the portal) | type | fieldType | options (portal) | group | input key | entry | origin |');
say('|---|---|---|---|---|---|---|---|');
for (const { p, l } of ok) {
  const origin = p.scope === 'reuse' ? `reused (${p.created_by_form})`
    : (l.description || '').startsWith('433-D (input key:') ? 'created here' : '-';
  say(`| \`${l.name}\` | ${l.type} | ${l.fieldType} | ${optVals(l.options) || '-'} | ${l.groupName} | \`${p.key}\` | ${p.entry} | ${origin} |`);
}
say('');

writeFileSync('adapters/hubspot/433d.provisioning-readback.md', L.join('\n') + '\n');
console.log('433-D read-back, FROM THE PORTAL:');
console.log(`  ${props.length} definitions; ${ok.length} matching, ${decided.length} differing with a recorded decision, ${wrong.length} wrong, ${missing.length} missing, ${missingReuse.length} REUSED-and-missing.`);
console.log(`  created by this pass ${createdHere.length}; reused ${reuseRows.length} (${reuseDescOk.length} naming 433-D).`);
console.log(`  subject route: ${routeRows.length} row(s) read back, ${routeProblems.length} problem(s).`);
console.log(`  option values re-asserted from the portal: ${optionValues} across ${optionChecked} propert(ies); ${optionProblems.length} problem(s).`);
console.log(`  portal now: ${custom.length} custom contact properties, headroom ${CEILING - custom.length}.`);
console.log('  report -> adapters/hubspot/433d.provisioning-readback.md');
if (missing.length || missingReuse.length || wrong.length || optionProblems.length || routeProblems.length || reuseDescShort.length) {
  console.error(`\nSTOP - ${missing.length} missing, ${missingReuse.length} reused-and-missing, ${wrong.length} wrong, ${optionProblems.length} option problem(s), ${routeProblems.length} route problem(s), ${reuseDescShort.length} reused propert(ies) not naming 433-D.`);
  console.error('  A property name cannot be renamed, so a wrong one is fixed by deciding what to do about it, not by re-running this.');
  process.exitCode = 3;
}
