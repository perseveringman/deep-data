'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  buildReaderAnalysisContext,
  defaultReaderCapabilities,
  getScopedSelection,
  renderReaderQuoteHighlights,
  type ReaderAnnotation,
  type ReaderContentSlice,
  type ReaderDocumentIdentity,
  type ReaderRuntimeProps,
  type ReaderSelection,
} from '@/components/reader-platform'
import type { XFeedItem } from '@/lib/types'

import { XReaderCard } from './x-reader-card'

interface XPostReaderProps
  extends Pick<ReaderRuntimeProps, 'initialAnnotations' | 'onAnalysisContextChange'> {
  identity: ReaderDocumentIdentity
  item: XFeedItem
}

function getTweetAnchor(itemId: string) {
  return `tweet-${itemId}`
}

function getTweetText(item: XFeedItem) {
  return `${item.authorName} (@${item.authorHandle})\n${item.text}`
}

function buildTweetMarkdown(item: XFeedItem) {
  return `**${item.authorName}** @${item.authorHandle}\n\n${item.text}`
}

function isTweetAnnotation(annotation: ReaderAnnotation, itemId: string) {
  const start = annotation.range.start
  return start.kind !== 'anchor' || start.anchor === getTweetAnchor(itemId)
}

export function XPostReader({
  identity,
  item,
  initialAnnotations,
  onAnalysisContextChange,
}: XPostReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [selection, setSelection] = useState<ReaderSelection | null>(null)

  const tweetAnchor = getTweetAnchor(item.id)
  const visibleContent = useMemo<ReaderContentSlice[]>(
    () => [
      {
        id: item.id,
        text: getTweetText(item),
        markdown: buildTweetMarkdown(item),
        locator: { kind: 'anchor', anchor: tweetAnchor },
      },
    ],
    [item, tweetAnchor],
  )
  const tweetAnnotations = useMemo(
    () => (initialAnnotations ?? []).filter((annotation) => isTweetAnnotation(annotation, item.id)),
    [initialAnnotations, item.id],
  )

  const analysisContext = useMemo(
    () =>
      buildReaderAnalysisContext({
        snapshot: {
          document: identity,
          location: { kind: 'anchor', anchor: tweetAnchor },
          progress: 1,
          selection: selection ?? undefined,
          activeTocItemId: tweetAnchor,
          visibleContent,
        },
        activeUnit: {
          id: item.id,
          title: `${item.authorName} @${item.authorHandle}`,
          text: getTweetText(item),
          markdown: buildTweetMarkdown(item),
          locator: { kind: 'anchor', anchor: tweetAnchor },
        },
        visibleContent,
        annotations: tweetAnnotations,
        capabilities: {
          ...defaultReaderCapabilities,
          textSelection: true,
          annotations: true,
          aiContext: true,
          continuousScroll: true,
          extractVisibleText: true,
        },
      }),
    [identity, item, selection, tweetAnchor, tweetAnnotations, visibleContent],
  )

  useEffect(() => {
    onAnalysisContextChange?.(analysisContext)
  }, [analysisContext, onAnalysisContextChange])

  const syncSelection = useCallback(() => {
    window.requestAnimationFrame(() => {
      setSelection(
        getScopedSelection({
          root: contentRef.current,
          buildRange: (text) => ({
            start: { kind: 'anchor', anchor: tweetAnchor },
            quote: { exact: text },
          }),
        }),
      )
    })
  }, [tweetAnchor])

  useEffect(() => {
    renderReaderQuoteHighlights(contentRef.current, tweetAnnotations)
  }, [expanded, tweetAnnotations])

  return (
    <div
      ref={contentRef}
      data-x-feed-item-id={item.id}
      id={tweetAnchor}
      className="dark min-h-full bg-black text-zinc-100"
      onPointerUp={syncSelection}
      onKeyUp={syncSelection}
    >
      <XReaderCard
        item={item}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((value) => !value)}
        className="min-h-full rounded-none border-0 shadow-none"
      />
    </div>
  )
}
