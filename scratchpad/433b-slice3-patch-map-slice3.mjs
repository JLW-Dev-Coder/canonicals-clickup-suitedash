// Land slice 3 into adapters/pdf/maps/433b.map.json, and extend adapters/pdf/maps/433b.totals.json.
//
// The bindings and every evidence figure come from scratchpad/433b-slice3-gen-slice3-433b.mjs,
// which asserts each caption against the drawn page and refuses the run on any it cannot find
// where the declared rule says it is. Nothing here re-derives a coordinate; this file is the
// assembly step, and it reads the generator's outputs rather than a copy of them.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const MAP = 'adapters/pdf/maps/433b.map.json';
const TOT = 'adapters/pdf/maps/433b.totals.json';
const EV = 'adapters/pdf/tmp/p48/slice3-evidence.json';
const BI = 'adapters/pdf/tmp/p48/slice3-bindings.json';
for (const p of [MAP, TOT, EV, BI]) if (!existsSync(p)) { console.error(`STOP — ${p} is not in this tree. Run the generator first.`); process.exit(2); }

const m = JSON.parse(readFileSync(MAP, 'utf8'));
const tot = JSON.parse(readFileSync(TOT, 'utf8'));
const evidence = JSON.parse(readFileSync(EV, 'utf8'));
const bindings = JSON.parse(readFileSync(BI, 'utf8'));

if (m.slice !== 'slice 2 — pages 1 to 3') { console.error(`STOP — the map declares slice ${JSON.stringify(m.slice)}; this patch expects slice 2. Refusing to land slice 3 twice.`); process.exit(2); }

const T = (k) => { const b = bindings.find((x) => x.key === k); if (!b) { console.error(`STOP — no binding for ${k}`); process.exit(2); } return b.target; };

// ═══════════════════════════════════════════════════════════════════════════════════════
// GROUPS — the two tables page 4 draws
// ═══════════════════════════════════════════════════════════════════════════════════════
const slotsFor = (group, n, cols) => Array.from({ length: n }, (_, i) => ({
  text: Object.fromEntries(cols.map((c) => [c, T(`${group}[${i}].${c}`)])),
}));

const RP_COLS = ['description', 'purchase_date', 'current_fmv', 'current_loan_balance', 'monthly_payment', 'final_payment_date', 'equity', 'location', 'lender_name_address', 'lender_phone'];
const VH_COLS = ['model_year', 'make_model', 'mileage', 'license_tag', 'vin', 'purchase_date', 'current_fmv', 'current_loan_balance', 'monthly_payment', 'final_payment_date', 'equity', 'lender_name_address', 'lender_phone'];

m.groups.real_property = {
  max: 4,
  slots: slotsFor('real_property', 4, RP_COLS),
  _printed: 'Four printed rows, markers 22a (y 669.1), 22b (y 600.7), 22c (y 532.3) and 22d (y 463.9), under the block heading "REAL PROPERTY" at y 715.1 x 43.2..110.5 with the instruction "Include all real property and land contracts the business owns/leases/rents." at x 114.9..384.7. Ten columns per row: a six-cell grid under a shared column-header stack, a Property Description cell drawn once PER ROW, and three cells on the two lines beneath — Location, Lender/Lessor/Landlord Name and Address, and a Phone cell captioned from the left.',
  _max_is_from_the_page: 'The form draws exactly four rows and a fifth line, 22e, which is their total rather than a fifth property. `max` 4 is the count of printed property rows.',
  _the_leaf_names_are_one_marker_behind: 'Every cell in the printed 22a row is named 21a, and so on to 22d/21d. [B-03] ruled the same offset on page 3 and the page won there too. The two exceptions are p4_01_22bLine2 and p4_02_22bLine2 — the 22b location and lender cells — whose token happens to MATCH their printed marker; the same two cells are p4_8_21a/p4_9_21a on 22a, p4_24_21c/p4_25_21c on 22c and Line2d/f2_037_0_ on 22d, which carry no row token at all. Four rows, four naming schemes, two names right by coincidence and nothing in the names saying which two.',
  _the_four_phone_cells_carry_page_3_tokens: 'The lender phone cells are p3_03_18a, p3_10_18b, p3_17_18c and p3_31_18e. Page 3 draws lines 18a to 18e as its ACCOUNTS/NOTES RECEIVABLE table; page 4 draws no line 18 at all. Bound on geometry with the name contradicted rather than explained. Cells are named by key in this file; the full paths are in the evidence table, once each.',
};

m.groups.vehicles = {
  max: 4,
  slots: slotsFor('vehicles', 4, VH_COLS),
  _printed: 'Four printed rows, markers 23a (y 323.5), 23b (y 255.1), 23c (y 186.7) and 23d (y 118.3), under the block heading "VEHICLES, LEASED AND PURCHASED" at y 370.5 x 43.2..191.4 with the instruction "Include boats, RVs, motorcycles, all-terrain and off-road vehicles, trailers, mobile homes, etc." at x 195.8..528.3. Thirteen columns per row: the SAME six-cell grid as the real-property table above, at identical x, plus Year, Make/Model, Mileage, License/Tag Number, a Lender/Lessor Name and Address cell, a VIN cell and a Phone cell.',
  _max_is_from_the_page: 'The form draws exactly four rows and a fifth line, 23e, which is their total. `max` 4 is the count of printed vehicle rows.',
  _the_grid_is_the_same_six_columns_as_real_property: 'Both blocks draw the identical six-run column-header stack at identical x — Purchase/Lease Date at 201.6..259.2, Current Fair Market Value at 269.2..324.0, Current Loan Balance at 334.0..388.8, Amount of Monthly Payment at 398.8..453.6, Date of Final Payment at 453.6..511.2 and Equity FMV Minus Loan at 521.2..576.0. The header therefore cannot say which BLOCK a cell is in, only which column; the printed row marker is what says the block, and it is on every one of the 48 grid bindings.',
  _four_columns_share_two_x_lanes: 'Year and Mileage are both drawn at x 50.4..115.2, and Make/Model and License/Tag Number both at x 115.2..201.6. They are separated by BAND, not by x, and each carries a second witness in its own widget: maxLen 4 on Year against 7 on Mileage, and 15 on License/Tag Number against no limit on Make/Model.',
  _the_lender_caption_omits_landlord: 'This block\'s caption reads "Lender/Lessor Name, Address," where the real-property block above reads "Lender/Lessor/Landlord Name, Address,". Transcribed as drawn rather than normalised to the other block\'s wording — a vehicle has no landlord.',
  _two_phone_cells_wear_the_same_name: 'The four lender phone cells are p4_43_59b, p4_54_69b, p4_64_69b and p4_74_79b. TWO OF THEM CARRY 69b, on rows the page marks 23b and 23c, and they are told apart by band alone. No line 59, 69 or 79 is drawn anywhere on this form.',
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// SCALARS — the two totals
// ═══════════════════════════════════════════════════════════════════════════════════════
for (const t of evidence.totals) m.map[t.key] = t.target;

// ═══════════════════════════════════════════════════════════════════════════════════════
// PROSE — what this page is, and what it is not
// ═══════════════════════════════════════════════════════════════════════════════════════
m.slice = 'slice 3 — pages 1 to 4';
m.map_version = 3;
m.authored_from_page4 = 'The drawn page text and widget geometry of adapters/pdf/forms/f433b.pdf page 4, extracted from the content streams by adapters/pdf/page-geometry.mjs. Every caption quoted below was asserted against the page by scratchpad/433b-slice3-gen-slice3-433b.mjs, which stops the run on any it cannot find where the declared pairing rule says it is.';

m._the_condition_that_governs_page_4 = 'PAGE 4 IS TWO TABLES AND TWO TOTALS, AND NOTHING ELSE. 94 widgets, every one of them a PDFTextField — the page draws no checkbox at all, so no exclusive set, no check_here and no row flag arises on it. The two tables share one six-column money-and-date grid drawn at identical x, and differ in the cells drawn beneath each row: real property adds Location and a Lender/Lessor/Landlord line, vehicles add Year, Make/Model, Mileage, License/Tag Number and a VIN.';

m._the_leaf_names_on_page_4_are_one_printed_marker_behind = 'ON 82 OF THE 94. The printed markers are 22a-22e and 23a-23e; the leaf tokens are 21a-21e and 22a-22e. Two names agree by coincidence (p4_01_22bLine2, p4_02_22bLine2), eight carry a token from a block on another page (18a, 18b, 18c, 18e, 59b, 69b twice, 79b), and two carry no row token at all (Line2d, f2_037_0_). THE OFFSET COLLIDES WITH LANDED BINDINGS: page 3 draws AVAILABLE CREDIT at printed 21a and 21b, which slice 2 bound to widgets named Row20a and Row20b. So the token "21a" denotes a page-3 available-credit row to the page and a page-4 real-property row to the AcroForm. Every binding on this page is fixed by the printed marker for its row and the printed column header for its column; the generator ASSERTS the offset set by name and stops if it changes.';

m._the_five_flag_classes_on_page_4 = 'The five flagged columns in adapters/hubspot/asset-row-shapes.json are is_business_account (twice, on two classes), kind (primary residence / other), claimed_on_1040 and contributes_to_household_income. NONE OF THE FIVE APPEARS ON PAGE 4, and this is the page where one of them would be expected: `kind` is a REAL-ESTATE column on 433-A, drawn there as a Primary Residence / Other pair inside each property row, and page 4 is 433-B\'s real-property page. IT DRAWS NO SUCH PAIR. Read off the drawn page rather than off this map: "primary residence", "business account", "check if", "1040" and "household" each return zero occurrences across page 4\'s 161 printed runs, and the page carries zero checkbox widgets of any kind, so there is no box for such a column to be. The real-property row on this form is ten cells and none of them is a flag.';

m._the_arithmetic_on_page_4 = 'TWO PRINTED TOTALS, 22e AND 23e, EACH SUMMING THE EQUITY COLUMN OF THE FOUR ROWS ABOVE IT. Both captions name their own addends — "Total Equity (Add lines 22a through 22d and amounts from any attachments)" and the same for 23a through 23d — which is why they are tripwires at all. Both are declared `equals` and both inherit [B-05]: the caption names "amounts from any attachments" and the form draws no cell for it, so the equality is an assertion about what THIS ENGINE writes, not about every correctly filed 433-B. No floor is declared on either, for the reason the other four carry: this form prints no rounding instruction and no "do not enter a negative number" sentence anywhere.';

m._no_arguable_item_on_page_4 = 'PAGE 4 PRODUCED NO ARGUABLE ITEM, and that is a finding rather than an omission. Every one of the 94 cells is determinate on two independent printed witnesses — the row marker and the column header — and the six grid columns carry a THIRD: each printed row draws exactly four "$" marks, at x 262.0, 326.8, 391.6 and 514.0, immediately left of the four money cells and NOT left of the two date cells, and the widgets agree independently with maxLen 8 on both date columns against 12 on all four money columns. The two totals were the only candidates for an arguable item and both are settled: see _the_two_totals_are_not_the_B06_shape.';

m._the_two_totals_are_not_the_B06_shape = '[B-06] is open because the 20e total cell on page 3 is drawn wider than the column its caption names AND its printed "$" sits at another COLUMN\'s marker position, so its two witnesses point at different columns. The 22e and 23e cells are wider than the equity column too — x 492.4..576.0 against an equity lane of 521.2..576.0 — but their witnesses AGREE. Their "$" is at x 485.2..489.6, and 485.2 is not one of the four column marker positions this page uses; it belongs to no column but the total line. And x 492.4 is the SAME left edge the two unambiguous totals on page 3 use, 18f at 492.4..576.0 and 19c at 492.5..576.0. Caption, money marker and cross-page precedent all say equity. Recorded because the resemblance is close enough that a reader who knows [B-06] would expect a second instance here, and there is not one.';

// THE EVIDENCE TABLE, IN THE SHAPE SLICE 2 ESTABLISHED — cells named by LEAF, never by full
// path. A topmostSubform path in map prose is resolved by validate-map.mjs against the field list
// and COUNTED AS A SECOND BINDING; the first draft of this patch emitted `target` on all 94 rows
// and gate step 4 reported every page-4 target as written by more than one key.
m._map_evidence_page4 = {
  _the_pairing_rule: 'Four rules, declared once in scratchpad/433b-slice3-gen-slice3-433b.mjs and cited per cell: C a column caption CONTAINED in the x range of the cell and drawn above it; CO the same but only overlapping; L immediately left with the baseline inside the rectangle; T the total-line rule, which requires the caption on the same baseline as the cell, ending left of it, with exactly one printed "$" between them within 12pt. Page 4 uses three of the four — 84 C, 8 L, 2 T — and no cell on it needed CO.',
  _every_figure_below_is_derived: 'The widget rectangle, maxLen and printed_at on every row are read from the drawn page by the generator on every run. printed_at names the FIRST RUN of the caption, because most captions on this page are not one run: "Purchase/Lease Date (mmddyyyy)" is drawn as three runs on three baselines and no run carries the whole phrase. A caption whose runs are not on the page stops the generator.',
  _second_witness: 'Every one of the 92 table cells carries two independent printed witnesses — the row marker for the row and the column header for the column — because a column header captions a COLUMN and cannot say which row a cell is in. The six grid columns carry a THIRD: four printed "$" marks per row, immediately left of the four money cells and not left of the two date cells, agreed independently by the maxLen the widgets themselves carry, 12 against 8.',
  _correlate_labels_is_not_consulted: '[B-01]. Run against 433-B for this slice it failed its own page-1 self-check and exited without writing, so there is no 433b.labels.json in this tree and no page-4 answer from it. Its probes were NOT retuned to make it pass — the guard exists to catch the tool.',
  bindings: evidence.rows,
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// PARTITION — derived, never typed
// ═══════════════════════════════════════════════════════════════════════════════════════
const TOTAL_FIELDS = m._partition.form_fields_total;
const inSlice = m._partition.in_this_slice + evidence.fields;
m._partition = {
  _why: m._partition._why,
  form_fields_total: TOTAL_FIELDS,
  in_this_slice: inSlice,
  bound_writable: inSlice,
  excluded_never_autofill: 0,
  deferred: 0,
  unaccounted: TOTAL_FIELDS - inSlice,
  // [S-03] READS ONE PER-PAGE FIGURE FOR EACH AUTHORED PAGE and compares each against the widgets
  // that page draws. Slice 2 stated three — for pages 4, 5 and 6 — and satisfied the requirement
  // only because three pages happened to be authored at the time. With four authored the prose has
  // to carry four, so it now names EVERY page of the form: the four this map has read and the two
  // it has not. Each figure is the widget count of the page it names, which is what [S-03] checks.
  _check: `${inSlice} + 0 + 0 = ${inSlice} bound writable, never-autofill and deferred, and that is every field pages 1 to 4 draw. `
    + `${TOTAL_FIELDS} - ${inSlice} = ${TOTAL_FIELDS - inSlice} unaccounted, which is every field on pages 5 and 6. `
    + 'THE PER-PAGE FIGURES, FOR EVERY PAGE OF THE FORM RATHER THAN ONLY THE UNREAD ONES: '
    + '103 on page 1, 64 on page 2, 82 on page 3, 94 on page 4, 70 on page 5, 34 on page 6. '
    + 'The first four sum to the accounted figure above and the last two to the unaccounted one. '
    + 'THIS MAP IS NOT CLOSED and says so; the unaccounted figure falls to zero when slice 4 lands and not before.',
  _why_unaccounted_and_not_deferred: m._partition._why_unaccounted_and_not_deferred,
  _unaccounted_by_page: 'p5 70, p6 34 = 104',
};
m._deferred_pages = 'Pages 5 and 6 are slice 4, 104 fields. THE FIGURES ARE NOT PARENTHESISED, and that is not style: a bracketed number in map prose reads as a printed LINE MARKER to blanket-audit.mjs, which then demands that marker from line-markers.mjs and reports a forward-reference gap, because this form draws no marker of that number.';

// ═══════════════════════════════════════════════════════════════════════════════════════
// TOTALS FILE — two new entries
// ═══════════════════════════════════════════════════════════════════════════════════════
tot.authored_from = 'The printed page text of adapters/pdf/forms/f433b.pdf pages 2, 3 and 4, extracted from the content streams. Each caption below is quoted verbatim from the drawn page and each names its own addends, which is why these six are tripwires at all: where a form does not say what it adds, a computed figure is this engine\'s assertion rather than the page\'s.';
tot._notes = tot._notes.filter((n) => !n.startsWith('THE AVAILABLE-CREDIT BLOCK HAS NO ENTRY'));
tot._notes.push('THE AVAILABLE-CREDIT BLOCK STILL HAS NO ENTRY, AND PAGE 4 IS WHY IT NEVER WILL. Page 3 draws rows 21a and 21b and no total row beneath them; page 4 opens a new block, REAL PROPERTY, at printed marker 22a. So the available-credit block ends where page 3 ends and the form prints no total for it. That was an open absence about pages 1 to 3 when slice 2 landed and it is a CLOSED one now: the next printed marker after 21b has been read and it starts a different table. [C23-4] is answered.');
tot._notes.push('PAGE 4 ADDS TWO TOTALS AND NO NEW SHAPE. Both are `equals`, both name "amounts from any attachments" as an addend the page draws no cell for, and both therefore inherit [B-05] exactly as the first four do. Six printed totals on this form now, six equality tripwires, one open item covering all six.');

for (const t of evidence.totals) {
  tot.totals.push({
    line: t.marker,
    caption: `Total Equity (Add lines ${t.marker === '22e' ? '22a through 22d' : '23a through 23d'} and amounts from any attachments)`,
    caption_at: `page 4, ${t.caption_at}`,
    printed_rows: t.marker === '22e'
      ? '22a to 22d — the four Equity FMV Minus Loan cells of the REAL PROPERTY table'
      : '23a to 23d — the four Equity FMV Minus Loan cells of the VEHICLES, LEASED AND PURCHASED table',
    total_key: t.key,
    feeders: [{ group: t.marker === '22e' ? 'real_property' : 'vehicles', column: 'equity' }],
    _which_column_the_total_sums: `THE EQUITY COLUMN, ON THE CAPTION AND ON THE MONEY MARKER, AND THEY AGREE. The cell is ${t.cell}, wider than the equity lane of 521.2..576.0, and its printed "$" is at x 485.2..489.6 — which is NOT one of this page's four column marker positions (262.0, 326.8, 391.6, 514.0) and so belongs to no column but this line. Its left edge 492.4 is the same left edge 18f and 19c use on page 3. UNLIKE [B-06], whose money marker sits at a neighbouring column's position, both witnesses here point the same way.`,
    _the_operand_list_is_the_captions_own: `The caption names ${t.marker === '22e' ? '22a through 22d' : '23a through 23d'}, which are the four printed rows, plus "amounts from any attachments", for which this form draws no cell. Four printed cells, one feeder, and the missing fifth term is [B-05].`,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// WRITE
// ═══════════════════════════════════════════════════════════════════════════════════════
writeFileSync(MAP, JSON.stringify(m, null, 1) + '\n');
writeFileSync(TOT, JSON.stringify(tot, null, 1) + '\n');
const bw = Object.keys(m.map).length + Object.values(m.groups).reduce((s, g) => s + (g.slots || []).reduce((t, sl) => t + Object.keys(sl.text || {}).length + Object.keys(sl.checkboxes || {}).length, 0), 0);
console.log(`map:    slice ${JSON.stringify(m.slice)}, version ${m.map_version}`);
console.log(`        groups ${Object.keys(m.groups).length}, scalars ${Object.keys(m.map).length}`);
console.log(`        partition ${m._partition.in_this_slice} in slice, ${m._partition.unaccounted} unaccounted of ${m._partition.form_fields_total}`);
console.log(`totals: ${tot.totals.length} printed total(s) declared`);
