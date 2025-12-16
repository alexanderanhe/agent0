const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:3000'

const buildUrl = (path: string) => {
  const base = API_BASE_URL?.replace(/\/+$/, '') || ''
  return `${base}${path}`
}

export type SSEHandlers = {
  onToken?: (token: string) => void
  onDone?: () => void
  onError?: (message: string) => void
  onOpen?: () => void
  onClose?: () => void
}

export type ConversationsSSEHandlers = {
  onConversation?: (data: unknown) => void
  onError?: (message: string) => void
  onOpen?: () => void
  onClose?: () => void
}

const parseData = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'string') return parsed
    if (parsed && typeof parsed === 'object' && 'token' in parsed) {
      return (parsed as { token: string }).token
    }
  } catch {
    // ignore parse errors, fallback to raw
  }
  return raw
}

export const openChatStream = (conversationId: string, handlers: SSEHandlers) => {
  const source = new EventSource(buildUrl(`/chat/stream/${conversationId}`))

  source.addEventListener('open', () => {
    handlers.onOpen?.()
  })

  source.addEventListener('token', (event) => {
    const data = (event as MessageEvent).data
    handlers.onToken?.(parseData(data))
  })

  source.addEventListener('done', () => {
    handlers.onDone?.()
  })

  source.addEventListener('error', (event) => {
    let message = 'Stream connection error'
    if ('data' in event && (event as MessageEvent).data) {
      const raw = (event as MessageEvent).data as string
      message = parseData(raw) || message
    }
    handlers.onError?.(message)
  })

  const close = () => {
    source.close()
    handlers.onClose?.()
  }

  return { source, close }
}

export const openConversationsStream = (handlers: ConversationsSSEHandlers) => {
  const source = new EventSource(buildUrl('/conversations/stream'))

  source.addEventListener('open', () => {
    handlers.onOpen?.()
  })

  source.addEventListener('conversation', (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data)
      handlers.onConversation?.(data)
    } catch (err) {
      handlers.onError?.(
        err instanceof Error ? err.message : 'Invalid conversation event',
      )
    }
  })

  source.addEventListener('error', (event) => {
    let message = 'Stream connection error'
    if ('data' in event && (event as MessageEvent).data) {
      const raw = (event as MessageEvent).data as string
      message = parseData(raw) || message
    }
    handlers.onError?.(message)
  })

  const close = () => {
    source.close()
    handlers.onClose?.()
  }

  return { source, close }
}
