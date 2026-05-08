import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdir } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPO_ROOT = resolve(__dirname, '..', '..');
export const CANONICALS_DIR = resolve(REPO_ROOT, 'canonicals');
export const META_DIR = resolve(REPO_ROOT, '_meta');
export const REGISTRY_PATH = resolve(META_DIR, 'cu-page-registry.json');
export const MODULE_CONFIG_DIR = resolve(REPO_ROOT, 'module-config');
export const MODULES_PATH = resolve(REPO_ROOT, 'MODULES.md');
export const ITEMS_PATH = resolve(REPO_ROOT, 'ITEMS.md');

export async function findCanonicalPath(slug: string, dir: string = CANONICALS_DIR): Promise<string | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        const found = await findCanonicalPath(slug, full);
        if (found) return found;
      } else if (entry.isFile() && entry.name === `${slug}.md`) {
        return full;
      }
    }
  } catch {
    // canonicals dir may not exist yet — that's fine pre-setup
  }
  return null;
}

export function computeModulePath(params: {
  module_type: string;
  platform: string;
  sd_item_id: number;
  parent_stack_slug?: string;
  lms_number?: number;
  m_module_slug?: string;
}): string {
  const { module_type, platform, sd_item_id } = params;
  const itemRoot = resolve(CANONICALS_DIR, platform, String(sd_item_id));

  if (module_type === 'stack-css' || module_type === 'stack-js') {
    if (!params.parent_stack_slug) {
      throw new Error(`parent_stack_slug required for module_type=${module_type}`);
    }
    const suffix = module_type === 'stack-css' ? 'CSS' : 'JS';
    return resolve(itemRoot, 'deal', 'stacks', params.parent_stack_slug, `${params.parent_stack_slug}_${suffix}.md`);
  }

  if (module_type === 'course') {
    if (params.lms_number === undefined) throw new Error('lms_number required for course');
    return resolve(itemRoot, 'order', 'm021-lms', `lms-${params.lms_number}-course.md`);
  }

  if (module_type.match(/^m\d{3}-/)) {
    return resolve(itemRoot, 'order', `${module_type}.md`);
  }

  if (module_type === 'form') {
    if (!params.m_module_slug) throw new Error('m_module_slug required for form');
    return resolve(itemRoot, 'order', 'forms', `${params.m_module_slug}.md`);
  }

  throw new Error(`Unknown module_type: ${module_type}`);
}
