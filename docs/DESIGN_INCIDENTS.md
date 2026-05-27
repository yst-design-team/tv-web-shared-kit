# DESIGN_INCIDENTS — TV Web Replica 历史事故库

> 本文保留具体踩坑、原因和修正细节；主规则见 [`DESIGN_RULES.md`](./DESIGN_RULES.md)。新增问题先抽象进主规则，再把具体事故沉淀到这里。

| 编号 | 错误 | 正解 |
| --- | --- | --- |
| E1 | TextButton 套了 FocusRing | TextButton 焦点 = 变色，不套 ring。 |
| E2 | DUI 点赞 / 点踩用了错图标 | 必须从 Figma 拉真实 SVG，转 `currentColor` 后放入 `src/assets/icons/`。 |
| E3 | 短视频徽章用纯紫色 | 应按 Figma 使用紫粉渐变，而不是纯色近似。 |
| E4 | VIP 切图缺背景金色 | VIP 必须导出完整背景 + 字 + 描边，不能只截文字。 |
| E5 | AI 陪看用 CSS 假渐变 | 改用 Figma 导出的 PNG 切图。 |
| E6 | RecSlotCard 焦点翻转背景色 | 焦点只加 FocusRing；角标可按 Figma 换色，卡身不翻色。 |
| E7 | hero → rec 过渡渐变写进 hero 背景 | 过渡渐变应作为独立 mask 切图层，按 Figma 层级放置。 |
| E8 | 卡片轨道焦点右移但 rail 不滑 | rail 必须随焦点 translateX 平滑滑动。 |
| E9 | rail 最右卡片右键无响应 | 必须显式 `setFocus()` 到 DUI 首个可聚焦元素。 |
| E10 | DUI 提示按钮文字居中 | 中文短语类按钮统一左对齐，除非 Figma 明确居中。 |
| E11 | 直接 `npm run xxx` 导致容器内 NODE_ENV=production 报错 | 使用 `NODE_ENV=development npm run xxx`。 |
| E12 | hero 整版遮罩 z-index 高于卡片，导致卡片被蒙暗 | hero / 整版遮罩 z-index 低于业务内容；左右侧边缘遮罩才高于卡片。 |
| E13 | 误判边缘遮罩 PNG 上方透明，CSS 给错高度 | 此判断已废弃；边缘遮罩以 Figma 节点实际 x/y/w/h 和裁切窗口为准，见 E15。 |
| E14 | 全屏切图直接 `inset:0`，缩放后左右出现 1px 黑缝 | 全屏图至少 ±2px 外扩，吸收 Stage 非整数缩放的亚像素误差。 |
| E15 | 边缘遮罩源图带 Figma 裁切窗口，直接铺整张导致画面压暗 | 先按 Figma 的 `top%` / `height%` 裁出可见窗口，再按节点实际 x/y/w/h 渲染。 |
| E16 | rail 用 `overflow:hidden` 裁掉 FocusRing | 不能用 hidden / clip-path 裁 rail；正解见 E22 / E26。 |
| E17 | rail 最后一张 offset 超过内容宽度，出现过滑回弹 | `railOffset = Math.min(rawOffset, totalRowWidth - viewportWidth)`。 |
| E18 | rail 动效 240ms ease-out 太硬 | 改用 `380ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`。 |
| E19 | DUI 多个提示按钮只有第一个能左键回 GUI | DUI 内所有与 GUI 横向相邻的可聚焦元素都要写 left handler，不能依赖 Norigin 自动检索。 |
| E20 | IconButton Enter 后无 selected 反馈 | 页面层维护 selected 状态并传给组件；互斥按钮需清空另一方。 |
| E21 | 右侧 1px 漏边 | bg / hero-mask 外扩，右侧遮罩必要时按 Figma 宽度 +1px，吸收缩放误差。 |
| E22 | rail 用 `clip-path` 横向硬切，首尾卡片被剪断 | rail 用 `overflow:visible`，不写 clip-path；溢出由页面边界和边缘遮罩处理。 |
| E23 | 只靠最外层 1920 画布裁切，卡片穿过 DUI 右侧空白缝 | 就近列容器负责裁掉遮罩覆盖不到的缝隙；后续统一用 `overflow:clip` 避免滚动副作用。 |
| E24 | hero-mask PNG 自带透明边，外扩仍漏出底图 | 先检测 PNG 边缘 alpha；若有 N 像素透明边，CSS 额外外扩 N+1，或重导去透明边并加 bleed。 |
| E25 | rail 右移时标题 / hero 横向抖动 | `overflow:hidden` 会创建滚动容器并被浏览器 focus auto-scroll；裁切容器改用 `overflow:clip`。 |
| E26 | 网格卡片 FocusRing 被裁 | 有 FocusRing 的裁切容器用 `overflow:clip` + `overflow-clip-margin`，并预留 16–20px 可绘制余量。 |
| E27 | 折叠态 grid 用等步长 translateY，最后一行错位 | translateY 必须来自 Figma 多状态帧；不要用等步长硬推。 |
| E28 | 折叠 / 展开 viewport 高度不同，切焦点时塌陷 | 承担裁切职责的 viewport 高度跨状态保持常数，用父容器裁掉溢出。 |
| E29 | 顶部 / 底部遮罩放进过窄 GUI 容器，被裁出硬边 | 遮罩必须按 Figma 父层级和实际尺寸放置；当遮罩超出 ancestor 时，挂到更外层容器。 |
| E30 | 遮罩 CSS 正确但视觉仍错，源 PNG 尺寸不匹配 | 先验 PNG 尺寸是否等于 Figma 导出尺寸；不一致就重新导出，不用 CSS 拉伸救。 |
| E31 | 最后一行按普通行距上移，底部被遮罩吞掉或贴底 | 最后一行 offset 从栈高、viewport 高和设计底边距反算；本项目默认底部呼吸位 51px。 |
| E32 | FocusRing 用 transparent 双 shadow 造间隙，变成 8px 实色环 | FocusRing 使用单层 `box-shadow: 0 0 0 var(--fr-ring-width) var(--fr-ring-color)`。 |
| E33 | MediaCard alt 多行标题底部被裁，时间字号显小 | 固定高度多行文字需用 flex / grid 垂直居中后对称裁切；meta 字号显式设 token，相关区域 `flex-shrink:0`。 |
| E34 | DUI 输入框用假光标 div，方向键 / 打字 / Enter 都失效 | 输入框必须是原生 `<input>`；方向键和 Enter 在 input 内阻止默认与冒泡，再通过 prop 上抛给页面处理。聊天等跨页状态放 Provider。 |
| E35 | 新增 LiuDehua 意图时被宽泛 documentary 正则误吞，页面 DUI 又硬编码状态 | 意图分类按窄 → 宽短路；新增意图同步改 ChatContext、App 路由、目标页面；DUI 用 feed + 绝对定位 input，不用 flex 直排硬编码。 |

## 细节补充

### E24：透明边检测

```bash
python3 -c "from PIL import Image; m=Image.open(p).convert('RGBA'); w,h=m.size; print([m.getpixel((x,h//2))[3] for x in (0,1,2,w-1,w-2,w-3)])"
```

如果边缘 alpha=0，说明导出素材带透明 padding。CSS 外扩要把透明带推出 1920 画布外，或重新导出带 bleed 的素材。

### E25：`overflow:hidden` 抖动根因

Norigin `shouldFocusDOMNode: true` 会让浏览器对目标 DOM `.focus()`；浏览器随后会对所有可滚动祖先做 auto-scroll。`overflow-x:hidden` 虽然看似只是裁切，但会创建滚动容器，因此 rail 内部宽度超过视口时，父容器可能被偷偷改 `scrollLeft`。只想裁切、不想滚动时用 `overflow:clip`。

### E33：固定高度多行文字

如果文本盒高度小于 `font-size × line-height × lines`，单层 `-webkit-line-clamp` 会顶部对齐并裁底，视觉像文字被砍掉。应让外层固定高度 + `overflow:hidden` + `display:flex; align-items:center`，内层再 line-clamp，让上下裁切对称。
