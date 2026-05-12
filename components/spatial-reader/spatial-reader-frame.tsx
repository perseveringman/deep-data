'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import type { ReaderAnalysisContext } from '@/components/reader-platform/analysis'
import type { ReaderDocumentIdentity } from '@/components/reader-platform/core'
import type { ReaderRuntimeProps } from '@/components/reader-platform/runtime'

import { defaultThoughtActions } from './actions'
import {
  clearStoredThoughtGraph,
  readStoredThoughtGraph,
  writeStoredThoughtGraph,
} from './persistence'
import { SpatialSelectionOverlay } from './spatial-selection-overlay'
import { ThoughtCanvas } from './thought-canvas'
import { ThoughtDock } from './thought-dock'
import { ThoughtSidebar } from './thought-sidebar'
import type {
  ThoughtActionDefinition,
  ThoughtActionExecutor,
  ThoughtNode,
  ThoughtNodeChange,
  ThoughtPoint,
  ThoughtSourceSelection,
} from './thought-graph'
import {
  getThoughtAnnotations,
  getThoughtHighlightElementId,
} from './thought-graph'
import { useThoughtGraph } from './use-thought-graph'

type SpatialRuntimeProps = Pick<
  ReaderRuntimeProps,
  'initialAnnotations' | 'onAnalysisContextChange'
>

export interface SpatialReaderFrameProps {
  identity: ReaderDocumentIdentity
  actions?: ThoughtActionDefinition[]
  actionExecutor?: ThoughtActionExecutor
  initialNodes?: ThoughtNode[]
  onThoughtNodeChange?: (change: ThoughtNodeChange) => void
  children: (runtimeProps: SpatialRuntimeProps) => ReactNode
}

function getCurrentSelectionAnchorRect() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return undefined

  const rect = selection.getRangeAt(0).getBoundingClientRect()
  if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) return undefined

  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function serializeComparableValue(value: unknown) {
  return JSON.stringify(value)
}

function decorateGlobalThoughtHighlights({
  nodes,
  onOpenNode,
}: {
  nodes: ThoughtNode[]
  onOpenNode: (nodeId: string) => void
}) {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const seen = new Set<string>()

  document.querySelectorAll<HTMLElement>('[data-reader-annotation-id]').forEach((element) => {
    const nodeId = element.dataset.readerAnnotationId
    if (!nodeId || !nodeIds.has(nodeId)) return

    element.dataset.readerThoughtId = nodeId
    element.classList.add('cursor-pointer', 'ring-1', 'ring-primary/20')
    element.title = '点击打开对应 ThoughtNode'
    if (!seen.has(nodeId)) {
      element.id = getThoughtHighlightElementId(nodeId)
      seen.add(nodeId)
    }
    element.onclick = (event) => {
      event.stopPropagation()
      onOpenNode(nodeId)
    }
  })
}

export function SpatialReaderFrame({
  identity,
  actions = defaultThoughtActions,
  actionExecutor,
  initialNodes,
  onThoughtNodeChange,
  children,
}: SpatialReaderFrameProps) {
  const [analysisContext, setAnalysisContext] = useState<ReaderAnalysisContext | null>(null)
  const [selection, setSelection] = useState<ThoughtSourceSelection | null>(null)
  const [canvasHidden, setCanvasHidden] = useState(false)
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const [storageReady, setStorageReady] = useState(Boolean(initialNodes))
  const analysisContextKeyRef = useRef<string | null>(null)
  const selectionKeyRef = useRef<string | null>(null)
  const graph = useThoughtGraph({
    identity,
    analysisContext,
    initialNodes,
    actionExecutor,
    onThoughtNodeChange,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || initialNodes) return

    try {
      const stored = readStoredThoughtGraph(window.localStorage, identity)
      if (stored) graph.replaceNodes(stored.nodes)
      setPersistenceError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setPersistenceError(`无法读取本地 ThoughtGraph：${message}`)
    } finally {
      setStorageReady(true)
    }
  }, [graph.replaceNodes, identity, initialNodes])

  useEffect(() => {
    if (typeof window === 'undefined' || initialNodes || !storageReady) return
    try {
      writeStoredThoughtGraph(window.localStorage, identity, graph.nodes)
      setPersistenceError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setPersistenceError(`无法保存本地 ThoughtGraph：${message}`)
    }
  }, [graph.nodes, identity, initialNodes, storageReady])

  useEffect(() => {
    decorateGlobalThoughtHighlights({
      nodes: graph.nodes,
      onOpenNode: (nodeId) => {
        graph.setNodeMode(nodeId, 'window')
        graph.bringNodeToFront(nodeId)
      },
    })
  }, [graph.bringNodeToFront, graph.nodes, graph.setNodeMode])

  const handleAnalysisContextChange = useCallback((context: ReaderAnalysisContext) => {
    const nextAnalysisContextKey = serializeComparableValue(context)
    if (analysisContextKeyRef.current !== nextAnalysisContextKey) {
      analysisContextKeyRef.current = nextAnalysisContextKey
      setAnalysisContext(context)
    }

    if (!context.selection) {
      if (selectionKeyRef.current !== null) {
        selectionKeyRef.current = null
        setSelection(null)
      }
      return
    }

    const nextSelection: ThoughtSourceSelection = {
      text: context.selection.text,
      range: context.selection.range,
      anchorRect: getCurrentSelectionAnchorRect(),
    }
    const nextSelectionKey = serializeComparableValue(nextSelection)

    if (selectionKeyRef.current !== nextSelectionKey) {
      selectionKeyRef.current = nextSelectionKey
      setSelection(nextSelection)
    }
  }, [])

  const runtimeProps = useMemo<SpatialRuntimeProps>(
    () => ({
      initialAnnotations: getThoughtAnnotations(graph.nodes),
      onAnalysisContextChange: handleAnalysisContextChange,
    }),
    [graph.nodes, handleAnalysisContextChange],
  )

  const clearSelection = useCallback(() => {
    selectionKeyRef.current = null
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  const runAction = useCallback(
    (sourceSelection: ThoughtSourceSelection, action: ThoughtActionDefinition) => {
      graph.createAiNode(sourceSelection, action, { mode: 'window' })
      clearSelection()
    },
    [clearSelection, graph],
  )

  const runAllActions = useCallback(
    (sourceSelection: ThoughtSourceSelection) => {
      graph.createAiNodes(sourceSelection, actions, { mode: 'window' })
      clearSelection()
    },
    [actions, clearSelection, graph],
  )

  const createNote = useCallback(
    (sourceSelection: ThoughtSourceSelection) => {
      graph.createNoteNode(sourceSelection, { mode: 'sidebar-card' })
      clearSelection()
    },
    [clearSelection, graph],
  )

  const moveNode = useCallback(
    (nodeId: string, position: ThoughtPoint) => {
      graph.updateNodeView(nodeId, { position })
    },
    [graph],
  )

  const clearGraph = useCallback(() => {
    graph.clearNodes()
    if (typeof window !== 'undefined') {
      clearStoredThoughtGraph(window.localStorage, identity)
    }
  }, [graph, identity])

  return (
    <div className="relative flex min-h-[calc(100vh-9rem)] overflow-hidden rounded-xl border bg-background">
      <div className="min-w-0 flex-1">{children(runtimeProps)}</div>
      {persistenceError ? (
        <div className="fixed right-4 top-14 z-[1000] max-w-sm rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive shadow-lg">
          {persistenceError}
        </div>
      ) : null}
      <ThoughtSidebar
        nodes={graph.nodes}
        onOpenNode={(nodeId) => {
          graph.setNodeMode(nodeId, 'window')
          graph.bringNodeToFront(nodeId)
        }}
        onSendNodeToSidebar={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
        onCloseNode={(nodeId) => graph.updateNodeView(nodeId, { status: 'closed' })}
        onDeleteNode={graph.deleteNode}
      />
      <SpatialSelectionOverlay
        selection={
          selection
            ? {
                text: selection.text,
                range: selection.range,
                anchorRect: selection.anchorRect,
              }
            : null
        }
        actions={actions}
        onRunAction={runAction}
        onRunAll={runAllActions}
        onCreateNote={createNote}
        onDismiss={clearSelection}
      />
      <ThoughtCanvas
        nodes={graph.nodes}
        actions={actions}
        hidden={canvasHidden}
        onMoveNode={moveNode}
        onBringNodeToFront={graph.bringNodeToFront}
        onMinimizeNode={(nodeId) => graph.updateNodeView(nodeId, { status: 'minimized' })}
        onCloseNode={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
        onSendNodeToSidebar={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
        onCreateChildNode={(sourceSelection, action, sourceNode) => {
          graph.createAiNode(sourceSelection, action, {
            mode: 'window',
            sourceNode,
          })
        }}
        onCreateChildNodes={(sourceSelection, sourceNode) => {
          graph.createAiNodes(sourceSelection, actions, {
            mode: 'window',
            sourceNode,
          })
        }}
      />
      <ThoughtDock
        nodes={graph.nodes}
        canvasHidden={canvasHidden}
        onToggleCanvas={() => setCanvasHidden((value) => !value)}
        onOpenNode={(nodeId) => {
          graph.setNodeMode(nodeId, 'window')
          graph.bringNodeToFront(nodeId)
        }}
        onClear={clearGraph}
      />
    </div>
  )
}
