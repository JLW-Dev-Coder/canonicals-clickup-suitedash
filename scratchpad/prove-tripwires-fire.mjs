// PROVE EVERY DECLARED LINE ON ONE FORM REFUSES A WRONG VALUE — ONE BREAK EACH — AND REVERT.
//
//   node scratchpad/prove-tripwires-fire.mjs <form>
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS GENERALISES, AND THE FINDING KEPT VERBATIM FROM WHAT IT REPLACES ([R-21])
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// scratchpad/433b-prove-every-tripwire-fires.mjs did this for 433-B and its header records the
// defect [R-28] is named for, word for word from the slice-3 prover it in turn replaced:
//
//   "The first version asserted only `run.status !== 0` and reported PROVED on both totals.
//    The gate had failed at STEP 3, on assert-fixture-authorship.mjs — the broken record no
//    longer matched the generator it claims — and step 11 never ran at all. The tripwire was
//    never reached, never mind fired, and the proof said it had."
//
// FOUR OF THE FIVE MAPPED FORMS HAD NO BREAK PROOF AT ALL. 433-A's 16 declared lines, 433-F's
// 5, 433-A(OIC)'s 51 and 433-B(OIC)'s 31 had passed on every run ever made and had never once
// been seen to say no. A comparison that has only ever agreed is the exact state [R-28] exists
// for, and adapters/pdf/assert-firing-proofs.mjs had been naming those four zeros on every run.
//
// One file rather than five, because a class fixed on one form and copied to its neighbours is
// how the same defect arrives four more times ([R-12]). Everything it needs is read from the
// form: the fixture from its declared role, the declared lines from its totals file, the feeder
// graph from the same file, and the address of each line from the gate's own per-line result.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE PROVER DOES NOT DECIDE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// It records the step the run died at, the broken line verbatim, its verdict, and every other
// declared line's verdict, and writes them to adapters/pdf/firing-proofs/. Whether that is a
// proof is settled by adapters/pdf/assert-firing-proofs.mjs against the conditions in
// adapters/pdf/firing-proofs.mjs. A prover that judges its own output is how the first draft of
// the slice-3 prover came to report PROVED on a gate that died three steps early.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHICH RECORD EACH LINE IS BROKEN IN, AND WHY IT IS NOT ALWAYS THE ACCEPTANCE ONE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A declared line may carry a `when` predicate, and a record puts each printed conditional on
// ONE branch. On 433-B(OIC) three of the 31 declared lines read SKIPPED on the acceptance
// record and on every other fixture the form had; on 433-A(OIC), two of 51. Breaking a line the
// step never asks does nothing at all, so this file first runs the gate CLEAN against every
// fixture whose declared role expects a clean gate, reads the per-line result the gate writes,
// and assigns each declared line to a record that puts it IN CLASS. A line in class nowhere is
// a STOP naming it — never a line quietly left out of the count.
//
// THE BREAK IS THE SMALLEST UNIT THE LINE ITSELF PRINTS, on each line in turn, in whichever
// record was assigned to it. "No tolerance in any comparison" ([R-09]) is a claim that has to
// be demonstrable at the smallest unit the form prints — and THAT UNIT IS NOT ONE CENT ON EVERY
// LINE.
//
// THE FIRST DRAFT BROKE EVERY LINE BY ONE CENT AND THE RECORD SAID SO ON FOURTEEN LINES THAT
// NEVER MOVED. 433-B(OIC) prints its page-2 arithmetic in WHOLE DOLLARS and declares
// `rounding_mode: nearest_dollar` on those lines, so 63,656.00 broken to 63,656.01 rounds
// straight back to 63,656 and the tripwire correctly reports yes. The gate exited 0, the line
// read `yes`, and `failed_at_step` came out null — which is exactly the state [R-28] exists to
// make unrecordable, and adapters/pdf/assert-firing-proofs.mjs refused all fourteen as
// UNASKABLE rather than letting a "proof" through that proved nothing.
//
// A one-cent break on a nearest-dollar line does not demonstrate that the comparison has no
// tolerance; it demonstrates that the line rounds, which the line already says. So the break
// size is DERIVED FROM THE LINE'S OWN `rounding_mode`, read out of the gate's own per-line
// result on the clean run: one cent where the line prints cents, one dollar where the line's
// own declaration says it rounds to the dollar. Each entry records which, and why.
//
// THE RECORD IS RESTORED FROM ITS OWN BYTES and the restoration verified by SHA-256, not by
// re-running a generator: a generator re-run proves the generator deterministic, not that this
// file put back what it took.

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { candidatesFor } from '../adapters/pdf/resolve-fixture.mjs';
import { writeRecord, RECORD_DIR } from '../adapters/pdf/firing-proofs.mjs';

const FORM = process.argv[2];
if (!FORM) { console.error('usage: node scratchpad/prove-tripwires-fire.mjs <form>'); process.exit(2); }

// ═══════════════════════════════════════════════════════════════════════════════════════
// ONE PROVER AT A TIME, ACROSS ALL FORMS. THIS IS A LOCK AND NOT A CONVENIENCE.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Two of these were run in parallel on different forms — 433-F/433-A/433-B(OIC) in one process
// and 433-A(OIC) in another — on the reasoning that a form's gate only touches its own
// artefacts. THAT REASONING IS FALSE, and the mechanism is one level down:
//
//   adapters/pdf/validate-map.mjs runs assert-fixture-authorship.mjs at GATE STEP 3. That
//   assert re-runs every generator any fixture names, and because those generators write to
//   samples/ BY NAME and take no output path, it COPIES EVERY FILE A GENERATOR COULD WRITE
//   ASIDE, spawns the generator, reads the result, and restores the originals.
//
// So EVERY gate run of ANY form takes temporary custody of samples/ — including the fixtures
// of forms it has nothing to do with. Two concurrent gates interleave those copy-aside and
// restore steps, and what came out was: samples/433b.slice4.sample.json TRUNCATED MID-WRITE
// and unparseable, and 433-B(OIC)'s negative and overmax fixtures reported as DRIFT because
// their generators had regenerated from a slice3 record another process was holding broken.
//
// The engine caught all of it — "UNREADABLE ... A fixture whose authorship cannot be read is
// not a fixture with no claim" — and the prover STOPped before recording anything. This lock is
// so the next run does not have to rely on that.
const LOCK = 'adapters/pdf/tmp/.prover.lock';
try { mkdirSync(LOCK); }
catch {
  console.error(`STOP — ${LOCK} exists, so another prover is running (or one died holding it).`);
  console.error('  Two of these cannot run at once: gate step 3 copies every generator-writable fixture aside');
  console.error('  and restores it, so concurrent gates corrupt each other\'s inputs regardless of form.');
  console.error(`  If nothing is running, remove ${LOCK} and re-run.`);
  process.exit(2);
}
const releaseLock = () => { try { rmSync(LOCK, { recursive: true }); } catch { /* already gone */ } };
process.on('exit', releaseLock);
process.on('SIGINT', () => { releaseLock(); process.exit(130); });

// ═══════════════════════════════════════════════════════════════════════════════════════
// AND THE BYTES ARE HELD ON DISK WHILE A BREAK IS LIVE, BECAUSE A REVERT IN MEMORY IS NOT
// A REVERT IF THE PROCESS IS KILLED.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// This prover restores each record from its own bytes and proves the restoration by SHA-256,
// which is [FS-5] and which is sound for every ending EXCEPT the one that actually happened: a
// run of it was KILLED between the write and the revert, and it left
// samples/433aoi.branch.sample.json holding a live one-dollar break.
//
// `git checkout -- samples/` did not put it back, and could not: A BRANCH FIXTURE IS UNTRACKED
// UNTIL IT IS COMMITTED, so the restore that recovered every other fixture stepped over the one
// that was broken. The next run then read a corrupted record as its baseline and STOPped — "the
// gate does not run clean on this record BEFORE anything was broken" — which is the right
// answer and is two steps later than the cause.
//
// So the original bytes go to disk BEFORE the break and are removed only after the digest
// proves the record restored. A run that finds one on startup restores from it and says so, in
// as many words, rather than beginning against an input somebody else broke.
const HELD_DIR = 'adapters/pdf/tmp/prover-held';
const heldPathFor = (p) => `${HELD_DIR}/${p.replace(/[\\/]/g, '__')}`;
mkdirSync(HELD_DIR, { recursive: true });
{
  const stale = readdirSync(HELD_DIR);
  for (const name of stale) {
    const held = `${HELD_DIR}/${name}`;
    const target = name.replace(/__/g, '/');
    writeFileSync(target, readFileSync(held));
    rmSync(held);
    console.log(`RESTORED FROM A KILLED RUN — ${target} was left holding a live break by a prover that did not reach its revert. Its original bytes were held at ${held} and have been put back.`);
  }
  if (stale.length) console.log(`  ${stale.length} record(s) restored before this run read anything.`);
}

const STEP_TRIPWIRES_LIVE_IN = 11;   // gate step 11 is where the arithmetic tripwires are checked
const FAILING = 'NO';
const PASSING = 'yes';
const SKIPPED = 'SKIPPED';

// THE ROLES WHOSE GATE RUN IS EXPECTED TO BE CLEAN, and therefore the records a break can be
// made in. `stress` and `negative` also gate clean, and they are deliberately NOT here: a
// stress record overflows rows off the page and a negative one drives floors, so the printed
// total a break would move is not the one the acceptance page prints. The two roles below are
// the two SATURATED portraits of the same filer, differing only in which branch of each printed
// conditional they take.
const BREAKABLE_ROLES = ['acceptance', 'branch', 'negative', 'stress'];

// ═══════════════════════════════════════════════════════════════════════════════════════
// AND A BREAK MUST NOT LAND IN A RECORD ANOTHER FIXTURE IS GENERATED FROM.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Breaking samples/433aoi.sample.json took the gate down at STEP 3, on five lines across two
// forms, and the message was about three OTHER files:
//
//   "samples/433aoi.pl-route.sample.json claims scratchpad/author-record-shape-fixtures.mjs as
//    its generator, and re-running it produces a different value for [vehicles]."
//
// That generator builds the three record-shape fixtures FROM the acceptance record, so while
// the acceptance record holds a break, three committed fixtures genuinely no longer match the
// generator they name. The assert is right and there is no declaration that makes it wrong: the
// files that drifted are not the file that was edited.
//
// SO THE RECORD IS CHOSEN, NOT TAKEN. Each line goes to the first record in preference order
// that puts it in class AND that nothing else is generated from. A generator names its input
// two ways and both are read: by PATH, and by ROLE through resolveFixture — which is [R-22]
// working correctly and is why a source-text scan for "samples/433aoi.sample.json" finds
// nothing while the dependency is real.
//
// `negative` and `stress` are in the list for exactly this: they are the records that put the
// opposite branch lines in class on a form whose acceptance record is a generator input. They
// are LAST because their printed totals are their own — a stress record overflows rows off the
// page, a negative one drives floors — so a break there proves the tripwire fires on the record
// it was made in, which is all a break proof ever claims.

/**
 * WHETHER A BREAK IN THIS RECORD IS SURVIVABLE, MEASURED RATHER THAN INFERRED.
 *
 * TWO STATIC DRAFTS GOT THIS WRONG IN OPPOSITE DIRECTIONS AND BOTH ARE WHY IT IS MEASURED NOW.
 * The first scanned generator sources for the record's PATH and missed every generator that
 * resolves its input by ROLE, which is [R-22] working correctly. The second added the role
 * reading and refused every record any generator could conceivably read — which took 433-B's
 * eleven lines and 433-B(OIC)'s three branch lines away from records that break perfectly well.
 *
 * WHAT ACTUALLY DECIDES IT is one line in adapters/pdf/assert-fixture-authorship.mjs: it holds
 * the whole of samples/ IN MEMORY, runs the generator, and restores. So a generator that WRITES
 * the record computes its output from its own data and never sees the break; a generator that
 * READS the record off disk sees it, produces different bytes, and the fixture it authors is
 * reported as drifted — a file the prover never touched.
 *
 * That distinction is a property of the generator's code, and inferring it from source text is
 * what failed twice. So the question is ASKED: a probe break goes into the record, the
 * authorship assert is run against the tree, and the record is safe if and only if it passes.
 * The probe is reverted from the record's own bytes and the restoration digest-checked before
 * anything else happens.
 */
const measureBreakSafety = (record, probeLine) => {
  const orig = readFileSync(record.path);
  const doc = JSON.parse(orig.toString('utf8'));
  const site = siteOf(doc, probeLine);
  if (!site) return { safe: false, why: `this file cannot find a cell for line ${probeLine.line} in ${record.path}, so it cannot probe it` };
  const good = site.get();
  site.set(String(Number(String(good).replace(/[$,\s]/g, '')) + 1));
  writeFileSync(heldPathFor(record.path), orig);
  writeFileSync(record.path, JSON.stringify(doc, null, 1) + '\n');
  const run = spawnSync(process.execPath, ['adapters/pdf/assert-fixture-authorship.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  writeFileSync(record.path, orig);
  if (sha(readFileSync(record.path)) !== sha(orig)) { console.error(`STOP — ${record.path} was NOT restored byte for byte after the safety probe.`); process.exit(2); }
  rmSync(heldPathFor(record.path));
  const drifted = [...new Set(String(run.stdout || '').split('\n').filter((l) => /CO-AUTHORSHIP UNDECLARED|DRIFT/.test(l))
    .map((l) => (/samples\/[A-Za-z0-9._-]+\.json/.exec(l) || [])[0]).filter(Boolean))];

  // THREE OUTCOMES, NOT TWO, AND THE MIDDLE ONE IS THE COMMON CASE.
  //
  //   pass                     nothing drifts. The record either names no generator, or names
  //                            one that ROUND-TRIPS it — 433-B's stress fixture is read by its
  //                            own generator, mutated in four groups and written back, so a
  //                            broken scalar it does not touch is reproduced exactly and the
  //                            file is still its generator's sole author. DECLARING a
  //                            co-authorship on such a record is a STOP in the other direction:
  //                            "a key in the declaration that regeneration REPRODUCES is as
  //                            much a STOP as a key regeneration misses".
  //   only this record drifts  the ordinary case: the generator writes the record from its own
  //                            data, the break is not reproduced, and `_co_authored_with_hand`
  //                            naming the broken key is exactly what the assert asks for.
  //   another record drifts    the break leaks into a file the prover never touched, and no
  //                            declaration on this record can fix a claim made by that one.
  const onlySelf = drifted.length > 0 && drifted.every((p) => p === record.path);
  return {
    safe: run.status === 0 || onlySelf,
    declare: onlySelf,
    why: run.status === 0
      ? 'a probe break in it left every fixture matching the generator it names — either it names none, or the generator round-trips it and reproduces the break. NO co-authorship is declared on it: a declared key regeneration reproduces is refused as loudly as one it misses.'
      : onlySelf
        ? 'a probe break in it drifts only from ITS OWN generator, which is what `_co_authored_with_hand` exists to declare. The break names the key it moved and the declaration is removed with it.'
        : `a probe break in it made ${drifted.filter((p) => p !== record.path).join(', ') || 'another fixture'} stop matching the generator it names — those files are generated by READING this one, and they drift while a break is held here`,
  };
};

const sha = (b) => createHash('sha256').update(b).digest('hex').toUpperCase();

// --- the records, DISCOVERED by declared role, never named -----------------------------------
const { rows, swept } = candidatesFor(FORM);
for (const r of rows) if (r.unreadable) { console.error(`STOP — ${r.path} will not parse: ${r.unreadable}. A fixture that cannot be read is not a fixture that is absent.`); process.exit(2); }
const records = rows.filter((r) => BREAKABLE_ROLES.includes(r.role))
  .sort((a, b) => BREAKABLE_ROLES.indexOf(a.role) - BREAKABLE_ROLES.indexOf(b.role));
console.log(`fixture sweep for ${FORM}: ${swept.dir}/ — ${swept.filter}; classified by ${swept.classifier}`);
console.log(`  breakable role(s) ${BREAKABLE_ROLES.join(', ')}: ${records.length} record(s)`);
for (const r of records) console.log(`    ${r.role.padEnd(10)} ${r.path}`);
if (!records.length) { console.error(`STOP — ${FORM} has no fixture in a breakable role. There is nothing to break a line in.`); process.exit(2); }

const bytes = new Map();   // path -> original Buffer
for (const r of records) bytes.set(r.path, readFileSync(r.path));
for (const r of records) console.log(`    sha256 ${sha(bytes.get(r.path))}  ${r.path}`);

// --- the declared lines, READ FROM THE TOTALS FILE, never listed here -------------------------
const totals = JSON.parse(readFileSync(`adapters/pdf/maps/${FORM}.totals.json`, 'utf8'));
const DECLARED = totals.totals.map((t) => ({ line: t.line, key: t.total_key, caption: t.caption }));
console.log('');
console.log(`declared total line(s) on ${FORM}: ${DECLARED.length}`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE FEEDER GRAPH AMONG THE DECLARED LINES, DERIVED FROM THE TOTALS FILE, NEVER TYPED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [FS-3] as amended: each other line carries the verdict it was DERIVED to read, and a line
// expected to FAIL must name a dependency derived from the tool's own declaration. Line Y
// depends on line X when X's `total_key` appears in one of Y's `feeders[].keys`.
//
// AND ONE MORE EDGE THAN A `keys` SCAN FINDS. A feeder can also name a GROUP and a COLUMN —
// `{ group: "4ac_vehicles", column: "quick_sale_equity" }` — which is how a total sums a
// repeatable table. Three of 433-B(OIC)'s declared lines ARE cells of exactly that column, so
// breaking "4a leased" moves line "4" through an edge no `keys` list mentions. A graph missing
// that edge would derive "expected yes" for a line the run correctly shows failing, and [FS-3]
// would report a step collapse where the dependency was simply not read.
const cellAddrOf = new Map();   // line -> { kind, ... } filled from the gate's own per-line result
const roundingOf = new Map();   // line -> the rounding_mode the gate reports for it, or null
const dependsOn = (yLine, x) => {
  const y = totals.totals.find((t) => t.line === yLine);
  for (const fd of (y?.feeders || [])) {
    if (Array.isArray(fd.keys) && x.key && fd.keys.includes(x.key)) return `${yLine} names ${x.key} among its own feeders in ${FORM}.totals.json`;
    // AND THE FEEDER'S OWN `row` IS PART OF THE EDGE. A group feeder WITHOUT a row is the whole
    // column, and every cell of it feeds the total. A group feeder WITH a row is ONE printed
    // row, and only that row's cell feeds it.
    //
    // The first draft ignored `row` and reported four false dependencies on 433-B(OIC), where
    // each vehicle's and each property's per-row total draws from its OWN row of
    // quick_sale_value: breaking 3a QSV was derived to move 3b, which reads from row 1 and
    // correctly did not move. [FS-3] then reported "the dependency the record derives is not
    // live" — the right answer to the record as written, and the record was wrong about the
    // graph rather than the run being wrong about the arithmetic.
    const addr = cellAddrOf.get(x.line);
    if (addr && addr.kind === 'cell' && fd.group === addr.group && fd.column === addr.column) {
      if (fd.row === undefined) return `${yLine} sums the whole column ${addr.group}.${addr.column} in ${FORM}.totals.json, and ${x.line} IS a cell of that column`;
      if (Number(fd.row) === addr.idx) return `${yLine} draws ${addr.group}[${addr.idx}].${addr.column} as one of its own operands in ${FORM}.totals.json, and that cell IS ${x.line}`;
    }
  }
  return null;
};

// --- the tool ---------------------------------------------------------------------------------
// THE GATE IS GIVEN THE RECORD'S PATH, AND THE PATH IS ONE THIS FILE DERIVED.
//
// `--role branch` stopped being answerable when `branch` became a SET: a record takes ONE side
// of each printed conditional, so the set carries one member per side and resolveFixture refuses
// a set role in as many words. What [R-22] forbids is a path WRITTEN DOWN — a fact nobody
// re-derives. Every path here comes out of candidatesFor() on this run, classified by the
// fixture's own declared role, which is the same resolution `--role` would have performed.
const gate = (path) => {
  const r = spawnSync(process.execPath, ['adapters/pdf/run-form-gate.mjs', FORM, path, '--saturated'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};
/** The step-11 row for one printed marker, verbatim, or '' if the step never printed one. */
const rowFor = (out, line) => out.split('\n').find((l) => new RegExp(`^\\s{2}${line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\|`).test(l)) || '';
/** The verdict in a step-11 row: the field after the third pipe. Absent is reported as absent. */
const verdictOf = (row) => {
  if (!row) return null;
  const parts = row.split('|');
  if (parts.length < 4) return null;
  return (parts[3].trim().split(/\s+/)[0]) || null;
};
/** The step the gate died at, from the gate's own verdict line. null when it did not say. */
const stepOf = (out) => {
  const m = /GATE FAILED at step (\d+)\/(\d+)/.exec(out);
  return m ? Number(m[1]) : null;
};
const tripwireReportPath = (out) => {
  const line = out.split('\n').find((l) => l.includes('per-line result written to '));
  return line ? line.split('per-line result written to ')[1].split(' ')[0].trim() : null;
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// BASELINE: WHICH RECORD PUTS EACH DECLARED LINE IN CLASS
// ═══════════════════════════════════════════════════════════════════════════════════════
const inClassOn = new Map();   // line -> [every record path that puts it in class]
const inClass = new Map();     // line -> the record path chosen for it, filled below
const comparisonOf = new Map();// line -> the comparison the gate declares for it (equals / at_most / ...)
const skipWhy = new Map();     // `${path}|${line}` -> the predicate that was false
const baseline = new Map();    // record path -> { verdictByLine }
console.log('');
for (const r of records) {
  const run = gate(r.path);
  if (run.status !== 0) { console.error(`STOP — the gate does not run clean on ${r.path} (role ${r.role}, exit ${run.status}) BEFORE anything was broken. A proof against a record that already fails proves nothing.`); process.exit(2); }
  const tp = tripwireReportPath(run.out);
  if (!tp || !existsSync(tp)) { console.error(`STOP — the clean run on ${r.path} wrote no per-line result, so this file cannot say which lines it put in class.`); process.exit(2); }
  const rep = JSON.parse(readFileSync(tp, 'utf8'));
  const byLine = new Map();
  for (const l of rep.lines) {
    byLine.set(l.line, l.verdict);
    if (l.verdict === 'skipped') skipWhy.set(`${r.path}|${l.line}`, l.why || '(the run stated no reason)');
    // THE LINE'S OWN ROUNDING, from the clean run, before anything is broken. It is what
    // decides the size of the break: a nearest-dollar line rounds a one-cent break away and
    // correctly reports yes, and a record of that is a record of nothing.
    if (!roundingOf.has(l.line)) roundingOf.set(l.line, l.rounding_mode ?? null);
    if (l.verdict === 'verified') {
      // EVERY record that puts the line in class is recorded, and the choice is made after all
      // of them are known. Taking the first would take whichever record sorts first, which is
      // how five lines came to be broken in a record three other fixtures are generated from.
      if (!inClassOn.has(l.line)) inClassOn.set(l.line, []);
      inClassOn.get(l.line).push(r.path);
      if (!cellAddrOf.has(l.line)) {
        const m = /^cell:([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)#(\d+)$/.exec(String(l.addr || ''));
        cellAddrOf.set(l.line, m ? { kind: 'cell', group: m[1], column: m[2], idx: Number(m[3]) } : { kind: 'key' });
      }
      if (!comparisonOf.has(l.line)) comparisonOf.set(l.line, l.comparison ?? null);
    }
  }
  baseline.set(r.path, byLine);
  const verified = rep.lines.filter((l) => l.verdict === 'verified').length;
  const skipped = rep.lines.filter((l) => l.verdict === 'skipped').length;
  console.log(`baseline ${r.role.padEnd(10)} ${r.path}  —  ${verified} verified, ${skipped} skipped, of ${rep.lines.length}`);
}
const homeless = DECLARED.filter((d) => !(inClassOn.get(d.line) || []).length);
if (homeless.length) {
  console.error(`STOP — ${homeless.length} declared line(s) are in class on NO record in a breakable role: ${homeless.map((d) => d.line).join(', ')}.`);
  console.error('  A line no record puts in class cannot be shown to refuse: breaking its total does nothing, because the step never asks it.');
  process.exit(2);
}
console.log(`every one of the ${DECLARED.length} declared line(s) is in class on some record.`);

// --- where a line's figure lives in its record ------------------------------------------------
const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${FORM}.map.json`, 'utf8'));
const siteOf = (doc, d) => {
  const a = cellAddrOf.get(d.line);
  if (a && a.kind === 'cell') {
    const src = mapDoc.groups?.[a.group]?.source;
    const row = (doc[src] || [])[a.idx];
    if (!row || typeof row !== 'object') return null;
    return { get: () => row[a.column], set: (v) => { row[a.column] = v; }, name: `${src}[${a.idx}].${a.column}` };
  }
  if (!d.key) return null;
  if (!(d.key in doc)) return null;
  return { get: () => doc[d.key], set: (v) => { doc[d.key] = v; }, name: d.key };
};

// --- IS A BREAK IN THIS RECORD SURVIVABLE? ASKED, ONCE PER RECORD, BEFORE ANYTHING IS PROVED.
console.log('');
const SAFE = new Map();
for (const r of records) {
  const probe = DECLARED.find((d) => (inClassOn.get(d.line) || []).includes(r.path));
  if (!probe) { SAFE.set(r.path, { safe: false, why: 'no declared line is in class on it, so it is never chosen and never probed' }); continue; }
  const v = measureBreakSafety(r, probe);
  SAFE.set(r.path, v);
  console.log(`break-safety ${r.role.padEnd(10)} ${r.path}  —  ${v.safe ? 'SAFE' : 'UNSAFE'}: ${v.why}`);
}

// --- CHOOSE the record, in preference order, taking only ones a break survives in. A line
//     whose every home is unsafe is a STOP naming it: the run would die at gate step 3 on files
//     it never touched, and a proof cannot be made of it here without saying so out loud.
const trapped = [];
for (const d of DECLARED) {
  const homes = inClassOn.get(d.line);
  const free = homes.filter((p) => SAFE.get(p)?.safe);
  if (!free.length) { trapped.push({ line: d.line, homes }); continue; }
  inClass.set(d.line, free[0]);
}
if (trapped.length) {
  for (const t of trapped)
    console.error(`STOP — line ${t.line} is in class only on ${t.homes.join(', ')}, and a break does not survive in any of them: ${t.homes.map((p) => `${p} — ${SAFE.get(p)?.why}`).join('; ')}`);
  console.error('  Breaking such a record takes the gate down at STEP 3, on OTHER files, which genuinely stop matching the generator they name while the break is held.');
  console.error('  Give the line a record of its own: a branch, negative or stress fixture that puts it in class and that nothing reads off disk.');
  process.exit(2);
}
const byRecord = new Map();
for (const [line, path] of inClass) { if (!byRecord.has(path)) byRecord.set(path, []); byRecord.get(path).push(line); }
for (const [path, lines] of byRecord) console.log(`  ${lines.length} line(s) will be broken in ${path}`);

console.log('');
console.log('derived feeder graph among the declared lines:');
for (const d of DECLARED) {
  const fed = DECLARED.filter((x) => x.line !== d.line && dependsOn(x.line, d));
  console.log(`  breaking ${String(d.line).padEnd(28)} must also move: ${fed.length ? fed.map((x) => x.line).join(', ') : '(nothing — no declared line is fed by it)'}`);
}


// ═══════════════════════════════════════════════════════════════════════════════════════
// THE BREAKS
// ═══════════════════════════════════════════════════════════════════════════════════════
const breaks = [];
for (const d of DECLARED) {
  const path = inClass.get(d.line);
  const rec = records.find((r) => r.path === path);
  const before = bytes.get(path);
  const doc = JSON.parse(before.toString('utf8'));
  const site = siteOf(doc, d);
  if (!site) { console.error(`STOP — ${path} carries no cell for line ${d.line} (total_key ${d.key}), so it cannot be broken in it.`); process.exit(2); }
  const good = site.get();
  if (good === undefined) { console.error(`STOP — ${path} has no value at ${site.name} for line ${d.line}.`); process.exit(2); }
  const decimals = (() => { const s = String(good); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; })();
  // THE SMALLEST UNIT THE BREAK HAS TO SURVIVE — which is not this line's own unit alone.
  //
  // Derived from this line's `rounding_mode` AND from that of every line the feeder graph says
  // must move with it. 433-A(OIC)'s line 5 prints to the cent and Box A, which sums it, rounds
  // to the DOLLAR: a one-cent break made 5 read NO and left Box A correctly reading yes, and
  // [FS-3] reported the derived dependency as not live. The dependency was live; the break was
  // below the resolution of the line it had to propagate to. So the unit is the COARSEST among
  // the broken line and its equality-dependents, and the record says which line forced it.
  const roundsTo = (line) => { const m = roundingOf.get(line); return typeof m === 'string' && /dollar/i.test(m); };
  const strictDeps = DECLARED.filter((x) => x.line !== d.line && dependsOn(x.line, d) && comparisonOf.get(x.line) === 'equals');
  const coarse = [d.line, ...strictDeps.map((x) => x.line)].filter(roundsTo);
  const mode = roundingOf.get(d.line);
  const rounds = coarse.length > 0;
  const step = rounds ? 1 : 0.01;
  const stepWhy = rounds
    ? `${coarse.join(', ')} ${coarse.length === 1 ? 'is printed' : 'are printed'} to the whole dollar (rounding_mode ${JSON.stringify(roundingOf.get(coarse[0]))}), so one cent is BELOW the unit ${coarse.length === 1 ? 'it prints' : 'they print'} and a one-cent break rounds away${coarse.includes(d.line) ? '' : ' before it reaches the total this line feeds'}. One dollar is the smallest discrepancy this break has to survive.`
    : `the gate reports rounding_mode ${JSON.stringify(mode)} for this line and for every line derived to move with it, so all of them print to the cent and one cent is the smallest discrepancy expressible.`;
  const bad = (Number(String(good).replace(/[$,\s]/g, '')) + step).toFixed(rounds ? decimals : Math.max(decimals, 2));
  site.set(bad);

  // THE BREAK DECLARES ITSELF, but only where a declaration is a thing this record can make.
  // assert-fixture-authorship.mjs at gate step 3 refuses a hand edit to a fixture that NAMES A
  // GENERATOR and does not enumerate it — which is exactly what made the slice-2 proof vacuous.
  // A record naming no generator is outside that assert entirely, and adding the declaration to
  // one would be a co-authorship claim about a generator that does not exist. The existing
  // enumeration is MERGED rather than replaced: 433-B(OIC)'s acceptance record already declares
  // fifteen hand-authored keys, and overwriting them would make the assert refuse the record for
  // the keys it no longer names.
  // WHETHER TO DECLARE IS MEASURED, NOT READ OFF `_generated_by`. A record whose generator
  // round-trips it reproduces the break, so the generator is still its sole author and a
  // co-authorship declaration on it is refused. The safety probe already established which
  // of the two this record is.
  let declares = SAFE.get(path).declare === true;
  // THE ORIGINAL BYTES GO TO DISK FIRST. See the header: a killed run left a live break in an
  // untracked fixture and nothing in the tree could put it back. The break itself is written
  // below, by `writeWith`, once the declaration it needs has been derived.
  writeFileSync(heldPathFor(path), before);
  console.log('');
  console.log(`BROKEN in ${path}: ${site.name}  ${good} -> ${bad}   (${rounds ? 'one dollar' : 'one cent'}, printed marker ${d.line})`);

  // THE CO-AUTHORSHIP DECLARATION NAMES EXACTLY WHAT REGENERATION FINDS, AND IS DERIVED FROM IT.
  //
  // TWO GUESSES AT THIS WERE BOTH WRONG, IN OPPOSITE DIRECTIONS, AND THE SAME RECORD REFUSED
  // BOTH. 433-B's stress record is READ by its own generator and written back, so:
  //
  //   no declaration at all      refused for 24h, 25c, 36, 49 and 50 — the generator RECOMPUTES
  //                              those five, so the break is not reproduced and is undeclared;
  //   the obvious declaration    refused too, as CO-AUTHORSHIP STALE — it named `_TRIPWIRE_PROOF`
  //                              and `_co_authored_with_hand` beside the broken key, and the
  //                              generator passes those two straight through, so it reproduces
  //                              them exactly. "A declaration for a divergence that has gone
  //                              away reads exactly like one for a live divergence."
  //
  // Both refusals are correct and neither can be predicted from the record's own text: it
  // depends on which keys that particular generator computes and which it carries. So the
  // answer is READ OFF THE ASSERT'S OWN MESSAGE — it names the keys — and the declaration is
  // rewritten to that set until the assert stops objecting. Three attempts, then a STOP: a
  // declaration that will not settle is a state to report, not to iterate over forever.
  const AUTHORSHIP = () => spawnSync(process.execPath, ['adapters/pdf/assert-fixture-authorship.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const keysFrom = (out, kind) => {
    const line = out.split('\n').find((l) => l.includes(kind) && l.includes(path));
    if (!line) return null;
    const m = /\[([^\]]*)\]/.exec(line);
    return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : [];
  };
  const writeWith = (keys) => {
    const doc2 = JSON.parse(before.toString('utf8'));
    siteOf(doc2, d).set(bad);
    if (keys && keys.length) {
      doc2._TRIPWIRE_PROOF = `TEMPORARY. ${site.name} is ${bad} where the printed operands of line ${d.line} give ${good}. ${rounds ? 'One dollar' : 'One cent'} — ${stepWhy} Reverted by scratchpad/prove-tripwires-fire.mjs in the same run that wrote it.`;
      const decl = { ...(JSON.parse(before.toString('utf8'))._co_authored_with_hand || {}) };
      for (const k of keys) decl[k] = k === '_TRIPWIRE_PROOF'
        ? 'The sentence recording the break, written beside it and removed with it.'
        : k === '_co_authored_with_hand'
          ? 'THIS DECLARATION ITSELF. It exists only while the break does.'
          : `A DELIBERATE BREAK OF ${rounds ? 'ONE DOLLAR' : 'ONE CENT'}, held only for the length of one gate run. The generator writes ${good} at ${site.name}, the figure the printed operands of line ${d.line} give; this file writes ${bad} so the arithmetic tripwire on ${d.line} says ${FAILING}. ${stepWhy} Reverted from the record's own bytes in the same run, and the restoration verified by SHA-256.`;
      doc2._co_authored_with_hand = decl;
    }
    writeFileSync(path, JSON.stringify(doc2, null, 1) + '\n');
  };
  let declaredKeys = declares ? [site.name.includes('[') ? site.name.split('[')[0] : site.name, '_TRIPWIRE_PROOF', '_co_authored_with_hand'] : null;
  writeWith(declaredKeys);
  for (let attempt = 0; attempt < 3; attempt++) {
    const a = AUTHORSHIP();
    if (a.status === 0) break;
    // BOTH STREAMS. assert-fixture-authorship.mjs prints its TABLE to stdout and its PROBLEMS
    // to stderr, so a reader that searched stdout alone found no objection on a run that was
    // objecting loudly — and this loop fell straight through, wrote the break undeclared, and
    // the gate died at step 3 exactly as before with nothing in the log to say why.
    const said = `${a.stdout || ''}${a.stderr || ''}`;
    const undeclared = keysFrom(said, 'CO-AUTHORSHIP UNDECLARED');
    const stale = keysFrom(said, 'CO-AUTHORSHIP STALE');
    if (undeclared === null && stale === null) break;   // the objection is about another file; the gate will say so
    if (undeclared) declaredKeys = undeclared;
    else declaredKeys = (declaredKeys || []).filter((k) => !stale.includes(k));
    console.log(`  authorship attempt ${attempt + 1}: declaring ${declaredKeys.length ? declaredKeys.join(', ') : '(nothing)'} — derived from the assert's own message`);
    writeWith(declaredKeys.length ? declaredKeys : null);
    if (attempt === 2) { console.error(`STOP — the co-authorship declaration for line ${d.line} in ${path} did not settle in 3 attempts.`); writeFileSync(path, before); process.exit(2); }
  }
  declares = !!(declaredKeys && declaredKeys.length);
  const run = gate(path);
  const brokenRow = rowFor(run.out, d.line);

  // WHICH LINES THIS RUN CLAMPED AT THEIR OWN DECLARED FLOOR, read from the run's own per-line
  // result. A FLOOR ABSORBS A SMALL BREAK, and that is a third reason a live dependency does not
  // move — beside the dependent rounding coarser than the break, and the dependent's comparison
  // being an inequality the break relaxes.
  //
  // 433-A(OIC) line 6b is "vehicle 1 less allowance", floored at 0. On the flipped record
  // vehicle 1 is LEASED, so 6a leased prints the constant 0.00; subtract the allowance and the
  // sum is already below the floor. Breaking 6a leased by a cent leaves it below the floor, 6b
  // still prints 0, and it reads yes — correctly. The dependency is live and the printed figure
  // is decided by the floor rather than by the operand.
  const flooredNow = new Map();
  {
    const tp = tripwireReportPath(run.out);
    if (tp && existsSync(tp)) for (const l of JSON.parse(readFileSync(tp, 'utf8')).lines) flooredNow.set(l.line, l.floored === true);
  }

  const others = DECLARED.filter((x) => x.line !== d.line).map((x) => {
    const row = rowFor(run.out, x.line);
    const v = verdictOf(row);
    const fed = dependsOn(x.line, d);
    const wasSkipped = baseline.get(path).get(x.line) === 'skipped';
    if (wasSkipped) return {
      line: x.line, verdict: v, verbatim: row.trim(), expected: SKIPPED,
      not_in_class_because: `on ${path} the step never asks ${x.line}: ${skipWhy.get(`${path}|${x.line}`)}. Read from the clean run's own per-line result on this record, before anything was broken.`,
    };
    // A FED LINE IS EXPECTED TO FAIL ONLY WHERE ITS OWN COMPARISON IS AN EQUALITY.
    //
    // 433-B(OIC)'s page-5 offer row draws Box A and is declared `at_most`, not `equals` — it
    // asserts the offer is no MORE than the available equity. Breaking Box A UPWARD raises the
    // ceiling and the inequality goes on holding, correctly. The first draft derived "must
    // fail" from the feeder graph alone and [FS-3] reported a live dependency as dead.
    //
    // The comparison is read from the gate's own per-line result on the clean run, so this is
    // still the tool's own declaration deciding — which is what the amendment requires — and
    // the direction is stated rather than the line being quietly dropped from the list.
    const strict = comparisonOf.get(x.line) === 'equals';
    if (fed && !strict) return {
      line: x.line, verdict: v, verbatim: row.trim(), expected: PASSING,
      fed_but_not_expected_to_fail: `${fed}. Its comparison on this tool is ${JSON.stringify(comparisonOf.get(x.line))} rather than an equality, and this break moves ${d.line} UPWARD — which relaxes that inequality rather than violating it. Derived from the comparison the gate itself reports for ${x.line}, not asserted here.`,
    };
    if (fed && strict && flooredNow.get(x.line) === true) return {
      line: x.line, verdict: v, verbatim: row.trim(), expected: PASSING,
      fed_but_not_expected_to_fail: `${fed}. THIS RUN CLAMPED ${x.line} AT ITS OWN DECLARED FLOOR — the gate's per-line result for this very run reports it floored — so its printed figure is decided by the floor and not by the operand, and a break of ${rounds ? 'one dollar' : 'one cent'} that leaves the sum below that floor cannot move it. Read from the run's own output, not asserted here.`,
    };
    return {
      line: x.line, verdict: v, verbatim: row.trim(),
      expected: fed ? FAILING : PASSING,
      ...(fed ? { depends_on_the_broken_line: `${fed}, so a break of ${rounds ? 'one dollar' : 'one cent'} in ${d.line} must move ${x.line} too` } : {}),
    };
  });
  console.log(`  gate exit ${run.status}, failed at step ${stepOf(run.out)}`);
  console.log(`  ${brokenRow.trim() || '(the step printed no row for this line)'}`);
  const movedToo = others.filter((o) => o.expected === FAILING);
  if (movedToo.length) console.log(`  derived to move with it: ${movedToo.map((o) => `${o.line} (${o.verdict})`).join(', ')}`);

  // --- restore, and prove it ---
  writeFileSync(path, before);
  const afterSha = sha(readFileSync(path));
  if (afterSha !== sha(before)) { console.error(`STOP — ${path} was NOT restored byte for byte after breaking ${site.name}.`); process.exit(2); }
  rmSync(heldPathFor(path));
  console.log(`  REVERTED: sha256 ${afterSha} — byte-for-byte identical to the file read before the break.`);

  breaks.push({
    declaration: `arithmetic tripwire | ${FORM} | ${d.line}`,
    line: d.line,
    caption: d.caption,
    record: path,
    record_role: rec.role,
    broke: { key: site.name, from: String(good), to: String(bad) },
    break_size: rounds ? '1.00' : '0.01',
    break_size_derived_from: stepWhy,
    rounding_mode: mode,
    tool: `node adapters/pdf/run-form-gate.mjs ${FORM} ${path} --saturated`,
    tool_exit: run.status,
    failed_at_step: stepOf(run.out),
    step_the_declaration_lives_in: STEP_TRIPWIRES_LIVE_IN,
    broken_line_verbatim: brokenRow.trim(),
    broken_line_verdict: verdictOf(brokenRow),
    failing_verdict: FAILING,
    passing_verdict: PASSING,
    skipped_verdict: SKIPPED,
    other_declared_lines: others,
    restored_digest_matches: afterSha === sha(before),
    clean_after_revert: null,   // filled below, from the runs that follow every revert
  });
}

// --- IT STOPS FIRING. One clean run per breakable record after the last revert, and it applies
//     to all of them: every break was reverted and digest-proved individually, so the records
//     the gate reads here are byte-identical to the ones it read before the first break.
const cleanAgain = new Map();
console.log('');
for (const r of records) {
  const again = gate(r.path);
  const line = (again.out.split('\n').find((l) => /^GATE/.test(l)) || '(no verdict line)').trim();
  cleanAgain.set(r.path, { exit: again.status, verdict_line: line });
  console.log(`gate after every revert, ${r.role.padEnd(10)} ${r.path}: exit ${again.status} — ${line}`);
}
for (const b of breaks) b.clean_after_revert = cleanAgain.get(b.record).exit === 0;

const path = writeRecord(`${RECORD_DIR}/${FORM}.tripwires.json`, {
  form: FORM,
  _generated_by: 'scratchpad/prove-tripwires-fire.mjs',
  tool_under_test: `adapters/pdf/run-form-gate.mjs ${FORM} <the record chosen for the line> --saturated`,
  records_swept: `${swept.dir}/ — ${swept.filter}; classified by ${swept.classifier}; breakable roles ${BREAKABLE_ROLES.join(', ')} ([R-22]: resolved from the tree, never a named path)`,
  records: records.map((r) => ({ path: r.path, role: r.role, sha256: sha(bytes.get(r.path)), lines_broken_in_it: (byRecord.get(r.path) || []).length })),
  declarations_on_this_tool: DECLARED.length,
  declarations_source: `adapters/pdf/maps/${FORM}.totals.json — the totals list, read, not typed`,
  clean_run_after_every_revert: Object.fromEntries(cleanAgain),
  breaks,
});
console.log('');
console.log(`record written: ${path}`);
console.log(`  ${breaks.length} break(s), one per declared line, each recording the step, the line and every other line's verdict.`);
console.log('  WHETHER THAT IS A PROOF IS NOT THIS FILE\'S TO SAY: run node adapters/pdf/assert-firing-proofs.mjs');
