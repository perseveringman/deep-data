'use client'

import { useMemo } from 'react'

import { YouTubeReader as MediaYouTubeReader, type YouTubeReaderData } from '@/components/media-reader'
import type { ReaderRuntimeProps } from '@/components/reader-platform'
import { parseYouTubeContent } from '@/lib/content-parser'
import type { ContentItem } from '@/lib/types'

interface YouTubeReaderProps extends ReaderRuntimeProps {
  content: ContentItem
  markdownContent: string
}

export function YouTubeReader({ content, markdownContent, ...runtimeProps }: YouTubeReaderProps) {
  const parsedContent = useMemo(() => parseYouTubeContent(markdownContent), [markdownContent])

  const data = useMemo<YouTubeReaderData>(
    () => ({
      title: parsedContent.metadata.title || content.title,
      channelName: parsedContent.metadata.channelName || content.channelName,
      publishedAt: parsedContent.metadata.publishedAt || content.publishedAt,
      durationText: parsedContent.metadata.durationHuman || content.duration,
      durationMs: (parsedContent.metadata.durationSeconds || content.durationSeconds) * 1000,
      videoUrl: parsedContent.metadata.videoUrl || content.videoUrl,
      videoId: parsedContent.metadata.videoId,
      categories: parsedContent.metadata.categories,
      language: parsedContent.metadata.language,
      viewCount: parsedContent.metadata.viewCount || content.viewCount,
      likeCount: parsedContent.metadata.likeCount || content.likeCount,
      tags: content.tags,
      summary: content.summary,
      description: parsedContent.description,
      chapters: parsedContent.timestamps,
      transcript: parsedContent.transcript,
    }),
    [
      content.channelName,
      content.duration,
      content.durationSeconds,
      content.likeCount,
      content.summary,
      content.publishedAt,
      content.tags,
      content.title,
      content.videoUrl,
      content.viewCount,
      parsedContent,
    ],
  )

  const identity = useMemo(
    () => ({
      readerType: 'youtube' as const,
      documentId: content.id,
      sourceUrl: content.videoUrl,
      title: data.title,
      language: data.language || content.language,
    }),
    [content.id, content.videoUrl, content.language, data.title, data.language],
  )

  return (
    <MediaYouTubeReader
      identity={identity}
      data={data}
      {...runtimeProps}
    />
  )
}
