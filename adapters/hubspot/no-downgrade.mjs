// DOWNGRADING A LANDED ARTEFACT IS AN EXPLICIT ACT, NEVER THE DEFAULT OF A MISSING FLAG.
//
// Used by adapters/hubspot/derive-names-433aoi.mjs and derive-names-433boi.mjs, which both
// write a naming-derivation report whose CONTENT depends on whether `--portal` was passed.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — TWICE, ON THE SAME TOOL, WITH THE SAME MISSING FLAG
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `derive-names-433aoi.mjs` and `derive-names-433boi.mjs` each write their whole report from
// scratch on every run. With `--portal` the report records what the live portal actually holds:
// which derived names already exist, which twin facts are live on the backbone, and a per-row
// verdict for every key. Without it, every one of those rows is written as `portal not read`
// and the assertion section says the portal checks were not run.
//
// Both of those are TRUE reports of the run that produced them. The defect is that the second
// one silently REPLACES the first. A run without the flag is not a run that found the portal
// unreadable — it is a run that did not look — and it overwrites 238 rows of live verdicts
// (433-A(OIC), the first occurrence) or 113 (433-B(OIC), the second) with a row that says
// nothing. Nothing errors. The file's own header still reads like a derivation report. The next
// reader sees `portal not read` beside every key and has no way to tell that the answer was
// once known and was thrown away by a command line that forgot four characters.
//
// TWICE IS THE ARGUMENT. The first occurrence was repaired by re-running with the flag, which
// fixes the file and leaves the mechanism exactly as it was — so the second occurrence was not
// a relapse, it was the same defect still standing. What is registered here is the mechanism:
// a portal-verified report cannot be replaced by a not-run one unless the operator says so in
// the command line, in as many words.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IT WILL AND WILL NOT REFUSE — THE DIRECTION IS THE WHOLE POINT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   verified -> verified    fine. A fresh portal read replacing an older one.
//   not-run  -> verified    fine, and the direction this tool is FOR. An upgrade.
//   not-run  -> not-run     fine. Nothing is lost.
//   verified -> not-run     REFUSED, unless `--downgrade` is on the command line.
//   absent   -> anything    fine. There is nothing to lose; reported as a first write.
//
// `--downgrade` is not a force flag for a stuck run. It is the operator stating that discarding
// this file's live verdicts is the intended outcome, and the run prints what is being discarded
// before it does it.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// HOW AN EXISTING FILE IS CLASSIFIED — TWO READINGS, BOTH DECLARED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   stamped   the file carries the machine-readable stamp this module writes. The stamp is
//             read and believed. Every file written from this commit onward is stamped.
//
//   legacy    the file predates the stamp — both landed reports do — and is classified from
//             the prose the writers emit: the "not run: pass `--portal`" sentence marks a
//             not-run report, and the "already exist on the portal" sentence marks a verified
//             one. Both are lines the writers produce unconditionally in their own branch, so
//             this is reading the writer's own output rather than guessing at prose.
//
//   neither   UNCLASSIFIABLE, and a STOP. A file this module cannot read is not a file it may
//             overwrite: "I could not tell what this was" and "there was nothing to lose" must
//             never take the same path. That is the shape every dead guard in this repo had.

import { readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { rx } from '../pdf/regex-self-assert.mjs';

export const STAMP_PREFIX = '<!-- portal_read:';

/** The stamp a writer emits. `verified` is the run's own answer, not a re-reading of the file. */
export const stampFor = (verified, detail) =>
  `${STAMP_PREFIX} ${verified ? 'yes' : 'no'} — ${detail} -->`;

// The two prose sentences the writers emit, one per branch. Legacy classification reads these,
// and both self-assert at load: an eaten `\(` here turns a literal paren into a group and the
// sentence starts matching text it was not written for, which would classify a not-run report
// as verified and then refuse every legitimate write.
const LEGACY_NOT_RUN = rx('RX-ND-01', /^- Portal checks \([^)]*\) not run: pass `--portal`\.$/m, {
  why: 'the sentence derive-names-*.mjs emits in its no-portal branch, which marks a legacy report as not-run',
  matches: ['x\n- Portal checks (A7, A12) not run: pass `--portal`.\ny', '- Portal checks (A7, A8) not run: pass `--portal`.'],
  rejects: ['- Portal checks A7, A12 not run: pass `--portal`.', '  - Portal checks (A7) not run: pass `--portal`.', '- Portal checks (A7) not run: pass `--portal`!'],
});
const LEGACY_VERIFIED = rx('RX-ND-02', /^- \d+ derived name\(s\) already exist on the portal/m, {
  why: 'the sentence the same writers emit in their --portal branch, which marks a legacy report as portal-verified',
  matches: ['x\n- 113 derived name(s) already exist on the portal.\ny', '- 0 derived name(s) already exist on the portal, and every one is claimed'],
  rejects: ['- d derived name(s) already exist on the portal.', '- 113 derived names already exist on the portal.', 'x - 113 derived name(s) already exist on the portal.'],
});

/**
 * What is on disk right now: 'absent', 'verified', 'not-run', or 'unclassifiable'.
 * `how` names which of the two readings reached the verdict, so a report can say so.
 */
export const classify = (path) => {
  if (!existsSync(path)) return { state: 'absent', how: 'no file at that path' };
  let text;
  try { text = readFileSync(path, 'utf8'); }
  catch (e) { return { state: 'unclassifiable', how: `unreadable — ${e.message}` }; }

  // EVERY STAMP LINE, NOT THE FIRST. This was `.find(...)`, which reads the first stamp in the
  // document and cannot see a second. A report carrying two — a `yes` left standing above a `no`
  // from a later partial run, or two runs concatenated — would classify on whichever came first,
  // and first-wins is a guess. The paragraph below already refuses exactly that guess for the two
  // LEGACY prose sentences ("guessing which half to believe is exactly the judgement this module
  // exists to refuse") and did not apply it to this module's own stamp. Found by enumerating the
  // class after the same shape was fixed in adapters/pdf/assert-overflow.mjs, not by tripping on it.
  const stampLines = text.split(/\r?\n/).filter((l) => l.startsWith(STAMP_PREFIX));
  if (stampLines.length > 1) return { state: 'unclassifiable', how: `${stampLines.length} stamp lines, and a document with more than one stamp does not have a stamp: ${JSON.stringify(stampLines)}` };
  const stampLine = stampLines[0];
  if (stampLine) {
    if (stampLine.startsWith(`${STAMP_PREFIX} yes`)) return { state: 'verified', how: 'stamp', detail: stampLine };
    if (stampLine.startsWith(`${STAMP_PREFIX} no`)) return { state: 'not-run', how: 'stamp', detail: stampLine };
    return { state: 'unclassifiable', how: `a stamp line that is neither yes nor no: ${stampLine}` };
  }

  const notRun = LEGACY_NOT_RUN.test(text);
  const verified = LEGACY_VERIFIED.test(text);
  // Both at once is not a state either writer can produce, and guessing which half to believe
  // is exactly the judgement this module exists to refuse.
  if (notRun && verified) return { state: 'unclassifiable', how: 'legacy prose carries BOTH the not-run sentence and the verified sentence' };
  if (verified) return { state: 'verified', how: 'legacy prose — the "already exist on the portal" sentence' };
  if (notRun) return { state: 'not-run', how: 'legacy prose — the "not run: pass `--portal`" sentence' };
  return { state: 'unclassifiable', how: 'neither the stamp nor either legacy sentence is present' };
};

/**
 * Called by a writer immediately before it writes. Returns the lines to print; THROWS on a
 * refused downgrade and on an unclassifiable existing file.
 *
 * `wouldVerify` is the RUN's own answer — whether this run read the portal — and never a
 * re-reading of the file about to be replaced.
 */
export const refuseDowngrade = ({ path, wouldVerify, argv = process.argv, label = path }) => {
  const explicit = argv.includes('--downgrade');
  const cur = classify(path);
  const lines = [`landed artefact: ${label} is ${cur.state} (${cur.how})`];

  if (cur.state === 'unclassifiable')
    throw new Error(
      `REFUSING TO OVERWRITE — ${label} is on disk and this module cannot tell whether it records a portal-verified run.\n` +
      `  ${cur.how}\n` +
      '  "I could not read it" and "there was nothing to lose" must not take the same path. Look at the file, or pass --downgrade to overwrite it deliberately.');

  if (cur.state === 'verified' && !wouldVerify) {
    if (!explicit)
      throw new Error(
        `REFUSING TO DOWNGRADE — ${label} records a portal-verified run and this run did not read the portal.\n` +
        `  ${cur.detail ? `${cur.detail}\n  ` : ''}Writing now would replace every live verdict in it with "portal not read", which is what happened to 433-A(OIC) (238 rows) and then to 433-B(OIC) (113 rows).\n` +
        '  This run did not look at the portal; it did not find it empty. Re-run with `--portal`, or pass `--downgrade` to discard those verdicts on purpose.');
    lines.push(`  DOWNGRADING ON PURPOSE — --downgrade was passed. The live verdicts in ${label} are being replaced with "portal not read".`);
    return lines;
  }

  if (cur.state === 'not-run' && wouldVerify) lines.push('  upgrading: a not-run report is being replaced by a portal-verified one');
  else if (cur.state === 'absent') lines.push('  first write: nothing on disk to lose');
  else lines.push(`  no downgrade: ${cur.state} -> ${wouldVerify ? 'verified' : 'not-run'}`);
  if (explicit && !(cur.state === 'verified' && !wouldVerify))
    lines.push('  --downgrade was passed and was not needed; no verdicts were at risk on this run.');
  return lines;
};

// ---------------------------------------------------------------------------------------
// THE CANARY — every detector carries one.
//
// Driven through the SAME refuseDowngrade the writers call, over synthetic files written to a
// scratch path and removed afterwards, with their absence verified. Five directions, and the
// four permitted ones matter as much as the refused one: a guard that refused every write would
// pass a refusal-only canary and stop the tool from ever producing a report.
// ---------------------------------------------------------------------------------------
export const canary = () => {
  const p = 'adapters/hubspot/tmp-no-downgrade-canary.md';
  const misses = [];
  const run = (label, contents, wouldVerify, argv, expectThrow) => {
    if (contents === null) { try { rmSync(p); } catch { /* absent is the case under test */ } }
    else writeFileSync(p, contents);
    let threw = null;
    try { refuseDowngrade({ path: p, wouldVerify, argv, label }); } catch (e) { threw = e.message; }
    if (expectThrow && !threw) misses.push(`${label}: permitted a write it must refuse`);
    if (!expectThrow && threw) misses.push(`${label}: refused a write it must permit — ${threw.split('\n')[0]}`);
  };
  const VERIFIED = `${stampFor(true, '113 live')}\n`;
  const NOTRUN = `${stampFor(false, 'portal not read')}\n`;
  const LEGACY_V = '- 113 derived name(s) already exist on the portal.\n';
  const LEGACY_N = '- Portal checks (A7, A12) not run: pass `--portal`.\n';

  run('verified -> not-run, no flag', VERIFIED, false, [], true);
  run('verified -> not-run, --downgrade', VERIFIED, false, ['--downgrade'], false);
  run('verified -> verified', VERIFIED, true, [], false);
  run('not-run -> not-run', NOTRUN, false, [], false);
  run('not-run -> verified', NOTRUN, true, [], false);
  run('absent -> not-run', null, false, [], false);
  run('legacy verified -> not-run, no flag', LEGACY_V, false, [], true);
  run('legacy not-run -> not-run', LEGACY_N, false, [], false);
  run('unclassifiable -> anything', '# a report with neither marker\n', true, [], true);

  try { rmSync(p); } catch { /* already gone */ }
  const left = existsSync(p);
  if (left) misses.push('the canary left its synthetic file behind; teardown is not verified');
  return { planted: 9, misses, torn_down: !left };
};

if (process.argv[1] && /no-downgrade\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const c = canary();
  console.log(`no-downgrade canary: ${c.planted} planted direction(s), ${c.misses.length} miss(es), synthetic file torn down: ${c.torn_down}`);
  for (const m of c.misses) console.log(`  ${m}`);
  for (const f of ['adapters/hubspot/433aoi.naming-derivation.md', 'adapters/hubspot/433boi.naming-derivation.md']) {
    const c2 = classify(f);
    console.log(`  ${f} -> ${c2.state} (${c2.how})`);
  }
  process.exit(c.misses.length || !c.torn_down ? 2 : 0);
}
