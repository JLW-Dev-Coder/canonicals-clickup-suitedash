// PROVE THE [D-16] NAME GUARDS FIRE, ON BOTH SHAPES, AND REVERT.
//
//   node scratchpad/prove-crosswalk-name-guards-fire.mjs
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The [D-16] fix widened A6 and A7 from ONE field file to every provisioned one, and closed
// A4/A5/A6/A7 on the derived shape. Every one of those now reports a large examined count and
// zero errors on every form — 239 rows on 433-A(OIC), 113 on 433-B(OIC), 97 on 433-F — and a
// comparison that has only ever agreed is a comparison nobody has seen say no. That is exactly
// the state [R-28] was ruled about, so the fix is proved by the instrument the same commit built.
//
// THE DIRECTION PROVED IS THE ONE THAT COSTS. A6's dangerous half is a row that CREATES a
// property under a name another form already created: HubSpot does not delete a property, the
// ceiling on this portal is hard, and the old one-file read could not see it. So the planted
// defect is a duplicate creation, once on the authored shape and once on the derived one.
//
// [R-28] ON A ONE-STEP TOOL. validate-crosswalk.mjs runs one step, so "the step the declaration
// lives in" is step 1 on both sides of the comparison and the condition is trivially met — and
// it is recorded rather than dropped, because a record that omits a field is refused. The
// conditions that do the work here are [FS-2], the failing message naming the row AND the file
// the name already exists in, and [FS-3], every OTHER assertion in the same run still reporting
// its own examined count and passing. A tool that died before A6 ran would satisfy neither.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { writeRecord, RECORD_DIR } from '../adapters/pdf/firing-proofs.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex').toUpperCase();
const run = (form) => {
  const r = spawnSync(process.execPath, ['adapters/hubspot/validate-crosswalk.mjs', form], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

/** Every "[Ann] <n> examined" line the run printed, as {line, verdict}. */
const assertionsIn = (out) => out.split('\n')
  .map((l) => /^\s+\[(A\d+)\]\s+(\d+) examined/.exec(l))
  .filter(Boolean)
  .map((m) => ({ line: m[1], examined: Number(m[2]) }));

// A NAME THAT EXISTS SOMEWHERE ELSE, TAKEN FROM THE TREE RATHER THAN INVENTED. A made-up name
// would prove the guard rejects gibberish; the defect this guard exists for is a real name a
// real other form really created, which is the case the one-file read let through.
const backbone = JSON.parse(readFileSync('adapters/hubspot/fields.433a.json', 'utf8'));
const AN_EXISTING_NAME = backbone.properties[0].hs_name;
console.log(`the planted duplicate is ${AN_EXISTING_NAME}, read out of adapters/hubspot/fields.433a.json — a name that really exists.`);

const CASES = [
  {
    form: '433f',
    shape: 'authored',
    file: 'adapters/hubspot/crosswalk.433f.json',
    assertion: 'A6',
    // The authored shape carries hs_name on the crosswalk row itself.
    mutate: (doc) => {
      const row = (doc.bindings || doc.rows).find((r) => r.classification !== 'exact');
      if (!row) return null;
      const was = row.hs_name;
      row.hs_name = AN_EXISTING_NAME;
      return { key: row.key, from: was, to: AN_EXISTING_NAME };
    },
  },
  {
    form: '433boi',
    shape: 'derived',
    file: 'adapters/hubspot/fields.433boi.json',
    assertion: 'A6',
    // The derived shape carries hs_name in the field file the deriver wrote, which is the
    // artefact the [D-16] closure reads.
    mutate: (doc) => {
      const p = doc.properties.find((x) => !x.backbone_key);
      if (!p) return null;
      const was = p.hs_name;
      p.hs_name = AN_EXISTING_NAME;
      return { key: p.key, from: was, to: AN_EXISTING_NAME };
    },
  },
];

const breaks = [];
for (const c of CASES) {
  const before = readFileSync(c.file);
  const beforeSha = sha(before);
  const doc = JSON.parse(before.toString('utf8'));
  const broke = c.mutate(doc);
  if (!broke) { console.error(`STOP — ${c.file} carries no row this file can plant a duplicate in.`); process.exit(2); }
  writeFileSync(c.file, JSON.stringify(doc, null, 1) + '\n');
  console.log('');
  console.log(`BROKEN (${c.shape}): ${c.file} — ${broke.key}: ${broke.from} -> ${broke.to}`);

  const r = run(c.form);
  const msg = r.out.split('\n').find((l) => l.includes(broke.key) && /ALREADY EXISTS/.test(l)) || '';
  // THE PASSING VERDICT IS "THE ASSERTION PRINTED ITS OWN EXAMINED LINE", NOT "IT EXAMINED
  // SOMETHING". A3 legitimately examines ZERO on 433-B(OIC), which declares no backbone_key on
  // any row — a checked absence, and [R-04] requires it be reported as a zero rather than
  // treated as a failure ([R-10]: a guard tuned to fire constantly gets turned off). A run in
  // which the step COLLAPSED prints no examined line at all, which is the state [FS-3] is
  // distinguishing, so presence is the right predicate and the count is carried beside it so a
  // zero stays visible instead of being absorbed into the word.
  const others = assertionsIn(r.out).filter((a) => a.line !== c.assertion)
    .map((a) => ({ line: a.line, verdict: 'ran', examined: a.examined }));
  console.log(`  exit ${r.status}`);
  console.log(`  ${msg.trim() || '(no message naming the planted row)'}`);
  console.log(`  other assertions in the same run: ${others.map((o) => `${o.line}:${o.examined}`).join(' ')}`);

  writeFileSync(c.file, before);
  const afterSha = sha(readFileSync(c.file));
  if (afterSha !== beforeSha) { console.error(`STOP — ${c.file} was NOT restored byte for byte.`); process.exit(2); }
  console.log(`  REVERTED: sha256 ${afterSha}`);

  const clean = run(c.form);
  breaks.push({
    declaration: `${c.assertion} reuse-before-creating | ${c.form} | ${c.shape} shape`,
    line: c.assertion,
    broke,
    tool: `node adapters/hubspot/validate-crosswalk.mjs ${c.form}`,
    tool_exit: r.status,
    // ONE STEP, AND IT IS RECORDED RATHER THAN OMITTED. A field left out is refused by the judge.
    failed_at_step: 1,
    step_the_declaration_lives_in: 1,
    _why_one_step: 'validate-crosswalk.mjs runs one step, so [FS-1] is trivially met here and the work is done by [FS-2] and [FS-3]. Recorded, not dropped.',
    broken_line_verbatim: msg.trim(),
    broken_line_verdict: 'ALREADY EXISTS',
    failing_verdict: 'ALREADY EXISTS',
    passing_verdict: 'ran',
    other_declared_lines: others,
    restored_digest_matches: afterSha === beforeSha,
    clean_after_revert: clean.status === 0,
    _clean_run: (clean.out.split('\n').find((l) => /^OK —/.test(l)) || `(exit ${clean.status})`).trim(),
  });
}

const path = writeRecord(`${RECORD_DIR}/crosswalk-name-guards.json`, {
  form: 'cross-form (433f authored, 433boi derived)',
  _generated_by: 'scratchpad/prove-crosswalk-name-guards-fire.mjs',
  tool_under_test: 'adapters/hubspot/validate-crosswalk.mjs',
  what_is_proved: 'that A6\'s create-a-name-that-exists direction fires on BOTH crosswalk shapes, naming the row and the file the name already lives in, while every other assertion in the same run still reports its own examined count.',
  planted_duplicate: AN_EXISTING_NAME,
  planted_duplicate_source: 'adapters/hubspot/fields.433a.json properties[0].hs_name — a real name, not an invented one',
  declarations_on_this_tool: CASES.length,
  declarations_source: 'the two crosswalk shapes this tool splits on, one case each',
  breaks,
});
console.log('');
console.log(`record written: ${path}`);
console.log('  Judged by node adapters/pdf/assert-firing-proofs.mjs, not here.');
