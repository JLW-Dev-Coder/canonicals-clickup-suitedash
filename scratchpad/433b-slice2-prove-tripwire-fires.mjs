// PROVE THE SLICE-2 ARITHMETIC TRIPWIRE FIRES, AND REVERT.
//
// Gate step 11 was SKIPPED for 433-B until this commit, and a skipped step that starts running
// is a NEW INSTRUMENT — the least trustworthy object in the repo. Four totals now report "yes,
// match" on every run, and a comparison that has only ever agreed is a comparison nobody has
// seen say no.
//
// THE BREAK IS ONE CENT, deliberately. "No tolerance in any comparison" is a claim that has to
// be demonstrable at the smallest unit the form prints, and a break of a thousand dollars would
// prove only that a large error is caught. 19c is chosen because it is the total whose column
// assignment rests on a rectangle rather than on a caption — the reading [B-06] argues with on
// the neighbouring block — so it is the one worth watching fail.
//
// THE FIXTURE IS RESTORED FROM ITS OWN BYTES, read before the edit and written back after, and
// the restoration is verified by SHA-256 rather than by re-running the generator: a generator
// re-run proves the generator is deterministic, not that this file put back what it took.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const F = 'samples/433b.slice2.sample.json';
const sha = (b) => createHash('sha256').update(b).digest('hex').toUpperCase();

const before = readFileSync(F);
const beforeSha = sha(before);
console.log(`fixture before: ${F}`);
console.log(`  sha256 ${beforeSha}`);

const doc = JSON.parse(before.toString('utf8'));
const KEY = 's4_19c_total_investments';
const good = doc[KEY];
const bad = (Number(good) + 0.01).toFixed(2);
doc[KEY] = bad;
doc._TRIPWIRE_PROOF = `TEMPORARY. ${KEY} is ${bad} where the two printed investment rows sum to ${good}. One cent. Reverted by scratchpad/433b-slice2-prove-tripwire-fires.mjs in the same run that wrote it.`;
writeFileSync(F, JSON.stringify(doc, null, 1) + '\n');
console.log('');
console.log(`BROKEN: ${KEY}  ${good} -> ${bad}   (one cent, on the total whose column assignment rests on a rectangle — [B-06])`);

const run = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', '433b', '--saturated'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const out = `${run.stdout || ''}${run.stderr || ''}`;
const step11 = out.split('\n').filter((l) => /^\s{2}(19c|18f|17d|20e)\s+\|/.test(l) || /TRIPWIRE|tripwire/i.test(l) || /^GATE/.test(l));
console.log('');
console.log(`gate exit: ${run.status}`);
for (const l of step11) console.log(`  ${l.trim()}`);

writeFileSync(F, before);
const afterSha = sha(readFileSync(F));
console.log('');
console.log(`REVERTED: sha256 ${afterSha}`);
if (afterSha !== beforeSha) { console.error('STOP — the fixture was NOT restored byte for byte.'); process.exit(2); }
console.log('  byte-for-byte identical to the file read before the break.');

// THE RE-RUN IS PART OF THE PROOF. A tripwire that fires is only useful if it stops firing when
// the defect is removed; a guard stuck on is a guard that gets turned off ([R-10]).
const again = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', '433b', '--saturated'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const againOut = `${again.stdout || ''}${again.stderr || ''}`;
console.log('');
console.log(`gate after revert: exit ${again.status} — ${(againOut.split('\n').find((l) => /^GATE/.test(l)) || '(no verdict line)').trim()}`);

if (run.status === 0) { console.error('STOP — the gate PASSED on a fixture whose 19c total is a cent short. The tripwire did not fire.'); process.exit(2); }
if (again.status !== 0) { console.error('STOP — the gate still fails after the revert, so the failure above was not the break.'); process.exit(2); }
console.log('');
console.log('PROVED: the tripwire fires on a one-cent discrepancy and stops firing when it is removed.');
