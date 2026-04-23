'use client'

import ePub from 'epubjs'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { DocumentShell } from '@/components/document-reader/shared'
import type {
  ReaderDocumentIdentity,
  ReaderPersistenceEvents,
  ReaderPreferencesPatch,
  ReaderPreferencesChangeEvent,
  ReaderRuntimeProps,
  ReaderSelection,
  ReaderSessionSnapshot,
  ReaderTocItem,
} from '@/components/reader-platform'
import {
  defaultReaderCapabilities,
  defaultReaderPreferenceCapabilities,
  clearStoredReaderLocator,
  getReaderPreferenceCssVariables,
  getRangeAnchorRect,
  offsetSelectionAnchorRect,
  readStoredReaderLocator,
  ReaderSelectionOverlayHost,
  ReaderWorkspacePanel,
  useManagedReaderPreferences,
  useReaderRuntime,
  writeStoredReaderLocator,
} from '@/components/reader-platform'

type EpubReaderSource =
  | { url: string }
  | { file: File }
  | { arrayBuffer: ArrayBuffer }

export interface EpubReaderProps extends ReaderPersistenceEvents, ReaderRuntimeProps {
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
  translationExecutor,
  defaultProvider,
  defaultTargetLang,
  translationDisplayMode,
  initialAnnotations,
  onAnnotationChange,
  onAnalysisContextChange,
}: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<any>(null)
  const objectUrlRef = useRef<string | null>(null)
  const renderedAnnotationCfisRef = useRef<string[]>([])
  const workspacePanelId = useId().replace(/:/g, '')

  const [toc, setToc] = useState<ReaderTocItem[]>([])
  const [location, setLocation] = useState<string>(initialLocation ?? '')
  const [restoredLocation, setRestoredLocation] = useState<string | null>(null)
  const [bookTitle, setBookTitle] = useState<string | undefined>(identity.title)
  const [selection, setSelection] = useState<ReaderSelection | null>(null)
  const [visibleText, setVisibleText] = useState('')
  const managedPreferences = useManagedReaderPreferences({
    identity,
    basePreferences: preferences,
    onPreferencesChange,
  })
  const resolvedPreferences = managedPreferences.preferences
  const effectiveMode = resolvedPreferences.behavior.scrollMode === 'scrolled' ? 'scrolled' : mode
  const capabilities = useMemo(
    () => ({
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
    }),
    [toc.length],
  )
  const activeUnit = useMemo(
    () => ({
      id: location || 'epub-current',
      title: '当前位置',
      text: visibleText,
      locator: { kind: 'cfi' as const, cfi: location || initialLocation || '' },
    }),
    [initialLocation, location, visibleText],
  )
  const visibleContent = useMemo(
    () =>
      visibleText
        ? [{ id: location || 'epub-visible', text: visibleText, locator: { kind: 'cfi' as const, cfi: location || initialLocation || '' } }]
        : [],
    [initialLocation, location, visibleText],
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

  const cssVars = useMemo(() => {
    return getReaderPreferenceCssVariables(resolvedPreferences)
  }, [resolvedPreferences])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (resolvedPreferences.behavior.rememberLastLocation === false) {
      clearStoredReaderLocator(window.localStorage, identity)
      setRestoredLocation(null)
      return
    }

    const locator = readStoredReaderLocator(window.localStorage, identity)
    setRestoredLocation(locator?.kind === 'cfi' ? locator.cfi : null)
  }, [identity, resolvedPreferences.behavior.rememberLastLocation])

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
        manager: effectiveMode === 'scrolled' ? 'continuous' : 'default',
        flow: effectiveMode === 'scrolled' ? 'scrolled' : 'paginated',
        allowScriptedContent: false,
      })
      renditionRef.current = rendition

      rendition.on('relocated', (event: any) => {
        if (cancelled) return
        const cfi = event?.start?.cfi ?? ''
        const contents = rendition.getContents?.() ?? []
        const nextVisibleText = contents
          .map((content: any) => content?.document?.body?.innerText ?? '')
          .filter(Boolean)
          .join('\n\n')
          .trim()

        setLocation(cfi)
        setVisibleText(nextVisibleText)
        onLocationChange?.(cfi)
        onProgressChange?.({
          documentId: identity.documentId,
          locator: { kind: 'cfi', cfi },
          lastReadAt: new Date().toISOString(),
        })
      })

      rendition.on('selected', (cfiRange: string, contents: any) => {
        const scopedSelection = contents?.window?.getSelection?.()
        const selectedRange =
          scopedSelection && scopedSelection.rangeCount > 0
            ? scopedSelection.getRangeAt(0)
            : null
        const text = scopedSelection?.toString?.() ?? ''
        const frameElement = contents?.document?.defaultView?.frameElement
        const frameRect =
          frameElement instanceof Element ? frameElement.getBoundingClientRect() : null
        const baseAnchorRect = selectedRange ? getRangeAnchorRect(selectedRange) : undefined
        const anchorRect =
          baseAnchorRect && frameRect
            ? offsetSelectionAnchorRect(baseAnchorRect, {
                top: frameRect.top,
                left: frameRect.left,
              })
            : baseAnchorRect
        setSelection(
          text
            ? {
                text,
                anchorRect,
                range: { start: { kind: 'cfi', cfi: cfiRange }, quote: { exact: text } },
              }
            : null,
        )
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

      await rendition.display(restoredLocation || initialLocation || undefined)
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
  }, [
    identity,
    initialLocation,
    effectiveMode,
    onLocationChange,
    onProgressChange,
    restoredLocation,
    source,
  ])

  useEffect(() => {
    const rendition = renditionRef.current
    if (!rendition?.themes) return

    rendition.themes.default({
      body: {
        color:
          resolvedPreferences.theme.mode === 'dark'
            ? '#f1f5f9'
            : resolvedPreferences.theme.mode === 'sepia'
              ? '#4b3621'
              : '#111827',
        background:
          resolvedPreferences.theme.mode === 'dark'
            ? '#111827'
            : resolvedPreferences.theme.mode === 'sepia'
              ? '#f4ecd8'
              : '#ffffff',
        'font-size': `${resolvedPreferences.typography.fontSize ?? 16}px`,
        'line-height': `${resolvedPreferences.typography.lineHeight ?? 1.7}`,
        'font-family': resolvedPreferences.typography.fontFamily ?? 'serif',
        'letter-spacing': `${resolvedPreferences.typography.letterSpacing ?? 0}px`,
        'text-align': resolvedPreferences.typography.textAlign ?? 'start',
      },
      p: {
        'margin-bottom': `${resolvedPreferences.typography.paragraphSpacing ?? 1}rem`,
      },
      a: {
        color: resolvedPreferences.theme.accentColor ?? '#111827',
      },
    })
    rendition.themes.select('default')
  }, [resolvedPreferences])

  useEffect(() => {
    const snapshot = {
      document: identity,
      location: { kind: 'cfi' as const, cfi: location || initialLocation || '' },
      selection: selection ?? undefined,
      visibleContent,
      annotationsCount: runtime.annotations.length,
    } satisfies ReaderSessionSnapshot

    onSessionSnapshotChange?.(snapshot)
    runtime.updateSessionSnapshot(snapshot)

    if (typeof window === 'undefined' || !location) return

    if (
      resolvedPreferences.behavior.autoSaveProgress !== false &&
      resolvedPreferences.behavior.rememberLastLocation !== false
    ) {
      writeStoredReaderLocator(window.localStorage, identity, {
        kind: 'cfi',
        cfi: location,
      })
      return
    }

    clearStoredReaderLocator(window.localStorage, identity)
  }, [
    identity,
    initialLocation,
    location,
    onSessionSnapshotChange,
    resolvedPreferences.behavior.autoSaveProgress,
    resolvedPreferences.behavior.rememberLastLocation,
    runtime.annotations.length,
    runtime.updateSessionSnapshot,
    selection,
    visibleContent,
  ])

  useEffect(() => {
    const rendition = renditionRef.current
    if (!rendition?.annotations) return

    renderedAnnotationCfisRef.current.forEach((cfi) => {
      rendition.annotations.remove?.(cfi, 'highlight')
    })

    const nextRendered = runtime.annotations
      .map((annotation) =>
        annotation.range.start.kind === 'cfi' ? annotation.range.start.cfi : null,
      )
      .filter((cfi): cfi is string => Boolean(cfi))

    nextRendered.forEach((cfi) => {
      rendition.annotations.add('highlight', cfi, {}, undefined, 'reader-selection-highlight')
    })

    renderedAnnotationCfisRef.current = nextRendered
  }, [runtime.annotations])

  return (
    <DocumentShell
      title={bookTitle}
      subtitle="EPUB Reader"
      capabilities={capabilities}
      preferenceCapabilities={defaultReaderPreferenceCapabilities}
      preferences={managedPreferences.preferencePatch}
      onPreferencesChange={managedPreferences.updatePreferences}
      onPreferencesReset={managedPreferences.resetPreferences}
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
      contentOverlay={
        <ReaderSelectionOverlayHost
          surfaceRef={containerRef}
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
        <div className="h-[calc(100vh-180px)] p-4" style={cssVars}>
          <div ref={containerRef} className="h-full w-full overflow-hidden rounded border bg-background" />
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
            if (annotation.range.start.kind === 'cfi') {
              void renditionRef.current?.display(annotation.range.start.cfi)
            }
          }}
          onUpdateAnnotationBody={runtime.updateAnnotationBody}
          onDeleteAnnotation={runtime.deleteAnnotation}
        />
      }
    />
  )
}
