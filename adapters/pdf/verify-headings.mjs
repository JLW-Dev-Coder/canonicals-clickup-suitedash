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

// BAND MEMBERSHIP IS NOT ROW ORDER
// --------------------------------
// The heading check above proves each slot prints in the right SECTION. It does not prove the
// slots run down the page in the order the map lists them. Both rows of 433-F's PERSONAL BANK
// ACCOUNTS are in that band whichever way round they are bound, so the check that found D1
// would not notice them swapped with each other. That matters wherever the rows are not
// interchangeable: 433-A's `real_property` slots 1 and 2 bind Table_Line17b[1] and
// Table_Line17b[0] — a hand-authored reversal read off the field order — and 18a, 18b and 18c
// are three different properties on a signed statement.
//
// So: a group's slots must run in PRINTED order — the order a person reads them in. Page
// ascending, then down the page, and for slots that share a printed line, left to right. A
// group that lists them any other way routes the caller's first row to the second printed
// position, and every row after it likewise, inside a section the heading check calls correct.
//
// LEFT-TO-RIGHT IS NOT A CONCESSION. 433-A's `life_insurance_policies` is three policies
// printed as three COLUMNS at one y (Lines16b-f_Column1..3), not three stacked rows. A rule
// that only knew "y must descend" would call that group broken and would have to be switched
// off for it — and a check switched off for the one group it does not fit is a check nobody
// trusts. Two slots share a printed line when their vertical extents overlap by more than half
// the shorter one; that is measured off the page, so no group needs to declare its own layout.

// Cells of one printed row share a y-centre, but not exactly: a taller description box sits at
// a different centre from the figure boxes beside it, by a few points, on a perfectly good row.
// So the spread is judged against the ROW PITCH — the distance to the nearest adjacent slot —
// rather than a fixed number of points. A spread over half the pitch means some cell of this
// slot is nearer the next row's centre than its own, which is the case where the median could
// be reporting the wrong row. A fixed tolerance would either fire on every tall description
// cell or miss it entirely on a densely printed table; both train people to ignore the note.

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

/** Two slots share a printed line when their vertical extents overlap by more than half the
 *  shorter one. Measured off the page: a group of side-by-side columns needs no declaration. */
const sameLine = (a, b) => {
  if (!a.extent || !b.extent) return false;
  const overlap = Math.min(a.extent[1], b.extent[1]) - Math.max(a.extent[0], b.extent[0]);
  const shorter = Math.min(a.extent[1] - a.extent[0], b.extent[1] - b.extent[0]);
  return shorter > 0 && overlap > shorter / 2;
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
    // The row's y-centre, for the ORDER check below. Taken as the MEDIAN of every text cell's
    // centre, not cells[0]'s: cells[0] is whichever column the map happens to list first, and
    // on a row whose description box is taller than its figure boxes that one cell's centre is
    // not the row's. `spread` is printed so a row whose cells are not co-linear — which would
    // mean the slot is not one printed row at all — is visible rather than averaged away.
    const cellRects = cells.map(c => rectOf.get(c.target)).filter(w => w && w.page !== null);
    const cellCentres = cellRects.map(w => (w.rect[1] + w.rect[3]) / 2).sort((a, b) => a - b);
    const cellX       = cellRects.map(w => (w.rect[0] + w.rect[2]) / 2).sort((a, b) => a - b);
    const mid = (a) => a.length === 0 ? null
      : a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    // The slot's whole vertical extent, across every cell — what decides whether two slots
    // share a printed line. cells[0]'s rect alone would call a tall description box a line of
    // its own.
    const extent = cellRects.length
      ? [Math.min(...cellRects.map(w => w.rect[1])), Math.max(...cellRects.map(w => w.rect[3]))]
      : null;
    rows.push({
      i, cells, checks,
      actual: [...resolved.keys()],
      expected: perSlot ? perSlot[i] : d.heading,
      unresolved, written,
      page: w0?.page ?? null,
      y: w0 ? [w0.rect[1], w0.rect[3]] : null,
      yc: mid(cellCentres),
      xc: mid(cellX),
      cellCentres,
      extent,
      ycSpread: cellCentres.length ? cellCentres[cellCentres.length - 1] - cellCentres[0] : null,
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
    const yc = r.yc === null ? 'yc=?     ' : `yc=${r.yc.toFixed(1).padStart(6)}`;
    console.log(`    slot[${r.i}]  p${r.page ?? '?'} y=[${r.y ? r.y.map(v => v.toFixed(1)).join(',') : '?'}] ${yc}  ${pad(actual, 30)} ${ok ? 'ok ' : 'BAD'}  expected ${r.expected}${fill}`);
    if (r.unresolved.length) r.unresolved.forEach(u => console.log(`             unresolved cell: ${u}`));
    if (r.actual.length > 1) for (const [id, cols] of r.resolvedDetail) console.log(`             under ${id}: ${cols.join(', ')}`);
    // A slot whose cells span far more than one line of type is a multi-line BLOCK, not a row.
    // Said out loud rather than smoothed over, because it is why the order check compares block
    // TOPS: on these groups a block's centre can sit nearer the next block's centre than to its
    // own first line, and ordering by centre would be reading a number that means less than it
    // looks like it means.
    if (r.ycSpread !== null && r.ycSpread > 20)
      console.log(`             block: this slot is ${r.ycSpread.toFixed(1)}pt of printed lines, y=[${r.extent[0].toFixed(1)},${r.extent[1].toFixed(1)}] — ordered by its top, not its centre.`);
  }
  if (rows.length > 1) {
    const sideways = rows.some((r, k) => k > 0 && r.page === rows[k - 1].page && sameLine(rows[k - 1], r));
    const seq = sideways
      ? rows.map(r => r.xc === null ? '?' : `x=${r.xc.toFixed(1)}`).join('  <  ')
      : rows.map(r => r.extent ? r.extent[1].toFixed(1) : '?').join('  >  ');
    console.log(`    printed order: slot[0..${rows.length - 1}] ${sideways ? 'share a line; x-centres' : 'block tops'}  ${seq}`
              + `   (must run in reading order: page, then down, then left to right)`);
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
  // Row order WITHIN the band. Runs for every group, straddle or not: a declared straddle says
  // which section each slot is in, never that the slots descend the page.
  for (let k = 1; k < rows.length; k++) {
    const a = rows[k - 1], b = rows[k];
    if (a.yc === null || b.yc === null || a.page === null || b.page === null) continue;  // reported as UNRESOLVED
    let ok, why;
    if (a.page !== b.page) {
      ok  = a.page < b.page;
      why = `slot[${a.i}] is on page ${a.page} and slot[${b.i}] on page ${b.page}, so slot[${b.i}] prints on an EARLIER page`;
    } else if (sameLine(a, b)) {
      ok  = a.xc < b.xc;
      why = `slot[${a.i}] and slot[${b.i}] share a printed line (y=${a.yc.toFixed(1)}), and slot[${a.i}] sits at x=${a.xc.toFixed(1)} `
          + `with slot[${b.i}] at x=${b.xc.toFixed(1)}, so slot[${b.i}] prints to the LEFT of slot[${a.i}]`;
    } else {
      // Compared by the TOP of each slot's block, not by its centre. Several 433-A rows are
      // multi-line BLOCKS — a property row runs a description line, then purchase date and
      // price, then the loan line, ~92pt in all — and a block's centre says less about where it
      // starts than its top does. Reading order is where a row begins.
      ok  = a.extent[1] > b.extent[1];
      why = `slot[${a.i}] starts at y=${a.extent[1].toFixed(1)} and slot[${b.i}] at y=${b.extent[1].toFixed(1)} on page ${a.page}, `
          + `so slot[${b.i}] prints ABOVE slot[${a.i}]`;
    }
    if (!ok) {
      bad.push({
        kind: 'ROW ORDER',
        detail: `group "${g}" lists slot[${a.i}] and slot[${b.i}] in an order the page does not print them in: ${why}. `
              + `A caller fills a group in order, so its first row lands on the second printed position and every row after it `
              + `likewise. Both slots are inside the declared heading band, which is why the heading check calls this correct: `
              + `band membership is not row order.`,
        rows: [a, b],
      });
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
  // THE atLeast CONTRACT, ON A GATE STEP. This printed the two figures — so a zero WAS
  // visible to a reader — and then exited 0 regardless. A gate step that examined nothing
  // and exits 0 is the shape the third sweep exists to end: "I had nothing to look at" and
  // "everything I looked at was correct" are indistinguishable from the outside, and that
  // indistinguishability is the defect. Printing the number is not the same as requiring one.
  // See adapters/pdf/guard-sweep.mjs [G-28].
  if (!nRows) {
    console.error(`NOTHING TO ASSERT — ${form} declares ${report.length} group(s) and not one printed a row, so the heading assertion examined nothing.`);
    console.error('  Zero rows checked is not zero rows wrong. Either the record feeds no group rows (run --saturated),');
    console.error('  or the map\'s groups no longer resolve to slots — and both of those are findings, not passes.');
    process.exit(2);
  }
  console.log(`OK — ${nRows} group row(s) across ${report.length} group(s) print under the heading declared for them, and every group's slots run in printed order down the page.`);
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
