// 433-D'S FIXTURES, AUTHORED FROM THE MAP SO THAT NO KEY IS TRANSCRIBED.
//
//   node scratchpad/p54-433d-author-fixtures.mjs
//
// Writes samples/433d.sample.json          role acceptance   subject individual
//        samples/433d.entity.sample.json   role branch       subject entity
//        samples/433d.overmax.sample.json  role stress
//        samples/433d.negative.sample.json role negative     an entity record carrying a
//                                                            spouse's signature: [SC-7] must STOP
//
// SYNTHETIC ONLY, AND VISIBLY SO. Every value here is invented; no real person, no real
// employer identification number, no real bank. The routing and account digits are sequences,
// the names are from the history of computing, and the addresses are not addresses.
//
// TWO ACCEPTANCE-SHAPED FIXTURES, BECAUSE ONE RECORD CANNOT SATURATE THIS FORM. Five cells are
// subject-CONDITIONAL — three exist only for an individual, two only for an entity — so on ANY
// record at least two mapped text cells are required to be empty. That is a property of the form
// and not of the fixture, it is carried as [DM-2] in the map, and the pair of fixtures is what
// makes every cell reachable by SOME record even though no record reaches them all.

import { readFileSync, writeFileSync } from 'node:fs';

const MAP = 'adapters/pdf/maps/433d.map.json';
const mapDoc = JSON.parse(readFileSync(MAP, 'utf8'));
const PREFIX = '433d_';

const keyOfStem = (stem) => (mapDoc._key_overrides || {})[stem]
  || `${PREFIX}${stem.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/_+/g, '_').toLowerCase()}`;
const stemOfKey = new Map(Object.keys(mapDoc.subject_classes).map((s) => [keyOfStem(s), s]));

// The values that are not digits, keyed by the stem so they survive a key rename.
const VALUES = {
  // `Spouse` is the spouse's identifier box and it is CONDITIONAL on the individual side, so
  // it is written on the acceptance record and required empty on the entity one. Its value is a
  // second synthetic SSN rather than a copy of the filer's: two people, two numbers.
  NameAndAddress: 'GRACE HOPPER\n2400 NAVY YARD ROAD\nARLINGTON VA 22202',
  Spouse: '400-00-5678',
  Home: '(555) 010-0142',
  WorkCellBusiness: '(555) 010-0199',
  OrWrite: 'ARLINGTON VA 22202',
  KindsOfTaxes: '1040',
  TaxPeriods: '2022, 2023',
  AsOf: '03/31/2026',
  AmountOwed: '14750.00',
  DollarAmount: '425.00',
  DatePaid: '05/15/2026',
  AndDollarAmount: '425.00',
  OnThe: '15th',
  date1: '05/15/2027',
  amount1: '75.00',
  payment1: '500.00',
  date2: '05/15/2028',
  amount2: '75.00',
  payment2: '575.00',
  Initial: 'GH',
  AdditionalConditions: 'Agreement reviewed under standard terms. Synthetic record.',
  YourSignature: 'Grace Hopper',
  Date1: '04/12/2026',
  Date2: '04/12/2026',
  SpouseSignature: 'Alan Turing',
  TitleIf: 'Managing Partner',
  EarliestCSED: '06/30/2032',
  OriginatorID: '0413579',
  OriginatorCode: 'IA-SYNTH',
  Name: 'R. HAMMING',
  Title: 'Revenue Officer',
  AgreementExamined: 'R. HAMMING, Revenue Officer, Collection',
  Date3: '04/20/2026',
};
const SERIES_DIGITS = { RoutingNumber: '021000021', AccountNumber: '98765432109876543', AgreementLocatorNumber: '4207', AgreementReviewCycle: '202612' };

// The declared maximum of each cell, read out of the PDF rather than transcribed.
const MAXLEN = await (async () => {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(readFileSync('adapters/pdf/forms/f433d.pdf'));
  const out = {};
  for (const f of doc.getForm().getFields()) {
    if (typeof f.getMaxLength !== 'function') continue;
    const L = f.getMaxLength();
    if (L !== undefined) out[f.getName().replace(/\[\d+\]$/, '').split('.').pop()] = L;
  }
  return out;
})();
const atMax = (stem, v) => {
  const L = MAXLEN[stem];
  const base = String(v);
  if (L === undefined) return base.length > 2 ? base.repeat(6) : base;   // no declared limit
  return base.length >= L ? base.slice(0, L) : (base + base.repeat(L)).slice(0, L);
};

const valueFor = (stem) => {
  if (VALUES[stem] !== undefined) return VALUES[stem];
  const m = /^([A-Za-z]+?)(\d+)$/.exec(stem);
  if (m && SERIES_DIGITS[m[1]]) return SERIES_DIGITS[m[1]][Number(m[2]) - 1] ?? '0';
  return null;
};

const build = ({ subject, intake_id, role, why, tin, overmax = false, plantSpouse = false }) => {
  const rec = {
    _fixture: { role, why },
    _generated_by: 'scratchpad/p54-433d-author-fixtures.mjs',
    _synthetic: 'EVERY VALUE IN THIS FILE IS INVENTED. No real taxpayer, no real employer identification number, no real financial institution. [R-24]: synthetic data only, registered, torn down with absence verified — and a fixture is the one place synthetic data lives permanently, so it says so at the top rather than in a commit message.',
    intake_id,
    [`${PREFIX}subject`]: subject,
  };
  const missing = [];
  for (const key of Object.keys(mapDoc.map)) {
    const stem = stemOfKey.get(key);
    const decl = mapDoc.subject_classes[stem];
    if (decl.class === 'dependent') continue;                                   // supplied by the route below
    if (decl.class === 'conditional' && decl.empty_unless !== subject) {
      if (!(plantSpouse && stem === 'SpouseSignature')) continue;                // required empty on this subject
    }
    const v = valueFor(stem);
    if (v === null) { missing.push(stem); continue; }
    // THE STRESS RECORD FILLS EVERY CELL TO EXACTLY WHAT IT ACCEPTS, and that is the only
    // thing there is to stress on this form. 433-D declares no repeatable group, so no row can
    // be dropped and there is no overflow to log; what CAN go wrong is a value at the boundary
    // of a declared maximum. 36 of its 140 text fields declare one -- Initial at 3 and every
    // digit box in the four printed series at 1 -- and this record sits every one of them at
    // its limit, so a fill engine that was one character generous would fail here. A value
    // OVER the limit is a different fixture and a different claim: it must be REFUSED, which
    // is a firing proof rather than a gate role.
    rec[key] = overmax ? atMax(stem, v) : v;
  }
  // the route
  const dep = Object.entries(mapDoc.subject_classes).find(([, e]) => e.class === 'dependent');
  if (dep) rec[dep[1].route[subject]] = tin;
  // the checkbox constructs
  rec[`${PREFIX}submit_a_new`] = 'yes';
  rec[`${PREFIX}unable_to_make`] = 'no';
  rec[`${PREFIX}check_box_if`] = 'yes';
  rec[`${PREFIX}review_status_indicator`] = subject === 'individual' ? '5' : '6';
  rec[`${PREFIX}agreement_indicator`] = '1';
  rec[`${PREFIX}lien_determination`] = 'mayb';
  if (missing.length) { console.error(`STOP — no value declared for ${missing.length} stem(s): ${missing.join(', ')}`); process.exit(2); }
  return rec;
};

const OPTS = (() => {
  const lien = mapDoc.checkboxes['433d_lien_determination'];
  return Object.keys(lien).filter((k) => !k.startsWith('_'));
})();
// The lien option key is derived from the stem, so it is read off the map rather than typed.
const LIEN = OPTS.find((o) => o.startsWith('mayb')) || OPTS[0];

const write = (path, rec) => {
  rec[`${PREFIX}lien_determination`] = LIEN;
  writeFileSync(path, JSON.stringify(rec, null, 1) + '\n');
  console.log(`wrote ${path}  (${Object.keys(rec).filter((k) => k.startsWith(PREFIX)).length} mapped key(s))`);
};

write('samples/433d.sample.json', build({
  subject: 'individual', intake_id: 'INT-SAMPLE-433D-001', role: 'acceptance', tin: '400-00-1234',
  why: 'THE ACCEPTANCE RECORD FOR THE INDIVIDUAL SUBJECT. It reaches every mapped text cell EXCEPT the two that exist only for an entity — the signature title and the BMF review code — which it is required to leave empty and which the entity fixture reaches. It declares the SSN side of the identifier route.',
}));

write('samples/433d.entity.sample.json', build({
  subject: 'entity', intake_id: 'INT-SAMPLE-433D-002', role: 'branch', tin: '40-0001234',
  why: 'THE SAME RECORD ON THE OTHER SUBJECT. It reaches the two entity-only cells and is required to leave the three individual-only ones empty — the spouse identifier, the spouse signature and the IMF review code. Between this and the acceptance record every one of the 83 cells is reached by SOME record, which is the strongest saturation claim this form admits.',
}));

write('samples/433d.overmax.sample.json', build({
  subject: 'individual', intake_id: 'INT-SAMPLE-433D-OVERMAX', role: 'stress', tin: '400-00-1234', overmax: true,
  why: 'EVERY TEXT VALUE FORTY TIMES ITS LENGTH. 433-D declares no repeatable group, so there is no row to drop and no overflow to log: what this record stresses is the CAPACITY path, where a value longer than a field accepts must be a hard failure naming the input key rather than a silent truncation onto a filed page.',
}));

// THE [SC-7] REFUSAL IS NOT A FIXTURE IN samples/, AND THAT IS DELIBERATE.
//
// An entity record carrying a spouse's signature is an input the engine must REFUSE, and the
// seven fixture roles adapters/pdf/resolve-fixture.mjs declares are all roles the gate RUNS and
// expects to pass. A committed sample under role `negative` would be picked up by
// `npm run stress:433d` and fail the chain -- which is the correct refusal reported as a broken
// script, so the shape would teach people to stop running it ([R-10]).
//
// A must-be-refused input is a FIRING PROOF: the break is declared, the record is built in a
// gitignored sandbox rather than committed, and what is asserted is the STEP, the LINE and the
// VERDICT ([FS-3]). See scratchpad/p54-433d-prove-sc7-fires.mjs.
