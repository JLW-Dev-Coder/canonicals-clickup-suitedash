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
import { SET_ROLES } from '../adapters/pdf/resolve-fixture.mjs';

const tier = process.argv[2] || 'unlabelled';

// ── discover the forms ───────────────────────────────────────────────────────────────────
const pdfs = readdirSync('adapters/pdf/forms').filter(f => /^f433[a-z]+\.pdf$/.test(f));
const allForms = pdfs.map(f => f.replace(/^f/, '').replace(/\.pdf$/, '')).sort();
const filled = allForms.filter(f => existsSync(`adapters/pdf/fill-${f}.mjs`));
const unfilled = allForms.filter(f => !existsSync(`adapters/pdf/fill-${f}.mjs`));
console.log(`forms discovered from adapters/pdf/forms: ${allForms.join(', ')}`);
console.log(`  with a fill engine (gated): ${filled.join(', ')}`);
console.log(`  without one (declared, not gated): ${unfilled.length ? unfilled.join(', ') : '(none)'}`);
console.log(`set roles, imported from resolve-fixture.mjs: ${[...SET_ROLES].join(', ')}`);

// ── discover the roles each form declares ────────────────────────────────────────────────
const roleOf = new Map();
for (const f of readdirSync('samples').filter(n => n.endsWith('.json'))) {
  const m = /^(433[a-z]+)\./.exec(f);
  if (!m) continue;
  let role = null;
  try { role = JSON.parse(readFileSync(`samples/${f}`, 'utf8'))?._fixture?.role ?? null; } catch { }
  if (!role) continue;
  if (!roleOf.has(m[1])) roleOf.set(m[1], new Set());
  roleOf.get(m[1]).add(role);
}
for (const f of filled) console.log(`  ${f} declares role(s): ${[...(roleOf.get(f) ?? [])].sort().join(', ') || '(none)'}`);

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
  if (rs.has('stress')) push(`overflow ${f}`, 'node', ['adapters/pdf/assert-overflow.mjs', f]);
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
