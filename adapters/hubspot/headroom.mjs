// HEADROOM AS A PLANNING CONSTRAINT, PROJECTED BEFORE THE FIRST NAME IS DERIVED.
//
//   node adapters/hubspot/headroom.mjs                  # the portal figure and every form's cost
//   node adapters/hubspot/headroom.mjs --project <form> # what an UNCLASSIFIED form would cost
//   node adapters/hubspot/headroom.mjs --canary         # prove the arithmetic can be wrong
//
//   exit 0 = the figure was read from the portal and every projection fits
//   exit 2 = a projection exceeds the headroom, or the portal could not be read
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — [R-32]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Headroom has been CHECKED since [R-23]: A12 in each deriver reads the live custom-property
// count and refuses a pass that would cross the ceiling. A check is the right instrument at the
// moment of creating a name and it is the WRONG one for deciding whether to start.
//
// The check answers "may I create this name". It answers it property by property, after the
// crosswalk exists, after the classification exists, after the names are derived — by which
// point the work of deciding what the properties ARE is done. A form that turns out not to fit
// is then a partial provisioning run, and a partial run against a portal that will not free a
// name is the one outcome nothing can undo.
//
// So the figure is also PROJECTED: before a form is classified, from what the form itself
// declares, as a BOUND rather than a count. A bound that fits is permission to proceed. A bound
// that does not fit is a decision for Principal and not a smaller provisioning run.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CEILING IS DOCUMENTED, NOT PROBED — AND THAT IS SAID PLAINLY
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// hs-preflight.mjs probes four endpoints for the numeric ceiling and all four 404. HubSpot
// publishes the number only inside the 400 returned by a create that would cross it, so nothing
// short of crossing it reads it. The figure used here is the DOCUMENTED 1,000 custom properties
// per object for this tier, it is a constant declared once below, and every arithmetic in this
// file names it. If it is wrong, it is wrong in one place.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A PROJECTION IS A BOUND, AND ITS UNIVERSE IS DECLARED [R-07]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// For a CLASSIFIED form the cost is not a projection at all: fields.<form>.json holds the
// definitions and `hs-dryrun-<form>.mjs` says which of them exist. Those are counted, not guessed.
//
// For an UNCLASSIFIED form — one with a map and an enumeration and no crosswalk yet, which is
// what 433-D is in this cycle — the only honest figure is an UPPER BOUND, and it is built from
// two numbers the form itself yields:
//
//   stems        the distinct leaf stems the enumeration finds. One property per stem is the
//                MOST a form can cost; a stem bound to two printed cells (a mirror) still costs
//                one, which is why the bound is over stems and not over fields.
//   coincident   the subjects the register says this form COINCIDES with. [R-29] is the rule
//                that governs how this number is read: a coinciding subject says which reuses
//                are PERMISSIBLE and NOTHING about how many there will be. 433-B and 433-B(OIC)
//                coincide and nine of 116 keys reused. So coincidence LOOSENS the bound at its
//                bottom end and does not move the top, and this file reports the top.
//
// THE BOUND IS THEREFORE `stems`, AND THE FLOOR IS ZERO. Both are printed. A file that printed
// a single "expected" number between them would be inventing a reuse rate, which is precisely
// the over-read [R-29] was written for.

import { readFileSync, existsSync } from 'node:fs';
import { MAPPED_FORMS } from '../pdf/resolve-fixture.mjs';

// THE ONE PLACE THE CEILING IS WRITTEN. Everything below names this constant.
export const CEILING = 1000;
export const CEILING_BASIS = 'the documented 1,000 custom properties per object for this tier. hs-preflight.mjs probes four endpoints for a live figure and all four 404; HubSpot publishes the number only inside the 400 from a create that would cross it.';

const argv = process.argv.slice(2);

export const portalCustomCount = async () => {
  const { hs } = await import('./hs-lib.mjs');
  const r = await hs('/crm/v3/properties/contacts?archived=false');
  const all = r.results || [];
  const custom = all.filter((p) => !p.hubspotDefined);
  return { total: all.length, custom: custom.length, names: custom.map((p) => p.name) };
};

/** What a CLASSIFIED form costs: its definitions, split by whether the portal already holds them. */
export const classifiedCost = (form, liveNames) => {
  const defs = `adapters/hubspot/fields.${form}.json`;
  if (!existsSync(defs)) return { form, state: 'no definitions file', cost: null };
  let doc;
  try { doc = JSON.parse(readFileSync(defs, 'utf8')); } catch (e) { return { form, state: `definitions will not parse: ${e.message}`, cost: null }; }
  // The definitions are held under whichever key the generator chose; both shapes are read and a
  // file matching neither is REPORTED, never counted as zero. A form costing zero because this
  // file could not find its list is the vacuous pass [R-04] names.
  const list = Array.isArray(doc.properties) ? doc.properties : Array.isArray(doc.definitions) ? doc.definitions : Array.isArray(doc.fields) ? doc.fields : null;
  if (!list) return { form, state: `definitions file holds no array under properties/definitions/fields — its shape is ${Object.keys(doc).join(', ')}`, cost: null };
  const names = list.map((d) => d.name ?? d.hs_name ?? d.property ?? null);
  const unnamed = names.filter((n) => !n).length;
  const live = names.filter((n) => n && liveNames.has(n)).length;
  return { form, state: 'classified', declared: list.length, live, cost: list.length - live - unnamed, unnamed };
};

/** What an UNCLASSIFIED form could cost at most: one property per distinct leaf stem. */
export const projectedBound = (form) => {
  const fieldsPath = `adapters/pdf/maps/${form}.fields.json`;
  if (!existsSync(fieldsPath)) return { form, state: `no enumeration at ${fieldsPath}, so there is nothing to project from. A form with no enumeration has no bound, not a bound of zero.`, bound: null };
  let doc;
  try { doc = JSON.parse(readFileSync(fieldsPath, 'utf8')); } catch (e) { return { form, state: `enumeration will not parse: ${e.message}`, bound: null }; }
  const rows = Array.isArray(doc) ? doc : (doc.fields || doc.results || null);
  if (!Array.isArray(rows)) return { form, state: `enumeration holds no field array — its shape is ${Object.keys(doc).join(', ')}`, bound: null };
  // THE STEM IS THE LAST NAMED COMPONENT OF THE FULL FIELD PATH, WITHOUT ITS OCCURRENCE INDEX.
  // Two printed copies of one fact share a stem and cost ONE property, which is the whole reason
  // the bound is taken over stems rather than over the 168 fields a mirrored form enumerates.
  const stemOf = (name) => String(name).split('.').pop().replace(/\[\d+\]$/, '');
  const stems = new Set(rows.map((r) => stemOf(r.name ?? r.fullName ?? r.field ?? '')).filter(Boolean));
  return { form, state: 'unclassified', fields: rows.length, bound: stems.size, floor: 0 };
};

export const subjectVerdicts = (form) => {
  const p = 'adapters/pdf/maps/_subjects.cross-form.json';
  if (!existsSync(p)) return null;
  try {
    const doc = JSON.parse(readFileSync(p, 'utf8'));
    const pairs = doc.pairs || doc.verdicts || null;
    if (!pairs) return null;
    return Object.entries(pairs).filter(([k]) => k.includes(form)).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : v.verdict ?? JSON.stringify(v).slice(0, 80)}`);
  } catch { return null; }
};

export const report = async () => {
  const problems = [];
  const portal = await portalCustomCount();
  const live = new Set(portal.names);
  const headroom = CEILING - portal.custom;

  console.log('headroom, read from the portal on this run');
  console.log(`  portal holds ${portal.total} contact propert(ies), of which ${portal.custom} are custom`);
  console.log(`  ceiling ${CEILING} — ${CEILING_BASIS}`);
  console.log(`  HEADROOM ${headroom}`);
  console.log('');

  const forms = MAPPED_FORMS();
  console.log(`  every mapped form's cost against that figure (${forms.length} form(s), discovered — never listed here):`);
  for (const f of forms) {
    const c = classifiedCost(f, live);
    if (c.cost === null) { console.log(`    ${f.padEnd(8)} ${c.state}`); problems.push(`UNCOUNTED  ${f}: ${c.state}`); continue; }
    console.log(`    ${f.padEnd(8)} ${String(c.declared).padStart(4)} declared, ${String(c.live).padStart(4)} already live on the portal -> ${c.cost} would be created today`);
  }

  const projectTo = argv.includes('--project') ? argv[argv.indexOf('--project') + 1] : null;
  if (projectTo) {
    console.log('');
    const p = projectedBound(projectTo);
    console.log(`  PROJECTION for ${projectTo} — an UNCLASSIFIED form, so this is a BOUND and not a count:`);
    if (p.bound === null) { console.log(`    ${p.state}`); problems.push(`NO PROJECTION  ${projectTo}: ${p.state}`); }
    else {
      console.log(`    ${p.fields} enumerated field(s) over ${p.bound} distinct leaf stem(s)`);
      console.log(`    UPPER BOUND ${p.bound} new propert(ies) — one per stem, which is the most a form can cost`);
      console.log(`    FLOOR       ${p.floor} — every stem could bind an existing property`);
      console.log('    No single number between the two is printed. A reuse rate invented here is the over-read [R-29] records.');
      const v = subjectVerdicts(projectTo);
      if (v?.length) { console.log('    subject verdicts bearing on which reuses are PERMISSIBLE (they bear on the FLOOR, never on the bound):'); for (const x of v) console.log(`      ${x}`); }
      else console.log('    subject register carries no verdict naming this form yet, so the floor rests on nothing and the bound is the only figure.');
      console.log('');
      if (p.bound > headroom) { console.log(`    STOP — the upper bound ${p.bound} EXCEEDS the headroom ${headroom}. This is a decision for Principal, not a partial provisioning run.`); problems.push(`PROJECTION EXCEEDS HEADROOM  ${projectTo}: bound ${p.bound} against headroom ${headroom}`); }
      else console.log(`    FITS — the upper bound ${p.bound} is within the headroom ${headroom}, leaving at least ${headroom - p.bound} even if NOTHING is reused.`);
    }
  }

  if (problems.length) { console.error(''); for (const x of problems) console.error(`  ${x}`); return problems.length; }
  console.log('');
  // ENCLOSED BY THE FINDING COUNT, not merely placed after the block that accumulates it —
  // `return problems.length` is a jump success-sweep.mjs's JUMPS list cannot see, so the guard
  // above licenses nothing. See the same note in rerun-regression.mjs, which the sweep flagged
  // in the same run for the same reason.
  if (!problems.length) console.log(`OK — headroom ${headroom} read from the portal against a declared ceiling of ${CEILING}.`);
  return problems.length;
};

// ── THE CANARY ─────────────────────────────────────────────────────────────────────────────
//
// The arithmetic here decides whether a permanent provisioning run starts, so the two ways it
// can be silently wrong are planted and asserted: a projection over an enumeration this file
// cannot read must come back NULL rather than ZERO, and a bound larger than the headroom must
// be refused rather than reported as a fit.
export const canary = () => {
  const problems = [];
  const missing = projectedBound('__canary_not_a_form__');
  if (missing.bound !== null) problems.push(`CANARY DEAD  a form with no enumeration projected a bound of ${missing.bound}. A form this file cannot read must yield NO bound, never a bound of zero.`);
  if (CEILING - 0 <= 0) problems.push('CANARY DEAD  the ceiling constant is not a positive number.');
  const fits = (bound, headroom) => bound <= headroom;
  if (fits(101, 100)) problems.push('CANARY DEAD  a bound of 101 was reported as fitting a headroom of 100.');
  if (!fits(100, 100)) problems.push('CANARY DEAD  a bound of 100 was refused against a headroom of 100. The ceiling is inclusive.');
  if (!problems.length) console.log('  canary: 3 of 3 — an unreadable enumeration yields no bound, an over-large bound is refused, and an exactly-fitting bound is accepted.');
  return problems;
};

if (process.argv[1] && /headroom\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const pre = argv.includes('--canary') ? canary() : [];
  for (const p of pre) console.error(`  ${p}`);
  report().then((n) => process.exit((n + pre.length) ? 2 : 0)).catch((e) => { console.error(`headroom STOPPED: ${e.message}`); process.exit(2); });
}
