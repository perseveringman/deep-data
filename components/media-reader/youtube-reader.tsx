'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar, Clock, ExternalLink, Eye, ThumbsUp } from 'lucide-react'

import {
  defaultReaderCapabilities,
  defaultReaderPreferences,
  getScopedSelection,
  type ReaderSelection,
  ReaderWorkspacePanel,
  renderReaderQuoteHighlights,
  resolveReaderPreferences,
  useReaderRuntime,
} from '@/components/reader-platform'
import {
  findActiveChapterIndex,
  findActiveTranscriptIndex,
  formatCount,
  formatTime,
  getYouTubeVideoId,
  resolveReaderMessages,
} from './helpers'
import { SharedReader } from './shared-reader'
import type { ReaderSidebarSection, YouTubeReaderProps } from './types'

let youtubeApiPromise: Promise<typeof window.YT> | null = null

function loadYouTubeIframeApi(): Promise<typeof window.YT> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
      const previousReady = window.onYouTubeIframeAPIReady

      window.onYouTubeIframeAPIReady = () => {
        previousReady?.()
        resolve(window.YT)
      }

      if (existingScript) {
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => reject(new Error('Failed to load YouTube iframe API'))
      document.head.appendChild(script)
    })
  }

  return youtubeApiPromise
}

export function YouTubeReader({
  identity,
  data,
  className,
  contentHeightClassName,
  sidebarStickyTopClassName,
  dateLocale = zhCN,
  dateFormat = 'yyyy/M/d',
  messages,
  onProgressChange,
  onSessionSnapshotChange,
  translationExecutor,
  defaultProvider,
  defaultTargetLang,
  translationDisplayMode,
  initialAnnotations,
  onAnnotationChange,
  onAnalysisContextChange,
}: YouTubeReaderProps) {
  const mergedMessages = useMemo(() => resolveReaderMessages(messages), [messages])
  const playerRef = useRef<YT.Player | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const playerId = useId().replace(/:/g, '')

  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [selection, setSelection] = useState<ReaderSelection | null>(null)

  const videoId = data.videoId || getYouTubeVideoId(data.videoUrl)
  const transcript = data.transcript ?? []
  const chapters = data.chapters ?? []
  const activeTranscriptIndex = useMemo(
    () => findActiveTranscriptIndex(currentTime, transcript),
    [currentTime, transcript],
  )
  const activeChapterIndex = useMemo(
    () => findActiveChapterIndex(currentTime, chapters),
    [chapters, currentTime],
  )

  useEffect(() => {
    if (!videoId) return

    let intervalId: number | null = null
    let cancelled = false

    void loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || playerRef.current) return

        playerRef.current = new YT.Player(playerId, {
          videoId,
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onStateChange: (event: YT.OnStateChangeEvent) => {
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
            },
          },
        })

        intervalId = window.setInterval(() => {
          const player = playerRef.current
          if (!player || typeof player.getCurrentTime !== 'function') return
          setCurrentTime(player.getCurrentTime() * 1000)
        }, 500)
      })
      .catch(() => {
        setLoadError(true)
      })

    return () => {
      cancelled = true
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
      playerRef.current?.destroy()
      playerRef.current = null
      setIsPlaying(false)
    }
  }, [playerId, videoId])

  const sidebarSections = useMemo<ReaderSidebarSection[]>(() => {
    const sections: ReaderSidebarSection[] = []

    if (data.summary) {
      sections.push({
        id: 'summary',
        type: 'text',
        title: mergedMessages.summarySection,
        icon: 'summary',
        tone: 'primary',
        content: data.summary,
      })
    }

    if (data.description) {
      sections.push({
        id: 'description',
        type: 'text',
        title: mergedMessages.descriptionSection,
        icon: 'description',
        tone: 'primary',
        content: data.description,
        multiline: true,
      })
    }

    const detailItems = [
      data.language ? { label: mergedMessages.languageLabel, value: data.language.toUpperCase() } : null,
      data.categories ? { label: mergedMessages.categoryLabel, value: data.categories } : null,
      data.durationText ? { label: mergedMessages.durationLabel, value: data.durationText } : null,
      data.viewCount !== undefined ? { label: mergedMessages.viewsLabel, value: formatCount(data.viewCount) } : null,
      data.likeCount !== undefined ? { label: mergedMessages.likesLabel, value: formatCount(data.likeCount) } : null,
    ].filter((item): item is { label: string; value: string } => item !== null)

    if (detailItems.length > 0) {
      sections.push({
        id: 'details',
        type: 'facts',
        title: mergedMessages.detailsSection,
        icon: 'details',
        tone: 'primary',
        items: detailItems,
      })
    }

    return sections
  }, [data.categories, data.description, data.durationText, data.language, data.likeCount, data.summary, data.viewCount, mergedMessages])
  const activeTranscript = activeTranscriptIndex >= 0 ? transcript[activeTranscriptIndex] : null
  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : null
  const activeUnit = useMemo(
    () =>
      activeTranscript
        ? {
            id: activeTranscript.id ?? `segment-${activeTranscript.startMs}`,
            title: formatTime(activeTranscript.startMs),
            text: activeTranscript.text,
            locator: { kind: 'time' as const, timeMs: activeTranscript.startMs },
          }
        : activeChapter
          ? {
              id: activeChapter.id ?? `chapter-${activeChapter.seconds}`,
              title: activeChapter.title,
              text: activeChapter.title,
              locator: { kind: 'time' as const, timeMs: activeChapter.seconds * 1000 },
            }
          : null,
    [activeChapter, activeTranscript],
  )
  const visibleContent = useMemo(() => {
    if (transcript.length > 0 && activeTranscriptIndex >= 0) {
      return transcript
        .slice(Math.max(0, activeTranscriptIndex - 2), activeTranscriptIndex + 3)
        .map((segment) => ({
          id: segment.id ?? `segment-${segment.startMs}`,
          text: segment.text,
          locator: { kind: 'time' as const, timeMs: segment.startMs },
        }))
    }

    return sidebarSections
      .flatMap((section) => {
        if (section.type === 'text') {
          return [{ id: section.id, text: section.content, locator: { kind: 'time' as const, timeMs: currentTime } }]
        }
        if (section.type === 'list') {
          return section.items.map((item, index) => ({
            id: `${section.id}-${index}`,
            text: item,
            locator: { kind: 'time' as const, timeMs: currentTime },
          }))
        }
        return section.items.map((item, index) => ({
          id: `${section.id}-${index}`,
          text: `${item.label}: ${item.value}`,
          locator: { kind: 'time' as const, timeMs: currentTime },
        }))
      })
      .slice(0, 5)
  }, [activeTranscriptIndex, currentTime, sidebarSections, transcript])
  const capabilities = useMemo(
    () => ({
      ...defaultReaderCapabilities,
      textSelection: true,
      translation: true,
      annotations: true,
      aiContext: true,
      toc: chapters.length > 0,
      search: false,
      continuousScroll: true,
      jumpToLocator: true,
      extractVisibleText: true,
    }),
    [chapters.length],
  )
  const resolvedPreferences = useMemo(
    () => resolveReaderPreferences({ systemDefaults: defaultReaderPreferences }),
    [],
  )
  const runtime = useReaderRuntime({
    document: identity,
    capabilities,
    preferences: resolvedPreferences,
    activeUnit,
    visibleContent,
    translationExecutor,
    defaultProvider,
    defaultTargetLang,
    translationDisplayMode,
    initialAnnotations,
    onAnnotationChange,
    onAnalysisContextChange,
  })

  const seekTo = (timeMs: number) => {
    const player = playerRef.current
    if (!player || typeof player.seekTo !== 'function') return

    player.seekTo(timeMs / 1000, true)
    setCurrentTime(timeMs)
  }

  useEffect(() => {
    const handleSelection = () => {
      setSelection(
        getScopedSelection({
          root: rootRef.current,
          buildRange: (text) => ({
            start:
              activeUnit?.locator ?? {
                kind: 'time',
                timeMs: currentTime,
              },
            quote: { exact: text },
          }),
        }),
      )
    }

    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [activeUnit, currentTime])

  useEffect(() => {
    const snapshot = {
      document: identity,
      location: activeUnit?.locator ?? { kind: 'time' as const, timeMs: currentTime },
      progress: data.durationMs && data.durationMs > 0 ? currentTime / data.durationMs : undefined,
      selection: selection ?? undefined,
      visibleContent,
      annotationsCount: runtime.annotations.length,
    }

    onProgressChange?.({
      documentId: identity.documentId,
      locator: snapshot.location,
      progress: snapshot.progress,
      lastReadAt: new Date().toISOString(),
    })
    onSessionSnapshotChange?.(snapshot)
    runtime.updateSessionSnapshot(snapshot)
  }, [
    currentTime,
    data.durationMs,
    identity,
    onProgressChange,
    onSessionSnapshotChange,
    runtime.annotations.length,
    runtime.updateSessionSnapshot,
    selection,
    activeUnit,
    visibleContent,
  ])

  useEffect(() => {
    renderReaderQuoteHighlights(rootRef.current, runtime.annotations)
  }, [currentTime, runtime.annotations, sidebarSections, transcript])

  const hero = (
    <>
      <div className="aspect-video w-full overflow-hidden rounded bg-black">
        {videoId && !loadError ? (
          <div id={playerId} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white">
            视频加载失败
          </div>
        )}
      </div>

      <div className="space-y-1 border-b border-border pb-2">
        <h1 className="font-serif text-sm font-bold leading-tight">{data.title}</h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {data.channelName ? <span className="font-medium text-foreground">{data.channelName}</span> : null}

          {data.publishedAt ? (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {format(new Date(data.publishedAt), dateFormat, { locale: dateLocale })}
            </span>
          ) : null}

          {data.viewCount !== undefined ? (
            <span className="flex items-center gap-0.5">
              <Eye className="h-2.5 w-2.5" />
              {formatCount(data.viewCount)}
            </span>
          ) : null}

          {data.likeCount !== undefined ? (
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="h-2.5 w-2.5" />
              {formatCount(data.likeCount)}
            </span>
          ) : null}

          {data.durationText ? (
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {data.durationText}
            </span>
          ) : null}

          {data.videoUrl ? (
            <a
              href={data.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-primary hover:underline"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              YouTube
            </a>
          ) : null}
        </div>

        {(data.categories || (data.tags && data.tags.length > 0)) ? (
          <div className="flex flex-wrap gap-1">
            {data.categories ? (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                {data.categories}
              </span>
            ) : null}

            {(data.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )

  return (
    <SharedReader
      rootRef={rootRef}
      hero={hero}
      chapters={chapters}
      transcript={transcript}
      sidebarSections={sidebarSections}
      currentTime={currentTime}
      isPlaying={isPlaying}
      onSeek={seekTo}
      messages={mergedMessages}
      className={className}
      contentHeightClassName={contentHeightClassName}
      sidebarStickyTopClassName={sidebarStickyTopClassName}
      sidebarExtra={
        <ReaderWorkspacePanel
          capabilities={capabilities}
          selection={selection}
          activeUnit={activeUnit}
          annotations={runtime.annotations}
          activeAnnotationId={runtime.activeAnnotationId}
          provider={runtime.translation.provider}
          targetLang={runtime.translation.targetLang}
          canTranslate={runtime.translation.canTranslate}
          isTranslating={runtime.translation.isTranslating}
          translationResponse={runtime.translation.lastResponse}
          translationError={runtime.translation.error}
          analysisContext={runtime.analysisContext}
          onProviderChange={runtime.translation.setProvider}
          onTargetLangChange={runtime.translation.setTargetLang}
          onTranslate={(scope) => {
            void runtime.translation.requestTranslation(scope)
          }}
          onCreateAnnotation={(color) => {
            try {
              runtime.createAnnotationFromSelection(color)
            } catch {
              // no-op: button is only shown when selection exists
            }
          }}
          onSelectAnnotation={(annotation) => {
            runtime.selectAnnotation(annotation.id)
            if (annotation.range.start.kind === 'time') {
              seekTo(annotation.range.start.timeMs)
            }
          }}
          onUpdateAnnotationBody={runtime.updateAnnotationBody}
          onDeleteAnnotation={runtime.deleteAnnotation}
        />
      }
    />
  )
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, number>
          events?: {
            onStateChange?: (event: YT.OnStateChangeEvent) => void
          }
        }
      ) => YT.Player
      PlayerState: {
        PLAYING: number
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }

  namespace YT {
    interface Player {
      destroy(): void
      getCurrentTime(): number
      seekTo(seconds: number, allowSeekAhead: boolean): void
    }

    interface OnStateChangeEvent {
      data: number
    }
  }
}
