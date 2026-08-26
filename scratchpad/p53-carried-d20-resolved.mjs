// Move [D-20] from open to resolved, keeping what it got right verbatim ([R-21]), and record
// the two things this cycle's repair learned that the item could not have known.
//
//   node scratchpad/p53-carried-d20-resolved.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/_carried.cross-form.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));

const i = doc.open.findIndex((x) => x.id === 'D-20');
if (i < 0) throw new Error('[D-20] is not in doc.open — nothing to resolve.');
const item = doc.open[i];

// [R-21]: a superseded finding is kept VERBATIM with what it got right and what it got wrong.
// Nothing above `status` is edited; the resolution is added beside it.
item.status = 'RESOLVED';
item.resolved_in = 'Prompt 53 commit 1';

item.what_this_item_got_RIGHT = 'THE FIX IT NAMED IS THE FIX THAT SHIPPED, AND THE ONE IT WARNED AGAINST IS STILL WRONG. Candidate A (process.exitCode with no exit() call) delivers the real code; candidate B (close the dispatcher, then exit) still aborts, re-measured this cycle. The third shape it described — set process.exitCode, throw a sentinel, swallow only that sentinel — is exactly what hs-lib.mjs now exports as stop(), and the reason it is the third rather than the first is the reason the item gave: candidate A is an ASSIGNMENT and the call sites need a JUMP. Its instinct about scope was right too. Repairing the five fetchers would have left the class on the four destructive tools, and the repair pass found 74 call sites where a grep of the same directory had counted 72.';

item.what_this_item_got_WRONG = 'THE TRIGGER IS A REQUEST WITH A BODY, NOT A REQUEST. The item says the abort "reproduces in five lines with no fetcher present — import hs, await one request, call process.exit(3)". Those five lines, run fifteen times against a live GET this cycle, exited 3 every time. A GET does not abort. A POST carrying two property names aborts on every run, and so does a POST carrying 113; it is the method with a body, not the volume. hs-fetch-433boi.mjs was the tool it surfaced on because 113 property names do not fit in a querystring, so that fetcher READS BY POST — which the item read as "a fetcher happened to be first" when the real reading is that only a body-bearing request could have shown it at all. It matters, and not as a footnote: it means the defect lived ON THE WRITE PATHS AND NOWHERE ELSE, so the four tools the item correctly called the scary half were not merely the worst case, they were close to the whole case, and no read-only tool could ever have demonstrated it. adapters/hubspot/assert-exit-codes.mjs now plants both children with the same POST so the difference between them is only the halt.';

item.the_population_as_derived = 'SEVENTY-FOUR CALL SITES ACROSS TWENTY-NINE FILES, derived by a mask that separates code from comment and string rather than by a grep. The item quoted 72 across 22 files, measured 2026-08-25; the difference is not drift in one direction. Two files carrying six sites (headroom.mjs, rerun-regression.mjs) landed in the same commit that raised this item, and four of the raw grep\'s hits are PROSE OR DATA that must not be touched: hs-deprecate-property.mjs and hs-teardown-contact.mjs each QUOTE process.exit in a header recording the time a dry-run exit was replaced by something that did not jump, and rerun-regression.mjs WRITES the string "process.exit(3);" into a synthetic canary child that must keep exiting the old way, because it is what proves that harness can see a non-zero code at all. A repair that edited those four would have broken the canary and erased two records of a defect.';

item.the_second_defect_the_repair_created_and_what_caught_it = 'THE REPAIR MADE THE HALT INTERCEPTABLE, WHICH process.exit() NEVER WAS. hs() resolves its key through a DEFAULT PARAMETER, so a missing credential now raises a StopSignal from INSIDE `try { await hs(...) } catch (e) { tier = "(not read)"; }` — seven such catches in this directory. Without a re-throw, "no credential, halt" becomes "tier not read, carry on". All 33 catch sites therefore lead with `if (isStop(e)) throw e;`, in BOTH syntactic forms: the catch BLOCK, and the promise `.catch((e) => {` handler that a block-shaped inspection walks straight past — which sat on exactly the two tools whose exit code is a COMPUTED value rather than a constant. [XC-2] and [XC-3] assert both forms structurally. AND THE FIRST DRAFT OF stop() ITSELF REPRODUCED [D-20]: its non-sentinel branch removed its own listener and RE-THREW so node would print the stack, and re-throwing from inside an uncaughtException handler runs node\'s internal fatal path, which aborts — 127, UV_HANDLE_CLOSING, the exact defect, inside the function repairing it. Measured, not reasoned about. The branch now prints and sets a code and does not re-throw.';

item.what_it_broke_one_directory_away = 'adapters/pdf/assert-examined.mjs DERIVES ITS POPULATION with the signature "can stop a run AND is scoped to a form", and the first half was `/process\\.exit(Code)?\\b/`. Replacing 74 call sites with stop() silently removed three files from that population — assert-registry-targets.mjs, hs-verify-provision.mjs and headroom.mjs — which the register then reported as STALE ENTRY, entries standing over nothing, while the files were exactly the guards they had been the day before. A guard repaired in one directory narrowed a different guard\'s universe in another, which is [R-12] happening rather than being feared, and the only reason anything said so is that assert-examined.mjs checks its register in BOTH directions. Its signature now carries the stop() spelling, with the correction written into the clause.';

item.what_stands_now = 'adapters/hubspot/assert-exit-codes.mjs, wired into `npm run sweeps`. It holds the structural half — ZERO process.exit( call sites in the population, every catch re-throwing, the one named exclusion\'s ground derived, and no tool scheduling independent work — plus five offline canaries and, under --portal, two live ones. The second live canary is the point: it plants the OLD shape after the same POST and REQUIRES IT TO STILL ABORT, so a green run cannot be read as "the repair works" when it might mean "the defect went away and this file now proves nothing". Its population selector is canaried in both directions too, having over-recruited by reading its own prose as an import and then under-recruited to a single file when the fix blanked the string literals import paths live in — printing OK over an empty set, which is [R-04] arriving inside the file whose job is to refuse it.';

item.built_when = 'Built and proved 2026-08-26, prompt 53 commit 1, in the cycle BEFORE 433-D\'s provisioning, which is what the item asked for. Proved on the tool that raised it: hs-fetch-433boi.mjs against contact 242583933723 reported 127 through a shell and 3221226505 through spawnSync before, and 3 through both after, with no libuv abort in either.';

doc.open.splice(i, 1);
doc.resolved.push(item);
doc._count = { open: doc.open.length, resolved: doc.resolved.length };

writeFileSync(P, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`[D-20] resolved. open=${doc._count.open} resolved=${doc._count.resolved}`);

// Assert on disk rather than trusting the write ([R-17]'s discipline applied to a JSON patch).
const back = JSON.parse(readFileSync(P, 'utf8'));
const problems = [];
if (back.open.some((x) => x.id === 'D-20')) problems.push('[D-20] is still in open');
const r = back.resolved.find((x) => x.id === 'D-20');
if (!r) problems.push('[D-20] is not in resolved');
else {
  if (r.status !== 'RESOLVED') problems.push(`status reads ${JSON.stringify(r.status)}`);
  for (const k of ['what_this_item_got_RIGHT', 'what_this_item_got_WRONG', 'the_population_as_derived', 'what_stands_now'])
    if (!r[k]) problems.push(`missing ${k}`);
  if (!r.subject || !r.the_shape) problems.push('the original finding was not kept verbatim — [R-21]');
}
if (back._count.open !== back.open.length || back._count.resolved !== back.resolved.length) problems.push('_count disagrees with the arrays it counts');
if (problems.length) { problems.forEach((p) => console.error(`  STOP ${p}`)); process.exitCode = 2; }
else console.log('on-disk assertion: [D-20] is resolved, the original finding is intact, and _count re-derives.');
