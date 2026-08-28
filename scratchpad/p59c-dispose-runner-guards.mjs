// p59c-dispose-runner-guards.mjs — disposes the three vacuous-guard sites the new
// runner-derivation sweep added. [R-12]: a NEW guard is a change to the guard, and guard-sweep
// named all three. This writes the verdicts it asked for; it does not suppress them.
//
// PATCHED BY LINE, NOT BY BLOB, and asserted after.
// [R-19] GENERATOR DECLARATION: this file edits adapters/pdf/guard-sweep.mjs in place.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/guard-sweep.mjs';
const lines = readFileSync(P, 'utf8').split('\n');
const F = 'assert-runner-derivation.mjs';

const E = (id, anchor, why) => [
  `  { id: '${id}', file: '${F}', anchor: ${JSON.stringify(anchor)}, verdict: 'sound',`,
  `    why: ${JSON.stringify(why)} },`,
];

const entries = [
  ...E('G-308', 'const tokens = [...new Set([...l.text.matchAll(RX_PROBE)].map((m) => m[1]))];',
    'A LINE MATCHING NO PROBE CONTRIBUTES NONE, WHICH IS THE COMMON AND CORRECT CASE — most lines in the runner read no path at all, and `continue` on the next line is what makes the scan a scan rather than a report on every line. The dangerous direction is RX_PROBE dying ACROSS THE BOARD rather than on one line, and that direction cannot reach a pass here. Three things stop it, and each stops it on its own. (a) [R-17]: RX_PROBE is registered with adapters/pdf/regex-self-assert.mjs and asserts its own four matches, four rejects and two captures when this module loads, so a source that reached disk with its backslashes eaten throws before the sweep runs. (b) THE CANARY, whose "an unregistered probe is found" case plants a probe and requires exactly one finding — a dead pattern yields zero there and exits 5 without touching the runner. (c) THE ORPHAN PASS: five register entries are `kind: probe` and each must match a line, so a pattern finding nothing leaves all five anchors unmatched and reports five ORPHANED ANCHOR problems. The vacuous direction of this site cannot produce a clean run.'),
  ...E('G-309', 'return { results, ok: results.every((r) => r.got === r.expect) };',
    "`every` ON AN EMPTY LIST IS VACUOUSLY TRUE AND THE LIST CANNOT BE EMPTY: `results` is mapped one-for-one from CANARY_CASES, which is a literal in this file holding four entries, so its length is fixed at authoring time and is not read from anywhere. AND THE COUNT IS PRINTED BESIDE THE VERDICT rather than left implicit — the CLI reports `N of M case(s) reached the asserted yield`, so a canary list that somehow went empty would print `0 of 0` in the transcript instead of passing silently on a vacuous `every`. That is [R-04] applied to the canary itself: a canary that examined nothing is not a canary that held."),
  ...E('G-310', "catch (e) {",
    "AN UNREADABLE package.json IS A STOP HERE, NOT AN EMPTY DEFAULT, AND THAT IS THE WHOLE POINT OF THE SITE. This sweep derives its POPULATION from package.json — [R-22], pre-flight discovers and is never told a path — so a manifest that will not parse means there is no subject, and a sweep of no subject reports zero problems and reads exactly like a clean runner. It is the one catch in this file that exits rather than continuing, and the message says which of the two it is. It is deliberately NOT the empty-string treatment [G-243] and [G-257] give the same read in blanket-audit.mjs and sweep-boundary.mjs: there the manifest is one input among many and a bad parse should fail its own row, whereas here it is the only input and failing quietly would certify the file this sweep exists to judge."),
];

const i = lines.findIndex((l) => l.includes("{ id: 'G-300', file: 'assert-name-sets-imported.mjs'"));
if (i < 0) { console.error('STOP — could not locate [G-300]. Nothing patched.'); process.exit(2); }
lines.splice(i, 0, ...entries);
writeFileSync(P, lines.join('\n'));

const after = readFileSync(P, 'utf8');
const missing = ['G-308', 'G-309', 'G-310'].filter((x) => !after.includes(`id: '${x}'`));
console.log(`inserted 3 disposition(s) before [G-300] at line ${i + 1}`);
if (missing.length) { console.error(`STOP — absent after patch: ${missing.join(', ')}`); process.exit(3); }
console.log('all three present.');
