// DESTRUCTIVE. Archives every contact in the portal.
//
//   node adapters/hubspot/hs-purge-contacts.mjs --dry-run
//   node adapters/hubspot/hs-purge-contacts.mjs --confirm-delete-all-contacts
//
// Owner authorised this reset; the long flag exists so the command cannot be produced by a
// stray up-arrow. Two preconditions are checked in the script rather than trusted to the
// operator, because both are the kind of thing that is true when you plan the run and false
// when you execute it:
//
//   1. The backup file exists and holds at least as many contacts as the portal does. A purge
//      whose undo is short of a contact is not a purge with an undo.
//   2. The post-delete count is READ BACK by pagination. HubSpot's archive is asynchronous at
//      the search index but synchronous at the object store, so paginating is what actually
//      answers "is it gone", and a count that is not zero is a stop rather than a retry.
//
// Archive is not erasure: HubSpot holds archived contacts restorable for 90 days, which is a
// second net under the JSON backup.

import { existsSync, readFileSync } from 'fs';
import { hs, listAll, chunk } from './hs-lib.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const confirmed = args.includes('--confirm-delete-all-contacts');
if (!dryRun && !confirmed) {
  console.error('Refusing to run. Pass --dry-run, or --confirm-delete-all-contacts to delete.');
  process.exit(2);
}

const BACKUP = 'adapters/hubspot/backup/contacts-pre-reset.json';

const ids = (await listAll('/crm/v3/objects/contacts', { limit: 100 })).map((c) => c.id);
console.log(`contacts present: ${ids.length}`);

// --- precondition: the undo exists and covers what we are about to destroy -----------------
if (!existsSync(BACKUP)) {
  console.error(`ABORT: no backup at ${BACKUP}. Run hs-backup-contacts.mjs first.`);
  process.exit(2);
}
const backup = JSON.parse(readFileSync(BACKUP, 'utf8'));
const backedUp = new Set(backup.contacts.map((c) => c.id));
console.log(`backup holds:     ${backedUp.size}`);

const missing = ids.filter((id) => !backedUp.has(id));
if (missing.length) {
  // Named by COUNT, never by id or contents.
  console.error(`ABORT: ${missing.length} live contact(s) are not in the backup. Re-run the backup.`);
  process.exit(2);
}

if (dryRun) {
  console.log(`[dry run] would archive ${ids.length} contacts in ${chunk(ids, 100).length} batch(es).`);
  process.exit(0);
}

// --- delete --------------------------------------------------------------------------------
let done = 0;
for (const batch of chunk(ids, 100)) {
  await hs('/crm/v3/objects/contacts/batch/archive', {
    method: 'POST',
    body: { inputs: batch.map((id) => ({ id })) },
  });
  done += batch.length;
  console.log(`  archived ${done}/${ids.length}`);
}

// --- verify ----------------------------------------------------------------------------------
const remaining = (await listAll('/crm/v3/objects/contacts', { limit: 100 })).length;
console.log('');
console.log(`before: ${ids.length}`);
console.log(`after:  ${remaining}`);
if (remaining !== 0) {
  console.error(`STOP: ${remaining} contact(s) still present after archive. Do not proceed.`);
  process.exit(3);
}
console.log('verified: contact count reads 0.');
