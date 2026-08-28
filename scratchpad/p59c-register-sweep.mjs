// p59c-register-sweep.mjs — prompt 59-C: the new runner-derivation sweep is registered with
// the two registers that hold the engine's instruments to account.
//
//   adapters/pdf/blanket-audit.mjs   — the canary register. Its derived signature named the new
//                                      file DETECTOR WITH NO CANARY on the first run after the
//                                      substring scan became a regex scan, which is the register
//                                      working exactly as [R-17] intends.
//   adapters/pdf/register-ids.mjs    — the id register. DERIVATIONS carries [G-301]-[G-307] in
//                                      the `engine` namespace, so those ids cannot be reused by
//                                      another register.
//
// PATCHED BY LINE, NOT BY BLOB, and asserted after.
// [R-19] GENERATOR DECLARATION: this file edits adapters/pdf/blanket-audit.mjs and
//   adapters/pdf/register-ids.mjs in place.
import { readFileSync, writeFileSync } from 'node:fs';

// ── 1. the canary register ──────────────────────────────────────────────────────────────
{
  const P = 'adapters/pdf/blanket-audit.mjs';
  const lines = readFileSync(P, 'utf8').split('\n');
  const at = lines.findIndex((l) => l.includes("'assert-name-sets-imported.mjs': { canary:"));
  if (at < 0) { console.error('STOP — could not locate the register entry to insert beside.'); process.exit(2); }

  const why = [
    "FOUR PLANTED RUNNER SOURCES run through the same classify() the sweep runs over the real runner, each with an asserted problem count, and none drawn from the artefacts.",
    "The three failure directions are the ones that go quiet: an UNREGISTERED PROBE must yield exactly one (a probe nobody claimed is how `overflow 433d` got invented in the first place), a MISSING REQUIRED ANCHOR must yield exactly one (the fix for two of the four sites REMOVED an inference, and a sweep that only looks for probes reads a removal as a clean file — [D-12]'s shape, a canary over the comparator and not the population selector), and an ORPHANED ANCHOR must yield exactly one.",
    "The FOURTH is a conforming source that must yield NOTHING, because a sweep that reported everything would satisfy a failure-only canary and stop the engine on its next run.",
    "PROVED ON ITS FIRST RUN, AND NOT AS A DRILL: the missing-required case expected 1 and got 2, because an absent `required` anchor was reported once as AUTHORITY NOT CONSULTED and again as an orphan. Two counts for one defect, in the direction that INFLATES a problem list, so nothing would have failed and nobody would have looked. The orphan pass is now over probe entries only.",
    "[R-42] IS HELD TWICE HERE. The population is one file named by package.json's regression:closing script, and that the population is not this file's own source is ASSERTED rather than left to prose; and the probe tokens inside the plants are assembled by concatenation, so the literal text the detector matches never appears in the file carrying the plants even if the population is ever widened to the directory.",
  ].join(' ');

  lines.splice(at, 0, `  'assert-runner-derivation.mjs': { canary: ${JSON.stringify(why)} },`);
  writeFileSync(P, lines.join('\n'));
  const after = readFileSync(P, 'utf8');
  if (!after.includes("'assert-runner-derivation.mjs': { canary:")) { console.error('STOP — entry absent after patch.'); process.exit(3); }
  console.log(`ok    canary register entry inserted at line ${at + 1} of ${P}`);
}

// ── 2. the id register ──────────────────────────────────────────────────────────────────
{
  const P = 'adapters/pdf/register-ids.mjs';
  const lines = readFileSync(P, 'utf8').split('\n');

  const impAt = lines.findIndex((l) => l.includes("from './guard-sweep.mjs'"));
  if (impAt < 0) { console.error('STOP — could not locate the guard-sweep import in register-ids.mjs.'); process.exit(4); }
  lines.splice(impAt + 1, 0, "import { DERIVATIONS } from './assert-runner-derivation.mjs';");

  const addAt = lines.findIndex((l) => l.includes("add('guard-sweep.mjs:FIGURES'"));
  if (addAt < 0) { console.error('STOP — could not locate the FIGURES add() line.'); process.exit(5); }
  lines.splice(addAt + 1, 0, "  add('assert-runner-derivation.mjs:DERIVATIONS', 'engine', idsOf('DERIVATIONS', DERIVATIONS));");

  writeFileSync(P, lines.join('\n'));
  const after = readFileSync(P, 'utf8');
  const ok = after.includes("import { DERIVATIONS } from './assert-runner-derivation.mjs';")
    && after.includes("add('assert-runner-derivation.mjs:DERIVATIONS'");
  if (!ok) { console.error('STOP — register-ids.mjs not patched as intended.'); process.exit(6); }
  console.log(`ok    DERIVATIONS registered in the engine namespace in ${P}`);
}
