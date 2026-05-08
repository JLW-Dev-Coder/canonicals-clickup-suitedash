#!/usr/bin/env tsx
import 'dotenv/config';
import { findCanonicalPath, ITEMS_PATH } from './_lib/paths.ts';
import { readCanonical, writeCanonical } from './_lib/frontmatter.ts';
import { fetchPage } from './_lib/clickup-client.ts';

const slug = process.argv[2];
if (!slug) { console.error('Usage: npm run sync:cu -- pull <slug>'); process.exit(1); }

let filepath = await findCanonicalPath(slug);
if (!filepath && slug === 'ITEMS') filepath = ITEMS_PATH;
if (!filepath) { console.error(`No file for slug: ${slug}`); process.exit(1); }

const { frontmatter } = await readCanonical(filepath);
if (frontmatter.cu_page_id.startsWith('REPLACE')) {
  console.error(`cu_page_id is still a placeholder: ${frontmatter.cu_page_id}`);
  process.exit(1);
}
const page = await fetchPage(frontmatter.cu_page_id);
frontmatter.last_synced = new Date().toISOString().split('T')[0];
await writeCanonical(filepath, frontmatter, page.content);
console.log(`✓ Pulled ${slug} from CU`);
