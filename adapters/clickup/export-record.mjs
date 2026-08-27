// export-record.mjs — the ONE definition of an export record, per item I of prompt 59-A.
//
// WHAT AN EXPORT RECORD IS FOR
// ----------------------------
// ClickUp Brain 2 builds the mirror tasks from this. So a field omitted here is a field that
// comes out wrong on the other side, and a field GUESSED here is worse than one left open:
// nothing in this shape is ever blank. A value that cannot be derived is an object saying so
// and giving the reason, which is [R-07] applied to a field rather than to a count.
//
// THE TWO HALVES ARE KEPT APART ON PURPOSE
// ----------------------------------------
//   `portal`  — verbatim, unnormalised, exactly what the portal returned. No trimming, no
//               sorting, no summarising, no truncation. `description` is carried even when it
//               is the empty string, and `description_present` says which of "empty" and
//               "absent" it was, because those are different facts about the portal.
//   `derived` — this repo's binding and classification, each with its SOURCE named.
//
// NOTHING IN `derived` MAY BE INFERRED FROM THE NAME PREFIX — item B. The prefix is a lexical
// fact about a string; `irs433 = 253` is not "433-A created 253 properties", and the whole
// reason the shared prefix is `irs433_` rather than `irs433a_` is that the backbone is shared.
// `prefix_tag` is carried for filtering and is never read as provenance.
// adapters/clickup/assert-prefix-not-provenance.mjs enforces this over the live population.
//
// [R-19] GENERATOR DECLARATION: this module writes nothing. It builds records.

import { deriveRecord, prefixTag, NO_PREFIX_TAG } from './derive-property-records.mjs';
import { ABSENCE_KINDS } from './divergence-kinds.mjs';
import { classifyRow } from './no-prefix-classes.mjs';

const NOT_DERIVABLE = (reason) => ({ derivable: false, reason });

// A derived value always carries where it came from. `source` is a path in this tree, so a
// reader can go and check it; a derived value with no checkable source is not derived, it is
// asserted.
const derived = (value, source) => ({ derivable: true, value, source });

export function buildExportRecord(p, art, ctx) {
  const r = deriveRecord(p, art);              // the binding/classification derivation
  const files = [...new Set(r.binding.rows.map(x => x.file))].map(f => `adapters/hubspot/${f}`);
  const src = files.length ? files.join(' + ') : null;

  // ── created_by_form ──────────────────────────────────────────────────────────────────
  const c = r.binding.created_by_form;
  const created_by_form = (c && c.derivable !== false && 'value' in c)
    ? derived(c.value, `${src} — ${c.basis}`)
    : NOT_DERIVABLE(c?.reason ?? 'no field row in this repo names this property, so nothing here claims a form created it.');

  // ── bound_by_forms ───────────────────────────────────────────────────────────────────
  const bound_by_forms = r.binding.bound_by.length
    ? derived(r.binding.bound_by, `${src} — every field file holding a row for this internal name`)
    : NOT_DERIVABLE('no field file in this repo holds a row for this property, so no form here binds it.');

  // ── crosswalk, one entry per binding form ────────────────────────────────────────────
  const crosswalk = r.classifications.length
    ? derived(r.classifications.map(x => ({
      form: x.form,
      class: (x.classification && x.classification.derivable === false) ? null : x.classification,
      class_not_derivable_reason: (x.classification && x.classification.derivable === false) ? x.classification.reason : null,
      reason: (x.reason && x.reason.derivable === false) ? null : x.reason,
      reason_not_derivable_reason: (x.reason && x.reason.derivable === false) ? x.reason.reason : null,
      reuse_reason: x.reuse_reason ?? null,
      entry: (x.entry && x.entry.derivable === false) ? null : x.entry,
      arguable: x.arguable ?? null,
      source: x.source_file ? `adapters/hubspot/${x.source_file}` : null,
    })), 'adapters/hubspot/crosswalk.<form>.json, joined on the field row key')
    : NOT_DERIVABLE('no field row names this property, so no crosswalk in this repo classifies it.');

  // ── backbone_key ─────────────────────────────────────────────────────────────────────
  const b = r.backbone_key;
  const backbone_key = (b && b.derivable !== false && 'value' in b)
    ? derived(b.value, `${src} — ${b.basis}`)
    : NOT_DERIVABLE(b?.reason ?? 'not recorded.');

  // ── reuse_status ─────────────────────────────────────────────────────────────────────
  const reuse_status = derived({
    is_reuse: r.reuse.is,
    by_forms: r.reuse.by,
    reuse_of: r.reuse.of,
  }, src ? `${src} — rows whose scope is "reuse" or which declare reuse_of` : 'no field row names this property, so it is a reuse of nothing here');

  // ── no_prefix_class — item C, only for the properties that have no declared prefix ───
  const tag = prefixTag(p.name);
  const no_prefix_class = tag === NO_PREFIX_TAG
    ? (() => { const k = classifyRow(p, ctx.classifyCtx); return { class: k.cls, label: k.label, why: k.why, mentioned_in_repo: k.named }; })()
    : null;

  // ── divergence — item D. An ABSENCE kind is NOT resolved here. ───────────────────────
  const kinds = [...new Set(r.divergences.map(d => d.kind))];
  const hasAbsence = kinds.some(k => ABSENCE_KINDS.has(k));
  const divergence = kinds.length ? {
    kinds,
    side: hasAbsence ? 'ABSENCE' : 'DISAGREEMENT',
    // The 59 ruling settles a DISAGREEMENT and does not reach an ABSENCE: where one side has no
    // entry, there is no authority to consult and no side is picked here. OWED means a person
    // rules, not that the tool failed.
    ruling: hasAbsence ? 'OWED' : 'GOVERNED-BY-P59',
    ruling_note: hasAbsence
      ? 'One side carries no entry at all. Prompt 59 s ruling presumes both sides have one and does not resolve this; 59-A item D records that gap. No side is picked, and the derived fields above already read not-derivable with their reasons.'
      : 'Both sides carry an entry and differ. Prompt 59 governs: the portal is authority for definition, adapters/hubspot/fields.*.json for binding and classification. Recorded, not reconciled.',
    items: r.divergences.map(d => ({ kind: d.kind, detail: d.detail })),
  } : null;

  return {
    name: p.name,
    portal: {
      label: p.label ?? null,
      type: p.type ?? null,
      fieldType: p.fieldType ?? null,
      groupName: p.groupName ?? null,
      description: p.description ?? '',
      description_present: Object.prototype.hasOwnProperty.call(p, 'description') && p.description != null && p.description !== '',
      options: (p.options ?? []).map(o => ({
        label: o.label, value: o.value, displayOrder: o.displayOrder ?? null, hidden: o.hidden ?? false,
      })),
      options_count: (p.options ?? []).length,
      createdAt: p.createdAt ?? null,
      archived: p.archived ?? false,
      calculated: p.calculated ?? false,
      hasUniqueValue: p.hasUniqueValue ?? false,
      hidden: p.hidden ?? false,
      formField: p.formField ?? false,
    },
    derived: {
      created_by_form, bound_by_forms, crosswalk, backbone_key, reuse_status,
      prefix_tag: tag,
      prefix_tag_note: 'A LEXICAL FACT ABOUT THE INTERNAL NAME, for filtering. NOT a provenance claim: read created_by_form for that.',
      no_prefix_class,
      divergence,
      status_for_mirror: r.status,
      status_basis: r.deprecated
        ? 'the portal description marks this property deprecated'
        : 'the portal description carries no deprecation marker',
    },
  };
}
