// [D-18], A FOURTH LIVE INSTANCE — AND THE FIRST ONE A *LATER FORM'S* PASS BROKE.
//
//   node scratchpad/d18-repair-description-tests.mjs
//
// WHAT BROKE, AND WHEN
// --------------------
// adapters/hubspot/derive-names-433boi.mjs asks, of every derived name already live on the
// portal, "did THIS pass create it?" — and it asked that with
//
//     (description || '').startsWith(`433-B(OIC) (input key: ${d.key})`)
//
// which was true of every property 433-B(OIC) created, on every run, until the 433-B pass ran.
// adapters/hubspot/hs-describe-reused-433b.mjs then REWROTE nine of those descriptions to name
// both forms — "Serves BOTH Form 433-B (input key: A) and Form 433-B(OIC) (input key: B)..." —
// and the predicate went false for four of them (the other five carry a `backbone_key`, which
// short-circuits A7 before the test is reached).
//
// So `node adapters/hubspot/derive-names-433boi.mjs --portal` STOPS today, on four rows, and
// 433-B(OIC) cannot regenerate its own definitions file. Nothing in the 433-B cycle ran it, so
// nothing noticed. THE THREE INSTANCES [D-18] ALREADY RECORDS ARE ALL SELF-INFLICTED — a tool
// broken by the pass IT precedes. This one is a tool broken by ANOTHER FORM'S pass, which is
// the direction that has no natural moment at which anybody re-runs the thing.
//
// THE REPAIR, WHICH IS THE SAME SHAPE hs-dryrun-433b.mjs's WAS
// -----------------------------------------------------------
// The question is "does this live description name THIS FORM AND THIS KEY", and the code asked
// "does it BEGIN with this form and this key". Those two have the same answer for exactly as
// long as no description ever names two forms, and the whole point of a reuse is that one does.
// `startsWith` becomes `includes` of the same token.
//
// THE TOKEN IS STILL UNAMBIGUOUS IN BOTH DIRECTIONS, and that is asserted below rather than
// asserted in prose: "433-B (input key: K)" is not a substring of "433-B(OIC) (input key: K)" —
// the "(OIC)" sits between the name and the paren — so the 433-B test cannot match a
// 433-B(OIC)-only description and the 433-B(OIC) test cannot match a 433-B-only one. That is
// precisely the trap [D-18]'s second instance fell into with /433-B\b/, which DOES match inside
// "433-B(OIC)".
//
// PATCHED BY LINE INDEX, on unique full-line anchors, and every replacement is asserted found.

import { readFileSync, writeFileSync } from 'node:fs';

// --- the token test, proved unambiguous before anything is written -------------------------
const tok = (form, key) => `${form} (input key: ${key})`;
const BOTH = 'Serves BOTH Form 433-B (input key: s3_15_federal_government_contractor) and Form 433-B(OIC) (input key: s1_federal_contractor). Created by the 433-B(OIC) pass.';
const ONLY_BOI = '433-B(OIC) (input key: s1_federal_contractor). Created by the 433-B(OIC) pass.';
const ONLY_B = '433-B (input key: s3_15_federal_government_contractor). Created by the 433-B pass.';
const probes = [
  { what: 'the both-forms description names 433-B(OIC) with its own key', got: BOTH.includes(tok('433-B(OIC)', 's1_federal_contractor')), want: true },
  { what: 'the both-forms description names 433-B with its own key', got: BOTH.includes(tok('433-B', 's3_15_federal_government_contractor')), want: true },
  { what: 'a 433-B(OIC)-only description does NOT satisfy the 433-B token', got: ONLY_BOI.includes(tok('433-B', 's1_federal_contractor')), want: false },
  { what: 'a 433-B-only description does NOT satisfy the 433-B(OIC) token', got: ONLY_B.includes(tok('433-B(OIC)', 's3_15_federal_government_contractor')), want: false },
  { what: 'the OLD startsWith test FAILS on the both-forms description — the defect itself', got: BOTH.startsWith(tok('433-B(OIC)', 's1_federal_contractor')), want: false },
];
let dead = 0;
for (const p of probes) {
  const ok = p.got === p.want;
  if (!ok) dead++;
  console.log(`  ${ok ? 'holds ' : 'DEAD  '} ${p.what} — got ${p.got}, want ${p.want}`);
}
if (dead) { console.error(`STOP — ${dead} probe(s) failed. The replacement predicate is not sound, so nothing is patched.`); process.exit(2); }
console.log(`token test proved on ${probes.length} probe(s), both directions.`);
console.log('');

// --- the patches ---------------------------------------------------------------------------
const PATCHES = [
  {
    path: 'adapters/hubspot/derive-names-433boi.mjs',
    from: "  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').startsWith(`433-B(OIC) (input key: ${d.key})`);",
    to: [
      '  // NAMES THIS FORM AND THIS KEY — not BEGINS WITH them. [D-18], fourth instance: the 433-B',
      '  // pass rewrote nine reused descriptions to "Serves BOTH Form 433-B (input key: A) and Form',
      '  // 433-B(OIC) (input key: B)...", and this predicate — true on every run for the whole life',
      '  // of this form until then — went false on four of them, STOPping the deriver at [A7].',
      '  // The "(OIC)" between the form name and the paren is what keeps the two tokens disjoint,',
      "  // where /433-B\\b/ was not: that regex matches INSIDE \"433-B(OIC)\" and is the second",
      '  // instance [D-18] records.',
      "  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').includes(`433-B(OIC) (input key: ${d.key})`);",
    ],
  },
  {
    path: 'adapters/hubspot/derive-names-433boi.mjs',
    from: "  if ((l.description || '').startsWith('433-B(OIC) (input key: ' + d.key + ')')) return 'created by this pass';",
    to: [
      "  // The same reading as A7's, for the same reason: a description naming two forms still",
      '  // names this one. Reported "already live - contributed by another form" before this fix.',
      "  if ((l.description || '').includes('433-B(OIC) (input key: ' + d.key + ')')) return 'created by this pass';",
    ],
  },
  {
    path: 'adapters/hubspot/derive-names-433b.mjs',
    from: "  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').startsWith(`433-B (input key: ${d.key})`);",
    to: [
      '  // NAMES THIS FORM AND THIS KEY — not BEGINS WITH them. This form is not broken today,',
      '  // because A7 returns on every `scope === "reuse"` row before reaching this predicate and',
      '  // the reuses are the only rows whose descriptions name two forms. It is the SAME LATENT',
      '  // DEFECT as the one [D-18]\'s fourth instance made live on 433-B(OIC), and it goes live the',
      '  // first time any later form re-describes an irs433b_ property this form created. Repaired',
      '  // in the same place and the same commit, because a class repaired on one form and left on',
      '  // its neighbour is the reproduction [R-12] says to expect.',
      "  const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').includes(`433-B (input key: ${d.key})`);",
    ],
  },
  {
    path: 'adapters/hubspot/derive-names-433b.mjs',
    from: "  if ((l.description || '').startsWith(`433-B (input key: ${d.key})`)) return 'created by this pass';",
    to: [
      "  // The same reading as A7's, for the same reason.",
      "  if ((l.description || '').includes(`433-B (input key: ${d.key})`)) return 'created by this pass';",
    ],
  },
];

for (const p of PATCHES) {
  const lines = readFileSync(p.path, 'utf8').split('\n');
  const at = [];
  lines.forEach((l, i) => { if (l === p.from) at.push(i); });
  if (at.length !== 1) { console.error(`STOP — ${p.path}: the anchor line matched ${at.length} time(s), not once. A patch that cannot say which line it replaces replaces nothing.\n  ${p.from}`); process.exit(2); }
  const i = at[0];
  writeFileSync(p.path, [...lines.slice(0, i), ...p.to, ...lines.slice(i + 1)].join('\n'));
  console.log(`patched ${p.path}:${i + 1} — 1 line -> ${p.to.length}`);
}
