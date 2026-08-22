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
import { existsSync, readFileSync } from 'node:fs';
import { resolveFixture } from './resolve-fixture.mjs';
import { money } from './comparisons.mjs';

// THE FIXTURE LIST IS DERIVED, NOT TYPED.
//
// It used to be three paths on an npm command line, which is a parallel list of the fixtures
// that exist - and a parallel list drifts. A fixture added for a new slice contributed nothing
// to the union until somebody remembered to extend the script, and the union would go on
// reporting a coverage figure that was true of a smaller set of runs than the tree holds.
//
// The union is over every fixture that EXERCISES the form: acceptance, stress, negative and
// record_shape. `production` is excluded because a real record is a portrait of one taxpayer
// and says nothing about which declared behaviours a gate run reached; `superseded` is excluded
// because its run is history and re-running it would put a retired record's coverage into a
// live figure. Both exclusions are registered in adapters/pdf/sweep-boundary.mjs and printed here.
//
// record_shape WAS ADDED THE MOMENT THE ROLE EXISTED, AND THAT IS THE POINT OF DERIVING THIS
// LIST. A record declares one printed route, so the profit-and-loss state of a declared record
// shape is unreachable from the acceptance fixture and is exercised only by a fixture in that
// set. Left out, this union would have gone on reporting those states as proved nowhere while
// adapters/pdf/assert-record-shape.mjs was proving them on every run — a coverage figure true
// of a smaller set of runs than the tree holds, which is the exact defect the derived list
// replaced. The two "stops" fixtures in that set are included too: a fixture whose gate run
// FAILS still reaches every declaration up to the point it failed, and the union is over what
// was exercised rather than over what passed.
const EXERCISING_ROLES = ['acceptance', 'stress', 'negative', 'record_shape'];
const [form, ...named] = process.argv.slice(2);
if (!form) {
  console.error('usage: node adapters/pdf/declaration-coverage.mjs <form> [<fixture.json> ...]');
  console.error(`  With no paths, every fixture declaring a role in {${EXERCISING_ROLES.join(', ')}} is resolved from samples/.`);
  process.exit(2);
}
let fixtures = named;
// A record-shape fixture runs in PRODUCTION mode; see the note at the spawn below. Collected
// from the fixture's own `_fixture.role`, never from its filename.
const shapePaths = new Set();
if (!fixtures.length) {
  const { rows, problems } = resolveFixture(form, 'acceptance');
  if (problems.length) { problems.forEach(p2 => console.error(`  ${p2}`)); process.exit(2); }
  // A "stops" RECORD-SHAPE FIXTURE IS NOT AN EXERCISING FIXTURE. It exists to be REFUSED, and
  // its gate run ends non-zero by design; unioning it here would either take this tool down or
  // force it to accept a failing gate, and a coverage figure that tolerates a failing gate is
  // the thing this tool refuses to produce. Its coverage is asserted where it belongs, in
  // adapters/pdf/assert-record-shape.mjs, which requires it to fail AND to fail for the right
  // reason. Only the "holds" fixture of each declared state enters the union.
  // NO SECOND READ AND NO CATCH. `recordShape` comes out of the one parse candidatesFor()
  // already did. The first draft re-read each fixture behind a try/catch, `readFileSync` was
  // not imported in this module, and the catch turned that ReferenceError into `null` — so
  // every record-shape fixture reported as expecting a STOP and the union silently lost the
  // one fixture that proves the profit-and-loss state. That is the guard-that-skips-when-it-
  // cannot-read defect, in the commit that added it.
  const exercises = (r) => EXERCISING_ROLES.includes(r.role) && (r.role !== 'record_shape' || r.recordShape?.expect === 'holds');
  fixtures = rows.filter(exercises).map(r => r.path);
  // The paths that run in PRODUCTION mode, collected here from the same rows rather than
  // recognised from a filename later. A path pattern would be a second classifier beside the
  // fixture's own declaration, which is the thing resolve-fixture.mjs exists to forbid.
  for (const r of rows) if (r.role === 'record_shape') shapePaths.add(r.path);
  const skipped = rows.filter(r => !exercises(r));
  console.log(`declaration-coverage: ${form} — ${fixtures.length} exercising fixture(s) resolved from samples/`);
  for (const f of fixtures) console.log(`    union: ${f}`);
  for (const r of skipped) console.log(`    not in the union: ${r.path} (${r.role || 'no _fixture.role'}${r.role === 'record_shape' ? ', expects a STOP — asserted by assert-record-shape.mjs instead' : ''})`);
  // A UNION OVER NOTHING IS NOT A UNION. Every declared behaviour would come back unexercised
  // and the tool would report the worst possible answer as if it had measured it.
  if (!fixtures.length) {
    console.error(`STOP — no fixture for ${form} declares any of ${EXERCISING_ROLES.join(', ')}, so there is nothing to union. That is not zero coverage; it is no measurement.`);
    process.exit(2);
  }
}
for (const f of fixtures) if (!existsSync(f)) { console.error(`STOP — ${f} does not exist.`); process.exit(2); }

const runs = [];
for (const fx of fixtures) {
  // THE MODE IS PER FIXTURE AND IT IS NOT A CHOICE. --saturated asserts that the record reaches
  // every mapped text cell, and a record-shape fixture on the profit-and-loss route leaves the
  // governed operand cells EMPTY because the printed note tells it to. Running it saturated
  // would fail it at step 10 for doing exactly what the form instructs. So a record_shape
  // fixture runs in PRODUCTION mode, where an empty mapped cell is reported rather than failed,
  // and the emptiness it is actually about is asserted per line by assert-record-shape.mjs
  // against the filled PDF. Every other role runs saturated, unchanged.
  const isShape = shapePaths.has(fx);
  const mode = isShape ? [] : ['--saturated'];
  const r = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', form, fx, ...mode, '--declaration-ids'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
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
  // [D-11]'s second pair of figures, read off the same block on the same run. An older gate
  // emits no such keys; that is REPORTED as an unreadable observability half rather than
  // counted as zero, because a run whose block predates the key has not been measured.
  if (kv.applied_unobservable_ids === undefined) {
    console.error(`STOP — ${fx}: the summary block carries no applied_unobservable_ids. The observability half of [D-11] cannot be read for this run, and an unread half is not an empty one.`);
    process.exit(2);
  }
  const appliedUnobservable = split(kv.applied_unobservable_ids);
  if (appliedUnobservable.length !== Number(kv.applied_unobservable)) {
    console.error(`STOP — ${fx}: the block says ${kv.applied_unobservable} applied-unobservable declaration(s) and names ${appliedUnobservable.length}.`);
    process.exit(2);
  }
  // The observability POPULATION as identities: the in-class entries of the three kinds that
  // carry the test. Derived from the in-class list rather than restated, so the two cannot part.
  const obsInClass = inClass.filter((id) => /^(factor|constant|sign)\|/.test(id));
  for (const id of appliedUnobservable) if (!obsInClass.includes(id)) {
    console.error(`STOP — ${fx}: ${JSON.stringify(id)} is reported applied-unobservable and is not an in-class factor, constant or sign. One of the two lists is not describing this run.`);
    process.exit(2);
  }
  runs.push({ fixture: fx, total: Number(kv.declarations_total), exercised: Number(kv.declarations_exercised), unexercised: ids, inClass, dupes,
    appliedUnobservable, obsInClass, obsPop: Number(kv.observability_population) });
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
// THE NOTE IS GUARDED BY THE DIRECTION IT REPORTS. The union counts RULE IDENTITIES and a run's
// total counts SITES, and TWO effects move those apart in OPPOSITE directions: a `when` clause puts
// a rule in class on some records and not others, which pushes the union ABOVE any one run; a rule
// declared at two sites is counted twice by that run and once by the union, which pushes it BELOW.
// The note this replaces tested `!==` — either direction — then asserted ONE direction ("exceeds")
// and ONE cause (`when` clauses). On 433-B(OIC) the relation runs the other way (80 against 82) and
// the cause is the two-site collapse named directly above, so the sentence stated two things that
// were both false about the run it was printed on. Each clause now fires only on the condition it
// describes, and every size it quotes is derived rather than assumed.
// The word `when` is printed with its backticks, so it is built rather than escaped inside a
// template literal — an escaped backtick inside a heredoc-authored template is how this line was
// first emitted unparseable.
const BACKTICKED_WHEN = "`when`";

const perRunSites = [...new Set(runs.map(r => r.total))].sort((a, b) => a - b);
const maxSites    = perRunSites[perRunSites.length - 1];
// A run's RULE IDENTITIES are its sites less the rules it declared more than once. `dupes` holds one
// entry per repeated identity and the line above reports each as "at two sites", so one subtraction
// per dupe is the whole correction. If a rule ever appears at THREE sites that stops being exact, so
// the shape is asserted here rather than left to drift the number quietly.
for (const r of runs) {
  const seen = new Map();
  for (const id of r.inClass) seen.set(id, (seen.get(id) || 0) + 1);
  const over = [...seen].filter(([, n]) => n > 2);
  if (over.length) {
    console.error(`STOP — ${r.fixture}: ${JSON.stringify(over[0][0])} is declared at ${over[0][1]} sites, and the site-to-identity correction below subtracts one per repeated rule, which is right only at two. Widen the correction before trusting this table.`);
    process.exit(2);
  }
}
const perRunIds = [...new Set(runs.map(r => r.total - r.dupes.length))].sort((a, b) => a - b);
const maxIds    = perRunIds[perRunIds.length - 1];
if (everInClass.length > maxIds)
  console.log('  (the union in-class count ' + everInClass.length + " EXCEEDS the largest single run's " + maxIds + ' rule identities (' + perRunIds.join(', ') + '): some declarations sit behind a ' + BACKTICKED_WHEN + ' clause and are in class only on the records that take that branch.)');
if (everInClass.length < maxSites)
  console.log(`  (the union in-class count ${everInClass.length} is BELOW every run's own declared total (${perRunSites.join(', ')}) because a run's total counts SITES and the union counts RULES: the ${allDupes.length} rule(s) named just above are declared at two sites each, so each is counted twice by a run and once here.)`);
console.log('');
if (!still.length) {
  console.log(`  Every declared behaviour on ${form} is exercised by at least one fixture.`);
} else {
  console.log(`  UNEXERCISED BY EVERY FIXTURE — ${still.length} declared rule(s) that were in class somewhere and proved nowhere:`);
  const byKind = still.reduce((a, id) => { const [k, line, what] = id.split('|'); (a[k] ||= []).push(`${line} (${what})`); return a; }, {});
  for (const [k, lines] of Object.entries(byKind)) console.log(`    ${k.padEnd(10)} ${lines.join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// [D-11] — THE TWO THINGS THE COVERAGE FIX MUST NOT LOSE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Coverage now asks whether a declaration was APPLIED. For a factor, a constant and a sign
// that means `fired` is true whenever the run reached them — so those three kinds can no
// longer appear in the residue above, and a residue a kind cannot enter is a residue that
// stops watching it. Two lists take over, and both are unioned over IDENTITIES:
//
//   (a) APPLIED, NOT OBSERVABLE. The declaration ran and the printed total is the same either
//       way. This is what the old `fired` was measuring, under its right name. A .8 seen only
//       against zeros has never been proved to be .8 rather than .7.
//
//   (b) DECLARED, IN CLASS NOWHERE. A feeder the totals file declares that NO fixture ever
//       reached — because its `when` clause never held on any record in the set. Under the old
//       rule such a declaration would surface in the residue the moment it WAS reached and
//       contributed zero; under the new one it never surfaces at all unless this list exists.
//       Derived from the totals file, which is the declaring artefact, and not from the runs.
const declaredFeeders = (() => {
  const p = `adapters/pdf/maps/${form}.totals.json`;
  if (!existsSync(p)) return { rows: [], why: `${p} is not in this tree` };
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  const rows = [];
  for (const e of (doc.totals || [])) for (const fd of (e.feeders || [])) {
    // The identities are built the same way the gate builds them, so the two sides join.
    if (typeof fd.factor === 'number' && fd.factor !== 1) rows.push(`factor|${e.line}|x ${fd.factor}`);
    if (typeof fd.constant === 'number') rows.push(`constant|${e.line}|${money(fd.constant)}`);
    if (fd.sign === -1) rows.push(`sign|${e.line}|minus ${fd.keys ? fd.keys.join(', ') : `${fd.group}.${fd.column}`}`);
  }
  return { rows: [...new Set(rows)], why: null };
})();

const inClassSet = new Set(everInClass);
const neverInClass = declaredFeeders.rows.filter((id) => !inClassSet.has(id));
const unobsUnion = [...new Set(runs.flatMap((r) => r.appliedUnobservable))];
// A declaration observable on ANY run is proved at its magnitude somewhere, so the union
// subtracts, exactly as the coverage union does.
const observableSomewhere = new Set(runs.flatMap((r) => r.obsInClass.filter((id) => !r.appliedUnobservable.includes(id))));
const neverObservable = unobsUnion.filter((id) => !observableSomewhere.has(id));

console.log('');
console.log(`  OBSERVABILITY — ${runs.reduce((n, r) => n + r.obsPop, 0)} applied-declaration test(s) across the ${runs.length} run(s); ${neverObservable.length} declaration(s) are applied on some run and observable on none.`);
if (neverObservable.length) for (const id of neverObservable) {
  const [k, line, what] = id.split('|');
  console.log(`    ${k.padEnd(10)} ${line} (${what}) — exercised, and no fixture has yet shown the printed total distinguishing it from not applying it`);
}
if (declaredFeeders.why) {
  console.log(`  DECLARED-BUT-NEVER-IN-CLASS — not computed: ${declaredFeeders.why}. An unread input reports that it could not be read.`);
} else {
  console.log(`  DECLARED-BUT-NEVER-IN-CLASS — ${declaredFeeders.rows.length} factor/constant/sign declaration(s) in ${form}.totals.json; ${neverInClass.length} were reached by no fixture in the set.`);
  for (const id of neverInClass) {
    const [k, line, what] = id.split('|');
    console.log(`    ${k.padEnd(10)} ${line} (${what}) — declared, and no fixture in this set ever reached the branch that carries it`);
  }
}
