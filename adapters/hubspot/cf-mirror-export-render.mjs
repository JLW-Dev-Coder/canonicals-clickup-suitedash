// cf-mirror-export-render.mjs — the canonical serialisation, the markdown and CSV renderings,
// and the digest file, in ONE place.
//
// WHY ONE MODULE. The renderings are GENERATED FROM the JSON so they cannot drift from it, and
// that is only true if the BUILDER and the CHECKER render through the same code: two renderers
// that agree today are two renderers ([R-39]). adapters/hubspot/build-cf-mirror-export.mjs
// writes the files with these functions and adapters/hubspot/check-cf-mirror-export.mjs
// re-renders with the same ones and refuses any difference.
//
// [R-19] GENERATOR DECLARATION: this module writes nothing. It renders.

import { createHash } from 'node:crypto';

export const BATCH_SIZE = 50;
export const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

// ── THE CANONICAL SERIALISATION ─────────────────────────────────────────────────────────
//
// `header.body_sha256` is a digest of the `records` array, and a digest is only a pin if the
// bytes it covers are reproducible. JSON.stringify preserves INSERTION ORDER of keys, so the
// same 959 records built by a later version of the builder with one key moved would serialise
// differently and the digest would disagree over a difference that is not a difference. So the
// digest is taken over a canonical form: every object's keys sorted, arrays in their own order
// (which IS significant — option order is part of a property's definition), and no whitespace.
//
// The rule is written into the header as `serialisation_rule` so a reader can reproduce it
// without reading this file, and the checker recomputes through THIS function so the rule and
// the practice cannot drift.
export const SERIALISATION_RULE =
  'body_sha256 = sha256(utf8(canonical(records))), where canonical() emits JSON with every object\'s keys sorted by code unit, arrays left in their own order (option order is part of a property definition and is never sorted), no insignificant whitespace, and no trailing newline.';

export const canonical = (v) => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  const keys = Object.keys(v).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
};

export const bodyDigest = (records) => sha256(canonical(records));

export const batchBegin = (n, total, from, to, count) =>
  `===== BATCH ${String(n).padStart(2, '0')} of ${total} | records ${from}-${to} of ${count} | BEGIN =====`;
export const batchEnd = (n, total) =>
  `===== BATCH ${String(n).padStart(2, '0')} of ${total} | END =====`;

export function batchesOf(records) {
  const out = [];
  for (let i = 0; i < records.length; i += BATCH_SIZE) out.push(records.slice(i, i + BATCH_SIZE));
  return out;
}

// ── rendering a derived field ───────────────────────────────────────────────────────────
// A derived field is {value, source} or {not_derivable:true, _reason}. NOTHING is ever blank:
// a value nobody could work out prints as the reason nobody could. That is [R-07] applied to a
// field rather than to a count.
export const isND = (f) => !!(f && f.not_derivable === true);

function d(f) {
  if (!f) return '*not derivable — the field is absent from the record.*';
  if (isND(f)) return `*not derivable — ${f._reason}*`;
  const v = f.value;
  const shown = Array.isArray(v) ? (v.length ? v.map((x) => `\`${x}\``).join(', ') : '*(empty)*') : `\`${v}\``;
  return `${shown}  \n  <sub>source: ${f.source}</sub>`;
}

function renderRecord(r, index) {
  const L = [];
  L.push(`#### ${index}. \`${r.name}\``, '');
  L.push('**Portal definition — verbatim, unnormalised.**', '');
  L.push(`- internal name: \`${r.name}\``);
  L.push(`- label: ${r.label === null ? '*the portal returns no label.*' : JSON.stringify(r.label)}`);
  L.push(`- type / fieldType: \`${r.type}\` / \`${r.fieldType}\``);
  L.push(`- group: \`${r.groupName}\``);
  L.push(`- createdAt: ${r.createdAt}`);
  L.push(`- archived: \`${r.archived}\` · calculated: \`${r.calculated}\` · hasUniqueValue: \`${r.hasUniqueValue}\` · hidden: \`${r.hidden}\` · formField: \`${r.formField}\``);
  L.push(`- description_present: \`${r.description_present}\``);
  L.push(`- description: ${r.description === '' ? '*the portal holds an empty description. Empty and absent are different facts; description_present above says which.*' : JSON.stringify(r.description)}`);
  L.push('');
  if (r.options.length) {
    L.push(`**Options — ${r.options.length}, IN PORTAL ORDER. The order is part of the definition; recreating them in another order changes the field. Both label and value are given: a migration reproducing only the labels stores different bytes.**`, '');
    r.options.forEach((o, i) => L.push(`- [${i + 1}] label ${JSON.stringify(o.label)} · value ${JSON.stringify(o.value)} · displayOrder \`${o.displayOrder}\`${o.hidden ? ' · HIDDEN' : ''}`));
  } else {
    L.push(`**Options — none.** This property is \`${r.type}\`/\`${r.fieldType}\`, which carries no option list. An absence, not an omission.`);
  }
  L.push('');
  L.push('**Derived — this repo is the authority, and each value names the file it came from.**', '');
  L.push(`- created_by_form: ${d(r.created_by_form)}`);
  L.push(`- bound_by_forms: ${d(r.bound_by_forms)}`);
  L.push(`- backbone_key: ${d(r.backbone_key)}`);
  L.push(`- reuse_status: ${isND(r.reuse_status) ? `*not derivable — ${r.reuse_status._reason}*` : `is_reuse \`${r.reuse_status.value.is_reuse}\`${r.reuse_status.value.by_forms.length ? `, by ${r.reuse_status.value.by_forms.map((x) => `\`${x}\``).join(', ')}` : ''}${r.reuse_status.value.reuse_of.length ? `, of ${r.reuse_status.value.reuse_of.map((x) => `\`${x}\``).join(', ')}` : ''}  \n  <sub>source: ${r.reuse_status.source}</sub>`}`);
  L.push(`- prefix_tag: \`${r.prefix_tag.value}\`  \n  <sub>source: ${r.prefix_tag.source}</sub>`);
  L.push(`- status_for_mirror: \`${r.status_for_mirror.value}\`  \n  <sub>source: ${r.status_for_mirror.source}</sub>`);
  if (r.no_prefix_class !== null)
    L.push(`- no_prefix_class: **${r.no_prefix_class.value.class}** (${r.no_prefix_class.value.label}) — ${r.no_prefix_class.value.why}  \n  <sub>source: ${r.no_prefix_class.source}</sub>`);
  L.push(`- name_contained_in_other: \`${r.name_contained_in_other}\`${r.name_contained_in_other ? ` — contained in ${r.containing_names.map((x) => `\`${x}\``).join(', ')}` : ''}`);
  L.push('');
  L.push('**Crosswalk classification and the recorded reason.**', '');
  if (isND(r.crosswalk_class)) {
    L.push(`*not derivable — ${r.crosswalk_class._reason}*`);
  } else {
    const reasons = isND(r.crosswalk_reason) ? [] : r.crosswalk_reason.value;
    for (const c of r.crosswalk_class.value) {
      const rn = reasons.find((x) => x.form === c.form) ?? null;
      L.push(`- **${c.form}** — class ${c.class === null ? `*not derivable — ${c.class_not_derivable_reason}*` : `\`${c.class}\``} · entry ${c.entry === null ? '*none declared*' : `\`${c.entry}\``} · source ${c.source ?? '*no crosswalk file for this form*'}`);
      L.push(`    - reason: ${!rn || rn.reason === null ? `*not derivable — ${rn ? rn.reason_not_derivable_reason : 'no reason row for this form'}*` : rn.reason}`);
      if (rn && rn.reuse_reason) L.push(`    - reuse reason: ${rn.reuse_reason}`);
      if (c.arguable) L.push(`    - **arguable**: ${c.arguable}`);
    }
  }
  L.push('');
  L.push('**Divergence.**', '');
  if (r.divergence === null) {
    L.push('None. Every value this repo declares for this property agrees with the live portal.');
  } else {
    L.push(`**${r.divergence.side}** — ruling \`${r.divergence.ruling}\`. ${r.divergence.ruling_note}`, '');
    for (const it of r.divergence.kinds_detail) L.push(`- \`${it.kind}\` — ${it.detail}`);
  }
  L.push('', '---', '');
  return L.join('\n');
}

export function renderMarkdown(doc) {
  const h = doc.header;
  const batches = batchesOf(doc.records);
  const L = [];
  L.push('# HubSpot custom contact properties — mirror export');
  L.push('');
  L.push(`Generated at ${h.generated_at} from commit \`${h.generated_from_commit}\`.`);
  L.push('');
  L.push(`**${h.record_count} records**, rendered in **${batches.length} batches of ${BATCH_SIZE}** (the last carries ${batches[batches.length - 1].length}) so a batch can be handed to ClickUp Brain 2 and re-handed on its own if it fails.`);
  L.push('');
  L.push(`Population rule: ${h.population_rule}`);
  L.push('');
  L.push('This markdown is GENERATED FROM `adapters/hubspot/cf-mirror-export.json` and cannot drift from it: `adapters/hubspot/check-cf-mirror-export.mjs` re-renders it on every `npm run sweeps` and refuses any difference. The JSON is the source of truth; where a value is byte-sensitive — leading or trailing whitespace especially — read the JSON, not a description rendered from it.');
  L.push('');
  L.push(`Prefix tags, disjoint and total over the ${h.record_count}: ${Object.entries(h.tag_counts).map(([k, v]) => `\`${k}\`=${v}`).join(' · ')}.`);
  L.push('');
  L.push('---');
  L.push('');
  batches.forEach((b, i) => {
    const n = i + 1, from = i * BATCH_SIZE + 1, to = i * BATCH_SIZE + b.length;
    L.push(batchBegin(n, batches.length, from, to, h.record_count));
    L.push('');
    L.push(`## Batch ${n} of ${batches.length} — records ${from}–${to} of ${h.record_count} (${b.length} in this batch)`);
    L.push('');
    b.forEach((r, j) => L.push(renderRecord(r, from + j)));
    L.push(batchEnd(n, batches.length));
    L.push('');
  });
  return L.join('\n');
}

// ── CSV, RFC 4180 ────────────────────────────────────────────────────────────────────────
// Quoting is not optional here and was measured, not assumed: hundreds of descriptions contain
// a comma and several labels contain a newline or a double quote.
const q = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
// List-valued columns are pipe-delimited. A literal pipe is escaped as \| and a literal
// backslash as \\, so the column stays reversible if one ever appears.
const pipe = (arr) => (arr ?? []).map((x) => String(x).replace(/\\/g, '\\\\').replace(/\|/g, '\\|')).join('|');

export const CSV_COLUMNS = [
  'name', 'label', 'type', 'fieldType', 'groupName', 'description', 'description_present',
  'options_count', 'option_labels', 'option_values', 'option_display_orders',
  'createdAt', 'archived', 'calculated', 'hasUniqueValue', 'hidden', 'formField',
  'created_by_form', 'created_by_form_source', 'bound_by_forms', 'bound_by_forms_source',
  'crosswalk_class', 'crosswalk_reason', 'backbone_key', 'reuse_is', 'reuse_by_forms', 'reuse_of',
  'prefix_tag', 'no_prefix_class', 'divergence', 'divergence_side', 'divergence_ruling',
  'status_for_mirror', 'name_contained_in_other', 'containing_names',
];

const val = (f) => (isND(f) ? `NOT DERIVABLE: ${f._reason}` : f.value);
const src = (f) => (isND(f) ? `NOT DERIVABLE: ${f._reason}` : f.source);

export function renderCsv(doc) {
  const rows = [CSV_COLUMNS.join(',')];
  for (const r of doc.records) {
    const cw = isND(r.crosswalk_class) ? [] : r.crosswalk_class.value;
    const cr = isND(r.crosswalk_reason) ? [] : r.crosswalk_reason.value;
    const reuse = isND(r.reuse_status) ? null : r.reuse_status.value;
    rows.push([
      r.name, r.label, r.type, r.fieldType, r.groupName, r.description, r.description_present,
      r.options.length,
      pipe(r.options.map((o) => o.label)), pipe(r.options.map((o) => o.value)), pipe(r.options.map((o) => o.displayOrder)),
      r.createdAt, r.archived, r.calculated, r.hasUniqueValue, r.hidden, r.formField,
      isND(r.created_by_form) ? '' : r.created_by_form.value, src(r.created_by_form),
      isND(r.bound_by_forms) ? '' : pipe(r.bound_by_forms.value), src(r.bound_by_forms),
      pipe(cw.map((c) => `${c.form}=${c.class ?? 'NOT-DERIVABLE'}`)),
      pipe(cr.map((c) => `${c.form}=${(c.reason ?? `NOT DERIVABLE: ${c.reason_not_derivable_reason}`).replace(/\s+/g, ' ')}`)),
      isND(r.backbone_key) ? `NOT DERIVABLE: ${r.backbone_key._reason}` : r.backbone_key.value,
      reuse ? reuse.is_reuse : '', pipe(reuse ? reuse.by_forms : []), pipe(reuse ? reuse.reuse_of : []),
      r.prefix_tag.value,
      r.no_prefix_class === null ? '' : `${r.no_prefix_class.value.class}:${r.no_prefix_class.value.label}`,
      pipe(r.divergence ? r.divergence.kinds : []),
      r.divergence ? r.divergence.side : '', r.divergence ? r.divergence.ruling : '',
      r.status_for_mirror.value,
      r.name_contained_in_other, pipe(r.containing_names),
    ].map(q).join(','));
  }
  return rows.join('\n') + '\n';
}

// ── the digest file ──────────────────────────────────────────────────────────────────────
// [R-37]: a pin nobody checks is a pin in name only, so every digest here is recomputed by
// check-cf-mirror-export.mjs on every sweep rather than written once and admired.
export function renderDigests(doc, json, md, csv) {
  const batches = batchesOf(doc.records);
  const h = doc.header;
  const L = [];
  L.push('# cf-mirror-export digests');
  L.push('#');
  L.push('# Recomputed and compared by adapters/hubspot/check-cf-mirror-export.mjs on every');
  L.push('# `npm run sweeps`. A digest nobody recomputes is a pin in name only ([R-37]).');
  L.push('#');
  L.push('# A BATCH digest covers the text strictly BETWEEN its BEGIN and END delimiter lines,');
  L.push('# exclusive, joined with newlines — so a batch can be handed to B2 on its own and');
  L.push('# checked on its own.');
  L.push('#');
  L.push('# The .md and .csv digests are here in addition to the JSON one the specification');
  L.push('# requires. They cost nothing and they pin the two files a reader is most likely to');
  L.push('# open and edit by hand.');
  L.push('');
  L.push(`sha256  cf-mirror-export.json  ${sha256(json)}`);
  L.push(`sha256  cf-mirror-export.md    ${sha256(md)}`);
  L.push(`sha256  cf-mirror-export.csv   ${sha256(csv)}`);
  L.push('');
  const lines = md.split('\n');
  batches.forEach((b, i) => {
    const n = i + 1;
    const bi = lines.indexOf(batchBegin(n, batches.length, i * BATCH_SIZE + 1, i * BATCH_SIZE + b.length, h.record_count));
    const ei = lines.indexOf(batchEnd(n, batches.length));
    const body = lines.slice(bi + 1, ei).join('\n');
    L.push(`sha256  batch ${String(n).padStart(2, '0')} of ${batches.length} (${b.length} record(s))  ${sha256(body)}`);
  });
  L.push('');
  return L.join('\n');
}
