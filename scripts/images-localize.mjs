#!/usr/bin/env node
/**
 * images-localize.mjs — 把页面里 pickImage() 调用产生的远程图本地化
 *
 * 流程：
 *   1. 扫 src/pages/<page>/**.ts(x) 里所有 pickImage('cat', 'seed', [w, h]) 调用
 *   2. 用 imagePool.ts 里的 lookupCredit 查署名；池空则降级 picsum
 *   3. fetch 到 public/images/<page>/<cat>-<seed>-<w>x<h>.<ext>
 *   4. 把对应调用替换为 localImage('<page>', '<file>')
 *   5. 同时移除已不再使用的 pickImage import；若仍需，则补 localImage import
 *   6. 写 public/images/<page>/CREDITS.md
 *
 * 用法：
 *   node scripts/images-localize.mjs <page>              # 一个页面
 *   node scripts/images-localize.mjs <page> --dry-run    # 只打印将做的事
 *   node scripts/images-localize.mjs --all               # 所有 src/pages/<page>/
 *
 * 安全：dry-run 默认建议先跑一遍人审；实落盘后会改 .ts 文件，跟 git diff 一起看。
 */

import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pagesDir = join(root, 'src', 'pages')
const publicImagesDir = join(root, 'public', 'images')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const all = args.includes('--all')
const target = args.find(a => !a.startsWith('--'))

if (!all && !target) {
  console.error('usage: node scripts/images-localize.mjs <page> [--dry-run] | --all')
  process.exit(2)
}

// ---------- imagePool 取数（不引入 ts，直接读源文件） ----------
async function loadImagePool() {
  // imagePool.ts 是纯数据 + 函数；用 spawn node --input-type=module 跑一个 inline 脚本
  // 把它的 imagePool 导出 + lookupCredit 走 stdout 返回。
  // 用 tsx 太重，这里只 grep 提取 pool 字面量，能用就够。
  const src = await readFile(join(root, 'src', 'mocks', 'imagePool.ts'), 'utf8')
  // 极简解析：找 imagePool = { ... }，截到匹配的右大括号。
  const startIdx = src.indexOf('export const imagePool')
  if (startIdx === -1) return new Map()
  const braceStart = src.indexOf('{', startIdx)
  let depth = 0
  let end = -1
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) { end = i + 1; break }
    }
  }
  if (end === -1) return new Map()
  const literal = src.slice(braceStart, end)
  // 替换 ts 注释 + as 断言以便 JSON.parse —— 但 imagePool 含函数？此处仅是数据数组。
  const cleaned = literal
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,\s*([}\]])/g, '$1') // trailing commas
  let parsed
  try {
    // 用 Function 解析对象字面量
    parsed = new Function(`return (${cleaned})`)()
  } catch (err) {
    console.warn(`! imagePool parse failed: ${err.message}; will fall back to picsum for all`)
    return new Map()
  }
  const map = new Map()
  for (const [cat, arr] of Object.entries(parsed)) map.set(cat, Array.isArray(arr) ? arr : [])
  return map
}

function hashSeed(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

function resolveImageUrl(pool, category, seed, w, h) {
  const arr = pool.get(category) || []
  if (arr.length > 0) {
    const idx = hashSeed(`${category}/${seed}`) % arr.length
    const item = arr[idx]
    return {
      url: `https://images.unsplash.com/${item.id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`,
      credit: item,
      source: 'unsplash',
    }
  }
  return {
    url: `https://picsum.photos/seed/${encodeURIComponent(`${category}/${seed}`)}/${w}/${h}`,
    credit: { author: 'Lorem Picsum', authorUrl: 'https://picsum.photos' },
    source: 'picsum',
  }
}

function extFromContentType(ct) {
  if (!ct) return '.jpg'
  if (ct.includes('png')) return '.png'
  if (ct.includes('webp')) return '.webp'
  if (ct.includes('svg')) return '.svg'
  return '.jpg'
}

// ---------- 扫调用 ----------
const PICK_CALL_RE = /pickImage\(\s*(['"`])([\w-]+)\1\s*,\s*(['"`])([^'"`]+)\3\s*,\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]\s*\)/g

async function listPageDirs() {
  const entries = await readdir(pagesDir, { withFileTypes: true })
  return entries.filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name)
}

async function walkTsFiles(dir) {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const abs = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walkTsFiles(abs)))
    else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) out.push(abs)
  }
  return out
}

async function localizeOne(page, pool) {
  const pageDir = join(pagesDir, page)
  if (!existsSync(pageDir)) {
    console.error(`page not found: src/pages/${page}/`)
    return { page, ok: false, reason: 'not found' }
  }
  const outDir = join(publicImagesDir, page)
  const files = await walkTsFiles(pageDir)

  const calls = [] // { file, match, category, seed, w, h }
  for (const file of files) {
    const text = await readFile(file, 'utf8')
    PICK_CALL_RE.lastIndex = 0
    let m
    while ((m = PICK_CALL_RE.exec(text)) !== null) {
      const [match, , category, , seed, wStr, hStr] = m
      calls.push({ file, match, category, seed, w: Number(wStr), h: Number(hStr) })
    }
  }

  if (calls.length === 0) {
    console.log(`(${page}) no pickImage() calls`)
    return { page, ok: true, count: 0 }
  }

  console.log(`(${page}) found ${calls.length} pickImage() call(s)`)
  if (!dryRun) await mkdir(outDir, { recursive: true })

  // 去重（同 category/seed/size 只下载一次）
  const fetchPlan = new Map() // key=cat-seed-WxH → { url, credit, source, file }
  for (const c of calls) {
    const key = `${c.category}-${c.seed}-${c.w}x${c.h}`
    if (!fetchPlan.has(key)) {
      const r = resolveImageUrl(pool, c.category, c.seed, c.w, c.h)
      fetchPlan.set(key, { key, ...r })
    }
  }

  // 下载
  const credits = []
  for (const [key, plan] of fetchPlan) {
    const label = `${key}`
    if (dryRun) {
      console.log(`  [dry] would fetch ${plan.source}  ${plan.url}  → public/images/${page}/${label}.<ext>`)
      plan.localFile = `${label}.jpg`
      continue
    }
    let res
    try {
      res = await fetch(plan.url)
    } catch (err) {
      console.error(`  ✗ ${label}  fetch error: ${err.message}`)
      continue
    }
    if (!res.ok) {
      console.error(`  ✗ ${label}  HTTP ${res.status}`)
      continue
    }
    const ct = res.headers.get('content-type') || ''
    const ext = extFromContentType(ct)
    const filename = `${label}${ext}`
    const localAbs = join(outDir, filename)
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(localAbs, buf)
    plan.localFile = filename
    credits.push({ filename, ...plan })
    console.log(`  ✓ ${filename.padEnd(48)} ${(buf.length / 1024).toFixed(0)} KB  ${plan.source}`)
  }

  // 改源文件
  let touchedFiles = 0
  for (const file of files) {
    let text = await readFile(file, 'utf8')
    const before = text
    text = text.replace(PICK_CALL_RE, (match, _q1, category, _q2, seed, wStr, hStr) => {
      const key = `${category}-${seed}-${wStr}x${hStr}`
      const plan = fetchPlan.get(key)
      if (!plan || !plan.localFile) return match
      return `localImage('${page}', '${plan.localFile}')`
    })
    if (text === before) continue

    // import 维护：若文件用了 localImage 且未 import 则加；若不再含 pickImage 则去掉 pickImage import
    const usesLocal = /localImage\(/.test(text)
    const usesPick = /pickImage\(/.test(text)
    const importLine = text.match(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*mocks\/imagePool['"]/)
    if (importLine) {
      const items = importLine[0].match(/\{([^}]+)\}/)[1].split(',').map(s => s.trim()).filter(Boolean)
      const next = new Set(items)
      if (usesLocal) next.add('localImage')
      if (!usesPick) next.delete('pickImage')
      const importPath = importLine[0].match(/from\s*['"]([^'"]+)['"]/)[1]
      const newImport = `import { ${[...next].join(', ')} } from '${importPath}'`
      text = text.replace(importLine[0], newImport)
    } else if (usesLocal) {
      // 文件原本没有 imagePool import，需要新加（推断相对路径）
      const rel = relativeImportFromFile(file)
      text = `import { localImage } from '${rel}'\n${text}`
    }

    if (dryRun) {
      console.log(`  [dry] would patch ${shortPath(file)}`)
    } else {
      await writeFile(file, text)
      touchedFiles += 1
    }
  }

  // CREDITS.md
  if (!dryRun && credits.length > 0) {
    const lines = [
      `# Image credits for /${page}`,
      '',
      'Generated by `npm run images:localize`. Do not edit manually.',
      '',
      '| File | Source | Author | Link |',
      '| --- | --- | --- | --- |',
      ...credits.map(c => `| ${c.filename} | ${c.source} | ${c.credit.author || '-'} | ${c.credit.authorUrl || '-'} |`),
    ]
    await writeFile(join(outDir, 'CREDITS.md'), lines.join('\n') + '\n')
    console.log(`  ✓ wrote CREDITS.md (${credits.length} entries)`)
  }

  console.log(`(${page}) done: ${fetchPlan.size} unique image(s), ${touchedFiles} source file(s) patched`)
  return { page, ok: true, count: fetchPlan.size }
}

function relativeImportFromFile(fileAbs) {
  const rel = fileAbs.slice(root.length + 1).replace(/\\/g, '/')
  const depth = rel.split('/').length - 1 - 1 // -1 file itself, -1 cuz src/ root
  const up = '../'.repeat(Math.max(1, depth))
  return `${up}mocks/imagePool`
}

function shortPath(p) {
  return p.slice(root.length + 1)
}

// ---------- main ----------
const pool = await loadImagePool()
const pages = all ? await listPageDirs() : [target]

let okCount = 0
for (const page of pages) {
  const r = await localizeOne(page, pool)
  if (r.ok) okCount += 1
  console.log('')
}
console.log(`summary: ${okCount}/${pages.length} page(s) processed${dryRun ? ' [dry-run]' : ''}`)
