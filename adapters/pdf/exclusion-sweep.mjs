// THE FIFTH SWEEP — AN EXCLUSION IS A CLAIM, AND EVERY CLAIM GETS A COUNTER.
//
//   node adapters/pdf/exclusion-sweep.mjs [--verbose]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — [A3], READ THE OTHER WAY ROUND
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `adapters/hubspot/asset-row-shapes.json` said, of three 433-F tables:
//
//     "A > DIGITAL ASSETS (CRYPTOCURRENCY) - printed, not currently mapped"
//     "E1. Accounts Receivable owed to you or your business - printed, not currently mapped"
//     "E2 - printed, not currently mapped"
//
// `assert-row-shape-spec.mjs` excuses exactly that phrase from its routing assertion, via
// `claimsNothing()`. And `433f.map.json` had bound all three since the day they were authored
// — each group's own `_why` saying in terms that the shared row class binds.
//
// So the instrument was intact and its INPUT HAD BEEN QUIETLY NARROWED BY A SENTENCE. [A3] is
// the check written to find exactly this defect, and it reported OK over a scope something
// had shrunk. `excusedClaims()` printed all three on every run — and nothing compared them to
// the map, which is the completeness-counter problem pointed the other way: the engine counted
// what it took IN and never counted what it left OUT.
//
// The ruling this file implements:
//
//     ANY PREDICATE THAT EXCUSES A SITE FROM A CHECK IS REGISTERED, COUNTED, PRINTED, AND
//     CROSS-CHECKED AGAINST REALITY. An excusal saying "not currently mapped" is compared
//     against whether it is mapped. An unregistered exclusion predicate is a STOP.
//
// Printing an excusal is not counting it. Counting it is not checking it. `excusedClaims()`
// did the first, `reportRowShapeSpec` did the second, and three tables went missing anyway.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE THREE KINDS, AND WHICH ONE OWES A CROSS-CHECK
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   structural  removes nothing from any assertion's scope — it separates code from comment,
//               a key from a prose annotation, a value from its absence. There is no claim
//               about the world to contradict, and the reason says why.
//
//   scoped      genuinely narrows an assertion's scope, and the narrowing is ITSELF asserted
//               somewhere else, BY NAME. `_partition.deferred` shrinks what must be bound and
//               is derived from widget geometry by count-sweep [S-01]; a `scoped` entry must
//               name the assertion, and the name is printed.
//
//   claiming    narrows scope on the strength of A STATEMENT ABOUT REALITY — "this table is
//               not currently mapped", "this column is printed but unmapped on 433-F", "this
//               is a routing flag, not a printed cell". These are the dangerous ones, because
//               reality moves and the sentence does not. Every `claiming` entry MUST carry a
//               `crosscheck()`. One without is a STOP, in the same way an undisposed guard
//               site is.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THE COMPLETENESS CHECK SWEEPS, AND THE EXCLUSION INSIDE IT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Every call, in an exclusion position, to a predicate DEFINED IN ONE OF THE SWEPT FILES.
// Exclusion positions: `if (…) continue`, `if (…) return`, a filter or some/every over a
// negated predicate, a filter over a bare predicate.
//
// "DEFINED IN ONE OF THE SWEPT FILES" IS ITSELF AN EXCLUSION, so it is registered as [EX-90]
// and cross-checked. It removes `has`, `isArray`, `startsWith`, `test`, `includes` and the
// rest of the built-in vocabulary — 149 of the 187 raw hits — on the ground that they are the
// ordinary grammar of a condition and not predicates anyone authored to excuse anything. The
// discriminator is mechanical, not a judgement: the name either resolves to a
// `const X = (…) =>` / `function X(…)` in a swept file, or it does not.

import { readFileSync, readdirSync } from 'node:fs';
import { load, acceptorsOf, excusedClaims } from './assert-row-shape-spec.mjs';
import { slotColumnsOf } from './check-row-shape.mjs';
import { MAPPED_FORMS as FIXTURE_FORMS, candidatesFor } from './resolve-fixture.mjs';

export const SWEPT_DIRS = ['adapters/pdf', 'adapters/hubspot'];
const SPEC = 'adapters/hubspot/asset-row-shapes.json';

const STRLIT = /(['"`])(?:\\.|(?!\1)[^\\])*\1/g;
const isProse = (l) => { const t = l.trim(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

const sweptFiles = () => SWEPT_DIRS.flatMap((d) => readdirSync(d).filter((x) => x.endsWith('.mjs')).sort().map((f) => `${d}/${f}`));

// ---------------------------------------------------------------------------------------
// THE SITE SCANNER.
// ---------------------------------------------------------------------------------------
const DEF = /^\s*(?:export\s+)?(?:const|let|function)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*(?:async\s*)?\(|\()/;
const CALL = /\b([A-Za-z_$][\w$]*)\s*\(/g;
export const POSITIONS = [
  ['skip-continue', /^\s*(?:\}\s*)?if\s*\((.+?)\)\s*(?:\{\s*)?continue\s*[;}]/],
  ['skip-return',   /^\s*(?:\}\s*)?if\s*\((.+?)\)\s*(?:\{\s*)?return\b/],
  ['filter-not',    /\.filter\(\s*\(?\s*\w+\s*\)?\s*=>\s*(!\s*[\w.]+\s*\(.*)\)/],
  ['some-not',      /\.(?:some|every)\(\s*\(?\s*\w+\s*\)?\s*=>\s*(!\s*[\w.]+\s*\()/],
  ['filter-pred',   /\.filter\(\s*(?:\(?\s*\w+\s*\)?\s*=>\s*)?([A-Za-z_$][\w$]*)\s*\(/],
];

// A PREDICATE IS KEYED ON THE MODULE THAT DEFINES IT, NOT ON ITS NAME.  [D-08].
//
// This scanner used to collect every `const|let|function NAME = (` across the swept files into
// ONE FLAT SET OF STRINGS and then attribute an exclusion site to any called name in that set.
// Neither step asked WHERE the name was defined or whether the calling file could reach it,
// and that is unsound in both directions:
//
//   SILENTLY, FOR THREE SLICES. [EX-16] disposed of `if (!field.isChecked()) continue;` in
//   verify-appearances.mjs. isChecked is PDFCheckBox.prototype.isChecked - a pdf-lib method,
//   and pdf-lib is not swept. It was in the universe ONLY because run-form-gate.mjs happened
//   to declare an unrelated local `const isChecked = (target) =>` in a different file. A
//   register entry disposing of a library call, load-bearing on a name collision.
//
//   LOUDLY, ONE COMMIT LATER. assert-completeness-counters.mjs was added with a local
//   `const get = (id) =>`, and the next run reported UNREGISTERED for `catOf.get(b.entry)` in
//   adapters/hubspot/reclassify-against-backbone.mjs - a Map.prototype.get call in a file with
//   no connection to the new one. One local in one file took the gate down.
//
// REACHABILITY IS THE DISCRIMINATOR, and it is enough for both directions. A call site in file
// F counts against a definition D only if F CAN REACH D: D is defined in F itself, or F
// imports that name from the module D lives in. Full resolution - scope analysis, shadowing,
// re-exports - is not attempted and is not needed: `isChecked` is not defined in and not
// imported into verify-appearances.mjs, and `get` is not defined in and not imported into
// reclassify-against-backbone.mjs, so both accidents die on reachability alone.
//
// WHAT THIS DOES NOT DO. It does not tell a bare call from a method call, so `x.norm(...)`
// still matches a local `norm` in the SAME file. That is the weak direction of the same
// unsoundness and it is left standing deliberately, because the strong one - a disposition
// standing over a call the file cannot even see - is the one that hides a real site behind a
// false verdict. Carried, not closed silently.

/** `import { a, b as c } from './x.mjs'` -> the local names and the module each came from. */
const IMPORT = /^\s*import\s*\{([^}]*)\}\s*from\s*['\"]([^'\"]+)['\"]/;

const dirOf = (f) => f.slice(0, f.lastIndexOf('/'));
const resolveSpec = (fromFile, spec) => {
  if (!spec.startsWith('.')) return spec;                 // a package, never a swept file
  const parts = `${dirOf(fromFile)}/${spec}`.split('/');
  const out = [];
  for (const q of parts) { if (q === '.' || q === '') continue; if (q === '..') out.pop(); else out.push(q); }
  return out.join('/');
};

/**
 * Every predicate definition in the engine, as name -> the swept files that define it.
 * A name defined in two files is TWO definitions, and a site can only ever be about one.
 */
export const predicateDefinitions = (files = sweptFiles(), read = (f) => readFileSync(f, 'utf8')) => {
  const out = new Map();
  for (const f of files) for (const ln of read(f).split('\n')) {
    const m = ln.match(DEF);
    if (!m) continue;
    if (!out.has(m[1])) out.set(m[1], new Set());
    out.get(m[1]).add(f);
  }
  return out;
};

/**
 * The predicate names file `f` can actually reach, as name -> the file that defines it.
 * Own definitions first; an import of the same name from elsewhere does not displace one.
 */
export const reachableIn = (f, defs, read = (x) => readFileSync(x, 'utf8')) => {
  const src = read(f);
  const out = new Map();
  for (const ln of src.split('\n')) {
    const own = ln.match(DEF);   // named `own` so its guard disposition is distinguishable from the harvester's
    if (own) out.set(own[1], f);
  }
  for (const ln of src.split('\n')) {
    const m = ln.match(IMPORT);
    if (!m) continue;
    const mod = resolveSpec(f, m[2]);
    for (const raw of m[1].split(',')) {
      const t = raw.trim();
      if (!t) continue;
      const as = /^(\S+)\s+as\s+(\S+)$/.exec(t);
      const local = as ? as[2] : t;
      const orig = as ? as[1] : t;
      if (out.has(local)) continue;                        // a local definition wins
      // The import must name a predicate the target module actually DEFINES. An import of a
      // constant or a class is not a predicate and must not enter the universe by being spelled
      // the same as one somewhere else - which is the whole defect.
      const where = defs.get(orig);
      if (where && where.has(mod)) out.set(local, mod);
    }
  }
  return out;
};

/**
 * Every predicate the engine defines, as a flat set of NAMES.
 * KEPT, AND NARROWED IN MEANING. [EX-90] still asks "is this name defined anywhere in a swept
 * file", because that is the question its own excusal is about. What no longer happens is a
 * SITE being attributed on the strength of that answer.
 */
export const enginePredicates = () => new Set(predicateDefinitions().keys());

/** Every exclusion site, with the predicate governing it. `raw` counts hits before [EX-90]. */
export const exclusionSites = () => {
  const defs = predicateDefinitions();
  const reach = new Map(sweptFiles().map((f) => [f, reachableIn(f, defs)]));
  const rows = [];
  let raw = 0;
  for (const f of sweptFiles()) {
    const here = reach.get(f);
    readFileSync(f, 'utf8').split('\n').forEach((ln, i) => {
      if (isProse(ln)) return;
      const code = ln.replace(STRLIT, '""');
      for (const [pos, re] of POSITIONS) {
        const m = code.match(re);
        if (!m) continue;
        const calls = [...String(m[1]).matchAll(CALL)].map((x) => x[1]);
        if (!calls.length) return;
        raw++;
        const named = [...new Set(calls.filter((c) => here.has(c)))];
        for (const q of named)
          rows.push({ at: `${f}:${i + 1}`, file: f, pred: q, definedIn: here.get(q), pos, text: ln.trim().slice(0, 110) });
        return;
      }
    });
  }
  return { rows, raw, predicates: [...new Set(rows.map((r) => r.pred))].sort(), defs, reach };
};

/**
 * The sites one register entry disposes of: same NAME and one of the DEFINING MODULES it names.
 *
 * `definedIn` may be a list, and a list is a real claim rather than a convenience: `isProse` is
 * declared four times across the swept files as four separate one-line copies, so an entry
 * covering all four is saying that all four are the same predicate and stands or falls on each
 * of them still existing. An entry with NO definedIn matches on the name alone — the pre-[D-08]
 * behaviour, kept only so a new entry can be written before its module is decided, and the
 * sweep names every such entry on every run.
 */
export const sitesFor = (sites, entry) => {
  const name = entry.pred || entry.key;
  const mods = [].concat(entry.definedIn || []);
  return sites.rows.filter((r) => r.pred === name && (!mods.length || mods.includes(r.definedIn)));
};

// ---------------------------------------------------------------------------------------
// THE REGISTER — SOURCE PREDICATES.
// ---------------------------------------------------------------------------------------
export const PREDICATES = [

  // ─── the archetype ────────────────────────────────────────────────────────────────────
  { id: 'EX-01', pred: 'claimsNothing', definedIn: 'adapters/pdf/assert-row-shape-spec.mjs', kind: 'claiming',
    what: 'Removes a printed_tables entry from [A3]\'s routing assertion when its text opens with "none" or contains "not currently mapped".',
    count: () => excusedClaims().length,
    // THE CROSS-CHECK THE DEFECT WOULD HAVE FAILED. "not currently mapped" is a statement about
    // the map; ask the map. "none" is a statement about what the form prints; a class the map
    // ROUTES on that form is printed there by construction, so a routed "none" is contradicted
    // by the same evidence.
    crosscheck: () => {
      const { maps } = load();
      const acc = acceptorsOf(maps);
      const out = [];
      for (const e of excusedClaims()) {
        const routed = (acc.get(e.class_id) || []).filter((a) => a.form === e.form);
        if (!routed.length) continue;
        out.push(`[EX-01] CONTRADICTED — ${e.class_id} on ${e.form} is excused from the routing assertion by the text ${JSON.stringify(e.text.slice(0, 80))}, and ${e.form} DOES route that class, at ${routed.map((a) => `groups.${a.group}`).join(', ')}. The excusal describes a state the map left behind. Correct the sentence in ${SPEC}; do not widen the predicate.`);
      }
      return out;
    } },

  // ─── the two column-level excusals in the same file, never before compared to anything ──
  { id: 'EX-02', pred: '(declared) printed_but_unmapped_on', kind: 'claiming', declaredIn: SPEC,
    what: 'Removes a canonical column from [A2]\'s reachability assertion on a named form, on the claim that the form PRINTS the column and the map does not bind it.',
    count: () => {
      const { spec } = load();
      let n = 0;
      for (const c of spec.classes || []) for (const col of c.canonical_row || [])
        if (col.printed_but_unmapped_on) n += [].concat(col.printed_but_unmapped_on).length;
      return n;
    },
    crosscheck: () => {
      const { spec, maps } = load();
      const acc = acceptorsOf(maps);
      const out = [];
      for (const c of spec.classes || []) for (const col of c.canonical_row || []) {
        for (const form of [].concat(col.printed_but_unmapped_on || [])) {
          for (const a of (acc.get(c.class_id) || []).filter((x) => x.form === form)) {
            const alias = col.printed_as?.[form];
            const key = alias ?? col.key;
            if (a.cols.has(key))
              out.push(`[EX-02] CONTRADICTED — ${c.class_id}.${col.key} is excused from [A2] on ${form} as "printed but unmapped", and ${form}.${a.group} DECLARES the column "${key}". It is mapped. The excusal is stale; drop it and let [A2] check the column.`);
          }
        }
      }
      return out;
    } },

  // ─── ONE KEY, TWO INCOMPATIBLE DEFINITIONS — SPLIT, AND THE PAGE SETTLED IT ───────────
  //
  // `row_flag` used to be documented twice in this repo, and the two documents disagreed:
  //
  //   asset-row-shapes.json  meta.how_to_read.row_flag
  //     "A column whose value prints as a CHECKBOX, not text."
  //   assert-row-shape-spec.mjs, at the line that consumed it
  //     "// a routing flag, not a printed cell"
  //
  // A checkbox IS a printed cell, so those were two rules. This entry is what found it, by
  // comparing each sentence to the MAPS — and the split it reported, three load-bearing and two
  // inert, is the thing [D-06] carried for three prompts.
  //
  // READ OFF THE PRINTED PAGE INSTEAD, THAT SPLIT IS NOT THE SPLIT. All five flagged columns
  // are drawn as checkboxes somewhere: 433-F prints "Check if / Business Account" over both its
  // accounts tables and "Primary Residence"/"Other" in each real-estate row, and draws eight
  // widgets for them, none of which the map binds. So the three "load-bearing" columns were not
  // unprinted — they were UNMAPPED, and map reachability cannot tell those apart. Measuring on
  // the map and concluding about the page is this entry's own version of the axis conflation
  // Prompt 43 named; it is recorded here rather than quietly corrected.
  //
  // The key is now two keys, both KEYED BY FORM, and this entry counts and cross-checks both.
  { id: 'EX-03', pred: '(declared) row_flag', kind: 'claiming', declaredIn: SPEC,
    what: 'Removes a canonical column from [A2]\'s reachability assertion ON THE FORM IT NAMES, on the claim that the form draws no cell for it. Its counterpart `printed_as_checkbox` (EX-03b) removes nothing — it CHECKS.',
    count: () => {
      const { spec } = load();
      let n = 0;
      for (const c of spec.classes || []) for (const col of c.canonical_row || [])
        n += Object.keys(col.row_flag && typeof col.row_flag === 'object' ? col.row_flag : {}).length;
      return n;
    },
    // THE EXCUSAL, CROSS-CHECKED AGAINST THE MAP THAT WOULD CONTRADICT IT.
    //
    // `row_flag[<form>]` claims the form draws no cell. The map contradicts that claim if the
    // accepting group on that form binds the column AT ALL — as text or as a checkbox. Both are
    // a STOP now, where before only the text case was: a flagged column bound as a checkbox was
    // the "inert" half, reported and tolerated, and tolerating it is what let one key mean two
    // things. [A2] makes the same assertion; this counts it from the excusal's side.
    crosscheck: () => {
      const { spec, maps } = load();
      const acc = acceptorsOf(maps);
      const out = [];
      for (const c of spec.classes || []) for (const col of c.canonical_row || []) {
        const rf = col.row_flag && typeof col.row_flag === 'object' ? col.row_flag : {};
        if (col.row_flag === true)
          out.push(`[EX-03] UNMIGRATED — ${c.class_id}.${col.key} still carries the boolean row_flag. The key is keyed by form since [D-06]; a bare true names no form and excuses on all of them.`);
        for (const form of Object.keys(rf)) {
          for (const a of (acc.get(c.class_id) || []).filter((x) => x.form === form)) {
            const key = col.printed_as?.[form] ?? col.key;
            if (a.textCols.has(key))
              out.push(`[EX-03] CONTRADICTED — ${c.class_id}.${col.key} is excused on ${form} as drawing no cell, and ${form}.${a.group} declares "${key}" as a TEXT column.`);
            else if (a.cbCols.has(key))
              out.push(`[EX-03] CONTRADICTED — ${c.class_id}.${col.key} is excused on ${form} as drawing no cell, and ${form}.${a.group} binds "${key}" as a CHECKBOX. That is printed_as_checkbox["${form}"].`);
          }
        }
      }
      return out;
    },
    // Printed on every run beside the count, so the split cannot go quiet.
    observe: () => {
      const { spec } = load();
      const rows = [];
      for (const c of spec.classes || []) for (const col of c.canonical_row || [])
        for (const [form, why] of Object.entries(col.row_flag && typeof col.row_flag === 'object' ? col.row_flag : {}))
          rows.push(`${c.class_id}.${col.key}@${form} — ${String(why).split('.')[0]}`);
      return [
        `${rows.length} routing-discriminator occurrence(s), each naming its form and its reason:`,
        ...rows.map((r) => `  ${r}`),
      ];
    } },

  // ─── AND THE OTHER HALF, WHICH EXCUSES NOTHING AND IS REGISTERED ANYWAY ───────────────
  //
  // `printed_as_checkbox` is not an exclusion: it makes [A2] check a column it used to skip.
  // It is registered here because the sweep's subject is DECLARATIONS THAT CHANGE WHAT AN
  // ASSERTION COVERS, and a key that moves five occurrences from "excused" to "checked" changes
  // that as surely as one moving them the other way. Registering only the excusing half would
  // leave the split half-visible — and half-visible is how it survived three prompts.
  //
  // Its `printed_but_unmapped_on` companion DOES excuse, and is counted here.
  { id: 'EX-03b', pred: '(declared) printed_as_checkbox', kind: 'claiming', declaredIn: SPEC,
    what: 'Moves a canonical column INTO [A2]\'s assertion on the form it names, and requires the binding to be a checkbox. The count below is the number of occurrences whose `printed_but_unmapped_on` then excuses them again — the only excusing this key does.',
    count: () => {
      const { spec } = load();
      let n = 0;
      for (const c of spec.classes || []) for (const col of c.canonical_row || [])
        for (const form of Object.keys(col.printed_as_checkbox || {})) {
          const u = col.printed_but_unmapped_on;
          if (u === form || (Array.isArray(u) && u.includes(form))) n++;
        }
      return n;
    },
    crosscheck: () => {
      const { spec, maps } = load();
      const acc = acceptorsOf(maps);
      const out = [];
      for (const c of spec.classes || []) for (const col of c.canonical_row || [])
        for (const form of Object.keys(col.printed_as_checkbox || {})) {
          const u = col.printed_but_unmapped_on;
          if (!(u === form || (Array.isArray(u) && u.includes(form)))) continue;
          for (const a of (acc.get(c.class_id) || []).filter((x) => x.form === form))
            if (a.cbCols.has(col.key) || a.textCols.has(col.key))
              out.push(`[EX-03b] STALE — ${c.class_id}.${col.key} is excused on ${form} as printed-but-unmapped, and ${form}.${a.group} DOES bind it. A decision for a gap that has gone away is a STOP.`);
        }
      return out;
    },
    observe: () => {
      const { spec, maps } = load();
      const acc = acceptorsOf(maps);
      const bound = [], unmapped = [];
      for (const c of spec.classes || []) for (const col of c.canonical_row || [])
        for (const [form, ev] of Object.entries(col.printed_as_checkbox || {})) {
          const a = (acc.get(c.class_id) || []).find((x) => x.form === form);
          const line = `${c.class_id}.${col.key}@${form} (${(ev.widgets || []).length} widget(s) drawn)`;
          (a && a.cbCols.has(col.key) ? bound : unmapped).push(line);
        }
      return [
        `${bound.length} bound as a checkbox and CHECKED by [A2]: ${bound.join('; ') || 'none'}`,
        `${unmapped.length} printed and NOT bound — a declared gap the old row_flag hid by calling the cell unprinted: ${unmapped.join('; ') || 'none'}`,
      ];
    } },

  // ─── the excusal that was already cross-checked, named so the count is visible ─────────
  { id: 'EX-04', pred: '(declared) unrouted', kind: 'scoped', declaredIn: SPEC,
    what: 'Removes a class/form pair from [A3]\'s STOP, on a declared and reasoned routing gap.',
    assertedBy: 'assert-row-shape-spec.mjs [A3] STALE UNROUTED — a declaration for a pair that IS routed is a STOP — and A3 ORPHAN UNROUTED, for a declaration about a form the class claims no routable table on. Both directions are covered, which is why this one is `scoped` and not `claiming`.',
    count: () => { const { spec } = load(); return (spec.classes || []).reduce((n, c) => n + Object.keys(c.unrouted || {}).length, 0); } },

  // ─── an artefact key with no consumer at all ──────────────────────────────────────────
  { id: 'EX-05', pred: '(declared) not_a_row_column', kind: 'inert', declaredIn: SPEC,
    what: 'Names a fact the printed table carries as a TABLE-LEVEL SCALAR rather than a row column — a balance-as-of date in a column header, a single account-holder cell serving three rows.',
    inert_because: 'NOTHING IN THIS REPO READS IT. Grepped across both swept directories on 2026-08-20: no consumer. It excuses nothing today because no assertion consults it, so it has no scope to narrow and nothing to contradict. It is registered anyway, and its inertness is asserted below, because the day something DOES read it, it becomes a `claiming` exclusion — a sentence about what the page prints, deciding what a check may skip — and it must not acquire that power without acquiring a cross-check in the same commit.',
    count: () => { const { spec } = load(); return (spec.classes || []).reduce((n, c) => n + (c.not_a_row_column || []).length, 0); },
    crosscheck: () => {
      const hits = [];
      for (const f of sweptFiles()) {
        // THIS FILE IS NOT A CONSUMER OF THE KEY; IT IS THE REGISTER THAT NAMES IT. Counting
        // its own `count()` — which reads `c.not_a_row_column` to size the declaration — as
        // evidence that something now excludes on the key made [EX-05] report itself on its
        // first run. The self-exclusion is stated rather than silent, and it is narrow: one
        // named file, not a pattern.
        if (f === 'adapters/pdf/exclusion-sweep.mjs') continue;
        readFileSync(f, 'utf8').split('\n').forEach((ln, i) => {
          if (isProse(ln)) return;
          if (ln.replace(STRLIT, '""').includes('not_a_row_column')) hits.push(`${f}:${i + 1}`);
        });
      }
      return hits.length
        ? [`[EX-05] NO LONGER INERT — not_a_row_column is now read as code at ${hits.join(', ')}. It has become an exclusion that decides what a check may skip. Reclassify it as \`claiming\` and give it a cross-check in the same commit that wired it up.`]
        : [];
    } },

  // ─── the source predicates ────────────────────────────────────────────────────────────
  { id: 'EX-10', pred: 'isProse', definedIn: ['adapters/pdf/exclusion-sweep.mjs', 'adapters/pdf/guard-sweep.mjs', 'adapters/pdf/success-sweep.mjs', 'adapters/hubspot/gen-fields-from-map.mjs'], kind: 'structural',
    what: 'Excuses a comment line from the source scanners in guard-sweep.mjs, success-sweep.mjs and gen-fields-from-map.mjs.',
    structural_because: 'A shape inside a comment is PROSE ABOUT the defect, not an instance of it — guard-sweep\'s own header contains a dozen written-out vacuous guards. It separates code from commentary and makes no claim about the world. Its failure mode is also the safe one: a comment misread as code adds a site that must then be disposed, which is noise, never silence.' },

  // NOT A CALLED PREDICATE — a regex constant consumed by the site selector's own emitter
  // test. It excuses more sites than anything else in this register, so it is registered as an
  // exclusion; `viaConst` tells the orphan rule to prove it by its DEFINITION rather than by
  // looking for a call in an exclusion position, which is a shape it does not have.
  { id: 'EX-11', pred: 'EXCLUDED_STREAM', kind: 'claiming', viaConst: 'adapters/pdf/success-sweep.mjs',
    what: 'Removes every `console.error` line from success-sweep.mjs\'s site set, on the claim that stderr in this engine carries failures and never verdicts of success.',
    count: () => {
      let n = 0;
      for (const f of sweptFiles()) for (const ln of readFileSync(f, 'utf8').split('\n')) {
        if (isProse(ln)) continue;
        if (/console\.error\s*\(/.test(ln.replace(STRLIT, '""'))) n++;
      }
      return n;
    },
    // Reading stderr made eight FAILURE messages classify as unconditional successes, because
    // `APPEARANCE VERIFICATION FAILED` contains "verified" and `Correct the input` contains
    // "correct". So the stream is excluded — and the claim that justifies it is checked: no
    // stderr line may OPEN with a verdict of success.
    crosscheck: async () => {
      const { VERDICT_OPENER } = await import('./success-sweep.mjs');
      const out = [];
      for (const f of sweptFiles()) {
        readFileSync(f, 'utf8').split('\n').forEach((ln, i) => {
          if (isProse(ln)) return;
          if (!/console\.error\s*\(/.test(ln.replace(STRLIT, '""'))) return;
          for (const lit of ln.match(STRLIT) || []) {
            if (VERDICT_OPENER.test(lit.slice(1, -1)))
              out.push(`[EX-11] CONTRADICTED — ${f}:${i + 1} writes a SUCCESS VERDICT to stderr: ${lit.slice(0, 90)}. success-sweep.mjs does not read that stream, so this message is outside its assertion entirely. Move it to console.log, or widen the sweep and dispose of every stderr site.`);
          }
        });
      }
      return out;
    } },

  { id: 'EX-12', pred: 'absent', definedIn: ['adapters/pdf/fill-433a.mjs', 'adapters/pdf/fill-433aoi.mjs'], kind: 'scoped',
    what: 'Excuses an undefined, null or whitespace-only value from being written to a PDF cell, in fill-433a.mjs and fill-433aoi.mjs.',
    assertedBy: 'check-row-shape.mjs counts every absent and blank cell per group and the gate prints the figures; adapters/pdf/verify-form-coverage.mjs then asserts the WHOLE-FORM partition closes — form_fields_total = in_this_slice + excluded_never_autofill + deferred + unaccounted, each side derived from widget geometry by count-sweep [S-01]. A cell this predicate skips is still counted as a cell, so the exclusion cannot shrink the denominator.' },

  { id: 'EX-13', pred: 'blank', definedIn: 'adapters/pdf/render-review.mjs', kind: 'scoped',
    what: 'The same absence test in render-review.mjs, deciding which bound cells the review page reports as "both empty".',
    assertedBy: 'The review page prints the four-way tally — match / MISMATCH / both empty / pdf-only — and every bound cell lands in exactly one bucket. Nothing is removed from the denominator, so a widened `blank` moves cells between reported buckets rather than out of the report.' },

  { id: 'EX-14', pred: 'isDescriptive', definedIn: 'adapters/pdf/correlate-labels.mjs', kind: 'claiming',
    what: 'Excuses a drawn text run from becoming a widget LABEL in correlate-labels.mjs, on the claim that a bare line marker "(13a)" or a format hint "mm/dd/yyyy" is not a description of the cell.',
    assertedBy: 'guard-sweep.mjs [FIG-01]/[FIG-02] — 26 labels and 4 markers moved when the truncation order was fixed, and the register records the mutation procedure that measured it.',
    count: () => {
      // Every run this predicate removes from the label pool today, across the mapped forms.
      // Every form that HAS a labels sidecar, read from disk. A parse failure propagates and
      // is reported UNREADABLE rather than skipped into a smaller count.
      let n = 0;
      for (const p of readdirSync('adapters/pdf/maps').filter((f) => f.endsWith('.labels.json'))) {
        const doc = JSON.parse(readFileSync(`adapters/pdf/maps/${p}`, 'utf8'));
        for (const w of doc.widgets || []) if (w.marker && !w.label) n++;
      }
      return n;
    },
    // A widget left with a marker and NO label is a cell whose every nearby run this predicate
    // rejected. That is a legitimate outcome — some cells are drawn with nothing but a number
    // beside them — so it is reported and counted rather than failed. What is NOT legitimate is
    // the count moving without anyone noticing, which is what [FIG-01] was written for.
    crosscheck: () => [] },

  { id: 'EX-15', pred: 'isNarrative', definedIn: 'adapters/pdf/success-sweep.mjs', kind: 'claiming',
    what: 'Excuses a success-message site from success-sweep.mjs\'s control-flow witnesses, on the claim that the message states what was FOUND rather than that nothing was.',
    count: () => 0,   // replaced below by the live figure; see runExclusionSweep
    crosscheck: async () => {
      const { runSuccessSweep } = await import('./success-sweep.mjs');
      const s = runSuccessSweep();
      const out = [];
      // THE CLAIM: a narrative line is correct on a failing run. The check: it must not open
      // with a verdict. That is the predicate's own first test, so re-running it here would be
      // circular — instead assert the INDEPENDENT property that every narrative site either
      // interpolates a value or is a markdown row, and none is a bare success sentence.
      for (const r of s.rows.filter((x) => x.verdict === 'narrative')) {
        if (!/\$\{|\|/.test(r.text) && !/\bNOT\b|\bnot |\bcannot\b|\bNothing to\b|\bRefusing\b/.test(r.text))
          out.push(`[EX-15] CONTRADICTED — ${r.at} is excused as narrative and is a bare sentence: ${r.text.slice(0, 90)}. It interpolates nothing, is no table row, and negates nothing, so it makes a claim about the whole run.`);
      }
      return out;
    } },

  { id: 'EX-26', pred: 'hit', definedIn: 'adapters/pdf/blanket-audit.mjs', kind: 'structural',
    what: 'Tests, in blanket-audit [K-12], whether a coordinate quoted in the map or headings file is a value the page actually draws.',
    structural_because: 'IT IS THE CHECK, NOT AN EXCUSAL FROM ONE. It partitions the quoted coordinates into covered and uncovered and BOTH halves are reported: the covered count becomes the numerator of the counter, and every uncovered coordinate is listed by name in the coverage-gap message. Nothing leaves the assertion by failing it. Registered because the sweep found it on its first run over new code, which is the outcome the completeness rule is for.' },

  { id: 'EX-17', pred: 'under', definedIn: 'adapters/pdf/verify-form-coverage.mjs', kind: 'structural',
    what: 'Tests whether a field path lies under a declared root in verify-form-coverage.mjs — `path === root`, or the root followed by `.` or `[`.',
    structural_because: 'A path-prefix relation, not a claim about the form. It ROUTES fields into partition categories rather than removing them from the partition; the accounting then has to close against the form\'s own field count, so a field this misroutes shows up as an unaccounted field, not as an absent one.' },

  { id: 'EX-18', pred: 'inMoneyBand', definedIn: 'adapters/hubspot/gen-fields-from-map.mjs', kind: 'scoped',
    what: 'Decides in gen-fields-from-map.mjs whether a derived HubSpot property takes the money type.',
    assertedBy: 'adapters/hubspot/hs-verify-provision.mjs reads every property back FROM THE PORTAL and compares type, fieldType, options and group against the definition file, exiting 3 on any mismatch. A misclassified band is caught against the live portal, not against the file that made the classification.' },

  { id: 'EX-19', pred: 'fileMatches', definedIn: 'adapters/pdf/guard-sweep.mjs', kind: 'structural',
    what: 'Matches a guard-sweep register entry\'s `file` spec — a string or a RegExp — against a filename.',
    structural_because: 'A dispatch test binding a disposition to its file. A non-match does not excuse a site: it leaves the site UNDISPOSED, which guard-sweep reports as a STOP. Failing to match moves a site towards the problem state.' },

  { id: 'EX-20', pred: 'covers', definedIn: 'adapters/pdf/blanket-audit.mjs', kind: 'structural',
    what: 'Blanket-audit\'s test for whether a demanded atom is present in a published scope.',
    structural_because: 'The forward-reference prover. A `covers` that returns false does not skip the reference; it reports it UNPROVED. Fails closed.' },

  { id: 'EX-21', pred: 'drawnOn', definedIn: 'adapters/pdf/blanket-audit.mjs', kind: 'structural',
    what: 'Blanket-audit\'s page test for a geometry claim.',
    structural_because: 'Selects which page a claimed coordinate is checked against. A wrong answer produces a failed geometry claim, not a skipped one.' },

  { id: 'EX-22', pred: 'norm', definedIn: 'adapters/pdf/blanket-audit.mjs', kind: 'structural',
    what: 'Normalises a claim string before comparison in blanket-audit.mjs.',
    structural_because: 'A comparison normaliser — case and whitespace. It changes what counts as equal, not what counts as present, and both sides of every comparison go through it.' },

  { id: 'EX-23', pred: 'ok', definedIn: 'adapters/pdf/blanket-audit.mjs', kind: 'structural',
    what: 'Blanket-audit\'s per-claim verdict accessor, used to select the FAILING claims for the report.',
    structural_because: 'Selects failures for printing out of a set every member of which has already been judged. It excuses nothing from judgement; it decides what gets printed after.' },

  { id: 'EX-24', pred: 'body', definedIn: 'adapters/pdf/success-sweep.mjs', kind: 'structural',
    what: 'Strips the quote characters off a string literal in success-sweep.mjs before testing its text.',
    structural_because: 'A string accessor, not a predicate. `\'OK — …\'` and `OK — …` must compare the same way whichever quote style the source used.' },

  { id: 'EX-25', pred: 'DETECTOR_SIG', definedIn: 'adapters/pdf/blanket-audit.mjs', kind: 'structural',
    what: 'Blanket-audit\'s completeness-detector signature test.',
    structural_because: 'Recognises the shape of a completeness claim. A signature that stops matching detects fewer claims — which is the [A3] shape — and that is precisely why the detector carries CANARY, a fixed synthetic string expecting one assert claim and one geometry claim, whose failure declares every "0 detected" in the same run meaningless.' },

  // ─── the sweep-boundary register ─────────────────────────────────────────────────────
  //
  // A SECOND `covered`, AND [D-08] IS WHY IT HAS ITS OWN ENTRY. blanket-audit.mjs defines one
  // too and [EX-20] disposes of THAT one. Before predicates were keyed on their defining
  // module, this site would have been absorbed by [EX-20] in silence - a disposition written
  // about a forward-reference filter, standing over a gitignore test in an unrelated file,
  // sound only for as long as the two names stayed the same.
  { id: 'EX-31b', pred: 'isDir', definedIn: 'adapters/pdf/sweep-boundary.mjs', kind: 'structural',
    what: 'Separates a path that is a directory from one that is not, in [SB-18] and [SB-90].',
    structural_because: 'A TYPE TEST ON A PATH, NOT AN EXCUSAL, AND BOTH BRANCHES ARE REPORTED. In [SB-90] it partitions the entries of a swept directory into subdirectories, which are checked against the registered exclusions, and files, which are the sweeps own input; the subdirectory list is derived from the tree on every run and its size is printed beside the entry. In [SB-18] it answers whether scratchpad/ exists at all, and the false branch prints "scratchpad/ does not exist in this tree" rather than an empty tally. Its own failure direction is disposed at [G-104]: a path that cannot be statted reports as not-a-directory, which NARROWS the subdirectory check, and readdirSync would have thrown on such a path before this predicate saw it.' },

  { id: 'EX-29', pred: 'covered', definedIn: 'adapters/pdf/sweep-boundary.mjs', kind: 'structural',
    what: 'Separates a subdirectory of a swept directory that is covered by a .gitignore rule from one that is not, in [SB-90].',
    structural_because: 'BOTH BRANCHES ARE REPORTED AND NEITHER LEAVES THE ASSERTION. A covered subdirectory is a directory git is already keeping out of the tree, which is the state [SB-91] asserts and prints the size of; an uncovered one that is also not a declared asset directory is an UNREGISTERED SUBDIRECTORY stop naming the path. Nothing is excused: the two branches partition the subdirectory list, the list is derived from the tree on every run, and its size is printed beside the entry. An empty .gitignore would make EVERY subdirectory uncovered, which is the loud direction.' },

  // ─── the declaration-coverage union ───────────────────────────────────────────────────
  { id: 'EX-35', pred: 'exercises', definedIn: 'adapters/pdf/declaration-coverage.mjs', kind: 'claiming',
    what: 'Separates a fixture that EXERCISES the form — acceptance, stress, negative, and the "holds" half of the record_shape set — from one that does not: production, superseded, and the "stops" half of the record_shape set.',
    count: () => FIXTURE_FORMS().reduce((n, f) => n + candidatesFor(f).rows.filter((r) => !r.unreadable && !r.undeclared && !['acceptance', 'stress', 'negative'].includes(r.role) && !(r.role === 'record_shape' && r.recordShape?.expect === 'holds')).length, 0),
    // THE CROSS-CHECK. Every fixture this predicate keeps out of the coverage union must be out
    // for one of three stated reasons: `production` is a portrait of one taxpayer and says
    // nothing about which declared behaviours a run reached; `superseded` is history; a
    // record_shape fixture expecting a STOP ends its gate run non-zero BY DESIGN and is
    // asserted by adapters/pdf/assert-record-shape.mjs, which requires it to fail AND to fail
    // with the record shape named in the run's own per-line result. A fixture excluded for none
    // of those three is one this engine measures NOWHERE, and that is what this refuses.
    crosscheck: () => {
      const out = [];
      for (const f of FIXTURE_FORMS()) for (const r of candidatesFor(f).rows) {
        if (r.unreadable || r.undeclared) continue;
        if (['acceptance', 'stress', 'negative'].includes(r.role)) continue;
        if (r.role === 'record_shape' && r.recordShape?.expect === 'holds') continue;
        if (['production', 'superseded'].includes(r.role)) continue;
        if (r.role === 'record_shape' && r.recordShape?.expect === 'stops') continue;
        out.push(`[EX-35] UNMEASURED — ${r.path} declares role ${JSON.stringify(r.role)} and is kept out of the declaration-coverage union, and none of the three stated reasons applies to it. Its coverage is measured by nothing. Give it an exercising role, or state why it is out.`);
      }
      return out;
    } },

  // ─── the name-lie registry's own coverage counter ─────────────────────────────────────
  { id: 'EX-34', pred: 'resolves', definedIn: 'adapters/pdf/blanket-audit.mjs', kind: 'structural',
    what: 'Separates a name-lie registry entry whose `path` exists and whose `bound_to` resolves through the map to exactly that path from one where either fails, inside [K-29].',
    structural_because: 'IT IS THE COUNTER ITSELF AND BOTH BRANCHES ARE REPORTED. `resolves` is called twice over the same enumerated array: once to build `covered` and once to build `uncoveredList`. Nothing is excused — the two branches partition the registry entries, `universe` is the entry count and `universeList` names every id, and an entry the predicate rejects becomes a COVERAGE GAP naming it. A version of it that stopped separating anything would report every entry uncovered, which is the loud direction, and validate-map.mjs asserts the same two facts independently and exits 2 on either.' },

  // ─── the declared record shape ────────────────────────────────────────────────────────
  { id: 'EX-33', pred: 'parseMoney', definedIn: 'adapters/pdf/rounding.mjs', kind: 'structural',
    what: 'Separates a printed money cell that carries a value from one that is blank, inside the two record-shape comparators in adapters/pdf/record-shape.mjs.',
    structural_because: 'IT IS THE ASSERTION ITSELF, IN BOTH COMPARATORS, AND BOTH BRANCHES ARE REPORTED. `checkOperandsEmptyTotalPresent` REFUSES the line when the filled count is non-zero and names every offending cell with its value; `checkOperandsPresent` REFUSES the line when the filled count is zero. The two branches partition the declared operand list — which is built from the map\'s own feeders and carries the BLANK cells deliberately, because the blank ones are the subject — and both counts, `filled` and `operands`, are printed on the gate\'s tripwire table and written into the tripwires.json line. Nothing leaves either check through this predicate: a cell it calls blank is the finding in one comparator and a cell it calls filled is the finding in the other. Its own failure direction is closed by the canary in the same module, which fires both comparators against an input each MUST refuse and an input each MUST accept on every run, including the printed-zero case that a looser blank test would swallow.' },

  // ─── the y-convention audit ───────────────────────────────────────────────────────────
  { id: 'EX-27', pred: 'agreesWithSomeBaseline', definedIn: 'adapters/pdf/assert-y-convention.mjs', kind: 'structural',
    what: 'Separates the readings where a reporter agrees with one of the baselines the page draws for an object from the readings where it agrees with none.',
    structural_because: 'IT IS THE ASSERTION, NOT AN EXCUSAL. Both branches are reported: an agreeing reading is counted into `checked`, a disagreeing one becomes a DISAGREEMENT problem naming the tool, the object, both numbers and the gap. Nothing leaves the audit through this predicate — the two branches sum to the judged population, which is printed per form on every run. It is also the predicate the CANARY is judged by, so a version of it that stopped separating anything would report the run-top reporter as agreeing and take the run down before any real reading is trusted.' },

  { id: 'EX-28', pred: 'REPORTER_SIG', definedIn: 'adapters/pdf/assert-y-convention.mjs', kind: 'structural',
    what: 'The y-reporter signature: an engine file that names a y-bearing quantity and emits it.',
    structural_because: 'Recognises the shape of a y reporter, in the same way [EX-25] recognises the shape of a completeness detector. A signature that stopped matching would find fewer reporters — the [A3] shape — and it is closed the same way: the derived candidate set is compared against page-geometry.Y_REPORTERS IN BOTH DIRECTIONS, so a candidate with no entry is a STOP and an entry the signature no longer finds is a STALE REPORTER ENTRY. Its first draft was in fact too narrow and the second direction is what said so: it demanded console.log or writeFileSync and therefore missed page-geometry.mjs, the module that defines the convention, which came back as a stale entry rather than as silence.' },

  // ─── the exclusion inside the completeness check ──────────────────────────────────────
  { id: 'EX-90', pred: '(meta) engine-defined only', kind: 'claiming',
    what: 'Removes from THIS FILE\'S completeness check every predicate call in an exclusion position whose name is not defined in a swept file — `has`, `isArray`, `startsWith`, `test`, `includes`, `trim`, `map`, `some`.',
    count: () => { const s = exclusionSites(); return s.raw - s.rows.length; },
    // A SWEEP THAT NARROWS ITS OWN INPUT IS THE DEFECT THIS FILE IS ABOUT, so the narrowing is
    // counted on every run and the ground for it is checked: every name removed must in fact
    // resolve to no definition in any swept file. A predicate that acquires a definition —
    // someone writes `const has = …` — stops being excluded and must be registered.
    crosscheck: () => {
      const defined = enginePredicates();
      const out = [];
      const { rows } = exclusionSites();
      // PER (NAME, DEFINING MODULE), for the same reason the completeness check is. A register
      // entry naming assert-row-shape-spec.mjs does not dispose of an identically named local
      // in a file that has never heard of it.
      const registered = new Set(PREDICATES.flatMap((q) => [].concat(q.definedIn || []).map((d) => `${q.pred}@${d}`)));
      const bare = new Set(PREDICATES.filter((q) => !q.definedIn).map((q) => q.pred));
      for (const r of rows) {
        if (!defined.has(r.pred)) continue;
        if (registered.has(`${r.pred}@${r.definedIn}`) || bare.has(r.pred)) continue;
        out.push(`[EX-90] ${r.pred} at ${r.at}, defined in ${r.definedIn}, excuses a site and no register entry names that definition.`);
      }
      return out;
    } },
];

// ---------------------------------------------------------------------------------------
// THE REGISTER — DECLARED EXCLUSIONS IN ARTEFACTS.
// ---------------------------------------------------------------------------------------
// READ FROM DISK, AND AN UNREADABLE FILE IS NOT A ZERO.
//
// The first draft of this wrote `try { … } catch { return null }` and then `?? 0`, so a map
// that could not be parsed contributed nothing to the excused total and said nothing about
// it. That is the [G-01] shape inside the file whose subject is instruments going quiet — a
// count that cannot read its input reporting the same figure as a count that read an empty
// one. Absence and unreadability are separated: a form with no map on disk is not swept and
// is NAMED in the report; a map that exists and will not parse THROWS, and runExclusionSweep
// turns the throw into UNREADABLE, which is a problem and never a pass.
//
// MAPPED_FORMS is derived from the directory rather than typed, so a form that arrives — as
// 433-B(OIC) is about to — enters these counts without anyone remembering to add it.
export const MAPPED_FORMS = () =>
  readdirSync('adapters/pdf/maps').filter((f) => f.endsWith('.map.json')).map((f) => f.replace('.map.json', '')).sort();

const sidecar = (form, kind) => {
  const p = `adapters/pdf/maps/${form}.${kind}.json`;
  let raw;
  try { raw = readFileSync(p, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  return JSON.parse(raw);          // a parse failure propagates and is reported UNREADABLE
};
const mapDoc = (f) => sidecar(f, 'map');
const totalsDoc = (f) => sidecar(f, 'totals');

// ---------------------------------------------------------------------------------------
// THE REGISTER — RETIRED SOURCE PREDICATES.
// ---------------------------------------------------------------------------------------
// AN ENTRY LEAVES PREDICATES ONLY WHEN ITS PREDICATE LEAVES THE ENGINE-DEFINED UNIVERSE, and
// it leaves with its old text attached. Deleting the entry would delete the reasoning, and
// the reasoning is the part that says what the sweep once believed and why that turned out
// to rest on something that was not true.
//
// A retired entry is NOT orphan-checked — that is the point of retiring it — so it is checked
// the other way instead: runExclusionSweep STOPS if a retired predicate is excusing a site
// again. Retirement can shrink the register; it cannot shrink what the register covers.
export const RETIRED = [
  { id: 'EX-16', pred: 'isChecked', retired_in: 'Prompt 40, commit 1',
    kept_verbatim: [
      "{ id: 'EX-16', pred: 'isChecked', kind: 'structural',",
      "what: 'Separates checkbox widgets in the ON state from those in the OFF state in verify-appearances.mjs.',",
      "structural_because: 'A state test on a widget, not an excusal. Both branches are verified — an ON box must draw its ON appearance and an OFF box must draw nothing — so neither state leaves the assertion. The report prints checkedText and checkedBoxes separately and the two sum to the checked total.' },",
    ],
    what_it_got_right: "The SITE is real and the description of it is accurate. adapters/pdf/verify-appearances.mjs:224 reads \"if (!field.isChecked()) continue;\", it does separate ON-state checkbox widgets from OFF-state ones, and both branches are verified exactly as the entry says.",
    what_it_got_wrong: "That isChecked was an ENGINE-DEFINED predicate. It is PDFCheckBox.prototype.isChecked, a pdf-lib method, and pdf-lib is not a swept file. The name entered enginePredicates() only because adapters/pdf/run-form-gate.mjs happened to declare a LOCAL \"const isChecked = (target) => …\" inside gate step 11 — an unrelated helper, in a different file, that read a checkbox off the filled form. [EX-90] narrows sites to engine-defined predicates precisely so that library methods stay out; this entry was paying for a site [EX-90] should always have removed, and it looked sound for exactly as long as the name collision held.",
    how_it_surfaced: "Hoisting that helper out of step 11 for [B9] moved it from \"const isChecked = (target) =>\" to an object property \"isChecked: (target) =>\", which the DEF regex does not match. The name left the universe, the site stopped being reported, and the orphan check named this entry on the next run. Nothing about the site changed; what changed is that the accident stopped holding it up.",
    why_it_is_the_id_collision_one_level_out: "A register entry whose disposition was load-bearing on a NAME being the same in two unrelated places. That is the [D-07] subject exactly, with a predicate name in place of an id — and it is the argument for asserting uniqueness rather than trusting that a lookup happens not to use the colliding key." },
];

export const DECLARED = [
  { id: 'EX-30', key: '_partition.excluded_never_autofill', kind: 'scoped',
    what: 'Removes a form field from the set that must be bound — a signature block, a preparer-use box, a field the engine will never fill.',
    assertedBy: 'count-sweep.mjs [S-01], which derives the figure from widget geometry via classifyMapTargets and compares it against the declaration; and verify-form-coverage.mjs, which requires the six partition categories to sum to the form\'s own field count.',
    count: () => FIXTURE_FORMS().reduce((n, f) => n + (mapDoc(f)?._partition?.excluded_never_autofill ?? 0), 0) },

  { id: 'EX-31', key: '_partition.deferred', kind: 'scoped',
    what: 'Removes a form field from the current slice\'s binding obligation, deferring it to a later one.',
    assertedBy: 'The same [S-01] derivation and the same closing partition. A deferred field is still counted in form_fields_total, so deferring cannot shrink the denominator.',
    count: () => FIXTURE_FORMS().reduce((n, f) => n + (mapDoc(f)?._partition?.deferred ?? 0), 0) },

  { id: 'EX-32', key: 'not_checkable.entries', kind: 'scoped',
    what: 'Removes a printed total-shaped cell from the tripwire arithmetic — a total whose printed constraint arithmetic cannot express.',
    assertedBy: 'run-form-gate.mjs step 11, which is a STOP when a cell is BOTH checked by a tripwire and declared not checkable; blanket-audit.mjs\'s completeness counter over `not_checkable.entries[]`, which requires every entry to carry `why_not_checkable`; and the gate summary, which prints tripwires_declared_not_checkable on every run.',
    count: () => FIXTURE_FORMS().reduce((n, f) => n + ((totalsDoc(f)?.not_checkable?.entries || []).length), 0) },
];

// ---------------------------------------------------------------------------------------
// THE CANARY.
//
// A synthetic spec and map, held in memory, in which one class claims a 433-F table as "not
// currently mapped" AND a synthetic map routes it. [EX-01]'s cross-check must contradict it.
// This is the [A3] defect in miniature, run on every invocation, so a cross-check that stops
// comparing fails loudly rather than reporting nothing to contradict.
// ---------------------------------------------------------------------------------------
export const runCanary = () => {
  const spec = { classes: [{ class_id: 'canary_class', printed_tables: { canaryform: ['C1. Canary table - printed, not currently mapped'] } }] };
  const maps = { canaryform: { groups: { canary_group: { row_class: { accepts: ['canary_class'] }, slots: [] } } } };
  const acc = acceptorsOf(maps);
  const excused = [];
  for (const c of spec.classes) for (const [form, tables] of Object.entries(c.printed_tables))
    for (const t of tables) if (/^\s*none\b/i.test(t) || /not currently mapped/i.test(t)) excused.push({ class_id: c.class_id, form, text: t });
  const contradicted = excused.filter((e) => (acc.get(e.class_id) || []).some((a) => a.form === e.form));
  return {
    excused: excused.length, contradicted: contradicted.length,
    ok: excused.length === 1 && contradicted.length === 1,
    why: 'one synthetic claim, excused by the phrase and routed by the map; the cross-check must find exactly one contradiction',
  };
};

// ---------------------------------------------------------------------------------------
// THE SECOND CANARY — THE REACHABILITY RULE, ON A TREE THAT IS NOT THIS ONE.
//
// [D-08] in miniature, both directions, in memory. Three synthetic files:
//
//   a.mjs   defines `isChecked` and never calls it        (the run-form-gate.mjs local)
//   b.mjs   calls `field.isChecked()` in an exclusion position, imports nothing
//                                                          (the verify-appearances.mjs site)
//   c.mjs   imports isChecked from a.mjs and calls it in an exclusion position
//
// The rule must attribute NOTHING to b.mjs — that site is a library method call, in a file
// that cannot see a.mjs, and every version of this sweep before this commit counted it — and
// exactly one site to c.mjs, which genuinely can. A canary that only checked the first half
// would pass on a rule that attributes nothing to anybody, which is the silent direction of
// the same defect one level out.
//
// NOT DRAWN FROM THE TREE, per the standing rule: a canary built from the real files cannot
// tell a broken reachability rule from a tree that happens to have no accidents left in it.
// ---------------------------------------------------------------------------------------
export const REACH_CANARY_SRC = {
  'x/a.mjs': "const isChecked = (t) => !!t;\nexport { isChecked };\n",
  'x/b.mjs': "import { PDFCheckBox } from 'pdf-lib';\nfor (const field of fields) {\n  if (!field.isChecked()) continue;\n}\n",
  'x/c.mjs': "import { isChecked } from './a.mjs';\nfor (const t of all) {\n  if (!isChecked(t)) continue;\n}\n",
};

export const runReachCanary = () => {
  const files = Object.keys(REACH_CANARY_SRC);
  const read = (f) => REACH_CANARY_SRC[f];
  const defs = predicateDefinitions(files, read);
  const reach = new Map(files.map((f) => [f, reachableIn(f, defs, read)]));
  const inB = reach.get('x/b.mjs').has('isChecked');
  const inC = reach.get('x/c.mjs').has('isChecked');
  const fromC = reach.get('x/c.mjs').get('isChecked');
  return {
    ok: inB === false && inC === true && fromC === 'x/a.mjs',
    inB, inC, fromC,
    why: 'a local in a.mjs must NOT be reachable from b.mjs, which imports nothing, and MUST be reachable from c.mjs, which imports it — resolved back to a.mjs and not merely to the name',
  };
};

// ---------------------------------------------------------------------------------------
export const runExclusionSweep = async () => {
  const problems = [];
  const rows = [];
  const sites = exclusionSites();

  const reach = runReachCanary();
  if (!reach.ok)
    problems.push(`CANARY DEAD  the reachability rule attributed a local in x/a.mjs to x/b.mjs (${reach.inB}, expected false) and to x/c.mjs (${reach.inC} from ${reach.fromC}, expected true from x/a.mjs).\n      ${reach.why}.\n      Every predicate-to-site attribution in this run is therefore unchecked: this is [D-08] with the guard against it broken. STOP.`);

  const canary = runCanary();
  if (!canary.ok)
    problems.push(`CANARY DEAD  the synthetic "not currently mapped" claim over a synthetic routed map produced ${canary.excused} excusal(s) and ${canary.contradicted} contradiction(s); expected 1 and 1.\n      The cross-check no longer compares an excusal to reality. Every "0 contradicted" in this run is meaningless. STOP.`);

  for (const e of [...PREDICATES, ...DECLARED]) {
    const id = e.id, name = e.pred || e.key;
    // A `claiming` entry with no cross-check is the state this file forbids.
    if (e.kind === 'claiming' && typeof e.crosscheck !== 'function') {
      problems.push(`NO CROSS-CHECK  [${id}]  ${name}\n      is registered \`claiming\` — it narrows a check on a statement about reality — and carries no crosscheck().\n      An excusal nothing compares to the world is the [A3] defect with a register entry on it.`);
      rows.push({ id, name, kind: e.kind, count: '?', verdict: 'NO CROSS-CHECK' });
      continue;
    }
    if (e.kind === 'scoped' && !e.assertedBy) {
      problems.push(`NO NAMED ASSERTION  [${id}]  ${name}\n      is registered \`scoped\` and names no assertion that covers the narrowing. Name it, or reclassify.`);
      rows.push({ id, name, kind: e.kind, count: '?', verdict: 'NO NAMED ASSERTION' });
      continue;
    }
    if (e.kind === 'structural' && !e.structural_because) {
      problems.push(`NO REASON  [${id}]  ${name}\n      is registered \`structural\` and does not say why it removes nothing from any assertion's scope.`);
      rows.push({ id, name, kind: e.kind, count: '?', verdict: 'NO REASON' });
      continue;
    }

    let n = '-';
    if (typeof e.count === 'function') {
      try { n = await e.count(); }
      catch (err) {
        problems.push(`UNREADABLE  [${id}]  ${name}\n      its count() threw: ${err.message}\n      An exclusion whose size cannot be read reports that it could not be read. Never a pass.`);
        rows.push({ id, name, kind: e.kind, count: 'UNREADABLE', verdict: 'UNREADABLE' });
        continue;
      }
    }
    let found = [];
    if (typeof e.crosscheck === 'function') {
      try { found = (await e.crosscheck()) || []; }
      catch (err) {
        problems.push(`UNREADABLE  [${id}]  ${name}\n      its crosscheck() threw: ${err.message}\n      A cross-check that cannot read its input reports that it could not read it. Never a pass.`);
        rows.push({ id, name, kind: e.kind, count: n, verdict: 'UNREADABLE' });
        continue;
      }
    }
    problems.push(...found);
    let observed = null;
    if (typeof e.observe === 'function') {
      try { observed = await e.observe(); }
      catch (err) {
        problems.push(`UNREADABLE  [${id}]  ${name}\n      its observe() threw: ${err.message}`);
        rows.push({ id, name, kind: e.kind, count: n, verdict: 'UNREADABLE' });
        continue;
      }
    }
    rows.push({ id, name, kind: e.kind, count: n, sites: sitesFor(sites, e).length, definedIn: e.definedIn, verdict: found.length ? 'CONTRADICTED' : (typeof e.crosscheck === 'function' ? 'cross-checked' : (e.kind === 'scoped' ? 'asserted elsewhere' : e.kind)), assertedBy: e.assertedBy, observed });
  }

  // COMPLETENESS: a REACHABLE predicate excusing a site with no register entry is a STOP,
  // and the unit is now (name, defining module) rather than the bare name. Two files defining
  // the same one-line predicate are two predicates, and a register entry naming one of them
  // says nothing about the other — which is [D-08] in the direction that stays quiet.
  const registered = new Set(PREDICATES.flatMap((p) => [].concat(p.definedIn || []).map((d) => `${p.pred}@${d}`)));
  const bareRegistered = new Set(PREDICATES.filter((p) => !p.definedIn).map((p) => p.pred));
  const seenPairs = new Set(sites.rows.map((r) => `${r.pred}@${r.definedIn}`));
  for (const pair of [...seenPairs].sort()) {
    const [nm, mod] = pair.split('@');
    if (registered.has(pair) || bareRegistered.has(nm)) continue;
    const at = sites.rows.filter((r) => `${r.pred}@${r.definedIn}` === pair).map((r) => r.at);
    problems.push(`UNREGISTERED  ${nm}  defined in ${mod}  (${at.length} site(s): ${at.slice(0, 4).join(', ')}${at.length > 4 ? ', …' : ''})\n      excuses a site from a check and appears in no entry of PREDICATES for that module.\n      Register it as structural, scoped or claiming — and if claiming, give it a crosscheck().\n      There is no fourth state.`);
  }
  // RETIRED ENTRIES, AND THE GUARD RUNS THE OTHER WAY. An entry leaves PREDICATES because
  // its predicate left the engine-defined universe; if the name comes BACK into that
  // universe and excuses a site again, the retirement is silently excusing it. So a retired
  // predicate that reappears as a live site is a STOP. Without this, "retire the entry"
  // would be a way to make the orphan check go quiet, which is the same move as deleting a
  // failing assertion.
  for (const e of RETIRED) {
    if (sites.predicates.includes(e.pred))
      problems.push(`RESURRECTED  [${e.id}]  ${e.pred}\n      is RETIRED from PREDICATES and is excusing a site again: ${sites.rows.filter((r) => r.pred === e.pred).map((r) => r.at).join(', ')}.\n      Either the retirement reasoning is wrong or the predicate came back. Re-read it and re-register it.`);
  }

  // And an entry whose predicate no longer excuses anything is a disposition over dead code.
  for (const e of PREDICATES) {
    if (e.pred.startsWith('(')) continue;                       // declared/meta entries have no source site
    if (e.viaConst) {
      // Proved by its DEFINITION, because a constant is not called in an exclusion position.
      const src = readFileSync(e.viaConst, 'utf8');
      if (!new RegExp(`(?:export\\s+)?const\\s+${e.pred}\\s*=`).test(src))
        problems.push(`ORPHAN  [${e.id}]  ${e.pred}\n      is registered as an exclusion and ${e.viaConst} no longer defines it.\n      The exclusion it disposes of has been removed or renamed; re-read it and re-write the entry.`);
      continue;
    }
    // AN ENTRY IS ORPHANED PER DEFINING MODULE. Before this commit the test was "does this
    // NAME appear anywhere", so an entry could keep looking alive on somebody else's identically
    // named local — which is precisely how [EX-16] survived three slices.
    const mine = sitesFor(sites, e);
    if (!mine.length) {
      const elsewhere = sites.rows.filter((r) => r.pred === e.pred).map((r) => r.definedIn);
      problems.push(`ORPHAN  [${e.id}]  ${e.pred}${e.definedIn ? ` (declared in ${[].concat(e.definedIn).join(', ')})` : ''}\n      is registered as an exclusion predicate and excuses no site reachable from the module(s) it names.\n      ${elsewhere.length ? `A predicate of that NAME does excuse ${elsewhere.length} site(s), defined in ${[...new Set(elsewhere)].join(', ')} — a different definition, which this entry says nothing about.` : 'No predicate of that name excuses anything anywhere.'}\n      The predicate it disposes of has been removed or repurposed; re-read it and re-write the entry.`);
    }
    // A DECLARED MODULE THAT DEFINES NOTHING OF THAT NAME is a stale half of the entry, and it
    // is a STOP on its own: the entry would go on looking sound on its other modules.
    for (const d of [].concat(e.definedIn || [])) {
      if (!sites.defs.get(e.pred)?.has(d))
        problems.push(`STALE MODULE  [${e.id}]  ${e.pred}\n      names ${d} as a defining module and that file no longer defines it.\n      Either the predicate moved or the entry was written against a file it was never in.`);
    }
  }

  return { rows, problems, sites, canary, reach };
};

export const reportExclusionSweep = (s, { verbose = false } = {}) => {
  const tally = s.rows.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});
  const excused = s.rows.reduce((a, r) => a + (typeof r.count === 'number' ? r.count : 0), 0);
  console.log(`exclusion sweep: ${s.rows.length} registered exclusion(s) — ${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  console.log(`                 ${s.sites.rows.length} source site(s) governed by ${s.sites.predicates.length} engine-defined predicate(s), out of ${s.sites.raw} raw exclusion position(s) [EX-90 removes ${s.sites.raw - s.sites.rows.length}]`);
  console.log(`                 ${excused} site(s) excused in total across every counted exclusion`);
  console.log(`                 canary: ${s.canary.ok ? 'holds' : 'DEAD'} (${s.canary.contradicted}/${s.canary.excused} synthetic excusal(s) contradicted)`);
  console.log(`                 reachability canary: ${s.reach.ok ? 'holds' : 'DEAD'} (a local in x/a.mjs reaches x/b.mjs: ${s.reach.inB}; reaches x/c.mjs: ${s.reach.inC} via ${s.reach.fromC})`);
  for (const r of s.rows) {
    console.log(`    ${String(r.id).padEnd(6)} ${String(r.kind).padEnd(11)} ${String(r.count).padStart(4)} excused  ${String(r.sites ?? '-').padStart(2)} site(s)  ${r.verdict.padEnd(18)} ${r.name}`);
    // An observation is printed on EVERY run, not behind --verbose. The whole finding this
    // file exists for is that `excusedClaims()` printed three claims nobody compared to
    // anything — so a split an excusal has been hiding does not go behind a flag.
    if (r.observed) for (const o of r.observed) console.log(`             ${o}`);
  }
  if (verbose) for (const r of s.rows) if (r.assertedBy) console.log(`      [${r.id}] asserted by: ${r.assertedBy}`);
  if (!s.problems.length) {
    console.log('OK — every exclusion predicate in the engine is registered, its excusals are counted, and every excusal that states something about the world has been compared against the world.');
    return 0;
  }
  console.error(`EXCLUSION SWEEP — ${s.problems.length} problem(s):`);
  s.problems.forEach((p) => console.error(`  ${p}`));
  return s.problems.length;
};

// CLI
if (process.argv[1] && /exclusion-sweep\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const s = await runExclusionSweep();
  process.exit(reportExclusionSweep(s, { verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
