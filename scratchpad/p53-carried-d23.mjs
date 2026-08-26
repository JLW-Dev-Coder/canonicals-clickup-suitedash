// [D-23] — 433-D draws THREE subject relations, not two, and the derived list shows it.
//
//   node scratchpad/p53-carried-d23.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/_carried.cross-form.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));

if (doc.open.some((x) => x.id === 'D-23') || doc.resolved.some((x) => x.id === 'D-23'))
  throw new Error('[D-23] already exists — this script is not idempotent by design, so re-running it is a STOP rather than a duplicate.');

doc.open.push({
  id: 'D-23',
  form: '433-D, and it bears on [D-21] before [D-21] can be built',
  raised_in: 'Prompt 53, deriving the subject-dependent binding list from the printed page as ruling 3 requires, BEFORE binding anything',

  subject: 'THE RULING\'S BINARY DOES NOT PARTITION THIS FORM. Ruling 3 says "only a cell whose printed caption admits both subjects is subject-dependent". Read against the page, 433-D draws THREE relations between a cell and the subject, not two, and the third has no slot in that sentence.',

  the_three_relations: 'ONE — SUBJECT-DEPENDENT. One printed cell whose VALUE CHANGES KIND with the subject. The identity block is the clear case: "Social Security or Employer Identification Number (SSN/ITIN/EIN)" is one caption over one cell, and an SSN goes in it for a natural person and an EIN for an entity. TWO — SUBJECT-INDEPENDENT. A bank routing number is a bank routing number on either, and 69 of the 83 stems derive this way. THREE — SUBJECT-CONDITIONAL, WHICH IS THE ONE WITH NO SLOT. The cell EXISTS for one subject and not the other, and its printed caption says so in as many words: "Title (if Corporate Officer or Partner)" is drawn only to be filled when an entity is the filer, and "Spouse\'s signature (if a joint liability)" only when a natural person is. Neither caption admits both subjects — each admits exactly ONE — so the ruling\'s test classifies both as subject-INDEPENDENT, which is the opposite of the truth about them. A subject-independent cell is one every record fills the same way; these are cells one subject must leave empty.',

  why_it_matters_before_the_construct_and_not_after: 'BECAUSE THE TWO KINDS EARN DIFFERENT CHECKS, AND THE CHECK IS THE CONSTRUCT. A subject-DEPENDENT cell needs two properties and a route between them — that is [D-21]\'s candidate (3), one declared input routing each ambiguous key. A subject-CONDITIONAL cell needs no second property at all; it needs an EMPTINESS assertion, which is the shape adapters/pdf/record-shape.mjs already carries as `operands_empty_and_total_present`. Building the discriminator as a binary would either split the conditional cells into two properties each — spending headroom on a property that can only ever be empty — or leave them unchecked, so that an entity record carrying a spouse signature would pass. Ruling 3 requires both branches to be checkable, and on the conditional cells the checkable thing is the ABSENCE.',

  what_the_derivation_actually_returned: 'FOURTEEN of 83 stems, from scratchpad/p53-433d-derive-subject-dependence.mjs, which reads every printed run in a derived neighbourhood of each page-1 widget and asks whether any of it names both legal persons. The neighbourhood is 24.6pt above / 12.3pt below / 120pt either side, set from the form\'s own median row pitch of 12.30pt rather than typed. The predicate is planted with eight phrases in both directions and passes 8/8. THE FOURTEEN ARE NOT FOURTEEN FINDINGS. The derivation is declared to fail towards OVER-inclusion, on the ground that an over-included cell costs headroom and an under-included one writes an entity value into an individual property — and the over-inclusion is visibly active.',

  the_instrument_artefact_that_proves_the_over_inclusion: 'RSI5 AND RSI6 ARE THE SAME PRINTED PAIR AND THEY LANDED ON OPPOSITE SIDES OF THE VERDICT. The IRS-use block draws "RSI “5” PPIA IMF 2 year review" and "RSI “6” PPIA BMF 2 year review" one row apart — IMF is the Individual Master File and BMF the Business Master File, so the pair is a subject choice by construction. The derivation returned RSI6 as subject-dependent and RSI5 as subject-INDEPENDENT, purely because of where the band fell relative to each checkbox. Two cells of one printed pair cannot honestly receive opposite verdicts from a reading of the page, so that split is a fact about the instrument and not about the form. AgreementReviewCycle1 through 6 and AI2 arrive in the list the same way, by sitting inside the same tight block; OrWrite arrives because the assistance line — which captions nothing and instructs the reader — is printed beside it.',

  why_the_instrument_was_not_retuned: 'BECAUSE THAT IS FITTING THE INSTRUMENT TO THE WANTED ANSWER, WHICH IS WHAT [D-22] REFUSES TO DO TO correlate-labels\' PROBES. Narrowing the band until RSI5 and RSI6 agree would be choosing a constant because it produces the classification already believed. And the single-caption question the narrowing would be reaching for is exactly the question this form\'s correlator CANNOT answer: [D-22] records correlate-labels answering 433-D\'s "b. Account number" probe with the DIRECT DEBIT banner one row up, because 28.6pt above beat 28.9pt left. There is no labels file for this form and there must not be one, so a per-cell caption is not available to be read, and the honest instrument is the weak neighbourhood question with its bias declared.',

  what_would_settle_it: 'A THIRD STATE IN THE DECLARATION, not a better band. If [D-21]\'s discriminator names three relations — dependent, conditional, independent — then each cell earns a check the page supports: a dependent cell routes between two properties, a conditional cell asserts the other subject leaves it EMPTY, and an independent cell is bound once and takes neither. The 14 then need reading one at a time against their own printed caption, and each reading goes into the evidence table with its printed marker as first witness — which is the per-cell work the bindings commit is for, and which is safe to do once the construct can express the answer. Doing it the other way round is what ruling 3 means by discovering it too late.',

  the_bound_this_places_on_headroom: 'THE PROJECTION MOVES, AND ONLY IN THE SAFE DIRECTION. [R-32]\'s bound for 433-D is one property per distinct leaf stem — 83, floor 0 — against a headroom of 116. A subject-DEPENDENT stem costs TWO, so the bound becomes 83 + (number of dependent stems), and on the derived 14 that is at most 97, still inside 116. A subject-CONDITIONAL stem costs ONE, because the second subject\'s value for it is not a value but an absence. NO SINGLE NUMBER BETWEEN 83 AND 97 IS STATED: which of the 14 are dependent and which conditional is exactly what is unsettled here, and a figure that assumed the split would be the invented reuse rate [R-29] and [R-07] each name from a different side.',

  the_ruling: 'RAISED AND NOT RESOLVED, under [R-20]. It is a question about what [D-21] IS, and ruling 3\'s own ordering — the discriminator settled before the crosswalk, not during it — applies one level further in: the discriminator\'s STATE SET has to be settled before the discriminator is built, not while binding 83 stems against it. The derived list is reported in full above and in the run output, with the phrase that admitted each of the 14, so the reading is available rather than summarised.',

  built_when: 'Not built. The derivation is at scratchpad/p53-433d-derive-subject-dependence.mjs and is re-runnable; nothing is bound and no map exists for this form.',
  status: 'OPEN',
});

doc._count = { open: doc.open.length, resolved: doc.resolved.length };
writeFileSync(P, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`[D-23] raised. open=${doc._count.open} resolved=${doc._count.resolved}`);

const back = JSON.parse(readFileSync(P, 'utf8'));
const r = back.open.find((x) => x.id === 'D-23');
const problems = [];
if (!r) problems.push('[D-23] is not in open after the write');
else for (const k of ['subject', 'the_three_relations', 'what_the_derivation_actually_returned', 'the_ruling', 'status'])
  if (!r[k]) problems.push(`missing ${k}`);
if (back._count.open !== back.open.length) problems.push('_count disagrees with the array it counts');
if (problems.length) { problems.forEach((p) => console.error(`  STOP ${p}`)); process.exitCode = 2; }
else console.log('on-disk assertion: [D-23] is open and complete, and _count re-derives.');
