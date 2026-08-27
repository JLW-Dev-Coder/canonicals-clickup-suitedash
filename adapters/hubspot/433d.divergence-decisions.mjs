// EVERY DIVERGENCE ON 433-D, DECIDED, keyed by hs_name.
//
// A DIVERGENCE IS AN EXISTING PROPERTY WHOSE TYPE, fieldType OR OPTION VALUES disagree with what
// this form needs. hs-provision.mjs SKIPS an existing property — it creates, it does not patch —
// so a divergence is not something running the provisioner again fixes. It is a decision, and an
// undecided one is a STOP in the dry run rather than a line in a table.
//
// THIS FORM IS THE FIRST THAT REUSES FROM TWO CREATORS AT ONCE, so it is the first where a
// divergence could arrive from two directions. 433-B reuses nine properties from one predecessor
// and its equivalent file is empty; 433-D reuses three, two created by 433-A under irs433_ and
// one created by 433-B(OIC) under irs433boi_. A type disagreement on either side would mean one
// of the two forms writes a value the other cannot read back.
//
// AND THE THREE ARE ASSERTED TYPE-COMPATIBLE BEFORE THEY GET HERE. derive-names-433d.mjs A9R
// refuses a reuse whose live type or fieldType differs from the row's, and refuses one whose
// target is not live at all — so a divergence on a reuse takes the DERIVATION down, two steps
// before the provisioner. This file is what would hold the decision if that assertion were ever
// relaxed, and its emptiness is a consequence of A9R rather than of nobody having looked.

export const DIVERGENCE_DECISIONS = {
  // Empty, and derived rather than asserted: the dry run reports `differs` from the live portal
  // and STOPs on any entry with no decision here. If this object is empty and the dry run passes,
  // there were none.
};

export const _why_this_is_empty =
  'NO DIVERGENCE EXISTS ON THIS FORM TODAY, and that is a consequence of two things rather than a coincidence. '
  + '(1) The 75 names this form CREATES carry the irs433d_ prefix, which this portal has never seen — the dry run '
  + 're-reads that from the live portal and STOPs if any irs433d_ name that this form does not declare is already '
  + 'there, because a name under this prefix that nothing here declares means something outside this pass created '
  + 'properties for this form. Nothing can diverge from a property that does not exist. '
  + '(2) The 3 names this form REUSES all exist, and derive-names-433d.mjs A9R asserts each one\'s live type and '
  + 'fieldType against the crosswalk row before any name is derived — so a type divergence on a reuse takes the '
  + 'DERIVATION down, two steps before the provisioner. '
  + 'THE ONE DIFFERENCE THE THREE DO CARRY IS NOT A DIVERGENCE: their live DESCRIPTIONS name only the form that '
  + 'created them — 433-A for irs433_tp_ssn_itin and irs433_sp_ssn_itin, 433-B(OIC) for '
  + 'irs433boi_employer_identification_number, and for the first two that description already names 433-B as well, '
  + 'because 433-B\'s own pass re-described what it shares. A description is not a type and reading a value back is '
  + 'unaffected by it, so it is reported as a cosmetic difference with the tool that closes it named.';
