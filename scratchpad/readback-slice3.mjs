// READ THE FILLED PDF BACK, NEVER THE REQUEST.
//
// The gate proves the arithmetic and the coverage. This asks the narrower question the lineage
// work turns on: does the cell a LYING name points at hold the value the record supplied for
// the caption printed above it? A map that bound Name_Creditor[0] to the wrong column would
// still fill, still balance and still pass every total.
import { readFileSync } from 'node:fs';
import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';

const form = '433boi';
const map = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
const rec = JSON.parse(readFileSync('samples/433boi.slice3.sample.json', 'utf8'));
const outPath = `adapters/pdf/out/${form}_filled_${rec.intake_id || 'sample'}.pdf`;

const pdf = await PDFDocument.load(readFileSync(outPath));
const f = pdf.getForm();
const text = (t) => { const x = f.getField(t); return x instanceof PDFTextField ? (x.getText() || '') : null; };
const checked = (t) => { const x = f.getField(t); return x instanceof PDFCheckBox ? x.isChecked() : null; };

let bad = 0;
const say = (ok, line) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'BAD '} ${line}`); };

console.log(`read-back: ${outPath}`);
console.log('');
console.log('THE LYING CELLS — each read out of the PDF at the path the map bound, against the value');
console.log('the record supplied for the caption printed above that cell.');
const LIES = [
  ['s6_litigation_location_of_filing', 'Name_Creditor[0] p5', 'Location of filing'],
  ['s6_litigation_represented_by', 'Name_Creditor[1] p5', 'Represented by'],
  ['s6_litigation_docket_case_number', 'Date_Final_Payment[0] p5', 'Docket/Case number'],
  ['s6_litigation_possible_completion_date', 'Name_Creditor[2] p5', 'Possible completion date'],
  ['s6_litigation_subject', 'Name_Creditor[3] p5', 'Subject of litigation'],
  ['s6_litigation_amount_in_dispute', 'tab_order[1].Gross_Receipts[0] p5', 'Amount in dispute'],
  ['s6_irs_litigation_tax_types_and_periods', 'Date_Type_Asset_Transferred[0] p5', 'types of tax and periods involved'],
  ['s5_box_f_future_remaining_income', 'Box_H_Future_Remaining_Income[0] p5', 'Box F Future Remaining Income'],
];
for (const [key, leaf, caption] of LIES) {
  const got = text(map.map[key]);
  say(got === String(rec[key]), `${leaf.padEnd(38)} printed "${caption}"  -> ${JSON.stringify(got)}`);
}

console.log('');
console.log('THE TWO NAMES WHOSE OCCURRENCES DISAGREE — both halves, from the same filled form.');
for (const [key, leaf, note] of [
  ['s3_6_gross_receipts', 'Section3[0].Gross_Receipts[0] p4', 'HONEST: printed line (6) Gross receipts'],
  ['s6_litigation_amount_in_dispute', 'tab_order[1].Gross_Receipts[0] p5', 'LIES: printed Amount in dispute'],
  ['s6_irs_litigation_tax_types_and_periods', 'section_6[0].Date_Type_Asset_Transferred[0] p5', 'LIES: printed types of tax and periods'],
  ['s6_asset_transfer_date_value_and_type', 'Page6[0].Date_Type_Asset_Transferred[0] p6', 'HONEST: printed date, value, and type of asset transferred'],
]) {
  const got = text(map.map[key]);
  say(got === String(rec[key]), `${leaf.padEnd(50)} ${note.padEnd(58)} -> ${JSON.stringify(String(got).slice(0, 46))}`);
}

console.log('');
console.log('THE OFFER CALCULATION, RECOMPUTED FROM WHAT THE PAGE NOW HOLDS.');
const n = (t) => Number(String(text(map.map[t])).replace(/[^0-9.-]/g, ''));
const boxA = n('s3_box_a_available_equity_in_assets');
const boxB = n('s3_box_b_total_business_income');
const boxC = n('s4_box_c_total_business_expenses');
const boxD = n('s4_box_d_remaining_monthly_income');
const boxE = n('s5_box_e_future_remaining_income');
const boxF = n('s5_box_f_future_remaining_income');
const cpA = n('s5_amount_from_box_a');
const cpEF = n('s5_amount_from_box_e_or_box_f');
const offer = n('s5_offer_amount');
const eq = (a, b) => Math.abs(a - b) < 0.005;
say(eq(boxD, boxB - boxC), `Box D ${boxD} = Box B ${boxB} - Box C ${boxC}`);
say(eq(boxE, boxD * 12), `Box E ${boxE} = Box D ${boxD} x 12`);
say(eq(boxF, boxD * 24), `Box F ${boxF} = Box D ${boxD} x 24`);
say(eq(offer, cpA + cpEF), `Offer ${offer} = Box A copy ${cpA} + Box E-or-F copy ${cpEF}`);
say(eq(cpA, Math.round(boxA)), `Box A copy ${cpA} is Box A ${boxA} rounded — the exclusion the asterisk permits was NOT taken`);
say(eq(cpEF, boxE), `Box E-or-F copy ${cpEF} took the BOX E branch (x 12); nothing printed records that choice`);

console.log('');
console.log('THE NINE ATTACHMENT TICKS, top to bottom on the page, read back by rect order.');
const ticks = Object.entries(map.check_here).filter(([k, v]) => !k.startsWith('_') && v && v.target);
let allTicks = true;
for (const [k, v] of ticks) {
  if (!/^s7_attach/.test(k)) continue;
  const c = checked(v.target);
  if (c !== true) allTicks = false;
  say(c === true, `${k.padEnd(44)} ${v.target.split('.').pop()}`);
}
say(allTicks, `all ${ticks.filter(([k]) => /^s7_attach/.test(k)).length} attachment ticks are ON in the filled form`);

console.log('');
console.log('EVERY EXCLUSIVE SET ON PAGES 5 AND 6 — exactly one member checked.');
for (const [k, arr] of Object.entries(map.exclusive)) {
  if (k.startsWith('_') || !Array.isArray(arr)) continue;
  if (!/Page[56]/.test(arr[0])) continue;
  const on = arr.filter((t) => checked(t) === true);
  say(on.length === 1, `${k.padEnd(48)} ${on.length} of ${arr.length} checked`);
}

console.log('');
console.log(bad === 0
  ? 'READ-BACK OK — every cell above holds what the record supplied for the caption printed over it.'
  : `READ-BACK FAILED — ${bad} discrepanc(ies).`);
process.exit(bad ? 2 : 0);
