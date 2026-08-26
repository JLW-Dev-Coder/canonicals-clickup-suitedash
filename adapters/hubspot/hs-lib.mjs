// Shared HubSpot REST helpers for the reset + provisioning tooling.
//
// WHY NODE AND NOT Invoke-RestMethod
// ----------------------------------
// PowerShell 5.1's Invoke-RestMethod negotiates TLS badly against several of the CDNs in this
// stack and its ConvertTo-Json depth default silently truncates nested bodies. Every call in
// this reset is either destructive or permanent, so the transport is node's fetch throughout
// and PowerShell only ever invokes these scripts.

const BASE = 'https://api.hubapi.com';

// ═══════════════════════════════════════════════════════════════════════════════════════
// stop(code) — THE HALT THAT SURVIVES A PORTAL REQUEST  [D-20]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// `process.exit(n)` called after any request through hs() ABORTS this node build instead of
// exiting with n. The process dies on a libuv assertion —
//
//     Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76
//
// — and what a caller sees is 3221226505 through spawnSync and 127 through a shell. THE
// DECLARED CODE NEVER LEAVES THE PROCESS. Every declared STOP code in every portal tool in
// this directory was on that path, and four of those tools are permanent or destructive:
// hs-provision.mjs, hs-purge-properties.mjs, hs-purge-contacts.mjs, hs-teardown-contact.mjs.
// A caller branching on `status === 2` sees 127 and takes the wrong branch. An abort is also
// not a clean stop — whatever was unflushed is gone — and "it exited non-zero" is a weaker
// fact than the one the tool was written to state.
//
// ── THE THREE CANDIDATES, AND WHY THIS IS THE ONE ─────────────────────────────────────────
//
// Each was MEASURED against a live request, not reasoned about, because the obvious repair is
// the wrong one and an unmeasured fix would have shipped it.
//
//   A  `process.exitCode = n`, no exit() call.  EXITS WITH n after a ~380 ms natural drain.
//      Correct code, WRONG CONTROL FLOW: an assignment is not a jump. That one-character
//      difference is the whole of [R-11] — a failure branch that sets exitCode and then falls
//      through into the success message underneath it. Worse here than there: three tools in
//      this directory guard a DESTRUCTIVE call with a dry-run branch ending in exit(0), and
//      hs-deprecate-property.mjs and hs-teardown-contact.mjs each carry a header recording the
//      time a dry-run exit was replaced by something that did not jump and the branch fell
//      straight through into the write. Candidate A alone would commit that defect eight times.
//
//   B  close the global undici dispatcher, THEN process.exit(n).  STILL ABORTS. The obvious
//      repair does not work.
//
//   C  set process.exitCode, throw a sentinel, swallow ONLY that sentinel.  Exits with n AND
//      jumps. This is C.
//
// ── AND THE VARIANT THAT REPRODUCED THE DEFECT IT WAS FIXING ──────────────────────────────
//
// [R-12] says to expect the fix to reproduce the class it fixes and to say where you looked.
// It did, on the first draft of THIS function. The non-sentinel branch of the handler was
// written to remove its own listener and RE-THROW, so node's default fatal path would print
// the stack — which is tidier than printing it here. Measured: re-throwing from inside an
// uncaughtException handler runs node's internal fatal path, and that path aborts, 127 and
// UV_HANDLE_CLOSING, the exact defect. Node's default handling of an exception that was never
// caught is fine (measured: prints the stack, exits 1); its handling of one re-thrown out of a
// handler is not. So the non-sentinel branch prints and sets a code, and does not re-throw.
//
// ── WHAT THE SWALLOW COSTS, STATED RATHER THAN LEFT AS A SILENCE ──────────────────────────
//
// The handlers are installed LAZILY, by the first stop() call, so a tool that never stops has
// exactly node's default error semantics. Once installed, an error that is NOT the sentinel is
// printed with its stack and sets exit code 1 — the same code node would have used — but the
// event loop DRAINS rather than dying at that instant. Every tool here is a linear async
// chain, so a rejection kills the rest of the chain and there is nothing else pending; the
// difference is observable only in a tool that schedules independent work, and
// adapters/hubspot/assert-exit-codes.mjs asserts that none does.
//
// The sentinel is a module-local Symbol. It cannot be forged from outside this module and it
// cannot arrive from a library, so the swallow is exactly as narrow as it reads.

const STOP_TOKEN = Symbol('vlp.hs.stop');

class StopSignal extends Error {
  constructor(code) {
    super(`stop(${code})`);
    this.name = 'StopSignal';
    this[STOP_TOKEN] = true;
    this.stopCode = code;
  }
}

/** True only for a signal this module made in this process. */
export const isStop = (e) => !!(e && typeof e === 'object' && e[STOP_TOKEN] === true);

let stopHandlersInstalled = false;
const installStopHandlers = () => {
  if (stopHandlersInstalled) return;
  stopHandlersInstalled = true;
  const onErr = (e) => {
    if (isStop(e)) return;                       // ours: exitCode is already set, drain out
    console.error(e && e.stack ? e.stack : String(e));
    if (!process.exitCode) process.exitCode = 1; // never MASK a real failure as success
  };
  process.on('unhandledRejection', onErr);
  process.on('uncaughtException', onErr);
};

/**
 * Halt this tool with a declared exit code, from anywhere, before or after a portal request.
 *
 * Replaces every `process.exit(n)` in this directory. It JUMPS — the statement after a stop()
 * does not run — and the code it declares is the code the caller sees.
 *
 * A catch block that stands between a stop() and the top level MUST re-throw the sentinel:
 *
 *     main().catch((e) => { if (isStop(e)) throw e; console.error(e.message); stop(2); });
 *
 * without which the wrapper reports its own code instead of the one the tool declared.
 * assert-exit-codes.mjs derives that population and asserts the re-throw on every one.
 */
export function stop(code) {
  if (!Number.isInteger(code) || code < 0 || code > 255)
    throw new Error(`stop() needs an integer exit code in 0..255; got ${JSON.stringify(code)}`);
  installStopHandlers();
  process.exitCode = code;
  throw new StopSignal(code);
}

export function serviceKey() {
  const k = process.env.HUBSPOT_SERVICE_KEY;
  if (!k) {
    console.error('No HUBSPOT_SERVICE_KEY in env.');
    stop(1);
  }
  return k;
}

// Never logged, never echoed. Callers get the parsed body or a thrown error carrying the
// STATUS and the response text — the token is not part of either.
export async function hs(path, { method = 'GET', body = null, key = serviceKey() } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body === null ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HubSpot ${method} ${path} -> ${res.status}`);
    err.status = res.status;
    err.detail = text.slice(0, 2000);
    throw err;
  }
  return text ? JSON.parse(text) : {};
}

// Walks every page of a v3 list endpoint. Used instead of the search endpoint's `total`
// wherever the number gates a destructive step: search runs off an index that lags writes by
// seconds to minutes, so a search-derived "0 remaining" can be a stale index rather than an
// empty portal. Pagination reads the object store directly.
export async function listAll(path, { limit = 100, properties = null } = {}) {
  const out = [];
  let after = null;
  do {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (after) qs.set('after', after);
    if (properties) qs.set('properties', properties.join(','));
    const sep = path.includes('?') ? '&' : '?';
    const page = await hs(`${path}${sep}${qs}`);
    out.push(...(page.results || []));
    after = page.paging?.next?.after || null;
  } while (after);
  return out;
}

export const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};
