// The slice-3 acceptance fixture (samples/433b.slice3.sample.json) and the extended stress
// fixture (samples/433b.overmax.sample.json).
//
// SATURATED means every one of the 343 mapped cells across pages 1 to 4 carries a value, every
// group is filled to its printed row count, and every declared exclusive set has exactly one
// option chosen. A cell left empty here is a cell the gate never proved writable, which is the
// state a saturated fixture exists to remove.
//
// PAGES 1 TO 3 ARE CARRIED FORWARD VERBATIM from samples/433b.slice2.sample.json rather than
// retyped, for the reason slice 2 gave for carrying page 1: a retyped copy of a landed record is
// 249 chances to differ from the record the slice-2 gate actually ran, and nothing would say
// which of the two was meant. The slice-2 fixture is then marked `superseded` and made to name
// this one, which resolve-fixture.mjs requires.
//
// THE TWO NEW TOTALS ARE COMPUTED FROM THE ROWS IN THIS FILE, HERE, ONCE. Gate step 11
// recomputes them from what the FILLED PDF prints and compares. Two computations over two
// different artefacts — this one over the record, that one over the drawn page — which is what
// makes the comparison worth making. A fixture carrying a typed total would be asserting the
// arithmetic it is supposed to be exercising.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'samples/433b.slice2.sample.json';
const OUT = 'samples/433b.slice3.sample.json';
const OVER = 'samples/433b.overmax.sample.json';

const prior = JSON.parse(readFileSync(SRC, 'utf8'));
// THE GUARD HAS TO ADMIT ITS OWN AFTERMATH. adapters/pdf/assert-fixture-authorship.mjs RE-RUNS
// this generator and compares its output byte for byte, so a generator that refuses to run twice
// cannot have its claim assessed — and a claim that cannot be assessed is not a claim that holds.
// The first run finds SRC role "acceptance"; every run after it finds "superseded" naming OUT,
// which is this generator's own doing and not a reason to stop. Any OTHER role, or a superseded
// record naming some other successor, is somebody else's edit and IS a stop.
const priorRole = prior._fixture?.role;
const priorOk = priorRole === 'acceptance' || (priorRole === 'superseded' && prior._fixture?.superseded_by === OUT);
if (!priorOk) { console.error(`STOP — ${SRC} declares role ${JSON.stringify(priorRole)}${priorRole === 'superseded' ? ` naming ${JSON.stringify(prior._fixture?.superseded_by)}` : ''}; this generator supersedes it into ${OUT}.`); process.exit(2); }

const money = (n) => n.toFixed(2);
const sum = (rows, col) => rows.reduce((a, r) => a + Number(String(r[col]).replace(/[^0-9.-]/g, '')), 0);

// ── page 4, REAL PROPERTY, printed markers 22a to 22d ──────────────────────────────────────
// THE DESCRIPTION CELL HOLDS 30 CHARACTERS AND THE FORM SAYS SO. Every Property Description
// widget on page 4 carries maxLen 30, so these four values are written to fit the printed cell
// rather than trimmed to taste. The first draft used fuller phrases and fill-433b.mjs stopped the
// run at gate step 7 naming all three that overran — which is the capacity check doing exactly
// what it is for: a value longer than the cell is a value the filed form would not carry, and
// silently truncating it is how a wrong figure reaches a filing.
// Ten columns per row. Every value invented; every address a non-existent street number in a
// real city, every phone 555-01xx, and no figure copied from any real filing.
const real_property = [
  { description: 'Kiln and warehouse building',
    purchase_date: '06142016', current_fmv: '742000.00', current_loan_balance: '395400.00',
    monthly_payment: '3180.00', final_payment_date: '06012036', equity: '346600.00',
    location: '4417 Slater Road, Ferndale, WA 98248, Whatcom County',
    lender_name_address: 'Cascadia Mutual Bank, 200 Cornwall Avenue, Bellingham, WA 98225',
    lender_phone: '5550142' },
  { description: 'Clay and glaze storage annexe',
    purchase_date: '02282019', current_fmv: '188500.00', current_loan_balance: '96250.00',
    monthly_payment: '1145.00', final_payment_date: '03012034', equity: '92250.00',
    location: '4419 Slater Road, Ferndale, WA 98248, Whatcom County',
    lender_name_address: 'Cascadia Mutual Bank, 200 Cornwall Avenue, Bellingham, WA 98225',
    lender_phone: '5550142' },
  { description: 'Leased retail showroom',
    purchase_date: '09012021', current_fmv: '0.00', current_loan_balance: '0.00',
    monthly_payment: '2400.00', final_payment_date: '08312027', equity: '0.00',
    location: '118 West Holly Street, Bellingham, WA 98225, Whatcom County',
    lender_name_address: 'Holly Street Holdings LP, 5 Bay Street, Bellingham, WA 98225',
    lender_phone: '5550168' },
  { description: 'Undeveloped parcel, 1.1 acres',
    purchase_date: '11072023', current_fmv: '94000.00', current_loan_balance: '61800.00',
    monthly_payment: '640.00', final_payment_date: '11012033', equity: '32200.00',
    location: '0 Grandview Road, Custer, WA 98240, Whatcom County',
    lender_name_address: 'Marla Petrunich, 902 Peace Portal Drive, Blaine, WA 98230',
    lender_phone: '5550193' },
];

// ── page 4, VEHICLES, LEASED AND PURCHASED, printed markers 23a to 23d ─────────────────────
// Thirteen columns per row: the same six-cell grid as the block above, plus Year, Make/Model,
// Mileage, License/Tag Number and a VIN. Every VIN is marked NOTAREALVIN in its own text.
const vehicles = [
  { model_year: '2019', make_model: 'Ford Transit 350 box van', mileage: '118400',
    license_tag: 'WA C41882K', vin: 'NOTAREALVIN0000019',
    purchase_date: '04022019', current_fmv: '21400.00', current_loan_balance: '6850.00',
    monthly_payment: '512.00', final_payment_date: '04012027', equity: '14550.00',
    lender_name_address: 'Whatcom Educational Credit Union, 1000 Iowa Street, Bellingham, WA 98229',
    lender_phone: '5550117' },
  { model_year: '2022', make_model: 'Isuzu NPR-HD flatbed', mileage: '41250',
    license_tag: 'WA D77310L', vin: 'NOTAREALVIN0000022',
    purchase_date: '07182022', current_fmv: '48900.00', current_loan_balance: '31200.00',
    monthly_payment: '884.00', final_payment_date: '07012029', equity: '17700.00',
    lender_name_address: 'Isuzu Commercial Finance, 2500 Westchester Avenue, Purchase, NY 10577',
    lender_phone: '5550125' },
  { model_year: '2016', make_model: 'Toyota Tacoma double cab', mileage: '204770',
    license_tag: 'WA B20554J', vin: 'NOTAREALVIN0000016',
    purchase_date: '01092016', current_fmv: '13750.00', current_loan_balance: '0.00',
    monthly_payment: '0.00', final_payment_date: '01012021', equity: '13750.00',
    lender_name_address: 'Paid in full - no lienholder of record',
    lender_phone: '5550100' },
  { model_year: '2024', make_model: 'Kubota RTV-X1100C utility vehicle', mileage: '1860',
    license_tag: 'WA OFFROAD-4471', vin: 'NOTAREALVIN0000024',
    purchase_date: '05302024', current_fmv: '19250.00', current_loan_balance: '15400.00',
    monthly_payment: '389.00', final_payment_date: '05012029', equity: '3850.00',
    lender_name_address: 'Northwest Farm Credit Services, 1700 South Assembly Street, Spokane, WA 99224',
    lender_phone: '5550136' },
];

const rec = {
  ...prior,
  real_property,
  s4_22e_total_equity_real_property: money(sum(real_property, 'equity')),
  vehicles,
  s4_23e_total_equity_vehicles: money(sum(vehicles, 'equity')),
};

// SLICE 2's CO-AUTHORSHIP DECLARATION IS ABOUT SLICE 2 AND DOES NOT TRAVEL. The spread above
// copies every key of the slice-2 record, and on the SECOND run slice 2 carries the declaration
// this file wrote into it — so it would arrive here as an inherited key naming a supersession
// that is not this file's. Slice 3 has exactly one author, this generator, and a co-authorship
// block on it would claim otherwise. Deleted rather than overwritten, so the absence is the
// claim: assert-fixture-authorship.mjs reports this record SOLE AUTHOR and that is what it is.
delete rec._co_authored_with_hand;

rec._fixture = {
  form: '433b',
  role: 'acceptance',
  why: 'Slice 3\'s acceptance record. SATURATED: every one of the 343 mapped cells across pages 1 to 4 carries a value, every one of the ten groups is filled to its printed row count, and every one of the 21 declared exclusive sets has exactly one option chosen. A cell left empty here would be a cell the gate never proved writable.',
  superseded: `${SRC}, which is now marked role "superseded" and names this file. Its 249 keys for pages 1 to 3 are CARRIED FORWARD VERBATIM rather than retyped — a retyped copy is 249 chances to differ from the record the slice-2 gate actually ran, and nothing would say which was meant.`,
  _the_six_totals_are_computed_from_the_rows_in_this_file: 'scratchpad/433b-slice3-author-slice3-fixtures.mjs sums the printed rows and writes the result; the four page-2 and page-3 totals were computed the same way by slice 2 and are carried forward with the rows they sum. Gate step 11 then recomputes each one from what the FILLED PDF PRINTS and compares. Two computations over two different artefacts — one over the record, one over the drawn page — which is what makes the comparison worth making. A typed total would be asserting the arithmetic it is supposed to exercise.',
  _page_4_draws_no_checkbox_so_this_slice_adds_no_option: 'All 94 page-4 widgets are text fields. The 21 exclusive sets and every option value in this record are unchanged from slice 2, and that is a property of the page rather than of this fixture.',
  _the_zero_rows_are_deliberate_and_they_are_not_empty_cells: 'real_property[2] is a LEASED showroom, so its FMV, loan balance and equity are 0.00 and its monthly payment is the rent — which is what the printed column headers ask for on a row the block heading says to include ("all real property and land contracts the business owns/leases/rents"). vehicles[2] is owned outright, so its loan balance and monthly payment are 0.00 and its equity equals its FMV. A ZERO IS A WRITTEN VALUE AND AN EMPTY CELL IS NOT: both rows still carry a value in all ten and thirteen of their columns, so saturation is not weakened, and the two rows exercise the arithmetic at its boundary rather than only in its middle.',
  _synthetic: 'Every value is invented. No real taxpayer, no real EIN, no real bank, no real portal record. The telephone numbers are all 555-01xx, every VIN is marked NOTAREALVIN in its own text, and the addresses use street numbers that do not exist on the roads named. Nothing here identifies anybody.',
  _authored_by: 'Prompt 48 commit 3, from adapters/pdf/maps/433b.map.json\'s binding list and samples/433b.slice2.sample.json.',
};
rec._generated_by = 'scratchpad/433b-slice3-author-slice3-fixtures.mjs';

writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
console.log(`${OUT}: ${Object.keys(rec).length} top-level key(s)`);
console.log(`  22e total equity real property = ${rec.s4_22e_total_equity_real_property} (summed from ${real_property.length} rows)`);
console.log(`  23e total equity vehicles      = ${rec.s4_23e_total_equity_vehicles} (summed from ${vehicles.length} rows)`);

// ── mark slice 2 superseded ────────────────────────────────────────────────────────────────
prior._fixture.role = 'superseded';
prior._fixture.superseded_by = OUT;
prior._fixture._why_superseded = 'Slice 3 bound page 4 and the acceptance fixture had to reach its 94 new cells. This record\'s 249 keys are carried forward into the successor VERBATIM; it is kept rather than deleted because the slice-2 gate ran against it and a deleted fixture makes that run unreproducible.';
// SLICE 2 CLAIMS ITS OWN GENERATOR AS SOLE AUTHOR, AND AFTER THIS IT IS NOT ONE.
// adapters/pdf/assert-fixture-authorship.mjs re-runs scratchpad/433b-slice2-author-slice2-fixture.mjs
// and compares; that generator writes role "acceptance", because when it was written slice 2 WAS
// the acceptance record. The supersession above is written by THIS file, so slice 2 now has two
// authors and the guard requires it to say so. The declaration lists itself, for the reason the
// 433-B(OIC) slice-3 record gives: a declaration that exempted itself would be the one key in
// the file whose authorship nothing states.
prior._co_authored_with_hand = {
  _fixture: 'THE SUPERSESSION, WRITTEN BY scratchpad/433b-slice3-author-slice3-fixtures.mjs RATHER THAN BY HAND. Slice 2’s own generator writes role "acceptance" and knows nothing of a successor, because when it ran there was none. The role, superseded_by and _why_superseded keys are slice 3’s doing; the rest of this block is slice 2’s generator’s and is unchanged.',
  _co_authored_with_hand: 'THIS DECLARATION ITSELF. Neither generator emits it — slice 2’s does not know it will be superseded, and slice 3’s writes it here — so the block enumerating the co-authored keys is one of them.',
};
writeFileSync(SRC, JSON.stringify(prior, null, 1) + '\n');
console.log(`${SRC}: role -> superseded, names ${OUT}`);

// ── the stress fixture gains two over-max groups ───────────────────────────────────────────
// Each new group carries one record MORE than the form prints a row for, and each overflow row
// opens its first bound non-numeric text column with OVERMAX so a human reading the filled PDF
// can see at a glance that nothing beginning OVERMAX reached the page. assert-overflow.mjs does
// not know that word — it derives the column to look in from the map's own last-slot declaration.
const over = JSON.parse(readFileSync(OVER, 'utf8'));
if (over._fixture?.role !== 'stress') { console.error(`STOP — ${OVER} declares role ${JSON.stringify(over._fixture?.role)}, not stress.`); process.exit(2); }
// Same reason as the SRC guard above: this generator's own second run finds the page-4 groups
// already present, because it put them there. It rewrites them from the arrays above rather than
// refusing, so the output is a function of this file and the slice-2 record alone.

over.real_property = [...real_property, {
  description: 'OVERMAX fifth property',
  purchase_date: '01012025', current_fmv: '1.00', current_loan_balance: '0.00',
  monthly_payment: '1.00', final_payment_date: '01012026', equity: '1.00',
  location: 'OVERMAX location, nowhere, WA 98225, Whatcom County',
  lender_name_address: 'OVERMAX lender, nowhere, WA 98225',
  lender_phone: '5550199',
}];
over.vehicles = [...vehicles, {
  model_year: '2025', make_model: 'OVERMAX fifth vehicle, which the form prints no row for',
  mileage: '1', license_tag: 'WA OVERMAX-1', vin: 'NOTAREALVINOVERMAX',
  purchase_date: '01012025', current_fmv: '1.00', current_loan_balance: '0.00',
  monthly_payment: '1.00', final_payment_date: '01012026', equity: '1.00',
  lender_name_address: 'OVERMAX lender, nowhere, WA 98225',
  lender_phone: '5550199',
}];
// The totals sum the PRINTED rows only. An over-max record whose total included the dropped row
// would make gate step 11 fail for the right reason by accident: the page cannot print a row it
// has no slot for, so the printed total is the sum of what fits, and that is what is written.
over.s4_22e_total_equity_real_property = money(sum(real_property, 'equity'));
over.s4_23e_total_equity_vehicles = money(sum(vehicles, 'equity'));
over._fixture.why = 'An OVER-MAX record: every one of the TEN groups the map declares carries one record more than the form prints a row for. Run with --saturated it proves that overflow is DROPPED AND LOGGED rather than truncated onto the page, and adapters/pdf/assert-overflow.mjs then proves each dropped row absent from every text field of the filled PDF.';
over._fixture._the_two_page_4_totals_sum_the_PRINTED_rows_only = 'real_property and vehicles each carry five records against four printed slots, and 22e and 23e are the sum of the FOUR that fit. The page cannot print a row it has no slot for, so the printed total is the sum of what fits. A total here that included the dropped row would make gate step 11 fail for the right reason by accident, and a tripwire that fires for an accidental reason is one nobody can read.';
over._fixture._authored_by = 'Prompt 47 commit 3 for the first eight groups; scratchpad/433b-slice3-author-slice3-fixtures.mjs extended it with real_property and vehicles in Prompt 48 commit 3.';
over._generated_by = 'scratchpad/433b-slice3-author-slice3-fixtures.mjs';
writeFileSync(OVER, JSON.stringify(over, null, 1) + '\n');
console.log(`${OVER}: ${Object.keys(over).filter((k) => Array.isArray(over[k])).length} group(s), each one row over its printed max`);
