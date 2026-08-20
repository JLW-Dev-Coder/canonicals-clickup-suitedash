// THE CANARY FOR blanket-audit.mjs COMPLETENESS COUNTERS [K-21], [K-22] and [K-23].
//
//   node adapters/pdf/assert-completeness-counters.mjs
//   Exit: 0 = all nine outcomes as expected, 3 = at least one is not (each is named).
//
// A COUNTER THAT HAS NEVER FAILED IS A COUNTER NOBODY HAS TESTED. These three decide whether
// three completeness claims in 433boi.map.json and 433boi.totals.json are allowed to stand,
// and all three were written in the same commit as the claims they check - which is exactly
// when a counter that quietly agrees with everything is invisible.
//
// THREE OUTCOMES PER COUNTER, and the third is the one [K-18] was written for. Whole: covered
// equals universe. Poisoned: the one thing it counts is removed and the counter must FIRE.
// Blind: the context can no longer see its universe, and the counter must STOP rather than
// report 0 of 0 as satisfied. [K-18] reported exactly that on its first run, inside the
// instrument built to prevent it.
//
// The counters are IMPORTED from blanket-audit.mjs and driven through their own count()
// functions. A reimplementation here would test the reimplementation.
//
// THE LOOKUP BELOW IS CALLED counterFor AND NOT get, AND THAT IS NOT A STYLE CHOICE.
// exclusion-sweep.mjs builds its universe of predicates from every `const NAME = (` in a swept
// file, then treats any call to a name in that universe as an exclusion site. Naming this
// helper `get` put the string "get" into that universe, and `catOf.get(b.entry) !== 'new'` in
// adapters/hubspot/reclassify-against-backbone.mjs — a call to Map.prototype.get, a built-in,
// in a file this canary has nothing to do with — became an UNREGISTERED exclusion on the next
// run. That is exactly the mechanism that had [X-16] disposing of pdf-lib's isChecked for three
// slices, reproduced one commit after it was written up. Carried as [D-08].
import { pathToFileURL } from 'node:url';
const base = new URL('./', import.meta.url).href;
const ba = await import(base + 'blanket-audit.mjs');
const cs = await import(base + 'count-sweep.mjs');

const ctx = await cs.buildContext('433boi');
const counterFor = (id) => { const e = ba.COMPLETENESS.find((x) => x.id === id); if (!e) { console.error(`no ${id}`); process.exit(2); } return e; };
const show = (id, label, r) => {
  const ok = r.fail ? 'FAIL(dead universe)' : r.covered === r.universe ? 'HOLDS' : 'FIRES';
  console.log(`  ${id}  ${label.padEnd(34)} ${String(r.covered).padStart(3)} of ${String(r.universe).padEnd(3)}  ${ok}${r.fail ? '  — ' + r.fail.slice(0, 60) : ''}`);
  return ok;
};
const clone = (o) => JSON.parse(JSON.stringify(o));

console.log('[K-21] every money total in the marker column on pages 2 and 3 is bound');
const a1 = show('K-21', 'as committed', counterFor('K-21').count(ctx));
// Poison: drop the (4) total from the map. Nothing else changes.
const c2 = { ...ctx, mapDoc: clone(ctx.mapDoc) };
delete c2.mapDoc.map.s2_4_total_vehicles;
const a2 = show('K-21', 'with (4) unbound', counterFor('K-21').count(c2));
// Poison: a context that can see no widgets at all - the [K-18] dead-counter shape.
const a3 = show('K-21', 'with no widgets readable', counterFor('K-21').count({ ...ctx, widgets: [] }));

console.log('[K-22] every widget on pages 2 and 3 declares no /MaxLen');
const b1 = show('K-22', 'as committed', counterFor('K-22').count(ctx));
const c4 = { ...ctx, widgets: ctx.widgets.map((w) => (w.page === 2 && w.rect[0] === 36 ? { ...w, maxLen: 40 } : w)) };
const b2 = show('K-22', 'with one cell given a /MaxLen', counterFor('K-22').count(c4));
const b3 = show('K-22', 'with no widgets readable', counterFor('K-22').count({ ...ctx, widgets: [] }));

console.log('[K-23] every vehicle slot declares both branches of the printed conditional');
const d1 = show('K-23', 'as committed', counterFor('K-23').count(ctx));
const c5 = { ...ctx, totalsDoc: clone(ctx.totalsDoc) };
c5.totalsDoc.totals = c5.totalsDoc.totals.filter((t) => t.line !== '4b leased');
const d2 = show('K-23', 'with the 4b leased branch dropped', counterFor('K-23').count(c5));
const c6 = { ...ctx, mapDoc: clone(ctx.mapDoc) };
delete c6.mapDoc.groups['4ac_vehicles'];
const d3 = show('K-23', 'with the group removed', counterFor('K-23').count(c6));

const expect = [['K-21 whole', a1, 'HOLDS'], ['K-21 poisoned', a2, 'FIRES'], ['K-21 blind', a3, 'FAIL(dead universe)'],
                ['K-22 whole', b1, 'HOLDS'], ['K-22 poisoned', b2, 'FIRES'], ['K-22 blind', b3, 'FAIL(dead universe)'],
                ['K-23 whole', d1, 'HOLDS'], ['K-23 poisoned', d2, 'FIRES'], ['K-23 blind', d3, 'FAIL(dead universe)']];
const bad = expect.filter(([, got, want]) => got !== want);
console.log('');
if (bad.length) { console.error(`CANARY DEAD — ${bad.length} of ${expect.length} outcome(s) are not what was expected:`); bad.forEach(([w, g, e]) => console.error(`  ${w}: got ${g}, expected ${e}`)); process.exit(3); }
console.log(`canary holds: ${expect.length} of ${expect.length} outcomes as expected — each counter holds whole, FIRES on its own poison, and STOPS rather than passing when it cannot see its universe.`);
