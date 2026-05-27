/**
 * imagePool.ts — 生成阶段假图统一入口
 *
 * 设计原则（见 docs/GENERATION_STRATEGY.md §5）：
 *   - 不在 JSX 里手贴远程 URL。一律通过 pickImage(category, seed, size)。
 *   - 开发期返回远程 URL（Unsplash 永久 CDN 链接，无需 API key），
 *     提交前跑 `npm run images:localize -- <page>` 把图落到 public/images/<page>/，
 *     并把调用替换为 localImage(...)，让产物完全离线 + 风格不会随机漂。
 *   - 每张图自带署名信息，本地化时写入 public/images/<page>/CREDITS.md。
 *
 * 池的治理：
 *   - 每个 category 的 photo ID 需人工筛选（风格搭、人物合规）。
 *   - 不准随机扩池——任何新增照片走 PR，附预览图。
 *   - 真实人物专题（如 LiuDehua）禁止用本池，详见 GENERATION_STRATEGY §5.4。
 */

export type ImageCategory =
  | 'cinema-poster'
  | 'cinema-landscape'
  | 'landscape-hero'
  | 'person-portrait'
  | 'album-art'
  | 'music-stage'
  | 'abstract-mood'
  | 'food'
  | 'travel'
  | 'tech'
  | 'nature'

export interface PoolImage {
  /** Unsplash photo id，形如 `photo-1518770660439-4636190af475`（去掉前缀 / 后缀） */
  id: string
  author: string
  authorUrl: string
  /** 人类可读描述，便于挑选 */
  note?: string
}

/**
 * 池数据。各分类下手工策展的 Unsplash photo ID。
 *
 * **当前只是种子集**——请用 `npm run image:curate <category> <id> <author> <authorUrl>` 持续扩充。
 * 池空时 pickImage 会降级为 picsum.photos 占位（确保 dev 不卡），并打 console.warn。
 */
export const imagePool: Record<ImageCategory, PoolImage[]> = {
  'cinema-poster': [
    // TODO(curate): 海报感氛围图（电影 / 剧集封面替代）。建议挑选竖向 2:3 或 11:16 构图。
  ],
  'cinema-landscape': [
    // TODO(curate): 横版剧照感图（影院 / 黑场 / 灯光）。建议挑选 16:9。
  ],
  'landscape-hero': [
    // TODO(curate): 横版 hero 背景，氛围感强、文字可叠。
  ],
  'person-portrait': [
    // TODO(curate): 人物肖像（**不可用于真人专题**，只能用于通用「主持人 / 嘉宾」占位）。
  ],
  'album-art': [
    { id: 'photo-1493225457124-a3eb161ffa5f', author: 'Malte Wingen', authorUrl: 'https://unsplash.com/@maltewingen', note: 'headphones close-up, warm tones' },
    { id: 'photo-1514320291840-2e0a9bf2a9ae', author: 'blocks', authorUrl: 'https://unsplash.com/@blocks', note: 'vinyl record on dark surface' },
    { id: 'photo-1470225620780-dba8ba36b745', author: 'Caught In Joy', authorUrl: 'https://unsplash.com/@caughtinjoy', note: 'music notes / abstract' },
    { id: 'photo-1511671782779-c97d3d27a1d4', author: 'Austin Neill', authorUrl: 'https://unsplash.com/@arstyy', note: 'concert performer on stage' },
    { id: 'photo-1524368535928-5b5e00ddc76b', author: 'Namroud Gorguis', authorUrl: 'https://unsplash.com/@namroud', note: 'guitar close-up warm light' },
  ],
  'music-stage': [
    { id: 'photo-1540039155733-5bb30b4f5e62', author: 'Nainoa Shizuru', authorUrl: 'https://unsplash.com/@nainoa', note: 'concert stage wide shot' },
    { id: 'photo-1501386761578-eac5c94b800a', author: 'Nicholas Green', authorUrl: 'https://unsplash.com/@nickxshotz', note: 'crowd at concert, stage lights' },
    { id: 'photo-1459749411175-04bf5292ceea', author: 'Aranxa Esteve', authorUrl: 'https://unsplash.com/@aranxa_esteve', note: 'concert crowd from stage' },
  ],
  'abstract-mood': [
    { id: 'photo-1557672172-298e090bd0f1', author: 'Pawel Czerwinski', authorUrl: 'https://unsplash.com/@pawel_czerwinski', note: 'purple abstract paint' },
    { id: 'photo-1579546929518-9e396f3cc809', author: 'Pawel Czerwinski', authorUrl: 'https://unsplash.com/@pawel_czerwinski', note: 'gradient abstract' },
    { id: 'photo-1558618666-fcd25c85cd64', author: 'Pawel Czerwinski', authorUrl: 'https://unsplash.com/@pawel_czerwinski', note: 'abstract color flow' },
    { id: 'photo-1550684848-fac1c5b4e853', author: 'Pawel Czerwinski', authorUrl: 'https://unsplash.com/@pawel_czerwinski', note: 'abstract blue-orange' },
    { id: 'photo-1618005182384-a83a8bd57fbe', author: 'Pawel Czerwinski', authorUrl: 'https://unsplash.com/@pawel_czerwinski', note: 'abstract vivid gradient' },
  ],
  food: [],
  travel: [],
  tech: [],
  nature: [],
}

/**
 * Unsplash CDN URL 拼接。永久链接，不需 API key。
 *   pickImage('cinema-poster', 'long-jiang-ru-hai', [400, 600])
 *   → https://images.unsplash.com/<id>?w=400&h=600&fit=crop&q=80&auto=format
 */
function unsplashUrl(id: string, w: number, h: number) {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`
}

/**
 * Picsum 占位降级。category 为空时使用，确保 dev 不卡。
 * 用 seed 字符串 hash 成稳定 id，让同一 seed 拿同一张图。
 */
function picsumFallback(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

function hashSeed(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

/**
 * 选一张图。同一 (category, seed) 一定返回同一张图（稳定预览）。
 *
 * @param category 分类，见 ImageCategory。
 * @param seed   人类可读字符串，建议用「实体 id」或「剧名拼音」。
 * @param size   [w, h]，会传给 Unsplash CDN 做服务端裁切；本地化时写入文件名。
 */
export function pickImage(category: ImageCategory, seed: string, size: [number, number]): string {
  const [w, h] = size
  const pool = imagePool[category]
  if (!pool || pool.length === 0) {
    // dev 期降级；提交前 images:localize 会把这个 URL 也本地化掉。
    if (typeof console !== 'undefined') {
      console.warn(`[imagePool] category "${category}" empty; falling back to picsum for seed="${seed}"`)
    }
    return picsumFallback(`${category}/${seed}`, w, h)
  }
  const idx = hashSeed(`${category}/${seed}`) % pool.length
  return unsplashUrl(pool[idx].id, w, h)
}

/**
 * 已本地化的图。images:localize 会把页面里的 pickImage(...) 替换成 localImage(...)。
 *
 * @param page 形如 'music-discover'。
 * @param file 形如 'album-art-hero-1-400x400.jpg'。
 */
export function localImage(page: string, file: string): string {
  return `/images/${page}/${file}`
}

/**
 * 反查一张图的署名（本地化脚本写 CREDITS.md 用）。
 */
export function lookupCredit(category: ImageCategory, seed: string): PoolImage | null {
  const pool = imagePool[category]
  if (!pool || pool.length === 0) return null
  const idx = hashSeed(`${category}/${seed}`) % pool.length
  return pool[idx]
}
