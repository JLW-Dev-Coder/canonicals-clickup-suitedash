// PER-BLOCK DECLARED ROUNDING.
//
// WHAT THIS IS
// ------------
// 433-A(OIC) prints a rounding instruction, and it prints it MORE THAN ONCE, in more than one
// wording, over less than the whole form. This module reads the map's `rounding` declaration —
// one entry per printed BLOCK, each carrying the instruction verbatim and the x/y it is drawn
// at — and applies it in the two places a rounding rule can be wrong:
//
//   AT OUTPUT     — the value written into a money cell of a rounded block is the rounded one,
//                   because that is what the page instructs the taxpayer to enter.
//   AT COMPARISON — step 11 recomputes a printed total from the printed cells. If the cells are
//                   rounded and the recomputation is not, the two disagree by up to half a
//                   dollar per operand and the tripwire fires on a correctly filled form.
//
// Both, or neither is safe: rounding only at output makes every multi-operand total fail;
// rounding only at comparison makes the engine verify a figure the page never printed.
//
// MONEY BY DECLARATION, NEVER BY NUMERIC SHAPE
// --------------------------------------------
// The rule is NOT "if it parses as a number, round it". 433-A(OIC) prints
// `2c_number_of_units` and `8c_number_of_units` — the quantity of a digital asset held — and a
// holding of 1.2345 units rounded to 1 is a false statement about the taxpayer's property on a
// document signed under penalty of perjury. A blanket numeric rule corrupts it silently and
// every total on the page still reconciles, because the units cell feeds no total. So a cell is
// money because the map SAYS it is money, in a named block, and for no other reason.
//
// ROUND FIRST, THEN FLOOR
// -----------------------
// Page 2 y 668.1 prints: "Round to the nearest dollar. Do not enter a negative number. If any
// line item is a negative number, enter "0"." That is the order the sentence prints, and the
// order matters at the boundary: -0.40 rounds to -0 and floors to 0; floored first it is 0 and
// rounds to 0 — same answer. But -0.60 rounds to -1 then floors to 0, while floored first it is
// 0. The two agree here only because the floor is zero; they would not agree at any other floor,
// and the form's own sentence resolves it. See `roundThenFloor`.
//
// HALF AWAY FROM ZERO. "Nearest" leaves the .5 case open and JS's Math.round breaks it toward
// +Infinity, so -0.5 becomes -0 and +0.5 becomes 1 — the same magnitude rounded two different
// ways depending on sign. The commercial and IRS convention is half away from zero, and it is
// the only one under which a cell and its negation round symmetrically.
//
// THE WORDING VARIANT IS RECORDED AND IS NOT THE TEST
// ---------------------------------------------------
// Page 2 prints "Round to the nearest dollar". Pages 4, 5, 6 and 7 print "Round to the nearest
// whole dollar". A string-exact check for the later wording would read page 2 as uninstructed
// and leave the whole personal-asset block unrounded. So the mode NAMES the variant the page
// prints — `nearest_dollar` vs `nearest_whole_dollar` — and both do the same arithmetic. The
// file records what the page says; the engine does what both mean.
//
// `none_printed` IS A DECLARATION, NOT A DEFAULT
// ----------------------------------------------
// Page 3 of 433-A(OIC) is entirely money — the real-property and vehicle quick-sale rows — and
// prints no rounding instruction anywhere, while its totals (5) and (6) feed Box A, which IS
// drawn under one. A money block with no instruction must therefore say so explicitly, with the
// absence recorded as a thing that was looked for. A block that simply inherited from the page
// before it would be asserting a scope the form does not print.
//
// AND A MONEY CELL IN NO BLOCK IS A STOP
// --------------------------------------
// The cross-check that gives this teeth: every cell the totals file treats as money — as a
// total, as a feeder, or as a declared-not-checkable printed total — must appear in exactly one
// rounding block. Add a total later without declaring its rounding and the gate stops. Silence
// is never read as "no rounding"; that is the no-declared-state defect this repo keeps finding.

/**
 * A printed cell is text. "$1,200.00", "1200", "(50)" and "" all have to become numbers the
 * same way, and a cell that is text but not a number has to be distinguishable from a cell
 * that is empty — the first disables a tripwire, the second contributes zero.
 *
 * THIS LIVES HERE, and run-form-gate.mjs imports it, because rounding a cell at OUTPUT and
 * recomputing it at COMPARISON have to read the same string as the same number. Two copies of
 * a money parser that drift by one character is a defect nothing on the page would show.
 */
export const parseMoney = (raw) => {
  if (raw === undefined || raw === null) return { blank: true, n: 0 };
  const s = String(raw).trim();
  if (s === '') return { blank: true, n: 0 };
  const neg = /^\(.*\)$/.test(s) || s.startsWith('-');
  const digits = s.replace(/[()]/g, '').replace(/^-/, '').replace(/[$\s,]/g, '');
  if (!/^\d*\.?\d+$/.test(digits)) return { blank: false, n: null, raw: s };
  const n = Number(digits);
  return { blank: false, n: neg ? -n : n };
};

/** Round half away from zero. See the header for why not Math.round. */
export const roundHalfAwayFromZero = (n) => (n < 0 ? -1 : 1) * Math.round(Math.abs(n));

export const ROUNDING_MODES = new Set(['nearest_dollar', 'nearest_whole_dollar', 'none_printed']);
/** The two instructed wordings do the same arithmetic; `none_printed` does none. */
const ROUNDS = new Set(['nearest_dollar', 'nearest_whole_dollar']);

/** Apply a block's mode. A mode that does not round returns the value untouched. */
export const applyRounding = (n, mode) => (ROUNDS.has(mode) ? roundHalfAwayFromZero(n) : n);

/** True when this mode actually rounds. */
export const modeRounds = (mode) => ROUNDS.has(mode);

/**
 * Round first, then floor — the order 433-A(OIC) page 2 y 668.1 prints the two sentences in.
 * `floor` is null when the line declares none.
 */
export const roundThenFloor = (n, mode, floor) => {
  const r = applyRounding(n, mode);
  return (typeof floor === 'number' && r < floor) ? { value: floor, floored: true } : { value: r, floored: false };
};

/**
 * Read the map's declaration into two lookups: map key -> block, and "group.column" -> block.
 * A map that declares no `rounding` at all yields `declared: false` and every lookup empty,
 * which is how 433-A and 433-F stay untouched by this module.
 */
export const loadRounding = (mapDoc) => {
  const decl = mapDoc?.rounding;
  const byKey = new Map(), byCell = new Map();
  if (!decl || !Array.isArray(decl.blocks)) return { declared: false, blocks: [], byKey, byCell };
  for (const b of decl.blocks) {
    for (const k of (b.keys || [])) byKey.set(k, b);
    for (const c of (b.cells || [])) for (const col of (c.columns || [])) byCell.set(`${c.group}.${col}`, b);
  }
  return { declared: true, blocks: decl.blocks, byKey, byCell };
};

/**
 * The block governing a cell, addressed the way the rest of the repo addresses cells: a plain
 * `map` key, or "group[row].column". The ROW is dropped — a column is money in every slot of its
 * group or in none of them, and there is no printed shape on this form where one slot of a
 * printed column is money and the slot below it is not.
 */
export const blockFor = (rounding, spelling) => {
  if (typeof spelling !== 'string') return null;
  const m = /^([A-Za-z0-9_]+)\[(\d+)\]\.(.+)$/.exec(spelling);
  if (m) return rounding.byCell.get(`${m[1]}.${m[3]}`) ?? null;
  return rounding.byKey.get(spelling) ?? null;
};

/**
 * THE OUTPUT SIDE. Given the loaded declaration and the key a fill engine is about to write,
 * return the value that should actually go into the cell.
 *
 * A cell in no block, or in a `none_printed` block, comes back untouched — including its
 * formatting. A cell in a rounded block comes back as a PLAIN INTEGER STRING with no currency
 * symbol and no thousands separators, because the form draws its own "$" beside every one of
 * these cells and "round to the nearest whole dollar" describes what is entered, not how it is
 * punctuated.
 *
 * A non-blank value that is not a number is returned untouched and FLAGGED. It is not silently
 * dropped and it is not guessed at: "see attached" in a money cell is a thing the operator did,
 * and the run should say so rather than decide for them.
 */
export const roundForOutput = (rounding, key, val) => {
  const block = blockFor(rounding, key);
  if (!block || !ROUNDS.has(block.mode)) return { value: val, rounded: false, notNumeric: false, block: block || null };
  const p = parseMoney(val);
  if (p.blank) return { value: val, rounded: false, notNumeric: false, block };
  if (p.n === null) return { value: val, rounded: false, notNumeric: true, block };
  const r = roundHalfAwayFromZero(p.n);
  const out = String(r);
  return { value: out, rounded: out !== String(val).trim(), notNumeric: false, block, from: p.n };
};

/** Every cell the totals declaration treats as money, in the repo's one cell spelling. */
export const moneyCellsInTotals = (totalsDoc) => {
  const keys = new Set(), cells = new Set();
  const take = (e) => {
    if (e.total_key) keys.add(e.total_key);
    if (e.total_cell?.group && e.total_cell?.column) cells.add(`${e.total_cell.group}.${e.total_cell.column}`);
    for (const f of (e.feeders || [])) {
      for (const k of (f.keys || [])) keys.add(k);
      if (f.group && f.column) cells.add(`${f.group}.${f.column}`);
    }
  };
  for (const e of (totalsDoc?.totals || [])) take(e);
  // A DECLARED-not-checkable printed total is money too. It is written, it is a dollar figure on
  // the page, and the only thing "not checkable" says is that nothing printed here can verify it.
  for (const e of (totalsDoc?.not_checkable?.entries || [])) if (e.map_key) keys.add(e.map_key);
  return { keys, cells };
};

/**
 * Every STOP the declaration can commit. Returns a list of messages; empty means it holds.
 * `totalsDoc` may be null — the cross-check is then reported as not run rather than passed.
 */
export const auditRounding = (mapDoc, totalsDoc) => {
  const problems = [];
  const decl = mapDoc?.rounding;
  if (!decl) return { problems, blocks: [], ran_totals_crosscheck: false, declared: false };
  if (!Array.isArray(decl.blocks) || !decl.blocks.length) {
    problems.push('`rounding` is present but declares no `blocks`. Remove it, or declare the blocks — a rounding key that governs nothing reads as a form that was considered.');
    return { problems, blocks: [], ran_totals_crosscheck: false, declared: true };
  }

  const seenId = new Set();
  const owner = new Map();          // cell spelling -> block id, for the one-block-only rule

  const claim = (spelling, id) => {
    if (owner.has(spelling))
      problems.push(`"${spelling}" is declared money in TWO blocks — ${owner.get(spelling)} and ${id}. One cell, one block: two blocks could name two different instructions and the later one would silently win.`);
    else owner.set(spelling, id);
  };

  for (const b of decl.blocks) {
    const id = b.id || '(no id)';
    if (!b.id) problems.push('a block declares no `id`');
    else if (seenId.has(b.id)) problems.push(`two blocks share the id "${b.id}"`);
    else seenId.add(b.id);

    if (!ROUNDING_MODES.has(b.mode))
      problems.push(`${id}: \`mode\` is ${JSON.stringify(b.mode)} — not one of ${[...ROUNDING_MODES].join(', ')}`);

    if (ROUNDS.has(b.mode)) {
      // A rounded block must quote the sentence that rounds it and say where it is drawn. The
      // whole reason this is per-block is that the instruction is a printed thing with a
      // location; a block that rounds on nobody's authority is the assumption this replaces.
      if (typeof b.printed !== 'string' || !b.printed.trim())
        problems.push(`${id}: rounds, but quotes no \`printed\` instruction verbatim`);
      else if (!/round/i.test(b.printed))
        problems.push(`${id}: the quoted \`printed\` instruction does not contain the word "round" — ${JSON.stringify(b.printed.slice(0, 80))}`);
      if (!b.printed_at || typeof b.printed_at.y !== 'number' || !Array.isArray(b.printed_at.x) || typeof b.printed_at.page !== 'number')
        problems.push(`${id}: rounds, but \`printed_at\` does not give {page, y, x:[x1,x2]} for the sentence`);
    } else if (b.mode === 'none_printed') {
      if (b.printed !== null)
        problems.push(`${id}: declares none_printed, so \`printed\` must be explicitly null — a missing key and a checked absence look identical`);
      if (typeof b._absence_checked !== 'string' || !b._absence_checked.trim())
        problems.push(`${id}: declares none_printed with no \`_absence_checked\` saying where it was looked for and not found`);
    }

    for (const k of (b.keys || [])) {
      if (typeof mapDoc.map?.[k] !== 'string')
        problems.push(`${id}: money key "${k}" is not a \`map\` key on this form`);
      claim(k, id);
    }
    for (const c of (b.cells || [])) {
      const def = mapDoc.groups?.[c.group];
      if (!def || !Array.isArray(def.slots)) { problems.push(`${id}: money cells name group "${c.group}", which this map does not declare`); continue; }
      for (const col of (c.columns || [])) {
        const on = def.slots.filter(s => (s?.text && s.text[col] !== undefined) || s?.[col] !== undefined).length;
        if (!on) problems.push(`${id}: group "${c.group}" declares no column "${col}" on any slot`);
        else if (on !== def.slots.length)
          problems.push(`${id}: group "${c.group}" column "${col}" exists on ${on} of ${def.slots.length} slot(s). A money column present on some slots and absent on others is a map defect, not a rounding one — but it would leave the missing slots ungoverned.`);
        claim(`${c.group}.${col}`, id);
      }
    }
  }

  // THE CROSS-CHECK. Every cell the totals file treats as money must be in exactly one block.
  let ran = false;
  if (totalsDoc) {
    ran = true;
    const { keys, cells } = moneyCellsInTotals(totalsDoc);
    const undeclared = [
      ...[...keys].filter(k => !owner.has(k)).map(k => `map key "${k}"`),
      ...[...cells].filter(c => !owner.has(c)).map(c => `group cell "${c}"`),
    ].sort();
    if (undeclared.length) {
      problems.push(
        `${undeclared.length} cell(s) the totals declaration treats as MONEY are in no rounding block:\n` +
        undeclared.map(u => `      ${u}`).join('\n') +
        '\n      A money cell with no rounding declaration is a STOP, never a default. Declare the block it is drawn in, quote the instruction over it, or declare that block `none_printed` with the absence recorded.');
    }
  }

  return { problems, blocks: decl.blocks, ran_totals_crosscheck: ran, declared: true };
};

/** Print the audit and return the number of problems (0 = holds). */
export const reportRounding = (audit, mapPath) => {
  if (!audit.declared) {
    console.log(`rounding: ${mapPath} declares none — every money cell is written and compared to the cent. (Not a failure: only a form that PRINTS a rounding instruction carries a declaration.)`);
    return 0;
  }
  const counts = audit.blocks.reduce((a, b) => { a[b.mode] = (a[b.mode] || 0) + 1; return a; }, {});
  const cells = audit.blocks.reduce((n, b) => n + (b.keys || []).length + (b.cells || []).reduce((m, c) => m + (c.columns || []).length, 0), 0);
  console.log(`rounding: ${audit.blocks.length} declared block(s), ${cells} money cell declaration(s) — ${Object.entries(counts).map(([m, n]) => `${n} ${m}`).join(', ')}`);
  for (const b of audit.blocks) {
    console.log(`  ${String(b.id).padEnd(32)} p${b.page}  ${String(b.mode).padEnd(21)} ${b.mode === 'none_printed' ? '(no instruction printed over this block)' : `y ${b.printed_at?.y} — ${JSON.stringify(String(b.printed).slice(0, 52))}`}`);
  }
  console.log(`  totals cross-check: ${audit.ran_totals_crosscheck ? 'RAN — every money cell in the totals declaration is in exactly one block' : 'NOT RUN (no totals declaration loaded)'}`);
  if (!audit.problems.length) return 0;
  console.error(`ROUNDING DECLARATION — ${audit.problems.length} problem(s):`);
  audit.problems.forEach(p => console.error(`  ${p}`));
  return audit.problems.length;
};
