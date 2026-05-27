import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  classifyChatIntent,
  replyForChatIntent,
  type ChatIntentId,
} from './intents'
import { ChatContext, type ChatContextValue, type ChatMessage } from './context'

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'seed-u',
    role: 'user',
    content: '帮我找下《坚如磐石》帮我找下《坚如磐石》',
  },
  {
    id: 'seed-a',
    role: 'assistant',
    content:
      '帮我找下《坚如磐石》帮我找下《坚如磐石》帮我找下《坚如磐石》帮我找下《坚如磐石》',
  },
]

export interface ChatProviderProps {
  children: ReactNode
  onIntent?: (intent: ChatIntentId) => void
}

export function ChatProvider({ children, onIntent }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES)
  const onIntentRef = useRef(onIntent)

  useEffect(() => {
    onIntentRef.current = onIntent
  }, [onIntent])

  const send = useCallback((raw: string) => {
    const text = raw.trim()
    if (!text) return
    const intent = classifyChatIntent(text)
    const ts = Date.now()
    setMessages(prev => [
      ...prev,
      { id: `m-${ts}-u`, role: 'user', content: text },
      {
        id: `m-${ts}-a`,
        role: 'assistant',
        content: replyForChatIntent(intent),
        intent,
      },
    ])
    if (intent) onIntentRef.current?.(intent)
  }, [])

  const value = useMemo<ChatContextValue>(
    () => ({ messages, send }),
    [messages, send],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
