// THE STANDING RULES ARE AN ARTEFACT, SO THEY ARE ASSERTED LIKE ONE.
//
//   node adapters/pdf/assert-rules.mjs [--verbose]
//   node adapters/pdf/assert-rules.mjs --cite "<name or id>"
//   node adapters/pdf/assert-rules.mjs --canary
//
//   exit 0 = every rule parses, is attributed, cites paths that exist and commits that resolve
//   exit 2 = a rule failed one of those, the file could not be read, or a canary is dead
//   exit 3 = --cite was given a name this file does not carry (the cheap refusal)
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The standing rules had only ever existed in PROMPT DOCUMENTS, which are transient and are not
// kept in this tree. A prompt citing "prompt 43's ruling 3" therefore pointed at nothing, and
// the only honest answer was a refusal — reached, correctly, after searching the whole tree.
//
// A refusal is the right answer and it should be CHEAP. `--cite` is that: one lookup, exit 3,
// with the closest names printed so a typo is distinguishable from a rule that was never ruled.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IS ASSERTED, AND WHY A DOCUMENT NEEDS ASSERTING AT ALL
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A rules document is exactly the shape this repo keeps finding: authoritative-sounding prose
// that nothing compares to the world. `[SB-14]` excuses every markdown file under `adapters/`
// on the ground that each is a RUN REPORT describing one execution against a live external
// system — a ground that is FALSE of this file. Widening that entry until it covered a file its
// reason is false of is the sentence-softening the boundary register exists to refuse, so
// RULES.md gets its own entry, `[SB-19]`, and this asserter is what that entry names.
//
//   A1  EVERY RULE PARSES. A heading `## [R-nn] <name>`, a blockquote holding the rule itself,
//       an attribution paragraph and a dating paragraph. A heading in the R- family missing any
//       of the four is a STOP: a rule nobody can quote is not a rule.
//
//   A2  IDS ARE UNIQUE AND CONTIGUOUS. R-01 upward with no gap and no repeat. A gap is either a
//       rule that was deleted without saying so or a numbering mistake, and [D-07] is what a
//       numbering mistake costs.
//
//   A3  EVERY RULE IS ATTRIBUTED TO A DEFECT, OR DECLARES THAT IT IS NOT. The attribution
//       paragraph opens `**The defect that earned it.**` or `**Attribution:`. The second is a
//       CHECKED ABSENCE — it is counted and REPORTED BY NAME on every run, never absorbed into
//       a pass. That is [R-04] applied to this file: a rules document whose unattributed rules
//       were silent would be reporting a bare pass over the thing worth knowing.
//
//   A4  EVERY DATING RESOLVES. The dating paragraph must name at least one commit hash that
//       `git cat-file` resolves IN THIS REPOSITORY, or say `Cycle-dated`. A rule attributed to
//       a commit that is not here is an attribution to nothing, and a hash is exactly the kind
//       of detail that reads as precision while being unchecked.
//
//   A5  EVERY PATH EXISTS. Every `adapters/...`, `samples/...` or `scratchpad/...` path in a
//       backtick span must be in the tree. AN UNPROVED FORWARD REFERENCE IS A STOP — which is
//       [R-13], applied to the file that states it.
//
//   A6  EVERY FIGURE IS DERIVED. No count in RULES.md is typed; the totals below are computed
//       from the headings on every run and printed. There is nothing to compare against because
//       there is nothing typed to disagree with, and A1 is what keeps it that way: a figure can
//       only enter this file inside a rule, and every rule is read.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// AND IT CARRIES A CANARY, BECAUSE A NEW INSTRUMENT IS THE LEAST TRUSTWORTHY OBJECT HERE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// [D-12] is the case: a detector whose canary covered its COMPARATOR and not its POPULATION
// SELECTOR reported clean for three prompts while half of it was dead. So the canary here is
// aimed at the selector — `parseRules` is handed eight synthetic documents whose correct
// verdicts are known, including a rule with no blockquote, a duplicate id, a gap in the
// numbering and an unattributed rule, and it must reach the stated verdict on each.

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { rx } from './regex-self-assert.mjs';

export const RULES_PATH = 'adapters/pdf/RULES.md';

// ── the four regexes this file reads with, each asserting itself at load ───────────────────
const HEADING = rx('RX-RU-01', /^## \[(R-\d{2})\]\s+(.+?)\s*$/, {
  why: 'a rule heading, giving the id and the citable name — the only two things a prompt may cite a rule by',
  matches: ['## [R-07] A figure without its universe is not a figure'],
  rejects: ['## [D-07] something', '# [R-07] one hash', '## [R-7] one digit', '##[R-07] no space'],
  captures: [['## [R-07] A figure without its universe is not a figure', ['R-07', 'A figure without its universe is not a figure']]],
});
const QUOTE = rx('RX-RU-02', /^> ?(.*)$/, {
  why: 'a blockquote line, which is where the rule itself is held verbatim',
  matches: ['> Prompts state what to establish.', '>'],
  rejects: ['Prompts state what to establish.', '  > indented'],
  captures: [['> Prompts state what to establish.', ['Prompts state what to establish.']]],
});
const HASH = rx('RX-RU-03', /`([0-9a-f]{7,40})`/g, {
  why: 'a commit hash cited in a dating paragraph, which must resolve in this repository',
  matches: ['`8e530cb`', 'landed 2026-08-22 (`461cfbd`)'],
  rejects: ['`8e530c`', '`8E530CB`', '8e530cb'],
  captures: [['`8e530cb`', ['8e530cb']]],
});
const PATHREF = rx('RX-RU-04', /`((?:adapters|samples|scratchpad)\/[A-Za-z0-9_.\-/*]+)`/g, {
  why: 'a tree path named inside a backtick span, which must exist — an unproved forward reference is a STOP',
  matches: ['`adapters/pdf/count-sweep.mjs`', '`samples/433b.slice1.sample.json`'],
  rejects: ['adapters/pdf/count-sweep.mjs', '`node adapters/pdf/x.mjs --flag`'],
  captures: [['`adapters/pdf/count-sweep.mjs`', ['adapters/pdf/count-sweep.mjs']]],
});

/**
 * THE PARSER, AND IT IS THE THING THE CANARY IS AIMED AT.
 *
 * Returns { rules, problems }. A rule is { id, name, rule, attribution, attributed, dating,
 * line }. `problems` non-empty means STOP; the caller reports and exits and never falls back.
 */
export const parseRules = (text) => {
  const lines = String(text).split('\n');
  const rules = [];
  const problems = [];

  let cur = null;
  const close = () => { if (cur) rules.push(cur); cur = null; };
  for (let i = 0; i < lines.length; i++) {
    const h = HEADING.exec(lines[i]);
    if (h) { close(); cur = { id: h[1], name: h[2], line: i + 1, rule: [], attribution: '', dating: '' }; continue; }
    if (!cur) continue;
    const q = QUOTE.exec(lines[i]);
    if (q) { cur.rule.push(q[1]); continue; }
    if (lines[i].startsWith('**The defect that earned it.**') || lines[i].startsWith('**Attribution:'))
      cur.attribution = lines[i];
    if (lines[i].startsWith('**Roughly when.**')) cur.dating = lines.slice(i, i + 4).join(' ');
  }
  close();

  // A1 — the four parts.
  for (const r of rules) {
    if (!r.rule.join(' ').trim()) problems.push(`NO RULE TEXT   [${r.id}] "${r.name}" (line ${r.line}) carries no blockquote. A rule nobody can quote is not a rule.`);
    if (!r.attribution) problems.push(`NO ATTRIBUTION [${r.id}] "${r.name}" (line ${r.line}) has neither "**The defect that earned it.**" nor "**Attribution:". Every rule says which defect earned it, or says in as many words that it cannot.`);
    if (!r.dating) problems.push(`NO DATING      [${r.id}] "${r.name}" (line ${r.line}) has no "**Roughly when.**" paragraph.`);
  }

  // A2 — unique and contiguous.
  const seen = new Map();
  for (const r of rules) {
    if (seen.has(r.id)) problems.push(`DUPLICATE ID   [${r.id}] appears at line ${seen.get(r.id)} and again at line ${r.line}. An id names one rule; [D-07] is what a collision costs.`);
    else seen.set(r.id, r.line);
  }
  const nums = rules.map((r) => Number(r.id.slice(2))).sort((a, b) => a - b);
  for (let i = 0; i < nums.length; i++)
    if (nums[i] !== i + 1)
      { problems.push(`ID GAP         the ids run ${nums.join(', ')}; R-${String(i + 1).padStart(2, '0')} is missing. A gap is either a rule deleted without saying so or a numbering mistake, and neither is silent here.`); break; }

  if (!rules.length) problems.push('NO RULES       the document holds no `## [R-nn]` heading at all. An empty rules file is not a file whose rules all pass.');
  return { rules, problems };
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY — AIMED AT THE SELECTOR, WHICH IS THE HALF [D-12] LEFT UNTESTED
// ═══════════════════════════════════════════════════════════════════════════════════════
const N = '\n';
const OK_RULE = (id, name) => [
  `## [${id}] ${name}`, '', '> the rule itself', '',
  '**The defect that earned it.** something went wrong.', '',
  '**Roughly when.** 2026-01-01, `abcdef1`.', '',
].join(N);

export const parserCanary = () => {
  const cases = [
    ['a  one well-formed rule parses', OK_RULE('R-01', 'first'), 0, 1],
    ['b  two well-formed rules parse', OK_RULE('R-01', 'first') + OK_RULE('R-02', 'second'), 0, 2],
    ['c  a rule with NO BLOCKQUOTE is a problem',
      ['## [R-01] first', '', '**The defect that earned it.** x.', '', '**Roughly when.** `abcdef1`.'].join(N), 1, 1],
    ['d  a rule with NO ATTRIBUTION is a problem',
      ['## [R-01] first', '', '> the rule', '', '**Roughly when.** `abcdef1`.'].join(N), 1, 1],
    ['e  a rule with NO DATING is a problem',
      ['## [R-01] first', '', '> the rule', '', '**The defect that earned it.** x.'].join(N), 1, 1],
    ['f  a DUPLICATE id is a problem', OK_RULE('R-01', 'first') + OK_RULE('R-01', 'again'), 1, 2],
    ['g  a GAP in the numbering is a problem', OK_RULE('R-01', 'first') + OK_RULE('R-03', 'third'), 1, 2],
    ['h  an EMPTY document is a problem, not a clean pass', '# nothing here', 1, 0],
    ['i  "**Attribution:" satisfies the attribution requirement',
      ['## [R-01] first', '', '> the rule', '', '**Attribution: none —** it is a policy.', '', '**Roughly when.** Cycle-dated.'].join(N), 0, 1],
  ];
  const dead = [];
  for (const [name, doc, wantProblems, wantRules] of cases) {
    const got = parseRules(doc);
    const gotProblems = got.problems.length ? 1 : 0;
    if (gotProblems !== wantProblems || got.rules.length !== wantRules)
      dead.push(`CANARY DEAD  ${name}: parser returned ${got.rules.length} rule(s) and ${got.problems.length} problem(s); expected ${wantRules} rule(s) and ${wantProblems ? 'at least one' : 'no'} problem.`);
  }
  return { cases: cases.length, dead };
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE FULL ASSERTION
// ═══════════════════════════════════════════════════════════════════════════════════════
export const assertRules = (path = RULES_PATH) => {
  const problems = [];
  if (!existsSync(path)) return { problems: [`UNREADABLE     ${path} is not in this tree. The standing rules cannot be asserted and this is a failure, not a skip.`], rules: [], stats: null };
  const text = readFileSync(path, 'utf8');
  const { rules, problems: parseProblems } = parseRules(text);
  problems.push(...parseProblems);

  // A4 — every dating names a hash this repository resolves, or says Cycle-dated.
  const resolve = (h) => spawnSync('git', ['cat-file', '-t', h], { encoding: 'utf8' }).stdout.trim() === 'commit';
  const hashCache = new Map();
  let hashesChecked = 0;
  for (const r of rules) {
    const hashes = [...r.dating.matchAll(HASH)].map((m) => m[1]);
    const cycle = /Cycle-dated/.test(r.dating);
    let anyResolved = false;
    for (const h of hashes) {
      if (!hashCache.has(h)) hashCache.set(h, resolve(h));
      hashesChecked++;
      if (hashCache.get(h)) anyResolved = true;
      else problems.push(`DEAD COMMIT    [${r.id}] "${r.name}" dates itself to \`${h}\`, which this repository does not resolve. A rule attributed to a commit that is not here is attributed to nothing.`);
    }
    if (!anyResolved && !cycle)
      problems.push(`UNDATED        [${r.id}] "${r.name}" names no commit this repository resolves and does not say "Cycle-dated". One of the two is required.`);
  }

  // A5 — every tree path named in a backtick span exists.
  let pathsChecked = 0;
  const missing = new Map();
  for (const m of text.matchAll(PATHREF)) {
    const p = m[1];
    pathsChecked++;
    if (!existsSync(p) && !p.includes('*') && !missing.has(p)) missing.set(p, true);
  }
  for (const p of missing.keys())
    problems.push(`FORWARD REF    \`${p}\` is named in ${path} and is not in this tree. An unproved forward reference is a STOP — which is [R-13], applied to the file that states it.`);

  // A3 — the checked absences, reported by name.
  const unattributed = rules.filter((r) => r.attribution.startsWith('**Attribution:'));

  return {
    rules, problems, unattributed,
    stats: {
      rules: rules.length,
      attributed: rules.length - unattributed.length,
      unattributed: unattributed.length,
      hashes: hashesChecked, distinctHashes: hashCache.size,
      paths: pathsChecked, distinctPaths: new Set([...text.matchAll(PATHREF)].map((m) => m[1])).size,
      words: rules.reduce((n, r) => n + r.rule.join(' ').trim().split(/\s+/).length, 0),
    },
  };
};

/** The cheap refusal. Exit 3 and the nearest names, so a typo is told from a rule never ruled. */
export const cite = (query) => {
  const { rules, problems } = assertRules();
  if (!rules.length) { problems.forEach((p) => console.error(`  ${p}`)); return 2; }
  const want = String(query).trim().toLowerCase();
  const hit = rules.find((r) => r.id.toLowerCase() === want || r.name.toLowerCase() === want)
    || rules.find((r) => r.name.toLowerCase().includes(want) || want.includes(r.name.toLowerCase()));
  if (!hit) {
    console.error(`NOT A RULE IN THIS TREE — ${JSON.stringify(query)} is not in ${RULES_PATH}.`);
    console.error('  Nothing is guessed from the wording. The rules this file carries are:');
    for (const r of rules) console.error(`    [${r.id}] ${r.name}`);
    return 3;
  }
  console.log(`[${hit.id}] ${hit.name}   (${RULES_PATH}:${hit.line})`);
  console.log('');
  for (const l of hit.rule) console.log(`  ${l}`);
  console.log('');
  console.log(`  ${hit.attribution}`);
  return 0;
};

// ── CLI ────────────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && /assert-rules\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  const argv = process.argv.slice(2);
  const citeAt = argv.indexOf('--cite');
  if (citeAt >= 0) process.exit(cite(argv[citeAt + 1] ?? ''));

  const canary = parserCanary();
  if (canary.dead.length) {
    console.error(`STOP — the rules parser failed ${canary.dead.length} of its own ${canary.cases} canary case(s). Nothing it says about ${RULES_PATH} can be believed.`);
    canary.dead.forEach((d) => console.error(`  ${d}`));
    process.exit(2);
  }
  if (argv.includes('--canary')) { console.log(`rules parser: ${canary.cases} canary case(s) live.`); process.exit(0); }

  const res = assertRules();
  console.log(`assert-rules ${RULES_PATH}`);
  console.log(`  parser: ${canary.cases} canary case(s) live — a missing blockquote, a missing attribution, a missing dating, a duplicate id, a numbering gap and an empty document are each REACHED, not assumed`);
  if (res.stats) {
    const s = res.stats;
    console.log(`  DERIVED, NOT TYPED — every figure here is computed from the headings on this run:`);
    console.log(`    rules            ${s.rules}`);
    console.log(`    attributed       ${s.attributed} to a named defect`);
    console.log(`    unattributed     ${s.unattributed} declaring "**Attribution:" with a reason`);
    console.log(`    rule words       ${s.words} across every blockquote`);
    console.log(`    commit hashes    ${s.hashes} cited, ${s.distinctHashes} distinct, each resolved with git cat-file`);
    console.log(`    tree paths       ${s.paths} cited, ${s.distinctPaths} distinct, each checked with existsSync`);
  }
  if (res.unattributed?.length) {
    console.log('');
    console.log(`  CHECKED ABSENCES — ${res.unattributed.length} rule(s) are NOT attributed to a defect, and are named rather than absorbed:`);
    for (const r of res.unattributed) console.log(`    [${r.id}] ${r.name}\n      ${r.attribution}`);
  }
  if (argv.includes('--verbose')) {
    console.log('');
    for (const r of res.rules) console.log(`  [${r.id}] ${r.name}`);
  }
  console.log('');
  if (res.problems.length) {
    console.error(`ASSERT-RULES FAILED — ${res.problems.length} problem(s):`);
    res.problems.forEach((p) => console.error(`  ${p}`));
    process.exit(2);
  }
  console.log(`ASSERT-RULES PASSED — ${res.stats.rules} rule(s), ${res.stats.attributed} attributed to a named defect and ${res.stats.unattributed} declaring they are not; every cited commit resolves in this repository and every cited path is in this tree.`);
}
