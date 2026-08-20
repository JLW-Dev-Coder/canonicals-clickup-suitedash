// WHICH FIXTURE IS THIS FORM'S ACCEPTANCE FIXTURE — ASKED OF THE TREE, NEVER OF A PROMPT.
//
//   node adapters/pdf/resolve-fixture.mjs [<form>] [--role acceptance]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `npm run gate:433boi` named `samples/433boi.slice1.sample.json`. Slice 2 had landed a week
// earlier and bound 130 more fields; the script still pointed at the slice-1 record, so the
// gate ran a three-page map against a one-page fixture and failed at step 10 with three
// unsettled exclusive sets and a coverage failure. Nothing was wrong with the map, the fixture
// or the gate. The PATH was stale, and a path in a script is a fact nobody re-derives.
//
// The same shape, one level out, is a PROMPT naming a fixture: prompt 40's §1 named
// `samples/433boi.sample.json`, which does not exist and never has.
//
// THE RULING THIS FILE IMPLEMENTS: pre-flight discovers; it is never told. A gate resolves its
// fixture from the FORM ID, and a path written down anywhere is at best a hint and at worst a
// defect. A prompt naming a fixture path is a prompt defect.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A GLOB IS A STOP UNLESS IT DECLARES WHAT IT SWEEPS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// So this one declares it, and reports it:
//
//   directory   samples/
//   filter      a name opening with `<form>.` and ending `.json`
//   classifier  the file's OWN `_fixture.role` declaration, and nothing else
//
// THE ROLE IS DECLARED IN THE FIXTURE, NOT INFERRED FROM ITS NAME. Inference was tried on
// paper first and it cannot work: 433-F has `433f.sample.json` and `433f.multi.sample.json`
// and the acceptance one is `multi`; 433-B(OIC) has one fixture per slice and the acceptance
// one is the newest. Any naming rule that gets those right is a rule fitted to today's tree,
// which is the same object as a stale path. A candidate carrying no declaration is REPORTED as
// undeclared and is never silently promoted.
//
// FIVE ROLES, and a sixth is a STOP:
//
//   acceptance   the record the gate runs saturated. EXACTLY ONE per form.
//   stress       an over-max record: more rows than the form prints, run with --saturated to
//                prove overflow is dropped and logged rather than truncated onto the page
//   negative     a record chosen to drive floors and refusals
//   production   a real record fetched from HubSpot. Never an acceptance fixture: it is a
//                portrait of one taxpayer and says nothing about coverage
//   superseded   a fixture an earlier slice's acceptance run used, kept because the run it
//                proved is in the history. It MUST name what superseded it, and that name must
//                resolve to a fixture in this directory.
//
// ZERO acceptance fixtures is a STOP. TWO is a STOP naming both. A `superseded_by` that names
// a file which is not here is a STOP. There is no state in which this returns a guess.

import { readFileSync, readdirSync, existsSync } from 'node:fs';

export const DIR = 'samples';
export const ROLES = ['acceptance', 'stress', 'negative', 'production', 'superseded'];

/** Every mapped form, from the maps directory. Derived so a new form needs no edit here. */
export const MAPPED_FORMS = () =>
  readdirSync('adapters/pdf/maps').filter((f) => f.endsWith('.map.json')).map((f) => f.replace('.map.json', '')).sort();

/**
 * The declared swept set for one form, and what each candidate says it is.
 *
 * A file that will not parse is UNREADABLE and is reported as such — never skipped. A fixture
 * that cannot be read is not a fixture that is not there, and the difference is the whole of
 * [G-01]: a form whose only acceptance fixture is corrupt must not resolve to "none found".
 */
export const candidatesFor = (form) => {
  const swept = { dir: DIR, filter: `name starts with "${form}." and ends ".json"`, classifier: '_fixture.role declared in the file' };
  const files = readdirSync(DIR).filter((f) => f.startsWith(`${form}.`) && f.endsWith('.json')).sort();
  const rows = files.map((f) => {
    const path = `${DIR}/${f}`;
    let doc;
    try { doc = JSON.parse(readFileSync(path, 'utf8')); }
    catch (e) { return { path, unreadable: e.message }; }
    const fx = doc._fixture;
    if (!fx || typeof fx !== 'object') return { path, undeclared: true };
    return { path, role: fx.role, why: fx.why, supersededBy: fx.superseded_by, declaresForm: fx.form };
  });
  return { swept, files: files.map((f) => `${DIR}/${f}`), rows };
};

/**
 * The one fixture of a given role for a form, with everything the resolution rested on.
 * Returns { path, rows, swept, problems }. `problems` non-empty means STOP — the caller
 * reports them and exits; it never falls back to a default.
 */
export const resolveFixture = (form, role = 'acceptance') => {
  const problems = [];
  const { swept, files, rows } = candidatesFor(form);

  for (const r of rows) if (r.unreadable)
    problems.push(`UNREADABLE   ${r.path} will not parse: ${r.unreadable}\n      A fixture that cannot be read is not a fixture that is absent. Resolution over this directory is unsafe until it parses.`);
  for (const r of rows) if (r.role && !ROLES.includes(r.role))
    problems.push(`UNKNOWN ROLE ${r.path} declares _fixture.role "${r.role}", which is not one of: ${ROLES.join(', ')}.`);
  for (const r of rows) if (r.declaresForm && r.declaresForm !== form)
    problems.push(`WRONG FORM   ${r.path} is named for ${form} and declares _fixture.form "${r.declaresForm}". One of the two is wrong and neither can be preferred silently.`);
  for (const r of rows) if (r.role === 'superseded') {
    if (!r.supersededBy) problems.push(`NO SUCCESSOR ${r.path} declares role "superseded" and names no _fixture.superseded_by. A superseded fixture must say what replaced it, or nothing distinguishes it from one somebody forgot.`);
    else if (!existsSync(r.supersededBy)) problems.push(`DEAD SUCCESSOR ${r.path} says it was superseded by ${r.supersededBy}, which is not in this tree.`);
  }

  const hits = rows.filter((r) => r.role === role);
  if (!hits.length) {
    const undeclared = rows.filter((r) => r.undeclared).map((r) => r.path);
    problems.push(
      `NO ${role.toUpperCase()} FIXTURE for ${form}. ${files.length} candidate(s) swept from ${DIR}/ (${swept.filter}):\n`
      + `      ${rows.map((r) => `${r.path} -> ${r.unreadable ? 'UNREADABLE' : (r.role || 'no _fixture.role declared')}`).join('\n      ')}\n`
      + (undeclared.length ? `      ${undeclared.length} candidate(s) declare no role. A fixture is promoted by its own declaration and never by its filename.\n` : '')
      + '      Declare _fixture: { form, role, why } in the file that should be it.');
  }
  if (hits.length > 1) {
    problems.push(
      `TWO ${role.toUpperCase()} FIXTURES for ${form}: ${hits.map((h) => h.path).join(', ')}.\n`
      + '      Exactly one fixture holds a role. Mark the older one role "superseded" with _fixture.superseded_by naming the newer.');
  }

  return { form, role, path: hits.length === 1 ? hits[0].path : null, rows, swept, files, problems };
};

/** One line per candidate, for a transcript. */
export const reportResolution = (res) => {
  console.log(`fixture resolution: ${res.form} / ${res.role}`);
  console.log(`  swept: ${res.swept.dir}/ — ${res.swept.filter}; classified by ${res.swept.classifier}`);
  for (const r of res.rows)
    console.log(`    ${r.path.padEnd(46)} ${r.unreadable ? 'UNREADABLE' : (r.role || '(no _fixture.role)')}${r.supersededBy ? ` -> ${r.supersededBy}` : ''}`);
  if (res.path) { console.log(`  resolved: ${res.path}`); return 0; }
  console.error(`FIXTURE RESOLUTION FAILED — ${res.problems.length} problem(s):`);
  res.problems.forEach((p) => console.error(`  ${p}`));
  return res.problems.length;
};

// CLI — no argument lists every mapped form, which is what pre-flight wants.
if (process.argv[1] && /resolve-fixture\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const argv = process.argv.slice(2);
  const roleAt = argv.indexOf('--role');
  const role = roleAt >= 0 ? argv[roleAt + 1] : 'acceptance';
  const forms = argv.filter((a) => !a.startsWith('--') && a !== role);
  const list = forms.length ? forms : MAPPED_FORMS();
  let bad = 0;
  for (const f of list) bad += reportResolution(resolveFixture(f, role));
  process.exit(bad ? 2 : 0);
}
