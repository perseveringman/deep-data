'use client'

import dynamic from 'next/dynamic'
import { Bot, FileText, FileType2, Headphones, Video } from 'lucide-react'

import { MarkdownReader } from '@/components/document-reader/markdown/markdown-reader'
import type { ReaderDocumentIdentity, TranslationExecutor } from '@/components/reader-platform'
import { PodcastReader } from '@/components/readers/podcast-reader'
import { YouTubeReader } from '@/components/readers/youtube-reader'
import { SpatialReaderFrame } from '@/components/spatial-reader'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ReaderDebugFixture } from '@/lib/reader-debug-fixtures'

const PdfReader = dynamic(
  () => import('@/components/document-reader/pdf/pdf-reader').then((module) => module.PdfReader),
  {
    ssr: false,
  },
)

const EpubReader = dynamic(
  () => import('@/components/document-reader/epub/epub-reader').then((module) => module.EpubReader),
  {
    ssr: false,
  },
)

const spatialTranslationExecutor: TranslationExecutor = async (request) => ({
  provider: request.provider,
  targetLang: request.targetLang,
  segments: request.segments.map((segment) => ({
    id: segment.id,
    translatedText: `[${request.targetLang} · ${request.provider} · ${request.scope}] ${segment.text}`,
  })),
})

const iconMap = {
  youtube: Video,
  podcast: Headphones,
  markdown: FileText,
  pdf: FileType2,
  epub: Bot,
} satisfies Record<ReaderDebugFixture['type'], typeof Video>

function getFixtureIdentity(fixture: ReaderDebugFixture): ReaderDocumentIdentity {
  switch (fixture.type) {
    case 'markdown':
    case 'pdf':
    case 'epub':
      return fixture.identity
    case 'podcast':
      return {
        readerType: 'podcast',
        documentId: fixture.content.id,
        sourceUrl: fixture.content.audioUrl,
        title: fixture.content.title,
      }
    case 'youtube':
      return {
        readerType: 'youtube',
        documentId: fixture.content.id,
        sourceUrl: fixture.content.videoUrl,
        title: fixture.content.title,
      }
  }
}

function renderFixture(fixture: ReaderDebugFixture) {
  const sharedProps = {
    translationExecutor: spatialTranslationExecutor,
    defaultProvider: 'llm' as const,
    defaultTargetLang: 'zh-CN',
  }
  const identity = getFixtureIdentity(fixture)

  return (
    <SpatialReaderFrame identity={identity}>
      {(spatialRuntimeProps) => {
        const runtimeProps = {
          ...sharedProps,
          ...spatialRuntimeProps,
        }

        switch (fixture.type) {
          case 'youtube':
            return (
              <YouTubeReader
                content={fixture.content}
                markdownContent={fixture.markdownContent}
                {...runtimeProps}
              />
            )
          case 'podcast':
            return (
              <PodcastReader
                content={fixture.content}
                markdownContent={fixture.markdownContent}
                {...runtimeProps}
              />
            )
          case 'markdown':
            return (
              <MarkdownReader
                identity={fixture.identity}
                source={{ markdown: fixture.markdownContent }}
                {...runtimeProps}
              />
            )
          case 'pdf':
            return <PdfReader identity={fixture.identity} source={fixture.source} {...runtimeProps} />
          case 'epub':
            return <EpubReader identity={fixture.identity} source={fixture.source} {...runtimeProps} />
        }
      }}
    </SpatialReaderFrame>
  )
}

export function SpatialReaderWorkbench({
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
                  <Badge variant="outline">SpatialFrame</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fixture: <code>{fixture.description}</code>
                </p>
              </div>

              <div className="max-w-md rounded border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                选区仍由原五合一 reader 捕获；SpatialFrame 通过统一的
                AnalysisContext 与 Annotation bridge 注入 ThoughtGraph、浮窗画布和持久化。
              </div>
            </div>
          </div>

          {renderFixture(fixture)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
