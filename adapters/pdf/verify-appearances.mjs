// Verifies that every stored value on a filled PDF is actually DRAWN on the page.
//
// CLI:  node adapters/pdf/verify-appearances.mjs adapters/pdf/out/433a_filled_XXX.pdf
// Exit: 0 = every value is drawn, 2 = at least one is not (or the file cannot be read).
//
// WHY THIS EXISTS
// ---------------
// A field's value and the marks a viewer prints are two independent facts. The value
// lives in /V; the ink lives in the widget's /AP /N appearance stream. A file can carry
// a complete and correct set of /V values — passing map validation, field-by-field
// read-back, the duplicate-write assertion and the coverage assertion — and still print
// blank, because a viewer shows the stream, not /V.
//
// The protection against that was real but IMPLICIT: it worked only because pdf-lib's
// save() happens to default `updateFieldAppearances` to true. Nothing pinned it and
// nothing tested it, so a version bump — or a save({ ... }) call added for some
// unrelated reason, which drops the default — could silently start producing files that
// pass every other check in this repo and print blank. On a form that gets filed with
// the IRS, that is the worst failure this project can produce.
//
// So the guarantee is now asserted in three places, and this file is the third:
//   1. every save() in fill-433a.mjs and fill-433f.mjs passes `updateFieldAppearances:
//      true` EXPLICITLY, so the behaviour survives a change of pdf-lib's default;
//   2. both fill scripts run this verifier on the file they just wrote and fail the run
//      if any value is not drawn — a fill that reports success means the page shows it;
//   3. this tool stands alone, so any output PDF can be checked at any time.
//
// EXISTENCE OF A STREAM IS NOT PROOF. Every field on the blank source form already has
// an appearance stream. A stale one inherited unchanged would sail through an
// existence check while drawing nothing at all — which is precisely the failure being
// guarded against. So this decodes the stream and requires the stored value to appear
// in the text the stream actually shows.
//
// DECLINED, DELIBERATELY: /NeedAppearances.
// The third candidate remedy was to set /NeedAppearances true on the AcroForm. It is
// declined, and this note exists so nobody adds it later believing it was an oversight.
// /NeedAppearances tells the viewer to DISCARD the appearances baked here and re-render
// the fields with its own fonts and metrics. That trades a failure mode we have now
// tested for and eliminated against variable rendering — different fonts, different
// wrapping, different overflow behaviour per viewer — on a document that gets filed.
// With appearances pinned at save time and verified on every run, /NeedAppearances adds
// risk rather than removing it.
//
// XFA: CONFIRMED CLOSED, not merely untested. Both source forms (f433a.pdf, f433f.pdf)
// ship an XFA layer, but it is absent from every file these fill scripts write — pdf-lib
// does not carry /XFA through. That matters here because an XFA-aware viewer prefers the
// XFA layer over the AcroForm widgets when one is present, which would make the verified
// appearances irrelevant to what the reader sees. It is not present, so it cannot be
// preferred. This tool asserts that on every run rather than trusting it.
//
// NOTE: this file must never call form.updateFieldAppearances(). Doing so would
// regenerate the very streams it is supposed to be judging, and every run would pass.

import { PDFDocument, PDFTextField, PDFCheckBox, PDFRawStream, PDFDict, PDFName, decodePDFRawStream } from 'pdf-lib';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';

const BS = String.fromCharCode(92);   // a literal backslash, spelled out to keep the
                                      // PDF string-escape parser below readable

// ---------------------------------------------------------------------------
// Content-stream text extraction.
//
// An appearance stream shows text with Tj / TJ / ' / " . The operand is either a
// literal string — (Jamie Williams) — or a hex string — <4A616D6965>. BOTH forms must be
// matched: which one pdf-lib emits depends on the font's encoding, and a detector that
// only understood literals would silently pass every hex-encoded field by finding no
// text to disagree with.

const decodeLiteral = (src, start) => {
  // src[start] === '(' ; returns [text, indexAfterClosingParen]
  let i = start + 1, depth = 1, s = '';
  while (i < src.length) {
    const c = src[i];
    if (c === BS) {
      const e = src[i + 1];
      if (e === 'n') { s += '\n'; i += 2; continue; }
      if (e === 'r') { s += '\r'; i += 2; continue; }
      if (e === 't') { s += '\t'; i += 2; continue; }
      if (e === 'b') { s += '\b'; i += 2; continue; }
      if (e === 'f') { s += '\f'; i += 2; continue; }
      if (e === '\n') { i += 2; continue; }              // line continuation
      if (e === '\r') { i += (src[i + 2] === '\n' ? 3 : 2); continue; }
      if (e >= '0' && e <= '7') {                        // octal escape, 1-3 digits
        let oct = '';
        i += 1;
        while (oct.length < 3 && src[i] >= '0' && src[i] <= '7') { oct += src[i]; i += 1; }
        s += String.fromCharCode(parseInt(oct, 8));
        continue;
      }
      s += e; i += 2; continue;                          // \( \) \\ and anything else
    }
    if (c === '(') { depth += 1; s += c; i += 1; continue; }
    if (c === ')') { depth -= 1; i += 1; if (depth === 0) return [s, i]; s += ')'; continue; }
    s += c; i += 1;
  }
  return [s, i];
};

const decodeHex = (src, start) => {
  // src[start] === '<' ; returns [text, indexAfterClosingAngle]
  let i = start + 1, h = '';
  while (i < src.length && src[i] !== '>') {
    const c = src[i];
    if ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) h += c;
    i += 1;
  }
  if (h.length % 2) h += '0';                            // PDF pads an odd final digit
  let s = '';
  for (let k = 0; k < h.length; k += 2) s += String.fromCharCode(parseInt(h.substr(k, 2), 16));
  return [s, i + 1];
};

const isWS = (c) => c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f' || c === '\0';
const isAlpha = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');

// Every string shown by a text-showing operator, in order. Strings are attributed to
// their operator rather than harvested blindly, so a string sitting in some non-drawing
// operand can never be mistaken for ink on the page.
const shownText = (src) => {
  const out = [];
  let pending = [], i = 0;
  while (i < src.length) {
    const c = src[i];
    if (isWS(c) || c === '[' || c === ']') { i += 1; continue; }
    if (c === '(') { const [t, j] = decodeLiteral(src, i); pending.push(t); i = j; continue; }
    if (c === '<' && src[i + 1] !== '<') { const [t, j] = decodeHex(src, i); pending.push(t); i = j; continue; }
    if (c === '<' || c === '>') { i += 2; continue; }     // dictionary delimiters
    if (c === '/') { i += 1; while (i < src.length && !isWS(src[i]) && !'()<>[]{}/%'.includes(src[i])) i += 1; continue; }
    if (isAlpha(c) || c === "'" || c === '"') {           // an operator token
      let op = '';
      if (c === "'" || c === '"') { op = c; i += 1; }
      else { while (i < src.length && (isAlpha(src[i]) || src[i] === '*' || src[i] === '0' || src[i] === '1')) { op += src[i]; i += 1; } }
      if (op === 'Tj' || op === 'TJ' || op === "'" || op === '"') { out.push(...pending); }
      pending = [];                                       // any other operator consumes them
      continue;
    }
    i += 1;                                               // numbers, punctuation, comments
  }
  return out;
};

// The bytes in a Tj operand are TEXT-ENCODED, not Unicode code points. pdf-lib draws
// with /Helvetica under WinAnsiEncoding, where the bytes 0x80-0x9F carry the characters
// Latin-1 leaves undefined — em dash is 0x97, curly quotes are 0x91-0x94, ellipsis is
// 0x85. Reading those as Latin-1 turns a correctly drawn em dash into U+0097 and the
// comparison reports a false failure on a field that prints perfectly. Every character
// here came from one byte, so the round-trip back through windows-1252 is exact.
const decoder = new TextDecoder('windows-1252');
const fromWinAnsi = (s) => decoder.decode(Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff));

// Whitespace and control characters are stripped from both sides before comparing.
// A value that does not fit on one line is drawn as several Tj operators with the break
// falling wherever the wrap landed, so "123 Main Street Suite 400" can reach the stream
// as "(123 Main Street) Tj ... (Suite 400) Tj". Comparing the squeezed forms makes the
// check indifferent to where the wrap fell while still requiring every character.
// Stripping control characters also lets a two-byte (Identity-H) hex string compare
// correctly, since its high bytes decode to NULs between the characters.
const squeeze = (s) => {
  let out = '';
  for (const ch of String(s)) if (ch.charCodeAt(0) > 31 && ch !== ' ' && ch.charCodeAt(0) !== 127) out += ch;
  return out;
};

// ---------------------------------------------------------------------------

// context.lookup(x, PDFDict) THROWS when x is missing rather than returning undefined —
// and "missing /AP" is the single most important thing this tool has to REPORT, not the
// thing it should crash on. A crash exits 1 with a stack trace and names no field; the
// whole point is a clean exit 2 that names the cell that would print blank.
const dictOrNull = (context, obj) => {
  if (obj === undefined || obj === null) return null;
  const v = context.lookup(obj);
  return v instanceof PDFDict ? v : null;
};

const bytesOf = (context, obj) => {
  const st = context.lookup(obj);
  if (!st) return null;
  if (st instanceof PDFRawStream) { try { return decodePDFRawStream(st).decode(); } catch { return null; } }
  if (typeof st.getUnencodedContents === 'function') { try { return st.getUnencodedContents(); } catch { /* fall through */ } }
  if (typeof st.getContents === 'function') { try { return st.getContents(); } catch { return null; } }
  return null;
};

const latin1 = (bytes) => Buffer.from(bytes).toString('latin1');

export async function verifyAppearances(path) {
  const pdf = await PDFDocument.load(readFileSync(path));
  const context = pdf.context;
  const form = pdf.getForm();

  // XFA — asserted, not assumed. See the header note.
  const acro = dictOrNull(context, pdf.catalog.get(PDFName.of('AcroForm')));
  const xfa = acro ? acro.get(PDFName.of('XFA')) : undefined;

  const failures = [];
  let checkedText = 0, checkedBoxes = 0;

  for (const field of form.getFields()) {
    const name = field.getName();

    if (field instanceof PDFTextField) {
      const value = field.getText();
      if (value === undefined || value === null || String(value) === '') continue;
      checkedText += 1;
      const widgets = field.acroField.getWidgets();
      if (!widgets.length) { failures.push({ name, why: 'field carries a value but has no widget to draw it', value }); continue; }

      widgets.forEach((w, wi) => {
        const ap = dictOrNull(context, w.dict.get(PDFName.of('AP')));
        if (!ap) { failures.push({ name, wi, why: 'no /AP dictionary on the widget', value }); return; }
        const bytes = bytesOf(context, ap.get(PDFName.of('N')));
        if (!bytes) { failures.push({ name, wi, why: 'no normal (/AP /N) appearance stream', value }); return; }
        const drawn = fromWinAnsi(shownText(latin1(bytes)).join(''));
        if (!squeeze(drawn).includes(squeeze(value))) {
          failures.push({ name, wi, why: 'appearance stream does not draw the stored value', value, drawn });
        }
      });
      continue;
    }

    if (field instanceof PDFCheckBox) {
      if (!field.isChecked()) continue;
      checkedBoxes += 1;
      const widgets = field.acroField.getWidgets();
      if (!widgets.length) { failures.push({ name, why: 'checkbox is on but has no widget to draw it', value: 'checked' }); continue; }

      widgets.forEach((w, wi) => {
        const as = w.dict.get(PDFName.of('AS'));
        // /AS names which appearance state the viewer draws. Off — or absent — means the
        // viewer prints an empty box no matter what /V says.
        if (!as || as === PDFName.of('Off')) { failures.push({ name, wi, why: `checkbox is on but its appearance state is ${as ? as.asString() : 'absent'}`, value: 'checked' }); return; }
        const ap = dictOrNull(context, w.dict.get(PDFName.of('AP')));
        if (!ap) { failures.push({ name, wi, why: 'no /AP dictionary on the widget', value: 'checked' }); return; }
        const normal = context.lookup(ap.get(PDFName.of('N')));
        if (!(normal instanceof PDFDict)) { failures.push({ name, wi, why: 'normal appearance is not a state dictionary', value: 'checked' }); return; }
        const bytes = bytesOf(context, normal.get(as));
        if (!bytes) { failures.push({ name, wi, why: `no appearance stream for state ${as.asString()}`, value: 'checked' }); return; }
        if (bytes.length === 0) { failures.push({ name, wi, why: `appearance stream for state ${as.asString()} is empty — the box would print blank`, value: 'checked' }); }
      });
    }
  }

  return { path, xfa: xfa !== undefined, checkedText, checkedBoxes, failures };
}

const report = (r) => {
  console.log(`verify-appearances: ${r.path}`);
  console.log(`  XFA: ${r.xfa ? 'PRESENT — a viewer may prefer it over the verified appearances' : 'absent — no XFA layer for a viewer to prefer over the baked appearances'}`);
  const checked = r.checkedText + r.checkedBoxes;
  console.log(`  checked ${checked} field(s) carrying a value (${r.checkedText} text + ${r.checkedBoxes} checkbox), passed ${checked - r.failures.length}, failed ${r.failures.length}`);
  if (r.failures.length) {
    console.error(`APPEARANCE VERIFICATION FAILED — ${r.failures.length} field(s) store a value that the page does not draw.`);
    for (const f of r.failures) {
      console.error(`  ${f.name}${f.wi === undefined ? '' : ` [widget ${f.wi}]`}`);
      console.error(`    ${f.why}`);
      console.error(`    stored: ${JSON.stringify(f.value)}`);
      if (f.drawn !== undefined) console.error(`    drawn:  ${JSON.stringify(f.drawn.slice(0, 120))}`);
    }
    console.error('  The file would print blank (or wrong) in these cells. Do not send it.');
    return 2;
  }
  if (r.xfa) {
    console.error('APPEARANCE VERIFICATION FAILED — an XFA layer is present, so a viewer may render from it and ignore every appearance verified above.');
    return 2;
  }
  console.log('OK — every stored value is drawn by its widget normal appearance stream.');
  return 0;
};

// Run standalone only. Imported by the fill scripts, which report through their own run.
// pathToFileURL, not string surgery: on Windows a hand-built file:// URL differs from
// import.meta.url in both slash count and drive-letter case, and the guard silently
// never fires — which is exactly what a tool that exits 0 on failure looks like.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2];
  if (!path) { console.error('usage: node adapters/pdf/verify-appearances.mjs <filled.pdf>'); process.exit(2); }
  process.exit(report(await verifyAppearances(path)));
}

export { report as reportAppearances };
