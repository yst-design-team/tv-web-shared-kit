#!/usr/bin/env node
/**
 * verify.mjs — 按 scope 触发现有 smoke / build / lint 子集
 *
 * 用法：
 *   node scripts/verify.mjs --scope=build,lint
 *   node scripts/verify.mjs --scope=focus,layout,app
 *   node scripts/verify.mjs --scope=all
 *   node scripts/verify.mjs --list             # 列出所有 scope
 *
 * 设计原则：
 *   - 不替换任何现有 smoke 脚本，只是按 scope 编排调用。
 *   - 失败任一子任务即 exit 1；成功打印汇总。
 *   - 默认禁止「无 scope 全跑」，强制每次显式指定（避免「保险起见全量」习惯）。
 *
 * 与现有 npm scripts 的关系：
 *   - build:       tsc -b && vite build         （即 npm run build）
 *   - lint:        eslint .                      （即 npm run lint）
 *   - app:         node scripts/app-smoke.mjs
 *   - focus:       node scripts/app-focus-smoke.mjs
 *   - layout:      node scripts/app-layout-smoke.mjs
 *   - storybook:   node scripts/storybook-smoke.mjs
 *   - inventory:   node scripts/inventory-check.mjs
 */

import { spawn } from 'node:child_process'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SCOPES = {
  build:     { kind: 'npm',  name: 'build',                                desc: 'tsc -b && vite build' },
  lint:      { kind: 'npm',  name: 'lint',                                 desc: 'eslint .' },
  app:       { kind: 'node', script: 'app-smoke.mjs',         needsDev: true,  desc: '页面 smoke + console error 检查' },
  focus:     { kind: 'node', script: 'app-focus-smoke.mjs',   needsDev: true,  desc: '默认焦点 + 跨区跳转回归' },
  layout:    { kind: 'node', script: 'app-layout-smoke.mjs',  needsDev: true,  desc: '裁切 / 最后一行露出 / 边缘遮罩' },
  storybook: { kind: 'node', script: 'storybook-smoke.mjs',   needsDev: false, desc: 'Storybook stories 渲染检查' },
  inventory: { kind: 'node', script: 'inventory-check.mjs',   needsDev: false, desc: 'inventory.json 与代码一致性' },
  nomod:     { kind: 'node', script: 'no-mod-check.mjs',      needsDev: false, desc: '禁止改动已有组件（与最近 *-pre snapshot 比对）' },
  style:     { kind: 'node', script: 'style-fingerprint.mjs', needsDev: false, desc: 'token / 字号 / 间距指纹；带 SPEC_PATH 时同时校验 spec' },
  spec:      { kind: 'node', script: 'spec-check.mjs',        needsDev: false, desc: 'spec 字段完整度校验（生成阶段）' },
}

// ---------- args ----------
const args = process.argv.slice(2)

if (args.includes('--list') || args.length === 0) {
  console.log('Available scopes (use --scope=a,b,c):')
  for (const [name, s] of Object.entries(SCOPES)) {
    console.log(`  ${name.padEnd(10)} ${s.desc}`)
  }
  console.log('  all        all of the above')
  if (args.length === 0) {
    console.log('\nerror: --scope is required. Example: node scripts/verify.mjs --scope=build,lint')
    process.exit(2)
  }
  process.exit(0)
}

const scopeArg = args.find(a => a.startsWith('--scope='))
if (!scopeArg) {
  console.error('error: --scope=<a,b,c> is required (use --list to see options)')
  process.exit(2)
}

const raw = scopeArg.split('=')[1] || ''
const requested = raw === 'all'
  ? Object.keys(SCOPES)
  : raw.split(',').map(s => s.trim()).filter(Boolean)

const unknown = requested.filter(s => !SCOPES[s])
if (unknown.length) {
  console.error(`error: unknown scope(s): ${unknown.join(', ')}`)
  console.error('       use --list to see options')
  process.exit(2)
}

// ---------- check needs-dev ----------
const needsDev = requested.some(s => SCOPES[s].needsDev)
if (needsDev) {
  const url = process.env.APP_URL || 'http://127.0.0.1:5173'
  const ok = await fetch(url).then(r => r.ok).catch(() => false)
  if (!ok) {
    console.error(`error: dev server not reachable at ${url}`)
    console.error('       start it first: NODE_ENV=development npm run dev')
    process.exit(2)
  }
}

// 透传给子脚本的参数（--spec=... / --baseline=... / --warn-only 等）
const passthrough = args.filter(a => a.startsWith('--') && !a.startsWith('--scope=') && a !== '--list')

// ---------- run ----------
function run(scope) {
  const s = SCOPES[scope]
  return new Promise(resolve => {
    let cmd, cmdArgs
    if (s.kind === 'npm') {
      cmd = 'npm'
      cmdArgs = ['run', s.name]
    } else {
      cmd = 'node'
      const scriptPath = join(root, 'scripts', s.script)
      if (!existsSync(scriptPath)) {
        console.error(`✗ ${scope.padEnd(10)} missing script: scripts/${s.script}`)
        resolve({ scope, code: 127 })
        return
      }
      cmdArgs = [scriptPath, ...passthrough]
    }

    const env = { ...process.env }
    if (!env.NODE_ENV) env.NODE_ENV = 'development'

    const t0 = Date.now()
    const proc = spawn(cmd, cmdArgs, { cwd: root, stdio: 'inherit', env })
    proc.on('close', code => {
      const dt = ((Date.now() - t0) / 1000).toFixed(1)
      const mark = code === 0 ? '✓' : '✗'
      console.log(`${mark} ${scope.padEnd(10)} ${dt}s${code === 0 ? '' : `  (exit ${code})`}`)
      resolve({ scope, code })
    })
  })
}

const results = []
for (const scope of requested) {
  console.log(`\n── verify: ${scope} (${SCOPES[scope].desc}) ──`)
  results.push(await run(scope))
}

const failed = results.filter(r => r.code !== 0)
console.log('')
console.log('────────────────────────────────────────')
console.log(`verify summary: ${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  for (const f of failed) console.log(`  ✗ ${f.scope} (exit ${f.code})`)
  process.exit(1)
}
