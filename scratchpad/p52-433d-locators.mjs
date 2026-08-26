// Resolve 433-D's subject locators from the printed page, so the generator's Q block is emitted
// with coordinates READ OFF THE PAGE rather than transcribed from a terminal dump.
//
// Each spec is (id, page, exact drawn string). A spec matching zero runs is a STOP; a spec
// matching MORE THAN ONE is also a STOP, because 433-D draws page 3 as a copy of page 1 and a
// string that occurs twice on one page would give a locator that resolves to whichever came
// first — which is the silent wrong answer this whole file exists to avoid.
import { readFileSync } from 'node:fs';
import { readPrintedText, baselineOfRun } from '../adapters/pdf/page-geometry.mjs';

export const SPECS = [
  // The title. It names the form and, unusually, no subject at all.
  // Disambiguated by x1: "433-D" is drawn TWICE on page 1, in the masthead and in the footer.
  // The ambiguity guard below found that on the first run, which is the guard working; the
  // masthead is the one that names the form, so its x1 is given and the footer is excluded.
  ['title.1', 1, '433-D', 63.265],
  ['title.2', 1, 'Installment Agreement'],
  // The identity block — the strongest printed evidence, because it offers BOTH legal persons
  // on one line and asks the filer to choose.
  ['who.taxpayers', 1, 'Name and address of taxpayer(s)'],
  ['who.ssn_or_ein', 1, 'Social Security or Employer Identification Number (SSN/ITIN/EIN)'],
  ['who.taxpayer', 1, '(Taxpayer)'],
  ['who.spouse', 1, '(Spouse)'],
  // The assistance line, which names both kinds of filer in as many words.
  ['who.assistance_business', 1, '1-800-829-3903 (Individual - Self-Employed/Business Owners, Businesses), or'],
  ['who.assistance_wage', 1, '1-800-829-7650 (Individuals - Wage Earners)'],
  // The signature block — who may sign, and therefore for whom.
  ['signer.title', 1, '(if Corporate Officer or Partner)'],
  ['signer.spouse', 1, '(if a joint liability)'],
  // The IRS-use review codes. IMF is the Individual Master File and BMF the Business Master
  // File: the form's own processing provides for an account of either kind.
  ['irs.rsi5_imf', 1, 'RSI “5” PPIA IMF 2 year review'],
  ['irs.rsi6_bmf', 1, 'RSI “6” PPIA BMF 2 year review'],
  // The agreement sentence: what the subject is agreeing to, in the first person plural.
  ['agreement.stem', 1, 'I / We agree to pay the federal taxes shown above, PLUS PENALTIES AND INTEREST PROVIDED BY LAW, as follows'],
  // The two page footers that establish the copy structure the mirror rests on.
  ['part.1', 1, '— IRS Copy'],
  ['part.2', 3, '— Taxpayer’s Copy'],
];

export const resolve = async () => {
  const pages = await readPrintedText(readFileSync('adapters/pdf/forms/f433d.pdf'));
  const rows = [], problems = [];
  for (const [id, page, text, x1Hint] of SPECS) {
    const items = pages[page - 1]?.items || [];
    const hits = items.filter((t) => t.str === text && (x1Hint === undefined || Math.abs(t.x1 - x1Hint) <= 0.05));
    if (hits.length === 0) { problems.push(`NO RUN     ${id}: page ${page} draws no run whose text is exactly ${JSON.stringify(text)}.`); continue; }
    if (hits.length > 1) { problems.push(`AMBIGUOUS  ${id}: page ${page} draws ${hits.length} runs with that exact text; a locator would silently take the first.`); continue; }
    const h = hits[0];
    rows.push({ id, page, y: +baselineOfRun(h).toFixed(3), x1: +h.x1.toFixed(3), text: h.str });
  }
  return { rows, problems };
};

if (process.argv[1] && /p52-433d-locators\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const { rows, problems } = await resolve();
  for (const r of rows) console.log(`    ['${r.id}', ${r.page}, ${r.y}, ${r.x1}],`.padEnd(48) + ` // ${JSON.stringify(r.text).slice(0, 90)}`);
  if (problems.length) { console.error(''); for (const p of problems) console.error(`  ${p}`); process.exit(2); }
  console.log(`\n${rows.length} of ${SPECS.length} locator(s) resolved to exactly one drawn run each.`);
}
