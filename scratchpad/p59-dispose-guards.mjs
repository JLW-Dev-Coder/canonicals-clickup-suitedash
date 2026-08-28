// p59-dispose-guards.mjs — disposes the nine guard sites the two new assertion tools added.
//
// [R-12]: a refactor of a guard is a change to the guard, and a NEW guard is one too. Eight
// sites came in with adapters/pdf/assert-name-sets-imported.mjs and one with [SB-29]'s
// crosscheck in sweep-boundary.mjs, and guard-sweep named every one. This writes the verdicts
// it asked for; it does not suppress them.
//
// THE COMMON ANSWER, and it is the same one in eight of the nine. Every empty-input path in
// assert-name-sets-imported.mjs makes the run LOUD rather than quiet, and it is the BASELINE
// that does it: the tool asserts its 24 carried sites in BOTH directions, so any reader that
// goes blind — an unreadable root, a dead regex, a declaration syntax that changed — produces
// zero hits, and zero hits makes all 24 baselined entries STALE at once and exits non-zero.
// The vacuous direction cannot reach a pass. [R-04]'s explicit zero-examined STOP was added
// beside it so the failure also NAMES the cause rather than arriving as 24 stale rows.
//
// PATCHED BY LINE, NOT BY BLOB, and asserted after.
// [R-19] GENERATOR DECLARATION: this file edits adapters/pdf/guard-sweep.mjs in place.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/guard-sweep.mjs';
const lines = readFileSync(P, 'utf8').split('\n');

const F = 'assert-name-sets-imported.mjs';
const BASE = 'The BASELINE below asserts its 24 carried sites in BOTH directions, so a reader that goes blind here yields zero hits and makes all 24 stale at once, which exits non-zero. The vacuous direction cannot reach a pass, and [R-04]\\u2019s zero-examined STOP beside it names the cause rather than leaving 24 stale rows to be read backwards.';

const E = (id, file, anchor, why) => [
  `  { id: '${id}', file: '${file}', anchor: ${JSON.stringify(anchor)}, verdict: 'sound',`,
  `    why: ${JSON.stringify(why)} },`,
];

const entries = [
  ...E('G-291', F, 'try { names = readdirSync(root); } catch { continue; }',
    `AN UNREADABLE ROOT SKIPS FILES, AND SKIPPED FILES CANNOT GO QUIET. A root that will not list contributes no sources, so any name set only that root retyped stops being found. ${BASE} Continuing rather than throwing is deliberate: adapters/clickup did not exist for most of this repo's life and a root that is legitimately absent should not take down a sweep that has three others to read.`),
  ...E('G-292', F, 'try { if (statSync(p).isDirectory()) continue; } catch { continue; }',
    `A PATH THAT WILL NOT STAT IS NOT A FILE THIS SWEEP CAN READ, and dropping it has the same consequence as an unreadable root: fewer sources, fewer hits, stale baseline, non-zero exit. ${BASE}`),
  ...E('G-293', F, 'for (const m of s.matchAll(re)) {',
    `A FILE MATCHING NO DECLARATION CONTRIBUTES NONE, WHICH IS THE COMMON AND CORRECT CASE — most files in this tree export no name set at all. The dangerous direction is the regex dying across the board rather than per file, and that is caught twice over: [R-04]'s explicit STOP fires when decls is empty, and ${BASE}`),
  ...E('G-294', F, "const members = [...m[2].matchAll(/'([^']+)'|\"([^\"]+)\"/g)].map(x => x[1] ?? x[2]);",
    `AN EMPTY MEMBER LIST IS DISCARDED TWO LINES BELOW, by the length < 2 test, because a set of nothing is not a vocabulary and asserting over it would manufacture a finding out of an unread declaration. A member reader that died everywhere empties decls entirely, and ${BASE}`),
  ...E('G-295', F, 'const allPresent = d.members.every(x => s.includes(`\'${x}\'`) || s.includes(`"${x}"`));',
    `\`every\` ON AN EMPTY MEMBER LIST IS VACUOUSLY TRUE AND CANNOT BE REACHED, because a declaration with fewer than two members is discarded before it becomes a d. This is a PRE-FILTER, not the verdict: a true result only advances to the set-equality test below, which is what actually decides a hit. The vacuous direction here widens the candidate set and then fails the real test, rather than producing a finding.`),
  ...E('G-296', F, 'const bracketed = [...s.matchAll(/\\[([^\\]]*)\\]/g)].some((b) => {',
    `\`some\` ON NO BRACKETS IS FALSE, WHICH IS THE SAFE DIRECTION: a file containing no array literal cannot be retyping a list, and the site is skipped. The failure mode worth naming is the opposite one — this regex matching everything and reporting phantom sites — and that direction is loud by construction, because a NEW hit fails the run and has to be read. ${BASE}`),
  ...E('G-297', F, 'const got = new Set([...b[1].matchAll(/\'([^\']+)\'|"([^"]+)"/g)].map((x) => x[1] ?? x[2]));',
    `AN EMPTY got FAILS THE SIZE TEST ON THE NEXT LINE, because want is never empty — a declaration with fewer than two members never became a d. So a dead member reader here produces size 0 against size >= 2, no hit, and the baseline then goes stale. ${BASE}`),
  ...E('G-298', F, 'return got.size === want.size && [...want].every((x) => got.has(x));',
    `THE \`every\` IS GUARDED BY THE SIZE EQUALITY IN FRONT OF IT, and want is never empty, so the vacuously-true case cannot be reached. SET EQUALITY IS THE POINT AND IT IS THE SECOND DRAFT: the first used containment, under which a longer list that merely included the members counted as a retyping, and this file reported ITSELF because its four-element ROOTS contains every member of a two-element DIRS. Equality is what "retyped" means; the superset case is declared a blind spot in the header rather than counted.`),
  ...E('G-299', 'sweep-boundary.mjs', "try { scripts = JSON.stringify(JSON.parse(r('package.json')).scripts || {}); } catch { scripts = ''; }",
    "THE EMPTY STRING IS THE LOUD DIRECTION, AND IT IS [G-243]'S GROUND ON THE NEIGHBOURING ENTRY. [SB-29] excuses the mirror-export renderings on the ground that a standing script re-derives them, and this reads package.json to check that. An unreadable package.json yields the empty string, `scripts.includes(checker)` is then false, and the entry is reported CONTRADICTED -- 'nothing re-derives the renderings, so every one of them is an unchecked artefact' -- and the run exits non-zero. There is no arrangement of this catch returning less that produces a clean sweep. It is deliberately not a throw, for the same reason as [G-243]: a boundary register whose report depends on one file parsing should say what it could not read in the row that depends on it, rather than take down every other entry in the same run."),
];

const i = lines.findIndex(l => l.includes("{ id: 'G-290', file: 'sweep-boundary.mjs'"));
if (i < 0) { console.error('STOP — could not locate [G-290]. Nothing patched.'); process.exit(2); }
lines.splice(i, 0, ...entries);
writeFileSync(P, lines.join('\n'));

const after = readFileSync(P, 'utf8');
const missing = ['G-291', 'G-292', 'G-293', 'G-294', 'G-295', 'G-296', 'G-297', 'G-298', 'G-299'].filter(x => !after.includes(`id: '${x}'`));
console.log(`inserted 9 disposition(s) before [G-290] at line ${i + 1}`);
if (missing.length) { console.error(`STOP — absent after patch: ${missing.join(', ')}`); process.exit(3); }
console.log('all nine present.');
