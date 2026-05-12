import { listArtifacts, listChannels } from '@/lib/api'
import {
  normalizeChannel,
  normalizeDailyReport,
  parseArtifactBody,
  withDevFallback,
  type Channel,
  type DailyReport,
  type DeepReport,
  type Keyword,
  type Opinion,
  type TopicTrend,
} from './common'
import { loadDeepReports } from './deep-reports'
import { loadReports } from './reports'

export interface HomePageData {
  channels: Channel[]
  dailyReports: DailyReport[]
  deepReports: DeepReport[]
  keywords: Keyword[]
  opinions: Opinion[]
  opinionTimeline: Opinion[]
  topicTrends: TopicTrend[]
}

function normalizeKeywords(value: unknown): Keyword[] {
  const items = Array.isArray(value) ? value : Array.isArray((value as { items?: unknown[] })?.items) ? (value as { items: unknown[] }).items : []
  return items.map((item) => {
    const row = item as Record<string, unknown>
    return {
      word: String(row.word || row.keyword || row.key || ''),
      weight: Number(row.weight || row.count || 1),
      trend: (row.trend as Keyword['trend']) || 'stable',
    }
  }).filter((item) => item.word)
}

function normalizeOpinions(value: unknown): Opinion[] {
  const items = Array.isArray(value) ? value : Array.isArray((value as { items?: unknown[] })?.items) ? (value as { items: unknown[] }).items : []
  return items.map((item, index) => {
    const row = item as Record<string, unknown>
    return {
      id: String(row.id || `op-${index}`),
      channelId: String(row.channelId || row.channel_id || row.source || ''),
      channelName: String(row.channelName || row.channel_name || row.source || 'DataHub'),
      content: String(row.content || row.text || row.quote || ''),
      topic: String(row.topic || row.tag || ''),
      sentiment: (row.sentiment as Opinion['sentiment']) || 'neutral',
      timestamp: String(row.timestamp || row.created_at || new Date().toISOString()),
      videoTitle: String(row.videoTitle || row.video_title || row.title || ''),
    }
  }).filter((item) => item.content)
}

function buildTopicTrends(reports: DailyReport[]): TopicTrend[] {
  const topicSet = new Set<string>()
  reports.slice(0, 7).forEach((report) => report.hotTopics.slice(0, 3).forEach((topic) => topicSet.add(topic.topic)))
  return Array.from(topicSet).slice(0, 3).map((topic) => ({
    topic,
    data: reports
      .slice(0, 7)
      .reverse()
      .map((report) => ({
        date: report.date,
        mentions: Math.max(0, report.hotTopics.find((item) => item.topic === topic)?.change || 0),
      })),
  }))
}

export async function loadHomePageData(): Promise<HomePageData> {
  return withDevFallback(
    async () => {
      const [dailyReports, deepReports, channelResponse, opinionArtifacts, keywordArtifacts] = await Promise.all([
        loadReports(),
        loadDeepReports(),
        listChannels(),
        listArtifacts({ subject_kind: 'daily', artifact_type: 'opinions', limit: 7 }),
        listArtifacts({ subject_kind: 'daily', artifact_type: 'keywords', limit: 1 }),
      ])

      const opinions = opinionArtifacts.items.flatMap((artifact) => normalizeOpinions(parseArtifactBody(artifact))).slice(0, 12)
      const keywords = normalizeKeywords(parseArtifactBody(keywordArtifacts.items[0]))
      if (dailyReports.length === 0) {
        throw new Error('No daily digest artifacts returned from DataHub')
      }
      if (deepReports.length === 0) {
        throw new Error('No deep report artifacts returned from DataHub')
      }

      return {
        channels: channelResponse.channels.map(normalizeChannel),
        dailyReports,
        deepReports,
        keywords,
        opinions,
        opinionTimeline: opinions,
        topicTrends: buildTopicTrends(dailyReports),
      }
    },
    async () => {
      const { channels, dailyReports, deepReports, keywords, opinions, topicTrends } = await import('@/lib/__mocks__')
      return {
        channels,
        dailyReports,
        deepReports,
        keywords,
        opinions,
        opinionTimeline: opinions,
        topicTrends,
      }
    },
  )
}
