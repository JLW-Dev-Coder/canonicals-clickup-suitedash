// Author samples/433boi.overmax.sample.json — the STRESS fixture for 433-B(OIC).
//
//   node scratchpad/author-433boi-stress-fixture.mjs
//
// EVERY TOTAL IN THIS FILE IS COMPUTED FROM ITS OPERANDS BY THIS SCRIPT AND NONE IS TYPED.
// A typed total agrees with the tripwire because someone made it agree, which proves that the
// person can add and nothing about the engine.
//
// WHAT THIS RECORD IS FOR, AND WHY IT CARRIES MORE THAN OVERFLOW
// --------------------------------------------------------------
// Its first job is the overflow assertion: EVERY one of the seven declared groups is fed one
// row past its last printed slot, and every dropped row carries a distinguishing value in the
// first BOUND, NON-NUMERIC text column its group's last slot declares — the column
// adapters/pdf/assert-overflow.mjs derives from the map, not a marker this file and that tool
// agreed on between themselves.
//
// It carries three more things, and the reason is structural rather than convenient:
//
//   THE THREE UNTAKEN VEHICLE BRANCHES. The acceptance fixture parks vehicles 4a/4b/4c on
//   own / lease / own, so the `4a leased`, `4b own` and `4c leased` predicates have never
//   held on any record in this tree. This record parks them on lease / own / lease. One
//   record can only ever take one side of a printed conditional, so the second side needs a
//   second record and there is no third fixture to put it on.
//
//   BOX C's FLOOR. Box D is Box B MINUS Box C, and step 11 reads both operands back off the
//   printed page. So a record on which Box C floors prints Box C as 0, and Box D is then
//   Box B - 0, which cannot be negative while Box B is positive. Box C's floor and Box D's
//   floor are therefore UNREACHABLE ON ONE RECORD, and `negative` is a singleton role
//   (adapters/pdf/resolve-fixture.mjs). The negative fixture takes Box B and Box D; this one
//   takes Box C. Both are floors driven by a record, and which fixture drives which is an
//   allocation, not a weakening.
//
//   THE at_most INEQUALITY, STRICTLY. `Box A -> page 5 (offer row)` is exercised only when
//   the printed figure is STRICTLY BELOW the recomputed one — equality is the ordinary case
//   of an at_most line and proves only that the line was compared. The negative fixture
//   floors Box A to 0, and a page-5 copy strictly below 0 is a negative offer operand, which
//   is not a filing anyone would make. So the strict case is driven here, where Box A is
//   large and positive and the record takes the printed income-producing-asset exclusion.
import { readFileSync, writeFileSync } from 'node:fs';

const base = JSON.parse(readFileSync('samples/433boi.slice3.sample.json', 'utf8'));
const money = (n) => (Math.round(n * 100) / 100).toFixed(2);
const whole = (n) => String((n < 0 ? -1 : 1) * Math.round(Math.abs(n)));
const num = (s) => Number(String(s).replace(/[^0-9.-]/g, ''));

// ── THE OVERFLOW ROWS ───────────────────────────────────────────────────────────────────
// One past the last printed slot of every declared group. The distinguishing column of each
// is the first bound non-numeric text column the map's last slot declares for that group,
// re-derived here from the map so this file cannot drift from what assert-overflow reads.
const MAP = JSON.parse(readFileSync('adapters/pdf/maps/433boi.map.json', 'utf8'));
const NUMERIC = /^[\s$]*-?[\d,]+(\.\d+)?[\s%]*$/;
const distinguishingCol = (g) => {
  const d = MAP.groups[g];
  const last = (d.slots || [])[(d.slots || []).length - 1] || {};
  const bound = last.text || last;
  const cols = Object.keys(bound).filter((k) => typeof bound[k] === 'string' && bound[k].startsWith('topmostSubform[0]'));
  const row0 = (base[d.source || g] || [])[0] || {};
  const col = cols.find((c) => typeof row0[c] === 'string' && row0[c].trim() !== '' && !NUMERIC.test(row0[c]));
  if (!col) throw new Error(`no bound non-numeric text column on ${g} row 0 — the overflow row would have nothing to look for`);
  return col;
};

const groupsOver = {};
const overflowMarks = [];
for (const g of Object.keys(MAP.groups)) {
  const src = MAP.groups[g].source || g;
  const rows = base[src];
  const row = { ...rows[0] };
  const col = distinguishingCol(g);
  row[col] = `OVERFLOW - a row past the last printed slot of ${g}`;
  groupsOver[src] = [...rows.map((r) => ({ ...r })), row];
  overflowMarks.push(`${g}[${rows.length}] ${col}=${JSON.stringify(row[col])}`);
}

// ── THE THREE UNTAKEN VEHICLE BRANCHES: lease / own / lease ─────────────────────────────
// (4a QSV), (4b QSV) and (4c QSV) are unconditional — the printed X .8 applies whether the
// vehicle is leased or owned — so the quick-sale value is recomputed for every row. Only the
// EQUITY cell carries the printed conditional, and the leased branch's value is the printed
// constant 0 the caption states in words.
// AND THE OWNED VEHICLE CARRIES A LOAN. The acceptance record's second vehicle is the LEASED
// one and its loan balance is 0.00, so flipping it to `own` and leaving that cell alone would
// make (4b)'s declared `minus current_loan_balance` subtract a zero — the sign declaration
// would be in class and never fire, which is the same unexercised-rule gap this record exists
// to close. An owned vehicle with finance outstanding is the ordinary case, so it gets one.
const LEASE = ['lease', 'own', 'lease'];
const LOAN_WHEN_OWNED = { 1: 21_640.55 };
const vehicles = groupsOver.vehicles.map((r, i) => {
  if (i >= LEASE.length) return r;              // the dropped 4th row keeps its own tenure
  const fmv = num(r.current_fmv);
  const qsv = fmv * 0.8;
  const own = LEASE[i] === 'own';
  const loan = own ? (LOAN_WHEN_OWNED[i] ?? num(r.current_loan_balance)) : num(r.current_loan_balance);
  return { ...r, lease_or_own: LEASE[i], current_fmv: money(fmv), quick_sale_value: money(qsv),
    current_loan_balance: money(loan), quick_sale_equity: money(own ? qsv - loan : 0) };
});
groupsOver.vehicles = vehicles;
const total4 = vehicles.slice(0, 3).reduce((a, r) => a + num(r.quick_sale_equity), 0) + num(base.s2_4d_vehicles_from_attachment);

// ── page 4, Section 2 (continued): the printed equipment row, unchanged from acceptance ──
const eqEquity = num(base.business_equipment[0].equity);
const total5 = eqEquity + num(base.s3_equipment_from_attachment);

// ── Box A: lines (1) through (5), each read back off the page ───────────────────────────
// Lines (1), (2) and (3) are unchanged from the acceptance record; (4) is recomputed above
// because the tenure of two vehicles moved. The block declares nearest_dollar.
const boxA = Math.round(
  num(base.s2_1_total_bank_accounts) + num(base.s2_2_total_investment_accounts)
  + num(base.s2_3_total_real_estate) + total4 + total5);

// ── page 4, Section 3: (6) through (10) -> Box B, unchanged and positive ────────────────
const income = ['s3_6_gross_receipts', 's3_7_gross_rental_income', 's3_8_interest_income', 's3_9_dividends', 's3_10_other_income'];
const boxB = Math.round(income.reduce((a, k) => a + num(base[k]), 0));

// ── page 4, Section 4: (11) through (20) -> Box C, DRIVEN BELOW ZERO ────────────────────
// (20) "Other expenses" is the residual line, and a residual can be a CREDIT: an insurance
// recovery, a returned deposit, a supplier rebate booked against expense in the period. The
// nine named lines are unchanged; (20) is a credit larger than their sum, so the printed
// instruction "If any line item is a negative number, enter 0" is what decides the box.
const expenseKeys = ['s4_11_materials_purchased', 's4_12_inventory_purchased', 's4_13_gross_wages_and_salaries',
  's4_14_rent', 's4_15_supplies', 's4_16_utilities_telephones', 's4_17_vehicle_costs',
  's4_18_insurance', 's4_19_current_taxes', 's4_20_other_expenses'];
const namedNine = expenseKeys.slice(0, 9).reduce((a, k) => a + num(base[k]), 0);
const otherExpenses = -(namedNine + 18450);         // a credit that outruns the nine named lines
const boxCraw = namedNine + otherExpenses;          // negative by construction
const boxC = Math.max(0, Math.round(boxCraw));      // the printed floor
const boxD = Math.max(0, boxB - boxC);
const boxE = Math.max(0, boxD * 12);
const boxF = Math.max(0, boxD * 24);

// ── page 5: the at_most inequality, taken strictly ──────────────────────────────────────
// The asterisk beside "Enter the amount from Box A" permits excluding the equity in
// income-producing assets other than real estate. This record excludes the two investment
// accounts' equity, so the page-5 copy is strictly below Box A and the declared one-sided
// comparison bites rather than holding at equality.
const excluded = Math.round(base.investment_accounts.reduce((a, r) => a + num(r.equity), 0));
const amountFromBoxA = boxA - excluded;
const amountFromEorF = boxE;
const offer = amountFromBoxA + amountFromEorF;

const out = {
  ...base,
  ...groupsOver,
  intake_id: '433boi-overmax',
  s2_4_total_vehicles: money(total4),
  s3_total_all_business_equipment: money(total5),
  s3_box_a_available_equity_in_assets: whole(boxA),
  s3_box_b_total_business_income: whole(boxB),
  s4_20_other_expenses: whole(otherExpenses),
  s4_box_c_total_business_expenses: whole(boxC),
  s4_box_d_remaining_monthly_income: whole(boxD),
  s5_box_d_for_12_month_multiplier: whole(boxD),
  s5_box_e_future_remaining_income: whole(boxE),
  s5_box_d_for_24_month_multiplier: whole(boxD),
  s5_box_f_future_remaining_income: whole(boxF),
  s5_amount_from_box_a: whole(amountFromBoxA),
  s5_amount_from_box_e_or_box_f: whole(amountFromEorF),
  s5_offer_amount: whole(offer),
};

// The acceptance record's prose blocks describe the acceptance record. Replaced rather than
// inherited: a fixture carrying another fixture's account of itself is a lie in a file whose
// whole job is to be read.
for (const k of Object.keys(out)) if (k.startsWith('_')) delete out[k];

out._fixture = {
  form: '433boi',
  role: 'stress',
  why: 'One row more than printed in every one of the seven repeatable groups, for the overflow assertion; the three vehicle branches the acceptance record does not take; Box C driven below its printed floor; and the page-5 at_most inequality taken strictly.',
};
out._what_this_covers = 'OVERFLOW ON EVERY GROUP: ' + overflowMarks.join('; ') + '. Each dropped row carries a distinguishing value in the first bound non-numeric text column its group last slot declares, re-derived from the map by the generator, so adapters/pdf/assert-overflow.mjs can look for its absence on the filled page rather than trusting the engine own log.';
out._the_three_untaken_vehicle_branches = 'THE ACCEPTANCE RECORD PARKS 4a/4b/4c ON own / lease / own, so `4ac_vehicles[0].lease_or_own = "lease"`, `4ac_vehicles[1].lease_or_own = "own"` and `4ac_vehicles[2].lease_or_own = "lease"` have never held on any record in this tree. This record parks them on lease / own / lease. A record takes exactly one side of a printed conditional, so the other side needs another record and there is no third fixture to put it on. The quick-sale VALUE cells are recomputed for all three rows because the printed X .8 is unconditional; only the EQUITY cell carries the tenure conditional.';
out._why_box_c_floors_here_and_box_d_floors_there = 'BOX D IS BOX B MINUS BOX C AND STEP 11 READS BOTH OPERANDS BACK OFF THE PRINTED PAGE. A record on which Box C floors prints Box C as 0, so Box D becomes Box B - 0, which cannot be negative while Box B is positive; and a record on which Box B also floors makes Box D = 0 - 0. Box C floor and Box D floor are therefore unreachable on ONE record, and `negative` is a singleton role. samples/433boi.negative.sample.json drives Box B and Box D; this record drives Box C, through line (20), the printed residual expense line, carrying a credit larger than the nine named lines. Both are floors driven by a record; which fixture drives which is an allocation and not a weakening.';
out._why_the_at_most_is_taken_strictly_here = 'AN at_most LINE IS EXERCISED WHEN THE INEQUALITY BITES, NOT WHEN IT HOLDS. Equality is the ordinary case - a record that excluded nothing prints the total exactly - so the acceptance record proves only that the line was compared. The negative record floors Box A to 0 and a page-5 copy strictly below 0 would be a negative offer operand, which is not a filing anyone would make. So the strict case is driven here: Box A is large and positive, and the record takes the printed exclusion for the equity in income-producing assets other than real estate - the two investment accounts - which the asterisk permits and no cell on the form records.';
out._every_total_is_computed = 'NOT ONE TOTAL IN THIS FILE IS TYPED. Line (4) is recomputed because two vehicles changed tenure; Box A is the five page-2, page-3 and page-4 totals added and rounded to the nearest dollar as its block declares; Box C is the ten expense lines added and then floored at 0; Box D is Box B minus the FLOORED Box C; Box E and Box F are Box D times 12 and 24; the Offer Amount is the reduced Box A copy plus the Box E copy.';
out._synthetic = 'Every name, address, account number and figure in this record is invented. No real taxpayer, no real institution and no real SSN or EIN appears anywhere in it.';
out._generated_by = 'scratchpad/author-433boi-stress-fixture.mjs, a one-shot generator recorded in the commit that produced this file. It reads samples/433boi.slice3.sample.json for the saturated record and recomputes every total it moves.';

writeFileSync('samples/433boi.overmax.sample.json', JSON.stringify(out, null, 1) + '\n');
console.log('wrote samples/433boi.overmax.sample.json');
for (const m of overflowMarks) console.log(`  overflow  ${m}`);
console.log(`  (4) ${money(total4)}  Box A ${whole(boxA)}  Box B ${whole(boxB)}`);
console.log(`  (20) ${whole(otherExpenses)}  Box C raw ${money(boxCraw)} -> printed ${whole(boxC)} (floored)`);
console.log(`  Box D ${whole(boxD)}  Box E ${whole(boxE)}  Box F ${whole(boxF)}`);
console.log(`  page-5 Box A copy ${whole(amountFromBoxA)} against Box A ${whole(boxA)} - strictly below by ${excluded}`);
console.log(`  offer ${whole(offer)}`);
