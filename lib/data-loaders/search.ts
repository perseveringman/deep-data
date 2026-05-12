import {
  getArtifact,
  listArtifacts,
  searchDocuments,
  type DocumentItem,
} from '@/lib/api'
import { parseArtifactBody, withDevFallback, type Keyword, type Opinion } from './common'

export interface SearchResult {
  id: string
  type: 'document' | 'channel' | 'topic' | 'keyword' | 'opinion'
  title: string
  snippet: string
  relevance: number
  channelId?: string
  contentId?: string
}

function docId(doc: Pick<DocumentItem, 'doc_id' | 'id'>): string {
  return doc.doc_id || String(doc.id)
}

function docToSearchResult(doc: DocumentItem, index: number): SearchResult {
  const id = docId(doc)
  return {
    id,
    type: 'document',
    title: doc.title || '(无标题)',
    snippet: doc.summary_excerpt || doc.podcast_title || doc.source || '',
    relevance: Math.max(50, 100 - index * 3),
    channelId: doc.source ? `${doc.source_type}-${doc.source}` : doc.source_type,
    contentId: id,
  }
}

async function latestDailyJson<T>(artifactType: string): Promise<T | null> {
  const listed = await listArtifacts({
    subject_kind: 'daily',
    artifact_type: artifactType,
    limit: 1,
  })
  const first = listed.items[0]
  if (!first) return null
  const artifact = await getArtifact(first.id, true)
  return parseArtifactBody<T>(artifact)
}

function normalizeOpinion(item: Partial<Opinion> & Record<string, unknown>, index: number): Opinion {
  return {
    id: String(item.id || `opinion-${index}`),
    channelId: String(item.channelId || item.channel_id || item.channel_name || ''),
    channelName: String(item.channelName || item.channel_name || item.author || 'DataHub'),
    content: String(item.content || item.quote || ''),
    topic: String(item.topic || ''),
    sentiment: (item.sentiment as Opinion['sentiment']) || 'neutral',
    timestamp: String(item.timestamp || item.ts || ''),
    videoTitle: String(item.videoTitle || item.video_title || item.source_doc_id || ''),
  }
}

export async function loadSearchResults(query: string): Promise<SearchResult[]> {
  return withDevFallback(
    async () => {
      if (!query.trim()) return []
      const response = await searchDocuments({ q: query, page_size: 30 })
      return (response.items as DocumentItem[]).map(docToSearchResult)
    },
    async () => {
      const { searchMockResults } = await import('@/lib/__mocks__')
      if (!query.trim()) return []
      return searchMockResults.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.snippet.toLowerCase().includes(query.toLowerCase()),
      ) as SearchResult[]
    },
  )
}

export async function loadSearchOpinions(): Promise<Opinion[]> {
  return withDevFallback(
    async () => {
      const payload = await latestDailyJson<Opinion[] | { opinions?: Opinion[] }>('opinions')
      const items = Array.isArray(payload) ? payload : payload?.opinions || []
      return items.map((item, index) => normalizeOpinion(item as Partial<Opinion> & Record<string, unknown>, index))
    },
    async () => {
      const { opinions } = await import('@/lib/__mocks__')
      return opinions
    },
  )
}

export async function loadSearchKeywords(): Promise<Keyword[]> {
  return withDevFallback(
    async () => {
      const payload = await latestDailyJson<Keyword[] | { keywords?: Keyword[] }>('keywords')
      const items = Array.isArray(payload) ? payload : payload?.keywords || []
      return items.map((item) => ({
        word: String(item.word),
        weight: Number(item.weight || 0),
        trend: item.trend || 'stable',
      }))
    },
    async () => {
      const { keywords } = await import('@/lib/__mocks__')
      return keywords
    },
  )
}
