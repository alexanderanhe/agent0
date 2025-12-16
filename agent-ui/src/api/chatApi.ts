import type { Message, ConversationSummary } from '../types/chat'
import { uuid } from '../utils/uuid'
import type { ChatHistoryResponse } from '../types/chat'

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:3000'

const buildUrl = (path: string) => {
  const base = API_BASE_URL?.replace(/\/+$/, '') || ''
  return `${base}${path}`
}

export const postChat = async (input: string, conversationId?: string) => {
  const res = await fetch(buildUrl('/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      conversationId ? { conversationId, input } : { input },
    ),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error sending message')
  }

  const data = (await res.json()) as { conversationId: string; status: string }
  return data
}

type RawMessage = {
  role: Message['role']
  content: string
  createdAt?: string
  id?: string
  _id?: string
}

type RawHistoryResponse = {
  conversationId?: string
  _id?: string
  messages?: RawMessage[]
  hasMore?: boolean
  nextCursor?: string | null
  total?: number
}

type RawConversation = {
  id: string
  _id?: string
  createdAt?: string
  updatedAt?: string
  messagesCount: number
  lastMessage?: {
    role: Message['role']
    content: string
    createdAt?: string
  } | null
}

export const getChatHistory = async (
  conversationId: string,
  params?: { before?: string; limit?: number },
): Promise<ChatHistoryResponse> => {
  const url = new URL(buildUrl(`/chat/${conversationId}`))
  if (params?.before) url.searchParams.set('before', params.before)
  if (params?.limit) url.searchParams.set('limit', String(params.limit))

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error fetching chat history')
  }

  const data = (await res.json()) as RawHistoryResponse
  const id = data.conversationId || data._id || conversationId
  const messages = (data.messages || []).map((msg, index) => ({
    id: msg.id || msg._id || `${id}-${index}-${uuid()}`,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  }))

  return {
    conversationId: id,
    messages,
    hasMore: Boolean(data.hasMore),
    nextCursor: data.nextCursor ?? null,
    total: data.total ?? messages.length,
  }
}

export const getConversations = async (
  params?: { limit?: number },
): Promise<ConversationSummary[]> => {
  const url = new URL(buildUrl('/conversations'))
  if (params?.limit) url.searchParams.set('limit', String(params.limit))

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error fetching conversations')
  }

  const data = (await res.json()) as RawConversation[]
  return data.map((item, index) => ({
    id: item.id || item._id || `conv-${index}-${uuid()}`,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    messagesCount: item.messagesCount ?? 0,
    lastMessage: item.lastMessage
      ? {
          role: item.lastMessage.role,
          content: item.lastMessage.content,
          createdAt: item.lastMessage.createdAt,
        }
      : null,
  }))
}
