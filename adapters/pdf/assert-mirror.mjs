// THE MIRROR IS A DECLARATION, AND THIS IS WHAT HOLDS IT TO ITS CLAUSES.
//
//   node adapters/pdf/assert-mirror.mjs                 # every form that declares a mirror
//   node adapters/pdf/assert-mirror.mjs <form>          # one form
//   node adapters/pdf/assert-mirror.mjs --canary        # prove BOTH STOP directions fire
//
//   exit 0 = every declared mirror re-derives from its page, and every bound stem is bound to
//            both copies with the same value
//   exit 2 = a clause failed, or a canary did not fire
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A DECLARATION IS CHECKED; AN EXEMPTION IS A HIDING PLACE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The duplicate-write guard has forbidden intentional double-binding since prompt 4. 433-D draws
// all 83 of its cells twice, so every binding on it is a double write. The cheap repair is an
// exemption — a sentence saying the guard does not apply here — and an exemption switches a check
// off over a region with nothing measuring what it switched off.
//
// So the mirror is declared, and the declaration owes MORE than the guard did, not less. Three
// clauses, and the third is the one no exemption could ever state:
//
//   every stem in a mirrored pair appears EXACTLY TWICE
//   both copies receive the SAME VALUE
//   A STEM BOUND TO ONLY ONE COPY IS A STOP
//
// The first is checked at build time by adapters/pdf/gen-mirror.mjs ([M-01]..[M-06]) and
// re-checked here by regenerating from the page. The second and third are checked here.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// [M-07] AND [M-08] — THE TWO STOP DIRECTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [M-07] BINDING. A map may bind a mirrored stem or not bind it. What it may NOT do is bind one
// copy: a record whose value reaches the IRS copy and not the taxpayer copy produces a document
// where the two halves disagree, and nothing downstream would notice, because each half is
// internally consistent and the gate's coverage counts a bound target as covered either way.
//
// [M-08] VALUE. A filled PDF in which the two copies of one stem hold different text is the same
// defect one stage later, reached by a fill engine that wrote each copy separately. Checked
// against the FILLED BYTES rather than against the fill engine's own report, because a report is
// a claim by the thing being checked.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS ASSERTS TODAY, SAID PLAINLY [R-04]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433-D HAS NO MAP AND NO FILL ENGINE. So [M-07] and [M-08] examine ZERO bound stems and ZERO
// filled documents on the real tree, and that is REPORTED as zero rather than passed over — the
// construct landing before the map is the point, so that no binding is ever authored under an
// unproved one, but "there was nothing to check" and "it checked out" are different facts.
//
// What makes the zero survivable is the CANARY, which is not a formality here: it builds a
// synthetic one-sided binding and a synthetic disagreeing fill and requires both to STOP. Those
// two runs are the only evidence that [M-07] and [M-08] work at all, and they are the evidence
// the next prompt's bindings will rest on.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { build, mirrorPath, EXCLUSIONS } from './gen-mirror.mjs';
import { readWidgetGeometry } from './page-geometry.mjs';
import { walkTargets } from './verify-form-coverage.mjs';
import { examined } from './examined.mjs';

const argv = process.argv.slice(2);

/** Every form declaring a mirror. Derived from the maps directory — never listed here. */
export const MIRRORED_FORMS = () =>
  readdirSync('adapters/pdf/maps').filter((f) => f.endsWith('.mirror.json')).map((f) => f.replace('.mirror.json', '')).sort();

export const loadDeclaration = (form) => {
  const p = mirrorPath(form);
  if (!existsSync(p)) return { stop: `no mirror declaration at ${p}` };
  try { return { doc: JSON.parse(readFileSync(p, 'utf8')), path: p }; }
  catch (e) { return { stop: `${p} will not parse: ${e.message}. An unreadable declaration is not an absent one.` }; }
};

// ── [M-07] EVERY BOUND STEM IS BOUND TO BOTH COPIES ────────────────────────────────────────
//
// `targets` is the set of full field paths a map binds. The check is over STEMS: for each stem
// that appears in a declared pair, the map must bind BOTH of that pair's paths or NEITHER.
export const assertBindings = (decl, targets) => {
  const problems = [];
  const bound = new Set(targets);
  let examinedStems = 0;
  for (const pair of decl.pairs) {
    const a = pair[`page${decl.pages.a}`], b = pair[`page${decl.pages.b}`];
    const hasA = bound.has(a), hasB = bound.has(b);
    if (!hasA && !hasB) continue;         // unbound is legal; a map need not bind every cell
    examinedStems += 1;
    if (hasA && hasB) continue;
    const which = hasA ? decl.pages.a : decl.pages.b;
    const missing = hasA ? b : a;
    problems.push(`[M-07] ${decl.meta.form}: stem "${pair.stem}" is bound on page ${which} ONLY. The mirror declares it drawn on both copies, so a record filling it would produce an IRS copy and a taxpayer copy that disagree. Bind ${missing} as well, or bind neither.`);
  }
  return { problems, examinedStems };
};

// ── [M-08] BOTH COPIES HOLD THE SAME VALUE ─────────────────────────────────────────────────
//
// Read from the FILLED BYTES. `values` maps a full field path to the text or state actually in
// the document, which the caller obtains from the PDF and not from the fill engine's report.
export const assertValues = (decl, values) => {
  const problems = [];
  let examinedPairs = 0;
  for (const pair of decl.pairs) {
    const a = pair[`page${decl.pages.a}`], b = pair[`page${decl.pages.b}`];
    const hasA = Object.prototype.hasOwnProperty.call(values, a);
    const hasB = Object.prototype.hasOwnProperty.call(values, b);
    if (!hasA && !hasB) continue;
    examinedPairs += 1;
    if (!hasA || !hasB) { problems.push(`[M-08] ${decl.meta.form}: stem "${pair.stem}" carries a value on ${hasA ? a : b} and the other copy is not present in the filled document at all.`); continue; }
    // AN UNREADABLE COPY IS REPORTED AS UNREADABLE, not compared. Falling through to the equality
    // test would already be loud — two sentinels differ — but it would name the wrong defect, and
    // "these two copies disagree" is a different report from "one of them could not be read".
    if (isUnreadable(values[a]) || isUnreadable(values[b])) { problems.push(`[M-08] ${decl.meta.form}: stem "${pair.stem}" could not be READ on ${isUnreadable(values[a]) ? `page ${decl.pages.a}` : ''}${isUnreadable(values[a]) && isUnreadable(values[b]) ? ' and ' : ''}${isUnreadable(values[b]) ? `page ${decl.pages.b}` : ''} — ${[values[a], values[b]].filter(isUnreadable).join(' | ').trim()}. An unreadable copy is not an agreeing one.`); continue; }
    if (values[a] !== values[b]) problems.push(`[M-08] ${decl.meta.form}: stem "${pair.stem}" holds ${JSON.stringify(values[a])} on page ${decl.pages.a} and ${JSON.stringify(values[b])} on page ${decl.pages.b}. Both copies of one fact must carry one value.`);
  }
  return { problems, examinedPairs };
};

/**
 * The values actually in a filled PDF, keyed by full field path.
 *
 * AN UNREADABLE FIELD IS NOT AN EMPTY ONE, and here that distinction is load-bearing rather than
 * decorative. The first draft of this function was `try { out[n] = f.getText() ?? '' } catch {
 * out[n] = '' }`. Under it, two copies of one stem that BOTH failed to read would both become
 * `''`, compare EQUAL, and satisfy [M-08] — a guard reporting agreement because it could not
 * read either side. That is the shape of a guard that skips when it cannot read, pointed at the
 * one clause the mirror cannot do without.
 *
 * So a read that throws yields a SENTINEL carrying the field name, which can never equal another
 * field's sentinel and never equals a real value, and the caller reports it. Two unreadable
 * copies now produce a LOUD disagreement instead of a quiet match.
 */
export const UNREADABLE = (name, e) => `<<UNREADABLE>>:${name}:${e?.message ?? 'no message'}`;
export const isUnreadable = (v) => typeof v === 'string' && v.startsWith('<<UNREADABLE>>:');

export const readFilledValues = async (path) => {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(readFileSync(path), { updateMetadata: false });
  const out = {};
  for (const f of doc.getForm().getFields()) {
    const n = f.getName();
    if (typeof f.getText === 'function') { try { out[n] = f.getText() ?? ''; } catch (e) { out[n] = UNREADABLE(n, e); } }
    else if (typeof f.isChecked === 'function') { try { out[n] = f.isChecked() ? 'on' : 'off'; } catch (e) { out[n] = UNREADABLE(n, e); } }
  }
  return out;
};

// ── THE CANARY — BOTH STOP DIRECTIONS, PROVED ──────────────────────────────────────────────
//
// Neither plant touches the tree. Each builds a synthetic input against the REAL declaration —
// the same object the real bindings will be checked against — so what is proved is that these
// two functions refuse these two shapes, not that a copy of them does.
export const canary = () => {
  const problems = [];
  const forms = MIRRORED_FORMS();
  if (!forms.length) return ['CANARY DEAD  no form declares a mirror, so there is nothing to plant against. An empty canary is the failure it exists to catch.'];
  const { doc: decl, stop } = loadDeclaration(forms[0]);
  if (stop) return [`CANARY DEAD  ${stop}`];
  const pair = decl.pairs[0];
  const a = pair[`page${decl.pages.a}`], b = pair[`page${decl.pages.b}`];

  // DIRECTION ONE — a stem bound to only one copy must STOP.
  const oneSided = assertBindings(decl, [a]);
  if (!oneSided.problems.some((p) => p.startsWith('[M-07]'))) problems.push(`CANARY DEAD  a binding of "${pair.stem}" on page ${decl.pages.a} ONLY raised no [M-07]. The clause that a one-sided binding is a STOP is not being enforced, and it is the clause no exemption could have stated.`);
  const otherSide = assertBindings(decl, [b]);
  if (!otherSide.problems.some((p) => p.startsWith('[M-07]'))) problems.push(`CANARY DEAD  a binding of "${pair.stem}" on page ${decl.pages.b} ONLY raised no [M-07]. The clause fires in one direction and not the other, which is worse than not firing.`);
  const bothSides = assertBindings(decl, [a, b]);
  if (bothSides.problems.length) problems.push(`CANARY DEAD  a CONFORMING binding of "${pair.stem}" on both copies raised ${bothSides.problems.length} problem(s). A check that refuses the correct shape gets turned off.`);
  const neither = assertBindings(decl, []);
  if (neither.problems.length) problems.push('CANARY DEAD  binding NOTHING raised a problem. A map need not bind every cell; unbound is legal and only ONE-SIDED is not.');

  // DIRECTION TWO — two copies holding different values must STOP.
  const disagree = assertValues(decl, { [a]: 'Ada Lovelace', [b]: 'Ada Lovelacf' });
  if (!disagree.problems.some((p) => p.startsWith('[M-08]'))) problems.push(`CANARY DEAD  the two copies of "${pair.stem}" holding "Ada Lovelace" and "Ada Lovelacf" raised no [M-08]. A one-character difference between the IRS copy and the taxpayer copy is exactly the shape this clause exists for.`);
  const agree = assertValues(decl, { [a]: 'Ada Lovelace', [b]: 'Ada Lovelace' });
  if (agree.problems.length) problems.push(`CANARY DEAD  two copies holding the SAME value raised ${agree.problems.length} problem(s).`);
  const half = assertValues(decl, { [a]: 'Ada Lovelace' });
  if (!half.problems.some((p) => p.startsWith('[M-08]'))) problems.push(`CANARY DEAD  a filled document carrying "${pair.stem}" on one copy and not the other raised no [M-08].`);
  const bothUnreadable = assertValues(decl, { [a]: UNREADABLE(a, new Error('x')), [b]: UNREADABLE(b, new Error('x')) });
  if (!bothUnreadable.problems.some((p) => p.includes('could not be READ'))) problems.push('CANARY DEAD  two copies that BOTH failed to read raised no [M-08]. That is the shape the first draft of readFilledValues had: two unreadable copies both becoming the empty string, comparing equal, and satisfying the clause by having read neither.');
  const empty = assertValues(decl, {});
  if (empty.problems.length) problems.push('CANARY DEAD  an empty filled document raised a problem. Nothing filled is not a disagreement.');

  if (!problems.length) console.log(`  canary: 8 of 8 — one-sided binding STOPs in both directions, a conforming pair and an unbound pair do not; disagreeing values STOP, a one-sided value STOPs, agreeing or empty values do not, and two copies that both FAILED TO READ are reported as unreadable rather than as agreeing. Planted against "${pair.stem}" in the real ${forms[0]} declaration.`);
  return problems;
};

// ── THE EXCLUSION CLAUSES, PROVED SEPARATELY ───────────────────────────────────────────────
//
// [M-05] and [M-06] are what keep the exclusion list from becoming the exemption this whole
// construct was built to avoid, so they get their own plants rather than resting on the fact
// that the real declaration happens to pass. Each mutates the EXCLUSIONS table IN MEMORY,
// rebuilds, and restores — the file on disk is never touched, and the restore is verified.
export const canaryExclusions = async () => {
  const problems = [];
  const forms = MIRRORED_FORMS();
  if (!forms.length) return ['CANARY DEAD  no form declares a mirror.'];
  const form = forms[0];
  const original = EXCLUSIONS[form];
  const snapshot = JSON.stringify(original);
  const fired = async (label, mutate, clause) => {
    EXCLUSIONS[form] = mutate(JSON.parse(snapshot));
    const r = await build(form);
    EXCLUSIONS[form] = JSON.parse(snapshot);
    if (!r.problems.some((p) => p.startsWith(clause))) problems.push(`CANARY DEAD  ${label} raised no ${clause}. ${clause === '[M-05]' ? 'An exclusion nobody checks is an exemption.' : 'A widget in neither the pairs nor the exclusions would be silently outside the construct.'}`);
  };

  await fired('an exclusion naming a leaf stem the form does not draw', (e) => ({ ...e, __not_a_stem_on_this_form__: 'a stale exclusion' }), '[M-05]');
  await fired('an exclusion carrying an empty reason', (e) => ({ ...e, __not_a_stem_on_this_form__: '   ' }), '[M-05]');
  await fired('an exclusion over a stem that IS a real cross-page pair', (e) => ({ ...e, ...Object.fromEntries([[JSON.parse(readFileSync(mirrorPath(form), 'utf8')).pairs[0].stem, 'hiding a real pair behind a sentence']]) }), '[M-05]');
  await fired('the declared exclusion REMOVED, leaving a widget in neither the pairs nor the exclusions', () => ({}), '[M-06]');

  const restored = JSON.stringify(EXCLUSIONS[form]);
  if (restored !== snapshot) problems.push('CANARY LEFT DAMAGE  the EXCLUSIONS table was not restored to its original contents.');
  const after = await build(form);
  if (after.problems.length) problems.push(`CANARY DEAD  the CONFORMING declaration raised ${after.problems.length} problem(s) after the plants were restored: ${after.problems.join('; ')}`);

  if (!problems.length) console.log('  canary: 4 of 4 exclusion clauses — a stale exclusion, a reasonless one, one hiding a real pair, and a missing one are each refused; the conforming declaration is accepted after every plant is restored.');
  return problems;
};

// ── THE RUN ────────────────────────────────────────────────────────────────────────────────
export const report = async () => {
  const problems = [];
  const only = argv.find((a) => !a.startsWith('--'));
  const forms = only ? [only] : MIRRORED_FORMS();

  console.log(`mirror assertion: ${forms.length} form(s) declaring a mirror${only ? '' : ' — discovered from adapters/pdf/maps/*.mirror.json, never listed'}`);

  if (argv.includes('--canary')) { problems.push(...canary()); problems.push(...await canaryExclusions()); }

  for (const form of forms) {
    const { doc: decl, stop, path } = loadDeclaration(form);
    if (stop) { problems.push(`STOP  ${form}: ${stop}`); continue; }

    // THE DECLARATION IS RE-DERIVED FROM THE PAGE, not trusted. A mirror file that no longer
    // matches the PDF it describes is the stale-artefact class, and here it would be a stale
    // artefact standing between the duplicate-write guard and 83 double writes.
    const rebuilt = await build(form);
    if (rebuilt.problems.length) { for (const p of rebuilt.problems) problems.push(`  ${p}`); continue; }
    const same = JSON.stringify(rebuilt.doc.pairs) === JSON.stringify(decl.pairs)
      && JSON.stringify(rebuilt.doc.pages) === JSON.stringify(decl.pages)
      && JSON.stringify(rebuilt.doc.exclusions) === JSON.stringify(decl.exclusions);
    if (!same) problems.push(`[M-09] ${form}: ${path} does not match what the page produces now. Regenerate with \`node adapters/pdf/gen-mirror.mjs ${form}\` and read the difference before committing it.`);

    // ── [M-07] against the map, if there is one ────────────────────────────────────────────
    // THE TARGETS COME FROM walkTargets(), THE WALK THE GATE ITSELF USES, AND THE HAND-WRITTEN
    // WALK THIS REPLACES HAD NEVER FOUND ONE.
    //
    // It looked for `node.target === 'string'` — an object with a `target` KEY — and no map in
    // this repository has ever had that shape. A map binds `key -> "form1[0]..."` and
    // `slot.column -> "topmostSubform[0]..."`; there is no `target` property anywhere in any of
    // the six. So [M-07] extracted ZERO bound targets from every map it was ever pointed at, and
    // reported "0 bound stem(s) from 0 map target(s)" — which reads as "this form has no map
    // yet", the state 433-D really was in when the clause was written and the state that made
    // the zero look right.
    //
    // The clause it guards is the one the mirror construct exists for and the one no exemption
    // could have stated: A STEM BOUND TO ONLY ONE COPY IS A STOP. On a form binding 83 mirrored
    // pairs it was standing over nothing, and what held it up in the meantime was the canary —
    // eleven planted directions against the real declaration, which is why this was found by
    // reading a zero rather than by a filed document coming out half-blank.
    //
    // walkTargets() is imported rather than reimplemented, from adapters/pdf/verify-form-coverage
    // .mjs, so this clause and the gate's own coverage step address the same set: a second walk
    // is a second answer to the question the first one exists to have one answer to. It resolves
    // a target by the roots derived in adapters/pdf/target-root.mjs, which is what makes it work
    // on a form rooted at `form1[0].` as well as one rooted at `topmostSubform[0].`.
    const mapPath = `adapters/pdf/maps/${form}.map.json`;
    let boundTargets = null;
    if (existsSync(mapPath)) {
      const map = JSON.parse(readFileSync(mapPath, 'utf8'));
      boundTargets = walkTargets(map).map((t) => t.target);
      if (!boundTargets.length)
        problems.push(`[M-07] ${form}: ${mapPath} exists and walkTargets() extracted ZERO targets from it. A map that binds nothing would satisfy this clause vacuously, which is the state the hand-written walk this replaced was in on every form it ever ran against.`);
    }
    const b = boundTargets ? assertBindings(decl, boundTargets) : { problems: [], examinedStems: 0 };
    problems.push(...b.problems);

    // ── [M-08] against any filled document this form has produced ──────────────────────────
    const outDir = 'adapters/pdf/out';
    const filled = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.startsWith(`${form}_filled`) && f.endsWith('.pdf')) : [];
    let vExamined = 0;
    for (const f of filled) {
      const values = await readFilledValues(`${outDir}/${f}`);
      const v = assertValues(decl, values);
      vExamined += v.examinedPairs;
      problems.push(...v.problems.map((p) => `${p}  (in ${outDir}/${f})`));
    }

    console.log(`  ${form}: ${decl.counts.pairs} declared pair(s) across pages ${decl.pages.a} and ${decl.pages.b}; ${decl.counts.excluded_stems} declared exclusion(s); declaration re-derived from the page ${same ? 'and MATCHES' : 'and DIFFERS'}`);
    console.log(`    [M-07] bindings examined: ${b.examinedStems} bound stem(s)${boundTargets ? ` from ${boundTargets.length} map target(s)` : ' — NO MAP EXISTS for this form, so zero were examined. Zero examined is not a pass ([R-04]); the canary is what stands under this clause until a map does.'}`);
    console.log(`    [M-08] values examined:   ${vExamined} pair(s) across ${filled.length} filled document(s)${filled.length ? '' : ' — NO FILLED DOCUMENT exists for this form, so zero were examined. Same reading as above.'}`);
    examined('assert-mirror', form, decl.counts.pairs, 'declared-mirror-pairs');
  }

  if (problems.length) { console.error(''); for (const p of problems) console.error(`  ${p}`); return problems.length; }
  if (!problems.length) console.log(`OK — ${forms.length} declared mirror(s) re-derive from their pages, and every bound stem examined is bound to both copies with one value.`);
  return problems.length;
};

if (process.argv[1] && /assert-mirror\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  report().then((n) => process.exit(n ? 2 : 0)).catch((e) => { console.error(`assert-mirror STOPPED: ${e.message}`); process.exit(2); });
}
