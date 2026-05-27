# TV Design System — Component Inventory (Phase 3 Build List)

Source: Figma canvas `Components` (`232:24620`). Variant counts and IDs are from the metadata dump; properties are normalized from each `<symbol>` name.

Bias: ordered for what the **AI 空间影视 template page** (`303:63976`) actually renders — top nav, media cards, recommendation rails, dialog bubbles. Sub-parts (`.Image`, `.Label`, `.Scrim`, `.Thumbnail`) are listed but should be implemented as internal primitives of the parent card, not as standalone exports.

---

## Tier 1 — Must build (template-page critical path)

### 1. Card / GUI卡片 (Media Card) — `232:24825`
- **24 variants**
- Props: `Property = {点播, 点播无评分, 频道, 直播, 回看, 短视频}`, `Size = {M, S}`, `Focus = {False, True}`, `收藏 = {False, True}`
- Sample IDs: `232:26174`, `232:26238` (focus), `232:26301` (focus+收藏)
- React: **`<MediaCard>`** — single component, `kind` prop drives label + meta layout; controlled `focused`, `favorited`.

### 2. Card / 推荐位卡片 (Recommendation/Hero Card) — `93:21323`
- **8 variants**
- Props: `Property = {点播, 直播, 回看, 频道}`, `Focus = {False, True}`
- Sample IDs: `93:21322`, `93:21498`, `93:21462`
- React: **`<RecommendationCard>`** — the large featured tile used at the top of rails.

### 3. Card / 话题卡片 (Topic Card) — `174:18630`
- **8 variants**
- Props: `类型 = {基础横海报, 基础竖海报, 竖向大卡片, 紧凑型卡片}`, `Focus = {False, True}`
- Sample IDs: `174:18455`, `232:29575`, `174:18629`
- React: **`<TopicCard>`** — `layout` prop swaps poster orientation.

### 4. Text Button — `264:34412`
- **60 variants**
- Props: `State = {Default, Enable, Focus, Selected}`, `Type = {Filled, Outline}`, `Size = {L, M, S}`, `Radio = {圆头, 圆角}`, `播放器场景 = {No, Yes}`
- Sample IDs: `66:14965`, `89:163`, `96:577`
- React: **`<TextButton>`** — `variant` (filled/outline), `size`, `shape`, focusable.

### 5. Icon Button — `264:35654`
- **60 variants**
- Props: same axes as Text Button.
- Sample IDs: `98:871`, `98:895`, `98:919`
- React: **`<IconButton>`** — same API as TextButton minus label.

### 6. Tabs (Top Nav) — `357:22575`
- **3 variants**
- Props: `Property 1 = {Default, Focused, Selected}`
- Sample IDs: `357:22576`, `357:22578`, `357:22580`
- React: **`<TopNavTabs>` / `<NavTab>`** — single-item state machine; container handles roving focus.

### 7. DUI_回复气泡 (AI Dialog Bubble) — `145:15020`
- **3 variants**
- Props: `状态 = {AI回复, AI回复中, 思考中}`
- Sample IDs: `112:471`, `145:15019`, `145:15018`
- React: **`<AssistantBubble>`** — `status` prop drives content vs. typing/thinking spinner.

### 8. DUI_input (AI Input) — `157:19369`
- **4 variants**
- Props: `Property 1 = {default, focus, filled, disabled}`
- Sample IDs: `157:19353`, `157:19586`, `157:19394`
- React: **`<AssistantInput>`** — TV-focusable text input shell.

---

## Tier 2 — Build right after T1 (template rails reference these)

### 9. 话题组件 / 视频组件 — `174:19074`
- 4 variants. Props: `Property 1 = {单列, 两列}`, `Focus = {False, True}`. IDs: `174:19073`, `264:29792`.
- React: **`<VideoRailItem>`** — used inside a topic rail.

### 10. 话题组件 / 片单组件 — `174:19068`
- 4 variants. Props: `Property 1 = {横海报, 竖海报, 大竖版海报, 特殊}`. IDs: `174:19066`, `174:19065`, `174:19502`.
- React: **`<PlaylistRailItem>`**.

### 11. 话题组件 / 新闻组件 — `197:19886`
- 4 variants. Props: `图片位置 = {左, 右}`, `Focus = {False, True}`. IDs: `197:19885`, `264:32171`.
- React: **`<NewsRailItem>`**.

### 12. 话题组件 / 观看历史 — `264:25938`
- 2 variants. Props: `Focus = {False, True}`. IDs: `197:22730`, `264:28085`.
- React: **`<WatchHistoryCard>`**.

### 13. 节目专题 (Program Topic Badge/Chip) — `233:17489`
- 11 variants. Props: `形态 = {专题冷色-{短,中,长}, 专题暖色-{短,中,长,长2}, 人物-{短,中,长}, 电视节目}`.
- IDs: `233:17488`, `233:17486`, `233:17485`.
- React: **`<TopicBadge>`** — `tone` (cool/warm/person) + `size`.

### 14. DUI_分割 (Dialog Divider) — `123:376`
- 2 variants. Props: `类型 = {时间分割, 切换提示}`. IDs: `112:474`, `112:475`.
- React: **`<DialogDivider>`**.

---

## Tier 3 — Lower priority (not used by template page, build on demand)

| Group | ID | Variants | React | Notes |
|---|---|---|---|---|
| Side tab | `151:15109` | 3 | `<SideTab>` ✅ | Default/Focused/Selected |
| datePicker | `179:18916` | 3 | `<DatePicker>` ✅ | Default/Focused/Selected |
| 卡片/新闻脉络 | `197:19984` | 6 | `<NewsTimelineCard>` ✅ | 横版/竖版 × 单行/多行 × focus |
| 话题组件 / 新闻脉络 | `197:20391` | 2 | `<NewsTimelineRailItem>` ✅ | 横版/竖版 |
| Card / ROW / GUI卡片-行 | `245:5100` / `264:45179` | 2 | `<MediaCardRow>` ✅ | M/S — row-layout media card |
| Card / ROW / 话题卡片-行 | `245:7122` / `264:45192` | 4 | `<TopicCardRow>` ✅ | Same 4 类型 as TopicCard |

---

## Tier W — WaterfallHome (`830:33218` 瀑布流首页) 专属组件

> 2026-05-21 复刻 `830:33218` 时按 DESIGN_RULES §3.7 抽取。原 Figma 节点是页面级 layout（非 component），但满足 §3.7.1 的"页面出现 ≥2 次 / 含独立角标 / ≥3 层嵌套"触发条件，故抽组件入库。

| Figma node | Variants | React | Notes |
|---|---|---|---|
| `编组 11` Newtv logo + tagline (`830:37002`) | 1 | `<BrandLogo>` ✅ | Logo SVG (`public/images/waterfall/newtv-logo.svg`) + Icon `speaker` + tagline 文本 |
| `容器 135395..135399` 顶栏小 pill (`830:37049+`) | 4 (search/profile/companion/time) | `<UtilityChip>` ✅ | rounded-full + 5% 白底，`iconPosition` 左/右；time 类自动右侧放 wifi icon |
| `组 135396` 顶栏右侧容器 (`830:37047`) | 1 | `<UtilityBar>` ✅ | 4 个 `<UtilityChip>` 横向排列，gap 19px |
| `组 11/12/etc` 卡片角标 (`830:36911+`) | 2 (free/vip) | `<CornerBadge>` ✅ | Free=绿底白字"免费"，VIP=金色 CSS 渐变"VIP"（如需更复杂金属字换 PNG bg） |
| `Frame 48 items` / `Frame 47 items` 横版图卡 (`830:36909`/`830:36929+`) | 2×2 (size{wide,grid} × badge{free,vip}) + focused | `<BannerCard>` ✅ | `size: 'wide'`=540×322 (Row1), `'grid'`=398×298 (Row2)。整卡盖图 + 右上角标，焦点态走 FocusRing |
| `Bitmap 1` VIP 专区 (`830:36948`) | 1 | `<PromoCard>` ✅ | 398×298，背景使用 `public/images/waterfall/promo-vip-zone.svg`，焦点态 FocusRing |
| `Group 24` 系列竖版海报 (`830:36858+`) | badge{none, vip} + focused | `<PosterCard>` ✅ | 312×458 海报 + 32px Regular 标题；右上 VIP 角标 |

### Tier W 既有组件扩展

| Figma node | 既有组件 | 变更 |
|---|---|---|
| `容器 4..16` 频道 tab (`830:36951+`) | `<NavTab>` ✅ | 新增 `appearance: 'channel'` 与 `kind: 'image' + imageSrc`，VIP/少儿走 `kind='image'` 切图变体；原 `classic` 行为完全兼容 |
| `Newtv` / `喇叭` / `WiFi` / `搜索` / `我的` / `爱小宝` 图标 | `<Icon>` ✅ | 新增 `speaker / wifi / search / profile / companion` 5 个 IconName |
| 页面背景、角标绿、白 5%/15%、字号 token | `src/tokens/tokens.css` ✅ | 新增 `--color-bg-page-dark`、`--color-green-vivid`、`--color-white-5/15`、`--color-text-cool-white`、`--font-channel-tab-size`、`--font-section-title-*`、`--font-poster-title-*`、`--font-badge-*` |

### Tier W 切图清单（落在 `public/images/waterfall/`）

| 文件 | 用途 | 备注 |
|---|---|---|
| `newtv-logo.svg` | BrandLogo 主图 | 沙箱无外网，按视觉近似手画；如需 1:1 还原从 Figma 右键 Export 替换 |
| `tab-vip.svg` | VIP tab 切图 | 金色渐变 SVG（Impact italic）|
| `tab-child.svg` | 少儿 tab 切图 | STKaiti / KaiTi 字体回退；最稳的方式还是从 Figma 导出 PNG |
| `promo-vip-zone.svg` | PromoCard 整张背景 | 自绘金色渐变 + ring 装饰；后续可换 Figma 导出图 |

### Tier W 卡片实拍图（**临时**）

- Row1 / Row2 / Row3 的 12 张实拍 movie poster 直接引用 Figma asset URL（`https://www.figma.com/api/mcp/asset/<uuid>`），有 7 天 TTL。
- **过期前**：用 `mcp__ecb3a0eb-..__get_screenshot`（或 Figma 客户端 Export PNG）落到 `public/images/waterfall/cards/<name>.png`，把 `WaterfallHome.tsx` 里的 `FIGMA(<uuid>)` 改回 `/images/waterfall/cards/<name>.png`。

---

## Internal primitives (do NOT export; consume inside cards)

These are sub-parts of `Card /` — implement as internal styled primitives, not standalone components:

| Sub-part | ID | Variants | Use |
|---|---|---|---|
| `.Image` | `232:29630` | 6 — `Ratio={2:3,16:9,11:16}` × `Embed` | poster container inside cards |
| `.Thumbnail` | `232:24921` | 8 — `Ratio={2:3,3:4,16:9,11:16}` × `Placeholder` | media thumbnail w/ skeleton |
| `.Scrim` | `232:29667` | 2 — `Type={Half linear, full linear}` | gradient overlay |
| `.Scrim-Spec` | `174:19556` | 3 — `蓝紫/蓝绿/黄色` | tinted scrim for hero cards |
| `.Label` | `62:14901` | 8 — 点播/直播/回看/频道/短视频/VIP/AI陪看/未开播 | corner badge |
| `.Label-Channel` | `67:16980` | 4 — `M/S` × `亮色/暗色` | channel-number chip |
| `.Label-Topic` | `222:23298` | 10 — 电影/电视剧/综艺/片单/新闻/本周热播 × `热推 on/off` | topic chip on TopicCard |
| `.Label-Sorting` | `78:19870` | 2 — `Focus` | sort-order pill |
| `.Header` (instance) | `232:24823` | — | section divider header on the Components canvas itself (not a runtime component) |

---

## Tally

- **Top-level groups (frames containing symbols)**: 34
- **Distinct exportable components after de-dup** (`Card / ROW / *` and `Base` / `Components` appear twice on the canvas — same symbols): ~22
- **Total symbol variants across the canvas**: 226
- **Tier 1 + Tier 2 variants to model**: ~150 (the rest are sub-part permutations consumed by parents)

## Build order recommendation

1. `<TextButton>` + `<IconButton>` (unblocks every other interactive piece)
2. Internal `.Image` / `.Thumbnail` / `.Scrim` / `.Label*` primitives
3. `<MediaCard>` → `<RecommendationCard>` → `<TopicCard>`
4. `<TopNavTabs>`
5. `<AssistantBubble>` + `<AssistantInput>` + `<DialogDivider>` (AI side panel)
6. Topic rail items (`<VideoRailItem>`, `<PlaylistRailItem>`, `<NewsRailItem>`, `<WatchHistoryCard>`)
7. `<TopicBadge>` for hero/topic strips
8. Tier 3 on demand

---

## Local React naming map (Figma → `src/components/`)

When the Figma name and the React filename diverge, this is the source of truth:

| Figma symbol | Local component | Notes |
|---|---|---|
| Card / GUI卡片 | `MediaCard` | + page-specific `CardPoster` (LiuDehua poster style) |
| Card / 推荐位卡片 | `RecSlotCard` | inventory previously called this `RecommendationCard` |
| Card / 话题卡片 | `TopicCard` | |
| Tabs (Top Nav) | `NavTab` | wrapped by `TopBar` for the AISpaceMovie layout |
| DUI_回复气泡 | `DUIBubble` | inventory previously called this `AssistantBubble` |
| DUI_input | `AssistantInput` | |
| DUI_分割 | `DialogDivider` | |
| 话题组件 / 视频组件 | `VideoRailItem` | |
| 话题组件 / 片单组件 | `PlaylistTopicRow` | inventory previously called this `PlaylistRailItem` |
| 话题组件 / 新闻组件 | `NewsRailItem` | |
| 话题组件 / 观看历史 | `WatchHistoryCard` | |
| 节目专题 | `TopicBadge` | |
| Side tab | `SideTab` | |
| datePicker | `DatePicker` | |
| 卡片/新闻脉络 | `NewsTimelineCard` | T3 — 横版/竖版 × focus |
| 话题组件 / 新闻脉络 | `NewsTimelineRailItem` | T3 — 横版/竖版 |
| Card / ROW / GUI卡片-行 | `MediaCardRow` | |
| Card / ROW / 话题卡片-行 | `TopicCardRow` | T3 — same 4 layouts as `TopicCard` |
| 编组 11 (Newtv + tagline) | `BrandLogo` | TW — WaterfallHome 顶栏左 |
| 容器 135395/6/8/9 | `UtilityChip` | TW — search/profile/companion/time pill |
| 组 135396 (顶栏右侧) | `UtilityBar` | TW — `UtilityChip` 容器 |
| 组 11/12 (卡片角标) | `CornerBadge` | TW — `free` / `vip` |
| Frame 48/47 横版图卡 | `BannerCard` | TW — size: `wide`(540×322) / `grid`(398×298) |
| Bitmap 1 VIP 专区 | `PromoCard` | TW — 398×298 VIP 推广卡 |
| Group 24 竖版海报 | `PosterCard` | TW — 312×458 + 标题 |

## Traditional EPG component split

Reference: traditional EPG canvas `830:11665`, with person-topic GUI/DUI sample `830:13964`.

The EPG page should keep sharing the AI-space library where the component responsibility is the same. Use a scene variant before creating a page-local fork:

| EPG reference block | Local component | Component work | Notes |
|---|---|---|---|
| GUI representative-work poster | `MediaCard` | `scene="epg"` + `showCompanion` | Same GUI geometry; EPG changes the 点播 label skin, companion label presentation, and cover meta order to `source -> rating`. |
| DUI user/reply bubbles | `DUIBubble` | `scene="epg"` | Same DUI state model; EPG lane uses the 66px avatar and 411px content column. |
| GUI search facet tab | `NavTab` | `appearance="filter"` | Search filter pages use the 72px EPG chip instead of TopBar/channel tab skins. |
| DUI footer actions | `IconButton` | Reuse | Like/thumb-down/clean remain shared button variants, not bubble-local markup. |
| DUI recommendation prompts | `TextButton` | Reuse | Keep width/focus behavior in the existing text button component. |

These traditional EPG blocks are separate components instead of AI-space variants because their geometry and job differ from the shared media/DUI primitives:

| EPG block | Local component | Notes |
|---|---|---|
| Brand lockup | `BrandLogo` | EPG header identity + speaker treatment. |
| Bottom-right DUI wake dock | `EpgDuiDock` | Shared collapsed entry, compact text/voice input, and summonable EPG DUI panel for traditional EPG GUI pages. |
| Header utility entry | `UtilityChip` / `UtilityBar` | Search, profile, companion, and time grouping. |
| Waterfall image tile | `BannerCard` | Wide/grid horizontal artwork card. |
| Waterfall vertical poster | `PosterCard` | EPG poster with title below artwork. |
| VIP promotion tile | `PromoCard` | Dedicated CTA composition. |
| Artwork corner entitlement | `CornerBadge` | Free/VIP overlay consumed by EPG cards. |
| Purchase/history result card | `PurchaseRecordCard` | Commerce metadata card for `查询购买记录`, separate from poster recommendations. |
| GUI buy-package answer surface | `PackageReplyPanel` | Text-first GUI reply states: short inline copy, long panel, and focused completion panel. |
| Commerce result status ribbon | `CommerceStatusBadge` | Shared ribbon for purchase/package status copy such as `已订购`. |

The lower half of the same canvas (`查询购买记录` / `买包`) is intentionally kept out of the media-search family: purchase history is metadata-led, package replies are text-led, and commerce state ribbons decorate those surfaces instead of becoming another `MediaCard` label.

## Player component split

Reference: player canvas `830:11668`, covering the traditional playback chrome and the embedded AI conversation states.

The player stays one surface with layered states instead of separate UI pages:

| Player layer/state | Local component | Notes |
|---|---|---|
| Program title, metadata, channel labels, synopsis | `PlayerInfoPanel` | Traditional UI info layer over the playing video. |
| Primary playback actions | `PlayerActionBar` + `TextButton scene="player"` | Reuses button state semantics while keeping idle player actions muted over live video. |
| Timeline and highlight markers | `PlayerProgressBar` | Owns time labels, play glyph, progress rail, markers, and focused cursor treatment. |
| Episode row | `PlayerEpisodeRail` / `PlayerEpisodeTile` | Handles numbered items and the current summary tile in one rail. |
| Embedded AI listening entry | `PlayerVoiceButton` | `bars` variant belongs to traditional chrome; `orb` variant belongs to AI overlay. |
| Embedded AI bubbles | `PlayerAIOverlay` | State model is `wake -> user -> thinking -> reply`; it overlays the video instead of replacing the player. |

Player icon assets are Figma-exported local assets registered through `Icon` in `src/assets/icons/`. The action row uses `player-fullscreen`, `player-shopping-cart`, `player-like-filled`, `player-featured-star`, `player-play-outline`, and `player-list-panel`; the same player node supplies `player-progress-play`, `player-bar-chart`, and `player-voice-bars` for the remaining traditional playback chrome. The AI orb keeps the separate `voice` glyph.

**Status (2026-05-21):** All groups on canvas `Components` (`232:24620`) covered by a local component.
