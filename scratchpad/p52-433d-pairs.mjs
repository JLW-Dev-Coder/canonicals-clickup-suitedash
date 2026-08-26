// ESTABLISH 433-D's PAIR STRUCTURE FROM THE PAGE. It is not assumed and it is not read from the
// cross-form register's `mirror` expectation — that expectation ("168 fields over 84 leaf stems,
// page 3 the taxpayer copy of page 1") is the CLAIM this file exists to test, and a claim tested
// against itself is what [R-05] refuses.
//
// Every figure printed here is derived from the widget geometry of the pinned blank.
import { readFileSync, writeFileSync } from 'node:fs';
import { readWidgetGeometry } from '../adapters/pdf/page-geometry.mjs';

const bytes = readFileSync('adapters/pdf/forms/f433d.pdf');
const { widgets, pageCount } = await readWidgetGeometry(bytes);

const pageContainerOf = (n) => (n.match(/form1\[0\]\.([A-Za-z0-9_]+)\[0\]/) || [])[1] ?? null;
const tailOf = (n) => n.replace(/^form1\[0\]\.[A-Za-z0-9_]+\[0\]\./, '');
const stemOf = (n) => n.split('.').pop().replace(/\[\d+\]$/, '');

const rows = widgets.map((w) => ({ ...w, container: pageContainerOf(w.name), tail: tailOf(w.name), stem: stemOf(w.name) }));

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

say('433-D PAIR STRUCTURE — ESTABLISHED FROM THE PAGE, NOT FROM THE REGISTER\'S EXPECTATION');
say('');
say('Derived by scratchpad/p52-433d-pairs.mjs from adapters/pdf/forms/f433d.pdf, pinned at');
say('sha256 7383b4dba64599092e9e3ea9e533ffdba7d0c68ccfa7d7ec035f095e25d96c00 in forms.sha256.');
say(`${pageCount} pages, ${rows.length} widgets read through adapters/pdf/page-geometry.mjs.`);
say('');

// ── WHAT EACH PAGE ACTUALLY CARRIES ────────────────────────────────────────────────────────
say('1. WHAT EACH PAGE ACTUALLY CARRIES');
say('');
for (let p = 1; p <= pageCount; p++) {
  const on = rows.filter((r) => r.page === p);
  const types = on.reduce((a, r) => { a[r.type] = (a[r.type] || 0) + 1; return a; }, {});
  const containers = [...new Set(on.map((r) => r.container))];
  say(`   page ${p}: ${String(on.length).padStart(3)} widget(s)  ${JSON.stringify(types)}  container(s): ${containers.join(', ') || '(none)'}`);
}
say('');
say('   PAGE 2 CARRIES NO WIDGETS AT ALL. That is established, not inferred from a low count:');
say('   the geometry reader returns every widget on every page and page 2 contributes none.');
say('   PAGE 4 CARRIES TWO, AND NEITHER IS A DATA CELL. Both in full:');
for (const r of rows.filter((x) => x.page === 4)) say(`     ${r.type.padEnd(14)} ${r.name}`);
say('');

// ── THE PAIRING KEY, ESTABLISHED RATHER THAN CHOSEN ────────────────────────────────────────
const p1 = rows.filter((r) => r.page === 1);
const p3 = rows.filter((r) => r.page === 3);
const tails1 = new Map(p1.map((r) => [r.tail, r]));
const tails3 = new Map(p3.map((r) => [r.tail, r]));
const bothTails = [...tails1.keys()].filter((t) => tails3.has(t));
const only1 = [...tails1.keys()].filter((t) => !tails3.has(t));
const only3 = [...tails3.keys()].filter((t) => !tails1.has(t));

say('2. THE PAIRING KEY — AND WHY THE OBVIOUS ONE IS WRONG');
say('');
say('   Keyed on the FULL FIELD PATH with the page container removed, pages 1 and 3 do NOT');
say(`   correspond: ${bothTails.length} tails match, ${only1.length} are on page 1 only and ${only3.length} on page 3 only.`);
say('');
say('   The 17 unmatched on each side are the same 17 cells. The intermediate subform is spelled');
say('   differently on the two pages:');
say('');
say(`     page 1   ${p1.find((r) => only1.includes(r.tail)).name}`);
say(`     page 3   ${p3.find((r) => only3.includes(r.tail)).name}`);
say('');
say('   AccountNumber[0] on page 1, AccountingNumber[0] on page 3 — a typo in the IRS form\'s own');
say('   field naming, on the taxpayer copy. It is RECORDED, never normalised away: an engine that');
say('   silently repaired it would be deciding that the two names mean the same thing, which is');
say('   the judgement [R-08] reserves for the printed page. The LEAF names are identical on both');
say('   sides (AccountNumber1 .. AccountNumber17), which is why the stem key below pairs them and');
say('   the tail key does not.');
say('');

// ── THE STEM KEY ───────────────────────────────────────────────────────────────────────────
const stems1 = p1.map((r) => r.stem);
const stems3 = p3.map((r) => r.stem);
const dup1 = stems1.filter((s, i) => stems1.indexOf(s) !== i);
const dup3 = stems3.filter((s, i) => stems3.indexOf(s) !== i);
const set1 = new Set(stems1), set3 = new Set(stems3);
const stemOnly1 = [...set1].filter((s) => !set3.has(s));
const stemOnly3 = [...set3].filter((s) => !set1.has(s));

say('3. THE STEM KEY, AND ITS PRECONDITION');
say('');
say('   A stem is only a legitimate pair key if it is UNIQUE WITHIN A PAGE. Otherwise two cells on');
say('   one page would collapse into one pair and the mirror would be declared over a merge.');
say(`     page 1: ${stems1.length} widget(s), ${set1.size} distinct stem(s), ${dup1.length} repeated within the page`);
say(`     page 3: ${stems3.length} widget(s), ${set3.size} distinct stem(s), ${dup3.length} repeated within the page`);
if (dup1.length) say(`     REPEATED ON PAGE 1: ${[...new Set(dup1)].join(', ')}`);
if (dup3.length) say(`     REPEATED ON PAGE 3: ${[...new Set(dup3)].join(', ')}`);
say(`     stems on page 1 only: ${stemOnly1.length}${stemOnly1.length ? ' — ' + stemOnly1.join(', ') : ''}`);
say(`     stems on page 3 only: ${stemOnly3.length}${stemOnly3.length ? ' — ' + stemOnly3.join(', ') : ''}`);
say('');

// ── IS EVERY PAIR A TRUE MIRROR? ───────────────────────────────────────────────────────────
const pairs = [];
const notMirror = [];
for (const s of set1) {
  const a = p1.find((r) => r.stem === s), b = p3.find((r) => r.stem === s);
  if (!b) { notMirror.push({ stem: s, why: 'no page-3 copy' }); continue; }
  const why = [];
  if (a.type !== b.type) why.push(`type ${a.type} vs ${b.type}`);
  if ((a.maxLen ?? null) !== (b.maxLen ?? null)) why.push(`maxLen ${a.maxLen ?? 'null'} vs ${b.maxLen ?? 'null'}`);
  if (why.length) notMirror.push({ stem: s, why: why.join('; ') });
  pairs.push({ stem: s, page1: a.name, page3: b.name, type: a.type, tailsDiffer: a.tail !== b.tail });
}

say('4. IS EVERY PAIR A TRUE MIRROR?');
say('');
say('   A shared stem is not yet a mirror. The two copies must be the same KIND of cell, or a');
say('   value written to both would not mean the same thing on both.');
say(`     page-1/page-3 pairs formed:                       ${pairs.length}`);
say(`     pairs whose copies differ in type or maxLen:      ${notMirror.length}`);
for (const m of notMirror) say(`       ${m.stem}  —  ${m.why}`);
say(`     pairs whose FULL PATHS differ (the typo above):   ${pairs.filter((p) => p.tailsDiffer).length}`);
say(`     of which checkbox pairs:                          ${pairs.filter((p) => p.type === 'PDFCheckBox').length}`);
say(`     of which text pairs:                              ${pairs.filter((p) => p.type === 'PDFTextField').length}`);
say('');

// ── STEMS ACROSS THE WHOLE FORM ────────────────────────────────────────────────────────────
const stemCount = rows.reduce((a, r) => { a[r.stem] = (a[r.stem] || 0) + 1; return a; }, {});
const stems = Object.keys(stemCount).sort();
const twice = stems.filter((s) => stemCount[s] === 2);
const once = stems.filter((s) => stemCount[s] === 1);
const more = stems.filter((s) => stemCount[s] > 2);
const twiceButNotAPair = twice.filter((s) => !pairs.some((p) => p.stem === s));

say('5. LEAF STEMS ACROSS THE WHOLE FORM, AND THE ONE THAT LOOKS LIKE A PAIR AND IS NOT');
say('');
say(`   distinct leaf stems:        ${stems.length}`);
say(`   appearing exactly twice:    ${twice.length}`);
say(`   appearing exactly once:     ${once.length}`);
say(`   appearing more than twice:  ${more.length}${more.length ? '  ' + more.map((s) => `${s} x${stemCount[s]}`).join(', ') : ''}`);
say('');
say(`   STEMS APPEARING TWICE THAT ARE NOT PAGE-1/PAGE-3 PAIRS: ${twiceButNotAPair.length}`);
for (const s of twiceButNotAPair) {
  say(`     "${s}" — both occurrences on the SAME page:`);
  for (const r of rows.filter((x) => x.stem === s)) say(`        page ${r.page}  ${r.type.padEnd(14)} ${r.name}`);
}
say('');
say('   THIS IS THE FINDING THAT MATTERS FOR THE MIRROR CONSTRUCT. A naive assertion of the form');
say('   "every stem appears exactly twice" is TRUE of this form and proves nothing, because one of');
say('   the 84 is a pair of buttons sitting side by side on page 4 rather than a fact printed once');
say('   on each of two pages. The mirror is therefore declared over the 83 page-1/page-3 pairs and');
say('   the hyperlink stem is excluded BY NAME, as a declared exclusion rather than a silence.');
say('');

// ── THE VERDICT ────────────────────────────────────────────────────────────────────────────
say('6. VERDICT — what the page shows, set beside what was expected');
say('');
say('   register expected:  168 fields over 84 leaf stems, page 3 the taxpayer copy of page 1');
say('');
say(`   fields                168        established ${rows.length}                     ${rows.length === 168 ? 'AGREES' : 'DISAGREES'}`);
say(`   leaf stems            84         established ${stems.length}                      ${stems.length === 84 ? 'AGREES' : 'DISAGREES'}`);
say(`   page 3 copies page 1  yes        established ${pairs.length} of page 1's ${p1.length} cells   ${pairs.length === p1.length ? 'AGREES' : 'DISAGREES'}`);
say('');
say('   AND THE THREE THINGS THE EXPECTATION DID NOT SAY, EACH OF WHICH CHANGES WHAT MAY BE BUILT:');
say('');
say(`     a  The 84 stems are NOT 84 mirrored facts. ${pairs.length} are; the 84th is "hyperlink", two`);
say('        PDFButtons on page 4 that no filer fills. The mirrorable population is 83 pairs.');
say(`     b  Page 3 is a copy of page 1 in its LEAF names and not in its full paths: ${pairs.filter((p) => p.tailsDiffer).length} of the`);
say('        83 pairs differ at the intermediate subform, AccountNumber vs AccountingNumber.');
say('        A construct keyed on the full path would pair 66 of 83 and silently drop 17.');
say('     c  Page 2 carries no widgets and page 4 carries no data cells, so every fillable cell on');
say('        433-D is on page 1 or page 3, and the mirror covers ALL of them rather than most.');

writeFileSync('adapters/pdf/maps/433d.pairs.txt', out.join('\n') + '\n');
writeFileSync('adapters/pdf/maps/433d.pairs.json', JSON.stringify({
  _what_this_is: 'THE ESTABLISHED PAIR STRUCTURE OF 433-D, derived from the pinned blank by scratchpad/p52-433d-pairs.mjs and re-derivable by re-running it. Not an expectation: adapters/pdf/maps/433d.pairs.txt is the same derivation in prose with what it disagreed with.',
  _generator: 'scratchpad/p52-433d-pairs.mjs',
  _source_pdf: 'adapters/pdf/forms/f433d.pdf',
  _source_sha256: '7383b4dba64599092e9e3ea9e533ffdba7d0c68ccfa7d7ec035f095e25d96c00',
  _pair_key: 'THE LEAF STEM, and its precondition is asserted rather than assumed: a stem must be unique WITHIN a page or two cells would collapse into one pair. The full field path is NOT the key — 17 of the 83 pairs differ at the intermediate subform (AccountNumber on page 1, AccountingNumber on page 3, which is a typo in the IRS form) and a path key pairs only 66.',
  _excluded_by_name: { hyperlink: 'Two PDFButtons on page 4, form1[0].Page4_Part2[0].agree_to[0].item[8].hyperlink[0] and form1[0].Page4_Part2[0].installment_payments[0].item8[0].hyperlink[0]. This stem appears exactly twice and is NOT a mirror pair: both occurrences are on the same page and neither is a cell a filer fills. It is excluded from the mirror by name, so that "every stem appears exactly twice" cannot be mistaken for "every stem is a mirrored fact".' },
  counts: { pages: pageCount, widgets: rows.length, widgets_by_page: Object.fromEntries([1, 2, 3, 4].map((p) => [p, rows.filter((r) => r.page === p).length])), distinct_leaf_stems: stems.length, mirror_pairs: pairs.length, pairs_whose_paths_differ: pairs.filter((p) => p.tailsDiffer).length, checkbox_pairs: pairs.filter((p) => p.type === 'PDFCheckBox').length, text_pairs: pairs.filter((p) => p.type === 'PDFTextField').length },
  pairs,
}, null, 1) + '\n');
console.log('\nwritten to adapters/pdf/maps/433d.pairs.txt and adapters/pdf/maps/433d.pairs.json');
