'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

import type { ReaderAnalysisContext } from '@/components/reader-platform/analysis'
import type {
  ReaderAnnotation,
  ReaderHighlightColor,
} from '@/components/reader-platform/annotations'
import type { ReaderCapabilities, ReaderSelection } from '@/components/reader-platform/core'
import { useSelectionOverlayState } from '@/components/reader-platform/hooks'
import { resolveSelectionOverlayPlacement } from '@/components/reader-platform/selection-overlay'
import type { TranslationResponse } from '@/components/reader-platform/translation'

import {
  getReaderWorkspaceRootId,
  getReaderWorkspaceSectionId,
  type ReaderWorkspaceSection,
} from './reader-workspace-ids'
import { SelectionActionBar } from './selection-action-bar'
import { SelectionPreviewCard } from './selection-preview-card'

function isEditableTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null
  if (!element) return false
  if (element.isContentEditable) return true
  const tagName = element.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
}

interface ReaderSelectionOverlayHostProps {
  surfaceRef: RefObject<HTMLElement | null>
  selection?: ReaderSelection | null
  capabilities: ReaderCapabilities
  analysisContext?: ReaderAnalysisContext | null
  selectionMenuEnabled?: boolean
  reduceMotion?: boolean
  canTranslate: boolean
  requestSelectionTranslation: () => Promise<TranslationResponse>
  createHighlight: (color?: ReaderHighlightColor) => ReaderAnnotation
  updateNoteBody: (annotationId: string, bodyMarkdown: string) => void
  updateHighlightColor: (annotationId: string, color: ReaderHighlightColor) => void
  workspacePanelIdPrefix: string
}

export function ReaderSelectionOverlayHost({
  surfaceRef,
  selection,
  capabilities,
  analysisContext,
  selectionMenuEnabled = true,
  reduceMotion = false,
  canTranslate,
  requestSelectionTranslation,
  createHighlight,
  updateNoteBody,
  updateHighlightColor,
  workspacePanelIdPrefix,
}: ReaderSelectionOverlayHostProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<{
    left: number
    top: number
    placement: 'top' | 'bottom'
  } | null>(null)

  const openSidebarSection = useCallback(
    (section: ReaderWorkspaceSection) => {
      const sectionElement = document.getElementById(
        getReaderWorkspaceSectionId(workspacePanelIdPrefix, section),
      )
      const rootElement = document.getElementById(
        getReaderWorkspaceRootId(workspacePanelIdPrefix),
      )
      const scrollTarget = sectionElement ?? rootElement
      if (!scrollTarget) return

      scrollTarget.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'nearest',
      })
      if (sectionElement instanceof HTMLElement) {
        sectionElement.focus({ preventScroll: true })
      }
    },
    [reduceMotion, workspacePanelIdPrefix],
  )

  const overlay = useSelectionOverlayState({
    enabled: selectionMenuEnabled && capabilities.textSelection,
    selection,
    analysisContext,
    canTranslate,
    requestSelectionTranslation,
    createHighlight,
    updateNoteBody,
    updateHighlightColor,
    onOpenSidebarSection: openSidebarSection,
  })
  const {
    actionError,
    aiDisabledReason,
    aiPreview,
    beginSticky,
    dismiss,
    endSticky,
    isTranslationPending,
    isVisible,
    mode,
    noteDraft,
    noteColor,
    openActions,
    openAi,
    openNoteComposer,
    openSidebar,
    openTranslate,
    saveNote,
    selection: overlaySelection,
    setNoteDraft,
    setNoteHighlightColor,
    translateDisabledReason,
    translationPreview,
  } = overlay

  const updatePlacement = useCallback(() => {
    const mountElement = mountRef.current
    const surfaceElement = surfaceRef.current
    const overlayElement = overlayRef.current

    if (!isVisible || !mountElement || !surfaceElement || !overlayElement) {
      setPlacement((current) => (current ? null : current))
      return
    }

    const anchorRect = overlaySelection?.anchorRect
    if (
      anchorRect &&
      (anchorRect.bottom < 0 ||
        anchorRect.top > window.innerHeight ||
        anchorRect.right < 0 ||
        anchorRect.left > window.innerWidth)
    ) {
      dismiss()
      return
    }

    const nextPlacement = resolveSelectionOverlayPlacement({
      anchorRect,
      mountRect: mountElement.getBoundingClientRect(),
      surfaceRect: surfaceElement.getBoundingClientRect(),
      overlayRect: {
        width: overlayElement.offsetWidth,
        height: overlayElement.offsetHeight,
      },
    })

    setPlacement((current) => {
      if (
        current &&
        current.left === nextPlacement.left &&
        current.top === nextPlacement.top &&
        current.placement === nextPlacement.placement
      ) {
        return current
      }

      return nextPlacement
    })
  }, [dismiss, isVisible, overlaySelection?.anchorRect, surfaceRef])

  useEffect(() => {
    updatePlacement()
  }, [updatePlacement])

  useEffect(() => {
    if (!isVisible) return

    const handleViewportChange = () => updatePlacement()

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [isVisible, updatePlacement])

  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dismiss()
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 't'
      ) {
        if (translateDisabledReason) return
        event.preventDefault()
        void openTranslate()
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 'a'
      ) {
        if (aiDisabledReason) return
        event.preventDefault()
        openAi()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [aiDisabledReason, dismiss, isVisible, openAi, openTranslate, translateDisabledReason])

  const currentMode = mode
  const isExpanded =
    currentMode === 'translate' ||
    currentMode === 'ai' ||
    currentMode === 'note'

  return (
    <div ref={mountRef} className="pointer-events-none absolute inset-0 z-30">
      {isVisible ? (
        <div
          ref={overlayRef}
          className="pointer-events-auto absolute"
          style={{
            left: placement?.left ?? 0,
            top: placement?.top ?? 0,
            visibility: placement ? 'visible' : 'hidden',
          }}
          onPointerEnter={beginSticky}
          onPointerLeave={endSticky}
        >
          {isExpanded ? (
            <SelectionPreviewCard
              mode={currentMode as 'translate' | 'ai' | 'note'}
              selectionText={overlaySelection?.text ?? ''}
              actionError={actionError}
              isTranslationPending={isTranslationPending}
              translationPreview={translationPreview}
              aiPreview={aiPreview}
              noteDraft={noteDraft}
              noteColor={noteColor}
              onNoteDraftChange={setNoteDraft}
              onNoteColorChange={setNoteHighlightColor}
              onSaveNote={saveNote}
              onBack={openActions}
              onDismiss={dismiss}
              onOpenSidebar={openSidebar}
              onStickyStart={beginSticky}
              onStickyEnd={endSticky}
            />
          ) : (
            <SelectionActionBar
              translateDisabledReason={translateDisabledReason}
              aiDisabledReason={aiDisabledReason}
              onTranslate={() => {
                void openTranslate()
              }}
              onAi={openAi}
              onNote={openNoteComposer}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
