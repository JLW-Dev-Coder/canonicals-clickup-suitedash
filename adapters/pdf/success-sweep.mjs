// THE FOURTH SWEEP — A SUCCESS MESSAGE IS GUARDED BY THE CONDITION IT REPORTS ON.
//
//   node adapters/pdf/success-sweep.mjs [--verbose]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `adapters/hubspot/derive-names-433aoi.mjs` ended:
//
//     if (stops.length) {
//       console.error(`\nSTOP - ${stops.length} assertion failure(s):`);
//       for (const s of stops) console.error('  ' + s);
//       process.exitCode = 3;
//     }
//     console.log('all assertions passed.');
//        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ unconditional, and printed directly UNDERNEATH
//                                          its own "STOP - 1 assertion failure(s)".
//
// The exit code was right. The sentence a reader sees last was a lie, on every failing run,
// from the commit that wrote it. It was found by grepping for the phrase for an unrelated
// reason — which is to say it was found by luck, and luck is not a check.
//
// This is the vacuous guard's sibling. [G-01] asks whether an EMPTY INPUT can make a
// predicate report success. This asks whether a FAILING RUN can make a SENTENCE report
// success. Same defect, one layer out: the finding count is correct and the prose beside it
// is not tied to it.
//
// `process.exitCode = 3` is precisely what made it survive. It is an assignment, not a jump:
// execution falls straight through to the next line. Every other terminal success message in
// this engine sits after `process.exit(2)` or `return 2`, which do jump. That one-character
// difference between a call and an assignment is the entire defect, and it is the
// discriminator witness (b) below is built on.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THE VERDICTS ARE DERIVED AND NOT AUTHORED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// guard-sweep.mjs anchors a hand-written verdict to each site, because "can an empty input
// satisfy this predicate" is a question about MEANING that no scanner answers. This sweep's
// question is about CONTROL FLOW, and control flow is readable. So every site's verdict is
// re-derived on every run from three mechanical witnesses, and the register below holds only
// the sites where the derivation is overridden, each with a reason.
//
// A hand-typed verdict here would be a disposition nobody re-reads, standing over code that
// moves — which is the state `_arguable_page{N}` was in. Deriving it means EDITING THE GUARD
// RE-DERIVES ITS VERDICT, with no anchor to drift off.
//
//   (a) TIED       the nearest enclosing conditional names a finding count — `!problems.length`,
//                  `!errs.length`, `!bad`, `!r.findings.length`. The message cannot print on a
//                  run that found something.
//
//   (b) TERMINAL   the NEAREST failure accumulation above the site — the closest enclosing-scope
//                  `if (<finding count>) { … }` — JUMPS out: `process.exit(n)`, `return n` with
//                  n non-zero, a STOP helper, or a throw. Reaching the message proves that
//                  branch was not taken. `process.exitCode = n` is NOT a jump and is NOT
//                  accepted here; that exclusion is the whole reason this file exists.
//
//                  IT IS THE NEAREST ONE, NOT ANY ONE. An earlier `if (problems.length) exit(2)`
//                  vouches for `problems` and for nothing else. `derive-names-433aoi.mjs` had
//                  exactly that shape — a jumping guard over one finding set, then a
//                  non-jumping guard over `stops`, then the bare success line — so a witness
//                  that accepted ANY jump above would have certified the defect it was written
//                  to catch. The canary holds that exact arrangement for that reason.
//
//   (c) NARRATIVE  the message states a measured figure or a per-item verdict — it interpolates
//                  a computed value, or prints `ok`/`BAD` per row. It reports WHAT WAS FOUND
//                  rather than asserting that nothing was. A narrative line is allowed to be
//                  unguarded because it is not a claim of success; `12 wrong, 3 missing` is
//                  the same sentence on a passing and a failing run and reads correctly on both.
//
// A site matching none of the three is an UNCONDITIONAL SUCCESS MESSAGE: a bare verdict
// sentence that a failing run reaches. That is a STOP.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A NEW INSTRUMENT IS THE LEAST TRUSTWORTHY OBJECT IN THE REPO
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// So this one carries a canary: a synthetic source file holding one site of each of the four
// classes, including one real unconditional message, run through the same classifier on every
// invocation. If the classifier stops detecting the defect it was written for, the canary
// fails and the sweep stops — rather than reporting zero problems because it has gone blind.

import { readFileSync, readdirSync } from 'node:fs';

// WHAT IS SWEPT, ENUMERATED. Not a glob over the tree: two named directories, every `.mjs`
// in each, listed in the report with its file count so a directory that stops being read
// cannot do it silently.
export const SWEPT_DIRS = ['adapters/pdf', 'adapters/hubspot'];

// The verdict vocabulary. Wider than the four words the ruling names, deliberately: the
// narrowing of an instrument's input by a sentence is the defect this cycle turned up, and a
// token list is exactly such a sentence. Every extra token costs a `narrative` classification,
// never a missed one.
export const SUCCESS_TOKENS = /\b(passed|pass|OK|okay|clean|no problems|no issues|all good|success|succeeded|holds|held|agrees|agreed|verified|nothing to report|none found|no drift|consistent|matches|matched|correct|sound|confirmed|complete|closes|closed|intact|proved|proven|no-op|unchanged|as expected|good)\b/i;

// Identifiers that name a count of findings. A conditional over one of these is tied to the
// result; a conditional over `verbose` or `usePortal` is not.
const FINDING_IDENT = /\b(problems?|findings?|errs?|errors?|bad|failures?|failed|fail|stops?|missing|mismatche?d?|wrong|extra|unrouted|gaps?|issues?|violations?|drift|remaining|leaked|undisposed|orphans?|dead|skipped|declined|unaccounted|unex(?:ercised)?|differs|diffs|decided|\w*Ok)\b/;

const STRLIT = /(['"`])(?:\\.|(?!\1)[^\\])*\1/g;
const isProse = (l) => { const t = l.trim(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

// EMITTERS, AND THE ONE STREAM THIS SWEEP DOES NOT READ.
//
// `console.log` and the `say()` report-builder used by the HubSpot read-back scripts. NOT
// `console.error`: in this engine stderr carries failures, and a failure message routinely
// contains a token from the list above — `console.error('APPEARANCE VERIFICATION FAILED …')`
// says "verified", `console.error('Correct the input …')` says "correct". Reading stderr made
// eight failure messages report as unconditional successes on the first run of this file.
//
// THAT IS AN EXCLUSION, SO IT IS A CLAIM, SO IT IS COUNTED AND CROSS-CHECKED — registered as
// [X-11] in adapters/pdf/exclusion-sweep.mjs, whose cross-check asserts that no `console.error`
// line in the swept files OPENS with a verdict (OK / PASSED / verified / …). A success message
// that moved to stderr would break that assertion rather than slip through this one.
const EMITS = /console\.(log|warn)\s*\(|(?:^|[^\w.])say\s*\(/;
export const EXCLUDED_STREAM = /console\.error\s*\(/;

// ---------------------------------------------------------------------------------------
// WITNESS (a) — the nearest enclosing conditional.
//
// Walks backwards counting braces, ignoring braces inside string literals, and returns the
// head of the block the site sits directly inside. An inline `if (...) console.log(...)` on
// the site's own line is checked first.
// ---------------------------------------------------------------------------------------
/**
 * Given a line that OPENS with `} else`, find the `if (...)` head whose block that `}` closes.
 * Returns `{ cond, at }`, or null when the chain does not lead to an `if` (an `else` of an
 * `else if` leads to another `if`, which is why this recurs).
 */
const ifHeadClosedAt = (lines, i, _depth = 0) => {
  const self = lines[i].replace(STRLIT, '""');
  const inlineElseIf = self.match(/\}\s*else\s+if\s*\((.+?)\)\s*\{/);
  if (inlineElseIf) return { cond: inlineElseIf[1], at: i + 1 };
  let depth = 1;                                  // the `}` this line opens with
  for (let j = i - 1; j >= 0; j--) {
    if (isProse(lines[j])) continue;
    const s = lines[j].replace(STRLIT, '""');
    for (let c = s.length - 1; c >= 0; c--) {
      if (s[c] === '}') depth++;
      else if (s[c] === '{') {
        depth--;
        if (depth > 0) continue;
        const head = s.slice(0, c);
        const m = head.match(/if\s*\((.+)\)\s*$/);
        if (m) return { cond: m[1], at: j + 1 };
        if (/\}\s*else\s*$/.test(head.trim()) && _depth < 8) return ifHeadClosedAt(lines, j, _depth + 1);
        return null;
      }
    }
  }
  return null;
};

export const enclosingCondition = (lines, idx, _depth = 0) => {
  const inline = lines[idx].match(/^\s*if\s*\((.+?)\)\s*(?:\{\s*)?(?:console|say)\b/);
  if (inline) return { cond: inline[1], at: 'inline' };
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (isProse(lines[i])) continue;
    const s = lines[i].replace(STRLIT, '""');
    for (let c = s.length - 1; c >= 0; c--) {
      if (s[c] === '}') depth++;
      else if (s[c] === '{') {
        if (depth > 0) { depth--; continue; }
        const head = s.slice(0, c);
        const m = head.match(/if\s*\((.+)\)\s*$/);
        if (m) return { cond: m[1], at: `line ${i + 1}` };
        // AN `else` BRANCH IS GUARDED BY THE NEGATION OF ITS `if`.
        //
        // `run-form-gate.mjs` prints GATE PASSED in the `else` of `if (skipped.length)`. Read
        // as a bare `} else {` head that names nothing, it looks unconditional; read as
        // `!skipped.length` it is exactly the guarded shape. Recur upward through the chain,
        // bounded so a malformed file cannot spin.
        if (/\}\s*else\s*$/.test(head.trim()) && _depth < 8) {
          const up = ifHeadClosedAt(lines, i, _depth + 1);
          if (up) return { cond: `!(${up.cond})`, at: `line ${i + 1} — else of the if at line ${up.at}` };
        }
        return { cond: null, at: `line ${i + 1}`, head: head.trim() };
      }
    }
  }
  return { cond: null, at: 'top-level' };
};

// ---------------------------------------------------------------------------------------
// WITNESS (b) — a jumping failure path above the site, in the same scope.
//
// THE ONE DISCRIMINATION THIS FILE EXISTS FOR: `process.exit(3)` jumps, `process.exitCode = 3`
// does not. A regex for `process.exit` alone matches both and would have certified the very
// line that prompted this sweep, so the call form is required — `process.exit` followed by an
// open paren — and the assignment form is explicitly excluded and asserted excluded by the
// canary.
//
// Scope: back to the start of the enclosing block, so a failure path in a DIFFERENT function
// cannot vouch for this one.
// ---------------------------------------------------------------------------------------
const JUMPS = [
  /process\.exit\s*\(/,                    // process.exit(…) — the CALL. `process.exitCode =` does not match.
  /^\s*return\s+[1-9]/,                    // return 2
  /^\s*(?:\breturn\s+)?STOP\s*\(/,         // a STOP helper that exits
  /\bSTOP\s*\([`'"A-Z]/,                   // STOP('A12', …) mid-line
  /^\s*throw\s+/,
];

/**
 * The nearest failure accumulation above the site, and whether it jumps.
 *
 * Walks upward at the site's own brace depth (so a guard inside a different block cannot
 * vouch for this one), stops at the first `if (<finding count>)` head it meets, and reports
 * whether that block's body contains a jump.
 *
 * Returns null when no failure accumulation is reported above the site at all.
 */
/** A block body REPORTS A FAILURE if it writes to stderr or sets a non-zero exit code. */
const REPORTS_FAILURE = /console\.error\s*\(|process\.exitCode\s*=|\bSTOP\s*\(/;

export const nearestFailureGuard = (lines, idx) => {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (isProse(lines[i])) continue;
    const s = lines[i].replace(STRLIT, '""');
    let openedAtDepth0 = false;
    for (let c = s.length - 1; c >= 0; c--) {
      if (s[c] === '}') depth++;
      else if (s[c] === '{') { if (depth > 0) { depth--; continue; } openedAtDepth0 = true; break; }
    }
    if (openedAtDepth0) return null;      // left the site's scope without meeting a failure guard
    if (depth !== 0) continue;            // inside a block we are walking over, not a sibling

    const m = lines[i].match(/^\s*(?:\}\s*else\s+)?if\s*\((.+?)\)\s*\{?\s*$/)
           || lines[i].match(/^\s*if\s*\((.+?)\)\s*(?:process\.exit|return|STOP|throw|console\.error)/);
    if (!m) continue;

    // Read the block body forward and ask two questions of it, in this order: does it report a
    // failure, and does it jump. A conditional that reports nothing is not a failure guard at
    // all — it is an unrelated branch, and the scan continues past it.
    const body = [];
    let d = 0, started = false;
    for (let j = i; j < idx; j++) {
      body.push(lines[j]);
      const t = lines[j].replace(STRLIT, '""');
      for (const ch of t) { if (ch === '{') { d++; started = true; } else if (ch === '}') d--; }
      if (started && d <= 0) break;
      if (!started && /;\s*$/.test(lines[j])) break;   // single-statement `if (x) process.exit(2);`
    }
    const reports = body.some((b) => !isProse(b) && REPORTS_FAILURE.test(b));
    const jump = body.find((b) => !isProse(b) && JUMPS.some((re) => re.test(b)));
    if (!reports && !jump) continue;                   // an unrelated conditional; keep looking

    return {
      at: i + 1, cond: m[1], jumps: !!jump,
      jumpText: jump ? jump.trim().slice(0, 90) : null,
      fallsThrough: body.some((b) => /process\.exitCode/.test(b)) ? 'it sets process.exitCode, which is an assignment and not a jump' : 'the block contains no jump',
    };
  }
  return null;
};

// ---------------------------------------------------------------------------------------
// WITNESS (c) — narrative rather than verdict.
//
// A message that interpolates a computed value, or prints a per-item ok/BAD, reports what was
// found. A BARE sentence with no interpolation is a claim about the whole run.
//
// `${...}` alone is not enough: `OK — ${n} field(s) checked` is still a verdict with a number
// in it. So a site is narrative only if it interpolates AND its literal text carries no
// verdict-opening — a line that starts with OK/PASSED/verified/CONTENT-IDENTICAL is a verdict
// whatever else it interpolates.
// ---------------------------------------------------------------------------------------
export const VERDICT_OPENER = /^\s*(?:\\n)?\s*(OK\b|PASSED\b|PASS\b|[A-Z-]+\s+PASSED\b|verified\b|CONTENT-IDENTICAL\b|every\b|all assertions\b|GATE PASSED\b)/;

// A NOTICE SAYS SOMETHING WAS NOT DONE, AND THAT IS NOT A CLAIM OF SUCCESS.
//
// `- Portal checks (A7, A8) not run: pass --portal.` carries the token "pass" and asserts the
// opposite of a pass. `NOT EXERCISED BY THIS FIXTURE — … Named, not failed:` heads a list of
// findings. `Nothing to delete. This is a pass — …` reports an end state that was already
// there. Each explicitly negates the thing the token would otherwise claim.
//
// NARROW ON PURPOSE. A bare `no` or `not` anywhere in a sentence would let
// `all assertions passed. no problems.` classify as a notice, so the marker must be a
// capitalised NOT, or `not` bound to a doing-word, or an opening that announces absence.
export const NOTICE_MARK = /\bNOT\b|\bnot (?:run|a |an |the |yet|failed|checked|verified|exercised|thereby|currently|bound|created|reached)|\bcannot\b|\bNothing to\b|\bRefusing\b|\bno longer\b/;

export const isNarrative = (line) => {
  const lits = line.match(STRLIT) || [];
  const body = (l) => l.slice(1, -1);
  if (lits.some((l) => VERDICT_OPENER.test(body(l)))) return false;   // a verdict, whatever else it carries
  if (lits.some((l) => /^\s*\|/.test(body(l)))) return true;          // a markdown table row in a report builder
  if (lits.some((l) => NOTICE_MARK.test(body(l)))) return true;       // a notice: it negates what the token claims
  return lits.some((l) => l.startsWith('`') && l.includes('${'));     // states a measured figure
};

// ---------------------------------------------------------------------------------------
// THE OVERRIDE REGISTER.
//
// Only for sites where the derivation is wrong and a person has read the code. Empty is the
// healthy state. Anchored verbatim like guard-sweep's, so an override that stops matching
// becomes an ORPHAN rather than silently standing over moved code.
// ---------------------------------------------------------------------------------------
export const OVERRIDES = [
  { id: 'X-SS-01', file: 'adapters/hubspot/hs-teardown-contact.mjs',
    anchor: "proving the dry-run path is a no-op before deleting",
    verdict: 'progress',
    why: 'A PROGRESS LINE IN THE FUTURE TENSE, not a verdict about a run. It announces the step that is ABOUT to execute — "proving … before deleting" — and the proof it announces is asserted four lines later by `if (!stillThere) STOP(…)`, which jumps. It carries the token only because the thing being proved is a no-op. Read on 2026-08-20 against the whole of main(); every failure path in that function reaches a STOP that exits, and this sentence makes no claim about any of them.' },
];

// ---------------------------------------------------------------------------------------
// THE CLASSIFIER.
// ---------------------------------------------------------------------------------------
// ORDER MATTERS, AND IT IS: guarded, narrative, terminal, UNCONDITIONAL.
//
// `narrative` is tested BEFORE `terminal` because a line that states what was found makes no
// claim of success and is correct on a failing run whatever the control flow around it does.
// Testing control flow first would report `12 wrong, 3 missing` as an unconditional success
// whenever the guard above it happened not to jump.
export const classify = (lines, idx) => {
  const line = lines[idx];
  const enc = enclosingCondition(lines, idx);
  if (enc.cond && FINDING_IDENT.test(enc.cond)) return { verdict: 'guarded', by: `${enc.at}: if (${enc.cond.slice(0, 60)})` };
  if (isNarrative(line)) return { verdict: 'narrative', by: 'states what was found; opens no verdict' };
  const g = nearestFailureGuard(lines, idx);
  if (g && g.jumps) return { verdict: 'terminal', by: `line ${g.at} if (${g.cond.slice(0, 40)}) jumps: ${g.jumpText}` };
  if (g) return { verdict: 'UNCONDITIONAL', by: `the nearest failure accumulation above it, line ${g.at} if (${g.cond.slice(0, 40)}), does NOT jump — ${g.fallsThrough}; execution falls straight through to this sentence` };
  return { verdict: 'UNCONDITIONAL', by: enc.cond ? `enclosed only by if (${enc.cond.slice(0, 60)}), which names no finding count, and no failure accumulation above it` : `enclosed by ${enc.at}, with no failure accumulation above it` };
};

/** Every success-message site in the swept directories, classified. */
export const successSites = () => {
  const rows = [];
  const dirs = [];
  for (const dir of SWEPT_DIRS) {
    const files = readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort();
    dirs.push({ dir, files: files.length });
    for (const f of files) {
      const lines = readFileSync(`${dir}/${f}`, 'utf8').split('\n');
      lines.forEach((ln, i) => {
        if (isProse(ln)) return;
        // The emitter must be CODE. `anchor: 'if (…) console.log('` inside guard-sweep's
        // register is a quoted string that happens to contain an emitter, and a scanner that
        // reads it flags a disposition as a message. Test on the literal-stripped line.
        if (!EMITS.test(ln.replace(STRLIT, '""'))) return;
        const lits = (ln.match(STRLIT) || []).join(' ');
        if (!SUCCESS_TOKENS.test(lits)) return;
        const c = classify(lines, i);
        const ov = OVERRIDES.find((o) => o.file === `${dir}/${f}` && ln.includes(o.anchor));
        rows.push({ at: `${dir}/${f}:${i + 1}`, file: `${dir}/${f}`, verdict: ov ? ov.verdict : c.verdict, derived: c.verdict, by: ov ? `OVERRIDE [${ov.id}] ${ov.why}` : c.by, text: ln.trim().slice(0, 120), overridden: !!ov });
      });
    }
  }
  return { rows, dirs };
};

// ---------------------------------------------------------------------------------------
// THE CANARY.
//
// Four synthetic sites, one per class, classified in memory by the same code path the sweep
// uses. The third is the defect verbatim — `process.exitCode = 3` above a bare success line —
// and it MUST come back UNCONDITIONAL. If any expectation misses, the classifier has gone
// blind and the sweep stops rather than reporting a clean tree it can no longer see.
// ---------------------------------------------------------------------------------------
export const CANARY_SRC = [
  'const problems = [];',                                       // 1
  'if (!problems.length) {',                                    // 2
  "  console.log('OK - canary guarded site.');",                // 3  -> guarded
  '}',                                                          // 4
  'if (problems.length) {',                                     // 5
  '  process.exit(2);',                                         // 6
  '}',                                                          // 7
  "console.log('OK - canary terminal site.');",                 // 8  -> terminal
  'const stops = [1];',                                         // 9
  'if (stops.length) {',                                        // 10
  '  process.exitCode = 3;',                                    // 11
  '}',                                                          // 12
  "console.log('all assertions passed.');",                     // 13 -> UNCONDITIONAL  <-- the defect
  'console.log(`${stops.length} wrong, ${problems.length} missing.`);', // 14 -> narrative
];
const CANARY_EXPECT = [[3, 'guarded'], [8, 'terminal'], [13, 'UNCONDITIONAL'], [14, 'narrative']];

// FOUR CLASSES, ASSERTED TO BE FOUR. `out.every(…)` is vacuously true on an empty array, so
// a canary list that lost its entries would report "the classifier still sees everything" by
// seeing nothing — the exact shape guard-sweep.mjs [G-01] exists to forbid, committed inside
// the canary written to prevent this file going blind. The arity is checked before the loop.
const CANARY_CLASSES = 4;
export const runCanary = () => {
  const out = [];
  if (CANARY_EXPECT.length !== CANARY_CLASSES)
    return { rows: [], ok: false, arity: `CANARY_EXPECT holds ${CANARY_EXPECT.length} expectation(s), not ${CANARY_CLASSES}. The canary cannot vouch for classes it no longer lists.` };
  for (const [ln, want] of CANARY_EXPECT) {
    const got = classify(CANARY_SRC, ln - 1).verdict;
    out.push({ line: ln, want, got, ok: got === want, text: CANARY_SRC[ln - 1].trim() });
  }
  return { rows: out, ok: out.every((r) => r.ok) };
};

// ---------------------------------------------------------------------------------------
export const runSuccessSweep = () => {
  const { rows, dirs } = successSites();
  const canary = runCanary();
  const problems = [];

  if (canary.arity) problems.push(`CANARY ARITY\n      ${canary.arity}\n      An empty or shortened expectation list makes \`every\` vacuously true. This is a STOP before it is a report.`);
  if (!canary.ok) {
    for (const r of canary.rows.filter((x) => !x.ok))
      problems.push(`CANARY DEAD  synthetic line ${r.line} (${r.text})\n      expected ${r.want}, classifier said ${r.got}.\n      The classifier no longer recognises the class it was written for. Every verdict below is unreliable; this is a STOP before it is a report.`);
  }
  for (const r of rows) if (r.verdict === 'UNCONDITIONAL')
    problems.push(`UNCONDITIONAL  ${r.at}\n      ${r.text}\n      ${r.by}.\n      A failing run reaches this sentence and it says the run passed. Tie it to the finding count, put it after the jump, or make it state what was found.`);

  // An override standing over code that has moved certifies nothing.
  for (const o of OVERRIDES) if (!rows.some((r) => r.overridden && r.file === o.file && r.by.includes(o.id)))
    problems.push(`ORPHAN OVERRIDE  [${o.id}]  anchor ${JSON.stringify(o.anchor)} matches no success-message site in ${o.file}.`);

  return { rows, dirs, canary, problems };
};

export const reportSuccessSweep = (s, { verbose = false } = {}) => {
  const t = s.rows.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});
  console.log(`success sweep: ${s.rows.length} success-message site(s) across ${s.dirs.map((d) => `${d.dir} (${d.files} file(s))`).join(', ')}`);
  console.log(`               ${Object.entries(t).map(([k, v]) => `${v} ${k}`).join(', ')}${s.rows.some((r) => r.overridden) ? `; ${s.rows.filter((r) => r.overridden).length} overridden` : ''}`);
  console.log(`               canary: ${s.canary.rows.filter((r) => r.ok).length}/${s.canary.rows.length} classes still detected${s.canary.ok ? '' : ' — DEAD'}`);
  if (verbose) for (const r of s.rows) console.log(`    ${r.verdict.padEnd(14)} ${r.at}\n                   ${r.by}`);
  if (!s.problems.length) {
    console.log('OK — every success message is tied to a finding count, sits after a jumping failure path, or states what was found rather than that nothing was.');
    return 0;
  }
  console.error(`SUCCESS SWEEP — ${s.problems.length} problem(s):`);
  s.problems.forEach((p) => console.error(`  ${p}`));
  return s.problems.length;
};

// CLI
if (process.argv[1] && /success-sweep\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const s = runSuccessSweep();
  process.exit(reportSuccessSweep(s, { verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
