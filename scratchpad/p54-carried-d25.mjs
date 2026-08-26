// [D-25] raised and RESOLVED in the same commit: [M-07] had never examined a bound stem.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/_carried.cross-form.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));
if ((doc.open || []).some((x) => x.id === 'D-25') || (doc.resolved || []).some((x) => x.id === 'D-25')) {
  console.error('STOP — D-25 already exists.'); process.exit(2);
}

doc.resolved.push({
  id: 'D-25',
  form: 'engine',
  raised_in: 'prompt 54 commit 2',
  resolved_in: 'prompt 54 commit 2',
  subject: '[M-07] — THE CLAUSE THE MIRROR CONSTRUCT EXISTS FOR — HAD NEVER EXAMINED A SINGLE BOUND STEM, on any form, since the day it was written. Its target extractor walked the map looking for an object with a `target` KEY, and no map in this repository has ever had that shape.',
  what_the_clause_says:
    '"A stem bound to only ONE copy is a STOP." It is the clause adapters/pdf/assert-mirror.mjs’s own header calls the one no exemption could ever state: a record whose value reaches the IRS copy and not the taxpayer copy produces a document whose two halves disagree, and nothing downstream would notice, because each half is internally consistent and the gate’s coverage counts a bound target as covered either way.',
  the_extractor_and_why_it_found_nothing:
    'It was a hand-written walk testing `typeof node.target === "string"`. A map binds `key -> "form1[0]..."` at the top level and `slot.column -> "topmostSubform[0]..."` inside a group; there is no `target` property anywhere in any of the six maps. So the walk returned an empty array from every map it was ever pointed at.',
  why_it_was_invisible:
    'THE ZERO LOOKED RIGHT. The report reads "[M-07] bindings examined: 0 bound stem(s) from 0 map target(s)", and when the construct landed 433-D genuinely had no map — the tool printed a paragraph saying so, citing [R-04], and the canary was declared as what stood under the clause until a map existed. The sentence was true. What was not true, and what nothing said, was that the same zero would have been printed on a form that DID have a map. The clause was standing over nothing and its own honest report about a missing map is what made the emptiness unremarkable.',
  how_it_was_found:
    'By reading the zero on the first run after 433-D got a map: 83 pairs declared, 166 targets bound, and "0 bound stem(s) from 0 map target(s)". The number that should have moved did not.',
  what_held_it_up_in_the_meantime:
    'THE CANARY, and this is the case for canaries stated as an outcome rather than as a policy. adapters/pdf/assert-mirror.mjs plants eleven directions against the REAL declaration — a stem bound on page 1 only, the same stem on page 3 only, a conforming pair, an unbound pair, and seven more for [M-08] — and every one of them exercises assertBindings() and assertValues() directly rather than through the extractor. So the CLAUSES were proved live the whole time; what was dead was the thing that fed them. A canary against the function and a live path that never reaches it is exactly the split [D-12] records, where a canary covered the comparator and not the population selector.',
  the_fix:
    'The extractor is now `walkTargets()`, imported from adapters/pdf/verify-form-coverage.mjs — the same walk gate steps 4, 5 and 6 use, so this clause and the gate’s own coverage address one set rather than two. It resolves a target by the roots derived in adapters/pdf/target-root.mjs, which is also what makes it work on a form rooted at `form1[0].`. AND THE ZERO IS NOW ITSELF A STOP: a map that exists and yields no target raises [M-07] in as many words, so the state this item describes cannot recur silently on the next form.',
  what_it_examines_now: 'On 433-D: 83 bound stem(s) from 188 map target(s), against 83 declared pairs. [M-08] separately examines 249 value pairs across 3 filled documents.',
  the_general_shape:
    'A GUARD WHOSE INPUT IS EMPTY REPORTS THE SAME THING AS A GUARD WITH NOTHING TO CHECK, and this engine has now met that at five levels — the vacuous-guard sweep, the atLeast contract, [R-04]’s zero-examined rule, assert-examined’s NOT REPORTED tier, and here. What is new in this instance is that the tool had a CORRECT AND LOUD EXPLANATION for its own zero, written down at length and citing the right rule, which is what stopped anybody asking whether the zero had a second cause.',
  status: 'RESOLVED',
});

doc._count = { open: doc.open.length, resolved: doc.resolved.length };
writeFileSync(P, JSON.stringify(doc, null, 1) + '\n');
console.log(`[D-25] recorded as resolved. open=${doc._count.open} resolved=${doc._count.resolved}`);
