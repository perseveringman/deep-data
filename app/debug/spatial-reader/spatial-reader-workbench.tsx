'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Bot, FileText, FileType2, Headphones, Twitter, Video, type LucideIcon } from 'lucide-react'

import { MarkdownReader } from '@/components/document-reader/markdown/markdown-reader'
import type { ReaderDocumentIdentity, TranslationExecutor } from '@/components/reader-platform'
import { PodcastReader } from '@/components/readers/podcast-reader'
import { YouTubeReader } from '@/components/readers/youtube-reader'
import {
  SpatialReaderFrame,
  type SpatialReaderFixtureOption,
  type SpatialReaderWindowState,
  type ThoughtNode,
} from '@/components/spatial-reader'
import { XPostReader } from '@/components/x-reader/x-post-reader'
import { sourceLabels } from '@/components/x-reader/x-reader-card'
import type { ReaderDebugFixture } from '@/lib/reader-debug-fixtures'
import type { XFeedItem } from '@/lib/types'

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
  x: Twitter,
} satisfies Record<SpatialWorkbenchFixture['type'], LucideIcon>

interface XReaderFixture {
  id: 'x'
  type: 'x'
  label: string
  description: string
  identity: ReaderDocumentIdentity
  items: XFeedItem[]
}

type SpatialWorkbenchFixture = ReaderDebugFixture | XReaderFixture

const X_READER_WINDOW_SIZE = { width: 620, height: 420 }
const X_READER_WINDOW_GAP_X = 80
const X_READER_WINDOW_GAP_Y = 64
const X_READER_WINDOW_START = { x: 34, y: 88 }

function getXReaderWindowId(item: XFeedItem) {
  return `x-post-${item.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function seededOffset(seed: string, range: number) {
  return (hashString(seed) % (range * 2 + 1)) - range
}

function createXReaderWindows(items: XFeedItem[]): SpatialReaderWindowState[] {
  const columns = Math.max(2, Math.ceil(Math.sqrt(Math.max(1, items.length))))

  return items.map((item, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)

    return {
      id: getXReaderWindowId(item),
      title: item.authorName || `@${item.authorHandle}`,
      subtitle: `${sourceLabels[item.sourceKind]} · @${item.authorHandle}`,
      metadata: { xFeedItemId: item.id },
      position: {
        x: Math.max(
          16,
          X_READER_WINDOW_START.x +
            column * (X_READER_WINDOW_SIZE.width + X_READER_WINDOW_GAP_X) +
            seededOffset(`${item.id}:x`, 62),
        ),
        y: Math.max(
          72,
          X_READER_WINDOW_START.y +
            row * (X_READER_WINDOW_SIZE.height + X_READER_WINDOW_GAP_Y) +
            seededOffset(`${item.id}:y`, 54),
        ),
      },
      size: X_READER_WINDOW_SIZE,
      status: 'open',
      isMaximized: false,
      zIndex: 120 + index,
    }
  })
}

function getFixtureIdentity(fixture: SpatialWorkbenchFixture): ReaderDocumentIdentity {
  switch (fixture.type) {
    case 'markdown':
    case 'pdf':
    case 'epub':
    case 'x':
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

const debugThoughtSeeds = [
  {
    id: 'e2e-related-library',
    actionId: 'related',
    label: '关联',
    color: 'pink',
    sourceText: 'library family alongside',
    contentMarkdown:
      '## 关联\n\n> library family alongside\n\n调试种子节点：用于验证高亮离开 reader 可视区后，关联窗口会一起隐藏。\n\n这个父窗口故意放入更多内容，模拟真实解释/关联结果里继续划线的场景。滚动父窗口时，上方的嵌套高亮会离开小窗可视区，对应子窗口和曲线都应该同步隐藏。\n\n继续补充一段调试文本：空间画布、窗口定位、连线层级和高亮可见性需要使用同一套坐标策略，否则嵌套窗口会出现错位、遮挡或错误连接。\n\n末尾文本用于制造滚动空间，验证当前策略在默认应用尺寸下仍然稳定。',
    position: { x: 580, y: 210 },
    zIndex: 230,
  },
  {
    id: 'e2e-related-universal',
    actionId: 'related',
    label: '关联',
    color: 'pink',
    sourceText: 'one low-level universal rendering abstraction',
    contentMarkdown:
      '## 关联\n\n> one low-level universal rendering abstraction\n\n调试种子节点：用于验证连线锚点贴合实际高亮。',
    position: { x: 700, y: 330 },
    zIndex: 231,
  },
  {
    id: 'e2e-translate-shell',
    actionId: 'translate',
    label: '翻译',
    color: 'blue',
    sourceText: 'document-reader shell',
    contentMarkdown:
      '## 翻译\n\n> document-reader shell\n\n调试种子节点：用于验证不同动作窗口和高亮共用同一套可见性判断。',
    position: { x: 560, y: 450 },
    zIndex: 232,
  },
  {
    id: 'e2e-nested-related-visible',
    actionId: 'explain',
    label: '解释',
    color: 'purple',
    sourceText: '高亮离开 reader 可视区',
    sourceNodeId: 'e2e-related-library',
    contentMarkdown:
      '## 解释\n\n> 高亮离开 reader 可视区\n\n嵌套调试种子：用于验证小窗内容再次划线后，子窗口连接到父小窗里的高亮，并且父小窗滚动后会同步隐藏。',
    position: { x: 580, y: 500 },
    zIndex: 233,
  },
] satisfies Array<{
  id: string
  actionId: string
  label: string
  color: 'blue' | 'pink' | 'purple'
  sourceText: string
  sourceNodeId?: string
  contentMarkdown: string
  position: { x: number; y: number }
  zIndex: number
}>

function createDebugThoughtNodes(identity: ReaderDocumentIdentity): ThoughtNode[] | undefined {
  if (identity.readerType !== 'markdown') return undefined

  const timestamp = '2026-05-19T00:00:00.000Z'

  return debugThoughtSeeds.map((seed) => ({
    id: seed.id,
    kind: 'ai-result' as const,
    documentId: identity.documentId,
    readerType: identity.readerType,
    sourceRange: {
      start: { kind: 'anchor' as const, anchor: 'executive-recommendation' },
      quote: { exact: seed.sourceText },
    },
    sourceText: seed.sourceText,
    sourceNodeId: seed.sourceNodeId,
    sourceReaderWindowId: 'reader-main',
    action: {
      id: seed.actionId,
      label: seed.label,
      color: seed.color,
    },
    contentMarkdown: seed.contentMarkdown,
    status: 'done' as const,
    view: {
      mode: 'window' as const,
      position: seed.position,
      size: { width: 360, height: 260 },
      status: 'open' as const,
      zIndex: seed.zIndex,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
}

function renderFixtureContent(fixture: SpatialWorkbenchFixture, runtimeProps: any) {
  const sharedProps = {
    translationExecutor: spatialTranslationExecutor,
    defaultProvider: 'llm' as const,
    defaultTargetLang: 'zh-CN',
  }
  const props = { ...sharedProps, ...runtimeProps }

  switch (fixture.type) {
    case 'youtube':
      return (
        <YouTubeReader
          content={fixture.content}
          markdownContent={fixture.markdownContent}
          {...props}
        />
      )
    case 'podcast':
      return (
        <PodcastReader
          content={fixture.content}
          markdownContent={fixture.markdownContent}
          {...props}
        />
      )
    case 'markdown':
      return (
        <MarkdownReader
          identity={fixture.identity}
          source={{ markdown: fixture.markdownContent }}
          {...props}
        />
      )
    case 'pdf':
      return <PdfReader identity={fixture.identity} source={fixture.source} {...props} />
    case 'epub':
      return <EpubReader identity={fixture.identity} source={fixture.source} {...props} />
    case 'x':
      return null
  }
}

export function SpatialReaderWorkbench({
  fixtures,
  xFeedItems,
  initialFixtureId,
  e2e = false,
}: {
  fixtures: ReaderDebugFixture[]
  xFeedItems?: XFeedItem[]
  initialFixtureId?: string
  e2e?: boolean
}) {
  const allFixtures = useMemo<SpatialWorkbenchFixture[]>(() => {
    const xFixture: XReaderFixture = {
      id: 'x',
      type: 'x',
      label: 'X 阅读器',
      description: `/Users/ryanbzhou/myvault2/feeds · ${xFeedItems?.length ?? 0} items`,
      identity: {
        readerType: 'x',
        documentId: 'local-x-feed',
        title: 'X 阅读器',
        sourceUrl: '/Users/ryanbzhou/myvault2/feeds',
        language: 'mixed',
      },
      items: xFeedItems ?? [],
    }

    return [xFixture, ...fixtures]
  }, [fixtures, xFeedItems])

  const defaultFixtureId = e2e
    ? fixtures.find((fixture) => fixture.type === 'markdown')?.id ?? allFixtures[0]?.id
    : allFixtures.some((fixture) => fixture.id === initialFixtureId)
      ? initialFixtureId
      : allFixtures[0]?.id

  const [selectedFixtureId, setSelectedFixtureId] = useState<string | undefined>(defaultFixtureId)

  const selectedFixture = useMemo(
    () => allFixtures.find((fixture) => fixture.id === selectedFixtureId) ?? allFixtures[0],
    [allFixtures, selectedFixtureId],
  )
  const xReaderWindows = useMemo(
    () => (selectedFixture?.type === 'x' ? createXReaderWindows(selectedFixture.items) : undefined),
    [selectedFixture],
  )
  const xItemById = useMemo(() => {
    if (selectedFixture?.type !== 'x') return new Map<string, XFeedItem>()
    return new Map(selectedFixture.items.map((item) => [item.id, item]))
  }, [selectedFixture])

  const fixtureOptions = useMemo<SpatialReaderFixtureOption[]>(
    () =>
      allFixtures.map((fixture) => {
        const Icon = iconMap[fixture.type]
        return {
          id: fixture.id,
          label: fixture.label,
          description: fixture.description,
          type: fixture.type,
          icon: <Icon className="h-4 w-4" />,
        }
      }),
    [allFixtures],
  )

  if (!selectedFixture) return null

  const identity = getFixtureIdentity(selectedFixture)
  const initialNodes = e2e ? createDebugThoughtNodes(identity) : undefined

  if (selectedFixture.type === 'x') {
    return (
      <SpatialReaderFrame
        key={selectedFixture.id}
        identity={identity}
        initialNodes={initialNodes}
        initialReaderWindows={xReaderWindows}
        fixtureOptions={fixtureOptions}
        activeFixtureId={selectedFixture.id}
        onSelectFixture={setSelectedFixtureId}
      >
        {(spatialRuntimeProps, readerWindow) => {
          const feedItemId =
            typeof readerWindow.metadata?.xFeedItemId === 'string'
              ? readerWindow.metadata.xFeedItemId
              : undefined
          const item = feedItemId ? xItemById.get(feedItemId) : undefined

          return item ? (
            <XPostReader
              identity={selectedFixture.identity}
              item={item}
              {...spatialRuntimeProps}
            />
          ) : null
        }}
      </SpatialReaderFrame>
    )
  }

  return (
    <SpatialReaderFrame
      key={selectedFixture.id}
      identity={identity}
      initialNodes={initialNodes}
      fixtureOptions={fixtureOptions}
      activeFixtureId={selectedFixture.id}
      onSelectFixture={setSelectedFixtureId}
    >
      {(spatialRuntimeProps) => renderFixtureContent(selectedFixture, spatialRuntimeProps)}
    </SpatialReaderFrame>
  )
}
