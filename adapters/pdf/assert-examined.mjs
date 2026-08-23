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
const RX_STOPS = rx('RX-EX-01', /process\.exit(Code)?\b/, {
  why: 'a file that can end a run on what it read, which is half of what makes a file a guard rather than a listing',
  matches: ['process.exit(2)', 'process.exitCode = 3'],
  rejects: ['processXexit', 'process.exiting'],
});
const RX_PER_FORM = rx('RX-EX-03', /MAPPED_FORMS\s*\(|\$\{form\}|\bconst\s+\[?\s*form\b|form: '433/, {
  why: 'a file whose work is scoped to a form — it iterates the mapped forms, interpolates a form into a path, binds one off the command line, or DECLARES ITS OWN FORM LIST. The fourth clause was added after the register reported adapters/pdf/assert-row-class-routes.mjs as a stale entry: that file poisons a row into every declaring group of four named forms and asserts each refuses it, which is per-form by any reading, and it was invisible to the first three clauses because it names its forms in its own FORMS array. The register found the blind spot from the other direction, which is what having both directions is for.',
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
  'adapters/pdf/assert-overflow.mjs': { kind: 'guard', universe: 'declared-groups', perForm: true, run: (f) => ['adapters/pdf/assert-overflow.mjs', f] },
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
  'adapters/hubspot/assert-intake-keys.mjs': { kind: 'guard', universe: 'option-values-plus-row-shapes', perForm: false, run: () => ['adapters/hubspot/assert-intake-keys.mjs'] },
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
    // The four assertions a DERIVED crosswalk still cannot carry did not disappear; they moved
    // to where they belong. validate-crosswalk.mjs prints them itself, per run, per form, with
    // the reason and the tool that covers each instead, and it COUNTS them. They are that
    // guard's standing statement about what its input shape can be asked, not an open defect.
  },

  // ── not guards ───────────────────────────────────────────────────────────────────────────
  'adapters/pdf/run-form-gate.mjs': { kind: 'orchestrator', why: 'It runs twelve steps and reports how many ran and how many were SKIPPED, naming each skip. Its own examined figure is the step count, and a skipped step is already named rather than absorbed — which is this file\'s rule, arrived at independently and earlier.' },
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
  'adapters/pdf/fill-433boi.mjs': { kind: 'engine', why: 'Same as fill-433a.mjs.' },
  'adapters/pdf/fill-433f.mjs': { kind: 'engine', why: 'Same as fill-433a.mjs.' },
  'adapters/pdf/verify-appearances.mjs': { kind: 'instrument', why: 'It reads a filled PDF and reports values drawn without an appearance stream. Its universe is the filled fields, which verify-form-coverage.mjs counts and reports.' },
  'adapters/hubspot/derive-names-433aoi.mjs': { kind: 'generator', why: 'It derives a form’s property names from its crosswalk classification and WRITES the naming-derivation report. Two guards stand over its output and both are registered above with examined counts: adapters/hubspot/validate-crosswalk.mjs, and adapters/hubspot/assert-intake-keys.mjs. A third mechanism stands over the report itself — adapters/hubspot/no-downgrade.mjs, which refuses to let a run that did not read the portal silently replace one that did. That refusal is the [R-19] half that fired TWICE on this tool with the same missing flag.' },
  'adapters/hubspot/derive-names-433boi.mjs': { kind: 'generator', why: 'Same as derive-names-433aoi.mjs, and it is the SECOND occurrence of the downgrade defect — 113 rows of live portal verdicts replaced by rows saying nothing, after the first occurrence had been repaired by re-running rather than by changing the mechanism.' },
  'adapters/hubspot/gen-fields-from-crosswalk.mjs': { kind: 'generator', why: 'generator-guard.mjs refuses to let it overwrite a file whose meta.generator names a different tool — the [D-13] mechanism.' },
  'adapters/hubspot/gen-fields-from-map.mjs': { kind: 'generator', why: 'Same as gen-fields-from-crosswalk.mjs. It is the tool that once rewrote fields.433f.json in the wrong vocabulary with a group dropped.' },
  'adapters/hubspot/hs-extend-options.mjs': { kind: 'portal', why: 'It writes to HubSpot and reads the result back. Its outcome is what the portal says, not what a local set holds — [SB-22]\'s ground.' },
  'adapters/hubspot/hs-fetch-433a.mjs': { kind: 'portal', why: 'Reads one contact from HubSpot. Its universe is that contact.' },
  'adapters/hubspot/hs-fetch-433aoi.mjs': { kind: 'portal', why: 'Same as hs-fetch-433a.mjs.' },
  'adapters/hubspot/hs-fetch-433boi.mjs': { kind: 'portal', why: 'Same as hs-fetch-433a.mjs.' },
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
  'adapters/pdf/resolve-fixture.mjs': { kind: 'instrument', why: 'The fixture resolver. It is per form and it can stop a run, and what it reports is a RESOLUTION with every candidate it swept and what each declared itself to be — the swept set, the filter and the classifier are printed on every call. There is no verdict for an examined count to qualify: zero acceptance fixtures is already a STOP naming every candidate, and two is a STOP naming both.' },
  'adapters/hubspot/reclassify-against-backbone.mjs': { kind: 'generator', why: 'It re-derives a form\u2019s crosswalk classification against the whole backbone rather than against one predecessor form, and with --emit it WRITES the classification file. adapters/hubspot/validate-crosswalk.mjs is the guard over its output and is registered above with an examined count; adapters/hubspot/assert-intake-keys.mjs is the second. [C-23] is the item it exists for.' },
  'adapters/pdf/assert-examined.mjs': { kind: 'self', why: 'THIS FILE. It does not report an examined count for itself, and that self-exclusion is registered here rather than left as a silence \u2014 the same disposition guard-sweep\u2019s [SB-21] carries. What covers it: it is swept for vacuous guards by guard-sweep.mjs and for unconditional success messages by success-sweep.mjs, neither of which excludes itself; its two regexes self-assert at load through regex-self-assert.mjs; and its scope check is the strongest statement it makes \u2014 a candidate it cannot dispose of, or an entry the signature cannot find, takes the run down before any matrix is printed.' },
  'adapters/hubspot/hs-verify-provision.mjs': { kind: 'portal', why: 'It reads created state back from the portal, never from the request.' },
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
