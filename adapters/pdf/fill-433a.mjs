// Fills Form 433-A (Sections 1-3 slice) from a JSON intake record.
//
// CLI:  node adapters/pdf/fill-433a.mjs [samples/433a.sample.json]
//
// Shape differences from fill-433f.mjs, all driven by the 433-A map:
//   map          — scalar 1:1, same setText semantics (empty/absent is skipped, never
//                  written as "undefined"/"null").
//   checkboxes   — input_key -> { option: target }. The input NAMES its option instead
//                  of indexing into a positional array, so a pay-period value can never
//                  land on the wrong box because an assumed print order was wrong.
//   groups       — household_members, five slots, each carrying both text and per-row
//                  yes/no checkbox pairs.
//   exclusive    — identical to 433-F: at most one target per set, read back off the form.
//   _deferred    — documentation + existence-validation ONLY. Never filled.

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { formPath } from './read-form-revision.mjs';

const mapDoc  = JSON.parse(readFileSync('adapters/pdf/maps/433a.map.json', 'utf8'));
const data    = JSON.parse(readFileSync(process.argv[2] || 'samples/433a.sample.json', 'utf8'));
const pdfPath = mapDoc.pdf || formPath(mapDoc.form);
const pdf     = await PDFDocument.load(readFileSync(pdfPath));
const form    = pdf.getForm();

let filled = 0, cbFilled = 0;
const skipped = [], overflow = [], written = new Set();
// An unresolvable option is a HARD failure, not a skip: a typo'd "Bi-Weekly" quietly
// leaving the pay period blank files a form that asserts nothing where the taxpayer
// said something. Collected so one run reports every bad value, then exits before save.
const optionErrors = [];

const absent = (v) => v === undefined || v === null || String(v).trim() === '';

const setText = (name, val) => {
  if (absent(val)) return;
  try { form.getTextField(name).setText(String(val)); filled++; written.add(name); }
  catch { skipped.push(name); }
};

const checkBox = (name) => {
  if (!name) return;
  // pdf-lib's check() sets each box's own on-value (/Yes or /1) automatically — no raw write.
  try { form.getCheckBox(name).check(); cbFilled++; written.add(name); }
  catch { skipped.push(name); }
};

// Booleans are folded onto the printed yes/no options so an intake record may carry
// either `true` or `"Yes"`. Everything else is compared trimmed + case-insensitively.
const normalize = (v) => (v === true ? 'yes' : v === false ? 'no' : String(v)).trim().toLowerCase();

const resolveOption = (options, raw) => {
  const want = normalize(raw);
  for (const [opt, target] of Object.entries(options))
    if (typeof target === 'string' && opt.trim().toLowerCase() === want) return target;
  return null;
};

const applyOption = (key, options, raw) => {
  if (absent(raw)) return;                       // absent input key is fine
  const target = resolveOption(options, raw);
  if (!target) {
    optionErrors.push({ key, value: raw, options: Object.keys(options) });
    return;
  }
  checkBox(target);
};

// scalar 1:1
for (const [key, name] of Object.entries(mapDoc.map || {})) setText(name, data[key]);

// named-option checkboxes
for (const [key, options] of Object.entries(mapDoc.checkboxes || {})) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) continue;
  applyOption(key, options, data[key]);
}

// repeatable groups — text + per-row yes/no pairs, overflow logged and dropped
for (const [gName, def] of Object.entries(mapDoc.groups || {})) {
  const rows = Array.isArray(data[def.source || gName]) ? data[def.source || gName] : [];
  const cap = Math.min(def.max ?? def.slots.length, def.slots.length);
  rows.forEach((row, i) => {
    if (i >= cap) { overflow.push(`${gName}[${i}]`); return; }   // drop, do not throw
    const slot = def.slots[i];
    for (const [sub, name] of Object.entries(slot.text || {})) setText(name, row?.[sub]);
    for (const [sub, options] of Object.entries(slot.checkboxes || {}))
      applyOption(`${gName}[${i}].${sub}`, options, row?.[sub]);
  });
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

// _deferred is validated for existence but must never be written. If a future change
// routes a value into one of these cells, that is a bug and it stops here.
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

// Exclusive checkbox groups — "at most one of these may be checked".
//
// Yes/No pairs and frequency sets on these forms are INDEPENDENT checkboxes, not radio
// groups: nothing in the PDF stops both from being checked. State is read back off the
// form (not from what this run checked) so a box already set in the source PDF still
// counts. A violation means the map or the input is wrong, so it fails loudly rather
// than silently unchecking one — silently picking a winner would file a form asserting
// something the taxpayer never said.
const violations = [];
for (const [set, targets] of Object.entries(mapDoc.exclusive || {})) {
  if (!Array.isArray(targets)) continue;   // `_note` prose, same convention as 433-F
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

mkdirSync('adapters/pdf/out', { recursive: true });
const outPath = `adapters/pdf/out/433a_filled_${data.intake_id || 'sample'}.pdf`;
writeFileSync(outPath, await pdf.save());
console.log(`filled ${filled} text fields + ${cbFilled} checkboxes -> ${outPath}`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0, 4).join(', ')}${skipped.length > 4 ? ' ...' : ''}`);
if (overflow.length) console.log(`OVERFLOW (dropped, form has no slot): ${overflow.join(', ')}`);
if (filled === 0) { console.error('0 fields filled — STOP.'); process.exit(2); }
