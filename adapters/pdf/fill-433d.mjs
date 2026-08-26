// Fill Form 433-D from a record.
//
//   node adapters/pdf/fill-433d.mjs [samplePath] [--saturated]
//
// THIS FORM DRAWS EVERY CELL TWICE and this engine writes both copies of every value, from one
// key, in one call. Page 1 is "Part 1 — IRS Copy" and page 3 is "Part 2 — Taxpayer's Copy"; a
// record whose value reached one and not the other produces a document whose two halves
// disagree, and nothing downstream would notice, because each half is internally consistent and
// the gate's coverage counts a bound target as covered either way. The map binds both targets
// under one key so that a one-sided write is not a thing this engine can express; [M-07] then
// asserts it of the map and [M-08] of the filled bytes, read back from the document rather than
// from this engine's own report.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE THREE SUBJECT CLASSES, AND WHAT EACH ONE MAKES THIS ENGINE DO
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433-D is the first form in this engine whose SUBJECT IS PER RECORD. One filed 433-D is about a
// natural person; the next is about a corporation; the form is the same form and nothing printed
// on it distinguishes them except which identifier the filer wrote. So every record declares
// `433d_subject`, and a record that declares nothing is REFUSED rather than defaulted — a
// default here would silently pick a legal person for a document signed under penalty of
// perjury.
//
//   INDEPENDENT (77 cells)  written once, from its own key, to both copies. Nothing else.
//
//   DEPENDENT (1 cell)      the identifier box. Its caption offers a Social Security or ITIN
//                           number OR an Employer Identification Number, and the value's KIND
//                           changes with the subject. The map declares a route; this engine
//                           takes the value from `433d_tin_ssn_itin` or `433d_tin_ein` according
//                           to the discriminator, and A VALUE SUPPLIED ON THE WRONG SIDE IS A
//                           HARD FAILURE rather than an ignored key — a record carrying an EIN
//                           while declaring itself an individual is contradicting itself, and
//                           silently writing the SSN key would file the contradiction.
//
//   CONDITIONAL (5 cells)   the cell exists for ONE subject only and the page says so. On a
//                           record declaring the other subject it must be EMPTY, and a value
//                           there is a STOP. This is the check that stops an entity record
//                           carrying a spouse's signature, and it is not a warning: no PDF is
//                           written.
//
// THE EMPTINESS CHECK RUNS OVER THE MAP'S DECLARATIONS, NOT OVER A LIST HERE. A cell that stops
// being conditional stops being checked, and a sixth conditional cell is checked the day it is
// declared, with nothing to edit in this file.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS ENGINE DOES NOT CARRY, AND WHY EACH ABSENCE IS DECLARED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `groups`    — 433-D DRAWS NO REPEATABLE TABLE ON EITHER COPY. Its two increase/decrease rows
//               are the closest thing and the map binds them as scalars, because the page prints
//               exactly two and prints them as two captioned rows rather than as a repeating
//               unit. So there is no overflow either: nothing can be dropped, because no group
//               can receive more rows than it has slots.
// `totals`    — the form prints NO total anywhere. adapters/pdf/maps/433d.totals.json declares
//               that as a checked zero rather than by not existing, and the gate's step 11 runs
//               over it instead of skipping. 433-D is an agreement, not a collection information
//               statement: nothing on it is computed from anything else on it.
// `rounding`  — wired in and loaded, exactly as on 433-F, 433-B and 433-B(OIC), all of which
//               also declare none. Loaded rather than skipped so that a later revision declaring
//               a rounding block cannot find the mechanism missing at the moment it matters, and
//               so the cell-spelling assertion runs on this form too — [R-16], a form with none
//               proves the no-op rather than skipping the check.
// `split`     — the page prints no cell pair a single value must straddle. The routing and
//               account numbers look like one and are not: the form draws 9 and 17 SEPARATE
//               boxes, one digit each, and each is its own captioned cell in a printed series.

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { verifyAppearances, reportAppearances } from './verify-appearances.mjs';
import { loadRounding, roundForOutput, miskeyedCells, reportCellSpelling } from './rounding.mjs';
import { resolveFixture, reportResolution } from './resolve-fixture.mjs';

// THE DEFAULT FIXTURE IS RESOLVED, NEVER TYPED — [R-22], and the defect that earned it was a
// gate script naming a slice-1 fixture a week after slice 2 landed.
const resolveDefaultFixture = () => {
  const r = resolveFixture('433d', 'acceptance');
  if (!r.path) { reportResolution(r); process.exit(2); }
  return r.path;
};

const argv = process.argv.slice(2);
const saturated = argv.includes('--saturated');
const MAP = 'adapters/pdf/maps/433d.map.json';
const mapDoc = JSON.parse(readFileSync(MAP, 'utf8'));
// THE MIRROR IS READ HERE TOO, and not because the map is insufficient: the map's stem->target
// lookup would have to be reconstructed by matching leaf names out of the option sets, and
// reconstructing a path from fragments is where two rounds of defects entered this engine
// ([Q-01]). adapters/pdf/maps/433d.mirror.json holds stem -> both targets for all 83 cells,
// derived from the widget geometry and re-derived on every sweep, so the conditional check
// below asks the declaration rather than rebuilding it.
const mirror = JSON.parse(readFileSync(mapDoc._the_mirror.declaration, 'utf8'));
const namedFixture = argv.filter((a) => !a.startsWith('--'))[0];
const samplePath = namedFixture || resolveDefaultFixture();
const data = JSON.parse(readFileSync(samplePath, 'utf8'));
const pdf = await PDFDocument.load(readFileSync(mapDoc.pdf));
const form = pdf.getForm();

const PREFIX = `${mapDoc.form}_`;
const input = (name) => data[name] ?? data[PREFIX + name];

// ── THE DISCRIMINATOR, READ BEFORE ANYTHING IS WRITTEN ─────────────────────────────────────
//
// A record that declares no subject is refused here rather than defaulted. The valid values are
// derived from the map's own conditional declarations plus the dependent route, so a form
// declaring different sides needs no edit here.
const SIDES = [...new Set(Object.values(mapDoc.subject_classes || {})
  .flatMap((e) => [e.empty_unless, e.route?.individual !== undefined ? 'individual' : null, e.route?.entity !== undefined ? 'entity' : null])
  .filter(Boolean))].sort();
const subject = String(input('subject') ?? '').trim().toLowerCase();
if (!SIDES.includes(subject)) {
  console.error(`SUBJECT — ${samplePath} declares ${JSON.stringify(input('subject') ?? null)} for ${PREFIX}subject and this form's declared sides are ${SIDES.map((s) => JSON.stringify(s)).join(' and ')}. No PDF written.`);
  console.error('  433-D is the first form in this engine whose subject is a property of the RECORD and not of the form. Nothing printed on the blank distinguishes an individual filer from an entity, so there is nothing to default to, and a default would pick a legal person for a document signed under penalty of perjury.');
  process.exit(2);
}

let filled = 0; const skipped = [];
const cellKeysUsed = new Set();
const capacityErrors = [];
const rounding = loadRounding(mapDoc);
const rounded = [], moneyNotNumeric = [];

// ONE KEY, BOTH COPIES. The target is always a pair and this signature takes the pair, so an
// engine that wrote one copy would have to be written differently rather than written carelessly.
const setBoth = (targets, val, key) => {
  cellKeysUsed.add(key);
  if (val === undefined || val === null || String(val) === '') return;
  const rd = roundForOutput(rounding, key, val);
  if (rd.notNumeric) moneyNotNumeric.push({ key, block: rd.block.id, value: String(val) });
  if (rd.rounded) rounded.push({ key, block: rd.block.id, mode: rd.block.mode, from: String(val).trim(), to: rd.value });
  const s = String(rd.value);
  for (const name of targets) {
    let field;
    try { field = form.getTextField(name); } catch { skipped.push(name); continue; }
    const max = field.getMaxLength();
    // A VALUE THE FIELD REFUSES IS A HARD FAILURE, NOT A SKIP, and it names the INPUT KEY
    // rather than the widget, because the fix is to the record.
    if (max !== undefined && s.length > max) { capacityErrors.push({ key, name, len: s.length, max, value: s }); continue; }
    try { field.setText(s); filled++; }
    catch (e) { capacityErrors.push({ key, name, len: s.length, max, value: s, why: e.message }); }
  }
};

let cbFilled = 0;
const ticked = [];
const checkBoth = (targets, key) => {
  for (const name of targets) {
    try { form.getCheckBox(name).check(); cbFilled++; ticked.push({ name, key }); }
    catch { skipped.push(name); }
  }
};
const truthy = (v) => v === true || ['true', 'yes', '1', 'y', 'on'].includes(String(v).trim().toLowerCase());

// ── the conditional cells this record must leave empty, DERIVED from the map ───────────────
const requiredEmpty = new Map();   // input key -> { stem, side, caption }
for (const [stem, e] of Object.entries(mapDoc.subject_classes || {}))
  if (e.class === 'conditional' && e.empty_unless !== subject) requiredEmpty.set(stem, e);

// ── scalars ────────────────────────────────────────────────────────────────────────────────
//
// The map's `map` block is key -> [irsCopy, taxpayerCopy]. The DEPENDENT cell is bound there
// like any other and its VALUE comes from the route rather than from the map key, which is why
// the route is read here and not in the map's key set: one printed box, two possible sources.
const stemForKey = new Map();
for (const [stem, e] of Object.entries(mapDoc.subject_classes || {})) stemForKey.set(stem, e);
const keyOfStem = (stem) => (mapDoc._key_overrides || {})[stem] || `${PREFIX}${stem.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/_+/g, '_').toLowerCase()}`;

const routeErrors = [];
for (const [key, targets] of Object.entries(mapDoc.map)) {
  const stem = [...stemForKey.keys()].find((s) => keyOfStem(s) === key);
  const decl = stem ? stemForKey.get(stem) : null;
  if (decl && decl.class === 'dependent') {
    // THE ROUTE. Both sides are read so that a value on the WRONG side is a failure rather than
    // an ignored key: a record declaring itself an individual and carrying an EIN is
    // contradicting itself, and writing the SSN key regardless would file the contradiction.
    const wanted = decl.route[subject];
    const other = decl.route[SIDES.find((s) => s !== subject)];
    const vWanted = input(wanted.replace(PREFIX, '')), vOther = input(other.replace(PREFIX, ''));
    if (vOther !== undefined && vOther !== null && String(vOther).trim() !== '')
      routeErrors.push({ key, stem, supplied: other, subject, caption: decl.caption });
    setBoth(targets, vWanted, key);
    continue;
  }
  setBoth(targets, input(key.replace(PREFIX, '')), key);
}

// ── checkboxes ─────────────────────────────────────────────────────────────────────────────
const optionErrors = [];
for (const [name, def] of Object.entries(mapDoc.checkboxes || {})) {
  if (name.startsWith('_')) continue;
  if (Array.isArray(def)) { if (truthy(input(name.replace(PREFIX, '')))) checkBoth(def, name); continue; }
  const raw = input(name.replace(PREFIX, ''));
  if (raw === undefined || raw === null || String(raw).trim() === '') continue;
  const want = String(raw).trim().toLowerCase();
  const hit = Object.entries(def).find(([opt]) => !opt.startsWith('_') && opt.toLowerCase() === want);
  // AN UNRECOGNISED OPTION IS A HARD FAILURE, NOT A SKIP. A typo'd review code quietly leaving
  // every box in the column blank files a form that asserts nothing where the examiner said
  // something, and nothing on this page reconciles it because no box feeds a total.
  if (!hit) { optionErrors.push({ key: name, value: raw, options: Object.keys(def).filter((o) => !o.startsWith('_')) }); continue; }
  checkBoth(hit[1], `${name}=${hit[0]}`);
}

// ── [SC-7] THE CONDITIONAL CELLS, AGAINST WHAT THE DOCUMENT NOW HOLDS ──────────────────────
//
// Asked of the FILLED FIELDS rather than of the record, and after writing rather than before.
// The two are different facts and only the second one is filed: a value that reached the page
// by any path at all is a value on the page.
const conditionalViolations = [];
const unreadable = [];
for (const [stem, e] of requiredEmpty) {
  const pair = mirror.pairs.find((x) => x.stem === stem);
  if (!pair) { unreadable.push({ stem, name: '(no mirror pair)', why: 'the mirror declares no pair for this stem, so there is no cell to prove empty' }); continue; }
  for (const name of [pair.page1, pair.page3]) {
    // AN UNREADABLE CELL IS NOT A CELL PROVED EMPTY, and that distinction is the whole of this
    // block. The tempting shape is `try { v = getText() } catch { v = '' }`, under which a field
    // that could not be read becomes the empty string, compares equal to empty, and SATISFIES
    // the assertion by having read nothing. So a read that throws on both accessors is its own
    // failure with its own message, and `undefined` -- which is what pdf-lib returns for a text
    // field carrying no /V, and is a real reading -- is empty.
    let held, read = false;
    try { held = form.getTextField(name).getText(); read = true; } catch { /* not a text field */ }
    if (!read) { try { held = form.getCheckBox(name).isChecked() ? 'checked' : undefined; read = true; } catch { /* nor a checkbox */ } }
    if (!read) { unreadable.push({ stem, name, why: 'neither a text field nor a checkbox could be read at this target' }); continue; }
    if (held !== undefined && held !== null && String(held).trim() !== '')
      conditionalViolations.push({ stem, name, side: e.empty_unless, subject, held: String(held), caption: e.caption });
  }
}

// ── ONE DECLARED LINE PER SUBJECT-CONDITIONAL CELL, PRINTED ON EVERY RUN ───────────────────
//
// Printed BEFORE the failure branches below, and for EVERY conditional cell the map declares
// rather than only for the ones in class on this record. That is what makes [SC-7] a set of
// declared lines a firing proof can quote rather than a single pass/fail:
//
//   empty      the cell exists only for the other subject and this record left it empty
//   NOT EMPTY  it exists only for the other subject and this record put something in it
//   SKIPPED    the cell exists for THIS record's subject, so the assertion was not asked
//
// The third is the fourth state [FS-3] requires a derived cause for, and the cause is the map's
// own `empty_unless` beside the record's declared subject. Without these lines a break proof
// could only assert "the engine exited 2", which is the bare non-zero exit [R-28] refuses.
const scLines = [];
for (const [stem, e] of Object.entries(mapDoc.subject_classes || {})) {
  if (e.class !== 'conditional') continue;
  const inClass = e.empty_unless !== subject;
  const hit = conditionalViolations.find((v) => v.stem === stem);
  const verdict = !inClass ? 'SKIPPED' : (hit ? 'NOT EMPTY' : 'empty');
  scLines.push({ stem, verdict, exists_only_for: e.empty_unless, in_class: inClass });
  console.log(`SC7 ${stem.padEnd(20)} ${verdict.padEnd(10)} exists only for the ${e.empty_unless} subject; this record declares ${subject}${inClass ? '' : ', so the assertion was not asked'}`);
}

// ── exclusive sets, asserted AFTER writing ─────────────────────────────────────────────────
const exclusiveViolations = [];
for (const [set, targets] of Object.entries(mapDoc.exclusive || {})) {
  if (!Array.isArray(targets)) continue;
  const on = targets.filter((t) => { try { return form.getCheckBox(t).isChecked(); } catch { return false; } });
  if (on.length > 1) exclusiveViolations.push({ set, on });
}

// ── hard failures ──────────────────────────────────────────────────────────────────────────
if (unreadable.length) {
  console.error(`SUBJECT-CONDITIONAL — ${unreadable.length} cell(s) required to be empty on this record could not be READ. No PDF written.`);
  for (const u of unreadable) console.error(`  ${u.stem} -> ${u.name}: ${u.why}`);
  console.error('  An unreadable cell is not a cell proved empty. Reporting it as empty is how a guard comes to satisfy itself by having read nothing.');
  process.exit(2);
}
if (conditionalViolations.length) {
  console.error(`SUBJECT-CONDITIONAL — ${conditionalViolations.length} cell(s) that exist for one subject only carry a value on a record declaring the other. No PDF written.`);
  for (const v of conditionalViolations)
    console.error(`  ${v.stem} -> ${v.name}: exists only for the ${v.side} subject, the page says so at ${JSON.stringify(v.caption.slice(0, 60))}, and this record declares itself ${v.subject} and holds ${JSON.stringify(v.held.slice(0, 40))}`);
  console.error('  A conditional cell is one fact that is sometimes absent. On the other subject it is not empty by convention, it is absent by construction, and a value there is a statement the form does not make.');
  process.exit(2);
}
if (routeErrors.length) {
  console.error(`SUBJECT-DEPENDENT ROUTE — ${routeErrors.length} record(s) supply the identifier for the subject they did not declare. No PDF written.`);
  for (const r of routeErrors)
    console.error(`  ${r.stem}: the record declares itself ${r.subject} and supplies ${r.supplied}. The caption is ${JSON.stringify(r.caption.slice(0, 60))}.`);
  process.exit(2);
}
if (exclusiveViolations.length) {
  console.error(`EXCLUSIVE — ${exclusiveViolations.length} set(s) have more than one option checked. No PDF written.`);
  for (const v of exclusiveViolations) { console.error(`  set "${v.set}": ${v.on.length} checked, expected at most 1`); v.on.forEach((n) => console.error(`    - ${n}`)); }
  process.exit(2);
}
if (optionErrors.length) {
  console.error(`OPTION — ${optionErrors.length} value(s) match no option the map declares. No PDF written.`);
  for (const o of optionErrors) console.error(`  ${o.key} = ${JSON.stringify(o.value)}; the map declares: ${o.options.join(', ')}`);
  process.exit(2);
}
if (capacityErrors.length) {
  console.error(`CAPACITY — ${capacityErrors.length} value(s) longer than the field accepts. No PDF written.`);
  for (const c of capacityErrors) console.error(`  ${c.key} -> ${c.name}: ${c.len} chars, max ${c.max}${c.why ? ` (${c.why})` : ''}`);
  process.exit(2);
}
if (moneyNotNumeric.length) {
  console.error(`MONEY — ${moneyNotNumeric.length} value(s) in a declared rounding block are not numeric. No PDF written.`);
  for (const m of moneyNotNumeric) console.error(`  ${m.key} (block ${m.block}) = ${JSON.stringify(m.value)}`);
  process.exit(2);
}

// EVERY BOX THIS ENGINE TICKED IS READ BACK, from the same form object, before anything is
// saved. All 26 of this form's checkboxes store /1 — probed, not assumed — but a box whose
// stored on-value the document disagreed with would otherwise stay OFF while cbFilled counted
// it written, which is the shape 433-B's thirteen on-states made unavoidable to check for.
const notOn = ticked.filter(({ name }) => { try { return !form.getCheckBox(name).isChecked(); } catch { return true; } });
if (notOn.length) {
  console.error(`CHECKBOX READ-BACK — ${cbFilled} box(es) were ticked and ${notOn.length} of them are not on. No PDF written.`);
  for (const n of notOn) console.error(`  ${n.key} -> ${n.name}`);
  process.exit(2);
}

// A WRITER-RESOLVER KEY SPELLING IS ASSERTED AT THE BOUNDARY, ON EVERY FORM, INCLUDING WHERE
// THE FEATURE IS INERT — [R-16]. This map declares no rounding block, so nothing here would
// round even if a key were miskeyed, and that is exactly why the assertion runs.
if (reportCellSpelling(miskeyedCells(cellKeysUsed), 'fill-433d.mjs', cellKeysUsed.size) > 0) {
  console.error('  No PDF written.');
  process.exit(2);
}

// ── write ──────────────────────────────────────────────────────────────────────────────────
const id = data.intake_id || 'sample';
mkdirSync('adapters/pdf/out', { recursive: true });
const out = `adapters/pdf/out/433d_filled_${id}.pdf`;
form.updateFieldAppearances();
writeFileSync(out, await pdf.save());

// NO OVERFLOW IS POSSIBLE ON THIS FORM AND THE LOG SAYS SO AS A DERIVED ZERO. The map declares
// no group, so there is no slot list a row could run past. An empty `overflow_dropped` on a form
// that COULD drop rows and one on a form that cannot read identically from outside, which is the
// silence this repo keeps finding, so the reason is carried in the record rather than inferred.
const tripwires = {
  form: '433d', slice: mapDoc.slice, sample: samplePath,
  mode: saturated ? 'saturated' : 'production',
  subject, filled, checkboxes_ticked: cbFilled, skipped,
  overflow_dropped: [],
  _overflow_impossible: `the map declares ${Object.keys(mapDoc.groups || {}).length} repeatable group(s), so no row can run past a slot list. 433-D draws no repeatable table on either copy.`,
  conditional_cells_required_empty: [...requiredEmpty.entries()].map(([stem, e]) => ({ stem, exists_only_for: e.empty_unless, caption: e.caption })),
  subject_conditional_lines: scLines,
  dependent_route_taken: Object.entries(mapDoc.subject_classes).filter(([, e]) => e.class === 'dependent').map(([stem, e]) => ({ stem, from: e.route[subject] })),
  rounded,
};
writeFileSync(out.replace(/\.pdf$/, '.tripwires.json'), JSON.stringify(tripwires, null, 1) + '\n');

console.log(`fill 433-D (${mapDoc.slice}) — subject ${JSON.stringify(subject)}; ${filled} text write(s) across both copies, ${cbFilled} box(es), ${skipped.length} skipped`);
console.log(`  mirror: every value written to BOTH the IRS copy and the taxpayer copy from one key; [M-08] reads the two back out of the filled bytes`);
console.log(`  route:  ${tripwires.dependent_route_taken.map((r) => `${r.stem} <- ${r.from}`).join(', ') || '(none)'}`);
console.log(`  [SC-7]: ${requiredEmpty.size} conditional cell(s) required empty on this subject and every one of them is: ${[...requiredEmpty.keys()].join(', ') || '(none)'}`);
if (reportAppearances(await verifyAppearances(out), out)) process.exit(2);
console.log(`wrote ${out}`);
