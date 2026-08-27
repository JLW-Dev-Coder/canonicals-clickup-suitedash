// AUTHOR adapters/pdf/maps/433d.crosswalk-classification.json — prompt 55 commit 2.
//
//   node scratchpad/p55-433d-author-classification.mjs
//   node scratchpad/p55-433d-author-classification.mjs --check    # re-derive and compare bytes
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS FILE IS AND WHAT IT DELIBERATELY IS NOT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// It BINDS NOTHING and it CREATES NOTHING. It records, per printed block of 433-D, what the
// block's cells correspond to on the five forms already mapped, and whether one property could
// serve both. adapters/hubspot/derive-names-433d.mjs turns those verdicts into names.
//
// THE KEYS ARE DERIVED FROM THE MAP AND THE CAPTIONS ARE READ OUT OF IT. Every entry names its
// keys by an explicit list checked against the engine's key space on every run, and every
// caption quoted below is copied from `subject_classes[stem].caption` in the map, which was read
// off the printed page. Nothing here is typed from memory of the form.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE FINDING THAT GOVERNS EVERY ENTRY, AND IT IS NEW IN THIS SERIES
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// adapters/pdf/maps/_subjects.cross-form.json records 433-D as COINCIDE with ALL FIVE mapped
// forms — including with 433-A and 433-B, which the same register calls MUTUALLY EXCLUSIVE with
// each other. That is a triangle no other three forms in this repo form, and the register said
// so and refused to resolve it: "the subject is per record, so a 433-D key's reuse verdict
// cannot be settled by this axis ALONE the way the other five were."
//
// APPLIED PER KEY, THE ANSWER IS NOT UNIFORM, AND THE DIVIDING LINE IS THE SUBJECT CLASS:
//
//   A key whose cell is subject-DEPENDENT or subject-CONDITIONAL HAS A FIXED SUBJECT. The route
//   sends the SSN/ITIN side to one property and the EIN side to another; a conditional cell
//   exists for one legal person and is asserted empty on the other. So for these keys the
//   question "whose fact is this" has ONE answer, and the reuse test can be asked and answered.
//
//   A key whose cell is subject-INDEPENDENT HAS A PER-RECORD SUBJECT. The same cell holds a
//   natural person's home telephone number on one filed 433-D and a corporation's on the next,
//   because the form prints no eligibility gate and asks the filer to supply either identifier.
//   A property shared with a form whose subject is FIXED would therefore hold, on the other
//   branch, a fact about the wrong legal person — under a name that says otherwise, permanently.
//
// THAT IS THE OPPOSITE OF WHAT THE BARE COINCIDE VERDICT INVITES, and it is [R-29] exactly: a
// coinciding subject says which reuses are PERMISSIBLE and nothing about how many there will be.
//
// AND A THIRD SUBJECT APPEARS ON THIS FORM THAT NO OTHER MAPPED FORM HAS. Twenty-one cells in
// the FOR IRS USE ONLY block are facts about the SERVICE and its handling of the agreement — an
// originator's identifying number, the employee who examined it, a Master File review cycle, a
// lien determination. Their subject is neither legal person, so no reuse is even conceivable and
// the ruling is not a close call. They are recorded as their own category rather than swept into
// `new`, because "no counterpart exists" and "the counterpart could not exist" are different
// facts and only the second one is a statement about the subject.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { keySpaceOf, ENGINE_EXTRA_INPUTS } from '../adapters/hubspot/classification-coverage.mjs';

const SELF = 'scratchpad/p55-433d-author-classification.mjs';
const OUT = 'adapters/pdf/maps/433d.crosswalk-classification.json';
const R = (p) => JSON.parse(readFileSync(p, 'utf8'));
const MAP = R('adapters/pdf/maps/433d.map.json');
const SUBJECTS = R('adapters/pdf/maps/_subjects.cross-form.json');

const stops = [];
const STOP = (m) => stops.push(m);

// ── the key space, TAKEN FROM THE SHARED SELECTOR RATHER THAN COPIED ───────────────────────
//
// This file used to carry its own copy of the predicate. That copy was correct — it was
// character-for-character what adapters/hubspot/classification-coverage.mjs held — and being
// correct is exactly the problem: it reproduced the defect faithfully. `typeof v === "object"
// && !Array.isArray(v)` admits an OPTION SET and drops a LONE TICK, and on 433-D a lone tick
// is one key with two targets because the form draws itself twice. Three keys vanished and
// this file then STOPped naming them "not an engine input on this form" — an assertion firing
// correctly against a population that was wrong.
//
// A copy is the parallel-list defect adapters/pdf/guard-sweep.mjs enumerates, and the fix is
// not a better copy. There is one key space and one place that decides what is in it.
const { keySpace: keySpaceMap, problems: keySpaceProblems, routes: ROUTES } = keySpaceOf(MAP);
for (const p of keySpaceProblems) STOP(`the key space could not be derived: ${p}`);
for (const k of (ENGINE_EXTRA_INPUTS['433d'] || [])) keySpaceMap.set(k, 'engine');
const keySpace = new Set(keySpaceMap.keys());
// The route replaces the dependent cell's own key with two, and the discriminator is an
// operator input the engine reads and no printed cell names — the shape 433-A(OIC)'s record
// route had, and the reason ENGINE_EXTRA_INPUTS exists.
const ROUTE = MAP.subject_classes?.Taxpayer?.route;
if (!ROUTE?.individual || !ROUTE?.entity || !ROUTE?.discriminator) STOP('the map declares no usable subject route on Taxpayer.');
// THE SUBSTITUTION IS THE SELECTOR’S, NOT THIS FILE’S. keySpaceOf() applies every route the map
// declares — the printed key leaves the key space and the two branch keys and the discriminator
// take its place — so this file reads ROUTE only to caption and classify. It used to do the
// substitution itself and the crosswalk author had a third copy, which is one declaration read
// three ways. Asserted rather than assumed: a selector that stopped applying the route would
// leave the printed key in the space and every entry below would be classified against it.
else if (!ROUTES.some((r) => r.replaced === '433d_taxpayer' && r.individual === ROUTE.individual && r.entity === ROUTE.entity && r.discriminator === ROUTE.discriminator))
  STOP('keySpaceOf() did not apply the Taxpayer route; the key space still describes one printed box rather than the three keys the engine reads.');

// ── the caption of a key, read out of the map rather than typed ───────────────────────────
const keyOfStem = (stem) => (MAP._key_overrides || {})[stem]
  || `433d_${stem.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/_+/g, '_').toLowerCase()}`;
const stemOfKey = new Map(Object.keys(MAP.subject_classes || {}).map((s) => [keyOfStem(s), s]));
const captionOf = (key) => {
  const stem = stemOfKey.get(key);
  if (stem) return MAP.subject_classes[stem].caption;
  if (key === ROUTE?.individual || key === ROUTE?.entity) return MAP.subject_classes.Taxpayer.caption;
  return null;
};
const classOf = (key) => {
  const stem = stemOfKey.get(key);
  if (stem) return MAP.subject_classes[stem].class;
  if (key === ROUTE?.individual || key === ROUTE?.entity) return 'dependent';
  return null;
};

const range = (base, n, from = 1) => Array.from({ length: n }, (_, i) => `${base}${i + from}`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE ENTRIES. One per printed block. `keys` is the enumerated list — no globs, no counts
// standing in for a list ([R-15]).
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DECLARED CATEGORIES, NAMED ONCE. The document quotes this object as `_the_categories`
// and the tally seeds every one of its keys at zero, so a category that goes unused reports
// its zero rather than disappearing, and a category invented in an entry and never declared is
// caught by count-sweep [S-25b] rather than by a reader.
const CATEGORIES = {
  exact: 'The same fact, in the same shape, ABOUT THE SAME SUBJECT, asked by the same question. The only category a provisioning pass may reuse a property for. USED THREE TIMES, and every one of the three is a cell whose subject is fixed by the route or by a conditional.',
  'same-fact-different-decomposition': 'One quantity split into different parts by the two forms. N cells here against one there, or a different cut. Not a reuse in either direction: N cells cannot bind one property and one cannot be split into N. THE DOMINANT CATEGORY BY KEY COUNT ON THIS FORM, because the direct-debit comb draws twenty-six single-character boxes where every other form holds a bank number in one cell.',
  'same-question-different-subject': 'The predecessor asks this question and asks it about a different legal person. The question transfers; the answer does not. Every entry must carry a `subject_reason` naming the two subjects and the state of the world in which they differ.',
  'third-subject-the-service': 'DECLARED BY THIS FORM. The cell is about neither legal person the form routes between: it records what the Internal Revenue Service has done with the agreement. No reuse is conceivable rather than merely absent, and the distinction is the reason this is not `new`.',
  'operator-input': 'DECLARED BY THIS FORM. The key names no printed cell and is supplied by whoever prepares the record — here the subject discriminator itself, which decides where the identifier is routed and which cells are asserted empty. Kept out of `new` because `new` asserts that a PRINTED fact has no counterpart, and this fact is not printed.',
  new: 'This form prints the fact and no predecessor prints it at all. Not a naming decision — there is no counterpart to collide with. Every use of it was verified against the five other forms rather than assumed.',
};

const E = [];

// ── the two route keys, and they are the only two reuses on this form ──────────────────────
E.push({
  id: 'W-01', page: 1, category: 'exact', scope: 'reuse',
  keys: [ROUTE.individual],
  fact: 'tp_ssn_itin',
  reuse_of: 'irs433_tp_ssn_itin',
  reuse_from: ['433a', '433aoi'],
  why: 'THE INDIVIDUAL SIDE OF THE SUBJECT ROUTE. 433-D prints ONE box under "Social Security or Employer Identification Number (SSN/ITIN/EIN)" and the caption offers two kinds of value; the map routes the SSN/ITIN side to this key and the EIN side to another, on the record\'s declared subject. 433-A prints "Social Security Number" at line 2 and 433-A(OIC) at s1, and both already bind irs433_tp_ssn_itin.',
  scope_reason: 'THE TEST, ASKED OF THIS CELL: could one property serving 433-D and 433-A ever have to hold two different values for one taxpayer at one moment? NO, AND THE REASON IS THAT THIS KEY\'S SUBJECT IS FIXED RATHER THAN PER-RECORD. A subject-INDEPENDENT cell on 433-D takes its subject from the record — the same box holds a natural person\'s telephone number on one filed copy and a corporation\'s on the next — and this key is not one of those: it exists ONLY on the individual branch, because the route sends the entity branch to a different property entirely. So the fact is "the SSN or ITIN of the natural person this agreement is with", which is the same fact 433-A line 2 and 433-A(OIC) s1 hold, about the same legal person, at the same moment. A taxpayer does not have one SSN on their collection information statement and a different one on their instalment agreement. The subject register calls 433-D / 433-A COINCIDE and this is the key on which that verdict is unambiguous.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-02', page: 1, category: 'exact', scope: 'reuse',
  keys: [ROUTE.entity],
  fact: 'employer_identification_number',
  reuse_of: 'irs433boi_employer_identification_number',
  reuse_from: ['433boi', '433b'],
  why: 'THE ENTITY SIDE OF THE SAME PRINTED BOX. The caption names an Employer Identification Number as one of the three values the box accepts, and the map routes it here when the record declares subject "entity". 433-B(OIC) created irs433boi_employer_identification_number and 433-B binds the same property, prefix and all, under [R-06].',
  scope_reason: 'THE TEST, ASKED OF THIS CELL: could one property serving 433-D and 433-B ever have to hold two different values for one taxpayer at one moment? NO, and for the mirror of W-01\'s reason. This key exists ONLY on the entity branch — an individual record routes to irs433_tp_ssn_itin and this cell is never written — so its subject is FIXED as the business entity, which is exactly the legal person 433-B and 433-B(OIC) are about. An entity does not have one EIN on its collection information statement and a different one on its instalment agreement. IT BINDS THE irs433boi_ NAME, PREFIX AND ALL, which is [R-06]\'s prefix half: the prefix records which form CREATED a name and not which form owns it, and 433-B established the precedent by binding this very property. AND THE OTHER LIVE CANDIDATE IS REJECTED BY NAME RATHER THAN BY SILENCE, because the portal holds TWO properties whose names are all but identical. irs433_employer_identification_number is live, contributed by 433-A line 54 and by 433-A(OIC) s4_business_ein, and on both of those forms the taxpayer is a NATURAL PERSON and the EIN belongs to a business that person OWNS — the business is not the taxpayer. irs433boi_employer_identification_number is the EIN of the entity that IS the taxpayer. On this form the entity branch means the taxpayer is the entity, so its EIN is the second fact and not the first. The state of the world in which they differ is the ordinary one: a sole proprietor with an EIN of their own files a 433-A, and their company later files a 433-D; one property would then have to hold the proprietorship EIN and the company EIN at one moment. The two names differ by a prefix and the two facts differ by a legal person, which is exactly what [R-08] says a leaf name is worth as evidence.',
  compared_against: ['433boi', '433b', '433a', '433aoi', '433f'],
});

// ── the discriminator ──────────────────────────────────────────────────────────────────────
E.push({
  id: 'W-03', page: 1, category: 'operator-input', scope: 'form-specific',
  keys: [ROUTE.discriminator],
  fact: 'subject',
  why: 'THE DISCRIMINATOR ITSELF, AND IT NAMES NO PRINTED CELL. The engine reads it to decide which of W-01 and W-02 the identifier goes to and which conditional cells it must assert empty; a record that declares nothing is REFUSED rather than defaulted. It is the same construct 433-A(OIC) and 433-B(OIC) carry as `business_income_expense_route` — an operator input the key space cannot see, which is why that form needed an ENGINE_EXTRA_INPUTS row and why this one does.',
  scope_reason: 'THE TEST CANNOT EVEN BE ASKED OF A COUNTERPART, BECAUSE THERE IS NONE. No other mapped form has a subject to discriminate: each of the other five is ABOUT one legal person by its own printed eligibility text or, where there is none, by four other printed sources. 433-D is the first form in this register whose subject is not a property of the form, so this input exists on this form alone and a shared name would be a name for a decision no other form makes. It is form-specific because there is nothing to share it with, and that is a checked absence rather than a default: `operator-input` is a category of its own precisely so it cannot hide inside `new`, which asserts that a PRINTED fact has no counterpart.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

// ── the identity block, and it is the interesting one ─────────────────────────────────────
E.push({
  id: 'W-04', page: 1, category: 'same-fact-different-decomposition', scope: 'form-specific',
  keys: ['433d_name_and_address'],
  fact: 'name_and_address',
  why: 'ONE MULTI-LINE CELL HOLDING BOTH. The printed caption is "Name and address of taxpayer(s)" over a single tall box. 433-A draws them apart — line 1a "Full Name" into irs433_full_name and line 1b into irs433_address — and 433-A(OIC) draws first and last name separately again, into irs433_tp_first_name and irs433_tp_last_name.',
  scope_reason: 'THE TEST: could one property serving 433-D and 433-A ever have to hold two different values for one taxpayer at one moment? YES, AND THE DECOMPOSITION IS ENOUGH ON ITS OWN. irs433_full_name holds a name and irs433_address holds an address; this cell holds both, run together across several printed lines, and neither of those two properties could take it without holding a value its own name says it does not hold. A property cannot be a name on one form and a name-and-address on another. THE SUBJECT ARGUMENT IS THE SECOND REASON AND IT IS INDEPENDENT OF THE FIRST: this cell is subject-INDEPENDENT, so the name it holds is a natural person\'s on one filed copy and a corporation\'s on the next, and irs433_full_name is 433-A\'s individual filer by construction. Either reason alone settles it.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-05', page: 1, category: 'exact', scope: 'reuse',
  keys: ['433d_spouse'],
  fact: 'sp_ssn_itin',
  reuse_of: 'irs433_sp_ssn_itin',
  reuse_from: ['433a', '433aoi'],
  why: 'THE SPOUSE\'S IDENTIFIER, printed as "(Spouse)" beneath the same SSN/ITIN/EIN caption that governs the taxpayer box. The map classes it subject-CONDITIONAL with `empty_unless: individual`: a corporation has no spouse, and an entity record carrying a value here is refused at [SC-7] and again at gate step 10. 433-A line 2 and 433-A(OIC) s1 both bind irs433_sp_ssn_itin.',
  scope_reason: 'THE TEST: could one property serving 433-D and 433-A ever have to hold two different values for one taxpayer at one moment? NO, AND THIS IS THE SECOND KIND OF FIXED SUBJECT ON THIS FORM. W-01 and W-02 are fixed by the ROUTE; this one is fixed by the CONDITIONAL — the cell exists only where the filer is a natural person filing a joint liability, so the fact is "the SSN or ITIN of that person\'s spouse" and it cannot be anything else. That is precisely 433-A\'s and 433-A(OIC)\'s fact about precisely the same legal person, and a spouse does not have one SSN on a collection information statement and another on an instalment agreement. THE THIRD CLASS IS WHAT MAKES THIS RULING AVAILABLE AT ALL: under the binary that [R-35] replaced, this cell was subject-independent, its subject would have been per-record, and the reuse would have been refused for a reason that is false of it.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-06', page: 1, category: 'same-question-different-subject', scope: 'form-specific',
  keys: ['433d_home'],
  fact: 'home_phone',
  why: 'ONE TELEPHONE CELL CAPTIONED "(Home)". 433-A prints "Home Phone" at line 1c and binds irs433_home_phone; the correspondence of the QUESTION is as close as this form gets to any predecessor.',
  subject_reason: 'THE QUESTION TRANSFERS AND THE ANSWER DOES NOT, AND ON THIS FORM THE REASON IS NEW. On 433-A the home telephone number is a natural person\'s, because 433-A is about a natural person and admits nothing else. On 433-D this cell is subject-INDEPENDENT, so the number it holds belongs to whichever legal person the record declares — a natural person on one filed copy and a corporation on the next, because the form prints no eligibility text anywhere on any of its four pages and asks the filer to supply either identifier. One HubSpot contact is one legal person, so the two values would not collide on one record; what WOULD happen is worse and quieter. A corporation\'s switchboard number would be stored in a property called irs433_home_phone and read back by every downstream consumer as a natural person\'s home telephone number, forever, with nothing in the tree recording that the value came from a form that does not know whose phone it is. THE SUBJECT REGISTER SAYS 433-D AND 433-A COINCIDE AND THAT VERDICT IS NOT WRONG: it licenses the reuse. [R-29] is the rule that licensing is not obligation, and per key the licence is not worth taking here, because the subject that makes it safe is the record\'s and not the form\'s.',
  scope_reason: 'See subject_reason: the cell is subject-INDEPENDENT on a form with no printed eligibility gate, so its subject is per record while irs433_home_phone\'s is fixed by 433-A\'s own subject. The property would hold a corporation\'s telephone number under a name that says it is an individual\'s home line.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-07', page: 1, category: 'same-fact-different-decomposition', scope: 'form-specific',
  keys: ['433d_work_cell_business'],
  fact: 'work_cell_or_business_phone',
  why: 'ONE CELL FOR THREE KINDS OF NUMBER. The printed caption is "(Work, cell or business)" over a single box. 433-A draws three: irs433_tp_work_phone, irs433_cell_phone and irs433_business_phone, each with its own printed caption and its own cell.',
  scope_reason: 'THE TEST: could one property serving 433-D and 433-A ever have to hold two different values for one taxpayer at one moment? YES — three of them, and the form does not say which. A filer writes ONE number here and the printed caption declines to record whether it is the work line, the mobile or the business switchboard, so binding this cell to any one of 433-A\'s three properties would assert something the page does not say. Binding it to all three would write one number into three properties that a 433-A record fills with three different numbers. N cells cannot bind one property and one cannot be split into N. The subject argument of W-06 applies here too and is not needed.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-08', page: 1, category: 'new', scope: 'form-specific',
  keys: ['433d_or_write'],
  fact: 'or_write_address',
  why: 'THE CORRESPONDENCE ADDRESS FOR THE AGREEMENT, printed as "Or write" beneath the two telephone cells — the address a taxpayer is told to write to instead of calling. It is a fact about how to reach the SERVICE\'S handling of this agreement rather than a fact about the taxpayer, and no collection information statement prints anything of the kind.',
  scope_reason: 'THERE IS NO COUNTERPART TO COLLIDE WITH. Every address property in the series holds an address OF the taxpayer — irs433_address, irs433_home_mailing_address, irs433_self_employment_business_address — and this cell holds the address the taxpayer is directed to use. Binding it to any of them would put a Service address into a property every downstream consumer reads as the filer\'s own.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

// ── the liability and the terms ────────────────────────────────────────────────────────────
E.push({
  id: 'W-09', page: 1, category: 'new', scope: 'form-specific',
  keys: ['433d_kinds_of_taxes', '433d_tax_periods', '433d_as_of', '433d_amount_owed'],
  facts: { '433d_kinds_of_taxes': 'kinds_of_taxes', '433d_tax_periods': 'tax_periods', '433d_as_of': 'amount_owed_as_of_date', '433d_amount_owed': 'amount_owed' },
  why: 'THE LIABILITY THIS AGREEMENT IS AGAINST — four cells on one printed row, captioned "Kinds of taxes", "Tax periods" and "Amount owed as of" (which governs both a date cell and an amount cell). No collection information statement in this repo prints the debt being settled: they establish ability to pay and the debt is stated elsewhere.',
  scope_reason: 'THE ONE APPARENT COUNTERPART IS A FALSE FRIEND AND IT WAS CHECKED RATHER THAN ASSUMED. irs433_amount_owed_as_of exists on the backbone, contributed by 433-A, and its input key is `16_amount_owed_as_of`. Read against 433-A\'s own map, that key targets `Page2.Table_Line15.HeaderRow14.Column3_14` — a COLUMN HEADER in the bank-accounts table, the "as of" date governing account BALANCES, not a tax debt at all. Binding 433-D\'s tax liability to it would put the balance due on an instalment agreement into a property holding the date a bank balance was read. The names correspond almost exactly and the facts do not, which is what [R-08] says a name is worth as evidence.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-10', page: 1, category: 'new', scope: 'form-specific',
  keys: ['433d_dollar_amount', '433d_date_paid', '433d_and_dollar_amount', '433d_on_the'],
  facts: { '433d_dollar_amount': 'initial_payment_amount', '433d_date_paid': 'initial_payment_date', '433d_and_dollar_amount': 'instalment_amount', '433d_on_the': 'instalment_day_of_month' },
  why: 'THE AGREEMENT\'S OWN TERMS, drawn as a printed sentence with four gaps: "$ ___ on ___ and $ ___ on the ___". The first pair is the payment made with the agreement, the second the recurring instalment and the day of each month it falls due.',
  scope_reason: 'THIS IS THE FACT CLASS THAT MAKES 433-D A DIFFERENT DOCUMENT FROM THE FIVE BEFORE IT. A collection information statement records what a taxpayer HAS; an instalment agreement records what they have UNDERTAKEN TO PAY AND WHEN. No property in the series holds a promise, so there is no counterpart to collide with and none to reuse. `new` here is a statement about the printed pages of five other forms, and it was verified against them rather than assumed.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-11', page: 1, category: 'new', scope: 'form-specific',
  keys: [...range('433d_date', 2), ...range('433d_amount', 2), ...range('433d_payment', 2)],
  facts: Object.fromEntries([1, 2].flatMap((i) => [
    [`433d_date${i}`, `increase_${i}_date`], [`433d_amount${i}`, `increase_${i}_amount`], [`433d_payment${i}`, `increase_${i}_new_payment`],
  ])),
  why: 'THE TWO SCHEDULED STEP-UPS, drawn as two identical printed rows under "Date of increase", "Amount of increase" and "New installment payment amount". The form provides for exactly two and draws no more.',
  scope_reason: 'Same ground as W-10 and it is not weaker for being a repetition: these are future terms of an undertaking, and nothing in a collection information statement is a future term of anything. THE PAIR IS ENUMERATED RATHER THAN GLOBBED — [R-15] — because `433d_date*` would also match `433d_date_paid` and `433d_date3`, which are two other facts under two other entries, and a prefix that swallowed them would put a signature date into an increase schedule.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-12', page: 1, category: 'new', scope: 'form-specific',
  keys: ['433d_initial', '433d_additional_conditions'],
  facts: { '433d_initial': 'agreement_initials', '433d_additional_conditions': 'additional_conditions_terms' },
  why: 'THE ASSENT AND ITS RIDER. The first cell sits under a printed paragraph beginning "By initialing here and my signature below, I agree to the terms of this agreement, as provided in this form, if it is approved by the Internal Revenue Service."; the second under "Additional Conditions / Terms".',
  scope_reason: 'A MARK OF ASSENT TO A CONTRACT HAS NO COUNTERPART ON A FORM THAT ASKS ONLY FOR FACTS. The five predecessors carry signatures — a signature attests that the facts given are true — and none carries an initial that agrees to a term. The distinction is the whole difference between a statement and an undertaking, and a shared property would erase it.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

// ── the direct-debit block: one digit per printed box ──────────────────────────────────────
E.push({
  id: 'W-13', page: 1, category: 'same-fact-different-decomposition', scope: 'form-specific',
  keys: range('433d_routing_number', 9),
  facts: Object.fromEntries(range('433d_routing_number', 9).map((k, i) => [k, `routing_number_digit_${i + 1}`])),
  why: 'NINE PRINTED BOXES, ONE DIGIT EACH, under "a. Routing number". The form draws a comb rather than a field: each box carries its own widget and accepts one character.',
  scope_reason: 'THE MOST EXTREME DECOMPOSITION IN THIS REPO AND IT IS NOT A CLOSE CALL. Every other form in the series that records a bank holds an account or routing number as ONE value in ONE cell. Nine cells cannot bind one property, and one property cannot be split across nine — and the reverse binding, one property per box, has no counterpart anywhere to collide with. The nine are enumerated rather than globbed, and each carries its ordinal in its fact so that a value written into the wrong box is a wrong routing number rather than a silently reordered one.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-14', page: 1, category: 'same-fact-different-decomposition', scope: 'form-specific',
  keys: range('433d_account_number', 17),
  facts: Object.fromEntries(range('433d_account_number', 17).map((k, i) => [k, `account_number_digit_${i + 1}`])),
  why: 'SEVENTEEN PRINTED BOXES, ONE CHARACTER EACH, under "b. Account number" — the same comb, one field longer than a routing number needs because account numbers vary in length.',
  scope_reason: 'Same ground as W-13, and one apparent counterpart was checked and refused: irs433_digital_asset_custodian_account_number exists on the backbone from 433-A(OIC) and holds a WHOLE custodian account number for a digital asset, which is a different fact about a different kind of account held in a different shape. Seventeen single-character cells cannot bind it, and the near-identical name is exactly the invitation [R-08] says a leaf name is worth nothing against.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

// ── the signature block ────────────────────────────────────────────────────────────────────
E.push({
  id: 'W-15', page: 1, category: 'new', scope: 'form-specific',
  keys: ['433d_your_signature', '433d_signature_row_date_left', '433d_signature_row_date_right'],
  facts: { '433d_your_signature': 'taxpayer_signature', '433d_signature_row_date_left': 'taxpayer_signature_date', '433d_signature_row_date_right': 'second_signature_date' },
  why: 'THE TAXPAYER\'S SIGNATURE AND THE TWO DATE CELLS ON ITS PRINTED ROW, captioned "Your signature" and "Date" twice. The two date cells are distinguished by their position on the row rather than by their captions, which are identical — the map\'s key override names them left and right for exactly that reason.',
  scope_reason: 'NO PROPERTY IN THIS SERIES HOLDS A SIGNATURE. The five predecessors are signed and none of them binds the signature cell: a signature is an image on a filed page, and what the engine writes here is the typed name that stands for one. There is nothing to collide with. The identical captions are why these keys are enumerated by position: a name derived from the caption alone would give two cells the same fact and one property would take both, which A5 refuses.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-16', page: 1, category: 'same-question-different-subject', scope: 'form-specific',
  keys: ['433d_title_if'],
  fact: 'signatory_title_if_corporate_officer_or_partner',
  why: 'THE SIGNATORY\'S OFFICE, printed as "(if Corporate Officer or Partner)" beside the signature line. The map classes it subject-CONDITIONAL with `empty_unless: entity`: a natural person signing for themselves holds no office, and an individual record carrying a value here is refused. irs433_title exists on the backbone from 433-A and 433-A(OIC).',
  subject_reason: 'THE QUESTION LOOKS IDENTICAL AND THE TWO SUBJECTS ARE DIFFERENT LEGAL PERSONS. irs433_title is 433-A line 3a, inside the taxpayer\'s own self-employment block, and 433-A(OIC) binds it from `s4_other_business_title`: on both forms it is the title THE TAXPAYER HOLDS IN THEIR OWN BUSINESS. This cell is the office held by whoever signs ON BEHALF OF the entity that is the taxpayer — a corporate officer or a partner, who is a different legal person from the corporation and need not be the taxpayer at all. The state of the world in which they differ is the ordinary one: a corporation files a 433-D signed by its treasurer, so this cell holds "Treasurer" while the corporation itself has no line 3a title and its treasurer, if they ever filed a 433-A of their own, would hold whatever title their own business gave them. One property would then have to hold the treasurer\'s office in the corporation and their title in their own business at the same moment. THIS RULING IS ONLY AVAILABLE UNDER THE THIRD CLASS: the cell has a FIXED subject — the entity — which is what makes the comparison askable at all; under the binary [R-35] replaced it would have been subject-independent, and the answer would have come out right for the wrong reason.',
  scope_reason: 'See subject_reason. The counterpart belongs to the individual taxpayer\'s own business role; this cell belongs to the officer signing for an entity. Two legal persons, two titles, one moment.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-17', page: 1, category: 'new', scope: 'form-specific',
  keys: ['433d_spouse_signature'],
  fact: 'spouse_signature',
  why: 'THE SPOUSE\'S SIGNATURE, printed as "Spouse’s signature" with the qualifier "(if a joint liability)". Subject-CONDITIONAL on the individual side: an entity has no spouse and an entity record carrying a value here is refused at [SC-7] and again at gate step 10, on the filed document rather than only in the engine.',
  scope_reason: 'Same ground as W-15 — no property in this series holds a signature — with the subject settled rather than left open: the conditional fixes it as the spouse of a natural person, so if a signature property ever existed this key could be tested against it. It does not, so the ruling is `new` and the absence was verified against the five other forms rather than assumed.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

// ── FOR IRS USE ONLY ───────────────────────────────────────────────────────────────────────
const IRS_USE = [
  ...range('433d_agreement_locator_number', 4),
  ...range('433d_agreement_review_cycle', 6),
  '433d_earliest_csed', '433d_originator_id', '433d_originator_code',
  '433d_name', '433d_title', '433d_agreement_examined', '433d_date3',
];
E.push({
  id: 'W-18', page: 1, category: 'third-subject-the-service', scope: 'form-specific',
  keys: IRS_USE,
  facts: Object.fromEntries([
    ...range('433d_agreement_locator_number', 4).map((k, i) => [k, `agreement_locator_number_box_${i + 1}`]),
    ...range('433d_agreement_review_cycle', 6).map((k, i) => [k, `agreement_review_cycle_box_${i + 1}`]),
    ['433d_earliest_csed', 'earliest_csed'],
    ['433d_originator_id', 'originator_id_number'],
    ['433d_originator_code', 'originator_code'],
    ['433d_name', 'irs_employee_name'],
    ['433d_title', 'irs_employee_title'],
    ['433d_agreement_examined', 'agreement_examined_or_approved_by'],
    ['433d_date3', 'agreement_examined_date'],
  ]),
  why: 'THE "FOR IRS USE ONLY" BLOCK — seventeen text cells whose captions are "AGREEMENT LOCATOR NUMBER:", "Agreement Review Cycle", "Earliest CSED", "Originator’s ID number", "Originator Code", "Name", "Title" and "Agreement examined or approved by" with its own "Date". Every one is filled by the Service and none by the filer.',
  subject_reason: 'A THIRD LEGAL PERSON, AND IT IS NEITHER OF THE TWO THE FORM ROUTES BETWEEN. The subject register asks which legal person a form is ABOUT and records 433-D as admitting both a natural person and an entity. These cells are about NEITHER: an originator\'s identifying number identifies an IRS employee, a Master File review cycle is a schedule the Service keeps, a CSED is a statutory date the Service computes, and "Name" and "Title" here are the name and office of the officer who examined the agreement. THE TWO TITLE CELLS ON THIS FORM ARE THE SHARPEST CASE. `433d_title_if` at W-16 is the office of the person signing FOR the taxpayer; `433d_title` here is the office of the IRS employee who APPROVED the agreement. They sit on one printed page, their captions are "(if Corporate Officer or Partner)" and "Title", and a reader deriving names from captions alone would have every reason to make them one property. They are two facts about two different people on opposite sides of the same document.',
  scope_reason: 'NO REUSE IS CONCEIVABLE, WHICH IS A STRONGER STATEMENT THAN "NO COUNTERPART EXISTS" AND IS WHY THIS IS ITS OWN CATEGORY RATHER THAN `new`. Every property in this series is a fact about a taxpayer; a property holding an IRS employee\'s identifying number under a taxpayer-facing name would be wrong in a way no later correction could reach, because a HubSpot property name is permanent. The seventeen are enumerated rather than globbed: `433d_name` and `433d_title` are bare stems that a prefix pattern over the block would miss and that a glob over the form would confuse with W-04 and W-16.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

// ── the checkboxes ─────────────────────────────────────────────────────────────────────────
E.push({
  id: 'W-19', page: 1, category: 'new', scope: 'form-specific',
  keys: ['433d_submit_a_new', '433d_unable_to_make'],
  facts: { '433d_submit_a_new': 'submit_new_form_w4', '433d_unable_to_make': 'unable_to_make_debit_payments' },
  why: 'TWO TAXPAYER-FACING CHECKBOXES. The first sits under "Submit a new Form W-4 to your employer to increase your withholding"; the second under "I am unable to make debit payments."',
  scope_reason: 'BOTH ARE ELECTIONS ABOUT THIS AGREEMENT rather than facts about the taxpayer\'s circumstances, and no collection information statement in the series offers an election. A property holding "this filer cannot pay by direct debit" has no counterpart among properties holding what a filer owns and earns.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

E.push({
  id: 'W-20', page: 1, category: 'third-subject-the-service', scope: 'form-specific',
  keys: ['433d_check_box_if', '433d_review_status_indicator', '433d_agreement_indicator', '433d_lien_determination'],
  facts: {
    '433d_check_box_if': 'pre_assessed_modules_included',
    '433d_review_status_indicator': 'review_status_indicator',
    '433d_agreement_indicator': 'agreement_indicator',
    '433d_lien_determination': 'lien_determination',
  },
  why: 'THE FOUR CHECKBOX CONSTRUCTS INSIDE THE IRS-USE BLOCK. "Check box if pre-assessed modules included."; the Review Status Indicator, whose options include the IMF and BMF two-year review codes; the Agreement Indicator; and the lien determination, whose four options run from "HAS ALREADY BEEN FILED" to "MAY BE FILED IF THIS AGREEMENT DEFAULTS".',
  subject_reason: 'Same third subject as W-18: each records a decision the SERVICE has taken about this agreement. A lien determination is not a fact about the taxpayer\'s property; it is a statement of what the Service has done or will do. THE MIRROR IS WHY THESE ARE FOUR CONSTRUCTS AND NOT SEVEN: 433-D draws the whole agreement twice, an IRS copy and a taxpayer copy, and each of these three indicators carries an exclusive option set on each copy — six declared exclusive sets over three facts. The map\'s mirror declaration is what binds the pair, and one property holds the one fact both copies must carry.',
  scope_reason: 'No reuse is conceivable, for W-18\'s reason. The two Master File codes inside the Review Status Indicator are themselves subject-CONDITIONAL — RSI 5 is the Individual Master File review and RSI 6 the Business Master File — which is the clearest evidence on the page that this block tracks the Service\'s handling of a taxpayer whose kind the form does not fix.',
  compared_against: ['433a', '433aoi', '433f', '433b', '433boi'],
});

// ═══════════════════════════════════════════════════════════════════════════════════════
// COVERAGE, COUNTED BY KEY AND NEVER BY ENTRY — [R-13].
//
// The blanket this file states is "every bound key on the form is covered by an entry", and the
// instrument that watches it must count the thing the blanket names. On 433-A(OIC) the sweep
// counted ENTRIES while the blanket claimed KEYS, and it was true of 207 and false of 31 — one
// of which would have created a permanent duplicate property in a portal with a hard ceiling.
// ═══════════════════════════════════════════════════════════════════════════════════════
const covered = new Map();
for (const e of E) {
  if (!Array.isArray(e.keys) || !e.keys.length) { STOP(`${e.id} enumerates no keys.`); continue; }
  for (const k of e.keys) {
    if (covered.has(k)) STOP(`key "${k}" is covered by ${covered.get(k)} and again by ${e.id}. One key, one entry.`);
    covered.set(k, e.id);
    if (!keySpace.has(k)) STOP(`${e.id} names "${k}", which is not an engine input on this form.`);
  }
  // Every entry names a fact per key — one `fact` for a single-key entry, a `facts` map otherwise.
  const n = e.keys.length;
  if (n === 1 && !e.fact && !e.facts) STOP(`${e.id} covers one key and declares no fact.`);
  if (n > 1 && !e.facts) STOP(`${e.id} covers ${n} keys and declares no per-key facts map.`);
  if (e.facts) for (const k of e.keys) if (!e.facts[k]) STOP(`${e.id} declares no fact for "${k}".`);
  // compared_against on EVERY entry, and it must name every other mapped form.
  const others = Object.keys(SUBJECTS.forms).filter((f) => f !== '433d').sort();
  const got = [...(e.compared_against || [])].sort();
  if (got.join(',') !== others.join(',')) STOP(`${e.id} compared_against is [${got}] and the mapped forms other than 433d are [${others}].`);
  // The middle categories and the two subject-bearing ones owe a per-entry ruling.
  if (!e.scope_reason || String(e.scope_reason).length < 60) STOP(`${e.id} declares no usable scope_reason.`);
  if ((e.category === 'same-question-different-subject' || e.category === 'third-subject-the-service')
      && (!e.subject_reason || String(e.subject_reason).length < 120))
    STOP(`${e.id} is ${e.category} and its subject_reason is too short to name two subjects and the state of the world in which they differ.`);
  if (e.category === 'exact' && (e.scope !== 'reuse' || !e.reuse_of)) STOP(`${e.id} is exact and does not declare a reuse.`);
}
for (const k of keySpace) if (!covered.has(k)) STOP(`engine input "${k}" is covered by no entry. The blanket is counted BY KEY.`);

if (stops.length) {
  console.error(`STOP — ${stops.length} problem(s) authoring ${OUT}:`);
  stops.forEach((s) => console.error('  ' + s));
  process.exit(2);
}

// ── the document ───────────────────────────────────────────────────────────────────────────
const byCat = {};
for (const e of E) byCat[e.category] = (byCat[e.category] || 0) + e.keys.length;
const doc = {
  form: '433d',
  against: ['433a', '433f', '433aoi', '433boi', '433b'],
  _generated_by: SELF,
  form_revision: MAP.form_revision,
  covers_slices: MAP.slice,
  _what_this_is: 'WHAT EACH BOUND KEY ON 433-D CORRESPONDS TO ON THE FIVE FORMS ALREADY MAPPED, and whether one property could serve both. It is the input to adapters/hubspot/derive-names-433d.mjs, which turns a category into a name.',
  _this_binds_NOTHING: 'No property is created by this file and no name is typed in it. Every name is DERIVED from an entry’s category and its row’s fact by the deriver, so a category and a name cannot disagree because only one of them exists.',
  _the_finding_that_governs_every_entry: 'THE SUBJECT REGISTER CALLS 433-D COINCIDE WITH ALL FIVE MAPPED FORMS, INCLUDING WITH 433-A AND 433-B, WHICH IT CALLS MUTUALLY EXCLUSIVE WITH EACH OTHER. That triangle is what a form with no printed eligibility gate produces, and the register recorded it and refused to resolve it: the subject is per RECORD, so a 433-D key’s reuse verdict cannot be settled by that axis alone. Applied per key, the dividing line is the SUBJECT CLASS. A subject-DEPENDENT or subject-CONDITIONAL cell has a FIXED subject — the route sends one branch to one property and the other elsewhere, and a conditional cell exists for one legal person and is asserted empty on the other — so the reuse test can be asked and answered. A subject-INDEPENDENT cell has a PER-RECORD subject, and a property shared with a form whose subject is fixed would hold, on the other branch, a fact about the wrong legal person under a name saying otherwise, permanently.',
  _and_that_is_why_the_answer_is_not_uniform: 'ALL THREE REUSES ON THIS FORM ARE CELLS WITH A FIXED SUBJECT, and every one of them is fixed by the construct [R-35] established: two by the ROUTE (W-01, W-02) and one by the CONDITIONAL (W-05). Not one subject-INDEPENDENT cell reuses anything, on a form whose subject register verdict licenses reuse against all five predecessors. [R-29] is the rule that says that is not a contradiction: a coinciding subject says which reuses are PERMISSIBLE and nothing whatever about how many there will be.',
  _the_third_subject: 'TWENTY-ONE CELLS ON THIS FORM ARE ABOUT NEITHER LEGAL PERSON. The FOR IRS USE ONLY block records the Service’s handling of the agreement — an originator’s identifying number, the employee who examined it, a Master File review cycle, a statutory collection expiry date, a lien determination. They carry their own category, `third-subject-the-service`, rather than sitting inside `new`, because "no counterpart exists" and "no counterpart could exist" are different facts and only the second is a statement about the subject.',
  _the_two_title_cells: 'THE SHARPEST CASE ON THE FORM. `433d_title_if` is captioned "(if Corporate Officer or Partner)" and holds the office of the person signing FOR the taxpayer; `433d_title` is captioned "Title" and holds the office of the IRS employee who APPROVED the agreement. One printed page, two facts, two people on opposite sides of the document — and a derivation working from captions alone would have every reason to make them one property.',
  _the_categories: CATEGORIES,
  _granularity_is_declared_per_entry: 'EVERY ENTRY ENUMERATES ITS KEYS. There is no glob and no count standing in for a list, which is [R-15] and is not decoration here: `433d_date*` would swallow `433d_date_paid` and `433d_date3` alongside the two increase dates, putting a signature date into an increase schedule, and a prefix over the IRS-use block would miss the bare stems `433d_name` and `433d_title` while a form-wide glob would confuse them with W-04 and W-16.',
  _how_coverage_is_counted: 'BY KEY, NEVER BY ENTRY. The blanket this file states is "every engine input on this form is covered by exactly one entry", and the check above counts KEYS in both directions: an input covered by no entry is a STOP and a key covered twice is a STOP. On 433-A(OIC) the watching sweep counted ENTRIES while the blanket claimed KEYS, and it was true of 207 keys and false of 31 — one of which would have created a permanent duplicate property in a portal with a hard ceiling ([R-13]).',
  subject: {
    the_ruling: 'A key’s reuse verdict on 433-D is settled by its SUBJECT CLASS and not by the form’s subject register verdict alone, because this form’s subject is a property of the record rather than of the form.',
    this_form: SUBJECTS.forms['433d'].subject,
    the_predecessors: 'All five mapped forms. The register calls 433-D COINCIDE with every one of them, including with two that are MUTUALLY EXCLUSIVE with each other.',
  },
  entries: E.map((e) => ({
    id: e.id, page: e.page, category: e.category, scope: e.scope,
    keys: e.keys,
    caption: e.keys.map((k) => captionOf(k)).filter((c, i, a) => c && a.indexOf(c) === i),
    subject_class: [...new Set(e.keys.map((k) => classOf(k)).filter(Boolean))],
    ...(e.fact ? { fact: e.fact } : {}),
    ...(e.facts ? { facts: e.facts } : {}),
    ...(e.reuse_of ? { reuse_of: e.reuse_of, reuse_from: e.reuse_from } : {}),
    why: e.why,
    ...(e.subject_reason ? { subject_reason: e.subject_reason } : {}),
    scope_reason: e.scope_reason,
    compared_against: e.compared_against,
  })),
  // THE TALLY, AND EVERY DECLARED CATEGORY IS SEEDED AT ZERO SO AN UNUSED ONE REPORTS ITS ZERO
  // RATHER THAN BEING ABSENT. The category counts sit at the TOP LEVEL of this object because
  // count-sweep [S-25b] asks `_tally` directly whether each entry's category is tallied, and a
  // tally nested one key down answers a different question — which is what the first draft of
  // this block did, and validate-map.mjs reported thirty mismatches for it at gate step 3.
  // COUNTED IN ENTRIES, matching every other classification in this tree; the key counts are
  // beside it under their own names, because a figure without its universe is not a figure ([R-07]).
  _tally: {
    _why: `Derived from entries[] by ${SELF} and re-derived by adapters/pdf/count-sweep.mjs [S-25]. A hand-kept tally beside a list is how "eleven" survived three slices when the honest figure was ten. Every declared category is seeded at 0.`,
    entries: E.length,
    ...Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, E.filter((e) => e.category === c).length])),
  },
  // THE KEY FIGURES SIT BESIDE THE TALLY AND NOT INSIDE IT. count-sweep [S-25] re-derives EVERY
  // key of `_tally` as a count of entries in a category, so a key figure living there is a
  // figure being checked against the wrong universe — which is [R-07] committed by the very
  // block that exists to satisfy it. The two counts answer different questions and are named
  // separately: the tally counts ENTRIES, this counts KEYS, and the coverage blanket above is
  // asserted against the second in both directions.
  _coverage_in_KEYS: {
    _derived_by: SELF,
    _why: 'BY KEY, NEVER BY ENTRY. On 433-A(OIC) the sweep watching this blanket counted entries while the blanket claimed keys, and it was true of 207 and false of 31 ([R-13]).',
    keys_covered: covered.size,
    key_universe: keySpace.size,
    by_category: byCat,
    reuse_keys: E.filter((e) => e.scope === 'reuse').reduce((n, e) => n + e.keys.length, 0),
    form_specific_keys: E.filter((e) => e.scope !== 'reuse').reduce((n, e) => n + e.keys.length, 0),
  },
  _what_this_file_does_not_say: 'It does not say a reuse WILL happen — adapters/hubspot/derive-names-433d.mjs asserts every reuse against the live definition file that created the property and refuses one that names a property nobody made. It does not say what a property will be called: the name is the entry’s category plus the row’s fact, computed at derivation time. And it says nothing about the portal, which is read by the deriver and not by this file.',
  _compared_against: ['433a', '433f', '433aoi', '433boi', '433b'],
};

const text = JSON.stringify(doc, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (!existsSync(OUT)) { console.error(`STOP — ${OUT} is absent; nothing to check against.`); process.exit(2); }
  const on = readFileSync(OUT, 'utf8');
  if (on !== text) { console.error(`STOP — ${OUT} differs from what ${SELF} re-derives (${on.length} bytes on disk, ${text.length} derived).`); process.exit(2); }
  console.log(`OK — ${OUT} regenerates byte-identical from ${SELF} (${doc.entries.length} entries, ${covered.size} keys).`);
  process.exit(0);
}
writeFileSync(OUT, text);
console.log(`wrote ${OUT}`);
console.log(`  ${E.length} entries covering ${covered.size} of ${keySpace.size} engine input(s) — counted BY KEY`);
console.log(`  reuse ${doc._tally.reuse_keys} key(s), form-specific ${doc._tally.form_specific_keys}`);
console.log('  by category, in KEYS: ' + Object.entries(byCat).map(([k, v]) => `${k} ${v}`).join(', '));
