// projection-probe.mjs — item E of prompt 59-A. Establishes, per content class, exactly what
// survives the ClickUp round trip and what the mark-stripped projection can and cannot see.
//
// WHY THIS IS THE MOST IMPORTANT PROBE IN THE SET
// ----------------------------------------------
// Verification moved into a mark-stripped projection because ClickUp returns `description` as a
// plain-text rendering and a byte comparison is therefore meaningless. That move is right and
// the projection is UNMEASURED, which makes it the `validate-map.mjs:235` shape: a comparison
// whose input was silently altered before it arrived turns "cannot read" into "agree", and it
// holds for many commits because everything downstream of it passes.
//
// The specific hazard is intraword underscore. `irs433_tp_ssn_itin` is four underscores in one
// token and these bodies are dense with them. CommonMark does not treat intraword `_` as
// emphasis. ClickUp's renderer may or may not be CommonMark. Nothing here rules on which —
// the probe sends each class and reads back what arrives.
//
// [R-23]/[R-24]: one task, registered in the same register as every other probe on this list,
// torn down, absence read back from ClickUp rather than inferred from the DELETE.
//
// [R-19] GENERATOR DECLARATION: this file generates scratchpad/p59-projection-probe.md and
// appends to adapters/clickup/write-probe.json.
//
// usage: node adapters/clickup/projection-probe.mjs <listId>
import { cu, listTasks, getTask, createTask, deleteTask, stop } from './cu-lib.mjs';
import { stripMarks } from './projection.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const listId = process.argv[2];
if (!listId) { console.error('usage: node adapters/clickup/projection-probe.mjs <listId>'); stop(2); }

const REG = 'adapters/clickup/write-probe.json';
const register = existsSync(REG) ? JSON.parse(readFileSync(REG, 'utf8')) : { _what: 'probe register', probes: [] };
const stale = register.probes.filter(p => p.state !== 'torn_down');
if (stale.length) { console.error(`REFUSING: ${stale.length} probe(s) not torn down: ${stale.map(p => p.task_id).join(', ')}`); stop(3); }

// ── the cases ────────────────────────────────────────────────────────────────────────────
// Each case is one line, opened by a marker of plain letters and digits so the marker itself
// cannot be the thing that fails to survive. `sent` is what goes out after the marker; the
// report compares it against whatever comes back on that marker's line.
const BS = String.fromCharCode(92);        // a literal backslash, built rather than escaped
const CASES = [
  ['E1a', 'bare token, four intraword underscores', 'irs433_tp_ssn_itin'],
  ['E1b', 'bare token, leading underscore', '_co_authored_with_hand'],
  ['E2', 'the same token wrapped in backticks', '`irs433_tp_ssn_itin`'],
  ['E3a', 'single intraword underscore', 'backbone_key'],
  ['E3b', 'underscores around a word, the emphasis case', '_emphasised_'],
  ['E3c', 'two tokens, underscore-adjacent', 'vlp_case_liab and irs433d_lien_determination'],
  ['E4a', 'line beginning with a hash', null],
  ['E4b', 'line beginning with a hyphen', null],
  ['E4c', 'line beginning with an ordinal', null],
  ['E5', 'pipe-delimited row that could be read as a table', 'alpha | beta | gamma'],
  ['E6a', 'a literal backslash', `a${BS}b`],
  ['E6b', 'an asterisk pair around a word', '*starred*'],
  ['E6c', 'the two-character sequence backslash-n', `x${BS}ny`],
  ['E6d', 'a literal underscore-escape sequence', `${BS}_notemph${BS}_`],
  ['E7a', 'leading spaces before text', '      six spaces precede this'],
  ['E7b', 'blank line between two non-blank lines', null],
  ['E8', 'trailing space at end of line', 'trailing space follows this '],
];

const lines = [];
const expect = new Map();
for (const [id, what, payload] of CASES) {
  if (id === 'E4a') { lines.push(`# ${id} hash-opened heading`); expect.set(id, `# ${id} hash-opened heading`); continue; }
  if (id === 'E4b') { lines.push(`- ${id} hyphen-opened item`); expect.set(id, `- ${id} hyphen-opened item`); continue; }
  if (id === 'E4c') { lines.push(`1. ${id} ordinal-opened item`); expect.set(id, `1. ${id} ordinal-opened item`); continue; }
  if (id === 'E7b') { lines.push(`${id}top non-blank`, '', `${id}bottom non-blank`); expect.set(id, `${id}top / (blank) / ${id}bottom`); continue; }
  lines.push(`${id} ${payload}`);
  expect.set(id, `${id} ${payload}`);
  lines.push('');
}
const body = lines.join('\n');

console.log(`projection probe — ${CASES.length} case(s), body ${body.length} chars`);

// ── create, register, read back ──────────────────────────────────────────────────────────
const created = await createTask(listId, { name: '_vlp_projection_probe__delete_me', markdown_description: body });
register.probes.push({ task_id: created.id, name: '_vlp_projection_probe__delete_me', list_id: String(listId), url: created.url, created_at_ms: Number(created.date_created), state: 'live', torn_down_read: null, purpose: 'item E of prompt 59-A: establish what the ClickUp round trip and the mark-stripped projection preserve, per content class.' });
writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');
console.log(`create -> ${created.id}`);

const back = await getTask(created.id);
const returned = back.description ?? '';
const retLines = returned.split('\n');
console.log(`read back ${returned.length} chars, ${retLines.length} line(s)\n`);

// ── analyse, per case ────────────────────────────────────────────────────────────────────
const rows = [];
for (const [id, what] of CASES) {
  const hit = retLines.find(l => l.includes(id)) ?? null;
  const sentLine = expect.get(id);
  let verdict, detail;
  if (id === 'E7b') {
    const iTop = retLines.findIndex(l => l.includes('E7btop'));
    const iBot = retLines.findIndex(l => l.includes('E7bbottom'));
    const gap = (iTop >= 0 && iBot >= 0) ? iBot - iTop - 1 : null;
    verdict = (iTop >= 0 && iBot >= 0) ? (gap === 1 ? 'PRESERVED' : 'ALTERED') : 'LOST';
    detail = `both non-blank lines ${iTop >= 0 && iBot >= 0 ? 'present' : 'NOT both present'}; blank lines between them: ${gap}`;
  } else if (hit === null) {
    verdict = 'LOST'; detail = 'the marker itself does not appear in the returned text';
  } else {
    // THE WHOLE LINE, NOT THE PART AFTER THE MARKER — and this is the second draft.
    // The first compared `slice(indexOf(id) + id.length)`, i.e. only what followed the marker.
    // E4a/E4b/E4c put their syntax BEFORE it: "# E4a ...", "- E4b ...", "1. E4c ...". All three
    // came back with the leading marker stripped and all three were reported PRESERVED, because
    // the altered part sat outside the span being compared. That is precisely the defect this
    // probe exists to find — a comparison whose input was altered before it arrived, reporting
    // agreement it could not see a difference through — committed by the probe itself, which is
    // [R-12] and is recorded here rather than quietly corrected.
    if (hit === sentLine) { verdict = 'PRESERVED'; detail = 'the whole line is byte-identical'; }
    else { verdict = 'ALTERED'; detail = `sent ${JSON.stringify(sentLine)} -> got ${JSON.stringify(hit)}`; }
  }
  // and separately: can the PROJECTION see the difference? A class the projection flattens is a
  // class --verify cannot report a fault on, whatever the round trip did to it.
  const projSees = sentLine && hit ? (stripMarks(sentLine) === stripMarks(hit)) : null;
  rows.push({ id, what, verdict, detail, sent: sentLine, got: hit, projection_agrees: projSees });
  console.log(`${verdict.padEnd(9)} ${id.padEnd(5)} ${what}`);
  if (verdict !== 'PRESERVED') console.log(`          ${detail}`);
}

// ── the intraword-underscore verdict, called out because everything rests on it ──────────
const underscoreCases = ['E1a', 'E1b', 'E3a', 'E3c'];
const underscoreOK = rows.filter(r => underscoreCases.includes(r.id)).every(r => r.verdict === 'PRESERVED');
console.log(`\nINTRAWORD UNDERSCORE: ${underscoreOK ? 'PRESERVED — the projection stands as the verification channel.' : 'NOT PRESERVED — verification cannot run through the rendered description for underscore-bearing content.'}`);

// ── report ───────────────────────────────────────────────────────────────────────────────
const L = ['# Item E — what the ClickUp round trip and the mark-stripped projection preserve', '',
  `Probed ${new Date().toISOString()} on list \`${listId}\`, task \`${created.id}\`, torn down below.`, '',
  `Body sent: ${body.length} chars, ${lines.length} lines, ${CASES.length} labelled cases.`,
  `Returned: ${returned.length} chars, ${retLines.length} lines.`, '',
  `**Intraword underscore: ${underscoreOK ? 'PRESERVED.' : 'NOT PRESERVED.'}**`, '',
  '| case | class | verdict | detail |', '|---|---|---|---|'];
for (const r of rows) L.push(`| \`${r.id}\` | ${r.what} | **${r.verdict}** | ${r.detail.replace(/\|/g, '\\|')} |`);
L.push('', '## Sent vs returned, per case', '');
for (const r of rows) {
  L.push(`### \`${r.id}\` — ${r.what}`, '', '```text', `sent    : ${JSON.stringify(r.sent)}`, `returned: ${JSON.stringify(r.got)}`, '```',
    `projection (\`stripMarks\`) sees them as equal: **${r.projection_agrees === null ? 'n/a' : r.projection_agrees}**`, '');
}
writeFileSync('scratchpad/p59-projection-probe.md', L.join('\n'));
console.log('wrote scratchpad/p59-projection-probe.md');

// ── tear down and read the absence back ──────────────────────────────────────────────────
await deleteTask(created.id);
let code = 200;
try { await getTask(created.id); } catch (e) { code = e.status; }
const after = await listTasks(listId);
const residual = after.tasks.filter(t => t.name === '_vlp_projection_probe__delete_me').length;
const entry = register.probes.at(-1);
entry.state = (code === 404 && residual === 0) ? 'torn_down' : 'unknown';
entry.torn_down_read = { get_status: code, enumeration_residual: residual, at: new Date().toISOString() };
writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');
console.log(`teardown: GET ${code}, ${residual} residual by enumeration -> ${entry.state}; list holds ${after.tasks.length} task(s)`);
if (entry.state !== 'torn_down') stop(6);
