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

const DIR = 'adapters/pdf';

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
  { id: 'G-39', file: 'assert-overflow.mjs', anchor: 'const logged = logLine ?', verdict: 'sound',
    why: 'FAILS CLOSED IN BOTH DIRECTIONS, AND THE EMPTY CASE IS ALREADY A STOP ABOVE IT. If the pattern reads no `group[index]` token out of the engine’s OVERFLOW line, `logged` is empty, every expected drop lands in `missing`, and each becomes an UNLOGGED problem — the loudest outcome the tool has, not the quietest. The other empty reading, no OVERFLOW line at all, never reaches here: the lines above exit 2 when the line is absent while drops are expected. And an over-max fixture that dropped nothing cannot get this far either, because question 1 pushes a NOT OVER-MAX problem for every group not run past its last slot. Three separate paths, none of which can turn an unread log into a pass.' },

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

  { id: 'G-71', file: 'blanket-audit.mjs', anchor: "= [...text.matchAll(", verdict: 'guarded', family: true,
    why: 'THE COORDINATE EXTRACTORS IN [K-12], AND THE EMPTY CASE IS AN EXPLICIT FAIL. A counter reporting 0 of 0 is the shape that let the first draft of [K-10] pass while reading no widgets at all, so this one returns `{ fail }` when the two extractions between them yield nothing — and a `fail` row is reported by the runner as a coverage failure, never as coverage. Both extractions feed one array and the guard is on their union, which is correct: the claim is about coordinates, and a map that quoted only x runs and no y runs would still have its coordinates checked.' },

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
  { id: 'G-65', file: 'exclusion-sweep.mjs', anchor: 'const m = ln.match(DEF); if (m) out.add(m[1]);', verdict: 'guarded',
    why: 'THE DEFINITION HARVESTER, AND THE ONE PLACE IN THIS FILE A DEAD REGEX WOULD FAIL OPEN. An empty `DEFINED` set makes [EX-90] remove EVERY raw exclusion position, so nothing is registered and nothing is checked — the [A3] shape committed by the file written against it. Closed two ways: [EX-90] counts what it removed and prints the figure beside the raw total on every run, so 175 raw / 0 named is visible rather than silent; and the ORPHAN rule then fires for all sixteen registered predicates at once, because none of them appears in an exclusion position any more. A harvester that dies takes the register down with it, loudly.' },
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
      return !!w && w.rect && m.y >= w.rect[1] && m.y <= w.rect[3];
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
  const files = readdirSync(DIR).filter(f => f.endsWith('.mjs') && f !== 'guard-sweep.mjs').sort();

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
