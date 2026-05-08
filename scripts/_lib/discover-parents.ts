#!/usr/bin/env tsx
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { REPO_ROOT } from './paths.ts';

const CU_API_BASE = 'https://api.clickup.com/api/v3';

interface CUPageNode {
  id: string;
  name: string;
  parent_page_id?: string | null;
  date_updated?: number;
}

const token = process.env.CLICKUP_API_TOKEN!;
const workspace = process.env.CLICKUP_WORKSPACE_ID!;
const doc = process.env.CLICKUP_TAX_PREP_DOC_ID!;

const norm = (s: string) => s.toLowerCase().replace(/[–—-]/g, '-').replace(/\s+/g, ' ').trim();

async function fetchAllPages(): Promise<CUPageNode[]> {
  const url = `${CU_API_BASE}/workspaces/${workspace}/docs/${doc}/pages?max_page_depth=-1&content_format=text/md`;
  const res = await fetch(url, { headers: { Authorization: token, 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`pages list failed: ${res.status} ${res.statusText} — ${await res.text()}`);
  const data: any = await res.json();
  // Response may be an array, or {pages: [...]}, or a tree; flatten as needed
  if (Array.isArray(data)) return flatten(data);
  if (data && Array.isArray(data.pages)) return flatten(data.pages);
  console.error('Unexpected response shape:', JSON.stringify(data).slice(0, 500));
  return [];
}

function flatten(nodes: any[], parent: string | null = null, out: CUPageNode[] = []): CUPageNode[] {
  for (const n of nodes) {
    const node: CUPageNode = {
      id: n.id,
      name: n.name,
      parent_page_id: n.parent_page_id ?? parent ?? null,
      date_updated: n.date_updated,
    };
    out.push(node);
    if (Array.isArray(n.pages)) flatten(n.pages, n.id, out);
    if (Array.isArray(n.children)) flatten(n.children, n.id, out);
    if (Array.isArray(n.sub_pages)) flatten(n.sub_pages, n.id, out);
  }
  return out;
}

const all = await fetchAllPages();
console.log(`Fetched ${all.length} pages total.`);

const byId = new Map(all.map(p => [p.id, p]));
const childrenOf = (parentId: string | null) =>
  all.filter(p => (p.parent_page_id ?? null) === parentId);

console.log('\nDoc tree:');
function printTree(parentId: string | null, depth = 0) {
  for (const p of childrenOf(parentId)) {
    console.log(`${'  '.repeat(depth)}- ${p.id}  ${p.name}`);
    printTree(p.id, depth + 1);
  }
}
printTree(null);

// Also try: parents not in the map (orphans = top level)
const ids = new Set(all.map(p => p.id));
const topLevelByOrphan = all.filter(p => !p.parent_page_id || !ids.has(p.parent_page_id));
if (topLevelByOrphan.length !== childrenOf(null).length) {
  console.log('\n(Top-level by orphan logic):');
  for (const p of topLevelByOrphan) console.log(`  - ${p.id}  ${p.name}`);
}

const findByName = (patterns: string[]): CUPageNode | null => {
  for (const pattern of patterns) {
    const want = norm(pattern);
    for (const p of all) {
      if (norm(p.name) === want) return p;
    }
  }
  for (const pattern of patterns) {
    const want = norm(pattern);
    for (const p of all) {
      if (norm(p.name).includes(want)) return p;
    }
  }
  return null;
};

const targets: Array<[string, string[]]> = [
  ['tax-prep-setup-root', ['Item 29355 - Tax Prep Setup']],
  ['29355-deal-branch', ['Item 29355 - Tax Prep Setup - Deal']],
  ['29355-order-root', ['Item 29355 - Tax Prep Setup - Order']],
  ['29355-deal-stacks', ['Item: 29355 - Stacks']],
  ['29355_Stacks_Pages', ['29355_Stacks_Pages']],
  ['29355_Stacks_Pages_CSS', ['29355_Stacks_Pages_CSS']],
  ['29355_Stacks_Pages_JS', ['29355_Stacks_Pages_JS']],
  ['29355-order-m021-lms', ['M021 LMS']],
  ['29355-lms-1-course', ['Item: 29355 - LMS 1 - Course']],
  ['ITEMS-mirror', ['ITEMS', 'ITEMS - Per-Item Module Inventory', 'Per-Item Module Inventory']],
];

const found: Record<string, { id: string; name: string; parent_page_id: string | null }> = {};
const missing: string[] = [];
console.log('\nResolution:');
for (const [key, patterns] of targets) {
  const p = findByName(patterns);
  if (p) {
    found[key] = { id: p.id, name: p.name, parent_page_id: p.parent_page_id ?? null };
    console.log(`  ✓ ${key}: ${p.id} ("${p.name}")  parent=${p.parent_page_id ?? '(root)'}`);
  } else {
    missing.push(key);
    console.log(`  ✗ ${key}: NOT FOUND (searched: ${patterns.join(' | ')})`);
  }
}

const tmpPath = resolve(REPO_ROOT, '.discovered-parents.json');
await writeFile(tmpPath, JSON.stringify({ found, missing, all }, null, 2), 'utf-8');
console.log(`\n✓ Discovery results → ${tmpPath}`);

if (missing.filter(m => m !== 'ITEMS-mirror').length > 0) {
  console.error(`\n✗ Required parents missing: ${missing.filter(m => m !== 'ITEMS-mirror').join(', ')}`);
  process.exit(1);
}
