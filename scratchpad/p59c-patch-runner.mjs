// p59c-patch-runner.mjs — prompt 59-C step 5: the three proxy-inference sites in the closing
// regression runner are changed to derive applicability from the map, from package.json, and
// from the tool that owns the fixture question.
//
// PATCHED BY LINE, NOT BY BLOB, and asserted after.
// [R-19] GENERATOR DECLARATION: this file edits scratchpad/p59-regression.mjs in place.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'scratchpad/p59-regression.mjs';
const lines = readFileSync(P, 'utf8').split('\n');

// The import line gains the two derivations this file now asks for rather than re-implements.
const imp = lines.indexOf("import { SET_ROLES } from '../adapters/pdf/resolve-fixture.mjs';");
if (imp < 0) { console.error('STOP — could not locate the resolve-fixture import.'); process.exit(2); }
lines[imp] = "import { SET_ROLES, MAPPED_FORMS, candidatesFor } from '../adapters/pdf/resolve-fixture.mjs';";

const first = lines.findIndex((l) => l.startsWith('// ── discover the forms '));
const last = lines.findIndex((l) => l.startsWith('for (const f of filled) console.log(`  ${f} declares role(s):'));
if (first < 0 || last < 0 || last <= first) { console.error(`STOP — discovery block not located (first=${first}, last=${last}).`); process.exit(3); }

const block = [
  '// ── DISCOVER THE FORMS — FROM WHAT DECLARES THEM, NOT FROM WHAT CORRELATES WITH IT ───────',
  '//',
  "// [G-301] [G-302] [G-303], and [G-304] below. FOUR SITES IN THIS FILE decided a step's",
  '// applicability from the PRESENCE of a file or from a NAMING PATTERN over one. The overflow',
  '// step is the one that surfaced the class, by inventing a step the map already said does not',
  '// exist; the other three were the same shape and had not been looked for.',
  '// adapters/pdf/assert-runner-derivation.mjs now holds all four in its DERIVATIONS register,',
  '// sweeps this file on every run, and STOPS on a site that is neither registered nor derived —',
  '// so the fifth is a failure rather than a red step nobody can place. A PROXY IS A FACT TAKEN',
  '// FROM SOMETHING THAT CORRELATES WITH IT INSTEAD OF FROM THE THING THAT DECLARES IT, and the',
  '// correlation holds right up until it does not.',
  '',
  '// [G-301] THE FORM UNIVERSE IS THE MAP SET. It was adapters/pdf/forms/ filtered by a naming',
  '// pattern over f433<letters>.pdf — a rule fitted to the file names that happen to be there',
  '// today, under which a form filed under any other name silently leaves the run and nothing',
  '// says so. MAPPED_FORMS() derives it from adapters/pdf/maps/, which is the authority',
  '// resolve-fixture.mjs, absence-sweep.mjs, assert-examined.mjs and assert-reachability.mjs all',
  '// already ask. The PDF directory is still read — but as a CROSS-CHECK that REPORTS a form the',
  '// tree holds and the maps do not, rather than as the population. A disagreement between the',
  '// two is now a line in the transcript instead of a silent difference in which forms got gated.',
  'const allForms = MAPPED_FORMS();',
  "const pdfForms = readdirSync('adapters/pdf/forms')",
  "  .filter(f => f.startsWith('f') && f.endsWith('.pdf')).map(f => f.slice(1, -4)).sort();",
  'const unmapped = pdfForms.filter(f => !allForms.includes(f));',
  'const mapless = allForms.filter(f => !pdfForms.includes(f));',
  '',
  "// [G-302] GATED IS WHAT package.json GATES. It was existsSync('adapters/pdf/fill-<form>.mjs'):",
  '// the presence of an engine file taken as the declaration that the form is gated. package.json',
  '// DECLARES that, one gate:<form> script per gated form, and it is the same authority the',
  '// overflow fix below already reaches for. The fill engine is still checked — as a CROSS-CHECK',
  '// that reports a disagreement between the declaration and the file, rather than letting file',
  '// presence settle the question on its own.',
  "const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {};",
  "const gateDeclared = (f) => Object.prototype.hasOwnProperty.call(scripts, 'gate:' + f);",
  "const fillEngine = (f) => existsSync('adapters/pdf/fill-' + f + '.mjs');",
  'const filled = allForms.filter(gateDeclared);',
  'const unfilled = allForms.filter(f => !gateDeclared(f));',
  'const engineDisagreements = allForms',
  '  .filter(f => fillEngine(f) !== gateDeclared(f))',
  "  .map(f => `${f}: package.json ${gateDeclared(f) ? 'declares' : 'does not declare'} gate:${f}, but adapters/pdf/fill-${f}.mjs ${fillEngine(f) ? 'exists' : 'does not exist'}`);",
  '',
  'console.log(`forms, derived from adapters/pdf/maps via MAPPED_FORMS(): ${allForms.join(\', \')}`);',
  'console.log(`  gated, derived from package.json gate:<form> scripts: ${filled.join(\', \')}`);',
  "console.log(`  mapped but not gated: ${unfilled.length ? unfilled.join(', ') : '(none)'}`);",
  'console.log(`  cross-check, adapters/pdf/forms holds: ${pdfForms.join(\', \')}`);',
  "console.log(`    a PDF with no map (declared, outside this run): ${unmapped.length ? unmapped.join(', ') : '(none)'}`);",
  "console.log(`    a map with no PDF: ${mapless.length ? mapless.join(', ') : '(none)'}`);",
  "console.log(`    gate declaration vs fill engine: ${engineDisagreements.length ? engineDisagreements.join('; ') : 'agree on all ' + allForms.length}`);",
  "console.log(`set roles, imported from resolve-fixture.mjs: ${[...SET_ROLES].join(', ')}`);",
  '',
  '// [G-303] THE ROLES COME THROUGH THE TOOL THAT OWNS THE QUESTION. This walked samples/ itself',
  '// and read the FORM out of the file NAME while reading the ROLE out of the file’s own',
  '// declaration — half the fact declared, half inferred, in the same loop. resolve-fixture.mjs is',
  '// the declared authority for exactly this: candidatesFor(form) states the directory it sweeps,',
  '// the filter it applies and the classifier it uses, and REPORTS an unreadable or undeclared',
  '// candidate by name instead of dropping it. It is also what run-form-gate resolves through, so',
  '// asking it means the runner and the gate cannot disagree about what a form’s fixtures are.',
  '// Re-implementing its filter here was the defect; the undeclared candidates it names are now',
  '// printed rather than skipped in silence.',
  'const roleOf = new Map();',
  'const undeclared = [];',
  'for (const f of allForms) {',
  '  const rs = new Set();',
  '  for (const r of candidatesFor(f).rows) {',
  '    if (r.unreadable) { undeclared.push(`${r.path} will not parse: ${r.unreadable}`); continue; }',
  '    if (!r.role) { undeclared.push(`${r.path} declares no _fixture.role`); continue; }',
  '    rs.add(r.role);',
  '  }',
  '  roleOf.set(f, rs);',
  '}',
  "for (const f of filled) console.log(`  ${f} declares role(s): ${[...(roleOf.get(f) ?? [])].sort().join(', ') || '(none)'}`);",
  'console.log(`  candidates carrying no role declaration, reported rather than skipped: ${undeclared.length}`);',
  'for (const u of undeclared) console.log(`    ${u}`);',
];

lines.splice(first, last - first + 1, ...block);
writeFileSync(P, lines.join('\n'));

const after = readFileSync(P, 'utf8');
const checks = [
  ['MAPPED_FORMS imported', after.includes('import { SET_ROLES, MAPPED_FORMS, candidatesFor }')],
  ['no PDF naming-pattern population', !after.includes('f433[a-z]+')],
  ['no existsSync fill-engine population', !after.includes('allForms.filter(f => existsSync(')],
  ['no filename form inference', !after.includes('(433[a-z]+)')],
  ['G-301 present', after.includes('[G-301]')],
  ['G-302 present', after.includes('[G-302]')],
  ['G-303 present', after.includes('[G-303]')],
];
for (const [what, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}`);
if (checks.some(([, ok]) => !ok)) process.exit(4);
console.log(`patched: ${last - first + 1} line(s) replaced by ${block.length}.`);
