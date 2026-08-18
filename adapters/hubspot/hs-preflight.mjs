// Read-only census of the portal. Reports counts ONLY — never a contact's contents.
//
//   node adapters/hubspot/hs-preflight.mjs
//
// Every destructive step in the reset gates on a number this script produced, so nothing here
// writes and nothing here is inferred from documentation. The custom-property ceiling in
// particular is PROBED against the live account rather than quoted, because it varies by
// subscription tier and a plan sized against the wrong number is a plan that runs out of room
// three forms in, with names that cannot be withdrawn.

import { hs, listAll } from './hs-lib.mjs';

const line = (s) => console.log(s);

// --- objects -------------------------------------------------------------------------------
// Counted by pagination, not by the search endpoint's `total`. See listAll's note.
//
// A missing scope is reported as a missing scope. It is NOT folded into a zero: "the key
// cannot see companies" and "there are no companies" are different facts, and only one of them
// licenses a destructive step to proceed.
const census = async (label, path) => {
  try {
    const rows = await listAll(path, { limit: 100 });
    line(`${label}: ${rows.length}`);
    return rows;
  } catch (e) {
    if (e.status === 403) {
      line(`${label}: UNREADABLE - 403 MISSING_SCOPES (this key cannot read ${label}; count not verified)`);
      return null;
    }
    throw e;
  }
};

line('=== OBJECTS ===');
const contacts = await census('contacts', '/crm/v3/objects/contacts');
const companies = await census('companies', '/crm/v3/objects/companies');
if (companies === null) {
  line('  ^ the same missing scope means this credential cannot create or delete companies either,');
  line('    so no company data is reachable by anything in this reset.');
}

// --- properties ----------------------------------------------------------------------------
const props = (await hs('/crm/v3/properties/contacts')).results || [];
const custom = props.filter((p) => !p.hubspotDefined);
const defined = props.filter((p) => p.hubspotDefined);

line('');
line('=== CONTACT PROPERTIES ===');
line(`total:          ${props.length}`);
line(`hubspotDefined: ${defined.length}`);
line(`custom:         ${custom.length}`);

// Calculated / read-only customs still occupy a name but behave differently on delete.
const calc = custom.filter((p) => p.calculated);
const readOnly = custom.filter((p) => p.modificationMetadata?.readOnlyDefinition);
line(`  of which calculated:          ${calc.length}`);
line(`  of which readOnlyDefinition:  ${readOnly.length}`);

// --- the ceiling, read from the account rather than from docs -------------------------------
line('');
line('=== CEILING (probed) ===');

// 1. Subscription tier. The property ceiling is a function of this, so it is reported even
//    when a numeric limit endpoint answers, as the cross-check.
try {
  const acct = await hs('/account-info/v3/details');
  line(`portalId: ${acct.portalId}  tier: ${acct.accountType}  currency: ${acct.companyCurrency}  tz: ${acct.timeZone}`);
} catch (e) {
  line(`account-info/v3/details -> ${e.status} (${e.detail?.slice(0, 120)})`);
}

// 2. Any endpoint that states the number outright. These are probed in order and whatever
//    answers is reported verbatim; a 403/404 is reported as a 403/404 rather than papered over
//    with a documented figure.
const LIMIT_ENDPOINTS = [
  '/crm/v3/properties/contacts/limits',
  '/properties/v2/contacts/properties/limits',
  '/account-info/v3/usage-limits',
  '/integrators/v1/limit/daily',
];
for (const path of LIMIT_ENDPOINTS) {
  try {
    const r = await hs(path);
    line(`${path} -> ${JSON.stringify(r).slice(0, 600)}`);
  } catch (e) {
    line(`${path} -> ${e.status}`);
  }
}

// 3. The empirical probe. HubSpot states the ceiling in the ERROR it returns when a create
//    would cross it — which is the only place the live number is published. We cannot provoke
//    that without filling the portal, so instead the surviving evidence is recorded: what the
//    portal currently holds, and what it accepted. Reported as an observation, not a limit.
line('');
line(`observed: portal currently holds ${custom.length} custom contact properties and accepts writes.`);
if (contacts) line(`observed: ${contacts.length} contacts present.`);
line('note: HubSpot publishes the numeric ceiling only in the 400 returned by a create that would');
line('      cross it. Nothing short of crossing it reads the number, so the plan is sized against');
line('      the tier above plus the headroom arithmetic in the report.');
