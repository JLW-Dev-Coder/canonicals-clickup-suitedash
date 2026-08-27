// THE TWIN CHECK'S MISSING UNIVERSE — A REUSE ROW THAT DECLINED A LIVE PROPERTY. [D-28]
//
// CLI:  node adapters/hubspot/twin-check.mjs [--canary] [--verbose]
// Exit: 0 = every reuse row that declined a live `irs433_<fact>` carries a ruling naming it,
//           every ruling names a property that is live, and the canary is live
//       2 = a decline is unruled, a ruling is stale or empty, or the canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT WAS MISSING AND WHY NOTHING COULD SEE IT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Each `derive-names-<form>.mjs` carries assertion A8, the twin table: for every derived name,
// is the shared twin `irs433_<fact>` already live on the backbone? Its universe is
// FORM-SPECIFIC rows — `if (d.scope !== 'form-specific') continue;` — on the reasoning that a
// REUSE has already been adjudicated, because it names its target in the entry's own `reuse_of`
// and A9R asserts that target is live and type-compatible.
//
// A REUSE NAMES THE PROPERTY IT TAKES AND SAYS NOTHING ABOUT THE ONES IT DID NOT. That is the
// whole of [D-28]. On 433-D, `433d_tin_ein` binds `irs433boi_employer_identification_number`
// while the portal ALSO holds `irs433_employer_identification_number`, contributed by 433-A
// line 54 and 433-A(OIC) s4_business_ein. Two live properties, names differing by one prefix
// segment, and the entry recorded a reason for the one it took and no reason for declining the
// other. A8 could not raise it because the row is a reuse; the reclassifier could not raise it
// either, because its token matcher scores `433d_tin_ein` against "employer identification
// number" below the 0.25 threshold. It was surfaced by the DRY RUN's twin table, which reads
// the portal and does not care what scope a row declares.
//
// THE COST OF GETTING ONE WRONG IS NOT A COLLISION. It is a wrong value read back forever under
// a name that denies it — a corporation's switchboard number stored in `irs433_home_phone` and
// read back as a natural person's home line, with nothing recording that it came from a form
// that does not know whose phone it is. [R-29] is that licensing is not obligation: a coinciding
// subject says which reuses are PERMISSIBLE and compels none of them.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT [D-28] PREDICTED, AND WHAT WIDENING THE UNIVERSE ACTUALLY FOUND
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The item says, under `where_it_would_have_been_caught_earlier`:
//
//     "433-B is the only other form with a reuse bucket; its nine reuses all bind irs433boi_
//      names whose irs433_<fact> twins do not exist, so the question never arose and the gap
//      never showed."
//
// THAT IS WRONG, AND IT WAS WRONG WHEN IT WAS WRITTEN. Five of 433-B's nine reuses have a live
// `irs433_<fact>` twin, every one of them contributed by 433-A and/or 433-A(OIC), both of which
// were provisioned before 433-B:
//
//     s1_business_name                  binds irs433boi_business_name
//                                       declines irs433_business_name            (433a+433aoi)
//     s1_ein                            binds irs433boi_employer_identification_number
//                                       declines irs433_employer_identification_number
//                                                                                (433a+433aoi)
//     s1_number_of_employees            binds irs433boi_total_number_of_employees
//                                       declines irs433_total_number_of_employees (433a+433aoi)
//     s1_frequency_of_tax_deposits      binds irs433boi_frequency_of_tax_deposits
//                                       declines irs433_frequency_of_tax_deposits (433a+433aoi)
//     s3_15_federal_government_contractor  binds irs433boi_federal_contractor
//                                       declines irs433_federal_contractor              (433a)
//
// So the gap did not "only open on the second form to do a thing". It opened on the FIRST form
// with a reuse bucket, stood through that form's provisioning, and was then described as absent
// there by the item that found it on the second. [R-02]: a correction is a claim, and this one
// is derived — the derivation is `deriveBackbone` below over the committed definition files,
// re-run on every invocation, not a reading taken once and quoted.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT COUNTS AS A RULING
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A STRUCTURE THE DERIVER READS, never prose it matches. [D-29] is the other half of the same
// lesson one file over: a count read out of English is a count that can be argued with, and a
// ruling recognised by matching English is a ruling that can be faked by a sentence that
// happens to contain a name. So the classification entry carries:
//
//     "rejected_candidates": [ { "name": "irs433_<fact>", "why": "<the ruling>" } ]
//
// and the check asks for the twin BY NAME in that array. Both directions are asserted, on
// [SB-26]'s shape: a decline with no ruling is a STOP, and a ruling naming a property that no
// reuse row on this form declined is a STOP too — a stale ruling reads exactly like a live one.

import { readFileSync, readdirSync, existsSync } from 'node:fs';

const HS = 'adapters/hubspot';

/**
 * Every shared `irs433_` name any form's committed definitions create, with its contributors.
 *
 * AN UNREADABLE DEFINITIONS FILE IS A THROW, NOT A `continue`. Skipping one would shrink the
 * backbone silently, and a smaller backbone means fewer live twins, which means fewer declines
 * found — the check would report cleaner the more of its input it could not read. That is the
 * shape [R-04] refuses and the shape a `catch { continue; }` here would have had.
 */
export const deriveBackbone = ({ exclude = [] } = {}) => {
  const backbone = new Map();
  const files = readdirSync(HS)
    .filter((f) => /^fields\.\w+\.json$/.test(f) && f !== 'fields.registry.json' && !exclude.includes(f))
    .sort();
  for (const file of files) {
    const form = file.replace(/^fields\./, '').replace(/\.json$/, '');
    let doc;
    try { doc = JSON.parse(readFileSync(`${HS}/${file}`, 'utf8')); }
    catch (e) { throw new Error(`STOP - ${HS}/${file} could not be read as JSON (${e.message}). The backbone is derived from these files and an unreadable one makes every twin verdict weaker without saying so.`); }
    for (const p of (doc.properties || []))
      if (String(p.hs_name).startsWith('irs433_'))
        backbone.set(p.hs_name, [...(backbone.get(p.hs_name) || []), form]);
  }
  return { backbone, files };
};

/** Read one entry's rulings. Returns { rulings: Map<name, why>, problems: [] }. */
export const readRejected = (entry, entryId) => {
  const rulings = new Map();
  const problems = [];
  const rc = entry?.rejected_candidates;
  if (rc === undefined) return { rulings, problems };
  if (!Array.isArray(rc)) {
    problems.push(`entry ${entryId} declares \`rejected_candidates\` as ${typeof rc}, not an array. It is read by a check and must be a list of { name, why }.`);
    return { rulings, problems };
  }
  for (const [i, r] of rc.entries()) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) { problems.push(`entry ${entryId} rejected_candidates[${i}] is not an object.`); continue; }
    if (typeof r.name !== 'string' || !r.name.trim()) { problems.push(`entry ${entryId} rejected_candidates[${i}] declares no \`name\`. A ruling that does not name the property it declines rules on nothing.`); continue; }
    if (typeof r.why !== 'string' || r.why.trim().length < 40) { problems.push(`entry ${entryId} rejected_candidates[${i}] ("${r.name}") declares a \`why\` of ${typeof r.why === 'string' ? r.why.trim().length : 0} character(s). A ruling is a reason; an empty one is the silence this check exists to refuse.`); continue; }
    if (rulings.has(r.name)) { problems.push(`entry ${entryId} rules on "${r.name}" twice. Two reasons for one decline is two answers to one question.`); continue; }
    rulings.set(r.name, r.why);
  }
  return { rulings, problems };
};

/**
 * The widened universe: EVERY row, with reuse rows required to rule on the twin they declined.
 *
 *   derived     rows carrying { key, fact, scope, hs_name, entry }
 *   backbone    Map<irs433_name, contributors[]>
 *   entryById   Map<entryId, classification entry>
 *
 * Returns { rows, stops }. The caller raises each stop through its own STOP().
 */
export const auditReuseTwins = ({ form, derived, backbone, entryById }) => {
  const rows = [];
  const stops = [];
  const declinedOnThisForm = new Map();   // twin -> [keys], for the staleness direction

  for (const d of derived) {
    if (d.scope !== 'reuse') continue;
    const twin = `irs433_${d.fact}`;
    const entry = entryById.get(d.entry);
    const { rulings, problems } = readRejected(entry, d.entry);
    stops.push(...problems);

    if (twin === d.hs_name) {
      rows.push({ key: d.key, entry: d.entry, binds: d.hs_name, twin, verdict: 'binds the twin itself', ruled: null });
      continue;
    }
    if (!backbone.has(twin)) {
      rows.push({ key: d.key, entry: d.entry, binds: d.hs_name, twin, verdict: 'no live twin', ruled: null });
      continue;
    }
    // A LIVE PROPERTY WAS DECLINED. The entry owes a ruling naming it.
    declinedOnThisForm.set(twin, [...(declinedOnThisForm.get(twin) || []), d.key]);
    const why = rulings.get(twin);
    rows.push({ key: d.key, entry: d.entry, binds: d.hs_name, twin,
      contributors: backbone.get(twin), verdict: 'declined a live property', ruled: Boolean(why), why: why || null });
    if (!why)
      stops.push(`"${d.key}" is a REUSE binding "${d.hs_name}", and the shared twin "${twin}" is ALSO live (contributed by ${backbone.get(twin).join('+')}). The entry ${d.entry} records a reason for the property it took and none for the one it declined. Add it to that entry as rejected_candidates: [{ name: "${twin}", why: "..." }] — a reuse names the property it takes and says nothing about the ones it did not, which is [D-28].`);
  }

  // THE OTHER DIRECTION. A ruling for a property nothing on this form declined is stale, and a
  // stale ruling reads exactly like a live one.
  const seenEntries = new Set(derived.map((d) => d.entry));
  for (const id of seenEntries) {
    const { rulings } = readRejected(entryById.get(id), id);
    for (const name of rulings.keys()) {
      if (!declinedOnThisForm.has(name))
        stops.push(`entry ${id} rules against reusing "${name}", and no reuse row on ${form} declines it — either the row moved, the fact was renamed, or the ruling was written for a different cell. A ruling nothing reaches is a ruling nobody is holding to.`);
      else if (!backbone.has(name))
        stops.push(`entry ${id} rules against reusing "${name}", which is not live on the backbone. The ruling declines a property that does not exist.`);
    }
  }

  return { rows, stops };
};

/** The A8R section of a deriver's naming-derivation.md. A zero is PRINTED, never omitted. */
export const reuseTwinReport = (form, rows) => {
  const out = [];
  out.push(`## Assertion A8R — what each reuse DECLINED`);
  out.push('');
  out.push('A8 asks a form-specific row whether the shared `irs433_<fact>` twin is already live. Its universe stopped there, so a REUSE row — which names the property it takes — was never asked about the live near-identical names it passed over. That gap is [D-28]. The cost of the wrong pass is not a collision but a wrong value read back forever under a name that denies it, and [R-29] is that licensing is not obligation.');
  out.push('');
  if (!rows.length) {
    out.push(`**No reuse rows on ${form}.** Zero is printed rather than omitted: this assertion ran and had nothing to look at, which is a different fact from its having passed ([R-04]).`);
    return out;
  }
  const declines = rows.filter((r) => r.verdict === 'declined a live property');
  out.push(`${rows.length} reuse row(s); ${declines.length} declined a live shared twin, ${declines.filter((r) => r.ruled).length} of them ruled by name.`);
  out.push('');
  out.push('| input key | binds | shared twin | twin contributed by | verdict | ruled |');
  out.push('|---|---|---|---|---|---|');
  for (const r of rows)
    out.push(`| \`${r.key}\` | \`${r.binds}\` | \`${r.twin}\` | ${(r.contributors || []).join(', ') || '—'} | ${r.verdict} | ${r.ruled === null ? '—' : r.ruled ? `yes, at ${r.entry}` : '**NO — STOP**'} |`);
  return out;
};

// ---------------------------------------------------------------------------------------
// THE CANARY. Every direction planted, INCLUDING the old universe re-run over the case it
// could not see — [R-12]: a refactor of a guard is a change to the guard, so the fix is
// required to demonstrate the class it fixes rather than to assert it.
// ---------------------------------------------------------------------------------------
const OLD_UNIVERSE = (derived) => derived.filter((d) => d.scope === 'form-specific');

export const runCanary = () => {
  const dead = [];
  const backbone = new Map([
    ['irs433_employer_identification_number', ['433a', '433aoi']],
    ['irs433_tp_ssn_itin', ['433a']],
  ]);
  const RULING = 'The shared name holds the EIN of a business a natural person owns; this form\'s subject IS the entity, so one property would have to hold both at one moment.';

  const case_ = (name, derived, entries, wantStops) => {
    const entryById = new Map(Object.entries(entries));
    const { stops } = auditReuseTwins({ form: 'canary', derived, backbone, entryById });
    const got = stops.length;
    if (got !== wantStops) dead.push(`CANARY DEAD  ${name}: ${got} stop(s), expected ${wantStops}. ${stops.join(' | ')}`);
    return stops;
  };

  // 1  a decline WITH a ruling naming the twin is accepted
  case_('a decline with a ruling naming the twin is accepted',
    [{ key: 'k1', fact: 'employer_identification_number', scope: 'reuse', hs_name: 'irs433boi_employer_identification_number', entry: 'E1' }],
    { E1: { rejected_candidates: [{ name: 'irs433_employer_identification_number', why: RULING }] } }, 0);

  // 2  [D-28] ITSELF — a decline with NO ruling, and the refusal must NAME the key and the twin
  const s2 = case_('[D-28] a decline with no ruling is refused',
    [{ key: 'k2', fact: 'employer_identification_number', scope: 'reuse', hs_name: 'irs433boi_employer_identification_number', entry: 'E2' }],
    { E2: {} }, 1);
  if (s2[0] && !(s2[0].includes('k2') && s2[0].includes('irs433_employer_identification_number')))
    dead.push('CANARY DEAD  [D-28] a decline with no ruling: the refusal does not name both the key and the declined property. A planted defect must be found BY NAME.');

  // 3  a ruling naming a DIFFERENT property does not discharge this decline, and is itself stale
  case_('a ruling naming another property leaves the decline unruled AND is stale',
    [{ key: 'k3', fact: 'employer_identification_number', scope: 'reuse', hs_name: 'irs433boi_employer_identification_number', entry: 'E3' }],
    { E3: { rejected_candidates: [{ name: 'irs433_tp_ssn_itin', why: RULING }] } }, 2);

  // 4  a ruling with an empty reason is not a ruling
  case_('an empty reason is refused, and the decline stays unruled',
    [{ key: 'k4', fact: 'employer_identification_number', scope: 'reuse', hs_name: 'irs433boi_employer_identification_number', entry: 'E4' }],
    { E4: { rejected_candidates: [{ name: 'irs433_employer_identification_number', why: '' }] } }, 2);

  // 5  a reuse row that BINDS the twin declined nothing
  case_('a reuse binding the shared name itself declines nothing',
    [{ key: 'k5', fact: 'tp_ssn_itin', scope: 'reuse', hs_name: 'irs433_tp_ssn_itin', entry: 'E5' }], { E5: {} }, 0);

  // 6  a reuse row with no live twin declined nothing
  case_('a reuse with no live twin declines nothing',
    [{ key: 'k6', fact: 'county_of_business_location', scope: 'reuse', hs_name: 'irs433boi_county_of_business_location', entry: 'E6' }], { E6: {} }, 0);

  // 7  a form-specific row is not this check's business — the OLD A8 still owns it
  case_('a form-specific row is left to A8',
    [{ key: 'k7', fact: 'employer_identification_number', scope: 'form-specific', hs_name: 'irs433d_employer_identification_number', entry: 'E7' }], { E7: {} }, 0);

  // AND THE OLD UNIVERSE, RE-RUN OVER CASE 2, REQUIRED TO BE BLIND TO IT.
  const case2 = [{ key: 'k2', fact: 'employer_identification_number', scope: 'reuse', hs_name: 'irs433boi_employer_identification_number', entry: 'E2' }];
  if (OLD_UNIVERSE(case2).length !== 0)
    dead.push('CANARY DEAD  the old form-specific-only universe was expected to contain none of case 2, and it contained some. The record of [D-28] has drifted from the defect.');

  return { planted: 7, dead };
};

// ---------------------------------------------------------------------------------------
// THE RUN — over every committed definitions file, so the check has a whole-tree reading of
// its own and is not only reachable through the four derivers.
// ---------------------------------------------------------------------------------------
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('twin-check.mjs');
if (isMain) {
  const VERBOSE = process.argv.includes('--verbose');
  console.log('reuse-twin check — every REUSE row asked what it declined, not only what it took. [D-28]');

  const { planted, dead } = runCanary();
  console.log(`  canary: ${planted} planted case(s) — a ruled decline accepted; an UNRULED decline refused by name; a ruling for another property, an empty reason, a stale ruling each refused; a reuse binding the shared name and a reuse with no live twin each left alone; a form-specific row left to A8; and the old form-specific-only universe re-run and required to be blind to the unruled decline.`);
  for (const d of dead) console.error(`  ${d}`);

  const { backbone, files } = deriveBackbone();
  if (backbone.size < 50) { console.error(`  STOP  the backbone read only ${backbone.size} shared irs433_ name(s) across ${files.length} definition file(s). Refusing to run against an input this file could not read.`); process.exit(2); }
  console.log(`  backbone: ${backbone.size} shared irs433_ name(s) across ${files.length} definition file(s) — derived, never listed`);

  const allStops = [];
  let examined = 0, declines = 0;
  for (const file of files) {
    const form = file.replace(/^fields\./, '').replace(/\.json$/, '');
    const doc = JSON.parse(readFileSync(`${HS}/${file}`, 'utf8'));
    const derived = (doc.properties || []).filter((p) => p.scope === 'reuse');
    examined += derived.length;
    // NO EXAMINED LINE ON A FORM WITH NO REUSE ROWS, AND THE ABSENCE IS DECLARED RATHER THAN
    // PRINTED AS A ZERO. assert-examined.mjs registers this guard with an `onlyWhen` that asks
    // the same question of the same file, so a form joins the matrix the day it gains a reuse
    // row and nothing here is edited. The zero is still SAID, on the line below, because a form
    // this check had nothing to look at is a different fact from a form it passed ([R-04]).
    if (!derived.length) { console.log(`  ${form.padEnd(7)} 0 reuse row(s) — nothing for this check to look at, which is not a pass`); continue; }
    console.log(`EXAMINED twin-check ${form} ${derived.length} reuse-rows`);
    const clsPath = `adapters/pdf/maps/${form}.crosswalk-classification.json`;
    if (!existsSync(clsPath)) { allStops.push(`${form} has ${derived.length} reuse row(s) and no classification file at ${clsPath} for a ruling to live in.`); continue; }
    const cls = JSON.parse(readFileSync(clsPath, 'utf8'));
    const entryById = new Map((cls.entries || []).map((e) => [e.id, e]));
    const { rows, stops } = auditReuseTwins({ form, derived, backbone, entryById });
    allStops.push(...stops);
    const d = rows.filter((r) => r.verdict === 'declined a live property');
    declines += d.length;
    console.log(`  ${form.padEnd(7)} ${derived.length} reuse row(s), ${d.length} declined a live shared twin, ${d.filter((r) => r.ruled).length} ruled`);
    if (VERBOSE) for (const r of rows)
      console.log(`      ${r.key.padEnd(38)} ${r.binds.padEnd(46)} twin ${r.twin.padEnd(44)} ${r.verdict}${r.ruled === null ? '' : r.ruled ? ' — RULED at ' + r.entry : ' — UNRULED'}`);
  }

  for (const s of allStops) console.error(`  STOP  ${s}`);
  if (dead.length || allStops.length) {
    console.error(`\nREUSE-TWIN CHECK FAILED — ${dead.length} dead canary case(s), ${allStops.length} problem(s).`);
    process.exit(2);
  }
  console.log(`\nREUSE-TWIN CHECK PASSED — ${examined} reuse row(s) examined across ${files.length} form(s), ${declines} declined a live shared property and every one of them carries a ruling naming it, ${planted} canary case(s) live.`);
}
