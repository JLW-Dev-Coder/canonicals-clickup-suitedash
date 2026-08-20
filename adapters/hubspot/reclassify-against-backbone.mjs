// THE CROSSWALK COMPARES AGAINST THE BACKBONE, NOT AGAINST ONE PREDECESSOR FORM.
//
//   node adapters/hubspot/reclassify-against-backbone.mjs <form> [--verbose] [--emit]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// C-23, AND WHY IT IS THE WORST CARRIED ITEM IN THE 433-A(OIC) TRACK
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `433aoi.crosswalk-classification.json` declares `"against": "433a"`. Every category it uses
// is defined relative to 433-A: `exact` means the same fact as 433-A, `new` means 433-A prints
// nothing like it, `asymmetric-the-other-way` means 433-A prints it and this form does not.
//
// The BACKBONE is not 433-A. It is the set of `irs433_*` properties, and 433-F contributed 90
// of them. So a fact 433-F named and 433-A does not print is INVISIBLE to a file that compares
// against 433-A, and it comes out classified `new` — which derives a form-specific name and
// creates a second property for a fact the series already holds. `irs433_exp_rent` exists
// because 433-F prints a Rent line and 433-A does not; `40_monthly_rent_payment` is the rent
// component inside the OIC housing figure; no entry in a 433-A-only crosswalk can see the
// question, let alone answer it.
//
// 433-B(OIC) inherits the blind spot harder, because it will be crosswalked against 433-A(OIC)
// alone and shares 86 leaf names with it.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS FILE DOES
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// (1) BUILDS THE WIDENED TARGET. Every live `irs433_*` name, with WHICH FORM CONTRIBUTED IT,
//     read from the per-form property files and the per-form crosswalks. A name is attributed
//     to 433-A only when 433-A's own property file carries it.
//
// (2) DECLARES `compared_against` PER ENTRY. Derived, never typed: the forms whose artefacts
//     actually carry the facts that entry's keys bind. An entry compared against 433-A alone
//     now SAYS so, so a narrower comparison is declared rather than implied — which is the
//     whole of ruling 2. `compared_against` is written into the classification by `--emit`.
//
// (3) REPORTS EVERY CATEGORY CHANGE, at the granularity the change actually happens at.
//     Two mechanisms find them:
//
//     NAME REUSE   a key whose derived shared name is live on the backbone and was contributed
//                  by a form other than 433-A. Its relation is `exact` — but not to 433-A.
//                  Exact and mechanical.
//
//     SAME FACT,   a key classified `new` whose fact shares tokens with a backbone name
//     OTHER NAME   another form contributed. This CANNOT be decided mechanically — that is
//                  precisely what C-23 says — so the tool surfaces CANDIDATES and every one
//                  must be disposed in `SAME_FACT_RULINGS` below. An undisposed candidate is
//                  a STOP, the same contract count-sweep uses for a claim site.
//
// (4) ASSERTS THE C-22 SHAPE. An `asymmetric-the-other-way` entry says 433-A prints a thing
//     this form does not. If the 433-A group it names carries an asset class that a group on
//     THIS form accepts, the claim is false and the consequence is a filing one: a preparer
//     reading it drops the taxpayer's facts from the OIC filing. Checked mechanically, against
//     asset-row-shapes.json and both maps.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A CANDIDATE IS NOT A FINDING AND A RULING IS NOT A REBINDING
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Deciding that two differently-named facts are one fact changes which property a filed cell
// is read from. That is a filing decision on permanent state, so this tool RULES and REPORTS
// and never rebinds. A ruling of `same-fact` that nobody has acted on stays `arguable` and
// carries its `_carried` id.

import { readFileSync, writeFileSync } from 'node:fs';
import { coverageOf, GRANULARITY_OF } from './classification-coverage.mjs';

const R = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ---------------------------------------------------------------------------------------
// (1) THE WIDENED TARGET.
//
// Contributor attribution matters more than membership: `irs433_self_employment_business_name`
// being live is not interesting; its having been created for 433-F's `433f_biz_name` is.
export const backboneOf = () => {
  const by = new Map();   // hs_name -> { contributors:Set, labels:Set }
  const add = (name, form, label) => {
    if (!name || !String(name).startsWith('irs433_')) return;
    if (!by.has(name)) by.set(name, { contributors: new Set(), labels: new Set() });
    by.get(name).contributors.add(form);
    if (label) by.get(name).labels.add(String(label));
  };
  for (const [file, form] of [['fields.433a.json', '433a'], ['fields.433f.json', '433f'], ['fields.433aoi.json', '433aoi']]) {
    let doc; try { doc = R(`adapters/hubspot/${file}`); } catch { continue; }
    for (const p of (doc.properties || [])) add(p.hs_name, form, p.label);
  }
  for (const [file, form] of [['crosswalk.433f.json', '433f'], ['crosswalk.433aoi.json', '433aoi']]) {
    let doc; try { doc = R(`adapters/hubspot/${file}`); } catch { continue; }
    for (const b of (doc.bindings || [])) add(b.hs_name, form, b.printed_label || b.backbone_label);
  }
  // The shared registry carries names contributed before the per-form files existed; it is
  // attributed to `registry` rather than guessed at, so an unattributed name is visible as one.
  try { for (const p of (R('adapters/hubspot/fields.registry.json').properties || [])) add(p.hs_name, 'registry', p.label); } catch { /* absent is a declared state, see the report */ }
  return by;
};

// ---------------------------------------------------------------------------------------
// (3) THE SAME-FACT CANDIDATE TEST, and the rulings that dispose of what it finds.
const STOP = new Set(['total', 'amount', 'of', 'the', 'a', 'and', 'or', 'to', 'in', 'for', 'is',
  'number', 'value', 'name', 'date', 'current', 'other', 'from', 'attachment', 'this', 'your']);
const tokensOf = (s) => String(s).replace(/^irs433_/, '').split('_').filter(t => t && !STOP.has(t));
// 0.25 IS DECLARED, NOT TUNED, AND IT IS THE FIGURE THAT REACHES THE LIVE CASE. C-23's own
// instance — `monthly_rent_payment` against `irs433_exp_rent` — scores 0.33 on shared {rent};
// the run that first used 0.34 surfaced one candidate and missed exactly the one the item was
// filed for. Lowering it to 0.25 surfaces ten, of which nine are disposed as different facts
// below. A threshold that admits nine readable false positives to catch one real question is
// the correct trade here: over-detection is loud and under-detection is silent.
export const CANDIDATE_THRESHOLD = 0.25;

/**
 * EVERY CANDIDATE GETS A RULING. `same-fact` means the two names hold one fact and the binding
 * is arguable; `different-fact` means they share a word and not a question.
 */
export const SAME_FACT_RULINGS = [
  { key: '40_monthly_rent_payment', candidate: 'irs433_exp_rent', ruling: 'same-fact', carried: 'C-23',
    rebound: true,
    orphan: 'irs433aoi_monthly_rent_payment',
    why: 'THE LIVE INSTANCE C-23 WAS FILED FOR, AND THE ONE THE WIDENED TARGET EXISTS TO SURFACE. `irs433_exp_rent` is on the backbone because 433-F prints a Rent line and 433-A does not, so no entry in a crosswalk authored against 433-A could see it. Both cells hold the taxpayer\'s monthly rent payment. NOT REBOUND HERE: `40_monthly_rent_payment` is the rent COMPONENT disclosed beside the OIC housing-and-utilities figure at (40), and whether the component a preparer discloses on an OIC and the expense line a preparer claims on a 433-F are one stored fact is a filing decision on permanent state. Ruled, reported, and left carried as C-23.',
    superseded: 'THE RULING WAS RIGHT AND THE DEFERRAL WAS WRONG, AND THE ORIGINAL IS KEPT ABOVE VERBATIM. What it got right: the two cells hold one fact, and which property a filed cell reads from is permanent state that a tool surfacing candidates must never change by itself. What it got wrong: it treated permanence as a reason to wait, when waiting is the one thing that makes it permanent. THERE WERE ZERO LIVE RECORDS - the only record that ever held either value was the synthetic probe, deleted at the end of the pass that wrote this ruling - so the rebind cost one crosswalk row and no migration, and every day it stayed deferred was a day a real record could arrive and make it cost a migration instead. Rebound under X-82 (same-fact-different-decomposition against 433-A line 37 Housing and Utilities): `40_monthly_rent_payment` now derives `irs433_exp_rent`, and `irs433aoi_monthly_rent_payment` is deprecated in its portal description and named in no definition file. Asserted by sameFactBindings() below, which is what makes this a state rather than a sentence.' },

  { key: 'box_d_total_household_income', candidate: 'irs433_income_pension_household', ruling: 'different-fact',
    why: 'A BOX TOTAL AGAINST ONE OF ITS OPERANDS. Box D is the sum of every household income line; `irs433_income_pension_household` is the spouse-and-household pension line, one component of it. They share "household" and "income" because one contains the other, which is the opposite of being the same fact — binding them together would make the total overwrite an operand.' },
  { key: 'box_d_total_household_income', candidate: 'irs433_income_social_security_household', ruling: 'different-fact',
    why: 'Same shape as the pension candidate above: a total against one of the lines that feeds it.' },

  { key: '32_additional_sources_of_income', candidate: 'irs433_income_unemployment', ruling: 'different-fact',
    why: 'A CATCH-ALL LINE AGAINST A NAMED SOURCE. (32) is "additional sources of income" — the residual line for anything the printed list does not name — and unemployment compensation is one of the sources the list DOES name. A residual and a named member of the set it is residual to are never one fact.' },
  { key: 's10_attached_other_income_statements', candidate: 'irs433_income_unemployment', ruling: 'different-fact',
    why: 'AN ATTACHMENT CHECKBOX AGAINST A DOLLAR FIGURE. This key is Section 10\'s "did you attach your other income statements" box; the candidate is an income amount. They share the word "income" and nothing else — different type, different section, different question.' },

  { key: 's1_housing_status', candidate: 'irs433_exp_housing_utilities_total', ruling: 'different-fact',
    why: 'A TENURE OPTION SET AGAINST A DOLLAR TOTAL. `s1_housing_status` records whether the taxpayer owns, rents or lives with someone; the candidate is 433-F\'s housing-and-utilities expense figure. Shared token "housing", different type entirely.' },
  { key: 's1_housing_other_specify', candidate: 'irs433_exp_housing_utilities_total', ruling: 'different-fact',
    why: 'The free-text "other, specify" that accompanies the tenure option set above. Same disposition, same reason.' },

  { key: 's4_other_business_address', candidate: 'irs433_self_employment_business_name', ruling: 'different-fact',
    why: 'AN ADDRESS AGAINST A NAME, on top of being a DIFFERENT BUSINESS. Section 4 asks about the taxpayer\'s self-employment business and then, separately, about any OTHER business the taxpayer has an interest in; `s4_other_business_*` is the second block. Neither the field nor the entity matches.' },
  { key: 's4_other_business_telephone', candidate: 'irs433_self_employment_business_name', ruling: 'different-fact',
    why: 'Same block, same disposition: a telephone number against a business name, and the other business rather than the self-employment one.' },
  { key: 's4_other_business_ein', candidate: 'irs433_self_employment_business_name', ruling: 'different-fact',
    why: 'Same block, same disposition: an EIN against a business name, and the other business rather than the self-employment one.' },
];

/**
 * PAIRS OF ENTRIES THAT DESCRIBE ONE PRINTED CONSTRUCT AND NAME IT AT TWO GRANULARITIES.
 * Declaring a pair here is a statement that the difference is understood and deliberate; it is
 * not permission to leave it. Each entry names what would have to change to align them.
 */
export const CONSTRUCT_GRANULARITY = [
  // C-21 IS RESOLVED AND ITS DECLARATION IS RETIRED. The question was which granularity is the
  // standard; the answer is ENUMERATED, and X-18's `8c_*` glob is spelled out into its eight
  // keys. X-09 and X-18 now carry the same granularity, so the pair no longer differs - and a
  // decision for a divergence that has gone away is the same STOP an undecided one gets, which
  // is why `retired` is checked below rather than merely written. The original text is kept
  // verbatim under `why`, because a superseded finding is kept with what it got right.
  { pair: ['X-09', 'X-18'], carried: 'C-21',
    retired: 'The pair is ALIGNED. X-18 no longer globs: its `oic` spells out all eight 8c_ keys, classification-coverage.mjs carries no mechanism for it, and both entries derive `enumerated`. The two cells the glob carried and nobody named - 8c_total_digital_assets and 8c_digital_asset_held - are classified cells on the record for the first time.',
    why: 'THE PAIR C-21 WAS FILED FOR. 433-A(OIC) draws the personal digital-asset block at (2c) and the business one at (8c) identically. X-09 ENUMERATES the six (2c) text cells by name and sweeps in neither the check-here box nor the identity total; X-18 writes "8c_* digital-asset block", a prefix glob that sweeps in all eight. So `8c_digital_asset_held` and `8c_total_digital_assets` are classified different-shape while `2c_digital_asset_held` and `2c_total_digital_assets` are classified new — two categories for one printed shape, and the disagreement is recorded in X-67.\n\nNOT ALIGNED HERE, DELIBERATELY. Aligning means choosing which granularity is the standard, and C-21’s own text says that is "a rule for the classification format, not a call this form gets to make": a glob is exactly enumerable and therefore checkable, and it also covers cells its author may never have looked at, and which of those two properties should win is a decision that binds 433-B(OIC) and every form after it. What HAS changed is that the difference is now derived and printed on every run instead of being a thing a reader had to notice. It changes no naming outcome: both pairs derive form-specific names.' },
];

// ---------------------------------------------------------------------------------------
export const reclassify = (form) => {
  const MAP = R(`adapters/pdf/maps/${form}.map.json`);
  const CLS = R(`adapters/pdf/maps/${form}.crosswalk-classification.json`);
  const XW = R(`adapters/hubspot/crosswalk.${form}.json`);
  const A433 = R('adapters/hubspot/fields.433a.json');
  const SHAPES = R('adapters/hubspot/asset-row-shapes.json');
  const MAP433A = R('adapters/pdf/maps/433a.map.json');
  const FIELDS = R(`adapters/hubspot/fields.${form}.json`);

  const back = backboneOf();
  const { coverage } = coverageOf(CLS, MAP, form);
  const rowOf = new Map(XW.bindings.map(b => [b.key, b]));
  const on433a = new Set(A433.properties.map(p => p.hs_name));
  const problems = [];

  // ── (3a) NAME REUSE: an exact match on the backbone contributed by some other form ──────
  const reuse = [];
  for (const b of XW.bindings) {
    const shared = `irs433_${b.fact}`;
    const info = back.get(shared);
    if (!info || on433a.has(shared)) continue;      // absent, or 433-A's own — the file already sees those
    // AND SOMEBODY OTHER THAN THIS FORM MUST HAVE CONTRIBUTED IT. A name this pass created for
    // 433-A(OIC) itself is not reuse of anything; the first draft of this filter excluded only
    // 433-A's contributions and reported nineteen rows, eighteen of which were this form
    // recognising its own new properties.  counts as another contributor: a name that
    // predates the per-form files was still contributed by something that is not this form.
    const others = [...info.contributors].filter(c => c !== form).sort();
    if (!others.length) continue;
    reuse.push({ key: b.key, entry: b.entry, fact: b.fact, shared,
      contributors: others,
      declared_backbone_key: b.backbone_key ?? null,
      category: CLS.entries.find(e => e.id === b.entry)?.category ?? null });
  }

  // ── (3b) SAME FACT, OTHER NAME: candidates, each of which must carry a ruling ───────────
  const catOf = new Map(CLS.entries.map(e => [e.id, e.category]));
  const candidates = [];
  for (const b of XW.bindings) {
    if (catOf.get(b.entry) !== 'new') continue;
    const mine = new Set(tokensOf(b.fact));
    if (!mine.size) continue;
    for (const [name, info] of back) {
      if (on433a.has(name)) continue;
      if (info.contributors.size === 1 && info.contributors.has(form)) continue;   // this form's own
      const theirs = new Set(tokensOf(name));
      const inter = [...mine].filter(t => theirs.has(t));
      if (!inter.length) continue;
      const j = inter.length / new Set([...mine, ...theirs]).size;
      if (j < CANDIDATE_THRESHOLD) continue;
      const ruling = SAME_FACT_RULINGS.find(r => r.key === b.key && r.candidate === name);
      candidates.push({ key: b.key, entry: b.entry, fact: b.fact, candidate: name,
        contributors: [...info.contributors].sort(), jaccard: Number(j.toFixed(2)), shared: inter,
        ruling: ruling?.ruling ?? null, why: ruling?.why ?? null, carried: ruling?.carried ?? null });
      if (!ruling) problems.push(
        `UNRULED CANDIDATE  ${b.key} (${b.entry}, new) shares ${JSON.stringify(inter)} with ${name}, contributed by ${[...info.contributors].join('+')}.\n` +
        `      Classified \`new\` — 433-A prints nothing like it — against a backbone name another form DID contribute.\n` +
        `      Rule it same-fact or different-fact in SAME_FACT_RULINGS with the reason. There is no third state, and "new" is not the third state.`);
    }
  }

  // ── (2) compared_against, per entry, derived ───────────────────────────────────────────
  const comparedAgainst = new Map();
  for (const e of CLS.entries) {
    const keys = [...coverage.get(e.id).keys()];
    const forms = new Set();
    for (const k of keys) {
      const b = rowOf.get(k);
      if (!b) continue;
      const shared = `irs433_${b.fact}`;
      if (on433a.has(shared)) forms.add('433a');
      const info = back.get(shared);
      if (info) for (const c of info.contributors) if (c !== form) forms.add(c);
    }
    // An entry that names 433-A prose but binds no key on the backbone was still COMPARED
    // against 433-A — that is what its `a433` field records — so the declared predecessor is
    // always part of the comparison, and what widens is what else is in it.
    if (e.a433) forms.add(CLS.against || '433a');
    comparedAgainst.set(e.id, [...forms].sort());
  }

  // ── (4) THE C-22 ASSERTION: an asymmetric claim against a class this form accepts ───────
  const acceptedHere = new Set();
  for (const def of Object.values(MAP.groups || {})) for (const c of (def?.row_class?.accepts || [])) acceptedHere.add(c);
  const classOfGroup433a = new Map();
  for (const [g, def] of Object.entries(MAP433A.groups || {})) {
    const declared = def?.row_class?.accepts;
    if (declared) { classOfGroup433a.set(g, declared); continue; }
    // EVERY 433-A GROUP NOW DECLARES ONE, so there is nothing left to fall back to and the
    // fallback is gone rather than left in place reading as live. It recovered the class from
    // asset-row-shapes.json's `unrouted["433a"]` block, which existed for exactly the eight
    // groups D-05 named; D-05 is fixed, those blocks are retired, and a fallback that can never
    // fire is a branch a reader trusts and a run never exercises. A group with no class is now a
    // STOP: without one this assertion silently stops checking that group's asymmetric claims.
    problems.push(`NO ROW CLASS  adapters/pdf/maps/433a.map.json groups.${g} declares no row_class, so the C-22 assertion below cannot tell whether an asymmetric-the-other-way claim about it is false. That is D-05's shape returning: a group routing rows by name alone.`);
  }
  const asymmetric = [];
  for (const e of CLS.entries) {
    if (e.category !== 'asymmetric-the-other-way') continue;
    for (const m of String(e.a433 || '').matchAll(/groups\.([A-Za-z0-9_]+)/g)) {
      const g = m[1];
      const classes = classOfGroup433a.get(g) || [];
      const clash = classes.filter(c => acceptedHere.has(c));
      asymmetric.push({ entry: e.id, group: g, classes, clash });
      if (clash.length) problems.push(
        `FALSE ASYMMETRY  ${e.id} lists 433-A groups.${g} as having no counterpart on this form.\n` +
        `      That group carries asset class ${clash.map(c => JSON.stringify(c)).join(', ')}, and a group on THIS form accepts it:\n` +
        `      ${Object.entries(MAP.groups || {}).filter(([, d]) => (d?.row_class?.accepts || []).some(c => clash.includes(c))).map(([n]) => n).join(', ')}.\n` +
        `      The consequence is a filed one: a preparer reading this entry drops the taxpayer's facts from the OIC filing.`);
    }
  }

  // ── granularity, for C-21 ──────────────────────────────────────────────────────────────
  //
  // A CATEGORY IS ONLY COMPARABLE ACROSS ENTRIES AT A STATED GRANULARITY, and this is where the
  // statement comes from: HOW each entry names its keys, derived from the one coverage reader,
  // never declared by hand. `enumerated` means the entry spells every key out; `glob` means it
  // wrote a prefix and swept in cells its author may never have looked at; `derived-counterpart`
  // means it named N keys and said "and the five spouse counterparts".
  const granularity = [];
  for (const e of CLS.entries) {
    const hows = new Set([...coverage.get(e.id).values()].map(h => (h.startsWith('verbatim') ? 'verbatim' : h)));
    const kinds = [...hows].map(h => GRANULARITY_OF[h] || h).sort();
    granularity.push({ id: e.id, category: e.category, keys: coverage.get(e.id).size,
      granularity: kinds.length ? kinds.join('+') : 'names-no-key-on-this-form' });
  }

  // ── SAME CONSTRUCT, DIFFERENT GRANULARITY — the C-21 pair, found rather than remembered ──
  //
  // Two entries describe THE SAME PRINTED CONSTRUCT when a block of keys under one prefix
  // corresponds, suffix for suffix, to a block under another: `2c_description_of_digital_asset`
  // against `8c_description_of_digital_asset` is the personal digital-asset block against the
  // business one, which 433-A(OIC) draws identically.
  //
  // PAIRED ON SUFFIXES, NOT ON KEY-SET SIZE. The first version of this check required the two
  // entries to cover the same NUMBER of keys, and found nothing — because the size difference IS
  // the finding: X-09 enumerates six (2c) cells and X-18's `8c_*` glob sweeps in eight. A test
  // that requires the two sides to match cannot report the case where one side swept up more
  // than the other, which is the only case worth reporting.
  const granOf = new Map(granularity.map(g => [g.id, g.granularity]));
  const blocksOf = (id) => {
    const by = new Map();                       // prefix -> Set(suffix)
    for (const k of coverage.get(id).keys()) {
      const m = /^([A-Za-z0-9]+_)(.+)$/.exec(k);
      if (!m) continue;
      if (!by.has(m[1])) by.set(m[1], new Set());
      by.get(m[1]).add(m[2]);
    }
    return by;
  };
  const sameConstruct = [];
  const ids = CLS.entries.map(e => e.id);
  const blocks = new Map(ids.map(id => [id, blocksOf(id)]));
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    for (const [pa, sa] of blocks.get(ids[i])) for (const [pb, sb] of blocks.get(ids[j])) {
      if (pa === pb) continue;
      const shared = [...sa].filter(x => sb.has(x));
      // THREE SHARED SUFFIXES AND HALF THE SMALLER BLOCK. Declared, not tuned: two cells with
      // the same suffix under two prefixes is a coincidence a form full of `_account_number`
      // and `_current_fmv` produces constantly; a whole block of them is a construct.
      if (shared.length < 3 || shared.length < Math.min(sa.size, sb.size) / 2) continue;
      const ga = granOf.get(ids[i]), gb = granOf.get(ids[j]);
      const declared = CONSTRUCT_GRANULARITY.find(d => (d.pair[0] === ids[i] && d.pair[1] === ids[j]) || (d.pair[0] === ids[j] && d.pair[1] === ids[i]));
      const extraA = [...sa].filter(x => !sb.has(x)), extraB = [...sb].filter(x => !sa.has(x));
      sameConstruct.push({ a: ids[i], b: ids[j], prefixes: [pa, pb], shared: shared.length,
        sizes: [sa.size, sb.size], extraA, extraB, ga, gb, differs: ga !== gb, declared: declared?.why ?? null });
      // A DECLARATION FOR A PAIR THAT NO LONGER DIFFERS IS A STOP, and so is a `retired` mark
      // on a pair that has drifted apart again. C-21's declaration read as live for as long as
      // the pair differed; the enumerated ruling aligned them, and the same standing rule that
      // makes an undecided divergence a STOP makes a decision for a vanished one a STOP too.
      if (declared && !declared.retired && ga === gb) problems.push(
        `STALE GRANULARITY DECLARATION  ${ids[i]} and ${ids[j]} both derive "${ga}" and CONSTRUCT_GRANULARITY still declares the pair as differing. Mark it \`retired\` with what aligned them, or remove it.`);
      if (declared && declared.retired && ga !== gb) problems.push(
        `RETIRED DECLARATION, LIVE DIVERGENCE  ${ids[i]} (${ga}) and ${ids[j]} (${gb}) differ again and CONSTRUCT_GRANULARITY marks the pair retired. The alignment that retired it has come undone.`);
      if (ga !== gb && !declared) problems.push(
        `GRANULARITY SPLIT  ${ids[i]} (${ga}) and ${ids[j]} (${gb}) describe the same printed construct — ${shared.length} suffix(es) shared between the ${pa} and ${pb} blocks.\n` +
        `      ${ids[i]} covers ${sa.size} of them and ${ids[j]} covers ${sb.size}${extraB.length ? `; ${ids[j]} additionally sweeps in ${JSON.stringify(extraB)}` : ''}${extraA.length ? `; ${ids[i]} additionally sweeps in ${JSON.stringify(extraA)}` : ''}.\n` +
        `      Their categories are "${CLS.entries.find(e => e.id === ids[i])?.category}" and "${CLS.entries.find(e => e.id === ids[j])?.category}", for one printed shape.\n` +
        `      Align the two granularities, or declare the pair in CONSTRUCT_GRANULARITY with the reason they differ.`);
    }
  }

  // -- NO TWO LIVE PROPERTIES HOLD THE SAME FACT --------------------------------------------
  //
  // A ruling of `same-fact` says two differently-named properties hold one fact. Until this
  // check existed that ruling could sit in this file forever as a sentence while both properties
  // stayed live and bound - which is the failure a shared backbone exists to prevent, because
  // one taxpayer's rent living in two properties can only ever diverge, and a divergence between
  // two properties holding one fact is invisible on both filed forms: each prints its own and
  // neither prints the other.
  //
  // AND THE RULING'S OWN SUCCESS REMOVES IT FROM THE CANDIDATE SET. Candidates are drawn from
  // entries categorised `new`; rebinding the rent key moved it to same-fact-different-
  // decomposition, so it can never surface as a candidate again. A check that looked only at
  // live candidates would therefore report nothing and mean nothing the moment it worked. This
  // one reads the RULINGS, which outlive the candidacy, and asserts the binding they claim.
  //
  // THE TEST EACH RULING HAS TO HAVE ANSWERED: would one property serving both forms ever have
  // to hold two different values for one taxpayer at one moment? A `same-fact` ruling says no,
  // and this asserts that the answer was acted on rather than recorded.
  const rebinds = [];
  for (const rl of SAME_FACT_RULINGS) {
    if (rl.ruling !== 'same-fact') continue;
    const prop = (FIELDS.properties || []).find(p => p.key === rl.key);
    if (!prop) { problems.push(`SAME-FACT RULING WITH NO DEFINITION  ${rl.key} is ruled same-fact as ${rl.candidate}, and adapters/hubspot/fields.${form}.json defines no property for that key. The ruling is about a binding that does not exist.`); continue; }
    const bound = prop.hs_name === rl.candidate;
    rebinds.push({ key: rl.key, candidate: rl.candidate, bound_to: prop.hs_name, bound, carried: rl.carried ?? null });
    if (!bound) problems.push(
      `TWO LIVE PROPERTIES, ONE FACT  ${rl.key} is ruled SAME FACT as ${rl.candidate} and binds ${prop.hs_name}.
` +
      `      Both hold the taxpayer's answer to one question, so they can diverge and nothing on either filed form shows it.
` +
      `      Bind the key to ${rl.candidate}, or change the ruling to different-fact with the reason. A same-fact ruling nobody acted on is not a decision, it is a note.`);
  }
  // The orphan must be gone from the definitions too: a rebound key whose old name is still
  // provisioned recreates the duplicate on the next run.
  const definedNames = new Set((FIELDS.properties || []).map(p => p.hs_name));
  for (const rl of SAME_FACT_RULINGS) {
    if (rl.ruling !== 'same-fact' || !rl.orphan) continue;
    if (definedNames.has(rl.orphan)) problems.push(`ORPHAN STILL DEFINED  ${rl.key} was rebound to ${rl.candidate} and ${rl.orphan} is still named in fields.${form}.json. The next provisioning run would recreate one fact in two places.`);
  }

  return { form, back, reuse, candidates, comparedAgainst, asymmetric, granularity, sameConstruct, problems, CLS, coverage, rebinds };
};

export const report = (r, { verbose = false } = {}) => {
  const contribCount = (f) => [...r.back.values()].filter(v => v.contributors.has(f)).length;
  console.log(`reclassify ${r.form} against the backbone: ${r.back.size} live irs433_* name(s) — 433a ${contribCount('433a')}, 433f ${contribCount('433f')}, ${r.form} ${contribCount(r.form)}`);
  const widened = [...r.comparedAgainst.values()].filter(v => v.length > 1).length;
  console.log(`  compared_against: ${r.comparedAgainst.size} entr(ies) — ${widened} compare against more than one form, ${r.comparedAgainst.size - widened} against ${r.CLS.against} alone`);
  console.log(`  name reuse (a shared name another form contributed): ${r.reuse.length}`);
  for (const x of r.reuse) console.log(`    ${x.entry} [${x.category}] ${x.key} -> ${x.shared}, contributed by ${x.contributors.join('+')}${x.declared_backbone_key ? `; the crosswalk row already declares backbone_key "${x.declared_backbone_key}"` : '; the crosswalk row declares NO backbone_key'}`);
  const ruled = r.candidates.filter(c => c.ruling);
  console.log(`  same-fact candidates at jaccard >= ${CANDIDATE_THRESHOLD}: ${r.candidates.length} — ${ruled.filter(c => c.ruling === 'same-fact').length} ruled same-fact, ${ruled.filter(c => c.ruling === 'different-fact').length} ruled different-fact, ${r.candidates.length - ruled.length} UNRULED`);
  for (const c of r.candidates.filter(c => c.ruling === 'same-fact')) console.log(`    SAME FACT  ${c.key} = ${c.candidate} [${c.contributors.join('+')}] — carried as ${c.carried}`);
  // A same-fact ruling reported as a CANDIDATE disappears the moment it is acted on, because
  // rebinding moves its entry out of the `new` category the candidate test draws from. So the
  // rulings are reported from the rulings, and each says which property its key actually binds.
  console.log(`  same-fact rulings, and what each key binds today: ${r.rebinds.length}`);
  for (const b of r.rebinds) console.log(`    ${b.bound ? 'REBOUND ' : 'NOT BOUND'}  ${b.key} -> ${b.bound_to}${b.bound ? '' : ` (ruled same fact as ${b.candidate})`}${b.carried ? `  [${b.carried}]` : ''}`);
  if (verbose) for (const c of r.candidates.filter(c => c.ruling === 'different-fact')) console.log(`    different  ${c.key} vs ${c.candidate} (shared ${c.shared.join(',')})`);
  console.log(`  asymmetric-the-other-way claims checked: ${r.asymmetric.length} group(s) named, ${r.asymmetric.filter(a => a.clash.length).length} contradicted by a group on this form`);
  const byG = r.granularity.reduce((a, g) => { a[g.granularity] = (a[g.granularity] || 0) + 1; return a; }, {});
  console.log(`  granularity: ${Object.entries(byG).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  console.log(`  same-construct pairs: ${r.sameConstruct.length} found, ${r.sameConstruct.filter(x => x.differs).length} carrying two granularities, ${r.sameConstruct.filter(x => x.differs && !x.declared).length} undeclared`);
  for (const x of r.sameConstruct) console.log(`    ${x.a} (${x.ga}, ${x.sizes[0]} cell(s)) / ${x.b} (${x.gb}, ${x.sizes[1]} cell(s)) — ${x.prefixes[0]} against ${x.prefixes[1]}, ${x.shared} suffix(es) shared${x.extraB.length ? `; ${x.b} also sweeps in ${x.extraB.join(', ')}` : ''}${x.extraA.length ? `; ${x.a} also sweeps in ${x.extraA.join(', ')}` : ''}${x.differs ? (x.declared ? ' — DIFFERS, declared' : ' — DIFFERS, UNDECLARED') : ' — same granularity'}`);
  if (!r.problems.length) { console.log('OK — every same-fact candidate carries a ruling, and no asymmetric claim is contradicted by a group on this form.'); return 0; }
  console.error(`RECLASSIFY — ${r.problems.length} problem(s):`);
  r.problems.forEach(p => console.error(`  ${p}`));
  return r.problems.length;
};

if (process.argv[1] && /reclassify-against-backbone\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const form = process.argv[2] || '433aoi';
  const r = reclassify(form);
  const rc = report(r, { verbose: process.argv.includes('--verbose') });
  if (process.argv.includes('--emit') && !rc) {
    // WRITE `compared_against` AND `granularity` INTO THE CLASSIFICATION. Derived on this run,
    // never typed, and re-derived on every later run — a stale one shows up as a mismatch.
    const path = `adapters/pdf/maps/${form}.crosswalk-classification.json`;
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    const gran = new Map(r.granularity.map(g => [g.id, g.granularity]));
    for (const e of doc.entries) {
      e.compared_against = r.comparedAgainst.get(e.id) || [];
      e.granularity = gran.get(e.id) || 'names-no-key-on-this-form';
    }
    writeFileSync(path, JSON.stringify(doc, null, 1) + '\n');
    console.log(`  wrote compared_against and granularity into ${path}`);
  }
  process.exit(rc ? 2 : 0);
}
