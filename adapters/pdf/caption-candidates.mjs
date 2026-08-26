// THE CANDIDATE CAPTIONS FOR EVERY CELL ON A FORM, BY DIRECTION, NEVER ACROSS DIRECTIONS.
//
//   node adapters/pdf/caption-candidates.mjs <form> [--verbose]
//
//   exit 0 = the candidates derived and the band re-derived from the page
//   exit 2 = the form draws no widgets on the page this reads, or the pitch could not be derived
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS IS FOR, AND THE ONE THING IT REFUSES TO DO
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A binding on 433-D has to name the printed caption that governs its cell. This file produces
// the CANDIDATES that naming may draw from, and bounds it: adapters/pdf/assert-subject-class.mjs
// refuses a declared caption that is not one of the candidates for its own cell, so a chain
// cannot quote a run from somewhere else on the page.
//
// IT DOES NOT RANK ACROSS DIRECTIONS, AND THAT IS THE WHOLE OF ITS DISCIPLINE. [D-22] records
// adapters/pdf/correlate-labels.mjs answering 433-D's "b. Account number" probe with the DIRECT
// DEBIT banner one row up, because it ranks `above` and `left` on ONE distance scale and 28.6pt
// above beat 28.9pt left. Those are not the same measurement. A run 28pt above a cell and a run
// 28pt to its left stand in different relations to it, and putting both on one number is what
// produced the wrong answer. So there is no `label` here and there never will be: each direction
// is ranked WITHIN ITSELF, all four are returned, and which one governs is a DECLARATION the map
// makes and this file's band then checks.
//
// THERE IS NO 433d.labels.json AND THIS DOES NOT WRITE ONE. correlate-labels.mjs refused to
// write for this form and the probes stay as they are; nothing here is a substitute for it, and
// no binding cites one.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE BAND, DECLARED AND DERIVED  [R-15]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Unchanged from the derivation that was accepted before it: BAND_ABOVE is two printed rows,
// BAND_BELOW one, SIDE is 120pt, and the row pitch they are multiples of is the MEDIAN gap
// between adjacent distinct printed baselines on the page -- derived from the form's own layout,
// never typed. THE CONSTANTS ARE NOT RETUNED HERE. Choosing a band because it yields the
// classification already believed is fitting the instrument to the wanted answer, and it is what
// [D-22] refuses to do to the correlator's own probes; the band that was reported is the band
// that is used.
//
// The band is a BOUND on what a declaration may name. The directional candidates are a much
// tighter reading of the same page, and the two are kept separate on purpose: a candidate that
// falls outside the band is reported, because it would mean the two readings disagree about
// what is near this cell.
//
// A SERIES CAPTION SITS AT ONE END OF ITS SERIES, so the band is satisfied for a cell if the
// declared caption lies in the band of that cell OR of any member of its printed series. Without
// that, "b. Account number" -- which captions seventeen boxes drawn across 300pt -- would be
// out of band for the last nine of them, and the fix would have been to widen SIDE until it
// wasn't, which is the retune this file refuses. Derived from the drawn series, not declared.

import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry, baselineOfRun } from './page-geometry.mjs';

export const TOL = 2;      // point slack on the overlap tests, as correlate-labels.mjs uses
export const SIDE = 120;   // horizontal reach of the BAND, for the caption-left layout [D-22] names

const round1 = (n) => Math.round(n * 10) / 10;

/** The median gap between adjacent distinct printed baselines. Derived, never typed. */
export const rowPitch = (runs) => {
  const baselines = [...new Set(runs.map((r) => round1(baselineOfRun(r))))].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < baselines.length; i++) { const g = baselines[i] - baselines[i - 1]; if (g > 0.5 && g < 60) gaps.push(g); }
  gaps.sort((a, b) => a - b);
  return { pitch: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null, baselines: baselines.length, gaps: gaps.length };
};

/**
 * PRINTED SERIES, derived geometrically and from nothing else.
 *
 * A series is a maximal set of two or more widgets that are DRAWN THE SAME SIZE, share one axis
 * (a common y-extent, or a common x-extent), sit at a CONSTANT pitch along the other, and are
 * ADJACENT: the space between two consecutive members is smaller than the members themselves.
 * That is what "the page draws these as repetitions of one thing" means in coordinates.
 *
 * IT IS DERIVED AND NOT READ OFF THE LEAF NAMES. `RoutingNumber1..9` would have given the same
 * answer here, and a leaf name is evidence of nothing ([R-08]), so it is not consulted.
 *
 * THE ADJACENCY CLAUSE IS NOT A TUNED THRESHOLD, and it is here because the first draft without
 * it manufactured series out of boundary pairs. Any two collinear boxes of one size satisfy
 * "constant pitch" by themselves, so a column of nine-point checkboxes yielded a two-member
 * "series" of RSI 1 and the debit self-identifier box 104pt below it, and another of that box
 * and the W-4 box 360pt above. Requiring the GAP to be smaller than a member says the page draws
 * them touching, which is what a repetition of one field looks like and what a coincidence of
 * alignment does not: 7.2pt between two 10.8pt account-number boxes, against 153pt between the
 * RSI column and the AI column.
 *
 * A CELL MAY BELONG TO MORE THAN ONE SERIES, and the first draft's `seen` set is why that is
 * said out loud. Excluding a cell once it had joined a series made the order of the two axes
 * decide the answer: RSI 5 was consumed into a spurious ROW pair with AI 1 before the COLUMN
 * pass ran, and the RSI column -- the one printed pair structure the ruling names by name --
 * never existed to be asserted over. Both axes are collected and the results deduplicated by
 * member set.
 */
export const printedSeries = (widgets) => {
  const found = new Map();
  const size = (w) => `${round1(w.rect[2] - w.rect[0])}x${round1(w.rect[3] - w.rect[1])}`;
  for (const [axis, same, along, extent] of [
    ['row', (w) => `${round1(w.rect[1])},${round1(w.rect[3])}`, (w) => w.rect[0], (w) => w.rect[2] - w.rect[0]],
    ['column', (w) => `${round1(w.rect[0])},${round1(w.rect[2])}`, (w) => w.rect[1], (w) => w.rect[3] - w.rect[1]]]) {
    const buckets = new Map();
    for (const w of widgets) {
      const k = `${same(w)}|${size(w)}`;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(w);
    }
    for (const members of buckets.values()) {
      if (members.length < 2) continue;
      members.sort((a, b) => along(a) - along(b));
      const adjacent = (a, b) => round1(along(b) - along(a)) - extent(a) < extent(a);
      let run = [members[0]];
      const flush = () => {
        if (run.length >= 2) {
          const names = run.map((w) => w.name);
          found.set(names.join('|'), { axis, size: size(run[0]), pitch: round1(along(run[1]) - along(run[0])), gap: round1(round1(along(run[1]) - along(run[0])) - extent(run[0])), members: names });
        }
        run = [];
      };
      for (let i = 1; i < members.length; i++) {
        const step = round1(along(members[i]) - along(members[i - 1]));
        const prev = run.length >= 2 ? round1(along(run[1]) - along(run[0])) : null;
        if (!adjacent(members[i - 1], members[i])) { flush(); run = [members[i]]; continue; }
        if (prev === null || Math.abs(step - prev) < 0.05) run.push(members[i]);
        else { flush(); run = [members[i - 1], members[i]]; }
      }
      flush();
    }
  }
  return [...found.values()];
};

/**
 * Every candidate caption for one cell, BY DIRECTION.
 *
 *   above   the run is wholly above the cell and their horizontal extents overlap
 *   below   wholly below, horizontal extents overlap
 *   left    the run ends left of the cell and their vertical extents overlap -- the same row
 *   right   the run starts right of the cell and their vertical extents overlap
 *
 * Each list is ranked by its OWN gap, in its own direction. No list is compared to another, and
 * NO LIST IS TRUNCATED. The first draft kept three per direction, as correlate-labels.mjs does
 * for its report, and a truncated bucket cannot answer the question the determinacy test asks:
 * "was there anything else in this direction at the same printed row". A fourth candidate at the
 * declared candidate's own gap would have been cut before it could compete, and the pairing
 * would have been reported DETERMINATE on the strength of the cut. `keep` is retained for the
 * report and defaults to everything.
 */
export const candidatesFor = (rect, runs, keep = Infinity) => {
  const [x1, y1, x2, y2] = rect;
  const above = [], below = [], left = [], right = [];
  for (const t of runs) {
    const vOverlap = t.y1 < y2 + TOL && t.y2 > y1 - TOL;
    const hOverlap = t.x1 < x2 + TOL && t.x2 > x1 - TOL;
    if (t.y1 >= y2 - TOL && hOverlap) above.push({ text: t.str, gap: round1(t.y1 - y2) });
    if (t.y2 <= y1 + TOL && hOverlap) below.push({ text: t.str, gap: round1(y1 - t.y2) });
    if (t.x2 <= x1 + TOL && vOverlap) left.push({ text: t.str, gap: round1(x1 - t.x2) });
    if (t.x1 >= x2 - TOL && vOverlap) right.push({ text: t.str, gap: round1(t.x1 - x2) });
  }
  const rank = (a) => a.sort((p, q) => p.gap - q.gap).slice(0, keep === Infinity ? undefined : keep);
  return { above: rank(above), below: rank(below), left: rank(left), right: rank(right) };
};

/** Every printed run inside the declared BAND of one cell. This is the BOUND, not the reading. */
export const bandFor = (rect, runs, pitch) => {
  const [x1, y1, x2, y2] = rect;
  const ABOVE = pitch * 2, BELOW = pitch * 1;
  return runs.filter((r) => {
    const b = baselineOfRun(r);
    if (b < y1 - BELOW || b > y2 + ABOVE) return false;
    return r.x2 >= x1 - SIDE && r.x1 <= x2 + SIDE;
  }).map((r) => r.str);
};

/** Read one form's page-1 candidates, band, pitch and printed series in one pass. */
export const readForm = async (form, page = 1) => {
  const bytes = readFileSync(`adapters/pdf/forms/f${form}.pdf`);
  const pagesText = await readPrintedText(bytes);
  const { widgets: all } = await readWidgetGeometry(bytes);
  const runs = pagesText[page - 1].items;
  const widgets = all.filter((w) => w.page === page && Array.isArray(w.rect));
  const { pitch, baselines, gaps } = rowPitch(runs);
  if (!widgets.length) return { stop: `${form} draws no widget on page ${page}` };
  if (!pitch) return { stop: `${form} page ${page}: the row pitch could not be derived from ${baselines} baseline(s)` };
  const series = printedSeries(widgets);
  const seriesOf = new Map();
  for (const s of series) for (const m of s.members) { if (!seriesOf.has(m)) seriesOf.set(m, []); seriesOf.get(m).push(s); }
  const cells = widgets.map((w) => ({
    name: w.name,
    stem: w.name.replace(/\[\d+\]$/, '').split('.').pop(),
    type: w.type,
    rect: w.rect.map(round1),
    candidates: candidatesFor(w.rect, runs),
    band: bandFor(w.rect, runs, pitch),
  }));
  // The band a declaration is checked against: this cell's, unioned with every member of its
  // printed series, because a series caption sits at one end of the series it captions.
  const byName = new Map(cells.map((c) => [c.name, c]));
  for (const c of cells) {
    const ss = seriesOf.get(c.name) || [];
    const siblings = [...new Set(ss.flatMap((s) => s.members))];
    c.series = siblings.length ? siblings : null;
    c.band_with_series = siblings.length ? [...new Set(siblings.flatMap((m) => byName.get(m).band))] : c.band;
  }
  return { form, page, pitch, baselines, gaps, runs: runs.length, widgets: widgets.length, cells, series };
};

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('adapters/pdf/caption-candidates.mjs');
if (isMain) {
  const form = process.argv[2] || '433d';
  const r = await readForm(form);
  if (r.stop) { console.error(`STOP — ${r.stop}`); process.exit(2); }
  console.log(`CAPTION CANDIDATES — ${form} page ${r.page}: ${r.widgets} widget(s), ${r.runs} printed run(s)`);
  console.log(`  row pitch ${r.pitch.toFixed(2)}pt, the MEDIAN of ${r.gaps} gap(s) between ${r.baselines} distinct baselines — derived, not typed`);
  console.log(`  band      ${(r.pitch * 2).toFixed(1)}pt above, ${r.pitch.toFixed(1)}pt below, ${SIDE}pt either side — unchanged from the accepted derivation`);
  console.log(`  series    ${r.series.length} printed series derived from the drawn geometry, covering ${r.series.reduce((n, s) => n + s.members.length, 0)} cell(s)`);
  for (const s of r.series) console.log(`      ${s.axis} pitch ${s.pitch}pt, size ${s.size}, ${s.members.length} member(s): ${s.members.map((m) => m.split('.').pop()).join(' ')}`);
  console.log('');
  for (const c of r.cells) {
    console.log(`  ${c.stem}  [${c.type}]  x=[${c.rect[0]},${c.rect[2]}] y=[${c.rect[1]},${c.rect[3]}]  band ${c.band.length} run(s)`);
    for (const d of ['above', 'below', 'left', 'right'])
      if (c.candidates[d].length) console.log(`      ${d.padEnd(6)} ${c.candidates[d].slice(0, 4).map((x, i) => `${i + 1}:${JSON.stringify(x.text.slice(0, 60))}@${x.gap}`).join('  ')}${c.candidates[d].length > 4 ? `  (+${c.candidates[d].length - 4} more)` : ''}`);
  }
}
