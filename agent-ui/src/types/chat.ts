export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt?: string
}

export interface ChatHistoryResponse {
  conversationId: string
  messages: Message[]
  hasMore: boolean
  nextCursor: string | null
  total: number
}

export interface ConversationSummary {
  id: string
  createdAt?: string
  updatedAt?: string
  messagesCount: number
  lastMessage: {
    role: Role
    content: string
    createdAt?: string
  } | null
}
