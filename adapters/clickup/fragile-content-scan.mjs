// fragile-content-scan.mjs — item E's second half.
//
// The projection probe established which content classes a ClickUp round trip damages. That is
// a fact about ClickUp. This asks the question that actually matters: DOES THE POPULATION
// CONTAIN ANY? A damaged class nothing in the data exercises is a note; a damaged class the
// data is full of is a constraint on how B2 must write the description.
//
// Every string a record carries is scanned — name, label, groupName, description, and every
// option label and value — against each damaged class, and the affected records are named.
//
// [R-07]: the classes are DERIVED from the probe's verdicts, not retyped here, so a class that
// changes verdict on a future probe changes this scan with it.
// [R-19] GENERATOR DECLARATION: this file generates scratchpad/p59-fragile-content.md.
//
// usage: node adapters/clickup/fragile-content-scan.mjs
import { hs } from '../hubspot/hs-lib.mjs';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const PROBE = 'scratchpad/p59-projection-probe.md';
if (!existsSync(PROBE)) { console.error(`STOP — ${PROBE} not found. Run adapters/clickup/projection-probe.mjs first; this scan is only meaningful against measured verdicts.`); process.exit(2); }
// Read the probe's own verdict table rather than restating it. [R-39]: a restated verdict is
// the same statement quoted twice, and it drifts the moment the probe is re-run.
const probeMd = readFileSync(PROBE, 'utf8');
const verdicts = new Map();
for (const m of probeMd.matchAll(/^\| `(E[0-9a-z]+)` \| (.+?) \| \*\*(PRESERVED|ALTERED|LOST)\*\* \|/gm)) verdicts.set(m[1], { what: m[2], verdict: m[3] });
if (!verdicts.size) { console.error('STOP — could not read any verdict out of the probe report. A scan that cannot read its input must not report a clean result ([R-11]).'); process.exit(3); }
const damaged = [...verdicts.entries()].filter(([, v]) => v.verdict !== 'PRESERVED');
console.log(`probe verdicts read: ${verdicts.size}; damaged classes: ${damaged.length} — ${damaged.map(([k]) => k).join(', ')}`);

// The detector for each damaged class. Keyed by the probe case id, so a class with no detector
// here is reported as such rather than silently skipped.
const DETECT = {
  E2: ['a backtick', s => s.includes('`')],
  E3b: ['a word wrapped in underscores (markdown emphasis)', s => /(^|\s)_[^\s_][^_]*_(\s|$)/.test(s)],
  E4a: ['the string opens with a hash', s => /^\s*#/.test(s)],
  E4b: ['the string opens with a hyphen or asterisk bullet', s => /^\s*[-*+]\s/.test(s)],
  E4c: ['the string opens with an ordinal marker', s => /^\s*\d+\.\s/.test(s)],
  E6b: ['a word wrapped in asterisks (markdown emphasis)', s => /(^|\s)\*[^\s*][^*]*\*(\s|$)/.test(s)],
  E6d: ['a backslash escape sequence', s => /\\[_*`#]/.test(s)],
  E8: ['leading or trailing whitespace', s => s !== s.trim()],
};

const live = (await hs('/crm/v3/properties/contacts?archived=false')).results;
const custom = live.filter(p => !p.hubspotDefined);
console.log(`population scanned: ${custom.length} live custom contact properties`);

// every string field a record carries, with where it came from
const fieldsOf = (p) => {
  const out = [['name', p.name], ['label', p.label ?? ''], ['groupName', p.groupName ?? ''], ['description', p.description ?? '']];
  (p.options ?? []).forEach((o, i) => { out.push([`options[${i}].label`, String(o.label ?? '')], [`options[${i}].value`, String(o.value ?? '')]); });
  return out;
};

const findings = new Map();       // case id -> [{name, field, value}]
const noDetector = [];
for (const [id, v] of damaged) {
  if (!DETECT[id]) { noDetector.push([id, v.what]); continue; }
  findings.set(id, []);
}
for (const p of custom) {
  for (const [field, value] of fieldsOf(p)) {
    if (!value) continue;
    for (const [id] of damaged) {
      const d = DETECT[id];
      if (!d) continue;
      if (d[1](value)) findings.get(id).push({ name: p.name, field, value });
    }
  }
}

const L = ['# Item E, second half — does the population contain content the round trip damages?', '',
  `Scanned ${new Date().toISOString()}. Population: **${custom.length}** live custom contact properties, every string field of each — name, label, groupName, description, and every option label and value.`, '',
  `Damaged classes taken from \`${PROBE}\` (read, not restated): **${damaged.length}**.`, ''];

if (noDetector.length) {
  L.push('## Damaged classes with NO detector in this scan', '');
  for (const [id, what] of noDetector) L.push(`- \`${id}\` — ${what}. **Not scanned.** Declared rather than left as a silence.`);
  L.push('');
}

L.push('## Result, per damaged class', '', '| class | what it is | occurrences | distinct properties |', '|---|---|---:|---:|');
for (const [id, v] of damaged) {
  if (!DETECT[id]) continue;
  const f = findings.get(id);
  L.push(`| \`${id}\` | ${DETECT[id][0]} | ${f.length} | ${new Set(f.map(x => x.name)).size} |`);
}
L.push('');
for (const [id, v] of damaged) {
  if (!DETECT[id]) continue;
  const f = findings.get(id);
  L.push(`### \`${id}\` — ${DETECT[id][0]}`, '');
  if (!f.length) { L.push('**None.** No string in the population exercises this class, so the round trip cannot damage the data through it.', ''); continue; }
  L.push(`**${f.length} occurrence(s) across ${new Set(f.map(x => x.name)).size} propert(ies).** Each is content a ClickUp-rendered description would alter, and each is carried verbatim in the JSON export instead.`, '');
  for (const x of f.slice(0, 40)) L.push(`- \`${x.name}\` · \`${x.field}\` · ${JSON.stringify(x.value.length > 160 ? x.value.slice(0, 160) + '…' : x.value)}`);
  if (f.length > 40) L.push(`- …and ${f.length - 40} more.`);
  L.push('');
}

const total = [...findings.values()].reduce((a, b) => a + b.length, 0);
const affected = new Set([...findings.values()].flat().map(x => x.name));
L.push('## What this means for the export and for B2', '',
  `- ${total} occurrence(s) across ${affected.size} propert(ies) sit in a class the ClickUp round trip damages.`,
  '- The JSON export is the authoritative channel and carries every byte verbatim, so nothing here is lost by this repo.',
  '- What it constrains is the DESCRIPTION B2 writes: any of the strings above, pasted raw into a ClickUp description, comes back altered. B2 must fence or escape them, or accept that the rendered description is not byte-faithful for those records and treat the JSON as the source of truth.',
  '- Intraword underscore is PRESERVED, which is the class that matters most here and the one every property name depends on.', '');
writeFileSync('scratchpad/p59-fragile-content.md', L.join('\n'));

console.log('');
for (const [id] of damaged) {
  if (!DETECT[id]) { console.log(`  ${id.padEnd(4)} NO DETECTOR — ${verdicts.get(id).what}`); continue; }
  const f = findings.get(id);
  console.log(`  ${id.padEnd(4)} ${String(f.length).padStart(5)} occurrence(s), ${String(new Set(f.map(x => x.name)).size).padStart(4)} propert(ies)  — ${DETECT[id][0]}`);
}
console.log(`\ntotal ${total} occurrence(s) across ${affected.size} propert(ies)`);
console.log('wrote scratchpad/p59-fragile-content.md');
