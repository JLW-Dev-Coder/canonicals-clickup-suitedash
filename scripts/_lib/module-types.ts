import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { MODULE_CONFIG_DIR } from './paths.ts';

export const REGISTERED_TYPES = [
  'stack-css', 'stack-js', 'course',
  'm001-appointments', 'm002-auto-templates', 'm003-business-sectors', 'm004-circles',
  'm005-content-categories', 'm006-custom-fields', 'm007-dashes', 'm008-document-generators',
  'm009-drip-sequences', 'm010-marketing-audience', 'm011-flows', 'm012-forms',
  'm013-invoice-items', 'm014-landing-pages', 'm015-menus', 'm016-platform-branding',
  'm017-portal-pages', 'm018-projects', 'm019-proposals', 'm020-tasks', 'm021-lms',
  'form',
] as const;

export type RegisteredType = typeof REGISTERED_TYPES[number];

export const FENCE_LANG_BY_MODULE_TYPE: Record<string, string> = {
  'stack-css': 'css',
  'stack-js': 'javascript',
  'm014-landing-pages': 'html',
};

export function stripCodeFence(s: string): string {
  const opening = s.match(/^```[a-zA-Z0-9_-]*\r?\n/);
  if (!opening) return s;
  const closing = s.match(/\r?\n```\s*$/);
  if (!closing) return s;
  return s.slice(opening[0].length, s.length - closing[0].length);
}

export function moduleConfigPath(type: string): string {
  return resolve(MODULE_CONFIG_DIR, `${type}.md`);
}

export async function moduleConfigExists(type: string): Promise<boolean> {
  try {
    await readFile(moduleConfigPath(type), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export async function readModuleConfig(type: string): Promise<string> {
  return await readFile(moduleConfigPath(type), 'utf-8');
}

export function fillTemplate(template: string, values: Record<string, string | number>): string {
  let result = template;
  for (const [key, val] of Object.entries(values)) {
    result = result.split(`{${key}}`).join(String(val));
  }
  return result;
}
