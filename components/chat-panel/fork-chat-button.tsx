'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitFork } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { forkChatThread } from '@/lib/api'

export function ForkChatButton({ threadId }: { threadId: number }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true)
          setError(null)
          try {
            const fork = await forkChatThread(threadId)
            router.push(`/chats/${fork.id}`)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Fork failed')
          } finally {
            setPending(false)
          }
        }}
      >
        <GitFork className="h-3.5 w-3.5" />
        {pending ? '分叉中…' : '分叉继续聊'}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
