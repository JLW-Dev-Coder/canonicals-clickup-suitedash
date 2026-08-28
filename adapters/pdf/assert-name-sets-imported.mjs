// assert-name-sets-imported.mjs — item H of prompt 59-A, and the sweep [R-43] rests on.
//
// THE DEFECT THAT EARNED IT. scratchpad/p59-regression.mjs derived every fixture role it found
// in samples/ and fed each one to run-form-gate as a singleton `--role`. Two of them —
// `record_shape` and `branch` — are SET roles, and adapters/pdf/resolve-fixture.mjs EXPORTS
// `SET_ROLES` saying so. The runner had retyped the role vocabulary instead of importing it, so
// it asked resolve-fixture a question that file exists to refuse, and two steps went red for
// asking wrongly rather than for anything being wrong.
//
// A retyped list does not fail. It DIVERGES, quietly, at whatever moment the source list
// changes — and the moment it diverges is not the moment anybody looks.
//
// WHAT THIS SWEEP CAN AND CANNOT SEE, stated rather than left as a silence ([R-14]).
//   CAN: a module exporting a set of string literals, and another file in the tree building a
//        bracketed literal that contains EVERY member of it, while not importing it.
//   CANNOT: a set built by computation; a set spelled with different member strings for the
//        same concept; a PARTIAL retyping that omits a member; or a LONGER list that merely
//        contains the set. The predicate requires every
//        member, so a retyping that drops one is invisible here — and a dropped member is the
//        more dangerous defect. The blind spot is reported rather than implied away.
//
// [R-19] GENERATOR DECLARATION: this file generates nothing. It asserts.
//
// usage: node adapters/pdf/assert-name-sets-imported.mjs [--verbose]

import { readdirSync, readFileSync, statSync } from 'node:fs';

const verbose = process.argv.includes('--verbose');
const ROOTS = ['adapters/pdf', 'adapters/hubspot', 'adapters/clickup', 'scratchpad'];

const files = [];
for (const root of ROOTS) {
  let names = [];
  try { names = readdirSync(root); } catch { continue; }
  for (const f of names) {
    const p = `${root}/${f}`;
    try { if (statSync(p).isDirectory()) continue; } catch { continue; }
    if (p.endsWith('.mjs')) files.push(p);
  }
}
const src = new Map(files.map(p => [p, readFileSync(p, 'utf8')]));
console.log(`swept ${files.length} .mjs file(s) across ${ROOTS.join(', ')}`);

// ── THE DETECTOR, as one function over a source map ───────────────────────────
// Taking a Map rather than reading disk is what makes the canary below possible: the same
// code that sweeps the tree is run over a FIXED synthetic input with an asserted expected
// yield. A detector that silently stops reading reports a clean sweep, and this project has
// met that at five levels; the canary is the sixth answer to it.
function detect(src) {
  const decls = [];
  for (const [p, s] of src) {
    const re = /export\s+const\s+([A-Z][A-Z0-9_]{2,})\s*=\s*(?:new\s+Set\s*\(\s*)?\[([^\]]*)\]/g;
    for (const m of s.matchAll(re)) {
      const members = [...m[2].matchAll(/'([^']+)'|"([^"]+)"/g)].map(x => x[1] ?? x[2]);
      if (members.length < 2) continue;                 // a one-member set is not a vocabulary
      if (members.some(x => x.length < 2)) continue;    // punctuation tables are not name sets
      decls.push({ file: p, name: m[1], members });
    }
  }
  const hits = [];
  let checked = 0;
  for (const d of decls) {
    for (const [p, s] of src) {
      if (p === d.file) continue;
      checked++;
      const importsIt = new RegExp(`import\\s*\\{[^}]*\\b${d.name}\\b[^}]*\\}`).test(s);
      if (importsIt) continue;
      const allPresent = d.members.every(x => s.includes(`'${x}'`) || s.includes(`"${x}"`));
      if (!allPresent) continue;
      // SET EQUALITY, NOT CONTAINMENT — and the first draft used containment, which is why this
      // comment exists. A RETYPING is the same list written twice; a LONGER list that happens to
      // include those members is a different list about a different thing. Under containment this
      // file reported itself, because its four-element ROOTS contains every member of a
      // two-element DIRS, and it reported twenty-odd such pairs across the sweep tools. Equality
      // is what "retyped" actually means, and the superset case is declared as a blind spot below
      // rather than counted as a hit.
      const want = new Set(d.members);
      const bracketed = [...s.matchAll(/\[([^\]]*)\]/g)].some((b) => {
        const got = new Set([...b[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((x) => x[1] ?? x[2]));
        return got.size === want.size && [...want].every((x) => got.has(x));
      });
      if (!bracketed) continue;
      // The key carries the EXPORTER as well as the site: DIRS and SWEPT_DIRS are each exported
      // by more than one file, so a site::name key collides and the ratchet would dedupe two
      // distinct findings into one.
      hits.push({ site: p, name: d.name, from: d.file, key: `${p}::${d.name}@${d.file}` });
    }
  }
  return { decls, hits, checked };
}

// ── THE CANARY ──────────────────────────────────────────────────────────────
// A FIXED INPUT NOT DRAWN FROM THE ARTEFACTS, with an asserted expected yield, required of
// every detector by adapters/pdf/blanket-audit.mjs. Five planted files exercise the exact
// distinctions the predicate rests on: the declaring file, a true retyping, an importer that
// also holds the literal, a SUPERSET, and a SUBSET. The last two are the ones the first draft
// of this file got wrong, so a regression there is caught by construction rather than by
// somebody noticing twenty-odd phantom findings again.
const CANARY = new Map([
  // Assembled rather than written whole: if the literal text `export const FOO_SET = [...]`
  // appeared in this file, the sweep would find a 52nd declaration in its OWN source and the
  // count it reports of the real tree would be off by one. A canary must not enter the
  // population it is a canary for. That is [R-42], and this file is the defect that earned it.
  ['canary/a.mjs', 'export const ' + 'FOO_SET' + " = ['alpha', 'beta'];"],
  ['canary/b.mjs', "const mine = ['alpha', 'beta'];"],
  ['canary/c.mjs', "import { FOO_SET } from './a.mjs'; const mine = ['alpha', 'beta'];"],
  ['canary/d.mjs', "const mine = ['alpha', 'beta', 'gamma'];"],
  ['canary/e.mjs', "const mine = ['alpha'];"],
]);
const CANARY_EXPECT = ['canary/b.mjs::FOO_SET@canary/a.mjs'];
const cy = detect(CANARY);
const cyKeys = cy.hits.map((h) => h.key).sort();
const cyOK = cy.decls.length === 1 && cy.decls[0].name === 'FOO_SET' && cyKeys.length === CANARY_EXPECT.length && cyKeys.every((k, i) => k === CANARY_EXPECT[i]);
console.log(`canary: ${cy.decls.length} declaration(s), ${cy.hits.length} hit(s) — expected 1 and ${CANARY_EXPECT.length} — ${cyOK ? 'HOLDS' : 'DOES NOT HOLD'}`);
if (!cyOK) {
  console.error('STOP — the canary does not hold, so this sweep cannot be trusted over the real tree.');
  console.error(`  declarations: ${JSON.stringify(cy.decls.map((d) => d.name))}`);
  console.error(`  hits: ${JSON.stringify(cyKeys)} (expected ${JSON.stringify(CANARY_EXPECT)})`);
  process.exit(5);
}

const { decls, hits, checked } = detect(src);

// [R-04] ZERO EXAMINED IS NOT A PASS. If the declaration regex ever stops matching — a
// formatting change, a rename, a Set spelled another way — `decls` goes empty, every later loop
// iterates nothing, and the run would otherwise print OK over a sweep that read no name set at
// all. The BASELINE check below already turns that into a failure, because 24 baselined sites
// would go stale at once; this makes it fail for the RIGHT REASON and names it.
if (!decls.length) {
  console.error('STOP — no exported name set was found in any swept file. This tree is known to hold dozens, so a zero here is a dead reader rather than a clean result.');
  process.exit(4);
}
console.log(`exported name set(s) found: ${decls.length}`);
for (const d of decls) console.log(`  ${d.file} -> ${d.name} (${d.members.length}): ${d.members.slice(0, 6).join(', ')}${d.members.length > 6 ? ', …' : ''}`);


console.log(`\ncross-file checks performed: ${checked}`);

if (process.argv.includes('--emit-baseline')) {
  console.log(JSON.stringify(hits.map((h) => h.key).sort(), null, 1));
  process.exit(0);
}

// -- THE BASELINE, AND WHY THIS IS A RATCHET RATHER THAN A GREEN LIGHT --------------------
// Twenty-four sites already existed when this sweep was written, every one of them in the SWEEP
// ENGINE ITSELF: the directory vocabularies DIRS, SWEPT_DIRS, CANARY_DIRS and PRUNED are each
// written out longhand in several tools rather than imported from the one that exports them,
// and SWEPT_DIRS is exported TWICE, by exclusion-sweep.mjs and by success-sweep.mjs, which is
// the drift this rule names, already half-realised.
//
// They are NOT fixed here. Replacing a directory list inside six sweep tools is a change to the
// instruments every other check in this repo is read through, and making it in the same cycle
// as the export is exactly the adjacent change [R-20] says to carry rather than resolve. Each
// is listed by name so it cannot evaporate.
//
// THE BASELINE IS ASSERTED IN BOTH DIRECTIONS, which is what stops it becoming a place to hide
// things. A NEW site fails the run. A baselined site that has been FIXED also fails the run,
// because the baseline then names something no longer true -- so the list can only shrink
// deliberately, and never rot quietly.
const BASELINE = [
  'adapters/pdf/assert-examined.mjs::CANARY_DIRS@adapters/pdf/assert-firing-proofs.mjs',
  'adapters/pdf/assert-examined.mjs::DIRS@adapters/pdf/assert-reachability.mjs',
  'adapters/pdf/assert-examined.mjs::SWEPT_DIRS@adapters/pdf/exclusion-sweep.mjs',
  'adapters/pdf/assert-examined.mjs::SWEPT_DIRS@adapters/pdf/success-sweep.mjs',
  'adapters/pdf/assert-firing-proofs.mjs::DIRS@adapters/pdf/assert-examined.mjs',
  'adapters/pdf/assert-firing-proofs.mjs::DIRS@adapters/pdf/assert-reachability.mjs',
  'adapters/pdf/assert-firing-proofs.mjs::SWEPT_DIRS@adapters/pdf/exclusion-sweep.mjs',
  'adapters/pdf/assert-firing-proofs.mjs::SWEPT_DIRS@adapters/pdf/success-sweep.mjs',
  'adapters/pdf/assert-reachability.mjs::CANARY_DIRS@adapters/pdf/assert-firing-proofs.mjs',
  'adapters/pdf/assert-reachability.mjs::DIRS@adapters/pdf/assert-examined.mjs',
  'adapters/pdf/assert-reachability.mjs::SWEPT_DIRS@adapters/pdf/exclusion-sweep.mjs',
  'adapters/pdf/assert-reachability.mjs::SWEPT_DIRS@adapters/pdf/success-sweep.mjs',
  'adapters/pdf/exclusion-sweep.mjs::CANARY_DIRS@adapters/pdf/assert-firing-proofs.mjs',
  'adapters/pdf/exclusion-sweep.mjs::DIRS@adapters/pdf/assert-examined.mjs',
  'adapters/pdf/exclusion-sweep.mjs::DIRS@adapters/pdf/assert-reachability.mjs',
  'adapters/pdf/exclusion-sweep.mjs::SWEPT_DIRS@adapters/pdf/success-sweep.mjs',
  'adapters/pdf/success-sweep.mjs::CANARY_DIRS@adapters/pdf/assert-firing-proofs.mjs',
  'adapters/pdf/success-sweep.mjs::DIRS@adapters/pdf/assert-examined.mjs',
  'adapters/pdf/success-sweep.mjs::DIRS@adapters/pdf/assert-reachability.mjs',
  'adapters/pdf/success-sweep.mjs::SWEPT_DIRS@adapters/pdf/exclusion-sweep.mjs',
  'adapters/pdf/sweep-boundary.mjs::CANARY_DIRS@adapters/pdf/assert-firing-proofs.mjs',
  'adapters/pdf/sweep-boundary.mjs::DIRS@adapters/pdf/assert-examined.mjs',
  'adapters/pdf/sweep-boundary.mjs::DIRS@adapters/pdf/assert-reachability.mjs',
  'adapters/pdf/sweep-boundary.mjs::PRUNED@adapters/hubspot/rerun-regression.mjs',
];

const found = new Set(hits.map((h) => h.key));
const base = new Set(BASELINE);
const added = hits.filter((h) => !base.has(h.key));
const stale = BASELINE.filter((k) => !found.has(k));

console.log(`retyped site(s) found: ${hits.length}; baselined: ${BASELINE.length}; new: ${added.length}; baselined-but-gone: ${stale.length}`);
for (const h of hits) console.log(`  ${base.has(h.key) ? 'carried' : 'NEW    '}  ${h.site} rebuilds ${h.name} (exported by ${h.from})`);

const problems = [];
for (const h of added) problems.push(`NEW retyped site -- ${h.site} builds a literal equal to ${h.name}, exported by ${h.from}, and does not import it. A retyped list does not fail; it diverges the moment the source changes.`);
for (const k of stale) problems.push(`BASELINE STALE -- ${k} is listed as a known retyped site and is no longer one. Remove it from BASELINE: a baseline that outlives what it excuses is a place to hide the next one.`);

if (problems.length) {
  console.error(`NAME SETS -- ${problems.length} problem(s):`);
  for (const q of problems) console.error('  ' + q);
  process.exitCode = 1;
} else {
  console.log(`OK -- ${decls.length} exported name set(s); no NEW site rebuilds one without importing it, and every one of the ${BASELINE.length} carried sites is still there.`);
}
if (verbose) console.log('\nBLIND SPOTS, declared: a set built by computation; a set spelled with different member strings for the same concept; a PARTIAL retyping that omits a member; and a LONGER list that merely contains the set. The predicate is set EQUALITY, so a retyping that drops or adds a member is invisible here — and a dropped member is the more dangerous defect.');
