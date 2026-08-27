// derive-property-records.mjs — turns the LIVE HubSpot contact-property set plus this repo's
// binding artefacts into one record per property, and reports every disagreement between the
// two.
//
// THE TWO AUTHORITIES, AND WHY THEY ARE KEPT APART
// ------------------------------------------------
// The PORTAL is the authority for DEFINITION — name, label, type, fieldType, group, options,
// description, created date. What is live is what a migration has to reproduce.
// The FIELD FILES and CROSSWALKS are the authority for BINDING and CLASSIFICATION — which form
// created a property, which forms bind it, what the crosswalk called it and why, what backbone
// key it sits on.
// Neither is corrected against the other. Where they disagree the disagreement is RECORDED as
// a divergence, because [R-02] makes a correction a claim and this tool is not in a position to
// make one: a portal description naming one form and a field file naming another is a finding
// for a person, not a formatting problem for a script.
//
// [R-07] EVERY COUNT HERE IS DERIVED. Nothing is typed. The form list is discovered from
// adapters/hubspot/fields.*.json; the population is whatever the portal returns.
//
// [R-19] GENERATOR DECLARATION: this module is imported by
// adapters/clickup/export-record.mjs and writes nothing to disk by itself.

import { readFileSync, readdirSync } from 'node:fs';

const HS_DIR = 'adapters/hubspot';

// ── the declared prefix vocabulary ───────────────────────────────────────────────────────
// Longest match first: irs433aoi must win over irs433a, and irs433boi over irs433b, or every
// 433-A(OIC) property tags as 433-A and the list filters to the wrong answer.
export const PREFIXES = ['irs433aoi', 'irs433boi', 'irs433a', 'irs433b', 'irs433d', 'irs433f', 'irs433', 'vlp'];
export const NO_PREFIX_TAG = 'no-declared-prefix';

export function prefixTag(name) {
  for (const p of PREFIXES) if (name.startsWith(p + '_')) return p;
  return NO_PREFIX_TAG;
}

const UNDERIVABLE = (reason) => ({ derivable: false, reason });

// ── load the repo-side authorities ───────────────────────────────────────────────────────
export function loadArtefacts() {
  const fieldFiles = readdirSync(HS_DIR).filter(f => /^fields\.[0-9a-z]+\.json$/.test(f)).sort();
  const forms = [];
  const rowsByName = new Map();          // hs_name -> [{form, file, row}]
  const groupLabel = new Map();          // group name -> label, as this repo declares it

  for (const file of fieldFiles) {
    const j = JSON.parse(readFileSync(`${HS_DIR}/${file}`, 'utf8'));
    // The form a field file speaks for is READ OUT OF THE FILE, never off its own filename:
    // fields.registry.json is named for nothing and declares meta.forms = ["vlp"].
    const declared = j.meta.form ? [j.meta.form] : (j.meta.forms ?? []);
    if (!declared.length) throw new Error(`${file} declares neither meta.form nor meta.forms — cannot say which form it binds`);
    for (const g of j.groups ?? []) groupLabel.set(g.name, g.label);
    for (const form of declared) {
      forms.push({ form, file, generator: j.meta.generator ?? j.meta.deriver ?? null, count: j.properties.length });
      for (const row of j.properties) {
        // A row's own `form` wins where it has one — a reuse row in fields.433d.json carries
        // form "433d" and that is the form BINDING it, which is the question being asked.
        const f = row.form ?? form;
        if (!rowsByName.has(row.hs_name)) rowsByName.set(row.hs_name, []);
        rowsByName.get(row.hs_name).push({ form: f, file, row });
      }
    }
  }

  // crosswalks, joined on the field row's `key`
  const crosswalkByForm = new Map();
  for (const file of readdirSync(HS_DIR).filter(f => /^crosswalk\.[0-9a-z]+\.json$/.test(f)).sort()) {
    const form = file.slice('crosswalk.'.length, -'.json'.length);
    const j = JSON.parse(readFileSync(`${HS_DIR}/${file}`, 'utf8'));
    const byKey = new Map();
    for (const b of j.bindings ?? []) byKey.set(b.key, b);
    crosswalkByForm.set(form, { file, byKey, count: (j.bindings ?? []).length });
  }

  return { fieldFiles, forms, rowsByName, crosswalkByForm, groupLabel };
}

// ── the crosswalk's own vocabulary differs per form; read it, do not assume it ────────────
function crosswalkVerdict(form, row, art) {
  const cw = art.crosswalkByForm.get(form);
  if (!cw) {
    return {
      classification: UNDERIVABLE(`no adapters/hubspot/crosswalk.${form}.json exists in this tree. 433-A was provisioned from its map by gen-fields-from-map.mjs before the crosswalk vocabulary existed, so it is the form the later crosswalks classify AGAINST rather than one carrying a classification of its own.`),
      reason: UNDERIVABLE(`same — there is no crosswalk row for ${form} to record a reason in.`),
      entry: row.entry ?? UNDERIVABLE(`fields.${form}.json rows carry no \`entry\` field; that file predates the crosswalk-entry convention.`),
      source_file: null,
    };
  }
  const b = cw.byKey.get(row.key);
  if (!b) {
    return {
      classification: UNDERIVABLE(`no binding in ${cw.file} has key "${row.key}", so this property's row is not reachable from the crosswalk by the key its field file declares.`),
      reason: UNDERIVABLE('same — the crosswalk row could not be located.'),
      entry: row.entry ?? UNDERIVABLE('the field row declares no entry.'),
      source_file: cw.file,
    };
  }
  // 433-F's crosswalk says `classification`/`why`; the four later ones say `scope`/`scope_reason`.
  const classification = b.scope ?? b.classification ?? row.category ?? row.classification ?? null;
  const reason = b.scope_reason ?? b.why ?? null;
  return {
    classification: classification ?? UNDERIVABLE(`${cw.file} row "${row.key}" carries neither \`scope\` nor \`classification\`.`),
    reason: reason ?? UNDERIVABLE(`${cw.file} row "${row.key}" carries neither \`scope_reason\` nor \`why\`.`),
    reuse_reason: b.reuse_reason ?? null,
    entry: b.entry ?? row.entry ?? UNDERIVABLE('neither the crosswalk row nor the field row declares an entry.'),
    arguable: b.arguable ?? null,
    source_file: cw.file,
  };
}

// ── options equality: ORDER IS PART OF THE DEFINITION ────────────────────────────────────
function optionsDiffer(a, b) {
  if (!a && !b) return false;
  if (!a || !b) return true;
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++)
    if (String(a[i].label) !== String(b[i].label) || String(a[i].value) !== String(b[i].value)) return true;
  return false;
}

// A form named inside a portal description, e.g. "433-A(OIC) line 12" -> "433aoi".
// Longest first so "433-A(OIC)" never matches as "433-A".
const FORM_PATTERNS = [
  [/433-?A\s*\(OIC\)/i, '433aoi'], [/433-?B\s*\(OIC\)/i, '433boi'],
  [/433-?A\b/i, '433a'], [/433-?B\b/i, '433b'], [/433-?D\b/i, '433d'], [/433-?F\b/i, '433f'],
];
export function namedFormsIn(text) {
  const out = [];
  let t = text;
  for (const [re, form] of FORM_PATTERNS) {
    if (re.test(t)) { out.push(form); t = t.replace(new RegExp(re.source, 'gi'), ' '); }
  }
  return out;
}

// ── the record ───────────────────────────────────────────────────────────────────────────
export function deriveRecord(p, art) {
  const rows = art.rowsByName.get(p.name) ?? [];
  const divergences = [];

  // ── binding: which forms, from the field files, NOT from the name prefix [R-06]/[R-08] ──
  const boundBy = [...new Set(rows.map(r => r.form))].sort();
  const reuseRows = rows.filter(r => r.row.scope === 'reuse' || r.row.reuse_of != null);
  const creatorRows = rows.filter(r => !(r.row.scope === 'reuse' || r.row.reuse_of != null));

  let createdByForm;
  const declaredCreators = [...new Set(rows.map(r => r.row.created_by_form).filter(Boolean))];
  if (declaredCreators.length === 1) {
    createdByForm = { value: declaredCreators[0], basis: 'declared by a field row via `created_by_form`' };
  } else if (declaredCreators.length > 1) {
    createdByForm = UNDERIVABLE(`field rows disagree: created_by_form is declared as ${declaredCreators.map(x => `"${x}"`).join(' and ')} by different forms binding this same property.`);
    divergences.push({ kind: 'creator-disagreement', detail: `created_by_form declared as ${declaredCreators.join(' / ')}` });
  } else if (creatorRows.length === 1) {
    createdByForm = { value: creatorRows[0].form, basis: 'the one field file holding a non-reuse row for this name' };
  } else if (creatorRows.length > 1) {
    createdByForm = UNDERIVABLE(`${creatorRows.length} forms (${creatorRows.map(r => r.form).join(', ')}) each hold a NON-reuse row for this name and none declares created_by_form, so no field file says which created it.`);
    divergences.push({ kind: 'creator-ambiguous', detail: `non-reuse rows on ${creatorRows.map(r => r.form).join(', ')}` });
  } else if (rows.length) {
    createdByForm = UNDERIVABLE('every field row for this name is a reuse row and none declares created_by_form, so the creating form is not recoverable from this tree.');
  } else {
    createdByForm = UNDERIVABLE('this property appears in no field file in this repo, so no artefact here claims a form created it. See provenance below.');
  }

  // ── classification, per binding form ─────────────────────────────────────────────────────
  const classifications = rows.map(r => ({ form: r.form, file: r.file, ...crosswalkVerdict(r.form, r.row, art) }));

  // ── backbone key ─────────────────────────────────────────────────────────────────────────
  const bbs = [...new Set(rows.map(r => r.row.backbone_key).filter(Boolean))];
  let backboneKey;
  if (bbs.length === 1) backboneKey = { value: bbs[0], basis: 'declared by the field row(s)' };
  else if (bbs.length > 1) {
    backboneKey = UNDERIVABLE(`field rows declare ${bbs.length} different backbone keys for one property: ${bbs.join(', ')}`);
    divergences.push({ kind: 'backbone-disagreement', detail: bbs.join(' / ') });
  } else if (rows.length) backboneKey = UNDERIVABLE('no field row for this property declares a backbone_key. On a creator row that is expected — the property IS the backbone entry rather than sitting on one.');
  else backboneKey = UNDERIVABLE('this property appears in no field file, so there is no row to declare a backbone key.');

  // ── reuse ────────────────────────────────────────────────────────────────────────────────
  const reuse = {
    is: reuseRows.length > 0,
    by: [...new Set(reuseRows.map(r => r.form))].sort(),
    of: [...new Set(reuseRows.map(r => r.row.reuse_of).filter(Boolean))],
  };

  // ── provenance: two INDEPENDENT witnesses [R-39] ─────────────────────────────────────────
  // (a) presence in a field file authored in this repo; (b) the portal's own createdAt. They
  // are independent in ORIGIN: one is written by this repo's derivers, the other by HubSpot at
  // create time. Neither is quoted twice and counted as two.
  const inRepoArtefact = rows.length > 0 || prefixTag(p.name) !== NO_PREFIX_TAG;
  const witnesses = {
    field_file_membership: rows.length > 0
      ? `yes — ${[...new Set(rows.map(r => r.file))].join(', ')}`
      : (prefixTag(p.name) !== NO_PREFIX_TAG
        ? 'no field file holds it, but its name carries a prefix from this project\'s declared vocabulary'
        : 'no'),
    portal_created_at: p.createdAt,
  };

  // ── deprecation → status ─────────────────────────────────────────────────────────────────
  const depMatch = /deprecated/i.test(p.description ?? '');
  const status = depMatch ? 'archive' : 'active';

  // ── divergences between the two authorities ──────────────────────────────────────────────
  for (const r of rows) {
    const row = r.row;
    const where = `${r.file} (${r.form})`;
    if (row.label != null && row.label !== p.label)
      divergences.push({ kind: 'label', detail: `portal "${p.label}" vs ${where} "${row.label}"` });
    if (row.type != null && row.type !== p.type)
      divergences.push({ kind: 'type', detail: `portal "${p.type}" vs ${where} "${row.type}"` });
    if (row.fieldType != null && row.fieldType !== p.fieldType)
      divergences.push({ kind: 'fieldType', detail: `portal "${p.fieldType}" vs ${where} "${row.fieldType}"` });
    if (row.group != null && row.group !== p.groupName)
      divergences.push({ kind: 'group', detail: `portal "${p.groupName}" vs ${where} "${row.group}"` });
    if (row.description != null && row.description !== p.description)
      divergences.push({ kind: 'description', detail: `portal and ${where} hold different description text` });
    if (optionsDiffer(p.options?.length ? p.options : null, row.options?.length ? row.options : null))
      divergences.push({ kind: 'options', detail: `portal has ${p.options?.length ?? 0} option(s), ${where} has ${row.options?.length ?? 0}; or a label, value or position differs` });
    // the form NAMED IN THE PORTAL DESCRIPTION against the forms the field files bind
    const named = namedFormsIn(p.description ?? '');
    if (named.length && !named.some(n => boundBy.includes(n)))
      divergences.push({ kind: 'description-names-unbound-form', detail: `portal description names form(s) ${named.join(', ')}; field files bind ${boundBy.join(', ') || '(none)'}` });
  }
  if (!rows.length && prefixTag(p.name) !== NO_PREFIX_TAG)
    divergences.push({ kind: 'live-but-unbound', detail: `live on the portal and carrying this project's "${prefixTag(p.name)}" prefix, but no field file in this repo holds a row for it` });

  return {
    hs_name: p.name,
    status,
    tag: prefixTag(p.name),
    deprecated: depMatch,
    portal: {
      label: p.label ?? null,
      type: p.type ?? null,
      fieldType: p.fieldType ?? null,
      groupName: p.groupName ?? null,
      description: p.description ?? null,
      options: p.options ?? null,
      createdAt: p.createdAt ?? null,
      hasUniqueValue: p.hasUniqueValue ?? null,
      hidden: p.hidden ?? null,
      formField: p.formField ?? null,
      calculated: p.calculated ?? null,
      readOnlyDefinition: p.modificationMetadata?.readOnlyDefinition ?? null,
      displayOrder: p.displayOrder ?? null,
    },
    group_label_in_repo: art.groupLabel.get(p.groupName) ?? null,
    binding: {
      created_by_form: createdByForm,
      bound_by: boundBy,
      rows: rows.map(r => ({
        file: r.file, form: r.form, key: r.row.key, entry: r.row.entry ?? null,
        scope: r.row.scope ?? null, consumed_by: r.row.consumed_by ?? null,
        line_ref: r.row.line_ref ?? null, pii: r.row.pii ?? null, type_basis: r.row.type_basis ?? null,
      })),
    },
    classifications,
    backbone_key: backboneKey,
    reuse,
    provenance: { project_created: inRepoArtefact, witnesses },
    divergences,
  };
}

export function derivePopulation(portalCustom, art) {
  return portalCustom.map(p => deriveRecord(p, art));
}
