import type { Message } from '../types/chat'

type Props = {
  message: Message
}

const roleStyles = {
  user: 'bg-[#0099FF] text-white ml-auto rounded-2xl rounded-br-sm',
  assistant: 'bg-slate-200 text-slate-900 mr-auto rounded-2xl rounded-bl-sm',
}

const alignStyles = {
  user: 'items-end text-right',
  assistant: 'items-start text-left',
}

export const MessageBubble = ({ message }: Props) => {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${alignStyles[message.role]} gap-2`}>
      <div
        className={`max-w-[75%] px-4 py-3 text-sm shadow-sm ${roleStyles[message.role]}`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.createdAt && (
          <span className={`mt-2 block text-[11px] opacity-75 ${isUser ? 'text-white' : 'text-slate-600'}`}>
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}
