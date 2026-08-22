// RULING 7 — DECLARE THE CO-AUTHORSHIP OF samples/433boi.slice3.sample.json, ENUMERATED.
//
// One-shot, recorded in the commit that produced it.
//
// adapters/pdf/assert-fixture-authorship.mjs re-runs scratchpad/author-slice3-fixture.mjs and
// compares. Fourteen top-level keys differ, from THREE distinct causes, none of them a mistake:
//
//   (1) THE WHOLE-DOLLAR CONVERSION ON PAGE 2. The generator emits cents. The committed fixture
//       carries whole dollars on page 2 and says why in its own `_page_2_is_whole_dollars_
//       because_the_page_says_so` block — the page draws "Round to the nearest dollar" at
//       y 670.9 and the map declares that band as a rounding block. The conversion was applied
//       to the fixture and never to the generator.
//   (2) THE RECORD-SHAPE ROUTE. `business_income_expense_route` became a required engine input
//       in Prompt 43, after this generator was written. It was added to the fixture by hand.
//   (3) SLICE 2 MOVED UNDER IT. The generator spreads slice 2, and slice 2 gained
//       `_the_generator_this_line_used_to_name` in the very commit that produced slice 3 — the
//       [SB-17] fix. Regenerating today therefore carries a key the committed file predates.
//
// THE FIXTURE IS NOT REGENERATED. Its figures are the ones every tripwire on this form has been
// checked against for two prompts, and rewriting a landed acceptance record to match a generator
// is rewriting landed evidence to match a later convention. The declaration is the other half of
// the ruling and it is the half that fits: the generator is named as A author, not THE author,
// and every key it did not write is listed with its reason.
//
// THE ENUMERATION IS ASSERTED IN BOTH DIRECTIONS. A key listed here that regeneration reproduces
// is a STOP, exactly like a key regeneration finds that is not listed. So this file DERIVES the
// key list by regenerating rather than typing it, and only the reasons are authored.

import { readFileSync, writeFileSync, copyFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const TARGET = 'samples/433boi.slice3.sample.json';
const GEN = 'scratchpad/author-slice3-fixture.mjs';
const HOLD = 'adapters/pdf/tmp/coauthor-hold';

// ── reasons, per cause. Every key the derivation finds must match one of these. ──────────
const CENTS = 'THE PAGE-2 WHOLE-DOLLAR CONVERSION. The generator emits this figure in cents; the committed record carries it in whole dollars because page 2 draws "Round to the nearest dollar. Do not enter a negative number." at y 670.9 and the map declares that band as the rounding block P2_SECTION_2_CASH_AND_INVESTMENTS. The conversion was applied to the fixture and never back to the generator. See the record\'s own `_page_2_is_whole_dollars_because_the_page_says_so`.';
const ROUTE = 'THE DECLARED RECORD SHAPE, ADDED AFTER THIS GENERATOR WAS WRITTEN. `business_income_expense_route` became an input the 433-B(OIC) engine requires in Prompt 43, and gate step 11 STOPs on a record that declares no state. The generator predates the construct and emits nothing for it.';
const SLICE2 = 'SLICE 2 MOVED UNDER THE GENERATOR. It spreads samples/433boi.slice2.sample.json, and slice 2 gained this key in the same commit that produced slice 3 — the [SB-17] fix that recorded the provenance sentence naming two uncommitted scripts. Regenerating today therefore carries a key this committed file predates. Nothing is wrong with either file; the generator reads an input that has since been annotated.';
const SELF_SENTENCE = 'THE PROVENANCE SENTENCE ITSELF. The generator writes a `_generated_by` claiming sole authorship; the committed one says the opposite and names the instrument that checks it, so the sentence is hand-authored too. A file whose provenance line claimed sole authorship while a block beside it enumerated fifteen hand-authored keys would be contradicting itself in two adjacent lines.';
const SELF = 'THIS DECLARATION ITSELF. The generator does not emit `_co_authored_with_hand`, so the block enumerating the hand-authored keys is one of them. Listing it is not a technicality: a declaration that exempted itself would be the one key in the file whose authorship nothing states.';

const REASON = {
  bank_accounts: CENTS,
  investment_accounts: CENTS,
  digital_assets: CENTS,
  s2_1_total_bank_accounts: CENTS,
  s2_1d_bank_accounts_from_attachment: CENTS,
  s2_2_total_investment_accounts: CENTS,
  s2_2d_investment_accounts_from_attachment: CENTS,
  s3_box_a_available_equity_in_assets: CENTS,
  s5_amount_from_box_a: CENTS,
  s5_offer_amount: CENTS,
  _page_2_is_whole_dollars_because_the_page_says_so: CENTS,
  business_income_expense_route: ROUTE,
  _business_income_expense_route: ROUTE,
  _the_generator_this_line_used_to_name: SLICE2,
  _co_authored_with_hand: SELF,
  _generated_by: SELF_SENTENCE,
};

// ── derive the key list by regenerating, exactly as the asserter does ────────────────────
rmSync(HOLD, { recursive: true, force: true });
mkdirSync(HOLD, { recursive: true });
const files = readdirSync('samples').filter((f) => f.endsWith('.json'));
for (const f of files) copyFileSync(`samples/${f}`, `${HOLD}/${f}`);
const committed = JSON.parse(readFileSync(TARGET, 'utf8'));
let differs;
try {
  const r = spawnSync(process.execPath, [GEN], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${GEN} exited ${r.status}: ${r.stderr}`);
  const regen = JSON.parse(readFileSync(TARGET, 'utf8'));
  differs = [...new Set([...Object.keys(committed), ...Object.keys(regen)])].sort()
    .filter((k) => JSON.stringify(committed[k]) !== JSON.stringify(regen[k]));
} finally {
  for (const f of files) copyFileSync(`${HOLD}/${f}`, `samples/${f}`);
  rmSync(HOLD, { recursive: true, force: true });
}

// THE TWO KEYS THE DERIVATION CANNOT SEE, BECAUSE THIS RUN IS WHAT CREATES THEM.
// `_co_authored_with_hand` does not exist in the committed file yet, and `_generated_by` still
// matches what the generator writes until the line below replaces it. Both are added
// explicitly — the alternative is a declaration that omits the two keys describing itself.
const keys = [...new Set([...differs, '_co_authored_with_hand', '_generated_by'])].sort();
const missing = keys.filter((k) => !REASON[k]);
if (missing.length) throw new Error(`no reason authored for: ${missing.join(', ')}`);
const unused = Object.keys(REASON).filter((k) => !keys.includes(k));
if (unused.length) throw new Error(`reason authored for a key regeneration does not find: ${unused.join(', ')}`);

const doc = JSON.parse(readFileSync(TARGET, 'utf8'));
doc._co_authored_with_hand = Object.fromEntries(keys.map((k) => [k, REASON[k]]));
doc._generated_by = `${GEN} AND THE HAND — a one-shot generator recorded in the commit that produced this file. It reads samples/433boi.slice2.sample.json for the pages 1-3 record and computes every page-4 and page-5 total from its operands. IT IS NOT THE SOLE AUTHOR: ${keys.length} top-level key(s) were authored or converted by hand afterwards, every one of them enumerated with its reason in \`_co_authored_with_hand\`, and adapters/pdf/assert-fixture-authorship.mjs re-runs the generator on every run and requires that enumeration to be exactly the set that differs — in both directions.`;

writeFileSync(TARGET, JSON.stringify(doc, null, 1) + '\n');
console.log(`declared co-authorship of ${TARGET}: ${keys.length} hand-authored key(s)`);
for (const k of keys) console.log(`  ${k}`);
