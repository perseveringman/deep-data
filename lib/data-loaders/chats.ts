import { getChatThread, listArtifacts, type ChatThread } from '@/lib/api'
import { parseArtifactBody, withDevFallback } from './common'

export interface PublishedChatSummary {
  id: number
  title: string
  subject: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

function chatTitle(thread: ChatThread): string {
  const parsed = parseArtifactBody<{ title?: string }>(thread)
  const firstUserMessage = thread.messages?.find((message) => message.role === 'user')?.content
  return parsed?.title || firstUserMessage?.slice(0, 80) || `Chat #${thread.id}`
}

export async function loadPublishedChats(): Promise<PublishedChatSummary[]> {
  return withDevFallback(
    async () => {
      const { items } = await listArtifacts({
        artifact_type: 'chat',
        visibility: 'published',
        limit: 50,
      })
      return items
        .filter((item) => item.visibility === 'published' && item.status === 'done')
        .map((item) => {
          const parsed = parseArtifactBody<{ title?: string; messages?: unknown[] }>(item)
          return {
            id: item.id,
            title: parsed?.title || item.title || `Chat #${item.id}`,
            subject: `${item.subject_kind}:${item.subject_ref}`,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            messageCount: parsed?.messages?.length || 0,
          }
        })
    },
    async () => [],
  )
}

export async function loadPublishedChatDetail(id: string): Promise<ChatThread | null> {
  return withDevFallback(
    async () => {
      const numericId = Number(id)
      if (!Number.isFinite(numericId)) return null
      const thread = await getChatThread(numericId)
      return {
        ...thread,
        title: thread.title || chatTitle(thread),
      }
    },
    async () => null,
  )
}
