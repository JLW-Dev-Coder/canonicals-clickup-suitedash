// PROVE THE SLICE-3 ARITHMETIC TRIPWIRE FIRES, AND REVERT.
//
// Slice 3 added two totals to a step that already ran, which is a different object from slice 2's
// case — there the whole of gate step 11 was new. A step that already passes is the easier place
// for a new declaration to be quietly inert: the step reports PASSED either way, and the only
// difference between "six tripwires checked" and "four checked and two that never look at
// anything" is a number nobody reads. So each of the two new ones is broken separately.
//
// THE BREAK IS ONE CENT, deliberately, and on EACH new total in turn. "No tolerance in any
// comparison" is a claim that has to be demonstrable at the smallest unit the form prints, and a
// break of a thousand dollars would prove only that a large error is caught. Breaking both
// separately is what distinguishes two live tripwires from one live and one inert: a single
// combined break would fire on either, and could not tell which.
//
// 22e AND 23e ARE THE TOTALS WHOSE CELLS ARE WIDER THAN THE COLUMN THEY SUM — x 492.4..576.0
// against an equity lane of 521.2..576.0 — which is the resemblance to [B-06] the map records and
// argues is only a resemblance. A tripwire on a cell bound by a contested reading is the one
// worth watching fail: if the reading were wrong, this comparison is what would eventually say so.
//
// THE FIXTURE IS RESTORED FROM ITS OWN BYTES, read before the edit and written back after, and
// the restoration is verified by SHA-256 rather than by re-running the generator: a generator
// re-run proves the generator is deterministic, not that this file put back what it took.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const F = 'samples/433b.slice3.sample.json';
const sha = (b) => createHash('sha256').update(b).digest('hex').toUpperCase();

const before = readFileSync(F);
const beforeSha = sha(before);
console.log(`fixture before: ${F}`);
console.log(`  sha256 ${beforeSha}`);

const gate = () => {
  const r = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', '433b', '--saturated'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

const CASES = [
  { key: 's4_22e_total_equity_real_property', marker: '22e', what: 'the four printed real-property equity cells' },
  { key: 's4_23e_total_equity_vehicles', marker: '23e', what: 'the four printed vehicle equity cells' },
];

// ═══════════════════════════════════════════════════════════════════════════════════════
// A NON-ZERO EXIT IS NOT THE PROOF, AND THE FIRST DRAFT OF THIS FILE TOOK IT FOR ONE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The first version asserted only `run.status !== 0` and reported PROVED on both totals. The gate
// had failed at STEP 3, on assert-fixture-authorship.mjs — the broken record no longer matched the
// generator it claims — and step 11 never ran at all. The tripwire was never reached, never mind
// fired, and the proof said it had. That is precisely the class this whole file exists to close,
// committed by the file closing it, which is [R-12]'s second clause on schedule.
//
// TWO THINGS CHANGED. The break now DECLARES ITSELF in the record, because a hand-edited key in a
// generated fixture is exactly what `_co_authored_with_hand` is for and the guard is right to
// demand it — the declaration is not a way around step 3, it is the true statement that makes
// step 3 pass. And the assertion is no longer "something failed": the run must fail AT STEP 11,
// the broken total must print NO, and the OTHER new total must print yes in the same run.
const results = [];
for (const c of CASES) {
  const doc = JSON.parse(before.toString('utf8'));
  const good = doc[c.key];
  const bad = (Number(good) + 0.01).toFixed(2);
  doc[c.key] = bad;
  doc._TRIPWIRE_PROOF = `TEMPORARY. ${c.key} is ${bad} where ${c.what} sum to ${good}. One cent. Reverted by scratchpad/433b-slice3-prove-tripwire-fires.mjs in the same run that wrote it.`;
  doc._co_authored_with_hand = {
    [c.key]: `A DELIBERATE ONE-CENT BREAK, held only for the length of one gate run. The generator writes ${good}, the sum of ${c.what}; this file writes ${bad} to make the arithmetic tripwire on printed marker ${c.marker} say no. Reverted from the fixture's own bytes in the same run, and the restoration verified by SHA-256.`,
    _TRIPWIRE_PROOF: 'The sentence recording the break, written beside it and removed with it.',
    _co_authored_with_hand: 'THIS DECLARATION ITSELF. It exists only while the break does.',
  };
  writeFileSync(F, JSON.stringify(doc, null, 1) + '\n');
  console.log('');
  console.log(`BROKEN: ${c.key}  ${good} -> ${bad}   (one cent, printed marker ${c.marker})`);

  const run = gate();
  const lines = run.out.split('\n').filter((l) => /^\s{2}(1[789]|2[0-3])[a-e]\s+\|/.test(l) || /^GATE/.test(l) || /TRIPWIRES:/.test(l));
  console.log(`  gate exit: ${run.status}`);
  for (const l of lines) console.log(`    ${l.trim()}`);

  // THE THREE THINGS THAT MAKE THIS A PROOF RATHER THAN A FAILURE.
  const atStep11 = /GATE FAILED at step 11\/12/.test(run.out);
  const brokeLine = run.out.split('\n').find((l) => new RegExp(`^\\s{2}${c.marker}\\s+\\|`).test(l)) || '';
  const brokeSaysNo = /\|\s*NO\b/.test(brokeLine);
  // THE OTHER NEW TOTAL MUST STILL AGREE. A step that failed because it collapsed would prove
  // nothing about this declaration; the proof is that exactly the broken one says no.
  const other = CASES.find((x) => x.key !== c.key);
  const otherLine = run.out.split('\n').find((l) => new RegExp(`^\\s{2}${other.marker}\\s+\\|`).test(l)) || '';
  const otherSaysYes = /\|\s*yes\b/.test(otherLine);
  results.push({ ...c, status: run.status, atStep11, brokeSaysNo, otherSaysYes, brokeLine: brokeLine.trim(), otherLine: otherLine.trim() });

  writeFileSync(F, before);
  const afterSha = sha(readFileSync(F));
  if (afterSha !== beforeSha) { console.error(`STOP — the fixture was NOT restored byte for byte after breaking ${c.key}.`); process.exit(2); }
  console.log(`  REVERTED: sha256 ${afterSha} — byte-for-byte identical to the file read before the break.`);
}

// THE RE-RUN IS PART OF THE PROOF. A tripwire that fires is only useful if it stops firing when
// the defect is removed; a guard stuck on is a guard that gets turned off ([R-10]).
const again = gate();
console.log('');
console.log(`gate after both reverts: exit ${again.status} — ${(again.out.split('\n').find((l) => /^GATE/.test(l)) || '(no verdict line)').trim()}`);

const failures = [];
for (const r of results) {
  if (r.status === 0) failures.push(`the gate PASSED on a fixture whose ${r.marker} total is a cent short — that tripwire did not fire`);
  else if (!r.atStep11) failures.push(`the gate failed on the ${r.marker} break but NOT at step 11 — step 11 was never reached, so nothing was proved about the tripwire. A non-zero exit is not a fired tripwire.`);
  else if (!r.brokeSaysNo) failures.push(`step 11 ran on the ${r.marker} break and that line does not read NO: ${JSON.stringify(r.brokeLine)}`);
  else if (!r.otherSaysYes) failures.push(`step 11 said no to ${r.marker} but the other new total did not say yes in the same run: ${JSON.stringify(r.otherLine)} — the step may have collapsed rather than compared`);
}
if (again.status !== 0) failures.push('the gate still fails after both reverts, so the failures above were not the breaks');
if (failures.length) { failures.forEach((f) => console.error(`STOP — ${f}`)); process.exit(2); }

console.log('');
console.log('PROVED: each of the two totals slice 3 added fires on a one-cent discrepancy INDEPENDENTLY,');
console.log('        and both stop firing when the discrepancy is removed. Two separate breaks rather');
console.log('        than one combined break, because a combined break fires on either and could not');
console.log('        tell a live declaration from an inert one.');
