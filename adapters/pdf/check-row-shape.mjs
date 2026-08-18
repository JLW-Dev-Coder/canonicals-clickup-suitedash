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
 * Every column a STORED ROW must carry for one group, found by group name or by the input key
 * the group reads (`array` on 433-F, `source` on 433-A). Used by the fetch layers, which hold
 * the map but not the resolved rows, so a record can be refused before a PDF is ever produced.
 *
 * A row_composite TARGET is resolved back to its SOURCES. 433-A's receivable slot declares
 * `receivable_name_and_address`, and no record anywhere carries that key — the map composes it
 * at fill time from `name` and `address`. Asking a record for the target would fail every
 * correctly stored row, which is why the engine checks AFTER composition and this checks the
 * columns a record is actually expected to hold.
 * @returns {string[]|null} null when the key names no group
 */
export const slotColumnsOf = (mapDoc, key) => {
  const entry = Object.entries(mapDoc.groups || {})
    .find(([g, d]) => d && Array.isArray(d.slots) && (g === key || d.array === key || d.source === key));
  if (!entry) return null;
  const def = entry[1];
  const cols = new Set();
  for (const s of def.slots) declaredColumns(s).forEach((c) => cols.add(c));
  for (const [target, c] of Object.entries(def.row_composites || {})) {
    if (!c || typeof c !== 'object' || !Array.isArray(c.from)) continue;   // `_why` prose
    cols.delete(target);
    c.from.forEach((f) => cols.add(f));
  }
  return [...cols];
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

// ---------------------------------------------------------------------------------------
// A ROW MUST BE ALLOWED TO SAY WHAT IT IS.
//
// Defect D1 filed a bank account under INVESTMENTS. One `accounts` group spanned two printed
// tables, so which sub-table a row landed in was decided by slot ORDER — and slot order was
// the thing that was wrong. asset-row-shapes.json D1 records the conclusion: "It is the
// strongest argument for the canonical shape carrying an explicit asset class per row. A flat
// merged array with a fixed slot list has no way to say which sub-table a row belongs in, so
// it takes the answer from slot ORDER."
//
// Now that the five serialized tables share one vocabulary, a bank-account row and an
// investment row are STRUCTURALLY IDENTICAL — same five column names, same types. Nothing but
// which property it was stored in distinguishes them, and a crosswalk that repointed one
// property would move rows between printed tables with every cell still passing every check.
// So the row carries its class, the group declares which classes it prints, and a mismatch is
// a HARD STOP in every mode: a row printed under the wrong printed heading is a
// misrepresentation on a signed statement, never a reportable degradation.
//
// A row with NO class is reported, not failed. Only the map can say what a scalar-fallback row
// is (it declares `_class` per fallback entry), and a hand-authored fixture predating this
// construct is a gap in the record, not a wrong claim.

export const checkRowClasses = (mapDoc, rowsByGroup) => {
  const wrong = [], unstated = [];
  for (const [group, def] of Object.entries(mapDoc.groups || {})) {
    const rc = def.row_class;
    if (!rc || !Array.isArray(rc.accepts)) continue;
    const entry = rowsByGroup[group];
    if (!entry) continue;
    const cap = Math.min(def.max ?? def.slots.length, def.slots.length);
    (entry.rows || []).forEach((row, i) => {
      if (i >= cap) return;
      const stated = row && typeof row === 'object' ? row[rc.column] : undefined;
      const v = stated === undefined || stated === null ? '' : String(stated).trim();
      if (!v) { unstated.push({ group, index: i, accepts: rc.accepts }); return; }
      if (!rc.accepts.includes(v)) wrong.push({ group, index: i, stated: v, accepts: rc.accepts });
    });
  }
  return { wrong, unstated };
};

/** Print the finding. Returns the number of rows that must STOP the run. */
export const reportRowClasses = (result) => {
  const { wrong, unstated } = result;
  if (unstated.length) {
    console.log(`ROW CLASS: ${unstated.length} slotted row(s) state no asset class — reported, not failed. The group still prints them under its own declared heading.`);
    for (const u of unstated) console.log(`  ${u.group}[${u.index}]: no asset_class (group accepts ${u.accepts.join(', ')})`);
  }
  if (!wrong.length) {
    console.log('ROW CLASS: every slotted row that states an asset class states one its group prints.');
    return 0;
  }
  console.error(`ROW CLASS MISMATCH — ${wrong.length} row(s) claim an asset class the group does not print. No PDF written.`);
  for (const w of wrong) {
    console.error(`  ${w.group}[${w.index}]: row says asset_class ${JSON.stringify(w.stated)}, this group prints ${w.accepts.map((a) => JSON.stringify(a)).join(', ')}`);
  }
  console.error('  Printing it anyway would file the row under a printed heading it does not belong under —');
  console.error('  which is what defect D1 did, and the reason a row is allowed to say what it is.');
  return wrong.length;
};
