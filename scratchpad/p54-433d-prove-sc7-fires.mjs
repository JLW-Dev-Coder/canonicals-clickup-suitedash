// EVERY SUBJECT-CONDITIONAL CELL ON 433-D FIRES, INDEPENDENTLY OF EVERY OTHER.
//
//   node scratchpad/p54-433d-prove-sc7-fires.mjs
//
//   writes adapters/pdf/firing-proofs/433d.subject-conditional.json
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IS BEING PROVED, AND WHY A BARE NON-ZERO EXIT WOULD PROVE NOTHING
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [SC-7] is the clause that stops an entity record carrying a spouse's signature: a cell the page
// draws for ONE legal person must be empty on a record declaring the other, and a value there is
// a STOP. It is the half of the three-class discriminator the binary would have lost — a
// conditional cell read as subject-independent binds once and is never asked to be empty at all.
//
// A claim that it fires cannot rest on the engine exiting non-zero. [R-28]: on a twelve-step gate
// the break is the act most likely to trip an EARLIER step, so "something failed" is the one
// thing a broken input reliably produces. Two tripwires were once reported PROVED on a run that
// failed at step 3 and never reached step 11.
//
// So each break asserts THE STEP, THE LINE and THE VERDICT, and every other declared line reads
// what it was DERIVED to read — which for this tool means three states, not two:
//
//   empty      the cell exists for the other subject and this record left it empty  (passing)
//   NOT EMPTY  it exists for the other subject and this record filled it            (failing)
//   SKIPPED    it exists for THIS record's subject, so the assertion was not asked  (out of class)
//
// The third carries a derived cause, as [FS-3] requires of the fourth state: the cause is the
// map's own `empty_unless` beside the record's declared subject, and it is read from the map
// rather than typed here.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE BREAK SIZE, DERIVED FROM THE COARSEST UNIT AMONG EVERYTHING IT MOVES
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// An arithmetic tripwire breaks by one cent because the cells it moves print to the cent. An
// EMPTINESS assertion has no magnitude: what it compares is presence against absence, so the
// smallest expressible break is ONE UNIT OF THE THING THE CELL HOLDS. For a text cell that is a
// single character; for a checkbox it is a single tick, and a tick has no smaller half. Two of
// the five conditional cells on this form are checkboxes — the two Master File review codes —
// so the coarsest unit among everything a break moves is ONE TICK, and the text breaks are held
// to one character so that no break is larger than the coarsest unit demands.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// NOTHING IN THE TREE IS EDITED, AND THE REVERT IS PROVED ANYWAY
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The 433-B proofs edit a committed fixture in place and declare the co-authorship. Here the
// broken record is SYNTHESISED into adapters/pdf/tmp/, which is gitignored and registered at
// [SB-91], so no committed byte moves at any point. [FS-5] is still asked and asked harder: the
// sandbox record is deleted and its ABSENCE VERIFIED, the committed acceptance and branch
// fixtures are digested before the first break and after the last, and the gate is re-run clean
// on both. A revert that only removes a file it created still has to show the tree it did not
// touch is the tree it started with.

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const MAP = 'adapters/pdf/maps/433d.map.json';
const OUT = 'adapters/pdf/firing-proofs/433d.subject-conditional.json';
const SANDBOX = 'adapters/pdf/tmp/p54-sc7';
const mapDoc = JSON.parse(readFileSync(MAP, 'utf8'));
const mirror = JSON.parse(readFileSync(mapDoc._the_mirror.declaration, 'utf8'));

const digest = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const FIXTURES = ['samples/433d.sample.json', 'samples/433d.entity.sample.json'];
const before = Object.fromEntries(FIXTURES.map((f) => [f, digest(f)]));

const CONDITIONAL = Object.entries(mapDoc.subject_classes)
  .filter(([, e]) => e.class === 'conditional')
  .map(([stem, e]) => ({ stem, side: e.empty_unless, caption: e.caption }));
if (!CONDITIONAL.length) { console.error('STOP — the map declares no subject-conditional cell, so this prover has nothing to break and would report a clean run over an empty set.'); process.exit(2); }

const SIDES = [...new Set(CONDITIONAL.map((c) => c.side))];
if (SIDES.length !== 2) { console.error(`STOP — the conditional cells name ${SIDES.length} side(s) (${SIDES.join(', ')}). A proof that only ever breaks one side proves the assertion in one direction.`); process.exit(2); }
const other = (side) => SIDES.find((s) => s !== side);

const keyOfStem = (stem) => (mapDoc._key_overrides || {})[stem]
  || `433d_${stem.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/_+/g, '_').toLowerCase()}`;
const isCheckbox = (stem) => (mirror.pairs.find((p) => p.stem === stem) || {}).type === 'PDFCheckBox';

/** The option key that turns a checkbox conditional on, read out of the map's own option sets. */
const optionKeyFor = (stem) => {
  for (const [set, def] of Object.entries(mapDoc.checkboxes || {})) {
    if (!def || Array.isArray(def) || typeof def !== 'object') continue;
    for (const [opt, targets] of Object.entries(def)) {
      if (opt.startsWith('_')) continue;
      if (Array.isArray(targets) && targets.some((t) => t.endsWith(`${stem}[0]`))) return { set, opt };
    }
  }
  return null;
};

mkdirSync(SANDBOX, { recursive: true });
const breaks = [];
const runs = [];

for (const c of CONDITIONAL) {
  // The record declares the OTHER subject, so this cell is required empty — and then it is
  // filled. Built from the committed fixture for that subject, so the only difference between a
  // passing run and this one is the single value the break moves.
  const baseFixture = other(c.side) === 'individual' ? 'samples/433d.sample.json' : 'samples/433d.entity.sample.json';
  const rec = JSON.parse(readFileSync(baseFixture, 'utf8'));
  rec.intake_id = `SC7-BREAK-${c.stem}`;
  rec._fixture = { role: 'production', why: `SYNTHESISED BY scratchpad/p54-433d-prove-sc7-fires.mjs, in a gitignored sandbox, to break exactly one [SC-7] declaration. Never committed.` };

  let broke;
  if (isCheckbox(c.stem)) {
    const o = optionKeyFor(c.stem);
    if (!o) { console.error(`STOP — ${c.stem} is a checkbox and no declared option set names it, so this prover cannot express a one-tick break.`); process.exit(2); }
    broke = { key: o.set, from: String(rec[o.set] ?? ''), to: o.opt };
    rec[o.set] = o.opt;
  } else {
    const k = keyOfStem(c.stem);
    broke = { key: k, from: String(rec[k] ?? ''), to: 'X' };   // ONE CHARACTER
    rec[k] = 'X';
  }

  const recPath = `${SANDBOX}/${c.stem}.json`;
  writeFileSync(recPath, JSON.stringify(rec, null, 1) + '\n');

  const r = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', '433d', recPath, '--saturated'], { encoding: 'utf8' });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  runs.push({ stem: c.stem, exit: r.status });

  // THE VERDICT ALTERNATION IS SPELLED OUT, NOT MATCHED AS \S+. The first draft read the verdict
  // as one non-space run and captured "NOT" out of "NOT EMPTY", so every break recorded a verdict
  // that matched nothing the engine declares as failing -- and [FS-2] would have refused all five
  // for a reason that was true of the reader rather than of the run.
  const sc = [...out.matchAll(/^SC7 (\S+)\s+(NOT EMPTY|SKIPPED|empty)\s+(.*)$/gm)].map((m) => ({ stem: m[1], verdict: m[2], verbatim: m[0].trimEnd() }));
  const mine = sc.find((x) => x.stem === c.stem);
  const stepM = /GATE FAILED at step (\d+)\/\d+/.exec(out);

  breaks.push({
    declaration: `subject-conditional emptiness | 433d | ${c.stem}`,
    line: c.stem,
    caption: c.caption,
    record: recPath,
    record_role: 'synthesised in a gitignored sandbox; no committed byte was edited',
    record_built_from: baseFixture,
    record_subject: other(c.side),
    broke,
    break_size: isCheckbox(c.stem) ? 'one tick' : 'one character',
    break_size_derived_from: isCheckbox(c.stem)
      ? 'the cell is a CHECKBOX, and a tick has no smaller half. An emptiness assertion compares presence against absence rather than magnitude, so the smallest expressible break is one unit of what the cell holds.'
      : 'the cell is a TEXT FIELD and the assertion compares presence against absence rather than magnitude, so the smallest expressible break is ONE CHARACTER. The coarsest unit among everything any break in this record moves is one tick, from the two checkbox cells; the text breaks are held to one character so that no break is larger than the coarsest unit demands.',
    rounding_mode: null,
    tool: `node adapters/pdf/run-form-gate.mjs 433d ${recPath} --saturated`,
    tool_exit: r.status,
    failed_at_step: stepM ? Number(stepM[1]) : null,
    step_the_declaration_lives_in: 7,
    broken_line_verbatim: mine ? mine.verbatim : '',
    broken_line_verdict: mine ? mine.verdict : null,
    failing_verdict: 'NOT EMPTY',
    passing_verdict: 'empty',
    skipped_verdict: 'SKIPPED',
    other_declared_lines: CONDITIONAL.filter((x) => x.stem !== c.stem).map((x) => {
      const seen = sc.find((y) => y.stem === x.stem);
      const inClass = x.side !== other(c.side);
      return {
        line: x.stem,
        verdict: seen ? seen.verdict : null,
        verbatim: seen ? seen.verbatim : null,
        expected: inClass ? 'empty' : 'SKIPPED',
        ...(inClass ? {} : { not_in_class_because: `adapters/pdf/maps/433d.map.json declares subject_classes.${x.stem}.empty_unless = ${JSON.stringify(x.side)}, and this record declares itself ${JSON.stringify(other(c.side))} — the cell exists for THIS record's subject, so the emptiness assertion is not asked of it.` }),
      };
    }),
    restored_digest_matches: null,     // filled after the revert below
    clean_after_revert: null,
  });
}

// ── THE REVERT, AND IT IS ASKED HARDER THAN A FILE DELETION WOULD NEED ─────────────────────
rmSync(SANDBOX, { recursive: true, force: true });
const sandboxGone = !existsSync(SANDBOX);
const after = Object.fromEntries(FIXTURES.map((f) => [f, digest(f)]));
const digestsMatch = FIXTURES.every((f) => before[f] === after[f]);

const cleanRuns = FIXTURES.map((f) => {
  const r = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', '433d', f, '--saturated'], { encoding: 'utf8' });
  return { fixture: f, exit: r.status, passed: r.status === 0 };
});
const cleanAfter = sandboxGone && digestsMatch && cleanRuns.every((x) => x.passed);
for (const b of breaks) { b.restored_digest_matches = sandboxGone && digestsMatch; b.clean_after_revert = cleanAfter; }

const doc = {
  _standard: '[R-28]',
  _standard_is: 'adapters/pdf/firing-proofs.mjs STANDARD — [FS-1] at the step, [FS-2] the broken line, [FS-3] the others read as expected, [FS-4] one break each, [FS-5] it stops firing.',
  form: '433d',
  _generated_by: 'scratchpad/p54-433d-prove-sc7-fires.mjs',
  tool_under_test: 'adapters/pdf/fill-433d.mjs, reached through gate step 7',
  _what_the_declared_lines_ARE: 'THE SUBJECT-CONDITIONAL CELLS, one declared line each, printed by the fill engine as `SC7 <stem> <verdict>` on every run whether it passes or fails. They are read out of adapters/pdf/maps/433d.map.json rather than listed here, so a sixth conditional cell is broken the day it is declared and a cell that stops being conditional stops being broken.',
  _why_the_step_is_7: 'The declaration lives in the FILL engine, which is gate step 7. That is asserted rather than assumed: [FS-1] compares the step the run failed at against the step declared here, and a break that tripped an earlier step — a tampered fixture at step 3, the shape that once produced two false PROVED reports — fails this condition rather than passing it.',
  records_swept: FIXTURES,
  declarations_on_this_tool: CONDITIONAL.length,
  declarations_source: 'adapters/pdf/maps/433d.map.json subject_classes, filtered to class === "conditional"',
  _both_sides_broken: `The five declarations split ${SIDES.map((s) => `${CONDITIONAL.filter((c) => c.side === s).length} ${s}`).join(' / ')}, and every one is broken separately. A proof that only ever broke one side would prove the assertion fires on individual-only cells and say nothing about entity-only ones — which is the direction the binary discriminator got wrong.`,
  clean_run_after_every_revert: cleanAfter,
  _the_revert: {
    sandbox: SANDBOX,
    sandbox_removed: sandboxGone,
    committed_fixtures_unchanged: digestsMatch,
    digests_before: before,
    digests_after: after,
    clean_runs: cleanRuns,
    _why_digests_at_all: 'No committed byte is edited by this prover — the broken records are synthesised into a gitignored sandbox. The digests are taken anyway, because "I did not touch it" is a claim by the thing being checked, and [FS-5] exists so that the failure above is the break rather than a difference in the input.',
  },
  breaks,
};

mkdirSync('adapters/pdf/firing-proofs', { recursive: true });
writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
console.log(`wrote ${OUT}`);
console.log('');
console.log(`433-D [SC-7] BREAK PROOF — ${breaks.length} declaration(s), each broken alone`);
for (const b of breaks)
  console.log(`  ${b.line.padEnd(18)} exit ${b.tool_exit} at step ${b.failed_at_step} (declared ${b.step_the_declaration_lives_in})  verdict ${JSON.stringify(b.broken_line_verdict)}  break ${b.break_size}  others: ${b.other_declared_lines.map((o) => `${o.line}=${o.verdict}`).join(' ')}`);
console.log('');
console.log(`  revert: sandbox removed ${sandboxGone}, committed fixtures unchanged ${digestsMatch}, clean gate runs ${cleanRuns.map((c) => `${c.fixture.split('/').pop()}=${c.exit}`).join(' ')}`);
