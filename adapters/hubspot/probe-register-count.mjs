// THE PROBE REGISTER'S DERIVED COUNTS, AND THE ONE PREDICATE THAT READS THEM.
//
// CLI:  node adapters/hubspot/probe-register-count.mjs [--canary] [--verbose]
// Exit: 0 = the register's typed _count agrees with what probes[] derives, every row's
//           `registered_retrospectively` carries a DECLARED value, and the canary is live
//       2 = a typed figure disagrees, a row carries an undeclared value, or the canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// [D-29] — WHY THIS FILE EXISTS AND WHY IT IS NOT A LINE IN hs-preflight.mjs
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// hs-preflight.mjs derived the figure as:
//
//     probes.filter((p) => p.registered_retrospectively).length
//
// The field held PROSE. Eight rows said "Yes." and the rest omitted it, and under THAT
// convention — and only under it — the truthiness test is correct. This cycle's two 433-D rows
// answered the question in words instead: "No. Written by the run that seeded it, before the
// fetch it exists for." A row saying No counted as a Yes, the register reported 10 where 8 was
// the truth, and the guard STOPped on its own derived figure disagreeing with the typed one —
// which is the guard working, one field along from the thing it was watching.
//
// Two things follow, and only the first is obvious.
//
// FIRST, the predicate is fixed by [D-29]'s preferred shape: the field is a DECLARED VALUE,
// never prose, and the prose moves to a sibling. A count derived from English is a count that
// can be argued with.
//
// SECOND — and this is what deriving the true count found rather than assumed — THE TYPED 8 WAS
// ALSO WRONG, in the other direction, for a different row. Probe 242795652507 omits the field,
// so the truthiness test scored it 0. That probe is the one [R-24] was written for: seeded
// 2026-08-18, discovered LIVE by the Prompt 39 pre-flight's portal read two days later, and its
// own row says "Nothing in this repo recorded that the contact existed". A row that could not
// have been written until two days after its probe was seeded is registered retrospectively by
// any reading of those words. It was scored as contemporaneous because it was silent.
//
// The register's own prose sibling, `_retrospective_rows_are_weaker`, says "8 of the 10 rows
// were RECONSTRUCTED AFTER THE FACT, FROM WORKING-TREE FIXTURES that embed a contact id in
// their filename." That sentence is true, and it is about a NARROWER population than the field
// name asks about: 242795652507's fixture was deleted when the probe was torn down, so it could
// not have been reconstructed from a fixture — it was found on the portal. One number was
// answering two different questions, which is [R-07] exactly: a figure without its universe is
// not a figure. Both universes are now stated, separately, and both are derived.
//
// THE THIRD VALUE IS NOT A HEDGE. Probe 243232979075's row was authored into the register in
// the same commit that CREATED the register (6b44dbd), after a run that seeded, fetched, gated
// and tore down inside one run. Whether the row was written before that run's fetch or written
// up with the register afterwards is NOT RECOVERABLE FROM THIS TREE — no tool writes this file,
// so there is no artefact of the moment, and the row carries no `registered_when`. Forcing that
// to `false` would be inventing the fact this file exists to stop being invented, and forcing it
// to `true` would be the same act with the other sign. `teardown` already carries a third value
// for the case it cannot vouch for; so does this. It is counted in its own bucket and never
// folded into either of the other two.

import { readFileSync } from 'node:fs';

export const REGISTER = 'adapters/hubspot/probe-register.json';

// ---------------------------------------------------------------------------------------
// THE DECLARED VALUES. A value not in here is a STOP, not a guess.
// ---------------------------------------------------------------------------------------
export const RETROSPECTIVE_VALUES = {
  true: 'The row was written AFTER the run that seeded the probe. Its evidence is reconstruction — from a fixture that embeds the id, or from a portal read — and never a record made at the time.',
  false: 'The row was written AT SEED TIME by the run that seeded the probe, before the fetch it exists for. [R-24] is why that matters: a list written at teardown time can only contain what somebody remembered to tear down.',
  unrecoverable: 'It is not recoverable from this tree WHICH of the two the row was. Recorded rather than decided. Counted in its own bucket and folded into neither of the others.',
};

export const VALUE_NAMES = Object.keys(RETROSPECTIVE_VALUES);

/**
 * Read one row's `registered_retrospectively`. Returns { value, problem }.
 * Absence is a problem, not a false: silence is how 242795652507 was scored contemporaneous.
 * Prose is a problem, not a truthiness: prose is how a row saying "No." was scored a Yes.
 */
export const readRetrospective = (row) => {
  const v = row.registered_retrospectively;
  if (v === true) return { value: 'true', problem: null };
  if (v === false) return { value: 'false', problem: null };
  if (v === 'unrecoverable') return { value: 'unrecoverable', problem: null };
  if (v === undefined)
    return { value: null, problem: `probe ${row.id} (${row.form}) declares no \`registered_retrospectively\`. Absence is not a "no" — it is the silence that scored 242795652507 contemporaneous when its row could not have been written until two days after the probe was seeded. Declare one of: ${VALUE_NAMES.join(', ')}.` };
  return { value: null, problem: `probe ${row.id} (${row.form}) declares \`registered_retrospectively\` as ${JSON.stringify(String(v)).slice(0, 60)}, which is not one of ${VALUE_NAMES.join(', ')}. This field is READ BY A COUNT and must never hold prose — a row answering "No." in words is what [D-29] is. Put the reasoning in \`registered_retrospectively_why\`.` };
};

/** Every count this register types, derived from probes[]. No figure here is read from _count. */
export const deriveProbeCounts = (reg) => {
  const probes = reg.probes || [];
  const problems = [];
  const retro = { true: 0, false: 0, unrecoverable: 0 };
  for (const row of probes) {
    const { value, problem } = readRetrospective(row);
    if (problem) problems.push(problem); else retro[value]++;
  }
  return {
    counts: {
      probes: probes.length,
      live: probes.filter((p) => p.teardown === 'live').length,
      torn_down: probes.filter((p) => p.teardown === 'torn_down').length,
      unknown: probes.filter((p) => p.teardown === 'unknown').length,
      registered_retrospectively: retro.true,
      registered_retrospectively_unrecoverable: retro.unrecoverable,
    },
    contemporaneous: retro.false,
    problems,
  };
};

/** Compare the typed _count against the derivation. Returns a list of STOP strings. */
export const auditTypedCount = (reg) => {
  const derived = deriveProbeCounts(reg);
  const stops = [...derived.problems];
  for (const [k, v] of Object.entries(derived.counts)) {
    const claimed = reg._count?.[k];
    if (String(claimed) !== String(v))
      stops.push(`probe-register.json _count.${k} says ${claimed}; probes[] gives ${v}.`);
  }
  return { counts: derived.counts, contemporaneous: derived.contemporaneous, stops };
};

// ---------------------------------------------------------------------------------------
// THE CANARY. Planted rows, every direction, INCLUDING the two the old predicate got wrong.
//
// [R-12]: a refactor of a guard is a change to the guard, and the fix is expected to reproduce
// the class it fixes. So the canary does not only assert that the NEW predicate is right — it
// re-runs the OLD one over the same planted rows and requires it to be WRONG in the two places
// [D-29] names. A canary that only proves the new code cannot tell you the old code was broken.
// ---------------------------------------------------------------------------------------
const OLD_PREDICATE = (rows) => rows.filter((p) => p.registered_retrospectively).length;

export const CANARY_CASES = [
  { name: 'declared true is counted retrospective',
    row: { id: 'C1', form: 'canary', teardown: 'torn_down', registered_retrospectively: true },
    want: { value: 'true', problem: false }, old_says: 1 },
  { name: 'declared false is NOT counted retrospective',
    row: { id: 'C2', form: 'canary', teardown: 'torn_down', registered_retrospectively: false },
    want: { value: 'false', problem: false }, old_says: 0 },
  { name: 'declared unrecoverable counts in its own bucket and neither other',
    row: { id: 'C3', form: 'canary', teardown: 'torn_down', registered_retrospectively: 'unrecoverable' },
    want: { value: 'unrecoverable', problem: false }, old_says: 1 },
  { name: '[D-29] LIVE INSTANCE — prose "No." is REFUSED, where the old predicate scored it a Yes',
    row: { id: 'C4', form: 'canary', teardown: 'torn_down', registered_retrospectively: 'No. Written by the run that seeded it, before the fetch it exists for.' },
    want: { value: null, problem: true }, old_says: 1, old_should_have_said: 0 },
  { name: '[D-29] OTHER FACE — prose "Yes." is REFUSED, because a count read from English is arguable even when it agrees',
    row: { id: 'C5', form: 'canary', teardown: 'torn_down', registered_retrospectively: 'Yes. Reconstructed from a fixture.' },
    want: { value: null, problem: true }, old_says: 1 },
  { name: '[D-29] SECOND DEFECT — an ABSENT field is REFUSED, where the old predicate silently scored it a No (this is 242795652507)',
    row: { id: 'C6', form: 'canary', teardown: 'torn_down' },
    want: { value: null, problem: true }, old_says: 0, old_should_have_said: 1 },
];

export const runCanary = () => {
  const dead = [];
  let planted = 0;
  for (const c of CANARY_CASES) {
    planted++;
    const got = readRetrospective(c.row);
    if (got.value !== c.want.value)
      dead.push(`CANARY DEAD  ${c.name}: reader returned value ${JSON.stringify(got.value)}, expected ${JSON.stringify(c.want.value)}.`);
    if (Boolean(got.problem) !== c.want.problem)
      dead.push(`CANARY DEAD  ${c.name}: reader ${got.problem ? 'raised' : 'raised no'} problem; expected ${c.want.problem ? 'one' : 'none'}.`);
    // FOUND BY NAME, not counted: a planted defect must be reported naming the row.
    if (c.want.problem && got.problem && !got.problem.includes(String(c.row.id)))
      dead.push(`CANARY DEAD  ${c.name}: the refusal does not name the row (${c.row.id}). A planted defect must be found BY NAME.`);
  }

  // THE OLD PREDICATE, RE-RUN, AND REQUIRED TO BE WRONG WHERE [D-29] SAYS IT IS.
  for (const c of CANARY_CASES) {
    const old = OLD_PREDICATE([c.row]);
    if (old !== c.old_says)
      dead.push(`CANARY DEAD  ${c.name}: the old truthiness predicate scored ${old}, and this canary records that it scored ${c.old_says}. The record of the defect has drifted from the defect.`);
    if (c.old_should_have_said !== undefined && c.old_says === c.old_should_have_said)
      dead.push(`CANARY DEAD  ${c.name}: this case is registered as one the old predicate got WRONG, and it scored the right answer (${c.old_says}). Either the case or the claim is stale.`);
  }

  // AND THE CONFORMING INPUT IS STILL ACCEPTED — the other half of the in-process canary class.
  const clean = CANARY_CASES.filter((c) => !c.want.problem).map((c) => c.row);
  const d = deriveProbeCounts({ probes: clean });
  if (d.problems.length) dead.push(`CANARY DEAD  three conforming rows raised ${d.problems.length} problem(s); a conforming input must still be accepted.`);
  if (d.counts.registered_retrospectively !== 1) dead.push(`CANARY DEAD  three conforming rows gave registered_retrospectively ${d.counts.registered_retrospectively}, expected 1.`);
  if (d.counts.registered_retrospectively_unrecoverable !== 1) dead.push(`CANARY DEAD  three conforming rows gave unrecoverable ${d.counts.registered_retrospectively_unrecoverable}, expected 1.`);
  if (d.contemporaneous !== 1) dead.push(`CANARY DEAD  three conforming rows gave contemporaneous ${d.contemporaneous}, expected 1.`);

  return { planted, dead };
};

// ---------------------------------------------------------------------------------------
// THE RUN.
// ---------------------------------------------------------------------------------------
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('probe-register-count.mjs');
if (isMain) {
  const VERBOSE = process.argv.includes('--verbose');
  console.log('probe-register counts — derived from probes[], never read from _count. [D-29]');

  const { planted, dead } = runCanary();
  console.log(`  canary: ${planted} planted case(s) — declared true/false/unrecoverable each read correctly; prose "Yes.", prose "No." and an ABSENT field each REFUSED BY NAME; and the old truthiness predicate re-run and required to be wrong on the two [D-29] names.`);
  for (const d of dead) console.error(`  ${d}`);

  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const { counts, contemporaneous, stops } = auditTypedCount(reg);
  console.log(`  register: ${counts.probes} probe(s) — ${counts.torn_down} torn_down, ${counts.live} live, ${counts.unknown} unknown`);
  console.log(`  registered_retrospectively: ${counts.registered_retrospectively} true, ${contemporaneous} false, ${counts.registered_retrospectively_unrecoverable} unrecoverable — universes declared at RETROSPECTIVE_VALUES, not left to the field name`);
  if (VERBOSE) for (const p of reg.probes || []) console.log(`    ${p.id}  ${String(p.form).padEnd(7)}  ${String(p.registered_retrospectively)}`);
  for (const s of stops) console.error(`  STOP  ${s}`);

  if (dead.length || stops.length) {
    console.error(`\nPROBE-REGISTER COUNT FAILED — ${dead.length} dead canary case(s), ${stops.length} register problem(s).`);
    process.exit(2);
  }
  console.log(`\nPROBE-REGISTER COUNT PASSED — every typed figure re-derived from probes[], every row's value declared, ${planted} canary case(s) live.`);
}
