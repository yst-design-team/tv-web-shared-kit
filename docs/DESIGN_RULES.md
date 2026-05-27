# DESIGN_RULES — TV Web Replica 设计与实现规范

> 本文档是生成 / 修改 TV 端 UI 的主规则，只保留可复用的抽象约束。具体事故复盘见 [`DESIGN_INCIDENTS.md`](./DESIGN_INCIDENTS.md)。
> 新增组件 / 页面 / 切图前，先读本文；遇到遮罩、rail、焦点、输入、DUI 等细节问题，再查事故库。

## 0. 硬规则

1. **设计稿是唯一真相**：颜色、字号、间距、圆角、阴影、渐变、尺寸、层级都从 Figma 取，不凭感觉补。
2. **先 snapshot**：进入生成新内容 / 批量修改前，必须执行 `node scripts/snapshot.mjs <label>`。
3. **Token 优先**：颜色、字号、间距等值优先写入 `src/tokens/tokens.css` / `tokens.json`，组件里禁止硬编码颜色和魔法字号。
4. **组件优先于页面**：页面只负责布局、数据和交互编排；卡片、按钮、角标、输入、气泡、分割线等视觉块必须来自 `src/components/`。
5. **复杂视觉优先切图**：多层渐变、金属字、复杂遮罩、异形图标、底纹等能切图保证 1:1 的，不用 CSS hack。
6. **实现后必须验收**：跑 `NODE_ENV=development npm run build`，并对照设计稿检查颜色、间距、层级、焦点态、文案对齐和方向键链路。
7. **工具错误熔断**：工具调用出现参数错误后禁止原样重试；普通文本文件读取不得传 `pages`，只有 PDF 才允许传有效页码。连续两次同类工具错误后必须停止、说明问题，并改用最小参数或替代方案。

---

## 1. Figma → 代码流程

1. 读取 Figma 节点：用 Dev Mode MCP 获取结构、截图、变量和素材。
2. 记录关键事实：节点尺寸、z-order、父子层级、variants、文本规格、切图范围。
3. 盘点组件：先查 `docs/component-inventory.md` 和 `src/components/`，已有组件必须复用。
4. 补齐缺失组件：命中组件化条件时，先抽组件、写 stories、更新 inventory，再装配页面。
5. 盘点切图：列出必须导出的 PNG / SVG，验证尺寸、透明边、裁切窗口和层级。
6. 设计焦点拓扑：先列出默认焦点、方向跳转、跨区入口、孤岛元素返回路径，再写代码。
7. 页面装配：使用 `<Stage>` 固定 1920×1080 画布，按 Figma 数值布局。
8. 验收并 post snapshot：修完后再执行 `node scripts/snapshot.mjs <label>-post`。

---

## 2. Token 与样式

- token 命名空间：`--color-*`、`--font-size-*`、`--space-*`、`--radius-*`、`--opacity-*`、`--ease-*`、`--duration-*`。
- 新增颜色 / 字号 / 间距前，先确认是否已有 token；没有则补 token，再使用。
- 页面 CSS 只做布局：`position`、`grid`、`flex`、`transform`、视口裁切等。
- 组件 CSS 才承担组件视觉：背景、边框、状态、字号、内部间距、角标、焦点态。
- 禁止在页面 `.tsx` 内散写内联 SVG、临时图标、裸按钮、裸卡片、裸角标。

---

## 3. 组件化规则

### 3.1 什么时候必须抽组件

满足任一条件，就必须放进 `src/components/<Name>/`，不能在页面内一次性手写：

- Figma 中是 component / instance，或有 `mainComponent`。
- 有 2 个以上 variants / states。
- 当前页面出现 2 次以上。
- 结构超过 3 层 DOM，并包含角标、渐变、焦点态、输入态等独立视觉责任。
- 已有相同责任的组件，只是尺寸、皮肤、标签顺序不同；应扩 variant / prop，不要页面层 fork。

### 3.2 组件目录与命名

```txt
src/components/<Name>/
  <Name>.tsx
  <Name>.css
  <Name>.stories.tsx
  index.ts
```

- React 组件名使用 PascalCase 英文。
- 命名优先级：沿用 `component-inventory` → 翻译 Figma 语义 → 采用 React 社区可读命名。
- 禁止 `Card1`、`Block2`、`NewThing` 等无语义命名。
- 组件新增 / 改名后，同步更新 `docs/component-inventory.md`。

### 3.3 状态与焦点态

- 状态统一用 `data-state="default|focus|selected|disabled"`，不要混用浏览器 `:focus-visible` 作为 TV 焦点依据。
- 按钮类（`TextButton` / `IconButton`）：焦点 = 背景 / 文字变色，不套 FocusRing。
- 卡片类：焦点 = FocusRing + 必要子元素换色；卡身背景不随意翻转。
- 思考中 / 加载中等持续等待态不要只放静态省略号；优先用克制的循环反馈，并提供 reduced-motion 回退。
- `FocusRing` 只负责 `scale` + 单层外环，不承载业务样式。
- Figma 有 N 个 variants，Storybook 必须覆盖 N 个；缺 variants 视为组件未完成。

### 3.4 图标

- SVG 放入 `src/assets/icons/*.svg`，颜色改为 `currentColor`，通过 `<Icon name="..." />` 调用。
- 同场景图标使用居中方形 `viewBox` 对齐。
- 可镜像复用的图标不要重复切图。

---

## 4. 切图与遮罩

### 4.1 必须切图的类型

- 角标 / 徽章：VIP、AI 陪看、金属字、多层描边。
- 大面积渐变遮罩：hero mask、上下 / 左右边缘淡出。
- 复杂底图 / 卡片底纹 / 金属按钮底。
- 多色描边、异形图标、CSS 难以稳定复刻的视觉。

### 4.2 切图验收流程

1. **按 Figma 层级放置**：记录父 frame 子节点顺序，代码里的 z-index 必须对应从底到顶的视觉顺序。
2. **区分遮罩职责**：hero / 整版过渡遮罩通常低于业务内容；左右边缘遮罩通常高于 rail 卡片。
3. **验证源图尺寸**：PNG 尺寸必须匹配 Figma 导出尺寸；不匹配先重新导出，不用 CSS 拉伸补救。
4. **按节点实际 x/y/w/h 渲染**：不要把边缘遮罩拉伸成整屏，也不要把全屏图错误塞进局部容器。
5. **检查透明边与 bleed**：全屏底图 / hero mask 至少 ±2px 外扩；若 PNG 自带透明边，按透明边宽度继续补偿或重导去透明边。
6. **处理裁切窗口**：Figma 中带 `top%` / `height%` 裁切的图片，导出后先裁出可见窗口，再作为页面素材使用。
7. **命名归档**：页面级素材放 `public/images/<page-or-region>/<purpose>.png`，组件级素材放 `src/assets/`。

---

## 5. TV 焦点、输入与跨页状态

- 每个可聚焦元素使用 `<Focusable focusKey="..." />`，区域使用 `<FocusSection />`。
- 含 `<Focusable />` 的页面预览 / Storybook story 必须接入和应用一致的焦点引擎，不能只在 `App` 入口有上焦、独立预览退化成静态稿。
- 页面挂载时显式 `setFocus(<key>)`，不要依赖自动选取。
- 方向跳转必须闭环且有明确落点；跨 GUI / DUI 区域时，边界上的所有可聚焦兄弟都要写显式 `setFocus()`。
- 孤岛元素必须有入口和返回路径；条件消失前必须把焦点移到稳定节点，避免焦点黑洞。
- Enter 触发选择 / toggle 时，页面层维护 `selected` 状态，并传回组件；互斥按钮要清空另一方。
- 承载键盘输入的 Focusable 内部必须使用原生 `<input>`；方向键和 Enter 在 input 内 `preventDefault()` + `stopPropagation()`，再通过 prop 上抛给页面决定焦点或提交。
- 传统 EPG GUI 页面需要共享右下角 DUI 唤起入口：收起入口、文字输入条、语音入口和右侧 EPG DUI 面板归组件层维护，页面只补最近 GUI 焦点的进出路径，禁止每页各画一套悬浮输入。
- DUI 只能有一个宿主：跨页跳转时，旧页面专属 DUI 与目标页 DUI 必须互斥挂载，禁止路由切换后保留两套浮层 / 面板。
- 跨页持续状态（聊天、播放器队列、收藏夹等）必须放到 App 之上的 Provider；页面只消费 hook，不硬编码状态副本。
- 意图分类按“窄 → 宽”顺序短路；新增页面意图必须同步改 context、App 路由和目标页面。

---

## 6. Rail / Grid / Viewport

- 横向 rail 必须是“窗口 + 内容 translate”，焦点右移时 rail 平滑左移；不允许只让卡片超出屏外但不滑。
- rail 自身用 `overflow: visible`，不要用 `overflow: hidden` 或 `clip-path` 硬裁卡片边缘。
- 需要裁切列容器时，用 `overflow: clip`，不要用 `overflow: hidden`，避免浏览器 auto-scroll 导致标题 / hero 抖动。
- 有 FocusRing 的裁切容器必须给足可绘制余量，例如 `overflow-clip-margin` 或更宽的容器。
- rail offset 必须 clamp：不能超过 `totalContentWidth - viewportWidth`。
- rail 动效默认使用 `380ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`。
- 纵向 grid / 折叠布局的 translateY 优先来自 Figma 多状态帧，不用等步长硬推。
- 最后一行 / 最后一张要反算可视窗口和设计底边距，保证完整露出并保留呼吸位；本项目默认底部呼吸位为 `var(--space-stage-bottom-breathing)`（51px），所有最后一行组件都不得与底部齐平。
- 承担裁切职责的 viewport 高度应尽量跨状态保持常数，避免切焦点时“塌陷”。

---

## 7. 文案与排版

- 中文按钮、提示组、多行短语默认左对齐；不要把中文提示居中，除非 Figma 明确如此。
- 字重严格对应 Figma 的 Regular / Medium / Semibold / Bold。
- 行高、字间距、文本框高度来自 Figma inspect，不使用浏览器默认值。
- 固定高度多行文本如果高度小于 `font-size × line-height × lines`，禁止单层 `line-clamp` 直接裁底；需要用 flex / grid 垂直居中后对称裁切。

---

## 8. 事故库索引

详细错误与修正保存在 [`DESIGN_INCIDENTS.md`](./DESIGN_INCIDENTS.md)。常见问题优先查：

- 组件状态 / FocusRing：E1、E6、E20、E32
- 图标 / badge / 切图：E2、E3、E4、E5、E14、E15、E21、E24、E29、E30
- 遮罩层级：E7、E12、E29
- rail / grid / viewport：E8、E16、E17、E18、E22、E23、E25、E26、E27、E28、E31
- DUI / 焦点 / 输入：E9、E19、E20、E34、E35
- 文案与排版：E10、E33
- 构建环境：E11

---

## 9. 添加新规则

- 用户指出问题后，先把经验抽象成规则，再修代码。
- 能抽象成长期规则的，写入本文对应章节。
- 仅适用于某次事故的具体背景，写入 `DESIGN_INCIDENTS.md`。
- 主规则保持短、抽象、可执行；事故库保留细节、原因和复盘。
