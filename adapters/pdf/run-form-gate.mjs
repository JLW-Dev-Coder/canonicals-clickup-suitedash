// The release gate for one form in the 433 series. Eleven steps, in order, stopping at the
// first failure.
//
// CLI:  node adapters/pdf/run-form-gate.mjs <form> <sample.json> [--saturated]
// npm:  npm run gate:433a   |   npm run gate:433f
// Exit: 0 = every step passed or was skipped with a reason, 2 = a step failed (it is named).
//
//   1  revision pin           the PDF is the revision the map was authored against
//   2  no pre-set boxes       no checkbox is already checked on the BLANK source form
//   3  validate-map           every target exists verbatim in the enumerated field list
//   4  duplicate-write        no target is written by more than one key
//   5  coverage               every enumerated field is referenced by the map
//   6  partition              writable + never-autofill + deferred = the field count, disjoint
//   7  fill                   produce the PDF
//   8  verify-appearances     every written value is actually drawn on the page
//   9  printed-heading        every group row sits beneath the heading it is declared to belong to
//  10  verify-form-coverage   the whole-form accounting closes
//  11  arithmetic tripwires   every printed total agrees with the rows it prints above it
//
// STEP 2 IS THE ONLY STEP THAT ASKS ABOUT THE BLANK FORM. Every other step judges what this
// run produced. A box already ticked in the source PDF is not something this run produced, is
// never written by the fill engine, appears in no diff of what the engine did, and prints on
// the filed page as an answer the taxpayer did not give — while the accounting closes and
// every total reconciles. It is asked here because nothing downstream is looking for it.
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
// STEPS 5 AND 6 FOLLOW THE MAP'S OWN DECLARED SCOPE. A map that declares itself COMPLETE
// is held to full coverage and a closed partition. A map that has not made that claim is a
// declared partial slice — 433-F is one — and is REPORTED against the same two checks
// rather than failed by them, because failing a map for not keeping a promise it never made
// would only teach people to stop running the gate. The counts print either way, loudly,
// so a partial map can never be mistaken for a complete one.
//
// --saturated IS AN ASSERTION ABOUT THE SAMPLE, NOT ABOUT THE FORM. Pass it when the input is
// an ACCEPTANCE sample built to reach every mapped cell, and step 10 fails on any mapped text
// cell the record left empty. Omit it for a PRODUCTION record, where an empty cell is the
// normal shape of a real answer — someone with two bank accounts leaves two slots blank, and
// that is a correctly filled form. Only that one assertion moves. The mode is banner-printed
// here and again inside step 10, because a coverage report that does not say which rule it ran
// under is a number nobody can act on.
//
// STEP 9 RUNS BEFORE THE ACCOUNTING AND THE TRIPWIRES ON PURPOSE. Steps 10 and 11 measure a
// form against itself: every field accounted for, every total agreeing with the rows above
// it. Both hold perfectly on a statement whose rows are filed under the wrong printed
// headings — the figures are individually correct and the arithmetic still reconciles. A run
// that reached the tripwires while rows sat under wrong headings would be reporting
// reconciled totals for a misfiled statement, so the heading assertion is asked first.
//
// STEP 11 ALSO FOLLOWS THE MAP'S DECLARED SCOPE. A map that declares COMPLETE and has no
// totals file FAILS — it promised the whole form and cannot prove its own arithmetic. A map
// that declares no COMPLETE slice and has no totals file is SKIPPED with the reason stated,
// because a partial slice may not contain a printed total to check yet, and failing it would
// only teach people to stop running the gate. A totals file that EXISTS is always checked,
// whatever the map claims.

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { PDFDocument, PDFTextField } from 'pdf-lib';
import { readFormRevisionWithPages } from './read-form-revision.mjs';
import { classifyMapTargets, mapClaimsComplete } from './verify-form-coverage.mjs';

const argv = process.argv.slice(2);
const saturated = argv.includes('--saturated');
const [form, samplePath] = argv.filter(a => !a.startsWith('--'));
if (!form || !samplePath) {
  console.error('usage: node adapters/pdf/run-form-gate.mjs <form> <sample.json> [--saturated]');
  console.error('  --saturated  the sample is an ACCEPTANCE sample: step 10 fails on any mapped');
  console.error('               text cell it left empty.');
  console.error('  (default)    the input is a PRODUCTION record: empty mapped cells are');
  console.error('               reported by step 10, not failed.');
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
// A step that could not run and should not pretend it did. Distinct from ok() so the transcript
// never reads as if an unrun check had held — which is the failure mode a gate exists to end.
const skip = (msg) => ({ pass: true, skipped: true, msg });
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

  // Asked of the BLANK source, before anything is written, because that is the only moment
  // at which a pre-set box is distinguishable from one this run put there. It is second
  // rather than first only because step 1 is what proves WHICH source PDF is loaded.
  ['no pre-set boxes on the blank form', async () =>
    runTool('assert-no-preset-boxes.mjs', [form])
      ? ok('every checkbox on the blank source form is off, so any tick on the filled copy was put there by the fill engine')
      : fail('a checkbox is already checked on the BLANK source form — it would print on the filed page as an answer nobody gave, and no later step looks at it')],

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

  // The mode travels INTO the fill engine, because the engine holds the one check that
  // needs it before anything is written: a group row that carries no key for a column its
  // slot declares. Step 9 asserts the CELL was reached; only the engine can say the record
  // and the map disagreed about what the column is called.
  ['fill', async () =>
    runTool(`fill-${form}.mjs`, [samplePath, ...(saturated ? ['--saturated'] : [])])
      ? (existsSync(outPath) ? ok(`wrote ${outPath}`) : fail(`fill reported success but ${outPath} does not exist`))
      : fail(`fill-${form}.mjs exited non-zero`)],

  ['verify-appearances', async () =>
    runTool('verify-appearances.mjs', [outPath])
      ? ok('every stored value is drawn by its widget normal appearance stream')
      : fail('verify-appearances.mjs exited non-zero')],

  ['printed-heading assertion', async () =>
    runTool('verify-headings.mjs', [form, outPath])
      ? ok('every group row sits beneath the printed heading it is declared to belong to')
      : fail('verify-headings.mjs exited non-zero — a group row prints under a heading it does not belong under, or the form has no heading declaration')],

  ['verify-form-coverage', async () =>
    runTool('verify-form-coverage.mjs', [form, outPath, ...(saturated ? ['--saturated'] : [])])
      ? ok(`the whole-form accounting closes (${saturated ? 'saturated' : 'production'} mode)`)
      : fail('verify-form-coverage.mjs exited non-zero')],

  ['arithmetic tripwires', async () => {
    if (!existsSync(totalsPath)) {
      // A COMPLETE map that cannot prove its own arithmetic has not earned a pass; a declared
      // partial slice may simply not hold a printed total yet. Same rule as steps 5 and 6:
      // the map's own declared scope decides, and this file still names no form.
      return complete
        ? fail(`no ${totalsPath} — 0 totals checked. This map declares itself COMPLETE ("${mapDoc.slice}"), so it claims the whole form and must be able to prove its own arithmetic. This step proves NOTHING for ${form} until a totals declaration is authored from the form's printed captions, so it fails rather than passing on an empty check.`)
        : skip(`no ${totalsPath}, and ${mapPath} declares no COMPLETE slice — 0 totals checked. A declared partial slice may not reach a printed total yet, so this is SKIPPED, not passed and not failed. It proves nothing about ${form}'s arithmetic either way. Authoring ${form}.totals.json turns this step on; declaring the map COMPLETE without one turns it into a failure.`);
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
    // `row` is 0-based and OPTIONAL. Without it a group feeder is the whole column, which is
    // what a group total sums. With it the feeder is ONE printed row, which is what a per-row
    // printed formula — "current market value X .8 = quick sale value" — is written over.
    // Every quick-sale tripwire on 433-A(OIC) is that shape: a cell whose caption states a
    // factor over the cell beside it, not over a column.
    const groupTargets = (g, column, row) => {
      const def = mapDoc.groups?.[g];
      if (!def || !Array.isArray(def.slots)) return null;
      // A slot is either flat ({column: target}) or nested under `text` — both shapes are
      // in use across the series, so the column is looked up in whichever one holds it.
      const pick = (s) => (s?.text && s.text[column] !== undefined) ? s.text[column] : s?.[column];
      if (row !== undefined) {
        if (!Number.isInteger(row) || row < 0 || row >= def.slots.length) return null;
        const one = pick(def.slots[row]);
        return one === undefined ? null : [one];
      }
      const t = def.slots.map(pick);
      return t.some(x => x === undefined) ? null : t;
    };
    // A total is addressed either by map key (`total_key`) or, when the printed cell is a
    // column of a repeatable row rather than a scalar, by `total_cell: {group, column, row}`.
    const resolveTotal = (entry) => {
      if (entry.total_key) return { target: resolveKey(entry.total_key), how: `total_key "${entry.total_key}"` };
      const c = entry.total_cell;
      if (!c) return { target: undefined, how: 'neither `total_key` nor `total_cell`' };
      const t = groupTargets(c.group, c.column, c.row);
      return { target: t ? t[0] : undefined, how: `total_cell ${c.group}[${c.row}].${c.column}` };
    };

    const rows = [];
    for (const entry of decl.totals) {
      const r = { line: entry.line, caption: entry.caption, checkable: true, why: null, printed: null, sum: 0, feeders: [],
                  floor: (typeof entry.floor === 'number') ? entry.floor : null, floored: false };

      const { target: totalTarget, how: totalHow } = resolveTotal(entry);
      if (!totalTarget) { r.checkable = false; r.why = `${totalHow} does not resolve to a target in the map`; rows.push(r); continue; }
      const tp = printed(totalTarget);
      if (tp.missing) { r.checkable = false; r.why = `the total's target is not a text field on the filled PDF`; rows.push(r); continue; }
      const tv = parseMoney(tp.text);
      if (tv.n === null) { r.checkable = false; r.why = `the printed total "${tv.raw}" is not a number`; rows.push(r); continue; }
      r.printed = tv.n;

      for (const fd of entry.feeders) {
        const sign   = fd.sign === -1 ? -1 : 1;
        // A FACTOR and a CONSTANT, and nothing more. Two printed shapes on 433-A(OIC) need
        // them and neither is expressible by adding cells: "X .8 = $" states a factor over
        // the cell to its left, and "Add lines (1a) through (1c) minus ($1,000)" states a
        // constant the form prints and no cell holds. They are declared as two numbers rather
        // than as an expression, so a totals file can still only say WHICH printed cells feed
        // a line and by how much — it cannot become a second place where arithmetic is
        // invented. A feeder that declares `constant` and no cells IS the printed constant.
        const factor = (typeof fd.factor === 'number') ? fd.factor : 1;
        const konst  = (typeof fd.constant === 'number') ? fd.constant : 0;
        let targets;
        if (Array.isArray(fd.keys)) {
          targets = fd.keys.map(resolveKey);
          const bad = fd.keys.filter((k, i) => !targets[i]);
          if (bad.length) { r.checkable = false; r.why = `feeder key(s) not in the map: ${bad.join(', ')}`; break; }
        } else if (fd.group) {
          targets = groupTargets(fd.group, fd.column, fd.row);
          if (!targets) { r.checkable = false; r.why = `group "${fd.group}" column "${fd.column}"${fd.row === undefined ? '' : ` row ${fd.row}`} does not resolve to a target on every printed row`; break; }
        } else if (typeof fd.constant === 'number') {
          targets = [];                       // a printed constant, contributing on its own
        } else { r.checkable = false; r.why = 'feeder declares none of `keys`, `group` or `constant`'; break; }

        const re = fd.extract ? new RegExp(fd.extract) : null;
        let cellSum = 0;
        const cells = [];
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
          if (!v.blank) { cellSum += v.n; cells.push({ target: t, n: v.n }); }
        }
        if (!r.checkable) break;
        // Report each cell at the value it actually contributes, factor and sign applied, so
        // the failure print-out adds up on the page rather than needing the reader to redo it.
        cells.forEach(c => r.feeders.push({ target: c.target, sign, n: c.n, factor, contributes: sign * factor * c.n }));
        if (konst !== 0) r.feeders.push({ target: `(printed constant ${money(konst)})`, sign, n: konst, factor: 1, contributes: sign * konst });
        r.sum += sign * (factor * cellSum + konst);
      }
      // The floor is the form's own printed instruction — 433-A(OIC) page 2 y 668.1: "Do not
      // enter a negative number. If any line item is a negative number, enter '0'." Applied
      // AFTER the feeders, because that is where the page applies it, and recorded when it
      // bites so a match that depended on it can never read as an unconditional match.
      if (r.checkable && r.floor !== null && r.sum < r.floor) { r.sum = r.floor; r.floored = true; }
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
      // Anything that moved the recomputation beyond "add the cells" is named on the line
      // itself. A factor, a printed constant or a floor that fired changes what the match
      // means, and a table that showed only the two figures would hide which rule produced them.
      const applied = [
        ...new Set(r.feeders.filter(f => f.factor !== 1).map(f => `x ${f.factor}`)),
        ...r.feeders.filter(f => String(f.target).startsWith('(printed constant')).map(f => `${f.contributes < 0 ? '-' : '+'} ${money(Math.abs(f.contributes))}`),
        ...(r.floored ? [`floored at ${money(r.floor)}`] : []),
      ];
      const cellCount = r.feeders.filter(f => !String(f.target).startsWith('(printed constant')).length;
      console.log(`  ${r.line.padEnd(w)} | ${money(r.printed).padStart(15)} | ${money(r.sum).padStart(19)} | ${r.match ? 'yes' : 'NO'}  (${cellCount} feeder cell${cellCount === 1 ? '' : 's'}${applied.length ? `, ${applied.join(', ')}` : ''})`);
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

    // Totals the DECLARATION says it deliberately does not check. Printed here so the
    // decision is visible in the gate output rather than only in the file: a total-shaped
    // cell that appears in neither list reads as "checked" to anyone skimming this step,
    // and "no declared state" is the condition defect D1 sat in.
    const declined = decl.not_checkable?.entries || [];
    if (declined.length) {
      console.log('');
      console.log(`  ${declined.length} printed total-shaped cell(s) DECLARED not checkable — written, deliberately not verified:`);
      for (const e of declined) {
        console.log(`    ${e.map_key || `${e.cell?.group}.${e.cell?.column}`} — "${e.printed_caption}"`);
        console.log(`      ${e.why_not_checkable}`);
        // A declined cell whose caption states a FORMULA carries a requirement no check can
        // enforce. render-review.mjs puts it beside the value for the preparer; it is echoed
        // here so the gate transcript names every cell the machine handed to a person.
        if (e.review_page_advisory) console.log(`      ADVISORY on the review page: ${e.review_page_advisory}`);
      }
    }

    const bad = rows.filter(r => r.checkable && !r.match);
    if (!bad.length) return ok(`${rows.length - unchecked.length} of ${rows.length} total(s) checked, all agree with the rows printed above them${declined.length ? `; ${declined.length} more declared not checkable, with reasons` : ''}`);
    console.error('');
    console.error(`ARITHMETIC TRIPWIRE — ${bad.length} printed total(s) disagree with the printed rows that feed them.`);
    for (const r of bad) {
      console.error(`  line ${r.line} — ${r.caption}`);
      console.error(`    printed total:       ${money(r.printed)}`);
      console.error(`    sum of printed rows: ${money(r.sum)}${r.floored ? `  (floored at ${money(r.floor)})` : ''}`);
      console.error(`    difference:          ${money(r.printed - r.sum)}`);
      r.feeders.forEach(f => console.error(`      ${f.contributes < 0 ? '-' : '+'} ${money(Math.abs(f.contributes)).padStart(14)}  ${f.target}${f.factor !== 1 ? `   [${money(f.n)} x ${f.factor}]` : ''}`));
    }
    return fail(`${bad.length} total(s) do not agree with the rows printed above them`);
  }],
];

console.log(`form gate: ${form}`);
console.log(`  map:    ${mapPath}`);
console.log(`  sample: ${samplePath}`);
console.log(`  out:    ${outPath}`);
console.log(`  mode:   ${saturated
  ? 'SATURATED — the sample must reach every mapped text cell (step 10 fails on any it misses)'
  : 'production record — empty mapped text cells are reported by step 10, not failed'}`);

const skipped = [];
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
  console.log(`  ${r.skipped ? 'SKIP' : 'PASS'} — ${r.msg}`);
  if (r.skipped) skipped.push(`${i + 1}/${steps.length} ${title}`);
}

console.log('');
if (skipped.length) {
  console.log(`GATE PASSED with ${skipped.length} step(s) SKIPPED for ${form} — ${steps.length - skipped.length} of ${steps.length} steps actually ran.`);
  skipped.forEach(t => console.log(`  skipped: ${t}`));
} else {
  console.log(`GATE PASSED — all ${steps.length} steps for ${form}${saturated ? ', saturated' : ''}.`);
}
