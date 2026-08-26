// THE DECLARED REGISTER FOR absence-sweep.mjs — every page-claim that carries no drawn
// evidence of its own, with what it WAS checked against and whether that settles it.
//
// SAME SHAPE AS exclusion-sweep.mjs's DECLARED: an entry removes a claim from the failing set
// only by saying something true about the world, and an UNREGISTERED failure is a STOP. A claim
// of this kind added to the tree without being disposed of here cannot pass.
//
// IT IS A SEPARATE FILE BECAUSE A REGISTER AND ITS SWEEP HAVE DIFFERENT LIFETIMES. The sweep
// changes when the QUESTION changes; this file changes every time a claim is written, settled
// or retired, which is far more often. register-ids.mjs reads it by name.
//
// TWO KINDS, AND THE DIFFERENCE IS WHETHER ANYTHING COULD STILL CONTRADICT THE CLAIM:
//
//   asserted-elsewhere  the claim IS settled, by a named instrument, against the page. The
//                       sentence defers rather than restates. Nothing is owed.
//   open                the claim is about the printed page, it is UNSETTLED, and no instrument
//                       in this repo has compared it to the page. Reported in full, carrying an
//                       id, and NOT resolved — which is what an arguable item gets.
//
// EVERY `open` ENTRY IS A LIVE ADMISSION, and they are all one shape: a claim about a printed
// page where the thing claimed absent is a CONCEPT rather than a string. "433-A prints no box
// of any kind" cannot be settled by searching drawn text, because a search for "box" finds the
// word and not the column. That is [D-06] exactly — and [D-06] is also the proof that these are
// worth counting, because it was one of them and it was wrong.

/**
 * @type {Array<{id:string, kind:'asserted-elsewhere'|'open', at:RegExp, why:string}>}
 * `at` is matched against "<file> :: <json path>", the same string the sweep reports.
 */
export const DECLARED = [
  {
    id: 'AB-D01',
    kind: 'asserted-elsewhere',
    at: /^adapters\/pdf\/maps\/\w+\.totals\.json :: not_checkable\.entries\./,
    why: 'A `not_checkable` entry states that a total’s operands sit on an ATTACHMENT rather than on '
       + 'the page, so nothing printed could verify it. That is a claim about the OPERAND SET, and the '
       + 'operand set is declared in the same file and checked against the cells the map binds by the '
       + 'gate’s tripwire pass and by adapters/pdf/assert-completeness-counters.mjs. The page-claim is '
       + 'a consequence of a set this tree derives, not a second reading of the page.',
  },
  {
    id: 'AB-D07',
    kind: 'asserted-elsewhere',
    at: /^adapters\/pdf\/maps\/433d\.totals\.json :: _why$/,
    why: 'THE CLAIM IS THAT 433-D PRINTS NO TOTAL ANYWHERE, and it is not asserted here — it is DERIVED against the drawn page on every run. adapters/pdf/count-sweep.mjs [S-50] joins every drawn run of all four pages and counts matches for /Add lines?/, /\bTotals?\b/ and /minus/, comparing each against the zero this file claims; [S-51] runs the SAME joined text through the same matching with a required NON-ZERO answer, so a reading that had gone dead reports 0 against a required non-zero and takes the run down rather than confirming the absence by failing to look. That is drawn evidence, and it is stronger than a coordinate quoted beside the sentence would be: it is re-read on every run instead of transcribed once.',
  },
  {
    id: 'AB-D08',
    kind: 'asserted-elsewhere',
    at: /^adapters\/pdf\/maps\/433d\.headings\.json :: _why_it_is_empty_and_that_is_a_declaration$/,
    why: 'THE CLAIM IS THAT 433-D DRAWS NO REPEATABLE TABLE, so no group row exists for a printed heading to stand over. adapters/pdf/verify-headings.mjs checks it in BOTH directions on every gate run: the sentence is refused unless the map really declares zero groups, and a map declaring zero groups with no such sentence is still a STOP — so the declaration cannot outlive the state it describes, which is the [S2] STALE PRE-MAP shape that fired on this same form the day it got a map. The page-side half is visible in the partition the same map derives: 166 of 168 fields bound as 83 mirrored pairs, none of them a slot in a repeating unit.',
  },
  {
    id: 'AB-D02',
    kind: 'asserted-elsewhere',
    at: /^adapters\/hubspot\/asset-row-shapes\.json :: classes\.\d+\.printed_tables\./,
    why: 'A `printed_tables` entry beginning "none - " is the class declaring that a form prints no table '
       + 'of that kind. adapters/pdf/assert-row-shape-spec.mjs claimsNothing() removes exactly these from '
       + '[A3]’s routing scope AND enumerates every one it removed through excusedClaims(), which its own '
       + 'report prints on every run. Registered there and counted there; restating the evidence here would '
       + 'be a second instrument able to disagree with the first.',
  },
  {
    id: 'AB-D03',
    kind: 'open',
    at: /^adapters\/pdf\/maps\/\w+\.crosswalk-classification\.json :: entries\.\d+\.why$/,
    why: 'A CROSS-FORM SEMANTIC ABSENCE — "433-A prints no box of any kind", "433-A grants no such allowance '
       + 'anywhere", "prints no date cells at all". The subject is another form’s page and the thing claimed '
       + 'absent is a CONCEPT, not a string, so no reading of drawn text settles it: searching for "allowance" '
       + 'finds the word and not the column. These are [D-06]’s exact shape. Settling one means a person '
       + 'reading that form’s printed page and recording coordinates — which is what this repo already '
       + 'requires of a NEW claim. These are landed ones, kept verbatim rather than rewritten.',
  },
  {
    id: 'AB-D04',
    kind: 'open',
    at: /^adapters\/pdf\/maps\/433aoi\.map\.json :: _computed\.entries\.\d+\.(formula|note)$/,
    why: 'Two `_computed` entries state that a printed row carries no formula and that a row prints no '
       + 'lease/own conditional. Both are true of the drawn page and neither cites it: the support is the '
       + 'printed caption, which align-block.mjs has read, but the sentence names no coordinate. OPEN — what '
       + 'is owed is the caption’s coordinate beside the claim, which is a map edit and is not made here.',
  },
  {
    id: 'AB-D05',
    kind: 'open',
    at: /^adapters\/pdf\/maps\/(433aoi\.map\.json :: _arguable_page5\.1\.|433boi\.map\.json :: _carried\.open\.3\.subject$|433f\.headings\.json :: groups\.other_assets\._why$)/,
    why: 'One-line SUBJECT and REPORTED fields of items that are themselves already carried and open. The '
       + 'absence each states is argued in the sibling record it points at; what these lines lack is evidence '
       + 'of their own. They are the TITLE of an open item rather than the finding, and resolving an open '
       + 'item by editing its title is not resolving it.',
  },
  {
    id: 'AB-D06',
    kind: 'open',
    // ENUMERATED AS EXACT PATHS, NOT AS A PATTERN, AND FOR TWO REASONS. Enumerated is this
    // repo granularity standard — two paths are two paths, and a pattern over them could
    // silently grow to cover a third nobody read. And a pattern would have to spell the key
    // `not_a_row_column` inside a REGEX literal, where exclusion-sweep [EX-05] reads it as a
    // consumer wiring up an inert key: [EX-05] refused this entry on its first run and was
    // right to, because it cannot see from outside that the disposition here keeps the claim
    // OPEN rather than excusing it. A path in a string literal is data, which is what it is.
    at: [
      'adapters/hubspot/asset-row-shapes.json :: classes.0.not_a_row_column.0',
      'adapters/hubspot/asset-row-shapes.json :: classes.1.canonical_row.3.note',
    ],
    why: '"433-F prints no phone cell for investments", and the balance_as_of column note. Both are '
       + 'per-(column, form) printed claims of exactly the kind [D-06] created `printed_as_checkbox` and '
       + '`row_flag` to carry WITH the printed label page, baseline and x1. These two carry none. OPEN, '
       + 'and the closest thing in the tree to a live instance of the class: the fix that gave the other '
       + 'columns their printed evidence did not reach these.',
  },
];
