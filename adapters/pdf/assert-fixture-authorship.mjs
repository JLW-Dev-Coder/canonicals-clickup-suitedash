// A `_generated_by` CLAIM IS ASSERTED BY REGENERATING AND COMPARING — RULING 7.
//
//   node adapters/pdf/assert-fixture-authorship.mjs [--verbose]
//   exit 0 = every fixture that names a generator is reproduced by it, or declares the
//            co-authorship with every hand-added key enumerated and the enumeration true
//   exit 2 = a fixture's generator does not produce it and nothing says so, or a declared
//            co-authorship does not match what regeneration actually finds
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THE EXISTING CHECK IS NOT THIS CHECK
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// adapters/pdf/sweep-boundary.mjs [SB-17] asserts that a fixture naming a generator names a
// path that IS IN THIS TREE. It caught a fixture citing two scripts that had never been
// committed — a citation to nothing — and that was worth catching.
//
// It cannot catch the next one along, which is subtler by exactly one step: THE GENERATOR
// EXISTS AND NO LONGER PRODUCES THE FILE. A path that resolves and a script that reproduces
// the artefact are different facts, and only the second is what `_generated_by` claims. A
// fixture edited by hand after generation still passes [SB-17] forever, and every downstream
// exclusion that leans on "these figures were computed, not typed" — [SB-10] leans on it by
// name — is then resting on a sentence that stopped being true.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE TWO ADMISSIBLE STATES, AND THERE IS NO THIRD
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   SOLE AUTHOR   re-running the generator reproduces the committed file exactly. The claim
//                 is true as written and nothing more is needed.
//
//   CO-AUTHORED   the generator produces most of it and named keys were added or changed by
//                 hand afterwards. Admissible ONLY if the fixture declares
//                 `_co_authored_with_hand`: { key: reason } naming EVERY such key, and the
//                 enumeration is compared against what regeneration actually finds. A key in
//                 the declaration that regeneration reproduces is as much a STOP as a key
//                 regeneration misses that the declaration does not name — a stale
//                 co-authorship reads exactly like a live one.
//
// DRIFT BETWEEN THE TWO IS A STOP. That is the ruling, and it is the reason the comparison
// is per KEY rather than per file: "this file differs somewhere" is not something a reader
// can act on, and a diff nobody can act on is how a declaration becomes decorative.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// HOW A GENERATOR IS RE-RUN WITHOUT TOUCHING THE TREE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// These generators write to samples/ by name and take no output path. So every file a
// generator could write is COPIED ASIDE first, the generator is spawned, the result is read,
// and the originals are restored — in a `finally`, so an exception mid-run cannot leave the
// tree holding a regenerated fixture. The restore is VERIFIED byte-for-byte before this file
// reports anything, and a failed restore is the loudest thing here: it would mean the check
// had modified the artefacts it exists to describe.

import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SAMPLES = 'samples';

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Every sample declaring a `_generated_by` that names a script path in this tree. */
export const claimants = () => {
  const out = [];
  for (const f of readdirSync(SAMPLES).filter((x) => x.endsWith('.json')).sort()) {
    let doc;
    try { doc = read(`${SAMPLES}/${f}`); }
    catch (e) { out.push({ file: f, unreadable: e.message }); continue; }
    const g = doc._generated_by;
    if (typeof g !== 'string') continue;
    // A fixture whose sentence names NO path makes no claim this can check — "authored by a
    // one-shot generator that was not committed" is a statement about the absence of a path.
    // Recorded as `noPath` and reported, never silently skipped: the count of claims this
    // instrument cannot check is part of what it is telling you.
    // THIS FILE IS NOT A GENERATOR, AND A SENTENCE THAT NAMES IT IS NOT CLAIMING IT IS.
    // A co-authorship declaration properly says which instrument asserts it, so `_generated_by`
    // sentences now mention this path — and matching on ".mjs" alone made the checker spawn
    // ITSELF as the fixture's generator, which reproduces nothing and reported the fixture as
    // both SOLE AUTHOR and DRIFT in the same run. Excluded by name, with the reason, rather
    // than by narrowing the pattern until the symptom goes away.
    const SELF = 'adapters/pdf/assert-fixture-authorship.mjs';
    const paths = [...new Set([...g.matchAll(/\b([\w./-]+\.mjs)\b/g)].map((m) => m[1]))]
      .filter((p) => p !== SELF && existsSync(p));
    if (!paths.length) { out.push({ file: f, noPath: true, sentence: g.slice(0, 90) }); continue; }
    out.push({ file: f, generators: paths, declared: doc._co_authored_with_hand || null });
  }
  return out;
};

/**
 * Re-run one generator with the whole samples/ directory held aside, and return the files it
 * wrote. THE HOLD IS THE WHOLE DIRECTORY, not the files this generator is expected to touch:
 * predicting that set is the thing being tested, and a generator that wrote somewhere
 * unexpected would otherwise have its output committed by the check.
 */
const regenerate = (script) => {
  // THE HOLD IS IN MEMORY, NOT ON DISK.
  //
  // The first draft copied every sample into adapters/pdf/tmp/authorship-hold and restored from
  // there. That directory did not survive the generator runs — the restore died on a file that
  // had been in the hold moments earlier — and the failure lands AFTER a generator has already
  // overwritten real fixtures, which is the worst possible moment to discover it. Three
  // record-shape fixtures were left regenerated in the working tree twice before this was
  // rewritten. Bytes read into Buffers cannot be removed by anything the generator does, so the
  // restore has nothing to depend on but this process's own memory.
  const before = new Map();
  const stamp = new Map();
  for (const f of readdirSync(SAMPLES).filter((x) => x.endsWith('.json'))) {
    before.set(f, readFileSync(`${SAMPLES}/${f}`));
    stamp.set(f, statSync(`${SAMPLES}/${f}`).mtimeMs);
  }
  let produced = new Map(), ran;
  try {
    ran = spawnSync(process.execPath, [script], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    // WHICH FILES THE GENERATOR WROTE — BY mtime, NOT BY CONTENT.
    //
    // The first draft asked which files CHANGED, and that is precisely backwards: a generator
    // that reproduces its fixture exactly writes identical bytes, changes no hash, and was
    // reported NOT PRODUCED — the verdict for a file its generator does not author. Eight of
    // nine fixtures came back with the worst possible answer for the best possible reason.
    // A written file gets a new mtime whether or not its bytes moved, so mtime is what
    // separates "wrote it" from "did not touch it", and content is left to say what it wrote.
    for (const f of readdirSync(SAMPLES).filter((x) => x.endsWith('.json')))
      if (!stamp.has(f) || statSync(`${SAMPLES}/${f}`).mtimeMs !== stamp.get(f)) produced.set(f, read(`${SAMPLES}/${f}`));
  } finally {
    // RESTORE FIRST, VERIFY SECOND, AND VERIFY ALWAYS. A regenerated fixture left in the tree
    // by this check would be an artefact nobody authored, produced by the instrument that
    // exists to say who authored what.
    for (const f of readdirSync(SAMPLES).filter((x) => x.endsWith('.json')))
      if (!before.has(f)) unlinkSync(`${SAMPLES}/${f}`);
    for (const [f, bytes] of before) writeFileSync(`${SAMPLES}/${f}`, bytes);
  }
  const restoreFailures = [...before]
    .filter(([f, bytes]) => sha(`${SAMPLES}/${f}`) !== createHash('sha256').update(bytes).digest('hex'))
    .map(([f]) => f);
  return { produced, exit: ran?.status, stderr: String(ran?.stderr || '').slice(-400), restoreFailures };
};

/** Deep key-by-key comparison at the top level, which is where hand edits land. */
const keyDiff = (committed, regenerated) => {
  const keys = [...new Set([...Object.keys(committed), ...Object.keys(regenerated)])].sort();
  const differs = [];
  for (const k of keys) {
    const a = JSON.stringify(committed[k]);
    const b = JSON.stringify(regenerated[k]);
    if (a !== b) differs.push(k);
  }
  return differs;
};

export const authorshipAudit = () => {
  const rows = claimants();
  const problems = [];
  const byScript = new Map();
  for (const r of rows) {
    if (r.unreadable) { problems.push(`UNREADABLE  samples/${r.file}: ${r.unreadable}. A fixture whose authorship cannot be read is not a fixture with no claim.`); continue; }
    if (r.noPath) continue;
    for (const g of r.generators) { if (!byScript.has(g)) byScript.set(g, []); byScript.get(g).push(r); }
  }

  const results = [];
  for (const [script, claims] of byScript) {
    const { produced, exit, stderr, restoreFailures } = regenerate(script);
    if (restoreFailures.length)
      problems.push(`RESTORE FAILED  after re-running ${script}, samples/${restoreFailures.join(', samples/')} did not come back byte-identical. STOP EVERYTHING: this check has modified the artefacts it exists to describe.`);
    if (exit !== 0)
      problems.push(`GENERATOR FAILED  ${script} exited ${exit} when re-run. Its claim cannot be assessed, and a claim that cannot be assessed is not a claim that holds.${stderr ? `\n      ${stderr.split('\n').slice(-3).join('\n      ')}` : ''}`);
    for (const c of claims) {
      const committed = read(`${SAMPLES}/${c.file}`);
      const regen = produced.get(c.file);
      if (!regen) {
        problems.push(`NOT PRODUCED  samples/${c.file} declares it was generated by ${script}, and re-running ${script} did not write it. The path resolves — which is all [SB-17] can ask — and the generator is not the author of this file.`);
        results.push({ file: c.file, script, verdict: 'NOT PRODUCED', differs: [], declared: Object.keys(c.declared || {}) });
        continue;
      }
      const differs = keyDiff(committed, regen);
      const declared = Object.keys(c.declared || {}).sort();
      const undeclared = differs.filter((k) => !declared.includes(k));
      const stale = declared.filter((k) => !differs.includes(k));
      if (undeclared.length)
        problems.push(`CO-AUTHORSHIP UNDECLARED  samples/${c.file} claims ${script} as its generator, and re-running it produces a different value for [${undeclared.join(', ')}]. Either regenerate the fixture, or declare \`_co_authored_with_hand\` naming every hand-authored key with its reason. The generator is no longer the sole author of the file it claims.`);
      if (stale.length)
        problems.push(`CO-AUTHORSHIP STALE  samples/${c.file} declares [${stale.join(', ')}] as hand-authored, and re-running ${script} reproduces ${stale.length === 1 ? 'it' : 'them'} exactly. A declaration for a divergence that has gone away reads exactly like one for a live divergence.`);
      results.push({ file: c.file, script, verdict: differs.length ? (undeclared.length || stale.length ? 'DRIFT' : 'CO-AUTHORED') : 'SOLE AUTHOR', differs, declared });
    }
  }
  return { rows, results, problems };
};

/**
 * THE CANARY — BOTH DIRECTIONS, AGAINST THE REAL COMPARATOR.
 *
 * `keyDiff` is the whole instrument: everything else spawns processes and moves bytes around.
 * A run that reports "8 reproduced exactly" is worth nothing if the comparator cannot see a
 * changed key, and this file's failure mode is the quiet one — it would simply agree with
 * whatever it was handed, forever. Synthetic pairs, not tree artefacts: a canary drawn from the
 * tree cannot tell a broken comparator from a clean tree.
 */
export const canary = () => {
  const cases = [
    ['a changed scalar is seen', keyDiff({ a: 1, b: 2 }, { a: 1, b: 3 }).join() === 'b'],
    ['a key present only in the committed file is seen', keyDiff({ a: 1, hand: 'x' }, { a: 1 }).join() === 'hand'],
    ['a key present only in the regenerated file is seen', keyDiff({ a: 1 }, { a: 1, fresh: 'y' }).join() === 'fresh'],
    ['a nested change is seen', keyDiff({ rows: [{ n: '1.00' }] }, { rows: [{ n: '1' }] }).join() === 'rows'],
    ['identical objects yield nothing', keyDiff({ a: 1, rows: [{ n: 2 }] }, { a: 1, rows: [{ n: 2 }] }).length === 0],
    ['key ORDER is not a difference', keyDiff({ a: 1, b: 2 }, { b: 2, a: 1 }).length === 0],
    ['a string and the number that prints the same are different', keyDiff({ a: '1' }, { a: 1 }).join() === 'a'],
  ];
  const missed = cases.filter(([, ok]) => !ok).map(([what]) => what);
  return { checks: cases.length, missed, holds: missed.length === 0 };
};

export const reportAuthorship = ({ verbose = false } = {}) => {
  const bird = canary();
  if (!bird.holds) {
    console.error(`AUTHORSHIP CANARY DEAD — the comparator misclassified ${bird.missed.length} of ${bird.checks} synthetic case(s): ${bird.missed.join('; ')}.`);
    console.error('  Every "reproduced exactly" below would be produced by a comparator that cannot see a difference. STOP.');
    return bird.missed.length;
  }
  const a = authorshipAudit();
  const noPath = a.rows.filter((r) => r.noPath);
  const sole = a.results.filter((r) => r.verdict === 'SOLE AUTHOR');
  const co = a.results.filter((r) => r.verdict === 'CO-AUTHORED');
  console.log(`fixture authorship: canary holds (${bird.checks} synthetic comparison(s)); ${a.rows.length} sample(s) declare a _generated_by; ${a.results.length} name a generator in this tree and were REGENERATED and compared, ${noPath.length} name no path and make no claim this can check`);
  console.log(`                    ${sole.length} reproduced exactly, ${co.length} co-authored with the hand-added keys enumerated and true, ${a.results.length - sole.length - co.length} in neither state`);
  for (const r of a.results)
    console.log(`  ${String(r.verdict).padEnd(13)} ${r.file.padEnd(48)} ${r.script}${r.differs.length ? `\n                differing key(s): ${r.differs.join(', ')}` : ''}`);
  if (verbose) for (const r of noPath) console.log(`  (no path)     ${r.file.padEnd(48)} ${JSON.stringify(r.sentence)}`);
  if (!a.problems.length) {
    console.log(`OK — every fixture naming a generator is either reproduced by it exactly or declares its co-authorship, and every declared hand-authored key is one regeneration actually finds.`);
    return 0;
  }
  console.error(`FIXTURE AUTHORSHIP — ${a.problems.length} problem(s):`);
  a.problems.forEach((p) => console.error(`  ${p}`));
  return a.problems.length;
};

if (process.argv[1] && /assert-fixture-authorship\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  process.exit(reportAuthorship({ verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
