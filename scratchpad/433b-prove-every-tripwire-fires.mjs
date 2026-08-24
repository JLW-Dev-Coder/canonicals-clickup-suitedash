// PROVE EVERY DECLARED ARITHMETIC TRIPWIRE ON 433-B FIRES — ONE BREAK EACH — AND REVERT.
//
//   node scratchpad/433b-prove-every-tripwire-fires.mjs
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THE WHOLE SET AND NOT THE NEW ONES
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The [R-28] audit found that 433-B's tripwires had been proved twice and unequally.
// scratchpad/433b-slice3-prove-tripwire-fires.mjs proved 22e and 23e to the standard.
// scratchpad/433b-slice2-prove-tripwire-fires.mjs asserted `run.status !== 0` and printed
// "PROVED: the tripwire fires" — for 19c, and by implication for the three totals beside it
// that it never touched at all. It also edited the fixture WITHOUT a `_co_authored_with_hand`
// declaration, which gate step 3 refuses, so on the evidence it recorded step 11 never ran.
//
// So the four totals from slice 2 have never been seen to say no, and this file breaks every
// declared total on the form, separately, against whatever fixture the form's own resolver
// returns today — not a named path, which is [R-22].
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE PROVER DOES NOT DECIDE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// It records the step the run died at, the broken line verbatim, its verdict, and every other
// declared line's verdict, and writes them to adapters/pdf/firing-proofs/. Whether that is a
// proof is settled by adapters/pdf/assert-firing-proofs.mjs against the five conditions in
// adapters/pdf/firing-proofs.mjs. A prover that judges its own output is how the first draft of
// the slice-3 prover came to report PROVED on a gate that died three steps early.
//
// THE BREAK IS ONE CENT, on each total in turn. "No tolerance in any comparison" ([R-09]) is a
// claim that has to be demonstrable at the smallest unit the form prints.
//
// THE FIXTURE IS RESTORED FROM ITS OWN BYTES and the restoration verified by SHA-256, not by
// re-running the generator: a generator re-run proves the generator deterministic, not that
// this file put back what it took.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolveFixture } from '../adapters/pdf/resolve-fixture.mjs';
import { writeRecord, RECORD_DIR } from '../adapters/pdf/firing-proofs.mjs';

const FORM = '433b';
const STEP_TRIPWIRES_LIVE_IN = 11;   // gate step 11 is where the arithmetic tripwires are checked
const FAILING = 'NO';
const PASSING = 'yes';

const sha = (b) => createHash('sha256').update(b).digest('hex').toUpperCase();

// --- the fixture, DISCOVERED ---------------------------------------------------------------
const res = resolveFixture(FORM, 'acceptance');
const F = res.path;
console.log(`fixture resolved for ${FORM}/acceptance: ${F}`);
const before = readFileSync(F);
const beforeSha = sha(before);
console.log(`  sha256 ${beforeSha}`);

// --- the declared lines, READ FROM THE TOTALS FILE, never listed here -----------------------
const totals = JSON.parse(readFileSync(`adapters/pdf/maps/${FORM}.totals.json`, 'utf8'));
const DECLARED = totals.totals.map((t) => ({ line: t.line, key: t.total_key, caption: t.caption }));

// ═══════════════════════════════════════════════════════════════════════════════════════
// WHICH DECLARED LINES ARE FED BY WHICH — DERIVED FROM THE TOTALS FILE, NEVER TYPED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [FS-3] used to require that every OTHER declared line read passing in the same run. That is
// right while the declared lines are independent, and 433-B stopped being that form at slice 4:
// printed line 50 is "Net Income (Line 36 minus Line 49)", so breaking 36 or 49 makes 50
// disagree too — correctly, by construction — and the judge reported both proofs as possible
// step collapses. It was RIGHT to refuse them and wrong about why.
//
// So this file derives the feeder graph from the totals file itself: line Y depends on line X
// when X's `total_key` appears in one of Y's `feeders[].keys`. A propagated failure is then an
// EXPECTED failure with its cause named, and a dependent that did NOT fail is a defect — it
// would mean a total computed from a broken operand went on agreeing with itself.
const dependsOn = (yLine, xKey) => {
  const y = totals.totals.find((t) => t.line === yLine);
  for (const fd of (y?.feeders || [])) if (Array.isArray(fd.keys) && fd.keys.includes(xKey)) return true;
  return false;
};
const deps = {};
for (const d of DECLARED) deps[d.line] = DECLARED.filter((x) => x.line !== d.line && dependsOn(x.line, d.key)).map((x) => x.line);
console.log('derived feeder graph among the declared lines:');
for (const d of DECLARED) console.log(`  breaking ${d.line.padEnd(4)} must also move: ${deps[d.line].length ? deps[d.line].join(', ') : '(nothing — no declared line is fed by it)'}`);
console.log(`declared total line(s) on ${FORM}: ${DECLARED.length} — ${DECLARED.map((d) => d.line).join(', ')}`);
for (const d of DECLARED) if (!d.key) { console.error(`STOP — the totals file declares line ${d.line} with no total_key; this file cannot break it.`); process.exit(2); }

const gate = () => {
  const r = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', FORM, '--saturated'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

/** The step-11 row for one printed marker, verbatim, or '' if the step never printed one. */
const rowFor = (out, line) => out.split('\n').find((l) => new RegExp(`^\\s{2}${line}\\s+\\|`).test(l)) || '';

/** The verdict in a step-11 row: the field after the third pipe. Absent is reported as absent. */
const verdictOf = (row) => {
  if (!row) return null;
  const parts = row.split('|');
  if (parts.length < 4) return null;
  return (parts[3].trim().split(/\s+/)[0]) || null;
};

/** The step the gate died at, from the gate's own verdict line. null when it did not say. */
const stepOf = (out) => {
  const m = /GATE FAILED at step (\d+)\/(\d+)/.exec(out);
  return m ? Number(m[1]) : null;
};

const breaks = [];
for (const d of DECLARED) {
  const doc = JSON.parse(before.toString('utf8'));
  const good = doc[d.key];
  if (good === undefined) { console.error(`STOP — ${F} carries no key ${d.key}, so line ${d.line} cannot be broken in it.`); writeFileSync(F, before); process.exit(2); }
  const bad = (Number(good) + 0.01).toFixed(2);
  doc[d.key] = bad;

  // THE BREAK DECLARES ITSELF. A hand-edited key in a generated fixture is exactly what
  // `_co_authored_with_hand` is for, and gate step 3 is right to demand it. The declaration is
  // not a way AROUND step 3 — it is the true statement that lets step 3 pass so that step 11
  // can be reached at all. Its absence is what made the slice-2 proof vacuous.
  doc._TRIPWIRE_PROOF = `TEMPORARY. ${d.key} is ${bad} where the printed operands of line ${d.line} sum to ${good}. One cent. Reverted by scratchpad/433b-prove-every-tripwire-fires.mjs in the same run that wrote it.`;
  doc._co_authored_with_hand = {
    [d.key]: `A DELIBERATE ONE-CENT BREAK, held only for the length of one gate run. The generator writes ${good}, the sum the caption of printed line ${d.line} names; this file writes ${bad} so the arithmetic tripwire on ${d.line} says ${FAILING}. Reverted from the fixture's own bytes in the same run, and the restoration verified by SHA-256.`,
    _TRIPWIRE_PROOF: 'The sentence recording the break, written beside it and removed with it.',
    _co_authored_with_hand: 'THIS DECLARATION ITSELF. It exists only while the break does.',
  };
  writeFileSync(F, JSON.stringify(doc, null, 1) + '\n');
  console.log('');
  console.log(`BROKEN: ${d.key}  ${good} -> ${bad}   (one cent, printed marker ${d.line})`);

  const run = gate();
  const brokenRow = rowFor(run.out, d.line);
  const others = DECLARED.filter((x) => x.line !== d.line).map((x) => {
    const row = rowFor(run.out, x.line);
    const fed = deps[d.line].includes(x.line);
    return {
      line: x.line, verdict: verdictOf(row), verbatim: row.trim(),
      expected: fed ? FAILING : PASSING,
      ...(fed ? { depends_on_the_broken_line: `${x.line} names ${d.key} among its own feeders in ${FORM}.totals.json, so a one-cent break in ${d.line} must move ${x.line} too` } : {}),
    };
  });
  console.log(`  gate exit ${run.status}, failed at step ${stepOf(run.out)}`);
  console.log(`  ${brokenRow.trim() || '(the step printed no row for this line)'}`);

  // --- restore, and prove it ---
  writeFileSync(F, before);
  const afterSha = sha(readFileSync(F));
  if (afterSha !== beforeSha) { console.error(`STOP — the fixture was NOT restored byte for byte after breaking ${d.key}.`); process.exit(2); }
  console.log(`  REVERTED: sha256 ${afterSha} — byte-for-byte identical to the file read before the break.`);

  breaks.push({
    declaration: `arithmetic tripwire | ${FORM} | ${d.line}`,
    line: d.line,
    caption: d.caption,
    broke: { key: d.key, from: String(good), to: String(bad) },
    tool: `node adapters/pdf/run-form-gate.mjs ${FORM} --saturated`,
    tool_exit: run.status,
    failed_at_step: stepOf(run.out),
    step_the_declaration_lives_in: STEP_TRIPWIRES_LIVE_IN,
    broken_line_verbatim: brokenRow.trim(),
    broken_line_verdict: verdictOf(brokenRow),
    failing_verdict: FAILING,
    passing_verdict: PASSING,
    other_declared_lines: others,
    restored_digest_matches: afterSha === beforeSha,
    clean_after_revert: null,   // filled below, from the one run that follows every revert
  });
}

// --- IT STOPS FIRING. One clean run after the last revert, and it applies to all of them:
//     every break was reverted and digest-proved individually, so the fixture the gate reads
//     here is byte-identical to the one it read before the first break.
const again = gate();
const cleanLine = (again.out.split('\n').find((l) => /^GATE/.test(l)) || '(no verdict line)').trim();
console.log('');
console.log(`gate after every revert: exit ${again.status} — ${cleanLine}`);
for (const b of breaks) b.clean_after_revert = again.status === 0;

const path = writeRecord(`${RECORD_DIR}/${FORM}.tripwires.json`, {
  form: FORM,
  _generated_by: 'scratchpad/433b-prove-every-tripwire-fires.mjs',
  tool_under_test: `adapters/pdf/run-form-gate.mjs ${FORM} --saturated`,
  fixture: F,
  fixture_sha256: beforeSha,
  fixture_resolved_by: 'adapters/pdf/resolve-fixture.mjs — role acceptance; never a named path ([R-22])',
  declarations_on_this_tool: DECLARED.length,
  declarations_source: `adapters/pdf/maps/${FORM}.totals.json — the totals list, read, not typed`,
  clean_run_after_every_revert: { exit: again.status, verdict_line: cleanLine },
  breaks,
});
console.log('');
console.log(`record written: ${path}`);
console.log(`  ${breaks.length} break(s), one per declared line, each recording the step, the line and every other line's verdict.`);
console.log('  WHETHER THAT IS A PROOF IS NOT THIS FILE\'S TO SAY: run node adapters/pdf/assert-firing-proofs.mjs');
