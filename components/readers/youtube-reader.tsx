import { YouTubeReader as MediaYouTubeReader, type YouTubeReaderData } from '@/components/media-reader'
import { parseYouTubeContent } from '@/lib/content-parser'
import type { ContentItem } from '@/lib/mock-data'

interface YouTubeReaderProps {
  content: ContentItem
  markdownContent: string
}

export function YouTubeReader({ content, markdownContent }: YouTubeReaderProps) {
  const parsedContent = parseYouTubeContent(markdownContent)

  const data: YouTubeReaderData = {
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
  }

  return <MediaYouTubeReader data={data} />
}
