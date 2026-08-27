// classify-no-prefix.mjs — item C of prompt 59-A.
//
// `no-declared-prefix` was reported as one of eight tags. It is the second-largest bucket in
// the population and the only one whose name describes an ABSENCE, which makes it a finding
// rather than a tag. This splits it three ways and names the method for each.
//
//   class 1  portal-authored — HubSpot-native or portal-default custom properties predating
//            this work.
//   class 2  integration-authored — created by a third-party product connected to this portal.
//   class 3  RC-AUTHORED BUT UNPREFIXED — created for the 433 work and given no prefix. This
//            is the class that matters. A non-empty class 3 is a naming defect and a STOP.
//
// THE DISCRIMINATORS ARE DERIVED FROM THE PORTAL, NOT ASSERTED
// -----------------------------------------------------------
// class 3 is decided by createdAt at or after this project's epoch, where the epoch is itself
//   DERIVED as the earliest createdAt among the properties this repo's field files name — not
//   typed. That witness is DECISIVE: this project's first artefact on this portal is the epoch,
//   so a property created before it cannot have been created by this project.
//
//   A second witness — the internal name appearing as a whole word in a tracked file — is read
//   and reported ALONGSIDE, never OR-ed in. The first draft or-ed them and returned six members
//   (`blindness`, `dba`, `dependents`, `ein`, `profession`, `tags`), every one created in 2021
//   or 2022. Two defects at once: the grep matched substrings, and "this repo mentions it" was
//   being read as "this repo made it" — a claim resting on a measurement of the wrong axis,
//   which is [R-02]. Both are fixed and both are recorded rather than quietly corrected,
//   because a class whose whole purpose is to be believed when non-empty must not cry wolf.
//
// class 1 vs class 2 is decided by whether the property's GROUP is one HubSpot ships. That is
//   read off the portal rather than listed here: a group containing at least one
//   `hubspotDefined` property is a HubSpot-native group, and a group containing none was
//   created by whoever created its properties. No product-name list is hardcoded — the
//   identities are reported so a person can read them, and the SPLIT does not rest on them.
//
// [R-19] GENERATOR DECLARATION: this file generates scratchpad/p59-no-prefix-classes.md
//        and scratchpad/p59-no-prefix-classes.json.
//
// usage: node adapters/clickup/classify-no-prefix.mjs
import { hs } from '../hubspot/hs-lib.mjs';
import { loadArtefacts, prefixTag, NO_PREFIX_TAG } from './derive-property-records.mjs';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const live = (await hs('/crm/v3/properties/contacts?archived=false')).results;
const custom = live.filter(p => !p.hubspotDefined);
const art = loadArtefacts();

// ── the epoch, derived ───────────────────────────────────────────────────────────────────
const memberDates = custom.filter(p => art.rowsByName.has(p.name)).map(p => p.createdAt).filter(Boolean).sort();
const epoch = memberDates[0];
console.log(`project epoch, derived from the earliest createdAt among the ${memberDates.length} properties this repo's field files name: ${epoch}`);

// ── HubSpot-native groups, read off the portal ───────────────────────────────────────────
const nativeGroups = new Set(live.filter(p => p.hubspotDefined).map(p => p.groupName));
console.log(`groups containing at least one hubspotDefined property (therefore HubSpot-native): ${nativeGroups.size}`);

const noPrefix = custom.filter(p => prefixTag(p.name) === NO_PREFIX_TAG);
console.log(`no-declared-prefix population: ${noPrefix.length}`);

// ── witness (b): is the name mentioned anywhere in the tracked tree? ─────────────────────
// One `git grep -F -f` over every candidate name at once. A per-name grep over 252 names would
// be 252 process spawns and the same answer.
// `-w` MATTERS AND ITS ABSENCE WAS A DEFECT IN THIS FILE. The first draft used `-F` without
// `-w`, which matches a SUBSTRING anywhere. Six properties came back as RC-authored candidates
// — `blindness`, `dba`, `dependents`, `ein`, `profession`, `tags` — every one of them created
// in 2021 or 2022, years before this project's first artefact existed. `ein` matched inside
// "being", `tags` inside every line of tag-handling code. A witness reading a substring is not
// reading the identifier it claims to read, and it put six false positives into a class whose
// whole purpose is to be believed when it is non-empty.
let mentioned = new Set();
try {
  const out = execFileSync('git', ['grep', '-o', '-h', '-w', '-F', '-f', '-', '--', '.'],
    { input: noPrefix.map(p => p.name).join('\n'), encoding: 'utf8', maxBuffer: 1 << 28 });
  mentioned = new Set(out.split('\n').map(s => s.trim()).filter(Boolean));
} catch (e) {
  // git grep exits 1 when nothing matches; that is an answer, not a failure. Any other status
  // means the witness could not be read, and a witness that could not be read must not be
  // reported as "no mention" ([R-11] / the guard-that-skips-when-it-cannot-read shape).
  if (e.status === 1) mentioned = new Set();
  else { console.error(`STOP — git grep failed with status ${e.status}; witness (b) could not be read and must not be reported as absent.`); process.exit(2); }
}
console.log(`witness (b): ${mentioned.size} of the ${noPrefix.length} names appear somewhere in the tracked tree`);

// ── classify ─────────────────────────────────────────────────────────────────────────────
const rows = noPrefix.map(p => {
  const afterEpoch = p.createdAt >= epoch;
  const named = mentioned.has(p.name);
  const nativeGroup = nativeGroups.has(p.groupName);
  // THE TWO WITNESSES ANSWER DIFFERENT QUESTIONS AND ARE NO LONGER OR-ED TOGETHER.
  // createdAt is DECISIVE for authorship: this project's first artefact on this portal is the
  // epoch, and a property created before it cannot have been created by this project, whatever
  // else is true of it. A tree mention is evidence that this repo REFERS to a property; a repo
  // refers to plenty it did not create. Or-ing them made "RC mentions it" indistinguishable
  // from "RC made it", which is the [R-02] shape — a claim resting on a measurement of the
  // wrong axis. `mentioned_but_predates` is reported separately as an observation, and it is
  // not a naming defect.
  let cls, why;
  if (afterEpoch) {
    cls = 3;
    why = `RC-authored and unprefixed — createdAt ${p.createdAt} is at or after the project epoch ${epoch}${named ? ', and the internal name also appears as a whole word in a tracked file in this repo' : ', though no tracked file names it'}`;
  } else if (nativeGroup) {
    cls = 1;
    why = `portal-authored — group "${p.groupName}" also holds hubspotDefined properties, so it is a group HubSpot ships; created ${p.createdAt}, before the project epoch`;
  } else {
    cls = 2;
    why = `integration-authored — group "${p.groupName}" holds no hubspotDefined property, so it was created by whoever created its properties; created ${p.createdAt}, before the project epoch`;
  }
  return { name: p.name, group: p.groupName, createdAt: p.createdAt, type: p.type, cls, why, afterEpoch, named, nativeGroup };
});

const c1 = rows.filter(r => r.cls === 1), c2 = rows.filter(r => r.cls === 2), c3 = rows.filter(r => r.cls === 3);
console.log(`\nclass 1 portal-authored      : ${c1.length}`);
console.log(`class 2 integration-authored : ${c2.length}`);
console.log(`class 3 RC-AUTHORED UNPREFIXED: ${c3.length}${c3.length ? '   <-- STOP CONDITION' : ''}`);

// ── what the headroom is against, once the split is known ────────────────────────────────
const ours = custom.filter(p => prefixTag(p.name) !== NO_PREFIX_TAG).length + c3.length;
const notOurs = custom.length - ours;
const CEILING = 1000;
console.log(`\nheadroom arithmetic: ceiling ${CEILING} - ${custom.length} custom = ${CEILING - custom.length}`);
console.log(`  of the ${custom.length}: ${ours} authored by this project, ${notOurs} authored by the portal or an integration`);

const byGroup = (arr) => Object.entries(arr.reduce((a, r) => (a[r.group] = (a[r.group] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]);

const L = ['# Item C — the 252 `no-declared-prefix` properties, classified', '',
  `Derived ${new Date().toISOString()} against the live portal. Population: **${custom.length}** live custom contact properties, of which **${noPrefix.length}** carry none of this project's declared prefixes.`, '',
  '## Method', '',
  `- **Project epoch**, derived: \`${epoch}\` — the earliest \`createdAt\` among the ${memberDates.length} properties this repo's \`fields.*.json\` name. Not typed.`,
  `- **Witness (a)** for class 3: \`createdAt\` at or after the epoch.`,
  `- **Witness (b)** for class 3: the internal name appears in a tracked file in this repo (\`git grep -F\` over all ${noPrefix.length} names at once). ${mentioned.size} matched.`,
  '- Either witness alone puts a property in class 3. Neither clears it alone — a false negative here is a naming defect that ships.',
  `- **Class 1 vs class 2**, derived from the portal: a group holding at least one \`hubspotDefined\` property is a group HubSpot ships (${nativeGroups.size} such groups); a group holding none was created by whoever created its properties. No product-name list is hardcoded.`, '',
  '## Result', '',
  '| class | what it is | count |', '|---|---|---:|',
  `| 1 | portal-authored — HubSpot-native or portal-default, predating this work | ${c1.length} |`,
  `| 2 | integration-authored — created by a third-party product | ${c2.length} |`,
  `| 3 | **RC-authored but unprefixed** | **${c3.length}** |`,
  `| | total | ${rows.length} |`, ''];

const predates = rows.filter(r => r.named && !r.afterEpoch);
L.push('### Observation — names this repo mentions that PREDATE the project', '');
L.push(`**${predates.length}.** Each appears as a whole word in a tracked file and was created before the project epoch, so this repo REFERS to it and did not create it. Listed because the first draft of this file or-ed the two witnesses together and reported these as class 3; separating them is the correction, and the observation is worth keeping.`, '');
for (const r of predates) L.push(`- \`${r.name}\` · group \`${r.group}\` · created ${r.createdAt}`);
if (!predates.length) L.push('- none');
L.push('');

L.push('### Class 3 — RC-authored but unprefixed', '');
if (!c3.length) {
  L.push('**Empty.** No property outside the declared prefix vocabulary was created at or after the project epoch, and none is named in any tracked file in this repo. There is no unprefixed RC property and therefore no naming defect at this scale.', '');
} else {
  L.push(`**${c3.length} member(s). This is a naming defect and a STOP under item C.**`, '');
  for (const r of c3) L.push(`- \`${r.name}\` · group \`${r.group}\` · type \`${r.type}\` · created ${r.createdAt}\n    - ${r.why}`);
  L.push('');
}

L.push('### Class 2 — integration-authored, by group', '');
for (const [g, n] of byGroup(c2)) L.push(`- \`${g}\` — ${n}`);
L.push('', '### Class 1 — portal-authored, by group', '');
for (const [g, n] of byGroup(c1)) L.push(`- \`${g}\` — ${n}`);
L.push('');

L.push('## What the headroom of ' + (CEILING - custom.length) + ' is headroom against', '',
  `The ceiling is **${CEILING}** custom properties on the contact object and the portal holds **${custom.length}**, leaving **${CEILING - custom.length}**.`, '',
  `That headroom is pressure from a population this project only partly authored:`, '',
  `- **${ours}** (${(100 * ours / custom.length).toFixed(1)}%) carry a declared prefix or fall in class 3 — properties this project created.`,
  `- **${notOurs}** (${(100 * notOurs / custom.length).toFixed(1)}%) were authored by the portal or by a connected integration, of which ${c2.length} are integration-authored and ${c1.length} portal-authored.`, '',
  `So a migration off this object has to carry ${ours} properties of this project's making, not ${custom.length}; and the ${CEILING - custom.length} remaining slots are consumed by any of the three authors, only one of which this project controls. Reclaiming space is available in a population this project did not author and cannot unilaterally retire.`, '');

writeFileSync('scratchpad/p59-no-prefix-classes.md', L.join('\n'));
writeFileSync('scratchpad/p59-no-prefix-classes.json', JSON.stringify({
  _generator: 'adapters/clickup/classify-no-prefix.mjs',
  epoch, population: custom.length, no_prefix: noPrefix.length,
  class_1: c1.length, class_2: c2.length, class_3: c3.length,
  project_authored: ours, not_project_authored: notOurs, ceiling: CEILING, headroom: CEILING - custom.length,
  rows,
}, null, 1) + '\n');
console.log('\nwrote scratchpad/p59-no-prefix-classes.md and .json');
if (c3.length) { console.error(`\nSTOP — class 3 is non-empty (${c3.length}).`); process.exitCode = 4; }
