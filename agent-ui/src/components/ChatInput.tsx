import type { FormEvent } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export const ChatInput = ({ value, onChange, onSubmit, disabled, inputRef }: Props) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (disabled) return
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <input
        ref={inputRef}
        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
        placeholder="Type your message..."
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Send
      </button>
    </form>
  )
}
