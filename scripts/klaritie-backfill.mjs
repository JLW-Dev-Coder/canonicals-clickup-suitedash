#!/usr/bin/env node
/**
 * klaritie-backfill.mjs
 *
 * Idempotent, resumable REST writer for the nine queued ClickUp operations on the
 * Klaritie Farms matter. The ClickUp MCP connector hit a hard rate limit with a
 * ~21h reset; this script performs the same writes directly against ClickUp REST v2.
 *
 * Run:  node scripts/klaritie-backfill.mjs
 *
 * Exit codes:
 *   0  all operations complete (or already complete)
 *   1  hard failure (non-2xx that is not a rate limit, or a data mismatch)
 *   2  rate limited with a reset further out than the inline-retry window;
 *      manifest is saved, re-run after the printed reset time to resume
 *
 * No customer PII is written by this script. Business names, business addresses,
 * document titles and form numbers only — no account numbers, SSNs, dates of
 * birth, driver's licence numbers or TINs.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = join(HERE, '.klaritie-backfill-state.json');

const API = 'https://api.clickup.com/api/v2';
const TOKEN = process.env.CLICKUP_API_TOKEN;
const TEAM_ID = '8402511';

// ---------------------------------------------------------------------------
// Constants (Step 2). Every id below is supplied by the prompt. Nothing here is
// discovered, guessed, or substituted at runtime.
// ---------------------------------------------------------------------------

const LIST_ID   = '901716085310';
const ENTITY    = '86e2ra645';           // company record, link target for everything
const SUMMONS   = '86e2ufkpv';           // Form 6639 summons parent
const PACKET    = '86e2ujray';           // production packet parent
const COVER     = '86e2ujraf';           // bank cover letter record
const NEXTSTEPS = '86e2um339';           // Next Steps 1-5 email
const KELSO     = '86e2uk2v3';           // Kelso address task

const CONTACTS = { marty: '86e2ra6bj', kathleen: '86e2ra6ct', amber: '86e2um2ny' };

const CF = {
  entityLink:    '108037c2-2bc6-401a-bd68-ed12d92d971f',
  emailRecips:   '2ca0b4f1-7bd3-4f69-b0fd-f47a81329b29',
  typeMirror:    '37ff734f-1a39-49eb-98a8-007e729f63af',
  emailSubject:  'c5a29cf1-74bb-49ae-8f65-b078abbd58e7',
  emailBody:     'a98a003e-236f-4291-8400-423bc1f438fd',
  lastContact:   '4f548bd8-0cd5-4109-a555-b08ec2a62969',
  businessAddr:  '72f7f015-e7c1-4321-adc0-9bb246763765',
};

const TYPE_OPT = {
  email:   '86833eba-7e52-4151-8b35-9d5127c809bb',
  record:  '653eeebc-926f-4cff-ac72-99ca77318eba',
  request: 'e9681bf6-e2cf-4b16-bc7e-33fc64075f86',
  address: '881663e9-e033-41c6-b967-ea8046936845',
};

// Fallback sources for native task type ids, per the decision criteria: read
// custom_item_id off an existing task known to already carry that type.
const TYPE_FALLBACK_TASK = {
  Email:            NEXTSTEPS,
  Record:           PACKET,
  'Client Request': '86e2ujy24',
  Address:          KELSO,
};

// ---------------------------------------------------------------------------
// Epoch conversion. ClickUp wants milliseconds. America/Los_Angeles is UTC-7
// (PDT) on 2026-08-10, 2026-08-13 and 2026-08-14, so local + 7h = UTC.
// Each value is printed next to its human-readable local time at startup.
// ---------------------------------------------------------------------------

const EPOCH = {
  emailSent:   { ms: Date.UTC(2026, 7, 14, 21, 44, 0), local: '2026-08-14 14:44 America/Los_Angeles (UTC-7)' },
  lastContact: { ms: Date.UTC(2026, 7, 14,  7,  0, 0), local: '2026-08-14 00:00 America/Los_Angeles (UTC-7)' },
  aug13:       { ms: Date.UTC(2026, 7, 13,  7,  0, 0), local: '2026-08-13 00:00 America/Los_Angeles (UTC-7)' },
  aug10:       { ms: Date.UTC(2026, 7, 10,  7,  0, 0), local: '2026-08-10 00:00 America/Los_Angeles (UTC-7)' },
};

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

let state = {};
if (existsSync(STATE_PATH)) {
  try {
    state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  } catch (err) {
    fail(`manifest at ${STATE_PATH} is not valid JSON: ${err.message}`);
  }
}

function saveState() {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function isDone(key) {
  return state[key] && state[key].status === 'done';
}

function markDone(key, extra = {}) {
  state[key] = { status: 'done', ...extra };
  saveState();
}

// ---------------------------------------------------------------------------
// Reporting buffers
// ---------------------------------------------------------------------------

const skipped = [];    // already present / already correct
const deviations = []; // completed but not exactly as specified

function log(...args) { console.log(...args); }

function fail(msg) {
  log('');
  log('STOP — ' + msg);
  saveState();
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// REST helper
// ---------------------------------------------------------------------------

/**
 * @param {string} method
 * @param {string} path      path after /api/v2, e.g. '/task/abc123'
 * @param {object} [body]
 * @param {{allowFail?: boolean, _retried?: boolean}} [opts]
 *        allowFail: return {ok:false,status,body} instead of exiting on non-2xx
 */
async function cu(method, path, body, opts = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: TOKEN,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 429) {
    const resetHeader = res.headers.get('x-ratelimit-reset');
    const resetMs = resetHeader ? Number(resetHeader) * 1000 : 0;
    const waitMs = resetMs ? resetMs - Date.now() : 60_000;

    if (!opts._retried && waitMs > 0 && waitMs < 120_000) {
      log(`  [429] rate limited on ${method} ${path}; reset in ${Math.ceil(waitMs / 1000)}s — sleeping then retrying once`);
      await sleep(waitMs + 1000);
      return cu(method, path, body, { ...opts, _retried: true });
    }

    saveState();
    const resetDate = resetMs ? new Date(resetMs) : null;
    log('');
    log('RATE LIMITED — stopping cleanly. Manifest saved; re-run to resume.');
    log(`  request:    ${method} ${path}`);
    log(`  reset at:   ${resetDate ? resetDate.toString() : '(no X-RateLimit-Reset header returned)'}`);
    log(`  reset in:   ${resetMs ? Math.ceil(waitMs / 1000) + 's (~' + (waitMs / 3_600_000).toFixed(1) + 'h)' : 'unknown'}`);
    log(`  completed:  ${Object.keys(state).filter(isDone).length} operation keys marked done`);
    process.exit(2);
  }

  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }

  if (!res.ok) {
    if (opts.allowFail) return { ok: false, status: res.status, body: parsed ?? text };
    log('');
    log('HTTP FAILURE');
    log(`  status: ${res.status}`);
    log(`  path:   ${method} ${path}`);
    log(`  body:   ${text}`);
    saveState();
    process.exit(1);
  }

  return { ok: true, status: res.status, body: parsed };
}

// ---------------------------------------------------------------------------
// Native task type resolution
// ---------------------------------------------------------------------------

const NATIVE = {}; // name -> custom_item_id (number) | null

async function resolveNativeTypes(names) {
  const probe = await cu('GET', `/team/${TEAM_ID}/custom_item`, undefined, { allowFail: true });

  if (probe.ok && probe.body && Array.isArray(probe.body.custom_items)) {
    for (const name of names) {
      const hit = probe.body.custom_items.find(
        (i) => String(i.name || '').trim().toLowerCase() === name.toLowerCase()
      );
      NATIVE[name] = hit ? hit.id : undefined;
    }
    const missing = names.filter((n) => NATIVE[n] === undefined);
    if (missing.length === 0) {
      log(`  resolved from GET /team/${TEAM_ID}/custom_item: ` +
          names.map((n) => `${n}=${NATIVE[n]}`).join(', '));
      return;
    }
    log(`  /custom_item returned no item named: ${missing.join(', ')} — falling back to existing tasks`);
  } else {
    log(`  GET /team/${TEAM_ID}/custom_item unavailable (status ${probe.status}) — falling back to existing tasks`);
  }

  for (const name of names) {
    if (NATIVE[name] !== undefined) continue;
    const src = TYPE_FALLBACK_TASK[name];
    const t = await cu('GET', `/task/${src}`, undefined, { allowFail: true });
    if (t.ok && t.body && t.body.custom_item_id !== undefined && t.body.custom_item_id !== null) {
      NATIVE[name] = t.body.custom_item_id;
      log(`  ${name}=${NATIVE[name]} (read from existing task ${src})`);
    } else {
      NATIVE[name] = null;
      deviations.push(`native task type "${name}" could not be resolved; tasks of this type were created with CF.typeMirror set but no native type`);
      log(`  ${name}=UNRESOLVED — will create with CF.typeMirror only`);
    }
  }
}

// ---------------------------------------------------------------------------
// Custom-field helpers
// ---------------------------------------------------------------------------

/** Did the create response actually persist this field? */
function fieldLanded(task, fieldId) {
  const f = (task.custom_fields || []).find((x) => x.id === fieldId);
  if (!f) return false;
  const v = f.value;
  if (v === undefined || v === null || v === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

/**
 * Create-time custom_fields are honoured inconsistently for relationship
 * fields, so after every create we check the returned task and repair any
 * field that did not persist via POST /task/{id}/field/{field_id}.
 */
async function repairFields(task, specs) {
  for (const spec of specs) {
    if (fieldLanded(task, spec.id)) continue;
    log(`    repairing custom field ${spec.id} via /task/${task.id}/field/${spec.id}`);
    await cu('POST', `/task/${task.id}/field/${spec.id}`, { value: spec.value });
  }
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Exact-name lookup across the list, including closed tasks and subtasks. */
async function findInListByName(name) {
  for (let page = 0; page < 20; page++) {
    const r = await cu(
      'GET',
      `/list/${LIST_ID}/task?page=${page}&include_closed=true&subtasks=true`
    );
    const tasks = (r.body && r.body.tasks) || [];
    const hit = tasks.find((t) => t.name === name);
    if (hit) return hit;
    if (tasks.length === 0 || r.body.last_page) return null;
  }
  return null;
}

/** Existing subtask names -> task object, for a given parent. */
async function subtasksOf(parentId) {
  const r = await cu('GET', `/task/${parentId}?include_subtasks=true`);
  const subs = (r.body && r.body.subtasks) || [];
  const map = new Map();
  for (const s of subs) map.set(s.name, s);
  return map;
}

async function alreadyLinked(taskId, linksTo) {
  const r = await cu('GET', `/task/${taskId}`);
  const links = (r.body && r.body.linked_tasks) || [];
  return links.some((l) => l.task_id === linksTo || l.link_id === linksTo);
}

// ---------------------------------------------------------------------------
// Task creation
// ---------------------------------------------------------------------------

/**
 * Create a task on LIST_ID, idempotently.
 * @returns {Promise<{id: string, created: boolean}>}
 */
async function createTask({ key, name, parent, startMs, dueMs, withTime, typeName, fields, existing }) {
  if (isDone(key)) {
    log(`  [skip] ${key} — manifest says done (${state[key].taskId || 'no id recorded'})`);
    return { id: state[key].taskId, created: false };
  }

  const found = existing instanceof Map ? existing.get(name) : existing;
  if (found) {
    log(`  [present] ${key} — task already exists: ${found.id}`);
    skipped.push(`${name} (already present as ${found.id})`);
    markDone(key, { taskId: found.id, note: 'already-present' });
    return { id: found.id, created: false };
  }

  const body = {
    name,
    start_date: startMs,
    due_date: dueMs,
    start_date_time: withTime,
    due_date_time: withTime,
    custom_fields: fields.map((f) => ({ id: f.id, value: f.value })),
  };
  if (parent) body.parent = parent;
  if (typeName && NATIVE[typeName] !== null && NATIVE[typeName] !== undefined) {
    body.custom_item_id = NATIVE[typeName];
  }

  const r = await cu('POST', `/list/${LIST_ID}/task`, body);
  const task = r.body;
  log(`  [created] ${key} -> ${task.id}  "${name}"`);

  await repairFields(task, fields);

  // custom_item_id occasionally does not stick at create time; repair via PUT.
  if (body.custom_item_id !== undefined && task.custom_item_id !== body.custom_item_id) {
    log(`    repairing native task type -> custom_item_id ${body.custom_item_id}`);
    const fix = await cu('PUT', `/task/${task.id}`, { custom_item_id: body.custom_item_id }, { allowFail: true });
    if (!fix.ok) {
      deviations.push(`${name}: native task type could not be set (HTTP ${fix.status}); CF.typeMirror is set`);
      log(`    native type repair failed (HTTP ${fix.status}) — CF.typeMirror is set, continuing`);
    }
  }

  markDone(key, { taskId: task.id, name });
  return { id: task.id, created: true };
}

// ---------------------------------------------------------------------------
// Operation payloads
// ---------------------------------------------------------------------------

const EMAIL_NAME =
  'Email — 2026-08-14 — Jamie Williams — Re: Bank Files (Records Received; Payment And 2848 Outstanding)';

const RENAMES = [
  ['86e2ujy24', 'Client Request — Bank Signature Cards (Form 6639 rev. 3-2020 Part C) (Captured)'],
  ['86e2ujy2u', 'Client Request — Corporate Resolutions (Form 6639 rev. 3-2020 Part C) (Captured)'],
  ['86e2ujy3t', 'Client Request — Bank Statements (Form 6639 rev. 3-2020 Part C)'],
  ['86e2ujy4u', 'Client Request — Cancelled Checks (Form 6639 rev. 3-2020 Part C)'],
  ['86e2ujy5n', 'Client Request — Loan Applications (Form 6639 rev. 3-2020 Part C) (Not Applicable)'],
];

const RECORDS = [
  'Record — 2026-08-13 — Twin City Bank — Corporate Banking Resolution For Deposit Accounts (p1)',
  'Record — 2026-08-13 — Twin City Bank — Signature Card And Deposit Account Agreement (p3)',
  'Record — 2026-08-13 — Twin City Bank — Superseded Signature Card Marked Copy (p3)',
  'Record — 2026-08-13 — Twin City Bank — Customer Identification Record For Authorized Signers (p4)',
  'Record — 2026-08-13 — Twin City Bank — TIN And Backup Withholding Certification (p4)',
  'Record — 2026-08-13 — Twin City Bank — FinCEN Certification Of Beneficial Owners (p5-p7)',
];

// Only these three were requested on the summons; the other three records were
// produced by the bank unprompted and get no link.
const RECORD_LINKS = [
  [RECORDS[0], '86e2ujy2u'],
  [RECORDS[1], '86e2ujy24'],
  [RECORDS[2], '86e2ujy24'],
];

const NEXT_STEPS = [
  'Client Request — Accounts And Portal Access (Next Steps Item 1) (Outstanding)',
  'Client Request — Diagnostic Payment (Next Steps Item 2) (Outstanding)',
  'Client Request — Power Of Attorney Form 2848 (Next Steps Item 3) (Outstanding)',
  'Client Request — Audit Package (Next Steps Item 4) (Outstanding)',
  'Client Request — Twin City Bank Contact And Document Tracking (Next Steps Item 5) (Captured)',
];

const ADDRESS_NAME =
  'Address — Twin City Bank — 729 Vandercook Way Longview WA 98632 (Related Party)';

const CYCLE_COMMENT = `Cycle — 2026-08-14 — Backfill executed via REST (MCP connector rate-limited)

Form number correction: the summons served on Twin City Bank is Form 6639, not Form 2039. Every record inheriting 2039 from the prior handoff needs the same correction.

Scope finding: the summons covers TWO accounts. The bank's cover letter enumerates six items across both. Only one account has been produced. Cancelled checks and loan applications are listed by the bank under the other account only, while the summons itself requests by entity rather than by account.

Loan applications: the box IS checked on the summons for all three period ranges. The bank answered "NA," which is a nil response to a live demand, not a withdrawal. The summons wording covers loan applications, agreements, related records, and corporate financial statements; the bank's cover letter compressed that to three words. Client to confirm the bank's search reached agreements and corporate financial statements.

Over-production: the bank volunteered a FinCEN beneficial ownership certification that the summons never requested. It carries identifiers the IRS did not demand. Flagged for handling.

Timing: the produced account was opened 2025-03-27 and its beneficial ownership certification signed 2025-04-01. The summons demands statements on it back to 07/2023, a period during which the account did not exist.

Address discrepancy: the summons is captioned to an Industrial Way Bldg 17 address in Longview. State cannabis licence records show no such street number on that street; the Bldg 17 licence at that location belongs to a different entity. Unresolved.`;

const CYCLE_MARKER = 'Cycle — 2026-08-14 — Backfill executed via REST';

// Kelso: certified address from the bank resolution.
const KELSO_CERTIFIED = '2205 Parrott Way Ste C Kelso WA 98626-5522';
const KELSO_ADDRESS_RE =
  /2205\s+Parrott\s+Way(?:\s*,?\s*Ste\.?\s*[A-Za-z0-9]+)?\s*,?\s*Kelso\s*,?\s*WA\s*,?\s*98626(?:-\d{4})?/i;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!TOKEN) fail('CLICKUP_API_TOKEN is not set in the environment.');

  log('Klaritie ClickUp backfill — REST v2 writer');
  log(`  manifest: ${STATE_PATH}`);
  log(`  resuming with ${Object.keys(state).filter(isDone).length} operation keys already done`);
  log('');
  log('Epoch conversions (ClickUp expects milliseconds):');
  for (const [k, v] of Object.entries(EPOCH)) {
    log(`  ${k.padEnd(12)} ${v.ms}   = ${v.local}`);
  }
  log('');

  log('Resolving native task type ids...');
  await resolveNativeTypes(['Email', 'Record', 'Client Request', 'Address']);
  log('');

  // -- Operation A: the sent-email task -------------------------------------
  log('Operation A — sent-email task');
  {
    const key = 'A:email-task';
    const existing = isDone(key) ? null : await findInListByName(EMAIL_NAME);
    await createTask({
      key,
      name: EMAIL_NAME,
      startMs: EPOCH.emailSent.ms,
      dueMs: EPOCH.emailSent.ms,
      withTime: true,
      typeName: 'Email',
      existing,
      fields: [
        { id: CF.entityLink,   value: { add: [ENTITY] } },
        { id: CF.typeMirror,   value: TYPE_OPT.email },
        { id: CF.emailRecips,  value: { add: [CONTACTS.marty, CONTACTS.kathleen, CONTACTS.amber] } },
        { id: CF.emailSubject, value: 'Re: Bank Files' },
      ],
    });
    log('  CF.emailBody intentionally left unset — body is supplied separately.');
  }
  log('');

  // -- Operation B: Outreach Date Last Contact -------------------------------
  log('Operation B — stamp Outreach Date Last Contact on three contacts');
  for (const [who, taskId] of Object.entries(CONTACTS)) {
    const key = `B:last-contact:${who}`;
    if (isDone(key)) { log(`  [skip] ${key} — manifest says done`); continue; }
    await cu('POST', `/task/${taskId}/field/${CF.lastContact}`, { value: EPOCH.lastContact.ms });
    log(`  [set] ${who} (${taskId}) -> ${EPOCH.lastContact.ms}`);
    markDone(key, { taskId, value: EPOCH.lastContact.ms });
  }
  log('');

  // -- Operation C: rename the five Client Requests --------------------------
  log('Operation C — rename five Client Requests (no status changes)');
  for (const [id, newName] of RENAMES) {
    const key = `C:rename:${id}`;
    if (isDone(key)) { log(`  [skip] ${key} — manifest says done`); continue; }

    const cur = await cu('GET', `/task/${id}`, undefined, { allowFail: true });
    if (!cur.ok) fail(`task ${id} could not be read (HTTP ${cur.status}) — data mismatch, not renaming.`);

    if (cur.body.name === newName) {
      log(`  [present] ${id} — name already matches`);
      skipped.push(`${id} rename (name already matches)`);
      markDone(key, { taskId: id, note: 'already-matches' });
      continue;
    }

    log(`  [rename] ${id}`);
    log(`      from: ${cur.body.name}`);
    log(`        to: ${newName}`);
    await cu('PUT', `/task/${id}`, { name: newName });
    markDone(key, { taskId: id, previousName: cur.body.name, name: newName });
  }
  log('');

  // -- Operation D: six Record sub-tasks under PACKET ------------------------
  log('Operation D — six Record sub-tasks under the production packet');
  const recordIds = {};
  {
    const existing = await subtasksOf(PACKET);
    log(`  packet ${PACKET} currently has ${existing.size} sub-task(s)`);
    for (const name of RECORDS) {
      const key = `D:record:${name}`;
      const { id } = await createTask({
        key,
        name,
        parent: PACKET,
        startMs: EPOCH.aug13.ms,
        dueMs: EPOCH.aug13.ms,
        withTime: false,
        typeName: 'Record',
        existing,
        fields: [
          { id: CF.entityLink, value: { add: [ENTITY] } },
          { id: CF.typeMirror, value: TYPE_OPT.record },
        ],
      });
      recordIds[name] = id;
    }
  }
  log('');

  // -- Operation E: three native task links ----------------------------------
  log('Operation E — three native task links (the other three records get none)');
  for (const [recordName, linksTo] of RECORD_LINKS) {
    const key = `E:link:${recordName}`;
    if (isDone(key)) { log(`  [skip] ${key} — manifest says done`); continue; }

    const src = recordIds[recordName];
    if (!src) fail(`no task id recorded for record "${recordName}" — cannot link.`);

    if (await alreadyLinked(src, linksTo)) {
      log(`  [present] ${src} -> ${linksTo} already linked`);
      skipped.push(`link ${src} -> ${linksTo} (already linked)`);
      markDone(key, { from: src, to: linksTo, note: 'already-linked' });
      continue;
    }

    await cu('POST', `/task/${src}/link/${linksTo}`);
    log(`  [linked] ${src} -> ${linksTo}   (${recordName})`);
    markDone(key, { from: src, to: linksTo });
  }
  log('');

  // -- Operation F: five Client Request sub-tasks under NEXTSTEPS ------------
  log('Operation F — five Client Request sub-tasks under the Next Steps email');
  const nextStepIds = {};
  {
    const existing = await subtasksOf(NEXTSTEPS);
    log(`  ${NEXTSTEPS} currently has ${existing.size} sub-task(s)`);
    for (const name of NEXT_STEPS) {
      const key = `F:nextstep:${name}`;
      const { id } = await createTask({
        key,
        name,
        parent: NEXTSTEPS,
        startMs: EPOCH.aug10.ms,
        dueMs: EPOCH.aug10.ms,
        withTime: false,
        typeName: 'Client Request',
        existing,
        fields: [
          { id: CF.entityLink, value: { add: [ENTITY] } },
          { id: CF.typeMirror, value: TYPE_OPT.request },
        ],
      });
      nextStepIds[name] = id;
    }

    const key = 'F:link:item5-cover';
    const item5 = nextStepIds[NEXT_STEPS[4]];
    if (isDone(key)) {
      log(`  [skip] ${key} — manifest says done`);
    } else if (!item5) {
      fail('no task id recorded for Next Steps Item 5 — cannot link to the cover letter.');
    } else if (await alreadyLinked(item5, COVER)) {
      log(`  [present] ${item5} -> ${COVER} already linked`);
      skipped.push(`link ${item5} -> ${COVER} (already linked)`);
      markDone(key, { from: item5, to: COVER, note: 'already-linked' });
    } else {
      await cu('POST', `/task/${item5}/link/${COVER}`);
      log(`  [linked] ${item5} -> ${COVER}   (Item 5 -> bank cover letter)`);
      markDone(key, { from: item5, to: COVER });
    }
  }
  log('');

  // -- Operation G: cycle comment on SUMMONS ---------------------------------
  log('Operation G — cycle comment on the summons');
  {
    const key = 'G:cycle-comment';
    if (isDone(key)) {
      log(`  [skip] ${key} — manifest says done`);
    } else {
      const existing = await cu('GET', `/task/${SUMMONS}/comment`);
      const dupe = ((existing.body && existing.body.comments) || []).find((c) =>
        String(c.comment_text || '').includes(CYCLE_MARKER)
      );
      if (dupe) {
        log(`  [present] cycle comment already on ${SUMMONS} (comment ${dupe.id})`);
        skipped.push(`cycle comment on ${SUMMONS} (already present as comment ${dupe.id})`);
        markDone(key, { commentId: dupe.id, note: 'already-present' });
      } else {
        const r = await cu('POST', `/task/${SUMMONS}/comment`, {
          comment_text: CYCLE_COMMENT,
          notify_all: false,
        });
        log(`  [commented] ${SUMMONS} -> comment ${r.body && r.body.id}`);
        markDone(key, { commentId: r.body && r.body.id });
      }
    }
  }
  log('');

  // -- Operation H: Twin City Bank address task ------------------------------
  log('Operation H — Twin City Bank address task');
  {
    const key = 'H:address-task';
    const existing = isDone(key) ? null : await findInListByName(ADDRESS_NAME);
    const { id, created } = await createTask({
      key,
      name: ADDRESS_NAME,
      startMs: EPOCH.aug13.ms,
      dueMs: EPOCH.aug13.ms,
      withTime: false,
      typeName: 'Address',
      existing,
      fields: [
        { id: CF.entityLink, value: { add: [ENTITY] } },
        { id: CF.typeMirror, value: TYPE_OPT.address },
      ],
    });

    // The location pin is set separately so a rejected shape cannot take the
    // whole task creation down with it.
    const pinKey = 'H:address-pin';
    if (!isDone(pinKey) && id) {
      const pin = await cu('POST', `/task/${id}/field/${CF.businessAddr}`, {
        value: {
          location: { lat: 46.1382, lng: -122.9382 },
          formatted_address: '729 Vandercook Way, Longview, WA 98632',
        },
      }, { allowFail: true });

      if (pin.ok) {
        log(`  [pinned] business address set on ${id}`);
        markDone(pinKey, { taskId: id });
      } else {
        log(`  [pin-failed] location field rejected (HTTP ${pin.status}) — continuing`);
        log(`      response: ${typeof pin.body === 'string' ? pin.body : JSON.stringify(pin.body)}`);
        deviations.push(`${ADDRESS_NAME}: locationPinFailed (HTTP ${pin.status}) — task created without the map pin`);
        markDone(pinKey, { taskId: id, locationPinFailed: true, status: pin.status });
      }
    } else if (isDone(pinKey)) {
      log(`  [skip] ${pinKey} — manifest says done`);
    }
    if (!created && id) log(`  (address task id ${id})`);
  }
  log('');

  // -- Operation I: enrich the Kelso address task ----------------------------
  log('Operation I — enrich the Kelso address task');
  {
    const key = 'I:kelso-rename';
    if (isDone(key)) {
      log(`  [skip] ${key} — manifest says done`);
      if (state[key].previousName) log(`      name before rename was: ${state[key].previousName}`);
    } else {
      const cur = await cu('GET', `/task/${KELSO}`, undefined, { allowFail: true });
      if (!cur.ok) fail(`Kelso task ${KELSO} could not be read (HTTP ${cur.status}) — data mismatch.`);

      const currentName = cur.body.name;
      log(`  current name of ${KELSO}:`);
      log(`      ${currentName}`);

      if (currentName.includes('Ste C') && currentName.includes('98626-5522')) {
        log('  [present] name already carries Ste C and ZIP+4 — skipping');
        skipped.push(`${KELSO} rename (already carries Ste C and 98626-5522)`);
        markDone(key, { taskId: KELSO, previousName: currentName, note: 'already-enriched' });
      } else {
        const match = currentName.match(KELSO_ADDRESS_RE);
        if (!match) {
          fail(
            `Kelso task ${KELSO} name does not contain a recognisable Parrott Way / Kelso / WA 98626 address portion, ` +
            `so the address cannot be replaced without guessing at the surrounding structure.\n` +
            `        current name: ${currentName}\n` +
            `        expected to match: ${KELSO_ADDRESS_RE}\n` +
            `        Reporting rather than rewriting. Nothing was changed.`
          );
        }
        const newName = currentName.replace(KELSO_ADDRESS_RE, KELSO_CERTIFIED);
        log(`  [rename] ${KELSO}`);
        log(`      from: ${currentName}`);
        log(`        to: ${newName}`);
        await cu('PUT', `/task/${KELSO}`, { name: newName });
        markDone(key, { taskId: KELSO, previousName: currentName, name: newName });
      }
    }
  }
  log('');

  // -- Summary ---------------------------------------------------------------
  saveState();
  log('='.repeat(72));
  log('DONE — all operations complete.');
  log(`  operation keys done: ${Object.keys(state).filter(isDone).length}`);
  log('');
  log(`  skipped as already-present (${skipped.length}):`);
  if (skipped.length === 0) log('    (none)');
  for (const s of skipped) log(`    - ${s}`);
  log('');
  log(`  deviations (${deviations.length}):`);
  if (deviations.length === 0) log('    (none)');
  for (const d of deviations) log(`    - ${d}`);
  log('');
  log('  Note: no task was closed, completed, or deleted by this run.');
  log('  Note: CF.emailBody was intentionally left unset on the Operation A task.');
  log('='.repeat(72));
}

main().catch((err) => {
  saveState();
  log('');
  log('UNCAUGHT FAILURE — manifest saved, re-run to resume.');
  log(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
