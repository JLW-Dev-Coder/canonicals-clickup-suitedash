// Adds [D-21] and [D-22] — the two items 433-D's intake raised — and re-derives _count.
// A FILE and not a `node -e`, for the reason recorded in scratchpad/p52-carried-d20.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/_carried.cross-form.json';
const c = JSON.parse(readFileSync(P, 'utf8'));
const all = [...c.open, ...c.resolved].map((x) => x.id);
for (const id of ['D-21', 'D-22']) if (all.includes(id)) { console.error(`${id} is already in the register.`); process.exit(2); }

const items = [
  {
    id: 'D-21',
    form: '433-D, and it bears on every form that follows it',
    raised_in: 'Prompt 52 commit 2, deriving 433-D\'s subject from its printed page',
    subject: 'THE SUBJECT AXIS ANSWERS PER FORM AND 433-D\'S SUBJECT IS PER RECORD. Every reuse verdict this engine has made rests on a form fixing its subject in print. 433-D does not.',
    the_shape: '433-D prints NO eligibility text — six phrases searched across all four drawn pages, all six return zero. What it prints instead points BOTH ways at once: "Social Security or Employer Identification Number (SSN/ITIN/EIN)" on one line, "(Taxpayer)" and "(Spouse)" beneath it; a signature row carrying both "Title (if Corporate Officer or Partner)" and "Spouse\'s signature (if a joint liability)"; an assistance line naming "Individual - Self-Employed/Business Owners, Businesses" and "Individuals - Wage Earners"; and an IRS-use block offering an IMF review and a BMF review. So one filed 433-D is about a natural person and the next is about a corporation, and nothing printed on the form distinguishes them — only which identifier the filer wrote.',
    what_it_does_to_the_register: '433-D COINCIDES WITH ALL FIVE registered forms, including with 433-A and 433-B, which are MUTUALLY EXCLUSIVE with each other. That is not an inconsistency in adapters/pdf/maps/_subjects.cross-form.json; it is the true relation, and the register now records it with the asymmetry named on each of the five pairs rather than levelled into the five coincidences already there. 433-A and 433-F coincide because BOTH are about the individual and neither admits anything else; 433-D coincides with them because it ADMITS the individual among others. Two different relations wearing one word is the thing that register exists to keep apart.',
    why_it_is_a_problem_today: '[R-06]: the naming test runs on the SUBJECT and not on the question. On the other five forms that test is answerable once for the whole form, which is exactly how 433-B(OIC)\'s 113 form-specific names and 433-B\'s nine reuses were settled. On 433-D it is not answerable once. A 433-D cell that looks like an existing individual property and a 433-D cell that looks like an existing entity property may BOTH be right, for different filers, through the same printed cell — and a property cannot hold two values for one filer at one moment, which is the whole of the test.',
    the_ruling: 'RAISED AND NOT RESOLVED. It is a question about what may be built and it must be answered BEFORE 433-D\'s crosswalk, not during it — the same ordering the subject register\'s own `_how_to_use_it` states. Resolving it inside an INTAKE, in a cycle whose scope line excludes the crosswalk, is the adjacent change [R-12] says to expect to reproduce the defect class.',
    what_is_actually_being_asked: 'THREE CANDIDATE SHAPES, none chosen here, each with what it would cost. (1) TREAT 433-D AS INDIVIDUAL-ONLY and refuse EIN records — cheap, and it silently drops the business installment agreement, which is a real filing. (2) SPLIT EVERY AMBIGUOUS KEY into an individual-subject property and an entity-subject property — safe on the subject axis and expensive against a headroom of 116. (3) MAKE THE SUBJECT A RECORD-LEVEL DISCRIMINATOR, one declared input that routes each ambiguous key to the individual property or the entity property — closest to how `record_shape` already routes 433-A(OIC), and the only one that costs nothing extra per fact. The reason to write these down now is that the third would change what the crosswalk IS, and discovering that during the crosswalk is discovering it too late.',
    built_when: 'Not built. To be answered before 433-D\'s crosswalk, which is the next prompt after its bindings.',
    status: 'OPEN',
  },
  {
    id: 'D-22',
    form: 'engine-wide; demonstrated on 433-B and now on 433-D',
    raised_in: 'Prompt 52 commit 2, running adapters/pdf/correlate-labels.mjs against 433-D during intake',
    subject: '[B-01] HAS A SECOND FORM. The label correlator ranks `above` and `left` on ONE distance scale, so on any caption-LEFT layout it answers a wide banner run one row up instead of the caption beside the cell. Recorded on 433-B as a form-local item; it is not form-local.',
    the_shape: 'Three probes were established from 433-D\'s printed page and offered to the correlator\'s self-check. Two passed. The third — "b. Account number", which prints at y 375.4, x 18.0..93.5, with its BASELINE INSIDE the cell\'s rectangle (y 372.96..383.04) and 28.9pt to its left — was answered with "— Attach a voided check or complete this part only if you choose to make payments by direct debit. Read the instructions on the back of", the DIRECT DEBIT banner whose baseline is 28.6pt above the cell\'s top edge. 28.6 above beats 28.9 left. THE CORRECT CAPTION IS FIRST IN THE TOOL\'S OWN `left` CANDIDATE LIST, exactly as [B-01] records for all three of its 433-B probes.',
    why_the_probe_was_not_retuned: 'Because that is fitting the guard to the tool, and the guard exists to catch the tool — [B-01]\'s own `why_it_is_not_settled_here` says so in as many words, and correlate-labels.mjs carries the same sentence in its header above the PROBES object. Two of 433-D\'s three probes pass; the third was chosen because the field path would give a different answer from the page, which is what a probe is FOR. A form on which the correlator cannot be shown to work is a form whose labels file must not exist, and 433-D\'s does not.',
    why_it_is_a_problem_today: 'IT IS NOW A PATTERN AND NOT AN ODDITY, AND THE POPULATION IS PREDICTABLE. Caption-above dominates 433-A, 433-F and 433-A(OIC), which is why the ranking was right for three forms and looked like a rule. Caption-left dominates 433-B\'s Sections 1 and 2 and 433-D\'s DIRECT DEBIT block. So the correlator works on the forms it was written against and fails on the ones it was not, and each new form pays the cost of discovering that again during its intake. 433-D is the second form to be mapped without a labels file.',
    the_ruling: 'RAISED AND NOT RESOLVED, and the reason is unchanged from [B-01]: changing the ranking is a change to a tool that four forms\' maps were authored against, and it needs its own regression across all four rather than a fix during an intake. What IS new is the evidence that it will keep happening, which is the argument for doing it rather than carrying it a third time. Note also that this tool is in no npm script and in no gate step — it is an authoring instrument run by hand — so nothing in the regression would ever have reported either instance. [R-30] is what surfaced this one.',
    what_would_settle_it: 'A ranking that treats a caption crossing a printed ROW BOUNDARY as further away than one beside the cell, rather than comparing raw point distances across two axes. In all four demonstrated failures the correct caption is already in the candidate list and ranked second, so the retrieval is right and only the ordering is wrong — which is a small change with a large blast radius, and therefore one that owes a regression over all four existing labels files rather than a patch.',
    built_when: 'Not built. [B-01] carries the 433-B half; this carries the class.',
    status: 'OPEN',
  },
];

c.open.push(...items);
c._count = { open: c.open.length, resolved: c.resolved.length };
writeFileSync(P, JSON.stringify(c, null, 1) + '\n');

const back = JSON.parse(readFileSync(P, 'utf8'));
const problems = [];
for (const item of items) {
  const landed = back.open.find((x) => x.id === item.id);
  if (!landed) { problems.push(`${item.id} is not in the file that was just written.`); continue; }
  for (const [k, v] of Object.entries(item)) {
    if (landed[k] !== v) problems.push(`FIELD MANGLED  ${item.id}.${k}`);
    if (typeof v === 'string' && /^\s*$/.test(v)) problems.push(`FIELD EMPTY    ${item.id}.${k}`);
  }
}
if (back._count.open !== back.open.length || back._count.resolved !== back.resolved.length) problems.push('_count does not re-derive.');
if (problems.length) { for (const p of problems) console.error(`  ${p}`); process.exit(2); }
console.log(`[D-21] and [D-22] landed: open ${back._count.open}, resolved ${back._count.resolved}; every field re-read from disk and byte-equal.`);
