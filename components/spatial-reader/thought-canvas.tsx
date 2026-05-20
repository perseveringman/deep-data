'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { LocateFixed, ZoomIn, ZoomOut } from 'lucide-react'

import type { ReaderSelectionAnchorRect } from '@/components/reader-platform/core'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { ThoughtActionBar } from './thought-action-bar'
import { getVisibleThoughtWindowNodeIds, ThoughtConnectionLines } from './connection-lines'
import { ThoughtWindow } from './thought-window'
import type {
  ThoughtActionDefinition,
  ThoughtNode,
  ThoughtPoint,
  ThoughtSize,
  ThoughtSourceSelection,
} from './thought-graph'
import {
  getThoughtNodeFrame,
  resolveNestedThoughtWindowLayout,
  type SpatialLayoutRect,
  type ThoughtWindowLayout,
} from './window-layout'

export interface SpatialCanvasViewport {
  x: number
  y: number
  zoom: number
}

const DEFAULT_VIEWPORT: SpatialCanvasViewport = { x: 0, y: 0, zoom: 1 }
const MIN_ZOOM = 0.5
const MAX_ZOOM = 1.65
const emptyThoughtNodes: ThoughtNode[] = []

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getThoughtHighlightNodeId(target: EventTarget | null, nodeIds: Set<string>) {
  if (!(target instanceof HTMLElement)) return null
  if (target.closest('button, a, input, textarea, select')) return null

  const highlight = target.closest<HTMLElement>(
    '[data-reader-thought-id], [data-reader-annotation-id]',
  )
  const nodeId = highlight?.dataset.readerThoughtId ?? highlight?.dataset.readerAnnotationId

  return nodeId && nodeIds.has(nodeId) ? nodeId : null
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest('[data-spatial-interactive], [data-spatial-window], button, a, input, textarea, select'))
    : false
}

export function screenRectToCanvasRect(
  rect: ReaderSelectionAnchorRect | undefined,
  viewport: SpatialCanvasViewport,
  canvasBounds?: Pick<DOMRect, 'left' | 'top'> | null,
): ReaderSelectionAnchorRect | undefined {
  if (!rect) return undefined

  const zoom = Math.max(0.2, viewport.zoom)
  const boundsLeft = canvasBounds?.left ?? 0
  const boundsTop = canvasBounds?.top ?? 0
  const left = (rect.left - boundsLeft - viewport.x) / zoom
  const top = (rect.top - boundsTop - viewport.y) / zoom

  return {
    left,
    top,
    right: left + rect.width / zoom,
    bottom: top + rect.height / zoom,
    width: rect.width / zoom,
    height: rect.height / zoom,
  }
}

function getFloatingBarPosition(selection: ThoughtSourceSelection | null) {
  const rect = selection?.anchorRect
  if (!rect) return null

  return {
    left: rect.left + rect.width / 2,
    top: rect.top > 72 ? rect.top - 10 : rect.bottom + 10,
    transform: rect.top > 72 ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
  }
}

function getVisibleCanvasBounds(
  canvasElement: HTMLElement | null,
  viewport: SpatialCanvasViewport,
): SpatialLayoutRect {
  const rect = canvasElement?.getBoundingClientRect()
  const zoom = Math.max(0.2, viewport.zoom)

  return {
    x: -viewport.x / zoom,
    y: -viewport.y / zoom,
    width: (rect?.width ?? window.innerWidth) / zoom,
    height: (rect?.height ?? window.innerHeight) / zoom,
  }
}

function selectionRectToLayoutRect(
  rect: ReaderSelectionAnchorRect | undefined,
): SpatialLayoutRect | undefined {
  if (!rect) return undefined

  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

export function ThoughtCanvas({
  nodes,
  actions,
  hidden,
  chromeHidden = false,
  children,
  toolbar,
  viewport,
  onViewportChange,
  readerWindowIds,
  onMoveNode,
  onResizeNode,
  onBringNodeToFront,
  onOpenNode,
  onMinimizeNode,
  onCloseNode,
  onSendNodeToSidebar,
  onCreateChildNode,
  onCreateChildNodes,
}: {
  nodes: ThoughtNode[]
  actions: ThoughtActionDefinition[]
  hidden: boolean
  chromeHidden?: boolean
  children?: ReactNode
  toolbar?: ReactNode
  viewport?: SpatialCanvasViewport
  onViewportChange?: (viewport: SpatialCanvasViewport) => void
  readerWindowIds?: string[]
  onMoveNode: (nodeId: string, position: ThoughtPoint) => void
  onResizeNode?: (nodeId: string, size: { width: number; height: number }) => void
  onBringNodeToFront: (nodeId: string) => void
  onOpenNode: (nodeId: string) => void
  onMinimizeNode: (nodeId: string) => void
  onCloseNode: (nodeId: string) => void
  onSendNodeToSidebar: (nodeId: string) => void
  onCreateChildNode: (
    selection: ThoughtSourceSelection,
    action: ThoughtActionDefinition,
    sourceNode: ThoughtNode,
    view?: ThoughtWindowLayout,
  ) => void
  onCreateChildNodes: (
    selection: ThoughtSourceSelection,
    sourceNode: ThoughtNode,
    view?: (index: number) => Partial<{ position: ThoughtPoint; size: ThoughtSize }>,
  ) => void
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const viewportLayerRef = useRef<HTMLDivElement>(null)
  const openedHighlightOnPointerDownRef = useRef<string | null>(null)
  const panStartRef = useRef<{
    pointer: ThoughtPoint
    viewport: SpatialCanvasViewport
  } | null>(null)
  const [internalViewport, setInternalViewport] =
    useState<SpatialCanvasViewport>(DEFAULT_VIEWPORT)
  const [panning, setPanning] = useState(false)
  const [windowSelection, setWindowSelection] = useState<{
    selection: ThoughtSourceSelection
    sourceNode: ThoughtNode
  } | null>(null)
  const [visibleWindowNodeIds, setVisibleWindowNodeIds] = useState<Set<string>>(new Set())
  const resolvedViewport = viewport ?? internalViewport
  const setViewport = onViewportChange ?? setInternalViewport
  const nodeIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes])
  const openWindowNodes = useMemo(
    () =>
      nodes.filter(
        (node) => node.view.mode === 'window' && node.view.status === 'open',
      ),
    [nodes],
  )
  const childNodesBySourceId = useMemo(() => {
    const children = new Map<string, ThoughtNode[]>()
    nodes.forEach((node) => {
      if (!node.sourceNodeId) return
      const current = children.get(node.sourceNodeId) ?? []
      current.push(node)
      children.set(node.sourceNodeId, current)
    })
    return children
  }, [nodes])
  const actionBarPosition = getFloatingBarPosition(windowSelection?.selection ?? null)
  const interactiveBackground = Boolean(children)
  const showCanvasChrome = interactiveBackground && !chromeHidden

  const updateViewport = useCallback(
    (nextViewport: SpatialCanvasViewport) => {
      setViewport({
        x: nextViewport.x,
        y: nextViewport.y,
        zoom: clamp(nextViewport.zoom, MIN_ZOOM, MAX_ZOOM),
      })
    },
    [setViewport],
  )

  const zoomCanvas = useCallback(
    (nextZoom: number, anchor?: ThoughtPoint) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      const localAnchor = anchor ?? {
        x: (canvasRect?.width ?? window.innerWidth) / 2,
        y: (canvasRect?.height ?? window.innerHeight) / 2,
      }
      const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
      const worldX = (localAnchor.x - resolvedViewport.x) / resolvedViewport.zoom
      const worldY = (localAnchor.y - resolvedViewport.y) / resolvedViewport.zoom

      updateViewport({
        x: localAnchor.x - worldX * zoom,
        y: localAnchor.y - worldY * zoom,
        zoom,
      })
    },
    [resolvedViewport, updateViewport],
  )

  useEffect(() => {
    if (!panning) return

    const handlePointerMove = (event: PointerEvent) => {
      const start = panStartRef.current
      if (!start) return

      updateViewport({
        ...start.viewport,
        x: start.viewport.x + event.clientX - start.pointer.x,
        y: start.viewport.y + event.clientY - start.pointer.y,
      })
    }

    const handlePointerUp = () => {
      panStartRef.current = null
      setPanning(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [panning, updateViewport])

  useEffect(() => {
    let frameId = 0

    const updateVisibleWindows = () => {
      const nextVisibleWindowNodeIds = hidden
        ? new Set<string>()
        : getVisibleThoughtWindowNodeIds(nodes, readerWindowIds ?? [])

      setVisibleWindowNodeIds((current) => {
        if (
          current.size === nextVisibleWindowNodeIds.size &&
          [...current].every((nodeId) => nextVisibleWindowNodeIds.has(nodeId))
        ) {
          return current
        }
        return nextVisibleWindowNodeIds
      })

      frameId = window.requestAnimationFrame(updateVisibleWindows)
    }

    updateVisibleWindows()
    return () => window.cancelAnimationFrame(frameId)
  }, [hidden, nodes, readerWindowIds])

  const selectionToCanvas = useCallback(
    (selection: ThoughtSourceSelection): ThoughtSourceSelection => ({
      ...selection,
      anchorRect: screenRectToCanvasRect(
        selection.anchorRect,
        resolvedViewport,
        canvasRef.current?.getBoundingClientRect(),
      ),
    }),
    [resolvedViewport],
  )

  const getChildWindowLayout = useCallback(
    (
      sourceNode: ThoughtNode,
      selection: ThoughtSourceSelection,
      additionalSiblingIndex = 0,
    ): ThoughtWindowLayout => {
      const siblingIndex =
        nodes.filter(
          (node) => node.sourceNodeId === sourceNode.id && node.view.status !== 'closed',
        ).length + additionalSiblingIndex

      return resolveNestedThoughtWindowLayout({
        sourceFrame: getThoughtNodeFrame(sourceNode),
        selectionRect: selectionRectToLayoutRect(selection.anchorRect),
        visibleBounds: getVisibleCanvasBounds(canvasRef.current, resolvedViewport),
        existingFrames: openWindowNodes
          .filter((node) => node.id !== sourceNode.id)
          .map((node) => getThoughtNodeFrame(node)),
        siblingIndex,
      })
    },
    [nodes, openWindowNodes, resolvedViewport],
  )

  const openHighlightedNode = useCallback(
    (nodeId: string) => {
      setWindowSelection(null)
      onOpenNode(nodeId)
    },
    [onOpenNode],
  )

  return (
    <div
      ref={canvasRef}
      className={cn(
        'absolute inset-0 overflow-hidden',
        interactiveBackground ? 'bg-slate-100' : 'bg-transparent',
        interactiveBackground ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      data-spatial-canvas
      onPointerDownCapture={(event) => {
        if (event.button !== 0) return

        const nodeId = getThoughtHighlightNodeId(event.target, nodeIds)
        if (!nodeId) return

        event.preventDefault()
        event.stopPropagation()
        openedHighlightOnPointerDownRef.current = nodeId
        openHighlightedNode(nodeId)
      }}
      onClickCapture={(event) => {
        const nodeId = getThoughtHighlightNodeId(event.target, nodeIds)
        if (!nodeId) return

        event.preventDefault()
        event.stopPropagation()
        if (openedHighlightOnPointerDownRef.current === nodeId) {
          openedHighlightOnPointerDownRef.current = null
          return
        }
        openHighlightedNode(nodeId)
      }}
      onPointerDown={(event) => {
        if (!interactiveBackground || event.button !== 0) return
        if (isInteractiveTarget(event.target)) return

        event.preventDefault()
        panStartRef.current = {
          pointer: { x: event.clientX, y: event.clientY },
          viewport: resolvedViewport,
        }
        setPanning(true)
      }}
      onWheel={(event) => {
        if (!interactiveBackground || isInteractiveTarget(event.target)) return

        event.preventDefault()
        const canvasRect = canvasRef.current?.getBoundingClientRect()
        if (event.metaKey || event.ctrlKey) {
          zoomCanvas(
            resolvedViewport.zoom * Math.exp(-event.deltaY * 0.0012),
            {
              x: event.clientX - (canvasRect?.left ?? 0),
              y: event.clientY - (canvasRect?.top ?? 0),
            },
          )
          return
        }

        updateViewport({
          ...resolvedViewport,
          x: resolvedViewport.x - event.deltaX,
          y: resolvedViewport.y - event.deltaY,
        })
      }}
    >
      {showCanvasChrome ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148, 163, 184, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.18) 1px, transparent 1px)',
            backgroundPosition: `${resolvedViewport.x}px ${resolvedViewport.y}px`,
            backgroundSize: `${48 * resolvedViewport.zoom}px ${48 * resolvedViewport.zoom}px`,
          }}
        />
      ) : null}

      {toolbar && !chromeHidden ? (
        <div data-spatial-interactive className="pointer-events-auto absolute left-4 top-4 z-[80]">
          {toolbar}
        </div>
      ) : null}

      {showCanvasChrome ? (
        <div
          data-spatial-interactive
          className="pointer-events-auto absolute right-4 top-4 z-[80] flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 px-2 py-1.5 text-slate-700 shadow-xl backdrop-blur"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            onClick={() => zoomCanvas(resolvedViewport.zoom - 0.1)}
            aria-label="缩小画布"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs font-semibold tabular-nums">
            {Math.round(resolvedViewport.zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            onClick={() => zoomCanvas(resolvedViewport.zoom + 0.1)}
            aria-label="放大画布"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            onClick={() => updateViewport(DEFAULT_VIEWPORT)}
            aria-label="重置画布视图"
          >
            <LocateFixed className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div
        ref={viewportLayerRef}
        className="absolute left-0 top-0 min-h-full min-w-full will-change-transform"
        style={{
          transform: `translate(${resolvedViewport.x}px, ${resolvedViewport.y}px) scale(${resolvedViewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {!hidden ? (
          <ThoughtConnectionLines
            nodes={nodes}
            readerWindowIds={readerWindowIds}
            coordinateRootRef={viewportLayerRef}
            canvasZoom={resolvedViewport.zoom}
          />
        ) : null}
        {children}
        {!hidden
          ? openWindowNodes.filter((node) => visibleWindowNodeIds.has(node.id)).map((node) => (
              <ThoughtWindow
                key={node.id}
                node={node}
                canvasZoom={resolvedViewport.zoom}
                onBringToFront={onBringNodeToFront}
                onOpenNode={onOpenNode}
                onMove={onMoveNode}
                onResize={onResizeNode}
                onMinimize={onMinimizeNode}
                onClose={onCloseNode}
                onSendToSidebar={onSendNodeToSidebar}
                onWindowSelection={(selection, sourceNode) =>
                  setWindowSelection({ selection, sourceNode })
                }
                childNodes={childNodesBySourceId.get(node.id) ?? emptyThoughtNodes}
              />
            ))
          : null}
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
              const canvasSelection = selectionToCanvas(windowSelection.selection)
              onCreateChildNode(
                canvasSelection,
                action,
                windowSelection.sourceNode,
                getChildWindowLayout(windowSelection.sourceNode, canvasSelection),
              )
              setWindowSelection(null)
              window.getSelection()?.removeAllRanges()
            }}
            onRunAll={() => {
              const canvasSelection = selectionToCanvas(windowSelection.selection)
              onCreateChildNodes(
                canvasSelection,
                windowSelection.sourceNode,
                (index) =>
                  getChildWindowLayout(windowSelection.sourceNode, canvasSelection, index),
              )
              setWindowSelection(null)
              window.getSelection()?.removeAllRanges()
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
