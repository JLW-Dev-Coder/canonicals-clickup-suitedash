// [B-07] — THE EQUITY COLUMN STATES A RELATION, AND SIXTEEN CELLS BECOME DECLARED LINES.
//
//   node scratchpad/b07-declare-equity-relations.mjs [--apply]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT B-07 CARRIED AND WHAT DECIDES IT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Five tables on 433-B draw an equity column under a header that NAMES AN ARITHMETIC RELATION:
// "Equity / Value Minus Loan" on page 3's INVESTMENTS, "Equity Value / minus Loan" on page 3's
// DIGITAL ASSETS, and "Equity / FMV Minus Loan" on page 4's REAL PROPERTY and VEHICLES and page
// 5's BUSINESS EQUIPMENT. Sixteen row-level cells sit under those headers with BOTH OPERANDS
// DRAWN on the same row. Every one was bound as an INPUT and none was a tripwire.
//
// The item was raised rather than settled because the relation is in a COLUMN HEADER and not on
// a row, and every printed total this repo had made a tripwire said "Add lines X, Y, Z" or "Line
// X minus Line Y" ON THE LINE. That distinction was real and it is the right thing to have
// hesitated over. WHAT SETTLES IT IS THE CONTRAST THE ITEM ITSELF NAMES: 433-B(OIC) prints
// "$ [Current market value] – $ [Minus loan balance] = (2a) $" on the row, and this engine
// already makes that a tripwire — through `total_cell`, the exact schema these sixteen need.
// The page states the relation, both operands are drawn, and the engine can compute it. A
// relation the page states and the engine can compute is not a label.
//
// THE THREE INTANGIBLE ROWS STAY DECLARED NOT-CHECKABLE, and that is B-07's own reasoning kept
// rather than overridden: rows 24e, 24f and 24g draw a description and an equity cell AND
// NOTHING ELSE — no FMV, no loan balance. A relation with neither operand drawn is not one the
// page states, and sweeping the column would have made this engine assert three figures the
// form never asks anyone to compute.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// EVERY COORDINATE BELOW WAS READ FROM THE PAGE BYTES
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Not from the map's prose and not from this item's own summary. The two header runs of each
// block and the row marker of each row were read with adapters/pdf/page-geometry.mjs, and this
// script re-reads them and STOPS if any one is not drawn where it says.

import { readFileSync, writeFileSync } from 'node:fs';
import { readPrintedText } from '../adapters/pdf/page-geometry.mjs';

const APPLY = process.argv.includes('--apply');
const TOTALS = 'adapters/pdf/maps/433b.totals.json';
const MAP = 'adapters/pdf/maps/433b.map.json';

// ─── THE FIVE BLOCKS, AND THE SIXTEEN ROWS IN THEM ────────────────────────────────────────
// `header` is the two printed runs that together read as the relation; `y` is the row marker's
// drawn baseline. Both are asserted against the page below.
const BLOCKS = [
  {
    group: 'investments', page: 3, equity: 'equity_value_minus_loan', fmv: 'current_value', loan: 'loan_balance',
    header: [{ str: 'Equity', y: 413.7, x: 517.3 }, { str: 'Value Minus Loan', y: 403.7, x: 497.4 }],
    operand_headers: '"Current Value" y 408.6 x 328.4..377.2 and "Loan Balance" y 408.7 x 414.8..463.6',
    relation: 'Equity / Value Minus Loan',
    rows: [{ line: '19a', y: 390.9 }, { line: '19b', y: 347.7 }],
  },
  {
    group: 'digital_assets', page: 3, equity: 'equity_value_minus_loan', fmv: 'current_value_usd', loan: 'loan_balance',
    header: [{ str: 'Equity Value', y: 227.2, x: 528.6 }, { str: 'minus Loan', y: 217.6, x: 530.0 }],
    operand_headers: '"Current value US" y 235.4 x 409.7..470.7 above the value column, and the loan-balance column bound as digital_assets[i].loan_balance in this map\'s own page-3 evidence table',
    relation: 'Equity Value / minus Loan',
    rows: [{ line: '20b', y: 194.8 }, { line: '20c', y: 170.8 }],
  },
  {
    group: 'real_property', page: 4, equity: 'equity', fmv: 'current_fmv', loan: 'current_loan_balance',
    header: [{ str: 'Equity', y: 696.3, x: 531.7 }, { str: 'FMV Minus Loan', y: 688.3, x: 513.4 }],
    operand_headers: '"Current Loan" y 696.3 x 333.0..379.8 over the loan column, in the six-run header stack this block shares with VEHICLES at identical x',
    relation: 'Equity / FMV Minus Loan',
    rows: [{ line: '22a', y: 669.1 }, { line: '22b', y: 600.7 }, { line: '22c', y: 532.3 }, { line: '22d', y: 463.9 }],
  },
  {
    group: 'vehicles', page: 4, equity: 'equity', fmv: 'current_fmv', loan: 'current_loan_balance',
    header: [{ str: 'Equity', y: 350.7, x: 531.7 }, { str: 'FMV Minus Loan', y: 342.7, x: 513.4 }],
    operand_headers: '"Current Loan" y 350.7 x 333.0..379.8, the same six-run header stack redrawn over this block',
    relation: 'Equity / FMV Minus Loan',
    rows: [{ line: '23a', y: 323.5 }, { line: '23b', y: 255.1 }, { line: '23c', y: 186.7 }, { line: '23d', y: 118.3 }],
  },
  {
    group: 'business_equipment', page: 5, equity: 'equity', fmv: 'current_fmv', loan: 'current_loan_balance',
    header: [{ str: 'Equity', y: 703.5, x: 531.7 }, { str: 'FMV Minus Loan', y: 695.5, x: 513.4 }],
    operand_headers: '"Current Loan" y 703.5 x 333.0..379.8, the same header stack again',
    relation: 'Equity / FMV Minus Loan',
    rows: [{ line: '24a', y: 675.3 }, { line: '24b', y: 596.1 }, { line: '24c', y: 516.9 }, { line: '24d', y: 437.7 }],
  },
];

// The three that stay declared not-checkable, with their drawn markers.
const INTANGIBLE = { group: 'intangible_assets', page: 5, rows: [{ line: '24e', y: 358.5 }, { line: '24f', y: 333.3 }, { line: '24g', y: 308.1 }] };

// ─── EVERY QUOTED COORDINATE, RE-READ FROM THE PAGE ───────────────────────────────────────
const pages = await readPrintedText(readFileSync('adapters/pdf/forms/f433b.pdf'));
const drawn = (page, str, y, x) => (pages[page - 1].items || []).some((it) =>
  it.str.trim() === str && Math.abs(it.y1 - y) < 0.15 && (x === undefined || Math.abs(it.x1 - x) < 0.15));

const problems = [];
let checked = 0;
for (const b of [...BLOCKS, INTANGIBLE]) {
  for (const h of (b.header || [])) {
    checked++;
    if (!drawn(b.page, h.str, h.y, h.x)) problems.push(`page ${b.page} draws no run ${JSON.stringify(h.str)} at y ${h.y} x ${h.x} — the header this block's relation is read from is not where this file says.`);
  }
  for (const r of b.rows) {
    checked++;
    if (!drawn(b.page, r.line, r.y)) problems.push(`page ${b.page} draws no marker ${JSON.stringify(r.line)} at y ${r.y}.`);
  }
}
console.log(`re-read ${checked} printed run(s) from adapters/pdf/forms/f433b.pdf; ${problems.length} disagree with this file.`);
if (problems.length) { for (const p of problems) console.error(`STOP — ${p}`); process.exit(2); }

// ─── THE MAP MUST ACTUALLY DRAW THE COLUMNS THIS FILE BINDS ───────────────────────────────
const map = JSON.parse(readFileSync(MAP, 'utf8'));
for (const b of BLOCKS) {
  const def = map.groups[b.group];
  if (!def) { console.error(`STOP — the map declares no group ${b.group}.`); process.exit(2); }
  if (def.max !== b.rows.length) { console.error(`STOP — group ${b.group} declares max ${def.max} and this file names ${b.rows.length} printed row(s). One of the two is wrong and neither can be preferred silently.`); process.exit(2); }
  b.rows.forEach((r, i) => {
    const slot = (def.slots || [])[i];
    for (const col of [b.equity, b.fmv, b.loan])
      if (!slot?.text?.[col]) { console.error(`STOP — ${b.group}[${i}] declares no text column ${col}, so line ${r.line} has no operand to compute from.`); process.exit(2); }
  });
}
// AND THE THREE INTANGIBLE ROWS MUST STILL DRAW NEITHER OPERAND. That is the whole ground for
// leaving them declared not-checkable, and a ground nothing re-derives is a sentence.
{
  const def = map.groups[INTANGIBLE.group];
  const cols = new Set();
  for (const s of (def.slots || [])) for (const c of Object.keys(s.text || {})) cols.add(c);
  const operands = [...cols].filter((c) => /fmv|loan|current_value/i.test(c));
  if (operands.length) { console.error(`STOP — ${INTANGIBLE.group} draws ${operands.join(', ')}. The reason the three intangible rows stay not-checkable is that NEITHER operand is drawn on them, and that is no longer true.`); process.exit(2); }
  console.log(`${INTANGIBLE.group}: ${def.slots.length} row(s), columns {${[...cols].join(', ')}} — neither operand of the relation is drawn, re-derived from the map rather than asserted.`);
}

// ─── THE SIXTEEN ENTRIES ──────────────────────────────────────────────────────────────────
const entries = [];
for (const b of BLOCKS) {
  b.rows.forEach((r, i) => {
    entries.push({
      line: r.line,
      caption: `${b.relation} — the column header states the relation and both operands are drawn on this row`,
      caption_at: `page ${b.page}, the two header runs ${b.header.map((h) => `"${h.str}" y ${h.y} x ${h.x}`).join(' and ')}, over the row the page marks ${r.line} at y ${r.y}. Operand headers: ${b.operand_headers}.`,
      relation: 'row',
      total_cell: { group: b.group, column: b.equity, row: i },
      feeders: [
        { group: b.group, column: b.fmv, row: i },
        { group: b.group, column: b.loan, row: i, sign: -1 },
      ],
      _why_this_is_a_tripwire_and_not_a_label: 'THE PAGE STATES THE RELATION AND BOTH OPERANDS ARE DRAWN ON THIS ROW. [B-07] hesitated because the relation is in a COLUMN HEADER rather than on the row, and every printed total this repo had made a tripwire said "Add lines X, Y, Z" on the line. What settles it is the contrast [B-07] itself names: 433-B(OIC) prints "$ [Current market value] - $ [Minus loan balance] = (2a) $" on the row and this engine already makes that a tripwire, through `total_cell` — the same schema this entry uses. A relation the page states and the engine can compute is not a label.',
    });
  });
}

// ─── APPLY ────────────────────────────────────────────────────────────────────────────────
const doc = JSON.parse(readFileSync(TOTALS, 'utf8'));
const before = doc.totals.length;
if (doc.totals.some((t) => t.relation === 'row')) { console.error('STOP — this totals file already declares row relations. It has been patched before and running again would double them.'); process.exit(2); }
for (const t of doc.totals) if (!t.total_key) { console.error(`STOP — existing line ${t.line} is not addressed by total_key. The two classes this patch relies on telling apart are no longer told apart by that.`); process.exit(2); }

console.log('');
console.log(`${TOTALS}: ${before} declared line(s) today, all eleven addressed by total_key.`);
console.log(`this patch adds ${entries.length}, all addressed by total_cell and all declaring \`relation: "row"\`:`);
for (const e of entries) console.log(`  ${e.line.padEnd(5)} ${e.total_cell.group}[${e.total_cell.row}].${e.total_cell.column} = ${e.feeders[0].column} - ${e.feeders[1].column}`);

if (!APPLY) { console.log(''); console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0); }

doc._two_classes_of_declared_line = 'THE ELEVEN AND THE SIXTEEN ARE DIFFERENT OBJECTS AND THE FILE SAYS SO. A BLOCK TOTAL carries `total_key` and its caption names its own addends on the line — "Add lines 22a through 22d". A ROW RELATION carries `relation: "row"` and `total_cell`, and the relation it computes is stated by the COLUMN HEADER over the cell rather than by a caption beside it. Both are printed arithmetic this engine can recompute from cells the page draws, and gate step 11 treats them identically; they are distinguished because adapters/pdf/count-sweep.mjs makes claims about "printed totals" per page that were authored about the first class, and a figure that silently absorbs a second class is a figure whose universe moved without anybody saying so ([R-07]).';
doc.totals.push(...entries);

// The not_checkable entry narrows to the three rows that still cannot carry the relation.
const nc = doc.not_checkable.entries;
const i = nc.findIndex((e) => /equity column of every earlier table/.test(e.map_key || ''));
if (i < 0) { console.error("STOP — the equity not_checkable entry is not where this patch expects it. It cannot narrow an entry it cannot find."); process.exit(2); }
nc[i] = {
  map_key: 'intangible_assets[0].equity, intangible_assets[1].equity, intangible_assets[2].equity',
  printed_caption: 'Equity / FMV Minus Loan, over rows the page marks 24e, 24f and 24g',
  printed_at: 'page 5, the header runs "Equity" y 703.5 x 531.7..555.5 and "FMV Minus Loan" y 695.5 x 513.4..573.8; the three rows at y 358.5, 333.3 and 308.1',
  why_not_checkable: 'NEITHER OPERAND IS DRAWN ON THESE ROWS. They draw a description and an equity cell and nothing else — no purchase date, no FMV, no loan balance, no monthly payment, no final payment date, no location and no lender. The column header names a relation over two cells, and on these three rows the form draws neither of them, so there is nothing on the page to recompute the figure from. THIS IS [B-07]\'s OWN REASONING, KEPT: the item said "whatever is decided for the sixteen cells that have both operands, these three have neither, and a relation with no operands drawn is not a relation the page states", and the resolution that made the sixteen tripwires had to say so rather than sweeping the column. The map re-derives it on every run — adapters/pdf/blanket-audit.mjs [K-113] counts the equity cells whose slot draws no operand and asserts none of them is a declared total cell.',
  _what_changed_here: '[B-07] RESOLVED. This entry used to cover the equity column of EVERY table on this form — sixteen cells with both operands drawn, plus these three with neither. The sixteen are now declared lines; only the three remain, and they remain for a reason that is about the page rather than about caution.',
  review_page_advisory: 'THE EQUITY FIGURE ON THIS ROW IS NOT VERIFIED BY ANYTHING ON THE PAGE. The column header reads "Equity / FMV Minus Loan", but these three intangible rows draw no fair market value and no loan balance — only a description and this figure. Every other equity cell on this form IS checked against its own two operands. This one is whatever the record supplied, so it is the filer\'s assertion rather than the engine\'s, and a preparer confirming this page should check it against the valuation it came from.',
};

writeFileSync(TOTALS, JSON.stringify(doc, null, 1) + '\n');
console.log('');
console.log(`APPLIED — ${TOTALS}: ${before} -> ${doc.totals.length} declared line(s); the equity not_checkable entry narrowed from the whole column to the three intangible rows.`);
