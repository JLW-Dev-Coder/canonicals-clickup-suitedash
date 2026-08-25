// [B-07] — THE CARRIED ITEM MOVES TO RESOLVED, AND THE MAP'S ARITHMETIC PROSE SAYS WHAT IS NOW
// TRUE OF EACH PAGE.
//
//   node scratchpad/b07-carried-and-prose.mjs
//
// The item leaves `open` the way every item leaves it: RESOLVED, with what resolved it. Its
// `the_shape` sentence — "Every one of them is bound as an INPUT and none is a tripwire" — is
// the anchor adapters/pdf/blanket-audit.mjs [K-113] was written against, so the resolution
// carries the sentence [K-113] is re-aimed at instead, and the two move in the same commit.

import { readFileSync, writeFileSync } from 'node:fs';

const MAP = 'adapters/pdf/maps/433b.map.json';
const doc = JSON.parse(readFileSync(MAP, 'utf8'));
const carried = doc._carried;

const i = (carried.open || []).findIndex((x) => x.id === 'B-07');
if (i < 0) { console.error('STOP — [B-07] is not in this map\'s `_carried.open`. It cannot be resolved out of a list it is not in.'); process.exit(2); }
const item = carried.open.splice(i, 1)[0];

item.status = 'RESOLVED — Prompt 51 commit 3. Sixteen cells declared and proved; three declared not checkable, for a reason about the page.';
item.what_decided_it = 'THE CONTRAST THE ITEM ITSELF NAMED. [B-07] hesitated because the relation is printed in a COLUMN HEADER rather than on the row, and every printed total this repo had made a tripwire said "Add lines X, Y, Z" or "Line X minus Line Y" ON THE LINE. The item then named 433-B(OIC) as the case that made the distinction real: it prints "$ [Current market value] - $ [Minus loan balance] = (2a) $" on the row, with the operator drawn between the operands, and this engine DOES make that a tripwire. It makes it one through `total_cell` — the exact schema these sixteen needed and already had available. The page states the relation, both operands are drawn on the row, and the engine can compute it from cells the form draws. A relation the page states and the engine can compute is not a label.';
item.what_landed = 'SIXTEEN CELLS BECAME DECLARED LINES: 19a and 19b on INVESTMENTS and 20b and 20c on DIGITAL ASSETS (page 3), 22a to 22d on REAL PROPERTY and 23a to 23d on VEHICLES (page 4), and 24a to 24d on BUSINESS EQUIPMENT (page 5). Each is declared with `total_cell` naming its own row and `relation: "row"` marking its class, and each computes the same relation the header over it prints: the fair market value cell of that row minus the loan balance cell of that row. Every coordinate in the new entries was re-read from the page bytes by the script that wrote them, and a header run or a row marker not drawn where the entry says is a STOP.';
item.the_three_intangible_rows = 'DECLARED NOT CHECKABLE, AND THE REASON IS THE ITEM\'S OWN. Rows 24e, 24f and 24g draw a description and an equity cell and nothing else. Neither operand is drawn on them. The column header names a relation over two cells and the form draws neither, so there is nothing on the page to recompute the figure from — and this engine does not assert figures the page never asks anyone to compute. The `not_checkable` entry that used to cover the whole equity column now covers exactly these three, with that reason and a review-page advisory saying that every OTHER equity cell on the form is checked and this one is not.';
item.what_the_instrument_watching_it_found_about_itself = 'ITS UNIVERSE WAS FOUR CELLS SMALLER THAN THE CLAIM IT WATCHED. [K-113] admitted `<group>[<i>].equity` and counted fifteen cells; INVESTMENTS and DIGITAL ASSETS name their column `equity_value_minus_loan`, so the four page-3 cells THIS ITEM ITSELF COUNTED were outside the counter written to watch this item. The re-aimed [K-113] and the new [K-114] admit any equity-shaped column name and split the population by whether the row draws both operands — three that do not, sixteen that do.';
item.nothing_that_was_filling_moved = 'PROVED RATHER THAN ASSERTED. The sixteen cells were already bound and already filled; making them declared lines adds a comparison and changes no value. Every filled PDF this engine produces for all five forms was captured before the change and compared cell by cell against the same run after it, with adapters/pdf/compare-filled.mjs — by VALUE, because two pdf-lib runs over one input do not produce identical bytes and a byte comparison would report a difference on every run and train a reader to ignore it.';
item.how_resolved = 'scratchpad/b07-declare-equity-relations.mjs wrote the sixteen entries and narrowed the not_checkable entry; adapters/pdf/count-sweep.mjs gained a second universe per page rather than having its existing claims bumped; adapters/pdf/blanket-audit.mjs [K-113] was re-aimed and [K-114] added; and scratchpad/prove-tripwires-fire.mjs then proved all twenty-seven of 433-B\'s declared lines refuse a wrong value, one break each, to [R-28].';

carried.resolved = carried.resolved || [];
carried.resolved.push(item);
if (carried._count) carried._count = { open: carried.open.length, resolved: carried.resolved.length };

// --- the arithmetic prose, per page, extended rather than rewritten -------------------------
const APPEND = {
  _the_arithmetic_arrives_on_page_2:
    ' AND SIXTEEN ROW-LEVEL RELATIONS ARRIVE WITH [B-07], four of them on this page: 19a, 19b, 20b and 20c. They are a DIFFERENT CLASS from the four block totals above — the relation each computes is printed in the COLUMN HEADER over the cell ("Equity / Value Minus Loan", "Equity Value / minus Loan") rather than in a caption beside it, and each is addressed by `total_cell` rather than by `total_key`. Both classes are printed arithmetic this engine recomputes from cells the page draws, and gate step 11 treats them identically; they are counted separately because a figure that silently absorbs a second class is a figure whose universe moved without anybody saying so.',
  _the_arithmetic_on_page_4:
    ' AND EIGHT ROW-LEVEL RELATIONS ON THIS PAGE, from [B-07]: 22a to 22d under REAL PROPERTY and 23a to 23d under VEHICLES, each computing "Equity / FMV Minus Loan" — the relation printed in the header over the column — from the Current Fair Market Value and Current Loan Balance cells of its own row. The two block totals 22e and 23e SUM those equity cells, so each of the eight is now both a declared line and an operand of one.',
  _the_arithmetic_on_pages_5_and_6:
    ' AND FOUR ROW-LEVEL RELATIONS ON PAGE 5, from [B-07]: 24a to 24d under BUSINESS EQUIPMENT, the same "Equity / FMV Minus Loan" header redrawn over the same six-column stack. 24e, 24f and 24g draw an equity cell and NEITHER operand, so they stay declared not checkable — the block total 24h sums all seven, which is why three of its operands are figures this engine prints as given.',
};
for (const [k, add] of Object.entries(APPEND)) {
  if (typeof doc[k] !== 'string') { console.error(`STOP — the map carries no prose at ${k}, so this patch cannot extend it.`); process.exit(2); }
  if (doc[k].includes('[B-07]')) { console.error(`STOP — ${k} already names [B-07]. It has been extended before and running again would double it.`); process.exit(2); }
  doc[k] = doc[k] + add;
  console.log(`extended ${k} (+${add.length} chars)`);
}

writeFileSync(MAP, JSON.stringify(doc, null, 1) + '\n');
console.log('');
console.log(`${MAP}: _carried open ${carried.open.length}, resolved ${carried.resolved.length}`);
console.log(`  open ids: ${carried.open.map((x) => x.id).join(', ') || '(none)'}`);
