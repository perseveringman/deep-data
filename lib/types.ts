export interface ContentItem {
  id: string
  type: 'youtube' | 'podcast'
  playbackKind?: 'video' | 'audio' | 'none'
  playbackUrl?: string
  title: string
  channelId: string
  channelName: string
  channelAvatar?: string
  publishedAt: string
  duration: string
  durationSeconds: number
  language?: string
  viewCount?: number
  likeCount?: number
  coverUrl?: string
  videoUrl?: string
  audioUrl?: string
  tags: string[]
  summary: string
  hasTranscript: boolean
  contentFile: string
}

export interface TranscriptSegment {
  speaker?: string
  startMs: number
  text: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  level: 1 | 2
  parentId?: string
  color: string
  description: string
  contentCount: number
  channelCount: number
  personCount: number
  trending: 'up' | 'down' | 'stable'
  lastUpdated: string
}

export interface TagRelation {
  tagId: string
  entityType: 'channel' | 'content' | 'person' | 'opinion' | 'report'
  entityId: string
}

export interface TaggedContent {
  id: string
  type: 'video' | 'podcast' | 'opinion' | 'report'
  title: string
  channelId: string
  channelName: string
  date: string
  snippet: string
  tags: string[]
}

export interface Channel {
  id: string
  name: string
  platform: 'youtube' | 'podcast'
  avatarUrl: string
  subscriberCount: number
  videoCount: number
  lastUpdated: string
  description: string
  tags: string[]
}

export interface TopicTrend {
  topic: string
  data: { date: string; mentions: number }[]
}

export interface Keyword {
  word: string
  weight: number
  trend: 'up' | 'down' | 'stable'
}

export interface Opinion {
  id: string
  channelId: string
  channelName: string
  content: string
  topic: string
  sentiment: 'positive' | 'negative' | 'neutral'
  timestamp: string
  videoTitle: string
}

export interface ChannelDetail extends Channel {
  topics: { name: string; count: number }[]
  recentVideos: {
    id: string
    title: string
    publishedAt: string
    views: number
    duration: string
    topics: string[]
  }[]
  engagementData: { date: string; views: number; likes: number; comments: number }[]
}

export interface DailyReport {
  date: string
  summary: string
  highlights: string[]
  newContentCount: number
  hotTopics: { topic: string; change: number }[]
  channelHighlights: { channelId: string; channelName: string; highlight: string }[]
  anomalies: string[]
}

export interface CrossAnalysisData {
  channels: string[]
  matrix: number[][]
}

export interface SearchResult {
  id: string
  type: 'channel' | 'topic' | 'keyword' | 'opinion'
  title: string
  snippet: string
  relevance: number
  channelId?: string
  channelName?: string
}

export interface DeepReport {
  id: string
  title: string
  subtitle: string
  coverImage: string
  category: 'topic-analysis' | 'creator-profile' | 'industry-comparison' | 'trend-tracking'
  tags: string[]
  relatedChannels: string[]
  publishedAt: string
  readingTime: number
  status: 'latest' | 'featured' | 'popular' | 'normal'
  summary: string[]
  methodology: {
    scope: string
    sources: string[]
    timeRange: string
  }
  sections: {
    title: string
    content: string
    charts?: { type: string; data: unknown }[]
    quotes?: { text: string; source: string }[]
  }[]
  conclusions: string[]
  relatedReports: string[]
}

export interface Person {
  id: string
  name: string
  title: string
  organization: string
  avatar: string
  tags: string[]
  mentionCount: number
  firstMentioned: string
  lastMentioned: string
  description: string
}

export interface PersonRelation {
  sourceId: string
  targetId: string
  relationType: 'colleague' | 'competitor' | 'mentor' | 'collaborator' | 'critic' | 'supporter'
  strength: number
  evidence: {
    contentId: string
    channelName: string
    snippet: string
    date: string
  }[]
}

export interface PersonMention {
  id: string
  personId: string
  channelId: string
  channelName: string
  contentTitle: string
  snippet: string
  sentiment: 'positive' | 'negative' | 'neutral'
  date: string
  topics: string[]
}
