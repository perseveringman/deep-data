'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Filter, Moon, Sun, Twitter } from 'lucide-react'

import {
  buildReaderAnalysisContext,
  defaultReaderCapabilities,
  getScopedSelection,
  renderReaderQuoteHighlights,
  type ReaderContentSlice,
  type ReaderDocumentIdentity,
  type ReaderRuntimeProps,
  type ReaderSelection,
} from '@/components/reader-platform'
import { cn } from '@/lib/utils'
import type { XFeedItem } from '@/lib/types'

import { sourceLabels, XReaderCard } from './x-reader-card'

type ThemeMode = 'dark' | 'light'
type SourceFilter = 'all' | XFeedItem['sourceKind']

interface XSpatialReaderProps
  extends Pick<ReaderRuntimeProps, 'initialAnnotations' | 'onAnalysisContextChange'> {
  identity: ReaderDocumentIdentity
  items: XFeedItem[]
}

const filterOrder: SourceFilter[] = ['all', 'for-you', 'following', 'profile', 'timeline']
const CARD_WIDTH = 560
const CARD_GAP_X = 32
const CARD_STEP_Y = 560
const CARD_COLUMNS = 2
const BOARD_PADDING_X = 32
const BOARD_TOP = 280
const CONTROLS_TOP = 88

function getTweetAnchor(itemId: string) {
  return `tweet-${itemId}`
}

function getTweetText(item: XFeedItem) {
  return `${item.authorName} (@${item.authorHandle})\n${item.text}`
}

function buildTweetMarkdown(item: XFeedItem) {
  return `**${item.authorName}** @${item.authorHandle}\n\n${item.text}`
}

function findSelectionTweetId(range: Range) {
  const element =
    range.startContainer instanceof HTMLElement
      ? range.startContainer
      : range.startContainer.parentElement

  return element?.closest<HTMLElement>('[data-x-feed-item-id]')?.dataset.xFeedItemId
}

export function XSpatialReader({
  identity,
  items,
  initialAnnotations,
  onAnalysisContextChange,
}: XSpatialReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [selection, setSelection] = useState<ReaderSelection | null>(null)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const filterOptions = useMemo(() => {
    const counts = items.reduce<Record<SourceFilter, number>>(
      (acc, item) => {
        acc.all += 1
        acc[item.sourceKind] += 1
        return acc
      },
      { all: 0, profile: 0, 'for-you': 0, following: 0, timeline: 0 },
    )

    return filterOrder
      .map((id) => ({
        id,
        label: id === 'all' ? '全部' : sourceLabels[id],
        count: counts[id],
      }))
      .filter((option) => option.count > 0)
  }, [items])

  const filteredItems = useMemo(() => {
    if (sourceFilter === 'all') return items
    return items.filter((item) => item.sourceKind === sourceFilter)
  }, [items, sourceFilter])
  const boardRows = Math.max(1, Math.ceil(filteredItems.length / CARD_COLUMNS))
  const boardWidth = BOARD_PADDING_X * 2 + CARD_COLUMNS * CARD_WIDTH + (CARD_COLUMNS - 1) * CARD_GAP_X
  const boardHeight = BOARD_TOP + boardRows * CARD_STEP_Y + 120

  const visibleContent = useMemo<ReaderContentSlice[]>(
    () =>
      filteredItems.slice(0, 14).map((item) => ({
        id: item.id,
        text: getTweetText(item),
        markdown: buildTweetMarkdown(item),
        locator: { kind: 'anchor', anchor: getTweetAnchor(item.id) },
      })),
    [filteredItems],
  )

  const activeItem = filteredItems[0] ?? items[0]
  const analysisContext = useMemo(
    () =>
      buildReaderAnalysisContext({
        snapshot: {
          document: identity,
          location: {
            kind: 'anchor',
            anchor: activeItem ? getTweetAnchor(activeItem.id) : 'x-feed-start',
          },
          progress: items.length > 0 ? filteredItems.length / items.length : 0,
          selection: selection ?? undefined,
          activeTocItemId: activeItem ? getTweetAnchor(activeItem.id) : 'x-feed-start',
          visibleContent,
        },
        activeUnit: activeItem
          ? {
              id: activeItem.id,
              title: `${activeItem.authorName} @${activeItem.authorHandle}`,
              text: getTweetText(activeItem),
              markdown: buildTweetMarkdown(activeItem),
              locator: { kind: 'anchor', anchor: getTweetAnchor(activeItem.id) },
            }
          : null,
        visibleContent,
        annotations: initialAnnotations ?? [],
        capabilities: {
          ...defaultReaderCapabilities,
          textSelection: true,
          annotations: true,
          aiContext: true,
          continuousScroll: true,
          extractVisibleText: true,
        },
      }),
    [activeItem, filteredItems.length, identity, initialAnnotations, items.length, selection, visibleContent],
  )

  useEffect(() => {
    onAnalysisContextChange?.(analysisContext)
  }, [analysisContext, onAnalysisContextChange])

  const syncSelection = useCallback(() => {
    window.requestAnimationFrame(() => {
      setSelection(
        getScopedSelection({
          root: contentRef.current,
          buildRange: (text, domRange) => {
            const tweetId = findSelectionTweetId(domRange)
            return {
              start: {
                kind: 'anchor',
                anchor: tweetId ? getTweetAnchor(tweetId) : 'x-feed-start',
              },
              quote: { exact: text },
            }
          },
        }),
      )
    })
  }, [])

  useEffect(() => {
    document.addEventListener('pointerup', syncSelection)
    document.addEventListener('keyup', syncSelection)
    return () => {
      document.removeEventListener('pointerup', syncSelection)
      document.removeEventListener('keyup', syncSelection)
    }
  }, [syncSelection])

  useEffect(() => {
    renderReaderQuoteHighlights(contentRef.current, initialAnnotations ?? [])
  }, [expandedIds, filteredItems, initialAnnotations])

  return (
    <div
      className={cn(
        'relative transition-colors',
        theme === 'dark' ? 'dark text-zinc-100' : 'text-zinc-950',
      )}
      style={{
        width: boardWidth,
        height: boardHeight,
      }}
    >
      <section
        data-spatial-interactive
        className="absolute z-30 rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 text-zinc-950 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-black/90 dark:text-zinc-100"
        style={{
          left: BOARD_PADDING_X,
          top: CONTROLS_TOP,
          width: CARD_WIDTH,
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white dark:bg-zinc-100 dark:text-black">
              <Twitter className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold leading-tight">X 阅读器</h2>
              <p className="text-xs leading-tight text-zinc-500">
                {filteredItems.length} / {items.length} · Spatial Canvas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex size-8 items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-zinc-100',
                theme === 'light' && 'bg-white text-zinc-950 shadow-sm',
              )}
              aria-label="浅色"
              title="浅色"
            >
              <Sun className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex size-8 items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-zinc-100',
                theme === 'dark' && 'bg-black text-zinc-100 shadow-sm dark:bg-zinc-800',
              )}
              aria-label="深色"
              title="深色"
            >
              <Moon className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSourceFilter(option.id)
                setSelection(null)
              }}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                sourceFilter === option.id
                  ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-black'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 dark:border-zinc-800 dark:bg-black dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100',
              )}
            >
              <Filter className="size-3.5" />
              {option.label}
              <span className="text-xs opacity-65">{option.count}</span>
            </button>
          ))}
        </div>
      </section>

      <div ref={contentRef} className="absolute inset-0">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => {
            const column = index % CARD_COLUMNS
            const row = Math.floor(index / CARD_COLUMNS)

            return (
              <div
                key={item.id}
                data-spatial-interactive
                data-x-feed-item-id={item.id}
                id={getTweetAnchor(item.id)}
                className="absolute"
                style={{
                  left: BOARD_PADDING_X + column * (CARD_WIDTH + CARD_GAP_X),
                  top: BOARD_TOP + row * CARD_STEP_Y,
                  width: CARD_WIDTH,
                }}
              >
                <XReaderCard
                  item={item}
                  expanded={Boolean(expandedIds[item.id])}
                  onToggleExpanded={() => {
                    setExpandedIds((current) => ({ ...current, [item.id]: !current[item.id] }))
                  }}
                />
              </div>
            )
          })
        ) : (
          <div
            data-spatial-interactive
            className="absolute rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-black"
            style={{
              left: BOARD_PADDING_X,
              top: BOARD_TOP,
              width: CARD_WIDTH,
            }}
          >
            没有找到 X 内容
          </div>
        )}
      </div>
    </div>
  )
}
