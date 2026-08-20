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
import { slotColumnsOf } from './check-row-shape.mjs';

const SPEC = 'adapters/hubspot/asset-row-shapes.json';
// The forms whose maps this spec is joined against. 433-A(OIC) carries no `printed_tables`
// key in the spec — the spec predates it — so it contributes to A1 only, which is exactly
// where it belongs: its groups accept classes and those classes must be defined.
const FORMS = ['433a', '433f', '433aoi'];
const mapPath = (f) => `adapters/pdf/maps/${f}.map.json`;

/** Load the spec and every map that exists. */
export const load = () => {
  const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
  const maps = {};
  for (const f of FORMS) if (existsSync(mapPath(f))) maps[f] = JSON.parse(readFileSync(mapPath(f), 'utf8'));
  return { spec, maps };
};

// EXPORTED SO THE EXCLUSION SWEEP CROSS-CHECKS AGAINST THIS, NOT AGAINST A COPY OF IT.
// [A3]'s excusals are compared to reality by adapters/pdf/exclusion-sweep.mjs [X-01], and the
// reality it compares against must be the SAME routing map this file asserts on. guard-sweep's
// (c) register records what a second implementation costs: a re-derived copy of the marker
// pairing disagreed 40-to-3 with the original, and the whole disagreement was in the copy.
/** Every (form, group) that accepts a class, with the columns its slots actually declare. */
export const acceptorsOf = (maps) => {
  const out = new Map();      // class_id -> [{ form, group, cols:Set }]
  for (const [form, map] of Object.entries(maps)) {
    for (const [group, def] of Object.entries(map.groups || {})) {
      if (group.startsWith('_')) continue;
      const accepts = def?.row_class?.accepts;
      if (!Array.isArray(accepts)) continue;
      let cols = [];
      try { cols = slotColumnsOf(map, group) || []; } catch { cols = []; }
      for (const cls of accepts) {
        if (!out.has(cls)) out.set(cls, []);
        out.get(cls).push({ form, group, cols: new Set(cols) });
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
export const rowShapeSpecProblems = () => {
  const { spec, maps } = load();
  const acc = acceptorsOf(maps);
  const declared = new Set((spec.classes || []).map(c => c.class_id));
  const problems = [];

  // ── A1  every accepted class is declared ────────────────────────────────────────────────
  for (const [cls, list] of acc) {
    if (declared.has(cls)) continue;
    problems.push(`A1 UNDECLARED CLASS "${cls}" — accepted by ${list.map(a => `${a.form}.${a.group}`).join(', ')} and defined by no class in ${SPEC}. A row routed under a name the shared spec never defined has a destination and no definition.`);
  }

  // ── A2  every contributed column is reachable on the accepting group ────────────────────
  for (const c of (spec.classes || [])) {
    for (const a of (acc.get(c.class_id) || [])) {
      // The spec's `contributed_by` vocabulary predates 433-A(OIC), so a form it does not
      // name contributes nothing to check here — A1 has already asserted the class exists.
      if (!Object.prototype.hasOwnProperty.call(c.printed_tables || {}, a.form)) continue;
      for (const col of (c.canonical_row || [])) {
        if (col.contributed_by !== a.form && col.contributed_by !== 'both') continue;
        if (col.row_flag === true) continue;                                   // a routing flag, not a printed cell
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
  if (!problems.length) {
    console.log('OK — every accepted class is declared, every contributed column is reachable on the group that accepts it, and every unrouted claim carries a live declaration.');
    return 0;
  }
  console.error(`ROW-SHAPE SPEC — ${problems.length} problem(s):`);
  problems.forEach(p => console.error(`  ${p}`));
  return problems.length;
};

// CLI
if (process.argv[1] && /assert-row-shape-spec\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  process.exit(reportRowShapeSpec({ verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
