import { useEffect, useState } from 'react'
import './App.css'
import { ChatProvider, pageForChatIntent } from './chat'
import { Stage } from '@yst-design-team/tv-ui-components'
import { TemplatePage } from './pages/_template'
import { initFocusEngine } from '@yst-design-team/tv-ui-components'

function App() {
  const [page, setPage] = useState('template')

  useEffect(() => {
    initFocusEngine()
  }, [])

  return (
    <ChatProvider onIntent={intent => setPage(pageForChatIntent(intent))}>
      <Stage background="#0f1115">
        {page === 'template' && <TemplatePage />}
        {/* 在这里添加你生成的新页面，例如：
          {page === 'my-new-page' && <MyNewPage />}
        */}
      </Stage>
    </ChatProvider>
  )
}

export default App
