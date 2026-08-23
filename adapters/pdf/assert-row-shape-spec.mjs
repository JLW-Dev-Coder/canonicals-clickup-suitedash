// THE CHECK TWO BLANKETS HAD BEEN DESCRIBING FOR THREE SLICES AND NOBODY HAD WRITTEN.
//
//   node adapters/pdf/assert-row-shape-spec.mjs [--verbose]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// count-sweep.mjs [S-21] disposed of 269 claim sites in `adapters/hubspot/asset-row-shapes.json`
// with this reason:
//
//     "the lists it does hold — classes, columns, printed tables — are asserted structurally
//      by adapters/hubspot/validate-crosswalk.mjs, which fails when a declared column is
//      missing from a claimed table. A count would be weaker than the check already running."
//
// and [S-20f] said the same thing about the per-class column and printed-table lists.
//
// validate-crosswalk.mjs does not open asset-row-shapes.json. It reads `crosswalk.<form>.json`,
// the form's map, and the 433-A backbone, and nothing else. NOTHING IN THIS REPO read the row-
// shape specification as data — `check-row-shape.mjs` names it once, in a comment. So the
// largest blanket in the sweep stood over the artefact `row_class` routing is authored from,
// on a forward reference to a check that had never existed. The count was not "weaker than the
// check already running"; there was no check running.
//
// Found by adapters/pdf/blanket-audit.mjs, on the first run of its forward-reference register.
// This file is the check the blanket had been describing, written so the reference can be paid.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IT ASSERTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The spec's three lists are joined to the maps through ONE machine link: a group's
// `row_class.accepts`. That link already exists and already routes rows, so this file adds no
// new vocabulary — it asserts the thing the vocabulary was always claiming.
//
//   A1  DECLARED CLASS. Every class any map's group accepts is declared in the spec. A group
//       routing rows under a class name the shared spec never defined is a row class with no
//       definition, which is the D1 shape one level up: the name decides where the row prints
//       and nothing says what the name means.
//
//   A2  COLUMN REACHABILITY. For every class, every canonical column the spec says a form
//       CONTRIBUTES must be reachable on that form's accepting group — by its own key, by a
//       declared `printed_as` alias for that form, or by a declared reason it is not a printed
//       cell (`row_flag`, `printed_but_unmapped_on`). This is [S-20f]'s sentence, executable.
//
//   A3  ROUTING. A class claiming a printed table on a form where NO group accepts it is a
//       table the spec describes and the engine cannot route a row into. Each such claim must
//       be declared in the class's `unrouted` block with its reason. An undeclared one is a
//       STOP; a declared one is REPORTED on every run, because a declared gap that stops being
//       printed is a gap that has quietly become invisible again.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A DECLARATION IS NOT AN EXEMPTION
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `printed_as` and `unrouted` are checked, not trusted. A `printed_as` naming a column that
// does not exist on the accepting group is a STOP — otherwise the alias becomes the hiding
// place the missing column used to be. An `unrouted` entry for a form/class pair that IS
// routed is a stale declaration, and a decision for a divergence that has gone away is a STOP
// by the same standing rule that makes an undecided divergence one.

import { readFileSync, existsSync } from 'node:fs';
import { slotColumnsOf, slotColumnKinds } from './check-row-shape.mjs';
import { readPrintedText, readWidgetGeometry, baselineOfRun } from './page-geometry.mjs';
import { examined } from './examined.mjs';
import { MAPPED_FORMS } from './resolve-fixture.mjs';

const SPEC = 'adapters/hubspot/asset-row-shapes.json';
// The forms whose maps this spec is joined against. 433-A(OIC) carries no `printed_tables`
// key in the spec — the spec predates it — so it contributes to A1 only, which is exactly
// where it belongs: its groups accept classes and those classes must be defined.
// 433-B(OIC) JOINS AT ITS SLICE 1. A form absent from this list is silently outside A1, A2 and A3
// — its groups can accept an undeclared class and nothing says so — which is an exclusion by
// omission and exactly the shape adapters/pdf/exclusion-sweep.mjs exists for. The list is widened
// in the same commit that gives 433-B(OIC) its first group.
const FORMS = ['433a', '433f', '433aoi', '433boi'];
const mapPath = (f) => `adapters/pdf/maps/${f}.map.json`;

/** Load the spec and every map that exists. */
export const load = () => {
  const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
  const maps = {};
  for (const f of FORMS) if (existsSync(mapPath(f))) maps[f] = JSON.parse(readFileSync(mapPath(f), 'utf8'));
  return { spec, maps };
};

// EXPORTED SO THE EXCLUSION SWEEP CROSS-CHECKS AGAINST THIS, NOT AGAINST A COPY OF IT.
// [A3]'s excusals are compared to reality by adapters/pdf/exclusion-sweep.mjs [EX-01], and the
// reality it compares against must be the SAME routing map this file asserts on. guard-sweep's
// (c) register records what a second implementation costs: a re-derived copy of the marker
// pairing disagreed 40-to-3 with the original, and the whole disagreement was in the copy.
/** Every (form, group) that accepts a class, with the columns its slots actually declare. */
/**
 * Columns a form binds through a TOP-LEVEL checkbox construct rather than through a group slot.
 *
 * WHY THIS EXISTS. slotColumnKinds() answers "what does this group's SLOT declaration name",
 * and on 433-F the answer for every accounts and real-estate group is `checkbox: (none)` —
 * because that form binds its row checkboxes in the map's top-level `checkboxes` block,
 * index-aligned to the group, not as slot columns. [A2]'s stale-unmapped check asked only
 * slotColumnKinds, so on 433-F it could return only one answer, and "the map does not bind
 * this column" was inferred from a reading that had never looked where the binding is.
 *
 * Three `printed_but_unmapped_on: "433f"` declarations stood on that inference — for
 * bank_account.is_business_account, investment.is_business_account and real_property.kind —
 * while the map bound all eight widgets and fill-433f.mjs wrote them on every run. The
 * spec file's own rule says naming a form that DOES bind the column is a STALE declaration
 * and a STOP; the check that enforces it was structurally incapable of firing.
 *
 * THE PAIRING IS DECLARED, NEVER INFERRED. `checkboxes._binds` names the group and the
 * canonical column for each row-level construct, and fill-433f.mjs reads the same block, so
 * the engine and the assertion cannot hold different beliefs about what is bound.
 */
export const checkboxBoundColumns = (map) => {
  const out = new Map();      // group -> Set(column)
  for (const d of Object.values(map?.checkboxes?._binds || {})) {
    if (!d || typeof d !== 'object' || !d.group || !d.column) continue;
    if (!out.has(d.group)) out.set(d.group, new Set());
    out.get(d.group).add(d.column);
  }
  return out;
};

export const acceptorsOf = (maps) => {
  const out = new Map();      // class_id -> [{ form, group, cols:Set }]
  for (const [form, map] of Object.entries(maps)) {
    for (const [group, def] of Object.entries(map.groups || {})) {
      if (group.startsWith('_')) continue;
      const accepts = def?.row_class?.accepts;
      if (!Array.isArray(accepts)) continue;
      let cols = [];
      try { cols = slotColumnsOf(map, group) || []; } catch { cols = []; }
      // The same columns kept apart by construct, for [D-06]'s split. `cols` stays the union
      // so every existing caller — the exclusion sweep among them — reads what it always did.
      //
      // AN UNREADABLE GROUP IS A STOP, NOT AN EMPTY ONE. The first draft caught the throw and
      // left both sets empty, and empty is the shape that makes A2's row_flag branch report the
      // excusal CONFIRMED — the column is in neither set, so nothing contradicts it. That is a
      // success message guarded by the failure to read, which is [G-01] exactly, and the guard
      // sweep refused it on its first run against this file. `kindsError` is carried onto the
      // acceptor and turned into a problem by A2 before any column is judged.
      let kinds = { text: new Set(), checkbox: new Set() }, kindsError = null;
      try {
        const k = slotColumnKinds(map, group);
        if (!k) kindsError = `slotColumnKinds resolved no group for ${form}.${group}`;
        else kinds = k;
      } catch (e) { kindsError = `slotColumnKinds threw on ${form}.${group}: ${e.message}`; }
      // A COLUMN BOUND BY A TOP-LEVEL CHECKBOX CONSTRUCT IS BOUND. The union is taken here, at
      // the one place the acceptor is built, so every check downstream sees the same set.
      const cbDeclared = checkboxBoundColumns(map).get(group) || new Set();
      const cbAll = new Set([...kinds.checkbox, ...cbDeclared]);
      for (const cls of accepts) {
        if (!out.has(cls)) out.set(cls, []);
        out.get(cls).push({ form, group, cols: new Set([...cols, ...cbDeclared]), textCols: kinds.text, cbCols: cbAll, kindsError });
      }
    }
  }
  return out;
};

/**
 * A printed_tables entry that names no table this repo could route into: the class says the
 * form prints nothing of the kind, or prints it and the map does not bind it.
 *
 * EVERY EXCLUSION THIS MAKES IS REPORTED. A3's routing check reads `if (real.length && ...)`,
 * and `real` is what survives this filter — so a filter that quietly grew would empty `real`
 * and turn the routing assertion off, silently, in exactly the shape guard-sweep.mjs [G-01]
 * names. `excusedClaims()` enumerates what it removed and the report prints the count, so an
 * assertion that stops asserting cannot do it without saying so.
 */
const claimsNothing = (t) => /^\s*none\b/i.test(t) || /not currently mapped/i.test(t);

/** Every printed_tables entry claimsNothing() removed from A3's scope, with which class it is on. */
export const excusedClaims = () => {
  const { spec } = load();
  const out = [];
  for (const c of (spec.classes || []))
    for (const [form, tables] of Object.entries(c.printed_tables || {}))
      for (const t of tables) if (claimsNothing(t)) out.push({ class_id: c.class_id, form, text: t });
  return out;
};

/**
 * THE SCOPE — what this instrument covers, as a list of named units. The blanket audit's
 * forward-reference prover compares its DEMANDED atoms against this, so the scope is
 * published rather than described.
 */
export const rowShapeSpecScope = () => {
  const { spec, maps } = load();
  const acc = acceptorsOf(maps);
  const units = [];
  for (const c of (spec.classes || [])) {
    units.push(`class:${c.class_id}`);
    for (const col of (c.canonical_row || [])) units.push(`column:${c.class_id}.${col.key}`);
    for (const [form, tables] of Object.entries(c.printed_tables || {}))
      for (const t of tables) if (!claimsNothing(t)) units.push(`table:${c.class_id}@${form}`);
  }
  for (const [cls, list] of acc) for (const a of list) units.push(`accept:${a.form}.${a.group}->${cls}`);
  return { units: [...new Set(units)], classes: (spec.classes || []).length, forms: Object.keys(maps) };
};

/**
 * RUN THE THREE ASSERTIONS. Returns a flat list of problem strings — empty means it holds.
 * Exported so blanket-audit.mjs can prove [S-20f]/[S-21]'s forward reference against the real
 * thing rather than against a copy of it.
 */
export const rowShapeSpecProblems = (given) => {
  const { spec, maps } = given || load();
  const acc = acceptorsOf(maps);
  const declared = new Set((spec.classes || []).map(c => c.class_id));
  const problems = [];

  // ── A1  every accepted class is declared ────────────────────────────────────────────────
  for (const [cls, list] of acc) {
    if (declared.has(cls)) continue;
    problems.push(`A1 UNDECLARED CLASS "${cls}" — accepted by ${list.map(a => `${a.form}.${a.group}`).join(', ')} and defined by no class in ${SPEC}. A row routed under a name the shared spec never defined has a destination and no definition.`);
  }

  // ── A2  every contributed column is reachable on the accepting group ────────────────────
  //
  // [D-06] IS SETTLED HERE, AND IT SPLIT THE OTHER WAY FROM THE WAY IT WAS FILED.
  //
  // `row_flag` used to be one boolean excusing five columns from this assertion, with the
  // artefact calling it "prints as a CHECKBOX" and the line below calling it "not a printed
  // cell". A checkbox IS a printed cell, so those were two rules, and the maps showed neither
  // covered all five. It is now two keys, and both are KEYED BY FORM — because reading the
  // printed page rather than the maps showed the same column is a discriminator on one form
  // and a drawn checkbox on another:
  //
  //   row_flag[<form>]             the form draws NO cell. Excused here — AND THE EXCUSAL IS
  //                                ASSERTED: the column must be reachable on that form as
  //                                neither text nor checkbox. An excusal over a bound column
  //                                is a declaration the map contradicts, which is a STOP.
  //   printed_as_checkbox[<form>]  the form DRAWS a checkbox. CHECKED, and checked as a
  //                                checkbox: a text binding for it does not satisfy it, since
  //                                that is exactly the map that got the construct wrong.
  //
  // BOTH RUN REGARDLESS OF `contributed_by` AND OF `printed_tables`. Those two filters exist
  // for the union's TEXT columns, whose vocabulary predates 433-A(OIC). A per-form declaration
  // names its own form, and skipping it because the class's printed_tables block has no entry
  // for that form would be an exclusion by omission — the shape the whole exclusion sweep is
  // about, inside the assertion the sweep reports on.
  for (const c of (spec.classes || [])) {
    for (const a of (acc.get(c.class_id) || [])) {
      // AN UNREADABLE GROUP IS REPORTED BEFORE ANY COLUMN IS JUDGED. Judging columns against
      // two empty sets would confirm every row_flag excusal on this group and report success.
      if (a.kindsError) {
        problems.push(`A2 UNREADABLE GROUP ${a.form}.${a.group} accepts ${c.class_id} and its slot columns could not be read (${a.kindsError}). Every excusal on this group would be confirmed by the absence of a contradiction, which is the reading not happening rather than passing.`);
        continue;
      }
      for (const col of (c.canonical_row || [])) {
        const flagged = col.row_flag && typeof col.row_flag === 'object'
          ? Object.prototype.hasOwnProperty.call(col.row_flag, a.form) : col.row_flag === true;
        const printedCb = col.printed_as_checkbox?.[a.form];
        const unmappedDecl = col.printed_but_unmapped_on;
        const unmappedHere = unmappedDecl === a.form || (Array.isArray(unmappedDecl) && unmappedDecl.includes(a.form));

        if (flagged && printedCb)
          problems.push(`A2 BOTH KEYS ON ONE OCCURRENCE ${c.class_id}.${col.key} declares row_flag["${a.form}"] AND printed_as_checkbox["${a.form}"]. The form either draws a cell for it or it does not; declaring both is the undivided key back again.`);

        if (flagged) {
          // THE EXCUSAL, ASSERTED. This is the check the old blanket never made.
          if (a.textCols.has(col.key))
            problems.push(`A2 FLAG CONTRADICTED ${c.class_id}.${col.key} is excused on ${a.form} as a routing discriminator the form draws no cell for, and ${a.form}.${a.group} binds it as a TEXT column. The map says the form prints it. Drop the flag or unbind the cell.`);
          else if (a.cbCols.has(col.key))
            problems.push(`A2 FLAG CONTRADICTED ${c.class_id}.${col.key} is excused on ${a.form} as drawing no cell, and ${a.form}.${a.group} binds it as a CHECKBOX. That is printed_as_checkbox["${a.form}"], not row_flag["${a.form}"].`);
          continue;
        }

        if (printedCb) {
          if (unmappedHere) {
            // A DECLARED UNMAPPED PRINTED CELL, checked the way A3 checks a stale unrouted.
            if (a.cbCols.has(col.key) || a.textCols.has(col.key))
              problems.push(`A2 STALE UNMAPPED ${c.class_id}.${col.key}.printed_but_unmapped_on names "${a.form}" and ${a.form}.${a.group} DOES bind it now. A decision for a gap that has gone away is a STOP, same as one with no decision at all.`);
            continue;
          }
          if (a.textCols.has(col.key))
            problems.push(`A2 CHECKBOX BOUND AS TEXT ${c.class_id}.${col.key} is declared printed_as_checkbox on ${a.form} and ${a.form}.${a.group} binds it under \`text\`. The value would be printed as a string into a cell the form draws as a box.`);
          else if (!a.cbCols.has(col.key))
            problems.push(`A2 PRINTED CHECKBOX NOT BOUND ${c.class_id}.${col.key} — ${a.form} draws a checkbox for it (${(printedCb.widgets || []).length} widget(s)) and ${a.form}.${a.group} binds no such checkbox column. Bind it, or declare printed_but_unmapped_on with the reason.`);
          continue;
        }

        // ── the union's TEXT columns, as before ────────────────────────────────────────
        // The spec's `contributed_by` vocabulary predates 433-A(OIC), so a form it does not
        // name contributes nothing to check here — A1 has already asserted the class exists.
        if (!Object.prototype.hasOwnProperty.call(c.printed_tables || {}, a.form)) continue;
        if (col.contributed_by !== a.form && col.contributed_by !== 'both') continue;
        const unmapped = col.printed_but_unmapped_on;
        if (unmapped === a.form || (Array.isArray(unmapped) && unmapped.includes(a.form))) continue;
        const alias = col.printed_as?.[a.form];
        if (alias !== undefined) {
          // A DECLARATION IS NOT AN EXEMPTION. The alias must exist on the group it names.
          if (!a.cols.has(alias))
            problems.push(`A2 DEAD ALIAS ${c.class_id}.${col.key}.printed_as["${a.form}"] = "${alias}", and ${a.form}.${a.group} declares no such column (it declares: ${[...a.cols].join(', ') || 'none'}). An alias pointing at nothing is the missing column with a name on it.`);
          continue;
        }
        if (!a.cols.has(col.key))
          problems.push(`A2 MISSING COLUMN ${c.class_id}.${col.key} — contributed_by "${col.contributed_by}", and the accepting group ${a.form}.${a.group} declares no column of that key and no printed_as alias for ${a.form}. Declare the alias, mark it row_flag or printed_but_unmapped_on, or bind the column.`);
      }
    }
  }

  // ── A3  routing: a claimed printed table with no group to route into ────────────────────
  for (const c of (spec.classes || [])) {
    const un = c.unrouted || {};
    for (const [form, tables] of Object.entries(c.printed_tables || {})) {
      const real = tables.filter(t => !claimsNothing(t));
      const routed = (acc.get(c.class_id) || []).some(a => a.form === form);
      if (real.length && !routed && !un[form])
        problems.push(`A3 UNROUTED ${c.class_id} claims ${form} table(s) ${JSON.stringify(real)} and no ${form} group accepts that class. Declare it in classes[].unrouted["${form}"] with the reason, or give the group a row_class.`);
      if (routed && un[form])
        problems.push(`A3 STALE UNROUTED ${c.class_id}.unrouted["${form}"] is declared and ${form} DOES route it now (${(acc.get(c.class_id) || []).filter(a => a.form === form).map(a => a.group).join(', ')}). A decision for a divergence that has gone away is a STOP, same as one with no decision at all.`);
    }
    // An `unrouted` block for a form the class claims no table on is a declaration about nothing.
    for (const form of Object.keys(un))
      if (!((c.printed_tables || {})[form] || []).some(t => !claimsNothing(t)))
        problems.push(`A3 ORPHAN UNROUTED ${c.class_id}.unrouted["${form}"] is declared and the class claims no routable ${form} table for it to be about.`);
  }

  return problems;
};

/** The declared, live routing gaps — printed on every run so a declared gap stays visible. */
/**
 * A4 — THE PRINTED EVIDENCE IS THE PRINTED PAGE.
 *
 * `printed_as_checkbox` is admissible only because it carries evidence: the printed label's
 * (page, baseline, x1) and the widget names the form draws. Both are re-derived here from the
 * form's own bytes, so the declaration cannot become prose that once was true.
 *
 * This is the assertion [D-06] never had. The old `row_flag` said "prints as a CHECKBOX" about
 * five columns and NOTHING compared that sentence to a page — which is how a split derived from
 * map reachability stood for three prompts as though it were derived from the form.
 *
 * ASYNC, because it reads PDFs; kept out of rowShapeSpecProblems() so the synchronous callers
 * (blanket-audit's forward-reference prover, the exclusion sweep) are unchanged.
 */
export const printedEvidenceProblems = async () => {
  const { spec } = load();
  const problems = [];
  const seen = { labels: 0, widgets: 0, forms: new Set() };
  const cache = new Map();
  for (const c of (spec.classes || [])) {
    for (const col of (c.canonical_row || [])) {
      for (const [form, ev] of Object.entries(col.printed_as_checkbox || {})) {
        const file = `adapters/pdf/forms/f${form}.pdf`;
        if (!existsSync(file)) {
          problems.push(`A4 UNREADABLE FORM ${c.class_id}.${col.key}.printed_as_checkbox["${form}"] — ${file} is not in this tree, so the evidence could not be checked. A reading that did not happen is not a pass.`);
          continue;
        }
        seen.forms.add(form);
        if (!cache.has(form)) {
          const bytes = readFileSync(file);
          const geo = await readWidgetGeometry(bytes);
          cache.set(form, {
            pages: await readPrintedText(bytes),
            boxes: new Set(geo.widgets.filter((w) => /checkbox/i.test(String(w.type))).map((w) => w.name)),
            all: new Set(geo.widgets.map((w) => w.name)),
          });
        }
        const { pages, boxes, all } = cache.get(form);
        for (const at of (ev.printed_label || [])) {
          seen.labels++;
          const hit = (pages[at.page - 1]?.items || [])
            .find((t) => Math.abs(baselineOfRun(t) - at.y) <= 0.05 && Math.abs(t.x1 - at.x1) <= 0.05);
          if (!hit)
            problems.push(`A4 LABEL NOT DRAWN ${c.class_id}.${col.key} on ${form} cites a printed label at p${at.page} y=${at.y} x1=${at.x1} and the page draws no run there. The evidence for "the form prints a cell for this" is not on the form.`);
        }
        for (const w of (ev.widgets || [])) {
          seen.widgets++;
          if (!all.has(w))
            problems.push(`A4 WIDGET NOT DRAWN ${c.class_id}.${col.key} on ${form} cites widget ${w} and the form draws no such field.`);
          else if (!boxes.has(w))
            problems.push(`A4 NOT A CHECKBOX ${c.class_id}.${col.key} on ${form} cites ${w} as a printed checkbox and the form draws it as something else.`);
        }
        if (!(ev.printed_label || []).length && !(ev.widgets || []).length)
          problems.push(`A4 NO EVIDENCE ${c.class_id}.${col.key}.printed_as_checkbox["${form}"] carries neither a printed label nor a widget. A declaration with no evidence is the prose the split replaced.`);
      }
    }
  }
  return { problems, seen: { ...seen, forms: [...seen.forms].sort() } };
};

/**
 * THE CANARY FOR THE SPLIT. Each case mutates the spec or a map IN MEMORY and requires the
 * matching problem class to fire. A2's new branches would otherwise be four sentences nobody
 * has ever seen the engine say.
 */
export const splitCanary = () => {
  const base = load();
  const clone = () => JSON.parse(JSON.stringify(base));
  const fires = (mut, needle) => rowShapeSpecProblems(mut).some((p) => p.startsWith(needle));
  const colOf = (doc, cls, key) => doc.spec.classes.find((c) => c.class_id === cls).canonical_row.find((c) => c.key === key);

  const cases = [];

  // 1. a printed checkbox that stops being bound must be reported.
  //    EVERY SLOT, because slotColumnKinds unions across a group's slots — a column dropped
  //    from one row is still declared by the others, and that union is correct: the row shape
  //    is the group's, not the slot's. The first draft of this canary unbound slot[0] only,
  //    reported MISSED, and was wrong about the engine rather than finding something.
  {
    const m = clone();
    for (const s of m.maps['433a'].groups.household_members.slots) delete s.checkboxes.claimed_on_1040;
    cases.push(['a bound printed checkbox unbound on every slot', fires(m, 'A2 PRINTED CHECKBOX NOT BOUND')]);
  }
  // 2. a printed checkbox bound as TEXT must be reported, not silently accepted.
  {
    const m = clone();
    const s = m.maps['433a'].groups.household_members.slots;
    for (const slot of s) { slot.text.claimed_on_1040 = slot.checkboxes.claimed_on_1040.yes; delete slot.checkboxes.claimed_on_1040; }
    cases.push(['a printed checkbox rebound under `text`', fires(m, 'A2 CHECKBOX BOUND AS TEXT')]);
  }
  // 3. a row_flag excusal over a column the map DOES bind must be reported. This is the exact
  //    state the undivided key made unreportable.
  {
    const m = clone();
    const col = colOf(m, 'household_member', 'claimed_on_1040');
    delete col.printed_as_checkbox;
    col.row_flag = { '433a': 'canary: claims 433-A draws no cell for it' };
    cases.push(['a row_flag excusal over a bound checkbox', fires(m, 'A2 FLAG CONTRADICTED')]);
  }
  // 4. a printed_but_unmapped_on for a form that binds the column must be reported stale.
  {
    const m = clone();
    const col = colOf(m, 'household_member', 'claimed_on_1040');
    col.printed_but_unmapped_on = '433a';
    cases.push(['a stale printed_but_unmapped_on', fires(m, 'A2 STALE UNMAPPED')]);
  }
  // 5. both keys on one occurrence is the undivided key returning.
  {
    const m = clone();
    colOf(m, 'household_member', 'claimed_on_1040').row_flag = { '433a': 'canary' };
    cases.push(['both keys on one (column, form)', fires(m, 'A2 BOTH KEYS ON ONE OCCURRENCE')]);
  }
  // 6. AND THE NEGATIVE: the tree as it stands must produce none of them.
  cases.push(['the tree as it stands produces no A2 problem', rowShapeSpecProblems().length === 0]);

  const missed = cases.filter(([, ok]) => !ok).map(([what]) => what);
  return { checks: cases.length, missed, holds: missed.length === 0 };
};

export const rowShapeSpecDeclaredGaps = () => {
  const { spec } = load();
  const out = [];
  for (const c of (spec.classes || [])) for (const [form, why] of Object.entries(c.unrouted || {}))
    out.push({ class_id: c.class_id, form, why });
  return out;
};

export const reportRowShapeSpec = ({ verbose = false } = {}) => {
  const scope = rowShapeSpecScope();
  const problems = rowShapeSpecProblems();
  const gaps = rowShapeSpecDeclaredGaps();
  const excused = excusedClaims();
  console.log(`row-shape spec: ${scope.classes} class(es), ${scope.units.length} checked unit(s) across maps ${scope.forms.join(', ')}`);
  console.log(`  ${excused.length} printed-table claim(s) excused from the routing assertion as "none" or "printed, not currently mapped"${verbose ? ':' : ' — pass --verbose to list them'}`);
  if (verbose) for (const e of excused) console.log(`    ${e.form}  ${e.class_id}  ${JSON.stringify(e.text.slice(0, 90))}`);
  if (gaps.length) {
    console.log(`  ${gaps.length} DECLARED routing gap(s) — a class the spec says a form prints, with no group on that form accepting it:`);
    for (const g of gaps) console.log(`    ${g.form}  ${g.class_id}`);
    if (verbose) for (const g of gaps) console.log(`      ${g.class_id}@${g.form}: ${g.why}`);
  }
  // ── [D-06]'s SPLIT, PRINTED ON EVERY RUN ────────────────────────────────────────────
  const split = splitOccurrences();
  console.log(`  [D-06] split: ${split.flag.length} routing-discriminator occurrence(s), ${split.checkbox.length} printed-checkbox occurrence(s), across ${split.forms.length} form(s) — keyed by (column, form), never by column`);
  for (const o of split.flag) console.log(`    row_flag            ${o.at.padEnd(46)} ${o.reason.slice(0, 78)}`);
  for (const o of split.checkbox) console.log(`    printed_as_checkbox ${o.at.padEnd(46)} ${o.bound ? 'bound' : `UNMAPPED (declared: ${o.unmapped ? 'yes' : 'NO'})`}, ${o.labels} label(s), ${o.widgets} widget(s)`);
  const kan = splitCanary();
  console.log(`  canary: ${kan.holds ? 'holds' : `MISSED ${kan.missed.join('; ')}`} (${kan.checks} mutations, every new A2 branch fired and the tree as it stands fires none)`);
  if (!kan.holds) problems.push(`CANARY DEAD — ${kan.missed.length} of ${kan.checks} mutation(s) went unreported: ${kan.missed.join('; ')}. The split's assertions cannot see the states they were written for, so this file's OK is about nothing.`);

  if (!problems.length) {
    // rowShapeSpecScope() is the derived scope this file already reports on; its `forms` is
    // the list of forms an accepting group was found on. A mapped form absent from it has
    // been examined ZERO times by this guard and is emitted as such.
    { const sc = rowShapeSpecScope();
      for (const f of MAPPED_FORMS()) {
        examined('assert-row-shape-spec', f, sc.forms.includes(f) ? sc.units.length : 0, 'declared-row-shape-units');
      } }
    console.log('OK — every accepted class is declared, every contributed column is reachable on the group that accepts it, every printed checkbox is bound as a checkbox or declared unmapped, every routing-flag excusal is contradicted by no map, and every unrouted claim carries a live declaration.');
    return 0;
  }
  console.error(`ROW-SHAPE SPEC — ${problems.length} problem(s):`);
  problems.forEach(p => console.error(`  ${p}`));
  return problems.length;
};

/** Every (column, form) occurrence of either key, with what the maps say about it. */
export const splitOccurrences = () => {
  const { spec, maps } = load();
  const acc = acceptorsOf(maps);
  const flag = [], checkbox = [], forms = new Set();
  for (const c of (spec.classes || [])) for (const col of (c.canonical_row || [])) {
    for (const [form, why] of Object.entries(col.row_flag && typeof col.row_flag === 'object' ? col.row_flag : {})) {
      forms.add(form); flag.push({ at: `${c.class_id}.${col.key}@${form}`, form, reason: String(why) });
    }
    for (const [form, ev] of Object.entries(col.printed_as_checkbox || {})) {
      forms.add(form);
      const a = (acc.get(c.class_id) || []).find((x) => x.form === form);
      const u = col.printed_but_unmapped_on;
      checkbox.push({
        at: `${c.class_id}.${col.key}@${form}`, form,
        bound: !!a && a.cbCols.has(col.key),
        unmapped: u === form || (Array.isArray(u) && u.includes(form)),
        labels: (ev.printed_label || []).length, widgets: (ev.widgets || []).length,
      });
    }
  }
  return { flag, checkbox, forms: [...forms].sort() };
};

// CLI
if (process.argv[1] && /assert-row-shape-spec\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const verbose = process.argv.includes('--verbose');
  let n = reportRowShapeSpec({ verbose });
  const ev = await printedEvidenceProblems();
  console.log(`  printed evidence: ${ev.seen.labels} printed label(s) and ${ev.seen.widgets} widget(s) re-derived from the page bytes of ${ev.seen.forms.join(', ') || 'no form'}`);
  if (ev.problems.length) {
    console.error(`PRINTED EVIDENCE — ${ev.problems.length} problem(s):`);
    ev.problems.forEach((p) => console.error(`  ${p}`));
    n += ev.problems.length;
  }
  process.exit(n ? 2 : 0);
}
