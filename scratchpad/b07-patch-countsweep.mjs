// [B-07] — THE COUNT-SWEEP CLAIMS ABOUT 433-B's PRINTED TOTALS, SCOPED RATHER THAN BUMPED.
//
//   node scratchpad/b07-patch-countsweep.mjs
//
// Six rows in adapters/pdf/count-sweep.mjs derive a figure from `433b.totals.json`'s length or
// from its per-page filter. Sixteen row relations arriving would move every one of them, and
// there are two ways to respond:
//
//   BUMP THE CLAIM     4 becomes 8, 11 becomes 27, and each row goes on "agreeing" about a
//                      universe that has silently changed. That is the defect [S-40]'s own
//                      comment records happening once already: "This row read 'printed totals
//                      declared for 433-B', claimed 4, and derived the whole totals file —
//                      which was the same number only while pages 2 and 3 were the only pages
//                      read." A figure that silently tracks whatever the file happens to hold
//                      checks nothing.
//
//   SCOPE THE CLAIM    each existing row keeps its universe — BLOCK TOTALS, the lines whose
//                      caption names its own addends — and a NEW row beside it counts the row
//                      relations. Two universes, two figures, both derived, neither absorbing
//                      the other. [R-07].
//
// This is the second. Every existing claimed number below is unchanged.

import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/count-sweep.mjs';
const raw = readFileSync(P, 'utf8');
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(EOL);

const BLOCK = "(t) => !t.relation";   // a block total: no `relation` key. Row relations declare `relation: 'row'`.

const EDITS = [
  // ── [S-40], pages 2 and 3 ──────────────────────────────────────────────────────────────
  { from: "      rows.push({ what: 'printed totals declared for 433-B on pages 2 and 3', claimed: 4,",
    to: [
      "      // THE UNIVERSE IS BLOCK TOTALS AND IT SAYS SO. [B-07] made sixteen row-level equity",
      "      // relations declared lines, four of them on page 3, and this row's 4 is about the",
      "      // totals whose caption names its own addends — 17d, 18f, 19c and 20e. The row",
      "      // relations are counted beside it rather than folded into it.",
      "      rows.push({ what: 'printed BLOCK totals declared for 433-B on pages 2 and 3', claimed: 4,",
    ] },
  { from: "        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page [23],/.test(t.caption_at || '')).length,",
    to: [
      `        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page [23],/.test(t.caption_at || '')).filter(${BLOCK}).length,`,
    ] },
  { from: "        from: \"adapters/pdf/maps/433b.totals.json, filtered by the page each total's own caption_at names\" });",
    to: [
      "        from: \"adapters/pdf/maps/433b.totals.json, filtered by the page each total's own caption_at names and by carrying no `relation` key\" });",
      "      rows.push({ what: 'row-level equity relations declared on page 3', claimed: 4,",
      "        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page 3,/.test(t.caption_at || '') && t.relation === 'row').length,",
      "        from: 'the same file, filtered to the lines declaring `relation: \"row\"` — [B-07]: 19a, 19b, 20b and 20c' });",
    ] },

  // ── [S-45], pages 2 to 4 and the whole file ────────────────────────────────────────────
  { from: "      rows.push({ what: 'printed totals declared on pages 2, 3 and 4', claimed: 6,",
    to: [
      "      rows.push({ what: 'printed BLOCK totals declared on pages 2, 3 and 4', claimed: 6,",
    ] },
  { from: "        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page [234],/.test(t.caption_at || '')).length,",
    to: [
      `        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page [234],/.test(t.caption_at || '')).filter(${BLOCK}).length,`,
    ] },
  { from: "      rows.push({ what: 'printed totals declared for 433-B, whole file', claimed: 11, derived: (ctx.totalsDoc?.totals || []).length,",
    to: [
      "      // TWO FIGURES WHERE THERE WAS ONE, AND THE OLD ONE KEEPS ITS UNIVERSE. 11 block",
      "      // totals and 16 row relations, 27 declared lines. Bumping the 11 to 27 would have",
      "      // made this row true again and stopped it checking anything ([R-07]).",
      "      rows.push({ what: 'printed BLOCK totals declared for 433-B, whole file', claimed: 11,",
      `        derived: (ctx.totalsDoc?.totals || []).filter(${BLOCK}).length,`,
    ] },
  { from: "        from: 'adapters/pdf/maps/433b.totals.json — six through page 4 and five more on pages 5 and 6' });",
    to: [
      "        from: 'adapters/pdf/maps/433b.totals.json — six through page 4 and five more on pages 5 and 6' });",
      "      rows.push({ what: 'row-level equity relations declared for 433-B, whole file', claimed: 16,",
      "        derived: (ctx.totalsDoc?.totals || []).filter((t) => t.relation === 'row').length,",
      "        from: 'the same file — [B-07]: 2 on INVESTMENTS, 2 on DIGITAL ASSETS, 4 on REAL PROPERTY, 4 on VEHICLES and 4 on BUSINESS EQUIPMENT' });",
      "      rows.push({ what: 'declared lines of BOTH classes for 433-B, whole file', claimed: 27, derived: (ctx.totalsDoc?.totals || []).length,",
      "        from: 'adapters/pdf/maps/433b.totals.json, unfiltered — the figure gate step 11 reports as \"of N declared lines\"' });",
      "      rows.push({ what: 'equity cells declared NOT checkable on 433-B', claimed: 3,",
      "        derived: ((ctx.totalsDoc?.not_checkable?.entries || []).find((e) => /intangible_assets/.test(e.map_key || ''))?.map_key || '').split(',').filter((s) => s.trim()).length,",
      "        from: 'the not_checkable entry [B-07] narrowed from the whole equity column to the three intangible rows, counted from the map keys it names' });",
    ] },
  { from: "      rows.push({ what: 'totals declared for page 4', claimed: 2,",
    to: [
      "      rows.push({ what: 'BLOCK totals declared for page 4', claimed: 2,",
    ] },
  { from: "        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page 4,/.test(t.caption_at || '')).length,",
    to: [
      `        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page 4,/.test(t.caption_at || '')).filter(${BLOCK}).length,`,
      "        from: \"the totals file's own caption_at, which names the page each total is drawn on\" });",
      "      rows.push({ what: 'row-level equity relations declared on page 4', claimed: 8,",
      "        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page 4,/.test(t.caption_at || '') && t.relation === 'row').length,",
    ] },

  // ── [S-47], pages 5 and 6 ──────────────────────────────────────────────────────────────
  { from: "        { what: 'printed totals declared on pages 5 and 6', claimed: 5,",
    to: [
      "        { what: 'printed BLOCK totals declared on pages 5 and 6', claimed: 5,",
    ] },
  { from: "          derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page [56],/.test(t.caption_at || '')).length,",
    to: [
      `          derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page [56],/.test(t.caption_at || '')).filter(${BLOCK}).length,`,
    ] },
  { from: "        { what: 'declared total lines on 433-B now', claimed: 11, derived: (ctx.totalsDoc?.totals || []).length,",
    to: [
      "        { what: 'row-level equity relations declared on page 5', claimed: 4,",
      "          derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page 5,/.test(t.caption_at || '') && t.relation === 'row').length,",
      "          from: 'the totals file, filtered to `relation: \"row\"` — [B-07]: 24a to 24d. 24e, 24f and 24g draw NEITHER operand and stay declared not checkable' },",
      `        { what: 'declared BLOCK total lines on 433-B now', claimed: 11, derived: (ctx.totalsDoc?.totals || []).filter(${BLOCK}).length,`,
    ] },
];

let patched = 0;
for (const e of EDITS) {
  const at = [];
  lines.forEach((l, i) => { if (l === e.from) at.push(i); });
  if (at.length !== 1) { console.error(`STOP — anchor matched ${at.length} line(s), not one:\n  ${e.from}`); process.exit(2); }
  lines.splice(at[0], 1, ...e.to);
  patched++;
  console.log(`patched ${P}:${at[0] + 1} — 1 line -> ${e.to.length}`);
}
writeFileSync(P, lines.join(EOL));
console.log(`${patched} edit(s) applied. Every EXISTING claimed number is unchanged; the new ones are new universes.`);
