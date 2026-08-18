import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { verifyAppearances, reportAppearances } from './verify-appearances.mjs';

const mapDoc = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
const data   = JSON.parse(readFileSync(process.argv[2] || 'samples/433f.sample.json', 'utf8'));
// The Collection Financial Standards table is form-agnostic — every form in the 433
// series reads the same published figures — so it is NOT named after any one form.
const STANDARDS = 'adapters/pdf/maps/irs-standards-2026.json';
const std    = existsSync(STANDARDS) ? JSON.parse(readFileSync(STANDARDS, 'utf8')) : null;
const pdf    = await PDFDocument.load(readFileSync(mapDoc.pdf));
const form   = pdf.getForm();

let filled = 0; const skipped = [];
const setText = (name, val) => {
  if (val === undefined || val === null || val === '') return;
  try { form.getTextField(name).setText(String(val)); filled++; } catch { skipped.push(name); }
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
  setText(name, data[key]);
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
for (const [g, def] of Object.entries(mapDoc.groups || {})) {
  let rows = Array.isArray(data[def.array]) ? data[def.array] : null;
  if (!rows) rows = (def.fallback || [])
    .map(fb => { const r = {}; for (const [sub, key] of Object.entries(fb)) r[sub] = data[key]; return r; })
    .filter(r => Object.values(r).some(v => v !== undefined && v !== null && v !== ''));
  groupRows[g] = rows;
  rows.forEach((row, i) => {
    if (i >= def.slots.length) { overflow.push(`${g}[${i}]`); return; }
    for (const [sub, name] of Object.entries(def.slots[i])) setText(name, row[sub]);
  });
}

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

  // account business flag — index-aligned to the rows the text layer actually printed
  const acctRows = groupRows.accounts || [];
  if (Array.isArray(cb.account_business)) {
    acctRows.forEach((acct, i) => {
      if (i < cb.account_business.length && String(acct?.bp ?? '').trim().toLowerCase() === 'business')
        checkBox(cb.account_business[i]);
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

mkdirSync('adapters/pdf/out', { recursive: true });
const outPath = `adapters/pdf/out/433f_filled_${data.intake_id || 'sample'}.pdf`;
// Explicit, for the same reason as fill-433a.mjs: pdf-lib defaults this to true today,
// but a file whose appearance streams were never regenerated carries every correct /V
// value and PRINTS BLANK. Pinning it means a change of default cannot silently produce
// one. See verify-appearances.mjs, including why /NeedAppearances was declined.
writeFileSync(outPath, await pdf.save({ updateFieldAppearances: true }));

// And prove it, rather than trusting the flag: every stored value must be drawn.
if (reportAppearances(await verifyAppearances(outPath)) !== 0) process.exit(2);

console.log(`filled ${filled} fields (${allowedFilled} allowable-standard) + ${cbFilled} checkboxes -> ${outPath}`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0,4).join(', ')}${skipped.length>4?' ...':''}`);
if (overflow.length) console.log(`OVERFLOW: ${overflow.join(', ')}`);
if (filled === 0) { console.error('0 fields filled — STOP.'); process.exit(2); }
