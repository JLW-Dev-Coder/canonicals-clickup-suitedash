// Reads the printed revision footer out of an IRS form PDF.
//
// Ground truth is the DRAWN PAGE TEXT, not the metadata dictionary: these IRS
// hybrids carry stale /Info and XMP blocks that name an older revision than the
// footer actually printed on the page. So: inflate every content stream, pull
// the text out, and read the footer.
//
// CLI:  node adapters/pdf/read-form-revision.mjs <form>      (reads adapters/pdf/forms/f<form>.pdf)
// API:  import { readFormRevision } from './read-form-revision.mjs'
//
// Exits 2 when no revision string is found in the drawn text.

import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync, inflateRawSync } from 'node:zlib';

export const formPath = (form) => `adapters/pdf/forms/f${form}.pdf`;

// Inflate every stream we can and return the decoded bytes as text, plus the
// contents of every PDF string literal joined together. The join matters: a
// kerned footer is emitted as many separate Tj operands, so "Rev. 7-2024" only
// reassembles once the literals are concatenated.
function drawnText(buf) {
  const chunks = [buf.toString('latin1')];
  let idx = 0, inflated = 0;
  while ((idx = buf.indexOf('stream', idx)) !== -1) {
    let s = idx + 6;
    if (buf[s] === 0x0d) s++;
    if (buf[s] === 0x0a) s++;
    const end = buf.indexOf('endstream', s);
    if (end === -1) break;
    const raw = buf.subarray(s, end);
    for (const fn of [inflateSync, inflateRawSync]) {
      try { chunks.push(fn(raw).toString('latin1')); inflated++; break; } catch { /* try raw, else skip */ }
    }
    idx = end + 9;
  }
  const all = chunks.join('\n');
  const literals = all.match(/\((?:\\.|[^\\()])*\)/g) || [];
  const joined = literals.map(s => s.slice(1, -1).replace(/\\([()\\])/g, '$1')).join('');
  return { all, joined, inflated };
}

// Collapse to [A-Za-z0-9-] so the match survives arbitrary inter-glyph spacing,
// TJ kern arrays and line breaks. The hyphen is KEPT so "7-2024" and "433-A"
// stay readable rather than degrading to ambiguous digit runs.
const squash = (s) => s.replace(/[^A-Za-z0-9-]/g, '');

export function readFormRevision(form) {
  const file = formPath(form);
  const buf = readFileSync(file);
  const sha256 = createHash('sha256').update(buf).digest('hex').toUpperCase();

  const { all, joined, inflated } = drawnText(buf);
  const drawn = squash(joined);                    // string literals only — no binary noise
  const text = squash(all) + '\n' + drawn;

  // "Form 433-F (Rev. 7-2024)" -> 433-F. Anchored on the footer's trailing "Rev",
  // and searched in the DRAWN LITERALS only: a bare /Form\d{3}/ over the whole file
  // matches arbitrary digit runs in the binary and returns a confident wrong answer
  // (it read "222" for 433-F and "498" for 433-A). The anchor is what makes it right.
  //
  // THE PARENTHESISED SUFFIX. `squash` strips the parentheses, so 433-A(OIC)'s footer
  // reaches here as "Form433-AOICRev4-2026" and the old pattern — which allowed nothing
  // between the letter and "Rev" — returned a false ABSENT on a form whose number is
  // printed eleven times. The suffix is matched as its own group and re-parenthesised, so
  // the answer reads 433-A(OIC) the way the footer prints it. Same shape will carry
  // 433-B(OIC). Sibling of the Catalog Number / Cat. No. fix directly below.
  const oicForm = drawn.match(/Form(\d{3,4}-[A-Z])(OIC)\(?Rev/i);
  const formNumber =
    (oicForm ? `${oicForm[1]}(${oicForm[2].toUpperCase()})` : null) ||
    (drawn.match(/Form(\d{3,4}(?:-[A-Z])?)\(?Rev/i) || [])[1] ||
    (drawn.match(/Form(\d{3,4}-[A-Z])(?![A-Za-z0-9])/) || [])[1] ||
    null;

  // "Rev. 7-2024" -> 7-2024. Accept "Rev" or "Revised", with or without the dot.
  const revision = (text.match(/Rev(?:ised)?-?(\d{1,2}-20\d{2})/i) || [])[1] || null;

  // The footer prints the LONG form "Catalog Number 62053J". It does NOT print
  // "Cat. No." — a regex built only on the abbreviation returns a false ABSENT.
  // Both spellings are accepted here so this cannot recur on either form.
  const catalog = (text.match(/Cat(?:alog)?-?(?:No|Number)-?(\d{4,6}[A-Z])/i) || [])[1] || null;

  // `pages` stays null here — it needs a parsed document; see readFormRevisionWithPages.
  return { form, file, sha256, pages: null, formNumber, revision, catalog, streamsInflated: inflated };
}

// Page count needs a parsed document, which is async in pdf-lib.
export async function readFormRevisionWithPages(form) {
  const info = readFormRevision(form);
  const pdf = await PDFDocument.load(readFileSync(info.file), { updateMetadata: false });
  info.pages = pdf.getPageCount();
  return info;
}

const isCli = import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`;
if (isCli) {
  const form = process.argv[2] || '433f';
  const info = await readFormRevisionWithPages(form);
  console.log(`file:      ${info.file}`);
  console.log(`form:      ${info.formNumber ?? '(not found)'}`);
  console.log(`revision:  ${info.revision ? `Rev. ${info.revision}` : '(not found)'}`);
  console.log(`catalog:   ${info.catalog ?? '(not found)'}`);
  console.log(`pages:     ${info.pages}`);
  console.log(`sha256:    ${info.sha256}`);
  console.log(`(inflated ${info.streamsInflated} content streams; read from drawn text, not metadata)`);
  if (!info.revision) {
    console.error('NO REVISION STRING FOUND in the drawn text — STOP and report to Principal.');
    process.exit(2);
  }
}
