// Author samples/433boi.slice3.sample.json — the acceptance fixture for the closed map.
//
// EVERY TOTAL IN THIS FILE IS COMPUTED FROM ITS OPERANDS BY THIS SCRIPT AND NONE IS TYPED.
// A typed total is a number that agrees with the tripwire because someone made it agree, which
// proves that the person can add and nothing about the engine.
import { readFileSync, writeFileSync } from 'node:fs';

const base = JSON.parse(readFileSync('samples/433boi.slice2.sample.json', 'utf8'));
const money = (n) => (Math.round(n * 100) / 100).toFixed(2);
const num = (s) => Number(String(s).replace(/[^0-9.-]/g, ''));

// ── page 4, Section 2 (continued): the one printed equipment row ────────────────────────
const eqFmv = 128450.00;
const eqQsv = eqFmv * 0.8;                       // the printed X .8
const eqLoan = 46318.55;
const eqEquity = eqQsv - eqLoan;                 // (5a)
const eqAttachment = 7810.25;                    // (5b), from an attachment, not checkable
const total5 = eqEquity + eqAttachment;          // (5)

// ── Box A: lines (1) through (5), the lettered sub-lines excluded by the printed sentence ──
const boxA = num(base.s2_1_total_bank_accounts)
  + num(base.s2_2_total_investment_accounts)
  + num(base.s2_3_total_real_estate)
  + num(base.s2_4_total_vehicles)
  + total5;

// ── page 4, Section 3: (6) through (10) -> Box B ────────────────────────────────────────
// WHOLE DOLLARS FROM HERE DOWN, and the reason is printed: page 5 says "Use whole dollars
// only" beside the Offer Amount, and pages 4 and 5 print "Round to the nearest dollar" over
// every block. Pages 2 and 3 carry cents because their own captions do too and slice 2 bound
// them that way; Box A therefore carries cents and its page-5 copy does not. See
// _the_two_money_conventions_on_this_form below.
const income = { s3_6_gross_receipts: 148920, s3_7_gross_rental_income: 9450, s3_8_interest_income: 1275, s3_9_dividends: 640, s3_10_other_income: 3810 };
const boxB = Object.values(income).reduce((a, b) => a + b, 0);

// ── page 4, Section 4: (11) through (20) -> Box C ───────────────────────────────────────
const expenses = {
  s4_11_materials_purchased: 41260, s4_12_inventory_purchased: 22740, s4_13_gross_wages_and_salaries: 38115,
  s4_14_rent: 9800, s4_15_supplies: 3465, s4_16_utilities_telephones: 2890, s4_17_vehicle_costs: 4125,
  s4_18_insurance: 3340, s4_19_current_taxes: 6720, s4_20_other_expenses: 5150,
};
const boxC = Object.values(expenses).reduce((a, b) => a + b, 0);
const boxD = boxB - boxC;                        // Box B minus Box C, in that printed order

// ── page 5, Section 5: the offer calculation ────────────────────────────────────────────
const boxE = boxD * 12;
const boxF = boxD * 24;
const amountFromBoxA = Math.round(boxA);         // whole dollars; NOT the footnote exclusion
const amountFromEorF = boxE;                     // the 5-or-fewer-payments branch
const offer = amountFromBoxA + amountFromEorF;

const s3 = {
  business_equipment: [{
    asset_class: 'business_property',
    row_type: 'business_equipment',
    description: 'Example CNC plasma table, model EX-4400, plus Sample-brand dust extraction',
    current_fmv: money(eqFmv),
    quick_sale_value: money(eqQsv),
    current_loan_balance: money(eqLoan),
    equity: money(eqEquity),
  }],
  s3_equipment_from_attachment: money(eqAttachment),
  s3_total_all_business_equipment: money(total5),
  s3_box_a_available_equity_in_assets: money(boxA),

  s3_income_period_beginning: '01/01/2025',
  s3_income_period_through: '12/31/2025',
  ...Object.fromEntries(Object.entries(income).map(([k, v]) => [k, money(v)])),
  s3_box_b_total_business_income: money(boxB),

  s4_expense_period_beginning: '01/01/2025',
  s4_expense_period_through: '12/31/2025',
  ...Object.fromEntries(Object.entries(expenses).map(([k, v]) => [k, money(v)])),
  s4_box_c_total_business_expenses: money(boxC),
  s4_box_d_remaining_monthly_income: money(boxD),

  s5_box_d_for_12_month_multiplier: money(boxD),
  s5_box_e_future_remaining_income: money(boxE),
  s5_box_d_for_24_month_multiplier: money(boxD),
  s5_box_f_future_remaining_income: money(boxF),
  s5_amount_from_box_a: money(amountFromBoxA),
  s5_amount_from_box_e_or_box_f: money(amountFromEorF),
  s5_offer_amount: money(offer),

  // ── page 5, Section 6 ──
  s6_currently_in_bankruptcy: 'no',
  s6_filed_bankruptcy_past_10_years: 'yes',
  s6_bankruptcy_date_filed: '04/17/2018',
  s6_bankruptcy_date_dismissed_or_discharged: '11/02/2019',
  s6_bankruptcy_petition_no: 'EX-18-40771',
  s6_bankruptcy_location_filed: 'U.S. Bankruptcy Court, Example District of Texas, Sample Division',
  s6_other_business_affiliations: 'yes',
  s6_affiliations_name_and_ein: 'Example Holdings Parent LLC, EIN XX-XXX4417; Sample Logistics Sub LLC, EIN XX-XXX8820',
  s6_related_parties_owe_money: 'yes',
  s6_party_to_litigation: 'yes',
  s6_litigation_role: 'defendant',
  s6_litigation_location_of_filing: 'District Court, Example County, TX',
  s6_litigation_represented_by: 'Sample & Example LLP, 77 Placeholder Street, Denton TX 76201',
  s6_litigation_docket_case_number: 'EX-2024-CV-03318',
  s6_litigation_possible_completion_date: '09302026',
  s6_litigation_subject: 'Breach of a supply contract; counterclaim for non-delivery',
  s6_litigation_amount_in_dispute: money(58400),
  s6_party_to_irs_litigation: 'yes',
  s6_irs_litigation_tax_types_and_periods: 'Form 941 employment tax, quarters ending 06/30/2021 and 09/30/2021',

  // ── page 6, Section 6 continued ──
  s6_transferred_asset_under_value_past_10_years: 'yes',
  s6_asset_transfer_date_value_and_type: '08/22/2022, 14,500 USD, Example forklift transferred to a member below market',
  s6_transferred_real_property_past_3_years: 'yes',
  s6_real_property_transfer_type_value_date: 'Vacant lot, 88 Sample Road, Denton TX; 31,000 USD; transferred 05/09/2023',
  s6_located_outside_us_6_months: 'no',
  s6_assets_or_real_property_outside_us: 'yes',
  s6_assets_outside_us_description_location_value: 'Warehouse unit, Example Freeport, Placeholder Country; 96,000 USD',
  s6_funds_held_in_trust: 'yes',
  s6_funds_held_in_trust_amount: money(21750),
  s6_funds_held_in_trust_where: 'Example Escrow Services Ltd, 4 Sample Court, Dallas TX 75201',
  s6_lines_of_credit: 'yes',
  s6_line_of_credit_limit: money(75000),
  s6_line_of_credit_amount_owed: money(31240),
  s6_line_of_credit_property_securing: 'The warehouse and yard at 1200 Example Industrial Parkway, Denton TX',

  // ── page 6, Section 7 ──
  s7_signer_title: 'Managing Member',
  s7_date_signed: '08/20/2026',
  s7_attach_profit_and_loss: true,
  s7_attach_bank_and_investment_statements: true,
  s7_attach_collateral_loan_statements: true,
  s7_attach_accounts_and_notes_receivable: true,
  s7_attach_digital_asset_records: true,
  s7_attach_lender_and_mortgage_statements: true,
  s7_attach_special_circumstances: true,
  s7_attach_form_2848: true,
  s7_attach_form_656: true,
};

const out = { ...base, ...s3 };

out._fixture = {
  form: '433boi',
  role: 'acceptance',
  why: 'All six pages, all 267 fields, saturated. Every mapped text cell carries a value, all 18 Yes/No and option pairs are answered, all 10 check-here ticks are set, all six repeatable tables are fed to their printed maximum, and every total is computed from its operands by the generator rather than typed.',
};
out._what_this_covers = '433-B(OIC) slice 3 - pages 1 to 6, all 267 mapped fields. Saturated: every mapped text cell carries a value, every Yes/No pair on pages 1, 2, 3, 5 and 6 is answered, the litigation role is chosen, all 10 check-here ticks are set including the nine page-6 attachment boxes, and all six repeatable tables are fed to their printed maximum - three bank rows, two investment rows, one digital asset, two properties, three vehicles and one equipment row. The map is closed and this record reaches every field of it.';
out._every_total_is_computed = 'NOT ONE TOTAL IN THIS FILE IS TYPED. (5a) is the quick-sale value minus the loan balance, and the quick-sale value is the market value times the printed .8. (5) is (5a) plus the attachment line. Box A is the five page-2, page-3 and page-4 totals added. Box B is lines (6) through (10), Box C is (11) through (20), Box D is Box B minus Box C in that printed order. Box E is Box D times 12 and Box F is Box D times 24. The Offer Amount is the Box A copy plus the Box E copy. A total that agrees with a tripwire because the author made it agree proves that the author can add.';
out._the_two_money_conventions_on_this_form = 'PAGES 2 AND 3 CARRY CENTS AND PAGES 4 AND 5 DO NOT, and that is deliberate. Every money caption on pages 2, 3 and 4 prints "Round to the nearest dollar", and page 5 prints "Round to the nearest whole dollar" and, beside the Offer Amount, "Use whole dollars only." The map declares no `rounding` block - blanket-audit [K-07] reports the stand-down with its reason on every run - so the tripwires are exact arithmetic and a fixture mixing cents into a whole-dollar sum would fail them for a reason that has nothing to do with the map. So this record keeps slice 2\'s cents on pages 2 and 3, which makes Box A carry cents, and uses whole dollars from line (6) down. The Box A COPY on page 5 is Box A rounded to the nearest dollar, which the printed whole-dollar instruction requires and which the tripwires permit because that cell is declared not checkable. Carried as [B20].';
out._what_the_offer_calculation_says_here = 'Box D is Box B minus Box C, both positive, so the declared floor of 0 is NOT exercised by this record - it is one of the floors the gate reports as unexercised, and a negative fixture would be the instrument that reaches it. The Box E or Box F cell copies BOX E, the five-or-fewer-payments branch. Nothing on the form records that choice, which is why the cell is declared not checkable; the record makes it explicitly so a reader of the filled form knows which branch produced the offer.';
out._what_this_record_does_not_take = 'THE INCOME-PRODUCING-ASSET EXCLUSION. The asterisk beside "Enter the amount from Box A" permits excluding equity in income-producing assets other than real estate, and this record excludes nothing - the page-5 copy is the whole of Box A, rounded. A record that DID take the exclusion would write a smaller figure and no tripwire on this form could tell the two apart, which is the finding carried as [B16].';
out._generated_by = 'scratchpad/author-slice3-fixture.mjs, a one-shot generator recorded in the commit that produced this file. It reads samples/433boi.slice2.sample.json for the pages 1-3 record and computes every page-4 and page-5 total from its operands.';

writeFileSync('samples/433boi.slice3.sample.json', JSON.stringify(out, null, 1) + '\n');
console.log('wrote samples/433boi.slice3.sample.json');
console.log(`  (5a) ${money(eqEquity)}  (5) ${money(total5)}  Box A ${money(boxA)}`);
console.log(`  Box B ${money(boxB)}  Box C ${money(boxC)}  Box D ${money(boxD)}`);
console.log(`  Box E ${money(boxE)}  Box F ${money(boxF)}  offer ${money(offer)}`);
