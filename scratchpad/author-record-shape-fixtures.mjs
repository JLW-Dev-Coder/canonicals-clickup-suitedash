// Authors the record-shape fixture SET for every form whose map declares a record shape.
//
//   node scratchpad/author-record-shape-fixtures.mjs
//
// THREE FIXTURES PER FORM, and each is derived from that form's ACCEPTANCE fixture rather than
// written fresh, so the only thing that differs between them and a known-good record is the
// route and the operand cells the route governs. A hand-written record-shape fixture could
// fail for a hundred reasons that have nothing to do with the route, and a run that failed for
// one of those would prove nothing about the construct.
//
//   <form>.pl-route.sample.json               declares profit_and_loss_statement, EMPTIES every
//                                             governed operand, keeps the totals. MUST HOLD.
//   <form>.pl-route-operands-filled.sample.json  declares profit_and_loss_statement and leaves
//                                             the operands filled. MUST STOP.
//   <form>.grid-route-operands-empty.sample.json declares grid and empties the operands.
//                                             MUST STOP.
//
// THE OPERAND LIST IS READ OFF THE TOTALS DECLARATION, NEVER TYPED. Each governed line names
// its feeders; this empties exactly those keys and nothing else. A typed list would drift from
// the declaration the moment a line gained an operand, and the fixture would go on passing.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadRecordShape, statesOf } from '../adapters/pdf/record-shape.mjs';
import { resolveFixture } from '../adapters/pdf/resolve-fixture.mjs';
import { MAPPED_FORMS } from '../adapters/pdf/resolve-fixture.mjs';

const GENERATOR = 'scratchpad/author-record-shape-fixtures.mjs';

let wrote = 0;
for (const form of MAPPED_FORMS()) {
  const mapDoc = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.map.json`, 'utf8'));
  const rs = loadRecordShape(mapDoc);
  if (!rs.declared) continue;
  const totals = JSON.parse(readFileSync(`adapters/pdf/maps/${form}.totals.json`, 'utf8'));

  const acc = resolveFixture(form, 'acceptance');
  if (acc.problems.length || !acc.path) {
    console.error(`STOP — ${form} has no resolvable acceptance fixture to derive from:`);
    acc.problems.forEach((p) => console.error(`  ${p}`));
    process.exit(2);
  }
  const base = JSON.parse(readFileSync(acc.path, 'utf8'));
  // A PROVENANCE BLOCK BELONGS TO THE FILE IT DESCRIBES, AND IS NOT INHERITED.
  //
  // These fixtures are built by spreading the acceptance record, so every top-level key it
  // carries comes along — including `_co_authored_with_hand`, which names the keys a HAND
  // authored in THAT file. Inherited into a derived fixture the block is false twice over: it
  // describes edits nobody made here, and adapters/pdf/assert-fixture-authorship.mjs correctly
  // reports it as a co-authorship declaration for a divergence that does not exist, on three
  // fixtures this generator is the sole author of. `_generated_by` was already overwritten
  // below for the same reason; this is the other half of it.
  delete base._co_authored_with_hand;

  for (const d of rs.declarations) {
    const states = statesOf(d);
    const pl = states.find((s) => /profit_and_loss/.test(s));
    const grid = states.find((s) => s === 'grid');
    if (!pl || !grid) { console.error(`STOP — ${form}/${d.id} declares states ${states.join(', ')}; this generator knows "grid" and a profit-and-loss state and refuses to guess at others.`); process.exit(2); }

    // Every operand key of every line this declaration governs, from the declaration itself.
    const governed = (d.governs || []).map((line) => {
      const e = (totals.totals || []).find((x) => x.line === line);
      if (!e) { console.error(`STOP — ${form}: ${d.id} governs line "${line}" and the totals declaration has no such line.`); process.exit(2); }
      return { line, keys: (e.feeders || []).flatMap((f) => f.keys || []), total: e.total_key };
    });
    const operandKeys = [...new Set(governed.flatMap((g) => g.keys))];
    if (!operandKeys.length) { console.error(`STOP — ${form}/${d.id}: the governed lines name no scalar feeder keys, so there is nothing for these fixtures to empty and they would prove nothing.`); process.exit(2); }

    const emptied = (doc) => { const o = { ...doc }; for (const k of operandKeys) delete o[k]; return o; };

    const write = (suffix, doc, fixture, note) => {
      const out = { ...doc };
      // A DISTINCT intake_id PER FIXTURE, BECAUSE THE OUTPUT PATH IS DERIVED FROM IT. The gate
      // writes adapters/pdf/out/<form>_filled_<intake_id || "sample">.pdf and its per-line
      // result beside it. 433-B(OIC)'s acceptance fixture carries no intake_id, so all three
      // of these would have written to one path and each run would have read the previous
      // run's answer back. The gate's own staleness check caught it — tripwires.json records
      // which sample produced it — but a check that fires is not a reason to leave the
      // collision standing.
      out.intake_id = `RS-${form.toUpperCase()}-${suffix.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`;
      out._fixture = fixture;
      out._what_this_covers = note;
      out._generated_by = `${GENERATOR}, from ${acc.path} — the acceptance fixture of this form, so the ONLY difference from a known-good record is the declared route and the operand cells that route governs.`;
      out._operands_this_fixture_governs = `${operandKeys.length} scalar feeder key(s), read off ${`adapters/pdf/maps/${form}.totals.json`} lines ${(d.governs || []).join(' and ')} rather than typed: ${operandKeys.join(', ')}.`;
      const path = `samples/${form}.${suffix}.sample.json`;
      writeFileSync(path, JSON.stringify(out, null, 1) + '\n');
      wrote += 1;
      console.log(`  ${path}`);
      return path;
    };

    console.log(`${form} / ${d.id} — ${operandKeys.length} governed operand key(s) across lines ${(d.governs || []).join(', ')}`);

    // THE GRID STATE HAS NO FIXTURE HERE AND THAT IS DELIBERATE. The acceptance fixture IS a
    // grid-route record: it declares the route, completes every printed operand, and the gate
    // already runs it saturated on every run. A fourth file duplicating it would be a second
    // copy of a known-good record kept only to satisfy a counter, which is the shape
    // guard-sweep (c) forbids. adapters/pdf/assert-record-shape.mjs resolves the acceptance
    // fixture and counts it as that state's witness, and names it in the transcript so the
    // reader can see which state is covered by which.
    write('pl-route', { ...emptied(base), [d.input]: pl },
      { form, role: 'record_shape', why: `The ${pl} route, filed correctly: the operand lines are EMPTY and the totals are entered directly, which is what the printed note instructs. Exercises the check that state earns.`,
        record_shape: { declaration: d.id, state: pl, expect: 'holds' } },
      `THE ROUTE THE FORM PRINTS AND NOTHING HAD EVER FILED. Every operand of ${(d.governs || []).join(' and ')} is absent and the totals are present. Before adapters/pdf/record-shape.mjs this record FAILED the gate — the tripwire summed blanks to zero and read a non-zero box — which is the defect [B17] and [C-06] carried. It now passes a DIFFERENT check from the grid route, not a weakened one.`);

    write('pl-route-operands-filled', { ...base, [d.input]: pl },
      { form, role: 'record_shape', why: `THE FIRST GUARD DIRECTION. Declares the ${pl} route and leaves the operand lines filled, which the printed note forbids in so many words. Must STOP.`,
        record_shape: { declaration: d.id, state: pl, expect: 'stops' } },
      `A GUARD-DIRECTION FIXTURE. It is the acceptance record with one field changed: the route. The printed note says "Do not complete lines ...", so a record that provides a profit and loss statement AND completes the lines is a misfiled return, and nothing in this engine could refuse it before the record shape existed. Must STOP.`);

    write('grid-route-operands-empty', { ...emptied(base), [d.input]: grid },
      { form, role: 'record_shape', why: 'THE SECOND GUARD DIRECTION. Declares the grid route and leaves every operand empty, which is either a record that took the other route without saying so or one that forgot the lines. Must STOP.',
        record_shape: { declaration: d.id, state: grid, expect: 'stops' } },
      `A GUARD-DIRECTION FIXTURE. Under the old declaration this record would have produced a total against zero operands and failed as an ARITHMETIC mismatch, which names the wrong fault. It now stops with the route named and the operand count printed, so the reader is told which of the two mistakes was made.`);
  }
}
console.log(`${wrote} record-shape fixture(s) written`);
