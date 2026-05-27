# GENERATION_STRATEGY — 生成新页面 / 新组件 的整体策略

> 本文是 [`OPERATION_PLAYBOOKS.md`](./OPERATION_PLAYBOOKS.md) §3「生成」的展开版，专门覆盖以下场景：
> - **G1 原型驱动**：用户给 Figma 节点 / 截图 / 草图，按现有设计系统复刻。
> - **G2 自主设计**：用户只给文字 brief，从零设计页面 + 数据 + 图。
>
> 与主规则 [`DESIGN_RULES.md`](./DESIGN_RULES.md) 并行，主规则解决「视觉对不对」，本文解决「生成流程怎么走、风格不漂移、老组件不被动」。

---

## 0. 七条硬不变量（任一违反即停下）

1. **禁止修改 `src/components/<已有>/` 任何文件。** 由 `scripts/no-mod-check.mjs` 在 pre-commit 与 `verify --scope=nomod` 双重拦截。需要改老组件，开一个独立的 modify session，不能与 generate 任务混提。
2. **不准添加新 token。** 颜色 / 字号 / 间距 / 圆角 / 阴影只用 `src/tokens/tokens.css` 既有项。如确实没有合适的，先停下、单独立项添加 token，再回来做生成。
3. **新组件必须有 `Name.stories.tsx`，覆盖 default / focused / selected / disabled 四态**（不适用的态也要在 story 里写一句注释说明为什么不适用），否则 `verify --scope=storybook` 视作未完成。
4. **新组件必须登记进 `docs/component-inventory.json`**（不登记 = `inventory:check` 失败）。
5. **页面必须在 `src/pageRegistry.ts` 注册并选定 `componentProfile`**（参见 `PAGE_IMPLEMENTATION_CHECKLIST §1, §2`）。需要新 profile 单独立项。
6. **假数据集中放 `src/pages/<page>/mockData.ts`**——不准撒在组件里、不准 inline 写大段数组。命名固定 `mockData.ts`，导出命名 `<PageName>Mock` 前缀。
7. **图片统一过 `src/mocks/imagePool.pickImage()`**——不在 JSX 里手贴 `https://...`；远程 URL 在开发期使用，提交前必须运行 `npm run images:localize -- <page>` 落到 `public/images/<page>/`。

---

## 1. Reuse Probe（生成开工前 90 秒）

老规则三栏（复用 / 扩 variant / 新建）在新约束下退化为**两栏**：

| 决策 | 触发条件 | 操作 |
| --- | --- | --- |
| **as-is 复用** | `component-inventory.json` 里有 responsibility 命中，且现有 variants 足够 | 直接 import，写 props |
| **新建组件** | 命中但 variants 不够（不能改老的），或视觉责任本身全新 | 走 §3 的新组件流程 |

中间「扩 variant」彻底删除——因为「不许改老组件」让这条选项不存在。这反而简化了决策：要么复用，要么新建，不再纠结。

**90 秒 Probe 输出**（写在 PR description 或 chat 顶部）：

```
复用：MediaCard(kind=vod,size=M), TextButton(variant=filled,size=L), DUIBubble(status=replied)
新建：<HeroBanner> — 视觉责任 hero-banner-with-overlay，inventory 无命中
     <RankingBadge> — 视觉责任 ranking-badge-1-3，TopicBadge 现有 tone 不覆盖
```

每个「新建」必须给出一句话理由。理由是「我懒得查 inventory」「我嫌 props 多」是无效的——这两种应当回到 as-is 复用。

---

## 2. 两个子模式的流程

### G1 原型驱动（给 Figma / 截图）

1. **填开场卡片** + 标 `意图=生成`。
2. **Plan**（参考 `OPERATION_PLAYBOOKS §1.1` 的 Figma 取数批处理），输出 `.artifacts/plan-<page>.json`，含 tokenDiff（必须为空，否则停）、componentDiff（两栏）、assets、focusTopo。
3. **Reuse Probe** 落在 plan 里。
4. **Build**：
   - 切图：`npm run import-assets -- .artifacts/plan-<page>.json`
   - cp 骨架：`cp -r src/pages/_template/ src/pages/<page>/`
   - 写 `mockData.ts`（包含 `pickImage()` 调用）
   - 装配 JSX，注册到 `pageRegistry.ts`
   - 新组件按 §3 流程建
5. **images:localize**：`npm run images:localize -- <page>`
6. **Verify**：`npm run verify -- --scope=storybook,app,build,lint,inventory,nomod`
7. **snapshot**：`npm run snapshot -- generate-<page>-post`

### G2 自主设计（只给文字 brief）

G2 多一个 **Spec 阶段**（必填，软检查），把「我想象的页面长什么样」逐字落成机器可读结构，再开始动代码。

1. **填开场卡片**。
2. **Spec**：`.artifacts/spec-<page>.json`，结构见 §4。必填字段不齐时 `verify --scope=spec` 给警告（不 fail，让你能临时绕过，但每次都会提醒）。
3. **Style Fingerprint 检查**：`npm run style:fingerprint -- .artifacts/spec-<page>.json` 比对 spec 选用的 token / 字号 / 间距是否在现有页面用过；出现「全新值」就警告。
4. **Reuse Probe** + 后续与 G1 一致。

差异本质：G1 的「事实源」是 Figma，所以可以省 spec；G2 的「事实源」就是 spec 本身，跳过它等于没事实源。

---

## 3. 新组件流程（强约束）

```
src/components/<Name>/
  <Name>.tsx
  <Name>.css
  <Name>.stories.tsx       # 必须有；覆盖 default/focused/selected/disabled
  index.ts                 # 必须 named export
```

新组件**只能消费**：

- `tokens.css` 里的 CSS 变量
- `src/components/Icon` 里的 IconName（不准在新组件里塞内联 SVG，新图标加到 `src/assets/icons/` 并扩 `iconRegistry`）
- `src/focus/` 里的 `<Focusable>` / `<FocusSection>`
- 其他**已发布**的组件（注意：不能改它们，但可以装它们）

新组件**禁止**：

- 内联颜色 `#xxxxxx`、内联 px 数字（除布局的 `transform / position` 外，所有视觉值过 token）
- 套 FocusRing 在按钮上（违反 E1）
- 自己实现"假光标"输入（违反 E34，input 必须用原生 `<input>`）

完成后同步动作：

1. 在 `component-inventory.json` 新增条目，至少填 name / dir / tier=page-local-or-T2-或-T3 / responsibilities / variants / notes
2. `npm run inventory:sync` 自动回填 consumers
3. `docs/component-inventory.md` 也加一行（人类可读源）

---

## 4. Spec 格式（G2 必填）

`.artifacts/spec-<page>.json`：

```jsonc
{
  "pageId": "music-discover",
  "label": "音乐发现页",
  "componentProfile": "ai-music",            // 必须是 pageRegistry 里已存在的 profile
  "scene": "ai-space",                       // ai-space | epg | player
  "duiMode": "page-local",                   // page-local | epg-dock
  "layout": {
    "header": "TopBar with 4 nav tabs",
    "sections": [
      { "id": "hero", "kind": "single-card", "component": "RecSlotCard" },
      { "id": "rail-recent", "kind": "horizontal-rail", "item": "MediaCard", "itemCount": 8 },
      { "id": "rail-mood", "kind": "horizontal-rail", "item": "TopicCard",  "itemCount": 6 }
    ],
    "dui": "right-column AssistantInput + DUIBubble feed"
  },
  "focus": {
    "default": "hero",
    "edges": [
      { "from": "hero", "right": "rail-recent[0]", "down": "rail-recent[0]" },
      { "from": "rail-recent[last]", "right": "dui-input" }
    ]
  },
  "tokens": {
    "colors":  ["--color-bg-page-dark", "--color-text-dark-1", "--color-primary"],
    "fonts":   ["--font-section-title-size", "--font-poster-title-size"],
    "spacing": ["--space-stage-bottom-breathing"]
  },
  "componentPlan": {
    "reuse":  ["TopBar", "RecSlotCard", "MediaCard", "TopicCard", "DUIBubble", "AssistantInput"],
    "create": [
      {
        "name": "MoodChip",
        "reason": "圆形心情标签，TopicBadge 现有 tone 都偏严肃，新视觉责任 mood-chip",
        "states": ["default", "focused", "selected"]
      }
    ]
  },
  "imagePlan": {
    "hero":         { "category": "music-stage",  "count": 1, "size": [1280, 480] },
    "rail-recent":  { "category": "album-art",    "count": 8, "size": [400, 400] },
    "rail-mood":    { "category": "abstract-mood", "count": 6, "size": [320, 320] }
  },
  "mockDataPlan": {
    "entities": ["track", "album", "mood-tag"],
    "trackCount": 24,
    "albumCount": 12,
    "moodTags": ["放松", "专注", "睡前", "通勤", "运动", "聚会"]
  }
}
```

最少必填：`pageId / componentProfile / layout.sections / focus.default / componentPlan / imagePlan`。其它可省。

---

## 5. 图片策略（精选 Unsplash 池 + 构建时本地化）

### 5.1 池的组织

`src/mocks/imagePool.ts` 维护一份分类索引：

```ts
export const imagePool = {
  'cinema-poster':    [{ id: 'photo-1489599...', author: 'X', authorUrl: '...' }, ...],
  'person-portrait':  [...],
  'landscape-hero':   [...],
  'album-art':        [...],
  'food':             [...],
  // ...
}
```

每张图记 `id`（Unsplash 永久路径段，形如 `photo-<numeric>-<hash>`）、`author`、`authorUrl`。url 拼接走 `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format`，**不需 API key**，因为是永久 CDN 链接。

### 5.2 `pickImage(category, seed, size)`

```ts
import { pickImage } from '@/mocks/imagePool'
const poster = pickImage('cinema-poster', 'long-jiang-ru-hai', [400, 600])
// → 'https://images.unsplash.com/photo-1489599.../?w=400&q=80&auto=format'
```

`seed` 用人能读的字符串（剧名 / 节目 id），保证「同一 seed → 同一张图」，预览稳定。

### 5.3 本地化

提交前必须跑 `npm run images:localize -- <page>`：

1. 扫 `src/pages/<page>/` 里所有 `pickImage(...)` 调用，提取 (category, seed, size) 三元组
2. 按三元组生成 `public/images/<page>/<category>-<seed>-<w>x<h>.jpg`，fetch 后落盘
3. 把 mockData.ts 里对应的 `pickImage(...)` 包装替换为 `localImage('<page>', '<category>-<seed>-<w>x<h>.jpg')`，保留原 (category, seed, size) 作 inline 注释
4. 生成 `public/images/<page>/CREDITS.md`，列摄影师 + Unsplash 链接

### 5.4 边界

- **不准用于真实人物专题**。LiuDehua / 其它真人专题页只能用插画占位或你自己授权的图——Unsplash 不能锁定特定人脸，会出现错配。
- **海报类要谨慎**。`cinema-poster` 池本质是「电影感氛围图」，不是真海报；如需仿真海报视觉，要么走插画风，要么用一个固定的海报半透明遮罩 + 标题文字组合。
- **可视审阅**。任何新增到池的图，必须我或你目视确认风格搭，不接受批量随机扩池。

---

## 6. 假数据规范

`src/pages/<page>/mockData.ts` 的约定：

```ts
import { pickImage } from '@/mocks/imagePool'

export interface MusicDiscoverTrack { ... }

export const musicDiscoverHero: MusicDiscoverTrack = {
  id: 'hero-1',
  title: '夜色温柔',
  subtitle: '王嘉尔 · 2025-09',
  cover: pickImage('album-art', 'hero-1', [1280, 480]),
}

export const musicDiscoverRailRecent: MusicDiscoverTrack[] = [...]
```

- 类型在文件顶部定义（不必在 src 别处建 types）
- 每条数据带稳定 `id`，便于 focusKey 推导
- 文案使用现实题材但虚构的剧名 / 歌名（避开真实 IP）
- 时间戳用相对今天的真实分布（"今晚 20:00"），不写 1970
- 评分集中在 7.5–9.5；时长 / 集数 / 计数走合理范围
- 内容指南详见 `docs/CONTENT_GUIDE.md`（待建）

---

## 7. 页面骨架模板 `src/pages/_template/`

cp 之后可立即跑通。建议内容：

```
src/pages/_template/
  TemplatePage.tsx          # 用最小 layout 演示 Stage + Focus + TopBar + DUI
  TemplatePage.css
  mockData.ts               # 含 pickImage 示例
  README.md                 # 5 行：如何 rename、必改的 3 个常量
```

生成新页面时：

```bash
cp -r src/pages/_template src/pages/<NewPage>
# 改 className、改 pageId 常量、注册 pageRegistry、跑 verify
```

---

## 8. 验证 scope 映射

| 操作 | scope |
| --- | --- |
| Plan / Spec 阶段 | `inventory` |
| 生成中（迭代组件） | `storybook,lint,inventory` |
| 生成完成自检 | `storybook,app,build,lint,inventory,nomod` |
| 提交前 | `storybook,app,build,lint,inventory,nomod`（pre-commit 额外跑 `nomod`） |
| CI（如启用） | `all` |

`nomod` 是新增 scope，对应 `scripts/no-mod-check.mjs`：

- 与最近一个 `*-pre` snapshot 做 diff
- 若 `src/components/<已有>/**` 有任何变化（包括 css / stories / index.ts），exit 1
- 新增 `src/components/<新名>/` 不算违反

---

## 9. 与 PAGE_IMPLEMENTATION_CHECKLIST 的关系

本文回答「生成一个新页面整体怎么走、风格怎么不漂移、老组件怎么不被动」；checklist 回答「页面级别要勾哪些点」。
G1 / G2 都必须走完 checklist；本文额外加的 7 条不变量与 spec 流程是它的前置。

---

## 10. 反模式（停下来）

- 直接修改 `src/components/<已有>/*.tsx` 来让现有组件「更通用」——这是禁止的，新建组件。
- 在新组件里写 `color: #5864cb`——用 `--color-primary` token。
- mockData 撒在组件 props inline——挪到 `mockData.ts`。
- JSX 里手贴 `https://images.unsplash.com/...`——过 `pickImage()`，让 `images:localize` 能跟踪。
- 选了 G2 但不写 spec 就开始写 JSX——你会在第 30 分钟回来重写一次。
- 同一个 session 既改老组件又新建页面——拆成两个 session，分别 modify + generate。
