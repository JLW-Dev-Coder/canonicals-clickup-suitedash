// WHAT A DECLARED LINE COMPARES, AND THE ONE-SIDED LINE — [B16].
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DEFECT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433-B(OIC) page 5 y 540.1 prints "Enter the amount from Box A*", and the asterisk resolves
// at y 461.1:
//
//   "*You may exclude any equity in income producing assets (except real estate) shown in
//    Section 2 of this form."
//
// Section 2 prints no column marking an asset as income-producing and no cell anywhere on the
// form holds the excluded amount. So a CORRECT filing can print less than Box A, by an amount
// the form records nowhere, and an equality check would fail it.
//
// But the cell can never legitimately EXCEED Box A. The footnote permits a REDUCTION and
// nothing on the page permits an addition. A ONE-SIDED constraint is therefore available and
// it refuses a real class of error — a copy that overstates the total available assets, which
// inflates the minimum offer amount on a filed offer in compromise. Until this file the engine
// had no construct for one: every declared line was an equality with an optional floor, and
// the cell was declared not checkable, giving up the half of the check that was sound.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// EXACTLY ONE NEW SHAPE, AND IT MUST QUOTE THE PAGE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   equals    (the default, and what every line declared before this file)
//   at_most   printed <= recomputed. REQUIRES `at_most_printed` quoting verbatim the sentence
//             that permits the inequality, and `at_most_printed_at` giving {page, y, x} for it.
//
// NO `at_least`. NO RANGES. NO COMPOSITION. A second shape is a new ruling, not a follow-on
// edit: the reason `at_most` is admissible is that a specific printed sentence authorises a
// reduction, and admitting the mirror without a printed sentence authorising an increase would
// be admitting slack under a comparison operator's name.
//
// A line declaring `at_most` WITHOUT the quote is a STOP, and a line declaring `equals` WITH
// one is a STOP too: an unused quotation beside an equality is a permission somebody wrote
// down and nobody applied, which reads on the page as though the inequality were in force.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// EQUALITY IS THE ORDINARY CASE OF AN at_most LINE, AND THAT IS WHY IT IS REPORTED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A record that excludes nothing prints the total exactly, so an `at_most` line normally holds
// AT equality and the inequality never bites. A transcript that only said "held" could not
// tell that from a run where the exclusion was actually taken, so the verdict carries `strict`
// — whether the printed figure was STRICTLY less than the recomputed one — and declaration
// coverage counts the strict case as the thing a fixture has to exercise.

/** The comparison kinds a declared line may name. */
export const COMPARISONS = new Set(['equals', 'at_most']);

/** Money to whole cents, so no comparison here is ever a float comparison. */
const cents = (n) => Math.round(n * 100);

/**
 * The verdict for one line. `printed` is what the filed page draws in the total cell;
 * `recomputed` is what this engine derived from the printed operands, after rounding and
 * after the floor. No tolerance, in either kind: `at_most` is an inequality between two exact
 * cent figures, which is a different object from slack around an equality.
 */
export const compare = (kind, printed, recomputed) => {
  const p = cents(printed), q = cents(recomputed);
  if (kind === 'at_most') return { holds: p <= q, strict: p < q, kind };
  return { holds: p === q, strict: false, kind: 'equals' };
};

/**
 * Every STOP a totals declaration can commit about its comparisons.
 * Returns a list of messages; empty means it holds.
 */
export const auditComparisons = (totalsDoc) => {
  const problems = [];
  const rows = [];
  for (const e of (totalsDoc?.totals || [])) {
    const kind = e.comparison ?? 'equals';
    if (!COMPARISONS.has(kind)) {
      problems.push(`line ${e.line}: \`comparison\` is ${JSON.stringify(e.comparison)} — not one of ${[...COMPARISONS].join(', ')}.`);
      continue;
    }
    rows.push({ line: e.line, kind });
    if (kind === 'at_most') {
      if (typeof e.at_most_printed !== 'string' || !e.at_most_printed.trim())
        problems.push(`line ${e.line}: declares \`comparison: "at_most"\` and quotes no \`at_most_printed\` sentence. A one-sided line rests entirely on a printed permission; without the quotation it is slack under a comparison operator's name.`);
      if (!e.at_most_printed_at || typeof e.at_most_printed_at.page !== 'number' || typeof e.at_most_printed_at.y !== 'number' || !Array.isArray(e.at_most_printed_at.x))
        problems.push(`line ${e.line}: declares \`comparison: "at_most"\` and gives no \`at_most_printed_at\` {page, y, x:[x1,x2]}. The y is a TEXT BASELINE — the one declared convention in this repo.`);
    } else {
      if (e.at_most_printed !== undefined || e.at_most_printed_at !== undefined)
        problems.push(`line ${e.line}: compares as an equality and still carries \`at_most_printed\`/\`at_most_printed_at\`. A permission written down beside a check that does not apply it reads as though the inequality were in force.`);
    }
  }
  return { problems, rows };
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY. A new comparison kind is exactly the object that can be wrong in one direction
// and look right in every transcript, because the ordinary case of an `at_most` line is an
// equality. So both directions of both kinds are fired on every run, and a canary that does
// not bite is a STOP.
export const canary = () => {
  const results = [
    ['equals holds on equality',              compare('equals', 1200, 1200).holds === true],
    ['equals refuses a low printed figure',   compare('equals', 1199, 1200).holds === false],
    ['equals refuses a high printed figure',  compare('equals', 1201, 1200).holds === false],
    ['at_most holds on equality',             compare('at_most', 1200, 1200).holds === true],
    ['at_most holds strictly below',          compare('at_most', 900, 1200).holds === true],
    ['at_most REFUSES above',                 compare('at_most', 1201, 1200).holds === false],
    ['at_most reports strict only when strictly below',
      compare('at_most', 900, 1200).strict === true && compare('at_most', 1200, 1200).strict === false],
    ['at_most refuses one cent above, so no tolerance is hiding in the cent conversion',
      compare('at_most', 1200.01, 1200).holds === false],
  ];
  const failed = results.filter(([, ok]) => !ok).map(([what]) => what);
  return { checks: results.length, failed };
};

/** Print the audit and return the number of problems (0 = holds). */
export const reportComparisons = (audit, totalsPath) => {
  const bird = canary();
  if (bird.failed.length) {
    console.error(`COMPARISON CANARY DID NOT BITE — ${bird.failed.length} of ${bird.checks} behaviour(s) are wrong:`);
    bird.failed.forEach((f) => console.error(`  ${f}`));
    return bird.failed.length;
  }
  const byKind = audit.rows.reduce((a, r) => { (a[r.kind] ||= []).push(r.line); return a; }, {});
  console.log(`comparisons: ${audit.rows.length} declared line(s) in ${totalsPath} — ${Object.entries(byKind).map(([k, v]) => `${v.length} ${k}`).join(', ') || 'none'}`);
  if (byKind.at_most) console.log(`  one-sided line(s): ${byKind.at_most.join(', ')} — each quotes the printed sentence that permits the inequality`);
  console.log(`  canary: holds (${bird.checks} behaviours, both directions of both kinds fired)`);
  if (!audit.problems.length) return 0;
  console.error(`COMPARISON DECLARATION — ${audit.problems.length} problem(s):`);
  audit.problems.forEach((p) => console.error(`  ${p}`));
  return audit.problems.length;
};
