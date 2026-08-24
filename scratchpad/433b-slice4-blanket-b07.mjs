// [K-113] — the counter for [B-07]'s "every one of them is bound as an INPUT and none is a
// tripwire". That is a completeness claim about a set this tree can enumerate exactly, so it
// gets a counter rather than a not-coverage declaration: the whole content of the carried item
// is that these cells are inputs TODAY and that a later ruling might make them tripwires, and a
// counter is what makes the day that changes announce itself.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/blanket-audit.mjs';
const L = readFileSync(P, 'utf8').split('\n');

const open = L.findIndex((l) => l.startsWith('export const COMPLETENESS = ['));
if (open < 0) { console.error('STOP — the COMPLETENESS declaration is not in blanket-audit.mjs.'); process.exit(2); }
let next = -1;
for (let i = open + 1; i < L.length; i++) if (/^[A-Za-z_$]/.test(L[i])) { next = i; break; }
if (next < 0) { console.error('STOP — no top-level statement follows the COMPLETENESS array.'); process.exit(2); }
let at = -1;
for (let i = next - 1; i > open; i--) if (L[i].trim() === '];') { at = i; break; }
if (at < 0) { console.error('STOP — the COMPLETENESS array does not close before the next top-level statement.'); process.exit(2); }

const BLOCK = [
  "  // [B-07]'s claim about the equity columns. Anchored and last, for the reason the three",
  '  // entries above it are.',
  "  C({ id: 'K-113', match: /^Every one of them is bound$/i,",
  "    kind: 'counter',",
  "    what: 'Every equity cell the 433-B map declares is an INPUT and none of them is a declared total cell. Universe: every (group, row) whose slot declares an equity column. Covered: those that are NOT named as a total_cell in 433b.totals.json — so the day a ruling makes one an arithmetic tripwire, the count moves and [B-07] stops being true out loud, which is the direction the carried item exists to watch.',",
  "    universe: { scoped_to: 'artefact', detail: 'every slot of every group in adapters/pdf/maps/433b.map.json that declares an `equity` column',",
  "      admits: (m) => typeof m === 'string' && /\\[\\d+\\]\\.equity$/.test(m) },",
  '    count: () => {',
  "      const map = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));",
  "      const tot = JSON.parse(readFileSync('adapters/pdf/maps/433b.totals.json', 'utf8'));",
  '      const cells = [];',
  '      for (const [g, def] of Object.entries(map.groups || {}))',
  "        (def.slots || []).forEach((s, i) => { if (s.text && s.text.equity) cells.push(`${g}[${i}].equity`); });",
  '      const asTotal = new Set();',
  '      for (const t of (tot.totals || [])) {',
  '        const tc = t.total_cell;',
  '        if (tc && tc.group && tc.column === \'equity\' && typeof tc.row === \'number\') asTotal.add(`${tc.group}[${tc.row}].equity`);',
  '      }',
  '      const uncovered = cells.filter((c) => asTotal.has(c));',
  '      return { universe: cells.length, covered: cells.length - uncovered.length, universeList: cells, uncoveredList: uncovered };',
  '    } }),',
  '',
];
L.splice(at, 0, ...BLOCK);

const out = L.join('\n');
writeFileSync(P, out);
const back = readFileSync(P, 'utf8');
const problems = [];
if (back !== out) problems.push('the file on disk is not what this script wrote.');
if ((back.split("id: 'K-113'").length - 1) !== 1) problems.push('K-113 is not present exactly once.');
if (!back.includes("/\\[\\d+\\]\\.equity$/.test(m)")) problems.push('the [K-113] admits predicate did not survive with its backslashes intact.');
if (problems.length) { problems.forEach((x) => console.error(`STOP — ${x}`)); process.exit(2); }
const mod = await import('../adapters/pdf/blanket-audit.mjs');
if (!mod.COMPLETENESS.find((e) => e.id === 'K-113')) { console.error('STOP — K-113 is in the FILE but not in the exported COMPLETENESS array.'); process.exit(2); }
console.log(`patched ${P}: [K-113] added at array depth 0 and present in the exported register.`);
