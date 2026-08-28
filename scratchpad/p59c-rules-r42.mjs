// p59c-rules-r42.mjs — prompt 59-C step 2/3: add [R-42] (canary population) and renumber the
// name-set rule to [R-43].
//
// WHY A RENUMBER RATHER THAN R-43 FOR THE NEW RULE. The prompt names R-42 for the canary rule
// explicitly and twice. It was written against HEAD, where R-41 is the last rule and R-42 is
// free; the name-set rule took R-42 in work that is staged and NOT committed, so no history
// depends on that number. The Owner's explicit id wins and the collision is RECORDED here
// rather than silently resolved, which is [R-41]'s own dating paragraph doing the same thing.
//
// PATCHED BY LINE, NOT BY BLOB, and asserted after.
// [R-19] GENERATOR DECLARATION: this file edits adapters/pdf/RULES.md in place.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/RULES.md';
const lines = readFileSync(P, 'utf8').split('\n');

const OLD = '## [R-42] A name set has one home, and every other reader imports it';
const NEW = '## [R-43] A name set has one home, and every other reader imports it';
const i = lines.indexOf(OLD);
if (i < 0) { console.error(`STOP — could not locate the R-42 heading verbatim. Nothing patched.`); process.exit(2); }
lines[i] = NEW;

// Its dating paragraph records the renumber, for the same reason [R-41]'s does.
const dateLine = lines.findIndex((l, n) => n > i && l.startsWith('**Roughly when.** Ruled 2026-08-27, prompt 59-A item H.'));
if (dateLine < 0) { console.error('STOP — could not locate the name-set rule dating paragraph.'); process.exit(3); }
lines[dateLine] = '**Roughly when.** Ruled 2026-08-27, prompt 59-A item H. IT WAS WRITTEN AS R-42 AND IS R-43:';
lines.splice(dateLine + 1, 0,
  'prompt 59-C names R-42 for the canary-population rule above, explicitly, and it was written',
  'against a tree where R-42 was free. This rule had taken that id in work that was staged and',
  'never committed, so nothing in the history depends on it. The renumber is recorded rather',
  'than made quietly, which is what `[R-41]`’s dating paragraph did with the same hazard in the',
  'other direction. Cycle-dated: the commit that lands it is the commit this rule is written',
  'in, so it has no hash yet.');
// The old tail of that paragraph continued onto the following lines; drop the stale remainder.
let k = dateLine + 7;
while (k < lines.length && lines[k].trim() !== '' && !lines[k].startsWith('---')) {
  if (lines[k].startsWith('the commit that lands it') || lines[k].startsWith('prompt proposed') || lines[k].includes('so it has no hash yet.')) { lines.splice(k, 1); continue; }
  break;
}

const R42 = `## [R-42] A canary must not enter the population it guards

> A canary is a fixed input with an asserted expected yield, and it must not become part of the
> population its own detector sweeps. Its planted content is ASSEMBLED — concatenated, or built
> at run time — so the detector's own pattern never appears literally in the source carrying it.
> A canary the sweep can see is a canary that changes the answer it was written to check.

**The defect that earned it.** \`adapters/pdf/assert-name-sets-imported.mjs\` sweeps the tree for
an exported set of string literals that some other file retypes instead of importing. Its canary
plants five synthetic sources, and one of them has to DECLARE a set. The first draft wrote that
plant as a literal inside the sweep's own source. The sweep reads the \`.mjs\` files under
\`adapters/pdf\`, so it read itself, matched its own canary text with its own declaration regex,
and reported **52 declarations in a tree holding 51**. The canary had joined the population it
was a canary for, and the over-count was in the direction that looks like thoroughness. The fix
is to assemble the plant by concatenation so the literal never appears in the file.

**It is not a special case of the sweep that met it.** \`[R-17]\` requires that every detector
carry a canary and that the canary not be drawn from the artefacts. This is the other direction:
the artefacts must not be able to draw the canary. Every canary is content placed somewhere
something reads, so the hazard belongs to all of them and not to the one that surfaced it —
which is why it is ruled rather than fixed in place and forgotten.

**What it does not say.** It does not say a canary must live outside the tree. A canary held in
the file it guards is fine and is usually right, because a canary in a separate fixture is one
more path to go stale. What it forbids is the canary being MATCHABLE by the detector — the
distinction is between where the bytes live and whether the pattern is present in them.

**Where it is enforced.** \`adapters/pdf/blanket-audit.mjs\` holds the canary register, one entry
per detector, and a detector added without a canary stops a run. That register cites this rule,
so the next canary is built against it rather than rediscovering it at a wrong count.

**Roughly when.** Ruled 2026-08-27, prompt 59-C item 3. Cycle-dated: the commit that lands it is
the commit this rule is written in, so it has no hash yet.

---
`.split('\n');

lines.splice(i, 0, ...R42);
writeFileSync(P, lines.join('\n'));

const after = readFileSync(P, 'utf8');
const checks = [
  ['R-42 heading', after.includes('## [R-42] A canary must not enter the population it guards')],
  ['R-43 heading', after.includes(NEW)],
  ['no stale R-42 name-set heading', !after.includes(OLD)],
  ['R-42 appears once', (after.match(/^## \[R-42\]/gm) || []).length === 1],
  ['R-43 appears once', (after.match(/^## \[R-43\]/gm) || []).length === 1],
];
for (const [what, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}`);
if (checks.some(([, ok]) => !ok)) process.exit(4);
console.log('RULES.md patched.');
