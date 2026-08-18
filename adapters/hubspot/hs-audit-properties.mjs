// Read-only audit of every CUSTOM contact property, ahead of the property purge.
//
//   node adapters/hubspot/hs-audit-properties.mjs
//   -> adapters/hubspot/backup/property-audit.json  (git-ignored; property NAMES are schema,
//                                                    not customer data, but it lives with the
//                                                    backup so one ignore rule covers both)
//
// With the contacts gone no property can hold customer data, so the question this audit answers
// is not "would deleting this lose data" but "would deleting this break something that writes
// here next week". Those are different questions and only the second one is still open.
//
// Four signals, in descending order of how much they prove:
//
//   UNDELETABLE   modificationMetadata.readOnlyDefinition — an installed app owns the
//                 definition. HubSpot refuses the delete outright. Not a judgement call.
//   FORM-BOUND    the property appears in a live (non-archived) HubSpot form. This is read
//                 from the Forms API, not guessed from the name, because the name is exactly
//                 what misleads here: a form-generated property is named after the QUESTION
//                 TEXT, so it looks like prose ("did_you_...", "how_would_you_...") and reads
//                 as junk to a name-based sweep.
//   APP-GROUPED   the property sits in a property GROUP an integration created (calendly,
//                 chargebee, suitedash...). Weaker than form-bound but still an integration
//                 declaring ownership.
//   HELD-DATA     the property held a value in the pre-reset backup. Says the field was in
//                 real use; says nothing about whether anything still writes to it.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { hs } from './hs-lib.mjs';

const OUT = 'adapters/hubspot/backup/property-audit.json';
const BACKUP = 'adapters/hubspot/backup/contacts-pre-reset.json';

const all = (await hs('/crm/v3/properties/contacts')).results || [];
const custom = all.filter((p) => !p.hubspotDefined);
console.log(`custom contact properties: ${custom.length} (of ${all.length} total)`);

// --- which properties do LIVE forms write to? ----------------------------------------------
const formBound = new Map(); // propertyName -> [form names]
let formsRead = 0;
try {
  let after = null;
  const forms = [];
  do {
    const qs = new URLSearchParams({ limit: '100' });
    if (after) qs.set('after', after);
    const page = await hs(`/marketing/v3/forms?${qs}`);
    forms.push(...(page.results || []));
    after = page.paging?.next?.after || null;
  } while (after);

  for (const f of forms) {
    if (f.archived) continue;
    formsRead++;
    // Field groups nest; walk them rather than assuming a flat list.
    const walk = (nodes) => {
      for (const n of nodes || []) {
        if (n.name) {
          if (!formBound.has(n.name)) formBound.set(n.name, []);
          formBound.get(n.name).push(f.name);
        }
        if (n.fields) walk(n.fields);
        if (n.fieldGroups) walk(n.fieldGroups);
      }
    };
    walk(f.fieldGroups);
  }
  console.log(`live forms read: ${formsRead}; distinct properties referenced by them: ${formBound.size}`);
} catch (e) {
  console.log(`forms API -> ${e.status} (${String(e.detail).slice(0, 160)})`);
  console.log('  ! form binding UNKNOWN — treat name-prose properties with extra care.');
}

// --- which properties held data before the purge? ------------------------------------------
const held = new Set();
if (existsSync(BACKUP)) {
  const b = JSON.parse(readFileSync(BACKUP, 'utf8'));
  for (const c of b.contacts) {
    for (const [k, v] of Object.entries(c.properties || {})) {
      if (v !== null && v !== '') held.add(k);
    }
  }
  console.log(`properties that held a value pre-reset: ${held.size}`);
}

// --- classify -------------------------------------------------------------------------------
// The 433 families are the thing being replaced; everything else has to earn its deletion.
const FORM_FAMILY = /^(irs433a|irs433aoic|irs433f|irs433b|irs433)_/;
const ORG_ROUTING = /^vlp_/;

const rows = custom.map((p) => {
  const undeletable = !!p.modificationMetadata?.readOnlyDefinition;
  const forms = formBound.get(p.name) || [];
  const group = p.groupName || '(none)';
  let origin;
  if (undeletable) origin = 'undeletable (app-owned definition)';
  else if (forms.length) origin = 'form-bound';
  else if (FORM_FAMILY.test(p.name)) origin = '433 family (being replaced)';
  else if (ORG_ROUTING.test(p.name)) origin = 'vlp organizer routing';
  else origin = `other (group: ${group})`;

  return {
    name: p.name,
    label: p.label,
    group,
    type: p.type,
    fieldType: p.fieldType,
    undeletable,
    forms,
    held_data: held.has(p.name),
    createdAt: p.createdAt,
    origin,
  };
});

const byOrigin = {};
for (const r of rows) (byOrigin[r.origin] ||= []).push(r);

console.log('');
console.log('=== CUSTOM PROPERTIES BY APPARENT ORIGIN ===');
for (const [o, list] of Object.entries(byOrigin).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${String(list.length).padStart(4)}  ${o}`);
}

console.log('');
console.log('=== BY PROPERTY GROUP ===');
const byGroup = {};
for (const r of rows) byGroup[r.group] = (byGroup[r.group] || 0) + 1;
for (const [g, n] of Object.entries(byGroup).sort((a, b) => b[1] - a[1])) {
  console.log(`${String(n).padStart(4)}  ${g}`);
}

// --- the protected set ----------------------------------------------------------------------
// Anything an integration appears to own. Reported separately and NOT deleted by the purge
// script unless it is explicitly overridden.
const protectedRows = rows.filter((r) => r.undeletable || r.forms.length);
console.log('');
console.log(`=== PROTECTED (not deleted): ${protectedRows.length} ===`);
for (const r of protectedRows) {
  const why = r.undeletable ? 'app-owned definition (HubSpot refuses delete)' : `used by live form(s): ${[...new Set(r.forms)].join(' | ')}`;
  console.log(`  ${r.name}  [${r.group}]  <- ${why}`);
}

const deletable = rows.filter((r) => !r.undeletable && !r.forms.length);
console.log('');
console.log(`deletable: ${deletable.length}   protected: ${protectedRows.length}   total custom: ${rows.length}`);

mkdirSync('adapters/hubspot/backup', { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    { meta: { audited_utc: new Date().toISOString(), custom_total: rows.length, protected: protectedRows.length, deletable: deletable.length, forms_read: formsRead }, rows },
    null,
    2,
  ) + '\n',
);
console.log(`audit -> ${OUT}`);
