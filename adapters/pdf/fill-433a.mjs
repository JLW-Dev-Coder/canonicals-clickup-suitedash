// Fills Form 433-A (Sections 1-3 + Section 4 lines 12-14, 18-19) from a JSON intake record.
//
// CLI:  node adapters/pdf/fill-433a.mjs [samples/433a.sample.json]
//
// Shape differences from fill-433f.mjs, all driven by the 433-A map:
//   map          — scalar 1:1, same setText semantics (empty/absent is skipped, never
//                  written as "undefined"/"null").
//   split        — ONE input value distributed across abutting boxes (phone area/number,
//                  EIN prefix/remainder). `strip` removes formatting the caller typed,
//                  each part consumes `chars` source characters, optional `format` masks
//                  the chunk (# = one chunk char, anything else literal). Exists so one
//                  real-world value needs one HubSpot custom field, not two — and CF
//                  names are immutable once provisioned.
//   checkboxes   — input_key -> { option: target }. The input NAMES its option instead
//                  of indexing into a positional array, so a pay-period value can never
//                  land on the wrong box because an assumed print order was wrong.
//   groups       — repeatable rows: household_members (5 slots, text + per-row yes/no
//                  pairs), bank_accounts (4), investments (4), real_property (3) and
//                  vehicles (3). A slot's `checkboxes` is OPTIONAL — the Section 4 asset
//                  tables are text-only — and rows past the last slot are logged and
//                  dropped, never thrown and never written over an earlier row.
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
// Same reasoning for a value the FIELD refuses. Several 433-A cells carry a /MaxLen
// (the name box is 45, the two EIN prefix boxes are 2), and pdf-lib throws rather than
// truncating. Catching that as a "skip" would blank the cell silently, which is the
// failure this engine exists to prevent — so it stops the run and names the field.
const capacityErrors = [];
// A split whose stripped input does not supply exactly the characters its parts consume.
// Padding would invent digits and truncating would drop them; either way a half-written
// EIN or a phone missing its last digit is worse on a filed form than an empty cell. So:
// write nothing for that key, collect, and stop the run before anything is saved.
const splitErrors = [];

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
for (const [key, name] of Object.entries(mapDoc.map || {})) setText(name, data[key], key);

// split — one input value across abutting boxes.
//
// `format` masks a consumed chunk: '#' takes one chunk character, anything else is a
// literal, so a 7-digit chunk with "###-####" prints as 555-0100. Parts go through the
// same setText() as everything else, so the /MaxLen capacity guard covers them — a part
// that will not fit stops the run rather than truncating into a wrong number.
const applyFormat = (chunk, format) => {
  let out = '', i = 0;
  for (const ch of format) out += ch === '#' ? chunk[i++] : ch;
  return out;
};

for (const [key, def] of Object.entries(mapDoc.split || {})) {
  if (!def || typeof def !== 'object' || !Array.isArray(def.parts)) continue;  // `_why` prose
  const raw = data[key];
  if (absent(raw)) continue;                     // absent input key is fine, same as `map`
  const stripped = def.strip ? String(raw).replace(new RegExp(def.strip, 'g'), '') : String(raw);
  const expected = def.parts.reduce((n, p) => n + (p.chars ?? 0), 0);
  // Exact, not "at least": a stripped value LONGER than the parts consume would leave
  // characters on the floor, which is truncation by another name.
  if (stripped.length !== expected) {
    splitErrors.push({ key, raw, stripped, len: stripped.length, expected });
    continue;                                    // nothing written for this key
  }
  let at = 0;
  def.parts.forEach((part, i) => {
    const chunk = stripped.slice(at, at + part.chars);
    at += part.chars;
    setText(part.target, part.format ? applyFormat(chunk, part.format) : chunk, `${key}.parts[${i}]`);
  });
}

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
    for (const [sub, name] of Object.entries(slot.text || {})) setText(name, row?.[sub], `${gName}[${i}].${sub}`);
    for (const [sub, options] of Object.entries(slot.checkboxes || {}))
      applyOption(`${gName}[${i}].${sub}`, options, row?.[sub]);
  });
}

if (splitErrors.length) {
  console.error(`SPLIT LENGTH MISMATCH — ${splitErrors.length} value(s) do not fill their parts exactly. No PDF written.`);
  for (const e of splitErrors) {
    console.error(`  key "${e.key}": stripped length ${e.len}, expected ${e.expected}`);
    console.error(`    input:    ${JSON.stringify(e.raw)}`);
    console.error(`    stripped: ${JSON.stringify(e.stripped)}`);
  }
  console.error('  Correct the input — a split is never padded or truncated, and no part of a short value is written.');
  process.exit(2);
}

if (capacityErrors.length) {
  console.error(`FIELD REJECTED VALUE — ${capacityErrors.length} value(s) do not fit their cell. No PDF written.`);
  for (const e of capacityErrors) {
    console.error(`  key "${e.key}": ${e.len} chars into a field with maxLength=${e.max}`);
    console.error(`    field: ${e.name}`);
    console.error(`    value: ${JSON.stringify(e.value)}`);
    if (e.why) console.error(`    pdf-lib: ${e.why}`);
  }
  console.error('  Shorten the input, or tell Principal the target is the wrong cell — truncating a filed form is not an acceptable fallback.');
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
