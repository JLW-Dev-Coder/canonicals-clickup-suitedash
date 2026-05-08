#!/usr/bin/env tsx
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { REPO_ROOT, REGISTRY_PATH } from './paths.ts';

const tmp = resolve(REPO_ROOT, '.discovered-parents.json');
const { found } = JSON.parse(await readFile(tmp, 'utf-8'));

const workspace = process.env.CLICKUP_WORKSPACE_ID!;
const doc = process.env.CLICKUP_TAX_PREP_DOC_ID!;
const today = new Date().toISOString().split('T')[0];

const urlFor = (id: string) => `https://app.clickup.com/${workspace}/v/dc/${doc}/${id}`;

interface Entry {
  cu_page_id: string;
  cu_url: string;
  cu_parent_page_id: string | null;
  cu_page_name: string;
  type: string;
  sd_item_id: number | null;
  platform: string;
  notes?: string;
  lms_number?: number;
}

const entries: Record<string, Entry> = {};

const def = (key: string, type: string, sd_item_id: number | null, extra: Partial<Entry> = {}) => {
  const f = found[key];
  if (!f) throw new Error(`Discovery missing: ${key}`);
  entries[key] = {
    cu_page_id: f.id,
    cu_url: urlFor(f.id),
    cu_parent_page_id: f.parent_page_id ?? null,
    cu_page_name: f.name,
    type,
    sd_item_id,
    platform: 'tpp',
    ...extra,
  };
};

def('tax-prep-setup-root', 'item-root', 29355);
def('29355-deal-branch', 'branch', 29355);
def('29355-order-root', 'branch', 29355);
def('29355-deal-stacks', 'stacks-parent', 29355);
def('29355_Stacks_Pages', 'stack-parent', 29355);
def('29355_Stacks_Pages_CSS', 'stack-css', 29355);
def('29355_Stacks_Pages_JS', 'stack-js', 29355);
def('29355-order-m021-lms', 'm021-lms', 29355);
def('29355-lms-1-course', 'course', 29355, { lms_number: 1 });

const registry = {
  schema_version: 1,
  description: 'Mapping of CU page IDs to repo canonicals. Owner setup populates parent pages; cu-create populates instances.',
  last_updated: today,
  registry: entries,
};

await mkdir(dirname(REGISTRY_PATH), { recursive: true });
await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
console.log(`✓ Registry written: ${REGISTRY_PATH}`);
console.log(`  ${Object.keys(entries).length} entries`);
for (const [k, v] of Object.entries(entries)) console.log(`  - ${k}: ${v.cu_page_id}`);
