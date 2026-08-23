// THE SUBJECT REGISTER IS RE-DERIVED FROM THE PRINTED PAGE ON EVERY RUN.
//
//   node adapters/pdf/assert-subject-register.mjs [--verbose] [--canary]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// adapters/pdf/maps/_subjects.cross-form.json decides, for every future form, whether a fact
// can take a shared property name. A register that is right when it is written and drifts
// afterwards is worse than none: it is a permanent-name decision resting on a sentence nobody
// re-read. So every quote in it is looked up in the form's page bytes on every run.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IT ASSERTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   S1  EVERY QUOTE IS DRAWN. For each quote, the form's PDF must draw a run at that page and
//       baseline, starting at that x1, whose string is the quoted string VERBATIM. No
//       tolerance beyond 0.05pt on the coordinates and none at all on the text.
//
//   S2  EVERY MAPPED FORM HAS A SUBJECT. The form list is DERIVED from adapters/pdf/maps/
//       (`<form>.map.json`), never typed here. A form with a map and no subject entry is a
//       STOP — that is exactly the state 433-B(OIC) was crosswalked in.
//
//   S3  EVERY PAIR IS DECIDED. C(n,2) unordered pairs are derived from the register's own
//       form list and each must carry a relation. A pair nobody decided is the gap the
//       register exists to close.
//
//   S4  EVERY JUDGEMENT CITES QUOTES THAT EXIST, and every relation's basis names quotes on
//       the two forms it is about. A citation to a quote id that is not in the register is
//       the citation-to-nothing class [SB-17] catches one level out.
//
//   S5  NO QUOTE IS ORPHANED. A quote no judgement and no pair reads from is either evidence
//       for something unstated or a leftover. REPORTED, not failed — but printed on every run
//       with its id, so it cannot sit there unnoticed.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `--canary` runs S1 against a deliberately corrupted copy of the register — one character
// changed in one quoted string, one baseline moved by a point — and requires BOTH to be
// caught. A detector that cannot demonstrate it detects is a success message guarded by
// nothing, which is the shape adapters/pdf/guard-sweep.mjs [G-01] enumerates.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { readPrintedText, baselineOfRun } from './page-geometry.mjs';
import { REGISTER, FORM_FILE } from './gen-subject-register.mjs';
import { examined } from './examined.mjs';

const TOL = 0.05;

/** Every form this repo has a map for. DERIVED — a typed list is the defect one level out. */
export const mappedForms = () =>
  readdirSync('adapters/pdf/maps')
    .filter((f) => /^[0-9a-z]+\.map\.json$/.test(f))
    .map((f) => f.replace(/\.map\.json$/, ''))
    .sort();

const load = () => JSON.parse(readFileSync(REGISTER, 'utf8'));

/**
 * S1 for one register document. Separated so the canary can run it against a mutated copy
 * without touching the file on disk.
 * @returns {Promise<string[]>} problems
 */
export const quotesAreDrawn = async (doc) => {
  const problems = [];
  for (const [form, entry] of Object.entries(doc.forms || {})) {
    const file = entry.form_file || FORM_FILE[form];
    if (!file || !existsSync(file)) {
      problems.push(`S1 UNREADABLE FORM  ${form} names ${file || '(no form_file)'} and it is not in this tree. An unreadable input reports that it could not be read; it does not pass.`);
      continue;
    }
    const pages = await readPrintedText(readFileSync(file));
    for (const [id, q] of Object.entries(entry.quotes || {})) {
      const page = pages[q.page - 1];
      if (!page) { problems.push(`S1 NO SUCH PAGE  ${form}.${id} names page ${q.page} and ${file} has ${pages.length}.`); continue; }
      const hit = page.items.find((t) => Math.abs(baselineOfRun(t) - q.y) <= TOL && Math.abs(t.x1 - q.x1) <= TOL);
      if (!hit) {
        problems.push(`S1 NOT DRAWN  ${form}.${id} quotes p${q.page} y=${q.y} x1=${q.x1} and the page draws no run at that baseline and start. The quote cannot be checked against the form, so it is not evidence.`);
        continue;
      }
      if (hit.str !== q.text)
        problems.push(`S1 TEXT DRIFT  ${form}.${id} at p${q.page} y=${q.y}\n      register: ${JSON.stringify(q.text)}\n      page:     ${JSON.stringify(hit.str)}`);
      if (Math.abs(hit.x2 - q.x2) > TOL)
        problems.push(`S1 EXTENT DRIFT  ${form}.${id} at p${q.page} y=${q.y} — register x2 ${q.x2}, page draws ${hit.x2.toFixed(1)}.`);
    }
  }
  return problems;
};

export const subjectRegisterProblems = async () => {
  const doc = load();
  const problems = await quotesAreDrawn(doc);
  const forms = Object.keys(doc.forms || {});

  // ── S2  every mapped form is in the register ──────────────────────────────────────────
  for (const f of mappedForms())
    if (!forms.includes(f))
      problems.push(`S2 NO SUBJECT  ${f} has a map at adapters/pdf/maps/${f}.map.json and no entry in ${REGISTER}. A form is crosswalked against the subject axis, and a form whose subject nobody derived is crosswalked against leaf names — which is the conflation this register exists to end.`);
  // And the other way: a register entry for a form with no map is a claim about nothing.
  for (const f of forms)
    if (!mappedForms().includes(f))
      problems.push(`S2 ORPHAN ENTRY  ${REGISTER} registers ${f} and adapters/pdf/maps holds no ${f}.map.json.`);

  // ── S3  every unordered pair is decided ───────────────────────────────────────────────
  const key = (a, b) => [a, b].sort().join('|');
  const decided = new Map();
  for (const p of (doc.pairs || [])) {
    if (decided.has(key(p.a, p.b)))
      problems.push(`S3 DUPLICATE PAIR  ${p.a}/${p.b} is decided twice. Two rulings for one pair is two answers, and nothing says which is read.`);
    decided.set(key(p.a, p.b), p);
  }
  for (let i = 0; i < forms.length; i++) for (let j = i + 1; j < forms.length; j++) {
    if (!decided.has(key(forms[i], forms[j])))
      problems.push(`S3 UNDECIDED PAIR  ${forms[i]} / ${forms[j]} — both are registered and nothing in ${REGISTER} says whether their subjects coincide or exclude. Reuse between them is therefore undecided, and an undecided reuse question gets answered by leaf names by default.`);
  }
  for (const p of (doc.pairs || [])) {
    if (!forms.includes(p.a) || !forms.includes(p.b))
      problems.push(`S3 PAIR ABOUT A FORM THAT IS NOT REGISTERED  ${p.a}/${p.b}.`);
    if (!/^(COINCIDE|MUTUALLY EXCLUSIVE)$/.test(String(p.relation)))
      problems.push(`S3 UNKNOWN RELATION  ${p.a}/${p.b} declares ${JSON.stringify(p.relation)}; the register's vocabulary is COINCIDE or MUTUALLY EXCLUSIVE.`);
  }

  // ── S4  every citation resolves ───────────────────────────────────────────────────────
  const cited = new Set();
  const cite = (form, ids, where) => {
    for (const id of (ids || [])) {
      cited.add(`${form}.${id}`);
      if (!(doc.forms[form]?.quotes || {})[id])
        problems.push(`S4 CITATION TO NOTHING  ${where} cites ${form}.${id} and the register holds no such quote. A judgement resting on a quote that is not there reads exactly like one resting on a quote that is.`);
    }
  };
  for (const [form, e] of Object.entries(doc.forms || {})) {
    cite(form, e.read_from, `forms.${form}.read_from`);
    cite(form, e.where_read_from, `forms.${form}.where_read_from`);
  }
  for (const p of (doc.pairs || [])) {
    cite(p.a, p.basis_a, `pair ${p.a}/${p.b} basis_a`);
    cite(p.b, p.basis_b, `pair ${p.a}/${p.b} basis_b`);
    if (!(p.basis_a || []).length || !(p.basis_b || []).length)
      problems.push(`S4 ONE-SIDED BASIS  pair ${p.a}/${p.b} cites quotes on ${!(p.basis_a || []).length ? p.b : p.a} only. A relation between two subjects is read off both pages or it is read off one and assumed about the other.`);
  }

  return { problems, cited, doc, forms };
};

/** S5 — quotes nothing reads from. Reported every run, never failed. */
const orphanQuotes = (doc, cited) => {
  const out = [];
  for (const [form, e] of Object.entries(doc.forms || {}))
    for (const id of Object.keys(e.quotes || {}))
      if (!cited.has(`${form}.${id}`)) out.push(`${form}.${id}`);
  return out;
};

// ── THE CANARY ──────────────────────────────────────────────────────────────────────────
export const canary = async () => {
  const base = load();
  const form = Object.keys(base.forms)[0];
  const id = Object.keys(base.forms[form].quotes)[0];

  const textMut = JSON.parse(JSON.stringify(base));
  textMut.forms[form].quotes[id].text = textMut.forms[form].quotes[id].text.replace(/.$/, 'X');
  const yMut = JSON.parse(JSON.stringify(base));
  yMut.forms[form].quotes[id].y = +(yMut.forms[form].quotes[id].y + 1).toFixed(1);

  const caughtText = (await quotesAreDrawn(textMut)).some((p) => p.startsWith('S1 TEXT DRIFT'));
  const caughtY = (await quotesAreDrawn(yMut)).some((p) => p.startsWith('S1 NOT DRAWN'));
  return { at: `${form}.${id}`, caughtText, caughtY, holds: caughtText && caughtY };
};

export const reportSubjectRegister = async ({ verbose = false } = {}) => {
  const { problems, cited, doc, forms } = await subjectRegisterProblems();
  const orphans = orphanQuotes(doc, cited);
  const c = doc._count || {};
  console.log(`subject register: ${forms.length} form(s), ${c.quotes ?? '?'} quote(s) re-derived from the page, ${(doc.pairs || []).length} of ${forms.length * (forms.length - 1) / 2} unordered pair(s) decided`);
  for (const [f, e] of Object.entries(doc.forms || {}))
    console.log(`  ${f.padEnd(7)} ${e.the_legal_person} — ${e.subject}`);
  for (const p of (doc.pairs || []))
    console.log(`  ${(p.a + ' / ' + p.b).padEnd(18)} ${p.relation}`);
  console.log(`  ${orphans.length} quote(s) read by no judgement and no pair${orphans.length ? `: ${orphans.join(', ')}` : ''}`);
  if (verbose) for (const [f, e] of Object.entries(doc.forms || {}))
    for (const [id, q] of Object.entries(e.quotes || {}))
      console.log(`    ${f}.${id.padEnd(20)} p${q.page} y=${q.y} x=${q.x1}-${q.x2} ${JSON.stringify(q.text)}`);
  if (!problems.length) {
    for (const f of forms) {
      examined('assert-subject-register', f, Object.keys(doc.forms?.[f]?.quotes || {}).length, 'quotes-re-derived-from-the-page');
    }
    console.log('OK — every quote is drawn on the page it names, every mapped form has a subject, every pair is decided, and every citation resolves.');
    return 0;
  }
  console.error(`SUBJECT REGISTER — ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  ${p}`));
  return problems.length;
};

if (process.argv[1] && /assert-subject-register\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  if (process.argv.includes('--canary')) {
    const k = await canary();
    console.log(`canary at ${k.at}: one character changed in the quoted string -> ${k.caughtText ? 'CAUGHT' : 'MISSED'}; baseline moved 1.0pt -> ${k.caughtY ? 'CAUGHT' : 'MISSED'}`);
    process.exit(k.holds ? 0 : 2);
  }
  process.exit((await reportSubjectRegister({ verbose: process.argv.includes('--verbose') })) ? 2 : 0);
}
