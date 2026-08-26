// THE THIRD SWEEP.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE META-RULE, APPLIED FOR THE THIRD TIME
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   WHEN A DEFECT CLASS EARNS A GUARD, THE SAME COMMIT ENUMERATES EVERY INSTANCE OF THAT
//   CLASS AND DISPOSES OF EACH. A guard applied only where the defect was noticed is a
//   guard that certifies its own blind spot.
//
// count-sweep.mjs applied that rule to COUNTS. This file applies it to three defect classes
// that were each found once, guarded once, and never enumerated:
//
//   (a) VACUOUS GUARDS — a predicate an empty input set can satisfy.
//   (b) NEAREST-NEIGHBOUR SELECTIONS — ranking by distance before filtering by the property
//       actually being sought.
//   (c) PARALLEL LISTS — two structures describing overlapping facts, neither asserted
//       against the other.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// (a) A GUARD THAT SKIPS WHEN IT CANNOT READ IS NOT A GUARD
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The `_unaccounted_by_page` check shipped as:
//
//     const nums = [...prose.matchAll(/\bp[1-8]\s+(\d+)/g)].map(m => Number(m[1]));
//     if (nums.length && tot !== part.unaccounted) problems.push(...)
//                ^^^^^^^^^^^^
//
// with its regex having reached disk with the backslashes eaten. It matched nothing,
// `nums.length` was 0, and `nums.length &&` turned a guard that could not read its input
// into a guard that reported success. Dead from the commit that introduced it, PASS printed
// underneath.
//
// count-sweep.mjs answered that with the `atLeast` contract — but only inside itself. The
// same shape is available at EVERY predicate in this engine, and a control-character scan
// finds none of the ones whose regex is intact and whose logic is still vacuous. So every
// site of the shape is enumerated below and each carries a verdict.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// (b) AN INSTRUMENT THAT RANKS BEFORE IT FILTERS ANSWERS A DIFFERENT QUESTION
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// money-probe.mjs asked "is the nearest printed run a `$`" when the question was "is there
// a `$` in the gap". Box labels drawn 2.1–3.5pt to the left beat the row's own `$` at 3.6pt,
// so on four cells a real currency symbol was never looked at, and two of the four wrong
// answers were written into the map as findings.
//
// The discriminator is mechanical: does the property being sought appear in the FILTER, or
// only in a test applied to the winner AFTER distance has already chosen it? Every selection
// in this engine is enumerated below and answers that question.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// (c) TWO LISTS OF THE SAME FACT IS ONE LIST AND ONE FOSSIL
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `_arguable_page{N}` and `_carried` were two lists for three slices, and seven of nine
// items lived only in the one that nothing counts — a disappearing act committed inside the
// file that exists to prevent it. `433aoi.totals.json` said five quick-sale tripwires across
// two pages while `433aoi.name-lies.json` said nine across four, about the same nine cells.
//
// For each pair: ASSERT the linkage, MERGE them, or declare them INDEPENDENT with the reason.
// There is no fourth state, and "they happen to agree today" is not one of the three.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// HOW A DISPOSITION IS BOUND TO ITS SITE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// By a VERBATIM SUBSTRING of the source line, never by line number. A line number drifts
// with every edit above it and a disposition that drifts off its site is worse than none —
// it certifies a line nobody looked at. Anchoring to the text means that EDITING A GUARD
// INVALIDATES ITS DISPOSITION: the anchor stops matching, the site becomes UNDISPOSED, and
// the sweep stops. Re-reading the changed guard is then mandatory rather than optional.

import { readFileSync, readdirSync } from 'node:fs';
import { underDetermination, markerPairing } from './line-markers.mjs';
import { examined } from './examined.mjs';

const DIR = 'adapters/pdf';

// WHAT THIS SWEEP READS, AND THE HALF IT USED TO MISS.
//
// It read adapters/pdf/*.mjs and nothing else, and adapters/pdf/sweep-boundary.mjs [SB-22]
// asked why. The reason on record was that the HubSpot tools are not instruments in the
// vacuous-guard sense - they write to a live portal and read the result back, so their verdict
// is what the portal says and not what a local set contains. That reason is TRUE OF MOST OF
// THEM AND FALSE OF FOUR: gen-fields-from-crosswalk.mjs, gen-fields-from-map.mjs,
// reclassify-against-backbone.mjs and validate-crosswalk.mjs never touch the portal, decide
// from local sets, and can stop a run. Nine guard sites across the four, outside every sweep.
//
// THE DISCRIMINATOR IS DERIVED, NOT TYPED, and it is the same predicate [SB-22] cross-checks
// with - so the sweep and the boundary register cannot drift into disagreeing about which
// files are which. A typed list of four names is how the exclusion got its wrong reason in the
// first place.
const LOCAL_SET_INSTRUMENT = (src) => !/fetch\(|hs-lib|hubapi/.test(src) && /process\.exit|exitCode/.test(src);

/** Every file this sweep reads, as a path relative to DIR. */
export const sweptFiles = () => [
  ...readdirSync(DIR).filter(f => f.endsWith('.mjs') && f !== 'guard-sweep.mjs').sort(),
  ...readdirSync('adapters/hubspot')
    .filter(f => f.endsWith('.mjs'))
    .filter(f => LOCAL_SET_INSTRUMENT(readFileSync(`adapters/hubspot/${f}`, 'utf8')))
    .sort()
    .map(f => `../hubspot/${f}`),
];

// ---------------------------------------------------------------------------------------
// WHAT COUNTS AS A SITE.
//
// The shapes the ruling names, and only those. A `for...of` and a `.filter()` are NOT in
// class on their own — every program is made of them, and a scanner that flags all 178 of
// them reports noise that no one reads, which is its own way of certifying nothing.
//
// What IS in class is a predicate whose truth an EMPTY input set can supply:
//   length-&&   `if (xs.length && …)` and `if (!xs.length && …)` — the original defect
//   every       `.every()` over a possibly-empty array — vacuously true on empty
//   neg-some    a negated `.some()` — vacuously true on empty
//   catch       a `try` whose `catch` continues — an exception swallowed is an input unread
//   extract     `.exec` / `.match` / `.matchAll` — a regex that matches nothing returns
//               nothing, and nothing compares equal to nothing
export const SHAPES = [
  ['length-&&', /(?:^|[^!\w])!?[\w.$\]\[]+\.length\s*&&/],
  ['every',     /\.every\s*\(/],
  ['neg-some',  /!\s*[\w.$]+\.some\s*\(/],
  ['catch',     /\bcatch\s*(?:\([^)]*\))?\s*\{/],
  ['extract',   /\.(?:exec|match|matchAll)\s*\(/],
];

/** Live code only. A shape inside a comment is prose ABOUT the defect, not an instance. */
const isProse = (line) => { const t = line.trim(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

export const sitesIn = (file) => {
  const out = [];
  readFileSync(`${DIR}/${file}`, 'utf8').split('\n').forEach((ln, i) => {
    if (isProse(ln)) return;
    for (const [shape, re] of SHAPES) if (re.test(ln)) { out.push({ file, line: i + 1, shape, text: ln.trim() }); break; }
  });
  return out;
};

// ---------------------------------------------------------------------------------------
// (a) THE VACUOUS-GUARD REGISTER.
//
// `verdict` is one of:
//   sound     an empty input cannot make this report success — it fails closed, returns a
//             sentinel the caller must handle, or is a bounds test in a loop
//   guarded   the shape IS vacuous in isolation and a named guard elsewhere closes it
//   latent    vacuous, not reachable on any artefact in the tree today, guarded so it
//             cannot become reachable silently
//   FIXED     was vacuous, is not any more, and the fix is named
//
// An entry may be a FAMILY (many sites, one reason) — every member is still enumerated in
// the report, so a family cannot hide a member that needed its own reading.
export const VACUOUS = [


  { id: 'G-182', file: 'count-sweep.mjs', anchor: "derived: (joined23.match(/Add lines?/gi) || []).length, from: 'every drawn run of pages 2 and 3, joined' });", verdict: 'sound',
    why: 'THE SECOND OF TWO DERIVATIONS OF ONE FIGURE, AND THAT IS WHY IT IS SAFE. [S-40] claims 433-B prints four totals on pages 2 and 3, and derives that number TWICE: once from the totals file, which is an artefact, and once from the drawn page, which is the form. A dead regex here returns 0 against a claimed 4 and STOPS the run — the loud direction. It could only be quiet if the claim were also 0, and a map declaring zero printed totals while carrying a totals file with four entries fails the row above this one in the same derivation. The two rows are one disposition: neither is sound without the other, because the file-side row is what makes a page-side zero impossible to mistake for agreement.' },

  { id: 'G-183', file: 'count-sweep.mjs', anchor: "derived: (joined23.match(new RegExp(re.source, 'gi')) || []).length, from: 'every drawn run of pages 2 and 3, joined' });", verdict: 'sound',
    why: 'AN EXTRACTION WHOSE REQUIRED ANSWER IS ZERO — the one shape this sweep cannot judge alone, and it is disposed the same way [G-173] is. [S-41] asserts that pages 2 and 3 draw no run matching any of five patterns, so each of these five rows compares a claimed 0 against a derived 0, and a pattern that stopped matching would report exactly the zero it is required to report. The row BELOW it is the positive control and the two are one disposition: it asserts that the phrase \"Used as collateral\" IS drawn, once, through the same joined page text and the same matching, so a dead reading reports 0 against a claimed 1 and takes the run down. The five absences are only readable because of that control.' },

  { id: 'G-184', file: 'count-sweep.mjs', anchor: 'derived: (joined23.match(/Used as collateral/gi) || []).length,', verdict: 'sound',
    why: 'THE POSITIVE CONTROL ITSELF, and it has already corrected its own claim once. Its first draft asserted 2 — one occurrence per column header — and derived 1, because the INVESTMENTS header is drawn as one run and the DIGITAL ASSETS header says the same words across two baselines. The DERIVATION was right and the CLAIM was wrong, and the claim was corrected rather than the comparison loosened. It is the answer to \"can an empty input make this report success\" for [G-183] as well: the five zero-rows above it are trustworthy only because this row would fail if the reading were dead.' },

  { id: 'G-190', file: 'count-sweep.mjs', anchor: "const tok = (n) => { const m = /_(\\d{1,2}[a-e])(?:[A-Za-z0-9]*)?\\[0\\]$/.exec(n); return m ? m[1] : null; };", verdict: 'sound',
    why: 'NULL IS THE ANSWER AND IT IS A COUNTED ANSWER. [S-43] classifies every page-4 widget by whether its leaf token is the printed marker, the printed marker minus one, some other block’s token, or ABSENT. A name this pattern cannot read returns null and lands in the fourth bucket, which is claimed as 2 and is a real reading about two real cells — Line2d and f2_037_0_, which carry no row token at all. A DEAD REGEX WOULD PUT ALL 94 THERE, and the fifth row of that derivation is what catches it: the four buckets are summed and compared against 94, so a reading that had gone dead would report 0 offset, 0 agreeing and 0 foreign against claims of 82, 2 and 8 and take the run down three times over. The classification is also re-derived from the PDF on every run rather than read back out of the map that claims it, so it cannot agree with itself.' },

  { id: 'G-191', file: 'count-sweep.mjs', anchor: "derived: (joined4.match(new RegExp(re.source, 'gi')) || []).length, from: 'every drawn run of page 4, joined' });", verdict: 'sound', family: true,
    why: 'TWO SITES, ONE DISPOSITION, AND IT IS [G-183]’S SHAPE ON A NEW PAGE. Both are extractions whose required answer is ZERO — [S-44] asserts page 4 draws no run matching any of five flag-class patterns, and [S-45] that it draws no rounding or negative-number instruction — so each row compares a claimed 0 against a derived 0 and a pattern that stopped matching would report exactly the zero it is required to report. EACH IS CARRIED BY A POSITIVE CONTROL IN ITS OWN DERIVATION, run through the same joined page text and the same matching: [G-192] for [S-44], and for [S-45] the three rows above it asserting that \"Add lines\", \"Total Equity\" and \"amounts from any attachments\" ARE each drawn twice. A dead reading reports 0 against those claims and takes the run down. THE ABSENCES ARE ONLY READABLE BECAUSE OF THE CONTROLS, and this page mattered more than most for it: page 4 is 433-B’s real-property page, which is exactly where the `kind` primary-residence column would be if this form drew one.' },

  { id: 'G-192', file: 'count-sweep.mjs', anchor: "derived: (joined4.match(/Real Property/gi) || []).length,", verdict: 'sound',
    why: 'THE POSITIVE CONTROL FOR [S-44], AND ITS CLAIM WAS WRONG ON THE FIRST RUN — the same way [G-184]’s was. It asserted 1, the block heading, and derived 2: page 4 draws the phrase TWICE on one baseline, as the heading \"REAL PROPERTY\" at x 43.2..110.5 and inside the instruction \"Include all real property and land contracts the business owns/leases/rents.\" at x 114.9..384.7 beside it. A case-insensitive match sees both and both are really drawn. THE DERIVATION WAS RIGHT AND THE CLAIM WAS WRONG, and the claim was corrected rather than the comparison loosened. It is the answer to \"can an empty input make this report success\" for the five zero-rows above it.' },

  { id: 'G-193', file: 'count-sweep.mjs', anchor: "derived: (joined4.match(/Add lines?/gi) || []).length, from: 'every drawn run of page 4, joined' });", verdict: 'sound',
    why: 'THE SECOND OF TWO DERIVATIONS OF ONE FIGURE, which is [G-182]’s disposition on page 4. [S-45] claims page 4 prints two totals and derives that number twice: from the totals file, filtered by the page each entry’s own caption_at names, and from the drawn page. A dead regex returns 0 against a claimed 2 and STOPS — the loud direction. It could only be quiet if the claim were also 0, and a map declaring no page-4 total while its totals file carries two page-4 entries fails the file-side row in the same derivation. Neither row is sound without the other.' },

  { id: 'G-194', file: 'count-sweep.mjs', anchor: "derived: (joined4.match(/Total Equity/gi) || []).length, from: 'the same joined page text' });", verdict: 'sound',
    why: 'A REQUIRED-NON-ZERO ROW, so the dead direction is the loud one. Page 4 draws \"Total Equity\" twice, once as each total’s caption, and the claim is 2. A regex that stopped matching reports 0 and takes the run down; there is no empty input that makes this report success. It is also the row that ties the two totals to their captions rather than to their rectangles, which is what makes the [B-06] comparison in the map’s prose checkable at all: the binding rests on the caption saying \"Total Equity\", and this row is the assertion that the page says it.' },

  { id: 'G-195', file: 'count-sweep.mjs', anchor: "derived: (joined4.match(/amounts from any attachments/gi) || []).length, from: 'the same joined page text' });", verdict: 'sound',
    why: 'THE [B-05] TERM, COUNTED ON THIS PAGE TOO, and required non-zero. Both page-4 total captions name \"amounts from any attachments\" as an addend the form draws no cell for, so the claim is 2 and a dead regex reports 0 and stops. This row is what keeps [B-05] honest as the form grows: the item asserts that every printed total on 433-B names an operand the page has no cell for, and that assertion is now checked on six totals rather than asserted about four and assumed of two.' },

  { id: "G-201", file: 'count-sweep.mjs', anchor: "rows.push({ what: 'runs matching /Add lines?/ on page 5', claimed: 2, derived: (j5.match(/Add lines?/gi) || []).length,", verdict: 'sound',
    why: "A REQUIRED-NON-ZERO ROW, so the dead direction is the loud one. Page 5 draws \"Add lines\" twice — once in each of the 24h and 25c total captions — and the claim is 2. A regex that stopped matching reports 0 and stops the run; there is no empty input that makes this report success. It is also the row that ties the two page-5 totals to captions that SAY what they add, which is what makes them tripwires rather than this engine’s assertions." },

  { id: "G-202", file: 'count-sweep.mjs', anchor: "rows.push({ what: 'runs matching /Add lines?/ on page 6', claimed: 2, derived: (j6.match(/Add lines?/gi) || []).length,", verdict: 'sound',
    why: "THE SAME SHAPE ON PAGE 6 AND ALSO REQUIRED NON-ZERO. Lines 36 and 49 each print \"Add lines\"; line 50 does not, because it is a difference and prints \"minus\" instead — which is the row below this one. A dead regex reports 0 against a claimed 2 and stops." },

  { id: "G-203", file: 'count-sweep.mjs', anchor: "rows.push({ what: 'occurrences of \"minus\" on page 6', claimed: 1, derived: (j6.match(/minus/gi) || []).length,", verdict: 'sound',
    why: "REQUIRED NON-ZERO, AND IT IS THE ONLY EVIDENCE THAT LINE 50 IS A DIFFERENCE. 433-B’s ten other declared totals are sums; line 50 prints \"(Line 36 minus Line 49)\" and this row is the assertion that the page says so. A dead regex reports 0 against a claimed 1 and stops the run, which is the loud direction, and it is the direction that matters: a difference silently read as a sum would reconcile on a fixture where expenses are zero and on no other." },

  { id: "G-204", file: 'count-sweep.mjs', anchor: "derived: ((j5 + ' ' + j6).match(/amounts from any attachments/gi) || []).length,", verdict: 'sound',
    why: "REQUIRED NON-ZERO — claimed 2, and the two are BOTH ON PAGE 5. That is the point of the row rather than an incidental fact: it is what establishes that line 36 is the first printed total on this form whose caption does NOT name the attachment term, and therefore the first one [B-05] does not reach. A dead regex reports 0 against a claimed 2 and stops." },

  { id: "G-205", file: 'count-sweep.mjs', anchor: "derived: ((j5 + ' ' + j6).match(new RegExp(re.source, 'gi')) || []).length, from: 'both joined pages' });", verdict: 'sound',
    why: "AN EXTRACTION WHOSE REQUIRED ANSWER IS ZERO — the one shape this sweep cannot judge alone. Three rows run through here, asserting that neither page draws a negative-number instruction or a rounding instruction, which is why no floor and no rounding block is declared for either. THE POSITIVE CONTROL FOR THIS DERIVATION IS [S-47]’s \"occurrences of “Total” on pages 5 and 6\", claimed 6 and required NON-zero through the same joined text and the same matching. A reading that had gone dead reports 0 against a claimed 6 and takes the run down, which is what makes the zero-rows beside it readable at all. It is the disposition [G-183] and [G-191] already stand on, applied to two new pages." },

  { id: "G-206", file: 'count-sweep.mjs', anchor: "derived: ((j5 + ' ' + j6).match(/Total/g) || []).length,", verdict: 'sound',
    why: "THE POSITIVE CONTROL ITSELF, and its claim was WRONG ON THE FIRST RUN in the same way [G-184]’s and [G-192]’s were. It asserted 8 and derived 6: pages 5 and 6 draw the word \"Total\" six times — \"Total Equity\" at 24h, \"Total Payments\" at 25c, \"Total Monthly Business Income\", \"Total Monthly Business Expenses\", \"Total Income\" at 36 and \"Total Expenses\" at 49. THE DERIVATION WAS RIGHT AND THE CLAIM WAS WRONG, and the claim was corrected rather than the comparison loosened. It is the answer to \"can an empty input make this report success\" for [G-205]." },

  { id: "G-207", file: 'count-sweep.mjs', anchor: "const m = /^p(\\d):(.+)$/.exec(k);", verdict: 'sound',
    why: "NO MATCH IS A REPORTED FAILURE, NOT A SKIP. The key of each flag-class probe encodes the page and the phrase; a key this pattern cannot read pushes a row carrying `fail`, which count-sweep treats as a problem and which stops the run. It does NOT `continue` past the key silently, which is the state that would let a renamed probe key drop out of the population while the report went on saying every probe agreed." },

  { id: "G-208", file: 'count-sweep.mjs', anchor: "derived: runs.reduce((n, t) => n + (t.str.toLowerCase().match(new RegExp(esc(m[2]), 'g')) || []).length, 0),", verdict: 'sound',
    why: "THE FIVE FLAG-CLASS ABSENCES, PER PAGE, AND EVERY REQUIRED ANSWER IS ZERO. This is [G-205]’s shape again and it carries the same control: THE POSITIVE CONTROL FOR THIS DERIVATION IS [S-47]’s \"occurrences of “Total” on pages 5 and 6\", claimed 6 and required NON-zero through the same joined text and the same matching. A reading that had gone dead reports 0 against a claimed 6 and takes the run down, which is what makes the zero-rows beside it readable at all. It is the disposition [G-183] and [G-191] already stand on, applied to two new pages. There is a second control specific to this row — the probe expression is built from the map’s OWN probe keys, so a page or phrase that vanished from the map would change the number of rows this loop pushes, and [S-49] compares the row set as well as the values." },

  { id: "G-209", file: 'count-sweep.mjs', anchor: "derived: (j6.match(/business account/g) || []).length,", verdict: 'sound',
    why: "REQUIRED NON-ZERO, AND IT IS AN ASSERTION ABOUT A FALSE POSITIVE. The claim is 1: the JOINED page-6 text contains \"business account\" exactly once, manufactured where the banner ending \"for Business\" meets the run \"Accounting Method Used:\", and the per-run probe finds zero. The row exists so that the map’s declared join artefact is checked rather than asserted — a dead regex here reports 0 against a claimed 1 and stops, and a page revision that separated those two runs would also report 0 and stop, which is correct: the declared artefact would have ceased to exist." },

  { id: "G-196", file: "assert-firing-proofs.mjs", anchor: "catch (e) { out.push({ path, unreadable: e.message }); continue; }", verdict: 'sound',
    why: "AN UNREADABLE FILE IS A CANDIDATE THAT COULD NOT BE CLASSIFIED, NOT ONE THAT IS ABSENT — [G-185]’s disposition, in the file that judges firing proofs. The catch pushes a row carrying the path and the throw, and the run turns every such row into a problem that exits 2. Skipping it would narrow the derived population of break provers by exactly the files something is wrong with, and the register comparison would not notice, because a file the classifier never saw cannot be reported as an unregistered prover either. THIS SITE AND THE THREE BELOW IT WERE FOUND BY THIS SWEEP IN THE COMMIT THAT ADDED THEM, in the tool written to stop a guard reporting PROVED on a condition it never checked. [R-12], measured." },

  { id: "G-197", file: "assert-firing-proofs.mjs", anchor: "catch { out.push(`${path} (UNREADABLE)`); }", verdict: 'sound',
    why: "THE SAME DISPOSITION ON THE IN-PROCESS CANARY POPULATION, and the loud direction is the same one. An unreadable file is pushed with an UNREADABLE marker in its path, and the run collects every such row into a problem and exits 2. A quiet skip here would shrink the canary class by the files nobody can read and then print the smaller number as the whole class, which is the figure-without-its-universe defect [R-07] names arriving through an exception handler." },

  { id: "G-198", file: "firing-proofs.mjs", anchor: "return { path, doc: null, unreadable: e.message, classified: false };", verdict: 'sound',
    why: "A RECORD THAT CANNOT BE PARSED IS RETURNED AS UNREADABLE, NOT DROPPED, and the caller makes it a STOP by name. This is the [R-17] shape written into the module that exists to stop it: `if (matches.length && mismatch)` printed PASS because a guard that could not read its input reported on an empty set. A firing-proof record this module cannot parse is not a proof that passed and it is not a proof that is absent — it is a proof nobody can ask, and assert-firing-proofs.mjs says exactly that and exits 2." },

  { id: "G-199", file: "firing-proofs.mjs", anchor: "} else if (!problems.some((x) => x.startsWith(p.want))) {", verdict: 'sound',
    why: "THE CANARY’S OWN NEGATED `some`, AND EMPTY IS THE FAILING DIRECTION, WHICH IS WHY IT IS SOUND. `problems` empty means the judge returned nothing for a planted violation, `.some` is then false, `!` makes it true and the canary is reported DEAD with the planted condition named and the run exits 2 before any verdict is printed. The vacuous direction here would be a plain `.some`, which an empty list would satisfy as \"caught\"; it is written negated for that reason. The conforming case is judged by the branch above this one, so a judge that refused everything fails too — a detector that catches every planted defect by refusing all input is the presence-only canary [R-17]’s second instance was." },

  { id: "G-035", file: "firing-proofs.mjs", anchor: "if (!soleUndeclared.some((p) => p.startsWith(FS3)))", verdict: 'sound',
    why: "EMPTY IS THE FAILING DIRECTION, AND ON THIS SITE EMPTY IS PRECISELY THE DEFECT BEING WATCHED FOR. `soleUndeclared` holds what judgeEntry() returns for a record whose `other_declared_lines` is EMPTY and which does NOT declare `sole_declared_line` — a silence, which [FS-3] must refuse. An empty problem list means the judge accepted that silence, `.some` is then false, `!` makes it true, and the canary is reported DEAD and the run exits 2 before any verdict is printed. The vacuous direction would be a plain `.some`, which an empty list would satisfy as \"refused\"; it is negated for that reason. This site exists because the exemption it guards was DEAD for a whole commit — the [FS-3] amendment renamed the message and left judgeEntry() filtering the old spelling, so every empty list was silently exempt — and nothing caught it because no canary planted this shape. The paired site above it asserts the other direction, that a DECLARED sole line is accepted, so a judge that exempted everything and a judge that exempted nothing both fail." },

  { id: "G-134", file: "../hubspot/reclassify-against-backbone.mjs", anchor: "catch (fieldsErr) {", verdict: 'sound',
    why: "IT NARROWS TO ONE ERRNO AND RETHROWS EVERYTHING ELSE, AND THE ONE IT ABSORBS BECOMES A DECLARED GAP RATHER THAN A SKIP. A bare `catch` here would swallow a malformed fields file, a permissions error and a mid-write truncation alike, and the two definition-reading checks would then report nothing on a form whose definitions exist and cannot be read — the [R-17] shape, `if (matches.length && mismatch)`, arriving through a catch instead of a conditional. Only ENOENT is absorbed; on ENOENT the run sets `fieldsAbsent` with the reason, NAMES the two checks it did not run, and prints both BEFORE any verdict line, so a run that could not read the definitions cannot be mistaken for one that read them and found nothing ([R-04]). The empty direction is therefore not a success: `rebinds` empty on such a run is reported as NOT RUN, not as clean. This site exists because the neighbour tool died with a raw ENOENT stack on a form nobody had pointed it at, which [D-16]'s resolution records as the same defect class that item was itself about." },

  { id: 'G-185', file: 'assert-examined.mjs', anchor: 'try { src = readFileSync(p, \'utf8\'); } catch (e) { out.push({ path: p, unreadable: e.message }); continue; }', verdict: 'sound',
    why: 'AN UNREADABLE FILE IS A CANDIDATE THAT COULD NOT BE CLASSIFIED, NOT ONE THAT IS ABSENT. The catch pushes a row carrying the path and the throw, and scope() turns every such row into an UNREADABLE problem that exits 2 before any matrix is printed. Skipping it would narrow the derived population by exactly the files something is wrong with — the [G-01] shape pointed at this file\u2019s own input — and the register comparison would then not even notice, because a file the signature never saw cannot be reported as a stale entry either.' },

  { id: 'G-186', file: 'assert-examined.mjs', anchor: '} catch (e) {', verdict: 'sound',
    why: 'THE CARRIED-REGISTER READ, AND AN EMPTY SET IS THE LOUD DIRECTION HERE. carriedOpenIds() returns the ids OPEN in adapters/pdf/maps/_carried.cross-form.json, and it is consulted only to decide whether a DECLARED GAP cites a real item. If the register cannot be read the set is empty, every declared gap becomes a DEAD CITATION, and the run exits 2 naming each one. That is the correct answer: a gap declared against a register nobody can read is an undeclared gap. The catch cannot manufacture a pass in the other direction either, because an id is never assumed present — the only way a gap is excused is by being FOUND in the set.' },

  // ─── prompt 47: the standing rules in the tree, examined counts, the overflow log ─────

  { id: 'G-175', file: 'assert-overflow.mjs', anchor: 'if (!logLines.length && expected.length) {', verdict: 'sound',
    why: 'THE `length &&` SHAPE, AND IT IS THE ONE DIRECTION OF IT THAT IS SAFE. The defect this whole family is named for is `if (nums.length && mismatch)`, where an extraction that read nothing turned a guard into a pass. THIS reads the other way: an empty extraction is the CONDITION being tested, not a precondition on testing. `!logLines.length` with drops expected is a STOP that exits 2 with the count of drops the map and the fixture say happened; the pass direction requires the log to have been read. The second conjunct is what makes it correct rather than merely inverted \u2014 zero log lines with zero expected drops is a form whose fixture over-fed nothing, and that case is already a NOT OVER-MAX problem from question 1, so it cannot reach a pass through here either.' },

  { id: 'G-176', file: 'examined.mjs', anchor: '.map((l) => LINE.exec(l.trim()))', verdict: 'sound',
    why: 'A READER WHOSE EMPTY ANSWER IS THE FINDING. `readExamined` returning [] means a guard emitted no EXAMINED line, and adapters/pdf/assert-examined.mjs treats that as NOT REPORTED \u2014 a distinct and louder state than a reported zero, named per (guard, form) in its own list. So a dead LINE regex cannot manufacture a pass: it would empty every guard\u2019s report at once and every registered pair would be reported unreported. The regex is anchored, fully specified and asked eight questions with known answers by examinedCanary() on every run of that tool, including a malformed line, a mid-line occurrence and a legitimate ZERO \u2014 the last of which is the case that distinguishes \u201cread, and it was none\u201d from \u201cnot read\u201d.' },

  { id: 'G-177', file: 'assert-rules.mjs', anchor: 'const h = HEADING.exec(lines[i]);', verdict: 'sound',
    why: 'AN EXTRACTION THAT READS NOTHING PRODUCES NO RULES, AND NO RULES IS AN EXPLICIT STOP. parseRules pushes `NO RULES  the document holds no `## [R-nn]` heading at all. An empty rules file is not a file whose rules all pass.` when the list is empty, so a dead HEADING regex takes the run down rather than certifying a document it could not read. That branch is canary case (h), reached on every run. It is also the only way a rule can enter the file at all: every later check \u2014 attribution, dating, the id contiguity run \u2014 iterates the rules this line produced, so under-reading is loud in five places at once and over-reading is impossible (the pattern is anchored to the line start and requires two digits).' },

  { id: 'G-178', file: 'assert-rules.mjs', anchor: 'const q = QUOTE.exec(lines[i]);', verdict: 'sound',
    why: 'THE SAME EXTRACTION ONE LEVEL DOWN, AND ITS EMPTY ANSWER IS A NAMED FAILURE PER RULE. A rule whose blockquote is not read has `rule` empty, and A1 pushes `NO RULE TEXT [id] carries no blockquote. A rule nobody can quote is not a rule.` So a dead QUOTE regex does not quietly produce rules with empty text \u2014 it produces one problem per rule and the tool exits 2. Canary case (c) is exactly that document.' },

  { id: 'G-179', file: 'assert-rules.mjs', anchor: 'const hashes = [...r.dating.matchAll(HASH)].map((m) => m[1]);', verdict: 'sound',
    why: 'AN EMPTY HASH LIST IS THE UNDATED BRANCH, NOT A SKIP. If no hash is read, `anyResolved` stays false, and the rule then passes ONLY if its dating paragraph says `Cycle-dated` \u2014 otherwise it is pushed as UNDATED naming the rule. So a dead HASH regex converts every hash-dated rule into a failure, which is the loud direction. The quiet direction would be a regex that read hashes it should not; it is bounded to 7-40 lowercase hex inside backticks and rejects a 6-character and an upper-case form in its own load-time probes.' },

  { id: 'G-180', file: 'assert-rules.mjs', anchor: 'for (const m of text.matchAll(PATHREF)) {', verdict: 'sound',
    why: 'AN EXTRACTION WHOSE UNDER-READING IS SILENT, AND THAT IS WHY IT IS NOT ALONE. This loop finds the tree paths RULES.md names, and a dead PATHREF regex would find none and report every one of them as present \u2014 the vacuous shape exactly. It is guarded by the figure beside it: the run prints `tree paths N cited, M distinct, each checked with existsSync`, derived from the same regex, so a reading that collapsed to zero is visible in the transcript rather than absorbed. It has also FIRED, twice, in the commit that introduced it: on `samples/433boi.sample.json`, a path deliberately quoted as one that never existed, and on `adapters/pdf/assert-examined.mjs` before that file was written. An extraction that has refused two real inputs on its first run is not one whose emptiness has gone untested.' },

  { id: 'G-181', file: 'assert-rules.mjs', anchor: 'paths: pathsChecked, distinctPaths: new Set([...text.matchAll(PATHREF)].map((m) => m[1])).size,', verdict: 'sound',
    why: 'THE FIGURE [G-180] IS GUARDED BY. It is the same regex read a second time to report the DISTINCT count beside the total, and it decides nothing: it is printed, never compared, and no branch depends on it. Its whole job is to make a collapsed reading visible in the transcript. Two readings of one pattern in one function is a duplication worth naming \u2014 it is here rather than hoisted because hoisting it would put the reported figure and the checked figure on two different traversals, which is the shape [D-11]\u2019s fix committed and the sweep caught.' },

  // ─── prompt 46 ruling 7: 433-B slice 1 ────────────────────────────────────────────────

  { id: 'G-173', file: 'count-sweep.mjs', anchor: 'const rows = VOCAB.map((re) =>', verdict: 'sound',
    why: 'AN EXTRACTION WHOSE REQUIRED ANSWER IS ZERO, WHICH IS THE ONE SHAPE THIS SWEEP CANNOT JUDGE ON ITS OWN. [S-37] asserts that page 1 draws no run matching any of six arithmetic patterns, so each of these six rows compares a claimed 0 against a derived 0 — and a pattern that stopped matching would report exactly the zero it is required to report. That is why the row below it exists and why the two are one disposition: it asserts the word "box" appears EXACTLY ONCE on the same joined page text, through the same reading, so a dead extraction reports 0 against a claimed 1 and takes the run down. The six absences are only readable because of that positive control, and neither line is sound without the other.' },

  { id: 'G-174', file: 'count-sweep.mjs', anchor: "rows.push({ what: 'occurrences of the word \"box\" on page 1'", verdict: 'sound',
    why: 'THE POSITIVE CONTROL ITSELF. `claimed: 1` against a derived count off the drawn page: if this extraction returned 0 the run STOPS, and that is the whole reason it is here. It is the answer to "can an empty input make this report success" for [G-173] as well — the six zero-rows above it are only trustworthy because this one row would fail if the reading were dead.' },

  // ─── the three sites [D-16]'s fix added to validate-crosswalk.mjs ───────────────────────
  //
  // A fix for a guard that examined nothing on three forms added three new sites of exactly
  // the shape that guard sweep exists to enumerate. That is [R-12]'s second clause arriving on
  // schedule — expect the fix to reproduce the defect class it fixes — and the sweep caught all
  // three on the first run after the change, before the commit.
  { id: 'G-187', file: '../hubspot/validate-crosswalk.mjs', anchor: 'const BACKBONE_FORM = /fields\\.([^.]+)\\.json$/.exec(BACKBONE_PATH)[1];', verdict: 'sound',
    why: 'IT INDEXES THE MATCH UNGUARDED, ON PURPOSE, AND THERE IS NO EMPTY INPUT. BACKBONE_PATH is a string literal on the line above it, not a value read from anywhere — the regex is run against a constant this file owns. If the pattern ever failed to match it, `.exec(...)` returns null and `[1]` throws a TypeError on the spot, before the guard prints a word or examines a row. A crash on line 75 is the loudest available outcome and it is the one wanted here: the alternative — a `?.[1]` yielding undefined — would make BACKBONE_FORM undefined, which would make the NOT APPLICABLE branch unreachable for every form and turn 433-A back into the raw ENOENT [D-16] closed. The whole point of deriving the form name from the path rather than typing it is that the two cannot drift; a silent undefined would restore the drift while looking safer.' },

  { id: 'G-188', file: '../hubspot/validate-crosswalk.mjs', anchor: 'if (rows.length && named !== 0 && named !== rows.length) {', verdict: 'sound',
    why: 'YES, AN EMPTY `rows` SHORT-CIRCUITS THIS TEST, AND THAT IS NOT A SILENT PASS, because the empty case is handled explicitly on the next lines and ANNOUNCED. A crosswalk with no rows carries no evidence of which shape it has — that is a fact about it, not a defect — so it is read as AUTHORED, the stricter of the two shapes, and the guard prints `ASSUMED — no rows to read a shape from` in place of `read from the rows` on every run. "This file has the authored shape" and "this file has no rows to tell" are different facts and the report says which one it has. The dangerous version of this site is the one where zero rows produce the same sentence as ninety-seven do; it does not. 433-B is the live instance today and its line reads ASSUMED, beside 88 problems and eight assertions whose counts are printed individually. [G-189] is the same shape one line down and carries its own reason rather than being swept in by a family flag — the two tests guard DIFFERENT columns and a shared disposition would assert that fact rather than check it.' },

  { id: 'G-189', file: '../hubspot/validate-crosswalk.mjs', anchor: 'if (rows.length && classed !== 0 && classed !== rows.length) {', verdict: 'sound',
    why: 'THE CLASSIFICATION ARM OF [G-188], AND IT IS A SEPARATE COLUMN RATHER THAN A COPY. The two shapes in this tree differ in BOTH columns — the authored crosswalk carries hs_name and classification, the derived one carries neither — but they are independent fields and a file could carry one without the other, which is exactly the mixed state both tests exist to refuse. Empty `rows` short-circuits this one for the same reason and with the same announcement: no rows means no classification column to be partial, and the shape is reported as ASSUMED rather than read. What this arm adds over [G-188] is the case where every row has a name and only some carry a classification, which would leave A6\'s reuse check vacuous on the rows that lack one while A4 and A5 both passed — a partial pass that would read as a full one.' },

  { id: 'G-169', file: 'fill-433b.mjs', anchor: 'try { field = form.getTextField(name); } catch { skipped.push(name); return; }', verdict: 'sound',
    why: 'A TARGET THIS FORM HAS NO TEXT FIELD FOR IS RECORDED, NOT DROPPED. `skipped` is carried into the run\'s tripwires file and printed in the closing line on every run, so a map naming a cell the PDF does not draw shows as a non-zero skip count rather than as a quieter success. It cannot happen silently either way: validate-map.mjs resolves every target in this map against the field list at gate step 3, before this engine is reached.' },

  { id: 'G-170', file: 'fill-433b.mjs', anchor: 'catch (e) { capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s, why: e.message }); }', verdict: 'sound',
    why: 'A VALUE THE FIELD REFUSES IS A HARD FAILURE, NOT A SKIP. The catch records the throw with the input key, the widget, the length and the declared maximum, and `capacityErrors.length` STOPS the run before any PDF is written. An empty list means every value the record supplied was accepted, and the number of cells written is printed beside it.' },

  { id: 'G-171', file: 'fill-433b.mjs', anchor: 'catch { skipped.push(name); }', verdict: 'sound',
    why: 'THE CHECKBOX ARM OF [G-169], and it has a second guard the text arm does not need. A box that cannot be fetched is pushed to `skipped` and never reaches `ticked`, so it is not read back — but every box that IS ticked is, and the read-back STOPS the run on any that did not turn on. With thirteen distinct on-states on this form that is the check that matters, and it is downstream of this catch rather than inside it.' },

  { id: 'G-172', file: 'fill-433b.mjs', anchor: 'const on = targets.filter((t) => { try { return form.getCheckBox(t).isChecked(); } catch { return false; } });', verdict: 'sound',
    why: 'THE EXCLUSIVE ASSERTION, AND `false` IS THE SAFE DIRECTION HERE. An unreadable box counts as NOT checked, which can only make a set look MORE exclusive — so this catch cannot manufacture a pass over a real violation, only understate one. It is not the reading that would be missed either: an unreadable box is one that was never ticked (the tick path pushes to `skipped`) or one that was ticked and then would fail the read-back above, which stops the run outright. Both paths are covered before this line decides anything.' },

  { id: 'G-168', file: 'fill-433b.mjs', anchor: 'const notOn = ticked.filter(', verdict: 'sound',
    why: 'AN EMPTY `ticked` IS AN EMPTY PROBLEM LIST, AND THAT IS THE RIGHT ANSWER. This is the checkbox read-back: every box this engine ticked is read back off the same form object to prove it turned on, because 433-B stores THIRTEEN distinct on-states where 433-B(OIC) stores one, and a box whose on-value the document disagreed with would stay off while `cbFilled` counted it written. If nothing was ticked there is nothing that could have failed to turn on — a record choosing no option is a legitimate state, and the count of boxes ticked is printed on every run whether it is zero or seven. So an empty input here reports zero findings over zero attempts rather than zero findings over an unread population. The catch inside the filter returns TRUE, not false: a box that cannot be read back is a finding, not a pass.' },

  // ─── prompt 46 rulings 4 and 5 ────────────────────────────────────────────────────────

  { id: 'G-162', file: 'absence-sweep.mjs', anchor: "catch (e) { if (e.code !== 'ENOENT') xfUnreadable = e.message; }", verdict: 'sound',
    why: 'ENOENT AND UNPARSEABLE ARE SEPARATED, AND ONLY ONE OF THEM IS SILENT. A missing _cross-form-coordinates.json leaves `xfRows` empty, and an empty register does not pass the run: every cross-form coordinate then resolves to no row, is pushed as UNDECLARED, and the sweep exits non-zero naming all 27. A register that will not PARSE takes the other branch and is pushed as an `unreadable` problem before any of that. There is no path on which the file being absent or broken reads as the coordinates being declared.' },

  { id: 'G-163', file: 'register-ids.mjs', anchor: 'and the derivation over ${from} threw', verdict: 'sound',
    why: 'A DERIVATION THAT THROWS IS A FINDING, NOT A SKIP. It means the register\'s shape moved under the reader — `forms` becoming an object, `quotes` becoming an object, both of which happened while this check was being written — and the catch pushes a `bad` entry naming the path, the claimed figure and the throw. "I could not count it" and "it agrees" take different paths, which is the whole subject of this register.' },

  { id: 'G-164', file: '../hubspot/no-downgrade.mjs', anchor: "catch (e) { return { state: 'unclassifiable', how: `unreadable", verdict: 'sound',
    why: 'THE UNREADABLE STATE IS THE ONE THAT REFUSES. A landed report this module cannot open classifies as `unclassifiable`, and refuseDowngrade() THROWS on unclassifiable before it throws on anything else: "I could not read it" and "there was nothing to lose" must not take the same path. An empty input here blocks the write rather than permitting it.' },

  { id: 'G-165', file: '../hubspot/no-downgrade.mjs', anchor: 'catch { /* absent is the case under test */ }', verdict: 'sound',
    why: 'CANARY SETUP, AND THE FAILURE IS THE CASE. This rmSync clears the scratch path so the `absent -> not-run` direction can be exercised; the file not being there is exactly the state being set up, so a throw is nothing. What the canary then asserts is refuseDowngrade\'s verdict on that state, and that assertion is not guarded by this catch.' },

  { id: 'G-166', file: '../hubspot/no-downgrade.mjs', anchor: 'catch (e) { threw = e.message; }', verdict: 'sound',
    why: 'THE CANARY\'S INSTRUMENT, AND IT RECORDS BOTH DIRECTIONS. `threw` is compared against `expectThrow` on the next two lines, so a refusal that was expected and a refusal that was not both become misses of their own kind — "permitted a write it must refuse" and "refused a write it must permit". Swallowing is impossible: the value the catch stores IS the verdict.' },

  { id: 'G-167', file: '../hubspot/no-downgrade.mjs', anchor: 'catch { /* already gone */ }', verdict: 'sound',
    why: 'TEARDOWN, AND ITS ABSENCE IS VERIFIED RATHER THAN ASSUMED. The rmSync may legitimately find nothing — the last planted case is the absent one. What proves teardown is the `existsSync` on the following line, which pushes a miss if the synthetic file survived and is reported as `torn_down` in the canary line. Synthetic data, registered, torn down with absence verified.' },

  // ─── prompt 46 ruling 3: the load-time regex self-assertion, and one phantom it created ──

  // THIS ONE IS NOT A GUARD SITE AT ALL, AND SAYING SO IS THE POINT. `rx()` probe arrays quote
  // code as DATA — a string that must match, a string that must not — and this sweep's
  // [extract] selector reads `matchAll(` inside one of them as an extraction. It is disposed
  // rather than silently filtered because every future probe that quotes code will land here
  // the same way, and a reader who meets this entry learns the shape. Carried as [D-15].
  { id: 'G-149', file: 'blanket-audit.mjs', anchor: "matches: ['s.matchAll(re)', 'new RegExp(x)', 's.match(re)'],", verdict: 'sound',
    why: 'A PROBE STRING, NOT AN EXTRACTION. This line is the `matches` array of the RX-BA-02 registration: three literal strings the regex must match, compared at module load. Nothing here calls matchAll, nothing extracts, and there is no input that could arrive empty — the strings are constants in the source. The site is a false positive of the [extract] selector reading data that quotes code.' },

  { id: 'G-150', file: 'regex-self-assert.mjs', anchor: 'const m = re.exec(input);', verdict: 'sound',
    why: 'AN EMPTY EXTRACTION IS THE FINDING. `exec` returning null is tested on the next line and becomes "must capture X out of Y and does not match it at all" — a problem, which makes `rx()` throw and the importing module refuse to load. The vacuous case is the loudest state this construct has, not its quietest.' },

  { id: 'G-151', file: 'regex-self-assert.mjs', anchor: 'module: (site.match(/adapters', verdict: 'guarded',
    why: 'AN EMPTY EXTRACTION IS REPORTED AS ITSELF. If the stack frame cannot be parsed the fallback is the literal string "(unknown)", which is what the per-module table then prints. It affects a LABEL and never a verdict: the assertion has already run and passed by the time this line executes, and a registration attributed to "(unknown)" is visibly attributed to nothing rather than silently attributed to the wrong file.' },

  // The four loop bounds in the lexer. Grouped in prose, disposed individually, because the
  // sweep asks per site and a family anchor here would match text in three other files.
  { id: 'G-152', file: 'regex-self-assert.mjs', anchor: 'text.charCodeAt(i) !== 10) i++; continue;', verdict: 'sound',
    why: 'A LEXER LOOP BOUND, NOT A GUARD OVER A FINDING. `i < text.length` ends a line-comment skip at end of input. An empty file yields zero literals, and zero is PRINTED — the tree line states the population it counted on every run — so an empty input cannot be mistaken for a clean one. That the lexer finds what it must is proved by scannerCanary(), which plants a literal in each of eight syntactic positions.' },

  { id: 'G-153', file: 'regex-self-assert.mjs', anchor: "!(text[i] === '*' && text[i + 1] === '/')", verdict: 'sound',
    why: 'THE SAME BOUND, on an unterminated block comment. Running to end of input ends the scan; the file contributes the literals found before the comment, and the population figure is printed. See [G-152] for why an empty count cannot read as a clean one here.' },

  { id: 'G-154', file: 'regex-self-assert.mjs', anchor: 'while (i < text.length && text[i] !== q)', verdict: 'sound',
    why: 'THE SAME BOUND, on an unterminated string literal. Same disposition as [G-152]: the scan ends, the count is printed, and the canary is what proves the detector rather than the absence of findings.' },

  { id: 'G-155', file: 'regex-self-assert.mjs', anchor: '/[a-z]/.test(text[i])', verdict: 'sound',
    why: 'FLAG ACCUMULATION AFTER A CLOSED LITERAL. An empty flag string is the ordinary case — most literals carry no flags — and the literal has already been recorded by the time this runs. There is no verdict downstream of it: flags are reported, never compared.' },

  // The five canary assertions. Every one of them is `if (!x.some(...)) push a miss`, which is
  // the INVERSE of the shape this sweep hunts: the vacuous input pushes a finding.
  { id: 'G-156', file: 'regex-self-assert.mjs', anchor: '!p1.some(', verdict: 'sound',
    why: 'AN EMPTY PROBLEM LIST IS A CANARY MISS. `p1` empty means assertSpec() found nothing wrong with a regex carrying a planted literal backspace — which is the detector being dead. `.some` on an empty array is false, `!` makes it true, and a miss is pushed. Misses are terminal: main() prints CANARY DEAD and exits 2 before reading a single file.' },

  { id: 'G-157', file: 'regex-self-assert.mjs', anchor: '!p2.some(', verdict: 'sound',
    why: 'THE SAME INVERSION, on the planted eaten `\\s`. Empty means undetected means a miss. See [G-156].' },

  { id: 'G-158', file: 'regex-self-assert.mjs', anchor: '!p2b.some(', verdict: 'sound',
    why: 'THE SAME INVERSION, on the planted eaten `\\)` — the widening direction, which only a reject probe can see. See [G-156].' },

  { id: 'G-159', file: 'regex-self-assert.mjs', anchor: '!p3.some(', verdict: 'sound',
    why: 'THE SAME INVERSION, on the registration requirement: a backslash-carrying regex declaring no probes must be refused. See [G-156].' },

  { id: 'G-160', file: 'regex-self-assert.mjs', anchor: '!p6.some(', verdict: 'sound',
    why: 'THE SAME INVERSION, on the planted eaten `\\w` that still matches and still captures — the half `.test` cannot see. See [G-156].' },

  { id: 'G-161', file: 'regex-self-assert.mjs', anchor: 'catch (e) {', verdict: 'sound', family: true,
    why: 'BOTH CATCHES IN THIS FILE, AND NEITHER SWALLOWS. The first wraps `await import(m)` over the adopted set: a module whose registered regex was mangled throws out of its own import, and the catch prints REFUSED TO LOAD with the id and the probe that caught it, then returns 2. The second wraps readFileSync over the swept tree: an unreadable file prints UNREADABLE, increments `unreadable`, and main() returns 2 on any non-zero count before the clean verdict can be reached. A file this scan cannot open contributes the same zero findings as a clean one, which is the shape [D-12] hid in, so it is counted rather than skipped.' },

  // ─── fixture authorship asserted by regeneration, ruling 7 ────────────────────────────
  { id: 'G-143', file: 'assert-fixture-authorship.mjs', anchor: 'catch (e) { out.push({ file: f, unreadable: e.message }); continue; }', verdict: 'sound',
    why: 'A SAMPLE THAT WILL NOT PARSE IS A ROW, NOT A SKIP. The `continue` moves past the fixture only after pushing `{unreadable}`, and authorshipAudit() turns every such row into an UNREADABLE problem before any verdict is computed. A fixture whose authorship cannot be read is not a fixture with no claim — it is the one file in the directory nothing can say anything about, which is exactly the state a provenance check exists to refuse.' },

  { id: 'G-144', file: 'assert-fixture-authorship.mjs', anchor: "const paths = [...new Set([...g.matchAll(/\\b([\\w./-]+\\.mjs)\\b/g)]", verdict: 'guarded',
    why: 'AN EMPTY EXTRACTION IS A REAL AND COMMON STATE HERE, AND IT IS REPORTED AS ITSELF. A `_generated_by` sentence naming no path — "authored by a one-shot generator that was not committed" is one in this tree — makes a claim this instrument cannot check, and the fixture is pushed as `{noPath}`, counted in the header line on every run ("N name no path and make no claim this can check") and listed under --verbose. So a pattern that stopped matching would not quietly shrink the checked population to zero: it would move every fixture into a count printed beside the one it left. The population size is on the transcript, which is what [G-01] asks of an extraction that can legitimately match nothing.' },

  // ─── the construct-vocabulary boundary, ruling 8 ──────────────────────────────────────
  { id: 'G-142', file: '../hubspot/assert-intake-keys.mjs', anchor: 'catch (e) { problems.push(`UNREADABLE DEFINITIONS', verdict: 'sound',
    why: 'THE MODEL CATCH, on the third boundary this file asserts. A definitions file that will not parse, or a missing import, cannot yield a construct list — and an empty construct list is exactly the state in which the vocabulary comparison finds nothing to disagree with and the form reports clean. So the throw becomes an UNREADABLE DEFINITIONS problem and the run exits 2, with the sentence saying which of the two it is: "The construct vocabulary could not be compared, which is not the same as it agreeing." It fired for real on its first run, on a ReferenceError from an import that had not been added yet, and reported it rather than passing.' },

  // ─── [D-06]'s split, and the catch this sweep refused on its first run ────────────────
  { id: 'G-141', file: 'assert-row-shape-spec.mjs', anchor: 'catch (e) { kindsError =', verdict: 'sound',
    why: 'THE SITE THIS SWEEP CORRECTED. Its first draft was `catch { kinds stays empty }` with the comment "left empty, reported by A2" — and A2 would NOT have reported it. Two empty column sets are exactly the state in which every `row_flag` excusal is confirmed, because the excusal is asserted by the ABSENCE of a contradicting binding: no columns, no contradiction, success. A success message guarded by the failure to read. It now records `kindsError` on the acceptor, and A2 pushes A2 UNREADABLE GROUP and `continue`s before judging a single column of that group. `slotColumnKinds` returning null (the group resolved to nothing) takes the same path, so the two ways of failing to read are one report.' },

  // ─── the y-convention audit's readings for the reporters found by [D-12] ──────────────
  { id: 'G-140', file: 'assert-y-convention.mjs', anchor: 'missing: !near.length &&', verdict: 'sound',
    why: 'THE record-shape.mjs READING. `near` is every printed run starting at the x the evidence atom quotes; an EMPTY `near` sets `missing`, and the audit runner counts a `missing` row as an UNREADABLE problem and exits 2. So no run at the quoted coordinates is reported as a reading that did not happen, never as an object that agreed. This is the model shape of every other reading in the same array (verify-headings, align-block, money-probe, correlate-labels all set `missing` the same way), and it is the reason `agrees` is computed separately rather than defaulting to true.' },

  // ─── assert-intake-keys.mjs, the writer-resolver key assertion ────────────────────────
  { id: 'G-131', file: '../hubspot/assert-intake-keys.mjs', anchor: 'catch (e) { universeGaps.push(', verdict: 'sound',
    why: 'THE CROSS-FORM UNIVERSE PRE-PASS. A form whose map or bindings cannot be read is pushed onto `universeGaps`, and every gap becomes a UNIVERSE GAP problem before any verdict is reported. It cannot make the run report success: an unreadable form NARROWS the universe a WIDE verdict is judged against, which would turn a column another form legitimately prints into a column nothing prints, so the gap is the finding rather than a smaller answer to the same question. Its first draft was `catch { continue; }` and this sweep is what refused it.' },

  { id: 'G-132', file: '../hubspot/assert-intake-keys.mjs', anchor: 'catch (e) { problems.push(`UNREADABLE MAP', verdict: 'sound',
    why: 'THE MODEL CATCH, on the per-form loop. An unreadable map is pushed as a problem and the run exits 2. "A form with nothing to check" and "a form this tool could not read" are the two states this whole file is about keeping apart, and the message says which one it is.' },

  { id: 'G-133', file: '../hubspot/assert-intake-keys.mjs', anchor: 'catch (e) { problems.push(`UNREADABLE BINDINGS', verdict: 'sound',
    why: 'Same shape as G-132 on the other input. A form whose definition file will not parse has no option rows and no row shapes, which is indistinguishable from a form with none — so it is reported rather than counted as a clean pass.' },

  // ─── the atLeast primitive and its callers ────────────────────────────────────────────
  { id: 'G-01', file: 'count-sweep.mjs', anchor: 'const ms = re.global ?', verdict: 'sound',
    why: 'THE atLeast PRIMITIVE ITSELF. `pull()` returns `{fail}` when the extraction yields fewer than `atLeast` matches, and every caller turns a `fail` into an UNREADABLE problem rather than skipping. This is the fix for the original defect and the model the rest of this register is judged against.' },

  { id: 'G-02', file: 'count-sweep.mjs', anchor: ".exec(v)", verdict: 'guarded', family: true,
    why: 'A DERIVATION’S RECOGNISER. These sit inside a `derive` that ends `if (!recognised) rows.push({ unrecognised: true })`, and the sweep runner turns an unrecognised claim into a STOP unless the entry declares a `fallback` reason. So a regex that matches nothing does not skip the check — it reports that the claim was not recognised, which is the same report a claim nobody wrote a check for gets.' },

  { id: 'G-03', file: 'count-sweep.mjs', anchor: '.exec(at)[1]', verdict: 'sound', family: true,
    why: 'A STRUCTURAL INDEX read out of the claim PATH, not out of prose. `at` is generated by `claimsIn`’s walk, so the shape is guaranteed by construction — and if it ever were not, `[1]` on a null match THROWS, and the runner catches a throwing derivation as UNREADABLE. A throw is a STOP here, which is why indexing without a null check is correct rather than lucky.' },

  { id: 'G-04', file: 'count-sweep.mjs', anchor: "const m = /^([a-z]+)-([a-z]+)$/.exec(t)", verdict: 'sound',
    why: '`word()` returns undefined for anything it cannot read, and every caller compares that undefined against a derived number — producing a VISIBLE mismatch, never a silent NaN agreement. The comparison is `String(claimed) !== String(derived)`, so `undefined` never equals a figure.' },

  { id: 'G-05', file: 'count-sweep.mjs', anchor: "claimed: [...String(v).matchAll(/\\bp([1-8])\\s+\\d+/g)].length, derived: 0", verdict: 'sound',
    why: 'THE REPAIRED SITE. This is what the original dead regex became. It no longer gates anything: the match COUNT is the claimed side and 0 is the derived side, so a regex that matches nothing claims 0 and agrees with 0 — which is the correct answer, because the branch it sits in has already established `!ctx.unauthoredPages.length`. The reading that the page names no page is the reading being asserted.' },

  { id: 'G-06', file: 'count-sweep.mjs', anchor: "const claimedPages = [...r.ms[0][2].matchAll(/\\d/g)]", verdict: 'sound',
    why: 'Runs only on the success branch of a `pull()` that already declared `atLeast`, and on a capture group that matched. An empty result here would mean the outer regex matched a page list containing no digit, which its own pattern forbids.' },

  { id: 'G-07', file: 'count-sweep.mjs', anchor: "const yOf = (str) => { const y = /y\\s+([\\d.]+)/.exec(str)", verdict: 'sound',
    why: 'Returns null on no-match, and the caller compares the null against a measured y — a visible mismatch, not a skip.' },

  { id: 'G-08', file: 'count-sweep.mjs', anchor: 'catch (e) { problems.push(`UNREADABLE', verdict: 'sound',
    why: 'THE MODEL CATCH. A derivation that throws is reported as UNREADABLE and counted as a problem. The exception is not swallowed; it is the finding.' },

  { id: 'G-08b', file: 'count-sweep.mjs', anchor: "const m = new RegExp(String.raw`(no|${WORD_NUM})_${what}`, 'i').exec(at)", verdict: 'sound',
    why: 'READS THE CLAIM OUT OF THE KEY, AND SAYS SO WHEN IT CANNOT. `claimIn` returns null on no-match, and the caller does NOT treat two nulls as agreement — `if (nev === null && def === null)` returns a `fail` telling the author to rename the key so the claim is in it. An unreadable key is a STOP, which is the whole point of reading the claim from the key rather than the prose.' },

  { id: 'G-08c', file: 'count-sweep.mjs', anchor: 'if ((m = /page (\\d)[\\s\\S]*?(\\d+) of (\\d+) fields\\.?$/.exec(String(v).trim())))', verdict: 'guarded',
    why: 'A `_notes` recogniser — see G-02. Sits inside S-17’s `derive`, which ends `if (!recognised) rows.push({ unrecognised: true })`, so a note that states a count and matches none of the recognisers is reported as unrecognised rather than skipped.' },

  // ─── the gate and its instruments ─────────────────────────────────────────────────────
  { id: 'G-09', file: 'run-form-gate.mjs', anchor: 'if (!opts.some(([o]) => norm(o) === norm(equals)))', verdict: 'sound',
    why: 'THE MODEL NEGATED-SOME, and the reason this shape is in class at all. The line ABOVE it is `if (!opts.length) return { stop: … }`, so the empty case is a STOP before the negated `.some()` is ever reached. On a non-empty set the negation is exact. Every other vacuous shape in this engine is judged against this one: state the empty case first, explicitly, as a failure.' },

  { id: 'G-10', file: 'run-form-gate.mjs', anchor: 'const m = re.exec(String(raw));', verdict: 'sound',
    why: 'FAIL-CLOSED. `if (!m) { r.checkable = false; r.why = "the extract pattern read no amount out of a non-empty cell" }` — an unreadable cell makes the LINE not checkable and says so in the transcript. It does not make the line pass.' },

  { id: 'G-11', file: 'run-form-gate.mjs', anchor: 'const m = /^([A-Za-z0-9_]+)\\[(\\d+)\\]\\.(.+)$/.exec(key)', verdict: 'sound', family: true,
    why: 'A SPELLING DISPATCH, not a guard: `group[row].column` when it matches, a top-level key when it does not. Both branches are real readings and neither is a pass. The same three-line dispatch appears in rounding.mjs and validate-map.mjs and is disposed there under the same reason.' },

  { id: 'G-12', file: 'run-form-gate.mjs', anchor: 'catch (e) { r = fail(', verdict: 'sound',
    why: 'A step that throws becomes a FAILED step. Fail-closed.' },

  { id: 'G-13', file: 'run-form-gate.mjs', anchor: "try { f = live.getField(target); } catch { return { missing: true }; }", verdict: 'sound',
    why: 'Returns a `missing` sentinel the callers test explicitly — a feeder that is missing sets `r.checkable = false` with a reason. The absence is reported, not absorbed.' },

  { id: 'G-14', file: 'run-form-gate.mjs', anchor: 'let f; try { f = live.getField(target); } catch { return null; }', verdict: 'sound',
    why: 'Returns null, and `isChecked()` returning null is handled at every call site as `undecidable` — "option is not a checkbox on the filled PDF" — which stops the predicate rather than defaulting it to false. A predicate that defaulted to false would disable its line and still read as a pass.' },

  { id: 'G-15', file: 'run-form-gate.mjs', anchor: "const head = spawnSync(process.execPath, ['-e'", verdict: 'sound',
    why: 'The git short HEAD for the summary block, falling back to the literal string "(not a git tree)". Cosmetic provenance; asserts nothing and gates nothing.' },

  { id: 'G-16', file: 'rounding.mjs', anchor: "const m = /^([A-Za-z0-9_]+)\\[(\\d+)\\]\\.(.+)$/.exec(spelling)", verdict: 'sound',
    why: 'The spelling dispatch — see G-11. `blockFor` returning null means "this cell is in no rounding block", which is a real answer that applyRounding honours by leaving the cell untouched.' },

  { id: 'G-17', file: 'validate-map.mjs', anchor: "const m = /^([A-Za-z0-9_]+)\\[(\\d+)\\]\\.(.+)$/.exec(b)", verdict: 'sound',
    why: 'The spelling dispatch — see G-11.' },

  // ─── the fill engines ─────────────────────────────────────────────────────────────────
  { id: 'G-18', file: /^fill-433(a|f|aoi)\.mjs$/, anchor: 'catch { skipped.push(name); return; }', verdict: 'sound', family: true,
    why: 'A target that is not a text field on the PDF is recorded in `skipped[]`, which is printed at the end of every fill. It is not silently dropped — and the binding itself is separately proved to exist by validate-map.mjs, which fails on any target absent from the field list. Two independent readings, and the fill’s own one is reported rather than swallowed.' },

  { id: 'G-19', file: /^fill-433(a|f|aoi)\.mjs$/, anchor: 'catch (e) { capacityErrors.push(', verdict: 'sound', family: true,
    why: 'AN OVERFLOW IS A HARD STOP. The catch records the offending value and its /MaxLen, and the engine refuses to write the PDF. It never truncates a filed form.' },

  { id: 'G-20', file: /^fill-433(a|f|aoi)\.mjs$/, anchor: 'catch { skipped.push(name); }', verdict: 'sound', family: true,
    why: 'The checkbox arm of G-18, with the same reporting and the same independent proof in validate-map.mjs.' },

  { id: 'G-21', file: /^fill-433(a|f|aoi)\.mjs$/, anchor: 'try { return form.getCheckBox(n).isChecked(); } catch { return false; }', verdict: 'sound', family: true,
    why: 'READ-SIDE ONLY, and only for predicates over boxes the same engine has already written in this process. A name that is not a checkbox here cannot be one the fill checked, so `false` is the true answer rather than a default. The gate’s own predicate reader — G-14 — makes the opposite choice on purpose, because IT reads a PDF it did not write and cannot assume that.' },

  { id: 'G-22', file: 'fill-433a.mjs', anchor: 'if (!allowedErrors.length &&', verdict: 'sound', family: true,
    why: 'A CONDITIONAL WRITE, not a check: the two auto-filled IRS-allowed lines are written only when nothing about the allowed block is in error. `allowedErrors` being empty is the success condition being tested for, and the errors themselves are reported and hard-stop separately. Nothing here reports a pass. Both sites — the national-standards total and the out-of-pocket health line — take the same reason.' },

  { id: 'G-23', file: 'fill-433a.mjs', anchor: "const m = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(String(raw).trim())", verdict: 'sound',
    why: 'A date-shape dispatch: an ISO date is reformatted, anything else is passed through verbatim to the /MaxLen guard. Neither branch asserts anything.' },

  { id: 'G-24', file: 'fill-433f.mjs', anchor: 'if (i < flags.length && truthy(', verdict: 'sound',
    why: 'AN ARRAY BOUNDS TEST inside a loop, not a guard over a result set. `flags` is the printed row’s checkbox list and `i` is the row index; the test stops the engine writing past the last printed row.' },

  { id: 'G-25', file: 'fill-433aoi.mjs', anchor: 'catch (e) { totalsWhy = e.message; }', verdict: 'FIXED',
    why: 'WAS VACUOUS AND WAS WRITING PDFs OVER IT. An unreadable 433aoi.totals.json left `totalsDoc` null, the money-cell cross-check then had nothing to cross-check against, and the engine printed `rounding: NOTE — … the money-cell cross-check did not run` and WROTE THE PDF ANYWAY. A note printed beside a filed form is a pass. It is now a STOP: an unreadable totals file reports that it could not be read and no PDF is written. See the third-sweep note in that file.' },

  // ─── the verifiers ────────────────────────────────────────────────────────────────────
  { id: 'G-26', file: 'verify-form-coverage.mjs', anchor: 'const allDeferred = targets.every(t => deferred.has(t))', verdict: 'FIXED',
    why: 'LATENT AND NOW CLOSED. `[].every(…)` is true, so an exclusive set declaring ZERO targets was `allDeferred`, expected 0 checked, found 0 checked, and reported as a satisfied exclusive set — a checkbox group nobody had bound, passing as a checkbox group correctly bound. No map in the tree holds an empty exclusive array today (the `_note` keys are strings and are filtered out one line above), so it never fired; that is exactly the state the original dead regex was in on the day it shipped. An empty set is now a STOP.' },

  { id: 'G-27', file: 'verify-form-coverage.mjs', anchor: 'if (B.text_empty.length && r.saturated)', verdict: 'sound',
    why: 'Empty means no mapped text cell was left unfed, which is the success condition. That the map bound any cells AT ALL is proved independently and much more strongly by the partition — form_fields_total, in_this_slice, bound_writable, excluded_never_autofill, deferred and unaccounted are each derived from widget geometry by count-sweep [S-01], and a map that bound nothing could not satisfy them.' },

  { id: 'G-28', file: 'verify-headings.mjs', anchor: 'if (!errors.length && !bad.length)', verdict: 'FIXED',
    why: 'STATED ITS SCOPE BUT DID NOT REQUIRE ONE. The all-clear printed `${nRows} group row(s) across ${report.length} group(s)`, so a zero was visible to a reader — but the process still exited 0, and a gate step that examines nothing and exits 0 is the shape this sweep exists to end. It now requires at least one group row and stops when it has none, saying so.' },

  { id: 'G-29', file: 'verify-headings.mjs', anchor: 'catch { return null; } };', verdict: 'sound', family: true,
    why: 'Reading the FILLED pdf: a target that is not a text field (or not a checkbox) comes back null, and `headingFor`/the row reporter treat null as "this row printed nothing" rather than as agreement. The filled PDF is optional input to this tool; when it is absent every row reports as unprinted, which is visible.' },

  { id: 'G-30', file: 'check-row-shape.mjs', anchor: 'if (!wrong.length && !misdirected.length)', verdict: 'FIXED',
    why: 'THE CLEAREST VACUOUS GUARD LEFT IN THE ENGINE. `checkRowClasses` skips a group when it declares no `row_class` and again when the record carries no rows for it, so a run in which EVERY group was skipped produced empty `wrong` and empty `misdirected` and printed "every slotted row that states an asset class states one its group prints" over zero rows examined. It now derives and states `examined`, and zero examined prints as zero examined rather than as an all-clear.' },

  { id: 'G-56', file: 'blanket-audit.mjs', anchor: "out.push({ file: f, unreadable: true }); continue;", verdict: 'sound',
    why: "AN UNREADABLE FILE IS CARRIED AS A FINDING, NOT SKIPPED. The catch does not `continue` past the file - it records it as `unreadable: true`, and auditBlankets turns every such record into a DETECTOR UNREADABLE problem, which is a STOP. That is the opposite of the vacuous shape: the check that could not read its input reports that it could not read its input, rather than reporting success over what it did read. The surrounding derivation is also self-checking in both directions - a candidate the signature finds and the register does not dispose is a STOP, and a register entry the signature no longer finds is a STALE DETECTOR ENTRY STOP, which is what caught the first draft of the signature being too narrow to see the three instruments the rule is modelled on." },

  { id: 'G-55', file: 'assert-row-class-routes.mjs', anchor: "code = e.status ?? 1;", verdict: 'sound',
    why: "THE CATCH IS THE SUCCESS PATH HERE, WHICH IS WHY IT LOOKS BACKWARDS. This harness poisons a fixture with a class the group does not accept and runs the real fill engine; a STOPPED engine exits non-zero, so execFileSync THROWS and this catch is where the expected outcome arrives. An empty `out` cannot make it report success: the verdict is `code !== 0 && named`, and `named` is a regex requiring the literal string 'ROW CLASS MISMATCH' followed by that group's own `group[0]`, so an empty or unreadable output fails `named` and the run is reported DID NOT STOP. The reverse shape - the engine exiting zero - lands in the try with code 0 and also fails. And the harness carries a canary with an ASSERTED expected yield, one refusal of `__canary_not_a_class__` per declaring group, so a run in which this catch stopped receiving anything reports 0 of 32 rather than a clean sweep. Proved by breaking it: with the poison write removed the harness reported 64 DID NOT STOP, CANARY 0 of 32, and exited 2." },

  { id: 'G-31', file: 'money-probe.mjs', anchor: 'if (pages.length && !pages.includes(w.page)) continue;', verdict: 'sound',
    why: 'A CLI OPTION, not a guard: no `--pages` argument means every page. The empty case is the documented default and the header states it.' },

  { id: 'G-32', file: 'line-markers.mjs', anchor: '.match(', verdict: 'sound', family: true,
    why: 'THE NOT-A-MARKER PATH. A printed run that matches neither pattern is `continue`d, which is the correct reading — most runs on a form are not line markers. The tool reports its own total ("N printed marker(s)") so a pattern that matched nothing would print zero rather than an empty success. The form-specific spellings are declared rather than guessed; see that file’s header.' },

  { id: 'G-33', file: 'read-form-revision.mjs', anchor: '.match(', verdict: 'sound', family: true,
    why: 'AN UNREADABLE PIN IS A MISMATCH, WHICH IS A STOP. Every extraction in this file — the form number in its three spellings, the revision, the catalog number — returns null when the drawn text does not carry the string, and validate-map.mjs compares the result against the map’s pinned `form_revision` and `catalog`: `null === "4-2026"` is false, so a PDF whose revision could not be read fails the pin exactly as a wrong revision does, with the null printed as "(none)" in the transcript. The CLI additionally stops outright on a null revision. The three form-number spellings are tried in order and are a DISPATCH — the OIC forms print "Form433-A(OIC)(Rev" and the others do not — not a guard; the form number is not what the pin is checked on.' },

  { id: 'G-34', file: 'read-form-revision.mjs', anchor: 'catch { /* try raw, else skip */ }', verdict: 'sound',
    why: 'Content-stream inflation tried per filter, per stream. A stream that will not inflate is skipped and the COUNT of inflated streams is reported with the result, so a read that inflated nothing is visible in its own output rather than presented as a clean read of an empty document.' },

  { id: 'G-37b', file: 'render-review.mjs', anchor: "try { f = live.getField(target); } catch { return { kind: 'missing' }; }", verdict: 'sound',
    why: 'Returns a `missing` kind the review renderer prints as a missing cell on the page. The review page is a READING SURFACE for a person — it asserts nothing and gates nothing — and a target it cannot read is shown as unreadable rather than blank.' },

  { id: 'G-36', file: 'verify-appearances.mjs', anchor: 'while (i < src.length &&', verdict: 'sound', family: true,
    why: 'CONTENT-STREAM TOKENISER BOUNDS. `i < src.length` stops a scan running off the end of the buffer. Not a guard over a result set; there is no empty-input reading of it.' },

  { id: 'G-37', file: 'verify-appearances.mjs', anchor: 'try { return', verdict: 'sound', family: true,
    why: 'THREE DECODE STRATEGIES TRIED IN ORDER, and the last one returns null rather than falling through to a default. `decodePDFRawStream` first, then `getUnencodedContents`, then `getContents`; the middle one’s `catch { /* fall through */ }` moves to the next strategy rather than answering, and the last one’s `catch { return null; }` is the end of the line. The caller reports an undecodable appearance stream as a finding — an appearance this tool cannot read is exactly as unproved as one that is wrong, and it says so rather than counting it clean.' },

  { id: 'G-38', file: 'probe-checkboxes.mjs', anchor: "catch (e) { on = 'ERR:' + e.message; }", verdict: 'sound',
    why: 'A DIAGNOSTIC CLI that prints each checkbox’s on-state. The error text is printed in the cell where the state would go, so a failure is louder in the output than a success, not quieter. Nothing reads this tool’s output programmatically.' },

  // ─── the marker-count derivation [S-26] ──────────────────────────────────
  { id: 'G-43', file: 'count-sweep.mjs', anchor: 'const numbered = [...str.matchAll(', verdict: 'guarded', family: true,
    why: 'THE ENUMERATION COUNTERS FOR [S-26], AND THE EMPTY READING IS STATED FIRST. Both extractions can legitimately read zero — most `_printed_markers` prose lists no marker at all and belongs to [S-18], and page 8 of this form genuinely draws none — so an empty result cannot simply be a failure. What it also cannot be is a silent hand-off, because a changed enumeration format looks exactly like a string with no list: the stated count survives and the entry that checks it steps aside. So the line below skips ONLY a string that lists no marker AND states no count. A string that states a count is always compared, even against a derived 0, and one claiming a non-zero count beside no readable list comes out as a MISMATCH naming both sides. Three readings, three outcomes, none of them a pass. THE FIRST VERSION MADE THE STATED-COUNT-WITH-NO-LIST CASE A `fail`, and it reported page 8’s honest "reports 0 on page 8" as an unreadable input — right about the risk, wrong about which reading carried it, and caught by the sweep it was written for on the first run.' },

  { id: 'G-81', file: 'validate-map.mjs', anchor: 'const cb = /^([A-Za-z0-9_]+)', verdict: 'sound',
    why: 'A SPELLING DISPATCH IN resolveBinding, AND THE END OF THE CHAIN IS A NAMED FAILURE. Four spellings are tried in order - a scalar `map` key, a group[row].column cell, a `check_here` key, and this one, checkboxSet.option. A no-match here falls through to the final `return { how: ... }`, which carries no `target`, and the caller reports a registry entry whose declared binding does not resolve as a problem naming all four spellings it tried. So an unparsed `bound_to` is a failure with the reason printed, never an entry quietly accepted - which matters more here than in the other dispatches of this shape, because the thing being checked IS whether the map still points the key at the field the registry names.' },

  { id: 'G-43b', file: 'count-sweep.mjs', anchor: 'const boxes    = [...str.matchAll(', verdict: 'guarded',
    why: 'THE BOX-MARKER HALF OF [G-43], with the same disposition: an empty result is compared rather than short-circuited whenever the string states a count, and is skipped only when the string states none. Given its own entry rather than folded into G-43 as a family, because the two patterns read DIFFERENT marker spellings — parenthesised numbers and lettered Boxes — and a form that changed one and not the other would leave a family disposition standing over a pattern nobody re-read.' },

  { id: 'G-44', file: 'count-sweep.mjs', anchor: "for (const m of str.matchAll(new RegExp(re, 'gi')))", verdict: 'sound',
    why: 'THE RECOGNISER LOOP FOR [S-26]. A phrasing that matches nothing leaves `hit` false; every recogniser returning false leaves `recognised` false; and the derivation then pushes `{ unrecognised: true }`, which the runner turns into the entry’s declared fallback — an underivable whose reason NAMES the four phrasings it looked for. An unrecognised phrasing is reported with the gap described, never counted as agreement. The loop is also why each recogniser runs over EVERY occurrence rather than the first: the string this entry was written for stated the same wrong figure twice in one sentence, and a `.exec` would have found one of them and passed.' },

  // ─── the over-max assertion ──────────────────────────────────────────────────────────
  { id: 'G-39', file: 'assert-overflow.mjs', anchor: 'const ids = [...new Set(logLines.flatMap(', verdict: 'sound',
    why: 'FAILS CLOSED IN BOTH DIRECTIONS, AND THE EMPTY CASE IS ALREADY A STOP ABOVE IT. If the pattern reads no `group[index]` token out of any of the engine\u2019s OVERFLOW lines, `ids` is empty, every expected drop lands in `missing`, and each becomes an UNLOGGED problem \u2014 the loudest outcome the tool has, not the quietest. The other empty reading, no OVERFLOW line at all, never reaches the comparison: the caller exits 2 when no such line is present while drops are expected. And an over-max fixture that dropped nothing cannot get that far either, because question 1 pushes a NOT OVER-MAX problem for every group not run past its last slot. THIS ENTRY WAS RE-WRITTEN, NOT RE-ANCHORED: it used to stand over `const logged = logLine ? ...`, a reader that took the FIRST line opening OVERFLOW and no other, and what it said was true of that reader while the reader itself was wrong \u2014 fill-433b.mjs logged a line per drop and two of three drops were reported unlogged. A sound disposition over a defective line is exactly what an ORPHAN check is for. The reader is now a named function with six canary cases, run before any real form is examined.' },

  // [G-42] WAS HERE AND IS GONE, WITH THE CODE IT DISPOSED OF. It read, verbatim:
  //   anchor 'runs[0].unexercised.filter(id => runs.every(' -- verdict sound --
  //   "THE EMPTY-`runs` READING CANNOT HAPPEN, AND IS NOT WHAT THIS SHAPE RISKS ANYWAY. `runs`
  //   is non-empty by construction: the CLI exits 2 when no fixture is given, and every fixture
  //   either pushes a run or exits 2 before reaching here, so `.every` is never asked about an
  //   empty list. The reading worth stating is the OTHER one: `runs[0].unexercised` may
  //   legitimately be empty, and then `still` is empty and the tool reports that every declared
  //   behaviour is exercised by at least one fixture. That is the correct answer and not a
  //   vacuous pass -- an empty unexercised list on the first fixture means that fixture
  //   exercised everything, and the intersection with anything else is empty for a reason, not
  //   for want of data. Seeding the intersection from `runs[0]` is exact because a declaration
  //   unexercised by every fixture is in particular unexercised by the first."
  // WHAT IT GOT RIGHT: `runs` is non-empty by construction, and that argument still holds for
  // the flatMap that replaced the `.every`. WHAT IT GOT WRONG: it certified a computation that
  // was answering the wrong question. Intersecting the UNEXERCISED lists reads "this
  // declaration was absent from that run" as "that run exercised it", so a zero constant that
  // is in class only on the leased branch, and a second zero constant in class only on the
  // owned branch, cancelled each other out and 433-A(OIC) reported 80 of 83 with neither ever
  // proved. The disposition was sound about the shape and silent about the meaning, which is
  // the [N-05] failure at one more level out: a guard can be correct and still guard nothing
  // worth guarding. The replacement unions the IN-CLASS sets, and the anchor is retired rather
  // than re-pointed because the line it named no longer exists.
  { id: 'G-41', file: 'declaration-coverage.mjs', anchor: "const m = /^([a-z_]+): (.*)$/.exec(line.trim());", verdict: 'sound',
    why: 'FAIL-CLOSED BY THE LOOP UNDER IT. A summary block whose lines match nothing leaves `kv` empty, and the very next statement walks the four keys this tool needs and exits 2 naming the one it could not read. So a block this pattern cannot parse produces a STOP that names the missing key, never a fixture that silently contributes nothing to the union — which is the reading that would matter here, because a fixture contributing nothing and a fixture whose contribution was not read are indistinguishable in the union and only one of them is a fact.' },

  { id: 'G-40', file: 'assert-overflow.mjs', anchor: 'if (!missing.length && !extra.length) console.log(', verdict: 'sound',
    why: 'GATES A CONSOLE LINE, NOT A VERDICT. This is the shape of the original defect — two empty lists reading as agreement — and here the two empty lists ARE agreement, because they are the two directions of a set comparison whose populated case was already turned into a `problems.push` on the two lines above. The verdict is computed from `problems.length` at the end of the file and never from this branch, so deleting this line would change what the transcript says and not what the tool decides. Named rather than left undisposed, because "it only prints" is exactly the excuse the [N-05] generation of this defect was hiding behind, and the check is that the printing and the deciding are two different statements about the same fact.' },
  // ─── the row-shape specification assertion ────────────────────────────────────────────
  { id: 'G-77', file: 'assert-row-shape-spec.mjs', anchor: 'try { cols = slotColumnsOf(map, group) || []; } catch { cols = []; }', verdict: 'sound',
    why: 'FAILS OPEN INTO THE LOUDEST POSSIBLE REPORT. `cols` is the set A2 asks every contributed column to be reachable in, so an empty one makes EVERY column of that class report as MISSING COLUMN on that group. A group whose slots cannot be read does not quietly pass this check; it fails it as many times as the class has columns. The catch is there because slotColumnsOf throws on a malformed slot list and a throw at that point would take the whole assertion down instead of reporting the one group.' },

  { id: 'G-78', file: 'assert-row-shape-spec.mjs', anchor: 'if (real.length && !routed && !un[form])', verdict: 'guarded',
    why: 'THE `length &&` SHAPE, AND THE ONE PLACE IN THIS FILE IT COULD HAVE GONE WRONG. `real` is what survives `claimsNothing()`, so a filter that quietly widened would empty `real` and switch the routing assertion off with no output at all. Two things close it. The empty case is disposed by the NEXT check in the same loop — an `unrouted` declaration for a form with no routable claim is reported as ORPHAN UNROUTED, so a class whose claims all vanished cannot keep a silent declaration standing over nothing. And `excusedClaims()` enumerates every entry the filter removed, with its class and its text, and reportRowShapeSpec prints the count on every run. An assertion that stops asserting here cannot do it without saying how many claims it excused.' },

  // ─── the reachability scan [D-08] added to exclusion-sweep ───────────────────────────
  { id: 'G-101', file: 'exclusion-sweep.mjs', anchor: "const own = ln.match(DEF);", verdict: 'guarded',
    why: 'THE OWN-DEFINITION HALF OF REACHABILITY. Reading nothing here makes a file appear to define no predicates, so every exclusion site in it goes unattributed and every register entry naming it ORPHANS — which is loud rather than silent, and is the same closure [G-65] rests on. It is additionally closed by the reachability canary: a synthetic tree in which x/a.mjs defines a predicate and x/c.mjs imports it must resolve to x/a.mjs, and a dead own-definition scan cannot produce that resolution. Renamed from `m` to `own` in the same commit so this disposition and [G-65] anchor on different lines; two identical lines in one file cannot carry two different verdicts.' },

  { id: 'G-102', file: 'exclusion-sweep.mjs', anchor: 'const m = ln.match(IMPORT);', verdict: 'guarded',
    why: 'THE IMPORT HALF, AND ITS EMPTY CASE IS THE SAFE DIRECTION. Reading no imports makes reachability strictly NARROWER — a file reaches only what it defines itself — so a site legitimately governed by an imported predicate goes unattributed and its register entry ORPHANS. It cannot make a site LOOK disposed that is not, which is the direction [D-08] is about. The canary demands the positive direction as well: x/c.mjs must reach isChecked THROUGH its import and resolve it back to x/a.mjs, so an import scan that reads nothing takes the sweep down before any real attribution is trusted.' },

  { id: 'G-103', file: 'exclusion-sweep.mjs', anchor: "const as = /^(\\S+)\\s+as\\s+(\\S+)$/.exec(t);", verdict: 'sound',
    why: 'NO MATCH IS THE COMMON CASE AND THE CORRECT ANSWER. `import { a }` has no `as`, and the else branch takes the local name and the original name to be the same, which they are. A dead regex would treat `import { a as b }` as importing a name called "a as b", which resolves against no definition and therefore attributes nothing — narrower again, and ORPHAN-visible. There is no renaming import in the swept files today, so this line is exercised only in its no-match direction; the canary exercises neither and that is stated rather than implied.' },

  // ─── the four HubSpot local-set instruments ──────────────────────────────────────────
  //
  // These four came into this sweep when adapters/pdf/sweep-boundary.mjs [SB-22] contradicted
  // the reason they had been left out of it. They never touch the portal, they decide from
  // local sets and they can stop a run, which is the vacuous-guard shape exactly.
  { id: 'G-93', file: '../hubspot/gen-fields-from-crosswalk.mjs', anchor: '} catch {', verdict: 'sound',
    why: 'THE CATCH IS THE STOP. It wraps an execFileSync of validate-crosswalk.mjs and its body prints "nothing written" and exits 2. There is no empty input that reaches this branch and produces success — the branch IS the failure path, and the success path is the one where the validator exited 0. A generator that refused to transcribe an unvalidated crosswalk is the point of the call.' },

  { id: 'G-200', file: '../hubspot/validate-crosswalk.mjs', anchor: 'const removed = owner.options.filter((o) => !p.options.some((x) => String(x.value) === String(o.value)));', verdict: 'sound',
    why: "AN EMPTY `removed` IS THE PASSING ANSWER AND IT CANNOT BE REACHED VACUOUSLY, because the population it filters is the OWNER's option list, not the reused row's. A7 asks whether a row reusing another form's enumeration has DROPPED any value that form declares; `owner.options` is the set that must survive, and the two lines above this one return early unless the owner exists and declares options. So an empty result means every owner value is present, which is the fact being asserted. THE VACUOUS FORM WOULD BE THE OTHER DIRECTION — filtering the row's own options and finding none, which an empty row satisfies. It is written this way round for that reason. A dropped option is not cosmetic: HubSpot records already carrying the value keep it while the definition no longer offers it, and no error is raised at any point." },

  { id: 'G-210', file: '../hubspot/post-pass-sweep.mjs', anchor: 'catch (e) { unreadable = e.message; }', verdict: 'sound',
    why: 'A SWEPT FILE THAT CANNOT BE READ IS RETURNED AS UNREADABLE, NOT DROPPED, and runSweep() turns that into a STOP by name one function out. This is the [R-17] shape written into a new instrument on purpose: `if (matches.length && mismatch)` printed PASS because a guard that could not read its input reported on an empty set, and the fix is that an unreadable input has its own state rather than becoming an absent one. A file this sweep cannot read is not a file with no portal questions in it; it is a file nobody can ask, and the run says exactly that and exits 2.' },

  { id: 'G-211', file: '../hubspot/post-pass-sweep.mjs', anchor: 'if (!out.problems.some((x) => x.startsWith(p.want)))', verdict: 'sound',
    why: 'THE CANARY\'S "WAS THE PLANTED CASE CAUGHT" TEST, and the vacuous direction — an empty `problems` making `!some` true — is the direction that REPORTS THE CANARY DEAD. A judge that found nothing at all fails this line rather than passing it, which is the opposite of the defect the shape names. The other half of the pair is asserted separately and is the half a presence-only canary would miss: a CONFORMING synthetic file must raise no problem, so a sweep that refused everything would satisfy every line here and still be caught.' },

  { id: 'G-94', file: '../hubspot/gen-fields-from-map.mjs', anchor: 'const m = MARKER.exec(key);', verdict: 'sound',
    why: "NO MATCH IS THE ANSWER, NOT A FAILURE TO ANSWER. lineRef returns null for a key naming a concept the form does not number — marital_status, the allowable inputs — and null is written into the output as line_ref: null rather than dropped. A reviewer sees \"this key carries no printed marker\", which is a fact about the key, and no empty input makes this site report success. THAT MUCH IS THIS SITE'S OWN AND IT ALWAYS STOOD. WHAT DID NOT: this entry once claimed a dead regex \"is caught one level out: adapters/hubspot/validate-crosswalk.mjs compares the generated file against the crosswalk, whose bindings carry the printed markers independently\". VALIDATE-CROSSWALK.MJS DOES NOT READ line_ref, ON ANY FORM — it joins by `key` and `hs_name`, and the string does not occur in it — and until [D-16] it could not be run on 433-A at all, the very form this generator writes, because 433-A IS the backbone. A backstop named for a form the guard could not be pointed at, checking a column it never reads. That is [R-13], and it was carried as [D-17]. [D-17] IS NOW CLOSED AND THE BACKSTOP IS REAL. The pattern is bound to MARKER and registered as [RX-GF-01] in adapters/pdf/regex-self-assert.mjs, with four match probes, four reject probes and four CAPTURE probes — captures because this regex is read for its group, and a group can go on being returned while spanning the wrong text. The assertion runs when this module loads, which is every generator run, immediately before 186 permanent property definitions are written. THE OTHER DISPOSITION WAS REFUSED FOR A STATED REASON. Registering it as a boundary exclusion on [D-17]'s own ground — \"line_ref is a display column and no downstream check reads it\" — would have been an exclusion whose reason is false of the thing it excuses ([R-14]): describe() calls lineRef() too, and 168 of the 186 descriptions in fields.433a.json carry \"433-A line <ref>\" into a permanent HubSpot property field, while stripMarker() uses the same pattern to derive most of the property name. AND THE REGEX WAS NEVER DEAD: measured on the 186 keys it resolves 168 and returns null for 18, and every stored line_ref equals a live re-derivation. It failed to catch nothing, because it was working; what was missing was anything that would notice if it stopped." },

  { id: 'G-95', file: '../hubspot/gen-fields-from-map.mjs', anchor: 'const m = /^(\\d+)/.exec(key);', verdict: 'sound',
    why: 'SAME SHAPE, AND THE FAIL-OPEN DIRECTION IS THE SAFE ONE HERE. printedLineNo returns null when a key does not open with a printed line number, and inMoneyBand then returns FALSE — so a key this pattern cannot read is treated as NOT money, which means it is not given a money fieldType it might not deserve. A dead regex makes every key non-money, and that shows immediately as a generated file with no currency properties in it, against a crosswalk that names them.' },

  { id: 'G-96', file: '../hubspot/gen-fields-from-map.mjs', anchor: 'const yesno = values.length === 2 && values.every', verdict: 'sound',
    why: 'THE `length === 2 &&` GUARDS THE `every`, WHICH IS THE WHOLE POINT. An empty options object gives values.length 0, the conjunction is false before every() is reached, and the set is emitted as a named-option select rather than as a booleancheckbox — the wider of the two shapes, which loses no value. The vacuous case the shape is dangerous in — every() over an empty array returning true — cannot arise, because the length test runs first and demands exactly two.' },

  { id: 'G-97', file: '../hubspot/reclassify-against-backbone.mjs', anchor: 'let doc; try { doc = R(`adapters/hubspot/${file}`); } catch { continue; }', verdict: 'guarded', family: true,
    why: 'TWO SITES, ONE DISPOSITION, AND THEY ARE THE [G-01] SHAPE HELD OPEN DELIBERATELY. A per-form fields file or crosswalk that is absent contributes nothing to the backbone and the loop moves on — which is right, because a form whose file has not been generated yet genuinely contributes no names. What makes it not a silent zero is that the backbone this builds is REPORTED with its contributor set per name, so a form that contributed nothing appears as a form no name is attributed to, and the coverage figures downstream are per form. The dangerous version of this catch would be one that swallowed a PARSE error on a file that exists; it does, and that is the half this entry does not cover — carried, not claimed closed.' },

  { id: 'G-98', file: '../hubspot/reclassify-against-backbone.mjs', anchor: "try { for (const p of (R('adapters/hubspot/fields.registry.json').properties || []))", verdict: 'sound',
    why: 'ABSENCE IS A DECLARED STATE AND THE REPORT SAYS SO. The shared registry carries names contributed before the per-form files existed, and every name it supplies is attributed to the contributor `registry` rather than to a form — so a run in which the registry is missing produces a backbone with no `registry` contributor at all, which is visible in the contributor tally the report prints. The comment on the catch says exactly this, and it is the difference between a swallowed read and a declared one.' },

  { id: 'G-99', file: '../hubspot/reclassify-against-backbone.mjs', anchor: "for (const m of String(e.a433 || '').matchAll(/groups\\.([A-Za-z0-9_]+)/g))", verdict: 'guarded',
    why: 'AN EXTRACT WHOSE EMPTY CASE WOULD SKIP AN ASSERTION, CLOSED BY THE CHECK ABOVE IT. It pulls group names out of an `asymmetric-the-other-way` entry so the C-22 clash test can run on them; reading none means that entry is asserted against nothing. What closes it is the NO ROW CLASS problem pushed immediately above: every 433-A group is required to declare a row_class first, and the assertion is over entries whose text names groups in the `groups.NAME` spelling the classification file is written in. An entry that stopped yielding group names would be an entry whose text stopped naming groups, which the classification’s own schema check refuses.' },

  { id: 'G-100', file: '../hubspot/reclassify-against-backbone.mjs', anchor: 'const m = /^([A-Za-z0-9]+_)(.+)$/.exec(k);', verdict: 'sound',
    why: 'NO MATCH IS SKIPPED AND THAT IS THE CORRECT READING. blocksOf splits a covered key into prefix and suffix so two entries can be compared for whether one swept up more than the other; a key with no underscore prefix belongs to no block and contributes to neither side of that comparison. A dead regex empties every block map, which makes every granularity comparison find NO difference — and that is the direction this file was rewritten to stop reporting as agreement: the granularity check states the size of both blocks it compared, so two empty ones read as two empty ones rather than as a match.' },

  // ─── 433-B(OIC) slice 3's derivations ────────────────────────────────────────────────
  { id: 'G-118', file: 'count-sweep.mjs', anchor: 'on page ([456])/g))', verdict: 'guarded',
    why: 'THE PER-PAGE HALF OF [S-32], AND ITS EMPTY CASE IS CLOSED BY THE TOTAL IN THE SAME SENTENCE. Reading no per-page figures yields no per-page comparisons, and the prose could then claim any distribution across the three pages with nothing to contradict it. What gates entry to this loop at all is the total - "binds N fields" - which is pulled by its own regex on the line above and compared against the widget count for pages 4, 5 and 6 summed. A run in which the per-page loop reads nothing still asserts 94, and a total that agrees while every per-page figure went unread cannot also be wrong about the distribution by more than a compensating pair. The stronger guard is one level out: _partition._check states the same three figures in a different phrasing and [S-03] refuses to pass when it can read fewer than six of them.' },

  { id: 'G-119', file: 'count-sweep.mjs', anchor: "of page (" + String.raw`\d` + ")'s (", verdict: 'guarded',
    why: 'THE PAGE-5 AND PAGE-6 CHECKBOX SPLIT, closed the same way and by a second reading. An empty match leaves those four figures uncompared; the page-4 figures in the SAME string are pulled by two separate regexes above and are compared, so the site cannot go entirely quiet. And the four figures it reads are widget counts per page, which [S-32] also derives from the "binds N fields: N on page 4, N on page 5 and N on page 6" sentence and which [S-03] derives again from _partition._check. Three readings of the same two numbers, in three phrasings, in two files.' },

  // ─── the counter universe assertion and the fixture resolver ─────────────────────────
  { id: 'G-115', file: 'blanket-audit.mjs', anchor: 'exec(String(m)); return !!g &&', verdict: 'sound',
    why: 'NO MATCH IS "OUT OF SCOPE", WHICH IS THE STOP AND NOT THE PASS. This is the [K-23] scope predicate: a member it cannot parse is refused, the counter is reported as UNIVERSE MOVED and the run fails naming the member. A dead pattern therefore makes every member stray and takes the audit down loudly; it cannot make a universe look in-scope. Its first draft stripped non-digits instead of reading the brackets, so 4ac_vehicles[0] became 40 and every real slot fell outside its own scope - which this assertion reported on its first run, before the map could be edited to fit it.' },

  { id: 'G-116', file: 'blanket-audit.mjs', anchor: 'catch (scopeErr) {', verdict: 'sound',
    _named_scopeErr_on_purpose: 'It was `catch (e) {` for one run, and a bare `catch (e) {` is a substring of the anchors [G-52] and [G-53] already stand on — so this entry matched their lines first and ORPHANED both. A register keyed on a line needs its lines to be distinguishable, which is the same lesson as [D-08] with a catch variable in place of a predicate name.',
    why: 'THE SCOPE PREDICATE THROWING IS A COUNTER DEAD, not a member quietly admitted. A predicate that cannot be evaluated has not asserted anything, and the disposed row records the throw with the counter id so the transcript names which counter stopped being checkable.' },

  { id: 'G-117', file: 'resolve-fixture.mjs', anchor: 'catch (e) { return { path, unreadable: e.message }; }', verdict: 'sound',
    why: 'A FIXTURE THAT WILL NOT PARSE IS UNREADABLE, NOT ABSENT, and resolveFixture turns that flag into a problem naming the file and the parse error. If it were dropped, a form whose ONLY acceptance fixture is corrupt would resolve to "no acceptance fixture" - a different and much more misleading message - or, worse, to a second candidate. The whole point of this file is that resolution never returns a guess, and a file it could not read is the case where guessing is most tempting.' },

  // ─── the sweep-boundary register ─────────────────────────────────────────────────────
  { id: 'G-123', file: 'sweep-boundary.mjs', anchor: 'let doc; try { doc = JSON.parse(r(`samples/${f}`)); } catch { continue; }', verdict: 'sound',
    why: 'IT IS INSIDE AN observe(), NOT A CROSSCHECK, and an observation is a printed line rather than a verdict. The loop counts how many scratchpad scripts a fixture names; a fixture that will not parse names none, which is the correct contribution from an unreadable file to a tally of citations. The SAME directory is walked by [SB-17], whose crosscheck reports every unparseable fixture by name and turns it into a problem - so an unreadable fixture is never silent in this run, it is simply not silent HERE.' },

  { id: 'G-120', file: 'sweep-boundary.mjs', anchor: 'catch { return false; } }).length,', verdict: 'sound',
    why: 'IT COUNTS THE POPULATION AND THE COUNT IS NOT THE CHECK. A fixture that will not parse is not counted as declaring a generator, which is right - it has declared nothing readable. The crosscheck below walks the SAME directory and reports that file as UNREADABLE by name, so an unparseable fixture shrinks this size by one AND produces a problem. Size and verdict are computed separately and the verdict is the one that stops a run.' },

  { id: 'G-121', file: 'sweep-boundary.mjs', anchor: 'catch (e) { out.push(`[SB-17] UNREADABLE', verdict: 'sound',
    why: 'UNREADABLE IS A PROBLEM NAMING THE FILE, not a skip. [SB-17] compares the provenance sentence of each fixture against the tree; a fixture nobody could parse has had no sentence compared, and returning nothing for it would make it indistinguishable from one whose generator is present.' },

  { id: 'G-122', file: 'sweep-boundary.mjs', anchor: 'for (const m of g.matchAll(', verdict: 'guarded',
    why: 'THE EXTRACT THAT COULD GO QUIET, AND IT IS THE ONE THAT FOUND THE DEFECT. It pulls script paths out of a _generated_by sentence; matching nothing means the sentence names no path, which is a real and common state - "authored by hand" makes no claim this can check. So an empty read here is CORRECT for most fixtures and would be silent for all of them if the pattern died. What closes it is that the population size is printed on every run beside the entry, and that the entry fired on its first run against samples/433boi.slice2.sample.json, which cited two generators that had never been in the tree. A pattern that stopped matching would drop that count to zero against a printed population of two, which is visible in the transcript rather than in a verdict.' },

  { id: 'G-104', file: 'sweep-boundary.mjs', anchor: 'const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };', verdict: 'sound',
    why: 'A PATH THAT CANNOT BE STATTED IS NOT A DIRECTORY, which is what the caller needs to know. Both callers enumerate directories that exist because readdirSync just listed them, so the catch covers a race and not a state. Its false direction removes a directory from [SB-90]\'s subdirectory check — narrower — and the one thing that could hide is a subdirectory that exists and cannot be statted, which readdirSync would have thrown on first.' },

  { id: 'G-105', file: 'sweep-boundary.mjs', anchor: 'catch (e) { out.push({ file: `samples/${f}`, unreadable: e.message }); continue; }', verdict: 'sound',
    why: 'UNREADABLE IS RECORDED, NOT SKIPPED, and [SB-10]\'s crosscheck turns exactly that flag into a problem naming the file. A fixture that will not parse contributes no claims AND says that it could not be read — the two are separated, which is the whole of [G-01] and the reason the catch writes a row instead of continuing empty-handed.' },

  { id: 'G-106', file: 'sweep-boundary.mjs', anchor: 'for (const re of FORM_TOTAL) for (const m of src.matchAll(re))', verdict: 'guarded', family: true,
    why: 'THE COMPARISON THE TWO WRONG COUNTS WERE IN, and a pattern that stopped matching would report zero contradictions over zero comparisons. Closed by the CANARY, which is the only thing that separates a dead pattern from a clean tree: a synthetic fixture claiming 999 fields against a derived 267 must yield exactly one contradiction, AND a synthetic fixture claiming the derived figure must still MATCH — the second half is what a pattern matching nothing fails. The number of phrases compared is also printed on every run, so thirteen becoming zero is visible in the transcript.' },

  { id: 'G-107', file: 'sweep-boundary.mjs', anchor: "catch (e) { out.push(`[SB-11] UNREADABLE", verdict: 'sound',
    why: 'A labels.json that will not parse becomes an UNREADABLE problem naming the file, not a file that quietly declares no generator and not a file that quietly declares one. [SB-11]\'s whole ground is that these artefacts are mechanical and say so; a file nobody could read has not said so.' },

  { id: 'G-108', file: 'sweep-boundary.mjs', anchor: "const m = /^([0-9a-z]+)\\.(intake\\.json|lineage-)/.exec(f);", verdict: 'sound',
    why: 'NO MATCH MEANS THIS FILE IS NOT AN INTAKE RECORD, and the loop moves to the next one. The set being walked is the maps directory, so a dead pattern makes [SB-13] find no intake records to check — which is visible as a size of 0 beside an entry whose count() reads the same directory by a different pattern. The two would have to die together for this to go quiet, and they are different regexes over different filename shapes.' },

  { id: 'G-109', file: 'sweep-boundary.mjs', anchor: "try { doc = JSON.parse(r(p)); } catch (e) { out.push(`[SB-15] UNREADABLE", verdict: 'sound',
    why: 'Same shape as [G-107] on the HubSpot side: unparseable becomes a named problem. [SB-15] excuses these files on the claim that each is generated or read back, and a file nobody could parse has made no such declaration.' },

  { id: 'G-110', file: 'sweep-boundary.mjs', anchor: 'for (const re of FORM_TOTAL) for (const m of synthetic.matchAll(re))', verdict: 'sound', family: true,
    why: 'THIS IS THE CANARY ITSELF, and both directions of it are asserted. The disagreeing string must yield exactly one contradiction and the agreeing string must yield exactly one match; ok is the conjunction. A pattern that matched nothing would pass the first clause on its own — zero contradictions is not one — which is why the second clause exists and why it counts matches rather than contradictions.' },

  { id: 'G-114', file: 'sweep-boundary.mjs', anchor: 'catch (e) { return [`[SB-16] UNREADABLE', verdict: 'sound',
    why: 'THE CATCH RETURNS A PROBLEM, NOT AN EMPTY LIST. A crosscheck returning [] means "compared, nothing contradicted"; this one returns a one-element list naming the file it could not read. The registry is hand-maintained and its ONLY protection is that its declared count matches its own contents, so a run that could not open it has checked nothing and says so. Returning [] here would make an unparseable registry indistinguishable from a consistent one, which is the exact substitution [SB-16] exists to prevent.' },

  { id: 'G-113', file: 'sweep-boundary.mjs', anchor: 'for (const re of FORM_TOTAL) for (const m of agreeing.matchAll(re)) agreed.push(m[0]);', verdict: 'sound',
    why: 'THE HALF OF THE CANARY THAT A DEAD PATTERN FAILS. The line above it counts contradictions in a fixture claiming 999 fields; this one counts MATCHES in a fixture claiming the derived figure. A regex that matched nothing would produce zero contradictions — which the first clause reads as "no defect found" — and zero matches, which this clause refuses. Reading nothing here cannot make the canary report success; it is the only line in the file where an empty read is the failure condition rather than a state to report.' },

  { id: 'G-111', file: 'sweep-boundary.mjs', anchor: 'catch (err) {', verdict: 'sound', family: true,
    why: 'THE THREE CATCHES IN THE RUNNER, ONE DISPOSITION. A size that throws, a crosscheck that throws and an observe that throws each push an UNREADABLE problem naming the boundary and give the row the verdict UNREADABLE, which is not counted as cross-checked and is not counted as a pass. There is no path on which a boundary this file could not evaluate contributes silence. That is the rule the whole register implements, applied to the register.' },

  { id: 'G-112', file: 'sweep-boundary.mjs', anchor: '} catch { return null; }', verdict: 'sound',
    why: 'git ls-files returning null is a distinct state from returning an empty list, and the caller reports it as UNREADABLE: "these directories are untracked scratch is unchecked rather than true". An empty list means git ran and found nothing tracked, which IS the claim holding. Collapsing the two would let a machine without git report the strongest possible pass.' },

  // ─── the record-shape fixture-set assertion ───────────────────────────────────────────
  { id: 'G-129', file: 'assert-record-shape.mjs', anchor: "let doc; try { doc = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return { path: p, unreadable: e.message }; }", verdict: 'sound',
    why: 'AN UNREADABLE FIXTURE BECOMES A PROBLEM, NOT A DROP. The catch returns `{ path, unreadable }`, the next loop pushes an UNREADABLE problem naming the file and the parse error, and that row then carries no `expect`, so it is skipped by the run loop and contributes to NO coverage count — a fixture that cannot be read cannot witness a state. The two effects compound in the safe direction: the file is named as a problem AND the state it was supposed to cover comes back with zero witnesses, which is a second STOP. There is no path on which a corrupt fixture is read as covering something.' },

  { id: 'G-130', file: 'assert-record-shape.mjs', anchor: "if (existsSync(twPath)) { try { tw = JSON.parse(readFileSync(twPath, 'utf8')); } catch { tw = null; } }", verdict: 'sound',
    why: 'A NULL RESULT FILE IS THE FAILING BRANCH FOR BOTH EXPECTATIONS. `tw === null` sends a "holds" fixture to NO RESULT ("a pass with no per-line record is an exit code, not evidence") and a "stops" fixture to STOPPED FOR AN UNKNOWN REASON ("a stop for the wrong reason satisfies the exit code and proves nothing"). Neither branch treats an unreadable artefact as agreement, which is the whole of question 4: the exit code alone was never allowed to settle it. A missing file and a corrupt one are deliberately the same state here — both mean this run cannot say what stopped it.' },

  // ─── the name-lie registry's own coverage counter ─────────────────────────────────────
  { id: 'G-128', file: 'blanket-audit.mjs', anchor: "const m2 = /^([A-Za-z0-9_]+)\\[(\\d+)\\]\\.(.+)$/.exec(b);", verdict: 'sound',
    why: 'AN EMPTY MATCH MAKES THE COUNTER REPORT A GAP, NEVER A PASS. [K-29] counts the registry entries whose `bound_to` resolves through the map to the path they name. This exec recognises the "group[row].column" spelling; when it matches nothing, `resolves` returns false, the entry lands in `uncoveredList`, and the blanket audit reports a COVERAGE GAP naming every one of them. The failure direction is loud by construction, and it was taken: this regex reached disk once with its backslashes eaten and the audit reported the gap on the next run rather than a clean count.' },

  // ─── the shared-leaf-name derivation ──────────────────────────────────────────────────
  { id: 'G-127', file: 'count-sweep.mjs', anchor: "catch (e) { return [{ what: 'shared leaf names', fail:", verdict: 'sound',
    why: 'AN UNREADABLE SECOND FIELDS FILE IS A `fail` ROW, WHICH THE RUNNER TURNS INTO AN UNREADABLE PROBLEM AND A STOP — the [G-01] contract, applied to a derivation that has to open a file for ANOTHER form. There is no path on which the comparison quietly becomes zero shared names, which would be the worst possible reading: it would agree with a registry claiming the two forms share nothing, which is the opposite of why 433-B(OIC) is being mapped at all. The catch names the form the sentence asked for and the underlying error, so the reader can tell a missing file from a corrupt one.' },

  // ─── the cell-spelling assertion ──────────────────────────────────────────────────────
  { id: 'G-126', file: 'rounding.mjs', anchor: "const m = /^groups\\.([A-Za-z0-9_]+)\\.slots\\[(\\d+)\\]\\.(?:text\\.)?(.+)$/.exec(String(k));", verdict: 'sound',
    why: 'IT RUNS ONLY ON KEYS ALREADY SELECTED AS DEFECTIVE, AND ITS EMPTY RESULT IS STILL A FINDING. `miskeyedCells` first FILTERS by MISKEYED_CELL — the decision that a key is in the wrong shape is made there, and it is that filter\'s output, not this exec, that decides whether anything is reported. This exec only reconstructs the spelling the key SHOULD have had, for the message; a null match yields "(unparseable)" and the key is still reported, still counted and still a STOP. So an empty match cannot turn a defect into a pass — it can only make the suggested fix less specific, and the fault itself is named either way.' },

  // ─── the [D-09] shadowing enumeration ─────────────────────────────────────────────────
  { id: 'G-124', file: 'enumerate-shadowing.mjs', anchor: 'const m = code.match(re);', verdict: 'sound',
    why: 'THE POSITION RE-DERIVATION. This loop walks POSITIONS to recover the captured condition text of a site exclusion-sweep already found. When no position matches, `capturedAt` returns `{ pos: null, text: null }`, `classify(null, pred)` returns the verdict ABSENT, and an ABSENT row is reported as UNREADABLE and is a STOP — never counted as sound and never counted as an instance. So an empty match here cannot produce a clean count; it produces "the attributed predicate could not be located in the site\'s own captured text", which is the finding. The canary fires that exact path on every run: `classify(null, "ok")` must read ABSENT.' },

  { id: 'G-125', file: 'enumerate-shadowing.mjs', anchor: 'for (const m of text.matchAll(re)) {', verdict: 'sound',
    why: 'THE CLASSIFIER ITSELF, AND ZERO MATCHES IS THE DEFECT STATE RATHER THAN A PASS. `bare` and `method` both stay 0 when this matches nothing, and the very next line turns `!bare && !method` into ABSENT, which the reporter treats as UNREADABLE and a STOP. A predicate the sweep attributed to a site must be findable in that site\'s text; if it is not, this enumerator has failed to read its input, and "I could not read it" reported as "no instances" is the `if (matches.length && mismatch)` defect this repo already found once with PASS printed underneath. Both non-empty verdicts and the empty one are fired by the canary on every run, and the count is not printed at all if the canary does not bite.' },

  // ─── the y-convention audit ───────────────────────────────────────────────────────────
  { id: 'G-89', file: 'assert-y-convention.mjs', anchor: 'catch { out.push({ file: f, unreadable: true }); continue; }', verdict: 'sound',
    why: 'AN UNREADABLE FILE BECOMES A PROBLEM, NOT A SKIP. The catch records `unreadable: true` and runYConventionAudit turns exactly that flag into a REPORTER UNREADABLE stop with the file named. There is no path on which a reporter this loop could not open contributes nothing and says nothing — which is the whole of [G-01], and the reason the flag is set rather than the file being dropped.' },

  { id: 'G-90', file: 'assert-y-convention.mjs', anchor: 'const m = /^HEADING-Y (\\S+) page=(\\d+) convention=(\\S+) y=([\\d.]+)', verdict: 'guarded',
    why: 'THE EXTRACT THAT COULD GO QUIET, AND THE TWO THINGS THAT STOP IT. A pattern that stopped matching would return no heading readings and the tool would report 0 checked and 0 disagreements for verify-headings.mjs on every form — a clean sweep over an instrument nobody asked. Closed twice. FIRST: the reading is refused before the loop when a form has a headings.json and the spawned tool emitted no HEADING-Y line at all, which is an UNREADABLE stop naming the form and the exit code, not a zero. SECOND: a line that IS present and does not parse pushes its own row with `missing` set, so an individual malformed line is reported rather than filtered away. The remaining case — every line present, every line parsing, none matching a printed run — is reported per row for the same reason.' },

  { id: 'G-91', file: 'assert-y-convention.mjs', anchor: 'const m = /^\\s*y=\\s*([\\d.]+)\\s+x=\\s*([\\d.]+)\\.\\.\\s*([\\d.]+)\\s+(.*)$/.exec(l);', verdict: 'guarded',
    why: 'THE SAME SHAPE ON align-block.mjs, closed by the block delimiters rather than by the line pattern. A listing that printed no PRINTED/WIDGETS pair at all is an UNREADABLE row naming the band and the exit code, so the seeded sample cannot silently become zero bands. Within a block that IS found, a line this pattern skips is a line align-block did not print as a run — the header, the NOTE, blanks — and skipping those is correct. What is NOT silent is a run it printed that page-geometry.mjs does not hold: that is a `missing` row and a stop. The number of runs compared is printed per form on every run, so a sample that shrank shows as a smaller number rather than as agreement.' },

  { id: 'G-92', file: 'assert-y-convention.mjs', anchor: 'catch (e) {', verdict: 'sound',
    why: 'THE CATCH IS THE REPORT. A reading that throws pushes a problem and a row whose `checked` is the string UNREADABLE, which is not summed into the checked total and is not counted as agreement. The alternative — swallowing the throw and moving to the next reporter — would make a broken import indistinguishable from a reporter with nothing to say, and this file exists because two instruments that were both answering confidently were answering different questions.' },

  // ─── the blanket audit ────────────────────────────────────────────────────────────────
  { id: 'G-42', file: 'blanket-audit.mjs', anchor: 'for (const m of String(v).matchAll(new RegExp(String.raw`(?<![\\w-])(${N})(?![\\w-])`', verdict: 'guarded',
    why: 'THE PROBE’S NUMBER EXTRACTOR, GUARDED BY A CANARY RATHER THAN BY A PER-SITE TEST. An empty read here yields no findings for that site, and if the regex ever died every sampled site would come back clean and the audit would print a green sample over an instrument that reads nothing. A PER-SITE heuristic was tried first — "the site has a digit and I read no number" — and it is WRONG: `entries[30].id` is "L30" and `_at` is "y 668.1", and reading no standalone number out of either is the correct answer, which is what the boundary rule exists to produce. It reported ten live sites as unreadable. `PROBE_CANARY` asks the only question that separates a dead extractor from a site with nothing in it: a fixed string, not drawn from the artefacts, carrying two register phrases and one entry id, expected to yield exactly two. A canary that does not come back is a STOP and every "0 findings" in the same run is declared meaningless.' },

  { id: 'G-79', file: 'blanket-audit.mjs', anchor: 'const hist = HISTORICAL.exec(window);', verdict: 'sound',
    why: 'FAILS OPEN IN THE SAFE DIRECTION. No match means the probe PROCEEDS to derive and compare, so a dead HISTORICAL regex produces MORE findings, not fewer — a false report a person disposes of, never a real one suppressed. Every stand-down it does make is counted and printed with the marker that caused it, so the quiet direction is not available either.' },

  { id: 'G-80', file: 'blanket-audit.mjs', anchor: 'try { derived = s.count(ctx); } catch { derived = null; }', verdict: 'sound',
    why: 'A COUNTER THAT THROWS STILL PRODUCES THE FINDING. `derived` becomes null and the finding is pushed anyway, so the report reads "the site states N ... a set this repo counts as null" — visible, and a STOP like any other finding. The exception is not swallowed into a skip; it is swallowed into a value that cannot equal anything.' },

  { id: 'G-45', file: 'blanket-audit.mjs', anchor: "...[...t.matchAll(/\\b([a-zA-Z0-9-]+\\.mjs)\\b/g)].map(m => m[1]),", verdict: 'guarded', family: true,
    why: 'THE FORWARD-REFERENCE EXTRACTOR, AND THE SITE WHERE AN EMPTY READ WOULD BE WORST. If this stopped matching, every blanket would report zero forward references, the register would demand zero provers, and the audit would print "0 unproved" over a tree in which nothing was checked. So `forwardRefsIn` returns `{ refs, unreadable }`, where `unreadable` is true for a reason that contains the literal ".mjs" or "step N" and yielded no reference, and the caller turns that into an UNPROVED FWD problem naming the blanket. An extraction that cannot read its input is not a reason with no forward references.' },

  { id: 'G-46', file: 'blanket-audit.mjs', anchor: "for (const m of t.matchAll(/\\((\\d{1,2}[a-z]?)\\)/g)) out.add(m[1]);", verdict: 'guarded', family: true,
    why: 'A PROVER’S DEMAND EXTRACTOR, AND AN EMPTY DEMAND IS A STOP RATHER THAN A PROOF. Every extractor in this family — markers, coordinates, AcroForm paths, revision pins, printed constants — feeds a prover that reports `demanded / supplied / uncovered`, and an empty `demanded` makes `uncovered` empty too, which reads as green. That is the vacuous shape this register exists for, committed inside the register built to pay forward references. So the runner checks `demanded.length === 0` on every pair and requires it to appear in `EMPTY_DEMAND` with the reason the citation is about something other than the atoms this prover measures; undeclared, it is an EMPTY DEMAND problem that names the blanket, the instrument and the prover’s own `how`. Two pairs are declared today, both citing validate-map.mjs for a claim that is not about paths.' },

  { id: 'G-47', file: 'blanket-audit.mjs', anchor: 'try { if (slotColumnsOf(ctx.mapDoc, g)?.length) supplied.add(g); } catch', verdict: 'sound',
    why: 'A GROUP WHOSE COLUMNS CANNOT BE READ IS NOT ADDED TO `supplied`, so any covered site naming it comes out as UNCOVERED and the forward reference to check-row-shape.mjs fails for that group. The catch converts a throw into a reported gap rather than into silence, and the empty case is covered by [G-46]: if NO group resolves, `demanded` is unchanged and every demanded group is reported uncovered.' },

  { id: 'G-48', file: 'blanket-audit.mjs', anchor: "const demanded = [...new Set([...t.matchAll(/\\$\\s?([\\d,]{3,})", verdict: 'guarded',
    why: 'The printed-constant demand for gate step 11 — same family and same disposition as [G-46]. An empty extraction is caught by the EMPTY_DEMAND check before it can read as a proof.' },

  { id: 'G-49', file: 'blanket-audit.mjs', anchor: "...[...t.matchAll(/\\b(\\d{1,2}-\\d{4})\\b/g)].map(m => m[1]),", verdict: 'sound', family: true,
    why: 'THE REVISION PROVER DOES NOT USE ITS OWN EXTRACTION FOR THE VERDICT. `uncovered` is computed from `ctx.mapDoc.form_revision` and `ctx.mapDoc.catalog` read straight out of the map header and compared against `readFormRevision(form)`, which reads the drawn page bytes. The regex only widens what is DISPLAYED as demanded; an empty read cannot make the pin agree with itself, because the pin is never taken from the prose.' },

  { id: 'G-50', file: 'blanket-audit.mjs', anchor: "for (const m of s.matchAll(clause(ASSERTS))) out.push({ where, kind: 'assert'", verdict: 'guarded', family: true,
    why: 'THE COMPLETENESS DETECTOR, AND THE QUIETEST POSSIBLE FAILURE IN THIS FILE. A detector that stops matching reports "0 claims detected, 0 undisposed" and reads as a clean tree — the loudest problem printed as the calmest success. Guarded by `CANARY`: a fixed string carrying one assert-shaped claim and one geometry-shaped one, run before the tree is scanned, with the expected split stated. It is deliberately not drawn from the artefacts, because a canary taken from the input it guards dies with it. A canary that does not come back is a STOP, and the problem it raises says in as many words that every "0 detected" in that run is meaningless.' },

  { id: 'G-51', file: 'blanket-audit.mjs', anchor: 'const g = /^([A-Za-z0-9_]+)\\[(\\d+)\\]\\.([A-Za-z0-9_]+)$/.exec(str);', verdict: 'sound',
    why: 'ONE OF FOUR RESOLUTION ROUTES, AND NO-MATCH FALLS THROUGH TO THE OTHERS. [K-03] asks whether a `bound_to` resolves; this pattern reads the group-slot-column spelling, and a string that is not in that shape is then tried as a map key, a check_here key, a checkboxes key, a verbatim field name and a map path. Only a binding that fails ALL of them is reported, so an empty match here narrows nothing and hides nothing. The FIRST draft of this counter knew only two of the routes and reported four live bindings as unresolvable, which is what the four routes are for.' },

  { id: 'G-52', file: 'blanket-audit.mjs', anchor: 'catch (e) { forward.push({ blanket: b.id, instrument: inst, unproved: true', verdict: 'sound',
    why: 'A PROVER THAT THROWS IS AN UNPROVED FORWARD REFERENCE, which is a STOP by the rule this file enforces. The exception message is carried into the problem text. Nothing is skipped.' },

  { id: 'G-53', file: 'blanket-audit.mjs', anchor: "catch (e) { disposed.push({ ...cl, id: hit.id, kind2: 'counter', failed:", verdict: 'sound',
    why: 'A COUNTER THAT THROWS IS REPORTED AS COUNTER DEAD and counted as a problem. A completeness claim whose counter cannot run is in exactly the state the register forbids — disposed on paper and unmeasured in fact — so it fails rather than falling back to the claim’s own word for it.' },
  { id: 'G-45b', file: 'blanket-audit.mjs', anchor: "...[...t.matchAll(/\\b(?:gate\\s+)?step\\s+(\\d+)\\b/gi)].map(m => `gate step ${m[1]}`),", verdict: 'guarded',
    why: 'The gate-step half of the forward-reference extractor. Same disposition as [G-45]: `forwardRefsIn` reports `unreadable` for a reason that names "step N" and yields nothing, and the caller turns that into an UNPROVED FWD problem.' },

  { id: 'G-46b', file: 'blanket-audit.mjs', anchor: "for (const m of t.matchAll(/\\bBox\\s+([A-H])\\b/g)) out.add(`Box ${m[1].toUpperCase()}`);", verdict: 'guarded',
    why: 'The Box-marker half of the line-markers demand. Same disposition as [G-46]: an empty demand is caught by the EMPTY_DEMAND check before it can read as a proof.' },

  { id: 'G-46c', file: 'blanket-audit.mjs', anchor: "for (const m of t.matchAll(/\\blines?\\s+(\\d{1,2}[a-z]?)(?:\\s*[-–]\\s*(\\d{1,2}[a-z]?))?/gi))", verdict: 'guarded',
    why: 'The "line NN" / "lines NN-MM" half of the line-markers demand. Same disposition as [G-46]. Note the second capture group is added only `if (m[2])`, so a range that matched only its first half contributes one marker rather than an undefined one — an undefined in the demanded set would be reported as an uncovered atom named "undefined", which is noise rather than a finding.' },

  { id: 'G-46d', file: 'blanket-audit.mjs', anchor: "for (const m of t.matchAll(/\\by\\s+(\\d{2,3}(?:\\.\\d+)?)\\b/g)) out.push({ axis: 'y'", verdict: 'guarded',
    why: 'The y half of the coordinate demand, for align-block.mjs and verify-headings.mjs. Same disposition as [G-46].' },

  { id: 'G-46e', file: 'blanket-audit.mjs', anchor: "for (const m of t.matchAll(/\\bx\\s+(\\d{1,3}(?:\\.\\d+)?)\\s*\\.\\.\\s*(\\d{1,3}(?:\\.\\d+)?)/g))", verdict: 'guarded',
    why: 'The x-range half of the coordinate demand. Same disposition as [G-46]. Both ends of the range are pushed, so a stated span is proved at both edges rather than at its start.' },

  { id: 'G-46f', file: 'blanket-audit.mjs', anchor: "[...textOf(sites).matchAll(/topmostSubform\\[0\\](?:\\.[A-Za-z0-9_#\\-]+(?:\\[\\d+\\])?)+/g)].map(m => m[0]))];", verdict: 'guarded',
    why: 'The AcroForm-path demand for validate-map.mjs. Same disposition as [G-46], and this is the family where the EMPTY_DEMAND register earns its keep: BOTH declared empty demands are validate-map citations, one about rounding and one asserting that the classification binds nothing at all.' },

  { id: 'G-49b', file: 'blanket-audit.mjs', anchor: "...[...t.matchAll(/\\b(\\d{5}[A-Z])\\b/g)].map(m => m[1]),", verdict: 'sound',
    why: 'The catalog-number half of the revision demand. Same disposition as [G-49]: the verdict is computed from the map header against readFormRevision(form) and never from this extraction.' },

  { id: 'G-50b', file: 'blanket-audit.mjs', anchor: 'for (const m of s.matchAll(clause(GEOMS))) {', verdict: 'guarded',
    why: 'The geometry-shaped half of the completeness detector. Same disposition as [G-50], and it is the half the canary would notice first: CANARY expects one geometry claim as well as one assert claim, so a detector that lost either half fails the canary and takes the whole run down with an explicit statement that every "0 detected" in it is meaningless.' },
  { id: 'G-54', file: 'render-review.mjs', anchor: 'catch (e) { tripWhy = `${tripwirePath} could not be read', verdict: 'sound',
    why: 'AN UNREADABLE ARITHMETIC RESULT MAKES THE PAGE SAY SO, IN THREE PLACES. `trip` stays null, `tripWhy` carries the exception message, the page prints a red banner naming it above everything a preparer reads, and the Arithmetic column reads "unknown" on every row rather than falling back to the totals DECLARATION. Falling back is the failure this catch exists to prevent: a declaration says a line is checkABLE, and the question the column answers is whether anything checked it on this record. The two other ways the result can be wrong — the file being absent, and the file belonging to a different document — take the same path, and the document binding is by SHA-256 rather than by filename.' },

  // ─── the success sweep ────────────────────────────────────────────────────────────────
  //
  // Every `extract` here reads the STRUCTURE OF A SOURCE LINE — is this an `if` head, is that
  // an `else`, where are the string literals. The whole family shares one disposition and it
  // is the strongest available: THESE FAIL CLOSED INTO THE PROBLEM STATE. A regex that stops
  // matching does not skip a site; it removes a witness, and a site with no witness classifies
  // as UNCONDITIONAL, which is a STOP. The failure mode of a dead extractor in this file is a
  // sweep that reports 79 unconditional success messages, not a sweep that reports none.
  //
  // That is the opposite of the shape [G-01] was written for, and it is deliberate: the
  // classifier is built so that ignorance is indistinguishable from the defect rather than
  // from health. The canary then separates the two, by running four synthetic sites of known
  // class through the same code path on every invocation.
  { id: 'G-82', file: 'success-sweep.mjs', anchor: 'const inlineElseIf = self.match(', verdict: 'sound', family: true,
    why: 'Reads an `} else if (…) {` head. No match means "this is not an else-if", the walk continues upward, and a chain it cannot read ends at a null condition — which denies the site its `guarded` witness rather than granting it. Fails closed into UNCONDITIONAL.' },
  { id: 'G-83', file: 'success-sweep.mjs', anchor: 'const m = head.match(/if\\s*\\((.+)\\)\\s*$/);', verdict: 'sound', family: true,
    why: 'THE `if` HEAD READER, at both of its sites — the else-chain walker and the enclosing-condition walker. A head this cannot read yields `cond: null`, and a null condition never satisfies FINDING_IDENT, so witness (a) is withheld. Withholding a witness moves a site TOWARDS the problem state and never away from it.' },
  { id: 'G-57', file: 'success-sweep.mjs', anchor: 'const inline = lines[idx].match(', verdict: 'sound',
    why: 'The inline `if (…) console.log(…)` form. No match falls through to the brace walk, which is the general case; the inline test is an optimisation over it, not the only path to the answer.' },
  { id: 'G-58', file: 'success-sweep.mjs', anchor: 'const m = lines[i].match(/^\\s*(?:\\}\\s*else\\s+)?if', verdict: 'sound', family: true,
    why: 'The failure-guard head reader in witness (b). No match means `continue` — the scan keeps walking upward and, finding no failure accumulation at all, returns null. A null there produces UNCONDITIONAL with the reason "no failure accumulation above it". Fails closed.' },
  { id: 'G-59', file: 'success-sweep.mjs', anchor: '|| lines[i].match(/^\\s*if\\s*\\((.+?)\\)\\s*(?:process\\.exit|return|STOP|throw|console\\.error)/);', verdict: 'sound',
    why: 'The single-statement `if (x) process.exit(2);` form of the same head. Same disposition as [G-58]: the alternative to matching is not matching, and not matching withholds the `terminal` witness.' },
  { id: 'G-60', file: 'success-sweep.mjs', anchor: 'const lits = line.match(STRLIT) || [];', verdict: 'sound',
    why: 'THE LITERAL EXTRACTOR INSIDE isNarrative. An empty result makes `lits.some(…)` false three times over, so the line opens no verdict, is no table row, carries no notice and interpolates nothing — and isNarrative returns FALSE. A line whose literals cannot be read is therefore NOT excused as narrative; it goes on to the control-flow witnesses and, failing those, to UNCONDITIONAL. This is the site where a `some`-over-empty would have been dangerous in the other direction, and the return is written so that every vacuous `some` pushes towards the problem.' },
  { id: 'G-61', file: 'success-sweep.mjs', anchor: "const lits = (ln.match(STRLIT) || []).join(' ');", verdict: 'sound',
    why: 'THE SITE SELECTOR. An empty literal join fails SUCCESS_TOKENS and the line is not collected as a site at all — so a dead extractor here shrinks the swept population silently, which IS the [A3] shape. It is closed by the site count being printed on every run beside the per-directory file count, and by the canary, which classifies from an in-memory array and would still return 4/4 while the count collapsed: the two numbers are read together, and 79 falling to 0 with a live canary is the signature. Recorded here rather than argued away, because "it only shrinks the input" is precisely what a sentence in asset-row-shapes.json did.' },
  { id: 'G-62', file: 'success-sweep.mjs', anchor: 'return { rows: out, ok: out.every((r) => r.ok) };', verdict: 'guarded',
    why: 'THE CANARY’S OWN `every`, VACUOUS ON EMPTY AND GUARDED BY AN ARITY CHECK ABOVE IT. `runCanary` returns early with an `arity` problem unless CANARY_EXPECT holds exactly CANARY_CLASSES entries, so `out` cannot be empty by the time this line runs. Without that guard a canary list that lost its entries would report "the classifier still sees every class" by seeing none — [G-01] committed inside the canary written to stop this file going blind.' },
  { id: 'G-70', file: 'count-sweep.mjs', anchor: 'for (const pm of v.matchAll(/p([1-6])=(', verdict: 'guarded',
    why: 'THE PER-PAGE MARKER FIGURES IN [S-24]. An empty match yields no per-page comparisons, which on its own would be the vacuous shape — the prose could claim any distribution across the six pages and nothing would compare it. It is closed by the claim that sits in the SAME STRING and is extracted separately: "finds N markers on this form" is pulled by its own regex on the line above and compared against markerPairing over the whole form. That comparison is what gates entry to this loop at all, so a run in which the per-page loop reads nothing still asserts the total, and a total that agrees while every per-page figure went unread cannot also be wrong about the one page this slice depends on — page 1 claims ZERO markers, and a form total of 44 with 44 found elsewhere is what makes zero on page 1 checkable. The stronger guard is one level out: the map states the page-1 figure as a WORD as well ("line_markers_on_page_1": "NONE. Zero drawn."), and verify-headings and the label probes would both fail on a page whose markers had appeared.' },

  { id: 'G-71', file: 'absence-sweep.mjs', anchor: "while ((m = COORD.exec(text))) {", verdict: 'guarded',
    why: 'THE COORDINATE EXTRACTOR FOR [K-12], WHICH NOW LIVES HERE. This entry kept its id through a MOVE, not a rename: it used to dispose of two inline matchAll extractions in blanket-audit.mjs, and BOTH of them were dead — two literal backspace bytes where a word-boundary escape was meant, so the guard this entry certified as sound had been taking its fail branch on every run since the commit that wrote it. [K-12] now imports classifyCoordinates() rather than extracting inline, so the site moved with the code and the disposition moved with the site. The empty case cannot report success from either end: [K-12] returns an explicit { fail } when the extraction yields nothing, and absence-sweep.mjs prints the population by universe on every run, so an extractor that went quiet would show 0 point, 0 band, 0 widget rather than a clean sweep. And it carries a canary — four planted coordinates, one per universe, each required back in the universe it was planted in.' },
  { id: 'G-145', file: 'absence-sweep.mjs', anchor: "while ((m = g.exec(rest))) hits.push({ form, index: m.index });", verdict: 'sound',
    why: 'THE FORM READER, AND READING NOTHING IS THE SAFE DIRECTION. If this loop found no form spelling the claim falls back to the artefact own host form, which is where the claim is written — so a dead scan makes every coordinate a HOST-FORM point and every claim a claim about its own file. That direction cannot excuse anything: host-form points are the only kind this sweep compares against the page, so a blind reader puts MORE under test, not less. The positive direction is asserted by the canary, which requires both 433-A(OIC) and 433-A back from a sentence naming both, and requires 433-A NOT to be read out of 433-A(OIC) alone.' },
  { id: 'G-146', file: 'absence-sweep.mjs', anchor: "catch (e) { problems.push({ kind: 'unreadable', file, why: e.message }); continue; }", verdict: 'sound',
    why: 'AN UNREADABLE ARTEFACT IS A STOP, NOT A SKIP, IN BOTH HALVES. The catch is the failure path: it pushes a problem, and a problem makes the run exit 2. This appears twice because the sweep reads the artefacts twice — once for prose claims and once for coordinates — and the second one was written as a bare catch-and-continue in the first draft, which guard-sweep refused on its first run over this file. That is the same guard written twice with only one of them armed, and it is the shape this register exists to find.' },
  { id: 'G-147', file: 'absence-sweep.mjs', anchor: "const m = sh.re.exec(p.value);", verdict: 'sound',
    why: 'THE MATCH POSITION FOR SUBJECT ATTRIBUTION, AND A NULL IS HANDLED EXPLICITLY. This line runs only after sh.re.test(p.value) has already returned true on the same string, so a null is a contradiction rather than an empty input; the next line takes p.value.length when m is null, which reads the WHOLE string for form mentions — the widest reading, never a narrower one. The shape that would matter here is a regex that matched in test() and not in exec(), which cannot happen for the same pattern and string.' },
  { id: 'G-148', file: 'control-char-scan.mjs', anchor: "catch (e) { problems.push({ file: f, unreadable: e.message }); unreadable++; continue; }", verdict: 'sound',
    why: 'AN UNREADABLE SOURCE FILE IS A STOP AND EXITS 2, NOT 3. A file this scan cannot open contributes the same zero findings as a clean one, which is precisely the shape [D-12] hid in, so it is pushed as a problem AND counted separately so the exit code says which kind of failure it was. The clean verdict is unreachable while any file is unreadable: the OK branch is guarded on problems.length being zero.' },

  // ─── the 433-B(OIC) fill engine ───────────────────────────────────────────────────────
  { id: 'G-72', file: 'fill-433boi.mjs', anchor: "try { field = form.getTextField(name); } catch { skipped.push(name); return; }", verdict: 'guarded',
    why: 'A NAME THE FORM DOES NOT HOLD AS A TEXT FIELD BECOMES A NAMED SKIP, AND THE SKIP CANNOT HIDE. Two things close it. validate-map.mjs step 3 has already asserted that every target in this map exists VERBATIM in the fields file, so a name reaching here that the form refuses is a type disagreement rather than a typo — and gate step 9 under --saturated then fails on the empty cell it leaves. The skip list is printed by name on every run. Same disposition as the identical line in fill-433a.mjs and fill-433f.mjs.' },
  { id: 'G-73', file: 'fill-433boi.mjs', anchor: "catch (e) { capacityErrors.push({ key: key ?? name, name, len: s.length, max, value: s, why: e.message }); }", verdict: 'sound',
    why: 'THE CATCH IS THE FAILURE PATH, NOT AN ESCAPE FROM ONE. pdf-lib throws when a value will not fit a cell, and this converts the throw into a capacityError — which stops the run before any PDF is written and names the INPUT KEY. An exception swallowed here would be an unwritten cell; instead it is a STOP. The empty case is not reachable as a pass: nothing downstream reads `capacityErrors` except the check that exits 2 on it being non-empty.' },
  { id: 'G-74', file: 'fill-433boi.mjs', anchor: "try { form.getCheckBox(name).check(); cbFilled++; } catch { skipped.push(name); }", verdict: 'guarded',
    why: 'Same shape as [G-72] one type over. A checkbox name the form refuses becomes a named skip; the pre-set assertion has already proved all 77 boxes are OFF on the blank, so an unticked box on the output is visible as a difference from what the record asked for, and the skip list names it. gate step 8 then compares the filled document against the record.' },
  { id: 'G-75', file: 'fill-433boi.mjs', anchor: "const on = targets.filter((t) => { try { return form.getCheckBox(t).isChecked(); } catch { return false; } });", verdict: 'sound',
    why: 'READS THE DOCUMENT, NOT THE RECORD, AND AN UNREADABLE BOX COUNTS AS OFF. That direction is the safe one and it is the only one available: the assertion is "no more than one option in this set is ON", so treating an unreadable widget as ON would manufacture violations out of a read failure. A box that cannot be read also cannot have been ticked by the layer above, which uses the same accessor and would have recorded a skip — so the two disagree only if pdf-lib is inconsistent within one document, and validate-map has already asserted the target exists.' },
  { id: 'G-76', file: 'fill-433boi.mjs', anchor: '.exec(def.conditional_on);', verdict: 'sound',
    why: 'PARSES A DECLARED CONDITION, AND NO MATCH MEANS NO CONTRADICTION IS REPORTED FOR THAT ENTRY — which is the vacuous direction, so it is closed by what the failure would look like. The `_computed` block is authored in this repo and its `conditional_on` has one spelling; a malformed one produces no report, and the map site itself is a count-sweep claim site disposed by [S-25] and re-read whenever the map changes. The report it drives is ADVISORY by design — the printed instruction says "If yes, list provider name and address", which does not forbid the other combination — so a missed report withholds a note and never licenses a write.' },

  // ─── the exclusion sweep ──────────────────────────────────────────────────────────────
  //
  // The three `catch` sites this file shipped with on its first draft were the [G-01] shape
  // INSIDE THE FILE WHOSE SUBJECT IS INSTRUMENTS GOING QUIET: `try { JSON.parse(…) } catch {
  // return null }` followed by `?? 0`, so a map that would not parse contributed nothing to
  // the excused total and said nothing about it — a count that could not read its input
  // reporting the same figure as a count that read an empty one. All three are FIXED, by
  // separating absence from unreadability: ENOENT returns null and the form is simply not
  // swept, and a parse failure PROPAGATES to runExclusionSweep, which reports UNREADABLE.
  { id: 'G-64', file: 'exclusion-sweep.mjs', anchor: "try { raw = readFileSync(p, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }", verdict: 'FIXED',
    why: 'WAS `catch { return null }` OVER BOTH FAILURE MODES, WITH `?? 0` DOWNSTREAM. A missing sidecar and an unparseable one produced the same silent zero. Now the catch handles exactly one condition — the file not existing, which is a fact about a form not yet mapped — and re-throws everything else. The parse itself is outside the try, so a malformed map cannot be read as an empty one. The excused total therefore counts only forms whose declarations were actually read.' },
  { id: 'G-65', file: 'exclusion-sweep.mjs', anchor: 'const m = ln.match(DEF);', verdict: 'guarded',
    _anchor_moved: 'The harvester was rewritten for [D-08] — it now builds name -> Set(defining file) instead of a flat Set of names — and the old anchor `const m = ln.match(DEF); if (m) out.add(m[1]);` stopped matching. The ORPHAN rule reported it on the next run, which is the whole reason an anchor is required: the disposition below is about a line, and a line that has been rewritten needs the disposition re-read rather than carried forward. Re-read; the reasoning holds and is now stronger, because the harvester feeds reachability as well as membership.',
    why: 'THE DEFINITION HARVESTER, AND THE ONE PLACE IN THIS FILE A DEAD REGEX WOULD FAIL OPEN. An empty definition map makes [EX-90] remove EVERY raw exclusion position, so nothing is registered and nothing is checked — the [A3] shape committed by the file written against it. Closed three ways now. [EX-90] counts what it removed and prints the figure beside the raw total on every run, so 199 raw / 0 named is visible rather than silent. The ORPHAN rule then fires for all eighteen registered predicates at once, because none of them appears in an exclusion position any more. And since [D-08] the same map also decides REACHABILITY, so a dead harvester additionally kills the reachability canary — a synthetic import in a synthetic tree that must resolve — which is a STOP before any real attribution is read.' },
  { id: 'G-66', file: 'exclusion-sweep.mjs', anchor: 'const m = code.match(re);', verdict: 'sound',
    why: 'THE POSITION MATCHER. No match means this line is not an exclusion position and the loop tries the next shape; a line matching no shape is not a site. A shape that stopped matching would shrink the swept population — which is why the population size is printed on every run and the ORPHAN rule fires for any registered predicate that stops appearing. Registered rather than argued away, because "it only shrinks the input" is exactly what a sentence in asset-row-shapes.json did.' },
  { id: 'G-67', file: 'exclusion-sweep.mjs', anchor: 'const calls = [...String(m[1]).matchAll(CALL)].map((x) => x[1]);', verdict: 'sound',
    why: 'READS THE PREDICATE NAMES OUT OF A CONDITION ALREADY KNOWN TO BE AN EXCLUSION POSITION. An empty result returns early without counting the line as a raw hit, which is correct: `if (i > 3) continue` calls nothing and excuses nothing anybody authored. The names it does find are then filtered against DEFINED, whose failure mode is disposed at [G-65].' },
  { id: 'G-68', file: 'exclusion-sweep.mjs', anchor: "for (const lit of ln.match(STRLIT) || []) {", verdict: 'sound',
    why: "[EX-11]'s CROSS-CHECK. An unreadable literal list yields no iterations and therefore no contradiction — which would be a silent pass, except that the same extractor runs over the same lines in success-sweep.mjs's site selector, where an empty result drops the site count from 79 to 0. The two figures are printed by two tools in the same gate and cannot disagree quietly." },
  { id: 'G-69', file: 'exclusion-sweep.mjs', anchor: 'catch (err) {', verdict: 'sound', family: true,
    why: "THE THREE RUNNER CATCHES, AND THEY ARE THE OPPOSITE OF SWALLOWING. Each wraps one of count(), crosscheck() and observe(), and each turns the exception into an UNREADABLE PROBLEM naming the entry and the message — never a skip, never a zero. This is the atLeast contract at the register level: an exclusion whose size or whose comparison cannot be computed reports that it could not be computed, and the sweep exits 2.",
  },
  { id: 'G-63', file: 'success-sweep.mjs', anchor: 'for (const o of OVERRIDES) if (!rows.some(', verdict: 'sound',
    why: 'THE ORPHAN-OVERRIDE CHECK, AND EMPTY IS THE FAILING CASE. If `rows` is empty the negated `some` is true for every override, so all of them report as ORPHAN — the loudest possible outcome, not a silent pass. An override standing over code that has moved is exactly what this is for.' },

  // ─── the register-id sweep [D-07] ─────────────────────────────────────────────────────
  { id: 'G-84', file: 'register-ids.mjs', anchor: "try { raw = readFileSync(p, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }", verdict: 'sound',
    why: 'ABSENCE AND UNREADABILITY ARE SEPARATED, WHICH IS THE WHOLE POINT OF THE catch. ENOENT is a register that does not exist on this tree — 433-F has no name-lie registry — and returns null, which the caller skips and never counts. ANY OTHER ERROR RETHROWS and takes the run down. So a register that exists and will not parse can never contribute the same zero as one that is absent, and the sweep can never report \'no collisions\' over a file it could not open.' },

  { id: 'G-85', file: 'register-ids.mjs', anchor: 'const isView = ids.length > 0 && ids.every((i) => carriedSet.has(i));', verdict: 'guarded',
    why: 'THE EMPTY CASE IS EXCLUDED FIRST AND IT IS THE DANGEROUS ONE. `[].every(...)` is true, so without `ids.length > 0` an EMPTY arguable list would classify itself as a VIEW of the map\'s carried register — and a view is deliberately excluded from the cross-register collision pass. An empty input would switch the check off for that register rather than find nothing in it. With the guard, an empty list is a register of zero ids, which collides with nothing and is reported as zero.' },

  { id: 'G-86', file: 'register-ids.mjs', anchor: 'ids.length > 0 && ids.every((i) => crossIds.has(i))', verdict: 'guarded',
    why: 'THE SAME TEST ON asset-row-shapes.json\'s defect list, guarded the same way and for the same reason. It is written with its own `ids.length > 0` rather than relying on the enclosing `if (d.length)` — an outer guard is one the next edit can move away from, and this one decides whether a register is measured at all.' },

  // ─── the 433-B(OIC) slice-2 shared-widget derivation [S-30] ────────────────────────────
  //
  // BOTH LOOPS ARE GUARDED BY THE SAME `recognised` FLAG, and the flag is what makes an empty
  // read a STOP rather than a pass. [S-30] exists to check a claim about how many widgets four
  // named fields carry; if both extractions matched nothing, the entry would have compared
  // nothing and reported the claim as disposed. So `recognised` stays false, the fallback
  // pushes { unrecognised: true }, and the sweep names the site. Same construct as [G-43]'s.
  { id: 'G-87', file: 'count-sweep.mjs', anchor: 'for (const m of str.matchAll(new RegExp(String.raw`for\\s+all\\s+(${N})\\s+of`', verdict: 'guarded', family: true,
    why: 'THE "for all N of" HALF OF [S-30]. An empty match sets nothing and leaves `recognised` false; a false `recognised` after BOTH loops pushes { unrecognised: true }, which the sweep reports as an unrecognised phrasing rather than as agreement. The empty case therefore cannot reach a success verdict, and it is the FALLBACK that carries the disposition rather than the loop.' },

  { id: 'G-88', file: 'count-sweep.mjs', anchor: 'for (const m of str.matchAll(new RegExp(String.raw`widget\\s+0\\s+of\\s+(${N})`', verdict: 'guarded', family: true,
    why: 'THE QUOTED "widget 0 of N" HALF OF [S-30], with the same disposition and the same `recognised` flag. The two halves are separate loops rather than one alternation because they compare against DIFFERENT derived figures - the first against how many of the four named fields carry exactly one widget, the second against the largest per-field widget count among them - and a single loop would have to pick one.' },

  // ─── the mirror construct ──────────────────────────────────────────────────────────────
  //
  // Nine sites across the two files that build and hold 433-D's mirror declaration. A TENTH was
  // reported on this file's first sweep and is NOT here: `containerOf` in gen-mirror.mjs, a
  // silent extraction whose result nothing read. It was DELETED rather than disposed, because a
  // disposition explaining why a dead extraction is safe is the sentence that keeps dead code
  // alive. An eleventh, the two `catch` clauses in readFilledValues, was REWRITTEN rather than
  // disposed — see [G-221].
  { id: 'G-220', file: 'assert-mirror.mjs', anchor: 'catch (e) { return { stop: `${p} will not parse', verdict: 'sound',
    why: 'THE LOUD DIRECTION. An unreadable mirror declaration returns `{ stop }`, which report() turns into a problem naming the file and the parse error, and the run exits 2. The vacuous shape would be returning `{ doc: null }` or an empty pairs array — either of which would make every [M-07] and [M-08] loop iterate zero times and print OK. The catch says so in its own message: "An unreadable declaration is not an absent one."' },

  { id: 'G-221', file: 'assert-mirror.mjs', anchor: "if (typeof f.getText === 'function') { try { out[n] = f.getText() ?? ''; } catch (e) { out[n] = UNREADABLE(n, e); }", verdict: 'sound', family: true,
    why: 'THE SITE THIS SWEEP CORRECTED, and it is the one that mattered most on this form. The first draft was `catch { out[n] = \'\' }`. Under it, two copies of one mirrored stem that BOTH failed to read would both become the empty string, compare EQUAL, and SATISFY [M-08] — the mirror\'s central clause reporting agreement because it had read neither side. It now yields a sentinel carrying the field name and the error message, assertValues tests for it BEFORE the equality test and reports "could not be READ" rather than a disagreement, and the canary plants exactly that state and requires it to fire. The checkbox branch beside it is the same construct with the same disposition and is covered by this entry.' },

  { id: 'G-223', file: 'assert-mirror.mjs', anchor: "if (!oneSided.problems.some((p) => p.startsWith('[M-07]')))", verdict: 'sound', family: true,
    why: 'THE CANARY\'S OWN NEGATED `some`, AND EMPTY IS THE FAILING DIRECTION. `problems` empty means assertBindings returned nothing for a deliberately one-sided binding; `.some` is then false, `!` makes it true, and the canary is reported DEAD with the planted condition named before any verdict is printed. A plain `.some` would be the vacuous shape — an empty list satisfying "it was caught". The conforming direction is judged separately three lines below (a both-copies binding must raise NOTHING), so a checker that refused every input fails too. The five other negated `some`s in this canary — the page-b one-sided binding, the disagreeing values, the one-sided value, the both-unreadable pair, and the exclusion plants — are the identical construct and are covered by this entry.' },

  // The siblings of [G-221] and [G-223], each anchored on its own line. They are listed
  // individually rather than folded into a family because an anchor loose enough to match all of
  // them would also match a future negated `some` nobody had looked at — and a disposition that
  // silently adopts the next site is the shape this whole register exists to refuse.
  { id: 'G-222', file: 'assert-mirror.mjs', anchor: "else if (typeof f.isChecked === 'function') { try { out[n] = f.isChecked() ? 'on' : 'off'; } catch (e) { out[n] = UNREADABLE(n, e); }", verdict: 'sound',
    why: 'THE CHECKBOX BRANCH OF [G-221], with the identical disposition: a state that cannot be read yields a sentinel carrying the field name, never a default of "off". Two boxes that both failed to read would otherwise both become "off", compare equal, and satisfy [M-08] — and on this form that means an unticked IRS copy agreeing with an unticked taxpayer copy because neither could be read.' },

  { id: 'G-224', file: 'assert-mirror.mjs', anchor: "if (!otherSide.problems.some((p) => p.startsWith('[M-07]')))", verdict: 'sound',
    why: 'THE SECOND DIRECTION OF [G-223] and the reason both are planted: a check that fires when the IRS copy is bound alone but not when the TAXPAYER copy is, is worse than one that never fires, because it reads as working. Empty is the failing direction here exactly as it is there.' },

  { id: 'G-225', file: 'assert-mirror.mjs', anchor: "if (!disagree.problems.some((p) => p.startsWith('[M-08]')))", verdict: 'sound',
    why: '[G-223]\'s construct on the VALUE clause. The plant is a one-character difference — "Ada Lovelace" against "Ada Lovelacf" — because that is what a fill engine writing each copy separately actually produces, and an empty `problems` means assertValues let it through.' },

  { id: 'G-226', file: 'assert-mirror.mjs', anchor: "if (!half.problems.some((p) => p.startsWith('[M-08]')))", verdict: 'sound',
    why: '[G-223]\'s construct on the half-filled document: one copy present, the other absent from the filled PDF entirely. Distinct from the disagreement plant because it exercises the `!hasA || !hasB` branch rather than the equality test, and an empty `problems` means that branch is unreachable.' },

  { id: 'G-227', file: 'assert-mirror.mjs', anchor: "if (!bothUnreadable.problems.some((p) => p.includes('could not be READ')))", verdict: 'sound',
    why: '[G-223]\'s construct pointed at [G-221]\'s defect. It plants the exact state the first draft of readFilledValues produced — both copies unreadable — and requires the report to say "could not be READ". An empty `problems` here means the two sentinels compared equal, which is the original defect returning, so this plant is the regression test for a bug this sweep found in this file.' },

  { id: 'G-228', file: 'assert-mirror.mjs', anchor: 'if (!r.problems.some((p) => p.startsWith(clause)))', verdict: 'sound',
    why: '[G-223]\'s construct in the exclusion canary, parameterised over four plants and two clauses. Empty is the failing direction for every one of them: a stale exclusion, a reasonless one, one hiding a real cross-page pair, and a missing one must each raise their clause, and the conforming declaration is rebuilt and required to raise NOTHING after every plant is restored — so a builder that refused all input fails here too.' },

  { id: 'G-229', file: 'gen-mirror.mjs', anchor: 'const orphanB = B.filter((r) => !A.some((a) => a.stem === r.stem))', verdict: 'sound',
    why: 'THE LOUD DIRECTION AGAIN, and it is the second half of a pair. The loop above it walks page A and reports any stem with no page-B copy; this walks page B and reports any with no page-A copy. If A were empty — the state a dead read of page A produces — EVERY row of B lands here and the build returns 83 [M-03] problems, not zero. The vacuous shape would be checking only one direction, which is exactly what the first half alone would be.' },
];

// ---------------------------------------------------------------------------------------
// (b) THE NEAREST-NEIGHBOUR REGISTER.
//
// `order` is one of:
//   filter-then-rank   the property sought is in the FILTER; distance only breaks ties
//                      among candidates that already have the property
//   rank-then-filter   distance chooses first and the property is tested afterwards — the
//                      money-probe defect
//   no-property        the selection is purely geometric and there is no other property to
//                      filter on; the exposure is UNDER-DETERMINATION, which is a different
//                      finding and is reported as one
export const SELECTIONS = [

  { id: 'N-01', file: 'money-probe.mjs', anchor: "const near   = left.find(t => /\\$\\s*$/.test(t.str) && x1 - t.x2 <= MAX_GAP)", order: 'filter-then-rank',
    property: 'the printed run ENDS in "$"',
    why: 'THE DEFECT THIS CLASS IS NAMED FOR, AND ITS FIX. It read `left[0]` and asked whether that run ended in "$"; the Box labels and the footer word "Form" are drawn 2.1–3.5pt left of a cell in the row above, nearer than that row’s own "$" at 3.6pt, so on (29), Box C, (38) and (51) the label won the race and a real currency symbol was never looked at — and two of the four were written into the map as cells the form draws no "$" against. `left` is distance-sorted and `.find` takes the NEAREST run that already satisfies the property, which is what "is there a $ in the gap" always meant.' },

  { id: 'N-02', file: 'correlate-labels.mjs', anchor: 'const s = [...arr].sort(byDist);', order: 'FIXED', family: true,
    property: 'the printed run is DESCRIPTIVE (a caption, not a marker or a currency glyph)',
    why: 'THE SAME DEFECT ONE LEVEL UP, AND IT WAS LOAD-BEARING. `nearestDescriptive` and `markerFor` both filter before they rank and are correct in themselves — but the BUCKETS they read were truncated to the nearest 3 (nearest 5 for `nearest`) before any property filter ran, so a descriptive caption sitting behind three non-descriptive runs was cut from the bucket and never seen. On 433-A page 3, field p2_t32_16[0]’s `above` bucket holds five "$" runs at 31–161pt and the first descriptive run at 198.9pt: truncation dropped every candidate and the label fell through to a run 273.7pt away in another column. Measured across the three forms: 26 of 515 widgets on 433-A took a different label and 4 took a different marker; 433-F and 433-A(OIC) were unaffected. THAT FIGURE WAS TYPED AS 25 AND IS 26 — see [FIG-01], which states how it was measured and why the sweep cannot re-derive it. Each bucket now filters, then ranks, then truncates.' },

  { id: 'N-03', file: 'correlate-labels.mjs', anchor: 'if (!isDescriptive(cand.text)) continue;', order: 'filter-then-rank',
    property: 'descriptive text',
    why: 'Correct as written and always was: the property is tested before `cand.distance < winner.distance` is consulted. Its input was what had been truncated — see N-02.' },

  { id: 'N-04', file: 'correlate-labels.mjs', anchor: '.filter(x => isMarker(x.text))', order: 'filter-then-rank',
    property: 'the run IS a printed line marker',
    why: 'Filters to markers, then ranks by |distance − winner.distance| so the marker recovered belongs to the same printed row that supplied the label. Its input was what had been truncated — see N-02.' },

  { id: 'N-05', file: 'line-markers.mjs', anchor: 'const cands = widgets', order: 'no-property',
    property: '(none available) — same page, band-containing, to the right',
    why: 'IT DOES NOT CARRY THE money-probe DEFECT, AND THE HONEST ANSWER IS THAT IT CANNOT: there is no post-rank property test here at all, because there is no property to test. `cands[0]` is returned unconditionally after a filter that is purely geometric — same page, marker y inside the widget band, widget left edge at or right of the marker — and then ranked by distance from the marker to each candidate’s vertical centre. Every property in the filter is a property sought, so the ORDER is right. THE EXPOSURE IS UNDER-DETERMINATION: on 433-A(OIC) 42 of 89 markers leave more than one candidate standing after the filter and the distance tie-break decides between them; on 433-A it is 146 of 205. Swapping the tie-break from vertical-centre to leftmost changes the answer for 3 markers on 433-A(OIC) and 26 on 433-A, so the tie-break is load-bearing and nothing on the page justifies one over the other. A widget TYPE filter was tried and is vacuous on 433-A(OIC) — every candidate there is a PDFTextField — but on 433-A 16 markers pair to a PDFCheckBox, and this tool has no way to know whether a printed line is a checkbox line or a money line, so it cannot tell a correct checkbox pairing from a wrong one. THIS IS WHY THE PAGE-6 MARKERS WERE CHECKED CELL BY CELL AGAINST THE RECTANGLES RATHER THAN TAKEN FROM THIS TOOL’S PAIRING (page 6 draws 25 markers — 22 numbered lines, all of which pair, and Boxes D, E and F, none of which do; this sentence said "the 23 page-6 markers" and 23 is not a figure this page produces, see [FIG-09]), and why the two wrong page-5 pairings are recorded in the map at `_map_evidence_page5.the_two_line_markers_pairings_that_are_WRONG_on_this_page`. The tool now prints how many markers its filter left under-determined, so a reader is told which answers the tie-break invented — AND UNTIL THIS SENTENCE WAS AUDITED IT DID NOT: line-markers.mjs had a zero-byte diff in the commit that first wrote this claim. The print exists now, and [FIG-03]..[FIG-09c] derive its figures from the same function rather than from a second copy of the filter. It is an authoring instrument, exports nothing, and no gate step reads it.' },

  { id: 'N-06', file: 'verify-headings.mjs', anchor: 'const items = (printed[h.page - 1]?.items || []).filter(t => t.str === h.text)', order: 'filter-then-rank',
    property: 'the printed run IS the declared heading text, verbatim',
    why: 'Filters on exact printed text FIRST. When that leaves more than one — 433-F prints the same account column header over both tables — it does not rank at all: it requires the declaration to carry a `near_x` hint and ERRORS OUT when it does not. "Guessing would pick a band boundary at random" is the reason in the code. Zero matches is likewise an error, not a skip.' },

  { id: 'N-07', file: 'verify-headings.mjs', anchor: 'const above = list.filter(h => h.y > yc)', order: 'filter-then-rank',
    property: 'the heading is printed ABOVE this widget, on this page',
    why: 'Filters to headings above the widget centre on the same page, then takes the last of a y-descending list — the nearest one above, by construction rather than by a distance comparison. A widget above every declared heading returns `{id: null, why: …}` naming the page and the y, which the caller reports. No silent attribution to the topmost heading.' },

  { id: 'N-08', file: 'align-block.mjs', anchor: 'for (const t of [...items].sort((a, b) => byRow(', order: 'no-property',
    property: '(none) — a printed-order listing, not a selection',
    why: 'NOT A SELECTION AT ALL. It sorts printed runs and widgets into reading order and prints both lists for a person to compare by eye. Nothing is chosen, nothing is paired, and no answer is derived from proximity — which is precisely why this tool is what the map’s coordinate evidence is re-measured against.' },
];

// ---------------------------------------------------------------------------------------
// (c) THE PARALLEL-LIST REGISTER.
//
// `disposition` is one of:
//   merged        one list now; the other holds a pointer and no entries
//   asserted      both remain and a check here proves the linkage every run
//   independent   they overlap in subject but not in fact, with the reason
export const PARALLEL = [

  { id: 'P-01', a: 'map.json _arguable_page{N}[]', b: 'map.json _carried.open[] / .resolved[]', disposition: 'asserted',
    why: 'THE PAIR THAT NAMED THE CLASS. Two lists for three slices, and seven of nine items lived only in `_arguable_page{N}` — the list nothing counts — inside the file whose `_carried` ledger exists to prevent exactly that. Each ledger entry now carries a `raised_as` naming the array item it came from, and count-sweep [S-07b] requires every id in every `_arguable_page{N}` array to be named by some ledger entry. WHAT IS CHECKED HERE IS THAT THE ASSERTION IS STILL WIRED, not the linkage itself — re-running the comparison in a second file would be this very defect class committed by the file that sweeps for it.',
    assert: (ctx) => [{ what: 'the _arguable -> _carried linkage assertion is still wired in count-sweep', claimed: 'S-07b present', derived: ctx.sweepAssertsArguable ? 'S-07b present' : 'MISSING', from: 'count-sweep.mjs source' }] },

  { id: 'P-02', a: 'totals.json totals[] (QSV entries)', b: 'name-lies.json the quick-sale control figures', disposition: 'merged',
    why: 'MERGED ALREADY, AND VERIFIED HERE RATHER THAN TAKEN ON TRUST. These drifted to "five across two pages" against "nine across four" — about the same nine cells — and the fix was to give both files ONE derivation: `quickSaleCells(ctx)` in count-sweep.mjs, read by [S-13], [S-13b] and [S-14]. Neither file states the figure independently any more. Proved live by mutation: editing the name-lies figure from nine to seven raises `MISMATCH … the artefact says 7; derived from totals entries whose id ends QSV: 9`.',
    assert: (ctx) => [{ what: 'quick-sale figures have exactly one derivation', claimed: 'quickSaleCells', derived: ctx.sweepSharesQuickSale ? 'quickSaleCells' : 'MORE THAN ONE', from: 'count-sweep.mjs [S-13, S-13b, S-14]' }] },

  { id: 'P-03', a: 'map.json _not_checkable.entries[]', b: 'totals.json not_checkable.entries[]', disposition: 'merged',
    why: 'THE THIRD INSTANCE, AND THE WORST OF THE THREE. Two copies of one list, drifted in BOTH directions: the totals copy had grown to 18 entries while the map copy sat at 15, never learning `9c_business_assets_from_attachment`, `10_irs_allowed_deduction_books_and_tools` or the `9ab_business_assets.quick_sale_equity` group cell; and 17 FIELDS differed across the 15 entries they shared. Each copy’s `_why` claimed to mirror the other and neither was checked. The asymmetry settles which is the fossil: `totals.json not_checkable` is read by render-review.mjs (the review-page advisories), by rounding.mjs (money-cell addressing) and by run-form-gate.mjs (the declared-not-checkable count and the DOUBLE-DECLARED check), while the map copy is read by NO CODE — fill-433aoi.mjs says so in its own header, "DOCUMENTATION ONLY, and neither is read by this file". The gate’s "18 … declared not checkable" was counting the live list while the map’s 15 was the list nothing counts, which is `_arguable`/`_carried` exactly. Merged into totals.json; the two facts the map copy held alone — the mechanism clause on (1c) and `checked_by_hand_before_declaring` on (6d) — were moved across first, and the rest was prose the totals copy had already evolved past. The map block now holds a pointer and no entries, and the assertion below stops it regrowing one.',
    assert: (ctx) => {
      const n = (ctx.map._not_checkable?.entries || []).length;
      return [{ what: 'map._not_checkable holds no second copy of the list', claimed: 0, derived: n,
        from: 'totals.json not_checkable.entries[] is the one list; the map block is a pointer' }];
    } },

  { id: 'P-04', a: 'map.json _computed.entries[]', b: 'totals.json totals[]', disposition: 'independent',
    why: 'OVERLAPPING SUBJECT, DIFFERENT FACT — and they are not two copies. `_computed.entries` records which cells this map WRITES as a computed value and where the value comes from; `totals[]` records which printed cells the GATE RECOMPUTES from their feeders and fails on. A cell can be in either, both or neither: (1c) is written from input and recomputed by nothing, Box A is recomputed and never written, and the four predicated vehicle lines are one computed cell against four tripwire entries. There is no cardinality relation to assert between them and asserting one would be inventing a fact. What IS asserted, and is the check that matters, is that no cell is in `totals[]` AND in `not_checkable` at once — run-form-gate.mjs fails that as DOUBLE-DECLARED, because a cell declared both checked and deliberately-unchecked carries two contradictory states, which is the same defect as carrying none.' },

  { id: 'P-05', a: 'map.json groups{}', b: 'headings.json groups{}', disposition: 'asserted',
    why: 'Two files naming the same ten groups: the map declares each group’s slots and columns, the headings file declares which printed heading each group must sit under. A group in one and not the other is a group whose rows are either unbound or unbanded, and both fail silently. Asserted here by key-set equality.',
    assert: (ctx) => {
      const m = Object.keys(ctx.map.groups || {}).sort();
      const h = Object.keys(ctx.headings?.groups || {}).sort();
      const rows = [{ what: 'map.groups and headings.groups name the same groups', claimed: m.join(','), derived: h.join(','), from: 'key sets of both files' }];
      return rows;
    } },

  { id: 'P-06', a: 'map.json rounding.blocks[]', b: 'the printed "$" the form draws (money-probe)', disposition: 'asserted',
    why: 'The declaration of which cells are money against the evidence of which cells the form draws a currency symbol beside. Asserted as an INEQUALITY per page, not an equality, and the direction is the whole point: declared MAY exceed probed, because 433-A(OIC) prints money cells with no "$" and each is named in its block’s `_money_without_a_printed_dollar_sign`; probed exceeding declared would be a money cell the form marks and the map does not govern — an unrounded, ungoverned cell — and is a STOP. Already asserted by count-sweep [S-08]; recorded here so the pair is not re-discovered as unlinked.' },

  { id: 'P-07', a: 'map.json _label_file_disagreements', b: 'name-lies.json entries[]', disposition: 'independent',
    why: 'BOTH RECORD SOMETHING BEING WRONG, ABOUT DIFFERENT THINGS. `name-lies.json` records where a FIELD NAME contradicts the printed cell — the fourteen active lies on this form, each with the printed evidence that settled it. `_label_file_disagreements` records where the generated LABEL FILE (433aoi.labels.json, an output of correlate-labels.mjs) disagrees with what the page prints — a tooling artefact being wrong, not the form being misleading. The two overlap on exactly one entry, `where_the_label_file_is_right_and_the_NAME_is_wrong`, and that entry exists to say the two disagreed and which won. Merging them would lose the distinction between "the IRS named this cell misleadingly" and "our label extractor mis-read this cell", and N-02 above is the reason the second is worth its own list.' },
];

// ---------------------------------------------------------------------------------------
export const buildGuardContext = (form) => {
  const rd = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
  return {
    form,
    map: rd(`${DIR}/maps/${form}.map.json`) || {},
    totals: rd(`${DIR}/maps/${form}.totals.json`),
    headings: rd(`${DIR}/maps/${form}.headings.json`),
    lies: rd(`${DIR}/maps/${form}.name-lies.json`),
    // P-02 asks whether the quick-sale figures still have exactly one derivation. Read from
    // the source rather than assumed: three claim sites must all call quickSaleCells().
    sweepSharesQuickSale: (() => {
      const src = readFileSync(`${DIR}/count-sweep.mjs`, 'utf8');
      const defs = (src.match(/const quickSaleCells = /g) || []).length;
      const uses = (src.match(/quickSaleCells\(ctx\)/g) || []).length;
      return defs === 1 && uses >= 3;
    })(),
    // P-01 asks whether the _arguable -> _carried linkage assertion is still wired. Read from
    // the source: the manifest entry must exist AND must still compare ids against the ledger.
    sweepAssertsArguable: (() => {
      const src = readFileSync(`${DIR}/count-sweep.mjs`, 'utf8');
      return /id: 'S-07b'/.test(src) && /_arguable_page\\d\+\$/.test(src) && /is named by a _carried entry/.test(src);
    })(),
  };
};

const fileMatches = (spec, file) => (spec instanceof RegExp ? spec.test(file) : spec === file);

// ---------------------------------------------------------------------------------------
// (d) THE FIGURE REGISTER — THE SWEEP'S OWN QUANTITATIVE PROSE.
//
// FOUND BY VERIFYING THIS FILE RATHER THAN TRUSTING IT, AND IT IS THE SAME DEFECT ONE LEVEL
// UP FOR THE FOURTH TIME. The anchor mechanism proves a disposition is ATTACHED to the code
// it describes. It proves nothing about whether what the disposition SAYS is true. And the
// two sweeps between them cover neither: count-sweep.mjs reads JSON artefacts only, and
// guard-sweep.mjs reads source for SHAPES, never for claims. So the registers above were the
// one place left in this engine where a number could be typed and nothing would ever read it
// — which is exactly the state `_arguable_page{N}` was in, and exactly the state six slices
// of crosswalk classification were in while they lived only in chat reports.
//
// Two claims in this file were wrong on the day it was committed:
//
//   [N-02] said 25 of 433-A's widget labels moved. The figure is 26. Off by one, in the one
//          sentence whose whole purpose was to show that the defect had been load-bearing.
//   [N-05] said "the tool now prints how many markers its filter left under-determined".
//          IT DID NOT. line-markers.mjs had a ZERO-BYTE DIFF in the commit that wrote that
//          sentence. A disposition described a remedy that did not exist and the sweep
//          printed OK underneath it — a guard certifying its own blind spot, which is the
//          sentence this entire file was written to retire.
//
// So every cardinality a register quotes is enumerated here, and each either DERIVES or
// declares itself underivable WITH THE PROCEDURE THAT MEASURED IT. `stated` is compared
// against `derive()` on every run; a figure with no `derive` must carry `measured_by`; a
// figure with neither is a STOP, in the same way an undisposed guard site is.
//
// The derivations IMPORT from the tool they are about — `underDetermination` out of
// line-markers.mjs — instead of re-implementing its filter here. That is not tidiness. A
// second implementation of the pairing was in fact written while auditing this, disagreed
// (40 and 71 against 3 and 26), and the disagreement was entirely in the second copy: it
// re-sorted an unsorted array, so equal-x candidates fell back to document order instead of
// centre order. A check that re-derives a claim from its own copy of the logic tests the
// copy. That is class (c), committed by the file that enumerates class (c).
export const FIGURES = [
  { id: 'FIG-01', register: 'N-02', what: '433-A widget labels that moved when the truncation order was fixed', stated: 26,
    measured_by: 'MUTATION, and it cannot be re-derived from the tree: revert `isFormatHint` out of `isDescriptive` in correlate-labels.mjs, run `node adapters/pdf/correlate-labels.mjs 433a`, and diff widget `label` against the pre-sweep file at 8c9f38e. Both inputs — a source mutation and a git revision — are outside anything a sweep over the working tree can reach. Declared underivable with the procedure named, in the same shape as the NEG-* floor fixtures.' },

  { id: 'FIG-02', register: 'N-02', what: '433-A widget markers that moved', stated: 4,
    measured_by: 'The same mutation procedure as [FIG-01], reading `marker` instead of `label`.' },

  { id: 'FIG-03', register: 'N-05', what: '433-A(OIC) markers left under-determined by the geometric filter', stated: 42,
    derive: async () => (await underDetermination('433aoi')).under },

  { id: 'FIG-04', register: 'N-05', what: '433-A markers left under-determined by the geometric filter', stated: 146,
    derive: async () => (await underDetermination('433a')).under },

  { id: 'FIG-05', register: 'N-05', what: '433-A(OIC) pairings where the distance tie-break and a leftmost tie-break disagree', stated: 3,
    derive: async () => (await underDetermination('433aoi')).invented },

  { id: 'FIG-06', register: 'N-05', what: '433-A pairings where the distance tie-break and a leftmost tie-break disagree', stated: 26,
    derive: async () => (await underDetermination('433a')).invented },

  { id: 'FIG-07', register: 'N-05', what: '433-A markers whose pairing is a PDFCheckBox', stated: 16,
    derive: async () => (await underDetermination('433a')).checkbox },

  { id: 'FIG-08', register: 'N-05', what: '433-A(OIC) markers whose pairing is a PDFCheckBox — why a widget-TYPE filter is vacuous on this form', stated: 0,
    derive: async () => (await underDetermination('433aoi')).checkbox },

  // [FIG-09] IS WHY THIS REGISTER EARNS ITS KEEP, AND THE RECOVERY IS WHY A REPORT PRINTS ITS
  // EVIDENCE. The disposition said "THE 23 PAGE-6 MARKERS", and 23 is not a figure this page
  // produces under any reading: page 6 draws 25 markers, of which 22 are numbered line markers
  // and 3 are box markers (D, E, F); all 22 numbered markers pair to a money cell whose
  // rectangle CONTAINS the marker's y, and none of the 3 boxes pairs to anything. There is
  // no 23.
  //
  // SUPERSEDED, KEPT VERBATIM: this comment previously read "What slice 6 actually checked
  // cannot now be recovered, because it was recorded in a chat report — the one artefact class
  // no sweep reaches". WHAT IT GOT RIGHT: a chat report is outside every sweep in this tree,
  // and that is still the reason the crosswalk classification was moved into a file. WHAT IT
  // GOT WRONG: it declared the figure unrecoverable without looking at what the report had
  // printed one section BELOW the sentence. The slice-6 report printed its own marker table
  // beside the count. Counting that table: (30) through (38) is nine, (39) through (51) is
  // thirteen, twenty-two numbered markers, plus Box D, Box E and Box F, which pair with
  // nothing — twenty-five drawn, twenty-two numbered. That agrees exactly with the independent
  // finding recorded in the same report, "22 numbered lines (all pair) and Boxes D, E, F (none
  // pair)". So FIG-09 is 22, RECOVERED FROM THE ENUMERATION PRINTED BESIDE THE COUNT IN THE
  // SLICE-6 REPORT, and not merely replaced by a figure that happens to derive.
  //
  // That is the whole argument for printing evidence next to conclusions, one level out from
  // where this file usually makes it: the discipline the sweep enforces on FILES is what made
  // a REPORT repairable. A report that prints only its conclusions cannot be repaired at all,
  // because there is nothing left to recount.
  //
  // CONTAINMENT IS ASSERTED WITHOUT THE TOLERANCE. attachIn() filters on the band widened by
  // TOL_Y = 2, so "pairs to a widget" and "the rectangle contains the marker's y" are two
  // different claims and the register must state the one the prose above states. Both are 22
  // on this page — checked, not assumed: every one of the 22 sits strictly inside its cell's
  // rect[1]..rect[3]. If a future revision moves a marker into the 2pt skirt, this derivation
  // falls to 21 and the register fails, which is the point.
  { id: 'FIG-09', register: 'N-05', what: '433-A(OIC) page-6 numbered markers, each paired to a money cell whose rectangle contains the y of that marker', stated: 22,
    _recovered_from: 'The enumeration printed beside the count in the slice-6 report: (30)..(38) = 9, (39)..(51) = 13, 22 numbered; Boxes D, E and F pair with nothing; 25 drawn.',
    derive: async () => { const { rows, attach } = await markerPairing('433aoi'); return rows.filter(m => {
      if (m.page !== 6 || m.kind !== 'line') return false;
      const w = attach(m).winner;
      // STRICT containment, no tolerance: the claim in `what` is about the rectangle, not
      // about the filter's 2pt skirt, and a comparison this register makes carries no slack.
      // THE MARKER'S y HERE IS ITS RUN TOP, and it is now named as one. line-markers.mjs used
      // to carry that value in a bare `y`; this derivation read it and would have gone on
      // reading a field of the same name after that field became the BASELINE - silently
      // deriving a different figure from the same sentence. The value is unchanged and the
      // no-op is proved by this register itself: FIG-09 states 22 and must still derive 22.
      return !!w && w.rect && m.y_run_top >= w.rect[1] && m.y_run_top <= w.rect[3];
    }).length; } },

  { id: 'FIG-09b', register: 'N-05', what: '433-A(OIC) page-6 markers drawn in total', stated: 25,
    derive: async () => { const { rows } = await markerPairing('433aoi'); return rows.filter(m => m.page === 6).length; } },

  { id: 'FIG-09c', register: 'N-05', what: '433-A(OIC) page-6 box markers, none of which pairs to a widget', stated: 3,
    derive: async () => { const { rows, attach } = await markerPairing('433aoi'); return rows.filter(m => m.page === 6 && m.kind === 'box' && !attach(m).winner).length; } },

  { id: 'FIG-10', register: 'P-03', what: 'entries the totals copy of _not_checkable had grown to', stated: 19,
    _was: 'Stated 18 through slice 6. Slice 7 added ONE: s8_box_g_or_box_h, whose value the page cannot decide between Box G and Box H. It briefly added a second, s8_offer_amount, and gate step 11 refused it — a cell cannot be both checked by a tripwire and declared not checkable, and that cell IS checked. Its printed constraint "your offer must be more than zero" moved to a review_page_advisory on the TOTAL, which is a channel this slice had to open. The figure moves with the list because it derives from the list.',
    derive: async () => { const t = JSON.parse(readFileSync(`${DIR}/maps/433aoi.totals.json`, 'utf8')); return (t.not_checkable?.entries || []).length; } },

  { id: 'FIG-11', register: 'P-03', what: 'entries the map copy sat at before the merge', stated: 15,
    measured_by: 'Read at 8c9f38e, the commit before the merge. The map copy holds no entries[] today — that is what "merged" means — so the pre-merge length is a fact about a git revision, not about the tree. Re-derived on audit as 15, with 15 shared keys and 3 held only by the totals copy.' },

  { id: 'FIG-12', register: 'P-03', what: 'fields that differed across the 15 shared entries', stated: 17,
    measured_by: 'The same pre-merge revision as [FIG-11], comparing every field of every shared entry. Re-derived on audit as 17.' },
];

/** Run the figure register. Async: the marker figures are read out of the PDFs themselves. */
export const runFigureSweep = async () => {
  const problems = [], rows = [];
  for (const f of FIGURES) {
    if (!f.derive && !f.measured_by) {
      problems.push(`UNDECLARED  [${f.id}]  ${f.what}\n      states ${f.stated} and neither derives it nor says how it was measured.\n      A figure in a disposition is a claim like any other. There is no third state.`);
      rows.push({ id: f.id, verdict: 'UNDECLARED' });
      continue;
    }
    if (!f.derive) { rows.push({ id: f.id, verdict: 'underivable' }); continue; }
    let got;
    try { got = await f.derive(); }
    catch (e) {
      problems.push(`UNREADABLE  [${f.id}]  ${f.what}\n      the derivation threw: ${e.message}\n      A figure whose derivation cannot read its input reports that it could not read it. Never a pass.`);
      rows.push({ id: f.id, verdict: 'UNREADABLE' });
      continue;
    }
    if (String(got) !== String(f.stated)) {
      problems.push(`FIGURE      [${f.id}]  ${f.register} — ${f.what}\n      the disposition states ${f.stated}; derived: ${got}`);
      rows.push({ id: f.id, verdict: 'MISMATCH' });
    } else rows.push({ id: f.id, verdict: 'derived' });
  }
  return { rows, problems };
};

/** Print the figure register. Returns the number of problems (0 = every figure holds). */
export const reportFigureSweep = (s) => {
  const t = s.rows.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});
  console.log(`figure sweep: ${s.rows.length} figure(s) quoted by a disposition — ${Object.entries(t).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  if (!s.problems.length) {
    console.log('OK — every figure a disposition states either derives and agrees, or names the measurement that produced it.');
    return 0;
  }
  console.error(`FIGURE SWEEP — ${s.problems.length} problem(s):`);
  s.problems.forEach(p => console.error(`  ${p}`));
  return s.problems.length;
};

/**
 * RUN THE THIRD SWEEP.
 *
 * Four ways to fail, reported differently:
 *   UNDISPOSED   a source site of a named shape matches no register entry — nobody has said
 *                whether it is sound or vacuous, and that is the state this file forbids
 *   ORPHAN       a register entry whose anchor matches no line — the guard it disposed of
 *                has been edited or deleted, so its verdict no longer describes any code
 *   UNLINKED     a parallel-list assertion disagreed
 *   UNREADABLE   an assertion threw
 */
export const runGuardSweep = (form) => {
  const problems = [], rows = [];
  const files = sweptFiles();

  // ─── (a) every source site of a named shape is disposed ────────────────────────────────
  const hitBy = new Map(VACUOUS.map(e => [e.id, 0]));
  const allSites = files.flatMap(sitesIn);
  for (const s of allSites) {
    const e = VACUOUS.find(x => fileMatches(x.file, s.file) && s.text.includes(x.anchor));
    if (!e) {
      problems.push(`UNDISPOSED  ${s.file}:${s.line}  [${s.shape}]\n      ${s.text.slice(0, 150)}\n      matches no entry in VACUOUS. Say whether an empty input can make this report success.\n      There is no third state.`);
      rows.push({ kind: 'a', at: `${s.file}:${s.line}`, id: '(none)', verdict: 'UNDISPOSED', shape: s.shape });
      continue;
    }
    hitBy.set(e.id, hitBy.get(e.id) + 1);
    rows.push({ kind: 'a', at: `${s.file}:${s.line}`, id: e.id, verdict: e.verdict, shape: s.shape, why: e.why });
  }
  // An anchor that matches nothing is a disposition standing over deleted or edited code.
  for (const e of VACUOUS) if (!hitBy.get(e.id))
    problems.push(`ORPHAN      [${e.id}]  anchor ${JSON.stringify(e.anchor)}\n      matches no line in ${e.file}. The guard it disposes of has been edited or removed, so its\n      verdict now certifies nothing. Re-read the code and re-write the disposition.`);

  // ─── (b) every selection is disposed, and rank-then-filter is a STOP ───────────────────
  const selHit = new Map(SELECTIONS.map(e => [e.id, 0]));
  for (const e of SELECTIONS) {
    let found = 0;
    for (const f of files) {
      if (!fileMatches(e.file, f)) continue;
      const src = readFileSync(`${DIR}/${f}`, 'utf8').split('\n');
      src.forEach((ln, i) => { if (!isProse(ln) && ln.includes(e.anchor)) { found++; rows.push({ kind: 'b', at: `${f}:${i + 1}`, id: e.id, verdict: e.order, why: e.why }); } });
    }
    selHit.set(e.id, found);
    if (!found) problems.push(`ORPHAN      [${e.id}]  anchor ${JSON.stringify(e.anchor)}\n      matches no line in ${e.file}. A selection’s disposition must stand over real code.`);
    if (e.order === 'rank-then-filter')
      problems.push(`RANK-FIRST  [${e.id}]  ${e.file}\n      ranks by distance before filtering by ${JSON.stringify(e.property)}.\n      ${e.why}`);
  }

  // ─── (c) every parallel-list pair is disposed, and its assertion runs ──────────────────
  const ctx = buildGuardContext(form);
  for (const p of PARALLEL) {
    if (!p.assert) { rows.push({ kind: 'c', at: `${p.a}  ||  ${p.b}`, id: p.id, verdict: p.disposition, why: p.why }); continue; }
    let out;
    try { out = p.assert(ctx) || []; }
    catch (e) { problems.push(`UNREADABLE  [${p.id}]  ${p.a}  ||  ${p.b}\n      the linkage assertion threw: ${e.message}`); rows.push({ kind: 'c', at: `${p.a}  ||  ${p.b}`, id: p.id, verdict: 'UNREADABLE' }); continue; }
    let bad = 0;
    for (const r of out) if (String(r.claimed) !== String(r.derived)) {
      problems.push(`UNLINKED    [${p.id}]  ${p.a}  ||  ${p.b}\n      ${r.what}\n      states ${JSON.stringify(r.claimed)}; derived${r.from ? ` from ${r.from}` : ''}: ${JSON.stringify(r.derived)}`);
      bad++;
    }
    rows.push({ kind: 'c', at: `${p.a}  ||  ${p.b}`, id: p.id, verdict: bad ? 'UNLINKED' : p.disposition, checks: out.length, why: p.why });
  }

  return { form, rows, problems, siteCount: allSites.length, fileCount: files.length };
};

/** Print the third sweep. Returns the number of problems (0 = it holds). */
export const reportGuardSweep = (s, { verbose = false } = {}) => {
  const of = (k) => s.rows.filter(r => r.kind === k);
  const tally = (k) => of(k).reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});
  const fmt = (o) => Object.entries(o).map(([k, v]) => `${v} ${k}`).join(', ') || 'none';
  console.log(`guard sweep: ${s.siteCount} vacuous-guard site(s) across ${s.fileCount} engine file(s) — ${fmt(tally('a'))}`);
  examined('guard-sweep', s.form, s.siteCount, 'vacuous-guard-sites');
  console.log(`             ${of('b').length} nearest-neighbour selection site(s) — ${fmt(tally('b'))}`);
  console.log(`             ${of('c').length} parallel-list pair(s) — ${fmt(tally('c'))}`);
  if (verbose) {
    for (const [k, label] of [['a', '(a) vacuous guards'], ['b', '(b) nearest-neighbour selections'], ['c', '(c) parallel lists']]) {
      console.log(`  ${label}`);
      for (const r of of(k)) console.log(`    ${String(r.id).padEnd(6)} ${String(r.verdict).padEnd(18)} ${r.at}`);
    }
  }
  if (!s.problems.length) {
    console.log('OK — every guard site is disposed, every selection filters before it ranks or says why it cannot, and every parallel pair is merged, asserted or declared independent.');
    return 0;
  }
  console.error(`GUARD SWEEP — ${s.problems.length} problem(s):`);
  s.problems.forEach(p => console.error(`  ${p}`));
  return s.problems.length;
};

// CLI: node adapters/pdf/guard-sweep.mjs <form> [--verbose]
if (process.argv[1] && /guard-sweep\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const s = runGuardSweep(process.argv[2] || '433aoi');
  process.exit(reportGuardSweep(s, { verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
