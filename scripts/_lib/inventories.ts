import { readFile, writeFile } from 'node:fs/promises';
import { MODULES_PATH } from './paths.ts';

/**
 * Flips a row in MODULES.md from ⬜ to ✅ for the given type.
 * Idempotent.
 */
export async function markModuleConfigAuthored(type: string): Promise<void> {
  const content = await readFile(MODULES_PATH, 'utf-8');
  const escaped = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rowPattern = new RegExp(`(\\|\\s*\`${escaped}\`\\s*\\|[^|]*\\|\\s*)⬜(\\s*\\|\\s*)\\(not yet\\)(\\s*\\|)`);
  const replaced = content.replace(rowPattern, `$1✅$2[\`module-config/${type}.md\`](module-config/${type}.md)$3`);
  if (replaced !== content) await writeFile(MODULES_PATH, replaced, 'utf-8');
}

/**
 * Logs a request to add a row to ITEMS.md. Currently a stub — Owner edits manually.
 */
export async function addItemInventoryRow(params: {
  sd_item_id: number;
  platform: string;
  module_label: string;
  status: '✅' | '📝' | '🔵' | '⬜' | '🚫';
  repo_path: string;
  cu_url: string;
  table_section: 'stacks' | 'm-series' | 'lms-courses';
}): Promise<void> {
  console.log('');
  console.log('[ITEMS.md update needed — manual edit]');
  console.log(`  Item:    ${params.sd_item_id} (${params.platform})`);
  console.log(`  Module:  ${params.module_label}`);
  console.log(`  Status:  ${params.status}`);
  console.log(`  Repo:    ${params.repo_path}`);
  console.log(`  CU:      ${params.cu_url}`);
  console.log(`  Section: ${params.table_section}`);
  console.log(`  → Edit ITEMS.md manually, then run: npm run sync:cu -- push ITEMS`);
}
