// THE SIXTH SWEEP — ONE y CONVENTION, DECLARED IN ONE PLACE AND CHECKED AGAINST EVERY TOOL.
//
//   node adapters/pdf/assert-y-convention.mjs [--verbose]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — [B11], AND [B11] WAS NEVER THE WHOLE OF IT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// adapters/pdf/maps/433boi.lineage-433aoi.json quotes printed runs at `y=97.5` and `y=80.2`.
// The runs it describes are SET at 89.5 and 71.2. Neither number was wrong. The lineage file
// was authored off align-block.mjs, which printed the TOP of a run's box under a bare `y=`;
// the map and the totals file were authored off the BASELINE, which is what every other tool
// in this engine means by that letter. The gap is the run's own height — 8.0pt for the 8pt
// runs the lineage file quoted — and eight points is a row on these forms. One binding got
// the wrong caption out of it.
//
// A convention nobody states is not a convention. So page-geometry.mjs now DECLARES one, and
// this file is the check that the declaration is true OF the engine rather than about it:
//
//   FOR THE SAME PRINTED RUN, EVERY TOOL THAT REPORTS A y REPORTS THE SAME NUMBER.
//
// It is asked of the instruments, not of their source text. Reading `y: t.y1` out of a file
// and calling that a proof would be asserting the convention against a copy of the code. Each
// reporter is RUN — imported where it exports its answer, spawned where its answer is a
// listing — and the number it actually produces is compared against page-geometry's baseline
// for the same run, identified by page, x-range and drawn string.
//
// ENUMERATED WHERE ENUMERATION IS AFFORDABLE, SEEDED WHERE IT IS NOT. Every marker, every
// declared heading, every probe row and every correlate-labels record on every mapped form is
// checked — that is the whole population, not a sample of it. align-block.mjs answers about a
// BAND and costs a process per question, so it is asked about BANDS_PER_FORM bands per form,
// chosen by a seeded generator whose seed is printed on every run. No Math.random anywhere.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE THINGS THIS FILE STOPS A RUN FOR
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   DISAGREEMENT   two tools report different numbers for the same object. That is [B11].
//   UNREGISTERED   an engine file emits a y and page-geometry.Y_REPORTERS does not name it.
//                  A reporter nobody declared is the next lineage file.
//   UNREADABLE     a reporter could not be asked, or answered about an object the page does
//                  not hold. Not a pass — a reading that did not happen.
//   CANARY DEAD    the comparator cannot see a disagreement it was handed. Every "0
//                  disagreements" in the same run is then meaningless.
//
// And one thing it PROVES rather than asserts: line-markers.mjs's marker row was split this
// commit into `y` (the declared baseline, reported) and `y_run_top` (the box top, used by the
// band-containment arithmetic). That is a refactor of a guard, so its no-op path is proved in
// the same run — the whole pairing is recomputed here from the OLD expression, marker for
// marker, on every mapped form, and a single differing winner is a STOP.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  readPrintedText, readWidgetGeometry,
  Y_CONVENTION, Y_CONVENTIONS, Y_REPORTERS,
  baselineOfRun, runTopOf, runHeight, runTopToBaseline,
} from './page-geometry.mjs';
import { markerPairing } from './line-markers.mjs';
import { probeMoneyCells } from './money-probe.mjs';
import { verifyPrintedEvidence, EVIDENCE_TOLERANCE } from './record-shape.mjs';
import { quotesAreDrawn } from './assert-subject-register.mjs';
import { REGISTER as SUBJECT_REGISTER } from './gen-subject-register.mjs';
import { rx } from './regex-self-assert.mjs';

// THE SEED IS A CONSTANT IN THE SOURCE AND IS PRINTED ON EVERY RUN. A sample nobody can
// reproduce is an anecdote; a sample drawn from Math.random cannot be re-run at all.
export const SEED = 20260820;
export const BANDS_PER_FORM = 3;

/** Deterministic 32-bit LCG. Same seed, same bands, every run, on every machine. */
const lcg = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };

const r1 = (n) => Math.round(n * 10) / 10;
const TOL = 0.05;                       // a tenth of a point is the precision every tool rounds to
export const MAPPED_FORMS = () =>
  readdirSync('adapters/pdf/maps').filter((f) => f.endsWith('.map.json')).map((f) => f.replace('.map.json', '')).sort();

// ---------------------------------------------------------------------------------------
// THE CANARY.
//
// Two synthetic runs with a KNOWN 8.0pt gap between baseline and box top, and a synthetic
// reporter answering in each convention. The comparator must return exactly two disagreements
// for the run-top reporter, none for the baseline one, and none for a run-top reading that is
// explicitly converted back. Not drawn from the artefacts, per the standing rule: a canary
// taken from the tree cannot tell a broken comparator from a clean tree.
// ---------------------------------------------------------------------------------------
export const runCanary = () => {
  const synthetic = [
    { page: 1, str: 'Canary caption', x1: 36, x2: 100, y1: 100.0, y2: 108.0 },
    { page: 1, str: 'Canary marker', x1: 444.9, x2: 468, y1: 200.0, y2: 208.0 },
  ];
  // THE CANARY GOES THROUGH THE COMPARATOR'S OWN PREDICATE, not through a second copy of the
  // comparison. A canary judged by re-implemented arithmetic proves the re-implementation
  // works, which is the one thing nobody needs to know.
  const cmp = (reported) => synthetic
    .map((t, i) => ({ t, got: reported[i] }))
    .filter((p) => !agreesWithSomeBaseline([p.t], p.got)).length;
  const wrong = cmp(synthetic.map((t) => runTopOf(t)));       // a run-top reporter
  const right = cmp(synthetic.map((t) => baselineOfRun(t)));  // a conforming reporter
  const converts = cmp(synthetic.map((t) => runTopToBaseline(runTopOf(t), runHeight(t))));
  return {
    ok: wrong === 2 && right === 0 && converts === 0,
    wrong, right, converts,
    why: 'two synthetic runs, 8.0pt from baseline to box top: a run-top reporter must produce 2 disagreements, a baseline reporter 0, and an explicit conversion of the run top back to the baseline 0',
  };
};

// ---------------------------------------------------------------------------------------
// THE DERIVED CANDIDATE SET — who reports a y at all.
//
// A TYPED LIST OF REPORTERS IS THE DEFECT ONE LEVEL OUT: the file that produced the wrong
// numbers would simply not have been on it. So the candidate set is derived from the source
// — an engine file that NAMES a y-bearing quantity and EMITS it — and every candidate must
// appear in page-geometry.Y_REPORTERS.
//
// The signature, and every file class it removes, is registered in adapters/pdf/sweep-
// boundary.mjs as [SB-60] with its reason, and cross-checked there.
// ---------------------------------------------------------------------------------------
export const REPORTER_DIR = 'adapters/pdf';
// A FILE `EMITS` A y IF IT PRINTS ONE, WRITES ONE TO AN ARTEFACT, OR RETURNS ONE IN A RECORD.
// The first draft required console.log or writeFileSync and therefore missed page-geometry.mjs
// - the module that DEFINES the convention and hands every other tool the numbers - reporting
// it as a stale register entry instead. A completeness check whose signature cannot see the
// source of the thing it is checking is the [A3] shape with a regex on it. Returning a record
// with `y1:`, `y:` or `rect:` in it counts, because that record is what the next tool prints.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// AND THEN THIS SIGNATURE ITSELF WAS HALF DEAD FOR THREE PROMPTS.  [D-12]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Four of the word boundaries in it were not `\b` escapes. They were LITERAL U+0008 BACKSPACE
// BYTES, sitting in the regex source where two characters were meant. So the alternations read:
//
//   clause 1   /\.y1<BS>|\.y2<BS>|rect\[1\]|rect\[3\]/     the first two branches match nothing
//   clause 2   /console\.log|writeFileSync|<BS>y1:|<BS>y:\s|rect:\s/        likewise the middle two
//
// which means A FILE THAT REPORTS A y THROUGH `.y1` OR `.y2` AND NEVER TOUCHES A WIDGET
// RECTANGLE WAS INVISIBLE TO THE COMPLETENESS CHECK. The check went on printing OK. It is
// the same defect one level in as the one it exists to catch — a reporter nobody sees — and
// it was in the detector, not in the population.
//
// It hid EXACTLY ONE file, enumerated rather than estimated: adapters/pdf/record-shape.mjs,
// which reads `t.y1` and emits `y:` on every printed-evidence atom, and which had never
// appeared in Y_REPORTERS. Nothing was lost by the repair; the ten previously-found files are
// still found. Both numbers are re-derived by signatureCanary() below.
//
// The reason it could hide is that NOTHING TESTED THE SIGNATURE. The file's canary tested the
// CONVENTION COMPARISON — two synthetic runs, a run-top reporter must disagree twice — and a
// detector whose canary covers its comparator and not its population selector is a canary for
// the half that was working. signatureCanary() is the missing half.
//
// The first clause is also widened to name `baselineOfRun(` and `runTopOf(` — page-geometry's
// own accessors. A file that asks this module for a baseline and prints it is reporting a y as
// surely as one that reaches for `.y1`, and reaching for the accessor is the style this engine
// asks for, so the signature was blind to its own preferred idiom.
const RX_Y_POPULATION = rx('RX-YC-01', /\.y1\b|\.y2\b|rect\[1\]|rect\[3\]|baselineOfRun\(|runTopOf\(/, {
  why: 'a file that REACHES for a y \u2014 [D-12] is what four eaten backslashes did to this half, and it reported clean for three prompts',
  matches: ['const y = t.y1;', 'rect[1]', 'baselineOfRun(page)', 'runTopOf(run)'],
  rejects: ['t.y1x', 'rect1', 'baselineOfRunX', 'ty1'],
});
const RX_Y_EMISSION = rx('RX-YC-02', /console\.log|writeFileSync|\by1:|\by:\s|rect:\s/, {
  why: 'and REPORTS it. Reaching without reporting is arithmetic; reporting is what puts a y in front of a reader under a convention',
  matches: ['console.log(x)', 'writeFileSync(p, s)', '  y1: 3', 'return { y: 3 }', 'rect: [1]'],
  rejects: ['consoleXlog', 'my1: 3', 'y:s', 'rect:x'],
});
export const REPORTER_SIG = (src) =>
  RX_Y_POPULATION.test(src)
  && RX_Y_EMISSION.test(src);

/**
 * THE CANARY FOR THE POPULATION SELECTOR, which is the half that had no canary.
 *
 * Each case is a synthetic source and the verdict the signature must reach on it. The first
 * two are the exact shapes the backspace bytes suppressed: a file that reports a baseline
 * through `.y1` and prints it, and one that returns it in a record. If either stops being
 * detected, this fails — which is what the last three prompts had no way to notice.
 *
 * There is no `Math.random` and nothing is sampled: the cases are enumerated here, and the
 * real population is enumerated by reporterCandidates(). Both counts are printed.
 */
export const signatureCanary = () => {
  const cases = [
    ['a baseline reporter that prints it', 'const y = t.y1;\nconsole.log(`y=${y}`);', true],
    ['a baseline reporter that returns it in a record', 'return { page, y: t.y1 };', true],
    ['a run-top reporter that prints it', 'console.log(`top=${t.y2}`);', true],
    ['a widget reporter', 'console.log(w.rect[3]);', true],
    ['an accessor reporter', 'import { baselineOfRun } from "./page-geometry.mjs";\nconsole.log(baselineOfRun(t));', true],
    ['names a y and emits nothing', 'const y = t.y1; return y > 0;', false],
    ['emits and names no y', 'console.log("done");', false],
    ['mentions y in prose only', '// the y of a run is its baseline\nconsole.log("ok");', false],
  ];
  const missed = cases.filter(([, src, want]) => REPORTER_SIG(src) !== want).map(([what]) => what);
  return { checks: cases.length, missed, holds: missed.length === 0 };
};

export const reporterCandidates = () => {
  const out = [];
  for (const f of readdirSync(REPORTER_DIR).filter((x) => x.endsWith('.mjs')).sort()) {
    let src;
    try { src = readFileSync(`${REPORTER_DIR}/${f}`, 'utf8'); }
    catch { out.push({ file: f, unreadable: true }); continue; }
    if (!REPORTER_SIG(src)) continue;
    out.push({ file: f, declared: !!Y_REPORTERS[f], reports: Y_REPORTERS[f]?.reports ?? null });
  }
  return out;
};

// ---------------------------------------------------------------------------------------
// THE REFERENCE. page-geometry.mjs's baseline for every printed run, keyed so another tool's
// answer about "the same run" can be looked up without trusting either tool's ordering.
// ---------------------------------------------------------------------------------------
// A RUN'S IDENTITY IS (page, x-range, drawn string) AND IT IS NOT UNIQUE. 433-B(OIC) page 2
// draws "Account number" at three different baselines in the same column, so a Map keyed on
// that identity keeps the last one and every other occurrence reads as a disagreement of a
// couple of hundred points. The reference therefore holds EVERY baseline for a key and a
// reporter agrees when its number is one of them. That is still sound against the defect this
// file exists for: a run top is not the baseline of any run in the same column, so a tool
// reporting tops matches none of the candidates and is named.
const runKey = (page, x1, x2, str) => `${page}|${r1(x1)}|${r1(x2)}|${str}`;

/** Every baseline the page draws for this run identity. A reporter agrees with any of them. */
const agreesWithSomeBaseline = (cands, reported) =>
  Array.isArray(cands) && cands.some((t) => Math.abs(reported - r1(baselineOfRun(t))) <= TOL);
/** What to PRINT as the expected value when a reporter agrees with none of them. */
const baselinesOf = (cands) => (Array.isArray(cands) ? cands.map((t) => r1(baselineOfRun(t))) : []);

const referenceFor = async (form) => {
  const bytes = readFileSync(`adapters/pdf/forms/f${form}.pdf`);
  const text = await readPrintedText(bytes);
  const { widgets } = await readWidgetGeometry(bytes);
  const byRun = new Map();
  text.forEach((pg, i) => pg.items.forEach((t) => {
    const k = runKey(i + 1, t.x1, t.x2, t.str);
    if (!byRun.has(k)) byRun.set(k, []);
    byRun.get(k).push(t);
  }));
  const byWidget = new Map();
  for (const w of widgets) if (w.rect && !byWidget.has(w.name)) byWidget.set(w.name, w);
  return { text, widgets, byRun, byWidget };
};

// ---------------------------------------------------------------------------------------
// THE READINGS. One entry per reporter, saying HOW its answer is obtained and returning
// { at, reported, expected } rows the comparator judges.
// ---------------------------------------------------------------------------------------
const READINGS = [
  {
    tool: 'line-markers.mjs', kind: 'text-baseline', population: 'enumerated',
    how: 'markerPairing(form).rows[].y, IMPORTED from the tool, one row per printed marker on the form.',
    read: async (form, ref) => {
      const { rows } = await markerPairing(form);
      return rows.map((m) => {
        const cands = ref.byRun.get(runKey(m.page, m.x1, m.x2, m.text));
        return {
          at: `${m.marker} p${m.page}`, reported: m.y,
          agrees: agreesWithSomeBaseline(cands, m.y), expected: baselinesOf(cands),
          missing: !cands && `no printed run at p${m.page} x ${m.x1}..${m.x2} matching ${JSON.stringify(m.text)}`,
        };
      });
    },
  },

  {
    tool: 'verify-headings.mjs', kind: 'text-baseline', population: 'enumerated',
    how: 'node adapters/pdf/verify-headings.mjs <form> --emit-heading-ys, one HEADING-Y line per declared heading, parsed from the tool\'s own output rather than from its source.',
    read: async (form, ref) => {
      if (!existsSync(`adapters/pdf/maps/${form}.headings.json`)) return [];
      const r = spawnSync(process.execPath, ['adapters/pdf/verify-headings.mjs', form, '--emit-heading-ys'], { encoding: 'utf8' });
      const lines = String(r.stdout || '').split('\n').filter((l) => l.startsWith('HEADING-Y '));
      // AN UNREADABLE INPUT IS NOT A ZERO. A form with declared headings whose tool emitted
      // none has not been checked, and saying so is the whole of [G-01].
      if (!lines.length) {
        return [{
          at: `${form} headings`, reported: null, expected: null,
          missing: `verify-headings.mjs emitted no HEADING-Y line for ${form} though ${form}.headings.json exists (exit ${r.status}). The reading did not happen; it did not pass.`,
        }];
      }
      return lines.map((l) => {
        const m = /^HEADING-Y (\S+) page=(\d+) convention=(\S+) y=([\d.]+) x1=([\d.]+) x2=([\d.]+) text=(.*)$/.exec(l);
        if (!m) return { at: l.slice(0, 60), reported: null, expected: null, missing: 'unparseable HEADING-Y line' };
        const cands = ref.byRun.get(runKey(Number(m[2]), Number(m[5]), Number(m[6]), JSON.parse(m[7])));
        const got = r1(Number(m[4]));
        return {
          at: `${m[1]} p${m[2]}`, reported: got,
          agrees: agreesWithSomeBaseline(cands, got), expected: baselinesOf(cands),
          conventionSaid: m[3],
          missing: !cands && `no printed run matching heading ${m[1]}`,
        };
      });
    },
  },

  {
    tool: 'align-block.mjs', kind: 'text-baseline', population: 'seeded sample',
    how: 'node adapters/pdf/align-block.mjs <form> <page> <yMin> <yMax> for BANDS_PER_FORM seeded bands per form; every run in the PRINTED block of each listing is compared. Spawned, so what is checked is what the listing actually printed.',
    read: async (form, ref) => {
      const rnd = lcg(SEED + form.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
      const out = [];
      for (let b = 0; b < BANDS_PER_FORM; b++) {
        const page = 1 + Math.floor(rnd() * ref.text.length);
        const yMin = Math.floor(rnd() * 650);
        const yMax = yMin + 60;
        const r = spawnSync(process.execPath, ['adapters/pdf/align-block.mjs', form, String(page), String(yMin), String(yMax)], { encoding: 'utf8' });
        const lines = String(r.stdout || '').split('\n');
        const start = lines.findIndex((l) => l.includes('--- PRINTED'));
        const end = lines.findIndex((l) => l.includes('--- WIDGETS'));
        if (start < 0 || end < 0) {
          out.push({ at: `${form} p${page} y ${yMin}..${yMax}`, reported: null, expected: null, missing: `align-block.mjs printed no PRINTED/WIDGETS block (exit ${r.status})` });
          continue;
        }
        for (const l of lines.slice(start + 1, end)) {
          const m = /^\s*y=\s*([\d.]+)\s+x=\s*([\d.]+)\.\.\s*([\d.]+)\s+(.*)$/.exec(l);
          if (!m) continue;
          const str = JSON.parse(m[4]);
          const cands = ref.byRun.get(runKey(page, Number(m[2]), Number(m[3]), str));
          const got = r1(Number(m[1]));
          out.push({
            at: `p${page} ${JSON.stringify(str.slice(0, 34))}`, reported: got,
            agrees: agreesWithSomeBaseline(cands, got), expected: baselinesOf(cands),
            missing: !cands && `align-block printed a run at p${page} x ${m[2]}..${m[3]} that readPrintedText does not hold`,
          });
        }
      }
      return out;
    },
  },

  {
    tool: 'money-probe.mjs', kind: 'widget-rect-top', population: 'enumerated',
    how: 'probeMoneyCells(form).rows[].y_rect_top, IMPORTED, against readWidgetGeometry rect[3] for the same target. A WIDGET quantity: checked against the widget and never against a caption baseline, which is exactly what its declared convention says.',
    read: async (form, ref) => {
      const p = await probeMoneyCells(form);
      return p.rows.map((row) => {
        const w = ref.byWidget.get(row.target);
        return {
          at: row.key, reported: row.y_rect_top,
          agrees: !!w && Math.abs(row.y_rect_top - r1(w.rect[3])) <= TOL,
          expected: w ? [r1(w.rect[3])] : [],
          missing: !w && `probe row names ${row.target}, which the PDF draws no widget for`,
        };
      });
    },
  },

  {
    tool: 'correlate-labels.mjs', kind: 'widget-rect', population: 'enumerated',
    how: 'adapters/pdf/maps/<form>.labels.json — the artefact the tool writes — record.rect[3] against readWidgetGeometry rect[3]. correlate-labels reports a widget as a FOUR-TUPLE and never as a scalar, so what is checked is that the tuple is the same rectangle.',
    read: async (form, ref) => {
      const p = `adapters/pdf/maps/${form}.labels.json`;
      if (!existsSync(p)) return [];
      const doc = JSON.parse(readFileSync(p, 'utf8'));
      return (doc.widgets || []).filter((w) => Array.isArray(w.rect)).map((w) => {
        const g = ref.byWidget.get(w.name);
        return {
          at: w.name.split('.').pop(), reported: r1(w.rect[3]),
          agrees: !!g && Math.abs(r1(w.rect[3]) - r1(g.rect[3])) <= TOL,
          expected: g ? [r1(g.rect[3])] : [],
          missing: !g && `labels.json holds ${w.name}, which the PDF draws no widget for`,
        };
      });
    },
  },

  // THE THREE THAT WERE DECLARED IN THE SAME COMMIT THEY WERE FOUND IN.
  //
  // A Y_REPORTERS entry is a CLAIM, and a claim with no reading beside it is the shape this
  // whole file exists to refuse. record-shape.mjs was invisible to the population selector for
  // three prompts; declaring it and then not reading it would trade one silence for another.
  {
    tool: 'record-shape.mjs', kind: 'text-baseline', population: 'enumerated',
    how: 'verifyPrintedEvidence(map, pages).demanded[].y — IMPORTED — against readPrintedText\'s baseline for the run the atom names. Every printed-evidence atom on every form that declares a record shape; a form that declares none contributes no population, and says so.',
    read: async (form, ref) => {
      const p = `adapters/pdf/maps/${form}.map.json`;
      if (!existsSync(p)) return [];
      const mapDoc = JSON.parse(readFileSync(p, 'utf8'));
      let demanded;
      try { ({ demanded } = verifyPrintedEvidence(mapDoc, ref.text)); }
      catch (e) { return [{ at: `${form} record-shape`, reported: null, expected: null, missing: `verifyPrintedEvidence threw: ${e.message}` }]; }
      return demanded.filter((d) => d.page !== undefined && d.y !== undefined).map((d) => {
        // The atom names a BAND of runs (x is a range and the quote is a prefix), so the
        // comparison is against every baseline drawn at that page and x-start, exactly as the
        // heading reader does. EVIDENCE_TOLERANCE is record-shape's own, quoted not invented.
        const near = (ref.text[Number(d.page) - 1]?.items || [])
          .filter((t) => Math.abs(t.x1 - d.x?.[0]) <= EVIDENCE_TOLERANCE);
        return {
          at: d.what, reported: r1(d.y),
          agrees: near.some((t) => Math.abs(r1(baselineOfRun(t)) - r1(d.y)) <= EVIDENCE_TOLERANCE),
          expected: near.map((t) => r1(baselineOfRun(t))),
          missing: !near.length && `${d.what} quotes p${d.page} x ${d.x?.[0]} and no run starts there`,
        };
      });
    },
  },

  {
    tool: 'assert-row-shape-spec.mjs', kind: 'text-baseline', population: 'enumerated',
    how: 'adapters/hubspot/asset-row-shapes.json — every `printed_as_checkbox[<form>].printed_label` locator, whose y is the baseline [A4] resolves it at — against readPrintedText\'s baseline for the run starting at that x on that page. A4 asserts the run EXISTS; this asserts the number it is quoted at is a baseline and not a run top, which is the drift [B11] is about.',
    read: async (form, ref) => {
      const spec = JSON.parse(readFileSync('adapters/hubspot/asset-row-shapes.json', 'utf8'));
      const out = [];
      for (const c of (spec.classes || [])) for (const col of (c.canonical_row || [])) {
        const ev = (col.printed_as_checkbox || {})[form];
        for (const at of (ev?.printed_label || [])) {
          const near = (ref.text[at.page - 1]?.items || []).filter((t) => Math.abs(t.x1 - at.x1) <= TOL);
          out.push({
            at: `${c.class_id}.${col.key} p${at.page}`, reported: r1(at.y),
            agrees: near.some((t) => Math.abs(r1(baselineOfRun(t)) - r1(at.y)) <= TOL),
            expected: near.map((t) => r1(baselineOfRun(t))),
            missing: !near.length && `the evidence quotes p${at.page} x1 ${at.x1} and no run starts there`,
          });
        }
      }
      return out;
    },
  },

  {
    tool: 'gen-subject-register.mjs', kind: 'text-baseline', population: 'enumerated',
    how: 'adapters/pdf/maps/_subjects.cross-form.json — the artefact the generator writes — forms[<form>].quotes[].y against readPrintedText\'s baseline for the run at that page and x1. Every quote on every registered form.',
    read: async (form, ref) => {
      if (!existsSync(SUBJECT_REGISTER)) return [];
      const doc = JSON.parse(readFileSync(SUBJECT_REGISTER, 'utf8'));
      const entry = doc.forms?.[form];
      if (!entry) return [];
      return Object.entries(entry.quotes || {}).map(([id, q]) => {
        const hit = (ref.text[q.page - 1]?.items || []).find((t) => Math.abs(t.x1 - q.x1) <= TOL && t.str === q.text);
        return {
          at: `${form}.${id}`, reported: r1(q.y),
          agrees: !!hit && Math.abs(r1(baselineOfRun(hit)) - r1(q.y)) <= TOL,
          expected: hit ? [r1(baselineOfRun(hit))] : [],
          missing: !hit && `the register quotes ${JSON.stringify(q.text.slice(0, 40))} at p${q.page} x1 ${q.x1} and no run there draws that string`,
        };
      });
    },
  },

  {
    tool: 'assert-subject-register.mjs', kind: 'text-baseline', population: 'enumerated',
    how: 'quotesAreDrawn() is run against the register with one quote\'s baseline moved 1.0pt on this form; it must report that quote and only that quote. What is checked is that the asserter READS the baseline rather than trusting it — a checker that agrees with whatever it is handed reports zero disagreements forever.',
    read: async (form) => {
      if (!existsSync(SUBJECT_REGISTER)) return [];
      const doc = JSON.parse(readFileSync(SUBJECT_REGISTER, 'utf8'));
      const ids = Object.keys(doc.forms?.[form]?.quotes || {});
      if (!ids.length) return [];
      const id = ids[0];
      const mut = JSON.parse(JSON.stringify(doc));
      mut.forms = { [form]: mut.forms[form] };            // this form only, so the count is this form's
      mut.forms[form].quotes[id].y = +(mut.forms[form].quotes[id].y + 1).toFixed(1);
      const caught = (await quotesAreDrawn(mut)).filter((p) => p.includes(`${form}.${id}`)).length;
      return [{
        at: `${form}.${id} moved 1.0pt`, reported: caught, expected: [1],
        agrees: caught === 1,
        missing: caught === 0 && 'the asserter accepted a baseline the page does not draw, so its OK is about nothing',
      }];
    },
  },
];

// ---------------------------------------------------------------------------------------
// THE NO-OP PROOF FOR line-markers.mjs.
//
// A refactor of a guard is a change to the guard. `attachIn` used to read one field named
// `y` holding the run's box top; it now reads `y_run_top`. The whole pairing is recomputed
// here from the OLD expression — the old filter and the old sort, written out — and compared
// marker for marker against what the shipped tool returns. One differing winner is a STOP.
// Asserting "the value is the same so the pairing is the same" would be asserting the thing
// being proved.
// ---------------------------------------------------------------------------------------
const TOL_Y = 2;                       // the same tolerance line-markers.mjs uses
export const proveMarkerPairingNoOp = async (form) => {
  const { rows, widgets, attach } = await markerPairing(form);
  const oldAttach = (m) => {
    const mid = (w) => (w.rect[1] + w.rect[3]) / 2;
    const yOld = m.y_run_top;          // the value the single `y` field used to hold
    const cands = widgets
      .filter((w) => w.page === m.page && w.rect
        && yOld >= w.rect[1] - TOL_Y && yOld <= w.rect[3] + TOL_Y
        && w.rect[0] >= m.x2 - TOL_Y)
      .sort((a, b) => Math.abs(mid(a) - yOld) - Math.abs(mid(b) - yOld) || a.rect[0] - b.rect[0]);
    return cands[0] || null;
  };
  const diffs = [];
  for (const m of rows) {
    const now = attach(m).winner, before = oldAttach(m);
    if ((now ? now.name : null) !== (before ? before.name : null)) {
      diffs.push(`${form} marker ${m.marker} p${m.page}: now ${now ? now.name : '(none)'} / before ${before ? before.name : '(none)'}`);
    }
  }
  return { form, markers: rows.length, diffs };
};

// ---------------------------------------------------------------------------------------
export const runYConventionAudit = async () => {
  const problems = [];
  const rows = [];
  const canary = runCanary();
  if (!canary.ok) {
    problems.push(`CANARY DEAD  the comparator saw ${canary.wrong} disagreement(s) from a run-top reporter, ${canary.right} from a baseline reporter and ${canary.converts} from an explicitly converted one; expected 2, 0 and 0.\n      It cannot see a convention mismatch it was handed. Every "0 disagreement(s)" below is meaningless. STOP.`);
  }
  // THE SECOND CANARY, ON THE HALF THAT HAD NONE. `canary` above proves the COMPARATOR can
  // see a mismatch. This proves the POPULATION SELECTOR can see a reporter — which is the half
  // that was dead for three prompts and printed OK throughout. [D-12].
  const sigCanary = signatureCanary();
  if (!sigCanary.holds) {
    problems.push(`SIGNATURE CANARY DEAD  REPORTER_SIG failed ${sigCanary.missed.length} of ${sigCanary.checks} synthetic case(s): ${sigCanary.missed.join('; ')}.\n      The completeness check cannot see the kind of file it is looking for. Every "declared reporter" count below is about a population this selector chose, and it is choosing wrong. STOP.`);
  }

  const forms = MAPPED_FORMS().filter((f) => existsSync(`adapters/pdf/forms/f${f}.pdf`));
  const noOp = [];
  for (const form of forms) {
    const ref = await referenceFor(form);
    for (const R of READINGS) {
      let read;
      try { read = await R.read(form, ref); }
      catch (e) {
        problems.push(`UNREADABLE   ${R.tool} on ${form}\n      its reading threw: ${e.message}\n      A reporter that cannot be asked has not agreed. Never a pass.`);
        rows.push({ form, tool: R.tool, kind: R.kind, checked: 'UNREADABLE', disagreements: '?' });
        continue;
      }
      const missing = read.filter((x) => x.missing);
      const judged = read.filter((x) => !x.missing && x.reported !== null && x.expected.length);
      const bad = judged.filter((x) => !x.agrees);
      for (const x of missing) problems.push(`UNREADABLE   ${R.tool} on ${form} at ${x.at}\n      ${x.missing}`);
      for (const x of bad.slice(0, 8)) {
        problems.push(`DISAGREEMENT ${R.tool} on ${form} at ${x.at}\n      it reports y=${x.reported}; page-geometry.mjs draws that object at ${x.expected.join(' / ')} and at no other y.\n      Nearest gap ${r1(Math.min(...x.expected.map((e) => Math.abs(x.reported - e))))}pt. Declared convention for this tool: ${R.kind}. Two instruments, one object, two numbers - this is [B11].`);
      }
      if (bad.length > 8) problems.push(`DISAGREEMENT ${R.tool} on ${form}: +${bad.length - 8} more not listed.`);
      rows.push({ form, tool: R.tool, kind: R.kind, checked: judged.length, disagreements: bad.length, population: read.length ? R.population : 'no population on this form' });
    }
    const p = await proveMarkerPairingNoOp(form);
    noOp.push(p);
    if (p.diffs.length) {
      problems.push(`PAIRING MOVED  line-markers.mjs on ${form}: ${p.diffs.length} marker(s) pair with a different widget than the pre-split expression gives.\n      ${p.diffs.slice(0, 6).join('\n      ')}\n      The y split was supposed to be a rename. It is not.`);
    }
  }

  // COMPLETENESS: an engine file that emits a y and is not declared.
  const cands = reporterCandidates();
  for (const c of cands) {
    if (c.unreadable) { problems.push(`REPORTER UNREADABLE  ${REPORTER_DIR}/${c.file} could not be read, so its convention could not be checked. An unreadable input is a STOP, not a skip.`); continue; }
    if (!c.declared) {
      problems.push(
        `UNREGISTERED REPORTER  ${REPORTER_DIR}/${c.file} names a y-bearing quantity and emits it, and page-geometry.mjs Y_REPORTERS does not declare which convention it reports in.\n`
        + '      Declare it, or say there why it reports no y a reader could take for a baseline.\n'
        + '      A reporter nobody declared is how 433boi.lineage-433aoi.json came to hold nineteen run tops.');
    }
  }
  const found = new Set(cands.map((c) => c.file));
  for (const f of Object.keys(Y_REPORTERS)) {
    if (!found.has(f)) problems.push(`STALE REPORTER ENTRY  Y_REPORTERS declares ${f} and the derived signature no longer finds it. Either the file stopped reporting a y or it is gone; re-read it and re-write the entry.`);
  }

  return { rows, problems, canary, sigCanary, noOp, cands, forms };
};

export const reportYConventionAudit = (a, { verbose = false } = {}) => {
  const checked = a.rows.reduce((s, r) => s + (typeof r.checked === 'number' ? r.checked : 0), 0);
  const bad = a.rows.reduce((s, r) => s + (typeof r.disagreements === 'number' ? r.disagreements : 0), 0);
  console.log(`y-convention audit: declared convention is "${Y_CONVENTION}" — ${Y_CONVENTIONS[Y_CONVENTION].what}`);
  console.log(`                    ${a.forms.length} mapped form(s), ${Object.keys(Y_REPORTERS).length} declared reporter(s), ${a.cands.length} derived candidate(s)`);
  console.log(`                    ${checked} object(s) cross-checked, ${bad} disagreement(s)`);
  console.log(`                    seed ${SEED}, ${BANDS_PER_FORM} seeded band(s) per form for align-block.mjs`);
  console.log(`                    canary: ${a.canary.ok ? 'holds' : 'DEAD'} (run-top reporter yields ${a.canary.wrong}, baseline ${a.canary.right}, converted ${a.canary.converts})`);
  console.log(`                    signature canary: ${a.sigCanary.holds ? 'holds' : 'DEAD'} (${a.sigCanary.checks} synthetic case(s), ${a.sigCanary.missed.length} misclassified) — the population selector, which had none until [D-12]`);
  console.log(`                    line-markers pairing no-op: ${a.noOp.reduce((s, p) => s + p.markers, 0)} marker(s) re-paired from the pre-split expression, ${a.noOp.reduce((s, p) => s + p.diffs.length, 0)} difference(s)`);
  for (const [file, d] of Object.entries(Y_REPORTERS)) {
    console.log(`    ${file.padEnd(24)} reports ${String(d.reports).padEnd(18)}${d.also ? `and ${d.also}` : ''}`);
  }
  for (const r of a.rows) {
    console.log(`    ${r.form.padEnd(8)} ${r.tool.padEnd(24)} ${String(r.kind).padEnd(18)} ${String(r.checked).padStart(4)} checked  ${String(r.disagreements).padStart(3)} disagree  ${r.population || ''}`);
  }
  if (verbose) for (const R of READINGS) console.log(`      ${R.tool}: ${R.how}`);
  if (!a.problems.length) {
    console.log('OK — every tool that reports a y reports the declared convention, and for every object two of them describe they report the same number.');
    return 0;
  }
  console.error(`Y-CONVENTION AUDIT — ${a.problems.length} problem(s):`);
  a.problems.forEach((p) => console.error(`  ${p}`));
  return a.problems.length;
};

// CLI
if (process.argv[1] && /assert-y-convention\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const a = await runYConventionAudit();
  process.exit(reportYConventionAudit(a, { verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
