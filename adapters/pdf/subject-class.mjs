// THE SUBJECT DISCRIMINATOR. THREE CLASSES, NOT TWO.
//
//   node adapters/pdf/subject-class.mjs --canary          # prove the classifier in all three
//                                                           classes, both sides, both directions
//   node adapters/pdf/subject-class.mjs --markers <form>  # every printed run each marker matches
//
//   exit 0 = every planted phrase classified as declared
//   exit 2 = a plant classified wrongly, or a marker list lost its citation
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THERE ARE THREE, AND WHAT THE BINARY GOT WRONG
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The discriminator was first ruled as a binary: a cell whose printed caption admits BOTH legal
// persons is subject-dependent, everything else is subject-independent. 433-D does not partition
// under it. The form draws THREE relations between a cell and the subject:
//
//   DEPENDENT     the caption admits both subjects and the cell's value changes KIND with the
//                 one the record declares. "Social Security or Employer Identification Number
//                 (SSN/ITIN/EIN)" is one caption over one cell. It routes: two properties, and
//                 a declared discriminator chooses between them.
//
//   INDEPENDENT   the caption names no subject and states no condition. A bank routing number
//                 is a bank routing number on either. It binds once.
//
//   CONDITIONAL   the cell EXISTS FOR ONE SUBJECT ONLY, and the caption says so. "Title (if
//                 Corporate Officer or Partner)" and "Spouse's signature (if a joint liability)"
//                 are the two the signature row draws. It gets an EMPTINESS ASSERTION, not a
//                 route: on a record declaring the other subject the cell must be empty, and a
//                 value there is a STOP.
//
// NEITHER CONDITIONAL CAPTION ADMITS BOTH SUBJECTS -- each admits exactly one -- so the binary's
// test called both of them subject-INDEPENDENT, which is the opposite of the truth about them. A
// conditional cell is ONE FACT THAT IS SOMETIMES ABSENT, not two facts, and not a fact whose
// subject does not matter. Building the discriminator as a binary would have spent headroom on
// properties that can only ever be empty, or let an entity record carrying a spouse signature
// pass unchecked. Both directions fail, which is why this is three classes and not two.
//
// ALL THREE ARE DECLARATIONS AND ALL THREE ARE CHECKED. A cell with NO class is a STOP --
// adapters/pdf/assert-subject-class.mjs holds that, along with the obligation each class incurs.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// CLASSIFY FROM THE CAPTION'S OWN WORDS. PROXIMITY ANSWERS A DIFFERENT QUESTION.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The neighbourhood band answers WHICH CAPTION GOVERNS THIS CELL. That is the pairing question,
// and it is answered by geometry. WHICH CLASS THAT CAPTION CARRIES is a different question and
// the caption answers it directly, from its own words, with no geometry in it at all.
//
// THE DEFECT THIS SEPARATION REPAIRS IS THE JOIN. The first derivation collected every printed
// run in a cell's neighbourhood, JOINED THEM INTO ONE STRING, and asked whether the string named
// both legal persons. Joining destroys the caption boundary: "Title (if Corporate Officer or
// Partner)" and "Spouse's signature (if a joint liability)" are two CONDITIONAL captions, and
// their concatenation is a string that names both subjects and reads as DEPENDENT. Two cells
// that exist for one subject each became two cells whose subject does not matter, by an
// operation that has nothing to do with either caption.
//
// So the unit of classification here is ONE PRINTED RUN. Never a join, never a neighbourhood.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A MARKER IS A PHRASE QUOTED FROM THE EVIDENCE, MATCHED ON WORD BOUNDARIES
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Every marker below is quoted from adapters/pdf/maps/_subjects.cross-form.json's own
// `_so_the_subject_is_read_from`, which was authored before this file and names the four printed
// places 433-D's subject is read from. `quoted_from` on each entry says which.
//
// TWO MARKERS THE FIRST DERIVATION CARRIED ARE NOT HERE, AND EACH IS REMOVED ON EVIDENCE RATHER
// THAN ON RESULT. `--markers` enumerates every printed run each candidate matches, so the ground
// is a derivation anyone can re-run and not an assertion:
//
//   `Taxpayer` was an INDIVIDUAL marker. On 433-D page 1 it matches "Name and address of
//   taxpayer(s)", "(Taxpayer)" and the debit-payments note. The subject register says of the
//   first, in as many words: "NEITHER NAMES A KIND OF LEGAL PERSON". An entity is a taxpayer.
//   The word distinguishes taxpayer from SPOUSE, which is a different axis from individual
//   against entity, and the marker's own stated ground was true of the printed PAIR
//   "(Taxpayer)"/"(Spouse)" and was applied to one word of it.
//
//   `Business` was an ENTITY marker. It matches FOUR runs on page 1 and THREE of them are not
//   statements about a legal person: "(Work, cell or business)" is a telephone number an
//   individual may have, and "three (3) business days" and "fourteen (14) business days" are
//   durations in the ACH paragraph. It is replaced by the phrases the register actually quotes --
//   "Business Owners" and "Businesses" -- neither of which matches any of the three.
//
// AND ONE MATCH IS THE REASON THE MATCHING IS ON WORD BOUNDARIES RATHER THAN ON SUBSTRINGS.
// `ITIN` as a bare substring matches "...either orally or in wr-ITIN-g at least three (3)
// business days...". A marker for a taxpayer identification number, firing on the word WRITING,
// inside the one paragraph on the page that is pure boilerplate. It is [R-17]'s class one level
// out: a predicate that matches something it was never meant to match, silently, and whose
// wrongness is invisible in its source. Every marker is compiled with a word boundary each end,
// and the two probe lists below are what prove the boundaries survived the authoring path.

import { readFileSync } from 'node:fs';
import { rx } from './regex-self-assert.mjs';

// ── THE MARKERS ────────────────────────────────────────────────────────────────────────────
export const SUBJECTS_REGISTER = 'adapters/pdf/maps/_subjects.cross-form.json';

export const INDIVIDUAL = [
  { phrase: 'Social Security', quoted_from: 'the identity block -- "Social Security or Employer Identification Number (SSN/ITIN/EIN)"' },
  { phrase: 'SSN', quoted_from: 'the identity block -- "(SSN/ITIN/EIN)"' },
  { phrase: 'ITIN', quoted_from: 'the identity block -- "(SSN/ITIN/EIN)"' },
  { phrase: 'Spouse', quoted_from: 'the identity sub-caption "(Spouse)" and the signature block "Spouse’s signature"' },
  { phrase: 'joint liability', quoted_from: 'the signature block -- "(if a joint liability)"' },
  { phrase: 'Wage Earner', quoted_from: 'the assistance line -- "1-800-829-7650 (Individuals - Wage Earners)"' },
  { phrase: 'IMF', quoted_from: 'the IRS-use review codes -- "RSI “5” PPIA IMF 2 year review", the Individual Master File' },
  { phrase: 'Individual', quoted_from: 'the assistance line -- "1-800-829-3903 (Individual - Self-Employed/Business Owners, Businesses)"' },
];

export const ENTITY = [
  { phrase: 'Employer Identification', quoted_from: 'the identity block -- "Social Security or Employer Identification Number"' },
  { phrase: 'EIN', quoted_from: 'the identity block -- "(SSN/ITIN/EIN)"' },
  { phrase: 'Corporate Officer', quoted_from: 'the signature block -- "Title (if Corporate Officer or Partner)"' },
  { phrase: 'Partner', quoted_from: 'the signature block -- "Title (if Corporate Officer or Partner)"' },
  { phrase: 'BMF', quoted_from: 'the IRS-use review codes -- "RSI “6” PPIA BMF 2 year review", the Business Master File' },
  { phrase: 'Business Owner', quoted_from: 'the assistance line -- "(Individual - Self-Employed/Business Owners, Businesses)"' },
  { phrase: 'Businesses', quoted_from: 'the assistance line -- "(Individual - Self-Employed/Business Owners, Businesses)"' },
];

/** The candidates the first derivation carried and this one does not, kept so `--markers` can
 *  show what each matches rather than leaving the removal as an assertion. */
export const WITHDRAWN = [
  { phrase: 'Taxpayer', was: 'individual', why: 'the subject register says of "Name and address of taxpayer(s)": "NEITHER NAMES A KIND OF LEGAL PERSON". An entity is a taxpayer.' },
  { phrase: 'Business', was: 'entity', why: 'matches "(Work, cell or business)" and two "business days" runs in the ACH paragraph. Replaced by "Business Owner" and "Businesses", which are what the register quotes.' },
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ONE REGEX PER SIDE, built from the phrase lists and self-asserting at load. It carries
// backslashes, so [R-17] applies to it: the probes below are what stand between a word boundary
// surviving the authoring path and a marker list that matches the whole page or none of it.
//
// THE TRAILING PLURAL IS PART OF THE CONSTRUCTION AND THE PROBES ARE WHY IT IS HERE. The first
// draft closed with a bare word boundary and REFUSED TO LOAD, naming its own first probe: the
// assistance line prints "1-800-829-7650 (Individuals - Wage Earners)", so the marker quoted
// from it is singular and the page is plural, and `\bWage Earner\b` matches nothing at all. The
// same held for "Individuals" and "Business Owners". So the trailing boundary tolerates one `s`,
// and the tolerance is itself probed in both directions -- "Individualism" is a reject, because
// a plural tolerance that became a prefix match would quietly re-open every substring defect
// this file's word boundaries exist to close. That failure at load is [R-17] working rather than
// being described: the marker list would otherwise have been three markers short and silent.
const sideRx = (id, list, spec) => rx(id, new RegExp('\\b(?:' + list.map((m) => escape(m.phrase)).join('|') + ')s?\\b', 'gi'), spec);

const RX_INDIVIDUAL = sideRx('RX-SC-01', INDIVIDUAL, {
  why: 'every INDIVIDUAL subject marker 433-D prints, matched on word boundaries. The rejects are the whole reason the boundaries are there: ITIN as a bare substring fires on WRITING, in the ACH boilerplate, and Taxpayer -- which this list no longer carries -- fired on "Name and address of taxpayer(s)", a caption the subject register itself says names no kind of legal person.',
  matches: ['Social Security or Employer Identification Number (SSN/ITIN/EIN)', 'Spouse’s signature', '(if a joint liability)', '1-800-829-7650 (Individuals - Wage Earners)', 'RSI “5” PPIA IMF 2 year review', '(Spouse)'],
  rejects: ['contacting my financial institution either orally or in writing at least three (3) business days', 'Name and address of taxpayer(s)', '(Taxpayer)', 'a. Routing number', 'Agreement Review Cycle', 'Individualism is not a legal person'],
});

const RX_ENTITY = sideRx('RX-SC-02', ENTITY, {
  why: 'every ENTITY subject marker 433-D prints, matched on word boundaries. The rejects carry the second withdrawal: the bare token Business matched "(Work, cell or business)" -- a telephone number an individual may have -- and both "business days" runs in the ACH paragraph, so the list quotes "Business Owner" and "Businesses" instead, which are the phrases the subject register reads the entity side from.',
  matches: ['Social Security or Employer Identification Number (SSN/ITIN/EIN)', '(if Corporate Officer or Partner)', 'RSI “6” PPIA BMF 2 year review', '1-800-829-3903 (Individual - Self-Employed/Business Owners, Businesses), or'],
  rejects: ['(Work, cell or business)', 'are at least fourteen (14) business days before the next scheduled electronic funds transfer', 'Your signature', 'b. Account number'],
});

const hits = (text, re) => [...new Set(String(text).match(re) || [])];

// ── THE CLASSIFIER ─────────────────────────────────────────────────────────────────────────
export const CLASSES = ['dependent', 'conditional', 'independent'];

/**
 * The class of ONE printed caption, from its own words.
 *
 *   both sides named   -> dependent   (the caption admits both legal persons)
 *   exactly one named  -> conditional (the caption restricts the cell to that one)
 *   neither named      -> independent (the caption names no subject and states no condition)
 *
 * THE MIDDLE CASE IS THE ONE THE BINARY THREW AWAY. Its predicate was
 * `individual.length > 0 && entity.length > 0`, and the exclusive-or fell out of the expression
 * into the else branch, where it was indistinguishable from a caption that names nobody. The
 * three-way split is the same measurement with that branch given its own name.
 *
 * "STATES A CONDITION" IS NOT A SEPARATE TEST. A caption naming exactly one legal person IS
 * stating the condition that restricts the cell to it -- "(if Corporate Officer or Partner)"
 * names the entity side and no other, "(if a joint liability)" the individual side and no other,
 * and "RSI 5 PPIA IMF 2 year review" names the Individual Master File and no other. Looking for
 * the word "if" as well would make the class turn on a wording rather than on the subject, and
 * RSI 5 and RSI 6 print no "if" at all.
 */
export const classifyCaption = (text) => {
  const individual = hits(text, RX_INDIVIDUAL);
  const entity = hits(text, RX_ENTITY);
  if (individual.length && entity.length) return { class: 'dependent', side: null, individual, entity };
  if (individual.length) return { class: 'conditional', side: 'individual', individual, entity };
  if (entity.length) return { class: 'conditional', side: 'entity', individual, entity };
  return { class: 'independent', side: null, individual, entity };
};

// ── A CAPTION CHAIN, AND WHY CONDITIONAL OUTRANKS DEPENDENT ────────────────────────────────
//
// A cell can be governed by more than one caption: a section caption saying WHAT KIND of fact
// the cell holds, and a sub-caption saying WHOSE. 433-D prints exactly that over the identity
// boxes -- "Social Security or Employer Identification Number (SSN/ITIN/EIN)" spans both, and
// "(Taxpayer)" and "(Spouse)" sit under one box each.
//
// THE CHAIN'S CLASS IS THE MOST RESTRICTIVE LINK, and the precedence is not a preference:
//
//   CONDITIONAL OVER DEPENDENT is SUBSUMPTION. A cell that exists for one subject only has no
//   second subject to route to. Routing it would create a property that can only ever be empty,
//   and -- worse -- it would LOSE the emptiness assertion, which is the only thing that would
//   stop an entity record carrying a spouse's SSN. Both failure directions of the binary,
//   avoided by one ordering. The spouse identity box is the instance: its section caption offers
//   SSN or EIN, and its sub-caption "(Spouse)" says an entity has none.
//
//   DEPENDENT OVER INDEPENDENT is the standing bias. Over-inclusion costs one property;
//   under-inclusion writes an entity's EIN into an individual's SSN property.
//
// This runs over a DECLARED chain, never over a neighbourhood. That is what makes the precedence
// safe: the first derivation's blob would have made "conditional" the answer for every cell
// within 120pt of the RSI column, and each of those would have been a false emptiness assertion
// firing on a correctly filled form -- which is [R-10], a guard tuned to fire constantly. A
// declared chain is checked by adapters/pdf/assert-subject-class.mjs against the band, so it
// cannot name a caption from elsewhere on the page.
const RANK = { conditional: 0, dependent: 1, independent: 2 };

export const classOfChain = (captions) => {
  if (!Array.isArray(captions) || !captions.length)
    return { class: null, side: null, side_ambiguous: null, decided_by: null, links: [] };
  const links = captions.map((c) => ({ caption: c, ...classifyCaption(c) }));
  const best = [...links].sort((a, b) => RANK[a.class] - RANK[b.class])[0];
  const sides = [...new Set(links.filter((l) => l.class === 'conditional').map((l) => l.side))];
  return {
    class: best.class,
    side: best.class === 'conditional' && sides.length === 1 ? sides[0] : null,
    side_ambiguous: best.class === 'conditional' && sides.length > 1 ? sides : null,
    decided_by: best.caption,
    links,
  };
};

// ── THE CANARY -- ALL THREE CLASSES, BOTH SIDES, BOTH DIRECTIONS ───────────────────────────
//
// Every plant is a phrase 433-D actually prints, or a chain 433-D actually draws, so what is
// proved is that this classifier reads THIS FORM and not that it reads a fixture written to
// please it. Each class is planted with cases that must land in it AND with cases that must not,
// because a class that can only be confirmed and never refused is the vacuous guard one level
// down.
const CAPTION_CASES = [
  ['a  the identity line names both legal persons', 'Social Security or Employer Identification Number (SSN/ITIN/EIN)', 'dependent', null],
  ['b  the assistance line names both', '1-800-829-3903 (Individual - Self-Employed/Business Owners, Businesses), or', 'dependent', null],
  ['c  the signature title restricts to the entity side', '(if Corporate Officer or Partner)', 'conditional', 'entity'],
  ['d  the spouse condition restricts to the individual side', '(if a joint liability)', 'conditional', 'individual'],
  ['e  RSI 5 names the Individual Master File and no other', 'RSI “5” PPIA IMF 2 year review', 'conditional', 'individual'],
  ['f  RSI 6 names the Business Master File and no other', 'RSI “6” PPIA BMF 2 year review', 'conditional', 'entity'],
  ['g  RSI 1 names no subject at all', 'RSI “1” no further review', 'independent', null],
  ['h  a routing number caption names neither', 'a. Routing number', 'independent', null],
  ['i  the caption over the whole identity block names neither', 'Name and address of taxpayer(s)', 'independent', null],
  ['j  a work telephone is not an entity', '(Work, cell or business)', 'independent', null],
  ['k  ACH boilerplate is not an ITIN and is not a business', 'contacting my financial institution either orally or in writing at least three (3) business days before the next scheduled electronic funds transfer', 'independent', null],
  ['l  the taxpayer sub-caption names no KIND of legal person', '(Taxpayer)', 'independent', null],
  ['m  the spouse sub-caption does', '(Spouse)', 'conditional', 'individual'],
];

const CHAIN_CASES = [
  ['n  the JOIN that produced the defect must NOT read as dependent when the links are read separately',
    ['Title', '(if Corporate Officer or Partner)'], 'conditional', 'entity'],
  ['o  and neither must the other half of the same printed row',
    ['Spouse’s signature', '(if a joint liability)'], 'conditional', 'individual'],
  ['p  a section caption naming both over a sub-caption naming neither stays dependent',
    ['Social Security or Employer Identification Number (SSN/ITIN/EIN)', '(Taxpayer)'], 'dependent', null],
  ['q  the same section caption under a RESTRICTING sub-caption is subsumed to conditional',
    ['Social Security or Employer Identification Number (SSN/ITIN/EIN)', '(Spouse)'], 'conditional', 'individual'],
  ['r  a chain of two silent captions is independent',
    ['Your telephone numbers', '(Home)'], 'independent', null],
];

export const CANARY_COUNT = CAPTION_CASES.length + CHAIN_CASES.length + 3;

export const canary = () => {
  const dead = [];
  for (const [name, text, wantClass, wantSide] of CAPTION_CASES) {
    const got = classifyCaption(text);
    if (got.class !== wantClass) dead.push(`CANARY DEAD  caption ${name}: classified ${got.class}, declared ${wantClass} -- ${JSON.stringify(text.slice(0, 80))}`);
    else if (wantClass === 'conditional' && got.side !== wantSide) dead.push(`CANARY DEAD  caption ${name}: conditional on the ${got.side} side, declared ${wantSide}`);
  }
  for (const [name, chain, wantClass, wantSide] of CHAIN_CASES) {
    const got = classOfChain(chain);
    if (got.class !== wantClass) dead.push(`CANARY DEAD  chain ${name}: classified ${got.class}, declared ${wantClass} -- ${JSON.stringify(chain)}`);
    else if (wantClass === 'conditional' && got.side !== wantSide) dead.push(`CANARY DEAD  chain ${name}: conditional on the ${got.side ?? '(ambiguous)'} side, declared ${wantSide}`);
  }
  // THE JOIN, PLANTED AS THE DEFECT IT WAS. The four signature-row captions concatenated must
  // read DEPENDENT -- that is what the first derivation did, and it is why it was wrong. If this
  // ever stops reading dependent, the plant has stopped reproducing the defect it stands for and
  // the repair beside it is being proved against nothing.
  const joined = classifyCaption(['Title', '(if Corporate Officer or Partner)', 'Spouse’s signature', '(if a joint liability)'].join(' '));
  if (joined.class !== 'dependent') dead.push(`CANARY DEAD  the JOIN of the four signature-row captions classified ${joined.class}. The whole point of the repair is that joining them produces "dependent" out of four captions none of which is, and the plant no longer reproduces it.`);
  // AND THE UNCLASSED DIRECTION.
  if (classOfChain([]).class !== null) dead.push('CANARY DEAD  an empty chain produced a class. A cell with no caption has no class, and a class invented for it is the silence this construct exists to refuse.');
  // AND THE CITATIONS.
  const uncited = [...INDIVIDUAL, ...ENTITY].filter((m) => !m.quoted_from);
  if (uncited.length) dead.push(`CANARY DEAD  ${uncited.length} marker(s) carry no quoted_from: ${uncited.map((m) => m.phrase).join(', ')}. A marker with no citation is an invented one.`);
  return dead;
};

// ── CLI ────────────────────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('adapters/pdf/subject-class.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  if (argv.includes('--markers')) {
    const form = argv[argv.indexOf('--markers') + 1] || '433d';
    const { readPrintedText } = await import('./page-geometry.mjs');
    const pages = await readPrintedText(readFileSync(`adapters/pdf/forms/f${form}.pdf`));
    const runs = pages[0].items.map((r) => r.str);
    console.log(`MARKER ENUMERATION -- every page-1 run of ${form} that each candidate matches (${runs.length} run(s) read)`);
    for (const [side, list] of [['individual', INDIVIDUAL], ['entity', ENTITY]]) {
      for (const m of list) {
        const re = new RegExp('\\b' + escape(m.phrase) + '\\b', 'i');
        const h = runs.filter((s) => re.test(s));
        console.log(`\n  [${side}] ${m.phrase}  -- ${h.length} run(s); quoted from ${m.quoted_from}`);
        h.forEach((s) => console.log(`      ${JSON.stringify(s.slice(0, 130))}`));
      }
    }
    console.log('\n  WITHDRAWN candidates, shown with what they match so the removal is a derivation and not an assertion:');
    for (const w of WITHDRAWN) {
      const re = new RegExp('\\b' + escape(w.phrase) + '\\b', 'i');
      const h = runs.filter((s) => re.test(s));
      console.log(`\n  [was ${w.was}] ${w.phrase}  -- ${h.length} run(s). ${w.why}`);
      h.forEach((s) => console.log(`      ${JSON.stringify(s.slice(0, 130))}`));
    }
    console.log('');
  }
  const dead = canary();
  console.log(`subject-class canary: ${CANARY_COUNT - dead.length} of ${CANARY_COUNT} -- ${CAPTION_CASES.length} caption(s) and ${CHAIN_CASES.length} chain(s) across all three classes and both sides, plus the JOIN that produced the defect, the empty chain that must produce no class at all, and the marker citations.`);
  console.log(`markers: ${INDIVIDUAL.length} individual, ${ENTITY.length} entity, each with a quoted_from into ${SUBJECTS_REGISTER}; ${WITHDRAWN.length} withdrawn on evidence -- run --markers to see what each matched.`);
  if (dead.length) { dead.forEach((d) => console.error(`  ${d}`)); process.exit(2); }
}
