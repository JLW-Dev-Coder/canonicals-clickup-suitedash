// EVERY row_class DECLARATION MUST ACTUALLY STOP A WRONG-CLASS ROW.
//
//   node adapters/pdf/assert-row-class-routes.mjs [--verbose]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// D-05 was twelve mapped groups that declared no `row_class`, so `check-row-shape.mjs` skipped
// them — `if (!rc || !Array.isArray(rc.accepts)) continue;` — and eight printed tables on 433-A,
// three on 433-F and one on 433-A(OIC) routed rows by GROUP NAME alone. Twelve declarations
// closed it, three gates went green, and green is also exactly what a declaration nothing reads
// produces. A NEW INSTRUMENT IS THE LEAST TRUSTWORTHY OBJECT IN THE REPO AT THE MOMENT IT IS
// WRITTEN, and twelve of them landed at once.
//
// So each declaration is proved BY BREAKING IT. One row of the group is re-stated as a class
// the group does not accept, the real fill engine is run against the real acceptance fixture,
// and the run must exit non-zero AND name that group's row. A group whose poisoned run PASSES
// is a declaration that routes nothing, and it reads identically to one that works.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE SET IS DERIVED, NEVER TYPED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The groups come from the maps: every group declaring a `row_class` is in scope, on every form
// that has a map and a fixture. A typed list is how D-05 stayed at eight when the real number
// was twelve — the fix was filed against the form somebody was looking at, and the same defect
// sat on two others. Adding a form, or a group, puts it in scope here with no edit to this file.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A fixed class name drawn from no map and no spec — `__canary_not_a_class__` — is poisoned
// into every group alongside the real wrong class, with a known expected yield: exactly one STOP
// per group, every time, for reasons that cannot change when a map changes. If this harness ever
// stops writing its poison, stops finding the fixtures, or stops reading the maps, every run
// comes back clean and the file reports a full sweep over nothing. The canary is the row that
// says the harness itself is still working, and its count is asserted against the derived scope
// rather than printed for a reader to notice.
//
// A GROUP THE FIXTURE FEEDS NO ROWS TO CANNOT BE POISONED. That is REPORTED as UNPROVED and
// counted, never quietly dropped: "I had nothing to poison" and "the poison was refused" are
// the two sentences this whole series exists to keep apart.

import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { examined } from './examined.mjs';

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE FORM LIST IS DISCOVERED, AND IT USED TO BE TYPED — WHICH IS THE DEFECT THIS RECORDS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Until this commit the five (form, fixture, engine) triples below were a LITERAL ARRAY, and
// two of its five fixture paths were STALE: `samples/433boi.slice1.sample.json` when that
// form's acceptance record had been slice 3 for two prompts, and
// `samples/433b.slice1.sample.json` when 433-B's had been slice 4 for one. Slice 1 of 433-B(OIC)
// feeds no rows to six of the groups later slices bound, so this file reported six UNPROVED
// groups and a CANARY yield of 33 against an expected 39, and EXITED 2.
//
// It had been exiting 2 since the slice that moved the path, and nobody saw it, because this
// file is in no npm script and in no gate step: it is a per-form tool of a finished form, and
// [R-30] "every finished form's tools are exercised in the full regression" is the rule that
// found it. It is exactly the class adapters/pdf/resolve-fixture.mjs was written for — "a path
// in a script is a fact nobody re-derives" — and that file's own header names a gate script and
// a prompt as the two instances, while a third sat one directory away with five more paths in it.
//
// So there is no list. MAPPED_FORMS() yields the forms; resolveFixture() yields each form's
// acceptance record from the record's OWN declaration; the engine is derived from the form id
// and its absence is a STOP rather than a skip. A new form joins with no edit here, and a
// re-sliced fixture cannot leave this file pointing at the record it superseded.
import { MAPPED_FORMS, resolveFixture } from './resolve-fixture.mjs';

/**
 * Form -> the acceptance fixture and the engine that consumes it, DERIVED on every run.
 *
 * A form whose acceptance fixture will not resolve, or whose engine is not on disk, is carried
 * through as `unreadable` and reported by reportRouting as a STOP. It is never dropped: a form
 * this file cannot read is not a form with no declaring groups, and collapsing the two is the
 * exclusion-by-omission the two comments beneath the old array already recorded twice.
 */
export const FORMS = MAPPED_FORMS().map((form) => {
  const engine = `adapters/pdf/fill-${form}.mjs`;
  const res = resolveFixture(form, 'acceptance');
  if (res.problems?.length) return { form, engine, sample: null, unreadable: `acceptance fixture did not resolve: ${res.problems.join('; ')}` };
  if (!existsSync(engine)) return { form, engine, sample: res.path, unreadable: `no fill engine at ${engine}` };
  return { form, sample: res.path, engine };
});

const CANARY = '__canary_not_a_class__';

/** THE DERIVED SCOPE: every (form, group) that declares a row_class. */
export const routingScope = () => {
  const out = [];
  for (const f of FORMS) {
    const mapPath = `adapters/pdf/maps/${f.form}.map.json`;
    // f.unreadable is already set when the form's acceptance fixture would not resolve or its
    // engine is missing; that verdict carries its own sentence and is not overwritten with `true`.
    if (f.unreadable) { out.push({ ...f }); continue; }
    if (!existsSync(mapPath)) { out.push({ ...f, unreadable: `no map at ${mapPath}` }); continue; }
    if (!existsSync(f.sample)) { out.push({ ...f, unreadable: `resolved acceptance fixture ${f.sample} is not on disk` }); continue; }
    const map = JSON.parse(readFileSync(mapPath, 'utf8'));
    for (const [group, def] of Object.entries(map.groups || {})) {
      const rc = def?.row_class;
      if (!rc || !Array.isArray(rc.accepts)) continue;
      out.push({ ...f, group, column: rc.column, accepts: rc.accepts, key: def.source || def.array || group });
    }
  }
  return out;
};

/**
 * A wrong class for this group: a real class id some OTHER group in the series accepts, so the
 * poison is a plausible row rather than a nonsense string. Falls back to the canary's shape if
 * one group somehow accepted every class in the series.
 */
const wrongClassFor = (accepts, allClasses) => allClasses.find((c) => !accepts.includes(c)) || CANARY + '_2';

export const proveRouting = ({ verbose = false } = {}) => {
  const scope = routingScope();
  const unreadable = scope.filter((s) => s.unreadable);
  const groups = scope.filter((s) => !s.unreadable);
  const allClasses = [...new Set(groups.flatMap((g) => g.accepts))].sort();
  const dir = mkdtempSync(join(tmpdir(), 'row-class-routes-'));

  const results = [];
  for (const g of groups) {
    const wrong = wrongClassFor(g.accepts, allClasses);
    for (const [label, poison] of [['wrong-class', wrong], ['canary', CANARY]]) {
      const s = JSON.parse(readFileSync(g.sample, 'utf8'));
      const rows = s[g.key];
      if (!Array.isArray(rows) || !rows.length) { results.push({ ...g, label, poison, verdict: 'UNPROVED - the fixture feeds this group no rows' }); continue; }
      rows[0][g.column] = poison;
      const p = join(dir, `${g.form}-${g.group}-${label}.json`);
      writeFileSync(p, JSON.stringify(s));
      let code = 0, out = '';
      try { out = execFileSync(process.execPath, [g.engine, p, '--saturated'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
      catch (e) { code = e.status ?? 1; out = String(e.stdout || '') + String(e.stderr || ''); }
      // NAMING THE GROUP IS PART OF THE CONTRACT. A non-zero exit alone would also be produced
      // by an unrelated failure elsewhere in the engine, and would then read as proof of a
      // routing check that never ran.
      const named = new RegExp(`ROW CLASS MISMATCH[\\s\\S]*${g.group}\\[0\\]`).test(out);
      results.push({ ...g, label, poison, code, named, verdict: (code !== 0 && named) ? 'STOPPED' : 'DID NOT STOP' });
    }
  }
  return { results, groups, unreadable, allClasses };
};

export const reportRouting = ({ verbose = false } = {}) => {
  const { results, groups, unreadable, allClasses } = proveRouting({ verbose });
  const stopped  = results.filter((r) => r.verdict === 'STOPPED');
  const unproved = results.filter((r) => r.verdict.startsWith('UNPROVED'));
  const broken   = results.filter((r) => r.verdict === 'DID NOT STOP');
  const canaries = results.filter((r) => r.label === 'canary' && r.verdict === 'STOPPED');

  console.log(`row-class routing: ${groups.length} declaring group(s) across ${FORMS.length} form(s), ${allClasses.length} class(es) in play, ${results.length} poisoned run(s)`);
  if (verbose) for (const r of results) console.log(`    ${(r.form + '.' + r.group).padEnd(36)} ${r.label.padEnd(12)} poison=${String(r.poison).padEnd(24)} ${r.verdict}`);

  for (const u of unreadable) console.error(`  UNREADABLE ${u.form}: ${u.unreadable}. An input this file cannot read is a STOP, not a skip.`);
  for (const u of unproved) console.error(`  UNPROVED ${u.form}.${u.group}: the fixture feeds it no rows, so nothing could be poisoned. Zero rows refused is not zero rows wrong.`);
  for (const b of broken) console.error(`  DID NOT STOP ${b.form}.${b.group} (${b.label}, poison "${b.poison}"): exit ${b.code}, group named in output: ${b.named}. This declaration routes nothing.`);

  // THE CANARY'S EXPECTED YIELD, ASSERTED. Printing it is not the same as requiring it.
  if (canaries.length !== groups.length) {
    console.error(`  CANARY ${canaries.length} of an expected ${groups.length} — the harness did not refuse the canary in every declaring group, so it is not reading what it reports on.`);
  }

  for (const f of FORMS.map((x) => x.form ?? x)) {
    examined('assert-row-class-routes', String(f), results.filter((r) => r.form === f).length, 'poisoned-routing-runs');
  }
  const bad = unreadable.length + unproved.length + broken.length + (canaries.length === groups.length ? 0 : 1);
  if (!bad) console.log(`OK — every one of the ${groups.length} declaring group(s) refuses a wrong-class row and names it, and the canary was refused ${canaries.length}/${groups.length} times.`);
  return bad;
};

if (process.argv[1] && /assert-row-class-routes\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  process.exit(reportRouting({ verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
