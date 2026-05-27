#!/usr/bin/env node
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const versionsDir = join(root, '.versions');

function listSnapshots() {
  if (!existsSync(versionsDir)) return [];
  return readdirSync(versionsDir)
    .filter((n) => statSync(join(versionsDir, n)).isDirectory())
    .filter((n) => existsSync(join(versionsDir, n, 'manifest.json')))
    .map((n) => {
      const m = JSON.parse(readFileSync(join(versionsDir, n, 'manifest.json'), 'utf8'));
      return m;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

const all = listSnapshots();
if (all.length === 0) {
  console.log('(no snapshots yet — run `npm run snapshot -- <label>` to create one)');
  process.exit(0);
}

console.log(`${all.length} snapshot(s):\n`);
for (const m of all) {
  const kb = (m.bytes / 1024).toFixed(1);
  console.log(`  ${m.id}`);
  console.log(`    label    : ${m.label}`);
  console.log(`    created  : ${m.createdAt}`);
  console.log(`    size     : ${kb} KB`);
  console.log(`    tracked  : ${m.tracked.length} path(s)`);
  console.log('');
}
console.log('Restore: npm run rollback <id>');
