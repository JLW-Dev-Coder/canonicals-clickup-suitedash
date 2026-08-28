// assert-runner-derivation.mjs — prompt 59-C item 4, and the standing sweep for the class
// `overflow 433d` surfaced.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DEFECT THAT EARNED IT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The closing-regression runner invented a step. It pushed `assert-overflow.mjs 433d` because
// 433-D declares a STRESS FIXTURE, and a stress fixture correlates with having overflow
// behaviour — on five of the six mapped forms. On the sixth it does not: 433-D's map declares
// no `groups` at all, `assert-overflow.mjs` refuses such a form in as many words, and
// package.json's own `stress:433d` calls `saturation-union.mjs` and the gate and never calls
// assert-overflow. The tree already held the answer in two places. The runner asked neither and
// asked a proxy instead, and the step went red for a form on which the step does not exist.
//
// A PROXY IS A FACT TAKEN FROM SOMETHING THAT CORRELATES WITH IT INSTEAD OF FROM THE THING THAT
// DECLARES IT. The correlation holds until it does not, and the moment it stops holding is not
// the moment anybody looks. That is the same shape as `[R-43]`'s retyped name set and `[R-07]`'s
// typed count, one level out: here the thing being inferred is not a name or a number but
// WHETHER A STEP APPLIES AT ALL.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS SWEEP DOES, AND IN BOTH DIRECTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// NEGATIVE — no unregistered filesystem probe. Every `existsSync` / `readdirSync` / `statSync` /
//   `readFileSync` in the runner is a place where a fact could be taken from presence. Each must
//   appear in DERIVATIONS with a verdict naming its AUTHORITY. A probe the register does not
//   carry is a STOP, so the fifth site is a failure rather than a red step nobody can place.
//
// POSITIVE — the declared authorities are actually consulted. A negative-only sweep passes
//   perfectly over a runner that has stopped asking the map and the package manifest entirely,
//   because a file that probes nothing has no unregistered probes. So DERIVATIONS also carries
//   `required` entries whose anchors must be PRESENT, and an absent one is a STOP. This is
//   `[D-12]`'s shape avoided on purpose: a canary over the comparator and not the population
//   selector is half an instrument.
//
// ORPHANS — an anchor matching no line in the runner is a STOP in both kinds. A register that
//   can go quiet is a register that certifies whatever it is pointed at.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE POPULATION IS DERIVED FROM package.json, WHICH IS THE POINT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A sweep whose subject is "applicability must be derived, not inferred from a path" cannot
// itself carry a typed path to its subject — that would be the defect it exists to refuse, one
// level up, and `[R-22]` already says pre-flight discovers and is never told. So the runner is
// read out of the npm script that runs it: package.json declares `regression:closing`, the
// command names one `.mjs`, and that file is the population. A script that stops existing is a
// STOP here rather than a silent sweep of nothing.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY, AND [R-42]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Four synthetic runner sources with asserted yields, run through the SAME classify() the real
// sweep uses: a conforming source must yield nothing; an unregistered probe must yield exactly
// one; a missing required anchor must yield exactly one; and an orphaned anchor must yield
// exactly one. The last three are the directions that go quiet, and the FIRST is there because
// a sweep that reported everything would satisfy a failure-only canary and stop the engine on
// its next run.
//
// `[R-42]`: A CANARY MUST NOT ENTER THE POPULATION IT GUARDS. Two things hold that here, and
// the second is asserted rather than assumed. (a) The population is one file named by
// package.json, and this file is not it — checked below, not asserted in prose. (b) The probe
// tokens inside the plants are ASSEMBLED by concatenation, so the literal text this sweep looks
// for does not appear in this file's own source; if the population is ever widened to the
// directory, the canary still does not join it. That is the defect [R-42] was ruled on, written
// down here as the thing that stops it recurring rather than as a comment saying it was avoided.
//
// WHAT THIS SWEEP CANNOT SEE, stated rather than left as a silence ([R-14]):
//   - A probe in a TRAILING comment on a line that also holds code. Whole-line comments are
//     skipped, trailing ones are not, so such a line reads as a probe site and must be
//     registered. That direction is loud, not quiet, which is the safe one.
//   - A fact inferred without touching the filesystem at all — a step made conditional on a
//     hard-coded list, say. The `required` entries are what stand against that, and they stand
//     only for the authorities they name.
//   - Any file other than the one package.json declares. This sweeps the closing runner, not
//     every runner that might ever exist.
//
// [R-19] GENERATOR DECLARATION: this file generates nothing. It asserts.
//
// usage: node adapters/pdf/assert-runner-derivation.mjs [--verbose]

import { readFileSync, existsSync } from 'node:fs';
import { rx } from './regex-self-assert.mjs';

const verbose = process.argv.includes('--verbose');

// ── THE PROBE PATTERN, AND WHY IT IS A REGEX AND NOT A SUBSTRING LIST ────────────────────
//
// The first draft matched with `.includes('readFileSync(')` over a hand-written array of four
// tokens. Two things were wrong with it and blanket-audit found the second.
//
//   ONE — substring matching has no word boundary, so `myReadFileSync(` and `xstatSync(` each
//   read as a probe. The direction is a false POSITIVE, which is the loud one, but a register
//   entry written to dispose of a phantom is a register entry disposing of nothing.
//
//   TWO, AND IT IS THE ONE THAT MATTERED. adapters/pdf/blanket-audit.mjs DERIVES its detector
//   population — a file that searches by pattern over text it did not enumerate AND can stop a
//   run — and its first clause is `.matchAll(`, `new RegExp(` or `.match(`. A detector that
//   scans by substring satisfies every word of that description and matches none of the clause,
//   so this file would have sat outside the canary register entirely: a detector the register
//   that exists to demand a canary would never have asked one of. It is disposed there now, and
//   the blind spot is REPORTED rather than widened away mid-cycle — widening the signature
//   changes the population every other check in this tree is read through, which is the adjacent
//   change [R-20] says to carry rather than resolve.
//
// The four names live in the pattern and nowhere else. A separate array beside it would be the
// same list written twice, which is [R-43].
const RX_PROBE = rx('RX-RN-01', /\b(existsSync|readdirSync|statSync|readFileSync)\s*\(/g, {
  why: 'a filesystem probe — the four ways this runner can take a fact from the presence or contents of a path rather than from something that declares it',
  matches: ["if (existsSync('a')) {", 'readdirSync(dir)', 'JSON.parse(readFileSync(p, "utf8"))', 'statSync( p )'],
  rejects: ['myExistsSync(x)', 'xstatSync(y)', 'existsSyncButNot', 'readFileSyncish(z)'],
  captures: [["if (existsSync('a')) {", ['existsSync']], ['JSON.parse(readFileSync(p, "utf8"))', ['readFileSync']]],
});

// The npm script that names the population. Declared here and resolved against package.json.
const CLOSING_SCRIPT = 'regression:closing';

// ── THE REGISTER ────────────────────────────────────────────────────────────────────────
//
// `kind: 'probe'`   — a filesystem probe. `authority` names what the fact is derived FROM, and
//                     `verdict` says whether that probe DECIDES a step (`derived`), merely
//                     REPORTS a disagreement (`cross-check`), or has nothing to do with step
//                     applicability at all (`not-applicability`). A `proxy` verdict is a STOP:
//                     the register is a place to record the fix, never a place to excuse it.
// `kind: 'required'` — an anchor that must be PRESENT, because it is the authority being asked.
//
export const DERIVATIONS = [
  { id: 'G-301', kind: 'probe', verdict: 'cross-check',
    anchor: "const pdfForms = readdirSync('adapters/pdf/forms')",
    authority: 'adapters/pdf/maps, through MAPPED_FORMS() in adapters/pdf/resolve-fixture.mjs',
    was: 'THE POPULATION. The form universe was adapters/pdf/forms filtered by a naming pattern over f433<letters>.pdf, so which forms got gated was decided by how the PDFs happen to be named. A form filed under any other name left the run and nothing said so.',
    now: 'A CROSS-CHECK ONLY. The universe is MAPPED_FORMS(), derived from the map directory — the same authority resolve-fixture.mjs, absence-sweep.mjs, assert-examined.mjs and assert-reachability.mjs already ask. This read stays so a PDF with no map and a map with no PDF are each REPORTED by name, which the naming-pattern version could not do because the two sets were the same object.' },

  { id: 'G-302', kind: 'probe', verdict: 'cross-check',
    anchor: "const fillEngine = (f) => existsSync('adapters/pdf/fill-' + f + '.mjs');",
    authority: "package.json, the gate:<form> script per gated form",
    was: 'THE PREDICATE. Whether a form was gated was decided by whether adapters/pdf/fill-<form>.mjs exists — the presence of an engine file read as the declaration that the form is gated.',
    now: 'A CROSS-CHECK ONLY. package.json DECLARES which forms are gated, one gate:<form> script each, and that is the same authority the overflow site already reaches for. The engine file is still probed so a disagreement between the declaration and the file is REPORTED rather than settled silently by whichever the runner happened to ask.' },

  { id: 'G-304', kind: 'probe', verdict: 'derived',
    anchor: "hasGroups = Object.keys(JSON.parse(readFileSync(`adapters/pdf/maps/${f}.map.json`, 'utf8')).groups ?? {}).length > 0;",
    authority: "the form's own map, its `groups` key",
    was: 'THE KNOWN INSTANCE. An overflow step was pushed for any form declaring a stress fixture, because on five of six forms the two coincide. 433-D declares a stress fixture and no groups, assert-overflow.mjs refuses such a form, and the runner invented a step the map already said does not exist.',
    now: 'DERIVED FROM THE MAP. Whether a form has overflow behaviour is whether its map declares groups, read from the map. The form that does not is named in the transcript rather than dropped, so the absence of the step is visible.' },

  { id: 'G-305', kind: 'probe', verdict: 'derived',
    anchor: "const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {};",
    authority: 'package.json itself',
    was: 'NOT PRESENT. The runner did not read the manifest at all, which is why file presence had to stand in for it.',
    now: 'THE AUTHORITY, read once and used by [G-302]. It is registered as a probe because it IS a filesystem read and this register does not get to decide that some reads do not count.' },

  { id: 'G-306', kind: 'probe', verdict: 'not-applicability',
    anchor: "for (const f of readdirSync('samples').sort()) h.update(f)",
    authority: 'none — it decides no step',
    was: 'NOTHING. It has never decided applicability.',
    now: "THE samples/ CLOBBER GUARD, hashing the fixture directory before and after every step so a run that leaves it changed is reported at the step that changed it. That is [R-41] and [D-27]'s mechanism, and it is registered here because an unregistered probe is a STOP and silence about this one would be indistinguishable from the register having missed it." },

  { id: 'G-303', kind: 'required',
    anchor: 'for (const r of candidatesFor(f).rows) {',
    authority: 'adapters/pdf/resolve-fixture.mjs, through candidatesFor()',
    was: 'A SECOND IMPLEMENTATION. The runner walked samples/ itself and read each fixture’s FORM out of its file NAME while reading its ROLE out of the file’s own declaration — half the fact declared and half inferred, in one loop. resolve-fixture.mjs exists to answer exactly that question, states the directory it sweeps and the classifier it uses, and reports an unreadable or undeclared candidate by name instead of dropping it.',
    now: 'ASKED, NOT REIMPLEMENTED. The runner and the gate now resolve fixtures through one tool and cannot disagree about what a form’s fixtures are. This is a `required` entry because the fix REMOVED a probe: a negative-only sweep would read its absence as a clean file.' },

  { id: 'G-307', kind: 'required',
    anchor: 'const allForms = MAPPED_FORMS();',
    authority: 'adapters/pdf/resolve-fixture.mjs, through MAPPED_FORMS()',
    was: 'A DIRECTORY LISTING FILTERED BY A NAMING PATTERN — see [G-301].',
    now: 'THE DECLARED FORM SET. Registered as `required` for the same reason as [G-303]: the fix is the ABSENCE of an inference, and an absence is invisible to a sweep that only looks for what is there.' },
];

// ── THE CLASSIFIER, AS ONE FUNCTION OVER A SOURCE STRING ────────────────────────────────
// Taking the source as an argument rather than reading disk is what makes the canary possible:
// the same code that judges the runner is run over fixed synthetic inputs with asserted yields.
export const classify = (src, register) => {
  const lines = String(src).split('\n');
  const code = lines
    .map((l, i) => ({ n: i + 1, text: l }))
    .filter((l) => !l.text.trimStart().startsWith('//'));

  const problems = [];
  const probeSites = [];
  const matched = new Set();

  // NEGATIVE — every probe line is registered.
  for (const l of code) {
    const tokens = [...new Set([...l.text.matchAll(RX_PROBE)].map((m) => m[1]))];
    if (!tokens.length) continue;
    probeSites.push({ line: l.n, text: l.text.trim(), tokens });
    const entry = register.find((e) => e.kind === 'probe' && l.text.includes(e.anchor));
    if (entry) { matched.add(entry.id); continue; }
    problems.push(`UNREGISTERED PROBE  line ${l.n}: ${l.text.trim()}\n      It reads the filesystem (${tokens.join(', ')}) and no DERIVATIONS entry claims it. Say what the fact is derived FROM, or derive it from the map or from package.json. A fact taken from a proxy is the defect this sweep exists for.`);
  }

  // POSITIVE — every required anchor is present.
  for (const e of register.filter((x) => x.kind === 'required')) {
    if (code.some((l) => l.text.includes(e.anchor))) { matched.add(e.id); continue; }
    problems.push(`AUTHORITY NOT CONSULTED  [${e.id}] expects ${JSON.stringify(e.anchor)} and the runner does not carry it.\n      Its authority is ${e.authority}. This entry exists because the fix REMOVED an inference, and a sweep that only looks for probes reads that removal as a clean file.`);
  }

  // ORPHANS — an anchor pointing at nothing certifies whatever it is pointed at.
  //
  // PROBE ENTRIES ONLY, and the canary is what said so. Its "a missing required anchor is
  // found" case expected one problem and got two: an absent `required` anchor is ALREADY
  // reported as AUTHORITY NOT CONSULTED, and sweeping it a second time as an orphan reports one
  // fact twice. Two counts for one defect is how a problem list stops being a count of
  // problems — and it is the direction that inflates, so nothing would have failed and nobody
  // would have looked. Caught on this file's first run, by the canary, which is the whole
  // argument for [R-17] in four lines.
  for (const e of register.filter((x) => x.kind === 'probe')) {
    if (matched.has(e.id)) continue;
    problems.push(`ORPHANED ANCHOR  [${e.id}] anchors on ${JSON.stringify(e.anchor)}, which matches no line in the runner. An anchor that matches nothing disposes of nothing.`);
  }

  // A `proxy` verdict is a record of a defect, never an excuse for one.
  for (const e of register.filter((x) => x.verdict === 'proxy'))
    problems.push(`PROXY CARRIED  [${e.id}] declares verdict "proxy". The register records fixes; it is not a place to excuse an inference. Derive it from the map or from package.json.`);

  return { problems, probeSites, lines: lines.length, code: code.length };
};

// ── THE CANARY ──────────────────────────────────────────────────────────────────────────
// [R-42]: the probe tokens are ASSEMBLED so the literal text this sweep looks for never appears
// in this file's source. The plants are not drawn from the runner.
const P_EXISTS = 'exists' + 'Sync(';
const P_READ = 'read' + 'FileSync(';
const CANARY_REG = [
  { id: 'C-1', kind: 'probe', verdict: 'derived', anchor: 'const decl = ' + P_READ, authority: 'a declaration', was: '', now: '' },
  { id: 'C-2', kind: 'required', anchor: 'askTheAuthority()', authority: 'the authority', was: '', now: '' },
];
const CANARY_CASES = [
  { name: 'conforming source yields nothing',
    src: ['// a comment holding ' + P_EXISTS + ' must not count', "const decl = " + P_READ + "'x');", 'askTheAuthority();'].join('\n'),
    reg: CANARY_REG, expect: 0 },
  { name: 'an unregistered probe is found',
    src: ["const decl = " + P_READ + "'x');", 'askTheAuthority();', "if (" + P_EXISTS + "'y')) step();"].join('\n'),
    reg: CANARY_REG, expect: 1 },
  { name: 'a missing required anchor is found',
    src: ["const decl = " + P_READ + "'x');"].join('\n'),
    reg: CANARY_REG, expect: 1 },
  { name: 'an orphaned anchor is found',
    src: ['askTheAuthority();'].join('\n'),
    reg: CANARY_REG, expect: 1 },
];

export const canaryHolds = () => {
  const results = CANARY_CASES.map((c) => ({ name: c.name, got: classify(c.src, c.reg).problems.length, expect: c.expect }));
  return { results, ok: results.every((r) => r.got === r.expect) };
};

// ── CLI ─────────────────────────────────────────────────────────────────────────────────
const cy = canaryHolds();
console.log(`canary: ${cy.results.filter((r) => r.got === r.expect).length} of ${cy.results.length} case(s) reached the asserted yield`);
if (verbose || !cy.ok) for (const r of cy.results) console.log(`    ${r.got === r.expect ? 'ok  ' : 'FAIL'}  ${r.name} — expected ${r.expect}, got ${r.got}`);
if (!cy.ok) {
  console.error('STOP — the canary does not hold, so this sweep cannot be trusted over the runner.');
  process.exit(5);
}

// THE POPULATION, DERIVED FROM package.json.
let scripts = null;
try { scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {}; }
catch (e) {
  console.error(`STOP — package.json will not parse (${e.message}). The population of this sweep is derived from it, and a sweep that cannot find its population reports nothing, which reads exactly like a clean runner.`);
  process.exit(4);
}
const cmd = scripts[CLOSING_SCRIPT];
if (!cmd) {
  console.error(`STOP — package.json declares no ${JSON.stringify(CLOSING_SCRIPT)} script. This sweep derives its subject from that script rather than carrying a path, per [R-22]; with no script there is no subject, and reporting a clean sweep of nothing is the shape this file exists to refuse.`);
  process.exit(4);
}
// No regex here on purpose: a regex source carrying a backslash owes [R-17] a self-assertion,
// and a whitespace split does not need one.
const runner = cmd.split(' ').filter(Boolean).find((w) => w.endsWith('.mjs')) ?? null;
if (!runner || !existsSync(runner)) {
  console.error(`STOP — ${JSON.stringify(CLOSING_SCRIPT)} is ${JSON.stringify(cmd)} and no .mjs in it resolves to a file in this tree.`);
  process.exit(4);
}
console.log(`population: ${runner}, derived from package.json script ${JSON.stringify(CLOSING_SCRIPT)}`);

// [R-42], asserted rather than assumed: the canary's subject must not be this file.
const self = 'adapters/pdf/assert-runner-derivation.mjs';
if (runner.split('\\').join('/') === self) {
  console.error(`STOP — the population resolved to this sweep's own source. A canary must not enter the population it guards ([R-42]), and neither must the detector.`);
  process.exit(5);
}

const src = readFileSync(runner, 'utf8');
const { problems, probeSites, lines, code } = classify(src, DERIVATIONS);

console.log(`swept ${lines} line(s), ${code} of them code; ${probeSites.length} filesystem probe site(s); ${DERIVATIONS.length} register entr(ies)`);
for (const e of DERIVATIONS)
  console.log(`  [${e.id}] ${(e.kind === 'probe' ? e.verdict : 'required').padEnd(17)} ${e.authority}`);
if (verbose) for (const p of probeSites) console.log(`    line ${String(p.line).padStart(4)}  ${p.text}`);

if (problems.length) {
  console.error(`RUNNER DERIVATION — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(2);
}
console.log(`ASSERT-RUNNER-DERIVATION PASSED — every one of ${probeSites.length} filesystem probe(s) in ${runner} is registered with the authority its fact is derived from, every declared authority is consulted, and no anchor is an orphan.`);
