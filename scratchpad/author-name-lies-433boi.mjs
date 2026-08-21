// [B21] — authors adapters/pdf/maps/433boi.name-lies.json from the lineage blocks already
// landed in 433boi.map.json, plus the control family read off the printed page.
//
// EVERY `path` AND `bound_to` IS RESOLVED THROUGH THE MAP HERE rather than typed, because a
// full AcroForm path typed into this generator is a path that can drift from the map it is
// meant to describe — and validate-map.mjs asserts exactly that correspondence, so a typed
// path would be caught but only after it had already been written.
import { readFileSync, writeFileSync } from 'node:fs';

const map = JSON.parse(readFileSync('adapters/pdf/maps/433boi.map.json', 'utf8'));
const K = (k) => { const t = map.map[k]; if (!t) throw new Error(`map key "${k}" not bound`); return t; };
const C = (g, i, col) => {
  const t = map.groups?.[g]?.slots?.[i]?.text?.[col];
  if (!t) throw new Error(`group cell ${g}[${i}].${col} not bound`);
  return t;
};
const entries = [];
// IDS ARE PREFIXED B, AND THE PREFIX IS NOT DECORATION. adapters/pdf/register-ids.mjs declares
// the name-lie registries ENGINE-scoped — one id, one thing, across the whole tree — because a
// citation like "[L21]" is written in adapters/pdf/maps/_carried.cross-form.json with no form
// beside it and has to resolve. 433-A(OIC) already holds L01..L22 and C01..C08, so an
// unprefixed second registry collides with it entry for entry, which is exactly what the
// sweep reported on this file's first run. BL/BI/BC keep every citation resolvable.
const seq = { lie: 0, container: 0, inherited: 0, control: 0, page_imprecise: 0 };
const PREFIX = { lie: 'BL', container: 'BL', inherited: 'BI', control: 'BC', page_imprecise: 'BP' };
const E = (o) => {
  const p = PREFIX[o.kind];
  const bucket = o.kind === 'container' ? 'lie' : o.kind;
  seq[bucket] += 1;
  entries.push({ id: `${p}${String(seq[bucket]).padStart(2, '0')}`, ...o });
};

// ─── PAGE 2 ───────────────────────────────────────────────────────────────────────────────
E({
  kind: 'container', page: 2, slice_found: 2,
  path: 'topmostSubform[0].F433-B-OIC_Page2[0].RetirementAcct1[0]',
  leaf: 'RetirementAcct1[0]',
  what_the_name_implies: 'A retirement account. There is no retirement-account row anywhere on 433-B(OIC).',
  printed_line: 'Digital asset',
  printed_line_at: 'y 321.7, x 50.4..94.0, with its tick box at x 36.0..45.0 and the block\'s captions "Description of digital asset" y 306.9, "Number / of units" y 322.7 / y 313.1, "Location of digital asset (exchange / account, self-hosted wallet)" x 176.4..299.6, "Account number for assets held by / a custodian or broker" x 309.6..432.8, "US dollar equivalent of the digital asset as of today" y 279.6 x 223.2..402.8 and "Digital asset address for self-hosted digital assets" y 279.5 x 36.0..211.6.',
  printed_marker: '(2c)',
  printed_marker_at: 'y 256.9, x 445.3..468.0',
  witnesses: [
    'The word "retirement" is drawn NOWHERE on page 2 — checked against every printed run on the page.',
    'All eight widgets under this container sit inside the digital-asset block\'s y band 252.0..328.5, whose banner runs are quoted above.',
  ],
  bound_to: null,
  cost_if_bound_by_name: 'A container lie is the worst kind on this form because BOTH halves of the address are wrong at once: an author who trusted it would look for a retirement table that does not exist and would never open the digital-asset row. 433-A(OIC) prints a real retirement block at line (3); a map keyed on the container name would route this form\'s digital assets into it.',
  bound_in_slice: 2,
});
E({
  kind: 'lie', page: 2, slice_found: 2,
  path: C('2c_digital_asset', 0, 'self_hosted_wallet_address'),
  leaf: 'name_of_individual[0]',
  what_the_name_implies: 'The name of a person.',
  printed_line: 'Digital asset address for self-hosted digital assets',
  printed_line_at: 'y 279.5, x 36.0..211.6',
  witnesses: [
    'Left-edge identity: the caption x1 is 36.0 and the widget x0 is 36.0.',
    'It is the only caption on that baseline whose x span begins left of x 223.2. The other caption on the same baseline, "US dollar equivalent of the digital asset as of today" x 223.2..402.8, pairs with the money widget at x 230.4..338.4, which carries a printed "$" at x 224.2..228.6 immediately to its left. Both cells on the row are accounted for and neither could take the other\'s caption.',
  ],
  bound_to: '2c_digital_asset[0].self_hosted_wallet_address',
  cost_if_bound_by_name: 'A person\'s name would print in the wallet-address cell. Nothing on this page feeds a total, so every printed total on the form would still reconcile.',
  lineage_433aoi: 'THE SAME LIE the 433-A(OIC) registry records at entries L07 and L12, on its pages 2 and 4, inherited unchanged. Confirmed here against THIS page rather than carried across — which is the rule, and which is why the container above it was found at the same time and has no counterpart there.',
  bound_in_slice: 2,
});
for (const [col, leaf, implies, printed, at, why] of [
  ['description_of_digital_asset', 'virtualCurrency[0].descriptionDigitalAsset[0]', 'A description of a digital asset.', 'Description of digital asset', 'y 306.9, x 36.0..129.4', 'The leaf says exactly what the page says.'],
  ['number_of_units', 'numberOfUnits[0]', 'A number of units.', 'Number / of units', 'y 322.7, x 140.4..168.8 wrapping to y 313.1, x 140.4..166.2', 'The leaf says exactly what the page says. It is also the cell this form must never round: it holds a QUANTITY and is deliberately in no rounding block.'],
  ['location_of_digital_asset', 'locationDigitalAsset[0]', 'The location of a digital asset.', 'Location of digital asset (exchange / account, self-hosted wallet)', 'y 322.7, x 176.4..299.6 wrapping to y 313.1, x 176.4..273.3', 'The leaf says exactly what the page says.'],
  ['account_number_custodian_or_broker', 'assetsAccountNumber[0]', 'An account number for assets.', 'Account number for assets held by / a custodian or broker', 'y 322.7, x 309.6..432.8 wrapping to y 313.1, x 309.6..384.7', 'The leaf says exactly what the page says.'],
  ['usd_equivalent_today', 'dollarEquivalentToday[0].digitalAssetToday[0]', 'A dollar equivalent, today.', 'US dollar equivalent of the digital asset as of today', 'y 279.6, x 223.2..402.8', 'The leaf says exactly what the page says.'],
  ['equity', 'TotalCurrentMarketValue[0]', 'A total current market value.', '= (2c) $', 'the "=" at y 256.6, x 430.9..435.6 and the marker "(2c) $" at y 256.9, x 445.3..468.0', 'DEFENSIBLE AND IMPRECISE, AND THE IMPRECISION IS THE PAGE\'S. The (2c) cell carries no caption of its own — the row\'s only money caption is "US dollar equivalent of the digital asset as of today", which is the cell to its left. "Total current market value" is a true description of what (2c) holds and says nothing about digital assets, which is what the page also declines to say at this cell. Recorded as inherited rather than as page_imprecise because what misleads here is the CONTAINER, not this leaf: read as RetirementAcct1[0].TotalCurrentMarketValue[0] it says "total current market value of a retirement account", and every word of the damage is in the first half.'],
]) {
  E({
    kind: 'inherited', page: 2, slice_found: 2,
    path: C('2c_digital_asset', 0, col), leaf,
    what_the_name_implies: implies,
    printed_line: printed, printed_line_at: at,
    witnesses: [why],
    bound_to: `2c_digital_asset[0].${col}`,
    why_inherited_and_not_a_lie: 'The leaf name is defensible read on its own and misleads only because of the container it sits in. It is recorded so the active-lie total cannot be inflated by re-listing the container lie once per child, and so a reader can see how many cells that one container lie actually reaches.',
    bound_in_slice: 2,
  });
}
E({
  kind: 'inherited', page: 2, slice_found: 2,
  path: 'topmostSubform[0].F433-B-OIC_Page2[0].RetirementAcct1[0].virtualCurrency[0].virtualCurrency[0]',
  leaf: 'virtualCurrency[0].virtualCurrency[0]',
  what_the_name_implies: 'Virtual currency.',
  printed_line: 'Digital asset',
  printed_line_at: 'y 321.7, x 50.4..94.0, with the tick box at x 36.0..45.0',
  witnesses: ['"Virtual currency" is the previous revision\'s wording for what this revision prints as "Digital asset". The name is stale rather than wrong, and it names the right row.'],
  bound_to: null,
  not_bound_because: 'IT IS A PER-ROW CHECKBOX OPTION AND THIS REGISTRY CANNOT ADDRESS ONE. The map binds it at groups.2c_digital_asset.slots[0].checkboxes.row_type.digital_asset. validate-map.mjs resolves a `bound_to` as a `map` key, a "group[row].column" TEXT cell, a `check_here` box or a top-level "checkboxSet.option" — a group-row checkbox option is none of those four, so a spelling written here would resolve to nothing and be reported as an unresolvable binding. Declared null with this reason rather than omitted, because omitting it would take one of the container\'s eight children out of the count that shows how far the container lie reaches.',
  bound_in_slice: 2,
});

// ─── PAGE 3 ───────────────────────────────────────────────────────────────────────────────
for (const i of [0, 1]) {
  E({
    kind: 'lie', page: 3, slice_found: 2,
    path: C('3ab_real_estate', i, 'monthly_payment'),
    leaf: `RealEstate${i + 1}[0].Name_Creditor[0]`,
    what_the_name_implies: 'The name of a creditor.',
    printed_line: 'Monthly mortgage payment',
    printed_line_at: i === 0 ? 'y 635.9, x 176.4..273.3' : 'y 520.7, x 176.4..273.3',
    witnesses: [
      'THE SAME-ROW HONEST WITNESS. Date_Final_Payment[0] sits on the SAME row at x 356.4..435.6 and its caption "Date of final payment" is drawn on the same baseline at x 356.4..432.0, x1 equal to its x0. So the caption line for that row is that baseline, and the only other caption on it is "Monthly mortgage payment" at x 176.4, whose x1 equals this widget\'s x0.',
      'THE UNIFORM GAP. Caption baseline to widget top is 4.5pt here, the same 4.5pt as Property_Description over Date_Purchased and as County_Country over its widget. Three rows, one gap, no tolerance used.',
    ],
    bound_to: `3ab_real_estate[${i}].monthly_payment`,
    cost_if_bound_by_name: 'A lender name would print in the monthly-payment column and the monthly payment in the lender column, on both rows, and every arithmetic tripwire on this page would still reconcile — neither cell feeds a total.',
    lineage_433aoi: 'THE INTAKE REPORT IS WRONG ABOUT THIS ONE, and the correction is recorded in 433boi.map.json._the_four_names_that_lie_on_pages_2_and_3 and carried as [B11]: the report read the caption BELOW the widget instead of the one above it, which put every caption on this block one row out. The report\'s headline survives and gets stronger.',
    bound_in_slice: 2,
  });
}
for (const i of [0, 1]) {
  E({
    kind: 'lie', page: 3, slice_found: 2,
    path: C('3ab_real_estate', i, 'lender_name_address'),
    leaf: `RealEstate${i + 1}[0].County_Country[0]`,
    what_the_name_implies: 'A county and a country.',
    printed_line: 'Name of lender/contract holder',
    printed_line_at: i === 0 ? 'y 607.1, x 176.4..286.2' : 'y 491.9, x 176.4..286.2',
    witnesses: [
      'Left-edge identity, 176.4 = 176.4, plus the 4.5pt caption-above-widget gap established on the same block.',
      'The county IS asked for on this form, inside the Property_Address caption — "(street address, city, state, ZIP code, county, and country)" — which is bound to `location`. The fact the name points at is already elsewhere on the row, so the name is not merely imprecise: it duplicates a cell that exists.',
    ],
    bound_to: `3ab_real_estate[${i}].lender_name_address`,
    cost_if_bound_by_name: 'A county and country would print where the lender goes, on both rows, and no total would move.',
    lineage_433aoi: 'NOT A SHARED LEAF NAME. County_Country appears in no 433-A(OIC) verdict and in no lineage report; it was found by reading this page.',
    bound_in_slice: 2,
  });
}

// ─── PAGE 5 ───────────────────────────────────────────────────────────────────────────────
E({
  kind: 'lie', page: 5, slice_found: 3,
  path: K('s5_box_f_future_remaining_income'),
  leaf: 'Box_H_Future_Remaining_Income[0]',
  what_the_name_implies: 'Box H.',
  printed_line: 'Box F Future Remaining Income',
  printed_line_at: 'y 591.9, x 370.8..508.8, directly above the cell rect [381.6, 578.2, 572.4, 590.4] — 1.5pt above the rect top, sharing its column.',
  witnesses: [
    'This form draws SIX box markers, A through F, and no Box G or Box H anywhere: checked against every printed run on all six pages.',
    '433-A(OIC) draws EIGHT, A through H, and ITS x24 future-remaining-income box IS Box H. Its totals file declares total_key box_h_future_remaining_income with the caption "multiply Remaining Monthly Income (Box F) by 24 to get Future Remaining Income (Box H)".',
  ],
  bound_to: 's5_box_f_future_remaining_income',
  the_sentence_this_entry_carries_verbatim: 'the role transferred exactly (future remaining income, ×24, floor 0) and only the letter is wrong, which is the most dangerous kind of inherited name because everything else about it checks out',
  why_that_sentence_is_here: 'IT IS THE GENERAL RULE THIS FORM PROVED. Every other lie on this form is wrong about WHAT the cell is — a creditor name over a payment column, a person\'s name over a wallet address, a retirement account over a digital asset — and each of those disagrees with the page in a way a reader checking one thing would notice. This one agrees with the page about everything except its own identifier. An author who verified the role, the multiplier, the floor and the operand would find all four correct and would never look at the letter.',
  cost_if_bound_by_name: 'Nothing on this form is named box_h, so a map keyed on the leaf name would bind a key called box_h_future_remaining_income to a cell the page calls Box F. The figure would be right and every downstream reference — the totals file, the review page, the crosswalk, the HubSpot property name — would name a box the taxpayer\'s form does not print. That is the shape a crosswalk against 433-A(OIC) is most likely to make permanent, because on that form the name is correct.',
  bound_in_slice: 3,
});
for (const [i, key, heading, at] of [
  [0, 's6_litigation_location_of_filing', 'Location of filing', 'y 167.9, x 129.6..187.4'],
  [1, 's6_litigation_represented_by', 'Represented by', 'y 167.9, x 273.6..330.1'],
  [2, 's6_litigation_possible_completion_date', 'Possible completion date', 'y 139.1, x 129.6..218.5, with "(mmddyyyy)" beside it at x 220.8..258.9'],
  [3, 's6_litigation_subject', 'Subject of litigation', 'y 139.1, x 273.6..340.7'],
]) {
  E({
    kind: 'lie', page: 5, slice_found: 3,
    path: K(key),
    leaf: `section_6[0].Name_Creditor[${i}]`,
    what_the_name_implies: 'The name of a creditor.',
    printed_line: heading, printed_line_at: at,
    witnesses: ['LEFT-EDGE IDENTITY, exact: the heading x1 equals the cell x1, and the heading is the nearest run above the rect in that column.'],
    bound_to: key,
    cost_if_bound_by_name: 'Four cells of the litigation table would take creditor names. Nothing in Section 6 feeds a total, so the arithmetic would be untouched and the filed page would answer four questions with one wrong fact.',
    lineage_433aoi: 'THE INTAKE REPORT GENERALISED THREE OBSERVATIONS INTO "the 433-A(OIC) lies did not transfer". They transferred: four occurrences on one page, all lying. Per occurrence — this same leaf name is bound HONESTLY at three page-3 occurrences on this form, recorded below as controls.',
    bound_in_slice: 3,
  });
}
E({
  kind: 'lie', page: 5, slice_found: 3,
  path: K('s6_litigation_docket_case_number'),
  leaf: 'section_6[0].Date_Final_Payment[0]',
  what_the_name_implies: 'The date of a final payment.',
  printed_line: 'Docket/Case number',
  printed_line_at: 'y 167.9, x 486.0..561.1',
  witnesses: ['Left-edge identity 486.0 = 486.0, third column of the same litigation header row as the four Name_Creditor cells above.'],
  bound_to: 's6_litigation_docket_case_number',
  cost_if_bound_by_name: 'A date would print where the docket number goes.',
  lineage_433aoi: 'Per occurrence: the same leaf name is bound honestly at FIVE page-3 occurrences on this form, recorded below as controls. This is the one that lies.',
  bound_in_slice: 3,
});
E({
  kind: 'lie', page: 5, slice_found: 3,
  path: K('s6_litigation_amount_in_dispute'),
  leaf: 'section_6[0].tab_order[1].Gross_Receipts[0]',
  what_the_name_implies: 'Gross receipts — business income.',
  printed_line: 'Amount in dispute',
  printed_line_at: 'y 138.1, x 36.0..100.0, with a bare "$" at y 123.7, x 36.0..40.4 drawn INSIDE the cell rect span 118.8..133.2 and immediately to its left',
  witnesses: [
    'TWO WITNESSES, AND NEITHER ALONE WOULD SETTLE IT. The caption above is the nearest run in the same column, 4.9pt above the rect top; the "$" inside the band to the left says the cell is money. The "$" says it is money and the caption says WHICH money.',
    'It sits under a different subform from the Section 3 cell of the same leaf name — tab_order[1] against Section3[0] — which is a second thing the name does not tell you.',
  ],
  bound_to: 's6_litigation_amount_in_dispute',
  cost_if_bound_by_name: 'Business gross receipts would print as the amount in dispute in a lawsuit, and the litigation amount would print on line (6) of Section 3 — where it WOULD feed Box B, Box D, Box F and the Offer Amount. This is the one lie on this form whose mis-binding moves the offer.',
  bound_in_slice: 3,
});
E({
  kind: 'lie', page: 5, slice_found: 3,
  path: K('s6_irs_litigation_tax_types_and_periods'),
  leaf: 'section_6[0].Date_Type_Asset_Transferred[0]',
  what_the_name_implies: 'A date, and a type of asset transferred.',
  printed_line: 'If yes and the litigation included tax debt, provide the types of tax and periods involved.',
  printed_line_at: 'y 80.8: "If yes" at x 36.0..56.5 continuing "and the litigation included tax debt, provide the types of tax and periods involved." at x 58.7..344.6',
  witnesses: ['It is the follow-up to the IRS-litigation Yes/No question at y 109.3, and it asks for tax types and periods — not a date, not a value, not a type of asset.'],
  bound_to: 's6_irs_litigation_tax_types_and_periods',
  cost_if_bound_by_name: 'THE MOST CONFUSABLE PAIR ON THIS FORM. The same leaf name is HONEST on page 6, where the caption really is "If yes, provide date, value, and type of asset transferred". Both cells are "If yes, provide…" follow-ups to a Yes/No pair, both span the full page width, both are the last text cell in their block. A reader who resolved this name once and carried the answer would write the IRS-litigation answer into the asset-transfer cell of a filed form, and nothing about the result would look wrong.',
  bound_in_slice: 3,
});

// ─── CONTROLS ─────────────────────────────────────────────────────────────────────────────
const QSV = [
  ['3ab_real_estate', 0, 'RealEstate1[0].CurrentMarket[0].Times_8[0]', 3, 'y 563.1, x 125.9..155.9'],
  ['3ab_real_estate', 1, 'RealEstate2[0].CurrentMarket[0].Times_8[0]', 3, 'y 447.9, x 125.9..155.9'],
  ['4ac_vehicles', 0, 'Vehicle1[0].CurrentMarket[0].Times_8[0]', 3, 'y 293.1, x 115.1..145.1'],
  ['4ac_vehicles', 1, 'Vehicle2[0].CurrentMarket[0].Times_8[0]', 3, 'y 199.5, x 115.1..145.1'],
  ['4ac_vehicles', 2, 'Vehicle3[0].CurrentMarket[0].Times_8[0]', 3, 'y 105.9, x 115.1..145.1'],
  ['5_business_equipment', 0, 'Section2[0].CurrentMarket[0].Times_8[0]', 4, 'y 656.7, x 115.1..145.1'],
];
for (const [g, i, leaf, page, at] of QSV) {
  E({
    kind: 'control', page, slice_found: 3,
    path: C(g, i, 'quick_sale_value'), leaf,
    what_the_name_implies: 'A cell multiplied by 0.8.',
    printed_line: 'X .8 = $',
    printed_line_at: at,
    witnesses: ['VERIFIED TRUE. The printed run states the factor .8 and the leaf name states 8. Read off the drawn text, not off the name — which is the whole point of checking it.'],
    bound_to: `${g}[${i}].quick_sale_value`,
    why_a_control: 'THIS IS THE FAMILY THAT PROVES THE STANDING RULE ON THE SIBLING FORM. 433-A(OIC) draws nine cells under an identical printed "X .8 = $"; eight are named Times_8 / times_8 and ONE is named Times_7, and that one is registry entry C02 there. On THIS form all six agree. Recorded so the lie total cannot absorb one of these by accident, and so a reader can tell a name family that was CHECKED and found true from one nobody looked at. Six agreeing names do not make the name a witness; they make a disagreeing one invisible to anyone who trusts names.',
    bound_in_slice: 3,
  });
}
for (const i of [0, 1, 2]) {
  E({
    kind: 'control', page: 3, slice_found: 2,
    path: C('4ac_vehicles', i, 'lender_name_address'),
    leaf: `Vehicle${i + 1}[0].Name_Creditor[0]`,
    what_the_name_implies: 'The name of a creditor.',
    printed_line: 'Name of creditor',
    printed_line_at: `y ${[344.3, 250.7, 157.1][i]}, x 205.2..264.3, over the widget at x 205.2..352.8`,
    witnesses: ['VERIFIED TRUE. Left-edge identity 205.2 = 205.2 and the caption says what the name says.'],
    bound_to: `4ac_vehicles[${i}].lender_name_address`,
    why_a_control: 'ONE LEAF NAME, TWO VERDICTS, AND THE VERDICT IS PER OCCURRENCE. Name_Creditor is HONEST at these three page-3 cells and LIES at six others on this form — two on page 3 in the real-estate block and four on page 5 in the litigation table. On page 3 the lies come FIRST in reading order (y 615.6 and y 500.4, above the first honest one at y 324.0), so an author reading top-down meets a lie before a truth. That is the safer arrangement and it is the opposite of what the intake report predicted.',
    bound_in_slice: 2,
  });
}
for (const [g, i, leaf, at] of [
  ['3ab_real_estate', 0, 'RealEstate1[0].Date_Final_Payment[0]', 'y 635.9, x 356.4..432.0, over the widget at x 356.4..435.6'],
  ['3ab_real_estate', 1, 'RealEstate2[0].Date_Final_Payment[0]', 'y 520.7, x 356.4..432.0'],
  ['4ac_vehicles', 0, 'Vehicle1[0].Date_Final_Payment[0]', 'y 344.3, x 360.0..435.6'],
  ['4ac_vehicles', 1, 'Vehicle2[0].Date_Final_Payment[0]', 'y 250.7, x 360.0..435.6'],
  ['4ac_vehicles', 2, 'Vehicle3[0].Date_Final_Payment[0]', 'y 157.1, x 360.0..435.6'],
]) {
  E({
    kind: 'control', page: 3, slice_found: 2,
    path: C(g, i, 'final_payment_date'), leaf,
    what_the_name_implies: 'The date of a final payment.',
    printed_line: 'Date of final payment',
    printed_line_at: at,
    witnesses: ['VERIFIED TRUE. The caption x1 equals the widget x0 and the caption says what the name says.'],
    bound_to: `${g}[${i}].final_payment_date`,
    why_a_control: 'THE HONEST OCCURRENCES COME FIRST FOR THIS NAME, all five of them, on the page an author reads before page 5. An author who checks this name here and generalises will be wrong exactly once — at section_6[0].Date_Final_Payment[0], under "Docket/Case number". That is the arrangement the trap needs and it is why five controls are recorded rather than one.',
    bound_in_slice: 2,
  });
}
E({
  kind: 'control', page: 4, slice_found: 3,
  path: K('s3_6_gross_receipts'),
  leaf: 'Section3[0].Gross_Receipts[0]',
  what_the_name_implies: 'Gross receipts.',
  printed_line: 'Gross receipts',
  printed_line_at: 'y 471.1, x 36.0..87.6, with the marker "(6) $" at y 471.1, x 449.3..468.0 whose baseline lies inside the cell rect span 466.2..480.6',
  witnesses: ['VERIFIED TRUE. Printed line (6) of Section 3 is gross receipts and the cell is named for it.'],
  bound_to: 's3_6_gross_receipts',
  why_a_control: 'The honest half of a two-verdict name whose other occurrence, section_6[0].tab_order[1].Gross_Receipts[0] under "Amount in dispute", is the one lie on this form that would move the Offer Amount if it were bound by name. The honest one comes first in page order.',
  bound_in_slice: 3,
});
E({
  kind: 'control', page: 6, slice_found: 3,
  path: K('s6_asset_transfer_date_value_and_type'),
  leaf: 'Date_Type_Asset_Transferred[0]',
  what_the_name_implies: 'A date, and a type of asset transferred.',
  printed_line: 'If yes, provide date, value, and type of asset transferred',
  printed_line_at: 'y 696.4, x 36.0..233.4, over the cell rect [36.0, 680.4, 576.0, 693.4]',
  witnesses: ['VERIFIED TRUE. Date, value and type of asset transferred is exactly what the caption asks for.'],
  bound_to: 's6_asset_transfer_date_value_and_type',
  why_a_control: 'The honest half of the most confusable pair on this form. Both cells are full-width "If yes, provide…" follow-ups to a Yes/No pair and both are the last text cell in their block; only the printed caption tells them apart, and here the caption agrees with the name. The lying one is on page 5 and comes FIRST.',
  bound_in_slice: 3,
});

const k = (kind) => entries.filter((e) => e.kind === kind).length;
const doc = {
  form: '433boi',
  form_revision: '4-2026',
  catalog: '55897B',
  _what_this_file_is: 'Every AcroForm leaf name on Form 433-B (OIC) that is KNOWN TO DESCRIBE SOMETHING OTHER THAN THE CELL IT NAMES, with the printed evidence that settled each one — and, beside them, the names that were CHECKED AND FOUND TRUE. It is a registry, not a binding: nothing here is read by any fill engine and no map key is resolved through it. validate-map.mjs asserts it against the PDF and against 433boi.map.json, so a lie declared here cannot quietly stop being true.',
  _why_a_file_and_not_prose_in_the_map: 'The lineage was recorded inside 433boi.map.json, in _the_four_names_that_lie_on_pages_2_and_3 and _the_names_that_lie_on_pages_4_to_6, and that was the right place to record a slice\'s reading. It is the wrong place to keep a list that has to be DIFFED: 433-B(OIC) shares 83 leaf names with 433aoi, the crosswalk between them is the next piece of work, and a machine-checked sidecar can be compared against another form\'s registry where prose spread across two map blocks cannot. This file is generated from those blocks and from the printed page; it does not replace them, and every `path` and `bound_to` in it was RESOLVED THROUGH THE MAP rather than typed.',
  _generated_by: 'scratchpad/author-name-lies-433boi.mjs, from adapters/pdf/maps/433boi.map.json plus the printed page. Every `path` and every `bound_to` is resolved through the map at generation time, so neither can be a transcription; validate-map.mjs then asserts that each `path` exists verbatim in 433boi.fields.json and that each `bound_to` resolves through the map to exactly that path. A SECOND COPY OF A LIST IS ONLY SAFE WHEN SOMETHING ASSERTS IT AGAINST THE FIRST, and that assertion is what makes this file admissible.',
  _the_standing_rule_this_file_exists_to_defend: 'A binding on this form comes from the printed caption and the widget rectangle. A leaf name is never evidence — not when it disagrees with the page, and not when it agrees, because on this form a name that happens to be right is a coincidence. The controls at the bottom of this file are the proof: 6 cells across 2 pages sit under an identical printed "X .8 = $", 6 are named Times_8 / times_8, and 0 is named Times_7. On the sibling form the same family runs nine cells and one of them IS named Times_7, which is registry entry C02 there. Six agreeing names do not make the name a witness; they make a disagreeing one invisible to anyone who trusts names.',
  _counting: '14 ACTIVE LIES — 13 leaf names and 1 container. Every one is recorded PER OCCURRENCE and never per name: four leaf names on this form carry both verdicts, and for two of them the honest occurrence comes first in page order, which is the arrangement that traps an author who generalises. The three counts are reported separately and are derived from entries[] by adapters/pdf/count-sweep.mjs [S-11] rather than retyped, because a single retyped number is how the sibling form\'s count reached eleven while the honest figure was ten and stayed there for three slices.',
  _what_is_machine_checked_and_what_is_not: 'CHECKED by validate-map.mjs: every `path` exists verbatim in 433boi.fields.json (or, for a `container` entry, at least one enumerated field is a descendant of it); every non-null `bound_to` resolves through 433boi.map.json to exactly this `path`; every entry declares a `kind` the validator knows; and no two entries claim the same path. CHECKED by count-sweep.mjs: every figure `_tally` and `_counting` state, derived from entries[]. NOT CHECKED, and deliberately: `printed_line`, `printed_line_at`, `printed_marker_at` and the witnesses are transcriptions of the drawn page, and asserting those in code would mean re-deriving from the PDF the very reading the entry records, which is circular. They are quoted verbatim so a person can re-measure them with adapters/pdf/align-block.mjs and adapters/pdf/line-markers.mjs.',
  _kinds: {
    lie: 'The leaf name describes something other than the cell. Counted in the active total.',
    container: 'A SUBFORM, not a field. The lie is the subform name; its children are told apart only by it. Counted in the active total. `path` is a prefix, not an enumerated field.',
    inherited: 'The leaf name is defensible on its own and misleads only because of the container it sits in. NOT counted in the active total; recorded so the count cannot be inflated by re-listing a container lie once per child, and so the reach of that one container lie is visible.',
    control: 'VERIFIED TRUE against the printed page. Not a lie. Recorded so the registry states what it checked and did not find, and so the lie total cannot absorb one by accident. A registry that can only say "wrong" cannot be checked for over-reporting.',
    page_imprecise: 'A name that UNDERSTATES a cell the page also understates — neither wrong nor verified right. ZERO entries on this form, and the class was looked for: the two candidates were section_6[0].tab_order[1], whose container name says nothing at all while the page DOES label the cell ("Amount in dispute"), and RetirementAcct1[0].TotalCurrentMarketValue[0], whose leaf is a true description of the (2c) cell the page leaves uncaptioned. The first fails the test because the page is precise where the name is not; the second is recorded as `inherited`, because what misleads there is the container and not the leaf.',
  },
  entries,
  _tally: {
    active_lies: k('lie') + k('container'),
    of_which_leaf: k('lie'),
    of_which_container: k('container'),
    inherited_not_counted: k('inherited'),
    controls_verified_true: k('control'),
    page_imprecise_not_counted: k('page_imprecise'),
    total_entries: entries.length,
    bound_today: entries.filter((e) => e.bound_to !== null && e.bound_to !== undefined).length,
    unbound: entries.filter((e) => (e.bound_to === null || e.bound_to === undefined) && e.kind !== 'container').length,
    _the_three_counts: 'THE REGISTRY REPORTS THREE COUNTS AND NOT ONE. active_lies is names that disagree with the page. controls_verified_true is names that were checked and AGREE — kept so a reader can tell an unreliable name family from an unchecked one, and so the lie total cannot absorb one by accident. page_imprecise is names that understate a cell the page also understates; it is zero here and the class was looked for, which is a different statement from not mentioning it. A single number could carry none of that, and a single number is how the sibling form\'s count reached eleven when the honest figure was ten.',
  },
  _slice: 'PRINTED PAGES 1 THROUGH 6 — the whole form. Page 1 contributes no entry of any kind: its leaf names are C1_NN checkbox ids and business-identification scalars, and the map records the one finding it does carry (AcroForm slot order is not printed order for C1_01..C1_04) as a structural note rather than as a name that lies.',
};

writeFileSync('adapters/pdf/maps/433boi.name-lies.json', JSON.stringify(doc, null, 1) + '\n');
console.log(`433boi.name-lies.json: ${entries.length} entries — ${doc._tally.active_lies} active lies (${doc._tally.of_which_leaf} leaf + ${doc._tally.of_which_container} container), ${doc._tally.inherited_not_counted} inherited, ${doc._tally.controls_verified_true} controls, ${doc._tally.page_imprecise_not_counted} page-imprecise`);
