// render-description.mjs — the body of one ClickUp task, from one derived property record.
//
// WHAT THIS IS WRITTEN TO BE
// --------------------------
// ClickUp Brain 2 can create custom fields to specification, and these tasks BECOME that
// specification. So the target is sufficiency to RECREATE the field somewhere else, not
// readability: a section omitted here is a field that comes out wrong on the other side.
// Everything the portal holds about the definition is printed, in the portal's own words,
// and everything this repo holds about the binding is printed beside it and kept separate.
//
// NOTHING IS EVER LEFT BLANK. A value that cannot be derived prints as
//   *not derivable — <the reason>*
// which is [R-07]'s rule applied to a field rather than to a count: an empty cell reads as
// "there is nothing here", and "nobody could work it out and here is why" is a different fact.
//
// VERBATIM MEANS VERBATIM. The portal description goes into a fenced block whose fence is
// computed to be longer than the longest backtick run in the text, so no description can close
// its own fence, and no "> " is prepended to bytes that a migration will compare.
//
// [R-19] GENERATOR DECLARATION: this module is imported by
// adapters/clickup/render-sample-records.mjs and writes nothing to disk by itself.

export const RENDERER_VERSION = 'p59.r2';

// ── WHAT CLICKUP DOES TO A BODY, MEASURED ────────────────────────────────────────────────
// adapters/clickup/cu-write-probe.mjs sent a body containing a heading, bold, inline code, an
// ordered list and a fenced block, and printed exactly what came back. ClickUp ACCEPTS
// `markdown_description` and stores it as rich text; on read it returns `description` and
// `text_content` as the PLAIN-TEXT RENDERING — `#`, `**`, backticks, `- `, `1. ` and the fence
// markers are all gone, and everything between them survives byte for byte, em dashes, middots
// and quotes included. Nothing is truncated: a 49,693-char body came back as 46,048 chars of
// content with only the syntax removed.
//
// TWO CONSEQUENCES, AND THEY ARE WHY THIS FILE IS r2 RATHER THAN r1:
//
//   1. ORDINAL LIST MARKERS DO NOT SURVIVE. The first draft numbered the options with a
//      markdown ordered list, so the option INDEX — the thing this file goes out of its way to
//      say is significant — was the one part of the option line that a reader of the API would
//      not get back. The index is now written as literal `[n]` text, which is not syntax and
//      cannot be normalised away. Order is stated AND numbered in both renderings.
//
//   2. A COMPARISON AGAINST THE SENT BYTES IS MEANINGLESS. Verification compares MARK-STRIPPED
//      projections, via stripMarks() below, which both the probe and --verify import from here
//      so the two cannot drift apart into disagreeing about what survival means.
//
// No raw HTML is emitted anywhere in this file. What ClickUp does with an HTML tag inside a
// markdown body was not measured, and an unmeasured construct is not one to put 959 tasks on.

// The projection a token and a returned body are compared IN. Removes the inline syntax
// ClickUp strips and collapses whitespace; changes nothing else.
//
// UNDERSCORE IS DELIBERATELY NOT STRIPPED. It is markdown emphasis syntax, but it is also in
// the middle of every property name this list exists to record — `irs433_tp_ssn_itin` — and a
// projection that removes it would compare `irs433tpssnitin` on both sides and go on agreeing
// with itself if ClickUp ever did mangle one. The probe measured underscores surviving. If
// that ever stops being true, --verify reports it as a fault, which is the point: a masked
// difference is worse than a detected one. Same reasoning as [R-31] — prefer the assertion
// that would notice over the one tuned to the current reading.
export function stripMarks(s) {
  return String(s).replace(/[`*#]/g, '').replace(/\s+/g, ' ').trim();
}

// A whole LINE, as ClickUp renders it: the leading list marker is syntax and goes too. Applied
// only where the thing being compared is known to be a line — never to a bare token, where a
// leading "- " could be content.
export function stripLine(s) {
  return stripMarks(String(s).replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''));
}

function fenceFor(text) {
  let longest = 0;
  for (const m of String(text).matchAll(/`+/g)) longest = Math.max(longest, m[0].length);
  return '`'.repeat(Math.max(3, longest + 1));
}

// A derived value is either {value, basis} or {derivable:false, reason}.
function val(v, { code = false } = {}) {
  if (v == null) return '*not derivable — no source in this tree records it.*';
  if (typeof v === 'object' && v.derivable === false) return `*not derivable — ${v.reason}*`;
  if (typeof v === 'object' && 'value' in v) return code ? `\`${v.value}\`` : String(v.value);
  return code ? `\`${v}\`` : String(v);
}

function basis(v) {
  return (v && typeof v === 'object' && v.basis) ? `\n    - basis: ${v.basis}` : '';
}

export function renderDescription(rec, ctx) {
  const p = rec.portal;
  const L = [];

  L.push(`**HubSpot custom contact property — mirrored record.**`);
  L.push('');
  L.push(`This task IS the record for one live HubSpot custom property on the contact object. It is written to be sufficient to recreate the field elsewhere. The **portal** is the authority for the definition below; this repo's **field files and crosswalks** are the authority for the binding and classification below. Where the two disagree the disagreement is printed under *Divergences* and is not reconciled here.`);
  L.push('');
  L.push(`Portal \`${ctx.portalId}\` · rendered ${ctx.runIso} from \`adapters/hubspot/cf-mirror-export.json\` · renderer \`${RENDERER_VERSION}\` · keyed on this record's internal name.`);
  L.push('');

  // ── 1. definition ───────────────────────────────────────────────────────────────────────
  L.push('---');
  L.push('');
  L.push('## 1. Definition — the portal is the authority');
  L.push('');
  L.push(`- **internal name** — \`${rec.hs_name}\``);
  L.push(`- **label** — ${p.label == null ? '*not derivable — the portal returns no label for this property.*' : p.label}`);
  L.push(`- **type** — \`${val(p.type)}\``);
  L.push(`- **fieldType** — \`${val(p.fieldType)}\``);
  L.push(`- **group** — \`${val(p.groupName)}\`${rec.group_label_in_repo ? ` (this repo labels that group "${rec.group_label_in_repo}")` : ''}`);
  L.push(`- **created** — ${p.createdAt ?? '*not derivable — the portal returns no createdAt.*'}`);
  L.push(`- **displayOrder** — ${p.displayOrder == null ? '*not derivable — the portal returns none.*' : `\`${p.displayOrder}\``}`);
  L.push(`- **hasUniqueValue** — ${p.hasUniqueValue == null ? '*not derivable.*' : `\`${p.hasUniqueValue}\``}`);
  L.push(`- **hidden** — ${p.hidden == null ? '*not derivable.*' : `\`${p.hidden}\``}`);
  L.push(`- **formField** — ${p.formField == null ? '*not derivable.*' : `\`${p.formField}\``}`);
  L.push(`- **calculated** — ${p.calculated == null ? '*not derivable.*' : `\`${p.calculated}\``}`);
  L.push(`- **readOnlyDefinition** — ${p.readOnlyDefinition == null ? '*not derivable — the portal returns no modificationMetadata for this property.*' : `\`${p.readOnlyDefinition}\``}`);
  L.push('');
  L.push('### Portal description, verbatim');
  L.push('');
  if (p.description == null || p.description === '') {
    L.push(`*not derivable — the portal holds no description for this property. The field is live and unannotated; that is a fact about the portal, not a gap in this record.*`);
  } else {
    const f = fenceFor(p.description);
    L.push(`${f}text`);
    L.push(p.description);
    L.push(f);
  }
  L.push('');

  // ── 2. options ──────────────────────────────────────────────────────────────────────────
  L.push('---');
  L.push('');
  const opts = p.options ?? [];
  if (p.type === 'enumeration' || opts.length) {
    L.push(`## 2. Options — ${opts.length}, **and the order is significant**`);
    L.push('');
    if (!opts.length) {
      L.push('*not derivable — the portal reports this property as an enumeration but returns an empty option list. A migration must not infer one; the option set has to come from whoever defined it.*');
    } else {
      L.push('The position below is the position the portal returns and is part of the definition: HubSpot orders a select by `displayOrder`, and recreating these in another order changes the field. Both the **label** (what a person sees) and the **value** (what is stored) are given; a migration that reproduces only the labels produces a field that stores different bytes.');
      L.push('');
      // `[n]` is literal text, not an ordinal list marker: a markdown `1.` is syntax and
      // ClickUp strips it on read, which would drop the index this section calls significant.
      opts.forEach((o, i) => {
        const bits = [`label \`${o.label}\``, `value \`${o.value}\``];
        if (o.displayOrder != null) bits.push(`displayOrder \`${o.displayOrder}\``);
        if (o.hidden) bits.push('HIDDEN');
        L.push(`- [${i + 1}] ${bits.join(' · ')}`);
      });
    }
  } else {
    L.push('## 2. Options');
    L.push('');
    L.push(`*none — this property is \`${val(p.type)}\`/\`${val(p.fieldType)}\`, which is not an enumeration. The portal returns no option list, and that is an absence rather than an omission.*`);
  }
  L.push('');

  // ── 3. binding ──────────────────────────────────────────────────────────────────────────
  L.push('---');
  L.push('');
  L.push('## 3. Binding — this repo\'s field files are the authority');
  L.push('');
  L.push('Derived from the rows in `adapters/hubspot/fields.*.json`, **not** from the name prefix. Under `[R-06]` a prefix records which form created a name and says nothing about which forms own or bind it, and under `[R-08]` a leaf name is evidence of nothing on its own.');
  L.push('');
  L.push(`- **created by** — ${val(rec.binding.created_by_form, { code: true })}${basis(rec.binding.created_by_form)}`);
  L.push(`- **bound by** — ${rec.binding.bound_by.length ? rec.binding.bound_by.map(f => `\`${f}\``).join(', ') + ` (${rec.binding.bound_by.length} form${rec.binding.bound_by.length === 1 ? '' : 's'})` : '*not derivable — no field file in this repo holds a row for this property, so no form here binds it.*'}`);
  L.push(`- **is a reuse** — ${rec.reuse.is ? `yes, by ${rec.reuse.by.map(f => `\`${f}\``).join(', ')}${rec.reuse.of.length ? `, declared as a reuse of ${rec.reuse.of.map(x => `\`${x}\``).join(', ')}` : ''}` : 'no — no field row for this property is a reuse row.'}`);
  L.push(`- **backbone key** — ${val(rec.backbone_key, { code: true })}${basis(rec.backbone_key)}`);
  L.push('');
  if (rec.binding.rows.length) {
    L.push('**Every field row that names this property:**');
    L.push('');
    for (const r of rec.binding.rows) {
      L.push(`- \`${r.file}\` · form \`${r.form}\` · input key \`${r.key}\``);
      L.push(`    - crosswalk entry — ${r.entry ?? '*not derivable — the row declares none.*'}`);
      L.push(`    - scope — ${r.scope ? `\`${r.scope}\`` : '*not derivable — the row declares none.*'}`);
      L.push(`    - printed line — ${r.line_ref ?? '*not derivable — the row records no line reference. On a form whose map binds by cell rather than by printed line number that is expected.*'}`);
      L.push(`    - PII — ${r.pii == null ? '*not derivable — the row does not classify it.*' : (r.pii ? '**yes** — handle per the VLP PII rule' : 'no')}`);
      L.push(`    - type basis — ${r.type_basis ?? '*not derivable — the row records none.*'}`);
      L.push(`    - consumed by — ${r.consumed_by ?? '*not derivable — the row does not name a consumer. The fill engine for the form reads it by the input key above.*'}`);
    }
  } else {
    L.push('*No field row names this property. It is live on the portal and unbound by anything in this repo.*');
  }
  L.push('');

  // ── 4. classification ───────────────────────────────────────────────────────────────────
  L.push('---');
  L.push('');
  L.push('## 4. Crosswalk classification and the recorded reason');
  L.push('');
  if (!rec.classifications.length) {
    L.push('*not derivable — no field row names this property, so no crosswalk in this repo classifies it.*');
  } else {
    for (const c of rec.classifications) {
      L.push(`**${c.form}** — ${c.source_file ? `\`${c.source_file}\`` : 'no crosswalk file'}`);
      L.push('');
      L.push(`- classification — ${val(c.classification, { code: true })}`);
      L.push(`- entry — ${val(c.entry, { code: true })}`);
      L.push(`- recorded reason — ${typeof c.reason === 'object' && c.reason?.derivable === false ? `*not derivable — ${c.reason.reason}*` : c.reason}`);
      if (c.reuse_reason) L.push(`- recorded reuse reason — ${c.reuse_reason}`);
      if (c.arguable) L.push(`- **arguable** — ${c.arguable}`);
      L.push('');
    }
  }

  // ── 5. provenance ───────────────────────────────────────────────────────────────────────
  L.push('---');
  L.push('');
  L.push('## 5. Provenance — was this property created by this project?');
  L.push('');
  const verdict = rec.provenance.project_created ? 'Yes.' : 'No — it predates this project.';
  L.push(`**${verdict}** Two witnesses, independent in ORIGIN per \`[R-39]\` — one is written by this repo's derivers, the other by HubSpot at create time — so they corroborate rather than repeat each other.`);
  L.push('');
  L.push(`- witness 1 — field-file membership: ${rec.provenance.witnesses.field_file_membership}`);
  L.push(`- witness 2 — portal \`createdAt\`: ${rec.provenance.witnesses.portal_created_at ?? '*not derivable.*'}${ctx.projectEpochIso ? ` (this project's first provisioning run on this portal was ${ctx.projectEpochIso})` : ''}`);
  L.push('');
  L.push(`- **status set on this task** — \`${rec.status}\`, because the portal description ${rec.deprecated ? '**marks this property deprecated**' : 'carries no deprecation marker'}.`);
  L.push(`- **tag set on this task** — \`${rec.tag}\`${rec.tag === 'no-declared-prefix' ? ', because the internal name carries none of this project\'s declared prefixes' : ', derived from the internal name'}.`);
  L.push('');

  // ── 6. divergences ──────────────────────────────────────────────────────────────────────
  L.push('---');
  L.push('');
  L.push('## 6. Divergences between the portal and this repo');
  L.push('');
  if (!rec.divergences.length) {
    L.push('None. Every value this repo declares for this property agrees with what the portal returns.');
  } else {
    L.push(`**${rec.divergences.length}.** Each is a finding, not a formatting problem, and none is reconciled here.`);
    L.push('');
    for (const d of rec.divergences) L.push(`- **${d.kind}** — ${d.detail}`);
  }
  L.push('');

  return L.join('\n');
}
