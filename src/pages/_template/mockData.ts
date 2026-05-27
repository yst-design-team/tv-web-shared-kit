/**
 * mockData.ts —— 假数据集中地。文件名固定 `mockData.ts`，便于以后接真 API 时一文件替换。
 *
 * 约定（详见 docs/CONTENT_GUIDE.md）：
 *   - 命名前缀用 PageName（驼峰），如 `musicDiscoverHero`
 *   - 每条数据带稳定 id，便于 focusKey 推导
 *   - 文案：现实题材但虚构（避开真实 IP）
 *   - 时间：相对今天的真实分布（"今晚 20:00"）
 *   - 评分：7.5–9.5
 *   - 图片：一律走 pickImage(category, seed, size)，不要内联 URL
 */

import { pickImage } from '../../mocks/imagePool'

export interface TemplateHero {
  id: string
  title: string
  subtitle: string
  meta: string
  cover: string
}

export interface TemplateRailItem {
  id: string
  title: string
  meta: string
  cover: string
}

// RENAME: 把所有 `templatePage` 前缀替换为你的页面 camelCase 名（如 musicDiscover）
export const templatePageHero: TemplateHero = {
  id: 'hero',
  title: '南岭夜行',
  subtitle: '12 集自然纪录片 · 2026 春',
  meta: '今晚 20:00 · CCTV-9',
  cover: pickImage('landscape-hero', 'template-hero', [1280, 480]),
}

export const templatePageRail: TemplateRailItem[] = [
  {
    id: 'rail-1',
    title: '长江入海',
    meta: '36 集 · 评分 8.7',
    cover: pickImage('cinema-landscape', 'rail-1', [320, 180]),
  },
  {
    id: 'rail-2',
    title: '城与火',
    meta: '24 集 · 评分 9.1',
    cover: pickImage('cinema-landscape', 'rail-2', [320, 180]),
  },
  {
    id: 'rail-3',
    title: '风过塞外',
    meta: '8 集 · 评分 8.4',
    cover: pickImage('cinema-landscape', 'rail-3', [320, 180]),
  },
  {
    id: 'rail-4',
    title: '南国旧影',
    meta: '16 集 · 评分 8.9',
    cover: pickImage('cinema-landscape', 'rail-4', [320, 180]),
  },
]
