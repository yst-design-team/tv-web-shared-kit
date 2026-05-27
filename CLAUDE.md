# CLAUDE.md — TV Web Demo 仓库的单一入口

> Claude 在开始任何 session 前必须先读本文件。
> 本文指向你需要的全部上下文；除非本文没回答你的问题，否则不要打开 docs/ 下的其它 .md。

---

## §A. Tool-call safety（先读，硬约束）

- For `Read` tool calls, NEVER include the `pages` parameter unless the target file path ends with `.pdf`.
- For ordinary text, code, Markdown, JSON, config, or memory files, call `Read` with only the needed parameters: `file_path`, and optionally `limit` / `offset`.
- Do not pass `pages: ""`, `pages: "1"`, or any other `pages` value for non-PDF files.
- If a tool returns a parameter/schema error, do not retry the same payload. Rebuild the payload from scratch with the minimum valid fields.
- After two same-class tool errors in a row, stop calling tools, explain the blocker to the user, and switch to a safe alternative only if appropriate.
- 容器内 `NODE_ENV=production`；所有 `npm run *` 必须 `NODE_ENV=development` 前缀。

---

## §0. 三类操作：5 行开场卡片

任何 session 开头先填，不填不动手。

```
意图       : 复刻 | 修改 | 生成
范围       : <page-id 或 component-name>
Figma 取数 : yes/no（yes 列节点 id）
新建组件   : yes/no（yes 列名 + 一句理由）
verify     : build / lint / app / focus / layout / storybook / inventory 子集
```

## §1. 七条硬不变量（违一停下）

1. **不准修改 `src/components/<已有>/` 任何文件。** 要改 → 单独的 modify session，不与 generate 混。生成结束前自审 `git diff --stat src/components/`，应当只列出新增目录。
2. **不准添加新 token。** 颜色 / 字号 / 间距 / 圆角 / 阴影只用 `src/tokens/tokens.css` 既有项。确实没合适的，先停下单独立项，再回来。
3. **新组件四件套**：`src/components/<Name>/{<Name>.tsx,<Name>.css,<Name>.stories.tsx,index.ts}`。stories 覆盖 default / focused / selected / disabled 四态（不适用的写注释说明为什么）。
4. **新组件必须登记** `docs/component-inventory.json`，并跑 `npm run inventory:check` 验证。
5. **页面必须在 `src/pageRegistry.ts` 注册** 并选定一个已有 `componentProfile`。要新 profile 单独立项。
6. **假数据放 `src/pages/<page>/mockData.ts`**，不要 inline。固定文件名，命名前缀 `<PageName>` 驼峰。
7. **图片走 `src/mocks/imagePool.ts` 的 `pickImage(category, seed, [w,h])`**；不在 JSX 贴 URL。完成后跑 `npm run images:localize -- <page-id>` 把远程图本地化到 `public/images/<page>/`。

## §2. 复刻流程（Figma → 1:1）

1. `npm run snapshot -- replicate-<node>-pre`。
2. 一次性 Figma 批量取数：metadata + screenshot + variables + 所有子节点 design_context，禁止边写边补。
3. 在 `docs/component-inventory.json` 搜 responsibility，决定哪些复用 / 哪些新建（不许扩老 variant）。
4. 切图 → `npm run import-assets -- <manifest.json>`（`scripts/import-assets.example.json` 是模板）。
5. token diff 必须为空；如真要加，停下来单独立项。
6. `cp -r src/pages/_template src/pages/<NewPage>`，sed 改名。
7. 写 `mockData.ts`（图走 `pickImage`），装配 JSX，注册 `pageRegistry.ts`。
8. `npm run verify -- --scope=storybook,app,build,lint,inventory`。
9. `npm run images:localize -- <page-id>`。
10. `npm run snapshot -- replicate-<node>-post`。

风险点：按 Figma 实际 x/y/w/h 渲染（不要 CSS 拉伸救）；hero/整版遮罩 z-index 低于业务内容，左右边缘遮罩才高于 rail。

## §3. 修改流程（局部 diff，砍多余）

按子类决定要不要 Figma、要不要 snapshot、跑哪些 verify：

| 子类 | Figma | snapshot | verify |
| --- | --- | --- | --- |
| 颜色/字号/间距 | 否 | git stash | build,lint |
| 文案 | 否 | git stash | lint |
| 切图替换 | 是（单节点） | 必须 | app,build |
| 焦点链路 | 否 | git stash | focus,lint |
| 布局/裁切/遮罩 | 节点 metadata | git stash | layout,build |
| 跨页/Provider 状态 | 否 | 必须 | app,focus,build |

只读 `docs/DESIGN_INCIDENTS.md` 中对应子类的那几条编号（见 §7 索引），不读全文。

**连续两次 patch 同一处** → 升级为复刻流程，否则越改越歪。

## §4. 生成流程（新页面 / 新组件）

1. `npm run snapshot -- generate-<page>-pre`。
2. **90 秒 Reuse Probe**：在 `docs/component-inventory.json` 搜 responsibility，输出两栏：
   - 复用 as-is：列组件名 + props
   - 必须新建：列组件名 + 一句话理由（不能空）
3. 新页面：`cp -r src/pages/_template src/pages/<NewPage>`，sed 改名，按 `docs/PAGE_IMPLEMENTATION_CHECKLIST.md` 走完 7 项。
4. 新组件：建四件套 → 登记 `component-inventory.json` → `npm run inventory:sync` 回填 consumers。
5. 写 `mockData.ts`，图走 `pickImage()`，文案按 §6 调子。
6. `npm run verify -- --scope=storybook,app,build,lint,inventory`。
7. `npm run images:localize -- <page-id>`。
8. **提交前自审**：`git diff --stat src/components/` 只应显示新增目录；已有组件出现在 diff → 停下回到 §1.1。
   - 也可手动跑 `node scripts/no-mod-check.mjs` 做正式审计。
9. `npm run snapshot -- generate-<page>-post`。

## §5. 工具速查

```
npm run verify -- --scope=<a,b,c>     按 scope 跑（scope 见 verify --list）
npm run inventory:check               守护 inventory.json 与 src/components/ 一致
npm run inventory:sync                自动回填 consumers
npm run import-assets -- <m.json>     Figma 切图批量 fetch + 校验
npm run images:localize -- <page>     pickImage URL → 本地化到 public/images/<page>/
npm run snapshot -- <label>           打快照
npm run rollback <id|latest>          回滚
node scripts/no-mod-check.mjs         手动审计：与最近 *-pre 比对，已有组件被改即报
```

## §6. 内容调子（写 mockData.ts 时）

- **剧名**：现实题材但虚构，2–5 字。例：南岭夜行、长江入海、城与火、风过塞外。不抄真实 IP，不用 lorem ipsum。
- **人名**：常见姓 + 通用名，避真实公众人物（除非该页面是「真人专题」且有授权图）。
- **时间**：相对今天的真实分布，如「今晚 19:30」「明天 14:00」「周六 20:00」。不写 1970。
- **评分**：7.5–9.5，1 位小数；配「2.3 万人在看」「18.6 万」「45 万」做辅助 meta。
- **集数**：8/12/16/24/32/36/48 几个常见挡，不要 13/17 这种不自然数。
- **角标**：只用 `VIP / 免费 / 首播 / 补集 / 4K / HDR / AI陪看`。
- **DUI 回复**：「平和 + 给方向」，不带感叹号。
- **图片 seed**：人能读，如 `nanling-yexing-ep01`、`hero-1`，不要 `image-1` `pic-test`。

## §7. DESIGN_INCIDENTS 索引（按类查编号）

| 类别 | 编号 |
| --- | --- |
| 组件态 / FocusRing | E1, E6, E20, E32 |
| 切图 / badge / 图标 | E2–E5, E14–E15, E21, E24, E29–E30 |
| 遮罩层级 | E7, E12, E29 |
| rail / grid / viewport | E8, E16–E18, E22–E23, E25–E28, E31 |
| DUI / 焦点 / 输入 | E9, E19–E20, E34–E35 |
| 文案 / 排版 | E10, E33 |
| 构建环境 | E11 |

遇到具体问题对号查 `docs/DESIGN_INCIDENTS.md`，不要读全文。

## §8. 必读 / 选读 / 不读

**必读**（本文 + 这三份）：
- `docs/DESIGN_RULES.md` — 视觉规则（颜色/字号/间距/状态/切图/焦点/rail/文案）
- `docs/PAGE_IMPLEMENTATION_CHECKLIST.md` — 页面级 7 项勾项
- `docs/DESIGN_INCIDENTS.md` — 出问题按 §7 索引查编号

**选读**（特定场景才打开）：
- `docs/component-inventory.json` — 写代码前 grep responsibility（必读，但只 grep 不通读）
- `docs/DEV_DEEP_LINKS.md` — 验证时直达页面
- `docs/INTENT_ROUTING.md` — 加新页面 intent 时
- `src/pages/_template/README.md` — 第一次用模板时

**不读**（noise，已被本文覆盖或精简）：
- `docs/OPERATION_PLAYBOOKS.md` / `docs/GENERATION_STRATEGY.md` / `docs/CONTENT_GUIDE.md` — 内容已合并入本文
- `docs/component-inventory.md` — 由 .json 派生，机器读 .json 即可
