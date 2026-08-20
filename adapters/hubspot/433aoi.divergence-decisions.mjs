// THE DECISIONS about 433-A(OIC) properties that already existed on the portal and whose live
// definition disagrees with what this form needs.
//
// ONE FILE, TWO READERS. hs-dryrun-433aoi.mjs uses it to refuse to report a divergence nobody
// has decided; hs-readback-433aoi.mjs uses it to tell a KNOWN, decided divergence apart from a
// property this pass created wrongly. Those are two very different failures and only one of
// them is a defect.
//
// It lives in its own file rather than in either tool because the alternative is each tool
// carrying its own copy of the list, and a second copy of a judgement is a second judgement -
// the same reason the read-back reads the portal instead of the create response, and the same
// reason a reimplementation is never evidence about the original.
//
// A DIVERGENCE WITHOUT AN ENTRY HERE IS A STOP in the dry run. That is deliberate: hs-provision
// skips a property that already exists, so "the provisioner did nothing" and "we decided the
// live definition is the one to keep" produce identical portals, and that indistinguishability
// is the defect this file removes.

export const DIVERGENCE_DECISIONS = {
  irs433_tp_pay_period: {
    decided_in: 'Prompt 36 commit 2, the 433-A(OIC) provisioning dry run',
    decision: 'KEEP THE LIVE DEFINITION. Create nothing, change nothing, and do not remove the fifth option.',
    why:
      'The live property carries five options and 433-A(OIC) prints four; the extra one is `semi-monthly`, added for '
      + '433-F by crosswalk.433f.json option_extensions because 433-F prints Weekly / Biweekly / Semi-monthly / Monthly '
      + 'and has no Other box. The live set is a strict SUPERSET of what this form needs, so every value this form can '
      + 'print is storable, and the direction is what makes it safe. Removing the option would break 433-F and cannot be '
      + 'walked back for a taxpayer already recorded as semi-monthly; adding a second property would split one fact '
      + 'across two names.',
    what_happens_to_a_value_this_form_cannot_print:
      'It fails LOUDLY, twice, and prints nothing wrong. hs-fetch-433aoi.mjs resolves the stored value through '
      + 'map_option_by_value, which has no `semi-monthly` key, and REFUSES TO WRITE the record. If a hand-authored '
      + 'record reached the engine anyway, fill-433aoi.mjs applyOption finds no matching option and pushes an '
      + 'optionError, and no PDF is written. That is correct for a form that prints no box for the answer: '
      + '433-A(OIC) prints an Other box, and whether a semi-monthly taxpayer belongs in it is a data-entry question, '
      + 'not a schema one.',
  },
  irs433_sp_pay_period: {
    decided_in: 'Prompt 36 commit 2, the 433-A(OIC) provisioning dry run',
    decision: 'KEEP THE LIVE DEFINITION. Same as irs433_tp_pay_period, on the spouse side.',
    why:
      'Identical divergence from the identical cause - the 433-F option extension - on the spouse pay-period property. '
      + 'Decided the same way deliberately: reading two identically-caused divergences two different ways would be worse '
      + 'than reading them both wrong.',
    what_happens_to_a_value_this_form_cannot_print: 'As above.',
  },
};
