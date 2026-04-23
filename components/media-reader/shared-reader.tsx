'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { FileText, Hash, Info, Lightbulb, List } from 'lucide-react'

import { cn } from '../../lib/utils'
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
  sidebarExtra?: ReactNode
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
    <div className="rounded border border-border bg-muted/30 p-2">
      <h2 className={cn('mb-1 flex items-center gap-1 font-serif text-[10px] font-bold', titleClassName)}>
        <Icon className="h-3 w-3" />
        {section.title}
      </h2>

      {section.type === 'text' ? (
        <p
          className={cn(
            'text-[10px] leading-relaxed text-muted-foreground',
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
                className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        ) : section.ordered ? (
          <ol className="space-y-1">
            {section.items.map((item, index) => (
              <li key={item} className="flex gap-1.5 text-[10px] leading-relaxed">
                <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="space-y-1 text-[10px] leading-relaxed text-muted-foreground">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )
      ) : null}

      {section.type === 'facts' ? (
        <dl className="space-y-1 text-[9px]">
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
  sidebarExtra,
}: SharedReaderProps) {
  const [activeTab, setActiveTab] = useState<ReaderTab>(chapters.length > 0 ? 'chapters' : 'transcript')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chapters.length === 0) {
      setActiveTab('transcript')
    }
  }, [chapters.length])

  useEffect(() => {
    if (!isPlaying || !scrollContainerRef.current || !activeItemRef.current) return

    const container = scrollContainerRef.current
    const element = activeItemRef.current
    const containerRect = container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()

    if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeTab, currentTime, isPlaying])

  const activeTranscriptIndex = useMemo(
    () => findActiveTranscriptIndex(currentTime, transcript),
    [currentTime, transcript],
  )

  const activeChapterIndex = useMemo(
    () => findActiveChapterIndex(currentTime, chapters),
    [chapters, currentTime],
  )

  return (
    <div ref={rootRef} className={cn('grid grid-cols-12 gap-3', className)}>
      <div className={cn('col-span-12 flex flex-col gap-2 lg:col-span-8', contentHeightClassName)}>
        {hero}

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-1.5 flex flex-shrink-0 items-center gap-2 border-b border-border pb-1">
            {chapters.length > 0 ? (
              <button
                onClick={() => setActiveTab('chapters')}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                  activeTab === 'chapters'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <List className="h-3 w-3" />
                {messages.chapters} ({chapters.length})
              </button>
            ) : null}

            <button
              onClick={() => setActiveTab('transcript')}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                activeTab === 'transcript'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <FileText className="h-3 w-3" />
              {messages.transcript} ({transcript.length})
            </button>

            <span className="ml-auto font-mono text-[9px] text-muted-foreground">
              {formatTime(currentTime)}
            </span>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            {activeTab === 'chapters' && chapters.length > 0 ? (
              <div className="space-y-0.5">
                {chapters.map((chapter, index) => {
                  const isActive = index === activeChapterIndex

                  return (
                    <div
                      key={chapter.id ?? `${chapter.seconds}-${chapter.title}`}
                      ref={isActive ? activeItemRef : null}
                      onClick={() => onSeek(chapter.seconds * 1000)}
                      className={cn(
                        'cursor-pointer rounded px-2 py-1 transition-colors',
                        isActive ? 'border-l-2 border-primary bg-primary/10' : 'hover:bg-muted',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn('font-mono text-[9px]', isActive ? 'font-medium text-primary' : 'text-muted-foreground')}>
                          {chapter.time}
                        </span>
                        <span className={cn('flex-1 text-[10px] leading-snug', isActive ? 'font-medium text-foreground' : 'text-muted-foreground')}>
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
                      onClick={() => onSeek(segment.startMs)}
                      className={cn(
                        'cursor-pointer rounded px-1.5 py-1 text-[11px] transition-colors',
                        isActive ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <span className={cn('mr-1.5 font-mono text-[9px]', isActive ? 'text-primary' : 'text-muted-foreground/60')}>
                        {formatTime(segment.startMs)}
                      </span>
                      {segment.speaker ? (
                        <span className={cn('mr-1 text-[10px]', isActive ? 'font-medium text-primary' : 'text-muted-foreground/80')}>
                          [{segment.speaker}]
                        </span>
                      ) : null}
                      <span className="leading-snug">{segment.text}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-[11px] text-muted-foreground">
                {activeTab === 'chapters' ? messages.noChapters : messages.noTranscript}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <div className={cn('sticky space-y-2 overflow-y-auto', sidebarStickyTopClassName, contentHeightClassName)}>
          {sidebarSections.map((section) => (
            <SidebarSection key={section.id} section={section} />
          ))}
          {sidebarExtra}
        </div>
      </div>
    </div>
  )
}
