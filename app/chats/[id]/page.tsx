import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageSquare } from 'lucide-react'

import { ChatMessageList } from '@/components/chat-panel/chat-message-list'
import { ForkChatButton } from '@/components/chat-panel/fork-chat-button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { loadPublishedChatDetail } from '@/lib/data-loaders/chats'

export const dynamic = 'force-dynamic'

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const chat = await loadPublishedChatDetail(id)
  if (!chat) notFound()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <Link href="/chats" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回公开对话
          </Link>
          <div className="ml-auto">
            <ForkChatButton threadId={chat.id} />
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-4">
        <div className="border-b border-border pb-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {chat.subject_kind}:{chat.subject_ref}
          </div>
          <h1 className="font-serif text-2xl font-bold">{chat.title || `Chat #${chat.id}`}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            发布状态：{chat.visibility} · 更新于 {new Date(chat.updated_at).toLocaleString('zh-CN')}
          </p>
        </div>

        <div className="mt-4">
          <ChatMessageList messages={chat.messages} />
        </div>
      </article>
    </div>
  )
}
