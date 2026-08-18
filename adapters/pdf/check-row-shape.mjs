// A group row must supply EVERY column its slot declares.
//
// THE GAP THIS CLOSES
// -------------------
// A repeatable table arrives as a JSON array of row objects. The fill engines walk the
// SLOT — `for (const [column, target] of Object.entries(slot))` — and write `row[column]`.
// A column the row has no key for reads as `undefined`, and `setText` skips absent values
// by design, so the cell prints blank and the run reports success.
//
// The only shape check in the series lived upstream, in hs-fetch-433f.mjs, and it passed a
// row matching ANY ONE of the map's columns. That is not a check: a backbone receivable row
// keyed {name, address, amount_owed} handed to a map whose slot declares {name, address,
// amount_due} matches on two of three columns, clears the check, and prints the Amount Owed
// column EMPTY on a signed collection statement with no error anywhere. Same silent-empty
// table the group split was scoped to prevent, reached by a different route. 433-A had no
// row-shape check at all.
//
// So the check moves to the ENGINE, where the columns are actually consumed, and it names
// every column the row failed to supply rather than accepting a partial match.
//
// TWO MODES, THE SERIES CONVENTION
// --------------------------------
// --saturated: the input is an ACCEPTANCE fixture built to reach every mapped cell, so a
//   column with no key is a FAILURE. Same assertion --saturated already makes in step 9.
// production: an empty cell is the normal shape of a real answer, so this is REPORTED with
//   its count and its column names, never failed.
//
// AND THE REPORT SEPARATES TWO THINGS THAT LOOK IDENTICAL ON THE PAGE.
//   ABSENT  — the row carries NO KEY for a column the slot declares. The record and the map
//             disagree about what the column is CALLED. That is a vocabulary mismatch, and
//             it is a defect in every mode: nothing the taxpayer said reached the cell.
//   BLANK   — the key is there and holds no value. That is a taxpayer with nothing to put in
//             the cell, which is a correctly filled form.
// Both print blank. Only one of them is a bug, which is exactly why they are counted apart.
//
// WHAT IS CHECKED, AND WHAT IS NOT
// --------------------------------
// SLOTTED ROWS ONLY. A row past the last slot is dropped to an attachment and prints
// nothing, so it has no slot to declare anything.
//
// ARRAY ROWS ONLY. 433-F's groups fall back to per-column SCALAR properties when no array is
// supplied, and the map names those properties itself — the key set of a fallback row is
// authored by the map, so a vocabulary mismatch cannot exist there and checking it would
// only measure the map against itself. Fallback groups are counted and named in the report
// so their exclusion is stated rather than assumed.
//
// COMPOSED ROWS. Run this AFTER any row_composites are applied: a composite target is a
// column the slot declares and the map produces, and checking before composition would
// report it absent on every row.

/** Every column a slot declares, whichever slot shape the map uses. */
export const declaredColumns = (slot) => {
  if (!slot || typeof slot !== 'object') return [];
  // 433-A nests: { text: {col: target}, checkboxes: {col: {option: target}} }.
  // 433-F is flat: { col: target }. Both shapes are in use across the series.
  if (slot.text || slot.checkboxes) {
    return [...Object.keys(slot.text || {}), ...Object.keys(slot.checkboxes || {})];
  }
  return Object.keys(slot);
};

/**
 * @param {object} mapDoc          the form map
 * @param {object} rowsByGroup     { group: { rows: [...], fromArray: boolean } }
 * @returns {{ rows: object[], absent: number, blank: number, fallbackGroups: string[] }}
 */
export const checkRowShapes = (mapDoc, rowsByGroup) => {
  const rows = [];
  const fallbackGroups = [];
  let absent = 0, blank = 0;

  for (const [group, def] of Object.entries(mapDoc.groups || {})) {
    const entry = rowsByGroup[group];
    if (!entry) continue;
    if (!entry.fromArray) {
      if ((entry.rows || []).length) fallbackGroups.push(group);
      continue;
    }
    const cap = Math.min(def.max ?? def.slots.length, def.slots.length);
    (entry.rows || []).forEach((row, i) => {
      if (i >= cap) return;                       // dropped to an attachment; no slot declares it
      const declared = declaredColumns(def.slots[i]);
      if (!declared.length) return;
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        rows.push({ group, index: i, declared, absentCols: declared, blankCols: [], notAnObject: true });
        absent += declared.length;
        return;
      }
      const absentCols = declared.filter((c) => !(c in row));
      const blankCols = declared.filter((c) => {
        if (!(c in row)) return false;
        const v = row[c];
        return v === undefined || v === null || String(v).trim() === '';
      });
      if (absentCols.length || blankCols.length) {
        rows.push({ group, index: i, declared, absentCols, blankCols, supplied: Object.keys(row) });
        absent += absentCols.length;
        blank += blankCols.length;
      }
    });
  }
  return { rows, absent, blank, fallbackGroups };
};

/**
 * Print the finding. Returns the number of problems that must STOP the run.
 * @param {boolean} saturated
 */
export const reportRowShapes = (result, saturated) => {
  const { rows, absent, blank, fallbackGroups } = result;
  const withAbsent = rows.filter((r) => r.absentCols.length);

  if (fallbackGroups.length) {
    console.log(`ROW SHAPE: ${fallbackGroups.length} group(s) came through the scalar fallback and are NOT column-checked (the map names those keys itself): ${fallbackGroups.join(', ')}`);
  }

  if (!rows.length) {
    console.log(`ROW SHAPE: every slotted group row supplies every column its slot declares.`);
    return 0;
  }

  const label = saturated ? 'ROW SHAPE FAILURE' : 'ROW SHAPE';
  const out = saturated && withAbsent.length ? console.error : console.log;

  if (withAbsent.length) {
    out(`${label} — ${withAbsent.length} row(s) carry NO KEY for ${absent} column(s) their slot declares.`);
    out(`  A column with no key is a VOCABULARY MISMATCH: the cell prints blank and nothing the record holds reached it.`);
    for (const r of withAbsent) {
      out(`  ${r.group}[${r.index}]: absent ${r.absentCols.length} of ${r.declared.length} declared column(s) — ${r.absentCols.join(', ')}`);
      out(`    slot declares: ${r.declared.join(', ')}`);
      out(`    row supplies:  ${r.notAnObject ? '(row is not an object)' : (r.supplied.length ? r.supplied.join(', ') : '(no keys)')}`);
    }
  }

  if (blank) {
    const withBlank = rows.filter((r) => r.blankCols.length);
    console.log(`ROW SHAPE: ${withBlank.length} row(s) leave ${blank} declared column(s) PRESENT BUT EMPTY — a taxpayer with nothing to put there, not a mismatch.`);
    for (const r of withBlank) {
      console.log(`  ${r.group}[${r.index}]: blank — ${r.blankCols.join(', ')}`);
    }
  }

  if (!saturated || !withAbsent.length) {
    if (withAbsent.length) console.log(`  Reported, not failed: this is a PRODUCTION record. Re-run with --saturated to fail on an absent column.`);
    return 0;
  }
  console.error(`  The input is an ACCEPTANCE fixture (--saturated), which asserts every mapped cell is reached. No PDF written.`);
  return withAbsent.length;
};
