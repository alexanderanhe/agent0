import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MessageBubble } from './MessageBubble'

describe('MessageBubble', () => {
  it('renders message content and timestamp', () => {
    const timeSpy = vi
      .spyOn(Date.prototype, 'toLocaleTimeString')
      .mockReturnValue('10:00:00')

    render(
      <MessageBubble
        message={{
          id: 'm-1',
          role: 'assistant',
          content: 'Hello world',
          createdAt: '2024-01-01T10:00:00.000Z',
        }}
      />,
    )

    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('10:00:00')).toBeInTheDocument()

    timeSpy.mockRestore()
  })
})
