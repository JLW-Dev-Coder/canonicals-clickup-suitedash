// THE SEVENTH SWEEP — WHAT THE SWEEPS DO NOT SWEEP, AND WHY.
//
//   node adapters/pdf/sweep-boundary.mjs [--verbose]
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — RULING 1 OF PROMPT 39, POINTED AT THE SWEEPS THEMSELVES
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// exclusion-sweep.mjs was written on one rule: AN EXCLUSION IS A CLAIM, AND EVERY CLAIM GETS
// A COUNTER. It registers every predicate in the engine that excuses a call site from a check.
// What it never registered is the exclusion that decides which FILES those checks look at.
//
// Two wrong typed counts sat in `samples/` and nothing in this repo would ever have said so,
// because `samples/` is outside count-sweep's swept set. Not excused by a predicate, not
// declared anywhere, not counted — just not looked at. The sweep that exists to find the
// narrowing of an assertion's input had its OWN input narrowed by a list of eight paths that
// nobody had ever compared to the tree.
//
// So the boundary is registered, in the same three kinds and with the same standard of proof:
//
//   structural  removes nothing that could carry a claim. The reason says why.
//   scoped      genuinely removes claims, and something else covers them BY NAME.
//   claiming    removes claims on the strength of a statement about reality, and MUST carry a
//               crosscheck(). One without is a STOP.
//
// AND ONE THING THIS FILE ADDS TO THAT SHAPE. Every sweep in this engine reads its directories
// with a non-recursive readdirSync, so every SUBDIRECTORY of every swept directory is silently
// outside every sweep. That is not an entry anybody wrote; it is a property of the reading, and
// it is the shape `samples/` had. [SB-90] derives the subdirectory list from the tree on every
// run and requires each one to be covered by a registered entry — so a directory that appears
// is a STOP, not a gap.
//
// WHAT AN HONEST BOUNDARY LOOKS LIKE. [SB-10] does NOT claim that `samples/` holds no counts.
// It holds 130 of them and the entry says so, enumerated on every run. What it claims is the
// narrower thing that is true and checkable: no tool reads a fixture's prose, and every count
// in that prose which states a figure THIS TREE CAN DERIVE is compared against the derivation.
// That comparison is the one the two wrong counts were in.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { statesACount, sweptFiles as countSweptFiles } from './count-sweep.mjs';
import { SWEPT_DIRS } from './exclusion-sweep.mjs';
import { sweptFiles as guardSweptFiles } from './guard-sweep.mjs';

const r = (p) => readFileSync(p, 'utf8');
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
export const MAPPED_FORMS = () =>
  readdirSync('adapters/pdf/maps').filter((f) => f.endsWith('.map.json')).map((f) => f.replace('.map.json', '')).sort();

/** Every `_`-prefixed prose string in a JSON document, with its path. */
const proseIn = (doc, at = '') => {
  const out = [];
  const walk = (o, p) => {
    if (typeof o === 'string') { out.push({ at: p, value: o }); return; }
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k);
  };
  walk(doc, at);
  return out;
};

/** Every count-stating string in samples/, by file. The size of what [SB-10] removes. */
export const sampleClaims = () => {
  const out = [];
  for (const f of readdirSync('samples').filter((x) => x.endsWith('.json')).sort()) {
    let doc;
    try { doc = JSON.parse(r(`samples/${f}`)); }
    catch (e) { out.push({ file: `samples/${f}`, unreadable: e.message }); continue; }
    for (const p of proseIn(doc)) if (statesACount(p.value)) out.push({ file: `samples/${f}`, at: p.at, value: p.value });
  }
  return out;
};

// The two shapes a fixture's prose uses to state a figure about the FORM rather than about
// itself. These are the ones the tree can derive, and they are the class the two wrong counts
// were in — "all 515 form fields", "74 of this form's 425 fields". The apostrophe is matched in
// both the ASCII and the typographic spelling, because 433aoi.sample.json uses both.
const FORM_TOTAL = [
  /all (\d+) form fields/gi,
  /\d+ of this form['’]s (\d+) fields/gi,
];

/** A fixture's stated form-field total against the enumerated field list for that form. */
export const sampleFormTotals = () => {
  const out = [];
  for (const f of readdirSync('samples').filter((x) => x.endsWith('.json')).sort()) {
    const form = MAPPED_FORMS().find((m) => f.startsWith(`${m}.`));
    if (!form) { out.push({ file: `samples/${f}`, noForm: true }); continue; }
    const fieldsPath = `adapters/pdf/maps/${form}.fields.json`;
    if (!existsSync(fieldsPath)) { out.push({ file: `samples/${f}`, form, unreadable: `${fieldsPath} is absent` }); continue; }
    const derived = JSON.parse(r(fieldsPath)).fields.length;
    const src = r(`samples/${f}`);
    for (const re of FORM_TOTAL) for (const m of src.matchAll(re))
      out.push({ file: `samples/${f}`, form, phrase: m[0], claimed: Number(m[1]), derived });
  }
  return out;
};

// THE MARKDOWN UNDER adapters/ THAT IS NOT A RUN REPORT. Declared once and read by [SB-14]'s
// counter, by [SB-14]'s crosscheck and by [SB-19], so the two entries cannot drift into both
// claiming the same file or neither claiming it.
const NOT_RUN_REPORTS = new Set(['adapters/pdf/RULES.md']);

// ---------------------------------------------------------------------------------------
// WHAT `claims()` IS FOR, AND WHY EVERY ENTRY BELOW GREW ONE — [D-24].
//
// Until this commit an entry declared HOW MANY files it removed and never WHICH. `count()`
// returns a number, and a number cannot be subtracted from a directory listing. So the
// register could say "20 boundaries, all cross-checked" over a tree holding files that no
// boundary named and no sweep read, and NOTHING SAID SO — which is precisely how
// 433d.pairs.json, 433d.pairs.txt, 433d.lineage.json and 433d.mirror.json sat outside
// everything for two prompts.
//
// [SB-24] then declared those four. THAT FIXED THE INSTANCE AND NOT THE CLASS. The remedy for
// the class is a RESIDUAL: enumerate the tree, subtract every path the sweeps read and every
// path a boundary claims, and require what is left to be EMPTY. It is [SB-90] one level out —
// that entry derives the SUBDIRECTORIES of the swept directories and refuses an unregistered
// one; [SB-92] derives the FILES and refuses an unclaimed one.
//
// So `claims()` returns PATHS, not a count, and it is derived from the same predicate the
// entry's `count()` already used rather than listed beside it. An entry whose claims() and
// count() disagree about size where both are file sets is drift, and [SB-92] reports it.
const ls = (d) => (isDir(d) ? readdirSync(d).filter((f) => !isDir(`${d}/${f}`)).map((f) => `${d}/${f}`) : []);
const mapFiles = (re) => ls('adapters/pdf/maps').filter((p) => re.test(p.split('/').pop()));

// [SB-24]'S POPULATION, DERIVED OVER EVERY MAPPED FORM AND NOT OVER THE FORM SOMEBODY WAS
// LOOKING AT. The first draft of that entry was spelled `433d.` and left 433b.lineage.json in
// exactly the state it was written to end. The form id is a capture here, so a seventh form's
// lineage file is claimed the day it lands.
const SB24_FILES = () => {
  const forms = new Set(MAPPED_FORMS());
  return ls('adapters/pdf/maps').filter((p) => {
    const m = /^([0-9a-z]+)[.](?:pairs[.](?:json|txt)|lineage[.]json)$/.exec(p.split('/').pop());
    return !!m && forms.has(m[1]);
  });
};

// [SB-23]'S POPULATION, DERIVED FROM THE DECLARATION AND NOT FROM A SPELLING. Its first draft
// read `*.mirror.json, *.subject-classes.json` — two filename patterns, which is the same
// object [SB-24]'s `433d.` was and would have failed the same way on the third construct. The
// ground of that entry is "a generator re-derives every byte on a standing run", so the
// population is every unswept map artefact THAT SAYS SO, and the entry's crosscheck then asks
// whether the saying is true.
//
// PRECEDENCE IS EXPLICIT, because two entries claiming one file under different grounds is
// how [SB-14] and [SB-19] nearly came to both cover RULES.md. [SB-24] takes the intake records
// FIRST — 433d.pairs.json declares a generator and is nonetheless an intake record superseded
// by the mirror, and its generator is a one-shot in scratchpad/ that no standing script runs.
// [SB-92] reports any file two entries claim, so a precedence that stops being true is a STOP
// rather than a silence.
const SB23_FILES = () => {
  const swept = new Set(MAPPED_FORMS().flatMap((f) => countSweptFiles(f)));
  const intake = new Set(SB24_FILES());
  return ls('adapters/pdf/maps').filter((p) => {
    if (!p.endsWith('.json') || swept.has(p) || intake.has(p)) return false;
    try { const d = JSON.parse(r(p)); return !!(d._generator || d.meta?.generator); } catch { return false; }
  });
};

// ---------------------------------------------------------------------------------------
// THE RESIDUAL — [D-24].
//
// Enumerate the tree, subtract everything the sweeps read and everything the register claims,
// and the remainder must be empty. It is [SB-90] one level out: that entry derives the
// SUBDIRECTORIES of the swept directories and refuses an unregistered one, this derives the
// FILES and refuses an unclaimed one.
//
// THE ROOTS ARE DERIVED FROM THE REGISTER, WHICH IS THE WHOLE POINT. A typed list of
// directories here would make the residual a residual over what somebody looked at — the exact
// sentence [D-24] was raised on, and [R-31]'s factor of forty-eight. Instead every entry's
// claims() contributes the directory of every path it names, so an entry claiming a file in a
// new place brings that place into the universe on the same run.
//
// Declared as a function taking BOUNDARIES so the register can be passed in — the canary hands
// it a synthetic one, and a residual that cannot be pointed at a synthetic tree is a residual
// nothing can prove is alive.
export const residualOver = (entries, roots0) => {
  const claimed = new Set();
  const drift = [];
  // WHICH ENTRIES CLAIM EACH FILE. Two entries covering one file under two different grounds is
  // the drift [SB-14] and [SB-19] came within one sentence of — "the two entries cannot drift
  // into both claiming the same file or neither claiming it" is written at NOT_RUN_REPORTS, and
  // until this commit only the SECOND half of it was checked by anything. The four SWEPT-SET
  // entries are exempt by construction: [SB-02] reads the same .mjs [SB-03] and [SB-04] read,
  // and that overlap is what those entries say about themselves rather than a claim in dispute.
  const SWEPT_SET_ENTRIES = new Set(['SB-01', 'SB-02', 'SB-03', 'SB-04', 'SB-21', 'SB-22']);
  const claimants = new Map();
  for (const e of entries) {
    if (typeof e.claims !== 'function') continue;
    let paths;
    try { paths = e.claims() || []; } catch (err) { drift.push({ id: e.id, count: 'threw', claims: err.message }); continue; }
    for (const p0 of paths) {
      const p = p0.replace(/\\/g, '/');
      claimed.add(p);
      if (!SWEPT_SET_ENTRIES.has(e.id)) claimants.set(p, [...(claimants.get(p) || []), e.id]);
    }
    if (typeof e.count === 'function' && !e.claims_is_not_count) {
      let n = null;
      try { n = e.count(); } catch { n = null; }
      if (typeof n === 'number' && n !== paths.length) drift.push({ id: e.id, count: n, claims: paths.length });
    }
  }
  const roots = roots0 || [...new Set([
    ...SWEPT_DIRS,
    ...[...claimed].map((p) => p.split('/').slice(0, -1).join('/')).filter(Boolean),
  ])].filter((d) => !d.includes('/') || isDir(d)).sort();
  // The TOP-LEVEL roots only: git ls-files is recursive, so passing both `adapters/pdf` and
  // `adapters/pdf/maps` would list the same file twice, and a set removes that anyway.
  const tops = roots.filter((d) => !roots.some((o) => o !== d && d.startsWith(o + '/')));

  // A DECLARED LAYERING IS NOT A DISPUTE, AND IT MUST BE DECLARED FROM BOTH SIDES. [SB-10] and
  // [SB-17] both stand over samples/*.json and remove different things from the same files —
  // the count-stating prose and the provenance declaration — which is layering. [SB-16] and
  // [SB-15] over fields.registry.json was NOT: one had been split out of the other and the
  // other went on claiming it. The difference is not visible in the overlap itself, so it is
  // read from a declaration.
  //
  // BOTH DIRECTIONS, because a one-sided `claims_alongside` is an entry excusing itself. And an
  // exemption that finds nothing to exempt is refused rather than passed over — that is
  // [R-28]'s `sole_declared_line`, whose filter matched nothing for a whole prompt while
  // reading as generous.
  const alongside = new Map(entries.map((e) => [e.id, new Set(e.claims_alongside || [])]));
  const mutual = (a, b) => alongside.get(a)?.has(b) && alongside.get(b)?.has(a);
  const oneSided = [];
  for (const [id, partners] of alongside)
    for (const p of partners)
      if (!alongside.get(p)?.has(id)) oneSided.push({ id, partner: p });
  const doubles = [];
  for (const [p, ids0] of claimants) {
    const ids = [...new Set(ids0)];
    if (ids.length < 2) continue;
    // Every PAIR among the claimants must be a declared mutual layering for the file to pass.
    let allDeclared = true;
    for (let i = 0; i < ids.length && allDeclared; i++)
      for (let j = i + 1; j < ids.length && allDeclared; j++)
        if (!mutual(ids[i], ids[j])) allDeclared = false;
    if (!allDeclared) doubles.push({ path: p, ids });
  }
  // An entry declaring a layering that never overlaps is declaring nothing, and the declaration
  // would go on reading as a disposition of something.
  const claimedBy = (id) => [...claimants].filter(([, v]) => v.includes(id)).map(([k]) => k);
  const inert = [];
  for (const [id, partners] of alongside)
    for (const p of partners) {
      const mine = new Set(claimedBy(id));
      if (!claimedBy(p).some((f) => mine.has(f))) inert.push({ id, partner: p });
    }
  return { claimed, drift, doubles, oneSided, inert, roots: tops };
};

/** The live residual over the real register and the real tree. */
export const residual = () => {
  const { claimed, drift, doubles, oneSided, inert, roots } = residualOver(BOUNDARIES);
  let universe = [];
  let untracked = [];
  let gitUnreadable = null;
  try {
    universe = execFileSync('git', ['ls-files', ...roots], { encoding: 'utf8' }).split('\n').filter(Boolean).map((p) => p.replace(/\\/g, '/'));
    untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', ...roots], { encoding: 'utf8' }).split('\n').filter(Boolean).map((p) => p.replace(/\\/g, '/'));
  } catch (e) { gitUnreadable = e.message; }
  const left = universe.filter((p) => !claimed.has(p)).sort();
  return { roots, universe, untracked, claimed, claimedInUniverse: universe.filter((p) => claimed.has(p)).length, left, drift, doubles, oneSided, inert, gitUnreadable };
};

// ---------------------------------------------------------------------------------------
// THE REGISTER.
// ---------------------------------------------------------------------------------------
export const BOUNDARIES = [

  // ═══ THE SWEPT SETS THEMSELVES, ENUMERATED ═══════════════════════════════════════════
  { id: 'SB-01', sweep: 'count-sweep.mjs', kind: 'scoped',
    what: 'Sweeps EIGHT named artefact paths per form and nothing else: the map, totals, headings and name-lies files for that form, the crosswalk classification for that form, and the three shared files irs-standards-2026.json, asset-row-shapes.json and crosswalk.433f.json.',
    assertedBy: 'count-sweep.mjs sweptFiles(form), which is the enumeration itself and is filtered by existsSync so a form missing a sidecar is not swept for it. Every file it DOES sweep has every scalar number in it disposed as derived or underivable by the MANIFEST, which is the strongest coverage in this repo. What it does not sweep is the subject of every entry below.',
    size: () => MAPPED_FORMS().reduce((n, f) => n + countSweptFiles(f).length, 0),
    claims: () => MAPPED_FORMS().flatMap((f) => countSweptFiles(f)) },

  { id: 'SB-02', sweep: 'guard-sweep.mjs', kind: 'scoped',
    what: 'Sweeps adapters/pdf/*.mjs non-recursively minus guard-sweep.mjs itself, PLUS every adapters/hubspot/*.mjs that is a local-set instrument — one that can stop a run and never talks to the portal.',
    assertedBy: 'guard-sweep.mjs sweptFiles(), which is the enumeration, and runGuardSweep, which reports the file and site counts on every run. The HubSpot half was added in this commit BECAUSE [SB-22] contradicted the reason it had been left out: four files there decide from local sets, which is the vacuous-guard shape exactly, and nine sites in them were outside every sweep. Its self-exclusion is disposed at [SB-21]; the portal-talking HubSpot tools at [SB-22]; subdirectories at [SB-90].',
    size: () => guardSweptFiles().length,
    // guard-sweep names its files RELATIVE TO adapters/pdf — bare for its own directory and
    // `../hubspot/x.mjs` for the other. Normalised here rather than re-derived, so the sweep
    // stays the single source of which files it reads.
    claims: () => guardSweptFiles().map((f) => (f.startsWith('../hubspot/') ? `adapters/hubspot/${f.slice('../hubspot/'.length)}` : `adapters/pdf/${f}`)) },

  { id: 'SB-03', sweep: 'exclusion-sweep.mjs / success-sweep.mjs', kind: 'scoped',
    what: 'Both sweep adapters/pdf/*.mjs and adapters/hubspot/*.mjs, non-recursively. Neither excludes itself.',
    assertedBy: 'Both print the file and site counts they read on every run, and exclusion-sweep additionally registers its own narrowing of the predicate universe as [EX-90] and cross-checks it. Their exclusion of subdirectories is [SB-90].',
    size: () => SWEPT_DIRS.reduce((n, d) => n + readdirSync(d).filter((f) => f.endsWith('.mjs')).length, 0),
    claims: () => SWEPT_DIRS.flatMap((d) => ls(d).filter((p) => p.endsWith('.mjs'))) },

  { id: 'SB-04', sweep: 'blanket-audit.mjs / assert-y-convention.mjs', kind: 'scoped',
    what: 'Both derive a candidate set from adapters/pdf/*.mjs, non-recursively — blanket-audit for the detector signature, assert-y-convention for the y-reporter signature.',
    assertedBy: 'Each compares its derived candidate set against a typed register IN BOTH DIRECTIONS: a candidate with no entry is a STOP, and an entry the signature no longer finds is a STALE entry. The second direction is what caught assert-y-convention’s first signature being too narrow to see page-geometry.mjs.',
    size: () => readdirSync('adapters/pdf').filter((f) => f.endsWith('.mjs')).length,
    claims: () => ls('adapters/pdf').filter((p) => p.endsWith('.mjs')) },

  // ═══ THE FILE CLASSES THE SWEEPS REMOVE ══════════════════════════════════════════════

  // ─── the one the ruling is about ──────────────────────────────────────────────────────
  { id: 'SB-10', sweep: 'count-sweep.mjs', kind: 'claiming', path: 'samples/',
    what: 'Removes every count stated in a FIXTURE’S PROSE from the manifest’s disposition. This is the boundary two wrong typed counts sat behind, and it is registered here rather than justified: the directory is full of counts and the entry says how many.',
    claim: 'No tool reads a fixture’s prose — the fill engines read the data keys and nothing parses an underscore-prefixed key — AND every count in that prose which states a figure THIS TREE CAN DERIVE agrees with the derivation.',
    count: () => sampleClaims().length,
    // THE ONE ENTRY WHOSE count() AND claims() MEASURE DIFFERENT THINGS ON PURPOSE, and it is
    // declared rather than left to be noticed: count() is the number of count-stating STRINGS
    // this boundary removes from the manifest — the size of what is excused — and claims() is
    // the number of FILES it stands over, which is what [SB-92] subtracts. 130 strings in 40
    // files is not drift, and `claims_is_not_count` is what stops [SB-92] reporting it as such.
    claims: () => ls('samples').filter((p) => p.endsWith('.json')),
    claims_is_not_count: 'count() counts count-stating strings; claims() counts the files they are in.',
    claims_alongside: ['SB-17'],
    _why_alongside: 'Both entries stand over samples/*.json and they remove DIFFERENT THINGS from the same files: this one the count-stating prose, [SB-17] the _generated_by provenance declaration. That is a layering rather than two rival reasons for one exclusion, and [SB-92] takes it as such only because it is declared here. An undeclared overlap stays a STOP.',
    // THE COMPARISON THE TWO WRONG COUNTS WERE IN. A fixture that says "all 515 form fields"
    // or "74 of this form's 425 fields" is stating the size of the FORM, which the enumerated
    // field list settles. Every such phrase is compared. What is NOT compared is a fixture
    // describing itself — "carries SIX records against five slots" — and the size of that
    // undisposed remainder is printed on every run rather than left as a silence.
    crosscheck: () => {
      const out = [];
      for (const t of sampleFormTotals()) {
        if (t.unreadable) { out.push(`[SB-10] UNREADABLE — ${t.file}: ${t.unreadable}`); continue; }
        if (t.noForm || t.claimed === undefined) continue;
        if (t.claimed !== t.derived)
          out.push(`[SB-10] CONTRADICTED — ${t.file} states ${JSON.stringify(t.phrase)} and ${t.form} enumerates ${t.derived} field(s). A fixture stating the size of the form is stating something the field list settles, and this one disagrees with it.`);
      }
      for (const c of sampleClaims()) if (c.unreadable)
        out.push(`[SB-10] UNREADABLE — ${c.file} will not parse: ${c.unreadable}. A boundary whose size cannot be read reports that it could not be read.`);
      return out;
    },
    observe: () => {
      const all = sampleClaims().filter((c) => !c.unreadable);
      const totals = sampleFormTotals().filter((t) => t.claimed !== undefined);
      const byFile = new Map();
      for (const c of all) byFile.set(c.file, (byFile.get(c.file) || 0) + 1);
      return [
        `[SB-10] ${all.length} count-stating string(s) across ${byFile.size} fixture(s) are outside count-sweep’s disposition.`,
        `[SB-10] ${totals.length} of them state a form-field total this tree derives, and all ${totals.length} are compared above.`,
        `[SB-10] the remaining ${all.length - totals.length} describe the fixture itself — row counts against slot counts, which values are distinct. Carried as [B16]; NOT disposed here, because disposing them means bringing samples/ into the manifest and that is a change to what count-sweep sweeps rather than to what it declares.`,
      ];
    } },

  { id: 'SB-17', sweep: 'count-sweep.mjs', kind: 'claiming', path: 'samples/*.json — the _generated_by declaration on each',
    what: 'A GENERATED ARTEFACT DECLARES ITS GENERATOR, and [SB-10] leans on that: a fixture whose figures were computed from their operands by a script is a different object from one somebody typed. This entry checks the declaration rather than trusting it.',
    claim: 'Every fixture that declares a _generated_by naming a path in this tree names a path that IS in this tree.',
    count: () => readdirSync('samples').filter((f) => f.endsWith('.json'))
      .filter((f) => { try { return !!JSON.parse(r(`samples/${f}`))._generated_by; } catch { return false; } }).length,
    claims: () => ls('samples').filter((p) => p.endsWith('.json')),
    claims_is_not_count: 'count() counts the fixtures that DECLARE a generator; claims() is every fixture this entry reads, declaration or not.',
    claims_alongside: ['SB-10'],
    _why_alongside: 'The other half of the layering declared at [SB-10]: that entry removes the count-stating prose from these files, this one removes the provenance declaration. Declared in BOTH directions so neither entry can be edited into standing alone while the other still names it.',
    // THE CHECK THAT CAUGHT A STALE ONE. 433boi.slice2.sample.json declared
    // "scratchpad/author-fixture.mjs, then scratchpad/fix-fixture-prose.mjs ... both recorded
    // in the commit that produced this file" and neither file had ever entered the tree. The
    // figures were fine - the gate re-derives every one of them on every run - but the
    // provenance sentence named two paths nobody could open, which is the shape of a citation
    // to coverage that does not exist. A path is only demanded when the declaration writes one;
    // a fixture saying "authored by hand" is making no claim this can check and is left alone.
    crosscheck: () => {
      const out = [];
      for (const f of readdirSync('samples').filter((x) => x.endsWith('.json'))) {
        let doc;
        try { doc = JSON.parse(r(`samples/${f}`)); }
        catch (e) { out.push(`[SB-17] UNREADABLE — samples/${f}: ${e.message}`); continue; }
        const g = doc._generated_by;
        if (typeof g !== 'string') continue;
        for (const m of g.matchAll(/\b([\w./-]+\.(?:mjs|js|ts|py|ps1))\b/g)) {
          if (!existsSync(m[1]))
            out.push(`[SB-17] CONTRADICTED — samples/${f} declares it was generated by ${m[1]}, which is not in this tree. Either the generator was never committed or it has moved; a provenance sentence naming a path nobody can open is a citation to something that does not exist.`);
        }
      }
      return out;
    } },

  { id: 'SB-11', sweep: 'count-sweep.mjs', kind: 'claiming', path: 'adapters/pdf/maps/*.labels.json, *.labels.txt',
    what: 'Removes the correlate-labels output from the manifest.',
    claim: 'These files are MECHANICAL EXTRACTIONS and declare their generator, so every number in them is derived from the PDF by construction and there is nothing for a person to have typed wrong.',
    count: () => readdirSync('adapters/pdf/maps').filter((f) => /\.labels\.(json|txt)$/.test(f)).length,
    claims: () => mapFiles(/\.labels\.(json|txt)$/),
    // A GENERATED ARTEFACT DECLARES ITS GENERATOR. That is the whole ground for this exclusion,
    // so it is the thing checked: a labels.json without a `generator` key is a file claiming to
    // be mechanical with nothing saying it is.
    crosscheck: () => {
      const out = [];
      for (const f of readdirSync('adapters/pdf/maps').filter((x) => x.endsWith('.labels.json'))) {
        let doc;
        try { doc = JSON.parse(r(`adapters/pdf/maps/${f}`)); }
        catch (e) { out.push(`[SB-11] UNREADABLE — adapters/pdf/maps/${f}: ${e.message}`); continue; }
        if (!doc.generator) out.push(`[SB-11] CONTRADICTED — adapters/pdf/maps/${f} declares no generator, and "it is mechanical" is the entire reason it is not swept.`);
      }
      return out;
    } },

  { id: 'SB-12', sweep: 'count-sweep.mjs', kind: 'scoped', path: 'adapters/pdf/maps/*.fields.json',
    what: 'Removes the enumerated field list of each form.',
    assertedBy: 'IT IS THE DENOMINATOR, NOT A CLAIM ABOUT ONE. run-form-gate.mjs step 3 requires every map target to exist verbatim in it, step 5 requires every entry in it to be referenced by the map, and step 6 requires the six partition categories to sum to its length. A wrong field list fails all three at once. It is also compared against the PDF itself by count-sweep [S-01], which derives the same figure from widget geometry.',
    count: () => readdirSync('adapters/pdf/maps').filter((f) => f.endsWith('.fields.json')).length,
    claims: () => mapFiles(/\.fields\.json$/) },

  { id: 'SB-13', sweep: 'count-sweep.mjs', kind: 'claiming',
    path: 'adapters/pdf/maps/*.intake.json, *.lineage-*.json, *.line-markers.txt, *.checkboxes.txt, *.alignment.txt, *.crosswalk-read.md',
    what: 'Removes the INTAKE RECORD of each form — what reading the blank concluded, before any map existed.',
    claim: 'An intake record is a statement about one moment and is superseded by the map rather than maintained alongside it, so a figure in it is history and not a live claim.',
    count: () => readdirSync('adapters/pdf/maps').filter((f) => /\.(intake\.json|line-markers\.txt|checkboxes\.txt|alignment\.txt|crosswalk-read\.md)$/.test(f) || /\.lineage-/.test(f)).length,
    claims: () => ls('adapters/pdf/maps').filter((p) => { const f = p.split('/').pop(); return /\.(intake\.json|line-markers\.txt|checkboxes\.txt|alignment\.txt|crosswalk-read\.md)$/.test(f) || /\.lineage-/.test(f); }),
    // THE CLAIM IS TRUE AND IT IS ALSO WHERE [B11] LIVED. 433boi.lineage-433aoi.json quotes
    // nineteen printed-run positions in a convention no other artefact in this repo uses, and
    // it concluded the wrong caption for one binding on that difference. History is not the
    // same as harmless. What is checked here is the part of the claim that IS checkable: an
    // intake record must be superseded, meaning a map for that form exists.
    crosscheck: () => {
      const out = [];
      for (const f of readdirSync('adapters/pdf/maps')) {
        const m = /^([0-9a-z]+)\.(intake\.json|lineage-)/.exec(f);
        if (!m) continue;
        if (!existsSync(`adapters/pdf/maps/${m[1]}.map.json`))
          out.push(`[SB-13] CONTRADICTED — adapters/pdf/maps/${f} is excused as a superseded intake record and ${m[1]} has no map. Nothing has superseded it, so its figures are the only statement this repo holds about that form.`);
      }
      return out;
    },
    observe: () => ['[SB-13] 433boi.lineage-433aoi.json is the file [B11] came out of: it quotes printed runs at their RUN TOPS where every map in this repo quotes baselines. It is left unedited on purpose — it is the intake record, and correcting it in place would erase what intake concluded. The correction belongs in the map and is carried as [B11].'] },

  { id: 'SB-23', sweep: 'count-sweep.mjs', kind: 'scoped',
    path: 'adapters/pdf/maps/*.json — every unswept map artefact DECLARING A GENERATOR',
    what: 'Removes the DERIVED CONSTRUCT declarations. None is in count-sweep.mjs sweptFiles(), which names eight file kinds and these are not among them, so each would sit outside every count sweep by default -- the state samples/ was in when it held two wrong typed counts, and the state 433d.mirror.json was in for the two prompts between it landing and this entry.',
    _the_population_is_derived_from_the_declaration_not_from_a_spelling: 'ITS FIRST DRAFT READ two filename patterns -- mirror.json and subject-classes.json -- which is the same object [SB-24]’s `433d.` was, and it failed the same way IMMEDIATELY. _subjects.cross-form.json declares meta.generator and gen-subject-register.mjs --check re-derives it byte for byte on every sweep; neither pattern reached it, so [SB-25]’s first draft took it under a weaker ground and that entry’s _count check then fired on a file which did not need it. The population is now every unswept map artefact THAT SAYS it has a generator, and the crosscheck below asks whether the saying is true. Precedence over [SB-24] is explicit, and [SB-92] refuses a file two entries claim.',
    claim: 'They are not unswept, and the cover is STRONGER than the manifest rather than weaker. Every scalar in each is written by a generator that also runs in --check mode, re-deriving the whole file from the pinned PDF and comparing it BYTE FOR BYTE; a difference is a STOP. The manifest disposes a number as derived or declares it underivable, and these files have no third category to fall into because no number in them was typed at all.',
    assertedBy: 'adapters/pdf/gen-mirror.mjs --check and adapters/pdf/assert-mirror.mjs, which rebuilds the declaration from the widget geometry on every `npm run sweeps`; and scratchpad/p54-433d-derive-classes.mjs --check, wired into `npm run sweeps:deep`, which re-reads the PDF, re-runs the classifier over every caption and refuses any difference from the committed bytes.',
    count: () => SB23_FILES().length,
    claims: () => SB23_FILES(),
    // THE HALF THAT COULD ROT is the claim that something re-derives them, so it is read out of
    // the file's OWN declaration of its generator and then out of package.json, rather than
    // trusted from the sentence above. A construct file whose generator is not named in it, or
    // whose generator no standing script runs, is an unregistered exclusion wearing this one's
    // words -- which is [R-34] exactly: a tool nobody runs is a tool nobody knows is broken, and
    // a re-derivation nobody runs is a claim nobody knows is false.
    crosscheck: () => {
      const out = [];
      const scripts = (() => { try { return JSON.stringify(JSON.parse(r('package.json')).scripts || {}); } catch { return ''; } })();
      for (const p of SB23_FILES()) {
        const f = p.split('/').pop();
        let gen = null;
        try { const d = JSON.parse(r(p)); gen = d._generator || d.meta?.generator || null; } catch { gen = null; }
        if (!gen) { out.push(`[SB-23] CONTRADICTED - adapters/pdf/maps/${f} is excused as re-derived on every run and names no generator of its own. An artefact that does not say what wrote it cannot be checked against it.`); continue; }
        if (!existsSync(gen)) { out.push(`[SB-23] CONTRADICTED - adapters/pdf/maps/${f} names ${gen} as its generator and that file is not in this tree.`); continue; }
        if (!scripts.includes(gen)) out.push(`[SB-23] CONTRADICTED - adapters/pdf/maps/${f} is excused on the ground that ${gen} re-derives it, and no npm script runs ${gen}. Nothing re-derives it, so every figure in it is a typed count outside every sweep.`);
      }
      return out;
    } },

  { id: 'SB-24', sweep: 'count-sweep.mjs', kind: 'claiming',
    path: 'adapters/pdf/maps/<form>.pairs.json, <form>.pairs.txt, <form>.lineage.json — every mapped form',
    what: "Removes the HYPHENLESS INTAKE RECORDS, which [SB-13] does not reach: that entry's pattern takes *.intake.json and *.lineage-*.json, and these are spelled pairs.* and lineage.json with no hyphen. They were outside every sweep and outside every boundary from the commit that landed them until [D-24], and the reason is the spelling rather than a decision anybody made -- which is [R-15]'s shape, an exclusion that is a property of the reading and that nobody wrote.",
    _this_entry_was_ITSELF_the_defect_it_records: "ITS FIRST DRAFT WAS SPELLED `433d.` AND THE FIFTH FILE WAS 433b.lineage.json. That file had been outside every sweep and every boundary since it landed, exactly as the four 433-D sidecars had been, and this entry -- written to close that class -- walked past it, because it was written against the four files somebody had just looked at. [D-24]'s own sentence is what fired: A COUNT OF WHAT WAS LOOKED AT IS NOT A POPULATION. The pattern is now derived over MAPPED_FORMS() and the form id is a capture rather than a constant, so a seventh form's lineage file is claimed by this entry the day it lands and no edit here is needed.",
    claim: "Same ground as [SB-13] and no wider: an intake record is a statement about one moment, superseded by the construct built from it rather than maintained alongside it. <form>.pairs.json is the pair structure as first read, superseded by <form>.mirror.json, which is re-derived from the page on every sweep at [SB-23]. <form>.lineage.json is the leaf-name lineage against the other forms, read once before any binding existed and superseded by the map.",
    count: () => SB24_FILES().length,
    claims: () => SB24_FILES(),
    // THE CHECKABLE HALF of "superseded" is that the successor EXISTS, and the successor is
    // DIFFERENT FOR THE TWO KINDS: a pair structure is superseded by the mirror built from it,
    // a lineage reading by the map authored after it. Naming one successor for both would have
    // demanded a mirror for 433-B, which has no pair construct and needs none.
    //
    // WRITTEN AS A LOOP RATHER THAN AS `if (files.length && !existsSync(...))`, WHICH IS WHAT
    // IT WAS. That expression is `nums.length && mismatch` -- the shape [R-17] is named for --
    // and the guard sweep reported it undisposed on the first run of this entry. A loop over
    // the files has no empty branch to fall into: no files means no rows, the count above
    // prints the same zero, and each file that IS there is checked on its own.
    crosscheck: () => {
      const out = [];
      for (const p of SB24_FILES()) {
        const f = p.split('/').pop();
        const m = /^([0-9a-z]+)[.](pairs|lineage)[.]/.exec(f);
        if (!m) { out.push(`[SB-24] UNREADABLE - ${p} was selected by this entry's own pattern and does not parse back into a form and a kind. The selector and the check disagree about what this entry stands over.`); continue; }
        const successor = m[2] === 'pairs' ? `adapters/pdf/maps/${m[1]}.mirror.json` : `adapters/pdf/maps/${m[1]}.map.json`;
        if (!existsSync(successor))
          out.push(`[SB-24] CONTRADICTED - ${p} is excused as an intake record superseded by ${successor}, and that file is not in this tree. Nothing has superseded it, so its figures are the only statement this repo holds about that reading.`);
      }
      return out;
    },
    observe: () => {
      const byForm = new Map();
      for (const p of SB24_FILES()) {
        const form = p.split('/').pop().split('.')[0];
        byForm.set(form, (byForm.get(form) || 0) + 1);
      }
      return [
        `[SB-24] ${SB24_FILES().length} hyphenless intake record(s) across ${byForm.size} form(s): ${[...byForm].map(([f, n]) => `${f} x${n}`).join(', ')}. Derived over MAPPED_FORMS(), never listed.`,
        '[SB-24] Four of them sat outside every sweep and every boundary for two prompts, not by an exclusion anybody wrote but because [SB-13]\'s pattern is spelled with a hyphen and 433-D\'s files are not. The fifth, 433b.lineage.json, sat outside THIS entry too until [SB-92] enumerated the residual — because the first draft was spelled with a form id.',
      ];
    } },

  { id: 'SB-14', sweep: 'count-sweep.mjs', kind: 'claiming', path: 'adapters/hubspot/*.md, adapters/pdf/**/*.md — EXCEPT what [SB-19] takes',
    what: 'Removes every markdown document under adapters/ — naming derivations, provisioning dry-runs and read-backs, style notes — SAVE for the files [SB-19] names, which are not run reports and are removed from this entry rather than absorbed by it.',
    claim: 'These are RUN REPORTS: each describes one execution against a live external system and is not re-derivable from this tree, because the tree does not hold the state the run was against.',
    // COUNTED FROM claims(), because the two had already drifted by one: the count went on
    // including the *.crosswalk-read.md this entry hands to [SB-13]. A boundary that reports
    // a size larger than the set it stands over is overstating its own coverage.
    count: () => BOUNDARIES.find((e) => e.id === 'SB-14').claims().length,
    // MINUS WHAT [SB-13] ALREADY HOLDS. That entry names *.crosswalk-read.md in its path and
    // keeps it on the intake-record ground; this one was taking it too, by taking every .md
    // under maps/. Same shape as RULES.md and resolved the same way — the narrower entry keeps
    // it, and the subtraction is derived from [SB-13]'s own selector rather than re-spelled.
    claims: () => { const sb13 = new Set(BOUNDARIES.find((e) => e.id === 'SB-13')?.claims?.() || []); return ['adapters/hubspot', 'adapters/pdf', 'adapters/pdf/maps'].flatMap((d) => ls(d).filter((p) => p.endsWith('.md') && !NOT_RUN_REPORTS.has(p) && !sb13.has(p))); },
    // A RUN REPORT IS ABOUT A RUN, so the checkable half is that a run happened: every one of
    // these names the tool that produced it. A .md under adapters/ naming no producing tool is
    // not a run report, and the exclusion does not cover it.
    crosscheck: () => {
      const out = [];
      for (const d of ['adapters/hubspot', 'adapters/pdf', 'adapters/pdf/maps'].filter(isDir))
        for (const f of readdirSync(d).filter((x) => x.endsWith('.md') && !NOT_RUN_REPORTS.has(`${d}/${x}`))) {
          const src = r(`${d}/${f}`);
          if (!/\.mjs|\.ts\b|npm run/.test(src))
            out.push(`[SB-14] CONTRADICTED — ${d}/${f} is excused as a run report and names no tool that produced it. Either it is not a run report, or the run it describes cannot be repeated.`);
        }
      return out;
    } },

  { id: 'SB-19', sweep: 'count-sweep.mjs', kind: 'scoped', path: 'adapters/pdf/RULES.md',
    what: 'Removes the standing-rules document from count-sweep\u2019s manifest, and removes it from [SB-14]\u2019s excusal at the same time.',
    _why_it_is_not_SB_14: 'It IS excluded from count-sweep, like every other .md under adapters/, but NOT for [SB-14]\u2019s reason. That entry excuses a document because it is a RUN REPORT \u2014 a description of one execution against a live external system, not re-derivable from this tree. RULES.md reports no run; it is a standing artefact read to decide how work is done. [SB-14]\u2019s crosscheck asks only whether the document names a tool, and RULES.md names dozens, so it passed silently under a ground that is false of it. Widening [SB-14] until it covered a file its reason does not hold for is the sentence-softening this register exists to refuse \u2014 the move [SB-22] records being refused when guard-sweep\u2019s HubSpot exclusion turned out to be false of four files. The boundary moved; the sentence did not.',
    assertedBy: 'adapters/pdf/assert-rules.mjs, which is stronger than the manifest would be rather than weaker. Every rule must parse into four parts; ids must be unique and CONTIGUOUS from R-01; every rule must name the defect that earned it or declare in as many words that it cannot, and every declared absence is reported BY NAME on every run rather than absorbed into a pass; every commit hash cited must resolve with git cat-file IN THIS REPOSITORY; every adapters/, samples/ or scratchpad/ path in a backtick span must exist, which is [R-13] applied to the file that states it \u2014 and which fired twice on its first run. The parser carries a nine-case canary aimed at its POPULATION SELECTOR, the half [D-12] left untested.',
    count: () => 1,
    claims: () => ['adapters/pdf/RULES.md'],
    crosscheck: () => {
      const out = [];
      const p = 'adapters/pdf/RULES.md';
      if (!existsSync(p)) { out.push(`[SB-19] CONTRADICTED — ${p} is not in this tree, so this boundary stands over nothing.`); return out; }
      if (!existsSync('adapters/pdf/assert-rules.mjs')) out.push('[SB-19] CONTRADICTED — the asserter this entry names, adapters/pdf/assert-rules.mjs, is not in this tree. A scoped exclusion whose named cover is absent is an unregistered exclusion.');
      // THE HALF THAT COULD ROT, AND ITS FIRST DRAFT WAS TOO WIDE. It read every count-bearing
      // line in the document and demanded each say it was derived, and it fired on 21 lines that
      // are HISTORICAL: "five flagged columns", "all six drawn pages", "four widgets" — figures
      // quoted out of the defect that earned a rule, describing what was found at one moment.
      // [SB-13] is the precedent and its words are exact: "a figure in it is history and not a
      // live claim". Demanding a derivation for those would demand that a rules document
      // re-derive a defect from 2026-08-19 on every run, which nothing in this tree can do.
      //
      // SO THE DIVISION IS BY POSITION, WHICH IS BOTH TRUE AND CHECKABLE. A figure inside a rule
      // is history. A figure ABOVE the first rule is a claim about THIS DOCUMENT — how many
      // rules it holds, how many are attributed — and that is precisely the class count-sweep
      // would otherwise own, so it is the class this entry has to keep honest. Every such figure
      // must say it is derived, and adapters/pdf/assert-rules.mjs is what derives it.
      const all = r(p).split(String.fromCharCode(10));
      const firstRule = all.findIndex((l) => l.startsWith('## [R-'));
      if (firstRule < 0) { out.push(`[SB-19] CONTRADICTED — ${p} holds no rule heading, so the position rule this entry rests on divides nothing.`); return out; }
      const header = all.slice(0, firstRule).filter((l) => statesACount(l) && !/derived|Derived|DERIVED|assert-rules/.test(l));
      if (header.length) out.push(`[SB-19] CONTRADICTED — ${header.length} line(s) ABOVE the first rule in ${p} state a count about the document itself without saying it is derived. A figure there is a claim count-sweep would otherwise own:` + header.map((l) => String.fromCharCode(10) + '      ' + l.trim().slice(0, 110)).join(''));
      return out;
    } },

  { id: 'SB-16', sweep: 'count-sweep.mjs', kind: 'claiming', path: 'adapters/hubspot/fields.registry.json',
    what: 'Removes the shared HubSpot property registry — the pre-per-form backbone of property names, read by reclassify-against-backbone.mjs, render-review.mjs and named in hs-fetch-433f.mjs.',
    _why_it_has_its_own_entry: 'It failed [SB-15] on the first run of this register, and correctly: it is neither generated nor read back. It is HAND-MAINTAINED, it carries a count of its own contents in meta.property_count, and three tools read it. Splitting it out is the honest move — the alternative was widening [SB-15] until it covered a file its reason is false of, which is the sentence-softening this whole file exists to refuse.',
    claim: 'Its one count is a count OF ITSELF and is checkable against itself: meta.property_count is the length of its own properties array.',
    count: () => 1,
    claims: () => ['adapters/hubspot/fields.registry.json'],
    crosscheck: () => {
      let doc;
      try { doc = JSON.parse(r('adapters/hubspot/fields.registry.json')); }
      catch (e) { return [`[SB-16] UNREADABLE — adapters/hubspot/fields.registry.json: ${e.message}`]; }
      const declared = doc?.meta?.property_count;
      const actual = (doc?.properties || []).length;
      if (typeof declared !== 'number')
        return [`[SB-16] CONTRADICTED — fields.registry.json declares no meta.property_count, and "its one count checks itself" is the entire reason it is not swept.`];
      if (declared !== actual)
        return [`[SB-16] CONTRADICTED — fields.registry.json declares meta.property_count ${declared} and holds ${actual} propert(ies). A hand-maintained registry that has drifted from its own tally is exactly the typed count nothing was reading.`];
      return [];
    } },

  { id: 'SB-15', sweep: 'count-sweep.mjs', kind: 'claiming', path: 'adapters/hubspot/*.json not named in sweptFiles(), other than fields.registry.json',
    what: 'Removes the HubSpot side of the tree — the field files, the crosswalks other than 433-F, the probe register and the classification files for forms other than the one being swept.',
    claim: 'Each is either a GENERATED artefact declaring its generator, or a live read-back from HubSpot that this tree cannot re-derive.',
    count: () => BOUNDARIES.find((e) => e.id === 'SB-15').claims().length,
    // The claims() mirrors the crosscheck's own `continue`: fields.registry.json is [SB-16]'s,
    // split out of this entry because it failed this entry's reason. Leaving it in the claim
    // set made this entry go on removing a file it had already handed over, and [SB-92]
    // reported the two as rival claimants on its first run — correctly.
    claims: () => ls('adapters/hubspot').filter((p) => p.endsWith('.json') && p !== 'adapters/hubspot/fields.registry.json'),
    crosscheck: () => {
      const named = new Set(MAPPED_FORMS().flatMap((f) => countSweptFiles(f)));
      const out = [];
      for (const f of readdirSync('adapters/hubspot').filter((x) => x.endsWith('.json'))) {
        const p = `adapters/hubspot/${f}`;
        if (named.has(p)) continue;
        if (f === 'fields.registry.json') continue;              // [SB-16] carries it, with its own check
        let doc;
        try { doc = JSON.parse(r(p)); } catch (e) { out.push(`[SB-15] UNREADABLE — ${p}: ${e.message}`); continue; }
        const s = JSON.stringify(doc);
        if (!/generat|_derived|read.?back|probe|fetched|_source/i.test(s))
          out.push(`[SB-15] CONTRADICTED — ${p} is excused as generated or read back and says neither. A JSON file under adapters/ that is neither swept nor generated is a hand-typed artefact nothing checks.`);
      }
      return out;
    } },

  // ─── the self-exclusions ──────────────────────────────────────────────────────────────
  { id: 'SB-21', sweep: 'guard-sweep.mjs', kind: 'scoped', path: 'guard-sweep.mjs (itself)',
    what: 'guard-sweep.mjs does not sweep its own source for vacuous-guard sites.',
    assertedBy: 'exclusion-sweep.mjs and success-sweep.mjs, which BOTH sweep adapters/pdf/*.mjs with no self-exclusion and therefore both read guard-sweep.mjs. Its own `isProse` and `fileMatches` are registered exclusion predicates ([EX-10], [EX-19]) and its success messages are classified by success-sweep. It is the only self-exclusion in the engine and it is covered by the two sweeps that have none.' },

  { id: 'SB-22', sweep: 'guard-sweep.mjs', kind: 'claiming', path: 'adapters/hubspot/*.mjs that TALK TO THE PORTAL',
    what: 'guard-sweep reads the HubSpot tools that decide from LOCAL SETS and not the ones that decide from the portal.',
    _this_entry_was_contradicted_and_the_sweep_moved: 'It used to read "guard-sweep reads only adapters/pdf; the HubSpot tools are outside it", on the ground that the HubSpot tools write to a live system and read the result back. That reason is true of most of them and FALSE OF FOUR — gen-fields-from-crosswalk.mjs, gen-fields-from-map.mjs, reclassify-against-backbone.mjs and validate-crosswalk.mjs never touch the portal, decide from local sets and can stop a run. Nine guard sites, outside every sweep, behind a sentence nobody had compared to the files. The remedy was to move the sweep rather than to soften the sentence: guard-sweep now derives its HubSpot half from the SAME predicate this entry cross-checks with, so the sweep and the register cannot drift into disagreeing about which file is which.',
    claim: 'Every HubSpot tool this sweep does NOT read talks to the portal, so its outcome is what the portal says and not what a local set contains — which is not the vacuous-guard shape.',
    count: () => readdirSync('adapters/hubspot').filter((f) => f.endsWith('.mjs')).length,
    claims: () => ls('adapters/hubspot').filter((p) => p.endsWith('.mjs')),
    // THE HALF THAT IS CHECKABLE: a HubSpot tool that reports on a LOCAL set rather than on a
    // portal read is exactly the shape guard-sweep exists for, and is not covered by this
    // reason. The discriminator is mechanical — does the file talk to the portal at all.
    crosscheck: () => {
      const out = [];
      const swept = new Set(guardSweptFiles());
      for (const f of readdirSync('adapters/hubspot').filter((x) => x.endsWith('.mjs'))) {
        if (swept.has(`../hubspot/${f}`)) continue;              // read by the sweep; not excluded
        const src = r(`adapters/hubspot/${f}`);
        const portal = /fetch\(|hs-lib|hubapi/.test(src);
        const stops = /process\.exit|exitCode/.test(src);
        if (!portal && stops)
          out.push(`[SB-22] CONTRADICTED — adapters/hubspot/${f} is excluded from guard-sweep, can stop a run, and never talks to the portal, so its verdict comes from a local set. That is the vacuous-guard shape and this exclusion does not cover it.`);
      }
      return out;
    } },

  // ─── the class nobody wrote an entry for ──────────────────────────────────────────────
  { id: 'SB-20', sweep: 'every sweep', kind: 'scoped', path: 'adapters/pdf/firing-proofs/',
    what: "A SUBDIRECTORY OF A SWEPT DIRECTORY, created in the commit that landed [R-28]. Every sweep in this engine reads non-recursively, so it would sit outside all of them by default — which is exactly the state samples/ was in when it held two wrong typed counts. [SB-90] found it on its first run after the directory appeared, which is that entry working rather than an oversight being noticed.",
    claim: "It is not unswept. adapters/pdf/assert-firing-proofs.mjs reads every file in it, declares its directory, filter and classifier in three lines it then prints, and judges every break entry against the five conditions in adapters/pdf/firing-proofs.mjs. A file in here that the classifier does not recognise is a STOP, and a record naming no registered claim is a STOP, so the directory cannot grow a member nothing reads.",
    assertedBy: "adapters/pdf/assert-firing-proofs.mjs — both directions: a record with no claim and a claim with no record are each a STOP.",
    count: () => (isDir('adapters/pdf/firing-proofs') ? readdirSync('adapters/pdf/firing-proofs').length : 0),
    claims: () => ls('adapters/pdf/firing-proofs'),
    crosscheck: () => {
      const out = [];
      const d = 'adapters/pdf/firing-proofs';
      const reader = 'adapters/pdf/assert-firing-proofs.mjs';
      if (!existsSync(reader)) { out.push('[SB-20] CONTRADICTED — the reader this entry names, ' + reader + ', is not in this tree. A scoped exclusion whose named cover is absent is an unregistered exclusion.'); return out; }
      // THE HALF THAT COULD ROT: the reader could stop pointing at this directory and the
      // claim above would go on being printed. So the path is read out of the reader's own
      // declaration rather than compared against a second copy of the string.
      if (!r(reader).includes('RECORD_DIR')) out.push('[SB-20] CONTRADICTED — ' + reader + ' no longer mentions RECORD_DIR, so nothing here says it reads this directory.');
      if (!r('adapters/pdf/firing-proofs.mjs').includes("RECORD_DIR = '" + d + "'")) out.push('[SB-20] CONTRADICTED — firing-proofs.mjs no longer declares RECORD_DIR as ' + d + ', so the directory this entry excuses and the one the reader reads are two different places.');
      if (isDir(d) && !readdirSync(d).length) out.push('[SB-20] EMPTY — the directory exists and holds nothing. A boundary over an empty set excuses nothing and hides the fact that no proof has been recorded.');
      return out;
    } },

  { id: 'SB-90', sweep: 'every sweep', kind: 'claiming', path: 'every SUBDIRECTORY of every swept directory',
    what: 'EVERY sweep in this engine reads its directories with a NON-RECURSIVE readdirSync, so every subdirectory of every swept directory is outside every sweep. Nobody wrote this exclusion; it is a property of the reading, and it is the exact shape `samples/` had.',
    claim: 'Every such subdirectory is either gitignored scratch, or a binary/asset directory that carries no prose claim.',
    count: () => ['adapters/pdf', 'adapters/hubspot'].reduce((n, d) => n + readdirSync(d).filter((x) => isDir(`${d}/${x}`)).length, 0),
    // DERIVED FROM THE TREE ON EVERY RUN, never typed. A directory that appears under a swept
    // one is a STOP until somebody says which of the two states it is in — which is the whole
    // remedy for the class, as opposed to the remedy for the instance.
    crosscheck: () => {
      const ignored = existsSync('.gitignore') ? r('.gitignore').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : [];
      const covered = (p) => ignored.some((g) => p === g.replace(/\/$/, '') || p.startsWith(g.replace(/\/$/, '') + '/'));
      const DECLARED_SUBDIRS = { 'adapters/pdf/forms': 'the blank PDFs and their SHA pin file — bytes and one checksum list, no prose', 'adapters/pdf/maps': 'the map artefacts, which count-sweep sweeps BY NAME rather than by directory: sweptFiles() lists four per form plus the shared three' , 'adapters/pdf/firing-proofs': 'the firing-proof records, read exhaustively by adapters/pdf/assert-firing-proofs.mjs with its directory, filter and classifier declared and printed — [SB-20]' };
      const out = [];
      for (const d of ['adapters/pdf', 'adapters/hubspot'])
        for (const sub of readdirSync(d).filter((x) => isDir(`${d}/${x}`))) {
          const p = `${d}/${sub}`;
          if (covered(p) || DECLARED_SUBDIRS[p]) continue;
          out.push(`[SB-90] UNREGISTERED SUBDIRECTORY — ${p} sits under a swept directory and no sweep reads it, because every sweep in this engine reads non-recursively. It is not gitignored and it is not a declared asset directory. Say which it is, or bring it into a sweep. This is how samples/ came to hold two wrong counts nothing would ever have read.`);
        }
      return out;
    } },

  { id: 'SB-18', sweep: 'every sweep', kind: 'claiming', path: 'scratchpad/',
    what: 'A TOP-LEVEL DIRECTORY THAT NO SWEEP READS, and it entered the tree in the same commit as this entry. Every sweep in this engine reads adapters/pdf and adapters/hubspot; scratchpad/ is beside them, not under them, so [SB-90] - which derives the SUBDIRECTORIES of the swept directories - does not see it either. Registering it is the point: the boundary was opened deliberately and would otherwise be exactly the shape samples/ had.',
    _why_the_files_are_there_at_all: 'A GENERATED ARTEFACT DECLARES ITS GENERATOR, and until this commit two fixtures declared generators that had never been committed - see [SB-17], which fired on precisely that. Committing the one-shot generator that produced a fixture is what makes the declaration true. The alternative, deleting the generators and softening the sentence, is the move this whole file exists to refuse.',
    claim: 'Nothing in the swept tree depends on anything in scratchpad/. These are one-shot generators and read-back probes: they READ the engine and the artefacts, and no engine file imports them, so they cannot change what any sweep or gate decides.',
    // EVERY FILE, NOT EVERY .mjs. This entry's `what` said "a top-level directory of .mjs
    // files" and the directory holds two .txt blocks besides — 433b-slice4-blanket-block.txt
    // and 433b-slice4-countsweep-block.txt — which were in no sweep and in no boundary, the
    // state this entry was written to end. [SB-92] found them; the claim below covers them.
    count: () => (isDir('scratchpad') ? ls('scratchpad').length : 0),
    claims: () => ls('scratchpad'),
    // THE DIRECTION THAT MATTERS IS INWARD. A scratch script importing the engine is fine and
    // is what these do. An ENGINE file importing a scratch script would put unswept code on the
    // path of a gate decision, which is the thing this claim forbids and the thing that would
    // make the exclusion unsound.
    crosscheck: () => {
      const out = [];
      if (!isDir('scratchpad')) return out;
      for (const d of ['adapters/pdf', 'adapters/hubspot'])
        for (const f of readdirSync(d).filter((x) => x.endsWith('.mjs'))) {
          const src = r(`${d}/${f}`);
          if (/from\s+['"][^'"]*scratchpad\//.test(src) || /require\(['"][^'"]*scratchpad\//.test(src))
            out.push(`[SB-18] CONTRADICTED — ${d}/${f} imports from scratchpad/, which no sweep reads. An engine file depending on unswept code puts it on the path of a gate decision, and "these are one-shot scripts nothing depends on" stops being true.`);
        }
      return out;
    },
    observe: () => {
      if (!isDir('scratchpad')) return ['[SB-18] scratchpad/ does not exist in this tree.'];
      const files = readdirSync('scratchpad').filter((f) => f.endsWith('.mjs')).sort();
      const others = ls('scratchpad').map((p) => p.split('/').pop()).filter((f) => !f.endsWith('.mjs')).sort();
      const cited = new Set();
      for (const f of readdirSync('samples').filter((x) => x.endsWith('.json'))) {
        let doc; try { doc = JSON.parse(r(`samples/${f}`)); } catch { continue; }
        const g = doc._generated_by;
        if (typeof g === 'string') for (const m of g.matchAll(/scratchpad\/([\w.-]+\.mjs)/g)) cited.add(m[1]);
      }
      return [
        `[SB-18] ${files.length} script(s) in scratchpad/: ${files.join(', ')}.`,
        `[SB-18] ${files.filter((f) => cited.has(f)).length} of them is named by a fixture's _generated_by, which [SB-17] checks the other way round; the rest are read-back probes, which make no artefact and are cited from the commit that ran them.`,
        `[SB-18] and ${others.length} non-script file(s): ${others.join(', ') || 'none'}. These are inert text blocks spliced into a swept file by one of the scripts above, kept beside it so the splice is readable. They were in no sweep, in no boundary and in this entry's OWN count of nothing until [SB-92] enumerated the residual — this entry counted .mjs and stood over a directory.`,
      ];
    } },

  // ─── the four classes [SB-92]'s first run found, each with a ground of its own ─────────
  //
  // NONE OF THESE IS A NEW EXCLUSION. Every one of them was ALREADY outside every sweep and
  // outside every boundary; what changed is that something enumerated them. They are written
  // one entry per ground rather than one entry per file, because "these fourteen files are
  // fine" is the sentence-softening this register exists to refuse.

  { id: 'SB-25', sweep: 'count-sweep.mjs', kind: 'claiming', path: 'adapters/pdf/maps/_*.json — the HAND-MAINTAINED cross-form registers',
    what: 'Removes the registers that belong to no single form and are NOT re-derived: _carried.cross-form.json and _cross-form-coordinates.json. count-sweep sweeps BY FORM — sweptFiles(form) names four per-form artefacts plus three shared ones — and a file belonging to every form and to none is reached by no form-keyed pattern.',
    _why_subjects_cross_form_is_NOT_here: 'It declares meta.generator and adapters/pdf/gen-subject-register.mjs --check re-derives it BYTE FOR BYTE on every `npm run sweeps`. That is [SB-23]’s ground and it is STRONGER than this entry’s, so it is taken by that entry rather than absorbed into this one. Widening a boundary until it covers a file whose stronger cover already holds is the same sentence-softening [SB-19] refused of [SB-14], one directory over. The residual, not a person, is what forced the distinction: [SB-25]’s first draft took all three, and its _count check then fired on _subjects.cross-form.json because that file counts an OBJECT of forms and a nested total of quotes, neither of which is an array beside it — a check written for the wrong file, on a file that did not need it.',
    claim: 'Each is read by named engine tools rather than by a person, its ids are enumerated in both directions by adapters/pdf/register-ids.mjs on every sweep, and the count it states about itself is derived from its own contents here.',
    count: () => mapFiles(/^_.*\.json$/).filter((p) => !SB23_FILES().includes(p)).length,
    claims: () => mapFiles(/^_.*\.json$/).filter((p) => !SB23_FILES().includes(p)),
    // THE HALF THE RESIDUAL EXPOSED. [S-07] in count-sweep.mjs derives `_carried._count` from
    // the arrays beside it — and its `file` predicate is /\.map\.json$/, so it covers the six
    // MAPS and not the CROSS-FORM register, which carries a `_count` of exactly the same shape
    // and had nothing deriving it. That is [R-13] again: a check whose population is one set
    // and a claim living in another. Asked here, of the file the manifest cannot reach.
    crosscheck: () => {
      const out = [];
      const reg = 'adapters/pdf/register-ids.mjs';
      const regSrc = existsSync(reg) ? r(reg) : null;
      if (regSrc === null) out.push(`[SB-25] CONTRADICTED — ${reg} is not in this tree, and "its ids are enumerated by the register" is the entire ground of this exclusion.`);
      for (const p of mapFiles(/^_.*\.json$/).filter((x) => !SB23_FILES().includes(x))) {
        const base = p.split('/').pop();
        if (regSrc !== null && !regSrc.includes(base))
          out.push(`[SB-25] CONTRADICTED — ${p} is excused on the ground that ${reg} enumerates its ids, and that file does not name it. Nothing reads its rows in both directions.`);
        let doc;
        try { doc = JSON.parse(r(p)); } catch (e) { out.push(`[SB-25] UNREADABLE — ${p}: ${e.message}`); continue; }
        // The [S-07] shape, asked of a file [S-07] cannot reach. A register carrying a `_count`
        // must agree with what it counts, and a register carrying none is making no claim here.
        //
        // TWO SHAPES, BOTH REAL IN THIS DIRECTORY AND NEITHER GUESSED AT. An OBJECT of counts
        // is keyed by the array each counts (_carried.cross-form.json: open, resolved). A BARE
        // SCALAR counts the file's single array (_cross-form-coordinates.json: 30 declarations)
        // — and it is only readable as such while there IS exactly one, so two arrays under a
        // scalar _count is a STOP rather than a pick.
        const c = doc._count;
        if (c === undefined) continue;
        const arraysIn = Object.entries(doc).filter(([, v]) => Array.isArray(v));
        if (typeof c === 'number') {
          if (arraysIn.length !== 1) { out.push(`[SB-25] CONTRADICTED — ${p} declares a bare _count of ${c} and holds ${arraysIn.length} array(s) (${arraysIn.map(([k]) => k).join(', ') || 'none'}). A bare count is readable only against exactly one, and choosing between two would be inventing the universe the figure is missing.`); continue; }
          if (c !== arraysIn[0][1].length) out.push(`[SB-25] CONTRADICTED — ${p} declares _count = ${c} and its ${arraysIn[0][0]}[] holds ${arraysIn[0][1].length}.`);
          continue;
        }
        if (typeof c !== 'object' || c === null) { out.push(`[SB-25] CONTRADICTED — ${p} declares a _count that is neither a number nor an object of them (${typeof c}), so nothing can be derived to compare it with.`); continue; }
        for (const [k, claimed] of Object.entries(c)) {
          const derived = Array.isArray(doc[k]) ? doc[k].length : null;
          if (derived === null) { out.push(`[SB-25] CONTRADICTED — ${p} declares _count.${k} = ${JSON.stringify(claimed)} and holds no array named "${k}" for it to be a count OF. A figure without its universe is not a figure.`); continue; }
          if (claimed !== derived) out.push(`[SB-25] CONTRADICTED — ${p} declares _count.${k} = ${claimed} and its ${k}[] holds ${derived}. This is the [S-07] check, which covers *.map.json and cannot reach this file.`);
        }
      }
      return out;
    },
    observe: () => mapFiles(/^_.*\.json$/).filter((p) => !SB23_FILES().includes(p)).map((p) => {
      let doc; try { doc = JSON.parse(r(p)); } catch { return `[SB-25] ${p} — UNREADABLE`; }
      const c = doc._count;
      const shown = c === undefined ? 'no _count declared (no claim to check)'
        : typeof c === 'number' ? `_count=${c}, derived from the file's one array`
        : Object.entries(c).map(([k, v]) => `${k}=${v}`).join(', ');
      return `[SB-25] ${p} — ${shown}`;
    }) },

  { id: 'SB-26', sweep: 'every sweep', kind: 'claiming', path: 'adapters/pdf/forms/ — the pinned blank PDFs and forms.sha256',
    what: 'Removes the six blank source PDFs and the checksum list beside them. [SB-90] declares the DIRECTORY as an asset directory carrying no prose; that is a statement about the directory and it left the FILES claimed by nothing, which is the level [SB-92] reads at.',
    claim: 'The PDFs carry no prose and no typed count — they are bytes, and WHICH bytes is proved on every gate run at step 1, from the drawn page rather than from a file name: the revision and catalogue number the map pins are read out of the inflated page content and a mismatch is a STOP. forms.sha256 IS a typed claim, six of them, and it is checked below.',
    count: () => ls('adapters/pdf/forms').length,
    claims: () => ls('adapters/pdf/forms'),
    // WHAT THE RESIDUAL FOUND HERE, AND IT IS THE REASON THIS ENTRY IS `claiming` RATHER THAN
    // `scoped`: forms.sha256 is SIX TYPED HASHES AND NOTHING IN THE ENGINE READ IT. Not one
    // tool under adapters/ opens it; the gate pins the document by revision and catalogue and
    // prints a sha it compares to nothing. A pin file nobody verifies is [R-34] exactly — a
    // tool nobody runs is a tool nobody knows is broken — and the remedy is to make the claim
    // live rather than to declare the file harmless. It is offline, it needs no credential,
    // and it is [R-31]'s preference: a structural check beats a reading of a moment.
    crosscheck: () => {
      const out = [];
      const D = 'adapters/pdf/forms';
      const pinPath = `${D}/forms.sha256`;
      if (!existsSync(pinPath)) return [`[SB-26] CONTRADICTED — ${pinPath} is not in this tree, so the six blanks this engine fills are pinned by nothing.`];
      const pinned = new Map();
      for (const line of r(pinPath).split('\n')) {
        const m = /^([0-9a-fA-F]{64})\s+\*?(\S+)\s*$/.exec(line.trim());
        if (line.trim() && !m) { out.push(`[SB-26] UNREADABLE — a line in ${pinPath} is not a sha256 record: ${JSON.stringify(line.slice(0, 60))}. A pin file the reader cannot parse is a pin nobody is checking, which is the state this whole entry found it in.`); continue; }
        if (m) pinned.set(m[2], m[1].toLowerCase());
      }
      if (!pinned.size) return [...out, `[SB-26] CONTRADICTED — ${pinPath} parsed to zero records. A checksum list over an empty set proves nothing, and every "matches" below would be vacuous.`];
      for (const [file, want] of pinned) {
        const p = `${D}/${file}`;
        if (!existsSync(p)) { out.push(`[SB-26] CONTRADICTED — ${pinPath} pins ${file} and that file is not in ${D}/.`); continue; }
        const got = createHash('sha256').update(readFileSync(p)).digest('hex');
        if (got !== want) out.push(`[SB-26] CONTRADICTED — ${p} hashes to ${got} and ${pinPath} pins ${want}. The blank this engine fills is not the blank the maps were authored against, and every binding on it is a binding to a cell that may have moved.`);
      }
      // BOTH DIRECTIONS. A blank in the directory that the pin file does not name is a document
      // nothing has fixed, and it is the direction that would let a seventh form's PDF arrive
      // unpinned while every line above went on saying "matches".
      for (const p of ls(D)) {
        const f = p.split('/').pop();
        if (f === 'forms.sha256' || pinned.has(f)) continue;
        out.push(`[SB-26] CONTRADICTED — ${p} sits in the forms directory and ${pinPath} does not pin it. An unpinned blank can be replaced by a later revision with no line in this tree changing.`);
      }
      // THE FORM SIDE IS DELIBERATELY NOT ASKED HERE, and the absence is declared rather than
      // left as a silence. A first draft matched a mapped form to a pinned blank by chopping
      // characters off both names — the shape [R-36] refuses, a guess dressed as a check — and
      // it was answering a question adapters/pdf/target-root.mjs already owns and answers from
      // the map's own declaration. The two directions above CLOSE THIS DIRECTORY: every pinned
      // name resolves to a file here, and every file here is pinned. Which blank belongs to
      // which form is a different question and it has a different tool.
      return out;
    },
    observe: () => {
      const D = 'adapters/pdf/forms';
      const n = ls(D).filter((p) => p.endsWith('.pdf')).length;
      return [`[SB-26] ${n} blank PDF(s) and 1 pin file. Every hash in the pin file is RECOMPUTED on this run — until this commit nothing in the engine opened it, and six typed hashes sat behind a boundary nobody had written.`];
    } },

  { id: 'SB-27', sweep: 'every sweep', kind: 'claiming', path: 'adapters/hubspot/New-HubSpotProperties.ps1',
    what: 'Removes the ONE non-.mjs, non-.json, non-.md file under adapters/. Every sweep in this engine selects by extension — guard-sweep, exclusion-sweep and success-sweep take *.mjs, count-sweep takes named .json artefacts, [SB-14] takes *.md — so a .ps1 is outside all of them by the shape of every selector, which is [R-15] again.',
    claim: 'It is SUPERSEDED FOR CREATES, says so in its own .NOTES, and the successor is adapters/hubspot/hs-provision.mjs. It is kept rather than deleted because it is the artefact [R-23] and [R-27] were earned on — PowerShell 5.1 sending a string body as ISO-8859-1, one em-dash costing 27 permanent property creations — and deleting it would erase the object the rule is about.',
    count: () => ls('adapters/hubspot').filter((p) => p.endsWith('.ps1')).length,
    claims: () => ls('adapters/hubspot').filter((p) => p.endsWith('.ps1')),
    // THE CHECKABLE HALF OF "SUPERSEDED" IS THE SAME ONE [SB-13] AND [SB-24] CHECK: the
    // successor exists. AND ONE MORE, WHICH IS THE HALF THAT COULD ROT — a superseded
    // provisioner that a standing script still RUNS is not superseded, it is live, and the
    // transport defect [R-27] records would be one npm invocation away.
    crosscheck: () => {
      const out = [];
      const scripts = (() => { try { return JSON.stringify(JSON.parse(r('package.json')).scripts || {}); } catch { return null; } })();
      if (scripts === null) out.push('[SB-27] UNREADABLE — package.json will not parse, so "no standing script runs it" is unchecked rather than true.');
      for (const p of ls('adapters/hubspot').filter((x) => x.endsWith('.ps1'))) {
        const src = r(p);
        if (!/SUPERSEDED/i.test(src))
          out.push(`[SB-27] CONTRADICTED — ${p} is excused as a superseded provisioner and its own source does not say so. A supersession nobody wrote down is a claim this register is making on the file's behalf.`);
        if (!existsSync('adapters/hubspot/hs-provision.mjs'))
          out.push(`[SB-27] CONTRADICTED — ${p} is excused as superseded by adapters/hubspot/hs-provision.mjs, which is not in this tree.`);
        const base = p.split('/').pop();
        if (scripts !== null && scripts.includes(base))
          out.push(`[SB-27] CONTRADICTED — ${p} is excused as superseded and package.json still runs it. PowerShell 5.1's Invoke-RestMethod sends a string body as ISO-8859-1; that is [R-27], and it cost 27 permanent property creations.`);
      }
      return out;
    } },

  // ═══ THE RESIDUAL — [D-24] ═══════════════════════════════════════════════════════════
  { id: 'SB-92', sweep: 'every sweep', kind: 'claiming', path: 'EVERY TRACKED FILE under every swept root — minus what is swept, minus what is claimed',
    what: 'THE POPULATION, DERIVED. Every entry above says what it removes; nothing until this one said what is left. A sidecar dropped into adapters/pdf/maps/ was swept by count-sweep only if its name matched one of the kinds sweptFiles() lists, and covered by this register only if it matched a pattern somebody had written — and a file matching neither was in no sweep, in no boundary, and NOTHING SAID SO.',
    claim: 'The residual is EMPTY. Every tracked file under every root this register reaches is either read by a sweep or claimed by a registered boundary, and a file that is neither is a STOP naming it.',
    // THE ROOTS ARE DERIVED, NOT LISTED. Taking a typed list of directories here would be the
    // defect one level out — a residual whose universe somebody chose is a residual over what
    // somebody looked at, which is [D-24]'s own sentence and [R-31]'s factor of forty-eight.
    // So the roots come from the register itself: the swept directories, plus the directory of
    // every path any entry claims. Adding an entry that claims a file in a new directory brings
    // that directory into the universe on the same run, with no edit here.
    //
    // AND THE UNIVERSE IS WHAT GIT TRACKS. [SB-91]'s ground is already git — "a committed file
    // is one somebody is relying on" — so untracked scratch is out by that entry's reason
    // rather than by a second copy of it. Untracked-but-not-ignored files are NOT silently
    // dropped: they are counted and reported, because a figure without its universe is not a
    // figure, and a residual that quietly ignored a class would be the thing it exists to find.
    count: () => residual().universe.length,
    claims: () => [],
    claims_is_not_count: 'This entry claims nothing; it is the check that everything else claims enough. count() is the size of the universe it reads.',
    crosscheck: () => {
      const R = residual();
      const out = [];
      if (R.gitUnreadable) return [`[SB-92] UNREADABLE — git ls-files could not be run (${R.gitUnreadable}), so the universe could not be derived. A residual whose universe cannot be read reports that it could not be read. Never a pass.`];
      if (!R.universe.length) return ['[SB-92] CONTRADICTED — the derived universe is EMPTY, so "the residual is empty" is vacuously true and this entry is checking nothing. That is the vacuous-guard shape inside the guard written to end it.'];
      for (const p of R.left)
        out.push(`[SB-92] UNCLAIMED FILE — ${p} is tracked, sits under a swept root, is read by no sweep and is claimed by no registered boundary. Say which it is, or bring it into a sweep. This is how 433d.pairs.json, 433d.pairs.txt, 433d.lineage.json and 433d.mirror.json sat outside everything for two prompts, and how 433b.lineage.json sat outside the entry written to end that.`);
      // DRIFT BETWEEN AN ENTRY'S OWN TWO ANSWERS. Where an entry counts files and also names
      // them, the two must agree; where they measure different things it says so in as many
      // words, and a silent disagreement is what this reports.
      for (const d of R.drift)
        out.push(`[SB-92] DRIFT — [${d.id}] reports count() ${d.count} and claims() ${d.claims} file(s) and declares no reason they differ. One of the two is describing a set the entry does not stand over; add \`claims_is_not_count\` with the reason, or make them agree.`);
      // THE OTHER HALF OF NOT_RUN_REPORTS' SENTENCE. That declaration exists so [SB-14] and
      // [SB-19] "cannot drift into both claiming the same file or neither claiming it", and
      // until this entry only the NEITHER half was checked by anything. A file two entries hold
      // under two different grounds means one of the grounds is false of it, and the register
      // would go on printing both.
      for (const d of R.oneSided)
        out.push(`[SB-92] ONE-SIDED LAYERING — [${d.id}] declares claims_alongside [${d.partner}] and [${d.partner}] does not declare it back. A one-sided declaration is an entry excusing its own overlap, which is the excusal this register exists to refuse.`);
      for (const d of R.inert)
        out.push(`[SB-92] INERT LAYERING — [${d.id}] and [${d.partner}] declare a layering and claim no file in common. A declared exemption that exempts nothing reads as a disposition and is not one; it is [R-28]'s sole_declared_line, whose filter matched nothing for a prompt while reading as generous.`);
      for (const d of R.doubles)
        out.push(`[SB-92] DOUBLE-CLAIMED — ${d.path} is claimed by ${d.ids.map((i) => `[${i}]`).join(' and ')}. Two entries removing one file rest on two different grounds, and at most one of them is the true reason. Take it in one entry and remove it from the other, as [SB-19] was split out of [SB-14].`);
      return out;
    },
    observe: () => {
      const R = residual();
      if (R.gitUnreadable) return [`[SB-92] universe UNREADABLE: ${R.gitUnreadable}`];
      const byRoot = new Map();
      for (const p of R.left) { const k = p.split('/').slice(0, -1).join('/'); byRoot.set(k, (byRoot.get(k) || 0) + 1); }
      return [
        `[SB-92] roots derived from the register: ${R.roots.join(', ')}.`,
        `[SB-92] ${R.universe.length} tracked file(s) in the universe; ${R.claimedInUniverse} claimed or swept; RESIDUAL ${R.left.length}.`,
        `[SB-92] ${R.untracked.length} file(s) under those roots are untracked and not gitignored — reported, not failed: an uncommitted file is not yet a file anybody relies on. ${R.untracked.length ? R.untracked.slice(0, 5).join(', ') + (R.untracked.length > 5 ? ', …' : '') : ''}`,
        ...(R.left.length ? [`[SB-92] residual by directory: ${[...byRoot].map(([k, n]) => `${k} x${n}`).join(', ')}.`] : []),
      ];
    } },

  { id: 'SB-91', sweep: 'every sweep', kind: 'scoped', path: 'gitignored scratch: adapters/pdf/tmp/, adapters/pdf/out/, adapters/hubspot/backup/, samples/*.from-hubspot-*.json',
    what: 'Removes build output, negative-test harnesses, regression baselines, parked copies of the tools, and live HubSpot records containing customer PII.',
    assertedBy: 'git itself. Every path here is in .gitignore AND untracked, which is checked below — an exclusion resting on "it is scratch" is contradicted the moment a file in it is committed, because a committed file is one somebody is relying on.',
    count: () => ['adapters/pdf/tmp', 'adapters/pdf/out', 'adapters/hubspot/backup'].filter(isDir).length },
];

// ---------------------------------------------------------------------------------------
// THE CANARY.
//
// A synthetic swept set and a synthetic tree, in memory, in which a fixture claims a form-field
// total that the synthetic field list contradicts. [SB-10]'s comparison must find exactly one
// contradiction. It is the two-wrong-counts defect in miniature, and it runs before any real
// boundary is trusted — a comparison that stops comparing reports a clean tree, which is the
// failure this whole file is about.
// ---------------------------------------------------------------------------------------
export const runCanary = () => {
  const synthetic = '{"_what_this_covers":"canary form slice - all 999 form fields are bound"}';
  const derived = 267;
  const found = [];
  for (const re of FORM_TOTAL) for (const m of synthetic.matchAll(re))
    if (Number(m[1]) !== derived) found.push(m[0]);
  // AND THE OTHER DIRECTION, or a pattern matching nothing would pass the line above.
  const agreeing = `{"_x":"all ${derived} form fields are bound"}`;
  const agreed = [];
  for (const re of FORM_TOTAL) for (const m of agreeing.matchAll(re)) agreed.push(m[0]);
  return {
    ok: found.length === 1 && agreed.length === 1,
    contradicted: found.length, matched: agreed.length,
    why: 'one synthetic fixture claiming 999 fields against a derived 267 must yield exactly one contradiction, and one claiming the derived figure must still be MATCHED — otherwise a dead pattern would pass the first test by finding nothing',
  };
};

// ---------------------------------------------------------------------------------------
// THE RESIDUAL'S CANARY — [SB-92], and it plants BOTH directions.
//
// A residual that subtracts everything reports an empty remainder and looks exactly like a
// clean tree. A residual that subtracts nothing reports the whole tree and would be turned off
// within a day, which is [R-10]. So the plant is a synthetic register over a synthetic file
// list, and it must:
//
//   find the ONE file no synthetic entry claims                       (it can still see a gap)
//   find NOTHING when an entry is added that claims it                (it can still be satisfied)
//   find the DRIFT when an entry's count() and claims() disagree      (the second direction)
//   find NOTHING when that same entry declares why they differ        (the declared exemption)
//
// The fourth is the one [R-28]'s `sole_declared_line` repair is a warning about: an exemption
// whose filter matches nothing is an exemption that is dead while reading as generous.
export const runResidualCanary = () => {
  const FILES = ['x/a.json', 'x/b.json', 'x/c.txt'];
  const mk = (claims, extra = {}) => ({ id: 'CANARY', kind: 'scoped', assertedBy: 'canary', claims: () => claims, ...extra });

  const gap = residualOver([mk(['x/a.json', 'x/b.json'])], ['x']);
  const leftGap = FILES.filter((f) => !gap.claimed.has(f));

  const closed = residualOver([mk(FILES)], ['x']);
  const leftClosed = FILES.filter((f) => !closed.claimed.has(f));

  const drifting = residualOver([mk(FILES, { count: () => 99 })], ['x']);
  const declared = residualOver([mk(FILES, { count: () => 99, claims_is_not_count: 'declared' })], ['x']);

  // AND THE DOUBLE-CLAIM, IN BOTH DIRECTIONS. Two synthetic entries over one file must be
  // reported; the same file under one entry twice over must not, or the check would fire on
  // every entry whose claims() returns a duplicate path.
  const twoEntries = residualOver([
    { id: 'CANARY-A', kind: 'scoped', assertedBy: 'canary', claims: () => ['x/a.json'] },
    { id: 'CANARY-B', kind: 'scoped', assertedBy: 'canary', claims: () => ['x/a.json', 'x/b.json'] },
  ], ['x']);
  const oneEntryTwice = residualOver([mk(['x/a.json', 'x/a.json'])], ['x']);

  // AND THE DECLARED LAYERING, in all three of its states: mutual (allowed), one-sided
  // (refused), and mutual-but-touching-nothing (refused). The third is the one that would
  // otherwise sit in the register reading as a disposition of an overlap that had gone away.
  const A = (claims, along) => ({ id: 'CANARY-A', kind: 'scoped', assertedBy: 'canary', claims: () => claims, claims_alongside: along });
  const B = (claims, along) => ({ id: 'CANARY-B', kind: 'scoped', assertedBy: 'canary', claims: () => claims, claims_alongside: along });
  const layered  = residualOver([A(['x/a.json'], ['CANARY-B']), B(['x/a.json'], ['CANARY-A'])], ['x']);
  const lopsided = residualOver([A(['x/a.json'], ['CANARY-B']), B(['x/a.json'], [])], ['x']);
  const empty    = residualOver([A(['x/a.json'], ['CANARY-B']), B(['x/b.json'], ['CANARY-A'])], ['x']);

  const ok = leftGap.length === 1 && leftGap[0] === 'x/c.txt'
    && leftClosed.length === 0
    && drifting.drift.length === 1 && drifting.drift[0].count === 99 && drifting.drift[0].claims === 3
    && declared.drift.length === 0
    && twoEntries.doubles.length === 1 && twoEntries.doubles[0].path === 'x/a.json'
    && oneEntryTwice.doubles.length === 0
    && layered.doubles.length === 0 && layered.oneSided.length === 0 && layered.inert.length === 0
    && lopsided.doubles.length === 1 && lopsided.oneSided.length === 1
    && empty.inert.length === 2;
  return {
    ok,
    gap: leftGap.length, closed: leftClosed.length, drift: drifting.drift.length, declaredDrift: declared.drift.length,
    doubles: twoEntries.doubles.length, selfDoubles: oneEntryTwice.doubles.length,
    layered: layered.doubles.length, lopsided: lopsided.oneSided.length, inertLayering: empty.inert.length,
    why: 'a synthetic register leaving one file unclaimed must yield exactly that one; the same register widened to claim it must yield none; an entry whose count() and claims() disagree must yield one drift row; the same entry declaring why must yield none; two entries over one file must yield one double-claim; one entry naming a file twice must yield none; a MUTUALLY declared layering must yield nothing at all; a one-sided one must yield both a double-claim and a one-sided row; and a mutual declaration over no shared file must yield two inert rows — a subtractor that takes everything and one that takes nothing both fail here',
  };
};

// ---------------------------------------------------------------------------------------
export const runSweepBoundary = async () => {
  const problems = [];
  const rows = [];
  const canary = runCanary();
  if (!canary.ok)
    problems.push(`CANARY DEAD  the form-total comparison found ${canary.contradicted} contradiction(s) in a synthetic fixture claiming 999 against 267, and matched ${canary.matched} in one claiming 267; expected 1 and 1.\n      It can no longer tell a wrong typed count from a right one. Every "0 contradicted" below is meaningless. STOP.`);
  const residualCanary = runResidualCanary();
  if (!residualCanary.ok)
    problems.push(`RESIDUAL CANARY DEAD  the synthetic register yielded gap=${residualCanary.gap} (expected 1), closed=${residualCanary.closed} (expected 0), drift=${residualCanary.drift} (expected 1), declared-drift=${residualCanary.declaredDrift} (expected 0).\n      ${residualCanary.why}\n      [SB-92]'s "RESIDUAL 0" below would be meaningless. STOP.`);

  for (const e of BOUNDARIES) {
    if (e.kind === 'claiming' && typeof e.crosscheck !== 'function') {
      problems.push(`NO CROSS-CHECK  [${e.id}]  ${e.path || e.sweep}\n      is registered \`claiming\` — it removes files from a sweep on a statement about reality — and carries no crosscheck().\n      A boundary nothing compares to the world is how samples/ held two wrong counts.`);
      rows.push({ id: e.id, sweep: e.sweep, kind: e.kind, size: '?', verdict: 'NO CROSS-CHECK' });
      continue;
    }
    if (e.kind === 'scoped' && !e.assertedBy) {
      problems.push(`NO NAMED ASSERTION  [${e.id}]  ${e.path || e.sweep}\n      is registered \`scoped\` and names nothing that covers what it removes.`);
      rows.push({ id: e.id, sweep: e.sweep, kind: e.kind, size: '?', verdict: 'NO NAMED ASSERTION' });
      continue;
    }
    if (e.kind === 'structural' && !e.structural_because) {
      problems.push(`NO REASON  [${e.id}]  ${e.path || e.sweep}\n      is registered \`structural\` and does not say why it removes nothing that could carry a claim.`);
      rows.push({ id: e.id, sweep: e.sweep, kind: e.kind, size: '?', verdict: 'NO REASON' });
      continue;
    }

    let size = '-';
    if (typeof e.count === 'function' || typeof e.size === 'function') {
      const fn = e.count || e.size;
      try { size = await fn(); }
      catch (err) {
        problems.push(`UNREADABLE  [${e.id}]  ${e.path || e.sweep}\n      its size could not be read: ${err.message}\n      A boundary whose size cannot be read reports that it could not be read. Never a pass.`);
        rows.push({ id: e.id, sweep: e.sweep, kind: e.kind, size: 'UNREADABLE', verdict: 'UNREADABLE' });
        continue;
      }
    }
    let found = [];
    if (typeof e.crosscheck === 'function') {
      try { found = (await e.crosscheck()) || []; }
      catch (err) {
        problems.push(`UNREADABLE  [${e.id}]  ${e.path || e.sweep}\n      its crosscheck() threw: ${err.message}`);
        rows.push({ id: e.id, sweep: e.sweep, kind: e.kind, size, verdict: 'UNREADABLE' });
        continue;
      }
    }
    problems.push(...found);
    let observed = null;
    if (typeof e.observe === 'function') {
      try { observed = await e.observe(); } catch (err) { problems.push(`UNREADABLE  [${e.id}] observe() threw: ${err.message}`); }
    }
    rows.push({
      id: e.id, sweep: e.sweep, kind: e.kind, path: e.path, size,
      verdict: found.length ? 'CONTRADICTED' : (typeof e.crosscheck === 'function' ? 'cross-checked' : (e.kind === 'scoped' ? 'asserted elsewhere' : e.kind)),
      assertedBy: e.assertedBy, observed,
    });
  }

  // git tracks nothing under a directory [SB-91] calls scratch.
  const tracked = (() => {
    try {
      return execFileSync('git', ['ls-files', 'adapters/pdf/tmp', 'adapters/pdf/out', 'adapters/hubspot/backup'], { encoding: 'utf8' }).split('\n').filter(Boolean);
    } catch { return null; }
  })();
  if (tracked === null) problems.push('UNREADABLE  [SB-91] git ls-files could not be run, so "these directories are untracked scratch" is unchecked rather than true.');
  else if (tracked.length) problems.push(`[SB-91] CONTRADICTED — ${tracked.length} file(s) under the scratch directories ARE tracked by git: ${tracked.slice(0, 5).join(', ')}${tracked.length > 5 ? ', …' : ''}.\n      A committed file is one somebody is relying on, and "it is reproducible scratch" no longer covers it.`);

  return { rows, problems, canary, residualCanary, tracked };
};

export const reportSweepBoundary = (s, { verbose = false } = {}) => {
  const tally = s.rows.reduce((a, r2) => { a[r2.verdict] = (a[r2.verdict] || 0) + 1; return a; }, {});
  console.log(`sweep-boundary register: ${s.rows.length} registered boundary/boundaries — ${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  console.log(`                         canary: ${s.canary.ok ? 'holds' : 'DEAD'} (${s.canary.contradicted} synthetic contradiction(s), ${s.canary.matched} synthetic match(es))`);
  console.log(`                         residual canary: ${s.residualCanary.ok ? 'holds' : 'DEAD'} (gap ${s.residualCanary.gap}/1, closed ${s.residualCanary.closed}/0, drift ${s.residualCanary.drift}/1, declared-drift ${s.residualCanary.declaredDrift}/0)`);
  console.log(`                         git tracks ${s.tracked === null ? 'UNREADABLE' : s.tracked.length} file(s) under the declared scratch directories`);
  for (const r2 of s.rows) {
    console.log(`    ${String(r2.id).padEnd(6)} ${String(r2.kind).padEnd(11)} ${String(r2.size).padStart(4)} file(s)  ${r2.verdict.padEnd(18)} ${r2.path || r2.sweep}`);
    if (r2.observed) for (const o of r2.observed) console.log(`             ${o}`);
  }
  if (verbose) for (const r2 of s.rows) if (r2.assertedBy) console.log(`      [${r2.id}] asserted by: ${r2.assertedBy}`);
  if (!s.problems.length) {
    console.log('OK — every directory and file class the sweeps exclude is registered, its size is counted, and every boundary that states something about the world has been compared against the world.');
    return 0;
  }
  console.error(`SWEEP BOUNDARY — ${s.problems.length} problem(s):`);
  s.problems.forEach((p) => console.error(`  ${p}`));
  return s.problems.length;
};

// CLI
if (process.argv[1] && /sweep-boundary\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const s = await runSweepBoundary();
  process.exit(reportSweepBoundary(s, { verbose: process.argv.includes('--verbose') }) ? 2 : 0);
}
