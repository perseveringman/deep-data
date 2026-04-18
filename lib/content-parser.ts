"use client"

export interface YouTubeContent {
  metadata: {
    videoId: string
    title: string
    videoUrl: string
    channelName: string
    channelId: string
    uploaderId: string
    publishedAt: string
    durationSeconds: number
    durationHuman: string
    viewCount: number
    likeCount: number
    hasSubtitle: boolean
    language: string
    categories?: string
  }
  description: string
  timestamps: { time: string; seconds: number; title: string }[]
  transcript: { startMs: number; text: string }[]
}

export interface PodcastContent {
  metadata: {
    docId: string
    source: string
    title: string
    podcastTitle: string
    publishedAt: string
    durationSeconds: number | null
    audioUrl: string
    coverUrl: string
    tags: string[]
    speakers: string[]
  }
  description: string
  summary: string
  takeaways: string[]
  keywords: string[]
  transcript: { speaker?: string; startMs: number; text: string }[]
}

// 解析 frontmatter
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fmMatch) {
    return { frontmatter: {}, body: content }
  }

  const fmContent = fmMatch[1]
  const body = fmMatch[2]
  const frontmatter: Record<string, any> = {}

  // 简单的 YAML 解析
  let currentKey = ''
  let currentArrayValue: string[] = []
  let inArray = false

  fmContent.split('\n').forEach(line => {
    if (line.startsWith('- ') && inArray) {
      currentArrayValue.push(line.slice(2).trim())
    } else if (line.match(/^[a-z_]+:/)) {
      if (inArray && currentKey) {
        frontmatter[currentKey] = currentArrayValue
        currentArrayValue = []
        inArray = false
      }

      const colonIndex = line.indexOf(':')
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()

      if (value === '' || value === '[]') {
        // 可能是数组开始
        inArray = true
        currentKey = key
        if (value === '[]') {
          frontmatter[key] = []
          inArray = false
        }
      } else {
        // 移除引号
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1)
        }
        // 尝试解析数字
        if (/^\d+$/.test(value)) {
          frontmatter[key] = parseInt(value, 10)
        } else if (value === 'null') {
          frontmatter[key] = null
        } else if (value === 'true') {
          frontmatter[key] = true
        } else if (value === 'false') {
          frontmatter[key] = false
        } else {
          frontmatter[key] = value
        }
      }
    }
  })

  if (inArray && currentKey) {
    frontmatter[currentKey] = currentArrayValue
  }

  return { frontmatter, body }
}

// 解析时间戳 "00:05:05" -> 秒数
function parseTimeToSeconds(time: string): number {
  const parts = time.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return 0
}

// 解析 YouTube 时间戳章节
function parseTimestamps(body: string): { time: string; seconds: number; title: string }[] {
  const timestamps: { time: string; seconds: number; title: string }[] = []
  const lines = body.split('\n')

  for (const line of lines) {
    // 匹配格式: "00:00:00 – Title" 或 "00:00:00 - Title"
    const match = line.match(/^(\d{1,2}:\d{2}:\d{2})\s*[–-]\s*(.+)$/)
    if (match) {
      timestamps.push({
        time: match[1],
        seconds: parseTimeToSeconds(match[1]),
        title: match[2].trim()
      })
    }
  }

  return timestamps
}

// 解析 YouTube 字幕
function parseYouTubeTranscript(body: string): { startMs: number; text: string }[] {
  const transcript: { startMs: number; text: string }[] = []

  // 找到 Transcript 部分
  const transcriptMatch = body.match(/## Transcript\n\n([\s\S]*?)(?=\n##|$)/)
  if (!transcriptMatch) return transcript

  const transcriptText = transcriptMatch[1]
  // YouTube 字幕是连续的文本，我们按段落分割并估算时间
  const paragraphs = transcriptText.split('\n\n').filter(p => p.trim())

  paragraphs.forEach((para, index) => {
    transcript.push({
      startMs: index * 30000, // 估算每段30秒
      text: para.replace(/&nbsp;/g, ' ').trim()
    })
  })

  return transcript
}

// 解析播客字幕 - 格式: [Speaker 1] `时间毫秒` 文本
function parsePodcastTranscript(body: string): { speaker?: string; startMs: number; text: string }[] {
  const transcript: { speaker?: string; startMs: number; text: string }[] = []

  // 找到 Transcript 部分
  const transcriptMatch = body.match(/## Transcript\n\n([\s\S]*?)(?=\n##|$)/)
  if (!transcriptMatch) return transcript

  const lines = transcriptMatch[1].split('\n').filter(l => l.trim())

  for (const line of lines) {
    // 匹配格式: [Speaker 1] `9` 文本
    const match = line.match(/^\[([^\]]+)\]\s*`(\d+)`\s*(.+)$/)
    if (match) {
      transcript.push({
        speaker: match[1],
        startMs: parseInt(match[2], 10),
        text: match[3].trim()
      })
    }
  }

  return transcript
}

// 解析播客 Takeaways
function parseTakeaways(body: string): string[] {
  const takeaways: string[] = []

  const match = body.match(/## Takeaways\n\n([\s\S]*?)(?=\n##|$)/)
  if (!match) return takeaways

  const lines = match[1].split('\n')
  for (const line of lines) {
    const itemMatch = line.match(/^\d+\.\s*(.+)$/)
    if (itemMatch) {
      takeaways.push(itemMatch[1].trim())
    }
  }

  return takeaways
}

// 解析 Keywords
function parseKeywords(body: string): string[] {
  const keywords: string[] = []

  const match = body.match(/## Keywords\n\n([\s\S]*?)(?=\n##|$)/)
  if (!match) return keywords

  const lines = match[1].split('\n')
  for (const line of lines) {
    const itemMatch = line.match(/^-\s*(.+)$/)
    if (itemMatch) {
      keywords.push(itemMatch[1].trim())
    }
  }

  return keywords
}

// 解析 Section 内容
function parseSection(body: string, sectionName: string): string {
  const regex = new RegExp(`## ${sectionName}\\n\\n([\\s\\S]*?)(?=\\n##|$)`)
  const match = body.match(regex)
  return match ? match[1].trim() : ''
}

// 解析 YouTube 内容
export function parseYouTubeContent(rawContent: string): YouTubeContent {
  const { frontmatter, body } = parseFrontmatter(rawContent)

  return {
    metadata: {
      videoId: frontmatter.video_id || '',
      title: frontmatter.title || '',
      videoUrl: frontmatter.video_url || '',
      channelName: frontmatter.channel_name || '',
      channelId: frontmatter.channel_id || '',
      uploaderId: frontmatter.uploader_id || '',
      publishedAt: frontmatter.published_at || '',
      durationSeconds: frontmatter.duration_seconds || 0,
      durationHuman: frontmatter.duration_human || '',
      viewCount: frontmatter.view_count || 0,
      likeCount: frontmatter.like_count || 0,
      hasSubtitle: frontmatter.has_subtitle || false,
      language: frontmatter.language || 'en',
      categories: frontmatter.categories
    },
    description: parseSection(body, 'Description'),
    timestamps: parseTimestamps(body),
    transcript: parseYouTubeTranscript(body)
  }
}

// 解析播客内容
export function parsePodcastContent(rawContent: string): PodcastContent {
  const { frontmatter, body } = parseFrontmatter(rawContent)

  return {
    metadata: {
      docId: frontmatter.doc_id || '',
      source: frontmatter.source || '',
      title: frontmatter.title || '',
      podcastTitle: frontmatter.podcast_title || '',
      publishedAt: frontmatter.published_at || '',
      durationSeconds: frontmatter.duration_seconds,
      audioUrl: frontmatter.audio_url || '',
      coverUrl: frontmatter.cover_url || '',
      tags: frontmatter.tags || [],
      speakers: frontmatter.speakers || []
    },
    description: parseSection(body, 'Description'),
    summary: parseSection(body, 'Summary'),
    takeaways: parseTakeaways(body),
    keywords: parseKeywords(body),
    transcript: parsePodcastTranscript(body)
  }
}
