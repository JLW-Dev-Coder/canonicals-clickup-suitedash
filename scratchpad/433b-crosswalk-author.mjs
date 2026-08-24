// AUTHORS the `bindings` of adapters/hubspot/crosswalk.433b.json — one row per engine input key.
//
// A crosswalk row carries the FACT, not the NAME. adapters/hubspot/derive-names-433b.mjs turns
// (category, scope, fact) into an hs_name and is the only place a name exists. On a REUSE row the
// fact is chosen to reproduce the EXISTING property's name exactly, because [R-06] rules that
// 433-B binds 433-B(OIC)'s property prefix and all where the two forms share a fact about the
// same subject — so `s1_ein` declares fact `employer_identification_number` and the deriver
// reproduces `irs433boi_employer_identification_number` rather than minting a new one.
//
// THE KEY SPACE IS READ, NOT TYPED. Every key comes from keySpaceOf(), the same function
// validate-crosswalk.mjs and the coverage counter use, so a row for a key the engine does not
// consume, or a missing row for one it does, is a STOP here rather than a surprise downstream.

import { readFileSync, writeFileSync } from 'node:fs';
import { keySpaceOf } from '../adapters/hubspot/classification-coverage.mjs';

const OUT = 'adapters/hubspot/crosswalk.433b.json';
const MAP = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));
const CLS = JSON.parse(readFileSync('adapters/pdf/maps/433b.crosswalk-classification.json', 'utf8'));
const XW = JSON.parse(readFileSync(OUT, 'utf8'));

const MONEY = 'money cell — and 433-B declares NO rounding block, so it is written and compared TO THE CENT. Stated per row rather than inherited: on this form "money" is a fact about the cell, not a page-level declaration, because there is no page-level declaration to inherit.';
const TEXT = 'identifier or short text';
const DATE = 'date cell, stored as printed text';
const COUNT = 'a printed count';
const TABLE = 'repeatable table, serialized as a JSON array';
const YESNO = 'yes/no checkbox pair';
const NAMED = (n) => `named-option checkbox set (${n} options)`;

const m = (fact, basis = MONEY) => ({ fact, type: 'number', fieldType: 'number', type_basis: basis });
const t = (fact, basis = TEXT, pii = false) => ({ fact, type: 'string', fieldType: 'text', type_basis: basis, pii });
const d = (fact) => ({ fact, type: 'string', fieldType: 'text', type_basis: DATE });
const g = (fact, pii = false) => ({ fact, type: 'string', fieldType: 'textarea', type_basis: TABLE, pii });
const yn = (fact) => ({
  fact, type: 'enumeration', fieldType: 'booleancheckbox', type_basis: YESNO,
  options: [{ label: 'Yes', value: 'true', displayOrder: 0 }, { label: 'No', value: 'false', displayOrder: 1 }],
  map_option_by_value: { true: 'yes', false: 'no' },
});
// A NAMED-OPTION SET TAKES ITS VALUES FROM THE MAP, never from this file. The printed words are
// what a record says and what the fill engine looks up; retyping them here would be a second
// spelling of the same list, which assert-intake-keys.mjs exists to refuse.
const named = (fact, key) => {
  const opts = Object.keys(MAP.checkboxes[key]).filter((k) => !k.startsWith('_'));
  return {
    fact, type: 'enumeration', fieldType: 'select', type_basis: NAMED(opts.length),
    options: opts.map((o, i) => ({ label: o, value: o.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), displayOrder: i })),
    map_option_by_value: Object.fromEntries(opts.map((o) => [o.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), o])),
  };
};

// ── the facts, per key ───────────────────────────────────────────────────────────────────
const F = {
  // Z-01 address block
  s1_business_street_address: t('business_street_address'),
  s1_mailing_address: t('mailing_address'),
  s1_city: t('city'), s1_state: t('state'), s1_zip: t('zip'),
  // Z-02 / Z-03 / Z-06 / Z-09 / Z-11 — REUSE. The fact reproduces the existing property's name.
  s1_business_name: t('business_name'),
  s1_ein: t('employer_identification_number'),
  s1_county: t('county_of_business_location'),
  s1_business_website: t('business_website_address'),
  s1_number_of_employees: { fact: 'total_number_of_employees', type: 'number', fieldType: 'number', type_basis: COUNT },
  s1_frequency_of_tax_deposits: t('frequency_of_tax_deposits'),
  // Z-04 / Z-05 / Z-07 / Z-08 / Z-10 / Z-12
  s1_business_telephone_area_code: t('business_telephone_area_code'),
  s1_business_telephone_number: t('business_telephone_number'),
  s1_type_of_business: t('type_of_business'),
  s1_type_of_entity: named('type_of_entity', 's1_type_of_entity'),
  s1_entity_other_description: t('entity_other_description'),
  s1_llc_number_of_members: { fact: 'llc_number_of_members', type: 'number', fieldType: 'number', type_basis: COUNT },
  s1_date_incorporated_or_established: d('date_incorporated_or_established'),
  s1_monthly_gross_payroll: m('monthly_gross_payroll'),
  s1_eftps_enrolled: yn('eftps_enrolled'),
  // Z-13
  s1_engages_in_ecommerce: yn('engages_in_ecommerce'),
  payment_processors: g('payment_processors'),
  credit_cards_accepted: g('credit_cards_accepted'),
  // Z-14 personnel — PII: the table carries taxpayer identification numbers and home addresses.
  personnel: g('personnel', true),
  personnel_7a_responsible_for_payroll_taxes: yn('personnel_7a_responsible_for_payroll_taxes'),
  personnel_7b_responsible_for_payroll_taxes: yn('personnel_7b_responsible_for_payroll_taxes'),
  personnel_7c_responsible_for_payroll_taxes: yn('personnel_7c_responsible_for_payroll_taxes'),
  personnel_7d_responsible_for_payroll_taxes: yn('personnel_7d_responsible_for_payroll_taxes'),
  // Z-15 payroll service
  s3_8_uses_payroll_service: yn('uses_payroll_service'),
  s3_8_payroll_service_name_and_address: t('payroll_service_name_and_address'),
  s3_8_payroll_service_effective_dates: d('payroll_service_effective_dates'),
  // Z-16 lawsuit
  s3_9_party_to_lawsuit: yn('party_to_lawsuit'),
  s3_9_plaintiff_or_defendant: named('plaintiff_or_defendant', 's3_9_plaintiff_or_defendant'),
  s3_9_location_of_filing: t('suit_location_of_filing'),
  s3_9_represented_by: t('suit_represented_by'),
  s3_9_docket_or_case_number: t('suit_docket_or_case_number'),
  s3_9_amount_of_suit: m('suit_amount_of_suit'),
  s3_9_possible_completion_date: d('suit_possible_completion_date'),
  s3_9_subject_of_suit: t('suit_subject_of_suit'),
  // Z-17 bankruptcy
  s3_10_ever_filed_bankruptcy: yn('ever_filed_bankruptcy'),
  s3_10_date_filed: d('bankruptcy_date_filed'),
  s3_10_date_dismissed: d('bankruptcy_date_dismissed'),
  s3_10_date_discharged: d('bankruptcy_date_discharged'),
  s3_10_petition_number: t('bankruptcy_petition_number'),
  s3_10_district_of_filing: t('bankruptcy_district_of_filing'),
  // Z-18 REUSE / Z-19 detail
  s3_11_related_parties_owe: yn('related_parties_owe_money'),
  s3_11_name_and_address: t('related_party_name_and_address'),
  s3_11_date_of_loan: d('related_party_date_of_loan'),
  s3_11_current_balance: m('related_party_current_balance'),
  s3_11_current_balance_as_of: d('related_party_current_balance_as_of'),
  s3_11_payment_date: d('related_party_payment_date'),
  s3_11_payment_amount: m('related_party_payment_amount'),
  // Z-20 asset transfer
  s3_12_assets_transferred: yn('assets_transferred_under_value'),
  s3_12_list_asset: t('transferred_asset_description'),
  s3_12_value_at_time_of_transfer: m('transferred_asset_value_at_transfer'),
  s3_12_date_transferred: d('transferred_asset_date'),
  s3_12_to_whom_or_where_transferred: t('transferred_asset_to_whom_or_where'),
  // Z-21 REUSE / Z-22 detail
  s3_13_other_business_affiliations: yn('other_business_affiliations'),
  s3_13_related_business_name_and_address: t('related_business_name_and_address'),
  s3_13_related_business_ein: t('related_business_ein'),
  // Z-23 income change
  s3_14_income_change_anticipated: yn('income_change_anticipated'),
  s3_14_explain: { fact: 'income_change_explain', type: 'string', fieldType: 'textarea', type_basis: 'free-text explanation' },
  s3_14_how_much_increase_decrease: m('income_change_amount'),
  s3_14_when_increase_decrease: d('income_change_when'),
  // Z-24 REUSE
  s3_15_federal_government_contractor: yn('federal_contractor'),
  // Z-25 cash on hand / safe
  s4_16a_total_cash_on_hand: m('total_cash_on_hand'),
  s4_16b_safe_on_premises: yn('safe_on_premises'),
  s4_16b_safe_contents: t('safe_contents'),
  // Z-26 / Z-27 bank accounts
  business_bank_accounts: g('business_bank_accounts'),
  s4_17_account_balance_as_of: d('bank_account_balance_as_of'),
  s4_17d_total_cash_in_banks: m('total_cash_in_banks'),
  // Z-28 receivables
  accounts_notes_receivable: g('accounts_notes_receivable'),
  s4_18f_outstanding_balance: m('receivables_outstanding_balance'),
  // Z-29 / Z-30 investments
  investments: g('investments'),
  s4_19c_total_investments: m('total_investments'),
  // Z-31 / Z-32 digital assets
  digital_assets: g('digital_assets'),
  s4_20a_individuals_with_private_key_access: t('individuals_with_private_key_access', TEXT, true),
  s4_20_current_value_as_of: d('digital_asset_current_value_as_of'),
  s4_20e_total_equity_of_digital_assets: m('total_equity_of_digital_assets'),
  // Z-33 available credit
  available_credit: g('available_credit'),
  s4_21_amount_owed_as_of: d('available_credit_amount_owed_as_of'),
  s4_21_available_credit_as_of: d('available_credit_as_of'),
  // Z-34..Z-40 property, vehicles, equipment, intangibles
  real_property: g('real_property'),
  s4_22e_total_equity_real_property: m('total_equity_real_property'),
  vehicles: g('vehicles'),
  s4_23e_total_equity_vehicles: m('total_equity_vehicles'),
  business_equipment: g('business_equipment'),
  intangible_assets: g('intangible_assets'),
  s4_24h_total_equity_business_equipment: m('total_equity_business_equipment_and_intangibles'),
  // Z-41 liabilities
  business_liabilities: g('business_liabilities'),
  business_liabilities_25a_secured_or_unsecured: named('liability_25a_secured_or_unsecured', 'business_liabilities_25a_secured_or_unsecured'),
  business_liabilities_25b_secured_or_unsecured: named('liability_25b_secured_or_unsecured', 'business_liabilities_25b_secured_or_unsecured'),
  s4_25c_total_payments: m('total_liability_payments'),
  // Z-42 / Z-43
  s5_accounting_method: named('accounting_method', 's5_accounting_method'),
  s5_period_from: d('income_expense_period_from'),
  s5_period_to: d('income_expense_period_to'),
  // Z-44 / Z-45 / Z-46 income
  s5_26_gross_receipts: m('bizinc_gross_receipts'),
  s5_27_gross_rental_income: m('bizinc_gross_rental_income'),
  s5_28_interest_income: m('bizinc_interest_income'),
  s5_29_dividends: m('bizinc_dividends'),
  s5_30_cash_receipts: m('bizinc_cash_receipts'),
  other_income: g('other_income'),
  s5_36_total_income: m('total_income'),
  // Z-47 / Z-48 / Z-49 expenses
  s5_37_materials_purchased: m('bizexp_materials_purchased'),
  s5_38_inventory_purchased: m('bizexp_inventory_purchased'),
  s5_39_gross_wages_and_salaries: m('bizexp_gross_wages_and_salaries'),
  s5_40_rent: m('bizexp_rent'),
  s5_41_supplies: m('bizexp_supplies'),
  s5_42_utilities_telephone: m('bizexp_utilities_telephone'),
  s5_43_vehicle_gasoline_oil: m('bizexp_vehicle_gasoline_oil'),
  s5_44_repairs_and_maintenance: m('bizexp_repairs_and_maintenance'),
  s5_45_insurance: m('bizexp_insurance'),
  s5_46_current_taxes: m('bizexp_current_taxes'),
  s5_47_other_expenses: m('bizexp_other_expenses'),
  s5_49_total_expenses: m('total_expenses'),
  s5_50_net_income: m('net_income'),
};

// ── the per-row scope rulings for the middle categories ──────────────────────────────────
// Every entry in a category the deriver refuses to default carries its ruling HERE, per key,
// answering ruling 2's question in its own words. The entry-level scope_reason in the
// classification says why the two FORMS differ; this says what that means for THIS CELL's
// property. Both are required and neither substitutes for the other.
const entryOf = new Map();
for (const e of CLS.entries) for (const k of String(e.oic).split(/,\s*/)) entryOf.set(k.replace(/^groups\./, ''), e);

const REUSE_ENTRIES = new Set(CLS.entries.filter((e) => e.scope === 'reuse').map((e) => e.id));

const rows = [];
const { keySpace } = keySpaceOf(MAP);
const stops = [];
for (const key of keySpace.keys()) {
  const f = F[key];
  if (!f) { stops.push(`no fact declared for engine input "${key}"`); continue; }
  const e = entryOf.get(key);
  if (!e) { stops.push(`no classification entry covers "${key}"`); continue; }
  const row = { key, entry: e.id, ...f, backbone_key: null };
  if (row.pii === undefined) row.pii = false;
  // The middle categories carry a per-row scope and reason; exact/new/superset/asymmetric do not.
  const MIDDLE = new Set(['different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition', 'superset', 'different-predicate-same-caption', 'asymmetric-the-other-way']);
  if (MIDDLE.has(e.category)) {
    row.scope = 'form-specific';
    row.scope_reason = `THE TEST, ASKED OF THIS CELL: could one property serving 433-B and 433-B(OIC) ever have to hold two different values for one taxpayer at one moment? YES, and ${e.id} says on what. ${e.scope_reason}`;
  }
  if (REUSE_ENTRIES.has(e.id)) {
    row.reuse_of = `irs433boi_${row.fact}`;
    row.reuse_reason = `${e.id} rules this an EXACT correspondence: the same question, in the same shape, about the same legal person. [R-06] rules that where 433-B and 433-B(OIC) share a fact about the same subject, 433-B binds the EXISTING property, prefix and all — irs433boi_ records which form CREATED a name, not which form owns it. The fact is spelled to reproduce that name rather than to describe this form.`;
  }
  rows.push(row);
}
if (stops.length) { console.error('STOP —\n  ' + stops.join('\n  ')); process.exit(2); }

// The reverse direction: a declared fact for a key the engine does not consume.
for (const k of Object.keys(F)) if (!keySpace.has(k)) { console.error(`STOP — fact declared for "${k}", which is not an engine input.`); process.exit(2); }

XW.bindings = rows;
XW.meta._what_this_file_is = 'THE CROSSWALK FOR 433-B — one row per engine input key, carrying the FACT each cell holds and the type it is stored as. It carries NO hs_name: adapters/hubspot/derive-names-433b.mjs turns (category, scope, fact) into a name and is the only place a name exists. This file replaced the DECLARED EMPTY crosswalk authored at prompt 46 commit 2, whose zero was honest at the time — the map bound nothing then and binds every one of the form\'s 447 widgets now.';
XW.meta._the_reuse_rows_are_the_finding = 'NINE ROWS CARRY `reuse_of`, AND THEY ARE THE FIRST IN THIS SERIES. Every form before 433-B came out 100% form-specific because its subject was new; 433-B\'s subject COINCIDES with 433-B(OIC)\'s, so [R-06]\'s prefix half applies for the first time and nine facts bind properties the irs433boi_ prefix records 433-B(OIC) as having created. The other 107 rows need a new name. The split is derived from the classification, not typed here.';
XW.meta._why_the_counts_block_is_absent = 'meta.counts IS NOT WRITTEN BY THIS FILE. validate-crosswalk.mjs derives every one of the six figures from the rows and compares; a hand-kept block beside the rows is the shape [R-07] forbids. Its six "says undefined, rows say N" lines are the declaration doing its job, not a gap.';
XW.meta._authored_by = 'scratchpad/433b-crosswalk-author.mjs, prompt 50 commit 2.';

writeFileSync(OUT, JSON.stringify(XW, null, 1) + '\n');
const reuse = rows.filter((r) => r.reuse_of);
console.log(`wrote ${OUT}: ${rows.length} binding(s)`);
console.log(`  reuse rows: ${reuse.length}`);
console.log(`  new-name rows: ${rows.length - reuse.length}`);
const byCat = {};
for (const r of rows) { const c = CLS.entries.find((e) => e.id === r.entry).category; byCat[c] = (byCat[c] || 0) + 1; }
for (const [k, v] of Object.entries(byCat)) console.log(`  keys in category ${k}: ${v}`);
