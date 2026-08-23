// Asserts that NO checkbox on a BLANK source form is already checked.
//
// CLI:  node adapters/pdf/assert-no-preset-boxes.mjs <form>      (reads adapters/pdf/forms/f<form>.pdf)
// API:  import { assertNoPresetBoxes } from './assert-no-preset-boxes.mjs'
// Exit: 0 = every checkbox on the blank form is off, 2 = at least one is not (it is named).
//
// WHY THIS EXISTS
// ---------------
// The forms in this series print option lists that are NOT exclusive. An account can
// truthfully be both Checking and an Online Account; a brokerage account can hold both
// stocks and bonds. 433-A(OIC)'s map declares those lists independent rather than exclusive,
// deliberately, because asserting a "check one" rule the page does not print would hard-stop
// a truthful record.
//
// That decision gives something up, and this file is what replaces it. An exclusive set is
// read back after filling and would have caught ONE thing an independent list cannot: a box
// that was ALREADY CHECKED IN THE BLANK SOURCE PDF. Such a box is never written by the fill
// engine, never appears in any diff of what the engine did, and prints on the filed page as
// an answer the taxpayer did not give. Every downstream check passes: the map validates, no
// target is double-written, the accounting closes, every total reconciles. The form is
// simply wrong in a way nothing downstream is looking at.
//
// So the guard is moved to where the defect would actually originate — the source PDF — and
// made FORM-WIDE rather than per-list. Declaring the non-exclusive lists exclusive would have
// covered only those lists; this covers every checkbox on all seven forms, including the ones
// that are exclusive, the lone check-here boxes, and every box on a page nobody has mapped yet.
//
// THREE PLACES A BOX CAN BE ON, AND ALL THREE ARE CHECKED
// ------------------------------------------------------
//   /V   on the field    — the value. What pdf-lib's isChecked() reads.
//   /AS  on each widget  — the appearance state. THIS IS WHAT A VIEWER DRAWS. A widget whose
//                          /AS names the on-state prints a tick even when /V is absent, which
//                          is precisely the failure a /V-only check would sail past.
//   /DV  on the field    — the default. Restored by a form reset, and inherited by anything
//                          that re-derives a blank template from this file.
// A box is reported if ANY of the three is present and is not /Off. Reporting all three
// separately matters: the remedy differs, and "which one was set" is the first question.
//
// RADIO GROUPS ARE INCLUDED. None of the three forms mapped so far has one, but a radio group
// is the same defect wearing a different field type — a preselected option nobody chose — and
// a guard that only understood checkboxes would report a clean form the day one appears.
//
// TEXT FIELDS ARE NOT IN SCOPE, and that is a limit rather than an oversight. A blank form
// carrying a default string is a real defect too, but the saturated coverage check already
// requires every mapped text cell to be written by the record, so a stale default is
// overwritten before it can be filed. A checkbox has no such backstop: an unmapped or
// unwritten box is left exactly as the source PDF had it.

import { PDFDocument, PDFCheckBox, PDFRadioGroup, PDFName } from 'pdf-lib';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { formPath } from './read-form-revision.mjs';
import { examined } from './examined.mjs';

const nameOf = (v) => (v === undefined || v === null) ? null : v.toString();
const isOn   = (s) => s !== null && s !== '/Off';

export async function assertNoPresetBoxes(form, file = formPath(form)) {
  const doc  = await PDFDocument.load(readFileSync(file));
  const acro = doc.getForm();

  const findings = [];
  let checkboxes = 0, radios = 0, widgets = 0;

  for (const field of acro.getFields()) {
    const isCb = field instanceof PDFCheckBox;
    const isRg = field instanceof PDFRadioGroup;
    if (!isCb && !isRg) continue;
    if (isCb) checkboxes++; else radios++;

    const dict = field.acroField.dict;
    const V  = nameOf(dict.get(PDFName.of('V')));
    const DV = nameOf(dict.get(PDFName.of('DV')));

    const ws = field.acroField.getWidgets();
    widgets += ws.length;
    const asOn = ws
      .map((w, i) => ({ i, as: nameOf(w.dict.get(PDFName.of('AS'))) }))
      .filter(x => isOn(x.as));

    const set = [];
    if (isOn(V))  set.push(`/V ${V}`);
    if (isOn(DV)) set.push(`/DV ${DV}`);
    asOn.forEach(x => set.push(`widget ${x.i} /AS ${x.as}`));
    if (set.length) findings.push({ kind: isCb ? 'checkbox' : 'radio group', name: field.getName(), set });
  }

  return { form, file, checkboxes, radios, widgets, findings };
}

export function reportPresetBoxes(r) {
  console.log(`no-preset-box assertion: ${r.form}`);
  console.log(`  blank source: ${r.file}`);
  console.log(`  inspected:    ${r.checkboxes} checkbox(es) + ${r.radios} radio group(s), ${r.widgets} widget(s), on /V, /DV and every widget's /AS`);
  if (!r.findings.length) {
    examined('assert-no-preset-boxes', r.form, r.checkboxes + r.radios, 'blank-form-boxes');
    console.log(`  OK — every box on the blank form is off on all three, so any tick on a filled copy was put there by the fill engine.`);
    return true;
  }
  console.error('');
  console.error(`  PRE-SET BOX — ${r.findings.length} box(es) are already checked on the BLANK form. A tick nobody chose would print on the filed page:`);
  for (const f of r.findings) {
    console.error(`    ${f.kind}  ${f.name}`);
    f.set.forEach(s => console.error(`      ${s}`));
  }
  return false;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const form = process.argv[2];
  if (!form) {
    console.error('usage: node adapters/pdf/assert-no-preset-boxes.mjs <form>');
    process.exit(2);
  }
  const r = await assertNoPresetBoxes(form);
  process.exit(reportPresetBoxes(r) ? 0 : 2);
}
