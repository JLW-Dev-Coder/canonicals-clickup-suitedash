#!/usr/bin/env tsx
import 'dotenv/config';
import { findCanonicalPath, ITEMS_PATH } from './_lib/paths.ts';
import { readCanonical, writeCanonical, validateFrontmatter } from './_lib/frontmatter.ts';
import { updatePage } from './_lib/clickup-client.ts';
import { FENCE_LANG_BY_BODY_TYPE } from './_lib/module-types.ts';

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

// Body types whose CU page renders as markdown (no code-fence wrapper) and whose
// title is kept in sync with the canonical on push. Code-stack types stay fenced.
const RAW_MARKDOWN_BODY_TYPES = new Set(['appt']);
const isRawMd = RAW_MARKDOWN_BODY_TYPES.has(frontmatter.body_type);

const payload = isRawMd
  ? body
  : '```' + (FENCE_LANG_BY_BODY_TYPE[frontmatter.body_type] ?? '') + '\n' + body + '\n```';

// Canonicals in a non-default CU doc declare it via `cu_doc_id` (e.g. Tax Monitor).
const docId = typeof frontmatter.cu_doc_id === 'string' && frontmatter.cu_doc_id ? frontmatter.cu_doc_id : undefined;
// Retitle markdown pages to their canonical `title` (em-dash → single dash via normalizePageName, CLAUDE.md rule 8).
const name = isRawMd && typeof frontmatter.title === 'string' ? frontmatter.title : undefined;

await updatePage(frontmatter.cu_page_id, payload, name, docId);
frontmatter.last_synced = new Date().toISOString().split('T')[0];
await writeCanonical(filepath, frontmatter, body);
console.log(`✓ Pushed ${slug} to CU${docId ? ` (doc ${docId})` : ''}${name ? ' [retitled]' : ''}`);
