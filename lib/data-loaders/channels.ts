import { listSources, type DocumentItem } from '@/lib/api'
import { withDevFallback, type Channel } from './common'

export function sourceToChannel(source: { source_type: string; source: string; count: number }, index = 0): Channel {
  return {
    id: `${source.source_type}-${source.source || index}`,
    name: source.source || source.source_type,
    platform: source.source_type === 'youtube' ? 'youtube' : 'podcast',
    avatarUrl: '',
    subscriberCount: 0,
    videoCount: source.count || 0,
    lastUpdated: '',
    description: `${source.count || 0} 条内容`,
    tags: [source.source_type],
  }
}

export async function loadChannels(): Promise<Channel[]> {
  return withDevFallback(
    async () => {
      const { sources } = await listSources()
      return sources.map(sourceToChannel)
    },
    async () => {
      const { channels } = await import('@/lib/__mocks__')
      return channels
    },
  )
}

export function parseChannelId(id: string): { sourceType: string; source: string } {
  const parts = id.split('-')
  return { sourceType: parts[0] || '', source: parts.slice(1).join('-') }
}

export function documentTopics(docs: DocumentItem[]): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const doc of docs) {
    for (const tag of doc.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))
}
