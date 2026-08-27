// Side-by-side review page: what the CRM held, against what the filled PDF actually prints.
//
// CLI:  node adapters/pdf/render-review.mjs <form> <record.json> <filled.pdf> [out.html]
// Out:  a single self-contained HTML file. Inline CSS, no scripts, no external requests.
//
// WHY THIS EXISTS
// ---------------
// Every other tool in this directory answers a question about the FORM: does the map cover
// it, is every value drawn, do the printed totals agree. None of them answers the question a
// human actually asks before a collection statement goes out the door, which is "is this MY
// client's information." That question needs both sides on one page, on the same row, and it
// needs the disagreements marked rather than left for someone to spot.
//
// THE READ-BACK COMES OFF THE PDF, NOT OUT OF THE RECORD. Every "value read back" cell in this
// page is fetched from the filled document's own field values. Rendering the record twice
// would produce a page that agrees with itself perfectly while the PDF said something else
// entirely — which is exactly the failure this page is built to catch, so it would be a
// particularly bad way to build it.
//
// NO FORM IS NAMED IN THE LOGIC. The bindings are read out of `<form>.map.json` using the same
// constructs the fill engine consumes — `map`, `split`, `special`, `groups`, `checkboxes`,
// `allowed` — so pointing this at 433-B needs a 433-B map and nothing else. Anything the map
// binds that this file cannot attribute to an input key is STILL LISTED, with its source shown
// as unattributed, because a silently omitted row is indistinguishable from a row that matched.

import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { readFileSync, writeFileSync, existsSync } from 'fs';
// THE TARGET ROOTS, DERIVED. Two predicates here read `topmostSubform[0].` as a literal and
// 433-D's fields are rooted at `form1[0].`, so on that form both would have selected nothing:
// the review page would render with no checkbox and no bound cell and would look like a
// correctly rendered empty form. See adapters/pdf/target-root.mjs.
import { rootPrefixForForm, FIELD_FORMS } from './target-root.mjs';
const TARGET_ROOTS = [...new Set(FIELD_FORMS().map((f) => rootPrefixForForm(f)).filter((r) => r.root).map((r) => r.root))];
if (!TARGET_ROOTS.length) throw new Error('render-review.mjs: no target root could be derived from any form field list, so every bound cell would be invisible here.');
const isTarget = (s) => TARGET_ROOTS.some((r) => s.startsWith(r));
import { createHash } from 'node:crypto';
import { verifyFormCoverage } from './verify-form-coverage.mjs';

const [form, recordPath, filledPath, outArg] = process.argv.slice(2);
if (!form || !recordPath || !filledPath) {
  console.error('usage: node adapters/pdf/render-review.mjs <form> <record.json> <filled.pdf> [out.html]');
  process.exit(2);
}

const mapDoc   = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
const data     = JSON.parse(readFileSync(recordPath, 'utf8'));
const REG_PATH = 'adapters/hubspot/fields.registry.json';
const GEN_PATH = `adapters/hubspot/fields.${form}.json`;

// Property names come from the generated per-form file when there is one, and from the
// registry otherwise — the same precedence the provisioner uses, so this page can never name a
// property the provisioner would not create.
const propsFor = [];
if (existsSync(GEN_PATH)) propsFor.push(...JSON.parse(readFileSync(GEN_PATH, 'utf8')).properties);
else if (existsSync(REG_PATH)) {
  propsFor.push(...JSON.parse(readFileSync(REG_PATH, 'utf8')).properties.filter(p => p.form === form));
}
const byKey = new Map(propsFor.map(p => [p.key, p]));
const hsNameFor = (key) => byKey.get(key)?.hs_name ?? null;
const labelFor  = (key) => byKey.get(key)?.label ?? null;

const pdf  = await PDFDocument.load(readFileSync(filledPath));
const live = pdf.getForm();

const readTarget = (target) => {
  let f;
  try { f = live.getField(target); } catch { return { kind: 'missing' }; }
  if (f instanceof PDFTextField) return { kind: 'text', value: f.getText() ?? '' };
  if (f instanceof PDFCheckBox)  return { kind: 'checkbox', value: f.isChecked() };
  return { kind: 'other', value: null };
};

// --- comparison ---------------------------------------------------------------------------
// "1850" and "1,850.00" are the same figure printed two ways, and flagging that as a mismatch
// would train a reader to ignore the mismatch column — which is the only column that matters.
// So money is compared as a NUMBER when both sides parse as one, and as trimmed text otherwise.
const asNumber = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const neg = /^\(.*\)$/.test(s) || s.startsWith('-');
  const d = s.replace(/[()]/g, '').replace(/^-/, '').replace(/[$\s,]/g, '');
  if (!/^\d*\.?\d+$/.test(d)) return null;
  return (neg ? -1 : 1) * Number(d);
};
const blank = (v) => v === undefined || v === null || String(v).trim() === '';
const norm  = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

const compare = (hs, pdfVal) => {
  const hsBlank = blank(hs), pdfBlank = blank(pdfVal);
  if (hsBlank && pdfBlank) return 'empty';
  if (hsBlank && !pdfBlank) return 'pdf-only';
  if (!hsBlank && pdfBlank) return 'MISMATCH';
  const a = asNumber(hs), b = asNumber(pdfVal);
  if (a !== null && b !== null) return Math.round(a * 100) === Math.round(b * 100) ? 'ok' : 'MISMATCH';
  return norm(hs) === norm(pdfVal) ? 'ok' : 'MISMATCH';
};

// --- where a target prints ------------------------------------------------------------------
// This form's registry mostly carries no printed-line marker, so the location is derived from
// the widget's own path, which encodes page, section, column and row. It is the form's own
// structure rather than a lookup table, so it stays true on a form nobody has labelled yet.
const seg = (target) => target.replace(/^topmostSubform\[0\]\./, '').split('.').map(s => s.replace(/\[(\d+)\]$/, (m, i) => (i === '0' ? '' : `[${i}]`)));
const sectionOf = (target) => {
  const parts = seg(target);
  return parts.slice(0, Math.min(2, parts.length - 1)).join(' › ') || parts[0];
};
const lineOf = (key, target) => {
  const p = byKey.get(key);
  if (p?.line_ref) return p.line_ref;
  const parts = seg(target);
  const row = parts.find(s => /^Row/i.test(s));
  return row || parts[parts.length - 1];
};

// --- WHAT THE ENGINE ACTUALLY VERIFIED, ON THIS DOCUMENT -------------------------------------
//
// The preparer's question is not "is this cell declared checkable" but "did anything check it".
// Those are different: a line can be declared checkable and still have been SKIPPED on this
// record because its printed conditional is not the branch this taxpayer is on. A review page
// that read `verified` off the declaration would print a tick beside a cell nothing recomputed,
// which is worse than printing nothing.
//
// So the verdict comes from `<filled>.tripwires.json`, which gate step 11 writes on the pass
// that does the arithmetic, and it is bound to the document by SHA-256. Three ways it can be
// wrong and all three are visible on the page: absent, belonging to another document, or
// unreadable. In every one of them the page says the engine's verification is UNKNOWN rather
// than quietly falling back to the declaration. A guard that cannot read its input says so.
const tripwirePath = filledPath.replace(/\.pdf$/, '.tripwires.json');
const filledSha = createHash('sha256').update(readFileSync(filledPath)).digest('hex');
let trip = null, tripWhy = null;
if (!existsSync(tripwirePath)) {
  tripWhy = `no ${tripwirePath}. Gate step 11 writes it beside the filled PDF; run the gate for this record and the verification column fills in.`;
} else {
  try {
    const t = JSON.parse(readFileSync(tripwirePath, 'utf8'));
    // A FORM WITH NO ARITHMETIC IS NOT A FORM WITH A STALE RESULT.
    //
    // The engine stamps `filled_sha256` on a tripwires file it wrote a VERIFICATION into. A form
    // that prints no total has nothing to verify, so its engine writes the run's own record —
    // subject, route taken, conditional cells proved empty — and no arithmetic and no stamp. This
    // branch read the missing stamp as a stamp that disagreed, and told a preparer the result was
    // stale on a form for which no result was ever possible. `${t.totals ?? ''}` is not the test:
    // the form's own totals declaration is, and it is read here rather than inferred from silence.
    const printsArithmetic = (JSON.parse(readFileSync(`adapters/pdf/maps/${form}.totals.json`, 'utf8')).totals || []).length > 0;
    if (t.filled_sha256 === undefined && !printsArithmetic) tripWhy = `${form.toUpperCase()} prints no arithmetic — adapters/pdf/maps/${form}.totals.json declares zero totals — so there is no sum on this document for the engine to have checked. The Arithmetic column reads "not a total" on every row because every row IS one, not because a check was skipped.`;
    else if (t.filled_sha256 !== filledSha) tripWhy = `${tripwirePath} records a run against a DIFFERENT document (its SHA-256 is ${String(t.filled_sha256).slice(0, 12)}…, this PDF is ${filledSha.slice(0, 12)}…). A stale result read as a fresh one is the failure this check exists for.`;
    else trip = t;
  } catch (e) { tripWhy = `${tripwirePath} could not be read: ${e.message}`; }
}

// addr -> { state, ... } for every total-shaped cell the engine has an opinion about.
//   'verified'      step 11 recomputed it from the printed operands and it matched
//   'verified+ask'  the same, AND the printed caption asks something arithmetic cannot express
//   'not-checkable' nothing on the page could verify it; some of these state a printed formula
//   'skipped'       the line's printed conditional is not the branch this record is on
//
// SEVERAL DECLARED LINES CAN ADDRESS ONE PRINTED CELL, so the join AGGREGATES rather than
// overwriting. (6a) declares an `own` branch and a `leased` branch for the same quick-sale-
// equity cell and exactly one runs on any record; a `Map.set` per line keeps whichever came
// last, which on this fixture meant a cell the engine verified reported as skipped, and the
// page's own "0 not on this branch" disagreed with the gate's "2 skipped" in the same run.
const VERIFY = new Map();
if (trip) {
  const push = (addr, v) => { if (!VERIFY.has(addr)) VERIFY.set(addr, []); VERIFY.get(addr).push(v); };
  for (const l of trip.lines) {
    if (!l.addr) continue;
    push(l.addr, { state: l.verdict, line: l.line, caption: l.caption, why: l.why, printed: l.printed, recomputed: l.recomputed });
  }
  for (const e of trip.declared_not_checkable) {
    if (!e.addr) continue;
    push(e.addr, { state: 'not-checkable', caption: e.printed_caption, why: e.why_not_checkable, formula: !!e.review_page_advisory });
  }
}
/**
 * ONE CELL, ONE STATE, DERIVED FROM EVERY LINE THAT ADDRESSES IT. Precedence is by what a
 * preparer needs to know first: a failure, then a verification (a cell one branch verified IS
 * verified, and the other branch's skip is reported beside it), then not-checkable, then
 * skipped — which is only the whole answer when NO line for this cell ran.
 */
const verifyFor = (addr, fallbackAddr) => {
  const list = (addr && VERIFY.get(addr)) || (fallbackAddr && VERIFY.get(fallbackAddr)) || null;
  if (!list || !list.length) return null;
  const pick = (st) => list.find(v => v.state === st);
  const chosen = pick('failed') || pick('not-checkable-at-runtime') || pick('verified') || pick('not-checkable') || pick('skipped') || list[0];
  const others = list.filter(v => v !== chosen);
  return { ...chosen, siblings: others, lines: list.length,
    // A cell verified on one branch whose OTHER declared branch did not run: the preparer is
    // told, because "verified" alone would hide that the form carries a conditional here.
    sibling_note: others.length ? `${others.length} other declared line(s) address this same printed cell: ${others.map(o => `${o.line ?? '?'} (${o.state})`).join(', ')}.` : null };
};
const addrForKey = (key) => `key:${key}`;
const addrForCell = (group, column, row) => `cell:${group}.${column}#${row}`;
// A not_checkable entry may name a cell with NO row, meaning the whole column. That is the
// fallback every row of the column falls back to when it has no row-specific line of its own.
const addrForColumn = (group, column) => `cell:${group}.${column}`;

// --- advisories on cells the gate deliberately does not check --------------------------------
//
// The tripwire step declines to verify some printed money cells and says why: everything they
// sum is on an ATTACHMENT, which this engine never sees. Declining is correct — nothing on the
// page could verify them. But some of those captions STATE A FORMULA, and that formula binds
// the preparer even though no check can enforce it. 433-A(OIC)'s (3b) is the sharp case: its
// caption reads "[current market value X .8 minus loan balance(s)]", so a preparer who omits
// the quick-sale discount on attached retirement accounts understates the offer by 20% of the
// attached market value, and nothing on the page — no total, no tripwire, no accounting — can
// catch it. Every other cell in this pipeline is checked by a machine; this class of cell can
// only be checked by a person, so the requirement is put in front of that person here.
//
// Declared in `<form>.totals.json`, not here, so this file still names no form. An entry
// addresses either a scalar map key or a whole group column, because the cell can be either.
const totalsPath = `adapters/pdf/maps/${form}.totals.json`;
const advisoryFor = { byKey: new Map(), byCell: new Map() };
if (existsSync(totalsPath)) {
  const totalsDoc = JSON.parse(readFileSync(totalsPath, 'utf8'));
  for (const e of (totalsDoc.not_checkable?.entries || [])) {
    if (!e.review_page_advisory) continue;
    const adv = { caption: e.printed_caption, text: e.review_page_advisory, kind: 'not_checkable' };
    if (e.map_key) advisoryFor.byKey.set(e.map_key, adv);
    if (e.cell?.group && e.cell?.column) advisoryFor.byCell.set(`${e.cell.group}.${e.cell.column}`, adv);
  }
  // AND A SECOND KIND, ADDED IN SLICE 7: an advisory on a cell the gate DOES check.
  // Every advisory before this one hung off a not_checkable entry, because every one of them
  // was about a cell nothing could verify. 433-A(OIC)'s Offer Amount is not that: its
  // arithmetic is recomputed by step 11 and holds, and the instruction printed beside it -
  // "Your offer must be more than zero ($0)" - is a constraint arithmetic cannot express. A
  // checked cell cannot carry a not_checkable entry (step 11 hard-stops on the contradiction),
  // so the advisory is declared on the TOTAL and read here. The two kinds are labelled
  // differently on the page, because "we did not check this" and "we checked the sum and the
  // page asks something else as well" are different things to tell a preparer.
  for (const e of (totalsDoc.totals || [])) {
    if (!e.review_page_advisory || !e.total_key) continue;
    advisoryFor.byKey.set(e.total_key, { caption: e.caption, text: e.review_page_advisory, kind: 'constraint' });
  }
}

// --- collect every binding the map declares -------------------------------------------------
const rows = [];
const add = (r) => {
  // A MIRRORED FORM BINDS ONE INPUT TO TWO TARGETS, AND THIS PAGE COULD NOT OPEN ONE.
  //
  // Every map before 433-D binds an input key to ONE target string. 433-D draws the whole
  // agreement TWICE — an IRS copy and a taxpayer copy — so its map binds each key to a LIST of
  // two, and `seg()` got an array and threw "target.replace is not a function" on the first row
  // it built. The review page has therefore never rendered for this form at all: not a wrong
  // page, no page.
  //
  // THE FIRST COPY IS THE ONE SHOWN AND THE SECOND IS PROVED TO AGREE WITH IT, which is the
  // only honest way to put two cells on one row. Showing the first alone would let the two
  // copies of a filed agreement disagree with a green tick beside them; and the copies
  // disagreeing is a real failure mode on a mirrored form, not a hypothetical, because the fill
  // engine writes each copy separately.
  const targets = Array.isArray(r.target) ? r.target : [r.target];
  if (targets.length > 1) {
    const reads = targets.map((t) => readTarget(t));
    const val = (x) => (x.kind === 'checkbox' ? (x.value ? 'checked' : '') : (x.kind === 'missing' ? null : x.value));
    const first = val(reads[0]);
    const disagree = reads.slice(1).some((x) => norm(val(x)) !== norm(first));
    r = { ...r, target: targets[0], mirrorCopies: targets.length, mirrorDisagree: disagree,
      mirrorUnreadable: reads.filter((x) => x.kind === 'missing').length };
  } else r = { ...r, target: targets[0] };
  const t = readTarget(r.target);
  const pdfValue = t.kind === 'checkbox' ? (t.value ? 'checked' : '') : (t.kind === 'missing' ? null : t.value);
  const v = verifyFor(r.addr, r.addrColumn);
  rows.push({
    ...r,
    // 'verified' PLUS a constraint advisory is the third state the preparer needs: the engine
    // checked the sum AND the printed caption asks for something the sum cannot express.
    verify: v && v.state === 'verified' && (r.advisory ?? (r.keys?.map(k => advisoryFor.byKey.get(k)).find(Boolean)))?.kind === 'constraint'
      ? { ...v, state: 'verified+ask' } : v,
    pdfKind: t.kind,
    pdfValue,
    advisory: r.advisory ?? (r.keys?.map(k => advisoryFor.byKey.get(k)).find(Boolean) ?? null),
    section: sectionOf(r.target),
    line: r.line ?? lineOf(r.keys?.[0], r.target),
    verdict: t.kind === 'missing' ? 'MISMATCH' : compare(r.hsValue, pdfValue),
  });
};

// 1. scalar 1:1
for (const [key, target] of Object.entries(mapDoc.map || {})) {
  if (key.startsWith('_')) continue;
  add({ construct: 'map', keys: [key], target, hsValue: data[key], label: labelFor(key), addr: addrForKey(key) });
}

// 2. `special` composites — several input keys joined into one printed cell
for (const [name, def] of Object.entries(mapDoc.special || {})) {
  if (!def || typeof def !== 'object' || !def.pdf || !Array.isArray(def.from)) continue;
  const parts = def.from.map(k => data[k]).filter(Boolean);
  add({
    construct: `special.${name}`, keys: def.from, target: def.pdf,
    hsValue: parts.length ? parts.join(def.join ?? ' ') : '',
    label: `composite of ${def.from.join(' + ')}`,
  });
}

// 3. `split` — one input value across abutting printed boxes
for (const [key, def] of Object.entries(mapDoc.split || {})) {
  if (key.startsWith('_') || !def || !Array.isArray(def.parts)) continue;
  const raw = data[key];
  const stripped = def.strip && raw !== undefined ? String(raw).replace(new RegExp(def.strip, 'g'), '') : String(raw ?? '');
  let at = 0;
  def.parts.forEach((part, i) => {
    const chunk = stripped.slice(at, at + (part.chars ?? 0));
    at += part.chars ?? 0;
    const shown = part.format ? [...part.format].map(c => (c === '#' ? chunk[0 + [...part.format].slice(0, [...part.format].indexOf(c)).length] : c)).join('') : chunk;
    add({
      construct: 'split', keys: [key], target: part.target,
      hsValue: blank(raw) ? '' : (part.format ? applyFormat(chunk, part.format) : chunk),
      label: `${labelFor(key) ?? key} — printed box ${i + 1} of ${def.parts.length}`,
      note: shown === undefined ? null : null,
    });
  });
}
function applyFormat(chunk, format) {
  let out = '', i = 0;
  for (const ch of format) out += ch === '#' ? (chunk[i++] ?? '') : ch;
  return out;
}

// 4. repeatable groups — resolved exactly the way the fill engine resolves them, array first,
//    scalar fallback second, so the page shows the rows that were actually printed.
for (const [g, def] of Object.entries(mapDoc.groups || {})) {
  if (g.startsWith('_') || !def || !Array.isArray(def.slots)) continue;
  const arrayKey = def.array || def.source || g;
  const usedArray = Array.isArray(data[arrayKey]);
  const fb = def.fallback || [];
  const resolved = usedArray
    ? data[arrayKey]
    : fb.map(row => {
        const r = {};
        for (const [sub, key] of Object.entries(row)) r[sub] = data[key];
        return r;
      }).filter(r => Object.values(r).some(v => !blank(v)));

  def.slots.forEach((slot, i) => {
    const flat = slot.text ? { ...slot.text } : { ...slot };
    for (const [sub, target] of Object.entries(flat)) {
      if (typeof target !== 'string') continue;
      const srcKey = usedArray ? null : fb[i]?.[sub];
      add({
        construct: `groups.${g}[${i}]`,
        keys: srcKey ? [srcKey] : [],
        target,
        hsValue: resolved[i]?.[sub],
        label: `${g} row ${i + 1} — ${sub}`,
        addr: addrForCell(g, sub, i),
        addrColumn: addrForColumn(g, sub),
        advisory: advisoryFor.byCell.get(`${g}.${sub}`) ?? null,
        note: usedArray ? `from ${arrayKey}[${i}].${sub}` : (srcKey ? null : 'no scalar fallback key feeds this slot'),
      });
    }
  });
}

// 5. checkboxes — every target the map binds, with its state read off the page
const cbTargets = [];
(function walkCb(node, path) {
  if (typeof node === 'string' && isTarget(node)) { cbTargets.push({ path, target: node }); return; }
  if (Array.isArray(node)) return node.forEach((v, i) => walkCb(v, `${path}[${i}]`));
  if (node && typeof node === 'object') Object.entries(node).forEach(([k, v]) => walkCb(v, `${path}.${k}`));
})(mapDoc.checkboxes || {}, 'checkboxes');
for (const { path, target } of cbTargets) {
  add({ construct: 'checkboxes', keys: [], target, hsValue: undefined, label: path.replace(/^checkboxes\./, '') });
}

// 5b. `check_here` — THE LONE BOX WITH NO COUNTERPART CELL, and it is a fifth construct rather
// than a shape of `checkboxes`. A checkbox block is a NAMED-OPTION SET: the record says "yes"
// and the engine ticks the yes target out of two or more. A check_here entry is ONE box whose
// negative answer is the box left blank, so it binds a single `target` and carries its own
// input key — and that key is the thing this page has to attribute the tick to.
//
// LEFT OUT UNTIL NOW, AND IT WAS TELLING A PREPARER SOMETHING FALSE. The walk above reads
// `mapDoc.checkboxes` and nothing else, so on 433-B(OIC) the nine page-6 attachment ticks and
// the only-employee box came out as ELEVEN record values reaching no printed cell — on a record
// where the fill engine had ticked every one of them. 433-A(OIC) has seventeen of the same
// construct and the same gap. The construct is read from the map exactly the way the fill
// engines and bindings.mjs read it: an entry with a string `target` is an input, and an entry
// without one is the block's own `_why` prose.
for (const [key, def] of Object.entries(mapDoc.check_here || {})) {
  if (key.startsWith('_') || !def || typeof def.target !== 'string') continue;
  const v = data[key];
  const ticked = v === true || ['yes', 'true', '1'].includes(String(v ?? '').trim().toLowerCase());
  add({
    construct: 'check_here', keys: [key], target: def.target,
    // The page reads a tick off the PDF as "checked"; the record's side has to speak the same
    // vocabulary or every one of these would report as a disagreement between "yes" and "checked".
    hsValue: blank(v) ? '' : (ticked ? 'checked' : ''),
    label: labelFor(key) ?? key,
    addr: addrForKey(key),
    note: blank(v) ? 'the record answers this box neither way, so it is left blank — which is what an unticked check-here box means'
      : (ticked ? null : `the record answers ${JSON.stringify(v)}, and a check-here box has no printed "no": the negative answer IS the empty box`),
  });
}

// 6. the IRS allowable column — computed, not supplied, so it is shown with its arithmetic
const allowedRows = [];
(function walkAllowed(node, path) {
  if (typeof node === 'string' && isTarget(node)) {
    const t = readTarget(node);
    allowedRows.push({ path: path.replace(/^allowed\./, ''), target: node, value: t.kind === 'text' ? t.value : null });
    return;
  }
  if (Array.isArray(node)) return node.forEach((v, i) => walkAllowed(v, `${path}[${i}]`));
  if (node && typeof node === 'object') Object.entries(node).forEach(([k, v]) => walkAllowed(v, `${path}.${k}`));
})(mapDoc.allowed || {}, 'allowed');

const stdPath = 'adapters/pdf/maps/irs-standards-2026.json';
const std = existsSync(stdPath) ? JSON.parse(readFileSync(stdPath, 'utf8')) : null;
const rawHH = parseInt(data.household_size ?? data[`${mapDoc.form}_hh_size`] ?? '', 10);
const hhKey = String(Math.min(4, Math.max(1, rawHH || 1)));
const ageBand = data.age_band ?? data[`${mapDoc.form}_age_band`];

const allowedArithmetic = (name) => {
  if (!std) return 'no standards table loaded';
  if (name === 'oop_by_age') {
    const band = ageBand === '65_over' ? '65_over' : 'under_65';
    return `age band ${ageBand ? `"${ageBand}"` : '(absent, defaulted to under 65)'} → oop["${band}"] = ${std.oop[band]}`;
  }
  const cat = name.split('.').pop();
  const natl = std.national[hhKey];
  if (!natl) return 'no national row for this household size';
  if (cat === 'total') {
    if (rawHH > 4) {
      return `household ${rawHH} > 4 → national["4"].total ${std.national['4'].total} + ${rawHH - 4} × ${std.national_addl_total} = ${std.national['4'].total + std.national_addl_total * (rawHH - 4)}`;
    }
    return `household ${rawHH || 1} → national["${hhKey}"].total = ${natl.total}`;
  }
  return `household ${rawHH || 1} → national["${hhKey}"].${cat} = ${natl[cat]}`;
};

// --- values the record carried that reach no printed cell -------------------------------------
//
// The coverage tool answers "which mapped cells did this record leave empty". This is the
// OTHER direction, and nothing else in the pipeline asks it: which values did the CRM hand us
// that never landed anywhere on the page. Both are quiet failures, but this one is the worse
// of the two — an empty cell is visible on the printed form, whereas a dropped value looks
// exactly like a value the client never gave.
//
// Consumption is counted from the map's own constructs plus the handful of input names the
// fill engine reads directly (household size, age band, pay frequency, the address-differs
// flag), each in both its bare and form-prefixed spelling. A key listed below is either
// deliberately unmapped for this form or a gap; the page says which it cannot tell apart.
const consumed = new Set();
rows.forEach(r => (r.keys || []).forEach(k => consumed.add(k)));
// Group inputs: both the array key the engine prefers and every scalar fallback key.
for (const [g, def] of Object.entries(mapDoc.groups || {})) {
  if (g.startsWith('_') || !def) continue;
  consumed.add(def.source || def.array || g);
  for (const fb of def.fallback || []) Object.values(fb).forEach(k => consumed.add(k));
}
// Checkbox option sets are keyed BY their input key on a named-option map (433-A), so those
// keys are consumed even though no text cell carries them.
for (const k of Object.keys(mapDoc.checkboxes || {})) if (!k.startsWith('_')) consumed.add(k);
for (const k of Object.keys(mapDoc.split || {})) if (!k.startsWith('_')) consumed.add(k);
// The allowable inputs, by the names the MAP declares rather than by a copy kept here.
for (const k of [mapDoc.allowed?.national_standards_total?.input, ...(mapDoc.allowed?.out_of_pocket_health?.inputs || [])]) {
  if (k) consumed.add(k);
}
for (const bare of ['household_size', 'age_band', 'pay_freq', 'spouse_pay_freq', 'address_differs']) {
  consumed.add(bare);
  consumed.add(`${mapDoc.form}_${bare}`);
}
consumed.add(`${mapDoc.form}_hh_size`);
consumed.add(`${mapDoc.form}_addr_differs`);
// THE ROUTE KEYS ARE CONSUMED, AND THE DISCRIMINATOR IS CONSUMED WITHOUT BEING PRINTED.
//
// A subject-DEPENDENT cell is fed by one of two keys chosen at fill time, and neither of those
// keys is in `mapDoc.map` — the PRINTED key is, and the engine never reads it. The discriminator
// is read too and names no printed cell at all. So this page reported the identifier that IS on
// the document, and the word that decided which one it is, as "values that reach no printed
// cell" — the label it reserves for a dropped value, which is the worse of the two quiet
// failures it exists to catch. Both are consumed, and the discriminator has a section of its own
// above rather than a line in a list of things that went nowhere.
for (const [s, d] of Object.entries(mapDoc.subject_classes || {})) {
  if (s.startsWith('_') || !d || d.class !== 'dependent' || !d.route) continue;
  for (const k of Object.values(d.route)) consumed.add(k);
}

const orphans = Object.keys(data)
  // `_`-prefixed keys are the sample's own prose (why a fixture holds the values it holds),
  // not taxpayer input, and `intake_id` names the record rather than filling a cell.
  .filter(k => k !== 'intake_id' && !k.startsWith('_') && !blank(data[k]) && !consumed.has(k))
  .map(k => ({ key: k, value: typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k], property: hsNameFor(k) }));

// --- coverage accounting for the header ------------------------------------------------------
// THE RECORD IS PASSED, AND ON A SUBJECT-CONDITIONAL FORM IT IS REQUIRED. verify-form-coverage
// refuses to compute the emptiness exemption without the record’s declared subject rather than
// skipping it, so this call omitting the record made the whole page unrenderable for 433-D. It
// was never wrong for the five forms before it — none declares a conditional cell — which is why
// nothing said so.
const cov = await verifyFormCoverage(form, filledPath, { saturated: false, recordPath });

// --- render ------------------------------------------------------------------------------------
// ══ THE DECLARED SUBJECT, AND WHAT IT DECIDED ═════════════════════════════════════════════════════════════════
//
// A form whose SUBJECT IS A PROPERTY OF THE RECORD rather than of the form decides two things
// from one declared word, and both are permanent on the filed page: which property the printed
// identifier box was filled from, and which of the subject-CONDITIONAL boxes may be ticked.
//
// [DM-1] IS THE REASON THIS BLOCK IS HERE AND IT STAYS OPEN. The engine fills the page FROM the
// declaration, so the page agreeing with the declaration proves nothing about whether the
// declaration is right — an entity record with a natural person's name in it fills perfectly.
// Nothing in this repo can check it. So it is put in front of the one reader who can, at the top
// of the page, with the consequence of getting it wrong stated rather than implied.
//
// NO FORM IS NAMED HERE. The route comes from `subject_classes.<stem>.route`, the conditional
// boxes from `empty_unless`, and the ticked/untouched verdicts are read OFF THE FILLED PDF like
// every other value on this page. A form declaring no route renders nothing at all.
const subjectRoutes = Object.entries(mapDoc.subject_classes || {})
  .filter(([s, d]) => !s.startsWith('_') && d && d.class === 'dependent' && d.route);
let subjectBlock = null;
if (subjectRoutes.length) {
  const [stem, decl] = subjectRoutes[0];
  const declared = String(data[decl.route.discriminator] ?? '').trim().toLowerCase();
  const sides = Object.keys(decl.route).filter((k) => k !== 'discriminator');
  const other = sides.find((s) => s !== declared) ?? null;
  const branchRow = (side) => {
    const key = decl.route[side];
    return { side, key, hs: hsNameFor(key), value: data[key], taken: side === declared };
  };
  // The printed box itself, read off the PDF: one cell, and the value in it came from whichever
  // branch the declaration chose.
  const printed = (mapDoc.map || {})[Object.keys(mapDoc.map || {}).find((k) => {
    const camel = stem.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/_+/g, '_').toLowerCase();
    return k === ((mapDoc._key_overrides || {})[stem] || `${mapDoc.form}_${camel}`);
  })] || [];
  const printedRead = printed.length ? readTarget(printed[0]) : { kind: 'missing' };
  // The subject-CONDITIONAL boxes, and which one the page actually carries. Read off the PDF.
  const condBoxes = [];
  for (const [cstem, cdecl] of Object.entries(mapDoc.subject_classes || {})) {
    if (cstem.startsWith('_') || !cdecl || cdecl.class !== 'conditional') continue;
    for (const [cbKey, cbDef] of Object.entries(mapDoc.checkboxes || {})) {
      if (cbKey.startsWith('_') || !cbDef || typeof cbDef !== 'object' || Array.isArray(cbDef)) continue;
      for (const [opt, targets] of Object.entries(cbDef)) {
        if (opt.startsWith('_')) continue;
        const list = Array.isArray(targets) ? targets : [targets];
        if (!list.some((t) => String(t).split('.').pop().replace(/\[\d+\]$/, '') === cstem)) continue;
        const reads = list.map((t) => readTarget(t));
        condBoxes.push({ stem: cstem, key: cbKey, option: opt, caption: cdecl.caption, forSubject: cdecl.empty_unless,
          ticked: reads.some((r) => r.kind === 'checkbox' && r.value === true),
          copies: reads.length, unreadable: reads.filter((r) => r.kind === 'missing').length });
      }
    }
  }
  subjectBlock = { stem, declared, sides, other, caption: decl.caption,
    discriminatorKey: decl.route.discriminator, discriminatorHs: hsNameFor(decl.route.discriminator),
    branches: sides.map(branchRow), printedTarget: printed[0] ?? null, printedRead, condBoxes };
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const mismatches = rows.filter(r => r.verdict === 'MISMATCH');
const counts = rows.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});
// COUNTED OVER THE ROWS THIS PAGE RENDERS, not over the totals declaration — a cell the map
// binds twice would otherwise be counted once here and shown twice below, and the header would
// disagree with the table under it.
// AND RECONCILED AGAINST THE GATE'S OWN LINE COUNTS, out loud. The two will differ and both
// are right: the gate counts DECLARED LINES and this page counts PRINTED CELLS. (6a) declares
// an `own` line and a `leased` line for one cell, so the gate reports one checked and one
// skipped where the page reports one verified cell carrying a note that its other branch did
// not run; and a not_checkable entry naming a whole COLUMN covers every printed row of it. A
// reader holding the gate transcript beside this page would otherwise read the difference as a
// disagreement, which is the only reason both figures are printed.
const vcount = (st) => rows.filter(r => r.verify?.state === st).length;
const verifiedN = vcount('verified'), askN = vcount('verified+ask'), notCheckN = vcount('not-checkable'),
      skipN = vcount('skipped'), failN = vcount('failed') + vcount('not-checkable-at-runtime');
const formulaN = rows.filter(r => r.verify?.state === 'not-checkable' && r.advisory).length;

const sections = [];
for (const r of rows) {
  let s = sections.find(x => x.name === r.section);
  if (!s) { s = { name: r.section, rows: [] }; sections.push(s); }
  s.rows.push(r);
}

const badge = (v) => {
  const cls = { ok: 'ok', MISMATCH: 'bad', empty: 'muted', 'pdf-only': 'info' }[v] || 'muted';
  const text = { ok: 'match', MISMATCH: 'MISMATCH', empty: 'both empty', 'pdf-only': 'PDF only' }[v] || v;
  return `<span class="badge ${cls}">${esc(text)}</span>`;
};

// THE THREE STATES A PREPARER HAS TO BE ABLE TO TELL APART, AND A FOURTH FOR "NOT A TOTAL".
// Colour alone does not carry it — a printed page and a colour-blind reader both lose it — so
// each state carries a mark and a word, and the word says what was done rather than how it went.
const VERIFY_LABEL = {
  'verified':      { mark: '✓', text: 'verified',        cls: 'v-ok',   title: 'Gate step 11 recomputed this total from the operands printed above it, and the two agreed.' },
  'verified+ask':  { mark: '✓!', text: 'verified + asks', cls: 'v-ask',  title: 'The arithmetic was recomputed and held — AND the printed caption states a requirement arithmetic cannot express. Read the note below the value.' },
  'not-checkable': { mark: '—',  text: 'not checkable',   cls: 'v-none', title: 'Declared not checkable: nothing printed on this form could verify it. See the reason below the value.' },
  'skipped':       { mark: '⊘',  text: 'not on this branch', cls: 'v-skip', title: 'This line has a printed conditional and this record is not on its branch, so nothing was recomputed. It is neither checked nor failed.' },
  'failed':        { mark: '✗',  text: 'FAILED',          cls: 'v-bad',  title: 'The recomputation disagreed with the printed total. This should never reach a review page — the gate fails on it.' },
  'not-checkable-at-runtime': { mark: '?', text: 'no operand to read', cls: 'v-none', title: 'A feeder did not resolve to a printed cell on this document, so nothing could be recomputed.' },
};
const verifyCell = (r) => {
  if (!r.verify) {
    // NOT A TOTAL-SHAPED CELL. Most cells on the form are values the taxpayer supplies; there
    // is no arithmetic to verify and saying "not checkable" about them would drown the cells
    // where that sentence means something. The read-back column already proves the value reached
    // the page — that is a different guarantee and it is stated in the legend as one.
    return trip ? '<span class="v-na" title="Not a printed total. Its value was read back off the PDF, which is what the two value columns show; there is no arithmetic here to verify.">not a total</span>'
                : '<span class="v-unknown" title="No verification result is available for this document — see the banner at the top of the page.">unknown</span>';
  }
  const L = VERIFY_LABEL[r.verify.state] ?? { mark: '?', text: r.verify.state, cls: 'v-none', title: '' };
  return `<span class="vb ${L.cls}" title="${esc(L.title)}"><b>${L.mark}</b> ${esc(L.text)}</span>`;
};

const rowHtml = (r) => `
      <tr class="${r.verdict === 'MISMATCH' ? 'bad-row' : (r.verdict === 'empty' ? 'empty-row' : '')}">
        <td class="line">${esc(r.line)}</td>
        <td>${esc(r.label ?? r.keys[0] ?? '')}<div class="target" title="${esc(r.target)}">${esc(seg(r.target).slice(-2).join(' › '))}</div></td>
        <td class="prop">${r.keys.length ? r.keys.map(k => esc(hsNameFor(k) ?? `(no property) ${k}`)).join('<br>') : '<span class="muted">— derived, no property</span>'}</td>
        <td class="val">${blank(r.hsValue) ? '<span class="muted">—</span>' : esc(r.hsValue)}</td>
        <td class="val">${blank(r.pdfValue) ? (r.pdfKind === 'missing' ? '<span class="bad">field not on form</span>' : '<span class="muted">—</span>') : esc(r.pdfValue)}${r.advisory ? `<div class="advisory ${r.advisory.kind === 'constraint' ? 'adv-ask' : 'adv-none'}"><strong>${r.advisory.kind === 'constraint' ? 'The engine checked this sum, and the printed caption asks for something more:' : 'The engine could not check this, and the printed caption states a formula:'}</strong> &ldquo;${esc(r.advisory.caption)}&rdquo;<br>${esc(r.advisory.text)}</div>` : ''}${r.verify && r.verify.state === 'not-checkable' && !r.advisory ? `<div class="advisory adv-none"><strong>Not checkable.</strong> ${esc(r.verify.why ?? '')}</div>` : ''}${r.verify && r.verify.state === 'skipped' ? `<div class="advisory adv-skip"><strong>Not on this record&rsquo;s branch.</strong> ${esc(r.verify.why ?? '')}</div>` : ''}${r.verify?.sibling_note ? `<div class="advisory adv-skip">${esc(r.verify.sibling_note)}</div>` : ''}</td>
        <td class="vc">${verifyCell(r)}</td>
        <td>${badge(r.verdict)}</td>
      </tr>`;

const html = `<title>433 Form Review — ${esc(form.toUpperCase())} ${esc(data.intake_id ?? '')}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px; font: 14px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #16191d; background: #f6f7f9; }
  .wrap { max-width: 1180px; margin: 0 auto; }
  h1 { font-size: 21px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #d8dce1; }
  .sub { color: #5b636d; margin: 0 0 18px; }
  .card { background: #fff; border: 1px solid #dfe3e8; border-radius: 8px; padding: 16px 18px; margin-bottom: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px 22px; }
  .kv .k { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #6b737d; }
  .kv .v { font-weight: 600; word-break: break-word; }
  table { width: 100%; border-collapse: collapse; background: #fff; }
  .scroll { overflow-x: auto; border: 1px solid #dfe3e8; border-radius: 8px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #eceef1; vertical-align: top; }
  th { background: #f0f2f5; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #4a525b; position: sticky; top: 0; }
  td.line { font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 600; color: #333a42; }
  td.prop, .target { font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; font-size: 11.5px; }
  td.prop { color: #3d4650; }
  .target { color: #97a0aa; margin-top: 2px; }
  .advisory { margin-top: 6px; padding: 7px 9px; border-left: 3px solid #b8860b; background: #fdf6e3; color: #5c4a12; font-size: 11.5px; line-height: 1.45; font-weight: 400; white-space: normal; }
  /* THE TWO ADVISORY KINDS ARE DRAWN DIFFERENTLY, because they say different things.
     adv-ask sits under a cell the engine DID check and adds a requirement arithmetic cannot
     express; adv-none sits under a cell nothing could check. A reader who cannot tell them
     apart has been told the same thing about two opposite situations. */
  .adv-ask  { border-left-color: #1a4d94; background: #eef4fd; color: #143a70; }
  .adv-none { border-left-color: #b8860b; background: #fdf6e3; color: #5c4a12; }
  .adv-skip { border-left-color: #79818b; background: #f2f3f5; color: #4a525b; }
  td.vc { white-space: nowrap; }
  .vb { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .vb b { font-family: ui-monospace, Consolas, monospace; }
  .v-ok   { background: #dcf5e3; color: #16632f; }
  .v-ask  { background: #dfeafc; color: #1a4d94; }
  .v-none { background: #fdf6e3; color: #7a5c0d; }
  .v-skip { background: #eef0f3; color: #5b636d; }
  .v-bad  { background: #fbdcdc; color: #8f1616; }
  .v-na, .v-unknown { color: #b3bac1; font-size: 11px; }
  .v-unknown { color: #8f1616; }
  .legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px 20px; }
  .legend div { font-size: 12.5px; line-height: 1.5; }
  td.val { max-width: 260px; word-break: break-word; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .badge.ok { background: #dcf5e3; color: #16632f; }
  .badge.bad { background: #fbdcdc; color: #8f1616; }
  .badge.info { background: #dfeafc; color: #1a4d94; }
  .badge.muted { background: #eef0f3; color: #79818b; }
  .bad, .bad-row td { color: #8f1616; }
  .bad-row { background: #fff5f5; }
  .empty-row td { color: #9aa2ab; }
  .muted { color: #9aa2ab; }
  .banner { border-left: 4px solid #b8860b; background: #fdf6e3; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; }
  .alarm { border-left: 4px solid #b32020; background: #fff1f1; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; }
  .good { border-left: 4px solid #1e7a3c; background: #f1faf3; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; }
  code { font-family: ui-monospace, Consolas, monospace; font-size: 12px; background: #f0f2f5; padding: 1px 5px; border-radius: 3px; }
</style>
<div class="wrap">
  <h1>Form ${esc(form.toUpperCase())} — source record vs. filled PDF</h1>
  <p class="sub">Every &ldquo;read back&rdquo; value on this page was fetched from the filled PDF&rsquo;s own field values, not re-rendered from the record.</p>

  <div class="banner"><strong>Synthetic test record.</strong> Every value below is invented. No client information appears on this page.</div>

  ${trip ? '' : `<div class="alarm"><strong>The engine&rsquo;s arithmetic result is not available for this document, so the Arithmetic column reads &ldquo;unknown&rdquo; on every row.</strong><br>${esc(tripWhy ?? '')}<br>The two value columns are unaffected: they are read from this PDF and from the record, and the Match column still means what it says.</div>`}

  <h2>What the engine checked, and what it handed to you</h2>
  <div class="card">
    <div class="grid">
      <div class="kv"><div class="k">Totals verified</div><div class="v">${verifiedN}</div></div>
      <div class="kv"><div class="k">Verified &mdash; and the page asks more</div><div class="v">${askN}</div></div>
      <div class="kv"><div class="k">Not checkable</div><div class="v">${notCheckN} <span class="muted">(${formulaN} state a printed formula)</span></div></div>
      <div class="kv"><div class="k">Not on this record&rsquo;s branch</div><div class="v">${skipN}</div></div>
      ${failN ? `<div class="kv"><div class="k">Unresolved</div><div class="v bad">${failN}</div></div>` : ''}
    </div>
    ${trip ? `<p class="sub" style="margin:12px 0 0">These count <strong>printed cells</strong>. The gate transcript counts <strong>declared lines</strong> and reports ${trip.lines.filter(l => l.verdict === 'verified').length} checked, ${trip.lines.filter(l => l.verdict === 'skipped').length} skipped and ${trip.lines.filter(l => l.verdict === 'failed').length} failed of ${trip.lines.length} declared, plus ${trip.declared_not_checkable.length} declared not checkable. The two differ where more than one declared line addresses one printed cell &mdash; a line with an <em>own</em> branch and a <em>leased</em> branch is two declarations and one box on the page &mdash; and where a not-checkable entry names a whole column rather than one row. Both figures are right about different things.</p>` : ''}
  </div>
  <div class="card legend">
    <div><span class="vb v-ok"><b>&check;</b> verified</span> &mdash; the engine recomputed this total from the figures printed above it and the two agreed. Nothing here needs your arithmetic.</div>
    <div><span class="vb v-ask"><b>&check;!</b> verified + asks</span> &mdash; the sum was recomputed and held, <strong>and</strong> the printed caption states a requirement no arithmetic can enforce. The blue note under the value is the requirement. <strong>This is the one to read.</strong></div>
    <div><span class="vb v-none"><b>&mdash;</b> not checkable</span> &mdash; nothing printed on this form could verify it, usually because everything it sums is on an attachment. The amber note says why, and where the caption states a formula it quotes it.</div>
    <div><span class="vb v-skip"><b>&#8856;</b> not on this branch</span> &mdash; the line carries a printed conditional and this record is not on its branch. Neither checked nor failed.</div>
    <div><span class="v-na">not a total</span> &mdash; a value the client supplied rather than a figure the form computes. There is no arithmetic to check; the two value columns show it reached the page.</div>
    <div><span class="badge ok">match</span> &mdash; a different guarantee, and an independent one: the value stored in the CRM is the value this PDF prints. Every row has it. It says nothing about whether the arithmetic is right.</div>
  </div>

  ${mismatches.length
    ? `<div class="alarm"><strong>${mismatches.length} row${mismatches.length === 1 ? '' : 's'} disagree between the CRM and the PDF.</strong> They are highlighted below and listed in full in the next table.</div>`
    : `<div class="good"><strong>No disagreements.</strong> Every cell the record fed reads back off the PDF with the same value.</div>`}

  ${subjectBlock ? `
  <h2>The declared subject, and what it decided</h2>
  <div class="alarm"><strong>This form does not say whose it is &mdash; the record does.</strong> Nothing printed on the blank
  distinguishes a natural person from a business entity, so one declared word decides which taxpayer identifier
  the page carries and which boxes may be ticked. <strong>The engine filled this page FROM that word, so the page
  agreeing with it proves nothing.</strong> It is the one input on this document that only you can check.</div>
  <div class="card">
    <div class="grid">
      <div class="kv"><div class="k">Declared subject</div><div class="v">${esc(subjectBlock.declared || '(NONE DECLARED)')}</div></div>
      <div class="kv"><div class="k">Declared in</div><div class="v"><code>${esc(subjectBlock.discriminatorHs ?? subjectBlock.discriminatorKey)}</code></div></div>
      <div class="kv"><div class="k">Printed caption</div><div class="v">${esc(subjectBlock.caption ?? '')}</div></div>
      <div class="kv"><div class="k">Value in the printed box</div><div class="v">${esc(subjectBlock.printedRead.kind === 'text' ? (subjectBlock.printedRead.value || '(blank)') : subjectBlock.printedRead.kind)}</div></div>
    </div>
    <p class="sub" style="margin:12px 0 0">One printed box; two properties it could have come from. The branch the
    declaration did not take must be <strong>empty</strong>, and the engine refuses a record that fills both.</p>
    <table>
      <thead><tr><th>Branch</th><th>CRM property</th><th>Value in the record</th><th>Routed here</th></tr></thead>
      <tbody>
      ${subjectBlock.branches.map(b => `<tr${b.taken ? ' style="background:#f1faf3"' : ''}>
        <td>${esc(b.side)}</td>
        <td><code>${esc(b.hs ?? b.key)}</code></td>
        <td>${esc(b.value ?? '(empty)')}</td>
        <td>${b.taken ? '<span class="badge ok">yes &mdash; this is the value on the page</span>' : '<span class="muted">no &mdash; asserted empty</span>'}</td>
      </tr>`).join('')}
      </tbody>
    </table>
    ${subjectBlock.condBoxes.length ? `
    <p class="sub" style="margin:16px 0 6px"><strong>The boxes this subject decided</strong> &mdash; each exists for one
    subject only, and each verdict below is read off this PDF rather than from the record.</p>
    <table>
      <thead><tr><th>Box</th><th>Printed caption</th><th>Exists for</th><th>On this document</th></tr></thead>
      <tbody>
      ${subjectBlock.condBoxes.map(c => `<tr>
        <td><code>${esc(c.key)} = ${esc(c.option)}</code></td>
        <td>${esc(c.caption ?? '')}</td>
        <td>${esc(c.forSubject)}</td>
        <td>${c.unreadable ? '<span class="badge bad">unreadable</span>' : c.ticked ? '<span class="badge ok">TICKED</span>' : '<span class="muted">not ticked</span>'}${c.copies > 1 ? ` <span class="muted">(${c.copies} copies)</span>` : ''}</td>
      </tr>`).join('')}
      </tbody>
    </table>` : ''}
  </div>` : ''}

  <div class="card">
    <div class="grid">
      <div class="kv"><div class="k">Form</div><div class="v">${esc(mapDoc.form)}</div></div>
      <div class="kv"><div class="k">Revision</div><div class="v">Rev. ${esc(mapDoc.form_revision ?? '?')}${mapDoc.catalog ? ` / Cat ${esc(mapDoc.catalog)}` : ''}</div></div>
      <div class="kv"><div class="k">Contact / intake id</div><div class="v">${esc(data.intake_id ?? '—')}</div></div>
      <div class="kv"><div class="k">Record</div><div class="v">${esc(recordPath)}</div></div>
      <div class="kv"><div class="k">Filled PDF</div><div class="v">${esc(filledPath)}</div></div>
      <div class="kv"><div class="k">Map scope</div><div class="v">${esc(mapDoc.slice ?? 'no COMPLETE slice declared — partial map')}</div></div>
    </div>
  </div>

  <h2>Coverage accounting (production mode)</h2>
  <div class="card">
    <div class="grid">
      <div class="kv"><div class="k">Fields on the form</div><div class="v">${cov.fieldCount}</div></div>
      <div class="kv"><div class="k">Text cells written</div><div class="v">${cov.bucket.text_written.length}</div></div>
      <div class="kv"><div class="k">Mapped cells left empty</div><div class="v">${cov.bucket.text_empty.length} <span class="muted">(normal on a real record)</span></div></div>
      <div class="kv"><div class="k">Checkboxes checked</div><div class="v">${cov.bucket.cb_checked_exclusive.length + cov.bucket.cb_checked_independent.length}</div></div>
      <div class="kv"><div class="k">Unreferenced by the map</div><div class="v">${cov.bucket.unreferenced.length}</div></div>
      <div class="kv"><div class="k">Accounting</div><div class="v">${cov.total} / ${cov.fieldCount} — ${cov.total === cov.fieldCount ? 'closes' : 'DOES NOT CLOSE'}</div></div>
    </div>
  </div>

  <h2>Row verdicts</h2>
  <div class="card"><div class="grid">
    <div class="kv"><div class="k">Match</div><div class="v">${counts.ok ?? 0}</div></div>
    <div class="kv"><div class="k">Mismatch</div><div class="v">${counts.MISMATCH ?? 0}</div></div>
    <div class="kv"><div class="k">Both empty</div><div class="v">${counts.empty ?? 0}</div></div>
    <div class="kv"><div class="k">PDF only (derived)</div><div class="v">${counts['pdf-only'] ?? 0}</div></div>
    <div class="kv"><div class="k">Bound targets shown</div><div class="v">${rows.length}</div></div>
  </div></div>

  ${mismatches.length ? `
  <h2>Disagreements</h2>
  <div class="scroll"><table>
    <thead><tr><th>Printed line</th><th>Label</th><th>HubSpot property</th><th>Value in HubSpot</th><th>Read back from PDF</th><th>Arithmetic</th><th>Match</th></tr></thead>
    <tbody>${mismatches.map(rowHtml).join('')}</tbody>
  </table></div>` : ''}

  ${orphans.length ? `
  <h2>Values in the record that reach no printed cell</h2>
  <div class="banner">These ${orphans.length} value${orphans.length === 1 ? ' was' : 's were'} supplied by the CRM and print <strong>nowhere</strong> on this form. On a map that declares no COMPLETE slice, some of these are deliberate — this form genuinely has no cell for them. The rest are gaps. This page cannot tell the two apart, which is precisely why they are listed rather than dropped.</div>
  <div class="scroll"><table>
    <thead><tr><th>HubSpot property</th><th>Record key</th><th>Value</th></tr></thead>
    <tbody>${orphans.map(o => `<tr>
      <td class="prop">${esc(o.property ?? '(not in the property set)')}</td>
      <td class="prop">${esc(o.key)}</td>
      <td class="val">${esc(o.value)}</td>
    </tr>`).join('')}</tbody>
  </table></div>` : ''}

  <h2>IRS allowable column</h2>
  <div class="scroll"><table>
    <thead><tr><th>Allowed cell</th><th>Arithmetic</th><th>Printed on the PDF</th></tr></thead>
    <tbody>
      ${allowedRows.map(a => `<tr>
        <td class="line">${esc(a.path)}</td>
        <td>${esc(allowedArithmetic(a.path))}</td>
        <td class="val">${blank(a.value) ? '<span class="muted">— blank by design</span>' : esc(a.value)}</td>
      </tr>`).join('')}
    </tbody>
  </table></div>
  <p class="sub">Household size read as <code>${esc(String(rawHH || '(absent)'))}</code>, standards table <code>${esc(stdPath)}</code>. Only the cells the IRS grants at a fixed published amount are auto-filled; the rest of the column is deliberately blank.</p>

  ${sections.map(s => `
  <h2>${esc(s.name)} <span class="muted" style="font-weight:400">(${s.rows.length} bound cell${s.rows.length === 1 ? '' : 's'})</span></h2>
  <div class="scroll"><table>
    <thead><tr><th>Printed line</th><th>Label</th><th>HubSpot property</th><th>Value in HubSpot</th><th>Read back from PDF</th><th>Arithmetic</th><th>Match</th></tr></thead>
    <tbody>${s.rows.map(rowHtml).join('')}</tbody>
  </table></div>`).join('')}

  <p class="sub" style="margin-top:28px">Generated by <code>adapters/pdf/render-review.mjs</code> from <code>adapters/pdf/maps/${esc(form)}.map.json</code>. Read-back values come from the PDF; property names come from ${esc(existsSync(GEN_PATH) ? GEN_PATH : REG_PATH)}.</p>
</div>
`;

const outPath = outArg || `adapters/pdf/out/${form}_review_${data.intake_id || 'record'}.html`;
writeFileSync(outPath, html);

console.log(`render-review: ${form}`);
console.log(`  record: ${recordPath}`);
console.log(`  filled: ${filledPath}`);
console.log(`  wrote:  ${outPath}`);
console.log(`  ${rows.length} bound cell(s): ${counts.ok ?? 0} match, ${counts.MISMATCH ?? 0} MISMATCH, ${counts.empty ?? 0} both empty, ${counts['pdf-only'] ?? 0} PDF-only`);
if (trip) {
  console.log(`  arithmetic, from ${tripwirePath} (bound to this PDF by SHA-256 ${filledSha.slice(0, 12)}…):`);
  console.log(`    printed cells: ${verifiedN} verified, ${askN} verified with a printed requirement arithmetic cannot express, ${notCheckN} not checkable (${formulaN} of them stating a printed formula), ${skipN} not on this record's branch${failN ? `, ${failN} UNRESOLVED` : ''}`);
  console.log(`    declared lines (as the gate counts them): ${trip.lines.filter(l => l.verdict === 'verified').length} checked, ${trip.lines.filter(l => l.verdict === 'skipped').length} skipped, ${trip.lines.filter(l => l.verdict === 'failed').length} failed of ${trip.lines.length}; ${trip.declared_not_checkable.length} declared not checkable`);
  console.log(`    the two differ where several declared lines address one printed cell, or a not-checkable entry names a whole column`);
} else {
  console.log(`  arithmetic: UNKNOWN — ${tripWhy}`);
}
if (orphans.length) {
  console.log('');
  console.log(`  ${orphans.length} record value(s) reach NO printed cell:`);
  orphans.forEach(o => console.log(`    ${o.property ?? o.key} = ${JSON.stringify(o.value)}`));
}
if (mismatches.length) {
  console.log('');
  console.log(`  ${mismatches.length} DISAGREEMENT(S):`);
  for (const m of mismatches) {
    console.log(`    ${m.line} ${m.label ?? m.keys[0] ?? ''}`);
    console.log(`      HubSpot: ${JSON.stringify(m.hsValue ?? null)}`);
    console.log(`      PDF:     ${JSON.stringify(m.pdfValue ?? null)}`);
  }
}
process.exit(0);
