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

/** Form -> the acceptance fixture and the engine that consumes it. */
export const FORMS = [
  { form: '433a',   sample: 'samples/433a.sample.json',       engine: 'adapters/pdf/fill-433a.mjs' },
  { form: '433f',   sample: 'samples/433f.multi.sample.json', engine: 'adapters/pdf/fill-433f.mjs' },
  { form: '433aoi', sample: 'samples/433aoi.sample.json',     engine: 'adapters/pdf/fill-433aoi.mjs' },
];

const CANARY = '__canary_not_a_class__';

/** THE DERIVED SCOPE: every (form, group) that declares a row_class. */
export const routingScope = () => {
  const out = [];
  for (const f of FORMS) {
    const mapPath = `adapters/pdf/maps/${f.form}.map.json`;
    if (!existsSync(mapPath) || !existsSync(f.sample)) { out.push({ ...f, unreadable: true }); continue; }
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

  for (const u of unreadable) console.error(`  UNREADABLE ${u.form}: map or fixture missing (${u.sample}). An input this file cannot read is a STOP, not a skip.`);
  for (const u of unproved) console.error(`  UNPROVED ${u.form}.${u.group}: the fixture feeds it no rows, so nothing could be poisoned. Zero rows refused is not zero rows wrong.`);
  for (const b of broken) console.error(`  DID NOT STOP ${b.form}.${b.group} (${b.label}, poison "${b.poison}"): exit ${b.code}, group named in output: ${b.named}. This declaration routes nothing.`);

  // THE CANARY'S EXPECTED YIELD, ASSERTED. Printing it is not the same as requiring it.
  if (canaries.length !== groups.length) {
    console.error(`  CANARY ${canaries.length} of an expected ${groups.length} — the harness did not refuse the canary in every declaring group, so it is not reading what it reports on.`);
  }

  const bad = unreadable.length + unproved.length + broken.length + (canaries.length === groups.length ? 0 : 1);
  if (!bad) console.log(`OK — every one of the ${groups.length} declaring group(s) refuses a wrong-class row and names it, and the canary was refused ${canaries.length}/${groups.length} times.`);
  return bad;
};

if (process.argv[1] && /assert-row-class-routes\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  process.exit(reportRouting({ verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
