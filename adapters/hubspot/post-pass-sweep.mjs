// EVERY QUESTION A PER-FORM PORTAL TOOL ASKS OF THE LIVE PORTAL, AND WHETHER ITS ANSWER
// SURVIVES THE PASS THE TOOL PRECEDES.
//
// CLI:  node adapters/hubspot/post-pass-sweep.mjs [--verbose] [--derive]
// Exit: 0 = every derived site is disposed, every disposition stands over live code, and every
//           pass-sensitive site names the code that states which side of the pass it is on
//       2 = a site is undisposed, a disposition is an orphan, a pass-sensitive site declares no
//           states, a swept file is unreadable, or the canary is dead
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DEFECT CLASS THAT EARNED IT — [D-18]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// THREE GUARDS IN ONE CYCLE ASKED A QUESTION WHOSE ANSWER CHANGED THE MOMENT THE PASS THEY
// GUARD SUCCEEDED, and each was written from a predecessor that had only ever run on one side
// of that moment:
//
//   1. hs-dryrun-433b.mjs asserted "the irs433b_ prefix is unused". True only before the first
//      create. It STOPped on every run after the pass, naming all 107 properties it had just
//      correctly made. A guard tuned to fire constantly gets turned off ([R-10]).
//   2. hs-describe-reused-433b.mjs and hs-readback-433b.mjs tested "does this description name
//      both forms" with /433-B\b/, WHICH MATCHES INSIDE "433-B(OIC)" — so every
//      predecessor-only description read as naming both, and the tool reported all nine already
//      done without sending a request. The failure direction was PASS.
//   3. The probe register's _count was overwritten with a bare integer where the register
//      declares a five-field derived block.
//
// [D-18] recorded the class and did not build anything, on [R-12] grounds: writing a new
// instrument in the commit that provisions 107 permanent properties is the adjacent change that
// has twice reproduced the defect class it was meant to close. What it carried was the QUESTION
// of whether the class deserved a sweep, to be decided on a DERIVED instance count before 433-D
// provisions.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE COUNT THAT DECIDED IT, AND THE FOURTH INSTANCE THAT SETTLED IT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The threshold was two or more LIVE instances. The register below derives the population from
// the tree on every run and the pass-sensitive count is printed, never typed. It is well over
// two — but the count is not what settled it. A FOURTH INSTANCE was found live and unrepaired
// while the count was being taken, and it is a worse shape than the three:
//
//   4. derive-names-433boi.mjs asked "did THIS pass create this live property?" as
//      `description.startsWith("433-B(OIC) (input key: K)")`. TRUE ON EVERY RUN FOR THE WHOLE
//      LIFE OF THAT FORM — until the 433-B pass, seven prompts later, re-described nine shared
//      properties to name both forms. The predicate went false on four of them and
//      `node adapters/hubspot/derive-names-433boi.mjs --portal` STOPped at [A7]. 433-B(OIC)
//      could not regenerate its own definitions file, and nothing in the 433-B cycle ran it, so
//      nothing said so.
//
// THE THREE RECORDED INSTANCES ARE ALL SELF-INFLICTED — a tool broken by the pass IT precedes,
// which somebody hits the next time they run it. THE FOURTH WAS BROKEN BY ANOTHER FORM'S PASS,
// and there is no moment at which anybody naturally re-runs a finished form's deriver. That is
// the shape a sweep catches and a comment does not.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHAT A DISPOSITION HAS TO SAY
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   construction     the site BUILDS the live view and asks nothing of it. No verdict rides on
//                    it directly. Its contents change across the pass and that is not a claim.
//   pass-invariant   the answer does not change when a provisioning pass succeeds, and WHY.
//   pass-sensitive   the answer DOES change, the tool knows it, and `states` names the line
//                    that PRINTS or BRANCHES ON which side it is on. That anchor is asserted to
//                    match live code in the same file, so a declaration cannot be a sentence.
//
// There is no fourth state. "It is fine" is not a disposition, and neither is silence: a site
// this file's shapes derive and the register does not name is a STOP.

import { readFileSync, readdirSync } from 'node:fs';
import { examined } from '../pdf/examined.mjs';

const DIR = 'adapters/hubspot';
const VERBOSE = process.argv.includes('--verbose');

// ---------------------------------------------------------------------------------------
// THE UNIVERSE. Directory, filter and classifier in three lines, then printed ([R-15]).
// ---------------------------------------------------------------------------------------
export const SWEPT_DIR = DIR;
// THE FILTER IS ON THE FORM TOKEN ANYWHERE IN THE NAME, NOT ON A TRAILING "-433<form>". The
// first draft required the suffix, so the three per-form decision tables — which are named
// `433b.divergence-decisions.mjs`, form FIRST — fell outside the population entirely, and the
// exclusion register below excused three files nothing had selected. An exclusion that excuses
// nothing is a sentence, not a boundary ([R-14]). A wider filter with every catch disposed by
// name is the granularity standard; a filter tuned until it happens to select exactly the
// interesting files is a list wearing a derivation's clothes.
export const SWEPT_FILTER = (name) => name.endsWith('.mjs') && /433[a-z]*/.test(name);
export const SWEPT_CLASSIFIER = (src) => src.includes('listAll(') || src.includes("hs('/") || src.includes('hs(`/');
export const SWEEP_DECLARATION =
  `${DIR}/ (non-recursive) — name ends ".mjs" AND carries a 433-form token anywhere in it; classified by the source reading the portal (listAll( or hs('/ or hs(\`/)`;

/** Files the filter selects that do NOT read the portal. An exclusion is a claim ([R-14]). */
export const NOT_A_PORTAL_TOOL = [
  { file: '433aoi.divergence-decisions.mjs', why: 'a table of per-property decisions, imported by the dry run. It reads no portal and reaches no verdict about live state.' },
  { file: '433b.divergence-decisions.mjs', why: 'the same, for 433-B.' },
  { file: '433boi.divergence-decisions.mjs', why: 'the same, for 433-B(OIC).' },
  { file: '433d.divergence-decisions.mjs', why: 'the same, for 433-D. It is empty, and its `_why_this_is_empty` states the two reasons — an unused create prefix and A9R taking a reuse type divergence down at derivation time — rather than leaving emptiness to read as nobody having looked.' },
];

export const sweptFiles = () => {
  const out = [];
  for (const name of readdirSync(SWEPT_DIR).filter(SWEPT_FILTER).sort()) {
    const path = `${SWEPT_DIR}/${name}`;
    let src = null, unreadable = null;
    try { src = readFileSync(path, 'utf8'); }
    catch (e) { unreadable = e.message; }
    out.push({ name, path, src, unreadable, portal: src === null ? false : SWEPT_CLASSIFIER(src) });
  }
  return out;
};

// ---------------------------------------------------------------------------------------
// THE SHAPES. A site is a line that READS LIVE PORTAL STATE. Deliberately wider than the true
// set of questions: every catch is disposed by name below, and a shape set tuned until it
// selected exactly the interesting lines would be a list wearing a derivation's clothes.
// ---------------------------------------------------------------------------------------
export const SHAPES = [
  ['portal-membership', /\b(?:live|portal)\s*\.\s*(?:has|get)\s*\(/],
  ['portal-prefix',     /\.name\s*\.\s*startsWith\s*\(/],
  ['portal-description', /description\s*\|\|\s*''\s*\)\s*\.\s*(?:includes|startsWith)/],
  ['portal-group',      /\bliveGroups\s*\.\s*has\s*\(/],
  ['portal-set',        /\b(?:custom|all|livePrefixed)\s*\.\s*(?:filter|some|map)\s*\(/],
];

const isProse = (line) => { const t = line.trim(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

/** An entry's `file` is one name, a list of them, or '*' for every swept tool. */
export const fileMatches = (declared, name) =>
  declared === '*' || (Array.isArray(declared) ? declared.includes(name) : declared === name);

export const sitesIn = (f) => {
  const out = [];
  f.src.split('\n').forEach((ln, i) => {
    if (isProse(ln)) return;
    for (const [shape, re] of SHAPES) {
      if (re.test(ln)) { out.push({ file: f.name, line: i + 1, shape, text: ln.trim() }); break; }
    }
  });
  return out;
};

// ---------------------------------------------------------------------------------------
// THE REGISTER. Ids are PP-nn and are asserted unique against every other register in this
// engine by adapters/pdf/register-ids.mjs.
//
// `file` is one file name, a list of them, or '*' for every swept tool. A FAMILY IS ALLOWED —
// many sites, one reason — and every member is still enumerated in the report, so a family
// cannot hide a member that needed its own reading. Entries are matched IN ORDER, so a
// file-specific entry placed above a '*' family takes it.
// ---------------------------------------------------------------------------------------
export const QUESTIONS = [
  // ─── constructions: they build the live view and ask nothing of it ──────────────────────
  { id: 'PP-01', file: '*', anchor: 'new Map(all.map((p) => [p.name, p]))', verdict: 'construction',
    why: 'BUILDS the live view from the read. No verdict rides on this line: what it contains changes across the pass and that is not a claim, it is the input every claim below is made against. The read itself is guarded one line up in every one of these tools, where a portal returning fewer than a few hundred properties is a STOP rather than an empty world.' },
  { id: 'PP-02', file: '*', anchor: 'all.filter((p) => !p.hubspotDefined)', verdict: 'construction',
    why: 'The same, narrowed to custom properties. `hubspotDefined` is a property of the definition and not of any pass this repo runs.' },

  // ─── the dry runs ──────────────────────────────────────────────────────────────────────
  { id: 'PP-03', file: ['hs-dryrun-433aoi.mjs', 'hs-dryrun-433b.mjs', 'hs-dryrun-433boi.mjs', 'hs-dryrun-433d.mjs'],
    anchor: 'const l = live.get(p.hs_name);', verdict: 'pass-sensitive',
    states: 'fresh.push(p); continue; }',
    why: 'THE CENTRAL QUESTION OF A DRY RUN — "does this definition already exist?" — and its answer flips from no to yes for every created property the moment the pass succeeds. That is not a defect; it is what a dry run is for. What makes it disposable is that the tool BRANCHES on it into named buckets and prints their sizes, so a post-pass run reports "exists and matches" for the same properties it previously reported as new, and a reader can tell the two runs apart from the report alone.' },
  { id: 'PP-04', file: ['hs-dryrun-433aoi.mjs', 'hs-dryrun-433b.mjs', 'hs-dryrun-433boi.mjs', 'hs-dryrun-433d.mjs'],
    anchor: 'const groupsToCreate = defs.groups.filter((g) => !liveGroups.has(g.name));', verdict: 'pass-sensitive',
    states: "liveGroups.has(g.name) ? 'exists' : '**would be created**'",
    why: 'A group is created by the first pass that needs it and exists for every pass after. The tool prints each group as "exists" or "would be created" by name, so which side of the pass this run is on is readable from the report rather than inferred from a count.' },
  { id: 'PP-05', file: ['hs-dryrun-433aoi.mjs', 'hs-dryrun-433b.mjs', 'hs-dryrun-433boi.mjs', 'hs-dryrun-433d.mjs'],
    anchor: "for (const g of defs.groups) say(", verdict: 'pass-sensitive',
    states: "liveGroups.has(g.name) ? 'exists' : '**would be created**'",
    why: 'The line that PRINTS [PP-04]\'s answer. It asks and states in one expression, which is the strongest form this disposition can take: there is no gap between the question and the record of which side it was asked on.' },
  { id: 'PP-06', file: ['hs-dryrun-433b.mjs', 'hs-dryrun-433boi.mjs'],
    anchor: 'if (live.has(twin)) twins.push(', verdict: 'pass-invariant',
    why: 'THE TWIN IS `irs433_<fact>`, THE SHARED BACKBONE, AND NO PASS IN THIS TOOL CREATES ONE. Every name this form would create carries this form\'s own prefix; the backbone was populated by earlier forms and is not touched. So the twin table reads the same before and after, which is what makes it usable as evidence about a name collision rather than as a report on the pass.' },
  { id: 'PP-07', file: ['hs-dryrun-433b.mjs', 'hs-dryrun-433d.mjs'],
    anchor: 'const undeclaredLive = livePrefixed.filter((p) => !declaredNames.has(p.name));', verdict: 'pass-invariant',
    why: 'THE FIRST INSTANCE [D-18] RECORDS, AFTER ITS REPAIR, AND IT IS PASS-INVARIANT ONLY BECAUSE OF THE REPAIR. The first draft asked "is the irs433b_ prefix used at all", which is true only before the first create; it STOPped on every run after the pass it precedes, naming all 107 properties it had just correctly made. Subtracting the declared names makes the question "is any name under our prefix one we did NOT declare", whose answer is zero on both sides of a correct pass and non-zero only when something outside this repo created properties for this form.' },
  { id: 'PP-08', file: ['hs-dryrun-433b.mjs', 'hs-dryrun-433d.mjs'],
    anchor: 'const livePrefixed = custom.filter((p) => p.name.startsWith(CREATE_PREFIX));', verdict: 'pass-sensitive',
    states: 'const provisioningState = declaredLive.length === 0',
    why: 'The count under this form\'s prefix goes from zero to the number created. It feeds a printed figure and [PP-07]\'s invariant question, and the tool names its own position with a three-valued `provisioningState` — BEFORE, AFTER, or PARTIAL — rather than leaving a reader to infer it from a number.' },
  { id: 'PP-09', file: ['hs-dryrun-433b.mjs', 'hs-dryrun-433d.mjs'],
    anchor: 'const declaredLive = declaredCreates.filter((p) => live.has(p.hs_name));', verdict: 'pass-sensitive',
    states: 'const provisioningState = declaredLive.length === 0',
    why: 'This IS the side-of-the-pass measurement: zero declared names live is BEFORE, all of them is AFTER, and anything between is the state an interrupted create loop leaves. It is the repair that made [PP-07] possible, and it is the model the rest of this register is written against — a pass-sensitive question is disposable when the tool computes which side it is on and says so.' },
  { id: 'PP-10', file: ['hs-dryrun-433b.mjs', 'hs-dryrun-433d.mjs'],
    anchor: '+ declaredCreates.filter((p) => !live.has(p.hs_name)).map(', verdict: 'pass-sensitive',
    states: 'PARTIAL PROVISIONING',
    why: 'Names the properties missing on a PARTIAL run. Before the pass that is every declared name and the branch is not taken; after a complete pass it is none. It is reached only in the partial state, which the line above computes and this one reports by name.' },
  { id: 'PP-11', file: 'hs-dryrun-433b.mjs',
    anchor: 'p.name.startsWith(REUSE_PREFIX) && p.name.startsWith(CREATE_PREFIX)', verdict: 'pass-invariant',
    why: 'A STRUCTURAL CLAIM ABOUT TWO STRINGS, not about the portal: irs433boi_ names all begin "irs433b" and only the underscore separates the two prefixes, so a prefix test written without it would count all 113 of 433-B(OIC)\'s properties as this form\'s. The assertion is false on every portal in every state and its answer cannot move when a pass runs.' },
  { id: 'PP-12', file: 'hs-dryrun-433b.mjs',
    anchor: 'prefix is live on **${livePrefixed.length}**', verdict: 'pass-sensitive',
    states: 'const provisioningState = declaredLive.length === 0',
    why: 'A printed figure that is zero before the pass and 107 after. It is stated beside the count of those NOT declared by this form, which is the invariant half, so the report never offers the moving figure alone.' },
  { id: 'PP-13', file: 'hs-dryrun-433b.mjs',
    anchor: 'live on the portal today:', verdict: 'pass-sensitive',
    states: 'const provisioningState = declaredLive.length === 0',
    why: 'The same figure on the console summary line. Same disposition, and it is registered separately rather than folded into [PP-12] because a console line and a report line can drift apart.' },
  { id: 'PP-14', file: 'hs-dryrun-433boi.mjs',
    anchor: "const livePrefixed = custom.filter((p) => p.name.startsWith('irs433boi_'));", verdict: 'pass-sensitive',
    states: 'prefix is live on **${livePrefixed.length}**',
    why: 'The same count on the predecessor form, reported as a figure rather than asserted. THIS IS THE FILE hs-dryrun-433b.mjs WAS WRITTEN FROM, and this form had only ever run before its own creates — which is exactly how the descendant came to assert what this one merely printed.' },

  // ─── the name derivers ─────────────────────────────────────────────────────────────────
  { id: 'PP-15', file: ['derive-names-433aoi.mjs', 'derive-names-433b.mjs', 'derive-names-433boi.mjs', 'derive-names-433d.mjs'],
    anchor: "const oursByDescription = (d) => (portal.get(d.hs_name)?.description || '').includes(", verdict: 'pass-sensitive',
    states: "return 'created by this pass';",
    why: 'THE FOURTH INSTANCE OF [D-18], AND THE ONE THAT SETTLED WHETHER THIS FILE GETS BUILT. It asks "did THIS pass create this live property?", and it asked it as `startsWith(\'<FORM> (input key: K)\')` — true for every property each form created, on every run, until the 433-B pass re-described nine shared properties to name BOTH forms. The predicate went false on four of them and derive-names-433boi.mjs STOPped at [A7]: that form could no longer regenerate its own definitions file, and nothing in the 433-B cycle ran it, so nothing said so. THE THREE INSTANCES ALREADY RECORDED WERE ALL BROKEN BY THE PASS THE TOOL ITSELF PRECEDES — somebody hits those the next time they run the tool. THIS ONE WAS BROKEN BY ANOTHER FORM\'S PASS, and nobody re-runs a finished form\'s deriver. `includes` of the same token is the repair, and the token stays disjoint in both directions because "(OIC)" sits between the form name and the paren — unlike /433-B\\b/, which matches inside "433-B(OIC)" and is the second instance.' },
  { id: 'PP-16', file: ['derive-names-433aoi.mjs', 'derive-names-433boi.mjs'],
    anchor: 'if (portal.has(d.hs_name) && !d.backbone_key && !oursByDescription(d)) {', verdict: 'pass-sensitive',
    states: "return 'created by this pass';",
    why: '[A7]: a derived name that is already live. Before the pass, none of this form\'s new names is live and the branch is never taken; after it, every one is, and only the description test keeps the tool from STOPping on its own work. That is the whole load-bearing weight [PP-15] carries.' },
  { id: 'PP-17', file: ['derive-names-433b.mjs', 'derive-names-433d.mjs'],
    anchor: 'if (!portal.has(d.hs_name)) continue;', verdict: 'pass-sensitive',
    states: "return 'created by this pass';",
    why: '[A7] on the one form that reaches it through a hit table instead of a bare condition. Before the pass this skips every row; after it, none. The rows it lets through are classified benign or not and reported either way, so a post-pass run prints 116 benign hits rather than stopping.' },
  { id: 'PP-18', file: ['derive-names-433b.mjs', 'derive-names-433d.mjs'],
    anchor: 'const live = portal.get(d.hs_name);', verdict: 'pass-sensitive',
    states: "return 'created by this pass';",
    why: 'Reads the live definition for the hit table [PP-17] fills. Absent before the pass, present after, and the table row states which of the three reasons applies.' },
  { id: 'PP-19', file: ['derive-names-433aoi.mjs', 'derive-names-433b.mjs', 'derive-names-433boi.mjs', 'derive-names-433d.mjs'],
    anchor: 'const l = portal.get(d.hs_name);', verdict: 'pass-sensitive',
    states: "if (!l) return '**would be created**';",
    why: '`statusOf`, which exists to answer exactly this question per row and prints one of four strings for it: portal not read, would be created, created by this pass, or already live and contributed by another form. A tool that names four states cannot be said not to know which one it is in.' },
  { id: 'PP-20', file: ['derive-names-433aoi.mjs', 'derive-names-433b.mjs', 'derive-names-433boi.mjs', 'derive-names-433d.mjs'],
    anchor: ") return 'created by this pass';", verdict: 'pass-sensitive',
    states: "return 'created by this pass';",
    why: 'The line that PRINTS [PP-19]\'s answer, and the second half of the [PP-15] repair. It asks and states in one expression.' },
  { id: 'PP-21', file: 'derive-names-433aoi.mjs',
    anchor: "if (d.scope === 'form-specific' && portal.has('irs433_' + d.fact)) {", verdict: 'pass-invariant',
    why: '[A8]: a form-specific name whose FACT already exists under the shared backbone prefix. This form creates nothing under `irs433_`, so the backbone side of the comparison does not move when this pass runs, and the form-specific side is a classification rather than a portal state.' },
  { id: 'PP-22', file: ['derive-names-433aoi.mjs', 'derive-names-433boi.mjs'],
    anchor: 'const live = derived.filter((d) => portal.has(d.hs_name));', verdict: 'pass-sensitive',
    states: "if (!l) return '**would be created**';",
    why: 'The set of derived names already live, for the report. Empty before the pass, complete after, and every member is printed through `statusOf`, which names which of the two it is.' },
  { id: 'PP-23', file: ['derive-names-433aoi.mjs', 'derive-names-433b.mjs', 'derive-names-433boi.mjs'],
    anchor: '!portal.has(d.hs_name));', verdict: 'pass-sensitive',
    states: 'HEADROOM',
    why: 'THE HEADROOM ARITHMETIC — how many properties this pass would add. It is the number this project sizes a pass against, and it correctly goes to zero once the pass has run. The tool prints it as "this pass would add N", which reads truthfully in both states; a run reporting zero to add after a complete pass is the pass being done, not the arithmetic failing.' },

  // ─── the two questions only 433-D asks ─────────────────────────────────────────────────
  //
  // This is the first form in the series to REUSE FROM TWO CREATORS AT ONCE, so it is the
  // first whose deriver has to ask whether the property it is binding is actually there.
  { id: 'PP-31', file: 'derive-names-433d.mjs',
    anchor: 'if (!portal.has(d.hs_name))            // A9R: the reuse target must be LIVE', verdict: 'pass-invariant',
    why: 'A9R: A REUSE MUST BIND SOMETHING THAT EXISTS, and the three properties it binds were created by 433-A and 433-B(OIC) long before this pass. They are live before it and live after it, so this line reads the same in both states. What it refuses is the state where a row classified `exact` names a property NOBODY created: that would not be a reuse, it would be a creation under the prefix of another form, recording 433-A or 433-B(OIC) as the author of a name that 433-D invented, permanently and with no guard downstream able to tell. The condition is about the pass of the CREATOR, which has already happened, and not about this one.' },
  { id: 'PP-32', file: 'derive-names-433d.mjs',
    anchor: "wouldCreate = derived.filter((d) => d.scope !== 'reuse' && !portal.has(d.hs_name)).length;", verdict: 'pass-sensitive',
    states: 'A12',
    why: 'A12: HOW MANY PROPERTIES THIS PASS WOULD CREATE, read BEFORE the first create and compared against the live headroom. It is 75 before the pass and 0 after, and both are the truth about the moment they are read — which is the whole reason [R-32] requires the figure to be taken before the loop rather than inferred from it. The tool prints it as "this form would create N", which reads truthfully in both states, and the STOP it guards is the one that stops a partial provisioning run against a hard ceiling.' },


  // ─── the three sites only 433-D has, because it is the first form with TWO reuse prefixes ─
  //
  // 433-B could hold its predecessor's prefix in a constant and test the pair by hand. 433-D
  // reuses from two creators, so the prefixes are DERIVED from the rows and the disjointness is
  // a loop over a derived set rather than one hand-written comparison.
  { id: 'PP-33', file: 'hs-dryrun-433d.mjs',
    anchor: 'const prefixCounts = allPrefixes.map((pre) => ({ pre, n: custom.filter((p) => p.name.startsWith(pre)).length }));', verdict: 'pass-sensitive',
    states: 'const provisioningState = declaredLive.length === 0',
    why: 'THE PER-PREFIX LIVE COUNT, one row per prefix this form creates under or reuses from. The irs433d_ row goes from 0 to 75 when the pass succeeds and the irs433_ and irs433boi_ rows do not move, because no pass in this tool creates a name under another form\'s prefix. The moving figure is never printed alone: the table sits directly above the three-valued provisioningState line, which names BEFORE, AFTER or PARTIAL outright. [PP-08] is the same disposition on the predecessor, where there was one prefix to count instead of three.' },
  { id: 'PP-34', file: 'hs-dryrun-433d.mjs',
    anchor: 'const both = custom.filter((p) => p.name.startsWith(a) && p.name.startsWith(b));', verdict: 'pass-invariant',
    why: 'A STRUCTURAL CLAIM ABOUT STRINGS, asked of every ordered pair of this form\'s prefixes rather than of one hand-written pair. Every prefix in this series begins "irs433" and only the character at index 6 separates them, so a test written without the separator would count all 884 custom properties as this form\'s. The claim is false on every portal in every state and cannot move when a pass runs — which is exactly [PP-11] on the predecessor, generalised from one comparison to a loop over a derived set because this form has three prefixes and not two.' },
  { id: 'PP-35', file: 'hs-dryrun-433d.mjs',
    anchor: 'if (twin !== p.hs_name && live.has(twin)) twins.push({ p, twin, l: live.get(twin) });', verdict: 'pass-invariant',
    why: 'THE TWIN IS irs433_<fact>, THE SHARED BACKBONE, AND NO PASS IN THIS TOOL CREATES ONE — [PP-06]\'s ground, with one addition this form needs. Two of 433-D\'s reuses bind irs433_ names themselves, so without the `twin !== p.hs_name` guard a row would be reported as colliding with the very property it binds. The guard is structural and its answer does not move across a pass. What the table then surfaces is the finding [D-28] records: W-02 binds irs433boi_employer_identification_number while irs433_employer_identification_number is also live, and the twin check is the only instrument in the tree that could have said so, because A8\'s universe is form-specific rows.' },
  // ─── the reuse describer ───────────────────────────────────────────────────────────────
  { id: 'PP-24', file: ['hs-describe-reused-433b.mjs', 'hs-describe-reused-433d.mjs'],
    anchor: 'const l = live.get(p.hs_name);', verdict: 'pass-invariant',
    why: 'EVERY PROPERTY THIS TOOL TOUCHES WAS CREATED BY THE PREDECESSOR FORM, so it is live before this form\'s pass and live after it. A reuse target that is missing is a STOP in both states and for the same reason — a reuse must bind something that exists. What IS pass-sensitive in this file is the description CONTENT, and that is the second instance [D-18] records: the both-forms test was /433-B\\b/, which matches inside "433-B(OIC)", so every predecessor-only description read as already naming both forms and the tool reported all nine done without sending a request. It is guarded now by a dead-test canary that runs before the loop.' },

  // ─── the readbacks ─────────────────────────────────────────────────────────────────────
  { id: 'PP-25', file: ['hs-readback-433aoi.mjs', 'hs-readback-433b.mjs', 'hs-readback-433boi.mjs', 'hs-readback-433d.mjs'],
    anchor: 'const l = live.get(p.hs_name);', verdict: 'pass-sensitive',
    states: '${missing.length} missing',
    why: 'A READBACK IS A POST-PASS TOOL AND ITS QUESTION IS PASS-SENSITIVE BY DESIGN: before the pass every definition is missing and the tool STOPs, which is the correct answer to "did the pass create these" asked before it ran. What makes it disposable rather than a defect is that the STOP names the missing count, so the pre-pass state is reported as itself and never as a portal problem.' },
  { id: 'PP-26', file: ['hs-readback-433aoi.mjs', 'hs-readback-433b.mjs', 'hs-readback-433boi.mjs', 'hs-readback-433d.mjs'],
    anchor: "const createdHere = ok.concat(wrong, decided).filter(({ l }) => (l.description || '').startsWith(", verdict: 'pass-sensitive',
    states: '${missing.length} missing',
    why: 'Counts the properties whose live description names this form as their creator — zero before the pass, the created count after. `startsWith` IS THE RIGHT READING HERE and `includes` would be wrong, which is why this is not the [PP-15] repair applied twice: a reused property\'s description names two forms and BEGINS with the creator, so "created here" is exactly what the leading token says. Read against the portal today it separates 107 created from 9 reused on 433-B, which is the distinction the table exists to draw.' },
  { id: 'PP-27', file: ['hs-readback-433aoi.mjs', 'hs-readback-433boi.mjs'],
    anchor: 'for (const { p, l } of ok) say(', verdict: 'pass-sensitive',
    states: '${missing.length} missing',
    why: 'Prints [PP-26]\'s per-row answer into the report table as yes or a dash. Asks and states in one expression.' },
  { id: 'PP-28', file: 'hs-readback-433b.mjs',
    anchor: "? 'created here' : '-';", verdict: 'pass-sensitive',
    states: '${missing.length} missing',
    why: 'The same per-row answer on the one form that has reuses, where the third column can read "reused" instead. Same disposition as [PP-26] and [PP-27], on the form where the distinction between created-here and reused actually has two populations.' },

  // ─── 433-D adds a read-back with a route in it, and a describer that APPENDS ───────────
  { id: 'PP-36', file: 'hs-readback-433d.mjs',
    anchor: 'const discLive = discRow && live.get(discRow.hs_name);', verdict: 'pass-sensitive',
    states: '${missing.length} missing',
    why: 'THE SUBJECT DISCRIMINATOR, WHICH NO PREDECESSOR HAS. It is a property this form CREATES, so it is absent before the pass and present after — the same side-of-the-pass question every other row in this file asks, reported through the same `missing` count in the STOP line. What the row then asserts is pass-invariant: the option set the portal holds must equal the branch names the map declares, because the engine reads this value BARE and a third option would be a value it cannot route stored under a name saying it can.' },
  { id: 'PP-37', file: 'hs-readback-433d.mjs',
    anchor: 'const l = row && live.get(row.hs_name);', verdict: 'pass-sensitive',
    states: '${missing.length} missing',
    why: 'The two BRANCH properties of the route, read back one per side. One of the two is created by this pass and the other two are reuses created by 433-A and 433-B(OIC) — so this line is pass-sensitive for one row and invariant for the others, and it is registered pass-sensitive because the weaker claim is the honest one for a line that reads both. The route section names each row\'s scope and creating form beside it, so which side of the pass a row is on is readable from the report.' },
  { id: 'PP-38', file: 'hs-readback-433d.mjs',
    anchor: "? 'created here' : '-';", verdict: 'pass-sensitive',
    states: '${missing.length} missing',
    why: '[PP-28]\'s disposition on the second form with two populations in that column. Here the third value names the CREATING FORM rather than a fixed predecessor, because this form\'s three reuses come from two different creators and "reused" alone would not say which.' },
  { id: 'PP-39', file: 'hs-describe-reused-433d.mjs',
    anchor: "const okKept = !row.existing || String(back.description || '').includes(row.existing);", verdict: 'pass-invariant',
    why: 'THE APPEND ASSERTION, AND IT IS THE ONE THING THIS TOOL DOES THAT ITS PREDECESSOR DID NOT. 433-B\'s describer REPLACED a live description with the definition file\'s; it could, because all nine of its targets used the same enumerating convention. Two of 433-D\'s three are backbone properties whose descriptions say "Shared across the 433 series - named for the fact, not the form", and overwriting that to enumerate forms would erase a landed convention to satisfy a later one ([R-21]). So this line reads the portal back and requires the PRIOR text to still be there. It is invariant across the pass because it is a claim about this tool\'s own write and not about which properties exist: a replacement would satisfy the equality test above it and fail this one, in either state.' },
  { id: 'PP-40', file: 'hs-describe-reused-433d.mjs',
    anchor: 'if (back.groupName !== (live.get(p.hs_name) || {}).groupName) console.log(', verdict: 'pass-invariant',
    why: 'THE THINGS A DESCRIPTION PATCH MUST NOT HAVE CHANGED, checked on the same read-back. A property\'s group is set by the form that CREATED it and [R-06] forbids demanding this form\'s group of a rebind, so the test is against what was live BEFORE this tool ran rather than against what this form would have chosen. That comparison has the same answer on both sides of any provisioning pass: this tool sends `description` and nothing else, so the group it finds must be the group it started with.' },
];

// ---------------------------------------------------------------------------------------
// THE RUN.
// ---------------------------------------------------------------------------------------
export const runSweep = () => {
  const problems = [], rows = [];
  const files = sweptFiles();
  for (const f of files) if (f.unreadable) problems.push(`UNREADABLE — ${f.path}: ${f.unreadable}. A swept file this tool cannot read is a STOP, never a skip.`);

  const excused = new Map(NOT_A_PORTAL_TOOL.map((x) => [x.file, x.why]));
  const tools = files.filter((f) => f.portal);
  for (const f of files) {
    if (f.portal) continue;
    if (f.unreadable) continue;
    if (!excused.has(f.name)) problems.push(`UNDECLARED NON-TOOL — ${f.path} carries a form suffix and does not read the portal, and the exclusion register does not say why.`);
  }
  for (const x of NOT_A_PORTAL_TOOL) {
    const f = files.find((y) => y.name === x.file);
    if (!f) problems.push(`the exclusion register names ${DIR}/${x.file}, which is not in this tree.`);
    else if (f.portal) problems.push(`${DIR}/${x.file} is excused as reading no portal and it reads one. An exclusion that excuses nothing is a sentence, not a boundary ([R-14]).`);
  }

  const hit = new Map(QUESTIONS.map((q) => [q.id, 0]));
  const allSites = tools.flatMap(sitesIn);
  for (const s of allSites) {
    const q = QUESTIONS.find((x) => fileMatches(x.file, s.file) && s.text.includes(x.anchor));
    if (!q) {
      problems.push(`UNDISPOSED  ${DIR}/${s.file}:${s.line}  [${s.shape}]\n      ${s.text.slice(0, 160)}\n      matches no entry in QUESTIONS. Say whether this question's answer survives the pass this tool precedes.\n      There is no fourth state.`);
      rows.push({ at: `${s.file}:${s.line}`, id: '(none)', verdict: 'UNDISPOSED', shape: s.shape });
      continue;
    }
    hit.set(q.id, hit.get(q.id) + 1);
    rows.push({ at: `${s.file}:${s.line}`, id: q.id, verdict: q.verdict, shape: s.shape, why: q.why });
  }
  for (const q of QUESTIONS) {
    if (!hit.get(q.id))
      problems.push(`ORPHAN      [${q.id}]  anchor ${JSON.stringify(q.anchor)}\n      matches no line in ${DIR}/${q.file}. The question it disposes of has been edited or removed, so its verdict now certifies nothing.`);
  }

  // A pass-sensitive question must name the code that says WHICH SIDE, and that anchor must
  // stand over a real line in the same file. This is the condition the whole file exists for:
  // it is what "the tool knows it is post-pass" means operationally.
  for (const q of QUESTIONS) {
    if (q.verdict !== 'pass-sensitive') continue;
    if (typeof q.states !== 'string' || !q.states.trim()) {
      problems.push(`UNSTATED    [${q.id}]  ${DIR}/${q.file}\n      is pass-sensitive and names no \`states\` anchor. A site whose answer changes across the pass and whose tool never says which side it is on is the whole of [D-18].`);
      continue;
    }
    // EVERY FILE THE ENTRY COVERS, NOT THE FIRST. A family entry naming three tools must state
    // which side of the pass it is on in ALL THREE; checking one and reporting for the family
    // is how a family hides the member that needed its own reading.
    const covered = tools.filter((x) => fileMatches(q.file, x.name));
    if (!covered.length) continue;   // ORPHAN above already reports an entry standing over nothing
    for (const f of covered) {
      const found = f.src.split('\n').some((ln) => !isProse(ln) && ln.includes(q.states));
      if (!found)
        problems.push(`UNSTATED    [${q.id}]  ${f.path}\n      declares it states which side of the pass it is on at ${JSON.stringify(q.states)}, and no live line in that file contains it.\n      A declaration that stands over no code is a sentence.`);
    }
  }

  return { rows, problems, siteCount: allSites.length, toolCount: tools.length, fileCount: files.length };
};

// ---------------------------------------------------------------------------------------
// THE CANARY. Every detector carries one ([R-17]), and a new instrument is the least
// trustworthy object in the repo.
//
// It runs the SAME functions the live path uses — `sitesIn` and the disposition matcher —
// against a synthetic file held in memory, and plants one violation of each verdict this file
// can reach. The direction a presence-only canary would miss is planted too: a CONFORMING
// synthetic file must produce no problem at all, because a sweep that refuses everything
// satisfies every "was it caught" test and proves nothing.
// ---------------------------------------------------------------------------------------
const CANARY_SRC = [
  "const live = new Map(all.map((p) => [p.name, p]));",
  "const l = live.get(p.hs_name);",
  "if (!l) { canaryFresh.push(p); continue; }",
  "// const l = live.get(p.hs_name);   <- prose, must NOT be a site",
].join('\n');

const CANARY_FILE = () => ({ name: 'hs-canary-433zz.mjs', path: `${DIR}/hs-canary-433zz.mjs`, src: CANARY_SRC, unreadable: null, portal: true });

const CANARY_QUESTIONS = () => [
  { id: 'CN-1', file: 'hs-canary-433zz.mjs', anchor: 'new Map(all.map((p) => [p.name, p]))', verdict: 'construction', why: 'builds the view' },
  { id: 'CN-2', file: 'hs-canary-433zz.mjs', anchor: 'const l = live.get(p.hs_name);', verdict: 'pass-sensitive', states: 'canaryFresh.push(p); continue; }', why: 'flips across the pass and the tool branches on it' },
];

/** The matcher and the states check, lifted out so the canary drives the live code path. */
const judgeAgainst = (file, questions) => {
  const problems = [];
  const sites = sitesIn(file);
  for (const s of sites) {
    const q = questions.find((x) => fileMatches(x.file, s.file) && s.text.includes(x.anchor));
    if (!q) problems.push(`UNDISPOSED ${s.file}:${s.line} ${s.text}`);
  }
  const hit = new Map(questions.map((q) => [q.id, 0]));
  for (const s of sites) {
    const q = questions.find((x) => fileMatches(x.file, s.file) && s.text.includes(x.anchor));
    if (q) hit.set(q.id, hit.get(q.id) + 1);
  }
  for (const q of questions) if (!hit.get(q.id)) problems.push(`ORPHAN [${q.id}] ${JSON.stringify(q.anchor)}`);
  for (const q of questions) {
    if (q.verdict !== 'pass-sensitive') continue;
    if (typeof q.states !== 'string' || !q.states.trim()) { problems.push(`UNSTATED [${q.id}] no states anchor`); continue; }
    const found = file.src.split('\n').some((ln) => !isProse(ln) && ln.includes(q.states));
    if (!found) problems.push(`UNSTATED [${q.id}] states anchor stands over no code`);
  }
  return { problems, sites };
};

export const runCanary = () => {
  const dead = [];
  const base = judgeAgainst(CANARY_FILE(), CANARY_QUESTIONS());
  if (base.problems.length) dead.push(`the CONFORMING synthetic file was refused: ${base.problems.join(' | ')}. A sweep that refuses everything proves nothing.`);
  // THE PROSE LINE MUST NOT BE A SITE, AND THE PROOF IS THE PAIR RATHER THAN THE NUMBER.
  // Asserting "2 sites" alone would also pass on a sweep whose shapes had gone dead in a way
  // that happened to remove two; so the SAME source is judged twice, once with the fourth line
  // commented and once with the comment marker gone, and the difference must be exactly one.
  const LIVE_SITES = 2;
  if (base.sites.length !== LIVE_SITES)
    dead.push(`the synthetic file has ${LIVE_SITES} live site(s) and ${base.sites.length} were derived — a shape is dead, or the prose line is being counted.`);
  const uncommented = { ...CANARY_FILE(), src: CANARY_SRC.replace('// const l = live.get', 'const l2 = live.get') };
  const n = sitesIn(uncommented).length;
  if (n !== LIVE_SITES + 1)
    dead.push(`uncommenting the prose line changed the derived site count from ${base.sites.length} to ${n}; it must add exactly one. The prose filter is not what is excluding it.`);

  const planted = [
    { want: 'UNDISPOSED', make: () => ({ file: CANARY_FILE(), questions: CANARY_QUESTIONS().filter((q) => q.id !== 'CN-2') }) },
    { want: 'ORPHAN', make: () => ({ file: CANARY_FILE(), questions: [...CANARY_QUESTIONS(), { id: 'CN-3', file: 'hs-canary-433zz.mjs', anchor: 'a line that is not in the file', verdict: 'pass-invariant', why: 'nothing' }] }) },
    { want: 'UNSTATED', make: () => ({ file: CANARY_FILE(), questions: CANARY_QUESTIONS().map((q) => (q.id === 'CN-2' ? { ...q, states: undefined } : q)) }) },
    { want: 'UNSTATED', make: () => ({ file: CANARY_FILE(), questions: CANARY_QUESTIONS().map((q) => (q.id === 'CN-2' ? { ...q, states: 'a statement this file never makes' } : q)) }) },
  ];
  for (const p of planted) {
    const { file, questions } = p.make();
    const out = judgeAgainst(file, questions);
    if (!out.problems.some((x) => x.startsWith(p.want)))
      dead.push(`a planted ${p.want} case was NOT caught. Got: ${out.problems.length ? out.problems.join(' | ') : '(no problems at all)'}`);
  }
  return { live: !dead.length, planted: planted.length + 1, dead };
};

export const report = (s) => {
  const tally = s.rows.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});
  const fmt = Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(', ') || 'none';
  console.log(`post-pass sweep: ${SWEEP_DECLARATION}`);
  console.log(`  ${s.fileCount} form-token file(s); ${s.toolCount} read the portal, ${NOT_A_PORTAL_TOOL.length} declared not a portal tool`);
  for (const x of NOT_A_PORTAL_TOOL) console.log(`    not a portal tool: ${DIR}/${x.file} — ${x.why}`);
  console.log(`  shapes: ${SHAPES.map(([n]) => n).join(', ')}`);
  console.log(`  ${s.siteCount} live-portal-state site(s) — ${fmt}`);
  examined('post-pass-sweep', 'engine', s.siteCount, 'live-portal-state-sites');
  const sensitive = s.rows.filter((r) => r.verdict === 'pass-sensitive').length;
  // NOT "PASS-SENSITIVE INSTANCES, DERIVED: n". success-sweep.mjs [RX-SS-07] reads a line
  // opening with PASS\b as a verdict opener, and "PASS-SENSITIVE" opens with exactly that —
  // so an unconditional line stating a count read as the run's answer. It states the same
  // number, opening with a word that is not a verdict.
  console.log(`  instances whose answer changes when the pass succeeds, DERIVED from the tree: ${sensitive} of ${s.siteCount}. [D-18]'s threshold for building this sweep was two or more.`);
  if (VERBOSE) for (const r of s.rows) console.log(`    ${String(r.id).padEnd(6)} ${String(r.verdict).padEnd(15)} ${r.at}`);
  if (!s.problems.length) {
    console.log('OK — every live-portal-state site is disposed, every disposition stands over live code, and every pass-sensitive site names the line that says which side of the pass it is on.');
    return 0;
  }
  console.error(`POST-PASS SWEEP — ${s.problems.length} problem(s):`);
  for (const p of s.problems) console.error(`  ${p}`);
  return s.problems.length;
};

if (import.meta.main) {
  const canary = runCanary();
  console.log(`canary: ${canary.live ? 'holds' : 'DEAD'} (${canary.planted} planted case(s) — one conforming, and one violation of each verdict this sweep can reach)`);
  if (!canary.live) {
    for (const d of canary.dead) console.error(`STOP — canary: ${d}`);
    console.error('STOP — the sweep cannot be trusted, so nothing below is reported.');
    process.exit(2);
  }
  if (process.argv.includes('--derive')) {
    const files = sweptFiles().filter((f) => f.portal);
    for (const f of files) for (const s of sitesIn(f)) console.log(`${s.file}:${s.line}\t${s.shape}\t${s.text}`);
    process.exit(0);
  }
  process.exit(report(runSweep()) ? 2 : 0);
}
