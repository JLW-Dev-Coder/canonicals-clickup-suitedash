// Fills Form 433-A (Sections 1-4 + the Section 5 income/expense grid) from a JSON intake record.
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
//   allowed      — the IRS USE ONLY column. Exactly two cells carry a fixed published
//                  amount and are auto-filled; the other 14 are named under
//                  `_never_autofill` and guarded against ever being written. The
//                  household the column is priced on is DERIVED from the form by
//                  default (IRS National Standards counts claimed dependents, not
//                  occupants) and the out-of-pocket line is priced per age band,
//                  because 433-A prints one health figure for a household that can
//                  span both bands.
//   _deferred    — documentation + existence-validation ONLY. Never filled.

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { formPath } from './read-form-revision.mjs';
import { verifyAppearances, reportAppearances } from './verify-appearances.mjs';

// The published Collection Financial Standards. Form-agnostic — every form in the 433
// series reads this one table, so it is not named after any of them. The map's
// `allowed.standards_source` still names the pre-rename filename; it is prose, and the
// map is Principal's artifact, so the live path is pinned here instead.
const STANDARDS_PATH = 'adapters/pdf/maps/irs-standards-2026.json';

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
// The IRS-allowable column. Every failure here is fatal rather than skipped: this column
// is the one an examiner reads as "what the IRS grants", so a figure that is present but
// wrong is far worse than the blank cell the examiner would otherwise complete. A missing
// standards table, an unrecognised age band, an unusable household size — all stop the run.
const allowedErrors = [];

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

// ---------------------------------------------------------------------------
// IRS USE ONLY / Allowable Expenses column.
//
// Exactly TWO cells are auto-filled — the two the IRS grants at a fixed published
// amount. The other 14 in the column are enumerated under `allowed._never_autofill`,
// validated for existence, and never written; each depends on a county table, a car
// count, a census region, or examiner discretion that this engine does not hold.
//
// The targets are taken from the map BY NAME, never by matching a field-name number to
// a printed line: on sheet 6 every internal suffix lags the printed line by one, so
// IRS35 is the allowed cell for PRINTED LINE 36 and IRS41 for printed line 42. Binding
// IRS36 to line 36 would validate, fill, and print the whole column one row off.
const allowedAudit = [];
// Warnings, unlike allowedErrors, do not stop the run. Each marks a place where the
// engine produced a defensible figure that an operator still has to stand behind: a
// departure from the IRS default, or a count that disagrees with the ages on the form.
// They print at the end of a successful run so a departure is on the record rather
// than silent — which is the entire reason the override is allowed to exist.
const allowedWarnings = [];
let householdReport = null;

// The three allowable inputs. These become immutable HubSpot property names, so they
// are pinned here AND cross-checked against the map's own declaration below: a map that
// renamed an input without this script following it would read an absent key and
// quietly fall back to a default, which is exactly the class of silent mispricing this
// column is built to prevent.
const HH_INPUT  = 'allowable_household_size';
const U65_INPUT = 'allowable_under_65_count';
const O65_INPUT = 'allowable_65_over_count';

// mmddyyyy -> whole years as of today, or null when the value is absent or unusable.
// Only ever feeds a WARNING, never a written figure, so an unparseable date degrades to
// "no evidence" rather than to a wrong allowance.
const ageFromDob = (raw) => {
  if (absent(raw)) return null;
  const s = String(raw).replace(/\D/g, '');
  if (s.length !== 8) return null;
  const mm = +s.slice(0, 2), dd = +s.slice(2, 4), yyyy = +s.slice(4, 8);
  if (!mm || !dd || !yyyy || mm > 12 || dd > 31) return null;
  const now = new Date();
  let age = now.getFullYear() - yyyy;
  const monthsPast = (now.getMonth() + 1) - mm;
  if (monthsPast < 0 || (monthsPast === 0 && now.getDate() < dd)) age--;
  return age >= 0 && age < 130 ? age : null;
};

const wholeAge = (raw) => {
  if (absent(raw)) return null;
  const n = Number(String(raw).trim());
  return Number.isInteger(n) && n >= 0 && n < 130 ? n : null;
};

const A = mapDoc.allowed;
if (A) {
  // Input-name drift check — see HH_INPUT above.
  const declaredHH = A.national_standards_total?.input;
  if (declaredHH && declaredHH !== HH_INPUT)
    allowedErrors.push({ what: 'input name drift', why: `map declares national_standards_total.input = ${JSON.stringify(declaredHH)}, this engine reads ${JSON.stringify(HH_INPUT)}` });
  const declaredOOP = A.out_of_pocket_health?.inputs;
  if (Array.isArray(declaredOOP) && !(declaredOOP.length === 2 && declaredOOP.includes(U65_INPUT) && declaredOOP.includes(O65_INPUT)))
    allowedErrors.push({ what: 'input name drift', why: `map declares out_of_pocket_health.inputs = ${JSON.stringify(declaredOOP)}, this engine reads ${JSON.stringify([U65_INPUT, O65_INPUT])}` });

  if (!existsSync(STANDARDS_PATH)) {
    allowedErrors.push({ what: 'standards table', why: `${STANDARDS_PATH} not found` });
  } else {
    const std = JSON.parse(readFileSync(STANDARDS_PATH, 'utf8'));

    // Shape check first, so an unusable table is reported as a shape problem rather
    // than silently producing NaN or a blank in the column that matters most.
    if (!std.national || !std.national['4'] || std.national['4'].total === undefined)
      allowedErrors.push({ what: 'national standards', why: `${STANDARDS_PATH} has no national[<size>].total; keys: ${Object.keys(std.national || {}).join(', ') || '(none)'}` });
    if (std.national_addl_total === undefined)
      allowedErrors.push({ what: 'per-additional-person amount', why: `${STANDARDS_PATH} has no national_addl_total` });
    if (!std.oop || typeof std.oop !== 'object')
      allowedErrors.push({ what: 'out-of-pocket health', why: `${STANDARDS_PATH} has no oop table` });

    // -----------------------------------------------------------------------
    // The household the whole column is priced on.
    //
    // IRS National Standards: "Generally, the total number of persons allowed for
    // National Standards should be the same as those allowed as dependents on the
    // taxpayer's most recent year income tax return." So the default is NOT the raw
    // headcount living in the home — it is the taxpayer, the spouse if married, and the
    // members actually CLAIMED. Rows that overflow the printed table are not on the
    // form and cannot be claimed by it, so they do not count either.
    //
    // The guidance says "generally", not "always", so a supplied value still wins. It
    // just does not get to win quietly.
    const hhDef  = mapDoc.groups?.household_members;
    const hhCap  = hhDef ? Math.min(hhDef.max ?? hhDef.slots.length, hhDef.slots.length) : 0;
    const slotted = (Array.isArray(data.household_members) ? data.household_members : []).slice(0, hhCap);
    const claimed = slotted.map((r, i) => ({ r, i })).filter(x => normalize(x.r?.claimed_on_1040) === 'yes');
    const married = normalize(data.marital_status) === 'married';
    const derivedHH = 1 + (married ? 1 : 0) + claimed.length;
    const derivedBasis = `taxpayer 1 + spouse ${married ? 1 : 0} (marital_status ${JSON.stringify(data.marital_status ?? null)}) + ${claimed.length} household member(s) with claimed_on_1040=yes among the ${slotted.length} row(s) that fit the printed ${hhCap}-row table`;

    const rawHH = data[HH_INPUT];
    let hh = derivedHH, hhPath = 'derived';
    if (!absent(rawHH)) {
      const n = Number(rawHH);
      if (!Number.isInteger(n) || n < 1) {
        allowedErrors.push({ what: HH_INPUT, why: `expected a positive integer, received ${JSON.stringify(rawHH)}` });
      } else {
        hh = n;
        hhPath = 'supplied';
        if (n !== derivedHH) {
          allowedWarnings.push([
            `${HH_INPUT} OVERRIDE: supplied ${n}, derived ${derivedHH} — the supplied value WINS and priced the allowable column.`,
            `  derived basis: ${derivedBasis}`,
            `  IRS National Standards say the count should GENERALLY match the dependents claimed on the most recent return, so a departure is permitted — but it is a judgement the operator owns, and it is recorded here rather than left silent.`,
          ].join('\n'));
        }
      }
    }
    householdReport = { hh, hhPath, derivedHH, derivedBasis, suppliedHH: absent(rawHH) ? null : rawHH };

    // Printed line 36 — Food, Clothing and Misc. 433-A consolidates the entire
    // national-standards basket onto ONE printed line, so this is the published TOTAL
    // for the household size, not a per-category figure. The table is published for
    // sizes 1-4; above that the size-4 total plus a flat per-additional-person amount.
    if (!allowedErrors.length && A.national_standards_total?.target) {
      const capped = Math.min(4, hh);
      const base = std.national[String(capped)].total;
      const extra = hh > 4 ? std.national_addl_total * (hh - 4) : 0;
      const total = base + extra;
      allowedAudit.push({
        printed_line: A.national_standards_total.printed_line,
        target: A.national_standards_total.target,
        keys: hh > 4 ? `national["4"].total = ${base}; national_addl_total = ${std.national_addl_total}` : `national["${capped}"].total = ${base}`,
        arithmetic: hh > 4
          ? `${base} + ${std.national_addl_total} x (${hh} - 4) = ${base} + ${extra} = ${total}`
          : `household of ${hh} -> national["${capped}"].total = ${total}`,
        value: total,
      });
      setText(A.national_standards_total.target, total, 'allowed.national_standards_total');
    }

    // Printed line 42 — Out of Pocket Health Care Costs.
    //
    // 433-A prints ONE out-of-pocket line for the whole household. 433-F prints the
    // per-person rate beside separate age-band headcounts, which is why a single
    // `age_band` input works there and does NOT work here: a household that spans both
    // bands cannot be described by one band, and pricing it at the under-65 rate
    // under-allows every person aged 65 or over — silently, on a filed statement.
    // Hence two counts, and hence the sum check below.
    //
    // The table still states its own unit in `oop_basis`. Two counts times a rate is
    // only the right arithmetic if the rate is per person, so an unstated or
    // non-per-person basis is a hard stop, not a default.
    const rawU = data[U65_INPUT], rawO = data[O65_INPUT];
    if (!allowedErrors.length && !(absent(rawU) && absent(rawO)) && A.out_of_pocket_health?.target) {
      // A count that is absent while its counterpart is present reads as zero. That is
      // not a guess: the sum check immediately below compares the pair against the
      // household actually priced on line 36, so a genuinely forgotten count fails
      // loudly there rather than quietly halving the allowance here.
      const parseCount = (raw, key) => {
        if (absent(raw)) return 0;
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 0) {
          allowedErrors.push({ what: key, why: `expected a non-negative integer, received ${JSON.stringify(raw)}` });
          return null;
        }
        return n;
      };
      const u65 = parseCount(rawU, U65_INPUT);
      const o65 = parseCount(rawO, O65_INPUT);

      const UK = 'under_65', OK_ = '65_over';
      const bands = Object.keys(std.oop || {});
      if (u65 !== null && o65 !== null) {
        if (std.oop[UK] === undefined || std.oop[OK_] === undefined) {
          allowedErrors.push({ what: 'out-of-pocket age bands', why: `${STANDARDS_PATH} must publish oop["${UK}"] and oop["${OK_}"]; it publishes: ${bands.join(', ') || '(none)'}` });
        } else if (std.oop_basis !== 'per_person_per_month') {
          // Deliberately NOT a list of accepted alternatives. Two headcounts times a
          // rate is per-person arithmetic; any other basis makes this line wrong in a
          // way no amount of care downstream recovers.
          allowedErrors.push({ what: 'oop_basis', why: `line 42 is computed as two headcounts x a PER-PERSON rate, but ${STANDARDS_PATH} states oop_basis = ${JSON.stringify(std.oop_basis)}. Refusing to guess.` });
        } else if (u65 + o65 !== hh) {
          // Hard stop, not a warning. If the age-band counts describe a different
          // household from the one line 36 was priced on, the two allowable cells are
          // computed on two different households and there is no correct output to
          // produce — so none is produced.
          allowedErrors.push({
            what: 'household disagreement between the two allowable cells',
            why: `${U65_INPUT} ${u65} + ${O65_INPUT} ${o65} = ${u65 + o65}, but line 36 was priced on a household of ${hh} (${hhPath}). The two allowable cells would be computed on two different households.`,
          });
        } else {
          const rU = std.oop[UK], rO = std.oop[OK_];
          const value = u65 * rU + o65 * rO;
          allowedAudit.push({
            printed_line: A.out_of_pocket_health.printed_line,
            target: A.out_of_pocket_health.target,
            keys: `oop["${UK}"] = ${rU}; oop["${OK_}"] = ${rO}; oop_basis = "${std.oop_basis}"`,
            arithmetic: `(${u65} x ${rU}) + (${o65} x ${rO}) = ${u65 * rU} + ${o65 * rO} = ${value}`,
            value,
          });
          setText(A.out_of_pocket_health.target, value, 'allowed.out_of_pocket_health');

          // Cross-check the counts against the ages the FORM carries: the printed age
          // column for each claimed member, plus the taxpayer and spouse dates of
          // birth. This warns and never auto-corrects — the ages on a form are a
          // snapshot taken when it was completed, and the operator may hold better
          // information than the page does.
          const people = [{ who: 'taxpayer', age: ageFromDob(data['2_tp_dob']), src: '2_tp_dob' }];
          if (married) people.push({ who: 'spouse', age: ageFromDob(data['2_sp_dob']), src: '2_sp_dob' });
          for (const { r, i } of claimed)
            people.push({ who: `household_members[${i}] ${r?.name ?? '(unnamed)'}`, age: wholeAge(r?.age), src: 'printed age column' });

          const known   = people.filter(p => p.age !== null);
          const unknown = people.filter(p => p.age === null);
          const evU = known.filter(p => p.age <  65).length;
          const evO = known.filter(p => p.age >= 65).length;
          if (evU !== u65 || evO !== o65) {
            const lines = [
              `age-band cross-check DISAGREES with the supplied counts (not corrected — the form's ages are a snapshot and you may know better).`,
              `  supplied: ${U65_INPUT} ${u65}, ${O65_INPUT} ${o65}`,
              `  form says: ${evU} under 65, ${evO} aged 65 or over${unknown.length ? `, ${unknown.length} with no usable age` : ''}`,
            ];
            for (const p of people) lines.push(`    ${p.age === null ? '  ?' : String(p.age).padStart(3)}  ${p.who} (${p.src})`);
            if (unknown.length) lines.push(`  A person with no usable age is counted in NEITHER band above, so a disagreement of exactly ${unknown.length} may be nothing more than that.`);
            lines.push(`  Line 42 was written from the SUPPLIED counts. If the form's reading is the right one, that figure is wrong — confirm before filing.`);
            allowedWarnings.push(lines.join('\n'));
          }
        }
      }
    }
  }
}

if (allowedErrors.length) {
  console.error(`ALLOWABLE STANDARD UNRESOLVED — ${allowedErrors.length} problem(s) in the IRS-allowable column. No PDF written.`);
  for (const e of allowedErrors) console.error(`  ${e.what}: ${e.why}`);
  console.error('  A wrong allowable on a filed collection statement is worse than a blank one, so nothing is written and nothing is guessed.');
  process.exit(2);
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

// Same guard for the 14 allowable cells that must never be auto-filled. `_deferred` is
// "not mapped yet"; `_never_autofill` is "mapped, understood, and deliberately blank" —
// a stronger statement, and the one the whole allowed engine exists to enforce. If a
// future change ever routes a value into one of these, it stops here rather than
// printing an IRS allowance nobody computed.
const neverTargets = new Set((mapDoc.allowed?._never_autofill?.fields || []).map(f => f.target).filter(Boolean));
const neverWritten = [...written].filter(n => neverTargets.has(n));
if (neverWritten.length) {
  console.error(`NEVER-AUTOFILL TARGET WRITTEN — ${neverWritten.length} allowable cell(s) received a value. No PDF written.`);
  neverWritten.forEach(n => console.error(`  - ${n}`));
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
// `updateFieldAppearances: true` is passed EXPLICITLY. It is pdf-lib's current default,
// but a default is not a guarantee: a version bump — or anyone adding an unrelated save
// option here, which drops it — produces a file with a complete, correct set of /V
// values that PRINTS BLANK, because a viewer draws the appearance stream, not /V. Such a
// file passes map validation, field-by-field read-back, the duplicate-write assertion
// and the coverage assertion. See verify-appearances.mjs, which also records why
// /NeedAppearances was considered as a third remedy and deliberately declined.
writeFileSync(outPath, await pdf.save({ updateFieldAppearances: true }));

// Pinning the flag states the intent; this proves the outcome. Every value stored above
// must be DRAWN by its widget's normal appearance stream or the run fails here — a fill
// that reports success has to mean the page actually shows the values.
if (reportAppearances(await verifyAppearances(outPath)) !== 0) process.exit(2);

console.log(`filled ${filled} text fields + ${cbFilled} checkboxes -> ${outPath}`);

if (allowedAudit.length) {
  console.log(`allowable standards (${allowedAudit.length} of 16 cells in the IRS column; the other ${16 - allowedAudit.length} are left blank on purpose):`);
  for (const a of allowedAudit) {
    console.log(`  printed line ${a.printed_line}`);
    console.log(`    target:     ${a.target}`);
    console.log(`    read:       ${STANDARDS_PATH} -> ${a.keys}`);
    console.log(`    arithmetic: ${a.arithmetic}`);
    console.log(`    written:    ${a.value}`);
  }
}

// Which household the allowable column was priced on, and how that number was reached.
// Printed on EVERY run, not only on disagreement: the figure drives both allowable cells,
// so "where did 6 come from" must never require reading the source to answer.
if (householdReport) {
  const { hh, hhPath, derivedHH, derivedBasis, suppliedHH } = householdReport;
  console.log(`household size used for the allowable column: ${hh} (path: ${hhPath})`);
  console.log(`  derived from the form: ${derivedHH} — ${derivedBasis}`);
  if (hhPath === 'supplied') {
    console.log(`  ${HH_INPUT} was supplied as ${JSON.stringify(suppliedHH)} and takes precedence over the derived default.`);
  } else {
    console.log(`  ${HH_INPUT} was absent, so the IRS default was derived and used.`);
  }
}

if (allowedWarnings.length) {
  console.log(`allowable column — ${allowedWarnings.length} warning(s):`);
  for (const w of allowedWarnings) console.log(`  WARNING ${w.replace(/\n/g, '\n  ')}`);
}
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0, 4).join(', ')}${skipped.length > 4 ? ' ...' : ''}`);
if (overflow.length) console.log(`OVERFLOW (dropped, form has no slot): ${overflow.join(', ')}`);
if (filled === 0) { console.error('0 fields filled — STOP.'); process.exit(2); }
