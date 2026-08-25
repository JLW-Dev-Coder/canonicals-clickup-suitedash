// [B-07] — [K-113] IS RE-AIMED AT WHAT IS TRUE NOW, AND A SECOND COUNTER WATCHES THE OTHER HALF.
//
//   node scratchpad/b07-patch-blanket.mjs
//
// [K-113] was written to watch [B-07] from the outside. Its own words:
//
//   "Covered: those that are NOT named as a total_cell in 433b.totals.json — so the day a
//    ruling makes one an arithmetic tripwire, the count moves and [B-07] stops being true out
//    loud, which is the direction the carried item exists to watch."
//
// That day is this commit, and the counter did exactly what it promised. It is re-aimed rather
// than deleted, because the claim it now has to hold is the OTHER half of the resolution: THE
// THREE INTANGIBLE ROWS ARE STILL NOT TRIPWIRES, and they are not for a reason about the page.
//
// A SECOND COUNTER IS ADDED FOR THE HALF NOTHING WOULD OTHERWISE WATCH: every equity cell that
// DOES draw both operands IS a declared total cell. Without it, the sixteen could be quietly
// un-declared again and only the totals file would know.
//
// AND THE UNIVERSE WIDENS, WHICH IS A FINDING. [K-113] admitted `<group>[<i>].equity` only, so
// its universe was 15 cells — real property, vehicles, business equipment and the three
// intangible rows. THE FOUR PAGE-3 CELLS WERE NEVER IN IT: investments and digital assets name
// their column `equity_value_minus_loan`, and a counter keyed on the string "equity" does not
// see them. [B-07]'s own text counted nineteen cells; the instrument watching it counted
// fifteen and said so to nobody.

import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/blanket-audit.mjs';
const raw = readFileSync(P, 'utf8');
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(EOL);

const NEW = `  // [B-07]'s two halves, RESOLVED, and each half gets the counter it needs.
  //
  // THE UNIVERSE IS EVERY EQUITY-SHAPED COLUMN AND NOT THE ONES SPELLED "equity". The first
  // draft admitted \`<group>[<i>].equity\` and counted 15 cells; investments and digital assets
  // name theirs \`equity_value_minus_loan\`, so the four page-3 cells [B-07] itself counted were
  // outside the instrument watching [B-07]. An equity column is one whose name carries the word
  // equity, and both spellings do.
  C({ id: 'K-113', match: /^Neither operand is drawn on them$/i,
    kind: 'counter',
    what: 'The three intangible rows draw an equity cell and NEITHER operand, and none of them is a declared total cell. Universe: every (group, row) whose slot declares an equity-shaped column and NO fair-market-value or loan cell. Covered: those that are NOT named as a total_cell in 433b.totals.json. A ruling that swept the column would move this count, which is the direction [B-07] said any resolution had to keep honest.',
    universe: { scoped_to: 'artefact', detail: 'every slot of every group in adapters/pdf/maps/433b.map.json that declares an equity-shaped column and neither operand of the relation its header names',
      admits: (m) => typeof m === 'string' && /\\[\\d+\\]\\.equity/.test(m) },
    count: () => countEquityCells(false),
  }),

  // THE OTHER HALF, WHICH NOTHING WOULD OTHERWISE WATCH: the sixteen with both operands drawn
  // are declared lines, and if one were quietly un-declared only the totals file would know.
  C({ id: 'K-114', match: /^both operands are drawn$/i,
    kind: 'counter',
    what: 'Every equity cell on 433-B that draws BOTH operands of the relation its column header names IS a declared total cell. Universe: every (group, row) whose slot declares an equity-shaped column and a fair-market-value and a loan cell. Covered: those named as a total_cell in 433b.totals.json.',
    universe: { scoped_to: 'artefact', detail: 'every slot of every group in adapters/pdf/maps/433b.map.json that declares an equity-shaped column and both operands',
      admits: (m) => typeof m === 'string' && /\\[\\d+\\]\\.equity/.test(m) },
    count: () => countEquityCells(true),
  }),
`;

const HELPER = `// EVERY EQUITY CELL ON 433-B, SPLIT BY WHETHER ITS ROW DRAWS BOTH OPERANDS. Shared by [K-113]
// and [K-114] so the two halves are cut from ONE reading of the map: two readings of one
// population is two answers to the question the split exists to give one answer to.
const countEquityCells = (withOperands) => {
  const map = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));
  const tot = JSON.parse(readFileSync('adapters/pdf/maps/433b.totals.json', 'utf8'));
  const EQUITY = /equity/i;
  const FMV = /^(current_fmv|current_value|current_value_usd)$/;
  const LOAN = /^(current_loan_balance|loan_balance)$/;
  const cells = [];
  for (const [g, def] of Object.entries(map.groups || {})) {
    (def.slots || []).forEach((s, i) => {
      const cols = Object.keys(s.text || {});
      const eq = cols.find((c) => EQUITY.test(c));
      if (!eq) return;
      const hasBoth = cols.some((c) => FMV.test(c)) && cols.some((c) => LOAN.test(c));
      if (hasBoth !== withOperands) return;
      cells.push(\`\${g}[\${i}].\${eq}\`);
    });
  }
  const asTotal = new Set();
  for (const t of (tot.totals || [])) {
    const tc = t.total_cell;
    if (tc && tc.group && EQUITY.test(String(tc.column)) && typeof tc.row === 'number') asTotal.add(\`\${tc.group}[\${tc.row}].\${tc.column}\`);
  }
  // [K-114] counts the ones that ARE declared; [K-113] the ones that are NOT.
  const uncovered = withOperands ? cells.filter((c) => !asTotal.has(c)) : cells.filter((c) => asTotal.has(c));
  return { universe: cells.length, covered: cells.length - uncovered.length, universeList: cells, uncoveredList: uncovered };
};

`;

// --- replace the old K-113 entry, from its comment banner to its closing "} }),"
const start = lines.findIndex((l) => l === "  // [B-07]'s claim about the equity columns. Anchored and last, for the reason the three");
if (start < 0) { console.error('STOP — the [K-113] banner is not where this patch expects it.'); process.exit(2); }
let end = -1;
for (let i = start; i < lines.length; i++) if (lines[i] === '    } }),') { end = i; break; }
if (end < 0) { console.error('STOP — no closing "} })," found after the [K-113] banner.'); process.exit(2); }
console.log(`replacing adapters/pdf/blanket-audit.mjs:${start + 1}..${end + 1} (${end - start + 1} lines) with ${NEW.split('\n').length}`);
lines = [...lines.slice(0, start), ...NEW.split('\n'), ...lines.slice(end + 1)];

// --- and the shared helper, just above COMPLETENESS
const decl = lines.findIndex((l) => l === 'export const COMPLETENESS = [');
if (decl < 0) { console.error('STOP — COMPLETENESS is not declared where this patch expects it.'); process.exit(2); }
lines = [...lines.slice(0, decl), ...HELPER.split('\n'), ...lines.slice(decl)];
console.log(`inserted the shared counter helper above COMPLETENESS at line ${decl + 1}`);

writeFileSync(P, lines.join(EOL));
console.log('written.');
