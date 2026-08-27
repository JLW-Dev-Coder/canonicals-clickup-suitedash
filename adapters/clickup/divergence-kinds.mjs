// divergence-kinds.mjs — which divergence kinds are ABSENCE kinds, declared once.
//
// A DISAGREEMENT is two entries that differ, and prompt 59's ruling settles it: the portal is
// authority for definition, adapters/hubspot/fields.*.json for binding and classification.
//
// An ABSENCE is one side carrying no entry at all. 59-A item D records that the 59 ruling
// PRESUMES both sides have an entry and therefore resolves nothing here, and that the gap is
// the prompt's rather than the tree's. No tool may pick a side on an ABSENCE kind.
//
// It lives in its own module because two consumers need it — the taxonomy report and the export
// builder — and one rule implemented twice is two rules that happen to agree today ([R-39]).
//
// [R-19] GENERATOR DECLARATION: this module writes nothing. It declares.

export const ABSENCE_KINDS = new Set([
  // Live on the portal, carrying one of this project's declared prefixes, and no field file
  // holds a row for it. There is no binding authority to consult, so which side is right is
  // not a question this tree can answer.
  'live-but-unbound',
  // A field row names a property that is not live. Either it was never provisioned or it was
  // deleted — different facts with different fixes, and nothing here distinguishes them.
  'row-names-no-live-property',
]);
