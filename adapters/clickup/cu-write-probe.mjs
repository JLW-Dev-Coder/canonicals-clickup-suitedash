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
// ONE SIZE IS NOT A CEILING. --body measured that ONE body survived; it did not measure where
// the limit is, and the largest record in the mirror export is larger than the largest body
// --body ever sent. --ceiling <sizes> sweeps sizes through the same cycle and records a verdict
// per size — survived, truncated with the surviving length, or rejected with the status — in
// `body_measurements` in the register. See its own header block below.
//
// usage: node adapters/clickup/cu-write-probe.mjs <listId> [--body <file>]
//        node adapters/clickup/cu-write-probe.mjs <listId> --ceiling 52500,60000,80000
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

// ── --ceiling: WHERE THE BODY LIMIT ACTUALLY IS ──────────────────────────────────────────
// A body of 50,634 chars was measured to survive. That is a MEASUREMENT OF ONE SIZE, and the
// population it has to cover is not one size: the largest record in the mirror export
// serialises to 52,251 chars, 1,617 chars OUTSIDE anything this repo has proved. A gap like
// that is otherwise discovered by B2, mid-run, on one task, after hours of work — the wrong
// place to discover it, for the same reason 959 tasks was the wrong place to discover whether
// ClickUp truncates at all.
//
// This mode sends bodies at several sizes through the SAME create / read-back / delete /
// read-absence cycle the single probe uses, and records a verdict per size in the register.
//
// A SILENT TRUNCATION AND A REJECTION ARE DIFFERENT FINDINGS, and only one of them is safe.
// A 400 is ClickUp telling you where the limit is. A 200 that stores 60% of what was sent is
// ClickUp NOT telling you, and it corrupts a mirror while every line of the request log reads
// OK. They are recorded as distinct verdicts, and a truncation additionally carries the
// surviving length, BINARY-SEARCHED against the read-back rather than read off the returned
// character count — the returned count is the plain-text rendering and is always smaller than
// what was sent, truncation or no, so it cannot answer this question.
//
// SYNTHETIC ONLY. The body is generated here in the same markdown SHAPE a rendered export
// record has — heading, portal-definition block, a long `[n]` label/value option list, a
// derived block, a divergence block — with every label and value invented. No portal value and
// no client datum is sent to ClickUp by this mode.
//
// usage: node adapters/clickup/cu-write-probe.mjs <listId> --ceiling 52500,60000,80000
if (process.argv.includes('--ceiling')) {
  const sizes = (arg('--ceiling') ?? '').split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);
  if (!sizes.length) { console.error('usage: node adapters/clickup/cu-write-probe.mjs <listId> --ceiling <comma-separated char counts>'); stop(2); }

  const CNAME = '_vlp_body_ceiling_probe__delete_me';
  const optLine = (i, extra = 0) =>
    `- [${i}] label ${JSON.stringify(`Synthetic option ${String(i).padStart(4, '0')} — filler${'.'.repeat(extra)}`)} · value \`synthetic_option_${String(i).padStart(4, '0')}\` · displayOrder \`${i - 1}\``;

  // Builds a body of EXACTLY `target` chars. Exactly, because "about 60k" measured against a
  // limit that might be 60,000 does not say which side of it the measurement was on.
  function syntheticBody(target) {
    const head = [
      '#### 1. `synthetic_ceiling_probe_property`', '',
      '**Portal definition — synthetic. Nothing below came from a portal, a form, or a person.**', '',
      '- internal name: `synthetic_ceiling_probe_property`',
      '- label: "Synthetic ceiling probe"',
      '- type / fieldType: `enumeration` / `select`',
      '- group: `synthetic_probe_group`',
      '- createdAt: 2026-01-01T00:00:00.000Z',
      '- archived: `false` · calculated: `false` · hasUniqueValue: `false` · hidden: `false` · formField: `true`',
      '- description_present: `true`',
      '- description: "Synthetic body written by adapters/clickup/cu-write-probe.mjs --ceiling to measure where the ClickUp description limit is."',
      '',
      '**Options — IN ORDER. The order is part of the definition, and the index is written as literal text so it survives the round trip.**', '',
    ].join('\n');
    const tail = [
      '',
      '**Derived — nothing. This is a probe body, not a property, so no file in this repo is named as a source.**', '',
      '- created_by_form: *not derivable — a probe body is created by a probe.*',
      '- bound_by_forms: *not derivable — no form binds a probe body.*',
      '- prefix_tag: `synthetic`',
      '',
      '**Divergence.**', '',
      'None. This body is synthetic and diverges from nothing.',
      '',
      '---',
      `END OF SYNTHETIC CEILING PROBE BODY AT ${target} CHARS. If this sentence is absent from the read-back, the tail did not survive.`,
    ].join('\n');
    // The line length is ACCUMULATED, not computed from optLine(1). The first draft did the
    // arithmetic off one sample line and was wrong by 1,918 chars at 52,500, because `[${i}]`
    // grows a digit at 10, at 100 and at 1000 while the padded label and value do not. The
    // stop(12) guard below caught it before a single task was created, which is what it is for.
    const fixed = head.length + tail.length + 1;      // + the '\n' joining the option block to the tail
    const opts = [];
    let len = fixed;
    for (let i = 1; ; i++) {
      const line = optLine(i);
      if (len + line.length + 1 > target) break;
      opts.push(line);
      len += line.length + 1;
    }
    if (opts.length < 2) { console.error(`STOP — ${target} is too small to build this shape.`); stop(11); }
    // The shortfall is absorbed by the LAST option line, which pads with dots: JSON.stringify
    // escapes none of them, so the line grows by exactly the shortfall.
    opts[opts.length - 1] = optLine(opts.length, target - len);
    const body = head + '\n' + opts.join('\n') + '\n' + tail;
    if (body.length !== target) { console.error(`STOP — built ${body.length} chars, wanted ${target}. A wrong size measures nothing.`); stop(12); }
    return body;
  }

  // The sampler the 50,634 measurement used, unchanged: lines long enough to be distinctive,
  // taken at 0/25/50/75/90/99/100%, so a lost TAIL cannot hide behind a surviving head.
  const AT = [0, 0.25, 0.5, 0.75, 0.9, 0.99, 1];
  const sampleSurvival = (body, flat) => {
    const ls = body.split('\n').filter(l => stripMarks(l).length > 24);
    return AT.map(f => {
      const line = ls[Math.min(ls.length - 1, Math.floor(f * (ls.length - 1)))];
      const token = stripLine(line).slice(0, 48);
      return { at: f, token, survived: flat.includes(token) };
    });
  };

  // The exact surviving length. A truncation loses the TAIL, so "does the mark-stripped tail of
  // body.slice(0, k) still appear in what came back" is monotone in k, and binary-searchable.
  // The window is 200 chars so the probe token is always long enough to be distinctive.
  const survivingLength = (body, flat) => {
    const ok = (k) => {
      const t = stripMarks(body.slice(Math.max(0, k - 200), k)).slice(-48);
      return t.length >= 24 && flat.includes(t);
    };
    if (ok(body.length)) return body.length;
    let lo = 0, hi = body.length;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (ok(mid)) lo = mid; else hi = mid - 1; }
    return lo;
  };

  register.body_measurements = register.body_measurements ?? [];
  const results = [];
  for (const size of sizes) {
    const body = syntheticBody(size);
    console.log(`\n=== ${size} chars ===`);
    console.log(`  body built: ${body.length} chars over ${body.split('\n').length} lines`);

    let made = null, rejected = null;
    try { made = await createTask(listId, { name: CNAME, markdown_description: body }); }
    catch (e) { rejected = { status: e.status ?? null, detail: String(e.detail ?? e.message).slice(0, 600) }; }

    if (rejected) {
      // Nothing was created, so there is no probe to register and nothing to tear down. The
      // MEASUREMENT is still recorded: a refusal is a finding, not a failed run.
      console.log(`  create -> REJECTED. ClickUp answered ${rejected.status}.`);
      console.log(`  ${rejected.detail}`);
      const m = { sent_chars: size, verdict: 'rejected', http_status: rejected.status, detail: rejected.detail, task_id: null, surviving_chars: 0, returned_chars: 0, samples: null, at: new Date().toISOString() };
      register.body_measurements.push(m);
      writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');
      results.push(m);
      continue;
    }

    // [R-24]: registered the instant the create returns, before any check below can stop the
    // run. Every path out of here from this line on is a path that leaves a row behind.
    register.probes.push({ task_id: made.id, name: CNAME, list_id: String(listId), url: made.url, created_at_ms: Number(made.date_created), state: 'live', torn_down_read: null, purpose: `body-ceiling measurement at ${size} chars` });
    writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');
    console.log(`  create -> task ${made.id}  ${made.url}`);

    const rb = await getTask(made.id);
    const returned = rb.description ?? '';
    const flat = stripMarks(returned);
    const samples = sampleSurvival(body, flat);
    const lost = samples.filter(s => !s.survived);
    const surviving = lost.length ? survivingLength(body, flat) : size;
    const verdict = lost.length ? 'truncated' : 'survived';

    console.log(`  read back -> description ${returned.length} chars (the plain-text rendering; smaller than sent by design)`);
    console.log(`  survival sampled at ${AT.map(f => f * 100 + '%').join('/')}: ${samples.length - lost.length}/${samples.length} survived`);
    for (const s of lost) console.log(`    LOST at ${(s.at * 100).toFixed(0)}%: ${s.token}`);
    console.log(`  VERDICT: ${verdict}${lost.length ? ` — ${surviving} of ${size} sent chars survived` : ''}`);

    // ── teardown by DELETE, and the absence READ BACK rather than inferred  [R-23] ───────
    await deleteTask(made.id);
    let code = null, absent = false;
    try { await getTask(made.id); } catch (e) { code = e.status; absent = e.status === 404; }
    const list2 = await listTasks(listId);
    const residual = list2.tasks.filter(t => t.name === CNAME).length;
    const row = register.probes.at(-1);
    row.state = absent && residual === 0 ? 'torn_down' : 'unknown';
    row.torn_down_read = { get_status: code ?? 200, enumeration_residual: residual, at: new Date().toISOString() };
    console.log(`  teardown -> GET ${code ?? 200}, ${residual} residual by enumeration -> ${row.state}`);

    const m = { sent_chars: size, verdict, http_status: 200, detail: null, task_id: made.id, surviving_chars: surviving, returned_chars: returned.length, samples: samples.map(s => ({ at: s.at, survived: s.survived })), at: new Date().toISOString() };
    register.body_measurements.push(m);
    writeFileSync(REG, JSON.stringify(register, null, 1) + '\n');
    results.push(m);
    if (row.state !== 'torn_down') { console.error('\nSTOP — a ceiling probe is not provably absent.'); stop(6); }
  }

  const finalList = await listTasks(listId);
  console.log(`\nlist ${listId} after every ceiling probe: ${finalList.tasks.length} task(s), by full enumeration over ${finalList.pages} page(s)`);
  console.log('\nMEASURED:');
  for (const m of results) console.log(`  ${String(m.sent_chars).padStart(6)} chars -> ${m.verdict}${m.verdict === 'truncated' ? ` (${m.surviving_chars} survived)` : ''}${m.verdict === 'rejected' ? ` (HTTP ${m.http_status})` : ''}`);
  if (finalList.tasks.length !== before.tasks.length) { console.error(`\nSTOP — list count moved ${before.tasks.length} -> ${finalList.tasks.length} across probes that were torn down.`); stop(7); }
  stop(0);
}

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
