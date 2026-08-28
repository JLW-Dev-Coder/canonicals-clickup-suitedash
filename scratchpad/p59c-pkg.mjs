// p59c-pkg.mjs — prompt 59-C: package.json gains the closing-regression script (it had none,
// which is [R-34]: a tool nobody runs is a tool nobody knows is broken — and §7 of the prompt
// asks for the script name rather than an assumed one), and the new runner-derivation sweep
// joins `sweeps`.
//
// [R-19] GENERATOR DECLARATION: this file edits package.json in place.
// JSON WRITTEN WITH 1-SPACE INDENT, which is this tree's convention for JSON sidecars.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'package.json';
const pkg = JSON.parse(readFileSync(P, 'utf8'));
const s = pkg.scripts;

if (!s) { console.error('STOP — package.json carries no scripts block.'); process.exit(2); }

s['regression:closing'] = 'node scratchpad/p59-regression.mjs closing';

const NEW = 'node adapters/pdf/assert-runner-derivation.mjs';
if (!s.sweeps.includes(NEW)) s.sweeps = `${s.sweeps} && ${NEW}`;

writeFileSync(P, JSON.stringify(pkg, null, 1) + '\n');

const after = JSON.parse(readFileSync(P, 'utf8')).scripts;
const checks = [
  ['regression:closing declared', after['regression:closing'] === 'node scratchpad/p59-regression.mjs closing'],
  ['sweeps runs the new sweep', after.sweeps.includes(NEW)],
  ['sweeps runs it once', after.sweeps.split(NEW).length === 2],
];
for (const [what, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}`);
process.exit(checks.some(([, ok]) => !ok) ? 3 : 0);
