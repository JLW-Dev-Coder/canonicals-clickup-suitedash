// AUTHORS adapters/pdf/maps/433b.crosswalk-classification.json.
//
// Every entry below is a RULING, made one at a time against the question [R-06] settles and
// prompt-50 ruling 2 restates: WOULD ONE PROPERTY SERVING BOTH FORMS EVER HAVE TO HOLD TWO
// DIFFERENT VALUES FOR ONE TAXPAYER AT ONE MOMENT? The subject axis says 433-B COINCIDES with
// 433-B(OIC) (adapters/pdf/maps/_subjects.cross-form.json), so unlike every form before it
// reuse is LICENSED here — and licensed is not the same as automatic. Nine keys take an
// existing name; the other 107 do not, and each one says why in its own `why`.
//
// The `oic` field names every key the entry covers, VERBATIM, so
// adapters/hubspot/classification-coverage.mjs derives `enumerated` for all of them. The field
// keeps the name it has on the other two classification files even though "oic" is a poor word
// for the predecessor here — renaming it would be a change to what coverageOf() reads.
//
// _tally is DERIVED from entries[] at the bottom of this file, never typed ([R-07]).

import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'adapters/pdf/maps/433b.crosswalk-classification.json';

// ── the rulings ──────────────────────────────────────────────────────────────────────────
const E = [
{
 id: 'Z-01', page: 1, category: 'same-fact-different-decomposition',
 oic: 's1_business_street_address, s1_mailing_address, s1_city, s1_state, s1_zip',
 boi: '433-B(OIC) s1_business_physical_address and s1_business_mailing_address — two composite cells, each holding a whole address.',
 why: 'ONE ADDRESS BLOCK, FIVE CELLS HERE AND TWO THERE. 433-B draws printed marker 1b over five cells — "Business Street Address" (y 629.5), "Mailing Address" (y 608.1), then "City" / "State" / "ZIP" on one row at y 597.3 — and 433-B(OIC) draws two cells whose own printed qualifiers say they are composite: "Business physical address (street, city, state, ZIP code)" and "Business mailing address (if different from above or post office box number)".',
 scope: 'form-specific',
 scope_reason: 'THE OBVIOUS REUSE IS THE WRONG ONE AND THIS ENTRY EXISTS TO SAY SO. `s1_mailing_address` and `irs433boi_business_mailing_address` share a caption almost word for word, and binding them would put a bare street line into a property that on 433-B(OIC) holds street, city, state and ZIP together. The printed page settles it: 433-B\'s City/State/ZIP row is drawn BELOW "Mailing Address" and inside the same printed marker 1b, so those three cells complete an address on this form and have no counterpart cell on the other. A property cannot be half an address on one form and a whole one on the other.',
 compared_against: ['433boi'],
},
{
 id: 'Z-02', page: 1, category: 'exact',
 oic: 's1_business_name, s1_ein',
 boi: '433-B(OIC) s1_business_name -> irs433boi_business_name; s1_ein -> irs433boi_employer_identification_number.',
 why: 'Both forms print the same question about the same legal person in one text cell. 433-B prints "Business Name" (page 1, y 651.1) and "Employer Identification No. (EIN)" (y 651.3); 433-B(OIC) prints "Business name" and "Employer Identification Number".',
 scope: 'reuse',
 reuse_of: ['irs433boi_business_name', 'irs433boi_employer_identification_number'],
 scope_reason: 'THE RULING-2 QUESTION ANSWERS NO. A business filing both forms has one legal name and one EIN, and they are the same on both documents at the same moment — an EIN is issued once and does not vary by which form asks for it. This is the first `exact` in the series and it is a consequence of the subject axis: [R-06] rules that `irs433boi_` records WHICH FORM CREATED A NAME, not which form owns it, so binding the existing property prefix and all is the rule applying rather than an exception to it.',
 compared_against: ['433boi'],
},
{
 id: 'Z-03', page: 1, category: 'exact',
 oic: 's1_county',
 boi: '433-B(OIC) s1_county_of_business_location -> irs433boi_county_of_business_location.',
 why: '433-B prints "County" at printed marker 1c (page 1, y 586.5), its own marker and its own cell, immediately below the 1b address block. 433-B(OIC) prints "County of business location".',
 scope: 'reuse',
 reuse_of: ['irs433boi_county_of_business_location'],
 scope_reason: 'ONE VALUE AT ONE MOMENT. The business sits in one county and both forms ask which. 433-B\'s bare word "County" is disambiguated by where it is drawn — its own printed marker, directly under the business address block — so it is the county of the business location, which is what 433-B(OIC) spells out. NOT folded into Z-01: this cell carries a marker of its own (1c) and has a one-to-one counterpart cell on the other form, which is exactly what the five cells in Z-01 lack.',
 compared_against: ['433boi'],
},
{
 id: 'Z-04', page: 1, category: 'same-fact-different-decomposition',
 oic: 's1_business_telephone_area_code, s1_business_telephone_number',
 boi: '433-B(OIC) s1_business_primary_phone -> irs433boi_business_primary_phone, one cell.',
 why: '433-B draws the business telephone as TWO widgets under one caption, "Business Telephone", separated by the printed "(" and ")" the map records as its P3/P7 pairing rule. 433-B(OIC) draws "Primary phone" as one cell.',
 scope: 'form-specific',
 scope_reason: 'Two cells cannot both bind one property, and neither of them alone holds the fact the other form\'s property holds. Writing the seven-digit half into `irs433boi_business_primary_phone` would drop the area code from a number a revenue officer is expected to dial.',
 compared_against: ['433boi'],
},
{
 id: 'Z-05', page: 1, category: 'different-shape',
 oic: 's1_type_of_business',
 boi: '433-B(OIC) s1_description_of_business_and_dba -> irs433boi_description_of_business_and_dba.',
 why: '433-B prints "Type of Business" (page 1, y 564.7). 433-B(OIC) prints "Description of business and DBA or \\"Trade Name\\"" — the same cell is asked to carry the trade name as well.',
 scope: 'form-specific',
 scope_reason: 'The 433-B(OIC) cell holds two facts, one of which 433-B never asks for. A "yes" to reuse would mean a 433-B record either loses the DBA a 433-B(OIC) record carries, or invents one; and a preparer reading `irs433boi_description_of_business_and_dba` back onto 433-B would print a trade name into a cell captioned "Type of Business".',
 compared_against: ['433boi'],
},
{
 id: 'Z-06', page: 1, category: 'exact',
 oic: 's1_business_website',
 boi: '433-B(OIC) s1_business_website_address -> irs433boi_business_website_address.',
 why: '433-B prints "Business Website (web address)" — drawn as two runs, "Business" at x 57.6..90.0 and "Website (web address)" at x 92.3, both at y 543.1, read off the page rather than off the map, because the map records only the first run as the pairing witness. 433-B(OIC) prints "Business website address".',
 scope: 'reuse',
 reuse_of: ['irs433boi_business_website_address'],
 scope_reason: 'One business, one web address, same at one moment on both documents. The second printed run was verified on the drawn page precisely because the first run alone ("Business") would not have settled which fact this cell holds — and a reuse decided on a truncated caption is the shape [R-08] refuses.',
 compared_against: ['433boi'],
},
{
 id: 'Z-07', page: 1, category: 'new',
 oic: 's1_type_of_entity, s1_entity_other_description, s1_llc_number_of_members',
 boi: 'Nothing. 433-B(OIC) prints no entity-type question at all.',
 why: '433-B prints printed marker 2b, "Type of entity (Check appropriate box below)", over five boxes: Partnership, Corporation, Other, Limited Liability Company (LLC) classified as a corporation, and Other LLC - Include number of members; with a free-text cell for "Other" and a count cell for the LLC members.',
 scope: 'form-specific',
 scope_reason: 'NOT A NAMING DECISION AT ALL — there is no counterpart to collide with. 433-B(OIC) does not ask which kind of entity the filer is because its printed eligibility instructions have already restricted it to four kinds; 433-B is filed by any business under collection and must ask. A fact one form never prints cannot take a property the other form created.',
 compared_against: ['433boi'],
},
{
 id: 'Z-08', page: 1, category: 'new',
 oic: 's1_date_incorporated_or_established',
 boi: 'Nothing.',
 why: '433-B prints printed marker 2c, "Date Incorporated/Established", with the format qualifier "mmddyyyy" drawn at y 586.9. 433-B(OIC) prints no such cell.',
 scope: 'form-specific',
 scope_reason: 'No counterpart exists.',
 compared_against: ['433boi'],
},
{
 id: 'Z-09', page: 1, category: 'exact',
 oic: 's1_number_of_employees',
 boi: '433-B(OIC) s1_total_number_of_employees -> irs433boi_total_number_of_employees.',
 why: '433-B prints "Number of Employees" (page 1, y 574.7); 433-B(OIC) prints "Total number of employees". Both are a headcount of the same business in one numeric cell.',
 scope: 'reuse',
 reuse_of: ['irs433boi_total_number_of_employees'],
 scope_reason: 'The word "Total" on the other form distinguishes nothing here — 433-B prints no partial employee count anywhere on the form for it to be a total OF, so the two cells hold the same number for one business at one moment.',
 compared_against: ['433boi'],
},
{
 id: 'Z-10', page: 1, category: 'different-arithmetic-same-name',
 oic: 's1_monthly_gross_payroll',
 boi: '433-B(OIC) s1_average_gross_monthly_payroll -> irs433boi_average_gross_monthly_payroll.',
 why: '433-B prints "Monthly Gross Payroll" (page 1, y 563.9). 433-B(OIC) prints "Average gross monthly payroll". One word separates them and it names a computation.',
 scope: 'form-specific',
 scope_reason: 'AN AVERAGE OVER A PERIOD AND A MONTH\'S FIGURE ARE TWO NUMBERS, and for a business with seasonal or commission payroll they are far apart. This is the category whose own definition warns that the names invite reuse and the resulting figure is wrong on a document signed under penalty of perjury while every printed total still reconciles — a payroll figure feeds no total on either form, so nothing downstream would have disagreed.',
 compared_against: ['433boi'],
},
{
 id: 'Z-11', page: 1, category: 'exact',
 oic: 's1_frequency_of_tax_deposits',
 boi: '433-B(OIC) s1_frequency_of_tax_deposits -> irs433boi_frequency_of_tax_deposits.',
 why: 'Both forms print "Frequency of Tax Deposits" — 433-B at page 1, y 553.1; 433-B(OIC) as "Frequency of tax deposits" — into one free-text cell.',
 scope: 'reuse',
 reuse_of: ['irs433boi_frequency_of_tax_deposits'],
 scope_reason: 'The same question in the same words about the same business, and a deposit schedule is a standing fact rather than a period figure, so the two documents state it identically at one moment.',
 compared_against: ['433boi'],
},
{
 id: 'Z-12', page: 1, category: 'new',
 oic: 's1_eftps_enrolled',
 boi: 'Nothing.',
 why: '433-B prints question 3d, drawn as two runs — "Is the business enrolled in Electronic" (y 541.5) and "Federal Tax Payment System (EFTPS)" (y 531.5) — with Yes and No boxes. 433-B(OIC) prints no EFTPS question.',
 scope: 'form-specific',
 scope_reason: 'No counterpart exists.',
 compared_against: ['433boi'],
},
{
 id: 'Z-13', page: 1, category: 'same-question-different-subject',
 oic: 's1_engages_in_ecommerce, groups.payment_processors, groups.credit_cards_accepted',
 boi: 'Nothing on 433-B(OIC), which prints neither the e-Commerce question nor either table. BUT 433-A PRINTS ALL THREE: irs433_engages_in_ecommerce (433-A line 61), irs433_payment_processors and irs433_credit_cards_accepted.',
 why: '433-B prints line 4, "Does the business engage in e-Commerce (Internet sales) — If yes, complete 5a and 5b.", and then two tables: payment processors (name and address, account number; 2 rows) and credit cards accepted (type of credit card, merchant account number, issuing bank name and address, issuing bank phone; 3 rows). 433-A asks the same three things at its line 61 and the two tables beside it.',
 scope: 'form-specific',
 subject_reason: '433-A line 61 sits in that form\'s SELF-EMPLOYMENT section and asks whether THE INDIVIDUAL TAXPAYER\'S sole proprietorship takes internet sales; 433-B asks whether A SEPARATE LEGAL ENTITY does. The subject register records 433b / 433a as MUTUALLY EXCLUSIVE, and a sole proprietorship IS the individual for tax purposes while a corporation, partnership or multi-member LLC is not. A filer who runs a Schedule C business AND owns a corporation files both forms and answers differently on each — the proprietorship sells online and the corporation does not, or the reverse — so one property would have to hold two values at one moment.',
 scope_reason: 'A COUNTERPART EXISTS AND IT BELONGS TO A DIFFERENT LEGAL PERSON, which is why this is not `new`. Both tables also get their own property because a group is written as one serialized textarea and 433-A\'s row shapes describe an individual\'s arrangements.',
 compared_against: ['433boi', '433a'],
 _this_entry_was_RE_RULED: 'IT SAID `new` AND "No counterpart exists on the other form", AND THE SECOND HALF WAS TRUE OF THE WRONG UNIVERSE. 433-B(OIC) prints none of this, which is what the entry checked; 433-A prints all three, which it did not. Caught by adapters/hubspot/derive-names-433b.mjs A8 — the twin table — which found irs433_engages_in_ecommerce, irs433_payment_processors and irs433_credit_cards_accepted live on the backbone under a category that adjudicates nothing. Kept here rather than silently corrected ([R-21]): what it got RIGHT is that no property may be reused, and the derived name is unchanged; what it got WRONG is the reason, and a `new` entry states that nobody prints the fact, which was false.',
},
{
 id: 'Z-14', page: 1, category: 'different-shape',
 oic: 'groups.personnel, personnel_7a_responsible_for_payroll_taxes, personnel_7b_responsible_for_payroll_taxes, personnel_7c_responsible_for_payroll_taxes, personnel_7d_responsible_for_payroll_taxes',
 boi: '433-B(OIC) groups.partners -> irs433boi_partners, whose row_shape is last_name, first_name, title, percent_ownership_and_annual_salary, ssn, home_address, primary_phone, secondary_phone, asset_class.',
 why: 'Both forms table the people behind the business, and the rows are not the same row. 433-B carries 4 rows of full_name, title, home_address, city, state, zip, taxpayer_identification_number, home_phone (area code + number), work_cell_phone (area code + number), ownership_percentage, annual_salary_or_draw, and a per-row Yes/No "Responsible for Depositing Payroll Taxes". 433-B(OIC) carries 3 rows that split the name in two, fuse ownership percentage with annual salary into ONE cell, keep the address whole, and carry an asset_class column this form has no use for.',
 scope: 'form-specific',
 scope_reason: 'THE FACTS TRANSFER AND THE CONTAINER DOES NOT, and two of the differences are not cosmetic: 433-B(OIC) fuses ownership percentage and annual salary into one printed cell where 433-B draws two, and 433-B carries a per-row payroll-tax responsibility flag that 433-B(OIC) never asks. A row written under one shape and read under the other loses the flag and cannot separate the fused cell. The four Yes/No flags ride with the table rather than standing alone, because each one is a column of the row it sits in.',
 compared_against: ['433boi'],
},
{
 id: 'Z-15', page: 2, category: 'different-predicate-same-caption',
 oic: 's3_8_uses_payroll_service, s3_8_payroll_service_name_and_address, s3_8_payroll_service_effective_dates',
 boi: '433-B(OIC) s1_payroll_outsourced -> irs433boi_payroll_outsourced and s1_payroll_provider_name_and_address -> irs433boi_payroll_provider_name_and_address.',
 why: '433-B prints question 8, "Does the business use a Payroll Service Provider or Reporting Agent (If yes, answer the following)", with cells for Name and Address and for Effective dates. 433-B(OIC) prints "Does the business outsource its payroll processing and tax return preparation for a fee", with one provider cell and no dates.',
 scope: 'form-specific',
 scope_reason: 'NEITHER QUESTION CONTAINS THE OTHER, which is why this is not a superset in either direction. A business using a Reporting Agent that files its employment tax returns at no separate fee answers YES on 433-B and NO on 433-B(OIC); a business that outsources only its tax return preparation for a fee answers YES on 433-B(OIC) and NO on 433-B. Two answers, one taxpayer, one moment. The provider cell rides with the predicate: if the two questions can select different arrangements, the provider named can be a different provider, so binding the name while splitting the boolean would put one arrangement\'s provider under the other\'s flag.',
 compared_against: ['433boi'],
},
{
 id: 'Z-16', page: 2, category: 'asymmetric-the-other-way',
 oic: 's3_9_party_to_lawsuit, s3_9_plaintiff_or_defendant, s3_9_location_of_filing, s3_9_represented_by, s3_9_docket_or_case_number, s3_9_amount_of_suit, s3_9_possible_completion_date, s3_9_subject_of_suit',
 boi: '433-B(OIC) s6_party_to_litigation, s6_litigation_role, s6_litigation_location_of_filing, s6_litigation_represented_by, s6_litigation_docket_case_number, s6_litigation_amount_in_dispute, s6_litigation_possible_completion_date, s6_litigation_subject.',
 why: '433-B prints question 9, "Is the business a party to a lawsuit (If yes, answer the following)" — present tense. 433-B(OIC) prints "Is the business currently, or in the past, party to litigation". The seven attendant cells correspond almost caption for caption on both forms.',
 scope: 'form-specific',
 scope_reason: 'THE PREDECESSOR\'S WINDOW IS THE WIDER ONE, which is what `asymmetric-the-other-way` records. A business whose only litigation closed three years ago answers NO on 433-B and YES on 433-B(OIC) — two values, one taxpayer, one moment. AND THE SEVEN DETAIL CELLS INHERIT THAT, which is the part a caption-by-caption comparison would miss: each of them describes THE SUIT THE PARENT QUESTION SELECTED, and if the two questions can select different suits then "Docket/Case No." holds a different docket on each form. Binding the details while splitting the boolean is the worse of the two errors, because every caption would still match and the docket would be the wrong one.',
 compared_against: ['433boi'],
},
{
 id: 'Z-17', page: 2, category: 'superset',
 oic: 's3_10_ever_filed_bankruptcy, s3_10_date_filed, s3_10_date_dismissed, s3_10_date_discharged, s3_10_petition_number, s3_10_district_of_filing',
 boi: '433-B(OIC) s6_filed_bankruptcy_past_10_years, s6_bankruptcy_date_filed, s6_bankruptcy_date_dismissed_or_discharged, s6_bankruptcy_petition_no, s6_bankruptcy_location_filed.',
 why: '433-B prints question 10, "Has the business EVER filed bankruptcy". 433-B(OIC) prints "Has the business filed bankruptcy IN THE PAST 10 YEARS". 433-B then draws Date Filed, Date Dismissed, Date Discharged, Petition No. and District of Filing; 433-B(OIC) draws one combined "Date dismissed or discharged" where 433-B draws two.',
 scope: 'form-specific',
 scope_reason: 'DIRECTION MATTERS AND IT RUNS THIS WAY: 433-B\'s window strictly contains 433-B(OIC)\'s. A business that emerged from Chapter 11 twelve years ago answers YES on 433-B and NO on 433-B(OIC). The detail cells inherit the same defect as Z-16 — they describe the bankruptcy the parent question selected — and they carry a second one of their own: 433-B separates dismissal from discharge and 433-B(OIC) fuses them, so `irs433boi_bk_date_dismissed_or_discharged` cannot say which of the two a date is, and two 433-B cells cannot both bind it.',
 compared_against: ['433boi'],
},
{
 id: 'Z-18', page: 2, category: 'exact',
 oic: 's3_11_related_parties_owe',
 boi: '433-B(OIC) s6_related_parties_owe_money -> irs433boi_related_parties_owe_money.',
 why: '433-B prints question 11, "Do any related parties (e.g., officers, partners, employees) have outstanding amounts owed to the business". 433-B(OIC) prints "Do any related parties (e.g., partners, officers, employees) owe money to the business". The two differ in the order of the parenthetical examples and in the verb phrase, and in nothing else — no window, no threshold, no qualifier.',
 scope: 'reuse',
 reuse_of: ['irs433boi_related_parties_owe_money'],
 scope_reason: 'THE RULING-2 QUESTION ANSWERS NO, and the reason it does is that this pair differs only in wording where Z-16 and Z-17 differ in a QUALIFIER. "Have outstanding amounts owed to the business" and "owe money to the business" select the same set of facts about the same business; there is no state of the world in which a taxpayer answers them differently at one moment. Reusing the boolean while giving the six loan-detail cells their own names (Z-19) is not inconsistent: the boolean is the same question, and the detail cells have no counterpart at all to be the same question AS.',
 compared_against: ['433boi'],
},
{
 id: 'Z-19', page: 2, category: 'new',
 oic: 's3_11_name_and_address, s3_11_date_of_loan, s3_11_current_balance, s3_11_current_balance_as_of, s3_11_payment_date, s3_11_payment_amount',
 boi: 'Nothing, AND THE PAGE WAS READ TO SAY SO. On 433-B(OIC) page 5 the drawn region between the related-party question and the next question ("Is the business currently, or in the past, party to litigation") carries exactly one text baseline — the words "Yes" and "No" — and exactly TWO widgets, both of fieldType /Btn — the leaves C5_07[0] and C5_08[0] of that form\'s page-5 section_6 subform, which ARE that Yes/No pair and are the two this repo already binds as s6_related_parties_owe_money in adapters/pdf/maps/433boi.map.json. NO /Tx WIDGET IS DRAWN BETWEEN THE TWO QUESTIONS, so the form asks the question and gives nowhere to answer it in detail. Leaf names rather than full paths, for the reason recorded at `_why_this_file_quotes_NO_COORDINATE_and_what_happened_when_it_did`.',
 why: '433-B follows question 11 with six cells — Name and Address, Date of Loan, Current Balance, Current Balance As of, Payment Date, Payment Amount. 433-B(OIC) prints the question alone. The drawn-page reading is in `boi` above rather than here, because the claim being evidenced is about the OTHER form\'s page.',
 scope: 'form-specific',
 scope_reason: 'No counterpart exists. This is the one place on the form where a reused boolean (Z-18) sits above cells that are new, and that is what the printed pages say: the same question, answered in more detail on this form.',
 compared_against: ['433boi'],
},
{
 id: 'Z-20', page: 2, category: 'superset',
 oic: 's3_12_assets_transferred, s3_12_list_asset, s3_12_value_at_time_of_transfer, s3_12_date_transferred, s3_12_to_whom_or_where_transferred',
 boi: '433-B(OIC) s6_transferred_asset_under_value_past_10_years and s6_asset_transfer_date_value_and_type -> irs433boi_asset_transfer_date_value_and_type.',
 why: '433-B prints question 12, "Have any assets been transferred, in the last 10 years, from this business for less than full value". 433-B(OIC) prints "In the past 10 years, has the business transferred any asset WITH A FAIR MARKET VALUE OF MORE THAN $10,000, including real property, for less than its full value". Same window, and one form carries a dollar threshold the other does not. 433-B then draws four cells — List Asset, Value at Time of Transfer, Date Transferred, To Whom or Where Transferred — where 433-B(OIC) draws one combined cell.',
 scope: 'form-specific',
 scope_reason: 'THE MOST DANGEROUS PAIR ON THIS FORM, because the captions are near-identical, the ten-year window matches exactly, and the difference is a $10,000 threshold buried mid-sentence that no property name could ever carry. A business that gave away a $6,000 vehicle answers YES on 433-B and NO on 433-B(OIC). Had this been ruled on the caption it would have read as `exact`. The four detail cells also fail on decomposition — four cells cannot bind one combined property — so they would have been caught by the second test even if the first had been missed, which is the only reason this entry is not the one that got through.',
 compared_against: ['433boi'],
},
{
 id: 'Z-21', page: 2, category: 'exact',
 oic: 's3_13_other_business_affiliations',
 boi: '433-B(OIC) s6_other_business_affiliations -> irs433boi_other_business_affiliations.',
 why: 'BOTH FORMS PRINT THE SAME SENTENCE, parenthetical included: "Does this business have other business affiliations (e.g., subsidiary or parent companies)". 433-B draws it at question 13, y 450.4; 433-B(OIC) at y 292.9 with the parenthetical as a second run at x 217.0.',
 scope: 'reuse',
 reuse_of: ['irs433boi_other_business_affiliations'],
 scope_reason: 'No window, no threshold, no qualifier — the same words, the same subject, one boolean. There is no state of the world in which the two answers differ at one moment.',
 compared_against: ['433boi'],
},
{
 id: 'Z-22', page: 2, category: 'same-fact-different-decomposition',
 oic: 's3_13_related_business_name_and_address, s3_13_related_business_ein',
 boi: '433-B(OIC) s6_affiliations_name_and_ein -> irs433boi_affiliations_name_and_ein, one cell.',
 why: '433-B draws "Related Business Name and Address" and "Related Business EIN:" as two cells; 433-B(OIC) draws one cell holding name and EIN together.',
 scope: 'form-specific',
 scope_reason: 'Two cells cannot bind one property, and the split is not the same split: 433-B\'s first cell carries an ADDRESS the combined cell never asked for. This entry sits directly under a reused boolean (Z-21) and that is the point — the same question can be answered into different containers, and the container is what a property has to match.',
 compared_against: ['433boi'],
},
{
 id: 'Z-23', page: 2, category: 'same-question-different-subject',
 oic: 's3_14_income_change_anticipated, s3_14_explain, s3_14_how_much_increase_decrease, s3_14_when_increase_decrease',
 boi: 'Nothing.',
 why: '433-B prints question 14, "Any increase/decrease in income anticipated", with cells for Explain, How much will it increase/decrease, and When will it increase/decrease. 433-B(OIC) prints no forward-looking income question. 433-A PRINTS THE SAME THREE DETAIL CELLS at its line 6 — irs433_income_change_explain, irs433_income_change_amount and irs433_income_change_when — and no separate boolean, the question being carried by the line itself.',
 scope: 'form-specific',
 subject_reason: '433-A line 6 asks whether THE INDIVIDUAL TAXPAYER\'S income will change; 433-B question 14 asks whether A SEPARATE LEGAL ENTITY\'S will. The subject register records 433b / 433a as MUTUALLY EXCLUSIVE. A taxpayer whose salary is about to rise while the corporation they own is about to lose a contract answers "increase" on one form and "decrease" on the other, on the same day — two values, one taxpayer, one moment. The boolean has no 433-A counterpart at all and rides with the three cells it governs, because a flag separated from the cells it gates is a flag about nothing.',
 scope_reason: 'A COUNTERPART EXISTS ON 433-A AND IT BELONGS TO A DIFFERENT LEGAL PERSON. THE FACT SPELLINGS ARE DELIBERATELY THE PREDECESSOR\'S — income_change_amount, income_change_when, income_change_explain — so that the pair shows up in the twin table rather than hiding behind a name chosen to dodge the check.',
 compared_against: ['433boi', '433a'],
 _this_entry_was_RE_RULED: 'IT SAID `new` AND "No counterpart exists." That was checked against 433-B(OIC), where it holds. It was not checked against 433-A, which prints the same three detail cells at its line 6. Caught by derive-names-433b.mjs A8. Kept under [R-21]: the derived name is unchanged and no property may be reused either way — what changed is that the entry now states the true reason instead of a false one.',
},
{
 id: 'Z-24', page: 2, category: 'exact',
 oic: 's3_15_federal_government_contractor',
 boi: '433-B(OIC) s1_federal_contractor -> irs433boi_federal_contractor.',
 why: '433-B prints question 15, "Is the business a Federal Government Contractor", with the instruction "(Include Federal Government contracts in #18, Accounts/Notes Receivable)". 433-B(OIC) prints the caption "Federal contractor" over a Yes/No pair.',
 scope: 'reuse',
 reuse_of: ['irs433boi_federal_contractor'],
 scope_reason: 'THE PARENTHETICAL IS AN INSTRUCTION, NOT A QUALIFIER — it tells the filer where to list the contracts, and changes nothing about who answers yes. Being a Federal Government Contractor is a standing fact about one business and both forms ask it as one boolean. This is the one reuse on the form whose two captions are not near-identical, and it is ruled on what the sentences ASK rather than on how alike they read, which is the same reasoning that refused Z-20 where the captions were nearly identical and the questions were not.',
 compared_against: ['433boi'],
},
{
 id: 'Z-25', page: 2, category: 'same-question-different-subject',
 oic: 's4_16a_total_cash_on_hand',
 boi: 'Nothing on 433-B(OIC). BUT 433-A PRINTS IT TWICE: irs433_total_cash_on_hand (433-A line 12, the individual\'s) and irs433_business_cash_on_hand (433-A line 64, the individual\'s sole proprietorship\'s).',
 why: '433-B prints "CASH ON HAND — Include cash that is not in the bank — Total Cash on Hand" at printed marker 16a. `s4_16a_total_cash_on_hand` is declared not_checkable in adapters/pdf/maps/433b.totals.json — the word "Total" there means "the whole of it", not the sum of lines above — so it is a scalar money cell rather than a total, and nothing about its arithmetic bears on this ruling.',
 scope: 'form-specific',
 subject_reason: 'THE PREDECESSOR ITSELF ALREADY SPLIT THIS FACT BY SUBJECT, which is the clearest possible evidence for the ruling. 433-A draws cash on hand at line 12 for THE INDIVIDUAL and again at line 64 for THAT INDIVIDUAL\'S BUSINESS, under two property names, because one filer holds two different amounts at one moment. 433-B\'s cell is a THIRD subject — a separate legal entity that is not the filer — and the subject register records 433b / 433a as MUTUALLY EXCLUSIVE. A form that split the fact in two rather than share one property is not a form whose either half a third subject may take.',
 scope_reason: 'A COUNTERPART EXISTS ON 433-A, in two flavours, and neither is this form\'s subject.',
 compared_against: ['433boi', '433a'],
 _this_entry_was_RE_RULED_AND_SPLIT: 'IT SAID `new`, "No counterpart exists", AND IT COVERED THREE KEYS. Both halves were wrong in different ways. 433-A prints cash on hand (twice), so `new` was false for this key; and the two SAFE cells beside it, which the entry had swept in with it, are a genuinely different fact and now carry their own entry, Z-51. Bundling them had made one ruling do for two relations to the predecessor — the shape [R-08]\'s "per occurrence, never per name" forbids, one artefact up from leaf names. Caught by derive-names-433b.mjs A8.',
},
{
 id: 'Z-51', page: 2, category: 'new',
 oic: 's4_16b_safe_on_premises, s4_16b_safe_contents',
 boi: 'Nothing on 433-B(OIC), and NOTHING ON 433-A EITHER — checked, because the entry this one was split out of got that wrong for its neighbour.',
 why: '433-B prints at marker 16b "Is there a safe on the business premises" with a Contents cell.',
 scope: 'form-specific',
 scope_reason: 'A SAFE ON THE BUSINESS PREMISES IS NOT A SAFE DEPOSIT BOX, and that distinction is the whole of this entry. 433-A prints irs433_safe_deposit_box at its line 10 — a box held AT A BANK, by the individual — and the nearest-name check would have paired the two. A safe standing in a company\'s office and a box in a bank vault are different objects in different places under different control, and the fact 433-B asks for is the contents of the first. No counterpart exists, and unlike its former entry-mate this claim was verified against 433-A rather than assumed.',
 compared_against: ['433boi', '433a'],
},
{
 id: 'Z-26', page: 2, category: 'different-shape',
 oic: 'groups.business_bank_accounts, s4_17_account_balance_as_of',
 boi: '433-B(OIC) groups.bank_accounts -> irs433boi_bank_accounts, row_shape institution_name_and_address, account_number, account_balance, type_of_account, asset_class.',
 why: '433-B tables 3 rows of type_of_account, bank_name_and_address, account_number, account_balance, with a single "As of" date cell governing the block. 433-B(OIC) carries the same four facts plus an `asset_class` column and no block-level as-of date.',
 scope: 'form-specific',
 scope_reason: 'THE `asset_class` COLUMN IS NOT COSMETIC — it is how the 433-B(OIC) record tells its own row kinds apart, and a 433-B row written without it is a row that form\'s reader cannot classify. The as-of date has no counterpart at all. A shared property would have to hold rows of two shapes and nothing in the serialization says which shape a given row is.',
 compared_against: ['433boi'],
},
{
 id: 'Z-27', page: 2, category: 'different-arithmetic-same-name',
 oic: 's4_17d_total_cash_in_banks',
 boi: '433-B(OIC) s2_1_total_bank_accounts -> irs433boi_total_bank_accounts, itself classified different-arithmetic-same-name against 433-A(OIC) at Y-08.',
 why: '433-B prints "Total Cash in Banks (Add lines 17a through 17c and amounts from any attachments)" and draws NO attachment cell — the missing fourth term is carried as [B-05]. 433-B(OIC) prints "(1) Total bank accounts" over 1a, 1b, 1c AND a drawn 1d "bank accounts from attachment" cell.',
 scope: 'form-specific',
 scope_reason: 'THE OPERAND LISTS DIFFER BY A TERM THE PAGE DRAWS ON ONE FORM AND NOT THE OTHER. 433-B(OIC)\'s total includes an attachment figure a filer types in; 433-B\'s names attachments in its caption and gives nowhere to state them. A figure carried across is a total over a different set of addends, and both pages still reconcile internally, which is what makes this category the dangerous one.',
 compared_against: ['433boi'],
},
{
 id: 'Z-28', page: 3, category: 'same-question-different-subject',
 oic: 'groups.accounts_notes_receivable, s4_18f_outstanding_balance',
 boi: '433-B(OIC) prints only two Yes/No questions, s2_accounts_receivable and s2_notes_receivable, and no table and no total. 433-A PRINTS BOTH: irs433_accounts_notes_receivable (a table) and irs433_total_receivable_amount_due (433-A line 66f).',
 why: '433-B tables 5 rows of name_and_address, contact_name, phone, status, date_due, invoice_or_contract_number, amount_due, and totals them at "Outstanding Balance (Add lines 18a through 18e and amounts from any attachments)". 433-A tables the same thing in its self-employment section and totals it at 66f.',
 scope: 'form-specific',
 subject_reason: '433-A\'s receivable table and its 66f total belong to THE INDIVIDUAL TAXPAYER\'S sole proprietorship, which for tax purposes is the individual; 433-B\'s belong to A SEPARATE LEGAL ENTITY. The subject register records 433b / 433a as MUTUALLY EXCLUSIVE. A filer who runs a Schedule C practice and also owns a corporation has two sets of debtors owing two sets of amounts at one moment, and one table property could hold only one of them.',
 scope_reason: 'A COUNTERPART EXISTS ON 433-A AND IT BELONGS TO A DIFFERENT LEGAL PERSON. The observation the earlier ruling made about 433-B(OIC) still stands beside it: a boolean and a table are not the same fact, so that form contributes no candidate either.',
 compared_against: ['433boi', '433a'],
 _this_entry_was_RE_RULED: 'IT SAID `new` AND "Neither the table nor the total has a counterpart property to collide with." The first clause was right about 433-B(OIC) and wrong about 433-A, which has both. Caught by derive-names-433b.mjs A8. Kept under [R-21]: what it got right — that 433-B(OIC)\'s two booleans are not this table — is preserved in the scope_reason above.',
},
{
 id: 'Z-29', page: 3, category: 'different-shape',
 oic: 'groups.investments',
 boi: '433-B(OIC) groups.investment_accounts -> irs433boi_investment_accounts, row_shape type_of_investment_other, institution_name_and_address, account_number, current_value, loan_balance, equity, type_of_investment, asset_class.',
 why: '433-B tables 2 rows of name_of_company_and_address, phone, current_value, loan_balance, equity_value_minus_loan. 433-B(OIC) carries a typed investment kind (an enumeration plus its "other" free-text), an account number and an asset_class, and no phone.',
 scope: 'form-specific',
 scope_reason: 'The 433-B(OIC) row is typed and this one is not: `type_of_investment` is an enumeration whose values that form\'s engine resolves, and a 433-B row has no value to put there. Writing rows of this shape into that property would leave the enumerated column empty on every row, which is a record that form cannot read back.',
 compared_against: ['433boi'],
},
{
 id: 'Z-30', page: 3, category: 'different-arithmetic-same-name',
 oic: 's4_19c_total_investments',
 boi: '433-B(OIC) s2_2_total_investment_accounts -> irs433boi_total_investment_accounts.',
 why: '433-B prints "Total Investments (Add lines 19a, 19b, and amounts from any attachments)" over two printed rows and draws no attachment cell. 433-B(OIC) totals its two rows plus a drawn 2d attachment cell.',
 scope: 'form-specific',
 scope_reason: 'Same defect as Z-27: one form draws the attachment addend and the other names it without drawing it, so the two totals sum different sets. The subform this total lives in is named `Line19c` on the page that marks the row 19b, which is registered at [B-03] and is exactly why the binding was made from the printed marker rather than the leaf name ([R-08]).',
 compared_against: ['433boi'],
},
{
 id: 'Z-31', page: 3, category: 'different-shape',
 oic: 'groups.digital_assets, s4_20a_individuals_with_private_key_access, s4_20_current_value_as_of',
 boi: '433-B(OIC) groups.digital_assets -> irs433boi_digital_assets, row_shape description_of_digital_asset, number_of_units, location_of_digital_asset, account_number_custodian_or_broker, self_hosted_wallet_address, usd_equivalent_today, equity, row_type, asset_class.',
 why: 'THE ONE PLACE ON THE FORM WHERE THE GROUP KEY IS SPELLED IDENTICALLY ON BOTH FORMS, and the rows are the least alike of any pair here. 433-B carries asset_description, location_of_asset, account_number, current_value_usd, loan_balance, equity_value_minus_loan over 2 rows, with a separate cell for the individuals holding private keys and a block-level as-of date. 433-B(OIC) carries a units count, a self-hosted wallet address, a row_type discriminator and an asset_class, and no loan balance and no private-key cell.',
 scope: 'form-specific',
 scope_reason: 'AN IDENTICAL KEY NAME IS EVIDENCE OF NOTHING — the same finding as [R-08] one artefact along, and this is where a key-name-driven derivation would have produced its collision. 433-B(OIC) carries `number_of_units`, which [R-09] singles out as the cell a blanket money rule corrupts silently because a holding of 1.2345 units rounded to 1 is a false statement about property; 433-B has no units column at all, so a shared property would carry rows that are silent about the quantity held.',
 compared_against: ['433boi'],
},
{
 id: 'Z-32', page: 3, category: 'new',
 oic: 's4_20e_total_equity_of_digital_assets',
 boi: 'Nothing. 433-B(OIC) tables digital assets and prints no total line for them.',
 why: '433-B prints "Total Equity of Digital Assets (Add lines 20b, 20c, and amounts from any attachments)". The printed markers on the block run 20a, 20b, 20c, 20e — no 20d is drawn anywhere on the form, transcribed and not corrected.',
 scope: 'form-specific',
 scope_reason: 'No counterpart total exists. This is the only total on pages 5 and 6 whose caption and rectangle point at different columns — the cell spans both the Loan Balance and the Equity columns and its printed "$" sits at the loan column\'s marker — and the map follows the caption\'s own words. That disagreement is carried as [B-06] and is a statement about which column this form sums, not about which form owns the name.',
 compared_against: ['433boi'],
},
{
 id: 'Z-33', page: 3, category: 'same-question-different-subject',
 oic: 'groups.available_credit, s4_21_amount_owed_as_of, s4_21_available_credit_as_of',
 boi: '433-B(OIC) prints a Yes/No s6_lines_of_credit with three scalar cells — limit, amount owed, property securing — and no table. 433-A PRINTS THE TABLE: irs433_available_credit, with irs433_available_credit_as_of at line 16 and irs433_total_available_credit at 16e.',
 why: '433-B tables 2 rows of full_name_and_address, account_number, credit_limit, amount_owed, available_credit, with two block-level as-of dates. 433-A tables the same facts at its line 16 with one as-of date and a total this form does not print.',
 scope: 'form-specific',
 subject_reason: '433-A line 16 is the INDIVIDUAL TAXPAYER\'S available credit — their credit cards and personal lines; 433-B\'s is A SEPARATE LEGAL ENTITY\'S. The subject register records 433b / 433a as MUTUALLY EXCLUSIVE. A taxpayer\'s personal card limit and their corporation\'s revolving facility are different numbers on the same day, and a property holding one cannot hold the other.',
 scope_reason: 'A COUNTERPART EXISTS ON 433-A AND IT BELONGS TO A DIFFERENT LEGAL PERSON. The 433-B(OIC) observation stands beside it and is unchanged: a table and three scalars are different containers, so that form contributes no candidate either — serializing rows into `irs433boi_line_of_credit_limit` would be writing a table into a scalar. The two as-of dates ride with the table because each dates one of its columns.',
 compared_against: ['433boi', '433a'],
 _this_entry_was_RE_RULED: 'IT SAID `new`. 433-A prints the table AND the as-of date, under names this form\'s facts reproduce. Caught by derive-names-433b.mjs A8. Kept under [R-21]: the 433-B(OIC) reasoning it recorded was right and is preserved verbatim in the scope_reason.',
},
{
 id: 'Z-34', page: 4, category: 'different-shape',
 oic: 'groups.real_property',
 boi: '433-B(OIC) groups.real_estate -> irs433boi_real_estate, row_shape location, description, purchase_date, monthly_payment, final_payment_date, lender_name_address, current_fmv, quick_sale_value, current_loan_balance, equity, asset_class.',
 why: '433-B tables 4 rows of description, purchase_date, current_fmv, current_loan_balance, monthly_payment, final_payment_date, equity, location, lender_name_address, lender_phone. 433-B(OIC) carries a `quick_sale_value` column and an `asset_class`, and no lender phone.',
 scope: 'form-specific',
 scope_reason: 'THE `quick_sale_value` COLUMN IS THE WHOLE OFFER-IN-COMPROMISE DIFFERENCE MADE VISIBLE. 433-B(OIC) values assets at quick sale because an offer is measured against what the Service could realise; 433-B states fair market value under collection. A row written from this form into that property would be silent in the column that form\'s arithmetic actually uses.',
 compared_against: ['433boi'],
},
{
 id: 'Z-35', page: 4, category: 'different-arithmetic-same-name',
 oic: 's4_22e_total_equity_real_property',
 boi: '433-B(OIC) s2_3_total_real_estate -> irs433boi_total_real_estate.',
 why: '433-B prints "Total Equity (Add lines 22a through 22d and amounts from any attachments)" over four printed rows. 433-B(OIC) totals two rows plus a drawn 3c attachment cell.',
 scope: 'form-specific',
 scope_reason: 'Four rows against two, and an attachment addend on one side only — and beneath that, the equity being summed is quick-sale equity on 433-B(OIC) and fair-market equity here (Z-34). Two different computations over two different row counts.',
 compared_against: ['433boi'],
},
{
 id: 'Z-36', page: 4, category: 'different-shape',
 oic: 'groups.vehicles',
 boi: '433-B(OIC) groups.vehicles -> irs433boi_vehicles, row_shape make_model, model_year, purchase_date, mileage, license_tag, monthly_payment, lender_name_address, final_payment_date, current_fmv, quick_sale_value, current_loan_balance, quick_sale_equity, lease_or_own, asset_class.',
 why: 'A second identically-spelled group key. 433-B carries model_year, make_model, mileage, license_tag, vin, purchase_date, current_fmv, current_loan_balance, monthly_payment, final_payment_date, equity, lender_name_address, lender_phone. 433-B(OIC) carries quick_sale_value, quick_sale_equity, a lease_or_own discriminator and an asset_class, and NO VIN.',
 scope: 'form-specific',
 scope_reason: 'Same quick-sale separation as Z-34, plus two columns each form has and the other does not: 433-B records the VIN and 433-B(OIC) records whether the vehicle is leased or owned. Neither row can be written into the other property without dropping a column, and the identical key name is again evidence of nothing.',
 compared_against: ['433boi'],
},
{
 id: 'Z-37', page: 4, category: 'different-arithmetic-same-name',
 oic: 's4_23e_total_equity_vehicles',
 boi: '433-B(OIC) s2_4_total_vehicles -> irs433boi_total_vehicles.',
 why: '433-B prints "Total Equity (Add lines 23a through 23d and amounts from any attachments)" over four printed rows; 433-B(OIC) totals three rows plus a drawn 4d attachment cell.',
 scope: 'form-specific',
 scope_reason: 'Different row counts, an attachment addend on one side only, and quick-sale equity against fair-market equity underneath.',
 compared_against: ['433boi'],
},
{
 id: 'Z-38', page: 5, category: 'different-shape',
 oic: 'groups.business_equipment',
 boi: '433-B(OIC) groups.business_equipment -> irs433boi_business_equipment, row_shape description, current_fmv, quick_sale_value, current_loan_balance, equity, asset_class.',
 why: 'A third identically-spelled group key. 433-B carries asset_description, purchase_lease_date, current_fmv, current_loan_balance, monthly_payment, final_payment_date, equity, location_of_asset, lender_name_address, lender_phone over 4 rows; 433-B(OIC) carries six columns over 1 row, quick_sale_value among them.',
 scope: 'form-specific',
 scope_reason: 'Ten columns against six, quick-sale valuation against fair market, and 433-B records where the equipment is and who lent against it. The name collision is the third on this form and the third time it decides nothing.',
 compared_against: ['433boi'],
},
{
 id: 'Z-39', page: 5, category: 'new',
 oic: 'groups.intangible_assets',
 boi: 'Nothing.',
 why: '433-B tables 3 rows of description and equity for intangible assets. 433-B(OIC) prints no intangible-asset block.',
 scope: 'form-specific',
 scope_reason: 'No counterpart exists.',
 compared_against: ['433boi'],
},
{
 id: 'Z-40', page: 5, category: 'different-arithmetic-same-name',
 oic: 's4_24h_total_equity_business_equipment',
 boi: '433-B(OIC) s3_total_all_business_equipment -> irs433boi_total_all_business_equipment.',
 why: 'THIS TOTAL SUMS TWO TABLES. adapters/pdf/maps/433b.totals.json declares 24h with two feeders — business_equipment.equity AND intangible_assets.equity — because the printed block runs 24a to 24g across both. 433-B(OIC)\'s total sums one table plus a drawn 5b attachment cell.',
 scope: 'form-specific',
 scope_reason: 'A TOTAL OVER TWO TABLES AND A TOTAL OVER ONE ARE NOT THE SAME TOTAL, and one of the two tables (Z-39) does not exist on the other form at all. This is the clearest case on the form of a caption that would have invited reuse — "Total Equity" against "Total value of all business equipment" — over an operand set that is not even the same arity.',
 compared_against: ['433boi'],
},
{
 id: 'Z-41', page: 5, category: 'new',
 oic: 'groups.business_liabilities, business_liabilities_25a_secured_or_unsecured, business_liabilities_25b_secured_or_unsecured, s4_25c_total_payments',
 boi: 'Nothing.',
 why: '433-B tables 2 rows of description, date_pledged, balance_owed, final_payment_date, payment_amount, name, street_address, city_state_zip, phone, each with a printed Secured/Unsecured pair, and totals the payment column at "Total Payments". 433-B(OIC) prints no business-liability block.',
 scope: 'form-specific',
 scope_reason: 'No counterpart exists. The two Secured/Unsecured selectors ride with the table because each is a column of the row it sits in, and the total rides with them because it sums that table\'s payment column and nothing else.',
 compared_against: ['433boi'],
},
{
 id: 'Z-42', page: 5, category: 'same-question-different-subject',
 oic: 's5_accounting_method',
 boi: 'Nothing on 433-B(OIC), which prints no accounting method anywhere. 433-A PRINTS IT: irs433_accounting_method at its Section 7, as an enumeration.',
 why: '433-B prints "Accounting Method Used:" with Cash and Accrual boxes at the head of Section 5.',
 scope: 'form-specific',
 subject_reason: '433-A\'s accounting method governs the income and expense figures of THE INDIVIDUAL TAXPAYER\'S sole proprietorship; 433-B\'s governs A SEPARATE LEGAL ENTITY\'S books. The subject register records 433b / 433a as MUTUALLY EXCLUSIVE. A filer may keep a cash-basis Schedule C and own an accrual-basis corporation — the two are commonly on different bases, since an entity past the gross-receipts test is required to accrue — so one property would hold two answers at one moment, and it is exactly the cell whose value changes what every figure beneath it MEANS.',
 scope_reason: 'A COUNTERPART EXISTS ON 433-A AND IT BELONGS TO A DIFFERENT LEGAL PERSON — AND THIS CELL IS ALSO WHY Z-44 AND Z-47 ARE NOT REUSES against 433-B(OIC). It is the declaration that every income and expense figure on this form is stated on a basis 433-B(OIC) never names.',
 compared_against: ['433boi', '433a'],
 _this_entry_was_RE_RULED: 'IT SAID `new` AND "No counterpart exists". 433-A prints the same enumeration. Caught by derive-names-433b.mjs A8. Kept under [R-21]: the clause that mattered downstream — that this cell is why the income and expense lines cannot be reused — was right and is preserved.',
},
{
 id: 'Z-43', page: 5, category: 'different-shape',
 oic: 's5_period_from, s5_period_to',
 boi: '433-B(OIC) s3_income_period_beginning, s3_income_period_through, s4_expense_period_beginning, s4_expense_period_through — FOUR cells declaring TWO periods.',
 why: '433-B declares ONE period over both income and expenses, drawn as "(mmddyyyy)" and "to (mmddyyyy)" at the head of Section 5. 433-B(OIC) declares its income period and its expense period separately, in two pairs of cells.',
 scope: 'form-specific',
 scope_reason: 'ONE PERIOD AGAINST TWO IS A SHAPE DIFFERENCE THAT CHANGES WHAT A VALUE MEANS. Binding `s5_period_from` to `irs433boi_income_period_beginning` would leave a 433-B record silent about the expense period, and reading it back would assert that this form declared the two separately when it declared them once.',
 compared_against: ['433boi'],
},
{
 id: 'Z-44', page: 5, category: 'different-arithmetic-same-name',
 oic: 's5_26_gross_receipts, s5_27_gross_rental_income, s5_28_interest_income, s5_29_dividends, s5_30_cash_receipts',
 boi: '433-B(OIC) s3_6_gross_receipts, s3_7_gross_rental_income, s3_8_interest_income, s3_9_dividends, s3_10_other_income -> irs433boi_bizinc_gross_receipts, _bizinc_gross_rental_income, _bizinc_interest, _bizinc_dividends, _bizinc_other_income.',
 why: 'Four of the five captions correspond word for word, and 433-B\'s column header reads "Gross Monthly" over a period the form declares once (Z-43) on an accounting basis the form declares explicitly (Z-42). 433-B(OIC)\'s block carries a printed note offering a profit and loss statement in place of the lines and declares its own income period separately.',
 scope: 'form-specific',
 scope_reason: 'THE SAME CAPTION OVER A DIFFERENT DECLARED BASIS IS A DIFFERENT FIGURE. Cash-basis and accrual-basis gross receipts for one business over one month are two numbers, and only this form says which it is. The two forms also scope their periods differently (Z-43). A figure carried across is a figure computed under a basis the receiving form never declared, and every printed total on both pages would still reconcile — which is the property that makes this category the one to be most careful with.',
 compared_against: ['433boi'],
},
{
 id: 'Z-45', page: 5, category: 'new',
 oic: 'groups.other_income',
 boi: 'Nothing. 433-B(OIC) prints a single "Other income" line, not a table.',
 why: '433-B tables 5 rows of description and amount for other income, and adapters/pdf/maps/433b.totals.json declares them as a feeder into line 36.',
 scope: 'form-specific',
 scope_reason: 'A TABLE AND A SCALAR ARE DIFFERENT CONTAINERS. 433-B(OIC)\'s `irs433boi_bizinc_other_income` is one money cell; this is five described rows that feed a total. Serializing the rows into that scalar would put text into a number property.',
 compared_against: ['433boi'],
},
{
 id: 'Z-46', page: 5, category: 'different-arithmetic-same-name',
 oic: 's5_36_total_income',
 boi: '433-B(OIC) s3_box_b_total_business_income -> irs433boi_box_b_total_business_income.',
 why: '433-B\'s line 36 is declared in adapters/pdf/maps/433b.totals.json with TWO feeders — the five scalar income lines of Z-44 and the other_income table of Z-45. 433-B(OIC)\'s Box B adds five scalar lines and nothing else.',
 scope: 'form-specific',
 scope_reason: 'One total sums five cells; the other sums five cells and a table. Different operand sets, on top of the basis difference Z-44 records.',
 compared_against: ['433boi'],
},
{
 id: 'Z-47', page: 6, category: 'different-arithmetic-same-name',
 oic: 's5_37_materials_purchased, s5_38_inventory_purchased, s5_39_gross_wages_and_salaries, s5_40_rent, s5_41_supplies, s5_42_utilities_telephone, s5_43_vehicle_gasoline_oil, s5_44_repairs_and_maintenance, s5_45_insurance, s5_46_current_taxes, s5_47_other_expenses',
 boi: '433-B(OIC) s4_11_materials_purchased through s4_20_other_expenses -> irs433boi_bizexp_materials_purchased, _bizexp_inventory_purchased, _bizexp_gross_wages_and_salaries, _bizexp_rent, _bizexp_supplies, _bizexp_utilities_telephone, _bizexp_vehicle_costs, _bizexp_insurance, _bizexp_current_taxes, _bizexp_other_expenses — TEN lines against this form\'s eleven.',
 why: '433-B\'s expense block prints ELEVEN lines under the column header "Actual Monthly"; 433-B(OIC)\'s prints TEN. The extra one is 433-B\'s line 44, "Repairs and Maintenance", which 433-B(OIC) does not draw at all. The ten that do correspond sit under the same declared-basis and declared-period differences as Z-44.',
 scope: 'form-specific',
 scope_reason: 'ELEVEN LINES AGAINST TEN, and the eleventh is not the only reason. Every one of these figures is stated on the accounting basis of Z-42 over the single period of Z-43, neither of which 433-B(OIC) declares; and 433-B(OIC)\'s "vehicle costs" is one line where this form prints "Vehicle Gasoline/Oil" alone, so even the correspondence that looks one-to-one is a broader line against a narrower one. Ruled as ONE entry because every key in it fails for the same two reasons and splitting it would state the same ground eleven times.',
 compared_against: ['433boi'],
},
{
 id: 'Z-48', page: 6, category: 'different-arithmetic-same-name',
 oic: 's5_49_total_expenses',
 boi: '433-B(OIC) s4_box_c_total_business_expenses -> irs433boi_box_c_total_business_expenses.',
 why: 'adapters/pdf/maps/433b.totals.json declares line 49 over ELEVEN operand keys; 433-B(OIC)\'s Box C adds ten.',
 scope: 'form-specific',
 scope_reason: 'A total over eleven addends and a total over ten are not the same total, and the eleventh addend is a line the other form never prints (Z-47).',
 compared_against: ['433boi'],
},
{
 id: 'Z-49', page: 6, category: 'different-arithmetic-same-name',
 oic: 's5_50_net_income',
 boi: '433-B(OIC) s4_box_d_remaining_monthly_income -> irs433boi_box_d_remaining_monthly_income.',
 why: '433-B prints "Net Income (Line 36 minus Line 49)" and adapters/pdf/maps/433b.totals.json declares line 50 with line 36 and line 49 as its two feeders. 433-B(OIC)\'s Box D is Box B minus Box C.',
 scope: 'form-specific',
 scope_reason: 'The subtraction has the same shape and neither operand is the same figure (Z-46, Z-48), so the difference is not the same difference. THIS IS ALSO THE LINE THE [FS-3] AMENDMENT WAS RULED ON: it is the only declared line on this form that is computed from two others, which is why a one-cent break in 36 or 49 makes 50 disagree correctly and by construction, and why a firing proof on either operand must now DERIVE that dependency from this file\'s own feeder graph rather than assert it.',
 compared_against: ['433boi'],
},
{
 id: 'Z-50', page: 6, category: 'new',
 oic: '(no key — this entry covers none)',
 boi: 'n/a',
 why: 'placeholder, removed below',
 scope: 'form-specific', scope_reason: 'n/a', compared_against: ['433boi'],
},
];

// Z-50 was a drafting placeholder and is not an entry. Removed rather than left carrying a
// category count of its own — an entry covering no key would inflate _tally.new by one and be
// a figure about nothing ([R-07]).
const entries = E.filter(e => e.id !== 'Z-50');

// ── compared_against, WIDENED FROM THE ARTEFACTS RATHER THAN TYPED ───────────────────────
//
// Ruling 3: `compared_against` records the forms whose artefacts actually carry the facts an
// entry's keys bind. Authored by hand it said `['433boi']` on all 49 entries, and that was a
// statement about which form the author LOOKED AT rather than which forms hold the facts — the
// gap `_the_zero_that_was_wrong` came out of. So it is now derived: for every key in an entry,
// if `irs433_<fact>` is live on the backbone, the form that contributed it is added.
//
// The hand-written value is kept as the floor rather than replaced, because 433boi is the form
// this file was AUTHORED against and that remains true of every entry whether or not the
// backbone also carries the fact.
{
  const fs2 = readFileSync;
  const XWB = JSON.parse(fs2('adapters/hubspot/crosswalk.433b.json', 'utf8'));
  const factOf = new Map((XWB.bindings || []).map((b) => [b.key, b.fact]));
  const back = new Map();
  for (const [file, form] of [['fields.433a.json', '433a'], ['fields.433f.json', '433f'], ['fields.433aoi.json', '433aoi']]) {
    let doc; try { doc = JSON.parse(fs2(`adapters/hubspot/${file}`, 'utf8')); } catch { continue; }
    for (const p of (doc.properties || [])) if (String(p.hs_name).startsWith('irs433_'))
      back.set(String(p.hs_name).slice('irs433_'.length), [...(back.get(String(p.hs_name).slice('irs433_'.length)) || []), form]);
  }
  if (!back.size) throw new Error('STOP — the backbone read zero shared irs433_ names. compared_against cannot be widened from an input that was not read, and a silently un-widened list is the defect this block exists to close.');
  for (const e of entries) {
    const add = new Set(e.compared_against || []);
    for (const raw of String(e.oic).split(/,\s*/)) {
      const key = raw.trim().replace(/^groups\./, '');
      const fact = factOf.get(key);
      if (!fact) continue;                       // crosswalk not authored yet on a first pass
      for (const f of (back.get(fact) || [])) add.add(f);
    }
    e.compared_against = [...add].sort();
  }
}

// ── the tally, DERIVED ───────────────────────────────────────────────────────────────────
// EVERY DECLARED CATEGORY IS SEEDED AT ZERO FIRST, so a category this form declares and does
// not use is reported as 0 rather than being absent. An absent key and a zero are different
// statements — the first cannot be told from a category nobody considered ([R-04]) — and the
// seed list is read from `_the_categories` below rather than typed twice.
const CATEGORY_NAMES = [
  'exact', 'superset', 'asymmetric-the-other-way', 'different-predicate-same-caption',
  'different-arithmetic-same-name', 'different-shape', 'same-fact-different-decomposition',
  'new', 'same-question-different-subject',
];
const tally = { _why: 'Derived from entries[] by scratchpad/433b-classify-author.mjs and re-derived by adapters/pdf/count-sweep.mjs [S-25]. A hand-kept tally beside a list is how "eleven" survived three slices when the honest figure was ten. Every declared category is seeded at 0, so an unused one reports its zero instead of being absent.', entries: entries.length };
for (const c of CATEGORY_NAMES) tally[c] = 0;
for (const e of entries) tally[e.category] = (tally[e.category] || 0) + 1;

const doc = {
 form: '433b',
 against: '433boi',
 _generated_by: 'scratchpad/433b-classify-author.mjs — re-run it and this file regenerates byte for byte. DECLARED BECAUSE IT IS GENERATED ([R-19]): adapters/pdf/maps/433boi.crosswalk-classification.json carries no such line and needs none, having been written by hand. The rulings themselves are authored prose living in that script; what the script derives is _tally, the category seed list and the ordering, none of which is retyped here.',
 form_revision: '6-2026',
 covers_slices: 'the whole form — pages 1 to 6, the map having closed at slice 4',
 _what_this_is: 'THE CROSSWALK CLASSIFICATION FOR 433-B, AS DATA. For each correspondence between a 433-B binding and its nearest counterpart on 433-B(OIC), WHICH KIND of correspondence it is. Authored in one pass, because the map was already closed when this file was opened.',
 _this_binds_NOTHING: 'NO CROSSWALK BINDINGS. No HubSpot property is named by this file, no canonical column is claimed, no map key is repointed. Every entry is a statement about how two PRINTED FORMS relate; adapters/hubspot/derive-names-433b.mjs turns (category, scope, fact) into a name and that file is the only place a name exists.',
 _the_finding_that_governs_every_entry: 'THIS IS THE FIRST FORM IN THE SERIES WHOSE SUBJECT COINCIDES WITH A FORM ALREADY PROVISIONED. adapters/pdf/maps/_subjects.cross-form.json records 433-B / 433-B(OIC) as COINCIDE and 433-B as MUTUALLY EXCLUSIVE with 433-A, 433-F and 433-A(OIC). Every form before this one came out 100% form-specific because its subject was new; this one CAN reuse, and [R-06] rules that where 433-B and 433-B(OIC) share a fact about the same subject, 433-B binds the existing property PREFIX AND ALL, because `irs433boi_` records which form created a name and not which form owns it.',
 _and_reuse_being_licensed_is_not_reuse_being_automatic: 'NINE OF 116 KEYS TAKE AN EXISTING NAME. The subject axis opens the door and the printed questions decide who walks through it: on this form the two documents ask the same question about the same business in the same shape only nine times. The other 107 fail on a window (Z-16, Z-17), a dollar threshold (Z-20), a declared accounting basis (Z-42, Z-44, Z-47), an operand set (Z-27, Z-30, Z-35, Z-37, Z-40, Z-46, Z-48, Z-49), a row shape (Z-14, Z-26, Z-29, Z-31, Z-34, Z-36, Z-38), a decomposition (Z-01, Z-04, Z-22), or the absence of any counterpart at all.',
 subject: {
  this_form: 'the business entity — a partnership, a corporation, an LLC classified as a corporation, or any other LLC — under collection',
  the_predecessor: 'adapters/pdf/maps/_subjects.cross-form.json records 433-B(OIC)\'s subject as the business entity: a corporation, a partnership, an LLC classified as a corporation, or any other LLC, making an offer in compromise. THE SAME LEGAL PERSON.',
  the_ruling: 'A FACT ABOUT THIS BUSINESS MAY TAKE THE EXISTING irs433boi_ NAME WHEN, AND ONLY WHEN, THE TWO FORMS ASK THE SAME QUESTION IN THE SAME SHAPE. The subject decides whether reuse is POSSIBLE; the printed question and the printed container decide whether it is CORRECT.',
  the_test_applied: 'Prompt-50 ruling 2, which is [R-06] in its operative form: would one property serving both forms ever have to hold two different values for one taxpayer at one moment? Asked of every entry, one at a time, and answered in each entry\'s own `scope_reason`.',
  and_the_three_excluded_forms: '433-A, 433-F and 433-A(OIC) are MUTUALLY EXCLUSIVE with this form on the subject axis, so no property either of them created is a reuse candidate here regardless of how its caption reads. That exclusion is derived from the subject register, not from the prefix.',
 },
 _the_categories: {
  exact: 'The same fact, in the same shape, ABOUT THE SAME SUBJECT, asked by the same question. The only category a provisioning pass may reuse a property for. USED NINE TIMES ON THIS FORM — the first non-zero `exact` count in the series, and the subject register is why.',
  superset: 'This form\'s question asks for MORE than the predecessor\'s — a wider window, or no threshold where the predecessor sets one. Direction is stated per entry. A superset is NOT a reuse: the narrower property would be asked to hold an answer to the wider question.',
  'asymmetric-the-other-way': 'The PREDECESSOR\'S question is the wider one. Recorded separately from `superset` because the direction is the whole finding, and a category that collapsed the two would say a difference exists without saying which way it runs.',
  'different-predicate-same-caption': 'The captions correspond and NEITHER QUESTION CONTAINS THE OTHER — each selects facts the other excludes. Declared as a category BY THIS FORM, because forcing an incomparable pair into `superset` would state a direction that is not there. Used once, at Z-15, with both directions of the incomparability named.',
  'different-arithmetic-same-name': 'The captions correspond and the computation does not — a different operand set, or the same operands stated on a different declared basis. The most dangerous category in this series, because the names invite reuse and the resulting figure is wrong on a document signed under penalty of perjury WHILE EVERY PRINTED TOTAL STILL RECONCILES.',
  'different-shape': 'The same facts, laid out differently — a different number of rows, a different set of columns, a different overflow rule. The facts transfer; the container does not.',
  'same-fact-different-decomposition': 'One quantity split into different parts by the two forms. N cells here against one there, or a different cut. Not a reuse in either direction: N cells cannot bind one property and one cannot be split into N.',
  new: 'This form prints the fact and the predecessor does not print it at all. Not a naming decision — there is no counterpart to collide with.',
  'same-question-different-subject': 'The predecessor asks this question and asks it about ITS subject, which is a different legal person from this form\'s. The question transfers; the answer does not. Derives a form-specific name from a DEFAULT, so every entry in it must carry a `subject_reason` naming the two subjects and the state of the world in which they differ, and must name in `compared_against` the form whose subject the register calls MUTUALLY EXCLUSIVE. THE COUNT WAS 0 IN THIS FILE\'S FIRST DRAFT AND THE ZERO WAS WRONG — see `_the_zero_that_was_wrong` below.',
 },
 _why_the_shared_leaf_names_are_not_evidence: 'adapters/pdf/maps/433b.lineage.json records that 433-B shares ELEVEN AcroForm leaf names with 433-A and NONE with 433-B(OIC) — the form it coincides with on subject and the form every reuse in this file is with. NOT ONE SHARED LEAF NAME APPEARS IN THIS FILE AS EVIDENCE OF ANYTHING. The two axes point opposite ways on this form, which is [R-06]\'s prefix half demonstrated rather than argued, and the categories here are read off the PRINTED captions.',
 _the_zero_that_was_wrong: {
  _what_it_said: 'This file\'s first draft recorded `same-question-different-subject: 0` and wrote, in `_the_categories`: "DECLARED AND UNUSED, and the zero is the finding. It is the category that took 17 of 433-B(OIC)\'s 49 entries, and it cannot apply here because the subject register puts these two forms on the same subject." Kept verbatim under [R-21].',
  _what_it_got_right: 'The reasoning, as far as it went, and the pair it went to. 433-B and 433-B(OIC) DO share a subject, the register does say COINCIDE, and against 433-B(OIC) alone the category genuinely cannot apply. Every entry ruled against that form is unaffected, and not one derived name changed.',
  _what_it_got_WRONG: 'IT ANSWERED A QUESTION ABOUT ONE PAIR AND STATED IT ABOUT THE FORM. The subject register decides FOUR pairs for 433-B, not one: COINCIDE with 433-B(OIC) and MUTUALLY EXCLUSIVE with 433-A, 433-F and 433-A(OIC). `same-question-different-subject` is the category for a counterpart on a MUTUALLY EXCLUSIVE form, so the three pairs where it could apply are exactly the three the draft did not consult. Fourteen keys across six entries were called `new` — "this form prints the fact and the predecessor does not print it at all" — while 433-A prints every one of them.',
  _what_found_it: 'THE TWIN TABLE, adapters/hubspot/derive-names-433b.mjs A8. It builds `irs433_<fact>` for every form-specific row and looks it up on the backbone, and STOPs when a live twin sits under a category that adjudicates nothing — which `new` does not, because `new` asserts there is nothing to adjudicate. Ten of the fourteen were caught by exact fact-name match on the first run; re-reading the backbone against every entry found the rest and confirmed the six.',
  _why_the_fact_spellings_are_the_predecessors_ON_PURPOSE: 'income_change_amount, total_cash_on_hand, available_credit, accounts_notes_receivable, accounting_method, payment_processors, credit_cards_accepted and engages_in_ecommerce are all spelled the way 433-A spells them. A name chosen to describe this form instead would have hidden the pair from the twin table, and the check would have passed on all fourteen. The spelling is the thing that made the defect visible.',
  _and_one_entry_had_to_SPLIT: 'Z-25 covered cash on hand AND the two safe cells. Cash on hand has a 433-A counterpart (twice — line 12 for the individual, line 64 for their business) and the safe cells do not: 433-A prints irs433_safe_deposit_box, a box at a bank, which is not a safe on a company\'s premises. One entry cannot carry two different relations to the predecessor, so the safe cells became Z-51.',
  _what_did_NOT_change: 'NOT ONE DERIVED NAME, and that is worth stating plainly. Every one of the fourteen keys was form-specific before and is form-specific now; the correction is to the RECORDED REASON, from a false one to a true one. The defect would not have created a wrong property — it would have left the file asserting that nobody prints these facts, which the next form to be classified against 433-B would have read and believed.',
 },
 _how_every_new_entrys_absence_was_VERIFIED_and_not_assumed: {
  _the_rule: '[R-05]. "The map does not reach it" and "the page does not print it" are different facts, and map reachability never settles a claim about the printed page. Every `new` entry in this file asserts that 433-B(OIC) does not print a counterpart, and each of those is an absence claim about ANOTHER FORM\'S DRAWN PAGE.',
  _how_it_was_read: 'adapters/pdf/forms/f433boi.pdf was drawn with pdfjs across all six pages and its text runs concatenated — 17,665 characters — and each claimed-absent caption was searched in that text, NOT in adapters/pdf/maps/433boi.map.json and NOT in adapters/hubspot/fields.433boi.json. Where an entry claims no CELL rather than no caption, the page\'s widget rectangles were read as well; Z-19 carries that reading verbatim.',
  _what_the_reading_returned: 'ABSENT on the drawn page: "type of entity", "incorporated", "established", "eftps", "electronic federal tax payment", "e-commerce", "internet sales", "payment processor", "merchant account", "credit cards accepted", "date of loan", "payment amount", "increase/decrease", "anticipated", "cash on hand", "safe", "total equity of digital assets", "intangible", "business liabilities", "date pledged", "secured/unsecured", "total payments", "accounting method", "accrual".',
  _why_this_file_quotes_NO_COORDINATE_and_what_happened_when_it_did: 'THE FIRST DRAFT OF Z-19 QUOTED THREE BASELINES OFF 433-B(OIC)\'S PAGE, and quoting another form\'s coordinates inside a 433b artefact is [D-14]\'s defect in a new file. Two guards disagreed about it, which is the part worth recording: adapters/pdf/blanket-audit.mjs [S-25c] compares every coordinate in this file against 433-B\'s OWN drawn page and correctly refused one; adapters/pdf/absence-sweep.mjs never saw them at all, because its coordinate universe is the map and headings artefacts and a crosswalk-classification is not one. AND ONE OF THE THREE PASSED BY COINCIDENCE — y 224.5 is drawn nowhere near this evidence on 433-B(OIC)\'s neighbour but DOES land on 433-B page 1\'s "City"/"State"/"ZIP" row, so a reader checking it against the host form would have found a run there and been satisfied. THE SECOND DRAFT THEN COMMITTED THE SAME DEFECT ONE IDENTIFIER ALONG: the coordinates were replaced with full AcroForm paths, and blanket-audit [S-25c] refused those too, because every full `topmostSubform[0]...` path quoted in a 433b artefact must be a target 433-B\'s OWN map binds — and an `F433-B-OIC_Page5` path is not. That is the same finding twice and it is recorded as such rather than as two: A CROSSWALK-CLASSIFICATION IS ABOUT TWO FORMS AND EVERY HOST-FORM GUARD READING IT ASSUMES ONE, so any identifier of the other form that a host-form guard can parse — a baseline, a rectangle, a field path — will be checked against the wrong page. What survives is prose that names the other form explicitly and identifiers too partial to be mis-parsed: LEAF names, which the fields-file walk does not treat as full paths, qualified in words by their form, page and subform. adapters/pdf/maps/433boi.crosswalk-classification.json quotes no coordinate either, and its blanket disposition says so in as many words; this file now matches that precedent deliberately rather than by accident, and knows what the precedent was FOR.',
  _the_two_probes_that_came_back_PRESENT_and_why_neither_is_a_counterpart: 'REPORTED RATHER THAN DROPPED, because a probe list that only shows its absences is a list nobody can check. (1) "partnership" and "classified as a corporation" ARE drawn on 433-B(OIC) — in its printed ELIGIBILITY INSTRUCTIONS, which name the entity kinds that may file it. They are not a question, no widget answers them, and Z-07\'s claim is that the form prints no entity-type QUESTION, which survives the hit. This is also the sharpest possible illustration of why the search is run against the page rather than the map: the words are there and the cell is not. (2) "other income" IS drawn, as the single scalar line Z-45 names; Z-45 claims a table is absent, not the line.',
 },
 _the_identical_group_keys_decided_nothing: 'THREE GROUP KEYS ARE SPELLED IDENTICALLY ON BOTH FORMS — `digital_assets` (Z-31), `vehicles` (Z-36) and `business_equipment` (Z-38) — and all three are ruled different-shape. A derivation keyed on the map\'s own spelling would have produced three reuses and three unreadable record shapes. Recorded here because it is the sharpest available demonstration that a key name is not a fact about the world, one artefact along from where [R-08] found it.',
 entries,
 _tally: tally,
 _what_this_file_does_not_say: 'IT DOES NOT SAY WHICH HUBSPOT PROPERTY FEEDS ANYTHING, except where an entry\'s `reuse_of` names one — and that field is a statement about which existing property this form BINDS, not a name this file creates. Every name this pass creates is derived by adapters/hubspot/derive-names-433b.mjs.',
 _granularity_is_declared_per_entry: 'EVERY ENTRY NAMES EVERY KEY IT COVERS VERBATIM. This form declares NO naming mechanism — no prefix glob, no counterpart substitution — so adapters/hubspot/classification-coverage.mjs carries an EMPTY MECHANISMS row for it and every entry derives `enumerated`. Declared empty, not absent: an absent row and a declared-empty row are different statements.',
 _compared_against: 'Each entry carries `compared_against`, naming the forms whose artefacts actually hold the facts its keys bind. On this form that is 433boi on every entry, and it is written rather than implied because the three other mapped forms are excluded BY THE SUBJECT REGISTER and a reader is entitled to see that the exclusion was made rather than forgotten. adapters/hubspot/reclassify-against-backbone.mjs re-derives it.',
};


// THE SEED LIST IS ASSERTED AGAINST THE DECLARATION IT CLAIMS TO MIRROR. Two hand-kept lists of
// the same set is the parallel-list defect guard-sweep.mjs enumerates; this makes a drift a STOP.
{
  const declared = Object.keys(doc._the_categories).sort();
  const seeded = [...CATEGORY_NAMES].sort();
  if (JSON.stringify(declared) !== JSON.stringify(seeded))
    throw new Error(['STOP — the tally seed list and _the_categories name different sets.',
      `  declared: ${declared.join(', ')}`, `  seeded:   ${seeded.join(', ')}`].join('\n'));
}
writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
console.log(`wrote ${OUT}: ${entries.length} entries`);
for (const [k, v] of Object.entries(tally)) if (!k.startsWith('_')) console.log(`  ${k}: ${v}`);
