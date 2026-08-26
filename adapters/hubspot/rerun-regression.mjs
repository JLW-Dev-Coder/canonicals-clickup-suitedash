// EVERY FINISHED FORM'S GENERATOR AND FETCHER, RE-RUN, WRITING NOTHING.
//
//   node adapters/hubspot/rerun-regression.mjs              # every form, offline tier only
//   node adapters/hubspot/rerun-regression.mjs --portal     # both tiers; derivers and fetchers read the portal
//   node adapters/hubspot/rerun-regression.mjs --canary     # prove this harness can fail
//   node adapters/hubspot/rerun-regression.mjs --verbose    # every command line and every drift path
//
//   exit 0 = every discovered tool ran to completion in a sandbox and the real tree is unchanged
//   exit 2 = a tool exited non-zero, a tool could not be discovered, the tree was written to,
//            or a canary was not caught
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — [R-30]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [D-18]'s fourth instance: `derive-names-433boi.mjs` asked "did THIS pass create this live
// property?" as `description.startsWith("433-B(OIC) (input key: K)")`. That was true for the
// entire life of the form — until the 433-B pass, SEVEN PROMPTS LATER, rewrote nine shared
// descriptions to open with "Serves BOTH Form 433-B ...". The predicate went false, 433-B(OIC)
// could not regenerate its own definitions file, and it was found only because that cycle
// happened to need the regeneration.
//
// That item's own closing sentence is the whole argument for this file:
//
//   "What the sweep buys is that the population is enumerated and no member can be added
//    silently; what caught the fourth instance was RUNNING THE TOOL."
//
// post-pass-sweep.mjs enumerates. Nothing ran. So the three recorded instances were all
// self-inflicted — a tool broken by the pass IT precedes, which somebody hits soon — and the
// fourth was broken by a NEIGHBOUR'S pass, for which there is no natural moment at all.
//
// This file is that moment. Every finished form's generator and fetcher runs on every full
// regression, whether or not anybody needs its output.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// "WRITES NOTHING" IS ASSERTED, NOT INTENDED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// These tools write permanent artefacts: a deriver emits `fields.<form>.json`, whose contents
// become HubSpot property names, and HubSpot does not free a name. A regression that ran them
// in place would rewrite five definition files on every run and the diff would BE the regression.
//
// A `--dry-run` FLAG WAS REJECTED. It would need adding to eight tools, a ninth added later
// would silently not have it, and a flag that suppresses a write is a claim about a tool made
// BY that tool. So the containment is external and structural: the tool runs with its cwd
// inside a COPY of the tree, so every relative path it writes lands in the copy. Nothing it can
// do reaches here.
//
// And the containment is then CHECKED rather than trusted by construction: a SHA-256 manifest
// of every file under the swept roots is taken before the run and again after, and any
// difference is a STOP naming the paths. [R-31]'s preference applied to this file's own claim —
// "the tree cannot have been written to" beats "the tool promised not to write".
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE POPULATION IS DISCOVERED, AND THE GENERATOR HALF IS DISCOVERED FROM THE ARTEFACT [R-19]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Not from a list here, and not from a filename convention either. Every generated definitions
// file already declares its own generator, because [R-19] made it — `fields.<form>.json` carries
// `meta.generator`, and generator-guard.mjs asserts before every write that the file names the
// tool doing the writing. So the generator half of this population is READ OUT OF THE ARTEFACT
// THE GENERATOR PRODUCES, and it cannot drift from it without generator-guard stopping first.
//
// The fetcher half has no such declaration, so its glob is declared here per [R-15]:
//
//   directory   adapters/hubspot/
//   filter      exactly `hs-fetch-<form>.mjs` for a form MAPPED_FORMS() yields
//   classifier  none — the name IS the claim, and a mapped form with no such file is a STOP
//
// A mapped form missing either half is a STOP, never a skip. A form absent from the population
// has its tools unexercised and nothing says so, which is the exclusion-by-omission that kept
// 433-B out of assert-row-class-routes' scope and 433-B(OIC) out of assert-row-shape-spec's.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// TWO TIERS, AND WHICH ONE WOULD HAVE FIRED FIRST [R-31]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// OFFLINE — the tool runs with no credential and no network. It reads its map, its crosswalk and
// its classification, derives every name, and emits. This tier is the STRONGER half: it is about
// structure, it needs nothing outside the tree, and it fires on a checkout nobody has a portal
// key for.
//
// PORTAL (`--portal`) — the derivers additionally read the live portal, which is the tier
// [D-18]'s fourth instance lived in: `startsWith` against a live description is a question only
// the portal can answer. The fetchers are portal-only by nature; a batch read naming a property
// the portal does not hold is a 400, and that is the shape a neighbour's rename produces.
//
// Every finding is reported with the tier it was found in, so "which would have fired first" is
// answered by the run rather than argued about afterwards.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// DRIFT IS REPORTED, NOT FAILED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Because the run happens in a copy, the files the tool WOULD have written are sitting there to
// be compared with the ones in the tree. That comparison is free and worth having: a definitions
// file that no longer matches what its own generator produces is a fact worth knowing. It is
// REPORTED and not failed, because the derivers stamp their markdown reports with a run time and
// a portal-read sentence, so a drift-free markdown is not achievable and a check tuned to fire
// constantly gets turned off ([R-10]). A drift in a `.json` definitions file is called out
// separately and by name, because that one is not explained by a stamp.

import { readFileSync, readdirSync, existsSync, statSync, mkdirSync, mkdtempSync, copyFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { MAPPED_FORMS } from '../pdf/resolve-fixture.mjs';
import { examined } from '../pdf/examined.mjs';
import { REFUSAL } from './no-downgrade.mjs';
import { stop, isStop } from './hs-lib.mjs';

const argv = process.argv.slice(2);
const usePortal = argv.includes('--portal');
const verbose = argv.includes('--verbose');

// ── THE SWEPT ROOTS, DECLARED [R-15] ───────────────────────────────────────────────────────
//
// What is copied into the sandbox, and equally what the before/after manifest covers. The two
// are the same set on purpose: a root a tool can write to and the manifest does not cover is a
// hole exactly the size of that root.
//
//   adapters/     the tools, the maps, the crosswalks, the classifications, the definitions
//   samples/      where every fetcher writes its intake record
//   package.json  copied so a tool that resolves it finds it
//
// PRUNED, and each pruning is a claim: `adapters/pdf/out` is filled PDFs and tripwire reports
// written by the gate, `adapters/pdf/tmp` is snapshot copies of superseded tools, and
// `adapters/hubspot/backup` is portal backups. No generator or fetcher reads any of the three —
// which is a claim, so provePruning() below greps every discovered tool for the three names,
// because this file is not exempt from [R-14].
export const ROOTS = ['adapters', 'samples', 'package.json'];
export const PRUNED = ['adapters/pdf/out', 'adapters/pdf/tmp', 'adapters/hubspot/backup'];

const walk = (root, out = []) => {
  if (!existsSync(root)) return out;
  if (statSync(root).isFile()) { out.push(root); return out; }
  for (const e of readdirSync(root).sort()) {
    const p = `${root}/${e}`;
    if (PRUNED.some((x) => p === x || p.endsWith(`/${x}`))) continue;
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};

/** SHA-256 per file over every swept root. The before/after comparison IS the containment proof. */
export const manifest = () => {
  const m = new Map();
  for (const r of ROOTS) for (const f of walk(r)) m.set(f, createHash('sha256').update(readFileSync(f)).digest('hex'));
  return m;
};

const diffManifest = (a, b) => {
  const out = [];
  for (const [k, v] of b) { if (!a.has(k)) out.push(`CREATED  ${k}`); else if (a.get(k) !== v) out.push(`MODIFIED ${k}`); }
  for (const k of a.keys()) if (!b.has(k)) out.push(`DELETED  ${k}`);
  return out.sort();
};

// ── THE SANDBOX ────────────────────────────────────────────────────────────────────────────
//
// A copy of the swept roots plus a JUNCTION to node_modules. A junction and not a copy because
// node_modules is 134 MB and nothing here writes into it; a junction and not a symlink because
// a directory symlink on Windows needs elevation and a junction does not.
export const buildSandbox = () => {
  const dir = mkdtempSync(join(tmpdir(), 'rerun-regression-'));
  for (const r of ROOTS) for (const f of walk(r)) {
    const dest = join(dir, f);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(f, dest);
  }
  if (existsSync('.env')) copyFileSync('.env', join(dir, '.env'));
  try { symlinkSync(join(process.cwd(), 'node_modules'), join(dir, 'node_modules'), 'junction'); }
  catch (e) { if (isStop(e)) throw e; throw new Error(`sandbox could not link node_modules: ${e.message}`); }
  return dir;
};

const sandboxDiff = (dir) => {
  const before = manifest();
  const after = new Map();
  const cwd = process.cwd();
  try {
    process.chdir(dir);
    for (const r of ROOTS) for (const f of walk(r)) after.set(f, createHash('sha256').update(readFileSync(f)).digest('hex'));
  } finally { process.chdir(cwd); }
  return diffManifest(before, after);
};

// ── DISCOVERY ──────────────────────────────────────────────────────────────────────────────

/**
 * The argv a discovered generator is run with, decided by ITS OWN SHAPE and never guessed.
 * A generator matching neither shape is a STOP: running an unknown tool under an argv invented
 * here is how a "regression" comes to exercise something other than the real invocation.
 */
export const argvFor = (form, tool, portal = usePortal) => {
  const t = tool.replace(/\\/g, '/');
  if (/\/gen-fields-from-[a-z-]+\.mjs$/.test(t)) return { argv: [form], why: 'takes the form on the command line and writes unconditionally' };
  if (new RegExp(`/derive-names-${form}\\.mjs$`).test(t)) return { argv: portal ? ['--portal', '--emit'] : ['--emit'], why: `binds its form from its own filename; --emit is what makes it WRITE the definitions${portal ? '; --portal adds the A7/A8/A12 checks against the live portal' : ''}` };
  return { stop: `no known invocation for ${tool}. Its shape matches neither \`gen-fields-from-*.mjs <form>\` nor \`derive-names-<form>.mjs\`, and an argv invented here would exercise something other than the real one.` };
};

export const population = () => {
  const rows = [];
  for (const form of MAPPED_FORMS()) {
    const defs = `adapters/hubspot/fields.${form}.json`;
    // ── A MAPPED FORM THAT HAS NOT BEEN CLASSIFIED IS A STAGE, NOT A STOP ────────────────
    //
    // [R-30]'s population is A FINISHED FORM'S derivers and fetchers, re-run so a tool broken by
    // a NEIGHBOUR'S pass fails on the next run rather than the next time somebody needs it. A
    // form that has a map and no crosswalk has neither a deriver nor a fetcher, because neither
    // has been authored yet -- and reporting that as "nothing in the tree declares this form's
    // generator" is this guard demanding an artefact the work has not reached, which is [R-03].
    //
    // 433-D is the first form this engine has held between the map and the crosswalk, and the
    // reason both rows fired at once is that MAPPED_FORMS() is derived from the maps directory:
    // the moment a map lands, the form joins this population whole.
    //
    // IT IS A DECLARED STAGE AND NOT A SKIP, and the two directions are what make that true.
    // The predicate is BOTH artefacts being absent: a form with a definitions file and no
    // fetcher, or a fetcher and no definitions file, is HALF finished and each missing half is a
    // STOP exactly as before -- which is the state that would mean somebody stopped partway. And
    // the row is not dropped: it is carried as `preCrosswalk` and NAMED in the report on every
    // run, so a form sitting in this stage forever is visible rather than absent.
    const fetcherPath = `adapters/hubspot/hs-fetch-${form}.mjs`;
    if (!existsSync(defs) && !existsSync(fetcherPath)) {
      rows.push({ form, kind: 'generator', preCrosswalk: `${form} has a map and no crosswalk: neither ${defs} nor ${fetcherPath} exists, so there is no deriver to re-run. A form between the map and the crosswalk owes this guard nothing, and it owes it everything the day either artefact appears.` });
      rows.push({ form, kind: 'fetcher', preCrosswalk: `${form} has a map and no crosswalk: no ${fetcherPath}, and no ${defs} either. Both halves absent is a stage; ONE half absent is a STOP, and this branch requires both.` });
      continue;
    }
    if (!existsSync(defs)) rows.push({ form, kind: 'generator', stop: `no ${defs}, so nothing in the tree declares this form's generator ([R-19])` });
    else {
      let gen = null, err = null;
      try { gen = JSON.parse(readFileSync(defs, 'utf8'))?.meta?.generator ?? null; } catch (e) { if (isStop(e)) throw e; err = e.message; }
      if (err) rows.push({ form, kind: 'generator', stop: `${defs} will not parse: ${err}. An unreadable declaration is not an absent one.` });
      else if (!gen) rows.push({ form, kind: 'generator', stop: `${defs} declares no meta.generator, so the artefact does not name what makes it ([R-19])` });
      else if (!existsSync(gen)) rows.push({ form, kind: 'generator', tool: gen, stop: `${defs} names ${gen} as its generator and that file is not on disk` });
      else rows.push({ form, kind: 'generator', tool: gen, declaredBy: defs, ...argvFor(form, gen) });
    }
    const fetcher = `adapters/hubspot/hs-fetch-${form}.mjs`;
    if (!existsSync(fetcher)) rows.push({ form, kind: 'fetcher', stop: `no ${fetcher}. A mapped form with no fetcher cannot be round-tripped and nothing else says so.` });
    else rows.push({ form, kind: 'fetcher', tool: fetcher, argv: null, why: 'takes one contact id, supplied from the portal on this run' });
  }
  return rows;
};

// ── THE PRUNING CLAIM, CHECKED [R-14] ──────────────────────────────────────────────────────
export const provePruning = (rows) => {
  const bad = [];
  for (const r of rows) {
    if (!r.tool) continue;
    let src;
    try { src = readFileSync(r.tool, 'utf8'); } catch (e) { if (isStop(e)) throw e; bad.push(`UNREADABLE ${r.tool}: ${e.message}`); continue; }
    for (const p of PRUNED) if (src.includes(p)) bad.push(`PRUNED ROOT READ  ${r.tool} names "${p}", which this file prunes from the sandbox on the ground that no discovered tool reads it. The ground is false; either stop pruning that root or say here why this mention is not a read.`);
  }
  return bad;
};

// ── THE CONTACT ID, READ FROM THE PORTAL ───────────────────────────────────────────────────
//
// NOT from `samples/<form>.from-hubspot-<id>.json`. Every one of those ids is a synthetic probe
// the register records as torn down and hs-preflight re-reads as a confirmed 404 — so a fetcher
// pointed at one would 404 on every run and this file would report five dead tools. The id is
// the LOWEST live contact id on the portal: lowest so the choice is deterministic and
// reportable, live so the batch read is a real one. Nothing is created and nothing is written;
// a fetcher is a GET and a batch READ, and a fetcher that were anything else would be caught by
// the containment proof rather than by this sentence.
export const liveContactId = async () => {
  const { hs } = await import('./hs-lib.mjs');
  const r = await hs('/crm/v3/objects/contacts?limit=100&properties=email');
  const ids = (r.results || []).map((c) => c.id).sort();
  if (!ids.length) return { stop: 'the portal holds no contacts, so no fetcher can be exercised. Zero fetchers run is not five fetchers passing ([R-04]).' };
  return { id: ids[0], of: ids.length };
};

// ── THE RUN ────────────────────────────────────────────────────────────────────────────────

export const runOne = (row, dir, contactId) => {
  const args = row.kind === 'fetcher' ? [contactId] : row.argv;
  const r = spawnSync(process.execPath, [row.tool, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env }, maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const code = r.status ?? 1;
  // ── THE THIRD STATE: UNASKABLE, NOT BROKEN AND NOT PASSED ────────────────────────────────
  //
  // no-downgrade.mjs stops any run that would replace a portal-verified report with one saying
  // "portal not read". All three derivers write such a report UNCONDITIONALLY — before --emit is
  // even consulted — so in the OFFLINE tier all three STOP. They are guarded, not broken.
  //
  // Reporting that as BROKEN would be this file getting the wrong answer at the exact moment
  // another guard got the right one. Passing `--downgrade` to get past it would make this tier
  // exercise an invocation nobody uses, which is the same object as a stale path.
  //
  // So it is a third state, and it is not a pass: report() below asserts that every tool
  // UNASKABLE in one tier was ANSWERED in another, and a tool unaskable in every tier run is a
  // STOP. "Refused" and "passed" are the two words this engine exists to keep apart.
  const unaskable = code !== 0 && out.includes(REFUSAL)
    ? 'refused by no-downgrade.mjs — this tool writes a portal-verified report and this tier does not read the portal'
    : null;

  // ── WHAT A FETCHER'S NON-ZERO EXIT ACTUALLY MEANS ────────────────────────────────────────
  //
  // WHAT THIS TIER CLAIMS ABOUT A FETCHER IS NARROW AND IT IS SAID HERE RATHER THAN IMPLIED:
  // that its batch read still RESOLVES EVERY BOUND PROPERTY NAME. That is the thing a
  // neighbour's pass breaks — hs-fetch-433b requests nine names under `irs433boi_` because they
  // are not its own, and a rename anywhere makes that request a 400 — and it is the whole of
  // [D-18]'s fourth instance pointed at a fetcher instead of a deriver.
  //
  // It claims NOTHING about the contact's content. The contact is a live one read off the
  // portal, and a real contact carries no 433 data at all, so a fetcher whose form declares a
  // required printed route reaches its own REFUSING TO WRITE and stops. THAT IS THE TOOL
  // WORKING. Calling it BROKEN would be this file reporting a refusal as a failure, which is
  // the same error in the other direction from reporting a failure as a pass.
  //
  // So a fetcher that got its answer from the portal and then refused the RECORD is ANSWERED.
  // A fetcher that failed any other way is BROKEN, and a 400 on the batch read lands there.
  const refusedOnContent = row.kind === 'fetcher' && code !== 0 && /REFUSING TO WRITE/.test(out)
    ? 'the batch read resolved every bound property name; the tool then refused the RECORD on its content, which is the tool working'
    : null;

  // ── [D-20], REPORTED ON EVERY RUN AND NOT FAILED ─────────────────────────────────────────
  //
  // `process.exit(n)` called after a `hs()` request ABORTS on this node build instead of
  // exiting: "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c".
  // The declared code is lost and the shell sees 127 (or 3221226505 through spawnSync). Every
  // STOP path in every portal tool in this directory is on that path. It is carried at [D-20]
  // in adapters/pdf/maps/_carried.cross-form.json with its five-line reproduction, its measured
  // population and the fix that was proved to work — it is not repaired here, and the reason is
  // in the item. What this file does is NAME IT on every run so it cannot go quiet.
  const aborted = /UV_HANDLE_CLOSING/.test(out) ? '[D-20] the declared exit code was lost to a libuv abort on the way out; the verdict above is read from the tool’s own output, not from its code' : null;

  return { ...row, cmd: `node ${row.tool} ${args.join(' ')}`, code, unaskable, refusedOnContent, aborted, out };
};

// ── THE CANARY ─────────────────────────────────────────────────────────────────────────────
//
// A NEW INSTRUMENT IS THE LEAST TRUSTWORTHY OBJECT IN THE REPO AT THE MOMENT IT IS WRITTEN, and
// this one's whole claim is that a broken tool comes back non-zero. So it is shown a broken tool.
//
// THREE PLANTS, one per way this harness can lie:
//
//   BROKEN TOOL   a discovered generator is replaced IN THE SANDBOX with one that exits 3.
//                 If the run comes back 0, the harness is not reading exit codes.
//   SILENT WRITE  a tool is replaced with one that writes into the sandbox's own tree.
//                 It must appear as drift. If it does not, the drift comparison is blind and
//                 every "would write 0 files" line above it means nothing.
//   TREE WRITE    a file under a swept root is modified between the two manifests. The
//                 containment proof must name it. If it does not, "the tree is unchanged" is
//                 a sentence rather than a check.
//
// Each plant is made in a sandbox or against a copy and torn down; the third writes into the
// real tree and restores the exact bytes, verified by hash, because a containment proof that
// has never seen a violation is the thing it is a proof against.
export const canary = () => {
  const problems = [];
  const rows = population().filter((r) => !r.stop && !r.preCrosswalk && r.kind === 'generator');
  if (!rows.length) return ['CANARY DEAD  no generator was discovered, so there is nothing to plant against. An empty canary is the failure it exists to catch.'];
  const row = rows[0];

  // 1 — a broken tool must come back non-zero
  let dir = buildSandbox();
  try {
    writeFileSync(join(dir, row.tool), 'process.exit(3);\n');
    const res = runOne(row, dir, null);
    if (res.code === 0) problems.push(`CANARY DEAD  a planted tool that exits 3 was reported as exit ${res.code}. This harness is not reading exit codes.`);
  } finally { rmSync(dir, { recursive: true, force: true }); }

  // 2 — a silent write must appear as drift
  dir = buildSandbox();
  try {
    writeFileSync(join(dir, row.tool), `import { writeFileSync } from 'node:fs';\nwriteFileSync('samples/__canary_write__.json', '{}\\n');\n`);
    const res = runOne(row, dir, null);
    res.drift = sandboxDiff(dir);
    if (!res.drift.some((d) => d.includes('__canary_write__'))) problems.push(`CANARY DEAD  a planted tool wrote samples/__canary_write__.json in the sandbox and the drift comparison did not see it (${res.drift.length} drift row(s), exit ${res.code}). Every "would write 0 files" this file prints is unchecked.`);
  } finally { rmSync(dir, { recursive: true, force: true }); }

  // 3 — a write to the real tree must be named by the containment proof
  const witness = 'adapters/hubspot/probe-register.json';
  const original = readFileSync(witness);
  const before = manifest();
  try {
    writeFileSync(witness, Buffer.concat([original, Buffer.from('\n')]));
    const after = manifest();
    const seen = diffManifest(before, after);
    if (!seen.some((d) => d.endsWith(witness))) problems.push(`CANARY DEAD  ${witness} was modified between the two manifests and the containment proof did not name it. "The swept roots are byte-identical" is a sentence, not a check.`);
  } finally {
    writeFileSync(witness, original);
    const restored = createHash('sha256').update(readFileSync(witness)).digest('hex');
    if (restored !== createHash('sha256').update(original).digest('hex')) problems.push(`CANARY LEFT DAMAGE  ${witness} was not restored to its original bytes. Fix it from git before anything else.`);
  }

  if (!problems.length) console.log('  canary: 3 of 3 — a tool exiting 3 is reported non-zero, a sandbox write appears as drift, and a write to a swept root is named by the containment proof.');
  return problems;
};

export const report = async () => {
  const rows = population();
  // THE DECLARED STAGE IS PRINTED BEFORE THE PROBLEMS, so a form owing this guard nothing is a
  // line somebody reads rather than a row that quietly is not there.
  const staged = rows.filter((r) => r.preCrosswalk);
  if (staged.length) {
    console.log('');
    console.log(`  MAPPED, NOT YET CROSSWALKED — ${staged.length} row(s) across ${new Set(staged.map((r) => r.form)).size} form(s), owing nothing and named rather than absent:`);
    for (const r of staged) console.log(`    ${r.form}/${r.kind}: ${r.preCrosswalk}`);
  }
  const problems = rows.filter((r) => r.stop).map((r) => `STOP  ${r.form}/${r.kind}: ${r.stop}`);
  problems.push(...provePruning(rows));

  console.log(`re-run regression: ${MAPPED_FORMS().length} mapped form(s), ${rows.length} tool invocation(s) discovered`);
  console.log(`  swept roots: ${ROOTS.join(', ')}   pruned: ${PRUNED.join(', ')}`);
  console.log('  generators discovered from each fields.<form>.json’s own meta.generator ([R-19]); fetchers by the declared glob adapters/hubspot/hs-fetch-<form>.mjs');
  console.log(`  tier: ${usePortal ? 'OFFLINE + PORTAL' : 'OFFLINE only — pass --portal for the tier [D-18]’s fourth instance lived in'}`);

  if (argv.includes('--canary')) problems.push(...canary());

  let contact = { id: null };
  if (usePortal) {
    contact = await liveContactId();
    if (contact.stop) problems.push(`STOP  fetchers: ${contact.stop}`);
    else console.log(`  contact for every fetcher: ${contact.id} — the lowest of ${contact.of} live contact id(s) read from the portal on this run`);
  }

  const runnable = rows.filter((r) => !r.stop && !r.preCrosswalk && (r.kind === 'generator' || (r.kind === 'fetcher' && usePortal)));
  const skipped = rows.filter((r) => !r.stop && !r.preCrosswalk && r.kind === 'fetcher' && !usePortal);

  const before = manifest();
  const results = [];
  for (const row of runnable) {
    const dir = buildSandbox();
    try {
      const res = runOne(row, dir, contact.id);
      res.drift = sandboxDiff(dir);
      results.push(res);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  const after = manifest();

  const wrote = diffManifest(before, after);
  if (wrote.length) problems.push(`TREE WRITTEN  the swept roots changed while this ran, which is the one thing this file promises cannot happen:\n    ${wrote.join('\n    ')}`);

  console.log('');
  const W = Math.max(20, ...results.map((r) => r.tool.length), ...skipped.map((r) => r.tool.length));
  for (const r of results) {
    const j = r.drift.filter((d) => d.endsWith('.json')).length;
    const m = r.drift.filter((d) => d.endsWith('.md')).length;
    const o = r.drift.length - j - m;
    const tail = r.unaskable
      ? `UNASKABLE in this tier — ${r.unaskable}`
      : r.refusedOnContent
        ? `ANSWERED — ${r.refusedOnContent}`
        : `exit ${String(r.code).padEnd(3)} would write ${String(r.drift.length).padStart(2)} file(s)${j ? `  [${j} .json]` : ''}${m ? ` [${m} .md]` : ''}${o ? ` [${o} other]` : ''}`;
    console.log(`  ${(r.form + '/' + r.kind).padEnd(20)} ${r.tool.padEnd(W)} ${tail}`);
    if (r.aborted) console.log(`  ${' '.repeat(20)} ${' '.repeat(W)} ${r.aborted}`);
    if (verbose) { console.log(`      ${r.cmd}`); for (const d of r.drift) console.log(`      ${d}`); }
    if (r.code !== 0 && !r.unaskable && !r.refusedOnContent) problems.push(`BROKEN  ${r.form}/${r.kind} ${r.tool} exited ${r.code} in the ${usePortal ? 'portal' : 'offline'} tier. This tool is broken NOW, on a tree where nothing needed it:\n${r.out.split('\n').filter(Boolean).slice(-12).map((l) => '    ' + l).join('\n')}`);
  }

  for (const s of skipped) console.log(`  ${(s.form + '/' + s.kind).padEnd(20)} ${s.tool.padEnd(W)} NOT RUN — a fetcher is portal-only; pass --portal. Not run is not passed ([R-04]).`);

  // ── UNASKABLE IS NOT PASSED ──────────────────────────────────────────────────────────────
  //
  // A tool that was refused in the only tier this run exercised has NOT been re-run, and the
  // whole point of this file is that it gets re-run. So the refusal is carried to the summary
  // and named there: in an offline-only run every portal-verified deriver lands here, which is
  // the honest report of what an offline-only run establishes about it, and that is nothing.
  const unaskable = results.filter((r) => r.unaskable);
  if (unaskable.length) {
    console.log('');
    console.log(`  UNASKABLE — ${unaskable.length} tool(s) were refused rather than run in the ${usePortal ? 'portal' : 'offline'} tier. Refused is not passed:`);
    for (const u of unaskable) console.log(`    ${u.form}/${u.kind}  ${u.tool}  —  ${u.unaskable}`);
    if (!usePortal) console.log('    Every one of these is answerable in the PORTAL tier; run with --portal, which is the tier [D-18]’s fourth instance lived in.');
    else problems.push(`UNANSWERED  ${unaskable.length} tool(s) were refused in the portal tier too, so this run establishes nothing about them. A tool unaskable in every tier run is a STOP: ${unaskable.map((u) => u.tool).join(', ')}`);
  }

  const defDrift = results.flatMap((r) => r.drift.filter((d) => /adapters\/hubspot\/fields\.[a-z0-9]+\.json$/.test(d)).map((d) => `${d}   (from ${r.tool})`));
  console.log('');
  if (defDrift.length) {
    console.log(`  DEFINITIONS DRIFT — ${defDrift.length} definitions file(s) no longer match what their own generator produces. That artefact carries no run stamp, so a stamp does not explain it:`);
    for (const d of defDrift) console.log(`    ${d}`);
  } else console.log('  DEFINITIONS DRIFT — none. Every fields.<form>.json in the tree is byte-identical to what its declared generator emits on this run.');

  const aborts = results.filter((r) => r.aborted);
  if (aborts.length) {
    console.log('');
    console.log(`  [D-20] LOST EXIT CODES — ${aborts.length} of ${results.length} run(s) aborted on the way out instead of exiting, so their declared code did not reach this file:`);
    for (const a of aborts) console.log(`    ${a.form}/${a.kind}  ${a.tool}  reported ${a.code}`);
    console.log('    Carried, not repaired here. The verdicts above are read from each tool’s own output. See [D-20] in adapters/pdf/maps/_carried.cross-form.json.');
  }

  for (const f of MAPPED_FORMS()) examined('rerun-regression', f, results.filter((r) => r.form === f).length, 'read-only-tool-reruns');

  if (problems.length) { console.error(''); for (const p of problems) console.error(`  ${p}`); return problems.length; }
  console.log('');
  // THE FIGURE IS THE ONE THE SENTENCE IS ABOUT. `results.length` counts the refused runs too,
  // and "5 tools ran to completion" over a set containing two refusals is the success message
  // guarded by the wrong condition that [R-11] names.
  //
  // AND THE SENTENCE IS ENCLOSED BY THE FINDING COUNT rather than merely placed after the block
  // that accumulates it. `return problems.length` is a jump this file's author can see and
  // success-sweep.mjs cannot — its JUMPS list matches `return <digit>`, not a returned
  // expression — so the guard above licensed nothing and this line was flagged, correctly, on
  // the first run of the sweep after it was written. Guarding it here is the cheaper of the two
  // repairs and it is the stronger one: the sentence is now unreachable on a failing run by its
  // own condition, not by the reader's reading of the block above it.
  const ran = results.filter((r) => !r.unaskable);
  if (!problems.length) console.log(`OK — ${ran.length} tool(s) across ${MAPPED_FORMS().length} form(s) ran to completion in a sandbox${unaskable.length ? `, ${unaskable.length} refused and named above` : ''}${skipped.length ? `, ${skipped.length} not run in this tier` : ''}, and the swept roots are byte-identical before and after (${before.size} file(s) hashed).`);
  return problems.length;
};

if (process.argv[1] && /rerun-regression\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  report().then((n) => stop(n ? 2 : 0)).catch((e) => { if (isStop(e)) throw e; console.error(`rerun-regression STOPPED: ${e.message}`); stop(2); });
}
