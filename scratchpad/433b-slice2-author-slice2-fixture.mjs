// The slice-2 acceptance fixture: samples/433b.slice2.sample.json.
//
// SATURATED means every one of the 249 mapped cells across pages 1 to 3 carries a value, every
// group is filled to its printed row count, and every declared exclusive set has exactly one
// option chosen. A cell left empty here is a cell the gate never proved writable, which is the
// state a saturated fixture exists to remove.
//
// PAGE 1 IS CARRIED FORWARD VERBATIM from samples/433b.slice1.sample.json rather than retyped,
// because a retyped copy of a landed record is 103 chances to differ from the record the slice-1
// gate actually ran, and nothing would say which of the two was meant. The slice-1 fixture is
// then marked `superseded` and made to name this one, which resolve-fixture.mjs requires: a
// superseded fixture that names no successor is indistinguishable from one somebody forgot.
//
// THE FOUR TOTALS ARE COMPUTED FROM THE ROWS IN THIS FILE, HERE, ONCE. Gate step 11 recomputes
// them from what the FILLED PDF prints and compares. Those are two different computations over
// two different artefacts — this one over the record, that one over the drawn page — which is
// what makes the comparison worth making. A fixture carrying a typed total would be asserting
// the arithmetic it is supposed to be exercising.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'samples/433b.slice1.sample.json';
const OUT = 'samples/433b.slice2.sample.json';
const prior = JSON.parse(readFileSync(SRC, 'utf8'));

const NOTE = ", a one-shot generator recorded in the commit that produced this file. A _generated_by inside the _fixture block is documentation; at the TOP LEVEL it is a claim adapters/pdf/assert-fixture-authorship.mjs re-runs and compares byte for byte.";
const money = (n) => n.toFixed(2);
const sum = (rows, col) => rows.reduce((a, r) => a + Number(String(r[col]).replace(/[^0-9.-]/g, '')), 0);

// ── page 2, Section 3 ──────────────────────────────────────────────────────────────────────
const s3 = {
  s3_8_uses_payroll_service: 'yes',
  s3_8_payroll_service_name_and_address: 'Cascade Payroll Agents LLC, 88 Wharf Street, Bellingham, WA 98225',
  s3_8_payroll_service_effective_dates: '01152022',

  s3_9_party_to_lawsuit: 'yes',
  s3_9_plaintiff_or_defendant: 'Defendant',
  s3_9_location_of_filing: 'Whatcom County Superior Court',
  s3_9_represented_by: 'Halloran & Beck PLLC',
  s3_9_docket_or_case_number: '24-2-01188-37',
  s3_9_amount_of_suit: '48500.00',
  s3_9_possible_completion_date: '11302026',
  s3_9_subject_of_suit: 'Breach of a supply contract for kiln components',

  s3_10_ever_filed_bankruptcy: 'yes',
  s3_10_date_filed: '03042019',
  s3_10_date_dismissed: '07222019',
  s3_10_date_discharged: '11082019',
  s3_10_petition_number: '19-11742',
  s3_10_district_of_filing: 'W.D. Washington',

  s3_11_related_parties_owe: 'yes',
  s3_11_name_and_address: 'Adela R Marchetti, 312 Cedar Bluff Lane, Bellingham, WA 98225',
  s3_11_date_of_loan: '06012023',
  s3_11_current_balance: '17250.00',
  s3_11_current_balance_as_of: '07312026',
  s3_11_payment_date: '15',
  s3_11_payment_amount: '750.00',

  s3_12_assets_transferred: 'yes',
  s3_12_list_asset: 'Delivery van, 2016 panel body, unit 4',
  s3_12_value_at_time_of_transfer: '9400.00',
  s3_12_date_transferred: '02142021',
  s3_12_to_whom_or_where_transferred: 'Marchetti Family Holdings LLC',

  s3_13_other_business_affiliations: 'yes',
  s3_13_related_business_name_and_address: 'Marchetti Family Holdings LLC, 312 Cedar Bluff Lane, Bellingham, WA 98225',
  s3_13_related_business_ein: '00-0000001',

  s3_14_income_change_anticipated: 'yes',
  s3_14_explain: 'A kiln retrofit completes in Q1 and adds two firing cycles a week',
  s3_14_how_much_increase_decrease: '31000.00',
  s3_14_when_increase_decrease: 'Quarter 1 of 2027',

  s3_15_federal_government_contractor: 'no',
};

// ── page 2, Section 4 head ─────────────────────────────────────────────────────────────────
const bank = [
  { type_of_account: 'Checking', bank_name_and_address: 'Salish Coast Bank, 1400 Harbor Ave, Bellingham, WA 98225', account_number: '4410099821', account_balance: '38420.55' },
  { type_of_account: 'Savings', bank_name_and_address: 'Salish Coast Bank, 1400 Harbor Ave, Bellingham, WA 98225', account_number: '4410099822', account_balance: '12005.10' },
  { type_of_account: 'Money Market', bank_name_and_address: 'Nooksack Credit Union, 22 Alder Rd, Ferndale, WA 98248', account_number: '7781200345', account_balance: '6310.00' },
];
const s4head = {
  s4_16a_total_cash_on_hand: '2150.00',
  s4_16b_safe_on_premises: 'yes',
  s4_16b_safe_contents: 'Petty cash float and two spare kiln controller keys',
  s4_17_account_balance_as_of: '07312026',
  business_bank_accounts: bank,
  s4_17d_total_cash_in_banks: money(sum(bank, 'account_balance')),
};

// ── page 3 ────────────────────────────────────────────────────────────────────────────────
const receivable = [
  { name_and_address: 'Harborlight Ceramics Inc, 9 Dock Street, Anacortes, WA 98221', contact_name: 'Priya Raghunathan', phone: '360-555-0310', status: '30 days', date_due: '09152026', invoice_or_contract_number: 'INV-2026-0441', amount_due: '14200.00' },
  { name_and_address: 'Olympia School District 4, 1113 Legion Way, Olympia, WA 98501', contact_name: 'Devon Achterberg', phone: '360-555-0311', status: 'awarded, not started', date_due: '10012026', invoice_or_contract_number: 'GRANT-WA-EDU-8871', amount_due: '58000.00' },
  { name_and_address: 'Cascadia Tile Supply, 400 Industrial Way, Everett, WA 98203', contact_name: 'Marisol Quintanilla', phone: '425-555-0312', status: '90 days', date_due: '08012026', invoice_or_contract_number: 'INV-2026-0398', amount_due: '7650.25' },
  { name_and_address: 'Bureau of Land Management, 1220 SW 3rd Ave, Portland, OR 97204', contact_name: 'Terrence Odhiambo', phone: '503-555-0313', status: 'contract awarded', date_due: '12152026', invoice_or_contract_number: 'BLM-OR-2026-1174', amount_due: '96500.00' },
  { name_and_address: 'Fairhaven Auction House, 1200 Harris Ave, Bellingham, WA 98225', contact_name: 'Ingrid Solheim', phone: '360-555-0314', status: 'factored', date_due: '09302026', invoice_or_contract_number: 'INV-2026-0405', amount_due: '3125.75' },
];
const investments = [
  { name_of_company_and_address: 'Puget Materials Corp, 700 Elliott Ave W, Seattle, WA 98119', phone: '206-555-0320', current_value: '84000.00', loan_balance: '31000.00', equity_value_minus_loan: '53000.00', used_as_collateral: 'Yes' },
  { name_of_company_and_address: 'Whatcom Municipal Bond Series C, 311 Grand Ave, Bellingham, WA 98225', phone: '360-555-0321', current_value: '25500.00', loan_balance: '0.00', equity_value_minus_loan: '25500.00', used_as_collateral: 'No' },
];
const digital = [
  { asset_description: 'Bitcoin, 0.7412 BTC, bc1qexamplenotarealaddress0000', location_of_asset: 'self-hosted wallet', account_number: 'n/a self-custody', current_value_usd: '46200.00', loan_balance: '0.00', equity_value_minus_loan: '46200.00', used_as_collateral: 'No' },
  { asset_description: 'Ethereum, 11.25 ETH, 0xEXAMPLENOTAREALADDRESS0000', location_of_asset: 'exchange account', account_number: 'CB-4471-0092', current_value_usd: '29800.00', loan_balance: '9000.00', equity_value_minus_loan: '20800.00', used_as_collateral: 'Yes' },
];
const credit = [
  { full_name_and_address: 'Salish Coast Bank Business Line, 1400 Harbor Ave, Bellingham, WA 98225', account_number: 'LOC-88-4410', credit_limit: '75000.00', amount_owed: '41200.00', available_credit: '33800.00' },
  { full_name_and_address: 'Northwest Trade Card, PO Box 9912, Spokane, WA 99209', account_number: 'NWTC-6620-1188', credit_limit: '25000.00', amount_owed: '6875.40', available_credit: '18124.60' },
];
const p3 = {
  accounts_notes_receivable: receivable,
  s4_18f_outstanding_balance: money(sum(receivable, 'amount_due')),
  investments,
  s4_19c_total_investments: money(sum(investments, 'equity_value_minus_loan')),
  s4_20a_individuals_with_private_key_access: 'Adela R Marchetti; Tobias N Fenwick',
  s4_20_current_value_as_of: '07312026',
  digital_assets: digital,
  s4_20e_total_equity_of_digital_assets: money(sum(digital, 'equity_value_minus_loan')),
  s4_21_amount_owed_as_of: '07312026',
  s4_21_available_credit_as_of: '07312026',
  available_credit: credit,
};

const doc = {
  _fixture: {
    form: '433b',
    role: 'acceptance',
    why: 'Slice 2\'s acceptance record. SATURATED: every one of the 249 mapped cells across pages 1 to 3 carries a value, every one of the eight groups is filled to its printed row count, and every one of the 21 declared exclusive sets has exactly one option chosen. A cell left empty here would be a cell the gate never proved writable.',
    superseded: 'samples/433b.slice1.sample.json, which is now marked role "superseded" and names this file. Its 103 page-1 keys are CARRIED FORWARD VERBATIM rather than retyped — a retyped copy is 103 chances to differ from the record the slice-1 gate actually ran, and nothing would say which was meant.',
    _the_four_totals_are_computed_from_the_rows_in_this_file: 'scratchpad/433b-slice2-author-slice2-fixture.mjs sums the printed rows and writes the result. Gate step 11 then recomputes each one from what the FILLED PDF PRINTS and compares. Two computations over two different artefacts — one over the record, one over the drawn page — which is what makes the comparison worth making. A typed total would be asserting the arithmetic it is supposed to exercise.',
    _the_misspelled_on_state_is_exercised: 's3_9_plaintiff_or_defendant is "Defendant", whose stored on-value is /Defendent — the page draws one spelling and the widget stores another. The engine reads the on-value off the widget and reads the box back to prove it turned on, so a map carrying the printed spelling would fail here rather than silently tick nothing.',
    _every_yes_no_answer_is_YES_except_one: 'Eight of the nine Section 3 questions are answered yes, because a "no" leaves the whole answer block empty and a saturated fixture must reach every cell. Question 15 is answered NO deliberately: it is the one question whose answer block is EMPTY BY DESIGN — the form prints no cells for it at all, only the instruction to include federal contracts in line 18 — so it is the one place a "no" costs no coverage. That asymmetry is the page\'s, not this fixture\'s.',
    _the_collateral_pairs_exercise_both_directions: 'Four per-row used_as_collateral sets, declared on their group slots. Two are Yes and two are No, so neither option is the one that has never been written.',
    _synthetic: 'Every value is invented. No real taxpayer, no real EIN, no real bank, no real portal record. The EINs are in non-issuable ranges, the telephone numbers are all 555-01xx, and the two digital-asset addresses are marked NOTAREALADDRESS in their own text. Nothing here identifies anybody.',

    _authored_by: 'Prompt 47 commit 3, from adapters/pdf/maps/433b.map.json\'s binding list and samples/433b.slice1.sample.json.',
  },
  _generated_by: 'scratchpad/433b-slice2-author-slice2-fixture.mjs'+NOTE,
  record_id: prior.record_id,
};
for (const [k, v] of Object.entries(prior)) if (k !== '_fixture' && k !== 'record_id') doc[k] = v;
Object.assign(doc, s3, s4head, p3);

writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');

// ── the slice-1 fixture is superseded and must name its successor ──────────────────────────
prior._fixture.role = 'superseded';
prior._fixture.superseded_by = OUT;
prior._fixture._why_superseded = 'Slice 2 binds 146 more cells across pages 2 and 3. This record reaches none of them, so a saturated run against the slice-2 map would fail step 10 on all 146. It is KEPT rather than deleted because the slice-1 gate run is in the history and this is the record that run proved.';
writeFileSync(SRC, JSON.stringify(prior, null, 1) + '\n');

const totals = { '17d': doc.s4_17d_total_cash_in_banks, '18f': doc.s4_18f_outstanding_balance, '19c': doc.s4_19c_total_investments, '20e': doc.s4_20e_total_equity_of_digital_assets };
console.log(`${OUT} written — ${Object.keys(doc).length - 1} top-level key(s)`);
console.log(`  totals computed from the rows: ${Object.entries(totals).map(([k, v]) => `${k}=${v}`).join(', ')}`);
console.log(`${SRC} marked superseded, naming ${OUT}`);
