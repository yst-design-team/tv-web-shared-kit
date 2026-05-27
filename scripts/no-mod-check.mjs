#!/usr/bin/env node
/**
 * no-mod-check.mjs — 守住「禁止修改已有组件」硬约束
 *
 * 思路：对比 baseline snapshot 与当前 src/components/，
 *   - baseline 里有、当前内容变了 → 失败（违反 no-mod）
 *   - baseline 里有、当前被删了 → 失败（删除老组件也算改）
 *   - baseline 里没有、当前新建了 → 通过（生成新组件是允许的）
 *
 * baseline 选择顺序：
 *   1. --baseline=<snapshot-id>（显式指定）
 *   2. 最近一个 *-pre snapshot
 *   3. 最近的 baseline / 任意 snapshot（兜底）
 *
 * 用法：
 *   node scripts/no-mod-check.mjs                       # 自动找最近 *-pre
 *   node scripts/no-mod-check.mjs --baseline=<id>       # 指定基线
 *   node scripts/no-mod-check.mjs --list-baselines      # 列出可选基线
 *   node scripts/no-mod-check.mjs --warn-only           # 只警告不 fail（pre-commit 调试用）
 *
 * 输出：
 *   ✗ 列出每个被修改/删除的已有组件，给出 diff 摘要
 *   ✓ 通过时给出 baseline id 和 新增组件数
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const versionsDir = join(root, '.versions')
const componentsRel = 'src/components'
const currentComponentsAbs = join(root, componentsRel)

// ---------- args ----------
const args = process.argv.slice(2)
const warnOnly = args.includes('--warn-only')
const listOnly = args.includes('--list-baselines')
const baselineArg = args.find(a => a.startsWith('--baseline='))?.split('=')[1]

// ---------- helpers ----------
async function listSnapshots() {
  if (!existsSync(versionsDir)) return []
  const entries = await readdir(versionsDir, { withFileTypes: true })
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort() // 时间戳前缀保证字典序 == 时间序
}

function pickBaseline(snapshots) {
  if (baselineArg) {
    const exact = snapshots.find(s => s === baselineArg || s.startsWith(baselineArg))
    if (!exact) return { error: `baseline not found: ${baselineArg}` }
    return { id: exact }
  }
  // 优先 *-pre
  const pre = [...snapshots].reverse().find(s => /-pre(?:-|$)/.test(s) || s.endsWith('-pre'))
  if (pre) return { id: pre, hint: '(latest *-pre)' }
  // 兜底：最近任意 snapshot
  if (snapshots.length > 0) return { id: snapshots[snapshots.length - 1], hint: '(latest snapshot; no *-pre found)' }
  return { error: 'no snapshot found in .versions/. Run: NODE_ENV=development npm run snapshot -- <label>-pre' }
}

async function walk(dirAbs, baseRel = '') {
  const out = []
  if (!existsSync(dirAbs)) return out
  const entries = await readdir(dirAbs, { withFileTypes: true })
  for (const e of entries) {
    if (e.name === '.DS_Store') continue
    const abs = join(dirAbs, e.name)
    const rel = baseRel ? `${baseRel}/${e.name}` : e.name
    if (e.isDirectory()) {
      out.push(...(await walk(abs, rel)))
    } else if (e.isFile()) {
      out.push({ rel, abs })
    }
  }
  return out
}

async function hashFile(abs) {
  const buf = await readFile(abs)
  return createHash('sha256').update(buf).digest('hex')
}

async function fileMap(dirAbs) {
  const files = await walk(dirAbs)
  const m = new Map()
  for (const f of files) m.set(f.rel, await hashFile(f.abs))
  return m
}

// ---------- main ----------
const snapshots = await listSnapshots()

if (listOnly) {
  if (snapshots.length === 0) {
    console.log('no snapshots found in .versions/')
    process.exit(0)
  }
  console.log('available baselines (newest last):')
  for (const s of snapshots) console.log(`  ${s}${/-pre(?:-|$)/.test(s) ? '  ← *-pre' : ''}`)
  process.exit(0)
}

const picked = pickBaseline(snapshots)
if (picked.error) {
  if (warnOnly) {
    console.warn(`! no-mod-check skipped: ${picked.error}`)
    process.exit(0)
  }
  console.error(`error: ${picked.error}`)
  console.error('       --list-baselines to see options')
  process.exit(2)
}

const baselineId = picked.id
const baselineComponentsAbs = join(versionsDir, baselineId, componentsRel)

if (!existsSync(baselineComponentsAbs)) {
  console.error(`error: baseline "${baselineId}" has no ${componentsRel}/ directory`)
  process.exit(2)
}

const baselineMap = await fileMap(baselineComponentsAbs)
const currentMap = await fileMap(currentComponentsAbs)

// 按组件目录分桶
function topFolder(rel) {
  return rel.split('/')[0]
}

const baselineComponents = new Set([...baselineMap.keys()].map(topFolder))
const currentComponents = new Set([...currentMap.keys()].map(topFolder))

const violations = []   // 已有组件被改 / 被删
const newComponents = [] // 新增组件目录（允许）

for (const comp of baselineComponents) {
  if (!currentComponents.has(comp)) {
    violations.push({ component: comp, kind: 'deleted', files: [] })
    continue
  }
  const changes = []
  for (const [rel, hash] of baselineMap) {
    if (topFolder(rel) !== comp) continue
    const cur = currentMap.get(rel)
    if (cur === undefined) {
      changes.push({ rel, kind: 'deleted' })
    } else if (cur !== hash) {
      changes.push({ rel, kind: 'modified' })
    }
  }
  // 该组件新增了文件也算改
  for (const rel of currentMap.keys()) {
    if (topFolder(rel) !== comp) continue
    if (!baselineMap.has(rel)) changes.push({ rel, kind: 'added' })
  }
  if (changes.length) violations.push({ component: comp, kind: 'modified', files: changes })
}

for (const comp of currentComponents) {
  if (!baselineComponents.has(comp)) newComponents.push(comp)
}

// ---------- report ----------
console.log(`baseline: ${baselineId} ${picked.hint || ''}`)
console.log(`  components in baseline: ${baselineComponents.size}`)
console.log(`  components now        : ${currentComponents.size}`)
console.log(`  new components        : ${newComponents.length}${newComponents.length ? '  → ' + newComponents.join(', ') : ''}`)
console.log('')

if (violations.length === 0) {
  console.log('✓ no-mod check passed: no existing components were modified or deleted')
  process.exit(0)
}

const heading = warnOnly ? '! no-mod check WARNING' : '✗ no-mod check FAILED'
console.log(`${heading} (${violations.length} violation(s)):`)
for (const v of violations) {
  if (v.kind === 'deleted') {
    console.log(`  ✗ ${v.component}  — component deleted`)
  } else {
    console.log(`  ✗ ${v.component}  — modified:`)
    for (const f of v.files) console.log(`      ${f.kind.padEnd(8)} ${f.rel}`)
  }
}
console.log('')
console.log('  fix:')
console.log('  - If you actually need to change an existing component, do it in a separate "modify" session,')
console.log('    not a "generate" session. See docs/GENERATION_STRATEGY.md §0.')
console.log('  - Otherwise, revert the change and create a new component instead.')

process.exit(warnOnly ? 0 : 1)
