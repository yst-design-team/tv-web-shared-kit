# _template — 新页面骨架

## 用法

```bash
# 1. 复制骨架
cp -r src/pages/_template src/pages/YourPage   # PascalCase 文件夹名

# 2. 重命名（macOS / Linux）
cd src/pages/YourPage
git mv TemplatePage.tsx YourPage.tsx
git mv TemplatePage.css YourPage.css

# 3. 全局替换标识符（不要手改，容易漏）
sed -i '' 's/TemplatePage/YourPage/g; s/template-page/your-page/g; s/templatePage/yourPage/g' *.tsx *.css index.ts mockData.ts
sed -i '' 's/PAGE_ID = .template./PAGE_ID = "your-page"/' YourPage.tsx
```

## 接下来必须做的 5 件事

1. **改 mockData.ts**：替换字段名前缀（`templatePage*` → `yourPage*`），重写 hero / rail / 其它分组的内容；图片 seed 用人能读的字符串。
2. **注册 pageRegistry.ts**：参考 `docs/PAGE_IMPLEMENTATION_CHECKLIST.md §1`，选定 `componentProfile`、`defaultFocusKey`、`duiMode` 等字段。
3. **挂路由**：在 `src/App.tsx` 的页面渲染分支里加 `case 'your-page': return <YourPage />`。
4. **加 deep link**：在 `docs/DEV_DEEP_LINKS.md` 加 `?page=your-page` 行。
5. **跑校验**：
   - `npm run inventory:check`
   - `npm run verify -- --scope=storybook,app,build,lint,inventory,nomod`
   - 满意后 `npm run images:localize -- your-page` 把图落地，再 `npm run snapshot -- generate-your-page-post`

## 禁忌

- 不要修改 `src/components/<已有>/*`。要扩展功能 → 在 `src/pages/YourPage/` 里新建组件，登记 `component-inventory.json`，详见 `docs/GENERATION_STRATEGY.md §3`。
- 不要在 `.tsx` 里写 `#xxxxxx` 颜色或魔法 px。一律走 `tokens.css` 变量。
- 不要在 JSX 内贴 `https://images.unsplash.com/...`。一律走 `pickImage()`。
