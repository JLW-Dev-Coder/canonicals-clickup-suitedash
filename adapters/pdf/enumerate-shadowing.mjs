// [D-09] ENUMERATED — every exclusion site in the engine attributed to a predicate it does not
// actually call, because the identifier is preceded by a dot.
//
//   node adapters/pdf/enumerate-shadowing.mjs
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [D-09] carried this sentence:
//
//   "Zero sites in this tree are known to be in this state. That is an observation and not a
//    proof: nothing enumerates it, which is itself part of what would close this."
//
// That is the exact shape this project has been removing for six cycles — a claim about a set
// with nothing that counts the set. Same-file name shadowing is ENUMERABLE, so it is enumerated
// here rather than observed, and the number is derived on every run instead of being written
// down once and left to drift.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE MECHANISM BEING COUNTED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// exclusion-sweep.mjs finds the identifier before a "(" with
//
//   CALL = /\b([A-Za-z_$][\w$]*)\s*\(/g
//
// and \b matches after a ".", so `someMap.norm(x)` yields the name `norm`. Reachability then
// asks whether the CALLING FILE defines or imports that name, which killed the cross-file
// accident ([D-08], [EX-16]: `field.isChecked()` attributed to an unrelated local in another
// file). What survives is the SAME-FILE case: a file that defines `const norm = …` and also
// writes `someMap.norm(…)` in an exclusion position attributes that site to its own predicate,
// and a register entry then stands over a call it is not about.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE UNIVERSE, DECLARED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   population   every row `exclusionSites()` returns — the same set the exclusion register is
//                measured over, IMPORTED rather than re-derived, so this counts that
//                instrument's own attributions and not a copy of them
//   per row      every occurrence of `<pred>(` inside the site's captured condition text
//   verdict      BARE     at least one occurrence is a plain call            — attribution sound
//                METHOD   every occurrence is preceded by "."                — [D-09] INSTANCE
//                ABSENT   the pattern matched no occurrence in the captured  — UNREADABLE, a STOP
//                         text at all
//
// ABSENT IS A STOP AND NOT A ZERO. A row whose predicate cannot be located in its own captured
// text means this enumerator failed to read its input, and "I could not read it" reported as
// "no instances" is the `if (matches.length && mismatch)` defect this repo has already found
// once, with PASS printed underneath.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT AN ENUMERATED ZERO IS AND IS NOT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// If the count is zero, [D-09]'s exposure is zero AS OF THIS TREE, derived. That is not the
// same as [D-09] being closed: the mechanism is still live, and a `x.norm(...)` written into an
// exclusion position tomorrow would be attributed tomorrow. What closes [D-09] is refusing such
// a site inside exclusionSites(), which is a change to the function every register entry is
// measured by and needs its no-op path proved across all of them in the same run. This file
// makes the exposure a MEASURED number in the meantime, and turns the day it stops being zero
// into a reported finding rather than a discovery.

import { readFileSync } from 'node:fs';
import { exclusionSites, POSITIONS } from './exclusion-sweep.mjs';

const STRLIT = /(['"`])(?:\\.|(?!\1)[^\\])*\1/g;

/**
 * Where the captured condition text of a site is, given its file and 1-based line.
 * Re-derived the way exclusion-sweep derives it — same POSITIONS, same string-literal blanking —
 * so what is classified here is the very text that instrument attributed the predicate from.
 */
export const capturedAt = (file, lineNo, srcCache = new Map()) => {
  if (!srcCache.has(file)) srcCache.set(file, readFileSync(file, 'utf8').split('\n'));
  const ln = srcCache.get(file)[lineNo - 1] ?? '';
  const code = ln.replace(STRLIT, '""');
  for (const [pos, re] of POSITIONS) {
    const m = code.match(re);
    if (m) return { pos, text: String(m[1]), line: ln.trim() };
  }
  return { pos: null, text: null, line: ln.trim() };
};

/**
 * Classify one attribution. `text` is the captured condition, `pred` the attributed name.
 * Returns { verdict, bare, method } — counts, never a boolean, so a mixed site is visible.
 */
export const classify = (text, pred) => {
  if (typeof text !== 'string') return { verdict: 'ABSENT', bare: 0, method: 0 };
  const re = new RegExp(`([.]?)\\b${pred.replace(/[$]/g, '\\$')}\\s*\\(`, 'g');
  let bare = 0, method = 0;
  for (const m of text.matchAll(re)) {
    // The character actually before the identifier, taken from the source rather than from the
    // capture group alone: `\b` after a "." is the whole mechanism, so the dot has to be read
    // off the position and not inferred.
    const at = m.index ?? 0;
    const prev = at > 0 ? text[at + (m[1] ? 0 : -1)] : '';
    if (m[1] === '.' || prev === '.') method++; else bare++;
  }
  if (!bare && !method) return { verdict: 'ABSENT', bare, method };
  return { verdict: bare ? 'BARE' : 'METHOD', bare, method };
};

/** The enumeration. Returns every row with its verdict, plus the three counts. */
export const runShadowingEnumeration = () => {
  const sites = exclusionSites();
  const cache = new Map();
  const rows = sites.rows.map((r) => {
    const [file, lineNo] = [r.file, Number(r.at.split(':').pop())];
    const cap = capClassify(file, lineNo, r.pred, cache);
    return { ...r, ...cap };
  });
  return {
    universe: {
      population: 'every row adapters/pdf/exclusion-sweep.mjs `exclusionSites()` returns, imported',
      per_row: 'every occurrence of `<pred>(` inside that site\'s captured condition text',
      verdicts: 'BARE (at least one plain call — attribution sound), METHOD (every occurrence preceded by "." — a [D-09] instance), ABSENT (the predicate could not be located in its own captured text — a STOP)',
    },
    sites: rows.length,
    files: new Set(rows.map((r) => r.file)).size,
    bare: rows.filter((r) => r.verdict === 'BARE').length,
    instances: rows.filter((r) => r.verdict === 'METHOD'),
    unreadable: rows.filter((r) => r.verdict === 'ABSENT'),
    rows,
  };
};

const capClassify = (file, lineNo, pred, cache) => {
  const cap = capturedAt(file, lineNo, cache);
  const c = classify(cap.text, pred);
  return { pos: cap.pos, captured: cap.text, source: cap.line, ...c };
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY. An enumerator whose answer is expected to be zero is the single easiest object
// in a repo to get wrong, because a broken one and a clean tree print the same number. So the
// classifier is fired against synthetic text carrying each verdict, on every run, and a canary
// that does not bite is a STOP — the count that follows it is not reported at all.
export const canary = () => {
  const results = [
    ['a plain call reads BARE',                    classify('!ok(x)', 'ok').verdict === 'BARE'],
    ['a method call reads METHOD',                 classify('!m.ok(x)', 'ok').verdict === 'METHOD'],
    ['a mixed site reads BARE and counts both',    (() => { const c = classify('!ok(x) && m.ok(y)', 'ok'); return c.verdict === 'BARE' && c.bare === 1 && c.method === 1; })()],
    ['a predicate not in the text reads ABSENT',   classify('!other(x)', 'ok').verdict === 'ABSENT'],
    ['a longer name is not matched by a shorter',  classify('!okay(x)', 'ok').verdict === 'ABSENT'],
    ['an optional-chained method reads METHOD',    classify('!m?.ok(x)', 'ok').verdict === 'METHOD'],
    ['null text reads ABSENT rather than zero',    classify(null, 'ok').verdict === 'ABSENT'],
  ];
  const failed = results.filter(([, ok]) => !ok).map(([what]) => what);
  return { checks: results.length, failed };
};

export const reportShadowing = (out, { verbose = false } = {}) => {
  const bird = canary();
  if (bird.failed.length) {
    console.error(`SHADOWING CANARY DID NOT BITE — ${bird.failed.length} of ${bird.checks} classifier behaviour(s) are wrong. The count below is not reported.`);
    bird.failed.forEach((f) => console.error(`  ${f}`));
    return bird.failed.length;
  }
  console.log(`[D-09] same-file shadowing: ${out.sites} exclusion-site attribution(s) across ${out.files} file(s) classified`);
  console.log(`  universe: ${out.universe.population}`);
  console.log(`            ${out.universe.per_row}`);
  console.log(`  ${out.bare} sound (a plain call is present), ${out.instances.length} [D-09] instance(s) (every occurrence is a method call), ${out.unreadable.length} unreadable`);
  console.log(`  canary: holds (${bird.checks} classifier behaviours, every verdict fired)`);
  if (verbose) for (const r of out.rows.slice(0, 40)) console.log(`    ${r.verdict.padEnd(7)} ${r.pred.padEnd(24)} ${r.at}`);
  if (out.unreadable.length) {
    console.error(`SHADOWING ENUMERATION — ${out.unreadable.length} site(s) UNREADABLE: the attributed predicate could not be located in the site's own captured text.`);
    out.unreadable.forEach((r) => console.error(`  ${r.at}  pred "${r.pred}"  captured ${JSON.stringify(String(r.captured).slice(0, 90))}`));
    console.error('  An enumeration that cannot read its input is not an enumeration that found nothing.');
    return out.unreadable.length;
  }
  if (out.instances.length) {
    console.error(`[D-09] — ${out.instances.length} exclusion site(s) are attributed to a predicate they do not call:`);
    out.instances.forEach((r) => console.error(`  ${r.at}  attributed to "${r.pred}" defined in ${r.definedIn}, but every occurrence is a METHOD call\n      ${r.source.slice(0, 120)}`));
    console.error('  Each is a register entry standing over a call it is not about. Re-point the entry, or close [D-09] in exclusionSites().');
    return out.instances.length;
  }
  console.log(`  ENUMERATED ZERO — no exclusion site in this tree is attributed to a predicate it does not call. [D-09]'s exposure is a derived 0 rather than an observation, and it is re-derived on every run.`);
  return 0;
};

if (process.argv[1] && /enumerate-shadowing\.mjs$/.test(process.argv[1].replace(/\\/g, '/')))
  process.exit(reportShadowing(runShadowingEnumeration(), { verbose: process.argv.includes('--verbose') }) > 0 ? 2 : 0);
