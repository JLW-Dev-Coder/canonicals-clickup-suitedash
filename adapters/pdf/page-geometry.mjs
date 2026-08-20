// The one coordinate space every geometric check on these forms reads.
//
// Two independent libraries have to agree before any of this means anything:
//   - printed text  <- pdfjs-dist  (PDF user space, origin at MediaBox lower-left, y up)
//   - widget rects  <- pdf-lib     (same space; NO rotated viewport is applied anywhere)
// A non-zero MediaBox origin is REPORTED, never silently absorbed, because absorbing it
// would shift one set relative to the other and every answer downstream would still look
// confident.
//
// This file exists because two tools now need the same primitives and they must not drift:
//   correlate-labels.mjs  pairs each widget with the text printed beside it (how the maps
//                         were authored)
//   verify-headings.mjs   asserts each mapped row sits beneath the heading it claims (what
//                         the maps are held to)
// If those two ever disagreed about where a widget is, the second could bless the first's
// mistake. One module, one answer.

import { PDFDocument, PDFName, PDFArray } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export const MERGE_GAP = 1.2;  // merge adjacent text runs only on clear intra-phrase kerning splits

/**
 * Printed text for every page, as boxes in PDF user space.
 * Merging is deliberately timid: over-merging invents compound labels that span table
 * cells, and a wrong label is worse than a short one.
 * @returns {Promise<Array<{view:number[], items:Array<{str:string,x1:number,y1:number,x2:number,y2:number}>}>>}
 */
export async function readPrintedText(bytes) {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: false,
    verbosity: 0,
  }).promise;

  const pages = [];
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
    const page = await doc.getPage(pageNo);
    const view = page.view;                 // [x0, y0, x1, y1]
    const tc = await page.getTextContent();
    const raw = [];
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      const x = it.transform[4];
      const y = it.transform[5];            // baseline
      const w = it.width || 0;
      const h = it.height || Math.abs(it.transform[3]) || 7;
      raw.push({ str: it.str, x1: x, y1: y, x2: x + w, y2: y + h });
    }
    raw.sort((a, b) => (Math.abs(a.y1 - b.y1) > 0.8 ? b.y1 - a.y1 : a.x1 - b.x1));
    const merged = [];
    for (const t of raw) {
      const prev = merged[merged.length - 1];
      if (prev && Math.abs(prev.y1 - t.y1) <= 0.8 && t.x1 - prev.x2 >= -0.5 && t.x1 - prev.x2 < MERGE_GAP) {
        prev.str += t.str;
        prev.x2 = Math.max(prev.x2, t.x2);
        prev.y2 = Math.max(prev.y2, t.y2);
        continue;
      }
      merged.push({ ...t });
    }
    pages.push({
      view,
      items: merged.map(t => ({ ...t, str: t.str.replace(/\s+/g, ' ').trim() })).filter(t => t.str),
    });
  }
  return pages;
}

/**
 * Every AcroForm widget with its page index and rectangle.
 *
 * The widget's page comes from scanning each page's /Annots for the widget's ref. The
 * widget's own /P entry is absent on some widgets of these forms, so /P is the fallback,
 * never the source of truth — a wrong page number would put a row under a heading from
 * a different sheet and the answer would still print cleanly.
 *
 * Rectangles are returned UNROUNDED. Rounding is a display decision and belongs to the
 * caller: a tenth of a point moved before a distance comparison is a tenth of a point of
 * silent disagreement between two tools that are supposed to agree exactly.
 *
 * @returns {Promise<{widgets:Array<{name:string,type:string,widget:number,widgets:number,page:number|null,rect:number[]|null}>, fieldNames:string[], originNotes:string[], pageCount:number}>}
 */
export async function readWidgetGeometry(bytes) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const pages = pdf.getPages();

  const originNotes = [];
  pages.forEach((pg, i) => {
    const mb = pg.getMediaBox();
    if (mb.x !== 0 || mb.y !== 0) originNotes.push(`page ${i + 1} MediaBox origin (${mb.x}, ${mb.y})`);
  });

  const dictToRef = new Map();
  for (const [ref, obj] of pdf.context.enumerateIndirectObjects()) dictToRef.set(obj, ref);

  const refTagToPage = new Map();
  pages.forEach((pg, i) => {
    const annots = pdf.context.lookup(pg.node.get(PDFName.of('Annots')));
    if (!(annots instanceof PDFArray)) return;
    for (let k = 0; k < annots.size(); k++) {
      const entry = annots.get(k);
      if (entry?.tag) refTagToPage.set(entry.tag, i);
    }
  });
  const pageRefTagToIndex = new Map();
  pages.forEach((pg, i) => {
    const ref = dictToRef.get(pg.node);
    if (ref) pageRefTagToIndex.set(ref.tag, i);
  });

  const widgetPage = (w) => {
    const ref = dictToRef.get(w.dict);
    if (ref && refTagToPage.has(ref.tag)) return refTagToPage.get(ref.tag);
    const p = w.dict.get(PDFName.of('P'));      // fallback only
    if (p?.tag && pageRefTagToIndex.has(p.tag)) return pageRefTagToIndex.get(p.tag);
    return null;
  };

  const widgets = [];
  const fieldNames = [];
  for (const f of pdf.getForm().getFields()) {
    const name = f.getName();
    fieldNames.push(name);
    const type = f.constructor.name;
    const ws = f.acroField.getWidgets();
    if (ws.length === 0) {
      widgets.push({ name, type, widget: 0, widgets: 0, page: null, rect: null });
      continue;
    }
    // /MaxLen is the field's, not the widget's — it lives on the terminal field dict and is
    // inheritable, so a cell inside a subform can carry the parent's ceiling and report none
    // of its own. Read here rather than at each call site: the fill engines HARD STOP on
    // overflow (they refuse to truncate a filed form), so the ceiling is a real input
    // constraint, and a tool that reports a widget's position without its ceiling has
    // reported half of what the map author needs.
    // pdf-lib's getMaxLength() already walks the inheritance chain, and it is the SAME call
    // fill-433a.mjs and fill-433f.mjs guard against, so what is reported here is exactly what
    // will refuse a value at fill time rather than a second reading of the same dict.
    const maxLen = typeof f.getMaxLength === 'function' ? (f.getMaxLength() ?? null) : null;
    ws.forEach((w, wi) => {
      const pageIdx = widgetPage(w);
      const g = w.getRectangle();
      widgets.push({
        name, type, widget: wi, widgets: ws.length,
        page: pageIdx === null ? null : pageIdx + 1,
        rect: [g.x, g.y, g.x + g.width, g.y + g.height],
        maxLen,
      });
    });
  }

  return { widgets, fieldNames, originNotes, pageCount: pages.length };
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE ONE y CONVENTION.  [B11]'s root cause, and it was never confined to [B11].
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433boi.lineage-433aoi.json quotes printed runs at `y=97.5` and `y=80.2`. The runs it is
// describing are SET at 89.5 and 71.2. Nothing had moved and nothing was wrong with either
// number: the lineage file was authored off align-block.mjs, which printed `t.y2` — the top
// of the run's box — while the map and the totals file were authored off the baseline. The
// gap is the run's own height: 8.0pt for the 8pt runs the lineage file quoted, 9.0pt for the
// 9pt ones. Eight points is a row on these forms, and the lineage file concluded the wrong
// caption for one binding on that difference.
//
// DERIVED, NOT ASSERTED: of the 43 distinct y values 433boi.lineage-433aoi.json quotes, 19
// are values the page draws ONLY as a run top and 1 only as a baseline; of the 12 in
// 433boi.totals.json, 10 are baselines and 1 a top. Two instruments, two answers, one page.
//
// So the convention is DECLARED HERE, once, and every tool that reports a y says which of
// these it is reporting. A tool that works in another one converts AT THE BOUNDARY, in a
// named call, so the conversion is a line of code someone can read rather than an 8.0 that
// appears in a diff.
export const Y_CONVENTION = 'text-baseline';

export const Y_CONVENTIONS = {
  'text-baseline': {
    what: 'The y a printed run is SET at — `item.y1`, the text-space baseline, in PDF user space with y ascending.',
    is_the_declared_one: true,
    why: 'It is the number pdfjs reports as the run\'s position (transform[5]); every other y for the same run is that number plus something. The maps, the totals files and verify-headings.mjs are all authored against it.',
  },
  'text-run-top': {
    what: 'The top edge of a printed run\'s box — `item.y2`, which this module computes as baseline + the run\'s height.',
    is_the_declared_one: false,
    convert_with: 'runTopToBaseline(yTop, height)',
    why_it_exists: 'Band containment against a widget rectangle is a comparison between two boxes, and the run\'s box is the honest operand there. It is a legitimate internal quantity and an illegitimate REPORTED one.',
  },
  'widget-rect': {
    what: 'A widget\'s rectangle as the four-tuple [x1, y1, x2, y2] in the same user space. Not a scalar and never reported as one.',
    is_the_declared_one: false,
    why: 'A widget is a box, not a line of type. Collapsing it to a scalar is what forces a reporter to choose top or bottom, which is the choice this register exists to make visible.',
  },
  'widget-rect-top': {
    what: 'A widget rectangle\'s top edge — `rect[3]` — reported as a scalar.',
    is_the_declared_one: false,
    convert_with: 'nothing: it is a widget quantity and does not convert to a text baseline. A tool reporting it MUST label it, because 471.6/666.0 and a caption baseline of 656.5 are numbers about different objects.',
  },
};

/** The declared baseline of a printed run. The one y this engine reports for printed text. */
export const baselineOfRun = (t) => t.y1;
/** The run's box top. Internal geometry, never a reported y. */
export const runTopOf = (t) => t.y2;
/** The explicit boundary conversion, named so it appears in a diff. */
export const runTopToBaseline = (yTop, height) => yTop - height;
/** The height of a printed run, as this module measures it. */
export const runHeight = (t) => t.y2 - t.y1;

// ── THE REGISTER OF y REPORTERS ────────────────────────────────────────────────────────
//
// Every engine file that puts a y in front of a person or into an artefact, and which
// convention it reports in. An entry is a CLAIM, and adapters/pdf/assert-y-convention.mjs
// checks it against what the file actually does: it asks each reporter for the y of a seeded
// sample of the same runs and requires the numbers to agree once converted.
//
// A file that reports a y and is not in here is a STOP there, not a finding.
export const Y_REPORTERS = {
  'page-geometry.mjs': {
    reports: 'text-baseline',
    also: 'widget-rect',
    how: 'readPrintedText returns y1 (baseline) and y2 (run top) on every item; readWidgetGeometry returns the four-tuple. It is the source, so it reports both and names both.',
  },
  'verify-headings.mjs': {
    reports: 'text-baseline',
    how: 'A heading record is `{ id, page, y: t.y1, x1, x2, text }` and the band test compares that baseline against a widget\'s vertical CENTRE. Conforming since it was written.',
  },
  'line-markers.mjs': {
    reports: 'text-baseline',
    how: 'A marker row carries `y` (the declared baseline) for reporting and `y_run_top` for the band-containment arithmetic against a widget rectangle. Before this commit the row carried ONE field, `y`, holding the run top — so the CLI printed a run top under the name every other tool uses for a baseline.',
    converts_at: 'markersIn(), which sets both fields from the same item in one place.',
  },
  'align-block.mjs': {
    reports: 'text-baseline',
    how: 'The printed-text listing prints the baseline and says so in its column header; the widget listing prints the rect top and says so. THIS IS THE TOOL THE LINEAGE FILE WAS AUTHORED OFF, and before this commit it printed `t.y2` under a bare `y=`.',
  },
  'money-probe.mjs': {
    reports: 'widget-rect-top',
    how: 'A probe row is about a WIDGET, and its `y` is that widget\'s rect top. Renamed to `y_rect_top` so it cannot be read as a caption baseline; the caption it reports beside it is named `left` and carries no y of its own.',
  },
  'count-sweep.mjs': {
    reports: 'text-baseline',
    also: 'widget-rect',
    how: 'Its printed-rounding records carry `y` plus an explicit `y_convention` field, and the three page-1 band comparisons on 433-B(OIC) run against baselineOfRun with baseline constants. All three used to compare against `t.y2` with run-top constants - 620.9, 696.9, 682.5, which are the baselines 610.9, 688.9 and 674.5 - so a claim written as "on one baseline" was being derived against a number 10.0pt away from any baseline. The eligibility-bullet band 670..710 is a WIDGET band and its row says so.',
    converts_at: 'the three call sites, by naming baselineOfRun and moving the constant by the run height in the same edit.',
  },
  'guard-sweep.mjs': {
    reports: 'text-baseline',
    also: 'widget-rect',
    how: '[FIG-09] asserts strict rectangle containment of a marker and reads `y_run_top` off a line-markers row. It is the one place in the engine that re-derives the marker/rectangle relation outside line-markers.mjs, and it read the bare `y` - so the y split would have changed its answer silently. The register proves its own no-op: FIG-09 states 22 and must still derive 22.',
  },
  'blanket-audit.mjs': {
    reports: 'text-baseline',
    also: 'widget-rect',
    how: '[K-19] compares a page-1 widget rect against the partners heading, and [K-12] checks every coordinate quoted in a map or headings file against the y values the page draws. The K-19 constant was 370.5, the run TOP of that heading; verify-headings.mjs puts the same heading at 362.5. Converted, with the no-op proved: no page-1 widget has rect[1] in (362.5, 370.5], so the partition is the same 14 of 14.',
    known_gap: 'The K-12 drawnY set holds BOTH baselines and run tops, so a coordinate quoted in either convention satisfies it. That is what let the 433-B(OIC) artefact prose carry both at once without anything complaining. Carried as [B15]; NOT closed here, because tightening it would refuse forty-three coordinates in landed slice-1 and slice-2 evidence, and rewriting landed evidence is not a convention fix.',
  },
  'assert-y-convention.mjs': {
    reports: 'text-baseline',
    also: 'widget-rect-top',
    how: 'It prints, in a DISAGREEMENT, the y a reporter gave and the y or ys page-geometry.mjs draws for the same object. Both are quoted from the objects being compared, and each is printed beside the convention the reporter declared. It is on this register because it emits a y at all: a checker exempting itself from the check it runs is how a register goes quiet.',
  },
  'correlate-labels.mjs': {
    reports: 'widget-rect',
    also: 'text-baseline',
    how: 'Emits the widget rectangle as a four-tuple and never a scalar; distances are differences between edges, which are convention-free. Its probe prose quotes printed runs at their baselines.',
  },
};
