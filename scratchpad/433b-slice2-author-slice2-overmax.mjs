// The over-max fixture, extended to the five groups slice 2 adds.
//
// adapters/pdf/assert-overflow.mjs requires EVERY declared group to carry at least one record
// past its last printed slot. The slice-1 over-max fixture over-fed three groups; the map now
// declares eight, so five of them would have been reported NOT OVER-MAX — the guard reporting
// that a run exercised nothing, which is the first of its three questions and the reason it asks
// that one first.
//
// EACH DROPPED ROW CARRIES A DISTINGUISHING VALUE IN ITS FIRST BOUND, NON-NUMERIC TEXT COLUMN,
// because that is what assert-overflow derives its absence probe from — it reads the column off
// the map's own last-slot declaration rather than agreeing a marker string with this file. A
// dropped row whose bound text columns were all numeric could not have its absence proved and
// would be a STOP.
import { readFileSync, writeFileSync } from 'node:fs';

const ACC = 'samples/433b.slice2.sample.json';
const OUT = 'samples/433b.overmax.sample.json';
const acc = JSON.parse(readFileSync(ACC, 'utf8'));
const prior = JSON.parse(readFileSync(OUT, 'utf8'));

const doc = JSON.parse(JSON.stringify(acc));
doc._fixture = {
  form: '433b',
  role: 'stress',
  why: 'An OVER-MAX record: every one of the eight groups the map declares carries one record more than the form prints a row for. Run with --saturated it proves that overflow is DROPPED AND LOGGED rather than truncated onto the page, and adapters/pdf/assert-overflow.mjs then proves each dropped row absent from every text field of the filled PDF.',
  _why_it_cannot_be_the_acceptance_fixture: 'A saturated acceptance fixture fills every printed slot EXACTLY to max, because that is what saturation means, so it can never overflow one. The two properties are in direct opposition and one record cannot hold both.',
  _every_dropped_row_is_identifiable: 'Each row past the last printed slot opens its first bound non-numeric text column with the word OVERMAX. assert-overflow.mjs does not know that word: it DERIVES the column to look in from the map\'s own last-slot declaration and looks for whatever value that column holds. The word is here so a human reading the filled PDF can see at a glance that nothing beginning OVERMAX reached the page.',
  _synthetic: 'Every value is invented. No real taxpayer, no real EIN, no real bank, no real portal record.',

  _authored_by: 'Prompt 47 commit 3, from samples/433b.slice2.sample.json.',
  _the_page_1_groups_are_carried_forward: `The three page-1 groups keep the over-max rows ${prior._fixture?._authored_by ? 'the slice-1 stress fixture' : 'the previous stress fixture'} gave them, so the drops this fixture forced before slice 2 are the same drops it forces now.`,
};
doc._generated_by = 'scratchpad/433b-slice2-author-slice2-overmax.mjs'+", a one-shot generator recorded in the commit that produced this file. A _generated_by inside the _fixture block is documentation; at the TOP LEVEL it is a claim adapters/pdf/assert-fixture-authorship.mjs re-runs and compares byte for byte.";
doc.intake_id = '433b-overmax';
doc.record_id = prior.record_id ?? acc.record_id;

// ── the three page-1 groups keep their existing over-max rows ──────────────────────────────
for (const g of ['payment_processors', 'credit_cards_accepted', 'personnel']) {
  if (!Array.isArray(prior[g])) { console.error(`STOP — the existing over-max fixture carries no array at ${g}`); process.exit(2); }
  doc[g] = prior[g];
}

// ── the five slice-2 groups gain one row past their last printed slot ──────────────────────
doc.business_bank_accounts = [...acc.business_bank_accounts, {
  type_of_account: 'OVERMAX Trust Account',
  bank_name_and_address: 'OVERMAX Fourth Bank, 4 Fourth Street, Olympia, WA 98501',
  account_number: '9990000004',
  account_balance: '1000.00',
}];
doc.accounts_notes_receivable = [...acc.accounts_notes_receivable, {
  name_and_address: 'OVERMAX Sixth Receivable Ltd, 6 Sixth Street, Tacoma, WA 98402',
  contact_name: 'OVERMAX Contact Six',
  phone: '253-555-0399',
  status: 'OVERMAX status',
  date_due: '01012027',
  invoice_or_contract_number: 'OVERMAX-INV-6',
  amount_due: '1000.00',
}];
doc.investments = [...acc.investments, {
  name_of_company_and_address: 'OVERMAX Third Investment Corp, 3 Third Ave, Tacoma, WA 98402',
  phone: '253-555-0398',
  current_value: '1000.00',
  loan_balance: '0.00',
  equity_value_minus_loan: '1000.00',
  used_as_collateral: 'No',
}];
doc.digital_assets = [...acc.digital_assets, {
  asset_description: 'OVERMAX Litecoin, 40 LTC, ltc1qOVERMAXNOTAREALADDRESS0000',
  location_of_asset: 'OVERMAX exchange account',
  account_number: 'OVERMAX-9900',
  current_value_usd: '1000.00',
  loan_balance: '0.00',
  equity_value_minus_loan: '1000.00',
  used_as_collateral: 'No',
}];
doc.available_credit = [...acc.available_credit, {
  full_name_and_address: 'OVERMAX Third Credit Line, 3 Third Ave, Tacoma, WA 98402',
  account_number: 'OVERMAX-LOC-3',
  credit_limit: '1000.00',
  amount_owed: '0.00',
  available_credit: '1000.00',
}];

// THE FOUR TOTALS STAY THE ACCEPTANCE FIGURES, WHICH IS THE POINT.
// A dropped row is not printed, so the printed total must equal the sum of the rows that WERE
// printed — the acceptance rows. If a dropped row leaked onto the page the tripwire would fail,
// which makes step 11 a second, independent proof of the same absence assert-overflow proves by
// reading every text field back.
doc._the_totals_are_the_acceptance_totals_on_purpose = 'Each of the five over-fed groups gains a row worth exactly 1,000.00 in the column its total sums, and NONE of the four totals is adjusted. A dropped row prints nothing, so the printed total must still equal the sum of the printed rows; if an over-max row leaked onto the page, step 11 would report a 1,000.00 discrepancy. That makes the arithmetic tripwire an independent second proof of the same absence adapters/pdf/assert-overflow.mjs proves by reading every text field of the filled PDF.';

writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
const groups = ['payment_processors', 'credit_cards_accepted', 'personnel', 'business_bank_accounts', 'accounts_notes_receivable', 'investments', 'digital_assets', 'available_credit'];
console.log(`${OUT} written`);
for (const g of groups) console.log(`  ${g.padEnd(28)} ${doc[g].length} row(s)`);
