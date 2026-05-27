#!/usr/bin/env node
/**
 * spec-check.mjs — 校验 .artifacts/spec-*.json 的字段完整度
 *
 * 用法：
 *   node scripts/spec-check.mjs --spec=.artifacts/spec-music.json
 *   node scripts/spec-check.mjs --all                 # 扫 .artifacts/spec-*.json
 *   node scripts/spec-check.mjs --warn-only           # 失败只警告（G2 软检查推荐）
 *
 * 检查项：
 *   - 必填字段齐：pageId / componentProfile / layout.sections / focus.default / componentPlan / imagePlan
 *   - componentPlan.create[].reason 不能空
 *   - pageId 是 kebab-case
 *   - componentProfile 在已知集合内（或带 _new 后缀显式表示新 profile）
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactsDir = join(root, '.artifacts')

const args = process.argv.slice(2)
const warnOnly = args.includes('--warn-only')
const all = args.includes('--all')
const specArg = args.find(a => a.startsWith('--spec='))?.split('=')[1]

if (!all && !specArg) {
  // 在 verify 编排里如果没人指定 spec，不视为错误，只跳过
  console.log('spec-check: no --spec given; skipping (use --all to scan all .artifacts/spec-*.json)')
  process.exit(0)
}

const KNOWN_PROFILES = new Set([
  'epg-waterfall',
  'epg-player',
  'ai-search',
  'ai-documentary',
  'ai-person-topic',
  'ai-topic',
  'ai-topic-landing',
  'ai-music',
  'ai-schedule',
])

const REQUIRED = [
  ['pageId',                  v => typeof v === 'string' && v.length > 0],
  ['componentProfile',        v => typeof v === 'string' && v.length > 0],
  ['layout.sections',         v => Array.isArray(v) && v.length > 0],
  ['focus.default',           v => typeof v === 'string' && v.length > 0],
  ['componentPlan',           v => v && typeof v === 'object'],
  ['componentPlan.reuse',     v => Array.isArray(v)],
  ['componentPlan.create',    v => Array.isArray(v)],
  ['imagePlan',               v => v && typeof v === 'object'],
]

function getPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj)
}

async function listSpecs() {
  if (!existsSync(artifactsDir)) return []
  const entries = await readdir(artifactsDir)
  return entries.filter(n => /^spec-.*\.json$/.test(n)).map(n => join(artifactsDir, n))
}

const targets = all
  ? await listSpecs()
  : [resolve(process.cwd(), specArg)]

if (targets.length === 0) {
  console.log('spec-check: no spec files to check')
  process.exit(0)
}

let totalProblems = 0
for (const file of targets) {
  if (!existsSync(file)) {
    console.error(`✗ ${file}: not found`)
    totalProblems += 1
    continue
  }
  let spec
  try {
    spec = JSON.parse(await readFile(file, 'utf8'))
  } catch (err) {
    console.error(`✗ ${file}: invalid JSON — ${err.message}`)
    totalProblems += 1
    continue
  }

  const problems = []
  for (const [path, ok] of REQUIRED) {
    if (!ok(getPath(spec, path))) problems.push(`missing/invalid: ${path}`)
  }

  if (spec.pageId && !/^[a-z][a-z0-9-]*$/.test(spec.pageId)) {
    problems.push(`pageId must be kebab-case: got "${spec.pageId}"`)
  }

  if (spec.componentProfile && !KNOWN_PROFILES.has(spec.componentProfile) && !spec.componentProfile.endsWith('_new')) {
    problems.push(`componentProfile "${spec.componentProfile}" is not in the known set. If introducing a new profile, suffix it with _new and document in pageRegistry.`)
  }

  if (Array.isArray(spec.componentPlan?.create)) {
    spec.componentPlan.create.forEach((c, i) => {
      if (!c.reason || typeof c.reason !== 'string' || c.reason.length < 4) {
        problems.push(`componentPlan.create[${i}] needs a non-empty "reason" (got ${JSON.stringify(c.reason)})`)
      }
      if (!c.name || !/^[A-Z][A-Za-z0-9]*$/.test(c.name)) {
        problems.push(`componentPlan.create[${i}].name must be PascalCase`)
      }
    })
  }

  const label = file.slice(root.length + 1)
  if (problems.length === 0) {
    console.log(`✓ ${label}`)
  } else {
    console.log(`${warnOnly ? '!' : '✗'} ${label}  (${problems.length} issue${problems.length > 1 ? 's' : ''})`)
    for (const p of problems) console.log(`    - ${p}`)
    totalProblems += problems.length
  }
}

if (totalProblems === 0) {
  process.exit(0)
}
console.log('')
console.log(`spec-check: ${totalProblems} issue(s) across ${targets.length} file(s)`)
process.exit(warnOnly ? 0 : 1)
