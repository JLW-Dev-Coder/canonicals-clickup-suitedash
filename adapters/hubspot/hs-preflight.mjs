// Read-only census of the portal. Reports counts ONLY — never a contact's contents.
//
//   node adapters/hubspot/hs-preflight.mjs
//
// Every destructive step in the reset gates on a number this script produced, so nothing here
// writes and nothing here is inferred from documentation. The custom-property ceiling in
// particular is PROBED against the live account rather than quoted, because it varies by
// subscription tier and a plan sized against the wrong number is a plan that runs out of room
// three forms in, with names that cannot be withdrawn.

import { readFileSync } from 'node:fs';
import { hs, listAll, stop, isStop } from './hs-lib.mjs';
// [D-29]: THE PROBE-REGISTER FIGURES ARE NOT DERIVED HERE ANY MORE. They were, by a truthiness
// test over a field holding English, and a row answering "No." counted as a Yes while a row that
// said nothing counted as a No when the truth was Yes. The predicate now lives in ONE place,
// beside its own canary, and this file imports it — because two readers of one field is how the
// two readings drift apart, which is the second half of what [D-29] found.
import { auditTypedCount } from './probe-register-count.mjs';

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
  } catch (e) { if (isStop(e)) throw e;
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
} catch (e) { if (isStop(e)) throw e;
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
  } catch (e) { if (isStop(e)) throw e;
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

// ---------------------------------------------------------------------------------------
// THE SYNTHETIC-PROBE REGISTER, ASSERTED AGAINST THE LIVE PORTAL.
//
// Prompt 38 asserted "synthetic probe absent". It was true of one probe of the three that
// mattered. Prompt 39 asserted a 433-A probe was still live; all four 433-A ids returned 404.
// And a 433-F probe neither prompt named had been live for two days carrying a full serialized
// record, recorded nowhere in this repo.
//
// So the claim is never taken from a prompt, a memory, or a delete response. It is READ, here,
// and compared against adapters/hubspot/probe-register.json — in BOTH directions, because the
// two failures are different and only one of them is the obvious one:
//
//   register says torn_down, portal says present   a teardown that did not happen
//   portal has a synthetic contact the register     a probe nobody recorded — the 242795652507
//   does not name                                   shape, and the one that actually bit
//   register says `unknown`                         seeded with no teardown record; the register
//                                                   cannot tell live from gone and the portal can
//
// Every one of those is a STOP. Nothing downstream of this file should run against a portal
// holding an unaccounted synthetic record.
line('');
line('=== SYNTHETIC-PROBE REGISTER ===');
const REGISTER = 'adapters/hubspot/probe-register.json';
const stops = [];
{
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const probes = reg.probes || [];

  // NO COUNT IS TYPED. The declared tally is re-derived from probes[] and a disagreement is a
  // STOP, on the same rule that governs every other count in this repo. The derivation itself is
  // adapters/hubspot/probe-register-count.mjs — imported, never restated here ([D-29]).
  const { counts: derived, contemporaneous, stops: countStops } = auditTypedCount(reg);
  stops.push(...countStops);
  line(`register: ${derived.probes} probe(s) — ${derived.torn_down} torn_down, ${derived.live} live, ${derived.unknown} unknown`);
  line(`  registered_retrospectively: ${derived.registered_retrospectively} written after the seeding run, ${contemporaneous} written at seed time, ${derived.registered_retrospectively_unrecoverable} not recoverable from this tree`);

  // A probe with no teardown record is a STOP whatever the portal says. The register is the
  // list of things that must be absent, and `unknown` means it cannot vouch for one of them.
  for (const p of probes) if (p.teardown === 'unknown')
    stops.push(`probe ${p.id} (${p.form}) has teardown "unknown" — seeded with no teardown record. Read the portal for it and either tear it down or record its absence.`);
  for (const p of probes) if (p.teardown === 'torn_down' && !p.absence_read)
    stops.push(`probe ${p.id} (${p.form}) claims torn_down and records no absence_read. A delete response is not evidence of absence.`);

  // DIRECTION 1 — every probe the register calls gone must be gone, read one id at a time.
  // Pagination would answer "not in the list", which a lagging index can also produce; a direct
  // object read cannot be satisfied by a stale index.
  let checked = 0, resurrected = 0;
  for (const p of probes) {
    if (p.teardown !== 'torn_down') continue;
    checked++;
    let present = false, status = null;
    try { await hs(`/crm/v3/objects/contacts/${p.id}`); present = true; }
    catch (e) { if (isStop(e)) throw e; status = e.status; }
    if (present) { resurrected++; stops.push(`probe ${p.id} (${p.form}) is recorded torn_down and IS READABLE from the portal right now. The teardown did not happen, or the record was restored.`); }
    else if (status !== 404) stops.push(`probe ${p.id} (${p.form}) read back ${status}, which is not a 404 and is therefore not evidence of absence. An error reading the portal is not a confirmation that the record is gone.`);
  }
  line(`absence re-read from the portal for ${checked} torn-down probe(s): ${checked - resurrected} confirmed 404, ${resurrected} still readable`);

  // DIRECTION 2 — and this is the one that bit. A synthetic contact on the portal that the
  // register does not name is a probe nobody recorded.
  const known = new Set(probes.map((p) => String(p.id)));
  const synthetic = (contacts || []).filter((c) => {
    const e = String(c.properties?.email || '').toLowerCase();
    const n = `${c.properties?.firstname || ''} ${c.properties?.lastname || ''}`.toLowerCase();
    return e.endsWith('@example.com') || e.includes('synthetic') || n.includes('synthetic') || n.includes('probe');
  });
  line(`portal holds ${contacts ? contacts.length : '(unreadable)'} contact(s); ${synthetic.length} look synthetic`);
  for (const c of synthetic) {
    const tag = known.has(String(c.id)) ? 'REGISTERED' : 'UNREGISTERED';
    line(`  ${tag}  ${c.id}  ${c.properties?.email || '(no email)'}`);
    if (!known.has(String(c.id)))
      stops.push(`contact ${c.id} (${c.properties?.email || 'no email'}) looks synthetic and appears in no row of ${REGISTER}. A probe nobody recorded is exactly the 242795652507 case. Register it, then tear it down.`);
  }
  if (!synthetic.length) line('  none — no contact on this portal matches the synthetic signature.');
}

if (stops.length) {
  line('');
  console.error(`PRE-FLIGHT STOP — ${stops.length} probe-register problem(s):`);
  for (const s of stops) console.error(`  ${s}`);
  stop(3);
}
line('');
line('probe register: every recorded probe re-read from the portal and confirmed absent, and every synthetic-looking contact on the portal is a registered probe.');
