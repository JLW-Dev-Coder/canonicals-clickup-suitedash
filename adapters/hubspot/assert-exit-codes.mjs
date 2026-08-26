// EVERY DECLARED STOP CODE IN EVERY PORTAL TOOL REACHES ITS CALLER.  [D-20]
//
//   node adapters/hubspot/assert-exit-codes.mjs             # structure + the offline canaries
//   node adapters/hubspot/assert-exit-codes.mjs --portal    # additionally, the live proof
//   node adapters/hubspot/assert-exit-codes.mjs --verbose   # every site, every canary
//
//   exit 0 = no tool in the population can lose a declared code, and the mechanism is alive
//   exit 2 = a process.exit() call site is back, a catch can swallow a halt, or a canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DEFECT  [D-20]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `process.exit(n)` called after any request through hs() ABORTED this node build instead of
// exiting with n:
//
//     Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76
//
// The caller saw 3221226505 through spawnSync and 127 through a shell. THE DECLARED CODE NEVER
// LEFT THE PROCESS. It was raised by rerun-regression.mjs on its first portal-tier run, against
// hs-fetch-433boi.mjs, which had correctly reached its own "REFUSING TO WRITE - 1 problem(s)"
// and called process.exit(3).
//
// It was NOT a defect in that fetcher. It reproduced in five lines with no fetcher present, so
// the fetcher was only the first tool driven down a post-portal STOP path that cycle — and four
// of the tools sharing that path are permanent or destructive: hs-provision.mjs,
// hs-purge-properties.mjs, hs-purge-contacts.mjs, hs-teardown-contact.mjs. A caller branching
// on `status === 2` saw 127 and took the wrong branch.
//
// hs-lib.mjs's stop() is the repair and its header carries the three measured candidates. This
// file is what keeps the repair true.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THE STRUCTURAL FORM AND NOT A RE-RUN  [R-31]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Running every portal tool and reading its code would be a check about a moment: it needs a
// credential, it needs each tool driven down its own STOP path, and four of them are
// destructive, so the run that would prove the most is the run nobody may make.
//
// "NO TOOL IN THIS POPULATION CONTAINS A process.exit( CALL SITE" is about structure. It needs
// no credential and no network, it is true of tools nobody ran this cycle, and it would have
// fired the day the first of the 74 sites was written. So that is the standing check, and the
// live proof below is the second tier — reported with the tier it was found in, so "which would
// have fired first" is answered by the run rather than argued about afterwards.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// AND THE SECOND ASSERTION, WHICH IS THE ONE THE REPAIR MADE NECESSARY  [R-12]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `process.exit()` could not be intercepted by any catch. `stop()` throws, so it can be. hs()
// resolves its key through a DEFAULT PARAMETER, so a missing credential now raises a StopSignal
// from inside `try { await hs(...) } catch (e) { tier = '(not read)'; }` — of which this
// directory holds several. Without a re-throw, "no credential, halt" becomes "tier not read,
// carry on", and the repair would have committed a quieter version of the defect it repairs.
//
// So every catch standing between a stop() and the top level re-throws the sentinel, in BOTH
// syntactic forms — the `catch (e) {` block and the `.catch((e) => {` promise handler, which is
// the one an inspection walks past, and which sat on the two tools whose exit code is a
// COMPUTED value rather than a constant. Both forms are asserted here.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE POPULATION IS DERIVED, AND BY BOTH IMPORT FORMS  [R-15]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   directory   adapters/hubspot/
//   filter      every *.mjs whose source names ./hs-lib.mjs in EITHER an import statement or a
//               dynamic import() expression, plus hs-lib.mjs itself
//   classifier  none — reaching hs-lib is the claim
//
// THE SECOND HALF OF THAT FILTER IS NOT DECORATION. The first draft of the repair pass matched
// only `from './hs-lib.mjs'` and silently missed the SIX files that load it lazily so they can
// run offline with no credential — among them rerun-regression.mjs, the tool that REPORTS
// [D-20]. A population defined by the shape of an import statement is a population an author
// can leave without saying so, which is the exclusion-by-omission [R-14] names.
//
// A pdf-side tool calling process.exit() is OUTSIDE this population and correctly so: it opens
// no socket, so its declared code was never at risk. That is an exclusion, so it is a claim,
// and it is checked — every excluded file is confirmed to reach hs-lib by neither form.

import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { examined } from '../pdf/examined.mjs';

const argv = process.argv.slice(2);
const usePortal = argv.includes('--portal');
const verbose = argv.includes('--verbose');

export const DIR = 'adapters/hubspot';
export const REACHES_HS_LIB = /(from\s*['"]\.\/hs-lib\.mjs['"])|(import\(\s*['"]\.\/hs-lib\.mjs['"]\s*\))/;

// ── THE MASK ──────────────────────────────────────────────────────────────────────────────
//
// Blanks the interior of every line comment, block comment and string/template literal while
// preserving length and line structure, so an index that survives is a CODE index.
//
// IT HAS TO EXIST, because three of this directory's `process.exit(` occurrences are PROSE
// ABOUT the defect — hs-deprecate-property.mjs and hs-teardown-contact.mjs each quote the time
// a dry-run exit was replaced by something that did not jump and the branch fell straight
// through into the write — and one is a STRING WRITTEN INTO A CANARY FILE by
// rerun-regression.mjs, whose synthetic child must keep exiting the old way because it is what
// proves that harness can see a non-zero code at all. A grep would report all four as relapses
// and a guard that reports four false relapses every run is a guard somebody turns off ([R-10]).
// TWO MASKS, AND THE DIFFERENCE BETWEEN THEM IS A DEFECT THIS FILE COMMITTED.
//
// `keepStrings` blanks comments only. `codeMask` blanks comments AND the interior of every
// string literal. Which one a question needs depends on whether the answer LIVES in a string:
//
//   a process.exit( CALL SITE  never lives in a string  ->  codeMask
//   an import PATH             always lives in a string ->  keepStrings
//
// The membership test was written against codeMask, and codeMask had just blanked every
// `'./hs-lib.mjs'` in the tree, so the population collapsed from 31 files to 1 and the guard
// reported OK over an empty set — a vacuous pass produced by the very instrument that exists to
// stop them ([R-04]), one commit after the same selector had over-recruited by reading its own
// prose. Both directions in one function, which is why there are now two.
const maskWith = (src, { strings }) => {
  const out = src.split('');
  const n = src.length;
  const blank = (a, b) => { for (let k = a; k < b && k < n; k++) if (out[k] !== '\n') out[k] = ' '; };
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { let j = src.indexOf('\n', i); if (j < 0) j = n; blank(i, j); i = j; continue; }
    if (c === '/' && d === '*') { let j = src.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; blank(i, j); i = j; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === q) break;
        j++;
      }
      if (strings) blank(i + 1, j);
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.join('');
};

/** Comments and string interiors blanked. For questions whose answer is never inside a string. */
export const codeMask = (src) => maskWith(src, { strings: true });

/** Comments blanked, strings intact. For questions whose answer IS a string — an import path. */
export const keepStrings = (src) => maskWith(src, { strings: false });

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

// THE MEMBERSHIP TEST RUNS ON THE MASKED SOURCE, AND IT HAD TO BE TAUGHT TO.
//
// Its first draft read the raw source and put THIS FILE in its own population — matched by the
// sentence three paragraphs up that QUOTES `from './hs-lib.mjs'` while explaining why the
// filter has two halves. This file opens no socket; it was a comment about the predicate being
// read as an instance of it, which is [EX-10]'s class arriving inside the population selector
// rather than inside the thing selected. The mask was already here for the exit sites; it now
// runs first, so prose about hs-lib cannot recruit a file and cannot excuse one either.
// ONE NAMED EXCLUSION, AND IT IS A CLAIM SO IT IS CHECKED  [R-14]
//
// THIS FILE MATCHES ITS OWN SELECTOR, and not by accident of prose — its SELECTOR_CASES below
// hold, as canary FIXTURES, the exact two import forms the selector is written to recognise.
// A text selector cannot tell a fixture that looks like an import from an import, and rewriting
// the fixtures until they stop matching would be fitting the data to the tool, which is what
// [D-22] refuses to do to correlate-labels' probes.
//
// So the exclusion is declared by name and its GROUND is asserted rather than asserted-in-a-
// comment. The ground is that this file opens no socket: it calls neither hs() nor stop(), so
// it has no libuv handle to lose a code to and no halt of its own to protect. [XC-6] below
// derives both facts from the masked source on every run, and a future edit that gives this
// file a real portal call fails the exclusion instead of quietly inheriting it.
export const SELF = 'assert-exit-codes.mjs';

export const population = () => {
  const inPop = [];
  const outPop = [];
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.mjs')).sort()) {
    const path = `${DIR}/${f}`;
    const src = readFileSync(path, 'utf8');
    const member = f === 'hs-lib.mjs' || (f !== SELF && REACHES_HS_LIB.test(keepStrings(src)));
    (member ? inPop : outPop).push({ path, src });
  }
  return { inPop, outPop };
};

// ── THE SELECTOR'S OWN CANARY ─────────────────────────────────────────────────────────────
//
// THE POPULATION SELECTOR WAS WRONG IN BOTH DIRECTIONS INSIDE ONE COMMIT: it over-recruited by
// reading its own prose as an import, then under-recruited to a single file when the fix
// blanked the string literals the import paths live in — and the second reading printed OK over
// an empty set, which is [R-04] arriving inside the file whose job is to refuse it.
//
// Neither was caught by the verdict, because a wrong population produces a CLEAN report. So the
// selector is asked four questions with known answers on every run, two in each direction. A
// selector that recruits everything and a selector that recruits nothing both fail here, which
// is the two-sided shape the [FS-3] `sole_declared_line` repair established.
export const SELECTOR_CASES = [
  ['a  a static import is IN', "import { hs, stop } from './hs-lib.mjs';", true],
  ['b  a DYNAMIC import is IN — the six lazy loaders', "const { hs } = await import('./hs-lib.mjs');", true],
  ['c  PROSE naming the path is OUT', "// only `from './hs-lib.mjs'` matched, which missed six files", false],
  ['d  a different module is OUT', "import { examined } from '../pdf/examined.mjs';", false],
];

export const selectorCanary = () => {
  const dead = [];
  for (const [name, src, want] of SELECTOR_CASES) {
    const got = REACHES_HS_LIB.test(keepStrings(src));
    if (got !== want) dead.push(`SELECTOR CANARY DEAD  ${name}: the selector said ${got}, expected ${want}. The population above is not the population this file claims to judge.`);
  }
  return dead;
};

// ── THE STRUCTURAL CONDITIONS ─────────────────────────────────────────────────────────────
export const structure = () => {
  const { inPop, outPop } = population();
  const problems = [];
  let exitSites = 0;
  let catchBlocks = 0;
  let catchArrows = 0;
  const sites = [];

  for (const { path, src } of inPop) {
    const masked = codeMask(src);

    // [XC-1] no process.exit( call site survives anywhere in the population
    for (const m of masked.matchAll(/process\.exit\(/g)) {
      exitSites++;
      problems.push(`[XC-1] ${path}:${lineOf(src, m.index)} holds a process.exit( CALL SITE. After a portal request this aborts and the declared code never reaches the caller. Use stop(n) from ./hs-lib.mjs.`);
    }

    // [XC-2] every catch BLOCK leads with the sentinel re-throw, and none is bindingless
    for (const m of masked.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{([\s\S]{0,60})/g)) {
      catchBlocks++;
      const want = `if (isStop(${m[1]})) throw ${m[1]};`;
      if (!m[2].includes(want)) {
        sites.push({ path, line: lineOf(src, m.index), kind: 'catch-block', ok: false });
        problems.push(`[XC-2] ${path}:${lineOf(src, m.index)} — a catch binding \`${m[1]}\` does not lead with \`${want}\`. hs() resolves its key through a default parameter, so a missing credential raises the halt INSIDE this try; without the re-throw the tool carries on past a stop().`);
      } else sites.push({ path, line: lineOf(src, m.index), kind: 'catch-block', ok: true });
    }
    for (const m of masked.matchAll(/catch\s*\{/g)) {
      catchBlocks++;
      problems.push(`[XC-2] ${path}:${lineOf(src, m.index)} — a bindingless \`catch {\` cannot test the error it caught, so it swallows a halt unconditionally. Give it a binding and lead with the re-throw.`);
    }

    // [XC-3] every PROMISE .catch( arrow leads with the re-throw — the form an inspection walks past
    for (const m of masked.matchAll(/\.catch\(\s*(?:async\s*)?\(?\s*([A-Za-z_$][\w$]*)\s*\)?\s*=>\s*\{([\s\S]{0,60})/g)) {
      catchArrows++;
      const want = `if (isStop(${m[1]})) throw ${m[1]};`;
      if (!m[2].includes(want)) {
        sites.push({ path, line: lineOf(src, m.index), kind: 'catch-arrow', ok: false });
        problems.push(`[XC-3] ${path}:${lineOf(src, m.index)} — a promise .catch() handler binding \`${m[1]}\` does not lead with \`${want}\`. It stands between every stop() inside the promise chain and the top level, so the tool reports THIS handler's code instead of the one it declared.`);
      } else sites.push({ path, line: lineOf(src, m.index), kind: 'catch-arrow', ok: true });
    }
  }

  // [XC-4] THE EXCLUSION IS A CLAIM [R-14]. Every file left out is confirmed to reach hs-lib by
  // neither import form — so a file that starts opening sockets cannot leave this population by
  // being overlooked, only by an edit that this check then contradicts.
  for (const { path, src } of outPop)
    if (path !== `${DIR}/${SELF}` && REACHES_HS_LIB.test(keepStrings(src)))
      problems.push(`[XC-4] ${path} was excluded from the population and DOES reach ./hs-lib.mjs. The exclusion is false.`);

  // [XC-6] THE ONE NAMED EXCLUSION'S GROUND, DERIVED. This file is excluded because it opens no
  // socket, which is a statement about its code and not a permission. Both halves are read off
  // the masked source: no hs() call means no handle to lose a code to, and no stop() call means
  // no halt of its own to protect. An edit that gives it either fails here rather than
  // inheriting an exclusion written when neither was true.
  {
    const self = outPop.find((x) => x.path === `${DIR}/${SELF}`);
    if (!self) problems.push(`[XC-6] ${DIR}/${SELF} declares itself the one named exclusion and is not in the excluded set — the declaration names a file this run did not classify.`);
    else {
      const m = codeMask(self.src);
      for (const [call, why] of [['hs', 'it would open a socket, so its own declared code would be at risk'], ['stop', 'it would have a halt of its own to protect']])
        if (new RegExp(`(^|[^\\w.])${call}\\(`).test(m))
          problems.push(`[XC-6] ${DIR}/${SELF} is excluded on the ground that it opens no socket, and it now calls ${call}(). ${why[0].toUpperCase()}${why.slice(1)}. Remove the call or remove the exclusion.`);
    }
  }

  // [XC-5] THE DRAIN CLAIM, CHECKED. hs-lib's header says the swallow costs nothing observable
  // because every tool here is a linear async chain with nothing else pending. That is a claim
  // about these files, so it is asserted rather than asserted-in-a-comment: a tool scheduling
  // independent work would keep running after a non-sentinel error that node would have killed.
  for (const { path, src } of inPop)
    for (const m of codeMask(src).matchAll(/\b(setInterval|setImmediate)\s*\(/g))
      problems.push(`[XC-5] ${path}:${lineOf(src, m.index)} schedules independent work with ${m[1]}(). hs-lib.mjs's header states that the drain after a non-sentinel error costs nothing observable BECAUSE no tool here does this. Either remove it or amend that claim.`);

  return { inPop, outPop, problems, exitSites, catchBlocks, catchArrows, sites };
};

// ── THE CANARIES ──────────────────────────────────────────────────────────────────────────
//
// A NEW INSTRUMENT IS THE LEAST TRUSTWORTHY OBJECT IN THE REPO ([R-17]). Every case below is a
// real child process with a known answer. Three of them plant the defect this file exists to
// catch and require it to be FOUND BY NAME; two plant a conforming input and require it to be
// ACCEPTED — because a judge that refuses everything and a judge that refuses nothing both pass
// a one-sided canary, which is the hole the [FS-3] `sole_declared_line` repair closed.
const LIB = () => JSON.stringify(new URL('./hs-lib.mjs', import.meta.url).href);

const CANARIES = [
  {
    id: 'C-1  stop() JUMPS — the statement after it does not run',
    // The whole reason candidate A was rejected. Two tools in this directory guard a
    // destructive call with a dry-run branch, and each carries a header recording the time a
    // dry-run exit was replaced by something that did not jump and the branch fell through
    // into the write. This is that arrangement, planted.
    src: (lib) => `import { stop } from ${lib};
const dryRun = true;
if (dryRun) { console.log('DRY RUN - nothing was sent.'); stop(0); }
console.log('THE DESTRUCTIVE CALL RAN');
`,
    want: (r) => r.status === 0 && r.stdout.includes('DRY RUN') && !r.stdout.includes('THE DESTRUCTIVE CALL RAN'),
    why: 'a dry-run branch ending in stop(0) must halt, and the code beneath it must not run',
  },
  {
    id: 'C-2  the declared code arrives, from inside a nested call',
    src: (lib) => `import { stop } from ${lib};
const STOP = (...l) => { l.forEach((x) => console.error(x)); stop(2); };
async function main() { STOP('refused'); console.log('UNREACHABLE'); }
await main();
`,
    want: (r) => r.status === 2 && !r.stdout.includes('UNREACHABLE'),
    why: 'stop() called two frames down still halts the tool and still delivers 2',
  },
  {
    id: 'C-3  a NON-sentinel error is NOT swallowed',
    // The direction that would make this whole mechanism a way of hiding failures. A version
    // of isStop() answering true to everything passes C-1 and C-2 and fails only here.
    src: (lib) => `import { stop } from ${lib};
try { stop(7); } catch { /* installs the handlers; exitCode is now 7 */ }
process.exitCode = 0;
throw new Error('CANARY REAL FAILURE');
`,
    want: (r) => r.status !== 0 && /CANARY REAL FAILURE/.test(r.stderr),
    why: 'once the handlers are installed a real error must still print and must still fail the run',
  },
  {
    id: 'C-4  a catch WITHOUT the re-throw swallows the halt — the defect, planted',
    src: (lib) => `import { stop } from ${lib};
async function inner() { stop(3); }
try { await inner(); } catch (e) { console.log('SWALLOWED'); }
process.exitCode = 0;
console.log('CARRIED ON PAST A HALT');
`,
    want: (r) => r.status === 0 && r.stdout.includes('CARRIED ON PAST A HALT'),
    why: 'this is what an unguarded catch DOES — the canary asserts the damage is real, which is why [XC-2] and [XC-3] are not decoration',
  },
  {
    id: 'C-5  the same shape WITH the re-throw halts and keeps the declared code',
    src: (lib) => `import { stop, isStop } from ${lib};
async function inner() { stop(3); }
try { await inner(); } catch (e) { if (isStop(e)) throw e; console.log('SWALLOWED'); }
console.log('CARRIED ON PAST A HALT');
`,
    want: (r) => r.status === 3 && !r.stdout.includes('CARRIED ON PAST A HALT') && !r.stdout.includes('SWALLOWED'),
    why: 'the conforming input must be ACCEPTED, or the guard is one-sided',
  },
];

// ── THE PORTAL TIER, AND WHAT MEASURING IT SHARPENED ──────────────────────────────────────
//
// THE TRIGGER IS A REQUEST WITH A BODY, NOT A REQUEST. This was not known when [D-20] was
// carried, and the first draft of P-2 below got it wrong: it planted `process.exit(3)` after a
// GET and EXITED 3 — the old shape, working. A GET does not abort. Fifteen consecutive GET runs
// exited 3 cleanly; a POST carrying two property names aborts on every run, and so does a POST
// carrying 113. It is the METHOD WITH A BODY, not the volume.
//
// That is the sharper account, and it changes what the defect meant. A read-only tool could
// never have shown it, which is why a whole cycle of GET-shaped reproduction attempts came back
// clean, and it is why the tools genuinely at risk were exactly the ones this engine cannot
// afford to be wrong about: hs-provision.mjs, hs-purge-properties.mjs, hs-purge-contacts.mjs
// and hs-teardown-contact.mjs POST and DELETE. The defect lived on the write paths and nowhere
// else. hs-fetch-433boi.mjs, the tool it was found on, is a fetcher that reads by POST because
// 113 property names do not fit in a querystring.
//
// TWO CHILDREN, AND THE SECOND ONE IS THE POINT: it plants the OLD shape and requires it to
// still abort. Without that, a green run here would be equally consistent with "the repair
// works" and "the defect went away on its own and this file now proves nothing" — the
// vacuous-guard class, arriving inside the guard written to close it. Both children send the
// same POST, so the only difference between them is the halt.
const BODY_REQUEST = `await hs('/crm/v3/objects/contacts/batch/read', { method: 'POST', body: { properties: ['firstname'], inputs: [] } });`;

const PORTAL_CANARIES = [
  {
    id: 'P-1  stop(3) after a live POST delivers 3',
    src: (lib) => `import { hs, stop } from ${lib};
${BODY_REQUEST}
console.log('request completed');
stop(3);
console.log('UNREACHABLE');
`,
    want: (r) => r.status === 3 && !/UV_HANDLE_CLOSING/.test(r.stderr) && !r.stdout.includes('UNREACHABLE'),
    why: 'the exact shape that reported 127 through a shell and 3221226505 through spawnSync',
  },
  {
    id: 'P-2  process.exit(3) after the SAME POST still aborts — the defect is still real',
    src: (lib) => `import { hs } from ${lib};
${BODY_REQUEST}
process.exit(3);
`,
    want: (r) => r.status !== 3,
    why: 'if this ever delivers 3, node has changed underneath the repair and [XC-1] is guarding nothing — which is a finding to report, not a pass',
  },
];

export const runCanaries = (cases) => {
  const dir = mkdtempSync(join(tmpdir(), 'assert-exit-codes-'));
  const lib = LIB();
  const rows = [];
  try {
    for (const c of cases) {
      const file = join(dir, `${c.id.split(/\s+/)[0].replace(/[^\w-]/g, '')}.mjs`);
      writeFileSync(file, c.src(lib));
      const r = spawnSync(process.execPath, [file], { encoding: 'utf8' });
      const got = { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
      rows.push({ id: c.id, why: c.why, ok: !!c.want(got), status: got.status, uv: /UV_HANDLE_CLOSING/.test(got.stderr) });
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
  return rows;
};

// ---------------------------------------------------------------------------------------
export const run = () => {
  const s = structure();
  const canaries = runCanaries(CANARIES);
  const portal = usePortal ? runCanaries(PORTAL_CANARIES) : [];
  const problems = [...selectorCanary(), ...s.problems];

  // ARITY BEFORE VERDICT. An emptied case list makes `every` vacuously true, which is the
  // one-line way this file becomes a guard that cannot fail.
  if (canaries.length !== CANARIES.length || CANARIES.length < 5)
    problems.unshift(`CANARY ARITY — ${canaries.length} of ${CANARIES.length} offline case(s) ran, and the list must hold at least 5. A shortened list is a STOP before it is a report.`);
  for (const r of canaries) if (!r.ok) problems.push(`CANARY DEAD  ${r.id}\n      ${r.why}\n      The mechanism no longer behaves as the repair requires. Every verdict above is unreliable.`);
  for (const r of portal) if (!r.ok) problems.push(`PORTAL CANARY DEAD  ${r.id}\n      ${r.why}`);

  return { s, canaries, portal, problems };
};

export const report = (o) => {
  const { s } = o;
  console.log(`exit-code assertion: ${s.inPop.length} file(s) reach ./hs-lib.mjs, ${s.outPop.length} file(s) in ${DIR} do not`);
  console.log(`                     ${s.exitSites} process.exit( call site(s); ${s.catchBlocks} catch block(s) and ${s.catchArrows} promise .catch() handler(s), of which ${s.sites.filter((x) => x.ok).length} re-throw the sentinel`);
  console.log(`                     tier: OFFLINE${o.portal.length ? ' + PORTAL' : ' only — the live proof was not asked for ([R-31]: the structural half above is the stronger one and needs no credential)'}`);
  console.log(`                     selector: ${SELECTOR_CASES.length - selectorCanary().length}/${SELECTOR_CASES.length} classification(s) still correct in both directions`);
  console.log(`                     canary: ${o.canaries.filter((r) => r.ok).length}/${o.canaries.length} offline${o.portal.length ? `, ${o.portal.filter((r) => r.ok).length}/${o.portal.length} portal` : ''}`);
  if (verbose) {
    for (const r of [...o.canaries, ...o.portal]) console.log(`    ${r.ok ? 'held ' : 'DEAD '} ${r.id}   (exit ${r.status}${r.uv ? ', libuv abort' : ''})`);
    for (const x of s.sites) console.log(`    ${x.ok ? 'ok  ' : 'BARE'} ${x.kind.padEnd(12)} ${x.path}:${x.line}`);
  }
  examined('assert-exit-codes', 'engine', s.inPop.length, 'portal-reaching-tool-files');
  examined('assert-exit-codes', 'engine', s.sites.length, 'catch-sites-that-could-swallow-a-halt');

  if (!o.problems.length) {
    console.log(`OK — no tool that reaches the portal can lose a declared exit code: ${s.exitSites} process.exit( call site(s) across ${s.inPop.length} file(s), and every one of ${s.sites.length} catch site(s) re-throws the halt.`);
    return 0;
  }
  console.error(`EXIT-CODE ASSERTION FAILED — ${o.problems.length} problem(s):`);
  o.problems.forEach((p) => console.error(`  ${p}`));
  return o.problems.length;
};

// CLI
if (process.argv[1] && /assert-exit-codes\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const o = run();
  // This file opens no socket of its own, so it is outside its own population and exits the
  // ordinary way. That exclusion is declared at SELF and its ground is derived by [XC-6].
  process.exitCode = report(o) ? 2 : 0;
}
