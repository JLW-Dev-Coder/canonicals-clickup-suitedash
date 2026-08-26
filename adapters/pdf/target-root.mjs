// WHAT COUNTS AS A MAP TARGET IS DERIVED FROM THE FORM, NOT TYPED INTO THE READER.
//
//   node adapters/pdf/target-root.mjs --canary     # prove the derivation and both STOP directions
//   node adapters/pdf/target-root.mjs <form>       # the root this form's field list yields
//
//   exit 0 = every form's field list yields one root and every field is under it
//   exit 2 = a form's fields do not share a root, or a canary case did not behave
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DEFECT THIS EXISTS FOR, AND IT IS A SILENT ONE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A map target is any string rooted at the AcroForm's top-level subform, and three tools decided
// that by testing `startsWith('topmostSubform[0].')` — a literal, written once per tool, true of
// the five forms that existed when each was written.
//
// 433-D'S FIELDS ARE ROOTED AT `form1[0]`. Every one of its 168 field names begins `form1[0].`
// and not one begins `topmostSubform[0].`, so against 433-D those three predicates select
// NOTHING. What that produces is not an error. adapters/pdf/validate-map.mjs would report
// "0 target reference(s), 0 unique" and then "OK — every target in the map exists verbatim in
// the PDF field list", which is true of the empty set and is the strongest-sounding line the
// tool prints. adapters/pdf/verify-form-coverage.mjs would classify every binding as neither
// writable nor deferred nor never-autofill, so the gate's partition would report 168 fields
// unaccounted while the map bound all 166 of them.
//
// A guard that examines nothing has not been tested ([R-04]), and a literal in a reader is a
// fact nobody re-derives ([R-22]). This is both at once, and the reason it had to be found by
// reasoning rather than by a run is that the failing direction LOOKS LIKE A PASS.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DERIVATION, AND WHY IT IS AN ASSERTION AND NOT A GUESS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// An AcroForm field name is a dotted path from the document's root subform. The root is the
// first component, and it is not looked up in a table: it is read off the field list and then
// EVERY field is required to be under it. A form whose fields do not share one root is a STOP,
// not a form with several roots, because the whole point of the prefix is to separate a target
// from a prose note, a file path or a revision string, and a root that covers only some fields
// separates nothing.
//
// The empty field list is a STOP as well. It is the input that would make every predicate built
// on this return false for everything, which is the state described above.

import { readFileSync, existsSync, readdirSync } from 'node:fs';

export const MAPS = 'adapters/pdf/maps';

/** Every form carrying an enumerated field list. Derived from the maps directory, never listed. */
export const FIELD_FORMS = () =>
  readdirSync(MAPS).filter((f) => f.endsWith('.fields.json')).map((f) => f.replace('.fields.json', '')).sort();

/**
 * The one root prefix a field list yields, or a stated reason there is none.
 * Returns `{ root }` or `{ stop }` — never a default, and never an empty string.
 */
export const rootPrefixOf = (names) => {
  if (!Array.isArray(names) || names.length === 0)
    return { stop: 'the field list is EMPTY, so no root can be derived. An empty list is the exact input that makes a target predicate select nothing while every check built on it reports a pass.' };
  const first = String(names[0]);
  const cut = first.indexOf('].');
  if (cut < 0)
    return { stop: `the first field name ${JSON.stringify(first)} has no "]." in it, so it names no dotted path from a root subform.` };
  const root = first.slice(0, cut + 2);
  const strays = names.filter((n) => !String(n).startsWith(root));
  if (strays.length)
    return { stop: `${strays.length} of ${names.length} field name(s) are not under the root ${JSON.stringify(root)} derived from the first: ${strays.slice(0, 3).map((x) => JSON.stringify(String(x).slice(0, 50))).join(', ')}${strays.length > 3 ? ' ...' : ''}. A root that covers only some fields separates a target from nothing.` };
  return { root, under: names.length };
};

/** The same, read from a form's enumerated field list on disk. */
export const rootPrefixForForm = (form) => {
  const p = `${MAPS}/${form}.fields.json`;
  if (!existsSync(p)) return { stop: `no enumerated field list at ${p}` };
  let doc;
  try { doc = JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { return { stop: `${p} will not parse: ${e.message}. An unreadable field list is not an absent one.` }; }
  return rootPrefixOf((doc.fields || []).map((f) => f.name));
};

// ── THE CANARY ─────────────────────────────────────────────────────────────────────────────
//
// Planted, not drawn from the artefacts, and in both directions: the two roots this tree
// actually holds must be DERIVED, and the three inputs that would make a target predicate
// select nothing must each STOP rather than yield a root.
const CASES = [
  ['a  the root five forms use', ['topmostSubform[0].Page1[0].c1[0].p1[0]', 'topmostSubform[0].Page2[0].x[0]'], 'topmostSubform[0].'],
  ['b  the root 433-D uses, which no literal in this engine held', ['form1[0].Page1_Part1[0].SSN_EIN[0].Taxpayer[0]', 'form1[0].Page3_Part2[0].SSN_EIN[0].Spouse[0]'], 'form1[0].'],
  ['c  a root nothing in this tree uses, to prove the derivation is not a two-entry lookup', ['Root9[0].A[0]', 'Root9[0].B[0]'], 'Root9[0].'],
  ['d  an EMPTY field list must STOP', [], null],
  ['e  a field list with no dotted path must STOP', ['NotAPath'], null],
  ['f  two roots in one list must STOP', ['form1[0].A[0]', 'topmostSubform[0].B[0]'], null],
];

export const canary = () => {
  const dead = [];
  for (const [name, names, want] of CASES) {
    const got = rootPrefixOf(names);
    if (want === null) {
      if (!got.stop) dead.push(`CANARY DEAD  ${name}: yielded root ${JSON.stringify(got.root)} where a STOP was required.`);
    } else if (got.root !== want) {
      dead.push(`CANARY DEAD  ${name}: yielded ${JSON.stringify(got.root ?? got.stop)}, expected ${JSON.stringify(want)}.`);
    }
  }
  return dead;
};

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('adapters/pdf/target-root.mjs');
if (isMain) {
  const dead = canary();
  if (dead.length) {
    dead.forEach((d) => console.error(`  ${d}`));
    process.exit(2);
  }
  console.log(`target-root canary: ${CASES.length} of ${CASES.length} — three roots derived including one no form here uses, and three inputs that would make a target predicate select nothing each STOP.`);
  const wanted = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const forms = wanted.length ? wanted : FIELD_FORMS();
  let bad = 0;
  for (const form of forms) {
    const r = rootPrefixForForm(form);
    if (r.stop) { console.error(`  STOP  ${form}: ${r.stop}`); bad += 1; continue; }
    console.log(`  ${form.padEnd(8)} root ${JSON.stringify(r.root).padEnd(22)} ${r.under} field(s), all under it`);
  }
  if (bad) {
    console.error(`STOP — ${bad} form(s) yield no single root.`);
    process.exit(2);
  }
  console.log(`OK — ${forms.length} form(s), each with one derived root covering every field it enumerates, 0 problem(s) found.`);
}
