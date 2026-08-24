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
//   [FS-3] THE OTHERS READ      Every OTHER declared line in the SAME run read THE VERDICT IT WAS
//          WHAT THEY WERE       EXPECTED TO READ. A step that collapsed rather than compared says
//          EXPECTED TO.         nothing about the declaration; this is the condition that tells
//                              the two apart. A line expected to FAIL must name a dependency
//                              DERIVED from the tool's own declaration; an expectation of failure
//                              with no derived cause behind it is refused in as many words.
//                              AMENDED — see THE AMENDMENT below for the original and its fate.
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
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE AMENDMENT ON [FS-3], AND THE ORIGINAL KEPT VERBATIM ([R-21])
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// THE ORIGINAL CONDITION, WORD FOR WORD, as it was committed:
//
//     [FS-3] THE OTHERS PASSED.  Every OTHER declared line in the SAME run still read passing. A
//                                step that collapsed rather than compared says nothing about the
//                                declaration; this is the condition that tells the two apart.
//
//     asks: 'every other declared line in the same run still read passing'
//
// WHAT IT GOT RIGHT, and it is the whole mechanism. On a twelve-step gate the break is the act
// most likely to trip an EARLIER step, so "something failed" is the one thing a broken input
// reliably produces. The way to tell a step that COMPARED from a step that COLLAPSED is to ask
// what the lines BESIDE the broken one did, and that is this condition's idea. Nothing replaces
// it; the amendment keeps it and makes it answerable on one more shape of tool.
//
// WHAT IT GOT WRONG, and it is a rule stated at the wrong universe ([R-07] one level up from
// figures). It required every other declared line to read PASSING. That is correct while the
// declared lines are INDEPENDENT — which was true of every form that had come before — and it
// is false the moment one line is computed FROM another. 433-B prints line 50 as "Net Income
// (Line 36 minus Line 49)", so a one-cent break in 36 or in 49 makes 50 disagree too, correctly
// and by construction. The judge refused both of those proofs as possible step collapses. IT WAS
// RIGHT TO REFUSE THEM AND WRONG ABOUT WHY: the records could not express what had happened, so
// refusing them was the only honest answer available to a judge that could not be told.
//
// WHY THE AMENDMENT IS STRONGER THAN WHAT IT REPLACES, not weaker. A propagated failure is a
// THIRD state, not a tolerated second one:
//
//   - each other line carries THE VERDICT IT WAS EXPECTED TO READ, so a record that says nothing
//     about a line is unaskable rather than passing;
//   - a line expected to FAIL must name a dependency DERIVED FROM THE TOOL'S OWN DECLARATION —
//     on this form, from the feeder graph in adapters/pdf/maps/433b.totals.json, where Y depends
//     on X when X's `total_key` appears in one of Y's `feeders[].keys`;
//   - BOTH DIRECTIONS are checked, and the dependent direction is the stronger claim, because a
//     dependent that PASSED would mean a total computed from a broken operand went on agreeing
//     with itself — a state the original condition could not even express, let alone catch;
//   - AN EXPECTATION OF FAILURE WITH NO DERIVED CAUSE BEHIND IT IS REFUSED IN AS MANY WORDS.
//
// That last clause is the one that matters. Permitting "expected to fail" without requiring a
// derived cause would have created the one place in this engine where an inconvenient failure
// could be parked, and it would have been A TOLERANCE WEARING A DIFFERENT NAME ([R-09] forbids
// the thing, and a field is as good a place to hide one as a comparison). Deriving the
// dependency from the feeder graph rather than accepting an assertion is what closes it.
//
// WHAT THE AMENDMENT ITSELF THEN BROKE, found by this commit and repaired in it. The amendment
// renamed this condition's messages from "the others passed" to "the others read as expected"
// and left `judgeEntry()` filtering on the OLD string — so the `sole_declared_line: true`
// exemption, which exists so that a tool with exactly one declared line can say "the only one"
// rather than be read as "nobody looked" ([R-04]), MATCHED NOTHING AND WAS DEAD. A conforming
// sole-line record was still refused, by a message telling its author to add the field they had
// already added. Nothing caught it because the canary never planted that shape.
//
// This is [R-12] exactly — a refactor of a guard is a change to the guard — committed by the
// commit that sharpened the guard, which is the class [R-12] says to expect the fix to
// reproduce. The repair is in the same place as the cause: the prefix is DERIVED from STANDARD
// so the filter and the message cannot name different things again, and the canary now plants
// the exemption in both directions.

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
  { id: 'FS-3', name: 'the others read as expected', asks: 'every other declared line in the same run read the verdict it was DERIVED to read — passing, unless the tool\'s own declaration makes it depend on the broken one, in which case failing' },
  { id: 'FS-4', name: 'one break each',    asks: 'this entry broke exactly one declaration' },
  { id: 'FS-5', name: 'it stops firing',   asks: 'the tool ran clean again after the input was restored byte for byte' },
];

/**
 * THE MESSAGE PREFIX FOR ONE CONDITION, DERIVED FROM STANDARD RATHER THAN TYPED.
 *
 * This function exists because of a defect it now makes impossible. The [FS-3] amendment renamed
 * that condition's messages from "the others passed" to "the others read as expected" and left
 * judgeEntry() filtering on the old literal — so the `sole_declared_line` exemption matched
 * nothing and a conforming sole-line record was refused by a message telling its author to add
 * the field they had already added. Two hand-kept spellings of one condition's name is the
 * parallel-list defect guard-sweep.mjs enumerates; there is now one spelling and it is STANDARD's.
 */
export const prefixOf = (id) => {
  const c = STANDARD.find((s) => s.id === id);
  if (!c) throw new Error(`STOP — no condition ${id} in STANDARD. A message cannot be built for a condition that is not declared.`);
  return `[${c.id}] ${c.name} — `;
};
const FS3 = prefixOf('FS-3');

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

  // ─────────────────────────────────────────────────────────────────────────────────────
  // [FS-3] THE OTHERS READ WHAT THEY WERE EXPECTED TO — AND THE FIRST DRAFT SAID "PASSED"
  // ─────────────────────────────────────────────────────────────────────────────────────
  //
  // The first draft required every other declared line to read passing, full stop. That is
  // right whenever the declared lines are INDEPENDENT and wrong the moment one of them is
  // computed FROM another. 433-B's printed line 50 is "Net Income (Line 36 minus Line 49)":
  // breaking 36 or 49 makes 50 disagree too, correctly and by construction, and this judge
  // reported both proofs as possible step collapses.
  //
  // IT WAS RIGHT TO REFUSE THEM AND WRONG ABOUT WHY, so the condition is sharpened rather
  // than relaxed. A propagated failure is a THIRD state, not a tolerated second one, and the
  // record must DERIVE it: each other line carries the verdict it was expected to read, and a
  // line expected to fail is one the tool's own declaration says is fed by the broken one.
  // Both directions are checked, and the dependent direction is the stronger claim — a
  // dependent that read passing would mean the dependency is not live at all.
  if (!Array.isArray(b.other_declared_lines))
    problems.push(`${FS3}\`other_declared_lines\` is not a list, so the run cannot be distinguished from one where the step collapsed.`);
  else {
    if (!b.other_declared_lines.length)
      problems.push(`${FS3}the list is EMPTY. On a tool with one declared line that would be a checked absence and it must say so with \`sole_declared_line: true\`; here it is a silence.`);
    for (const o of b.other_declared_lines) {
      if (o.expected === undefined)
        { problems.push(`${FS3}line ${o.line} carries no \`expected\` verdict. A record that does not say what a line was supposed to read cannot be asked whether it read it.`); continue; }
      if (o.expected !== b.passing_verdict && o.expected !== b.failing_verdict)
        { problems.push(`${FS3}line ${o.line} expects ${JSON.stringify(o.expected)}, which is neither the passing nor the failing verdict of this tool.`); continue; }
      if (o.expected === b.failing_verdict && !o.depends_on_the_broken_line)
        { problems.push(`${FS3}line ${o.line} is expected to FAIL and the record gives no derived dependency saying why. An expectation of failure with no stated cause is a tolerance wearing a field name.`); continue; }
      if (o.verdict === o.expected) continue;
      problems.push(o.expected === b.passing_verdict
        ? `${FS3}line ${o.line} read ${JSON.stringify(o.verdict)} in the same run and nothing feeds it from line ${b.line}, so it was expected to read ${JSON.stringify(b.passing_verdict)}. The step may have collapsed rather than compared.`
        : `${FS3}line ${o.line} is fed by line ${b.line} (${o.depends_on_the_broken_line}) and read ${JSON.stringify(o.verdict)} rather than ${JSON.stringify(b.failing_verdict)}. The dependency the record derives is not live: breaking an operand did not move the total computed from it.`);
    }
    if (b.other_declared_lines.some((o) => o.line === b.line))
      problems.push(`${FS3}line ${b.line} is in its own "other" list, so one of the two readings is of the wrong line.`);
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
export const judgeEntry = (b) => {
  const problems = judge(b);
  if (!(b && b.sole_declared_line === true && Array.isArray(b.other_declared_lines) && !b.other_declared_lines.length))
    return problems;
  // THE PREFIX IS DERIVED, NOT TYPED. The literal that used to live here named the condition by
  // its pre-amendment name and therefore matched nothing; the exemption was dead and a
  // conforming record was refused. `prefixOf` reads STANDARD, which is also what builds the
  // message being filtered, so the two cannot name different things again.
  const emptyListProblem = `${FS3}the list is EMPTY`;
  const kept = problems.filter((p) => !p.startsWith(emptyListProblem));
  // AND THE FILTER MUST HAVE SOMETHING TO REMOVE. A sole-line record reaches here only because
  // its `other_declared_lines` is empty, so judge() must have raised exactly that problem. If it
  // did not, the message and this filter have drifted apart AGAIN and the exemption is silently
  // doing nothing — which is the state that went uncaught for a whole commit. Refuse rather than
  // return a list that looks clean.
  if (kept.length === problems.length)
    return [...problems, `UNFILTERABLE — \`sole_declared_line\` is declared and no ${JSON.stringify(emptyListProblem)} problem was raised to exempt. ` +
      'The exemption and the message it exempts have drifted apart; the exemption is inert and this record has NOT been judged under it.'];
  return kept;
};

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
  other_declared_lines: [
    { line: '8y', verdict: 'yes', expected: 'yes' },
    { line: '7x', verdict: 'NO', expected: 'NO', depends_on_the_broken_line: '7x sums 9z, derived from the canary tool\'s own feeder list' },
  ],
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
    // an INDEPENDENT line that failed — the step may have collapsed
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [{ line: '8y', verdict: 'NO', expected: 'yes' }] }) },
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [] }) },
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [{ line: '9z', verdict: 'yes', expected: 'yes' }] }) },
    // a line with NO stated expectation at all — unaskable, not passing
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [{ line: '8y', verdict: 'yes' }] }) },
    // a DEPENDENT line that passed — the dependency the record derives is not live. This is
    // the direction the first draft could not even express, and it is the one that would let
    // a total computed from a broken operand go on agreeing with itself.
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [{ line: '7x', verdict: 'yes', expected: 'NO', depends_on_the_broken_line: '7x sums 9z' }] }) },
    // an expectation of failure with no derived dependency behind it — a tolerance wearing a
    // field name, which is exactly how this condition would be quietly turned off.
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [{ line: '8y', verdict: 'NO', expected: 'NO' }] }) },
    // an expectation that is neither verdict of this tool
    { want: '[FS-3]',  make: (e) => ({ ...e, other_declared_lines: [{ line: '8y', verdict: 'yes', expected: 'maybe' }] }) },
    { want: '[FS-4]',  make: (e) => ({ ...e, broke: { keys: { a: 1, b: 2 } } }) },
    { want: '[FS-5]',  make: (e) => ({ ...e, restored_digest_matches: false }) },
    { want: '[FS-5]',  make: (e) => ({ ...e, clean_after_revert: false }) },
    { want: 'UNASKABLE', make: (e) => { const c = { ...e }; delete c.failed_at_step; return c; } },
    { want: 'UNREADABLE', make: () => 'not an object' },
    // THE `sole_declared_line` EXEMPTION, IN BOTH DIRECTIONS — the shape nothing planted, which
    // is why the amendment could kill it and no run said so.
    //
    // ACCEPTED: a tool with exactly one declared line, declaring itself as such. This one is
    // asserted separately below rather than here, because `planted` only checks that a wanted
    // problem APPEARS and this case's whole claim is that no problem appears at all.
    // REFUSED: the same empty list WITHOUT the declaration, which must still raise [FS-3] —
    // already planted above as `other_declared_lines: []`. The pair is the point: an empty list
    // is a checked absence when it says so and a silence when it does not.
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
  // THE EXEMPTION IS PROVED LIVE, IN BOTH DIRECTIONS, AND THIS IS THE CANARY THAT DID NOT EXIST.
  //
  // A sole-line record that DECLARES itself must be accepted; the same record WITHOUT the
  // declaration must be refused. Testing only the first would pass on a judge that exempted
  // everything, and testing only the second is what the canary already did — which is exactly
  // how the amendment came to kill the exemption without any run noticing.
  const soleOK = judgeEntry({ ...CONFORMING(), other_declared_lines: [], sole_declared_line: true });
  if (soleOK.length)
    dead.push(`a CONFORMING sole-declared-line record was refused: ${soleOK.join(' | ')}. ` +
      'The `sole_declared_line` exemption is inert, so a tool with one declared line cannot state a checked absence.');
  const soleUndeclared = judgeEntry({ ...CONFORMING(), other_declared_lines: [] });
  if (!soleUndeclared.some((p) => p.startsWith(FS3)))
    dead.push('an empty `other_declared_lines` WITHOUT `sole_declared_line` was accepted. ' +
      'The exemption is exempting every empty list, so a silence and a checked absence are the same thing again.');

  // AND THE CONDITIONS MUST BE SEPARABLE. A judge returning one blanket problem for everything
  // would satisfy every line above and tell a reader nothing about which half was weak.
  const distinct = new Set();
  for (const p of planted) if (p.want && p.want.startsWith('[FS-')) distinct.add(p.want);
  if (distinct.size !== STANDARD.length)
    dead.push(`the canary plants ${distinct.size} of the ${STANDARD.length} declared conditions; a condition nothing plants is a condition nothing has proved live.`);
  return { live: !dead.length, planted: planted.length, conditions: distinct.size, dead };
};
