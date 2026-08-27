// p59-register-clickup-boundary.mjs — brings adapters/clickup/ into the sweep register.
//
// WHY THIS IS NOT OPTIONAL. adapters/clickup/ is a NEW adapters subdirectory. Every sweep in
// this engine selects by path and extension — guard-sweep, exclusion-sweep and success-sweep
// take adapters/pdf/*.mjs and adapters/hubspot/*.mjs by name, count-sweep takes named .json
// artefacts under adapters/pdf/maps/, [SB-14] takes *.md under those two directories — so a
// third adapters subdirectory is outside all of them by the shape of every selector, and
// [SB-92]'s roots are derived from the register, so an unregistered directory is not even in
// the universe the residual is taken over. Committing it unregistered would plant exactly the
// state [D-24] was raised on: files nobody sweeps, in a place nobody looks, reported clean.
//
// [SB-92]'s roots come from every entry's claims(), so this entry brings the directory INTO the
// universe on the same run that claims it — and every tracked file there must then be claimed
// or the residual names it.
//
// PATCHED BY LINE, NOT BY BLOB, and asserted after. [R-19] GENERATOR DECLARATION: this file
// edits adapters/pdf/sweep-boundary.mjs in place.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/sweep-boundary.mjs';
const lines = readFileSync(P, 'utf8').split('\n');

const i = lines.findIndex(l => l.includes("{ id: 'SB-27', sweep: 'every sweep'"));
if (i < 0) { console.error('STOP — could not locate the [SB-27] entry. Nothing patched.'); process.exit(2); }
// find the end of the SB-27 object: the first line after it ending in `},`
let end = i;
while (end < lines.length && !/^\s*.*\}\s*,\s*$/.test(lines[end])) end++;
if (end >= lines.length) { console.error('STOP — could not find the end of the [SB-27] entry.'); process.exit(3); }

const ENTRY = [
  ``,
  `  { id: 'SB-28', sweep: 'every sweep', kind: 'claiming', path: 'adapters/clickup/*',`,
  `    what: 'Removes the THIRD adapters subdirectory. Every sweep in this engine selects by path AND extension — guard-sweep, exclusion-sweep and success-sweep enumerate adapters/pdf and adapters/hubspot by name, count-sweep takes named .json artefacts under adapters/pdf/maps, [SB-14] takes *.md under those two directories — so adapters/clickup is outside all of them by the shape of every selector, which is [R-15] a third time. It is registered on the run that creates it rather than found in a residual two prompts later, which is what happened to 433d.pairs.json and to 433b.lineage.json.',`,
  `    claim: 'These tools READ the live HubSpot portal and this repo\\u2019s field files and WRITE one artefact set, adapters/hubspot/cf-mirror-export.*, whose renderings are re-derived from their own JSON and compared byte for byte by adapters/clickup/assert-mirror-export.mjs on every run of npm run sweeps. Nothing here is a definition source and nothing here is provisioned from: the export is downstream of adapters/hubspot/fields.*.json, which [SB-15] and [SB-16] already claim. THE ONE THING THIS ENTRY DOES NOT CLAIM, stated rather than left as a silence: these files are NOT yet inside guard-sweep\\u2019s vacuous-guard sweep. Their catches and empty-set predicates are undisposed, and disposing them is a cycle of its own rather than a line in this one. That is an [R-14] exclusion — declared, sized, and owed.',`,
  `    assertedBy: 'adapters/clickup/assert-mirror-export.mjs, wired into npm run sweeps, which re-renders the markdown and the CSV from the committed JSON and refuses any difference; and adapters/clickup/assert-prefix-not-provenance.mjs, also wired in, which asserts over the live population that no derived provenance rests on a name prefix and that the eight prefix tags partition the population exactly.',`,
  `    count: () => ls('adapters/clickup').length,`,
  `    claims: () => ls('adapters/clickup'),`,
  `    // THE HALF THAT COULD ROT is the [R-19] declaration each tool carries and the probe`,
  `    // register\\u2019s claim that nothing was left behind on the ClickUp list. Both are read out of`,
  `    // the files rather than trusted from the sentence above.`,
  `    crosscheck: () => {`,
  `      const out = [];`,
  `      for (const p of ls('adapters/clickup').filter((f) => f.endsWith('.mjs'))) {`,
  `        if (!r(p).includes('GENERATOR DECLARATION')) out.push(\`[SB-28] \${p} carries no [R-19] GENERATOR DECLARATION. A tool that does not say what it writes cannot be checked against it.\`);`,
  `      }`,
  `      try {`,
  `        const reg = JSON.parse(r('adapters/clickup/write-probe.json'));`,
  `        const open = (reg.probes || []).filter((x) => x.state !== 'torn_down');`,
  `        if (open.length) out.push(\`[SB-28] \${open.length} ClickUp write probe(s) are not torn down: \${open.map((x) => x.task_id).join(', ')}. A probe left live is synthetic state on a target this repo does not own.\`);`,
  `      } catch (e) { out.push('[SB-28] adapters/clickup/write-probe.json will not parse, so the claim that every probe was torn down cannot be checked. An unreadable register is not an empty one.'); }`,
  `      return out;`,
  `    } },`,
];

lines.splice(end + 1, 0, ...ENTRY);
writeFileSync(P, lines.join('\n'));

const after = readFileSync(P, 'utf8');
const must = [`id: 'SB-28'`, `claims: () => ls('adapters/clickup')`, `GENERATOR DECLARATION`, `write-probe.json`];
const missing = must.filter(m => !after.includes(m));
console.log(`inserted [SB-28] after the [SB-27] entry (line ${end + 1})`);
if (missing.length) { console.error('STOP — expected text absent after patch:'); for (const m of missing) console.error('  ' + JSON.stringify(m)); process.exit(4); }
console.log('every expected string present.');
