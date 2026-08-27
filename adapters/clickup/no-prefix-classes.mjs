// no-prefix-classes.mjs — the classification of item C, in ONE place.
//
// WHY IT IS A MODULE AND NOT A COPY IN EACH CALLER. Two consumers need this verdict: the
// report at adapters/clickup/classify-no-prefix.mjs and the export at
// adapters/clickup/build-mirror-export.mjs. A second implementation is a second thing to
// drift, and [R-39] is the rule that N statements produced by one build step are one statement
// quoted N times — the converse is just as true: one rule implemented twice is two rules that
// happen to agree today.
//
// [R-19] GENERATOR DECLARATION: this module writes nothing. It classifies.

import { execFileSync } from 'node:child_process';

// The epoch is DERIVED, never typed: the earliest createdAt among the properties this repo's
// field files actually name. If this project provisions again the epoch does not move — it is
// the FIRST such date — which is what makes "created before it" a decisive negative.
export function projectEpoch(custom, art) {
  const dates = custom.filter(p => art.rowsByName.has(p.name)).map(p => p.createdAt).filter(Boolean).sort();
  return dates[0] ?? null;
}

// A group holding at least one hubspotDefined property is a group HubSpot ships. Read off the
// portal rather than listed, so a new HubSpot group needs no edit here.
export function nativeGroupSet(live) {
  return new Set(live.filter(p => p.hubspotDefined).map(p => p.groupName));
}

// `-w` IS LOAD-BEARING. Without it `git grep -F` matches substrings: `ein` inside "being",
// `tags` inside every line of tag-handling code. That put six properties created in 2021-2022
// into the RC-authored class on their first run. A witness reading a substring is not reading
// the identifier it claims to read.
export function mentionedNames(names) {
  if (!names.length) return new Set();
  try {
    const out = execFileSync('git', ['grep', '-o', '-h', '-w', '-F', '-f', '-', '--', '.'],
      { input: names.join('\n'), encoding: 'utf8', maxBuffer: 1 << 28 });
    return new Set(out.split('\n').map(s => s.trim()).filter(Boolean));
  } catch (e) {
    // Exit 1 is "no match", which is an answer. Anything else is "could not read", and a
    // witness that could not be read must never be reported as absent — that is the
    // guard-that-skips-when-it-cannot-read shape, and it reports PASS over a dead regex.
    if (e.status === 1) return new Set();
    throw new Error(`git grep failed with status ${e.status}; the tree-mention witness could not be read and must not be reported as absent.`);
  }
}

// createdAt is DECISIVE for authorship and the tree mention is NOT or-ed into it: this repo
// refers to plenty it did not create. The mention is carried on the row as an observation.
export function classifyRow(p, { epoch, nativeGroups, mentioned }) {
  const afterEpoch = epoch != null && p.createdAt >= epoch;
  const named = mentioned.has(p.name);
  const nativeGroup = nativeGroups.has(p.groupName);
  if (afterEpoch) return {
    cls: 3, label: 'rc-authored-unprefixed', afterEpoch, named, nativeGroup,
    why: `RC-authored and unprefixed — createdAt ${p.createdAt} is at or after the project epoch ${epoch}${named ? ', and the internal name also appears as a whole word in a tracked file in this repo' : ', though no tracked file names it'}`,
  };
  if (nativeGroup) return {
    cls: 1, label: 'portal-authored', afterEpoch, named, nativeGroup,
    why: `portal-authored — group "${p.groupName}" also holds hubspotDefined properties, so it is a group HubSpot ships; created ${p.createdAt}, before the project epoch${named ? '. This repo does mention the name, which is a reference and not authorship' : ''}`,
  };
  return {
    cls: 2, label: 'integration-authored', afterEpoch, named, nativeGroup,
    why: `integration-authored — group "${p.groupName}" holds no hubspotDefined property, so it was created by whoever created its properties; created ${p.createdAt}, before the project epoch${named ? '. This repo does mention the name, which is a reference and not authorship' : ''}`,
  };
}
