import type { ReaderChapter, ReaderMessages, ReaderTranscriptSegment } from './types'

export const defaultReaderMessages: ReaderMessages = {
  chapters: '章节',
  transcript: '转写',
  noChapters: '暂无章节信息',
  noTranscript: '暂无转写内容',
  sourceLink: '原链接',
  audioUnavailable: '音频源不可内嵌播放，请点击原链接收听',
  summarySection: '内容摘要',
  takeawaysSection: '核心要点',
  keywordsSection: '关键词',
  notesSection: '节目笔记',
  descriptionSection: '内容简介',
  detailsSection: '详细信息',
  languageLabel: '语言',
  categoryLabel: '分类',
  durationLabel: '时长',
  viewsLabel: '播放量',
  likesLabel: '点赞数',
}

export function resolveReaderMessages(overrides?: Partial<ReaderMessages>): ReaderMessages {
  return {
    ...defaultReaderMessages,
    ...overrides,
  }
}

export function formatTime(ms: number): string {
  const safeMs = Number.isFinite(ms) ? Math.max(0, ms) : 0
  const totalSeconds = Math.floor(safeMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function findActiveTranscriptIndex(
  currentTimeMs: number,
  transcript: ReaderTranscriptSegment[],
): number {
  return transcript.findIndex((segment, index) => {
    const nextSegment = transcript[index + 1]
    return currentTimeMs >= segment.startMs && (!nextSegment || currentTimeMs < nextSegment.startMs)
  })
}

export function findActiveChapterIndex(
  currentTimeMs: number,
  chapters: ReaderChapter[],
): number {
  const currentSeconds = currentTimeMs / 1000

  return chapters.findIndex((chapter, index) => {
    const nextChapter = chapters[index + 1]
    return currentSeconds >= chapter.seconds && (!nextChapter || currentSeconds < nextChapter.seconds)
  })
}

export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null

  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^?&/#\s]+)/i,
  )

  return match ? match[1] : null
}

export function canRenderAudioSource(url?: string | null): boolean {
  if (!url) return false
  return !/(youtube\.com|youtu\.be)/i.test(url)
}

export function formatCount(value?: number): string {
  return (value ?? 0).toLocaleString()
}
