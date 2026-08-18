// Apply a crosswalk's `option_extensions` — new option VALUES on a property that already exists.
//
//   node adapters/hubspot/hs-extend-options.mjs <form>            dry run, prints the plan
//   node adapters/hubspot/hs-extend-options.mjs <form> --apply    writes
//
// WHY THIS IS A SEPARATE, ADDITIVE-ONLY STEP
// ------------------------------------------
// A later form in the series can need a value an earlier form never printed. 433-A prints four
// pay-period boxes — weekly, bi-weekly, monthly, other — so irs433_tp_pay_period was
// provisioned with exactly those. 433-F prints Weekly / Biweekly / Semi-monthly / Monthly. It
// has a box the property cannot express and no box for the one value the property has spare.
//
// The alternative to extending is a second pay-period property, which is precisely the
// per-form duplication the reset existed to end. So the property is extended.
//
// ADDITIVE ONLY, AND ENFORCED RATHER THAN INTENDED. HubSpot's PATCH replaces the whole option
// list, so sending a short list DELETES options — and a deleted option is not a schema change
// you notice, it is every record holding that value quietly failing to resolve. This script
// therefore reads the live list, appends, and refuses to write if the result does not contain
// every value that was already there. It never reorders and never relabels.

import { readFileSync } from 'fs';
import { hs } from './hs-lib.mjs';

const form = process.argv[2];
const apply = process.argv.includes('--apply');
if (!form) {
  console.error('usage: node adapters/hubspot/hs-extend-options.mjs <form> [--apply]');
  process.exit(2);
}

const xw = JSON.parse(readFileSync(`adapters/hubspot/crosswalk.${form}.json`, 'utf8'));
const extensions = xw.option_extensions || [];
if (!extensions.length) {
  console.log(`crosswalk.${form}.json declares no option extensions. Nothing to do.`);
  process.exit(0);
}

console.log(`${apply ? 'APPLY' : 'DRY RUN'} — ${extensions.length} option extension(s) from crosswalk.${form}.json`);
console.log('');

let changed = 0;
let already = 0;
for (const ext of extensions) {
  const live = await hs(`/crm/v3/properties/contacts/${ext.hs_name}`);
  const have = (live.options || []).map((o) => ({
    label: o.label,
    value: String(o.value),
    displayOrder: o.displayOrder,
    hidden: !!o.hidden,
  }));
  const haveValues = new Set(have.map((o) => o.value));

  const missing = ext.add.filter((a) => !haveValues.has(String(a.value)));
  console.log(`${ext.hs_name}  [${have.map((o) => o.value).join(', ')}]`);
  if (!missing.length) {
    console.log('  already carries every option in the extension — skipped');
    already++;
    continue;
  }

  // Appended at the end. Reordering an option list is cosmetic in the portal and invisible in
  // the API, but it is also a change nobody asked for, so it is not made.
  let next = Math.max(-1, ...have.map((o) => o.displayOrder ?? -1)) + 1;
  const merged = [...have, ...missing.map((a) => ({ label: a.label, value: String(a.value), displayOrder: next++, hidden: false }))];

  // The guard. A PATCH that drops an existing option is silent data loss, so it is checked
  // against the list that was actually read back, not against what this script meant to send.
  const lost = [...haveValues].filter((v) => !merged.some((o) => o.value === v));
  if (lost.length) {
    console.error(`  REFUSING — the merged list would drop existing option(s): ${lost.join(', ')}`);
    process.exit(3);
  }

  console.log(`  + ${missing.map((a) => a.value).join(', ')}   (why: ${ext.why.split('.')[0]}.)`);
  console.log(`  result: [${merged.map((o) => o.value).join(', ')}]`);
  if (apply) {
    await hs(`/crm/v3/properties/contacts/${ext.hs_name}`, { method: 'PATCH', body: { options: merged } });
    console.log('  written');
  }
  changed++;
}

console.log('');
console.log(`${changed} property/ies ${apply ? 'extended' : 'would be extended'}, ${already} already current.`);
if (!apply && changed) console.log('Re-run with --apply to write.');
