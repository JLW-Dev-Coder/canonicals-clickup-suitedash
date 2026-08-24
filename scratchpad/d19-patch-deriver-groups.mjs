// [D-19], THE OTHER DIRECTION — a GROUP row that gives no property a home.
//
//   node scratchpad/d19-patch-deriver-groups.mjs
//
// adapters/hubspot/gen-fields-from-map.mjs has always filtered its declared groups down to the
// ones a row actually names, with the comment "so provisioning never creates an empty group in
// the CRM for a namespace nothing uses yet". The two DERIVERS — 433-B and 433-B(OIC) — declare
// their group list as a literal and never applied that filter, so both files declare `irs433`
// and not one row in either names it. assert-registry-targets.mjs [RT-2] found it.
//
// PATCHED BY LINE INDEX, NEVER BY BLOB. An escaped-quote match in a heredoc patch silently
// fails and leaves the file untouched while the script reports success; this anchors on exact
// line prefixes, asserts it found exactly one region per file, and splices by index.

import { readFileSync, writeFileSync } from 'node:fs';

const PATCHES = [
  {
    path: 'adapters/hubspot/derive-names-433b.mjs',
    body: [
      '    // ONLY GROUPS A ROW ACTUALLY NAMES ARE DECLARED — the same rule',
      '    // adapters/hubspot/gen-fields-from-map.mjs has always applied, and this deriver did not.',
      '    // fields.433b.json declared `irs433` and not one of its 116 rows names it: every shared',
      "    // fact on this form binds a property 433-B(OIC) already created, and those sit in",
      '    // irs433boic. A group row that gives no property a home disposes of nothing, which is',
      '    // [D-19] facing the other way, and assert-registry-targets.mjs [RT-2] is what found it.',
      '    groups: [',
      "      { name: 'irs433', label: 'Form 433 series (shared)', displayOrder: 0 },",
      "      { name: 'irs433boic', label: 'Form 433-B(OIC)', displayOrder: 4 },",
      "      { name: 'irs433b', label: 'Form 433-B', displayOrder: 5 },",
      '    ].filter((g) => props.some((p) => p.group === g.name)),',
    ],
  },
  {
    path: 'adapters/hubspot/derive-names-433boi.mjs',
    body: [
      '    // ONLY GROUPS A ROW ACTUALLY NAMES ARE DECLARED — the same rule',
      '    // adapters/hubspot/gen-fields-from-map.mjs has always applied, and this deriver did not.',
      '    // fields.433boi.json declared `irs433` and not one of its 113 rows names it. A group row',
      '    // that gives no property a home disposes of nothing, which is [D-19] facing the other',
      '    // way, and assert-registry-targets.mjs [RT-2] is what found it.',
      '    groups: [',
      "      { name: 'irs433', label: 'Form 433 series (shared)', displayOrder: 0 },",
      "      { name: 'irs433boic', label: 'Form 433-B(OIC)', displayOrder: 4 },",
      '    ].filter((g) => props.some((p) => p.group === g.name)),',
    ],
  },
];

for (const p of PATCHES) {
  const lines = readFileSync(p.path, 'utf8').split('\n');
  const starts = [];
  lines.forEach((l, i) => { if (l === '    groups: [') starts.push(i); });
  if (starts.length !== 1) { console.error(`STOP — ${p.path} has ${starts.length} lines equal to "    groups: [". The anchor is not unique, so this script cannot say which region it would replace.`); process.exit(2); }
  const i = starts[0];
  const ends = [];
  for (let k = i; k < lines.length; k++) { if (lines[k] === '    ],') { ends.push(k); break; } }
  if (ends.length !== 1) { console.error(`STOP — ${p.path}: no closing "    ]," after line ${i + 1}.`); process.exit(2); }
  const j = ends[0];
  const out = [...lines.slice(0, i), ...p.body, ...lines.slice(j + 1)];
  writeFileSync(p.path, out.join('\n'));
  console.log(`patched ${p.path}: replaced lines ${i + 1}..${j + 1} (${j - i + 1} line(s)) with ${p.body.length}`);
}
