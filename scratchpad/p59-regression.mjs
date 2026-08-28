// p59-regression.mjs — the full pre-flight / closing regression for prompt 59.
//
// [R-19] GENERATOR DECLARATION: this file generates scratchpad/p59-regression.<tier>.txt and
//   prints its own transcript. It is not itself generated.
//
// [R-22] The form list is DISCOVERED from adapters/pdf/forms/*.pdf, and the roles each form
//   declares are DISCOVERED from samples/. Neither is typed.
//
// [R-38] / [D-27] — TWO DEFECTS THIS FILE COMMITTED ON ITS FIRST RUN, BOTH FIXED HERE AND BOTH
// RECORDED RATHER THAN QUIETLY REPAIRED, because [R-12] says to expect the fix to reproduce the
// class it fixes and to say where I looked.
//
//   ONE — set roles. The first draft fed every role it found in samples/ to run-form-gate as a
//   singleton `--role`. `record_shape` and `branch` are SET roles: a record takes one side of
//   each printed conditional, so the set carries one member per side and the claim is that ALL
//   are reached. resolve-fixture.mjs refuses a singleton request for them, correctly, and two
//   steps went red for asking the wrong question. SET_ROLES is now IMPORTED from
//   resolve-fixture.mjs rather than retyped here — a second copy of that list is a second thing
//   to drift — and the two set roles are routed to the tools that actually consume them:
//   assert-record-shape.mjs and saturation-union.mjs.
//
//   TWO — a concurrent-restore clobber, invisible. `gate 433boi production` came back exit 2
//   with `samples/433boi.slice3.sample.json` reported CO-AUTHORSHIP UNDECLARED. Run alone on
//   the same disk state that file is byte-identical to HEAD and the assertion is OK with it
//   classified CO-AUTHORED. The differing key set INCLUDED `_co_authored_with_hand` — the
//   declaration key itself — which is the signature of reading the file while another process's
//   `finally` restore was in flight. That is [D-27]'s mechanism. Two changes:
//     (a) `shell: true` is used ONLY for npm (which is npm.cmd on Windows and needs it). A node
//         step is spawned directly, so spawnSync waits on the process that holds samples/
//         rather than on a cmd.exe wrapper around it.
//     (b) samples/ is HASHED before and after every step. A step that leaves it changed is
//         reported as a STOP rather than surfacing two steps later as somebody else's red.
//         This is the guard whose absence let [D-27] run for a cycle.
//
// usage: node scratchpad/p59-regression.mjs <tier-label>

import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SET_ROLES, MAPPED_FORMS, candidatesFor } from '../adapters/pdf/resolve-fixture.mjs';

const tier = process.argv[2] || 'unlabelled';

// ── DISCOVER THE FORMS — FROM WHAT DECLARES THEM, NOT FROM WHAT CORRELATES WITH IT ───────
//
// [G-301] [G-302] [G-303], and [G-304] below. FOUR SITES IN THIS FILE decided a step's
// applicability from the PRESENCE of a file or from a NAMING PATTERN over one. The overflow
// step is the one that surfaced the class, by inventing a step the map already said does not
// exist; the other three were the same shape and had not been looked for.
// adapters/pdf/assert-runner-derivation.mjs now holds all four in its DERIVATIONS register,
// sweeps this file on every run, and STOPS on a site that is neither registered nor derived —
// so the fifth is a failure rather than a red step nobody can place. A PROXY IS A FACT TAKEN
// FROM SOMETHING THAT CORRELATES WITH IT INSTEAD OF FROM THE THING THAT DECLARES IT, and the
// correlation holds right up until it does not.

// [G-301] THE FORM UNIVERSE IS THE MAP SET. It was adapters/pdf/forms/ filtered by a naming
// pattern over f433<letters>.pdf — a rule fitted to the file names that happen to be there
// today, under which a form filed under any other name silently leaves the run and nothing
// says so. MAPPED_FORMS() derives it from adapters/pdf/maps/, which is the authority
// resolve-fixture.mjs, absence-sweep.mjs, assert-examined.mjs and assert-reachability.mjs all
// already ask. The PDF directory is still read — but as a CROSS-CHECK that REPORTS a form the
// tree holds and the maps do not, rather than as the population. A disagreement between the
// two is now a line in the transcript instead of a silent difference in which forms got gated.
const allForms = MAPPED_FORMS();
const pdfForms = readdirSync('adapters/pdf/forms')
  .filter(f => f.startsWith('f') && f.endsWith('.pdf')).map(f => f.slice(1, -4)).sort();
const unmapped = pdfForms.filter(f => !allForms.includes(f));
const mapless = allForms.filter(f => !pdfForms.includes(f));

// [G-302] GATED IS WHAT package.json GATES. It was existsSync('adapters/pdf/fill-<form>.mjs'):
// the presence of an engine file taken as the declaration that the form is gated. package.json
// DECLARES that, one gate:<form> script per gated form, and it is the same authority the
// overflow fix below already reaches for. The fill engine is still checked — as a CROSS-CHECK
// that reports a disagreement between the declaration and the file, rather than letting file
// presence settle the question on its own.
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {};
const gateDeclared = (f) => Object.prototype.hasOwnProperty.call(scripts, 'gate:' + f);
const fillEngine = (f) => existsSync('adapters/pdf/fill-' + f + '.mjs');
const filled = allForms.filter(gateDeclared);
const unfilled = allForms.filter(f => !gateDeclared(f));
const engineDisagreements = allForms
  .filter(f => fillEngine(f) !== gateDeclared(f))
  .map(f => `${f}: package.json ${gateDeclared(f) ? 'declares' : 'does not declare'} gate:${f}, but adapters/pdf/fill-${f}.mjs ${fillEngine(f) ? 'exists' : 'does not exist'}`);

console.log(`forms, derived from adapters/pdf/maps via MAPPED_FORMS(): ${allForms.join(', ')}`);
console.log(`  gated, derived from package.json gate:<form> scripts: ${filled.join(', ')}`);
console.log(`  mapped but not gated: ${unfilled.length ? unfilled.join(', ') : '(none)'}`);
console.log(`  cross-check, adapters/pdf/forms holds: ${pdfForms.join(', ')}`);
console.log(`    a PDF with no map (declared, outside this run): ${unmapped.length ? unmapped.join(', ') : '(none)'}`);
console.log(`    a map with no PDF: ${mapless.length ? mapless.join(', ') : '(none)'}`);
console.log(`    gate declaration vs fill engine: ${engineDisagreements.length ? engineDisagreements.join('; ') : 'agree on all ' + allForms.length}`);
console.log(`set roles, imported from resolve-fixture.mjs: ${[...SET_ROLES].join(', ')}`);

// [G-303] THE ROLES COME THROUGH THE TOOL THAT OWNS THE QUESTION. This walked samples/ itself
// and read the FORM out of the file NAME while reading the ROLE out of the file’s own
// declaration — half the fact declared, half inferred, in the same loop. resolve-fixture.mjs is
// the declared authority for exactly this: candidatesFor(form) states the directory it sweeps,
// the filter it applies and the classifier it uses, and REPORTS an unreadable or undeclared
// candidate by name instead of dropping it. It is also what run-form-gate resolves through, so
// asking it means the runner and the gate cannot disagree about what a form’s fixtures are.
// Re-implementing its filter here was the defect; the undeclared candidates it names are now
// printed rather than skipped in silence.
const roleOf = new Map();
const undeclared = [];
for (const f of allForms) {
  const rs = new Set();
  for (const r of candidatesFor(f).rows) {
    if (r.unreadable) { undeclared.push(`${r.path} will not parse: ${r.unreadable}`); continue; }
    if (!r.role) { undeclared.push(`${r.path} declares no _fixture.role`); continue; }
    rs.add(r.role);
  }
  roleOf.set(f, rs);
}
for (const f of filled) console.log(`  ${f} declares role(s): ${[...(roleOf.get(f) ?? [])].sort().join(', ') || '(none)'}`);
console.log(`  candidates carrying no role declaration, reported rather than skipped: ${undeclared.length}`);
for (const u of undeclared) console.log(`    ${u}`);

const steps = [];
const push = (label, cmd, args) => steps.push({ label, cmd, args });

// gates, both modes, every form with an engine
for (const f of filled) push(`gate ${f} saturated`, 'node', ['adapters/pdf/run-form-gate.mjs', f, '--saturated']);
for (const f of filled) push(`gate ${f} production`, 'node', ['adapters/pdf/run-form-gate.mjs', f]);

// every SINGLETON non-acceptance role the form declares
for (const f of filled) {
  const roles = [...(roleOf.get(f) ?? [])]
    .filter(r => !['acceptance', 'superseded'].includes(r) && !SET_ROLES.has(r)).sort();
  for (const r of roles) push(`gate ${f} role=${r}`, 'node', ['adapters/pdf/run-form-gate.mjs', f, '--role', r, '--saturated']);
}
// the SET roles, routed to the tools that consume them as sets
for (const f of filled) {
  const rs = roleOf.get(f) ?? new Set();
  // [G-304] OVERFLOW IS NOT A PROPERTY OF HAVING A STRESS FIXTURE, and the first draft assumed so.
  // assert-overflow.mjs refuses a form whose map declares no `groups` — "there is no overflow
  // behaviour on this form to assert, and an empty assertion is not a pass" — and 433-D is such
  // a form. The runner invented a step the tree already knows does not exist: package.json's
  // own `stress:433d` calls saturation-union and the gate, and never assert-overflow. Whether a
  // form HAS groups is now DERIVED from its map rather than inferred from its fixtures.
  let hasGroups = false;
  try { hasGroups = Object.keys(JSON.parse(readFileSync(`adapters/pdf/maps/${f}.map.json`, 'utf8')).groups ?? {}).length > 0; } catch { hasGroups = false; }
  if (rs.has('stress') && hasGroups) push(`overflow ${f}`, 'node', ['adapters/pdf/assert-overflow.mjs', f]);
  if (rs.has('stress') && !hasGroups) console.log(`  (${f} declares a stress fixture but its map declares no groups, so assert-overflow is not a step for it — derived from the map, not assumed)`);
  if (rs.has('record_shape')) push(`recordshape ${f} (set role)`, 'node', ['adapters/pdf/assert-record-shape.mjs', f]);
  if (rs.has('branch')) push(`saturation-union ${f} (set role)`, 'node', ['adapters/pdf/saturation-union.mjs', f, '--verbose']);
}
// coverage
for (const f of filled) push(`coverage ${f}`, 'node', ['adapters/pdf/declaration-coverage.mjs', f]);
// suites
push('sweeps', 'npm', ['run', 'sweeps']);
push('sweeps:deep', 'npm', ['run', 'sweeps:deep']);
push('regression tier: canary', 'node', ['adapters/hubspot/rerun-regression.mjs', '--canary']);
push('regression tier: portal', 'node', ['adapters/hubspot/rerun-regression.mjs', '--portal', '--canary']);
push('headroom', 'node', ['adapters/hubspot/headroom.mjs']);
push('hs-preflight', 'node', ['adapters/hubspot/hs-preflight.mjs']);

console.log(`\n${steps.length} step(s) derived. Running SERIALLY, with samples/ hashed across each one.\n`);

// ── the samples/ guard ───────────────────────────────────────────────────────────────────
function samplesDigest() {
  const h = createHash('sha256');
  for (const f of readdirSync('samples').sort()) h.update(f).update('\0').update(readFileSync(`samples/${f}`));
  return h.digest('hex');
}

const results = [];
const clobbers = [];
const t0 = Date.now();
let digest = samplesDigest();
console.log(`samples/ digest at start: ${digest.slice(0, 16)}\n`);

for (const [i, s] of steps.entries()) {
  const st = Date.now();
  const useShell = s.cmd === 'npm';       // npm.cmd needs a shell on Windows; node does not
  const r = spawnSync(s.cmd, s.args, { encoding: 'utf8', shell: useShell, maxBuffer: 1 << 28 });
  const secs = ((Date.now() - st) / 1000).toFixed(1);
  const code = r.status;
  const after = samplesDigest();
  const clobbered = after !== digest;
  if (clobbered) clobbers.push({ step: s.label, before: digest.slice(0, 16), after: after.slice(0, 16) });
  digest = after;
  results.push({ label: s.label, code, secs, clobbered, tail: (r.stdout || '').trim().split('\n').slice(-4).join('\n'), err: (r.stderr || '').trim().split('\n').slice(-8).join('\n') });
  console.log(`[${String(i + 1).padStart(2)}/${steps.length}] ${code === 0 ? 'PASS' : `FAIL(${code})`}  ${String(secs).padStart(6)}s  ${s.label}${clobbered ? '   *** samples/ CHANGED ACROSS THIS STEP ***' : ''}`);
  if (code !== 0) {
    console.log(results.at(-1).tail.split('\n').map(l => '      | ' + l).join('\n'));
    console.log(results.at(-1).err.split('\n').map(l => '      ! ' + l).join('\n'));
  }
}

const fails = results.filter(r => r.code !== 0);
const total = ((Date.now() - t0) / 1000).toFixed(1);
const summary = [
  `tier: ${tier}`,
  `steps: ${results.length}`,
  `passed: ${results.length - fails.length}`,
  `failed: ${fails.length}`,
  `steps that left samples/ changed: ${clobbers.length}`,
  `elapsed: ${total}s`,
  '',
  ...results.map(r => `${r.code === 0 ? 'PASS' : `FAIL(${r.code})`}  ${String(r.secs).padStart(7)}s  ${r.label}${r.clobbered ? '  [samples/ changed]' : ''}`),
  '',
  ...(clobbers.length ? ['SAMPLES CLOBBERED BY:', ...clobbers.map(c => `  ${c.step}: ${c.before} -> ${c.after}`), ''] : ['samples/ byte-identical across every step.', '']),
  ...fails.flatMap(r => [`--- ${r.label} ---`, r.tail, r.err, '']),
].join('\n');
writeFileSync(`scratchpad/p59-regression.${tier}.txt`, summary);
console.log(`\n${'='.repeat(72)}`);
console.log(`${results.length - fails.length}/${results.length} passed in ${total}s; samples/ changed across ${clobbers.length} step(s)`);
console.log(`-> scratchpad/p59-regression.${tier}.txt`);
process.exit(fails.length || clobbers.length ? 1 : 0);
