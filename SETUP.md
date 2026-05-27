# 接入指南

## 1. 配置 GitHub Token

向团队申请一个有 `read:packages` 权限的 GitHub Personal Access Token。

在项目根目录创建 `.env.local`（不要提交到 git）：

```
GITHUB_TOKEN=你的token
```

或者直接设置环境变量：

```bash
export GITHUB_TOKEN=你的token
```

## 2. 安装依赖

```bash
npm install
```

## 3. 启动开发服务

```bash
NODE_ENV=development npm run dev
```

## 4. 生成新页面

按 `CLAUDE.md` 的流程操作，组件库通过以下方式引入：

```ts
import { MediaCard, TopBar, FocusSection } from '@yst-design-team/tv-ui-components'
import '@yst-design-team/tv-ui-components/components.css'
import '@yst-design-team/tv-ui-components/tokens.css'
```
