// The nine vacuous-guard sites slice 4's count-sweep entries added, disposed by name.
//
// Every one is an EXTRACTION — a `.match(...) || []` whose length is compared against a typed
// claim — and the whole question the sweep asks is whether an empty input can make that
// comparison report success. It can, whenever the claim is ALSO zero, and that is the shape
// [G-183] and [G-191] are already disposed under: a zero-row is only readable because a
// POSITIVE CONTROL runs through the same reading in the same derivation. The controls are
// named per site rather than assumed.

import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/guard-sweep.mjs';
const L = readFileSync(P, 'utf8').split('\n');

const at = L.findIndex((l) => l.includes(String.raw`id: "G-196", file: "assert-firing-proofs.mjs"`));
if (at < 0) { console.error('STOP — the [G-196] anchor is not in guard-sweep.mjs.'); process.exit(2); }

const q = (s) => JSON.stringify(s);
const e = (id, anchor, why) => [`  { id: ${q(id)}, file: 'count-sweep.mjs', anchor: ${q(anchor)}, verdict: 'sound',`, `    why: ${q(why)} },`, ''];

const CONTROL = 'THE POSITIVE CONTROL FOR THIS DERIVATION IS [S-47]’s "occurrences of “Total” on pages 5 and 6", claimed 6 and required NON-zero through the same joined text and the same matching. A reading that had gone dead reports 0 against a claimed 6 and takes the run down, which is what makes the zero-rows beside it readable at all. It is the disposition [G-183] and [G-191] already stand on, applied to two new pages.';

const block = [
  ...e('G-201', "rows.push({ what: 'runs matching /Add lines?/ on page 5', claimed: 2, derived: (j5.match(/Add lines?/gi) || []).length,",
    'A REQUIRED-NON-ZERO ROW, so the dead direction is the loud one. Page 5 draws "Add lines" twice — once in each of the 24h and 25c total captions — and the claim is 2. A regex that stopped matching reports 0 and stops the run; there is no empty input that makes this report success. It is also the row that ties the two page-5 totals to captions that SAY what they add, which is what makes them tripwires rather than this engine’s assertions.'),
  ...e('G-202', "rows.push({ what: 'runs matching /Add lines?/ on page 6', claimed: 2, derived: (j6.match(/Add lines?/gi) || []).length,",
    'THE SAME SHAPE ON PAGE 6 AND ALSO REQUIRED NON-ZERO. Lines 36 and 49 each print "Add lines"; line 50 does not, because it is a difference and prints "minus" instead — which is the row below this one. A dead regex reports 0 against a claimed 2 and stops.'),
  ...e('G-203', 'rows.push({ what: \'occurrences of "minus" on page 6\', claimed: 1, derived: (j6.match(/minus/gi) || []).length,',
    'REQUIRED NON-ZERO, AND IT IS THE ONLY EVIDENCE THAT LINE 50 IS A DIFFERENCE. 433-B’s ten other declared totals are sums; line 50 prints "(Line 36 minus Line 49)" and this row is the assertion that the page says so. A dead regex reports 0 against a claimed 1 and stops the run, which is the loud direction, and it is the direction that matters: a difference silently read as a sum would reconcile on a fixture where expenses are zero and on no other.'),
  ...e('G-204', "derived: ((j5 + ' ' + j6).match(/amounts from any attachments/gi) || []).length,",
    'REQUIRED NON-ZERO — claimed 2, and the two are BOTH ON PAGE 5. That is the point of the row rather than an incidental fact: it is what establishes that line 36 is the first printed total on this form whose caption does NOT name the attachment term, and therefore the first one [B-05] does not reach. A dead regex reports 0 against a claimed 2 and stops.'),
  ...e('G-205', "derived: ((j5 + ' ' + j6).match(new RegExp(re.source, 'gi')) || []).length, from: 'both joined pages' });",
    `AN EXTRACTION WHOSE REQUIRED ANSWER IS ZERO — the one shape this sweep cannot judge alone. Three rows run through here, asserting that neither page draws a negative-number instruction or a rounding instruction, which is why no floor and no rounding block is declared for either. ${CONTROL}`),
  ...e('G-206', "derived: ((j5 + ' ' + j6).match(/Total/g) || []).length,",
    'THE POSITIVE CONTROL ITSELF, and its claim was WRONG ON THE FIRST RUN in the same way [G-184]’s and [G-192]’s were. It asserted 8 and derived 6: pages 5 and 6 draw the word "Total" six times — "Total Equity" at 24h, "Total Payments" at 25c, "Total Monthly Business Income", "Total Monthly Business Expenses", "Total Income" at 36 and "Total Expenses" at 49. THE DERIVATION WAS RIGHT AND THE CLAIM WAS WRONG, and the claim was corrected rather than the comparison loosened. It is the answer to "can an empty input make this report success" for [G-205].'),
  ...e('G-207', 'const m = /^p(\\d):(.+)$/.exec(k);',
    'NO MATCH IS A REPORTED FAILURE, NOT A SKIP. The key of each flag-class probe encodes the page and the phrase; a key this pattern cannot read pushes a row carrying `fail`, which count-sweep treats as a problem and which stops the run. It does NOT `continue` past the key silently, which is the state that would let a renamed probe key drop out of the population while the report went on saying every probe agreed.'),
  ...e('G-208', "derived: runs.reduce((n, t) => n + (t.str.toLowerCase().match(new RegExp(esc(m[2]), 'g')) || []).length, 0),",
    `THE FIVE FLAG-CLASS ABSENCES, PER PAGE, AND EVERY REQUIRED ANSWER IS ZERO. This is [G-205]’s shape again and it carries the same control: ${CONTROL} There is a second control specific to this row — the probe expression is built from the map’s OWN probe keys, so a page or phrase that vanished from the map would change the number of rows this loop pushes, and [S-49] compares the row set as well as the values.`),
  ...e('G-209', "derived: (j6.match(/business account/g) || []).length,",
    'REQUIRED NON-ZERO, AND IT IS AN ASSERTION ABOUT A FALSE POSITIVE. The claim is 1: the JOINED page-6 text contains "business account" exactly once, manufactured where the banner ending "for Business" meets the run "Accounting Method Used:", and the per-run probe finds zero. The row exists so that the map’s declared join artefact is checked rather than asserted — a dead regex here reports 0 against a claimed 1 and stops, and a page revision that separated those two runs would also report 0 and stop, which is correct: the declared artefact would have ceased to exist.'),
];
L.splice(at, 0, ...block);

const out = L.join('\n');
writeFileSync(P, out);
const back = readFileSync(P, 'utf8');
const problems = [];
if (back !== out) problems.push('the file on disk is not what this script wrote.');
for (let i = 201; i <= 209; i++) if ((back.split(`id: "G-${i}"`).length - 1) !== 1) problems.push(`G-${i} does not appear exactly once.`);
if (!back.includes('const m = /^p(\\\\d):(.+)$/.exec(k);')) problems.push('the [G-207] anchor did not survive the write with its backslash intact.');
if (problems.length) { problems.forEach((x) => console.error(`STOP — ${x}`)); process.exit(2); }
console.log(`patched ${P}: nine slice-4 count-sweep sites disposed; every anchor read back from disk verbatim.`);
