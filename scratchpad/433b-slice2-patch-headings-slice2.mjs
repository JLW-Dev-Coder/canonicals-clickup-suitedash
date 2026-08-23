// Slice 2's five printed blocks, and the heading each opens.
//
// A group bound under the wrong heading writes a row into the wrong printed table, and on these
// two pages nothing about the leaf names would say so — the digital-asset rows are named Row13a
// and Row13b inside a container called RetirementAcct1, and the available-credit rows are named
// Row20a and Row20b for lines the page marks 21a and 21b. The band is the only check there is.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/433b.headings.json';
const h = JSON.parse(readFileSync(P, 'utf8'));
if (h._slice !== 'Slice 1. Page 1 only; pages 2 to 6 declare no heading here yet and are not claimed to have none.') {
  console.error(`STOP — the headings file declares ${JSON.stringify(h._slice)}; this patch expects the slice-1 declaration.`);
  process.exit(2);
}

h._slice = 'Slices 1 and 2. Pages 1 to 3. Pages 4 to 6 declare no heading here yet and are NOT claimed to have none — that absence is about this file, not about the form.';

h.headings.push(
  { id: 'SECTION_3_OTHER_FINANCIAL_INFORMATION', page: 2, text: 'Section 3: Other Financial Information',
    _at: 'y 734.4, x 46.0..226.3, with the qualifier "(Attach copies of all applicable documents)" drawn as a separate run at x 229.1..434.5 on the same baseline. The band is anchored on the part that names the section.' },
  { id: 'SECTION_4_BUSINESS_ASSET_AND_LIABILITY_INFORMATION', page: 2, text: 'Section 4: Business Asset and Liability Information (Foreign and Domestic)',
    _at: 'y 345.6, x 46.0..400.9. One run. The instruction beneath it — "Include assets located in foreign countries or jurisdictions and add attachment(s) if additional space is needed to respond." at y 329.9 x 38.2..504.2 — is prose, not a heading, and opens no band.' },
  { id: 'BUSINESS_BANK_ACCOUNTS', page: 2, text: 'BUSINESS BANK ACOUNTS',
    _at: 'y 274.6, x 56.0..163.4. THE PAGE SPELLS IT WITH ONE C. Transcribed verbatim, because this file is compared against the drawn run and a corrected spelling would match nothing. The qualifiers "Include online and mobile", "accounts" and "(e.g., PayPal), money market accounts, savings accounts, checking accounts" continue on the same baseline and two below it.' },
  { id: 'ACCOUNTS_NOTES_RECEIVABLE', page: 3, text: 'ACCOUNTS/NOTES RECEIVABLE',
    _at: 'y 736.5, x 43.2..159.0, with "Include e-payment accounts receivable and factoring companies, and any bartering or online auction accounts." at x 163.0..520.9 on the same baseline.' },
  { id: 'INVESTMENTS', page: 3, text: 'INVESTMENTS',
    _at: 'y 425.5, x 43.2..100.2, with "List all investment assets below. Include stocks, bonds, mutual funds, stock options, certificates of deposit, commodities (e.g., gold, silver, copper, etc.)." at x 104.7..575.2 on the same baseline.' },
  { id: 'DIGITAL_ASSETS', page: 3, text: 'DIGITAL ASSETS',
    _at: 'y 289.7, x 43.2..108.4, with three lines of qualifier beneath it. It sits 12.4pt below the 19c total row and opens the band 20a, 20b, 20c and 20e are drawn in.' },
  { id: 'AVAILABLE_CREDIT', page: 3, text: 'AVAILABLE CREDIT',
    _at: 'y 132.5, x 56.0..132.4, with "Include all lines of credit and credit cards." at x 136.9..285.9 on the same baseline. It is the last heading on page 3 and its band runs to the foot of the page.' },
);

h.groups.business_bank_accounts = {
  heading: 'BUSINESS_BANK_ACCOUNTS',
  _why: 'The three rows are drawn at y 176.4..212.4 (marker 17a), y 140.4..176.4 (17b) and y 104.4..140.4 (17c). All three rectangles lie strictly below BUSINESS_BANK_ACOUNTS\'s baseline at y 274.6 and above the foot of the page, and no heading is declared between them. THE 17d TOTAL CELL (y 82.8..104.4) IS IN THE SAME BAND AND IS NOT A ROW OF THIS GROUP — it is a scalar, because the page draws it as the block\'s total rather than as a fourth account.',
};
h.groups.accounts_notes_receivable = {
  heading: 'ACCOUNTS_NOTES_RECEIVABLE',
  _why: 'The five rows are drawn from y 651.6..702.0 (marker 18a) down to y 450.0..500.4 (18e). All five lie strictly below ACCOUNTS/NOTES RECEIVABLE\'s baseline at y 736.5 and strictly above INVESTMENTS at y 425.5, which is the next declared heading on the page. The 18f total cell (y 435.6..450.0) is in the same band and is a scalar for the same reason as 17d.',
};
h.groups.investments = {
  heading: 'INVESTMENTS',
  _why: 'The two rows are drawn at y 356.4..399.6 (marker 19a) and y 313.1..356.4 (19b). Both lie strictly below INVESTMENTS\'s baseline at y 425.5 and strictly above DIGITAL ASSETS at y 289.7. THE BAND IS WHAT PLACES ROW 19b, and it is the reason [B-03] does not matter here: that row\'s subform is named Line19c, and the band says it is the second row of the INVESTMENTS block whatever the subform is called.',
};
h.groups.digital_assets = {
  heading: 'DIGITAL_ASSETS',
  _why: 'The two rows are drawn at y 179.5..203.5 (marker 20b) and y 155.0..179.5 (20c). Both lie strictly below DIGITAL ASSETS\'s baseline at y 289.7 and strictly above AVAILABLE CREDIT at y 132.5. THE BAND IS THE ONLY THING PLACING THESE ROWS: their container is named RetirementAcct1 and their subforms Row13a and Row13b, none of which names this block or these markers.',
};
h.groups.available_credit = {
  heading: 'AVAILABLE_CREDIT',
  _why: 'The two rows are drawn at y 68.4..100.8 (marker 21a) and y 37.6..68.4 (21b). Both lie strictly below AVAILABLE CREDIT\'s baseline at y 132.5, and there is no heading below it on page 3, so the band runs to the foot of the page. Their subforms are named Row20a and Row20b for rows the page marks 21a and 21b.',
};

h._no_other_group_on_pages_2_and_3 = 'Five groups are declared for these two pages and the map binds no sixth on either. Derived rather than asserted: adapters/pdf/verify-headings.mjs takes every group in the map whose slots bind a page-2 or page-3 target and requires a heading declaration for each, so a group added to the map without one is a STOP rather than a silence.';

writeFileSync(P, JSON.stringify(h, null, 1) + '\n');
console.log(`${P}: ${h.headings.length} heading(s), ${Object.keys(h.groups).length} group(s) placed`);
