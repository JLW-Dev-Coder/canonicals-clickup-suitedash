// Slice 4's three completeness claims into blanket-audit.mjs's COMPLETENESS register.
// Every one is a real counter over a set this tree can enumerate; none is declared
// not-coverage, because all three do assert that a set has been covered.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/blanket-audit.mjs';
const L = readFileSync(P, 'utf8').split('\n');

// APPENDED AT THE END OF THE REGISTER, not inserted mid-list: COMPLETENESS.find() takes the
// first match, so an entry placed early can shadow one written for the same clause.
// THE END OF THE ARRAY IS FOUND BY BRACKET DEPTH, NOT BY THE FIRST CLOSING BRACKET AFTER THE
// OPENING LINE. The first draft did the latter and landed the three entries INSIDE A NESTED ARRAY of
// an earlier counter — they parsed, the file ran, and COMPLETENESS never contained them, so
// all three claims went on reporting UNDISPOSED with the register apparently patched. A
// structural search reported as an id lookup is exactly the shape this whole register exists
// to refuse, so the result is asserted below by importing the module and looking the ids up.
const open = L.findIndex((l) => l.startsWith('export const COMPLETENESS = ['));
if (open < 0) { console.error('STOP — the COMPLETENESS declaration is not in blanket-audit.mjs.'); process.exit(2); }
// BRACKET COUNTING IS NOT USED EITHER: the second draft counted [ and ] over the raw lines
// and was fooled by brackets inside strings and regex literals, which produced a file that
// did not parse. The structural fact that IS reliable here is column zero — every top-level
// declaration in this file starts there and no line inside the array does — so the end of
// the array is the last  before the next column-zero statement.
let next = -1;
for (let i = open + 1; i < L.length; i++) if (/^[A-Za-z_$]/.test(L[i])) { next = i; break; }
if (next < 0) { console.error("STOP — no top-level statement follows the COMPLETENESS array."); process.exit(2); }
let at = -1;
for (let i = next - 1; i > open; i--) if (L[i].trim() === "];") { at = i; break; }
if (at < 0) { console.error("STOP — the COMPLETENESS array does not close before the next top-level statement."); process.exit(2); }

const BLOCK = readFileSync('scratchpad/433b-slice4-blanket-block.txt', 'utf8');
L.splice(at, 0, ...BLOCK.split('\n').slice(0, -1));

const out = L.join('\n');
writeFileSync(P, out);
const back = readFileSync(P, 'utf8');
const problems = [];
if (back !== out) problems.push('the file on disk is not what this script wrote.');
for (const id of ['K-110', 'K-111', 'K-112']) if ((back.split(`id: '${id}'`).length - 1) !== 1) problems.push(`${id} is not present exactly once.`);
if (!back.includes("admits: (m) => typeof m === 'string' && /^p[56]:/.test(m)")) problems.push('the [K-111] admits predicate did not survive the write.');
if (!back.includes("filter((f) => f.type === 'PDFCheckBox' && /\\.Page[56]\\[0\\]\\./.test(f.name))")) problems.push('the [K-112] page filter did not survive the write with its backslashes intact.');
if (problems.length) { problems.forEach((x) => console.error(`STOP — ${x}`)); process.exit(2); }
const mod = await import('../adapters/pdf/blanket-audit.mjs');
const missing = ['K-110', 'K-111', 'K-112'].filter((id) => !mod.COMPLETENESS.find((e) => e.id === id));
if (missing.length) { console.error(`STOP — ${missing.join(', ')} are in the FILE but not in the exported COMPLETENESS array. They were spliced into a nested structure; a register entry the module does not export disposes of nothing.`); process.exit(2); }
console.log(`patched ${P}: [K-110], [K-111] and [K-112] added at array depth 0, present in the exported register, and every anchor read back from disk verbatim.`);
