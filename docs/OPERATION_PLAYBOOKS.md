# OPERATION_PLAYBOOKS — 复刻 / 修改 / 生成 三套流程

> 主规则在 [`DESIGN_RULES.md`](./DESIGN_RULES.md)，事故库在 [`DESIGN_INCIDENTS.md`](./DESIGN_INCIDENTS.md)，组件清单在 [`component-inventory.md`](./component-inventory.md) / `component-inventory.json`。
> 本文负责把三类操作的**流程顺序**和**取数 / 验证强度**做差异化，避免每次都走最重的全量路径。

## 0. 开场卡片（5 行模板）

每次 session 开头先填，不填不动手。可贴在 PR description 或 chat 顶部。

```
意图     : 复刻 | 修改 | 生成
范围     : <page-id> / <component-name> / <token-group>   （只写真正会动的文件根）
Figma    : 需要取数 yes/no；若 yes 列节点 id
切图     : 是否新增切图 yes/no；若 yes 列出 asset id 列表
verify   : --scope=focus,layout,build,storybook,app,lint  中实际要跑的子集
```

填卡片的好处：把 `DESIGN_RULES §1` 的「记录关键事实」前置成一次性输出，后面所有人/模型都按这张卡片走，不再反复回查全文档。

---

## 1. 复刻 Replicate（从 Figma 到 React 1:1）

**触发**：拿到一个 Figma 节点 id（页面或组件），需要新建/重做。
**风险点**：对照度、切图、变体覆盖。
**目标**：把 Plan 和 Build 切成两段，禁止「边写边查设计稿」。

### 1.1 Plan 阶段（不动代码）

输出一份 `.artifacts/plan-<node-id>.json`：

- `tree`        节点骨架（id / 类型 / 子节点）
- `tokenDiff`   要新增的 token，列出 name + value
- `componentDiff` 三栏：复用现有 / 扩 variant / 新建（必须有理由）
- `assets`      切图清单（id / 期望 size / bleed / 目标路径），供 `import-assets.mjs` 直接吃
- `focusTopo`   默认焦点 + 方向跳转草图

Figma 取数**一次批量打齐**：metadata + screenshot + variables + 所有子节点 design_context 并发 fetch，禁止边写边补。

### 1.2 Build 阶段（按 Plan 执行）

按顺序：

1. snapshot：`NODE_ENV=development npm run snapshot -- replicate-<node-id>-pre`
2. 切图：`node scripts/import-assets.mjs .artifacts/plan-<node-id>.json` → 全过再走下一步
3. 改 token：只动 `tokenDiff` 列出的；改完跑 `npm run verify -- --scope=lint`
4. 写/扩组件：按 `componentDiff`，每加一个组件同步写 `.stories.tsx` 并更新 `component-inventory.md` + `component-inventory.json`
5. 装配页面：在 `pageRegistry.ts` 注册（参考 `PAGE_IMPLEMENTATION_CHECKLIST §1`），再写 JSX
6. 焦点联调：按 `focusTopo` 串一遍方向键
7. post-snapshot：`npm run snapshot -- replicate-<node-id>-post`

### 1.3 验证强度

全量：`npm run verify -- --scope=focus,layout,storybook,app,build,lint`。
复刻是少数必须全量验的场景，因为新增的代码面大。

---

## 2. 修改 Modify（局部 diff）

**触发**：颜色错了 / 焦点不通 / 文案改了 / 间距动 / 切图换。
**风险点**：跨组件回归、跨页状态、焦点链路意外断裂。
**目标**：砍掉一切跟本次 diff 无关的取数和验证。

### 2.1 入口分类（决定后续路径）

| 子类 | 是否取 Figma | 是否切图 | verify scope | 是否打 snapshot |
| --- | --- | --- | --- | --- |
| token 微调（颜色/字号/间距） | 否 | 否 | `build,lint` | git stash 即可 |
| 文案 | 否 | 否 | `lint` | git stash |
| 切图替换 | 是（只取那一个节点） | 是 | `app,build` | 必须 snapshot |
| 焦点 / 方向键链路 | 否 | 否 | `focus,lint` | git stash |
| 布局 / 裁切 / 遮罩 | 是（节点 metadata 即可） | 视情况 | `layout,build` | git stash |
| 跨页 / Provider 状态 | 否 | 否 | `app,focus,build` | 必须 snapshot |

### 2.2 流程

1. 填开场卡片，定子类
2. 只读 INCIDENTS 中对应那几条编号（见 DESIGN_RULES §8 的索引），不读全文
3. 改代码
4. 跑表里对应的 verify scope，**不跑别的**
5. 对照设计稿做一次 diff 自检

### 2.3 例外：连续两次修改同一个区域

第二次起强制升级为「复刻」流程，否则容易越改越歪。原因：连续两次 patch 同一处通常意味着原 Plan 错了，应该回到 Plan 阶段重做。

---

## 3. 生成 Generate（新页面 / 新组件）

**触发**：要做一个之前没有的页面 / 组件。
**风险点**：本可以复用却写了第二份；token 重复添加；componentProfile 选错。
**目标**：复用优先；从最相近的现有产物 fork，而不是从空白开始。

### 3.1 90 秒 Reuse Probe（必做）

在 `component-inventory.json` 里按视觉责任搜索，输出三栏：

- 可直接复用（写出组件名 + props）
- 应扩 variant（写出组件名 + 新 variant 描述）
- 必须新建（写理由：为什么不能扩 variant）

任何「必须新建」必须给出一句话理由（结构差异 / 视觉责任差异 / 不可复用的 layout 维度），否则回到「扩 variant」。

### 3.2 新页面

1. 在 `pageRegistry.ts` 决定 `componentProfile`（不要新造，参考 `PAGE_IMPLEMENTATION_CHECKLIST §2`）
2. 找同 profile 的现有页面，`cp -r src/pages/<closest>/ src/pages/<new>/`，作为骨架
3. 按差异修改；同 profile 的差异通常只是数据/文案，不应该是 layout 大改
4. 注册 intent（见 `INTENT_ROUTING.md`），按窄 → 宽顺序加规则
5. 加 deep link 到 `DEV_DEEP_LINKS.md`
6. snapshot：`npm run snapshot -- generate-<page-id>-post`

### 3.3 新组件

1. Reuse Probe 走完，确认必须新建
2. 建目录：`src/components/<Name>/{<Name>.tsx,<Name>.css,<Name>.stories.tsx,index.ts}`
3. Storybook 必须覆盖 Figma 的全部 variants（DESIGN_RULES §3.3）
4. 更新 `component-inventory.md` + `component-inventory.json`
5. 跑 `npm run verify -- --scope=storybook,lint`

### 3.4 验证强度

中等：`npm run verify -- --scope=storybook,app,build,lint`。
焦点 / 布局如果改了，再加 `focus,layout`。

---

## 4. 三流程对照表

| 项 | 复刻 | 修改 | 生成 |
| --- | --- | --- | --- |
| Plan 文档 | `.artifacts/plan-*.json` 必须 | 开场卡片即可 | Reuse Probe 必须 |
| Figma 取数 | 一次批量打齐 | 按子类决定 | 仅当从 Figma 抽新组件时 |
| 切图脚本 | `import-assets.mjs` 必走 | 仅切图替换子类 | 通常不涉及（除非新组件含切图） |
| snapshot | pre + post | 按子类 | post |
| verify | 全量 | 子类对应 scope | 中等 scope |
| 预期耗时 | 60–120 min / 节点 | 5–20 min / diff | 30–60 min / 页面 |

---

## 5. 反模式（停下来）

- 看到任何「复刻」需求直接动手写 JSX，不写 Plan。
- 修改一个 token 跑全量 verify。
- 新页面从空白 `tsx` 开始写，没做 Reuse Probe。
- 切图手工 `curl` + 手工 CSS 调外扩值，不用 `import-assets.mjs`。
- 连续两次 patch 同一处仍按修改流程跑，不升级为复刻。
- `component-inventory.md` 改了但 `component-inventory.json` 没同步（应当通过 `npm run inventory:check` 卡住）。

---

## 6. 与 PAGE_IMPLEMENTATION_CHECKLIST 的关系

本文件回答「整个 session 怎么走」；checklist 回答「页面级别要勾哪些点」。
复刻和生成都必须走完 checklist；修改只勾受影响的条目。
