// THE THREE CLASSES ARE DECLARATIONS, AND THIS IS WHAT HOLDS THEM TO THEIR OBLIGATIONS.
//
//   node adapters/pdf/assert-subject-class.mjs              # every form that declares classes
//   node adapters/pdf/assert-subject-class.mjs <form>       # one form
//   node adapters/pdf/assert-subject-class.mjs --canary     # prove every clause fires
//
//   exit 0 = every clause held, and the canary proved each of them can fail
//   exit 2 = a clause failed, or a canary did not fire
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A DECLARATION IS CHECKED; AN EXEMPTION IS A HIDING PLACE. ALL THREE CLASSES ARE DECLARATIONS.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The temptation with a three-way split is to check the two interesting classes and let the
// third be whatever is left over. That third class is 77 of 433-D's 83 cells, and "everything
// else" is not a class -- it is the absence of one, and it would carry no obligation, no
// evidence and no way to be wrong. So INDEPENDENT is declared like the other two, and a cell
// with NO class is a STOP rather than an independent one.
//
// SEVEN CLAUSES. Each is separately named, so a report says which one failed.
//
//   [SC-1] every cell the form draws carries a class, and the class is one of the three
//   [SC-2] the declared class is RECOMPUTED from the declared caption chain and must agree
//   [SC-3] every declared caption is a printed run inside its cell's band
//   [SC-4] members of one printed series that share a governing caption share a class
//   [SC-5] a conditional cell names exactly one side
//   [SC-6] each class carries its own obligation in the map: dependent ROUTES, conditional
//          carries an EMPTINESS ASSERTION, independent BINDS ONCE
//   [SC-7] a conditional cell carrying a value on a record declaring the other subject is a STOP
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// [SC-2] IS THE ONE THAT WOULD HAVE CAUGHT THE DEFECT THAT EARNED THIS FILE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The previous derivation returned RSI 5 SUBJECT-INDEPENDENT and RSI 6 SUBJECT-DEPENDENT. Both
// verdicts came from where a 120pt band happened to fall, and neither is what either caption
// says: "RSI 5 PPIA IMF 2 year review" names the Individual Master File and nothing else, and
// "RSI 6 PPIA BMF 2 year review" names the Business Master File and nothing else. [SC-2] never
// reads a class out of the file it is checking -- it reads the CAPTION out of the file and
// classifies it again -- so a class produced by position rather than by words cannot survive it.
//
// [SC-4] IS THE SAME CHECK FROM THE OTHER SIDE, and it is the one the ruling asked for. Cells the
// page draws as repetitions of one field, under one caption, must classify identically; a split
// among them is a classifier that answered a question about POSITION when it was asked a
// question about the CAPTION. Its hard clause is scoped to members sharing ONE governing
// caption, because a drawn column can legitimately hold three cells with three different
// captions: RSI 1, RSI 5 and RSI 6 are one drawn column at one pitch, and "no further review",
// "PPIA IMF" and "PPIA BMF" are three captions that say three different things about the
// subject. Those are reported with each caption rather than failed, and the difference between
// the two situations is derived -- whether the members' governing captions are the same run --
// not asserted.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { classOfChain, classifyCaption, CLASSES, canary as classifierCanary } from './subject-class.mjs';
import { readForm } from './caption-candidates.mjs';
import { examined } from './examined.mjs';

export const MAPS = 'adapters/pdf/maps';

/**
 * THE CLAUSES, AS A REGISTER RATHER THAN AS SEVEN STRINGS IN SEVEN MESSAGES.
 *
 * Every [SC-] id a report can print is defined here once, in the `engine` namespace, and
 * adapters/pdf/register-ids.mjs enumerates it against every other register in the tree. That is
 * not tidiness: [D-07] is a `count-sweep` MANIFEST entry written as an id the crosswalk
 * classification already used, after which a blanket audit reported an empty demand on the WRONG
 * FORM and named neither the cause nor the register. An id defined at its throw site is an id
 * nothing can collide-check.
 */
export const CLAUSES = [
  { id: 'SC-1', what: 'every cell the form draws carries a class, and the class is one of the three. A cell with no class is a STOP; there is no default and no fourth state.' },
  { id: 'SC-2', what: 'the declared class is RECOMPUTED from the declared caption chain and must agree. The class is never read out of the file being checked.' },
  { id: 'SC-3', what: 'every declared caption is a printed run inside its own cell’s band, or inside the band of a member of its printed series.' },
  { id: 'SC-4', what: 'members of one printed series that share a governing caption share a class. Members carrying distinct captions are REPORTED with each caption, not failed.' },
  { id: 'SC-5', what: 'a conditional cell names exactly one side, and no other class names one. An emptiness assertion with no side has nothing to assert.' },
  { id: 'SC-6', what: 'each class carries its own obligation in the map: dependent ROUTES with a discriminator, conditional carries an EMPTINESS ASSERTION and no route, independent BINDS ONCE and asserts nothing.' },
  { id: 'SC-7', what: 'a conditional cell carrying a value on a record declaring the OTHER subject is a STOP, and carrying one on its own subject is not.' },
];

/** Every form that declares subject classes. Derived from the maps directory, never listed. */
export const CLASSED_FORMS = () =>
  readdirSync(MAPS).filter((f) => f.endsWith('.subject-classes.json')).map((f) => f.replace('.subject-classes.json', '')).sort();

export const declarationPath = (form) => `${MAPS}/${form}.subject-classes.json`;

export const loadDeclaration = (form) => {
  const p = declarationPath(form);
  if (!existsSync(p)) return { stop: `no subject-class declaration at ${p}` };
  try { return { doc: JSON.parse(readFileSync(p, 'utf8')), path: p }; }
  catch (e) { return { stop: `${p} will not parse: ${e.message}. An unreadable declaration is not an absent one.` }; }
};

// ── [SC-1] [SC-2] [SC-5] ───────────────────────────────────────────────────────────────────
export const assertStems = (doc, drawnStems) => {
  const problems = [];
  let examinedStems = 0;
  const declared = new Set();
  for (const s of doc.stems || []) {
    examinedStems += 1;
    declared.add(s.stem);
    if (!CLASSES.includes(s.class))
      problems.push(`[SC-1] ${s.stem}: class ${JSON.stringify(s.class)} is not one of ${CLASSES.join(', ')}. A cell with no class is a STOP; there is no default and no fourth state.`);
    const chain = (s.chain || []).map((l) => l.caption);
    if (!chain.length) { problems.push(`[SC-2] ${s.stem}: declares a class and no caption chain. The class is a statement ABOUT a caption, so a class with no caption behind it is unfalsifiable.`); continue; }
    const again = classOfChain(chain);
    if (again.class !== s.class)
      problems.push(`[SC-2] ${s.stem}: the file says ${s.class} and its own declared caption chain classifies as ${again.class}. The chain is ${JSON.stringify(chain.map((c) => c.slice(0, 40)))}.`);
    if (again.side !== (s.side ?? null))
      problems.push(`[SC-2] ${s.stem}: the file says side ${JSON.stringify(s.side ?? null)} and the chain yields ${JSON.stringify(again.side)}.`);
    if (s.class === 'conditional' && !['individual', 'entity'].includes(s.side))
      problems.push(`[SC-5] ${s.stem}: is conditional and names no single side (${JSON.stringify(s.side)}${s.side_ambiguous ? `, ambiguous between ${s.side_ambiguous.join(' and ')}` : ''}). The emptiness assertion is "empty on the OTHER subject", so a conditional cell with no side has no assertion to carry and is a STOP rather than a note.`);
    if (s.class !== 'conditional' && s.side)
      problems.push(`[SC-5] ${s.stem}: is ${s.class} and names a side. Only a conditional cell exists for one subject.`);
  }
  if (drawnStems) {
    const missing = drawnStems.filter((x) => !declared.has(x));
    if (missing.length)
      problems.push(`[SC-1] ${missing.length} cell(s) the page draws carry no declaration at all: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' ...' : ''}`);
    const extra = [...declared].filter((x) => !drawnStems.includes(x));
    if (extra.length)
      problems.push(`[SC-1] ${extra.length} declared stem(s) are not drawn on the page: ${extra.join(', ')}. A class over a cell that does not exist is a class nothing can check.`);
  }
  return { problems, examinedStems };
};

// ── [SC-3] THE BAND IS THE BOUND ───────────────────────────────────────────────────────────
export const assertBand = (doc, bandsByStem) => {
  const problems = [];
  let examinedCaptions = 0;
  for (const s of doc.stems || []) {
    const band = bandsByStem.get(s.stem);
    if (!band) { problems.push(`[SC-3] ${s.stem}: no band could be derived for it from the page, so its captions are bounded by nothing. An underivable bound is a STOP, not a skip.`); continue; }
    for (const l of s.chain || []) {
      examinedCaptions += 1;
      if (!band.has(l.caption))
        problems.push(`[SC-3] ${s.stem}: the declared caption ${JSON.stringify(l.caption.slice(0, 60))} is not a printed run inside this cell's band. A chain may only name what is drawn near the cell it governs.`);
    }
  }
  return { problems, examinedCaptions };
};

// ── [SC-4] PRINTED SERIES ──────────────────────────────────────────────────────────────────
//
// A series is a set of cells the page draws as repetitions of one thing. Two verdicts:
//   SHARED CAPTION + differing classes -> STOP. One printed field cannot hold two classes.
//   DISTINCT CAPTIONS + differing classes -> REPORTED, each with the caption that decided it.
export const assertSeries = (doc) => {
  const problems = [];
  const reported = [];
  let examinedSeries = 0;
  for (const s of doc.printed_series || []) {
    examinedSeries += 1;
    const classes = [...new Set(s.members.map((m) => `${m.class}${m.side ? `:${m.side}` : ''}`))];
    const captions = [...new Set(s.members.map((m) => m.decided_by))];
    if (classes.length === 1) continue;
    if (captions.length === 1)
      problems.push(`[SC-4] a printed series of ${s.members.length} cell(s) drawn at ${s.pitch_pt}pt pitch shares ONE governing caption ${JSON.stringify(captions[0].slice(0, 50))} and its members classify ${classes.length} different ways: ${s.members.map((m) => `${m.stem}=${m.class}${m.side ? `:${m.side}` : ''}`).join(', ')}. Cells the page draws as repetitions of one field, under one caption, cannot honestly receive different verdicts -- a split here is a classification made from POSITION.`);
    else
      reported.push({ pitch_pt: s.pitch_pt, axis: s.axis, members: s.members, classes, captions });
  }
  return { problems, reported, examinedSeries };
};

// ── [SC-6] EACH CLASS CARRIES ITS OWN OBLIGATION IN THE MAP ────────────────────────────────
//
// The obligations are what make the three classes different in the engine rather than different
// in a report. A class with no consequence is a label.
export const assertObligations = (doc, mapDoc) => {
  const problems = [];
  let examinedObligations = 0;
  if (!mapDoc) return { problems, examinedObligations, noMap: true };
  const sc = mapDoc.subject_classes || {};
  for (const s of doc.stems || []) {
    const entry = sc[s.stem];
    if (!entry) { problems.push(`[SC-6] ${s.stem}: the map binds this form and declares no obligation for this cell. Every declared class owes the map something and the absence of an entry is the silence the classes exist to remove.`); continue; }
    examinedObligations += 1;
    if (entry.class !== s.class) { problems.push(`[SC-6] ${s.stem}: the map calls it ${entry.class} and the derived table calls it ${s.class}.`); continue; }
    if (s.class === 'dependent') {
      const r = entry.route;
      if (!r || !r.individual || !r.entity) problems.push(`[SC-6] ${s.stem} is DEPENDENT and declares no route with both an individual and an entity key. A dependent cell holds a different KIND of value on each subject, so one property would have to hold two facts.`);
      else if (r.individual === r.entity) problems.push(`[SC-6] ${s.stem} routes both subjects to ${r.individual}. A route to one place is not a route.`);
      if (r && !r.discriminator) problems.push(`[SC-6] ${s.stem} declares a route and no discriminator. Two properties with nothing choosing between them is worse than one.`);
    } else if (s.class === 'conditional') {
      if (entry.empty_unless !== s.side) problems.push(`[SC-6] ${s.stem} is CONDITIONAL on the ${s.side} side and declares empty_unless ${JSON.stringify(entry.empty_unless)}. The assertion IS the obligation: on a record declaring the other subject the cell must be empty.`);
      if (entry.route) problems.push(`[SC-6] ${s.stem} is CONDITIONAL and declares a route. A cell that exists for one subject only has no second subject to route to, and the second property could only ever be empty.`);
    } else {
      if (entry.route) problems.push(`[SC-6] ${s.stem} is INDEPENDENT and declares a route.`);
      if (entry.empty_unless) problems.push(`[SC-6] ${s.stem} is INDEPENDENT and declares an emptiness assertion. An assertion that a correctly filled cell must be empty fires on correct data, which is [R-10].`);
    }
  }
  return { problems, examinedObligations };
};

// ── [SC-7] A CONDITIONAL CELL ON THE WRONG SUBJECT ─────────────────────────────────────────
//
// `values` maps a stem to what a record puts in it; `subject` is what the record declares itself
// to be. This is the clause that stops an entity record carrying a spouse's signature, which is
// one of the two failure directions the binary would have opened.
export const assertConditionalEmptiness = (doc, subject, values) => {
  const problems = [];
  let examinedCells = 0;
  for (const s of (doc.stems || []).filter((x) => x.class === 'conditional')) {
    examinedCells += 1;
    if (s.side === subject) continue;
    const v = values[s.stem];
    if (v !== undefined && v !== null && String(v).trim() !== '')
      problems.push(`[SC-7] ${s.stem} exists only for the ${s.side} subject -- the page says so at ${JSON.stringify(s.decided_by.slice(0, 50))} -- and this record declares itself ${subject} and puts ${JSON.stringify(String(v).slice(0, 40))} in it.`);
  }
  return { problems, examinedCells };
};

// ── THE CANARY -- EVERY CLAUSE, BOTH DIRECTIONS ────────────────────────────────────────────
export const canary = () => {
  const problems = [];
  const dead = classifierCanary();
  if (dead.length) return dead;
  const forms = CLASSED_FORMS();
  if (!forms.length) return ['CANARY DEAD  no form declares subject classes, so every clause below would be planted against nothing. An empty canary is the failure it exists to catch.'];
  const { doc, stop } = loadDeclaration(forms[0]);
  if (stop) return [`CANARY DEAD  ${stop}`];
  const clone = () => JSON.parse(JSON.stringify(doc));
  const fires = (r, id) => r.problems.some((p) => p.startsWith(id));

  // [SC-1] no class, a class outside the three, and a declared stem the page does not draw.
  const drawn = doc.stems.map((s) => s.stem);
  const c1 = clone(); delete c1.stems[0].class;
  if (!fires(assertStems(c1, drawn), '[SC-1]')) problems.push('CANARY DEAD  a stem with NO class raised no [SC-1]. That is the fourth state the whole construct refuses.');
  const c1b = clone(); c1b.stems[0].class = 'subject-agnostic';
  if (!fires(assertStems(c1b, drawn), '[SC-1]')) problems.push('CANARY DEAD  a stem with an invented fourth class raised no [SC-1].');
  const c1c = clone(); c1c.stems.push({ ...c1c.stems[0], stem: 'NoSuchCellOnThisForm' });
  if (!fires(assertStems(c1c, drawn), '[SC-1]')) problems.push('CANARY DEAD  a class declared over a cell the page does not draw raised no [SC-1].');
  const c1d = clone(); c1d.stems.shift();
  if (!fires(assertStems(c1d, drawn), '[SC-1]')) problems.push('CANARY DEAD  a cell the page draws with no declaration raised no [SC-1]. A missing row and a wrong row are both silences here.');
  if (assertStems(clone(), drawn).problems.length) problems.push('CANARY DEAD  the real declaration raised [SC-1]/[SC-2]/[SC-5] problems. A check that refuses the correct shape gets turned off.');

  // [SC-2] the class overridden away from what its own caption says -- the RSI defect exactly.
  const rsi5 = doc.stems.findIndex((s) => s.stem === 'RSI5');
  const c2 = clone();
  const victim = rsi5 >= 0 ? rsi5 : doc.stems.findIndex((s) => s.class === 'conditional');
  if (victim < 0) problems.push('CANARY DEAD  the declaration holds no conditional cell to plant [SC-2] against.');
  else {
    c2.stems[victim].class = 'independent'; c2.stems[victim].side = null;
    if (!fires(assertStems(c2, drawn), '[SC-2]')) problems.push(`CANARY DEAD  "${doc.stems[victim].stem}" relabelled INDEPENDENT while its own caption still names one subject raised no [SC-2]. That relabelling IS the defect this file was written for.`);
    const c2b = clone(); c2b.stems[victim].class = 'dependent'; c2b.stems[victim].side = null;
    if (!fires(assertStems(c2b, drawn), '[SC-2]')) problems.push(`CANARY DEAD  "${doc.stems[victim].stem}" relabelled DEPENDENT raised no [SC-2]. The clause fires one way and not the other, which is worse than not firing.`);
    const c5 = clone(); c5.stems[victim].side = null;
    if (!fires(assertStems(c5, drawn), '[SC-5]')) problems.push(`CANARY DEAD  a conditional cell with no side raised no [SC-5].`);
  }

  // [SC-3] a caption swapped for a run drawn elsewhere on the page.
  const bands = new Map(doc.stems.map((s) => [s.stem, new Set((s.chain || []).map((l) => l.caption))]));
  const c3 = clone(); c3.stems[0].chain[0].caption = 'Catalog Number 16644M';
  if (!fires(assertBand(c3, bands), '[SC-3]')) problems.push('CANARY DEAD  a chain quoting the CATALOG NUMBER from the page footer raised no [SC-3]. Without this clause a chain may name any run anywhere and the band bounds nothing.');
  if (assertBand(clone(), bands).problems.length) problems.push('CANARY DEAD  the real chains raised [SC-3] against their own captions.');

  // [SC-4] both directions: a shared-caption series forced apart, and one legitimately apart.
  const shared = (doc.printed_series || []).find((s) => new Set(s.members.map((m) => m.decided_by)).size === 1 && s.members.length >= 2);
  if (!shared) problems.push('CANARY DEAD  no printed series shares one caption, so [SC-4] has nothing to plant against.');
  else {
    const c4 = clone();
    const t = c4.printed_series.find((s) => s.members[0].stem === shared.members[0].stem);
    t.members[1].class = t.members[1].class === 'independent' ? 'dependent' : 'independent';
    if (!fires(assertSeries(c4), '[SC-4]')) problems.push(`CANARY DEAD  a printed series of ${shared.members.length} cells under ONE caption, with one member's class changed, raised no [SC-4]. That is the split the ruling required an assertion for.`);
  }
  const distinct = (doc.printed_series || []).find((s) => new Set(s.members.map((m) => m.decided_by)).size > 1 && new Set(s.members.map((m) => m.class)).size > 1);
  if (distinct) {
    const r = assertSeries(clone());
    if (r.problems.length) problems.push('CANARY DEAD  a series whose members carry DISTINCT captions and differing classes was FAILED rather than reported. RSI 1, RSI 5 and RSI 6 are one drawn column saying three different things about the subject, and refusing the page for it would make the clause unsatisfiable.');
    if (!r.reported.length) problems.push('CANARY DEAD  a series with distinct captions and differing classes was neither failed nor REPORTED. Passing it in silence is the third state this clause must not have.');
  }
  if (assertSeries(clone()).problems.length) problems.push('CANARY DEAD  the real series raised [SC-4].');

  // [SC-6] each class's obligation, planted wrong in turn.
  const mk = (over) => { const m = { subject_classes: {} }; for (const s of doc.stems) m.subject_classes[s.stem] = s.class === 'dependent' ? { class: 'dependent', route: { individual: 'a', entity: 'b', discriminator: 'subject' } } : s.class === 'conditional' ? { class: 'conditional', empty_unless: s.side } : { class: 'independent' }; return { ...m, subject_classes: { ...m.subject_classes, ...over } }; };
  if (assertObligations(doc, mk({})).problems.length) problems.push('CANARY DEAD  a conforming set of obligations raised [SC-6].');
  const dep = doc.stems.find((s) => s.class === 'dependent');
  if (dep) {
    if (!fires(assertObligations(doc, mk({ [dep.stem]: { class: 'dependent' } })), '[SC-6]')) problems.push(`CANARY DEAD  DEPENDENT "${dep.stem}" with no route raised no [SC-6]. Binding it once writes an entity's EIN into an individual's SSN property.`);
    if (!fires(assertObligations(doc, mk({ [dep.stem]: { class: 'dependent', route: { individual: 'a', entity: 'b' } } })), '[SC-6]')) problems.push(`CANARY DEAD  a route with no discriminator raised no [SC-6].`);
  } else problems.push('CANARY DEAD  no dependent cell to plant the route obligation against.');
  const con = doc.stems.find((s) => s.class === 'conditional');
  if (con) {
    if (!fires(assertObligations(doc, mk({ [con.stem]: { class: 'conditional' } })), '[SC-6]')) problems.push(`CANARY DEAD  CONDITIONAL "${con.stem}" with no emptiness assertion raised no [SC-6]. The assertion IS the obligation.`);
    if (!fires(assertObligations(doc, mk({ [con.stem]: { class: 'conditional', empty_unless: con.side, route: { individual: 'a', entity: 'b', discriminator: 'subject' } } })), '[SC-6]')) problems.push(`CANARY DEAD  CONDITIONAL "${con.stem}" given a ROUTE raised no [SC-6]. That route spends headroom on a property that can only ever be empty.`);
  } else problems.push('CANARY DEAD  no conditional cell to plant the emptiness obligation against.');
  const ind = doc.stems.find((s) => s.class === 'independent');
  if (ind && !fires(assertObligations(doc, mk({ [ind.stem]: { class: 'independent', empty_unless: 'entity' } })), '[SC-6]'))
    problems.push(`CANARY DEAD  INDEPENDENT "${ind.stem}" given an emptiness assertion raised no [SC-6]. It would fire on a correctly filled form.`);

  // [SC-7] the wrong subject carrying a value, and the right subject carrying one.
  if (con) {
    const other = con.side === 'individual' ? 'entity' : 'individual';
    if (!assertConditionalEmptiness(doc, other, { [con.stem]: 'Ada Lovelace' }).problems.some((p) => p.startsWith('[SC-7]')))
      problems.push(`CANARY DEAD  a record declaring itself ${other} and putting a value in "${con.stem}", which exists only for the ${con.side} subject, raised no [SC-7]. An entity record carrying a spouse signature passing unchecked is one of the two failure directions the binary opened.`);
    if (assertConditionalEmptiness(doc, con.side, { [con.stem]: 'Ada Lovelace' }).problems.length)
      problems.push(`CANARY DEAD  a record declaring itself ${con.side} and filling "${con.stem}" was REFUSED. The cell exists for that subject; refusing it makes the assertion fire on correct data.`);
    if (assertConditionalEmptiness(doc, other, { [con.stem]: '' }).problems.length)
      problems.push(`CANARY DEAD  an EMPTY conditional cell on the other subject was refused.`);
  }
  return problems;
};

// ── CLI ────────────────────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('adapters/pdf/assert-subject-class.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  const wanted = argv.filter((a) => !a.startsWith('--'));
  let bad = 0;

  if (argv.includes('--canary') || !wanted.length) {
    const problems = canary();
    if (problems.length) { problems.forEach((p) => console.error(`  ${p}`)); bad += problems.length; }
    else console.log('  canary: every clause planted and every plant refused — [SC-1] four ways, [SC-2] in both directions on the very cell whose misclassification earned this file, [SC-3] against a run from the page footer, [SC-4] in both the shared-caption and distinct-caption directions, [SC-6] once per class, [SC-7] on the wrong subject and not on the right one.');
  }

  const forms = wanted.length ? wanted : CLASSED_FORMS();
  if (!forms.length) { console.error('STOP — no form declares subject classes, and this tool reported a pass over nothing. Zero examined is not a pass ([R-04]).'); process.exit(2); }
  for (const form of forms) {
    const { doc, stop, path } = loadDeclaration(form);
    if (stop) { console.error(`STOP — ${stop}`); bad += 1; continue; }
    const page = await readForm(form);
    if (page.stop) { console.error(`STOP — ${page.stop}`); bad += 1; continue; }
    const drawn = page.cells.map((c) => c.stem);
    const bands = new Map(page.cells.map((c) => [c.stem, new Set(c.band_with_series)]));
    const mapPath = `${MAPS}/${form}.map.json`;
    const mapDoc = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, 'utf8')) : null;

    const a = assertStems(doc, drawn);
    const b = assertBand(doc, bands);
    const c = assertSeries(doc);
    const d = assertObligations(doc, mapDoc);
    const problems = [...a.problems, ...b.problems, ...c.problems, ...d.problems];

    const byClass = { dependent: 0, conditional: 0, independent: 0 };
    for (const s of doc.stems) if (byClass[s.class] !== undefined) byClass[s.class] += 1;
    console.log(`  ${form}: ${a.examinedStems} stem(s) — ${byClass.dependent} dependent, ${byClass.conditional} conditional, ${byClass.independent} independent; ${b.examinedCaptions} declared caption(s) bounded by the band; ${c.examinedSeries} printed series`);
    console.log(`    [SC-6] obligations examined: ${d.noMap ? `0 — NO MAP EXISTS at ${mapPath}, so zero were examined. Zero examined is not a pass ([R-04]); the canary is what stands under this clause until a map does.` : `${d.examinedObligations} of ${a.examinedStems}`}`);
    for (const r of c.reported)
      console.log(`    [SC-4] reported, not failed: a ${r.axis} series of ${r.members.length} cell(s) at ${r.pitch_pt}pt whose members carry ${r.captions.length} DISTINCT captions and ${r.classes.length} classes — ${r.members.map((m) => `${m.stem}=${m.class}${m.side ? `:${m.side}` : ''} from ${JSON.stringify(m.decided_by.slice(0, 34))}`).join('; ')}`);
    examined('assert-subject-class', form, a.examinedStems, 'declared-subject-classes');
    if (problems.length) { problems.forEach((p) => console.error(`  ${p}`)); bad += problems.length; }
  }
  // THE JUMP IS WRITTEN AS A BLOCK ON ITS OWN LINES, AND THAT IS NOT A STYLE CHOICE.
  // adapters/pdf/success-sweep.mjs reported the sentence below as UNCONDITIONAL while this guard
  // was a one-line `if`: the witness reads the nearest failure accumulation as a BLOCK BODY, and
  // a body folded onto the `if` line is not one it can see. The exit was real and the sweep's
  // reading was right about what it could read -- which is the same discrimination [R-11] is
  // about, one layer down, so the code moves to where the instrument can see it rather than the
  // instrument being taught about this file.
  if (bad) {
    console.error(`STOP — ${bad} problem(s).`);
    process.exit(2);
  }
  console.log(`OK — ${forms.length} form(s) declare all three subject classes and every clause held, with 0 problem(s) found.`);
}
