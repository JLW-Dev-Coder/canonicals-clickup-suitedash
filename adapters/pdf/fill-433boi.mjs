// Fill Form 433-B(OIC) from a record.
//
//   node adapters/pdf/fill-433boi.mjs [samplePath] [--saturated]
//
// SLICE 2 — PAGES 1, 2 AND 3. The map binds 173 of the form's 267 fields and declares the
// other 94 unaccounted; this engine writes exactly what the map binds and nothing else. A cell
// on pages 4-6 is not skipped here, it is unreachable: there is no key for it.
//
// WHAT THIS ENGINE DOES NOT CARRY, AND WHY EACH ABSENCE IS DECLARED
// -----------------------------------------------------------------
// `split`     — pages 1-3 print no cell pair a single value must straddle. 433-F needs it for
//               a two-box mo/yr date; these pages have no such construct. Wired in anyway would
//               be dead code, so it is absent and named here instead.
// `allowed`   — the Collection Financial Standards are a 433-F and 433-A(OIC) construct. This
//               form prints no allowable-expense table on any page this slice has read.
// `rounding`  — wired in and loaded, exactly as on 433-F, which also declares none. It is
//               loaded rather than skipped so that a later slice declaring a rounding block
//               cannot find the mechanism missing at the moment it first matters.
//
// WHAT SLICE 2 ADDED, RECORDED RATHER THAN QUIETLY BACKFILLED
// ----------------------------------------------------------
// `slot option sets` — per-row named-option checkboxes. Absent in slice 1 because page 1 prints
//               two top-level Yes/No pairs and one lone tick and NO per-row box at all, so the
//               mechanism would have been dead code there. Pages 2 and 3 print 18 account-type
//               boxes, 6 investment-type boxes, one digital-asset row-type tick and 6 Lease/Own
//               boxes, every one of them inside a repeatable row.
//
// PAGE 1 HAD NO ARITHMETIC AND PAGES 2 AND 3 HAVE PLENTY. Slice 1 declared no totals file at
// all, and gate step 11 SKIPPED for this form in consequence. Slice 2 authors
// adapters/pdf/maps/433boi.totals.json with the nineteen printed markers on these two pages, so
// step 11 now runs here. s1_average_gross_monthly_payroll remains the one money cell on page 1
// and remains an INPUT that nothing adds to.

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { verifyAppearances, reportAppearances } from './verify-appearances.mjs';
import { checkRowShapes, reportRowShapes, checkRowClasses, reportRowClasses, checkRowClassCollisions, reportRowClassCollisions } from './check-row-shape.mjs';
import { loadRounding, roundForOutput, miskeyedCells, reportCellSpelling } from './rounding.mjs';

const argv      = process.argv.slice(2);
const saturated = argv.includes('--saturated');
const mapDoc = JSON.parse(readFileSync('adapters/pdf/maps/433boi.map.json', 'utf8'));
const data   = JSON.parse(readFileSync(argv.filter(a => !a.startsWith('--'))[0] || 'samples/433boi.slice1.sample.json', 'utf8'));
const pdf    = await PDFDocument.load(readFileSync(mapDoc.pdf));
const form   = pdf.getForm();

// Asked before a single row is read, for the same reason as on 433-F: a form printing one
// class in two tables needs a discriminator, or which printed table a row lands in is decided
// by which property it happened to be stored in. Page 1 declares one group, and the check runs
// anyway — a collision check that only runs when someone expects a collision is not a check.
if (reportRowClassCollisions(checkRowClassCollisions(mapDoc), 'adapters/pdf/maps/433boi.map.json')) process.exit(2);

let filled = 0; const skipped = [];
const capacityErrors = [];
const rounding = loadRounding(mapDoc);
const rounded = [], moneyNotNumeric = [];

const cellKeysUsed = new Set();
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
  // A VALUE THE FIELD REFUSES IS A HARD FAILURE, NOT A SKIP — the same rule the other three
  // engines run under. Page 1 carries a cell that makes this concrete: the map's arguable item
  // [B6] records that s1_total_number_of_employees is 18.0pt wide and declares NO /MaxLen, so
  // the PDF will accept a four-digit headcount that the rectangle cannot draw. That is a
  // rendering problem this check cannot see; what it does catch is any cell that DOES declare
  // a limit, and it names the input key rather than the widget, because the fix is to the record.
  if (max !== undefined && s.length > max) { capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s }); return; }
  try { field.setText(s); filled++; }
  catch (e) { capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s, why: e.message }); }
};

let cbFilled = 0;
const checkBox = (name) => {
  if (!name) return;
  // pdf-lib's check() sets each box's own on-value automatically. On this form the probe found
  // all 77 boxes share /1, but the value is still never written raw — a uniform on-state read
  // once is not a licence to hardcode it.
  try { form.getCheckBox(name).check(); cbFilled++; } catch { skipped.push(name); }
};
const truthy = (v) => v === true || ['true', 'yes', '1', 'y'].includes(String(v).trim().toLowerCase());
const normalize = (v) => (v === true ? 'yes' : v === false ? 'no' : String(v)).trim().toLowerCase();

// INPUT KEYS ARE READ THROUGH `input()`, NEVER OFF `data` DIRECTLY.
//
// Inherited from fill-433f.mjs, where reading `data` directly meant the ENTIRE checkbox layer
// silently did nothing on any record fetched from HubSpot — the hand-written sample wrote bare
// keys and the fetched record wrote prefixed ones, nothing errored, and a PDF came out with no
// boxes ticked at all. Wired in here BEFORE this form has a fetch script, so the trap cannot be
// walked into a second time when one is written.
const PREFIX = `${mapDoc.form}_`;
const input = (name) => data[name] ?? data[PREFIX + name];

// ── option sets ────────────────────────────────────────────────────────────────────────────
//
// A NAMED OPTION IS MATCHED AGAINST THE MAP'S OPTION KEY AND NEVER AGAINST A WIDGET NAME. The
// option keys on this form are read from the printed page - "Checking" drawn to the right of
// its box - and the leaf names are C2_07..C2_18, which say nothing. Slice 2 needs this on four
// of its five groups: six account types per bank row, three investment types per investment
// row, the digital-asset row-type tick, and Lease/Own per vehicle row.
//
// AN UNRECOGNISED OPTION IS A HARD FAILURE, NOT A SKIP. A typo'd "Savings Account" quietly
// leaving every box on that row blank files a form that asserts nothing where the taxpayer
// said something, and the arithmetic on the page reconciles either way because no box feeds a
// total. Collected and reported with the whole list of options the map declares.
const optionErrors = [];
const applyOption = (key, options, raw) => {
  if (raw === undefined || raw === null || String(raw).trim() === '') return;   // absent is fine
  const want = normalize(raw);
  let target = null;
  for (const [opt, t] of Object.entries(options)) {
    if (opt.startsWith('_')) continue;                       // `_printed` prose, same convention as the map
    if (typeof t === 'string' && opt.trim().toLowerCase() === want) { target = t; break; }
  }
  if (!target) { optionErrors.push({ key, value: raw, options: Object.keys(options).filter((o) => !o.startsWith('_')) }); return; }
  checkBox(target);
};

// ── scalars ────────────────────────────────────────────────────────────────────────────────
for (const [key, name] of Object.entries(mapDoc.map)) setText(name, input(key), key);

// ── repeatable groups ──────────────────────────────────────────────────────────────────────
const overflow = [];
const groupRows = {}, groupSource = {};
for (const [g, def] of Object.entries(mapDoc.groups || {})) {
  if (g.startsWith('_')) continue;
  const srcKey = def.array || def.source || g;
  let rows = Array.isArray(input(srcKey)) ? input(srcKey) : null;
  const fromArray = rows !== null;
  if (!rows) rows = (def.fallback || [])
    .map((fb) => {
      const r = {};
      for (const [sub, key] of Object.entries(fb)) if (!sub.startsWith('_')) r[sub] = input(key);
      const built = Object.values(r).some((v) => v !== undefined && v !== null && v !== '');
      if (built && fb._class && def.row_class?.column) r[def.row_class.column] = fb._class;
      return r;
    })
    .filter((r) => Object.entries(r).some(([k, v]) => k !== def.row_class?.column && v !== undefined && v !== null && v !== ''));
  groupRows[g] = rows;
  groupSource[g] = { rows, fromArray };
  rows.forEach((row, i) => {
    if (i >= def.slots.length) { overflow.push(`${g}[${i}]`); return; }
    const slot = def.slots[i];
    // ONE CELL SPELLING. `groups.${g}.slots[${i}].${sub}` is what this line used to pass, and
    // adapters/pdf/rounding.mjs cannot resolve it: blockFor reads "group[row].column", the spelling
    // `exclusive`, the totals predicate, the name-lie registry's `bound_to` and the gate's own
    // addressing all use. Every group money cell on this form therefore came back with no block and
    // was written unrounded — invisible while this map declared no rounding, and one wrong printed
    // figure the moment it did. See rounding.mjs MISKEYED_CELL, which asserts the shape on every run.
    for (const [sub, name] of Object.entries(slot.text || {})) setText(name, row[sub], `${g}[${i}].${sub}`);
    for (const [sub, options] of Object.entries(slot.checkboxes || {}))
      applyOption(`${g}[${i}].${sub}`, options, row[sub]);
  });
}

const rowShape = checkRowShapes(mapDoc, groupSource);
const rowClass = checkRowClasses(mapDoc, groupSource);

// ── checkbox pairs ─────────────────────────────────────────────────────────────────────────
//
// Each declared set is a printed question with a yes and a no cell. The record's value is
// normalised and matched against the OPTION KEY, never against a widget name: the map's option
// keys are read from the printed page ("Yes" drawn to the right of its box) and the leaf names
// on this form are C1_01..C1_04, which say nothing at all. See the map's note on why those four
// sequential names are TWO questions and not one four-way set.
for (const [set, def] of Object.entries(mapDoc.checkboxes || {})) {
  if (set.startsWith('_') || !def || typeof def !== 'object') continue;
  const want = normalize(input(set) ?? '');
  if (!want) continue;
  const target = def[want];
  if (target === undefined) {
    console.error(`OPTION — "${set}" was given ${JSON.stringify(want)} and the map declares no such option (it declares: ${Object.keys(def).filter((k) => !k.startsWith('_')).join(', ')}).`);
    process.exit(2);
  }
  checkBox(target);
}

// ── lone check-here ticks ──────────────────────────────────────────────────────────────────
for (const [key, def] of Object.entries(mapDoc.check_here || {})) {
  if (key.startsWith('_')) continue;
  if (truthy(input(key))) checkBox(def.target || def);
}

// ── exclusive sets ─────────────────────────────────────────────────────────────────────────
//
// Asserted AFTER writing, against what the document now holds, rather than against what the
// record asked for. The two are different facts and only the second one is filed.
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

// ── the conditional cell the page declares ─────────────────────────────────────────────────
//
// The map's _computed block records that the payroll-provider cell is filled only when the
// outsourcing answer is yes. Nothing in the PDF enforces that — the cell is writable on the
// blank whatever the Yes/No pair says — so a record carrying a provider name alongside "no" is
// a contradiction that would otherwise print silently. Reported rather than STOPPED: the
// printed instruction says "If yes, list provider name and address", which tells a preparer
// what to do and does not forbid the other combination, and this engine does not invent
// prohibitions the form does not print.
const contradictions = [];
for (const [key, def] of Object.entries(mapDoc._computed || {})) {
  if (key.startsWith('_') || !def?.conditional_on) continue;
  const m = /^(\S+)\s*=\s*"?([^"]+)"?$/.exec(def.conditional_on);
  if (!m) continue;
  const [, onKey, onVal] = m;
  const supplied = input(key);
  if (supplied !== undefined && supplied !== null && String(supplied).trim() !== '' && normalize(input(onKey) ?? '') !== normalize(onVal))
    contradictions.push(`${key} carries a value and ${onKey} is ${JSON.stringify(normalize(input(onKey) ?? '(absent)'))}, not ${JSON.stringify(normalize(onVal))} — the page prints "${def.printed_basis}"`);
}

if (optionErrors.length) {
  console.error(`OPTION — ${optionErrors.length} value(s) name no option the map declares. No PDF written.`);
  for (const e of optionErrors) {
    console.error(`  ${e.key}: ${JSON.stringify(e.value)}`);
    console.error(`    the map declares: ${e.options.join(', ')}`);
  }
  console.error('  Left as a skip this would tick nothing on that row, and every printed total on the');
  console.error('  page would still reconcile, because no option box feeds a total.');
  process.exit(2);
}

if (capacityErrors.length) {
  console.error(`CAPACITY — ${capacityErrors.length} value(s) are longer than the cell the form provides. No PDF written.`);
  for (const e of capacityErrors) {
    console.error(`  ${e.key}: ${e.len} characters into a /MaxLen ${e.max} cell`);
    console.error(`    field: ${e.name}`);
    console.error(`    value: ${JSON.stringify(e.value)}`);
    if (e.why) console.error(`    pdf-lib: ${e.why}`);
  }
  console.error('  Shorten the value in the record. The cell is never truncated here: a shortened');
  console.error('  figure on a signed collection statement is a number the taxpayer did not give.');
  process.exit(2);
}

if (reportRowShapes(rowShape, saturated) + reportRowClasses(rowClass)) process.exit(2);

mkdirSync('adapters/pdf/out', { recursive: true });
const outPath = `adapters/pdf/out/433boi_filled_${data.intake_id || 'sample'}.pdf`;
// Explicit for the same reason as the other three engines: pdf-lib defaults this to true
// today, and a file whose appearance streams were never regenerated carries every correct /V
// value and PRINTS BLANK.

// ─── THE CELL SPELLING, ASSERTED ────────────────────────────────────────────────────────
//
// Every key this engine looked a rounding block up by must be in a shape blockFor can
// resolve. A group cell keyed `groups.G.slots[i].col` comes back with NO block and is written
// unrounded, and on a form that declares no rounding that is indistinguishable from correct —
// which is exactly how it survived on two engines until 433-B(OIC) declared its blocks and one
// printed figure came out with cents against rounded neighbours. Asserted here whether or not
// this form declares a block, so a form with none proves the no-op instead of skipping.
if (reportCellSpelling(miskeyedCells(cellKeysUsed), 'fill-433boi.mjs', cellKeysUsed.size) > 0) {
  console.error('  No PDF written. Re-key the group cells as "group[row].column" — the one cell spelling in this repo.');
  process.exit(2);
}

writeFileSync(outPath, await pdf.save({ updateFieldAppearances: true }));

// And prove it rather than trusting the flag.
if (reportAppearances(await verifyAppearances(outPath)) !== 0) process.exit(2);

console.log(`filled ${filled} fields + ${cbFilled} checkboxes -> ${outPath}`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0, 4).join(', ')}${skipped.length > 4 ? ' ...' : ''}`);
if (overflow.length) console.log(`OVERFLOW: ${overflow.join(', ')}`);
if (contradictions.length) {
  console.log(`CONDITIONAL — ${contradictions.length} cell(s) carry a value the page's own condition does not ask for:`);
  contradictions.forEach((c) => console.log(`  ${c}`));
}
if (filled === 0) { console.error('0 fields filled — STOP.'); process.exit(2); }
