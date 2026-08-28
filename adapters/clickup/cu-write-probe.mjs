// cu-write-probe.mjs — establishes, by measurement, whether this token can CREATE and DELETE
// a task on the target list. §1 of prompt 59 requires this before anything is decided, and
// [R-01] forbids taking the prompt's word for it.
//
// [R-23]/[R-24] SHAPE: the probe is registered, it is torn down, and its ABSENCE is read back
// from the target rather than inferred from the DELETE returning 200. Nothing is concluded
// from a request; everything is concluded from a read.
//
// [R-19] GENERATOR DECLARATION: this file writes adapters/clickup/write-probe.json and is the
// only tool that may. It is not itself generated.
//
// WHY IT ALSO PROBES A BODY SIZE
// ------------------------------
// The largest derived description on this population is ~50 KB, because one property carries
// 318 options and every option's label AND value is part of the definition. Whether ClickUp
// stores that or silently truncates it is a fact about ClickUp, and 959 tasks is the wrong
// place to discover it. --body <file> sends a real body through the same create/read-back/
// delete cycle and compares what comes back against what went out.
//
// usage: node adapters/clickup/cu-write-probe.mjs <listId> [--body <file>]
import { cu, listTasks, getTask, createTask, deleteTask, spaceTags, stop } from './cu-lib.mjs';
import { stripMarks, stripLine } from './projection.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const listId = process.argv[2];
if (!listId) { console.error('usage: node adapters/clickup/cu-write-probe.mjs <listId> [--body <file>]'); stop(2); }
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const bodyFile = arg('--body');
const wantStatus = arg('--status');
const wantTag = arg('--tag');

const REG = 'adapters/clickup/write-probe.json';
const register = existsSync(REG) ? JSON.parse(readFileSync(REG, 'utf8')) : { _what: 'Every write probe ever created on a ClickUp list by this tool, and its torn-down verdict re-read from ClickUp. A probe with state "live" or "unknown" is a STOP for the next run.', probes: [] };

// ── --resolve: settle any probe left unsettled, FROM CLICKUP ─────────────────────────────
// A run that stops mid-probe leaves a row in state "live" or "unknown", and the next run then
// refuses — which is the register doing its job. Settling it must be a READ against the target,
// never an edit of this file by hand: "I deleted it" is a claim about a request, and [R-23]
// wants the state read back. This mode does that and nothing else.
if (process.argv.includes('--resolve')) {
  const unsettled = register.probes.filter(p => p.state !== 'torn_down');
  console.log(`${unsettled.length} probe(s) unsettled.`);
  for (const p of unsettled) {
    let code = 200;
    try { await cu(`/task/${p.task_id}`); } catch (e) { code = e.status; }
    const list = await listTasks(p.list_id);
    const residual = list.tasks.filter(t => t.name === p.name).length;
    p.state = (code === 404 && residual === 0) ? 'torn_down' : 'live';
    p.torn_down_read = { get_status: code, enumeration_residual: residual, at: new Date().toISOString(), settled_by: '--resolve' };
    console.log(`  ${p.task_id}: GET ${code}, ${residual} residual by enumeration -> ${p.state}`);
  }
  writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');
  const stillLive = register.probes.filter(p => p.state !== 'torn_down');
  console.log(stillLive.length ? `STOP — ${stillLive.length} probe(s) still readable on ClickUp.` : 'every probe settled torn_down, confirmed by read.');
  stop(stillLive.length ? 9 : 0);
}

const stale = register.probes.filter(p => p.state !== 'torn_down');
if (stale.length) { console.error(`REFUSING: ${stale.length} probe(s) not torn down: ${stale.map(p => p.task_id).join(', ')}`); console.error('Settle them from ClickUp first: node adapters/clickup/cu-write-probe.mjs <listId> --resolve'); stop(3); }

// ── 0. the list, read back ───────────────────────────────────────────────────────────────
const list = await cu(`/list/${listId}`);
console.log(`list ${list.id} "${list.name}" in space ${list.space.id}/${list.space.name}`);
console.log(`  permission_level: ${list.permission_level}   archived: ${list.archived}   task_count: ${list.task_count}`);
const statuses = list.statuses.map(s => s.status);
console.log(`  statuses: ${statuses.join(', ')}`);

const before = await listTasks(listId);
console.log(`  enumerated before probe: ${before.tasks.length} task(s) over ${before.pages} page(s)`);

// ── 1. create ────────────────────────────────────────────────────────────────────────────
// The name is fixed and self-describing so that a probe surviving a crash is identifiable in
// the ClickUp UI by a person who has never read this file.
const NAME = '_vlp_write_probe__delete_me';
const DEFAULT_BODY = 'Synthetic write probe created by adapters/clickup/cu-write-probe.mjs to establish task-create permission. It carries no client data and is deleted by the same run that made it. If you are reading this in ClickUp, that run did not finish.';
const body = bodyFile ? readFileSync(bodyFile, 'utf8') : DEFAULT_BODY;
if (bodyFile) console.log(`  body from ${bodyFile}: ${body.length} chars`);
// --status / --tag exist because the WRITE depends on both being honoured on create and
// neither had been measured. The probe's first create landed in "hold" — this list's default —
// which is what a silently-ignored `status` would also look like, and a tag that does not
// exist in the space yet is the case that decides whether the run has to create 9 space tags
// up front or can let the create do it. Both are read back from the task, not from the POST.
let created;
try {
  const b = { name: NAME, markdown_description: body };
  if (wantStatus) b.status = wantStatus;
  if (wantTag) b.tags = [wantTag];
  created = await createTask(listId, b);
} catch (e) {
  console.error(`\nSTOP — CREATE REFUSED. ClickUp answered ${e.status}.`);
  console.error(e.detail ?? e.message);
  console.error('\nThis is a credential decision for JLW, not something to work around.');
  stop(4);
}
console.log(`\ncreate -> task ${created.id}  url ${created.url}`);

// ── 2. read the created state BACK from ClickUp, never from the create response ───────────
const readBack = await getTask(created.id);
const presenceOK = readBack.id === created.id && readBack.name === NAME && readBack.list.id === String(listId);
console.log(`read back -> id=${readBack.id} name="${readBack.name}" list=${readBack.list.id} status=${readBack.status.status}`);
console.log(`presence confirmed by read: ${presenceOK ? 'YES' : 'NO'}`);
if (!presenceOK) { console.error('STOP — the task read back is not the task that was created.'); stop(5); }

// ── 2b. REGISTER BEFORE ANYTHING ELSE CAN STOP ───────────────────────────────────────────
// THE DEFECT THIS ORDERING FIXES, COMMITTED BY THIS FILE. [R-12] says to expect the fix to
// reproduce the class it fixes and to say where I looked. The first draft ran the body check
// BEFORE this push, so the one run that actually stopped created a task, deleted it, and never
// wrote a register row — the probe existed on the target and this tree held no record that it
// ever had. It was torn down and its absence confirmed by hand afterwards (task 86e30hb7w,
// retro-registered below), which is precisely the "registered retrospectively" state [R-24]
// exists to make rare. Registration now happens the moment the create returns, so every path
// out of this file from here on is a path that leaves a row behind.
register.probes.push({ task_id: created.id, name: NAME, list_id: String(listId), url: created.url, created_at_ms: Number(created.date_created), state: 'live', torn_down_read: null });
writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');

// ── 2c. what came back, against what went out ────────────────────────────────────────────
// MEASURED (see the header of adapters/clickup/render-description.mjs): ClickUp stores the
// markdown and returns `description` as the PLAIN-TEXT rendering, with `#`, `**`, backticks,
// list markers and fences removed and everything between them intact. So the BYTES cannot
// match and a byte comparison would report a defect on every run. The comparison is made in
// the mark-stripped projection stripMarks() defines, imported from the renderer so the probe
// and --verify cannot drift into disagreeing about what survival means.
//
// A truncation loses the TAIL, so the sample is spread across the whole body and includes 99%.
// ── status and tags, read back rather than assumed ───────────────────────────────────────
let statusFault = false, tagFault = false;
if (wantStatus) {
  statusFault = readBack.status.status !== wantStatus;
  console.log(`status: asked for "${wantStatus}", task reads back "${readBack.status.status}" -> ${statusFault ? 'NOT HONOURED' : 'honoured'}`);
}
if (wantTag) {
  const got = (readBack.tags ?? []).map(t => t.name);
  tagFault = !got.includes(wantTag);
  console.log(`tags: asked for "${wantTag}", task reads back [${got.join(', ') || 'none'}] -> ${tagFault ? 'NOT HONOURED' : 'honoured'}`);
  const spaceNow = (await spaceTags(list.space.id)).tags.map(t => t.name);
  console.log(`  space ${list.space.id} now holds ${spaceNow.length} tag(s); "${wantTag}" present: ${spaceNow.includes(wantTag)}`);
  console.log(`  -> a create ${spaceNow.includes(wantTag) ? 'DOES' : 'does NOT'} auto-create a space tag that did not exist.`);
}

const returned = readBack.description ?? '';
console.log(`sent ${body.length} chars, read back ${returned.length} chars — markdown syntax is stripped on read, so the lengths are not expected to match`);
if (bodyFile) {
  const flat = stripMarks(returned);
  const lines = body.split('\n').filter(l => stripMarks(l).length > 24);
  const at = [0, 0.25, 0.5, 0.75, 0.9, 0.99, 1];
  const probes = at.map(f => ({ f, line: lines[Math.min(lines.length - 1, Math.floor(f * (lines.length - 1)))] }));
  const lost = probes.filter(p => !flat.includes(stripLine(p.line).slice(0, 48)));
  console.log(`content survival sampled at ${at.map(f => (f * 100) + '%').join('/')}: ${probes.length - lost.length}/${probes.length} survived`);
  if (lost.length) {
    console.error('STOP — content did not survive the round trip. ClickUp is truncating or rewriting the body.');
    for (const p of lost) console.error(`  lost at ${(p.f * 100).toFixed(0)}%: ${stripLine(p.line).slice(0, 110)}`);
  } else {
    console.log(`ESTABLISHED: a ${body.length}-char body survives the round trip with only markdown syntax removed. No truncation at this size.`);
  }
  if (lost.length) { await deleteTask(created.id); const e = register.probes.at(-1); e.state = 'unknown'; writeFileSync(REG, JSON.stringify(register, null, 1) + '\n'); stop(8); }
}

// ── 2d. THE UPDATE PATH, measured on the same registered probe ───────────────────────────
// The mirror is idempotent by UPDATING the task that already carries a property's name, so a
// re-run goes through PUT /task/{id} rather than POST. Whether that endpoint honours
// `markdown_description` and `status` is a different question from whether the create does,
// and it is not one to first ask on a re-run over 959 live tasks. Measured here, on the probe
// that is already registered, and read back from the task.
if (wantStatus || wantTag) {
  const NEW_BODY = 'UPDATED BY THE PROBE. If a PUT honours markdown_description this sentence replaced the create body.';
  const NEW_STATUS = statuses.find(s => s !== readBack.status.status && ['active', 'archive'].includes(s)) ?? statuses.find(s => s !== readBack.status.status);
  await cu(`/task/${created.id}`, { method: 'PUT', body: { markdown_description: NEW_BODY, status: NEW_STATUS } });
  const after = await getTask(created.id);
  const bodyTook = stripMarks(after.description ?? '').includes(stripMarks(NEW_BODY));
  const statusTook = after.status.status === NEW_STATUS;
  console.log(`PUT: markdown_description ${bodyTook ? 'honoured' : 'NOT HONOURED'}; status "${readBack.status.status}" -> asked "${NEW_STATUS}", reads "${after.status.status}" ${statusTook ? 'honoured' : 'NOT HONOURED'}`);
  if (!bodyTook || !statusTook) {
    console.error('STOP — the update path does not do what the mirror\'s idempotent re-run relies on.');
    await deleteTask(created.id);
    const e = register.probes.at(-1); e.state = 'unknown'; writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');
    stop(10);
  }
}

// ── 3. tear down ─────────────────────────────────────────────────────────────────────────
await deleteTask(created.id);
console.log(`delete -> issued for ${created.id}`);

// ── 4. read the ABSENCE back  [R-23] ─────────────────────────────────────────────────────
let absent = false, code = null;
try { await getTask(created.id); }
catch (e) { code = e.status; absent = e.status === 404; }
console.log(`absence re-read -> ${absent ? `404 confirmed` : `STILL READABLE (status ${code ?? 200})`}`);

const after = await listTasks(listId);
console.log(`enumerated after teardown: ${after.tasks.length} task(s) over ${after.pages} page(s)`);
const residual = after.tasks.filter(t => t.name === NAME);

const entry = register.probes.at(-1);
entry.state = absent && residual.length === 0 ? 'torn_down' : 'unknown';
entry.torn_down_read = { get_status: code ?? 200, enumeration_residual: residual.length, at: new Date(Date.now()).toISOString() };
writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');

if (entry.state !== 'torn_down') { console.error('\nSTOP — probe not provably absent.'); stop(6); }
if (after.tasks.length !== before.tasks.length) { console.error(`\nSTOP — list count moved ${before.tasks.length} -> ${after.tasks.length} across a probe that was torn down.`); stop(7); }

console.log(`\nESTABLISHED: this token can create and delete a task on list ${listId}.`);
console.log(`ESTABLISHED: the list holds ${after.tasks.length} task(s), read by full enumeration, not by task_count.`);
console.log(`statuses this list offers that the mirror needs: active=${statuses.includes('active')} archive=${statuses.includes('archive')}`);
