// A REGEX LITERAL WHOSE SOURCE CARRIES A BACKSLASH ASSERTS ITSELF AT MODULE LOAD.
//
// CLI:  node adapters/pdf/regex-self-assert.mjs [--verbose]
// Exit: 0 = both canaries live, every adopting module loaded, no regex literal in the tree
//           carries a control byte
//       3 = at least one regex literal carries a control byte (each is named)
//       2 = a canary is dead, an adopting module refused to load, or a swept file could
//           not be read
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS — PREVENTION, WHERE control-char-scan.mjs IS DETECTION
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The authoring path eats backslashes. That is not a hypothesis: it is a measured property of
// this engine's history. Prompt 45 alone carried THREE live instances and SEVEN more caught in
// flight, in one cycle. The two published instances before it were [D-12] and the
// validate-map.mjs digit scan that made `nums.length && mismatch` print PASS on an input it
// could not read.
//
// control-char-scan.mjs catches ONE OF THE TWO SHAPES the eaten backslash takes:
//
//   shape 1   the backslash is eaten and the escape letter becomes a CONTROL BYTE.
//             `\b` -> one literal U+0008. The source still parses, the regex still compiles,
//             and it matches nothing. The scan finds this, because the byte is there to find.
//
//   shape 2   the backslash is eaten and THE LETTER SURVIVES AS ITSELF.
//             `\s` -> `s`. `\)` -> `)`. `\[` -> `[`. `\d` -> `d`.
//             There is NO control byte. There is nothing anomalous in the file at all. The
//             regex is a different, perfectly legal regex that means something else. The scan
//             is blind to it and always will be, because nothing in the bytes distinguishes a
//             mangled `\s+` from an author who meant `s+`.
//
// FOUR OF PROMPT 45'S TEN INSTANCES WERE SHAPE 2 — two `\s`->`s`, one `\)`, one `\[`. Shape 2
// is not the rare case. It is most of them.
//
// Nothing in the source can settle shape 2. Only BEHAVIOUR can: a regex that carries a
// backslash is required to state a string it must match and a string it must not, and those
// probes are run when the module is loaded. A mangled `\s+` fails to match a space. A `\)` that
// lost its backslash turns a literal paren into a group and starts matching the bare text. The
// probe fires, the module refuses to import, and the run dies at the top rather than four
// tools later with a clean-looking verdict.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY AT LOAD AND NOT IN A SWEEP
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A sweep runs when somebody runs it. Every instance in this repo's history was introduced by
// an edit and found by a sweep some number of commits later — [D-12] survived three prompts
// while its own file reported clean. A load-time assertion has no such window: the FIRST run of
// ANY tool that imports the module fails, including the gate, including the sweep itself. There
// is no state in which a mangled registered regex is used once.
//
// It is also why this file does not try to force adoption by failing the tree: an unregistered
// backslash regex is REPORTED and counted, never failed. A guard tuned to fire constantly gets
// turned off, and a guard that gets turned off is worse than none. The only tree-wide STOP here
// is shape 1, which is provably wrong without knowing anyone's intent.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE ADOPTED SET, DECLARED — AND WHAT IS OUTSIDE IT, ALSO DECLARED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   adopted   every top-level NAMED regex constant in adapters/pdf/*.mjs whose source carries
//             a backslash. These are population selectors and verdict predicates: a dead one
//             does not throw, it silently selects nothing, and the run reports on an empty set
//             as if it were an empty world. That is the exact shape of all three published
//             instances, and it is the shape a run cannot notice.
//
//   outside   adapters/hubspot/*.mjs classification heuristics (PII, DATEISH, FREETEXT,
//             COUNTISH, MONEYISH, FORM_FAMILY, ORG_ROUTING, SERIES). Counted, listed, and
//             excluded on a stated ground: a wrong verdict from one of those changes a
//             generated property's TYPE, which assert-intake-keys.mjs and generator-guard.mjs
//             compare against the form engine on every run. Their failure is loud downstream.
//             It is a weaker ground than the adopted set's and it is written down as such.
//
//   outside   regex literals inline at a call site rather than bound to a name. Counted and
//             reported per file, not adopted: an inline literal is read at the point it is
//             used, where a reader can see the string it is being run against.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE TWO CANARIES — RULE: EVERY DETECTOR CARRIES ONE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// This file has two separable detectors and each is canaried against its own subject:
//
//   assertionCanary()   the load-time assertion. Planted: a shape-1 regex, a shape-2 regex, a
//                       backslash regex with no probes, and a SOUND regex with sound probes.
//                       The first three must be refused and the fourth must be accepted. A
//                       detector that refused everything would pass a presence-only canary.
//
//   scannerCanary()     the tree enumerator, which is a hand-written lexer and whose failure
//                       mode is silence. Planted: a regex in each syntactic position it must
//                       find, and a division expression, a comment and a string literal it
//                       must NOT mistake for one.
//
// Neither verdict is printed on a run whose canary did not pass.

import { readFileSync } from 'node:fs';

const VERBOSE = process.argv.includes('--verbose');

// ---------------------------------------------------------------------------------------
// THIS FILE IMPORTS NOTHING FROM THE ENGINE, AND THAT IS LOAD-ORDER, NOT TASTE.
//
// The adopters include exclusion-sweep.mjs, and control-char-scan.mjs imports SWEPT_DIRS from
// exclusion-sweep.mjs. A static `import { scanText } from './control-char-scan.mjs'` here
// closes a cycle: control-char-scan -> exclusion-sweep -> regex-self-assert -> control-char-scan.
// ESM permits the cycle, but the re-entry arrives while control-char-scan's `scanText` is still
// in its temporal dead zone, and the FIRST registration in exclusion-sweep would then die with
// a ReferenceError naming a file nobody edited. A guard whose failure mode is "the tool that
// imports it explodes somewhere else" is not a guard anyone keeps.
//
// So the shape-1 population is derived here, from code points, and control-char-scan.mjs stays
// the register that NAMES them. That is one register and one derived set, not two registers:
// controlPopulationCanary() below imports control-char-scan dynamically — after both modules
// have finished loading, where no dead zone exists — and asserts the two sets are equal
// element for element. If either side gains or loses a byte and the other does not, this stops.
// ---------------------------------------------------------------------------------------

/** Every C0 byte except TAB, LF and CR, plus DEL. Built from codes; see control-char-scan.mjs. */
const FLAGGED = new Set([...Array(32).keys()].filter((c) => c !== 9 && c !== 10 && c !== 13).concat([127]));

const LOCAL_NAMES = new Map([[0x00, 'NUL'], [0x07, 'BEL'], [0x08, 'BS'], [0x0b, 'VT'], [0x0c, 'FF'], [0x1b, 'ESC'], [0x7f, 'DEL']]);
const LOCAL_ESCAPES = new Map([[0x00, '\\0'], [0x07, '\\a'], [0x08, '\\b'], [0x0b, '\\v'], [0x0c, '\\f'], [0x1b, '\\e']]);

/** Flagged bytes in one regex's source, with the offset a reader can count to. */
const controlsIn = (source) => {
  const out = [];
  for (let i = 0; i < source.length; i++) {
    const code = source.charCodeAt(i);
    if (FLAGGED.has(code)) out.push({ code, col: i + 1, name: LOCAL_NAMES.get(code) || 'C0', escape: LOCAL_ESCAPES.get(code) || null });
  }
  return out;
};

// ---------------------------------------------------------------------------------------
// THE REGISTER. Every regex that has asserted itself, in load order.
// ---------------------------------------------------------------------------------------
/** @type {Map<string, {id:string, source:string, flags:string, why:string, matches:string[], rejects:string[], module:string}>} */
export const REGISTRY = new Map();

export class RegexSelfAssertionError extends Error {}

/** Ids only, for register-ids.mjs. */
export const REGISTERED_IDS = () => [...REGISTRY.keys()];

// ---------------------------------------------------------------------------------------
// THE ASSERTION.
// ---------------------------------------------------------------------------------------
/**
 * Does this source carry a backslash? Asked by CODE POINT and never by a regex, for the same
 * reason control-char-scan.mjs builds its character class from codes: a check for eaten
 * backslashes that is itself written with a backslash can arrive eaten, and then it reports
 * that nothing in the tree carries a backslash, which is the calmest possible way to be dead.
 */
export const carriesBackslash = (source) => {
  for (let i = 0; i < source.length; i++) if (source.charCodeAt(i) === 92) return true;
  return false;
};

/**
 * `.test` against a regex carrying the global flag advances `lastIndex`, so the SECOND probe
 * against the same literal starts mid-string and a sound regex fails its own assertion. Every
 * probe is run from a reset index and the index is reset again afterwards, so a module's regex
 * reaches its first real use in exactly the state it was declared in.
 */
const testFrom0 = (re, s) => { re.lastIndex = 0; const r = re.test(s); re.lastIndex = 0; return r; };

/**
 * Everything wrong with one registration, as a list. Exported so the canary exercises THE SAME
 * function the live path uses — a canary against a second copy proves the copy sound and says
 * nothing about the one the modules call.
 */
export const assertSpec = (id, re, spec) => {
  const problems = [];
  const { why, matches = [], rejects = [], captures = [] } = spec || {};

  if (!id || typeof id !== 'string') problems.push('no id: a registered regex is referred to by id from this report and from register-ids.mjs');
  if (!(re instanceof RegExp)) { problems.push(`not a RegExp: ${typeof re}`); return problems; }
  if (!why) problems.push('no `why`: what this regex selects, in the words a reader needs to judge a probe');

  // SHAPE 1 — a control byte in the source. Provably an eaten backslash; no intent needed.
  const controls = controlsIn(re.source);
  for (const c of controls)
    problems.push(`SHAPE 1 — literal ${c.name} (U+${c.code.toString(16).toUpperCase().padStart(4, '0')}) at source offset ${c.col}` +
      (c.escape ? `, the eaten form of \`${c.escape}\`` : '') +
      `. The literal compiled and matches nothing it was written for.`);

  // THE REGISTRATION REQUIREMENT. A backslash-carrying literal with no probes is refused,
  // because a probe list is the ONLY instrument that can see shape 2 and an empty one is
  // indistinguishable from a passing one.
  if (carriesBackslash(re.source)) {
    if (!matches.length) problems.push('SHAPE 2 UNCHECKABLE — source carries a backslash and declares no `matches` probe. A string this regex must match is what proves the backslash survived.');
    if (!rejects.length) problems.push('SHAPE 2 UNCHECKABLE — source carries a backslash and declares no `rejects` probe. `\\)` losing its backslash makes a wider regex, not a narrower one, so only a rejection can see it.');
  }

  // SHAPE 2 — behaviour. This is the half nothing in the bytes can settle.
  for (const s of matches) if (!testFrom0(re, s))
    problems.push(`SHAPE 2 — must match ${JSON.stringify(s)} and does not. An escape in /${re.source}/ reached disk with its backslash eaten.`);
  for (const s of rejects) if (testFrom0(re, s))
    problems.push(`SHAPE 2 — must NOT match ${JSON.stringify(s)} and does. /${re.source}/ is wider than it was written to be.`);

  // SHAPE 2, THE HALF `.test` CANNOT SEE. A regex whose product is a CAPTURE can go on matching
  // while capturing the wrong span: `[\w$]*` arriving as `[w$]*` still matches `const fooBar =`
  // and still returns a name — it returns `f`. A pass/fail probe agrees with both. So a regex
  // read for its groups states them, and they are compared exactly.
  for (const [input, want] of captures) {
    re.lastIndex = 0;
    const m = re.exec(input);
    re.lastIndex = 0;
    if (!m) { problems.push(`SHAPE 2 — must capture ${JSON.stringify(want)} out of ${JSON.stringify(input)} and does not match it at all.`); continue; }
    const got = m.slice(1);
    if (got.length !== want.length || got.some((g, i) => g !== want[i]))
      problems.push(`SHAPE 2 — captured ${JSON.stringify(got)} out of ${JSON.stringify(input)}, declared ${JSON.stringify(want)}. ` +
        `/${re.source}/ still matches and still returns a group; the group is the wrong span.`);
  }

  return problems;
};

/**
 * Register and assert, at the point of declaration. Returns the regex so a module reads
 *
 *     const STRLIT = rx('RX-01', /.../g, { why: '...', matches: [...], rejects: [...] });
 *
 * and every tool that imports that module runs the assertion before its first line of work.
 */
export const rx = (id, re, spec) => {
  const problems = assertSpec(id, re, spec);
  if (REGISTRY.has(id)) problems.push(`DUPLICATE id — [${id}] is already registered by ${REGISTRY.get(id).module}. Two regexes under one id means this report names the wrong one.`);
  if (problems.length) {
    const lines = [
      `REGEX SELF-ASSERTION FAILED — [${id}] /${re instanceof RegExp ? re.source : String(re)}/`,
      ...problems.map((p) => `  ${p}`),
      '  A registered regex asserts itself when its module loads, so this run stopped before using it.',
    ];
    throw new RegexSelfAssertionError(lines.join('\n'));
  }
  const site = (new Error().stack || '').split('\n')[2] || '';
  REGISTRY.set(id, {
    id, source: re.source, flags: re.flags, why: spec.why,
    matches: spec.matches || [], rejects: spec.rejects || [], captures: spec.captures || [],
    module: (site.match(/adapters[\/\\][a-z]+[\/\\][a-z0-9.-]+\.mjs/i) || ['(unknown)'])[0].replace(/\\/g, '/'),
  });
  return re;
};

// ---------------------------------------------------------------------------------------
// THE TREE ENUMERATOR — a hand-written lexer, because a regex that finds regexes cannot.
//
// `/` is division and it is also a regex opener, and which one it is depends on the token
// before it. Nothing short of tracking string, template, and comment state gets this right,
// and getting it wrong in the quiet direction — missing a literal — is exactly the failure
// this file exists to make impossible elsewhere. So the lexer is canaried.
// ---------------------------------------------------------------------------------------
const isSpace = (c) => c === 32 || c === 9 || c === 10 || c === 13;

// The significant characters after which a `/` opens a regex rather than dividing. Written as
// a string of characters rather than a class so it cannot be mangled into a range.
const REGEX_OPENERS = '(,=:[!&|?{};+-*~^<>%';
const OPENER_WORDS = ['return', 'typeof', 'case', 'in', 'of', 'do', 'else', 'yield', 'await', 'new', 'delete', 'void', 'instanceof'];

/**
 * Every regex literal in one file, with its line, its source, and the 60 characters before it.
 * The preceding context is what tells a registered literal from a bare one: a registered one is
 * an argument to `rx(`.
 */
export const scanRegexLiterals = (text) => {
  const out = [];
  let i = 0, line = 1, prevSig = '', prevWord = '';
  const openerHere = () => {
    if (prevSig === '') return true;
    if (REGEX_OPENERS.includes(prevSig)) return true;
    return OPENER_WORDS.includes(prevWord);
  };
  while (i < text.length) {
    const c = text[i], code = text.charCodeAt(i);
    if (code === 10) { line++; i++; continue; }
    if (isSpace(code)) { i++; continue; }
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && text.charCodeAt(i) !== 10) i++; continue; }
    if (c === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) { if (text.charCodeAt(i) === 10) line++; i++; }
      i += 2; prevSig = '*'; prevWord = ''; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < text.length && text[i] !== q) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text.charCodeAt(i) === 10) line++;
        i++;
      }
      i++; prevSig = q; prevWord = ''; continue;
    }
    if (c === '/' && openerHere()) {
      const start = i, startLine = line;
      i++;
      let inClass = false, closed = false;
      while (i < text.length) {
        const d = text[i];
        if (text.charCodeAt(i) === 10) break;            // a regex literal cannot span a line
        if (d === '\\') { i += 2; continue; }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) { closed = true; break; }
        i++;
      }
      if (!closed) { i = start + 1; prevSig = '/'; prevWord = ''; continue; }
      const source = text.slice(start + 1, i);
      i++;
      let flags = '';
      while (i < text.length && /[a-z]/.test(text[i])) { flags += text[i]; i++; }
      out.push({ line: startLine, source, flags, before: text.slice(Math.max(0, start - 60), start) });
      prevSig = '/'; prevWord = ''; continue;
    }
    // Word characters accumulate so `return /.../ ` is told from `x /.../ `.
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95 || code === 36 || (code >= 48 && code <= 57)) {
      let w = '';
      while (i < text.length) {
        const k = text.charCodeAt(i);
        if ((k >= 65 && k <= 90) || (k >= 97 && k <= 122) || k === 95 || k === 36 || (k >= 48 && k <= 57)) { w += text[i]; i++; } else break;
      }
      prevWord = w; prevSig = 'w'; continue;
    }
    prevSig = c; prevWord = ''; i++;
  }
  return out;
};

// This file's own two classifiers are registered through its own construct. A tool that
// exempted itself from the rule it enforces would be the one place the rule cannot reach, and
// these two decide the figures the whole report rests on: a dead REGISTERED_CALL reports every
// adopted regex as unasserted, which reads as "adoption never happened".

/** A literal is registered when it is the second argument of an `rx(` call. */
const REGISTERED_CALL = rx('RX-RSA-01', /\brx\(\s*(['"])[^'"]+\1\s*,\s*$/, {
  why: 'the 60 characters before a regex literal, when that literal is the second argument of an rx() registration',
  matches: ["const A = rx('RX-01', ", 'const B = rx("RX-02",  '],
  rejects: ["const A = matrx('RX-01', ", "const A = rx('RX-01') "],
  captures: [["rx('X', ", ["'"]]],
});

/** A literal bound to a top-level name — the adopted class. */
const NAMED_CONST = rx('RX-RSA-02', /(?:^|\n)\s*(?:export\s+)?const\s+[A-Za-z_$][\w$]*\s*=\s*$/, {
  why: 'the same 60 characters, when the literal is being bound to a top-level const rather than passed inline',
  matches: ['\nconst FOO = ', 'export const FOO = ', '\n  export const fooBar =  '],
  rejects: ['\nlet FOO = ', '\nconst FOO ', '\nconstFOO = '],
});

// ---------------------------------------------------------------------------------------
// THE CANARIES.
// ---------------------------------------------------------------------------------------
/**
 * The load-time assertion, against one planted case of every verdict it can reach. Both
 * directions: three refusals AND one acceptance. A detector that refused every input would
 * satisfy a refusal-only canary and reject the whole engine on its next run.
 */
export const assertionCanary = () => {
  const misses = [];
  const bs = String.fromCharCode(8);

  // shape 1: `\b` arrived as a literal backspace.
  const shape1 = new RegExp(`a${bs}c`);
  const p1 = assertSpec('CANARY-1', shape1, { why: 'planted shape 1', matches: ['abc'], rejects: ['xyz'] });
  if (!p1.some((p) => p.startsWith('SHAPE 1'))) misses.push('a source carrying a literal backspace was not refused as shape 1');

  // shape 2: `\s+` arrived as `s+`. NOTHING in the bytes is anomalous; only the probe sees it.
  const p2 = assertSpec('CANARY-2', /as+b/, { why: 'planted shape 2', matches: ['a b'], rejects: ['ab'] });
  if (!p2.some((p) => p.startsWith('SHAPE 2 — must match'))) misses.push('an eaten `\\s` was not caught by its own match probe');

  // shape 2, the widening direction: `\)` arrived as `)`.
  const p2b = assertSpec('CANARY-2B', /a(b)c/, { why: 'planted shape 2, widening', matches: ['a(b)c'], rejects: ['abc'] });
  if (!p2b.some((p) => p.startsWith('SHAPE 2 — must NOT match'))) misses.push('an eaten `\\)` was not caught by its own reject probe');

  // the registration requirement.
  const p3 = assertSpec('CANARY-3', /\d+/, { why: 'planted unprobed' });
  if (!p3.some((p) => p.startsWith('SHAPE 2 UNCHECKABLE'))) misses.push('a backslash-carrying regex with no probes was not refused');

  // THE ACCEPTANCE HALF.
  const p4 = assertSpec('CANARY-4', /^\d{2,3}[a-z]?$/, { why: 'planted sound', matches: ['12', '433a'], rejects: ['1', 'abc'] });
  if (p4.length) misses.push(`a sound regex with sound probes was refused: ${p4.join('; ')}`);

  // A regex with NO backslash needs no probes — otherwise adoption would demand ceremony
  // where there is nothing to prove, and ceremony is how a guard gets turned off.
  const p5 = assertSpec('CANARY-5', /^Box [A-Z]$/, { why: 'planted backslash-free' });
  if (p5.length) misses.push(`a backslash-free regex was made to carry probes: ${p5.join('; ')}`);

  // THE CAPTURE HALF. `[\w$]*` arriving as `[w$]*` still matches and still returns a group.
  // Only comparing the span sees it.
  const p6 = assertSpec('CANARY-6', /const ([A-Za-z_$][w$]*)/, {
    why: 'planted shape 2, right match and wrong span',
    matches: ['const fooBar'], rejects: ['let fooBar'],
    captures: [['const fooBar', ['fooBar']]],
  });
  if (!p6.some((p) => p.startsWith('SHAPE 2 — captured'))) misses.push('an eaten `\\w` that still matched and still captured was not caught by its capture probe');

  // And the acceptance direction for captures, so a comparator that rejected every span
  // could not pass on the refusal half alone.
  const p7 = assertSpec('CANARY-7', /const ([A-Za-z_$][\w$]*)/, {
    why: 'planted sound capture', matches: ['const fooBar'], rejects: ['let fooBar'],
    captures: [['const fooBar', ['fooBar']]],
  });
  if (p7.length) misses.push(`a sound capture was refused: ${p7.join('; ')}`);

  return { planted: 8, misses };
};

/**
 * The lexer, against every syntactic position it must find a literal in and every one it must
 * not mistake for one. Its failure mode is silence, so the false-negative half is the half
 * that matters — but the division case is here because a lexer that called every `/` a regex
 * would pass a presence-only canary and report hundreds of phantom literals.
 */
export const scannerCanary = () => {
  const misses = [];
  const findOne = (src, label, expect) => {
    const got = scanRegexLiterals(src);
    if (expect === null) { if (got.length) misses.push(`${label}: ${got.length} phantom literal(s) — ${got.map((g) => `/${g.source}/`).join(', ')}`); return; }
    if (!got.length) { misses.push(`${label}: not found`); return; }
    if (got[0].source !== expect) misses.push(`${label}: read /${got[0].source}/, planted /${expect}/`);
  };
  findOne('const A = /a\\db/;', 'after `=`', 'a\\db');
  findOne('f(/a\\db/);', 'as an argument', 'a\\db');
  findOne('if (!/a\\db/.test(s)) {}', 'after `!`', 'a\\db');
  findOne('const B = x || /a\\db/;', 'after `||`', 'a\\db');
  findOne('return /a\\db/.test(s);', 'after `return`', 'a\\db');
  findOne('s.replace(/a\\/b/g, "");', 'with an escaped slash', 'a\\/b');
  findOne('const C = /[/]/;', 'with a slash inside a class', '[/]');
  findOne('const D = { k: /a\\db/ };', 'after `:`', 'a\\db');
  findOne('const q = a / b / c;', 'a division expression', null);
  findOne('// const E = /a\\db/;\n', 'inside a line comment', null);
  findOne('/* const F = /a\\db/; */\n', 'inside a block comment', null);
  findOne('const G = "/a\\\\db/";', 'inside a string literal', null);
  findOne('const H = `x /a\\\\db/ y`;', 'inside a template literal', null);
  return { planted: 13, misses };
};

// ---------------------------------------------------------------------------------------
// THE ADOPTING MODULES — enumerated, never globbed.
//
// Importing each one IS the report for the adopted set: a module whose registered regex was
// mangled throws out of its own import and takes this run down with the id and the probe that
// caught it. There is no separate "check" to keep in step with the modules.
// ---------------------------------------------------------------------------------------
export const ADOPTERS = [
  './assert-y-convention.mjs',
  './subject-class.mjs',
  './blanket-audit.mjs',
  './enumerate-shadowing.mjs',
  './exclusion-sweep.mjs',
  './success-sweep.mjs',
  './rounding.mjs',
  './line-markers.mjs',
];

/** Import every adopter, so the registry this file reports is the whole adopted set and not
 *  whatever the importing tool happened to pull in. Exported for register-ids.mjs, which
 *  otherwise counts a register whose size depends on its own import graph. */
export const loadAdopters = async () => { for (const m of ADOPTERS) await import(m); return REGISTRY; };

/** The declared remainder, with the ground it stands on. An exclusion is a claim. */
export const NOT_ADOPTED = [
  { what: 'adapters/pdf/assert-overflow.mjs (NUMERIC)',
    why: 'script-shaped — its body runs on import, so it cannot be loaded to report a register. Its `rx` registration still asserts when the script itself runs, which is every gate stress run; what it cannot do is contribute to the count below.' },
  { what: 'adapters/hubspot/gen-fields-from-map.mjs [RX-GF-01] — ADOPTED, but not loadable from here',
    why: 'script-shaped: its body runs on import and WRITES fields.<form>.json, so importing it to report a register would rewrite an artefact. Its `rx` registration still asserts when the script itself runs, which is every generator run — the moment immediately before 186 permanent property definitions are written, and the only moment the assertion matters. Same ground as assert-overflow.mjs (NUMERIC) above. What it cannot do is contribute to the count below. Adopted for [D-17]: the alternative was a boundary exclusion on the ground that line_ref is display-only, and that ground is false — the same function composes the permanent property description on 168 of 186 rows.' },
  { what: 'adapters/hubspot/*.mjs classification heuristics',
    why: 'a wrong verdict changes a generated property type, which assert-intake-keys.mjs and generator-guard.mjs compare against the form engine on every run. Loud downstream — a weaker ground than the adopted set\'s, and stated as such.' },
  { what: 'regex literals inline at a call site rather than bound to a name',
    why: 'read at the point of use, beside the string they are run against. Counted per file below, not adopted.' },
];

// ---------------------------------------------------------------------------------------
// THE RUN.
// ---------------------------------------------------------------------------------------
/**
 * ONE REGISTER, ONE DERIVED SET, AND THE ASSERTION THAT THEY ARE THE SAME SET.
 * Dynamic, so it runs after both modules have loaded and no dead zone is in play.
 */
export const controlPopulationCanary = async () => {
  const { CONTROLS, scanText } = await import('./control-char-scan.mjs');
  const misses = [];
  for (const c of CONTROLS) {
    if (!FLAGGED.has(c.code)) { misses.push(`${c.id} (${c.name}) is registered by control-char-scan.mjs and is not in this file's derived set`); continue; }
    const here = controlsIn(String.fromCharCode(c.code));
    if (!here.length) misses.push(`${c.id} (${c.name}) is in the derived set and controlsIn() does not find it`);
    else if (here[0].name !== c.name) misses.push(`${c.id} named "${here[0].name}" here and "${c.name}" there`);
  }
  // And the other direction, so this file cannot quietly flag a byte the register does not know.
  const theirs = new Set();
  for (let code = 0; code < 128; code++) if (scanText(String.fromCharCode(code)).length) theirs.add(code);
  for (const code of FLAGGED) if (!theirs.has(code)) misses.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')} is flagged here and not by control-char-scan.mjs`);
  for (const code of theirs) if (!FLAGGED.has(code)) misses.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')} is flagged by control-char-scan.mjs and not here`);
  return { compared: theirs.size, misses };
};

const main = async () => {
  const { SWEPT, scanText } = await import('./control-char-scan.mjs');

  console.log('regex self-assertion');

  const pc = await controlPopulationCanary();
  if (pc.misses.length) {
    console.log(`  POPULATION CANARY DEAD — this file's derived shape-1 set and control-char-scan.mjs's register disagree on ${pc.misses.length} byte(s):`);
    for (const m of pc.misses) console.log(`    ${m}`);
    console.log('  Two disagreeing copies of one population is the duplicate-register defect. Exiting 2.');
    return 2;
  }
  console.log(`  population canary: ${pc.compared} byte(s) — the derived shape-1 set and control-char-scan.mjs's register are the same set, in both directions`);

  const ac = assertionCanary();
  if (ac.misses.length) {
    console.log(`  ASSERTION CANARY DEAD — ${ac.misses.length} of ${ac.planted} planted case(s) reached the wrong verdict:`);
    for (const m of ac.misses) console.log(`    ${m}`);
    console.log('  The assertion cannot see the defect it exists to prevent, so nothing it passed today was checked. Exiting 2.');
    return 2;
  }
  console.log(`  assertion canary: ${ac.planted} planted case(s) — shape 1, shape 2 both directions, the unprobed refusal, the wrong-span capture, and three soundness cases accepted`);

  const sc = scannerCanary();
  if (sc.misses.length) {
    console.log(`  SCANNER CANARY DEAD — ${sc.misses.length} of ${sc.planted} planted case(s):`);
    for (const m of sc.misses) console.log(`    ${m}`);
    console.log(`  ${sc.misses.length} of ${sc.planted} planted case(s) undetected: a lexer that misses literals reports a small population and calls it a whole one. Exiting 2.`);
    return 2;
  }
  console.log(`  scanner canary: ${sc.planted} planted case(s) — 8 positions found, 5 non-regex uses of \`/\` not mistaken for one`);

  // --- the adopted set, by loading it --------------------------------------------------
  console.log('');
  console.log(`adopted modules: ${ADOPTERS.length}, imported here so their load-time assertions run`);
  for (const m of ADOPTERS) {
    try { await import(m); }
    catch (e) {
      console.log('');
      console.log(`  REFUSED TO LOAD — ${m}`);
      for (const l of String(e.message).split('\n')) console.log(`    ${l}`);
      console.log('  That is the assertion doing its job. Exiting 2.');
      return 2;
    }
  }
  const byModule = new Map();
  for (const r of REGISTRY.values()) byModule.set(r.module, (byModule.get(r.module) || 0) + 1);
  console.log(`  ${REGISTRY.size} registered regex(es) asserted at load, across ${byModule.size} module(s):`);
  for (const [m, n] of [...byModule].sort()) console.log(`    ${n.toString().padStart(2)}  ${m}`);
  if (VERBOSE) for (const r of REGISTRY.values())
    console.log(`      [${r.id}] /${r.source}/${r.flags} — ${r.matches.length} match probe(s), ${r.rejects.length} reject probe(s)`);

  // --- the tree ------------------------------------------------------------------------
  const swept = SWEPT();
  let total = 0, withBackslash = 0, registered = 0, named = 0, inline = 0, unreadable = 0;
  const shape1 = [];
  const unassertedByFile = new Map();
  for (const f of swept) {
    let text;
    try { text = readFileSync(f, 'utf8'); }
    catch (e) { console.log(`  UNREADABLE ${f} — ${e.message}`); unreadable++; continue; }
    if (!f.endsWith('.mjs') && !f.endsWith('.ts')) continue;
    for (const lit of scanRegexLiterals(text)) {
      total++;
      const controls = scanText(lit.source);
      if (controls.length) shape1.push({ file: f, ...lit, controls });
      if (!carriesBackslash(lit.source)) continue;
      withBackslash++;
      if (REGISTERED_CALL.test(lit.before)) { registered++; continue; }
      if (NAMED_CONST.test(lit.before)) named++; else inline++;
      unassertedByFile.set(f, (unassertedByFile.get(f) || 0) + 1);
    }
  }

  console.log('');
  console.log(`tree: ${swept.length} swept file(s) — ${total} regex literal(s), ${withBackslash} carrying a backslash`);
  console.log(`  ${registered} self-asserting at load; ${withBackslash - registered} not (${named} bound to a name, ${inline} inline at a call site)`);
  for (const ex of NOT_ADOPTED) console.log(`  not adopted: ${ex.what} — ${ex.why}`);
  if (VERBOSE) for (const [f, n] of [...unassertedByFile].sort((a, b) => b[1] - a[1]))
    console.log(`      ${n.toString().padStart(3)}  ${f}`);

  console.log('');
  if (unreadable) {
    console.log(`${unreadable} swept file(s) could not be read. A file this scan cannot open contributes the same zero findings as a clean one. Exiting 2.`);
    return 2;
  }
  if (shape1.length) {
    console.log(`${shape1.length} regex literal(s) carry a control byte in their source:`);
    for (const s of shape1) for (const c of s.controls)
      console.log(`  ${s.file}:${s.line} — /${s.source}/ holds ${c.name} (U+${c.code.toString(16).toUpperCase().padStart(4, '0')})` +
        (c.escape ? `, the eaten form of \`${c.escape}\`` : ''));
    return 3;
  }
  console.log(`OK — ${registered} registered regex(es) proved themselves against ${[...REGISTRY.values()].reduce((n, r) => n + r.matches.length + r.rejects.length, 0)} probe(s) at load, ` +
    `and not one of the ${total} regex literal(s) in the tree carries a control byte in its source.`);
  return 0;
};

// NOT `await main()`. A top-level await here never settles: this file's own adopters import it
// back, and an importer of a module still sitting in a top-level await waits for that await,
// which is waiting for the importer. The module body finishes synchronously and the run is
// driven from the settled promise instead.
if (process.argv[1] && /regex-self-assert\.mjs$/.test(process.argv[1].replace(/\\/g, '/')))
  main().then((code) => process.exit(code));
