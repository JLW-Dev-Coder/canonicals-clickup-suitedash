// Fill Form 433-B from a record.
//
//   node adapters/pdf/fill-433b.mjs [samplePath] [--saturated]
//
// SLICE 1 — PAGE 1. The map binds 103 of the form's 447 fields and declares the other 344
// unaccounted; this engine writes exactly what the map binds and nothing else. A cell on pages
// 2 to 6 is not skipped here, it is unreachable: there is no key for it.
//
// WHAT THIS ENGINE DOES NOT CARRY, AND WHY EACH ABSENCE IS DECLARED
// -----------------------------------------------------------------
// `totals`    — PAGE 1 HAS NO ARITHMETIC AT ALL. The page draws no lettered Box, no "Total"
//               line, no "Add lines", no "Subtract" and no "minus"; the only occurrence of the
//               word "box" is the instruction "(Check appropriate box below)". So there is
//               nothing to compute and no operand list to quote. Gate step 11 SKIPS for this
//               form, and that skip is a declared absence rather than a gap.
// `rounding`  — wired in and loaded, exactly as on 433-F and 433-B(OIC), both of which also
//               declare none. It is loaded rather than skipped so that a later slice declaring
//               a rounding block cannot find the mechanism missing at the moment it matters.
//               Page 1 draws two money cells — 3b Monthly Gross Payroll and each personnel
//               row's Annual Salary/Draw — and neither feeds anything.
// `split`     — page 1 prints no cell pair a single value must straddle. The telephones look
//               like one, and are not: the page prints "(" and ")" around the area code, which
//               makes them two captioned cells rather than one value split across two boxes.
// `allowed`   — the Collection Financial Standards are a 433-F and 433-A(OIC) construct. This
//               form prints no allowable-expense table on any page.
// `check_here`— no lone tick on page 1. Every one of its 17 boxes belongs to a declared set.
//
// THE ON-STATE IS THE THING THIS FORM DOES DIFFERENTLY, AND IT IS THE ONE PLACE AN ENGINE
// WRITTEN FROM 433-B(OIC) WOULD SILENTLY DO NOTHING
// -----------------------------------------------------------------------------------------
// 433-B(OIC) turns every one of its 77 boxes on with /1 and its engine can say so in a comment.
// This form stores THIRTEEN distinct on-states — /Yes /No /Partnership /Corporation /Other /LLC
// /Other#20LLC /Plaintiff /Defendent /Secured /Unsecured /Cash /Accrual — and page 1 alone uses
// five of them for one printed list. pdf-lib's check() reads each box's own on-value, so the
// value is never written raw here either; what IS asserted, after writing, is that every box
// this engine ticked came back on. A box whose on-state the document disagreed with would
// otherwise stay off and this engine would report it filled.

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { verifyAppearances, reportAppearances } from './verify-appearances.mjs';
import { checkRowShapes, reportRowShapes, checkRowClasses, reportRowClasses, checkRowClassCollisions, reportRowClassCollisions } from './check-row-shape.mjs';
import { loadRounding, roundForOutput, miskeyedCells, reportCellSpelling } from './rounding.mjs';

const argv = process.argv.slice(2);
const saturated = argv.includes('--saturated');
const MAP = 'adapters/pdf/maps/433b.map.json';
const mapDoc = JSON.parse(readFileSync(MAP, 'utf8'));
const data = JSON.parse(readFileSync(argv.filter((a) => !a.startsWith('--'))[0] || 'samples/433b.slice1.sample.json', 'utf8'));
const pdf = await PDFDocument.load(readFileSync(mapDoc.pdf));
const form = pdf.getForm();

// Asked before a single row is read. Page 1 declares three groups and no row_class at all, and
// the check runs anyway — a collision check that only runs when someone expects a collision is
// not a check.
if (reportRowClassCollisions(checkRowClassCollisions(mapDoc), MAP)) process.exit(2);

let filled = 0; const skipped = [];
// Every cell key this engine addresses, recorded as it is used, so the spelling assertion at
// the foot of this file runs over what actually happened rather than over the map.
const cellKeysUsed = new Set();
const capacityErrors = [];
const rounding = loadRounding(mapDoc);
const rounded = [], moneyNotNumeric = [];

const setText = (name, val, key) => {
  cellKeysUsed.add(key ?? name);
  if (val === undefined || val === null || val === '') return;
  const rd = roundForOutput(rounding, key ?? name, val);
  if (rd.notNumeric) moneyNotNumeric.push({ key: key ?? name, block: rd.block.id, value: String(val) });
  if (rd.rounded) rounded.push({ key: key ?? name, block: rd.block.id, mode: rd.block.mode, from: String(val).trim(), to: rd.value });
  val = rd.value;
  let field;
  try { field = form.getTextField(name); } catch { skipped.push(name); return; }
  const s = String(val), max = field.getMaxLength();
  // A VALUE THE FIELD REFUSES IS A HARD FAILURE, NOT A SKIP — the rule the other four engines
  // run under. It names the INPUT KEY rather than the widget, because the fix is to the record.
  if (max !== undefined && s.length > max) { capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s }); return; }
  try { field.setText(s); filled++; }
  catch (e) { capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s, why: e.message }); }
};

let cbFilled = 0;
const ticked = [];
const checkBox = (name, key) => {
  if (!name) return;
  try { form.getCheckBox(name).check(); cbFilled++; ticked.push({ name, key }); }
  catch { skipped.push(name); }
};
const normalize = (v) => (v === true ? 'yes' : v === false ? 'no' : String(v)).trim().toLowerCase();

// INPUT KEYS ARE READ THROUGH `input()`, NEVER OFF `data` DIRECTLY. Inherited from
// fill-433f.mjs, where reading `data` directly meant the ENTIRE checkbox layer silently did
// nothing on any record fetched from HubSpot. Wired in here BEFORE this form has a fetch
// script, so the trap cannot be walked into a second time when one is written.
const PREFIX = '433b_';
const input = (name) => data[name] ?? data[PREFIX + name];

// AN UNRECOGNISED OPTION IS A HARD FAILURE, NOT A SKIP. A typo'd entity type quietly leaving
// all five boxes blank files a form that asserts nothing where the filer said something, and
// nothing on this page reconciles it because no box feeds a total.
const optionErrors = [];
const applyOption = (key, def, raw) => {
  if (raw === undefined || raw === null || String(raw).trim() === '') return;
  const want = normalize(raw);
  let target = null;
  for (const [opt, t] of Object.entries(def)) {
    if (opt.startsWith('_')) continue;
    if (typeof t === 'string' && opt.trim().toLowerCase() === want) { target = t; break; }
  }
  if (!target) { optionErrors.push({ key, value: raw, options: Object.keys(def).filter((o) => !o.startsWith('_')) }); return; }
  checkBox(target, key);
};

// ── scalars ────────────────────────────────────────────────────────────────────────────────
for (const [key, name] of Object.entries(mapDoc.map)) setText(name, input(key), key);

// ── repeatable groups ──────────────────────────────────────────────────────────────────────
const overflow = [];
const groupSource = {};
for (const [g, def] of Object.entries(mapDoc.groups || {})) {
  if (g.startsWith('_') || !def || !Array.isArray(def.slots)) continue;
  const rows = Array.isArray(input(g)) ? input(g) : [];
  groupSource[g] = { rows, fromArray: Array.isArray(input(g)) };
  rows.forEach((row, i) => {
    if (i >= def.slots.length) { overflow.push(`${g}[${i}]`); return; }
    // ONE CELL SPELLING: `group[row].column`, which is what rounding.mjs, the totals predicate,
    // the name-lie registry's `bound_to`, `exclusive` and the gate all address by.
    for (const [sub, name] of Object.entries(def.slots[i].text || {})) setText(name, row[sub], `${g}[${i}].${sub}`);
  });
}
const rowShape = checkRowShapes(mapDoc, groupSource);
const rowClass = checkRowClasses(mapDoc, groupSource);

// ── declared checkbox sets ─────────────────────────────────────────────────────────────────
// Every set is matched against its OPTION KEY, which is the PRINTED WORD, and never against a
// widget name. On this page the leaf names are c1_0_2b[0..4] and c1_01_7a[0..1], which say
// nothing at all; the printed words are "Partnership", "Corporation", "Yes", "No".
for (const [set, def] of Object.entries(mapDoc.checkboxes || {})) {
  if (set.startsWith('_') || !def || typeof def !== 'object') continue;
  applyOption(set, def, input(set));
}

// ── exclusive sets, asserted AFTER writing ─────────────────────────────────────────────────
// Against what the document now holds, rather than against what the record asked for. The two
// are different facts and only the second one is filed.
const exclusiveViolations = [];
for (const [set, targets] of Object.entries(mapDoc.exclusive || {})) {
  if (!Array.isArray(targets)) continue;
  const on = targets.filter((t) => { try { return form.getCheckBox(t).isChecked(); } catch { return false; } });
  if (on.length > 1) exclusiveViolations.push({ set, on });
}
if (exclusiveViolations.length) {
  console.error(`EXCLUSIVE — ${exclusiveViolations.length} set(s) have more than one option checked. No PDF written.`);
  for (const v of exclusiveViolations) { console.error(`  set "${v.set}": ${v.on.length} checked, expected at most 1`); v.on.forEach((n) => console.error(`    - ${n}`)); }
  process.exit(2);
}

// ── EVERY BOX THIS ENGINE TICKED IS READ BACK ──────────────────────────────────────────────
// THE ONE CHECK THIS FORM NEEDS THAT THE OTHERS DID NOT. With thirteen on-states in play, a
// box whose stored on-value the document disagreed with would stay OFF while `cbFilled` counted
// it as written. Read back from the same form object, before anything is saved.
const notOn = ticked.filter(({ name }) => { try { return !form.getCheckBox(name).isChecked(); } catch { return true; } });
if (notOn.length) {
  console.error(`CHECKBOX READ-BACK — ${cbFilled} box(es) were ticked and ${notOn.length} of them are not on. No PDF written.`);
  for (const n of notOn) console.error(`  ${n.key} -> ${n.name}`);
  console.error('  This form stores 13 distinct on-states. A box that will not turn on is a box whose on-value this engine did not write.');
  process.exit(2);
}

// ── hard failures ──────────────────────────────────────────────────────────────────────────
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
// A WRITER-RESOLVER KEY SPELLING IS ASSERTED AT THE BOUNDARY, ON EVERY FORM, INCLUDING WHERE
// THE FEATURE IS INERT. This map declares no rounding block, so nothing here would round even
// if a key were miskeyed — and that is exactly why the assertion runs: a form with none proves
// the no-op rather than skipping the check until the slice that first declares one.
if (reportCellSpelling(miskeyedCells(cellKeysUsed), 'fill-433b.mjs', cellKeysUsed.size) > 0) {
  console.error('  No PDF written. Re-key the group cells as "group[row].column" — the one cell spelling in this repo.');
  process.exit(2);
}
if (reportRowShapes(rowShape, MAP)) process.exit(2);
if (reportRowClasses(rowClass, MAP)) process.exit(2);

// ── write ──────────────────────────────────────────────────────────────────────────────────
// THE SAME PIECES run-form-gate.mjs USES to compute the path it then checks exists:
// `${form}_filled_${sample.intake_id || 'sample'}.pdf`. A different key here means the gate
// looks for a file this engine never wrote and fails step 7 with 'fill reported success but
// ... does not exist' — which is what the first draft did, reading data.record_id.
const id = data.intake_id || 'sample';
mkdirSync('adapters/pdf/out', { recursive: true });
const out = `adapters/pdf/out/433b_filled_${id}.pdf`;
form.updateFieldAppearances();
writeFileSync(out, await pdf.save());

// OVERFLOW IS DROPPED AND LOGGED, NEVER TRUNCATED ONTO THE PAGE. The page draws two payment
// processors, three credit cards and four personnel rows; a fifth partner has nowhere to go,
// and the form's only statement about that is the masthead's "Include attachments if additional
// space is needed" — which is [C1-4].
const tripwires = { form: '433b', slice: mapDoc.slice, sample: argv.filter((a) => !a.startsWith('--'))[0] || 'samples/433b.slice1.sample.json',
  mode: saturated ? 'saturated' : 'production', filled, checkboxes_ticked: cbFilled, skipped, overflow_dropped: overflow, rounded };
writeFileSync(out.replace(/\.pdf$/, '.tripwires.json'), JSON.stringify(tripwires, null, 1) + '\n');

console.log(`fill 433-B (${mapDoc.slice}) — ${filled} text cell(s), ${cbFilled} box(es), ${skipped.length} skipped, ${overflow.length} row(s) dropped as overflow`);
// ONE LINE NAMING EVERY DROP, NOT ONE LINE PER DROP. adapters/pdf/assert-overflow.mjs finds
// the FIRST line beginning "OVERFLOW" and reads every `group[index]` on it; a line per row
// meant it read only the first and reported the other two as UNLOGGED — a drop nobody is told
// about, which is the exact failure that tool exists for, produced by the engine that was
// telling them. The per-row detail follows on indented lines that do not open with the word.
if (overflow.length) {
  console.log(`OVERFLOW DROPPED ${overflow.join(', ')} — the page draws no such row; each is logged here and not written`);
  for (const o of overflow) console.log(`    dropped ${o}: past the last printed slot its group declares`);
}
if (reportAppearances(await verifyAppearances(out), out)) process.exit(2);
console.log(`wrote ${out}`);
