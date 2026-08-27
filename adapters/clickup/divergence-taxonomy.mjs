// divergence-taxonomy.mjs — item D of prompt 59-A.
//
// Prompt 59 ruled: the portal is authority for DEFINITION, fields.*.json for BINDING and
// CLASSIFICATION. 59-A records that the ruling PRESUMES both sides carry an entry, and does not
// resolve the case where one side has none. That gap is acknowledged as an [R-01] shape.
//
// So this file splits every divergence in two:
//
//   DISAGREEMENT — both sides carry an entry and they differ. The 59 ruling governs, the
//                  divergence is recorded against the record, and work proceeds.
//   ABSENCE      — one side has no entry at all. NO SIDE IS PICKED. The kind, its count and one
//                  example are reported, and the record carries `ruling: OWED` rather than a
//                  resolution. A ruling that does not exist must not be invented by the tool
//                  that noticed it was missing.
//
// [R-19] GENERATOR DECLARATION: this file generates scratchpad/p59-divergence-taxonomy.md.
//
// usage: node adapters/clickup/divergence-taxonomy.mjs
import { hs } from '../hubspot/hs-lib.mjs';
import { loadArtefacts, derivePopulation, prefixTag, NO_PREFIX_TAG } from './derive-property-records.mjs';
import { writeFileSync } from 'node:fs';

// Which kinds are ABSENCE kinds lives in its own module so this report and the export builder
// read the SAME declaration. [R-39]: one statement, not two that agree today.
import { ABSENCE_KINDS } from './divergence-kinds.mjs';

const live = (await hs('/crm/v3/properties/contacts?archived=false')).results;
const custom = live.filter(p => !p.hubspotDefined);
const art = loadArtefacts();
const records = derivePopulation(custom, art);

// ── the other direction, which the record deriver cannot see ─────────────────────────────
// A record exists per LIVE property, so a field row naming a property that is NOT live has no
// record to hang a divergence on. It is derived here, over the field files, and is an ABSENCE
// kind in the other direction.
const liveNames = new Set(custom.map(p => p.name));
const fileOnly = [...art.rowsByName.keys()].filter(n => !liveNames.has(n)).sort();

// ── tabulate ─────────────────────────────────────────────────────────────────────────────
const byKind = new Map();
for (const r of records) for (const d of r.divergences) {
  if (!byKind.has(d.kind)) byKind.set(d.kind, []);
  byKind.get(d.kind).push({ name: r.hs_name, detail: d.detail });
}
if (fileOnly.length) byKind.set('row-names-no-live-property', fileOnly.map(n => ({ name: n, detail: `named by ${art.rowsByName.get(n).map(r => r.file).join(', ')}; not live on the portal` })));

const kinds = [...byKind.entries()].map(([kind, items]) => ({
  kind, items,
  occurrences: items.length,
  properties: new Set(items.map(i => i.name)).size,
  side: ABSENCE_KINDS.has(kind) ? 'ABSENCE' : 'DISAGREEMENT',
  absentSide: kind === 'live-but-unbound' ? 'fields.*.json has no row — no binding authority exists to consult'
    : kind === 'row-names-no-live-property' ? 'the portal has no property — either it was never provisioned or it was deleted, and those are different facts with different fixes'
      : null,
})).sort((a, b) => b.occurrences - a.occurrences);

const disagreement = kinds.filter(k => k.side === 'DISAGREEMENT');
const absence = kinds.filter(k => k.side === 'ABSENCE');
const divergentProps = new Set(records.filter(r => r.divergences.length).map(r => r.hs_name));

// ── the unbound population, in full, because it is bigger than the flagged kind ──────────
// `live-but-unbound` only fires where the name carries a project prefix. The wider fact is that
// 253 live properties have no field row at all; the 252 without a prefix are item C's classes
// and are NOT a defect. Both figures are stated so neither is mistaken for the other.
const noRow = custom.filter(p => !art.rowsByName.has(p.name));
const noRowPrefixed = noRow.filter(p => prefixTag(p.name) !== NO_PREFIX_TAG);

const L = ['# Item D — divergence taxonomy', '',
  `Derived ${new Date().toISOString()}. Population **${custom.length}** live custom contact properties; **${divergentProps.size}** carry at least one divergence.`, '',
  `Kinds: **${kinds.length}** — ${disagreement.length} DISAGREEMENT, ${absence.length} ABSENCE.`, '',
  '## The split, and why it exists', '',
  'Prompt 59 ruled the portal authoritative for definition and `fields.*.json` authoritative for binding and classification. 59-A records that the ruling presumes both sides carry an entry. Where one does not, the ruling resolves nothing, and this tool does not invent one.', '',
  '| kind | side | occurrences | properties | example |', '|---|---|---:|---:|---|'];
for (const k of kinds) L.push(`| \`${k.kind}\` | **${k.side}** | ${k.occurrences} | ${k.properties} | \`${k.items[0].name}\` |`);
L.push('');

L.push('## DISAGREEMENT kinds — the 59 ruling governs, work proceeds', '');
for (const k of disagreement) {
  L.push(`### \`${k.kind}\` — ${k.occurrences} occurrence(s) across ${k.properties} propert(ies)`, '');
  L.push(`Both sides carry an entry and they differ. Recorded against the record; not reconciled.`, '');
  L.push('Example:', '', `- \`${k.items[0].name}\` — ${k.items[0].detail}`, '');
}

L.push('## ABSENCE kinds — NO SIDE PICKED, ruling OWED', '');
if (!absence.length) L.push('None.', '');
for (const k of absence) {
  L.push(`### \`${k.kind}\` — ${k.occurrences} occurrence(s) across ${k.properties} propert(ies)`, '');
  L.push(`**The absent side:** ${k.absentSide}`, '');
  L.push(`**No side is picked.** Every affected record carries \`divergence.ruling = "OWED"\` in the export. The derived binding, classification and backbone fields on those records already read *not derivable* with their reason, which is the honest state and not a resolution.`, '');
  L.push('Example:', '', `- \`${k.items[0].name}\` — ${k.items[0].detail}`, '');
  if (k.occurrences <= 20) { L.push('Every member:', ''); for (const i of k.items) L.push(`- \`${i.name}\` — ${i.detail}`); L.push(''); }
}

L.push('## The wider absence, stated so it is not confused with the flagged kind', '',
  `- **${noRow.length}** live properties have no row in any \`fields.*.json\`.`,
  `- Of those, **${noRowPrefixed.length}** carry one of this project's declared prefixes and are flagged \`live-but-unbound\` — a property this project named and no longer binds.`,
  `- The remaining **${noRow.length - noRowPrefixed.length}** carry no project prefix and are item C's classes 1 and 2: portal-authored and integration-authored properties this repo never bound and was never going to. Their absence from \`fields.*.json\` is expected and is not a divergence.`,
  `- In the other direction: **${fileOnly.length}** field row(s) name a property that is not live.`, '');

writeFileSync('scratchpad/p59-divergence-taxonomy.md', L.join('\n'));

console.log(`population ${custom.length}; ${divergentProps.size} propert(ies) carry a divergence; ${kinds.length} kind(s)\n`);
for (const k of kinds) console.log(`  ${k.side.padEnd(13)} ${k.kind.padEnd(32)} ${String(k.occurrences).padStart(4)} occ / ${String(k.properties).padStart(4)} props   e.g. ${k.items[0].name}`);
console.log(`\nlive with no field row: ${noRow.length} (of which ${noRowPrefixed.length} carry a project prefix)`);
console.log(`field rows naming no live property: ${fileOnly.length}`);
console.log(`\nABSENCE kinds requiring a ruling: ${absence.length}${absence.length ? ' — ' + absence.map(k => `${k.kind}(${k.occurrences})`).join(', ') : ''}`);
console.log('wrote scratchpad/p59-divergence-taxonomy.md');
