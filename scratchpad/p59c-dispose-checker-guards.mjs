// p59c-dispose-checker-guards.mjs — disposes the three vacuous-guard sites the export checker
// adds. [R-12]: a NEW guard is a change to the guard, and guard-sweep named all three.
//
// PATCHED BY LINE, NOT BY BLOB, and asserted after.
// [R-19] GENERATOR DECLARATION: this file edits adapters/pdf/guard-sweep.mjs in place.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/guard-sweep.mjs';
const lines = readFileSync(P, 'utf8').split('\n');
const F = '../hubspot/check-cf-mirror-export.mjs';

const E = (id, anchor, why) => [
  `  { id: '${id}', file: '${F}', anchor: ${JSON.stringify(anchor)}, verdict: 'sound',`,
  `    why: ${JSON.stringify(why)} },`,
];

const entries = [
  ...E('G-311', 'catch (e) { console.error(`STOP — ${OUT}.json will not parse: ${e.message}`); process.exit(3); }',
    'AN UNREADABLE EXPORT IS A STOP, NOT AN EMPTY DEFAULT, AND THE CATCH IS WHERE IT IS SAID. The JSON is the ONLY input this checker has: every one of its eleven checks is a fact about that file or about a rendering derived from it, so a parse failure means there is nothing to check, and a checker that reported a clean run over nothing is precisely the shape guard-sweep exists to refuse. It exits 3 rather than continuing, and 3 is distinct from the 2 a real disagreement exits with, so a caller can tell "the artefact is broken" from "the artefact disagrees with itself". The three other reads beside it — .md, .csv and .sha256 — cannot reach a vacuous pass either: an absent one is caught by the existsSync loop above, which exits 3 by name before any comparison runs.'),

  ...E('G-312', 'if (!missing.length && !extra.length) say(1, `header carries exactly the ${HEADER_FIELDS.length} declared field(s)`);',
    'BOTH LISTS EMPTY IS SET EQUALITY, NOT AN UNREAD INPUT, AND THIS LINE REPORTS RATHER THAN DECIDES. `want` is HEADER_FIELDS, a literal in this file holding seven names, so it is never empty; `missing` is what want has and got does not, and `extra` the reverse. A header read as {} yields missing = 7 and the line does not fire. A header carrying the seven plus one more yields extra = 1 and it does not fire. The only way both are empty is that the key sets are equal, which is the claim. AND THE VERDICT DOES NOT LIVE HERE: say() appends to the ok[] transcript and nothing else — the two problems.push() calls immediately above are what fail the run, and they fire on exactly the complement of this condition. A vacuous pass would have to make both of those not fire, which is the same set equality.'),

  ...E('G-313', 'if (!tagDiff.length && tagSum === h.record_count)',
    'THE SECOND CONJUNCT IS WHAT STOPS THE VACUOUS DIRECTION, AND IT IS THERE FOR THAT REASON. `tagDiff` alone could go empty by the population going empty: tagKeys is the union of the header’s tag_counts keys and the tags counted off the records, so a header with no tag_counts AND records carrying no prefix_tag would produce an empty union and an empty diff. `tagSum === h.record_count` refuses exactly that case — an empty tag_counts sums to 0, and record_count cannot be 0 because an empty records array is a STOP at the top of this file, before any check runs ([R-04]). So the two conditions together say the partition is disjoint AND total, and neither can be satisfied by an input nobody read. As with [G-312] this line only appends to the transcript; the two problems.push() calls above it are the verdict.'),
];

const i = lines.findIndex((l) => l.includes("{ id: 'G-299', file: 'sweep-boundary.mjs'"));
if (i < 0) { console.error('STOP — could not locate [G-299]. Nothing patched.'); process.exit(2); }
lines.splice(i, 0, ...entries);
writeFileSync(P, lines.join('\n'));

const after = readFileSync(P, 'utf8');
const missing = ['G-311', 'G-312', 'G-313'].filter((x) => !after.includes(`id: '${x}'`));
console.log(`inserted 3 disposition(s) before [G-299] at line ${i + 1}`);
if (missing.length) { console.error(`STOP — absent after patch: ${missing.join(', ')}`); process.exit(3); }
console.log('all three present.');
