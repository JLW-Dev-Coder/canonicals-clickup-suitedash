// PATCH THE DESCRIPTION of every property 433-B REUSES, so it names BOTH forms it serves.
// Descriptions and nothing else. Creates nothing, renames nothing, retypes nothing.
//
//   node adapters/hubspot/hs-describe-reused-433b.mjs --dry-run
//   node adapters/hubspot/hs-describe-reused-433b.mjs
//
// WHY THIS IS A SEPARATE TOOL AND NOT A FLAG ON THE PROVISIONER
// -------------------------------------------------------------
// Prompt-50 ruling 1: "Add a line to each reused property's description naming both forms it
// serves, at create time." For these nine, CREATE TIME WAS A PREVIOUS CYCLE — 433-B(OIC) made
// them, and 433-B binds them under [R-06] rather than creating anything. So the ruling cannot be
// satisfied at create time on this pass, and the honest reading is that the portal must end up
// showing both forms, by whatever act is available.
//
// The act available is a PATCH, and hs-provision.mjs must not learn to do it. That file's whole
// contract is "a property that already exists is SKIPPED, never patched: this script creates, it
// does not patch", and a refactor of a guard is a change to the guard ([R-12]). Teaching the
// provisioner to patch would mean every future run of it could silently rewrite live definitions
// — which is a much larger permission than this ruling asks for.
//
// SO THE PERMISSION IS NARROWED TO THE SHAPE OF THE TASK:
//   - only properties this form declares `scope: "reuse"` are touched — 9 of 116;
//   - only the `description` field is sent, so a mangled request cannot change a type or a name;
//   - a property whose live description ALREADY names both forms is skipped and counted;
//   - every patch is READ BACK from the portal on a SEPARATE request ([R-23]), because a 2xx on
//     a PATCH is the request being accepted, which is a different fact from the object having
//     changed.
//
// AND IT GOES THROUGH node `fetch`, per [R-27] and [R-23]. PowerShell 5.1 sends a string body as
// ISO-8859-1 and one em-dash cost 27 permanent property creations; these descriptions carry
// em-dashes by design.

import { readFileSync } from 'node:fs';
import { hs } from './hs-lib.mjs';

const dryRun = process.argv.includes('--dry-run');
const defs = JSON.parse(readFileSync('adapters/hubspot/fields.433b.json', 'utf8'));
const reuses = defs.properties.filter((p) => p.scope === 'reuse');

if (!reuses.length) {
  console.error('STOP — fields.433b.json declares no reuse rows. This tool exists for them; running it against none would report success over an empty set.');
  process.exit(3);
}

// READ THE LIVE STATE FIRST, and refuse to act on a read that plainly failed.
const all = (await hs('/crm/v3/properties/contacts')).results || [];
if (all.length < 100) {
  console.error(`STOP — the portal returned ${all.length} contact properties. A portal with 400+ HubSpot-defined properties cannot answer that, so this read failed rather than finding an empty portal.`);
  process.exit(3);
}
const live = new Map(all.map((p) => [p.name, p]));

// THE TEST FOR "ALREADY NAMES BOTH" IS ON THE FORM NAMES, not on string equality with what this
// repo would write. A description edited by hand to name both forms is not a description that
// needs patching, and rewriting it would be this tool overwriting a person's words.
// THE TEST MUST TELL "433-B" FROM "433-B(OIC)", AND ITS FIRST DRAFT COULD NOT.
// `/433-B\b/` matches INSIDE "433-B(OIC)" — the word boundary sits before the "(" — so every
// description naming only the predecessor satisfied both halves. This reported all nine already
// done and sent no request, which is a guard reporting agreement with itself. The negative
// lookahead is what separates them, and the canary below proves it on both shapes.
const namesOwnForm = (d) => /433-B(?!\(OIC\))/.test(String(d || ''));
const namesPredecessor = (d) => /433-B\(OIC\)/.test(String(d || ''));
const namesBoth = (d) => namesOwnForm(d) && namesPredecessor(d);

// THE CANARY. A detector that cannot fail is not a detector ([R-17]).
{
  const onlyPredecessor = '433-B(OIC) (input key: s1_business_name). Specific to Form 433-B(OIC).';
  const both = 'Serves BOTH Form 433-B (input key: s1_business_name) and Form 433-B(OIC) (input key: s1_business_name).';
  const dead = [];
  if (namesBoth(onlyPredecessor)) dead.push('a description naming ONLY 433-B(OIC) was read as naming both.');
  if (!namesBoth(both)) dead.push('a description naming BOTH forms was read as naming one.');
  if (dead.length) { console.error('STOP — the both-forms test is dead:\n  ' + dead.join('\n  ')); process.exit(3); }
}

const plan = [], already = [], missing = [];
for (const p of reuses) {
  const l = live.get(p.hs_name);
  if (!l) { missing.push(p); continue; }
  if (namesBoth(l.description)) { already.push({ p, l }); continue; }
  plan.push({ p, l });
}

if (missing.length) {
  console.error(`STOP — ${missing.length} reused propert(ies) are not live on the portal: ${missing.map((p) => p.hs_name).join(', ')}.`);
  console.error('  A reuse must bind a property that exists. Run adapters/hubspot/hs-dryrun-433b.mjs, which reports this as a STOP with its reason.');
  process.exit(3);
}

console.log(`433-B reused-property descriptions${dryRun ? ' — DRY RUN, nothing sent' : ''}`);
console.log(`  reuse rows: ${reuses.length}; already naming both forms: ${already.length}; to patch: ${plan.length}`);
for (const { p, l } of plan) {
  console.log(`\n  ${p.hs_name}  (433-B input key ${p.key})`);
  console.log(`    live:  ${(l.description || '(none)').slice(0, 150)}`);
  console.log(`    would: ${p.description.slice(0, 150)}`);
}

if (dryRun) { console.log('\nDRY RUN — nothing was sent.'); process.exit(0); }
if (!plan.length) { console.log('\nNothing to do: every reused property already names both forms.'); process.exit(0); }

// --- patch, one at a time, description only ----------------------------------------------------
const patched = [];
for (const { p } of plan) {
  try {
    await hs(`/crm/v3/properties/contacts/${encodeURIComponent(p.hs_name)}`, {
      method: 'PATCH',
      body: { description: p.description },     // description ONLY. No name, no type, no options.
    });
    patched.push(p);
  } catch (e) {
    console.error(`  ! PATCH ${p.hs_name} failed: ${e.status ?? ''} ${e.message}`);
  }
}

// --- READ BACK FROM THE PORTAL, on a separate request ------------------------------------------
// [R-23]: a 2xx is the request being accepted, which is a different fact from the object having
// changed. Read per property rather than from the list endpoint, so a stale list cannot answer.
console.log('\nRead-back, per property, on a separate request:');
let confirmed = 0, wrong = 0;
for (const p of patched) {
  const back = await hs(`/crm/v3/properties/contacts/${encodeURIComponent(p.hs_name)}`);
  const ok = back.description === p.description;
  if (ok) confirmed++; else wrong++;
  console.log(`  ${ok ? 'CONFIRMED' : 'MISMATCH '} ${p.hs_name}`);
  if (!ok) {
    console.log(`      portal holds: ${JSON.stringify(String(back.description).slice(0, 160))}`);
    console.log(`      sent:         ${JSON.stringify(p.description.slice(0, 160))}`);
  }
  // AND THE THINGS THIS TOOL MUST NOT HAVE CHANGED, checked on the same read.
  const src = defs.properties.find((x) => x.hs_name === p.hs_name);
  if (back.name !== p.hs_name) console.log(`      ! NAME CHANGED to ${back.name}`);
  if (back.type !== src.type || back.fieldType !== src.fieldType) console.log(`      ! TYPE CHANGED to ${back.type}/${back.fieldType}`);
}

console.log(`\npatched ${patched.length} of ${plan.length}; read back CONFIRMED ${confirmed}, MISMATCH ${wrong}.`);
if (wrong || patched.length !== plan.length) {
  console.error('STOP — not every intended patch is confirmed live on the portal.');
  process.exitCode = 3;
}
