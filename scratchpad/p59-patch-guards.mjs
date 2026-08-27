// p59-patch-guards.mjs — re-anchors [G-262] and [G-243] and adds [G-289] after the
// sweep-boundary.mjs declaration read was factored into declaredGenerator().
//
// [R-12]: a refactor of a guard is a change to the guard. Editing those two lines orphaned both
// dispositions and created three UNDISPOSED sites, and guard-sweep said so by name. This is the
// re-write it asked for, not a suppression.
//
// PATCHED BY LINE, NOT BY BLOB. The anchors are dense with quotes, braces and backslashes, and
// a heredoc or a blob replace eats them silently and still exits 0. Each edit locates its line
// by a stable prefix and splices by index, and every edit is asserted afterwards.
//
// [R-19] GENERATOR DECLARATION: this file edits adapters/pdf/guard-sweep.mjs in place.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/guard-sweep.mjs';
const lines = readFileSync(P, 'utf8').split('\n');

const findLine = (needle) => {
  const i = lines.findIndex(l => l.includes(needle));
  if (i < 0) { console.error(`STOP — no line contains ${JSON.stringify(needle)}. Nothing patched.`); process.exit(2); }
  return i;
};

// ── 1. re-anchor [G-262] ─────────────────────────────────────────────────────────────────
const i262 = findLine("{ id: 'G-262', file: 'sweep-boundary.mjs'");
lines[i262] = `  { id: 'G-262', file: 'sweep-boundary.mjs', anchor: "try { return !!declaredGenerator(JSON.parse(r(p))); } catch { return false; }", verdict: 'sound',`;
lines[i262 + 1] = `    why: "AN UNPARSEABLE MAP ARTEFACT IS NOT A DERIVED CONSTRUCT, and returning false is the safe direction rather than the quiet one. [SB-23] claims a file on the ground that it DECLARES a generator; a file nobody can parse has declared nothing, so it is excluded from that entry — and being excluded from every entry is exactly what [SB-92] refuses. It lands in the residual as UNCLAIMED and names itself. There is no path on which a corrupt sidecar is silently excused as a construct. RE-ANCHORED, and the disposition is unchanged because the BRANCH is unchanged: only the declaration read moved, into declaredGenerator(), so that the population and the crosscheck could not disagree about what counts as a declaration. [R-12] is why the orphan was expected rather than surprising." },`;

// ── 2. re-anchor [G-243] ─────────────────────────────────────────────────────────────────
const i243 = findLine("{ id: 'G-243', file: 'sweep-boundary.mjs'");
lines[i243] = `  { id: 'G-243', file: 'sweep-boundary.mjs', anchor: "try { gen = declaredGenerator(JSON.parse(r(p))); } catch { gen = null; }", verdict: 'sound',`;
lines[i243 + 1] = `    why: 'null IS A NAMED FAILING VERDICT AND THE NEXT LINE PRINTS IT. An artefact that will not parse, or that parses and names no generator, sets gen to null and the loop immediately pushes CONTRADICTED -- "an artefact that does not say what wrote it cannot be checked against it". The unreadable case and the undeclared case deliberately produce the SAME row, because for this entry\\u2019s claim they are the same fact: the ground that something re-derives this file cannot be verified. What is NOT possible is silence, which is what \`catch { continue }\` would have been. RE-ANCHORED for the declaredGenerator() factoring; the branch and its verdict are unchanged.' },`;

// ── 3. add [G-289] for the extract, which is genuinely new ───────────────────────────────
const NEW = [
  `  { id: 'G-289', file: 'sweep-boundary.mjs', anchor: "const m = /^\\\\s*([A-Za-z0-9_./-]+\\\\.mjs)/.exec(raw);", verdict: 'sound',`,
  `    why: "A NON-MATCH RETURNS null, AND null IS THE LOUD DIRECTION AT BOTH CALL SITES. declaredGenerator() takes the generator PATH out of a declaration that may be prose: _generated_by carries a whole sentence — 'scratchpad/p58-433h-projection.mjs, re-run it and this file regenerates byte for byte' — so the path is captured rather than used whole, or the crosscheck's existsSync() would report every artefact declaring itself that way as CONTRADICTED. If this regex matches nothing the function returns null and neither caller can go quiet: SB23_FILES() EXCLUDES the file from [SB-23], which drops it into [SB-92]'s residual as UNCLAIMED and stops the run naming it, and the crosscheck pushes CONTRADICTED for it by name. THE VACUOUS DIRECTION IS THE ONE NOT TAKEN — returning the raw string on no match would hand a whole sentence to existsSync(), which is false for a reason that has nothing to do with the artefact and reads as a real verdict. This capture is also what let adapters/pdf/maps/433h.projection.json be claimed at all: it declared _generated_by where the population read _generator, sat unclaimed from the commit that landed it, and left npm run sweeps red for a whole cycle." },`,
];
lines.splice(i262 + 2, 0, ...NEW);

writeFileSync(P, lines.join('\n'));

// ── assert the patch landed, rather than trusting that it did ────────────────────────────
const after = readFileSync(P, 'utf8');
const must = [
  `anchor: "try { return !!declaredGenerator(JSON.parse(r(p))); } catch { return false; }"`,
  `anchor: "try { gen = declaredGenerator(JSON.parse(r(p))); } catch { gen = null; }"`,
  `id: 'G-289'`,
  `([A-Za-z0-9_./-]+\\\\.mjs)`,
];
const missing = must.filter(m => !after.includes(m));
const gone = [
  `!!(d._generator || d.meta?.generator)`,
  `gen = d._generator || d.meta?.generator || null`,
].filter(m => after.includes(m));
console.log(`patched ${P}: G-262 re-anchored at line ${i262 + 1}, G-289 inserted at ${i262 + 3}, G-243 re-anchored at ${i243 + 3}`);
if (missing.length) { console.error('STOP — expected text absent after patch:'); for (const m of missing) console.error('  ' + JSON.stringify(m)); process.exit(3); }
if (gone.length) { console.error('STOP — old anchor text still present after patch:'); for (const m of gone) console.error('  ' + JSON.stringify(m)); process.exit(4); }
console.log('every expected string present, every replaced string absent.');
