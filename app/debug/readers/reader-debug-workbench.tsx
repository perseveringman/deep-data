'use client'

import { Bot, FileText, FileType2, Headphones, Video } from 'lucide-react'

import { EpubReader, MarkdownReader, PdfReader } from '@/components/document-reader'
import type { TranslationExecutor } from '@/components/reader-platform'
import { PodcastReader } from '@/components/readers/podcast-reader'
import { YouTubeReader } from '@/components/readers/youtube-reader'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ReaderDebugFixture } from '@/lib/reader-debug-fixtures'

const debugTranslationExecutor: TranslationExecutor = async (request) => {
  return {
    provider: request.provider,
    targetLang: request.targetLang,
    segments: request.segments.map((segment) => ({
      id: segment.id,
      translatedText: `[${request.targetLang} · ${request.provider} · ${request.scope}] ${segment.text}`,
    })),
  }
}

const iconMap = {
  youtube: Video,
  podcast: Headphones,
  markdown: FileText,
  pdf: FileType2,
  epub: Bot,
} satisfies Record<ReaderDebugFixture['type'], typeof Video>

function renderFixture(fixture: ReaderDebugFixture) {
  const sharedProps = {
    translationExecutor: debugTranslationExecutor,
    defaultProvider: 'llm' as const,
    defaultTargetLang: 'zh-CN',
  }

  switch (fixture.type) {
    case 'youtube':
      return (
        <YouTubeReader
          content={fixture.content}
          markdownContent={fixture.markdownContent}
          {...sharedProps}
        />
      )
    case 'podcast':
      return (
        <PodcastReader
          content={fixture.content}
          markdownContent={fixture.markdownContent}
          {...sharedProps}
        />
      )
    case 'markdown':
      return (
        <MarkdownReader
          identity={fixture.identity}
          source={{ markdown: fixture.markdownContent }}
          {...sharedProps}
        />
      )
    case 'pdf':
      return <PdfReader identity={fixture.identity} source={fixture.source} {...sharedProps} />
    case 'epub':
      return <EpubReader identity={fixture.identity} source={fixture.source} {...sharedProps} />
  }
}

export function ReaderDebugWorkbench({
  fixtures,
}: {
  fixtures: ReaderDebugFixture[]
}) {
  return (
    <Tabs defaultValue={fixtures[0]?.id} className="gap-4">
      <TabsList className="h-auto w-full flex-wrap justify-start">
        {fixtures.map((fixture) => {
          const Icon = iconMap[fixture.type]
          return (
            <TabsTrigger key={fixture.id} value={fixture.id} className="min-w-32">
              <Icon className="h-4 w-4" />
              {fixture.label}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {fixtures.map((fixture) => (
        <TabsContent key={fixture.id} value={fixture.id} className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{fixture.label}</h2>
                  <Badge variant="secondary">{fixture.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fixture: <code>{fixture.description}</code>
                </p>
              </div>

              <div className="max-w-md rounded border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                该调试台注入了本地 fixture 和一个 debug translation executor，方便直接验证五类 reader 的渲染、选区、高亮和上下文面板。
              </div>
            </div>
          </div>

          {renderFixture(fixture)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
