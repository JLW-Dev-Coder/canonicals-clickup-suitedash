// p59c-boundary-sb29.mjs — commit 2: the two mirror-export artefacts no other boundary entry
// reaches are claimed, and the one vacuous guard that claim introduces is disposed.
//
// [SB-29] covers cf-mirror-export.csv and cf-mirror-export.sha256. THE OTHER TWO ARE
// DELIBERATELY NOT CLAIMED: the .json is taken by [SB-15] and the .md by [SB-14], and widening
// this entry over them would be a file two entries claim, which [SB-92] refuses.
//
// [G-299] disposes the one catch [SB-29]'s cross-check adds.
//
// PATCHED BY LINE, NOT BY BLOB, and asserted after.
// [R-19] GENERATOR DECLARATION: this file edits adapters/pdf/sweep-boundary.mjs and
//   adapters/pdf/guard-sweep.mjs in place.
import { readFileSync, writeFileSync } from 'node:fs';

const CHECKER = 'adapters/hubspot/check-cf-mirror-export.mjs';

// ── 1. the boundary register ────────────────────────────────────────────────────────────
{
  const P = 'adapters/pdf/sweep-boundary.mjs';
  const lines = readFileSync(P, 'utf8').split('\n');
  const at = lines.findIndex((l) => l.includes("// ═══ THE RESIDUAL — [D-24] ═══"));
  if (at < 0) { console.error('STOP — could not locate the residual marker in sweep-boundary.mjs.'); process.exit(2); }

  const entry = [
    "  { id: 'SB-29', sweep: 'every sweep', kind: 'claiming', path: 'adapters/hubspot/cf-mirror-export.csv, cf-mirror-export.sha256',",
    "    what: 'Removes the two members of the mirror-export artefact set that no other entry reaches. THE OTHER TWO ARE DELIBERATELY NOT CLAIMED HERE: cf-mirror-export.json is taken by [SB-15] (adapters/hubspot/*.json not in sweptFiles) and cf-mirror-export.md by [SB-14] (adapters/hubspot/*.md), and widening this entry over them would be a file two entries claim, which [SB-92] refuses. A .csv and a .sha256 are outside every selector in the engine by extension, which is [R-15] a fourth time.',",
    `    claim: 'They are GENERATED FROM cf-mirror-export.json and cannot drift from it. ${CHECKER} re-renders both from the committed JSON through the same module the builder rendered them with, compares byte for byte, and recomputes every digest in the .sha256 including one per hand-off batch. The cover is STRONGER than the manifest rather than weaker: no figure in either file was typed, and a difference is a STOP rather than a note. The .csv additionally carries no client data — property DEFINITIONS only, built from /crm/v3/properties/contacts, which returns schema; the contact object is never queried. Its one-path exception in .gitignore is documented there against the client-data rule it sits under.',`,
    `    assertedBy: '${CHECKER}, wired into npm run sweeps, which performs eleven checks over the artefact set: the header proved to carry exactly the seven declared fields, body_sha256 recomputed over the records array under the serialisation rule the header itself states, both renderings re-derived byte for byte, every digest recomputed, the batch structure proved to cover every record exactly once, record_count and the prefix-tag partition proved equal and total, every derived field proved non-blank and carrying either a source or a reason, every portal fact proved present, name containment recomputed across the whole population, and the CSV proved to hold one data line per record so no embedded newline escapes its field.',`,
    "    count: () => ls('adapters/hubspot').filter((p) => /^adapters\\/hubspot\\/cf-mirror-export\\.(csv|sha256)$/.test(p)).length,",
    "    claims: () => ls('adapters/hubspot').filter((p) => /^adapters\\/hubspot\\/cf-mirror-export\\.(csv|sha256)$/.test(p)),",
    '    // THE HALF THAT COULD ROT is the claim that something re-derives them. It is read out of',
    '    // package.json rather than trusted from the sentence above — a re-derivation nobody runs is',
    '    // a claim nobody knows is false, which is [R-34].',
    '    crosscheck: () => {',
    '      const out = [];',
    "      let scripts = '';",
    "      try { scripts = JSON.stringify(JSON.parse(r('package.json')).scripts || {}); } catch { scripts = ''; }",
    `      const checker = '${CHECKER}';`,
    '      if (!existsSync(checker)) out.push(`[SB-29] ${checker} is not in this tree, and it is the whole ground of this entry.`);',
    '      else if (!scripts.includes(checker)) out.push(`[SB-29] no npm script runs ${checker}, so nothing re-derives the renderings and every one of them is an unchecked artefact.`);',
    "      for (const f of ['adapters/hubspot/cf-mirror-export.json', 'adapters/hubspot/cf-mirror-export.md']) {",
    '        if (!existsSync(f)) out.push(`[SB-29] ${f} is absent; the two files this entry claims are rendered from it and cannot be checked without it.`);',
    '      }',
    '      return out;',
    '    } },',
    '',
  ];
  lines.splice(at, 0, ...entry);
  writeFileSync(P, lines.join('\n'));
  if (!readFileSync(P, 'utf8').includes("id: 'SB-29'")) { console.error('STOP — [SB-29] absent after patch.'); process.exit(3); }
  console.log(`ok  [SB-29] inserted before the residual at line ${at + 1}`);
}

// ── 2. the guard disposition the cross-check introduces ─────────────────────────────────
{
  const P = 'adapters/pdf/guard-sweep.mjs';
  const lines = readFileSync(P, 'utf8').split('\n');
  const why = "THE EMPTY STRING IS THE LOUD DIRECTION, AND IT IS [G-243]'S GROUND ON THE NEIGHBOURING ENTRY. [SB-29] excuses the mirror-export renderings on the ground that a standing script re-derives them, and this reads package.json to check that. An unreadable package.json yields the empty string, `scripts.includes(checker)` is then false, and the entry is reported CONTRADICTED -- 'nothing re-derives the renderings, so every one of them is an unchecked artefact' -- and the run exits non-zero. There is no arrangement of this catch returning less that produces a clean sweep. It is deliberately not a throw, for the same reason as [G-243]: a boundary register whose report depends on one file parsing should say what it could not read in the row that depends on it, rather than take down every other entry in the same run.";
  const entry = [
    `  { id: 'G-299', file: 'sweep-boundary.mjs', anchor: ${JSON.stringify("try { scripts = JSON.stringify(JSON.parse(r('package.json')).scripts || {}); } catch { scripts = ''; }")}, verdict: 'sound',`,
    `    why: ${JSON.stringify(why)} },`,
  ];
  const i = lines.findIndex((l) => l.includes("{ id: 'G-300', file: 'assert-name-sets-imported.mjs'"));
  if (i < 0) { console.error('STOP — could not locate [G-300].'); process.exit(4); }
  lines.splice(i, 0, ...entry);
  writeFileSync(P, lines.join('\n'));
  if (!readFileSync(P, 'utf8').includes("id: 'G-299'")) { console.error('STOP — [G-299] absent after patch.'); process.exit(5); }
  console.log(`ok  [G-299] inserted before [G-300] at line ${i + 1}`);
}
