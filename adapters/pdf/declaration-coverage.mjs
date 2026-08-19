// DECLARATION COVERAGE FOR A FORM, ACROSS EVERY FIXTURE THAT DRIVES IT.
//
//   node adapters/pdf/declaration-coverage.mjs <form> <fixture.json> [<fixture.json> ...]
//   exit 0 = every fixture's gate passed and the union was computed
//   exit 2 = a gate failed, or a run emitted no summary block to read
//
// WHY A SECOND TOOL AND NOT A BIGGER GATE STEP
// --------------------------------------------
// Step 11 reports declaration coverage FOR THE RUN, which is the only honest thing one run can
// say. But a form is no longer driven by one fixture. It has an ACCEPTANCE fixture that fills
// every printed slot exactly to max, a NEGATIVE-DRIVING fixture that pushes each drivable floor
// below zero, and an OVER-MAX fixture that runs every group one record past its last slot — and
// those three properties are in direct opposition to one another. A saturated fixture cannot
// overflow a group, because filling every slot exactly to max is what saturation MEANS. A
// fixture that drives Box F below zero is not the fixture that leaves it at 8,195. So each run
// reports gaps that another run closes, and reading any one of them as the form's coverage
// understates it, while adding the tallies up overstates it.
//
// UNION OF IDENTITIES, NOT SUM OF TALLIES. A declaration is unexercised FOR THE FORM only if it
// was in class on some run and exercised on none. That is computable only because the gate now
// names each declaration in its summary block rather than counting them; a tally cannot be
// unioned with another tally.
//
// AND IN-CLASS IS NOT THE SAME AS DECLARED. Which declarations a run can even attempt depends
// on the record: the printed constant 0 at "6a leased" is in class only when the first vehicle
// is leased, and on every other record that line is skipped and the constant is not something
// that run had an opportunity to exercise. The first version of this tool intersected the
// UNEXERCISED lists only, which reads "absent from this run" as "exercised by this run", and it
// reported 80 of 83 on 433-A(OIC) where two of the three it had closed were zero constants that
// were never in class on the same run. So the union is taken over the IN-CLASS sets and the
// exercised sets separately, and the residue is (in class somewhere) minus (exercised
// somewhere). The denominator is the union of in-class, which can exceed any single run's
// declared total, and that is reported rather than hidden.
//
// EVERY FIGURE HERE IS READ OUT OF THE GATE'S OWN SUMMARY BLOCK, on the run that produced it.
// This tool re-derives nothing: it spawns the gate, reads the block, and intersects. A second
// implementation of declaration coverage here would be a check on the copy — the class the
// figure register in guard-sweep.mjs was written to catch, committed by the tool reporting on it.
//
// A RUN WHOSE BLOCK CANNOT BE READ IS A STOP. Not a skipped fixture, not a fixture contributing
// nothing to the union: a stop. An unreadable input reports that it could not be read.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const [form, ...fixtures] = process.argv.slice(2);
if (!form || !fixtures.length) {
  console.error('usage: node adapters/pdf/declaration-coverage.mjs <form> <fixture.json> [<fixture.json> ...]');
  process.exit(2);
}
for (const f of fixtures) if (!existsSync(f)) { console.error(`STOP — ${f} does not exist.`); process.exit(2); }

const runs = [];
for (const fx of fixtures) {
  const r = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', form, fx, '--saturated', '--declaration-ids'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  if (r.status !== 0) {
    console.error(`STOP — the gate FAILED for ${form} on ${fx} (exit ${r.status}). Coverage across a form whose gate does not pass would be a number about a form that cannot be filed.`);
    console.error(out.split('\n').filter(l => /FAIL|STOP|GATE/.test(l)).map(l => `    ${l}`).join('\n'));
    process.exit(2);
  }
  const kv = {};
  const block = out.split('----- GATE SUMMARY (derived this run; quote verbatim) -----')[1];
  if (!block) { console.error(`STOP — the run for ${fx} emitted no summary block. Nothing about its coverage can be read, and an unread run is not an empty one.`); process.exit(2); }
  for (const line of block.split('----- END GATE SUMMARY -----')[0].split('\n')) {
    const m = /^([a-z_]+): (.*)$/.exec(line.trim());
    if (m) kv[m[1]] = m[2];
  }
  for (const need of ['declarations_total', 'declarations_exercised', 'declarations_unexercised', 'declarations_in_class_ids', 'declarations_unexercised_ids']) {
    if (kv[need] === undefined || kv[need] === 'n/a') {
      console.error(`STOP — the summary block for ${fx} carries no usable ${need}. Step 11 either did not run or reported nothing, so this fixture's contribution to the union is unknown, which is not the same as nothing.`);
      if (need === 'declarations_in_class_ids') console.error('      (this key is emitted only when the gate is run with --declaration-ids, which this tool passes. If it is absent, the gate did not receive the flag.)');
      process.exit(2);
    }
  }
  const split = (v) => v === 'none' ? [] : v.split('; ').filter(Boolean);
  const ids     = split(kv.declarations_unexercised_ids);
  const inClass = split(kv.declarations_in_class_ids);
  // The block's own counts against the block's own lists. Both sides come from the same array
  // on the same run, so this cannot catch a wrong coverage RULE - what it catches is a list
  // truncated in transit, which is the only way the count and the list can part company.
  if (ids.length !== Number(kv.declarations_unexercised)) {
    console.error(`STOP — ${fx}: the block says ${kv.declarations_unexercised} unexercised declaration(s) and names ${ids.length}. The count and the list disagree, which is the retyped-count defect inside the block that exists to prevent it.`);
    process.exit(2);
  }
  if (inClass.length !== Number(kv.declarations_total)) {
    console.error(`STOP — ${fx}: the block says ${kv.declarations_total} declared behaviour(s) and names ${inClass.length} in class. The same disagreement, on the other list.`);
    process.exit(2);
  }
  for (const id of ids) if (!inClass.includes(id)) {
    console.error(`STOP — ${fx}: ${JSON.stringify(id)} is reported unexercised but is not in the in-class list. A declaration cannot be unexercised without having been in class, so one of the two lists is not describing this run.`);
    process.exit(2);
  }
  // ONE RULE DECLARED AT TWO SITES IS ONE RULE. Line "6a own" on 433-A(OIC) carries the same
  // `when` clause on BOTH of its feeders, so the run reports two predicate declarations with
  // one identity. The per-run total counts SITES, which is the right denominator for "what did
  // this run have to exercise"; the union counts RULES, which is the right denominator for
  // "what has this tree ever proved". The two differ, and the difference is printed rather than
  // reconciled away, because silently collapsing 83 to 82 would move a figure three prompts of
  // reports have quoted.
  const dupes = [...new Set(inClass.filter((id, i) => inClass.indexOf(id) !== i))];
  runs.push({ fixture: fx, total: Number(kv.declarations_total), exercised: Number(kv.declarations_exercised), unexercised: ids, inClass, dupes });
}

// THE TWO UNIONS. `everInClass` is the denominator: every declaration any fixture had the
// opportunity to exercise. `everExercised` is the numerator. A single run's declared total is
// NOT the denominator, because a declaration behind a `when` clause is in class on some records
// and absent on others.
const everInClass   = [...new Set(runs.flatMap(r => r.inClass))];
const everExercised = new Set(runs.flatMap(r => r.inClass.filter(id => !r.unexercised.includes(id))));
const still = everInClass.filter(id => !everExercised.has(id));

console.log(`DECLARATION COVERAGE — ${form}, ${runs.length} fixture(s)`);
console.log('');
console.log('  FIXTURE                                        in class  exercised  not');
for (const r of runs) console.log(`  ${r.fixture.padEnd(46)} ${String(r.total).padStart(8)}  ${String(r.exercised).padStart(9)}  ${String(r.unexercised.length).padStart(3)}`);
console.log(`  ${'UNION over identities: in class on some run,'.padEnd(46)}`);
console.log(`  ${'exercised on some run'.padEnd(46)} ${String(everInClass.length).padStart(8)}  ${String(everExercised.size).padStart(9)}  ${String(still.length).padStart(3)}`);
const allDupes = [...new Set(runs.flatMap(r => r.dupes))];
if (allDupes.length) {
  console.log('');
  console.log(`  ${allDupes.length} rule(s) are declared at more than one site, so a run's site count exceeds its rule count:`);
  for (const d of allDupes) console.log(`    ${d}  —  declared on ${runs.filter(r => r.dupes.includes(d)).length} of ${runs.length} fixture(s) at two sites`);
}
const perRun = [...new Set(runs.map(r => r.total))].sort((a, b) => a - b);
if (everInClass.length !== perRun[perRun.length - 1])
  console.log(`  (the union in-class count ${everInClass.length} exceeds every run's own declared total (${perRun.join(', ')}): some declarations sit behind a \`when\` clause and are in class only on the records that take that branch.)`);
console.log('');
if (!still.length) {
  console.log(`  Every declared behaviour on ${form} is exercised by at least one fixture.`);
} else {
  console.log(`  UNEXERCISED BY EVERY FIXTURE — ${still.length} declared rule(s) that were in class somewhere and proved nowhere:`);
  const byKind = still.reduce((a, id) => { const [k, line, what] = id.split('|'); (a[k] ||= []).push(`${line} (${what})`); return a; }, {});
  for (const [k, lines] of Object.entries(byKind)) console.log(`    ${k.padEnd(10)} ${lines.join(', ')}`);
}
