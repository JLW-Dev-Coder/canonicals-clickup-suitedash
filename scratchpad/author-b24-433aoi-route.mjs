// [B24] — GIVE 433-A(OIC) THE ROUTE PROPERTY ITS ENGINE ALREADY REQUIRES.
//
// One-shot, recorded in the commit that produced it.
//
// THE GAP. adapters/pdf/maps/433aoi.map.json declares `business_income_expense_route` over its
// lines (17) and (29), and adapters/pdf/record-shape.mjs reads it straight off the record. It
// is in neither the map's `map` block, nor `checkboxes`, nor `check_here`, nor any group
// source, so classification-coverage.mjs could not see it, crosswalk.433aoi.json had no row and
// fields.433aoi.json defined no property. A 433-A(OIC) record fetched from HubSpot could not
// carry the route, and gate step 11 STOPs on a record that declares none — so the round trip
// was broken for any record that goes through the portal. A finished form whose records cannot
// carry an input the engine requires is not finished.
//
// THREE ARTEFACTS MOVE, AND THE DERIVER DOES THE REST:
//   1. ENGINE_EXTRA_INPUTS['433aoi']            puts the key in this form's key space
//   2. 433aoi.crosswalk-classification.json     the entry that names it, category `new`
//   3. crosswalk.433aoi.json                    the binding row, with its option set
// derive-names-433aoi.mjs then DERIVES irs433aoi_business_income_expense_route and rewrites
// fields.433aoi.json. The name is not typed anywhere in this file.
//
// WHY `new` AND NOT `same-question-different-subject`. That category belongs to 433-B(OIC),
// whose classification is relative to the BACKBONE and whose subject is the business entity.
// This file's classification is relative to 433-A, and the subject register (Prompt 44 commit 1)
// records 433-A and 433-A(OIC) as COINCIDING — both the individual filer. So the question is not
// whether the subject differs; it is whether 433-A prints anything like this route. It does not:
//
//   433-A    p8 y=451.0  "(lines 68 through 88 should reconcile with business Profit and Loss
//                          Statement)"                        — a RECONCILIATION note
//   433-A(OIC) p5 y=421.3 "If you provide a current profit and loss (P&L) statement for the
//                          information below, enter the total gross monthly income on line 17
//                          and your monthly expenses on line 29 below."
//              p5 y=411.7 "Do not complete lines (12) - (16) and (18) - (28)."   — a ROUTE
//
// 433-A asks the taxpayer to make the two agree. 433-A(OIC) offers an alternative to completing
// the lines at all. Only the second is a route a record has to declare, and 433-A prints nothing
// like it. That is `new`, and `new` derives the form-scoped prefix — which is the same name
// [B24] predicted from the other direction, by ruling 6's subject test on 433-B(OIC).

import { readFileSync, writeFileSync } from 'node:fs';

const rw = (p, f) => {
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  const orig = readFileSync(p, 'utf8');
  if (orig !== JSON.stringify(doc, null, 1) + '\n')
    throw new Error(`${p} is not 1-space-indented; rewriting it would bury the change in a reindent diff`);
  f(doc);
  writeFileSync(p, JSON.stringify(doc, null, 1) + '\n');
};

const KEY = 'business_income_expense_route';
const ENTRY = 'X-83';

// ── 2. the classification entry ─────────────────────────────────────────────────────────
rw('adapters/pdf/maps/433aoi.crosswalk-classification.json', (c) => {
  if (c.entries.some((e) => e.id === ENTRY)) throw new Error(`${ENTRY} already exists`);
  if (c.entries.some((e) => String(e.oic || '').split(/,\s*/).includes(KEY)))
    throw new Error(`some entry already names ${KEY}; a key with two entries is a key with two categories`);
  c.entries.push({
    id: ENTRY,
    slice: 'Prompt 44 commit 2',
    page: 5,
    category: 'new',
    oic: KEY,
    a433: null,
    why: 'THE DECLARED PRINTED ROUTE THROUGH SECTION 6, and the input the fill engine requires before it will check lines (17) and (29). 433-A(OIC) page 5 prints, at baseline y 421.3, "If you provide a current profit and loss (P&L) statement for the information below, enter the total gross monthly income on line 17 and your monthly expenses on line 29 below." and at y 411.7 "Do not complete lines (12) - (16) and (18) - (28)." That is an ALTERNATIVE to completing the printed operand lines, so a record has to say which of the two it took before either total can be checked. 433-A prints nothing like it: its only profit-and-loss sentence is page 8 y 451.0, "(lines 68 through 88 should reconcile with business Profit and Loss Statement)", which asks the taxpayer to make the printed lines AGREE with a statement rather than offering to replace them. A reconciliation note and a route are different instructions, and only the second needs a stored answer. Hence `new`. NOT `same-question-different-subject`: that category is 433-B(OIC)\'s, whose classification is relative to the backbone and whose subject is the business entity; adapters/pdf/maps/_subjects.cross-form.json records 433-A and 433-A(OIC) as COINCIDING, so subject is not what separates them here — the printed instruction is. Found as [B24] while building 433-B(OIC)\'s key space, where the same input HAD a property and this form did not.',
    compared_against: ['433-A page 8 y 451.0, the Section 7 profit-and-loss reconciliation note — the only sentence on 433-A that names a profit and loss statement at all'],
    granularity: 'enumerated',
  });
});

// ── 3. the crosswalk binding ────────────────────────────────────────────────────────────
rw('adapters/hubspot/crosswalk.433aoi.json', (x) => {
  if (x.bindings.some((b) => b.key === KEY)) throw new Error(`${KEY} is already bound`);
  // THE OPTION SET IS READ OUT OF THE MAP'S OWN record_shape DECLARATION, not retyped. The
  // states the engine accepts are the states the property must offer, and A13 of the deriver
  // asserts exactly that — a spelling the fetch layer emits that the engine cannot resolve
  // reaches the page as nothing, silently.
  const map = JSON.parse(readFileSync('adapters/pdf/maps/433aoi.map.json', 'utf8'));
  const decl = (map.record_shape?.declarations || []).find((d) => d.input === KEY);
  if (!decl) throw new Error(`433aoi.map.json declares no record shape for ${KEY}`);
  const states = Object.keys(decl.states);
  if (states.length !== 2) throw new Error(`expected two states, the map declares ${states.length}`);
  const LABEL = {
    grid: 'Grid (lines 12-16 and 18-28 completed)',
    profit_and_loss_statement: 'Profit and loss statement attached',
  };
  for (const s of states) if (!LABEL[s]) throw new Error(`no label authored for state "${s}"`);
  x.bindings.push({
    key: KEY,
    entry: ENTRY,
    fact: KEY,
    backbone_key: null,
    type: 'enumeration',
    fieldType: 'select',
    type_basis: 'declared record shape - the printed route this filing takes through Section 6',
    pii: false,
    options: states.map((s, i) => ({ label: LABEL[s], value: s, displayOrder: i })),
    map_option_by_value: Object.fromEntries(states.map((s) => [s, s])),
  });
});

console.log(`[B24] ${ENTRY} added to the classification and ${KEY} bound in crosswalk.433aoi.json.`);
console.log('    the property NAME is not written here — run derive-names-433aoi.mjs, which derives it.');
