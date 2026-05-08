#!/usr/bin/env tsx
import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { REGISTRY_PATH, computeModulePath } from './_lib/paths.ts';
import { writeCanonical, type BaseFrontmatter } from './_lib/frontmatter.ts';
import { moduleConfigExists, readModuleConfig, fillTemplate, REGISTERED_TYPES } from './_lib/module-types.ts';
import { createPage, listChildPages } from './_lib/clickup-client.ts';
import { addItemInventoryRow } from './_lib/inventories.ts';
import matter from 'gray-matter';

const [, , type, itemIdRaw, ...nameParts] = process.argv;
const name = nameParts.join(' ').replace(/^"|"$/g, '');

if (!type || !itemIdRaw || !name) {
  console.error('Usage: npm run cu:create -- <type> <item-id> "<name>"');
  process.exit(1);
}

if (!REGISTERED_TYPES.includes(type as never)) {
  console.error(`Unknown type: ${type}. Registered types: ${REGISTERED_TYPES.join(', ')}`);
  process.exit(1);
}

const sdItemId = parseInt(itemIdRaw, 10);
if (Number.isNaN(sdItemId)) {
  console.error(`Item ID must be numeric, got: ${itemIdRaw}`);
  process.exit(1);
}

const hasConfig = await moduleConfigExists(type);
if (!hasConfig) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║ MODULE-CONFIG MISSING — ask-on-first-use (canonical §12)       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`No module-config found for: ${type}`);
  console.log(`Expected file: module-config/${type}.md`);
  console.log('');
  console.log('To proceed, RC needs the SuiteDash modal field list for this module type.');
  console.log('Owner: please describe (or screenshot) the SD modal — what fields appear,');
  console.log('required vs optional, rich-text vs plain, dropdowns vs free entry, etc.');
  console.log('');
  console.log('Once Owner provides the modal field list:');
  console.log(`  1. Author module-config/${type}.md following the shape in canonical-cu-sd-sync.md §12`);
  console.log(`  2. Run: npm run module-config:mark-authored -- ${type}`);
  console.log('  3. Re-run this command to create the actual instance.');
  console.log('');
  process.exit(2);
}

const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf-8'));
const today = new Date().toISOString().split('T')[0];

let parentPageId: string;
let cuPageName: string;
let parentStackSlug: string | undefined;
let lmsNumber: number | undefined;

if (type === 'stack-css' || type === 'stack-js') {
  parentStackSlug = `${sdItemId}_Stacks_${name}`;
  const stackParent = registry.registry[parentStackSlug];
  if (!stackParent || stackParent.cu_page_id.startsWith('REPLACE')) {
    console.error(`Stack parent ${parentStackSlug} not in registry. Create it manually in CU first, add to registry, then retry.`);
    process.exit(1);
  }
  parentPageId = stackParent.cu_page_id;
  const suffix = type === 'stack-css' ? 'CSS' : 'JS';
  cuPageName = `${parentStackSlug}_${suffix}`;
} else if (type === 'course') {
  const m021 = registry.registry[`${sdItemId}-order-m021-lms`];
  if (!m021 || m021.cu_page_id.startsWith('REPLACE')) {
    console.error(`M021 LMS parent for item ${sdItemId} not in registry. Aborting.`);
    process.exit(1);
  }
  parentPageId = m021.cu_page_id;
  console.log('Fetching existing LMS courses to compute next number...');
  const children = await listChildPages(parentPageId);
  const numbers = children
    .map(c => c.name.match(/LMS\s+(\d+)\s+–\s+Course/i))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map(m => parseInt(m[1], 10));
  lmsNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  cuPageName = `Item: ${sdItemId} – LMS ${lmsNumber} – Course`;
} else if (type.match(/^m\d{3}-/)) {
  const orderRoot = registry.registry[`${sdItemId}-order-root`];
  if (!orderRoot || orderRoot.cu_page_id.startsWith('REPLACE')) {
    console.error(`Order branch root for item ${sdItemId} not in registry. Aborting.`);
    process.exit(1);
  }
  parentPageId = orderRoot.cu_page_id;
  const moduleNumber = type.match(/^m(\d{3})/)![1];
  cuPageName = `M${moduleNumber} ${name}`;
} else if (type === 'form') {
  console.error('form type requires manual parent resolution — feature pending. Aborting.');
  process.exit(1);
} else {
  console.error(`No create handler for type: ${type}`);
  process.exit(1);
}

const platform = 'tpp';
const repoPath = computeModulePath({
  module_type: type,
  platform,
  sd_item_id: sdItemId,
  parent_stack_slug: parentStackSlug,
  lms_number: lmsNumber,
});
const slug = repoPath.split(/[\\/]/).pop()!.replace(/\.md$/, '');

const configRaw = await readModuleConfig(type);
const configParsed = matter(configRaw);
const bodyTemplate = configParsed.content;

const body = fillTemplate(bodyTemplate, {
  today,
  editor: 'JLW',
  slug,
  parent_stack_slug: parentStackSlug || '',
  sd_item_id: sdItemId,
  lms_number: lmsNumber || 0,
  course_title: name,
});

console.log(`Creating CU page "${cuPageName}" under parent ${parentPageId}...`);
let cuPage;
try {
  cuPage = await createPage({ parent_page_id: parentPageId, name: cuPageName, content: body });
} catch (err) {
  console.error('CU page creation FAILED. Manual fallback:');
  console.error(`  Parent: ${parentPageId}`);
  console.error(`  Name:   ${cuPageName}`);
  console.error(`  Body:   ${body.length} chars`);
  console.error(`  Error:  ${(err as Error).message}`);
  console.error('');
  console.error('Owner: create the page manually, then re-run with --cu-page-id=<id> (manual flag pending).');
  process.exit(1);
}

console.log(`✓ CU page created: ${cuPage.id}`);

const frontmatter: BaseFrontmatter = {
  slug,
  module_type: type,
  sd_item_id: sdItemId,
  platform,
  cu_page_id: cuPage.id,
  cu_url: `https://app.clickup.com/${process.env.CLICKUP_WORKSPACE_ID}/v/dc/${process.env.CLICKUP_TAX_PREP_DOC_ID}/${cuPage.id}`,
  cu_parent_page_id: parentPageId,
  cu_path: '(TODO: fill breadcrumb)',
  last_synced: today,
  last_editor: 'JLW',
  status: 'draft',
  ...(type === 'stack-css' || type === 'stack-js' ? { parent_stack_slug: parentStackSlug } : {}),
  ...(type === 'course' ? { lms_number: lmsNumber, course_title: name, parent_course_lms_number: null } : {}),
};

await writeCanonical(repoPath, frontmatter, body);
console.log(`✓ Repo file written: ${repoPath}`);

const registryKey = type === 'course' ? `${sdItemId}-lms-${lmsNumber}-course` : slug;
registry.registry[registryKey] = {
  cu_page_id: cuPage.id,
  cu_url: frontmatter.cu_url,
  type,
  sd_item_id: sdItemId,
  platform,
  ...(type === 'course' ? { lms_number: lmsNumber } : {}),
};
await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
console.log(`✓ Registry updated: ${registryKey}`);

await addItemInventoryRow({
  sd_item_id: sdItemId,
  platform,
  module_label: type === 'course'
    ? `LMS ${lmsNumber}: ${name}`
    : type.startsWith('stack-')
      ? `${parentStackSlug} (${type === 'stack-css' ? 'CSS' : 'JS'})`
      : `${type}: ${name}`,
  status: '📝',
  repo_path: repoPath,
  cu_url: frontmatter.cu_url,
  table_section: type.startsWith('stack-') ? 'stacks' : type === 'course' ? 'lms-courses' : 'm-series',
});

console.log('');
console.log('Summary:');
console.log(`  Type:    ${type}`);
console.log(`  CU page: ${frontmatter.cu_url}`);
console.log(`  Repo:    ${repoPath}`);
console.log(`  Status:  draft (Owner: edit body, then \`npm run sync:cu -- push ${slug}\` to publish)`);
