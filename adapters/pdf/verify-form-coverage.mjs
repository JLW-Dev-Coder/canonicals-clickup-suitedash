// Whole-form accounting: every field on the form, in exactly one state, proved from the
// map and the filled PDF.
//
// CLI:  node adapters/pdf/verify-form-coverage.mjs <form> <filled.pdf> [--saturated]
// Exit: 0 = the accounting closes and every category assertion holds, 2 = it does not.
//
// WHY THIS EXISTS
// ---------------
// verify-appearances.mjs can only judge fields that CARRY a value: a cell with no /V has
// no appearance to disagree with, so it is skipped, not passed. That makes "N verified" a
// statement about the record, never about the form. This tool makes the complementary
// statement — it starts from the FORM's field list and requires every field to be in a
// state the map accounts for.
//
// The ceiling is arithmetic, not aspiration. A form's checkbox targets belong to mutually
// exclusive sets, and at most one target per set may be checked; the rest are not gaps,
// they are the alternatives that must stay unchecked for the form to be internally
// consistent. So a single fill can never write every target, and any tool that reports
// "targets written / total targets" is reporting a number that can never reach 1.
//
// NOTHING HERE IS A CONSTANT. Every count is derived from the map, the enumerated field
// list and the filled PDF. The tool has never been told how many fields 433-A has, how
// many are checkboxes, or how many sets there are — which is the only reason it can be
// pointed at 433-B on the day that map is authored and mean something.
//
// CATEGORIES — every field on the form lands in exactly one, and they sum to the field
// count. The first five are the accounting Principal asked for; the rest exist because a
// tool that only had those five would have to either drop a field or invent a home for
// it on a form whose map is shaped differently, and silently mis-stating the total is the
// exact failure this file is built to catch.
//
//   text written                    a mapped text target carrying a value
//   text EMPTY                      a mapped text target with no value — a reportable GAP
//   checkbox checked (exclusive)    exactly one per exclusive set
//   checkbox unchecked (exclusive)  the alternatives, correctly left off
//   checkbox checked (independent)  a mapped checkbox in no exclusive set
//   checkbox unchecked (independent)
//   never-autofill blank            allowed._never_autofill (or top-level _never_autofill on a
//                                   form with no allowable column) — mapped, understood,
//                                   blank on purpose
//   deferred blank                  _deferred — not resolved yet, validated for existence, never filled
//   mapped, other field type        neither text nor checkbox (a button, a signature)
//   unreferenced by the map         the map does not mention this field at all
//
// TWO MODES, BECAUSE AN EMPTY CELL MEANS TWO DIFFERENT THINGS.
//
//   --saturated   acceptance samples. Every mapped text cell is supposed to carry a value,
//                 because the sample exists to reach all of them. One that does not means
//                 the record is missing the key that feeds it — or the map binds a key the
//                 sample never had. Reporting that as "N written" and moving on would let
//                 the count quietly come in low, which is indistinguishable from the map
//                 being wrong. So each one is NAMED, with the map path that binds it, and
//                 the run FAILS.
//
//   (default)     production records. A real taxpayer with two bank accounts leaves the
//                 other two slots empty, and that is a correctly filled form, not a
//                 defective one. Empty mapped cells are COUNTED, a few are shown by map
//                 path, and they are NOT a failure.
//
// Nothing else moves between the modes. Exclusive sets, never-autofill, deferred blanks, the
// field-list identity check and the requirement that the accounting reconcile to the field
// count all apply in full either way — those are statements about the MAP, and a map does
// not become more or less correct because the record feeding it happens to be sparse.
//
// The mode is printed in the report header, so no report is ever ambiguous about which rule
// it ran under. A run whose header does not say SATURATED did not prove saturation.
//
// "EXACTLY ONE CHECKED", NOT "AT MOST ONE". The fill scripts already enforce at-most-one —
// that is a violation guard, and it passes an untouched form. On a saturated record the
// stronger claim is the one that means something: every set the record can answer IS
// answered. The single exception is derived, not special-cased: a set whose targets are
// ALL under _deferred is a set the map says it cannot answer yet, so it is required to
// have exactly ZERO checked instead.

import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { readFileSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { examined } from './examined.mjs';
import { rootPrefixForForm, FIELD_FORMS } from './target-root.mjs';

// EVERY ROOT THIS TREE'S FORMS ACTUALLY USE, DERIVED AT LOAD FROM THEIR OWN FIELD LISTS.
//
// This was the literal 'topmostSubform[0].' and that is not 433-D's root: its 168 field names
// all begin `form1[0].`. Under the literal, classifyMapTargets() would have found no writable,
// deferred or never-autofill target on that form at all -- so the gate's partition would report
// every field UNACCOUNTED while the map bound all of them, and validate-map would report a pass
// over the empty set. See adapters/pdf/target-root.mjs for the whole account.
//
// The UNION rather than a per-form root, because walkTargets() is exported and called from four
// places that pass a map document and no form argument; threading a parameter through all of
// them is a change to four call sites in a commit about a fifth thing. The union is the same
// answer for every form this tree holds -- the roots are disjoint prefixes of real AcroForm
// paths -- and it is DERIVED, so a seventh form joins by having a field list rather than by
// somebody editing this line. An empty derivation is a STOP at load: it is the input that makes
// this predicate select nothing, which is the whole defect.
const TARGET_ROOTS = (() => {
  const roots = [...new Set(FIELD_FORMS().map((f) => rootPrefixForForm(f)).filter((r) => r.root).map((r) => r.root))];
  if (!roots.length) throw new Error('verify-form-coverage.mjs: no target root could be derived from any form field list, so every map target would be invisible to this module. See adapters/pdf/target-root.mjs.');
  return roots;
})();
const isTarget = (s) => TARGET_ROOTS.some((r) => s.startsWith(r));

// Guard constructs vs writing constructs.
//
// A map re-lists the same checkbox target under `exclusive` that it maps under
// `checkboxes` or inside a group slot — that is the whole point of `exclusive`, and it is
// why 433-A holds 589 target references over 515 unique fields. Anything that counted
// those as separate bindings would report a duplicate write on every well-formed map.
// So the three GUARD roots are named here, once, and everything else is a writing
// construct. Same three names on 433-F, and the convention a 433-B map inherits.
const GUARD_EXCLUSIVE = 'exclusive';
const GUARD_DEFERRED  = '_deferred';
// TWO ROOTS FOR ONE CONSTRUCT, because `allowed` is not universal.
//
// On 433-A and 433-F the never-autofill list lives INSIDE the IRS-allowable block, since
// that is where most of its entries come from: the cells in the "IRS USE ONLY" column that
// depend on a county table or an examiner's discretion. 433-A(OIC) prints no allowable
// column at all and therefore has no `allowed` block to hang the list under — but it still
// has fields that are mapped, understood and deliberately blank (three push buttons). A map
// forced to author an empty `allowed` wrapper solely to reach this guard would be asserting
// an IRS-allowable column that the form does not print.
//
// So the root is either. Both are checked; a map declares one of them, never both.
const GUARD_NEVER     = ['allowed._never_autofill', '_never_autofill'];

// Collect [path, target] for every field-target string anywhere in the map, at any depth,
// under any key — the same schema-agnostic walk validate-map.mjs uses, and for the same
// reason: a target authored under a key this file had never heard of must not be silently
// skipped. The PATH is kept, not just the target: it is what names the offending input
// key when a cell comes back empty.
export function walkTargets(node, path = '', out = []) {
  if (typeof node === 'string') {
    if (isTarget(node)) out.push({ path, target: node });
    return out;
  }
  if (Array.isArray(node)) { node.forEach((v, i) => walkTargets(v, `${path}[${i}]`, out)); return out; }
  if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => walkTargets(v, path ? `${path}.${k}` : k, out));
  }
  return out;
}

const under = (path, root) => path === root || path.startsWith(`${root}.`) || path.startsWith(`${root}[`);

const isBlankText = (v) => v === undefined || v === null || String(v) === '';

// The one place a map's targets are sorted into writing bindings and guards. Exported so
// run-form-gate.mjs asks the same question this file answers: a gate that classified
// targets by its own rules could pass a form this tool fails, and the two disagreeing
// about what "written" means is the failure neither would report.
export function classifyMapTargets(mapDoc) {
  const deferred = new Set(), never = new Set(), writable = new Map();   // target -> [paths]
  for (const { path, target } of walkTargets(mapDoc)) {
    if (under(path, GUARD_DEFERRED)) { deferred.add(target); continue; }
    if (GUARD_NEVER.some(root => under(path, root))) { never.add(target); continue; }
    if (under(path, GUARD_EXCLUSIVE)) continue;                       // guard, not a binding
    if (!writable.has(target)) writable.set(target, []);
    writable.get(target).push(path);
  }
  const exclusiveSets = Object.entries(mapDoc.exclusive || {})
    .filter(([, t]) => Array.isArray(t))
    .map(([set, targets]) => ({ set, targets }));
  return { deferred, never, writable, exclusiveSets };
}

// A map states its own scope. 433-A declares `slice: "COMPLETE - every field ... is mapped
// or explicitly excluded"`; a map that has not made that claim is a declared partial slice
// and cannot be held to full coverage without inventing a promise it never gave. Read from
// the map, so a 433-B map earns the strict check by declaring the same thing.
export const mapClaimsComplete = (mapDoc) =>
  typeof mapDoc.slice === 'string' && /^\s*complete\b/i.test(mapDoc.slice);

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE SATURATION RULE AND A FORM NO RECORD CAN SATURATE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Saturated mode fails on any mapped text cell an acceptance record left empty, and that rule is
// right: a count quietly coming in low is indistinguishable from the map being wrong.
//
// 433-D is the first form where the rule and the PAGE disagree. Five of its cells are
// subject-CONDITIONAL -- three exist only for an individual filer, two only for a business
// entity -- so on ANY record at least two mapped text cells are REQUIRED to be empty. No single
// record can reach them all, and that is a property of the form rather than a gap in the fixture.
//
// THE EXEMPTION IS DERIVED FROM THE MAP'S OWN DECLARATIONS, NOT LISTED HERE, and it is
// TWO-DIRECTIONAL, which is what keeps it from being the hole an exemption usually is:
//
//   a cell required empty on this record's subject is not counted as a saturation failure,
//   AND IS REPORTED BY NAME with the printed caption that made it conditional;
//   a cell required empty that CARRIES A VALUE is a FAILURE at this step -- [SC-7] asked again
//   of the filed document rather than only of the fill engine that produced it.
//
// So the saturation rule is not weakened for this form. It is stated for a form whose cells are
// not all reachable at once, and the second direction is a check the other five forms do not
// have. A form declaring no `subject_classes`, or a run given no record, reaches none of this
// and behaves exactly as before.
const conditionalEmpties = (mapDoc, recordPath) => {
  const sc = mapDoc.subject_classes;
  // A FORM DECLARING NO SUBJECT CLASSES REACHES NONE OF THIS, which is the five forms that
  // preceded 433-D and is the only inactive case there is.
  if (!sc || !Object.values(sc).some((e) => e.class === 'conditional')) return { active: false, required: new Map(), subject: null };
  // FROM HERE EVERY FAILURE IS A THROW, and the first draft of this function returned
  // `{ active: false }` for each of them. Under that shape an unparseable record, a record
  // carrying no subject, or a map naming no mirror would all switch off BOTH halves of this
  // construct -- and one of those halves is the check that a cell required to be empty is
  // empty. The exemption going quiet is safe, because saturation then fails louder; the CHECK
  // going quiet is the entity record carrying a spouse's signature passing unnoticed. They are
  // not separable by a flag, so neither is optional.
  if (!recordPath || !existsSync(recordPath))
    throw new Error(`verify-form-coverage: ${mapDoc.form} declares subject-conditional cells and no record was given (${JSON.stringify(recordPath)}). The conditional emptiness check cannot be asked without the record's declared subject, and skipping it would switch off the one check that stops a cell existing for one legal person carrying a value on the other.`);
  let rec;
  try { rec = JSON.parse(readFileSync(recordPath, 'utf8')); }
  catch (e) { throw new Error(`verify-form-coverage: ${recordPath} will not parse: ${e.message}. It is the record this document was filled from and step 7 read it successfully, so an unreadable one here is a contradiction rather than a missing input.`); }
  const subject = String(rec[`${mapDoc.form}_subject`] ?? rec.subject ?? '').trim().toLowerCase();
  if (!subject)
    throw new Error(`verify-form-coverage: ${recordPath} declares no ${mapDoc.form}_subject and ${mapDoc.form} declares subject-conditional cells. The fill engine refuses such a record outright, so a filled document that came from one is a contradiction.`);
  const mirrorPath = mapDoc._the_mirror?.declaration;
  if (!mirrorPath || !existsSync(mirrorPath))
    throw new Error(`verify-form-coverage: ${mapDoc.form} declares subject-conditional cells and names no readable mirror declaration (${JSON.stringify(mirrorPath ?? null)}) to resolve their targets against.`);
  const mirror = JSON.parse(readFileSync(mirrorPath, 'utf8'));
  const required = new Map();
  const unresolved = [];
  for (const [stem, e] of Object.entries(sc)) {
    if (e.class !== 'conditional' || e.empty_unless === subject) continue;
    const pair = mirror.pairs.find((x) => x.stem === stem);
    // A CONDITIONAL CELL WHOSE TARGETS CANNOT BE RESOLVED IS A STOP, not a cell quietly dropped
    // from the required set. `continue` here would mean the more conditional cells the mirror
    // stopped describing, the fewer this check asked about.
    if (!pair) { unresolved.push(stem); continue; }
    for (const t of [pair.page1, pair.page3]) required.set(t, { stem, side: e.empty_unless, caption: e.caption });
  }
  if (unresolved.length)
    throw new Error(`verify-form-coverage: ${unresolved.length} subject-conditional stem(s) the map declares have no pair in ${mirrorPath}: ${unresolved.join(', ')}. A cell whose targets cannot be resolved is a cell this check would silently stop asking about.`);
  return { active: true, required, subject };
};

export async function verifyFormCoverage(form, filledPath, { saturated = false, recordPath = null } = {}) {
  const mapPath   = `adapters/pdf/maps/${form}.map.json`;
  const mapDoc    = JSON.parse(readFileSync(mapPath, 'utf8'));
  const fieldsPath = mapDoc.fields_source || `adapters/pdf/maps/${form}.fields.json`;
  const fieldsDoc = JSON.parse(readFileSync(fieldsPath, 'utf8'));

  const pdf  = await PDFDocument.load(readFileSync(filledPath));
  const live = pdf.getForm();

  // The filled PDF must BE this form. Comparing the two name sets rather than the two
  // counts: an equal count with different names is the failure a count check waves through.
  const enumerated = fieldsDoc.fields.map(f => f.name);
  const liveFields = live.getFields();
  const liveNames  = liveFields.map(f => f.getName());
  const enumSet = new Set(enumerated), liveSet = new Set(liveNames);
  const missingFromPdf = enumerated.filter(n => !liveSet.has(n));
  const extraInPdf     = liveNames.filter(n => !enumSet.has(n));

  const byName = new Map(liveFields.map(f => [f.getName(), f]));

  // --- classify every target the map names -------------------------------------------
  const { deferred, never, writable, exclusiveSets } = classifyMapTargets(mapDoc);
  const inExclusive = new Set(exclusiveSets.flatMap(s => s.targets));

  // --- put every FIELD in exactly one bucket -----------------------------------------
  const bucket = {
    text_written: [], text_empty: [],
    cb_checked_exclusive: [], cb_unchecked_exclusive: [],
    cb_checked_independent: [], cb_unchecked_independent: [],
    never_blank: [], deferred_blank: [],
    mapped_other_type: [], unreferenced: [],
  };
  // States that must never occur. Kept out of the buckets above so the accounting total
  // stays a partition of the field count even while these are being reported.
  const violations = { never_written: [], deferred_written: [] };

  const valueOf = (f) => {
    if (f instanceof PDFTextField) return { kind: 'text', blank: isBlankText(f.getText()), value: f.getText() };
    if (f instanceof PDFCheckBox)  return { kind: 'checkbox', blank: !f.isChecked(), value: f.isChecked() };
    return { kind: 'other', blank: true, value: null };
  };

  for (const name of enumerated) {
    const f = byName.get(name);
    if (!f) continue;                                    // already reported as missingFromPdf
    const st = valueOf(f);

    // Precedence: deferred > never-autofill > writable > unreferenced. `_deferred` outranks
    // `_never_autofill` because it is the weaker claim ("not resolved") and must not be
    // reported as the stronger one ("understood, deliberately blank").
    if (deferred.has(name)) {
      if (!st.blank) violations.deferred_written.push({ name, value: st.value });
      bucket.deferred_blank.push(name);
      continue;
    }
    if (never.has(name)) {
      if (!st.blank) violations.never_written.push({ name, value: st.value });
      bucket.never_blank.push(name);
      continue;
    }
    if (writable.has(name)) {
      if (st.kind === 'text') {
        (st.blank ? bucket.text_empty : bucket.text_written).push({ name, paths: writable.get(name) });
      } else if (st.kind === 'checkbox') {
        const ex = inExclusive.has(name);
        const key = ex
          ? (st.value ? 'cb_checked_exclusive' : 'cb_unchecked_exclusive')
          : (st.value ? 'cb_checked_independent' : 'cb_unchecked_independent');
        bucket[key].push(name);
      } else {
        bucket.mapped_other_type.push(name);
      }
      continue;
    }
    bucket.unreferenced.push(name);
  }

  // --- exclusive sets: exactly one checked, or exactly zero when the set is deferred ---
  const setFindings = exclusiveSets.map(({ set, targets }) => {
    // AN EMPTY SET IS A STOP, AND IT HAS TO BE SAID FIRST. `[].every(…)` is true, so a set
    // declaring zero targets was `allDeferred`, expected zero checked, found zero checked,
    // and reported as a SATISFIED exclusive set — a checkbox group nobody had bound, passing
    // as one correctly bound. No map holds an empty exclusive array today, which is precisely
    // the state the dead `_unaccounted_by_page` regex was in on the day it shipped. Stated
    // before the `.every()`, in the shape run-form-gate.mjs uses for its option sets.
    // See adapters/pdf/guard-sweep.mjs [G-26].
    if (!targets.length)
      return { set, targets, allDeferred: false, checked: [], expect: 1, ok: false,
        empty: `exclusive set "${set}" declares no targets. An exclusive set with nothing in it cannot be exclusive, and every check over it is vacuously satisfied.` };
    const allDeferred = targets.every(t => deferred.has(t));
    const checked = targets.filter(t => { const f = byName.get(t); return f instanceof PDFCheckBox && f.isChecked(); });
    const expect = allDeferred ? 0 : 1;
    return { set, targets, allDeferred, checked, expect, ok: checked.length === expect };
  });

  // The conditional exemption, computed from the map and the record, and applied to the empty
  // bucket by MOVING cells rather than by dropping them -- the accounting must still close, so
  // a cell required empty stays counted, in a bucket that says why it is empty.
  const cond = conditionalEmpties(mapDoc, recordPath);
  const condRequiredEmpty = [], condWronglyFilled = [];
  if (cond.active) {
    for (let i = bucket.text_empty.length - 1; i >= 0; i--) {
      const e = bucket.text_empty[i];
      const req = cond.required.get(e.name);
      if (!req) continue;
      bucket.text_empty.splice(i, 1);
      condRequiredEmpty.push({ ...e, ...req });
    }
    for (const e of [...bucket.text_written, ...bucket.cb_checked_exclusive, ...bucket.cb_checked_independent]) {
      const name = typeof e === 'string' ? e : e.name;
      const req = cond.required.get(name);
      if (req) condWronglyFilled.push({ name, ...req });
    }
    // Cells required empty that are moved out of text_empty leave the partition short, so they
    // are re-added to a bucket of their own and the total below counts them.
    bucket.cond_required_empty = condRequiredEmpty;
  }

  const total = Object.values(bucket).reduce((n, a) => n + a.length, 0);

  return {
    form, mapPath, fieldsPath, filledPath, saturated,
    fieldCount: enumerated.length, liveCount: liveNames.length,
    missingFromPdf, extraInPdf,
    bucket, violations, setFindings, total,
    conditional: { ...cond, requiredEmpty: condRequiredEmpty, wronglyFilled: condWronglyFilled },
    counts: {
      writableTargets: writable.size, neverTargets: never.size, deferredTargets: deferred.size,
      exclusiveSets: exclusiveSets.length,
      deferredSets: setFindings.filter(s => s.allDeferred).length,
    },
  };
}

const pad = (n) => String(n).padStart(5);

// How many empty cells production mode names. Enough that a systematically wrong key is
// obvious, few enough that a sparse record does not bury the rest of the report.
const EMPTY_EXAMPLES = 6;

export function reportFormCoverage(r) {
  const B = r.bucket;
  console.log(`verify-form-coverage: ${r.form}`);
  console.log(`  map:    ${r.mapPath}`);
  console.log(`  fields: ${r.fieldsPath} (${r.fieldCount} enumerated)`);
  console.log(`  filled: ${r.filledPath} (${r.liveCount} live fields)`);
  console.log(`  mode:   ${r.saturated
    ? 'SATURATED (acceptance sample) — an empty mapped text cell is a FAILURE'
    : 'production record — empty mapped text cells are REPORTED, not failures'}`);
  console.log('');
  console.log('  state of every field on the form');
  console.log('  ---------------------------------------------------------------------');
  console.log(`  ${pad(B.text_written.length)}  text cells written`);
  console.log(`  ${pad(B.text_empty.length)}  text cells EMPTY (${r.saturated
    ? 'gap — a mapped cell the record did not feed'
    : 'mapped, this record had nothing for them — normal on a real record'})`);
  console.log(`  ${pad(B.cb_checked_exclusive.length)}  checkboxes checked (one per exclusive set)`);
  console.log(`  ${pad(B.cb_unchecked_exclusive.length)}  checkbox alternatives correctly unchecked`);
  console.log(`  ${pad(B.cb_checked_independent.length)}  checkboxes checked (independent, in no exclusive set)`);
  console.log(`  ${pad(B.cb_unchecked_independent.length)}  checkboxes unchecked (independent)`);
  console.log(`  ${pad(B.never_blank.length)}  never auto-filled, blank by design`);
  console.log(`  ${pad(B.deferred_blank.length)}  deferred, blank by design`);
  console.log(`  ${pad(B.mapped_other_type.length)}  mapped, neither text nor checkbox`);
  console.log(`  ${pad(B.unreferenced.length)}  unreferenced by the map`);
  console.log('  ---------------------------------------------------------------------');
  console.log(`  ${pad(r.total)}  total`);
  console.log(`  ${pad(r.fieldCount)}  fields on the form${r.total === r.fieldCount ? '  — accounting CLOSES' : '  — MISMATCH'}`);
  examined('verify-form-coverage', r.form, r.fieldCount, 'form-fields-accounted-for');
  console.log('');
  console.log(`  exclusive sets: ${r.counts.exclusiveSets} (${r.counts.deferredSets} fully deferred, required to have ZERO checked)`);
  console.log(`  map bindings:   ${r.counts.writableTargets} writable, ${r.counts.neverTargets} never-autofill, ${r.counts.deferredTargets} deferred`);

  let failed = 0;

  if (r.missingFromPdf.length || r.extraInPdf.length) {
    failed++;
    console.error('');
    console.error(`FIELD LIST DISAGREES WITH THE FILLED PDF — this is not the form the map was enumerated from.`);
    r.missingFromPdf.slice(0, 10).forEach(n => console.error(`  enumerated but absent from the PDF: ${n}`));
    r.extraInPdf.slice(0, 10).forEach(n => console.error(`  present in the PDF but not enumerated: ${n}`));
  }

  if (B.text_empty.length && r.saturated) {
    failed++;
    console.error('');
    console.error(`EMPTY TEXT TARGET — ${B.text_empty.length} mapped text cell(s) carry no value.`);
    console.error('  Each is a cell the map binds and the record did not feed. On a saturated record this');
    console.error('  should be zero; the map path names the input key that is missing.');
    for (const e of B.text_empty) console.error(`  ${e.paths.join(' | ')}\n    -> ${e.name}`);
  } else if (B.text_empty.length) {
    // Production mode: reported, never failed. Still listed BY MAP PATH rather than by field
    // name, because the path is what names the input key — so a systematically wrong key is
    // still visible here to anyone who reads the output, it just does not stop the run.
    console.log('');
    console.log(`  ${B.text_empty.length} mapped text cell(s) are empty on this record — not a failure in production mode.`);
    console.log('  A real record does not reach every slot the map binds; these are the slots it did not reach.');
    for (const e of B.text_empty.slice(0, EMPTY_EXAMPLES)) console.log(`    ${e.paths.join(' | ')}`);
    if (B.text_empty.length > EMPTY_EXAMPLES) {
      console.log(`    ... and ${B.text_empty.length - EMPTY_EXAMPLES} more (not listed — re-run with --saturated to name every one)`);
    }
  }

  if (r.conditional?.active) {
    console.log('');
    console.log(`  SUBJECT-CONDITIONAL — this record declares itself ${JSON.stringify(r.conditional.subject)}, and ${r.conditional.requiredEmpty.length} mapped text cell(s) exist only for the other subject.`);
    console.log('  They are REQUIRED empty and are therefore not saturation failures. Each is named with the printed caption that made it conditional:');
    for (const e of r.conditional.requiredEmpty)
      console.log(`    ${e.stem} (${e.side} only) -> ${e.name}\n      ${JSON.stringify(e.caption.slice(0, 70))}`);
    if (!r.conditional.requiredEmpty.length) console.log('    (none — this record\'s subject reaches every conditional cell the map declares)');
  }
  if (r.conditional?.wronglyFilled?.length) {
    failed++;
    console.error('');
    console.error(`SUBJECT-CONDITIONAL CELL CARRIES A VALUE — ${r.conditional.wronglyFilled.length}. [SC-7], asked of the FILED DOCUMENT.`);
    for (const e of r.conditional.wronglyFilled)
      console.error(`  ${e.stem} -> ${e.name}: exists only for the ${e.side} subject and this record declares itself ${r.conditional.subject}. The page says so at ${JSON.stringify(e.caption.slice(0, 70))}.`);
  }

  const badSets = r.setFindings.filter(s => !s.ok);
  if (badSets.length) {
    failed++;
    console.error('');
    console.error(`EXCLUSIVE SET NOT SETTLED — ${badSets.length} set(s) do not have exactly the required number checked.`);
    for (const s of badSets) {
      if (s.empty) { console.error(`  ${s.empty}`); continue; }
      console.error(`  set "${s.set}": ${s.checked.length} checked, expected exactly ${s.expect}${s.allDeferred ? ' (every target is under _deferred)' : ''}`);
      s.targets.forEach(t => console.error(`    ${s.checked.includes(t) ? '[x]' : '[ ]'} ${t}`));
    }
  }

  if (r.violations.never_written.length) {
    failed++;
    console.error('');
    console.error(`NEVER-AUTOFILL CELL CARRIES A VALUE — ${r.violations.never_written.length}.`);
    r.violations.never_written.forEach(v => console.error(`  ${v.name} = ${JSON.stringify(v.value)}`));
  }
  if (r.violations.deferred_written.length) {
    failed++;
    console.error('');
    console.error(`DEFERRED CELL CARRIES A VALUE — ${r.violations.deferred_written.length}.`);
    r.violations.deferred_written.forEach(v => console.error(`  ${v.name} = ${JSON.stringify(v.value)}`));
  }

  if (r.total !== r.fieldCount) {
    failed++;
    console.error('');
    console.error(`ACCOUNTING DOES NOT CLOSE — categories sum to ${r.total}, the form has ${r.fieldCount} fields.`);
  }

  if (failed) {
    console.error('');
    console.error(`WHOLE-FORM COVERAGE FAILED — ${failed} category assertion(s) did not hold.`);
    return 2;
  }
  console.log('');
  console.log(`OK — every field on the form is in a state the map accounts for, and the accounting closes. (${r.saturated ? 'saturated' : 'production'} mode)`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const saturated = argv.includes('--saturated');
  const [form, filled] = argv.filter(a => !a.startsWith('--'));
  if (!form || !filled) {
    console.error('usage: node adapters/pdf/verify-form-coverage.mjs <form> <filled.pdf> [record.json] [--saturated]');
    console.error('  record.json  the record the PDF was filled from. Only used where the map declares');
    console.error('               subject_classes: it supplies the discriminator the conditional');
    console.error('               emptiness exemption and its two-directional check are asked against.');
    console.error('  --saturated  acceptance sample: an empty mapped text cell FAILS the run.');
    console.error('  (default)    production record: empty mapped text cells are reported, not failed.');
    process.exit(2);
  }
  const recordPath = argv.filter(a => !a.startsWith('--'))[2] || null;
  process.exit(reportFormCoverage(await verifyFormCoverage(form, filled, { saturated, recordPath })));
}
