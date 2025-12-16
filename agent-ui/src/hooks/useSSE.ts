import { useEffect, useRef, useState } from 'react'
import { openChatStream } from '../api/sse'
import type { SSEHandlers } from '../api/sse'

export type SSEStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

type Options = {
  enabled?: boolean
}

export const useSSE = (
  conversationId: string | null,
  handlers: SSEHandlers,
  options?: Options,
) => {
  const [status, setStatus] = useState<SSEStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [reconnectKey, setReconnectKey] = useState(0)
  const closeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!conversationId || options?.enabled === false) {
      if (closeRef.current) {
        closeRef.current()
        closeRef.current = null
      }
      setStatus('idle')
      return
    }

    setStatus('connecting')
    setError(null)
    const { close } = openChatStream(conversationId, {
      ...handlers,
      onOpen: () => {
        setStatus('open')
        handlers.onOpen?.()
      },
      onClose: () => {
        setStatus('closed')
        handlers.onClose?.()
      },
      onError: (message) => {
        setStatus('error')
        setError(message)
        handlers.onError?.(message)
      },
    })

    closeRef.current = close

    return () => {
      close()
      closeRef.current = null
    }
  }, [conversationId, reconnectKey, options?.enabled])

  const reconnect = () => setReconnectKey((prev) => prev + 1)

  const disconnect = () => {
    if (closeRef.current) {
      closeRef.current()
      closeRef.current = null
      setStatus('closed')
    }
  }

  return { status, error, reconnect, disconnect }
}
