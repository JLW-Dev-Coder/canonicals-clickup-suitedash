// Whole-form accounting: every field on the form, in exactly one state, proved from the
// map and the filled PDF.
//
// CLI:  node adapters/pdf/verify-form-coverage.mjs <form> <filled.pdf>
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
//   never-autofill blank            allowed._never_autofill — mapped, understood, blank on purpose
//   deferred blank                  _deferred — not resolved yet, validated for existence, never filled
//   mapped, other field type        neither text nor checkbox (a button, a signature)
//   unreferenced by the map         the map does not mention this field at all
//
// AN EMPTY TEXT TARGET IS A FAILURE, NOT A PASS. On a saturated record every mapped text
// cell should carry a value; one that does not means the record is missing the key that
// feeds it. Reporting that as "N written" and moving on would let the count quietly come
// in low, which is indistinguishable from the map being wrong. So each one is named, with
// the map path that binds it, and the run fails.
//
// "EXACTLY ONE CHECKED", NOT "AT MOST ONE". The fill scripts already enforce at-most-one —
// that is a violation guard, and it passes an untouched form. On a saturated record the
// stronger claim is the one that means something: every set the record can answer IS
// answered. The single exception is derived, not special-cased: a set whose targets are
// ALL under _deferred is a set the map says it cannot answer yet, so it is required to
// have exactly ZERO checked instead.

import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';

const TARGET_PREFIX = 'topmostSubform[0].';

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
const GUARD_NEVER     = 'allowed._never_autofill';

// Collect [path, target] for every field-target string anywhere in the map, at any depth,
// under any key — the same schema-agnostic walk validate-map.mjs uses, and for the same
// reason: a target authored under a key this file had never heard of must not be silently
// skipped. The PATH is kept, not just the target: it is what names the offending input
// key when a cell comes back empty.
export function walkTargets(node, path = '', out = []) {
  if (typeof node === 'string') {
    if (node.startsWith(TARGET_PREFIX)) out.push({ path, target: node });
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
    if (under(path, GUARD_NEVER))    { never.add(target);    continue; }
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

export async function verifyFormCoverage(form, filledPath) {
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
    const allDeferred = targets.every(t => deferred.has(t));
    const checked = targets.filter(t => { const f = byName.get(t); return f instanceof PDFCheckBox && f.isChecked(); });
    const expect = allDeferred ? 0 : 1;
    return { set, targets, allDeferred, checked, expect, ok: checked.length === expect };
  });

  const total = Object.values(bucket).reduce((n, a) => n + a.length, 0);

  return {
    form, mapPath, fieldsPath, filledPath,
    fieldCount: enumerated.length, liveCount: liveNames.length,
    missingFromPdf, extraInPdf,
    bucket, violations, setFindings, total,
    counts: {
      writableTargets: writable.size, neverTargets: never.size, deferredTargets: deferred.size,
      exclusiveSets: exclusiveSets.length,
      deferredSets: setFindings.filter(s => s.allDeferred).length,
    },
  };
}

const pad = (n) => String(n).padStart(5);

export function reportFormCoverage(r) {
  const B = r.bucket;
  console.log(`verify-form-coverage: ${r.form}`);
  console.log(`  map:    ${r.mapPath}`);
  console.log(`  fields: ${r.fieldsPath} (${r.fieldCount} enumerated)`);
  console.log(`  filled: ${r.filledPath} (${r.liveCount} live fields)`);
  console.log('');
  console.log('  state of every field on the form');
  console.log('  ---------------------------------------------------------------------');
  console.log(`  ${pad(B.text_written.length)}  text cells written`);
  console.log(`  ${pad(B.text_empty.length)}  text cells EMPTY (gap — a mapped cell the record did not feed)`);
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

  if (B.text_empty.length) {
    failed++;
    console.error('');
    console.error(`EMPTY TEXT TARGET — ${B.text_empty.length} mapped text cell(s) carry no value.`);
    console.error('  Each is a cell the map binds and the record did not feed. On a saturated record this');
    console.error('  should be zero; the map path names the input key that is missing.');
    for (const e of B.text_empty) console.error(`  ${e.paths.join(' | ')}\n    -> ${e.name}`);
  }

  const badSets = r.setFindings.filter(s => !s.ok);
  if (badSets.length) {
    failed++;
    console.error('');
    console.error(`EXCLUSIVE SET NOT SETTLED — ${badSets.length} set(s) do not have exactly the required number checked.`);
    for (const s of badSets) {
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
  console.log('OK — every field on the form is in a state the map accounts for, and the accounting closes.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [form, filled] = process.argv.slice(2);
  if (!form || !filled) {
    console.error('usage: node adapters/pdf/verify-form-coverage.mjs <form> <filled.pdf>');
    process.exit(2);
  }
  process.exit(reportFormCoverage(await verifyFormCoverage(form, filled)));
}
