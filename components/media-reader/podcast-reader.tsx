'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  defaultReaderCapabilities,
  defaultReaderPreferences,
  getScopedSelection,
  ReaderSelectionOverlayHost,
  ReaderSelection,
  ReaderWorkspacePanel,
  renderReaderQuoteHighlights,
  resolveReaderPreferences,
  useReaderRuntime,
} from '@/components/reader-platform'
import {
  Calendar,
  Clock,
  ExternalLink,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'

import { Slider } from '../ui/slider'
import {
  canRenderAudioSource,
  findActiveChapterIndex,
  findActiveTranscriptIndex,
  formatTime,
  resolveReaderMessages,
} from './helpers'
import { SharedReader } from './shared-reader'
import type { PodcastReaderProps, ReaderSidebarSection } from './types'

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

export function PodcastReader({
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
}: PodcastReaderProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const contentSurfaceRef = useRef<HTMLDivElement>(null)
  const workspacePanelId = useId().replace(/:/g, '')
  const mergedMessages = useMemo(() => resolveReaderMessages(messages), [messages])

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selection, setSelection] = useState<ReaderSelection | null>(null)

  const audioSrc = canRenderAudioSource(data.audioUrl) ? data.audioUrl : undefined
  const timelineDuration = duration || data.durationMs || 0
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
    const audio = audioRef.current
    if (!audio) return

    const syncState = () => {
      setCurrentTime(audio.currentTime * 1000)
      setDuration(audio.duration * 1000)
      setIsPlaying(!audio.paused)
      setVolume(audio.volume)
      setIsMuted(audio.muted || audio.volume === 0)
      setPlaybackRate(audio.playbackRate)
    }

    syncState()

    audio.addEventListener('timeupdate', syncState)
    audio.addEventListener('durationchange', syncState)
    audio.addEventListener('play', syncState)
    audio.addEventListener('pause', syncState)
    audio.addEventListener('ended', syncState)
    audio.addEventListener('volumechange', syncState)
    audio.addEventListener('ratechange', syncState)

    return () => {
      audio.removeEventListener('timeupdate', syncState)
      audio.removeEventListener('durationchange', syncState)
      audio.removeEventListener('play', syncState)
      audio.removeEventListener('pause', syncState)
      audio.removeEventListener('ended', syncState)
      audio.removeEventListener('volumechange', syncState)
      audio.removeEventListener('ratechange', syncState)
    }
  }, [audioSrc])

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

    if (data.takeaways && data.takeaways.length > 0) {
      sections.push({
        id: 'takeaways',
        type: 'list',
        title: mergedMessages.takeawaysSection,
        icon: 'takeaways',
        tone: 'amber',
        items: data.takeaways,
        ordered: true,
      })
    }

    if (data.keywords && data.keywords.length > 0) {
      sections.push({
        id: 'keywords',
        type: 'list',
        title: mergedMessages.keywordsSection,
        icon: 'keywords',
        tone: 'primary',
        items: data.keywords,
        pill: true,
      })
    }

    if (data.notes) {
      sections.push({
        id: 'notes',
        type: 'text',
        title: mergedMessages.notesSection,
        icon: 'notes',
        tone: 'emerald',
        content: data.notes,
        multiline: true,
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

    return sections
  }, [data.description, data.keywords, data.notes, data.summary, data.takeaways, mergedMessages])
  const activeTranscript = activeTranscriptIndex >= 0 ? transcript[activeTranscriptIndex] : null
  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : null
  const activeUnit = useMemo(
    () =>
      activeTranscript
        ? {
            id: activeTranscript.id ?? `segment-${activeTranscript.startMs}`,
            title: activeTranscript.speaker
              ? `[${activeTranscript.speaker}] ${formatTime(activeTranscript.startMs)}`
              : formatTime(activeTranscript.startMs),
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

  useEffect(() => {
    const handleSelection = () => {
      setSelection(
        getScopedSelection({
          root: contentSurfaceRef.current,
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
      progress: timelineDuration > 0 ? currentTime / timelineDuration : 0,
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
    identity,
    onProgressChange,
    onSessionSnapshotChange,
    runtime.annotations.length,
    runtime.updateSessionSnapshot,
    selection,
    timelineDuration,
    activeUnit,
    visibleContent,
  ])

  useEffect(() => {
    renderReaderQuoteHighlights(contentSurfaceRef.current, runtime.annotations)
  }, [runtime.annotations, sidebarSections, transcript, currentTime])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      void audio.play()
      return
    }

    audio.pause()
  }

  const seekTo = (timeMs: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = timeMs / 1000
    setCurrentTime(timeMs)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(audio.duration || Number.MAX_SAFE_INTEGER, audio.currentTime + seconds))
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const nextVolume = value[0] ?? 0
    audio.volume = nextVolume
    audio.muted = nextVolume === 0
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !audio.muted
  }

  const cyclePlaybackRate = () => {
    const audio = audioRef.current
    if (!audio) return

    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate)
    const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length]
    audio.playbackRate = nextRate
  }

  const hero = (
    <>
      <div className="rounded border border-border bg-card p-3">
        <div className="flex gap-3">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
            {data.coverUrl ? (
              <img src={data.coverUrl} alt={data.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl">🎙️</div>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-between py-0.5">
            <div>
              {data.podcastTitle ? (
                <p className="text-[10px] text-muted-foreground">{data.podcastTitle}</p>
              ) : null}
              <h1 className="line-clamp-2 font-serif text-sm font-bold leading-tight">{data.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              {data.publishedAt ? (
                <span className="flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {format(new Date(data.publishedAt), dateFormat, { locale: dateLocale })}
                </span>
              ) : null}

              {data.durationText ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {data.durationText}
                </span>
              ) : null}

              {data.externalUrl ? (
                <a
                  href={data.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {mergedMessages.sourceLink}
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {audioSrc ? <audio ref={audioRef} src={audioSrc} preload="metadata" /> : <audio ref={audioRef} preload="metadata" />}

          <div className="flex items-center gap-2">
            <span className="w-8 text-right font-mono text-[9px] text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={timelineDuration}
              step={1000}
              onValueChange={(value) => seekTo(value[0] ?? 0)}
              className="flex-1"
              disabled={!audioSrc || timelineDuration <= 0}
            />
            <span className="w-8 font-mono text-[9px] text-muted-foreground">
              {formatTime(timelineDuration)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                disabled={!audioSrc}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-16"
                disabled={!audioSrc}
              />
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => skip(-15)}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                disabled={!audioSrc}
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={togglePlay}
                className="rounded-full bg-foreground p-1.5 text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!audioSrc}
              >
                {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
              </button>

              <button
                onClick={() => skip(15)}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                disabled={!audioSrc}
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={cyclePlaybackRate}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!audioSrc}
            >
              {playbackRate}x
            </button>
          </div>

          {!audioSrc ? (
            <p className="text-center text-[10px] text-muted-foreground">{mergedMessages.audioUnavailable}</p>
          ) : null}
        </div>

        {data.tags && data.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
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
      contentSurfaceRef={contentSurfaceRef}
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
      overlay={
        <ReaderSelectionOverlayHost
          surfaceRef={contentSurfaceRef}
          selection={selection}
          capabilities={capabilities}
          analysisContext={runtime.analysisContext}
          selectionMenuEnabled={resolvedPreferences.behavior.selectionMenu !== false}
          reduceMotion={resolvedPreferences.behavior.reduceMotion === true}
          canTranslate={runtime.translation.canTranslate}
          requestSelectionTranslation={() => runtime.translation.requestTranslation('selection')}
          createHighlight={(color = 'yellow') => runtime.createAnnotationFromSelection(color)}
          updateNoteBody={runtime.updateAnnotationBody}
          updateHighlightColor={runtime.updateAnnotationColor}
          workspacePanelIdPrefix={workspacePanelId}
        />
      }
      sidebarExtra={
        <ReaderWorkspacePanel
          idPrefix={workspacePanelId}
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
