'use client'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import { DocumentShell } from '@/components/document-reader/shared'
import type {
  ReaderDocumentIdentity,
  ReaderPersistenceEvents,
  ReaderPreferencesPatch,
  ReaderPreferencesChangeEvent,
  ReaderSearchResult,
  ReaderRuntimeProps,
  ReaderSelection,
  ReaderSessionSnapshot,
  ReaderTocItem,
} from '@/components/reader-platform'
import {
  defaultReaderCapabilities,
  defaultReaderPreferenceCapabilities,
  defaultReaderPreferences,
  getScopedSelection,
  ReaderSelectionOverlayHost,
  ReaderWorkspacePanel,
  renderReaderQuoteHighlights,
  resolveReaderPreferences,
  useReaderRuntime,
} from '@/components/reader-platform'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type PdfReaderSource =
  | { url: string }
  | { file: File }
  | { data: Uint8Array }

export interface PdfReaderProps extends ReaderPersistenceEvents, ReaderRuntimeProps {
  identity: ReaderDocumentIdentity
  source: PdfReaderSource
  initialPage?: number
  preferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
  onPageChange?: (page: number) => void
}

function sourceToFile(source: PdfReaderSource): string | File | { data: Uint8Array } {
  if ('url' in source) return source.url
  if ('file' in source) return source.file
  return { data: source.data }
}

function isPdfTransportDestroyedError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Transport destroyed')
}

function flattenOutline(items: any[] | null | undefined, depth = 1): ReaderTocItem[] {
  if (!items) return []

  return items.map((item, index) => ({
    id: `${depth}-${index}-${item.title ?? 'outline'}`,
    title: item.title ?? `Section ${index + 1}`,
    locator: { kind: 'page', page: Math.max(1, item.dest?.[0]?.num ?? item.pageNumber ?? 1) },
    level: depth,
    children: flattenOutline(item.items, depth + 1),
  }))
}

export function PdfReader({
  identity,
  source,
  initialPage = 1,
  preferences,
  onPreferencesChange,
  onPageChange,
  onProgressChange,
  onSessionSnapshotChange,
  translationExecutor,
  defaultProvider,
  defaultTargetLang,
  translationDisplayMode,
  initialAnnotations,
  onAnnotationChange,
  onAnalysisContextChange,
}: PdfReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const loadTaskIdRef = useRef(0)
  const workspacePanelId = useId().replace(/:/g, '')
  const [pageNumber, setPageNumber] = useState(initialPage)
  const [numPages, setNumPages] = useState(0)
  const [outline, setOutline] = useState<ReaderTocItem[]>([])
  const [textByPage, setTextByPage] = useState<Record<number, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selection, setSelection] = useState<ReaderSelection | null>(null)
  const capabilities = useMemo(
    () => ({
      ...defaultReaderCapabilities,
      textSelection: true,
      translation: true,
      annotations: true,
      aiContext: true,
      toc: outline.length > 0,
      search: true,
      paginatedNavigation: true,
      continuousScroll: true,
      extractVisibleText: true,
    }),
    [outline.length],
  )
  const resolvedPreferences = useMemo(
    () => resolveReaderPreferences({ systemDefaults: defaultReaderPreferences }, preferences),
    [preferences],
  )
  const documentFile = useMemo(() => sourceToFile(source), [source])
  const documentOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    [],
  )
  const activeUnit = useMemo(
    () => ({
      id: `page-${pageNumber}`,
      title: `第 ${pageNumber} 页`,
      text: textByPage[pageNumber] ?? '',
      locator: { kind: 'page' as const, page: pageNumber },
    }),
    [pageNumber, textByPage],
  )
  const visibleContent = useMemo(
    () =>
      textByPage[pageNumber]
        ? [{ id: `page-${pageNumber}`, text: textByPage[pageNumber], locator: { kind: 'page' as const, page: pageNumber } }]
        : [],
    [pageNumber, textByPage],
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

  const searchResults = useMemo<ReaderSearchResult[]>(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    return Object.entries(textByPage)
      .filter(([, text]) => text.toLowerCase().includes(query))
      .map(([page, text]) => {
        const lower = text.toLowerCase()
        const matchIndex = lower.indexOf(query)
        const start = Math.max(0, matchIndex - 48)
        const end = Math.min(text.length, matchIndex + query.length + 48)

        return {
          id: `page-${page}`,
          text: text.slice(matchIndex, matchIndex + query.length),
          locator: { kind: 'page', page: Number(page) },
          contextBefore: text.slice(start, matchIndex).trim(),
          contextAfter: text.slice(matchIndex + query.length, end).trim(),
        }
      })
  }, [searchQuery, textByPage])

  const syncSelection = useCallback(() => {
    window.requestAnimationFrame(() => {
      setSelection(
        getScopedSelection({
          root: contentRef.current,
          buildRange: (text) => ({
            start: { kind: 'page', page: pageNumber },
            quote: { exact: text },
          }),
        }),
      )
    })
  }, [pageNumber])

  const handleDocumentLoadSuccess = useCallback(async (pdf: any) => {
    const loadTaskId = ++loadTaskIdRef.current

    try {
      setNumPages(pdf.numPages)

      const rawOutline = await pdf.getOutline()
      if (loadTaskId !== loadTaskIdRef.current) return
      setOutline(flattenOutline(rawOutline))

      const pageTexts = await Promise.all(
        Array.from({ length: pdf.numPages }, async (_, index) => {
          const page = await pdf.getPage(index + 1)
          const textContent = await page.getTextContent()
          const text = textContent.items
            .map((item: any) => item.str ?? '')
            .filter(Boolean)
            .join(' ')
          return [index + 1, text] as const
        }),
      )

      if (loadTaskId !== loadTaskIdRef.current) return
      setTextByPage(Object.fromEntries(pageTexts))
    } catch (error) {
      if (loadTaskId !== loadTaskIdRef.current || isPdfTransportDestroyedError(error)) {
        return
      }

      throw error
    }
  }, [])

  useEffect(
    () => () => {
      loadTaskIdRef.current += 1
    },
    [],
  )

  useEffect(() => {
    document.addEventListener('pointerup', syncSelection)
    document.addEventListener('keyup', syncSelection)
    return () => {
      document.removeEventListener('pointerup', syncSelection)
      document.removeEventListener('keyup', syncSelection)
    }
  }, [syncSelection])

  useEffect(() => {
    onPageChange?.(pageNumber)
    onProgressChange?.({
      documentId: identity.documentId,
      locator: { kind: 'page', page: pageNumber },
      progress: numPages > 0 ? pageNumber / numPages : 0,
      lastReadAt: new Date().toISOString(),
    })
    onSessionSnapshotChange?.({
      document: identity,
      location: { kind: 'page', page: pageNumber },
      progress: numPages > 0 ? pageNumber / numPages : 0,
      selection: selection ?? undefined,
      activeTocItemId: `page-${pageNumber}`,
      visibleContent,
      annotationsCount: runtime.annotations.length,
    } satisfies ReaderSessionSnapshot)
    runtime.updateSessionSnapshot({
      document: identity,
      location: { kind: 'page', page: pageNumber },
      progress: numPages > 0 ? pageNumber / numPages : 0,
      selection: selection ?? undefined,
      activeTocItemId: `page-${pageNumber}`,
      visibleContent,
      annotationsCount: runtime.annotations.length,
    } satisfies ReaderSessionSnapshot)
  }, [
    identity,
    numPages,
    onPageChange,
    onProgressChange,
    onSessionSnapshotChange,
    pageNumber,
    runtime.annotations.length,
    runtime.updateSessionSnapshot,
    selection,
    visibleContent,
  ])

  useEffect(() => {
    renderReaderQuoteHighlights(contentRef.current, runtime.annotations)
  }, [pageNumber, runtime.annotations, textByPage])

  const handleTextLayerRenderSuccess = useCallback(() => {
    renderReaderQuoteHighlights(contentRef.current, runtime.annotations)
  }, [runtime.annotations])

  const documentContent = useMemo(
    () => (
      <div ref={contentRef} className="flex justify-center p-6" style={{ gap: 'var(--reader-page-gap)' }}>
        <Document
          file={documentFile}
          options={documentOptions}
          onLoadSuccess={handleDocumentLoadSuccess}
        >
          <Page
            pageNumber={pageNumber}
            width={900}
            onRenderTextLayerSuccess={handleTextLayerRenderSuccess}
          />
        </Document>
      </div>
    ),
    [documentFile, documentOptions, handleDocumentLoadSuccess, handleTextLayerRenderSuccess, pageNumber],
  )

  return (
    <DocumentShell
      title={identity.title}
      subtitle="PDF Reader"
      capabilities={capabilities}
      preferenceCapabilities={{
        ...defaultReaderPreferenceCapabilities,
        typography: {
          fontFamily: false,
          fontSize: false,
          lineHeight: false,
          letterSpacing: false,
          paragraphSpacing: false,
          contentWidth: true,
          textAlign: false,
        },
      }}
      preferences={preferences}
      onPreferencesChange={onPreferencesChange}
      toc={outline}
      activeTocId={`page-${pageNumber}`}
      onTocSelect={(item) => {
        if (item.locator.kind === 'page') {
          setPageNumber(item.locator.page)
        }
      }}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      searchResults={searchResults}
      onSearchResultSelect={(item) => {
        if (item.locator.kind === 'page') {
          setPageNumber(item.locator.page)
        }
      }}
      onPrev={pageNumber > 1 ? () => setPageNumber((current) => current - 1) : undefined}
      onNext={pageNumber < numPages ? () => setPageNumber((current) => current + 1) : undefined}
      footerInfo={
        <div className="flex items-center justify-between">
          <span>
            第 {pageNumber} / {numPages || '—'} 页
          </span>
          <span>{identity.language ? `语言: ${identity.language}` : null}</span>
        </div>
      }
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
      content={documentContent}
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
            if (annotation.range.start.kind === 'page') {
              setPageNumber(annotation.range.start.page)
            }
          }}
          onUpdateAnnotationBody={runtime.updateAnnotationBody}
          onDeleteAnnotation={runtime.deleteAnnotation}
        />
      }
    />
  )
}
