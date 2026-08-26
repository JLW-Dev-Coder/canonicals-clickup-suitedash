// Appends [R-30], [R-31] and [R-32] to adapters/pdf/RULES.md, before the closing
// "# What is deliberately not in here" section, and asserts what reached disk.
//
// A FILE AND NOT A `node -e`, for the reason recorded in scratchpad/p52-carried-d20.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/RULES.md';
const src = readFileSync(P, 'utf8');
const ANCHOR = '# What is deliberately not in here';
if (!src.includes(ANCHOR)) { console.error(`anchor "${ANCHOR}" not found in ${P}`); process.exit(2); }
for (const id of ['R-30', 'R-31', 'R-32']) if (src.includes(`## [${id}]`)) { console.error(`${id} is already in ${P}`); process.exit(2); }

const BLOCK = `## [R-30] Every finished form's tools are exercised in the full regression

> A finished form's tools are re-run on every full regression, in a mode that writes nothing, so
> a tool broken by a NEIGHBOUR's pass fails on the next run rather than the next time somebody
> needs it.

**The defect that earned it.** \`[D-18]\`'s fourth instance, and it is the fourth that earned this
and not the first three. The three recorded instances were all self-inflicted — a tool broken by
the pass IT precedes — and somebody hits those the next time they run the tool, which is soon.
The fourth was \`derive-names-433boi.mjs\` broken by the **433-B pass, seven prompts later**,
rewriting nine shared property descriptions out from under a \`startsWith\` predicate. Nobody
re-runs a finished form's deriver, so there was no natural moment at which it would surface, and
it was found only because that cycle happened to need the regeneration. That item's own closing
sentence is the argument: *"what the sweep buys is that the population is enumerated and no
member can be added silently; what caught the fourth instance was RUNNING THE TOOL."*

**What it found on its first run**, which is the reason the rule is not merely tidy:
\`adapters/pdf/assert-row-class-routes.mjs\` had been **exiting 2 for two prompts**. It held five
typed \`(form, fixture, engine)\` triples and two of the fixture paths were stale — 433-B(OIC) at
slice 1 when its acceptance record had been slice 3, 433-B at slice 1 when its had been slice 4.
Slice 1 of 433-B(OIC) feeds no rows to six groups later slices bound, so it reported six UNPROVED
groups and a canary yield of 33 against an expected 39. It is in no npm script and in no gate
step, so nothing had run it. It is the exact class \`adapters/pdf/resolve-fixture.mjs\` was written
for — *"a path in a script is a fact nobody re-derives"* — and that file's header names a gate
script and a prompt as the two instances while a third sat one directory away with five more
paths in it.

**Roughly when.** Ruled 2026-08-25, prompt 52 commit 1.
\`adapters/hubspot/rerun-regression.mjs\` holds it, wired into \`npm run sweeps\`.

---

## [R-31] Prefer the structural assertion over the current reading

> Where both are available, run both and say which would have fired first. A check that a row
> **cannot be read by anything** beats a reading of what is true on the portal now, because the
> first is about structure and the second is about a moment.

**The defect that earned it.** \`[D-19]\`'s resolution. \`assert-registry-targets.mjs\` carries five
conditions; \`[RT-1]\` — no generated rival — is OFFLINE, needs no credential and no network, and
found **334 unreadable rows** in \`fields.registry.json\`. \`[RT-5]\` asks the portal whether an
\`hs_name\` is live, and is the tier a reader instinctively trusts more. The item's own sentence is
the ruling: *"a portal read establishes what is true NOW; \`[RT-1]\` establishes that the row
CANNOT BE READ by anything — and it would have fired the day the first generated file landed"*,
three forms and many prompts before anybody read the portal against the registry.

**And the size of the miss is what makes it a rule rather than a preference.** The item that
raised it recorded a figure of seven where the true figure was 334 — a factor of forty-eight —
and the reason is the whole lesson: *the count was of what someone had just looked at*. The other
three forms had been in the identical state for longer and nothing in the tree could have said so.

**Roughly when.** Ruled 2026-08-25 on the prompt-51 report, from \`[D-19]\`'s first-run figures.
Cycle-dated: the commit that lands it is the commit this rule is written in, so it has no hash yet.

---

## [R-32] Headroom is a planning constraint, projected before the first name is derived

> The ceiling is checked before a create and **projected before a classification**. A projection
> that exceeds the headroom is a STOP and a decision for the Principal, never a partial
> provisioning run.

**Attribution: none —** it is a policy, ruled forward rather than earned by a defect, and that is
declared here rather than left as a silence. What it rests on is arithmetic rather than an
incident: the portal held **884 custom contact properties against a documented ceiling of 1,000**
when this was ruled, leaving **116**, and the four provisioned forms cost 186, 239, 116 and 113.
Any one of them would not fit today. The next form to be classified is therefore the first for
which "may I create this name", asked property by property after the crosswalk exists, is the
wrong question at the wrong time — by the time \`[R-23]\`'s A12 speaks, the work of deciding what
the properties ARE is done, and a form that turns out not to fit becomes a partial run against a
portal that will not free a name.

**How the projection is stated, and what it deliberately does not state.** A bound, not a count:
the most a form can cost is one property per distinct leaf **stem**, and the floor is zero. No
single number between the two is printed, because a number between them is an invented reuse
rate — and \`[R-29]\` is the rule that a coinciding subject says which reuses are PERMISSIBLE and
nothing whatever about how many there will be. 433-B and 433-B(OIC) coincide and **nine of 116**
keys reused.

**Roughly when.** Ruled 2026-08-25, prompt 52 commit 1, ahead of 433-D's classification.
\`adapters/hubspot/headroom.mjs\` holds it.

---

`;

writeFileSync(P, src.replace(ANCHOR, BLOCK + ANCHOR));

// ── ASSERT WHAT REACHED DISK ────────────────────────────────────────────────────────────────
const back = readFileSync(P, 'utf8');
const problems = [];
for (const id of ['R-30', 'R-31', 'R-32']) if (!new RegExp(`^## \\[${id}\\] \\S`, 'm').test(back)) problems.push(`${id} did not land as a parseable heading.`);
for (const line of BLOCK.split('\n')) if (line.trim() && !back.includes(line)) problems.push(`LINE LOST  ${line.slice(0, 70)}`);
if (problems.length) { for (const p of problems) console.error(`  ${p}`); process.exit(2); }
console.log(`three rules appended to ${P}; every one of the ${BLOCK.split('\n').filter((l) => l.trim()).length} non-blank lines re-read from disk verbatim.`);
