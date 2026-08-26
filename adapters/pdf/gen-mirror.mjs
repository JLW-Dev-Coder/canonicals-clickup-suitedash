// THE MIRROR DECLARATION FOR A FORM THAT DRAWS EVERY CELL TWICE, DERIVED FROM THE PAGE.
//
//   node adapters/pdf/gen-mirror.mjs <form>            # write adapters/pdf/maps/<form>.mirror.json
//   node adapters/pdf/gen-mirror.mjs <form> --check    # regenerate and compare, writing nothing
//
//   exit 0 = written, or (with --check) the file on disk is what this tool produces
//   exit 2 = the form does not have the shape a mirror declaration describes, or --check differs
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY A DECLARATION AND NOT AN EXEMPTION
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The duplicate-write guard has forbidden intentional double-binding since prompt 4, and it is
// right to. 433-D draws all 83 of its cells TWICE — page 1 is "Part 1 — IRS Copy", page 3 is
// "Part 2 — Taxpayer's Copy" — so every binding on it is a double write, and the guard would
// refuse the entire form.
//
// The wrong repair is an exemption: a sentence somewhere saying the guard does not apply to
// 433-D. An exemption is a hiding place — it switches a check off over a region and nothing ever
// measures what it switched off. THE MIRROR IS A DECLARATION INSTEAD, and a declaration is
// itself checked, in three directions:
//
//   every declared pair is REAL       both members are widgets on the page, on the two declared
//                                     pages, of the same type and the same maxLen
//   the declaration is COMPLETE       no cell on either page is left out of a pair, and every
//                                     exclusion is named with a reason and asserted TRUE
//   a stem is bound to BOTH or STOP   adapters/pdf/assert-mirror.mjs, once bindings exist
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE PAIR KEY IS THE LEAF STEM, AND THE OBVIOUS KEY IS WRONG
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Keyed on the full field path with the page container stripped, 433-D's two pages correspond on
// only 66 of 83 cells. The other 17 differ at the INTERMEDIATE SUBFORM: `AccountNumber[0]` on
// page 1, `AccountingNumber[0]` on page 3 — a typo in the IRS form's own field naming, on the
// taxpayer copy. The leaf names are identical on both sides.
//
// So the key is the leaf stem, and its PRECONDITION is asserted rather than assumed: a stem must
// be unique WITHIN a page, or two cells on one page would collapse into a single pair and the
// mirror would be declared over a merge. That check is [M-02] below and it is the reason this
// tool can use a weaker key safely.
//
// THE TYPO IS RECORDED AND NEVER NORMALISED. An engine that quietly repaired it would be deciding
// that two differently-spelled names mean the same thing, and [R-08] reserves that judgement for
// the printed page — which is where it was actually made: the caption over both cells is
// "b. Account number", established by adapters/pdf/correlate-labels.mjs's probe.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// EVERY EXCLUSION IS A CLAIM [R-14]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433-D has 84 distinct leaf stems and each appears EXACTLY TWICE, so "every stem appears twice"
// is true of it and proves nothing: the 84th stem is `hyperlink`, two PDFButtons sitting side by
// side on page 4, which is not a mirrored fact and not a cell anybody fills. It is excluded BY
// NAME, with its reason, and the exclusion is ASSERTED — an excluded stem that turns out to be a
// genuine cross-page pair is a STOP, not a quiet omission.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readWidgetGeometry } from './page-geometry.mjs';
import { assertGenerator, selfPath, generatorMeta } from '../hubspot/generator-guard.mjs';

export const formPath = (form) => `adapters/pdf/forms/f${form}.pdf`;
export const mirrorPath = (form) => `adapters/pdf/maps/${form}.mirror.json`;

export const stemOf = (n) => String(n).split('.').pop().replace(/\[\d+\]$/, '');
export const tailOf = (n) => String(n).replace(/^[A-Za-z0-9_]+\[0\]\.[A-Za-z0-9_]+\[0\]\./, '');
// A `containerOf` stood here and is GONE, not disposed. It matched the page container out of a
// field path and returned null when it did not match — a silent extraction, which guard-sweep
// reported as UNDISPOSED on this file's first sweep. Nothing read its result: it was set on every
// row and never used, so the honest disposition was deletion. A disposition explaining why a dead
// extraction is safe is the sentence that keeps dead code alive.

// ── THE EXCLUSIONS, DECLARED PER FORM ──────────────────────────────────────────────────────
//
// Keyed by form and then by leaf stem. Each value is the REASON, and assertExclusions() below
// checks every one: an excluded stem whose two occurrences ARE on the two mirrored pages is a
// STOP, because that is a real pair being hidden by a sentence.
export const EXCLUSIONS = {
  '433d': {
    hyperlink: 'Two PDFButtons on page 4 — form1[0].Page4_Part2[0].agree_to[0].item[8].hyperlink[0] and form1[0].Page4_Part2[0].installment_payments[0].item8[0].hyperlink[0]. BOTH OCCURRENCES ARE ON THE SAME PAGE and neither is a cell a filer fills; they are links in the INSTRUCTIONS TO TAXPAYER text. This stem appears exactly twice, which is what makes it worth excluding by name: a completeness check phrased as "every stem appears twice" would have counted it as the 84th mirrored fact and been satisfied by a pair of buttons.',
  },
};

/** The two pages a form mirrors across, derived from where its data widgets actually are. */
export const mirroredPages = (widgets) => {
  const byPage = new Map();
  for (const w of widgets) byPage.set(w.page, (byPage.get(w.page) || 0) + 1);
  // The mirrored pages are the two carrying an EQUAL, non-zero widget count. Derived rather than
  // named, so a form that mirrors pages 2 and 5 needs no edit here — and a form where no two
  // pages match is refused rather than forced into a shape it does not have.
  const pages = [...byPage.entries()].filter(([, n]) => n > 0).sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < pages.length; i++)
    for (let j = i + 1; j < pages.length; j++)
      if (pages[i][1] === pages[j][1]) return { a: pages[i][0], b: pages[j][0], count: pages[i][1], byPage: Object.fromEntries(byPage) };
  return { stop: `no two pages carry an equal non-zero widget count, so this form has no mirrored pair of pages. Counts by page: ${JSON.stringify(Object.fromEntries(byPage))}`, byPage: Object.fromEntries(byPage) };
};

export const build = async (form) => {
  const problems = [];
  const src = formPath(form);
  if (!existsSync(src)) return { problems: [`no blank at ${src}`] };
  const { widgets, pageCount } = await readWidgetGeometry(readFileSync(src));
  const rows = widgets.map((w) => ({ ...w, stem: stemOf(w.name), tail: tailOf(w.name) }));

  const pages = mirroredPages(rows);
  if (pages.stop) return { problems: [`[M-01] ${form}: ${pages.stop}`] };

  const A = rows.filter((r) => r.page === pages.a);
  const B = rows.filter((r) => r.page === pages.b);

  // ── [M-02] THE PAIR KEY'S PRECONDITION ───────────────────────────────────────────────────
  for (const [label, side] of [[pages.a, A], [pages.b, B]]) {
    const seen = new Map();
    for (const r of side) seen.set(r.stem, (seen.get(r.stem) || 0) + 1);
    const dup = [...seen.entries()].filter(([, n]) => n > 1);
    if (dup.length) problems.push(`[M-02] ${form}: page ${label} draws ${dup.length} leaf stem(s) MORE THAN ONCE (${dup.map(([s, n]) => `${s} x${n}`).join(', ')}). The stem is this construct's pair key and a stem repeated within a page would collapse two cells into one pair.`);
  }

  // ── THE PAIRS ────────────────────────────────────────────────────────────────────────────
  const byStemB = new Map(B.map((r) => [r.stem, r]));
  const pairs = [];
  for (const a of A) {
    const b = byStemB.get(a.stem);
    if (!b) { problems.push(`[M-03] ${form}: page ${pages.a} draws "${a.stem}" (${a.name}) and page ${pages.b} draws no cell with that leaf stem. A cell with no copy is not a mirrored form.`); continue; }
    if (a.type !== b.type) problems.push(`[M-04] ${form}: pair "${a.stem}" is a ${a.type} on page ${pages.a} and a ${b.type} on page ${pages.b}. Two copies that are not the same kind of cell cannot hold the same value.`);
    if ((a.maxLen ?? null) !== (b.maxLen ?? null)) problems.push(`[M-04] ${form}: pair "${a.stem}" has maxLen ${a.maxLen ?? 'null'} on page ${pages.a} and ${b.maxLen ?? 'null'} on page ${pages.b}.`);
    pairs.push({ stem: a.stem, type: a.type, [`page${pages.a}`]: a.name, [`page${pages.b}`]: b.name, paths_differ: a.tail !== b.tail, tail_a: a.tail, tail_b: b.tail });
  }
  const orphanB = B.filter((r) => !A.some((a) => a.stem === r.stem));
  for (const o of orphanB) problems.push(`[M-03] ${form}: page ${pages.b} draws "${o.stem}" (${o.name}) and page ${pages.a} draws no cell with that leaf stem.`);

  // ── [M-05] THE EXCLUSIONS, ASSERTED ──────────────────────────────────────────────────────
  const declared = EXCLUSIONS[form] || {};
  const outside = rows.filter((r) => r.page !== pages.a && r.page !== pages.b);
  const outsideStems = [...new Set(outside.map((r) => r.stem))];
  for (const [stem, why] of Object.entries(declared)) {
    if (!why || !String(why).trim()) { problems.push(`[M-05] ${form}: exclusion "${stem}" carries no reason. An exclusion without a reason is an exemption.`); continue; }
    const occ = rows.filter((r) => r.stem === stem);
    if (!occ.length) { problems.push(`[M-05] ${form}: exclusion "${stem}" names a leaf stem this form does not draw. A stale exclusion stands over nothing.`); continue; }
    const onMirrored = occ.filter((r) => r.page === pages.a || r.page === pages.b);
    if (onMirrored.length) problems.push(`[M-05] ${form}: exclusion "${stem}" is excluded from the mirror and ${onMirrored.length} of its occurrence(s) ARE on the mirrored pages (${onMirrored.map((r) => `p${r.page} ${r.name}`).join(', ')}). That is a real pair being hidden by a sentence.`);
  }
  // ── [M-06] COMPLETENESS: every cell outside the mirrored pages is accounted for ───────────
  for (const s of outsideStems)
    if (!(s in declared)) problems.push(`[M-06] ${form}: leaf stem "${s}" is drawn outside the mirrored pages (${outside.filter((r) => r.stem === s).map((r) => `p${r.page}`).join(', ')}) and is in neither the pairs nor the declared exclusions. Every widget on this form is either half of a pair or an exclusion with a reason.`);

  const doc = {
    meta: {
      form,
      _what_this_is: 'THE MIRROR DECLARATION for a form that draws every cell twice. It is a DECLARATION AND NOT AN EXEMPTION: adapters/pdf/assert-mirror.mjs holds it to every clause below, and the duplicate-write guard stays on for every stem this file does not pair.',
      _the_rule: 'Every stem in a mirrored pair appears exactly twice; both copies receive the same value; A STEM BOUND TO ONLY ONE COPY IS A STOP. The third clause is the one an exemption could never state.',
      _the_pair_key: 'THE LEAF STEM, not the field path. Keyed on the path with the page container stripped, this form corresponds on only 66 of 83 cells: 17 differ at the intermediate subform (AccountNumber on the IRS copy, AccountingNumber on the taxpayer copy — a typo in the IRS form). The typo is recorded and never normalised; the caption over both cells is "b. Account number", established from the printed page. The stem key is safe only because [M-02] asserts a stem is unique within a page, and that assertion runs on every build.',
      _clauses_checked_here: {
        'M-01': 'the form has two pages carrying an equal, non-zero widget count — derived, not named',
        'M-02': 'every leaf stem is unique WITHIN each mirrored page, which is what makes the stem a safe pair key',
        'M-03': 'every cell on either mirrored page has a copy on the other',
        'M-04': 'both copies of every pair are the same widget type and the same maxLen',
        'M-05': 'every declared exclusion names a stem this form draws, carries a reason, and has NO occurrence on a mirrored page',
        'M-06': 'every widget outside the mirrored pages is a declared exclusion',
      },
      _clauses_checked_elsewhere: {
        'M-07': 'a stem bound to only ONE copy is a STOP — adapters/pdf/assert-mirror.mjs, against a map',
        'M-08': 'both copies hold the SAME VALUE in a filled PDF — adapters/pdf/assert-mirror.mjs, against a fill',
      },
      ...generatorMeta(selfPath(process.argv[1] || 'adapters/pdf/gen-mirror.mjs'), { generated_from: `the widget geometry of ${src}` }),
    },
    pages: { a: pages.a, b: pages.b, widgets_per_page: pages.count, all_pages: pages.byPage, page_count: pageCount },
    counts: {
      widgets: rows.length,
      distinct_leaf_stems: new Set(rows.map((r) => r.stem)).size,
      pairs: pairs.length,
      pairs_whose_paths_differ: pairs.filter((p) => p.paths_differ).length,
      checkbox_pairs: pairs.filter((p) => p.type === 'PDFCheckBox').length,
      text_pairs: pairs.filter((p) => p.type === 'PDFTextField').length,
      excluded_stems: Object.keys(declared).length,
    },
    exclusions: declared,
    pairs,
  };
  return { doc, problems };
};

if (process.argv[1] && /gen-mirror\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const form = process.argv[2];
  if (!form) { console.error('usage: node adapters/pdf/gen-mirror.mjs <form> [--check]'); process.exit(1); }
  const { doc, problems } = await build(form);
  if (problems.length) { console.error(`MIRROR DECLARATION — ${problems.length} problem(s) building ${form}:`); for (const p of problems) console.error(`  ${p}`); process.exit(2); }
  const out = mirrorPath(form);
  const would = JSON.stringify(doc, null, 1) + '\n';
  if (process.argv.includes('--check')) {
    // THE DIFFERENCE COUNT IS COMPUTED FIRST AND THE SUCCESS LINE IS ENCLOSED BY IT. The earlier
    // draft put the sentence after two `process.exit(2)` guards, which DO jump — and
    // success-sweep.mjs flagged it anyway, correctly: what it can see is the enclosing
    // conditional, and the enclosing conditional was `if (process.argv.includes(…))`, which names
    // no finding count. Restructuring is cheaper than arguing with the sweep, and it is also
    // stronger: the sentence is now unreachable on a failing run by its OWN condition rather than
    // by a reader's tracing of the two blocks above it.
    const diffs = [];
    if (!existsSync(out)) diffs.push(`${out} does not exist. --check compares; it does not create.`);
    else if (readFileSync(out, 'utf8') !== would) diffs.push(`${out} is not what ${selfPath(process.argv[1])} produces from the page. Regenerate it and read the difference before committing it.`);
    if (diffs.length) { console.error(`MIRROR DECLARATION — ${diffs.length} problem(s):`); for (const d of diffs) console.error(`  ${d}`); process.exit(2); }
    if (!diffs.length) console.log(`OK — 0 difference(s): ${out} regenerates byte-identical from the page (${doc.counts.pairs} pair(s), ${doc.counts.excluded_stems} declared exclusion(s)).`);
    process.exit(diffs.length ? 2 : 0);
  }
  if (existsSync(out)) assertGenerator(out, selfPath(process.argv[1]));
  writeFileSync(out, would);
  console.log(`wrote ${out} — ${doc.counts.pairs} pair(s) across pages ${doc.pages.a} and ${doc.pages.b}, ${doc.counts.pairs_whose_paths_differ} whose full paths differ, ${doc.counts.excluded_stems} declared exclusion(s).`);
}
