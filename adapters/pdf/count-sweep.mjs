// THE COUNT SWEEP.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE META-RULE THIS FILE EXISTS TO ENFORCE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   WHEN A DEFECT CLASS EARNS A GUARD, THE SAME COMMIT ENUMERATES EVERY INSTANCE OF THAT
//   CLASS IN THE SAME ARTEFACT AND DISPOSES OF EACH. A guard applied only where the defect
//   was noticed is a guard that certifies its own blind spot.
//
// This file is the second time that rule was needed and the first time it was written down.
// The first time: validate-map.mjs built a check for a retyped count drifting from its own
// list, wrote the reason into the code in plain English — "this is exactly how 'eleven'
// survived three slices when the honest figure was ten" — and then left three more retyped
// counts in the same file, one key over, unguarded. One of them, `_partition`, was already
// self-contradicting when the guard shipped beside it.
//
// So: derived, or explicitly declared underivable with the reason. NO THIRD STATE. A count
// that is in neither list is a STOP, because "nobody has looked at it" and "it is fine" are
// indistinguishable from the outside, and that indistinguishability IS the defect.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// AND A GUARD THAT SKIPS WHEN IT CANNOT READ IS NOT A GUARD
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The `_unaccounted_by_page` check shipped as:
//
//     const nums = [...prose.matchAll(/\bp[1-8]\s+(\d+)/g)].map(m => Number(m[1]));
//     if (nums.length && tot !== part.unaccounted) problems.push(...)
//                ^^^^^^^^^^^^
//
// and its regex reached disk with the backslashes eaten — `/\bp[1-8]s+(d+)/` — so it matched
// nothing, `nums.length` was 0, and the `nums.length &&` turned a guard that could not read
// its input into a guard that reported success. The check was dead from the commit that
// introduced it and the gate printed PASS underneath it.
//
// Every extraction in this file therefore declares `atLeast`, and an extraction that returns
// fewer than `atLeast` values is a STOP with its own message. A claim the engine cannot READ
// is exactly as unchecked as a claim nobody wrote a check for, and it is reported the same way.

import { readFileSync, existsSync } from 'node:fs';
import { readWidgetGeometry, readPrintedText } from './page-geometry.mjs';
import { markerPairing } from './line-markers.mjs';
// Printed pages, read once per form and memoised: S-24 asks three questions of page 1 and
// re-inflating six pages of content streams for each of them is the same measurement thrice.
const _printedCache = new Map();
const printedPages = async (form) => {
  if (!_printedCache.has(form)) _printedCache.set(form, await readPrintedText(readFileSync(`adapters/pdf/forms/f${form}.pdf`)));
  return _printedCache.get(form);
};
import { classifyMapTargets, walkTargets } from './verify-form-coverage.mjs';
import { probeMoneyCells, declaredMoneyCells } from './money-probe.mjs';

// ---------------------------------------------------------------------------------------
// WHAT IS SWEPT.
//
// Per-form artefacts plus the two SHARED ones. The shared files are swept on EVERY form's
// run rather than once, deliberately: a count in asset-row-shapes.json that drifts is a
// defect for all three forms, and failing one gate out of three would leave two green gates
// standing over it.
export const sweptFiles = (form) => [
  `adapters/pdf/maps/${form}.map.json`,
  `adapters/pdf/maps/${form}.totals.json`,
  `adapters/pdf/maps/${form}.headings.json`,
  `adapters/pdf/maps/${form}.name-lies.json`,
  'adapters/pdf/maps/irs-standards-2026.json',
  'adapters/hubspot/asset-row-shapes.json',
  'adapters/hubspot/crosswalk.433f.json',
  `adapters/pdf/maps/${form}.crosswalk-classification.json`,
].filter(existsSync);

// ---------------------------------------------------------------------------------------
// WHAT COUNTS AS A CLAIM.
//
// A number is IN CLASS when it states the cardinality of something — how many entries, rows,
// cells, keys, slots, fields, pages, blocks, lies, questions. Digits and the written-out
// numbers alike, because "eleven" is how the original defect was spelled and a digits-only
// scanner would have walked straight past it.
//
// A coordinate, a dollar figure, a printed line marker and a revision date are NOT in class.
// They are transcriptions of the drawn page, verified by align-block.mjs, line-markers.mjs
// and verify-headings.mjs against the PDF itself — a different guard for a different defect.
// The discriminator is the NOUN, not the number: "y 668.1" names no countable set and
// "eleven entries" does.
const NOUNS = 'entr|field|cell|slot|row|key|block|target|widget|checkbox|lie|question|page|total|column|item|scalar|heading|line|name|account|box|tripwire|feeder|sentence|instance|property|table|marker|option|pair|note|section|control|witness';
const ONES = 'one|two|three|four|five|six|seven|eight|nine';
const TEENS = 'ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen';
const TENS = 'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety';
// COMPOUNDS FIRST in the alternation, or "twenty-five" is read as "twenty" and the check
// compares 20 against 25 - or, worse, matches and agrees for a band that happens to hold 20.
const WORD_NUM = `(?:${TENS})-(?:${ONES})|${TENS}|${TEENS}|zero|${ONES}`;
const CLAIM_A = new RegExp(String.raw`\b(\d+)\s+(?:of\s+)?(?:the\s+)?(?:more\s+)?(?:mapped\s+|declared\s+|printed\s+|money\s+|writable\s+|unique\s+|open\s+|active\s+|total\s+)?(?:${NOUNS})`, 'i');
const CLAIM_B = new RegExp(String.raw`\b(?:${WORD_NUM})\b\s+(?:of\s+)?(?:the\s+)?\w*\s*(?:${NOUNS})`, 'i');
/** True when this string states a number about a countable set. */
export const statesACount = (s) => typeof s === 'string' && (CLAIM_A.test(s) || CLAIM_B.test(s));

/**
 * EVERY SCALAR NUMBER IS A CLAIM SITE, and the manifest disposes of it.
 *
 * This started as a regex over the KEY — `_count$`, `_tally$`, `partition` — and that regex
 * silently missed `_partition.form_fields_total`, `_partition.bound_writable`,
 * `_carried._count.open` and every other scalar the whole sweep was built for. The sweep
 * reported OK over its own blind spot for one run, which is the defect this file names in its
 * header, committed by this file.
 *
 * So the default is inverted: a number is IN CLASS until a manifest entry says otherwise.
 * Under-detection is silent and over-detection is loud, and only one of those two failures
 * announces itself.
 */
export const claimsIn = (doc, forced = []) => {
  const out = [];
  (function walk(node, path, key) {
    if (typeof node === 'number') { out.push({ at: path, kind: 'scalar', value: node }); return; }
    if (typeof node === 'string') {
      // A string is a claim when it states a count, OR when a derivation is declared for its
      // path. The second clause exists because `_partition._unaccounted_by_page` reads
      // "p6 39, p7 50, p8 29 = 118." — every number in it is a count and NOT ONE of them sits
      // next to a countable noun, so the language test walked straight past the very site the
      // dead-regex guard was written for. A path the manifest names is a claim site whatever
      // its wording; the derivation declared for it must run or say why it cannot.
      if (statesACount(node) || forced.some(re => re.test(path))) out.push({ at: path, kind: 'prose', value: node });
      return;
    }
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`, key));
    if (node && typeof node === 'object') return Object.entries(node).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k, k));
  })(doc, '', null);
  return out;
};

// ---------------------------------------------------------------------------------------
// EXTRACTION. Read the numbers a piece of prose states, and STOP if they cannot be read.
//
// `atLeast` is not optional and it is not decoration. See the header: the one guard in this
// repo that shipped dead did so because its extraction returned nothing and the check treated
// nothing as agreement.
const pull = (text, re, atLeast, what) => {
  // Global or not: a non-global RegExp passed to matchAll throws, and a derivation that
  // throws is reported as UNREADABLE rather than as agreement — but the author's intent was
  // a single match, so read it as one instead of failing on the spelling.
  const ms = re.global ? [...String(text).matchAll(re)] : (() => { const m = re.exec(String(text)); return m ? [m] : []; })();
  if (ms.length < atLeast)
    return { fail: `could not READ ${what}: /${re.source}/ matched ${ms.length} time(s) in the prose, and at least ${atLeast} is required. A claim the engine cannot read is exactly as unchecked as one nobody wrote a check for.` };
  return { ms };
};
const NUM = String.raw`(\d+)`;
const n = (m, i = 1) => Number(m[i]);

const WORDS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
/**
 * Written-out numbers are read too, because "eleven" is how the original defect was spelled
 * and "twenty-five" is how the second one was. Returns undefined for anything unreadable, so
 * a caller comparing against it gets a visible mismatch rather than a silent NaN.
 */
const word = (str) => {
  const t = String(str).toLowerCase().trim();
  if (WORDS[t] !== undefined) return WORDS[t];
  const m = /^([a-z]+)-([a-z]+)$/.exec(t);
  if (m && WORDS[m[1]] !== undefined && WORDS[m[2]] !== undefined) return WORDS[m[1]] + WORDS[m[2]];
  return undefined;
};

// ---------------------------------------------------------------------------------------
// THE CONTEXT every derivation reads. Loaded once per form.
export const buildContext = async (form) => {
  const mapPath = `adapters/pdf/maps/${form}.map.json`;
  const mapDoc  = JSON.parse(readFileSync(mapPath, 'utf8'));
  const fieldsDoc = JSON.parse(readFileSync(mapDoc.fields_source || `adapters/pdf/maps/${form}.fields.json`, 'utf8'));
  const rd = (p) => existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  const totalsDoc   = rd(`adapters/pdf/maps/${form}.totals.json`);
  const headingsDoc = rd(`adapters/pdf/maps/${form}.headings.json`);
  const liesDoc     = rd(`adapters/pdf/maps/${form}.name-lies.json`);

  const names = new Set(fieldsDoc.fields.map(f => f.name));
  const uniqueTargets = new Set(walkTargets(mapDoc).map(t => t.target));
  const { deferred, never, writable } = classifyMapTargets(mapDoc);

  const { widgets } = await readWidgetGeometry(readFileSync(`adapters/pdf/forms/f${form}.pdf`));
  const pageOf = new Map(widgets.map(w => [w.name, w.page]));
  const widgetsByPage = new Map();
  for (const w of widgets) widgetsByPage.set(w.page, (widgetsByPage.get(w.page) || 0) + 1);

  const probe = await probeMoneyCells(form);
  const declaredMoney = await declaredMoneyCells(form);

  // Which pages this map has authored: the pages its bound targets actually sit on. DERIVED,
  // not declared — a map that claims page 6 while binding nothing on it would otherwise pass.
  const authoredPages = [...new Set([...uniqueTargets].map(t => pageOf.get(t)).filter(Boolean))].sort((a, b) => a - b);
  const unauthoredPages = [...widgetsByPage.keys()].filter(p => !authoredPages.includes(p)).sort((a, b) => a - b);

  return { form, mapPath, mapDoc, fieldsDoc, totalsDoc, headingsDoc, liesDoc, names, uniqueTargets,
    deferred, never, writable, widgets, pageOf, widgetsByPage, probe, declaredMoney, authoredPages, unauthoredPages };
};

// ---------------------------------------------------------------------------------------
// THE MANIFEST.
//
// One entry per claim SITE, addressed by the artefact and a pattern over its json path.
// `kind: 'derived'`     — `derive(ctx, value)` returns rows of { what, claimed, derived }.
//                         Any disagreement is a STOP; so is an extraction that cannot read.
// `kind: 'underivable'` — `reason` says why nothing in this repo can produce the figure.
//                         The reason is the deliverable: it is what a later author reads
//                         instead of assuming the count was checked.
//
// Family entries (a pattern matching many paths) are the underivable disposition stated once
// for a family whose members all fail for the same reason. Every member is still ENUMERATED
// in the report, so a family cannot hide a member that should have been derived.
const D = (o) => o;

export const MANIFEST = [

  // ═══ 433-A(OIC), 433-A and 433-F: the partition ══════════════════════════════════════
  D({ id: 'S-01', file: /\.map\.json$/, at: /^_partition\.(form_fields_total|in_this_slice|bound_writable|excluded_never_autofill|deferred|unaccounted)$/,
    kind: 'derived',
    derive: (ctx) => {
      const p = ctx.mapDoc._partition;
      const authored = ctx.authoredPages.reduce((a, pg) => a + ctx.widgetsByPage.get(pg), 0);
      const unaccounted = ctx.unauthoredPages.reduce((a, pg) => a + ctx.widgetsByPage.get(pg), 0);
      return [
        { what: '_partition.form_fields_total', claimed: p.form_fields_total, derived: ctx.names.size, from: 'fields file' },
        { what: '_partition.in_this_slice', claimed: p.in_this_slice, derived: ctx.uniqueTargets.size, from: 'unique targets the map references' },
        { what: '_partition.in_this_slice = widgets on the authored pages', claimed: p.in_this_slice, derived: authored, from: `pages ${ctx.authoredPages.join(', ')} by widget geometry` },
        { what: '_partition.bound_writable', claimed: p.bound_writable, derived: ctx.writable.size, from: 'classifyMapTargets' },
        { what: '_partition.excluded_never_autofill', claimed: p.excluded_never_autofill, derived: ctx.never.size, from: 'classifyMapTargets' },
        { what: '_partition.deferred', claimed: p.deferred, derived: ctx.deferred.size, from: 'classifyMapTargets' },
        { what: '_partition.unaccounted', claimed: p.unaccounted, derived: unaccounted, from: `pages ${ctx.unauthoredPages.join(', ') || '(none)'} by widget geometry` },
      ];
    } }),

  D({ id: 'S-01b', file: /\.map\.json$/, at: /^_partition\._backfilled$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const rows = [];
      let recognised = false, m;
      if ((m = new RegExp(String.raw`derived deferred count is (${WORD_NUM}|\d+)`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: '_backfilled: derived deferred count', claimed: word(m[1]) ?? Number(m[1]), derived: ctx.deferred.size, from: 'classifyMapTargets' });
      }
      if ((m = new RegExp(String.raw`(\d+) \+ (\d+) \+ (\d+) = (\d+)`).exec(v))) {
        recognised = true;
        rows.push({ what: '_backfilled: writable', claimed: Number(m[1]), derived: ctx.writable.size, from: 'classifyMapTargets' });
        rows.push({ what: '_backfilled: never-autofill', claimed: Number(m[2]), derived: ctx.never.size, from: 'classifyMapTargets' });
        rows.push({ what: '_backfilled: deferred', claimed: Number(m[3]), derived: ctx.deferred.size, from: 'classifyMapTargets' });
        rows.push({ what: '_backfilled: their sum', claimed: Number(m[4]), derived: ctx.names.size, from: 'fields file' });
      }
      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    },
    fallback: { kind: 'underivable', reason: 'A backfill note that states no figure of its own — only which prior prose it was compared against. The figures it compares are the partition scalars beside it, all derived by S-01.' } }),

  D({ id: 'S-02', file: /\.map\.json$/, at: /^_partition\._unaccounted_by_page$/,
    kind: 'derived',
    derive: (ctx, v) => {
      // A COMPLETE map has no unaccounted page, and the declaration still has to SAY so —
      // an absent breakdown and a breakdown that says zero are the same silence this repo
      // keeps finding. The prose must state 0 and must name no page.
      if (!ctx.unauthoredPages.length) {
        const z = pull(v, /\b0\b/, 1, '_partition._unaccounted_by_page zero statement');
        if (z.fail) return [{ what: '_unaccounted_by_page', fail: `${z.fail}\n      This map accounts for every page, so the breakdown must state 0 explicitly rather than being empty prose.` }];
        return [{ what: '_unaccounted_by_page: pages named', claimed: [...String(v).matchAll(/\bp([1-8])\s+\d+/g)].length, derived: 0, from: 'no page of this form is unauthored' }];
      }
      const r = pull(v, /\bp([1-8])\s+(\d+)/g, ctx.unauthoredPages.length, '_partition._unaccounted_by_page');
      if (r.fail) return [{ what: '_unaccounted_by_page', fail: r.fail }];
      const rows = r.ms.map(m => ({ what: `_unaccounted_by_page: page ${m[1]}`, claimed: Number(m[2]), derived: ctx.widgetsByPage.get(Number(m[1])) ?? 0, from: 'widget geometry' }));
      const tot = pull(v, /=\s*(\d+)/g, 1, '_unaccounted_by_page total');
      if (tot.fail) rows.push({ what: '_unaccounted_by_page total', fail: tot.fail });
      else rows.push({ what: '_unaccounted_by_page: stated total', claimed: n(tot.ms[0]), derived: ctx.unauthoredPages.reduce((a, pg) => a + ctx.widgetsByPage.get(pg), 0), from: 'widget geometry' });
      rows.push({ what: '_unaccounted_by_page: pages listed', claimed: r.ms.length, derived: ctx.unauthoredPages.length, from: 'pages with no bound target' });
      return rows;
    } }),

  D({ id: 'S-03', file: /\.map\.json$/, at: /^_partition\._check$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const rows = [];
      const p = ctx.mapDoc._partition;
      const per = pull(v, /(\d+)\s+(?:\w+\s+)?(?:for|on)\s+p(?:age\s*)?([1-8])/g, ctx.authoredPages.length, '_partition._check per-page figures');
      if (per.fail) rows.push({ what: '_check per-page', fail: per.fail });
      else for (const m of per.ms) rows.push({ what: `_check: page ${m[2]}`, claimed: n(m), derived: ctx.widgetsByPage.get(Number(m[2])) ?? 0, from: 'widget geometry' });
      const sum = pull(v, new RegExp(String.raw`${NUM}\s*\+\s*${NUM}\s*\+\s*${NUM}\s*=\s*${NUM}`), 1, '_partition._check partition sum');
      if (sum.fail) rows.push({ what: '_check partition sum', fail: sum.fail });
      else {
        const m = sum.ms[0];
        rows.push({ what: '_check: writable', claimed: n(m, 1), derived: ctx.writable.size, from: 'classifyMapTargets' });
        rows.push({ what: '_check: never-autofill', claimed: n(m, 2), derived: ctx.never.size, from: 'classifyMapTargets' });
        rows.push({ what: '_check: deferred', claimed: n(m, 3), derived: ctx.deferred.size, from: 'classifyMapTargets' });
        rows.push({ what: '_check: their sum', claimed: n(m, 4), derived: ctx.uniqueTargets.size, from: 'unique targets' });
      }
      const rem = pull(v, new RegExp(String.raw`${NUM}\s*-\s*${NUM}\s*=\s*${NUM}`), 1, '_partition._check remainder');
      if (rem.fail) rows.push({ what: '_check remainder', fail: rem.fail });
      else {
        const m = rem.ms[0];
        rows.push({ what: '_check: form total', claimed: n(m, 1), derived: ctx.names.size, from: 'fields file' });
        rows.push({ what: '_check: accounted', claimed: n(m, 2), derived: ctx.uniqueTargets.size, from: 'unique targets' });
        rows.push({ what: '_check: unaccounted', claimed: n(m, 3), derived: p.unaccounted, from: '_partition.unaccounted, itself derived by S-01' });
      }
      return rows;
    } }),

  D({ id: 'S-04', file: /\.map\.json$/, at: /^_partition\._bound_breakdown_page_(\d)$/,
    kind: 'derived',
    derive: (ctx, v, at) => {
      const page = Number(/page_(\d)$/.exec(at)[1]);
      // The breakdown is arithmetic in prose and it always ENDS in its own total. Read the
      // last "= N" and check it against the widgets the page actually draws.
      const r = pull(v, /=\s*(\d+)/g, 1, `_bound_breakdown_page_${page} final total`);
      if (r.fail) return [{ what: `_bound_breakdown_page_${page}`, fail: r.fail }];
      const last = r.ms[r.ms.length - 1];
      // A BOUND breakdown counts the cells the map binds, which is the page's widgets less
      // the never-autofill and deferred ones drawn on it. Page 1 draws 74 and binds 72: the
      // two Form 433-B link buttons are on it and are never written.
      const onPage = (set) => [...set].filter(t => ctx.pageOf.get(t) === page).length;
      const bound = (ctx.widgetsByPage.get(page) ?? 0) - onPage(ctx.never) - onPage(ctx.deferred);
      return [{ what: `_bound_breakdown_page_${page}: its own stated total`, claimed: n(last), derived: bound, from: `widgets on page ${page} less never-autofill and deferred there` }];
    } }),

  D({ id: 'S-05', file: /\.map\.json$/, at: /^_partition\._page_\d_has_no_/,
    kind: 'derived',
    derive: (ctx, v, at) => {
      // The key NAMES its own claim: "_page_5_has_no_never_autofill_and_no_deferred" asserts
      // zero of each on that page, "_page_6_has_no_deferred_and_one_never_autofill" asserts
      // zero deferred and one never-autofill. Read the claim out of the KEY, not out of the
      // prose — the key is the part a later author is least likely to leave stale, and a key
      // that says one thing while its prose says another now fails here.
      const page = Number(/_page_(\d)_/.exec(at)[1]);
      const onPage = (set) => [...set].filter(t => ctx.pageOf.get(t) === page).length;
      const claimIn = (what) => {
        const m = new RegExp(String.raw`(no|${WORD_NUM})_${what}`, 'i').exec(at);
        return m ? (m[1].toLowerCase() === 'no' ? 0 : (word(m[1]) ?? Number(m[1]))) : null;
      };
      const rows = [];
      const nev = claimIn('never_autofill'), def = claimIn('deferred');
      if (nev === null && def === null) return [{ what: at, fail: `the key names neither a never_autofill nor a deferred claim, so there is nothing to derive from it — rename it so the claim is in the key` }];
      if (nev !== null) rows.push({ what: `page ${page}: never-autofill`, claimed: nev, derived: onPage(ctx.never), from: 'classifyMapTargets, restricted to this page' });
      if (def !== null) rows.push({ what: `page ${page}: deferred`, claimed: def, derived: onPage(ctx.deferred), from: 'classifyMapTargets, restricted to this page' });
      const r = pull(v, new RegExp(String.raw`page \d(?:'s|\u2019s)? (\d+) fields`, 'i'), 1, `_page_${page} field count`);
      if (r.fail) rows.push({ what: `page ${page} field count`, fail: r.fail });
      else rows.push({ what: `page ${page}: field count`, claimed: n(r.ms[0]), derived: ctx.widgetsByPage.get(page) ?? 0, from: 'widget geometry' });
      return rows;
    } }),

  D({ id: 'S-07b', file: /\.map\.json$/, at: /^_carried\._every_arguable_item_now_has_an_id_here$/,
    kind: 'derived',
    derive: (ctx, v) => {
      // THE LINKAGE, ASSERTED. An arguable item recorded only in a per-page array is an open
      // question nothing counts and nothing reports — which is the disappearing act _carried
      // exists to prevent, committed by the file that prevents it. Every _arguable_page{N}
      // item must be NAMED by some entry in the ledger.
      const rows = [];
      const ents = [...(ctx.mapDoc._carried?.open || []), ...(ctx.mapDoc._carried?.resolved || [])];
      const blob = JSON.stringify(ents);
      let seen = 0;
      for (const [k, arr] of Object.entries(ctx.mapDoc)) {
        if (!/^_arguable_page\d+$/.test(k) || !Array.isArray(arr)) continue;
        for (const item of arr) {
          seen++;
          rows.push({ what: `${k}: ${item.id} is named by a _carried entry`, claimed: true, derived: blob.includes(item.id), from: '_carried.open[] and _carried.resolved[]' });
        }
      }
      const r = pull(v, new RegExp(String.raw`P5-1 through P5-4[\s\S]*?only (${WORD_NUM}|\d+) of the (${WORD_NUM}|\d+)`), 1, 'the P5 linkage figures');
      if (r.fail) rows.push({ what: 'the P5 figures', fail: r.fail });
      else {
        const p5 = (ctx.mapDoc._arguable_page5 || []).length;
        rows.push({ what: 'arguable items raised on page 5', claimed: word(r.ms[0][2]) ?? Number(r.ms[0][2]), derived: p5, from: '_arguable_page5[]' });
      }
      rows.push({ what: 'arguable items in total, across every page', claimed: seen, derived: Object.entries(ctx.mapDoc).filter(([k, a]) => /^_arguable_page\d+$/.test(k) && Array.isArray(a)).reduce((a, [, arr]) => a + arr.length, 0), from: 'every _arguable_page{N} array' });
      return rows;
    } }),

  D({ id: 'S-06', file: /\.map\.json$/, at: /^_partition\._why$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const r = pull(v, /(\d+)\s+silently unreferenced fields/, 1, '_partition._why 433-F figure');
      if (r.fail) return [{ unrecognised: true }];
      // A HISTORICAL figure about a form this repo still holds — so it IS derivable, from the
      // 433-F map as it stood at the defect. It is checked against nothing today because the
      // defect is fixed; what is checked is that the number is not larger than 433-F's whole
      // field count, which is the only thing about it that can still become false.
      const f = JSON.parse(readFileSync('adapters/pdf/maps/433f.fields.json', 'utf8')).fields.length;
      const claimed = n(r.ms[0]);
      return [{ what: '_partition._why: 433-F unreferenced-at-the-time figure is within 433-F', claimed: claimed <= f, derived: true, from: `433-F has ${f} fields; the figure is ${claimed}` }];
    },
    fallback: { kind: 'underivable', reason: 'The rationale for declaring a partition at all. Only 433-A(OIC)\u2019s instance states a figure \u2014 the 63 fields 433-F accumulated silently unreferenced before the declaration existed \u2014 and that figure is about a PAST state of a map that has since been closed, so nothing in the present tree reproduces it. What is derived where it appears is the only thing about it that can still become false: that it is not larger than 433-F\u2019s whole field count.' } }),

  // ═══ the carried-questions ledger ════════════════════════════════════════════════════
  D({ id: 'S-07', file: /\.map\.json$/, at: /^_carried\._count\.(open|resolved)$/,
    kind: 'derived',
    derive: (ctx) => {
      const c = ctx.mapDoc._carried;
      return [
        { what: '_carried._count.open', claimed: c._count?.open, derived: (c.open || []).length, from: '_carried.open[]' },
        { what: '_carried._count.resolved', claimed: c._count?.resolved, derived: (c.resolved || []).length, from: '_carried.resolved[]' },
      ];
    } }),

  // ═══ the money accounting — ruling 3 ═════════════════════════════════════════════════
  D({ id: 'S-08', file: /\.map\.json$/, at: /^rounding\._how_the_money_lists_were_built$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const rows = [];
      const probed = [...ctx.probe.byPage].sort((a, b) => a[0] - b[0]);
      const decl   = [...ctx.declaredMoney.byPage].sort((a, b) => a[0] - b[0]);
      // "It finds 0 money cells on page 1, 27 on page 2, 24 on page 3, 18 on page 4 and 30 on page 5 — 99 in all."
      // The prose states the PROBE figures, then "in all", then the DECLARED figures. Each
      // half is scanned for its own list: one regex over the whole string read the second
      // list as part of the first and reported a mismatch that was not there.
      const halves = String(v).split(/in all\./);
      if (halves.length !== 2) rows.push({ what: 'money accounting prose shape', fail: 'the prose must state the probe figures, then "in all.", then the declared figures — the split marker was not found exactly once' });
      const [probeHalf, declHalf] = halves.length === 2 ? halves : ['', ''];
      const pr = pull(probeHalf, /(\d+)\s+(?:money cells\s+)?on page (\d)/g, probed.length, 'the probe figures');
      if (pr.fail) rows.push({ what: 'probe per page', fail: pr.fail });
      else for (const m of pr.ms) rows.push({ what: `money probe: page ${m[2]}`, claimed: n(m), derived: ctx.probe.byPage.get(Number(m[2]))?.money ?? 0, from: 'money-probe.mjs' });
      const prTot = pull(probeHalf, /—\s*(\d+)\s*$/, 1, 'the probe total');
      if (prTot.fail) rows.push({ what: 'probe total', fail: prTot.fail });
      else rows.push({ what: 'money probe: total', claimed: n(prTot.ms[0]), derived: ctx.probe.total.money, from: 'money-probe.mjs' });
      // "This declaration holds 104 money cells ...: 27 on page 2, 27 on page 3, 18 on page 4 and 32 on page 5."
      const dTot = pull(declHalf, /holds (\d+) money cells/, 1, 'the declared total');
      if (dTot.fail) rows.push({ what: 'declared total', fail: dTot.fail });
      else rows.push({ what: 'rounding declaration: total money cells', claimed: n(dTot.ms[0]), derived: ctx.declaredMoney.total, from: 'rounding.blocks, columns expanded across slots' });
      const dPer = pull(declHalf, /(\d+)\s+on page (\d)/g, decl.length, 'the declared per-page figures');
      if (dPer.fail) rows.push({ what: 'declared per page', fail: dPer.fail });
      else for (const m of dPer.ms) rows.push({ what: `rounding declaration: page ${m[2]}`, claimed: n(m), derived: ctx.declaredMoney.byPage.get(Number(m[2])) ?? 0, from: 'rounding.blocks' });
      // THE DIRECTION MATTERS. Declared may exceed probed (a money cell with no printed "$",
      // named in its block). Probed exceeding declared would be a money cell the form draws a
      // "$" against and the map does not govern — a silent unrounded cell. That is a STOP.
      for (const [pg, c] of probed) {
        const d = ctx.declaredMoney.byPage.get(pg) ?? 0;
        rows.push({ what: `page ${pg}: declared >= probed`, claimed: true, derived: d >= c.money, from: `declared ${d}, probed ${c.money}` });
      }
      // "27 - 24 = 3 and 32 - 30 = 2, and 3 + 2 = 5 cells enumerated."
      const diffs = pull(declHalf, new RegExp(String.raw`${NUM}\s*-\s*${NUM}\s*=\s*${NUM}`, 'g'), 1, 'the declared-minus-probed differences');
      if (diffs.fail) rows.push({ what: 'declared-minus-probed differences', fail: diffs.fail });
      else for (const m of diffs.ms) rows.push({ what: `difference ${m[1]} - ${m[2]}`, claimed: n(m, 3), derived: n(m, 1) - n(m, 2), from: 'arithmetic stated in the prose itself' });
      const named = pull(declHalf, new RegExp(String.raw`${NUM}\s*\+\s*${NUM}\s*=\s*${NUM}\s*cells enumerated`), 1, 'the enumerated-difference total');
      if (named.fail) rows.push({ what: 'enumerated differences', fail: named.fail });
      else {
        const m = named.ms[0];
        rows.push({ what: 'cells enumerated in _money_without_a_printed_dollar_sign', claimed: n(m, 3), derived: ctx.declaredMoney.total - ctx.probe.total.money, from: 'declared total minus probe total' });
        rows.push({ what: 'and that total is the sum of the per-page differences', claimed: n(m, 3), derived: n(m, 1) + n(m, 2), from: 'arithmetic stated in the prose itself' });
      }
      return rows;
    } }),

  D({ id: 'S-09', file: /\.map\.json$/, at: /^rounding\._slice$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const r = pull(v, /flags (\d+) of its (\d+) mapped text cells/, 1, 'the page-1 probe figures');
      if (r.fail) return [{ what: 'rounding._slice page-1 probe', fail: r.fail }];
      const m = r.ms[0];
      return [
        { what: 'rounding._slice: page 1 money cells', claimed: n(m, 1), derived: ctx.probe.byPage.get(1)?.money ?? 0, from: 'money-probe.mjs' },
        { what: 'rounding._slice: page 1 mapped text cells', claimed: n(m, 2), derived: ctx.probe.byPage.get(1)?.seen ?? 0, from: 'money-probe.mjs' },
      ];
    } }),

  D({ id: 'S-10', file: /\.map\.json$/, at: /^rounding\._why_per_block_and_not_per_form$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const r = pull(v, new RegExp(String.raw`prints (${WORD_NUM}|\d+) across pages ([\d,\s and]+)`, 'i'), 1, 'the count of printed rounding sentences');
      if (r.fail) return [{ what: 'rounding._why_per_block: sentence count', fail: r.fail }];
      const claimed = word(r.ms[0][1]) ?? Number(r.ms[0][1]);
      const claimedPages = [...r.ms[0][2].matchAll(/\d/g)].map(x => Number(x[0]));
      return [
        { what: 'printed rounding sentences: how many', claimed, derived: ctx.printedRounding?.length ?? null, from: 'every printed run matching /round to the nearest/i' },
        { what: 'printed rounding sentences: which pages', claimed: claimedPages.join(','), derived: [...new Set((ctx.printedRounding || []).map(s => s.page))].sort((a, b) => a - b).join(','), from: 'page-geometry.mjs' },
      ];
    } }),

  D({ id: 'S-10b', file: /\.map\.json$/, at: /^rounding\._can_the_page_3_omission_be_read$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const r = pull(v, new RegExp(String.raw`the sentence appears (${WORD_NUM}|\d+) times on this form`, 'i'), 1, 'the count of printed rounding sentences in the page-3 omission finding');
      if (r.fail) return [{ what: 'page-3 omission: sentence count', fail: r.fail }];
      return [{ what: 'printed rounding sentences on this form', claimed: word(r.ms[0][1]) ?? Number(r.ms[0][1]), derived: ctx.printedRounding.length, from: 'every printed run matching /round to the nearest/i' }];
    } }),

  // ═══ the name-lie registry ═══════════════════════════════════════════════════════════
  D({ id: 'S-11', file: /\.name-lies\.json$/, at: /^_tally\./,
    kind: 'derived',
    derive: (ctx) => {
      const e = ctx.liesDoc.entries || [], t = ctx.liesDoc._tally || {};
      const COUNTED = new Set(['lie', 'container']);
      const k = (kind) => e.filter(x => x.kind === kind).length;
      const derived = {
        active_lies: e.filter(x => COUNTED.has(x.kind)).length,
        of_which_leaf: k('lie'), of_which_container: k('container'),
        inherited_not_counted: k('inherited'), controls_verified_true: k('control'),
        page_imprecise_not_counted: k('page_imprecise'), total_entries: e.length,
        // These two were DECLARED and never derived. validate-map.mjs printed `bound_today`
        // straight out of the file — a retyped count, read back and reported as a result.
        bound_today: e.filter(x => x.bound_to !== null && x.bound_to !== undefined).length,
        // RENAMED IN SLICE 7, BECAUSE THE OLD KEY NAME STATED A REASON THE DERIVATION NEVER
        // TESTED. It was `unbound_because_the_page_is_unauthored`, and it was true of the one
        // entry that had ever been unbound — L14, recorded against page 7 while page 7 was
        // unauthored. Slice 7 bound L14 and added C08, a control on Date_Signed_1[0] which is
        // unbound because it is DECLARED NEVER AUTO-FILLED, and the count went on calling that
        // an unauthored page. The filter tests `bound_to == null`; the key now says that and
        // nothing more, and each entry carries its own reason in `not_bound_because`.
        unbound: e.filter(x => (x.bound_to === null || x.bound_to === undefined) && x.kind !== 'container').length,
      };
      const rows = Object.entries(derived).map(([kk, v]) => ({ what: `_tally.${kk}`, claimed: t[kk], derived: v, from: 'entries[] by length' }));
      // Every declared _tally key must be one this engine derives. A key nobody derives is a
      // count with no check, which is the state this whole file exists to make impossible.
      for (const kk of Object.keys(t)) {
        if (kk.startsWith('_')) continue;
        if (!(kk in derived)) rows.push({ what: `_tally.${kk}`, fail: `_tally declares "${kk}", which no derivation in count-sweep.mjs produces. Derive it or move it under a "_"-prefixed prose key — a numeric key in _tally reads as a checked figure.` });
      }
      return rows;
    } }),

  D({ id: 'S-12', file: /\.name-lies\.json$/, at: /^_counting$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const r = pull(v, new RegExp(String.raw`\b(${WORD_NUM}|\d+)\s+ACTIVE LIES`, 'i'), 1, 'the active-lie count in _counting');
      if (r.fail) return [{ what: '_counting active lies', fail: r.fail }];
      const e = ctx.liesDoc.entries || [];
      return [{ what: '_counting: active lies', claimed: word(r.ms[0][1]) ?? Number(r.ms[0][1]), derived: e.filter(x => x.kind === 'lie' || x.kind === 'container').length, from: 'entries[] by kind' }];
    } }),

  D({ id: 'S-13', file: /\.name-lies\.json$/, at: /^_the_standing_rule_this_file_exists_to_defend$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const r = pull(v, new RegExp(String.raw`(${WORD_NUM}|\d+) cells across (${WORD_NUM}|\d+) pages sit under an identical printed .X \.8`, 'i'), 1, 'the quick-sale control figures');
      if (r.fail) return [{ what: 'standing rule: quick-sale figures', fail: r.fail }];
      const q = quickSaleCells(ctx);
      const r2 = pull(v, new RegExp(String.raw`(${WORD_NUM}|\d+) are named Times_8 / times_8, and (${WORD_NUM}|\d+) is named Times_7`, 'i'), 1, 'the Times_8 / Times_7 split');
      const rows = [
        { what: 'standing rule: quick-sale cells', claimed: word(r.ms[0][1]) ?? Number(r.ms[0][1]), derived: q.cells.length, from: 'totals entries whose id ends QSV' },
        { what: 'standing rule: pages they sit on', claimed: word(r.ms[0][2]) ?? Number(r.ms[0][2]), derived: q.pages.length, from: 'widget geometry of those cells' },
      ];
      if (r2.fail) rows.push({ what: 'standing rule: Times_8 / Times_7 split', fail: r2.fail });
      else rows.push(
        { what: 'standing rule: named Times_8 / times_8', claimed: word(r2.ms[0][1]) ?? Number(r2.ms[0][1]), derived: q.times8, from: 'leaf names of those cells' },
        { what: 'standing rule: named Times_7', claimed: word(r2.ms[0][2]) ?? Number(r2.ms[0][2]), derived: q.times7, from: 'leaf names of those cells' });
      return rows;
    } }),

  D({ id: 'S-13b', file: /\.name-lies\.json$/, at: /^entries\[\d+\]\./,
    kind: 'derived',
    derive: (ctx, v) => {
      const rows = [];
      let recognised = false, m;
      if ((m = new RegExp(String.raw`This form enumerates (${WORD_NUM}|\d+) cells under an identical printed "X \.8 = \$"`, 'i').exec(v))) {
        recognised = true;
        const q = quickSaleCells(ctx);
        rows.push({ what: 'cells under a printed "X .8 = $"', claimed: word(m[1]) ?? Number(m[1]), derived: q.cells.length, from: 'totals[] entries whose line ends QSV' });
        const m2 = new RegExp(String.raw`(${WORD_NUM}|\d+) are named eight\. (${WORD_NUM}|\d+) is named seven\.`, 'i').exec(v);
        if (!m2) rows.push({ what: 'the eight/one split', fail: 'the witness states a total but the eight-versus-one split could not be read out of it' });
        else {
          rows.push({ what: 'named Times_8 / times_8', claimed: word(m2[1]) ?? Number(m2[1]), derived: q.times8, from: 'leaf names' });
          rows.push({ what: 'named Times_7', claimed: word(m2[2]) ?? Number(m2[2]), derived: q.times7, from: 'leaf names' });
        }
      }
      if ((m = new RegExp(String.raw`3a_retirement_accounts declares max (\d+)`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: '3a_retirement_accounts.max', claimed: Number(m[1]), derived: ctx.mapDoc.groups?.['3a_retirement_accounts']?.max, from: 'groups.3a_retirement_accounts.max' });
      }
      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    },
    fallback: {
      kind: 'underivable',
      reason: 'A registry entry\u2019s PRINTED EVIDENCE: the rectangle the widget occupies, the y the printed caption is drawn at, the printed line marker, and the witnesses that settled the reading. validate-map.mjs states in its own header why these are deliberately NOT asserted \u2014 re-deriving them out of the PDF to compare against a transcription of the same read is circular, and it is why the entries quote coordinates verbatim so a person can re-measure them with align-block.mjs. The two things about an entry that ARE checkable are checked there: the path exists verbatim in the field list, and every declared `bound_to` resolves through the map to exactly that path.',
    } }),

  D({ id: 'S-13c', file: /\.name-lies\.json$/, at: /^(_what_this_file_is|_why_a_file_and_not_twelve_paragraphs|_what_is_machine_checked_and_what_is_not|_kinds\.|form|form_revision|catalog)/,
    kind: 'underivable',
    reason: 'The registry\u2019s own preamble. Its numbers are references to the checks that run elsewhere ("validate-map.mjs asserts every path", "twelve paragraphs") and to forms not yet mapped (433-B(OIC)). The one number in it that counts this file \u2014 the active-lie total \u2014 lives in `_counting` and `_tally` and is derived by S-11 and S-12.' }),

  // ═══ the totals declaration ══════════════════════════════════════════════════════════
  D({ id: 'S-14', file: /\.totals\.json$/, at: /^_notes\[\d+\]$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const T = ctx.totalsDoc?.totals || [];
      const rows = [];
      // Only the notes that state a count about THIS FILE are derived; the manifest reaches
      // every _notes entry and each derivation below fires on the note it recognises. A note
      // that states a count and matches none of them falls through to the unrecognised check
      // at the bottom, which is a STOP.
      let recognised = false;
      let m;
      if ((m = new RegExp(String.raw`(${WORD_NUM}|\d+) entries below address a single printed ROW via .total_cell. with a row index`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: 'per-row totals entries', claimed: word(m[1]) ?? Number(m[1]), derived: T.filter(e => e.total_cell && typeof e.total_cell.row === 'number').length, from: 'totals[] with total_cell.row' });
      }
      // THE LIVE CLAIM IS THE FIRST COUNT IN THE NOTE. A note may quote a SUPERSEDED figure
      // verbatim — the corrected floor note quotes its own wrong predecessor, deliberately,
      // so the reason it was wrong survives — and a regex that scanned the whole string would
      // read the quoted figure as the claim. The convention is mechanical: a note states its
      // own count first, and anything it quotes comes after. `exec` takes the first match.
      if ((m = new RegExp(String.raw`(${WORD_NUM}|\d+) lines declare it`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: 'lines declaring a floor', claimed: word(m[1]) ?? Number(m[1]), derived: T.filter(e => e.floor !== undefined && e.floor !== null).length, from: 'totals[] with a floor' });
      }
      if ((m = new RegExp(String.raw`(${WORD_NUM}|\d+) QUICK-SALE TRIPWIRES NOW, ACROSS (${WORD_NUM}|\d+) PAGES`, 'i').exec(v))) {
        recognised = true;
        const q = quickSaleCells(ctx);
        rows.push({ what: 'quick-sale tripwires', claimed: word(m[1]) ?? Number(m[1]), derived: q.cells.length, from: 'totals[] entries whose line ends QSV' });
        rows.push({ what: 'pages they sit on', claimed: word(m[2]) ?? Number(m[2]), derived: q.pages.length, from: 'widget geometry of those cells' });
      }
      if ((m = new RegExp(String.raw`(${WORD_NUM}|\d+) of the (${WORD_NUM}|\d+) leaf names happen to say times_8 or Times_8`, 'i').exec(v))) {
        recognised = true;
        const q = quickSaleCells(ctx);
        rows.push({ what: 'quick-sale leaf names saying Times_8', claimed: word(m[1]) ?? Number(m[1]), derived: q.times8, from: 'leaf names' });
        rows.push({ what: 'quick-sale cells in total', claimed: word(m[2]) ?? Number(m[2]), derived: q.cells.length, from: 'totals[]' });
      }
      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    },
    // A totals note that states a count and matches no derivation above is not silently
    // waved through: it falls to this reason, which is only honest for notes whose numbers
    // describe the PRINTED FORM rather than this file's own lists.
    fallback: {
      kind: 'underivable',
      reason: 'A totals note whose numbers describe the PRINTED FORM — how many operands a printed caption names, which printed lines a printed instruction covers, what a printed row draws. Those are transcriptions of the page, re-measured by line-markers.mjs and align-block.mjs against the PDF, not counts of anything this file holds. Every note that DOES state a count about this file (per-row entries, floors, quick-sale tripwires, the Times_8 split) is derived above and a note that states one and is not recognised is reported as unrecognised, not as underivable.',
    } }),

  // ═══ 433-B(OIC) slice 1: the printed structure recorded before any binding ═══════════
  //
  // Page 1 of 433-B(OIC) draws no numbered line marker, so every binding on it rests on
  // caption geometry. The map records that condition in prose, and the prose states counts —
  // how many markers the form draws, how many are on page 1, how many runs form the section
  // heading, how many eligibility bullets carry no widget. Each of those is a fact about the
  // DRAWN PAGE and each is therefore re-measurable, so each is DERIVED rather than excused as
  // a transcription. The bullet claim in particular is load-bearing: it is the reason no
  // entity-type field set is mapped, and a later revision that added widgets on those rows
  // would make the map silently incomplete.
  D({ id: 'S-24', file: /433boi\.map\.json$/,
    at: /^(_the_condition_that_governs_page_1\.no_printed_line_markers|_printed_headings_and_markers_first\.(section_heading\.continues|_the_four_bullets_are_PRINTED_PROSE_AND_NOT_A_FIELD_SET))$/,
    kind: 'derived',
    derive: async (ctx, v) => {
      const rows = [];
      let recognised = false, m;

      // "adapters/pdf/line-markers.mjs finds 44 markers on this form and none of them on page 1
      //  (p1=0, p2=10, p3=9, p4=22, p5=3, p6=0)"
      if (/finds (\d+) markers? on this form/.test(v)) {
        recognised = true;
        const { rows: mk } = await markerPairing('433boi');
        m = /finds (\d+) markers? on this form/.exec(v);
        rows.push({ what: 'markers drawn on 433-B(OIC)', claimed: Number(m[1]), derived: mk.length, from: 'line-markers.mjs markerPairing' });
        for (const pm of v.matchAll(/p([1-6])=(\d+)/g))
          rows.push({ what: `markers drawn on page ${pm[1]}`, claimed: Number(pm[2]), derived: mk.filter((r) => r.page === Number(pm[1])).length, from: 'line-markers.mjs markerPairing' });
      }

      // "three separately drawn runs on one baseline forming one heading" — the Section 1 banner
      if ((m = new RegExp(String.raw`(${WORD_NUM}|\d+) separately drawn runs on one baseline`, 'i').exec(v))) {
        recognised = true;
        const pages = await printedPages('433boi');
        const n = (pages[0].items || []).filter((t) => Math.abs(t.y2 - 620.9) < 0.6).length;
        rows.push({ what: 'runs drawn on the Section 1 heading baseline y 620.9', claimed: word(m[1]) ?? Number(m[1]), derived: n, from: 'page-geometry readPrintedText, page 1' });
      }

      // "All four bullets are drawn glyphs, and page 1's five checkboxes are at ... none within
      //  240pt of these lines."
      if (/bullets are drawn glyphs/.test(v)) {
        recognised = true;
        const pages = await printedPages('433boi');
        const bullets = (pages[0].items || []).filter((t) => t.str.trim() === '●' && (Math.abs(t.y2 - 696.9) < 0.6 || Math.abs(t.y2 - 682.5) < 0.6));
        if ((m = new RegExp(String.raw`All (${WORD_NUM}|\d+) bullets are drawn glyphs`, 'i').exec(v)))
          rows.push({ what: 'eligibility bullets drawn on page 1', claimed: word(m[1]) ?? Number(m[1]), derived: bullets.length, from: 'page-geometry readPrintedText, page 1, the two bullet baselines' });
        if ((m = new RegExp(String.raw`page 1's (${WORD_NUM}|\d+) checkboxes`, 'i').exec(v))) {
          const { widgets } = await readWidgetGeometry(readFileSync('adapters/pdf/forms/f433boi.pdf'));
          const cb = widgets.filter((w) => w.page === 1 && w.type === 'PDFCheckBox');
          rows.push({ what: 'checkboxes on page 1', claimed: word(m[1]) ?? Number(m[1]), derived: cb.length, from: 'widget geometry' });
          // THE CLAIM THAT MATTERS: no widget of any kind sits on the bullet rows.
          const onBullets = widgets.filter((w) => w.page === 1 && w.rect && w.rect[3] > 670 && w.rect[1] < 710).length;
          rows.push({ what: 'widgets of any type on the eligibility-bullet rows (y 670..710)', claimed: 0, derived: onBullets, from: 'widget geometry — the reason no entity-type field set is mapped' });
        }
      }

      // "Every one of this page's 43 fields", "all 43 widgets are accounted for" and friends.
      if ((m = /(\d+) widgets are accounted for|this page's (\d+) fields/.exec(v))) {
        recognised = true;
        rows.push({ what: 'fields on page 1', claimed: Number(m[1] ?? m[2]), derived: ctx.widgetsByPage.get(1), from: 'widget geometry' });
      }

      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    } }),

  // The rest of 433-B(OIC) slice 1's structural prose, and the evidence blocks under it.
  //
  // These state COORDINATES, not counts: the verbatim text of a drawn run and the y and x of
  // its baseline. "y 620.9, x 36.0..80.5" holds three numbers and none of them counts anything
  // this map contains. Re-deriving them here would be adapters/pdf/page-geometry.mjs measuring
  // the page and then comparing the answer with itself, which is the second-implementation
  // failure guard-sweep's (c) register exists to name.
  //
  // What makes them checkable is not counting. Every coordinate that JUSTIFIES A BINDING is in
  // _map_evidence, and three of those bindings are the correlate-labels.mjs probes for this
  // form — including the two that discriminate against a leaf name and against an 18pt-adjacent
  // total. Those probes are a STOP: the tool writes no label file at all until they pass.

  // ═══ 433-B(OIC) slice 2, pages 2 and 3 ═══════════════════════════════════════════════
  //
  // [S-29] AND [S-30] ARE DERIVED BECAUSE THEY CAN BE. Both are counts over artefacts this
  // repo holds - the widget geometry and the enumerated field list - rather than over a drawn
  // caption, so declaring them underivable would be declining a derivation that is available.
  // [S-31] is the structural transcription and takes [S-27]'s disposition for [S-27]'s reason.

  D({ id: 'S-29', file: /433boi\.map\.json$/,
    at: /^(_the_condition_that_governs_pages_2_and_3\.no_widget_on_these_pages_declares_a_MaxLen$|_arguable_pages_2_and_3\[0\]\.(subject|the_evidence)$)/,
    kind: 'derived',
    derive: (ctx, v) => {
      const str = String(v);
      // Both halves of the claim, DERIVED FROM THE WIDGET GEOMETRY: how many widgets are on
      // pages 2 and 3, and how many of them declare a /MaxLen. `maxLen` is null when the field
      // declares none, which is the distinction the claim is about.
      const on23 = ctx.widgets.filter((w) => w.page === 2 || w.page === 3);
      const withMax = on23.filter((w) => w.maxLen !== null && w.maxLen !== undefined).length;
      const rows = [];
      const N = `(?:${WORD_NUM}|\\d+)`;
      const num = (t) => word(t) ?? Number(t);
      const all = (re, what, derived, from) => {
        let hit = false;
        for (const m of str.matchAll(new RegExp(re, 'gi'))) { hit = true; rows.push({ what, claimed: num(m[1]), derived, from }); }
        return hit;
      };
      let recognised = false;
      // "0 of the 130 fields on pages 2 and 3 carries /MaxLen"
      recognised = all(String.raw`(?<!\bnot\s)(${N})\s+of\s+the\s+${N}\s+fields\s+on\s+pages\s+2\s+and\s+3`, 'widgets on pages 2 and 3 that declare a /MaxLen', withMax, 'the widget geometry: every widget on pages 2 and 3 whose field reports a non-null /MaxLen') || recognised;
      // "of the 130 widgets on pages 2 and 3, 0 carry maxLen"
      recognised = all(String.raw`of\s+the\s+${N}\s+widgets\s+on\s+pages\s+2\s+and\s+3,\s*(${N})\s+carry`, 'widgets on pages 2 and 3 that declare a /MaxLen', withMax, 'the widget geometry, same derivation') || recognised;
      // and the denominator, wherever it is stated
      recognised = all(String.raw`(?:the\s+)?(${N})\s+(?:fields|widgets)\s+on\s+pages\s+2\s+and\s+3`, 'widgets on pages 2 and 3', on23.length, 'the widget geometry: every widget whose page is 2 or 3') || recognised;
      // "Not one of the 130 fields on pages 2 and 3 declares a /MaxLen" - the count is the WORD
      // "Not one", which no numeric pattern reaches, so it is recognised and compared as zero.
      if (/not one of the/i.test(str)) { recognised = true; rows.push({ what: 'widgets on pages 2 and 3 that declare a /MaxLen (claimed as "Not one")', claimed: 0, derived: withMax, from: 'the widget geometry, same derivation' }); }
      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    },
    fallback: {
      kind: 'underivable',
      reason: 'A /MaxLen CLAIM IN A PHRASING THIS ENTRY DOES NOT KNOW. Four are recognised: "N of the M fields on pages 2 and 3", "of the M widgets on pages 2 and 3, N carry", a bare "M fields on pages 2 and 3", and the word form "Not one of the M fields". A fifth phrasing lands here rather than being silently derived as zero, because a claim this entry cannot parse and reports as agreeing is exactly the failure the manifest exists to prevent.' } }),

  D({ id: 'S-30', file: /433boi\.map\.json$/,
    at: /^_Vehicle1_Mileage_1_AND_LicenseTagNumber_1_DRAW_ON_VEHICLE_ROW_2\._established_how$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const str = String(v);
      // THE CLAIM IS THAT FOUR NAMED FIELDS HAVE ONE WIDGET EACH, which is what makes
      // Mileage[1] a separate field rather than a second widget of Mileage[0] - and that
      // distinction is the whole reason slot 1 of 4ac_vehicles is assembled from two container
      // prefixes. Derived from the widget geometry by counting widgets per field name.
      const per = new Map();
      for (const w of ctx.widgets) per.set(w.name, (per.get(w.name) || 0) + 1);
      const NAMES = ['Vehicle1[0].Mileage[0]', 'Vehicle1[0].Mileage[1]', 'Vehicle1[0].LicenseTagNumber[0]', 'Vehicle1[0].LicenseTagNumber[1]']
        .map((leaf) => `topmostSubform[0].F433-B-OIC_Page3[0].${leaf}`);
      const singles = NAMES.filter((n) => per.get(n) === 1).length;
      const rows = [];
      const N = `(?:${WORD_NUM}|\\d+)`;
      const num = (t) => word(t) ?? Number(t);
      let recognised = false;
      // 'reports "widget 0 of 1" for all four of ...'
      for (const m of str.matchAll(new RegExp(String.raw`for\s+all\s+(${N})\s+of`, 'gi'))) {
        recognised = true; rows.push({ what: 'of those named fields that carry exactly one widget', claimed: num(m[1]), derived: singles, from: 'the widget geometry: widgets grouped by full field name, counted' });
      }
      // "widget 0 of 1" itself - the per-field widget count the claim quotes.
      for (const m of str.matchAll(new RegExp(String.raw`widget\s+0\s+of\s+(${N})`, 'gi'))) {
        recognised = true; rows.push({ what: 'widgets on each of the four named fields', claimed: num(m[1]), derived: Math.max(...NAMES.map((n) => per.get(n) || 0)), from: 'the widget geometry: the largest per-field widget count among the four' });
      }
      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    },
    fallback: {
      kind: 'underivable',
      reason: 'A SHARED-WIDGET CLAIM IN A PHRASING THIS ENTRY DOES NOT KNOW. Two are recognised: "for all N of" and the quoted "widget 0 of N". A third phrasing lands here rather than being reported as agreeing.' } }),

  D({ id: 'S-31', file: /433boi\.map\.json$/,
    at: /^(_the_condition_that_governs_pages_2_and_3\.|_printed_headings_and_markers_pages_2_and_3\.|_the_four_names_that_lie_on_pages_2_and_3\.|_Vehicle1_Mileage_1_AND_LicenseTagNumber_1_DRAW_ON_VEHICLE_ROW_2\.|_map_evidence_pages_2_and_3\.|_arguable_pages_2_and_3\[\d+\]\.|_partition\._still_not_closed$)/,
    kind: 'underivable',
    reason: 'A TRANSCRIPTION OF THE DRAWN PAGE AND OF A PRIOR ARTEFACT, taking [S-27]\'s disposition for [S-27]\'s reason. The numbers in these blocks are COORDINATES - a caption\'s baseline y, the x range it spans, a widget rectangle, the gap in points between a caption and the cell beneath it - together with printed line markers and references to entries in adapters/pdf/maps/433boi.lineage-433aoi.json and adapters/pdf/maps/433aoi.name-lies.json quoted by id. None of them is a count of anything this repo holds a list of, so there is no set to re-derive them from; what re-checks them is re-reading the page, which is what adapters/pdf/align-block.mjs does and what every _at in 433boi.headings.json is re-measured against on every run. The two claims in these blocks that ARE counts over artefacts - the /MaxLen figure and the per-field widget count - are pulled out and DERIVED by [S-29] and [S-30], which is why this reason can be honest about the rest.' }),
  D({ id: 'S-27', file: /433boi\.map\.json$/,
    at: /^(_the_condition_that_governs_page_1\.|_printed_headings_and_markers_first\.|_no_lettered_box_on_this_page$|_map_evidence\.|_nesting_note$|checkboxes\.|check_here\.|exclusive\._why$|_computed\.|groups\.|_never_autofill\.|_not_checkable\.|_deferred_pages$|_arguable_page1\[|_carried$|authored_from$|slice$|_partition\._why_unaccounted_is_the_word_and_not_deferred$)/,
    kind: 'underivable',
    reason: 'A transcription of the DRAWN PAGE: a caption quoted verbatim, the y of its baseline, the x range it spans, and the printed convention that makes a pairing determinate. The numbers are COORDINATES and printed-line references, not counts of anything this map holds, and re-deriving them here would be one instrument measuring the page and then comparing the answer with itself. Every coordinate in the covered sites is checked by adapters/pdf/align-block.mjs, whose prover compares quoted y and x runs against the geometry actually drawn on the page. The claims that DO state a count about the page - how many markers it draws, how many runs form the heading, how many bullets carry no widget - are derived by [S-24], and a count-stating site [S-24] does not recognise is reported UNDISPOSED rather than falling here.' }),

  D({ id: 'S-15', file: /\.totals\.json$/, at: /^(totals\[\d+\]|not_checkable(\.|$)|_why$|_slice$|authored_from)/,
    kind: 'underivable',
    reason: 'The body of the totals declaration: a printed caption quoted verbatim, the operands that caption names, and the reason a printed total-shaped cell is not checkable. Every number in it is a PRINTED LINE MARKER or a figure the page draws. It is checked — but by step 11 of the gate, which recomputes each declared total from the filled PDF and reports checked/skipped/failed, and by validate-map.mjs, which requires every money cell here to sit in exactly one rounding block. Counting is the wrong instrument for it.' }),

  // ═══ headings ════════════════════════════════════════════════════════════════════════
  D({ id: 'S-16b', file: /\.headings\.json$/, at: /^headings\[\d+\]\._at$/,
    kind: 'derived',
    derive: (ctx, v, at) => {
      // MOST of a heading's `_at` is coordinates, and coordinates are re-measured out of the
      // PDF by verify-headings.mjs. But some of them also state HOW MANY FIELDS the band
      // holds — "Section 4 holds twenty-five fields", "Section 6 prints twenty-six scalars" —
      // and that is a count of this repo's own geometry, not a transcription. It was inside
      // the blanket "every number here is a coordinate" exemption, and one of the two had
      // drifted by five while its own enumeration in the same sentence said the right number.
      const m = new RegExp(String.raw`(?:holds|prints) (${WORD_NUM}|\d+) (?:fields|scalars)`, 'i').exec(v);
      if (!m) return [{ unrecognised: true }];
      const idx = Number(/^headings\[(\d+)\]/.exec(at)[1]);
      const h = ctx.headingsDoc.headings[idx];
      const yOf = (str) => { const y = /y\s+([\d.]+)/.exec(str); return y ? Number(y[1]) : null; };
      const onPage = ctx.headingsDoc.headings.filter(x => x.page === h.page).map(x => yOf(x._at)).filter(y => y !== null).sort((a, b) => b - a);
      const top = yOf(h._at);
      const below = onPage.filter(y => y < top);
      const bot = below.length ? below[0] : -Infinity;
      const inBand = ctx.widgets.filter(w => w.page === h.page && (() => { const cy = (w.rect[1] + w.rect[3]) / 2; return cy < top && cy >= bot; })()).length;
      return [{ what: `${h.id}: fields in its band (y ${top} down to ${bot === -Infinity ? 'the page foot' : bot})`, claimed: word(m[1]) ?? Number(m[1]), derived: inBand, from: 'widget geometry, banded by the headings this file declares' }];
    },
    fallback: { kind: 'underivable', reason: 'A heading `_at` that states only WHERE the banner is drawn: the y of its baseline, the x range it spans, and which separately-drawn runs sit beside it. verify-headings.mjs re-measures every one of those out of the PDF on gate step 7 and fails on disagreement. Re-deriving them here would be the same measurement taken twice by the same instrument.' } }),

  // ═══ headings, everything else ══════════════════════════════════════════════════════════════════════
  D({ id: 'S-16', file: /\.headings\.json$/, at: /./,
    kind: 'underivable',
    reason: 'Every number in a headings file is a PDF user-space coordinate or a band boundary expressed in them — "y 735.9, x 36.0..565.0". They are transcriptions of where the page draws a banner, and verify-headings.mjs re-measures every one of them out of the PDF on gate step 7 and fails on disagreement. Re-deriving them here would be the same measurement taken twice by the same instrument.' }),

  // ═══ the map: everything else ════════════════════════════════════════════════════════
  D({ id: 'S-17', file: /\.map\.json$/, at: /^_notes\[\d+\]$|^special\.notes\[\d+\]$/,
    kind: 'derived',
    derive: (ctx, v) => {
      const rows = [];
      let recognised = false, m;
      if ((m = /page (\d)[\s\S]*?(\d+) of (\d+) fields\.?$/.exec(String(v).trim()))) {
        recognised = true;
        rows.push({ what: `fields on page ${m[1]}`, claimed: n(m, 2), derived: ctx.widgetsByPage.get(Number(m[1])) ?? 0, from: 'widget geometry' });
        rows.push({ what: 'form field count', claimed: n(m, 3), derived: ctx.names.size, from: 'fields file' });
      }
      if ((m = new RegExp(String.raw`433-A.s household_members group has (${WORD_NUM}|\d+) slots`, 'i').exec(v))) {
        recognised = true;
        const other = JSON.parse(readFileSync('adapters/pdf/maps/433a.map.json', 'utf8'));
        rows.push({ what: "433-A's household_members slots", claimed: word(m[1]) ?? Number(m[1]), derived: other.groups.household_members.slots.length, from: '433a.map.json' });
      }
      if ((m = new RegExp(String.raw`This form prints (${WORD_NUM}|\d+) rows and enumerates \1; max is (\d+)`, 'i').exec(v)) ||
          (m = new RegExp(String.raw`This form prints (${WORD_NUM}|\d+) rows and enumerates (?:${WORD_NUM}|\d+); max is (\d+)`, 'i').exec(v))) {
        recognised = true;
        const g = ctx.mapDoc.groups?.household_members;
        rows.push({ what: 'household_members slots on this form', claimed: word(m[1]) ?? Number(m[1]), derived: (g?.slots || []).length, from: 'groups.household_members.slots' });
        rows.push({ what: 'household_members declared max', claimed: Number(m[2]), derived: g?.max ?? (g?.slots || []).length, from: 'groups.household_members.max' });
      }
      if ((m = new RegExp(String.raw`(${WORD_NUM}|\d+) are open \(.*?\) and (${WORD_NUM}|\d+) (?:is|are) resolved`, 'is').exec(v))) {
        recognised = true;
        rows.push({ what: '_carried open (as stated in a note)', claimed: word(m[1]) ?? Number(m[1]), derived: (ctx.mapDoc._carried?.open || []).length, from: '_carried.open[]' });
        rows.push({ what: '_carried resolved (as stated in a note)', claimed: word(m[2]) ?? Number(m[2]), derived: (ctx.mapDoc._carried?.resolved || []).length, from: '_carried.resolved[]' });
      }
      if ((m = new RegExp(String.raw`writable \+ never_autofill \+ deferred partitions all (\d+) fields`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: 'fields the partition covers', claimed: Number(m[1]), derived: ctx.names.size, from: 'fields file' });
      }
      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    },
    fallback: {
      kind: 'underivable',
      reason: 'THE CHANGE LOG. A `_notes` entry states what a slice found and decided AT THE TIME it was written, and its numbers are either (a) transcriptions of the printed page — how many rows a table draws, how many account types line (1a) offers, what x-ranges the column headers occupy — which line-markers.mjs, align-block.mjs and check-row-shape.mjs re-measure against the PDF, or (b) figures about a PAST state of this repo, which the present tree cannot reproduce by construction: "the honest count through slice 3 is TEN" is a statement about slice 3 and is not falsifiable from slice 6. Entries that state a count about the tree AS IT STANDS are derived above; one that states such a count and is not recognised is reported as unrecognised, not waved through.',
    } }),

  // ═══ a marker count printed beside its own marker list ═══════════════════════════════
  //
  // [S-26] IS THE FOURTH GENERATION OF THE COUNT DEFECT, AND IT WAS FOUND LIVE.
  //
  // [S-18] below declares the whole body of the map underivable, on the stated grounds that
  // "numbers here are printed coordinates, printed line markers, printed constants ... not one
  // of them counts a set this repo holds". That is true of almost everything in that region
  // and it is FALSE of one shape, which the blanket reason swallowed: an evidence block that
  // ENUMERATES the printed markers on a page and then says how many there are is a count of a
  // list sitting in the same string. `authored_from_page6._printed_markers_first` enumerated
  // twenty-two numbered markers and said "the 23 numbered markers" twice, and that 23 is the
  // same wrong figure [FIG-09] was raised for. Fixing the figure register did not reach it,
  // because the figure register sweeps figures quoted BY A DISPOSITION — figures inside
  // guard-sweep.mjs's own registers — and this one lives in map prose that a blanket
  // underivable had already excused.
  //
  // Each generation of this defect was fixed correctly and certified the next blind spot one
  // level out: a retyped count, then a derivation whose guard was dead, then a sweep whose
  // prose was unchecked, then a register that covers only its own file. So the shape the
  // recovery of [FIG-09] turned on — a count printed beside the list it counts — stops being a
  // thing a careful reader notices and becomes a thing the tree refuses.
  //
  // FIRES ONLY WHERE THERE IS A LIST TO COUNT. A string that names no marker in the
  // "(nn) y 123.4" form is left to [S-18], because there is nothing beside the number to
  // count and asserting one would be inventing a denominator. Where a list IS present and no
  // phrasing is recognised, that is REPORTED as unrecognised and not waved through — the
  // fallback names exactly which phrasings were looked for, so the next author extends the
  // list rather than rediscovering the gap.
  D({ id: 'S-26', file: /\.map\.json$/, at: /_printed_markers/,
    kind: 'derived',
    derive: (ctx, v) => {
      const str = String(v);
      // The enumeration itself: "(30) y 628.5", "(6a) y 512.1". A marker followed by its y.
      const numbered = [...str.matchAll(/\((\d{1,2}[a-z]?)\)\s*(?:[A-Za-z][^|,]*?)?y\s*[\d.]/g)].length;
      const boxes    = [...str.matchAll(/Box\s+([A-H])\b[^|,]*?y\s*[\d.]/g)].length;

      const rows = [];
      const N = `(?:${WORD_NUM}|\\d+)`;
      // WHETHER THIS STRING STATES A MARKER COUNT AT ALL, asked BEFORE the enumeration is
      // consulted, because the two answers together are what decides between the three
      // outcomes. States a count and carries a list: derive. States neither: not this entry's
      // business, hand it to [S-18]. States a count and carries NO readable list: that is the
      // one reading that must never be a silent hand-off, because it is precisely what a
      // changed enumeration format would look like — the count stays, the list stops parsing,
      // and the entry that exists to check the count steps quietly aside. It is a STOP.
      const STATES = new RegExp(String.raw`(?:reports|draws)\s+${N}\b(?![^ ]*\))|${N}\s+numbered\s+markers?|in\s+all\s+${N}\s+cases|${N}\s+Box\s+markers?`, 'i');
      // ZERO IS A DERIVABLE ANSWER AND AN EMPTY LIST IS NOT AN UNREADABLE ONE. Page 8 of
      // 433-A(OIC) states "line-markers.mjs reports 0 on page 8" and lists nothing, because
      // there is nothing to list; the enumeration correctly reads 0 and the claim agrees. So
      // an empty enumeration is NOT short-circuited when a count is stated — it is compared,
      // and a string claiming a non-zero count beside no readable list falls out as a
      // MISMATCH naming both sides, which is a louder and more precise report than a STOP
      // saying the input could not be read. The only string this entry steps away from is one
      // that lists no marker AND states no count; that one belongs to [S-18] and to nothing
      // here. (A first version returned a `fail` for the stated-count case and reported page
      // 8's honest zero as unreadable — the guard was right about the risk and wrong about
      // which reading carried it.)
      if (!numbered && !boxes && !STATES.test(str)) return [{ skip: true }];
      const num = (t) => word(t) ?? Number(t);
      const all = (re, what, derived, from) => {
        let hit = false;
        for (const m of str.matchAll(new RegExp(re, 'gi'))) { hit = true; rows.push({ what, claimed: num(m[1]), derived, from }); }
        return hit;
      };
      let recognised = false;
      // "line-markers.mjs reports 25 on page 6" / "draws 25 markers"
      recognised = all(String.raw`(?:reports|draws)\s+(${N})\b(?![^ ]*\))`, 'markers drawn on the page', numbered + boxes,
        'the enumeration in this same string: numbered markers plus Box markers') || recognised;
      // "All twenty-four numbered markers", "the 23 numbered markers"
      recognised = all(String.raw`(${N})\s+numbered\s+markers?`, 'numbered markers', numbered,
        'the enumeration in this same string: runs of the form "(nn) y ..."') || recognised;
      // "the marker's y falls INSIDE that cell's rectangle in all 23 cases"
      recognised = all(String.raw`in\s+all\s+(${N})\s+cases`, 'numbered markers said to be rectangle-contained', numbered,
        'the enumeration in this same string: runs of the form "(nn) y ..."') || recognised;
      // "The three Box markers are drawn at ..."
      recognised = all(String.raw`(${N})\s+Box\s+markers?`, 'Box markers', boxes,
        'the enumeration in this same string: runs of the form "Box X y ..."') || recognised;

      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    },
    fallback: {
      kind: 'underivable',
      reason: 'A MARKER ENUMERATION THAT STATES A COUNT IN A PHRASING THIS ENTRY DOES NOT KNOW. Four are recognised: "reports|draws N" for the total drawn, "N numbered markers", "in all N cases" for the rectangle-containment claim, and "N Box markers". A block that says it another way is reported here rather than passed, because the whole point of [S-26] is that a blanket underivable over this region is what let a wrong 23 sit beside a list of 22 for three commits. Extend the recognisers; do not widen this reason.',
    } }),

  D({ id: 'S-18', file: /\.map\.json$/, at: /^(map\.|groups\.|checkboxes\.|check_here\.|exclusive\.|_never_autofill|_deferred|allowed\.|split\.|_computed\.|_not_checkable|_map_evidence|_nesting_note|_label_file_disagreements|_arguable_page\d|_carried\.(open|resolved)|rounding\.blocks\[|rounding\._(what|why_money|order|wording|the_mixed|_)|authored_from|_the_row_class)/,
    kind: 'underivable',
    reason: 'THE BODY OF THE MAP AND ITS EVIDENCE. Numbers here are printed coordinates, printed line markers, printed constants the form draws ($1,000, $3,450, X .8), field-name indices, and maxLength limits. Not one of them counts a set this repo holds. Each is checked by the instrument that can check it: align-block.mjs and line-markers.mjs re-measure coordinates and markers out of the PDF; check-row-shape.mjs re-derives every row shape; validate-map.mjs proves every target exists verbatim; gate step 11 recomputes every printed constant into its total. Counting them would assert agreement between a transcription and itself.' }),

  // ═══ the crosswalk classification ════════════════════════════════════════════════════
  // A CLASSIFICATION IS A LIST WITH A TALLY BESIDE IT, WHICH IS THE SHAPE THAT DRIFTS.
  // Derived on the run that wrote it: the hand-authored tally said 16 exact, 8 different-shape
  // and 8 new against a derived 14, 7 and 11, and was corrected before the file was committed.
  D({ id: 'S-25', file: /\.crosswalk-classification\.json$/, at: /^_tally\./,
    kind: 'derived',
    derive: (ctx, v, at, doc) => {
      const key = at.replace(/^_tally\./, '');
      if (key.startsWith('_')) return [{ unrecognised: false, skip: true }];
      const by = {};
      for (const e of (doc.entries || [])) by[e.category] = (by[e.category] || 0) + 1;
      if (key === 'entries') return [{ what: '_tally.entries', claimed: v, derived: (doc.entries || []).length, from: 'entries[] by length' }];
      return [{ what: `_tally.${key}`, claimed: v, derived: by[key] || 0, from: `entries[] with category "${key}"` }];
    } }),

  // EVERY CATEGORY AN ENTRY USES MUST BE ONE THE FILE DECLARES, and every declared category
  // must be tallied. A category invented in an entry and never declared is a classification
  // nobody defined; a declared category with no tally line is one nobody counted. Both are
  // the no-declared-state defect, in a file whose whole content is declarations.
  D({ id: 'S-25b', file: /\.crosswalk-classification\.json$/, at: /^entries\[\d+\]\.(id|category)$/,
    kind: 'derived',
    derive: (ctx, v, at, doc) => {
      if (/\.id$/.test(at)) {
        const ids = (doc.entries || []).map(e => e.id);
        return [{ what: `${at}: unique`, claimed: 1, derived: ids.filter(x => x === v).length, from: 'entries[] ids' }];
      }
      return [
        { what: `${at}: "${v}" is a declared category`, claimed: true, derived: Object.prototype.hasOwnProperty.call(doc._the_categories || {}, String(v)), from: '_the_categories keys' },
        { what: `${at}: "${v}" is tallied`, claimed: true, derived: Object.prototype.hasOwnProperty.call(doc._tally || {}, String(v)), from: '_tally keys' },
      ];
    } }),

  D({ id: 'S-25c', file: /\.crosswalk-classification\.json$/, at: /./,
    kind: 'underivable',
    reason: 'THE CLASSIFICATION’S PROSE. Its numbers are printed line markers on two forms ("lines 36-49", "(39)-(51)", "line 24", "$3,450"), printed slot counts re-derivable from either map and already asserted there by count-sweep [S-01] and check-row-shape.mjs, and statements about the two printed pages that align-block.mjs and line-markers.mjs re-measure. It BINDS NOTHING — no HubSpot property, no canonical column, no map key — so there is no binding here for validate-map.mjs to resolve. What IS a count of a list this file holds is the tally, and that is derived by [S-25]; that every entry uses a declared and tallied category is asserted by [S-25b].' }),

  // ═══ the table-or-scalars procedure ══════════════════════════════════════════════════
  // A DECISION PROCEDURE THAT STATES FACTS ABOUT THE TREE IS CHECKED AGAINST THE TREE. Its
  // whole purpose is to be reread by a later slice and by 433-B(OIC), and a procedure whose
  // worked examples have gone stale teaches the wrong answer with full confidence. Every
  // figure it states about a shape THIS REPO HOLDS is derived here; the rest is reasoning
  // about the printed page and about past slices, and is declared underivable below.
  D({ id: 'S-28', file: /\.map\.json$/, at: /^_table_or_scalars\./,
    kind: 'derived',
    derive: (ctx, v) => {
      const rows = [];
      let recognised = false, m;
      const G = ctx.mapDoc.groups || {}, MAP = ctx.mapDoc.map || {};
      const keysLike = (re) => Object.keys(MAP).filter(k => re.test(k)).length;

      if ((m = new RegExp(String.raw`household_members is a (${WORD_NUM}|\d+)-slot group`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: 'W1: household_members slots', claimed: word(m[1]) ?? Number(m[1]), derived: G.household_members?.slots?.length, from: 'groups.household_members.slots' });
      }
      if ((m = new RegExp(String.raw`(${WORD_NUM}|\d+) leaf names on this form are actively wrong`, 'i').exec(v))) {
        recognised = true;
        const active = (ctx.liesDoc?.entries || []).filter(e => e.kind === 'lie' || e.kind === 'container').length;
        rows.push({ what: 'W6: active name lies', claimed: word(m[1]) ?? Number(m[1]), derived: active, from: 'name-lies.json entries of kind lie or container' });
      }
      if ((m = new RegExp(String.raw`groups\.9ab_business_assets, slots (\d+), max (\d+)`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: 'C-08: 9ab_business_assets slots', claimed: Number(m[1]), derived: G['9ab_business_assets']?.slots?.length, from: 'groups.9ab_business_assets.slots' });
        rows.push({ what: 'C-08: 9ab_business_assets max', claimed: Number(m[2]), derived: G['9ab_business_assets']?.max, from: 'groups.9ab_business_assets.max' });
      }
      if ((m = new RegExp(String.raw`(${WORD_NUM}|\d+) .map. keys, 30_\* and 31_\*`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: 'page 6: the (30)/(31) scalar keys', claimed: word(m[1]) ?? Number(m[1]), derived: keysLike(/^(30|31)_/), from: 'map keys matching /^(30|31)_/' });
      }
      if ((m = new RegExp(String.raw`7b_\* are (${WORD_NUM}|\d+) .map. keys; 7a_other_valuable_items is a (${WORD_NUM}|\d+)-slot group`, 'i').exec(v))) {
        recognised = true;
        rows.push({ what: 'C-14: the 7b scalar keys', claimed: word(m[1]) ?? Number(m[1]), derived: keysLike(/^7b_/), from: 'map keys matching /^7b_/' });
        rows.push({ what: 'C-14: 7a_other_valuable_items slots', claimed: word(m[2]) ?? Number(m[2]), derived: G['7a_other_valuable_items']?.slots?.length, from: 'groups.7a_other_valuable_items.slots' });
      }
      if (!recognised) rows.push({ unrecognised: true });
      return rows;
    },
    fallback: {
      kind: 'underivable',
      reason: 'THE PROCEDURE’S REASONING. Its numbers are printed coordinates re-measurable with align-block.mjs (the heading at y 671.7, the column headers at y 726.7 and y 658.3, the repeated captions at y 642.9 and y 603.3, the 540.0pt/327.6pt asymmetry, the 39.6pt row pitch), printed line markers re-measurable with line-markers.mjs, or statements about PAST SLICES which the present tree cannot reproduce by construction — "the same question landed three different ways in three slices" is a fact about slices 4, 5 and 6 and is not falsifiable from the tree as it stands. Every figure the block states about a shape this repo HOLDS — the slot counts, the maxes, the scalar key counts, the active-lie total — is derived above, and one that is stated and not recognised is reported as unrecognised rather than waved through.',
    } }),

  D({ id: 'S-19', file: /\.map\.json$/, at: /^(form|form_revision|catalog|pdf|fields_source|slice|map_version)$/,
    kind: 'underivable',
    reason: 'The map header. `form_revision` and `catalog` are the printed revision pin, re-read out of the PDF page content by read-form-revision.mjs and failed on mismatch in validate-map.mjs; the rest are identifiers, not counts.' }),

  D({ id: 'S-23', file: /irs-standards-2026\.json$/, at: /./,
    kind: 'underivable',
    reason: 'THE PUBLISHED IRS COLLECTION FINANCIAL STANDARDS. Every number in this file is a DOLLAR ALLOWANCE the IRS publishes in a table this repo does not hold, indexed by household size and age band. Nothing in the repo can derive them: they are external data, and a derivation that produced them from anything here would be deriving the published figure from a copy of itself. What IS asserted about them is asserted where they are used — 433-A\u2019s `allowed` block auto-fills exactly two lines from this file and lists the other fourteen under `allowed._never_autofill` with a reason each, and allowed.out_of_pocket_health.consistency_check hard-stops when the two age-band counts do not sum to the household size the national-standards line was computed on. The file itself is checked by re-reading the IRS publication, by a person, at each annual revision \u2014 and its name carries the year so a stale one cannot be mistaken for the current one.' }),

  // ═══ the shared HubSpot artefacts ════════════════════════════════════════════════════
  D({ id: 'S-20', file: /asset-row-shapes\.json$/, at: /^classes\[\d+\]\.(columns|printed_tables)/,
    kind: 'derived',
    derive: (ctx, v, at, doc) => {
      // The class spec states how many printed tables each row class covers. That IS a count
      // of a list this file holds, so it is derived from the list.
      const idx = Number(/^classes\[(\d+)\]/.exec(at)[1]);
      const c = doc.classes[idx];
      const rows = [];
      const tables = Object.values(c.printed_tables || {}).flat().length;
      if (typeof c._table_count === 'number')
        rows.push({ what: `classes[${idx}] (${c.name || c.id}): _table_count`, claimed: c._table_count, derived: tables, from: 'printed_tables' });
      else rows.push({ unrecognised: false, skip: true });
      return rows;
    },
    fallback: { kind: 'underivable', reason: 'A row class names the PRINTED TABLES it covers on each form and the columns it declares. The numbers inside those names are printed line markers ("13a", "18a-c"), not counts. The list LENGTHS are what matter and they are asserted by adapters/pdf/assert-row-shape-spec.mjs [A2], which requires every column a class says a form contributes to be reachable on the group that accepts that class on that form — by its own key or by a declared and separately verified `printed_as` alias.',
      _reason_was: 'THIS REASON NAMED validate-crosswalk.mjs UNTIL THE BLANKET AUDIT ASKED IT TO PAY. validate-crosswalk.mjs does not open asset-row-shapes.json; the check it was credited with did not exist. Kept here because the wrong half is instructive: the sentence described a real and necessary check accurately enough that three slices read it and believed it, which is how a forward reference launders an intention into a fact.' } }),

  // A FORWARD REFERENCE IS A PROMISSORY NOTE, AND THIS ONE BOUNCED. The reason below said,
  // for three slices, that this file's lists were "asserted structurally by
  // adapters/hubspot/validate-crosswalk.mjs". That tool reads crosswalk.<form>.json, the map
  // and the 433-A backbone, and never opens this file — nothing in the repo did. 269 claim
  // sites, over the artefact `row_class` routing is authored from, stood on a check that had
  // never been written. Found by adapters/pdf/blanket-audit.mjs; the check now exists.
  D({ id: 'S-21', file: /asset-row-shapes\.json$/, at: /./,
    kind: 'underivable',
    reason: 'The shared row-class specification. Its numbers are printed line markers on 433-A and 433-F ("line 13", "18a-c", "Section E"), HubSpot property counts quoted from a provisioning run that already happened, and the migration-cost narrative for a migration that was completed. None counts a list this file holds; the lists it does hold — classes, columns, printed tables — are asserted structurally by adapters/pdf/assert-row-shape-spec.mjs: [A1] every class any map routes rows under is declared here, [A2] every contributed column is reachable on the group that accepts the class, and [A3] every printed table a class claims is either routed by a group or carries a live `unrouted` declaration, with a stale one a STOP. A count would be weaker than that check.',
    _reason_was: 'IT NAMED validate-crosswalk.mjs, "which fails when a declared column is missing from a claimed table", and validate-crosswalk.mjs has never read this file. What the old reason got RIGHT: that counting is the wrong instrument here, and that the load-bearing property of the file is structural reachability rather than cardinality. What it got WRONG: that the structural check was running. It was not, and the first run of the one that replaced it found fifteen problems — an undeclared live class, six unreachable columns, and eight printed tables no group routes.' }),

  D({ id: 'S-22', file: /crosswalk\.433f\.json$/, at: /./,
    kind: 'underivable',
    reason: 'The 433-F crosswalk. Every number in it is a printed line marker, a HubSpot property count from a completed provisioning run, or a figure inside an `arguable` item describing work not yet done ("five column-key renames", "six per-printed-row scalars") — a forecast, which by construction cannot be derived from a tree where the work has not happened. What IS checkable about this file is checked by adapters/hubspot/validate-crosswalk.mjs: every binding names a map key that exists and a property that exists, and no property is bound twice. That check is structural and does not need a count.' }),
];

/**
 * The quick-sale cells, derived once and shared by three claims that describe them from
 * three different files. Two of those three had drifted apart from each other by slice 5 —
 * one said five across two pages, one said nine across four — which is the clearest possible
 * argument for deriving both from the same place.
 */
const quickSaleCells = (ctx) => {
  const T = ctx.totalsDoc?.totals || [];
  const qs = T.filter(e => /\bQSV\b/i.test(String(e.line || e.id || '')));
  const targets = qs.map(e => {
    const c = e.total_cell;
    if (c?.group) {
      const s = ctx.mapDoc.groups?.[c.group]?.slots?.[c.row ?? 0];
      return s?.text?.[c.column] ?? s?.[c.column];
    }
    return ctx.mapDoc.map?.[e.total_key];
  }).filter(Boolean);
  const pages = [...new Set(targets.map(t => ctx.pageOf.get(t)).filter(Boolean))].sort((a, b) => a - b);
  const leaf = (t) => String(t).split('.').pop().replace(/\[\d+\]$/, '');
  return {
    cells: qs, targets, pages,
    times8: targets.filter(t => /^times_8$/i.test(leaf(t))).length,
    times7: targets.filter(t => /^times_7$/i.test(leaf(t))).length,
  };
};

// ---------------------------------------------------------------------------------------
/**
 * RUN THE SWEEP. Returns `{ rows, problems, files }`.
 *
 * Three ways to fail, and they are different failures reported differently:
 *   MISMATCH      a derived claim disagrees with what the artefact states
 *   UNREADABLE    a derivation could not extract the claim from the prose it lives in
 *   UNDISPOSED    a claim site matches no manifest entry — nobody has said whether it is
 *                 derived or underivable, and that is the state this file forbids
 */
export const runCountSweep = async (form) => {
  const ctx = await buildContext(form);
  // The printed rounding sentences, for S-10.
  const { readPrintedText } = await import('./page-geometry.mjs');
  const text = await readPrintedText(readFileSync(`adapters/pdf/forms/f${form}.pdf`));
  ctx.printedRounding = text.flatMap((pg, i) => (pg.items || [])
    .filter(t => /round to the nearest/i.test(t.str))
    .map(t => ({ page: i + 1, y: t.y2, str: t.str })));

  const rows = [], problems = [];
  const files = sweptFiles(form);
  for (const file of files) {
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    const forced = MANIFEST.filter(e => e.kind === 'derived' && e.file.test(file)).map(e => e.at);
    for (const claim of claimsIn(doc, forced)) {
      const entry = MANIFEST.find(e => e.file.test(file) && e.at.test(claim.at));
      if (!entry) {
        problems.push(`UNDISPOSED  ${file}  ${claim.at}\n      states a count and matches no manifest entry in adapters/pdf/count-sweep.mjs.\n      Derive it, or declare it underivable with the reason. There is no third state.\n      ${JSON.stringify(String(claim.value).slice(0, 160))}`);
        rows.push({ file, at: claim.at, id: '(none)', disposition: 'UNDISPOSED' });
        continue;
      }
      if (entry.kind === 'underivable') {
        rows.push({ file, at: claim.at, id: entry.id, disposition: 'underivable', reason: entry.reason });
        continue;
      }
      let out;
      // AWAITED. Every derivation through slice 7 was synchronous; [S-24] reads the DRAWN PAGE —
      // marker geometry and printed runs out of the PDF — and cannot be. `await` on a non-promise
      // yields the value unchanged, so this is a no-op for all 23 earlier entries, and that no-op
      // is proved in the same run: the sweep's own totals over the three finished forms are
      // unchanged by this line, and a derivation that silently returned a promise before it would
      // have thrown `out.some is not a function` — which is exactly how this was found.
      try { out = (await entry.derive(ctx, claim.value, claim.at, doc)) || []; }
      catch (e) { problems.push(`UNREADABLE  ${file}  ${claim.at}  [${entry.id}]\n      the derivation threw: ${e.message}`); rows.push({ file, at: claim.at, id: entry.id, disposition: 'UNREADABLE' }); continue; }

      if (out.some(r => r.unrecognised)) {
        if (entry.fallback) { rows.push({ file, at: claim.at, id: `${entry.id}f`, disposition: 'underivable', reason: entry.fallback.reason }); continue; }
        problems.push(`UNDISPOSED  ${file}  ${claim.at}  [${entry.id}]\n      states a count the derivation does not recognise and the entry declares no fallback.`);
        rows.push({ file, at: claim.at, id: entry.id, disposition: 'UNDISPOSED' }); continue;
      }
      const real = out.filter(r => !r.skip);
      if (!real.length) { rows.push({ file, at: claim.at, id: entry.id, disposition: 'underivable', reason: entry.fallback?.reason || 'nothing to derive at this site' }); continue; }
      let bad = 0;
      for (const r of real) {
        if (r.fail) { problems.push(`UNREADABLE  ${file}  ${claim.at}  [${entry.id}]\n      ${r.fail}`); bad++; continue; }
        if (String(r.claimed) !== String(r.derived)) {
          problems.push(`MISMATCH    ${file}  ${claim.at}  [${entry.id}]\n      ${r.what}\n      the artefact says ${JSON.stringify(r.claimed)}; derived from ${r.from}: ${JSON.stringify(r.derived)}`);
          bad++;
        }
      }
      rows.push({ file, at: claim.at, id: entry.id, disposition: bad ? 'DERIVED-FAILED' : 'derived', checks: real.length, detail: real });
    }
  }
  return { form, rows, problems, files, ctx };
};

/** Print the sweep. Returns the number of problems (0 = it holds). */
export const reportCountSweep = (s, { verbose = false } = {}) => {
  const byDisp = s.rows.reduce((a, r) => { a[r.disposition] = (a[r.disposition] || 0) + 1; return a; }, {});
  const checks = s.rows.reduce((a, r) => a + (r.checks || 0), 0);
  console.log(`count sweep: ${s.rows.length} claim site(s) across ${s.files.length} artefact(s) — ${Object.entries(byDisp).map(([k, v]) => `${v} ${k}`).join(', ')}; ${checks} derived comparison(s)`);
  if (verbose) {
    let cur = null;
    for (const r of s.rows) {
      if (r.file !== cur) { console.log(`  ${r.file}`); cur = r.file; }
      console.log(`    ${String(r.id).padEnd(6)} ${String(r.disposition).padEnd(15)} ${r.at}${r.checks ? `  (${r.checks} check${r.checks === 1 ? '' : 's'})` : ''}`);
    }
  }
  if (!s.problems.length) { console.log('OK — every count either derives and agrees, or is declared underivable with a reason. No claim site is in neither state.'); return 0; }
  console.error(`COUNT SWEEP — ${s.problems.length} problem(s):`);
  s.problems.forEach(p => console.error(`  ${p}`));
  return s.problems.length;
};

// CLI: node adapters/pdf/count-sweep.mjs <form> [--verbose]
if (process.argv[1] && /count-sweep\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const form = process.argv[2] || '433aoi';
  const s = await runCountSweep(form);
  process.exit(reportCountSweep(s, { verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
