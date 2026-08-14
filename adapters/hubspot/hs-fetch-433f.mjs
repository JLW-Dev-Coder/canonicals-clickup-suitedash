import { readFileSync, writeFileSync } from 'fs';

const KEY = process.env.HUBSPOT_SERVICE_KEY;
if (!KEY) { console.error('No HUBSPOT_SERVICE_KEY in env.'); process.exit(1); }
const contactId = process.argv[2];
if (!contactId) { console.error('usage: node hs-fetch-433f.mjs <contactId>'); process.exit(1); }

const reg  = JSON.parse(readFileSync('adapters/hubspot/fields.registry.json', 'utf8'));
const f433 = reg.properties.filter(p => p.form === '433f');
const url  = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`
           + `?properties=${f433.map(p => p.hs_name).join(',')}`;

const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
if (!res.ok) { console.error('HubSpot error', res.status, await res.text()); process.exit(2); }
const props = (await res.json()).properties || {};

const record = { intake_id: `HS-${contactId}` };
for (const p of f433) {
  const v = props[p.hs_name];
  if (v !== undefined && v !== null && v !== '') record[p.key] = v;   // p.key is the logical 433f_* key
}
const out = `samples/433f.from-hubspot-${contactId}.json`;
writeFileSync(out, JSON.stringify(record, null, 2));
console.log(`fetched ${Object.keys(record).length - 1} values -> ${out}`);
