#!/usr/bin/env tsx
import 'dotenv/config';
import { resolve } from 'node:path';
import { REPO_ROOT, CANONICALS_DIR } from './paths.ts';
import { writeCanonical, type BaseFrontmatter } from './frontmatter.ts';
import { fetchPage } from './clickup-client.ts';

const workspace = process.env.CLICKUP_WORKSPACE_ID!;
const doc = process.env.CLICKUP_TAX_PREP_DOC_ID!;
const today = new Date().toISOString().split('T')[0];

const urlFor = (id: string) => `https://app.clickup.com/${workspace}/v/dc/${doc}/${id}`;

interface Seed {
  slug: string;
  body_type: string;
  cu_page_id: string;
  cu_parent_page_id: string;
  cu_path: string;
  filepath: string;
  extra?: Record<string, unknown>;
}

const seeds: Seed[] = [
  {
    slug: '29355_Stacks_Pages_CSS',
    body_type: 'stack-css',
    cu_page_id: '80djf-701697',
    cu_parent_page_id: '80djf-701517',
    cu_path: 'Item 29355 - Tax Prep Setup > Deal > Item: 29355 - Stacks > 29355_Stacks_Pages > 29355_Stacks_Pages_CSS',
    filepath: resolve(CANONICALS_DIR, 'tpp/29355/deal/stacks/29355_Stacks_Pages/29355_Stacks_Pages_CSS.md'),
    extra: { parent_stack_slug: '29355_Stacks_Pages' },
  },
  {
    slug: '29355_Stacks_Pages_JS',
    body_type: 'stack-js',
    cu_page_id: '80djf-701717',
    cu_parent_page_id: '80djf-701517',
    cu_path: 'Item 29355 - Tax Prep Setup > Deal > Item: 29355 - Stacks > 29355_Stacks_Pages > 29355_Stacks_Pages_JS',
    filepath: resolve(CANONICALS_DIR, 'tpp/29355/deal/stacks/29355_Stacks_Pages/29355_Stacks_Pages_JS.md'),
    extra: { parent_stack_slug: '29355_Stacks_Pages' },
  },
  {
    slug: 'lms-1-course',
    body_type: 'course',
    cu_page_id: '80djf-707897',
    cu_parent_page_id: '80djf-701917',
    cu_path: 'Item 29355 - Tax Prep Setup > Order > M021 LMS > Item: 29355 - LMS 1 - Course',
    filepath: resolve(CANONICALS_DIR, 'tpp/29355/order/m021-lms/lms-1-course.md'),
    extra: { lms_number: 1, course_title: 'Tax Prep Pro Setup Guide - How We Configured Your SuiteDash', parent_course_lms_number: null },
  },
];

for (const s of seeds) {
  console.log(`Fetching CU page ${s.cu_page_id} (${s.slug})...`);
  const page = await fetchPage(s.cu_page_id);
  const body = page.content ?? '';
  if (!body.trim()) {
    console.error(`✗ ${s.slug}: CU page returned empty body. Aborting per no-empty-stub rule.`);
    process.exit(1);
  }

  const fm: BaseFrontmatter = {
    slug: s.slug,
    body_type: s.body_type,
    sd_item_id: 29355,
    platform: 'tpp',
    cu_page_id: s.cu_page_id,
    cu_url: urlFor(s.cu_page_id),
    cu_parent_page_id: s.cu_parent_page_id,
    cu_path: s.cu_path,
    last_synced: today,
    last_editor: 'JLW',
    status: 'live',
    ...s.extra,
  };
  await writeCanonical(s.filepath, fm, body);
  console.log(`  ✓ ${s.slug}: ${body.length} chars body → ${s.filepath}`);
}

console.log('\n✓ All seed canonicals written with real CU bodies.');
