// 433-D'S THREE-CLASS SUBJECT TABLE, DERIVED AND WRITTEN.
//
//   node scratchpad/p54-433d-derive-classes.mjs [--check]
//
//   writes adapters/pdf/maps/433d.subject-classes.json
//   --check re-derives and compares without writing; a difference is a STOP
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT IS DECLARED HERE AND WHAT IS DERIVED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// DECLARED, per stem: WHICH DIRECTIONAL CANDIDATE governs it -- "above:1", "left:1" and so on,
// where the number is the rank WITHIN that one direction. That is the pairing question, it is a
// judgement about the printed page, and it is written down so it can be argued with.
//
// DERIVED, from the page, on every run: the candidate's TEXT, its gap, whether the direction had
// one candidate or several, the whole band, the printed series, and the CLASS. Nothing about the
// class is typed here. `adapters/pdf/subject-class.mjs` computes it from the caption's own words,
// and this file never writes a class it did not get back from that function.
//
// SO A TRANSCRIPTION CANNOT ENTER. The chain quotes no caption text at all -- it names a
// direction and a rank, and the words come out of the PDF. That is deliberate: [Q-01] in the
// carried register records two rounds of defects entering through prefixes reconstructed by
// hand, and a caption retyped into a declaration is the same shape.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// EVERY DECLARATION THAT IS NOT THE NEAREST-OVERALL CANDIDATE CARRIES A WITNESS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A chain is DETERMINATE when nothing in a declared direction COMPETED with what it declared,
// and a competitor is defined by the page rather than by a tolerance: a run in the same
// direction that is not itself in the chain and sits LESS THAN ONE PRINTED ROW PITCH beyond the
// furthest link declared in that direction. A run a full row further away is in a different
// printed row, and a different printed row is a different caption line.
//
// THE FIRST DRAFT COUNTED ANY SECOND CANDIDATE AS A COMPETITOR and reported 26 of the 83 chains
// undetermined -- including "Tax periods" at 2.8pt against a runner-up at 17.4pt, which is a
// caption and a line from a different block. A determinacy test that is unsatisfiable stops
// being read, which is [R-10]; one that counts a run 15pt further away as a rival is measuring
// the truncation of the candidate list rather than the page. The pitch is the same 12.30pt
// derived for the band, so the test moves with the form's own layout and is not a constant.
//
// Where a direction did have a competitor, or where the declared direction is not the one
// holding the nearest run overall, a SECOND WITNESS is named -- a second printed fact that
// settles it independently of distance. An undetermined link with no witness is a STOP.
//
// FOUR OF THESE ARE THE ITEMS THE RULING FLAGGED, and each is a case where the previous
// derivation's neighbourhood blob reached across a printed boundary:
//
//   OrWrite                 the assistance line sits 7.2pt above it and names both legal
//                           persons. It captions the two TELEPHONE NUMBERS under the printed
//                           heading "For assistance, call:", not the address box: the box's own
//                           caption opens the next instruction 4.5pt to its LEFT, and the
//                           parenthetical telling the filer what to write is 1.9pt BELOW it.
//   RSI5 / RSI6             each is captioned by the run 9.0pt to its right, and those two runs
//                           name the two Master Files separately. The blob joined the column.
//   AgreementReviewCycle1-6 three of the six have "RSI 6 PPIA BMF 2 year review" as their
//                           nearest run above, at 6.8pt, and the other three do not -- which is
//                           the whole defect, because the six are one drawn series of one
//                           printed field. All six are captioned from the LEFT, where all six
//                           have exactly one candidate and it is the same one.
//   AI2                     captioned 9.0pt to its right by "AI 2 All other PPIAs", which names
//                           no subject. It was dependent only because the RSI column was within
//                           120pt of it.

import { readFileSync, writeFileSync } from 'node:fs';
import { readForm, SIDE } from '../adapters/pdf/caption-candidates.mjs';
import { classOfChain, INDIVIDUAL, ENTITY, canary } from '../adapters/pdf/subject-class.mjs';

const OUT = 'adapters/pdf/maps/433d.subject-classes.json';
const check = process.argv.includes('--check');

// ── THE DECLARATION: which candidate governs each cell, and the witness where one is owed ──
const W = {
  column: 'the printed COLUMN BOUNDARY. Every in-row candidate for this cell begins at x=302.4, which is where the right-hand column of the identity block starts; this cell ends at x=295.2 and is the whole of the left-hand column. A run in the other column is not this cell’s caption.',
  masthead: 'the runners-up in this direction are MASTHEAD runs -- the form number, the revision date and the instruction pointer -- which sit above the rule that opens the identity block and caption no cell.',
  checkboxRight: 'THE FORM’S OWN CAPTION-RIGHT CONVENTION FOR CHECKBOXES, which is derived on every run rather than asserted: all 13 checkboxes on this page carry a printed run beginning within 9.1pt to their right, and none of the 13 is captioned from any other direction at a comparable gap.',
  sentence: 'the runners-up in this direction are the SECOND AND THIRD LINES OF THE SAME PRINTED SENTENCE, at the same gap. Naming the first line names the sentence.',
  subCaption: 'the printed SUB-CAPTION ROW. The runners-up are the captions of the telephone block one printed row below, which caption the two telephone cells and not this one.',
  orWrite: 'the printed INSTRUCTION STRUCTURE. The nearest run above is one of two telephone numbers drawn under the heading "For assistance, call:" -- that heading captions the numbers, and this cell is the object of the NEXT instruction, whose opening words sit 4.5pt to its left and whose parenthetical ("City, State, and ZIP Code") sits 1.9pt below it. The two links of this chain are the two halves of one printed sentence and the run above belongs to a different one.',
  seriesLeft: 'the cell is a member of a PRINTED SERIES and this is the series caption, which every member of the series has as its unique left-hand candidate. The runs above vary from member to member -- for this series three members have "RSI 6 PPIA BMF 2 year review" 6.8pt above them and three do not -- so the above direction cannot be captioning a field the page draws once.',
  lienColumn: 'the printed COLUMN HEADING "A NOTICE OF FEDERAL TAX LIEN (Check one box below)" stands over all four boxes of this column, and each box’s own option is the run 5.4pt to its right. Both are named in the chain.',
  signatureRow: 'the SIGNATURE ROW draws five separately captioned cells side by side, each with its own caption drawn directly above it and horizontally over its own extent. The band reaches 120pt either side and therefore takes in the NEIGHBOURING cells’ captions -- which is exactly the over-inclusion it is declared to have. The chain names the run or runs above THIS cell and over THIS cell’s extent; every dissenting run is the caption of a different cell between 61pt and 145pt away along the same printed row, and each of those cells binds it in its own chain.',
  acaNote: 'the dissenting run is one line of the four-line NOTE printed in the lien column -- "NOTE: A NOTICE OF FEDERAL TAX LIEN WILL NOT BE FILED ON ANY PORTION OF YOUR LIABILITY WHICH REPRESENTS AN INDIVIDUAL SHARED RESPONSIBILITY PAYMENT UNDER THE AFFORDABLE CARE ACT." It is prose about the lien, drawn from x=345.6 rightwards, and it captions NO CELL on this form: no widget on the page lies under it or beside it in that column. This cell ends at x=342 and belongs to the IRS-use block of the left column.',
  dollar: 'the runner-up in this direction is the printed "$" that opens the money cell, which is a currency glyph rather than a caption; it is named in the chain as well so that nothing in the row is silently dropped.',
};

const DECL = {
  NameAndAddress: { chain: ['above:1'], witness: [W.masthead, W.column] },
  SubmitANew: { chain: ['right:1'], witness: [W.checkboxRight, W.sentence] },
  Taxpayer: { chain: ['above:1', 'left:1'], witness: [W.masthead] },
  Spouse: { chain: ['above:1', 'left:1'], witness: [W.subCaption] },
  // above:2 and above:3 are the two halves of ONE printed caption line, "Your telephone numbers
  // (including area code)", drawn as two runs at the same baseline. Both are named, because
  // naming one and not the other would leave a run of the same printed row competing with the
  // chain -- which is what the determinacy test reported until both were in it.
  Home: { chain: ['above:1', 'above:2', 'above:3'] },
  WorkCellBusiness: { chain: ['above:1', 'above:2'] },
  OrWrite: { chain: ['left:1', 'below:1'], witness: [W.orWrite] },
  KindsOfTaxes: { chain: ['above:1', 'above:2'] },
  TaxPeriods: { chain: ['above:1'] },
  AsOf: { chain: ['left:1'] },
  AmountOwed: { chain: ['above:1', 'left:1'] },
  DollarAmount: { chain: ['left:1', 'above:1'], witness: [W.dollar] },
  DatePaid: { chain: ['left:1'] },
  AndDollarAmount: { chain: ['left:1'] },
  OnThe: { chain: ['left:1', 'right:1'] },
  date1: { chain: ['above:1', 'above:2'] },
  amount1: { chain: ['above:1', 'above:2'] },
  payment1: { chain: ['above:1'] },
  date2: { chain: ['above:1', 'above:2'] },
  amount2: { chain: ['above:1', 'above:2'] },
  payment2: { chain: ['above:1'] },
  Initial: { chain: ['right:1'] },
  AdditionalConditions: { chain: ['above:1', 'above:2'] },
  unable_to_make: { chain: ['right:1'], witness: [W.checkboxRight] },
  YourSignature: { chain: ['above:1'], witness: [W.signatureRow] },
  Date1: { chain: ['above:1'], witness: [W.signatureRow] },
  TitleIf: { chain: ['above:1', 'above:2'], witness: [W.signatureRow] },
  Date2: { chain: ['above:1'], witness: [W.signatureRow] },
  SpouseSignature: { chain: ['above:1', 'above:2'], witness: [W.signatureRow] },
  RSI1: { chain: ['right:1'], witness: [W.checkboxRight] },
  AI0: { chain: ['right:1'], witness: [W.checkboxRight] },
  RSI5: { chain: ['right:1'], witness: [W.checkboxRight] },
  AI1: { chain: ['right:1'], witness: [W.checkboxRight] },
  RSI6: { chain: ['right:1'], witness: [W.checkboxRight] },
  AI2: { chain: ['right:1'], witness: [W.checkboxRight] },
  EarliestCSED: { chain: ['left:1'] },
  CheckBoxIf: { chain: ['right:1'], witness: [W.checkboxRight] },
  OriginatorID: { chain: ['left:1'] },
  OriginatorCode: { chain: ['left:1'], witness: [W.acaNote] },
  Name: { chain: ['left:1'] },
  Title: { chain: ['left:1'], witness: [W.acaNote] },
  HasAlready: { chain: ['right:1', 'above:1'], witness: [W.checkboxRight, W.lienColumn] },
  FiledImmediately: { chain: ['right:1', 'above:1'], witness: [W.checkboxRight, W.lienColumn] },
  FiledWhen: { chain: ['right:1', 'above:1'], witness: [W.checkboxRight, W.lienColumn] },
  MayBe: { chain: ['right:1', 'above:1'], witness: [W.checkboxRight, W.lienColumn] },
  AgreementExamined: { chain: ['above:1', 'above:2'] },
  Date3: { chain: ['above:1'] },
};
for (let i = 1; i <= 9; i++) DECL[`RoutingNumber${i}`] = { chain: ['left:1'], witness: [W.seriesLeft] };
for (let i = 1; i <= 17; i++) DECL[`AccountNumber${i}`] = { chain: ['left:1'], witness: [W.seriesLeft] };
for (let i = 1; i <= 4; i++) DECL[`AgreementLocatorNumber${i}`] = { chain: ['left:1'], witness: [W.seriesLeft] };
for (let i = 1; i <= 6; i++) DECL[`AgreementReviewCycle${i}`] = { chain: ['left:1'], witness: [W.seriesLeft] };

// ── DERIVE ─────────────────────────────────────────────────────────────────────────────────
const dead = canary();
if (dead.length) { dead.forEach((d) => console.error(d)); process.exit(2); }

const r = await readForm('433d');
if (r.stop) { console.error(`STOP — ${r.stop}`); process.exit(2); }

const stops = [];
const rows = [];
for (const c of r.cells) {
  const d = DECL[c.stem];
  if (!d) { stops.push(`${c.stem}: no caption chain is declared for it. A cell with no class is a STOP, and a cell with no chain has no class.`); continue; }
  const links = [];
  for (const ref of d.chain) {
    const [dir, nStr] = ref.split(':');
    const n = Number(nStr);
    const bucket = c.candidates[dir] || [];
    const cand = bucket[n - 1];
    if (!cand) { stops.push(`${c.stem}: the chain names ${ref} and the ${dir} direction holds ${bucket.length} candidate(s).`); continue; }
    links.push({ ref, direction: dir, rank: n, gap_pt: cand.gap, caption: cand.text, candidates_in_direction: bucket.length });
  }
  if (links.length !== d.chain.length) continue;
  const verdict = classOfChain(links.map((l) => l.caption));
  // COMPETITORS, by the page's own row pitch. Per direction: the furthest gap the chain declares
  // there, plus one pitch, is the edge of that printed row; anything nearer than that edge which
  // the chain does not name is a rival the declaration had to choose against.
  const declaredText = new Set(links.map((l) => l.caption));
  const competitors = [];
  for (const dir of [...new Set(links.map((l) => l.direction))]) {
    const edge = Math.max(...links.filter((l) => l.direction === dir).map((l) => l.gap_pt)) + r.pitch;
    for (const cand of c.candidates[dir])
      if (cand.gap < edge && !declaredText.has(cand.text)) competitors.push({ direction: dir, gap_pt: cand.gap, caption: cand.text, edge_pt: Math.round(edge * 10) / 10 });
  }
  // DISSENTERS, and this is the clause with the teeth. A printed run inside this cell's BAND
  // whose own class differs from what the chain concluded, and which the chain does not name, is
  // a run that would have changed the answer had the chain reached for it. It is the exact shape
  // of the over-inclusion the band produces and the previous derivation acted on: the assistance
  // line sits in OrWrite's band and is DEPENDENT; the two RSI captions sit in every Agreement
  // Review Cycle box's band and are CONDITIONAL. A stem with dissenters must name a second
  // witness, so that every place this classification disagrees with the widest available reading
  // of the page is a place where a reason is written down rather than a silence.
  const dissent = [...new Set(c.band_with_series)]
    .filter((t) => !declaredText.has(t))
    .map((t) => ({ caption: t, ...classOfChain([t]) }))
    .filter((x) => x.class !== verdict.class)
    .map((x) => ({ caption: x.caption, class: x.class, side: x.side }));
  const determinate = competitors.length === 0 && dissent.length === 0;
  if (competitors.length && !(d.witness && d.witness.length))
    stops.push(`${c.stem}: the chain is NOT determinate — ${competitors.map((x) => `${x.direction} ${JSON.stringify(x.caption.slice(0, 40))}@${x.gap_pt} is inside the same printed row (edge ${x.edge_pt}pt)`).join('; ')} — and names no second witness.`);
  if (dissent.length && !(d.witness && d.witness.length))
    stops.push(`${c.stem}: ${dissent.length} run(s) in its band classify differently from the chain's ${verdict.class} and the chain names none of them — ${dissent.map((x) => `${JSON.stringify(x.caption.slice(0, 45))} is ${x.class}${x.side ? `:${x.side}` : ''}`).join('; ')} — and no second witness is named.`);
  // THE BAND IS THE BOUND. A declared caption that is not a printed run inside this cell's band
  // (or inside the band of a member of its printed series) is a STOP: the chain would be quoting
  // a run from somewhere else on the page.
  const band = new Set(c.band_with_series);
  const outOfBand = links.filter((l) => !band.has(l.caption));
  if (outOfBand.length) stops.push(`${c.stem}: ${outOfBand.length} declared caption(s) lie OUTSIDE the band: ${outOfBand.map((l) => JSON.stringify(l.caption.slice(0, 50))).join(', ')}`);
  rows.push({
    stem: c.stem, type: c.type, rect: c.rect,
    class: verdict.class, side: verdict.side, side_ambiguous: verdict.side_ambiguous || undefined,
    decided_by: verdict.decided_by,
    individual_markers: verdict.links.find((l) => l.caption === verdict.decided_by).individual,
    entity_markers: verdict.links.find((l) => l.caption === verdict.decided_by).entity,
    chain: links,
    per_link_class: verdict.links.map((l) => ({ caption: l.caption, class: l.class, side: l.side })),
    pairing: determinate ? 'determinate' : 'second_witness',
    competitors: competitors.length ? competitors : undefined,
    dissent: dissent.length ? dissent : undefined,
    witness: d.witness || undefined,
    band_runs: c.band.length,
    printed_series: c.series || undefined,
  });
}

if (stops.length) {
  console.error(`STOP — ${stops.length} declaration problem(s):`);
  stops.forEach((s) => console.error(`  ${s}`));
  process.exit(2);
}

const counts = { dependent: 0, conditional: 0, independent: 0 };
for (const row of rows) counts[row.class] += 1;
const bySide = { individual: rows.filter((x) => x.class === 'conditional' && x.side === 'individual').length,
                 entity: rows.filter((x) => x.class === 'conditional' && x.side === 'entity').length };

const seriesTable = r.series.map((s) => {
  const members = s.members.map((m) => rows.find((x) => x.stem === m.replace(/\[\d+\]$/, '').split('.').pop()));
  const classes = [...new Set(members.map((m) => m.class))];
  const chains = [...new Set(members.map((m) => m.decided_by))];
  return {
    axis: s.axis, pitch_pt: s.pitch, gap_pt: s.gap, size: s.size,
    members: members.map((m) => ({ stem: m.stem, class: m.class, side: m.side, decided_by: m.decided_by })),
    classes, shares_one_caption: chains.length === 1,
    verdict: classes.length === 1 ? 'AGREE' : (chains.length === 1 ? 'SPLIT ON ONE CAPTION' : 'SPLIT ON DISTINCT CAPTIONS'),
  };
});

const doc = {
  _what_this_is: 'THE SUBJECT CLASS OF EVERY CELL 433-D DRAWS, in three classes, derived from the printed caption that governs each. Written by scratchpad/p54-433d-derive-classes.mjs and re-derivable by re-running it with --check. NOTHING HERE IS TYPED except which directional candidate governs each cell; every caption, gap, marker, class and count comes out of the PDF on every run.',
  _generator: 'scratchpad/p54-433d-derive-classes.mjs',
  _source_pdf: 'adapters/pdf/forms/f433d.pdf',
  _the_three_classes: {
    dependent: 'the caption admits BOTH legal persons and the cell’s value changes kind with the one the record declares. It ROUTES: two properties and a declared discriminator between them.',
    conditional: 'the cell EXISTS FOR ONE SUBJECT ONLY and the caption says so. It gets an EMPTINESS ASSERTION and no second property: on a record declaring the other subject the cell must be empty, and a value there is a STOP. A conditional cell is one fact that is sometimes absent, not two facts.',
    independent: 'the caption names no subject and states no condition. It BINDS ONCE.',
    _and_a_fourth_state: 'A CELL WITH NO CLASS IS A STOP. There is no default and no silence: a stem this file cannot derive a chain for stops the run, which is why the count below is 83 and not "the ones that worked".',
  },
  _no_labels_file: 'THERE IS NO adapters/pdf/maps/433d.labels.json AND NOTHING HERE CITES ONE. correlate-labels.mjs refused to write for this form -- [D-22] records it answering the "b. Account number" probe with the DIRECT DEBIT banner one row up, because 28.6pt above beat 28.9pt left on one shared distance scale. The probes stay as they are. What is used instead is adapters/pdf/caption-candidates.mjs, which ranks each direction WITHIN ITSELF and never across, and returns all four rather than picking one; which one governs is declared per cell and bounded by the band.',
  _the_band: {
    row_pitch_pt: r.pitch,
    derived_from: `the MEDIAN of ${r.gaps} gap(s) between ${r.baselines} distinct printed baselines on page 1 -- derived from this form’s own layout, never typed`,
    above_pt: r.pitch * 2, below_pt: r.pitch, side_pt: SIDE,
    _not_retuned: 'UNCHANGED FROM THE DERIVATION THAT PRECEDED THIS ONE. The band was reported before the classes were known and it is the band used here. Choosing a constant because it yields the classification already believed is fitting the instrument to the wanted answer, and it is what [D-22] refuses to do to the correlator’s own probes.',
    _what_it_is_for: 'A BOUND, not a reading. A declared caption must be a printed run inside the band of its own cell or of a member of its printed series; it is never chosen by the band.',
  },
  counts: {
    stems: rows.length,
    widgets_on_page_1: r.widgets,
    printed_runs: r.runs,
    by_class: counts,
    conditional_by_side: bySide,
    determinate_pairings: rows.filter((x) => x.pairing === 'determinate').length,
    second_witness_pairings: rows.filter((x) => x.pairing === 'second_witness').length,
    printed_series: r.series.length,
  },
  markers: {
    individual: INDIVIDUAL,
    entity: ENTITY,
    _matched_how: 'each phrase on word boundaries with an optional trailing plural, case-insensitively, against ONE PRINTED RUN AT A TIME. Never against a join of the neighbourhood: joining "Title (if Corporate Officer or Partner)" to "Spouse’s signature (if a joint liability)" produces a string that names both legal persons out of two captions neither of which does, and that join is the defect the three classes replace.',
  },
  printed_series: seriesTable,
  stems: rows,
};

const text = JSON.stringify(doc, null, 1) + '\n';
if (check) {
  const have = readFileSync(OUT, 'utf8');
  if (have !== text) { console.error(`STOP — ${OUT} does not match what re-derivation produces. The file on disk is stale or was hand-edited.`); process.exit(2); }
  console.log(`OK — ${OUT} re-derives byte for byte from the page.`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT}`);
}

console.log('');
console.log(`433-D SUBJECT CLASSES — ${rows.length} stem(s), classified from the caption’s own words`);
console.log(`  dependent    ${counts.dependent}`);
console.log(`  conditional  ${counts.conditional}   (individual ${bySide.individual}, entity ${bySide.entity})`);
console.log(`  independent  ${counts.independent}`);
console.log(`  pairing      ${rows.filter((x) => x.pairing === 'determinate').length} determinate, ${rows.filter((x) => x.pairing === 'second_witness').length} by named second witness`);
console.log('');
for (const row of rows.filter((x) => x.class !== 'independent')) {
  console.log(`  ${row.class.toUpperCase().padEnd(12)}${row.side ? `(${row.side}) ` : ''}${row.stem}`);
  console.log(`      decided by ${JSON.stringify(row.decided_by)}`);
  console.log(`      markers: individual [${row.individual_markers.join(', ')}]  entity [${row.entity_markers.join(', ')}]`);
}
console.log('');
console.log('PRINTED SERIES — every one the page draws, with what its members classify as:');
for (const s of seriesTable) {
  console.log(`  ${s.verdict.padEnd(26)} ${s.axis} pitch ${s.pitch_pt}pt gap ${s.gap_pt}pt, ${s.members.length} member(s), ${s.shares_one_caption ? 'ONE shared caption' : `${new Set(s.members.map((m) => m.decided_by)).size} distinct captions`}`);
  console.log(`      ${s.members.map((m) => `${m.stem}=${m.class}${m.side ? `:${m.side}` : ''}`).join('  ')}`);
}
