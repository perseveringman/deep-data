import Link from 'next/link'
import { MessageSquare, ArrowRight } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { loadPublishedChats } from '@/lib/data-loaders/chats'

export const dynamic = 'force-dynamic'

export default async function ChatsPage() {
  const chats = await loadPublishedChats()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <h1 className="font-serif text-base font-semibold">公开对话</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="grid gap-3 lg:grid-cols-2">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chats/${chat.id}`}
              className="group block border border-border p-3 transition-colors hover:border-foreground"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>{chat.subject}</span>
                    <span>·</span>
                    <span>{chat.messageCount} messages</span>
                  </div>
                  <h2 className="font-serif text-base font-semibold leading-tight group-hover:underline">
                    {chat.title}
                  </h2>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    更新于 {new Date(chat.updatedAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        {chats.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            暂无已发布的对话。
          </div>
        ) : null}
      </div>
    </div>
  )
}
