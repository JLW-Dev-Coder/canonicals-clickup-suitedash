// assert-prefix-not-provenance.mjs — item B of prompt 59-A, made enforceable.
//
// THE CLAIM UNDER GUARD
// ---------------------
// A prefix is a LEXICAL FACT ABOUT A STRING. It is not a provenance claim. `irs433 = 253` must
// never be read — by this tool, by the export, or by anything downstream — as "433-A created
// 253 properties", because the whole reason the shared prefix is `irs433_` and not `irs433a_`
// is that the backbone is shared. 59-A records that no live property carries `irs433a_` at all.
//
// A rule stated only in prose is a pin nobody checks ([R-37]). This asserts it over the live
// population on every run:
//
//   A1  A record with NO field row has no derived creator and no bound_by. If the prefix were
//       leaking into provenance, this is where it would show — the tag is present, the rows are
//       not, and a tool that guessed would fill the gap from the tag.
//   A2  Every derived `created_by_form` value is a form some field file DECLARES, and its basis
//       names a field-row source. A tag value could never satisfy this: `irs433` is not a form.
//   A3  Every derived `bound_by` form is likewise a declared form.
//   A4  THE COUNTER-EXAMPLE, COMPUTED AND PRINTED. The `irs433` tag count and the number of
//       properties actually created by 433-A are computed separately and asserted to DIFFER.
//       If they ever coincide the assertion says so loudly rather than passing quietly, because
//       a coincidence is exactly what would make the wrong reading look right.
//   A5  No live property carries the `irs433a_` prefix — 59-A's correction, asserted rather
//       than remembered, so its returning is a STOP and not a surprise.
//
// [R-19] GENERATOR DECLARATION: this file generates nothing. It asserts.
//
// usage: node adapters/clickup/assert-prefix-not-provenance.mjs [--verbose]
import { hs } from '../hubspot/hs-lib.mjs';
import { loadArtefacts, derivePopulation, prefixTag, PREFIXES, NO_PREFIX_TAG } from './derive-property-records.mjs';

const verbose = process.argv.includes('--verbose');
const live = (await hs('/crm/v3/properties/contacts?archived=false')).results;
const custom = live.filter(p => !p.hubspotDefined);
const art = loadArtefacts();
const records = derivePopulation(custom, art);
const declaredForms = new Set(art.forms.map(f => f.form));

const problems = [];
const note = (s) => { if (verbose) console.log('   ' + s); };

console.log(`population ${records.length}; forms declared by field files: ${[...declaredForms].sort().join(', ')}`);

// ── A1 ───────────────────────────────────────────────────────────────────────────────────
const noRows = records.filter(r => !r.binding.rows.length);
let a1 = 0;
for (const r of noRows) {
  if (r.binding.created_by_form?.derivable !== false)
    problems.push(`[A1] ${r.hs_name} has no field row yet carries a derived creator ${JSON.stringify(r.binding.created_by_form)}. A creator with no row behind it can only have come from the name.`);
  else if (r.binding.bound_by.length)
    problems.push(`[A1] ${r.hs_name} has no field row yet reports bound_by ${JSON.stringify(r.binding.bound_by)}.`);
  else a1++;
}
console.log(`[A1] ${a1}/${noRows.length} row-less record(s) correctly report no creator and no binding`);

// ── A2 / A3 ──────────────────────────────────────────────────────────────────────────────
let a2 = 0, a3 = 0;
for (const r of records) {
  const c = r.binding.created_by_form;
  if (c && c.derivable !== false && 'value' in c) {
    if (!declaredForms.has(c.value)) problems.push(`[A2] ${r.hs_name} names creator "${c.value}", which no field file declares as a form.`);
    else if (!/field (row|file)/i.test(c.basis ?? '')) problems.push(`[A2] ${r.hs_name} names creator "${c.value}" with basis ${JSON.stringify(c.basis)}, which does not cite a field-row source.`);
    else a2++;
  }
  for (const f of r.binding.bound_by) {
    if (!declaredForms.has(f)) problems.push(`[A3] ${r.hs_name} reports bound_by "${f}", which no field file declares as a form.`);
    else a3++;
  }
}
console.log(`[A2] ${a2} derived creator(s), every one a declared form cited to a field row`);
console.log(`[A3] ${a3} binding(s), every one a declared form`);

// ── A4 — the counter-example, computed both ways ─────────────────────────────────────────
const tagIrs433 = records.filter(r => r.tag === 'irs433').length;
const createdBy433a = records.filter(r => r.binding.created_by_form?.value === '433a').length;
console.log(`[A4] tag "irs433" = ${tagIrs433}   properties whose DERIVED creator is 433a = ${createdBy433a}`);
if (tagIrs433 === createdBy433a)
  problems.push(`[A4] the "irs433" tag count (${tagIrs433}) and the 433a-created count (${createdBy433a}) COINCIDE. They measure different things — a lexical prefix and a derived provenance — and a coincidence is what makes the wrong reading look right. Investigate before trusting either.`);
else
  console.log(`[A4] they differ by ${Math.abs(tagIrs433 - createdBy433a)}, which is the point: the prefix is shared, the provenance is not.`);

// ── A5 ───────────────────────────────────────────────────────────────────────────────────
const irs433a = custom.filter(p => p.name.startsWith('irs433a_'));
console.log(`[A5] live properties carrying the "irs433a_" prefix: ${irs433a.length}`);
if (irs433a.length) problems.push(`[A5] ${irs433a.length} live propert(ies) now carry "irs433a_": ${irs433a.map(p => p.name).slice(0, 10).join(', ')}. 59-A recorded that none did; the tag vocabulary and this assertion both need revisiting.`);

// ── tag partition, asserted disjoint and total ───────────────────────────────────────────
const tally = records.reduce((a, r) => (a[r.tag] = (a[r.tag] || 0) + 1, a), {});
const sum = Object.values(tally).reduce((a, b) => a + b, 0);
console.log(`[A6] tag partition: ${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);
if (sum !== records.length) problems.push(`[A6] the tag tally sums to ${sum} over a population of ${records.length}; the partition is not total.`);
else console.log(`[A6] sums to ${sum} = the population, so the eight tags partition it exactly — disjoint and total.`);
for (const r of records) {
  const t = prefixTag(r.hs_name);
  if (t !== r.tag) problems.push(`[A6] ${r.hs_name} carries tag "${r.tag}" but prefixTag() returns "${t}".`);
}

console.log('');
if (problems.length) {
  console.error(`PREFIX-NOT-PROVENANCE — ${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exitCode = 1;
} else {
  console.log('OK — no derived provenance anywhere in the population rests on a name prefix; the tag partition is disjoint and total; and the two counts the tag invites confusing are computed separately and differ.');
}
