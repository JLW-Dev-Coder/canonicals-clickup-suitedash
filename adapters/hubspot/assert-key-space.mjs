// THE KEY SPACE IS A POPULATION SELECTOR, SO IT GETS A CANARY.
//
//   node adapters/hubspot/assert-key-space.mjs            # every mapped form
//   node adapters/hubspot/assert-key-space.mjs <form>     # one form
//   node adapters/hubspot/assert-key-space.mjs --canary   # the planted cases only
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `keySpaceOf` in adapters/hubspot/classification-coverage.mjs decides WHICH KEYS EXIST for a
// form. Every assertion downstream — one key one entry, the coverage blanket counted by key,
// A1's "this input reaches the page from no property" — is asked OF THAT SET. A key the
// selector cannot see is not a key any of them can fail on.
//
// Until this commit the checkbox half of the selector was `typeof v === 'object' &&
// !Array.isArray(v)`, which admits an option set and drops everything else without saying so.
// On 433-D that dropped all three LONE TICKS — the form draws itself twice, so a lone tick is
// one key with two targets, written as an array — and the crosswalk classification then STOPped
// naming `433d_submit_a_new`, `433d_unable_to_make` and `433d_check_box_if` as "not an engine
// input on this form". The assertion was firing correctly against a population that was wrong.
//
// THAT IS [R-17]'S SECOND INSTANCE EXACTLY: assert-y-convention.mjs's canary covered the
// COMPARATOR and not the POPULATION SELECTOR, so a file invisible to the completeness check
// reported clean for three prompts. A canary over the thing that decides who is examined is the
// one this engine has now been bitten by twice.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY PLANTS THE OLD PREDICATE AS THE DEFECT IT WAS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [KS-5] runs the SUPERSEDED predicate over a planted map and requires it to MISS the mirrored
// lone tick. If it stops missing it, the plant has stopped reproducing what it stands for and
// the canary is worthless — so that is a STOP, not a pass. It is the same construction
// adapters/pdf/subject-class.mjs uses for the caption join at [R-36], and for the same reason:
// a plant that no longer reproduces its defect certifies nothing.
//
// [R-28]: this is an IN-PROCESS canary. It has no multi-step run, so "at the step" has no
// referent; the convention that stands in its place is the planted defect found BY NAME and a
// conforming input still accepted, and both directions are planted below.

import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { keySpaceOf, ENGINE_EXTRA_INPUTS } from './classification-coverage.mjs';

/**
 * THE CLAUSES, DECLARED SO THEY CAN BE REGISTERED. adapters/pdf/register-ids.mjs holds the
 * `engine` namespace and a `KS-` id colliding with another register's is exactly the class
 * [R-12] records — an id reused in silence, the symptom surfacing two tools away.
 */
export const CLAUSES = [
  { id: 'KS-0', what: 'the swept set is discovered from the maps directory and every candidate parses and declares its own name. An unreadable map is a finding, not a form that is absent.' },
  { id: 'KS-1', what: 'every checkbox construct is in one of the three declared shapes — option set, lone tick as an array of targets, lone tick as a single target. A value in none of them is REFUSED, never dropped.' },
  { id: 'KS-2', what: 'a `checkboxes._binds` row-level exclusion is CROSS-CHECKED: the group it names must contribute a source key that is in this same key space. An exclusion whose replacement is absent is a key dropped with a sentence in front of it.' },
  { id: 'KS-3', what: 'every ENGINE_EXTRA_INPUTS row is live — invisible to the map, which is its stated ground, or a declared alias of a key the map now yields. A row that is neither is a declaration about nothing.' },
  { id: 'KS-4', what: 'no member is empty or underscore-prefixed.' },
  { id: 'KS-5', what: 'the planted cases hold, AND the superseded predicate still MISSES the mirrored lone tick. A plant that has stopped reproducing its defect certifies nothing, so that is a STOP rather than a pass.' },
];

// RUN STANDALONE ONLY. adapters/pdf/register-ids.mjs imports CLAUSES above to register the
// `KS-` ids, and an import that ran the whole guard would make the id sweep exit on this
// file's verdict rather than on its own. pathToFileURL, not string surgery: on Windows a
// hand-built file:// URL differs from import.meta.url in both slash count and drive-letter
// case, and the guard then silently never fires — which is what a tool that exits 0 on
// failure looks like ([R-11]).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const canaryOnly = argv.includes('--canary');
  const verbose = argv.includes('--verbose');
  const only = argv.filter((a) => !a.startsWith('--'));
  const MAPS = 'adapters/pdf/maps';

  const problems = [];
  const P = (id, m) => {
    if (!CLAUSES.some((c) => c.id === id)) throw new Error(`assert-key-space: "${id}" is not a declared clause. An id this file reports under and does not declare is one register-ids.mjs cannot see.`);
    problems.push(`[${id}] ${m}`);
  };

  // ── THE POPULATION, DISCOVERED ────────────────────────────────────────────────────────────
  // The swept set is declared in three lines and then printed, which is [R-15]. A form is a map
  // file named `<form>.map.json` that parses and declares a `form` id agreeing with its name.
  const DIRECTORY = MAPS, FILTER = 'ends ".map.json", does not start "_"', CLASSIFIER = 'the file parses and its `form` field equals the name';
  const forms = [];
  for (const f of readdirSync(DIRECTORY).sort()) {
    if (!f.endsWith('.map.json') || f.startsWith('_')) continue;
    const name = f.slice(0, -'.map.json'.length);
    let doc; try { doc = JSON.parse(readFileSync(`${DIRECTORY}/${f}`, 'utf8')); } catch (e) { P('KS-0', `${f} does not parse: ${e.message}. An unreadable map is a finding, not a form that is absent.`); continue; }
    if (doc.form !== name) { P('KS-0', `${f} declares form "${doc.form}", which is not "${name}".`); continue; }
    forms.push({ name, doc });
  }
  const targets = only.length ? forms.filter((f) => only.includes(f.name)) : forms;
  if (only.length && targets.length !== only.length) { console.error(`STOP — asked for [${only}] and the tree has [${forms.map((f) => f.name)}].`); process.exit(2); }

  // ── THE CANARY ────────────────────────────────────────────────────────────────────────────
  // Every case names what it plants and what the selector must say about it. A case whose
  // expectation is met for the wrong reason is what `wanted` guards against: it is compared as a
  // sorted list of members, never as a count.
  const OLD_PREDICATE = (mapDoc) => {           // verbatim, as it stood before this commit
    const s = new Set();
    for (const k of Object.keys(mapDoc.map || {})) if (!k.startsWith('_')) s.add(k);
    for (const [k, v] of Object.entries(mapDoc.checkboxes || {})) if (!k.startsWith('_') && v && typeof v === 'object' && !Array.isArray(v)) s.add(k);
    return s;
  };

  const CASES = [
    { name: 'option set is a member',
      map: { form: 'zz', checkboxes: { opt: { yes: 'T1', no: 'T2' } } },
      wanted: ['opt'] },
    { name: 'MIRRORED LONE TICK is a member — the defect this file was written for',
      map: { form: 'zz', checkboxes: { tick: ['T1', 'T3'] } },
      wanted: ['tick'] },
    { name: 'single-target lone tick is a member',
      map: { form: 'zz', checkboxes: { tick: 'T1' } },
      wanted: ['tick'] },
    { name: 'a `_binds` row-level construct is NOT a member; the group source key carries the fact',
      map: { form: 'zz', groups: { rows: { source: 'rows' } }, checkboxes: { _binds: { flag: { group: 'rows', column: 'is_x' } }, flag: ['T1', 'T2'] } },
      wanted: ['rows'] },
    { name: 'an underscore key is never a member',
      map: { form: 'zz', checkboxes: { _binds_why: 'prose', opt: { yes: 'T1' } } },
      wanted: ['opt'] },
    { name: 'the prefixed spelling wins where ENGINE_EXTRA_INPUTS declares it',
      map: { form: '433f', checkboxes: { address_differs: 'T1' } },
      wanted: ['433f_address_differs'] },
    { name: 'a checkbox value in none of the declared shapes is REFUSED, not dropped',
      map: { form: 'zz', checkboxes: { weird: [{ a: 'T1' }] } },
      wantedProblem: 'is in none of the three declared shapes' },
    { name: 'a `_binds` row naming a group the map does not declare is REFUSED',
      map: { form: 'zz', checkboxes: { _binds: { flag: { group: 'nope', column: 'c' } }, flag: ['T1'] } },
      wantedProblem: 'which this map does not declare' },
  ];

  let canaryPass = 0;
  for (const c of CASES) {
    const { keySpace, problems: probs } = keySpaceOf(c.map);
    if (c.wantedProblem) {
      if (probs.some((p) => p.includes(c.wantedProblem))) canaryPass++;
      else P('KS-5', `canary "${c.name}": expected a problem containing ${JSON.stringify(c.wantedProblem)} and got [${probs.join(' | ') || 'none'}].`);
      continue;
    }
    const got = [...keySpace.keys()].sort();
    if (got.join(',') === [...c.wanted].sort().join(',') && !probs.length) canaryPass++;
    else P('KS-5', `canary "${c.name}": expected members [${[...c.wanted].sort()}] and got [${got}]${probs.length ? ` with problems [${probs.join(' | ')}]` : ''}.`);
  }

  // THE PLANT MUST STILL REPRODUCE ITS DEFECT. If the superseded predicate stops missing the
  // mirrored lone tick, this canary is certifying nothing and that is a STOP.
  {
    const planted = { form: 'zz', checkboxes: { tick: ['T1', 'T3'] } };
    const oldSaw = OLD_PREDICATE(planted).has('tick');
    const newSees = keySpaceOf(planted).keySpace.has('tick');
    if (oldSaw) P('KS-5', 'THE PLANT IS DEAD: the superseded predicate now ADMITS a mirrored lone tick, so the canary above no longer reproduces the defect it stands for. Nothing here is evidence until the plant is repaired.');
    else if (!newSees) P('KS-5', 'the corrected predicate does not admit a mirrored lone tick, which is the whole of the fix.');
    else canaryPass++;
  }

  console.log('assert-key-space — the population selector every downstream assertion is asked of');
  console.log(`  swept:  ${DIRECTORY} — ${FILTER}; classified by ${CLASSIFIER}`);
  console.log(`  forms:  ${forms.length} discovered — ${forms.map((f) => f.name).join(', ')}`);
  console.log(`  canary: ${canaryPass} of ${CASES.length + 1} planted case(s) held, the superseded predicate among them`);

  // ── THE FORMS ─────────────────────────────────────────────────────────────────────────────
  let examined = 0;
  for (const { name, doc } of targets) {
    const { keySpace, groupSource, rowLevel, checkboxShape, aliases, problems: probs } = keySpaceOf(doc);

    // [KS-1] every checkbox construct is in a declared shape.
    for (const p of probs) P('KS-1', `${name}: ${p}`);

    // [KS-2] the row-level exclusion is CROSS-CHECKED, not merely declared: the group it names
    // must contribute its source key to this very key space. An exclusion whose replacement is
    // not there is a key dropped, which is [R-14] with a sentence in front of it.
    for (const [k, d] of rowLevel) {
      const src = groupSource[d.group];
      if (!src) P('KS-2', `${name}: checkboxes._binds["${k}"] excuses the key on group "${d.group}", which contributes no source key.`);
      else if (!keySpace.has(src)) P('KS-2', `${name}: checkboxes._binds["${k}"] excuses the key on group "${d.group}", whose source key "${src}" is not in the key space. The fact would reach the engine from nothing.`);
    }

    // [KS-3] every ENGINE_EXTRA_INPUTS row is live: it is in the key space, either because the
    // map cannot see it (its stated ground) or because it is the canonical spelling of a key the
    // map CAN now see (an alias). A row in neither state is a declaration about nothing.
    for (const k of (ENGINE_EXTRA_INPUTS[name] || [])) {
      const isAlias = [...aliases.values()].includes(k);
      if (isAlias) continue;
      if (keySpace.has(k)) P('KS-3', `${name}: ENGINE_EXTRA_INPUTS names "${k}", which the map already yields under that exact spelling. The row's stated ground — that the key space cannot see it — is false of it.`);
    }

    // [KS-4] no member is empty or underscore-prefixed.
    for (const k of keySpace.keys()) if (!k || k.startsWith('_')) P('KS-4', `${name}: "${k}" is not a usable input key.`);

    const byConstruct = {};
    for (const v of keySpace.values()) byConstruct[v] = (byConstruct[v] || 0) + 1;
    const shapes = {};
    for (const s of checkboxShape.values()) shapes[s] = (shapes[s] || 0) + 1;

    examined += keySpace.size;
    console.log(`EXAMINED assert-key-space ${name} ${keySpace.size} engine-input-keys`);
    console.log(`  ${name}: ${keySpace.size} member(s) — ${Object.entries(byConstruct).map(([c, n]) => `${n} ${c}`).join(', ')}`);
    if (checkboxShape.size) console.log(`    checkbox shapes: ${Object.entries(shapes).map(([s, n]) => `${n} ${s}`).join(', ')}`);
    if (rowLevel.size) console.log(`    row-level, excluded by checkboxes._binds: ${[...rowLevel.keys()].join(', ')}`);
    if (aliases.size) console.log(`    prefix alias(es): ${[...aliases].map(([a, c]) => `${a} -> ${c}`).join(', ')}`);
    if (verbose) console.log(`    ${[...keySpace.keys()].sort().join(', ')}`);
  }

  if (canaryOnly && !only.length) { /* the canary ran above; the per-form pass still ran and is reported */ }

  if (problems.length) {
    console.error(`\nSTOP — ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(2);
  }
  console.log(`\nOK — ${examined} engine input key(s) across ${targets.length} form(s); every checkbox construct is in a declared shape, every row-level exclusion is answered by a group source key in the same key space, and every ENGINE_EXTRA_INPUTS row is either invisible to the map or a declared alias.`);

}
