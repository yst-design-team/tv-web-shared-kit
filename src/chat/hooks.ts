import { useContext } from 'react'
import { ChatContext, type ChatContextValue } from './context'

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat() must be used within <ChatProvider>')
  return ctx
}

export function useLatestExchange() {
  const { messages } = useChat()
  const last = messages[messages.length - 1]
  const prev = messages[messages.length - 2]
  const userMessage =
    prev?.role === 'user'
      ? prev
      : last?.role === 'user'
        ? last
        : null
  const assistantMessage = last?.role === 'assistant' ? last : null
  return { userMessage, assistantMessage }
}
