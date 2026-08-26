// Appends [R-33] — prompt 52's ruling 1 — to adapters/pdf/RULES.md and asserts what landed.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/RULES.md';
const src = readFileSync(P, 'utf8');
const ANCHOR = '# What is deliberately not in here';
if (!src.includes(ANCHOR)) { console.error('anchor not found'); process.exit(2); }
if (src.includes('## [R-33]')) { console.error('R-33 is already in the file'); process.exit(2); }

const BLOCK = `## [R-33] When a scope line and a ruling conflict, the ruling governs

> A prompt's scope line and a prompt's own rulings can disagree. When they do, **the ruling
> governs**, the wider action is taken only where it has been established to be safe, and the
> conflict is reported back as a **prompt defect**. \`[R-03]\` is the same collision against a
> standing guard and resolves the same way; this is the collision INSIDE one document.

**The defect that earned it — three occurrences, each quotable.**

**One.** The prompt that landed 433-B slice 1 required in its §4 that *"all five forms pass their
gates"* while its scope line excluded the artefacts that makes possible — no fill engine, no
fixtures, an empty crosswalk. That instance is \`[R-03]\`, and it is listed here too because it is
the same shape seen from the other side: there the ruling collided with a GUARD, here with the
document's own scope sentence.

**Two.** Prompt 51's scope line described one form's expectation; its ruling text required every
declared line on **every mapped form** to be proved to refuse a wrong value. The ruling was
followed: **130 lines were proved, not 52**. Had the scope line governed, 433-A(OIC) would have
stayed at **0 of 51** while the report recorded a stated expectation met — which is the wrong
shape of obedience, and is the reason this is a rule rather than a judgement call.

**Three.** Prompt 52 — the one that ruled this — states in its own scope line that 433-D's
crosswalk and provisioning are *"not in this prompt"*, and then requires in its §5 report a
figure derived from them: *"433-D's expected new-property count and what it leaves"*. The ruling
governed, and what was reported was the strongest thing the scope permits: an **upper bound over
distinct leaf stems with a floor of zero**, with the classification-time count named as still
owed. A count reported where only a bound is available would have been the invented figure
\`[R-07]\` and \`[R-29]\` each name from a different side.

**Why the ruling and not the scope line.** A scope line is a plan for the work and a ruling is a
statement about what makes the work correct. When the two disagree, one of them is describing an
engine that does not exist. The wider action is not automatic, though: it is taken **only where
it has been established to be safe**, and where it has not, the conflict is reported and nothing
is guessed.

**Roughly when.** Ruled 2026-08-25, prompt 52 ruling 1. Cycle-dated: the commit that lands it is
the commit this rule is written in, so it has no hash yet.

---

`;

writeFileSync(P, src.replace(ANCHOR, BLOCK + ANCHOR));
const back = readFileSync(P, 'utf8');
const problems = [];
if (!/^## \[R-33\] \S/m.test(back)) problems.push('R-33 did not land as a parseable heading.');
for (const line of BLOCK.split('\n')) if (line.trim() && !back.includes(line)) problems.push(`LINE LOST  ${line.slice(0, 70)}`);
if (problems.length) { for (const p of problems) console.error(`  ${p}`); process.exit(2); }
console.log(`[R-33] appended to ${P}; all ${BLOCK.split('\n').filter((l) => l.trim()).length} non-blank lines re-read verbatim.`);
