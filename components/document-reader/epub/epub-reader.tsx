'use client'

import ePub from 'epubjs'
import { useEffect, useMemo, useRef, useState } from 'react'

import { DocumentShell } from '@/components/document-reader/shared'
import type {
  ReaderDocumentIdentity,
  ReaderPersistenceEvents,
  ReaderPreferences,
  ReaderPreferencesPatch,
  ReaderPreferencesChangeEvent,
  ReaderSessionSnapshot,
  ReaderTocItem,
} from '@/components/reader-platform'
import {
  defaultReaderCapabilities,
  defaultReaderPreferenceCapabilities,
  getReaderPreferenceCssVariables,
} from '@/components/reader-platform'

type EpubReaderSource =
  | { url: string }
  | { file: File }
  | { arrayBuffer: ArrayBuffer }

export interface EpubReaderProps extends ReaderPersistenceEvents {
  identity: ReaderDocumentIdentity
  source: EpubReaderSource
  initialLocation?: string
  mode?: 'paginated' | 'scrolled'
  preferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
  onLocationChange?: (cfi: string) => void
}

export function EpubReader({
  identity,
  source,
  initialLocation,
  mode = 'paginated',
  preferences,
  onPreferencesChange,
  onLocationChange,
  onProgressChange,
  onSessionSnapshotChange,
}: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<any>(null)
  const objectUrlRef = useRef<string | null>(null)
  const selectionTextRef = useRef('')

  const [toc, setToc] = useState<ReaderTocItem[]>([])
  const [location, setLocation] = useState<string>(initialLocation ?? '')
  const [bookTitle, setBookTitle] = useState<string | undefined>(identity.title)
  const [selectionText, setSelectionText] = useState<string>('')

  const cssVars = useMemo(() => {
    return getReaderPreferenceCssVariables({
      theme: { mode: 'system', accentColor: 'hsl(var(--primary))', surfaceStyle: 'paper', contrast: 'normal', ...(preferences?.theme ?? {}) },
      typography: { fontFamily: 'var(--font-sans, ui-sans-serif)', fontSize: 16, lineHeight: 1.7, letterSpacing: 0, paragraphSpacing: 1, contentWidth: 'medium', textAlign: 'start', ...(preferences?.typography ?? {}) },
      layout: { tocVisible: true, sidebarVisible: true, sidebarSide: 'left', pageGap: 16, density: 'comfortable', ...(preferences?.layout ?? {}) },
      behavior: { scrollMode: mode, autoSaveProgress: true, reduceMotion: false, selectionMenu: true, rememberLastLocation: true, ...(preferences?.behavior ?? {}) },
    })
  }, [mode, preferences])

  useEffect(() => {
    selectionTextRef.current = selectionText
  }, [selectionText])

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let book: any

    const mount = async () => {
      let input: string | ArrayBuffer

      if ('file' in source) {
        const objectUrl = URL.createObjectURL(source.file)
        objectUrlRef.current = objectUrl
        input = objectUrl
      } else if ('url' in source) {
        input = source.url
      } else {
        input = source.arrayBuffer
      }

      book = ePub(input as any)
      const rendition = book.renderTo(containerRef.current!, {
        width: '100%',
        height: '100%',
        manager: mode === 'scrolled' ? 'continuous' : 'default',
        flow: mode === 'scrolled' ? 'scrolled' : 'paginated',
        allowScriptedContent: false,
      })
      renditionRef.current = rendition

      rendition.on('relocated', (event: any) => {
        if (cancelled) return
        const cfi = event?.start?.cfi ?? ''
        setLocation(cfi)
        onLocationChange?.(cfi)
        onProgressChange?.({
          documentId: identity.documentId,
          locator: { kind: 'cfi', cfi },
          lastReadAt: new Date().toISOString(),
        })
        onSessionSnapshotChange?.({
          document: identity,
          location: { kind: 'cfi', cfi },
          selection: selectionTextRef.current
            ? {
                text: selectionTextRef.current,
                range: { start: { kind: 'cfi', cfi }, quote: { exact: selectionTextRef.current } },
              }
            : undefined,
        } satisfies ReaderSessionSnapshot)
      })

      rendition.on('selected', (cfiRange: string, contents: any) => {
        const text = contents?.window?.getSelection?.()?.toString?.() ?? ''
        setSelectionText(text)
        contents.window.getSelection()?.removeAllRanges?.()
        rendition.annotations.add('highlight', cfiRange, {}, undefined, 'reader-selection-highlight')
      })

      await book.ready

      const navigation = await book.loaded.navigation
      const metadata = await book.loaded.metadata

      setBookTitle(metadata?.title || identity.title)
      setToc(
        (navigation?.toc ?? []).map((item: any, index: number) => ({
          id: `${index}-${item.href}`,
          title: item.label,
          locator: { kind: 'cfi', cfi: item.href },
          children: (item.subitems ?? []).map((child: any, childIndex: number) => ({
            id: `${index}-${childIndex}-${child.href}`,
            title: child.label,
            locator: { kind: 'cfi', cfi: child.href },
          })),
        })),
      )

      rendition.themes.default({
        body: {
          color: 'var(--foreground)',
          background: 'transparent',
          'font-size': `${preferences?.typography?.fontSize ?? 16}px`,
          'line-height': `${preferences?.typography?.lineHeight ?? 1.7}`,
          'font-family': preferences?.typography?.fontFamily ?? 'serif',
          'letter-spacing': `${preferences?.typography?.letterSpacing ?? 0}px`,
          'text-align': preferences?.typography?.textAlign ?? 'start',
        },
        p: {
          'margin-bottom': `${preferences?.typography?.paragraphSpacing ?? 1}rem`,
        },
      })
      rendition.themes.select('default')

      await rendition.display(initialLocation || undefined)
    }

    void mount()

    return () => {
      cancelled = true
      renditionRef.current?.destroy?.()
      book?.destroy?.()
      renditionRef.current = null
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [identity, initialLocation, mode, onLocationChange, onProgressChange, onSessionSnapshotChange, preferences, source])

  return (
    <DocumentShell
      title={bookTitle}
      subtitle="EPUB Reader"
      capabilities={{
        ...defaultReaderCapabilities,
        textSelection: true,
        translation: true,
        annotations: true,
        aiContext: true,
        toc: toc.length > 0,
        search: false,
        paginatedNavigation: true,
        continuousScroll: true,
        extractVisibleText: true,
      }}
      preferenceCapabilities={defaultReaderPreferenceCapabilities}
      preferences={preferences}
      onPreferencesChange={onPreferencesChange}
      toc={toc}
      activeTocId={location}
      onTocSelect={(item) => {
        if (item.locator.kind === 'cfi') {
          void renditionRef.current?.display(item.locator.cfi)
        }
      }}
      onPrev={() => void renditionRef.current?.prev?.()}
      onNext={() => void renditionRef.current?.next?.()}
      footerInfo={<span>{location ? `位置: ${location}` : '位置加载中'}</span>}
      content={
        <div className="h-[calc(100vh-180px)] p-4" style={cssVars}>
          <div ref={containerRef} className="h-full w-full overflow-hidden rounded border bg-background" />
        </div>
      }
      rightSidebarExtra={
        <div className="space-y-3">
          <div className="rounded border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">当前定位</p>
            <p className="break-all text-sm">{location || '尚未定位'}</p>
          </div>
          {selectionText ? (
            <div className="rounded border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">最近选中文本</p>
              <p className="text-sm">{selectionText}</p>
            </div>
          ) : null}
        </div>
      }
    />
  )
}
