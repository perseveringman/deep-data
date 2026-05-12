import { getDocumentRouteId, listDocuments, listSources } from '@/lib/api'
import { documentTopics, parseChannelId } from './channels'
import { withDevFallback, type ChannelDetail } from './common'

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export async function loadChannelDetail(id: string): Promise<ChannelDetail | null> {
  return withDevFallback(
    async () => {
      const { sourceType, source } = parseChannelId(id)
      const [documents, sources] = await Promise.all([
        listDocuments({ source_type: sourceType, source, limit: 50 }),
        listSources(sourceType),
      ])
      const docs = documents.items
      if (docs.length === 0) return null
      const topics = documentTopics(docs)
      const matched = sources.sources.find((item) => item.source === source)
      return {
        id,
        name: docs[0]?.podcast_title || source || sourceType,
        platform: sourceType === 'youtube' ? 'youtube' : 'podcast',
        avatarUrl: docs[0]?.cover_url || '',
        description: `${matched?.count || docs.length} 条内容`,
        subscriberCount: 0,
        videoCount: matched?.count || docs.length,
        tags: topics.slice(0, 5).map((topic) => topic.name),
        lastUpdated: docs[0]?.published_at?.slice(0, 10) || '',
        topics,
        recentVideos: docs.slice(0, 8).map((doc) => ({
          id: getDocumentRouteId(doc),
          title: doc.title || '',
          publishedAt: doc.published_at ? doc.published_at.slice(0, 10) : '',
          views: 0,
          duration: formatDuration(doc.duration_seconds),
          topics: (doc.tags || []).slice(0, 3),
        })),
        engagementData: [] as ChannelDetail['engagementData'],
      }
    },
    async () => {
      const { getChannelDetail } = await import('@/lib/__mocks__')
      return getChannelDetail(id)
    },
  )
}
