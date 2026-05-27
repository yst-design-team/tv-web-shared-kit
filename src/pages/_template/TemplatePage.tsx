/**
 * TemplatePage — 新页面骨架
 *
 * 复制方式：
 *   cp -r src/pages/_template src/pages/<YourPage>
 *
 * 然后按文件内 `// RENAME:` 注释逐项替换。最少改动：
 *   1. 文件 / 文件夹名（TemplatePage → YourPage）
 *   2. PAGE_ID 常量
 *   3. mockData.ts 里的数据
 *   4. 在 src/pageRegistry.ts 注册新页面
 *   5. 在 src/App.tsx 路由里挂上（如需要）
 *
 * 严格遵守 docs/GENERATION_STRATEGY.md 的 7 条硬不变量：
 *   - 只用 tokens.css 既有变量；不准内联 #xxxxxx 颜色 / 魔法 px
 *   - 假数据放 mockData.ts；不要 inline
 *   - 图片走 pickImage()；提交前 images:localize
 *   - 新组件须有 stories + 登记 inventory.json
 */

import { useEffect } from 'react'
import { Focusable, FocusSection, setFocus } from '../../focus'
import { templatePageHero, templatePageRail } from './mockData'
import './TemplatePage.css'

/*
 * 常用组件按需引入（取消注释即可）：
 *   import { TextButton } from '../../components/TextButton'
 *   import { MediaCard } from '../../components/MediaCard'
 *   import { AssistantInput } from '../../components/AssistantInput'
 *   import { DUIBubble } from '../../components/DUIBubble'
 *   import { TopBar } from '../../components/TopBar'
 */

// RENAME: 把这个常量换成你新页面的 id，并在 src/pageRegistry.ts 同步注册
const PAGE_ID = 'template'

export function TemplatePage() {
  useEffect(() => {
    // RENAME: 替换为新页面的默认 focusKey；保持与 pageRegistry.defaultFocusKey 一致
    setFocus(`${PAGE_ID}-hero`)
  }, [])

  return (
    <div className="template-page" data-page={PAGE_ID} data-scene="ai-space">
      <FocusSection focusKey={`${PAGE_ID}-main`}>
        <header className="template-page__header">
          <h1 className="template-page__title">{templatePageHero.title}</h1>
          <p className="template-page__subtitle">{templatePageHero.subtitle}</p>
        </header>

        <section className="template-page__hero-row">
          <Focusable focusKey={`${PAGE_ID}-hero`}>
            {({ focused }) => (
              <article
                className="template-page__hero"
                data-state={focused ? 'focus' : 'default'}
              >
                <img
                  className="template-page__hero-cover"
                  src={templatePageHero.cover}
                  alt={templatePageHero.title}
                />
                <div className="template-page__hero-meta">{templatePageHero.meta}</div>
              </article>
            )}
          </Focusable>
        </section>

        <section className="template-page__rail">
          {templatePageRail.map((item, idx) => (
            <Focusable key={item.id} focusKey={`${PAGE_ID}-rail-${idx}`}>
              {({ focused }) => (
                <article
                  className="template-page__rail-item"
                  data-state={focused ? 'focus' : 'default'}
                >
                  <img
                    className="template-page__rail-cover"
                    src={item.cover}
                    alt={item.title}
                  />
                  <h3 className="template-page__rail-title">{item.title}</h3>
                  <p className="template-page__rail-meta">{item.meta}</p>
                </article>
              )}
            </Focusable>
          ))}
        </section>
      </FocusSection>
    </div>
  )
}

export default TemplatePage
