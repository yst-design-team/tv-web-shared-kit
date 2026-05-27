#!/usr/bin/env node
/**
 * inventory-check.mjs — 守住 component-inventory.json 与代码的一致性
 *
 * 检查项：
 *   1. inventory 里每个 component.name 都对应一个 src/components/<name>/index.ts
 *   2. src/components/ 下每个目录（除 internal/sub-part 标记）都在 inventory 里有条目
 *   3. inventory 里没有 dead rename（renames 的 value 必须存在）
 *   4. 自动填 components[].consumers：扫 src/pages/<page>/ 与 src/App.tsx 的 import
 *
 * 使用：
 *   node scripts/inventory-check.mjs            # 只校验，发现问题 exit 1
 *   node scripts/inventory-check.mjs --write    # 校验 + 把 consumers 字段写回 JSON
 *
 * 不引入任何新依赖；不修改 component-inventory.md（那个仍是人类可读源）。
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inventoryPath = join(root, 'docs', 'component-inventory.json')
const componentsDir = join(root, 'src', 'components')
const pagesDir = join(root, 'src', 'pages')
const appFile = join(root, 'src', 'App.tsx')

const writeBack = process.argv.includes('--write')

// ---------- load ----------
if (!existsSync(inventoryPath)) {
  console.error(`inventory not found: ${inventoryPath}`)
  process.exit(2)
}
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'))

// ---------- helpers ----------
async function listDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  return entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name)
}

async function readFileSafe(p) {
  try { return await readFile(p, 'utf8') } catch { return '' }
}

async function collectImportsFrom(file, names) {
  const raw = await readFileSafe(file)
  if (!raw) return new Set()
  // Strip line + block comments so commented-out example imports don't count.
  const text = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n')
  // Match: import { Foo, Bar } from '.../components' OR '../components/Foo'
  const used = new Set()
  const reBlock = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]*components[^'"]*['"]/g
  let m
  while ((m = reBlock.exec(text)) !== null) {
    for (const raw of m[1].split(',')) {
      const ident = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
      if (names.has(ident)) used.add(ident)
    }
  }
  // Also catch default-style `import Foo from '../../components/Foo'`
  const reDefault = /import\s+(\w+)\s+from\s+['"][^'"]*components\/(\w+)/g
  while ((m = reDefault.exec(text)) !== null) {
    const ident = m[1]
    const folder = m[2]
    if (names.has(ident)) used.add(ident)
    if (names.has(folder)) used.add(folder)
  }
  return used
}

// ---------- 1. inventory → filesystem ----------
const fsComponents = new Set(await listDirs(componentsDir))
const fsLowercase = new Map([...fsComponents].map(n => [n.toLowerCase(), n]))
const invByName = new Map(inventory.components.map(c => [c.name, c]))

const problems = []

for (const c of inventory.components) {
  if (!fsComponents.has(c.name)) {
    problems.push(`inventory entry "${c.name}" has no matching folder src/components/${c.name}/`)
    continue
  }
  const indexFile = join(componentsDir, c.name, 'index.ts')
  if (!existsSync(indexFile)) {
    problems.push(`inventory entry "${c.name}" missing src/components/${c.name}/index.ts`)
  }
  if (c.dir && relative(root, join(root, c.dir)).replace(/\\/g, '/') !== `src/components/${c.name}`) {
    problems.push(`inventory entry "${c.name}" has dir="${c.dir}" but expected src/components/${c.name}`)
  }
}

// ---------- 2. filesystem → inventory ----------
// allow-list: sub-parts / internal primitives are not required to register
const internalAllowList = new Set([
  // none right now; add here if you build internal-only folders
])

for (const name of fsComponents) {
  if (internalAllowList.has(name)) continue
  if (!invByName.has(name)) {
    problems.push(`folder src/components/${name}/ has no inventory entry in component-inventory.json`)
  }
}

// ---------- 3. renames sanity ----------
const renames = inventory.renames || {}
for (const [oldName, newName] of Object.entries(renames)) {
  if (!fsComponents.has(newName)) {
    problems.push(`rename "${oldName}" → "${newName}" but src/components/${newName}/ does not exist`)
  }
}

// ---------- 4. consumers (scan pages + App.tsx) ----------
const names = new Set(inventory.components.map(c => c.name))
const consumersOf = new Map([...names].map(n => [n, new Set()]))

// pages
const pageDirs = await listDirs(pagesDir)
for (const page of pageDirs) {
  const pagePath = join(pagesDir, page)
  // walk one level for .tsx files
  const files = await readdir(pagePath, { withFileTypes: true }).catch(() => [])
  for (const e of files) {
    if (!e.isFile() || !e.name.endsWith('.tsx')) continue
    const used = await collectImportsFrom(join(pagePath, e.name), names)
    for (const u of used) consumersOf.get(u).add(page)
  }
}

// App.tsx
{
  const used = await collectImportsFrom(appFile, names)
  for (const u of used) consumersOf.get(u).add('App')
}

let consumersChanged = 0
for (const c of inventory.components) {
  const detected = [...consumersOf.get(c.name)].sort()
  const declared = (c.consumers || []).slice().sort()
  if (JSON.stringify(detected) !== JSON.stringify(declared)) {
    if (writeBack) {
      c.consumers = detected
      consumersChanged += 1
    } else {
      problems.push(
        `consumers drift for "${c.name}": declared=[${declared.join(',')}] detected=[${detected.join(',')}] — re-run with --write to auto-fix`
      )
    }
  }
}

// ---------- write back ----------
if (writeBack && consumersChanged > 0) {
  await writeFile(inventoryPath, JSON.stringify(inventory, null, 2) + '\n')
  console.log(`✓ updated consumers for ${consumersChanged} component(s)`)
}

// ---------- report ----------
if (problems.length === 0) {
  console.log(`✓ inventory check passed (${inventory.components.length} components, ${fsComponents.size} folders)`)
  process.exit(0)
}

console.log(`inventory check found ${problems.length} issue(s):`)
for (const p of problems) console.log(`  - ${p}`)
process.exit(1)
