'use client'

import { useEffect, useState, type RefObject } from 'react'

import type { ThoughtNode } from './thought-graph'
import {
  getSpatialReaderWindowElementId,
  getThoughtHighlightElementId,
  getThoughtWindowElementId,
} from './thought-graph'

interface ThoughtConnection {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  colorClass: string
  zIndex: number
}

const colorClassByAction: Record<string, string> = {
  translate: 'stroke-sky-400',
  explain: 'stroke-violet-400',
  formula: 'stroke-emerald-400',
  related: 'stroke-pink-400',
}
const emptyReaderWindowIds: string[] = []
const WINDOW_HEADER_DOCK_Y = 42

interface VisibleReaderHighlight {
  rects: DOMRect[]
  zIndex: number
}

function getThoughtConnectionZIndex(sourceZIndex: number, targetZIndex: number) {
  return targetZIndex < sourceZIndex
    ? Math.max(0, targetZIndex - 1)
    : sourceZIndex + 1
}

function intersects(a: DOMRect, b: DOMRect) {
  return a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right
}

function getElementCenter(element: Element) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function getElementZIndex(element: Element) {
  const zIndex = Number.parseInt(window.getComputedStyle(element).zIndex, 10)
  return Number.isFinite(zIndex) ? zIndex : 0
}

function screenPointToCanvasPoint(
  point: { x: number; y: number },
  coordinateRoot: HTMLElement,
  canvasZoom: number,
) {
  const rootRect = coordinateRoot.getBoundingClientRect()
  const zoom = Math.max(0.2, canvasZoom)
  return {
    x: (point.x - rootRect.left) / zoom,
    y: (point.y - rootRect.top) / zoom,
  }
}

function getWindowDockPoint(
  element: Element,
  source: { x: number; y: number },
  canvasZoom: number,
) {
  const rect = element.getBoundingClientRect()
  const useRightEdge = source.x > rect.left + rect.width / 2

  return {
    x: useRightEdge ? rect.right : rect.left,
    y: rect.top + WINDOW_HEADER_DOCK_Y * Math.max(0.2, canvasZoom),
  }
}

function getRectCenter(rect: DOMRect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function getDistanceSquared(a: { x: number; y: number }, b: { x: number; y: number }) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
}

function getReaderViewportRect(readerElement: HTMLElement) {
  const viewportElement = readerElement.querySelector<HTMLElement>('[data-spatial-reader-viewport]')
  return (viewportElement ?? readerElement).getBoundingClientRect()
}

function getThoughtWindowViewportRect(windowElement: HTMLElement) {
  const viewportElement = windowElement.querySelector<HTMLElement>('[data-thought-window-body]')
  return (viewportElement ?? windowElement).getBoundingClientRect()
}

function getBrowserViewportRect() {
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight)
}

function isScrollableElement(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  const overflow = `${style.overflowX} ${style.overflowY}`
  return /(auto|scroll|overlay)/.test(overflow) && (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  )
}

function getNearestViewportRect(element: HTMLElement) {
  let current = element.parentElement

  while (current) {
    if (isScrollableElement(current)) return current.getBoundingClientRect()
    current = current.parentElement
  }

  return getBrowserViewportRect()
}

function getNearestHighlightPoint({
  highlightRects,
  targetElement,
}: {
  highlightRects: DOMRect[]
  targetElement: Element
}) {
  const targetCenter = getElementCenter(targetElement)

  if (highlightRects.length === 0) return null

  const nearestRect = highlightRects.reduce((nearest, rect) =>
    getDistanceSquared(getRectCenter(rect), targetCenter) <
    getDistanceSquared(getRectCenter(nearest), targetCenter)
      ? rect
      : nearest,
  )

  return getRectCenter(nearestRect)
}

function getHighlightElements(root: ParentNode, node: ThoughtNode) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      [
        `#${CSS.escape(getThoughtHighlightElementId(node.id))}`,
        `[data-reader-thought-id="${CSS.escape(node.id)}"]`,
        `[data-reader-annotation-id="${CSS.escape(node.id)}"]`,
      ].join(','),
    ),
  )
}

function getVisibleHighlightInRoot({
  node,
  root,
  viewportRect,
  zIndex,
}: {
  node: ThoughtNode
  root: ParentNode
  viewportRect: DOMRect
  zIndex: number
}): VisibleReaderHighlight | null {
  const highlightElements = getHighlightElements(root, node)

  if (highlightElements.length === 0) return null

  const rects = highlightElements.flatMap((element) =>
    Array.from(element.getClientRects()).filter(
      (rect) => rect.width > 0 && rect.height > 0 && intersects(rect, viewportRect),
    ),
  )

  if (rects.length === 0) return null

  return {
    rects,
    zIndex,
  }
}

function getVisibleReaderHighlight(
  node: ThoughtNode,
  readerWindowIds: string[],
): VisibleReaderHighlight | null {
  const readerWindowId = node.sourceReaderWindowId ?? readerWindowIds[0]
  if (
    node.sourceReaderWindowId &&
    readerWindowIds.length > 0 &&
    !readerWindowIds.includes(node.sourceReaderWindowId)
  ) {
    return null
  }

  const readerElement = readerWindowId
    ? document.getElementById(getSpatialReaderWindowElementId(readerWindowId))
    : null
  if (readerWindowId && !readerElement && readerWindowIds.length > 0) return null

  const searchRoot: ParentNode = readerElement ?? document

  const firstHighlightElement = getHighlightElements(searchRoot, node)[0]
  if (!firstHighlightElement) return null

  const viewportRect = readerElement
    ? getReaderViewportRect(readerElement)
    : getNearestViewportRect(firstHighlightElement)
  return getVisibleHighlightInRoot({
    node,
    root: searchRoot,
    viewportRect,
    zIndex: readerElement ? getElementZIndex(readerElement) : 0,
  })
}

function getVisibleThoughtWindowHighlight(
  node: ThoughtNode,
  sourceNode: ThoughtNode,
): VisibleReaderHighlight | null {
  const sourceElement = document.getElementById(getThoughtWindowElementId(sourceNode.id))
  if (!sourceElement) return null

  return getVisibleHighlightInRoot({
    node,
    root: sourceElement,
    viewportRect: getThoughtWindowViewportRect(sourceElement),
    zIndex: sourceNode.view.zIndex,
  })
}

function resolveReaderSourceAnchor(
  node: ThoughtNode,
  readerWindowIds: string[],
  targetElement: Element,
) {
  const highlight = getVisibleReaderHighlight(node, readerWindowIds)
  if (!highlight) return null

  const point = getNearestHighlightPoint({
    highlightRects: highlight.rects,
    targetElement,
  })
  if (!point) return null

  return {
    point,
    zIndex: highlight.zIndex,
  }
}

function resolveSourceAnchor(
  node: ThoughtNode,
  nodes: ThoughtNode[],
  readerWindowIds: string[],
  targetElement: Element,
) {
  if (node.sourceNodeId) {
    const sourceNode = nodes.find((candidate) => candidate.id === node.sourceNodeId)
    if (!sourceNode || sourceNode.view.mode !== 'window' || sourceNode.view.status !== 'open') {
      return null
    }

    const highlight = getVisibleThoughtWindowHighlight(node, sourceNode)
    if (!highlight) return null

    const point = getNearestHighlightPoint({
      highlightRects: highlight.rects,
      targetElement,
    })
    if (!point) return null
    return {
      point,
      zIndex: highlight.zIndex,
    }
  }

  return resolveReaderSourceAnchor(node, readerWindowIds, targetElement)
}

export function getVisibleThoughtWindowNodeIds(nodes: ThoughtNode[], readerWindowIds: string[]) {
  const visibleNodeIds = new Set<string>()
  let changed = true

  while (changed) {
    changed = false

    nodes.forEach((node) => {
      if (
        visibleNodeIds.has(node.id) ||
        node.view.mode !== 'window' ||
        node.view.status !== 'open'
      ) {
        return
      }

      if (node.sourceNodeId) {
        const sourceNode = nodes.find((candidate) => candidate.id === node.sourceNodeId)
        if (
          sourceNode &&
          visibleNodeIds.has(node.sourceNodeId) &&
          getVisibleThoughtWindowHighlight(node, sourceNode)
        ) {
          visibleNodeIds.add(node.id)
          changed = true
        }
        return
      }

      if (getVisibleReaderHighlight(node, readerWindowIds)) {
        visibleNodeIds.add(node.id)
        changed = true
      }
    })
  }

  return visibleNodeIds
}

export function ThoughtConnectionLines({
  nodes,
  readerWindowIds = emptyReaderWindowIds,
  coordinateRootRef,
  canvasZoom,
}: {
  nodes: ThoughtNode[]
  readerWindowIds?: string[]
  coordinateRootRef: RefObject<HTMLElement | null>
  canvasZoom: number
}) {
  const [connections, setConnections] = useState<ThoughtConnection[]>([])

  useEffect(() => {
    let frameId = 0

    const update = () => {
      const coordinateRoot = coordinateRootRef.current
      if (!coordinateRoot) {
        setConnections([])
        frameId = window.requestAnimationFrame(update)
        return
      }

      const nextConnections = nodes
        .filter((node) => node.view.mode === 'window' && node.view.status === 'open')
        .map((node): ThoughtConnection | null => {
          const targetElement = document.getElementById(getThoughtWindowElementId(node.id))
          if (!targetElement) return null

          const source = resolveSourceAnchor(node, nodes, readerWindowIds, targetElement)
          if (!source) return null

          const from = screenPointToCanvasPoint(source.point, coordinateRoot, canvasZoom)
          const to = screenPointToCanvasPoint(
            getWindowDockPoint(targetElement, source.point, canvasZoom),
            coordinateRoot,
            canvasZoom,
          )
          return {
            id: node.id,
            from,
            to,
            colorClass:
              node.kind === 'ai-result'
                ? colorClassByAction[node.action.id] ?? 'stroke-primary'
                : 'stroke-yellow-400',
            zIndex: getThoughtConnectionZIndex(source.zIndex, node.view.zIndex),
          }
        })
        .filter((connection): connection is ThoughtConnection => Boolean(connection))

      setConnections((current) => {
        const currentHash = JSON.stringify(current)
        const nextHash = JSON.stringify(nextConnections)
        return currentHash === nextHash ? current : nextConnections
      })

      frameId = window.requestAnimationFrame(update)
    }

    update()
    return () => window.cancelAnimationFrame(frameId)
  }, [canvasZoom, coordinateRootRef, nodes, readerWindowIds])

  return (
    <>
      {connections.map((connection) => {
        const midX = connection.from.x + (connection.to.x - connection.from.x) / 2
        const path = `M ${connection.from.x} ${connection.from.y} C ${midX} ${connection.from.y}, ${midX} ${connection.to.y}, ${connection.to.x} ${connection.to.y}`

        return (
          <svg
            key={connection.id}
            className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-visible"
            style={{ zIndex: connection.zIndex }}
          >
            <path
              d={path}
              className={`${connection.colorClass} fill-none opacity-75 drop-shadow-sm`}
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )
      })}
    </>
  )
}
