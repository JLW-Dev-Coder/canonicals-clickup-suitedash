// The release gate for one form in the 433 series. Nine steps, in order, stopping at the
// first failure.
//
// CLI:  node adapters/pdf/run-form-gate.mjs <form> <sample.json>
// npm:  npm run gate:433a   |   npm run gate:433f
// Exit: 0 = every step passed, 2 = a step failed (the failing step is named).
//
//   1  revision pin           the PDF is the revision the map was authored against
//   2  validate-map           every target exists verbatim in the enumerated field list
//   3  duplicate-write        no target is written by more than one key
//   4  coverage               every enumerated field is referenced by the map
//   5  partition              writable + never-autofill + deferred = the field count, disjoint
//   6  fill                   produce the PDF
//   7  verify-appearances     every written value is actually drawn on the page
//   8  verify-form-coverage   the whole-form accounting closes
//   9  arithmetic tripwires   every printed total agrees with the rows it prints above it
//
// WHY A GATE AND NOT A CHECKLIST
// ------------------------------
// Every one of these checks has been run by hand at some point in this build, which means
// every one of them has also been SKIPPED at some point — a check you have to remember is
// a check that is only as good as the session running it. Five more forms follow 433-A.
// So the checks become one command per form, and "the form is ready" becomes a thing you
// can prove in one line instead of a thing you assert.
//
// NO FORM IS NAMED IN THIS FILE'S LOGIC. Everything comes from the map, the enumerated
// field list, the filled PDF, and a per-form totals declaration. Pointing it at 433-B
// requires authoring 433b.map.json and 433b.totals.json — not editing this file.
//
// STEPS 4 AND 5 FOLLOW THE MAP'S OWN DECLARED SCOPE. A map that declares itself COMPLETE
// is held to full coverage and a closed partition. A map that has not made that claim is a
// declared partial slice — 433-F is one — and is REPORTED against the same two checks
// rather than failed by them, because failing a map for not keeping a promise it never made
// would only teach people to stop running the gate. The counts print either way, loudly,
// so a partial map can never be mistaken for a complete one.

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { PDFDocument, PDFTextField } from 'pdf-lib';
import { readFormRevisionWithPages } from './read-form-revision.mjs';
import { classifyMapTargets, mapClaimsComplete } from './verify-form-coverage.mjs';

const [form, samplePath] = process.argv.slice(2);
if (!form || !samplePath) {
  console.error('usage: node adapters/pdf/run-form-gate.mjs <form> <sample.json>');
  process.exit(2);
}

const mapPath    = `adapters/pdf/maps/${form}.map.json`;
const totalsPath = `adapters/pdf/maps/${form}.totals.json`;
const mapDoc     = JSON.parse(readFileSync(mapPath, 'utf8'));
const fieldsPath = mapDoc.fields_source || `adapters/pdf/maps/${form}.fields.json`;
const fieldsDoc  = JSON.parse(readFileSync(fieldsPath, 'utf8'));
const sample     = JSON.parse(readFileSync(samplePath, 'utf8'));
const outPath    = `adapters/pdf/out/${form}_filled_${sample.intake_id || 'sample'}.pdf`;
const complete   = mapClaimsComplete(mapDoc);

const fieldNames = fieldsDoc.fields.map(f => f.name);
const { deferred, never, writable } = classifyMapTargets(mapDoc);

// Run a sibling tool as its own process, with its output inline. process.execPath, never a
// shell: a .cmd shim cannot be spawned on this box, and a shell would need the paths quoted.
const runTool = (script, args) => {
  const r = spawnSync(process.execPath, [`adapters/pdf/${script}`, ...args], { stdio: 'inherit' });
  return r.status === 0;
};

const ok   = (msg) => ({ pass: true,  msg });
const fail = (msg) => ({ pass: false, msg });
const list = (label, items, cap = 12) => {
  console.log(`  ${label}`);
  items.slice(0, cap).forEach(i => console.log(`    ${i}`));
  if (items.length > cap) console.log(`    ... and ${items.length - cap} more (not listed)`);
};

// --- money -----------------------------------------------------------------------------
// A printed cell is text. "$1,200.00", "1200", "(50)" and "" all have to become numbers the
// same way, and a cell that is text but not a number has to be distinguishable from a cell
// that is empty — the first disables a tripwire, the second contributes zero.
const parseMoney = (raw) => {
  if (raw === undefined || raw === null) return { blank: true, n: 0 };
  const s = String(raw).trim();
  if (s === '') return { blank: true, n: 0 };
  const neg = /^\(.*\)$/.test(s) || s.startsWith('-');
  const digits = s.replace(/[()]/g, '').replace(/^-/, '').replace(/[$\s,]/g, '');
  if (!/^\d*\.?\d+$/.test(digits)) return { blank: false, n: null, raw: s };
  const n = Number(digits);
  return { blank: false, n: neg ? -n : n };
};
const cents = (n) => Math.round(n * 100);
const money = (n) => (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------------------------------------------------------------------------------------

const steps = [
  ['revision pin', async () => {
    if (!mapDoc.form_revision) {
      return fail(`${mapPath} declares no form_revision. A map with no pin cannot be gated — the IRS renumbers lines between revisions, so the same field name moves to a different cell. Author the pin.`);
    }
    const info = await readFormRevisionWithPages(mapDoc.form);
    console.log(`  PDF:      ${info.file}`);
    console.log(`  map pins: Rev. ${mapDoc.form_revision}${mapDoc.catalog ? ` / Cat ${mapDoc.catalog}` : ''}`);
    console.log(`  PDF says: Rev. ${info.revision ?? '(none)'}${info.catalog ? ` / Cat ${info.catalog}` : ''}  (${info.pages} pages)`);
    console.log(`  sha256:   ${info.sha256}`);
    const revOk = info.revision === mapDoc.form_revision;
    const catOk = !mapDoc.catalog || info.catalog === mapDoc.catalog;
    return revOk && catOk ? ok('the loaded PDF is the revision the map was authored against')
                          : fail('REVISION MISMATCH — re-author the map against the new revision, do not just bump the pin');
  }],

  ['validate-map', async () =>
    runTool('validate-map.mjs', [form])
      ? ok('every target exists verbatim in the enumerated field list')
      : fail('validate-map.mjs exited non-zero')],

  ['duplicate-write', async () => {
    // `exclusive` re-lists checkbox targets that `checkboxes` and the group slots already
    // bind — that is what it is for, and it is why 433-A holds more references than fields.
    // Only WRITING bindings are counted here, so a well-formed map cannot trip this.
    const dupes = [...writable.entries()].filter(([, paths]) => paths.length > 1);
    console.log(`  ${writable.size} writable target(s) bound by ${[...writable.values()].reduce((n, p) => n + p.length, 0)} key(s)`);
    if (!dupes.length) return ok('no target is written by more than one key');
    for (const [target, paths] of dupes) {
      console.error(`  ${target}`);
      paths.forEach(p => console.error(`    <- ${p}`));
    }
    return fail(`${dupes.length} target(s) are written by more than one key — the later write silently overwrites the earlier one`);
  }],

  ['coverage', async () => {
    const referenced = new Set([...writable.keys(), ...never, ...deferred]);
    const unreferenced = fieldNames.filter(n => !referenced.has(n));
    console.log(`  ${fieldNames.length - unreferenced.length} of ${fieldNames.length} enumerated field(s) are referenced by the map`);
    console.log(`  map scope: ${complete ? `declares COMPLETE ("${mapDoc.slice}") — full coverage REQUIRED` : 'declares no COMPLETE slice — a partial map, coverage REPORTED not required'}`);
    if (!unreferenced.length) return ok('every enumerated field is referenced by the map');
    list(`${unreferenced.length} field(s) the map does not mention:`, unreferenced);
    return complete
      ? fail(`${unreferenced.length} field(s) unreferenced by a map that declares itself COMPLETE`)
      : ok(`${unreferenced.length} field(s) unreferenced — reported, not required, because this map declares no COMPLETE slice`);
  }],

  ['partition', async () => {
    const both = (a, b) => [...a].filter(x => (b.has ? b.has(x) : false));
    const overlaps = [
      ['writable & never-autofill', both(new Set(writable.keys()), never)],
      ['writable & deferred',       both(new Set(writable.keys()), deferred)],
      ['never-autofill & deferred', both(never, deferred)],
    ].filter(([, v]) => v.length);
    const sum = writable.size + never.size + deferred.size;
    console.log(`  writable ${writable.size} + never-autofill ${never.size} + deferred ${deferred.size} = ${sum}; form has ${fieldNames.length} field(s)`);
    if (overlaps.length) {
      for (const [what, items] of overlaps) list(`OVERLAP — ${what}:`, items);
      return fail(`${overlaps.length} overlap(s) between categories that must be disjoint — a cell cannot be both written and blank by design`);
    }
    console.log('  no overlaps — the three categories are disjoint');
    if (sum === fieldNames.length) return ok('the three categories partition the form exactly');
    return complete
      ? fail(`the categories sum to ${sum}, the form has ${fieldNames.length} — a map that declares itself COMPLETE must partition the form`)
      : ok(`sum ${sum} vs ${fieldNames.length} field(s) — reported, not required, because this map declares no COMPLETE slice`);
  }],

  ['fill', async () =>
    runTool(`fill-${form}.mjs`, [samplePath])
      ? (existsSync(outPath) ? ok(`wrote ${outPath}`) : fail(`fill reported success but ${outPath} does not exist`))
      : fail(`fill-${form}.mjs exited non-zero`)],

  ['verify-appearances', async () =>
    runTool('verify-appearances.mjs', [outPath])
      ? ok('every stored value is drawn by its widget normal appearance stream')
      : fail('verify-appearances.mjs exited non-zero')],

  ['verify-form-coverage', async () =>
    runTool('verify-form-coverage.mjs', [form, outPath])
      ? ok('the whole-form accounting closes')
      : fail('verify-form-coverage.mjs exited non-zero')],

  ['arithmetic tripwires', async () => {
    if (!existsSync(totalsPath)) {
      return fail(`no ${totalsPath} — 0 totals checked. This step proves NOTHING for ${form} until one is authored, so it fails rather than passing on an empty check. Author the totals declaration from the form's printed captions.`);
    }
    const decl = JSON.parse(readFileSync(totalsPath, 'utf8'));
    const pdf  = await PDFDocument.load(readFileSync(outPath));
    const live = pdf.getForm();
    // Read the PRINTED cell, never the input record: a total that agrees with the record
    // but not with the page is exactly the defect worth catching, and comparing the record
    // to itself would report a match on it.
    const printed = (target) => {
      let f; try { f = live.getField(target); } catch { return { missing: true }; }
      if (!(f instanceof PDFTextField)) return { missing: true };
      return { text: f.getText() };
    };

    const resolveKey = (key) => mapDoc.map?.[key];
    const groupTargets = (g, column) => {
      const def = mapDoc.groups?.[g];
      if (!def || !Array.isArray(def.slots)) return null;
      // A slot is either flat ({column: target}) or nested under `text` — both shapes are
      // in use across the series, so the column is looked up in whichever one holds it.
      const t = def.slots.map(s => (s?.text && s.text[column] !== undefined) ? s.text[column] : s?.[column]);
      return t.some(x => x === undefined) ? null : t;
    };

    const rows = [];
    for (const entry of decl.totals) {
      const r = { line: entry.line, caption: entry.caption, checkable: true, why: null, printed: null, sum: 0, feeders: [] };

      const totalTarget = resolveKey(entry.total_key);
      if (!totalTarget) { r.checkable = false; r.why = `total_key "${entry.total_key}" is not in the map`; rows.push(r); continue; }
      const tp = printed(totalTarget);
      if (tp.missing) { r.checkable = false; r.why = `the total's target is not a text field on the filled PDF`; rows.push(r); continue; }
      const tv = parseMoney(tp.text);
      if (tv.n === null) { r.checkable = false; r.why = `the printed total "${tv.raw}" is not a number`; rows.push(r); continue; }
      r.printed = tv.n;

      for (const fd of entry.feeders) {
        const sign = fd.sign === -1 ? -1 : 1;
        let targets;
        if (Array.isArray(fd.keys)) {
          targets = fd.keys.map(resolveKey);
          const bad = fd.keys.filter((k, i) => !targets[i]);
          if (bad.length) { r.checkable = false; r.why = `feeder key(s) not in the map: ${bad.join(', ')}`; break; }
        } else if (fd.group) {
          targets = groupTargets(fd.group, fd.column);
          if (!targets) { r.checkable = false; r.why = `group "${fd.group}" column "${fd.column}" does not resolve to a target on every printed row`; break; }
        } else { r.checkable = false; r.why = 'feeder declares neither `keys` nor `group`'; break; }

        const re = fd.extract ? new RegExp(fd.extract) : null;
        for (const t of targets) {
          const p = printed(t);
          if (p.missing) { r.checkable = false; r.why = `a feeder target is not a text field on the filled PDF: ${t}`; break; }
          let raw = p.text;
          if (re && raw !== undefined && raw !== null && String(raw).trim() !== '') {
            const m = re.exec(String(raw));
            if (!m) { r.checkable = false; r.why = `the extract pattern read no amount out of a non-empty cell: ${JSON.stringify(String(raw).slice(0, 60))}`; break; }
            raw = m[1];
          }
          const v = parseMoney(raw);
          if (v.n === null) { r.checkable = false; r.why = `a feeder cell is not a number: ${JSON.stringify(v.raw.slice(0, 60))}`; break; }
          if (!v.blank) { r.sum += sign * v.n; r.feeders.push({ target: t, sign, n: v.n }); }
        }
        if (!r.checkable) break;
      }
      r.match = r.checkable && cents(r.printed) === cents(r.sum);
      rows.push(r);
    }

    const w = Math.max(...rows.map(r => r.line.length), 4);
    console.log(`  ${'line'.padEnd(w)} | ${'printed total'.padStart(15)} | ${'sum of printed rows'.padStart(19)} | match`);
    console.log(`  ${'-'.repeat(w)}-+-${'-'.repeat(15)}-+-${'-'.repeat(19)}-+------`);
    for (const r of rows) {
      if (!r.checkable) {
        console.log(`  ${r.line.padEnd(w)} | ${'—'.padStart(15)} | ${'—'.padStart(19)} | NOT CHECKABLE`);
        continue;
      }
      console.log(`  ${r.line.padEnd(w)} | ${money(r.printed).padStart(15)} | ${money(r.sum).padStart(19)} | ${r.match ? 'yes' : 'NO'}  (${r.feeders.length} feeder cell${r.feeders.length === 1 ? '' : 's'})`);
    }

    const unchecked = rows.filter(r => !r.checkable);
    if (unchecked.length) {
      console.log('');
      console.log(`  ${unchecked.length} of ${rows.length} line(s) NOT CHECKABLE — a feeder is not on the form, or a cell could not be read:`);
      unchecked.forEach(r => console.log(`    ${r.line}: ${r.why}`));
    } else {
      console.log('');
      console.log(`  0 of ${rows.length} line(s) not checkable — every feeder resolved to a printed cell on this form.`);
    }

    const bad = rows.filter(r => r.checkable && !r.match);
    if (!bad.length) return ok(`${rows.length - unchecked.length} of ${rows.length} total(s) checked, all agree with the rows printed above them`);
    console.error('');
    console.error(`ARITHMETIC TRIPWIRE — ${bad.length} printed total(s) disagree with the printed rows that feed them.`);
    for (const r of bad) {
      console.error(`  line ${r.line} — ${r.caption}`);
      console.error(`    printed total:       ${money(r.printed)}`);
      console.error(`    sum of printed rows: ${money(r.sum)}`);
      console.error(`    difference:          ${money(r.printed - r.sum)}`);
      r.feeders.forEach(f => console.error(`      ${f.sign < 0 ? '-' : '+'} ${money(f.n).padStart(14)}  ${f.target}`));
    }
    return fail(`${bad.length} total(s) do not agree with the rows printed above them`);
  }],
];

console.log(`form gate: ${form}`);
console.log(`  map:    ${mapPath}`);
console.log(`  sample: ${samplePath}`);
console.log(`  out:    ${outPath}`);

for (let i = 0; i < steps.length; i++) {
  const [title, run] = steps[i];
  console.log('');
  console.log(`[${i + 1}/${steps.length}] ${title}`);
  console.log('='.repeat(72));
  let r;
  try { r = await run(); }
  catch (e) { r = fail(`threw: ${e && e.message ? e.message : e}`); }
  if (!r.pass) {
    console.error('');
    console.error(`  FAIL — ${r.msg}`);
    console.error('');
    const skipped = steps.length - (i + 1);
    console.error(`GATE FAILED at step ${i + 1}/${steps.length}: ${title}.${skipped ? ` Step${skipped === 1 ? '' : 's'} ${i + 2}${skipped === 1 ? '' : `-${steps.length}`} did not run.` : ' It was the last step; every earlier step passed.'}`);
    process.exit(2);
  }
  console.log(`  PASS — ${r.msg}`);
}

console.log('');
console.log(`GATE PASSED — all ${steps.length} steps for ${form}.`);
