// EVERY TOOL IN THIS TREE IS RUN BY THE STANDING SUITE, OR IS REGISTERED AS MANUAL.
//
//   node adapters/pdf/assert-reachability.mjs             # the graph, the register, the canaries
//   node adapters/pdf/assert-reachability.mjs --verbose   # every tool, with the route that runs it
//   node adapters/pdf/assert-reachability.mjs --run       # additionally RUN every manual tool
//
//   exit 0 = every tool is reached by a script root or a spawn, or is registered manual
//   exit 2 = a tool nobody runs is unregistered, a register entry is stale, or a canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A TOOL NOBODY RUNS IS A TOOL NOBODY KNOWS IS BROKEN
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// THREE INSTANCES, INSIDE FOUR PROMPTS, AND THE THIRD IS WHAT MADE IT A RULE.
//
//   1. [D-18]'s fourth instance. `derive-names-433boi.mjs` asked "did THIS pass create this
//      live property?" as a `startsWith` against a live description. The 433-B pass rewrote
//      nine shared descriptions SEVEN PROMPTS LATER, the predicate went false, and 433-B(OIC)
//      could not regenerate its own definitions file. Found only because a cycle happened to
//      need the regeneration. `rerun-regression.mjs` and [R-30] are that instance's remedy.
//
//   2. `assert-row-class-routes.mjs` HAD BEEN EXITING 2 FOR TWO PROMPTS. It held five typed
//      (form, fixture, engine) triples and two fixture paths were stale — 433-B(OIC) at slice 1
//      when its acceptance record had moved to slice 3, 433-B at slice 1 when its had moved to
//      slice 4 — so it reported six UNPROVED groups and a canary yield of 33 against an
//      expected 39. It is in no npm script and in no gate step, so nothing had run it.
//
//   3. `gen-subject-register.mjs --check` EXISTED ALL ALONG AND WAS IN NO SCRIPT, over a
//      `meta.generator` whose mis-aim would have destroyed a form's content ([R-19]'s class).
//
// [R-30] closed the shape for a FINISHED FORM'S derivers and fetchers. It does not close the
// shape for an asserter, and the read-only regression's own header says so: its population is
// generators and fetchers, discovered from `fields.<form>.json`'s `meta.generator` and from the
// `hs-fetch-<form>.mjs` glob. `assert-row-class-routes.mjs` is neither, which is why running
// every finished form's tools surfaced it as a bystander rather than as a member.
//
// So this file asks the question one level out: OF EVERY TOOL IN THE TREE, WHICH ONES DOES
// ANYTHING ACTUALLY RUN? A tool that answers "nothing" is not failed — it is required to be
// REGISTERED, with a reason, and the reason is then checked against the tree.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE POPULATION, DECLARED  [R-15]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   directories  adapters/pdf/, adapters/hubspot/   (non-recursive, as every sweep here reads)
//   filter       *.mjs
//   classifier   a file is a TOOL if EITHER signal holds:
//                  (a) its header documents its own invocation — a comment line carrying
//                      `node adapters/<dir>/<name>.mjs`; every tool in this tree writes one
//                  (b) its code can exit non-zero — a `process.exit(n)`, `stop(n)` or
//                      `process.exitCode = n` for some n that is not 0
//
// TWO SIGNALS AND NOT ONE, because each has a hole the other covers. `fill-433f.mjs` documents
// no CLI line and would escape (a); a tool that only ever prints a report and returns 0 would
// escape (b). A file escapes this population only by having NEITHER, which is what a library
// looks like — `examined.mjs`, `comparisons.mjs`, `rounding.mjs` — and a library is exercised
// whenever its importer runs.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT "RUN" MEANS, AND WHY AN IMPORT IS NOT ALWAYS ENOUGH
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A SPAWN edge is a fresh `node <file>`: the file's whole body executes, CLI block included.
// An IMPORT edge loads the module into the importer's process: its top-level body executes, but
// anything behind `if (process.argv[1] && /name\.mjs$/.test(...))` DOES NOT.
//
// So the two edges are not interchangeable and the file's own shape decides which it needs:
//
//   a file WITH a CLI guard      its assertions live behind the guard  ->  needs a SPAWN
//   a file WITHOUT a CLI guard   its body IS its assertions           ->  an IMPORT suffices
//
// Getting this wrong is not a detail. The first draft of the graph accepted an import edge for
// everything, and `correlate-labels.mjs` — the authoring instrument [D-22] records as being in
// no script and no gate step, twice — came out REACHABLE. A graph that certifies the tool the
// rule was written about is a graph that certifies nothing.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// AND THE SPAWN EDGES ARE READ FROM CALL SITES, NOT FROM THE FILE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The second draft took every `*.mjs` string literal in any file that spawns. That over-reached
// for the same reason and in the same direction: `sweep-boundary.mjs` and `assert-examined.mjs`
// spawn tools AND name dozens of others in registers and in message strings, so a mention
// became an edge and `correlate-labels.mjs` came out reachable again, by a different route.
//
// Edges are therefore read only from ARGUMENT REGIONS — the text between a call's opening
// parenthesis and its match:
//
//   direct     spawnSync(...) / spawn(...) / execFileSync(...) / execSync(...)
//   indirect   a call to a LOCAL RUNNER — a function defined in the same file whose own body
//              spawns. `run-form-gate.mjs` names every step as `runTool('validate-map.mjs', …)`
//              and joins on the directory one layer down, so without this half the entire gate
//              contributes no edges at all and twelve steps look unreached.
//
// A `${...}` in such a string is expanded over MAPPED_FORMS(), because the gate's fill step is
// `runTool(\`fill-${form}.mjs\`, …)` and the set of forms that names is derived, never listed.
//
// Both directions are canaried below, since a graph that is too loose and a graph that is too
// tight both produce a clean report.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { MAPPED_FORMS } from './resolve-fixture.mjs';
import { examined } from './examined.mjs';

const argv = process.argv.slice(2);
const verbose = argv.includes('--verbose');
const doRun = argv.includes('--run');

export const DIRS = ['adapters/pdf', 'adapters/hubspot'];

// ── THE MASKS ─────────────────────────────────────────────────────────────────────────────
// Same pair, and the same reason, as adapters/hubspot/assert-exit-codes.mjs: a question whose
// answer is a PATH must keep string literals, and a question whose answer is a CALL SITE must
// drop them. Duplicated rather than imported because a pdf-side tool taking a structural
// dependency on a hubspot-side tool to answer a question about the pdf side is a coupling that
// buys nothing; the pair is fourteen lines and each copy is canaried where it stands.
const maskWith = (src, { strings }) => {
  const out = src.split('');
  const n = src.length;
  const blank = (a, b) => { for (let k = a; k < b && k < n; k++) if (out[k] !== '\n') out[k] = ' '; };
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { let j = src.indexOf('\n', i); if (j < 0) j = n; blank(i, j); i = j; continue; }
    if (c === '/' && d === '*') { let j = src.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; blank(i, j); i = j; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === q) break;
        j++;
      }
      if (strings) blank(i + 1, j);
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.join('');
};
export const codeMask = (src) => maskWith(src, { strings: true });
export const keepStrings = (src) => maskWith(src, { strings: false });

export const DOCUMENTS_CLI = /^\s*\/\/.*\bnode\s+adapters\/(?:pdf|hubspot)\/[\w.-]+\.mjs/m;
export const CAN_FAIL = /process\.exitCode\s*=\s*(?!0\b)|process\.exit\(\s*(?!0\s*\))|\bstop\(\s*(?!0\s*\))/;
export const HAS_CLI_GUARD = /process\.argv\[1\]|import\.meta\.main/;
const SPAWN_FNS = ['spawnSync', 'spawn', 'execFileSync', 'execSync'];
const NAME_IN_STRING = /[\w.${}/-]*\.mjs/g;

const dirOf = (p) => p.slice(0, p.lastIndexOf('/'));

/** The text between a call's `(` and its matching `)`, starting at the index of the name. */
const argRegion = (src, nameEnd) => {
  let i = nameEnd;
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] !== '(') return '';
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '(') depth++;
    else if (src[j] === ')') { depth--; if (!depth) return src.slice(i + 1, j); }
  }
  return src.slice(i + 1);
};

/** Functions defined in this file whose own body spawns — `runTool` is the motivating case. */
export const localRunners = (src) => {
  const masked = codeMask(src);
  const out = new Set();
  const decls = [
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /function\s+([A-Za-z_$][\w$]*)\s*\(/g,
  ];
  for (const re of decls) {
    for (const m of masked.matchAll(re)) {
      // A generous window: the runner wrappers in this tree are one-liners or short blocks.
      const body = masked.slice(m.index, m.index + 400);
      if (SPAWN_FNS.some((f) => new RegExp(`\\b${f}\\s*\\(`).test(body))) out.add(m[1]);
    }
  }
  return [...out];
};

export const buildGraph = () => {
  const files = [];
  for (const d of DIRS) if (existsSync(d)) for (const f of readdirSync(d).filter((x) => x.endsWith('.mjs')).sort()) files.push(`${d}/${f}`);
  const src = new Map(files.map((p) => [p, readFileSync(p, 'utf8')]));
  const forms = MAPPED_FORMS();

  const expand = (s) => (s.includes('${') ? forms.map((f) => s.replace(/\$\{[^}]*\}/g, f)) : [s]);
  const resolveName = (name, from) => {
    if (name.includes('/')) return src.has(name) ? name : null;
    for (const d of [dirOf(from), ...DIRS]) if (src.has(`${d}/${name}`)) return `${d}/${name}`;
    return null;
  };

  const importEdges = (p) => {
    const out = [];
    for (const m of keepStrings(src.get(p)).matchAll(/(?:from\s*|import\(\s*)['"](\.[^'"]+\.mjs)['"]/g)) {
      const abs = new URL(m[1], `file:///x/${p}`).pathname.slice(3);
      if (src.has(abs)) out.push(abs);
    }
    return out;
  };

  // TWO MASKS AT ONCE, AND THE PAIRING IS THE POINT. The CALL SITE is found in the code-masked
  // text, so a `spawnSync(` sitting inside a string cannot be one; the ARGUMENT REGION is then
  // read from the string-preserving text at the SAME INDEX, because that is where the path is.
  // Both masks blank in place and preserve length, so one index addresses both.
  //
  // Without the pairing, guard-sweep.mjs's register — which quotes `spawnSync(process.execPath,
  // ['-e'` as the ANCHOR TEXT of entry [G-15] — reads as a spawn call, and the argument region
  // then runs on through the rest of that register and turns every tool it names into an edge.
  // That is how `correlate-labels.mjs` came out reachable a second time.
  const spawnEdges = (p) => {
    const code = codeMask(src.get(p));
    const text = keepStrings(src.get(p));
    const callers = [...SPAWN_FNS, ...localRunners(src.get(p))];
    const out = new Set();
    for (const fn of callers)
      for (const m of code.matchAll(new RegExp(`\\b${fn}\\b`, 'g'))) {
        const region = argRegion(text, m.index + fn.length);
        for (const nm of region.matchAll(NAME_IN_STRING))
          for (const cand of expand(nm[0])) { const r = resolveName(cand, p); if (r && r !== p) out.add(r); }
      }
    // ── THE ONE DECLARED DYNAMIC DISCOVERY ────────────────────────────────────────────────
    //
    // rerun-regression.mjs does not name the tools it runs. [R-30] requires its population to be
    // DISCOVERED, and its header declares both halves: generators out of each
    // `fields.<form>.json`'s own `meta.generator` ([R-19]), fetchers by the glob
    // `adapters/hubspot/hs-fetch-<form>.mjs` over MAPPED_FORMS().
    //
    // Neither is a string in its source, so no static edge could see either, and the first draft
    // of this file reported ELEVEN tools unrun that the full regression runs on every pass —
    // five fetchers, five generators, and a deriver. Registering eleven true statements as
    // manual exclusions would have been eleven lies with reasons attached.
    //
    // So the discovery is modelled here from the same two sources, which means it cannot drift
    // from what that tool does without the artefact or the glob changing under both.
    if (p === 'adapters/hubspot/rerun-regression.mjs') {
      for (const form of forms) {
        const fetcher = `adapters/hubspot/hs-fetch-${form}.mjs`;
        if (src.has(fetcher)) out.add(fetcher);
        const defs = `adapters/hubspot/fields.${form}.json`;
        if (existsSync(defs)) {
          let gen = null;
          try { gen = JSON.parse(readFileSync(defs, 'utf8'))?.meta?.generator ?? null; } catch { gen = null; }
          if (gen && src.has(gen)) out.add(gen);
        }
      }
    }
    return [...out];
  };

  const tools = files.filter((p) => DOCUMENTS_CLI.test(src.get(p)) || CAN_FAIL.test(codeMask(src.get(p))));
  const needsSpawn = new Set(files.filter((p) => HAS_CLI_GUARD.test(codeMask(src.get(p)))));

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const roots = new Map();
  for (const [name, cmd] of Object.entries(pkg.scripts || {}))
    for (const m of String(cmd).matchAll(/adapters\/(?:pdf|hubspot)\/[\w.-]+\.mjs/g))
      if (src.has(m[0]) && !roots.has(m[0])) roots.set(m[0], `npm run ${name}`);

  const route = new Map(roots);
  const spawned = new Set(roots.keys());
  const queue = [...roots.keys()];
  while (queue.length) {
    const p = queue.shift();
    for (const q of spawnEdges(p)) { spawned.add(q); if (!route.has(q)) { route.set(q, `${route.get(p)} -> ${p}`); queue.push(q); } }
    for (const q of importEdges(p)) if (!route.has(q)) { route.set(q, `${route.get(p)} -> imported by ${p}`); queue.push(q); }
  }

  const exercised = (p) => (needsSpawn.has(p) ? spawned.has(p) : route.has(p));
  return { files, src, tools, roots, route, spawned, needsSpawn, exercised, forms, importEdges, spawnEdges };
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE MANUAL REGISTER — an exclusion, so a claim, so checked  [R-14]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A tool here is one the standing suite deliberately does not run. Each entry carries the
// reason, and the reason is CHECKED against the tree rather than believed: an entry naming a
// file that is not there is a STOP, and an entry naming a tool that IS reached is a STOP too,
// because a stale excuse standing over a tool the suite now runs is an excuse nobody re-reads.
//
// `ground` is the machine-checkable half. Each is a predicate over the tool's own source, so an
// edit that makes the reason false fails here instead of inheriting it.
export const MANUAL = [
  { id: 'MR-1', tool: 'adapters/hubspot/hs-provision.mjs', ground: 'writes',
    reason: 'CREATES PERMANENT HUBSPOT PROPERTIES. HubSpot does not free a name and the portal holds 884 of a documented 1,000 ([R-32]), so a suite that ran this on every regression would spend the headroom the next form needs. It is driven by hand, after [R-23]\'s derive-assert-dry-run sequence.' },
  { id: 'MR-2', tool: 'adapters/hubspot/hs-purge-properties.mjs', ground: 'writes',
    reason: 'DESTRUCTIVE — archives properties. Running it on a schedule is the failure mode, not the safeguard.' },
  { id: 'MR-3', tool: 'adapters/hubspot/hs-purge-contacts.mjs', ground: 'writes',
    reason: 'DESTRUCTIVE — deletes contacts. Same ground as [MR-2].' },
  { id: 'MR-4', tool: 'adapters/hubspot/hs-teardown-contact.mjs', ground: 'writes',
    reason: 'DESTRUCTIVE — deletes one synthetic probe contact and verifies its absence. It is the teardown half of [R-24] and is driven by the run that seeded the probe.' },
  { id: 'MR-5', tool: 'adapters/hubspot/hs-seed-synthetic.mjs', ground: 'writes',
    reason: 'WRITES a synthetic probe contact to the live portal. [R-24] requires a probe to be REGISTERED WHEN SEEDED, so a suite that seeded one unattended would be manufacturing exactly the unregistered probe that rule exists to prevent.' },
  { id: 'MR-6', tool: 'adapters/hubspot/hs-deprecate-property.mjs', ground: 'writes',
    reason: 'WRITES a property description on the live portal. Hand-driven, one property at a time, with a before/after read either side.' },
  { id: 'MR-7', tool: 'adapters/hubspot/hs-describe-reused-433b.mjs', ground: 'writes',
    reason: 'WRITES shared property descriptions on the live portal — the pass whose LAST run broke derive-names-433boi.mjs seven prompts later ([D-18]). Its effect is guarded by rerun-regression.mjs, which re-runs every deriver against the descriptions this leaves behind; the writer itself stays manual.' },
  { id: 'MR-8', tool: 'adapters/hubspot/hs-extend-options.mjs', ground: 'writes',
    reason: 'WRITES enumeration options onto live properties.' },
  { id: 'MR-9', tool: 'adapters/hubspot/hs-backup-contacts.mjs', ground: 'writes',
    reason: 'Writes a portal backup into adapters/hubspot/backup/. It is the safety net taken BEFORE a destructive run, so its schedule is that run\'s schedule.' },
  { id: 'MR-10', tool: 'adapters/hubspot/hs-preflight.mjs', ground: 'portal',
    reason: 'A CREDENTIAL PROBE, not an assertion: it reports what this key can and cannot read, and four of its endpoints 404 by design ([R-32] records that HubSpot publishes the ceiling only inside a 400). It has no pass to report and nothing to regress.' },
  { id: 'MR-11', tool: 'adapters/hubspot/hs-audit-properties.mjs', ground: 'portal',
    reason: 'A portal inventory read for a person, not a predicate. It prints what is live; it asserts nothing.' },
  { id: 'MR-12', tool: 'adapters/hubspot/hs-dryrun-433aoi.mjs', ground: 'portal',
    reason: 'The 433-A(OIC) provisioning dry run. Its two live siblings are wired at `dryrun:433b` and `dryrun:433boi`; this one is the sequence\'s finished first form and is driven by hand when its map moves. A dry run reads the portal and writes nothing, so the ground here is cost and not danger — and it is stated as such rather than borrowed from [MR-1].' },
  { id: 'MR-13', tool: 'adapters/hubspot/hs-readback-433aoi.mjs', ground: 'portal',
    reason: 'The 433-A(OIC) post-provisioning read-back, the pair of [MR-12], and manual for the same reason.' },
  { id: 'MR-14', tool: 'adapters/hubspot/hs-verify-provision.mjs', ground: 'portal',
    reason: 'Reads every provisioned property back from the portal and compares it against its definition file. It is [EX-18]\'s named cross-check and runs at provisioning time, against the run that created the properties.' },
  { id: 'MR-16', tool: 'adapters/pdf/correlate-labels.mjs', ground: 'authoring',
    reason: 'AN AUTHORING INSTRUMENT, and the one this rule was written next to. [D-22] records it answering a caption-LEFT probe with a banner one row up on 433-B and again on 433-D, and its own header carries the sentence refusing to retune the probes to it. It emits a labels file that a map is then authored against BY HAND; it verifies nothing, and 433-B and 433-D are both mapped without one. Running it in a sweep would regenerate two forms\' labels files on every run and assert nothing about either.' },
  { id: 'MR-17', tool: 'adapters/pdf/compare-filled.mjs', ground: 'authoring',
    reason: 'A DIFF READER for a person: it prints what two filled PDFs disagree about. The gate\'s step 8 is what asserts a written value is drawn ([R-28]); this exists to be read while working out why one is not.' },
  { id: 'MR-18', tool: 'adapters/pdf/enumerate-fields.mjs', ground: 'authoring',
    reason: 'Prints a form\'s AcroForm field list. It is the INPUT to authoring a map, and gate step 3 (validate-map) is what holds a map to it. Nothing it prints is a verdict.' },
  { id: 'MR-19', tool: 'adapters/pdf/line-markers.mjs', ground: 'authoring',
    reason: 'Prints the printed LINE MARKERS drawn on one form\'s pages, for a person deciding what a cell is. It takes a form argument and exits 2 with a usage line when given none, so it has no whole-tree run to wire. blanket-audit.mjs already disposes of it as not-a-detector on the ground that it reports its own total and a zero prints as zero ([G-32]).' },
  { id: 'MR-20', tool: 'adapters/pdf/money-probe.mjs', ground: 'authoring',
    reason: 'Prints the money-shaped text drawn on chosen pages of one form, for a person deciding whether a cell is money — which [R-09] requires to be DECLARED and never inferred. Per form and per page by argument; exits 2 with a usage line with none.' },
  { id: 'MR-21', tool: 'adapters/pdf/render-review.mjs', ground: 'authoring',
    reason: 'Renders a filled form to an HTML review page for a person to read. It asserts nothing — blanket-audit.mjs disposes of it as not-a-detector in those words — and it takes a form, a record and a filled PDF, exiting 2 with a usage line when run bare.' },
];

const GROUNDS = {
  // EVERY GROUND READS keepStrings AND NOT codeMask, and the first draft got it wrong. An HTTP
  // METHOD IS A STRING — `method: 'DELETE'` — so codeMask, which blanks string interiors, turned
  // every destructive tool in this directory into one whose ground "does not bear out" that it
  // writes. Nine entries reported GROUND IS FALSE in one run. The mask that answers a question
  // about a call site is the wrong mask for a question about a value, which is the same
  // distinction the two edge kinds above rest on.
  writes: {
    what: 'the tool sends a mutating request to the live portal',
    holds: (src) => /method:\s*['"`](POST|PATCH|PUT|DELETE)['"`]/.test(keepStrings(src)) || /\bmethod\s*:\s*[A-Za-z_$]/.test(keepStrings(src)),
  },
  portal: {
    what: 'the tool reads the live portal, so it cannot run on a checkout with no credential',
    holds: (src) => /hs-lib\.mjs/.test(keepStrings(src)),
  },
  authoring: {
    what: 'the tool emits or prints material for a person to author against, and asserts nothing',
    holds: (src) => !/hs-lib\.mjs/.test(keepStrings(src)),
  },
};

// ── THE GRAPH'S OWN CANARY, IN BOTH DIRECTIONS ────────────────────────────────────────────
//
// A graph too loose and a graph too tight both report clean, and this one was BOTH inside one
// commit — first accepting an import edge for a CLI-guarded tool, then accepting any `.mjs`
// string in any spawning file. Each draft certified `correlate-labels.mjs`, the tool [D-22] says
// nothing runs. So the edge reader is asked six questions with known answers on every run.
export const graphCanary = (g) => {
  const dead = [];
  const ask = (name, got, want) => { if (got !== want) dead.push(`GRAPH CANARY DEAD  ${name}: reader said ${got}, expected ${want}. Every route above is unreliable.`); };

  // A spawn call's argument region yields the name; a message string elsewhere does not.
  const probe = (body) => {
    const fake = `import { spawnSync } from 'node:child_process';\n${body}\n`;
    const out = new Set();
    const text = keepStrings(fake);
    for (const fn of ['spawnSync', ...localRunners(fake)])
      for (const m of text.matchAll(new RegExp(`\\b${fn}\\b`, 'g'))) {
        const region = argRegion(text, m.index + fn.length);
        for (const nm of region.matchAll(NAME_IN_STRING)) out.add(nm[0]);
      }
    return out;
  };

  ask('a  a direct spawn argument IS an edge', probe(`spawnSync(process.execPath, ['adapters/pdf/validate-map.mjs']);`).has('adapters/pdf/validate-map.mjs'), true);
  ask('b  a local runner wrapper IS an edge', probe(`const runTool = (s, a) => spawnSync(process.execPath, [\`adapters/pdf/\${s}\`, ...a]);\nrunTool('verify-appearances.mjs', []);`).has('verify-appearances.mjs'), true);
  ask('c  a name in a MESSAGE string is NOT an edge', probe(`spawnSync(process.execPath, ['adapters/pdf/validate-map.mjs']);\nconsole.log('see adapters/pdf/correlate-labels.mjs for the labels');`).has('adapters/pdf/correlate-labels.mjs'), false);
  ask('d  a name in a REGISTER is NOT an edge', probe(`spawnSync(process.execPath, ['x.mjs']);\nconst REG = [{ tool: 'adapters/pdf/correlate-labels.mjs' }];`).has('adapters/pdf/correlate-labels.mjs'), false);

  // The two edge kinds are not interchangeable, and the population knows which it needs.
  ask('e  a CLI-guarded tool needs a SPAWN, not an import', g.needsSpawn.has('adapters/pdf/success-sweep.mjs'), true);
  ask('f  the form set behind `${form}` is DERIVED, never listed', g.forms.length > 0 && g.forms.every((f) => typeof f === 'string' && f.length > 0), true);
  return dead;
};

// ---------------------------------------------------------------------------------------
export const run = () => {
  const g = buildGraph();
  // A PLAIN CALL, NOT A METHOD CALL. [D-09]: exclusion-sweep.mjs attributes an excusal to the
  // predicate NAMED in the condition, and `exercised(p)` reads as a method on g rather than as
  // this file's registered predicate — so the [EX-38] entry stood over a call it was not about.
  // Binding it here makes the attribution true instead of re-pointing the register at a shadow.
  const { exercised } = g;
  const problems = [...graphCanary(g)];
  const registered = new Map(MANUAL.map((m) => [m.tool, m]));

  const unreached = g.tools.filter((p) => !exercised(p));
  const unregistered = unreached.filter((p) => !registered.has(p));

  for (const p of unregistered)
    problems.push(`UNRUN AND UNREGISTERED  ${p}\n      Nothing in package.json reaches it, by a script, by a spawn, or through a tool that does.\n      A tool nobody runs is a tool nobody knows is broken — assert-row-class-routes.mjs was exiting 2 for two prompts in this exact state.\n      Wire it into \`npm run sweeps\` or a gate step, or register it in MANUAL here with a reason that is true of it.`);

  for (const m of MANUAL) {
    if (!existsSync(m.tool)) { problems.push(`STALE REGISTER  [${m.id}] names ${m.tool}, which is not in the tree.`); continue; }
    const src = readFileSync(m.tool, 'utf8');
    if (!GROUNDS[m.ground]) { problems.push(`[${m.id}] declares ground "${m.ground}", which is not one of ${Object.keys(GROUNDS).join(', ')}.`); continue; }
    if (!GROUNDS[m.ground].holds(src))
      problems.push(`GROUND IS FALSE  [${m.id}] ${m.tool} is excused on the ground that ${GROUNDS[m.ground].what}, and its source does not bear that out.`);
    // AN EXCUSE OVER A TOOL THE SUITE RUNS IS AN EXCUSE NOBODY RE-READS. There is no exemption
    // from this, and there deliberately is not one: the first draft carried a ground of "none"
    // for derive-names-433aoi.mjs, whose stated reason was that rerun-regression.mjs discovers
    // it out of fields.433aoi.json's meta.generator and no static edge could see that. The
    // reason was TRUE, which made it the most dangerous kind of entry — a correct sentence
    // standing in for a graph that could not answer. Modelling the discovery instead ([R-31]:
    // the structural answer over the current reading) made the entry unnecessary and deleted
    // it, and eleven others with it. A register entry is what is left when nothing derives it.
    if (exercised(m.tool))
      problems.push(`STALE REGISTER  [${m.id}] excuses ${m.tool} as manual, and the suite now RUNS it via ${g.route.get(m.tool)}. An excuse standing over a tool that is run is an excuse nobody re-reads — remove it.`);
  }

  return { g, problems, unreached, unregistered, registered };
};

export const report = (o) => {
  const { g } = o;
  const { exercised } = g;
  const manualReached = MANUAL.filter((m) => exercised(m.tool)).length;
  console.log(`reachability: ${g.files.length} file(s) under ${DIRS.join(', ')}; ${g.tools.length} are tools (self-documented CLI or can exit non-zero)`);
  console.log(`              ${g.roots.size} named directly in a package.json script; ${g.tools.filter((p) => exercised(p)).length} of ${g.tools.length} tool(s) are run by the standing suite`);
  console.log(`              ${g.needsSpawn.size} file(s) hide their body behind a CLI guard and therefore need a SPAWN, not an import`);
  console.log(`              ${MANUAL.length} registered manual, of which ${manualReached} turn out to be reached (0 is the healthy figure)`);
  console.log(`              canary: ${6 - graphCanary(g).length}/6 edge classifications still correct in both directions`);
  if (verbose) {
    for (const p of g.tools) console.log(`    ${exercised(p) ? 'run    ' : 'MANUAL '} ${p.padEnd(48)} ${exercised(p) ? g.route.get(p) : (o.registered.get(p)?.id ?? 'UNREGISTERED')}`);
  }
  examined('assert-reachability', 'engine', g.tools.length, 'tools-in-the-tree');
  examined('assert-reachability', 'engine', o.unreached.length, 'tools-the-suite-does-not-run');

  if (!o.problems.length) {
    console.log(`OK — every one of ${g.tools.length} tool(s) is run by the standing suite or registered manual with a ground the tree bears out; ${o.unreached.length} are manual and all ${o.unreached.length} are registered.`);
    return 0;
  }
  console.error(`REACHABILITY — ${o.problems.length} problem(s):`);
  o.problems.forEach((p) => console.error(`  ${p}`));
  return o.problems.length;
};

// CLI
if (process.argv[1] && /assert-reachability\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const o = run();
  const code = report(o) ? 2 : 0;
  // --run: EXERCISE THE MANUAL POPULATION ANYWAY, once, reporting what each says. This is not
  // part of the standing verdict — four of them are destructive and this flag must never be put
  // in a script — but the ruling that earned this file asked what every unreachable tool says on
  // its FIRST run, and a register is a poor substitute for having asked.
  if (doRun) {
    console.log('\n--run: the manual population, exercised (verdicts are REPORTED, not judged):');
    for (const m of MANUAL) {
      if (GROUNDS[m.ground] && (m.ground === 'writes')) { console.log(`  [${m.id}] ${m.tool}  SKIPPED — declared ground "writes"; running it would mutate the live portal.`); continue; }
      const r = spawnSync(process.execPath, [m.tool], { encoding: 'utf8' });
      const first = String(r.stdout || r.stderr || '').split('\n').filter(Boolean)[0] || '(no output)';
      console.log(`  [${m.id}] ${m.tool}  exit ${r.status}  ${first.slice(0, 150)}`);
    }
  }
  process.exitCode = code;
}
