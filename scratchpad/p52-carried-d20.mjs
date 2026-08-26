// Adds [D-20] to adapters/pdf/maps/_carried.cross-form.json and re-derives _count.
//
// A SCRIPT AND NOT A `node -e`, and the reason is on the record: the first attempt at this edit
// was a `node -e "…"` whose JS string held template literals, and bash ate three backticked
// spans as command substitutions before node ever saw them — `status`, `status` and
// `process.exitCode` were each run as shell commands and replaced with the empty string, and the
// register was written with three sentences silently hollowed out. It was reverted from git.
// That is [R-17]'s class one level out: a patch whose own text is mangled between the author and
// the disk. The repair is the same one that rule prescribes — the patch is a FILE, its output is
// asserted, and nothing is trusted because it looked right in the terminal.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/_carried.cross-form.json';
const c = JSON.parse(readFileSync(P, 'utf8'));

if (c.open.some((x) => x.id === 'D-20') || c.resolved.some((x) => x.id === 'D-20')) {
  console.error('D-20 is already in the register. Refusing to add a second.');
  process.exit(2);
}

const item = {
  id: 'D-20',
  form: 'engine-wide; every portal tool in adapters/hubspot/',
  raised_in: 'Prompt 52 commit 1, by adapters/hubspot/rerun-regression.mjs on its first portal-tier run',
  subject: 'EVERY DECLARED STOP CODE IN EVERY PORTAL TOOL IS LOST. process.exit(n) called after an hs() request ABORTS the process on this node build instead of exiting with n.',
  the_shape: 'hs-fetch-433boi.mjs, run against a live contact, correctly reached its own "REFUSING TO WRITE - 1 problem(s)" and called process.exit(3). What the caller saw was 3221226505 through spawnSync and 127 through a shell, preceded by "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\\win\\async.c, line 76". The declared code never leaves the process. It is NOT a defect in that fetcher: it reproduces in five lines with no fetcher present — import hs, await one request, call process.exit(3) — so the fetcher is only the first tool this cycle happened to drive down a post-portal STOP path.',
  the_measured_population: 'SEVENTY-TWO process.exit() sites across TWENTY-TWO files in adapters/hubspot/, counted by grep over every file importing hs-lib.mjs on 2026-08-25. Not all are post-portal — a usage exit before the first request is safe, and the reproduction needed a completed request — but that split has NOT been measured, and the figure quoted here is the one that has been: 72 is the population an audit would have to walk, not the count of broken sites. Quoting a smaller unmeasured number would be the figure without its universe that [R-07] names.',
  why_it_is_a_problem_today: 'THE SCARY HALF IS NOT THE FETCHERS. hs-provision.mjs, hs-purge-properties.mjs, hs-purge-contacts.mjs and hs-teardown-contact.mjs are permanent or destructive, and each carries post-portal STOP paths whose declared code is what a caller would branch on. A caller testing `status === 2` sees 127 and takes the wrong branch; a caller testing `status !== 0` still catches it, which is why nothing has surfaced. An abort is also not a clean stop — whatever the tool had not flushed is gone — and "it exited non-zero" is a weaker fact than the one the tool was written to state.',
  what_was_proved: 'THE FIX IS KNOWN AND IT WAS MEASURED RATHER THAN GUESSED, WHICH IS WHY THIS ITEM IS SAFE TO CARRY. Candidate A — `process.exitCode = 3` with no process.exit() call — exits with the real code 3 after a natural drain of 382 ms. Candidate B — close the global undici dispatcher and then call process.exit(3) — STILL ABORTS, so the obvious repair is the wrong one and an unmeasured fix would have shipped it. A third shape also works and preserves the halting semantics the call sites rely on: set process.exitCode, throw a sentinel, and swallow only that sentinel in an unhandledRejection handler.',
  the_ruling: 'REPORTED IN FULL AND NOT RESOLVED, under [R-20], and the reason is [R-12]. Repairing only the five fetchers — the population this prompt’s ruling 3 puts in scope — would be a class repaired on one tool kind and left on five others, which is exactly the reproduction [R-12] says to expect and which [D-18] records happening. Repairing all 72 means changing the control flow of every destructive portal tool in the same cycle that sizes a provisioning run for 433-D, which is the adjacent change that has twice reproduced the defect class it was meant to close.',
  what_stands_in_the_meantime: 'adapters/hubspot/rerun-regression.mjs NAMES IT ON EVERY RUN: any child whose output carries UV_HANDLE_CLOSING is reported under [D-20] with the code the caller actually saw, and that run’s verdict is read from the tool’s own OUTPUT rather than from its exit code. So the fact cannot go quiet between now and the repair, and no verdict in this engine currently rests on a lost code.',
  built_when: 'Not built. To be decided BEFORE the next provisioning run — 433-D — because that run drives hs-provision.mjs and a new hs-dryrun-433d.mjs down exactly these paths, and a partial provisioning run that reports the wrong reason for stopping is the one outcome a portal that will not free a name cannot absorb.',
  status: 'OPEN',
};

c.open.push(item);
c._count = { open: c.open.length, resolved: c.resolved.length };
writeFileSync(P, JSON.stringify(c, null, 1) + '\n');

// ── THE PATCH ASSERTS ITS OWN OUTPUT [R-12], [R-17] ──────────────────────────────────────────
const back = JSON.parse(readFileSync(P, 'utf8'));
const landed = back.open.find((x) => x.id === 'D-20');
const problems = [];
if (!landed) problems.push('D-20 is not in the file that was just written.');
else {
  for (const [k, v] of Object.entries(item)) {
    if (landed[k] !== v) problems.push(`FIELD MANGLED  ${k}: what reached disk is not what this script holds.`);
    if (typeof v === 'string' && /^\s*$/.test(v)) problems.push(`FIELD EMPTY  ${k} is blank, which is the exact damage the reverted node -e attempt did.`);
  }
}
if (back._count.open !== back.open.length || back._count.resolved !== back.resolved.length) problems.push('_count does not re-derive from the arrays it counts.');
if (problems.length) { for (const p of problems) console.error(`  ${p}`); process.exit(2); }
console.log(`D-20 landed in ${P}: open ${back._count.open}, resolved ${back._count.resolved}; every one of its ${Object.keys(item).length} fields re-read from disk and byte-equal to what this script wrote.`);
