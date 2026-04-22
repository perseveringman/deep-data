import { PodcastReader as MediaPodcastReader, type PodcastReaderData } from '@/components/media-reader'
import { parsePodcastContent } from '@/lib/content-parser'
import type { ContentItem } from '@/lib/mock-data'

interface PodcastReaderProps {
  content: ContentItem
  markdownContent: string
}

export function PodcastReader({ content, markdownContent }: PodcastReaderProps) {
  const parsedContent = parsePodcastContent(markdownContent)

  const data: PodcastReaderData = {
    title: parsedContent.metadata.title || content.title,
    podcastTitle: parsedContent.metadata.podcastTitle || content.channelName,
    publishedAt: parsedContent.metadata.publishedAt || content.publishedAt,
    durationText: content.duration,
    durationMs: content.durationSeconds * 1000,
    audioUrl: parsedContent.metadata.audioUrl || content.audioUrl,
    coverUrl: parsedContent.metadata.coverUrl || content.coverUrl,
    externalUrl: parsedContent.metadata.audioUrl || content.audioUrl,
    tags: parsedContent.metadata.tags.length > 0 ? parsedContent.metadata.tags : content.tags,
    summary: parsedContent.summary || content.summary,
    description: parsedContent.description,
    notes: parsedContent.shownotesExtra,
    takeaways: parsedContent.takeaways,
    keywords: parsedContent.keywords,
    chapters: parsedContent.chapters,
    transcript: parsedContent.transcript,
  }

  return <MediaPodcastReader data={data} />
}
