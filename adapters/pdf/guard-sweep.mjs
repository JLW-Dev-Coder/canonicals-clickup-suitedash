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

  { id: 'G-45', file: 'validate-map.mjs', anchor: 'const cb = /^([A-Za-z0-9_]+)', verdict: 'sound',
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
    why: 'THE SAME DEFECT ONE LEVEL UP, AND IT WAS LOAD-BEARING. `nearestDescriptive` and `markerFor` both filter before they rank and are correct in themselves — but the BUCKETS they read were truncated to the nearest 3 (nearest 5 for `nearest`) before any property filter ran, so a descriptive caption sitting behind three non-descriptive runs was cut from the bucket and never seen. On 433-A page 3, field p2_t32_16[0]’s `above` bucket holds five "$" runs at 31–161pt and the first descriptive run at 198.9pt: truncation dropped every candidate and the label fell through to a run 273.7pt away in another column. Measured across the three forms: 26 of 515 widgets on 433-A took a different label and 4 took a different marker; 433-F and 433-A(OIC) were unaffected. THAT FIGURE WAS TYPED AS 25 AND IS 26 — see [F-01], which states how it was measured and why the sweep cannot re-derive it. Each bucket now filters, then ranks, then truncates.' },

  { id: 'N-03', file: 'correlate-labels.mjs', anchor: 'if (!isDescriptive(cand.text)) continue;', order: 'filter-then-rank',
    property: 'descriptive text',
    why: 'Correct as written and always was: the property is tested before `cand.distance < winner.distance` is consulted. Its input was what had been truncated — see N-02.' },

  { id: 'N-04', file: 'correlate-labels.mjs', anchor: '.filter(x => isMarker(x.text))', order: 'filter-then-rank',
    property: 'the run IS a printed line marker',
    why: 'Filters to markers, then ranks by |distance − winner.distance| so the marker recovered belongs to the same printed row that supplied the label. Its input was what had been truncated — see N-02.' },

  { id: 'N-05', file: 'line-markers.mjs', anchor: 'const cands = widgets', order: 'no-property',
    property: '(none available) — same page, band-containing, to the right',
    why: 'IT DOES NOT CARRY THE money-probe DEFECT, AND THE HONEST ANSWER IS THAT IT CANNOT: there is no post-rank property test here at all, because there is no property to test. `cands[0]` is returned unconditionally after a filter that is purely geometric — same page, marker y inside the widget band, widget left edge at or right of the marker — and then ranked by distance from the marker to each candidate’s vertical centre. Every property in the filter is a property sought, so the ORDER is right. THE EXPOSURE IS UNDER-DETERMINATION: on 433-A(OIC) 42 of 89 markers leave more than one candidate standing after the filter and the distance tie-break decides between them; on 433-A it is 146 of 205. Swapping the tie-break from vertical-centre to leftmost changes the answer for 3 markers on 433-A(OIC) and 26 on 433-A, so the tie-break is load-bearing and nothing on the page justifies one over the other. A widget TYPE filter was tried and is vacuous on 433-A(OIC) — every candidate there is a PDFTextField — but on 433-A 16 markers pair to a PDFCheckBox, and this tool has no way to know whether a printed line is a checkbox line or a money line, so it cannot tell a correct checkbox pairing from a wrong one. THIS IS WHY THE PAGE-6 MARKERS WERE CHECKED CELL BY CELL AGAINST THE RECTANGLES RATHER THAN TAKEN FROM THIS TOOL’S PAIRING (page 6 draws 25 markers — 22 numbered lines, all of which pair, and Boxes D, E and F, none of which do; this sentence said "the 23 page-6 markers" and 23 is not a figure this page produces, see [F-09]), and why the two wrong page-5 pairings are recorded in the map at `_map_evidence_page5.the_two_line_markers_pairings_that_are_WRONG_on_this_page`. The tool now prints how many markers its filter left under-determined, so a reader is told which answers the tie-break invented — AND UNTIL THIS SENTENCE WAS AUDITED IT DID NOT: line-markers.mjs had a zero-byte diff in the commit that first wrote this claim. The print exists now, and [F-03]..[F-09c] derive its figures from the same function rather than from a second copy of the filter. It is an authoring instrument, exports nothing, and no gate step reads it.' },

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
  { id: 'F-01', register: 'N-02', what: '433-A widget labels that moved when the truncation order was fixed', stated: 26,
    measured_by: 'MUTATION, and it cannot be re-derived from the tree: revert `isFormatHint` out of `isDescriptive` in correlate-labels.mjs, run `node adapters/pdf/correlate-labels.mjs 433a`, and diff widget `label` against the pre-sweep file at 8c9f38e. Both inputs — a source mutation and a git revision — are outside anything a sweep over the working tree can reach. Declared underivable with the procedure named, in the same shape as the NEG-* floor fixtures.' },

  { id: 'F-02', register: 'N-02', what: '433-A widget markers that moved', stated: 4,
    measured_by: 'The same mutation procedure as [F-01], reading `marker` instead of `label`.' },

  { id: 'F-03', register: 'N-05', what: '433-A(OIC) markers left under-determined by the geometric filter', stated: 42,
    derive: async () => (await underDetermination('433aoi')).under },

  { id: 'F-04', register: 'N-05', what: '433-A markers left under-determined by the geometric filter', stated: 146,
    derive: async () => (await underDetermination('433a')).under },

  { id: 'F-05', register: 'N-05', what: '433-A(OIC) pairings where the distance tie-break and a leftmost tie-break disagree', stated: 3,
    derive: async () => (await underDetermination('433aoi')).invented },

  { id: 'F-06', register: 'N-05', what: '433-A pairings where the distance tie-break and a leftmost tie-break disagree', stated: 26,
    derive: async () => (await underDetermination('433a')).invented },

  { id: 'F-07', register: 'N-05', what: '433-A markers whose pairing is a PDFCheckBox', stated: 16,
    derive: async () => (await underDetermination('433a')).checkbox },

  { id: 'F-08', register: 'N-05', what: '433-A(OIC) markers whose pairing is a PDFCheckBox — why a widget-TYPE filter is vacuous on this form', stated: 0,
    derive: async () => (await underDetermination('433aoi')).checkbox },

  // [F-09] IS WHY THIS REGISTER EARNS ITS KEEP, AND THE RECOVERY IS WHY A REPORT PRINTS ITS
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
  // pair)". So F-09 is 22, RECOVERED FROM THE ENUMERATION PRINTED BESIDE THE COUNT IN THE
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
  { id: 'F-09', register: 'N-05', what: '433-A(OIC) page-6 numbered markers, each paired to a money cell whose rectangle contains the y of that marker', stated: 22,
    _recovered_from: 'The enumeration printed beside the count in the slice-6 report: (30)..(38) = 9, (39)..(51) = 13, 22 numbered; Boxes D, E and F pair with nothing; 25 drawn.',
    derive: async () => { const { rows, attach } = await markerPairing('433aoi'); return rows.filter(m => {
      if (m.page !== 6 || m.kind !== 'line') return false;
      const w = attach(m).winner;
      // STRICT containment, no tolerance: the claim in `what` is about the rectangle, not
      // about the filter's 2pt skirt, and a comparison this register makes carries no slack.
      return !!w && w.rect && m.y >= w.rect[1] && m.y <= w.rect[3];
    }).length; } },

  { id: 'F-09b', register: 'N-05', what: '433-A(OIC) page-6 markers drawn in total', stated: 25,
    derive: async () => { const { rows } = await markerPairing('433aoi'); return rows.filter(m => m.page === 6).length; } },

  { id: 'F-09c', register: 'N-05', what: '433-A(OIC) page-6 box markers, none of which pairs to a widget', stated: 3,
    derive: async () => { const { rows, attach } = await markerPairing('433aoi'); return rows.filter(m => m.page === 6 && m.kind === 'box' && !attach(m).winner).length; } },

  { id: 'F-10', register: 'P-03', what: 'entries the totals copy of _not_checkable had grown to', stated: 20,
    _was: 'Stated 18 through slice 6. Slice 7 added two entries — s8_box_g_or_box_h, whose value the page cannot decide between Box G and Box H, and s8_offer_amount, whose ARITHMETIC is checked by a tripwire and whose printed constraint "must be more than zero" is not a floor and cannot be one. The figure moves with the list because it derives from the list.',
    derive: async () => { const t = JSON.parse(readFileSync(`${DIR}/maps/433aoi.totals.json`, 'utf8')); return (t.not_checkable?.entries || []).length; } },

  { id: 'F-11', register: 'P-03', what: 'entries the map copy sat at before the merge', stated: 15,
    measured_by: 'Read at 8c9f38e, the commit before the merge. The map copy holds no entries[] today — that is what "merged" means — so the pre-merge length is a fact about a git revision, not about the tree. Re-derived on audit as 15, with 15 shared keys and 3 held only by the totals copy.' },

  { id: 'F-12', register: 'P-03', what: 'fields that differed across the 15 shared entries', stated: 17,
    measured_by: 'The same pre-merge revision as [F-11], comparing every field of every shared entry. Re-derived on audit as 17.' },
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
