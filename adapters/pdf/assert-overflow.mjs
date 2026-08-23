// EVERY GROUP OVER-FED, EVERY DROP LOGGED, EVERY DROPPED ROW ABSENT FROM THE PAGE.
//
//   node adapters/pdf/assert-overflow.mjs <form> <over-max fixture.json>
//   exit 0 = the fixture is a real over-max fixture and every drop it forces is both named
//            in the engine's log and provably not printed
//   exit 2 = any of that could not be established, INCLUDING because it could not be read
//
// WHY THIS EXISTS AND WHY A SATURATED FIXTURE CANNOT REPLACE IT
// ------------------------------------------------------------
// A saturated acceptance fixture fills every printed slot of every group EXACTLY to max,
// because that is what saturation means. So it can never overflow one. On 433-F that showed
// up as 0 of 8 declared overflow behaviours exercised, and the reason was structural rather
// than an oversight: the two properties are in direct opposition and one fixture cannot hold
// both. Hence a second fixture per form whose whole job is to run every group one record past
// its last printed slot.
//
// THE DROP IS BY DESIGN. The fill engines log a row past the last slot and drop it, rather
// than throwing, because a taxpayer with five bank accounts and a form that prints four still
// has to be able to file. What is NOT by design is a drop nobody is told about, or a drop
// that leaks: a row that overwrites an earlier one, or a row written into a slot the map
// never declared. So this tool asks three separate questions and reports them separately.
//
// THREE QUESTIONS, THREE FAILURES:
//
//   1  IS THIS FIXTURE ACTUALLY OVER-MAX?  Every group declared in the map must carry at
//      least one record beyond its printed slot count. A fixture that quietly stopped being
//      over-max — because a group gained a slot, or the fixture was edited — would sail
//      through questions 2 and 3 with nothing to check, and report success for a run that
//      exercised nothing. That is the vacuous-guard shape this repo keeps finding, so the
//      emptiness of the check is itself the first failure.
//
//   2  DOES THE LOG NAME EVERY DROP, AND ONLY THE DROPS?  Set equality, both directions.
//      A missing entry is a silent drop. An extra entry is the engine dropping a row the map
//      says it had room for.
//
//   3  IS THE DROPPED ROW ACTUALLY ABSENT FROM THE PAGE?  The log is the engine's own account
//      of what it did, and a log is not evidence of behaviour — it is evidence of what the
//      code says about its behaviour, which is the whole subject of [N-05]. So each dropped
//      row's distinguishing value is looked for in every field of the FILLED PDF and must not
//      be there. That is read off the artefact, and the log is the independent side.
//
// AND THE DISTINGUISHING VALUE IS DERIVED, NOT AGREED IN ADVANCE. It is the first BOUND,
// non-numeric text column of that row, read from the map's own slot declaration — not a
// marker string this tool and the fixture generator agreed on between themselves, which
// would make the absence proof a check on the agreement rather than on the form. A dropped
// row with no such value cannot have its absence proved and is a STOP, never a pass.

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { PDFDocument, PDFTextField } from 'pdf-lib';
import { resolveFixture, reportResolution } from './resolve-fixture.mjs';
import { rx } from './regex-self-assert.mjs';
import { examined } from './examined.mjs';

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE ENGINE LOG READER, AND THE SIX QUESTIONS IT IS ASKED ON EVERY RUN
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A REPAIRED INSTRUMENT IS A NEW INSTRUMENT. This reader was `.find()` over the output lines
// and therefore saw only the FIRST line beginning "OVERFLOW"; fill-433b.mjs printed one line
// per drop and two of its three drops were reported UNLOGGED by the tool whose entire purpose
// is to catch a drop nobody is told about. Nothing had ever asked this reader a question whose
// answer was known in advance, which is why a defect this size lived in one expression.
//
// So it is a function now, and `--canary` asks it six.
export const loggedIds = (out) => {
  const logLines = String(out).split('\n').filter((l) => /^OVERFLOW\b/.test(l.trim()));
  const ids = [...new Set(logLines.flatMap((l) => [...l.matchAll(/([A-Za-z0-9_]+)\[(\d+)\]/g)].map((m) => `${m[1]}[${m[2]}]`)))];
  return { logLines, ids };
};

// EACH CASE IS A SHAPE AN ENGINE IN THIS TREE EITHER PRINTS OR COULD PRINT, and the two that
// matter most are (b) and (c): (b) is the shape that produced the defect, and (c) is the shape
// the repaired fill-433b.mjs prints — a header line naming every drop plus an INDENTED detail
// line per drop, which must contribute nothing extra because it does not open with the word.
export const logReaderCanary = () => {
  const cases = [
    ['a  one line naming three drops (433-A / 433-A(OIC) shape)',
      'OVERFLOW (dropped, form has no slot): g[0], g[1], g[2]', ['g[0]', 'g[1]', 'g[2]']],
    ['b  ONE LINE PER DROP — the shape that produced the defect',
      'OVERFLOW g[0]\nOVERFLOW g[1]\nOVERFLOW g[2]', ['g[0]', 'g[1]', 'g[2]']],
    ['c  header line plus an indented detail line per drop (fill-433b.mjs today)',
      'OVERFLOW DROPPED g[0], g[1]\n    dropped g[0]: past the last slot\n    dropped g[1]: past the last slot', ['g[0]', 'g[1]']],
    ['d  a dropped row whose own TEXT contains the word, mid-line',
      'fill 433-B — 4 cells\n  wrote name=OVERFLOW TEST LLC g[9] into slot 0', []],
    ['e  no overflow at all', 'fill 433-F — 12 cells, 0 dropped', []],
    ['f  the same id named on two lines is ONE drop, not two',
      'OVERFLOW g[0]\nOVERFLOW g[0]', ['g[0]']],
  ];
  const dead = [];
  for (const [name, input, want] of cases) {
    const got = loggedIds(input).ids;
    if (JSON.stringify(got) !== JSON.stringify(want))
      dead.push(`CANARY DEAD  ${name}: reader returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  }
  return { cases: cases.length, dead };
};



// THE OVER-MAX FIXTURE IS RESOLVED FROM THE FORM ID, exactly as the gate's is: a path in an
// npm script is a fact nobody re-derives, and `npm run gate:433boi` naming a one-page record
// against a three-page map is what that costs. A path may still be given and is then reported
// as NAMED rather than resolved.
const _argv = process.argv.slice(2);
const [form, namedFixture] = _argv.filter((a, i) => !a.startsWith('--') && _argv[i - 1] !== '--role');
if (!form) {
  console.error('usage: node adapters/pdf/assert-overflow.mjs <form> [over-max fixture.json]');
  console.error('  With no path, the fixture declaring _fixture.role "stress" is resolved from samples/.');
  process.exit(2);
}
let fixturePath = namedFixture;
if (!fixturePath) {
  const res = resolveFixture(form, 'stress');
  if (!res.path) { reportResolution(res); process.exit(2); }
  fixturePath = res.path;
  console.log(`assert-overflow: resolved the stress fixture for ${form} -> ${fixturePath}`);
}

const mapPath = `adapters/pdf/maps/${form}.map.json`;
for (const p of [mapPath, fixturePath, `adapters/pdf/fill-${form}.mjs`]) {
  if (!existsSync(p)) { console.error(`STOP — ${p} does not exist. This tool proves nothing about ${form} and says so rather than passing.`); process.exit(2); }
}
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const rec = JSON.parse(readFileSync(fixturePath, 'utf8'));

const NUMERIC = rx('RX-AO-01', /^[\s$]*-?[\d,]+(\.\d+)?[\s%]*$/, {
  why: 'a cell whose whole content reads as a number, so an over-max drop is told from a truncated value',
  matches: ['1,234.56', ' $ 42 ', '-7'],
  rejects: ['1,234.56x', 'd', 'twelve'],
  captures: [['1,234.56', ['.56']]],
});
const groups = Object.entries(map.groups || {});
if (!groups.length) { console.error(`STOP — ${mapPath} declares no groups. There is no overflow behaviour on this form to assert, and an empty assertion is not a pass.`); process.exit(2); }

// THE CANARY RUNS BEFORE ANY QUESTION IS ASKED OF A REAL FORM. A reader that cannot read is
// indistinguishable from a form with nothing to report, and that indistinguishability is the
// whole defect this file was repaired for.
const canary = logReaderCanary();
if (canary.dead.length) {
  console.error(`STOP — the engine-log reader failed ${canary.dead.length} of its own ${canary.cases} canary case(s). Nothing this tool says about ${form} can be believed until it can read a log whose answer is known.`);
  canary.dead.forEach((d) => console.error(`  ${d}`));
  process.exit(2);
}

console.log(`assert-overflow ${form} ${fixturePath}`);
console.log(`  log reader: ${canary.cases} canary case(s) live — one line for all, one line per drop, header plus indented detail, a row whose own text says OVERFLOW, no overflow, and the same id twice`);
console.log(`  ${groups.length} declared group(s) in ${mapPath}`);
examined('assert-overflow', form, groups.length, 'declared-groups');

// ─── 1. IS THIS FIXTURE ACTUALLY OVER-MAX? ────────────────────────────────────────────────
const problems = [];
const expected = [];      // { group, index, value } — one per row the map says has no slot
console.log('');
console.log('  GROUP                          slots  rows  drops  distinguishing value of each dropped row');
for (const [g, d] of groups) {
  const src = d.source || d.array || g;
  const max = d.max ?? (d.slots || []).length;
  const arr = rec[src];
  if (!Array.isArray(arr)) {
    problems.push(`NOT OVER-MAX  ${g}: the fixture carries no array at "${src}", so this group drops nothing and this run proves nothing about its declared overflow.`);
    console.log(`  ${g.padEnd(30)} ${String(max).padStart(5)}  ${'-'.padStart(4)}  ${'-'.padStart(5)}  (no array at "${src}")`);
    continue;
  }
  if (arr.length <= max) {
    problems.push(`NOT OVER-MAX  ${g}: ${arr.length} row(s) into ${max} printed slot(s). An over-max fixture must run EVERY group at least one record past its last slot; this one does not, so questions 2 and 3 have nothing to check here.`);
  }
  // The distinguishing value comes from the MAP's bound columns for the LAST slot. Two slot
  // shapes exist in this tree — nested under `text` (433-A, 433-A(OIC)) and flat column ->
  // target (433-F) — and both are read rather than assumed.
  const lastSlot = (d.slots || [])[(d.slots || []).length - 1] || {};
  const boundCols = lastSlot.text || lastSlot;
  const cols = Object.keys(boundCols).filter(k => typeof boundCols[k] === 'string' && boundCols[k].startsWith('topmostSubform[0]'));
  const marks = [];
  for (let i = max; i < arr.length; i++) {
    const row = arr[i] || {};
    const col = cols.find(c => typeof row[c] === 'string' && row[c].trim() !== '' && !NUMERIC.test(row[c]));
    if (!col) {
      problems.push(`UNPROVABLE    ${g}[${i}]: no bound, non-numeric text column carries a value on this dropped row, so its absence from the page cannot be looked for. A drop this tool cannot check is reported, never passed.`);
      expected.push({ group: g, index: i, value: null, col: null });
      marks.push(`[${i}] (nothing to look for)`);
      continue;
    }
    expected.push({ group: g, index: i, value: row[col], col });
    marks.push(`[${i}] ${col}=${JSON.stringify(row[col].slice(0, 40))}`);
  }
  console.log(`  ${g.padEnd(30)} ${String(max).padStart(5)}  ${String(arr.length).padStart(4)}  ${String(Math.max(0, arr.length - max)).padStart(5)}  ${marks.join('  ') || '(none)'}`);
}

// ─── 2. DOES THE LOG NAME EVERY DROP, AND ONLY THE DROPS? ─────────────────────────────────
const run = spawnSync(process.execPath, [`adapters/pdf/fill-${form}.mjs`, fixturePath], { encoding: 'utf8' });
const out = `${run.stdout || ''}${run.stderr || ''}`;
if (run.status !== 0) {
  console.error('');
  console.error(`STOP — fill-${form}.mjs exited ${run.status}. Nothing downstream of the fill can be asserted, so this is a failure and not a skip. Its output:`);
  console.error(out.split('\n').map(l => `    ${l}`).join('\n'));
  process.exit(2);
}
// EVERY LINE THAT OPENS "OVERFLOW", NOT THE FIRST ONE.
//
// This read was `out.split('\n').find(...)` — the FIRST such line and no other — and the
// convention it silently required, without ever saying so, was "one line naming every drop".
// fill-433b.mjs logged a line PER DROP, which is a perfectly reasonable thing for an engine
// to do, and two of its three drops were therefore reported UNLOGGED: a drop nobody is told
// about, which is the exact failure this tool exists for, manufactured by the tool out of the
// engine that was telling it.
//
// THE FIRST REPAIR CHANGED THE ENGINE AND LEFT THE READER, so the convention lived only in a
// comment inside fill-433b.mjs and the next engine written would break it again. THE FIX
// BELONGS IN THE READER, because the reader is where the assumption was. Every line whose
// trimmed form opens with the word OVERFLOW is collected and the ids are UNIONED across all
// of them, so one-line-per-drop, one-line-for-all and any mixture of the two read the same.
// Anchored on the line START, as before, so a row whose own text contains the word OVERFLOW —
// which the acceptance fixtures' dropped rows deliberately do — cannot be mistaken for the log.
//
// WHAT IS DELIBERATELY NOT COUNTED A SECOND TIME: an indented detail line. fill-433b.mjs
// prints "    dropped payment_processors[2]: past the last printed slot" beneath its header
// line, and those do not START with the word, so they are not read as a second log. That is
// what makes a per-drop detail line safe for an engine to print at all.
const { logLines, ids: logged } = loggedIds(out);
if (!logLines.length && expected.length) {
  console.error('');
  console.error(`STOP — the fill engine printed no line beginning "OVERFLOW", yet the map and the fixture say ${expected.length} row(s) have no printed slot. Either the rows were dropped silently or they were not dropped at all, and this tool cannot tell which from here. Reported as a failure; an unreadable log is never a pass.`);
  process.exit(2);
}
// UNIONED AND DE-DUPLICATED. An engine that prints a header line naming all three drops AND
// three per-drop lines that also opened with the word would otherwise have each id counted
// twice and be reported as OVER-LOGGING every one of them.
const wantIds = expected.map(e => `${e.group}[${e.index}]`);
const missing = wantIds.filter(id => !logged.includes(id));
const extra   = logged.filter(id => !wantIds.includes(id));
console.log('');
// ONE REPORTED LINE PER LOG LINE. A tool that read three lines and printed one of them would
// be showing a transcript reader less than it decided on.
console.log(`  ENGINE LOG: ${logLines.length ? logLines.map((l) => l.trim()).join(`\n              `) : '(no OVERFLOW line, and none was expected)'}`);
console.log(`    ${logLines.length} line(s) in the engine's log open with the word OVERFLOW; the ids below are their union`);
console.log(`    ${wantIds.length} drop(s) expected from the map and the fixture; ${logged.length} named in the log`);
if (missing.length) problems.push(`UNLOGGED      ${missing.join(', ')} — the map says these rows have no printed slot and the engine's log does not name them. A drop nobody is told about is the failure this tool exists for.`);
if (extra.length)   problems.push(`OVER-LOGGED   ${extra.join(', ')} — named as dropped, but the map declares a printed slot for them. Either the engine's cap disagrees with the map's max, or the log is naming the wrong index.`);
if (!missing.length && !extra.length) console.log(`    set equality holds in both directions`);

// ─── 3. IS THE DROPPED ROW ACTUALLY ABSENT FROM THE PAGE? ─────────────────────────────────
const outPath = `adapters/pdf/out/${form}_filled_${rec.intake_id || 'sample'}.pdf`;
if (!existsSync(outPath)) {
  console.error('');
  console.error(`STOP — ${outPath} was not produced, so no dropped row's absence could be looked for. Questions 1 and 2 above stand; question 3 was not answered, which is not the same as answered yes.`);
  process.exit(2);
}
const pdf = await PDFDocument.load(readFileSync(outPath));
const printed = pdf.getForm().getFields()
  .filter(f => f instanceof PDFTextField)
  .map(f => ({ name: f.getName(), text: f.getText() }))
  .filter(f => f.text !== undefined && f.text !== null && String(f.text).trim() !== '');
console.log('');
console.log(`  READ BACK ${outPath} — ${printed.length} text field(s) carry a value`);
let proved = 0;
for (const e of expected) {
  if (e.value === null) continue;                     // already a STOP from question 1
  const hit = printed.find(f => String(f.text).includes(e.value));
  if (hit) problems.push(`LEAKED        ${e.group}[${e.index}]: the dropped row's ${e.col} is printed at ${hit.name}. The row has no printed slot, was named as dropped, and reached the page anyway.`);
  else proved++;
}
console.log(`    ${proved} of ${expected.length} dropped row(s) proved absent from every text field on the filled form`);

// ─── VERDICT ──────────────────────────────────────────────────────────────────────────────
console.log('');
if (problems.length) {
  console.error(`ASSERT-OVERFLOW FAILED — ${problems.length} problem(s):`);
  problems.forEach(p => console.error(`  ${p}`));
  process.exit(2);
}
console.log(`ASSERT-OVERFLOW PASSED — ${groups.length} group(s), all over-fed; ${wantIds.length} drop(s), each named in the engine's log and each proved absent from the filled page.`);
