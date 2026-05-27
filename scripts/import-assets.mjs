#!/usr/bin/env node
/**
 * import-assets.mjs — Figma 资产批量落盘 + 校验
 *
 * 用法：
 *   node scripts/import-assets.mjs <manifest.json>
 *
 * manifest.json 格式：
 *   {
 *     "outDir": "public/images/waterfall/cards",         // 相对仓库根，必填
 *     "defaults": {                                        // 选填，所有 asset 默认值
 *       "bleed": 2,                                        //   预期透明边外扩像素，0=不允许透明边
 *       "expectedColorType": "rgba"                        //   rgba|rgb|palette|gray|*  (* = 不校验)
 *     },
 *     "assets": [
 *       {
 *         "id": "hero-aism",                               // 必填，日志/manifest key
 *         "src": "https://www.figma.com/api/mcp/asset/<uuid>",  // 必填，HTTP/HTTPS URL
 *         "out": "hero.png",                               // 必填，相对 outDir 的目标文件名
 *         "expectedSize": [540, 322],                      // 选填，[w,h]；不一致直接失败
 *         "bleed": 0,                                      // 选填，覆盖 defaults.bleed
 *         "note": "..."                                    // 选填，写入产出 manifest
 *       }
 *     ]
 *   }
 *
 * 输出：
 *   <outDir>/<out>                  落盘文件
 *   <outDir>/import-manifest.json   每条资产的真实尺寸 / alpha 探针 / 校验结果
 *
 * 退出码：
 *   0  全部通过
 *   1  任一资产失败（404 / 尺寸不符 / 透明边超预算 / 写入失败）
 *
 * 设计原则：
 *   - 只用 Node 内置模块；alpha 边探针走 python3 + PIL（与 DESIGN_INCIDENTS E24 一致），
 *     若 python3 不可用则降级为「仅尺寸 + 文件头」校验并在 manifest 里标注 skipped。
 *   - 不引入新 npm 依赖；不动 .versions / snapshot 机制。
 *   - 失败时打印逐条原因，不抛 stack trace。
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ---------- CLI ----------
const manifestPath = process.argv[2]
if (!manifestPath) {
  console.error('usage: node scripts/import-assets.mjs <manifest.json>')
  process.exit(2)
}

const manifestAbs = resolve(process.cwd(), manifestPath)
if (!existsSync(manifestAbs)) {
  console.error(`manifest not found: ${manifestAbs}`)
  process.exit(2)
}

let plan
try {
  plan = JSON.parse(await readFile(manifestAbs, 'utf8'))
} catch (err) {
  console.error(`failed to parse manifest: ${err.message}`)
  process.exit(2)
}

if (!plan.outDir || !Array.isArray(plan.assets) || plan.assets.length === 0) {
  console.error('manifest must contain outDir and non-empty assets[]')
  process.exit(2)
}

const outDirAbs = resolve(root, plan.outDir)
await mkdir(outDirAbs, { recursive: true })

const defaults = plan.defaults || {}
const pyOk = checkPython()
if (!pyOk) {
  console.warn('! python3 + PIL not available; alpha edge probe will be skipped')
}

// ---------- PNG header parser (zero deps) ----------
function parsePngHeader(buf) {
  // signature: 89 50 4E 47 0D 0A 1A 0A
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (buf.length < 33 || buf.slice(0, 8).compare(sig) !== 0) return null
  if (buf.slice(12, 16).toString('ascii') !== 'IHDR') return null
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  const bitDepth = buf[24]
  const colorType = buf[25]
  const colorName = ({ 0: 'gray', 2: 'rgb', 3: 'palette', 4: 'gray+alpha', 6: 'rgba' })[colorType] || `unknown(${colorType})`
  return { width, height, bitDepth, colorType: colorName }
}

function parseSvgViewBox(text) {
  const m = text.match(/viewBox\s*=\s*"([^"]+)"/i) || text.match(/viewBox\s*=\s*'([^']+)'/i)
  if (!m) return null
  const parts = m[1].trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null
  return { width: parts[2], height: parts[3] }
}

// ---------- python3 + PIL probe ----------
function checkPython() {
  const r = spawnSync('python3', ['-c', 'from PIL import Image'], { encoding: 'utf8' })
  return r.status === 0
}

function probeAlphaEdge(absPath) {
  // Returns { left, right, top, bottom } = pixels of fully-transparent edge.
  const script = `
import sys
from PIL import Image
m = Image.open(sys.argv[1]).convert('RGBA')
w, h = m.size
def scan_h(rng, x_fn):
    for i in rng:
        x = x_fn(i)
        if any(m.getpixel((x, y))[3] != 0 for y in range(0, h, max(1, h // 32))):
            return i
    return min(len(rng), w)
def scan_v(rng, y_fn):
    for i in rng:
        y = y_fn(i)
        if any(m.getpixel((x, y))[3] != 0 for x in range(0, w, max(1, w // 32))):
            return i
    return min(len(rng), h)
left   = scan_h(range(w), lambda i: i)
right  = scan_h(range(w), lambda i: w - 1 - i)
top    = scan_v(range(h), lambda i: i)
bottom = scan_v(range(h), lambda i: h - 1 - i)
print(f"{left} {right} {top} {bottom}")
`
  const r = spawnSync('python3', ['-c', script, absPath], { encoding: 'utf8' })
  if (r.status !== 0) return null
  const [left, right, top, bottom] = r.stdout.trim().split(/\s+/).map(Number)
  return { left, right, top, bottom }
}

// ---------- fetch ----------
async function fetchToBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

// ---------- main loop ----------
const records = []
let failed = 0

for (const asset of plan.assets) {
  const id = asset.id || asset.out || '(unknown)'
  const reasons = []

  if (!asset.src) { reasons.push('missing src'); recordFailure(asset, reasons); continue }
  if (!asset.out) { reasons.push('missing out'); recordFailure(asset, reasons); continue }

  const ext = extname(asset.out).toLowerCase()
  const target = join(outDirAbs, asset.out)
  await mkdir(dirname(target), { recursive: true })

  let buf
  try {
    buf = await fetchToBuffer(asset.src)
  } catch (err) {
    reasons.push(`fetch failed: ${err.message}`)
    recordFailure(asset, reasons)
    continue
  }

  await writeFile(target, buf)

  let dims = null
  let colorType = null
  let alphaEdge = null
  let alphaSkipped = false

  if (ext === '.png') {
    const hdr = parsePngHeader(buf)
    if (!hdr) {
      reasons.push('invalid PNG header')
    } else {
      dims = { width: hdr.width, height: hdr.height }
      colorType = hdr.colorType

      if (asset.expectedSize) {
        const [w, h] = asset.expectedSize
        if (hdr.width !== w || hdr.height !== h) {
          reasons.push(`size mismatch: got ${hdr.width}x${hdr.height}, expected ${w}x${h}`)
        }
      }

      const expectedColor = asset.expectedColorType || defaults.expectedColorType
      if (expectedColor && expectedColor !== '*' && !colorType.includes(expectedColor)) {
        reasons.push(`color type mismatch: got ${colorType}, expected ${expectedColor}`)
      }

      if (pyOk) {
        alphaEdge = probeAlphaEdge(target)
        const bleedLimit = asset.bleed ?? defaults.bleed ?? null
        if (alphaEdge && bleedLimit !== null) {
          const max = Math.max(alphaEdge.left, alphaEdge.right, alphaEdge.top, alphaEdge.bottom)
          if (max > bleedLimit) {
            reasons.push(`transparent edge ${max}px exceeds bleed budget ${bleedLimit}px (edges=${JSON.stringify(alphaEdge)})`)
          }
        }
      } else {
        alphaSkipped = true
      }
    }
  } else if (ext === '.svg') {
    const text = buf.toString('utf8')
    const vb = parseSvgViewBox(text)
    if (vb) dims = vb
    if (asset.expectedSize && vb) {
      const [w, h] = asset.expectedSize
      if (vb.width !== w || vb.height !== h) {
        reasons.push(`viewBox mismatch: got ${vb.width}x${vb.height}, expected ${w}x${h}`)
      }
    }
  } else {
    // other formats: only existence is checked
    dims = null
  }

  records.push({
    id,
    src: asset.src,
    out: asset.out,
    bytes: buf.length,
    dims,
    colorType,
    alphaEdge,
    alphaSkipped,
    note: asset.note,
    ok: reasons.length === 0,
    reasons,
  })

  if (reasons.length > 0) failed += 1

  const stamp = reasons.length === 0 ? '✓' : '✗'
  const label = dims ? `${dims.width}x${dims.height}` : `${buf.length}B`
  console.log(`${stamp} ${id.padEnd(28)} ${label.padEnd(11)} ${asset.out}${reasons.length ? '  — ' + reasons.join('; ') : ''}`)
}

function recordFailure(asset, reasons) {
  records.push({
    id: asset.id || asset.out,
    src: asset.src,
    out: asset.out,
    ok: false,
    reasons,
  })
  failed += 1
  console.log(`✗ ${(asset.id || asset.out || '(unknown)').padEnd(28)} ${'—'.padEnd(11)} ${asset.out || ''}  — ${reasons.join('; ')}`)
}

// ---------- write manifest ----------
const out = {
  source: manifestAbs,
  outDir: plan.outDir,
  createdAt: new Date().toISOString(),
  pythonProbeAvailable: pyOk,
  assets: records,
  summary: {
    total: records.length,
    ok: records.filter(r => r.ok).length,
    failed,
  },
}
const manifestOut = join(outDirAbs, 'import-manifest.json')
await writeFile(manifestOut, JSON.stringify(out, null, 2))

console.log('')
console.log(`manifest: ${manifestOut}`)
console.log(`summary : ${out.summary.ok}/${out.summary.total} passed${failed ? `, ${failed} failed` : ''}`)

if (failed > 0) process.exit(1)
