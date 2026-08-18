#!/usr/bin/env node
/**
 * klaritie-digits-ingest.mjs
 *
 * Maps parsed Twin City Bank transactions (account last-four 2432) for Klaritie
 * Farms into balanced double-entry journal entries for Digits, using the fixed
 * rules table in config/klaritie-digits-map.json.
 *
 * The rules table is a tax position set by Principal. This script applies it
 * exactly as written: rules are ordered, first match wins, and nothing that the
 * table routes to a review or uncategorised bucket is reclassified here.
 *
 * Run:
 *   node scripts/klaritie-digits-ingest.mjs --dry-run   (default; writes nothing)
 *   node scripts/klaritie-digits-ingest.mjs --post      (must be explicit)
 *
 * Input comes from process.env.KLARITIE_CSV, an absolute path OUTSIDE this
 * repository. The CSV is client financial data and never enters git.
 *
 * Exit codes:
 *   0  completed (dry run, or post finished)
 *   1  data mismatch — missing business/category, unbalanced entry, row-count
 *      mismatch, unresolved config. Nothing is posted.
 *   2  transport failure — rate limit or network error. The manifest is saved;
 *      re-run to resume, the loader is idempotent.
 *
 * No customer PII is emitted. The account is referenced as last-four 2432 only,
 * and any run of six or more consecutive digits is stripped from every memo.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, sep } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const CONFIG_PATH = join(REPO, 'config', 'klaritie-digits-map.json');
const STATE_PATH = join(HERE, '.klaritie-digits-state.json');
const BATCH_DIR = join(HERE, 'klaritie-digits-batches');
const REPORT_PATH = join(REPO, 'reports', 'klaritie-digits-dryrun.md');

const EXPECTED_ROWS = 2308;
const BATCH_SIZE = 50;
const MEMO_DESC_MAX = 180;
const PLACEHOLDER = 'PENDING_PRINCIPAL';

// ---------------------------------------------------------------------------
// Flags. --dry-run is the default; --post must be passed explicitly. Running
// with no arguments never writes to Digits.
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const POST = argv.includes('--post');
const DRY_RUN = !POST;

for (const a of argv) {
  if (!['--post', '--dry-run'].includes(a)) fail(`unknown flag ${a}`);
}
if (POST && argv.includes('--dry-run')) fail('--post and --dry-run are mutually exclusive');

function fail(msg) {
  console.error(`\nDATA MISMATCH: ${msg}`);
  process.exit(1);
}
function transportFail(msg, retryAfter) {
  console.error(`\nTRANSPORT FAILURE: ${msg}`);
  if (retryAfter) console.error(`retry after: ${retryAfter}`);
  console.error(`manifest saved at ${STATE_PATH}; re-run to resume`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Money. Amounts are handled as integer cents parsed straight off the decimal
// string, so nothing rides on binary floating point.
// ---------------------------------------------------------------------------

function parseCents(raw) {
  const s = String(raw ?? '').trim();
  if (s === '' || s.toLowerCase() === 'none') return 0;
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(s.replace(/[$,]/g, ''));
  if (!m) return null;
  const [, sign, whole, frac = ''] = m;
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return sign === '-' ? -cents : cents;
}

function fmtCents(c) {
  const neg = c < 0;
  const a = Math.abs(c);
  return `${neg ? '-' : ''}${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`;
}

function fmtUsd(c) {
  const neg = c < 0;
  const a = Math.abs(c);
  const dollars = Math.floor(a / 100).toLocaleString('en-US');
  return `${neg ? '-' : ''}$${dollars}.${String(a % 100).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// CSV. The export is RFC4180 quoted — descriptions contain both commas and the
// pipe separator — so a split on comma would corrupt roughly one row in seven.
// ---------------------------------------------------------------------------

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let i = 0;

  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };

  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { quoted = true; i++; continue; }
    if (ch === ',') { pushField(); i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { pushRow(); i++; continue; }
    field += ch; i++;
  }
  if (field !== '' || row.length) pushRow();
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}

// ---------------------------------------------------------------------------
// Memo. "<description>  [src <source>]", description truncated at 180, then any
// run of 6+ consecutive digits stripped from the assembled memo so no account
// number, reference number or identifier can ride along.
// ---------------------------------------------------------------------------

function buildMemo(description, source) {
  const desc = description.length > MEMO_DESC_MAX
    ? description.slice(0, MEMO_DESC_MAX)
    : description;
  const memo = `${desc}  [src ${source}]`;
  return memo.replace(/\d{6,}/g, '').replace(/[ \t]{2,}/g, '  ').trim();
}

function idemKey(r) {
  return createHash('sha256')
    .update(`${r.date}|${r.description}|${r.debit}|${r.credit}|${r.source}`)
    .digest('hex')
    .slice(0, 16);
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

if (!existsSync(CONFIG_PATH)) fail(`config not found at ${CONFIG_PATH}`);
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

const compile = (rules, which) => rules.map((r, idx) => {
  let re;
  try {
    re = new RegExp(r.pattern, 'i');
  } catch (err) {
    fail(`${which} rule ${idx} has an uncompilable pattern ${JSON.stringify(r.pattern)}: ${err.message}`);
  }
  return { ...r, idx, re, which };
});

const debitRules = compile(config.debit_rules, 'debit');
const creditRules = compile(config.credit_rules, 'credit');

function match(rules, description) {
  for (const r of rules) if (r.re.test(description)) return r;
  return null;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const CSV_PATH = process.env.KLARITIE_CSV;
if (!CSV_PATH) fail('KLARITIE_CSV is not set; point it at the absolute path of the transaction CSV, which must live outside this repository');
if (!existsSync(CSV_PATH)) fail(`KLARITIE_CSV points at ${CSV_PATH}, which does not exist`);
if (resolve(CSV_PATH).startsWith(REPO + sep)) {
  fail(`KLARITIE_CSV resolves inside the repository (${CSV_PATH}); client financial data must live outside the working tree`);
}

const rawRows = parseCsv(readFileSync(CSV_PATH, 'utf8'));
if (!rawRows.length) fail('CSV is empty');

const header = rawRows[0].map(h => h.trim());
const EXPECTED_HEADER = ['account_last4', 'date', 'description', 'debit', 'credit', 'balance', 'source'];
if (header.join(',') !== EXPECTED_HEADER.join(',')) {
  fail(`unexpected CSV header: got ${header.join(',')}, want ${EXPECTED_HEADER.join(',')}`);
}

const dataRows = rawRows.slice(1);

// ---------------------------------------------------------------------------
// Map every row
// ---------------------------------------------------------------------------

const parseFailures = [];
const zeroRows = [];
const entries = [];
const ruleStats = new Map();   // "which:idx" -> {rule, count, cents}

let csvDebitCents = 0;
let csvCreditCents = 0;

dataRows.forEach((cols, n) => {
  const lineNo = n + 2; // 1-based, +1 for header

  if (cols.length !== 7) {
    parseFailures.push({ lineNo, reason: `expected 7 fields, got ${cols.length}` });
    return;
  }

  const [account_last4, date, description, debit, credit, balance, source] =
    cols.map(c => c.trim());

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    parseFailures.push({ lineNo, reason: `unparseable date ${JSON.stringify(date)}` });
    return;
  }

  const debitCents = parseCents(debit);
  const creditCents = parseCents(credit);
  if (debitCents === null || creditCents === null) {
    parseFailures.push({ lineNo, reason: `unparseable amount debit=${JSON.stringify(debit)} credit=${JSON.stringify(credit)}` });
    return;
  }

  csvDebitCents += debitCents;
  csvCreditCents += creditCents;

  if (debitCents === 0 && creditCents === 0) {
    zeroRows.push({ lineNo, date, description, source });
    return;
  }
  if (debitCents !== 0 && creditCents !== 0) {
    parseFailures.push({ lineNo, reason: 'both debit and credit are non-zero; exactly one is expected' });
    return;
  }

  const isDebit = debitCents !== 0;
  const amountCents = isDebit ? debitCents : creditCents;
  if (amountCents < 0) {
    parseFailures.push({ lineNo, reason: `negative amount ${fmtCents(amountCents)}` });
    return;
  }

  const rule = match(isDebit ? debitRules : creditRules, description);
  if (!rule) {
    // Both rule lists end with ".*", so this is unreachable by construction.
    fail(`line ${lineNo} matched no rule; both rule lists end with ".*", so this indicates a regex engine problem`);
  }

  const statKey = `${rule.which}:${rule.idx}`;
  if (!ruleStats.has(statKey)) ruleStats.set(statKey, { rule, count: 0, cents: 0 });
  const st = ruleStats.get(statKey);
  st.count += 1;
  st.cents += amountCents;

  const amount = fmtCents(amountCents);

  // Money out: debit the matched expense/liability category, credit the bank.
  // Money in:  debit the bank, credit the matched income/liability category.
  const lines = isDebit
    ? [
        { amount, entry_type: 'DEBIT', category_id: rule.category_id },
        { amount, entry_type: 'CREDIT', category_id: config.bank_category_id },
      ]
    : [
        { amount, entry_type: 'DEBIT', category_id: config.bank_category_id },
        { amount, entry_type: 'CREDIT', category_id: rule.category_id },
      ];

  entries.push({
    key: idemKey({ date, description, debit, credit, source }),
    lineNo,
    date,
    description,
    source,
    account_last4,
    isDebit,
    amountCents,
    rule,
    transaction: { date, memo: buildMemo(description, source), lines },
  });
});

// ---------------------------------------------------------------------------
// Local validation. Everything below must hold before a single row is posted.
// ---------------------------------------------------------------------------

const unbalanced = entries.filter(e => {
  const d = e.transaction.lines.filter(l => l.entry_type === 'DEBIT')
    .reduce((s, l) => s + parseCents(l.amount), 0);
  const c = e.transaction.lines.filter(l => l.entry_type === 'CREDIT')
    .reduce((s, l) => s + parseCents(l.amount), 0);
  return d !== c || d === 0;
});

const memoLeaks = entries.filter(e => /\d{6,}/.test(e.transaction.memo));

// Duplicate idempotency keys: two rows identical in all five hashed fields.
// The manifest is keyed on this hash, so a duplicate would post once and the
// twin would be skipped as already-present. Surfaced, never silently collapsed.
const keyCounts = new Map();
for (const e of entries) keyCounts.set(e.key, (keyCounts.get(e.key) ?? 0) + 1);
const dupKeys = [...keyCounts.entries()].filter(([, n]) => n > 1);

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

const pending = entries.filter(e => !state[e.key]);
const alreadyPresent = entries.length - pending.length;

// ---------------------------------------------------------------------------
// Dry-run report
// ---------------------------------------------------------------------------

function writeReport() {
  const L = [];
  const uncatLabels = new Set(['Uncategorized Expense', 'Uncategorized Income']);

  L.push('# Klaritie Farms — Twin City Bank 2432 → Digits ingest, dry run');
  L.push('');
  L.push('Generated by `scripts/klaritie-digits-ingest.mjs --dry-run`. Nothing was written to Digits.');
  L.push('');
  L.push('Rules table is fixed by Principal and applied verbatim from `config/klaritie-digits-map.json`:');
  L.push('ordered, first match wins, case-insensitive regex against `description`. Nothing routed to a');
  L.push('review or uncategorised bucket has been reclassified.');
  L.push('');

  // 1
  L.push('## 1. Row count');
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| Data rows read | **${dataRows.length}** |`);
  L.push(`| Expected | ${EXPECTED_ROWS} |`);
  L.push(`| Match | ${dataRows.length === EXPECTED_ROWS ? '**yes**' : '**NO — data mismatch**'} |`);
  L.push(`| Journal entries generated | ${entries.length} |`);
  L.push(`| Rows skipped, zero on both sides | ${zeroRows.length} |`);
  L.push(`| Rows failed to parse | ${parseFailures.length} |`);
  L.push('');
  L.push(`Statement months covered: ${[...new Set(dataRows.map(r => r[6]))].sort().length} source PDFs, ` +
    `dates ${entries.length ? entries.map(e => e.date).sort()[0] : 'n/a'} to ${entries.length ? entries.map(e => e.date).sort().at(-1) : 'n/a'}.`);
  L.push('');

  // 2
  L.push('## 2. CSV totals');
  L.push('');
  L.push('| Side | Amount |');
  L.push('|---|---:|');
  L.push(`| Sum of all debits | ${fmtUsd(csvDebitCents)} |`);
  L.push(`| Sum of all credits | ${fmtUsd(csvCreditCents)} |`);
  L.push(`| Net (credits − debits) | ${fmtUsd(csvCreditCents - csvDebitCents)} |`);
  L.push('');
  L.push('These are sums of the CSV `debit` and `credit` columns across every parsed row,');
  L.push('including the zero-on-both-sides rows, which contribute nothing.');
  L.push('');

  // 3
  L.push('## 3. Rules that matched');
  L.push('');
  L.push('Ordered as in the config. A rule with no rows matched nothing and is listed at zero.');
  L.push('');
  L.push('| # | Side | Pattern | Category label | Review | Rows | Dollars |');
  L.push('|---:|---|---|---|:-:|---:|---:|');
  for (const rules of [debitRules, creditRules]) {
    for (const r of rules) {
      const st = ruleStats.get(`${r.which}:${r.idx}`);
      const count = st?.count ?? 0;
      const cents = st?.cents ?? 0;
      L.push(`| ${r.idx} | ${r.which} | \`${r.pattern.replace(/\|/g, '\\|')}\` | ${r.label} | ${r.review ? 'yes' : 'no'} | ${count} | ${fmtUsd(cents)} |`);
    }
  }
  L.push('');

  // 4
  const reviewEntries = entries.filter(e => e.rule.review);
  const reviewCents = reviewEntries.reduce((s, e) => s + e.amountCents, 0);
  L.push('## 4. Rows flagged for review');
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---:|`);
  L.push(`| Rows with \`review: true\` | **${reviewEntries.length}** of ${entries.length} (${(100 * reviewEntries.length / entries.length).toFixed(1)}%) |`);
  L.push(`| Dollar total | **${fmtUsd(reviewCents)}** |`);
  L.push('');

  // 5
  const uncat = entries
    .filter(e => uncatLabels.has(e.rule.label))
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 25);
  const uncatAll = entries.filter(e => uncatLabels.has(e.rule.label));
  L.push('## 5. 25 largest uncategorised rows');
  L.push('');
  L.push(`${uncatAll.length} rows landed in \`Uncategorized Expense\` or \`Uncategorized Income\`, ` +
    `totalling ${fmtUsd(uncatAll.reduce((s, e) => s + e.amountCents, 0))}. The 25 largest:`);
  L.push('');
  L.push('| Date | Amount | Side | Bucket | Description |');
  L.push('|---|---:|---|---|---|');
  for (const e of uncat) {
    L.push(`| ${e.date} | ${fmtUsd(e.amountCents)} | ${e.isDebit ? 'debit' : 'credit'} | ${e.rule.label} | ${e.transaction.memo.replace(/\|/g, '\\|')} |`);
  }
  L.push('');
  L.push('Descriptions above are the generated memos, so the 6+ digit strip has already been applied.');
  L.push('');

  // 6
  L.push('## 6. Balance check');
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---:|`);
  L.push(`| Journal entries generated | ${entries.length} |`);
  L.push(`| Entries that balance | ${entries.length - unbalanced.length} |`);
  L.push(`| Entries that do NOT balance | **${unbalanced.length}** |`);
  L.push('');
  if (unbalanced.length) {
    L.push('Unbalanced entries (must be zero before posting):');
    L.push('');
    for (const e of unbalanced.slice(0, 25)) L.push(`- line ${e.lineNo}, ${e.date}, ${fmtUsd(e.amountCents)}`);
    L.push('');
  } else {
    L.push('Every generated entry is two lines, one DEBIT and one CREDIT, for the identical');
    L.push('amount in integer cents. Debits equal credits on all ' + entries.length + ' entries.');
    L.push('');
  }

  // 7
  L.push('## 7. Parse failures');
  L.push('');
  if (!parseFailures.length) {
    L.push('None. Every one of the ' + dataRows.length + ' data rows parsed.');
  } else {
    L.push('| CSV line | Reason |');
    L.push('|---:|---|');
    for (const f of parseFailures) L.push(`| ${f.lineNo} | ${f.reason} |`);
  }
  L.push('');

  // Zero rows
  L.push('## 8. Rows skipped: zero on both debit and credit');
  L.push('');
  if (!zeroRows.length) {
    L.push('None.');
  } else {
    L.push(`${zeroRows.length} rows carry 0 in both amount columns and are skipped, per the decision criteria.`);
    L.push('');
    L.push('| CSV line | Date | Source | Description |');
    L.push('|---:|---|---|---|');
    for (const z of zeroRows) {
      L.push(`| ${z.lineNo} | ${z.date} | ${z.source} | ${buildMemo(z.description, z.source).replace(/\|/g, '\\|')} |`);
    }
  }
  L.push('');

  // Idempotency
  L.push('## 9. Idempotency keys');
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---:|`);
  L.push(`| Distinct keys | ${keyCounts.size} |`);
  L.push(`| Entries | ${entries.length} |`);
  L.push(`| Keys appearing more than once | **${dupKeys.length}** |`);
  L.push(`| Already in manifest | ${alreadyPresent} |`);
  L.push(`| Would post | ${pending.length} |`);
  L.push(`| Batches at ${BATCH_SIZE}/call | ${Math.ceil(pending.length / BATCH_SIZE)} |`);
  L.push('');
  if (dupKeys.length) {
    L.push('Colliding keys are rows identical in date, description, debit, credit and source.');
    L.push('The manifest is keyed on that hash, so only the first of each set would post and the');
    L.push('rest would be skipped as already-present. Reported, not silently collapsed:');
    L.push('');
    L.push('| Key | Rows | Date | Amount | Description |');
    L.push('|---|---:|---|---:|---|');
    for (const [k, n] of dupKeys) {
      const e = entries.find(x => x.key === k);
      L.push(`| \`${k}\` | ${n} | ${e.date} | ${fmtUsd(e.amountCents)} | ${e.transaction.memo.replace(/\|/g, '\\|')} |`);
    }
    L.push('');
  }

  // Memo safety
  L.push('## 10. Memo safety');
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---:|`);
  L.push(`| Memos containing a run of 6+ digits | **${memoLeaks.length}** (must be 0) |`);
  L.push(`| Memos carrying the account number | 0 — the \`account_last4\` column is never written into a memo |`);
  L.push('');

  // Posting readiness
  L.push('## 11. Posting readiness');
  L.push('');
  const unresolved = [];
  if (config.business_id === PLACEHOLDER) unresolved.push('`business_id`');
  if (config.bank_category_id === PLACEHOLDER) unresolved.push('`bank_category_id`');
  if (unresolved.length) {
    L.push(`**Not ready.** ${unresolved.join(' and ')} still ${unresolved.length > 1 ? 'hold' : 'holds'} \`${PLACEHOLDER}\`.`);
    L.push('`--post` refuses to run until both are resolved against a Principal-named business.');
  } else {
    L.push('Config ids are resolved. `--post` will emit batches for submission.');
  }
  L.push('');

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, L.join('\n'), 'utf8');
  console.log(`report written to ${REPORT_PATH}`);
}

// ---------------------------------------------------------------------------
// Console summary
// ---------------------------------------------------------------------------

console.log(`csv                : ${CSV_PATH}`);
console.log(`mode               : ${DRY_RUN ? 'DRY RUN — nothing is written to Digits' : 'POST'}`);
console.log(`rows read          : ${dataRows.length} (expected ${EXPECTED_ROWS})`);
console.log(`entries generated  : ${entries.length}`);
console.log(`zero-amount skipped: ${zeroRows.length}`);
console.log(`parse failures     : ${parseFailures.length}`);
console.log(`unbalanced         : ${unbalanced.length}`);
console.log(`memo digit leaks   : ${memoLeaks.length}`);
console.log(`duplicate keys     : ${dupKeys.length}`);
console.log(`csv debit total    : ${fmtUsd(csvDebitCents)}`);
console.log(`csv credit total   : ${fmtUsd(csvCreditCents)}`);
console.log(`already in manifest: ${alreadyPresent}`);
console.log(`pending            : ${pending.length}`);

if (DRY_RUN) {
  writeReport();
  if (dataRows.length !== EXPECTED_ROWS) fail(`row count ${dataRows.length} does not equal the expected ${EXPECTED_ROWS}`);
  if (unbalanced.length) fail(`${unbalanced.length} generated entries do not balance`);
  if (parseFailures.length) fail(`${parseFailures.length} rows failed to parse`);
  if (memoLeaks.length) fail(`${memoLeaks.length} memos still contain a run of 6 or more digits`);
  console.log('\ndry run clean. Nothing was posted. Review reports/klaritie-digits-dryrun.md.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Post. Every local invariant is a hard gate first — the batch is atomic on the
// Digits side, so one bad row would fail all fifty.
// ---------------------------------------------------------------------------

if (config.business_id === PLACEHOLDER || config.bank_category_id === PLACEHOLDER) {
  fail('config still holds PENDING_PRINCIPAL for business_id and/or bank_category_id. ' +
       'Resolve both against a Principal-named business before posting. Nothing was posted.');
}
if (dataRows.length !== EXPECTED_ROWS) fail(`row count ${dataRows.length} does not equal the expected ${EXPECTED_ROWS}`);
if (parseFailures.length) fail(`${parseFailures.length} rows failed to parse`);
if (unbalanced.length) fail(`${unbalanced.length} generated entries do not balance`);
if (memoLeaks.length) fail(`${memoLeaks.length} memos still contain a run of 6 or more digits`);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const badIds = new Set();
for (const e of entries) {
  for (const l of e.transaction.lines) if (!UUID.test(l.category_id)) badIds.add(l.category_id);
}
if (badIds.size) fail(`these category ids are not well-formed UUIDs: ${[...badIds].join(', ')}`);

if (!pending.length) {
  console.log('\nnothing pending; every row is already in the manifest.');
  process.exit(0);
}

// Digits is reached through the MCP tool surface in the operator's session
// (list_businesses / list_categories / create_transactions). There is no
// confirmed REST base URL for this account and DIGITS_API_TOKEN is not set, so
// this script does not invent one. It writes each batch as a create_transactions
// payload for the operator to submit, then records the returned ids.
//
//   node scripts/klaritie-digits-ingest.mjs --post   -> writes batch-NNN.json
//   operator submits each batch via create_transactions
//   ids are written back into the manifest keyed by idempotency key
//
// The manifest is what makes the loop idempotent: re-running --post re-emits
// only the batches whose keys are still unrecorded.

mkdirSync(BATCH_DIR, { recursive: true });
for (const f of readdirSync(BATCH_DIR)) {
  if (/^batch-\d+\.json$/.test(f)) writeFileSync(join(BATCH_DIR, f), '', 'utf8');
}

const batches = [];
for (let i = 0; i < pending.length; i += BATCH_SIZE) batches.push(pending.slice(i, i + BATCH_SIZE));

batches.forEach((batch, n) => {
  const num = String(n + 1).padStart(3, '0');
  const payload = {
    business_id: config.business_id,
    transactions: batch.map(e => e.transaction),
  };
  writeFileSync(join(BATCH_DIR, `batch-${num}.json`), JSON.stringify(payload, null, 2) + '\n', 'utf8');
  writeFileSync(join(BATCH_DIR, `batch-${num}.keys.json`), JSON.stringify(batch.map(e => e.key), null, 2) + '\n', 'utf8');
  state[`__batch_${num}`] = { status: 'emitted', count: batch.length };
});
saveState();

console.log(`\n${batches.length} batches of at most ${BATCH_SIZE} written to ${BATCH_DIR}`);
console.log('submit each batch-NNN.json via create_transactions, then record the returned');
console.log('ids against batch-NNN.keys.json in the manifest before re-running.');
process.exit(0);
