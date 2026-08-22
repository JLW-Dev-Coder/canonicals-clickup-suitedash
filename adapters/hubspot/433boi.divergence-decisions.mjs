// THE DECISIONS about 433-B(OIC) properties that already exist on the portal and whose live
// definition disagrees with what this form needs.
//
// ONE FILE, TWO READERS, for the same reason 433aoi.divergence-decisions.mjs exists:
// hs-dryrun-433boi.mjs uses it to refuse to report a divergence nobody has decided;
// hs-readback-433boi.mjs uses it to tell a KNOWN, decided divergence apart from a property this
// pass created wrongly. Those are two very different failures and only one of them is a defect.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// IT IS EMPTY, AND THE EMPTINESS IS A CONSEQUENCE OF THE SUBJECT RULING, NOT AN OVERSIGHT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A divergence needs a property that already exists. Every one of this form's 113 names is
// `irs433boi_<fact>`, and that prefix has never been used on this portal — because the
// classification's `subject` block rules that no fact whose subject is the filing entity may
// take a shared `irs433_` name, and on this form that is every fact without exception.
//
// So the set of properties this form REUSES is empty, and a set of decisions about reused
// properties that disagree with what it needs is empty for a reason that can be stated rather
// than for want of looking. The dry run reports it either way: `exists and matches 0, exists
// and DIFFERS 0, new 113` is a measured result, and an empty decisions file beside a non-zero
// differs count would be the STOP this file's contract already declares.
//
// AN ENTRY ADDED HERE WOULD MEAN THE SUBJECT RULING HAD BEEN OVERTURNED FOR SOME KEY, which
// derive-names-433boi.mjs A4 refuses outright — so if this file ever stops being empty, the
// thing to re-read is the classification, not the portal.

export const DIVERGENCE_DECISIONS = {};
