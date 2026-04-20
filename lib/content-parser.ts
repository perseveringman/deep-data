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
  shownotes: string
  chapters: { time: string; seconds: number; title: string }[]
  shownotesExtra: string
  summary: string
  takeaways: string[]
  keywords: string[]
  transcript: { speaker?: string; startMs: number; text: string }[]
}

function stripArchiveMarkers(text: string): string {
  return text
    .replace(
      /^<!--\s*YOUTUBE_(?:TRANSCRIPT|COMMENTS)_(?:START|END)\s*-->\s*$/gm,
      ''
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
function parseTimestamps(text: string): { time: string; seconds: number; title: string }[] {
  const timestamps: { time: string; seconds: number; title: string }[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const match = line.match(/^(?:[-*•]\s*)?(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:[–—-]\s*|\s+)(.+)$/)
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

// 解析播客 Shownotes 中的章节时间戳（格式: "(MM:SS) Title" 或 "(H:MM:SS) Title"）
function parseShownotesChapters(shownotes: string): {
  chapters: { time: string; seconds: number; title: string }[]
  extra: string
} {
  if (!shownotes) return { chapters: [], extra: '' }

  const chapters: { time: string; seconds: number; title: string }[] = []
  const extraLines: string[] = []
  const lines = shownotes.split('\n')

  for (const line of lines) {
    const match = line.match(/^\(?(\d{1,2}:\d{2}(?::\d{2})?)\)?\s*(?:[–—-]\s*|\s+)(.+)$/)
    if (match) {
      chapters.push({
        time: match[1],
        seconds: parseTimeToSeconds(match[1]),
        title: match[2].trim()
      })
    } else {
      extraLines.push(line)
    }
  }

  return { chapters, extra: extraLines.join('\n').trim() }
}

function parseCueTimeToMs(time: string): number | null {
  const match = time.trim().match(/^(?:(\d+):)?(\d{2}):(\d{2})(?:\.(\d{3}))?$/)
  if (!match) return null

  const [, hours = '0', minutes, seconds, milliseconds = '0'] = match
  return (
    parseInt(hours, 10) * 3_600_000 +
    parseInt(minutes, 10) * 60_000 +
    parseInt(seconds, 10) * 1_000 +
    parseInt(milliseconds, 10)
  )
}

function extractTranscriptSection(body: string): string {
  const transcriptMatch = body.match(
    /## Transcript\n\n([\s\S]*?)(?=\n<!-- YOUTUBE_TRANSCRIPT_END -->|\n##|$)/
  )
  return transcriptMatch ? stripArchiveMarkers(transcriptMatch[1]) : ''
}

// 解析 YouTube 字幕
function parseYouTubeTranscript(body: string): { startMs: number; text: string }[] {
  const transcript: { startMs: number; text: string }[] = []

  const transcriptText = extractTranscriptSection(body)
  if (!transcriptText) return transcript

  const cueBlocks = transcriptText.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean)
  for (const block of cueBlocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
    if (lines.length < 2) continue

    const timingMatch = lines[0].match(/^((?:(?:\d+:)?\d{2}:\d{2}(?:\.\d{3})?))\s+-->\s+((?:(?:\d+:)?\d{2}:\d{2}(?:\.\d{3})?))/)
    if (!timingMatch) continue

    const startMs = parseCueTimeToMs(timingMatch[1])
    if (startMs === null) continue

    const text = lines
      .slice(1)
      .map(line => line.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
      .filter(Boolean)
      .join(' ')

    if (!text) continue

    transcript.push({ startMs, text })
  }

  if (transcript.length > 0) {
    return transcript
  }

  // 兼容旧的纯文本 Transcript，按段落估算时间
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

  const transcriptText = extractTranscriptSection(body)
  if (!transcriptText) return transcript

  const lines = transcriptText.split('\n').filter(l => l.trim())

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
  return match ? stripArchiveMarkers(match[1]) : ''
}

// 解析 YouTube 内容
export function parseYouTubeContent(rawContent: string): YouTubeContent {
  const { frontmatter, body } = parseFrontmatter(rawContent)
  const description = parseSection(body, 'Description')

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
    description,
    timestamps: parseTimestamps(description),
    transcript: parseYouTubeTranscript(body)
  }
}

// 解析播客内容
export function parsePodcastContent(rawContent: string): PodcastContent {
  const { frontmatter, body } = parseFrontmatter(rawContent)
  const shownotes = parseSection(body, 'Shownotes')
  const { chapters, extra: shownotesExtra } = parseShownotesChapters(shownotes)

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
    shownotes,
    chapters,
    shownotesExtra,
    summary: parseSection(body, 'Summary'),
    takeaways: parseTakeaways(body),
    keywords: parseKeywords(body),
    transcript: parsePodcastTranscript(body)
  }
}
