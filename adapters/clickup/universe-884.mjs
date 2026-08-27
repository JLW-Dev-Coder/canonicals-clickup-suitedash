// universe-884.mjs — item A of prompt 59-A.
//
// THE QUESTION. Prompt 59 said 884; the portal returns 959. Replacing the number without
// knowing what the old one counted is exactly what [R-07] was earned by — two figures for one
// thing where the real answer was that they counted two different universes and NEITHER was
// wrong. If 884 is a real universe then something in this tree is still counting it, and that
// matters more than the arithmetic.
//
// THE METHOD. Enumerate candidate universes over the LIVE portal, compute each, and report
// which (if any) lands on 884 exactly. Nothing is asserted; every candidate is a predicate
// evaluated against what the portal returns on this run. A candidate that misses is reported
// with its figure and its distance, because "none of these" is only a finding if the ones
// tried are named.
//
// [R-19] GENERATOR DECLARATION: this file generates scratchpad/p59-universe-884.md.
//
// usage: node adapters/clickup/universe-884.mjs
import { hs } from '../hubspot/hs-lib.mjs';
import { loadArtefacts, prefixTag, NO_PREFIX_TAG } from './derive-property-records.mjs';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TARGET = 884;

const live = (await hs('/crm/v3/properties/contacts?archived=false')).results;
let archivedProps = [];
try { archivedProps = (await hs('/crm/v3/properties/contacts?archived=true')).results; } catch { archivedProps = []; }
const art = loadArtefacts();

const custom = live.filter(p => !p.hubspotDefined);
const groups = [...new Set(custom.map(p => p.groupName))].sort();

const cand = [];
const add = (label, n, note) => cand.push({ label, n, note, delta: n - TARGET });

add('every property on the contact object', live.length, 'includes the 405 HubSpot-defined ones');
add('every CUSTOM property, archived=false — THE FIGURE THIS PROJECT USES', custom.length, 'hubspotDefined === false, live');
add('every custom property including archived', custom.length + archivedProps.filter(p => !p.hubspotDefined).length, `${archivedProps.filter(p => !p.hubspotDefined).length} archived custom propert(ies) exist on this portal`);
add('custom, excluding readOnlyDefinition', custom.filter(p => !p.modificationMetadata?.readOnlyDefinition).length, 'a definition this portal will not let anyone edit');
add('custom, excluding calculated', custom.filter(p => !p.calculated).length, 'calculated properties have no stored value to migrate');
add('custom, excluding hidden', custom.filter(p => !p.hidden).length, null);
add('custom carrying a declared prefix (irs433*/vlp)', custom.filter(p => prefixTag(p.name) !== NO_PREFIX_TAG).length, 'the subset this project named');
add('custom carrying NO declared prefix', custom.filter(p => prefixTag(p.name) === NO_PREFIX_TAG).length, null);
add('custom named by a row in fields.*.json', custom.filter(p => art.rowsByName.has(p.name)).length, 'the properties this repo binds');
add('sum of every fields.*.json row (rows, not distinct names)', [...art.rowsByName.values()].reduce((a, b) => a + b.length, 0), 'counts a reused name once per binding form');

// group-exclusion candidates: for each group, custom-minus-that-group
for (const g of groups) {
  const n = custom.filter(p => p.groupName !== g).length;
  if (Math.abs(n - TARGET) <= 6) add(`custom, excluding portal group "${g}"`, n, `that group holds ${custom.filter(p => p.groupName === g).length}`);
}
// created-before-a-date candidates, one per distinct creation day this project used
const projectDays = [...new Set(custom.filter(p => art.rowsByName.has(p.name)).map(p => p.createdAt.slice(0, 10)))].sort();
for (const d of projectDays) {
  const n = custom.filter(p => p.createdAt.slice(0, 10) < d).length;
  add(`custom created strictly before ${d}`, n, 'the portal as it stood before one of this project\'s provisioning runs');
}
// the same, inclusive
for (const d of projectDays) {
  const n = custom.filter(p => p.createdAt.slice(0, 10) <= d).length;
  add(`custom created on or before ${d}`, n, 'the portal as it stood after one of this project\'s provisioning runs');
}

const exact = cand.filter(c => c.n === TARGET);
cand.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));

// What the tree itself says. If 884 is a real universe, something here still counts it.
let treeHits = '';
try {
  treeHits = execFileSync('git', ['grep', '-n', '-F', '884', '--', 'adapters', 'scratchpad', '*.md'], { encoding: 'utf8' });
} catch { treeHits = '(git grep found no occurrence of 884 in adapters/, scratchpad/ or the root markdown)\n'; }

const L = [];
L.push('# Item A — what universe produces 884?', '');
L.push(`Live portal read on this run: **${live.length}** contact properties, of which **${custom.length}** are custom (\`hubspotDefined === false\`, \`archived=false\`) and **${live.length - custom.length}** are HubSpot-defined.`, '');
L.push(`Target under test: **${TARGET}**. Candidates evaluated: **${cand.length}**, each a predicate over what the portal returned on this run.`, '');
if (exact.length) {
  L.push(`## RECOVERED — ${exact.length} candidate universe(s) land on ${TARGET} exactly`, '');
  for (const c of exact) L.push(`- **${c.label}** = ${c.n}${c.note ? ` — ${c.note}` : ''}`);
  L.push('', `So ${TARGET} was a correct count of a different universe, not a wrong count of this one.`, '');
} else {
  L.push(`## NOT RECOVERED — no candidate lands on ${TARGET}`, '');
  L.push(`None of the ${cand.length} universes tested returns ${TARGET} against the live portal. The nearest are listed below with their distance. On this evidence ${TARGET}'s universe cannot be recovered from the portal as it stands, and the figure is abandoned rather than carried.`, '');
  L.push('That is a bounded claim, and the bound is stated: it rules out the candidates below, not every universe that could exist. A count taken at an earlier commit, or against a portal state since changed, is not reachable from here — HubSpot does not serve a property set as of a past date.', '');
}
L.push('## Every candidate, by distance from the target', '');
L.push('| candidate universe | count | delta |', '|---|---:|---:|');
for (const c of cand) L.push(`| ${c.label}${c.note ? ` <br><sub>${c.note}</sub>` : ''} | ${c.n} | ${c.delta > 0 ? '+' : ''}${c.delta} |`);
L.push('');
L.push('## Does anything in the tree still count 884?', '');
L.push('```text');
L.push(treeHits.trim() || '(no occurrence)');
L.push('```');
L.push('');

writeFileSync('scratchpad/p59-universe-884.md', L.join('\n'));

console.log(`live=${live.length} custom=${custom.length} target=${TARGET} candidates=${cand.length}`);
console.log(exact.length ? `RECOVERED by ${exact.length}: ${exact.map(c => c.label).join(' | ')}` : 'NOT RECOVERED by any candidate');
console.log('\nnearest 8:');
for (const c of cand.slice(0, 8)) console.log(`  ${String(c.n).padStart(5)}  ${c.delta > 0 ? '+' : ''}${String(c.delta).padStart(4)}   ${c.label}`);
console.log('\ntree mentions of 884:');
console.log(treeHits.trim() ? treeHits.trim().split('\n').map(l => '  ' + l).join('\n') : '  (none)');
console.log('\nwrote scratchpad/p59-universe-884.md');
