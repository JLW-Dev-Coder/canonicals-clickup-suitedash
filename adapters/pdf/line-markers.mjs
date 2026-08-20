// Every printed line marker on a form, with its page and its y, plus the widget nearest to it.
//
//   node adapters/pdf/line-markers.mjs <form>
//
// WHY THE MARKERS ARE EXTRACTED SEPARATELY
// ----------------------------------------
// A map is authored BY LINE — "line 18a", "line (39)" — because that is how the taxpayer, the
// examiner and the instructions all refer to a cell. The AcroForm names look like they encode
// the same thing (`p2_t23_14a[0]`, `Interest_Dividends[1]`) and on 433-A they systematically
// DO NOT: every internal suffix lagged the printed line by one, form-wide. A map author who
// reads `14a` off a field name and writes it into the map has recorded a line number that is
// off by one everywhere, and nothing downstream can tell, because both numbers exist.
//
// So the marker is read from the DRAWN TEXT and the widget is attached to it by geometry. What
// the name says is reported alongside, never used.
//
// WHAT COUNTS AS A MARKER differs by form and is not guessed. 433-A prints bare "18a"; the OIC
// forms print parenthesised "(39)" and lettered "Box D". Both spellings are accepted, and a
// form printing neither reports zero rather than inventing a pattern that fits.

import { readFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry, baselineOfRun, runTopOf, Y_CONVENTION } from './page-geometry.mjs';

// THE y THIS TOOL REPORTS IS A BASELINE, and it did not used to be.
//
// Until this commit a marker row carried ONE y field holding `t.y2` - the top of the marker's
// box - under the same bare name every other tool in this engine uses for a baseline. The
// pairing arithmetic below WANTS the box, because it compares the marker against a widget
// RECTANGLE and a box is the honest operand there; the CLI listing and anything reading a row
// wants the baseline, because that is the convention page-geometry.mjs declares and the maps
// are authored against. One field cannot be both, so a row now carries both, named:
//
//   y           the declared convention, page-geometry.Y_CONVENTION === 'text-baseline'
//   y_run_top   baseline + the run's height, used ONLY by attachIn's band containment
//
// THE PAIRING IS UNCHANGED. attachIn reads `y_run_top`, which is the same expression the old
// `m.y` held, so every marker->widget pairing this tool produces is identical to the one it
// produced before. adapters/pdf/assert-y-convention.mjs PROVES that no-op in the same run
// rather than asserting it: it recomputes the whole pairing from the OLD expression and
// requires the two answers to agree marker for marker, on every mapped form.
export const Y_REPORTED = Y_CONVENTION;

// EXPORTED SO THERE IS ONE PAIRING AND NOT TWO. guard-sweep.mjs [F-03..F-06] derives its
// under-determination figures from THIS function. Re-implementing the filter there to check a
// claim about the filter would be the parallel-list class committed by the sweep that exists
// to enumerate it — the P-02 remedy, applied before the second copy was written rather than
// after it drifted.
export async function markerPairing(form) {
  const src = `adapters/pdf/forms/f${form}.pdf`;
  const bytes = readFileSync(src);
  const text = await readPrintedText(bytes);
  const { widgets, pageCount } = await readWidgetGeometry(bytes);
  return { src, text, widgets, pageCount, rows: markersIn(text, pageCount), attach: attachIn(widgets) };
}

// "18a" / "18a." / "(39)" / "(39) $" — the trailing "$" is the currency glyph the IRS sets in
// the same run as the marker on the OIC forms, so it is stripped rather than treated as text.
// "Box D" is a marker in its own right: the OIC totals are referred to by box, not by line.
const LINE = /^\(?(\d{1,2}[a-z]?)\)?[.:]?\s*\$?$/i;
// Anchored at the START of the drawn run, not searched anywhere in it. 433-A(OIC) sets the box
// label and its caption as ONE run ("Box G Future Remaining Income"), so an exact-match pattern
// finds Boxes A-F and misses G and H entirely — the two that carry the offer calculation. A
// pattern that searched anywhere would instead match the body sentence "Enter the total from
// Box F", which is prose about a box on another page and numbers nothing.
const BOX = /^Box\s+([A-Z])\b/i;

const r1 = (n) => Math.round(n * 10) / 10;
const markersIn = (text, pageCount) => {
const rows = [];
for (let p = 0; p < pageCount; p++) {
  for (const t of text[p]?.items || []) {
    const line = (t.str.match(LINE) || [])[1];
    const box = (t.str.match(BOX) || [])[1];
    if (!line && !box) continue;
    rows.push({
      page: p + 1,
      marker: box ? `Box ${box.toUpperCase()}` : line,
      kind: box ? 'box' : 'line',
      y: r1(baselineOfRun(t)),          // REPORTED - the declared convention
      y_run_top: r1(runTopOf(t)),       // GEOMETRY - the operand attachIn's band test needs
      x1: r1(t.x1),
      x2: r1(t.x2),
      text: t.str,
    });
  }
}
return rows;
};

// The widget this marker belongs to: same page, vertically overlapping the marker's band, and
// the nearest one to its RIGHT. Markers on these forms sit left of the cell they number — on
// 433-A(OIC)'s Section 7 the marker IS the only thing that identifies the row, because the
// caption above every cell in that column is the column header, shared by all of them.
// Matched by BAND CONTAINMENT, not by top-edge proximity. A marker is set at its own baseline
// and the cell it numbers is a box around that baseline, so the two top edges differ by however
// tall the box is — on 433-A(OIC)'s line (39) that is 9.9pt, which a top-edge tolerance either
// misses or has to be widened so far that it starts catching the row above.
// RANKED BY VERTICAL CENTRE, not by array order. Containment alone is not enough: 433-A(OIC)'s
// Section 7 money cells are tall enough that two consecutive cells both contain a marker's y,
// and both sit at the same x. Taking the first match then hands line (33) to the widget for
// line (32) — an off-by-one that looks entirely plausible and is exactly what this tool exists
// to prevent. Distance from the marker to each candidate's vertical centre separates them.
const TOL_Y = 2;
// RETURNS THE WHOLE CANDIDATE LIST, not just the winner, because HOW MANY CANDIDATES SURVIVED
// THE FILTER is the finding. The filter here is purely geometric and there is no property left
// to filter on — so this tool does not carry the money-probe defect (it never ranks before it
// filters), but it has the other exposure that shape can have: UNDER-DETERMINATION. When two
// candidates both survive, the distance tie-break INVENTS the answer, and a reader who is not
// told that cannot tell an answer the page determined from an answer this line chose.
// See adapters/pdf/guard-sweep.mjs [N-05] and [F-03..F-06].
const attachIn = (widgets) => (m) => {
  const mid = (w) => (w.rect[1] + w.rect[3]) / 2;
  const cands = widgets
    .filter((w) => w.page === m.page && w.rect
      && m.y_run_top >= w.rect[1] - TOL_Y && m.y_run_top <= w.rect[3] + TOL_Y
      && w.rect[0] >= m.x2 - TOL_Y)
    .sort((a, b) => Math.abs(mid(a) - m.y_run_top) - Math.abs(mid(b) - m.y_run_top) || a.rect[0] - b.rect[0]);
  // The alternative ordering is carried alongside so the exposure can be MEASURED rather than
  // asserted: leftmost-first is the other reading a person would reach for, and the number of
  // markers where the two disagree is how load-bearing the tie-break actually is.
  const byLeftmost = [...cands].sort((a, b) => a.rect[0] - b.rect[0]);
  return { winner: cands[0] || null, cands, underDetermined: cands.length > 1,
    tieBreakInvented: cands.length > 1 && cands[0].name !== byLeftmost[0].name };
};

/** The three figures [N-05] states, derived rather than typed. */
export async function underDetermination(form) {
  const { rows, attach } = await markerPairing(form);
  let paired = 0, under = 0, invented = 0, checkbox = 0;
  for (const m of rows) {
    const a = attach(m);
    if (!a.winner) continue;
    paired++;
    if (a.underDetermined) under++;
    if (a.tieBreakInvented) invented++;
    if (/check/i.test(a.winner.type || '')) checkbox++;
  }
  return { markers: rows.length, paired, under, invented, checkbox };
}

// CLI. Guarded so that importing this module for its pairing does not run the listing —
// guard-sweep.mjs imports `underDetermination` and must not print 200 lines to do it.
if (process.argv[1] && process.argv[1].endsWith('line-markers.mjs')) {
  const form = process.argv[2];
  if (!form) {
    console.error('usage: node adapters/pdf/line-markers.mjs <form>');
    process.exit(2);
  }
  const { src, pageCount, rows, attach } = await markerPairing(form);

  console.log(`${src} — ${pageCount} pages, ${rows.length} printed marker(s)`);
  let attached = 0, underDetermined = 0;
  for (let p = 1; p <= pageCount; p++) {
    const onPage = rows.filter((r) => r.page === p).sort((a, b) => b.y - a.y || a.x1 - b.x1);
    console.log(`\n--- page ${p}: ${onPage.length} marker(s) --- (y is ${Y_CONVENTION}; see page-geometry.mjs Y_CONVENTIONS)`);
    for (const m of onPage) {
      const a = attach(m);
      const w = a.winner;
      if (w) attached++;
      if (a.underDetermined) underDetermined++;
      console.log(
        `  ${String(m.marker).padStart(6)}  y=${String(m.y).padStart(6)}  x=${String(m.x1).padStart(6)}..${String(m.x2).padStart(6)}  ` +
        `-> ${w ? w.name : '(no widget to its right on this row)'}`
      );
    }
  }
  console.log(`\n${attached} of ${rows.length} marker(s) have a widget on the same row to their right.`);
  // SAY WHICH ANSWERS THE TIE-BREAK INVENTED. The pairing above is not WRONG where it is
  // under-determined — it is UNDECIDED BY THE PAGE, and a reader taking a binding off this
  // listing has to know which rows those are. This tool is an authoring instrument: it exports
  // nothing into a map and no gate step reads its pairing, so printing the exposure is what
  // stands in for a guard here. Stating the number was promised by [N-05] and, until this
  // commit, was never implemented — the disposition described a remedy the code did not carry.
  console.log(`${underDetermined} of ${attached} pairing(s) were UNDER-DETERMINED: more than one widget survived`);
  console.log(`the geometric filter and the distance tie-break chose between them. Those pairings are this`);
  console.log(`tool's choice and not the page's. Check them against the rectangles before binding one.`);
}
