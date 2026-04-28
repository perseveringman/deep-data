'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ReaderAnalysisContext } from '@/components/reader-platform/analysis'
import type {
  ReaderAnnotation,
  ReaderHighlightColor,
} from '@/components/reader-platform/annotations'
import type { ReaderSelection } from '@/components/reader-platform/core'
import {
  buildSelectionAiPreview,
  buildSelectionOverlayKey,
  hasTextSelection,
  type SelectionAiPreview,
  type SelectionOverlayMode,
} from '@/components/reader-platform/selection-overlay'
import type { TranslationResponse } from '@/components/reader-platform/translation'

import type { ReaderWorkspaceSection } from '../ui/reader-workspace-ids'

const DEFAULT_STICKY_MS = 240
const DEFAULT_HIGHLIGHT_COLOR: ReaderHighlightColor = 'yellow'

interface UseSelectionOverlayStateOptions {
  enabled: boolean
  selection?: ReaderSelection | null
  analysisContext?: ReaderAnalysisContext | null
  canTranslate: boolean
  requestSelectionTranslation: () => Promise<TranslationResponse>
  createHighlight: (color?: ReaderHighlightColor) => ReaderAnnotation
  updateNoteBody: (annotationId: string, bodyMarkdown: string) => void
  updateHighlightColor: (annotationId: string, color: ReaderHighlightColor) => void
  onOpenSidebarSection?: (section: ReaderWorkspaceSection) => void
  stickyMs?: number
}

export function useSelectionOverlayState({
  enabled,
  selection,
  analysisContext,
  canTranslate,
  requestSelectionTranslation,
  createHighlight,
  updateNoteBody,
  updateHighlightColor,
  onOpenSidebarSection,
  stickyMs = DEFAULT_STICKY_MS,
}: UseSelectionOverlayStateOptions) {
  const [mode, setMode] = useState<SelectionOverlayMode>('closed')
  const [stickySelection, setStickySelection] = useState<ReaderSelection | null>(null)
  const [stickyOpen, setStickyOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [isTranslationPending, setIsTranslationPending] = useState(false)
  const [translationPreview, setTranslationPreview] = useState<TranslationResponse | null>(null)
  const [noteAnnotation, setNoteAnnotation] = useState<ReaderAnnotation | null>(null)
  const [noteColor, setNoteColor] = useState<ReaderHighlightColor>(DEFAULT_HIGHLIGHT_COLOR)

  const closeTimerRef = useRef<number | null>(null)
  const lastSelectionKeyRef = useRef<string | null>(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const resetEphemeralState = useCallback(() => {
    setActionError(null)
    setIsTranslationPending(false)
    setTranslationPreview(null)
    setNoteDraft('')
    setNoteAnnotation(null)
    setNoteColor(DEFAULT_HIGHLIGHT_COLOR)
  }, [])

  const dismiss = useCallback(() => {
    clearCloseTimer()
    setStickyOpen(false)
    setStickySelection(null)
    setMode('closed')
    resetEphemeralState()
    lastSelectionKeyRef.current = null
  }, [clearCloseTimer, resetEphemeralState])

  const scheduleDismiss = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setStickyOpen(false)
      setStickySelection(null)
      setMode('closed')
      resetEphemeralState()
      lastSelectionKeyRef.current = null
    }, stickyMs)
  }, [clearCloseTimer, resetEphemeralState, stickyMs])

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

  const selectionKey = useMemo(() => buildSelectionOverlayKey(selection), [selection])
  const hasSelection = hasTextSelection(selection)
  const isExpanded = mode !== 'closed' && mode !== 'actions'
  const persistsWithoutSelection = mode === 'note' && Boolean(noteAnnotation)

  useEffect(() => {
    if (!enabled) {
      dismiss()
      return
    }

    if (hasSelection && selection) {
      clearCloseTimer()
      setStickySelection(selection)

      if (selectionKey !== lastSelectionKeyRef.current) {
        lastSelectionKeyRef.current = selectionKey
        setMode('actions')
        resetEphemeralState()
      } else {
        setMode((currentMode) => (currentMode === 'closed' ? 'actions' : currentMode))
      }
      return
    }

    if (persistsWithoutSelection) {
      clearCloseTimer()
      return
    }

    if (stickyOpen || isExpanded) {
      scheduleDismiss()
      return
    }

    dismiss()
  }, [
    clearCloseTimer,
    dismiss,
    enabled,
    hasSelection,
    isExpanded,
    noteAnnotation,
    mode,
    persistsWithoutSelection,
    resetEphemeralState,
    scheduleDismiss,
    selection,
    selectionKey,
    stickyOpen,
  ])

  const beginSticky = useCallback(() => {
    clearCloseTimer()
    setStickyOpen(true)
  }, [clearCloseTimer])

  const endSticky = useCallback(() => {
    setStickyOpen(false)
    if (!hasTextSelection(selection) && !persistsWithoutSelection) {
      scheduleDismiss()
    }
  }, [persistsWithoutSelection, scheduleDismiss, selection])

  const visibleSelection = selection ?? stickySelection
  const aiPreview = useMemo<SelectionAiPreview | null>(
    () => buildSelectionAiPreview(analysisContext),
    [analysisContext],
  )

  const openActions = useCallback(() => {
    setActionError(null)
    setMode('actions')
  }, [])

  const openTranslate = useCallback(async () => {
    if (!hasTextSelection(visibleSelection)) {
      setActionError('请先选择文本。')
      return
    }

    if (!canTranslate) {
      setActionError('未配置 translation executor。')
      setMode('translate')
      return
    }

    setMode('translate')
    setActionError(null)
    setIsTranslationPending(true)
    setTranslationPreview(null)
    try {
      const response = await requestSelectionTranslation()
      setTranslationPreview(response)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Translation execution failed',
      )
    } finally {
      setIsTranslationPending(false)
    }
  }, [canTranslate, requestSelectionTranslation, visibleSelection])

  const openAi = useCallback(() => {
    setActionError(null)
    setMode('ai')
  }, [])

  const openNoteComposer = useCallback(() => {
    if (!hasTextSelection(visibleSelection)) {
      setActionError('请先选择文本。')
      return
    }

    setActionError(null)
    if (noteAnnotation) {
      setMode('note')
      return
    }

    try {
      const annotation = createHighlight(DEFAULT_HIGHLIGHT_COLOR)
      setNoteAnnotation(annotation)
      setNoteColor(annotation.color)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Highlight creation failed')
      return
    }

    setMode('note')
  }, [createHighlight, noteAnnotation, visibleSelection])

  const setNoteHighlightColor = useCallback(
    (color: ReaderHighlightColor) => {
      if (!noteAnnotation) {
        setActionError('请先创建当前选区的高亮。')
        return
      }

      setActionError(null)
      setNoteColor(color)
      setNoteAnnotation((current) =>
        current ? { ...current, color } : current,
      )
      updateHighlightColor(noteAnnotation.id, color)
    },
    [noteAnnotation, updateHighlightColor],
  )

  const saveNote = useCallback(() => {
    const nextBody = noteDraft.trim()
    if (!noteAnnotation) {
      setActionError('请先创建当前选区的高亮。')
      return
    }

    setActionError(null)

    try {
      if (nextBody) {
        updateNoteBody(noteAnnotation.id, nextBody)
      }
      setNoteDraft('')
      dismiss()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Note creation failed')
    }
  }, [dismiss, noteAnnotation, noteDraft, updateNoteBody])

  const openSidebar = useCallback(
    (section: ReaderWorkspaceSection) => {
      onOpenSidebarSection?.(section)
    },
    [onOpenSidebarSection],
  )

  const translateDisabledReason = useMemo(() => {
    if (!canTranslate) return '未配置 translation executor。'
    if (!hasTextSelection(visibleSelection)) return '请先选择文本。'
    return null
  }, [canTranslate, visibleSelection])

  const aiDisabledReason = useMemo(() => {
    if (!hasTextSelection(visibleSelection)) return '请先选择文本。'
    if (!aiPreview) return '当前选区的 AI 上下文尚未准备好。'
    return null
  }, [aiPreview, visibleSelection])

  return {
    mode,
    selection: visibleSelection,
    noteDraft,
    setNoteDraft,
    actionError,
    isTranslationPending,
    translationPreview,
    noteColor,
    aiPreview,
    isVisible: enabled && hasTextSelection(visibleSelection) && mode !== 'closed',
    translateDisabledReason,
    aiDisabledReason,
    beginSticky,
    endSticky,
    dismiss,
    openActions,
    openTranslate,
    openAi,
    openNoteComposer,
    setNoteHighlightColor,
    saveNote,
    openSidebar,
  }
}
