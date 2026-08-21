import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { verifyAppearances, reportAppearances } from './verify-appearances.mjs';
import { checkRowShapes, reportRowShapes, checkRowClasses, reportRowClasses, checkRowClassCollisions, reportRowClassCollisions } from './check-row-shape.mjs';
import { loadRounding, roundForOutput, auditRounding, reportRounding, miskeyedCells, reportCellSpelling } from './rounding.mjs';

// --saturated is an assertion about the INPUT, not about the form — the same one the gate
// makes at step 9. Here it decides whether a group row that carries no key for a column its
// slot declares stops the run or is reported. Flags are filtered out of the positional
// argument so the sample path stays argv-order-independent.
const argv      = process.argv.slice(2);
const saturated = argv.includes('--saturated');
const mapDoc = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
const data   = JSON.parse(readFileSync(argv.filter(a => !a.startsWith('--'))[0] || 'samples/433f.sample.json', 'utf8'));
// The Collection Financial Standards table is form-agnostic — every form in the 433
// series reads the same published figures — so it is NOT named after any one form.
const STANDARDS = 'adapters/pdf/maps/irs-standards-2026.json';
const std    = existsSync(STANDARDS) ? JSON.parse(readFileSync(STANDARDS, 'utf8')) : null;
const pdf    = await PDFDocument.load(readFileSync(mapDoc.pdf));
const form   = pdf.getForm();

// C-05: TWO GROUPS OF THE SAME ASSET CLASS WITH NOTHING KEEPING THEM APART.
// Asked HERE, before a single row is read, because it is a question about the MAP and the
// answer decides whether any row can be placed at all. A form that prints the same class in
// two tables must give each group a discriminator, or nothing decides which printed table a
// row lands in and the answer comes from which input property it happened to be stored in —
// which is defect D1 one level up. See check-row-shape.mjs.
if (reportRowClassCollisions(checkRowClassCollisions(mapDoc), "adapters/pdf/maps/433f.map.json")) process.exit(2);


let filled = 0; const skipped = [];
// A value the FIELD refuses is a HARD failure, not a skip — the same rule fill-433a.mjs
// already runs under. 433-F carries cells that cannot hold what the IRS prints beside
// them: the digital-asset value column is /MaxLen 12 while the form's own printed example,
// "10 Bitcoins $64,600 USD", is 23 characters, and the two final-payment year boxes are
// /MaxLen 2. pdf-lib throws rather than truncating; catching that as a "skip" would leave
// the cell blank on a filed statement with nothing but a one-line note about it, and
// truncating would print a crypto holding the taxpayer never gave. So an over-long value
// stops the run and NAMES the cell, so an operator shortens it deliberately.
const capacityErrors = [];
// PER-BLOCK DECLARED ROUNDING. 433-F prints no rounding instruction and its map declares no
// `rounding`, so every value below passes through untouched. See adapters/pdf/rounding.mjs and
// the same note in fill-433a.mjs for why it is wired in on a form that does not use it.
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
  if (max !== undefined && s.length > max) {
    capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s });
    return;
  }
  try { field.setText(s); filled++; }
  catch (e) { capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s, why: e.message }); }
};

let cbFilled = 0;
const checkBox = (name) => {
  if (!name) return;
  // pdf-lib's check() sets each box's own on-value (/Yes or /1) automatically — no raw write.
  try { form.getCheckBox(name).check(); cbFilled++; } catch { skipped.push(name); }
};
const truthy = (v) => v === true || ['true', 'yes', '1', 'y'].includes(String(v).trim().toLowerCase());

// composite name + address
const comp = mapDoc.special?.composite_name_address;
if (comp) { const parts = comp.from.map(k => data[k]).filter(Boolean); if (parts.length) setText(comp.pdf, parts.join(comp.join)); }

// scalar 1:1
//
// No composite-key skip here. `433f_tp_name` used to appear BOTH in `map` (bound straight to
// NamesAddress[0]) and in `special.composite_name_address.from`, and the only thing stopping
// the second write from clobbering the first was a `comp.from.includes(key)` guard on this
// loop. That guard hid a double binding rather than fixing one — and it would have hidden the
// next one silently too. The map now binds that target exactly once, through the composite,
// so the loop needs no exception and the duplicate-write gate can actually see the map.
for (const [key, name] of Object.entries(mapDoc.map)) {
  setText(name, data[key], key);
}

// split — one input value across abutting boxes.
//
// THE SAME CONSTRUCT fill-433a.mjs RUNS, not a second mechanism. 433-F needs it for exactly
// one thing: Section C's "Date of Final Payment (mo/yr)" is two cells, each /MaxLen 2, so a
// canonical four-digit-year date cannot pass through and the year on the page is the printed
// two. `strip` removes the caller's formatting, each part consumes `chars` source characters,
// and `format` masks a chunk ('#' takes one chunk character, anything else is literal).
//
// The length check is EXACT, not "at least": a stripped value longer than the parts consume
// would leave characters on the floor, which is truncation by another name. That is the
// property worth having here — an operator who supplies 06/2027 gets a loud stop rather than
// a silent "20" printed in the year box, which would read as the year 2020 on a signed form.
const splitErrors = [];
const applyFormat = (chunk, format) => {
  let out = '', i = 0;
  for (const ch of format) out += ch === '#' ? chunk[i++] : ch;
  return out;
};
for (const [key, def] of Object.entries(mapDoc.split || {})) {
  if (!def || typeof def !== 'object' || !Array.isArray(def.parts)) continue;   // `_why` prose
  const raw = data[key];
  if (raw === undefined || raw === null || String(raw).trim() === '') continue;  // absent is fine
  const stripped = def.strip ? String(raw).replace(new RegExp(def.strip, 'g'), '') : String(raw);
  const expected = def.parts.reduce((n, p) => n + (p.chars ?? 0), 0);
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

// repeatable groups (array input, else scalar fallback)
//
// The resolved rows are KEPT (groupRows), because the checkbox layer below flags individual
// ROWS — an account being a business account, a property being the primary residence — and
// it has to flag the same rows the text layer just printed. Reading `data.accounts` directly
// down there meant the flags only ever fired for records that supplied ARRAYS, and silently
// did nothing for every record that came through the scalar fallback. A HubSpot record is
// always the second kind.
const overflow = [];
const groupRows = {};
const groupSource = {};
for (const [g, def] of Object.entries(mapDoc.groups || {})) {
  let rows = Array.isArray(data[def.array]) ? data[def.array] : null;
  const fromArray = rows !== null;
  // A fallback entry may declare `_class` — the asset class the map knows it produced. It is
  // the map's own statement, not a column, so it is set on the row rather than read from a
  // property. Underscore-prefixed keys are prose or declaration everywhere else in this map;
  // the same convention holds here.
  if (!rows) rows = (def.fallback || [])
    .map(fb => {
      const r = {};
      for (const [sub, key] of Object.entries(fb)) if (!sub.startsWith('_')) r[sub] = data[key];
      const built = Object.values(r).some(v => v !== undefined && v !== null && v !== '');
      if (built && fb._class && def.row_class?.column) r[def.row_class.column] = fb._class;
      return r;
    })
    .filter(r => Object.entries(r).some(([k, v]) => k !== def.row_class?.column && v !== undefined && v !== null && v !== ''));
  groupRows[g] = rows;
  groupSource[g] = { rows, fromArray };
  rows.forEach((row, i) => {
    if (i >= def.slots.length) { overflow.push(`${g}[${i}]`); return; }
    // ONE CELL SPELLING. `groups.${g}.slots[${i}].${sub}` is what this line used to pass, and
    // adapters/pdf/rounding.mjs cannot resolve it: blockFor reads "group[row].column", the spelling
    // `exclusive`, the totals predicate, the name-lie registry's `bound_to` and the gate's own
    // addressing all use. Every group money cell on this form therefore came back with no block and
    // was written unrounded — invisible while this map declared no rounding, and one wrong printed
    // figure the moment it did. See rounding.mjs MISKEYED_CELL, which asserts the shape on every run.
    for (const [sub, name] of Object.entries(def.slots[i])) setText(name, row[sub], `${g}[${i}].${sub}`);
  });
}

// Every column the slot declares, or the run says which ones were not supplied. A partial
// column match used to pass silently and print the rest of the row's cells empty.
const rowShape = checkRowShapes(mapDoc, groupSource);
// And a row must be allowed to say what it IS — see check-row-shape.mjs. With one vocabulary
// across the five serialized tables a bank-account row and an investment row are structurally
// identical, so the class is the only thing that can keep them in their own printed tables.
const rowClass = checkRowClasses(mapDoc, groupSource);

// checkboxes (address-differs, account business flags, real-estate PR/CO, pay frequency)
//
// INPUT KEYS ARE READ THROUGH `input()`, NEVER OFF `data` DIRECTLY.
//
// A hand-authored sample writes `pay_freq`. A record fetched from HubSpot writes
// `433f_pay_freq`, because hs-fetch-433f.mjs keys the record by the registry's LOGICAL key
// and every logical key on this form carries the form prefix. The text layers never noticed:
// `map` is keyed by prefixed names already, and the group fallback names its own keys. Only
// this layer reached for bare names, so on a real HubSpot record the ENTIRE checkbox layer
// silently did nothing and the form came out with no boxes ticked at all. Nothing errored,
// nothing was skipped, and a PDF was written — which is why the round trip is worth running
// against a live record instead of only against the sample that was written to satisfy it.
//
// `address_differs` already had the prefixed alias spelled out inline; this generalises that
// one-off into the rule.
const PREFIX = `${mapDoc.form}_`;                     // "433f_" — from the map, not hardcoded
const input = (name) => data[name] ?? data[PREFIX + name];

const cb = mapDoc.checkboxes;
if (cb) {
  if (cb.address_differs && truthy(input('address_differs') ?? data['433f_addr_differs'])) checkBox(cb.address_differs);

  // account business flag — index-aligned to the rows the text layer actually printed.
  //
  // ONE ARRAY PER ACCOUNTS GROUP. Until defect D1 this read a single `cb.account_business` of
  // four entries against a single four-slot `accounts` group that spanned two printed tables,
  // so the flag inherited that group's routing whole — including the part that filed a bank
  // account under INVESTMENTS. The groups are separate now and so are their flag columns; each
  // array aligns to its own group's rows and cannot reach the other table.
  for (const [g, key] of [['bank_accounts', 'account_business_bank'],
                          ['investments',   'account_business_investments']]) {
    const flags = cb[key];
    if (!Array.isArray(flags)) continue;
    (groupRows[g] || []).forEach((acct, i) => {
      // `is_business_account` — the canonical row flag, replacing this form's `bp`
      // business/personal string. Read through the same truthy() every other flag on this
      // form goes through, so a boolean, "yes" and "true" all behave the same way.
      if (i < flags.length && truthy(acct?.is_business_account)) checkBox(flags[i]);
    });
  }

  // real estate PR/CO by row kind ('primary' -> primary box, 'other' -> other box).
  //
  // NOTE: the scalar fallback for this group carries no `kind`, and no registry property
  // supplies one, so a record that arrives from HubSpot cannot answer PR/CO at all and both
  // boxes stay blank. That is a gap in the PROPERTY SET, not in this code, and it is left
  // visible rather than guessed at — inferring "primary" from a description that happens to
  // read "Primary residence" would put a claim on a filed collection statement that the
  // taxpayer never made.
  const reRows = groupRows.real_estate || [];
  if (Array.isArray(cb.real_estate)) {
    reRows.forEach((re, i) => {
      if (i >= cb.real_estate.length) return;
      const kind = String(re?.kind ?? '').trim().toLowerCase();
      if (kind === 'primary') checkBox(cb.real_estate[i].primary);
      else if (kind === 'other') checkBox(cb.real_estate[i].other);
    });
  }

  // pay frequency (taxpayer + spouse) via freq -> index
  if (cb.pay_freq) {
    const idx = cb.pay_freq.index || {};
    const freqIndex = (v) => idx[String(v ?? '').trim().toLowerCase().replace(/[\s._-]/g, '')];
    const fill = (val, arr) => { const i = freqIndex(val); if (i !== undefined && Array.isArray(arr) && arr[i]) checkBox(arr[i]); };
    fill(input('pay_freq'), cb.pay_freq.you);
    fill(input('spouse_pay_freq'), cb.pay_freq.spouse);
  }
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
  if (!Array.isArray(targets)) continue;   // `_note` prose, same convention as `special`
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

// IRS allowable standards (National food-group by household size + OOP by age)
let allowedFilled = 0;
if (std && mapDoc.allowed) {
  const before = filled;
  const rawHH = parseInt(data.household_size ?? data['433f_hh_size'] ?? '', 10);
  const ageBand = input('age_band');
  const hhKey = String(Math.min(4, Math.max(1, rawHH || 1)));
  const natl = std.national[hhKey];
  const A = mapDoc.allowed.national_by_household;
  if (natl && A) {
    setText(A.food, natl.food); setText(A.housekeeping, natl.housekeeping);
    setText(A.apparel, natl.apparel); setText(A.personal_care, natl.personal_care);
    setText(A.misc, natl.misc);
    const total = rawHH > 4 ? std.national['4'].total + std.national_addl_total * (rawHH - 4) : natl.total;
    setText(A.total, total);
  }
  const oop = ageBand === '65_over' ? std.oop['65_over'] : std.oop['under_65'];
  if (mapDoc.allowed.oop_by_age && (ageBand || rawHH)) setText(mapDoc.allowed.oop_by_age, oop);
  allowedFilled = filled - before;
}

// Values the FORM refuses, and splits that do not fill their parts exactly. Both stop the
// run BEFORE anything is written, and both name the input key rather than only the widget,
// because the fix is always to the record. Reported together so one run surfaces every one.
if (capacityErrors.length || splitErrors.length) {
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
  }
  if (splitErrors.length) {
    console.error(`SPLIT LENGTH MISMATCH — ${splitErrors.length} value(s) do not fill their parts exactly. No PDF written.`);
    for (const e of splitErrors) {
      console.error(`  ${e.key}: ${JSON.stringify(e.raw)} strips to ${JSON.stringify(e.stripped)} (${e.len} chars), the parts consume ${e.expected}`);
    }
    console.error('  Correct the input — a split is never padded or truncated, and no part of a');
    console.error('  short value is written. Section C wants mo/yr with a TWO-digit year: 06/27.');
  }
  process.exit(2);
}

// Row shape. Reported in every mode, and a STOP under --saturated, alongside the other
// stops rather than before them so one run surfaces every problem it can see.
if (reportRowShapes(rowShape, saturated) + reportRowClasses(rowClass)) process.exit(2);

mkdirSync('adapters/pdf/out', { recursive: true });
const outPath = `adapters/pdf/out/433f_filled_${data.intake_id || 'sample'}.pdf`;
// Explicit, for the same reason as fill-433a.mjs: pdf-lib defaults this to true today,
// but a file whose appearance streams were never regenerated carries every correct /V
// value and PRINTS BLANK. Pinning it means a change of default cannot silently produce
// one. See verify-appearances.mjs, including why /NeedAppearances was declined.

// ─── THE CELL SPELLING, ASSERTED ────────────────────────────────────────────────────────
//
// Every key this engine looked a rounding block up by must be in a shape blockFor can
// resolve. A group cell keyed `groups.G.slots[i].col` comes back with NO block and is written
// unrounded, and on a form that declares no rounding that is indistinguishable from correct —
// which is exactly how it survived on two engines until 433-B(OIC) declared its blocks and one
// printed figure came out with cents against rounded neighbours. Asserted here whether or not
// this form declares a block, so a form with none proves the no-op instead of skipping.
if (reportCellSpelling(miskeyedCells(cellKeysUsed), 'fill-433f.mjs', cellKeysUsed.size) > 0) {
  console.error('  No PDF written. Re-key the group cells as "group[row].column" — the one cell spelling in this repo.');
  process.exit(2);
}

writeFileSync(outPath, await pdf.save({ updateFieldAppearances: true }));

// And prove it, rather than trusting the flag: every stored value must be drawn.
if (reportAppearances(await verifyAppearances(outPath)) !== 0) process.exit(2);

console.log(`filled ${filled} fields (${allowedFilled} allowable-standard) + ${cbFilled} checkboxes -> ${outPath}`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0,4).join(', ')}${skipped.length>4?' ...':''}`);
if (overflow.length) console.log(`OVERFLOW: ${overflow.join(', ')}`);
if (filled === 0) { console.error('0 fields filled — STOP.'); process.exit(2); }
