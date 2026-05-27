import { createContext } from 'react'
import type { ChatIntent } from './intents'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  intent?: ChatIntent
}

export interface ChatContextValue {
  messages: ChatMessage[]
  send: (text: string) => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)
