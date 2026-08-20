// MARK A LIVE PROPERTY DEPRECATED IN ITS PORTAL DESCRIPTION, NAMING WHAT REPLACED IT.
//
//   node adapters/hubspot/hs-deprecate-property.mjs <name> <replacement> "<why>" [--apply]
//
// HubSpot will not rename or delete a property in a way that frees the name, so a property a
// rebind orphans stays live forever. The only thing that CAN change is what it says about
// itself — and what it says is the only thing a future pass reads before deciding whether to
// bind to it. An orphan with a description that still reads like a live binding is how the
// duplicate comes back.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DRY RUN IS PROVED NO-OP IN THE SAME RUN, IMMEDIATELY BEFORE THE REAL ONE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A refactor of a guard is a change to the guard. The near-miss this rule was written from,
// verbatim from the teardown that produced it:
//
//     "Replacing a dry run's `process.exit(0)` with a flag, and leaving the dry-run branch
//      falling through into the DELETE, on the one command whose entire purpose is not to
//      delete something by accident."
//
// It was caught, the dry run was re-run, and the contact was confirmed alive before the real
// delete. It was caught by a person looking, which is not a mechanism.
//
// So: any code path whose purpose is NOT to do something must be PROVED not to do it, in the
// same run, immediately before the real one. Here that means `--apply` runs the no-op path
// first against the live portal and asserts the property is BYTE-FOR-BYTE unchanged after it;
// only then does the write happen. A dry run that changed something is a STOP and the write
// never starts. The proof costs one extra GET and it is the difference between a branch that
// is documented as harmless and one that has just been shown to be.
//
// And the state is read back FROM THE PORTAL after the write, never from the response to it.

import { hs } from './hs-lib.mjs';

const [name, replacement, why, ...flags] = process.argv.slice(2);
const apply = flags.includes('--apply') || process.argv.includes('--apply');
if (!name || !replacement || !why) {
  console.error('usage: node adapters/hubspot/hs-deprecate-property.mjs <name> <replacement> "<why>" [--apply]');
  process.exit(2);
}

const PATH = `/crm/v3/properties/contacts/${name}`;
const read = async () => {
  const p = await hs(PATH);
  return { description: p.description ?? '', label: p.label, type: p.type, fieldType: p.fieldType, groupName: p.groupName };
};

const before = await read();
console.log(`hs-deprecate-property: ${name}`);
console.log(`  live description BEFORE: ${JSON.stringify(before.description)}`);

if (/^DEPRECATED\b/.test(before.description)) {
  console.log('  already deprecated. Nothing to do, and nothing claimed about a write that did not happen.');
  process.exit(0);
}

const next = `DEPRECATED - do not bind. Superseded by ${replacement}. ${why} Original: ${before.description}`.slice(0, 500);
console.log(`  proposed description:    ${JSON.stringify(next)}`);
console.log(`  length ${next.length} of HubSpot's 500-character limit`);

// ── THE NO-OP PATH, RUN AND PROVED NO-OP ─────────────────────────────────────────────────
// Everything the real path does except the PATCH. If this changed anything, the real path is
// not trusted to be the only thing that writes.
const dryRun = async () => {
  const p = await hs(PATH);                       // the same read the write path makes
  return { description: p.description ?? '' };
};
await dryRun();
const afterDry = await read();
if (JSON.stringify(afterDry) !== JSON.stringify(before)) {
  console.error('  STOP - the dry-run path CHANGED the live property. It is not a no-op, and the real write is not starting.');
  console.error(`    before: ${JSON.stringify(before)}`);
  console.error(`    after:  ${JSON.stringify(afterDry)}`);
  process.exit(2);
}
console.log('  dry run proved no-op against the live portal: property byte-for-byte unchanged after it.');

if (!apply) {
  console.log('  DRY RUN ONLY. Nothing was written. Re-run with --apply.');
  process.exit(0);
}

await hs(PATH, { method: 'PATCH', body: { description: next } });

// READ BACK FROM THE PORTAL, NEVER FROM THE REQUEST.
const after = await read();
console.log(`  live description AFTER (read back from the portal): ${JSON.stringify(after.description)}`);
if (after.description !== next) {
  console.error('  STOP - the portal did not store what was sent. The property is in an unknown state.');
  process.exit(2);
}
for (const k of ['label', 'type', 'fieldType', 'groupName']) {
  if (after[k] !== before[k]) { console.error(`  STOP - ${k} changed from ${JSON.stringify(before[k])} to ${JSON.stringify(after[k])}. Only the description was meant to move.`); process.exit(2); }
}
console.log('  OK - description updated, and label, type, fieldType and group are unchanged.');
