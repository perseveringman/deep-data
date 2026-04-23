'use client'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import { useEffect, useMemo, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import { DocumentShell } from '@/components/document-reader/shared'
import type {
  ReaderDocumentIdentity,
  ReaderPersistenceEvents,
  ReaderPreferences,
  ReaderPreferencesPatch,
  ReaderPreferencesChangeEvent,
  ReaderSearchResult,
  ReaderSessionSnapshot,
  ReaderTocItem,
} from '@/components/reader-platform'
import { defaultReaderCapabilities, defaultReaderPreferenceCapabilities } from '@/components/reader-platform'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

type PdfReaderSource =
  | { url: string }
  | { file: File }
  | { data: Uint8Array }

export interface PdfReaderProps extends ReaderPersistenceEvents {
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
}: PdfReaderProps) {
  const [pageNumber, setPageNumber] = useState(initialPage)
  const [numPages, setNumPages] = useState(0)
  const [outline, setOutline] = useState<ReaderTocItem[]>([])
  const [textByPage, setTextByPage] = useState<Record<number, string>>({})
  const [searchQuery, setSearchQuery] = useState('')

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
      activeTocItemId: `page-${pageNumber}`,
      visibleContent: textByPage[pageNumber]
        ? [{ id: `page-${pageNumber}`, text: textByPage[pageNumber], locator: { kind: 'page', page: pageNumber } }]
        : [],
    } satisfies ReaderSessionSnapshot)
  }, [identity, numPages, onPageChange, onProgressChange, onSessionSnapshotChange, pageNumber, textByPage])

  return (
    <DocumentShell
      title={identity.title}
      subtitle="PDF Reader"
      capabilities={{
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
      }}
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
      content={
        <div className="flex justify-center p-6" style={{ gap: 'var(--reader-page-gap)' }}>
          <Document
            file={sourceToFile(source)}
            options={{
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
            }}
            onLoadSuccess={async (pdf) => {
              setNumPages(pdf.numPages)
              const rawOutline = await pdf.getOutline()
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

              setTextByPage(Object.fromEntries(pageTexts))
            }}
          >
            <Page pageNumber={pageNumber} width={900} />
          </Document>
        </div>
      }
      rightSidebarExtra={
        <div className="space-y-3">
          <div className="rounded border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">当前页</p>
            <p className="text-sm">第 {pageNumber} 页</p>
          </div>

          {textByPage[pageNumber] ? (
            <div className="rounded border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">页面文本预览</p>
              <p className="line-clamp-6 text-sm text-muted-foreground">{textByPage[pageNumber]}</p>
            </div>
          ) : null}
        </div>
      }
    />
  )
}
