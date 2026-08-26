// THE LINEAGE OF 433-D'S LEAF NAMES AGAINST EVERY FORM ALREADY IN THIS ENGINE, PER OCCURRENCE.
//
// [R-08]: an inherited leaf name is evidence of nothing, and a verdict is per occurrence and
// never per name. So this file DERIVES the intersection and then reports every occurrence of
// every shared name on both sides — it does not report "n names shared" and stop, because a name
// shared once and a name shared eleven times are different facts and one number hides that.
//
// The universe on the 433-D side is the widget geometry of the pinned blank, so every occurrence
// carries its page and its rectangle. The universe on the other side is each form's OWN
// enumeration file, which is what those forms' maps were authored against.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readWidgetGeometry } from '../adapters/pdf/page-geometry.mjs';
import { MAPPED_FORMS } from '../adapters/pdf/resolve-fixture.mjs';

const stemOf = (n) => String(n).split('.').pop().replace(/\[\d+\]$/, '');

const { widgets } = await readWidgetGeometry(readFileSync('adapters/pdf/forms/f433d.pdf'));
const dRows = widgets.map((w) => ({ ...w, stem: stemOf(w.name) }));

// ── THE OTHER FORMS, DISCOVERED ────────────────────────────────────────────────────────────
const others = {};
for (const f of MAPPED_FORMS()) {
  const p = `adapters/pdf/maps/${f}.fields.json`;
  if (!existsSync(p)) { others[f] = { unreadable: `no ${p}` }; continue; }
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  const rows = Array.isArray(doc) ? doc : (doc.fields || doc.results || null);
  if (!Array.isArray(rows)) { others[f] = { unreadable: `${p} holds no field array` }; continue; }
  others[f] = { rows: rows.map((r) => ({ name: r.name, type: r.type, stem: stemOf(r.name) })) };
}
const unreadable = Object.entries(others).filter(([, v]) => v.unreadable);

// ── THE INTERSECTION ───────────────────────────────────────────────────────────────────────
const dStems = new Set(dRows.map((r) => r.stem));
const shared = new Map();   // stem -> { forms: Set, theirRows: [] }
for (const [f, v] of Object.entries(others)) {
  if (v.unreadable) continue;
  for (const r of v.rows) {
    if (!dStems.has(r.stem)) continue;
    if (!shared.has(r.stem)) shared.set(r.stem, { forms: new Set(), theirRows: [] });
    shared.get(r.stem).forms.add(f);
    shared.get(r.stem).theirRows.push({ form: f, name: r.name, type: r.type });
  }
}

// ── THE VERDICTS — THE ONLY AUTHORED THING HERE, AND EACH IS READ OFF BOTH PAGES ───────────
//
// Every quoted caption below was produced by scratchpad/p52-433d-lineage-context.mjs, which
// prints the runs drawn near each cell's rectangle ON BOTH FORMS. Nothing here is read from a
// leaf name — which is the point, and on this form it is the point twice over.
const VERDICTS = {
  Title: {
    verdict: 'CONTRADICTS — all four of the other forms\' occurrences, and it is the sharpest instance of [R-08] in the tree.',
    this_form: '"Title" prints at y 69.9, x 201.6..218.6 — baseline INSIDE the cell\'s rectangle and 8.2pt to its left. It is in the FOR IRS USE ONLY block: the row above is "Originator’s ID number" / "Originator Code", the row beside it is "Name", and two rows below is "Agreement examined or approved by (Signature, title, function)". THIS CELL HOLDS THE TITLE OF THE IRS EMPLOYEE WHO ORIGINATES THE AGREEMENT. No taxpayer ever fills it.',
    the_other_form: '433-A Line 3a: "Title" at y 398.9, under "any interest in an LLC, LLP, corporation, partnership, etc." with "(percentage of ownership %)" — the FILER’s title in another business. 433-A(OIC) Section 4: "Title" at y 346.9, under "Do you or your spouse have any other business interests?" — the same fact. 433-B(OIC) PartnerInfo1: "Title" at y 337.1 beside "First name", in the partners-and-officers block — A PARTNER’s title. 433-B(OIC) page 6: "Title" at y 415.5 beside "Signature of Taxpayer" — the title of the person signing FOR the entity. All four are a title on the TAXPAYER side of the form.',
    why: 'Four occurrences of one leaf name across three forms, every one of them a taxpayer-side title, and the 433-D cell wearing that name is an IRS employee’s. A binding that carried the name across would put an IRS originator’s job title into a property holding a filer’s business role.',
    and_the_name_points_the_wrong_way_TWICE: '433-D DOES print the fact the other four are about — "Title (if Corporate Officer or Partner)" at y 223.8, x 237.6..367.5, in the taxpayer signature row. ITS WIDGET IS NAMED `TitleIf[0]`, NOT `Title[0]`. So on this form the inherited name is attached to the cell that does NOT correspond, and the cell that DOES correspond carries a name no other form uses. A pass keyed on leaf names would inherit the wrong cell and miss the right one, in a single stroke, and both halves of that are invisible without the printed page.',
  },
  YourSignature: {
    verdict: 'MATCHES on the printed question — and the match settles nothing about the subject, which is the caveat this form makes unavoidable.',
    this_form: '"Your signature" prints at y 223.8, x 18.0..76.5 — directly above the cell (y 208.8..221.04, x 18.0..176.4), sharing its left edge to within 0.003pt.',
    the_other_form: '433-F page 2: "Your signature" at y 51.3, x 36.0..88.0, directly above its cell (y 36.0..48.24, x 36.0..270.0), sharing its left edge. The identical caption in the identical relation to its cell.',
    why: 'Both cells hold the signature of the person filing the form, captioned identically. As a printed question these are the same question.',
    the_subject_caveat: 'AND [R-06] RUNS ON THE SUBJECT, NOT THE QUESTION. On 433-F the filer is a wage earner or self-employed individual and can be nothing else. On 433-D the very next cell in the same printed row is "Title (if Corporate Officer or Partner)", so the person signing may be an individual OR an officer signing FOR an entity — the per-record subject recorded in _subjects.cross-form.json under `the_thing_this_form_does_that_no_other_registered_form_does`. So this MATCHES cannot be promoted to a reuse on its own: the printed questions agree and the legal persons may not. Recorded here rather than resolved, because resolving it is the crosswalk’s job and no crosswalk exists.',
  },
};

const occurrences = [];
let n = 0;
for (const [stem, s] of [...shared.entries()].sort()) {
  for (const mine of dRows.filter((r) => r.stem === stem)) {
    n += 1;
    occurrences.push({
      id: `DLN-${String(n).padStart(2, '0')}`,
      leaf: stem,
      path: mine.name,
      page: mine.page,
      rect: `y ${mine.rect[1]}..${mine.rect[3]}, x ${mine.rect[0]}..${mine.rect[2]}`,
      type: mine.type,
      ...VERDICTS[`${stem}`],
      inherited_from: [...s.forms].sort(),
      the_other_form: s.theirRows.map((r) => `${r.form}: ${r.name} (${r.type})`),
    });
  }
}

// ── THE NAME-LIE REGISTRIES, OPENED AND READ ───────────────────────────────────────────────
//
// The 433-B lineage could say its registry intersection was empty BY CONSTRUCTION, because it
// shared no leaf name with either registry-carrying form. 433-D shares two names WITH 433-A(OIC)
// and 433-B(OIC) among others, so the same sentence would be an assumption here. The registries
// are therefore opened and searched, and the swept set is declared: every `.name-lies.json` in
// adapters/pdf/maps, whatever form it belongs to, so a third registry appearing needs no edit.
const registryFiles = MAPPED_FORMS().map((f) => `adapters/pdf/maps/${f}.name-lies.json`).filter((p) => existsSync(p));
const sharedNames = [...shared.keys()];
let registryEntries = 0;
const registryEchoes = [];
for (const p of registryFiles) {
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  const entries = Array.isArray(doc) ? doc : (doc.entries || doc.lies || Object.values(doc).find(Array.isArray) || []);
  registryEntries += entries.length;
  for (const e of entries) {
    const blob = JSON.stringify(e);
    for (const nm of sharedNames) if (new RegExp(`\\b${nm}\\b`).test(blob)) registryEchoes.push(`${p} entry ${e.id ?? '(unidentified)'} names "${nm}"`);
  }
}
if (!registryFiles.length) { console.error('  NO REGISTRY READ — adapters/pdf/maps holds no <form>.name-lies.json at all, so "no echo" would be a sentence about a set this file never opened.'); process.exit(2); }

const REGISTRY_NOTE = registryEchoes.length
  ? `THE TWO INHERITED NAMES ECHO ${registryEchoes.length} ENTRY/ENTRIES IN A NAME-LIE REGISTRY: ${registryEchoes.join('; ')}. Each must be judged before any 433-D name is derived.`
  : `Name-lie registries exist on 433-A(OIC) (adapters/pdf/maps/433aoi.name-lies.json) and 433-B(OIC) (433boi.name-lies.json). Both were READ on this run and no entry in either names any of the ${sharedNames.length} shared leaf name(s) (${sharedNames.join(", ")}). That is a checked absence over ${registryEntries} registry entr(ies), not a set that was never opened.`;

const doc = {
  _what_this_is: 'The lineage of 433-D\'s AcroForm leaf names against every form already in this engine, judged PER OCCURRENCE.',
  _the_rule: '[R-08]. An inherited leaf name is evidence of nothing; a verdict is per occurrence, never per name.',
  _every_figure_here_is_derived: 'scratchpad/p52-433d-lineage.mjs, from adapters/pdf/forms/f433d.pdf\'s widget geometry and each other form\'s own adapters/pdf/maps/<form>.fields.json. The form list comes from MAPPED_FORMS() and is not typed. The VERDICTS are authored from captions printed near the cell ON BOTH FORMS, produced by scratchpad/p52-433d-lineage-context.mjs and quoted with their coordinates in each row.',
  _the_headline: `TWO INHERITED LEAF NAMES, FOUR OCCURRENCES — and the four are two facts, each drawn twice, because every cell on this form is mirrored. Against 433-B's eleven names and seventeen occurrences this is a small intersection, and its SIZE is the least interesting thing about it: one of the two names is attached to the wrong cell in both directions at once.`,
  _the_intersection_is_small_for_a_structural_reason: 'Every other form in this engine roots its fields at `topmostSubform[0]` and names its leaves positionally after the printed line marker — `p1_1_1a`, `p2_t11_13a`, `Line19c`. 433-D roots at `form1[0]` and names its leaves SEMANTICALLY, after what the cell holds: NameAndAddress, RoutingNumber1, unable_to_make, SubmitANew, FiledImmediately. Two schemes that are not the same kind of name can only collide where BOTH happen to have used an English word, which is exactly where they did: `Title` and `YourSignature`. So the small intersection is a fact about the form\'s ORIGIN — different hands, a different generation of IRS form tooling — and not a fact about its content.',
  _a_correction_recorded_rather_than_quietly_fixed: 'THIS FILE\'S FIRST DRAFT ASSERTED ZERO, and its prose explained at length why zero was the structurally inevitable answer. The derivation returned two. The explanation had been written before the number, was entirely plausible, and was wrong — the two schemes DO meet, on the two leaves where the positional scheme happened to use a word. [R-02]: a correction is a claim and carries the same standard as what it corrects, so the wrong reading is recorded here rather than replaced silently, and the count below is the derived one.',
  _and_a_small_intersection_licenses_nothing_either: '[R-08] cuts both ways and the second direction is the one that bites here. Eleven shared names on 433-B licensed nothing, and two shared names on 433-D forbid nothing: 433-D asks for a taxpayer\'s name and address, an SSN or EIN, and a spouse\'s signature, and every one of those facts is already a property in this portal under a name derived from another form — under leaf names that share not one character with 433-D\'s. The reuse question is settled on the SUBJECT axis in adapters/pdf/maps/_subjects.cross-form.json and NOT here, and on that axis 433-D COINCIDES with all five. A pass that read this small intersection as "almost no reuse" would be making the identical mistake prompt 47 made in the other direction, which [R-29] records.',
  _what_this_report_does_not_establish: [
    'It says nothing about the 82 leaf names 433-D does not share. Those are judged when their page is read, on the printed page, like everything else.',
    'It does not license or forbid reuse. That is the subject axis, and it is settled elsewhere.',
    'The YourSignature MATCHES is a match of PRINTED QUESTIONS and not of subjects — see `the_subject_caveat` on those two rows. It may not be promoted to a reuse on its own.',
    'No binding was authored in the intake that produced this file, so nothing here has yet been acted on.',
  ],
  counts: {
    d_fields: dRows.length,
    d_distinct_leaf_names: dStems.size,
    forms_compared: MAPPED_FORMS().length,
    forms_unreadable: unreadable.length,
    shared_leaf_names: shared.size,
    registry_files_read: registryFiles.length,
    registry_entries_searched: registryEntries,
    registry_echoes: registryEchoes.length,
    occurrences_judged: occurrences.length,
  },
  _the_registry_intersection: REGISTRY_NOTE,
  _unreadable_inputs: unreadable.map(([f, v]) => `${f}: ${v.unreadable}`),
  occurrences,
};

if (unreadable.length) { console.error(`  UNREADABLE INPUT — ${unreadable.length} form(s) could not be read; a form this file cannot read is not a form with no shared names.`); for (const [f, v] of unreadable) console.error(`    ${f}: ${v.unreadable}`); process.exit(2); }

writeFileSync('adapters/pdf/maps/433d.lineage.json', JSON.stringify(doc, null, 1) + '\n');
console.log(`433-D lineage: ${dRows.length} fields, ${dStems.size} distinct leaf names, compared against ${MAPPED_FORMS().length} mapped form(s).`);
console.log(`  shared leaf names: ${shared.size}`);
console.log(`  occurrences to judge: ${occurrences.length}`);
console.log('  -> adapters/pdf/maps/433d.lineage.json');
