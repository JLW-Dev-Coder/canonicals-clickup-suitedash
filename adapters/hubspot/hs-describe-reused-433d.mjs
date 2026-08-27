// PATCH THE DESCRIPTION of every property 433-D REUSES, so it names this form as well as the
// form that created it. Descriptions and nothing else. Creates nothing, renames nothing,
// retypes nothing.
//
//   node adapters/hubspot/hs-describe-reused-433d.mjs --dry-run
//   node adapters/hubspot/hs-describe-reused-433d.mjs
//
// WHY THIS IS A SEPARATE TOOL AND NOT A FLAG ON THE PROVISIONER
// -------------------------------------------------------------
// The standing ruling is that each reused property's description names the forms it serves, at
// create time. For these three, CREATE TIME WAS A PREVIOUS CYCLE — 433-A made two and
// 433-B(OIC) made the third, and 433-D binds all three under [R-06] rather than creating
// anything. So the ruling cannot be satisfied at create time on this pass, and the honest
// reading is that the portal must end up showing this form, by whatever act is available.
//
// The act available is a PATCH, and hs-provision.mjs must not learn to do it. That file's whole
// contract is "a property that already exists is SKIPPED, never patched", and a refactor of a
// guard is a change to the guard ([R-12]).
//
// AND THIS ONE APPENDS WHERE ITS PREDECESSOR REPLACED, WHICH IS THE DIFFERENCE THAT MATTERS
// -------------------------------------------------------------------------------------------
// 433-B's describer wrote the definition file's description over the live one. It could, because
// all nine of its reuses were irs433boi_ properties whose live descriptions used the same
// enumerating convention the replacement uses.
//
// TWO OF 433-D's THREE ARE BACKBONE PROPERTIES AND THEIR DESCRIPTIONS USE A DIFFERENT CONVENTION
// ON PURPOSE: "433-A line 2 (input key: 2_sp_ssn_itin). Shared across the 433 series - named for
// the fact, not the form." That sentence is a statement about how the backbone is named, and
// overwriting it with an enumeration of forms would erase a landed convention to satisfy a later
// one — which is exactly what [R-21] refuses. So this tool APPENDS one sentence naming this form
// and this input key, and leaves every word already there intact. What reaches the portal is
// therefore derived from the LIVE description plus this form's sentence, not from the definition
// file's description, and the tool asserts that the live text survives the patch byte for byte.
//
// THE PERMISSION IS NARROWED TO THE SHAPE OF THE TASK:
//   - only properties this form declares `scope: "reuse"` are touched — 3 of 78;
//   - only the `description` field is sent, so a mangled request cannot change a type or a name;
//   - a property whose live description ALREADY names this form is skipped and counted;
//   - the sentence is appended, never substituted, and the prior text is asserted still present
//     in what the portal hands back;
//   - every patch is READ BACK from the portal on a SEPARATE request ([R-23]), because a 2xx on
//     a PATCH is the request being accepted, which is a different fact from the object having
//     changed.
//
// AND IT GOES THROUGH node `fetch`, per [R-27] and [R-23]. PowerShell 5.1 sends a string body as
// ISO-8859-1 and one em-dash cost 27 permanent property creations.

import { readFileSync } from 'node:fs';
import { hs, stop, isStop } from './hs-lib.mjs';

const dryRun = process.argv.includes('--dry-run');
const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433d.json', 'utf8'));
const reuses = defs.properties.filter((p) => p.scope === 'reuse');

if (!reuses.length) {
  console.error('STOP — fields.433d.json declares no reuse rows. This tool exists for them; running it against none would report success over an empty set ([R-04]).');
  stop(3);
}

// READ THE LIVE STATE FIRST, and refuse to act on a read that plainly failed.
const all = (await hs('/crm/v3/properties/contacts')).results || [];
if (all.length < 100) {
  console.error(`STOP — the portal returned ${all.length} contact properties. A portal with 400+ HubSpot-defined properties cannot answer that, so this read failed rather than finding an empty portal.`);
  stop(3);
}
const live = new Map(all.map((p) => [p.name, p]));

// THE TEST IS ON THE FORM NAME, not on string equality with what this repo would write. A
// description edited by hand to name this form is not one that needs patching, and rewriting it
// would be this tool overwriting a person's words.
//
// THE PREDECESSOR'S TEST WAS DEAD ON ARRIVAL AND THAT IS WHY THE CANARY IS HERE: /433-B\b/
// matches INSIDE "433-B(OIC)", so every predecessor-only description satisfied it and the tool
// reported all nine already done without sending a request ([D-18], second instance). "433-D" is
// not a prefix of any other form name in this series, so the plain test is sound — but "sound
// because I thought about it" is what that draft also was, so it is proved on plants instead.
const namesThisForm = (d) => /433-D\b/.test(String(d || ''));
{
  const dead = [];
  if (namesThisForm('433-A line 2 (input key: 2_sp_ssn_itin). Shared across the 433 series - named for the fact, not the form.')) dead.push('a description naming only 433-A was read as naming 433-D.');
  if (namesThisForm('Serves BOTH Form 433-B (input key: s1_ein) and Form 433-B(OIC) (input key: s1_ein).')) dead.push('a description naming 433-B and 433-B(OIC) was read as naming 433-D.');
  if (namesThisForm('433-A(OIC) s1 (input key: s1_tp_ssn_itin).')) dead.push('a description naming only 433-A(OIC) was read as naming 433-D.');
  if (!namesThisForm('Also written by Form 433-D (input key: 433d_spouse).')) dead.push('a description that DOES name 433-D was read as not naming it.');
  if (dead.length) { console.error('STOP — the names-this-form test is dead:\n  ' + dead.join('\n  ')); stop(3); }
}

// THE SENTENCE THIS TOOL APPENDS, derived per row from the definition rather than typed.
const sentenceFor = (p) => `Also written by Form 433-D (input key: ${p.key}), crosswalk ${p.entry}, classified ${p.category}; the cell is subject-${p.subject_class}, so its subject is FIXED and cannot be the wrong legal person on the other branch of the record.`;

const plan = [], already = [], missing = [];
for (const p of reuses) {
  const l = live.get(p.hs_name);
  if (!l) { missing.push(p); continue; }
  if (namesThisForm(l.description)) { already.push({ p, l }); continue; }
  const existing = String(l.description || '').trim();
  const next = existing ? `${existing} ${sentenceFor(p)}` : sentenceFor(p);
  if (next.length > 1000) { console.error(`STOP — the appended description for ${p.hs_name} would be ${next.length} characters. Refusing to send a value that may be silently truncated, which would destroy the text this tool exists to preserve.`); stop(3); }
  plan.push({ p, l, existing, next });
}

if (missing.length) {
  console.error(`STOP — ${missing.length} reused propert(ies) are not live on the portal: ${missing.map((p) => p.hs_name).join(', ')}.`);
  console.error('  A reuse must bind a property that exists. Run adapters/hubspot/hs-dryrun-433d.mjs, which reports this as a STOP with its reason.');
  stop(3);
}

console.log(`433-D reused-property descriptions${dryRun ? ' — DRY RUN, nothing sent' : ''}`);
console.log(`  reuse rows: ${reuses.length}; already naming 433-D: ${already.length}; to patch: ${plan.length}`);
console.log('  the patch APPENDS: every word already live is kept and this form is added after it.');
for (const { p, existing, next } of plan) {
  console.log(`\n  ${p.hs_name}  (433-D input key ${p.key}, created by ${p.created_by_form})`);
  console.log(`    live:  ${existing || '(none)'}`);
  console.log(`    would: ${next}`);
}

if (dryRun) { console.log('\nDRY RUN — nothing was sent.'); stop(0); }
if (!plan.length) { console.log('\nNothing to do: every reused property already names 433-D.'); stop(0); }

// --- patch, one at a time, description only ----------------------------------------------------
const patched = [];
for (const { p, next } of plan) {
  try {
    await hs(`/crm/v3/properties/contacts/${encodeURIComponent(p.hs_name)}`, {
      method: 'PATCH',
      body: { description: next },              // description ONLY. No name, no type, no options.
    });
    patched.push({ p, next });
  } catch (e) { if (isStop(e)) throw e;
    console.error(`  ! PATCH ${p.hs_name} failed: ${e.status ?? ''} ${e.message}`);
  }
}

// --- READ BACK FROM THE PORTAL, on a separate request ------------------------------------------
// [R-23]: a 2xx is the request being accepted, which is a different fact from the object having
// changed. Read per property rather than from the list endpoint, so a stale list cannot answer.
console.log('\nRead-back, per property, on a separate request:');
let confirmed = 0, wrong = 0, lost = 0;
for (const { p, next } of patched) {
  const back = await hs(`/crm/v3/properties/contacts/${encodeURIComponent(p.hs_name)}`);
  const row = plan.find((x) => x.p.hs_name === p.hs_name);
  const okText = back.description === next;
  // THE APPEND ASSERTION: the words that were there before must still be there. A patch that
  // replaced instead of appending would satisfy `okText` and would have destroyed the backbone
  // convention this tool exists not to destroy.
  const okKept = !row.existing || String(back.description || '').includes(row.existing);
  if (okText && okKept) confirmed++; else { if (!okText) wrong++; if (!okKept) lost++; }
  console.log(`  ${okText && okKept ? 'CONFIRMED' : 'PROBLEM  '} ${p.hs_name}`);
  if (!okText) {
    console.log(`      portal holds: ${JSON.stringify(String(back.description).slice(0, 200))}`);
    console.log(`      sent:         ${JSON.stringify(next.slice(0, 200))}`);
  }
  if (!okKept) console.log(`      ! THE PRIOR TEXT IS GONE. This tool appends; a replacement here would have erased the backbone convention.`);
  // AND THE THINGS THIS TOOL MUST NOT HAVE CHANGED, checked on the same read.
  const src = defs.properties.find((x) => x.hs_name === p.hs_name);
  if (back.name !== p.hs_name) console.log(`      ! NAME CHANGED to ${back.name}`);
  if (back.type !== src.type || back.fieldType !== src.fieldType) console.log(`      ! TYPE CHANGED to ${back.type}/${back.fieldType}`);
  if (back.groupName !== (live.get(p.hs_name) || {}).groupName) console.log(`      ! GROUP CHANGED to ${back.groupName}`);
}

console.log(`\npatched ${patched.length} of ${plan.length}; read back CONFIRMED ${confirmed}, text MISMATCH ${wrong}, prior text LOST ${lost}.`);
if (wrong || lost || patched.length !== plan.length) {
  console.error('STOP — not every intended patch is confirmed live on the portal with its prior text intact.');
  process.exitCode = 3;
}
