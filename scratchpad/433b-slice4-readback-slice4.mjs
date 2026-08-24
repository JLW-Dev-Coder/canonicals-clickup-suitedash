// READ THE FILLED PDF BACK AND COMPARE EVERY PAGE-5 AND PAGE-6 CELL AGAINST THE RECORD.
//
//   node adapters/pdf/run-form-gate.mjs 433b --saturated     # write the filled PDF first
//   node scratchpad/433b-slice4-readback-slice4.mjs
//
// WHY THIS EXISTS BESIDE THE GATE. Gate step 12 reads the filled form back and compares it
// against the record, and this file does not replace that. What it adds is the READING A HUMAN
// WOULD DO: every page-5 and page-6 cell printed with its printed marker, its printed column
// caption and the value that reached it, so the binding can be checked by eye against the form
// rather than only by a predicate against the map. A map is a claim about which cell is which,
// and a claim nobody has ever looked at is one nobody has checked.
//
// IT COMPARES BY TARGET, NOT BY POSITION. Reading the nth field of the filled PDF against the
// nth binding of the map would agree with itself under any consistent mis-ordering, which is
// the one failure this reading exists to catch.
//
// AND THE NEVER-AUTOFILL CELL IS ASSERTED EMPTY. Printed line 48 is the IRS-use cell; the map
// binds it under _never_autofill and this reading requires the filled page to hold nothing in
// it. An engine that started writing it would still pass every total on the form, because the
// line-49 tripwire sums the eleven cells beside it.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { resolveFixture } from '../adapters/pdf/resolve-fixture.mjs';

const stop = (m) => { console.error(`STOP — ${m}`); process.exit(2); };

// THE FILLED PDF IS DISCOVERED, NOT NAMED. run-form-gate.mjs names its output after the
// RECORD ID inside the fixture, not after the form, so a hard-coded path here is the stale-path
// defect [R-22] records one artefact along. The gate writes exactly one non-overmax 433b PDF
// per run and this file takes the newest of them, printing which and when.
const OUT_DIR = 'adapters/pdf/out';
const candidates = readdirSync(OUT_DIR).filter((f) => f.startsWith('433b_filled_') && f.endsWith('.pdf') && !f.includes('overmax'))
  .map((f) => ({ f, m: statSync(`${OUT_DIR}/${f}`).mtimeMs })).sort((a, b) => b.m - a.m);
if (!candidates.length) { console.error('STOP — no filled 433-B PDF in adapters/pdf/out/. Run: node adapters/pdf/run-form-gate.mjs 433b --saturated'); process.exit(2); }
const FILLED = `${OUT_DIR}/${candidates[0].f}`;
console.log(`filled candidates: ${candidates.map((c) => c.f).join(', ')} — taking the newest`);
const map = JSON.parse(readFileSync('adapters/pdf/maps/433b.map.json', 'utf8'));
const ev = (map._map_evidence_page5_6 || {}).bindings || [];
if (!ev.length) stop('the map carries no page-5/6 evidence table, so there is nothing to read back against.');

const res = resolveFixture('433b', 'acceptance');
const rec = JSON.parse(readFileSync(res.path, 'utf8'));
console.log(`record:  ${res.path}`);
console.log(`filled:  ${FILLED}`);

let pdf;
try { pdf = await PDFDocument.load(readFileSync(FILLED)); }
catch (e) { stop(`${FILLED} could not be read (${e.message}). Run the gate first: node adapters/pdf/run-form-gate.mjs 433b --saturated`); }
const form = pdf.getForm();
const valueOf = (name) => {
  const f = form.getFields().find((x) => x.getName() === name);
  if (!f) return { missing: true };
  if (f.constructor.name === 'PDFCheckBox') return { checked: f.isChecked() };
  try { return { text: f.getText() ?? '' }; } catch (e) { return { unreadable: e.message }; }
};

// THE EXPECTED VALUE, FROM THE RECORD, BY THE SAME KEY THE MAP BINDS. Group keys are
// `group[i].column`; a checkbox option key is `set.Option`; everything else is a scalar.
const expected = (key) => {
  const g = /^([a-z_0-9]+)\[(\d+)\]\.([a-z_0-9]+)$/.exec(key);
  if (g) { const rows = rec[g[1]]; return rows && rows[Number(g[2])] ? rows[Number(g[2])][g[3]] : undefined; }
  const o = /^([a-z_0-9]+)\.([A-Za-z]+)$/.exec(key);
  if (o) return rec[o[1]] === o[2] ? '(checked)' : '(unchecked)';
  return rec[key];
};

const rows = [], problems = [];
// THE TARGET COMES FROM THE MAP'S BINDING SITES, NOT FROM THE EVIDENCE ROW. The evidence rows
// carry the LEAF only — deliberately, because a full path in an evidence row is a second
// binding of that cell — so this file joins evidence to target through the map's own
// map/groups/checkboxes blocks, which is where the binding actually lives.
const targetForKey = new Map();
for (const [k, v] of Object.entries(map.map)) targetForKey.set(k, v);
for (const [g, def] of Object.entries(map.groups || {}))
  (def.slots || []).forEach((s, i) => { for (const [c, t] of Object.entries(s.text || {})) targetForKey.set(`${g}[${i}].${c}`, t); });
for (const [set, def] of Object.entries(map.checkboxes || {}))
  for (const [opt, t] of Object.entries(def)) if (!opt.startsWith('_')) targetForKey.set(`${set}.${opt}`, t);
for (const f of (map._never_autofill?.fields || [])) if (f.key) targetForKey.set(f.key, f.target);

for (const b of ev) {
  const t = targetForKey.get(b.key);
  if (!t) { problems.push(`${b.key}: the evidence table names it and no binding site in the map does`); continue; }
  if (!t.endsWith(b.leaf)) problems.push(`${b.key}: the evidence row records leaf ${b.leaf} and the map binds ${t}`);
  const got = valueOf(t);
  const want = expected(b.key);
  if (got.missing) { problems.push(`${b.key} -> ${t}: no such field in the filled PDF`); continue; }
  if (got.unreadable) { problems.push(`${b.key} -> ${t}: unreadable (${got.unreadable})`); continue; }
  const shown = got.checked !== undefined ? (got.checked ? '(checked)' : '(unchecked)') : got.text;
  if (String(shown) !== String(want === undefined ? '' : want))
    problems.push(`${b.key} -> ${t}: the record says ${JSON.stringify(want)} and the filled page carries ${JSON.stringify(shown)}`);
  rows.push({ page: b.page, key: b.key, leaf: b.leaf, printed: b.printed, value: shown });
}

// THE NEVER-AUTOFILL CELL, ASSERTED EMPTY.
for (const f of (map._never_autofill?.fields || [])) {
  const got = valueOf(f.target);
  if (got.missing) { problems.push(`${f.key}: the never-autofill target is not in the filled PDF at all`); continue; }
  const shown = got.checked !== undefined ? String(got.checked) : (got.text ?? '');
  if (shown !== '') problems.push(`${f.key} -> ${f.target}: declared never-autofill and the filled page carries ${JSON.stringify(shown)}`);
  else console.log(`never-autofill: ${f.key} -> the filled page holds nothing in it, as declared.`);
}

// ── the reading, by page and by printed marker ─────────────────────────────────────────────
for (const p of [5, 6]) {
  const on = rows.filter((r) => r.page === p);
  console.log('');
  console.log(`########## PAGE ${p} — ${on.length} cell(s) read back ##########`);
  for (const r of on)
    console.log(`  ${r.key.padEnd(46)} ${String(r.leaf).padEnd(22)} ${JSON.stringify(r.printed).slice(0, 34).padEnd(36)} ${JSON.stringify(r.value)}`);
}

console.log('');
if (problems.length) {
  for (const p of problems) console.error(`STOP — ${p}`);
  console.error(`READ-BACK FAILED — ${problems.length} problem(s).`);
  process.exit(2);
}
console.log(`READ-BACK PASSED — ${rows.length} page-5 and page-6 cell(s) read out of the filled PDF BY TARGET and each equal to the record's own value, ` +
  `plus ${(map._never_autofill?.fields || []).length} never-autofill cell(s) proved empty.`);
