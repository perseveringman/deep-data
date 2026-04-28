'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

import { DocumentShell } from '@/components/document-reader/shared'
import type {
  ReaderContentSlice,
  ReaderRuntimeProps,
  ReaderDocumentIdentity,
  ReaderPersistenceEvents,
  ReaderPreferencesPatch,
  ReaderPreferencesChangeEvent,
  ReaderSearchResult,
  ReaderSelection,
  ReaderSessionSnapshot,
  ReaderTocItem,
} from '@/components/reader-platform'
import {
  defaultReaderCapabilities,
  defaultReaderPreferenceCapabilities,
  clearStoredReaderLocator,
  getScopedSelection,
  readStoredReaderLocator,
  ReaderSelectionOverlayHost,
  ReaderWorkspacePanel,
  renderReaderQuoteHighlights,
  useManagedReaderPreferences,
  useReaderRuntime,
  writeStoredReaderLocator,
} from '@/components/reader-platform'
import { cn } from '@/lib/utils'

import { parseMarkdownDocument, remarkHeadingIdPlugin, searchMarkdownDocument } from './parser'

type MarkdownReaderSource =
  | { markdown: string }
  | { url: string }

export interface MarkdownReaderProps extends ReaderPersistenceEvents, ReaderRuntimeProps {
  identity: ReaderDocumentIdentity
  source: MarkdownReaderSource
  toc?: boolean
  search?: boolean
  allowRawHtml?: boolean
  initialAnchor?: string
  preferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
}

function findNearestAnchor(node: Node | null, root: HTMLElement | null, fallbackAnchor: string): string {
  let current: HTMLElement | null =
    node instanceof HTMLElement ? node : node?.parentElement ?? null

  while (current) {
    if (current.id) {
      return current.id
    }
    current = current.parentElement
  }

  const element = node instanceof HTMLElement ? node : node?.parentElement ?? null
  if (!root || !element) return fallbackAnchor

  const headings = Array.from(
    root.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'),
  )

  let nearestAnchor = fallbackAnchor
  for (const heading of headings) {
    const relation = heading.compareDocumentPosition(element)
    if (relation & Node.DOCUMENT_POSITION_FOLLOWING) {
      nearestAnchor = heading.id
      continue
    }

    if (relation & Node.DOCUMENT_POSITION_PRECEDING) {
      break
    }
  }

  if (nearestAnchor) {
    return nearestAnchor
  }

  return fallbackAnchor
}

export function MarkdownReader({
  identity,
  source,
  toc = true,
  search = true,
  allowRawHtml = false,
  initialAnchor,
  preferences,
  onPreferencesChange,
  onProgressChange,
  onSessionSnapshotChange,
  translationExecutor,
  defaultProvider,
  defaultTargetLang,
  translationDisplayMode,
  initialAnnotations,
  onAnnotationChange,
  onAnalysisContextChange,
}: MarkdownReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const restoredAnchorAppliedRef = useRef(false)
  const workspacePanelId = useId().replace(/:/g, '')

  const [markdown, setMarkdown] = useState('markdown' in source ? source.markdown : '')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeAnchor, setActiveAnchor] = useState<string>('document-start')
  const [restoredAnchor, setRestoredAnchor] = useState<string | null>(initialAnchor ?? null)
  const [selection, setSelection] = useState<ReaderSelection | null>(null)
  const managedPreferences = useManagedReaderPreferences({
    identity,
    basePreferences: preferences,
    onPreferencesChange,
  })

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
  const capabilities = useMemo(
    () => ({
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
    }),
    [search, toc],
  )
  const resolvedPreferences = managedPreferences.preferences
  const scrollBehavior = resolvedPreferences.behavior.reduceMotion ? 'auto' : 'smooth'
  const selectedAnchor = selection?.range.start.kind === 'anchor' ? selection.range.start.anchor : null
  const activeSectionAnchor = selectedAnchor ?? activeAnchor
  const activeSectionIndex = useMemo(
    () => Math.max(0, parsed.sections.findIndex((section) => section.id === activeSectionAnchor)),
    [activeSectionAnchor, parsed.sections],
  )
  const visibleSections = useMemo(
    () => parsed.sections.slice(activeSectionIndex, activeSectionIndex + 3),
    [activeSectionIndex, parsed.sections],
  )
  const activeSection = parsed.sections[activeSectionIndex] ?? null
  const activeUnit = activeSection
    ? {
        id: activeSection.id,
        title: activeSection.title,
        text: activeSection.text,
        markdown: activeSection.text,
        locator: { kind: 'anchor' as const, anchor: activeSection.id },
      }
    : null
  const runtime = useReaderRuntime({
    document: identity,
    capabilities,
    preferences: resolvedPreferences,
    activeUnit,
    visibleContent: visibleSections.map<ReaderContentSlice>((section) => ({
      id: section.id,
      text: section.text,
      markdown: section.text,
      locator: { kind: 'anchor', anchor: section.id },
    })),
    translationExecutor,
    defaultProvider,
    defaultTargetLang,
    translationDisplayMode,
    initialAnnotations,
    onAnnotationChange,
    onAnalysisContextChange,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    restoredAnchorAppliedRef.current = false

    if (resolvedPreferences.behavior.rememberLastLocation === false) {
      clearStoredReaderLocator(window.localStorage, identity)
      setRestoredAnchor(initialAnchor ?? null)
      return
    }

    const locator = readStoredReaderLocator(window.localStorage, identity)
    setRestoredAnchor(locator?.kind === 'anchor' ? locator.anchor : (initialAnchor ?? null))
  }, [
    identity,
    initialAnchor,
    resolvedPreferences.behavior.rememberLastLocation,
  ])

  useEffect(() => {
    if (!contentRef.current || !restoredAnchor || restoredAnchorAppliedRef.current) return

    const element = contentRef.current.querySelector<HTMLElement>(`#${CSS.escape(restoredAnchor)}`)
    if (!element) return

    element.scrollIntoView({ behavior: scrollBehavior, block: 'start' })
    setActiveAnchor(restoredAnchor)
    restoredAnchorAppliedRef.current = true
  }, [markdown, restoredAnchor, scrollBehavior])

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

  const syncSelection = useCallback(() => {
    window.requestAnimationFrame(() => {
      setSelection(
        getScopedSelection({
          root: contentRef.current,
          buildRange: (text, domRange) => ({
            start: {
              kind: 'anchor',
              anchor: findNearestAnchor(domRange.startContainer, contentRef.current, activeAnchor),
            },
            quote: {
              exact: text,
            },
          }),
        }),
      )
    })
  }, [activeAnchor])

  useEffect(() => {
    document.addEventListener('pointerup', syncSelection)
    document.addEventListener('keyup', syncSelection)
    return () => {
      document.removeEventListener('pointerup', syncSelection)
      document.removeEventListener('keyup', syncSelection)
    }
  }, [syncSelection])

  useEffect(() => {
    renderReaderQuoteHighlights(contentRef.current, runtime.annotations)
  }, [markdown, runtime.annotations])

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
      visibleContent: visibleSections.map<ReaderContentSlice>((section) => ({
        id: section.id,
        text: section.text,
        markdown: section.text,
        locator: { kind: 'anchor', anchor: section.id },
      })),
      annotationsCount: runtime.annotations.length,
    }

    runtime.updateSessionSnapshot(snapshot)
    onSessionSnapshotChange?.(snapshot)

    if (typeof window === 'undefined') return

    if (
      resolvedPreferences.behavior.autoSaveProgress !== false &&
      resolvedPreferences.behavior.rememberLastLocation !== false
    ) {
      writeStoredReaderLocator(window.localStorage, identity, locator)
      return
    }

    clearStoredReaderLocator(window.localStorage, identity)
  }, [
    activeAnchor,
    identity,
    onProgressChange,
    onSessionSnapshotChange,
    parsed.headingIds,
    runtime.annotations.length,
    runtime.updateSessionSnapshot,
    resolvedPreferences.behavior.autoSaveProgress,
    resolvedPreferences.behavior.rememberLastLocation,
    selection,
    visibleSections,
  ])

  const jumpToAnchor = (item: ReaderTocItem | ReaderSearchResult) => {
    const anchor = item.locator.kind === 'anchor' ? item.locator.anchor : null
    if (!anchor) return

    const element = document.getElementById(anchor)
    element?.scrollIntoView({ behavior: scrollBehavior, block: 'start' })
    setActiveAnchor(anchor)
  }

  return (
    <DocumentShell
      title={identity.title}
      subtitle="Markdown Reader"
      capabilities={capabilities}
      preferenceCapabilities={{
        ...defaultReaderPreferenceCapabilities,
        behavior: {
          ...defaultReaderPreferenceCapabilities.behavior,
          scrollMode: false,
        },
      }}
      preferences={managedPreferences.preferencePatch}
      onPreferencesChange={managedPreferences.updatePreferences}
      onPreferencesReset={managedPreferences.resetPreferences}
      toc={parsed.toc}
      activeTocId={activeSectionAnchor}
      onTocSelect={jumpToAnchor}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      searchResults={searchResults}
      onSearchResultSelect={jumpToAnchor}
      contentOverlay={
        <ReaderSelectionOverlayHost
          surfaceRef={contentRef}
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
          style={{
            fontFamily: 'var(--reader-font-family)',
            textAlign: resolvedPreferences.typography.textAlign === 'justify' ? 'justify' : 'start',
          }}
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
                    style={{ color: 'var(--reader-accent)' }}
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
              if (annotation.range.start.kind === 'anchor') {
                const element = document.getElementById(annotation.range.start.anchor)
                element?.scrollIntoView({ behavior: scrollBehavior, block: 'start' })
              }
            }}
          onUpdateAnnotationBody={runtime.updateAnnotationBody}
          onDeleteAnnotation={runtime.deleteAnnotation}
        />
      }
    />
  )
}
