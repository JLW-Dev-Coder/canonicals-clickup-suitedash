// Commit 2's carried-register movements. One-shot, recorded in the commit that produced it.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/_carried.cross-form.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));

// ── [D-11] RESOLVED ─────────────────────────────────────────────────────────────────────
const i = doc.open.findIndex((x) => x.id === 'D-11');
if (i < 0) throw new Error('D-11 is not open');
const d11 = doc.open.splice(i, 1)[0];
doc.resolved.push({
  ...d11,
  status: 'RESOLVED — Prompt 44 commit 2.',
  _resolution: {
    ruling: 'THE CANDIDATE RULING, TAKEN. `fired` for a constant, a factor and a sign now means THE BRANCH THAT CARRIES IT WAS TAKEN AND THE DECLARATION WAS APPLIED — not "the declaration moved the sum".',
    why_reaching_the_line_is_the_proof: 'The three pushes sit after the feeder\'s `when` predicate has held (or declared none), after every target has resolved through the map, and after every cell has been read off the filled PDF and parsed as money. Any of those failing breaks out before the push. So `fired: true` is true BECAUSE of what the code above it did, rather than being written true.',
    all_three_kinds: 'constant, factor and sign were all `<the sum moved>`. All three are corrected in one edit, because the conflation is one conflation and fixing the constant alone would have left the same sentence meaning two things in the same table.',
    nothing_was_lost:
      'The old predicate said something real: a .8 applied only to zero cells has never been proved to be .8 rather than .7 — the shape of the 0.7 quick-sale cell in the name-lie registry. That fact is KEPT under the name it actually has. Each entry now carries `observable` beside `fired`, the gate reports the applied-but-unobservable set with its identities, and declaration-coverage.mjs unions those identities across a form\'s fixtures exactly as it unions coverage.',
    and_what_the_fix_would_have_lost_if_it_had_stopped_there:
      'With `fired` = applied, a factor, constant or sign can no longer appear in the coverage residue at all — and a residue a kind cannot enter is a residue that has stopped watching it. Two lists were added in the same commit to take that over: APPLIED-BUT-NOT-OBSERVABLE, and DECLARED-BUT-NEVER-IN-CLASS — a declaration the totals file declares that no fixture in the set ever reached. The second is derived from the totals file, which is the DECLARING artefact, because the runs cannot report a declaration none of them saw.',
    what_moved: 'Reported in full in the run: five zero constants across two forms left the "in class somewhere and proved nowhere" list, which is what made that list uncloseable, and reappeared in the observability list where they CAN be closed by a fixture that parks a non-zero figure on the leased branch.',
    the_defect_this_fix_committed_and_the_sweep_that_caught_it:
      'The DECLARED-BUT-NEVER-IN-CLASS check builds a declaration identity from the totals file and compares it against the identities the gate builds. Its first draft formatted the constant with `toFixed(2)` where the gate uses a grouping formatter — agreeing on 0.00 and disagreeing on every figure above a thousand — and reported three real 433-A(OIC) constants (-1,000.00, -3,450.00, -11,980.00) as reached by no fixture when all three are reached on every run. A re-implementation of an identity is a second answer to the question the identity exists to make one answer to, committed by the tool reporting on that class. The formatter now lives once, in adapters/pdf/comparisons.mjs, and both sides import it.',
  },
});

// ── [D-13] RECORDED, OPEN ───────────────────────────────────────────────────────────────
doc.open.push({
  id: 'D-13',
  form: '433-F, and any form that later moves to the derived path',
  raised_in: 'Prompt 44 commit 2, by the construct-vocabulary assertion on its first run',
  subject: 'adapters/hubspot/fields.433f.json writes a FILE PATH where every other definitions file writes a MAP CONSTRUCT, and nothing reads it',
  the_shape: 'Two of its 56 rows — `433f_age_band` and `433f_address_differs` — carry `source: "fill-433f.mjs"`. Every other definitions file writes one of `map`, `split`, `allowed`, `engine`, `groups`, `checkboxes`, `check_here`: the name of the map construct the property came from. A file path is not a construct; it is the name of the thing that READS the input.',
  why_it_is_inert_today: 'bindings.mjs `bindingSourceOf("433f")` is "crosswalk", so 433-F\'s `kind` comes from its crosswalk row\'s own `row_shape` and `map_option_by_value` and this file\'s `source` is read by nothing. No value is mis-shaped and no cell prints empty.',
  why_it_is_recorded_anyway:
    'It is the writer-resolver divergence the ruling is about, sitting in the tree and harmless only by accident of which path the form takes. The day 433-F moves to the derived path — which is the direction every form after 433-A has taken — those two rows resolve to no construct and `kindOf` returns null, which is now a STOP. Better a STOP than the silent scalar it would have been before this commit; better still to fix the writer.',
  what_it_is_NOT: 'NOT a defect in the 433-F round trip and NOT a wrong property. Both properties are correct, provisioned and live; only the provenance field disagrees with the vocabulary.',
  the_remedy: 'Decide what those two rows should say. `engine` is the honest construct — an input the engine reads that the map names no cell for — and it is exactly what ENGINE_EXTRA_INPUTS["433f"] already declares both keys as. Rewriting them means re-running gen-fields-from-crosswalk.mjs, which is 433-F\'s generator and outside this prompt\'s scope line.',
  reported_where: 'adapters/hubspot/assert-intake-keys.mjs prints it on every run under DIVERGENCE, inert and reported every run.',
  status: 'OPEN - recorded, not built.',
});

doc._count = { open: doc.open.length, resolved: doc.resolved.length };
writeFileSync(P, JSON.stringify(doc, null, 1) + '\n');
console.log(`${P}: open ${doc.open.map((x) => x.id).join(',')} | resolved ${doc.resolved.map((x) => x.id).join(',')}`);

// ── [B24] RESOLVED on the 433-B(OIC) map ────────────────────────────────────────────────
const M = 'adapters/pdf/maps/433boi.map.json';
const map = JSON.parse(readFileSync(M, 'utf8'));
const j = map._carried.open.findIndex((x) => x.id === 'B24');
if (j < 0) throw new Error('B24 is not open on the 433-B(OIC) map');
const b24 = map._carried.open.splice(j, 1)[0];
map._carried.resolved.push({
  ...b24,
  status: 'RESOLVED — Prompt 44 commit 2.',
  _resolution: {
    the_property: 'irs433aoi_business_income_expense_route — enumeration/select, group irs433aoic, options grid | profit_and_loss_statement.',
    derived_not_typed: 'The name appears in no authoring script. ENGINE_EXTRA_INPUTS["433aoi"] puts the key in the form\'s key space, classification entry X-83 names it, crosswalk.433aoi.json binds it, and derive-names-433aoi.mjs derives prefix + fact. The option VALUES are read out of the map\'s own record_shape declaration rather than retyped, and A13 asserts the property offers exactly the states the engine accepts.',
    the_category:
      'X-83 is `new`, not `same-question-different-subject`. That category belongs to 433-B(OIC), whose classification is relative to the backbone and whose subject is the business entity; the subject register landed in commit 1 records 433-A and 433-A(OIC) as COINCIDING, so subject is not what separates them here. What separates them is the printed instruction: 433-A page 8 y 451.0 prints only a RECONCILIATION note, "(lines 68 through 88 should reconcile with business Profit and Loss Statement)", while 433-A(OIC) page 5 y 421.3 and y 411.7 print an ALTERNATIVE — "If you provide a current profit and loss (P&L) statement ... Do not complete lines (12) - (16) and (18) - (28)." Only the second is a route a record must declare. `new` derives the form-scoped prefix, which is the same name this item predicted from the other direction.',
    the_assertions: 'Six, before any create: the name matches prefix+fact; the portal does not hold it (checked against 1,181 contact properties); its near neighbours are listed rather than assumed absent; it echoes no stem of the 22 active entries in the 433-A(OIC) lie registry; its option set equals the map\'s declared states; and the headroom is read from the portal on the run rather than from the report.',
    the_dry_run: '239 definitions — 236 exist and match, 2 exist and DIFFER with recorded decisions, 1 new. Headroom 776 before, 777 after, 223 left against the documented 1,000-custom ceiling.',
    the_create_and_the_read_back: 'Created through node fetch by hs-provision.mjs, which skips the 238 already present. Read back from the portal on a separate request: name, type, fieldType, groupName, label, options and description all match the derived definition exactly; hubspotDefined false, archived false.',
    what_it_unblocks: 'A 433-A(OIC) record fetched from HubSpot can now carry the route, so gate step 11 no longer STOPs on a record that came through the portal. The form was not finished before this.',
  },
});
map._carried._count = { open: map._carried.open.length, resolved: map._carried.resolved.length };
writeFileSync(M, JSON.stringify(map, null, 1) + '\n');
console.log(`${M}: _carried open ${map._carried.open.length}, resolved ${map._carried.resolved.length}`);
