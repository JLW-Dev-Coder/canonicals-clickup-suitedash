// Bring adapters/pdf/gen-subject-register.mjs back into agreement with the register it generates,
// and add 433-D.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THIS IS A REPAIR AND NOT JUST AN ADDITION
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `node adapters/pdf/gen-subject-register.mjs --check` EXITS 2 on the tree as it stands. The
// generator declares FOUR forms and six pairs; the register on disk holds FIVE forms, 47 quotes
// and ten pairs. 433-B's locators, subject and four pair verdicts are in the JSON and are in no
// generator — so the artefact cannot be regenerated, and `meta.generator` has been naming a tool
// that would DESTROY a form's worth of content if anybody ran it.
//
// It is the second thing [R-30] found, and it is the same shape as the first: a generator of a
// finished form's artefact that nothing re-runs. `--check` has existed the whole time and is in
// no npm script.
//
// SO 433-B'S HALF IS NOT RE-TYPED. It is read out of the register and written into the generator
// verbatim, because a hand-transcribed copy of 47 quotes and four verdicts is a second list with
// nothing asserting it against the first — and the whole file exists to refuse exactly that.
// 433-D's half is authored here, and its locators come from scratchpad/p52-433d-locators.mjs,
// which resolves each one against the drawn page and STOPs on a spec matching zero runs or more
// than one.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve as resolveLocators } from './p52-433d-locators.mjs';

const GEN = 'adapters/pdf/gen-subject-register.mjs';
const REG = 'adapters/pdf/maps/_subjects.cross-form.json';
const reg = JSON.parse(readFileSync(REG, 'utf8'));
const src = readFileSync(GEN, 'utf8');
const lines = src.split('\n');

// ── 433-D's LOCATORS, RESOLVED AGAINST THE PAGE ────────────────────────────────────────────
const { rows: locs, problems } = await resolveLocators();
if (problems.length) { for (const p of problems) console.error(`  ${p}`); process.exit(2); }

// ── 433-D's SUBJECT — the one authored thing here ──────────────────────────────────────────
const SUBJECT_433D = {
  subject: 'BOTH LEGAL PERSONS, AND THE FORM DOES NOT PARTITION THEM — a natural person (alone, or jointly with a spouse) OR a business entity. 433-D is the first form in this register whose subject is not fixed by the form.',
  the_legal_person: 'whichever one the filer identifies: the taxpayer named by an SSN or ITIN, or the entity named by an EIN. The form offers both on one printed line and asks the filer to supply one.',
  _no_eligibility_text: 'THERE IS NO ELIGIBILITY SENTENCE ANYWHERE ON THIS FORM — not on page 1, and not in the INSTRUCTIONS TO TAXPAYER on page 4. This is the same absence 433-B has, and it was settled the same way, by reading the drawn page rather than by asking what a map reaches.',
  _the_absence_was_verified_against_the_drawn_page: 'Every drawn run of all four pages was joined and searched for six eligibility phrases — "sole propri", "do not use", "complete this form if", "use this form", "who should", "purpose of this form". ALL SIX RETURN ZERO ON ALL FOUR PAGES. Page 2 draws no runs at all and so returns zero for the trivial reason, which is stated rather than counted as evidence. The phrases that DO hit — "individual", "business", "wage earner", "self-employed", "corporat", "employer identification", "joint" — hit inside the identity block, the assistance line, the signature block and the IRS-use review codes, which are the four places the subject is read from below. None of them is a sentence about who may file.',
  _so_the_subject_is_read_from: 'FOUR PRINTED PLACES, the same four kinds 433-B was read from, and on this form they point BOTH ways rather than one way. (1) THE IDENTITY BLOCK: "Social Security or Employer Identification Number (SSN/ITIN/EIN)" over "(Taxpayer)" and "(Spouse)" — an SSN or ITIN names a natural person, an EIN names an entity, and the form prints them on one line as alternatives. (2) THE SIGNATURE BLOCK: "Your signature", "Title (if Corporate Officer or Partner)" and "Spouse’s signature (if a joint liability)" — an officer or partner signs FOR an entity, a spouse signs for a joint individual liability, and both are provided for on one row. (3) THE ASSISTANCE LINE, which names both in as many words: "1-800-829-3903 (Individual - Self-Employed/Business Owners, Businesses)" and "1-800-829-7650 (Individuals - Wage Earners)". (4) THE IRS-USE REVIEW CODES: "RSI “5” PPIA IMF 2 year review" and "RSI “6” PPIA BMF 2 year review" — the Individual Master File and the Business Master File, so the form’s own processing provides for an account of either kind. THE TITLE, unusually, names no subject at all: "Installment Agreement" is a statement about what the document does and not about who it is about, which is why it is quoted and then not relied on.',
  read_from: ['who.ssn_or_ein', 'who.taxpayer', 'who.spouse', 'signer.title', 'signer.spouse', 'who.assistance_business', 'who.assistance_wage', 'irs.rsi5_imf', 'irs.rsi6_bmf'],
  the_thing_this_form_does_that_no_other_registered_form_does: 'THE SUBJECT IS PER RECORD, NOT PER FORM. Every other form in this register fixes its subject in print: 433-A(OIC) opens six bullets all beginning "An individual", 433-B(OIC) opens "Complete this form if your business is a" and expels the sole proprietorship by name. 433-D draws no such gate in either direction. One filed 433-D is about a natural person; the next is about a corporation; the form is the same form and nothing printed on it distinguishes them except which identifier the filer wrote. [R-06]’s naming test runs on the SUBJECT — and on this form the subject is not a property of the form, so the test cannot be answered once for the whole form the way it was for the other five. That is a finding about what may be built and it is recorded before any crosswalk exists, which is what this register is for.',
  where_the_business_facts_sit: 'NOWHERE, and that is the reason the ambiguity above is survivable. 433-D collects no financial statement at all — it is an agreement, not a collection information statement. Its cells are identity, the tax periods and amount owed, the payment schedule, bank routing and account numbers, signatures, and an IRS-use block. There is no section whose subject switches, because there is only ever one subject per filed copy and every cell takes it.',
  where_read_from: ['agreement.stem', 'title.2'],
  the_copy_structure_and_why_it_is_in_this_file: 'The two page footers are quoted because the mirror construct rests on them: page 1 is "Part 1 — IRS Copy" and page 3 is "Part 2 — Taxpayer’s Copy". The two copies carry the SAME 83 cells about the SAME subject, which is what makes a one-sided binding an error rather than a choice. The full pair structure is established in adapters/pdf/maps/433d.pairs.json and is not restated here.',
};

// ── 433-D's PAIRS — five, one against each registered form ─────────────────────────────────
const BOTH = ['who.ssn_or_ein', 'who.taxpayer', 'who.spouse', 'signer.title', 'signer.spouse', 'who.assistance_business', 'who.assistance_wage', 'irs.rsi5_imf', 'irs.rsi6_bmf'];
const SHARED_WHY_INDIVIDUAL = 'COINCIDE, AND IT IS THE WEAKER KIND OF COINCIDENCE — 433-D ADMITS this subject rather than being ABOUT it. 433-D prints "(Taxpayer)" and "(Spouse)" beneath "Social Security or Employer Identification Number (SSN/ITIN/EIN)", provides a spouse signature line "(if a joint liability)", and routes wage earners to their own assistance number, "1-800-829-7650 (Individuals - Wage Earners)". Its IRS-use block provides for an IMF — Individual Master File — review. So a natural person is unambiguously one of the legal persons this form can be about, and a fact shared with it can take one property. What it does NOT establish is the converse: 433-D also admits an entity, so a 433-D record is only about this subject when the filer supplied an SSN or ITIN. See `the_asymmetry_this_pair_carries`.';
const SHARED_WHY_ENTITY = 'COINCIDE, AND IT IS THE WEAKER KIND OF COINCIDENCE — 433-D ADMITS this subject rather than being ABOUT it. 433-D offers an "Employer Identification Number (EIN)" on the same printed line as the SSN, provides a signature Title "(if Corporate Officer or Partner)" — a person signing FOR another legal person, which is the same evidence 433-B’s subject was read from — and routes "Business Owners, Businesses" to their own assistance number. Its IRS-use block provides for a BMF — Business Master File — review. So a business entity is unambiguously one of the legal persons this form can be about, and a fact shared with it can take one property. See `the_asymmetry_this_pair_carries`.';
const ASYMMETRY = 'THIS IS NOT THE SAME RELATION AS THE FIVE COINCIDENCES ALREADY IN THIS REGISTER, AND FLATTENING IT WOULD BE THE SENTENCE-SOFTENING THIS FILE REFUSES. 433-A and 433-F coincide because BOTH forms are about the individual and neither admits anything else. 433-D coincides with 433-A AND with 433-B, which are MUTUALLY EXCLUSIVE with each other — a triangle no other three forms here form. That is not a contradiction: it is what a form with no printed eligibility gate produces. The operational consequence is stated at 433-D’s `the_thing_this_form_does_that_no_other_registered_form_does`: the subject is per record, so a 433-D key’s reuse verdict cannot be settled by this axis ALONE the way the other five were. Recorded before any crosswalk, and NOT resolved here.';

const PAIRS_433D = [
  { a: '433d', b: '433a', relation: 'COINCIDE', basis_a: BOTH, basis_b: ['title.1', 'title.2', 'who.wage_earners', 'who.self_employed'], why: SHARED_WHY_INDIVIDUAL, the_asymmetry_this_pair_carries: ASYMMETRY },
  { a: '433d', b: '433f', relation: 'COINCIDE', basis_a: BOTH, basis_b: ['who.1', 'who.2', 'who.3'], why: SHARED_WHY_INDIVIDUAL, the_asymmetry_this_pair_carries: ASYMMETRY },
  { a: '433d', b: '433aoi', relation: 'COINCIDE', basis_a: BOTH, basis_b: ['who.stem', 'who.b1', 'who.b6'], why: SHARED_WHY_INDIVIDUAL, the_asymmetry_this_pair_carries: ASYMMETRY },
  { a: '433d', b: '433b', relation: 'COINCIDE', basis_a: BOTH, basis_b: ['entity.b1', 'entity.b2', 'entity.b4', 'entity.b5', 'signer.print_name'], why: SHARED_WHY_ENTITY, the_asymmetry_this_pair_carries: ASYMMETRY },
  { a: '433d', b: '433boi', relation: 'COINCIDE', basis_a: BOTH, basis_b: ['who.stem', 'who.b1', 'who.b2', 'who.b3', 'who.b4'], why: SHARED_WHY_ENTITY, the_asymmetry_this_pair_carries: ASYMMETRY + ' AND THIS PAIR CARRIES ONE MORE THING: 433-B(OIC) EXPELS THE SOLE PROPRIETORSHIP BY NAME and 433-D expels nothing, so a sole proprietor who may not use 433-B(OIC) may use 433-D. The coincidence is over the four named entity kinds only.' },
];

// ── SPLICE ─────────────────────────────────────────────────────────────────────────────────
//
// By line index against a block opener and the next line that is exactly `};` or `];` at column
// zero. Anchored on line PREFIXES and spliced by index, never by matching a quoted blob — a
// heredoc'd blob with escaped quotes is what silently failed to match twice in this repo's
// history, and it fails by changing NOTHING while reporting success.
const spliceBlock = (ls, opener, closer, body) => {
  const start = ls.findIndex((l) => l.startsWith(opener));
  if (start < 0) throw new Error(`opener not found: ${opener}`);
  let end = -1;
  for (let i = start; i < ls.length; i++) if (ls[i] === closer) { end = i; break; }
  if (end < 0) throw new Error(`closer ${closer} not found after ${opener}`);
  return [...ls.slice(0, start), ...body, ...ls.slice(end + 1)];
};

const j = (o) => JSON.stringify(o, null, 2).split('\n').map((l, i) => (i ? '  ' + l : l)).join('\n');

let ls = lines;

ls = spliceBlock(ls, 'export const FORM_FILE = {', '};', [
  'export const FORM_FILE = {',
  "  '433a': 'adapters/pdf/forms/f433a.pdf',",
  "  '433f': 'adapters/pdf/forms/f433f.pdf',",
  "  '433aoi': 'adapters/pdf/forms/f433aoi.pdf',",
  "  '433boi': 'adapters/pdf/forms/f433boi.pdf',",
  "  '433b': 'adapters/pdf/forms/f433b.pdf',",
  "  '433d': 'adapters/pdf/forms/f433d.pdf',",
  '};',
]);

const qBody = ['const Q = {'];
for (const form of ['433a', '433f', '433aoi', '433boi', '433b', '433d']) {
  qBody.push(`  '${form}': [`);
  const quotes = form === '433d'
    ? locs.map((r) => [r.id, r.page, r.y, r.x1, r.text])
    : Object.entries(reg.forms[form].quotes).map(([id, q]) => [id, q.page, q.y, q.x1, q.text]);
  for (const [id, page, y, x1, text] of quotes) qBody.push(`    ['${id}', ${page}, ${y}, ${x1}],`.padEnd(46) + ` // ${JSON.stringify(text).slice(0, 100)}`);
  qBody.push('  ],');
}
qBody.push('};');
ls = spliceBlock(ls, 'const Q = {', '};', qBody);

const sBody = ['const SUBJECT = {'];
for (const form of ['433a', '433f', '433aoi', '433boi', '433b', '433d']) {
  const obj = form === '433d' ? SUBJECT_433D : (() => { const { form_file, quotes, ...rest } = reg.forms[form]; return rest; })();
  sBody.push(`  '${form}': ${j(obj)},`);
}
sBody.push('};');
ls = spliceBlock(ls, 'const SUBJECT = {', '};', sBody);

const existing = reg.pairs;
const allPairs = [...existing, ...PAIRS_433D];
const pBody = ['const PAIRS = ['];
for (const p of allPairs) pBody.push(`  ${j(p)},`);
pBody.push('];');
ls = spliceBlock(ls, 'const PAIRS = [', '];', pBody);

writeFileSync(GEN, ls.join('\n'));
console.log(`${GEN} rewritten: 6 forms, ${allPairs.length} pairs (C(6,2) = ${(6 * 5) / 2}), 433-D contributing ${locs.length} locators.`);
