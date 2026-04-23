'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

import { DocumentShell } from '@/components/document-reader/shared'
import type {
  ReaderContentSlice,
  ReaderDocumentIdentity,
  ReaderPersistenceEvents,
  ReaderPreferences,
  ReaderPreferencesPatch,
  ReaderPreferencesChangeEvent,
  ReaderSearchResult,
  ReaderSelection,
  ReaderSessionSnapshot,
  ReaderTocItem,
} from '@/components/reader-platform'
import { defaultReaderCapabilities, defaultReaderPreferenceCapabilities, locatorEquals } from '@/components/reader-platform'
import { cn } from '@/lib/utils'

import { parseMarkdownDocument, remarkHeadingIdPlugin, searchMarkdownDocument } from './parser'

type MarkdownReaderSource =
  | { markdown: string }
  | { url: string }

export interface MarkdownReaderProps extends ReaderPersistenceEvents {
  identity: ReaderDocumentIdentity
  source: MarkdownReaderSource
  toc?: boolean
  search?: boolean
  allowRawHtml?: boolean
  preferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
}

function getSelectionRange(): ReaderSelection | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null

  const text = selection.toString().trim()
  if (!text) return null

  return {
    text,
    range: {
      start: {
        kind: 'anchor',
        anchor: 'selection',
      },
      quote: {
        exact: text,
      },
    },
  }
}

export function MarkdownReader({
  identity,
  source,
  toc = true,
  search = true,
  allowRawHtml = false,
  preferences,
  onPreferencesChange,
  onProgressChange,
  onSessionSnapshotChange,
}: MarkdownReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const [markdown, setMarkdown] = useState('markdown' in source ? source.markdown : '')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeAnchor, setActiveAnchor] = useState<string>('document-start')
  const [selection, setSelection] = useState<ReaderSelection | null>(null)

  useEffect(() => {
    if ('markdown' in source) {
      setMarkdown(source.markdown)
      return
    }

    let cancelled = false
    void fetch(source.url)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setMarkdown(text)
        }
      })

    return () => {
      cancelled = true
    }
  }, [source])

  const parsed = useMemo(() => parseMarkdownDocument(markdown), [markdown])
  const searchResults = useMemo<ReaderSearchResult[]>(
    () => (search ? searchMarkdownDocument(markdown, searchQuery) : []),
    [markdown, search, searchQuery],
  )

  useEffect(() => {
    if (!contentRef.current) return

    const headings = Array.from(
      contentRef.current.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'),
    )

    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        const nextAnchor = visible[0]?.target.getAttribute('id')
        if (nextAnchor) {
          setActiveAnchor(nextAnchor)
        }
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0, 0.5, 1],
      },
    )

    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [markdown])

  useEffect(() => {
    const handleSelection = () => {
      setSelection(getSelectionRange())
    }

    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [])

  useEffect(() => {
    const locator = {
      kind: 'anchor' as const,
      anchor: activeAnchor,
    }

    onProgressChange?.({
      documentId: identity.documentId,
      locator,
      progress:
        parsed.headingIds.length > 0
          ? Math.max(0, parsed.headingIds.findIndex((id) => id === activeAnchor)) / parsed.headingIds.length
          : 0,
      lastReadAt: new Date().toISOString(),
    })

    const snapshot: ReaderSessionSnapshot = {
      document: identity,
      location: locator,
      progress:
        parsed.headingIds.length > 0
          ? Math.max(0, parsed.headingIds.findIndex((id) => id === activeAnchor)) / parsed.headingIds.length
          : 0,
      selection: selection ?? undefined,
      activeTocItemId: activeAnchor,
      visibleContent: parsed.sections.slice(0, 3).map<ReaderContentSlice>((section) => ({
        id: section.id,
        text: section.text,
        markdown: section.text,
        locator: { kind: 'anchor', anchor: section.id },
      })),
    }

    onSessionSnapshotChange?.(snapshot)
  }, [activeAnchor, identity, onProgressChange, onSessionSnapshotChange, parsed.headingIds, parsed.sections, selection])

  const jumpToAnchor = (item: ReaderTocItem | ReaderSearchResult) => {
    const anchor = item.locator.kind === 'anchor' ? item.locator.anchor : null
    if (!anchor) return

    const element = document.getElementById(anchor)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveAnchor(anchor)
  }

  return (
    <DocumentShell
      title={identity.title}
      subtitle="Markdown Reader"
      capabilities={{
        ...defaultReaderCapabilities,
        textSelection: true,
        translation: true,
        annotations: true,
        aiContext: true,
        toc,
        search,
        continuousScroll: true,
        jumpToLocator: true,
        extractVisibleText: true,
      }}
      preferenceCapabilities={{
        ...defaultReaderPreferenceCapabilities,
        behavior: {
          ...defaultReaderPreferenceCapabilities.behavior,
          scrollMode: false,
        },
      }}
      preferences={preferences}
      onPreferencesChange={onPreferencesChange}
      toc={parsed.toc}
      activeTocId={activeAnchor}
      onTocSelect={jumpToAnchor}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      searchResults={searchResults}
      onSearchResultSelect={jumpToAnchor}
      content={
        <div
          ref={contentRef}
          className={cn(
            'mx-auto max-w-[var(--reader-content-width)] px-6 py-8 text-[length:var(--reader-font-size)] leading-[var(--reader-line-height)] tracking-[var(--reader-letter-spacing)]',
            '[&_p]:mb-[var(--reader-paragraph-spacing)] [&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse',
            '[&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-muted [&_th]:p-2',
            '[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic',
            '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4',
            '[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5',
            '[&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold',
            '[&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6',
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkHeadingIdPlugin]}
            rehypePlugins={allowRawHtml ? [rehypeRaw, rehypeSanitize] : [rehypeSanitize]}
            skipHtml={!allowRawHtml}
            components={{
              a(props) {
                return (
                  <a
                    {...props}
                    className={cn('text-primary underline underline-offset-4', props.className)}
                    target="_blank"
                    rel="noreferrer"
                  />
                )
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      }
      rightSidebarExtra={
        <div className="space-y-3">
          {selection ? (
            <div className="rounded border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">当前选中文本</p>
              <p className="text-sm">{selection.text}</p>
            </div>
          ) : null}
          <div className="rounded border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">当前章节</p>
            <p className="text-sm">
              {parsed.sections.find((section) =>
                locatorEquals({ kind: 'anchor', anchor: section.id }, { kind: 'anchor', anchor: activeAnchor }),
              )?.title ?? '未进入章节'}
            </p>
          </div>
        </div>
      }
    />
  )
}
