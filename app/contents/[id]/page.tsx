import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getContentById, type ContentItem } from '@/lib/mock-data'
import { YouTubeReader } from '@/components/readers/youtube-reader'
import { PodcastReader } from '@/components/readers/podcast-reader'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { docToContentItem, getDocument, getDocumentRaw } from '@/lib/api'
import fs from 'fs'
import path from 'path'

async function fetchFromPodAdmin(id: string): Promise<{ content: ContentItem; markdown: string } | null> {
  try {
    const doc = await getDocument(id, true)
    const content = docToContentItem(doc)

    // Use inline body if available; otherwise fetch raw
    let markdown = doc.body || ''
    if (!markdown) {
      try {
        markdown = await getDocumentRaw(id)
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
