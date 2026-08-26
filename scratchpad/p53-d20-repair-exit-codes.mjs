// [D-20] REPAIR PASS — every process.exit() call site in the portal population becomes stop(),
// and every catch standing between one and the top level re-throws the sentinel.
//
// Run from the repo root:  node scratchpad/p53-d20-repair-exit-codes.mjs [--check]
//
// THIS SCRIPT ASSERTS ITS OWN OUTPUT ON DISK BEFORE IT EXITS ([R-17]). The authoring path eats
// backslashes, and a patch script that reached disk with its escapes eaten is the exact class
// control-char-scan.mjs exists for — it happened to the [R-25] overflow-reader patch and it
// happened again to the first draft of the derivation this file grew out of.
//
// WHAT IT WILL NOT DO. It edits CODE positions only. `process.exit(` inside a comment or a
// string literal is left exactly as written, because three of those occurrences are PROSE
// ABOUT the defect — hs-deprecate-property.mjs and hs-teardown-contact.mjs each quote the time
// a dry-run exit was replaced by something that did not jump — and one is a STRING WRITTEN INTO
// A CANARY FILE by rerun-regression.mjs, which must keep exiting the old way because it is the
// synthetic child that proves the harness can see a non-zero code at all.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DIR = 'adapters/hubspot';
const CHECK = process.argv.includes('--check');

// ── THE MASK ──────────────────────────────────────────────────────────────────────────────
// Blanks out line comments, block comments and the interior of every string/template literal,
// leaving the file's length and line structure intact. What survives at an index is CODE.
export function codeMask(src) {
  const out = src.split('');
  const n = src.length;
  const blank = (a, b) => { for (let k = a; k < b && k < n; k++) if (out[k] !== '\n') out[k] = ' '; };
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { let j = src.indexOf('\n', i); if (j < 0) j = n; blank(i, j); i = j; continue; }
    if (c === '/' && d === '*') { let j = src.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; blank(i, j); i = j; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === q) break;
        j++;
      }
      blank(i + 1, j);
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.join('');
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.mjs') && f !== 'hs-lib.mjs').sort();

// BOTH IMPORT FORMS. A predicate matching only `from './hs-lib.mjs'` misses the SIX files that
// load it with `await import('./hs-lib.mjs')` — a lazy load so the tool can run offline with no
// credential — and one of those six is rerun-regression.mjs, the tool that REPORTS [D-20].
// A population defined by the shape of an import statement is a population an author can leave
// silently, which is the exclusion-by-omission [R-14] names.
const IMPORTS_HS = /(from\s*['"]\.\/hs-lib\.mjs['"])|(import\(\s*['"]\.\/hs-lib\.mjs['"]\s*\))/;

const report = [];
let totalExits = 0;
let totalCatches = 0;

for (const f of files) {
  const path = `${DIR}/${f}`;
  const src = readFileSync(path, 'utf8');
  if (!IMPORTS_HS.test(src)) continue;

  let masked = codeMask(src);
  let text = src;
  const edits = [];

  // ── 1. process.exit(  ->  stop(   at CODE positions only, right to left ────────────────
  const exitSites = [];
  {
    const re = /process\.exit\(/g;
    let m;
    while ((m = re.exec(masked)) !== null) exitSites.push(m.index);
  }
  for (let k = exitSites.length - 1; k >= 0; k--) {
    const at = exitSites[k];
    text = text.slice(0, at) + 'stop(' + text.slice(at + 'process.exit('.length);
  }
  if (exitSites.length) edits.push(`${exitSites.length} exit site(s)`);
  totalExits += exitSites.length;

  // ── 2. every catch re-throws the sentinel ──────────────────────────────────────────────
  //
  // WHY EVERY ONE AND NOT THE ONES THAT CAN SEE A SENTINEL TODAY.
  //
  // `process.exit()` could not be intercepted by any catch. `stop()` throws, so it can be —
  // and hs() calls serviceKey() through a default parameter, so a missing credential now
  // raises a StopSignal INSIDE `try { await hs(...) } catch (e) { tier = '(not read)'; }`,
  // of which there are seven in this directory. Without the re-throw, "no credential, halt"
  // silently becomes "tier not read, carry on" — the repair committing a worse version of the
  // defect it repairs, which is the reproduction [R-12] says to expect and look for.
  //
  // So the re-throw is not new behaviour. It is what PRESERVES the halt process.exit() had,
  // and it is applied to every catch rather than to the ones an inspection finds today,
  // because "an inspection found these" is a fact about a moment and assert-exit-codes.mjs
  // asserting all of them is a fact about the structure ([R-31]).
  masked = codeMask(text);
  const catchSites = [];
  {
    const re = /catch\s*(\(\s*([A-Za-z_$][\w$]*)\s*\)\s*)?\{/g;
    let m;
    while ((m = re.exec(masked)) !== null) catchSites.push({ at: m.index, len: m[0].length, binding: m[2] || null });
  }
  for (let k = catchSites.length - 1; k >= 0; k--) {
    const s = catchSites[k];
    const head = s.binding ? `catch (${s.binding}) {` : 'catch (e) {';
    const name = s.binding || 'e';
    const guard = ` if (isStop(${name})) throw ${name};`;
    text = text.slice(0, s.at) + head + guard + text.slice(s.at + s.len);
  }
  if (catchSites.length) edits.push(`${catchSites.length} catch site(s)`);
  totalCatches += catchSites.length;

  // ── 3. the import ──────────────────────────────────────────────────────────────────────
  const wants = [];
  if (exitSites.length) wants.push('stop');
  if (catchSites.length) wants.push('isStop');
  if (wants.length) {
    const stat = /^(import\s*\{\s*)([^}]*?)(\s*\}\s*from\s*['"]\.\/hs-lib\.mjs['"];?)$/m;
    const m = stat.exec(text);
    if (m) {
      const have = m[2].split(',').map((s) => s.trim()).filter(Boolean);
      for (const w of wants) if (!have.includes(w)) have.push(w);
      text = text.replace(stat, `${m[1]}${have.join(', ')}${m[3]}`);
    } else {
      // Only a DYNAMIC import — the tool loads hs-lib lazily so it can run with no credential.
      // A static import of hs-lib does not change that: the module has no top-level side
      // effects and the stop handlers install on the first stop() call, not at load.
      const dyn = /^.*await import\(['"]\.\/hs-lib\.mjs['"]\).*$/m;
      if (!dyn.test(text)) throw new Error(`${path}: imports hs-lib by neither a static nor a dynamic form — this script cannot place the import`);
      const lines = text.split('\n');
      let last = -1;
      for (let li = 0; li < lines.length; li++) if (/^import\s/.test(lines[li])) last = li;
      if (last < 0) throw new Error(`${path}: no top-level import to anchor to`);
      lines.splice(last + 1, 0, `import { ${wants.join(', ')} } from './hs-lib.mjs';`);
      text = lines.join('\n');
    }
    edits.push(`import { ${wants.join(', ')} }`);
  }

  if (text !== src) {
    if (!CHECK) writeFileSync(path, text);
    report.push(`  ${path.padEnd(46)} ${edits.join(', ')}`);
  }
}

console.log(CHECK ? 'would patch:' : 'patched:');
console.log(report.join('\n'));
console.log(`\n${report.length} file(s); ${totalExits} exit site(s) -> stop(); ${totalCatches} catch site(s) re-throw the sentinel.`);

// ── SELF-ASSERTION ON DISK [R-17] ────────────────────────────────────────────────────────
if (!CHECK) {
  const problems = [];
  for (const f of files) {
    const path = `${DIR}/${f}`;
    const src = readFileSync(path, 'utf8');
    if (!IMPORTS_HS.test(src)) continue;
    const masked = codeMask(src);
    if (/process\.exit\(/.test(masked)) problems.push(`${path} still holds a process.exit( CALL SITE after the pass`);
    for (const m of masked.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{([^\n]{0,40})/g))
      if (!m[2].includes(`isStop(${m[1]})`)) problems.push(`${path}: a catch binding \`${m[1]}\` does not lead with the sentinel re-throw`);
    for (const m of masked.matchAll(/catch\s*\{/g)) problems.push(`${path}: a bindingless \`catch {\` survived the pass at index ${m.index}`);
  }
  if (problems.length) {
    console.error(`\nSELF-ASSERTION FAILED — ${problems.length} problem(s):`);
    problems.forEach((p) => console.error(`  ${p}`));
    process.exitCode = 2;
  } else {
    console.log('\nself-assertion: every patched file on disk holds zero process.exit() call sites and every catch re-throws the sentinel.');
  }
}
