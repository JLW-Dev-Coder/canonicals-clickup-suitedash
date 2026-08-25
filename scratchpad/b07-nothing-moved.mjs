// [B-07] — NOTHING THAT WAS ALREADY FILLING MOVED, PROVED CELL BY CELL.
//
//   node scratchpad/b07-nothing-moved.mjs <baseline-dir>
//
// [B-07] reaches BACK over pages 3 and 4, which are landed and whose gates have run, and that is
// the reason the item gave for not settling itself in the prompt that raised it. So the claim
// that it changes nothing is not left as reasoning: every filled PDF this engine produces, on
// all five forms and every fixture role, is compared against the same file produced before the
// change.
//
// BY VALUE, NOT BY BYTES, and adapters/pdf/compare-filled.mjs says why in its own header: two
// runs of pdf-lib over the same input do not produce identical files — the trailer, the object
// ordering and the regenerated appearance streams all move — so a byte comparison reports a
// difference on every run and trains a reader to ignore the one column that matters.
//
// A MISSING FILE IS A DIFFERENCE, in both directions. A filled PDF the baseline holds and this
// run did not produce is exactly what a regression looks like from the outside, and so is the
// reverse.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const BASE = process.argv[2];
if (!BASE || !existsSync(BASE)) { console.error('usage: node scratchpad/b07-nothing-moved.mjs <baseline-dir>'); process.exit(2); }
const OUT = 'adapters/pdf/out';

const baseline = readdirSync(BASE).filter((f) => f.endsWith('.pdf')).sort();
const now = readdirSync(OUT).filter((f) => f.endsWith('.pdf')).sort();
console.log(`baseline: ${baseline.length} filled PDF(s) captured before the change, in ${BASE}`);
console.log(`now:      ${now.length} filled PDF(s) in ${OUT}`);

const problems = [];
for (const f of baseline) if (!now.includes(f)) problems.push(`ABSENT NOW — ${f} was produced before the change and is not there now. A filled copy that stopped being produced is a difference.`);
for (const f of now) if (!baseline.includes(f)) console.log(`  new since the baseline, not compared: ${f}`);

let compared = 0, identical = 0;
for (const f of baseline) {
  if (!now.includes(f)) continue;
  compared++;
  const r = spawnSync(process.execPath, ['adapters/pdf/compare-filled.mjs', `${BASE}/${f}`, `${OUT}/${f}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const said = `${r.stdout || ''}${r.stderr || ''}`;
  if (r.status === 0) { identical++; continue; }
  problems.push(`MOVED — ${f}\n${said.split('\n').filter((l) => /MISMATCH|only|differ|cell/i.test(l)).slice(0, 8).join('\n')}`);
}

console.log('');
console.log(`compared ${compared} filled PDF(s) cell by cell; ${identical} content-identical.`);
if (problems.length) {
  for (const p of problems) console.error(`STOP — ${p}`);
  console.error(`NOTHING-MOVED FAILED — ${problems.length} problem(s).`);
  process.exit(2);
}
console.log(`OK — every one of the ${compared} filled copies this engine produced before [B-07] is produced identically after it, compared by VALUE on every AcroForm field, text and checkbox, in both directions.`);
