import type { ChatMessage } from '@/lib/api'

export function ChatMessageList({ messages = [] }: { messages?: ChatMessage[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无公开消息。</p>
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <article key={`${message.role}-${index}`} className="rounded border border-border p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {message.role}
            {message.model ? ` · ${message.model}` : ''}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </article>
      ))}
    </div>
  )
}
