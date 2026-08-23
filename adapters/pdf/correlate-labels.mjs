// Pair every AcroForm widget with the printed text drawn next to it.
//
// Why this exists: field names on these forms carry no meaning (`p2_t23_14a[0]`), and
// Rev. 6-2026 renumbered lines relative to Rev. 7-2022, so no knowledge from the older
// form transfers. Inferring a field's meaning from its name is the same class of error
// as inventing a field name — and it fails SILENTLY, because a wrong-but-real target
// passes the validator and mis-fills a cell on a filed form. So the label is extracted
// mechanically from the PDF and the map is authored against that.
//
// Geometry comes from two sources that must share one coordinate space:
//   - widget rects  <- pdf-lib   (PDF user space, origin at MediaBox lower-left, y up)
//   - text items    <- pdfjs-dist (same space; NO rotated viewport is applied)
// Both are verified against the MediaBox below; a non-zero origin is reported, not
// silently absorbed.
//
// CLI: node adapters/pdf/correlate-labels.mjs <form>
// Out: adapters/pdf/maps/<form>.labels.json   full per-widget candidate record
//      adapters/pdf/maps/<form>.labels.txt    reading order, one line per widget

import { readFileSync, writeFileSync } from 'node:fs';
import { readPrintedText, readWidgetGeometry } from './page-geometry.mjs';

const form = process.argv[2] || '433a';
const src = `adapters/pdf/forms/f${form}.pdf`;
const outJson = `adapters/pdf/maps/${form}.labels.json`;
const outTxt = `adapters/pdf/maps/${form}.labels.txt`;

const TOL = 2;          // point slack on the overlap tests

const bytes = readFileSync(src);

// Both coordinate sets come from page-geometry.mjs so that this tool and verify-headings.mjs
// can never disagree about where a widget is. See that file for the MediaBox reasoning.
const text = await readPrintedText(bytes);
const { widgets: geometry, fieldNames, originNotes, pageCount } = await readWidgetGeometry(bytes);
// ----------------------------------------------------------------- correlation
const round = (n) => Math.round(n * 10) / 10;

function candidates(pageIdx, r) {
  const items = text[pageIdx]?.items || [];
  const left = [], right = [], above = [], inside = [], near = [];

  for (const t of items) {
    const vOverlap = t.y1 < r.y2 + TOL && t.y2 > r.y1 - TOL;
    const hOverlap = t.x1 < r.x2 + TOL && t.x2 > r.x1 - TOL;

    if (t.x2 <= r.x1 + TOL && vOverlap) left.push({ text: t.str, distance: round(r.x1 - t.x2) });
    // RIGHT is not decoration: every checkbox on this form prints its option to the
    // right of the box ("[ ] Weekly  [ ] Monthly"). Without it the four pay-period
    // boxes all collapse onto the same caption and the Yes/No pairs are
    // indistinguishable — which would make the P10 exclusive sets unauthorable.
    if (t.x1 >= r.x2 - TOL && vOverlap) right.push({ text: t.str, distance: round(t.x1 - r.x2) });
    if (t.y1 >= r.y2 - TOL && hOverlap) above.push({ text: t.str, distance: round(t.y1 - r.y2) });

    const cx = (t.x1 + t.x2) / 2, cy = (t.y1 + t.y2) / 2;
    if (cx >= r.x1 - TOL && cx <= r.x2 + TOL && cy >= r.y1 - TOL && cy <= r.y2 + TOL)
      inside.push({ text: t.str, distance: 0 });

    const dx = Math.max(r.x1 - t.x2, t.x1 - r.x2, 0);
    const dy = Math.max(r.y1 - t.y2, t.y1 - r.y2, 0);
    near.push({ text: t.str, distance: round(Math.hypot(dx, dy)) });
  }

  const byDist = (a, b) => a.distance - b.distance;
  // FILTER, THEN RANK, THEN TRUNCATE — in that order, and the order is the whole point.
  //
  // These buckets used to be `sort(byDist).slice(0, 3)`, and the property filter
  // (`isDescriptive`, `isMarker`) ran downstream on whatever survived. That is the
  // money-probe defect one level up: distance chose the candidates before anything asked
  // whether they were the KIND of thing being looked for, so a caption sitting behind three
  // markers or currency glyphs was cut from the bucket and never seen.
  //
  // It was load-bearing. On 433-A page 3, p2_t32_16[0]'s `above` bucket holds five "$" runs
  // at 31.1, 52.7, 88.7, 124.7 and 160.7pt and its first descriptive run at 198.9pt: the
  // slice dropped every candidate the bucket had, `above` contributed nothing, and the label
  // fell through to a run 273.7pt away in a different column. Across the three forms the
  // truncation moved 26 of 433-A's 515 widget labels and 4 of its markers; 433-F and
  // 433-A(OIC) were unaffected, which is exactly why a scan of one form would have missed it.
  //
  // THAT FIGURE WAS TYPED AS 25 AND IS 26. It is measured by MUTATION, not by reading the
  // tree: revert `isFormatHint` out of `isDescriptive`, regenerate, and diff the widget
  // labels against the pre-sweep file. No sweep can re-derive it, so it is declared
  // underivable with that procedure named, at adapters/pdf/guard-sweep.mjs [FIG-01].
  //
  // Each bucket is now kept twice: `*_desc` holds the descriptive candidates and `*_mark` the
  // markers, each ranked and truncated WITHIN its own kind, so truncating one can never hide
  // the other. The raw distance-ranked bucket is kept as well, for the report only — a person
  // reading the correlation needs to see what was actually nearest, including the runs the
  // property filter dropped. See adapters/pdf/guard-sweep.mjs [N-02].
  const KEEP = 3;
  const split = (arr, keep = KEEP) => {
    const s = [...arr].sort(byDist);
    return { all: s.slice(0, keep), desc: s.filter(c => isDescriptive(c.text)).slice(0, keep), mark: s.filter(c => isMarker(c.text)).slice(0, keep) };
  };
  const L = split(left), R = split(right), A = split(above), I = split(inside), N = split(near, 5);
  return {
    left: L.all, right: R.all, above: A.all, inside: I.all, nearest: N.all,
    _desc: { left: L.desc, right: R.desc, above: A.desc, inside: I.desc, nearest: N.desc },
    _mark: { left: L.mark, right: R.mark, above: A.mark, inside: I.mark, nearest: N.mark },
  };
}
const EMPTY = { left: [], right: [], above: [], inside: [], nearest: [],
  _desc: { left: [], right: [], above: [], inside: [], nearest: [] },
  _mark: { left: [], right: [], above: [], inside: [], nearest: [] } };

// Choosing the label.
//
// Nearest-in-any-direction is NOT good enough here. The closest text to a widget is
// very often the printed line marker ("1a", "19a") or a bare currency "$", and on this
// form those frequently belong to the ADJACENT cell — the 1a name box has "1c" sitting
// 0.0pt to its left. Taking the raw nearest yields a confident, useless, sometimes
// wrong-row label.
//
// So: drop markers and punctuation, then take the nearest DESCRIPTIVE text across
// left/above/inside (the form's dominant pattern is a caption ~3pt ABOVE its entry box,
// with left-side labels on the Yes/No checkbox rows). The line marker is then recovered
// separately from the SAME direction bucket at a comparable distance, so the marker
// always belongs to the row that supplied the label.
const isMarker = (s) => /^\(?\d{1,2}[a-z]?\)?[.:]?$/i.test(s);
// A FORMAT PLACEHOLDER IS NOT A CAPTION. "mmddyyyy" tells the taxpayer how to SHAPE what
// goes in the box; it does not say what the box is for, and two cells in different columns
// of the same row can both have one printed beside them.
//
// This is not decoration and it was not here before. Fixing the truncation order in split()
// exposed it: with the buckets no longer cut before the property filter ran, the nearest
// DESCRIPTIVE run to five of 433-A's life-insurance column-3 cells turned out to be the
// "mmddyyyy" hint printed in the date column at 198.9pt, which beat "Policy Number(s)" and
// "Owner of Policy" in another column at 273.7pt and further. The old order had been hiding
// that behind the five "$" runs it truncated away — so the ranking was right and the
// PROPERTY was wrong, and correcting only the order would have traded one wrong answer for
// another. See adapters/pdf/guard-sweep.mjs [N-02].
const isFormatHint = (s) => /^[\s(]*(?:mm|dd|yy(?:yy)?|xx+|nnn+|[\/\-.,()])+[\s)]*$/i.test(s);
const isDescriptive = (s) => s.length >= 2 && /[A-Za-z]/.test(s) && !isMarker(s) && !isFormatHint(s);

/**
 * Nearest descriptive candidate across the given buckets, in order.
 *
 * Reads `_desc`, which was filtered to descriptive runs BEFORE it was ranked and truncated.
 * The `isDescriptive` test is kept here as well and is now redundant by construction — left
 * in deliberately, so that a future caller passing a raw bucket still gets the right answer
 * rather than silently ranking markers. See the split() note above and guard-sweep [N-02].
 */
function nearestDescriptive(c, dirs) {
  let winner = null;
  for (const dir of dirs) {
    for (const cand of (c._desc?.[dir] ?? c[dir]) || []) {
      if (!isDescriptive(cand.text)) continue;
      if (!winner || cand.distance < winner.distance) winner = { ...cand, dir, pool: c._mark?.[dir] ?? c[dir] };
    }
  }
  return winner;
}

/**
 * Marker from the same bucket that supplied the label, at a comparable distance.
 *
 * `winner.pool` is now the `_mark` bucket for the direction the label came from — markers
 * filtered first, then ranked. Previously it was the raw top-3, so a marker sitting behind
 * three captions was invisible here for the same reason a caption behind three markers was
 * invisible above.
 */
function markerFor(winner) {
  if (!winner) return '';
  const m = (winner.pool || [])
    .filter(x => isMarker(x.text))
    .sort((a, b) => Math.abs(a.distance - winner.distance) - Math.abs(b.distance - winner.distance))[0];
  return m && Math.abs(m.distance - winner.distance) <= 2 ? m.text : '';
}

function pickLabel(c, type) {
  if (type === 'PDFCheckBox') {
    // A checkbox needs TWO pieces to be mappable: which question it belongs to, and
    // which option this particular box is. The option is printed to its right; the
    // question is the caption above or left of the group.
    const opt = nearestDescriptive(c, ['right']) || nearestDescriptive(c, ['nearest']);
    const ctx = nearestDescriptive(c, ['above', 'left']);
    const marker = markerFor(ctx) || markerFor(opt);
    const option = opt?.text ?? '';
    const context = ctx && ctx.text !== option ? ctx.text : '';
    const best = [marker, context, option && `[${option}]`].filter(Boolean).join(' ');
    return { label: option || context, option, context, marker, dir: opt?.dir ?? ctx?.dir ?? '', best };
  }

  const winner =
    nearestDescriptive(c, ['above', 'left', 'inside']) ||
    nearestDescriptive(c, ['right']) ||
    nearestDescriptive(c, ['nearest']);
  if (!winner) return { label: '', option: '', context: '', marker: '', dir: '', best: '' };
  const marker = markerFor(winner);
  return {
    label: winner.text,
    option: '',
    context: '',
    marker,
    dir: winner.dir,
    best: marker ? `${marker} ${winner.text}` : winner.text,
  };
}

const records = [];
for (const g of geometry) {
  const { name, type } = g;
  if (g.rect === null) {
    records.push({ name, type, page: null, rect: null, maxLen: g.maxLen ?? null, candidates: EMPTY, marker: '', label: '', option: '', context: '', labelFrom: '', best: '' });
    continue;
  }
  const r = { x1: g.rect[0], y1: g.rect[1], x2: g.rect[2], y2: g.rect[3] };
  const pageIdx = g.page === null ? null : g.page - 1;
  const c = pageIdx === null ? EMPTY : candidates(pageIdx, r);
  const p = pickLabel(c, type);
  records.push({
    name,
    type,
    widget: g.widget,
    widgets: g.widgets,
    page: g.page,
    rect: [round(r.x1), round(r.y1), round(r.x2), round(r.y2)],
    // The field's /MaxLen ceiling. Published on the line because the fill engines HARD STOP
    // on overflow rather than truncating a filed form, so a map authored without it can be
    // correct about WHICH cell a value goes in and still refuse the value.
    maxLen: g.maxLen ?? null,
    // The DISTANCE-RANKED buckets only. `_desc` and `_mark` are the property-filtered working
    // copies split() builds so that truncating one kind cannot hide the other; they are
    // internal to the selection and are not published. Emitting them would triple this file
    // for no reader — what a person checking a correlation needs to see is what was actually
    // nearest, including the runs the property filter dropped, and that is these four lists.
    candidates: { left: c.left, right: c.right, above: c.above, inside: c.inside, nearest: c.nearest },
    marker: p.marker,       // printed line marker, from the bucket that supplied the label
    label: p.label,         // printed caption, verbatim
    option: p.option,       // checkboxes only: this box's own option, printed to its right
    context: p.context,     // checkboxes only: the question the box belongs to
    labelFrom: p.dir,       // which direction supplied it
    best: p.best,           // composed from the parts above — every part extracted, none invented
  });
}

// ------------------------------------------------------------------ self-check
// A correlation tool that is quietly off by one row is worse than no tool, because
// everything downstream inherits the error. Each probe below is a pairing known from the
// PRINTED form — established with align-block.mjs, by reading a caption's x-range against
// the widget's, never by trusting the widget's leaf name. If any fails, nothing is written.
//
// PROBES ARE PER FORM. They were hard-coded to 433-A's field names, so running this against
// any other form failed all three and wrote nothing — which reads exactly like a broken
// correlation and is not one. A form with no probes is REFUSED rather than waved through:
// authoring three known pairings is the cheapest part of taking on a new form, and a tool
// that silently skips its own check on unfamiliar input is the failure mode this guards.
//
// Each probe names a field by its FULL path from topmostSubform[0]. Reconstructing a prefix
// from a fragment is where two rounds of 433-F defects entered; nothing here does it.
const PROBES = {
  // 433-B. All three established with the printed run's own rectangle against the widget's,
  // and every one of them chosen where the LEAF NAME would give a different answer — this form
  // reuses one leaf name across four printed rows and spells a taxpayer identification number
  // as an SSN, so a probe taken from a name would agree with the wrong thing twice.
  '433b': [
    // "Business Name" prints at y 651.1, x 57.6..113.5. The widget spans x 57.6..302.4 with its
    // top at y 648.0 — directly beneath, sharing a left edge to 0.0pt. The next caption down the
    // same column is "Business Street Address" at y 629.5, 21.6pt lower, so an off-by-one row is
    // visible rather than plausible.
    { label: 'Page1 1a business-name cell -> "Business Name"',
      field: 'topmostSubform[0].Page1[0].Line1a-f[0].p1_1_1a[0]', want: /business\s*name/i },
    // THE PROBE THAT MATTERS ON THIS FORM. The leaf name says SSN. The page says something
    // wider: "Taxpayer Identification Number" prints at y 257.3, x 367.2..479.4, and the widget
    // spans x 489.6..576.0 on the same row, 10.2pt to its right. A correlation that read the
    // NAME would answer "SSN" and the name would agree with the wrong answer — an EIN is a
    // taxpayer identification number and is not an SSN, and row 7a of this form is a partner,
    // officer or LLC member who may be either.
    { label: 'Page1 7a p1_39_SSN_7a[0] -> "Taxpayer Identification Number", NOT an SSN',
      field: 'topmostSubform[0].Page1[0].p1_39_SSN_7a[0]', want: /taxpayer\s*identification\s*number/i },
    // "County" prints at y 586.5, x 57.6..83.4, its baseline INSIDE the widget's rectangle
    // (y 583.2..594.0) and 3.6pt to its left. The row above is the City / State / ZIP row at
    // y 597.3.
    { label: 'Page1 1c county cell -> "County"',
      field: 'topmostSubform[0].Page1[0].Line1a-f[0].p1_8_1c[0]', want: /^county$/i },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // THIS SELF-CHECK FAILS ON 433-B, AND THE PROBES ARE NOT THE THING THAT IS WRONG. [B-01]
    // ═══════════════════════════════════════════════════════════════════════════════════
    //
    // Three separate pairings were established from the printed page here and this tool
    // answered the caption ONE ROW ABOVE on all three, every time by a fraction of a point:
    //
    //   p1_8_1c[0]            page says "County"  (y 586.5, x 57.6..83.4, 3.6pt LEFT, baseline
    //                         inside the rectangle) — tool answers "State" (y 597.3, the
    //                         City/State/ZIP row, 3.3pt ABOVE, x 180.0..198.8 overlapping)
    //   p1_15_2bc[0]          page says "Other LLC - Include number of members" (y 607.1,
    //                         x 337.1..482.3, 7.3pt LEFT, baseline inside the rectangle) — tool
    //                         answers "Limited Liability Company (LLC) classified as a
    //                         corporation" (y 617.9, x 337.1..546.8, the row above, whose extra
    //                         64pt of width is what makes it overlap the cell at all)
    //   p1_42_7aAnnualSalDrw[3]  page says "Annual Salary/Draw" (y 53.7, x 367.2..437.6, 6.0pt
    //                         LEFT) — tool answers "Ownership Percentage & Shares or Interest"
    //                         (y 62.9, x 367.2..521.7, the row above, again the wider run)
    //
    // In all three the correct caption IS in the candidate list, ranked second. The rule that
    // loses is the one that ranks `above` and `left` on ONE distance scale: a 3.3pt vertical gap
    // beats a 3.6pt horizontal gap even though the vertical one crosses a printed row boundary.
    // On 433-A, 433-F and 433-A(OIC) the dominant layout is caption-ABOVE-cell and the rule is
    // right; 433-B's Section 1 and Section 2 are caption-LEFT-of-cell in a two-column grid, and
    // there the rule inverts.
    //
    // The probes are NOT retuned until three cells are found where the tool happens to agree.
    // That would be fitting the guard to the tool, and the guard exists to catch the tool. The
    // self-check refuses, no labels file is written for 433-B, and the map binds page 1 on
    // rectangles — which every standing rule already required. Changing the ranking is a change
    // to a tool the other four forms depend on and needs its own regression across all four; it
    // is carried as [B-01] and not done during an intake.
  ],
  '433boi': [
    // ESTABLISHED FROM THE PRINTED PAGE with align-block.mjs, never from a leaf name — this
    // form is the one whose lineage report found three names true on one page and false on
    // another, so a probe taken from a name would be a probe of the wrong thing.
    //
    // "Business name" prints at y 604.3, x 36..90.7. The widget spans x 36..370.8 with its top
    // at y 591.8 — directly beneath, sharing a left edge to 0.0pt. The next caption down the
    // same column is "Business physical address" at y 575.5, 29pt lower, so an off-by-one row
    // is visible rather than plausible.
    { label: 'Page1 Section 1 business-name cell -> "Business name"',
      field: 'topmostSubform[0].F433-B-OIC_Page1[0].Business_Name[0]', want: /business\s*name/i },
    // THE PROBE THAT MATTERS ON THIS FORM. Page 5's Section 6 litigation block reuses FOUR
    // leaf names that are honest elsewhere on the same form — Name_Creditor, Date_Final_Payment
    // and Gross_Receipts among them. Name_Creditor[0] spans x 129.6..266.4 and the caption
    // directly above it at y 175.9 is "Location of filing", whose x1 is exactly 129.6. A
    // correlation that read the NAME here would answer "creditor" and the field name would
    // agree with the wrong answer, which is the whole reason the probe is placed here.
    { label: 'Page5 Section 6 Name_Creditor[0] -> "Location of filing", NOT a creditor',
      field: 'topmostSubform[0].F433-B-OIC_Page5[0].section_6[0].Name_Creditor[0]', want: /location\s*of\s*filing/i },
    // The two page-3 vehicle totals sit 18pt apart in one column against markers (4d) and (4).
    // Total_Value_Vehicles_Attached spans y 82.8..100.8 and (4d)'s caption prints at y 97.5,
    // inside that rectangle; (4) prints at y 80.2, outside it. This is the cell where the
    // 433-A(OIC) registry says the name LIES and on this form it tells the truth, so the probe
    // pins the containment reading that established it.
    // ASSERTED ON THE MARKER, WHICH IS WHAT THE CELL IS IDENTIFIED BY AND WHAT THE TOOL
    // ACTUALLY RETURNS. A first draft of this probe expected /attachment/i, matching the
    // caption; the correlator answers "(4d) $", because the marker is nearer. Both are the
    // same finding and only one of them is what the instrument produces, so the probe asserts
    // that one — and it is the sharper test, because (4d) and (4) are 18pt apart in one column
    // and the caption is shared prose while the marker is not.
    { label: 'Page3 vehicles-from-attachment total -> marker (4d), NOT the (4) Add-lines total below it',
      field: 'topmostSubform[0].F433-B-OIC_Page3[0].Total_Value_Vehicles_Attached[0]', want: /\(4d\)/ },
  ],
  '433a': [
    { label: 'Page-1 taxpayer name field -> label containing "Name"',
      field: 'topmostSubform[0].Page1[0].c1[0].Lines1a-b[0].p1-t4[0]', want: /name/i },
    { label: 'Page3 Line18a vehicle field -> Year / Make / Model / Mileage',
      any: /^topmostSubform\[0\]\.Page3\[0\]\.Line18a\[0\]/, want: /(year|make|model|mileage)/i },
    { label: 'Page4[0].IRS35[0] -> IRS-allowed / standards column',
      field: 'topmostSubform[0].Page4[0].IRS35[0]', want: /(irs|allow|standard)/i },
  ],
  '433aoi': [
    // "Last name" prints at y 561.1, x 36..73.4; the widget spans x 36..176.4 with its top at
    // y 548.6 — directly beneath, sharing a left edge. An off-by-one row here would report
    // "Marital status", which is 29pt lower.
    { label: 'Page1 Section 1 last-name cell -> "Last name"',
      field: 'topmostSubform[0].F433-A-OIC_Page1[0].Section1[0].lastName[0]', want: /last\s*name/i },
    // Section 3's real-property block: "How title is held" prints at x 306..362, and the
    // widget beneath it starts at exactly x 306. Its neighbours on the same row are "Amount
    // of mortgage payment" (x 36) and "Date of final payment" (x 176.4), so a column shift
    // is visible rather than plausible.
    { label: 'Page3 real-property row -> "How title is held"',
      field: 'topmostSubform[0].F433-A-OIC_Page3[0].Property2[0].how_title_held[0]', want: /title/i },
    // THE PROBE THAT MATTERS. Page 6 has THREE widgets whose leaf name says Interest_Dividends
    // and only ONE of them is interest and dividends: [1] (y 550.8) is printed line (33)
    // "Interest, dividends, and royalties", while [0] (y 576) is line (32)'s amount cell for
    // "Additional sources of income used to support the household". The suffix lags the
    // printed line by one, exactly as every internal suffix on 433-A did. A correlation that
    // drifts one row in this column returns "Additional sources" or "Distributions" here, and
    // the whole point of the probe is that the field NAME would agree with the wrong answer.
    //
    // ASSERTED ON THE LEFT BUCKET, not on `best`. Section 7's money column is the case
    // pickLabel's `above`-first rule was not built for: the row caption is to the LEFT, and
    // what sits ABOVE every cell in the column is the shared header "Round to the nearest
    // whole dollar." So `best` reports that header for all thirteen expense cells and all
    // nine income cells — one caption, twenty-two widgets — and the collapse is invisible
    // because each individual answer is a real piece of text from the page. The printed line
    // marker immediately left of the cell is what identifies the ROW, so that is what this
    // probe pins. The heuristic is deliberately NOT changed for it: `above`-first is right
    // for 433-A and for most of this form, and Section 7 is authored from align-block.mjs.
    { label: 'Page6 Interest_Dividends[1] -> nearest LEFT is printed line marker (33)',
      field: 'topmostSubform[0].F433-A-OIC_Page6[0].Interest_Dividends[1]', wantNearestLeft: /^\(33\)/ },
  ],
};

const allText = (rec) =>
  [...rec.candidates.left, ...rec.candidates.above, ...rec.candidates.inside, ...rec.candidates.nearest]
    .map(x => x.text).join(' | ');

const probes = PROBES[form];
if (!probes) {
  console.error(`form ${form}: ${fieldNames.length} fields, ${records.length} widgets, ${pageCount} pages`);
  console.error(`NO PROBES DECLARED for ${form} — nothing written.`);
  console.error('  Add three pairings to PROBES in this file, each established from the PRINTED');
  console.error(`  page with:  node adapters/pdf/align-block.mjs ${form} <page> [yMin] [yMax]`);
  console.error('  Establish them from caption geometry, never from a widget leaf name.');
  process.exit(2);
}

// A probe asserts EITHER on the chosen label (`want`) or on the nearest text printed to the
// widget's left (`wantNearestLeft`) — see the Section 7 note above for why the second exists.
const holds = (p, r) => (p.wantNearestLeft
  ? p.wantNearestLeft.test(r?.candidates?.left?.[0]?.text ?? '')
  : p.want.test(r?.best ?? ''));

const checks = probes.map((p) => {
  const pool = p.any ? records.filter((r) => p.any.test(r.name)) : records.filter((r) => r.name === p.field);
  const hit = pool.find((r) => holds(p, r)) ?? pool[0];
  return {
    label: p.label,
    field: hit?.name ?? p.field ?? '(no field matched the pattern)',
    best: p.wantNearestLeft
      ? `nearest left: ${JSON.stringify(hit?.candidates?.left?.[0]?.text ?? '(none)')}  |  best: ${hit?.best ?? '(field not found)'}`
      : (hit?.best ?? '(field not found)'),
    all: hit ? allText(hit) : '',
    pass: !!hit && holds(p, hit),
  };
});

console.log(`form ${form}: ${fieldNames.length} fields, ${records.length} widgets, ${pageCount} pages`);
if (originNotes.length) console.log(`NOTE non-zero MediaBox origin: ${originNotes.join('; ')}`);
console.log('--- self-check ---');
for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.label}`);
  console.log(`      field : ${c.field}`);
  console.log(`      best  : ${JSON.stringify(c.best)}`);
  console.log(`      all   : ${c.all}`);
}
if (checks.some(c => !c.pass)) {
  console.error('SELF-CHECK FAILED — no output written. STOP and report the actual correlated text to Principal.');
  process.exit(2);
}

// --------------------------------------------------------------------- outputs
const unlabelled = records.filter(r => !r.best);
const pct = ((unlabelled.length / records.length) * 100);

writeFileSync(outJson, JSON.stringify({
  form,
  source: src,
  fieldCount: fieldNames.length,
  widgetCount: records.length,
  pages: pageCount,
  unlabelledWidgets: unlabelled.length,
  generator: 'adapters/pdf/correlate-labels.mjs',
  note: 'Extracted mechanically. Labels are what the tool found in the drawn text — nothing here is hand-written.',
  widgets: records,
}, null, 2));

// Reading order: page, then top-to-bottom (y descends in PDF space), then left-to-right.
// Rows are banded to 4pt so a cell that sits a point high does not jump its row.
const ordered = [...records].sort((a, b) =>
  (a.page ?? 999) - (b.page ?? 999) ||
  Math.round((b.rect?.[3] ?? 0) / 4) - Math.round((a.rect?.[3] ?? 0) / 4) ||
  (a.rect?.[0] ?? 0) - (b.rect?.[0] ?? 0));

// /MaxLen rides on the line because a map author needs the ceiling at the same moment as the
// label: the fill engines refuse an over-long value rather than truncating a filed form, so a
// binding can be right about WHICH cell and still be unusable. "-" means the field declares none.
const mx = (r) => (r.maxLen == null ? 'MaxLen -' : `MaxLen ${r.maxLen}`);
writeFileSync(outTxt, ordered.map(r => `p${r.page ?? '?'} | ${mx(r)} | ${r.best} | ${r.name}`).join('\n') + '\n');

const namesInTxt = new Set(ordered.map(r => r.name));
const namesInJson = new Set(records.map(r => r.name));
const missingTxt = fieldNames.filter(n => !namesInTxt.has(n));
const missingJson = fieldNames.filter(n => !namesInJson.has(n));

console.log('--- counts ---');
console.log(`fields in .json: ${namesInJson.size}/${fieldNames.length}   fields in .txt: ${namesInTxt.size}/${fieldNames.length}`);
console.log(`unlabelled widgets (no candidate in ANY direction): ${unlabelled.length} of ${records.length} (${pct.toFixed(1)}%)`);
if (pct > 15) console.log(`QUALITY WARNING: unlabelled rate ${pct.toFixed(1)}% exceeds ~15% — report this to Principal rather than treating the output as complete.`);
console.log(`wrote ${outJson}`);
console.log(`wrote ${outTxt}`);
if (missingTxt.length || missingJson.length) {
  console.error(`MISSING from outputs — json:${missingJson.length} txt:${missingTxt.length}`);
  process.exit(2);
}
