'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createEmptyAnnotation,
  type ReaderAnnotation,
  type ReaderHighlightColor,
} from '@/components/reader-platform/annotations'
import type {
  ReaderActiveUnit,
  ReaderCapabilities,
  ReaderContentSlice,
  ReaderDocumentIdentity,
  ReaderRange,
  ReaderSessionSnapshot,
} from '@/components/reader-platform/core'
import type { ReaderPreferences } from '@/components/reader-platform/preferences'
import {
  buildReaderAnalysisContext,
  buildReaderTranslationRequest,
  type ReaderRuntimeProps,
} from '@/components/reader-platform/runtime'
import type { TranslationScope } from '@/components/reader-platform/translation'

import { useReaderSession } from './use-reader-session'
import { useReaderTranslation } from './use-reader-translation'

const EMPTY_ANNOTATIONS: ReaderAnnotation[] = []

interface UseReaderRuntimeOptions extends ReaderRuntimeProps {
  document: ReaderDocumentIdentity
  capabilities: ReaderCapabilities
  preferences?: ReaderPreferences
  activeUnit?: ReaderActiveUnit | null
  visibleContent?: ReaderContentSlice[]
}

export function useReaderRuntime({
  document,
  capabilities,
  preferences,
  activeUnit,
  visibleContent,
  initialAnnotations = EMPTY_ANNOTATIONS,
  translationExecutor,
  defaultProvider = 'llm',
  defaultTargetLang = 'zh-CN',
  onAnnotationChange,
  onAnalysisContextChange,
}: UseReaderRuntimeOptions) {
  const { snapshot, updateSnapshot } = useReaderSession()
  const {
    canTranslate,
    isTranslating,
    lastResponse,
    error,
    runTranslation,
  } = useReaderTranslation({ executor: translationExecutor })

  const [annotations, setAnnotations] = useState<ReaderAnnotation[]>(initialAnnotations)
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | undefined>(initialAnnotations[0]?.id)
  const [provider, setProvider] = useState(defaultProvider)
  const [targetLang, setTargetLang] = useState(defaultTargetLang)

  useEffect(() => {
    setAnnotations(initialAnnotations)
    setActiveAnnotationId(initialAnnotations[0]?.id)
  }, [initialAnnotations])

  const resolvedVisibleContent = useMemo(
    () => (visibleContent && visibleContent.length > 0 ? visibleContent : snapshot?.visibleContent ?? []),
    [snapshot?.visibleContent, visibleContent],
  )

  const analysisContext = useMemo(
    () =>
      snapshot
        ? buildReaderAnalysisContext({
            snapshot: {
              ...snapshot,
              annotationsCount: annotations.length,
            },
            activeUnit,
            visibleContent: resolvedVisibleContent,
            annotations,
            preferences,
            capabilities,
          })
        : null,
    [activeUnit, annotations, capabilities, preferences, resolvedVisibleContent, snapshot],
  )

  useEffect(() => {
    if (analysisContext) {
      onAnalysisContextChange?.(analysisContext)
    }
  }, [analysisContext, onAnalysisContextChange])

  const emitAnnotationChange = useCallback(
    (type: 'create' | 'update' | 'delete', annotation: ReaderAnnotation) => {
      onAnnotationChange?.({ type, annotation })
    },
    [onAnnotationChange],
  )

  const updateSessionSnapshot = useCallback(
    (nextSnapshot: ReaderSessionSnapshot) => {
      updateSnapshot({
        ...nextSnapshot,
        annotationsCount: annotations.length,
      })
    },
    [annotations.length, updateSnapshot],
  )

  const createAnnotation = useCallback(
    (
      range: ReaderRange,
      {
        color = 'yellow',
        bodyMarkdown,
        anchors,
        tags,
      }: {
        color?: ReaderHighlightColor
        bodyMarkdown?: string
        anchors?: Record<string, unknown>
        tags?: string[]
      } = {},
    ) => {
      const annotation: ReaderAnnotation = {
        ...createEmptyAnnotation(document, range, color),
        bodyMarkdown,
        anchors,
        tags,
      }

      setAnnotations((current) => [annotation, ...current])
      setActiveAnnotationId(annotation.id)
      emitAnnotationChange('create', annotation)

      return annotation
    },
    [document, emitAnnotationChange],
  )

  const createAnnotationFromSelection = useCallback(
    (
      options:
        | ReaderHighlightColor
        | {
            color?: ReaderHighlightColor
            bodyMarkdown?: string
            anchors?: Record<string, unknown>
            tags?: string[]
          } = 'yellow',
    ) => {
      if (!snapshot?.selection) {
        throw new Error('Creating an annotation requires a current text selection')
      }

      const normalizedOptions =
        typeof options === 'string'
          ? { color: options }
          : options

      return createAnnotation(snapshot.selection.range, normalizedOptions)
    },
    [createAnnotation, snapshot?.selection],
  )

  const updateAnnotationBody = useCallback(
    (annotationId: string, bodyMarkdown: string) => {
      setAnnotations((current) =>
        current.map((annotation) => {
          if (annotation.id !== annotationId) return annotation

          const nextAnnotation: ReaderAnnotation = {
            ...annotation,
            bodyMarkdown,
            updatedAt: new Date().toISOString(),
          }

          emitAnnotationChange('update', nextAnnotation)
          return nextAnnotation
        }),
      )
    },
    [emitAnnotationChange],
  )

  const updateAnnotationColor = useCallback(
    (annotationId: string, color: ReaderHighlightColor) => {
      setAnnotations((current) =>
        current.map((annotation) => {
          if (annotation.id !== annotationId || annotation.color === color) {
            return annotation
          }

          const nextAnnotation: ReaderAnnotation = {
            ...annotation,
            color,
            updatedAt: new Date().toISOString(),
          }

          emitAnnotationChange('update', nextAnnotation)
          return nextAnnotation
        }),
      )
    },
    [emitAnnotationChange],
  )

  const deleteAnnotation = useCallback(
    (annotationId: string) => {
      setAnnotations((current) => {
        const target = current.find((annotation) => annotation.id === annotationId)
        if (!target) return current

        emitAnnotationChange('delete', target)
        return current.filter((annotation) => annotation.id !== annotationId)
      })

      setActiveAnnotationId((current) => (current === annotationId ? undefined : current))
    },
    [emitAnnotationChange],
  )

  const requestTranslation = useCallback(
    async (scope: TranslationScope) => {
      if (!snapshot) {
        throw new Error('Translation requires a reader session snapshot')
      }

      return runTranslation(
        buildReaderTranslationRequest({
          provider,
          targetLang,
          scope,
          snapshot: {
            ...snapshot,
            annotationsCount: annotations.length,
          },
          activeUnit,
          visibleContent: resolvedVisibleContent,
          sourceLang: document.language,
        }),
      )
    },
    [
      activeUnit,
      annotations.length,
      document.language,
      provider,
      resolvedVisibleContent,
      runTranslation,
      snapshot,
      targetLang,
    ],
  )

  return {
    snapshot,
    updateSessionSnapshot,
    annotations,
    activeAnnotationId,
    selectAnnotation: setActiveAnnotationId,
    createAnnotation,
    createAnnotationFromSelection,
    updateAnnotationBody,
    updateAnnotationColor,
    deleteAnnotation,
    analysisContext,
    translation: {
      provider,
      setProvider,
      targetLang,
      setTargetLang,
      canTranslate,
      isTranslating,
      lastResponse,
      error,
      requestTranslation,
    },
  }
}
