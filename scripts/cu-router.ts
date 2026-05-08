#!/usr/bin/env tsx
export {};
const sub = process.argv[2];
const rest = process.argv.slice(3);
if (!sub || !['pull', 'push', 'status'].includes(sub)) {
  console.error('Usage: npm run sync:cu -- <pull|push|status> [slug]');
  process.exit(1);
}
process.argv = [process.argv[0], process.argv[1], ...rest];
if (sub === 'pull') await import('./cu-pull.ts');
else if (sub === 'push') await import('./cu-push.ts');
else await import('./cu-status.ts');
