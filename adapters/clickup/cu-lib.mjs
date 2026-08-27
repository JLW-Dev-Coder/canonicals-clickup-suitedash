// Shared ClickUp REST helpers for the property-mirror tooling.
//
// WHY NODE AND NOT Invoke-RestMethod  [R-27]
// -----------------------------------------
// Same split as adapters/hubspot/hs-lib.mjs. PowerShell 5.1's Invoke-RestMethod encodes a
// string body as ISO-8859-1 — one em-dash cost 27 permanent HubSpot property creations — and
// the descriptions this tool writes are full of em-dashes, quoted verbatim out of the portal
// and out of the crosswalk prose. PowerShell reads this list; node writes it.
//
// [R-19] GENERATOR DECLARATION: this module writes NOTHING to disk. It is the HTTP transport
// for the ClickUp probes and nothing else. Declared rather than left silent, because [SB-28]
// claims this directory on the ground that every tool in it says what it writes, and "writes
// nothing" is an answer to that question rather than an absence of one.
//
// RATE LIMIT
// ----------
// ClickUp rate-limits per token per minute and answers 429 with a `X-RateLimit-Reset` epoch
// second. This project has already hit it. cu() paces every request and honours the reset
// header rather than sleeping a guessed interval.

const BASE = 'https://api.clickup.com/api/v2';

const STOP_TOKEN = Symbol('vlp.cu.stop');
class StopSignal extends Error {
  constructor(code) { super(`stop(${code})`); this.name = 'StopSignal'; this[STOP_TOKEN] = true; this.stopCode = code; }
}
let handlersInstalled = false;
function installStopHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  const handler = (err) => {
    if (err && err[STOP_TOKEN]) return;              // the declared stop: already carries its code
    console.error(err && err.stack ? err.stack : String(err));
    process.exitCode = 1;
  };
  process.on('uncaughtException', handler);
  process.on('unhandledRejection', handler);
}
// The same shape as hs-lib's stop(), and for the same measured reason: process.exit() after a
// live request aborts on a libuv assertion and the declared code never leaves the process.
export function stop(code) {
  if (!Number.isInteger(code) || code < 0 || code > 255)
    throw new Error(`stop() needs an integer exit code in 0..255; got ${JSON.stringify(code)}`);
  installStopHandlers();
  process.exitCode = code;
  throw new StopSignal(code);
}

export function token() {
  const t = process.env.CLICKUP_API_TOKEN;
  if (!t) { console.error('No CLICKUP_API_TOKEN in env.'); stop(1); }
  return t;
}

// ── pacing ───────────────────────────────────────────────────────────────────────────────
export const meter = { requests: 0, retries429: 0, waited429Ms: 0, startedAt: null };
let lastAt = 0;
let minGapMs = 700;                    // ~85 req/min against a 100/min bucket
export function setPace(ms) { minGapMs = ms; }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function cu(path, { method = 'GET', body = null, maxRetries = 6 } = {}) {
  if (meter.startedAt === null) meter.startedAt = Date.now();
  for (let attempt = 0; ; attempt++) {
    const gap = minGapMs - (Date.now() - lastAt);
    if (gap > 0) await sleep(gap);
    lastAt = Date.now();
    meter.requests++;
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: token(), 'Content-Type': 'application/json' },
      body: body === null ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (res.status === 429) {
      if (attempt >= maxRetries) {
        const err = new Error(`ClickUp ${method} ${path} -> 429 after ${maxRetries} retries`);
        err.status = 429; err.detail = text.slice(0, 1000); throw err;
      }
      const reset = Number(res.headers.get('x-ratelimit-reset'));
      // The header is an epoch SECOND, not a delta. A wrong reading here sleeps for decades or
      // not at all, so it is bounded on both sides and the floor is exponential.
      let waitMs = Number.isFinite(reset) && reset > 0 ? (reset * 1000) - Date.now() : NaN;
      if (!Number.isFinite(waitMs) || waitMs < 0 || waitMs > 120000) waitMs = Math.min(60000, 2000 * 2 ** attempt);
      waitMs += 500;
      meter.retries429++; meter.waited429Ms += waitMs;
      console.error(`  429 on ${method} ${path} — backing off ${(waitMs / 1000).toFixed(1)}s (retry ${attempt + 1}/${maxRetries})`);
      await sleep(waitMs);
      continue;
    }
    if (!res.ok) {
      const err = new Error(`ClickUp ${method} ${path} -> ${res.status}`);
      err.status = res.status; err.detail = text.slice(0, 2000); throw err;
    }
    return text ? JSON.parse(text) : null;
  }
}

// ── paged reads ──────────────────────────────────────────────────────────────────────────
// Reads EVERY page. A caller that stops at page 0 has read 100 of 959 and would report a
// residual that is an artefact of its own paging — which is the [R-07] shape.
export async function listTasks(listId, { includeClosed = true, subtasks = true } = {}) {
  const out = [];
  for (let page = 0; ; page++) {
    const q = `include_closed=${includeClosed}&subtasks=${subtasks}&page=${page}`;
    const r = await cu(`/list/${listId}/task?${q}`);
    out.push(...(r.tasks ?? []));
    if (r.last_page || !(r.tasks ?? []).length) return { tasks: out, pages: page + 1 };
    if (page > 200) throw new Error(`listTasks(${listId}) exceeded 200 pages — refusing to loop`);
  }
}

export async function getTask(taskId) { return cu(`/task/${taskId}`); }
export async function createTask(listId, body) { return cu(`/list/${listId}/task`, { method: 'POST', body }); }
export async function updateTask(taskId, body) { return cu(`/task/${taskId}`, { method: 'PUT', body }); }
export async function deleteTask(taskId) { return cu(`/task/${taskId}`, { method: 'DELETE' }); }
export async function spaceTags(spaceId) { return cu(`/space/${spaceId}/tag`); }

export async function taskExists(taskId) {
  try { await getTask(taskId); return true; }
  catch (e) { if (e.status === 404 || e.status === 401) return false; throw e; }
}

export function elapsed() { return meter.startedAt === null ? 0 : (Date.now() - meter.startedAt) / 1000; }
