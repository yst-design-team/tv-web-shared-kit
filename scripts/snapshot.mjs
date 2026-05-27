#!/usr/bin/env node
import { cpSync, mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const versionsDir = join(root, '.versions');

const TRACKED = ['src/pages', 'src/components', 'src/tokens', 'src/assets', 'src/focus', 'src/App.tsx', 'src/App.css', 'src/index.css', 'src/main.tsx'];

function pad(n) { return String(n).padStart(2, '0'); }
function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function slug(s) {
  return (s || 'snap').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'snap';
}

function dirSize(p) {
  let total = 0;
  if (!existsSync(p)) return 0;
  const st = statSync(p);
  if (st.isFile()) return st.size;
  for (const name of readdirSync(p)) total += dirSize(join(p, name));
  return total;
}

const label = process.argv.slice(2).join(' ').trim() || 'snap';
const id = `${stamp()}-${slug(label)}`;
const dest = join(versionsDir, id);

mkdirSync(dest, { recursive: true });

const copied = [];
for (const rel of TRACKED) {
  const src = join(root, rel);
  if (!existsSync(src)) continue;
  const target = join(dest, rel);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(src, target, { recursive: true });
  copied.push(rel);
}

const manifest = {
  id,
  label,
  createdAt: new Date().toISOString(),
  tracked: copied,
  bytes: dirSize(dest),
};
writeFileSync(join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2));

const kb = (manifest.bytes / 1024).toFixed(1);
console.log(`✓ snapshot created: ${id}`);
console.log(`  label   : ${label}`);
console.log(`  files   : ${copied.length} path(s)`);
console.log(`  size    : ${kb} KB`);
console.log(`  restore : npm run rollback ${id}`);
