// Assert that every mapped group row prints under the heading it is declared to belong to.
//
// CLI:  node adapters/pdf/verify-headings.mjs <form> [filled.pdf] [--audit]
// Exit: 0 = every group row sits under its declared heading, 2 = it does not (named).
//       --audit always exits 0 and prints the full slot -> heading table for every group,
//       which is the straddle audit: does each group's slot list stay under ONE heading.
//
// WHY THIS CHECK EXISTS
// ---------------------
// Nine gate steps prove a great deal about these forms and not one of them ties a widget
// to the words printed above it. Validation proves the target exists. Duplicate-write
// proves one key owns it. Coverage proves nothing is unreferenced. The partition proves
// every field is in an accounted-for state. Appearances prove the value is drawn. The
// tripwires prove the totals reconcile.
//
// A checking account printed under INVESTMENTS passes all six. The figures are individually
// correct, the totals still add up, and the form is internally consistent. Nothing about it
// looks wrong — on a document signed under penalty of perjury.
//
// The missing assertion is the one a human makes instantly and no check made at all:
// LOOK UP. What does the heading above this row say.
//
// HEADINGS COME FROM GEOMETRY AND PRINTED TEXT, NEVER FROM THE FIELD NAME
// ----------------------------------------------------------------------
// The internal names are exactly what lied. On 433-F the four bound account rows are
// AccountsTable[0].#subform[1..2] and AccountsTable[1].#subform[1..2]; read in that order
// they look like "the first table, then the second". On the page, AccountsTable[1] prints
// ABOVE AccountsTable[0] — table 1 is PERSONAL BANK ACCOUNTS and table 0 is INVESTMENTS.
// A check that trusted the name would have confirmed the defect instead of finding it.
//
// So: the declared heading is located as printed TEXT on the page, each heading owns the
// vertical band from its own baseline down to the next declared heading, and a widget is
// placed in a band by its RECTANGLE. Both coordinate sets come from page-geometry.mjs, the
// same module correlate-labels.mjs uses to author the maps in the first place.
//
// THE DECLARATION IS DATA, NOT CODE
// ---------------------------------
// adapters/pdf/maps/<form>.headings.json. No form is named in this file's logic; five more
// forms follow and each needs a declaration, not an edit here.
//
// A group declares ONE heading. That is the whole point: a group binds an ordered slot list
// and a caller fills it in order, so if the slots span two printed sections then slot order
// silently decides which section a row lands in — which is the defect, not an implementation
// detail. A group that genuinely spans sections must say so with an explicit per-slot
// `slot_headings` list AND a `straddle_why`, so the span is a decision on the record rather
// than an accident nobody looked for.

import { readFileSync, existsSync } from 'node:fs';
import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { readPrintedText, readWidgetGeometry } from './page-geometry.mjs';

const argv = process.argv.slice(2);
const audit = argv.includes('--audit');
const [form, filledPath] = argv.filter(a => !a.startsWith('--'));
if (!form) {
  console.error('usage: node adapters/pdf/verify-headings.mjs <form> [filled.pdf] [--audit]');
  process.exit(2);
}

const mapPath      = `adapters/pdf/maps/${form}.map.json`;
const headingsPath = `adapters/pdf/maps/${form}.headings.json`;
const mapDoc       = JSON.parse(readFileSync(mapPath, 'utf8'));

if (!existsSync(headingsPath)) {
  console.error(`verify-headings: ${form}`);
  console.error(`  no ${headingsPath}.`);
  console.error('');
  console.error('  This form has no heading declaration, so nothing ties its group rows to the');
  console.error('  words printed above them. That is not a passing state — it is the state 433-F');
  console.error('  was in when a checking account was authored under INVESTMENTS. Author the');
  console.error('  declaration from the printed form.');
  process.exit(2);
}
const decl = JSON.parse(readFileSync(headingsPath, 'utf8'));

const srcPdf = mapDoc.pdf || `adapters/pdf/forms/f${form}.pdf`;
const bytes  = readFileSync(srcPdf);

// A heading declaration is authored against one revision. The IRS moves sections between
// revisions, so a declaration carried forward unpinned would assert last year's layout
// against this year's page and pass.
if (decl.form_revision && mapDoc.form_revision && decl.form_revision !== mapDoc.form_revision) {
  console.error(`verify-headings: ${form}`);
  console.error(`  the heading declaration pins Rev. ${decl.form_revision}, the map pins Rev. ${mapDoc.form_revision}.`);
  console.error('  Re-author the declaration against the printed form; do not just bump the pin.');
  process.exit(2);
}

const printed = await readPrintedText(bytes);
const { widgets, originNotes } = await readWidgetGeometry(bytes);

console.log(`verify-headings: ${form}`);
console.log(`  map:         ${mapPath}`);
console.log(`  declaration: ${headingsPath}`);
console.log(`  pdf:         ${srcPdf}`);
if (originNotes.length) console.log(`  NOTE non-zero MediaBox origin: ${originNotes.join('; ')}`);

const errors = [];
const err = (msg) => { errors.push(msg); };

// --- locate every declared heading as printed text --------------------------------------
// A heading that cannot be found verbatim on its declared page is a hard stop, not a
// downgrade to "unknown": the whole check rests on these anchors, and a missing anchor
// means either the declaration is wrong or the PDF is a different revision. Either way
// nothing below this line could be trusted.
const bands = new Map();   // page -> [{id, y, x1, x2, text}] sorted by descending y
const byId  = new Map();

for (const h of decl.headings || []) {
  const items = (printed[h.page - 1]?.items || []).filter(t => t.str === h.text);
  if (items.length === 0) {
    err(`heading "${h.id}" declares the printed text ${JSON.stringify(h.text)} on page ${h.page} — no such text is drawn on that page.`);
    continue;
  }
  let pick = items;
  if (items.length > 1) {
    // Two identical captions on one page (433-F prints the same account column header over
    // both tables). The declaration disambiguates with an x hint; guessing would pick a
    // band boundary at random.
    if (typeof h.near_x === 'number') pick = [items.reduce((a, b) => (Math.abs(a.x1 - h.near_x) <= Math.abs(b.x1 - h.near_x) ? a : b))];
    else {
      err(`heading "${h.id}" text ${JSON.stringify(h.text)} appears ${items.length} times on page ${h.page}. Add "near_x" to say which one anchors the band.`);
      continue;
    }
  }
  const t = pick[0];
  if (byId.has(h.id)) { err(`heading id "${h.id}" is declared more than once.`); continue; }
  const rec = { id: h.id, page: h.page, y: t.y1, x1: t.x1, x2: t.x2, text: t.str };
  byId.set(h.id, rec);
  if (!bands.has(h.page)) bands.set(h.page, []);
  bands.get(h.page).push(rec);
}
for (const list of bands.values()) list.sort((a, b) => b.y - a.y);

if (errors.length) {
  console.error('');
  errors.forEach(e => console.error(`  ERROR ${e}`));
  console.error('');
  console.error(`verify-headings FAILED for ${form} — the declaration does not match the printed page.`);
  process.exit(2);
}

// --- widget rect -> the heading whose band contains it -----------------------------------
const rectOf = new Map();
for (const w of widgets) if (w.rect && !rectOf.has(w.name)) rectOf.set(w.name, w);

/** The nearest declared heading printed ABOVE this rect on the same page. */
function headingFor(target) {
  const w = rectOf.get(target);
  if (!w) return { id: null, why: 'no widget rectangle (field absent from the PDF)' };
  if (w.page === null) return { id: null, why: 'widget is on no page' };
  const yc = (w.rect[1] + w.rect[3]) / 2;
  const list = bands.get(w.page) || [];
  // `list` descends by y, so the LAST entry still above the widget is the nearest one —
  // taking the first would attribute every row on the page to the topmost heading.
  const above = list.filter(h => h.y > yc);
  const hit = above[above.length - 1];
  if (!hit) return { id: null, why: `page ${w.page}, y=${yc.toFixed(1)} — above every declared heading on that page`, w };
  return { id: hit.id, heading: hit, w, yc };
}

// --- which rows the record actually printed ----------------------------------------------
let filledText = null, checkedBox = null;
if (filledPath && existsSync(filledPath)) {
  const fpdf = await PDFDocument.load(readFileSync(filledPath));
  const fform = fpdf.getForm();
  filledText = (t) => { try { const f = fform.getField(t); return f instanceof PDFTextField ? (f.getText() || '') : null; } catch { return null; } };
  checkedBox = (t) => { try { const f = fform.getField(t); return f instanceof PDFCheckBox ? f.isChecked() : null; } catch { return null; } };
}

// --- walk the map's groups ----------------------------------------------------------------
/** Every text target on a slot, whichever shape the slot uses (flat, or nested under `text`). */
const slotTextTargets = (slot) => {
  const src = (slot && typeof slot === 'object' && slot.text && typeof slot.text === 'object') ? slot.text : slot;
  return Object.entries(src || {}).filter(([, v]) => typeof v === 'string').map(([col, target]) => ({ col, target }));
};
/** Checkbox targets carried on the slot itself (433-A shape). */
const slotCheckTargets = (slot) => {
  const out = [];
  const cbs = slot && typeof slot === 'object' ? slot.checkboxes : null;
  for (const [q, v] of Object.entries(cbs || {})) {
    if (typeof v === 'string') out.push({ col: q, target: v });
    else for (const [opt, t] of Object.entries(v || {})) if (typeof t === 'string') out.push({ col: `${q}.${opt}`, target: t });
  }
  return out;
};

const mapGroups = Object.keys(mapDoc.groups || {});
const declGroups = Object.keys(decl.groups || {});
for (const g of mapGroups) if (!declGroups.includes(g)) err(`the map binds group "${g}" and ${headingsPath} declares no heading for it. Every group prints somewhere; a group with no declared heading is a group nobody has checked.`);
for (const g of declGroups) if (!mapGroups.includes(g)) err(`${headingsPath} declares group "${g}" and the map does not bind it.`);

const report = [];

for (const g of mapGroups) {
  const gdef = mapDoc.groups[g];
  const d = decl.groups?.[g];
  if (!d) continue;
  const slots = Array.isArray(gdef.slots) ? gdef.slots : [];

  const perSlot = d.slot_headings || null;
  if (perSlot && perSlot.length !== slots.length) {
    err(`group "${g}": slot_headings declares ${perSlot.length} entries, the map binds ${slots.length} slots.`);
    continue;
  }
  const distinctDeclared = new Set(perSlot || [d.heading]);
  if (distinctDeclared.size > 1 && !(d.straddle_why || '').trim()) {
    err(`group "${g}": slot_headings spans ${distinctDeclared.size} headings with no "straddle_why". A group whose slots cross a printed heading routes rows by slot order across a section boundary; that has to be argued for, not just recorded.`);
  }
  for (const id of distinctDeclared) if (id && !byId.has(id)) err(`group "${g}" expects heading id "${id}", which is not declared under "headings".`);

  const rows = [];
  for (let i = 0; i < slots.length; i++) {
    const cells = slotTextTargets(slots[i]);
    const checks = slotCheckTargets(slots[i]);
    const resolved = new Map();     // headingId -> [cols]
    const unresolved = [];
    for (const c of [...cells, ...checks]) {
      const h = headingFor(c.target);
      if (!h.id) { unresolved.push(`${c.col} (${h.why})`); continue; }
      if (!resolved.has(h.id)) resolved.set(h.id, []);
      resolved.get(h.id).push(c.col);
    }
    const written = filledText ? cells.filter(c => (filledText(c.target) || '').trim() !== '').map(c => c.col) : null;
    const w0 = rectOf.get(cells[0]?.target);
    rows.push({
      i, cells, checks,
      actual: [...resolved.keys()],
      expected: perSlot ? perSlot[i] : d.heading,
      unresolved, written,
      page: w0?.page ?? null,
      y: w0 ? [w0.rect[1], w0.rect[3]] : null,
      resolvedDetail: resolved,
    });
  }

  // Aligned parallel checkbox arrays (433-F shape): checkboxes[key][i] must sit on the same
  // printed row as slots[i]. An index-aligned array inherits the slot list's routing whole —
  // including its mistakes — so it has to be checked against the page, not assumed.
  const aligned = [];
  for (const key of d.aligned_checkboxes || []) {
    const arr = mapDoc.checkboxes?.[key];
    if (!Array.isArray(arr)) { err(`group "${g}": aligned_checkboxes names "${key}", which is not an array under map.checkboxes.`); continue; }
    if (arr.length !== slots.length) { err(`group "${g}": checkboxes.${key} holds ${arr.length} entries against ${slots.length} slots — an index-aligned array of a different length cannot be aligned.`); continue; }
    aligned.push({ key, entries: arr.map((t, i) => ({ i, target: t, ...headingFor(t), checked: checkedBox ? checkedBox(t) : null })) });
  }

  report.push({ g, d, rows, aligned });
}

// --- print ---------------------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
console.log('');
console.log('  group / slot -> the heading printed above it');
console.log('  ' + '-'.repeat(104));

for (const { g, d, rows, aligned } of report) {
  console.log(`  ${g}  — declared: ${d.slot_headings ? 'per-slot (declared straddle)' : d.heading}`);
  for (const r of rows) {
    const actual = r.actual.length === 0 ? '(none)' : r.actual.join(' + ');
    const ok = r.unresolved.length === 0 && r.actual.length === 1 && r.actual[0] === r.expected;
    const fill = r.written === null ? '' : (r.written.length ? `  FILLED: ${r.written.join(',')}` : '  (empty on this record)');
    console.log(`    slot[${r.i}]  p${r.page ?? '?'} y=[${r.y ? r.y.map(v => v.toFixed(1)).join(',') : '?'}]  ${pad(actual, 30)} ${ok ? 'ok ' : 'BAD'}  expected ${r.expected}${fill}`);
    if (r.unresolved.length) r.unresolved.forEach(u => console.log(`             unresolved cell: ${u}`));
    if (r.actual.length > 1) for (const [id, cols] of r.resolvedDetail) console.log(`             under ${id}: ${cols.join(', ')}`);
  }
  for (const a of aligned) {
    for (const e of a.entries) {
      const slotHeading = rows[e.i]?.actual.length === 1 ? rows[e.i].actual[0] : null;
      const ok = e.id && slotHeading && e.id === slotHeading;
      const state = e.checked === null ? '' : (e.checked ? '  TICKED' : '  clear');
      console.log(`    checkboxes.${a.key}[${e.i}]  ${pad(e.id ?? '(none)', 30)} ${ok ? 'ok ' : 'BAD'}  slot[${e.i}] is under ${slotHeading ?? '(none)'}${state}`);
    }
  }
  console.log('');
}

// --- verdict -------------------------------------------------------------------------------
const bad = [];
for (const { g, d, rows, aligned } of report) {
  const actuals = new Set(rows.flatMap(r => r.actual));
  if (!d.slot_headings && actuals.size > 1) {
    bad.push({
      kind: 'UNDECLARED STRADDLE',
      detail: `group "${g}" declares the single heading ${d.heading} and its ${rows.length} slots print under ${actuals.size}: ${[...actuals].join(', ')}. `
            + `The group binds ONE ordered slot list, so a caller supplying rows in order lets slot order decide which printed section each row lands in. `
            + `That routing is invisible in the map, invisible in the field names, and invisible to every other gate step.`,
      rows,
    });
  } else {
    for (const r of rows) {
      if (r.unresolved.length) bad.push({ kind: 'UNRESOLVED', detail: `group "${g}" slot[${r.i}] has cells that resolve to no declared heading band.`, rows: [r] });
      else if (r.actual.length > 1) bad.push({ kind: 'ROW STRADDLES', detail: `group "${g}" slot[${r.i}] has cells printed under ${r.actual.length} different headings: ${r.actual.join(', ')} — one row split across two sections.`, rows: [r] });
      else if (r.actual[0] !== r.expected) bad.push({ kind: 'WRONG HEADING', detail: `group "${g}" slot[${r.i}] prints under ${r.actual[0]}, declared ${r.expected}.`, rows: [r] });
    }
  }
  for (const a of aligned) {
    for (const e of a.entries) {
      const slotHeading = rows[e.i]?.actual.length === 1 ? rows[e.i].actual[0] : null;
      if (!e.id || !slotHeading || e.id !== slotHeading) {
        bad.push({ kind: 'CHECKBOX OFF-ROW', detail: `group "${g}": checkboxes.${a.key}[${e.i}] prints under ${e.id ?? '(none)'} while slot[${e.i}] prints under ${slotHeading ?? '(none)'}.`, rows: [] });
      }
    }
  }
}

if (audit) {
  console.log(`AUDIT ONLY — ${errors.length} declaration error(s), ${bad.length} finding(s) that would fail a real run. Exiting 0.`);
  errors.forEach(e => console.log(`  ERROR ${e}`));
  bad.forEach(b => console.log(`  ${b.kind}: ${b.detail}`));
  process.exit(0);
}

if (errors.length) {
  console.error('');
  errors.forEach(e => console.error(`  ERROR ${e}`));
}

if (!errors.length && !bad.length) {
  const nRows = report.reduce((n, r) => n + r.rows.length, 0);
  console.log(`OK — ${nRows} group row(s) across ${report.length} group(s) print under the heading declared for them.`);
  process.exit(0);
}

console.error('');
console.error('='.repeat(104));
console.error(`HEADING ASSERTION FAILED for ${form} — ${bad.length} finding(s).`);
console.error('='.repeat(104));
for (const b of bad) {
  console.error('');
  console.error(`  ${b.kind}: ${b.detail}`);
  for (const r of b.rows) {
    const fill = r.written === null ? '' : (r.written.length ? `WRITTEN ON THIS RECORD (${r.written.join(', ')})` : 'empty on this record');
    console.error(`    slot[${r.i}]  page ${r.page} y=[${r.y ? r.y.map(v => v.toFixed(1)).join(', ') : '?'}]  prints under ${r.actual.join(' + ') || '(none)'}  ${fill}`);
    for (const c of r.cells) console.error(`        ${pad(c.col, 22)} ${c.target}`);
  }
}
console.error('');
process.exit(2);
