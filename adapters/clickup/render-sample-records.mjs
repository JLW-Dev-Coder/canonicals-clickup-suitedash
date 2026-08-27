// render-sample-records.mjs — commit 1 of prompt 59 as revised by 59-A item I.
//
// The tool reads the LIVE portal and renders THREE sample records in EXPORT form. Nothing is
// written to ClickUp and nothing is written to the export files. This is the shape review:
// three properties chosen to be maximally different, so the record shape can be judged before
// 959 of them are built from it.
//
// 59-A ITEM I MOVED THE WRITE TO B2. There is no ClickUp write path in this tool and no
// --write flag to find. The only ClickUp write this cycle makes is item E's projection probe,
// which is registered in adapters/clickup/write-probe.json and torn down with its absence read
// back. The list is left empty.
//
// [R-19] GENERATOR DECLARATION: this file generates scratchpad/p59-sample-records.json and
// scratchpad/p59-sample-records.md.
//
// usage: node adapters/clickup/render-sample-records.mjs [--only a,b,c]
import { hs } from '../hubspot/hs-lib.mjs';
import { loadArtefacts, prefixTag, NO_PREFIX_TAG } from './derive-property-records.mjs';
import { buildExportRecord } from './export-record.mjs';
import { projectEpoch, nativeGroupSet, mentionedNames } from './no-prefix-classes.mjs';
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };

const acct = await hs('/account-info/v3/details').catch(() => null);
const portalId = acct?.portalId ?? 'unknown';
const live = (await hs('/crm/v3/properties/contacts?archived=false')).results;
const custom = live.filter(p => !p.hubspotDefined);
const art = loadArtefacts();

console.log(`portal ${portalId}: ${live.length} contact propert(ies), ${custom.length} custom (archived=false), ${live.length - custom.length} hubspotDefined`);
console.log(`population for the export = every CUSTOM property, archived=false = ${custom.length}. Derived, not typed ([R-07]).`);

const epoch = projectEpoch(custom, art);
const nativeGroups = nativeGroupSet(live);
const noPrefixNames = custom.filter(p => prefixTag(p.name) === NO_PREFIX_TAG).map(p => p.name);
const mentioned = mentionedNames(noPrefixNames);
const ctx = { classifyCtx: { epoch, nativeGroups, mentioned } };

// ── the three, chosen to be maximally different ──────────────────────────────────────────
// Chosen, not sampled: each exercises a different set of branches, and between them they reach
// every "not derivable" path the shape has.
const PICKS = opt('--only') ? opt('--only').split(',').map(s => s.trim()) : [
  'personal_income_tax__1040___select_tax_form',
  'irs433boi_employer_identification_number',
  'vlp_case_liab',
];
const WHY = {
  personal_income_tax__1040___select_tax_form:
    'ENUMERATION WITH MANY OPTIONS — 318, the largest option set on the portal, and the record that sets the size ceiling for the whole export. It is also the maximally UNBOUND case: no field file names it, so created_by_form, bound_by_forms, crosswalk and backbone_key all take their not-derivable branch and each has to state a reason. It carries a no_prefix_class, which the other two do not.',
  irs433boi_employer_identification_number:
    'REUSE BOUND BY MORE THAN ONE FORM — bound by 433b, 433boi and 433d; created by 433boi and reused by the other two. The crosswalk block appears three times, once per binding form, each with its own recorded reason, and reuse_status is populated rather than empty.',
  vlp_case_liab:
    'VLP ROUTING PROPERTY — organizer-only, a checkbox with 6 options, defined in fields.registry.json, the one definition file with no crosswalk beside it. It exercises the vlp path and the no-crosswalk reason, and it is the case where the portal holds NO description at all, so description_present is the field carrying that fact.',
};

const missing = PICKS.filter(n => !custom.some(p => p.name === n));
if (missing.length) { console.error(`STOP — not live on the portal: ${missing.join(', ')}`); process.exit(2); }

const records = PICKS.map(n => buildExportRecord(custom.find(p => p.name === n), art, ctx));

// ── item F: the largest record in the export, measured over the WHOLE population ─────────
// Not over the three samples. The ceiling question is about the export, and a maximum measured
// on a chosen subset is a maximum of what somebody looked at ([R-07] / [D-24]).
let max = { name: null, bytes: -1 }, total = 0;
for (const p of custom) {
  const bytes = Buffer.byteLength(JSON.stringify(buildExportRecord(p, art, ctx)), 'utf8');
  total += bytes;
  if (bytes > max.bytes) max = { name: p.name, bytes, options: (p.options ?? []).length };
}
console.log(`\nitem F — largest export record over the FULL population of ${custom.length}:`);
console.log(`  ${max.name}  ${max.bytes} bytes JSON, ${max.options} option(s)`);
console.log(`  whole export, JSON records only: ${total} bytes`);

writeFileSync('scratchpad/p59-sample-records.json', JSON.stringify({
  _generator: 'adapters/clickup/render-sample-records.mjs',
  _what: 'Three export records rendered in full for shape review. NOTHING was written to ClickUp and no export file was written.',
  run: new Date().toISOString(), portal: portalId, population: custom.length,
  largest_record: max, export_json_record_bytes_total: total,
  samples: records,
}, null, 1) + '\n');

const L = ['# Prompt 59 commit 1 — three export records, in full', '',
  `Rendered ${new Date().toISOString()} from portal \`${portalId}\`. Population **${custom.length}** live custom contact properties (\`hubspotDefined === false\`, \`archived=false\`).`, '',
  '**Nothing was written to ClickUp. No export file was written.** 59-A item I moved the write to B2; this is the shape review only.', '',
  `Largest export record over the full population: \`${max.name}\` at **${max.bytes}** bytes of JSON, ${max.options} options.`, '',
  '---', ''];
for (const r of records) {
  L.push(`## \`${r.name}\``, '', `**Why this one.** ${WHY[r.name] ?? '(chosen on the command line)'}`, '',
    '```json', JSON.stringify(r, null, 1), '```', '', '---', '');
}
writeFileSync('scratchpad/p59-sample-records.md', L.join('\n'));

console.log('\nsamples rendered:');
for (const r of records) console.log(`  ${r.name}  ${Buffer.byteLength(JSON.stringify(r), 'utf8')} bytes  tag=${r.derived.prefix_tag}  divergence=${r.derived.divergence ? r.derived.divergence.kinds.join('+') + ' [' + r.derived.divergence.ruling + ']' : 'none'}`);
console.log('\nwrote scratchpad/p59-sample-records.json and scratchpad/p59-sample-records.md');
console.log('NOTHING WRITTEN TO CLICKUP. NO EXPORT FILE WRITTEN.');
