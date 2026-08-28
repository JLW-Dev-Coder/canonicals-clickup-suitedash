// check-cf-mirror-export.mjs — the standing check over the committed mirror export.
//
// [R-37]: A PIN NOBODY CHECKS IS A PIN IN NAME ONLY. The export carries a body digest, two
// renderings that claim to be generated from the JSON, and twenty-three digests in a sidecar.
// Every one of those is a claim, and a claim nobody re-derives is a sentence. This re-derives
// all of them, on every `npm run sweeps`, and refuses any difference.
//
// IT RENDERS THROUGH THE SAME MODULE THE BUILDER RENDERED WITH, imported rather than copied.
// Two renderers that agree today are two renderers ([R-39]) and the second one drifts silently.
//
// IT DOES NOT TOUCH THE PORTAL. Everything here is a fact about the committed files. Whether
// the portal still holds 959 custom properties is a different question, asked by the builder
// when it next runs and by adapters/hubspot/headroom.mjs; a checker that went to the network
// would fail for reasons that have nothing to do with whether these files agree with each other.
//
// [R-04] ZERO EXAMINED IS NOT A PASS. Every count below is asserted against the header rather
// than printed, and an empty records array is a STOP rather than a vacuous clean sweep.
//
// [R-19] GENERATOR DECLARATION: this file generates nothing. It asserts.
//
// usage: node adapters/hubspot/check-cf-mirror-export.mjs [--verbose]

import { readFileSync, existsSync } from 'node:fs';
import {
  renderMarkdown, renderCsv, renderDigests, bodyDigest, canonical, sha256,
  SERIALISATION_RULE, batchesOf, batchBegin, batchEnd, BATCH_SIZE, isND,
} from './cf-mirror-export-render.mjs';

const verbose = process.argv.includes('--verbose');
const OUT = 'adapters/hubspot/cf-mirror-export';
const problems = [];
const ok = [];
const say = (n, s) => ok.push(`[${n}] ${s}`);

// ── the files exist and parse ───────────────────────────────────────────────────────────
for (const ext of ['json', 'md', 'csv', 'sha256']) {
  if (!existsSync(`${OUT}.${ext}`)) {
    console.error(`STOP — ${OUT}.${ext} is not in this tree. There is nothing to check, and reporting a clean check of an absent artefact is the shape this file exists to refuse.`);
    process.exit(3);
  }
}
const json = readFileSync(`${OUT}.json`, 'utf8');
const md = readFileSync(`${OUT}.md`, 'utf8');
const csv = readFileSync(`${OUT}.csv`, 'utf8');
const dig = readFileSync(`${OUT}.sha256`, 'utf8');

let doc = null;
try { doc = JSON.parse(json); }
catch (e) { console.error(`STOP — ${OUT}.json will not parse: ${e.message}`); process.exit(3); }

const top = Object.keys(doc).sort();
if (top.length !== 2 || top[0] !== 'header' || top[1] !== 'records') {
  console.error(`STOP — the export's top level carries [${top.join(', ')}] and must carry exactly "header" and "records".`);
  process.exit(3);
}
const { header: h, records } = doc;
if (!Array.isArray(records) || !records.length) {
  console.error('STOP — the records array is absent or empty. Zero examined is not a pass ([R-04]).');
  process.exit(3);
}

// ── [1] the header carries exactly the declared fields ──────────────────────────────────
const HEADER_FIELDS = ['generated_at', 'generated_from_commit', 'record_count', 'body_sha256', 'serialisation_rule', 'population_rule', 'tag_counts'];
const got = Object.keys(h).sort();
const want = [...HEADER_FIELDS].sort();
const missing = want.filter((k) => !got.includes(k));
const extra = got.filter((k) => !want.includes(k));
if (missing.length) problems.push(`[1] header is missing: ${missing.join(', ')}`);
if (extra.length) problems.push(`[1] header carries fields the specification does not declare: ${extra.join(', ')}`);
if (!missing.length && !extra.length) say(1, `header carries exactly the ${HEADER_FIELDS.length} declared field(s)`);

// ── [2] body_sha256 recomputes under the declared serialisation rule ────────────────────
// The rule is not paraphrased here: it is compared to the one the render module exports, so a
// header that states a rule the checker does not implement is caught rather than believed.
if (h.serialisation_rule !== SERIALISATION_RULE)
  problems.push(`[2] the header's serialisation_rule is not the rule this checker implements.\n      header: ${h.serialisation_rule}\n      module: ${SERIALISATION_RULE}`);
const recomputed = bodyDigest(records);
if (recomputed !== h.body_sha256)
  problems.push(`[2] body_sha256 disagrees. header says ${h.body_sha256}; recomputing sha256 over canonical(records) gives ${recomputed}. The records array has changed since the header was written, or the serialisation rule has.`);
else say(2, `body_sha256 recomputes from the records array under the declared rule (${canonical(records).length} canonical byte(s) over ${records.length} record(s))`);

// ── [3] record_count, and the tag partition ─────────────────────────────────────────────
if (h.record_count !== records.length)
  problems.push(`[3] record_count says ${h.record_count} and the array holds ${records.length}.`);
else say(3, `record_count ${h.record_count} equals the number of records`);

const counted = {};
for (const r of records) {
  const t = r.prefix_tag && !isND(r.prefix_tag) ? r.prefix_tag.value : '(none)';
  counted[t] = (counted[t] ?? 0) + 1;
}
const tagKeys = [...new Set([...Object.keys(counted), ...Object.keys(h.tag_counts ?? {})])].sort();
const tagDiff = tagKeys.filter((k) => (counted[k] ?? 0) !== ((h.tag_counts ?? {})[k] ?? 0));
if (tagDiff.length)
  problems.push(`[3] tag_counts disagree with the records on: ${tagDiff.map((k) => `${k} (header ${(h.tag_counts ?? {})[k] ?? 0}, records ${counted[k] ?? 0})`).join('; ')}`);
const tagSum = Object.values(h.tag_counts ?? {}).reduce((n, v) => n + v, 0);
if (tagSum !== h.record_count)
  problems.push(`[3] the tag counts sum to ${tagSum} against record_count ${h.record_count}, so the partition is not total.`);
if (!tagDiff.length && tagSum === h.record_count)
  say(3, `tag partition disjoint and total over ${tagSum}: ${Object.entries(h.tag_counts).map(([k, v]) => `${k}=${v}`).join('  ')}`);

// ── [4] the renderings re-derive byte for byte ──────────────────────────────────────────
const mdAgain = renderMarkdown(doc);
if (mdAgain !== md) {
  const a = md.split('\n'), b = mdAgain.split('\n');
  const i = a.findIndex((l, n) => l !== b[n]);
  problems.push(`[4] the markdown does not re-render from the JSON. First difference at line ${i + 1}:\n      committed:  ${JSON.stringify(a[i])}\n      re-rendered: ${JSON.stringify(b[i])}`);
} else say(4, 'markdown re-renders from the JSON byte for byte');

const csvAgain = renderCsv(doc);
if (csvAgain !== csv) {
  const a = csv.split('\n'), b = csvAgain.split('\n');
  const i = a.findIndex((l, n) => l !== b[n]);
  problems.push(`[5] the CSV does not re-render from the JSON. First difference at line ${i + 1}:\n      committed:  ${JSON.stringify((a[i] ?? '').slice(0, 200))}\n      re-rendered: ${JSON.stringify((b[i] ?? '').slice(0, 200))}`);
} else say(5, 'CSV re-renders from the JSON byte for byte');

// ── [6] every digest in the sidecar recomputes ──────────────────────────────────────────
const digAgain = renderDigests(doc, json, md, csv);
const digLines = (s) => s.split('\n').filter((l) => l.startsWith('sha256'));
const committedDigests = digLines(dig);
const recomputedDigests = digLines(digAgain);
if (!committedDigests.length)
  problems.push('[6] the .sha256 sidecar carries no digest line at all. A digest file with nothing in it passes every comparison, which is why the count is asserted rather than iterated over.');
const digestDiff = [];
const maxLines = Math.max(committedDigests.length, recomputedDigests.length);
for (let i = 0; i < maxLines; i++)
  if (committedDigests[i] !== recomputedDigests[i])
    digestDiff.push(`      committed:   ${committedDigests[i] ?? '(absent)'}\n      recomputed:  ${recomputedDigests[i] ?? '(absent)'}`);
if (digestDiff.length) problems.push(`[6] ${digestDiff.length} digest line(s) disagree:\n${digestDiff.slice(0, 6).join('\n')}`);
else if (committedDigests.length) say(6, `every one of ${committedDigests.length} digest(s) recomputed and agrees (3 file digests + ${committedDigests.length - 3} batch digest(s))`);

// ── [7] the batch structure covers every record exactly once ────────────────────────────
const batches = batchesOf(records);
const mdLines = md.split('\n');
let covered = 0, structural = 0;
batches.forEach((b, i) => {
  const n = i + 1, from = i * BATCH_SIZE + 1, to = i * BATCH_SIZE + b.length;
  const bi = mdLines.indexOf(batchBegin(n, batches.length, from, to, h.record_count));
  const ei = mdLines.indexOf(batchEnd(n, batches.length));
  if (bi < 0) problems.push(`[7] batch ${n} has no BEGIN delimiter in the markdown.`);
  else if (ei < 0) problems.push(`[7] batch ${n} has no END delimiter in the markdown.`);
  else if (ei < bi) problems.push(`[7] batch ${n}'s END delimiter precedes its BEGIN.`);
  else { structural++; covered += b.length; }
});
if (covered !== records.length)
  problems.push(`[7] the batches cover ${covered} record(s) and there are ${records.length}.`);
else if (structural === batches.length)
  say(7, `${batches.length} batch(es) of ${BATCH_SIZE} cover all ${records.length} record(s) exactly once; the last carries ${batches[batches.length - 1].length}`);

// ── [8] nothing derived is blank, and no not-derivable field lacks its reason ───────────
const DERIVED_FIELDS = ['created_by_form', 'bound_by_forms', 'crosswalk_class', 'crosswalk_reason', 'backbone_key', 'reuse_status', 'prefix_tag', 'status_for_mirror'];
let blanks = 0, reasoned = 0;
for (const r of records) {
  for (const f of DERIVED_FIELDS) {
    const v = r[f];
    if (v === undefined || v === null) { blanks++; problems.push(`[8] ${r.name}.${f} is absent. A value that cannot be derived is written as the marker and a reason, never left out.`); continue; }
    if (isND(v)) {
      if (typeof v._reason !== 'string' || !v._reason.trim()) { blanks++; problems.push(`[8] ${r.name}.${f} is marked not-derivable and carries no _reason.`); }
      else reasoned++;
      continue;
    }
    if (!('value' in v)) { blanks++; problems.push(`[8] ${r.name}.${f} carries neither a value nor the not-derivable marker.`); continue; }
    if (typeof v.source !== 'string' || !v.source.trim()) { blanks++; problems.push(`[8] ${r.name}.${f} carries a value with no source. A derived value with no checkable source is not derived, it is asserted.`); }
  }
  if (!('divergence' in r)) problems.push(`[8] ${r.name} carries no divergence key. Null is the value for "none"; absent is a different thing.`);
  if (!('no_prefix_class' in r)) problems.push(`[8] ${r.name} carries no no_prefix_class key.`);
}
if (!blanks) say(8, `no derived field is blank across ${records.length} record(s); ${reasoned} not-derivable field(s) each state a reason`);

// ── [9] the portal facts are present on every record, including the empty ones ──────────
const PORTAL_FIELDS = ['name', 'label', 'type', 'fieldType', 'groupName', 'description', 'description_present', 'options', 'createdAt', 'archived', 'calculated', 'hasUniqueValue', 'hidden', 'formField'];
let portalGaps = 0, emptyDesc = 0, optionCount = 0;
for (const r of records) {
  for (const f of PORTAL_FIELDS) if (!(f in r)) { portalGaps++; problems.push(`[9] ${r.name} is missing the portal fact ${f}.`); }
  if (r.description === '' && r.description_present !== false) { portalGaps++; problems.push(`[9] ${r.name} holds an empty description and description_present is not false. Empty and absent are different facts and that boolean is what tells them apart.`); }
  if (r.description === '') emptyDesc++;
  if (!Array.isArray(r.options)) { portalGaps++; problems.push(`[9] ${r.name}.options is not an array. An absent option list is the empty array, never a missing key.`); }
  else optionCount += r.options.length;
}
if (!portalGaps) say(9, `every record carries all ${PORTAL_FIELDS.length} portal fact(s); ${emptyDesc} hold an empty description and say so; ${optionCount} option(s) carried in portal order across the population`);

// ── [10] name containment recomputes across the whole population ────────────────────────
const names = records.map((r) => r.name);
let containMismatch = 0, contained = 0;
for (const r of records) {
  const expect = names.filter((n) => n !== r.name && n.includes(r.name));
  const declaredList = Array.isArray(r.containing_names) ? r.containing_names : null;
  if (declaredList === null) { containMismatch++; problems.push(`[10] ${r.name}.containing_names is not an array.`); continue; }
  if (r.name_contained_in_other !== (expect.length > 0)) { containMismatch++; problems.push(`[10] ${r.name}.name_contained_in_other says ${r.name_contained_in_other} and ${expect.length} other name(s) contain it.`); continue; }
  if (canonical([...declaredList].sort()) !== canonical([...expect].sort())) { containMismatch++; problems.push(`[10] ${r.name}.containing_names disagrees with the population: declared ${JSON.stringify(declaredList)}, derived ${JSON.stringify(expect)}.`); continue; }
  if (expect.length) contained++;
}
if (!containMismatch) say(10, `name containment recomputes across all ${records.length} record(s): ${contained} name(s) are a strict substring of at least one other`);

// ── [11] the CSV holds one data line per record ─────────────────────────────────────────
// A description carrying a newline that escaped its quoted field would split a row in two, and
// the row count is what says it did not.
const csvData = csv.split('\n').filter((l) => l.length).length - 1;
if (csvData !== records.length)
  problems.push(`[11] the CSV holds ${csvData} data line(s) for ${records.length} record(s), so a field with an embedded newline has escaped its quoting.`);
else say(11, `the CSV holds ${csvData} data line(s) plus its header, so no embedded newline escaped a quoted field`);

// ── report ──────────────────────────────────────────────────────────────────────────────
if (verbose || problems.length) for (const l of ok) console.log(l);
else for (const l of ok) console.log(l);

if (problems.length) {
  console.error(`CF-MIRROR-EXPORT CHECK FAILED — ${problems.length} disagreement(s):`);
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more.`);
  process.exit(2);
}
console.log(`\nOK — the header's body_sha256 recomputes over the records under the declared serialisation rule, both renderings re-derive from the JSON byte for byte, every digest in the sidecar recomputes, ${batches.length} batches cover all ${records.length} records exactly once, the tag partition is disjoint and total, and no derived field is blank or sourceless.`);
