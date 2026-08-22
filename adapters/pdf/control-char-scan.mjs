// THE STANDING CONTROL-CHARACTER SCAN — EVERY SOURCE FILE, EVERY RUN.
//
// CLI:  node adapters/pdf/control-char-scan.mjs [--verbose]
// Exit: 0 = no literal control byte in any swept file
//       3 = at least one found (each is named with file, line, column and code point)
//       2 = the canary is dead, or a swept file could not be read
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — TWO INSTANCES, AND THE SECOND IS THE ARGUMENT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A backslash escape written into a heredoc or a patch script can reach disk with the
// backslash EATEN. `\b` becomes one literal U+0008 byte. The source still parses, the regex
// still compiles, and it matches nothing it was written to match. Nothing errors.
//
//   [1st]  validate-map.mjs:235 — a digit-scanning regex arrived with its backslashes eaten.
//          It matched nothing, `nums.length` was 0, and `nums.length && mismatch` turned a
//          guard that could not read its input into a guard that printed PASS. Dead from the
//          commit that introduced it. That instance is why guard-sweep.mjs exists.
//
//   [2nd]  assert-y-convention.mjs:156 REPORTER_SIG — FOUR literal U+0008 bytes where `\b`
//          was meant. Its `.y1` branch matched nothing, so a file that reports a baseline
//          without touching a widget rectangle was INVISIBLE to the y-convention completeness
//          check. Half that check was dead for three prompts while it reported clean. [D-12]
//
// AFTER THE FIRST INSTANCE A SCAN WAS RUN ONCE AND FOUND NOTHING FURTHER. That is the whole
// mistake this file corrects. A one-off scan proves the tree was clean at one instant; it says
// nothing about the next commit, and the next commit is where the second instance arrived.
// The defect is introduced BY THE AUTHORING TOOL, not by the author, so it recurs exactly when
// nobody is thinking about it. A scan that does not run every time is a scan that will be
// clean on every day except the one that matters.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IS SWEPT — ENUMERATED, AND THE BOUNDARY IS A CLAIM LIKE ANY OTHER
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Source that can carry a regex or a string literal whose meaning a control byte changes:
// the two engine directories' .mjs files, the map and crosswalk JSON whose prose is read by
// the count sweep, and the TypeScript under scripts/. Non-recursive, the same reading every
// other sweep in this engine uses, and every subdirectory that reading skips is listed by
// sweep-boundary.mjs [SB-90].
//
// The PDFs under forms/ and the fixtures under samples/ are NOT swept, and that is a claim:
// a PDF is binary and every byte value is legal in it, and a fixture carries data rather than
// a predicate — a control byte in a fixture changes one run's input, which the run's own
// comparisons catch, rather than silently disarming a guard for every future run. Both
// exclusions are counted and printed.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY — RULE: EVERY DETECTOR CARRIES ONE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// This scan's failure mode is its own subject matter: a detector written to find eaten
// backslashes is itself written with backslashes. If THIS file's character class arrived
// mangled it would find nothing and print "clean" — the exact shape of the defect, one level
// up. So before the tree is read, the detector is run against a synthetic buffer carrying one
// planted instance of every byte in the register. A miss is a STOP, and the clean verdict is
// never printed on a scan whose canary did not pass.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { SWEPT_DIRS } from './exclusion-sweep.mjs';

const VERBOSE = process.argv.includes('--verbose');

// ---------------------------------------------------------------------------------------
// THE REGISTER — every byte this scan looks for, with the escape it is the eaten form of.
//
// TAB (0x09), LF (0x0A) and CR (0x0D) are ABSENT BY DECISION, not by oversight: they are how
// source files are laid out, and a scan that flagged them would fire on every line of every
// file. A guard tuned to fire constantly gets turned off, and a guard that gets turned off is
// worse than none. Every OTHER C0 byte, plus DEL, has no legitimate place in this engine's
// source and every one of them is the eaten form of an escape somebody wrote.
// ---------------------------------------------------------------------------------------
export const CONTROLS = [
  { id: 'CC-07', code: 0x07, escape: '\\a', name: 'BEL',  note: 'alert; not a JS escape, but shells and patch tools emit it' },
  { id: 'CC-08', code: 0x08, escape: '\\b', name: 'BS',   note: 'THE ONE THAT BIT TWICE. In a regex `\\b` is a word boundary; the eaten byte is a literal backspace that matches nothing.' },
  { id: 'CC-0B', code: 0x0b, escape: '\\v', name: 'VT',   note: 'vertical tab' },
  { id: 'CC-0C', code: 0x0c, escape: '\\f', name: 'FF',   note: 'form feed' },
  { id: 'CC-1B', code: 0x1b, escape: '\\e', name: 'ESC',  note: 'escape; the lead byte of an ANSI colour sequence pasted out of a terminal' },
  { id: 'CC-00', code: 0x00, escape: '\\0', name: 'NUL',  note: 'null' },
  { id: 'CC-7F', code: 0x7f, escape: null,  name: 'DEL',  note: 'delete' },
];

// Every C0 byte except TAB/LF/CR, plus DEL. Built from character CODES rather than written as
// a regex literal on purpose: a character class spelled `[\x00-\x08...]` in this file could
// itself arrive with its backslashes eaten, and then the scan for eaten backslashes would be
// looking for the letter x. Codes cannot be mangled that way.
const FLAGGED = new Set([...Array(32).keys()].filter((c) => c !== 9 && c !== 10 && c !== 13).concat([127]));

const known = new Map(CONTROLS.map((c) => [c.code, c]));

/**
 * Every flagged byte in a buffer of text, with its 1-based line and column.
 * Exported so the canary and the tree scan run THE SAME detector — a canary that exercised a
 * second copy would prove the copy sound and say nothing about the one that reads the tree.
 */
export const scanText = (text) => {
  const out = [];
  let line = 1, col = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 10) { line++; col = 1; continue; }
    if (FLAGGED.has(c)) {
      const reg = known.get(c);
      out.push({
        line, col, code: c,
        id: reg?.id ?? `CC-${c.toString(16).toUpperCase().padStart(2, '0')}`,
        name: reg?.name ?? 'C0',
        escape: reg?.escape ?? null,
        // Context is rendered with every flagged byte replaced by a dot, BY CODE rather
        // than by a character-class literal. A hex-escape range spelled out here is
        // kind of escape this file exists to catch, and one arriving mangled would corrupt
        // the evidence a reader is shown while the finding itself still printed cleanly.
        context: [...text.slice(Math.max(0, i - 40), i + 40)]
          .map((ch) => (FLAGGED.has(ch.charCodeAt(0)) ? '·' : ch)).join(''),
      });
    }
    col++;
  }
  return out;
};

// ---------------------------------------------------------------------------------------
// THE SWEPT SET, DECLARED.
// ---------------------------------------------------------------------------------------
const filesIn = (dir, ext) =>
  existsSync(dir) && statSync(dir).isDirectory()
    ? readdirSync(dir).filter((f) => f.endsWith(ext)).sort().map((f) => `${dir}/${f}`)
    : [];

export const SWEPT = () => [
  ...SWEPT_DIRS.flatMap((d) => filesIn(d, '.mjs')),
  ...filesIn('adapters/pdf/maps', '.json'),
  ...filesIn('adapters/hubspot', '.json'),
  ...filesIn('scripts', '.ts'),
];

/** What the boundary removes, counted rather than asserted away. */
export const EXCLUDED = () => [
  { what: 'adapters/pdf/forms/*.pdf', n: filesIn('adapters/pdf/forms', '.pdf').length,
    why: 'binary; every byte value is legal in a PDF and a flagged byte there means nothing' },
  { what: 'samples/*.json', n: filesIn('samples', '.json').length,
    why: 'data, not predicates. A control byte in a fixture changes one run\'s input, which that run\'s own comparisons catch; it cannot silently disarm a guard for every future run.' },
  { what: 'subdirectories of the swept dirs', n: SWEPT_DIRS.filter((d) => existsSync(d))
      .flatMap((d) => readdirSync(d).filter((f) => statSync(`${d}/${f}`).isDirectory())).length,
    why: 'the non-recursive reading every sweep in this engine uses; the subdirectory list is derived and checked by sweep-boundary.mjs [SB-90]' },
];

// ---------------------------------------------------------------------------------------
// THE CANARY.
// ---------------------------------------------------------------------------------------
/**
 * One planted instance of every registered byte, in a buffer shaped like real source, and the
 * detector required to find each one at the line it was planted on. Line placement is checked
 * as well as presence: a detector that found every byte but reported them all on line 1 would
 * send a reader to the wrong place, and "the scan pointed at the wrong line" is indistinguish-
 * able from "the scan is fine" until somebody looks.
 */
export const canary = () => {
  const planted = CONTROLS.map((c, i) => ({ ...c, line: i + 2 }));
  const text = ['const re = /^ok$/;']
    .concat(planted.map((c) => `const s${c.code} = /a${String.fromCharCode(c.code)}b/;`))
    .join('\n');
  const found = scanText(text);
  const misses = [];
  for (const p of planted) {
    const hit = found.find((f) => f.code === p.code);
    if (!hit) { misses.push(`${p.id} (${p.name}) not detected at all`); continue; }
    if (hit.line !== p.line) misses.push(`${p.id} (${p.name}) detected on line ${hit.line}, planted on line ${p.line}`);
  }
  // The other half: a buffer with NO flagged byte must come back empty. A detector that
  // returned every offset would pass the half above and be useless.
  const cleanText = 'const ok = /\\bword\\b/;\n\tindented();\r\n';
  const falsePositives = scanText(cleanText);
  if (falsePositives.length)
    misses.push(`${falsePositives.length} false positive(s) on a buffer holding only TAB, LF and CR`);
  return { planted: planted.length, found: found.length, misses };
};

// ---------------------------------------------------------------------------------------
// THE RUN.
// ---------------------------------------------------------------------------------------
const main = () => {
  const problems = [];
  const swept = SWEPT();

  console.log(`control-character scan: ${swept.length} source file(s) — ` +
    `${SWEPT_DIRS.map((d) => `${d}/*.mjs`).join(', ')}, adapters/pdf/maps/*.json, adapters/hubspot/*.json, scripts/*.ts`);
  console.log(`  looking for: ${CONTROLS.map((c) => `${c.name} 0x${c.code.toString(16).padStart(2, '0')}`).join(', ')}` +
    ` and every other C0 byte except TAB, LF and CR`);

  // THE CANARY RUNS FIRST AND ITS FAILURE IS TERMINAL. Reading the tree with a dead detector
  // and printing what it found would be the success message this repo keeps finding.
  const cn = canary();
  if (cn.misses.length) {
    console.log('');
    console.log(`  CANARY DEAD — the detector missed ${cn.misses.length} of its own planted case(s):`);
    for (const m of cn.misses) console.log(`    ${m}`);
    console.log('');
    console.log(`  ${cn.misses.length} of ${cn.planted} planted byte(s) undetected: this scan cannot see the kind of byte it exists to find,`);
    console.log(`  so a clean verdict from it would be ${cn.planted} unread bytes rather than ${cn.planted} absent ones. Exiting 2.`);
    process.exit(2);
  }
  console.log(`  canary: ${cn.planted} planted byte(s), ${cn.planted} detected at the planted line, 0 false positive(s) on a TAB/LF/CR-only buffer`);

  for (const ex of EXCLUDED()) console.log(`  not swept: ${ex.what} (${ex.n}) — ${ex.why}`);

  let unreadable = 0;
  for (const f of swept) {
    let text;
    // AN UNREADABLE FILE IS A STOP, NOT A SKIP. A file this scan cannot open contributes the
    // same zero findings as a clean one, and that is the shape [D-12] hid in.
    try { text = readFileSync(f, 'utf8'); }
    catch (e) { problems.push({ file: f, unreadable: e.message }); unreadable++; continue; }
    for (const hit of scanText(text)) problems.push({ file: f, ...hit });
  }

  console.log('');
  if (!problems.length) {
    console.log(`OK — ${swept.length} source file(s) scanned by a detector that proved itself on ${cn.planted} planted byte(s), and not one literal control character among them.`);
    return 0;
  }

  console.log(`${problems.length} finding(s):`);
  for (const p of problems) {
    if (p.unreadable) { console.log(`  UNREADABLE ${p.file} — ${p.unreadable}`); continue; }
    const esc = p.escape ? `, the eaten form of \`${p.escape}\`` : '';
    console.log(`  ${p.id} ${p.file}:${p.line}:${p.col} — literal ${p.name} (U+${p.code.toString(16).toUpperCase().padStart(4, '0')})${esc}`);
    if (VERBOSE) console.log(`      ...${p.context}...`);
  }
  console.log('');
  console.log('A literal control byte in source is an escape that reached disk with its backslash eaten.');
  console.log('The file still parses and the regex still compiles; it matches nothing it was written for.');
  return unreadable ? 2 : 3;
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) process.exit(main());
