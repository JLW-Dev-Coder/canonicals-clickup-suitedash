# The standing rules of this engine

## What this file is, and why it had to become one

Until this commit the standing rules existed **only in prompt documents**. Prompts are
transient: they are read once, acted on, and not kept in the tree. So a prompt could cite
"prompt 43's ruling 3" and point at a file that does not exist here, and the only honest
answer to such a citation is a refusal — which is what happened, and which is the defect that
earned this file.

A refusal is the right answer and it should be **cheap**. Looking for a rule that was never
written down is a search of the whole tree that ends in "not found". Looking for a rule in this
file is one lookup.

## How a rule is cited

**By its name, never by a prompt number.** Every rule below carries an `[R-nn]` id and a short
name. A rule cited by a name that is not in this file is a **STOP**, reported as such, and
nothing is guessed from the wording.

```
node adapters/pdf/assert-rules.mjs                      # assert this file against the tree
node adapters/pdf/assert-rules.mjs --cite "<name>"      # look one rule up; exit 2 if absent
node adapters/pdf/assert-rules.mjs --canary             # prove the reader can read
```

## This file is an artefact, so it is swept

It is not a run report and it is registered as such at `[SB-19]` in
`adapters/pdf/sweep-boundary.mjs`, separately from `[SB-14]`, which excuses the markdown under
`adapters/` on the ground that each document describes one run against a live external system.
That ground is false of this file, and widening `[SB-14]` until it covered a file its reason is
false of is the sentence-softening the boundary register exists to refuse.

What holds it instead:

- **No count in this file is typed.** The number of rules, the number attributed to a defect
  and the number unattributed are all derived by `adapters/pdf/assert-rules.mjs` from this
  file's own headings on every run, and printed there. If a figure appears in prose below, the
  asserter derives it and compares.
- **Every rule carries an attribution or a declared absence.** A rule with neither is a STOP.
  A rule may declare `Attribution: none —` with a reason; that is a checked absence and it is
  reported by name on every run, never silently absorbed.
- **Every path this file names must exist.** An unproved forward reference is a STOP, which is
  itself `[R-17]`.
- **Every id is registered**, in `adapters/pdf/register-ids.mjs`, in the `engine` namespace,
  so an `R-` id cannot be reused by another register.

## The dating

"Roughly when" is given as the commit that landed the remedy, with its date, wherever the tree
records one, and **every such hash is resolved against this repository's history on every run**
— a rule attributed to a commit that is not here would be an attribution to nothing. Where the
rule predates the mechanism that would record it, the date is the cycle it was ruled in and the
line says `Cycle-dated`. A date this tree cannot settle is written as an approximation and says
so, rather than being made precise by guessing.

---

# I. Rules about prompts and rulings

## [R-01] Prompts establish, they do not assert

> Prompts state what to establish, not what is true. A ruling that presumes a state is a
> defect — refuse it.

**The defect that earned it.** A ruling instructed that 433-B's subject be read from its
*printed eligibility text*, on the model of 433-B(OIC), which prints an eligibility paragraph
that expels the sole proprietorship by name. **433-B prints no eligibility text at all.**
`"sole propri"` returns zero across all six drawn pages. The instruction could not be carried
out as written, and the two available responses were to invent a source or to refuse. The
refusal was correct, and the subject was then read from four printed sources that do exist —
the title, the 2b entity list, the Section 2 heading and the signature block — with those four
named.

The general shape is older than that instance: a prompt that says "the map already binds X" or
"the fixture is at path P" is asserting a state of the tree from outside the tree.
`adapters/pdf/resolve-fixture.mjs` was written for exactly the path case, and its header records
a prompt that named a slice-1 fixture for 433-B(OIC) — the file name is quoted there in full and
is deliberately NOT repeated here as a path, because it does not exist and never has, and this
file's own asserter would refuse it as an unproved forward reference. Which is the rule
working on the sentence describing it.

**Roughly when.** The fixture-path half landed with `adapters/pdf/resolve-fixture.mjs` on
2026-08-20 (`08ddecb`); the general form was ruled after the 433-B intake, 2026-08-22
(`461cfbd`).

---

## [R-02] A correction is a claim

> A correction is a claim and carries the same evidence standard as what it corrects.

**The defect that earned it.** `[D-06]` in `adapters/pdf/maps/_carried.cross-form.json` was
itself a correction — it found `row_flag` carrying two incompatible definitions — and it
divided the five flagged columns "three load-bearing, two inert". That split was **measured on
map reachability and stated as though it had been measured on the printed page.** Read off the
page, all five are drawn as checkboxes somewhere: 433-F prints "Check if / Business Account"
over both accounts tables and draws four widgets for it. The three "load-bearing" columns were
never unprinted; they were **unmapped**. The item's own `what_this_item_got_WRONG` records it.

The second instance is in `[D-11]`'s resolution, under
`the_defect_this_fix_committed_and_the_sweep_that_caught_it`: the fix for the constant-coverage
predicate introduced a DECLARED-BUT-NEVER-IN-CLASS check whose first draft formatted a constant
with `toFixed(2)` where the gate uses a grouping formatter, and reported three real 433-A(OIC)
constants as reached by no fixture when all three are reached on every run.

**Roughly when.** `[D-06]`'s correction landed 2026-08-22 (`8e530cb`, "[D-06]'s 'and simply not
bound' superseded, its counter retargeted"); `[D-11]`'s at prompt 44 commit 2.

---

## [R-03] A scope line that excludes what a guard requires is a prompt defect

> A scope line that excludes something a standing guard requires is a prompt defect.

**The defect that earned it.** A prompt's §4 required that "all five forms pass their gates"
while its scope line excluded the artefacts that makes possible: 433-B had a map shell and no
`fill-433b.mjs`, no fixtures and an empty crosswalk, and `run-form-gate.mjs` cannot reach step
7 without a fill engine. The work was done and **flagged as outside the stated scope rather
than buried**, which is the correct response to the collision; the rule is what stops the next
prompt from creating it.

**Roughly when.** Cycle-dated 2026-08-22, the cycle that landed 433-B slice 1 (`8ff600e`). The
tree records the remedy, not the ruling.

---

## [R-04] Zero examined is not a pass

> A guard that examines nothing on a form has not been tested on that form; report the examined
> count, never a bare pass.

**The defect that earned it.** `adapters/hubspot/assert-intake-keys.mjs` reported PASS on a run
that included 433-B, and **its 433-B contribution was zero** — the crosswalk was empty, so
there were no option values and no row shapes to resolve, and the guard's verdict for that form
was produced by an empty set. "Passed" and "had nothing to look at" are different facts wearing
one word, and the difference is the whole of the vacuous-guard class this engine has been
removing since `guard-sweep.mjs` was written.

It is the `atLeast` contract of `adapters/pdf/count-sweep.mjs` applied per form: an extraction
returning fewer than `atLeast` values is a STOP there, and a guard examining zero items on a
form is the same object one level out.

**Roughly when.** Cycle-dated 2026-08-22 — observed during the 433-B slice-1 pre-flight. The
enumeration and the per-guard counts land in this commit, in `adapters/pdf/assert-examined.mjs`.

---

# II. Rules about evidence

## [R-05] Map reachability never settles a claim about the page

> "The map does not reach it" and "the page does not print it" are different facts. Map
> reachability never settles an absence claim about the printed page.

**The defect that earned it.** `[D-06]`, as above: five canonical columns reported as three
printed and two not, on evidence that could not have contradicted the conclusion. The same
shape was live in `s1_federal_contractor`. `adapters/pdf/absence-sweep.mjs` exists for this
class and its header states it: *"A claim of the first kind supported by evidence of the second
kind is FALSE-SHAPED even when it happens to be true, because nothing that was consulted could
have contradicted it."*

**Roughly when.** 2026-08-22, `5b3e0c6` — "absence claims verified against the drawn page,
never against map reachability".

---

## [R-06] The naming test is about the subject, and a prefix is history

> The naming test is about the subject, not the question. **A form-specific prefix is history,
> not a semantic boundary.**

**The defect that earned it.** Two halves, two defects.

*The subject half.* The sequencing decision for 433-B(OIC) was made on **leaf-name overlap**,
which measures authoring cost, when the question being decided — can this fact take an existing
property name — runs on **subject**. Two forms can ask an identical printed question about
different legal persons, and one shared property would then have to hold two values for one
filer at one moment. 433-B(OIC) came out 113 of 113 form-specific with `exact` used zero times,
not because its questions were new (62 are a predecessor's word for word) but because its
subject was. `adapters/pdf/gen-subject-register.mjs` is that axis written down.

*The prefix half, and it is the register's first empirical result.* 433-B shares **eleven** leaf
names with 433-A and **none** with 433-B(OIC). The leaf-name axis therefore says 433-B is a
fresh form; the subject register says 433-B **coincides** with 433-B(OIC) — the form it shares
no leaf name with — and is mutually exclusive with 433-A. **The two axes point opposite ways on
this form**, which is the separation demonstrated rather than argued. It follows that
`irs433boi_` records *which form created a name*, not *which form owns it*, and where 433-B and
433-B(OIC) share a fact about the same subject, 433-B binds the existing property, prefix and
all. Precedent is the monthly-rent rebind (`e6e2d48`).

**Roughly when.** Subject half 2026-08-22, `410dce1`. Prefix half ruled 2026-08-22 on the
433-B lineage result; the derivation is told to read it in this commit, and no key is
classified or provisioned on it yet.

---

## [R-07] A figure without its universe is not a figure

> A figure without its universe is not a figure. No count is typed — derived, or declared
> underivable with a reason.

**The defect that earned it.** `adapters/pdf/validate-map.mjs` built a check for a retyped count
drifting from its own list, wrote the reason into the code in plain English — *"this is exactly
how 'eleven' survived three slices when the honest figure was ten"* — **and then left three more
retyped counts in the same file, one key over, unguarded.** One of them, `_partition`, was
already self-contradicting when the guard shipped beside it.

**Roughly when.** 2026-08-19, `e4e353e` — "derive every self-describing count; declarations
mandatory". `adapters/pdf/count-sweep.mjs` holds the mechanism and the meta-rule.

---

## [R-08] Bindings come from the printed page; a leaf name is evidence of nothing

> Bindings from the printed page. An inherited leaf name is evidence of nothing; a lineage
> verdict is per occurrence, never per name.

**The defect that earned it.** On 433-A the leaf names are **swapped against the printed
columns**. On 433-B page 1, `p1_42_7aAnnualSalDrw` carries indices `[0]` to `[3]`, so the "7a"
in the name is false on three of its four occurrences, and binding by leaf stem without the
index writes every personnel salary into row 7a. Four rows of the same printed column carry
four unrelated spellings — `p1_42_7aowner`, `p1_52_7bowner`, `OwnrshpPrcntg7c`,
`p1_001_7downer`. And the page-3 subform named `Line19c` holds the row the page marks **19b**
(`[B-03]`).

The *per occurrence* half is `[D-06]` again: one column is a routing discriminator on 433-A and
a drawn checkbox on 433-F, which is why one key was impossible.

**Roughly when.** Cycle-dated from 2026-08-18 across the 433-A(OIC) slices; the per-occurrence
form landed with the `row_flag` split, 2026-08-22 (`410dce1`).

---

## [R-09] No tolerance, and money only by declaration

> No tolerance in any comparison. Never round a cell the map has not declared as money.

**The defect that earned it.** 433-A(OIC) prints a rounding instruction more than once, in more
than one wording, over less than the whole form. Rounding at output but not at comparison makes
every multi-operand total fail on a correctly filled form, by up to half a dollar per operand;
rounding at comparison but not at output makes the engine verify a figure the page never
printed. The tempting fix — a tolerance — would have hidden both.

The money-by-declaration half has its own case: 433-A(OIC) prints `2c_number_of_units` and
`8c_number_of_units`, the quantity of a digital asset held, and **a holding of 1.2345 units
rounded to 1 is a false statement about the taxpayer's property on a document signed under
penalty of perjury.** A blanket numeric rule corrupts it silently and every total on the page
still reconciles, because the units cell feeds no total.

**Roughly when.** 2026-08-18, `a6a8dc6` — "per-block declared rounding, money by declaration,
round-then-floor".

---

# III. Rules about guards

## [R-10] A guard tuned to fire constantly gets turned off

> A guard tuned to fire constantly gets turned off, and a guard that gets turned off is worse
> than none.

**The defect that earned it.** `[D-11]`: a declared printed constant of **zero** could never be
reported as exercised, because the coverage test was `constant !== 0`, and every printed
constant in this repo is the same one — "if the vehicle is leased, enter 0 as the total value".
Five instances across two forms sat permanently on the "in class somewhere and proved nowhere"
list beside floors that genuinely had never been driven. The item's own words: *"A reader
closing gaps works down that list and cannot close these, and a list with permanently
uncloseable rows on it stops being a list anyone works down."*

**Roughly when.** Raised 2026-08-20 by the 433-B(OIC) declaration-coverage union; resolved
2026-08-22, `1d806cd` — "coverage counts an applied declaration not a changed value".

---

## [R-11] A success message is guarded by the condition it reports on

> A success message is guarded by the condition it reports on.

**The defect that earned it.** `adapters/hubspot/derive-names-433aoi.mjs` ended with
`process.exitCode = 3` inside a failure branch and then, unconditionally, `console.log('all
assertions passed.')` — printed **directly underneath its own "STOP - 1 assertion failure(s)"**.
The exit code was right and the last sentence a reader saw was a lie on every failing run, from
the commit that wrote it. `process.exitCode = ` is an assignment, not a jump, and that
one-character difference from `process.exit(2)` is the entire defect. It was found by grepping
for the phrase for an unrelated reason — *"which is to say it was found by luck, and luck is not
a check"*.

**Roughly when.** 2026-08-20, `6b44dbd`. `adapters/pdf/success-sweep.mjs` holds it.

---

## [R-12] A refactor of a guard is a change to the guard

> A refactor of a guard is a change to the guard; a renumber needs its own check. Expect the fix
> to reproduce the defect class it fixes, and say where you looked.

**The defect that earned it.** The renumber half is `[D-07]`: a new `count-sweep` MANIFEST entry
was written as `[S-25]`, an id already in use by the crosswalk classification. Nothing
complained, the two entries co-existed, and the blanket audit then reported an empty demand for
`[S-25]` on the **wrong form** — the symptom appeared two tools away from the cause and named
neither. Until `register-ids.mjs` existed the engine carried twelve within-register duplicates
and thirty-nine cross-register ones while every sweep reported clean.

The reproduce-the-class half is measured, not feared. `adapters/pdf/count-sweep.mjs`'s own
header records the sweep reporting OK over its own blind spot for one run, *"which is the defect
this file names in its header, committed by this file"*. `[D-11]`'s fix committed the identity
defect quoted at `[R-02]`. And in this commit the patch script written to repair the overflow
reader **reached disk with its backslashes eaten on the first attempt** — the exact class
`control-char-scan.mjs` exists for — and was caught by asserting the patch's own output rather
than by trusting it.

**Roughly when.** `[D-07]` resolved 2026-08-20, `49e9d1a`.

---

## [R-13] An unproved forward reference is a STOP

> An unproved forward reference is a STOP. A blanket asserting coverage names what counts the
> covered set.

**The defect that earned it.** The classification's completeness blanket — "every bound key on
the form is covered by an entry" — was **true of 207 keys and false of 31**, one of which
(`X-17`) would have created a permanent duplicate HubSpot property in a portal with a hard
ceiling. It survived because the sweep watching it **counted entries** and no tool had ever
counted **keys**: the blanket asserted coverage of one set and the only instrument pointed at it
measured a different set.

**Roughly when.** 2026-08-19, `6e55004` — "audit the six blanket dispositions - sampling,
forward-reference proof, completeness counters".

---

## [R-14] Exclusions are claims, including the sweeps' own boundaries

> Exclusions are claims, including the sweeps' own boundaries. An observation nothing enumerates
> is not a finding.

**The defect that earned it.** Two, one inside the other.

*The exclusion.* `adapters/hubspot/asset-row-shapes.json` said of three 433-F tables "printed,
not currently mapped", `assert-row-shape-spec.mjs` excused exactly that phrase from its routing
assertion, and `433f.map.json` **had bound all three since the day they were authored**. The
instrument was intact and its input had been quietly narrowed by a sentence.

*The boundary.* `exclusion-sweep.mjs` registered every predicate that excuses a call site and
never registered the exclusion deciding which **files** the checks look at. Two wrong typed
counts sat in `samples/`, outside `count-sweep`'s swept set — not excused, not declared, not
counted, just not looked at.

*The observation.* `[D-09]` carried the sentence *"Zero sites in this tree are known to be in
this state. That is an observation and not a proof: nothing enumerates it"* — which is the same
shape a third time, and `adapters/pdf/enumerate-shadowing.mjs` now derives that zero on every
run instead of asserting it once.

**Roughly when.** `6b44dbd` (2026-08-20) for the exclusion register, `08ddecb` (2026-08-20) for
the boundary register, `e2bdee6` (2026-08-20) for the shadowing enumeration.

---

## [R-15] A glob is a STOP unless it declares what it sweeps

> A glob is a STOP unless it declares what it sweeps. Enumerated is the granularity standard.

**The defect that earned it.** The subdirectory case, `[SB-90]`: **every** sweep in this engine
reads its directories with a non-recursive `readdirSync`, so every subdirectory of every swept
directory was outside every sweep. Nobody wrote that exclusion — it is a property of the
reading, and it is the exact shape `samples/` had. It is now derived from the tree on every run,
so a directory that appears is a STOP rather than a gap.

`adapters/pdf/resolve-fixture.mjs` is the same rule applied to its own glob, and declares
directory, filter and classifier in three lines it then prints.

**Roughly when.** 2026-08-20, `08ddecb` and `d88d17e`.

---

## [R-16] A writer-resolver key spelling is asserted at the boundary, on every form

> A writer-resolver key spelling is asserted at the boundary, on every form, including where the
> feature is inert.

**The defect that earned it.** The cell spelling `group[row].column` is what `rounding.mjs`, the
totals predicate, the name-lie registry's `bound_to`, `exclusive` and the gate all address by.
A form declaring **no** rounding block would round nothing even if every key were miskeyed, so
the natural instinct is to skip the check until the slice that first declares one — and that is
precisely the slice where the miskeying would already be in place and silent. So the assertion
runs on the inert form too, and `fill-433b.mjs` carries it with page 1 declaring no rounding at
all: *"a form with none proves the no-op rather than skipping the check"*.

**Roughly when.** 2026-08-22, `8e530cb` — "four-form no-op proof".

---

## [R-17] A regex source with a backslash asserts itself at load

> A regex source containing a backslash self-asserts at load. Every detector carries a canary. A
> new instrument is the least trustworthy object in the repo.

**The defect that earned it.** The authoring path eats backslashes, and that is measured rather
than supposed.

- **First published instance.** `validate-map.mjs`'s digit scan reached disk as
  `/\bp[1-8]s+(d+)/` — backslashes gone. It matched nothing, `nums.length` was 0, and
  `nums.length && mismatch` turned a guard that could not read its input into a guard that
  printed PASS. Dead from the commit that introduced it.
- **Second.** `[D-12]`: `assert-y-convention.mjs`'s `REPORTER_SIG` held **four literal U+0008
  bytes** where `\b` was meant, so a file that reports a baseline without touching a widget
  rectangle was invisible to the completeness check for three prompts while it reported clean.
  Its canary covered the comparator and not the population selector — a canary for the half that
  was already working.
- **Third, and it is why the scan is standing.** After the first instance a scan was run **once**
  and found nothing further. A one-off scan proves the tree was clean at one instant; the next
  commit is where the second instance arrived.
- **This commit.** The patch script for `[R-25]`'s overflow reader was first written as a shell
  heredoc and reached disk with `\n` become a real newline and `\b` and `\[` eaten. It was
  reverted, rewritten as a file, and the rewrite asserts its own bytes on disk before it exits.

**Roughly when.** `control-char-scan.mjs` made standing 2026-08-22, `5b3e0c6`;
`regex-self-assert.mjs` (which catches the shape with no control byte at all — `\s` becoming
`s`, a different and perfectly legal regex) landed 2026-08-22, `056baa4`.

---

## [R-18] One y convention, and four attendant scoping rules

> One declared y convention; predicates key on their defining module; a counter declares the
> scope of its universe; coverage counts an applied declaration, not a changed value.

**The defect that earned it.** `[B11]`. `433boi.lineage-433aoi.json` quotes printed runs at
`y=97.5` and `y=80.2`; the runs it describes are set at 89.5 and 71.2. **Neither number was
wrong.** The lineage file was authored off `align-block.mjs`, which printed the *top* of a run's
box under a bare `y=`, while the map and the totals file were authored off the *baseline*. The
gap is the run's own height — 8.0pt — and eight points is a row on these forms. One binding got
the wrong caption out of it.

The three companions each have their own instance: `[D-08]` (a predicate universe built from
**names**, so a local `const` in any swept file made every same-named call anywhere in the engine
an excusal), `[D-11]` (coverage counting a *changed value* rather than an *applied declaration*
— see `[R-10]`), and the counter-universe rule from the same commit.

**Roughly when.** 2026-08-20, `08ddecb`.

---

# IV. Rules about artefacts

## [R-19] A generated artefact declares its generator

> A generated artefact declares its generator, and the claim is asserted by regeneration.
> Downgrading a landed artefact is an explicit act.

**The defect that earned it.** Three field-file generators share one output shape and no
vocabulary. `gen-fields-from-map.mjs` takes a form argument and will happily write
`fields.433f.json` from `433f.map.json` — **which is what happened**: 433-F's definition file
was rewritten by the wrong tool, silently, in the map's vocabulary instead of the crosswalk's,
**with a group dropped**. Nothing failed. It was caught by a person reading a 1,260-line diff,
which is not a check. The output of these files is 91 to 238 permanent HubSpot property
definitions.

The downgrade half fired **twice on the same tool with the same missing flag**: a
`derive-names-*` run without `--portal` is not a run that found the portal unreadable, it is a
run that did not look, and it silently replaced 238 rows of live verdicts (433-A(OIC)) and later
113 (433-B(OIC)) with rows saying `portal not read`. The first occurrence was repaired by
re-running with the flag, which fixes the file and leaves the mechanism exactly as it was — so
the second was not a relapse, it was the same defect still standing.

**Roughly when.** Generator declaration 2026-08-20, `6b44dbd`; no-downgrade 2026-08-22,
`056baa4`.

---

## [R-20] An arguable item is reported in full and is not resolved

> An arguable item is reported in full, carries a `_carried` id, and is not resolved.

**The defect that earned it.** The register's own `_the_rule` records what it replaced: items
that were noticed, reasoned about in a report, and then evaporated because nothing held them.
`[D-11]`'s `why_it_is_not_fixed_here` is the rule doing its work in the other direction —
*"rewriting the coverage predicate for three declaration kinds across four forms
mid-provisioning is exactly the kind of adjacent change that has twice now reproduced the defect
class it was meant to close. Recorded with its instances counted so it cannot evaporate."*

**Roughly when.** In force since the 433-A(OIC) slices, 2026-08-18 (`b4ef042`, "declare
433-A(OIC) leaf-name lies and carried items").

---

## [R-21] A superseded finding is kept verbatim

> A superseded finding is kept verbatim with what it got right and wrong. Landed evidence is not
> rewritten to match a later convention.

**The defect that earned it.** `[D-06]` had to be corrected after it had been acted on, and the
correction was substantial — the split it rested on was measured on the wrong axis. Rewriting
the entry would have erased the *reason the split happened*, which is the part that was right
and is why one key was impossible. So the entry carries `what_this_item_got_right` beside
`what_this_item_got_WRONG`, both in the same object. The same treatment is in the fixture
register: a `superseded` fixture is kept and **must name what superseded it**, and a
`superseded_by` naming a file not in the tree is a STOP.

**Roughly when.** 2026-08-22, `8e530cb`. The fixture half predates it, landing with
`adapters/pdf/resolve-fixture.mjs` on 2026-08-20 (`08ddecb`).

---

## [R-22] Pre-flight discovers; it is never told a path

> Pre-flight discovers; it is never told a path.

**The defect that earned it.** `npm run gate:433boi` named `samples/433boi.slice1.sample.json`.
Slice 2 had landed a week earlier and bound 130 more fields; the script still pointed at the
slice-1 record, so the gate ran a three-page map against a one-page fixture and failed at step
10 with three unsettled exclusive sets and a coverage failure. **Nothing was wrong with the map,
the fixture or the gate.** The path was stale, and a path in a script is a fact nobody
re-derives. One level out, the same shape is a prompt naming a fixture that does not exist.

**Roughly when.** 2026-08-20, `08ddecb`, which added `adapters/pdf/resolve-fixture.mjs`.

---

# V. Rules about the portal

## [R-23] No property is created until its name is derived, asserted and dry-run

> No property is created until its name is derived, asserted and dry-run. Creates through node
> `fetch`; read created and deleted state back from the portal, never from the request.

**The defect that earned it.** Two.

*The transport.* PowerShell 5.1's `Invoke-RestMethod` sends a string body as ISO-8859-1. One
em-dash in a property description therefore went out mangled and **27 permanent HubSpot property
creations failed**. HubSpot does not delete a property; the ceiling is hard and the portal
currently holds 777 custom contact properties.

*The read-back.* A 2xx on an archive call is **the request being accepted**, which is a
different fact from the object being gone, and HubSpot's search index lags writes by seconds to
minutes, so a search-derived absence can be a stale index rather than an empty portal. The probe
register's `_what_absence_evidence_means` is that sentence, and it requires a direct
`GET /crm/v3/objects/contacts/<id>` returning 404 taken **after** the delete.

**Roughly when.** 2026-08-20, `6b44dbd` (the probe register); the dry-run discipline predates
it, `7706fc8` (2026-08-17, "generate 433-A property definitions from the closed map (dry run
only)").

---

## [R-24] Synthetic data only, registered, torn down with absence verified

> Synthetic data only, registered, torn down with absence verified. No real PII in any artefact,
> including logs and the review page.

**The defect that earned it.** One prompt asserted "synthetic probe absent"; read against the
portal that was true of the 433-A(OIC) probe only. The next asserted a 433-A probe was still
live; the portal returned 404 for all four 433-A ids, so that was wrong too. **What was actually
live was a 433-F probe neither prompt mentioned** — contact 242795652507, seeded 2026-08-18,
carrying a synthetic taxpayer's serialized bank, investment and real-estate rows. Nothing in the
repo recorded that it existed. Both claims were made from memory of a run rather than from a
read of the portal, and the one that mattered was the probe nobody had a memory of at all.

Hence: **a probe is registered when it is seeded, not when it is torn down.** A list written at
teardown time can only contain what someone remembered to tear down, which is the same set as
"nothing was left behind" and proves nothing.

**Roughly when.** 2026-08-20, `6b44dbd`.

---

## [R-25] A drop is logged, and the log is read whole

> Overflow is dropped and logged, never truncated onto the page; and the reader takes every line
> the engine writes, not the first.

**The defect that earned it.** `adapters/pdf/assert-overflow.mjs` read the **first** line
beginning `OVERFLOW` and treated it as the whole of the engine's account.
`adapters/pdf/fill-433b.mjs` logged **one line per drop**, so two of its three drops were
reported UNLOGGED — a drop nobody is told about, which is the exact failure that tool exists
for, manufactured by the tool out of the engine that was telling it.

The first repair changed the **engine** and left the reader, so the convention lived in a
comment in one fill engine and nowhere a tool could enforce it. The fix in this commit is in the
**reader**, which is where the assumption was: every line opening with the word is collected and
the ids unioned, and the reader is asked six canary questions on every run. The same class was
then looked for elsewhere and found once more, in
`adapters/hubspot/no-downgrade.mjs`'s stamp read; two stamps in one report is now
`unclassifiable` rather than first-wins.

**Roughly when.** Engine half 2026-08-22, `8ff600e`; reader half, the class enumeration and the
canary, this commit. Cycle-dated 2026-08-22 for the half with no hash yet.

---

# VI. Working rules

## [R-26] Commit, push, leave a clean tree

> Commit, push, and leave a clean tree. Stage by content where directory paths would split a
> coherent change, and say so.

**Attribution: partial.** The commit-and-push half is a standing instruction from the Owner and
is recorded in `CLAUDE.md` rule 11 and in the repo root `CLAUDE.md`; it is a policy rather than a
remedy for a defect, and it is marked as such. The **stage-by-content** half does have one: a
coherent change that spans `adapters/pdf/` and `adapters/hubspot/` split across two commits by
directory path leaves each half individually failing, and the tree is then bisectable to a
commit that never worked. Where that would happen the staging is by content and the commit
message says so.

**Roughly when.** 2026-08-13, `e67e7a1` — "add execution-autonomy rule (RC always commits +
pushes)". The stage-by-content half is Cycle-dated and is a working rule, not a commit.

---

## [R-27] PowerShell for orchestration, node `fetch` for permanent writes

> PowerShell-native for orchestration and reads; node `fetch` for anything writing permanent
> state.

**The defect that earned it.** The same transport defect as `[R-23]`: PowerShell 5.1's
`Invoke-RestMethod` encodes a string body as ISO-8859-1, so one em-dash cost 27 permanent
property creations. The split is not a preference — PowerShell is fine for orchestration and for
reads, where a mangled byte shows up as a wrong answer you can see, and it is not fine for a
write whose failure is permanent and whose cause is invisible in the response.

**Roughly when.** 2026-08-17/18, during the 433-F and 433-A provisioning runs. Cycle-dated: the
tree records the tools that resulted, not the failure.

## [R-28] A firing proof asserts the step, the line and the verdict

> A firing proof asserts the step, the line and the verdict — never a bare non-zero exit — and
> every other declared line in the same run reads what it was DERIVED to read: passing, unless
> the tool's own declaration makes it depend on the broken one, in which case failing. Breaks
> are separate.

**The defect that earned it.** Two tripwires were reported PROVED on a run that never reached
them. `scratchpad/433b-slice3-prove-tripwire-fires.mjs`'s first draft asserted only
`run.status !== 0`; the gate had failed at **step 3**, on `adapters/pdf/assert-fixture-authorship.mjs`
— a tampered record no longer matches its generator — and step 11, where the tripwires live,
never ran at all. On a twelve-step gate the break is the act most likely to trip an EARLIER
step, so "something failed" is the one thing a broken input reliably produces.

That is the vacuous-guard defect living inside the instrument that certifies the other guards.
The fix was also the shape of the rule: the break now **declares itself** in the record's
`_co_authored_with_hand`, which is not a way around step 3 but the true statement that lets
step 3 pass so step 11 can be reached.

**The audit it forced, on all five forms.** Two break proofs existed and they were unequal.
Slice 3's, once repaired, is the standard. Slice 2's asserted the bare exit, printed "PROVED:
the tripwire fires", edited its fixture with no authorship declaration, and was therefore
recording a step-3 failure under the word PROVED — for 19c, and by implication for three
totals beside it that it never touched. It is registered UNPROVED and re-proved.

**What the standard is enforced by.** `adapters/pdf/firing-proofs.mjs` holds five separately
named conditions and judges one break entry; `adapters/pdf/assert-firing-proofs.mjs` holds the
population, derived from the tree in both directions against a register, and judges the records.
A prover writes what it SAW — the step, the line verbatim, the verdict, every other line's
verdict — and does not decide; a prover that judged its own output is how the first draft came
to report PROVED. A record omitting a field is refused in as many words rather than read as a
pass, because `if (matches.length && mismatch)` is how a guard that could not read its input
came to print PASS (`[R-17]`).

**In-process canaries are a declared class, not an exemption.** A detector that plants a defect
inside its own process has no multi-step run, so "at the step" has no referent; the convention
that stands in its place — the planted defect found BY NAME, and a conforming input still
accepted — is already in force. The class is enumerated and its ground is written down as
weaker, which is `[R-14]` rather than a hole.

**The condition this rule got wrong on its first day, and how.** The blockquote above first read
"every other declared line in the same run must still pass", and the judge enforcing it refused two
of its own proofs. 433-B prints `Net Income (Line 36 minus Line 49)`, so a one-cent break in 36 or
in 49 makes 50 disagree too — correctly, by construction — and the judge reported both as possible
step collapses. **It was right to refuse them and wrong about why.**

The repair sharpens the condition rather than relaxing it. A propagated failure is a THIRD state,
not a tolerated second one: each other line carries the verdict it was expected to read, a line
expected to FAIL must name a dependency **derived from the tool's own declaration** — on this form,
from the feeder graph in `adapters/pdf/maps/433b.totals.json` — and both directions are checked. The
dependent direction is the stronger claim, because a dependent that PASSED would mean a total
computed from a broken operand went on agreeing with itself. An expectation of failure with no
derived cause behind it is refused in as many words, since that field is exactly where a tolerance
would hide. The canary plants both shapes, neither of which the first draft could express.

**What the amendment itself then broke, and it is this rule's own class.** The sharpening renamed
`[FS-3]`'s messages from *"the others passed"* to *"the others read as expected"* and left
`judgeEntry()` in `adapters/pdf/firing-proofs.mjs` filtering on the **old** string. So the
`sole_declared_line` exemption — which exists so a tool with exactly one declared line can state a
checked absence rather than be read as a silence — **matched nothing and was dead**: a conforming
record was still refused, by a message telling its author to add the field they had already added.
Nothing caught it, because the canary planted the empty list and never planted the *declared* empty
list. A refactor of a guard is a change to the guard, and here the refactor was the sharpening of
that very guard. The repair is at the cause: the prefix is now **derived** from `STANDARD` by
`prefixOf()`, so the filter and the message cannot name different things again; `judgeEntry()`
refuses rather than returns clean if the exemption finds nothing to exempt; and the canary plants
both directions, so a judge that exempts everything and a judge that exempts nothing both fail.

**Roughly when.** Ruled 2026-08-23 on the prompt-48 report; the mechanism lands in this commit.
The `sole_declared_line` repair 2026-08-23, prompt 50 commit 1. Cycle-dated for the half with no
hash yet.

---


---

## [R-29] Subject coincidence is a correctness gate, not a volume predictor

> Two forms can describe the same legal person and still ask almost entirely different
> questions of it. A coinciding subject says which reuses are PERMISSIBLE. It says nothing about
> how many there will be.

**The defect that earned it.** `[R-06]` established that the naming test runs on the SUBJECT and
not on the question, and `adapters/pdf/maps/_subjects.cross-form.json` records that axis. Prompt
47 then over-read it in the other direction, writing that if the subject coincided, *"the reuse
picture is nothing like what eleven shared leaf names suggested"*.

It was, in fact, quite like it. 433-B and 433-B(OIC) describe the same legal person — the
business entity — and of **116** classified keys exactly **NINE** bind an existing property.

The axis was still the right instrument and `[R-06]` is still the right rule: each of those nine
is the same fact about the same legal person, and every one would have been a permanent
duplicate under any other reading. What was wrong was expecting the axis to predict a VOLUME.
The prediction was made from leaf-name overlap — the measurement `[R-06]` exists to separate
from this one — arriving back through the sentence that separated them.

**Roughly when.** Ruled 2026-08-25 on the prompt-51 report, from the prompt-50 provisioning
figures. Recorded beside the axis sentence in `_subjects.cross-form.json` in the same commit.
Cycle-dated: the commit that lands it is the commit this rule is written in, so it has no hash yet.

---


## [R-30] Every finished form's tools are exercised in the full regression

> A finished form's tools are re-run on every full regression, in a mode that writes nothing, so
> a tool broken by a NEIGHBOUR's pass fails on the next run rather than the next time somebody
> needs it.

**The defect that earned it.** `[D-18]`'s fourth instance, and it is the fourth that earned this
and not the first three. The three recorded instances were all self-inflicted — a tool broken by
the pass IT precedes — and somebody hits those the next time they run the tool, which is soon.
The fourth was `derive-names-433boi.mjs` broken by the **433-B pass, seven prompts later**,
rewriting nine shared property descriptions out from under a `startsWith` predicate. Nobody
re-runs a finished form's deriver, so there was no natural moment at which it would surface, and
it was found only because that cycle happened to need the regeneration. That item's own closing
sentence is the argument: *"what the sweep buys is that the population is enumerated and no
member can be added silently; what caught the fourth instance was RUNNING THE TOOL."*

**What it found on its first run**, which is the reason the rule is not merely tidy:
`adapters/pdf/assert-row-class-routes.mjs` had been **exiting 2 for two prompts**. It held five
typed `(form, fixture, engine)` triples and two of the fixture paths were stale — 433-B(OIC) at
slice 1 when its acceptance record had been slice 3, 433-B at slice 1 when its had been slice 4.
Slice 1 of 433-B(OIC) feeds no rows to six groups later slices bound, so it reported six UNPROVED
groups and a canary yield of 33 against an expected 39. It is in no npm script and in no gate
step, so nothing had run it. It is the exact class `adapters/pdf/resolve-fixture.mjs` was written
for — *"a path in a script is a fact nobody re-derives"* — and that file's header names a gate
script and a prompt as the two instances while a third sat one directory away with five more
paths in it.

**Roughly when.** Ruled 2026-08-25, prompt 52 commit 1. Cycle-dated: the commit that lands it is
the commit this rule is written in, so it has no hash yet.
`adapters/hubspot/rerun-regression.mjs` holds it, wired into `npm run sweeps`.

---

## [R-31] Prefer the structural assertion over the current reading

> Where both are available, run both and say which would have fired first. A check that a row
> **cannot be read by anything** beats a reading of what is true on the portal now, because the
> first is about structure and the second is about a moment.

**The defect that earned it.** `[D-19]`'s resolution. `assert-registry-targets.mjs` carries five
conditions; `[RT-1]` — no generated rival — is OFFLINE, needs no credential and no network, and
found **334 unreadable rows** in `fields.registry.json`. `[RT-5]` asks the portal whether an
`hs_name` is live, and is the tier a reader instinctively trusts more. The item's own sentence is
the ruling: *"a portal read establishes what is true NOW; `[RT-1]` establishes that the row
CANNOT BE READ by anything — and it would have fired the day the first generated file landed"*,
three forms and many prompts before anybody read the portal against the registry.

**And the size of the miss is what makes it a rule rather than a preference.** The item that
raised it recorded a figure of seven where the true figure was 334 — a factor of forty-eight —
and the reason is the whole lesson: *the count was of what someone had just looked at*. The other
three forms had been in the identical state for longer and nothing in the tree could have said so.

**Roughly when.** Ruled 2026-08-25 on the prompt-51 report, from `[D-19]`'s first-run figures.
Cycle-dated: the commit that lands it is the commit this rule is written in, so it has no hash yet.

---

## [R-32] Headroom is a planning constraint, projected before the first name is derived

> The ceiling is checked before a create and **projected before a classification**. A projection
> that exceeds the headroom is a STOP and a decision for the Principal, never a partial
> provisioning run.

**Attribution: none —** it is a policy, ruled forward rather than earned by a defect, and that is
declared here rather than left as a silence. What it rests on is arithmetic rather than an
incident: the portal held **884 custom contact properties against a documented ceiling of 1,000**
when this was ruled, leaving **116**, and the four provisioned forms cost 186, 239, 116 and 113.
Any one of them would not fit today. The next form to be classified is therefore the first for
which "may I create this name", asked property by property after the crosswalk exists, is the
wrong question at the wrong time — by the time `[R-23]`'s A12 speaks, the work of deciding what
the properties ARE is done, and a form that turns out not to fit becomes a partial run against a
portal that will not free a name.

**How the projection is stated, and what it deliberately does not state.** A bound, not a count:
the most a form can cost is one property per distinct leaf **stem**, and the floor is zero. No
single number between the two is printed, because a number between them is an invented reuse
rate — and `[R-29]` is the rule that a coinciding subject says which reuses are PERMISSIBLE and
nothing whatever about how many there will be. 433-B and 433-B(OIC) coincide and **nine of 116**
keys reused.

**Roughly when.** Ruled 2026-08-25, prompt 52 commit 1, ahead of 433-D's classification.
Cycle-dated: the commit that lands it is the commit this rule is written in, so it has no hash yet.
`adapters/hubspot/headroom.mjs` holds it.

---

## [R-33] When a scope line and a ruling conflict, the ruling governs

> A prompt's scope line and a prompt's own rulings can disagree. When they do, **the ruling
> governs**, the wider action is taken only where it has been established to be safe, and the
> conflict is reported back as a **prompt defect**. `[R-03]` is the same collision against a
> standing guard and resolves the same way; this is the collision INSIDE one document.

**The defect that earned it.** Three occurrences, each quotable.

**One.** The prompt that landed 433-B slice 1 required in its §4 that *"all five forms pass their
gates"* while its scope line excluded the artefacts that makes possible — no fill engine, no
fixtures, an empty crosswalk. That instance is `[R-03]`, and it is listed here too because it is
the same shape seen from the other side: there the ruling collided with a GUARD, here with the
document's own scope sentence.

**Two.** Prompt 51's scope line described one form's expectation; its ruling text required every
declared line on **every mapped form** to be proved to refuse a wrong value. The ruling was
followed: **130 lines were proved, not 52**. Had the scope line governed, 433-A(OIC) would have
stayed at **0 of 51** while the report recorded a stated expectation met — which is the wrong
shape of obedience, and is the reason this is a rule rather than a judgement call.

**Three.** Prompt 52 — the one that ruled this — states in its own scope line that 433-D's
crosswalk and provisioning are *"not in this prompt"*, and then requires in its §5 report a
figure derived from them: *"433-D's expected new-property count and what it leaves"*. The ruling
governed, and what was reported was the strongest thing the scope permits: an **upper bound over
distinct leaf stems with a floor of zero**, with the classification-time count named as still
owed. A count reported where only a bound is available would have been the invented figure
`[R-07]` and `[R-29]` each name from a different side.

**Why the ruling and not the scope line.** A scope line is a plan for the work and a ruling is a
statement about what makes the work correct. When the two disagree, one of them is describing an
engine that does not exist. The wider action is not automatic, though: it is taken **only where
it has been established to be safe**, and where it has not, the conflict is reported and nothing
is guessed.

**Roughly when.** Ruled 2026-08-25, prompt 52 ruling 1. Cycle-dated: the commit that lands it is
the commit this rule is written in, so it has no hash yet.

---

## [R-34] A tool nobody runs is a tool nobody knows is broken

> Every assertion tool in the tree is reachable from `npm run sweeps` or a gate step, or is
> registered as deliberately manual with a reason that is true of it.

**The defect that earned it.** Three instances inside four prompts, and the third is what turned
a pattern into a rule.

*One.* `[D-18]`'s fourth instance. `derive-names-433boi.mjs` asked "did THIS pass create this live
property?" as a `startsWith` against a live description; the 433-B pass rewrote nine shared
descriptions **seven prompts later**, the predicate went false, and 433-B(OIC) could not
regenerate its own definitions file. It was found only because that cycle happened to need the
regeneration. `[R-30]` and `adapters/hubspot/rerun-regression.mjs` are that instance's remedy.

*Two.* `adapters/pdf/assert-row-class-routes.mjs` **had been exiting 2 for two prompts.** Two of
its five typed fixture paths were stale, so it reported six UNPROVED groups and a canary yield of
33 against an expected 39. It is in no npm script and in no gate step, so nothing had run it.

*Three.* `gen-subject-register.mjs --check` **existed all along and was in no script**, standing
over a `meta.generator` whose mis-aim would have destroyed a form's content.

`[R-30]` closed the shape for a finished form's **derivers and fetchers** — that is its declared
population, discovered from `meta.generator` and from the `hs-fetch-<form>.mjs` glob. An asserter
is neither, which is why running every finished form's tools surfaced instance two as a
*bystander* rather than as a member. This rule is the question one level out.

**What it found on its own first run**, which is the reason it is not merely tidy: of 85 tools
derived from the tree, **20 were run by nothing**. Among them `assert-rules.mjs` — the asserter
over *this file* — and `assert-examined.mjs`, `assert-firing-proofs.mjs`,
`assert-completeness-counters.mjs`, `blanket-audit.mjs` and `count-sweep.mjs`. Twelve were wired;
the rest are registered manual with a ground derived from their own source, and four of those are
destructive. `assert-firing-proofs.mjs`, on its first wired run, reported `rerun-regression.mjs`
**undisposed** — a tool that landed one prompt earlier and had never been judged, because the
judge was itself one of the tools nobody ran.

**And the graph is the guard, so the graph is what has to be right.** Two drafts of it each
certified `correlate-labels.mjs` — the one tool `[D-22]` records as being in no script and no gate
step — as reachable: the first by accepting an *import* edge for a tool whose body sits behind a
CLI guard, the second by reading spawn edges from every `.mjs` string in any file that spawns, so
that `guard-sweep.mjs`'s register quoting `spawnSync(process.execPath, ['-e'` as an anchor became
a call site. A graph that certifies the tool the rule was written about certifies nothing, and
both directions are now planted in `adapters/pdf/assert-reachability.mjs`'s canary.

**Roughly when.** Ruled 2026-08-26, prompt 53 ruling 2. Cycle-dated: the commit that lands it is
the commit this rule is written in, so it has no hash yet.
`adapters/pdf/assert-reachability.mjs` holds it, wired into `npm run sweeps`.

---

# What is deliberately not in here

- **Per-form findings.** Those live in each map's `_carried` and in
  `adapters/pdf/maps/_carried.cross-form.json`, which have their own id namespaces and their own
  register. A rule is a statement about how work is done; a carried item is a statement about
  one form.
- **Tool contracts.** How `count-sweep`'s MANIFEST disposes a claim, what the six fixture roles
  mean, which of the three exclusion kinds owes a cross-check — each is documented in the file
  that implements it, at length, and duplicating it here would create a second answer to a
  question that has one.
- **Anything not on the list this file was authored from.** A rule that has been observed but
  never ruled is not a rule, and adding one is an edit to this file in a commit that says so.
