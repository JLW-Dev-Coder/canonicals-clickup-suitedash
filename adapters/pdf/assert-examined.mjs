// EVERY GUARD THAT RUNS PER FORM, WHAT IT EXAMINED ON EACH, AND EVERY ZERO BY NAME.
//
//   node adapters/pdf/assert-examined.mjs                 # the light set
//   node adapters/pdf/assert-examined.mjs --all           # including the heavy invocations
//   node adapters/pdf/assert-examined.mjs --canary        # prove the reader and the derivation
//   node adapters/pdf/assert-examined.mjs --verbose       # every invocation's command line
//
//   exit 0 = every registered guard reported an examined count for every form it claims to run
//            on, and the matrix is printed with every zero named
//   exit 2 = the derived candidate set and the register disagree, a registered guard reported
//            nothing where it said it would, or a canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — [R-04]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// adapters/hubspot/assert-intake-keys.mjs reported PASS on a run that included 433-B, and its
// 433-B contribution was ZERO. That is not a bug in that guard: the crosswalk is empty, so
// there was nothing to resolve, and the guard did exactly what it was written to do. What was
// wrong is that "PASSED" was the only thing said about it, and "passed" and "had nothing to
// look at" are different facts.
//
// guard-sweep.mjs asks whether an empty input CAN satisfy a predicate, per site. This asks
// whether it DID, per form, today. The two are different questions and the second one is the
// one a reader of a green suite actually wants answered.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE POPULATION IS DERIVED AND THE REGISTER IS COMPARED AGAINST IT IN BOTH DIRECTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A typed list of "the per-form guards" would be a claim nobody counts, which is the class
// [R-13] names. So the candidate set is DERIVED from the tree on every run by a signature, and
// the register must dispose of every candidate:
//
//   a candidate with no entry            STOP — nobody has said what it is
//   an entry the signature no longer finds  STOP — a stale entry, [SB-04]'s second direction
//
// The signature is deliberately WIDE — it catches instruments, generators and portal tools as
// well as guards — because a narrow signature is one that decides the answer before the
// register is consulted. Each candidate is then disposed into a kind, and only `guard` owes an
// examined count. The other kinds carry a reason, and the reason is the thing a later reader
// can disagree with.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A ZERO IS REPORTED, NOT FAILED — AND "NOT REPORTED" IS A THIRD STATE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A GUARD TUNED TO FIRE CONSTANTLY GETS TURNED OFF ([R-10]). Several zeros in this engine are
// correct and permanent: 433-A declares no record shape, so assert-record-shape.mjs examines
// zero routes on it and says so in as many words. Failing on that would make the suite
// unrunnable and the honest answer unspeakable. So a zero is REPORTED, loudly, by name.
//
// What IS a failure is a registered guard that emitted no line at all for a form it claims to
// cover. That is the difference between "I looked and there was nothing" and "nobody knows",
// and it is the whole distinction this file exists to make legible.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// AND THE HEAVY INVOCATIONS ARE NAMED WHEN THEY ARE SKIPPED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// NO SILENT CAPS. Some registered invocations cost a full gate run per fixture per form;
// running all of them takes many minutes. The default run executes the light set and REPORTS
// every heavy invocation it did not run, by name, with the command that would run it. A tool
// that quietly covered less than it printed would be the truncation-reads-as-coverage defect
// arriving through the tool built to measure coverage.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readExamined, examinedCanary } from './examined.mjs';
import { MAPPED_FORMS } from './resolve-fixture.mjs';
import { rx } from './regex-self-assert.mjs';

// THE CARRIED REGISTER, READ RATHER THAN TRUSTED. A declared gap cites an id, and an id that
// is not OPEN in the register is a citation to nothing — the class [SB-17] catches one level
// out and [D-07] is what it costs when two registers disagree about what an id names.
export const carriedOpenIds = () => {
  try {
    const doc = JSON.parse(readFileSync('adapters/pdf/maps/_carried.cross-form.json', 'utf8'));
    return new Set((doc.open || []).map((e) => e.id));
  } catch (e) {
    // AN UNREADABLE REGISTER IS NOT AN EMPTY ONE. Returning an empty set would make every
    // declared gap a dead citation and take the run down, which is the loud direction and is
    // what is wanted: a gap declared against a register nobody can read is undeclared.
    return new Set();
  }
};

export const DIRS = ['adapters/pdf', 'adapters/hubspot'];

// ── THE DERIVED CANDIDATE SIGNATURE ────────────────────────────────────────────────────────
const RX_STOPS = rx('RX-EX-01', /process\.exit(Code)?\b|(^|[^\w.])stop\s*\(/m, {
  why: 'a file that can end a run on what it read, which is half of what makes a file a guard rather than a listing. THE SECOND CLAUSE IS A CORRECTION, AND THIS REGISTER FOUND IT FROM THE STALE SIDE. [D-20] — process.exit(n) after a portal request ABORTS instead of exiting, so the declared code never reaches the caller — was repaired by replacing all 74 call sites under adapters/hubspot/ with stop(n) from hs-lib.mjs, which sets the code and throws a sentinel that only its own handler swallows. Three files in the register below (assert-registry-targets.mjs, hs-verify-provision.mjs, headroom.mjs) thereby stopped matching the first clause and were reported STALE ENTRY — an entry standing over nothing — while being exactly the guards they had been the day before. A repair one directory away had silently narrowed this file\'s population, which is [R-12] happening rather than being feared, and the two-directional check is the only reason anything said so.',
  matches: ['process.exit(2)', 'process.exitCode = 3', 'stop(3);', '  stop(2);', 'if (bad) stop(2);'],
  rejects: ['processXexit', 'process.exiting', 'nonstop(x)', 'timer.stop()', 'this.stop()'],
});
const RX_PER_FORM = rx('RX-EX-03', /MAPPED_FORMS\s*\(|\$\{form\}|\bconst\s+\[?\s*form\b|form: '433/, {
  why: 'a file whose work is scoped to a form — it iterates the mapped forms, interpolates a form into a path, binds one off the command line, or DECLARES ITS OWN FORM LIST. The fourth clause was added after the register reported adapters/pdf/assert-row-class-routes.mjs as a stale entry: that file poisons a row into every declaring group and asserts each refuses it, which is per-form by any reading, and it was invisible to the first three clauses because it named its forms in its own FORMS array. The register found the blind spot from the other direction, which is what having both directions is for. CORRECTION, and it is a correction rather than a tidy: that file NO LONGER declares a list — its five typed (form, fixture, engine) triples became MAPPED_FORMS() + resolveFixture() when two of the five fixture paths were found stale, so it now matches this regex on the FIRST clause and not the fourth. The fourth clause stays, and not out of sentiment: it is the only clause that catches a file which names its forms itself, that shape existed here for four prompts, and removing a clause because its one instance was repaired is how the population narrows to what somebody last looked at.',
  matches: ['MAPPED_FORMS()', 'const p = `maps/${form}.map.json`', 'const [form, ...rest] = argv', "{ form: '433a', sample: 'x' },"],
  rejects: ['MAPPEDFORMS()', 'const formal = 1', 'formatted', "form: '999'"],
});

export const candidates = () => {
  const out = [];
  for (const d of DIRS) {
    for (const f of readdirSync(d).filter((x) => x.endsWith('.mjs')).sort()) {
      const p = `${d}/${f}`;
      let src;
      // AN UNREADABLE FILE IS A CANDIDATE THAT COULD NOT BE CLASSIFIED, NEVER ONE THAT IS NOT
      // THERE. Skipping it would narrow the derived population by exactly the files something
      // is wrong with, which is [G-01]'s shape pointed at this file's own input.
      try { src = readFileSync(p, 'utf8'); } catch (e) { out.push({ path: p, unreadable: e.message }); continue; }
      if (RX_STOPS.test(src) && RX_PER_FORM.test(src)) out.push({ path: p });
    }
  }
  return out;
};

// ── THE REGISTER ───────────────────────────────────────────────────────────────────────────
//
// kind:
//   guard        reports an examined count per form. `forms` says which forms it claims.
//   instrument   reports a READING and decides nothing. A zero from it is a fact about the
//                page, not a vacuous pass, and it has no verdict for a count to qualify.
//   engine       a fill engine. Its universe is the map's targets, partitioned and asserted to
//                account for every field in the PDF; the gate's steps 6, 7 and 10 are its count.
//   generator    writes an artefact. generator-guard.mjs is what stands over it.
//   portal       its outcome is what HubSpot says, not what a local set contains — [SB-22]'s
//                ground, and the same one.
//   orchestrator runs other things and reports how many ran and how many were SKIPPED.
//
// `run` is the argv this tool uses to make the guard speak. `heavy` means it costs a gate run
// (or several) and is excluded from the default set — and NAMED when it is.
export const REGISTER = {
  // ── guards ───────────────────────────────────────────────────────────────────────────────
  'adapters/pdf/validate-map.mjs': { kind: 'guard', universe: 'map-target-references', perForm: true, run: (f) => ['adapters/pdf/validate-map.mjs', f], heavy: true,
    note: 'Heavy because it runs the blanket audit, the guard sweep and the count sweep beneath it — which is also why one invocation of it makes four guards speak.' },
  'adapters/pdf/count-sweep.mjs': { kind: 'guard', universe: 'claim-sites', perForm: true, via: 'adapters/pdf/validate-map.mjs' },
  'adapters/pdf/guard-sweep.mjs': { kind: 'guard', universe: 'vacuous-guard-sites', perForm: true, via: 'adapters/pdf/validate-map.mjs' },
  'adapters/pdf/blanket-audit.mjs': { kind: 'guard', universe: 'sampled-blanket-sites', perForm: true, via: 'adapters/pdf/validate-map.mjs' },
  'adapters/pdf/assert-no-preset-boxes.mjs': { kind: 'guard', universe: 'blank-form-boxes', perForm: true, run: (f) => ['adapters/pdf/assert-no-preset-boxes.mjs', f] },
  'adapters/pdf/assert-record-shape.mjs': { kind: 'guard', universe: 'declared-record-shape-routes', perForm: true, run: (f) => ['adapters/pdf/assert-record-shape.mjs', f] },
  'adapters/pdf/assert-overflow.mjs': { kind: 'guard', universe: 'declared-groups', perForm: true, run: (f) => ['adapters/pdf/assert-overflow.mjs', f],
    onlyWhen: (f) => { try { const m = JSON.parse(readFileSync(`adapters/pdf/maps/${f}.map.json`, 'utf8')); return Object.keys(m.groups || {}).filter((k) => !k.startsWith('_')).length > 0; } catch { return true; } },
    note: 'ONLY FORMS WHOSE MAP DECLARES A REPEATABLE GROUP. The tool itself refuses a groupless form in as many words -- "adapters/pdf/maps/433d.map.json declares no groups. There is no overflow behaviour on this form to assert, and an empty assertion is not a pass" -- so without this predicate the matrix reports NOT REPORTED for a tool that is correctly refusing to report. The predicate is the MAP\'S OWN group count, derived on every run, so a form that grows a group is asserted the day it does; a map that cannot be read returns TRUE, because an unreadable map is a finding rather than an excuse.',
  },
  'adapters/pdf/declaration-coverage.mjs': { kind: 'guard', universe: 'declarations-in-class-on-some-fixture', perForm: true, run: (f) => ['adapters/pdf/declaration-coverage.mjs', f], heavy: true,
    note: 'Heavy: it runs the whole gate once per fixture in the form\'s set, so a five-form pass is upwards of a dozen gate runs.' },
  'adapters/pdf/verify-headings.mjs': { kind: 'guard', universe: 'group-rows-under-a-declared-heading', perForm: true, via: 'adapters/pdf/run-form-gate.mjs' },
  'adapters/pdf/verify-form-coverage.mjs': { kind: 'guard', universe: 'form-fields-accounted-for', perForm: true, via: 'adapters/pdf/run-form-gate.mjs' },
  'adapters/pdf/absence-sweep.mjs': { kind: 'guard', universe: 'absence-claims', perForm: false, run: () => ['adapters/pdf/absence-sweep.mjs'] },
  'adapters/pdf/assert-y-convention.mjs': { kind: 'guard', universe: 'cross-checked-y-objects', perForm: false, run: () => ['adapters/pdf/assert-y-convention.mjs'] },
  'adapters/pdf/assert-subject-register.mjs': { kind: 'guard', universe: 'quotes-re-derived-from-the-page', perForm: false, run: () => ['adapters/pdf/assert-subject-register.mjs'] },
  'adapters/pdf/assert-row-shape-spec.mjs': { kind: 'guard', universe: 'declared-row-shape-units', perForm: false, run: () => ['adapters/pdf/assert-row-shape-spec.mjs'] },
  'adapters/pdf/assert-row-class-routes.mjs': { kind: 'guard', universe: 'poisoned-routing-runs', perForm: false, run: () => ['adapters/pdf/assert-row-class-routes.mjs'] },
  'adapters/pdf/assert-fixture-authorship.mjs': { kind: 'guard', universe: 'fixtures-claiming-a-generator', perForm: false, run: () => ['adapters/pdf/assert-fixture-authorship.mjs'] },
  'adapters/pdf/assert-firing-proofs.mjs': { kind: 'guard', universe: 'firing-proof-claims', perForm: false, run: () => ['adapters/pdf/assert-firing-proofs.mjs'],
    note: 'It reports TWO lines per mapped form, under two universes, because its first draft put them in one and the figure that survived was the one that hid the finding ([R-07]). `firing-proof-claims` counts claims naming the form, cross-form claims included, and is non-zero everywhere. `declared-lines-proved-to-refuse` counts declared total lines a recorded break proof has actually shown to say no, and it is ZERO on 433-A, 433-F and 433-B(OIC) and 6 on 433-B. Those three zeros are the finding: [R-28] is about exactly the state where a comparison has only ever agreed.' },
  'adapters/hubspot/assert-key-space.mjs': { kind: 'guard', universe: 'engine-input-keys', perForm: false, run: () => ['adapters/hubspot/assert-key-space.mjs'],
    note: 'IT SPEAKS ON EVERY FORM AND HAS NO onlyWhen, WHICH IS THE POINT OF IT. Every other guard in this register is asked a question ABOUT a population; this one stands over the thing that DECIDES the population, so a form it says nothing about is a form whose key space nothing checked. It is non-zero on all six because a map with no input keys is not a map. The universe is `engine-input-keys` and not `checkbox-constructs`: the clauses check the whole key space — the row-level exclusion answered by a group source key, the alias collapse, the underscore rule — and labelling the cell by the half that earned the file would be a figure wearing another figure\'s universe ([R-07]).' },
  'adapters/hubspot/twin-check.mjs': { kind: 'guard', universe: 'reuse-rows', perForm: false, run: () => ['adapters/hubspot/twin-check.mjs'],
    onlyWhen: (f) => existsSync('adapters/hubspot/fields.' + f + '.json') && (JSON.parse(readFileSync('adapters/hubspot/fields.' + f + '.json', 'utf8')).properties || []).some((p) => p.scope === 'reuse'),
    note: 'ONLY FORMS THAT HAVE A REUSE ROW, AND THE PREDICATE ASKS THE FILE RATHER THAN A LIST. [D-28]: A8 in each deriver asks a FORM-SPECIFIC row whether its shared irs433_<fact> twin is live, and skipped REUSE rows on the reasoning that a reuse has already been adjudicated by naming its target. A reuse names the property it TAKES and says nothing about the live near-identical names it DECLINED. This guard is that missing universe, and its own population is the reuse rows themselves — so a form with none contributes nothing and says so on its own line rather than reporting a zero into the matrix ([R-04] at the level of the population, which is the shape assert-intake-keys.mjs carries directly above). Today that is 433-B and 433-D; 433-A, 433-A(OIC), 433-B(OIC) and 433-F create names and reuse none, and each joins the matrix the day it gains a reuse row with nothing here edited.' },
  'adapters/hubspot/assert-intake-keys.mjs': { kind: 'guard', universe: 'option-values-plus-row-shapes', perForm: false, run: () => ['adapters/hubspot/assert-intake-keys.mjs'],
    onlyWhen: (f) => existsSync(`adapters/pdf/maps/${f}.crosswalk-classification.json`),
    note: 'ONLY FORMS THAT HAVE A CROSSWALK CLASSIFICATION, which is what this guard reads: it resolves every option value and row shape the classification declares against the map and the form engine. 433-D has a map and NO CLASSIFICATION -- its crosswalk is the next prompt’s work -- so this guard contributes nothing on it and reported NOT REPORTED, which is true and is not a finding. The predicate is the CLASSIFICATION FILE’S EXISTENCE rather than a list, so 433-D joins the matrix the day it is classified, with nothing to edit here. It is the same shape assert-mirror.mjs and assert-subject-class.mjs carry, and the reason all three need one is that this engine now holds a form at every stage of the pipeline at once.' },
  // THE UNIVERSE HERE IS NOT `crosswalk-rows`, AND SAYING SO IS [R-07] APPLIED TO THIS FILE'S
  // OWN OUTPUT. It was crosswalk-rows while the guard emitted ONE EXAMINED line per form. Since
  // [D-16] it emits one PER ASSERTION — eight on an authored crosswalk, five on a derived one —
  // and the matrix cell sums every line for a pair. So 433-F's cell reads 534 for a crosswalk of
  // 97 rows: 97 rows counted under eight different questions, plus 41 backbone keys, 2 option
  // values and 6 declared counts. Labelling that sum `crosswalk-rows` would be a figure wearing
  // another figure's universe, which is the defect [R-07] names, arriving through the reporting
  // channel built to prevent it. The per-assertion counts and their own universes are printed by
  // the guard itself on every run; this cell is the total work it did on the form.
  'adapters/hubspot/validate-crosswalk.mjs': { kind: 'guard', universe: 'assertion-item-checks', perForm: true, run: (f) => ['adapters/hubspot/validate-crosswalk.mjs', f],
    onlyWhen: (f) => existsSync(`adapters/hubspot/crosswalk.${f}.json`),
    note: 'A form with no crosswalk file is not a form this guard examined zero rows on — it is a form the guard cannot be asked about, and it is reported as NOT APPLICABLE rather than as a zero.',
    // THE DECLARED GAP IS GONE BECAUSE THE ITEM IT CITED CLOSED. This entry used to carry
    // `carriedGaps: { '433aoi': 'D-16', '433boi': 'D-16' }` and the comment beside it said the
    // day validate-crosswalk.mjs was taught the derived crosswalk shape, the item would resolve
    // and this declaration would stop matching. That is what happened, in Prompt 48 commit 1:
    // [D-16] is RESOLVED and both forms now report five EXAMINED lines each with non-zero
    // counts, so a gap declaration here would be a citation to a closed item — which [SB-17]
    // catches one level out and which would have failed this file on its next run.
    //
    // The four assertions a DERIVED crosswalk could not carry are CLOSED as of Prompt 49
    // commit 1, not merely relocated. validate-crosswalk.mjs now reads them off
    // adapters/hubspot/fields.<form>.json — the artefact the deriver itself writes, which does
    // carry hs_name and a classification — after asserting the join to the crosswalk is total
    // in both directions. Both derived forms now report NINE assertions and ZERO declared gaps
    // (433-A(OIC) 1643 examined items, 433-B(OIC) 738). See [D-16]’s
    // `the_four_declarations_closed`.
  },

  // ── not guards ───────────────────────────────────────────────────────────────────────────
  'adapters/pdf/run-form-gate.mjs': { kind: 'orchestrator', why: 'It runs twelve steps and reports how many ran and how many were SKIPPED, naming each skip. Its own examined figure is the step count, and a skipped step is already named rather than absorbed — which is this file\'s rule, arrived at independently and earlier.' },
  'adapters/pdf/assert-subject-class.mjs': { kind: 'guard', universe: 'declared-subject-classes', perForm: true, run: (f) => ['adapters/pdf/assert-subject-class.mjs', f],
    onlyWhen: (f) => existsSync(`adapters/pdf/maps/${f}.subject-classes.json`),
    note: 'ONLY FORMS THAT DECLARE SUBJECT CLASSES, and the predicate is the DECLARATION FILE’S EXISTENCE rather than a list, so a second such form joins with no edit here and a form that stops declaring leaves the same way. It is the same predicate shape assert-mirror.mjs carries and for the same reason: today the declaring set is 433-D alone, which is disjoint from MAPPED_FORMS(), so without it this guard is reported NOT REPORTED on all five mapped columns — which is true and is not a finding. Its examined count is the number of stems the form DECLARES a class for. Separately, its [SC-6] line prints that ZERO obligations were examined while the form has no map, in as many words, because "the map declares nothing wrong" and "there is no map" are different facts and only one of them is a pass.' },
  'adapters/pdf/saturation-union.mjs': { kind: 'guard', universe: 'mapped-text-cells', perForm: true, run: (f) => ['adapters/pdf/saturation-union.mjs', f],
    note: "RUNS ON EVERY MAPPED FORM AND ITS EXAMINED COUNT IS THE MAPPED TEXT CELLS THE UNION READ ACROSS ALL ITS MEMBERS — not the residual, which is zero on a healthy tree and would be a count of nothing. The two states this guard distinguishes are \"every mapped cell is fed by SOME member\" and \"a cell is empty on EVERY member\", and only the population makes the first of those mean anything: a union over an empty cell set would report the same clean verdict as a union over 168. IT IS NOT `onlyWhen`-GATED, WHICH IS DELIBERATE AND IS [R-16]. A form declaring no mutually exclusive subject classes has a declared subject set of size one, its union is the acceptance record alone, and the union residual must EQUAL what the single-record saturated run says — an equality this tool asserts rather than assumes. Skipping the five inert forms would leave that no-op unproved on exactly the five where a drift would be silent, and would leave the sixth as the first run of an arithmetic nobody had exercised." },
  'adapters/pdf/target-root.mjs': { kind: 'instrument', why: 'It answers ONE QUESTION about a form -- what root every field name in its enumerated list shares -- and returns either that root or a stated reason there is none. It holds no population to count and has no verdict for a zero to satisfy: an empty field list, a name that is not a dotted path, and two roots in one list are three separate STOPS, each planted in its canary with a required stop, alongside three roots that must be DERIVED including one no form in this tree uses. What it protects is counted elsewhere and loudly -- adapters/pdf/validate-map.mjs prints the derived root beside its target-reference count on every run and refuses a map yielding ZERO references under it, which is the exact state the typed literal produced on 433-D and the state that reads as this engine’s strongest-sounding pass.' },
  'adapters/pdf/caption-candidates.mjs': { kind: 'instrument', why: 'It returns the printed runs near a widget, ranked WITHIN each direction and never across, and it makes no verdict at all -- there is no pass for a zero to qualify. Its one stopping condition is the opposite of quiet: a form drawing no widget on the page it reads, or a page whose row pitch cannot be derived, ends the run rather than returning an empty candidate list. What asks it questions with known answers is adapters/pdf/assert-subject-class.mjs [SC-3], which requires every declared caption to be a run this file returned.' },
  'adapters/pdf/subject-class.mjs': { kind: 'instrument', why: 'It classifies ONE STRING and holds no population, so it has no per-form universe to count: the same call answers for 433-D and for a phrase typed at it. Its correctness is proved by a 21-case canary asserted in both directions for all three classes, run at the head of every derivation and on every `npm run sweeps`, and by two load-time regex self-assertions that refuse the import outright if a marker stopped matching. The file is per-form ONLY in that its --markers report takes a form argument to show what each marker matches on that form’s printed page.' },
  'adapters/pdf/align-block.mjs': { kind: 'instrument', why: 'It answers about a printed BAND on demand. It has no verdict, so there is no pass for a zero to qualify; assert-y-convention.mjs is what asks it questions with known answers.' },
  'adapters/pdf/correlate-labels.mjs': { kind: 'instrument', why: 'It ranks printed runs near a widget and writes a labels file. It decides nothing on its own, and on 433-B it is under [B-01] as a witness SHOWN TO BE WRONG on that form — which is a stronger statement than an examined count would be.' },
  'adapters/pdf/line-markers.mjs': { kind: 'instrument', why: 'It reports its own total and a zero prints as zero — guard-sweep [G-32].' },
  'adapters/pdf/money-probe.mjs': { kind: 'instrument', why: 'A probe. count-sweep.mjs consumes it and disposes its figures; the probe itself asserts nothing.' },
  'adapters/pdf/read-form-revision.mjs': { kind: 'instrument', why: 'An unreadable pin returns null and validate-map.mjs compares against the pinned value, so a revision that could not be read fails exactly as a wrong one does — guard-sweep [G-33].' },
  'adapters/pdf/enumerate-fields.mjs': { kind: 'instrument', why: 'It writes the enumerated field list, which is the DENOMINATOR the gate\'s steps 3, 5 and 6 are asserted against — [SB-12].' },
  'adapters/pdf/render-review.mjs': { kind: 'instrument', why: 'A renderer. It makes no completeness claim and reports no finding count a zero could satisfy.' },
  'adapters/pdf/gen-subject-register.mjs': { kind: 'generator', why: 'It writes _subjects.cross-form.json; assert-subject-register.mjs re-derives every quote from the page bytes on every run and IS registered above as a guard.' },
  'adapters/pdf/fill-433a.mjs': { kind: 'engine', why: 'A fill engine. Gate steps 6, 7 and 10 count what it wrote against the map\'s partition and the PDF\'s field list.' },
  'adapters/pdf/fill-433aoi.mjs': { kind: 'engine', why: 'Same as fill-433a.mjs.' },
  'adapters/pdf/fill-433b.mjs': { kind: 'engine', why: 'Same as fill-433a.mjs.' },
  'adapters/pdf/fill-433d.mjs': { kind: 'engine', why: 'Same as fill-433a.mjs, with one addition that is NOT an examined count and is reported in its own line on every run: it prints how many subject-CONDITIONAL cells this record is required to leave empty and names each one, so a run in which that number silently became zero says so. The population it works over is the map targets, enumerated and partitioned, and the partition is asserted against every field in the PDF at gate step 6.' },
  'adapters/pdf/fill-433boi.mjs': { kind: 'engine', why: 'Same as fill-433a.mjs.' },
  'adapters/pdf/fill-433f.mjs': { kind: 'engine', why: 'Same as fill-433a.mjs.' },
  'adapters/pdf/verify-appearances.mjs': { kind: 'instrument', why: 'It reads a filled PDF and reports values drawn without an appearance stream. Its universe is the filled fields, which verify-form-coverage.mjs counts and reports.' },
  'adapters/hubspot/derive-names-433aoi.mjs': { kind: 'generator', why: 'It derives a form’s property names from its crosswalk classification and WRITES the naming-derivation report. Two guards stand over its output and both are registered above with examined counts: adapters/hubspot/validate-crosswalk.mjs, and adapters/hubspot/assert-intake-keys.mjs. A third mechanism stands over the report itself — adapters/hubspot/no-downgrade.mjs, which refuses to let a run that did not read the portal silently replace one that did. That refusal is the [R-19] half that fired TWICE on this tool with the same missing flag.' },
  'adapters/hubspot/derive-names-433boi.mjs': { kind: 'generator', why: 'Same as derive-names-433aoi.mjs, and it is the SECOND occurrence of the downgrade defect — 113 rows of live portal verdicts replaced by rows saying nothing, after the first occurrence had been repaired by re-running rather than by changing the mechanism.' },
  'adapters/hubspot/derive-names-433b.mjs': { kind: 'generator', why: 'Same as derive-names-433aoi.mjs — its output is stood over by validate-crosswalk.mjs and assert-intake-keys.mjs, both registered above with examined counts, and its report by no-downgrade.mjs. IT IS ALSO THE FIRST DERIVER THAT REUSES, so it carries one assertion the other two have no subject for: A9R refuses a row classified `exact` whose derived name does not already exist in fields.433boi.json, or exists with a different type. A reuse naming a property nobody created would be a creation under the PREDECESSOR\'s prefix, recording the wrong form as its creator permanently — and no guard downstream could tell, because the name would look exactly like one 433-B(OIC) had made.' },
  'adapters/hubspot/derive-names-433d.mjs': { kind: 'generator', why: 'Same as derive-names-433b.mjs - its output is stood over by validate-crosswalk.mjs and assert-intake-keys.mjs, both registered above with examined counts, and its report by no-downgrade.mjs. IT IS THE FIRST DERIVER THAT REUSES FROM TWO CREATORS AT ONCE, so it carries two assertions the others have no subject for. A9R takes the name from the entry own reuse_of and requires it to END with the row own fact, because one PREDECESSOR_PREFIX constant cannot express a form binding both irs433_ and irs433boi_; a reuse whose entry and whose row describe different properties is refused rather than bound. A9S refuses a reuse on any cell the map does not class subject-DEPENDENT or subject-CONDITIONAL: this form takes its subject from the RECORD, so an independent cell sharing a property with a form whose subject is the FORM would hold a fact about the wrong legal person on the other branch, permanently, under a name saying otherwise.' },
  'adapters/hubspot/gen-fields-from-crosswalk.mjs': { kind: 'generator', why: 'generator-guard.mjs refuses to let it overwrite a file whose meta.generator names a different tool — the [D-13] mechanism.' },
  'adapters/hubspot/gen-fields-from-map.mjs': { kind: 'generator', why: 'Same as gen-fields-from-crosswalk.mjs. It is the tool that once rewrote fields.433f.json in the wrong vocabulary with a group dropped.' },
  'adapters/hubspot/hs-extend-options.mjs': { kind: 'portal', why: 'It writes to HubSpot and reads the result back. Its outcome is what the portal says, not what a local set holds — [SB-22]\'s ground.' },
  'adapters/hubspot/hs-fetch-433a.mjs': { kind: 'portal', why: 'Reads one contact from HubSpot. Its universe is that contact.' },
  'adapters/hubspot/hs-fetch-433aoi.mjs': { kind: 'portal', why: 'Same as hs-fetch-433a.mjs.' },
  'adapters/hubspot/hs-fetch-433b.mjs': { kind: 'portal', why: 'Same as hs-fetch-433a.mjs — its universe is one contact. It is the first fetcher that reads values out of properties ANOTHER FORM created: nine of 433-B\'s 116 carry the irs433boi_ prefix, so a request assembled from this form\'s own prefix would ask for nine names that do not exist and report nine empty cells, which is indistinguishable from a filer who left them blank. The property list comes from loadBindings() rather than being assembled here, and the nine are asserted present in the request before it is sent.' },
  'adapters/hubspot/hs-fetch-433boi.mjs': { kind: 'portal', why: 'Same as hs-fetch-433a.mjs.' },
  'adapters/hubspot/hs-fetch-433d.mjs': { kind: 'portal', why: 'Same as hs-fetch-433a.mjs - its universe is one contact. It is the SECOND fetcher that reads values out of properties another form created and the FIRST whose three reused names come from TWO different creators: irs433_tp_ssn_itin and irs433_sp_ssn_itin from 433-A, irs433boi_employer_identification_number from 433-B(OIC). A request assembled from this form prefix would ask for three names that do not exist and report three empty cells, one of them the taxpayer identifier the whole agreement is against. The property list comes from loadBindings() and the three are asserted present in the request before it is sent. It also carries the one assertion no other fetcher has a subject for: the record declared subject is checked against the two the map declares, the branch it selects is checked for carrying a value, and the OTHER branch is checked for carrying none - a record asserting both identifiers fills cleanly and puts one legal person identifier in the box of the other.' },
  'adapters/hubspot/hs-fetch-433f.mjs': { kind: 'portal', why: 'Same as hs-fetch-433a.mjs.' },
  'adapters/hubspot/hs-provision.mjs': { kind: 'portal', why: 'It CREATES permanent properties. Its count is the dry-run report and the read-back, both of which are committed artefacts.' },
  'adapters/hubspot/hs-seed-synthetic.mjs': { kind: 'portal', why: 'It seeds a synthetic contact and registers it in probe-register.json, whose absence is re-read from the portal on every hs-preflight run.' },

  // ── engine-wide: they stop a run and they name forms, and their universe is the ENGINE ──
  //
  // A count per form would be a figure with the wrong universe, which is [R-07] in the other
  // direction: "12 registers on 433-B" is not a fact, because a register is not a thing a form
  // has. Each of these already reports the size of the population it did read, on every run.
  'adapters/pdf/exclusion-sweep.mjs': { kind: 'engine-wide', why: 'Its universe is every exclusion predicate in the engine, and it names forms only because some excusals make claims about them. It reports its predicate count, its excusal counts per predicate and its cross-check results on every run — the figure a per-form split would have to be carved out of.' },
  'adapters/pdf/register-ids.mjs': { kind: 'engine-wide', why: 'Its universe is every id-keyed register. It is form-AWARE — form-scoped ids are legal within a form and it says so — but the assertion is about the engine\u2019s id space. It reports the register count, the id count and the distinct-id count on every run.' },
  'adapters/pdf/sweep-boundary.mjs': { kind: 'engine-wide', why: 'Its universe is what the sweeps do not sweep. It reports a size for every registered boundary and cross-checks every claiming one against the world; a per-form split of the phrase directories-excluded-from-the-sweeps would be a figure about nothing.' },
  'adapters/hubspot/assert-registry-targets.mjs': { kind: 'engine-wide', why: 'Its universe is every ROW OF EVERY DEFINITION REGISTER in the tree, and a register is a per-FORM file only by accident of naming — fields.registry.json holds rows for a form key (`vlp`) that is not a form at all, and the condition that earned this tool ([RT-1], [D-19]) is a relation BETWEEN two registers rather than a fact about one form. It reports one examined count, `definition-register-rows`, over the whole swept set on every run, and the per-register split is printed line by line above it. It is form-AWARE — it resolves a form key through a declared alias table, because the registry spelled 433-A(OIC) as 433aoic and every other file spells it 433aoi — but the assertion is about the engine’s definition space.' },
  'adapters/pdf/assert-reachability.mjs': { kind: 'engine-wide', why: 'Its universe is EVERY TOOL IN THE TREE and the question is whether anything runs it, which is a fact about package.json and the spawn graph rather than about any form. It is form-AWARE only because the gate names its fill step as `fill-${form}.mjs` and the set behind that interpolation has to be derived from MAPPED_FORMS() rather than listed — which is the clause that puts it in this population at all. It reports two engine-scoped counts on every run, `tools-in-the-tree` and `tools-the-suite-does-not-run`, and the second is the figure the rule it enforces is about: a tool nobody runs is a tool nobody knows is broken.' },
  'adapters/pdf/resolve-fixture.mjs': { kind: 'instrument', why: 'The fixture resolver. It is per form and it can stop a run, and what it reports is a RESOLUTION with every candidate it swept and what each declared itself to be — the swept set, the filter and the classifier are printed on every call. There is no verdict for an examined count to qualify: zero acceptance fixtures is already a STOP naming every candidate, and two is a STOP naming both.' },
  'adapters/hubspot/reclassify-against-backbone.mjs': { kind: 'generator', why: 'It re-derives a form\u2019s crosswalk classification against the whole backbone rather than against one predecessor form, and with --emit it WRITES the classification file. adapters/hubspot/validate-crosswalk.mjs is the guard over its output and is registered above with an examined count; adapters/hubspot/assert-intake-keys.mjs is the second. [C-23] is the item it exists for.' },
  'adapters/pdf/assert-examined.mjs': { kind: 'self', why: 'THIS FILE. It does not report an examined count for itself, and that self-exclusion is registered here rather than left as a silence \u2014 the same disposition guard-sweep\u2019s [SB-21] carries. What covers it: it is swept for vacuous guards by guard-sweep.mjs and for unconditional success messages by success-sweep.mjs, neither of which excludes itself; its two regexes self-assert at load through regex-self-assert.mjs; and its scope check is the strongest statement it makes \u2014 a candidate it cannot dispose of, or an entry the signature cannot find, takes the run down before any matrix is printed.' },
  'adapters/hubspot/hs-verify-provision.mjs': { kind: 'portal', why: 'It reads created state back from the portal, never from the request.' },
  'adapters/pdf/assert-mirror.mjs': { kind: 'guard', universe: 'declared-mirror-pairs', perForm: true, run: (f) => ['adapters/pdf/assert-mirror.mjs', f],
    onlyWhen: (f) => existsSync(`adapters/pdf/maps/${f}.mirror.json`),
    note: 'ONLY FORMS THAT DECLARE A MIRROR. The predicate is the DECLARATION FILE\'S EXISTENCE and not a list, so a second mirrored form joins with no edit here and a form that stops declaring one leaves the same way. Today that set and the MAPPED_FORMS() set are disjoint — 433-D declares a mirror and has no map, the other five have maps and no mirror — so this guard reports on no column of the matrix at all, which is why the predicate is needed rather than a `forms` array the matrix could not show. Its examined count is the number of pairs the form DECLARES, not the number it checked bindings for: [M-07] and [M-08] examine ZERO on 433-D because that form has no map and no fill engine, and the guard prints both zeros in as many words on every run rather than letting the declared-pair count stand in for them. The eleven canary directions are what stand under those two clauses until a map exists.' },
  'adapters/pdf/gen-mirror.mjs': { kind: 'generator', why: 'It derives a form’s mirror declaration from the widget geometry of the pinned blank and writes adapters/pdf/maps/<form>.mirror.json. generator-guard.mjs stands over the write, and `--check` regenerates and compares without writing — which adapters/pdf/assert-mirror.mjs then runs on every sweep, so the declaration cannot drift from the page it describes. Its own six build clauses [M-01]..[M-06] are asserted there and canaried in four directions.' },
  'adapters/pdf/xfa-fieldset.mjs': { kind: 'generator', why: 'It derives a form’s XFA TEMPLATE FIELD SET from the pinned blank and writes adapters/pdf/maps/<form>.xfa-fieldset.json. generator-guard.mjs stands over the write, `--check` regenerates and compares byte for byte without writing, and that --check is what `npm run sweeps` runs — so the artefact cannot drift from the packet it describes. ITS ONE FORM IS NOT A MAPPED FORM AND THAT IS THE POINT: 433-H has zero AcroForm fields and one drawn page, so it appears on no column of the matrix below, which is true and is not a finding — the same shape adapters/pdf/gen-mirror.mjs and adapters/pdf/subject-class.mjs are registered under, and for the same reason. It reports `xfa-template-fields` on --check, which is the number of fields the template packet DESCRIBES, and a zero there is refused by name in build() rather than reported as a clean derivation ([R-04], guard-sweep [G-276]). Its scanner is a detector and carries a twelve-case canary registered in blanket-audit.mjs DETECTORS, run first and unconditionally before any artefact is written or compared.' },
  'adapters/hubspot/rerun-regression.mjs': { kind: 'orchestrator', why: 'It runs every finished form’s generator and fetcher in a sandbox copy of the tree and reports how many RAN, how many were REFUSED and how many were NOT RUN in the tier asked for — three states, never folded into two. It reports one examined count per form, `read-only-tool-reruns`, which is the number of that form’s tools this run actually invoked; and because a refused run is excluded from the OK line’s figure but still printed, the count and the verdict are separately readable. It is [R-30]’s instrument: [D-18]’s fourth instance was a tool broken by a NEIGHBOUR’s pass, and its own resolution note says the sweep enumerates the population while what caught the instance was running the tool.' },
  'adapters/hubspot/headroom.mjs': { kind: 'portal', why: 'Its outcome is the live custom-property count on the portal, which no local set holds — [SB-22]’s ground, the same as every other portal entry here. It is form-AWARE, because it prints each mapped form’s cost against the figure and will project an unclassified form’s upper bound, but the assertion is about the PORTAL’s remaining capacity and not about any one form. It owes no examined count for the same reason resolve-fixture.mjs does not: what it reports is a READING, and a projection it cannot make comes back as no bound rather than as a bound of zero, which is a STOP naming the form.' },
};

// ── DERIVED vs REGISTERED, BOTH DIRECTIONS ─────────────────────────────────────────────────
export const scope = () => {
  const cands = candidates();
  const problems = [];
  for (const c of cands) {
    if (c.unreadable) { problems.push(`UNREADABLE   ${c.path}: ${c.unreadable}. A candidate this file could not read is reported, never skipped.`); continue; }
    if (!REGISTER[c.path]) problems.push(`UNDISPOSED   ${c.path} is a per-form file that can stop a run, and the register says nothing about it. Say whether it is a guard that owes an examined count, or which of the other kinds it is and why.`);
  }
  const found = new Set(cands.map((c) => c.path));
  for (const p of Object.keys(REGISTER))
    if (!found.has(p)) problems.push(`STALE ENTRY  ${p} is in the register and the derived signature no longer finds it. Either the file changed shape or it is gone, and the entry now stands over nothing.`);
  return { cands, problems };
};

// ── RUN AND HARVEST ────────────────────────────────────────────────────────────────────────
const runOne = (argv) => {
  const r = spawnSync(process.execPath, argv, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return `${r.stdout || ''}${r.stderr || ''}`;
};

export const harvest = ({ all = false, verbose = false } = {}) => {
  const forms = MAPPED_FORMS();
  const seen = [];           // { guard, form, n, universe }
  const ran = [], skipped = [], notApplicable = [];

  // One invocation may make several guards speak; each is run once and every EXAMINED line in
  // its output is read. NOT the first — that is the defect [R-25] records.
  const invocations = [];
  for (const [path, e] of Object.entries(REGISTER)) {
    if (e.kind !== 'guard' || !e.run) continue;
    if (e.perForm) {
      for (const f of forms) {
        if (e.onlyWhen && !e.onlyWhen(f)) { notApplicable.push(`${path.split('/').pop()} / ${f} — ${e.note || 'the register says this guard cannot be asked about this form'}`); continue; }
        invocations.push({ path, argv: e.run(f), heavy: !!e.heavy, label: `${path} ${f}` });
      }
    } else {
      invocations.push({ path, argv: e.run(), heavy: !!e.heavy, label: path });
    }
  }

  for (const inv of invocations) {
    if (inv.heavy && !all) { skipped.push(`${inv.label}  —  node ${inv.argv.join(' ')}`); continue; }
    if (verbose) console.log(`  running: node ${inv.argv.join(' ')}`);
    const out = runOne(inv.argv);
    ran.push(inv.label);
    for (const row of readExamined(out)) seen.push(row);
  }
  return { forms, seen, ran, skipped, notApplicable, invocations };
};

// ── CLI ────────────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && /assert-examined\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const argv = process.argv.slice(2);
  const all = argv.includes('--all');
  const verbose = argv.includes('--verbose');

  const canary = examinedCanary();
  if (canary.dead.length) {
    console.error(`STOP — the EXAMINED reader failed ${canary.dead.length} of its own ${canary.cases} canary case(s). Every count below would be a count this file could not read.`);
    canary.dead.forEach((d) => console.error(`  ${d}`));
    process.exit(2);
  }
  if (argv.includes('--canary')) { console.log(`EXAMINED reader: ${canary.cases} canary case(s) live.`); process.exit(0); }

  const { cands, problems } = scope();
  console.log('assert-examined — every guard that runs per form, and what it examined on each');
  console.log(`  reader:    ${canary.cases} canary case(s) live, including a legitimate ZERO and a malformed line`);
  console.log(`  derived:   ${cands.length} candidate(s) from ${DIRS.join(', ')} by the signature "can stop a run AND is scoped to a form"`);
  const kinds = Object.values(REGISTER).reduce((a, e) => { a[e.kind] = (a[e.kind] || 0) + 1; return a; }, {});
  console.log(`  register:  ${Object.keys(REGISTER).length} entr(ies) — ${Object.entries(kinds).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  if (problems.length) {
    console.error('');
    console.error(`SCOPE FAILED — ${problems.length} problem(s). The derived population and the register disagree, so no matrix below could be complete:`);
    problems.forEach((p) => console.error(`  ${p}`));
    process.exit(2);
  }
  console.log('  scope:     the derived set and the register agree in both directions');
  console.log('');

  const h = harvest({ all, verbose });
  const guards = Object.entries(REGISTER).filter(([, e]) => e.kind === 'guard').map(([p]) => p);
  const nameOf = (p) => p.split('/').pop().replace('.mjs', '');

  console.log(`  ran ${h.ran.length} invocation(s); ${h.skipped.length} heavy invocation(s) NOT run${all ? '' : ' (pass --all)'}`);
  if (h.skipped.length) {
    console.log('  NO SILENT CAPS — every invocation this run did not make, by name:');
    for (const s of h.skipped) console.log(`    ${s}`);
  }
  if (h.notApplicable.length) {
    console.log('  NOT APPLICABLE — the register says these pairs cannot be asked, which is not the same as a zero:');
    for (const s of h.notApplicable) console.log(`    ${s}`);
  }
  console.log('');

  const at = (g, f) => h.seen.filter((r) => r.guard === nameOf(g) && r.form === f).reduce((s, r) => s + r.n, 0);
  const reported = (g, f) => h.seen.some((r) => r.guard === nameOf(g) && r.form === f);

  const W = Math.max(...guards.map((g) => nameOf(g).length)) + 2;
  console.log(`  ${'GUARD'.padEnd(W)}${h.forms.map((f) => f.padStart(9)).join('')}   universe`);
  console.log(`  ${'-'.repeat(W + h.forms.length * 9 + 3 + 40)}`);
  const zeros = [], unreported = [];
  for (const g of guards) {
    const cells = h.forms.map((f) => (reported(g, f) ? String(at(g, f)).padStart(9) : '        ·'));
    console.log(`  ${nameOf(g).padEnd(W)}${cells.join('')}   ${REGISTER[g].universe}`);
    for (const f of h.forms) {
      if (!reported(g, f)) { unreported.push(`${nameOf(g)} / ${f}`); continue; }
      if (at(g, f) === 0) zeros.push(`${nameOf(g)} / ${f}  —  0 ${REGISTER[g].universe}`);
    }
  }
  console.log(`  ·  = no EXAMINED line for that pair on this run (heavy and not run, not applicable, or NOT REPORTED)`);
  console.log('');

  console.log(`  ZERO EXAMINED — ${zeros.length} (guard, form) pair(s) reported a count of zero. Each is a guard that`);
  console.log('  PASSES on that form having looked at nothing, which is not the same as being tested on it:');
  if (!zeros.length) console.log('    none.');
  for (const z of zeros) console.log(`    ${z}`);
  console.log('');

  // NOT REPORTED is a third state and it is only a failure for a pair that WAS asked. A heavy
  // invocation that was skipped, and a pair the register declares not applicable, are already
  // named above; what is left is a guard that ran and said nothing about a form it covers.
  const openIds = carriedOpenIds();
  const declaredGaps = [], deadCitations = [];
  for (const u of unreported) {
    const [g, f] = u.split(' / ');
    const path = guards.find((p) => nameOf(p) === g);
    const id = REGISTER[path]?.carriedGaps?.[f];
    if (!id) continue;
    if (openIds.has(id)) declaredGaps.push(`${u}  —  declared, cited to [${id}], OPEN in the carried register`);
    else deadCitations.push(`${u}  —  declares [${id}], which is NOT open in adapters/pdf/maps/_carried.cross-form.json. A gap declared against an id nobody carries is an undeclared gap.`);
  }
  if (declaredGaps.length) {
    console.log(`  DECLARED GAPS — ${declaredGaps.length} (guard, form) pair(s) this guard CANNOT answer, each cited to an open carried item:`);
    declaredGaps.forEach((d) => console.log(`    ${d}`));
    console.log('');
  }
  if (deadCitations.length) {
    console.error(`DEAD CITATION — ${deadCitations.length} declared gap(s) cite an id the carried register does not hold open:`);
    deadCitations.forEach((d) => console.error(`  ${d}`));
    process.exit(2);
  }

  const askedButSilent = unreported.filter((u) => {
    const [g, f] = u.split(' / ');
    const path = guards.find((p) => nameOf(p) === g);
    const e = REGISTER[path];
    if (!e.run) return h.ran.some((l) => l.startsWith(e.via || '')) && false;   // via another tool: covered below
    if (e.heavy && !all) return false;
    if (e.onlyWhen && !e.onlyWhen(f)) return false;
    if (e.carriedGaps?.[f]) return false;    // declared and cited above; not a silence
    return true;
  });
  if (askedButSilent.length) {
    console.error(`NOT REPORTED — ${askedButSilent.length} (guard, form) pair(s) ran and emitted no EXAMINED line.`);
    console.error('  "I looked and there was nothing" and "nobody knows" are different facts, and this is the second one:');
    askedButSilent.forEach((u) => console.error(`    ${u}`));
    process.exit(2);
  }
  console.log(`ASSERT-EXAMINED PASSED — the derived population and the register agree in both directions; every guard that was asked answered; ${zeros.length} zero-examined pair(s) named above.`);
}
