// THE CROSS-FORM SUBJECT REGISTER — WHO EACH FORM IS ABOUT, QUOTED FROM THE PRINTED PAGE.
//
//   node adapters/pdf/gen-subject-register.mjs [--check]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Prompt 43 found that 433-B(OIC) reuses nothing — 113 of 113 form-specific, `exact` used
// zero times — not because its questions are new (62 of them are a predecessor's word for
// word) but because its SUBJECT is. Two forms can ask an identical printed question about
// different legal persons, and one shared property would then have to hold two values for
// one filer at one moment.
//
// The sequencing decision that preceded it had been made on LEAF-NAME OVERLAP, which measures
// authoring cost. Property reuse runs on SUBJECT. Those are different axes and they had been
// conflated. This file is the axis, written down once so a future pass READS it instead of
// re-deriving it, and instead of reasoning from leaf names again.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY A GENERATOR AND NOT A HAND-WRITTEN DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A subject register is a document about what forms SAY. Its whole value is that the sentences
// in it are the sentences the IRS drew, so a transcription is worse than nothing: it reads
// exactly as authoritative and is one keystroke from being false. So this file holds LOCATORS
// and JUDGEMENTS, and the quoted text is pulled out of the PDF at generation time. Nothing in
// the artefact's `text` fields is typed here.
//
// adapters/pdf/assert-subject-register.mjs then re-derives every quote from the page bytes on
// every run, so the artefact cannot drift from the forms even if a blank is replaced.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE y CONVENTION
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// text-baseline, the one page-geometry.mjs declares. A locator is (page, y-baseline, x1), and
// all three must match a run readPrintedText actually holds. Registered in Y_REPORTERS.

import { readFileSync, writeFileSync } from 'node:fs';
import { readPrintedText, baselineOfRun } from './page-geometry.mjs';
import { assertGenerator, selfPath, generatorMeta } from '../hubspot/generator-guard.mjs';

export const REGISTER = 'adapters/pdf/maps/_subjects.cross-form.json';
export const FORM_FILE = {
  '433a': 'adapters/pdf/forms/f433a.pdf',
  '433f': 'adapters/pdf/forms/f433f.pdf',
  '433aoi': 'adapters/pdf/forms/f433aoi.pdf',
  '433boi': 'adapters/pdf/forms/f433boi.pdf',
};

// ── THE LOCATORS ────────────────────────────────────────────────────────────────────────
//
// Each is `[id, page, baseline, x1]`. The DRAWN STRING is not here: it is read off the page.
// An id is referenced by the pair table below, so a relation cites a quote rather than
// restating it — a restated quote is a second copy of a list with nothing asserting it
// against the first, which is the class [SB-17] and the name-lie registry both exist for.
const Q = {
  '433a': [
    ['title.1', 1, 741.0, 214.4],
    ['title.2', 1, 727.0, 230.9],
    ['who.wage_earners', 1, 704.6, 36.0],
    ['who.self_employed', 1, 694.2, 36.0],
    ['boundary.question', 7, 707.9, 57.6],
    ['boundary.schedule_c', 7, 707.9, 189.2],
    ['boundary.yes', 7, 707.9, 293.9],
    ['boundary.no', 7, 707.9, 465.7],
    ['business.section7', 8, 451.0, 36.0],
  ],
  '433f': [
    ['title.1', 1, 725.2, 209.5],
    ['who.1', 3, 698.5, 36.0],
    ['who.2', 3, 687.7, 36.0],
    ['who.3', 3, 676.9, 36.0],
    ['business.sectionE', 3, 82.9, 36.0],
    ['business.when', 3, 64.9, 36.0],
  ],
  '433aoi': [
    ['title.1', 1, 732.0, 182.8],
    ['title.2', 1, 718.0, 280.1],
    ['who.stem', 1, 701.5, 36.0],
    ['who.b1', 1, 692.1, 83.5],
    ['who.b2', 1, 690.1, 342.1],
    ['who.b3', 1, 668.5, 342.1],
    ['who.b4', 1, 667.0, 83.6],
    ['who.b5', 1, 651.1, 82.9],
    ['who.b6', 1, 635.5, 82.9],
    ['business.section4', 4, 508.3, 144.0],
    ['business.sole_prop_q', 4, 480.1, 36.0],
  ],
  '433boi': [
    ['title.1', 1, 724.9, 205.2],
    ['who.stem', 1, 703.3, 36.2],
    ['who.b1', 1, 688.9, 79.9],
    ['who.b2', 1, 688.9, 295.9],
    ['who.b3', 1, 674.5, 79.9],
    ['who.b4', 1, 674.5, 295.9],
    ['exclusion.1', 1, 654.1, 36.0],
    ['exclusion.2', 1, 644.5, 36.0],
    ['business.section1', 1, 610.9, 144.0],
  ],
};

// ── THE JUDGEMENTS ──────────────────────────────────────────────────────────────────────
//
// The one thing here that is NOT read off the page, because "who this form is about" is a
// reading of the page and not a string on it. Each carries the quote ids it is read FROM, so
// the reading can be checked against its own evidence rather than believed.
const SUBJECT = {
  '433a': {
    subject: 'A NATURAL PERSON — the individual taxpayer, wage earner or self-employed.',
    the_legal_person: 'the filer',
    read_from: ['title.1', 'title.2', 'who.wage_earners', 'who.self_employed'],
    where_the_business_facts_sit: 'Sections 6 and 7 collect business facts, and their subject is still the individual: the printed gate at page 7 admits a SOLE PROPRIETORSHIP and sends every other entity to Form 433-B. A sole proprietorship is not a person distinct from its owner, so no fact on this form has a subject other than the filer.',
    where_read_from: ['boundary.question', 'boundary.schedule_c', 'boundary.yes', 'boundary.no', 'business.section7'],
  },
  '433f': {
    subject: 'A NATURAL PERSON — the individual taxpayer, wage earner or self-employed.',
    the_legal_person: 'the filer',
    read_from: ['title.1', 'who.1', 'who.2', 'who.3'],
    where_the_business_facts_sit: 'Section E collects business facts on the printed condition "you or your spouse are self-employed", which is the same sole-proprietor subject 433-A admits. The form draws no entity-only branch.',
    where_read_from: ['business.sectionE', 'business.when'],
    a_note_on_where_the_sentence_is: 'THIS FORM STATES ITS SUBJECT ON PAGE 3, NOT PAGE 1. 433-F carries no page-1 eligibility block at all — page 1 opens straight into the identity fields. The sentence quoted here is in the page-3 instructions. Recorded because "the eligibility text" is not in the same place on all four forms, and a future pass looking only at page 1 would find nothing and conclude the form declares no subject.',
  },
  '433aoi': {
    subject: 'A NATURAL PERSON — an individual, in every one of the six printed bullets without exception.',
    the_legal_person: 'the filer',
    read_from: ['who.stem', 'who.b1', 'who.b2', 'who.b3', 'who.b4', 'who.b5', 'who.b6'],
    the_grammar_is_the_evidence: 'ALL SIX BULLETS BEGIN WITH "An individual". Two of them reach facts about another legal person — a partnership liability, and the estate of a deceased person — and in BOTH the printed grammar keeps the individual as the subject: the individual who is personally responsible for the partnership liability, the individual who is submitting an offer on behalf of the estate. The form never makes the partnership or the estate its subject. That is why a partnership-liability fact here is still a fact about the filer.',
    where_the_business_facts_sit: 'Section 4 is "Self-Employed Information" and its first printed question asks whether the business is a sole proprietorship. Same subject as 433-A.',
    where_read_from: ['business.section4', 'business.sole_prop_q'],
  },
  '433boi': {
    subject: 'A LEGAL PERSON THAT IS NOT THE FILER — the business entity: a corporation, a partnership, an LLC classified as a corporation, or any other LLC.',
    the_legal_person: 'the business entity',
    read_from: ['title.1', 'who.stem', 'who.b1', 'who.b2', 'who.b3', 'who.b4'],
    the_grammar_is_the_evidence: 'The stem is "Complete this form if your BUSINESS is a", and each bullet names an entity type rather than a kind of person. Every bound key on this form takes the entity as its subject; that is the ruling fields.433boi.json meta records as `the_subject_ruling`, and this is its printed basis.',
    where_the_business_facts_sit: 'The whole form. Section 1 is "Business Information" and there is no individual-subject section.',
    where_read_from: ['business.section1', 'exclusion.1', 'exclusion.2'],
  },
};

// ── THE PAIRS ───────────────────────────────────────────────────────────────────────────
//
// EVERY UNORDERED PAIR OF REGISTERED FORMS, ENUMERATED. The asserter derives C(n,2) from the
// register's own form list and STOPs on a missing pair, because a pair nobody decided is
// exactly the gap this register exists to close — "we never compared those two" is how leaf-
// name overlap got to stand in for subject in the first place.
const PAIRS = [
  { a: '433a', b: '433f', relation: 'COINCIDE',
    basis_a: ['who.wage_earners', 'who.self_employed'], basis_b: ['who.2'],
    why: 'Both forms name the same subject in the same words — "wage earner"/"self-employed individual" — and neither admits an entity that is not the filer. A fact shared between them can take one property.' },
  { a: '433a', b: '433aoi', relation: 'COINCIDE',
    basis_a: ['title.1', 'title.2'], basis_b: ['title.1', 'title.2'],
    why: 'The two titles are the same sentence: "Collection Information Statement for Wage Earners and Self-Employed Individuals". The OIC variant narrows the PURPOSE (it is used with Form 656) and not the subject.' },
  { a: '433a', b: '433boi', relation: 'MUTUALLY EXCLUSIVE',
    basis_a: ['boundary.question', 'boundary.yes', 'boundary.no'], basis_b: ['who.stem', 'exclusion.1'],
    why: 'DECIDED BY BOTH PAGES, FROM OPPOSITE DIRECTIONS. 433-A page 7 asks whether the business is a sole proprietorship and, on "No", sends the filer to Form 433-B. 433-B(OIC) page 1 admits only corporations, partnerships and LLCs and expels the sole proprietorship by name. Neither form will hold the other\'s subject.',
    a_caveat_recorded_rather_than_smoothed: '433-A page 7 names Form 433-B, which is NOT 433-B(OIC) and is not in this register. The exclusion asserted here is between 433-A and 433-B(OIC) and rests on 433-B(OIC)\'s OWN page-1 text, which is quoted; the 433-A quote is included because it is the same boundary drawn from the individual side, not because 433-B and 433-B(OIC) have been shown to be one subject. See `the_next_question`.' },
  { a: '433f', b: '433aoi', relation: 'COINCIDE',
    basis_a: ['who.2'], basis_b: ['who.stem', 'who.b6'],
    why: 'Both are about the individual, and both reach the self-employed individual through the same sole-proprietor route.' },
  { a: '433f', b: '433boi', relation: 'MUTUALLY EXCLUSIVE',
    basis_a: ['who.2', 'business.when'], basis_b: ['who.stem', 'exclusion.1'],
    why: '433-F\'s subject is the individual, including where it collects business facts ("you or your spouse are self-employed"). 433-B(OIC)\'s subject is an entity that is not the filer, and it expels the sole proprietor. No fact crosses.' },
  { a: '433aoi', b: '433boi', relation: 'MUTUALLY EXCLUSIVE',
    basis_a: ['business.sole_prop_q', 'who.stem'], basis_b: ['who.stem', 'exclusion.1', 'exclusion.2'],
    why: 'THE SHARPEST PAIR IN THE REGISTER, AND THE ONLY ONE EITHER FORM DECIDES IN PRINT. 433-B(OIC) page 1 says that a sole proprietorship must not use it and must complete 433-A(OIC) instead — naming the other form. 433-A(OIC) page 4 asks its filer whether the business is a sole proprietorship. So the two forms partition business filers between them by printed instruction, and 113 of 113 form-specific properties on 433-B(OIC) is what that partition looks like from the property side.' },
];

// THE GENERATOR DECLARATION LIVES UNDER `meta`, BECAUSE THAT IS THE KEY THE GUARD READS.
// adapters/hubspot/generator-guard.mjs reads `doc.meta.generator` — one spelling, one place.
// Spread at the top level it reads exactly like a declaration and is invisible to the assertion,
// which is a declaration nobody checks: the shape ruling 7 is about, in the file that carries it.
const header = (self) => ({
  _what_this_is:
    'WHO EACH MAPPED FORM IS ABOUT, quoted from its own printed eligibility text, and which subjects are mutually exclusive and which coincide. This is the axis PROPERTY REUSE runs on. It is not the axis authoring cost runs on — that is leaf-name overlap, which is a different measurement and was conflated with this one for eight prompts.',
  _the_rule:
    'THE NAMING TEST IS ABOUT THE SUBJECT, NOT THE QUESTION. Two forms can ask an identical printed question about different legal persons. One property would then have to hold two values for one filer at one moment, which no property can do. So `same-question-different-subject` is not a special case of the middle four categories: it is the axis the whole test was always running on, and it was only named in Prompt 43.',
  _how_to_use_it:
    'BEFORE any crosswalk. Derive the new form\'s subject from its printed eligibility text, add it here, and compare it against every form already registered. If it COINCIDES with one, reuse is live and the middle-four categories decide each fact. If it is MUTUALLY EXCLUSIVE with all of them, every fact is form-specific whatever the leaf names look like — that is the 433-B(OIC) result, and eleven shared leaf names had suggested the opposite.',
  _y_convention: 'text-baseline — the one adapters/pdf/page-geometry.mjs declares. A locator is (page, baseline, x1) and every quote is re-derived from the PDF by adapters/pdf/assert-subject-register.mjs on every run.',
  _nothing_here_is_transcribed:
    'Every `text` field is read out of the form\'s page bytes at generation time and re-read on every assertion. The judgements are the only authored prose, and each names the quote ids it is read from.',
});

/** Build the register from the page bytes. */
export const buildRegister = async (self) => {
  const forms = {};
  for (const [form, file] of Object.entries(FORM_FILE)) {
    const pages = await readPrintedText(readFileSync(file));
    const quotes = {};
    for (const [id, page, y, x1] of Q[form]) {
      const hit = (pages[page - 1]?.items || []).find(
        (t) => Math.abs(baselineOfRun(t) - y) <= 0.05 && Math.abs(t.x1 - x1) <= 0.05);
      if (!hit) throw new Error(
        `SUBJECT REGISTER — ${form} locator ${id} names p${page} baseline ${y} x1 ${x1} and the page draws no run there.\n` +
        `  A locator that resolves to nothing cannot be quoted, and quoting it from memory is the thing this generator exists to prevent.`);
      quotes[id] = { page, y: +baselineOfRun(hit).toFixed(1), x1: +hit.x1.toFixed(1), x2: +hit.x2.toFixed(1), text: hit.str };
    }
    forms[form] = { form_file: file, ...SUBJECT[form], quotes };
  }
  return {
    meta: {
      ...header(self),
      ...generatorMeta(self, { generated_from: 'the printed page bytes of adapters/pdf/forms/*.pdf, at the locators declared in ' + self }),
    },
    forms,
    pairs: PAIRS,
    _not_in_this_register: {
      '433-B': 'NOT DERIVED. Its subject is what decides whether 433-B(OIC)\'s 113 form-specific properties were the right answer or an artefact of reading one form. Derive it from 433-B\'s own printed eligibility text when 433-B opens, and compare it against all four here BEFORE any crosswalk reasoning. If it shares a subject with 433-B(OIC), the reuse picture is nothing like what eleven shared leaf names suggested. Deriving it now was excluded by the prompt\'s scope line.',
      '433-D': 'NOT DERIVED. No map, and its mirror construct ([D-01]) is a page problem rather than a subject one — but the subject is still derived before its crosswalk, not after.',
      '433-H': 'NOT DERIVED. Zero AcroForm fields; a feasibility question rather than a form.',
    },
    the_next_question:
      'DOES 433-B SHARE 433-B(OIC)\'s SUBJECT? 433-A page 7 sends a non-sole-proprietor to Form 433-B, and 433-B(OIC) page 1 admits corporations, partnerships and LLCs — which LOOKS like one subject stated by two forms. It has not been shown. Nothing in this register asserts it, and the 433-A/433-B(OIC) pair above records the caveat rather than smoothing it, because a subject assumed is the exact failure this file was written to stop.',
    _count: { forms: Object.keys(forms).length, quotes: Object.values(forms).reduce((n, f) => n + Object.keys(f.quotes).length, 0), pairs: PAIRS.length },
  };
};

if (process.argv[1] && /gen-subject-register\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const self = selfPath(process.argv[1]);
  const doc = await buildRegister(self);

  // --check IS RULING 7 FOR THIS ARTEFACT: the claim in meta.generator is asserted by
  // REGENERATING and comparing, not by the named file merely existing. The comparison is on
  // the serialised bytes, so a hand-added key anywhere in the document is a difference.
  if (process.argv.includes('--check')) {
    const wrote = readFileSync(REGISTER, 'utf8');
    const would = JSON.stringify(doc, null, 1) + '\n';
    const drift = wrote === would ? [] : [`${REGISTER} is not what ${self} produces. Regenerate it, or declare the co-authorship and enumerate every hand-added key.`];
    if (drift.length) {
      console.error(`GENERATOR CLAIM — ${drift.length} problem(s):`);
      drift.forEach((d) => console.error(`  ${d}`));
      process.exit(2);
    }
    console.log(`OK — 0 difference(s): ${REGISTER} regenerates byte-identical from ${self} (${doc._count.quotes} quote(s) re-read from the page).`);
    process.exit(0);
  }

  assertGenerator(REGISTER, self);
  writeFileSync(REGISTER, JSON.stringify(doc, null, 1) + '\n');
  console.log(`wrote ${REGISTER} — ${doc._count.forms} form(s), ${doc._count.quotes} quote(s), ${doc._count.pairs} pair(s)`);
}
