// A FIRING PROOF ASSERTS THE STEP, THE LINE AND THE VERDICT — NEVER A BARE NON-ZERO EXIT.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DEFECT THAT EARNED THIS FILE — [R-28]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// scratchpad/433b-slice3-prove-tripwire-fires.mjs records it in its own header, and the words
// are quoted here because this module is the mechanism that stops the next one:
//
//   "The first version asserted only `run.status !== 0` and reported PROVED on both totals.
//    The gate had failed at STEP 3, on assert-fixture-authorship.mjs — the broken record no
//    longer matched the generator it claims — and step 11 never ran at all. The tripwire was
//    never reached, never mind fired, and the proof said it had."
//
// EVERY "PROVED TO FIRE" CLAIM IN THIS PROJECT RESTS ON THAT MECHANISM. A proof asserting only
// a non-zero exit proves only that SOMETHING failed, and on a twelve-step gate the something is
// usually not the thing under test — breaking an input is precisely the act most likely to trip
// an EARLIER step. That is the vacuous-guard defect living inside the instrument that certifies
// the other guards, which is why it gets a module rather than a comment.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE STANDARD, AS FIVE SEPARATE CONDITIONS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Separate, because a single conjunction reports one word and a reader cannot tell which half
// was the weak one. Each carries an id and each is named individually in the report.
//
//   [FS-1] AT THE STEP.        The run failed at the step the declaration under test LIVES in.
//                              Not "failed". Failing three steps earlier is the defect above.
//   [FS-2] THE BROKEN LINE.    The line under test printed the FAILING verdict, quoted verbatim
//                              from the run's own output. A step that failed for some other
//                              reason satisfies [FS-1] and not this.
//   [FS-3] THE OTHERS PASSED.  Every OTHER declared line in the SAME run still read passing. A
//                              step that collapsed rather than compared says nothing about the
//                              declaration; this is the condition that tells the two apart.
//   [FS-4] ONE BREAK EACH.     Each record entry breaks exactly one declaration. A combined
//                              break fires on either and cannot distinguish a live declaration
//                              from an inert one, so breaks are separate by construction.
//   [FS-5] IT STOPS FIRING.    The tool ran clean again after the input was restored, and the
//                              restoration is proved by digest rather than by re-generation.
//                              A guard stuck on is a guard that gets turned off ([R-10]).
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY A RECORD FILE AND NOT AN ASSERTION IN THE PROVER
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A prover that asserts the standard internally still reports PROVED on its own authority, and
// the first draft above did exactly that. So the prover WRITES WHAT IT SAW — the step, the line
// verbatim, the verdict, every other line's verdict — and a separate tool judges it. The prover
// cannot claim a condition it did not observe, because the field it would have to fill is the
// observation itself.
//
// AND A MISSING FIELD IS A STOP, NEVER A SKIP. `if (matches.length && mismatch)` is how a guard
// that could not read its input came to print PASS ([R-17]'s first published instance). A record
// that omits `failed_at_step` is not a record that passed [FS-1]; it is a record that cannot be
// asked, and this module refuses it in as many words.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';

// ---------------------------------------------------------------------------------------
// WHERE THE RECORDS LIVE. Directory, filter and classifier declared in three lines and then
// printed, because a glob is a STOP unless it declares what it sweeps ([R-15]).
// ---------------------------------------------------------------------------------------
export const RECORD_DIR = 'adapters/pdf/firing-proofs';
export const RECORD_FILTER = (name) => name.endsWith('.json');
export const RECORD_CLASSIFIER = (doc) => doc && doc._standard === '[R-28]';
export const RECORD_SWEEP_DECLARATION =
  `${RECORD_DIR}/ — name ends ".json"; classified by the \`_standard\` field declared in the file`;

/** The five conditions, in one place, so the report and the canary name the same set. */
export const STANDARD = [
  { id: 'FS-1', name: 'at the step',       asks: 'the run failed at the step the declaration under test lives in' },
  { id: 'FS-2', name: 'the broken line',   asks: 'the line under test printed the failing verdict, quoted verbatim from the run' },
  { id: 'FS-3', name: 'the others passed', asks: 'every other declared line in the same run still read passing' },
  { id: 'FS-4', name: 'one break each',    asks: 'this entry broke exactly one declaration' },
  { id: 'FS-5', name: 'it stops firing',   asks: 'the tool ran clean again after the input was restored byte for byte' },
];

/** Every field a break entry must carry. Absent is refused; it is not read as a pass. */
export const REQUIRED_FIELDS = [
  'declaration', 'line', 'broke', 'tool_exit', 'failed_at_step', 'step_the_declaration_lives_in',
  'broken_line_verbatim', 'broken_line_verdict', 'failing_verdict', 'passing_verdict',
  'other_declared_lines', 'restored_digest_matches', 'clean_after_revert',
];

/**
 * The standard, applied to ONE break entry. Returns a list of problems, each naming the
 * condition id that failed. Exported so the canary exercises THE SAME function the live path
 * uses — a canary against a second copy proves the copy sound and says nothing about the one
 * the report calls.
 */
export const judge = (b) => {
  const problems = [];
  if (!b || typeof b !== 'object') return ['UNREADABLE — the break entry is not an object. A record this module cannot read is a STOP, never a skip.'];

  const missing = REQUIRED_FIELDS.filter((f) => b[f] === undefined || b[f] === null);
  if (missing.length) {
    problems.push(`UNASKABLE — the entry omits ${missing.join(', ')}. A field that is not there is not a condition that passed; it is a condition nobody can ask.`);
    return problems;   // judging the rest would report on fields that do not exist
  }

  // [FS-1] AT THE STEP.
  if (b.failed_at_step !== b.step_the_declaration_lives_in)
    problems.push(`[FS-1] at the step — the declaration lives in step ${b.step_the_declaration_lives_in} and the run failed at step ${b.failed_at_step}. ` +
      'A non-zero exit is not a fired declaration: the step under test was never reached.');
  if (b.tool_exit === 0)
    problems.push(`[FS-1] at the step — the tool exited 0 on a broken input. Nothing fired at all.`);

  // [FS-2] THE BROKEN LINE.
  if (b.broken_line_verdict !== b.failing_verdict)
    problems.push(`[FS-2] the broken line — line ${b.line} read ${JSON.stringify(b.broken_line_verdict)} where the failing verdict on this tool is ${JSON.stringify(b.failing_verdict)}.`);
  if (typeof b.broken_line_verbatim !== 'string' || !b.broken_line_verbatim.trim())
    problems.push('[FS-2] the broken line — no verbatim line was captured, so the verdict above is this record\'s assertion rather than the run\'s output.');
  else if (!b.broken_line_verbatim.includes(b.failing_verdict))
    problems.push(`[FS-2] the broken line — the captured line ${JSON.stringify(b.broken_line_verbatim)} does not contain ${JSON.stringify(b.failing_verdict)}. ` +
      'The quoted evidence and the recorded verdict disagree.');

  // [FS-3] THE OTHERS PASSED.
  if (!Array.isArray(b.other_declared_lines))
    problems.push('[FS-3] the others passed — `other_declared_lines` is not a list, so the run cannot be distinguished from one where the step collapsed.');
  else {
    if (!b.other_declared_lines.length)
      problems.push('[FS-3] the others passed — the list is EMPTY. On a tool with one declared line that would be a checked absence and it must say so with `sole_declared_line: true`; here it is a silence.');
    const notPassing = b.other_declared_lines.filter((o) => o.verdict !== b.passing_verdict);
    for (const o of notPassing)
      problems.push(`[FS-3] the others passed — line ${o.line} read ${JSON.stringify(o.verdict)} in the same run, not ${JSON.stringify(b.passing_verdict)}. ` +
        'The step may have collapsed rather than compared, and a collapsed step proves nothing about the declaration under test.');
    if (b.other_declared_lines.some((o) => o.line === b.line))
      problems.push(`[FS-3] the others passed — line ${b.line} is in its own "other" list, so one of the two readings is of the wrong line.`);
  }

  // [FS-4] ONE BREAK EACH. The shape IS the condition: `broke` names ONE key and the two values
  // it moved between. A list, or a bag of keys, is a combined break wearing a record's clothes.
  const singleBreak = b.broke && typeof b.broke === 'object' && !Array.isArray(b.broke)
    && typeof b.broke.key === 'string' && 'from' in b.broke && 'to' in b.broke;
  if (!singleBreak)
    problems.push('[FS-4] one break each — `broke` must name exactly one key and the two values it moved between, ' +
      `got ${JSON.stringify(b.broke)}. A combined break fires on either and cannot tell a live declaration from an inert one.`);
  else if (String(b.broke.from) === String(b.broke.to))
    problems.push(`[FS-4] one break each — \`broke\` moved ${b.broke.key} from ${JSON.stringify(b.broke.from)} to the same value. Nothing was broken, so nothing fired on a break.`);

  // [FS-5] IT STOPS FIRING.
  if (b.restored_digest_matches !== true)
    problems.push('[FS-5] it stops firing — the input was not proved restored byte for byte, so the clean run below may be a different input rather than a repaired one.');
  if (b.clean_after_revert !== true)
    problems.push('[FS-5] it stops firing — the tool did not run clean after the revert, so the failure above was not the break.');

  return problems;
};

/**
 * An empty `other_declared_lines` is legitimate on a tool with exactly one declared line, and
 * the difference between "the only one" and "nobody looked" has to be stated rather than
 * inferred from a zero — which is [R-04] at the record level.
 */
export const judgeEntry = (b) =>
  (b && b.sole_declared_line === true && Array.isArray(b.other_declared_lines) && !b.other_declared_lines.length)
    ? judge(b).filter((p) => !p.startsWith('[FS-3] the others passed — the list is EMPTY'))
    : judge(b);

/** Write one prover's record. The prover fills observations; it does not fill verdicts. */
export const writeRecord = (path, doc) => {
  if (!path.startsWith(`${RECORD_DIR}/`)) throw new Error(`a firing-proof record belongs under ${RECORD_DIR}/; got ${path}`);
  if (!existsSync(RECORD_DIR)) mkdirSync(RECORD_DIR, { recursive: true });
  const out = { _standard: '[R-28]', ...doc };
  writeFileSync(path, JSON.stringify(out, null, 1) + '\n');
  return path;
};

/** Every record in the declared directory, parsed. An unparseable file is returned as such. */
export const readRecords = () => {
  if (!existsSync(RECORD_DIR)) return [];
  return readdirSync(RECORD_DIR).filter(RECORD_FILTER).sort().map((name) => {
    const path = `${RECORD_DIR}/${name}`;
    try {
      const doc = JSON.parse(readFileSync(path, 'utf8'));
      return { path, doc, unreadable: null, classified: RECORD_CLASSIFIER(doc) };
    } catch (e) { return { path, doc: null, unreadable: e.message, classified: false }; }
  });
};

// ---------------------------------------------------------------------------------------
// THE CANARY. Every detector carries one ([R-17]).
//
// PLANTED: one conforming entry, and one entry violating EACH condition in turn. The
// conforming one must be accepted — a judge that refused everything would pass a
// presence-only canary, which is the shape assert-y-convention's first canary had.
// ---------------------------------------------------------------------------------------
const CONFORMING = () => ({
  declaration: 'arithmetic tripwire | canary | 9z',
  line: '9z',
  broke: { key: 'canary_total', from: '10.00', to: '10.01' },
  tool_exit: 2,
  failed_at_step: 11,
  step_the_declaration_lives_in: 11,
  broken_line_verbatim: '  9z  |  10.00 |  10.01 | NO   (2 feeder cells)',
  broken_line_verdict: 'NO',
  failing_verdict: 'NO',
  passing_verdict: 'yes',
  other_declared_lines: [{ line: '8y', verdict: 'yes' }],
  restored_digest_matches: true,
  clean_after_revert: true,
});

export const runCanary = () => {
  const planted = [
    { want: null,      make: (e) => e },
    { want: '[FS-1]',  make: (e) => ({ ...e, failed_at_step: 3 }) },
    { want: '[FS-1]',  make: (e) => ({ ...e, tool_exit: 0 }) },
    { want: '[FS-2]',  make: (e) => ({ ...e, broken_line_verdict: 'yes' }) },
    { want: '[FS-2]',  make: (e) => ({ ...e, broken_line_verbatim: '  9z  |  10.00 |  10.01 | yes' }) },
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [{ line: '8y', verdict: 'NO' }] }) },
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [] }) },
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [{ line: '9z', verdict: 'yes' }] }) },
    { want: '[FS-4]',  make: (e) => ({ ...e, broke: { keys: { a: 1, b: 2 } } }) },
    { want: '[FS-5]',  make: (e) => ({ ...e, restored_digest_matches: false }) },
    { want: '[FS-5]',  make: (e) => ({ ...e, clean_after_revert: false }) },
    { want: 'UNASKABLE', make: (e) => { const c = { ...e }; delete c.failed_at_step; return c; } },
    { want: 'UNREADABLE', make: () => 'not an object' },
  ];
  const dead = [];
  for (const p of planted) {
    const problems = judgeEntry(p.make(CONFORMING()));
    if (p.want === null) {
      if (problems.length) dead.push(`the CONFORMING entry was refused: ${problems.join(' | ')}. A judge that refuses everything proves nothing.`);
    } else if (!problems.some((x) => x.startsWith(p.want))) {
      dead.push(`a planted ${p.want} violation was NOT caught. Got: ${problems.length ? problems.join(' | ') : '(no problems at all)'}`);
    }
  }
  // AND THE CONDITIONS MUST BE SEPARABLE. A judge returning one blanket problem for everything
  // would satisfy every line above and tell a reader nothing about which half was weak.
  const distinct = new Set();
  for (const p of planted) if (p.want && p.want.startsWith('[FS-')) distinct.add(p.want);
  if (distinct.size !== STANDARD.length)
    dead.push(`the canary plants ${distinct.size} of the ${STANDARD.length} declared conditions; a condition nothing plants is a condition nothing has proved live.`);
  return { live: !dead.length, planted: planted.length, conditions: distinct.size, dead };
};
