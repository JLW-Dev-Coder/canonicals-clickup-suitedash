// Resolve [DM-2] in 433d.map.json and [D-24] in the cross-form register — prompt 55 commit 1.
//
// Both are RESOLVED rather than edited away: [R-21] keeps a landed finding verbatim with what
// it got right and what it got wrong, so the original subject text is carried into the resolved
// entry unchanged and the resolution is written beside it.
//
// JSON is written with ONE-SPACE indent, which is this tree's convention for these sidecars —
// re-indenting to two would bury a forty-line change in a six-thousand-line diff.
import { readFileSync, writeFileSync } from 'node:fs';

const w = (p, o) => writeFileSync(p, JSON.stringify(o, null, 1) + '\n');

// ── [DM-2] ────────────────────────────────────────────────────────────────────────────────
const MAP = 'adapters/pdf/maps/433d.map.json';
const map = JSON.parse(readFileSync(MAP, 'utf8'));
const dm2 = map._carried.open.find((e) => e.id === 'DM-2');
if (!dm2) { console.error('[DM-2] is not open in ' + MAP); process.exit(2); }

map._carried.open = map._carried.open.filter((e) => e.id !== 'DM-2');
map._carried.resolved.push({
  ...dm2,
  status: 'RESOLVED',
  resolved_in: 'prompt 55 commit 1',
  what_this_item_got_RIGHT: 'ALL OF IT, AND THE PART THAT MATTERED WAS THE DIAGNOSIS OF WHOSE PROPERTY THE PROBLEM IS. "No single record can saturate this form, and that is a property of the FORM rather than of the fixture" is the sentence the resolution is built on: an individual record cannot fill the entity cells because the page does not draw them for an individual, so no fixture anybody could author would close the gap. An item that had read this as a missing fixture would have sent the next cycle looking for one.',
  what_the_item_LEFT_OPEN: 'The exemption it describes is CORRECT AND INCOMPLETE, and the incompleteness is not visible from inside one run. Per record, verify-form-coverage.mjs exempts the cells that record’s subject requires empty, names each with its printed caption, and FAILS if one carries a value — both directions, as the item says. What no run could ask is the question the exemption leaves behind: IS EVERY MAPPED CELL REACHED BY SOME RECORD? A cell exempted on the individual record and exempted again on the entity record is a cell NOTHING fills — a map binding a cell the form never draws — and every single-record saturated run passes over it.',
  how_it_was_resolved: 'THE UNIT OF SATURATION FOR A FORM WITH MUTUALLY EXCLUSIVE SUBJECT CLASSES IS THE UNION OVER ITS DECLARED SUBJECT SET, held by adapters/pdf/saturation-union.mjs and run over every form on `npm run sweeps`. The set is DERIVED from this map’s own subject_classes — the distinct empty_unless values — never listed. The members are the acceptance record plus every `branch` fixture declaring a subject, and the set must cover each declared subject EXACTLY ONCE in both directions.',
  why_the_branch_ROLE_and_not_a_new_mechanism: 'adapters/pdf/resolve-fixture.mjs already carries a role that is a SET rather than a singleton, for this exact structural reason: a record takes ONE side of each printed conditional, so one fixture exercises one side and the claim is that both are reached. A subject is a second axis of the same fact, so the role took a SECOND DECLARED DIMENSION — `_fixture.subject_state` beside `_fixture.branch_state` — rather than a second role being invented beside it. A branch member declaring NEITHER is a STOP, which is [R-35] applied to the fixture register: the fourth state is refused rather than defaulted, because assuming a dimension would admit a predicate-side fixture to the subject union and the union would then report a subject as covered by a record that never declared it.',
  what_the_union_reads_on_433D: 'TWO MEMBERS. samples/433d.sample.json (acceptance, individual) writes 138 text cells and is required empty in 2; samples/433d.entity.sample.json (branch, subject_state entity) writes 136 and is required empty in 4. SIX cells are empty on one member and fed by the other — the Spouse identifier, the Spouse signature and the conditional signature Title, each in both mirror copies — and ZERO are empty on every member. Every mapped text cell on this form is reached by SOME record, which is the strongest saturation claim the printed page admits.',
  and_the_other_five_forms_are_not_skipped: '[R-16]. A form declaring no mutually exclusive subject classes has a declared subject set of size one, its union is the acceptance record alone, and the union residual MUST equal what the single-record saturated run says. That equality is ASSERTED on every run rather than assumed, so a union that had drifted out of agreement with the gate would fail on the five inert forms rather than waiting for the sixth. All five report it holding.',
  the_canary_and_why_this_construct_needed_one_more_than_most: 'The union’s one interesting output is the set of cells empty on EVERY member, and on a healthy tree that set is EMPTY — so the live run prints 0 whether the arithmetic works or not, which is the vacuous-guard shape inside the tool written to close a coverage gap. AND IT CANNOT BE PLANTED FROM THE MAP: a cell carries one empty_unless, so being required empty on both subjects needs a THIRD declared subject, and a third subject with no fixture is refused earlier and louder by NO MEMBER FOR SUBJECT. That is the right precedence and it is why the branch has no map-level firing proof. It is the in-process class [R-28] declares, and both directions are planted: a synthetic cell required empty on both members must come back BY NAME, and the same pair with that cell fed by one member must come back empty.',
});
map._carried._count = { open: map._carried.open.length, resolved: map._carried.resolved.length };
w(MAP, map);

// ── [D-24] ────────────────────────────────────────────────────────────────────────────────
const REG = 'adapters/pdf/maps/_carried.cross-form.json';
const reg = JSON.parse(readFileSync(REG, 'utf8'));
const d24 = reg.open.find((e) => e.id === 'D-24');
if (!d24) { console.error('[D-24] is not open in ' + REG); process.exit(2); }

reg.open = reg.open.filter((e) => e.id !== 'D-24');
reg.resolved.push({
  ...d24,
  status: 'RESOLVED',
  resolved_in: 'prompt 55 commit 1',
  what_this_item_got_RIGHT: 'THE WHOLE OF IT, INCLUDING ITS OWN INSUFFICIENCY. "Four files being declared is not the same as the fifth being caught" named the remedy for the class before anybody had built it, and "the honest statement is that nothing enumerates this" refused to report 4-of-54 as a finding. Both were correct and the second was the one that made the derivation mandatory.',
  how_it_was_resolved: 'THE RESIDUAL, [SB-92] in adapters/pdf/sweep-boundary.mjs. Every entry in the register grew a `claims()` returning PATHS rather than only a `count()` returning a number — a number cannot be subtracted from a directory listing, which is why the register could report twenty cross-checked boundaries over a tree holding files no boundary named. The residual is then: every TRACKED file under every root, minus what the sweeps read, minus what the register claims, and it must be EMPTY. The ROOTS ARE DERIVED FROM THE REGISTER ITSELF — the swept directories plus the directory of every path any entry claims — so a typed list of directories cannot narrow the universe, which would have been this item’s own defect one level out.',
  what_it_found_on_its_first_run_TREE_WIDE: 'FOURTEEN unclaimed tracked files, of which TEN were outside adapters/pdf/maps/ entirely — which is the answer to the question the item could not ask. In maps/: 433b.lineage.json, _carried.cross-form.json, _cross-form-coordinates.json, _subjects.cross-form.json. Outside it: the six blank PDFs and forms.sha256 under adapters/pdf/forms/, New-HubSpotProperties.ps1 under adapters/hubspot/, and two .txt blocks in scratchpad/. The figure 4-of-54 this item recorded was a count of what a person had looked at in one directory; the derived figure over the whole tree is 14, and the ratio is [R-31]’s lesson in miniature.',
  the_FIFTH_FILE_and_it_was_inside_the_entry_written_to_end_this: '[SB-24] — authored in the commit that raised this item, to claim the four hyphenless 433-D sidecars — WAS SPELLED `433d.`. adapters/pdf/maps/433b.lineage.json had been outside every sweep and every boundary since it landed, in exactly the state the entry existed to end, and the entry walked past it because it was written against the four files somebody had just looked at. Its pattern is now derived over MAPPED_FORMS() with the form id as a capture. [SB-23] was the same object and was corrected the same way: it selected by two filename spellings and is now derived from the artefact’s own generator declaration.',
  the_two_dead_claims_the_residual_exposed: 'FIRST, adapters/pdf/forms/forms.sha256 held SIX TYPED SHA-256 HASHES AND NOTHING IN THE ENGINE OPENED IT — not one tool under adapters/; the gate pins its document by revision and catalogue read from the drawn page and prints a sha it compares to nothing. [SB-26] now recomputes every hash on every run and checks both directions, which is [R-31]’s preference for the structural check and [R-34]’s point that a tool nobody runs is a tool nobody knows is broken. SECOND, [S-07] in count-sweep.mjs derives `_carried._count` from the arrays beside it and its file predicate is /\\.map\\.json$/, so _carried.cross-form.json carried a count of exactly that shape with nothing deriving it; [SB-25] asks it now.',
  and_what_the_residual_found_about_the_REGISTER_itself: 'Two more classes, neither of which was a file. THREE COUNT/CLAIMS DRIFTS — [SB-14] counted a .md it had handed to [SB-13], [SB-15] counted the fields.registry.json it had split out to [SB-16], and [SB-18] counted .mjs while standing over a directory holding two .txt files nothing read. And FORTY-FOUR DOUBLE-CLAIMS, where two entries removed one file under two different grounds: the sentence at NOT_RUN_REPORTS says [SB-14] and [SB-19] "cannot drift into both claiming the same file or neither claiming it", and until now only the NEITHER half was checked by anything. [SB-10] and [SB-17] are a genuine layering and now DECLARE it mutually; the other two were real and were resolved as [SB-19] was split out of [SB-14].',
  what_holds_it: 'adapters/pdf/sweep-boundary.mjs [SB-92], run on every `npm run sweeps`. Its canary plants six states in a synthetic register — an unclaimed file found by name, the same register widened to claim it yielding none, a count/claims drift, that drift declared and therefore silent, a two-entry overlap, and one entry naming a file twice which is not an overlap — so a subtractor that takes everything and one that takes nothing both fail. And it was proved on the real tree by planting a sidecar in adapters/pdf/maps/: RESIDUAL 1, named, exit 2; removed, RESIDUAL 0, exit 0.',
});
reg._count = { open: reg.open.length, resolved: reg.resolved.length };
w(REG, reg);

console.log(`[DM-2] resolved in ${MAP} — open ${map._carried._count.open}, resolved ${map._carried._count.resolved}`);
console.log(`[D-24] resolved in ${REG} — open ${reg._count.open}, resolved ${reg._count.resolved}`);
