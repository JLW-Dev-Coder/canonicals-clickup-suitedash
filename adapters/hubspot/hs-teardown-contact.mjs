// TEAR DOWN ONE SYNTHETIC CONTACT, AND CONFIRM ITS ABSENCE FROM THE PORTAL.
//
//   node adapters/hubspot/hs-teardown-contact.mjs <contactId> --dry-run
//   node adapters/hubspot/hs-teardown-contact.mjs <contactId> --confirm-delete
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS BESIDE hs-purge-contacts.mjs
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// hs-purge-contacts.mjs archives EVERY contact in the portal. That is the right tool for a
// reset and the wrong one for retiring a single fixture: pointing a delete-everything command
// at a one-record job is how a reset happens by accident. This deletes exactly the id it is
// given, refuses to run without it, and does nothing else.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE ABSENCE IS READ BACK FROM THE PORTAL, NEVER FROM THE DELETE RESPONSE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A 204 says the request was accepted. It does not say the object is gone, and this repo's
// standing rule — read created and deleted state back from the portal, never from the request —
// exists because every permanent-state defect in this project has been the difference between
// those two sentences.
//
// So after the delete, the contact is FETCHED. Three readings and only one of them is success:
//
//   404             gone. This is the only pass.
//   200             still there. A STOP: the delete was accepted and the object survives.
//   anything else   unreadable. A STOP, and specifically NOT a pass — an error reading the
//                   portal is not evidence that the portal is empty, which is the shape of
//                   the guard that reports success because it could not read its input.
//
// The read is by direct object GET rather than by search: HubSpot's search index lags writes,
// so a search-derived "not found" can be a stale index rather than a deleted record. Same
// reasoning as hs-purge-contacts.mjs's pagination, for the same reason.
//
// ARCHIVE IS NOT ERASURE. HubSpot keeps an archived contact restorable for 90 days, and the
// object GET returns 404 for it throughout that window. That is the correct outcome here — the
// fixture is out of every list, every export and every fetch — and it is stated rather than
// implied so nobody reads "confirmed absent" as "unrecoverable".

import { hs } from './hs-lib.mjs';

// NO `process.exit` ON A SUCCESS PATH. `process.exit` immediately after a `fetch` trips a libuv
// assertion on Windows — "!(handle->flags & UV_HANDLE_CLOSING)" — printed AFTER the success
// line, so a clean teardown ends in what reads like a crash. So the whole flow is a function
// that RETURNS, and only the STOP paths exit immediately, because a STOP must not be followed
// by anything.
//
// THE FIRST DRAFT OF THAT CHANGE WOULD HAVE DELETED ON A DRY RUN. Replacing the dry-run branch's
// `process.exit(0)` with a flag left the branch falling straight through into the DELETE below
// it — a refactor for tidiness, on the one command in this repo whose whole point is not to
// delete something by accident. Caught before it ran. A dry run now RETURNS, and there is no
// path from the dry-run branch to the request.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// STANDING RULE: A REFACTOR OF A GUARD IS A CHANGE TO THE GUARD
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The near-miss above, verbatim as it was reported, because the wording is the rule's evidence:
//
//     "Replacing a dry run's `process.exit(0)` with a flag, and leaving the dry-run branch
//      falling through into the DELETE, on the one command whose entire purpose is not to
//      delete something by accident. You caught it, re-ran the dry run, and confirmed the
//      contact survived before the real delete."
//
// Nothing about that edit looked like a change in behaviour. It changed an exit into a flag —
// the kind of edit a person makes without re-reading what is below it, and the kind a reviewer
// skims. What caught it was a person looking, and a person looking is not a mechanism.
//
// SO: ANY CODE PATH WHOSE PURPOSE IS *NOT* TO DO SOMETHING MUST BE PROVED NOT TO DO IT, IN THE
// SAME RUN, IMMEDIATELY BEFORE THE REAL ONE.
//
// Not in a test suite that ran last week against a different revision of the file, and not by
// reading the branch. In the same process, against the same live object, seconds before the
// irreversible call — because the only claim worth anything is "this path did not delete THIS
// object just now", and that is a claim only the run itself can make.
//
// Implemented below: `--confirm-delete` executes the dry-run path FIRST and then re-reads the
// contact. If the contact is gone after the dry run, the dry run deleted it and the real delete
// never starts. The proof costs one GET. The alternative cost, once, is a record nobody meant
// to remove, on a command whose entire purpose was not to remove one.
//
// The same rule is implemented in adapters/hubspot/hs-deprecate-property.mjs, whose no-op path
// is proved byte-for-byte no-op against the live property before the PATCH.

const args = process.argv.slice(2);
const id = args.find(a => /^\d+$/.test(a));
const dryRun = args.includes('--dry-run');
const confirmed = args.includes('--confirm-delete');

const STOP = (...lines) => { lines.forEach(l => console.error(l)); process.exit(2); };

if (!id) STOP('usage: node adapters/hubspot/hs-teardown-contact.mjs <contactId> [--dry-run | --confirm-delete]');
if (!dryRun && !confirmed) STOP(`Refusing to run. Pass --dry-run, or --confirm-delete to archive contact ${id}.`);
if (dryRun && confirmed) STOP('--dry-run and --confirm-delete together. Refusing to guess which one you meant.');

const main = async () => {
  // --- BEFORE: what is actually there -------------------------------------------------------
  let before = null;
  try {
    before = await hs(`/crm/v3/objects/contacts/${id}?properties=email,firstname,lastname,createdate`);
  } catch (e) {
    if (e.status === 404) {
      console.log(`contact ${id}: already absent from the portal (404 on a direct object read).`);
      console.log('Nothing to delete. This is a pass — the end state this command exists to produce is the state it found.');
      return;
    }
    STOP(`STOP: could not read contact ${id} before deleting it — ${e.message}`,
      `  ${String(e.detail || '').slice(0, 400)}`,
      '  An unreadable portal is not an empty one. Nothing was deleted.');
  }

  const p = before.properties || {};
  console.log(`contact ${id} is present:`);
  console.log(`  name    ${[p.firstname, p.lastname].filter(Boolean).join(' ') || '(none)'}`);
  console.log(`  email   ${p.email || '(none)'}`);
  console.log(`  created ${p.createdate || '(unknown)'}`);

  // The dry-run branch is a FUNCTION so the proof below runs the same code rather than a copy
  // of it. A proof that exercises a second copy proves the copy.
  const dryRunPath = () => {
    console.log('');
    console.log('--dry-run: nothing was deleted. Re-run with --confirm-delete to archive it.');
  };

  if (dryRun) {
    dryRunPath();
    return;                          // RETURNS. There is no path from here to the request below.
  }

  // --- THE NO-OP PATH, PROVED NO-OP, IMMEDIATELY BEFORE THE REAL ONE -------------------------
  // The dry-run path is executed, then the contact is re-read. If it removed the object, the
  // delete never starts. See the standing rule at the top of this file.
  console.log('');
  console.log('proving the dry-run path is a no-op before deleting...');
  dryRunPath();
  let stillThere = null;
  try { stillThere = await hs(`/crm/v3/objects/contacts/${id}`); }
  catch (e) { stillThere = null; if (e.status !== 404) STOP(`STOP - could not re-read contact ${id} after the dry-run path (${e.message}). An unreadable portal is not evidence that the dry run was harmless, and the delete is not starting on a guess.`); }
  if (!stillThere) STOP(
    `STOP - contact ${id} is GONE after the dry-run path, which is the one path that must never remove anything.`,
    '  The dry run is not a no-op. Nothing further is being deleted; fix the branch first.');
  console.log(`  dry-run path proved no-op: contact ${id} still present immediately before the delete.`);

  // --- DELETE -------------------------------------------------------------------------------
  await hs(`/crm/v3/objects/contacts/${id}`, { method: 'DELETE' });
  console.log('');
  console.log(`DELETE /crm/v3/objects/contacts/${id} accepted.`);

  // --- AFTER: the only evidence that counts ---------------------------------------------------
  let after = null, readErr = null;
  try { after = await hs(`/crm/v3/objects/contacts/${id}?properties=email`); }
  catch (e) { readErr = e; }

  if (after) STOP('',
    `STOP: the delete was accepted and contact ${id} is STILL READABLE from the portal.`,
    '  The request succeeding and the object being gone are two different facts, and this run has only the first.');
  if (readErr.status !== 404) STOP('',
    `STOP: the read-back failed with ${readErr.status}, which is not a 404 and is therefore not evidence of absence.`,
    `  ${String(readErr.detail || '').slice(0, 400)}`,
    '  An error reading the portal is not a confirmation that the record is gone.');

  console.log(`read-back: GET /crm/v3/objects/contacts/${id} -> 404. Confirmed absent FROM THE PORTAL, not from the delete response.`);
  console.log('HubSpot holds an archived contact restorable for 90 days; it is out of every list, export and fetch for that window and after it.');
};

await main();
