#!/usr/bin/env node
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const versionsDir = join(root, '.versions');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npm run rollback <id|latest>');
  console.error('       npm run versions   # list available snapshots');
  process.exit(1);
}

function findSnapshot(id) {
  if (!existsSync(versionsDir)) return null;
  const all = readdirSync(versionsDir).filter((n) => statSync(join(versionsDir, n)).isDirectory());
  if (id === 'latest') {
    const withMeta = all
      .filter((n) => existsSync(join(versionsDir, n, 'manifest.json')))
      .map((n) => ({ n, m: JSON.parse(readFileSync(join(versionsDir, n, 'manifest.json'), 'utf8')) }))
      .sort((a, b) => (a.m.createdAt < b.m.createdAt ? 1 : -1));
    return withMeta[0]?.n || null;
  }
  if (all.includes(id)) return id;
  const match = all.filter((n) => n.startsWith(id));
  if (match.length === 1) return match[0];
  if (match.length > 1) {
    console.error(`ambiguous id "${id}" matches: ${match.join(', ')}`);
    process.exit(1);
  }
  return null;
}

const id = findSnapshot(arg);
if (!id) {
  console.error(`snapshot not found: ${arg}`);
  console.error('run `npm run versions` to list available snapshots');
  process.exit(1);
}

const snapDir = join(versionsDir, id);
const manifest = JSON.parse(readFileSync(join(snapDir, 'manifest.json'), 'utf8'));

// Auto-backup current state before overwriting, so rollback itself is reversible.
function pad(n) { return String(n).padStart(2, '0'); }
function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
const backupId = `${stamp()}-pre-rollback`;
const backupDir = join(versionsDir, backupId);
mkdirSync(backupDir, { recursive: true });
const backedUp = [];
for (const rel of manifest.tracked) {
  const cur = join(root, rel);
  if (!existsSync(cur)) continue;
  const target = join(backupDir, rel);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(cur, target, { recursive: true });
  backedUp.push(rel);
}
writeFileSync(join(backupDir, 'manifest.json'), JSON.stringify({
  id: backupId,
  label: `auto-backup before rollback to ${id}`,
  createdAt: new Date().toISOString(),
  tracked: backedUp,
  bytes: 0,
}, null, 2));

// Now restore.
for (const rel of manifest.tracked) {
  const src = join(snapDir, rel);
  const dst = join(root, rel);
  if (!existsSync(src)) continue;
  if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, { recursive: true });
}

console.log(`✓ rolled back to ${id}`);
console.log(`  label    : ${manifest.label}`);
console.log(`  created  : ${manifest.createdAt}`);
console.log(`  restored : ${manifest.tracked.length} path(s)`);
console.log('');
console.log(`previous state saved as: ${backupId}`);
console.log(`undo this rollback with : npm run rollback ${backupId}`);
