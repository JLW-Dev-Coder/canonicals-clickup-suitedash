// Slice 4's claim sites into count-sweep.mjs's MANIFEST, and the one slice-3 row the new
// totals invalidate. Spliced by line index, asserted back off disk.
//
// [S-45] carries `claimed: 6` for "printed totals declared for 433-B" and derives it from the
// whole totals file. That was true when slice 3 wrote it and slice 4 makes it false — eleven —
// so the ROW is retargeted to the set the sentence beside it is actually about (the totals
// drawn on pages 2, 3 and 4, which is still six) and a new row counts the whole file against
// the new figure. The map's own prose is corrected in the same commit rather than left to be
// read as current.

import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/count-sweep.mjs';
const L = readFileSync(P, 'utf8').split('\n');
const bad = [];

// ── (1) retarget the [S-45] whole-file row ──────────────────────────────────────────────────
const r1 = L.findIndex((l) => l.includes("rows.push({ what: 'printed totals declared for 433-B', claimed: 6, derived: (ctx.totalsDoc?.totals || []).length,"));
if (r1 < 0) bad.push('the [S-45] whole-file totals row is not in count-sweep.mjs verbatim.');
if (bad.length) { bad.forEach((x) => console.error(`STOP — ${x}`)); process.exit(2); }
if (!L[r1 + 1].includes("from: 'adapters/pdf/maps/433b.totals.json' });")) { console.error('STOP — the [S-45] row does not continue as expected on the next line.'); process.exit(2); }
L.splice(r1, 2,
  "      // THE SENTENCE THIS ROW GUARDS IS ABOUT PAGES 2 TO 4 AND SAYS SO: \"Six printed totals on",
  '      // this form now, six equality tripwires\". It was true when slice 3 wrote it and slice 4',
  '      // makes it false of the FORM while leaving it true of THE PAGES IT NAMES. The row is',
  '      // retargeted to that set rather than the claim being edited down to match a wider file,',
  '      // and the whole-file count moves to a row of its own beside it so neither is unwatched.',
  "      rows.push({ what: 'printed totals declared on pages 2, 3 and 4', claimed: 6,",
  "        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page [234],/.test(t.caption_at || '')).length,",
  "        from: \"the totals file's own caption_at, which names the page each total is drawn on\" });",
  "      rows.push({ what: 'printed totals declared for 433-B, whole file', claimed: 11, derived: (ctx.totalsDoc?.totals || []).length,",
  "        from: 'adapters/pdf/maps/433b.totals.json — six through page 4 and five more on pages 5 and 6' });");

// ── (2) the slice-4 manifest entry ──────────────────────────────────────────────────────────
const at = L.findIndex((l) => l.includes("D({ id: 'S-46', file: /433b\\.map\\.json$/"));
if (at < 0) { console.error('STOP — the [S-46] entry is not in count-sweep.mjs.'); process.exit(2); }

const BLOCK = readFileSync('scratchpad/433b-slice4-countsweep-block.txt', 'utf8');

L.splice(at, 0, ...BLOCK.split('\n').slice(0, -1));

const out = L.join('\n');
writeFileSync(P, out);

const back = readFileSync(P, 'utf8');
const problems = [];
if (back !== out) problems.push('the file on disk is not what this script wrote.');
for (const id of ['S-47', 'S-48', 'S-49']) if ((back.split(`id: '${id}'`).length - 1) !== 1) problems.push(`${id} is not present exactly once.`);
if (back.includes("what: 'printed totals declared for 433-B', claimed: 6")) problems.push('the stale [S-45] whole-file row survived.');
if (!back.includes("what: 'printed totals declared on pages 2, 3 and 4', claimed: 6")) problems.push('the retargeted [S-45] row did not survive.');
if (!back.includes(String.raw`at: /^_the_leaf_names_on_pages_5_and_6_are_one_printed_marker_behind(\..*)?$/`)) problems.push('the [S-48] path pattern did not survive with its backslashes intact.');
if (problems.length) { problems.forEach((x) => console.error(`STOP — ${x}`)); process.exit(2); }
console.log(`patched ${P}: [S-45] retargeted, [S-47], [S-48] and [S-49] added; every anchor read back from disk verbatim.`);
