// [B-07] — the equity-column relation, raised and NOT resolved ([R-20]).
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/433b.map.json';
const map = JSON.parse(readFileSync(P, 'utf8'));
const c = map._carried;
if (c.open.some((x) => x.id === 'B-07') || c.resolved.some((x) => x.id === 'B-07')) { console.error('STOP — [B-07] is already in the register.'); process.exit(2); }

c.open.push({
  id: 'B-07',
  raised_in: 'Prompt 49 commit 2, while closing the map on pages 5 and 6',
  subject: 'The EQUITY column header states a relation — "Equity / FMV Minus Loan" — and this engine treats it as a label rather than as a tripwire, on every table on the form that has one',
  the_shape: 'Four tables draw an equity column under a header that names an arithmetic relation. Page 3: INVESTMENTS at y 413.7/403.7 ("Equity / Value Minus Loan") and DIGITAL ASSETS at y 227.2/217.6 ("Equity Value / minus Loan"). Page 4: REAL PROPERTY at y 696.3/688.3 and VEHICLES at y 350.7/342.7, both "Equity / FMV Minus Loan". Page 5: BUSINESS EQUIPMENT at y 703.5/695.5, the same words again. TWELVE ROW-LEVEL EQUITY CELLS have both operands drawn beside them — 19a, 19b, 20b, 20c, 22a-22d and 23a-23d, plus 24a-24d on page 5, which is sixteen; the twelve figure is what pages 3 and 4 carry and page 5 adds four more. Every one of them is bound as an INPUT and none is a tripwire.',
  why_it_is_arguable_rather_than_a_defect: 'THE RELATION IS IN A COLUMN HEADER AND NOT ON A ROW. Every printed total this repo has ever made a tripwire says "Add lines X, Y, Z" or "Line X minus Line Y" ON THE LINE, between or beside the cells it governs. 433-B(OIC) is the contrast that makes the distinction real rather than convenient: it prints "$ [Current market value] – $ [Minus loan balance] = (2a) $" ON THE ROW, with the operator drawn between the two operands, and this engine DOES make that a tripwire. A column header describes what the column holds. Whether "FMV Minus Loan" is a description or an instruction is a reading of the page, and readings of the page are what this register exists to hold rather than settle in passing.',
  what_is_true_either_way: 'The cells are bound, they are money, they are compared to the cent by gate step 12 against the record, and they feed the block totals that ARE tripwires — 19c, 20e, 22e, 23e and 24h. So an equity cell that disagreed with its own row would still have to disagree with its block total, unless the error were compensated by another row in the same block. What is NOT checked is the per-row relation itself.',
  the_three_intangible_rows_cannot_carry_it_at_all: 'Rows 24e to 24g draw a description and an equity cell and NOTHING ELSE — no FMV, no loan balance. Whatever is decided for the sixteen cells that have both operands, these three have neither, and a relation with no operands drawn is not a relation the page states. Any resolution has to say so rather than sweeping the column.',
  why_it_is_not_settled_here: 'Making a column header into sixteen row-level tripwires is a ruling, and it reaches BACK over pages 3 and 4, which are landed and whose gates have run. This prompt closes the map on pages 5 and 6; retro-fitting arithmetic onto three earlier pages inside it is the adjacent change that has twice reproduced the defect class it was meant to close ([R-12]). Recorded with its instances located so it cannot evaporate.',
  what_slice_4_did_do_about_it: 'DECLARED THE ABSENCE. adapters/pdf/maps/433b.totals.json `not_checkable` gains an entry covering the equity columns of pages 3, 4 and 5 with this reason and this id. Pages 3 and 4 landed with equity columns and NO entry, which is exactly the state that block exists to end: a printed money cell holding a computed-looking figure that nobody had said anything about is indistinguishable from one nobody looked at.',
  status: 'OPEN - recorded, not built.',
});
c._count = { open: c.open.length, resolved: c.resolved.length };

writeFileSync(P, JSON.stringify(map, null, 1) + '\n');
const back = JSON.parse(readFileSync(P, 'utf8'));
const bad = [];
if (!back._carried.open.some((x) => x.id === 'B-07')) bad.push('[B-07] is not in the open list after the write.');
if (back._carried._count.open !== back._carried.open.length) bad.push('_count.open disagrees with the list.');
if (bad.length) { bad.forEach((x) => console.error(`STOP — ${x}`)); process.exit(2); }
console.log(`${P}: [B-07] raised; carried open ${back._carried._count.open}, resolved ${back._carried._count.resolved}`);
