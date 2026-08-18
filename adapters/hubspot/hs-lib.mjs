// Shared HubSpot REST helpers for the reset + provisioning tooling.
//
// WHY NODE AND NOT Invoke-RestMethod
// ----------------------------------
// PowerShell 5.1's Invoke-RestMethod negotiates TLS badly against several of the CDNs in this
// stack and its ConvertTo-Json depth default silently truncates nested bodies. Every call in
// this reset is either destructive or permanent, so the transport is node's fetch throughout
// and PowerShell only ever invokes these scripts.

const BASE = 'https://api.hubapi.com';

export function serviceKey() {
  const k = process.env.HUBSPOT_SERVICE_KEY;
  if (!k) {
    console.error('No HUBSPOT_SERVICE_KEY in env.');
    process.exit(1);
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
