'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { BookOpenText, Check, Grid2X2, Network, Plus, RotateCcw, Shrink, Shuffle } from 'lucide-react'

import type { ReaderAnalysisContext } from '@/components/reader-platform/analysis'
import type { ReaderDocumentIdentity } from '@/components/reader-platform/core'
import type { ReaderRuntimeProps } from '@/components/reader-platform/runtime'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import { defaultThoughtActions } from './actions'
import {
  clearStoredThoughtGraph,
  readStoredThoughtGraph,
  writeStoredThoughtGraph,
} from './persistence'
import { SpatialSelectionOverlay } from './spatial-selection-overlay'
import { SpatialReaderWindow, type SpatialReaderWindowState } from './spatial-reader-window'
import {
  screenRectToCanvasRect,
  ThoughtCanvas,
  type SpatialCanvasViewport,
} from './thought-canvas'
import { ThoughtDock } from './thought-dock'
import { ThoughtSidebar } from './thought-sidebar'
import type {
  ThoughtActionDefinition,
  ThoughtActionExecutor,
  ThoughtNode,
  ThoughtNodeChange,
  ThoughtPoint,
  ThoughtSize,
  ThoughtSourceSelection,
} from './thought-graph'
import {
  getThoughtAnnotationFingerprint,
  getThoughtAnnotations,
  getThoughtHighlightElementId,
} from './thought-graph'
import { useThoughtGraph } from './use-thought-graph'

type SpatialRuntimeProps = Pick<
  ReaderRuntimeProps,
  'initialAnnotations' | 'onAnalysisContextChange'
>

export interface SpatialReaderFixtureOption {
  id: string
  label: string
  description?: string
  type?: string
  icon?: ReactNode
}

export interface SpatialReaderFrameProps {
  identity: ReaderDocumentIdentity
  actions?: ThoughtActionDefinition[]
  actionExecutor?: ThoughtActionExecutor
  initialNodes?: ThoughtNode[]
  onThoughtNodeChange?: (change: ThoughtNodeChange) => void
  className?: string
  fixtureOptions?: SpatialReaderFixtureOption[]
  activeFixtureId?: string
  onSelectFixture?: (fixtureId: string) => void
  initialReaderWindows?: SpatialReaderWindowState[]
  canvasContent?: (runtimeProps: SpatialRuntimeProps) => ReactNode
  children?: (
    runtimeProps: SpatialRuntimeProps,
    readerWindow: SpatialReaderWindowState,
  ) => ReactNode
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

const DEFAULT_CANVAS_VIEWPORT: SpatialCanvasViewport = { x: 0, y: 0, zoom: 1 }
const DEFAULT_WORKSPACE_SIZE: ThoughtSize = { width: 1200, height: 740 }
const PRIMARY_READER_WINDOW_ID = 'reader-main'
const READER_WINDOW_MARGIN = 32
const READER_TOOLBAR_SPACE = 84
const READER_DOCK_SPACE = 112
const READER_LAYOUT_GAP_X = 28
const READER_LAYOUT_GAP_Y = 30

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getReaderWindowLayout(index: number, workspaceSize: ThoughtSize) {
  const x = READER_WINDOW_MARGIN + index * 34
  const y = READER_TOOLBAR_SPACE + index * 30
  const availableWidth = Math.max(620, workspaceSize.width - READER_WINDOW_MARGIN * 2)
  const availableHeight = Math.max(420, workspaceSize.height - y - READER_DOCK_SPACE)

  return {
    position: { x, y },
    size: {
      width: clamp(availableWidth, 620, 1180),
      height: clamp(availableHeight, 420, 760),
    },
  }
}

function createReaderWindow(
  identity: ReaderDocumentIdentity,
  index: number,
  zIndex: number,
  workspaceSize = DEFAULT_WORKSPACE_SIZE,
): SpatialReaderWindowState {
  const layout = getReaderWindowLayout(index, workspaceSize)
  return {
    id: index === 0 ? PRIMARY_READER_WINDOW_ID : `reader-${Date.now()}-${index}`,
    title: identity.title ?? 'Spatial Reader',
    subtitle: identity.readerType,
    position: layout.position,
    size: layout.size,
    status: 'open',
    isMaximized: false,
    isImmersive: false,
    zIndex,
  }
}

function cloneReaderWindow(window: SpatialReaderWindowState): SpatialReaderWindowState {
  return {
    ...window,
    metadata: window.metadata ? { ...window.metadata } : undefined,
    position: { ...window.position },
    size: { ...window.size },
    isImmersive: Boolean(window.isImmersive),
  }
}

function createInitialReaderWindows(
  identity: ReaderDocumentIdentity,
  initialReaderWindows?: SpatialReaderWindowState[],
) {
  if (initialReaderWindows?.length) {
    return initialReaderWindows.map(cloneReaderWindow)
  }

  return [createReaderWindow(identity, 0, 120)]
}

function getTopReaderZIndex(readerWindows: SpatialReaderWindowState[]) {
  return Math.max(140, ...readerWindows.map((window) => window.zIndex))
}

function getFirstOpenReaderWindowId(readerWindows: SpatialReaderWindowState[]) {
  return (
    readerWindows.find((window) => window.status !== 'closed')?.id ??
    PRIMARY_READER_WINDOW_ID
  )
}

function fitReaderWindowToWorkspace(
  window: SpatialReaderWindowState,
  index: number,
  workspaceSize: ThoughtSize,
) {
  const layout = getReaderWindowLayout(index, workspaceSize)
  const nextSize = {
    width: Math.min(window.size.width, layout.size.width),
    height: Math.min(window.size.height, layout.size.height),
  }
  const maxX = Math.max(READER_WINDOW_MARGIN, workspaceSize.width - nextSize.width - READER_WINDOW_MARGIN)
  const maxY = Math.max(READER_TOOLBAR_SPACE, workspaceSize.height - nextSize.height - READER_DOCK_SPACE)

  return {
    ...window,
    size: nextSize,
    position: {
      x: clamp(window.position.x, READER_WINDOW_MARGIN, maxX),
      y: clamp(window.position.y, READER_TOOLBAR_SPACE, maxY),
    },
  }
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<ThoughtSize>(DEFAULT_WORKSPACE_SIZE)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      setSize({
        width: element.clientWidth || DEFAULT_WORKSPACE_SIZE.width,
        height: element.clientHeight || DEFAULT_WORKSPACE_SIZE.height,
      })
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}

function getAttachedNodeIds(nodes: ThoughtNode[], readerWindowId: string) {
  return new Set(
    nodes
      .filter((node) => node.sourceReaderWindowId === readerWindowId)
      .map((node) => node.id),
  )
}

function getDescendantNodeIds(nodes: ThoughtNode[], rootNodeId: string) {
  const descendants = new Set<string>()
  let changed = true

  while (changed) {
    changed = false
    nodes.forEach((node) => {
      if (!node.sourceNodeId) return
      if (node.sourceNodeId !== rootNodeId && !descendants.has(node.sourceNodeId)) return
      if (descendants.has(node.id)) return
      descendants.add(node.id)
      changed = true
    })
  }

  return descendants
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
  className,
  fixtureOptions,
  activeFixtureId,
  onSelectFixture,
  initialReaderWindows,
  canvasContent,
  children,
}: SpatialReaderFrameProps) {
  const hasCanvasContent = Boolean(canvasContent)
  const initialReaderWindowsKey = useMemo(
    () => initialReaderWindows?.map((window) => window.id).join('|') ?? '',
    [initialReaderWindows],
  )
  const workspaceRef = useRef<HTMLDivElement>(null)
  const workspaceSize = useElementSize(workspaceRef)
  const [analysisContext, setAnalysisContext] = useState<ReaderAnalysisContext | null>(null)
  const [selection, setSelection] = useState<ThoughtSourceSelection | null>(null)
  const [canvasHidden, setCanvasHidden] = useState(false)
  const [viewport, setViewport] = useState<SpatialCanvasViewport>(DEFAULT_CANVAS_VIEWPORT)
  const [readerWindows, setReaderWindows] = useState<SpatialReaderWindowState[]>(() =>
    hasCanvasContent ? [] : createInitialReaderWindows(identity, initialReaderWindows),
  )
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const [storageReady, setStorageReady] = useState(Boolean(initialNodes))
  const analysisContextKeyRef = useRef<string | null>(null)
  const selectionKeyRef = useRef<string | null>(null)
  const activeReaderWindowIdRef = useRef(PRIMARY_READER_WINDOW_ID)
  const [activeReaderWindowId, setActiveReaderWindowId] = useState(() =>
    getFirstOpenReaderWindowId(readerWindows),
  )
  const readerZIndexRef = useRef(getTopReaderZIndex(readerWindows))
  const graph = useThoughtGraph({
    identity,
    analysisContext,
    initialNodes,
    actionExecutor,
    onThoughtNodeChange,
  })

  useEffect(() => {
    if (hasCanvasContent) {
      activeReaderWindowIdRef.current = ''
      setActiveReaderWindowId('')
      setReaderWindows([])
      setViewport(DEFAULT_CANVAS_VIEWPORT)
      readerZIndexRef.current = 140
      return
    }

    const nextReaderWindows = createInitialReaderWindows(identity, initialReaderWindows)
    const activeWindowId = getFirstOpenReaderWindowId(nextReaderWindows)
    activeReaderWindowIdRef.current = activeWindowId
    setActiveReaderWindowId(activeWindowId)
    setReaderWindows(nextReaderWindows)
    setViewport(DEFAULT_CANVAS_VIEWPORT)
    readerZIndexRef.current = getTopReaderZIndex(nextReaderWindows)
  }, [
    hasCanvasContent,
    identity.documentId,
    identity.readerType,
    identity.title,
    initialReaderWindows,
    initialReaderWindowsKey,
  ])

  useEffect(() => {
    setReaderWindows((current) => {
      const visibleReaderWindowCount = current.filter((window) => window.status !== 'closed').length
      if (visibleReaderWindowCount > 1) return current

      return current.map((window, index) => fitReaderWindowToWorkspace(window, index, workspaceSize))
    })
  }, [workspaceSize.height, workspaceSize.width])

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

  const thoughtAnnotationFingerprint = getThoughtAnnotationFingerprint(graph.nodes)
  const thoughtAnnotations = useMemo(
    () => getThoughtAnnotations(graph.nodes),
    [thoughtAnnotationFingerprint],
  )
  const thoughtDecorationNodes = useMemo(
    () => graph.nodes,
    [thoughtAnnotationFingerprint],
  )

  useEffect(() => {
    decorateGlobalThoughtHighlights({
      nodes: thoughtDecorationNodes,
      onOpenNode: (nodeId) => {
        graph.setNodeMode(nodeId, 'window')
        graph.bringNodeToFront(nodeId)
      },
    })
  }, [graph.bringNodeToFront, graph.setNodeMode, thoughtDecorationNodes])

  const getActiveReaderWindowId = useCallback(() => {
    if (hasCanvasContent) return undefined

    const activeWindow = readerWindows.find(
      (window) => window.id === activeReaderWindowIdRef.current && window.status !== 'closed',
    )
    return (
      activeWindow?.id ??
      readerWindows.find((window) => window.status !== 'closed')?.id ??
      PRIMARY_READER_WINDOW_ID
    )
  }, [hasCanvasContent, readerWindows])

  const handleAnalysisContextChange = useCallback(
    (context: ReaderAnalysisContext) => {
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
        sourceReaderWindowId: getActiveReaderWindowId(),
      }
      const nextSelectionKey = serializeComparableValue(nextSelection)

      if (selectionKeyRef.current !== nextSelectionKey) {
        selectionKeyRef.current = nextSelectionKey
        setSelection(nextSelection)
      }
    },
    [getActiveReaderWindowId],
  )

  const runtimeProps = useMemo<SpatialRuntimeProps>(
    () => ({
      initialAnnotations: thoughtAnnotations,
      onAnalysisContextChange: handleAnalysisContextChange,
    }),
    [handleAnalysisContextChange, thoughtAnnotations],
  )

  const clearSelection = useCallback(() => {
    selectionKeyRef.current = null
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  const readerWindowIds = useMemo(
    () => readerWindows.filter((window) => window.status !== 'closed').map((window) => window.id),
    [readerWindows],
  )
  const openReaderWindowCount = readerWindowIds.length
  const immersiveReaderWindow = useMemo(
    () => readerWindows.find((window) => window.status === 'open' && window.isImmersive) ?? null,
    [readerWindows],
  )
  const immersiveReaderWindowId = immersiveReaderWindow?.id
  const renderedReaderWindows = useMemo(
    () =>
      immersiveReaderWindowId
        ? readerWindows.filter((window) => window.id === immersiveReaderWindowId)
        : readerWindows,
    [immersiveReaderWindowId, readerWindows],
  )
  const visibleReaderWindowIds = useMemo(
    () => (immersiveReaderWindowId ? [immersiveReaderWindowId] : readerWindowIds),
    [immersiveReaderWindowId, readerWindowIds],
  )

  const getNextReaderZIndex = useCallback(() => {
    readerZIndexRef.current += 1
    return readerZIndexRef.current
  }, [])

  const activateReaderWindow = useCallback(
    (windowId: string) => {
      activeReaderWindowIdRef.current = windowId
      setActiveReaderWindowId(windowId)
      setReaderWindows((current) => {
        const targetWindow = current.find((window) => window.id === windowId)
        if (!targetWindow) return current

        const topZIndex = Math.max(...current.map((window) => window.zIndex))
        if (targetWindow.status === 'open' && targetWindow.zIndex >= topZIndex) {
          return current
        }

        return current.map((window) =>
          window.id === windowId
            ? { ...window, status: 'open', zIndex: getNextReaderZIndex() }
            : window,
        )
      })
    },
    [getNextReaderZIndex],
  )

  const moveAttachedNodes = useCallback(
    (readerWindowId: string, delta: ThoughtPoint) => {
      if (delta.x === 0 && delta.y === 0) return

      const attachedNodeIds = getAttachedNodeIds(graph.nodes, readerWindowId)
      const nodeIdsToMove = new Set(attachedNodeIds)
      attachedNodeIds.forEach((nodeId) => {
        getDescendantNodeIds(graph.nodes, nodeId).forEach((descendantNodeId) => {
          nodeIdsToMove.add(descendantNodeId)
        })
      })

      graph.nodes.forEach((node) => {
        if (!nodeIdsToMove.has(node.id) || node.view.mode !== 'window') return

        const position = node.view.position
        if (!position) return

        graph.updateNodeView(node.id, {
          position: {
            x: position.x + delta.x,
            y: position.y + delta.y,
          },
        })
      })
    },
    [graph.nodes, graph.updateNodeView],
  )

  const moveReaderWindow = useCallback(
    (windowId: string, position: ThoughtPoint) => {
      const currentWindow = readerWindows.find((window) => window.id === windowId)
      if (!currentWindow) return

      const delta = {
        x: position.x - currentWindow.position.x,
        y: position.y - currentWindow.position.y,
      }

      setReaderWindows((current) =>
        current.map((window) =>
          window.id === windowId
            ? {
                ...window,
                position,
                isMaximized: false,
                isImmersive: false,
              }
            : window,
        ),
      )
      moveAttachedNodes(windowId, delta)
    },
    [moveAttachedNodes, readerWindows],
  )

  const resizeReaderWindow = useCallback((windowId: string, size: ThoughtSize) => {
    setReaderWindows((current) =>
      current.map((window) =>
        window.id === windowId
          ? {
              ...window,
              size,
              isMaximized: false,
              isImmersive: false,
            }
          : window,
      ),
    )
  }, [])

  const layoutReaderWindows = useCallback(
    (mode: 'grid' | 'scatter') => {
      const visibleWindows = readerWindows.filter((window) => window.status !== 'closed')
      if (visibleWindows.length <= 1) return

      const columns = Math.max(2, Math.ceil(Math.sqrt(visibleWindows.length)))

      const nextPositionById = new Map<string, ThoughtPoint>()

      visibleWindows.forEach((window, index) => {
        const column = index % columns
        const row = Math.floor(index / columns)
        const cellWidth = window.size.width + READER_LAYOUT_GAP_X
        const cellHeight = window.size.height + READER_LAYOUT_GAP_Y
        const jitterX =
          mode === 'scatter' ? Math.round((Math.random() - 0.5) * Math.min(150, cellWidth * 0.22)) : 0
        const jitterY =
          mode === 'scatter' ? Math.round((Math.random() - 0.5) * Math.min(130, cellHeight * 0.2)) : 0

        nextPositionById.set(window.id, {
          x: Math.max(READER_WINDOW_MARGIN, READER_WINDOW_MARGIN + column * cellWidth + jitterX),
          y: Math.max(READER_TOOLBAR_SPACE, READER_TOOLBAR_SPACE + row * cellHeight + jitterY),
        })
      })

      visibleWindows.forEach((window) => {
        const nextPosition = nextPositionById.get(window.id)
        if (!nextPosition) return

        moveAttachedNodes(window.id, {
          x: nextPosition.x - window.position.x,
          y: nextPosition.y - window.position.y,
        })
      })

      setReaderWindows((current) =>
        current.map((window) => {
          const nextPosition = nextPositionById.get(window.id)
          if (!nextPosition) return window

          return {
            ...window,
            position: nextPosition,
            isMaximized: false,
            isImmersive: false,
          }
        }),
      )
      setViewport(DEFAULT_CANVAS_VIEWPORT)
    },
    [
      moveAttachedNodes,
      readerWindows,
    ],
  )

  const duplicateReaderWindow = useCallback(
    (sourceWindowId: string) => {
      const sourceWindow =
        readerWindows.find((window) => window.id === sourceWindowId && window.status !== 'closed') ??
        readerWindows.find((window) => window.status === 'open') ??
        readerWindows.find((window) => window.status !== 'closed')
      const fallbackWindow = createReaderWindow(
        identity,
        readerWindows.length,
        getNextReaderZIndex(),
        workspaceSize,
      )
      const baseWindow = sourceWindow ?? fallbackWindow
      const nextWindow = fitReaderWindowToWorkspace({
        ...baseWindow,
        id: `reader-${Date.now()}-${readerWindows.length}`,
        title: sourceWindow?.title ?? identity.title ?? 'Spatial Reader',
        position: {
          x: baseWindow.position.x + 38,
          y: baseWindow.position.y + 34,
        },
        status: 'open' as const,
        isMaximized: false,
        isImmersive: false,
        zIndex: getNextReaderZIndex(),
      }, readerWindows.length, workspaceSize)

      activeReaderWindowIdRef.current = nextWindow.id
      setActiveReaderWindowId(nextWindow.id)
      setReaderWindows((current) => [...current, nextWindow])
    },
    [getNextReaderZIndex, identity, readerWindows, workspaceSize],
  )

  const updateReaderWindow = useCallback(
    (windowId: string, patch: Partial<SpatialReaderWindowState>) => {
      setReaderWindows((current) =>
        current.map((window) =>
          window.id === windowId
            ? {
                ...window,
                ...patch,
                zIndex: patch.zIndex ?? window.zIndex,
              }
            : window,
        ),
      )
    },
    [],
  )

  const minimizeReaderWindow = useCallback(
    (windowId: string) => {
      updateReaderWindow(windowId, { status: 'minimized', isMaximized: false, isImmersive: false })
    },
    [updateReaderWindow],
  )

  const closeReaderWindow = useCallback(
    (windowId: string) => {
      updateReaderWindow(windowId, { status: 'closed', isMaximized: false, isImmersive: false })
    },
    [updateReaderWindow],
  )

  const toggleReaderWindowMaximize = useCallback(
    (windowId: string) => {
      setReaderWindows((current) =>
        current.map((window) =>
          window.id === windowId
            ? {
                ...window,
                status: 'open',
                isMaximized: !window.isMaximized,
                isImmersive: false,
                zIndex: getNextReaderZIndex(),
              }
            : window,
        ),
      )
    },
    [getNextReaderZIndex],
  )

  const toggleReaderWindowImmersive = useCallback(
    (windowId: string) => {
      const targetWindow = readerWindows.find((window) => window.id === windowId)
      const enteringImmersive = !targetWindow?.isImmersive

      if (enteringImmersive) {
        activeReaderWindowIdRef.current = windowId
        setActiveReaderWindowId(windowId)
        setCanvasHidden(false)
      }

      setReaderWindows((current) =>
        current.map((window) =>
          window.id === windowId
            ? {
                ...window,
                status: 'open',
                isMaximized: false,
                isImmersive: !window.isImmersive,
              }
            : window.isImmersive
              ? { ...window, isImmersive: false }
              : window,
        ),
      )
    },
    [readerWindows],
  )

  const prepareRootSelection = useCallback(
    (sourceSelection: ThoughtSourceSelection): ThoughtSourceSelection => ({
      ...sourceSelection,
      sourceReaderWindowId: sourceSelection.sourceReaderWindowId ?? getActiveReaderWindowId(),
      anchorRect: screenRectToCanvasRect(
        sourceSelection.anchorRect,
        viewport,
        workspaceRef.current?.getBoundingClientRect(),
      ),
    }),
    [getActiveReaderWindowId, viewport],
  )

  const runAction = useCallback(
    (sourceSelection: ThoughtSourceSelection, action: ThoughtActionDefinition) => {
      graph.createAiNode(prepareRootSelection(sourceSelection), action, { mode: 'inline' })
      clearSelection()
    },
    [clearSelection, graph, prepareRootSelection],
  )

  const runAllActions = useCallback(
    (sourceSelection: ThoughtSourceSelection) => {
      graph.createAiNodes(prepareRootSelection(sourceSelection), actions, { mode: 'inline' })
      clearSelection()
    },
    [actions, clearSelection, graph, prepareRootSelection],
  )

  const createNote = useCallback(
    (sourceSelection: ThoughtSourceSelection) => {
      graph.createNoteNode(prepareRootSelection(sourceSelection), { mode: 'sidebar-card' })
      clearSelection()
    },
    [clearSelection, graph, prepareRootSelection],
  )

  const moveNode = useCallback(
    (nodeId: string, position: ThoughtPoint) => {
      const currentNode = graph.nodes.find((node) => node.id === nodeId)
      const currentPosition = currentNode?.view.position
      const delta =
        currentPosition
          ? {
              x: position.x - currentPosition.x,
              y: position.y - currentPosition.y,
            }
          : { x: 0, y: 0 }

      graph.updateNodeView(nodeId, { position })

      if (delta.x === 0 && delta.y === 0) return

      const descendantNodeIds = getDescendantNodeIds(graph.nodes, nodeId)
      graph.nodes.forEach((node) => {
        if (!descendantNodeIds.has(node.id) || node.view.mode !== 'window') return
        const childPosition = node.view.position
        if (!childPosition) return

        graph.updateNodeView(node.id, {
          position: {
            x: childPosition.x + delta.x,
            y: childPosition.y + delta.y,
          },
        })
      })
    },
    [graph.nodes, graph.updateNodeView],
  )

  const clearGraph = useCallback(() => {
    graph.clearNodes()
    if (typeof window !== 'undefined') {
      clearStoredThoughtGraph(window.localStorage, identity)
    }
  }, [graph, identity])
  const sidebarVisible = graph.nodes.some(
    (node) => node.view.status !== 'closed' && node.view.mode === 'sidebar-card',
  )

  return (
    <div
      ref={workspaceRef}
      className={cn(
        'relative h-[calc(100vh-9rem)] min-h-[720px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100',
        className,
      )}
    >
      {persistenceError ? (
        <div className="fixed right-4 top-14 z-[1000] max-w-sm rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive shadow-lg">
          {persistenceError}
        </div>
      ) : null}
      <ThoughtCanvas
        nodes={graph.nodes}
        actions={actions}
        hidden={canvasHidden}
        chromeHidden={Boolean(immersiveReaderWindowId)}
        viewport={viewport}
        onViewportChange={setViewport}
        readerWindowIds={visibleReaderWindowIds}
        toolbar={
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-slate-700 shadow-xl backdrop-blur">
            <div className="flex items-center gap-2 pr-1 text-xs font-semibold">
              <BookOpenText className="h-4 w-4" />
              Spatial Reader
              <Badge variant="secondary">
                {hasCanvasContent ? identity.readerType : openReaderWindowCount}
              </Badge>
            </div>
            {fixtureOptions && fixtureOptions.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-2">
                    <Plus className="h-4 w-4" />
                    打开文件
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>选择要在画布上打开的文件</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {fixtureOptions.map((option) => {
                    const isActive = option.id === activeFixtureId
                    return (
                      <DropdownMenuItem
                        key={option.id}
                        onSelect={() => onSelectFixture?.(option.id)}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-0.5 text-slate-500">{option.icon}</span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <span className="truncate">{option.label}</span>
                            {option.type ? (
                              <Badge variant="outline" className="text-[10px]">
                                {option.type}
                              </Badge>
                            ) : null}
                          </span>
                          {option.description ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                        {isActive ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : null}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-2"
                onClick={() => duplicateReaderWindow(activeReaderWindowId)}
              >
                <Plus className="h-4 w-4" />
                新窗口
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8"
              onClick={() => setViewport(DEFAULT_CANVAS_VIEWPORT)}
              aria-label="重置画布"
              title="重置画布"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            {!hasCanvasContent && openReaderWindowCount > 1 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8"
                  onClick={() => layoutReaderWindows('scatter')}
                  aria-label="随机散落阅读窗口"
                  title="随机散落"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8"
                  onClick={() => layoutReaderWindows('grid')}
                  aria-label="网格排布阅读窗口"
                  title="网格排布"
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
              </>
            ) : null}
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Network className="h-4 w-4" />
              {graph.nodes.filter((node) => node.view.status !== 'closed').length}
            </div>
          </div>
        }
        onMoveNode={moveNode}
        onResizeNode={(nodeId, size) => graph.updateNodeView(nodeId, { size })}
        onBringNodeToFront={graph.bringNodeToFront}
        onOpenNode={(nodeId) => {
          graph.setNodeMode(nodeId, 'window')
          graph.bringNodeToFront(nodeId)
        }}
        onMinimizeNode={(nodeId) => graph.updateNodeView(nodeId, { status: 'minimized' })}
        onCloseNode={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
        onSendNodeToSidebar={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
        onCreateChildNode={(sourceSelection, action, sourceNode, view) => {
          graph.createAiNode(sourceSelection, action, {
            mode: 'inline',
            sourceNode,
            view,
          })
        }}
        onCreateChildNodes={(sourceSelection, sourceNode, view) => {
          graph.createAiNodes(sourceSelection, actions, {
            mode: 'inline',
            sourceNode,
            view,
          })
        }}
      >
        {canvasContent
          ? canvasContent(runtimeProps)
          : renderedReaderWindows.map((readerWindow) => (
              <SpatialReaderWindow
                key={readerWindow.id}
                window={readerWindow}
                viewport={viewport}
                workspaceSize={workspaceSize}
                canClose={openReaderWindowCount > 1}
                onActivate={activateReaderWindow}
                onMove={moveReaderWindow}
                onResize={resizeReaderWindow}
                onMinimize={minimizeReaderWindow}
                onClose={closeReaderWindow}
                onToggleMaximize={toggleReaderWindowMaximize}
                onToggleImmersive={toggleReaderWindowImmersive}
                onDuplicate={duplicateReaderWindow}
              >
                {children?.(runtimeProps, readerWindow)}
              </SpatialReaderWindow>
            ))}
      </ThoughtCanvas>
      {immersiveReaderWindow ? (
        <div
          data-spatial-interactive
          className="absolute right-4 top-4 z-[1000] rounded-full border border-slate-200 bg-white/90 p-1 text-slate-600 shadow-xl backdrop-blur transition-opacity hover:bg-white hover:text-slate-950"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 rounded-full"
            onClick={() => toggleReaderWindowImmersive(immersiveReaderWindow.id)}
            aria-label="退出沉浸阅读"
            title="退出沉浸阅读"
          >
            <Shrink className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      {sidebarVisible && !immersiveReaderWindow ? (
        <ThoughtSidebar
          nodes={graph.nodes}
          className="absolute bottom-28 right-4 top-16 z-[70] hidden h-auto min-h-0 w-[340px] rounded-xl border border-slate-200 bg-background/95 shadow-2xl backdrop-blur xl:flex"
          onOpenNode={(nodeId) => {
            graph.setNodeMode(nodeId, 'window')
            graph.bringNodeToFront(nodeId)
          }}
          onSendNodeToSidebar={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
          onCloseNode={(nodeId) => graph.updateNodeView(nodeId, { status: 'closed' })}
          onDeleteNode={graph.deleteNode}
        />
      ) : null}
      <SpatialSelectionOverlay
        selection={selection}
        actions={actions}
        onRunAction={runAction}
        onRunAll={runAllActions}
        onCreateNote={createNote}
        onDismiss={clearSelection}
      />
      {!immersiveReaderWindow ? (
        <ThoughtDock
          nodes={graph.nodes}
          readerWindows={readerWindows}
          canvasHidden={canvasHidden}
          onToggleCanvas={() => setCanvasHidden((value) => !value)}
          onOpenReaderWindow={activateReaderWindow}
          onOpenNode={(nodeId) => {
            graph.setNodeMode(nodeId, 'window')
            graph.bringNodeToFront(nodeId)
          }}
          onClear={clearGraph}
        />
      ) : null}
    </div>
  )
}
