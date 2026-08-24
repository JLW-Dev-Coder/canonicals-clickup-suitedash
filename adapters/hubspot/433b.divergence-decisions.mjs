// EVERY DIVERGENCE ON 433-B, DECIDED, keyed by hs_name.
//
// A DIVERGENCE IS AN EXISTING PROPERTY WHOSE TYPE, fieldType OR OPTION VALUES disagree with what
// this form needs. hs-provision.mjs SKIPS an existing property — it creates, it does not patch —
// so a divergence is not something running the provisioner again fixes. It is a decision, and an
// undecided one is a STOP in the dry run rather than a line in a table.
//
// THIS FORM IS THE FIRST WITH A REUSE BUCKET, SO IT IS THE FIRST THAT COULD HAVE ONE AT ALL.
// 433-B(OIC)'s equivalent file is empty and says so, because that form reuses nothing: its
// subject was new, so all 113 names were its own and nothing existed to diverge from. 433-B binds
// nine properties 433-B(OIC) created, and each one is a place where a type disagreement would
// mean one of the two forms writes a value the other cannot read back.
//
// AND THE NINE ARE ASSERTED TYPE-COMPATIBLE BEFORE THEY GET HERE. derive-names-433b.mjs A9R
// refuses a reuse whose live type or fieldType differs from the row's, so a divergence on a
// reuse would have STOPped the derivation. This file is what would hold the decision if that
// assertion were ever relaxed, and its emptiness is a consequence of A9R rather than of nobody
// having looked.

export const DIVERGENCE_DECISIONS = {
  // Empty, and derived rather than asserted: the dry run reports `differs` from the live portal
  // and STOPs on any entry with no decision here. If this object is empty and the dry run passes,
  // there were none.
};

export const _why_this_is_empty =
  'NO DIVERGENCE EXISTS ON THIS FORM TODAY, and that is a consequence of two things rather than a coincidence. '
  + '(1) The 107 names this form CREATES carry the irs433b_ prefix, which this portal has never seen — the dry run '
  + 're-reads that from the live portal and STOPs if any irs433b_ name is already there, because a name under an '
  + 'unused prefix that is already live means something outside this pass created properties for this form. '
  + 'Nothing can diverge from a property that does not exist. '
  + '(2) The 9 names this form REUSES all exist, and derive-names-433b.mjs A9R asserts each one\'s live type and '
  + 'fieldType against the crosswalk row before any name is derived — so a type divergence on a reuse takes the '
  + 'DERIVATION down, two steps before the provisioner. '
  + 'THE ONE DIFFERENCE THE NINE DO CARRY IS NOT A DIVERGENCE: their live DESCRIPTIONS name only 433-B(OIC), '
  + 'because that form created them. A description is not a type and reading a value back is unaffected by it, so '
  + 'it is reported as a cosmetic difference and handled by adapters/hubspot/hs-describe-reused-433b.mjs, which '
  + 'patches descriptions and nothing else.';
