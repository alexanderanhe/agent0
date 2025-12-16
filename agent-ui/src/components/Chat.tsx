import { useEffect, useRef, useState } from 'react'
import { useChat } from '../hooks/useChat'
import { ChatInput } from './ChatInput'
import { MessageBubble } from './MessageBubble'

export const Chat = () => {
  const {
    conversationId,
    messages,
    sendMessage,
    startNewChat,
    sending,
    isStreaming,
    sseStatus,
    sseError,
    error,
    reconnectSSE,
    historyLoading,
    loadOlderMessages,
    hasMore,
    loadingOlder,
    conversations,
    conversationsLoading,
    selectConversation,
  } = useChat()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'info' | 'success' | 'error' } | null>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const el = messagesContainerRef.current
    if (!el) return
    if (!stickToBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, isStreaming])

  useEffect(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    if (sseError) {
      setToast({ message: sseError, tone: 'error' })
    } else {
      let message: string | null = null
      let tone: 'info' | 'success' | 'error' = 'info'
      if (sseStatus === 'open') {
        message = 'SSE connected'
        tone = 'success'
      } else if (sseStatus === 'connecting') {
        message = 'Connecting SSE...'
      } else if (sseStatus === 'closed') {
        message = 'SSE closed'
      } else if (sseStatus === 'error') {
        message = 'SSE error'
        tone = 'error'
      } else {
        message = null
      }
      if (message) setToast({ message, tone })
    }

    if (toast) {
      toastTimerRef.current = setTimeout(() => setToast(null), 2800)
    }

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [sseStatus, sseError])

  const handleSend = async () => {
    if (!input.trim()) return
    await sendMessage(input)
    setInput('')
    inputRef.current?.focus()
  }

  const handleScroll = async () => {
    const el = messagesContainerRef.current
    if (!el) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < 120

    if (el.scrollTop <= 0 && hasMore && !loadingOlder) {
      const prevHeight = el.scrollHeight
      const added = await loadOlderMessages()
      if (added > 0) {
        requestAnimationFrame(() => {
          const newHeight = el.scrollHeight
          el.scrollTop = newHeight - prevHeight
        })
      }
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${(() => {
              const statusColor = {
                idle: 'bg-slate-300',
                connecting: 'bg-amber-400',
                open: 'bg-emerald-500',
                closed: 'bg-slate-400',
                error: 'bg-red-500',
              }
              return statusColor[sseStatus] || 'bg-slate-300'
            })()}`} />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chat tester</p>
              <h1 className="text-lg font-semibold text-slate-900">SSE demo frontend</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
              aria-label="Toggle conversations"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 min-h-0">
        {toast && (
          <div
            className={`pointer-events-none fixed left-1/2 top-4 z-20 -translate-x-1/2 transform rounded-full px-4 py-2 text-sm shadow-md ${
              toast.tone === 'success'
                ? 'bg-emerald-50 text-emerald-800'
                : toast.tone === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-slate-50 text-slate-700'
            }`}
          >
            {toast.message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 shadow-sm">
            {error}
          </div>
        )}

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-4 overflow-y-auto p-4"
            onScroll={handleScroll}
          >
            {(historyLoading || loadingOlder) && (
              <div className="flex items-center justify-center py-2 text-xs text-slate-500">
                <span className="animate-pulse">Loading messages...</span>
              </div>
            )}
            {!historyLoading && messages.length === 0 && (
              <p className="text-sm text-slate-500">
                Start a chat by sending your first message.
              </p>
            )}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSend}
              inputRef={inputRef}
              disabled={sending || isStreaming}
            />
            {(sending || isStreaming) && (
              <p className="mt-2 text-xs text-slate-500">
                {sending ? 'Sending message...' : 'Waiting for response...'}
              </p>
            )}
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 flex justify-end lg:static lg:block">
          <div
            className="flex-1 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <aside className="relative h-full w-80 max-w-[80vw] border-l border-slate-200 bg-white shadow-2xl lg:h-auto lg:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Conversations</p>
                <p className="text-sm text-slate-700">Recent threads</p>
              </div>
              <button
                type="button"
                className="flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-600 hover:border-slate-300"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-600">
            <button
              type="button"
              className="rounded-md border border-blue-200 px-2 py-1 text-blue-700 hover:border-blue-400 hover:text-blue-800"
              onClick={() => {
                startNewChat()
                setInput('')
                setSidebarOpen(false)
              }}
            >
              New chat
            </button>
            <span>
              {conversationsLoading
                  ? 'Loading...'
                  : `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`}
              </span>
            </div>
            <div className="h-[calc(100%-120px)] overflow-y-auto px-3 py-2">
              {conversationsLoading && (
                <p className="px-2 py-2 text-xs text-slate-500">Loading conversations...</p>
              )}
              {!conversationsLoading && conversations.length === 0 && (
                <p className="px-2 py-2 text-xs text-slate-500">No conversations yet.</p>
              )}
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const isActive = conv.id === conversationId
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? 'border-blue-400 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      onClick={() => {
                        selectConversation(conv.id)
                        setSidebarOpen(false)
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono truncate">{conv.id}</span>
                        <span>{conv.messagesCount} msg</span>
                      </div>
                      {conv.lastMessage && (
                        <p className="mt-1 max-h-10 overflow-hidden text-xs leading-snug text-slate-700">
                          <strong>{conv.lastMessage.role}:</strong> {conv.lastMessage.content}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
