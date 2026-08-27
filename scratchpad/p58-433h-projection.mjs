// AUTHOR adapters/pdf/maps/433h.projection.json — prompt 58 commit 2.
//
//   node scratchpad/p58-433h-projection.mjs            # write the artefact
//   node scratchpad/p58-433h-projection.mjs --check    # assert it regenerates byte-identical
//
// WHAT THIS IS. The NEW-PROPERTY PROJECTION for 433-H, derived before anything is classified
// and before any name is derived, which is [R-32]: the ceiling is checked before a create and
// PROJECTED BEFORE A CLASSIFICATION, and a projection that exceeds the headroom is a STOP and a
// decision for the Principal, never a partial provisioning run.
//
// WHAT IT DELIBERATELY IS NOT. A count. [R-32] again: "A bound, not a count: the most a form can
// cost is one property per distinct leaf stem, and the floor is zero. No single number between
// the two is printed, because a number between them is an invented reuse rate — and [R-29] is
// the rule that a coinciding subject says which reuses are PERMISSIBLE and nothing whatever
// about how many there will be." 433-B and 433-B(OIC) coincide and nine of 116 keys reused.
//
// Everything below is DERIVED from adapters/pdf/maps/433h.xfa-fieldset.json on every run. No
// figure in the output is typed, and the two figures that are OBSERVATIONS rather than
// derivations — the live headroom and the date it was read — are marked as such and carry the
// tool that read them.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash as hash } from 'node:crypto';

const SELF = 'scratchpad/p58-433h-projection.mjs';
const SRC = 'adapters/pdf/maps/433h.xfa-fieldset.json';
const OUT = 'adapters/pdf/maps/433h.projection.json';
const CHECK = process.argv.includes('--check');

const fieldset = JSON.parse(readFileSync(SRC, 'utf8'));

// ---------------------------------------------------------------------------------------
// THE UNIVERSE. Distinct leaf stems, and the normalisation is DECLARED rather than assumed.
// ---------------------------------------------------------------------------------------
//
// A leaf stem is the leaf NAME, with a trailing instance digit stripped ONLY where the enclosing
// subform already carries the instance — that is, inside a Row / RowSubform table, where Row1's
// `Description1` and Row2's `Description2` are the same column of one printed table.
//
// A BOXED-DIGIT RUN IS NOT A TABLE AND IS NOT COLLAPSED, and that is settled by precedent rather
// than by preference: 433-D prints the same direct-debit block, and this engine gave it
// irs433d_routing_number_digit_1 through _9 and irs433d_account_number_digit_1 through _17 —
// twenty-six properties for twenty-six drawn boxes. Collapsing 433-H's identical block to two
// stems would be projecting a cost this engine has never actually paid for that construct.
const leafOf = (som) => {
  const leaf = som.split('.').pop();
  const insideARowTable = /\.(Row|RowSubform|row)\d+[a-z]?\./.test(som);
  return insideARowTable ? leaf.replace(/\d+$/, '') : leaf;
};

const stems = new Map();
for (const f of fieldset.fields) {
  const k = leafOf(f.som);
  if (!stems.has(k)) stems.set(k, { cells: 0, ui: f.ui, caption: f.caption || f.assist || '' });
  stems.get(k).cells++;
}

// ---------------------------------------------------------------------------------------
// THE ONE EXCLUSION, STATED AS A CLAIM AND CHECKED.
// ---------------------------------------------------------------------------------------
//
// THE CLAIM: the IRS Allowed column is COMPUTED rather than stored, so it costs no property.
//
// THE CHECK, and it is a check because a computed column that turns out to need a stored input
// is exactly the shape that gets missed. 433-F prints the same two-column expense table and this
// engine has already ruled on it, in adapters/pdf/maps/433f.map.json under `allowed`:
//
//   SIX cells ARE auto-filled — the five National Standards food-group rows plus their Total, by
//   HOUSEHOLD SIZE, and the Out of Pocket Health Care cell, by AGE BAND. Those are published
//   figures the IRS grants outright.
//
//   THE OTHER TWENTY-SIX are declared under `allowed._never_autofill`, each with its own reason:
//   Local Standards varying by county or census region for which no table is held, a greater-of
//   judgement against the taxpayer's own vehicle costs, and sums that are only meaningful once an
//   examiner has completed the cells above them. No property is created for any of them, and the
//   declaration's own words are that "in that column a figure that is present but wrong is far
//   worse than a blank the examiner completes."
//
// SO THE COMPUTED HALF NEEDS TWO STORED INPUTS, AND THE CHECK IS WHETHER EITHER IS NEW. It is
// not. Both are already live, both were created by earlier forms, and both are bound by 433-F's
// own crosswalk:
//
//   irs433_allowable_household_size    created by 433-A, bound by 433-F as 433f_hh_size
//   irs433_taxpayer_age_band           created by 433-F itself, bound as 433f_age_band
//
// Neither is printed on either form — each exists precisely because the standards lookup needs
// it — so the exclusion holds in the direction that matters: excluding this column does not hide
// a stored input inside a computation. The exclusion is therefore SOUND, and it removes the
// _allowed leaves from the projected cost while removing nothing else.
const ALLOWED_LEAF = /_allowed$/;
const allowedStems = [...stems.keys()].filter((k) => ALLOWED_LEAF.test(k)).sort();

// A ZERO HERE WOULD BE A STOP, NOT A PASS. If the regex stopped matching — a renamed leaf, a
// re-derived field set — the exclusion would silently remove nothing and the bound would quietly
// grow, which reads as a WORSE projection rather than as a broken reading. [R-04].
if (!allowedStems.length)
  throw new Error(`STOP - no leaf stem ends "_allowed" in ${SRC}. The IRS Allowed column is the one exclusion this projection makes, and an exclusion that matches nothing is a reading that failed, not a column that vanished.`);

const bound = stems.size - allowedStems.length;

const doc = {
  form: '433-H',
  _generated_by: `${SELF} — re-run it and this file regenerates byte for byte; \`--check\` asserts that. Declared because it is generated ([R-19]).`,
  _what_this_is:
    'THE NEW-PROPERTY PROJECTION for 433-H, derived BEFORE any classification and before any name is derived. [R-32]: the ceiling is checked before a create and projected before a classification, and a projection that exceeds the headroom is a STOP and a decision for the Principal, never a partial provisioning run.',
  _it_is_a_bound_and_a_floor_and_nothing_between_them:
    'A COUNT IS NOT AVAILABLE AND WOULD BE INVENTED. The most a form can cost is one property per distinct leaf stem; the floor is zero, because every stem could in principle bind a property that already exists. No number between the two is printed: a number between them is an invented reuse rate, and [R-29] is the rule that a coinciding subject says which reuses are PERMISSIBLE and nothing whatever about how many there will be. 433-B and 433-B(OIC) coincide on their subject and NINE of 116 keys reused.',
  source: {
    fieldset: SRC,
    fieldset_generator: fieldset._generator,
    document_sha256: fieldset._source_sha256,
    _the_document_is_pinned_and_not_the_revision:
      "433-H's single drawn page is the Adobe Reader placeholder: no revision, no catalogue number, no form number, so the standing check — revision and catalogue number read from the drawn page — has nothing to read. Four sources agree on Rev. 3-2025 and 71232U and all four were written by ONE authoring tool into ONE file in one build, which is one statement quoted four times ([R-39]). The DOCUMENT is pinned instead, by the SHA-256 above, which adapters/pdf/xfa-fieldset.mjs recomputes from the bytes on every run ([R-37]).",
  },
  universe: {
    fields: fieldset.fields.length,
    distinct_leaf_stems: stems.size,
    _how_a_stem_is_derived:
      'The leaf NAME, with a trailing instance digit stripped ONLY inside a Row / RowSubform table, where Row1.Description1 and Row2.Description2 are the same column of one printed table. A BOXED-DIGIT RUN IS NOT A TABLE and is not collapsed: 433-D prints the same direct-debit block and this engine gave it twenty-six properties for twenty-six drawn boxes (irs433d_routing_number_digit_1..9, irs433d_account_number_digit_1..17). Collapsing 433-H\'s identical block would project a cost this engine has never paid for that construct.',
  },
  exclusion: {
    what: 'The IRS Allowed column.',
    ground: 'COMPUTED, NOT STORED.',
    leaf_stems_excluded: allowedStems.length,
    leaf_stems: allowedStems,
    _stated_as_a_claim_and_checked:
      'THE CLAIM is that the IRS Allowed column costs no property because it is computed. THE CHECK is whether the computation needs a stored input that is not already held — which is the shape that gets missed. 433-F prints the same two-column table and this engine has already ruled on it in adapters/pdf/maps/433f.map.json `allowed`: SIX cells are auto-filled from adapters/pdf/maps/irs-standards-2026.json (the five National Standards food-group rows plus their Total, by household size; and Out of Pocket Health Care, by age band), and the other TWENTY-SIX are declared under `allowed._never_autofill`, each with its own reason — Local Standards varying by county or census region for which no table is held, a greater-of judgement against the taxpayer\'s own vehicle costs, and sums only meaningful once an examiner has completed the cells above them.',
    _the_two_inputs_the_computed_half_needs_are_already_live:
      'irs433_allowable_household_size (created by 433-A, bound by 433-F as 433f_hh_size) and irs433_taxpayer_age_band (created by 433-F, bound as 433f_age_band). Neither is printed on either form — each exists because the standards lookup needs it. So excluding this column hides no stored input inside a computation, and the exclusion is SOUND.',
    _and_a_zero_here_is_a_STOP:
      'The generator throws if no leaf stem ends "_allowed". An exclusion that matches nothing removes nothing, and a bound that quietly grew because a reading failed reads as a WORSE projection rather than as a broken instrument ([R-04]).',
  },
  projection: {
    bound: bound,
    floor: 0,
    _what_the_bound_means:
      `${bound} is the MOST 433-H can cost: one new property for every distinct leaf stem outside the excluded column, i.e. the figure that obtains if not one fact on this form is already held anywhere in the series.`,
    _what_the_floor_means:
      '0 is the LEAST it can cost: the figure that obtains if every fact on this form is already held by a live property that a classification rules it may bind. Nothing between the two is derivable before the classification exists.',
  },
  headroom_at_the_time_of_this_projection: {
    _this_is_an_OBSERVATION_and_not_a_derivation:
      'Read from the live portal by adapters/hubspot/headroom.mjs on 2026-08-27, in the run that produced this file. It is recorded here rather than re-read, because a portal reading inside a --check-ed artefact would make the artefact non-reproducible. Re-read it before acting on this projection.',
    custom_contact_properties: 959,
    documented_ceiling: 1000,
    headroom: 41,
    _the_ceiling_is_documented_and_not_probed:
      'hs-preflight.mjs probes four endpoints for a live figure and all four 404. HubSpot publishes the number only inside the 400 returned by a create that would cross it, so nothing short of crossing it reads it.',
  },
  verdict: {
    fits: bound <= 41,
    _the_arithmetic: `bound ${bound} against headroom 41.`,
    _and_this_is_a_decision_and_not_an_engineering_trade_off:
      '[R-32]: a projection that exceeds the headroom is a STOP and a decision for the Principal, never a partial provisioning run. HubSpot does not delete a property; a name created is a name that cannot be withdrawn, and a run that provisions until it runs out leaves a form half-named against a ceiling that will not free anything.',
  },
  _what_this_file_does_NOT_say: [
    'IT DOES NOT SAY WHICH FACTS ARE ALREADY HELD. That is a classification, it does not exist for this form, and producing a figure from an informal reading of it is precisely the invented reuse rate [R-32] refuses. The bound and the floor are what is derivable today.',
    'IT DOES NOT SAY 433-H CANNOT BE RENDERED. The render route and the property cost are different questions: a rendering that leaves cells blank still renders. What the bound governs is whether the FACTS this form asks for can be stored under new names on this portal.',
    'IT DOES NOT RULE ON THE FILING QUESTION. [D-26] is open and names Principal and JLW: whether a document this engine produces may be filed in place of the IRS form, and whether a pdfjs rendering of the IRS template counts as the form or as a copy of it. Nothing here bears on that.',
  ],
  _the_shape_of_the_answer_if_the_ceiling_moves: [
    'THE BOUND IS NOT THE EXPECTED COST AND SAYING SO IS NOT HEDGING. 433-H is the individual instalment-agreement request bolted to a collection information statement, and this series has already provisioned both halves: 433-F is the same statement (its crosswalk binds 97 keys, most of them to irs433_ names 433-A and 433-A(OIC) created) and 433-D is the instalment agreement. A classification would very likely land far below the bound.',
    'WHAT IT WOULD NOT LAND BELOW IS THE PART-1 REQUEST BLOCK AND THE TWENTY-SIX DIRECT-DEBIT BOXES, and those alone are the reason this is close rather than comfortable. Each of the twenty-six boxes has a 433-D twin one prefix segment away, and every one of them is exactly the [R-40] question: an account PROPOSED on a request the Service may refuse is not the same fact as the account on an agreement it has accepted, and the two can differ at one moment. That is a per-row ruling, it is classification work, and it is not derivable here.',
  ],
};

const text = JSON.stringify(doc, null, 1) + '\n';
if (CHECK) {
  const on = readFileSync(OUT, 'utf8');
  if (on !== text) {
    console.error(`STOP — ${OUT} does not match what ${SELF} produces.`);
    console.error(`  on disk    ${hash('sha256').update(on).digest('hex').slice(0, 16)}  ${on.length} bytes`);
    console.error(`  re-derived ${hash('sha256').update(text).digest('hex').slice(0, 16)}  ${text.length} bytes`);
    process.exit(2);
  }
  console.log(`OK — ${OUT} regenerates byte-identical from ${SELF} (${stems.size} leaf stems, ${allowedStems.length} excluded, bound ${bound}, floor 0).`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT}`);
  console.log(`  ${fieldset.fields.length} fields -> ${stems.size} distinct leaf stem(s)`);
  console.log(`  exclusion: ${allowedStems.length} IRS Allowed leaf stem(s), checked against 433-F's landed ruling`);
  console.log(`  BOUND ${bound}   FLOOR 0   against headroom 41 -> ${bound <= 41 ? 'FITS' : 'DOES NOT FIT'}`);
}
