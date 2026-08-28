// build-cf-mirror-export.mjs — commit 2 of the CF mirror sweep.
//
// ClickUp Brain 2 builds the 959 mirror tasks. This produces the artefact it builds them from:
// one record per LIVE custom contact property, a header that pins the body, plus two renderings
// generated FROM that record set so they cannot drift from it, plus the digests — all checked by
// adapters/hubspot/check-cf-mirror-export.mjs on every `npm run sweeps`.
//
// NOTHING HERE WRITES TO CLICKUP. RC's ClickUp work is finished and B2 is the writer now. This
// tool reads /crm/v3/properties/contacts, which returns SCHEMA: no contact object is queried,
// so no property VALUE and nothing belonging to a real person can reach the export.
//
// THE TWO HALVES OF A RECORD ARE KEPT APART BY MEANING, NOT BY NESTING. The portal facts are
// scalars carried verbatim and unnormalised — no trimming, no sorting, no summarising, no
// truncation at any size. Every derived fact is an object carrying the FILE it was sourced
// from, or the not-derivable marker and a reason. Nothing is ever blank, and no derived value is
// ever inferred from the prefix tag: a prefix is a lexical fact about a string and `irs433=253`
// is not "433-A created 253 properties". adapters/clickup/assert-prefix-not-provenance.mjs
// enforces that over the live population on every sweep.
//
// [R-19] GENERATOR DECLARATION: this file generates
//   adapters/hubspot/cf-mirror-export.json
//   adapters/hubspot/cf-mirror-export.md
//   adapters/hubspot/cf-mirror-export.csv
//   adapters/hubspot/cf-mirror-export.sha256
// and is the only tool that may write them.
//
// THE RENDERINGS ARE MADE FROM THE FILE, NOT FROM MEMORY. The JSON is written first and then
// RE-READ off disk before the markdown and the CSV are rendered. Rendering from the in-memory
// object would leave "generated from the JSON" true of a value nobody can check; rendering from
// the bytes that landed makes it true of the artefact.
//
// usage: node adapters/hubspot/build-cf-mirror-export.mjs

import { hs, stop, isStop } from './hs-lib.mjs';
import { loadArtefacts, deriveRecord, prefixTag, PREFIXES, NO_PREFIX_TAG } from '../clickup/derive-property-records.mjs';
import { ABSENCE_KINDS } from '../clickup/divergence-kinds.mjs';
import { projectEpoch, nativeGroupSet, mentionedNames, classifyRow } from '../clickup/no-prefix-classes.mjs';
import { renderMarkdown, renderCsv, renderDigests, bodyDigest, SERIALISATION_RULE, batchesOf, BATCH_SIZE } from './cf-mirror-export-render.mjs';
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = 'adapters/hubspot/cf-mirror-export';

// A derived value always carries where it came from. `source` is a path in this tree, so a
// reader can go and check it; a derived value with no checkable source is not derived, it is
// asserted.
const derived = (value, source) => ({ value, source });
const ND = (reason) => ({ not_derivable: true, _reason: reason });

// ── the portal ──────────────────────────────────────────────────────────────────────────
const acct = await hs('/account-info/v3/details').catch((e) => { if (isStop(e)) throw e; return null; });
const portalId = acct?.portalId ?? 'unknown';
const live = (await hs('/crm/v3/properties/contacts?archived=false')).results;
const custom = live.filter((p) => !p.hubspotDefined);
// The archived set is READ, not assumed empty, and its size goes into the population rule so
// the figure is never mistaken for "every custom property that has ever existed".
let archivedCustom = 0;
try { archivedCustom = (await hs('/crm/v3/properties/contacts?archived=true')).results.filter((p) => !p.hubspotDefined).length; }
catch (e) { if (isStop(e)) throw e; archivedCustom = -1; }

const art = loadArtefacts();
console.log(`portal ${portalId}: ${live.length} live contact propert(ies), ${custom.length} custom, ${live.length - custom.length} hubspotDefined; ${archivedCustom} archived custom`);

const epoch = projectEpoch(custom, art);
const nativeGroups = nativeGroupSet(live);
const mentioned = mentionedNames(custom.filter((p) => prefixTag(p.name) === NO_PREFIX_TAG).map((p) => p.name));
const classifyCtx = { epoch, nativeGroups, mentioned };

// ── one record ──────────────────────────────────────────────────────────────────────────
function buildRecord(p) {
  const r = deriveRecord(p, art);
  const files = [...new Set(r.binding.rows.map((x) => x.file))].map((f) => `adapters/hubspot/${f}`);
  const src = files.length ? files.join(' + ') : null;

  const c = r.binding.created_by_form;
  const created_by_form = (c && c.derivable !== false && 'value' in c)
    ? derived(c.value, `${src} — ${c.basis}`)
    : ND(c?.reason ?? 'this property appears in no field file in this repo, so no artefact here claims a form created it. It is NOT inferred from the prefix tag: a prefix is a lexical fact about the name.');

  const bound_by_forms = r.binding.bound_by.length
    ? derived(r.binding.bound_by, `${src} — every field file holding a row for this internal name`)
    : ND('no field file in this repo holds a row for this property, so no form here binds it.');

  const cls = r.classifications;
  const crosswalk_class = cls.length
    ? derived(cls.map((x) => ({
      form: x.form,
      class: (x.classification && x.classification.derivable === false) ? null : x.classification,
      class_not_derivable_reason: (x.classification && x.classification.derivable === false) ? x.classification.reason : null,
      entry: (x.entry && x.entry.derivable === false) ? null : x.entry,
      arguable: x.arguable ?? null,
      source: x.source_file ? `adapters/hubspot/${x.source_file}` : null,
    })), 'adapters/hubspot/crosswalk.<form>.json, joined on the field row key')
    : ND('no field row names this property, so no crosswalk in this repo classifies it.');

  const crosswalk_reason = cls.length
    ? derived(cls.map((x) => ({
      form: x.form,
      reason: (x.reason && x.reason.derivable === false) ? null : x.reason,
      reason_not_derivable_reason: (x.reason && x.reason.derivable === false) ? x.reason.reason : null,
      reuse_reason: x.reuse_reason ?? null,
      source: x.source_file ? `adapters/hubspot/${x.source_file}` : null,
    })), 'adapters/hubspot/crosswalk.<form>.json, the recorded reason on the same entry')
    : ND('no field row names this property, so no crosswalk in this repo records a reason for it.');

  const b = r.backbone_key;
  const backbone_key = (b && b.derivable !== false && 'value' in b)
    ? derived(b.value, `${src} — ${b.basis}`)
    : ND(b?.reason ?? 'this property appears in no field file, so there is no row to declare a backbone key.');

  const reuse_status = derived(
    { is_reuse: r.reuse.is, by_forms: r.reuse.by, reuse_of: r.reuse.of },
    src ? `${src} — rows whose scope is "reuse" or which declare reuse_of` : 'adapters/hubspot/fields.*.json — no row names this property, so it is a reuse of nothing here',
  );

  const tag = prefixTag(p.name);
  const prefix_tag = derived(tag,
    'the internal name itself. A LEXICAL FACT ABOUT THE STRING, for filtering, and NEVER a provenance claim — read created_by_form for that. Enforced by adapters/clickup/assert-prefix-not-provenance.mjs.');

  const no_prefix_class = tag === NO_PREFIX_TAG
    ? (() => { const k = classifyRow(p, classifyCtx); return derived({ class: k.cls, label: k.label, why: k.why, mentioned_in_repo: k.named }, 'adapters/clickup/no-prefix-classes.mjs, over the live portal: the project epoch derived from the earliest createdAt among the properties this repo names, and whether the property\'s group also holds a hubspotDefined property'); })()
    : null;

  const kinds = [...new Set(r.divergences.map((d) => d.kind))];
  const hasAbsence = kinds.some((k) => ABSENCE_KINDS.has(k));
  const divergence = kinds.length ? {
    kinds,
    side: hasAbsence ? 'ABSENCE' : 'DISAGREEMENT',
    ruling: hasAbsence ? 'OWED' : 'GOVERNED-BY-P59',
    ruling_note: hasAbsence
      ? 'One side carries no entry at all. The ruling presumes both sides have one and does not reach this, so NO SIDE IS PICKED here; the derived fields above already read not-derivable with their reasons. OWED means a person rules, not that the tool failed.'
      : 'Both sides carry an entry and differ. The portal is authority for the definition and adapters/hubspot/fields.*.json for binding and classification. Recorded, not reconciled.',
    kinds_detail: r.divergences.map((d) => ({ kind: d.kind, detail: d.detail })),
    source: 'adapters/clickup/divergence-taxonomy.mjs, comparing the live portal definition against every field row that names this property',
  } : null;

  return {
    // ── portal facts, verbatim and unnormalised ──
    name: p.name,
    label: p.label ?? null,
    type: p.type ?? null,
    fieldType: p.fieldType ?? null,
    groupName: p.groupName ?? null,
    description: p.description ?? '',
    description_present: Object.prototype.hasOwnProperty.call(p, 'description') && p.description != null && p.description !== '',
    options: (p.options ?? []).map((o) => ({
      label: o.label, value: o.value, displayOrder: o.displayOrder ?? null, hidden: o.hidden ?? false,
    })),
    createdAt: p.createdAt ?? null,
    archived: p.archived ?? false,
    calculated: p.calculated ?? false,
    hasUniqueValue: p.hasUniqueValue ?? false,
    hidden: p.hidden ?? false,
    formField: p.formField ?? false,
    // ── derived facts, each naming the file it came from ──
    created_by_form, bound_by_forms, crosswalk_class, crosswalk_reason, backbone_key,
    reuse_status, prefix_tag, divergence, no_prefix_class,
    status_for_mirror: derived(r.status, r.deprecated
      ? 'the live portal description marks this property deprecated'
      : 'the live portal description carries no deprecation marker'),
    // ── filled in below, once every name is known ──
    name_contained_in_other: false,
    containing_names: [],
  };
}

// Records are sorted BY INTERNAL NAME so the export is stable across runs. The portal returns
// them in an order it does not promise, and an unstable order makes every digest differ on a
// re-run for no reason anybody can read out of the diff.
const records = custom.map(buildRecord).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

// ── name containment, computed across the WHOLE population ──────────────────────────────
// One name being a strict substring of another is not a defect; it is a hazard for anything that
// matches a mirror task by name, which is what B2 will be doing. Computed over all of them, in
// both directions, and carried per record so the consumer does not have to derive it again.
const allNames = records.map((r) => r.name);
for (const r of records) {
  const containing = allNames.filter((n) => n !== r.name && n.includes(r.name));
  r.name_contained_in_other = containing.length > 0;
  r.containing_names = containing;
}

// ── the header ──────────────────────────────────────────────────────────────────────────
const tag_counts = {};
for (const r of records) tag_counts[r.prefix_tag.value] = (tag_counts[r.prefix_tag.value] ?? 0) + 1;
const orderedTags = Object.fromEntries(Object.entries(tag_counts).sort((a, b) => b[1] - a[1]));

const EXPECT_RECORDS = 959;
const EXPECT_TAGS = 8;
// NINE TAGS ARE DECLARED AND EIGHT OCCUR, AND THE NINTH IS NAMED RATHER THAN LEFT AS A GAP.
// adapters/clickup/derive-property-records.mjs declares eight prefixes plus the no-prefix tag.
// `irs433a` is the one no live property carries — 59-A's correction, and the same fact
// adapters/clickup/assert-prefix-not-provenance.mjs asserts as [A5] on every sweep. So the
// check is not "nine tags": it is EIGHT tags, every one drawn from the declared vocabulary,
// and the absent one being exactly the one already known and asserted absent. A ninth tag
// appearing, or a DIFFERENT one going missing, is a STOP.
const declaredTags = [...PREFIXES, NO_PREFIX_TAG];
const produced = Object.keys(orderedTags);
const undeclared = produced.filter((t) => !declaredTags.includes(t));
const absent = declaredTags.filter((t) => !produced.includes(t));
const tagSum = Object.values(orderedTags).reduce((n, v) => n + v, 0);
const stops = [];
if (records.length !== EXPECT_RECORDS)
  stops.push(`record_count is ${records.length} and the specification states ${EXPECT_RECORDS}. A count is not reconciled by adjusting it: the portal has changed, or the population rule has, and which of those it is has to be established before this file is written.`);
if (tagSum !== records.length)
  stops.push(`the tag counts sum to ${tagSum} against a record count of ${records.length}, so the prefix partition is not total.`);
if (produced.length !== EXPECT_TAGS)
  stops.push(`${produced.length} distinct prefix tag(s) were produced and ${EXPECT_TAGS} are expected: ${produced.join(', ')}`);
if (undeclared.length)
  stops.push(`tag(s) not in the declared vocabulary: ${undeclared.join(', ')}. The vocabulary is adapters/clickup/derive-property-records.mjs PREFIXES plus "${NO_PREFIX_TAG}".`);
if (absent.length !== 1 || absent[0] !== 'irs433a')
  stops.push(`the declared tag(s) that no live property carries are [${absent.join(', ')}], and the only one that should be absent is irs433a — the prefix 59-A established no live property uses, asserted as [A5] by adapters/clickup/assert-prefix-not-provenance.mjs. A different absence means a whole prefix's population has gone.`);
if (stops.length) {
  console.error(`STOP — nothing written. ${stops.length} problem(s):`);
  for (const s of stops) console.error(`  ${s}`);
  stop(2);
}

let commit = 'unknown';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
catch (e) {
  if (isStop(e)) throw e;
  console.error(`STOP — git rev-parse HEAD failed (${e.message}). generated_from_commit is what makes every derived value in this file re-checkable against the tree that produced it, and "unknown" would be a blank in a file whose whole rule is that nothing is blank.`);
  stop(3);
}

const header = {
  generated_at: new Date().toISOString(),
  generated_from_commit: commit,
  record_count: records.length,
  body_sha256: bodyDigest(records),
  serialisation_rule: SERIALISATION_RULE,
  population_rule: `Every custom contact property on HubSpot portal ${portalId} with hubspotDefined === false and archived === false, exactly as /crm/v3/properties/contacts returned it on this run — ${records.length} of them, nothing filtered by prefix, nothing normalised; EXCLUDED are the ${live.length - custom.length} HubSpot-defined properties on the same object and the ${archivedCustom} archived custom properties, and no property VALUE or contact record is read at all because only the schema endpoint is called. Derived per run, never typed ([R-07]).`,
  tag_counts: orderedTags,
};

const doc = { header, records };

// ── write, then RE-READ, then render from the bytes that landed ─────────────────────────
writeFileSync(`${OUT}.json`, JSON.stringify(doc, null, 1) + '\n');
const json = readFileSync(`${OUT}.json`, 'utf8');
const reread = JSON.parse(json);

const md = renderMarkdown(reread);
writeFileSync(`${OUT}.md`, md);
const csv = renderCsv(reread);
writeFileSync(`${OUT}.csv`, csv);
writeFileSync(`${OUT}.sha256`, renderDigests(reread, json, md, csv));

const batches = batchesOf(records);
console.log(`header: record_count ${header.record_count}, body_sha256 ${header.body_sha256.slice(0, 16)}…, from commit ${commit.slice(0, 7)}`);
console.log(`tag_counts (${Object.keys(orderedTags).length}, summing to ${tagSum}): ${Object.entries(orderedTags).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`name containment: ${records.filter((r) => r.name_contained_in_other).length} name(s) are a strict substring of at least one other`);
console.log(`wrote ${OUT}.json (${json.length} bytes), .md (${md.length}), .csv (${csv.length}), .sha256 — ${batches.length} batch(es) of ${BATCH_SIZE}, last carries ${batches[batches.length - 1].length}`);
console.log('Now run: node adapters/hubspot/check-cf-mirror-export.mjs');
