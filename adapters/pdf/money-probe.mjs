// Which mapped cells on a page are MONEY, on the evidence the page prints.
//
//   node adapters/pdf/money-probe.mjs <form> [page,page,...]
//   node adapters/pdf/money-probe.mjs 433aoi 2,3,4
//
// WHY THIS IS ITS OWN TOOL
// ------------------------
// adapters/pdf/rounding.mjs will only round a cell the map DECLARES as money, and never one
// that merely looks numeric — because `2c_number_of_units` holds 1.2345 units of a digital
// asset, sits inside a block that rounds, and would be silently corrupted into "1" by any
// numeric-shape rule, with every total on the page still reconciling.
//
// That makes the money declaration a hand-authored list, and a hand-authored list needs
// evidence. This is the evidence: for every mapped text target on a page, it reports the
// printed text drawn immediately to the cell's LEFT in the same vertical band, and flags the
// cell MONEY$ when that text ends in a "$" drawn within 14pt.
//
// WHY IT IS A MODULE AND NOT ONLY A CLI
// -------------------------------------
// It used to be a CLI whose output an author read and TRANSCRIBED into the map's
// `rounding._how_the_money_lists_were_built` prose — "27 on page 2, 24 on page 3 ...". That
// transcription is a retyped count with extra steps, and a retyped count drifts: the same
// defect that reached "eleven" in the name-lie registry and that left the partition describing
// a map two pages out of date. `probeMoneyCells()` and `declaredMoneyCells()` return the counts
// as data so adapters/pdf/count-sweep.mjs can DERIVE what the prose claims and check the prose
// against it. The CLI below is now one caller of the module, not the only way to see the answer.
//
// WHAT IT PROVES AND WHAT IT DOES NOT
// -----------------------------------
// A MONEY$ flag is strong evidence: the form drew a currency symbol against that cell within
// 14pt to its left. The absence of a flag is NOT evidence of the reverse — 433-A(OIC) prints
// money cells with no "$" at all, and each is identified by its printed CAPTION instead and
// named in its block's `_money_without_a_printed_dollar_sign`. So the tool narrows the
// reading; it does not make it.
//
// AND THE ABSENCE OF A FLAG WAS ONCE WORSE EVIDENCE THAN THAT. The scan took the SINGLE
// nearest printed run and asked whether it ended in "$"; the "$" is often 3.6pt away and a
// Box label from the row above is often 2.1pt away, so on four cells of this form the label
// won the race and a real currency symbol was never looked at. Two of the four were written
// into the map as cells the form draws no "$" against. The scan now takes the nearest run
// that ENDS in "$" within the gap, which is what it always meant.
//
// THE ASYMMETRY IS WHY THE DERIVED CHECK IS AN INEQUALITY. A map may declare MORE money cells
// than the probe flags — each named in its block's `_money_without_a_printed_dollar_sign` —
// and count-sweep.mjs [S-08] asserts declared >= probed PER PAGE rather than equality. The
// other direction is a STOP: a page that declared FEWER money cells than the form draws a "$"
// against would be leaving one unrounded and ungoverned.
//
// The 14pt threshold is the widest gap any true "$" on 433-A(OIC) sits at (the Section 4 payroll
// cell, 5.8pt) with room to spare, and the narrowest FALSE neighbour is 11pt of unrelated
// caption text that does not end in "$" — so the two tests are independent and both must hold.
//
// COORDINATES are PDF user space from page-geometry.mjs, the same source align-block.mjs and
// verify-headings.mjs read, so those three can never disagree about where anything is.

import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry } from './page-geometry.mjs';

export const MAX_GAP = 14;   // see header

const r1 = (n) => Math.round(n * 10) / 10;

/**
 * Every mapped TEXT target on the form, in the repo's one cell spelling: a plain `map` key,
 * or "group[row].column". Checkboxes are not here — a checkbox is never money.
 */
export const mappedTextCells = (mapDoc) => {
  const entries = [];
  for (const [k, t] of Object.entries(mapDoc.map || {})) entries.push({ key: k, target: t });
  for (const [g, d] of Object.entries(mapDoc.groups || {}))
    (d.slots || []).forEach((s, i) => {
      for (const [c, t] of Object.entries(s.text || {})) entries.push({ key: `${g}[${i}].${c}`, target: t });
    });
  return entries;
};

/**
 * THE PROBE, AS DATA.
 *   rows       one record per mapped text cell that names a real widget, with its page, its
 *              rectangle, the printed run to its left, the gap, and the MONEY$ verdict
 *   byPage     page -> { seen, money } — the counts the map's prose claims
 *   noWidget   mapped keys whose target names no widget (reported, never silently dropped)
 * Pass `pages` to restrict; omit for the whole form.
 */
export const probeMoneyCells = async (form, pages = []) => {
  const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
  const bytes  = readFileSync(`adapters/pdf/forms/f${form}.pdf`);
  const text   = await readPrintedText(bytes);
  const { widgets } = await readWidgetGeometry(bytes);
  const byName = new Map(widgets.filter(w => w.rect).map(w => [w.name, w]));

  const rows = [], noWidget = [], byPage = new Map();
  for (const e of mappedTextCells(mapDoc)) {
    const w = byName.get(e.target);
    if (!w) { noWidget.push(e.key); continue; }
    if (pages.length && !pages.includes(w.page)) continue;
    const [x1, y1, , y2] = w.rect;
    const left = (text[w.page - 1]?.items || [])
      .filter(t => t.y2 > y1 - 4 && t.y1 < y2 + 4 && t.x2 <= x1 + 2)
      .sort((a, b) => (x1 - a.x2) - (x1 - b.x2));
    // THE NEAREST RUN ENDING IN "$" WITHIN MAX_GAP — not "the nearest run, does it end in $".
    //
    // The original rule took left[0] and asked whether IT ended in a dollar sign, and that
    // lost four money cells on this form to a race it should never have been in. The Box
    // labels ("Box C", "Box D", "Box E") and the footer word "Form" are drawn 2.1..3.5pt to
    // the left of a cell in the row ABOVE them, which is nearer than that cell's own
    // "(38) $" marker at 3.6pt — so the marker never got looked at. (29), Box C, (38) and
    // (51) all carry a printed "$" and all four were reported as carrying none, and the
    // map's P5 block declared two of them under _money_without_a_printed_dollar_sign on
    // the strength of it.
    //
    // The two tests are unchanged and still independent: the run must END in "$" and must be
    // within MAX_GAP. What changed is that a nearer run which is NOT a currency symbol no
    // longer hides one that is.
    const near   = left.find(t => /\$\s*$/.test(t.str) && x1 - t.x2 <= MAX_GAP) || null;
    const gap    = near ? r1(x1 - near.x2) : null;
    const money  = !!near;
    const blocked = !!near && left[0] && left[0] !== near ? left[0].str : null;
    // THE y ON A PROBE ROW IS A WIDGET'S RECT TOP AND IS NAMED AS ONE.
    // A probe row is about a widget, not about a printed run, so its y is `rect[3]` and does
    // not convert to a caption baseline - 666.0 and 656.5 on 433-B(OIC) page 4 are the same
    // row of the form and different kinds of number. It was called `y` until this commit,
    // which is the bare letter every map in this repo uses for a text baseline. Renamed
    // rather than converted: see page-geometry.mjs Y_CONVENTIONS['widget-rect-top'].
    rows.push({ key: e.key, target: e.target, page: w.page, x: r1(x1), y_rect_top: r1(y2), gap, left: near ? near.str : (left[0] ? left[0].str : null), money, blocked });
    if (!byPage.has(w.page)) byPage.set(w.page, { seen: 0, money: 0 });
    const c = byPage.get(w.page); c.seen++; if (money) c.money++;
  }
  const total = { seen: rows.length, money: rows.filter(r => r.money).length };
  return { form, rows, byPage, noWidget, total, maxGap: MAX_GAP };
};

/**
 * What the map's `rounding` declaration says is money, expanded to CELLS the same way the
 * probe counts them: a block's `keys` are one cell each, and a block's `cells` are one cell
 * per column PER SLOT.
 *
 * The page of a declared cell comes from the WIDGET, not from the block's `page` field. A
 * block that named the wrong page would otherwise move its cells to that page in this count
 * and the comparison would still balance.
 */
export const declaredMoneyCells = async (form) => {
  const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
  const bytes  = readFileSync(`adapters/pdf/forms/f${form}.pdf`);
  const { widgets } = await readWidgetGeometry(bytes);
  const byName = new Map(widgets.filter(w => w.rect).map(w => [w.name, w]));

  const cells = [];                       // { spelling, target, page, block }
  for (const b of (mapDoc.rounding?.blocks || [])) {
    for (const k of (b.keys || [])) {
      const t = mapDoc.map?.[k];
      cells.push({ spelling: k, target: t, page: byName.get(t)?.page ?? null, block: b.id });
    }
    for (const c of (b.cells || [])) {
      const def = mapDoc.groups?.[c.group];
      (def?.slots || []).forEach((s, i) => {
        for (const col of (c.columns || [])) {
          const t = s?.text?.[col] ?? s?.[col];
          if (typeof t !== 'string') continue;
          cells.push({ spelling: `${c.group}[${i}].${col}`, target: t, page: byName.get(t)?.page ?? null, block: b.id });
        }
      });
    }
  }
  const byPage = new Map();
  for (const c of cells) {
    if (c.page === null) continue;
    byPage.set(c.page, (byPage.get(c.page) || 0) + 1);
  }
  return { cells, byPage, total: cells.length };
};

// ---------------------------------------------------------------------------------------
// CLI. One caller of the module above, kept because a person reading a page needs the
// per-cell evidence and not only the totals.
if (process.argv[1] && /money-probe\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const [form, pageArg] = process.argv.slice(2);
  if (!form) {
    console.error('usage: node adapters/pdf/money-probe.mjs <form> [page,page,...]');
    process.exit(2);
  }
  const pages = (pageArg || '').split(',').filter(Boolean).map(Number);
  const p = await probeMoneyCells(form, pages);
  for (const k of p.noWidget) console.log(`  ??     ${k}  (target names no widget)`);
  for (const r of p.rows)
    console.log(`  ${r.money ? 'MONEY$' : '  .   '} p${r.page} yTop=${String(r.y_rect_top).padStart(6)} x=${String(r.x).padStart(6)}  ${r.key.padEnd(50)} left=${r.gap === null ? '    -' : String(r.gap).padStart(5)}pt  ${JSON.stringify(r.left ? r.left.slice(-44) : '')}`);
  console.log('');
  for (const [pg, c] of [...p.byPage].sort((a, b) => a[0] - b[0]))
    console.log(`  page ${pg}: ${c.money} of ${c.seen} mapped text cell(s) carry a printed "$"`);
  console.log(`  ${p.total.money} of ${p.total.seen} mapped text cell(s)${pages.length ? ` on page(s) ${pages.join(', ')}` : ''} carry a printed "$" within ${p.maxGap}pt to their left.`);
  console.log('  A cell with no flag is NOT thereby proven non-money — read its printed caption. See the header.');
}
