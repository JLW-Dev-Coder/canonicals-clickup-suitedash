// [S2] STALE PRE-MAP, retired the moment its reason expired — IN THE GENERATOR.
//
//   node scratchpad/p54-433d-retire-pre-map.mjs
//
// The 433-D entry in the subject register declared `_pre_map` because that register's own
// `_how_to_use_it` says to derive a new form's subject and add it BEFORE any crosswalk, which
// necessarily means before the map — and adapters/pdf/assert-subject-register.mjs [S2] refuses a
// registered form with no map. The declaration was CHECKED rather than exempting: [S2] also
// requires that a form declaring it really HAS no map, and it fired on the first run after this
// prompt's map landed. That is the declaration working, which is why it is retired here rather
// than left standing over a form that no longer needs it.
//
// THE FIRST DRAFT OF THIS SCRIPT EDITED THE ARTEFACT AND WAS WRONG, AND THE GUARD SAID SO.
// adapters/pdf/maps/_subjects.cross-form.json is GENERATED; adapters/hubspot/generator-guard.mjs
// compares it against what adapters/pdf/gen-subject-register.mjs produces and reported "is not
// what gen-subject-register.mjs produces. Regenerate it, or declare the co-authorship and
// enumerate every hand-added key." Editing the output of a generator is how an artefact starts
// disagreeing with the tool that owns it, and [R-19] is the rule that a generated artefact
// declares its generator and the claim is asserted BY REGENERATION. So this edits the SOURCE and
// regenerates, and the artefact is never touched directly.
//
// What the declaration said is not deleted. It moves to `_pre_map_was`, so the reason the entry
// was authored ahead of its own map survives its expiry: a superseded finding is kept verbatim
// with what it got right ([R-21]).

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const GEN = 'adapters/pdf/gen-subject-register.mjs';
const src = readFileSync(GEN, 'utf8');

const OPEN = '    "_pre_map": "';
const i = src.indexOf(OPEN);
if (i < 0) { console.error(`STOP — ${GEN} carries no "_pre_map" key. Nothing to retire, or the generator moved and this script is now editing by a line it cannot find.`); process.exit(2); }
// THE BOUNDARY IS THE QUOTE-COMMA, NOT THE QUOTE-COMMA-NEWLINE. The first draft looked for
// `",\n` and found nothing, because the generator is stored with CRLF line endings and the
// newline it was matching is `\r\n`. It refused rather than splicing at a boundary it could not
// see, which is the right failure — patch source by a line prefix you have actually read, never
// by a blob you assume the bytes of.
const end = src.indexOf('",', i);
if (end < 0) { console.error('STOP — the _pre_map value does not terminate in a quote-comma; refusing to splice by a boundary this script cannot see.'); process.exit(2); }

const value = src.slice(i + OPEN.length, end);
const RETIRED = 'RETIRED IN PROMPT 54 COMMIT 2, THE COMMIT THAT LANDED adapters/pdf/maps/433d.map.json. adapters/pdf/assert-subject-register.mjs [S2] reported it STALE on the first run after the map existed — \\"the declaration has outlived its reason and is now switching off the orphan check for a form that no longer needs it\\" — which is the whole difference between a declaration and an exemption. An exemption would have gone on being true-looking for as long as nobody read it.';

const replacement = `    "_pre_map_was": "${value}",\n    "_pre_map_retired": "${RETIRED}",`;
const out = src.slice(0, i) + replacement + src.slice(end + 2);
writeFileSync(GEN, out);
console.log(`patched ${GEN}: _pre_map -> _pre_map_was + _pre_map_retired`);

const r = spawnSync(process.execPath, [GEN], { encoding: 'utf8' });
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
if (r.status !== 0) { console.error(`STOP — regenerating the register exited ${r.status}.`); process.exit(2); }

const chk = spawnSync(process.execPath, [GEN, '--check'], { encoding: 'utf8' });
if (chk.status !== 0) { process.stderr.write(chk.stderr || ''); console.error('STOP — the regenerated register does not re-derive from its own generator.'); process.exit(2); }
console.log('OK — the register re-derives from its generator, and the retired declaration is kept verbatim beside its replacement.');
