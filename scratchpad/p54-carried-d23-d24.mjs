// [D-23] resolved, and [D-24] raised. Run from the repo root.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/_carried.cross-form.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));

const i = doc.open.findIndex((x) => x.id === 'D-23');
if (i < 0) { console.error('STOP — D-23 is not open.'); process.exit(2); }
const [d23] = doc.open.splice(i, 1);

d23.status = 'RESOLVED';
d23.resolved_in = 'prompt 54 commit 1';
d23.the_ruling_that_resolved_it =
  'ADOPTED AS WRITTEN, and it became two standing rules rather than one form-specific finding. [R-35]: a binary that does not partition its subject is a defect, not a simplification -- a cell that exists for ONE SUBJECT ONLY is not a cell whose subject does not matter. [R-36]: classify from the caption’s own words; proximity answers a different question, and cells the page draws as repetitions of one field under one caption must share a class.';
d23.what_this_item_got_RIGHT =
  'EVERYTHING IT CLAIMED, and the shape of the remedy as well. The three relations are the three the form draws; the emptiness assertion rather than a route is the right instrument for the third and is what the map now carries; and both failure directions were named before either was built, which is what made stopping obviously correct rather than merely cautious. It also refused to retune the band to produce the classification already believed, one level up, on its own derivation.';
d23.what_this_item_got_WRONG =
  'NOTHING IN ITS CLAIM. One thing in its SCOPE: it presented the over-inclusion as a property of the band, and the band was not the defect. The band answers the pairing question and answers it about as well as this page permits; what was wrong was JOINING every run in it into one string and classifying the string, which is an operation on the neighbourhood rather than on any caption. The two conditional captions the item names are the proof: concatenated they name both subjects, and separately neither does. Retuning the band -- which the item rightly refused -- would not have repaired the join, and the join is what produced RSI5 independent and RSI6 dependent out of one printed pair.';
d23.what_the_classes_came_out_as =
  'Derived in adapters/pdf/maps/433d.subject-classes.json and re-derivable with `node scratchpad/p54-433d-derive-classes.mjs --check`. Of 83 stems: 1 DEPENDENT (Taxpayer, the SSN/EIN identity box, decided by "Social Security or Employer Identification Number (SSN/ITIN/EIN)"), 5 CONDITIONAL (3 individual -- Spouse, SpouseSignature, RSI5; 2 entity -- TitleIf, RSI6), 77 INDEPENDENT. The item’s own derivation returned 14 stems as dependent; 5 of those 14 are the conditionals it predicted, and the other 8 -- OrWrite, AI2 and AgreementReviewCycle1..6 -- are the over-inclusions it named by name, every one of which now classifies as independent from its own caption.';
d23.the_two_markers_withdrawn_and_why =
  'ON EVIDENCE, NOT ON RESULT, and both are demonstrated by `npm run markers:433d`, which enumerates every printed run each candidate matches. `Taxpayer` was an individual marker and matches "Name and address of taxpayer(s)", of which the subject register says in as many words "NEITHER NAMES A KIND OF LEGAL PERSON" -- an entity is a taxpayer, and the marker’s own stated ground was true of the printed PAIR "(Taxpayer)"/"(Spouse)" and was applied to one word of it. `Business` was an entity marker and matches four runs of which THREE are not statements about a legal person: "(Work, cell or business)" and both "business days" runs in the ACH paragraph. It is replaced by "Business Owner" and "Businesses", the phrases the register actually quotes.';
d23.and_one_marker_was_matching_a_word_it_was_never_meant_to =
  '`ITIN` as a bare substring matches "...either orally or in wr-ITIN-g at least three (3) business days...". A marker for a taxpayer identification number, firing on the word WRITING, inside the one paragraph on the page that is pure boilerplate. It is [R-17]’s class one level out -- a predicate matching something it was never meant to match, silently, with nothing anomalous in its source -- and it is why every marker is now compiled with a word boundary at each end. The boundaries then refused to load against their own probes, because the assistance line prints "Individuals", "Wage Earners" and "Business Owners" and the markers quoted from it are singular; the tolerance for one trailing plural is probed in both directions.';
d23.the_headroom_bound_restated =
  'A BOUND AND A FLOOR, no number invented between them, and the bound MOVED because a conditional cell needs no second property. [R-32]’s bound for 433-D is one property per distinct leaf stem plus one more for each DEPENDENT stem: 83 + 1 = 84 at most, against a headroom of 116. The floor is 0, since every stem may bind an existing property. The 5 conditional stems add NOTHING to the bound -- that is the whole practical consequence of the third class, and under the binary they would have added 5 properties that could only ever be empty. The previous bound was "at most 83 + (dependent stems)", stated as at most 97 on the 14 the binary returned; 84 is that same expression with the classes derived.';
doc.resolved.push(d23);

doc.open.push({
  id: 'D-24',
  form: 'engine',
  raised_in: 'prompt 54 commit 1',
  subject: 'THE MAPS DIRECTORY HAS NO RESIDUAL-FILE CHECK. A sidecar landed there is swept by count-sweep.mjs only if its name matches one of the eight kinds sweptFiles() lists, and covered by the boundary register only if it matches a pattern somebody wrote. A file matching neither is in no sweep and in no boundary, and NOTHING SAYS SO.',
  how_it_was_found:
    'By adding a fourth 433-D sidecar and asking what covered it. The answer was nothing -- and the same was true of the three already there. adapters/pdf/maps/433d.pairs.json, 433d.pairs.txt and 433d.lineage.json had been outside every sweep and every boundary since the commit that landed them, two prompts earlier, and 433d.mirror.json since the commit after that.',
  why_the_gap_is_the_SPELLING_and_not_a_decision:
    '[SB-13] excuses each form’s intake record and its pattern reads *.intake.json and *.lineage-*.json. 433-D’s files are spelled pairs.json, pairs.txt and lineage.json -- lineage with no hyphen, because 433-D’s lineage is against five forms rather than one named predecessor. Nobody chose to exclude them. It is [R-15]’s shape exactly: an exclusion that is a property of the reading rather than a claim anybody made, which is what [SB-90] found for subdirectories and what samples/ was in when it held two wrong typed counts.',
  what_was_done_here:
    'The four files are now declared -- [SB-23] for the two DERIVED CONSTRUCTS (mirror and subject-classes), whose ground is that a generator re-derives each byte for byte on a standing run and whose cross-check reads the generator out of the artefact’s own declaration and then looks for it in package.json; [SB-24] for the three INTAKE RECORDS, on [SB-13]’s ground and no wider, cross-checked by requiring the successor construct to exist.',
  why_it_is_still_OPEN:
    'BECAUSE FOUR FILES BEING DECLARED IS NOT THE SAME AS THE FIFTH BEING CAUGHT. What was fixed is the instance; what is not fixed is that the next sidecar dropped into adapters/pdf/maps/ will be outside everything in exactly the same way and nothing will report it. The check that closes this is a residual enumeration -- every file in the swept directories, minus what count-sweep sweeps, minus what the boundary register claims, must be EMPTY -- and it is the same construct [SB-90] already carries for subdirectories, one level out to files. It is not built here: it is a change to what the boundary register measures, across every swept directory and every form, in a commit whose subject is a discriminator, and that is the adjacent change that has twice reproduced the defect class it was meant to close ([R-12], [R-20]).',
  the_figure_and_its_universe:
    '4 files found outside, of 54 in adapters/pdf/maps/. That figure is a count of what was looked at rather than of what is in this state -- the same distinction [R-31] records as a factor of forty-eight -- because the only instrument that enumerated anything here was a person reading a directory listing. THE HONEST STATEMENT IS THAT NOTHING ENUMERATES THIS, which is [R-14]’s third instance verbatim: an observation nothing enumerates is not a finding.',
  status: 'OPEN',
});

doc._count = { open: doc.open.length, resolved: doc.resolved.length };
writeFileSync(P, JSON.stringify(doc, null, 1) + '\n');
console.log(`[D-23] resolved, [D-24] raised. open=${doc._count.open} resolved=${doc._count.resolved}`);
