// Fill Form 433-B(OIC) from a record.
//
//   node adapters/pdf/fill-433boi.mjs [samplePath] [--saturated]
//
// SLICE 1 — PAGE 1 ONLY. The map binds 43 of the form's 267 fields and declares the other 224
// unaccounted; this engine writes exactly what the map binds and nothing else. A cell on pages
// 2-6 is not skipped here, it is unreachable: there is no key for it.
//
// WHAT THIS ENGINE DOES NOT CARRY, AND WHY EACH ABSENCE IS DECLARED
// -----------------------------------------------------------------
// `split`     — page 1 prints no cell pair a single value must straddle. 433-F needs it for a
//               two-box mo/yr date; this page has no such construct. Wired in anyway would be
//               dead code, so it is absent and named here instead.
// `allowed`   — the Collection Financial Standards are a 433-F and 433-A(OIC) construct. This
//               form prints no allowable-expense table on page 1.
// `rounding`  — wired in and loaded, exactly as on 433-F, which also declares none. It is
//               loaded rather than skipped so that a later slice declaring a rounding block
//               cannot find the mechanism missing at the moment it first matters.
//
// The one money cell on this page — s1_average_gross_monthly_payroll — is an INPUT, not a
// total. Nothing on page 1 adds anything, so there is no arithmetic here for a tripwire to
// check and none is declared.

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { verifyAppearances, reportAppearances } from './verify-appearances.mjs';
import { checkRowShapes, reportRowShapes, checkRowClasses, reportRowClasses, checkRowClassCollisions, reportRowClassCollisions } from './check-row-shape.mjs';
import { loadRounding, roundForOutput } from './rounding.mjs';

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

const setText = (name, val, key) => {
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
    for (const [sub, name] of Object.entries(slot.text || {})) setText(name, row[sub], `groups.${g}.slots[${i}].${sub}`);
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
