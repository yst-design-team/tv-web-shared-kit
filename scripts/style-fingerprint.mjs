#!/usr/bin/env node
/**
 * style-fingerprint.mjs — 抽取「现有页面到底用了哪些 token / 字号 / 间距」，并对比 spec
 *
 * 思路：把 src/pages/**.css 里所有 `var(--...)` 收集成「已在用 token 集合」；
 *      把 .tsx / .css 里所有 `\d+(px|rem)` 收集成「页面用到的字号 / 间距」。
 *      给定 spec 文件（.artifacts/spec-*.json），对比其 tokens.* 数组：
 *        - 已在用 → ✓
 *        - 不在 tokens.css 里 → ✗ 致命
 *        - 在 tokens.css 但没人用过 → ! 警告（提示要么取消、要么明确知道是首次使用）
 *
 * 用法：
 *   node scripts/style-fingerprint.mjs                     # 只 dump 指纹
 *   node scripts/style-fingerprint.mjs --json              # JSON 输出（CI 用）
 *   node scripts/style-fingerprint.mjs --spec=.artifacts/spec-music.json
 *
 * 退出：
 *   0 通过
 *   1 spec 引用了不存在的 token
 *   2 参数错误
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pagesDir = join(root, 'src', 'pages')
const componentsDir = join(root, 'src', 'components')
const tokensFile = join(root, 'src', 'tokens', 'tokens.css')

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const specArg = args.find(a => a.startsWith('--spec='))?.split('=')[1]

// ---------- collectors ----------
async function walk(dir, exts) {
  const out = []
  if (!existsSync(dir)) return out
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue
    const abs = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(abs, exts)))
    else if (e.isFile() && exts.some(x => e.name.endsWith(x))) out.push(abs)
  }
  return out
}

async function readAll(files) {
  return Promise.all(files.map(async f => ({ file: f, text: await readFile(f, 'utf8') })))
}

// ---------- tokens.css 里全部声明的 var ----------
let declaredTokens = new Set()
if (existsSync(tokensFile)) {
  const tokenText = await readFile(tokensFile, 'utf8')
  for (const m of tokenText.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)) declaredTokens.add(m[1])
}

// ---------- 已在用 token：扫所有 .css + .tsx ----------
const cssFiles = [...await walk(pagesDir, ['.css']), ...await walk(componentsDir, ['.css'])]
const tsxFiles = [...await walk(pagesDir, ['.tsx']), ...await walk(componentsDir, ['.tsx'])]

const usedTokens = new Set()
const usedPx = new Set()
const usedFontSizes = new Set()
const inlineHexColors = []  // 用于反模式审计

for (const { file, text } of await readAll([...cssFiles, ...tsxFiles])) {
  for (const m of text.matchAll(/var\(\s*--([a-zA-Z0-9_-]+)/g)) usedTokens.add(m[1])
  for (const m of text.matchAll(/(\d{2,4})px/g)) usedPx.add(Number(m[1]))
  for (const m of text.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)) usedFontSizes.add(Number(m[1]))
  for (const m of text.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    // 排除 .tsx 里被字符串/路径包裹的；仅 .css 内的 inline 颜色才算违规
    if (file.endsWith('.css')) inlineHexColors.push({ file: file.slice(root.length + 1), color: `#${m[1]}` })
  }
}

const fingerprint = {
  declaredTokenCount: declaredTokens.size,
  usedTokenCount: usedTokens.size,
  usedTokens: [...usedTokens].sort(),
  unusedDeclaredTokens: [...declaredTokens].filter(t => !usedTokens.has(t)).sort(),
  usedPx: [...usedPx].sort((a, b) => a - b),
  usedFontSizes: [...usedFontSizes].sort((a, b) => a - b),
  inlineHexInCss: inlineHexColors,
}

// ---------- 比对 spec ----------
let specReport = null
if (specArg) {
  const specPath = resolve(process.cwd(), specArg)
  if (!existsSync(specPath)) {
    console.error(`error: spec not found: ${specPath}`)
    process.exit(2)
  }
  const spec = JSON.parse(await readFile(specPath, 'utf8'))
  const requested = [
    ...(spec.tokens?.colors  || []),
    ...(spec.tokens?.fonts   || []),
    ...(spec.tokens?.spacing || []),
  ].map(t => t.replace(/^--/, ''))

  const missing = requested.filter(t => !declaredTokens.has(t))
  const firstUse = requested.filter(t => declaredTokens.has(t) && !usedTokens.has(t))
  const reused = requested.filter(t => usedTokens.has(t))

  specReport = { spec: specArg, missing, firstUse, reused }
}

// ---------- output ----------
if (asJson) {
  console.log(JSON.stringify({ fingerprint, specReport }, null, 2))
  process.exit(specReport?.missing.length ? 1 : 0)
}

console.log(`tokens declared: ${fingerprint.declaredTokenCount}`)
console.log(`tokens in use  : ${fingerprint.usedTokenCount}`)
console.log(`tokens unused  : ${fingerprint.unusedDeclaredTokens.length}  ${fingerprint.unusedDeclaredTokens.length ? '(could be removed or are designed as future use)' : ''}`)
console.log(`distinct px values in CSS+TSX: ${fingerprint.usedPx.length}`)
console.log(`distinct font-size px values : ${fingerprint.usedFontSizes.length}  → ${fingerprint.usedFontSizes.join(', ')}`)
if (fingerprint.inlineHexInCss.length) {
  console.log(`! inline #hex colors in .css (should use tokens): ${fingerprint.inlineHexInCss.length}`)
  for (const x of fingerprint.inlineHexInCss.slice(0, 10)) console.log(`    ${x.color}  ${x.file}`)
  if (fingerprint.inlineHexInCss.length > 10) console.log(`    ... and ${fingerprint.inlineHexInCss.length - 10} more`)
}

if (specReport) {
  console.log('')
  console.log(`── spec check: ${specReport.spec} ──`)
  console.log(`  reused (already in use)     : ${specReport.reused.length}`)
  console.log(`  first-use (declared, unused): ${specReport.firstUse.length}${specReport.firstUse.length ? ' → ' + specReport.firstUse.join(', ') : ''}`)
  if (specReport.missing.length) {
    console.log(`  ✗ MISSING (not in tokens.css): ${specReport.missing.length}`)
    for (const t of specReport.missing) console.log(`      --${t}`)
    console.log('')
    console.log('  fix: either add the token to src/tokens/tokens.css (separate PR),')
    console.log('       or revise the spec to reuse an existing token.')
    process.exit(1)
  } else {
    console.log('  ✓ all spec tokens exist in tokens.css')
  }
}
