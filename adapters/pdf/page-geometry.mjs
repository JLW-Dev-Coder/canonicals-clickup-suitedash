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
    ws.forEach((w, wi) => {
      const pageIdx = widgetPage(w);
      const g = w.getRectangle();
      widgets.push({
        name, type, widget: wi, widgets: ws.length,
        page: pageIdx === null ? null : pageIdx + 1,
        rect: [g.x, g.y, g.x + g.width, g.y + g.height],
      });
    });
  }

  return { widgets, fieldNames, originNotes, pageCount: pages.length };
}
