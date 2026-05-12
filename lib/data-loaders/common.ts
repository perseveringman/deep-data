import type {
  Channel,
  ChannelDetail,
  CrossAnalysisData,
  DailyReport,
  DeepReport,
  Keyword,
  Opinion,
  Person,
  PersonMention,
  PersonRelation,
  Tag,
  TaggedContent,
  TopicTrend,
} from '@/lib/types'
import type { ArtifactItem, ChannelInfo, DocumentItem, PersonItem, PersonMentionItem, PersonRelationItem } from '@/lib/api'
import { docToContentItem } from '@/lib/api'

export type {
  Channel,
  ChannelDetail,
  CrossAnalysisData,
  DailyReport,
  DeepReport,
  Keyword,
  Opinion,
  Person,
  PersonMention,
  PersonRelation,
  Tag,
  TaggedContent,
  TopicTrend,
}

export async function withDevFallback<T>(load: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
    return fallback()
  }
}

export function parseArtifactBody<T = unknown>(artifact?: Pick<ArtifactItem, 'body'> | null): T | null {
  const body = artifact?.body?.trim()
  if (!body) return null
  try {
    return JSON.parse(body) as T
  } catch {
    return null
  }
}

export function textFromArtifact(artifact?: Pick<ArtifactItem, 'body' | 'summary'> | null): string {
  return artifact?.body?.trim() || artifact?.summary?.trim() || ''
}

export function firstParagraph(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((part) => part.replace(/^#+\s+/, '').trim())
    .find((part) => part && !part.startsWith('- ') && !part.startsWith('* ')) || ''
}

export function bullets(markdown: string, limit = 6): string[] {
  return markdown
    .split('\n')
    .map((line) => line.match(/^\s*[-*]\s+(.+)/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line))
    .slice(0, limit)
}

export function dateFromArtifact(artifact: ArtifactItem): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(artifact.subject_ref)) return artifact.subject_ref
  const dateMatch = artifact.version_key?.match(/\d{4}-\d{2}-\d{2}/)?.[0]
  return dateMatch || artifact.created_at.slice(0, 10)
}

export function artifactTitle(artifact: ArtifactItem, fallback: string): string {
  if (artifact.title) return artifact.title
  const heading = artifact.body?.match(/^#\s+(.+)$/m)?.[1]?.trim()
  return heading || fallback
}

export function estimateReadingTime(text: string): number {
  const chars = text.replace(/\s/g, '').length
  return Math.max(3, Math.ceil(chars / 600))
}

export function normalizeDailyReport(artifact: ArtifactItem): DailyReport {
  const parsed = parseArtifactBody<Partial<DailyReport> & Record<string, unknown>>(artifact)
  const markdown = textFromArtifact(artifact)
  const date = String(parsed?.date || dateFromArtifact(artifact))
  const hotTopics = Array.isArray(parsed?.hotTopics)
    ? parsed.hotTopics
    : Array.isArray(parsed?.hot_topics)
      ? (parsed.hot_topics as DailyReport['hotTopics'])
      : []
  const channelHighlights = Array.isArray(parsed?.channelHighlights)
    ? parsed.channelHighlights
    : Array.isArray(parsed?.channel_highlights)
      ? (parsed.channel_highlights as DailyReport['channelHighlights'])
      : []

  return {
    date,
    summary: String(parsed?.summary || firstParagraph(markdown) || artifactTitle(artifact, '内容日报')),
    highlights: Array.isArray(parsed?.highlights) ? parsed.highlights : bullets(markdown, 5),
    newContentCount: Number(parsed?.newContentCount || parsed?.new_content_count || artifact.source_doc_ids?.length || 0),
    hotTopics,
    channelHighlights,
    anomalies: Array.isArray(parsed?.anomalies) ? parsed.anomalies : [],
  }
}

export function normalizeDeepReport(artifact: ArtifactItem, index = 0): DeepReport {
  const parsed = parseArtifactBody<Partial<DeepReport> & Record<string, unknown>>(artifact)
  const markdown = textFromArtifact(artifact)
  const id = String(parsed?.id || artifact.id)
  const summary = Array.isArray(parsed?.summary)
    ? parsed.summary
    : bullets(markdown, 4)
  const sections = Array.isArray(parsed?.sections) && parsed.sections.length > 0
    ? parsed.sections
    : markdown
      ? [{ title: '报告正文', content: markdown.replace(/^#\s+.+$/m, '').trim() }]
      : []

  return {
    id,
    title: String(parsed?.title || artifactTitle(artifact, '深度报告')),
    subtitle: String(parsed?.subtitle || firstParagraph(markdown) || '来自 DataHub 的已发布分析产物'),
    coverImage: String(parsed?.coverImage || artifact.coverImage || artifact.cover_image || ''),
    category: (parsed?.category as DeepReport['category']) || (artifact.category as DeepReport['category']) || 'topic-analysis',
    tags: Array.isArray(parsed?.tags) ? parsed.tags : artifact.tags || [],
    relatedChannels: Array.isArray(parsed?.relatedChannels)
      ? parsed.relatedChannels
      : artifact.relatedChannels || artifact.related_channels || [],
    publishedAt: String(parsed?.publishedAt || artifact.published_at?.slice(0, 10) || artifact.created_at.slice(0, 10)),
    readingTime: Number(parsed?.readingTime || artifact.reading_time_minutes || artifact.reading_time || estimateReadingTime(markdown)),
    status: (parsed?.status as DeepReport['status']) || (artifact.statusTag as DeepReport['status']) || (artifact.status_tag as DeepReport['status']) || (index === 0 ? 'featured' : 'latest'),
    summary: summary.length > 0 ? summary : artifact.summaryPoints || artifact.summary_points || [],
    methodology: parsed?.methodology || {
      scope: 'DataHub artifact',
      sources: artifact.source_doc_ids?.length ? [`${artifact.source_doc_ids.length} documents`] : ['DataHub'],
      timeRange: artifact.created_at.slice(0, 10),
    },
    sections,
    conclusions: Array.isArray(parsed?.conclusions) ? parsed.conclusions : [],
    relatedReports: Array.isArray(parsed?.relatedReports) ? parsed.relatedReports : [],
  }
}

export function normalizeChannel(channel: ChannelInfo): Channel {
  return {
    id: channel.value,
    name: channel.label || channel.value,
    platform: channel.value === 'youtube' ? 'youtube' : 'podcast',
    avatarUrl: '',
    subscriberCount: 0,
    videoCount: channel.count,
    lastUpdated: '',
    description: `${channel.count} 条内容`,
    tags: [channel.label || channel.value],
  }
}

export function normalizeDocumentAsTaggedContent(doc: DocumentItem): TaggedContent {
  const item = docToContentItem(doc)
  return {
    id: item.id,
    type: item.type === 'youtube' ? 'video' : 'podcast',
    title: item.title,
    channelId: item.channelId,
    channelName: item.channelName,
    date: item.publishedAt,
    snippet: item.summary,
    tags: doc.tags || [],
  }
}

export function normalizeTag(tag: { tag: string; count: number }, index: number): Tag {
  return {
    id: `tag-${tag.tag.toLowerCase().replace(/\s+/g, '-')}`,
    name: tag.tag,
    slug: encodeURIComponent(tag.tag),
    level: index < 8 ? 1 : 2,
    parentId: index < 8 ? undefined : 'tag-other',
    color: '#2563eb',
    description: `${tag.count} 条内容关联到 ${tag.tag}`,
    contentCount: tag.count,
    channelCount: 0,
    personCount: 0,
    trending: 'stable',
    lastUpdated: new Date().toISOString().slice(0, 10),
  }
}

export function normalizePerson(person: PersonItem): Person {
  return {
    id: person.id,
    name: person.name,
    title: person.title || '',
    organization: person.organization || '',
    avatar: person.avatar || '',
    tags: person.tags || [],
    mentionCount: Number(person.mentionCount ?? person.mention_count ?? 0),
    firstMentioned: person.firstMentioned || person.first_mentioned || '',
    lastMentioned: person.lastMentioned || person.last_mentioned || '',
    description: person.description || '',
  }
}

export function normalizePersonRelation(relation: PersonRelationItem): PersonRelation {
  const sourceId = relation.sourceId || relation.source_id || ''
  const targetId = relation.targetId || relation.target_id || ''
  const relationType = relation.relationType || relation.relation_type || 'collaborator'
  return {
    sourceId,
    targetId,
    relationType: relationType as PersonRelation['relationType'],
    strength: Number(relation.strength || 50),
    evidence: (relation.evidence || []).map((item) => ({
      contentId: item.contentId || item.content_id || '',
      channelName: item.channelName || item.channel_name || '',
      snippet: item.snippet || '',
      date: item.date || '',
    })),
  }
}

export function normalizePersonMention(mention: PersonMentionItem): PersonMention {
  return {
    id: mention.id,
    personId: mention.personId || mention.person_id || '',
    channelId: mention.channelId || mention.channel_id || '',
    channelName: mention.channelName || mention.channel_name || '',
    contentTitle: mention.contentTitle || mention.content_title || '',
    snippet: mention.snippet || '',
    sentiment: (mention.sentiment as PersonMention['sentiment']) || 'neutral',
    date: mention.date || '',
    topics: mention.topics || [],
  }
}
