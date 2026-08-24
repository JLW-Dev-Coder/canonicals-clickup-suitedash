// The slice-4 acceptance fixture (samples/433b.slice4.sample.json) and the extended stress
// fixture (samples/433b.overmax.sample.json).
//
// SATURATED means every one of the 446 writable cells across all six pages carries a value,
// every group is filled to its printed row count, and every declared exclusive set has exactly
// one option chosen. A cell left empty here is a cell the gate never proved writable, which is
// the state a saturated fixture exists to remove.
//
// THE ONE CELL THAT IS DELIBERATELY NOT WRITTEN is printed line 48, the IRS-use expense cell.
// The map declares it under _never_autofill and this record carries no key for it, which is a
// stronger statement than an empty string would be: there is no key to accidentally fill.
//
// PAGES 1 TO 4 ARE CARRIED FORWARD VERBATIM from samples/433b.slice3.sample.json rather than
// retyped, for the reason slices 2 and 3 gave: a retyped copy of a landed record is hundreds of
// chances to differ from the record the previous gate actually ran, and nothing would say which
// of the two was meant. The slice-3 fixture is then marked `superseded` and made to name this
// one, which resolve-fixture.mjs requires.
//
// THE FIVE NEW TOTALS ARE COMPUTED FROM THE ROWS IN THIS FILE, HERE, ONCE. Gate step 11
// recomputes them from what the FILLED PDF prints and compares. Two computations over two
// different artefacts. A fixture carrying a typed total would be asserting the arithmetic it is
// supposed to be exercising.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'samples/433b.slice3.sample.json';
const OUT = 'samples/433b.slice4.sample.json';
const OVER = 'samples/433b.overmax.sample.json';

const prior = JSON.parse(readFileSync(SRC, 'utf8'));
// THE GUARD HAS TO ADMIT ITS OWN AFTERMATH — the same contract slice 3 wrote and for the same
// reason: assert-fixture-authorship.mjs RE-RUNS this generator and compares byte for byte, so a
// generator that refuses to run twice cannot have its claim assessed.
const priorRole = prior._fixture?.role;
const priorOk = priorRole === 'acceptance' || (priorRole === 'superseded' && prior._fixture?.superseded_by === OUT);
if (!priorOk) { console.error(`STOP — ${SRC} declares role ${JSON.stringify(priorRole)}${priorRole === 'superseded' ? ` naming ${JSON.stringify(prior._fixture?.superseded_by)}` : ''}; this generator supersedes it into ${OUT}.`); process.exit(2); }

const money = (n) => n.toFixed(2);
const sum = (rows, col) => rows.reduce((a, r) => a + Number(String(r[col]).replace(/[^0-9.-]/g, '')), 0);
const sumKeys = (rec, keys) => keys.reduce((a, k) => a + Number(String(rec[k]).replace(/[^0-9.-]/g, '')), 0);

// ── page 5, BUSINESS EQUIPMENT, printed markers 24a to 24d ─────────────────────────────────
// Row 24c is LEASED: its FMV, loan balance and equity are 0.00 and its monthly payment is the
// lease payment, which is what the printed column headers ask for on a row the block heading
// says to include ("Include all machinery, equipment, merchandise inventory, and other assets").
// A zero is a written value and an empty cell is not, so saturation is not weakened and the
// arithmetic is exercised at its boundary rather than only in its middle.
const business_equipment = [
  { asset_description: 'CNC mill, Haas VF-2SS', purchase_lease_date: '03142022',
    current_fmv: '48500.00', current_loan_balance: '17250.00', monthly_payment: '1180.00',
    final_payment_date: '03142027', equity: '31250.00',
    location_of_asset: '4417 Kestrel Way, Bellingham, WA 98226, Whatcom County',
    lender_name_address: 'Cascade Equipment Finance, 22 Alder St, Everett, WA 98201',
    lender_phone: '5550142' },
  { asset_description: 'Finished goods inventory', purchase_lease_date: '01312025',
    current_fmv: '92300.00', current_loan_balance: '0.00', monthly_payment: '0.00',
    final_payment_date: '01312025', equity: '92300.00',
    location_of_asset: '4417 Kestrel Way, Bellingham, WA 98226, Whatcom County',
    lender_name_address: 'None - owned outright, no lienholder of record',
    lender_phone: '5550143' },
  { asset_description: 'Forklift 8FGCU25 (LEASED)', purchase_lease_date: '09012024',
    current_fmv: '0.00', current_loan_balance: '0.00', monthly_payment: '640.00',
    final_payment_date: '09012027', equity: '0.00',
    location_of_asset: '4417 Kestrel Way, Bellingham, WA 98226, Whatcom County',
    lender_name_address: 'Northsound Lift Leasing, 118 Meridian St, Bellingham, WA 98225',
    lender_phone: '5550144' },
  { asset_description: 'Box truck body, lift gate', purchase_lease_date: '06202023',
    current_fmv: '21750.00', current_loan_balance: '8900.00', monthly_payment: '415.00',
    final_payment_date: '06202028', equity: '12850.00',
    location_of_asset: '4417 Kestrel Way, Bellingham, WA 98226, Whatcom County',
    lender_name_address: 'Puget Commercial Credit, 909 Second Ave, Seattle, WA 98104',
    lender_phone: '5550145' },
];

// ── page 5, INTANGIBLE ASSETS, printed markers 24e to 24g ──────────────────────────────────
// Two cells per row and no operands for the header's "FMV Minus Loan" — see [B-07].
const intangible_assets = [
  { description: 'Registered trademark, word mark and logo, USPTO reg. 0000000 (synthetic)', equity: '14000.00' },
  { description: 'Domain name and customer-facing web software, capitalised', equity: '6250.00' },
  { description: 'Goodwill recognised on the 2023 asset purchase', equity: '38000.00' },
];

// ── page 5, BUSINESS LIABILITIES, printed markers 25a and 25b ──────────────────────────────
const business_liabilities = [
  { description: 'SBA 7(a) term loan, 2021, secured by all business assets',
    date_pledged: '05172021', balance_owed: '164200.00', final_payment_date: '05172031',
    payment_amount: '2140.00', name: 'Whatcom Valley Bank, N.A.',
    street_address: '301 Cornwall Ave', city_state_zip: 'Bellingham, WA 98225', phone: '5550146' },
  { description: 'Judgement, Whatcom County Superior Court, unsecured trade claim',
    date_pledged: '11082024', balance_owed: '18750.00', final_payment_date: '11082027',
    payment_amount: '525.00', name: 'Harbourline Supply Co.',
    street_address: '77 Roeder Ave', city_state_zip: 'Bellingham, WA 98225', phone: '5550147' },
];

// ── page 6, Section 5, printed lines 26 to 50 ──────────────────────────────────────────────
const other_income = [
  { description: 'Equipment sublease income', amount: '900.00' },
  { description: 'Scrap metal sales', amount: '415.00' },
  { description: 'Manufacturer rebate, quarterly', amount: '260.00' },
  { description: 'Customer finance charges', amount: '135.00' },
  { description: 'Vending machine commission', amount: '48.00' },
];
const INCOME_KEYS = ['s5_26_gross_receipts', 's5_27_gross_rental_income', 's5_28_interest_income', 's5_29_dividends', 's5_30_cash_receipts'];
const EXPENSE_KEYS = ['s5_37_materials_purchased', 's5_38_inventory_purchased', 's5_39_gross_wages_and_salaries',
  's5_40_rent', 's5_41_supplies', 's5_42_utilities_telephone', 's5_43_vehicle_gasoline_oil',
  's5_44_repairs_and_maintenance', 's5_45_insurance', 's5_46_current_taxes', 's5_47_other_expenses'];

const rec = { ...prior };
// THE PREDECESSOR'S CO-AUTHORSHIP BLOCK DOES NOT COME FORWARD, and this line is here because
// assert-fixture-authorship.mjs found it. `prior` gains a `_co_authored_with_hand` at the foot
// of this file — the supersession THIS generator writes onto slice 3 — so the SECOND run of
// this generator spread that block into slice 4 and the guard reported DRIFT on a file whose
// only author is this script. Slice 4 is written whole by one generator and has no hand-added
// key, so it must carry no such declaration: a co-authorship block on a sole-authored file
// would be a true-looking sentence about an author that does not exist.
delete rec._co_authored_with_hand;
rec.business_equipment = business_equipment;
rec.intangible_assets = intangible_assets;
rec.business_liabilities = business_liabilities;
rec.other_income = other_income;

rec.business_liabilities_25a_secured_or_unsecured = 'Secured';
rec.business_liabilities_25b_secured_or_unsecured = 'Unsecured';
rec.s5_accounting_method = 'Accrual';

rec.s5_period_from = '01012025';
rec.s5_period_to = '12312025';

rec.s5_26_gross_receipts = '84500.00';
rec.s5_27_gross_rental_income = '2200.00';
rec.s5_28_interest_income = '95.00';
rec.s5_29_dividends = '0.00';
rec.s5_30_cash_receipts = '1340.00';

rec.s5_37_materials_purchased = '26800.00';
rec.s5_38_inventory_purchased = '11450.00';
rec.s5_39_gross_wages_and_salaries = '31200.00';
rec.s5_40_rent = '6400.00';
rec.s5_41_supplies = '1875.00';
rec.s5_42_utilities_telephone = '2340.00';
rec.s5_43_vehicle_gasoline_oil = '1120.00';
rec.s5_44_repairs_and_maintenance = '2610.00';
rec.s5_45_insurance = '1980.00';
rec.s5_46_current_taxes = '4725.00';
rec.s5_47_other_expenses = '860.00';
// NO s5_48 KEY. Printed line 48 is the IRS-use cell and the map declares it never-autofill.
// An empty string would be a value this engine chose to write; the absence of a key is the
// absence of a decision, and it is what makes the line-49 tripwire's declaration true.

// ── the five new totals, COMPUTED ──────────────────────────────────────────────────────────
rec.s4_24h_total_equity_business_equipment = money(sum(business_equipment, 'equity') + sum(intangible_assets, 'equity'));
rec.s4_25c_total_payments = money(sum(business_liabilities, 'payment_amount'));
rec.s5_36_total_income = money(sumKeys(rec, INCOME_KEYS) + sum(other_income, 'amount'));
rec.s5_49_total_expenses = money(sumKeys(rec, EXPENSE_KEYS));
rec.s5_50_net_income = money(Number(rec.s5_36_total_income) - Number(rec.s5_49_total_expenses));

rec._fixture = {
  form: '433b',
  role: 'acceptance',
  why: 'THE CLOSED-MAP ACCEPTANCE RECORD. Every writable cell the 433-B map binds across all six pages carries a value: 446 of the form\'s 447 fields, the one exception being printed line 48, the IRS-use cell the map declares never-autofill and for which this record deliberately carries no key.',
  superseded: `${SRC}, which is now marked role "superseded" and names this file. Its keys for pages 1 to 4 are CARRIED FORWARD VERBATIM rather than retyped — a retyped copy is hundreds of chances to differ from the record the slice-3 gate actually ran, and nothing would say which was meant.`,
  _the_eleven_totals_are_computed_from_the_rows_in_this_file: 'scratchpad/433b-slice4-author-slice4-fixtures.mjs sums the printed rows and writes the result; the six earlier totals were computed the same way by slices 2 and 3 and are carried forward with the rows they sum. Gate step 11 then recomputes each one from what the FILLED PDF PRINTS and compares. Two computations over two different artefacts — one over the record, one over the drawn page. A typed total would be asserting the arithmetic it is supposed to exercise.',
  _line_50_is_a_difference_and_it_is_computed_as_one: 'Net income is total income MINUS total expenses, in the printed order, and it is derived here from the two totals above it rather than typed. It comes out positive on this record; nothing in this fixture forces that, and the page draws no "do not enter a negative number" instruction, so a record with heavier expenses would print a negative and the same comparison would hold.',
  _line_48_is_absent_and_that_is_the_point: 'The caption of line 49 names lines 37 THROUGH 48. This record carries 37 to 47 and no key for 48, so s5_49_total_expenses is the sum of eleven cells and not twelve. That is what the totals file declares and what makes the declaration checkable: if this record ever grew an s5_48 key, the map would have to write it, and the 49 comparison would start disagreeing rather than quietly absorbing it.',
  _the_leased_forklift_row_is_deliberate: 'business_equipment[2] is leased, so its FMV, loan balance and equity are 0.00 and its monthly payment is the lease payment. All ten of its columns still carry a value, so saturation is not weakened, and the 24h total is exercised over a row that contributes nothing to it.',
  _the_three_intangible_rows_carry_two_cells_each_and_that_is_the_page: 'Rows 24e to 24g draw a description and an equity cell and nothing else. They are a separate group for that reason and they feed the 24h total alongside the four equipment rows, because the printed caption says "Add lines 24a through 24g".',
  _three_new_exclusive_sets_and_one_option_each: 'business_liabilities_25a_secured_or_unsecured = Secured, business_liabilities_25b_secured_or_unsecured = Unsecured, s5_accounting_method = Accrual. The two liability rows take DIFFERENT options on purpose: a record in which both said the same thing would exercise one branch twice.',
  _synthetic: 'Every value is invented. No real taxpayer, no real EIN, no real bank, no real portal record. The telephone numbers are all 555-01xx and the addresses use street numbers that do not exist on the roads named. Nothing here identifies anybody.',
  _authored_by: 'Prompt 49 commit 3, from adapters/pdf/maps/433b.map.json\'s binding list and samples/433b.slice3.sample.json.',
};
rec._generated_by = 'scratchpad/433b-slice4-author-slice4-fixtures.mjs';

writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
console.log(`${OUT}: ${Object.keys(rec).length} top-level key(s)`);
console.log(`  24h total equity business equipment = ${rec.s4_24h_total_equity_business_equipment} (${business_equipment.length} equipment + ${intangible_assets.length} intangible rows)`);
console.log(`  25c total payments                  = ${rec.s4_25c_total_payments} (${business_liabilities.length} rows)`);
console.log(`  36  total income                    = ${rec.s5_36_total_income} (${INCOME_KEYS.length} named lines + ${other_income.length} other-income rows)`);
console.log(`  49  total expenses                  = ${rec.s5_49_total_expenses} (${EXPENSE_KEYS.length} lines; line 48 is IRS-use and absent)`);
console.log(`  50  net income                      = ${rec.s5_50_net_income} (36 minus 49)`);

// ── mark slice 3 superseded ────────────────────────────────────────────────────────────────
prior._fixture.role = 'superseded';
prior._fixture.superseded_by = OUT;
prior._fixture._why_superseded = 'Slice 4 bound pages 5 and 6 and the acceptance fixture had to reach their 104 new cells. This record\'s keys are carried forward into the successor VERBATIM; it is kept rather than deleted because the slice-3 gate ran against it and a deleted fixture makes that run unreproducible.';
// SLICE 3 CLAIMS ITS OWN GENERATOR AS SOLE AUTHOR, AND AFTER THIS IT IS NOT ONE — the same
// declaration slice 3 wrote onto slice 2, for the same reason.
prior._co_authored_with_hand = {
  _fixture: 'THE SUPERSESSION, WRITTEN BY scratchpad/433b-slice4-author-slice4-fixtures.mjs RATHER THAN BY HAND. Slice 3’s own generator writes role "acceptance" and knows nothing of a successor, because when it ran there was none. The role, superseded_by and _why_superseded keys are slice 4’s doing; the rest of this block is slice 3’s generator’s and is unchanged.',
  _co_authored_with_hand: 'THIS DECLARATION ITSELF. Neither generator emits it — slice 3’s does not know it will be superseded, and slice 4’s writes it here — so the block enumerating the co-authored keys is one of them.',
};
writeFileSync(SRC, JSON.stringify(prior, null, 1) + '\n');
console.log(`${SRC}: role -> superseded, names ${OUT}`);

// ── the stress fixture gains the four new groups ───────────────────────────────────────────
const over = JSON.parse(readFileSync(OVER, 'utf8'));
if (over._fixture?.role !== 'stress') { console.error(`STOP — ${OVER} declares role ${JSON.stringify(over._fixture?.role)}, not stress.`); process.exit(2); }

// Every page-5 and page-6 scalar the acceptance record carries, so the stress record is
// saturated too and its own totals have every operand.
for (const k of [...INCOME_KEYS, ...EXPENSE_KEYS, 's5_period_from', 's5_period_to',
  'business_liabilities_25a_secured_or_unsecured', 'business_liabilities_25b_secured_or_unsecured', 's5_accounting_method']) over[k] = rec[k];

over.business_equipment = [...business_equipment, {
  asset_description: 'OVERMAX fifth equipment row', purchase_lease_date: '01012025',
  current_fmv: '1.00', current_loan_balance: '0.00', monthly_payment: '1.00',
  final_payment_date: '01012026', equity: '1.00',
  location_of_asset: 'OVERMAX location, nowhere, WA 98225, Whatcom County',
  lender_name_address: 'OVERMAX lender, nowhere, WA 98225', lender_phone: '5550199',
}];
over.intangible_assets = [...intangible_assets, { description: 'OVERMAX fourth intangible row', equity: '1.00' }];
over.business_liabilities = [...business_liabilities, {
  description: 'OVERMAX third liability row', date_pledged: '01012025', balance_owed: '1.00',
  final_payment_date: '01012026', payment_amount: '1.00', name: 'OVERMAX creditor',
  street_address: '1 Nowhere St', city_state_zip: 'Bellingham, WA 98225', phone: '5550199',
}];
over.other_income = [...other_income, { description: 'OVERMAX sixth other-income row', amount: '1.00' }];

// The totals sum the PRINTED rows only, for the reason slice 3 gave: the page cannot print a
// row it has no slot for, so the printed total is the sum of what fits. A total including the
// dropped row would make gate step 11 fail for the right reason by accident.
over.s4_24h_total_equity_business_equipment = money(sum(business_equipment, 'equity') + sum(intangible_assets, 'equity'));
over.s4_25c_total_payments = money(sum(business_liabilities, 'payment_amount'));
over.s5_36_total_income = money(sumKeys(over, INCOME_KEYS) + sum(other_income, 'amount'));
over.s5_49_total_expenses = money(sumKeys(over, EXPENSE_KEYS));
over.s5_50_net_income = money(Number(over.s5_36_total_income) - Number(over.s5_49_total_expenses));

over._fixture.why = 'An OVER-MAX record: every one of the FOURTEEN groups the map declares carries one record more than the form prints a row for. Run with --saturated it proves that overflow is DROPPED AND LOGGED rather than truncated onto the page, and adapters/pdf/assert-overflow.mjs then proves each dropped row absent from every text field of the filled PDF.';
over._fixture._the_five_page_5_and_6_totals_sum_the_PRINTED_rows_only = 'business_equipment, intangible_assets, business_liabilities and other_income each carry one record more than their printed slot count, and 24h, 25c and 36 are the sum of the rows that FIT. The page cannot print a row it has no slot for. A total here that included a dropped row would make gate step 11 fail for the right reason by accident, and a tripwire that fires for an accidental reason is one nobody can read.';
over._fixture._authored_by = 'Prompt 47 commit 3 for the first eight groups; scratchpad/433b-slice3-author-slice3-fixtures.mjs extended it with real_property and vehicles in Prompt 48 commit 3; scratchpad/433b-slice4-author-slice4-fixtures.mjs extended it with business_equipment, intangible_assets, business_liabilities and other_income in Prompt 49 commit 3.';
over._generated_by = 'scratchpad/433b-slice4-author-slice4-fixtures.mjs';
writeFileSync(OVER, JSON.stringify(over, null, 1) + '\n');
console.log(`${OVER}: ${Object.keys(over).filter((k) => Array.isArray(over[k])).length} group(s), each one row over its printed max`);
