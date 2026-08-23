// THE ABSENCE SWEEP — "THE MAP DOES NOT REACH IT" AND "THE PAGE DOES NOT PRINT IT" ARE
// DIFFERENT FACTS, AND ONLY ONE OF THEM IS ABOUT THE FORM.
//
// CLI:  node adapters/pdf/absence-sweep.mjs [--verbose]
// Exit: 0 = every absence claim is disposed and every checkable one agrees with the page
//       3 = at least one claim contradicts the drawn page, or is unsupported and undeclared
//       2 = an artefact could not be read, or a canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — [D-06], AND THE SENTENCE THAT NAMED THE CLASS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [D-06] reported five canonical columns splitting three load-bearing and two inert. That
// split was measured on MAP REACHABILITY and written down as though it had been measured on
// the page. Read off the drawn page, all five are drawn as checkboxes somewhere. They were
// never unprinted — they were UNMAPPED, and map reachability cannot tell those apart.
//
// The correction is bigger than the column it corrected. Every absence claim in this repo is
// one of two different assertions wearing one sentence:
//
//   ABOUT THE PAGE   "433-A prints no column of that kind"   — settled ONLY by reading the
//                    drawn text and the drawn widgets of 433-A.
//   ABOUT THE MAP    "nothing in this repo binds that cell"  — settled ONLY by reading the map.
//
// A claim of the first kind supported by evidence of the second kind is FALSE-SHAPED even when
// it happens to be true, because nothing that was consulted could have contradicted it. That is
// the defect [D-06] was, and it is the defect `s1_federal_contractor` was, and this file exists
// so that the next one is a STOP instead of a reading.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IS SWEPT — ENUMERATED. A GLOB IS A STOP UNLESS IT DECLARES WHAT IT SWEEPS.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Every `_`-prose string and every reason/why/note field in the per-form map, headings,
// totals, name-lie and crosswalk-classification artefacts of EVERY MAPPED FORM (derived from
// the maps directory, so a form that arrives is swept without anyone remembering), plus the
// two shared spec files. The engine's .mjs comments are NOT swept and that is a claim: a
// comment states why code does what it does, and the code is asserted by the sweeps that read
// it. What this file is about is EVIDENCE — a written finding about the drawn page that a
// later author reads instead of re-reading the page. Evidence lives in the artefacts.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE SECOND HALF — COORDINATES, AND THE FOUR UNIVERSES A `y NNN` CAN BELONG TO
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// An absence claim about the page is usually SUPPORTED by a coordinate, and a coordinate is
// checkable. blanket-audit.mjs [K-12] already asserted that: "every coordinate quoted in the
// map and headings files is a value the page actually draws". It had been dead since it was
// written — two literal U+0008 bytes where `\b` was meant — and when it was revived it
// reported 17 uncovered coordinates across two forms. Not one of them was a bad transcription
// of the kind it was written to catch. All seventeen were the counter asking the wrong
// question, because a quoted `y NNN` belongs to one of FOUR universes and only the first is a
// claim that the page draws a run there:
//
//   point       "the caption is at y 240.7"        -> compare against the DRAWN TEXT baselines
//   band        "the band y 489..501", "y 480-760" -> a scan window, or an ABSENCE claim about
//                                                     a region. Inverted: the claim is that
//                                                     nothing is drawn there, so finding
//                                                     nothing is the claim HOLDING.
//   widget      "rectangle (y 170.6..183.6, ...)"  -> compare against WIDGET geometry. A widget
//                                                     rect and a text baseline are different
//                                                     numbers about different objects.
//   cross-form  "433-A page 2 y 464.1", quoted
//               inside 433-A(OIC)'s map            -> compare against 433-A. Comparing it
//                                                     against the host form's page is a test
//                                                     of the wrong sheet.
//
// AND THE FOURTH ONE NEEDS THE FORM DECLARED, WHICH IS [D-14]. This file's first version READ
// the owner out of the sentence — the last form named before the coordinate — and excluded the
// whole universe from the comparison on the ground that an inferred attribution is not a basis
// for a STOP. That ground held. Now that all 27 are declared in
// adapters/pdf/maps/_cross-form-coordinates.json, the size of the problem is measurable: the
// inference agrees with the declaration on 4 of 27 and is wrong on 23. It is wrong the same way
// almost every time — `topmostSubform[0].F433-A-OIC_Page2[0]` and `433aoi.totals.json` both
// contain the string a form-name reader matches as 433-A, so a sentence entirely about
// 433-A(OIC)'s own page reads as a sentence about 433-A. Declaration is not a formality here;
// it reverses 85% of the attributions.
//
// Collapsing those four into one is the same error as collapsing map-reachability into
// page-printing: a comparison that cannot distinguish two facts reports on neither.
//
// AND THE PARTITION EARNED ITS KEEP IMMEDIATELY. With the four universes separated, two of the
// seventeen survived as genuine point claims that the page does not draw — 433-A's PERSONAL
// BANK ACCOUNTS and BUSINESS BANK ACCOUNTS headings, quoted in 433-A(OIC)'s map at y 464.1 and
// y 405.4. Both headings ARE drawn, at baselines 456.1 and 397.4; 464.1 and 405.4 are their
// RUN TOPS. One declared y convention, and two coordinates in the other one, invisible for as
// long as the counter that would have compared them was dead. See [AB-Y1].

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry, Y_CONVENTION } from './page-geometry.mjs';
import { DECLARED } from './absence-declared.mjs';
import { examined } from './examined.mjs';

const VERBOSE = process.argv.includes('--verbose');
const MAPS = 'adapters/pdf/maps';
const B = String.fromCharCode(92);      // see control-char-scan.mjs — never spell an escape

export const MAPPED_FORMS = () =>
  readdirSync(MAPS).filter((f) => f.endsWith('.map.json')).map((f) => f.replace('.map.json', '')).sort();

/** The artefacts whose prose carries evidence, per form, plus the two shared specs. */
export const sweptFiles = () => {
  const out = [];
  for (const f of MAPPED_FORMS())
    for (const k of ['map', 'headings', 'totals', 'name-lies', 'crosswalk-classification'])
      if (existsSync(`${MAPS}/${f}.${k}.json`)) out.push({ form: f, file: `${MAPS}/${f}.${k}.json` });
  for (const s of ['adapters/hubspot/asset-row-shapes.json', `${MAPS}/_subjects.cross-form.json`,
                   `${MAPS}/_carried.cross-form.json`, `${MAPS}/_cross-form-coordinates.json`])
    if (existsSync(s)) out.push({ form: null, file: s });
  return out;
};

/** What the boundary removes, counted rather than asserted away. */
export const EXCLUDED = () => [
  { what: "the engine's .mjs comments", n: ['adapters/pdf', 'adapters/hubspot']
      .filter(existsSync).flatMap((d) => readdirSync(d).filter((x) => x.endsWith('.mjs'))).length,
    why: 'a comment states why code does what it does, and the code is asserted by the sweeps that read it. This file is about EVIDENCE — a written finding a later author reads instead of re-reading the page.' },
  { what: 'samples/*.json fixture prose', n: existsSync('samples') ? readdirSync('samples').filter((x) => x.endsWith('.json')).length : 0,
    why: 'registered by sweep-boundary.mjs [SB-10], which counts what it removes and compares every figure the tree can derive' },
];

// ---------------------------------------------------------------------------------------
// EVERY PROSE STRING IN A DOCUMENT, WITH ITS PATH.
// ---------------------------------------------------------------------------------------
// SUPPORT IS JUDGED PER RECORD, NOT PER STRING, AND THAT IS A CORRECTION THIS FILE MADE TO
// ITSELF ON ITS FIRST RUN. Evidence in these artefacts is authored as a RECORD: a name-lie
// entry carries `printed_marker`, `page`, `evidence` and `cost_if_bound_by_name` as siblings,
// and the coordinate that supports the whole entry sits in one of them. Reading each string
// alone reported 57 unsupported claims, of which the great majority were one short field of a
// fully evidenced record. A guard tuned to fire constantly gets turned off, and a guard that
// gets turned off is worse than none — so the unit of support is the parent object.

export const proseIn = (doc) => {
  const out = [];
  const walk = (o, p, parent) => {
    if (typeof o === 'string') { out.push({ at: p, value: o, record: parent }); return; }
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k, o);
  };
  walk(doc, '', doc);
  return out;
};

// ---------------------------------------------------------------------------------------
// WHICH FORM A SENTENCE IS ABOUT.
//
// LONGEST SPELLING FIRST, or "433-A(OIC) prints no such column" is read as a claim about
// 433-A — the cross-form confusion this file exists to separate, introduced by the reader
// that was supposed to detect it.
// ---------------------------------------------------------------------------------------
const FORM_SPELLINGS = [
  [/433-?A\s*\(\s*OIC\s*\)/i, '433aoi'],
  [/433-?B\s*\(\s*OIC\s*\)/i, '433boi'],
  [/433-?F/i,                 '433f'],
  [/433-?A/i,                 '433a'],
];
/** Every form a sentence names, in the order it names them. */
export const formsNamedIn = (s) => {
  const hits = [];
  let rest = s;
  for (const [re, form] of FORM_SPELLINGS) {
    const g = new RegExp(re.source, 'gi');
    let m;
    while ((m = g.exec(rest))) hits.push({ form, index: m.index });
    rest = rest.replace(g, (t) => ' '.repeat(t.length));   // consumed, so 433-A(OIC) is not re-read as 433-A
  }
  return [...new Set(hits.sort((a, b) => a.index - b.index).map((h) => h.form))];
};

// ---------------------------------------------------------------------------------------
// AN ABSENCE CLAIM.
//
// The vocabulary is enumerated, not open-ended, and each shape carries the reading it asserts.
// A phrase this list does not know is not swept, and the count of prose strings it passed over
// is printed — so the sweep's own reach is a figure rather than an impression.
// ---------------------------------------------------------------------------------------
export const ABSENCE_SHAPES = [
  { id: 'AB-01', about: 'page', re: /prints? no\b(?! line marker anywhere)/i, gloss: 'the form prints no X' },
  { id: 'AB-02', about: 'page', re: /prints? none\b/i,                        gloss: 'the form prints none' },
  { id: 'AB-03', about: 'page', re: /draws? no\b/i,                           gloss: 'the page draws no X' },
  { id: 'AB-04', about: 'page', re: /draws? none\b/i,                         gloss: 'the page draws none' },
  { id: 'AB-05', about: 'page', re: /does not print|doesn't print/i,          gloss: 'the form does not print X' },
  { id: 'AB-06', about: 'page', re: /no (?:printed |drawn )?(?:cell|column|box|widget|checkbox|selector|marker|question|flag|line)s? (?:for|of|at|on|anywhere|here|there|beside|to)\b/i,
    gloss: 'there is no cell for Y' },
  { id: 'AB-07', about: 'page', re: /nothing (?:else )?is drawn|no caption at all is drawn|nothing (?:else )?(?:is )?printed/i,
    gloss: 'nothing is drawn in this region' },
  { id: 'AB-08', about: 'map',  re: /no counterpart\b/i,                      gloss: 'no counterpart exists' },
  { id: 'AB-09', about: 'map',  re: /(?:the )?map does not bind|not (?:currently )?mapped|does not reach it|binds none/i,
    gloss: 'the map does not bind it' },
  { id: 'AB-10', about: 'page', re: /NO CELL AND NO ROUTING|no flag\b/i,      gloss: 'the form draws no flag cell' },
];

/**
 * The support a sentence offers for its own absence claim.
 *
 * `geometry` and `quoted` are evidence read OFF THE PAGE. `map-only` is the defect class: a
 * claim worded about the printed page whose sentence offers nothing a page could contradict.
 */
export const supportOf = (s) => {
  const kinds = [];
  if (new RegExp(B + 'b[xy] ' + B + 'd').test(s)) kinds.push('geometry');
  if (/["'‘’“”][^"'‘’“”]{3,}["'‘’“”]/.test(s)) kinds.push('quoted');
  if (/\bpage \d|\bline \d|\b\(\d+[a-z]?\)/i.test(s)) kinds.push('located');
  // `spec` IS DRAWN EVIDENCE, CITED RATHER THAN RESTATED, and admitting it is [D-06]'s own fix
  // being taken at its word. asset-row-shapes.json carries a per-(column, form) verdict —
  // `printed_as_checkbox` with the printed label's page, baseline and x1 and the widget names
  // the form draws, `row_flag` for a routing discriminator the form draws no cell for — and
  // those entries ARE the reading of the page. A claim that defers to them is supported by
  // the page; a claim that defers to the MAP is not, and telling those two apart is the whole
  // subject of this file. The distinction is the citation's TARGET, not its form.
  if (/asset-row-shapes|printed_as_checkbox|printed_but_unmapped_on|CANONICAL row/i.test(s)) kinds.push('spec');
  if (/topmostSubform\[0\]|`?map`?\b|groups?\.|checkboxes\.|slot|binds?\b|row_flag|never_autofill/i.test(s)) kinds.push('map');
  return kinds;
};

// ---------------------------------------------------------------------------------------
// THE COORDINATE CLASSIFIER — the four universes.
//
// EXPORTED, AND blanket-audit.mjs [K-12] READS THIS ONE rather than a second copy. guard-sweep's
// (c) register records what a re-derived copy costs: a second implementation of the marker
// pairing disagreed 40-to-3 with the original and the whole disagreement was in the copy.
// ---------------------------------------------------------------------------------------
const NUM = '(' + B + 'd+(?:' + B + '.' + B + 'd+)?)';
const COORD = new RegExp(B + 'b([xy]) ' + NUM, 'g');

/**
 * Every coordinate quoted in a text, classified by the universe it belongs to.
 * @returns {Array<{axis:'x'|'y', value:number, kind:'point'|'band'|'widget'|'cross-form', form:string|null, at:string}>}
 */
export const classifyCoordinates = (text, hostForm, at = '') => {
  const out = [];
  COORD.lastIndex = 0;
  let m;
  while ((m = COORD.exec(text))) {
    const axis = m[1], value = Number(m[2]);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 12);
    const before = text.slice(Math.max(0, m.index - 60), m.index);
    const sentence = text.slice(Math.max(0, m.index - 240), m.index + 120);

    // FACTOR — `x` as a MULTIPLICATION SIGN, not an axis. "2 slots x 11 text columns",
    // "a FACTOR feeder (x 0.8)", "s5_box_d_for_12_month_multiplier x 12". All three read as
    // an x coordinate to a scanner that keys on the letter, and all three were reported as
    // coordinates the page does not draw on this file's first full run. The discriminator is
    // what sits to the LEFT: a coordinate follows `at `, a comma, or a page reference, and a
    // multiplication sign follows a word, a number or a closing bracket.
    if (axis === 'x' && /(?:factor|multiplier|times|slots?|columns?)[^.]{0,24}$/i.test(before)) {
      out.push({ axis, value, kind: 'factor', form: hostForm, at }); continue;
    }

    // REGION BOUNDARY — a HALF-OPEN band. "no caption at all is drawn anywhere right of x 385"
    // bounds a region and claims it empty; it does not claim a run sits at x 385. Same family
    // as a closed band, and the same inversion: finding nothing there is the claim holding.
    if (new RegExp('(?:right|left|above|below|beyond)\\s+of\\s+$|(?:above|below)\\s+$', 'i').test(before)) {
      out.push({ axis, value, kind: 'band', form: hostForm, at }); continue;
    }

    // ORDER IS LOAD-BEARING: a rectangle is written `(y 170.6..183.6, x 151.2..190.8)` and its
    // first number OPENS A RANGE, so a band test placed first claims every widget rectangle
    // before the widget test is reached. The canary planted one rectangle and caught exactly
    // that on the first run of this file.
    // WIDGET — the number describes a rectangle rather than a baseline.
    if (/rect(?:angle)?[^.]{0,40}$|widget"?\s*:\s*"?[^"]{0,30}$/i.test(before)) {
      out.push({ axis, value, kind: 'widget', form: hostForm, at }); continue;
    }

    // BAND — the number is one end of a range. `y 489..501`, `y 480-760`, and the trailing half
    // of either. A band bounds a REGION; it is a scan window or a claim that the region is
    // empty, and neither asserts that a run sits at that exact baseline.
    const opensBand  = /^\s*(?:\.\.|-\s*\d|–|—)/.test(after);
    const closesBand = new RegExp('(?:' + B + 'd|' + B + '.)(?:' + B + '.' + B + '.|-|–|—)\\s*$').test(before + '');
    const inBandList = /\bbands?\b[^.]{0,80}$/i.test(before);
    if (opensBand || closesBand || inBandList) { out.push({ axis, value, kind: 'band', form: hostForm, at }); continue; }

    // CROSS-FORM — the sentence names a form that is not the artefact's own. The LAST form
    // named before the coordinate owns it: "433-A(OIC) page 5 y 421.3", quoted inside
    // 433-B(OIC)'s map, is a coordinate on 433-A(OIC).
    const named = formsNamedIn(sentence);
    const owner = named.length ? named[named.length - 1] : hostForm;
    out.push({ axis, value, kind: owner && owner !== hostForm ? 'cross-form' : 'point', form: owner, at });
  }
  return out;
};

// ---------------------------------------------------------------------------------------
// THE DRAWN PAGE, PER FORM, READ ONCE.
// ---------------------------------------------------------------------------------------
const r1 = (v) => Math.round(v * 10) / 10;
const pageCache = new Map();
export const drawnOf = async (form) => {
  if (pageCache.has(form)) return pageCache.get(form);
  const path = `adapters/pdf/forms/f${form}.pdf`;
  if (!existsSync(path)) return null;
  const bytes = readFileSync(path);
  const pages = await readPrintedText(bytes);
  const { widgets } = await readWidgetGeometry(bytes);
  const baselines = new Set(), tops = new Set(), xs = new Set();
  for (const pg of pages) for (const t of pg.items) {
    baselines.add(r1(t.y1)); tops.add(r1(t.y2)); xs.add(r1(t.x1)); xs.add(r1(t.x2));
  }
  const wy = new Set(), wx = new Set();
  for (const w of widgets) if (w.rect) {
    wy.add(r1(w.rect[1])); wy.add(r1(w.rect[3])); wx.add(r1(w.rect[0])); wx.add(r1(w.rect[2]));
  }
  // THE PRESENCE SET IS THE UNION, and matching blanket-audit [K-12] here is deliberate:
  // [S-27] claims every quoted coordinate is "a value the page actually draws", which is a
  // claim about a NUMBER corresponding to something real — a baseline, a run top, or a widget
  // rectangle edge. A baseline-only test is a stricter claim than the one being audited, and
  // on this tree it fired on 62% of the population. A guard tuned to fire constantly gets
  // turned off. `baselines` and `tops` stay separate so a MISS can be diagnosed as "drawn,
  // but quoted in the other convention" rather than reported as a bad transcription.
  const anyY = new Set([...baselines, ...tops, ...wy]);
  const anyX = new Set([...xs, ...wx]);
  const out = { baselines, tops, xs, wy, wx, anyY, anyX };
  pageCache.set(form, out);
  return out;
};

// ---------------------------------------------------------------------------------------
// THE CANARY. Every detector carries one.
// ---------------------------------------------------------------------------------------
export const canary = () => {
  const misses = [];
  // (a) the absence detector sees each registered shape, and stays silent on a plain sentence.
  for (const sh of ABSENCE_SHAPES) {
    const probe = { 'AB-01': '433-A prints no column of that kind.', 'AB-02': 'The OIC page prints none.',
      'AB-03': 'The page draws no question mark.', 'AB-04': 'This page draws none.',
      'AB-05': 'The form does not print a total here.', 'AB-06': 'There is no cell for the discount.',
      'AB-07': 'nothing else is drawn in the band y 519..530.', 'AB-08': 'They have no counterpart anywhere.',
      'AB-09': 'The form prints a cell and the map does not bind it.', 'AB-10': 'NO CELL AND NO ROUTING on this form.' }[sh.id];
    if (!sh.re.test(probe)) misses.push(`${sh.id} did not match its own planted sentence`);
  }
  if (ABSENCE_SHAPES.some((s) => s.re.test('The page prints a total at y 240.7 and the map binds it.')))
    misses.push('a shape fired on a sentence asserting PRESENCE — the detector cannot tell the two apart');

  // (b) the coordinate classifier puts each planted coordinate in the universe it was planted in.
  const cases = [
    ['point',      '433f', 'the caption is at y 240.7, x 120.3..435.6', 'y', 240.7],
    ['band',       '433f', 'nothing is drawn in the band y 489..501 right of x 385', 'y', 489],
    ['widget',     '433f', 'a PDFButton whose rectangle (y 170.6..183.6, x 151.2..190.8) lies over', 'y', 170.6],
    ['cross-form', '433boi', 'while 433-A(OIC) page 5 y 421.3 prints an ALTERNATIVE', 'y', 421.3],
    ['band',       '433aoi', 'no caption at all is drawn anywhere right of x 385 on that row', 'x', 385],
    ['factor',     '433aoi', 'a FACTOR feeder (x 0.8), which the totals schema has no field for', 'x', 0.8],
    ['factor',     '433aoi', '22 in 5ab_real_property: 2 slots x 11 text columns, no checkboxes', 'x', 11],
  ];
  for (const [want, host, text, axis, value] of cases) {
    const got = classifyCoordinates(text, host).find((c) => c.axis === axis && c.value === value);
    if (!got) { misses.push(`classifier found no ${axis} ${value} in its own planted "${want}" case`); continue; }
    if (got.kind !== want) misses.push(`classifier read ${axis} ${value} as "${got.kind}", planted as "${want}"`);
  }

  // (c) the form reader does not read 433-A(OIC) as 433-A.
  const named = formsNamedIn('433-A(OIC) prints X .8 and 433-A prints no column of that kind');
  if (!(named.includes('433aoi') && named.includes('433a')))
    misses.push(`form reader returned [${named.join(', ')}] on a sentence naming 433-A(OIC) and 433-A`);
  if (formsNamedIn('433-A(OIC) alone').includes('433a'))
    misses.push('form reader read 433-A(OIC) as also naming 433-A');

  return { checks: ABSENCE_SHAPES.length + cases.length + 3, misses };
};

// ---------------------------------------------------------------------------------------
// THE RUN.
// ---------------------------------------------------------------------------------------
const main = async () => {
  const problems = [];
  const files = sweptFiles();
  const forms = MAPPED_FORMS();

  console.log(`absence sweep: ${files.length} artefact(s) across ${forms.length} mapped form(s) — ${forms.join(', ')}`);
  console.log(`  y convention: ${Y_CONVENTION} (one, declared in page-geometry.mjs)`);

  const cn = canary();
  if (cn.misses.length) {
    console.log('');
    console.log(`  CANARY DEAD — ${cn.misses.length} of ${cn.checks} planted case(s) missed:`);
    for (const m of cn.misses) console.log(`    ${m}`);
    console.log('  A sweep whose detector cannot see its own planted claims would report a clean tree');
    console.log('  by failing to look. STOP.');
    process.exit(2);
  }
  console.log(`  canary: ${cn.checks} planted case(s), 0 missed — every absence shape fires on its own sentence,`);
  console.log(`          stays silent on a presence sentence, and every coordinate lands in its planted universe`);
  for (const ex of EXCLUDED()) console.log(`  not swept: ${ex.what} (${ex.n}) — ${ex.why}`);

  // ── HALF A: the absence claims ─────────────────────────────────────────────────────────
  const claims = [];
  let prose = 0;
  for (const { form, file } of files) {
    let doc;
    try { doc = JSON.parse(readFileSync(file, 'utf8')); }
    catch (e) { problems.push({ kind: 'unreadable', file, why: e.message }); continue; }
    for (const p of proseIn(doc)) {
      prose++;
      for (const sh of ABSENCE_SHAPES) {
        if (!sh.re.test(p.value)) continue;
        const m = sh.re.exec(p.value);
        const before = p.value.slice(0, m ? m.index : p.value.length);
        const named = formsNamedIn(before);
        // SUPPORT comes off the whole RECORD the claim sits in — see proseIn above.
        const recordText = p.record && typeof p.record === 'object'
          ? Object.values(p.record).filter((v) => typeof v === 'string').join(' ')
          : p.value;
        claims.push({
          file, at: p.at, id: sh.id, about: sh.about, gloss: sh.gloss,
          subject: named.length ? named[named.length - 1] : form,
          hostForm: form, support: supportOf(recordText), text: p.value,
        });
      }
    }
  }

  const byShape = new Map();
  for (const c of claims) byShape.set(c.id, (byShape.get(c.id) || 0) + 1);

  console.log('');
  console.log(`  ${prose} prose string(s) read; ${claims.length} absence claim(s) found across ${new Set(claims.map((c) => c.file)).size} artefact(s)`);
  for (const sh of ABSENCE_SHAPES)
    console.log(`    ${sh.id}  ${String(byShape.get(sh.id) || 0).padStart(3)}  about the ${sh.about.padEnd(4)}  ${sh.gloss}`);

  // THE FINDING CLASS. A claim worded about the PRINTED PAGE whose record offers only map
  // evidence is the [D-06] shape: nothing that was consulted could have contradicted it.
  const undrawn = claims.filter((c) => c.about === 'page'
    && !c.support.includes('geometry') && !c.support.includes('quoted')
    && !c.support.includes('located') && !c.support.includes('spec'));

  const disposed = [], undeclared = [];
  for (const c of undrawn) {
    const key = `${c.file} :: ${c.at}`;
    // `at` is a RegExp for a family, or an array of exact paths for an enumerated pair.
    const d = DECLARED.find((x) => (Array.isArray(x.at) ? x.at.includes(key) : x.at.test(key)));
    (d ? disposed : undeclared).push(d ? { ...c, decl: d } : c);
  }

  console.log('');
  console.log(`  PAGE-CLAIMS CARRYING NO DRAWN EVIDENCE OF THEIR OWN — ${undrawn.length}, every one disposed below:`);
  for (const d of DECLARED) {
    const mine = disposed.filter((c) => c.decl.id === d.id);
    console.log(`    ${d.id}  ${String(mine.length).padStart(3)}  ${d.kind}`);
    for (const c of mine) console.log(`           ${c.id} ${c.file} :: ${c.at}`);
    if (!mine.length) {
      // A REGISTERED DISPOSITION THAT DISPOSES OF NOTHING IS A STALE ONE, and stale is the
      // shape a decision for a gap that has gone away takes. Same standard as [A2].
      console.log(`           STALE — this entry disposes of nothing on this tree.`);
      problems.push({ kind: 'stale-declaration', id: d.id });
    }
  }
  const openN = disposed.filter((c) => c.decl.kind === 'open').length;
  console.log(`    ${disposed.length} disposed: ${disposed.length - openN} asserted elsewhere, ${openN} OPEN — reported in full, carrying an id, not resolved`);

  if (undeclared.length) {
    console.log('');
    console.log(`  UNDECLARED — ${undeclared.length} page-claim(s) with no drawn evidence and no disposition:`);
    for (const c of undeclared) {
      console.log(`    ${c.id} ${c.file} :: ${c.at}  (subject: ${c.subject || 'unstated'})`);
      console.log(`        "${c.text.slice(0, 160)}${c.text.length > 160 ? '…' : ''}"`);
      problems.push({ kind: 'undeclared', ...c });
    }
  }

  // ── HALF B: the coordinates that support them ──────────────────────────────────────────
  const coords = [];
  for (const { form, file } of files) {
    if (!form) continue;                      // shared specs carry no per-form geometry
    if (!/\.(map|headings)\.json$/.test(file)) continue;
    let doc;
    // AN UNREADABLE ARTEFACT IS A STOP, NOT A SKIP — and the first draft of this half had the
    // bare `catch { continue }` that guard-sweep refused. A file that will not parse contributes
    // the same ZERO coordinates as one holding none, so the count below would fall and the run
    // would still print OK. Half A already stopped on this; Half B did not, which is the same
    // guard written twice and only one of them armed.
    try { doc = JSON.parse(readFileSync(file, 'utf8')); }
    catch (e) { problems.push({ kind: 'unreadable', file, why: e.message }); continue; }
    for (const p of proseIn(doc)) coords.push(...classifyCoordinates(p.value, form, `${file} :: ${p.at}`));
  }

  const kinds = { point: 0, band: 0, widget: 0, 'cross-form': 0, factor: 0 };
  for (const c of coords) kinds[c.kind]++;

  // ── [D-14] — THE OWNING FORM IS DECLARED, AND THE INFERENCE IS KEPT ONLY TO BE SCORED ──
  //
  // Until this commit a cross-form coordinate was EXCLUDED from the comparison, because the
  // only reading available was "the last form named before it" and that reading is wrong on 23
  // of the 27. It is now read from adapters/pdf/maps/_cross-form-coordinates.json, one row per
  // occurrence, and the declared owner REPLACES the inferred one before any comparison runs.
  //
  // Two STOPs, in both directions: a cross-form coordinate with no row is undeclared, and a row
  // matching no coordinate is a declaration about prose that is no longer there. Neither is
  // silently absorbed — an unread register and an empty one must not report the same figure.
  let xfDoc = null, xfUnreadable = null;
  try { xfDoc = JSON.parse(readFileSync(`${MAPS}/_cross-form-coordinates.json`, 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') xfUnreadable = e.message; }
  if (xfUnreadable) problems.push({ kind: 'unreadable', file: `${MAPS}/_cross-form-coordinates.json`, why: xfUnreadable });
  const xfRows = xfDoc?.declarations || [];
  const xfUsed = new Set();
  const xfUndeclared = [];
  let xfAgree = 0;
  {
    const nth = new Map();
    for (const c of coords) {
      if (c.kind !== 'cross-form') continue;
      const k = `${c.at}|${c.axis}|${c.value}`;
      nth.set(k, (nth.get(k) || 0) + 1);
      const occurrence = nth.get(k);
      const d = xfRows.find((x) => x.at === c.at && x.axis === c.axis && x.value === c.value && x.occurrence === occurrence);
      if (!d) { xfUndeclared.push({ ...c, occurrence }); continue; }
      xfUsed.add(d.id);
      if (d.form === c.form) xfAgree++;
      c.declared = d;
      c.form = d.form;
    }
  }
  const xfOrphans = xfRows.filter((r) => !xfUsed.has(r.id));
  console.log('');
  console.log(`  COORDINATES — ${coords.length} quoted across the map and headings artefacts, by universe:`);
  console.log(`    point       ${String(kinds.point).padStart(4)}  a run is claimed drawn at this baseline — compared against the DRAWN TEXT of its own form`);
  console.log(`    band        ${String(kinds.band).padStart(4)}  one end of a range: a scan window, or a claim the region is EMPTY. Not a presence claim.`);
  console.log(`    widget      ${String(kinds.widget).padStart(4)}  a rectangle edge — a different number about a different object than a text baseline`);
  console.log(`    cross-form  ${String(kinds['cross-form']).padStart(4)}  quoted about another form — compared against the page of the form its declaration names, never the host's [D-14]`);

  const drawn = new Map();
  for (const f of new Set([...forms, ...coords.map((c) => c.form).filter(Boolean)])) drawn.set(f, await drawnOf(f));

  const bad = [], conventionBreach = [];
  for (const c of coords) {
    // ONLY HOST-FORM POINT CLAIMS ARE COMPARED, AND THE THREE EXCLUSIONS ARE CLAIMS.
    //
    //   band       excluded because it is not a presence claim at all. A range bounds a region;
    //              where the region is claimed EMPTY, finding nothing there is the claim HOLDING,
    //              and a presence test would report a true claim as a failure.
    //   widget     excluded because a rectangle edge is compared against widget geometry, which
    //              [K-12] already folds into its own presence set; testing it here would be a
    //              second instrument measuring the same object and able to disagree with it.
    //   cross-form NO LONGER EXCLUDED, as of [D-14]. It used to be, and the reason was sound
    //              while it stood: the owning form was INFERRED from prose — the last form named
    //              before the coordinate — and that reading is wrong on 23 of the 27, because a
    //              leaf path `topmostSubform[0].F433-A-OIC_PageN[0]` and a filename
    //              `433aoi.totals.json` both carry the string a form-name reader matches as
    //              433-A. An inferred attribution was never a basis for a STOP. A DECLARED one
    //              is, so a cross-form coordinate carrying a row in
    //              _cross-form-coordinates.json is compared against the page of the form that
    //              row names. One still carrying no row stays out of the comparison and is a
    //              STOP in its own right, below.
    if (c.kind !== 'point' && !(c.kind === 'cross-form' && c.declared)) continue;
    const d = drawn.get(c.form);
    if (!d) { problems.push({ kind: 'no-page', ...c }); continue; }
    const v = r1(c.value);
    const hit = c.axis === 'y' ? d.anyY.has(v) : d.anyX.has(v);
    if (hit) continue;
    // A y that is not a baseline but IS a run top is not a bad transcription — it is the OTHER
    // convention, and saying which one it is turns "uncovered" into a fixable sentence.
    if (c.axis === 'y' && d.tops.has(v)) { conventionBreach.push(c); continue; }
    if (c.axis === 'y' ? d.wy.has(v) : d.wx.has(v)) { conventionBreach.push({ ...c, asWidget: true }); continue; }
    bad.push(c);
  }

  console.log('');
  const xfDeclared = kinds['cross-form'] - xfUndeclared.length;
  console.log(`  point coordinates compared against their own drawn page: ${kinds.point} checked, ` +
    `${bad.length} not drawn in any convention, ${conventionBreach.length} drawn but quoted in the other convention`);
  console.log(`  cross-form coordinates compared against the DECLARED form's drawn page [AB-C1]: ${xfDeclared} of ${kinds['cross-form']} declared in ` +
    `${MAPS}/_cross-form-coordinates.json, ${xfUndeclared.length} undeclared, ${xfOrphans.length} row(s) declaring prose that is no longer there`);
  console.log(`    the last-form-named reading this replaces agrees with the declaration on ${xfAgree} of ${xfDeclared}` +
    `${xfDeclared ? ` and is wrong on ${xfDeclared - xfAgree}` : ''} — which is why [D-14] required declaring rather than inferring`);
  console.log(`  not compared, each an exclusion with a reason: ${kinds.band} band end(s), ${kinds.widget} widget edge(s), ` +
    `${kinds.factor} multiplication sign(s) read as an axis by a scanner that keys on the letter`);
  for (const c of xfUndeclared) {
    console.log(`    [AB-C1] UNDECLARED  ${c.at}`);
    console.log(`        ${c.axis} ${c.value} (occurrence ${c.occurrence}) is quoted about a form that is not ${c.host || 'this artefact'}'s, and no row in _cross-form-coordinates.json names which.`);
    console.log(`        The reader would take "${c.form}", the last form named before it. That reading is wrong on 23 of the 27 already declared. Declare it.`);
    problems.push({ kind: 'undeclared-cross-form', ...c });
  }
  for (const r of xfOrphans) {
    console.log(`    [AB-C1] ORPHAN DECLARATION  [${r.id}] ${r.at} ${r.axis} ${r.value} (occurrence ${r.occurrence})`);
    console.log(`        declares an owning form for a cross-form coordinate this sweep does not find. The prose moved, or the coordinate did.`);
    problems.push({ kind: 'orphan-cross-form-declaration', ...r });
  }
  for (const c of conventionBreach) {
    console.log(`    [AB-Y1] ${c.at}`);
    console.log(`        ${c.axis} ${c.value} on ${c.form} is not a ${Y_CONVENTION}; it is the ${c.asWidget ? 'widget rectangle edge' : 'run TOP'} of a run that IS drawn.`);
    console.log(`        One declared y convention. This coordinate is in the other one.`);
    problems.push({ kind: 'convention', ...c });
  }
  for (const c of bad) {
    console.log(`    [AB-Y2] ${c.at}`);
    console.log(`        ${c.axis} ${c.value} on ${c.form} is drawn nowhere on that form, in any convention.`);
    problems.push({ kind: 'not-drawn', ...c });
  }

  console.log('');
  if (!problems.length) {
    // PER HOST FORM. A claim belongs to the form whose artefact states it, which is the
    // same attribution the sweep already uses to decide which drawn page to check it against.
    // MAPPED_FORMS is the universe, not the set of forms that happen to have claims: a form
    // with none must be REPORTED as zero, or the one interesting row is the missing one.
    for (const f of MAPPED_FORMS()) {
      examined('absence-sweep', f, claims.filter((c) => c.hostForm === f).length, 'absence-claims');
    }
    console.log(`OK — ${claims.length} absence claim(s) enumerated; ${claims.length - undrawn.length} carry drawn evidence of their own,`);
    console.log(`${undrawn.length} carry none and every one of those is disposed (${disposed.length - openN} settled elsewhere, ${openN} OPEN and named).`);
    console.log(`${kinds.point} host-form point coordinate(s) compared against their own drawn page and ${xfDeclared} cross-form coordinate(s) against the page of the form each one DECLARES, 0 undrawn.`);
    return 0;
  }
  console.log(`ABSENCE SWEEP — ${problems.length} problem(s). "The map does not reach it" and "the page does not print it"`);
  console.log('are different facts, and map reachability never settles a claim about the printed page.');
  return problems.some((p) => p.kind === 'unreadable') ? 2 : 3;
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) process.exit(await main());
