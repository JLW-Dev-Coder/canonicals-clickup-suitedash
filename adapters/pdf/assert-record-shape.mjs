// EVERY DECLARED ROUTE EXERCISED, AND BOTH GUARD DIRECTIONS PROVED TO STOP.
//
//   node adapters/pdf/assert-record-shape.mjs <form>
//   exit 0 = the fixture set covers every declared state of every declared route, each
//            "holds" fixture holds, and each "stops" fixture STOPS
//   exit 2 = any of that could not be established, INCLUDING because it could not be read
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY A SEPARATE TOOL AND WHY A SATURATED ACCEPTANCE FIXTURE CANNOT REPLACE IT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A record declares exactly ONE printed route, so the acceptance fixture can only ever
// exercise one state of one declaration — and the whole claim of adapters/pdf/record-shape.mjs
// is that BOTH states are checked rather than one being a skip. On 433-B(OIC) that showed up
// in the gate's own declaration-coverage table as `record_shape 2/4`: two states declared over
// two lines, and the acceptance fixture proving half of them. The other half is unreachable
// from one record, structurally, exactly as an over-max group is unreachable from a saturated
// one — which is why this file is the record-shape counterpart of assert-overflow.mjs.
//
// AND A SATURATED RUN CANNOT HOST THESE FIXTURES AT ALL. `--saturated` fails on any mapped text
// cell the record left empty, and a profit-and-loss record leaves fifteen of them empty ON
// PURPOSE. So the set runs in PRODUCTION mode, where an empty mapped cell is reported rather
// than failed, and the emptiness this file cares about is asserted here instead — per line,
// against the FILLED PDF, out of the gate's own per-line result file.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// FOUR QUESTIONS, FOUR FAILURES
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   1  DOES THE SET COVER THE MAP? Every declared state of every declared route must have
//      exactly one fixture expecting it to HOLD, and each route must have at least one fixture
//      in each guard direction. A set that covers three of four states would sail through
//      questions 2 to 4 with nothing to check on the fourth and report success for a run that
//      exercised nothing there. The emptiness is the first failure, as it is in assert-overflow.
//
//   2  DOES EACH "holds" FIXTURE HOLD? The gate must pass it, and the governed lines must come
//      back from the run verified, on the state the fixture declared.
//
//   3  DOES EACH "stops" FIXTURE STOP? The gate must FAIL it. A guard that cannot be shown
//      failing is a guard nobody has seen work — this repo's standing rule, and the reason
//      every canary in the tree is fired rather than described.
//
//   4  DOES IT STOP FOR THE RIGHT REASON? A run that failed for an unrelated arithmetic
//      mismatch would satisfy question 3 while proving nothing about the route. So the per-line
//      result is read back out of the run's own tripwires.json and the failing line must be a
//      GOVERNED line whose `record_shape.holds` is false. That is read off the artefact the run
//      produced, not off its exit code and not off its transcript.

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { loadRecordShape, statesOf } from './record-shape.mjs';
import { resolveFixtureSet, resolveFixture } from './resolve-fixture.mjs';

const form = process.argv[2];
if (!form) { console.error('usage: node adapters/pdf/assert-record-shape.mjs <form>'); process.exit(2); }

const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
const rs = loadRecordShape(mapDoc);
if (!rs.declared) {
  console.log(`record-shape assertion: ${form} declares no record shape — nothing to exercise, and that is a checked absence rather than a pass. adapters/pdf/maps/${form}.map.json carries no \`record_shape\` key.`);
  process.exit(0);
}

const problems = [];
const set = resolveFixtureSet(form, 'record_shape');
problems.push(...set.problems);

// ── (1) does the set cover the map? ────────────────────────────────────────────────────────
const rows = set.paths.map((p) => {
  let doc; try { doc = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return { path: p, unreadable: e.message }; }
  const c = doc._fixture?.record_shape;
  return { path: p, declaration: c?.declaration, state: c?.state, expect: c?.expect, doc };
});
for (const r of rows) if (r.unreadable) problems.push(`UNREADABLE ${r.path}: ${r.unreadable}`);
for (const r of rows) if (!r.unreadable && (!r.declaration || !r.state || !r.expect))
  problems.push(`UNDECLARED ${r.path} carries role record_shape and no complete _fixture.record_shape {declaration, state, expect}. A fixture in this set that does not say what it is for cannot be counted toward covering anything.`);
for (const r of rows) if (r.expect && !['holds', 'stops'].includes(r.expect))
  problems.push(`UNKNOWN EXPECTATION ${r.path} declares expect "${r.expect}" — it is "holds" or "stops" and there is no third.`);

console.log(`record-shape assertion: ${form} — ${rs.declarations.length} declared route(s), ${set.paths.length} fixture(s) in the set`);
console.log(`  swept: ${set.swept.dir}/ — ${set.swept.filter}; classified by ${set.swept.classifier}`);

// THE ACCEPTANCE FIXTURE IS A WITNESS FOR THE STATE IT DECLARES, and it must be, because
// otherwise the set would need a second copy of it to cover the grid route — a duplicate of a
// known-good record kept only to satisfy a counter, which is the two-lists-of-one-fact shape
// this repo forbids. It is resolved through resolve-fixture.mjs rather than named, so it stays
// the fixture the gate itself runs, and it is REPORTED as the witness so a reader can see
// which state is covered by a dedicated fixture and which by the acceptance record.
const acc = resolveFixture(form, 'acceptance');
if (acc.problems.length) problems.push(...acc.problems);
const accDoc = acc.path ? JSON.parse(readFileSync(acc.path, 'utf8')) : null;

for (const d of rs.declarations) {
  const mine = rows.filter((r) => r.declaration === d.id);
  const accState = accDoc ? String(accDoc[d.input] ?? '').trim() : '';
  if (accDoc && !accState)
    problems.push(`ACCEPTANCE ${acc.path} declares no "${d.input}". It cannot witness any state of ${d.id}, and the gate would STOP on it anyway.`);
  for (const st of statesOf(d)) {
    const holds = mine.filter((r) => r.state === st && r.expect === 'holds');
    const byAcceptance = accState === st ? 1 : 0;
    const total = holds.length + byAcceptance;
    if (total !== 1)
      problems.push(`COVERAGE ${d.id}: state "${st}" has ${total} witness(es) expecting it to HOLD and needs exactly one${total ? ` — ${[...holds.map((h) => h.path), ...(byAcceptance ? [`${acc.path} (the acceptance fixture)`] : [])].join(', ')}` : '. Until one exists, that state\'s check has never run on this form.'}`);
    else console.log(`    state "${st}" holds-witness: ${byAcceptance ? `${acc.path} (the acceptance fixture, run saturated by the gate)` : holds[0].path}`);
  }
  const stops = mine.filter((r) => r.expect === 'stops');
  const stopStates = new Set(stops.map((r) => r.state));
  if (stopStates.size < 2)
    problems.push(`COVERAGE ${d.id}: the set holds ${stops.length} fixture(s) expecting a STOP across ${stopStates.size} state(s). BOTH guard directions must be proved — a record on the profit-and-loss route with its operands filled, and a record on the grid route with its operands empty — and a guard proved in one direction only is a guard half seen.`);
  console.log(`  ${d.id}: states ${statesOf(d).join(' | ')}; ${mine.length} fixture(s) — ${mine.filter((r) => r.expect === 'holds').length} expect HOLDS, ${stops.length} expect STOPS across ${stopStates.size} state(s)`);
}

// ── (2)-(4) run each fixture and read the verdict back off the artefact ────────────────────
const results = [];
for (const r of rows) {
  if (r.unreadable || !r.expect) continue;
  const run = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', form, r.path], { encoding: 'utf8' });
  const passed = run.status === 0;
  const outPath = `adapters/pdf/out/${form}_filled_${r.doc.intake_id || 'sample'}.pdf`;
  const twPath = outPath.replace(/\.pdf$/, '.tripwires.json');
  // THE PER-LINE RESULT IS READ OFF THE RUN'S OWN ARTEFACT, and only when the run produced
  // one. A gate that failed BEFORE step 11 writes no tripwires.json, and reading a stale file
  // from an earlier run would be reading another document's answer — which is why the gate
  // stamps the filled PDF's SHA-256 into it and why an absent file is reported, never skipped.
  let tw = null;
  if (existsSync(twPath)) { try { tw = JSON.parse(readFileSync(twPath, 'utf8')); } catch { tw = null; } }
  const stale = tw && tw.sample !== r.path;
  const governed = (rs.byId.get(r.declaration)?.governs) || [];
  const lines = (tw?.lines || []).filter((l) => governed.includes(l.line));
  const shapeFailed = lines.filter((l) => l.record_shape && l.record_shape.holds === false);
  const shapeVerified = lines.filter((l) => l.record_shape && l.record_shape.holds === true && l.verdict === 'verified');

  results.push({ ...r, passed, twPath, stale, lines, shapeFailed, shapeVerified });

  if (r.expect === 'holds') {
    if (!passed) problems.push(`DID NOT HOLD ${r.path} declares state "${r.state}" and expects the gate to pass; it exited ${run.status}. The route's own check is not what proved it, and this fixture proves nothing until the run is clean.`);
    else if (!tw) problems.push(`NO RESULT ${r.path} passed and wrote no ${twPath}. A pass with no per-line record is an exit code, not evidence.`);
    else if (stale) problems.push(`STALE RESULT ${twPath} names sample ${tw.sample}, not ${r.path}.`);
    else if (shapeVerified.length !== governed.length)
      problems.push(`INCOMPLETE ${r.path}: ${shapeVerified.length} of ${governed.length} governed line(s) came back verified under a record shape. Governed: ${governed.join(', ')}. A route that passed while one of its lines was skipped or not checkable has not been exercised on that line.`);
  } else {
    if (passed) problems.push(`DID NOT STOP ${r.path} declares state "${r.state}" with expect "stops" and the gate PASSED it. A guard that cannot be shown failing is a guard nobody has seen work.`);
    else if (!tw) problems.push(`STOPPED FOR AN UNKNOWN REASON ${r.path} failed and wrote no ${twPath}, so this run cannot say the record shape is what stopped it. A stop for the wrong reason satisfies the exit code and proves nothing.`);
    else if (stale) problems.push(`STALE RESULT ${twPath} names sample ${tw.sample}, not ${r.path}.`);
    else if (!shapeFailed.length)
      problems.push(`STOPPED FOR THE WRONG REASON ${r.path} failed, and no governed line in ${twPath} reports record_shape.holds === false. Governed: ${governed.join(', ')}. The run stopped for something else.`);
  }
}

console.log('');
console.log(`  ${'fixture'.padEnd(52)} ${'state'.padEnd(26)} expect  gate    governed lines`);
for (const r of results) {
  const detail = r.expect === 'stops'
    ? (r.shapeFailed.length ? `${r.shapeFailed.length} refused by the record shape: ${r.shapeFailed.map((l) => `${l.line} (${l.record_shape.operands_filled}/${l.record_shape.operands} operands filled)`).join('; ')}` : 'none refused by the record shape')
    : `${r.shapeVerified.length} verified: ${r.shapeVerified.map((l) => `${l.line} (${l.record_shape.operands_filled}/${l.record_shape.operands} operands filled)`).join('; ')}`;
  console.log(`  ${r.path.padEnd(52)} ${String(r.state).padEnd(26)} ${r.expect.padEnd(7)} ${(r.passed ? 'passed' : 'FAILED').padEnd(7)} ${detail}`);
}

if (problems.length) {
  console.error('');
  console.error(`RECORD-SHAPE ASSERTION FAILED — ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(2);
}
console.log('');
console.log(`ASSERT-RECORD-SHAPE PASSED — ${rs.declarations.length} declared route(s), every declared state exercised by exactly one fixture that holds, and both guard directions proved to STOP with the record shape named as the reason in the run's own per-line result.`);
