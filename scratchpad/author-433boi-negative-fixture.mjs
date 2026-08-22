// Author samples/433boi.negative.sample.json — the NEGATIVE-DRIVING fixture for 433-B(OIC).
//
//   node scratchpad/author-433boi-negative-fixture.mjs
//
// EVERY TOTAL IN THIS FILE IS COMPUTED FROM ITS OPERANDS BY THIS SCRIPT AND NONE IS TYPED,
// INCLUDING THE FLOORED ONES. A floored total is `Math.max(floor, sum)` computed here from the
// same operands step 11 will read back off the printed page; it is not a zero somebody typed
// because they knew a zero was wanted.
//
// WHAT A FLOOR IS AND WHEN IT IS EXERCISED
// ----------------------------------------
// Every one of these lines prints the same instruction: "Do not enter a negative number. If any
// line item is a negative number, enter '0'." Step 11 recomputes the line from the printed
// operands, rounds it in the block the total sits in, and only then clamps — and it records the
// clamp as `floored`. So a floor is EXERCISED only on a record whose raw sum is genuinely below
// zero. A record where the sum happens to be positive proves that the floor was declared, never
// that it fires.
//
// WHICH FLOORS THIS RECORD REACHES, AND WHICH IT CANNOT
// -----------------------------------------------------
//   (1) (2) (3) (4)   an overdrawn account, an investment margin loan larger than the account,
//                     a property and a vehicle each mortgaged past their quick-sale value. All
//                     four are ordinary facts about a distressed business, which is the kind of
//                     business that files this form.
//   Box A             its five operands are the four totals above — each already floored to 0 —
//                     and line (5), WHICH DECLARES NO FLOOR. So Box A can only be driven below
//                     zero through (5), and it is: the one printed equipment row is financed
//                     past its quick-sale value.
//   Box B             line (10) "Other income (specify on attachment)" carrying a loss.
//   Box D             Box B minus Box C. Box B floors to 0 and Box C stays positive, so Box D's
//                     raw value is 0 - Box C, which is negative.
//
//   Box C             NOT REACHABLE HERE, AND REACHED BY THE STRESS FIXTURE INSTEAD. Box D is
//                     Box B MINUS Box C and step 11 reads both operands off the printed page, so
//                     a record on which Box C floors prints Box C as 0 and Box D becomes
//                     Box B - 0, which is never negative while Box B is positive. Box C's floor
//                     and Box D's floor cannot both fire on ONE record, and `negative` is a
//                     singleton role. See samples/433boi.overmax.sample.json.
//
//   Box E, Box F      STRUCTURALLY UNDRIVABLE BY ANY RECORD, and this is an argument, not an
//                     omission. Box E is `Box D x 12` and Box F is `Box D x 24`, and their only
//                     operand is the page-5 copy of Box D — which is itself floored at 0. A
//                     non-negative number times a positive multiplier is non-negative, so no
//                     record can make either sum fall below its floor. The declarations are
//                     sound and every fixture will report them unexercised for as long as the
//                     form prints the arithmetic it prints. Named in the report rather than
//                     chased.
import { readFileSync, writeFileSync } from 'node:fs';

const base = JSON.parse(readFileSync('samples/433boi.slice3.sample.json', 'utf8'));
const money = (n) => (Math.round(n * 100) / 100).toFixed(2);
const whole = (n) => String((n < 0 ? -1 : 1) * Math.round(Math.abs(n)));
const num = (s) => Number(String(s).replace(/[^0-9.-]/g, ''));
const floorAt0 = (n) => Math.max(0, n);

// ── page 2, (1): an overdrawn operating account ─────────────────────────────────────────
// Page 2's rounding block is `nearest_dollar`, so every cell on it is a whole dollar.
const bankAccounts = base.bank_accounts.map((r, i) => (i === 0
  ? { ...r, account_balance: whole(-80_412) }         // overdrawn on the operating account
  : { ...r }));
const raw1 = bankAccounts.reduce((a, r) => a + num(r.account_balance), 0) + num(base.s2_1d_bank_accounts_from_attachment);
const total1 = floorAt0(Math.round(raw1));

// ── page 2, (2): a margin loan larger than the account it is secured on ─────────────────
const investmentAccounts = base.investment_accounts.map((r, i) => {
  const value = num(r.current_value);
  const loan = i === 0 ? 200_000 : num(r.loan_balance);
  return { ...r, current_value: whole(value), loan_balance: whole(loan), equity: whole(value - loan) };
});
const raw2 = investmentAccounts.reduce((a, r) => a + num(r.equity), 0)
  + base.digital_assets.reduce((a, r) => a + num(r.equity), 0)
  + num(base.s2_2d_investment_accounts_from_attachment);
const total2 = floorAt0(Math.round(raw2));

// ── page 3, (3): a property mortgaged past its quick-sale value ─────────────────────────
// Page 3's block is `none_printed`, so these cells keep their cents.
const REAL_ESTATE_LOAN = { 0: 900_000.00 };
const realEstate = base.real_estate.map((r, i) => {
  const fmv = num(r.current_fmv);
  const qsv = fmv * 0.8;                                // the printed X .8
  const loan = REAL_ESTATE_LOAN[i] ?? num(r.current_loan_balance);
  return { ...r, current_fmv: money(fmv), quick_sale_value: money(qsv), current_loan_balance: money(loan), equity: money(qsv - loan) };
});
const raw3 = realEstate.reduce((a, r) => a + num(r.equity), 0) + num(base.s2_3c_property_from_attachment);
const total3 = floorAt0(raw3);

// ── page 3, (4): a vehicle financed past its quick-sale value ───────────────────────────
// Tenure is left where the acceptance record puts it — own / lease / own — because the three
// branches it does NOT take are driven by the stress fixture, and moving them here would take
// the `minus current_loan_balance` sign declarations on (4a) and (4c) out of class.
const VEHICLE_LOAN = { 0: 300_000.00 };
const vehicles = base.vehicles.map((r, i) => {
  const fmv = num(r.current_fmv);
  const qsv = fmv * 0.8;
  const own = r.lease_or_own === 'own';
  const loan = own ? (VEHICLE_LOAN[i] ?? num(r.current_loan_balance)) : num(r.current_loan_balance);
  return { ...r, current_fmv: money(fmv), quick_sale_value: money(qsv), current_loan_balance: money(loan),
    quick_sale_equity: money(own ? qsv - loan : 0) };
});
const raw4 = vehicles.reduce((a, r) => a + num(r.quick_sale_equity), 0) + num(base.s2_4d_vehicles_from_attachment);
const total4 = floorAt0(raw4);

// ── page 4, (5): the one printed equipment row, financed past its quick-sale value ──────
// (5) DECLARES NO FLOOR — the totals file says so and says why — and that is the only reason
// Box A can be driven below zero at all: its other four operands are already clamped to 0.
const eqFmv = num(base.business_equipment[0].current_fmv);
const eqQsv = eqFmv * 0.8;
const eqLoan = 400_000.00;
const eqEquity = eqQsv - eqLoan;
const businessEquipment = [{ ...base.business_equipment[0], current_fmv: money(eqFmv), quick_sale_value: money(eqQsv),
  current_loan_balance: money(eqLoan), equity: money(eqEquity) }];
const total5 = eqEquity + num(base.s3_equipment_from_attachment);

// ── Box A: (1) + (2) + (3) + (4) + (5), rounded to the nearest dollar, then floored ─────
const rawA = total1 + total2 + total3 + total4 + total5;
const boxA = floorAt0(Math.round(rawA));

// ── page 4, Section 3: (10) carries a loss, so Box B floors ─────────────────────────────
const income = { s3_6_gross_receipts: num(base.s3_6_gross_receipts), s3_7_gross_rental_income: num(base.s3_7_gross_rental_income),
  s3_8_interest_income: num(base.s3_8_interest_income), s3_9_dividends: num(base.s3_9_dividends), s3_10_other_income: -300_000 };
const rawB = Object.values(income).reduce((a, b) => a + b, 0);
const boxB = floorAt0(Math.round(rawB));

// ── page 4, Section 4: Box C is left POSITIVE, on purpose ───────────────────────────────
const expenseKeys = ['s4_11_materials_purchased', 's4_12_inventory_purchased', 's4_13_gross_wages_and_salaries',
  's4_14_rent', 's4_15_supplies', 's4_16_utilities_telephones', 's4_17_vehicle_costs',
  's4_18_insurance', 's4_19_current_taxes', 's4_20_other_expenses'];
const boxC = Math.round(expenseKeys.reduce((a, k) => a + num(base[k]), 0));
const rawD = boxB - boxC;                               // negative, because boxB floored to 0
const boxD = floorAt0(Math.round(rawD));

// ── page 5 ──────────────────────────────────────────────────────────────────────────────
// Box E and Box F are Box D times 12 and 24; Box D is 0, so both are 0 and neither floor can
// fire. The page-5 Box A copy is at_most Box A, and Box A is 0 — so it is 0, at equality. The
// STRICT case of that inequality is driven by the stress fixture, where Box A is positive.
const boxE = floorAt0(boxD * 12);
const boxF = floorAt0(boxD * 24);
const amountFromBoxA = boxA;
const amountFromEorF = boxE;
const offer = amountFromBoxA + amountFromEorF;

const out = {
  ...base,
  intake_id: '433boi-negative-floors',
  bank_accounts: bankAccounts,
  investment_accounts: investmentAccounts,
  real_estate: realEstate,
  vehicles,
  business_equipment: businessEquipment,
  s2_1_total_bank_accounts: whole(total1),
  s2_2_total_investment_accounts: whole(total2),
  s2_3_total_real_estate: money(total3),
  s2_4_total_vehicles: money(total4),
  s3_total_all_business_equipment: money(total5),
  s3_box_a_available_equity_in_assets: whole(boxA),
  ...Object.fromEntries(Object.entries(income).map(([k, v]) => [k, whole(v)])),
  s3_box_b_total_business_income: whole(boxB),
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
  role: 'negative',
  why: 'Drives every printed floor this form declares that any single record can reach: lines (1), (2), (3) and (4), Box A and Box B directly, and Box D through the floored Box B. Box C is left positive so Box D can go negative; Box E and Box F are structurally unreachable.',
};
out._which_floors_this_record_drives = 'SEVEN OF THE TEN DECLARED FLOORS: (1) an overdrawn operating account; (2) a margin loan larger than the account securing it; (3) a property mortgaged past its quick-sale value; (4) a vehicle financed past its quick-sale value; Box A, through line (5) - the only one of its five operands that declares no floor of its own, so the only route by which Box A can be driven below zero at all; Box B, through line (10) "Other income (specify on attachment)" carrying a loss; and Box D, which is Box B minus Box C with Box B floored to 0 and Box C left positive.';
out._which_floors_it_does_not_and_why = 'BOX C IS DRIVEN BY THE STRESS FIXTURE AND NOT HERE. Box D is Box B MINUS Box C and step 11 reads both operands back off the printed page, so a record on which Box C floors prints Box C as 0 and Box D becomes Box B - 0, which is never negative while Box B is positive; and a record on which both float down makes Box D = 0 - 0. Box C and Box D cannot both fire on one record, `negative` is a singleton role, and samples/433boi.overmax.sample.json takes Box C. BOX E AND BOX F ARE UNDRIVABLE BY ANY RECORD. Box E is the page-5 copy of Box D times 12 and Box F is the same cell times 24; that copy carries the value of Box D, which is itself floored at 0. A non-negative number times a positive multiplier is non-negative, so no record can put either sum below its floor. Both declarations are sound and will be reported unexercised by every fixture for as long as the form prints the arithmetic it prints.';
out._what_the_offer_calculation_says_here = 'THE OFFER AMOUNT IS ZERO, AND THE PAGE SAYS IT MUST NOT BE. "Your offer must be more than zero ($0)." is printed beside the cell at y 527.7. The arithmetic holds - 0 plus 0 is 0 - and the constraint does not, which is exactly why that constraint is carried as a review-page advisory on the total rather than as a floor: a floor would have the engine WRITE the one figure the page forbids. This record is the case that advisory exists for, and a preparer opening the review page for it is told so.';
out._the_page_5_copy_is_at_equality_here = 'THE at_most LINE HOLDS AT EQUALITY ON THIS RECORD AND IS NOT EXERCISED BY IT. Box A is 0, and a page-5 copy strictly below 0 is a negative offer operand - not a filing anyone would make. The STRICT case, where the record takes the printed income-producing-asset exclusion, is driven by samples/433boi.overmax.sample.json where Box A is large and positive.';
out._every_total_is_computed = 'NOT ONE TOTAL IN THIS FILE IS TYPED, INCLUDING THE FLOORED ONES. Each is Math.max(0, sum) over the same operands step 11 reads back off the printed page, rounded first in the block the total sits in and clamped after - the order the page prints the two sentences in. A zero somebody typed because they knew a zero was wanted would agree with the tripwire and prove nothing.';
out._synthetic = 'Every name, address, account number and figure in this record is invented. No real taxpayer, no real institution and no real SSN or EIN appears anywhere in it.';
out._generated_by = 'scratchpad/author-433boi-negative-fixture.mjs, a one-shot generator recorded in the commit that produced this file. It reads samples/433boi.slice3.sample.json for the saturated record and recomputes every total it moves.';

writeFileSync('samples/433boi.negative.sample.json', JSON.stringify(out, null, 1) + '\n');
console.log('wrote samples/433boi.negative.sample.json');
const row = (l, raw, printed) => console.log(`  ${l.padEnd(6)} raw ${money(raw).padStart(14)} -> printed ${printed.padStart(12)}${raw < 0 ? '  FLOORED' : ''}`);
row('(1)', raw1, whole(total1));
row('(2)', raw2, whole(total2));
row('(3)', raw3, money(total3));
row('(4)', raw4, money(total4));
row('(5)', total5, money(total5));
row('Box A', rawA, whole(boxA));
row('Box B', rawB, whole(boxB));
row('Box C', boxC, whole(boxC));
row('Box D', rawD, whole(boxD));
row('Box E', boxD * 12, whole(boxE));
row('Box F', boxD * 24, whole(boxF));
console.log(`  offer ${whole(offer)} (page-5 Box A copy ${whole(amountFromBoxA)} + Box E copy ${whole(amountFromEorF)})`);
