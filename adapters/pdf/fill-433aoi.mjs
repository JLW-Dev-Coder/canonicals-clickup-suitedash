// Fills Form 433-A(OIC) from a JSON intake record.
//
//   node adapters/pdf/fill-433aoi.mjs [samples/433aoi.sample.json] [--saturated]
//
// AUTHORED SLICE BY SLICE, ALONGSIDE THE MAP. This engine handles exactly the constructs
// 433aoi.map.json currently uses, and grows as the map does. That is deliberate: a filler
// written ahead of the map would have to guess at constructs the form has not been read for
// yet, and a guess in this layer prints onto a signed collection statement.
//
// Constructs in use as of map_version 2 (printed pages 1-2):
//   map          — scalar 1:1. Absent or empty input is skipped, never written as the string
//                  "undefined".
//   checkboxes   — input_key -> { option: target }. The input NAMES its option, so a value
//                  can never land on the wrong box because an assumed print order was wrong.
//   check_here   — input_key -> { target }. A LONE box with no counterpart cell, which this
//                  form prints and 433-A never does (the community-property declaration in
//                  Section 1). Truthy checks it, falsy leaves it blank, anything else stops
//                  the run. See the map's own `check_here._why`.
//   groups       — repeatable rows. household_members (4 slots, text + per-row yes/no pairs)
//                  on page 1; on page 2, 1ab_bank_accounts (2 slots), 2ab_investment_accounts
//                  (2 slots), 3a_retirement_accounts (1) and 4a_life_insurance_policies (1).
//                  Rows past the last slot are logged and dropped, never thrown and never
//                  written over an earlier row.
//                  SLOTS NEED NOT BE UNIFORM. 1ab_bank_accounts declares SIX account-type
//                  options on slot 0 and FIVE on slot 1, because printed line (1a) offers a
//                  Cash box and printed line (1b) does not. check-row-shape.mjs reads the
//                  declared columns per slot, so this is expressible; a record whose second
//                  bank row says 'Cash' hard-stops on UNKNOWN CHECKBOX OPTION.
//   row_class    — NOW IN USE, and page 2 is what it was wired in for. Each of the four asset
//                  groups declares the asset_class it prints, and a row claiming another one
//                  stops the run. On this form investments (2) and retirement accounts (3) are
//                  two printed tables with DIFFERENT arithmetic - (3) applies a X .8 quick-sale
//                  multiplier and (2) does not - so a 401(k) filed into the investment table
//                  overstates the offer by 20% of its market value with every total still
//                  reconciling. row_class is the check that refuses it.
//   exclusive    — at most one target per set, read back off the form after filling.
//   _never_autofill — validated for existence, guarded against ever being written. On this
//                  form it sits at the TOP LEVEL, not under `allowed`, because 433-A(OIC)
//                  prints no IRS-allowable column and therefore has no `allowed` block.
//   _deferred    — documentation + existence-validation only. Never filled. Empty today.
//   _computed / _not_checkable — DOCUMENTATION ONLY, and neither is read by this file. They
//                  record, per printed caption, which page-2 money cells state a formula over
//                  other printed cells and which source their figure from an attachment. THIS
//                  ENGINE COMPUTES NOTHING: every one of those cells is an ordinary writable
//                  map key the record supplies, and the formulas are verified by read-back.
//                  Formulas are written over map keys, never over targets, so verify-form-
//                  coverage.mjs does not count either block as a second binding.
//
// NOT PRESENT, AND NOT AN OVERSIGHT:
//   allowed      — this form prints no "IRS USE ONLY / Allowable Expenses" column anywhere.
//                  Nothing here is auto-filled from irs-standards-2026.json.
//   split        — no cell in this slice splits one value across abutting boxes. 433-A splits
//                  its phone numbers because each half is a separate /MaxLen-limited cell;
//                  this form prints primary phone, secondary phone and FAX as single cells
//                  (x 198.0..316.8), with no /MaxLen at all.

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { formPath } from './read-form-revision.mjs';
import { verifyAppearances, reportAppearances } from './verify-appearances.mjs';
import { checkRowShapes, reportRowShapes, checkRowClasses, reportRowClasses } from './check-row-shape.mjs';

const argv      = process.argv.slice(2);
const saturated = argv.includes('--saturated');
const mapDoc  = JSON.parse(readFileSync('adapters/pdf/maps/433aoi.map.json', 'utf8'));
const data    = JSON.parse(readFileSync(argv.filter(a => !a.startsWith('--'))[0] || 'samples/433aoi.sample.json', 'utf8'));
const pdfPath = mapDoc.pdf || formPath(mapDoc.form);
const pdf     = await PDFDocument.load(readFileSync(pdfPath));
const form    = pdf.getForm();

let filled = 0, cbFilled = 0;
const skipped = [], overflow = [], written = new Set();
// Every error class below is collected rather than thrown, so one run reports everything it
// can see, and then the run exits BEFORE any PDF is saved. A partially-correct filed form is
// worse than no form: the cells that did fill look authoritative.
const optionErrors = [];     // an input value matching no option in the map
const flagErrors   = [];     // a check_here input that is neither truthy nor falsy
const capacityErrors = [];   // a value the field itself refuses (/MaxLen)

const absent = (v) => v === undefined || v === null || String(v).trim() === '';

const setText = (name, val, key) => {
  if (absent(val)) return;
  let field;
  try { field = form.getTextField(name); } catch { skipped.push(name); return; }
  const s = String(val), max = field.getMaxLength();
  if (max !== undefined && s.length > max) {
    capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s });
    return;
  }
  try { field.setText(s); filled++; written.add(name); }
  catch (e) { capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s, why: e.message }); }
};

const checkBox = (name) => {
  if (!name) return;
  // pdf-lib's check() sets each box's own on-value automatically. Every one of this form's
  // 124 checkboxes probes as on=/1 (433aoi.checkboxes.txt), but nothing here depends on that
  // being uniform — a raw write would.
  try { form.getCheckBox(name).check(); cbFilled++; written.add(name); }
  catch { skipped.push(name); }
};

// Booleans are folded onto the printed yes/no options so an intake record may carry either
// `true` or `"Yes"`. Everything else is compared trimmed and case-insensitively.
const normalize = (v) => (v === true ? 'yes' : v === false ? 'no' : String(v)).trim().toLowerCase();

const applyOption = (key, options, raw) => {
  if (absent(raw)) return;                        // an absent input key is fine
  const want = normalize(raw);
  let target = null;
  for (const [opt, t] of Object.entries(options)) {
    if (opt.startsWith('_')) continue;            // `_printed` prose, same convention as the map
    if (typeof t === 'string' && opt.trim().toLowerCase() === want) { target = t; break; }
  }
  if (!target) {
    // A HARD failure, not a skip. A typo'd "Bi-Weekly" quietly leaving the pay period blank
    // files a form that asserts nothing where the taxpayer said something.
    optionErrors.push({ key, value: raw, options: Object.keys(options).filter(o => !o.startsWith('_')) });
    return;
  }
  checkBox(target);
};

// scalar 1:1
for (const [key, name] of Object.entries(mapDoc.map || {})) setText(name, data[key], key);

// named-option checkboxes
for (const [key, options] of Object.entries(mapDoc.checkboxes || {})) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) continue;
  applyOption(key, options, data[key]);
}

// check_here — a lone box, no counterpart.
//
// The accepted vocabulary is spelled out rather than inferred, and anything outside it stops
// the run. Falling back to "not truthy, so leave it blank" would turn a typo into a silent
// negative answer on a question the taxpayer was asked directly.
const TRUE_WORDS  = new Set(['true', 'yes', 'y', '1', 'checked']);
const FALSE_WORDS = new Set(['false', 'no', 'n', '0', 'unchecked']);
for (const [key, def] of Object.entries(mapDoc.check_here || {})) {
  if (!def || typeof def !== 'object' || typeof def.target !== 'string') continue;  // `_why` prose
  const raw = data[key];
  if (absent(raw)) continue;                      // absent is fine: an unanswered lone box is blank
  const v = raw === true ? 'true' : raw === false ? 'false' : String(raw).trim().toLowerCase();
  if (TRUE_WORDS.has(v)) checkBox(def.target);
  else if (FALSE_WORDS.has(v)) { /* the negative answer IS the blank box */ }
  else flagErrors.push({ key, value: raw, accepted: [...TRUE_WORDS, ...FALSE_WORDS] });
}

// repeatable groups — text + per-row yes/no pairs, overflow logged and dropped
const groupRows = {};
for (const [gName, def] of Object.entries(mapDoc.groups || {})) {
  const rows = Array.isArray(data[def.source || gName]) ? data[def.source || gName] : [];
  groupRows[gName] = { rows, fromArray: true };
  const cap = Math.min(def.max ?? def.slots.length, def.slots.length);
  rows.forEach((row, i) => {
    if (i >= cap) { overflow.push(`${gName}[${i}]`); return; }   // drop, do not throw
    const slot = def.slots[i];
    for (const [sub, name] of Object.entries(slot.text || {})) setText(name, row?.[sub], `${gName}[${i}].${sub}`);
    for (const [sub, options] of Object.entries(slot.checkboxes || {}))
      applyOption(`${gName}[${i}].${sub}`, options, row?.[sub]);
  });
}

// Every column the slot declares, or the run says which ones were not supplied.
const rowShape = checkRowShapes(mapDoc, groupRows);
// And a row must be allowed to say what it IS. No group in this slice declares a row_class —
// household_members is not an asset table and has no class to be confused with — so this
// currently reports nothing. It is wired in now rather than added later, because the asset
// tables on pages 2-5 are exactly where a row landing in the wrong printed table is possible.
const rowClass = checkRowClasses(mapDoc, groupRows);

if (capacityErrors.length) {
  console.error(`FIELD REJECTED VALUE — ${capacityErrors.length} value(s) do not fit their cell. No PDF written.`);
  for (const e of capacityErrors) {
    console.error(`  key "${e.key}": ${e.len} chars into a field with maxLength=${e.max}`);
    console.error(`    field: ${e.name}`);
    console.error(`    value: ${JSON.stringify(e.value)}`);
    if (e.why) console.error(`    pdf-lib: ${e.why}`);
  }
  console.error('  NOTE: only 13 of this form\'s 425 fields declare a /MaxLen at all, so this guard');
  console.error('  catches far less here than it does on 433-A (328 of 441). An absent /MaxLen is not');
  console.error('  permission to write anything — the printed box still has a width, and an over-long');
  console.error('  value prints outside the rule with no engine stop. Column ceilings for this form');
  console.error('  come from the widget RECT, which align-block.mjs reports.');
  process.exit(2);
}

if (optionErrors.length) {
  console.error(`UNKNOWN CHECKBOX OPTION — ${optionErrors.length} input value(s) matched no option in the map. No PDF written.`);
  for (const e of optionErrors) {
    console.error(`  key "${e.key}": received ${JSON.stringify(e.value)}`);
    console.error(`    valid options: ${e.options.join(', ')}`);
  }
  console.error('  Fix the input value (or ask Principal to extend the map) — a blank cell is not an acceptable fallback.');
  process.exit(2);
}

if (flagErrors.length) {
  console.error(`UNREADABLE CHECK-HERE VALUE — ${flagErrors.length} lone-box input(s) are neither an affirmative nor a negative. No PDF written.`);
  for (const e of flagErrors) {
    console.error(`  key "${e.key}": received ${JSON.stringify(e.value)}`);
    console.error(`    accepted: ${e.accepted.join(', ')}`);
  }
  console.error('  A lone box answers a question the taxpayer was asked; leaving it blank on an unreadable');
  console.error('  value would file a negative answer nobody gave.');
  process.exit(2);
}

// _deferred is validated for existence but must never be written.
const deferredTargets = new Set();
(function walk(n) {
  if (typeof n === 'string') { if (n.startsWith('topmostSubform[0].')) deferredTargets.add(n); return; }
  if (Array.isArray(n)) return n.forEach(walk);
  if (n && typeof n === 'object') return Object.values(n).forEach(walk);
})(mapDoc._deferred || {});
const deferredWritten = [...written].filter(n => deferredTargets.has(n));
if (deferredWritten.length) {
  console.error(`DEFERRED TARGET WRITTEN — ${deferredWritten.length} field(s) under _deferred received a value. No PDF written.`);
  deferredWritten.forEach(n => console.error(`  - ${n}`));
  process.exit(2);
}

// Same guard for never-autofill. `_deferred` is "not mapped yet"; `_never_autofill` is
// "mapped, understood, and deliberately blank" — the stronger statement. Read from BOTH
// roots so this file does not have to care which shape a map in this series uses.
const neverTargets = new Set(
  [...(mapDoc._never_autofill?.fields || []), ...(mapDoc.allowed?._never_autofill?.fields || [])]
    .map(f => f.target).filter(Boolean)
);
const neverWritten = [...written].filter(n => neverTargets.has(n));
if (neverWritten.length) {
  console.error(`NEVER-AUTOFILL TARGET WRITTEN — ${neverWritten.length} field(s) received a value. No PDF written.`);
  neverWritten.forEach(n => console.error(`  - ${n}`));
  process.exit(2);
}

// Exclusive checkbox groups — "at most one of these may be checked".
//
// State is read back off the FORM, not from what this run checked, so a box already set in
// the source PDF still counts. A violation fails loudly rather than silently unchecking one:
// picking a winner would file a form asserting something the taxpayer never said.
const violations = [];
for (const [set, targets] of Object.entries(mapDoc.exclusive || {})) {
  if (!Array.isArray(targets)) continue;   // `_note` prose
  const on = targets.filter(n => {
    try { return form.getCheckBox(n).isChecked(); } catch { return false; }
  });
  if (on.length > 1) violations.push({ set, on });
}
if (violations.length) {
  console.error(`EXCLUSIVE GROUP VIOLATION — ${violations.length} set(s) have more than one checked target. No PDF written.`);
  for (const v of violations) {
    console.error(`  set "${v.set}": ${v.on.length} checked, expected at most 1`);
    v.on.forEach(n => console.error(`    - ${n}`));
  }
  process.exit(2);
}

if (reportRowShapes(rowShape, saturated) + reportRowClasses(rowClass)) process.exit(2);

mkdirSync('adapters/pdf/out', { recursive: true });
const outPath = `adapters/pdf/out/433aoi_filled_${data.intake_id || 'sample'}.pdf`;
// `updateFieldAppearances: true` is passed EXPLICITLY. It is pdf-lib's current default, but
// a default is not a guarantee: a version bump — or anyone adding an unrelated save option
// here, which drops it — produces a file with a complete, correct set of /V values that
// PRINTS BLANK, because a viewer draws the appearance stream, not /V.
writeFileSync(outPath, await pdf.save({ updateFieldAppearances: true }));

// Pinning the flag states the intent; this proves the outcome.
if (reportAppearances(await verifyAppearances(outPath)) !== 0) process.exit(2);

console.log(`filled ${filled} text fields + ${cbFilled} checkboxes -> ${outPath}`);
console.log(`map slice: ${mapDoc.slice}`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0, 4).join(', ')}${skipped.length > 4 ? ' ...' : ''}`);
if (overflow.length) console.log(`OVERFLOW (dropped, form has no slot): ${overflow.join(', ')}`);
if (filled === 0) { console.error('0 fields filled — STOP.'); process.exit(2); }
