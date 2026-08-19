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
  const t = readTarget(r.target);
  const pdfValue = t.kind === 'checkbox' ? (t.value ? 'checked' : '') : (t.kind === 'missing' ? null : t.value);
  rows.push({
    ...r,
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
  add({ construct: 'map', keys: [key], target, hsValue: data[key], label: labelFor(key) });
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
        advisory: advisoryFor.byCell.get(`${g}.${sub}`) ?? null,
        note: usedArray ? `from ${arrayKey}[${i}].${sub}` : (srcKey ? null : 'no scalar fallback key feeds this slot'),
      });
    }
  });
}

// 5. checkboxes — every target the map binds, with its state read off the page
const cbTargets = [];
(function walkCb(node, path) {
  if (typeof node === 'string' && node.startsWith('topmostSubform[0].')) { cbTargets.push({ path, target: node }); return; }
  if (Array.isArray(node)) return node.forEach((v, i) => walkCb(v, `${path}[${i}]`));
  if (node && typeof node === 'object') Object.entries(node).forEach(([k, v]) => walkCb(v, `${path}.${k}`));
})(mapDoc.checkboxes || {}, 'checkboxes');
for (const { path, target } of cbTargets) {
  add({ construct: 'checkboxes', keys: [], target, hsValue: undefined, label: path.replace(/^checkboxes\./, '') });
}

// 6. the IRS allowable column — computed, not supplied, so it is shown with its arithmetic
const allowedRows = [];
(function walkAllowed(node, path) {
  if (typeof node === 'string' && node.startsWith('topmostSubform[0].')) {
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

const orphans = Object.keys(data)
  // `_`-prefixed keys are the sample's own prose (why a fixture holds the values it holds),
  // not taxpayer input, and `intake_id` names the record rather than filling a cell.
  .filter(k => k !== 'intake_id' && !k.startsWith('_') && !blank(data[k]) && !consumed.has(k))
  .map(k => ({ key: k, value: typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k], property: hsNameFor(k) }));

// --- coverage accounting for the header ------------------------------------------------------
const cov = await verifyFormCoverage(form, filledPath, { saturated: false });

// --- render ------------------------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const mismatches = rows.filter(r => r.verdict === 'MISMATCH');
const counts = rows.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});

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

const rowHtml = (r) => `
      <tr class="${r.verdict === 'MISMATCH' ? 'bad-row' : (r.verdict === 'empty' ? 'empty-row' : '')}">
        <td class="line">${esc(r.line)}</td>
        <td>${esc(r.label ?? r.keys[0] ?? '')}<div class="target" title="${esc(r.target)}">${esc(seg(r.target).slice(-2).join(' › '))}</div></td>
        <td class="prop">${r.keys.length ? r.keys.map(k => esc(hsNameFor(k) ?? `(no property) ${k}`)).join('<br>') : '<span class="muted">— derived, no property</span>'}</td>
        <td class="val">${blank(r.hsValue) ? '<span class="muted">—</span>' : esc(r.hsValue)}</td>
        <td class="val">${blank(r.pdfValue) ? (r.pdfKind === 'missing' ? '<span class="bad">field not on form</span>' : '<span class="muted">—</span>') : esc(r.pdfValue)}${r.advisory ? `<div class="advisory"><strong>${r.advisory.kind === 'constraint' ? 'Checked, and the printed caption asks something arithmetic cannot:' : 'Not checkable — the printed caption states a formula:'}</strong> &ldquo;${esc(r.advisory.caption)}&rdquo;<br>${esc(r.advisory.text)}</div>` : ''}</td>
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

  ${mismatches.length
    ? `<div class="alarm"><strong>${mismatches.length} row${mismatches.length === 1 ? '' : 's'} disagree between the CRM and the PDF.</strong> They are highlighted below and listed in full in the next table.</div>`
    : `<div class="good"><strong>No disagreements.</strong> Every cell the record fed reads back off the PDF with the same value.</div>`}

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
    <thead><tr><th>Printed line</th><th>Label</th><th>HubSpot property</th><th>Value in HubSpot</th><th>Read back from PDF</th><th>Match</th></tr></thead>
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
    <thead><tr><th>Printed line</th><th>Label</th><th>HubSpot property</th><th>Value in HubSpot</th><th>Read back from PDF</th><th>Match</th></tr></thead>
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
