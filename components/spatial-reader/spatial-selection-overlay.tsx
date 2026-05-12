'use client'

import { useEffect, useMemo } from 'react'

import type { ReaderSelection } from '@/components/reader-platform/core'

import { ThoughtActionBar } from './thought-action-bar'
import type { ThoughtActionDefinition, ThoughtSourceSelection } from './thought-graph'
import { buildSourceSelectionFromReaderSelection } from './thought-graph'

function getOverlayPosition(selection: ThoughtSourceSelection | null) {
  const rect = selection?.anchorRect
  if (!rect) return null

  const top = rect.top > 80 ? rect.top - 12 : rect.bottom + 12
  return {
    left: rect.left + rect.width / 2,
    top,
    transform: rect.top > 80 ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
  }
}

export function SpatialSelectionOverlay({
  selection,
  actions,
  onRunAction,
  onRunAll,
  onCreateNote,
  onDismiss,
}: {
  selection: ReaderSelection | null
  actions: ThoughtActionDefinition[]
  onRunAction: (selection: ThoughtSourceSelection, action: ThoughtActionDefinition) => void
  onRunAll: (selection: ThoughtSourceSelection) => void
  onCreateNote: (selection: ThoughtSourceSelection) => void
  onDismiss: () => void
}) {
  const sourceSelection = useMemo(
    () => (selection ? buildSourceSelectionFromReaderSelection(selection) : null),
    [selection],
  )
  const position = getOverlayPosition(sourceSelection)

  useEffect(() => {
    if (!sourceSelection) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onDismiss()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss, sourceSelection])

  if (!sourceSelection || !position) return null

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.left,
        top: position.top,
        transform: position.transform,
      }}
    >
      <ThoughtActionBar
        actions={actions}
        onRunAction={(action) => onRunAction(sourceSelection, action)}
        onRunAll={() => onRunAll(sourceSelection)}
        onCreateNote={() => onCreateNote(sourceSelection)}
      />
    </div>
  )
}

