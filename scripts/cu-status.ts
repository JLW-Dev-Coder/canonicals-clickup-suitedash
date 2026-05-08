#!/usr/bin/env tsx
import 'dotenv/config';
import { CANONICALS_DIR, ITEMS_PATH } from './_lib/paths.ts';
import { readCanonical } from './_lib/frontmatter.ts';
import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

async function* walk(dir: string): AsyncGenerator<string> {
  try {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) yield* walk(full);
      else if (entry.name.endsWith('.md')) yield full;
    }
  } catch {
    // dir doesn't exist yet — fine pre-setup
  }
}

console.log('slug                                          | type            | status     | last_synced');
console.log('─'.repeat(95));

let count = 0;
for await (const filepath of walk(CANONICALS_DIR)) {
  try {
    const { frontmatter } = await readCanonical(filepath);
    console.log(
      `${(frontmatter.slug ?? '?').padEnd(45)} | ${(frontmatter.module_type ?? '?').padEnd(15)} | ${(frontmatter.status ?? '?').padEnd(10)} | ${frontmatter.last_synced ?? '?'}`
    );
    count++;
  } catch (err) {
    console.log(`${filepath} ERROR: ${(err as Error).message}`);
  }
}

try {
  await stat(ITEMS_PATH);
  const { frontmatter } = await readCanonical(ITEMS_PATH);
  console.log(
    `${(frontmatter.slug ?? 'ITEMS').padEnd(45)} | ${(frontmatter.module_type ?? '?').padEnd(15)} | ${(frontmatter.status ?? '?').padEnd(10)} | ${frontmatter.last_synced ?? '?'}`
  );
  count++;
} catch {
  // ITEMS.md doesn't exist yet — fine pre-setup
}

if (count === 0) {
  console.log('(no synced files yet — run Owner setup per scaffold prompt PART 10)');
}
