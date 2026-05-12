'use client'

import { useMemo, useState } from 'react'

import { ThoughtActionBar } from './thought-action-bar'
import { ThoughtConnectionLines } from './connection-lines'
import { ThoughtWindow } from './thought-window'
import type {
  ThoughtActionDefinition,
  ThoughtNode,
  ThoughtPoint,
  ThoughtSourceSelection,
} from './thought-graph'

function getFloatingBarPosition(selection: ThoughtSourceSelection | null) {
  const rect = selection?.anchorRect
  if (!rect) return null

  return {
    left: rect.left + rect.width / 2,
    top: rect.top > 72 ? rect.top - 10 : rect.bottom + 10,
    transform: rect.top > 72 ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
  }
}

export function ThoughtCanvas({
  nodes,
  actions,
  hidden,
  onMoveNode,
  onBringNodeToFront,
  onMinimizeNode,
  onCloseNode,
  onSendNodeToSidebar,
  onCreateChildNode,
  onCreateChildNodes,
}: {
  nodes: ThoughtNode[]
  actions: ThoughtActionDefinition[]
  hidden: boolean
  onMoveNode: (nodeId: string, position: ThoughtPoint) => void
  onBringNodeToFront: (nodeId: string) => void
  onMinimizeNode: (nodeId: string) => void
  onCloseNode: (nodeId: string) => void
  onSendNodeToSidebar: (nodeId: string) => void
  onCreateChildNode: (
    selection: ThoughtSourceSelection,
    action: ThoughtActionDefinition,
    sourceNode: ThoughtNode,
  ) => void
  onCreateChildNodes: (
    selection: ThoughtSourceSelection,
    sourceNode: ThoughtNode,
  ) => void
}) {
  const [windowSelection, setWindowSelection] = useState<{
    selection: ThoughtSourceSelection
    sourceNode: ThoughtNode
  } | null>(null)
  const openWindowNodes = useMemo(
    () =>
      nodes.filter(
        (node) => node.view.mode === 'window' && node.view.status === 'open',
      ),
    [nodes],
  )
  const actionBarPosition = getFloatingBarPosition(windowSelection?.selection ?? null)

  if (hidden) return null

  return (
    <>
      <ThoughtConnectionLines nodes={nodes} />
      <div className="pointer-events-none fixed inset-0 z-30">
        {openWindowNodes.map((node) => (
          <ThoughtWindow
            key={node.id}
            node={node}
            onBringToFront={onBringNodeToFront}
            onMove={onMoveNode}
            onMinimize={onMinimizeNode}
            onClose={onCloseNode}
            onSendToSidebar={onSendNodeToSidebar}
            onWindowSelection={(selection, sourceNode) =>
              setWindowSelection({ selection, sourceNode })
            }
          />
        ))}
      </div>

      {windowSelection && actionBarPosition ? (
        <div
          className="fixed z-[999]"
          style={{
            left: actionBarPosition.left,
            top: actionBarPosition.top,
            transform: actionBarPosition.transform,
          }}
        >
          <ThoughtActionBar
            actions={actions}
            compact
            onRunAction={(action) => {
              onCreateChildNode(windowSelection.selection, action, windowSelection.sourceNode)
              setWindowSelection(null)
              window.getSelection()?.removeAllRanges()
            }}
            onRunAll={() => {
              onCreateChildNodes(windowSelection.selection, windowSelection.sourceNode)
              setWindowSelection(null)
              window.getSelection()?.removeAllRanges()
            }}
          />
        </div>
      ) : null}
    </>
  )
}

