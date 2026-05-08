#!/usr/bin/env tsx
import 'dotenv/config';
import { findCanonicalPath, ITEMS_PATH } from './_lib/paths.ts';
import { readCanonical, writeCanonical, validateFrontmatter } from './_lib/frontmatter.ts';
import { updatePage } from './_lib/clickup-client.ts';
import { FENCE_LANG_BY_MODULE_TYPE } from './_lib/module-types.ts';

const slug = process.argv[2];
if (!slug) { console.error('Usage: npm run sync:cu -- push <slug>'); process.exit(1); }

let filepath = await findCanonicalPath(slug);
if (!filepath && slug === 'ITEMS') filepath = ITEMS_PATH;
if (!filepath) { console.error(`No file for slug: ${slug}`); process.exit(1); }

const { frontmatter, body } = await readCanonical(filepath);
const errors = validateFrontmatter(frontmatter, slug);
if (errors.length) { errors.forEach(e => console.error(`  - ${e}`)); process.exit(1); }

if (frontmatter.cu_page_id.startsWith('REPLACE')) {
  console.error(`cu_page_id is still a placeholder: ${frontmatter.cu_page_id}`);
  console.error('Owner: fill in the real CU page ID in the frontmatter, then retry.');
  process.exit(1);
}

const lang = FENCE_LANG_BY_MODULE_TYPE[frontmatter.module_type] ?? '';
const wrappedBody = '```' + lang + '\n' + body + '\n```';
await updatePage(frontmatter.cu_page_id, wrappedBody);
frontmatter.last_synced = new Date().toISOString().split('T')[0];
await writeCanonical(filepath, frontmatter, body);
console.log(`✓ Pushed ${slug} to CU`);
