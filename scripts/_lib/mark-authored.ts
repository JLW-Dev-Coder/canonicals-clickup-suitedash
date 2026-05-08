#!/usr/bin/env tsx
import { markModuleConfigAuthored } from './inventories.ts';

const type = process.argv[2];
if (!type) {
  console.error('Usage: npm run module-config:mark-authored -- <type>');
  process.exit(1);
}

await markModuleConfigAuthored(type);
console.log(`✓ MODULES.md updated: ${type} flipped to ✅`);
