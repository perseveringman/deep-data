'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { ArrowUp, FileText, Hash, Info, Lightbulb, List } from 'lucide-react'

import { ReaderSettingsPanel } from '@/components/document-reader/shared'
import { Button } from '@/components/ui/button'
import {
  getReaderPreferenceCssVariables,
  type ReaderPreferenceCapabilities,
  type ReaderPreferences,
  type ReaderPreferencesPatch,
} from '@/components/reader-platform'
import { cn } from '../../lib/utils'
import { useMediaSelectionGesture } from './use-media-selection-gesture'
import {
  findActiveChapterIndex,
  findActiveTranscriptIndex,
  formatTime,
} from './helpers'
import type {
  ReaderChapter,
  ReaderMessages,
  ReaderSectionIcon,
  ReaderSectionTone,
  ReaderSidebarSection,
  ReaderTranscriptSegment,
} from './types'

type ReaderTab = 'chapters' | 'transcript'

interface SharedReaderProps {
  hero: ReactNode
  chapters: ReaderChapter[]
  transcript: ReaderTranscriptSegment[]
  sidebarSections: ReaderSidebarSection[]
  currentTime: number
  isPlaying: boolean
  onSeek: (timeMs: number) => void
  messages: ReaderMessages
  className?: string
  contentHeightClassName?: string
  sidebarStickyTopClassName?: string
  rootRef?: RefObject<HTMLDivElement | null>
  contentSurfaceRef?: RefObject<HTMLDivElement | null>
  overlay?: ReactNode
  sidebarExtra?: ReactNode
  preferences?: ReaderPreferences
  preferenceCapabilities?: ReaderPreferenceCapabilities
  onPreferencesChange?: (patch: ReaderPreferencesPatch) => void
  onPreferencesReset?: () => void
}

const toneClasses: Record<ReaderSectionTone, string> = {
  default: 'text-primary',
  primary: 'text-primary',
  amber: 'text-amber-600',
  emerald: 'text-emerald-600',
}

const iconMap: Record<ReaderSectionIcon, typeof FileText> = {
  summary: FileText,
  takeaways: Lightbulb,
  keywords: Hash,
  notes: List,
  description: FileText,
  details: Info,
}

function SidebarSection({ section }: { section: ReaderSidebarSection }) {
  const Icon = section.icon ? iconMap[section.icon] : FileText
  const titleClassName = toneClasses[section.tone ?? 'default']

  return (
    <div
      className="rounded border p-2"
      style={{
        borderColor: 'var(--reader-border-color)',
        backgroundColor: 'var(--reader-muted-background)',
        color: 'var(--reader-surface-foreground)',
      }}
    >
      <h2
        className={cn('mb-1 flex items-center gap-1 font-serif text-[length:var(--reader-title-font-size)] font-bold', titleClassName)}
      >
        <Icon className="h-3 w-3" />
        {section.title}
      </h2>

      {section.type === 'text' ? (
        <p
          className={cn(
            'text-[length:var(--reader-body-font-size)] leading-relaxed text-muted-foreground',
            section.multiline && 'whitespace-pre-line',
          )}
        >
          {section.content}
        </p>
      ) : null}

      {section.type === 'list' ? (
        section.pill ? (
          <div className="flex flex-wrap gap-1">
            {section.items.map((item) => (
              <span
                key={item}
                className="rounded-full border bg-background px-1.5 py-0.5 text-[length:var(--reader-meta-font-size)] text-muted-foreground"
                style={{ borderColor: 'var(--reader-border-color)' }}
              >
                {item}
              </span>
            ))}
          </div>
        ) : section.ordered ? (
          <ol className="space-y-1">
            {section.items.map((item, index) => (
              <li key={item} className="flex gap-1.5 text-[length:var(--reader-body-font-size)] leading-relaxed">
                <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="space-y-1 text-[length:var(--reader-body-font-size)] leading-relaxed text-muted-foreground">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )
      ) : null}

      {section.type === 'facts' ? (
        <dl className="space-y-1 text-[length:var(--reader-meta-font-size)]">
          {section.items.map((item) => (
            <div key={item.label} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-medium text-right">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}

export function SharedReader({
  hero,
  chapters,
  transcript,
  sidebarSections,
  currentTime,
  isPlaying,
  onSeek,
  messages,
  className,
  contentHeightClassName = 'h-[calc(100vh-80px)]',
  sidebarStickyTopClassName = 'top-12',
  rootRef,
  contentSurfaceRef,
  overlay,
  sidebarExtra,
  preferences,
  preferenceCapabilities,
  onPreferencesChange,
  onPreferencesReset,
}: SharedReaderProps) {
  const [activeTab, setActiveTab] = useState<ReaderTab>(chapters.length > 0 ? 'chapters' : 'transcript')
  const [autoFollowMode, setAutoFollowMode] = useState<'following' | 'free'>('following')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLDivElement>(null)
  const programmaticScrollRef = useRef(false)
  const scrollSettledFrameRef = useRef<number | null>(null)
  const lastProgrammaticScrollTopRef = useRef<number | null>(null)
  const stableProgrammaticFramesRef = useRef(0)
  const resolvedPreferences = preferences
  const cssVars = useMemo(
    () => (resolvedPreferences ? (getReaderPreferenceCssVariables(resolvedPreferences) as CSSProperties) : {}),
    [resolvedPreferences],
  )
  const showSidebar = resolvedPreferences?.layout.sidebarVisible !== false
  const sidebarOnLeft = showSidebar && resolvedPreferences?.layout.sidebarSide === 'left'
  const scrollBehavior = resolvedPreferences?.behavior.reduceMotion ? 'auto' : 'smooth'
  const isAutoFollowPaused = autoFollowMode === 'free'
  const selectionGesture = useMediaSelectionGesture()
  const panelStyle = {
    backgroundColor: 'var(--reader-surface-background)',
    color: 'var(--reader-surface-foreground)',
    borderColor: 'var(--reader-border-color)',
    boxShadow: 'var(--reader-surface-shadow)',
  } satisfies CSSProperties
  const readerTextStyle = {
    fontFamily: 'var(--reader-font-family)',
    lineHeight: 'var(--reader-line-height)',
    letterSpacing: 'var(--reader-letter-spacing)',
    textAlign:
      resolvedPreferences?.typography.textAlign === 'justify'
        ? 'justify'
        : 'start',
  } satisfies CSSProperties

  useEffect(() => {
    if (chapters.length === 0) {
      setActiveTab('transcript')
    }
  }, [chapters.length])

  useEffect(() => {
    setAutoFollowMode('following')
  }, [activeTab])

  const unlockProgrammaticScroll = useCallback(() => {
    if (scrollSettledFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollSettledFrameRef.current)
      scrollSettledFrameRef.current = null
    }

    lastProgrammaticScrollTopRef.current = null
    stableProgrammaticFramesRef.current = 0
    programmaticScrollRef.current = false
  }, [])

  const monitorProgrammaticScroll = useCallback(() => {
    const container = scrollContainerRef.current

    if (!container) {
      unlockProgrammaticScroll()
      return
    }

    const currentTop = container.scrollTop

    if (
      lastProgrammaticScrollTopRef.current === null ||
      Math.abs(currentTop - lastProgrammaticScrollTopRef.current) > 0.5
    ) {
      lastProgrammaticScrollTopRef.current = currentTop
      stableProgrammaticFramesRef.current = 0
    } else {
      stableProgrammaticFramesRef.current += 1

      if (stableProgrammaticFramesRef.current >= 2) {
        unlockProgrammaticScroll()
        return
      }
    }

    scrollSettledFrameRef.current = window.requestAnimationFrame(monitorProgrammaticScroll)
  }, [unlockProgrammaticScroll])

  useEffect(() => unlockProgrammaticScroll, [unlockProgrammaticScroll])

  const scrollActiveItemIntoView = useCallback(() => {
    if (!scrollContainerRef.current || !activeItemRef.current) return

    const container = scrollContainerRef.current
    const element = activeItemRef.current
    const containerRect = container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()

    if (elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom) {
      return
    }

    programmaticScrollRef.current = true
    if (scrollSettledFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollSettledFrameRef.current)
    }
    lastProgrammaticScrollTopRef.current = container.scrollTop
    stableProgrammaticFramesRef.current = 0
    element.scrollIntoView({ behavior: scrollBehavior, block: 'center' })
    scrollSettledFrameRef.current = window.requestAnimationFrame(monitorProgrammaticScroll)
  }, [monitorProgrammaticScroll, scrollBehavior])

  useEffect(() => {
    if (!isPlaying || isAutoFollowPaused || !scrollContainerRef.current || !activeItemRef.current) return

    scrollActiveItemIntoView()
  }, [activeTab, currentTime, isPlaying, isAutoFollowPaused, scrollActiveItemIntoView])

  const activeTranscriptIndex = useMemo(
    () => findActiveTranscriptIndex(currentTime, transcript),
    [currentTime, transcript],
  )

  const activeChapterIndex = useMemo(
    () => findActiveChapterIndex(currentTime, chapters),
    [chapters, currentTime],
  )
  const handleSeekIntent = useCallback(
    (timeMs: number) => {
      if (selectionGesture.shouldSuppressSeek()) {
        selectionGesture.syncAfterGesture()
        return
      }

      setAutoFollowMode('following')
      onSeek(timeMs)
    },
    [onSeek, selectionGesture],
  )
  const handleScrollContainerScroll = useCallback(() => {
    if (!isPlaying || programmaticScrollRef.current) return

    setAutoFollowMode('free')
  }, [isPlaying])
  const resumeAutoFollow = useCallback(() => {
    setAutoFollowMode('following')
    scrollActiveItemIntoView()
  }, [scrollActiveItemIntoView])

  return (
    <div
      ref={rootRef}
      className={cn('relative grid grid-cols-12 gap-[var(--reader-grid-gap)]', className)}
      style={{
        ...cssVars,
        backgroundColor: 'var(--reader-canvas-background)',
        color: 'var(--reader-surface-foreground)',
      }}
    >
      {overlay}
      {resolvedPreferences && preferenceCapabilities && onPreferencesChange ? (
        <div className="col-span-12 flex justify-end">
          <ReaderSettingsPanel
            preferences={resolvedPreferences}
            capabilities={preferenceCapabilities}
            onPreferencesChange={onPreferencesChange}
            onReset={onPreferencesReset}
          />
        </div>
      ) : null}

      {showSidebar && sidebarOnLeft ? (
        <div className="col-span-12 lg:col-span-4">
          <div
            className={cn('sticky space-y-2 overflow-y-auto rounded-lg border p-[var(--reader-panel-padding)]', sidebarStickyTopClassName, contentHeightClassName)}
            style={panelStyle}
          >
            {sidebarSections.map((section) => (
              <SidebarSection key={section.id} section={section} />
            ))}
            {sidebarExtra}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'col-span-12 flex flex-col gap-2',
          showSidebar ? 'lg:col-span-8' : 'lg:col-span-12',
          contentHeightClassName,
        )}
      >
        <div
          ref={contentSurfaceRef}
          className="flex min-h-0 flex-1 flex-col gap-2 rounded-lg border p-[var(--reader-panel-padding)]"
          style={{ ...panelStyle, ...readerTextStyle }}
        >
          {hero}

          <div className="flex min-h-0 flex-1 flex-col">
            <div
              className="mb-1.5 flex flex-shrink-0 items-center gap-2 border-b pb-1"
              style={{ borderColor: 'var(--reader-border-color)' }}
            >
             {chapters.length > 0 ? (
               <button
                 onClick={() => setActiveTab('chapters')}
                  className={cn(
                  'flex items-center gap-1 rounded px-2 py-0.5 text-[length:var(--reader-meta-font-size)] font-medium transition-colors',
                  activeTab === 'chapters'
                    ? 'text-white'
                    : 'text-muted-foreground hover:bg-muted',
                )}
                style={
                  activeTab === 'chapters'
                    ? {
                        backgroundColor: 'var(--reader-accent)',
                      }
                    : undefined
                }
               >
                 <List className="h-3 w-3" />
                 {messages.chapters} ({chapters.length})
              </button>
            ) : null}

            <button
              onClick={() => setActiveTab('transcript')}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-0.5 text-[length:var(--reader-meta-font-size)] font-medium transition-colors',
                activeTab === 'transcript'
                  ? 'text-white'
                  : 'text-muted-foreground hover:bg-muted',
              )}
              style={
                activeTab === 'transcript'
                  ? {
                      backgroundColor: 'var(--reader-accent)',
                    }
                  : undefined
              }
            >
              <FileText className="h-3 w-3" />
              {messages.transcript} ({transcript.length})
            </button>

            <span className="ml-auto font-mono text-[length:var(--reader-meta-font-size)] text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            </div>

            <div
              ref={scrollContainerRef}
              className="relative flex-1 overflow-y-auto"
              onScroll={handleScrollContainerScroll}
              onPointerDownCapture={selectionGesture.handlePointerDownCapture}
              onPointerUpCapture={selectionGesture.handlePointerUpCapture}
              onKeyUpCapture={selectionGesture.handleKeyUpCapture}
            >
              {isAutoFollowPaused ? (
                <div className="pointer-events-none absolute right-2 top-2 z-10 flex justify-end">
                  <div className="pointer-events-auto max-w-[220px] rounded-md border bg-background/95 px-2.5 py-2 shadow-sm backdrop-blur">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 text-xs font-medium">正在自由查看</p>
                      <Button type="button" size="sm" variant="outline" onClick={resumeAutoFollow}>
                        <ArrowUp className="h-3.5 w-3.5" />
                        回到自动滚动
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
              {activeTab === 'chapters' && chapters.length > 0 ? (
                <div className="space-y-0.5">
                  {chapters.map((chapter, index) => {
                    const isActive = index === activeChapterIndex

                    return (
                      <div
                        key={chapter.id ?? `${chapter.seconds}-${chapter.title}`}
                        ref={isActive ? activeItemRef : null}
                        onClick={() => handleSeekIntent(chapter.seconds * 1000)}
                        className={cn(
                          'cursor-pointer rounded px-2 py-1 transition-colors',
                          isActive ? 'border-l-2 hover:bg-transparent' : 'hover:bg-muted',
                        )}
                        style={
                          isActive
                            ? {
                                borderColor: 'var(--reader-accent)',
                                backgroundColor: 'var(--reader-accent-soft)',
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              'font-mono text-[length:var(--reader-meta-font-size)]',
                              isActive ? 'font-medium' : 'text-muted-foreground',
                            )}
                            style={isActive ? { color: 'var(--reader-accent)' } : undefined}
                          >
                            {chapter.time}
                          </span>
                          <span
                            className={cn(
                              'flex-1 text-[length:var(--reader-body-font-size)] leading-snug',
                              isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                            )}
                          >
                            {chapter.title}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : transcript.length > 0 ? (
                <div className="space-y-0.5">
                  {transcript.map((segment, index) => {
                    const isActive = index === activeTranscriptIndex

                    return (
                      <div
                        key={segment.id ?? `${segment.startMs}-${segment.text.slice(0, 24)}`}
                        ref={isActive ? activeItemRef : null}
                        onClick={() => handleSeekIntent(segment.startMs)}
                        className={cn(
                          'cursor-pointer rounded px-1.5 py-1 text-[length:var(--reader-body-font-size)] transition-colors',
                          isActive ? 'text-foreground' : 'text-muted-foreground hover:bg-muted',
                        )}
                        style={
                          isActive
                            ? {
                                backgroundColor: 'var(--reader-accent-soft)',
                              }
                            : undefined
                        }
                      >
                        <span
                          className={cn(
                            'mr-1.5 font-mono text-[length:var(--reader-meta-font-size)]',
                            isActive ? '' : 'text-muted-foreground/60',
                          )}
                          style={isActive ? { color: 'var(--reader-accent)' } : undefined}
                        >
                          {formatTime(segment.startMs)}
                        </span>
                        {segment.speaker ? (
                          <span
                            className={cn(
                              'mr-1 text-[length:var(--reader-title-font-size)]',
                              isActive ? 'font-medium' : 'text-muted-foreground/80',
                            )}
                            style={isActive ? { color: 'var(--reader-accent)' } : undefined}
                          >
                            [{segment.speaker}]
                          </span>
                        ) : null}
                        <span className="leading-snug">{segment.text}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-[length:var(--reader-body-font-size)] text-muted-foreground">
                  {activeTab === 'chapters' ? messages.noChapters : messages.noTranscript}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSidebar && !sidebarOnLeft ? (
        <div className="col-span-12 lg:col-span-4">
          <div
            className={cn('sticky space-y-2 overflow-y-auto rounded-lg border p-[var(--reader-panel-padding)]', sidebarStickyTopClassName, contentHeightClassName)}
            style={panelStyle}
          >
            {sidebarSections.map((section) => (
              <SidebarSection key={section.id} section={section} />
            ))}
            {sidebarExtra}
          </div>
        </div>
      ) : null}
    </div>
  )
}
