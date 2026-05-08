import matter from 'gray-matter';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export type ModuleType = string;

export interface BaseFrontmatter {
  slug: string;
  body_type: ModuleType;
  sd_item_id: number | null;
  platform: string;
  cu_page_id: string;
  cu_url: string;
  cu_parent_page_id: string;
  cu_path: string;
  last_synced: string;
  last_editor: string;
  status: 'live' | 'draft' | 'deprecated';
  [key: string]: unknown;
}

export interface ParsedCanonical {
  frontmatter: BaseFrontmatter;
  body: string;
}

export async function readCanonical(filepath: string): Promise<ParsedCanonical> {
  const raw = await readFile(filepath, 'utf-8');
  const parsed = matter(raw);
  return { frontmatter: parsed.data as BaseFrontmatter, body: parsed.content };
}

export async function writeCanonical(filepath: string, frontmatter: BaseFrontmatter, body: string): Promise<void> {
  await mkdir(dirname(filepath), { recursive: true });
  const serialized = matter.stringify(body, frontmatter);
  await writeFile(filepath, serialized, 'utf-8');
}

export function validateFrontmatter(fm: Partial<BaseFrontmatter>, slug: string): string[] {
  const errors: string[] = [];
  if (!fm.slug) errors.push('frontmatter.slug missing');
  if (fm.slug && fm.slug !== slug) errors.push(`frontmatter.slug (${fm.slug}) must match filename slug (${slug})`);
  if (!fm.body_type) errors.push('frontmatter.body_type missing');
  if (fm.sd_item_id === undefined) errors.push('frontmatter.sd_item_id missing (use null for meta-inventory files)');
  if (!fm.platform) errors.push('frontmatter.platform missing');
  if (!fm.cu_page_id) errors.push('frontmatter.cu_page_id missing');
  if (!fm.status) errors.push('frontmatter.status missing');
  if (fm.status && !['live', 'draft', 'deprecated'].includes(fm.status)) {
    errors.push(`frontmatter.status (${fm.status}) must be live | draft | deprecated`);
  }
  return errors;
}
