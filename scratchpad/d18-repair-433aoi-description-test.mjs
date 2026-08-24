// [D-18], THE SAME LATENT DEFECT ON THE THIRD DERIVER — AND THE FILE WITH CRLF LINE ENDINGS.
//
//   node scratchpad/d18-repair-433aoi-description-test.mjs
//
// derive-names-433boi.mjs was BROKEN by the 433-B pass re-describing shared properties.
// derive-names-433b.mjs carries the identical predicate and is not broken yet only because A7
// returns on every reuse row before reaching it. derive-names-433aoi.mjs carries it too, and
// nothing has re-described an irs433aoi_ property yet. A class repaired on two forms and left
// on the third is the reproduction [R-12] says to expect, so all three move in one commit.
//
// TWO THINGS THIS SCRIPT HAD TO LEARN, AND BOTH ARE RECORDED BECAUSE BOTH FAILED FIRST:
//
//   1. THIS FILE IS CRLF AND ITS TWO NEIGHBOURS ARE LF. A patcher splitting on '\n' leaves a
//      trailing carriage return on every line, so an anchor that is byte-identical to what the
//      file prints matches NOTHING. It reported 0 matches and stopped, which is the only reason
//      it is not a silent no-op — the anchor count is asserted, never assumed.
//   2. THE ANCHOR CARRIES BACKTICKS. Written through a shell double-quoted `node -e`, those
//      backticks are command substitution and bash rewrote the anchor to
//      `.startsWith();` before node ever saw it. The anchor is authored in a FILE, and the
//      count assertion is what turned that into a STOP rather than a patch of the wrong line.

import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'adapters/hubspot/derive-names-433aoi.mjs';
const raw = readFileSync(PATH, 'utf8');
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
console.log(`${PATH}: line ending ${JSON.stringify(EOL)}`);

const PATCHES = [
  {
    from: "  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').startsWith(`433-A(OIC) (input key: ${d.key})`);",
    to: [
      '  // NAMES THIS FORM AND THIS KEY, not BEGINS WITH them. [D-18]: the 433-B pass rewrote nine',
      '  // reused descriptions to name two forms, and this exact predicate on the 433-B(OIC) deriver',
      '  // went false on four of them and STOPped that tool at [A7]. Nothing has re-described an',
      '  // irs433aoi_ property yet; when something does, this line is where it would have broken.',
      '  // Repaired in the same commit as its two neighbours, because a class fixed on two forms',
      '  // and left on the third is the reproduction [R-12] says to expect.',
      "  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').includes(`433-A(OIC) (input key: ${d.key})`);",
    ],
  },
  {
    from: "  if ((l.description || '').startsWith('433-A(OIC) (input key: ' + d.key + ')')) return 'created by this pass';",
    to: [
      "  // The same reading as A7's, for the same reason.",
      "  if ((l.description || '').includes('433-A(OIC) (input key: ' + d.key + ')')) return 'created by this pass';",
    ],
  },
];

let lines = raw.split(EOL);
for (const p of PATCHES) {
  const at = [];
  lines.forEach((l, i) => { if (l === p.from) at.push(i); });
  if (at.length !== 1) {
    console.error(`STOP — the anchor matched ${at.length} line(s), not one. A patch that cannot say which line it replaces replaces nothing.`);
    console.error(`  ${p.from}`);
    process.exit(2);
  }
  lines = [...lines.slice(0, at[0]), ...p.to, ...lines.slice(at[0] + 1)];
  console.log(`  patched line ${at[0] + 1} — 1 line -> ${p.to.length}`);
}
writeFileSync(PATH, lines.join(EOL));
console.log(`written back with ${JSON.stringify(EOL)} preserved.`);
