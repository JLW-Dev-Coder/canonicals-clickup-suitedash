// Commit 1's carried-register movements. One-shot, recorded in the commit that produced it.
//
// A SUPERSEDED FINDING IS KEPT VERBATIM WITH WHAT IT GOT RIGHT AND WRONG. [D-06]'s
// three-load-bearing/two-inert split was measured on map reachability and is wrong about the
// printed page; the item moves to `resolved` with its original text untouched and the
// correction beside it. Nothing is rewritten to match the later reading.

import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/_carried.cross-form.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));

const take = (id) => {
  const i = doc.open.findIndex((x) => x.id === id);
  if (i < 0) throw new Error(`${id} is not open in ${P}`);
  return doc.open.splice(i, 1)[0];
};

// ── [D-06] RESOLVED ─────────────────────────────────────────────────────────────────────
const d06 = take('D-06');
doc.resolved.push({
  ...d06,
  status: 'RESOLVED — Prompt 44 commit 1.',
  _resolution: {
    ruling: 'OPTION 1, SPLIT THE KEY — AND KEY BOTH HALVES BY FORM, WHICH NONE OF THE THREE OPTIONS SAID.',
    what_landed:
      '`row_flag` keeps the consuming code\'s meaning (a routing discriminator the form draws no cell for) and `printed_as_checkbox` carries the artefact\'s (the form draws a checkbox). Both are `{ "<form>": <evidence> }` maps. adapters/pdf/assert-row-shape-spec.mjs [A2] now CHECKS every printed_as_checkbox occurrence — as a checkbox, not merely as a declared column — and ASSERTS every row_flag excusal by requiring the column to be reachable on that form as neither text nor checkbox. A new [A4] re-derives every printed label and every widget name from the form\'s page bytes.',
    what_this_item_got_right:
      'That the key carried two incompatible definitions; that a checkbox IS a printed cell so they could not be two phrasings of one rule; that the five flagged columns did not divide cleanly under either; and that picking the wrong sentence would narrow [A2] on the next form. All of that stands, and it is why the split happened.',
    what_this_item_got_WRONG:
      'THE SPLIT ITSELF. "Three load-bearing, two inert" was derived from MAP REACHABILITY — is the column bound on an accepting group — and stated as though it were derived from the printed page. Read off the page, all five are drawn as checkboxes somewhere: 433-F prints "Check if / Business Account" over BOTH accounts tables (p1 y=527.5/518.5 and y=441.1/432.1) and draws four CheckBox11 widgets, and prints "Primary Residence"/"Other" inside each real-estate row (p1 y=224.5 and y=181.3) and draws PR1/CO1/PR2/CO2. The three "load-bearing" columns were never unprinted. They were UNMAPPED, and map reachability cannot tell those two apart. So the true division is not by column at all — it is PER (COLUMN, FORM): bank_account.is_business_account is a routing discriminator on 433-A and a drawn checkbox on 433-F, and that is why one key was impossible.',
    the_class_this_is:
      'A conclusion about the PAGE reached by measuring the MAP. It is the same shape as the finding that opened Prompt 44 — sequencing decided on leaf-name overlap when the question ran on subject — committed inside the item that was written to close a definition ambiguity. Two different axes, one of them cheaper to measure, and the cheap one standing in.',
    what_it_bought:
      'Three occurrences gained a declared `printed_but_unmapped_on: "433f"` that nothing in this repo had ever said out loud: 433-F draws eight checkbox widgets across its accounts and real-estate tables and the map binds none of them. Under the old blanket those cells were excused as unprinted, so no assertion could report them. Four occurrences moved from excused to checked and pass.',
    counts: '9 routing-discriminator occurrences across 433a/433aoi/433boi; 7 printed-checkbox occurrences across 433a/433aoi/433f — 4 bound and checked, 3 printed and declared unmapped. Re-derived and printed by adapters/pdf/exclusion-sweep.mjs [EX-03] and [EX-03b] on every run.',
  },
});

// ── [D-12] RECORDED AND RESOLVED IN THE SAME COMMIT ─────────────────────────────────────
doc.resolved.push({
  id: 'D-12',
  form: 'engine-wide',
  raised_in: 'Prompt 44 commit 1, while registering the subject register as a y-reporter',
  subject: 'adapters/pdf/assert-y-convention.mjs REPORTER_SIG held four LITERAL U+0008 BACKSPACE BYTES where `\\b` word boundaries were meant, so half the reporter-completeness signature could never match',
  the_shape:
    'The source bytes were `\\` `.` `y` `1` <U+0008>, not `\\` `.` `y` `1` `\\` `b`. The two regexes therefore read: clause 1 `/\\.y1<BS>|\\.y2<BS>|rect\\[1\\]|rect\\[3\\]/` and clause 2 `/console\\.log|writeFileSync|<BS>y1:|<BS>y:\\s|rect:\\s/`. The `.y1` and `.y2` branches match nothing any source file contains, so A FILE THAT REPORTS A y THROUGH `.y1` OR `.y2` AND NEVER TOUCHES A WIDGET RECTANGLE WAS INVISIBLE to the completeness check — which went on printing OK.',
  why_it_matters:
    'That check is the one whose declared STOP is "an engine file emits a y and Y_REPORTERS does not name it. A reporter nobody declared is the next lineage file." It could not see half the population it was written to enumerate. The defect was in the detector, not in the tree.',
  why_it_could_hide:
    'NOTHING TESTED THE SIGNATURE. The file has a canary and it tests the COMPARATOR — two synthetic runs 8.0pt apart, a run-top reporter must disagree twice. A detector whose canary covers its comparator and not its population selector is a canary for the half that was already working. It is the [G-01] shape one level in.',
  the_exposure_enumerated:
    'EXACTLY ONE FILE, derived and not estimated: adapters/pdf/record-shape.mjs, which reads `t.y1` on every printed-evidence atom and emits `y:`, and which had never appeared in Y_REPORTERS. Repairing the boundaries loses nothing — the ten files found before are all still found.',
  status: 'RESOLVED — Prompt 44 commit 1.',
  _resolution: {
    boundaries_repaired: 'The four U+0008 bytes are now `\\b`. Proved by a byte dump before and after, and by the population going 10 -> 11 with nothing removed.',
    signature_widened: 'The first clause also names `baselineOfRun(` and `runTopOf(` — page-geometry\'s own accessors. A file that asks this module for a baseline and prints it reports a y as surely as one reaching for `.y1`, and reaching for the accessor is the idiom this engine asks for, so the signature was blind to its own preferred style. Adds the two subject-register files and nothing else. Population 11 -> 13, none lost.',
    canary_added: 'signatureCanary() — eight synthetic sources with the verdict the selector must reach on each, including the two shapes the backspaces suppressed. Wired into the audit as a STOP and printed on every run beside the comparator canary.',
    reporters_declared_and_READ: 'record-shape.mjs, gen-subject-register.mjs and assert-subject-register.mjs are declared in Y_REPORTERS AND given readings in the same commit, because a Y_REPORTERS entry with no reading beside it is a claim nobody checks — which would trade one silence for another. They now contribute 3, 35 and 4 cross-checked objects respectively.',
  },
});

// ── the count block ─────────────────────────────────────────────────────────────────────
doc._count = { open: doc.open.length, resolved: doc.resolved.length };
writeFileSync(P, JSON.stringify(doc, null, 1) + '\n');
console.log(`${P}: open ${doc.open.map((x) => x.id).join(',')} | resolved ${doc.resolved.map((x) => x.id).join(',')}`);

// ── [B12] on the 433-B(OIC) map ─────────────────────────────────────────────────────────
const M = 'adapters/pdf/maps/433boi.map.json';
const map = JSON.parse(readFileSync(M, 'utf8'));
const b12 = map._carried.open.findIndex((x) => x.id === 'B12');
if (b12 < 0) throw new Error('B12 is not open on the 433-B(OIC) map');
const item = map._carried.open.splice(b12, 1)[0];
map._carried.resolved.push({
  ...item,
  status: 'RESOLVED — Prompt 44 commit 1, by [D-06]\'s split.',
  _resolution: {
    which_key_the_three_groups_took: 'ALL THREE TOOK `row_flag["433boi"]` — the routing-discriminator half — and none took `printed_as_checkbox`.',
    the_printed_evidence:
      'THE FORM DRAWS NO SUCH CELL. 433-B(OIC) prints no "Business Account", no "Check if" and no "Primary Residence"/"Other" anywhere on any page, and of its 77 checkbox widgets the only ones inside a bank, investment or real-estate subform are InvestmentAcct{1,2}.C2_19..C2_24 — the Stocks/Bonds/Other set printed at p2 y=465.7 and y=393.7, which the map already binds as `type_of_investment`. So there is no drawn cell for a business/personal or primary/other flag on this form, and the excusal is asserted rather than asserted-about: [A2] requires the column to be reachable on 433boi as neither text nor checkbox, and [EX-03] cross-checks the same thing from the excusal\'s side.',
    what_the_slice_argued_and_where_it_landed:
      'The slice argued that every row this form writes is a business row, so the flag would be a constant — "the strongest evidence yet that it is routing metadata and not a printed cell", reading as [D-06] option 1. Option 1 is what landed. The one correction is that a constant is not the same as a discriminator: on 433-B(OIC) there is only one table and nothing to route between, so `row_flag["433boi"]` records that state in its own words rather than calling it routing. Smoothing it into "routing" is how a key comes to mean two things, which is the item it was blocked on.',
    the_groups: '1ac_bank_accounts (bank_account.is_business_account), 2ab_investment_accounts (investment.is_business_account), 3ab_real_estate (real_property.kind).',
  },
});
map._carried._count = { open: map._carried.open.length, resolved: map._carried.resolved.length };
writeFileSync(M, JSON.stringify(map, null, 1) + '\n');
console.log(`${M}: _carried open ${map._carried.open.length}, resolved ${map._carried.resolved.length}`);
