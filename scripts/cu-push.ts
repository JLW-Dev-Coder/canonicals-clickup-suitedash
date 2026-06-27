#!/usr/bin/env tsx
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { findCanonicalPath, ITEMS_PATH, REGISTRY_PATH } from './_lib/paths.ts';
import { readCanonical, writeCanonical, validateFrontmatter } from './_lib/frontmatter.ts';
import { updatePage, createPage } from './_lib/clickup-client.ts';
import { FENCE_LANG_BY_BODY_TYPE } from './_lib/module-types.ts';

const slug = process.argv[2];
if (!slug) { console.error('Usage: npm run sync:cu -- push <slug>'); process.exit(1); }

let filepath = await findCanonicalPath(slug);
if (!filepath && slug === 'ITEMS') filepath = ITEMS_PATH;
if (!filepath) { console.error(`No file for slug: ${slug}`); process.exit(1); }

const { frontmatter, body } = await readCanonical(filepath);
const errors = validateFrontmatter(frontmatter, slug);
if (errors.length) { errors.forEach(e => console.error(`  - ${e}`)); process.exit(1); }

// A present cu_page_id must be a real ID, not a leftover placeholder.
if (frontmatter.cu_page_id && frontmatter.cu_page_id.startsWith('REPLACE')) {
  console.error(`cu_page_id is still a placeholder: ${frontmatter.cu_page_id}`);
  console.error('Owner: fill in the real CU page ID in the frontmatter, then retry.');
  process.exit(1);
}

// Body types whose CU page renders as markdown (no code-fence wrapper) and whose
// title is kept in sync with the canonical on push. Code-stack types stay fenced.
const RAW_MARKDOWN_BODY_TYPES = new Set(['appt', 'circle', 'course']);
const isRawMd = RAW_MARKDOWN_BODY_TYPES.has(frontmatter.body_type);

const payload = isRawMd
  ? body
  : '```' + (FENCE_LANG_BY_BODY_TYPE[frontmatter.body_type] ?? '') + '\n' + body + '\n```';

const today = new Date().toISOString().split('T')[0];

if (!frontmatter.cu_page_id) {
  // ── CREATE PATH ─────────────────────────────────────────────────────────────
  // Empty cu_page_id + parent_slug ⇒ create a new CU page under the resolved parent
  // and back-fill the identity so subsequent pushes take the update path.
  if (typeof frontmatter.parent_slug !== 'string' || !frontmatter.parent_slug) {
    console.error('parent_slug required for create (cu_page_id is empty)');
    process.exit(1);
  }
  if (typeof frontmatter.title !== 'string' || !frontmatter.title) {
    console.error('title required for create (used as the CU page name)');
    process.exit(1);
  }

  const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf-8'));
  const parent = registry.registry?.[frontmatter.parent_slug];
  if (!parent || !parent.cu_page_id) {
    console.error(`parent_slug "${frontmatter.parent_slug}" not found in _meta/cu-page-registry.json (or has no cu_page_id).`);
    console.error('Owner: add the parent page to the registry, then retry.');
    process.exit(1);
  }
  const parentPageId: string = parent.cu_page_id;

  // Doc resolution: parent's registry cu_doc_id → canonical's own cu_doc_id →
  // env default doc (applied inside createPage when docId is undefined).
  const parentDocId = typeof parent.cu_doc_id === 'string' && parent.cu_doc_id ? parent.cu_doc_id : undefined;
  const fmDocId = typeof frontmatter.cu_doc_id === 'string' && frontmatter.cu_doc_id ? frontmatter.cu_doc_id : undefined;
  const docId = parentDocId ?? fmDocId;

  let cuPage;
  try {
    cuPage = await createPage({ parent_page_id: parentPageId, name: frontmatter.title, content: payload, docId });
  } catch (err) {
    console.error('CU page creation FAILED. Manual fallback:');
    console.error(`  Parent: ${parentPageId}`);
    console.error(`  Name:   ${frontmatter.title}`);
    console.error(`  Doc:    ${docId ?? '(env default)'}`);
    console.error(`  Error:  ${(err as Error).message}`);
    process.exit(1);
  }

  // Back-fill identity. cu_doc_id is persisted only for non-default docs, matching
  // the shape of existing canonicals (default-doc canonicals omit it).
  const effectiveDocId = docId ?? process.env.CLICKUP_TAX_PREP_DOC_ID!;
  frontmatter.cu_page_id = cuPage.id;
  frontmatter.cu_parent_page_id = parentPageId;
  frontmatter.cu_url = `https://app.clickup.com/${process.env.CLICKUP_WORKSPACE_ID}/v/dc/${effectiveDocId}/${cuPage.id}`;
  if (docId) frontmatter.cu_doc_id = docId;
  frontmatter.last_synced = today;
  await writeCanonical(filepath, frontmatter, body);
  console.log(`✓ Created ${slug} in CU${docId ? ` (doc ${docId})` : ''} → ${cuPage.id}`);
} else {
  // ── UPDATE PATH (unchanged behavior) ─────────────────────────────────────────
  // Canonicals in a non-default CU doc declare it via `cu_doc_id` (e.g. Tax Monitor).
  const docId = typeof frontmatter.cu_doc_id === 'string' && frontmatter.cu_doc_id ? frontmatter.cu_doc_id : undefined;
  // Retitle markdown pages to their canonical `title` (em-dash → single dash via normalizePageName, CLAUDE.md rule 8).
  const name = isRawMd && typeof frontmatter.title === 'string' ? frontmatter.title : undefined;

  await updatePage(frontmatter.cu_page_id, payload, name, docId);
  frontmatter.last_synced = today;
  await writeCanonical(filepath, frontmatter, body);
  console.log(`✓ Pushed ${slug} to CU${docId ? ` (doc ${docId})` : ''}${name ? ' [retitled]' : ''}`);
}
