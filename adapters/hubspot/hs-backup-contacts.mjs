// Full backup of every contact with every property, ahead of the destructive reset.
//
//   node adapters/hubspot/hs-backup-contacts.mjs
//   -> adapters/hubspot/backup/contacts-pre-reset.json   (GIT-IGNORED — see below)
//
// THIS FILE IS REAL CUSTOMER PII AND MUST NEVER ENTER GIT.
// `adapters/hubspot/backup/` is in .gitignore, and that entry was added BEFORE this script was
// first run. The VLP no-customer-PII rule covers the repo, commit messages, filenames and
// object keys, so the only artifact here is a local file whose path is reported to the Owner
// and whose CONTENTS are never printed — not by this script, not by the run report.
//
// It is also the only undo for the delete that follows. Everything downstream gates on the
// record count this script writes.

import { writeFileSync, mkdirSync, statSync } from 'fs';
import { hs, listAll, chunk } from './hs-lib.mjs';

const OUT_DIR = 'adapters/hubspot/backup';
const OUT = `${OUT_DIR}/contacts-pre-reset.json`;

// Every property name on the object, hubspotDefined included. A backup that captured only the
// custom ones would lose email, name and lifecycle stage — the fields that would actually be
// needed to reconstruct a contact.
const allProps = ((await hs('/crm/v3/properties/contacts')).results || []).map((p) => p.name);
console.log(`properties on object: ${allProps.length}`);

const ids = (await listAll('/crm/v3/objects/contacts', { limit: 100 })).map((c) => c.id);
console.log(`contacts to back up: ${ids.length}`);

// Batch read rather than 257 single GETs: one request per 50 contacts, and the property list
// travels in the BODY, which sidesteps the URL-length ceiling that a 1,036-name querystring
// would blow straight through.
const records = [];
for (const batch of chunk(ids, 50)) {
  const res = await hs('/crm/v3/objects/contacts/batch/read', {
    method: 'POST',
    body: { properties: allProps, inputs: batch.map((id) => ({ id })) },
  });
  records.push(...(res.results || []));
  process.stdout.write(`  read ${records.length}/${ids.length}\r`);
}
console.log('');

if (records.length !== ids.length) {
  console.error(`ABORT: read back ${records.length} of ${ids.length} contacts. Backup incomplete.`);
  process.exit(2);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    {
      meta: {
        source: 'hubspot contacts',
        // No date-stamp in the FILENAME: the path is quoted in the run report and a drifting
        // name would make the report's "only undo lives here" line wrong the next day.
        captured_utc: new Date().toISOString(),
        portal_note: 'pre-reset full capture; property set = every contact property at capture time',
        contact_count: records.length,
        property_count: allProps.length,
      },
      properties: allProps,
      contacts: records,
    },
    null,
    2,
  ) + '\n',
);

const bytes = statSync(OUT).size;
// Counts and size only. Never a contact's contents.
console.log(`backed up ${records.length} contacts x ${allProps.length} properties`);
console.log(`file: ${OUT}`);
console.log(`size: ${bytes} bytes (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
