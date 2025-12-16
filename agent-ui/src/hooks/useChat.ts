import { useEffect, useRef, useState } from 'react'
import { getChatHistory, getConversations, postChat } from '../api/chatApi'
import type { SSEStatus } from './useSSE'
import { useSSE } from './useSSE'
import type { Message, ConversationSummary } from '../types/chat'
import { uuid } from '../utils/uuid'
import { paginationConfig } from '../config/pagination'
import { openConversationsStream } from '../api/sse'

type UseChatState = {
  conversationId: string | null
  messages: Message[]
  sendMessage: (input: string) => Promise<void>
  startNewChat: () => void
  sending: boolean
  isStreaming: boolean
  sseStatus: SSEStatus
  sseError: string | null
  error: string | null
  reconnectSSE: () => void
  historyLoading: boolean
  loadOlderMessages: () => Promise<number>
  hasMore: boolean
  loadingOlder: boolean
  conversations: ConversationSummary[]
  conversationsLoading: boolean
  refreshConversations: () => Promise<void>
  selectConversation: (id: string) => void
  notFound: boolean
}

export const useChat = (): UseChatState => {
  const getConversationIdFromUrl = () => {
    if (typeof window === 'undefined') return null
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
    return path || null
  }

  const updateUrl = (id: string | null) => {
    if (typeof window === 'undefined') return
    const newPath = id ? `/${id}` : '/'
    window.history.replaceState({}, '', newPath)
  }

  const initialConversationId = getConversationIdFromUrl()
  const [conversationId, setConversationIdState] = useState<string | null>(
    initialConversationId,
  )
  const [hydrateHistory, setHydrateHistory] = useState<boolean>(
    () => Boolean(initialConversationId),
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [sseError, setSseError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const conversationStreamRef = useRef<ReturnType<typeof openConversationsStream> | null>(null)
  const streamingMessageId = useRef<string | null>(null)
  const oldestCursorRef = useRef<string | null>(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setHistoryLoading(false)
      setHasMore(false)
      oldestCursorRef.current = null
      setNotFound(false)
      return
    }

    if (!hydrateHistory) return

    let cancelled = false

    const loadHistory = async () => {
      setHistoryLoading(true)
      try {
        const data = await getChatHistory(conversationId, {
          limit: paginationConfig.pageSize,
        })
        if (cancelled) return
        setConversationIdState(data.conversationId)
        updateUrl(data.conversationId)
        setMessages(
          data.messages.map((msg) => ({
            ...msg,
            id: msg.id || uuid(),
          })),
        )
        setHasMore(data.hasMore)
        oldestCursorRef.current = data.nextCursor
      } catch (err) {
        if (cancelled) return
        const status = (err as { status?: number }).status
        if (status === 404) {
          setNotFound(true)
          setConversationIdState(null)
          updateUrl(null)
          setMessages([])
        } else {
          setError((err as Error).message)
        }
      } finally {
        if (cancelled) return
        setHydrateHistory(false)
        setHistoryLoading(false)
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [conversationId, hydrateHistory])

  const ensureAssistantMessage = () => {
    if (streamingMessageId.current) return
    const id = uuid()
    streamingMessageId.current = id
    setMessages((prev) => [...prev, { id, role: 'assistant', content: '' }])
  }

  const handleToken = (token: string) => {
    ensureAssistantMessage()
    setIsStreaming(true)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingMessageId.current
          ? { ...msg, content: msg.content + token }
          : msg,
      ),
    )
  }

  const handleDone = () => {
    setIsStreaming(false)
    streamingMessageId.current = null
  }

  const handleSseError = (message: string) => {
    setIsStreaming(false)
    streamingMessageId.current = null
    setSseError(message)
  }

  const handleSseOpen = () => {
    setSseError(null)
  }

  const { status: sseStatus, error: statusError, reconnect, disconnect } =
    useSSE(
      conversationId,
      {
        onToken: handleToken,
        onDone: handleDone,
        onError: handleSseError,
        onOpen: handleSseOpen,
      },
      { enabled: Boolean(conversationId) && !historyLoading },
    )

  useEffect(() => {
    if (statusError) setSseError(statusError)
  }, [statusError])

  const sendMessage = async (input: string) => {
    const text = input.trim()
    if (!text || sending || isStreaming) return

    setSending(true)
    setError(null)
    setSseError(null)

    const userMessage: Message = {
      id: uuid(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      let currentConversationId = conversationId
      if (!currentConversationId) {
        const res = await postChat(text)
        currentConversationId = res.conversationId
        setConversationIdState(currentConversationId)
        updateUrl(currentConversationId)
      } else {
        await postChat(text, currentConversationId)
      }

      const assistantId = uuid()
      streamingMessageId.current = assistantId
      setIsStreaming(true)
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ])
      void refreshConversations()
    } catch (err) {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id),
      )
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setConversationIdState(null)
    setHydrateHistory(false)
    updateUrl(null)
    streamingMessageId.current = null
    setIsStreaming(false)
    setError(null)
    setSseError(null)
    setHistoryLoading(false)
    setHasMore(false)
    oldestCursorRef.current = null
    disconnect()
    void refreshConversations()
    setNotFound(false)
  }

  const selectConversation = (id: string) => {
    if (!id) return
    if (id === conversationId) return
    disconnect()
    setMessages([])
    setConversationIdState(id)
    setHydrateHistory(true)
    setIsStreaming(false)
    setError(null)
    setSseError(null)
    setHistoryLoading(false)
    setHasMore(false)
    oldestCursorRef.current = null
    updateUrl(id)
  }

  const refreshConversations = async () => {
    setConversationsLoading(true)
    try {
      const list = await getConversations({ limit: 50 })
      setConversations(list)
    } catch (err) {
      // Surface as generic error only if none exists
      if (!error) setError((err as Error).message)
    } finally {
      setConversationsLoading(false)
    }
  }

  useEffect(() => {
    void refreshConversations()

    if (!conversationStreamRef.current) {
      const stream = openConversationsStream({
        onConversation: (payload) => {
          if (
            payload &&
            typeof payload === 'object' &&
            'conversation' in payload
          ) {
            const conv = (payload as { conversation: ConversationSummary }).conversation
            setConversations((prev) => {
              const exists = prev.find((c) => c.id === conv.id)
              if (exists) return prev
              return [conv, ...prev].slice(0, 50)
            })
          }
        },
        onError: (message) => {
          if (!error) setError(message)
        },
      })
      conversationStreamRef.current = stream
    }

    return () => {
      conversationStreamRef.current?.close()
      conversationStreamRef.current = null
    }
  }, [])

  const loadOlderMessages = async (): Promise<number> => {
    if (
      !conversationId ||
      loadingOlder ||
      historyLoading ||
      !hasMore
    ) {
      return 0
    }

    const before =
      oldestCursorRef.current ||
      messages[0]?.createdAt ||
      null

    if (!before) return 0

    setLoadingOlder(true)
    try {
      const data = await getChatHistory(conversationId, {
        before,
        limit: paginationConfig.pageSize,
      })

      const normalized = data.messages.map((msg) => ({
        ...msg,
        id: msg.id || uuid(),
      }))

      setMessages((prev) => [...normalized, ...prev])
      setHasMore(data.hasMore)
      oldestCursorRef.current = data.nextCursor
      return normalized.length
    } catch (err) {
      setError((err as Error).message)
      return 0
    } finally {
      setLoadingOlder(false)
    }
  }

  return {
    conversationId,
    messages,
    sendMessage,
    startNewChat,
    sending,
    isStreaming,
    sseStatus,
    sseError,
    error,
    reconnectSSE: reconnect,
    historyLoading,
    loadOlderMessages,
    hasMore,
    loadingOlder,
    conversations,
    conversationsLoading,
    refreshConversations,
    selectConversation,
    notFound,
  }
}
