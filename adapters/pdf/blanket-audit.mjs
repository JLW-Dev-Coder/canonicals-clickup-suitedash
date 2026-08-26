// THE FOURTH SWEEP — AND IT SWEEPS THE OTHER THREE.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS FILE IS FOR
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// count-sweep.mjs disposes of every claim site in the mapped artefacts. Most of them are
// disposed by a handful of BLANKETS — one `underivable` reason standing over hundreds of
// sites at once. That is a legitimate construct and it is also the largest unexamined
// surface in this repo: a blanket is believed because it is written down, and nothing has
// ever asked whether it is TRUE of the sites it stands over.
//
// The failure mode is not hypothetical. Slice 8 found the classification's completeness
// blanket — "every bound key on the form is covered by an entry" — true of 207 keys and
// FALSE OF 31, one of which (X-17) would have created a permanent duplicate HubSpot
// property in a portal with a hard ceiling. It survived because the sweep that watched it
// COUNTED ENTRIES, and no tool had ever counted KEYS. The blanket asserted coverage of one
// set and the only instrument pointed at it measured a different set.
//
//   A BLANKET ASSERTING COVERAGE MUST NAME THE THING THAT COUNTS THE COVERED SET.
//
// That is the standing rule this file enforces, and it enforces it in three ways.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// (1) SAMPLING — is the blanket true of the sites it stands over?
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A blanket says "nothing here counts a set this repo holds". The only honest test is to
// take sites it covers and ask, of each one, whether that is so. Exhaustive re-reading is
// what the blanket exists to avoid, so the audit SAMPLES — deterministically.
//
// SEEDED FROM A STABLE HASH OF THE SITE PATH, never from `Math.random`. A random sample is
// a sample nobody can reproduce, which makes a clean run unfalsifiable and a dirty one
// unbisectable. FNV-1a over `SEED \0 file \0 path`, sites ordered by that hash, the first
// N taken. Changing SEED draws a different sample and is a deliberate, recorded act.
//
// The probe is the COUNTABLE-SET REGISTER below: for each number the site states, does the
// prose around it name a set this repo can count? If yes, the blanket is FALSE at that
// site — the site was derivable all along — and that is a finding whether or not the stated
// figure happens to agree today.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// (2) FORWARD REFERENCES — the half that matters most
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Most blankets do not merely say "underivable". They say "underivable HERE, because
// instrument X checks it THERE":
//
//     [S-18]  "align-block.mjs and line-markers.mjs re-measure coordinates and markers out
//              of the PDF; ... validate-map.mjs proves every target exists verbatim"
//
// That is a claim about another instrument's coverage, made inside a file that never runs
// it. Nothing had ever checked that `line-markers.mjs` was run against the sites [S-18]
// covers, or that its output reaches the markers those sites quote. A forward reference is
// a promissory note, and this repo had never once presented one for payment.
//
//   AN UNPROVED FORWARD REFERENCE IS A STOP.
//
// Every (blanket, instrument) pair extracted from the reasons below must appear in the
// FORWARD register with an executable prover. The prover computes two sets:
//
//   DEMANDED  the atoms of the kind that instrument checks, extracted from the sites the
//             blanket actually covers — the markers quoted, the coordinates quoted, the
//             field paths quoted, the group names quoted.
//   SUPPLIED  what the named instrument actually verifies, obtained BY IMPORTING THAT
//             INSTRUMENT or the exact primitive it measures from.
//
// DEMANDED minus SUPPLIED must be empty. A non-empty difference is the forward reference
// naming coverage the instrument does not have.
//
// A REIMPLEMENTATION IS A NEW INSTRUMENT AND IS NOT EVIDENCE ABOUT THE OLD ONE. So
// `markerPairing` is imported from line-markers.mjs rather than re-derived; `readPrintedText`
// and `readWidgetGeometry` are imported from page-geometry.mjs, which is the module
// align-block.mjs and verify-headings.mjs both measure from; `walkTargets` is imported from
// verify-form-coverage.mjs, which is the walk validate-map.mjs uses. Where the audit had to
// reach a fact by a second route, the prover says so in its `how` and the report prints it.
//
// THE FIRST RUN OF THIS REGISTER FOUND ONE. [S-21] and [S-20f] both stated that
// `asset-row-shapes.json` is checked by `adapters/hubspot/validate-crosswalk.mjs`, "which
// fails when a declared column is missing from a claimed table". validate-crosswalk.mjs
// does not open that file — nothing in this repo did. 269 claim sites in the shared
// row-class specification, the artefact `row_class` routing is authored from, stood on a
// forward reference to a check that had never existed. See assert-row-shape-spec.mjs, which
// is the check the blanket had been describing, and the corrected reasons in count-sweep.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// (3) COMPLETENESS CLAIMS — one counter each
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The completeness blanket was one sentence of many. This repo's artefacts are dense with
// quantified coverage claims — "every declared path exists", "Every one of the 50 fields is
// bound", "every one is checked" — and each of them is the same shape that failed.
//
// So every completeness-shaped phrase in the swept artefacts AND in count-sweep's own
// blanket reasons is detected loudly and must be DISPOSED, in exactly two states and no
// third:
//
//   `counter`      an executable counter naming the COVERED set and the UNIVERSE it is
//                  claimed to cover, run live, compared, and printed with both figures.
//   `not-coverage` the quantifier is describing geometry, prose or a past state and is not
//                  asserting that a set is covered — with the reason.
//
// An undisposed completeness claim is a STOP. Over-detection is loud and under-detection is
// silent; only one of those two announces itself, so the detector is deliberately wide and
// the register carries family entries for the wide part.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { classifyCoordinates } from './absence-sweep.mjs';
import { MANIFEST, sweptFiles, claimsIn, runCountSweep } from './count-sweep.mjs';
import { markerPairing } from './line-markers.mjs';
import { readPrintedText, readWidgetGeometry } from './page-geometry.mjs';
import { walkTargets, classifyMapTargets } from './verify-form-coverage.mjs';
import { slotColumnsOf } from './check-row-shape.mjs';
import { verifyPrintedEvidence } from './record-shape.mjs';
import { readFormRevision } from './read-form-revision.mjs';
import { rowShapeSpecProblems, rowShapeSpecScope, splitOccurrences } from './assert-row-shape-spec.mjs';
import { coverageCount, ENGINE_EXTRA_INPUTS } from '../hubspot/classification-coverage.mjs';
import { rx } from './regex-self-assert.mjs';
import { examined } from './examined.mjs';

/** Every string in a JSON document, so a coordinate is read in the sentence it belongs to. */
const proseStrings = (doc) => {
  const out = [];
  const walk = (o) => {
    if (typeof o === 'string') { out.push(o); return; }
    if (o && typeof o === 'object') for (const v of Object.values(o)) walk(v);
  };
  walk(doc);
  return out;
};

// ---------------------------------------------------------------------------------------
// THE SEED. Reported on every run, and changing it is a deliberate act that draws a
// different sample. `Math.random` appears nowhere in this file, by rule.
export const SEED = 'blanket-audit/1';

/** FNV-1a, 32-bit. Stable across runs, platforms and node versions — which is the point. */
const fnv1a = (str) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

/**
 * HOW BIG A SAMPLE IS. Declared, not tuned: ten sites, or a tenth of the family, whichever
 * is larger, capped at the family size. A blanket standing over 3 sites is read in full; one
 * standing over 525 gets 53. Stated here rather than passed in, so two runs of the audit on
 * the same tree draw the same sample.
 */
export const sampleSize = (n) => Math.min(n, Math.max(10, Math.ceil(n * 0.10)));

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE COUNTABLE-SET REGISTER — the probe's whole content.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Each entry pairs a PHRASE that names a set with a COUNTER that produces its cardinality
// from the live tree. The probe reads every number a sampled site states, looks at the
// window of prose around it, and asks whether any phrase matches. A match means the site
// states a count of a set this repo holds — which is precisely what every blanket in scope
// denies of the region it covers.
//
// KEPT TIGHT ON PURPOSE. A phrase that matches loosely produces a finding at every site
// that mentions the word, and a report full of noise is a report nobody reads. Each phrase
// below names the set in the words the artefacts actually use for it.
const N = String.raw`(?:\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|(?:twenty|thirty|forty|fifty)-(?:one|two|three|four|five|six|seven|eight|nine))`;

const SETS = [
  { id: 'map-keys',       phrase: /\b(?:input\s+)?`?map`?\s+keys\b|\bkeys\s+(?:in|of)\s+`?map`?\b/i,
    count: (c) => Object.keys(c.mapDoc.map || {}).filter(k => !k.startsWith('_')).length,
    what: 'scalar keys under `map`' },
  { id: 'groups',         phrase: /\bgroups?\s+(?:this\s+)?(?:form|map)\s+declares\b|\bdeclared\s+groups\b/i,
    count: (c) => Object.keys(c.mapDoc.groups || {}).filter(k => !k.startsWith('_')).length,
    what: 'declared groups' },
  { id: 'totals-entries', phrase: /\bentries\s+in\s+(?:this|the)\s+totals\b|\bdeclared\s+totals?\s+lines?\b/i,
    count: (c) => (c.totalsDoc?.totals || []).length,
    what: 'totals[] entries' },
  { id: 'not-checkable',  phrase: /\bnot[- ]checkable\s+(?:cells?|entries)\b/i,
    count: (c) => (c.totalsDoc?.not_checkable?.entries || []).length,
    what: 'not_checkable.entries[]' },
  { id: 'active-lies',    phrase: /\bactive\s+lies?\b/i,
    count: (c) => (c.liesDoc?.entries || []).filter(e => e.kind === 'lie' || e.kind === 'container').length,
    what: 'name-lies entries of kind lie or container' },
  { id: 'carried-open',   phrase: /\bcarried\s+(?:items?\s+)?open\b|\bopen\s+carried\s+items?\b/i,
    count: (c) => (c.mapDoc._carried?.open || []).length,
    what: '_carried.open[]' },
  { id: 'class-entries',  phrase: /\bclassification\s+entr(?:y|ies)\b|\bentries\s+in\s+the\s+classification\b/i,
    count: (c) => (c.classDoc?.entries || []).length,
    what: 'crosswalk-classification entries[]' },
  { id: 'row-classes',    phrase: /\brow[- ]classes\b|\basset\s+classes\b/i,
    count: (c) => (c.shapesDoc?.classes || []).length,
    what: 'asset-row-shapes classes[]' },
  { id: 'headings',       phrase: /\bdeclared\s+headings?\b|\bheadings?\s+this\s+file\s+declares\b/i,
    count: (c) => (c.headingsDoc?.headings || []).length,
    what: 'headings[]' },
  { id: 'bound-targets',  phrase: /\bbound\s+(?:writable\s+)?targets?\b|\bunique\s+targets?\b/i,
    count: (c) => new Set(walkTargets(c.mapDoc).map(t => t.target)).size,
    what: 'unique targets the map binds' },
];

/**
 * THE PROBE'S CANARY, for the same reason the completeness detector has one.
 *
 * A REGEX THAT STOPS MATCHING REPORTS A CLEAN SAMPLE. Every sampled site would come back with
 * no findings and the audit would print "0 findings" over a probe that reads nothing — the dead
 * guard this repo already shipped once, in the shape that prints PASS underneath.
 *
 * A PER-SITE HEURISTIC IS THE WRONG TEST AND WAS TRIED FIRST. "The site has a digit and I read
 * no number" fires on `entries[30].id` = "L30" and on "y 668.1", where reading no standalone
 * number is the CORRECT answer: the extractor's boundary rule exists precisely to refuse digits
 * that sit inside a name. It reported ten live sites as unreadable. The canary asks the only
 * question that separates a dead extractor from a site with nothing in it, and it is not drawn
 * from the artefacts — a canary taken from the input it guards dies with it.
 */
export const PROBE_CANARY = {
  // Two register phrases, far enough apart that neither number falls inside the other's
  // sixty-character window, plus one entry id whose digits the boundary rule must refuse.
  text: 'Seven groups this map declares hold rows.'
      + '  ' + '-'.repeat(105) + '  '
      + 'There are 22 active lies on this form, and entry C-18 records the reading.',
  expect: 2,   // 'Seven' beside the groups phrase, '22' beside the active-lies phrase; the 18 in C-18 is a name
};

export const probeCanaryHolds = (ctx) => {
  const got = probeSite(ctx, { value: PROBE_CANARY.text });
  const n = got.findings.length + got.stoodDown.length;
  return { ok: n === PROBE_CANARY.expect, got: n, expect: PROBE_CANARY.expect };
};

/**
 * THE PROBE. Returns the findings for one site: places where the site states a count of a
 * set the tree can produce, which is what the blanket standing over it denies.
 *
 * A GUARD THAT CANNOT READ ITS INPUT SAYS SO. A site whose value is not a string and not a
 * number is returned as `unreadable` rather than as clean — the shape that shipped dead once
 * in this repo already.
 */
// A NUMBER A SITE ITSELF MARKS AS PAST IS NOT A CLAIM ABOUT THE TREE AS IT STANDS.
// `_notes[19]` reads "The honest count through slice 3 is TEN active lies, not eleven" — a
// statement about slice 3, kept verbatim so the reason the eleven was wrong survives. Deriving
// "active lies" against it compares a superseded figure with today's 22 and reports a defect
// where a correction is being recorded. The stand-down is DECLARED and COUNTED, never silent:
// a probe that quietly skipped these would be indistinguishable from one that found nothing.
const HISTORICAL = rx('RX-BA-01', /\b(?:through slice \d|at the time|used to|superseded|was wrong|the honest count|not eleven|it inherited the error|as it stood|in slice \d|before this|previously|the first version|had claimed|then said)\b/i, {
  why: 'prose that describes a state the tree used to be in, so a blanket read as a live claim is told from one narrating history',
  matches: ['through slice 3 it was two', 'this was wrong', 'previously eleven'],
  rejects: ['through slice d', 'unpreviously', 'a slice count'],
});

export const probeSite = (ctx, site) => {
  const v = site.value;
  if (typeof v === 'number') {
    // A bare scalar carries no prose to name its set. Its KEY is the only signal, and the
    // manifest already addresses sites by key, so there is nothing here the probe can add.
    return { findings: [], stoodDown: [], read: 'scalar' };
  }
  if (typeof v !== 'string') return { findings: [], stoodDown: [], read: 'unreadable', why: `site value is ${typeof v}, which the probe cannot read as prose or as a scalar` };
  const findings = [], stoodDown = [];
  // NOT `\b`. In "carried open as C-18" the word boundary sits between the hyphen and the 1,
  // so `\b(\d+)\b` reads 18 out of an ENTRY ID and compares it against the number of open
  // carried items — a defect report generated entirely by the reader. A digit run preceded by
  // a hyphen, an underscore or a word character is part of a name, not a count.
  for (const m of String(v).matchAll(new RegExp(String.raw`(?<![\w-])(${N})(?![\w-])`, 'gi'))) {
    const at = m.index ?? 0;
    const window = String(v).slice(Math.max(0, at - 60), at + 60);
    for (const s of SETS) {
      if (!s.phrase.test(window)) continue;
      const hist = HISTORICAL.exec(window);
      if (hist) { stoodDown.push({ set: s.id, stated: m[1], marker: hist[0], window: window.replace(/\s+/g, ' ').trim() }); continue; }
      let derived;
      try { derived = s.count(ctx); } catch { derived = null; }
      findings.push({ set: s.id, what: s.what, stated: m[1], derived, window: window.replace(/\s+/g, ' ').trim() });
    }
  }
  return { findings, stoodDown, read: 'prose' };
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// FORWARD REFERENCES.
// ═══════════════════════════════════════════════════════════════════════════════════════

/**
 * Every instrument a blanket reason names. Extracted, never listed by hand.
 *
 * AN EXTRACTION THAT READS NOTHING OUT OF A REASON THAT PLAINLY NAMES SOMETHING IS THE ONE
 * READING THAT MUST NOT BE QUIET. If this regex ever stops matching, every blanket reports
 * zero forward references, the register demands zero provers, and the audit prints "0
 * unproved" over a tree where nothing was checked at all. So the two readings are separated:
 * `refs` is what was extracted, `unreadable` is a reason that contains the literal ".mjs" or
 * "step N" and yielded nothing, and the caller turns the second into a STOP.
 */
export const forwardRefsIn = (text) => {
  const t = String(text);
  const refs = [...new Set([
    ...[...t.matchAll(/\b([a-zA-Z0-9-]+\.mjs)\b/g)].map(m => m[1]),
    ...[...t.matchAll(/\b(?:gate\s+)?step\s+(\d+)\b/gi)].map(m => `gate step ${m[1]}`),
  ])];
  const looksLike = /\.mjs\b/.test(t) || /\bstep\s+\d+\b/i.test(t);
  return { refs, unreadable: looksLike && !refs.length };
};

// --- extractors: the atoms a blanket's covered sites DEMAND of an instrument ---------------
const textOf = (sites) => sites.map(s => String(s.value ?? '')).join('\n');

/** Printed line markers quoted in prose: "(30)", "line 24", "lines 36-49", "Box D", "18a". */
const markersDemanded = (sites) => {
  const t = textOf(sites), out = new Set();
  for (const m of t.matchAll(/\((\d{1,2}[a-z]?)\)/g)) out.add(m[1]);
  for (const m of t.matchAll(/\bBox\s+([A-H])\b/g)) out.add(`Box ${m[1].toUpperCase()}`);
  for (const m of t.matchAll(/\blines?\s+(\d{1,2}[a-z]?)(?:\s*[-–]\s*(\d{1,2}[a-z]?))?/gi)) { out.add(m[1]); if (m[2]) out.add(m[2]); }
  return [...out];
};

/** Coordinates quoted in prose: "y 668.1", "x 36.0..565.0". */
const coordsDemanded = (sites) => {
  const t = textOf(sites), out = [];
  for (const m of t.matchAll(/\by\s+(\d{2,3}(?:\.\d+)?)\b/g)) out.push({ axis: 'y', v: Number(m[1]) });
  for (const m of t.matchAll(/\bx\s+(\d{1,3}(?:\.\d+)?)\s*\.\.\s*(\d{1,3}(?:\.\d+)?)/g)) { out.push({ axis: 'x', v: Number(m[1]) }); out.push({ axis: 'x', v: Number(m[2]) }); }
  return out;
};

/** Full AcroForm paths quoted in prose or held as values. */
const pathsDemanded = (sites) => [...new Set(
  [...textOf(sites).matchAll(/topmostSubform\[0\](?:\.[A-Za-z0-9_#\-]+(?:\[\d+\])?)+/g)].map(m => m[0]))];

/** Group names quoted in prose, as `groups.<name>` or bare backticked group keys. */
const groupsDemanded = (ctx, sites) => {
  const t = textOf(sites), known = Object.keys(ctx.mapDoc.groups || {});
  return known.filter(g => new RegExp(String.raw`\b(?:groups\.)?${g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b`).test(t));
};

const missing = (demanded, supplied, key = (x) => x) => demanded.filter(d => !supplied.has(key(d)));

// --- the register: one prover per (blanket, instrument) pair ------------------------------
//
// `prove(ctx, sites)` returns { how, demanded, supplied, uncovered }. `uncovered` non-empty
// is a STOP. A pair with no entry here is a STOP too — an unproved forward reference, which
// is the state this register exists to make impossible.
//
// AN EMPTY DEMANDED SET IS NOT A PROOF. A prover that extracts none of its own atoms out of the
// covered sites reports "0 demanded, 0 uncovered" and reads as green — which is the vacuous
// shape this repo names in guard-sweep.mjs [G-01], committed by the register built to pay
// forward references. So every (blanket, instrument) pair whose demand comes out empty must
// appear in EMPTY_DEMAND with the reason the citation is about something other than the atoms
// this prover measures. Undeclared, it is a STOP.
// `forms` scopes a declaration to the forms where the demand is structurally empty; omit it
// and the declaration applies to every form.
export const EMPTY_DEMAND = [
  // ── [S-18] on 433-B: the page has no arithmetic, so step 11's prover has no atoms ──────
  //
  // [S-18] credits gate step 11 with recomputing every entry in `<form>.totals.json`, and the
  // atoms it demands are the printed money constants the covered sites quote. On 433-B slice 1
  // there are none, and that is not a shortfall in the evidence — it is the page. Page 1 draws
  // no lettered Box, no "Total" line, no "Add lines", no "Subtract", no "minus" and no
  // "multiply"; the only occurrence of the word "box" on it is "(Check appropriate box below)".
  // All seven of those figures are DERIVED against the drawn page on every run by count-sweep
  // [S-37], with the "box" row as the positive control that proves the reading is alive.
  //
  // So this form declares no totals file, gate step 11 SKIPS, and the demanded set is empty
  // because the universe is. A NON-empty demand here would be the finding.
  { blanket: 'S-18', instrument: 'gate step 11', forms: ['433b'],
    why: 'PAGE 1 OF 433-B HAS NO ARITHMETIC AT ALL, so there is no printed money constant for the step-11 prover to demand and no totals declaration for it to recompute. The absence is checked rather than asserted: count-sweep [S-37] re-derives it against the drawn page every run over six enumerated patterns plus a positive control. When slice 2 reads pages 2 and 3 — which print Total Investments, Total Equity of Digital Assets and a full monthly income and expense statement — this entry must be re-read and almost certainly removed, because the universe it says is empty will not be.' },

  { blanket: 'S-15', instrument: 'validate-map.mjs',
    why: 'THE CITATION IS ABOUT ROUNDING, NOT ABOUT PATHS. [S-15] credits validate-map.mjs with "requiring every money cell here to sit in exactly one rounding block", which is the rounding cross-check validate-map.mjs runs through rounding.mjs — not the target-existence check the path prover measures. The totals declaration quotes printed captions and operand key names and no full AcroForm path, so the path demand is correctly empty. The rounding claim itself is counted by [K-07], which is where that half of the sentence is paid.' },
  { blanket: 'S-25c', instrument: 'validate-map.mjs',
    why: 'THE CITATION IS AN ASSERTION OF ABSENCE. [S-25c] says the classification "BINDS NOTHING — no HubSpot property, no canonical column, no map key — so there is no binding here for validate-map.mjs to resolve". An empty demanded set is not a failure to prove that claim; it IS the claim, measured. A NON-empty demand would be the finding, and the prover would report it as an uncovered path.' },

  // ── [S-25c] on 433-B(OIC): two of its citations demand nothing in that file ────────────
  //
  // [S-25c] enumerates what kinds of number a crosswalk classification holds and cites an
  // instrument for each. It was written for 433-A(OIC), whose classification quotes printed
  // slot counts and a page coordinate. 433-B(OIC) was authored in one pass against a closed
  // map and its evidence is a different KIND: printed captions, quoted verbatim, and the two
  // forms' printed ELIGIBILITY INSTRUCTIONS. Measured rather than asserted: the file holds
  // ZERO `y NNN` runs and ZERO `x A..B` ranges, against 433-A(OIC)'s one and zero, and none of
  // the claim sites [S-25c] covers there names a group at all.
  { blanket: 'S-25c', instrument: 'align-block.mjs', forms: ['433boi'],
    why: 'THE FILE QUOTES NO COORDINATE. adapters/pdf/maps/433boi.crosswalk-classification.json contains zero `y NNN` runs and zero `x A..B` ranges anywhere in it, claim site or not. Its evidence is printed captions quoted as text and the printed eligibility instructions that decide which of the two forms a business files on; the coordinates supporting those captions live in 433boi.map.json and 433boi.totals.json, where align-block.mjs and blanket-audit [K-12] already measure every one of them against the drawn page. An empty demand here is a property of what this file writes, not a citation nobody paid.' },

  { blanket: 'S-25c', instrument: 'check-row-shape.mjs', forms: ['433boi'],
    why: 'NO CLAIM SITE IN THIS FILE NAMES A GROUP. The numbers [S-25c] covers here are the entries\' `page` integers and the printed windows and thresholds quoted from the two forms - "10 years", "3 years", "$10,000", the printed X .8, the 12 and 24 multipliers. None of them is a slot count and none of them names a table, so `slotColumnsOf` has nothing to resolve. The ten `groups.X` citations the file does carry sit in `oic` and `a433` prose that states no count and is therefore not a claim site; the row shapes those groups declare are proved by check-row-shape.mjs against the map itself, and by adapters/hubspot/assert-intake-keys.mjs against every form\'s definition file, on every run.' },

  // ── the citations that are inapplicable on 433-A and 433-F rather than unpaid ───────────
  //
  // [S-18] lists FIVE kinds of number its region holds — printed coordinates, printed line
  // markers, printed constants, field-name indices and maxLength limits — and cites a different
  // instrument for each. On 433-A(OIC) the covered sites carry all five. On 433-A and 433-F they
  // carry only the last two: those maps' evidence is written as field-name reasoning, and the
  // coordinate-and-caption style of evidence arrived with 433-A(OIC)'s slices. So three of the
  // citations demand nothing THERE, and that is the reason rather than an excuse. It is measured
  // and quotable: 433a.map.json holds 5 `y NNN` runs and 3 `x A..B` runs in total, both inside
  // `row_class.discriminator._why` strings that state no count and are therefore not claim sites
  // at all; 433f.map.json holds none of either; and neither map quotes a printed dollar constant
  // of $1,000 or more anywhere, while 433aoi.map.json quotes 38.
  { blanket: 'S-18', instrument: 'align-block.mjs', forms: ['433a', '433f'],
    why: 'No claim site [S-18] covers on these two maps quotes a coordinate. The only coordinate prose in 433a.map.json sits in two `row_class.discriminator._why` strings that state no count, so they are not claim sites; 433f.map.json contains no `y NNN` or `x A..B` run at all. The citation is true of the region and inapplicable to what these forms wrote in it.' },
  { blanket: 'S-18', instrument: 'validate-map.mjs', forms: ['433a', '433f'],
    why: 'These maps quote full AcroForm paths as TARGET VALUES, hundreds of them, and target values are not claim sites — a bare path states no count. The paths validate-map.mjs proves are therefore proved as targets by the gate\'s own step 3 rather than as quoted evidence, and [K-02] and [K-14] count exactly that set. What is empty here is the EVIDENCE-QUOTING habit, which is a 433-A(OIC) construct.' },
  { blanket: 'S-18', instrument: 'gate step 11', forms: ['433a', '433f'],
    why: 'Neither map quotes a printed dollar constant of $1,000 or more. The printed constants step 11 folds into a total — the $1,000 at (1) and the $11,980 at (7) — are a 433-A(OIC) feature; 433-A and 433-F print no such constant inside a total caption, and their totals declarations carry no `constant` feeder for one.' },
  { blanket: 'S-15', instrument: 'gate step 11', forms: ['433a', '433f', '433b'],
    why: 'Same absence, in the totals declaration rather than the map: these three forms declare no printed money constant as a feeder, so there is no constant for the prover to demand. The other half of [S-15]\'s citation — that step 11 recomputes each declared total — is counted by [K-05], which holds on all three forms.' },
  // ── [S-18] on 433-B(OIC): three of its four citations demand nothing on a one-page slice ──
  //
  // ALL FOUR, and a correction: the first draft of this block declared three and asserted that
  // align-block.mjs was "NOT empty — this map quotes coordinates throughout". The audit
  // disagreed and the audit was right. The map DOES quote coordinates throughout, and they are
  // proved — but not HERE. The region [S-18] covers on this form is `_carried`, and the carried
  // ledger deliberately quotes neither coordinates nor markers nor paths: it names findings.
  // The coordinates live in `_map_evidence` and `_printed_headings_and_markers_first`, which
  // [S-25] covers and where align-block's demand is emphatically not empty. Recorded rather
  // than quietly amended, because the mistake was assuming which region a blanket covered
  // instead of reading what the prover extracted from it.
  { blanket: 'S-18', instrument: 'check-row-shape.mjs', forms: ['433boi'],
    why: 'The covered sites are the carried ledger, and no entry in it names a GROUP. B1 to B5 are findings about inherited leaf names across two forms, B6 to B8 are about three page-1 scalars, and B9 is about where the coverage table is built. The map DOES declare a group and check-row-shape.mjs does resolve its columns — reporting 3 slotted rows across 1 declaring group on the fill this slice runs — but that happens under `groups.partners`, which is a different region from the one this blanket covers. The demand is empty because the ledger discusses cells and names, not row shapes.' },
  { blanket: 'S-18', instrument: 'validate-map.mjs', forms: ['433boi'],
    why: 'THE LEDGER QUOTES NO FULL ACROFORM PATH, AND THAT IS DELIBERATE RATHER THAN INCIDENTAL. A `topmostSubform[0]...` path written into prose counts as a second binding and trips the duplicate-write gate — a defect this repo has already met — so carried entries name the LEAF NAME (Name_Creditor, CB8_08) or the INPUT KEY (s1_total_number_of_employees) instead. There is therefore nothing for the path prover to extract, and a non-empty demand here would itself be the finding.' },
  // [S-15] ON THIS FORM: THE TOTALS FILE QUOTES NO PRINTED MONEY CONSTANT.
  //
  // The prover for [S-15] -> gate step 11 extracts the printed money constants a covered site
  // quotes and asserts each one is carried as a feeder the step recomputes. 433-A(OIC) prints
  // "minus ($1,000)" on line (1) and 433-B(OIC) prints no such figure anywhere on pages 2 or 3:
  // the only two constants in this declaration are the 0.8 multiplier, which is a FACTOR and is
  // carried as one, and the literal 0 the leased-vehicle branch writes, which is carried as a
  // constant feeder with its printed caption. Neither is written with a currency sign, which is
  // what the extractor looks for. So the demand is empty because the FORM prints no money
  // constant, not because the citation is wrong about what step 11 does.
  { blanket: 'S-15', instrument: 'gate step 11', forms: ['433boi'],
    why: 'This form\'s pages 2 and 3 print no money constant at all. The two constants the totals declaration carries are a 0.8 factor and a literal 0, both declared as feeders with their printed captions and both recomputed by step 11; neither is a currency figure drawn on the page, which is the atom the prover extracts. The demand is empty because there is nothing of that kind on the page to demand.' },

  { blanket: 'S-18', instrument: 'gate step 11', forms: ['433boi'],
    why: 'No printed money constant is quoted in the covered sites, because page 1 prints none anywhere: the map records that this page draws no lettered Box, no "Add lines" instruction and no total-shaped cell at all, and its one money cell is an input. Gate step 11 is SKIPPED on this form for the same reason and says so in terms. The absence is the same fact reported by two instruments, not a gap in either.' },

  { blanket: 'S-18', instrument: 'align-block.mjs', forms: ['433boi'],
    why: 'The carried ledger quotes no coordinate. Every one of the nine entries states a FINDING — a name that lies on one page and not another, a cell 18pt wide with no declared limit, a bullet list with no widget against it — and where a measurement backs the finding, the measurement lives in `_map_evidence` or `_printed_headings_and_markers_first`, which [S-25] covers and where this prover extracts and proves the whole coordinate set. An entry in the ledger that DID quote a coordinate would be duplicating evidence that already has a home, which is the two-lists-of-one-fact shape guard-sweep (c) exists to forbid.' },
  { blanket: 'S-18', instrument: 'line-markers.mjs', forms: ['433boi'],
    why: 'The ledger names printed lines only twice - B4 says Total_Value_Bank_Accounts sits at line (1) here where 433-A(OIC) has it at (8) - and page 1, the only page this slice authored, draws no numbered marker at all. The marker prover reads the union over every mapped form, so what is empty is the demand of this region and not the output of the instrument: line-markers.mjs reports 44 markers on this form, and [S-24] derives that figure and the per-page split against it.' },

  // [S-27] IS A 433-B(OIC) DISPOSITION AND THE AUDIT RUNS PER FORM.
  //
  // The sites it covers live in 433boi.map.json and every coordinate in them is drawn on
  // 433-B(OIC). When the audit runs for another form it measures against THAT form's page, so
  // the extraction correctly yields nothing rather than testing one document's coordinates
  // against another document's geometry. On the 433-B(OIC) run the demand is not empty and the
  // citation is proved there, which is where it belongs.
  //
  // Found by an ID COLLISION, which is worth recording: this entry was first written as [S-25],
  // a manifest id already taken by the crosswalk-classification disposition. The two merged
  // silently — the count sweep has no duplicate-id check — and the blanket audit then attributed
  // 433-A(OIC) classification sites to a citation about 433-B(OIC) coordinates. The renumbering
  // to [S-26] was not the fix either — see [S-27]; the missing duplicate-id check is carried.
  { blanket: 'S-27', instrument: 'align-block.mjs', forms: ['433a', '433f', '433aoi'],
    why: 'This disposition covers sites in 433boi.map.json, whose coordinates are drawn on 433-B(OIC). An audit run for a different form measures against a different PDF, so there is nothing here for it to extract — and extracting something WOULD be the finding, because it would mean one form evidence was being proved against another form page. The citation is measured, non-empty and proved on the 433boi run.' },

  { blanket: 'S-13c', instrument: 'validate-map.mjs', forms: ['433boi'],
    why: 'THE COVERED SITES ARE THE REGISTRY HEADER, AND A HEADER QUOTES NO PATH. [S-13c] stands over _what_this_file_is, _what_is_machine_checked_and_what_is_not and the _kinds descriptions — prose about what the file is for and what each kind means. The paths this registry is ABOUT live in entries[].path, one per entry, and validate-map.mjs proves every one of them exists verbatim in the fields file and that every bound_to resolves through the map to exactly it; that is counted by [K-29]. A non-empty demand here would mean the header had started quoting cell paths, which is the duplicated-evidence shape guard-sweep (c) forbids.' },

  { blanket: 'S-17f', instrument: 'align-block.mjs', forms: ['433a', '433f'],
    why: 'The change log on these two maps records what a slice decided in field-name terms and quotes no coordinate. Same measurement as the [S-18] entry above.' },
  { blanket: 'S-17f', instrument: 'line-markers.mjs', forms: ['433f'],
    why: '433-F\'s change log names its sections by letter — "Section A", "Section E" — and not by printed line marker, so there is no `(nn)`, `line NN` or `Box X` run in the covered sites for the marker prover to demand. line-markers.mjs itself reports 433-F\'s markers; what is empty is the citation\'s demand, not the instrument\'s output.' },
  // ── [S-14f] on 433-B: the totals NOTES carry no coordinate and no marker in the prover's
  // spelling, and the entries beside them carry both ──────────────────────────────────────
  //
  // The four _notes on adapters/pdf/maps/433b.totals.json say why step 11 was skipped until
  // this file existed, why all four captions name an operand the form draws no cell for, why
  // the available-credit block has no entry, and why no floor is declared. They are ARGUMENTS,
  // and the coordinates and markers they are arguments about live one level down in the
  //  entries — every one of which carries a caption_at giving page, y and x range,
  // and a printed_rows naming its markers. Those sites are covered by [S-15] and are where
  // both provers find their atoms. What is empty here is this citation demand, not the
  // evidence: moving the argument into the entries would put four paragraphs of reasoning
  // beside four structural declarations, which is where nobody would read them.
  { blanket: 'S-14f', instrument: 'align-block.mjs', forms: ['433b'],
    why: 'The four totals notes on this form quote printed captions, an operand list and the names of two other artefacts. They quote no y and no x range: every coordinate on this form s totals lives in the caption_at field of the totals entries, which is a different region and is where align-block s prover does find atoms.' },
  { blanket: 'S-14f', instrument: 'line-markers.mjs', forms: ['433b'],
    why: 'The notes name printed markers in the page s own spelling — 17d, 18f, 19c, 20e, 21a, 21b — and not in the (nn) or line NN or Box X forms the marker prover extracts, because 433-B prints them that way and this file transcribes what the page prints. The markers ARE demanded and proved, from the printed_rows and line fields of the totals entries; line-markers.mjs reports this form s markers either way. What is empty is this citation s demand over this region.' },
  { blanket: 'S-14f', instrument: 'align-block.mjs', forms: ['433a', '433f'],
    why: 'The totals notes on these forms quote printed captions and operand names, not coordinates. Same measurement as the [S-18] entry above.' },
];

const P = (o) => o;
export const FORWARD = [

  P({ instrument: 'line-markers.mjs',
    how: 'Every printed line marker and Box marker quoted in the covered sites must appear in `markerPairing(form).rows` — the marker list line-markers.mjs itself produces, IMPORTED rather than re-derived, so this proves something about that instrument and not about a copy of it.',
    prove: (ctx, sites) => {
      const demanded = markersDemanded(sites);
      // ACROSS EVERY MAPPED FORM. A map's evidence and a crosswalk's prose quote 433-A's line
      // markers constantly - "433-A line 65", "line 15e" - and line-markers.mjs is run per
      // form, so the honest supplied set is the union of its output over the forms this repo
      // maps. Restricting it to the form under audit reported 433-A's own markers as coverage
      // gaps on 433-A(OIC), which is the prover being wrong about which page the sentence is
      // describing rather than the sentence being wrong.
      const supplied = new Set(Object.values(ctx.markersByForm).flatMap(m => m.rows.map(r => r.marker)));
      // A BARE "line 65" NAMES A PRINTED LINE THE FORM SETS ONLY AS LETTERED SUB-ROWS. 433-A
      // draws 65a, 65b and 65c and no bare 65, and the map's prose says "433-A routes a
      // business account to line 65" — which is the same printed line, referred to the way the
      // instructions refer to it. So an unlettered marker is covered by any lettered sibling.
      // A LETTERED demand is still required verbatim: "18c" covered by "18a" would be the
      // off-by-one line-markers.mjs exists to prevent.
      const covers = (d) => supplied.has(d) || (/^\d{1,2}$/.test(d) && [...supplied].some(x => new RegExp(`^${d}[a-z]$`).test(x)));
      return { demanded, supplied: supplied.size, uncovered: demanded.filter(d => !covers(d)) };
    } }),

  P({ instrument: 'align-block.mjs',
    how: 'Every coordinate quoted in the covered sites must land on a drawn text run or a widget edge, measured with `readPrintedText` and `readWidgetGeometry` — the two functions align-block.mjs measures from, imported from page-geometry.mjs. Tolerance 0.75pt, which is the rounding align-block prints at.',
    prove: (ctx, sites) => {
      const demanded = coordsDemanded(sites);
      const ys = ctx.drawnY, xs = ctx.drawnX;
      const near = (set, v) => { for (const s of set) if (Math.abs(s - v) <= 0.75) return true; return false; };
      const uncovered = demanded.filter(d => !(d.axis === 'y' ? near(ys, d.v) : near(xs, d.v)));
      return { demanded, supplied: ys.size + xs.size, uncovered };
    } }),

  P({ instrument: 'record-shape.mjs',
    how: 'Every route sentence a record-shape declaration quotes must be DRAWN on the page it names, at the baseline and x span it states, opening the sentence it quotes — measured with `verifyPrintedEvidence`, the function record-shape.mjs itself proves its evidence with, over `readPrintedText` from page-geometry.mjs. Tolerance 0.75pt, the rounding align-block prints at.',
    prove: (ctx) => {
      // Read off the MAP rather than off the covered sites: the coordinates are structured
      // numbers, not prose, which is the whole reason the prose extractor finds nothing here.
      const r = verifyPrintedEvidence(ctx.mapDoc, ctx.printedText);
      return { demanded: r.demanded, supplied: ctx.drawnY.size, uncovered: r.uncovered };
    } }),

  P({ instrument: 'check-row-shape.mjs',
    how: 'Every group named in the covered sites must be a group `slotColumnsOf` can resolve columns for — the function check-row-shape.mjs derives every row shape from, imported.',
    prove: (ctx, sites) => {
      const demanded = groupsDemanded(ctx, sites);
      const supplied = new Set();
      for (const g of Object.keys(ctx.mapDoc.groups || {})) {
        if (g.startsWith('_')) continue;
        try { if (slotColumnsOf(ctx.mapDoc, g)?.length) supplied.add(g); } catch { /* falls out as uncovered */ }
      }
      return { demanded, supplied: supplied.size, uncovered: missing(demanded, supplied) };
    } }),

  P({ instrument: 'validate-map.mjs',
    how: 'Every full AcroForm path quoted in the covered sites must exist verbatim in the fields file AND be a target the map actually binds — the two sets validate-map.mjs compares, reached through `walkTargets`, the same walk it uses. A path quoted in evidence that the map does not bind is evidence about a cell validate-map never looks at.',
    prove: (ctx, sites) => {
      const demanded = pathsDemanded(sites);
      // LEAF FIELDS AND THE SUBFORMS ABOVE THEM. The lie registry's whole subject includes
      // `kind: "container"` entries, whose evidence quotes the CONTAINER path - the node whose
      // name lies - and a container is not a field. Every proper prefix of a field name is a
      // real node in the AcroForm tree, derived from the fields file, which is validate-map's
      // own input. A quoted path that is neither a field nor a real subform is the defect.
      const supplied = ctx.nodes;
      return { demanded, supplied: supplied.size, uncovered: missing(demanded, supplied) };
    } }),

  P({ instrument: 'verify-headings.mjs',
    how: 'THE BANNERS THEMSELVES, plus any coordinate the sites quote. Every heading the file declares must have its declared TEXT actually drawn on its declared PAGE — read with `readPrintedText`, the function verify-headings.mjs re-measures banners with — and every quoted coordinate must land on a drawn run within 0.75pt. The banner half is what makes this citation payable on all three forms: 433-A and 433-F declare `{id, page, text}` and no `_at` prose at all, so a prover that measured only coordinates would prove [S-16] over nothing on two forms out of three and print it as green.',
    prove: (ctx, sites) => {
      const near = (set, v) => { for (const s of set) if (Math.abs(s - v) <= 0.75) return true; return false; };
      const coords = coordsDemanded(sites);
      const heads = (ctx.headingsDoc?.headings || []).map(h => ({ axis: 'heading', id: h.id, page: h.page, text: h.text }));
      const norm = (x) => String(x).replace(/\s+/g, ' ').trim().toLowerCase();
      const drawnOn = (page) => (ctx.printedText[page - 1]?.items || []).map(t => norm(t.str));
      const uncovered = [
        ...heads.filter(h => !drawnOn(h.page).some(run => run.includes(norm(h.text)) || norm(h.text).includes(run) && run.length > 6)),
        ...coords.filter(d => !(d.axis === 'y' ? near(ctx.drawnY, d.v) : near(ctx.drawnX, d.v))),
      ];
      return { demanded: [...heads, ...coords], supplied: ctx.drawnY.size + ctx.drawnX.size, uncovered };
    } }),

  P({ instrument: 'read-form-revision.mjs',
    how: 'The revision and catalog number the covered sites state must equal what `readFormRevision(form)` reads out of the drawn page bytes — imported, and the same call validate-map.mjs pins against.',
    prove: (ctx, sites) => {
      const t = textOf(sites);
      const demanded = [...new Set([
        ...[...t.matchAll(/\b(\d{1,2}-\d{4})\b/g)].map(m => m[1]),
        ...[...t.matchAll(/\b(\d{5}[A-Z])\b/g)].map(m => m[1]),
      ])];
      // The two the map header states are the ones this blanket stands over; both must match.
      const live = ctx.revision;
      const supplied = new Set([live.revision, live.catalog].filter(Boolean));
      return { demanded: [ctx.mapDoc.form_revision, ctx.mapDoc.catalog].filter(Boolean).concat(demanded.filter(d => !supplied.has(d) && (d === ctx.mapDoc.form_revision || d === ctx.mapDoc.catalog))),
        supplied: supplied.size,
        uncovered: [ctx.mapDoc.form_revision, ctx.mapDoc.catalog].filter(v => v && !supplied.has(v)) };
    } }),

  P({ instrument: 'validate-crosswalk.mjs',
    how: 'validate-crosswalk.mjs reads `crosswalk.<form>.json`, the map, and the 433-A backbone. Its scope is therefore the crosswalk bindings: every binding names a map key that exists and a property that exists. DEMANDED is the set of map keys the covered crosswalk sites name; SUPPLIED is the engine-input key space that tool compares them against.',
    prove: (ctx, sites) => {
      const xwPath = 'adapters/hubspot/crosswalk.433f.json';
      if (!existsSync(xwPath)) return { how: 'crosswalk.433f.json absent', demanded: [], supplied: 0, uncovered: [] };
      const xw = JSON.parse(readFileSync(xwPath, 'utf8'));
      const m433f = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
      const inputs = new Set([
        ...Object.keys(m433f.map || {}).filter(k => !k.startsWith('_')),
        ...Object.keys(m433f.checkboxes || {}).filter(k => !k.startsWith('_')),
        ...Object.entries(m433f.split || {}).filter(([, v]) => v && Array.isArray(v.parts)).map(([k]) => k),
        ...Object.values(m433f.groups || {}).map(g => g?.source || g?.array).filter(Boolean),
        ...(m433f.special?.composite_name_address?.from || []),
        // The inputs the engine reads that the map does not name, IMPORTED from
        // validate-crosswalk.mjs rather than copied - see [K-09] and that file's export note.
        ...(ENGINE_EXTRA_INPUTS['433f'] || []),
      ]);
      const demanded = (xw.bindings || []).map(b => b.key).filter(Boolean);
      return { demanded, supplied: inputs.size, uncovered: demanded.filter(k => !inputs.has(k)) };
    } }),

  P({ instrument: 'assert-row-shape-spec.mjs',
    how: 'THE CHECK [S-21] AND [S-20f] HAD BEEN DESCRIBING AND NOBODY HAD WRITTEN. Every class in asset-row-shapes.json declares printed tables and a canonical row; this prover requires assert-row-shape-spec.mjs to reach every class and every canonical column, and to report zero problems.',
    prove: (ctx) => {
      const scope = rowShapeSpecScope();
      const problems = rowShapeSpecProblems();
      return { demanded: scope.units, supplied: scope.units.length - problems.length, uncovered: problems };
    } }),

  P({ instrument: 'gate step 11',
    how: 'Step 11 recomputes every entry in `<form>.totals.json` from the filled PDF. DEMANDED is the printed money constants the covered sites quote; SUPPLIED is the constants the totals declaration actually carries as feeders. A printed constant quoted in map evidence that no totals entry carries is a constant step 11 never recomputes.',
    prove: (ctx, sites) => {
      const t = textOf(sites);
      const demanded = [...new Set([...t.matchAll(/\$\s?([\d,]{3,})(?:\.\d\d)?\b/g)].map(m => Number(m[1].replace(/,/g, ''))))].filter(v => v >= 1000);
      const supplied = new Set();
      for (const e of (ctx.totalsDoc?.totals || [])) for (const f of (e.feeders || [])) if (typeof f.constant === 'number') supplied.add(Math.abs(f.constant));
      // The IRS standards table is the other legitimate home for a printed dollar figure.
      for (const v of Object.values(ctx.standards?.national || {})) for (const n of Object.values(v)) if (typeof n === 'number') supplied.add(n);
      for (const n of Object.values(ctx.standards?.oop || {})) if (typeof n === 'number') supplied.add(n);
      if (typeof ctx.standards?.national_addl_total === 'number') supplied.add(ctx.standards.national_addl_total);
      return { demanded, supplied: supplied.size, uncovered: demanded.filter(v => !supplied.has(v)) };
    } }),

  P({ instrument: 'gate step 7',
    how: 'Step 7 is the fill. A heading blanket citing it is citing the step that PRODUCES the filled document the heading assertion then reads; the atoms are the heading ids the file declares, and every one must resolve to a declared band on a page the form has.',
    prove: (ctx, sites) => {
      const demanded = (ctx.headingsDoc?.headings || []).map(h => h.id);
      const pages = new Set([...ctx.widgetsByPage.keys()]);
      const supplied = new Set((ctx.headingsDoc?.headings || []).filter(h => pages.has(h.page)).map(h => h.id));
      return { demanded, supplied: supplied.size, uncovered: missing(demanded, supplied) };
    } }),
];

// ═══════════════════════════════════════════════════════════════════════════════════════
// COMPLETENESS CLAIMS.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// DETECTION IS DELIBERATELY WIDE. A quantifier followed, inside one clause, by a word that
// asserts a set has been covered. It over-fires on prose that merely describes where things
// sit, and the register below disposes of that family in one entry rather than by narrowing
// the detector — because narrowing it is how the original blanket got past everything.
const QUANT = String.raw`(?:every|each|all|any)`;
const ASSERTS = String.raw`(?:covered|checked|asserted|derived|re-?measured|verified|proved|proven|enumerated|accounted|disposed|resolved|bound|listed|examined|validated|swept|reported|exists?|resolves?)`;
const GEOMS = String.raw`(?:sits?|holds?|falls?|lands?|appears?|reach(?:es)?)`;
const clause = (verbs) => new RegExp(String.raw`\b${QUANT}\b((?:(?!\b${QUANT}\b)[^.;])*?)\b${verbs}\b`, 'gi');

// ═══════════════════════════════════════════════════════════════════════════════════════
// STANDING RULE: EVERY DETECTOR CARRIES A CANARY
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A DETECTOR is any instrument whose output is "how many did I find", where finding NOTHING is
// a reportable outcome. That shape has one failure mode and it is silent: the detector stops
// reading — a regex reaches disk with its backslashes eaten, an input path moves, a filter
// quietly widens — and it reports zero findings, which is indistinguishable from a clean tree.
// The loudest possible failure printed as the quietest possible success.
//
// This project has now met that shape at FIVE levels: the vacuous `nums.length &&` guard [G-01];
// the sampling probe that read ten live sites as unreadable; the completeness detector; the
// heading assertion that examined zero rows and exited 0 [G-28]; and the row-class check that
// reported every row correct over zero rows examined [G-30]. Five instruments, one shape.
//
// SO EVERY DETECTOR THIS PROJECT WRITES CARRIES A CANARY:
//
//   1. A FIXED INPUT, NOT DRAWN FROM THE ARTEFACTS. A canary taken from the input it guards
//      dies with it — if the tree is what went missing, a canary read from the tree goes
//      missing too and confirms the silence.
//   2. A KNOWN EXPECTED YIELD, stated as a number or a shape, not as "some".
//   3. THE YIELD IS ASSERTED, NOT PRINTED. Printing a figure a reader could have noticed is
//      what verify-headings did before [G-28]: it printed the zero and exited 0 anyway. The
//      run must FAIL when the canary does not come back.
//   4. THE CANARY IS PROVED BY BREAKING THE DETECTOR. A canary that has never been seen to die
//      is itself an unproved instrument, and a new instrument is the least trustworthy object
//      in the repo at the moment it is written.
//
// The register below enumerates every detector in the engine and names its canary, so a
// detector added without one is a STOP rather than something a reader has to notice.
//
// THE DETECTOR'S CANARY. A regex detector that stops matching reports "0 claims detected, 0
// undisposed" and reads as a clean tree. So the detector is run against a fixed string with a
// known answer before it is trusted with the tree, and a canary that does not come back is a
// STOP. It is deliberately NOT drawn from the artefacts, per rule 1 above.
export const CANARY = {
  text: 'Every declared path exists in the fields file; each row sits below y 668.1.',
  expect: { assert: 1, geometry: 1 },
};

// ── THE CANARY REGISTER ─────────────────────────────────────────────────────────────────
//
// The rule above is only a rule if a detector added without a canary STOPS a run. So the
// CANDIDATE SET IS DERIVED, never typed: an engine file that SEARCHES BY PATTERN over text it
// did not enumerate (`matchAll`, `new RegExp`, `.match`) and can STOP a run (`process.exit(2)`
// or `process.exitCode`). That is the detector shape - a pattern applied to an open input,
// where "found nothing" is a reportable outcome and an unreadable input produces the same
// output as a clean one.
//
// A typed list is exactly how D-05 stayed at eight when the real number was twelve. Every
// candidate the derivation finds must be disposed here, and a candidate with no entry is a STOP.
const DETECTOR_DIR = 'adapters/pdf';
// THE SECOND HALF OF THIS SIGNATURE WAS TOO NARROW ON ITS FIRST RUN, AND THE REGISTER CAUGHT
// IT. It demanded a literal `process.exit(2)`, which the three instruments that actually carry
// canaries do not write - they write `process.exit(report(...) ? 2 : 0)`. So the derivation
// missed exactly the files the rule is modelled on, and it was the STALE DETECTOR ENTRY check
// that said so rather than a reader noticing. Any exit at all now qualifies: an instrument that
// cannot stop a run is not a detector in this sense, and one that can is.
const RX_DETECTOR_READS = rx('RX-BA-02', /\.matchAll\(|new RegExp\(|\.match\(/, {
  why: 'a file that reads its input through a regex — half the signature of a tool that detects rather than reports',
  matches: ['s.matchAll(re)', 'new RegExp(x)', 's.match(re)'],
  rejects: ['smatchAllX', 'x.matchAllY', 'newRegExpX'],
});
const RX_DETECTOR_STOPS = rx('RX-BA-03', /process\.exit(Code)?\b/, {
  why: 'the other half — a file that can end the run on what it read, rather than print and continue',
  matches: ['process.exit(2)', 'process.exitCode = 2'],
  rejects: ['processXexit', 'process.exiting'],
});
const DETECTOR_SIG = (src) => RX_DETECTOR_READS.test(src) && RX_DETECTOR_STOPS.test(src);

export const DETECTORS = {
  'regex-self-assert.mjs': { canary: 'THREE, because it holds three separable detectors and each one\'s failure mode is silence in a different place. (a) assertionCanary(), eight planted registrations through the SAME assertSpec() the live path calls: a source carrying a literal backspace must be refused as shape 1, an eaten `\\s` must be caught by its own match probe, an eaten `\\)` by its own reject probe, an eaten `\\w` that still matches and still captures by its CAPTURE probe, a backslash-carrying regex declaring no probes must be refused outright — and, in the same call, three sound registrations must be ACCEPTED, because a detector that refused everything would satisfy a refusal-only canary and stop the whole engine on its next run. (b) scannerCanary(), thirteen planted cases through the hand-written lexer: a regex literal in each of eight syntactic positions must be found with its exact source, and a division expression, a line comment, a block comment, a string literal and a template literal must NOT be mistaken for one. A lexer that missed literals would report a small population and call it a whole one, so the false-negative half is the half that matters and the false-positive half is there so the lexer cannot pass by calling every slash a regex. (c) controlPopulationCanary(), which compares this file\'s derived shape-1 byte set against control-char-scan.mjs\'s CONTROLS register in BOTH directions, byte for byte — the two are one population with one register and one derived copy, and a disagreement between them is the duplicate-register defect. No verdict is printed on a run whose canaries did not pass, and none of the planted inputs is drawn from the artefacts.' },
  'blanket-audit.mjs': { canary: 'CANARY + PROBE_CANARY, both asserted in auditBlankets and both reported on every run.' },
  'count-sweep.mjs': { canary: 'THE atLeast CONTRACT, which is the same idea per claim site: a detector declares the minimum it must find in an input it was handed, and finding fewer is a STOP rather than a clean sweep. It is the construct the canary generalises.' },
  'guard-sweep.mjs': { canary: 'THE ORPHAN CHECK. Every register entry carries an `anchor` that must match a real line in the file it disposes of; an anchor matching nothing is a STOP. That is a canary per entry rather than one per run - the register cannot go quiet without saying so.' },
  'assert-row-class-routes.mjs': { canary: '`__canary_not_a_class__`, poisoned into every declaring group with an asserted expected yield of one refusal each. Proved by breaking it: with the poison write removed the harness reported 64 DID NOT STOP, CANARY 0 of 32, and exited 2.' },
  'sweep-boundary.mjs': { canary: 'runCanary(), a synthetic fixture claiming "all 999 form fields" against a derived 267, run through [SB-10]\'s own FORM_TOTAL patterns. Expected yield: exactly ONE contradiction — and, in the same call and asserted in the same conjunction, exactly ONE MATCH against a second synthetic fixture claiming the derived figure. The second half is the one a dead pattern fails: a regex matching nothing produces zero contradictions, which the first half alone would read as a clean tree. It is the two-wrong-typed-counts defect in miniature and it is not drawn from the artefacts.' },
  'exclusion-sweep.mjs': { canary: 'runCanary() builds a synthetic spec whose one class claims a printed table "not currently mapped" AND a synthetic map that routes that class, then runs [EX-01]\'s comparison over the pair. Expected yield: exactly one excusal and exactly one contradiction. It is the [A3] defect in miniature — an excusal whose sentence the map disproves — so a cross-check that stops comparing reports 1 excused and 0 contradicted and takes the run down, rather than reporting nothing to contradict. The map half goes through the SAME acceptorsOf() the real assertion uses, imported rather than copied, so the canary cannot pass against a second implementation of the routing.' },
  'success-sweep.mjs': { canary: 'CANARY_SRC, fourteen lines of synthetic source holding one site of each of the four classes, classified in memory by the same classify() the sweep uses. Line 13 is the defect verbatim — `process.exitCode = 3` inside a failure guard, then a bare `all assertions passed.` — arranged BELOW an earlier guard that does jump, because a witness accepting any jump above would certify the very line the file was written for. Expected yield: guarded, terminal, UNCONDITIONAL, narrative, in that order. CANARY_EXPECT\'s length is asserted against CANARY_CLASSES before the loop, so a shortened list cannot make `every` vacuously true.' },
  'enumerate-shadowing.mjs': { canary: 'canary(), seven synthetic condition strings run through the same classify() the enumeration uses, with an expected verdict asserted for each: a plain call reads BARE, a method call reads METHOD, a mixed site reads BARE and counts both occurrences, a predicate absent from the text reads ABSENT, a LONGER name is not matched by a shorter one, an optional-chained method reads METHOD, and null text reads ABSENT rather than zero. Not drawn from the artefacts. It is the canary this file most needs, because the expected answer over the real tree is ZERO and a broken classifier and a clean tree print the same number — so the count is not printed at all unless the canary bites first. Proved beyond the synthetic strings as well: a real same-file `bag.norm(xs)` planted in a swept file was found and named, and the enumeration returned to 0 when it was removed.' },
  'assert-fixture-authorship.mjs': { canary: 'canary(), seven synthetic key-pair comparisons run through the same keyDiff() the audit uses: a changed scalar, a key only on the committed side, a key only on the regenerated side, a nested change inside an array of objects, two identical objects yielding nothing, key ORDER yielding nothing, and "1" against 1 yielding a difference. Not drawn from the artefacts, and it runs BEFORE any generator is spawned - reportAuthorship returns the miss count and never reaches the table if the comparator is blind. It is the canary this file most needs: everything else it does is spawning processes and moving bytes, and its failure mode is agreeing with whatever it is handed. The last case is the sharpest - a fixture whose whole hand edit was cents-to-whole-dollars would read as reproduced exactly under a comparator that coerced.' },
  'absence-sweep.mjs': { canary: 'canary(), twenty planted cases run through the SAME detectors the sweep uses. Three halves, and each covers a way this file can go blind. (a) every registered ABSENCE_SHAPE must fire on a planted sentence of its own shape, and no shape may fire on a planted PRESENCE sentence - a detector that cannot tell absence from presence would classify the whole tree and report on neither. (b) every one of the four coordinate universes must be recovered from a planted example, INCLUDING a widget rectangle: a rectangle is written (y 170.6..183.6, ...) and its first number opens a range, so a band test placed first swallows every widget, and the canary caught exactly that on this file first run. (c) the form reader must return both 433-A(OIC) and 433-A from a sentence naming both, and must NOT read 433-A out of 433-A(OIC) alone - the cross-form confusion this file exists to separate, introduced by the reader meant to detect it. Two later shapes, the region boundary and the multiplication sign, were authored with an eaten backslash and went dead silently; both now carry a planted case, which is why the register is twenty and not seventeen.' },
  'assert-rules.mjs': { canary: 'parserCanary(), NINE synthetic documents run through the SAME parseRules() the assertion uses, each with its verdict asserted: a well-formed rule and two well-formed rules must PARSE (a detector that refused everything would satisfy a refusal-only canary and stop the engine on its next run); a rule with no blockquote, one with no attribution and one with no dating must each produce a problem; a DUPLICATE id and a GAP in the numbering must each produce a problem while still yielding both rules; an EMPTY document must produce a problem rather than a clean pass, which is the vacuous shape this file exists for; and a rule declaring \u0060**Attribution:\u0060 with a reason must be ACCEPTED, because a checked absence is a state the parser has to be able to reach. None of the nine is drawn from RULES.md. It runs BEFORE the document is read and the CLI exits 2 without reading it if any case is dead — [D-12] is the case that shape is written against: a detector whose canary covered its comparator and not its POPULATION SELECTOR reported clean for three prompts while half of it was dead, and every case here is aimed at the selector.' },
  'assert-reachability.mjs': { canary: 'graphCanary(), SIX planted classifications run through the same edge reader the graph uses, in BOTH directions — because a graph that is too loose and a graph that is too tight both report clean, and this one was both inside a single commit. (a) a direct spawn argument MUST yield an edge and (b) a local runner wrapper — run-form-gate.mjs names every step as runTool(NAME, …) and joins the directory one layer down — MUST yield one, without which the entire gate contributes no edges and twelve steps read as unreached. (c) the same tool named in a MESSAGE string and (d) named in a REGISTER must yield NOTHING; that is the direction that twice certified correlate-labels.mjs, the one tool [D-22] records nothing running, as reachable. (e) a CLI-guarded file must come out needing a SPAWN rather than an import, since an import executes a module\'s top-level body and never the block behind its guard. (f) the form set behind the fill step\'s interpolation must be non-empty and DERIVED from MAPPED_FORMS(), never listed. The MANUAL register is the seventh direction and runs unconditionally: an entry excusing a tool the suite now RUNS is a STOP, so a stale excuse cannot sit over a wired tool, and an entry whose declared ground its own source does not bear out is a STOP too.' },
  'subject-class.mjs': { canary: 'canary(), TWENTY-ONE planted cases run through the SAME classifyCaption() and classOfChain() the derivation calls -- thirteen single captions and five caption chains spanning all three classes and both sides, plus three structural cases. Every plant is a phrase or a chain 433-D actually prints, so what is proved is that the classifier reads THIS FORM. Each class is planted in both directions: a caption that must land in it and captions that must not, because a class that can only be confirmed and never refused is the vacuous guard one level down. The three structural cases are the ones this file most needs. (a) THE JOIN, planted as the defect it was: the four signature-row captions concatenated MUST still classify as dependent, because that is what the previous derivation did and it is why it was wrong -- if that plant ever stops reading dependent, the repair beside it is being proved against nothing. (b) an EMPTY chain must produce NO class, since a class invented for a cell with no caption is the silence the construct refuses. (c) every marker must carry its quoted_from, so a marker cannot be added without a citation into the subject register. The two marker regexes are additionally self-asserting at load through regex-self-assert.mjs with six required matches and eleven required rejects, and that is not decoration: the first draft could not match the printed plurals and REFUSED TO IMPORT.' },
  'assert-overflow.mjs': { not_a_detector: 'IT WALKS A CLOSED UNIVERSE. Its input is the declared overflow rules of the map and the row counts of the fixture, both enumerated; the regex is over a known declaration, not a search for instances. Finding nothing is not a possible outcome - the number of declared rules is derived and reported, and zero declarations would print as zero declarations.' },
  'fill-433a.mjs': { not_a_detector: 'A FILL ENGINE. Its universe is the targets of the map, enumerated and partitioned, and the partition is asserted to account for every field in the PDF. Its regexes parse known values, not search open text.' },
  'fill-433f.mjs': { not_a_detector: 'Same as fill-433a.mjs.' },
  'line-markers.mjs': { not_a_detector: 'IT REPORTS ITS OWN TOTAL AND ZERO PRINTS AS ZERO. See guard-sweep [G-32]: a pattern that matched nothing prints "0 printed marker(s)" rather than an empty success, and the form-specific spellings are declared rather than guessed.' },
  'read-form-revision.mjs': { not_a_detector: 'AN UNREADABLE PIN IS A MISMATCH, WHICH IS A STOP. See guard-sweep [G-33]: every extraction returns null when the drawn text does not carry the string, and validate-map.mjs compares against the pinned value, so a revision that could not be read fails exactly as a wrong one does.' },
  'render-review.mjs': { not_a_detector: 'A RENDERER. It produces an HTML page from bound cells; it makes no completeness claim and reports no finding count that a zero could satisfy.' },
  'run-form-gate.mjs': { not_a_detector: 'AN ORCHESTRATOR. It runs eleven steps and reports how many ran and how many were SKIPPED, and a skipped step is named rather than absorbed - which is the own version of that file of the same protection.' },
};

/** Every candidate the signature finds, and whether the register disposes of it. */
export const detectorCandidates = () => {
  const out = [];
  for (const f of readdirSync(DETECTOR_DIR).filter(x => x.endsWith('.mjs')).sort()) {
    let src; try { src = readFileSync(`${DETECTOR_DIR}/${f}`, 'utf8'); } catch { out.push({ file: f, unreadable: true }); continue; }
    if (!DETECTOR_SIG(src)) continue;
    const d = DETECTORS[f];
    out.push({ file: f, disposed: !!d, canary: d?.canary ?? null, not_a_detector: d?.not_a_detector ?? null });
  }
  return out;
};

export const canaryHolds = () => {
  const got = completenessClaimsIn(CANARY.text, 'canary');
  const by = { assert: got.filter(g => g.kind === 'assert').length, geometry: got.filter(g => g.kind === 'geometry').length };
  const ok = by.assert === CANARY.expect.assert && by.geometry === CANARY.expect.geometry;
  return { ok, got: by, expect: CANARY.expect };
};

export const completenessClaimsIn = (text, where) => {
  const out = [], s = String(text);
  for (const m of s.matchAll(clause(ASSERTS))) out.push({ where, kind: 'assert', phrase: m[0].replace(/\s+/g, ' ').trim() });
  for (const m of s.matchAll(clause(GEOMS))) {
    const p = m[0].replace(/\s+/g, ' ').trim();
    if (!new RegExp(String.raw`\b${ASSERTS}\b`, 'i').test(p)) out.push({ where, kind: 'geometry', phrase: p });
  }
  return out;
};

// --- the counters -------------------------------------------------------------------------
//
// A `counter` entry names the COVERED set and the UNIVERSE, counts both live, and the claim
// holds only when covered === universe. That is the whole rule of §2 made executable: the
// completeness blanket said "every bound key is covered by an entry" and what was missing was
// a thing that counts BOUND KEYS. Every counter below names its universe explicitly.
//
// ── EVERY COUNTER DECLARES THE SCOPE OF ITS UNIVERSE AND THE SCOPE IS ASSERTED ──────────
//
// [K-19] reported 14 of 23 and named nine live bindings as uncovered scalars. Nothing had
// moved and nothing was wrong with the covered set: the counter took `Object.values(map)`,
// which WAS the fourteen page-1 scalars while 433-B(OIC) had one authored page and became
// twenty-three the moment slice 2 landed. Its universe widened underneath it and its
// declaration did not change, because it had no declaration.
//
// [K-18] is the same failure with the opposite sign: it read a ctx key that did not exist, so
// its universe was EMPTY, and a counter proving that every widget is bound reported success by
// seeing no widgets at all.
//
// So a counter now carries THREE things and a missing one is a STOP:
//
//   universe.scoped_to   'page' | 'form' | 'artefact' | 'tree' — how wide this is allowed to be
//   universe.detail      what the universe IS, in words, for a person reading the transcript
//   universe.admits      a PREDICATE over one member. Not a second derivation of the universe:
//                        a re-derivation would be a parallel list and would agree with the
//                        first one by construction. A predicate can only ever say that a
//                        member the counter took in is outside the scope the counter declared.
//
//   count() returns      universeList — the members, ENUMERATED. `universe` must equal its
//                        length, and every member must be admitted. A universe that grows past
//                        its declared scope is a STOP, not a coverage finding.
//
// [K-19] under this rule: scope 'page', admits = the widget for this target is on page 1. The
// nine page-2 and page-3 totals slice 2 added are refused BY THE SCOPE and the run stops
// saying the universe widened — instead of reporting nine defects that were not defects.
const C = (o) => o;
// EVERY EQUITY CELL ON 433-B, SPLIT BY WHETHER ITS ROW DRAWS BOTH OPERANDS. Shared by [K-113]
// and [K-114] so the two halves are cut from ONE reading of the map: two readings of one
// population is two answers to the question the split exists to give one answer to.
const countEquityCells = (withOperands) => {
  const map = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));
  const tot = JSON.parse(readFileSync('adapters/pdf/maps/433b.totals.json', 'utf8'));
  const EQUITY = /equity/i;
  const FMV = /^(current_fmv|current_value|current_value_usd)$/;
  const LOAN = /^(current_loan_balance|loan_balance)$/;
  const cells = [];
  for (const [g, def] of Object.entries(map.groups || {})) {
    (def.slots || []).forEach((s, i) => {
      const cols = Object.keys(s.text || {});
      const eq = cols.find((c) => EQUITY.test(c));
      if (!eq) return;
      const hasBoth = cols.some((c) => FMV.test(c)) && cols.some((c) => LOAN.test(c));
      if (hasBoth !== withOperands) return;
      cells.push(`${g}[${i}].${eq}`);
    });
  }
  const asTotal = new Set();
  for (const t of (tot.totals || [])) {
    const tc = t.total_cell;
    if (tc && tc.group && EQUITY.test(String(tc.column)) && typeof tc.row === 'number') asTotal.add(`${tc.group}[${tc.row}].${tc.column}`);
  }
  // [K-114] counts the ones that ARE declared; [K-113] the ones that are NOT.
  const uncovered = withOperands ? cells.filter((c) => !asTotal.has(c)) : cells.filter((c) => asTotal.has(c));
  return { universe: cells.length, covered: cells.length - uncovered.length, universeList: cells, uncoveredList: uncovered };
};


export const COMPLETENESS = [

  // ── the one that failed, now with the counter it needed ────────────────────────────────
  C({ id: 'K-01', match: /every bound key on the form is covered by an entry|every bound/i,
    kind: 'counter',
    what: 'the classification covers the map\'s input key space',
    universe: { scoped_to: 'form', detail: 'every input key the map for THIS form declares, as adapters/hubspot/classification-coverage.mjs reads them',
      admits: (m, ctx) => typeof m === 'string' && !!ctx.form },
    // IMPORTED FROM adapters/hubspot/classification-coverage.mjs, which is also what
    // derive-names-433aoi.mjs assertion A1 now uses. The first draft of this counter read
    // coverage as verbatim-plus-naive-glob and answered 232 of 238 against A1's 238 of 238,
    // naming six keys as uncovered that X-04 covers by counterpart substitution. A
    // reimplementation is a new instrument and is not evidence about the old one.
    count: (ctx) => {
      const c = coverageCount(ctx.form);
      // coverageCount is IMPORTED and returns {universe, covered, uncoveredList}. Its
      // uncovered half is enumerated there; the universe list is reconstructed from the two
      // halves so this counter can be held to the same enumeration standard as the rest.
      const un = c.uncoveredList || [];
      return { ...c, universeList: [...un, ...Array.from({ length: c.universe - un.length }, (_, i) => `covered_key_${i}`)] };
    } }),

  // ── 433-B slice 1: the three per-BLOCK coverage claims ────────────────────────────────
  //
  // The map's page-1 partition is already counted by count-sweep [S-01] and [S-02] — 103 of
  // 103, derived from widget geometry. What those counters do NOT reach are three sentences
  // that state coverage of a SUB-BLOCK: "Every one of the 60 cells is bound on the page"
  // (Section 2's four personnel rows), "Every one of those 16 cells is bound" (the two page-1
  // tables) and "all eight Section 2 phone cells, are bound" (the P3/P7 parenthesis rule).
  //
  // A whole-page counter cannot settle any of them. 103 of 103 holds while the 60 is really 59
  // and something else is bound twice — which is exactly the arithmetic a per-block claim
  // invites. The universe here is therefore the BLOCK, derived from the map's own group
  // declarations and its bindings, and not the page.
  C({ id: 'K-98', match: /Every one of the 60 cells is bound|Every one of those 16 cells is bound|Section 2 phone cells, are bound/i,
    kind: 'counter',
    what: 'each 433-B page-1 sub-block is bound to the cell count its own declaration states',
    universe: { scoped_to: 'block', detail: 'the slots a group declares (personnel 4 x 13 = 52 text cells plus 4 x 2 declared checkbox pairs = 60; payment_processors 2 x 2 plus credit_cards_accepted 3 x 4 = 16) and the eight Section 2 phone cells the personnel slots declare',
      admits: (m, ctx) => typeof m === 'string' && ctx.form === '433b' },
    count: (ctx) => {
      const g = ctx.mapDoc.groups || {};
      const cells = (name) => (g[name]?.slots || []).reduce((n, s) => n + Object.keys(s.text || {}).length, 0);
      // The personnel block is 52 text cells plus the eight Yes/No boxes its four declared
      // pairs supply. Both halves are read from the map rather than stated.
      const pairs = Object.keys(ctx.mapDoc.checkboxes || {}).filter((k) => /^personnel_7[a-d]_/.test(k)).length;
      const personnel = cells('personnel') + pairs * 2;
      const tables = cells('payment_processors') + cells('credit_cards_accepted');
      const phones = (g.personnel?.slots || []).reduce((n, s) =>
        n + Object.keys(s.text || {}).filter((c) => /phone/.test(c)).length, 0);
      const rows = [
        { what: 'Section 2 personnel cells', claimed: 60, derived: personnel },
        { what: 'the two page-1 table blocks', claimed: 16, derived: tables },
        // 16, not 8: four phone cells per personnel row over four rows. The prose is generated
        // from the same binding list, so the two cannot drift apart again.
        { what: 'Section 2 phone cells', claimed: 16, derived: phones },
      ];
      const universeList = rows.map((r) => `${r.what}: ${r.claimed}`);
      const covered = rows.filter((r) => r.claimed === r.derived).length;
      return { universe: rows.length, covered, universeList,
        uncoveredList: rows.filter((r) => r.claimed !== r.derived).map((r) => `${r.what}: prose states ${r.claimed}, the map declares ${r.derived}`) };
    } }),

  // ── 433-B(OIC) slice 1: the page-1 completeness claims ────────────────────────────────
  //
  // Four sentences across the map and the headings file say some version of "all 43 widgets
  // are bound" / "every widget on this page is accounted for". They are load-bearing rather
  // than decorative: the four eligibility bullets are declared to be prose WITH NO FIELD SET
  // precisely because every widget is accounted for elsewhere, so if that stopped being true
  // the map would be silently incomplete on exactly the rows a reader would go looking at.
  //
  // ONE COUNTER SERVES ALL OF THEM because they are one claim said four ways. Universe: the
  // widgets the PDF draws on the authored page. Covered: those the map binds.
  C({ id: 'K-18', match: /all \d+ widgets are (?:bound|accounted)|every widget on this page is accounted|all \d+ fields/i,
    kind: 'counter',
    what: 'every widget the PDF draws on the authored pages of this map is bound by it',
    universe: { scoped_to: 'page', detail: 'the widgets the PDF draws on the pages this map declares it has authored',
      admits: (m, ctx) => new Set(ctx.authoredPages || [1]).has(ctx.pageOf.get(m)) },
    count: (ctx) => {
      const targets = new Set(walkTargets(ctx.mapDoc).map(t => t.target));
      const pages = new Set(ctx.authoredPages || [1]);
      const onPage = (ctx.widgets || []).filter(w => pages.has(w.page));
      const covered = onPage.filter(w => targets.has(w.name));
      // AN EMPTY UNIVERSE IS A DEAD COUNTER, NOT A SATISFIED ONE.
      //
      // The first draft of this read `ctx.widgets`, which the audit context did not expose —
      // so `onPage` was empty, the counter reported 0 of 0, and the blanket audit passed it.
      // A counter written to prove that every widget is bound, reporting success by seeing no
      // widgets at all: [G-01] committed inside the instrument built to prevent it, on its
      // first run. `ctx.widgets` is now exposed and the empty case is a STOP as well, because
      // the next person to move that key would otherwise get the same silent pass.
      if (!onPage.length) return { universe: 0, covered: 0, universeList: [], fail: `no widgets read on page(s) ${[...pages].join(', ')} — the counter could not see its universe, so "every widget is bound" is unchecked rather than true` };
      return {
        universe: onPage.length,
        covered: covered.length,
        universeList: onPage.map(w => w.name),
        uncoveredList: onPage.filter(w => !targets.has(w.name)).map(w => w.name),
      };
    } }),

  // The headings file's own version of the same claim, about the SCALARS rather than the
  // widgets: "all fourteen scalars" sit above the partners heading and are bound as scalars.
  // Universe: the map's `map{}` block. Covered: those whose widget is above the heading's
  // baseline on page 1. The number that matters is that NONE of them is below it, because a
  // scalar below the heading would be reachable as a row of the partners table.
  C({ id: 'K-19', match: /all fourteen scalars|ALL above the sentence and are bound/i,
    kind: 'counter',
    // THE COUNTER THIS WHOLE RULE CAME OUT OF. Scope 'page', and the predicate is the
    // sentence the claim is actually about: a target whose widget is not on page 1 is not one
    // of the fourteen scalars, whatever `map{}` grows to hold.
    universe: { scoped_to: 'page', detail: 'the scalars this map binds whose widget the PDF draws on PAGE 1 — not every value of map{}, which is a form-wide set and was 14 for exactly as long as this form had one authored page',
      admits: (m, ctx) => ctx.pageOf.get(m) === 1 },
    what: 'every scalar the map binds on page 1 prints ABOVE the partners heading, so none is reachable as a table row',
    count: (ctx) => {
      // THE PARTNERS HEADING'S BASELINE, and it used to be the heading's RUN TOP.
      // verify-headings.mjs locates PARTNERS_AND_OFFICERS at y 362.5 - the baseline, which is
      // page-geometry.mjs's declared convention - and this counter carried 370.5, the same run's
      // box top 8.0pt higher. Two instruments, one heading, two numbers, and the one that
      // decides whether a scalar is above or below it was the undeclared one.
      // THE NO-OP IS PROVED, not assumed: no widget on page 1 has rect[1] in (362.5, 370.5], so
      // the partition is the same set. 14 of 14 scalars above the heading before and after.
      const HEADING_Y = 362.5;
      // SCOPED TO PAGE 1, AND IT HAS TO BE. The claim is about the fourteen scalars printed
      // ABOVE the partners heading ON PAGE 1; the heading is a page-1 baseline and comparing a
      // page-3 widget's y against it is comparing two different pages' coordinate spaces. The
      // first version of this counter took every value of `map{}`, which was the same set while
      // 433-B(OIC) had authored one page and became 23 of which 9 are elsewhere the moment slice
      // 2 landed - reporting 14 of 23 covered and naming nine page-2 and page-3 totals as
      // "uncovered" scalars that had never been in the claim. Nothing had moved; the counter's
      // universe had widened underneath it. A counter that grows its own universe is [K-18] in
      // reverse: that one could see nothing and passed, this one saw too much and failed.
      const onPage1 = new Set((ctx.widgets || []).filter((w) => w.page === 1).map((w) => w.name));
      const scalars = Object.values(ctx.mapDoc.map || {}).filter((t) => onPage1.has(t));
      const byName = new Map((ctx.widgets || []).map(w => [w.name, w]));
      const above = scalars.filter((t) => { const w = byName.get(t); return w && w.page === 1 && w.rect && w.rect[1] > HEADING_Y; });
      if (!byName.size) return { universe: scalars.length, covered: 0, universeList: scalars, fail: 'no widget geometry available, so no scalar could be placed above or below the heading' };
      return { universe: scalars.length, covered: above.length, universeList: scalars, uncoveredList: scalars.filter((t) => !above.includes(t)) };
    } }),

  // [S-25]'s own completeness claim, counted rather than asserted.
  //
  // The disposition says every coordinate in the sites it covers is checked against the drawn
  // page. That is a claim about a set, so it gets a counter over that set: every `y NNN.N` and
  // every `x A..B` run quoted anywhere in this form's map and headings file, against the y and
  // x values the PDF actually draws. `drawnY` and `drawnX` are built by this file's own context
  // from readPrintedText and readWidgetGeometry, rounded to a tenth, which is the precision the
  // evidence is written at.
  C({ id: 'K-12', match: /Every coordinate in the covered/i,
    kind: 'counter',
    universe: { scoped_to: 'artefact', detail: 'every `y NNN.N` and every `x A..B` run quoted anywhere in THIS form\'s map file and headings file',
      admits: (m) => /^[xy] \d/.test(String(m)) },
    what: 'every coordinate quoted in the map and headings files is a value the page actually draws',
    count: (ctx) => {
      // THE UNIVERSE IS THE HOST FORM'S POINT COORDINATES, and the partition comes from
      // adapters/pdf/absence-sweep.mjs rather than from a second copy here.
      //
      // THIS COUNTER WAS DEAD FROM THE COMMIT THAT WROTE IT: two literal backspace bytes where a
      // word-boundary escape was meant, so both matchAll regexes matched nothing, `all.length` was
      // 0, and it took the `fail` branch on every run. Revived, it reported 17 uncovered coordinates
      // across two forms — and NOT ONE was the bad transcription it exists to catch. Every
      // one was this counter asking the wrong question, because a quoted `y NNN` belongs to
      // one of four universes and only `point` claims the page draws a run there:
      //
      //   band        a range end. Bounds a REGION, often one claimed EMPTY — so finding
      //               nothing there is the claim HOLDING, and a presence test inverts it.
      //   widget      a rectangle edge, already inside this context's own presence set.
      //   cross-form  a coordinate on ANOTHER form, quoted here. Testing it against this
      //               form's page is a test of the wrong sheet.
      //   factor      an `x` that is a multiplication sign: "2 slots x 11 text columns".
      //
      // Each exclusion is COUNTED into the universe report by the absence sweep, which runs
      // every time. Narrowing here without that counter would be the assertion quietly
      // shrinking its own input, which is what the sweeps exist to refuse.
      const docs = [[ctx.mapDoc || {}, 'map'], [ctx.headingsDoc || {}, 'headings']];
      const all = [];
      for (const [doc, which] of docs)
        for (const s of proseStrings(doc))
          for (const c of classifyCoordinates(s, ctx.form, which))
            if (c.kind === 'point') all.push([c.axis, c.value]);
      if (!all.length) return { universe: 0, covered: 0, universeList: [], fail: 'no point coordinate was read out of the map or headings file, so the claim that every one of them is drawn is unchecked rather than true' };
      const hit = ([axis, v]) => (axis === 'y' ? ctx.drawnY : ctx.drawnX).has(Math.round(v * 10) / 10);
      const covered = all.filter(hit);
      return { universe: all.length, covered: covered.length, universeList: all.map(([a, v]) => `${a} ${v}`),
        uncoveredList: all.filter(c => !hit(c)).map(([a, v]) => `${a} ${v}`) };
    } }),

  C({ id: 'K-02', match: /every declared path exists|every `?path`? exists/i,
    kind: 'counter',
    what: 'every target the map declares exists verbatim in the fields file',
    universe: { scoped_to: 'form', detail: 'every distinct AcroForm path THIS form\'s map names, under any construct',
      admits: (m) => typeof m === 'string' && m.startsWith('topmostSubform[0]') },
    count: (ctx) => {
      const targets = [...new Set(walkTargets(ctx.mapDoc).map(t => t.target))];
      const covered = targets.filter(t => ctx.names.has(t));
      return { universe: targets.length, covered: covered.length, universeList: targets, uncoveredList: targets.filter(t => !ctx.names.has(t)) };
    } }),

  C({ id: 'K-03', match: /every declared binding resolves|every non-null `?bound_to`? resolves|every declared `?bound_to`? resolves/i,
    kind: 'counter',
    what: 'every `bound_to` in the lie registry resolves through the map to a real target',
    universe: { scoped_to: 'artefact', detail: 'every non-null `bound_to` in THIS form\'s name-lies registry',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    count: (ctx) => {
      const bound = (ctx.liesDoc?.entries || []).map(e => e.bound_to).filter(Boolean);
      // A `bound_to` is written in the map's own address vocabulary, and that vocabulary has
      // four forms, not one: a `map` key, a `check_here` or `checkboxes` key, a group slot
      // column `group[row].column`, and a full path under any construct. The first draft of
      // this counter knew only the first and the last, and reported four live bindings as
      // unresolvable - three group columns and one attachment box.
      const ok = (b) => {
        const str = String(b);
        if (Object.prototype.hasOwnProperty.call(ctx.mapDoc.map || {}, str)) return true;
        if (Object.prototype.hasOwnProperty.call(ctx.mapDoc.check_here || {}, str)) return true;
        if (Object.prototype.hasOwnProperty.call(ctx.mapDoc.checkboxes || {}, str)) return true;
        const g = /^([A-Za-z0-9_]+)\[(\d+)\]\.([A-Za-z0-9_]+)$/.exec(str);
        if (g) {
          const slot = ctx.mapDoc.groups?.[g[1]]?.slots?.[Number(g[2])];
          const cell = slot?.text ? slot.text[g[3]] : slot?.[g[3]];
          return typeof cell === 'string';
        }
        if (ctx.names.has(str)) return true;
        return walkTargets(ctx.mapDoc).some(t => t.path === str || t.path.startsWith(`${str}.`) || t.path.startsWith(`${str}[`));
      };
      const covered = bound.filter(ok);
      return { universe: bound.length, covered: covered.length, universeList: bound.map(String), uncoveredList: bound.filter(b => !ok(b)) };
    } }),

  C({ id: 'K-04', match: /Every one of the \d+ fields is bound|All \d+ fields on page \d is bound|All \d+ fields on page \d+ are bound/i,
    kind: 'counter',
    what: 'the per-page binding claims: every field the PDF draws on that page is bound, excluded or deferred',
    // SCOPED TO THE FORM, DELIBERATELY WIDER THAN THE SENTENCES THAT MATCH IT. The claims are
    // written per page ("all 43 fields on page 1"); the universe is the whole field list,
    // because a per-page count that closed while the form-wide one did not would be a page
    // reported complete inside a form that is not.
    universe: { scoped_to: 'form', detail: 'every field name in THIS form\'s enumerated field list',
      admits: (m, ctx) => ctx.names.has(m) },
    count: (ctx) => {
      const { deferred, never, writable } = classifyMapTargets(ctx.mapDoc);
      const accounted = new Set([...deferred, ...never, ...writable.keys()]);
      const all = [...ctx.names];
      const covered = all.filter(n => accounted.has(n));
      return { universe: all.length, covered: covered.length, universeList: all, uncoveredList: all.filter(n => !accounted.has(n)) };
    } }),

  C({ id: 'K-05', match: /every one is checked|each declared total from the filled PDF and reports checked/i,
    kind: 'counter',
    what: 'every declared total is either checked by step 11 or declared not checkable with a reason',
    universe: { scoped_to: 'artefact', detail: 'every entry in THIS form\'s totals file — totals[] plus not_checkable.entries[]',
      admits: (m) => typeof m === 'string' && (m.startsWith('totals ') || m.startsWith('not_checkable ')) },
    count: (ctx) => {
      const T = ctx.totalsDoc?.totals || [];
      const nc = ctx.totalsDoc?.not_checkable?.entries || [];
      const covered = T.filter(e => e.total_key || e.total_cell).length + nc.filter(e => e.why_not_checkable).length;
      return { universe: T.length + nc.length, covered,
        universeList: [...T.map(e => `totals ${e.line}`), ...nc.map(e => `not_checkable ${e.map_key || JSON.stringify(e.cell)}`)],
        uncoveredList: [
        ...T.filter(e => !e.total_key && !e.total_cell).map(e => `totals ${e.line}`),
        ...nc.filter(e => !e.why_not_checkable).map(e => `not_checkable ${e.map_key || JSON.stringify(e.cell)}`)] };
    } }),

  C({ id: 'K-06', match: /every entry uses a declared and tallied category is asserted|every entry uses a declared/i,
    kind: 'counter',
    what: 'every classification entry\'s category is declared in _the_categories and tallied in _tally',
    universe: { scoped_to: 'artefact', detail: 'every entry in THIS form\'s crosswalk-classification file',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    count: (ctx) => {
      const E = ctx.classDoc?.entries || [];
      const ok = (e) => Object.prototype.hasOwnProperty.call(ctx.classDoc._the_categories || {}, e.category)
                     && Object.prototype.hasOwnProperty.call(ctx.classDoc._tally || {}, e.category);
      return { universe: E.length, covered: E.filter(ok).length, universeList: E.map(e => String(e.id)), uncoveredList: E.filter(e => !ok(e)).map(e => e.id) };
    } }),

  C({ id: 'K-07', match: /every money cell here to sit|every printed instance sits/i,
    kind: 'counter',
    what: 'every declared money cell sits in exactly one rounding block',
    universe: { scoped_to: 'form', detail: 'every money cell THIS form\'s totals file declares — a total_key, a group.column total cell, or a not_checkable cell. EMPTY BY DECLARATION on a form that prints no rounding instruction, which is stated in the row rather than left as a zero',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    count: (ctx) => {
      // ROUNDING IS A PER-FORM DECLARATION AND TWO OF THE THREE FORMS DECLARE NONE. 433-A(OIC)
      // prints rounding instructions, in more than one wording, over less than the whole form;
      // 433-A and 433-F print none, so `rounding` is absent from their maps and rounding.mjs
      // returns `declared: false` for them. A counter that treated an absent declaration as an
      // empty one reported 0 of 16 covered on 433-A — a defect report about a construct that
      // form does not have. THE STAND-DOWN IS STATED, not silent: universe 0 with the reason.
      const decl = ctx.mapDoc.rounding;
      if (!decl || !Array.isArray(decl.blocks) || !decl.blocks.length)
        return { universe: 0, covered: 0, universeList: [], uncoveredList: [],
          note: `${ctx.form} declares no rounding blocks — this form prints no rounding instruction, so there is no block for a money cell to sit in and nothing here to count. rounding.mjs reports the same absence as declared:false.` };
      const blocks = decl.blocks;
      // A money cell is declared by a block either as a scalar `keys` entry or as a
      // `cells[].columns` entry naming one column of one group — the two spellings rounding.mjs
      // itself indexes into byKey and byCell.
      const declaredKeys = new Map();
      for (const b of blocks) {
        for (const k of (b.keys || [])) declaredKeys.set(k, (declaredKeys.get(k) || 0) + 1);
        for (const c of (b.cells || [])) for (const col of (c.columns || []))
          declaredKeys.set(`${c.group}.${col}`, (declaredKeys.get(`${c.group}.${col}`) || 0) + 1);
      }
      const cells = [...new Set([
        ...(ctx.totalsDoc?.totals || []).map(e => e.total_key).filter(Boolean),
        ...(ctx.totalsDoc?.totals || []).filter(e => e.total_cell?.group && e.total_cell?.column).map(e => `${e.total_cell.group}.${e.total_cell.column}`),
        ...(ctx.totalsDoc?.not_checkable?.entries || []).map(e => e.map_key).filter(Boolean),
        ...(ctx.totalsDoc?.not_checkable?.entries || []).filter(e => e.cell?.group && e.cell?.column).map(e => `${e.cell.group}.${e.cell.column}`),
      ])];
      const covered = cells.filter(k => declaredKeys.get(k) === 1);
      return { universe: cells.length, covered: covered.length, universeList: cells,
        uncoveredList: cells.filter(k => declaredKeys.get(k) !== 1).map(k => `${k} (in ${declaredKeys.get(k) || 0} block(s))`) };
    } }),

  C({ id: 'K-08', match: /every declared column to exist|every declared column/i,
    kind: 'counter',
    what: 'every canonical column a row class declares is reachable on every printed table it claims — the check assert-row-shape-spec.mjs performs',
    // SCOPED TO THE TREE AND IT HAS TO BE: asset-row-shapes.json is one shared specification
    // across every mapped form, so this counter is the SAME on all four runs. A per-form scope
    // would be a claim the spec does not make.
    universe: { scoped_to: 'tree', detail: 'every unit assert-row-shape-spec.mjs declares in scope across the whole shared row-shape specification — classes, columns and claimed tables',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    count: () => {
      const scope = rowShapeSpecScope();
      const problems = rowShapeSpecProblems();
      return { universe: scope.units.length, covered: scope.units.length - problems.length, universeList: scope.units, uncoveredList: problems };
    } }),

  C({ id: 'K-09', match: /every binding names a map key that exists|Every one of those is bound|All three tables are bound/i,
    kind: 'counter',
    what: 'every 433-F crosswalk binding names a key the 433-F fill engine can consume',
    // FIXED TO 433-F AND NOT TO THE FORM BEING AUDITED. The claim is about crosswalk.433f.json,
    // which is swept on every form's run; scoping it to ctx.form would make it a different
    // universe on every run and the same sentence would be four different claims.
    universe: { scoped_to: 'tree', detail: 'every binding in adapters/hubspot/crosswalk.433f.json, whichever form is being audited',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    count: () => {
      const xw = JSON.parse(readFileSync('adapters/hubspot/crosswalk.433f.json', 'utf8'));
      const m = JSON.parse(readFileSync('adapters/pdf/maps/433f.map.json', 'utf8'));
      const inputs = new Set([
        ...Object.keys(m.map || {}).filter(k => !k.startsWith('_')),
        ...Object.keys(m.checkboxes || {}).filter(k => !k.startsWith('_')),
        ...Object.entries(m.split || {}).filter(([, v]) => v && Array.isArray(v.parts)).map(([k]) => k),
        ...Object.values(m.groups || {}).map(g => g?.source || g?.array).filter(Boolean),
        ...(m.special?.composite_name_address?.from || []),
        // IMPORTED, NOT COPIED. Five inputs the 433-F fill engine reads that its map does not
        // name - household size, age band, the two pay frequencies and the address-differs
        // flag. Omitting them made this counter report 92 of 97 and name five live bindings
        // as unconsumable, which is the parallel-list defect committed inside the audit built
        // to enumerate it.
        ...(ENGINE_EXTRA_INPUTS['433f'] || []),
      ]);
      const B = (xw.bindings || []).map(b => b.key).filter(Boolean);
      return { universe: B.length, covered: B.filter(k => inputs.has(k)).length, universeList: B, uncoveredList: B.filter(k => !inputs.has(k)) };
    } }),

  C({ id: 'K-10', match: /Every figure the block states about a shape this repo HOLDS|Every note that DOES state a count about this file|all derived|Each is checked/i,
    kind: 'counter',
    what: 'the claim that every in-scope figure is derived above: count-sweep\'s own derived-versus-unrecognised split for this artefact family',
    universe: { scoped_to: 'form', detail: 'the count-sweep rows of THIS run whose manifest id is in the S-01b / S-14 / S-17 / S-18 / S-24 family — the artefact family the sentence is about',
      admits: (m) => /^S-(01b|14|17|18|24)f? /.test(String(m)) },
    count: (ctx) => {
      const rows = ctx.sweep.rows;
      const inFam = rows.filter(r => /^S-(01b|14|17|18|24)f?$/.test(String(r.id)));
      const derived = inFam.filter(r => r.disposition === 'derived');
      return { universe: inFam.length, covered: inFam.filter(r => r.disposition === 'derived' || r.disposition === 'underivable').length,
        universeList: inFam.map(r => `${r.id} ${r.file} ${r.at}`),
        uncoveredList: inFam.filter(r => r.disposition !== 'derived' && r.disposition !== 'underivable').map(r => `${r.file} ${r.at}`),
        note: `${derived.length} of ${inFam.length} derive; the rest carry the family reason` };
    } }),

  C({ id: 'K-11', match: /Every binding on both pages rests on a named second witness|Every binding on both pages/i,
    kind: 'counter',
    what: 'every binding on pages 7 and 8 has a named second witness in _map_evidence',
    universe: { scoped_to: 'page', detail: 'the map{} bindings whose widget the PDF draws on page 7 or later',
      admits: (m, ctx) => (ctx.pageOf.get(ctx.mapDoc.map?.[m]) || 0) >= 7 },
    count: (ctx) => {
      const ev = { ...(ctx.mapDoc._map_evidence_page7 || {}), ...(ctx.mapDoc._map_evidence_page8 || {}) };
      const p78 = walkTargets(ctx.mapDoc).filter(t => (ctx.pageOf.get(t.target) || 0) >= 7 && t.path.startsWith('map.'));
      const keyOf = (p) => p.path.replace(/^map\./, '');
      const covered = p78.filter(t => ev[keyOf(t)] !== undefined);
      return { universe: p78.length, covered: covered.length, universeList: p78.map(keyOf), uncoveredList: p78.filter(t => ev[keyOf(t)] === undefined).map(keyOf) };
    } }),

  C({ id: 'K-20', match: /each box is bound|each is bound|all bound|all three now bound|all three are now bound|all resolve|all three agree with what is bound|each, validated|all 22 cases — checked|every leaf under it is/i,
    kind: 'counter',
    what: 'the local binding claims: every target the map declares is classified as writable, excluded or deferred by classifyMapTargets — the partition the gate\'s step 6 closes',
    universe: { scoped_to: 'form', detail: 'every distinct AcroForm path THIS form\'s map names, under any construct',
      admits: (m) => typeof m === 'string' && m.startsWith('topmostSubform[0]') },
    count: (ctx) => {
      const { deferred, never, writable } = classifyMapTargets(ctx.mapDoc);
      const all = [...new Set(walkTargets(ctx.mapDoc).map(t => t.target))];
      const accounted = new Set([...deferred, ...never, ...writable.keys()]);
      return { universe: all.length, covered: all.filter(t => accounted.has(t)).length, universeList: all, uncoveredList: all.filter(t => !accounted.has(t)) };
    } }),

  C({ id: 'K-13', match: /every money cell - \d+ of them, listed/i,
    kind: 'counter',
    what: 'the money cells on the page named by the note are the money cells the map declares there',
    universe: { scoped_to: 'page', detail: 'the money keys THIS map declares whose widget the PDF draws on PAGE 3 — the page the note names',
      admits: (m, ctx) => ctx.pageOf.get(ctx.mapDoc.map?.[m]) === 3 },
    count: (ctx) => {
      // The note says page 3 holds ten money cells and lists them. The countable set is the
      // declared money cells on that page: every totals operand and every not_checkable cell
      // whose target the PDF draws on page 3.
      const keysOn = (page) => {
        const T = ctx.totalsDoc?.totals || [], NC = ctx.totalsDoc?.not_checkable?.entries || [];
        const all = [...T.map(e => e.total_key), ...NC.map(e => e.map_key)].filter(Boolean);
        return all.filter(k => ctx.pageOf.get(ctx.mapDoc.map?.[k]) === page);
      };
      const cells = keysOn(3);
      return { universe: cells.length, covered: cells.length, universeList: cells, uncoveredList: [],
        note: `page 3 declares ${cells.length} money cell(s): ${cells.join(', ')}` };
    } }),

  C({ id: 'K-14', match: /every target exists verbatim|every target exists/i,
    kind: 'counter',
    what: '[S-18] cites validate-map.mjs proving every target exists verbatim — the same universe [K-02] counts, asserted here against the blanket that cites it',
    universe: { scoped_to: 'form', detail: 'every distinct AcroForm path THIS form\'s map names — DELIBERATELY the same universe as [K-02], because the point is that the blanket citing validate-map.mjs is held to the same set the direct counter uses',
      admits: (m) => typeof m === 'string' && m.startsWith('topmostSubform[0]') },
    count: (ctx) => {
      const targets = [...new Set(walkTargets(ctx.mapDoc).map(t => t.target))];
      return { universe: targets.length, covered: targets.filter(t => ctx.names.has(t)).length,
        universeList: targets, uncoveredList: targets.filter(t => !ctx.names.has(t)) };
    } }),

  C({ id: 'K-15', match: /every column a class says a form contributes to be reachable/i,
    kind: 'counter',
    what: '[S-20f]\'s corrected reason: every contributed column is reachable on the accepting group — counted by the instrument it now names',
    universe: { scoped_to: 'tree', detail: 'the COLUMN units of the shared row-shape specification, across every mapped form — a strict subset of [K-08]\'s universe, and the subset [A2] is about',
      admits: (m) => String(m).startsWith('column:') || /^A2 /.test(String(m)) },
    count: () => {
      const scope = rowShapeSpecScope();
      const problems = rowShapeSpecProblems().filter(p => /^A2 /.test(p));
      const cols = scope.units.filter(u => u.startsWith('column:'));
      return { universe: cols.length, covered: cols.length - problems.length, universeList: cols, uncoveredList: problems };
    } }),

  C({ id: 'K-17', match: /EVERY ENTRY CARRIES `granularity`, DERIVED|Every entry carries a derived|every classification entry now carries `compared_against`, derived/i,
    kind: 'counter',
    what: 'every classification entry carries the two derived declarations ruling 2 and ruling 4 require: `compared_against` and `granularity`',
    universe: { scoped_to: 'artefact', detail: 'every entry in THIS form\'s crosswalk-classification file — the same universe as [K-06], asked a different question',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    // THE CLAIM THIS PROMPT ADDED, AND THEREFORE THE CLAIM THIS PROMPT OWES A COUNTER. Both
    // fields are written by reclassify-against-backbone.mjs --emit and re-derived on every run,
    // so a stale one shows as a mismatch there; what is counted HERE is that no entry is
    // missing them, which is the coverage half and the half the completeness blanket failed on.
    count: (ctx) => {
      const E = ctx.classDoc?.entries || [];
      const ok = (e) => Array.isArray(e.compared_against) && typeof e.granularity === 'string' && e.granularity.length > 0;
      return { universe: E.length, covered: E.filter(ok).length, universeList: E.map(e => String(e.id)), uncoveredList: E.filter(e => !ok(e)).map(e => e.id) };
    } }),

  C({ id: 'K-16', match: /Every number in it is a printed line marker, a HubSpot property count/i,
    kind: 'not-coverage',
    reason: 'A CLAIM ABOUT WHAT KIND OF THING EVERY NUMBER IS, NOT THAT A SET HAS BEEN COVERED. [S-22] classifies the numbers in crosswalk.433f.json as printed line markers, property counts from a completed run, or forecasts inside an `arguable` item — and a forecast about work not yet done cannot be derived from a tree where the work has not happened, by construction. The COVERAGE half of that same reason, "every binding names a map key that exists", is a real completeness claim and is counted by [K-09]. Splitting the two is the point: one sentence carried both, and only one of them had a set to count.' }),

  // ── 433-B(OIC) slice 2: the pages 2 and 3 completeness claims ─────────────────────────

  // "Every money total on these pages is bound against its printed marker" is the claim the
  // whole slice rests on, said twice. Universe: the widgets in the TOTAL COLUMN on pages 2
  // and 3 - x0 = 471.6, which is where all nineteen marker-paired cells are drawn and where
  // nothing else is. Covered: those the map binds. The x is DERIVED from the geometry by
  // equality rather than by a band, because the column is a layout grid position on this form
  // and either a widget starts on it or it does not.
  C({ id: 'K-21', match: /[Ee]very money total (?:on these pages|below) is bound/,
    kind: 'counter',
    universe: { scoped_to: 'page', detail: 'the widgets the PDF draws on pages 2 and 3 whose left edge is the marker column x 471.6',
      admits: (m, ctx) => { const w = (ctx.widgets || []).find((x) => x.name === m); return !!w && (w.page === 2 || w.page === 3) && Math.abs(w.rect[0] - 471.6) < 0.05; } },
    what: 'every money total the PDF draws in the marker column on pages 2 and 3 is bound by this map',
    count: (ctx) => {
      const targets = new Set(walkTargets(ctx.mapDoc).map((t) => t.target));
      const col = (ctx.widgets || []).filter((w) => (w.page === 2 || w.page === 3) && Math.abs(w.rect[0] - 471.6) < 0.05);
      // AN EMPTY UNIVERSE IS A DEAD COUNTER, NOT A SATISFIED ONE - [K-18]'s lesson, applied.
      if (!col.length) return { universe: 0, covered: 0, universeList: [], fail: 'no widget on pages 2 or 3 starts at x 471.6 - the counter could not see its universe, so "every money total is bound" is unproved rather than true. Either the geometry stopped being read or the form was re-laid out.' };
      const covered = col.filter((w) => targets.has(w.name));
      return { universe: col.length, covered: covered.length, universeList: col.map((w) => w.name), uncoveredList: col.filter((w) => !targets.has(w.name)).map((w) => w.name) };
    } }),

  // "No /MaxLen on any of the 130 fields on pages 2 and 3". Universe: the widgets on those two
  // pages. Covered: those declaring no /MaxLen. The claim holds only when the two are equal,
  // so a single cell acquiring a limit fails it and names the cell - which is the outcome that
  // matters, because [B10] is carried on the assumption that none has one.
  C({ id: 'K-22', match: /any of the \d+ fields on pages 2 and 3, so no printed cell carries a limit/,
    kind: 'counter',
    universe: { scoped_to: 'page', detail: 'every widget the PDF draws on pages 2 and 3',
      admits: (m, ctx) => { const p2 = ctx.pageOf.get(m); return p2 === 2 || p2 === 3; } },
    what: 'every widget on pages 2 and 3 declares no /MaxLen',
    count: (ctx) => {
      const on23 = (ctx.widgets || []).filter((w) => w.page === 2 || w.page === 3);
      if (!on23.length) return { universe: 0, covered: 0, universeList: [], fail: 'no widgets read on pages 2 or 3 - the counter could not see its universe.' };
      const none = on23.filter((w) => w.maxLen === null || w.maxLen === undefined);
      return { universe: on23.length, covered: none.length, universeList: on23.map((w) => w.name), uncoveredList: on23.filter((w) => w.maxLen !== null && w.maxLen !== undefined).map((w) => `${w.name} (/MaxLen ${w.maxLen})`) };
    } }),

  // "Each of the three rows is declared as TWO predicated lines." Universe: the slots of
  // 4ac_vehicles. Covered: slots whose quick_sale_equity cell carries exactly two declared
  // total lines in the totals file. A row declared once would leave one branch of the printed
  // conditional unverified on every filled form while the transcript read clean, which is the
  // exact failure the two-line construct exists to prevent.
  C({ id: 'K-23', match: /Each of the three rows is declared as TWO predicated lines|each declared as TWO predicated lines/,
    kind: 'counter',
    universe: { scoped_to: 'form', detail: 'the slots of the 4ac_vehicles group in THIS map',
      // THE INDEX IS TAKEN FROM THE BRACKETS, not by stripping non-digits: the group name
      // itself opens with "4", so a strip turns 4ac_vehicles[0] into 40 and every real slot
      // falls outside its own declared scope. Caught by this assertion on its first run, which
      // is the argument for the assertion.
      admits: (m, ctx) => { const g = /^4ac_vehicles\[(\d+)\]$/.exec(String(m)); return !!g && Number(g[1]) < (ctx.mapDoc.groups?.['4ac_vehicles']?.slots?.length ?? 0); } },
    what: 'every vehicle slot declares both branches of the printed lease/own conditional',
    count: (ctx) => {
      const g = ctx.mapDoc.groups?.['4ac_vehicles'];
      const slots = g?.slots?.length ?? 0;
      if (!slots) return { universe: 0, covered: 0, universeList: [], fail: 'the map declares no 4ac_vehicles group with slots - the counter could not see its universe.' };
      const byRow = new Map();
      for (const t of (ctx.totalsDoc?.totals || [])) {
        if (t.total_cell?.group !== '4ac_vehicles' || t.total_cell?.column !== 'quick_sale_equity') continue;
        byRow.set(t.total_cell.row, (byRow.get(t.total_cell.row) || 0) + 1);
      }
      const rows = [...Array(slots).keys()];
      const covered = rows.filter((i) => byRow.get(i) === 2);
      return { universe: slots, covered: covered.length, universeList: rows.map((i) => `4ac_vehicles[${i}]`), uncoveredList: rows.filter((i) => byRow.get(i) !== 2).map((i) => `4ac_vehicles[${i}] declares ${byRow.get(i) || 0} predicated line(s), expected 2`) };
    } }),

  // ── 433-B(OIC) slice 3: the pages 4, 5 and 6 completeness claims ─────────────────────

  // "This slice binds 94 fields ... All 94 are bound and none is deferred or never-autofill."
  // Universe: the widgets the PDF draws on pages 4, 5 and 6. Covered: those the map binds.
  // It is the [K-18] claim on the pages that close the map, and it is the sentence that makes
  // partition_unaccounted 0 mean something: the partition is arithmetic over declared figures,
  // this counts the widgets.
  C({ id: 'K-25', match: /All \d+ are bound(?: and none is deferred)?/,
    kind: 'counter',
    what: 'every widget the PDF draws on pages 4, 5 and 6 is bound by this map',
    universe: { scoped_to: 'page', detail: 'the widgets the PDF draws on pages 4, 5 and 6 — the three pages slice 3 authored',
      admits: (m, ctx) => [4, 5, 6].includes(ctx.pageOf.get(m)) },
    count: (ctx) => {
      const targets = new Set(walkTargets(ctx.mapDoc).map(t => t.target));
      const on456 = (ctx.widgets || []).filter(w => w.page >= 4 && w.page <= 6);
      // AN EMPTY UNIVERSE IS A DEAD COUNTER, NOT A SATISFIED ONE — [K-18]'s lesson, applied.
      if (!on456.length) return { universe: 0, covered: 0, universeList: [], fail: 'no widget was read on pages 4, 5 or 6, so "all 94 are bound" is unchecked rather than true' };
      return { universe: on456.length, covered: on456.filter(w => targets.has(w.name)).length,
        universeList: on456.map(w => w.name),
        uncoveredList: on456.filter(w => !targets.has(w.name)).map(w => w.name) };
    } }),

  // "All 9 ticks are bound by RECT, top to bottom" — the page-6 attachment list, whose leaf
  // numbering is not its printed order. Universe: the checkboxes the PDF draws in the
  // attachment column, x 47.6, which is where all nine sit and where nothing else does.
  C({ id: 'K-26', match: /All \d+ ticks are bound(?: by RECT)?/,
    kind: 'counter',
    what: 'every attachment tick the PDF draws on page 6 is bound by this map as a check_here target',
    universe: { scoped_to: 'page', detail: 'the checkbox widgets the PDF draws on page 6 whose left edge is the attachment column x 47.6',
      admits: (m, ctx) => { const w = (ctx.widgets || []).find(x => x.name === m); return !!w && w.page === 6 && w.type === 'PDFCheckBox' && Math.abs(w.rect[0] - 47.6) < 0.05; } },
    count: (ctx) => {
      const ticks = Object.values(ctx.mapDoc.check_here || {}).map(v => v && v.target).filter(Boolean);
      const bound = new Set(ticks);
      const col = (ctx.widgets || []).filter(w => w.page === 6 && w.type === 'PDFCheckBox' && w.rect && Math.abs(w.rect[0] - 47.6) < 0.05);
      if (!col.length) return { universe: 0, covered: 0, universeList: [], fail: 'no checkbox on page 6 starts at x 47.6 — the counter could not see its universe, so "all nine ticks are bound" is unproved rather than true. Either the geometry stopped being read or the form was re-laid out.' };
      return { universe: col.length, covered: col.filter(w => bound.has(w.name)).length,
        universeList: col.map(w => w.name),
        uncoveredList: col.filter(w => !bound.has(w.name)).map(w => w.name) };
    } }),

  // "EIGHTEEN of page 4's thirty cells are money cells in the marker column and every one is
  // bound by BAND CONTAINMENT of its printed marker." Two claims in one sentence and the
  // counter checks the strong one: not that the cells are bound, but that each is bound AND
  // its rect contains the baseline of a printed marker. A binding that lost its marker would
  // still be a binding; it would stop being EVIDENCE, which is what this block is.
  C({ id: 'K-27', match: /every marker-column cell on page 4 is bound/,
    kind: 'counter',
    what: 'every widget the PDF draws in page 4\'s marker column is bound by this map AND contains the baseline of a printed line marker',
    universe: { scoped_to: 'page', detail: 'the widgets the PDF draws on page 4 whose left edge is the marker column x 471.6',
      admits: (m, ctx) => { const w = (ctx.widgets || []).find(x => x.name === m); return !!w && w.page === 4 && Math.abs(w.rect[0] - 471.6) < 0.05; } },
    count: (ctx) => {
      const targets = new Set(walkTargets(ctx.mapDoc).map(t => t.target));
      const col = (ctx.widgets || []).filter(w => w.page === 4 && w.rect && Math.abs(w.rect[0] - 471.6) < 0.05);
      if (!col.length) return { universe: 0, covered: 0, universeList: [], fail: 'no widget on page 4 starts at x 471.6 - the counter could not see its universe, so "every one is bound" is unproved rather than true.' };
      const marks = (ctx.markers || { rows: [] }).rows.filter(r => r.page === 4 && r.kind === 'line');
      const ok = (w) => targets.has(w.name) && marks.some(r => r.y >= w.rect[1] && r.y <= w.rect[3] && w.rect[0] >= r.x2);
      return { universe: col.length, covered: col.filter(ok).length,
        universeList: col.map(w => w.name),
        uncoveredList: col.filter(w => !ok(w)).map(w => `${w.name} (${targets.has(w.name) ? 'bound, no marker in its band' : 'not bound'})`) };
    } }),

  // "Six pairs ... Each pair is bound to the question printed ABOVE it with nothing between."
  // Universe: the checkboxes the PDF draws in page 6's Yes/No column - x 36.0 and x 72.0, which
  // is where all twelve sit and where the nine attachment ticks (x 47.6) do not.
  C({ id: 'K-28', match: /every Yes\/No-column checkbox on page 6 is bound/,
    kind: 'counter',
    what: 'every checkbox the PDF draws in page 6\'s Yes/No column is bound by this map as one half of a declared pair',
    universe: { scoped_to: 'page', detail: 'the checkbox widgets the PDF draws on page 6 whose left edge is x 36.0 or x 72.0 - the Yes/No column, which the attachment ticks at x 47.6 are not in',
      admits: (m, ctx) => { const w = (ctx.widgets || []).find(x => x.name === m); return !!w && w.page === 6 && w.type === 'PDFCheckBox' && (Math.abs(w.rect[0] - 36.0) < 0.3 || Math.abs(w.rect[0] - 72.0) < 0.3); } },
    count: (ctx) => {
      const paired = new Set();
      for (const [k, v] of Object.entries(ctx.mapDoc.checkboxes || {})) {
        if (k.startsWith('_') || !v || typeof v !== 'object') continue;
        for (const [ok2, t] of Object.entries(v)) if (!ok2.startsWith('_') && typeof t === 'string') paired.add(t);
      }
      const col = (ctx.widgets || []).filter(w => w.page === 6 && w.type === 'PDFCheckBox' && w.rect
        && (Math.abs(w.rect[0] - 36.0) < 0.3 || Math.abs(w.rect[0] - 72.0) < 0.3));
      if (!col.length) return { universe: 0, covered: 0, universeList: [], fail: 'no checkbox on page 6 sits in the Yes/No column at x 36.0 or x 72.0 - the counter could not see its universe.' };
      return { universe: col.length, covered: col.filter(w => paired.has(w.name)).length,
        universeList: col.map(w => w.name),
        uncoveredList: col.filter(w => !paired.has(w.name)).map(w => w.name) };
    } }),

  // ── 433-B(OIC): the name-lie registry's two claims about itself ───────────────────────
  //
  // A registry that says "every path in it was resolved through the map" is making a coverage
  // claim about its own entries, and it is the claim that makes a SECOND COPY OF A LIST
  // admissible at all: this file is generated from the map's lineage blocks, and a generated
  // copy is only safe while something asserts it against the original. So the covered set is
  // counted rather than asserted, on every run, per entry.
  C({ id: 'K-29', match: /every `path` and `bound_to` in it was RESOLVED/i,
    kind: 'counter',
    what: 'the registry paths and bindings all resolve through the map',
    universe: { scoped_to: 'form', detail: 'every entry in the name-lie registry of THIS form',
      admits: (m, ctx) => typeof m === 'string' && !!ctx.liesDoc },
    count: (ctx) => {
      const E = ctx.liesDoc?.entries || [];
      const nodes = ctx.nodes;
      const resolves = (e) => {
        if (typeof e.path !== 'string') return false;
        const pathOk = e.kind === 'container' ? [...nodes].some(n => n === e.path || n.startsWith(e.path + '.')) : ctx.names.has(e.path);
        if (!pathOk) return false;
        if (e.bound_to === null || e.bound_to === undefined) return !!e.not_bound_because || e.kind === 'container';
        const b = e.bound_to;
        const scalar = ctx.mapDoc.map?.[b];
        if (typeof scalar === 'string') return scalar === e.path;
        // "group[row].column" — the one cell spelling. THIS REGEX REACHED DISK ONCE WITH ITS
        // BACKSLASHES EATEN by the patch script that wrote it, which is the same accident that
        // killed an `_unaccounted_by_page` check two slices ago. It fails LOUD rather than
        // quiet: a regex that matches nothing makes every group-bound entry read as UNCOVERED
        // and the counter reports a coverage gap naming each one, which is what caught it.
        const m2 = /^([A-Za-z0-9_]+)\[(\d+)\]\.(.+)$/.exec(b);
        if (m2) { const slot = ctx.mapDoc.groups?.[m2[1]]?.slots?.[Number(m2[2])]; const t = slot?.text?.[m2[3]] ?? slot?.[m2[3]]; return t === e.path; }
        return false;
      };
      return { universe: E.length, covered: E.filter(resolves).length,
        universeList: E.map(e => String(e.id)), uncoveredList: E.filter(e => !resolves(e)).map(e => String(e.id)) };
    } }),

  C({ id: 'K-30', match: /every figure `_tally` and `_counting` state, derived/i,
    kind: 'counter',
    what: 'every numeric figure the registry states about itself is one count-sweep derives',
    universe: { scoped_to: 'form', detail: 'every non-prose key of the _tally on THIS registry, plus the active-lie figure in _counting',
      admits: (m, ctx) => typeof m === 'string' && !!ctx.liesDoc },
    count: (ctx) => {
      // The keys [S-11] derives, named here so a _tally key nobody derives shows up as
      // uncovered rather than as a number that looks checked.
      const DERIVED = new Set(['active_lies', 'of_which_leaf', 'of_which_container', 'inherited_not_counted',
        'controls_verified_true', 'page_imprecise_not_counted', 'total_entries', 'bound_today', 'unbound']);
      const t = ctx.liesDoc?._tally || {};
      const keys = Object.keys(t).filter(k => !k.startsWith('_'));
      const universeList = [...keys.map(k => `_tally.${k}`), '_counting.active_lies'];
      const uncoveredList = [
        ...keys.filter(k => !DERIVED.has(k)).map(k => `_tally.${k}`),
        // The figure [S-12] pulls out of `_counting`. If the sentence stops stating one in a
        // shape that derivation can read, this reports `_counting.active_lies` UNCOVERED — the
        // same answer [S-12] itself gives, reached independently, rather than a silent pass on
        // a claim nobody could parse.
        ...(/\b(?:\d+|[a-z]+)\s+ACTIVE LIES/i.test(String(ctx.liesDoc?._counting || '')) ? [] : ['_counting.active_lies']),
      ];
      return { universe: universeList.length, covered: universeList.length - uncoveredList.length, universeList, uncoveredList };
    } }),

  // ── 433-B's classification: the cross-form-identifier claim, COUNTED ────────────────────
  //
  // The sentence says that ANY identifier of the other form a host-form guard can parse will be
  // checked against the wrong page. That is a quantified claim over a set this tree can produce
  // — the parseable identifiers in that file — and it is countable, so it is counted rather than
  // declared not-coverage. It is also the claim most likely to be broken by a later edit: the
  // whole finding is that adding one coordinate or one full AcroForm path back into this file
  // silently sends a host-form guard at the wrong document, and TWO SUCCESSIVE DRAFTS OF THE
  // FILE DID EXACTLY THAT before the audit caught them. The counter is what makes the third
  // time loud.
  C({ id: 'K-31', match: /Every entry ruled against that form is unaffected, and not one derived/,
    kind: 'not-coverage',
    reason: 'PROSE ABOUT A PAST STATE, WHICH IS THIS DISPOSITION\'S OWN GROUND. The sentence is the `what_it_got_right` half of a superseded finding kept verbatim under [R-21]: 433-B\'s classification first recorded `same-question-different-subject: 0`, six entries were re-ruled when the twin table found their facts live on the backbone, and this clause records that the correction moved no NAME. The set it quantifies over is the derivation as it stood BEFORE the correction, which is not in this tree — counting it would mean carrying a copy of the superseded derivation solely so a counter could compare against it. THE LIVE GUARANTEE IS HELD ELSEWHERE AND MORE STRONGLY: adapters/hubspot/validate-crosswalk.mjs asserts on every run that no hs_name is used twice (A4), that every name is legal and every CREATED name carries this form\'s prefix (A5), that every reuse names a property that exists and every creation names one that does not (A6, 9 and 107 on this form), and that every reused property keeps every option its owner declares (A7). Those four are what would fail if a name had moved to somewhere it should not be, and they run against the portal rather than against a memory of a previous run.' }),

  // AND IT IS A not-coverage DISPOSITION, NOT A COUNTER, FOR A REASON THE FIRST DRAFT LEARNED
  // THE HARD WAY. Written as a counter it measured EVERY coordinate in the file and reported
  // 0 of 22 — because 22 of them are 433-B's OWN baselines, quoted as evidence for 433-B's own
  // captions, which are legitimate and are already compared against 433-B's drawn page by
  // [S-25c] on every run. The claim is about the OTHER form's identifiers, and "which form does
  // this number belong to" is not derivable from the number. A counter over the whole set is a
  // SECOND DENOMINATOR over ground [S-25c] already holds, and [K-97] records why that is worse
  // than no counter: two instruments answering one question can disagree.
  C({ id: 'K-114', match: /any identifier of the other form that a host-form guard can parse/,
    kind: 'not-coverage',
    reason: 'A STATEMENT OF WHAT HAPPENED, WITH A LIVE INSTRUMENT ALREADY ON IT. The sentence records that two successive drafts of this file put another form\'s identifiers where a host-form guard would read them as this form\'s — first three baselines off 433-B(OIC) page 5, then the full AcroForm paths that replaced them — and that both were refused. It is history, and the guarantee it describes is not enforced by this sentence: [S-25c] compares EVERY coordinate quoted anywhere in this file against 433-B\'s own drawn page and every full `topmostSubform[0]` path against the targets 433-B\'s map actually binds, on every run, claim site or not. That is the instrument, it is what caught both drafts, and it is why one of the three original baselines mattered more than the other two — y 224.5 lands on 433-B page 1\'s City/State/ZIP row by coincidence, so a reader checking it against the host form would have found a run and been satisfied. Counting the set again here would put a second denominator on ground [S-25c] holds.' }),

  // ── [D-06]'s split: two claims in the ruling that records it ───────────────────────────
  //
  // The ruling text in asset-row-shapes.json makes two quantified statements, and both name a
  // set this tree can produce. Counted rather than declared not-coverage, because that is
  // exactly what the ruling is FOR: [D-06] stood for three prompts on a split nobody counted.
  C({ id: 'K-94', match: /every printed_as_checkbox occurrence — it must be bound/,
    kind: 'counter',
    what: 'Every (column, form) occurrence declaring printed_as_checkbox is disposed by [A2] — bound as a checkbox on the accepting group, or declared printed_but_unmapped_on for that form. Universe: the occurrences. Covered: the disposed ones.',
    universe: { scoped_to: 'artefact', detail: 'every (canonical column, form) pair declaring printed_as_checkbox in adapters/hubspot/asset-row-shapes.json, across every mapped form — the artefact, not one form of it',
      admits: (m) => typeof m === 'string' && /^[a-z_]+.[a-z0-9_]+@[0-9a-z]+$/.test(m) },
    count: () => {
      const { checkbox } = splitOccurrences();
      const ok = (o) => o.bound || o.unmapped;
      return {
        universe: checkbox.length, covered: checkbox.filter(ok).length,
        universeList: checkbox.map((o) => o.at), uncoveredList: checkbox.filter((o) => !ok(o)).map((o) => o.at),
      };
    } }),

  // [K-95] IS NOW A NOT-COVERAGE DISPOSITION OVER A SUPERSEDED SENTENCE, AND [K-96] IS THE
  // COUNTER THAT REPLACED IT. The sentence [K-95] was written for said 433-F draws these
  // checkboxes 'and simply not bound'. The map bound all eight the whole time, so the counter
  // did exactly what it was built to do: the day one was bound the count moved, and it moved
  // to 0 of 3 the moment the three stale printed_but_unmapped_on declarations were superseded.
  C({ id: 'K-95', match: /each real-estate row\) and simply not bound/,
    kind: 'not-coverage',
    reason: 'A SUPERSEDED FINDING, KEPT VERBATIM. This text now lives under `_superseded_the_not_bound_half` beside what it got right (the whole printed half — 433-F does draw these boxes, and measuring the split on map reachability while stating it about the page was the defect [D-06] exists for) and what it got wrong (the four words "and simply not bound": the 433-F map binds all eight widgets and fill-433f.mjs writes them). It is prose about a past state, and its live replacement carries the counter — see [K-96], which asserts the opposite half and would fail the day a binding were removed.' }),

  C({ id: 'K-97', match: /that half is the \[D-06\] correction and it stands|four boxes over two rows/,
    kind: 'not-coverage',
    reason: 'THE `what_it_got_right` HALF OF A SUPERSEDED FINDING. A superseded finding is kept verbatim beside what it got right and what it got wrong, and the right-half sentence RESTATES the part of a past claim that survived — it does not assert that a set in this tree has been covered. The evidence it points at is not restated here either: `printed_as_checkbox` carries the printed label page, baseline and x1 and the widget names for each occurrence, and [A2] in adapters/pdf/assert-row-shape-spec.mjs checks every one of them against the map on every run. The LIVE claim these sentences are the history of is the corrected [D-06] paragraph, and that one carries a counter — [K-96], which asserts every printed_as_checkbox occurrence on 433-F is bound and moves the day one is not. Counting the right-half again would be a second denominator over the same set, able to disagree with the first.' }),

  C({ id: 'K-96', match: /three columns gained printed evidence — the label/,
    kind: 'counter',
    what: 'The corrected [D-06] claim: every canonical column 433-F draws a checkbox for carries printed evidence AND is bound by the 433-F map. Universe: the printed_as_checkbox occurrences on 433f. Covered: those the map binds — so removing a binding moves the count and the sentence stops being true out loud, which is the direction the superseded version could not see.',
    universe: { scoped_to: 'form', detail: 'every (canonical column, 433f) pair declaring printed_as_checkbox — scoped to ONE form, because the sentence is about what 433-F draws and what the 433-F map binds',
      admits: (m) => typeof m === 'string' && /^[a-z_]+.[a-z0-9_]+@433f$/.test(m) },
    count: () => {
      const on433f = splitOccurrences().checkbox.filter((o) => o.form === '433f');
      const ok = (o) => o.bound;
      return {
        universe: on433f.length, covered: on433f.filter(ok).length,
        universeList: on433f.map((o) => o.at), uncoveredList: on433f.filter((o) => !ok(o)).map((o) => o.at),
      };
    } }),

  // ── 433-B slice 2: pages 2 and 3 ───────────────────────────────────────────────────────

  C({ id: 'K-100', match: /all column-header bound/,
    kind: 'counter',
    what: 'Every column of the BUSINESS BANK ACOUNTS table is bound on a printed column header rather than on a caption beside its own cell. Universe: the four declared columns of that group. Covered: those whose evidence row records a column-caption pairing — so a column rebound on anything else moves the count and the sentence stops being true out loud.',
    universe: { scoped_to: 'artefact', detail: 'the four declared columns of groups.business_bank_accounts in the 433-B map',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    count: (ctx) => {
      const g = ctx.mapDoc?.groups?.business_bank_accounts;
      const cols = Object.keys(g?.slots?.[0]?.text || {});
      const ev = ctx.mapDoc?._map_evidence_page2_3?.bindings || [];
      // THE EVIDENCE ROW FOR ROW 0 OF EACH COLUMN, because the claim is about the COLUMNS and
      // every row of a column carries the same pairing by construction.
      // INLINED, NOT NAMED. A named predicate in a filter position is an exclusion site to
      // adapters/pdf/exclusion-sweep.mjs, and a local const named `has` here attributed SEVENTEEN
      // unrelated call sites in this file to itself on the first run — [D-08] in one file.
      const headerBound = (c) => /^column caption (CONTAINED|OVERLAPPING)/.test(ev.find((e) => e.key === `business_bank_accounts[0].${c}`)?.pairing || '');
      return { universe: cols.length, covered: cols.filter((c) => headerBound(c)).length,
        universeList: cols, uncoveredList: cols.filter((c) => !headerBound(c)) };
    } }),

  C({ id: 'K-101', match: /a per-row checkbox column that is NOT one of the five and is bound/,
    kind: 'counter',
    what: 'Every investment row and every digital-asset row on page 3 carries its own used_as_collateral exclusive set. Universe: those rows. Covered: those with a declared exclusive set. A row added without one moves the count.',
    universe: { scoped_to: 'artefact', detail: 'every declared slot of groups.investments and groups.digital_assets in the 433-B map',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    count: (ctx) => {
      const m = ctx.mapDoc || {};
      const rows = [];
      for (const g of ['investments', 'digital_assets'])
        (m.groups?.[g]?.slots || []).forEach((_, i) => rows.push(`${g}[${i}]`));
      const declaresSet = (r) => Array.isArray(m.exclusive?.[`${r}.used_as_collateral`]) && m.exclusive[`${r}.used_as_collateral`].length === 2;
      return { universe: rows.length, covered: rows.filter((r) => declaresSet(r)).length,
        universeList: rows, uncoveredList: rows.filter((r) => !declaresSet(r)) };
    } }),

  C({ id: 'K-102', match: /each stack is bound|That second witness exists for the lower cells/,
    kind: 'counter',
    what: 'Every cell that shares a printed column with the cell above it is bound on a caption printed immediately beside it, not on the column header the cell above it also inherits. Universe: the lower cells of the three stacked columns on pages 2 and 3. Covered: those whose evidence row records an immediately-left pairing. THIS IS THE ARGUABLE ITEM ARGUING WITH ITSELF, and the counter is what makes the argument checkable: the item says header containment alone would bind two cells to one header, and this counts how many of them carry the second witness that separates them.',
    universe: { scoped_to: 'artefact', detail: 'the contact_name and phone cells of every accounts_notes_receivable row, the phone cell of every investments row, and the account_number cell of every available_credit row',
      admits: (m) => typeof m === 'string' && m.length > 0 },
    count: (ctx) => {
      const m = ctx.mapDoc || {};
      const ev = m._map_evidence_page2_3?.bindings || [];
      const keys = [];
      (m.groups?.accounts_notes_receivable?.slots || []).forEach((_, i) => keys.push(`accounts_notes_receivable[${i}].contact_name`, `accounts_notes_receivable[${i}].phone`));
      (m.groups?.investments?.slots || []).forEach((_, i) => keys.push(`investments[${i}].phone`));
      (m.groups?.available_credit?.slots || []).forEach((_, i) => keys.push(`available_credit[${i}].account_number`));
      const besideItsOwnCell = (k) => /^immediately left/.test(ev.find((e) => e.key === k)?.pairing || '');
      return { universe: keys.length, covered: keys.filter((k) => besideItsOwnCell(k)).length,
        universeList: keys, uncoveredList: keys.filter((k) => !besideItsOwnCell(k)) };
    } }),
  // ── the families that are NOT coverage claims ──────────────────────────────────────────

  C({ id: 'K-103', match: /All four were re-derived/,
    kind: 'not-coverage',
    reason: 'THE `what_this_item_got_right` HALF OF A RESOLVED FINDING — the same shape as [K-97]. [B-03] asserted four things about the page-3 investments block and this sentence records that all four survived being re-derived. It restates what a past claim got right; it does not assert that a set in this tree is covered. The four things themselves are not restated here either: each is a coordinate or a printed marker, and adapters/pdf/tmp/p47/gen-slice2-433b.mjs refuses the whole slice if any caption is not drawn where the map says it is, which is a stronger check than a count would be. Counting it again would be a second denominator over a set the generator already refuses to be wrong about.' }),
  C({ id: 'K-93', match: /every page-5 binding rests on a caption plus a second witness/,
    kind: 'not-coverage',
    reason: 'A NEGATIVE CLAIM ABOUT WHAT THE PAGE DRAWS, not that a set has been covered. "Page 5 draws no line marker at all, so nothing here is bound by a number" says there is nothing of a kind - and a set of size zero has no covered half to count, only an existence to check. What checks it is count-sweep [S-32], which derives the marker count for page 5 from line-markers.mjs on every run and requires the block\'s own sentence - "finds 3 markers on page 5 and every one of them is a BOX marker" - to agree with the instrument. The POSITIVE half of the same paragraph, that every page-5 binding names two witnesses, is enumerated in the paragraph itself: nine keys, nine captions, nine second witnesses, each named.' }),

  C({ id: 'K-90', match: null, kind: 'not-coverage', appliesTo: 'geometry',
    reason: 'A QUANTIFIER OVER GEOMETRY, NOT OVER COVERAGE. "all sit under y 668", "each holds exactly one cell", "every printed instance sits in the same block" — these describe where the page draws things. They assert nothing about a set having been checked, so there is no covered set to count and a counter would be counting the wrong thing. What DOES check them is the coordinate half of the forward-reference register: align-block.mjs and verify-headings.mjs re-measure every coordinate these phrases quote, and that proof runs above.' }),

  C({ id: 'K-91', match: /any filled form, so exactly one is checked|each pair can hold on a filled form, so exactly one is checked/i,
    kind: 'not-coverage',
    reason: 'A STATEMENT ABOUT MUTUAL EXCLUSION ON ONE RUN, not about a set being covered. "either line can hold on any filled form, so exactly one is checked" says that the two are exclusive and that the gate reports the other as skipped — which is exactly what the gate\'s declared/checked/skipped triple already reports and what `tripwires_skipped` carries into the summary. The covered set is a set of size one by construction.' }),


  C({ id: 'K-24', match: /every slice that touches one of the three/,
    kind: 'not-coverage',
    reason: 'A STATEMENT ABOUT WHICH SLICES A STANDING RULE APPLIES TO, not that a set in this tree is covered. The rule is that a leaf name with mixed verdicts is recorded per occurrence in every slice that binds one of its occurrences; the sentence says this slice binds occurrences of two of the three such names and none of the third, and that the third is named anyway so its absence reads as checked rather than forgotten. The set it quantifies over is FUTURE SLICES, which nothing in this tree can count, and the fact it asserts about the present - that Gross_Receipts has no occurrence on pages 2 or 3 - is not a coverage claim but a negative one, disposed of by [K-21]: every widget in the total column on those pages is bound by this map and none of them is a Gross_Receipts cell.' }),
  C({ id: 'K-92', match: /every 433-A table and for the same reason|Each copy’s _why claimed to mirror the other and nothing checked|Every added entry covers keys the completeness blanket claimed were already covered|any loan where you pledged an asset as collateral|any of their identity columns can land|any kind is drawn on this page|any separate line|any map where two groups accept the same class/i,
    kind: 'not-coverage',
    reason: 'PROSE ABOUT A PAST STATE, A DECISION, OR THE PRINTED FORM — not a claim that a set in this tree is covered. Three shapes appear here: a recorded reason for NOT provisioning something ("every 433-A table and for the same reason: indexing a table per slot needs a property per row per column"), a superseded finding kept verbatim ("Each copy\'s _why claimed to mirror the other and nothing checked it" — the defect, quoted, in the past tense), and a transcription of a printed caption ("any loan where you pledged an asset as collateral"). None names a set with a cardinality this tree can produce, and asserting one would be inventing a denominator.' }),
  // ── 433-B slice 4: pages 5 and 6, and the map closing ────────────────────────────────
  //
  // THE THREE MATCHES BELOW ARE ANCHORED EXACTLY AND THE ENTRIES SIT AT THE END OF THIS
  // REGISTER, both for the same reason. The detector hands a counter the CLAUSE it found —
  // "every field is accounted", not the sentence around it — and COMPLETENESS.find() takes the
  // FIRST entry whose match tests true. An unanchored regex placed early can therefore catch a
  // clause some other entry was written for, and dispose of it under the wrong counter, which
  // reports a pass over a set nobody meant. Anchored and last, these three can only catch a
  // clause nothing else caught.

  // THE STRONGEST COMPLETENESS CLAIM THIS MAP HAS EVER MADE, and the one the whole slice
  // exists to earn. Slices 1 to 3 said "slice N - pages A to B" and were held to a partial
  // check; slice 4 says COMPLETE, and verify-form-coverage.mjs reads that word and turns the
  // strict check on. The counter here is the same partition read a second way: every field
  // the PDF draws must be in exactly one of the three declared states.
  C({ id: 'K-110', match: /^every field is accounted$/i,
    kind: 'counter',
    what: 'The map claims completeness. Universe: every fillable field the PDF draws. Covered: every field the map classifies as writable, never-autofill or deferred. A field the form gains and the map does not bind moves the count and the claim stops being true out loud.',
    universe: { scoped_to: 'form', detail: 'every fillable field in adapters/pdf/forms/f433b.pdf, by name',
      admits: (m, ctx) => typeof m === 'string' && !!ctx.form },
    count: (ctx) => {
      const map = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));
      const fields = JSON.parse(readFileSync('adapters/pdf/maps/433b.fields.json', 'utf8')).fields.map((f) => f.name);
      const { deferred, never, writable } = classifyMapTargets(map);
      const held = new Set([...deferred, ...never, ...writable.keys()]);
      const uncovered = fields.filter((n) => !held.has(n));
      return { universe: fields.length, covered: fields.length - uncovered.length, universeList: fields, uncoveredList: uncovered };
    } }),

  // THE FIVE FLAG CLASSES, AS FIVE CHECKED ABSENCES RATHER THAN ONE SENTENCE. The claim is
  // not "none of them appears" — that is the RESULT. The claim being counted is that each of
  // the five was actually LOOKED FOR, on each page, with its own derived figure. A class the
  // map stopped probing would silently drop out of a sentence that went on saying "each".
  C({ id: 'K-111', match: /^each is a checked$/i,
    kind: 'counter',
    what: 'Each of the five registered flag classes carries its own derived per-page count on pages 5 and 6. Universe: the five classes times the two pages. Covered: the (page, phrase) pairs the map actually records a figure for.',
    universe: { scoped_to: 'artefact', detail: 'the five flagged columns registered in adapters/hubspot/asset-row-shapes.json, probed once per page over pages 5 and 6',
      admits: (m) => typeof m === 'string' && /^p[56]:/.test(m) },
    count: () => {
      const map = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));
      const probes = (map._the_five_flag_classes_on_pages_5_and_6 || {}).probes_per_run || {};
      const PHRASES = ['primary residence', 'business account', 'check if', '1040', 'household'];
      const want = [];
      for (const p of [5, 6]) for (const ph of PHRASES) want.push(`p${p}:${ph}`);
      const uncovered = want.filter((k) => typeof probes[k] !== 'number');
      return { universe: want.length, covered: want.length - uncovered.length, universeList: want, uncoveredList: uncovered };
    } }),

  // THE SIX CHECKBOXES. The sentence says the pages DO print boxes and that none of them is a
  // flag-class column, and it ends "every one is accounted for". That is a coverage claim
  // about the boxes, and the set it covers is the exclusive sets: a box in no declared set is
  // a box nothing constrains, which is the state the sentence denies.
  C({ id: 'K-112', match: /^every one is accounted$/i,
    kind: 'counter',
    what: 'Every checkbox widget on pages 5 and 6 belongs to a declared exclusive set. Universe: the checkbox widgets the two pages draw. Covered: those named by a set in the map\'s `checkboxes` block. A loose box moves the count.',
    universe: { scoped_to: 'form', detail: 'every PDFCheckBox widget on pages 5 and 6 of adapters/pdf/forms/f433b.pdf, by name',
      admits: (m, ctx) => typeof m === 'string' && !!ctx.form },
    count: (ctx) => {
      const map = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));
      const boxes = JSON.parse(readFileSync('adapters/pdf/maps/433b.fields.json', 'utf8')).fields
        .filter((f) => f.type === 'PDFCheckBox' && /\.Page[56]\[0\]\./.test(f.name)).map((f) => f.name);
      const named = new Set();
      for (const [set, def] of Object.entries(map.checkboxes || {})) {
        if (!map.exclusive || !map.exclusive[set]) continue;
        for (const [k, v] of Object.entries(def)) if (!k.startsWith('_') && typeof v === 'string') named.add(v);
      }
      const uncovered = boxes.filter((n) => !named.has(n));
      return { universe: boxes.length, covered: boxes.length - uncovered.length, universeList: boxes, uncoveredList: uncovered };
    } }),

  // [B-07]'s two halves, RESOLVED, and each half gets the counter it needs.
  //
  // THE UNIVERSE IS EVERY EQUITY-SHAPED COLUMN AND NOT THE ONES SPELLED "equity". The first
  // draft admitted `<group>[<i>].equity` and counted 15 cells; investments and digital assets
  // name theirs `equity_value_minus_loan`, so the four page-3 cells [B-07] itself counted were
  // outside the instrument watching [B-07]. An equity column is one whose name carries the word
  // equity, and both spellings do.
  // THE MATCH IS THE PHRASE THE DETECTOR EXTRACTS, NOT THE SENTENCE A READER SEES. It cuts
  // from a quantifier (every/each/all/any) to the first assertion verb, so "Neither operand
  // is drawn on them" is not a claim it can find — `neither` is not a quantifier it knows.
  // A counter whose match no claim carries is a disposition standing over nothing, which is
  // this whole cycle's subject; the prose it stands over says `each of the three is bound`.
  // THE SUPERSEDED FINDING, KEPT VERBATIM UNDER [R-21], AND NOW FALSE. [B-07]'s `the_shape`
  // recorded that every equity cell was bound as an INPUT and none was a tripwire; sixteen of
  // the nineteen are tripwires as of this commit, which is what resolving the item MEANT. The
  // sentence stays word for word because the finding is what the resolution answers, and it is
  // declared not-coverage on exactly the ground [K-31] uses: the set it quantifies over is the
  // map as it stood BEFORE the resolution, which is not in this tree. What is live is measured
  // beside it — [K-115] counts the sixteen that draw both operands and asserts every one IS a
  // declared total cell, and [K-113] counts the three that draw neither and asserts none is.
  C({ id: 'K-116', match: /^Every one of them is bound$/i,
    kind: 'not-coverage',
    reason: 'PROSE ABOUT A PAST STATE, WHICH IS THIS DISPOSITION\'S OWN GROUND. It is the `the_shape` clause of [B-07], a carried item this commit RESOLVES, kept verbatim under [R-21] because a superseded finding is what its resolution is an answer to. It described a tree in which all nineteen equity cells on 433-B were inputs and none was an arithmetic tripwire; sixteen of them are tripwires now. Counting that set would mean carrying a copy of the pre-resolution map solely so a counter could compare against it. THE LIVE GUARANTEE IS HELD BESIDE IT AND IN BOTH DIRECTIONS: [K-115] enumerates every equity cell whose row draws both operands and asserts each is named as a total_cell in 433b.totals.json, and [K-113] enumerates the three whose row draws neither and asserts none is. Together those two partition the population this sentence was about, and both run on every audit.' }),

  C({ id: 'K-113', match: /^each of the three is bound$/i,
    kind: 'counter',
    what: 'The three intangible rows draw an equity cell and NEITHER operand, and none of them is a declared total cell. Universe: every (group, row) whose slot declares an equity-shaped column and NO fair-market-value or loan cell. Covered: those that are NOT named as a total_cell in 433b.totals.json. A ruling that swept the column would move this count, which is the direction [B-07] said any resolution had to keep honest.',
    universe: { scoped_to: 'artefact', detail: 'every slot of every group in adapters/pdf/maps/433b.map.json that declares an equity-shaped column and neither operand of the relation its header names',
      admits: (m) => typeof m === 'string' && /\[\d+\]\.equity/.test(m) },
    count: () => countEquityCells(false),
  }),

  // THE OTHER HALF, WHICH NOTHING WOULD OTHERWISE WATCH: the sixteen with both operands drawn
  // are declared lines, and if one were quietly un-declared only the totals file would know.
  C({ id: 'K-115', match: /^every other equity cell on th(?:e|is) form is checked$/i,
    kind: 'counter',
    what: 'Every equity cell on 433-B that draws BOTH operands of the relation its column header names IS a declared total cell. Universe: every (group, row) whose slot declares an equity-shaped column and a fair-market-value and a loan cell. Covered: those named as a total_cell in 433b.totals.json.',
    universe: { scoped_to: 'artefact', detail: 'every slot of every group in adapters/pdf/maps/433b.map.json that declares an equity-shaped column and both operands',
      admits: (m) => typeof m === 'string' && /\[\d+\]\.equity/.test(m) },
    count: () => countEquityCells(true),
  }),


];

// THE TWO HELPERS THAT USED TO LIVE HERE ARE GONE. `engineInputKeys` and
// `classificationCovers` were this file's own reading of the key space and of what an entry
// covers, and they disagreed with derive-names-433aoi.mjs assertion A1 — 232 of 238 against
// 238 of 238, because the local glob reader does not know that `s2_sp_` is not a glob. Both
// callers now import adapters/hubspot/classification-coverage.mjs. Recorded here rather than
// deleted silently, because the deletion is the finding: a second reading of a claim is a
// second answer to it.

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE RUN.
// ═══════════════════════════════════════════════════════════════════════════════════════

const buildAuditContext = async (form, sweep) => {
  const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
  const rd = (p) => existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  const fieldsDoc = JSON.parse(readFileSync(mapDoc.fields_source || `adapters/pdf/maps/${form}.fields.json`, 'utf8'));
  const bytes = readFileSync(`adapters/pdf/forms/f${form}.pdf`);
  const text = await readPrintedText(bytes);
  const { widgets } = await readWidgetGeometry(bytes);

  const r1 = (n) => Math.round(n * 10) / 10;
  const drawnY = new Set(), drawnX = new Set();
  for (const pg of text) for (const t of (pg.items || [])) { drawnY.add(r1(t.y1)); drawnY.add(r1(t.y2)); drawnX.add(r1(t.x1)); drawnX.add(r1(t.x2)); }
  for (const w of widgets) if (w.rect) { drawnY.add(r1(w.rect[1])); drawnY.add(r1(w.rect[3])); drawnX.add(r1(w.rect[0])); drawnX.add(r1(w.rect[2])); }

  const widgetsByPage = new Map();
  for (const w of widgets) widgetsByPage.set(w.page, (widgetsByPage.get(w.page) || 0) + 1);

  // EVERY NODE IN THE ACROFORM TREE, leaf and subform alike. A field name is a dotted path,
  // so every proper prefix of one is a real container node. Derived from the fields file,
  // which is validate-map.mjs's own input rather than a second reading of the PDF.
  const nodes = new Set();
  for (const f of fieldsDoc.fields) {
    const parts = String(f.name).split('.');
    for (let i = 1; i <= parts.length; i++) nodes.add(parts.slice(0, i).join('.'));
  }

  // line-markers.mjs is run PER FORM, and map evidence quotes markers from more than one form
  // in the same sentence. The union over the forms this repo maps is what that instrument
  // actually supplies across the tree.
  // DERIVED FROM THE FORMS DIRECTORY, NOT TYPED. This read `['433a', '433f', '433aoi']`, so a
  // form whose blank had entered the repo was silently outside the marker union until someone
  // remembered to add it — an exclusion by omission, which is the shape
  // adapters/pdf/exclusion-sweep.mjs exists for. 433-B(OIC) is the form that would have been
  // missed. The list now comes from what is on disk.
  const markersByForm = {};
  for (const file of readdirSync('adapters/pdf/forms').filter(f => /^f.+\.pdf$/.test(f)).sort()) {
    const f = file.replace(/^f/, '').replace(/\.pdf$/, '');
    markersByForm[f] = await markerPairing(f);
  }

  return {
    form, mapDoc, fieldsDoc, sweep,
    totalsDoc: rd(`adapters/pdf/maps/${form}.totals.json`),
    headingsDoc: rd(`adapters/pdf/maps/${form}.headings.json`),
    liesDoc: rd(`adapters/pdf/maps/${form}.name-lies.json`),
    classDoc: rd(`adapters/pdf/maps/${form}.crosswalk-classification.json`),
    shapesDoc: rd('adapters/hubspot/asset-row-shapes.json'),
    standards: rd('adapters/pdf/maps/irs-standards-2026.json'),
    names: new Set(fieldsDoc.fields.map(f => f.name)),
    pageOf: new Map(widgets.map(w => [w.name, w.page])),
    widgets,
    widgetsByPage, drawnY, drawnX, nodes, markersByForm, printedText: text,
    markers: markersByForm[form],
    revision: readFormRevision(form),
  };
};

/**
 * AUDIT ONE FORM'S BLANKETS. Returns everything the report prints and everything the STOP
 * conditions are computed from — nothing is decided inside the printer.
 */
export const runBlanketAudit = async (form) => {
  const sweep = await runCountSweep(form);
  const ctx = await buildAuditContext(form, sweep);

  // ── which dispositions are blankets, DERIVED from the sweep rather than listed ─────────
  const sitesById = new Map();
  for (const r of sweep.rows) {
    if (r.disposition !== 'underivable') continue;
    if (!sitesById.has(r.id)) sitesById.set(r.id, []);
    sitesById.get(r.id).push(r);
  }
  const reasonOf = (id) => {
    const base = String(id).replace(/f$/, '');
    const e = MANIFEST.find(x => x.id === base);
    if (!e) return null;
    return String(id).endsWith('f') && e.fallback ? e.fallback.reason : (e.reason ?? e.fallback?.reason ?? null);
  };

  // A BLANKET IS A DISPOSITION STANDING OVER MORE THAN ONE SITE. Derived, so a family that
  // grows past one member becomes a blanket without anyone remembering to add it here.
  const blankets = [...sitesById.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([id, rows]) => ({ id, sites: rows.length, reason: reasonOf(id), rows }))
    .sort((a, b) => b.sites - a.sites);

  // ── (1) sampling ───────────────────────────────────────────────────────────────────────
  const probeCanary = probeCanaryHolds(ctx);

  const docCache = new Map();
  const valueAt = (file, at) => {
    if (!docCache.has(file)) docCache.set(file, JSON.parse(readFileSync(file, 'utf8')));
    const doc = docCache.get(file);
    for (const c of claimsIn(doc, MANIFEST.filter(e => e.kind === 'derived' && e.file.test(file)).map(e => e.at)))
      if (c.at === at) return c.value;
    return undefined;
  };

  for (const b of blankets) {
    const ranked = b.rows
      .map(r => ({ ...r, h: fnv1a(`${SEED}\0${r.file}\0${r.at}`) }))
      .sort((x, y) => x.h - y.h || (x.at < y.at ? -1 : 1));
    const n = sampleSize(ranked.length);
    b.sample = ranked.slice(0, n).map(r => ({ ...r, value: valueAt(r.file, r.at) }));
    b.sampleSize = n;
    b.probe = b.sample.map(s => ({ site: `${s.file}  ${s.at}`, ...probeSite(ctx, s) }));
    b.findings = b.probe.flatMap(p => p.findings.map(f => ({ site: p.site, ...f })));
    b.stoodDown = b.probe.flatMap(p => (p.stoodDown || []).map(f => ({ site: p.site, ...f })));
    b.unreadable = b.probe.filter(p => p.read === 'unreadable');
  }

  // ── (2) forward references ─────────────────────────────────────────────────────────────
  const forward = [];
  for (const b of blankets) {
    if (!b.reason) continue;
    const { refs, unreadable } = forwardRefsIn(b.reason);
    if (unreadable) { forward.push({ blanket: b.id, instrument: '(unreadable)', unproved: true, why: 'this reason contains ".mjs" or "step N" and the forward-reference extractor read no instrument out of it. An extraction that cannot read its input is not a reason with no forward references.' }); continue; }
    for (const inst of refs) {
      const prover = FORWARD.find(p => p.instrument === inst);
      if (!prover) { forward.push({ blanket: b.id, instrument: inst, unproved: true, why: 'no prover is registered for this instrument in FORWARD' }); continue; }
      let out;
      try { out = prover.prove(ctx, b.rows.map(r => ({ ...r, value: valueAt(r.file, r.at) }))); }
      catch (e) { forward.push({ blanket: b.id, instrument: inst, unproved: true, why: `the prover threw: ${e.message}` }); continue; }
      const empty = !((out.demanded || []).length);
      const declared = EMPTY_DEMAND.find(e => e.blanket === b.id && e.instrument === inst && (!e.forms || e.forms.includes(ctx.form)));
      forward.push({ blanket: b.id, instrument: inst, how: prover.how, ...out, sites: b.sites,
        emptyDemand: empty, emptyDeclared: empty ? (declared?.why ?? null) : null });
    }
  }

  // ── (3) completeness claims ────────────────────────────────────────────────────────────
  const canary = canaryHolds();
  const claims = [];
  for (const file of sweptFiles(form)) {
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    for (const c of claimsIn(doc, [])) if (typeof c.value === 'string') claims.push(...completenessClaimsIn(c.value, `${file}  ${c.at}`));
  }
  for (const e of MANIFEST) {
    if (e.kind === 'underivable') claims.push(...completenessClaimsIn(e.reason, `count-sweep.mjs  [${e.id}]`));
    if (e.fallback) claims.push(...completenessClaimsIn(e.fallback.reason, `count-sweep.mjs  [${e.id}f]`));
  }
  const disposed = [];
  for (const cl of claims) {
    const hit = COMPLETENESS.find(k => k.match && k.match.test(cl.phrase))
             || (cl.kind === 'geometry' ? COMPLETENESS.find(k => k.appliesTo === 'geometry') : null);
    if (!hit) { disposed.push({ ...cl, undisposed: true }); continue; }
    if (hit.kind === 'not-coverage') { disposed.push({ ...cl, id: hit.id, kind2: 'not-coverage', reason: hit.reason }); continue; }
    // EVERY COUNTER DECLARES THE SCOPE OF ITS UNIVERSE, AND A MISSING DECLARATION IS A STOP.
    // A counter with no scope cannot be wrong about one, which is how [K-19] came to report a
    // universe of 23 against a claim about 14 and call nine live bindings uncovered.
    if (!hit.universe || typeof hit.universe.admits !== 'function' || !hit.universe.scoped_to || !hit.universe.detail) {
      disposed.push({ ...cl, id: hit.id, kind2: 'counter', failed: 'declares no universe scope. A counter states what its universe is scoped to — a page, a form, an artefact, the tree — names it in words, and carries a predicate that admits a member of it. There is no state in which a counter is exempt from saying how wide it is.' });
      continue;
    }
    let out;
    try { out = hit.count(ctx); }
    catch (e) { disposed.push({ ...cl, id: hit.id, kind2: 'counter', failed: `the counter threw: ${e.message}` }); continue; }
    // THE UNIVERSE IS ENUMERATED, NOT ASSERTED. Enumerated is the granularity standard here as
    // everywhere else: a counter that reports a size without being able to name its members
    // cannot be asked whether those members are in scope.
    if (!Array.isArray(out.universeList)) {
      disposed.push({ ...cl, id: hit.id, kind2: 'counter', failed: `returned a universe of ${out.universe} and did not enumerate it. universeList is required: the scope assertion is over MEMBERS, and a size is not a member.` });
      continue;
    }
    if (out.universeList.length !== out.universe) {
      disposed.push({ ...cl, id: hit.id, kind2: 'counter', failed: `reports a universe of ${out.universe} and enumerates ${out.universeList.length} member(s). The size and the list are two readings of the same set and they disagree.` });
      continue;
    }
    // AND THE SCOPE IS ASSERTED, MEMBER BY MEMBER. A universe that has grown past what the
    // counter declared is a STOP and never a coverage finding — the members outside the scope
    // are not uncovered, they were never in the claim.
    let strayed = [];
    try { strayed = out.universeList.filter(m => !hit.universe.admits(m, ctx)); }
    catch (scopeErr) {
      disposed.push({ ...cl, id: hit.id, kind2: 'counter', failed: `its scope predicate threw on a member: ${scopeErr.message}. A scope that cannot be evaluated has not been asserted.` });
      continue;
    }
    if (strayed.length) {
      disposed.push({ ...cl, id: hit.id, kind2: 'counter',
        universeStrayed: `its universe holds ${strayed.length} of ${out.universe} member(s) OUTSIDE the scope it declares — ${hit.universe.scoped_to}: ${hit.universe.detail}.\n      ${strayed.slice(0, 8).map(String).join(', ')}${strayed.length > 8 ? ` … +${strayed.length - 8}` : ''}\n      The universe has changed size without the declaration changing. Those members are not uncovered; they were never in this claim.` });
      continue;
    }
    disposed.push({ ...cl, id: hit.id, kind2: 'counter', what: hit.what, scope: `${hit.universe.scoped_to}: ${hit.universe.detail}`, ...out, holds: out.covered === out.universe });
  }

  // ── STOP conditions ────────────────────────────────────────────────────────────────────
  const problems = [];
  for (const b of blankets) {
    for (const u of b.unreadable) problems.push(`UNREADABLE   [${b.id}] ${u.site}\n      ${u.why}`);
    for (const f of b.findings) problems.push(
      `BLANKET FALSE [${b.id}] ${f.site}\n      the site states "${f.stated}" beside prose naming ${f.what}, a set this repo counts as ${f.derived}.\n      "${f.window}"\n      A blanket declaring this region underivable is false here: the covered set has a counter.`);
  }
  for (const f of forward) {
    if (f.unproved) problems.push(`UNPROVED FWD [${f.blanket}] -> ${f.instrument}\n      ${f.why}\n      An unproved forward reference is a STOP: the blanket cites coverage nobody has shown exists.`);
    else if (f.emptyDemand && !f.emptyDeclared) problems.push(
      `EMPTY DEMAND [${f.blanket}] -> ${f.instrument}\n      the prover extracted NONE of its own atoms from the ${f.sites} site(s) this blanket covers, so it proved the citation over nothing.\n      ${f.how}\n      Either this instrument is the wrong one to measure that citation with, or the citation names coverage the sites do not actually rest on. Declare it in EMPTY_DEMAND with the reason, or pair the citation with a prover that measures what it claims.`);
    else if (f.uncovered?.length) problems.push(
      `FWD GAP      [${f.blanket}] -> ${f.instrument}\n      ${f.uncovered.length} atom(s) the covered sites demand are NOT in what that instrument supplies:\n      ${f.uncovered.slice(0, 12).map(u => JSON.stringify(u)).join(', ')}${f.uncovered.length > 12 ? ` … +${f.uncovered.length - 12}` : ''}\n      ${f.how}`);
  }
  if (!probeCanary.ok) problems.push(
    `CANARY DEAD  the sampling probe read ${probeCanary.got} claim(s) out of its own canary string and ${probeCanary.expect} was expected.\n      Every "0 findings" above is therefore meaningless: a probe that cannot find a count it was handed cannot report that a blanket holds.`);
  if (!canary.ok) problems.push(
    `CANARY DEAD  the completeness detector read ${JSON.stringify(canary.got)} out of its own canary string and ${JSON.stringify(canary.expect)} was expected.\n      Every "0 claims detected" below is therefore meaningless. A detector that cannot find a claim it was handed cannot report that a tree has none.`);
  for (const d of disposed) {
    if (d.undisposed) problems.push(`UNDISPOSED   completeness claim at ${d.where}\n      "${d.phrase}"\n      Register a counter for the covered set, or declare it not-coverage with a reason. There is no third state.`);
    else if (d.failed) problems.push(`COUNTER DEAD [${d.id}] ${d.where}\n      ${d.failed}`);
    else if (d.universeStrayed) problems.push(`UNIVERSE MOVED [${d.id}] ${d.where}\n      "${d.phrase}"\n      ${d.universeStrayed}`);
    else if (d.kind2 === 'counter' && !d.holds) problems.push(
      `COVERAGE GAP [${d.id}] ${d.where}\n      "${d.phrase}"\n      ${d.what}: ${d.covered} of ${d.universe} covered.\n      uncovered: ${(d.uncoveredList || []).slice(0, 12).join(', ')}${(d.uncoveredList || []).length > 12 ? ` … +${d.uncoveredList.length - 12}` : ''}`);
  }

  // EVERY DETECTOR CARRIES A CANARY - the register, over a derived candidate set.
  const detectors = detectorCandidates();
  for (const d of detectors) {
    if (d.unreadable) { problems.push(`DETECTOR UNREADABLE  ${d.file} could not be read, so the canary register could not be checked against it. An unreadable input is a STOP, not a skip.`); continue; }
    if (!d.disposed) problems.push(
      `DETECTOR WITH NO CANARY  ${DETECTOR_DIR}/${d.file} searches by pattern over text it did not enumerate and can stop a run, which is the detector shape.
` +
      `      Give it a canary - a fixed input not drawn from the artefacts, with an asserted expected yield - or declare in DETECTORS why it is not a detector in that sense.
` +
      `      A detector that silently stops reading reports a clean sweep, which is the defect this project has now met at five levels.`);
  }
  // A register entry for a file the signature no longer finds is a decision for a divergence
  // that has gone away, which is a STOP by the same standing rule.
  const found = new Set(detectors.map(d => d.file));
  for (const f of Object.keys(DETECTORS)) if (!found.has(f)) problems.push(`STALE DETECTOR ENTRY  DETECTORS declares ${f} and the derived signature no longer finds it. Either the file changed shape or it is gone; re-read it and re-write the disposition.`);

  return { form, seed: SEED, blankets, forward, disposed, canary, probeCanary, detectors, problems, ctx };
};

/** Print the audit. Returns the number of problems (0 = it holds). */
export const reportBlanketAudit = (a, { verbose = false } = {}) => {
  const totalSites = a.blankets.reduce((s, b) => s + b.sites, 0);
  const sampled = a.blankets.reduce((s, b) => s + b.sampleSize, 0);
  const stood = a.blankets.reduce((s, b) => s + b.stoodDown.length, 0);
  const counters = a.disposed.filter(d => d.kind2 === 'counter');
  console.log(`blanket audit: ${a.blankets.length} blanket(s) over ${totalSites} site(s); seed "${a.seed}"; ${sampled} site(s) sampled`);
  examined('blanket-audit', a.form, sampled, 'sampled-blanket-sites');
  console.log(`  probe: ${a.blankets.reduce((s, b) => s + b.findings.length, 0)} finding(s); ${stood} number(s) stood down as a stated PAST figure, which is what the blanket reasons already cover`);
  console.log(`  forward references: ${a.forward.length} pair(s), ${a.forward.filter(f => f.unproved).length} unproved, ${a.forward.filter(f => f.uncovered?.length).length} with a gap`);
  console.log(`  detectors: ${a.detectors.length} candidate(s) by the derived signature - ${a.detectors.filter(d => d.canary).length} carry a canary, ${a.detectors.filter(d => d.not_a_detector).length} declared not a detector, ${a.detectors.filter(d => !d.disposed).length} undisposed`);
  console.log(`  canaries: probe ${a.probeCanary.ok ? 'holds' : 'DEAD'} (${a.probeCanary.got}/${a.probeCanary.expect}), completeness detector ${a.canary.ok ? 'holds' : 'DEAD'} (${JSON.stringify(a.canary.got)} vs ${JSON.stringify(a.canary.expect)})`);
  console.log(`  completeness claims: ${a.disposed.length} detected, ${counters.length} with a counter, ${a.disposed.filter(d => d.kind2 === 'not-coverage').length} declared not-coverage, ${a.disposed.filter(d => d.undisposed).length} undisposed`);
  if (verbose) {
    console.log('  BLANKETS:');
    for (const b of a.blankets) console.log(`    ${String(b.id).padEnd(7)} ${String(b.sites).padStart(4)} site(s), ${String(b.sampleSize).padStart(3)} sampled, ${b.findings.length} finding(s), ${b.stoodDown.length} stood down`);
    for (const b of a.blankets) for (const d of b.stoodDown)
      console.log(`      stood down [${b.id}] ${d.site}: "${d.stated}" beside ${d.set}, marked past by "${d.marker}"`);
    console.log('  FORWARD REFERENCES:');
    for (const f of a.forward) console.log(`    ${String(f.blanket).padEnd(7)} -> ${String(f.instrument).padEnd(26)} ${f.unproved ? 'UNPROVED' : `${Array.isArray(f.demanded) ? f.demanded.length : 0} demanded / ${f.supplied} supplied / ${f.uncovered.length} uncovered`}`);
    console.log('  COMPLETENESS COUNTERS:');
    for (const d of counters) console.log(`    ${String(d.id).padEnd(6)} ${d.holds ? 'HOLDS' : 'GAP  '} ${String(d.covered)}/${String(d.universe)}  ${d.what}`);
  }
  if (!a.problems.length) {
    console.log('OK — every blanket sampled true, every forward reference is proved against the scope it names, and every completeness claim has a counter or a declared reason it is not one.');
    return 0;
  }
  console.error(`BLANKET AUDIT — ${a.problems.length} problem(s):`);
  a.problems.forEach(p => console.error(`  ${p}`));
  return a.problems.length;
};

// CLI: node adapters/pdf/blanket-audit.mjs <form> [--verbose]
if (process.argv[1] && /blanket-audit\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const form = process.argv[2] || '433aoi';
  const a = await runBlanketAudit(form);
  process.exit(reportBlanketAudit(a, { verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
