import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getContentById, type ContentItem } from '@/lib/mock-data'
import { YouTubeReader } from '@/components/readers/youtube-reader'
import { PodcastReader } from '@/components/readers/podcast-reader'
import { SidebarTrigger } from '@/components/ui/sidebar'
import fs from 'fs'
import path from 'path'

const API_BASE = process.env.PODADMIN_API_URL || 'http://localhost:8000'
const API_KEY = process.env.PODADMIN_API_KEY || ''

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

async function fetchFromPodAdmin(id: string): Promise<{ content: ContentItem; markdown: string } | null> {
  try {
    // Fetch document metadata
    const docRes = await fetch(`${API_BASE}/api/v1/documents/${id}?include=body`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 60 },
    })
    if (!docRes.ok) return null
    const doc = await docRes.json()

    const content: ContentItem = {
      id: String(doc.id),
      type: doc.source_type === 'youtube' ? 'youtube' : 'podcast',
      title: doc.title || '(无标题)',
      channelId: doc.source || doc.source_type,
      channelName: doc.podcast_title || doc.source || doc.source_type,
      publishedAt: doc.published_at ? doc.published_at.slice(0, 10) : '',
      duration: formatDuration(doc.duration_seconds),
      durationSeconds: doc.duration_seconds || 0,
      coverUrl: doc.cover_url || undefined,
      audioUrl: doc.audio_url || undefined,
      tags: doc.tags || [],
      summary: doc.summary_excerpt || '',
      hasTranscript: doc.has_transcript,
      contentFile: '',
    }

    // Use inline body if available; otherwise fetch raw
    let markdown = doc.body || ''
    if (!markdown) {
      try {
        const rawRes = await fetch(`${API_BASE}/api/v1/documents/${id}/raw`, {
          headers: { 'X-API-Key': API_KEY },
          next: { revalidate: 60 },
        })
        if (rawRes.ok) markdown = await rawRes.text()
      } catch { /* ignore */ }
    }

    return { content, markdown }
  } catch {
    return null
  }
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Try podadmin API first
  const remote = await fetchFromPodAdmin(id)

  let content: ContentItem | null = null
  let markdownContent = ''

  if (remote) {
    content = remote.content
    markdownContent = remote.markdown || '内容加载中…'
  } else {
    // Fall back to local mock data
    content = getContentById(id)
    if (content) {
      try {
        const filePath = path.join(process.cwd(), 'content', content.contentFile.replace('/content/', ''))
        markdownContent = fs.readFileSync(filePath, 'utf-8')
      } catch {
        markdownContent = '内容加载失败'
      }
    }
  }

  if (!content) {
    notFound()
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-10 items-center gap-3 border-b border-border bg-background px-4">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <Link
          href="/contents"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          返回内容库
        </Link>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground">
          {content.type === 'youtube' ? 'YouTube' : '播客'}
        </span>
      </header>

      {/* 内容区域 */}
      <div className="px-4 py-3">
        {content.type === 'youtube' ? (
          <YouTubeReader
            content={content}
            markdownContent={markdownContent}
          />
        ) : (
          <PodcastReader
            content={content}
            markdownContent={markdownContent}
          />
        )}
      </div>
    </>
  )
}
