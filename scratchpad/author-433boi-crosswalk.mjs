// Author adapters/pdf/maps/433boi.crosswalk-classification.json and
//        adapters/hubspot/crosswalk.433boi.json — from ONE table, in one pass.
//
//   node scratchpad/author-433boi-crosswalk.mjs
//
// WHY ONE GENERATOR FOR TWO FILES
// -------------------------------
// The classification says WHAT KIND of correspondence each entry is; the crosswalk says which
// entry covers each input key and which FACT that key names. They are two files because two
// different questions are asked of them, and they are authored from one table because a key
// listed in an entry's prose and a key bound to that entry are the same claim written twice —
// and a claim written twice in two files is the parallel-list defect this repo enumerates.
//
// NOTHING HERE IS A PROPERTY NAME. derive-names-433boi.mjs computes those from the CATEGORY.
//
// THE MONEY SET IS NOT TYPED HERE. It is read out of the map's own `rounding` blocks, which are
// the form's declaration of which cells are money, quoted from the printed instructions. A
// second list of money keys in this file would be a second declaration, and the two would drift.
import { readFileSync, writeFileSync } from 'node:fs';

const MAP = JSON.parse(readFileSync('adapters/pdf/maps/433boi.map.json', 'utf8'));

// ── the money set, DERIVED from the map's rounding declaration ──────────────────────────
const MONEY = new Set();
for (const b of MAP.rounding.blocks) for (const k of (b.keys || [])) MONEY.add(k);

const DATES = new Set(['s3_income_period_beginning', 's3_income_period_through',
  's4_expense_period_beginning', 's4_expense_period_through', 's6_bankruptcy_date_filed',
  's6_bankruptcy_date_dismissed_or_discharged', 's6_litigation_possible_completion_date', 's7_date_signed']);
const COUNTS = new Set(['s1_total_number_of_employees']);
const PII = new Set(['partners']);

const YESNO = { type: 'enumeration', fieldType: 'booleancheckbox', type_basis: 'yes/no checkbox pair',
  options: [{ label: 'Yes', value: 'true', displayOrder: 0 }, { label: 'No', value: 'false', displayOrder: 1 }],
  map_option_by_value: { true: 'yes', false: 'no' } };
const CHECKHERE = { ...YESNO, type_basis: 'lone check-here box' };

const OPTIONS = {
  s6_litigation_role: { type: 'enumeration', fieldType: 'select', type_basis: 'named-option checkbox set (2 options)',
    options: [{ label: 'Plaintiff', value: 'plaintiff', displayOrder: 0 }, { label: 'Defendant', value: 'defendant', displayOrder: 1 }],
    map_option_by_value: { plaintiff: 'plaintiff', defendant: 'defendant' } },
  business_income_expense_route: { type: 'enumeration', fieldType: 'select',
    type_basis: 'declared record shape - the printed route this filing takes through Sections 3 and 4',
    options: [{ label: 'Grid (lines 6-10 and 11-20 completed)', value: 'grid', displayOrder: 0 },
      { label: 'Profit and loss statement attached', value: 'profit_and_loss_statement', displayOrder: 1 }],
    map_option_by_value: { grid: 'grid', profit_and_loss_statement: 'profit_and_loss_statement' } },
};

// Every checkbox and check_here key, read from the map so this file cannot disagree with it.
const CHECKBOX_KEYS = new Set(Object.entries(MAP.checkboxes).filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object' && !Array.isArray(v)).map(([k]) => k));
const CHECKHERE_KEYS = new Set(Object.entries(MAP.check_here).filter(([k, v]) => !k.startsWith('_') && v && typeof v.target === 'string').map(([k]) => k));
const GROUP_KEYS = new Set(Object.values(MAP.groups).map((d) => d.source));

const typeOf = (key) => {
  if (OPTIONS[key]) return OPTIONS[key];
  if (GROUP_KEYS.has(key)) return { type: 'string', fieldType: 'textarea', type_basis: 'repeatable table, serialized as a JSON array' };
  if (CHECKHERE_KEYS.has(key)) return { ...CHECKHERE };
  if (CHECKBOX_KEYS.has(key)) return { ...YESNO };
  if (MONEY.has(key)) return { type: 'number', fieldType: 'number', type_basis: 'money cell - declared as money by the map\'s own rounding block for the page it sits on' };
  if (COUNTS.has(key)) return { type: 'number', fieldType: 'number', type_basis: 'a printed count' };
  if (DATES.has(key)) return { type: 'string', fieldType: 'text', type_basis: 'date cell, stored as printed text' };
  return { type: 'string', fieldType: 'text', type_basis: 'identifier or short text' };
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE TABLE. One row per classification entry; `keys` is [inputKey, fact] pairs, plus an
// optional per-key scope ruling where the category demands one.
// ═══════════════════════════════════════════════════════════════════════════════════════
const SUBJ = 'same-question-different-subject';
const E = [];
const entry = (o) => { E.push(o); return o; };

entry({
  id: 'Y-01', page: 1, category: SUBJ,
  a433: '433-A(OIC) Section 4 business identity cells - s4_business_name, s4_business_ein, s4_business_address, s4_business_telephone, s4_business_website, s4_trade_name_or_dba, s4_description_of_business - and 433-F\'s self-employment block, which contributed irs433_self_employment_business_name.',
  why: 'Business name, EIN, physical and mailing address, county, DBA and description, two phones, a fax number and a website address. Every one of these questions is asked in the same words on 433-A(OIC) Section 4.',
  subject_reason: '433-A(OIC) Section 4 is completed ONLY when the business is a sole proprietorship filing Schedule C, and 433-B(OIC) is completed ONLY when it is a corporation, partnership, LLC classified as a corporation, or other multi-owner/multi-member LLC. The two are mutually exclusive BY THE FORMS\' OWN PRINTED ELIGIBILITY INSTRUCTIONS, so a filer who submits both is describing two different legal persons, and a property named irs433_self_employment_business_name would be asked to hold a corporation\'s name.',
  keys: [
    ['s1_business_name', 'business_name'],
    ['s1_ein', 'employer_identification_number'],
    ['s1_business_physical_address', 'business_physical_address'],
    ['s1_business_mailing_address', 'business_mailing_address'],
    ['s1_county_of_business_location', 'county_of_business_location'],
    ['s1_description_of_business_and_dba', 'description_of_business_and_dba'],
    ['s1_business_primary_phone', 'business_primary_phone'],
    ['s1_business_secondary_phone', 'business_secondary_phone'],
    ['s1_business_fax_number', 'business_fax_number'],
    ['s1_business_website_address', 'business_website_address'],
  ],
});

entry({
  id: 'Y-02', page: 1, category: SUBJ,
  a433: '433-A(OIC) s4_total_number_of_employees, s4_frequency_of_tax_deposits and s4_average_gross_monthly_payroll, which derive irs433_total_number_of_employees, irs433_frequency_of_tax_deposits and irs433_average_gross_monthly_payroll.',
  why: 'The three payroll figures 433-A(OIC) prints in the same order with the same captions: total number of employees, frequency of tax deposits, average gross monthly payroll.',
  subject_reason: 'The headcount, deposit frequency and payroll of THE FILING ENTITY. A taxpayer running a Schedule C consultancy with no employees and holding a half share of an LLC with forty of them has two headcounts at one moment, and the printed eligibility rules put each on its own form.',
  keys: [
    ['s1_total_number_of_employees', 'total_number_of_employees'],
    ['s1_frequency_of_tax_deposits', 'frequency_of_tax_deposits'],
    ['s1_average_gross_monthly_payroll', 'average_gross_monthly_payroll'],
  ],
});

entry({
  id: 'Y-03', page: 1, category: 'new',
  a433: '433-A(OIC) prints nothing like it. Neither does 433-A or 433-F: no predecessor asks about outsourced payroll processing at all.',
  why: '"Does the business outsource its payroll processing and tax return preparation for a fee" with the provider\'s name and address beneath it. A third-party payroll provider is a place the IRS can look for records, and no predecessor form asks for one.',
  keys: [['s1_payroll_outsourced', 'payroll_outsourced'], ['s1_payroll_provider_name_and_address', 'payroll_provider_name_and_address']],
});

// CLASSIFIED `new` IN THE FIRST DRAFT, AND THAT WAS WRONG — kept as a note rather than quietly
// corrected, because it is the C-23 blind spot happening again in the pass that widened the
// comparison to catch it. 433-A(OIC) prints no federal-contractor question, so a crosswalk read
// against 433-A(OIC) alone sees nothing and answers `new`. 433-A line (56) DOES ask it and
// contributed irs433_federal_contractor to the backbone. The A8 twin check found it, and it
// found it because the fact was spelled the predecessor's way rather than dodged.
entry({
  id: 'Y-04', page: 1, category: SUBJ,
  a433: '433-A line (56) "Federal contractor", which contributed irs433_federal_contractor to the backbone. 433-A(OIC) prints no such question at all, which is why the first draft of this entry read `new` - the C-23 blind spot, in the pass that widened the comparison to close it.',
  why: 'The "Federal contractor" Yes/No pair on page 1. 433-A asks it of the individual\'s business in its Section 6; this form asks it of the filing entity.',
  subject_reason: 'Federal contractor status of THE FILING ENTITY. 433-A asks whether the individual taxpayer or their spouse holds federal contracts; a person with no contracts who owns half of a corporation on a GSA schedule answers the two questions differently on the same day, and each answer belongs to its own filing.',
  keys: [['s1_federal_contractor', 'federal_contractor']],
});

entry({
  id: 'Y-05', page: 1, category: 'new',
  a433: '433-A(OIC) prints nothing like it. Its Section 4 asks for a headcount and never asks whether the filer is the whole of it.',
  why: '"Check here if you are the only employee" - a lone box beside the payroll block, which is a statement about the business having no payroll rather than a payroll figure of zero.',
  keys: [['s1_only_employee', 'only_employee']],
});

entry({
  id: 'Y-06', page: 1, category: 'new',
  a433: '433-A(OIC) Section 4 asks the reverse relation - what interest the INDIVIDUAL has in some other business, one business at a time, through s4_other_business_name, s4_other_business_title and s4_other_business_percentage_ownership. It prints no table of a business\'s own principals.',
  why: 'The three-row table of partners, officers, LLC members and major shareholders: last and first name, title, percentage of ownership and annual salary, SSN, home address and two phones. The relation runs the other way from 433-A(OIC)\'s - this is the entity naming its people, not a person naming their entities - and no predecessor prints it.',
  keys: [['partners', 'partners']],
});

// ── page 2, Section 2 ───────────────────────────────────────────────────────────────────
const shapeReason = (what, extra) => `THE TEST: could one table property ever have to hold two different row sets for one filer at one moment? YES. ${what} 433-A(OIC)'s counterpart table belongs to an individual's filing and this one belongs to a separate legal entity's, and the two forms are mutually exclusive by their own printed eligibility rules, so a filer holding both would need both row sets at once. ${extra}`;

entry({
  id: 'Y-07', page: 2, category: 'different-shape',
  a433: '433-A(OIC) prints TWO business bank rows at (8a) and (8b) with no account-type box; 433-A prints two personal rows and two business rows; 433-F prints one block.',
  why: 'Three printed bank rows, each with a Cash / Checking / Savings / Money Market / Online / Stored Value option set the predecessors do not print on their business block. The facts transfer; the container and the type box do not.',
  keys: [['bank_accounts', 'bank_accounts', 'form-specific',
    shapeReason('The rows are the FILING ENTITY\'s bank accounts.', 'The printed slot count also differs - three here against 433-A(OIC)\'s two - and so does the type box, which this form prints and that one does not.')]],
});

entry({
  id: 'Y-08', page: 2, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) (8d) "Total bank accounts from attachment" and (8) "Total business bank accounts", which are themselves classified different-arithmetic-same-name against 433-A.',
  why: 'The captions correspond and the operand list does not. (1) here adds (1a) through (1d) - three printed rows plus the attachment line. 433-A(OIC)\'s (8) adds two printed rows plus its own attachment line and then feeds a business-equity box this form does not print. A figure carried across would be a total over a different set of rows.',
  keys: [
    ['s2_1d_bank_accounts_from_attachment', 'bank_accounts_from_attachment', 'form-specific',
      'THE TEST: would one property ever have to hold two different values for one filer at one moment? YES. It rolls up the bank rows that did not fit THIS form\'s three printed slots. A filer with an individual OIC and a business OIC has two attachment roll-ups, over two different sets of accounts, at the same moment.'],
    ['s2_1_total_bank_accounts', 'total_bank_accounts', 'form-specific',
      'THE TEST: yes, two values at one moment. This is line (1) of the BUSINESS\'s asset section and feeds Box A; 433-A(OIC)\'s (8) is the business half of an individual\'s asset section and feeds its Box B. Different operand sets, different destinations, and both can be live for one filer at once.'],
  ],
});

entry({
  id: 'Y-09', page: 2, category: 'different-shape',
  a433: '433-A(OIC) prints two investment rows at (2a)/(2b) for the INDIVIDUAL and folds business investments into its (9) business-assets table.',
  why: 'Two printed investment rows with a Stocks / Bonds / Other option set, a current value, a loan balance and an equity cell computed on the row. 433-A(OIC) prints the same columns for an individual and prints no business investment table at all - business investments there are rows of the general (9) assets table.',
  keys: [['investment_accounts', 'investment_accounts', 'form-specific',
    shapeReason('The rows are the FILING ENTITY\'s investment accounts.', 'On 433-A(OIC) a business investment is a row of the general (9) business-assets table, which prints different columns; the two containers cannot hold each other\'s rows.')]],
});

entry({
  id: 'Y-10', page: 2, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) (2d) "Total investment accounts from attachment" and (2) "Total investment accounts", which are the INDIVIDUAL\'s.',
  why: 'The captions correspond exactly and the operands do not: (2) here adds two investment rows, the digital-asset row at (2c) and the attachment line at (2d). 433-A(OIC)\'s (2) adds its two investment rows and its own attachment line, and its digital assets are a separate line at (2c) with its own total.',
  keys: [
    ['s2_2d_investment_accounts_from_attachment', 'investment_accounts_from_attachment', 'form-specific',
      'THE TEST: yes, two values at one moment. The attachment roll-up for the investment rows that did not fit THIS form\'s two slots, over the filing entity\'s accounts. The individual\'s roll-up on 433-A(OIC) is a different set of accounts and both can be live at once.'],
    ['s2_2_total_investment_accounts', 'total_investment_accounts', 'form-specific',
      'THE TEST: yes, two values at one moment, and the operand lists differ as well as the subject: this line absorbs the digital-asset total at (2c), which 433-A(OIC) keeps out of its (2). A shared property would carry a figure over a different set of rows on each form.'],
  ],
});

entry({
  id: 'Y-11', page: 2, category: 'different-shape',
  a433: '433-A(OIC) prints the personal digital-asset block at (2c) and the business one at (8c); the business block derives irs433aoi_business_* names.',
  why: 'One printed digital-asset row - description, units, location, custodian account number, self-hosted wallet address, USD equivalent and equity - where 433-A(OIC) prints two blocks of the same shape, one personal and one business. Same columns, one container instead of two.',
  keys: [['digital_assets', 'digital_assets', 'form-specific',
    shapeReason('The row is the FILING ENTITY\'s digital asset holding.', '433-A(OIC) already splits this construct in two - (2c) personal and (8c) business - and neither of its two is this form\'s one.')]],
});

entry({
  id: 'Y-12', page: 2, category: SUBJ,
  a433: '433-A (not 433-A(OIC)) prints an accounts and notes receivable table; 433-F prints an accounts-receivable block. 433-A(OIC) asks neither question as a Yes/No.',
  why: 'Two Yes/No pairs under printed sub-banners: "Do you have notes receivable" and "Do you have accounts receivable, including e-payment, factoring companies and credit card payments". Each is a gate on an attachment rather than a figure.',
  subject_reason: 'The receivables of THE FILING ENTITY. A sole proprietor with factored card receipts and a separate LLC with none answer this differently on the same day, and the two answers reach two different filings.',
  keys: [['s2_notes_receivable', 'notes_receivable'], ['s2_accounts_receivable', 'accounts_receivable']],
});

// ── page 3, Section 2 continued ─────────────────────────────────────────────────────────
entry({
  id: 'Y-13', page: 3, category: 'new',
  a433: '433-A(OIC) prints nothing like it: its real-property block asks for market value, quick-sale value and loan balances and never asks whether the property is on the market.',
  why: '"Is your real property currently for sale or do you anticipate selling your real property to fund the offer amount" with a listing-price cell beside it. A listing price is a third valuation alongside market value and quick-sale value, and no predecessor asks for one.',
  keys: [['s2_real_property_for_sale', 'real_property_for_sale'], ['s2_real_property_listing_price', 'real_property_listing_price']],
});

entry({
  id: 'Y-14', page: 3, category: 'different-shape',
  a433: '433-A(OIC) prints two real-property rows at (5a)/(5b) for the INDIVIDUAL, with the same X .8 quick-sale column.',
  why: 'Two printed property rows - location, description, purchase date, monthly payment, final payment date, lender name and address, market value, quick-sale value, loan balance and equity. The columns are 433-A(OIC)\'s columns and the table is the business\'s.',
  keys: [['real_estate', 'real_estate', 'form-specific',
    shapeReason('The rows are real property held by the FILING ENTITY.', 'A filer with a home on their individual OIC and a warehouse on the business OIC needs both row sets at once, and neither table can hold the other\'s rows.')]],
});

entry({
  id: 'Y-15', page: 3, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) (5c) "Total value of property(s) listed from attachment" and (5) "Total real estate", already classified different-arithmetic-same-name against 433-A.',
  why: 'Identical captions, including the bracketed formula "[current market value X .8 minus any loan balance(s)]", over a different set of rows: two business properties here against two personal properties there.',
  keys: [
    ['s2_3c_property_from_attachment', 'property_from_attachment', 'form-specific',
      'THE TEST: yes, two values at one moment. The roll-up of properties that did not fit this form\'s two slots, all of them the filing entity\'s. The individual\'s roll-up is a different set of properties and both are live whenever both forms are filed.'],
    ['s2_3_total_real_estate', 'total_real_estate', 'form-specific',
      'THE TEST: yes, two values at one moment. Line (3) of the business asset section, feeding Box A. 433-A(OIC)\'s (5) feeds its Box A over the individual\'s properties. Same caption, different rows, different box.'],
  ],
});

entry({
  id: 'Y-16', page: 3, category: 'different-shape',
  a433: '433-A(OIC) prints three vehicle rows at (6a)/(6b)/(6c) with the same Lease/Own box and the same printed "enter 0 as the total value" instruction for a leased vehicle.',
  why: 'Three printed vehicle rows with an identical column set and an identical printed conditional. The construct is 433-A(OIC)\'s down to the wording of the lease instruction; the vehicles are the business\'s.',
  keys: [['vehicles', 'vehicles', 'form-specific',
    shapeReason('The rows are vehicles held by the FILING ENTITY.', 'The column set matches 433-A(OIC)\'s exactly, which is what makes reuse tempting here and wrong: a filer\'s own car and their LLC\'s flatbed are two row sets at one moment.')]],
});

entry({
  id: 'Y-17', page: 3, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) (6e) "Total value of vehicles listed from attachment" and (6) "Total vehicles".',
  why: 'The same captions and the same bracketed formula over a different set of rows. 433-A(OIC) additionally subtracts a printed $3,450 exemption inside its (6) block; this form prints no exemption anywhere on line (4).',
  keys: [
    ['s2_4d_vehicles_from_attachment', 'vehicles_from_attachment', 'form-specific',
      'THE TEST: yes, two values at one moment - the roll-up of the filing entity\'s vehicles beyond three printed slots, against the individual\'s roll-up beyond theirs.'],
    ['s2_4_total_vehicles', 'total_vehicles', 'form-specific',
      'THE TEST: yes, and the arithmetic differs as well as the subject. 433-A(OIC)\'s (6) block prints a vehicle exemption that this form does not print at all, so the two totals are not the same function of their rows even before the rows differ.'],
  ],
});

// ── page 4, Section 2 continued, 3 and 4 ────────────────────────────────────────────────
entry({
  id: 'Y-18', page: 4, category: 'different-shape',
  a433: '433-A(OIC) folds business equipment into its general (9) business-assets table, which prints description, market value, quick-sale value, loan balance and equity for any asset class.',
  why: 'One printed equipment row with the four columns 433-A(OIC)\'s (9) table prints. The facts transfer and the container does not: a dedicated single-row equipment table against a general multi-class asset table.',
  keys: [['business_equipment', 'business_equipment', 'form-specific',
    shapeReason('The row is equipment held by the FILING ENTITY.', 'The shared row-shape specification has no business_equipment class and this group routes business_property, the nearest one it holds - carried as B19 and not settled here.')]],
});

entry({
  id: 'Y-19', page: 4, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) (9c) "Total business assets from attachment" and (9) "Total business assets", already classified different-arithmetic-same-name against 433-A.',
  why: 'The captions correspond and the operand list does not. (5) here adds exactly two terms, (5a) and (5b), and the caption says "and" rather than "through" because there are two. 433-A(OIC)\'s (9) adds two printed rows plus an attachment line and then has an IRS allowed deduction taken off it at (10), which this form prints nowhere.',
  keys: [
    ['s3_equipment_from_attachment', 'equipment_from_attachment', 'form-specific',
      'THE TEST: yes, two values at one moment. The roll-up of equipment beyond this form\'s single printed slot. 433-A(OIC)\'s (9c) rolls up business assets of every class beyond its two slots, which is a wider set over a different entity.'],
    ['s3_total_all_business_equipment', 'total_all_business_equipment', 'form-specific',
      'THE TEST: yes, and the arithmetic differs. 433-A(OIC) subtracts a printed IRS allowed deduction for books and tools of trade from its business-asset total at (10) and this form prints no deduction at all, so the two figures are not the same function even of the same rows.'],
  ],
});

entry({
  id: 'Y-20', page: 4, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) Box A "Available Individual Equity in Assets" and Box B "Available Business Equity in Assets" - two boxes where this form prints one.',
  why: 'One box named "Available Equity in Assets" summing lines (1) through (5). 433-A(OIC) splits the same idea across two boxes and adds them together on its page 7. A figure carried across would be an individual\'s equity in a business\'s box or the reverse.',
  keys: [['s3_box_a_available_equity_in_assets', 'box_a_available_equity_in_assets', 'form-specific',
    'THE TEST: would one property ever hold two values for one filer at one moment? YES, and the decomposition differs too: 433-A(OIC) prints Box A for the individual and Box B for the sole proprietorship and this form prints ONE box over a separate entity\'s five asset lines. A filer with both OICs open has an individual Box A, a sole-prop Box B and a business Box A, all at once.']],
});

entry({
  id: 'Y-21', page: 4, category: 'same-fact-different-decomposition',
  a433: '433-A(OIC) Section 6 prints ONE period, s6_period_provided_beginning / s6_period_provided_through, deriving irs433_period_from and irs433_period_to, and it governs the income and the expense grid together.',
  why: 'TWO periods where the predecessor prints one. Section 3 prints "Period provided beginning ... through" over the income lines and Section 4 prints its own over the expense lines. Nothing on the page requires the two to be equal, so one period cannot be split into two without inventing which half is which, and two cannot be merged into one without discarding a distinction the page draws.',
  keys: [
    ['s3_income_period_beginning', 'income_period_beginning', 'form-specific',
      'THE TEST: yes. irs433_period_from holds ONE period, and this form draws two that the page never requires to agree. Storing this in it would make the expense period overwrite the income period or the reverse, silently, on a statement signed under penalty of perjury.'],
    ['s3_income_period_through', 'income_period_through', 'form-specific',
      'THE TEST: yes, for the reason above, on the closing date of the income period.'],
    ['s4_expense_period_beginning', 'expense_period_beginning', 'form-specific',
      'THE TEST: yes. The expense period is drawn separately over Section 4 and can legitimately differ from the income period; one shared period property could only ever hold one of the two.'],
    ['s4_expense_period_through', 'expense_period_through', 'form-specific',
      'THE TEST: yes, for the reason above, on the closing date of the expense period.'],
  ],
});

entry({
  id: 'Y-22', page: 4, category: SUBJ,
  a433: '433-A(OIC) (12) through (16) - gross receipts, gross rental income, interest, dividends, other income - which derive irs433_bizinc_gross_receipts, irs433_bizinc_gross_rental_income, irs433_bizinc_interest, irs433_bizinc_dividends and irs433aoi_bizinc_other_income_all_sources.',
  why: 'The five printed income lines, in the same order, under the same captions, with "(specify on attachment)" beside the residual line exactly as the predecessor prints it.',
  subject_reason: 'These are the monthly receipts of THE FILING ENTITY. 433-A(OIC)\'s (12) through (16) are the receipts of the individual\'s Schedule C sole proprietorship, and the two entities are mutually exclusive by the forms\' printed eligibility rules - so a filer with both open has two gross-receipts figures for two different businesses on the same day.',
  keys: [
    ['s3_6_gross_receipts', 'bizinc_gross_receipts'],
    ['s3_7_gross_rental_income', 'bizinc_gross_rental_income'],
    ['s3_8_interest_income', 'bizinc_interest'],
    ['s3_9_dividends', 'bizinc_dividends'],
    ['s3_10_other_income', 'bizinc_other_income'],
  ],
});

entry({
  id: 'Y-23', page: 4, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) (17) "Total Business Income", which is itself classified exact against 433-A and derives irs433_bizinc_total_income.',
  why: 'The caption corresponds and the operand list does not: five lines here, (6) through (10); five lines there, (12) through (16) - but 433-A(OIC)\'s (16) is a residual over ALL other sources while this form\'s (10) is a residual specified on an attachment, and the box this total feeds is a different box.',
  keys: [['s3_box_b_total_business_income', 'box_b_total_business_income', 'form-specific',
    'THE TEST: yes, two values at one moment. irs433_bizinc_total_income is the sole proprietorship\'s total monthly business income; this is a separate legal entity\'s. Both are live whenever a filer submits an individual OIC and a business OIC together, which is the ordinary case this pass was told to plan for.']],
});

entry({
  id: 'Y-24', page: 4, category: SUBJ,
  a433: '433-A(OIC) (18) through (28) - materials, inventory, gross wages, rent, supplies, utilities and telephones, vehicle costs, insurance, current taxes, secured debts and other expenses - most of which derive irs433_bizexp_* names.',
  why: 'Ten printed expense lines. Nine of them carry 433-A(OIC)\'s captions verbatim; the tenth, (17) Vehicle costs, prints the same all-in caption 433-A(OIC) uses at (24) - "gas, oil, repairs, insurance, parking, registration".',
  subject_reason: 'The monthly operating expenses of THE FILING ENTITY. 433-A(OIC)\'s expense grid belongs to the individual\'s sole proprietorship; a filer with both OICs open is claiming two rent figures, two payrolls and two insurance figures on the same day, for two businesses the IRS treats separately.',
  keys: [
    ['s4_11_materials_purchased', 'bizexp_materials_purchased'],
    ['s4_12_inventory_purchased', 'bizexp_inventory_purchased'],
    ['s4_13_gross_wages_and_salaries', 'bizexp_gross_wages_and_salaries'],
    ['s4_14_rent', 'bizexp_rent'],
    ['s4_15_supplies', 'bizexp_supplies'],
    ['s4_16_utilities_telephones', 'bizexp_utilities_telephone'],
    ['s4_17_vehicle_costs', 'bizexp_vehicle_costs'],
    ['s4_18_insurance', 'bizexp_insurance'],
    ['s4_19_current_taxes', 'bizexp_current_taxes'],
    ['s4_20_other_expenses', 'bizexp_other_expenses'],
  ],
});

entry({
  id: 'Y-25', page: 4, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) (29) "Total Business Expenses", already classified different-arithmetic-same-name against 433-A and deriving irs433aoi_total_business_expenses.',
  why: 'The caption corresponds and the operand list does not: ten lines here, eleven there - 433-A(OIC) prints a secured-debts line at (27) that this form prints nowhere, so its total absorbs an operand this one has no cell for.',
  keys: [['s4_box_c_total_business_expenses', 'box_c_total_business_expenses', 'form-specific',
    'THE TEST: yes, two values at one moment, and the operand count differs. 433-A(OIC) sums eleven expense lines including secured debts other than credit cards; this form sums ten and prints no secured-debts line. Storing both in one property would make a ten-term sum and an eleven-term sum the same number.']],
});

entry({
  id: 'Y-26', page: 4, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) Box C "Net Business Income", which is (17) minus (29) and derives irs433aoi_box_c_net_business_income.',
  why: 'Box D here is Box B minus Box C, in that printed order, and it is the END of the business income calculation - it feeds the multipliers directly. 433-A(OIC)\'s Box C is the START of one: its net business income is carried to line (36) and folded into the individual\'s household income before any multiplier is applied.',
  keys: [['s4_box_d_remaining_monthly_income', 'box_d_remaining_monthly_income', 'form-specific',
    'THE TEST: yes, and it is the most dangerous pair on this form. Both boxes are "income minus expenses" and both print a floor of zero, so the captions invite reuse; but 433-A(OIC)\'s Box C is an OPERAND of a later household calculation and this form\'s Box D is the figure the multipliers act on. One property would make a component and a result the same stored number.']],
});

// ── page 5, Section 5 ───────────────────────────────────────────────────────────────────
entry({
  id: 'Y-27', page: 5, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) Section 8 prints the identical construct one box letter along: s8_box_f_for_12_month_multiplier and s8_box_f_for_24_month_multiplier feeding Box G and Box H, deriving irs433aoi_box_f_for_12_month_multiplier, irs433aoi_box_f_for_24_month_multiplier, irs433aoi_box_g_future_remaining_income and irs433aoi_box_h_future_remaining_income.',
  why: 'Two multiplier rows, X 12 and X 24, over a copied box. The multipliers are the same and the operand is not: Box D here is a BUSINESS\'s remaining monthly income; 433-A(OIC)\'s Box F is an individual\'s remaining monthly income after household expenses, which has the sole proprietorship\'s net business income as one of its own operands.',
  keys: [
    ['s5_box_d_for_12_month_multiplier', 'box_d_for_12_month_multiplier', 'form-specific',
      'THE TEST: yes. It is a copy of THIS form\'s Box D. 433-A(OIC)\'s cell of the same shape copies its Box F, which is a different quantity computed from a different subject\'s figures, and both are live whenever both forms are filed.'],
    ['s5_box_e_future_remaining_income', 'box_e_future_remaining_income', 'form-specific',
      'THE TEST: yes. Twelve months of a business\'s remaining income against twelve months of an individual\'s. The arithmetic is identical and the input is not, which is exactly the shape this category names.'],
    ['s5_box_d_for_24_month_multiplier', 'box_d_for_24_month_multiplier', 'form-specific',
      'THE TEST: yes, as for the 12-month copy above, on the 24-month row.'],
    ['s5_box_f_future_remaining_income', 'box_f_future_remaining_income', 'form-specific',
      'THE TEST: yes - AND THE LETTER F IS A TRAP. On this form Box F is twenty-four months of future income; on 433-A(OIC) Box F is the monthly remaining income the multipliers act ON. Same letter, opposite ends of the same calculation, and a shared name would put one where the other belongs.'],
  ],
});

entry({
  id: 'Y-28', page: 5, category: 'different-arithmetic-same-name',
  a433: '433-A(OIC) prints the offer equation as "Enter the amount from Box A plus Box B (if applicable)" plus "Box G or Box H", deriving irs433aoi_box_a_plus_box_b, irs433aoi_box_g_or_box_h and irs433aoi_offer_amount.',
  why: 'The same three-cell printed equation with two differences that both matter. The first operand here is ONE box and there is the sum of two. And this form\'s copy carries an asterisk - "You may exclude any equity in income producing assets (except real estate) shown in Section 2 of this form" - which 433-A(OIC) does not print anywhere on its page 7.',
  keys: [
    ['s5_amount_from_box_a', 'amount_from_box_a', 'form-specific',
      'THE TEST: yes, twice over. It is a copy of a different box, and it is a copy that the printed asterisk permits to be REDUCED by an amount no cell on the form records - so two filers with the same Box A can legitimately print different figures here. 433-A(OIC)\'s cell carries no such permission and is declared as an equality.'],
    ['s5_amount_from_box_e_or_box_f', 'amount_from_box_e_or_box_f', 'form-specific',
      'THE TEST: yes. It copies Box E or Box F of THIS form; the 433-A(OIC) cell of the same shape copies Box G or Box H of that one. Which of the pair was copied is set on Form 656 and recorded nowhere here, so the cell is not checkable on either form and a shared property would merge two unverifiable figures.'],
    ['s5_offer_amount', 'offer_amount', 'form-specific',
      'THE TEST: yes, and this is the figure the whole form exists to produce. A business offer in compromise and an individual offer in compromise are two offers, on two Forms 656, for two taxpayers. One property holding both is one of them overwriting the other.'],
  ],
});

// ── page 5, Section 6 ───────────────────────────────────────────────────────────────────
entry({
  id: 'Y-29', page: 5, category: SUBJ,
  a433: '433-A(OIC) Section 9 bankruptcy block - s9_bankruptcy_date_filed, s9_bankruptcy_petition_number, s9_bankruptcy_location_filed and the two Yes/No pairs - deriving irs433_bk_date_filed, irs433_bk_petition_no and irs433_bk_location_filed.',
  why: 'Two Yes/No pairs and three detail cells: currently in bankruptcy, filed in the past 10 years, date filed, petition number, location filed. The questions and the cells are the predecessor\'s.',
  subject_reason: 'The printed questions say so in words: "Is THE BUSINESS currently in bankruptcy" and "Has THE BUSINESS filed bankruptcy in the past 10 years". 433-A(OIC) asks the same two questions about the individual. A shareholder in Chapter 7 whose corporation is not, or the reverse, is an ordinary state of the world and produces two different answers at one moment.',
  keys: [
    ['s6_currently_in_bankruptcy', 'currently_in_bankruptcy'],
    ['s6_filed_bankruptcy_past_10_years', 'filed_bankruptcy_past_10_years'],
    ['s6_bankruptcy_date_filed', 'bk_date_filed'],
    ['s6_bankruptcy_petition_no', 'bk_petition_no'],
    ['s6_bankruptcy_location_filed', 'bk_location_filed'],
  ],
});

entry({
  id: 'Y-30', page: 5, category: 'same-fact-different-decomposition',
  a433: '433-A(OIC) prints TWO cells - "Date dismissed" and "Date discharged" - deriving irs433_bk_date_dismissed and irs433_bk_date_discharged.',
  why: 'ONE printed cell captioned "Date dismissed or discharged" where the predecessor prints two. Dismissal and discharge are different outcomes with different collection consequences, and this form does not ask which one happened.',
  keys: [['s6_bankruptcy_date_dismissed_or_discharged', 'bk_date_dismissed_or_discharged', 'form-specific',
    'THE TEST: yes, and in the direction that loses information. A value stored here cannot be decomposed into irs433_bk_date_dismissed and irs433_bk_date_discharged because the page never says which of the two it is; and a value read the other way would have to choose. Two properties on the predecessor and one here is not a shape a shared name can carry, quite apart from the two forms describing different persons.']],
});

entry({
  id: 'Y-31', page: 5, category: SUBJ,
  a433: '433-A(OIC) Section 4 asks whether the individual or any related parties have other business interests and captures one such business\'s name, title and percentage ownership.',
  why: '"Does this business have other business affiliations (e.g., subsidiary or parent companies)" with one cell for the name and Employer Identification Number of each. The predecessor asks a person about their business interests; this asks a business about its corporate group.',
  subject_reason: 'A subsidiary or parent of the FILING ENTITY is not the same fact as a business the individual filer happens to hold an interest in, and a filer with both OICs open can have both - their own side business on the 433-A(OIC), the corporation\'s parent company here.',
  keys: [['s6_other_business_affiliations', 'other_business_affiliations'], ['s6_affiliations_name_and_ein', 'affiliations_name_and_ein']],
});

entry({
  id: 'Y-32', page: 5, category: 'new',
  a433: '433-A(OIC) prints nothing like it. It asks what the individual owes and never asks what is owed TO them by related parties.',
  why: '"Do any related parties (e.g., partners, officers, employees) owe money to the business" - a receivable from an insider, which is an asset the IRS can reach and which no predecessor form asks about in either direction.',
  keys: [['s6_related_parties_owe_money', 'related_parties_owe_money']],
});

entry({
  id: 'Y-33', page: 5, category: SUBJ,
  a433: '433-A(OIC) Section 9 litigation block - s9_litigation_location_of_filing, s9_litigation_represented_by, s9_litigation_docket_case_number, s9_litigation_possible_completion_date, s9_litigation_subject and s9_litigation_amount_of_dispute - deriving the irs433_suit_* family.',
  why: 'The Yes/No pair, the Plaintiff/Defendant option pair and the six detail cells, in the predecessor\'s order under the predecessor\'s captions.',
  subject_reason: 'The printed question is "Is THE BUSINESS currently, or in the past, party to litigation". 433-A(OIC) asks it of the individual. A director personally sued and their company separately sued are two suits with two docket numbers, two amounts in dispute and two completion dates, all live at once.',
  keys: [
    ['s6_party_to_litigation', 'party_to_litigation'],
    ['s6_litigation_role', 'suit_role'],
    ['s6_litigation_location_of_filing', 'suit_location_of_filing'],
    ['s6_litigation_represented_by', 'suit_represented_by'],
    ['s6_litigation_docket_case_number', 'suit_docket_case_no'],
    ['s6_litigation_possible_completion_date', 'suit_possible_completion_date'],
    ['s6_litigation_subject', 'suit_subject'],
    ['s6_litigation_amount_in_dispute', 'suit_amount'],
  ],
});

entry({
  id: 'Y-34', page: 5, category: SUBJ,
  a433: '433-A(OIC) s9_irs_litigation_tax_types_and_periods, itself classified new there and deriving irs433aoi_irs_litigation_tax_types_and_periods.',
  why: 'The IRS-litigation Yes/No pair and the cell for the types of tax and periods involved, printed exactly as the predecessor prints them.',
  subject_reason: 'Tax litigation involving the FILING ENTITY. An officer with a personal deficiency case and a corporation with an employment-tax case are two matters over two sets of periods, and each belongs to its own filing.',
  keys: [['s6_party_to_irs_litigation', 'party_to_irs_litigation'], ['s6_irs_litigation_tax_types_and_periods', 'irs_litigation_tax_types_and_periods']],
});

// ── page 6, Section 6 continued ─────────────────────────────────────────────────────────
entry({
  id: 'Y-35', page: 6, category: SUBJ,
  a433: '433-A(OIC) s9_transferred_asset_below_value_past_10_years, classified exact there and deriving irs433_transferred_assets.',
  why: 'The Yes/No pair for a transfer of any asset worth more than $10,000, including real property, for less than full value in the past 10 years.',
  subject_reason: 'A transfer made BY THE FILING ENTITY. An individual gifting a car and their company selling a press to a member below market are two transfers by two persons, and each is disclosed on its own form.',
  keys: [['s6_transferred_asset_under_value_past_10_years', 'transferred_assets']],
});

entry({
  id: 'Y-36', page: 6, category: 'same-fact-different-decomposition',
  a433: '433-A(OIC) prints FOUR cells for the same disclosure - s9_transfer_list_assets, s9_transfer_value_at_time, s9_transfer_date and s9_transfer_to_whom_or_where - deriving irs433_transfer_assets, irs433_transfer_value_at_transfer, irs433_transfer_date and irs433_transfer_to_whom_or_where.',
  why: 'ONE printed cell captioned "If yes, provide date, value, and type of asset transferred" where the predecessor prints four, and the one here does not ask to whom the asset went, which the predecessor does.',
  keys: [['s6_asset_transfer_date_value_and_type', 'asset_transfer_date_value_and_type', 'form-specific',
    'THE TEST: yes, and the decomposition is the reason on its own. Four predecessor cells collapse into one free-text cell here, and no rule splits that text back into a date, a value and a type - so the value can be written into the four but never read out of them, and the four carry a recipient this form never asks for.']],
});

entry({
  id: 'Y-37', page: 6, category: 'new',
  a433: '433-A(OIC) asks one transfer question, over ten years, over assets generally. It prints no separate real-property question and no three-year window anywhere.',
  why: '"In the past 3 years have you transferred any real property (land, house, etc.)" with a cell for the type of property, value and date of the transfer. A second, narrower transfer question with a different window and a different asset class - not a restatement of the ten-year one.',
  keys: [['s6_transferred_real_property_past_3_years', 'transferred_real_property_past_3_years'],
    ['s6_real_property_transfer_type_value_date', 'real_property_transfer_type_value_date']],
});

entry({
  id: 'Y-38', page: 6, category: SUBJ,
  a433: '433-A(OIC) s9_lived_outside_us_6_months_past_10_years, classified exact there and deriving irs433_lived_abroad_6mo. It also prints from/to date cells that this form does not - recorded as Y-A4.',
  why: '"Has the business been located outside the U.S. for 6 months or longer in the past 10 years" - the predecessor\'s question with "lived" replaced by "been located".',
  subject_reason: 'Where THE FILING ENTITY has been located, which is not where its officers have lived. A US-resident director of a company operating abroad answers the two questions differently on the same day.',
  keys: [['s6_located_outside_us_6_months', 'located_outside_us_6_months']],
});

entry({
  id: 'Y-39', page: 6, category: SUBJ,
  a433: '433-A(OIC) s9_assets_or_real_property_outside_us and s9_assets_outside_us_description, both classified new there and deriving irs433aoi_ names.',
  why: '"Do you have any assets or own any real property outside the U.S." with a cell for the description, location and value. Identical to the predecessor\'s pair.',
  subject_reason: 'Foreign assets of THE FILING ENTITY. A person with a foreign holiday flat and a company with a foreign warehouse are two disclosures at one moment, and the printed eligibility rules put them on two forms.',
  keys: [['s6_assets_or_real_property_outside_us', 'assets_or_real_property_outside_us'],
    ['s6_assets_outside_us_description_location_value', 'assets_outside_us_description_location_value']],
});

entry({
  id: 'Y-40', page: 6, category: SUBJ,
  a433: '433-A(OIC) s9_funds_held_in_trust_by_third_party, s9_funds_held_in_trust_amount and s9_funds_held_in_trust_where, all classified new there and deriving irs433aoi_ names.',
  why: '"Does the business have any funds being held in trust by a third party" with the amount and where. The predecessor\'s three cells, question for question.',
  subject_reason: 'Funds held for THE FILING ENTITY. An escrow holding a company\'s retention and a solicitor holding an individual\'s settlement are two balances in two places, and a filer with both OICs open discloses both.',
  keys: [['s6_funds_held_in_trust', 'funds_held_in_trust_by_third_party'],
    ['s6_funds_held_in_trust_amount', 'funds_held_in_trust_amount'],
    ['s6_funds_held_in_trust_where', 'funds_held_in_trust_where']],
});

entry({
  id: 'Y-41', page: 6, category: 'new',
  a433: '433-A(OIC) prints an available-credit block for CREDIT CARDS - issuer, credit limit, amount owed, available credit - and prints no question about a line of credit and nothing about what secures one.',
  why: '"Does the business have any lines of credit" with the credit limit, the amount owed and the property securing it. The securing-property cell has no counterpart anywhere in the series: a credit card is unsecured and the predecessor block never asks what stands behind the facility.',
  keys: [['s6_lines_of_credit', 'lines_of_credit'],
    ['s6_line_of_credit_limit', 'line_of_credit_limit'],
    ['s6_line_of_credit_amount_owed', 'line_of_credit_amount_owed'],
    ['s6_line_of_credit_property_securing', 'line_of_credit_property_securing']],
});

// ── page 6, Section 7 ───────────────────────────────────────────────────────────────────
entry({
  id: 'Y-42', page: 6, category: SUBJ,
  a433: '433-A(OIC) prints a signature block with a date; its s4_other_business_title derives irs433_title, which is a title in a business the individual has an interest in.',
  why: 'The title of the person signing for the business and the date of signature, under the penalties-of-perjury declaration.',
  subject_reason: 'A title HELD IN THE FILING ENTITY by whoever signs for it, and the date THIS filing was signed. irs433_title records an individual\'s title in a different business, and two OICs signed on two dates are two dates.',
  keys: [['s7_signer_title', 'signer_title'], ['s7_date_signed', 'date_signed']],
});

entry({
  id: 'Y-43', page: 6, category: SUBJ,
  a433: '433-A(OIC) Section 10 prints its own attachment checklist - s10_attached_bank_statements, s10_attached_lender_statements, s10_attached_receivables_list, s10_attached_digital_asset_records, s10_attached_special_circumstances, s10_attached_form_2848, s10_attached_form_656 and others - every one of them classified new there.',
  why: 'Nine lone check-here boxes, one per attachment class: profit and loss statement, bank and investment statements, collateral loan statements, accounts and notes receivable, digital asset records, lender and mortgage statements, special circumstances, Form 2848 and Form 656.',
  subject_reason: 'What was attached to THIS filing. Two OICs are two envelopes: a filer who attaches a Form 2848 to the business offer and not to the individual one has two different answers to one question at one moment, and the tick is a fact about the submission rather than about the taxpayer.',
  keys: [
    ['s7_attach_profit_and_loss', 'attached_profit_and_loss'],
    ['s7_attach_bank_and_investment_statements', 'attached_bank_and_investment_statements'],
    ['s7_attach_collateral_loan_statements', 'attached_collateral_loan_statements'],
    ['s7_attach_accounts_and_notes_receivable', 'attached_accounts_and_notes_receivable'],
    ['s7_attach_digital_asset_records', 'attached_digital_asset_records'],
    ['s7_attach_lender_and_mortgage_statements', 'attached_lender_and_mortgage_statements'],
    ['s7_attach_special_circumstances', 'attached_special_circumstances'],
    ['s7_attach_form_2848', 'attached_form_2848'],
    ['s7_attach_form_656', 'attached_form_656'],
  ],
});

entry({
  id: 'Y-44', page: 4, category: SUBJ,
  a433: '433-A(OIC)\'s map declares the SAME record-shape input over its line (17) and line (29), and has NO property for it - see _the_433aoi_gap_this_pass_found below.',
  why: 'THE OPERATOR INPUT `business_income_expense_route`, which the map declares and the engine reads and no printed cell holds. Section 3 prints "Note: If you provide a current profit and loss statement for the information below, enter the total gross monthly income in Box B below. Do not complete lines (6) - (10)." and Section 4 prints the same sentence over lines (11) - (20). A filed page on the P&L route and a filed page whose grid happens to be blank are indistinguishable on paper, which is why the route is an input rather than a predicate over a cell.',
  subject_reason: 'WHETHER A CURRENT PROFIT AND LOSS STATEMENT WAS PROVIDED FOR THIS BUSINESS. adapters/pdf/record-shape.mjs establishes from the printed sentences that the two notes on this form are ONE condition about ONE document, and that is right and is not the question here: the question is whether the sole proprietorship on a filer\'s 433-A(OIC) and the corporation on their 433-B(OIC) are one document. They are two businesses and therefore two statements, and a filer can attach one and complete the grid on the other. The RECORD KEY stays shared - it names the fact and the fill engines of both forms read it - and the PROPERTY is per form, because the key is what one record calls the value and the property is where two filings would collide.',
  keys: [['business_income_expense_route', 'business_income_expense_route']],
});

// ── what 433-A(OIC) prints and this form does not ───────────────────────────────────────
entry({
  id: 'Y-A1', page: null, category: 'asymmetric-the-other-way',
  a433: '433-A(OIC) (10) "IRS allowed deduction for professional books and tools of trade", (11) "Business assets less the IRS allowed deduction" and Box B "Available Business Equity in Assets".',
  why: '433-A(OIC) takes a printed statutory deduction off its business-asset total and carries the remainder into a second equity box. 433-B(OIC) prints no deduction of any kind and prints one equity box. A business with tools of trade files here and the deduction has nowhere to go on the page.',
  keys: [],
});

entry({
  id: 'Y-A2', page: null, category: 'asymmetric-the-other-way',
  a433: '433-A(OIC) (27) "Secured debts (not credit cards)", which derives irs433aoi_bizexp_secured_debts_not_credit_cards.',
  why: 'A monthly expense line for secured business debt other than credit cards. This form\'s Section 4 prints ten expense lines and none of them is it, so a business paying a secured note discloses that payment nowhere on the expense grid and it is absorbed into (20) or omitted.',
  keys: [],
});

entry({
  id: 'Y-A3', page: null, category: 'asymmetric-the-other-way',
  a433: '433-A(OIC) Sections 1, 2, 3, 6, 7 and 8 in their entirety, and 433-A groups.household_members, groups.life_insurance_policies and groups.available_credit.',
  why: 'Everything about a PERSON: identity and marital status, employment and pay periods, the household, personal bank and retirement accounts, life insurance, personal vehicles, monthly household income and the national and local standard expense allowances. 433-B(OIC) prints none of it. A crosswalk read only from this form would show no trace of the largest part of the predecessor.',
  keys: [],
});

entry({
  id: 'Y-A4', page: null, category: 'asymmetric-the-other-way',
  a433: '433-A(OIC) s9_lived_abroad_from and s9_lived_abroad_to, deriving irs433_lived_abroad_from and irs433_lived_abroad_to.',
  why: 'The predecessor asks the six-month question AND asks for the dates. This form asks the question - see Y-38 - and prints no date cells at all, so the period a business was located abroad is disclosed nowhere on it.',
  keys: [],
});

entry({
  id: 'Y-A5', page: null, category: 'asymmetric-the-other-way',
  a433: '433-A(OIC) Section 9\'s trust-beneficiary block, its trustee/fiduciary block, its safe deposit box block and its inmate number cell - the irs433_trust_*, irs433_trustee_*, irs433_sdb_* and irs433_inmate_number families.',
  why: 'Being a beneficiary of a trust, acting as a trustee or fiduciary, holding a safe deposit box, and being incarcerated. All four are questions about a natural person and 433-B(OIC) prints none of them - which is correct for a corporation and means a trust interest HELD BY a business is disclosed nowhere on this form.',
  keys: [],
});

// ═══════════════════════════════════════════════════════════════════════════════════════
// EMIT
// ═══════════════════════════════════════════════════════════════════════════════════════
// What a previous run of this generator plus reclassify-against-backbone --emit already put
// into the file. Absent on the first run, which is a declared state and not an error.
let PRIOR = new Map();
try { PRIOR = new Map(JSON.parse(readFileSync('adapters/pdf/maps/433boi.crosswalk-classification.json', 'utf8')).entries.map((e) => [e.id, e])); }
catch (err) { if (err.code !== 'ENOENT') throw err; }

const MIDDLE = new Set(['superset', 'different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition']);
const problems = [];
const seenKey = new Set();
const bindings = [];

for (const e of E) {
  if (e.category === SUBJ && !e.subject_reason) problems.push(`${e.id} is ${SUBJ} and declares no subject_reason.`);
  if (e.category === 'asymmetric-the-other-way' && e.keys.length) problems.push(`${e.id} is asymmetric-the-other-way and binds ${e.keys.length} key(s).`);
  for (const [key, fact, scope, scopeReason] of e.keys) {
    if (seenKey.has(key)) problems.push(`key "${key}" is bound twice.`);
    seenKey.add(key);
    if (MIDDLE.has(e.category) && (!scope || !scopeReason)) problems.push(`${e.id}/${key} is ${e.category} and declares no scope/scope_reason.`);
    if (scopeReason && scopeReason.length < 60) problems.push(`${e.id}/${key} scope_reason is ${scopeReason.length} chars.`);
    const t = typeOf(key);
    bindings.push({
      key, entry: e.id, fact, backbone_key: null,
      type: t.type, fieldType: t.fieldType, type_basis: t.type_basis,
      pii: PII.has(key), ...(t.options ? { options: t.options, map_option_by_value: t.map_option_by_value } : {}),
      ...(scope ? { scope, scope_reason: scopeReason } : {}),
    });
  }
}
if (problems.length) { console.error('STOP:'); problems.forEach((p) => console.error('  ' + p)); process.exit(3); }

// The `oic` prose each entry needs: its keys, spelled out. ENUMERATED IS THE GRANULARITY
// STANDARD and this form declares no naming mechanism at all, so every entry names every key
// it covers verbatim and adapters/hubspot/classification-coverage.mjs needs no MECHANISMS row.
const groupNameOf = {};
for (const [g, d] of Object.entries(MAP.groups)) groupNameOf[d.source] = g;
const oicOf = (e) => e.keys.map(([k]) => (groupNameOf[k] ? `groups.${groupNameOf[k]}` : k)).join(', ');

// THE CATEGORY DEFINITIONS, hoisted so the tally can be built from their names. count-sweep
// [S-25b] holds every entry's category to two things: it must be DECLARED here, and it must be
// TALLIED. So the tally below is seeded from these keys and every declared category gets a
// line, including the two this form uses zero times.
const CATEGORIES = {
  exact: 'The same fact, computed the same way, in the same shape, ABOUT THE SAME SUBJECT. The only category a provisioning pass may reuse a property for without a decision. USED ZERO TIMES ON THIS FORM, and `subject` above says why.',
  'same-question-different-subject': 'The predecessor asks this question in these words and asks it about ITS subject, which is a different legal person from this form\'s. The question transfers; the answer does not, and no transformation carries one to the other because the two answers are about two entities. Derives a form-specific name. Every entry in this category must carry a `subject_reason` naming the two subjects and the state of the world in which they differ.',
  superset: 'The line asks for MORE than the predecessor\'s. Direction matters. Unused on this form.',
  'different-arithmetic-same-name': 'The captions correspond and the ARITHMETIC does not. The most dangerous category on any form in this series, because the names invite reuse and the resulting figure is wrong on a statement signed under penalty of perjury while every printed total still reconciles. Each row must declare scope and scope_reason.',
  'different-shape': 'The same facts, laid out differently - a different number of printed rows, a different grouping, a different overflow rule. The facts transfer; the container does not. Each row must declare scope and scope_reason.',
  'same-fact-different-decomposition': 'One quantity split into different parts by the two forms. Neither side is wrong and no cell-to-cell mapping exists. Each row must declare scope and scope_reason.',
  new: 'This form prints it and no predecessor prints anything like it. Nothing to crosswalk.',
  'asymmetric-the-other-way': 'A predecessor prints it and this form does not. Recorded because a crosswalk read in one direction hides these entirely, and a predecessor fact with nowhere to go on this form is a fact this filing drops.',
};

// EVERY NON-UNDERSCORE KEY UNDER _tally IS READ BY count-sweep [S-25] AS A CATEGORY NAME and
// counted against entries[]. A figure that is not a category count therefore carries a leading
// underscore, which is how [S-25] is told it is prose. The first draft put `keys_bound: 113`
// in there and the sweep correctly derived 0 entries with the category "keys_bound".
const tally = { entries: E.length };
for (const c of Object.keys(CATEGORIES)) tally[c] = 0;
for (const e of E) tally[e.category] = (tally[e.category] || 0) + 1;

const cls = {
  form: '433boi',
  against: '433aoi',
  covers_slices: 'Slices 1-3, pages 1-6. THE CLASSIFICATION IS COMPLETE for 433-B(OIC): every bound key on the form is covered by exactly one entry, and adapters/hubspot/derive-names-433boi.mjs CHECKS that with a KEY-COUNTER (A1) rather than an entry-counter, against the map\'s own key space plus the one declared engine input.',
  _what_this_is: 'THE CROSSWALK CLASSIFICATION, AS DATA. For each correspondence between a 433-B(OIC) binding and its nearest counterpart on a predecessor form, WHICH KIND of correspondence it is. Authored in one pass rather than in slices, because the map was already closed when this file was opened.',
  _this_binds_NOTHING: 'NO CROSSWALK BINDINGS. No HubSpot property is named, no canonical column is claimed, no map key is repointed. Every entry is a statement about how two PRINTED FORMS relate, and the provisioning pass reads it rather than the reverse.',
  _the_finding_that_governs_every_entry: 'THIS IS THE FIRST FORM IN THE SERIES WHOSE SUBJECT IS A DIFFERENT LEGAL PERSON. 433-A, 433-F and 433-A(OIC) are all statements by and about an individual; 433-A(OIC)\'s Sections 4 to 6 describe that individual\'s SOLE PROPRIETORSHIP, which is the individual. 433-B(OIC) is a statement by and about a corporation, partnership, LLC classified as a corporation, or other multi-owner/multi-member LLC. The two are mutually exclusive BY THE FORMS\' OWN PRINTED ELIGIBILITY INSTRUCTIONS, so a filer who submits both is describing two different persons, and one property serving both would have to hold two values for one filer at one moment. The consequence is stated in `subject` below and asserted by the deriver.',
  subject: {
    this_form: 'the business entity that is filing - a corporation, partnership, LLC classified as a corporation, or other multi-owner/multi-member LLC',
    predecessors: {
      '433a': 'the individual taxpayer',
      '433f': 'the individual taxpayer, including any sole proprietorship they run',
      '433aoi': 'the individual taxpayer; its Sections 4 to 6 describe that individual\'s SOLE PROPRIETORSHIP, which for tax purposes is the individual',
    },
    the_ruling: 'NO FACT WHOSE SUBJECT IS THE FILING ENTITY MAY TAKE A SHARED irs433_ NAME. The categories still describe the printed relation; the SCOPE is decided by the subject, and on this form the subject is the filing entity for every bound key without exception.',
    the_test_applied: 'Ruling 6: would one property serving both forms ever have to hold two different values for one taxpayer at one moment? For every key on this form the answer is yes, because the two forms are filed by two different persons and the printed eligibility rules make it impossible for them to describe the same business.',
    the_eighth_category: 'same-question-different-subject EXISTS BECAUSE THE SEVEN DID NOT COVER THIS. `exact` means "the same fact, computed the same way, in the same shape", and it is the category that derives a shared name. Sixty-two of this form\'s questions are word-for-word a predecessor\'s and are NOT that fact, because the fact is about a different person. Classifying them `exact` would derive a shared name and be wrong; classifying them `new` would say the predecessor prints nothing like them and be false. The eighth category says what is true.',
    the_consequence_stated_plainly: 'THIS FORM REUSES NOTHING. Every one of its properties is form-specific, and the reason is not that its questions are new - most of them are not - but that its subject is.',
  },
  _the_categories: CATEGORIES,
  _why_the_shared_leaf_names_are_not_evidence: 'adapters/pdf/maps/433boi.lineage-433aoi.json records the AcroForm leaf names 433-B(OIC) shares with 433-A(OIC), and adapters/pdf/maps/433boi.name-lies.json records 14 active lies and 16 verified controls among them. NOT ONE OF THOSE SHARED NAMES APPEARS IN THIS FILE AS EVIDENCE OF ANYTHING. An inherited leaf name is evidence of nothing; a lineage verdict is per occurrence, never per name; and the categories here are read off the PRINTED captions and the printed eligibility instructions.',
  _the_433aoi_gap_this_pass_found: 'THE SAME RECORD-SHAPE INPUT IS LIVE ON 433-A(OIC) AND HAS NO PROPERTY THERE. adapters/pdf/maps/433aoi.map.json declares `business_income_expense_route` over its lines (17) and (29), and adapters/pdf/record-shape.mjs reads it out of the record - but it is in neither the map\'s `map` block, nor `checkboxes`, nor `check_here`, nor any group source, so it is outside the key space adapters/hubspot/classification-coverage.mjs builds, has no row in crosswalk.433aoi.json, and has no property in fields.433aoi.json. A 433-A(OIC) record fetched from HubSpot today therefore cannot carry the route, and the gate STOPs on a record that declares none. FOUND HERE, NOT FIXED HERE: creating irs433aoi_business_income_expense_route is provisioning for a form this prompt\'s scope line excludes. Carried as B24.',
  // `compared_against` and `granularity` ARE NOT AUTHORED HERE AND ARE CARRIED FORWARD IF THEY
  // EXIST. reclassify-against-backbone.mjs --emit derives both from the backbone and writes them
  // into this file; regenerating from this table would silently drop them, and a derived field
  // that disappears when its neighbours are re-authored is a field nobody can trust. Read back
  // off the file rather than recomputed, because recomputing them here would be a second
  // implementation of a derivation that already has one.
  entries: E.map((e) => {
    const prior = PRIOR.get(e.id) || {};
    return {
      id: e.id, page: e.page, category: e.category,
      oic: oicOf(e),
      a433: e.a433,
      why: e.why,
      ...(e.subject_reason ? { subject_reason: e.subject_reason } : {}),
      ...(prior.compared_against ? { compared_against: prior.compared_against } : {}),
      ...(prior.granularity ? { granularity: prior.granularity } : {}),
    };
  }),
  _tally: {
    _why: 'Derived from entries[] by this file\'s generator and re-derived by adapters/pdf/count-sweep.mjs. A hand-kept tally beside a list is how "eleven" survived three slices when the honest figure was ten.',
    ...tally,
    _keys_bound: `${bindings.length} bound keys = the ${bindings.length - 1} input keys adapters/hubspot/classification-coverage.mjs reads out of 433boi.map.json, plus the one declared engine input business_income_expense_route. UNDERSCORED BECAUSE IT IS NOT A CATEGORY COUNT: count-sweep [S-25] reads every bare key under _tally as a category name and derives it from entries[]. A figure without its universe is not a figure, and a figure in the wrong register is a figure a sweep will disagree with. The key count itself is asserted by derive-names-433boi.mjs A1, both directions, against the key space.`,
  },
  _what_this_file_does_not_say: 'IT DOES NOT SAY WHICH HUBSPOT PROPERTY FEEDS ANYTHING. A category is a statement about two printed forms. derive-names-433boi.mjs turns (category, subject, fact) into a name, and that file is the only place a name exists.',
  _granularity_is_declared_per_entry: 'EVERY ENTRY NAMES EVERY KEY IT COVERS VERBATIM. This form declares NO naming mechanism - no prefix glob, no counterpart substitution - so adapters/hubspot/classification-coverage.mjs carries an empty MECHANISMS row for it and every entry derives `enumerated`. Enumerated is the granularity standard C-21 settled; this is the first form authored under it from the first line.',
  _compared_against_the_backbone: 'DERIVED BY adapters/hubspot/reclassify-against-backbone.mjs AND WRITTEN INTO EACH ENTRY BY ITS --emit. `against` above records the predecessor this file was authored from; `compared_against` records the forms whose artefacts actually carry the facts each entry\'s keys bind. There are three predecessors now, so a narrower comparison is declared rather than implied.',
};

const xw = {
  meta: {
    form: '433boi',
    form_revision: MAP.form_revision,
    catalog: MAP.catalog,
    map: 'adapters/pdf/maps/433boi.map.json',
    classification: 'adapters/pdf/maps/433boi.crosswalk-classification.json',
    backbone: 'adapters/hubspot/fields.433a.json + fields.433f.json + fields.433aoi.json, read as one backbone by reclassify-against-backbone.mjs',
    pdf: 'adapters/pdf/forms/f433boi.pdf',
    what_this_is: 'THE KEY-TO-ENTRY BINDING, AND NOTHING ELSE IS BOUND HERE. One row per input key the 433-B(OIC) fill engine can consume, saying which classification entry covers it and which FACT it names. It does NOT carry the HubSpot property name: that is DERIVED by derive-names-433boi.mjs from the entry CATEGORY and the classification\'s subject ruling, so a category and a name can never disagree.',
    the_naming_rule: 'exact -> irs433_<fact>, shared. new and same-question-different-subject -> irs433boi_<fact>, form-specific. The middle four - superset, different-arithmetic-same-name, different-shape, same-fact-different-decomposition - MUST declare scope and scope_reason per row and the deriver STOPs on a row that does not. asymmetric-the-other-way binds no key. On this form `exact` is used zero times and every row is form-specific; the classification\'s `subject` block is the ruling that makes that so, and A4 in the deriver asserts it.',
    the_governing_question: 'Not "is this the same fact" but "WOULD ONE PROPERTY SERVING BOTH FORMS EVER HAVE TO HOLD TWO DIFFERENT VALUES FOR ONE TAXPAYER AT ONE MOMENT." Every scope_reason below answers it in those terms and says YES, because the two forms are filed by two different legal persons.',
    fact_naming: 'The input key with this form\'s section and line prefix stripped (s1_business_name -> business_name, s3_6_gross_receipts -> the predecessor\'s spelling bizinc_gross_receipts). WHERE THE PREDECESSOR HOLDS THE SAME QUESTION, THE FACT KEEPS THE PREDECESSOR\'S SPELLING ON PURPOSE, so that irs433boi_bizinc_rent and irs433_bizexp_rent read as the pair they are and the twin table in the derivation report lists every one of them. A fact spelled differently to dodge the twin check would hide exactly what that check exists to show.',
    types_are_stated_not_inferred: 'Money is NOT typed here and NOT inferred from a key name. The generator reads the map\'s own `rounding` blocks, which are the form\'s declaration of which cells are money quoted from the printed instructions, and types those number/number. Everything else is typed from the map construct - group, check_here, checkbox, named-option set - or stated.',
    generated_by: 'scratchpad/author-433boi-crosswalk.mjs, which emits this file and the classification from one table. A key listed in an entry\'s prose and a key bound to that entry are the same claim, and a claim written twice in two files is a parallel list.',
    counts: {
      total_input_keys: bindings.length,
      form_specific: bindings.length,
      shared: 0,
      to_provision: bindings.length,
      with_scope_ruling: bindings.filter((b) => b.scope).length,
      by_type: bindings.reduce((a, b) => ((a[`${b.type}/${b.fieldType}`] = (a[`${b.type}/${b.fieldType}`] || 0) + 1), a), {}),
    },
  },
  bindings,
};

writeFileSync('adapters/pdf/maps/433boi.crosswalk-classification.json', JSON.stringify(cls, null, 1) + '\n');
writeFileSync('adapters/hubspot/crosswalk.433boi.json', JSON.stringify(xw, null, 1) + '\n');
console.log(`wrote the classification: ${E.length} entries, ${bindings.length} bound key(s)`);
console.log('  by category: ' + Object.entries(tally).filter(([k]) => k !== 'entries').map(([k, v]) => `${k} ${v}`).join(', '));
console.log(`  rows carrying a scope ruling: ${bindings.filter((b) => b.scope).length}`);
console.log('wrote adapters/hubspot/crosswalk.433boi.json');
