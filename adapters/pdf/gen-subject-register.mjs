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
  '433b': 'adapters/pdf/forms/f433b.pdf',
  '433d': 'adapters/pdf/forms/f433d.pdf',
};

// ── THE LOCATORS ────────────────────────────────────────────────────────────────────────
//
// Each is `[id, page, baseline, x1]`. The DRAWN STRING is not here: it is read off the page.
// An id is referenced by the pair table below, so a relation cites a quote rather than
// restating it — a restated quote is a second copy of a list with nothing asserting it
// against the first, which is the class [SB-17] and the name-lie registry both exist for.
const Q = {
  '433a': [
    ['title.1', 1, 741, 214.4],                // "Collection Information Statement for Wage"
    ['title.2', 1, 727, 230.9],                // "Earners and Self-Employed Individuals"
    ['who.wage_earners', 1, 704.6, 36],        // "Wage Earners"
    ['who.self_employed', 1, 694.2, 36],       // "Self-Employed Individuals"
    ['boundary.question', 7, 707.9, 57.6],     // "Is the business a sole proprietorship"
    ['boundary.schedule_c', 7, 707.9, 189.2],  // "(filing Schedule C)"
    ['boundary.yes', 7, 707.9, 293.9],         // "Yes, Continue with Sections 6 and 7."
    ['boundary.no', 7, 707.9, 465.7],          // "No, Complete Form 433-B."
    ['business.section7', 8, 451, 36],         // "Section 7: Sole Proprietorship Information"
  ],
  '433f': [
    ['title.1', 1, 725.2, 209.5],              // "Collection Information Statement"
    ['who.1', 3, 698.5, 36],                   // "Form 433-F is used to obtain current financial information"
    ['who.2', 3, 687.7, 36],                   // "necessary for determining how a wage earner or self-employed"
    ['who.3', 3, 676.9, 36],                   // "individual can satisfy an outstanding tax liability."
    ['business.sectionE', 3, 82.9, 36],        // "Section E – Business Information"
    ['business.when', 3, 64.9, 36],            // "Complete this section if you or your spouse are self-employed, or"
  ],
  '433aoi': [
    ['title.1', 1, 732, 182.8],                // "Collection Information Statement for Wage Earners and"
    ['title.2', 1, 718, 280.1],                // "Self-Employed Individuals"
    ['who.stem', 1, 701.5, 36],                // "Use this form if you are"
    ['who.b1', 1, 692.1, 83.5],                // "An individual who owes income tax on a Form 1040, U.S."
    ['who.b2', 1, 690.1, 342.1],               // "An individual who is personally responsible for a partnership"
    ['who.b3', 1, 668.5, 342.1],               // "An individual who is submitting an offer on behalf of the"
    ['who.b4', 1, 667, 83.6],                  // "An individual with a personal liability for Excise Tax"
    ['who.b5', 1, 651.1, 82.9],                // "An individual responsible for a Trust Fund Recovery Penalty"
    ['who.b6', 1, 635.5, 82.9],                // "An individual who is self-employed or has self-employment"
    ['business.section4', 4, 508.3, 144],      // "Self-Employed Information"
    ['business.sole_prop_q', 4, 480.1, 36],    // "Is your business a sole proprietorship"
  ],
  '433boi': [
    ['title.1', 1, 724.9, 205.2],              // "Collection Information Statement for Businesses"
    ['who.stem', 1, 703.3, 36.2],              // "Complete this form if your business is a"
    ['who.b1', 1, 688.9, 79.9],                // "Corporation"
    ['who.b2', 1, 688.9, 295.9],               // "Limited Liability Company (LLC) classified as a corporation"
    ['who.b3', 1, 674.5, 79.9],                // "Partnership"
    ['who.b4', 1, 674.5, 295.9],               // "Other LLC"
    ['exclusion.1', 1, 654.1, 36],             // "Note: If your business is a sole proprietorship do not use this form. Instead, complete Form 433-A 
    ['exclusion.2', 1, 644.5, 36],             // "Wage Earners and Self-Employed Individuals. This form should only be used with the Form 656, Offer 
    ['business.section1', 1, 610.9, 144],      // "Business Information"
  ],
  '433b': [
    ['title.1', 1, 723.6, 196.6],              // "Collection Information Statement for Businesses"
    ['entity.stem', 1, 639.5, 324],            // "Type of entity"
    ['entity.check', 1, 639.5, 374.8],         // "(Check appropriate box below)"
    ['entity.b1', 1, 628.7, 337.1],            // "Partnership"
    ['entity.b2', 1, 628.7, 399.8],            // "Corporation"
    ['entity.b3', 1, 628.7, 466.7],            // "Other"
    ['entity.b4', 1, 617.9, 337.1],            // "Limited Liability Company (LLC) classified as a corporation"
    ['entity.b5', 1, 607.1, 337.1],            // "Other LLC - Include number of members"
    ['personnel.heading', 1, 268.7, 46],       // "PARTNERS, OFFICERS, LLC MEMBERS, MAJOR SHAREHOLDERS (Foreign and Domestic), ETC."
    ['personnel.ownership_column', 1, 224.9, 367.2], // "Ownership Percentage & Shares or Interest"
    ['signer.print_name', 6, 337.9, 43.2],     // "Print Name of Officer, Partner or LLC Member"
    ['certification.stem', 6, 397.4, 96.8],    // "Under penalties of perjury, I declare that to the best of my knowledge and belief this statement of
  ],
  '433d': [
    ['title.1', 1, 752.067, 63.265],           // "433-D"
    ['title.2', 1, 745.347, 273.758],          // "Installment Agreement"
    ['who.taxpayers', 1, 717.214, 18],         // "Name and address of taxpayer(s)"
    ['who.ssn_or_ein', 1, 717.214, 302.4],     // "Social Security or Employer Identification Number (SSN/ITIN/EIN)"
    ['who.taxpayer', 1, 705.78, 302.4],        // "(Taxpayer)"
    ['who.spouse', 1, 705.78, 450],            // "(Spouse)"
    ['who.assistance_business', 1, 648.804, 302.4], // "1-800-829-3903 (Individual - Self-Employed/Business Owners, Businesses), or"
    ['who.assistance_wage', 1, 640.804, 302.4], // "1-800-829-7650 (Individuals - Wage Earners)"
    ['signer.title', 1, 223.834, 256.826],     // "(if Corporate Officer or Partner)"
    ['signer.spouse', 1, 223.834, 460.372],    // "(if a joint liability)"
    ['irs.rsi5_imf', 1, 141.394, 36],          // "RSI “5” PPIA IMF 2 year review"
    ['irs.rsi6_bmf', 1, 126.994, 36],          // "RSI “6” PPIA BMF 2 year review"
    ['agreement.stem', 1, 562.414, 18],        // "I / We agree to pay the federal taxes shown above, PLUS PENALTIES AND INTEREST PROVIDED BY LAW, as 
    ['part.1', 1, 11.794, 294.749],            // "— IRS Copy"
    ['part.2', 3, 11.794, 280.242],            // "— Taxpayer’s Copy"
  ],
};

// ── THE JUDGEMENTS ──────────────────────────────────────────────────────────────────────
//
// The one thing here that is NOT read off the page, because "who this form is about" is a
// reading of the page and not a string on it. Each carries the quote ids it is read FROM, so
// the reading can be checked against its own evidence rather than believed.
const SUBJECT = {
  '433a': {
    "subject": "A NATURAL PERSON — the individual taxpayer, wage earner or self-employed.",
    "the_legal_person": "the filer",
    "read_from": [
      "title.1",
      "title.2",
      "who.wage_earners",
      "who.self_employed"
    ],
    "where_the_business_facts_sit": "Sections 6 and 7 collect business facts, and their subject is still the individual: the printed gate at page 7 admits a SOLE PROPRIETORSHIP and sends every other entity to Form 433-B. A sole proprietorship is not a person distinct from its owner, so no fact on this form has a subject other than the filer.",
    "where_read_from": [
      "boundary.question",
      "boundary.schedule_c",
      "boundary.yes",
      "boundary.no",
      "business.section7"
    ]
  },
  '433f': {
    "subject": "A NATURAL PERSON — the individual taxpayer, wage earner or self-employed.",
    "the_legal_person": "the filer",
    "read_from": [
      "title.1",
      "who.1",
      "who.2",
      "who.3"
    ],
    "where_the_business_facts_sit": "Section E collects business facts on the printed condition \"you or your spouse are self-employed\", which is the same sole-proprietor subject 433-A admits. The form draws no entity-only branch.",
    "where_read_from": [
      "business.sectionE",
      "business.when"
    ],
    "a_note_on_where_the_sentence_is": "THIS FORM STATES ITS SUBJECT ON PAGE 3, NOT PAGE 1. 433-F carries no page-1 eligibility block at all — page 1 opens straight into the identity fields. The sentence quoted here is in the page-3 instructions. Recorded because \"the eligibility text\" is not in the same place on all four forms, and a future pass looking only at page 1 would find nothing and conclude the form declares no subject."
  },
  '433aoi': {
    "subject": "A NATURAL PERSON — an individual, in every one of the six printed bullets without exception.",
    "the_legal_person": "the filer",
    "read_from": [
      "who.stem",
      "who.b1",
      "who.b2",
      "who.b3",
      "who.b4",
      "who.b5",
      "who.b6"
    ],
    "the_grammar_is_the_evidence": "ALL SIX BULLETS BEGIN WITH \"An individual\". Two of them reach facts about another legal person — a partnership liability, and the estate of a deceased person — and in BOTH the printed grammar keeps the individual as the subject: the individual who is personally responsible for the partnership liability, the individual who is submitting an offer on behalf of the estate. The form never makes the partnership or the estate its subject. That is why a partnership-liability fact here is still a fact about the filer.",
    "where_the_business_facts_sit": "Section 4 is \"Self-Employed Information\" and its first printed question asks whether the business is a sole proprietorship. Same subject as 433-A.",
    "where_read_from": [
      "business.section4",
      "business.sole_prop_q"
    ]
  },
  '433boi': {
    "subject": "A LEGAL PERSON THAT IS NOT THE FILER — the business entity: a corporation, a partnership, an LLC classified as a corporation, or any other LLC.",
    "the_legal_person": "the business entity",
    "read_from": [
      "title.1",
      "who.stem",
      "who.b1",
      "who.b2",
      "who.b3",
      "who.b4"
    ],
    "the_grammar_is_the_evidence": "The stem is \"Complete this form if your BUSINESS is a\", and each bullet names an entity type rather than a kind of person. Every bound key on this form takes the entity as its subject; that is the ruling fields.433boi.json meta records as `the_subject_ruling`, and this is its printed basis.",
    "where_the_business_facts_sit": "The whole form. Section 1 is \"Business Information\" and there is no individual-subject section.",
    "where_read_from": [
      "business.section1",
      "exclusion.1",
      "exclusion.2"
    ]
  },
  '433b': {
    "subject": "A LEGAL PERSON THAT IS NOT THE FILER — the business entity: a partnership, a corporation, an LLC classified as a corporation, or any other LLC.",
    "the_legal_person": "the business entity",
    "_no_eligibility_text": "THERE IS NO ELIGIBILITY SENTENCE ANYWHERE ON THIS FORM. 433-B(OIC) opens \"Complete this form if your business is a\" over four bullets and then expels the sole proprietorship by name; 433-A names its subject in its own title and draws a printed gate on page 7. 433-B does neither. Between the masthead and \"Section 1: Business Information\" it prints one Note, and that Note is about completing entry spaces, not about who may file.",
    "_the_absence_was_verified_against_the_drawn_page": "adapters/pdf/tmp/p46/b-eligibility-scan.mjs joins every drawn run of each of the six pages and searches 19 enumerated phrases — \"sole propri\", \"do not use this form\", \"do not use\", \"complete this form if\", \"this form should only be used\", \"should only be used\", \"use this form\", \"instead, complete\", \"complete form 433\", \"form 433-a\", \"form 433-b\", \"433-a (oic)\", \"wage earner\", \"self-employed\", \"individual\", \"schedule c\", \"if your business is\", \"who should\", \"purpose of this form\". Seven page/phrase hits, and not one of them is eligibility text: six are the running header \"Form 433-B (Rev. 6-2026)\" and the page footer, one is page 6's \"After we review the completed Form 433-B...\", and the single hit on \"individual\" is page 3's \"List the name(s) of individuals who have access to the private key(s) and/or digital wallets\". \"sole propri\" returns ZERO on all six pages. This is a claim about the PRINTED PAGE and it was settled by reading the printed page, never by asking what the map reaches.",
    "_so_the_subject_is_read_from": "The four printed things that DO name a subject: the title, the entity list the filer must check, the Section 2 heading naming who the personnel are, and the signature block naming who signs. Three of the four exclude a natural person filing on their own behalf, and the fourth — the entity list — offers no box a sole proprietor could tick.",
    "read_from": [
      "title.1",
      "entity.stem",
      "entity.check",
      "entity.b1",
      "entity.b2",
      "entity.b3",
      "entity.b4",
      "entity.b5",
      "personnel.heading",
      "signer.print_name"
    ],
    "where_the_business_facts_sit": "EVERY fact on this form is a business fact and its subject is the entity throughout — there is no section whose subject switches to a natural person. Section 2 collects facts ABOUT natural persons (partners, officers, LLC members, major shareholders) but the subject of the record is still the entity: each row is a person's relationship TO the business, carrying an ownership percentage and a salary the business pays. That is the mirror image of 433-A, where Sections 6 and 7 collect business facts whose subject is still the individual.",
    "where_read_from": [
      "personnel.heading",
      "personnel.ownership_column",
      "signer.print_name",
      "certification.stem"
    ],
    "_the_other_form_that_names_this_one": "433-A page 7 prints \"No, Complete Form 433-B.\" on the sole-proprietorship gate, which is printed evidence about this form's subject drawn from the individual side. It is quoted in 433-A's own entry as `boundary.no` and is NOT quoted here, because a subject read off another form's page is exactly the inference this register exists to refuse. It corroborates; it does not establish."
  },
  '433d': {
    "subject": "BOTH LEGAL PERSONS, AND THE FORM DOES NOT PARTITION THEM — a natural person (alone, or jointly with a spouse) OR a business entity. 433-D is the first form in this register whose subject is not fixed by the form.",
    "the_legal_person": "whichever one the filer identifies: the taxpayer named by an SSN or ITIN, or the entity named by an EIN. The form offers both on one printed line and asks the filer to supply one.",
    "_no_eligibility_text": "THERE IS NO ELIGIBILITY SENTENCE ANYWHERE ON THIS FORM — not on page 1, and not in the INSTRUCTIONS TO TAXPAYER on page 4. This is the same absence 433-B has, and it was settled the same way, by reading the drawn page rather than by asking what a map reaches.",
    "_the_absence_was_verified_against_the_drawn_page": "Every drawn run of all four pages was joined and searched for six eligibility phrases — \"sole propri\", \"do not use\", \"complete this form if\", \"use this form\", \"who should\", \"purpose of this form\". ALL SIX RETURN ZERO ON ALL FOUR PAGES. Page 2 draws no runs at all and so returns zero for the trivial reason, which is stated rather than counted as evidence. The phrases that DO hit — \"individual\", \"business\", \"wage earner\", \"self-employed\", \"corporat\", \"employer identification\", \"joint\" — hit inside the identity block, the assistance line, the signature block and the IRS-use review codes, which are the four places the subject is read from below. None of them is a sentence about who may file.",
    "_so_the_subject_is_read_from": "FOUR PRINTED PLACES, the same four kinds 433-B was read from, and on this form they point BOTH ways rather than one way. (1) THE IDENTITY BLOCK: \"Social Security or Employer Identification Number (SSN/ITIN/EIN)\" over \"(Taxpayer)\" and \"(Spouse)\" — an SSN or ITIN names a natural person, an EIN names an entity, and the form prints them on one line as alternatives. (2) THE SIGNATURE BLOCK: \"Your signature\", \"Title (if Corporate Officer or Partner)\" and \"Spouse’s signature (if a joint liability)\" — an officer or partner signs FOR an entity, a spouse signs for a joint individual liability, and both are provided for on one row. (3) THE ASSISTANCE LINE, which names both in as many words: \"1-800-829-3903 (Individual - Self-Employed/Business Owners, Businesses)\" and \"1-800-829-7650 (Individuals - Wage Earners)\". (4) THE IRS-USE REVIEW CODES: \"RSI “5” PPIA IMF 2 year review\" and \"RSI “6” PPIA BMF 2 year review\" — the Individual Master File and the Business Master File, so the form’s own processing provides for an account of either kind. THE TITLE, unusually, names no subject at all: \"Installment Agreement\" is a statement about what the document does and not about who it is about, which is why it is quoted and then not relied on.",
    "read_from": [
      "title.1",
      "who.taxpayers",
      "who.ssn_or_ein",
      "who.taxpayer",
      "who.spouse",
      "signer.title",
      "signer.spouse",
      "who.assistance_business",
      "who.assistance_wage",
      "irs.rsi5_imf",
      "irs.rsi6_bmf"
    ],
    "_two_of_those_are_cited_for_what_they_do_not_say": "title.1 is \"433-D\" and who.taxpayers is \"Name and address of taxpayer(s)\". NEITHER NAMES A KIND OF LEGAL PERSON. They are in read_from because the subject reading rests partly on their SILENCE — every other form in this register names its subject in its title or in a bullet list, and this one has a masthead that names only the form number and an identity caption that says \"taxpayer(s)\" and stops. An absence load-bearing enough to be reasoned from is quoted and cited like any other evidence; leaving it uncited would make it an unstated premise.",
    "_pre_map": "THIS FORM HAS NO adapters/pdf/maps/433d.map.json AND THAT IS DELIBERATE. This register's own `_how_to_use_it` says to derive a new form's subject and add it here BEFORE any crosswalk, which necessarily means before the map. adapters/pdf/assert-subject-register.mjs S2 asserts both directions of the map/register correspondence and its ORPHAN direction refused exactly this state, so following the register's instruction turned the tree red — recorded and repaired in the same commit. The declaration is CHECKED, not an exemption: S2 requires that a form declaring `_pre_map` really has no map, and a form that has one and declares this anyway is a STOP.",
    "the_thing_this_form_does_that_no_other_registered_form_does": "THE SUBJECT IS PER RECORD, NOT PER FORM. Every other form in this register fixes its subject in print: 433-A(OIC) opens six bullets all beginning \"An individual\", 433-B(OIC) opens \"Complete this form if your business is a\" and expels the sole proprietorship by name. 433-D draws no such gate in either direction. One filed 433-D is about a natural person; the next is about a corporation; the form is the same form and nothing printed on it distinguishes them except which identifier the filer wrote. [R-06]’s naming test runs on the SUBJECT — and on this form the subject is not a property of the form, so the test cannot be answered once for the whole form the way it was for the other five. That is a finding about what may be built and it is recorded before any crosswalk exists, which is what this register is for.",
    "where_the_business_facts_sit": "NOWHERE, and that is the reason the ambiguity above is survivable. 433-D collects no financial statement at all — it is an agreement, not a collection information statement. Its cells are identity, the tax periods and amount owed, the payment schedule, bank routing and account numbers, signatures, and an IRS-use block. There is no section whose subject switches, because there is only ever one subject per filed copy and every cell takes it.",
    "where_read_from": [
      "agreement.stem",
      "title.2",
      "part.1",
      "part.2"
    ],
    "the_copy_structure_and_why_it_is_in_this_file": "THE FACTS SIT ON TWO COPIES, WHICH IS THE OTHER HALF OF \"where they sit\". The two page footers are quoted because the mirror construct rests on them: page 1 is \"Part 1 — IRS Copy\" and page 3 is \"Part 2 — Taxpayer’s Copy\". The two copies carry the SAME 83 cells about the SAME subject — established cell by cell, not inferred from the footers — which is what makes a one-sided binding an error rather than a choice. The full pair structure is in adapters/pdf/maps/433d.pairs.json and is not restated here."
  },
};

// ── THE PAIRS ───────────────────────────────────────────────────────────────────────────
//
// EVERY UNORDERED PAIR OF REGISTERED FORMS, ENUMERATED. The asserter derives C(n,2) from the
// register's own form list and STOPs on a missing pair, because a pair nobody decided is
// exactly the gap this register exists to close — "we never compared those two" is how leaf-
// name overlap got to stand in for subject in the first place.
const PAIRS = [
  {
    "a": "433a",
    "b": "433f",
    "relation": "COINCIDE",
    "basis_a": [
      "who.wage_earners",
      "who.self_employed"
    ],
    "basis_b": [
      "who.2"
    ],
    "why": "Both forms name the same subject in the same words — \"wage earner\"/\"self-employed individual\" — and neither admits an entity that is not the filer. A fact shared between them can take one property."
  },
  {
    "a": "433a",
    "b": "433aoi",
    "relation": "COINCIDE",
    "basis_a": [
      "title.1",
      "title.2"
    ],
    "basis_b": [
      "title.1",
      "title.2"
    ],
    "why": "The two titles are the same sentence: \"Collection Information Statement for Wage Earners and Self-Employed Individuals\". The OIC variant narrows the PURPOSE (it is used with Form 656) and not the subject."
  },
  {
    "a": "433a",
    "b": "433boi",
    "relation": "MUTUALLY EXCLUSIVE",
    "basis_a": [
      "boundary.question",
      "boundary.yes",
      "boundary.no"
    ],
    "basis_b": [
      "who.stem",
      "exclusion.1"
    ],
    "why": "DECIDED BY BOTH PAGES, FROM OPPOSITE DIRECTIONS. 433-A page 7 asks whether the business is a sole proprietorship and, on \"No\", sends the filer to Form 433-B. 433-B(OIC) page 1 admits only corporations, partnerships and LLCs and expels the sole proprietorship by name. Neither form will hold the other's subject.",
    "a_caveat_recorded_rather_than_smoothed": "433-A page 7 names Form 433-B, which is NOT 433-B(OIC) and is not in this register. The exclusion asserted here is between 433-A and 433-B(OIC) and rests on 433-B(OIC)'s OWN page-1 text, which is quoted; the 433-A quote is included because it is the same boundary drawn from the individual side, not because 433-B and 433-B(OIC) have been shown to be one subject. See `the_next_question`."
  },
  {
    "a": "433f",
    "b": "433aoi",
    "relation": "COINCIDE",
    "basis_a": [
      "who.2"
    ],
    "basis_b": [
      "who.stem",
      "who.b6"
    ],
    "why": "Both are about the individual, and both reach the self-employed individual through the same sole-proprietor route."
  },
  {
    "a": "433f",
    "b": "433boi",
    "relation": "MUTUALLY EXCLUSIVE",
    "basis_a": [
      "who.2",
      "business.when"
    ],
    "basis_b": [
      "who.stem",
      "exclusion.1"
    ],
    "why": "433-F's subject is the individual, including where it collects business facts (\"you or your spouse are self-employed\"). 433-B(OIC)'s subject is an entity that is not the filer, and it expels the sole proprietor. No fact crosses."
  },
  {
    "a": "433aoi",
    "b": "433boi",
    "relation": "MUTUALLY EXCLUSIVE",
    "basis_a": [
      "business.sole_prop_q",
      "who.stem"
    ],
    "basis_b": [
      "who.stem",
      "exclusion.1",
      "exclusion.2"
    ],
    "why": "THE SHARPEST PAIR IN THE REGISTER, AND THE ONLY ONE EITHER FORM DECIDES IN PRINT. 433-B(OIC) page 1 says that a sole proprietorship must not use it and must complete 433-A(OIC) instead — naming the other form. 433-A(OIC) page 4 asks its filer whether the business is a sole proprietorship. So the two forms partition business filers between them by printed instruction, and 113 of 113 form-specific properties on 433-B(OIC) is what that partition looks like from the property side."
  },
  {
    "a": "433b",
    "b": "433a",
    "relation": "MUTUALLY EXCLUSIVE",
    "basis_a": [
      "entity.b1",
      "entity.b2",
      "entity.b4",
      "entity.b5",
      "signer.print_name"
    ],
    "basis_b": [
      "title.1",
      "title.2",
      "boundary.question",
      "boundary.yes",
      "boundary.no"
    ],
    "why": "DECIDED BY BOTH PAGES, FROM OPPOSITE DIRECTIONS, AND ONE OF THEM NAMES THE OTHER. 433-A's title is \"Collection Information Statement for Wage Earners and Self-Employed Individuals\" and its page 7 asks \"Is the business a sole proprietorship (filing Schedule C)\" — on Yes it keeps the filer in its own Sections 6 and 7, and on No it prints \"No, Complete Form 433-B.\" 433-B's own entity list offers a partnership, a corporation, an LLC classified as a corporation and any other LLC, and its certification is signed by an \"Officer, Partner or LLC Member\" — a person signing FOR someone else. Neither form will hold the other's subject.",
    "and_the_absence_that_completes_it": "433-B prints no box a sole proprietor could tick, and the phrase \"sole propri\" appears nowhere on its six drawn pages. So the boundary 433-A draws is not contradicted from this side; it is simply not drawn again."
  },
  {
    "a": "433b",
    "b": "433f",
    "relation": "MUTUALLY EXCLUSIVE",
    "basis_a": [
      "entity.b1",
      "entity.b2",
      "entity.b4",
      "entity.b5",
      "signer.print_name"
    ],
    "basis_b": [
      "who.2"
    ],
    "why": "NEITHER FORM NAMES THE OTHER, so this rests on the two subjects alone and on nothing either page says about the other. 433-F names a wage earner or self-employed individual; 433-B names an entity whose statement is signed by an officer, partner or LLC member on its behalf. One property cannot hold both at one moment for one filer, which is the whole test.",
    "weaker_than_the_433a_pair_and_said_so": "The 433-A pair is settled by a printed gate that names Form 433-B in as many words. This one has no such sentence on either page and is decided by the two subjects being incompatible rather than by either form drawing the boundary. That is a real difference in the strength of the evidence and it is recorded rather than levelled."
  },
  {
    "a": "433b",
    "b": "433aoi",
    "relation": "MUTUALLY EXCLUSIVE",
    "basis_a": [
      "entity.b1",
      "entity.b2",
      "entity.b4",
      "entity.b5",
      "signer.print_name"
    ],
    "basis_b": [
      "title.1",
      "title.2",
      "who.stem",
      "who.b6"
    ],
    "why": "Same as the 433-F pair and for the same reason: 433-A(OIC) is about an individual in every one of its six printed bullets without exception, and 433-B is about the entity. Neither page names the other."
  },
  {
    "a": "433b",
    "b": "433boi",
    "relation": "COINCIDE",
    "basis_a": [
      "entity.b1",
      "entity.b2",
      "entity.b4",
      "entity.b5",
      "personnel.heading",
      "signer.print_name"
    ],
    "basis_b": [
      "who.stem",
      "who.b1",
      "who.b2",
      "who.b3",
      "who.b4",
      "exclusion.1"
    ],
    "why": "THE SAME FOUR ENTITY KINDS, NAMED IN THE SAME WORDS ON BOTH PAGES. 433-B(OIC) prints \"Complete this form if your business is a\" over Corporation, Limited Liability Company (LLC) classified as a corporation, Partnership, Other LLC. 433-B prints \"Type of entity (Check appropriate box below)\" over Partnership, Corporation, Limited Liability Company (LLC) classified as a corporation, Other LLC - Include number of members. Both are signed for the entity rather than by it — 433-B by an \"Officer, Partner or LLC Member\". A fact shared between these two can take one property.",
    "the_open_edge_carried_rather_than_smoothed": "THE LISTS ARE NOT IDENTICAL. 433-B prints a fifth box, \"Other\" (page 1, y 628.7, x 466.7..486.7), with a free-text cell beside it; 433-B(OIC) has no such box, and expels the sole proprietorship by name where 433-B says nothing. So on 433-B's OWN printed evidence there is no sentence closing the \"Other\" box against a sole proprietorship, and the only text that closes it is printed on 433-A. The four named kinds coincide and that is what the verdict rests on; the fifth box is an open edge, carried as [B-02] and NOT resolved.",
    "what_this_answers": "The register's own `the_next_question` asked whether 433-B shares 433-B(OIC)'s subject and recorded that it had not been shown. It is now shown, from both forms' own pages, subject to the open edge above."
  },
  {
    "a": "433d",
    "b": "433a",
    "relation": "COINCIDE",
    "basis_a": [
      "who.ssn_or_ein",
      "who.taxpayer",
      "who.spouse",
      "signer.title",
      "signer.spouse",
      "who.assistance_business",
      "who.assistance_wage",
      "irs.rsi5_imf",
      "irs.rsi6_bmf"
    ],
    "basis_b": [
      "title.1",
      "title.2",
      "who.wage_earners",
      "who.self_employed"
    ],
    "why": "COINCIDE, AND IT IS THE WEAKER KIND OF COINCIDENCE — 433-D ADMITS this subject rather than being ABOUT it. 433-D prints \"(Taxpayer)\" and \"(Spouse)\" beneath \"Social Security or Employer Identification Number (SSN/ITIN/EIN)\", provides a spouse signature line \"(if a joint liability)\", and routes wage earners to their own assistance number, \"1-800-829-7650 (Individuals - Wage Earners)\". Its IRS-use block provides for an IMF — Individual Master File — review. So a natural person is unambiguously one of the legal persons this form can be about, and a fact shared with it can take one property. What it does NOT establish is the converse: 433-D also admits an entity, so a 433-D record is only about this subject when the filer supplied an SSN or ITIN. See `the_asymmetry_this_pair_carries`.",
    "the_asymmetry_this_pair_carries": "THIS IS NOT THE SAME RELATION AS THE FIVE COINCIDENCES ALREADY IN THIS REGISTER, AND FLATTENING IT WOULD BE THE SENTENCE-SOFTENING THIS FILE REFUSES. 433-A and 433-F coincide because BOTH forms are about the individual and neither admits anything else. 433-D coincides with 433-A AND with 433-B, which are MUTUALLY EXCLUSIVE with each other — a triangle no other three forms here form. That is not a contradiction: it is what a form with no printed eligibility gate produces. The operational consequence is stated at 433-D’s `the_thing_this_form_does_that_no_other_registered_form_does`: the subject is per record, so a 433-D key’s reuse verdict cannot be settled by this axis ALONE the way the other five were. Recorded before any crosswalk, and NOT resolved here."
  },
  {
    "a": "433d",
    "b": "433f",
    "relation": "COINCIDE",
    "basis_a": [
      "who.ssn_or_ein",
      "who.taxpayer",
      "who.spouse",
      "signer.title",
      "signer.spouse",
      "who.assistance_business",
      "who.assistance_wage",
      "irs.rsi5_imf",
      "irs.rsi6_bmf"
    ],
    "basis_b": [
      "who.1",
      "who.2",
      "who.3"
    ],
    "why": "COINCIDE, AND IT IS THE WEAKER KIND OF COINCIDENCE — 433-D ADMITS this subject rather than being ABOUT it. 433-D prints \"(Taxpayer)\" and \"(Spouse)\" beneath \"Social Security or Employer Identification Number (SSN/ITIN/EIN)\", provides a spouse signature line \"(if a joint liability)\", and routes wage earners to their own assistance number, \"1-800-829-7650 (Individuals - Wage Earners)\". Its IRS-use block provides for an IMF — Individual Master File — review. So a natural person is unambiguously one of the legal persons this form can be about, and a fact shared with it can take one property. What it does NOT establish is the converse: 433-D also admits an entity, so a 433-D record is only about this subject when the filer supplied an SSN or ITIN. See `the_asymmetry_this_pair_carries`.",
    "the_asymmetry_this_pair_carries": "THIS IS NOT THE SAME RELATION AS THE FIVE COINCIDENCES ALREADY IN THIS REGISTER, AND FLATTENING IT WOULD BE THE SENTENCE-SOFTENING THIS FILE REFUSES. 433-A and 433-F coincide because BOTH forms are about the individual and neither admits anything else. 433-D coincides with 433-A AND with 433-B, which are MUTUALLY EXCLUSIVE with each other — a triangle no other three forms here form. That is not a contradiction: it is what a form with no printed eligibility gate produces. The operational consequence is stated at 433-D’s `the_thing_this_form_does_that_no_other_registered_form_does`: the subject is per record, so a 433-D key’s reuse verdict cannot be settled by this axis ALONE the way the other five were. Recorded before any crosswalk, and NOT resolved here."
  },
  {
    "a": "433d",
    "b": "433aoi",
    "relation": "COINCIDE",
    "basis_a": [
      "who.ssn_or_ein",
      "who.taxpayer",
      "who.spouse",
      "signer.title",
      "signer.spouse",
      "who.assistance_business",
      "who.assistance_wage",
      "irs.rsi5_imf",
      "irs.rsi6_bmf"
    ],
    "basis_b": [
      "who.stem",
      "who.b1",
      "who.b6"
    ],
    "why": "COINCIDE, AND IT IS THE WEAKER KIND OF COINCIDENCE — 433-D ADMITS this subject rather than being ABOUT it. 433-D prints \"(Taxpayer)\" and \"(Spouse)\" beneath \"Social Security or Employer Identification Number (SSN/ITIN/EIN)\", provides a spouse signature line \"(if a joint liability)\", and routes wage earners to their own assistance number, \"1-800-829-7650 (Individuals - Wage Earners)\". Its IRS-use block provides for an IMF — Individual Master File — review. So a natural person is unambiguously one of the legal persons this form can be about, and a fact shared with it can take one property. What it does NOT establish is the converse: 433-D also admits an entity, so a 433-D record is only about this subject when the filer supplied an SSN or ITIN. See `the_asymmetry_this_pair_carries`.",
    "the_asymmetry_this_pair_carries": "THIS IS NOT THE SAME RELATION AS THE FIVE COINCIDENCES ALREADY IN THIS REGISTER, AND FLATTENING IT WOULD BE THE SENTENCE-SOFTENING THIS FILE REFUSES. 433-A and 433-F coincide because BOTH forms are about the individual and neither admits anything else. 433-D coincides with 433-A AND with 433-B, which are MUTUALLY EXCLUSIVE with each other — a triangle no other three forms here form. That is not a contradiction: it is what a form with no printed eligibility gate produces. The operational consequence is stated at 433-D’s `the_thing_this_form_does_that_no_other_registered_form_does`: the subject is per record, so a 433-D key’s reuse verdict cannot be settled by this axis ALONE the way the other five were. Recorded before any crosswalk, and NOT resolved here."
  },
  {
    "a": "433d",
    "b": "433b",
    "relation": "COINCIDE",
    "basis_a": [
      "who.ssn_or_ein",
      "who.taxpayer",
      "who.spouse",
      "signer.title",
      "signer.spouse",
      "who.assistance_business",
      "who.assistance_wage",
      "irs.rsi5_imf",
      "irs.rsi6_bmf"
    ],
    "basis_b": [
      "entity.b1",
      "entity.b2",
      "entity.b4",
      "entity.b5",
      "signer.print_name"
    ],
    "why": "COINCIDE, AND IT IS THE WEAKER KIND OF COINCIDENCE — 433-D ADMITS this subject rather than being ABOUT it. 433-D offers an \"Employer Identification Number (EIN)\" on the same printed line as the SSN, provides a signature Title \"(if Corporate Officer or Partner)\" — a person signing FOR another legal person, which is the same evidence 433-B’s subject was read from — and routes \"Business Owners, Businesses\" to their own assistance number. Its IRS-use block provides for a BMF — Business Master File — review. So a business entity is unambiguously one of the legal persons this form can be about, and a fact shared with it can take one property. See `the_asymmetry_this_pair_carries`.",
    "the_asymmetry_this_pair_carries": "THIS IS NOT THE SAME RELATION AS THE FIVE COINCIDENCES ALREADY IN THIS REGISTER, AND FLATTENING IT WOULD BE THE SENTENCE-SOFTENING THIS FILE REFUSES. 433-A and 433-F coincide because BOTH forms are about the individual and neither admits anything else. 433-D coincides with 433-A AND with 433-B, which are MUTUALLY EXCLUSIVE with each other — a triangle no other three forms here form. That is not a contradiction: it is what a form with no printed eligibility gate produces. The operational consequence is stated at 433-D’s `the_thing_this_form_does_that_no_other_registered_form_does`: the subject is per record, so a 433-D key’s reuse verdict cannot be settled by this axis ALONE the way the other five were. Recorded before any crosswalk, and NOT resolved here."
  },
  {
    "a": "433d",
    "b": "433boi",
    "relation": "COINCIDE",
    "basis_a": [
      "who.ssn_or_ein",
      "who.taxpayer",
      "who.spouse",
      "signer.title",
      "signer.spouse",
      "who.assistance_business",
      "who.assistance_wage",
      "irs.rsi5_imf",
      "irs.rsi6_bmf"
    ],
    "basis_b": [
      "who.stem",
      "who.b1",
      "who.b2",
      "who.b3",
      "who.b4"
    ],
    "why": "COINCIDE, AND IT IS THE WEAKER KIND OF COINCIDENCE — 433-D ADMITS this subject rather than being ABOUT it. 433-D offers an \"Employer Identification Number (EIN)\" on the same printed line as the SSN, provides a signature Title \"(if Corporate Officer or Partner)\" — a person signing FOR another legal person, which is the same evidence 433-B’s subject was read from — and routes \"Business Owners, Businesses\" to their own assistance number. Its IRS-use block provides for a BMF — Business Master File — review. So a business entity is unambiguously one of the legal persons this form can be about, and a fact shared with it can take one property. See `the_asymmetry_this_pair_carries`.",
    "the_asymmetry_this_pair_carries": "THIS IS NOT THE SAME RELATION AS THE FIVE COINCIDENCES ALREADY IN THIS REGISTER, AND FLATTENING IT WOULD BE THE SENTENCE-SOFTENING THIS FILE REFUSES. 433-A and 433-F coincide because BOTH forms are about the individual and neither admits anything else. 433-D coincides with 433-A AND with 433-B, which are MUTUALLY EXCLUSIVE with each other — a triangle no other three forms here form. That is not a contradiction: it is what a form with no printed eligibility gate produces. The operational consequence is stated at 433-D’s `the_thing_this_form_does_that_no_other_registered_form_does`: the subject is per record, so a 433-D key’s reuse verdict cannot be settled by this axis ALONE the way the other five were. Recorded before any crosswalk, and NOT resolved here. AND THIS PAIR CARRIES ONE MORE THING: 433-B(OIC) EXPELS THE SOLE PROPRIETORSHIP BY NAME and 433-D expels nothing, so a sole proprietor who may not use 433-B(OIC) may use 433-D. The coincidence is over the four named entity kinds only."
  },
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
      '433-H': 'NOT DERIVED. Zero AcroForm fields; a feasibility question rather than a form. Its subject cannot be established the way every entry here was, because the method is to quote a locator on a drawn page and re-read it on every run, and an XFA-only document has no drawn page this engine reads.',
      _and_the_two_that_left_this_list: 'ENTRIES ARE REMOVED FROM HERE ONLY WHEN THEY APPEAR ABOVE, never because they stopped being interesting. 433-B was derived in prompt 46 and 433-D in prompt 52, and each is now a full entry with its own quotes. This note exists because both sat in this list, marked NOT DERIVED, for a cycle AFTER they had been derived — the register on disk carried a 433-B entry and a "433-B: NOT DERIVED" line at the same time — which is a list contradicting the document that holds it.',
    },
    the_next_question:
      'CAN A FORM WITH NO PRINTED ELIGIBILITY GATE BE CROSSWALKED ON THIS AXIS AT ALL? 433-D COINCIDES WITH ALL FIVE other registered forms, including with two — 433-A and 433-B — that are MUTUALLY EXCLUSIVE with each other. That is not a contradiction in the register; it is what a form that partitions nobody produces, and 433-D partitions nobody: it offers an SSN or an EIN on one printed line, a spouse signature and a corporate-officer title in one row, and IMF and BMF review codes in one block. THE CONSEQUENCE IS OPERATIONAL AND IT IS NOT SETTLED HERE. [R-06]\'s naming test runs on the SUBJECT, and every previous form fixed its subject in print, so the test could be answered once for the whole form. On 433-D the subject is fixed by the FILER, per record. So a 433-D key that looks like an existing individual property and a 433-D key that looks like an existing entity property may BOTH be right, for different filers, through the same cell. What decides a 433-D reuse is therefore not this axis alone, and the thing that decides it has not been built. It is carried as [D-21] and must be answered BEFORE 433-D\'s crosswalk, not during it.',
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
