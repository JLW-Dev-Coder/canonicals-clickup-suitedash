// EVERY "PROVED TO FIRE" CLAIM IN THIS TREE, JUDGED AGAINST [R-28].
//
// CLI:  node adapters/pdf/assert-firing-proofs.mjs [--verbose]
// Exit: 0 = every registered claim is disposed, every record meets the standard, canary live
//       2 = a claim is undisposed, a record fails the standard, a record is unreadable, the
//           derived population and the register disagree, or the canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS FILE IS FOR
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// adapters/pdf/firing-proofs.mjs holds the standard and judges ONE break entry. This file holds
// the POPULATION: every claim in this tree that some guard was demonstrated to fire, derived
// from the tree in both directions against a register, so that a proof cannot report PROVED by
// existing and a claim cannot disappear by not being written down.
//
// TWO CLASSES, AND THEY ARE DIFFERENT OBJECTS.
//
//   BREAK PROOF     an input on disk is mutated, a real tool is SPAWNED, and the claim is that a
//                   named declaration fired. The tool runs many steps and the break is the act
//                   most likely to trip an earlier one, so [R-28] applies in full: the step, the
//                   line, the verdict, the other lines, and it stops firing.
//
//   IN-PROCESS      a detector plants a defect in a synthetic input INSIDE ITS OWN PROCESS and
//   CANARY          asserts it is found. There is no multi-step run and therefore no "step" to
//                   have reached: the analogue of [FS-1] is that the planted defect is found BY
//                   NAME rather than counted, and the analogue of [FS-3] is that a conforming
//                   input is still accepted. Both are already the standing convention here, and
//                   this class is declared and enumerated rather than re-judged — an exclusion
//                   is a claim ([R-14]), so its members are named and derived, never sampled.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE AUDIT THIS FILE LANDED WITH
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Two break proofs existed when [R-28] was ruled, both on 433-B, and they were not equivalent:
//
//   slice 3   asserts the step, the line and the other line. It IS the standard; the standard
//             was written from it. Its own header records that its FIRST draft asserted only a
//             non-zero exit and reported PROVED on a run that died at step 3.
//   slice 2   asserts `run.status !== 0` and nothing else, and prints "PROVED: the tripwire
//             fires". It broke samples/433b.slice2.sample.json WITHOUT declaring the hand edit,
//             so assert-fixture-authorship.mjs at gate step 3 would have refused the record
//             before step 11 ran — the same failure slice 3's first draft made, still standing
//             in the tree, under the same word.
//
// The four other mapped forms carried NO firing-proof claim at all. That is not a pass and it
// is not a silence: it is registered below, per form, with the number of declared lines nothing
// has ever seen say no, derived from each map's own totals file.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { STANDARD, RECORD_DIR, RECORD_SWEEP_DECLARATION, judgeEntry, readRecords, runCanary } from './firing-proofs.mjs';
import { examined } from './examined.mjs';

const VERBOSE = process.argv.includes('--verbose');
const MAPS = 'adapters/pdf/maps';

/** Mapped forms, from the tree, never a list. */
export const MAPPED_FORMS = () =>
  readdirSync(MAPS).filter((f) => f.endsWith('.map.json')).map((f) => f.replace('.map.json', '')).sort();

// ---------------------------------------------------------------------------------------
// THE DERIVED POPULATION OF BREAK PROVERS.
//
// Declared in three lines and printed, because a glob is a STOP unless it declares what it
// sweeps ([R-15]). The classifier is deliberately WIDER than the true set: it catches anything
// that mutates a file and spawns a tool and says a word about firing, and every catch is then
// disposed by name below. A narrow classifier that happened to select exactly the right files
// would be a list wearing a derivation's clothes.
// ---------------------------------------------------------------------------------------
export const PROVER_DIRS = ['scratchpad', 'adapters/pdf', 'adapters/hubspot'];
export const PROVER_FILTER = (name) => name.endsWith('.mjs');
export const PROVER_CLASSIFIER = (src) =>
  src.includes('spawnSync') && src.includes('writeFileSync') && /\bPROVED\b|\bfires\b|\bfired\b/.test(src);
export const PROVER_SWEEP_DECLARATION =
  `${PROVER_DIRS.join('/, ')}/ (non-recursive) — name ends ".mjs"; classified by source carrying spawnSync AND writeFileSync AND one of PROVED/fires/fired`;

export const deriveProvers = () => {
  const out = [];
  for (const dir of PROVER_DIRS) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).filter(PROVER_FILTER).sort()) {
      const path = `${dir}/${name}`;
      let src;
      try { src = readFileSync(path, 'utf8'); }
      catch (e) { out.push({ path, unreadable: e.message }); continue; }
      if (PROVER_CLASSIFIER(src)) out.push({ path, unreadable: null });
    }
  }
  return out;
};

// ---------------------------------------------------------------------------------------
// THE REGISTER. Every claim, its class, and what its evidence actually shows.
// ---------------------------------------------------------------------------------------
export const CLAIMS = [
  {
    id: 'FP-11',
    form: '433d',
    claim: 'EVERY subject-conditional cell 433-D declares fires on the smallest expressible break, independently of every other, on BOTH sides of the subject',
    class: 'break',
    prover: 'scratchpad/p54-433d-prove-sc7-fires.mjs',
    record: `${RECORD_DIR}/433d.subject-conditional.json`,
    verdict: 'proved',
    // NO COUNT IN THIS ENTRY, for the reason [FP-01] gives: the prover reads the conditional
    // cells out of the map and records how many it broke, and this file compares that number
    // against `declarations_on_this_tool`. A count typed here would read "five" until a sixth
    // conditional cell was declared, and the entry would go on being true-looking about a
    // smaller set ([R-07]).
    //
    // THE BREAK SIZE IS NOT A CENT AND SAYS SO. An emptiness assertion compares presence against
    // absence rather than magnitude, so the smallest expressible break is one unit of what the
    // cell holds: one character in a text cell, one tick in a checkbox. The coarsest unit among
    // everything any break here moves is one TICK, because two of the five conditional cells are
    // the Master File review-code boxes.
    evidence_shows: 'the step (7, the fill engine, reached through the gate), the line (one SC7 verdict line per conditional cell, printed on every run whether it passes or fails), and the verdict (NOT EMPTY against a passing "empty"), with every other declared line reading either "empty" or "SKIPPED" \u2014 and every SKIPPED naming the derived cause, which is the map\'s own empty_unless beside the record\'s declared subject',
  },
  {
    id: 'FP-01',
    form: '433b',
    claim: 'EVERY printed arithmetic total 433-B declares fires on a one-cent discrepancy, independently of every other',
    class: 'break',
    prover: 'scratchpad/prove-tripwires-fire.mjs',
    record: `${RECORD_DIR}/433b.tripwires.json`,
    verdict: 'proved',
    // NO COUNT IN THIS ENTRY. The prover reads the declared lines out of 433b.totals.json and
    // records how many it broke; the record's `declarations_on_this_tool` is compared against
    // that number by this file. A count typed here would have read "six" until slice 4 made it
    // eleven, and the entry would have gone on being true-looking about a smaller set ([R-07]).
    evidence_shows: 'the step, the line and the verdict, on each declared line separately, with every other declared line reading yes in the same run',
  },
  {
    id: 'FP-02',
    form: '433b',
    claim: 'the two totals slice 3 added (22e, 23e) fire on a one-cent discrepancy, independently',
    class: 'break',
    prover: 'scratchpad/433b-slice3-prove-tripwire-fires.mjs',
    record: null,
    verdict: 'proved-in-source',
    evidence_shows: 'the step (GATE FAILED at step 11/12), the broken line reading NO, and the other new total reading yes in the same run — asserted in the prover rather than recorded, because it predates this register. [FP-01] re-proves both to the record standard and its record is what this file judges.',
  },
  {
    id: 'FP-03',
    form: '433b',
    claim: '"PROVED: the tripwire fires on a one-cent discrepancy and stops firing when it is removed" — 19c',
    class: 'break',
    prover: 'scratchpad/433b-slice2-prove-tripwire-fires.mjs',
    record: null,
    verdict: 'unproved',
    evidence_shows: 'ONLY THAT SOMETHING FAILED. The prover asserts `run.status === 0` and nothing else: not the step, not the line, not the other three declared totals. It edits samples/433b.slice2.sample.json without a `_co_authored_with_hand` declaration, which assert-fixture-authorship.mjs refuses at gate STEP 3 — so on the evidence recorded, step 11 was never reached and the tripwire was never asked. Superseded by [FP-01], which breaks 19c separately and records the step and the line.',
  },
  {
    id: 'FP-05',
    form: 'cross-form',
    claim: 'validate-crosswalk.mjs\'s A6 refuses a row creating a property under a name another form already created — on BOTH crosswalk shapes',
    class: 'break',
    prover: 'scratchpad/prove-crosswalk-name-guards-fire.mjs',
    record: `${RECORD_DIR}/crosswalk-name-guards.json`,
    verdict: 'proved',
    evidence_shows: 'the failing message naming the planted row AND the field file the name already lives in, on the authored shape (433-F) and the derived shape (433-B(OIC)) separately, with every other assertion in the same run still printing its own examined count. The [D-16] widening from one field file to the whole provisioned universe changed no verdict on any form — that is the guard being blind rather than wrong — so this is what stands in for a verdict change.',
  },
  // ─────────────────────────────────────────────────────────────────────────────────────
  // THE FOUR FORMS THAT CARRIED NO BREAK PROOF AT ALL, AND NOW DO.
  //
  // Until this commit, 433-A's 16 declared lines, 433-F's 5, 433-A(OIC)'s 51 and
  // 433-B(OIC)'s 31 had passed on every run ever made and had never once been seen to say no.
  // This file was printing those four zeros on every run, by name, under
  // `declared-lines-proved-to-refuse` — which is what a checked absence is for and is not a
  // substitute for the proof.
  //
  // ONE PROVER FOR ALL FIVE FORMS. A class fixed on one form and copied to its neighbours is
  // how the same defect arrives four more times ([R-12]), so scratchpad/prove-tripwires-fire.mjs
  // reads the fixture from its declared role, the declared lines from the totals file, the
  // feeder graph from the same file, and each line's address from the gate's own per-line
  // result. Five entries name it, one per form, because a FORM is what a reader asks about and
  // what `declared-lines-proved-to-refuse` is counted per.
  {
    id: 'FP-06',
    form: '433a',
    claim: 'every printed arithmetic total 433-A declares fires on a one-cent discrepancy, independently of every other',
    class: 'break',
    prover: 'scratchpad/prove-tripwires-fire.mjs',
    record: `${RECORD_DIR}/433a.tripwires.json`,
    verdict: 'proved',
    evidence_shows: 'the step, the line and the verdict, on each declared line separately, with every other declared line reading the verdict the feeder graph derives for it in the same run. 433-A declares no `when` predicate, so no line on it is ever out of class and the fourth state never arises.',
  },
  {
    id: 'FP-07',
    form: '433f',
    claim: 'every printed arithmetic total 433-F declares fires on a one-cent discrepancy, independently of every other',
    class: 'break',
    prover: 'scratchpad/prove-tripwires-fire.mjs',
    record: `${RECORD_DIR}/433f.tripwires.json`,
    verdict: 'proved',
    evidence_shows: 'the step, the line and the verdict, on each of the five declared lines separately. The five are mutually independent — no total on this form feeds another — so every other line reads passing in every run, which is the original [FS-3] and not the amendment.',
  },
  {
    id: 'FP-08',
    form: '433aoi',
    claim: 'every printed arithmetic total 433-A(OIC) declares fires on a one-cent discrepancy, independently of every other',
    class: 'break',
    prover: 'scratchpad/prove-tripwires-fire.mjs',
    record: `${RECORD_DIR}/433aoi.tripwires.json`,
    verdict: 'proved',
    evidence_shows: 'the step, the line and the verdict on each declared line, with every other line reading its derived verdict — passing, failing where the feeder graph makes it a dependent of the broken line, or SKIPPED where this form\'s printed lease/own conditional puts it on the other branch of the record it was broken in. TWO of its declared lines are in class on NO fixture this form had, and samples/433aoi.branch.sample.json is what puts them there.',
  },
  {
    id: 'FP-09',
    form: '433boi',
    claim: 'every printed arithmetic total 433-B(OIC) declares fires on a one-cent discrepancy, independently of every other',
    class: 'break',
    prover: 'scratchpad/prove-tripwires-fire.mjs',
    record: `${RECORD_DIR}/433boi.tripwires.json`,
    verdict: 'proved',
    evidence_shows: 'the step, the line and the verdict on each declared line. THIS IS WHERE THE AMENDED [FS-3] FIRST BITES ON A FORM OTHER THAN 433-B: Box D feeds the two page-5 payment rows, those feed Box E and Box F, and Box A feeds the offer row which feeds the Offer Amount — so a one-cent break high in that chain is DERIVED to move everything below it, and a dependent that stayed passing would be the defect. THREE of its 31 declared lines are in class on no fixture this form had, and samples/433boi.branch.sample.json is what puts them there.',
  },
  {
    id: 'FP-10',
    form: '433b',
    claim: 'the eleven 433-B lines proved by the form-specific prover this one generalises',
    class: 'break',
    prover: 'scratchpad/433b-prove-every-tripwire-fires.mjs',
    record: null,
    verdict: 'superseded-by-generalisation',
    evidence_shows: 'EVERYTHING [FP-01] SHOWS, AND ON A SMALLER SET. It is the file scratchpad/prove-tripwires-fire.mjs was written from, and it is kept rather than deleted because the finding in its header — the slice-3 first draft that reported PROVED on a gate that died at step 3 — is the defect [R-28] is named for, quoted verbatim there and again in its successor ([R-21]). It is registered here rather than left in the tree unnamed: a prover the derivation catches and the register does not name is a proof nobody judged, and this file makes that a STOP.',
  },
  {
    id: 'FP-04',
    form: '433aoi',
    claim: 'the (7) floor fires — "nothing had ever proved the floor fires. Something has now."',
    class: 'exercise',
    prover: 'adapters/pdf/maps/433aoi.map.json (C-04 how_resolved) + samples/433aoi.negative.sample.json',
    record: null,
    verdict: 'proved-as-an-exercise-claim',
    evidence_shows: 'THE LINE AND THE VERDICT, AND NO BREAK. It is not a break proof and does not claim to be: a fixture drives (7) negative, the gate prints "floored at 0.00" against (7) by name, and declaration-coverage moves that floor from unexercised to exercised. That is a declaration APPLYING, which is a different fact from a guard REFUSING, and [R-28] governs the second. Registered here so the two words are not read as one.',
  },
];

/**
 * Forms with NO firing-proof claim, derived rather than typed, with the number of declared
 * lines nothing has ever seen say no. A form absent from this register would be indistinguishable
 * from a form nobody looked at, which is [R-04] one level out.
 */
export const declaredLines = (form) => {
  const p = `${MAPS}/${form}.totals.json`;
  if (!existsSync(p)) return { total: 0, why: 'no totals file in this tree' };
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  return { total: (doc.totals || []).length, why: null };
};

// ---------------------------------------------------------------------------------------
// THE IN-PROCESS CANARY CLASS, DECLARED AND DERIVED.
// ---------------------------------------------------------------------------------------
export const CANARY_DIRS = ['adapters/pdf', 'adapters/hubspot'];
export const CANARY_CLASSIFIER = (src) => /canary/i.test(src);
export const CANARY_SWEEP_DECLARATION =
  `${CANARY_DIRS.join('/, ')}/ (non-recursive) — name ends ".mjs"; classified by the word "canary" appearing in the source`;
export const CANARY_GROUND =
  'An in-process canary plants a defect in a synthetic input inside its own process. There is no multi-step run, ' +
  'so [FS-1]\'s "at the step" has no referent; the standing convention that replaces it is already in force here — ' +
  'the planted defect is reported BY NAME and a conforming input is still accepted, which is [FS-2] and [FS-3] in the ' +
  'shape this class can carry. This is a WEAKER ground than a break proof\'s and it is written down as such.';

export const deriveCanaryTools = () => {
  const out = [];
  for (const dir of CANARY_DIRS) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort()) {
      const path = `${dir}/${name}`;
      try { if (CANARY_CLASSIFIER(readFileSync(path, 'utf8'))) out.push(path); }
      catch { out.push(`${path} (UNREADABLE)`); }
    }
  }
  return out;
};

/** Provers the derivation catches that are NOT firing proofs. An exclusion is a claim. */
export const NOT_A_PROVER = [
  { path: 'scratchpad/author-branch-fixtures.mjs',
    why: 'IT AUTHORS AN INPUT, IT DOES NOT PROVE ANYTHING. The classifier catches it because it writes a file, spawns the gate, and its header speaks of lines that would otherwise never fire — but what it produces is samples/<form>.branch.sample.json, a committed record that puts the other branch of each printed conditional in class. It makes five declared lines askable on two forms; asking them is [FP-08] and [FP-09]. Disposed by name rather than by narrowing the classifier, because a classifier tuned until it happened to miss this would also miss the next real prover that resembles it.' },
  { path: 'scratchpad/p54-433d-retire-pre-map.mjs',
    why: 'IT RETIRES A DECLARATION AND REGENERATES AN ARTEFACT; IT PROVES NOTHING ABOUT A GUARD. The classifier catches it because it rewrites a source file, spawns a tool twice, and its header speaks of a check that FIRED. What fired was adapters/pdf/assert-subject-register.mjs [S2], on the run in which 433-D got a map, reporting the form\'s `_pre_map` declaration STALE \u2014 and this script is the response to that firing rather than a demonstration of it. It breaks no input, asserts no step and no verdict, and the run it describes happened before it existed. What it does assert is the pair of things a generated-artefact edit owes: that the SOURCE was patched and not the output, and that the output re-derives from its generator afterwards. Disposed by name rather than by narrowing the classifier, because a classifier tuned until it happened to miss a script that patches a generator would also miss the next real prover that patches one.' },
  { path: 'adapters/pdf/run-form-gate.mjs',
    why: 'it is the tool a break proof spawns, not a proof. It writes filled PDFs and spawns its own steps; the word "fires" in it is prose about a floor.' },
  { path: 'adapters/hubspot/rerun-regression.mjs',
    why: 'A RE-RUN HARNESS, NOT A BREAK PROOF, AND IT WAS UNDISPOSED HERE FOR A WHOLE PROMPT WITHOUT ANYTHING SAYING SO. The classifier catches it because it writes into a sandbox, spawns every discovered tool, and its header speaks of a canary that must FIRE. What [R-28] governs is a claim that ONE GUARD was demonstrated to fire by breaking a real input in a real multi-step run, with the step, the line and the verdict asserted. This file makes no such claim about any guard: it re-runs finished forms\' generators and fetchers unchanged and reports what each says, and its own three canaries are about the harness (a tool exiting 3 is reported non-zero, a sandbox write appears as drift, a write to a swept root is named), not about a guard on a form. That it sat here unregistered until this cycle is not incidental — adapters/pdf/assert-firing-proofs.mjs is in no npm script and in no gate step, so nothing had run it since this file landed. It is the run-everything rule\'s own evidence, produced by the run-everything rule\'s first wired run.' },
  { path: 'adapters/hubspot/assert-exit-codes.mjs',
    why: 'IT PLANTS DEFECTS IN SYNTHETIC CHILDREN, WHICH IS THE IN-PROCESS CANARY CLASS [R-28] ALREADY DECLARES, NOT A BREAK PROOF. The classifier catches it because it writes seven synthetic .mjs files to a temp directory, spawns each, and its header speaks of what must and must not fire. But there is no multi-step run for "at the step" to refer to and no real input is broken: every child is a fixed source string built here, and each is judged on its own exit code and output alone. The convention that stands in its place is the one already in force for that class — the planted defect must be found BY NAME and a conforming input must still be ACCEPTED — and both directions are planted, in five offline cases and two portal ones. Its ground is written down as weaker rather than borrowed, which is [R-14] rather than a hole.' },
  { path: 'adapters/pdf/assert-firing-proofs.mjs',
    why: 'THIS FILE, caught by its own classifier — the strings "spawnSync" and "writeFileSync" are in the classifier line itself, beside the word PROVED in the header. It is the judge, not a proof, and it spawns nothing. Disposed by name rather than by narrowing the classifier to miss it: a classifier tuned until it happens to exclude the auditor would also exclude the next tool that quotes a prover, silently. guard-sweep.mjs registers itself the same way at [SB-21].' },
];

// ---------------------------------------------------------------------------------------
// THE RUN.
// ---------------------------------------------------------------------------------------
const run = () => {
  const problems = [];
  console.log('FIRING-PROOF AUDIT — every claim in this tree that a guard was demonstrated to fire, against [R-28].');
  console.log('');

  // --- the canary first. No verdict below is printed on a run whose canary did not pass. ---
  const canary = runCanary();
  console.log(`canary: ${canary.live ? 'holds' : 'DEAD'} (${canary.planted} planted case(s) across ${canary.conditions} of ${STANDARD.length} declared condition(s))`);
  if (!canary.live) {
    for (const d of canary.dead) console.error(`STOP — canary: ${d}`);
    console.error('STOP — the judge cannot be trusted, so nothing below is reported.');
    process.exit(2);
  }

  // --- the standard, named ---
  console.log('');
  console.log(`the standard, ${STANDARD.length} separate conditions:`);
  for (const s of STANDARD) console.log(`  [${s.id}] ${s.name.padEnd(18)} ${s.asks}`);

  // --- population: break provers, both directions ---
  console.log('');
  console.log(`break-prover sweep: ${PROVER_SWEEP_DECLARATION}`);
  const derived = deriveProvers();
  const unreadable = derived.filter((d) => d.unreadable);
  for (const u of unreadable) problems.push(`a swept file could not be read: ${u.path} — ${u.unreadable}. An unreadable input is a STOP, never a skip.`);
  const derivedPaths = derived.filter((d) => !d.unreadable).map((d) => d.path);
  const registeredProvers = new Set(CLAIMS.filter((c) => c.class === 'break').map((c) => c.prover));
  const excused = new Set(NOT_A_PROVER.map((x) => x.path));
  console.log(`  derived ${derivedPaths.length} candidate(s); ${registeredProvers.size} registered as break proofs, ${excused.size} declared not a proof`);
  for (const p of derivedPaths) {
    if (registeredProvers.has(p) || excused.has(p)) continue;
    problems.push(`UNDISPOSED — ${p} mutates a file, spawns a tool and speaks of firing, and is in neither the register nor the declared exclusions. A proof nobody registered is a proof nobody judged.`);
  }
  for (const p of registeredProvers) {
    if (!existsSync(p)) problems.push(`the register names prover ${p}, which is not in this tree. An unproved forward reference is a STOP ([R-13]).`);
  }
  for (const x of NOT_A_PROVER) {
    if (!existsSync(x.path)) problems.push(`the exclusion register names ${x.path}, which is not in this tree.`);
    else if (!derivedPaths.includes(x.path)) problems.push(`${x.path} is excused from a population it is not in. An exclusion that excuses nothing is a sentence, not a boundary ([R-14]).`);
    else console.log(`  not a proof: ${x.path} — ${x.why}`);
  }

  // --- population: records, both directions ---
  console.log('');
  console.log(`record sweep: ${RECORD_SWEEP_DECLARATION}`);
  const records = readRecords();
  for (const r of records) {
    if (r.unreadable) problems.push(`UNREADABLE RECORD — ${r.path}: ${r.unreadable}. A record this tool cannot parse is a STOP; it is not a proof that passed.`);
    else if (!r.classified) problems.push(`${r.path} is in the record directory and does not declare \`_standard: "[R-28]"\`. A file here that names no standard cannot be judged against one.`);
  }
  const recordPaths = new Set(records.map((r) => r.path.replace(/\\/g, '/')));
  const claimedRecords = new Set(CLAIMS.map((c) => c.record).filter(Boolean));
  for (const p of recordPaths) if (!claimedRecords.has(p)) problems.push(`RECORD WITH NO CLAIM — ${p} records a firing proof no register entry names.`);
  for (const p of claimedRecords) if (!recordPaths.has(p)) problems.push(`CLAIM WITH NO RECORD — the register promises ${p} and it is not in this tree.`);

  // --- judge every break entry in every record ---
  console.log('');
  let entries = 0, failedEntries = 0;
  for (const c of CLAIMS) {
    if (!c.record) continue;
    const r = records.find((x) => x.path.replace(/\\/g, '/') === c.record);
    if (!r || !r.doc) continue;   // already a problem above
    const breaks = r.doc.breaks;
    if (!Array.isArray(breaks) || !breaks.length) {
      problems.push(`[${c.id}] ${c.record} carries no \`breaks\` list. A record with nothing in it is not a record of a proof.`);
      continue;
    }
    console.log(`[${c.id}] ${c.form} — ${breaks.length} break(s) in ${c.record}`);
    for (const b of breaks) {
      entries++;
      const bad = judgeEntry(b);
      if (bad.length) {
        failedEntries++;
        for (const p of bad) problems.push(`[${c.id}] ${b.declaration || '(unnamed declaration)'} — ${p}`);
      } else if (VERBOSE) {
        console.log(`    ${String(b.line).padEnd(5)} step ${b.failed_at_step} | ${b.broken_line_verdict} | ${b.other_declared_lines.length} other line(s) all ${b.passing_verdict}`);
      }
    }
    // ONE BREAK PER DECLARATION, ACROSS THE RECORD. [FS-4] holds within an entry; this is the
    // same condition across the list, where a declaration broken twice would double-count and a
    // declaration broken never would be invisible.
    const seen = new Map();
    for (const b of breaks) seen.set(b.declaration, (seen.get(b.declaration) || 0) + 1);
    for (const [d, n] of seen) if (n !== 1) problems.push(`[${c.id}] declaration ${JSON.stringify(d)} appears in ${n} break entries. One break each.`);
    if (r.doc.declarations_on_this_tool !== undefined && seen.size !== r.doc.declarations_on_this_tool)
      problems.push(`[${c.id}] the record says the tool declares ${r.doc.declarations_on_this_tool} line(s) and breaks ${seen.size} of them. ` +
        'A proof covering some of a declared set must say which and why; a partial set reported as a whole one is the blanket [R-13] is about.');
  }
  console.log(`  ${entries} break entr(ies) judged, ${failedEntries} failing the standard`);

  // --- the register's own verdicts, named ---
  console.log('');
  const byVerdict = new Map();
  for (const c of CLAIMS) byVerdict.set(c.verdict, (byVerdict.get(c.verdict) || 0) + 1);
  console.log(`registered claims: ${CLAIMS.length} — ${[...byVerdict].map(([v, n]) => `${v} ${n}`).join(', ')}`);
  for (const c of CLAIMS) {
    console.log(`  [${c.id}] ${c.form.padEnd(7)} ${c.verdict.toUpperCase()}`);
    console.log(`         claim:    ${c.claim}`);
    console.log(`         evidence: ${c.evidence_shows}`);
  }

  // --- forms with no claim at all, derived per form ---
  console.log('');
  const claimed = new Set(CLAIMS.map((c) => c.form));
  const forms = MAPPED_FORMS();
  // TWO EXAMINED LINES PER FORM, BECAUSE THERE ARE TWO UNIVERSES AND THE FIRST DRAFT OF THIS
  // BLOCK PUT THEM IN ONE FIGURE ([R-07], committed by the file that enforces [R-28]).
  //
  // It emitted one line counting every claim naming the form, with cross-form claims counted
  // against each form they reach. That is a defensible count of CLAIMS — a name-collision guard
  // really is about both sides — and it made 433-A, 433-F and 433-B(OIC) read 1 instead of 0.
  // The zero those three deserve is not about claims at all; it is about DECLARED TOTAL LINES
  // NOTHING HAS EVER SEEN REFUSE, which is what [R-28] is for. One number cannot be both, and
  // the one that was printed was the one that hid the finding.
  for (const f of forms) {
    examined('assert-firing-proofs', f, CLAIMS.filter((c) => c.form === f || c.form === 'cross-form').length, 'firing-proof-claims');
    const proved = CLAIMS.filter((c) => c.form === f && c.class === 'break' && c.verdict === 'proved' && c.record)
      .reduce((n, c) => {
        const r = records.find((x) => x.path.replace(/\\/g, '/') === c.record);
        return n + (r && r.doc && Array.isArray(r.doc.breaks) ? r.doc.breaks.length : 0);
      }, 0);
    examined('assert-firing-proofs', f, proved, 'declared-lines-proved-to-refuse');
  }
  const without = forms.filter((f) => !claimed.has(f));
  console.log(`mapped forms: ${forms.length}; carrying at least one registered firing-proof claim: ${claimed.size}; carrying none: ${without.length}`);
  for (const f of without) {
    const d = declaredLines(f);
    console.log(`  ${f.padEnd(7)} NO FIRING-PROOF CLAIM — ${d.total} declared total line(s) in ${f}.totals.json, none of which has ever been seen to say no.` +
      (d.why ? ` (${d.why})` : ''));
  }
  if (without.length) console.log('  These are DECLARED UNPROVED and named, not passed over. A declared line nothing has seen refuse is a comparison that has only ever agreed.');

  // --- the in-process canary class ---
  console.log('');
  console.log(`in-process canary sweep: ${CANARY_SWEEP_DECLARATION}`);
  const canaryTools = deriveCanaryTools();
  const badCanary = canaryTools.filter((p) => p.endsWith('(UNREADABLE)'));
  for (const p of badCanary) problems.push(`a canary-class file could not be read: ${p}`);
  console.log(`  ${canaryTools.length} tool(s) carry an in-process canary, declared as a class rather than judged against [R-28]:`);
  console.log(`  ground: ${CANARY_GROUND}`);
  if (VERBOSE) for (const p of canaryTools) console.log(`    ${p}`);

  console.log('');
  if (problems.length) {
    for (const p of problems) console.error(`STOP — ${p}`);
    console.error(`ASSERT-FIRING-PROOFS FAILED — ${problems.length} problem(s).`);
    process.exit(2);
  }
  console.log(`OK — ${CLAIMS.length} registered claim(s), ${entries} break entr(ies) judged against ${STANDARD.length} separate conditions and none failing, ` +
    `${without.length} form(s) declared unproved by name, ${canaryTools.length} in-process canary tool(s) declared as a class, and the judge proved itself on ${canary.planted} planted case(s).`);
};

// ONLY WHEN INVOKED DIRECTLY. register-ids.mjs imports CLAIMS from here so the FP ids are
// unique-checked against the other 48 registers, and a module whose body runs on import cannot
// be imported for its register — which is the exact reason assert-overflow.mjs's NUMERIC sits
// in regex-self-assert's NOT_ADOPTED list unable to contribute to a count.
if (import.meta.main) run();
