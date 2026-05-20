'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Maximize2, Minimize2, Minus, PanelRight, X } from 'lucide-react'

import { renderReaderQuoteHighlights } from '@/components/reader-platform/dom-highlights'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { ThoughtActionIcon } from './thought-action-bar'
import type { ThoughtNode, ThoughtPoint, ThoughtSourceSelection } from './thought-graph'
import {
  getThoughtAnnotationFingerprint,
  getThoughtAnnotations,
  getThoughtHighlightElementId,
  getThoughtWindowElementId,
} from './thought-graph'

const THOUGHT_MAXIMIZE_MARGIN_X = 24
const THOUGHT_MAXIMIZE_MARGIN_TOP = 72
const THOUGHT_MAXIMIZE_MARGIN_BOTTOM = 104
const MIN_THOUGHT_WINDOW_WIDTH = 300
const MIN_THOUGHT_WINDOW_HEIGHT = 220

function getTextOffset(root: Node, target: Node, targetOffset: number) {
  let offset = 0
  let found = false

  const visit = (node: Node): boolean => {
    if (node === target) {
      if (node.nodeType === Node.TEXT_NODE) {
        offset += targetOffset
      } else {
        const children = Array.from(node.childNodes).slice(0, targetOffset)
        offset += children.reduce((sum, child) => sum + (child.textContent?.length ?? 0), 0)
      }
      found = true
      return true
    }

    if (node.nodeType === Node.TEXT_NODE) {
      offset += node.textContent?.length ?? 0
      return false
    }

    for (const child of Array.from(node.childNodes)) {
      if (visit(child)) return true
    }

    return false
  }

  visit(root)
  return found ? offset : null
}

function getRangeQuoteContext(root: HTMLElement, range: Range, rawText: string, text: string) {
  const wholeText = root.textContent ?? ''
  const startOffset = getTextOffset(root, range.startContainer, range.startOffset)
  const endOffset = getTextOffset(root, range.endContainer, range.endOffset)

  if (startOffset === null || endOffset === null) {
    return {
      exact: text,
    }
  }

  const leadingTrim = rawText.length - rawText.trimStart().length
  const trailingTrim = rawText.length - rawText.trimEnd().length
  const startIndex = startOffset + leadingTrim
  const endIndex = Math.max(startIndex, endOffset - trailingTrim)

  return {
    exact: wholeText.slice(startIndex, endIndex).trim() || text,
    prefix: wholeText.slice(Math.max(0, startIndex - 80), startIndex),
    suffix: wholeText.slice(endIndex, endIndex + 80),
  }
}

function getMaximizedThoughtFrame(element: HTMLElement | null, canvasZoom: number) {
  const canvasElement = element?.closest<HTMLElement>('[data-spatial-canvas]')
  const coordinateRoot = element?.parentElement
  if (!canvasElement || !coordinateRoot) return null

  const canvasRect = canvasElement.getBoundingClientRect()
  const rootRect = coordinateRoot.getBoundingClientRect()
  const zoom = Math.max(0.2, canvasZoom)

  return {
    position: {
      x: (canvasRect.left + THOUGHT_MAXIMIZE_MARGIN_X - rootRect.left) / zoom,
      y: (canvasRect.top + THOUGHT_MAXIMIZE_MARGIN_TOP - rootRect.top) / zoom,
    },
    size: {
      width: Math.max(
        MIN_THOUGHT_WINDOW_WIDTH,
        (canvasRect.width - THOUGHT_MAXIMIZE_MARGIN_X * 2) / zoom,
      ),
      height: Math.max(
        MIN_THOUGHT_WINDOW_HEIGHT,
        (canvasRect.height - THOUGHT_MAXIMIZE_MARGIN_TOP - THOUGHT_MAXIMIZE_MARGIN_BOTTOM) / zoom,
      ),
    },
  }
}

export function ThoughtWindow({
  node,
  onBringToFront,
  onOpenNode,
  onMove,
  onResize,
  onMinimize,
  onClose,
  onSendToSidebar,
  onWindowSelection,
  canvasZoom = 1,
  childNodes,
}: {
  node: ThoughtNode
  onBringToFront: (nodeId: string) => void
  onOpenNode: (nodeId: string) => void
  onMove: (nodeId: string, position: ThoughtPoint) => void
  onResize?: (nodeId: string, size: { width: number; height: number }) => void
  onMinimize: (nodeId: string) => void
  onClose: (nodeId: string) => void
  onSendToSidebar: (nodeId: string) => void
  onWindowSelection: (selection: ThoughtSourceSelection, sourceNode: ThoughtNode) => void
  canvasZoom?: number
  childNodes: ThoughtNode[]
}) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const dragStartRef = useRef<ThoughtPoint>({ x: 0, y: 0 })
  const resizeStartRef = useRef<ThoughtPoint>({ x: 0, y: 0 })
  const positionStartRef = useRef<ThoughtPoint>(node.view.position ?? { x: 80, y: 120 })
  const sizeStartRef = useRef<{ width: number; height: number }>(
    node.view.size ?? { width: 380, height: 300 },
  )
  const restoreFrameRef = useRef<{
    position: ThoughtPoint
    size: { width: number; height: number }
  } | null>(null)
  const windowRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const position = node.view.position ?? { x: 80, y: 120 }
  const size = node.view.size ?? { width: 380, height: 300 }
  const childAnnotationFingerprint = getThoughtAnnotationFingerprint(childNodes)
  const childAnnotations = useMemo(
    () => getThoughtAnnotations(childNodes),
    [childAnnotationFingerprint],
  )

  const toggleMaximize = () => {
    onBringToFront(node.id)
    if (!onResize) return

    if (maximized && restoreFrameRef.current) {
      onMove(node.id, restoreFrameRef.current.position)
      onResize(node.id, restoreFrameRef.current.size)
      restoreFrameRef.current = null
      setMaximized(false)
      return
    }

    const maximizedFrame = getMaximizedThoughtFrame(windowRef.current, canvasZoom)
    if (!maximizedFrame) return

    restoreFrameRef.current = { position, size }
    onMove(node.id, maximizedFrame.position)
    onResize(node.id, maximizedFrame.size)
    setMaximized(true)
  }

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    renderReaderQuoteHighlights(body, childAnnotations)

    const childNodeIds = new Set(childAnnotations.map((annotation) => annotation.id))
    const seen = new Set<string>()
    body.querySelectorAll<HTMLElement>('[data-reader-annotation-id]').forEach((element) => {
      const nodeId = element.dataset.readerAnnotationId
      if (!nodeId || !childNodeIds.has(nodeId)) return

      element.dataset.readerThoughtId = nodeId
      element.classList.add('cursor-pointer', 'ring-1', 'ring-primary/20')
      element.title = '点击打开对应子节点'
      if (!seen.has(nodeId)) {
        element.id = getThoughtHighlightElementId(nodeId)
        seen.add(nodeId)
      }
      element.onclick = (event) => {
        event.stopPropagation()
        onOpenNode(nodeId)
      }
    })
  }, [childAnnotations, node.contentMarkdown, onOpenNode])

  useEffect(() => {
    if (!dragging) return

    const handlePointerMove = (event: PointerEvent) => {
      const zoom = Math.max(0.2, canvasZoom)
      onMove(node.id, {
        x: positionStartRef.current.x + (event.clientX - dragStartRef.current.x) / zoom,
        y: positionStartRef.current.y + (event.clientY - dragStartRef.current.y) / zoom,
      })
    }

    const handlePointerUp = () => setDragging(false)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [canvasZoom, dragging, node.id, onMove])

  useEffect(() => {
    if (!resizing || !onResize) return

    const handlePointerMove = (event: PointerEvent) => {
      const zoom = Math.max(0.2, canvasZoom)
      onResize(node.id, {
        width: Math.max(300, sizeStartRef.current.width + (event.clientX - resizeStartRef.current.x) / zoom),
        height: Math.max(220, sizeStartRef.current.height + (event.clientY - resizeStartRef.current.y) / zoom),
      })
    }

    const handlePointerUp = () => setResizing(false)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [canvasZoom, node.id, onResize, resizing])

  const captureWindowSelection = () => {
    window.requestAnimationFrame(() => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return

      const range = selection.getRangeAt(0)
      const body = bodyRef.current
      if (!body || !body.contains(range.commonAncestorContainer)) return

      const rawText = selection.toString()
      const text = rawText.trim()
      if (!text) return

      const rect =
        Array.from(range.getClientRects()).find(
          (item) => item.width > 0 && item.height > 0,
        ) ?? range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return

      const quote = getRangeQuoteContext(body, range, rawText, text)
      onWindowSelection(
        {
          text: quote.exact,
          sourceNodeId: node.id,
          anchorRect: {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          range: {
            start: node.sourceRange.start,
            end: node.sourceRange.end,
            quote,
          },
        },
        node,
      )
    })
  }

  return (
    <section
      ref={windowRef}
      id={getThoughtWindowElementId(node.id)}
      data-spatial-window
      data-spatial-interactive
      className={cn(
        'pointer-events-auto absolute flex min-h-[220px] min-w-[300px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-[0_24px_58px_-28px_rgba(15,23,42,0.52),0_0_0_1px_rgba(226,232,240,0.72)]',
        (dragging || resizing) && 'transition-none',
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: node.view.zIndex,
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('button')) return
        onBringToFront(node.id)
      }}
    >
      <header
        className={cn(
          'flex h-9 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3',
          maximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        )}
        onDoubleClick={(event) => {
          event.preventDefault()
          toggleMaximize()
        }}
        onPointerDown={(event) => {
          if (maximized) return
          if ((event.target as HTMLElement).closest('button')) return
          event.preventDefault()
          event.stopPropagation()
          setDragging(true)
          dragStartRef.current = { x: event.clientX, y: event.clientY }
          positionStartRef.current = position
          onBringToFront(node.id)
        }}
      >
        <div className="flex items-center gap-1.5" onDoubleClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="flex h-3 w-3 items-center justify-center rounded-full border border-[#e0443e] bg-[#ff5f56] text-transparent transition hover:text-black/50"
            onClick={(event) => {
              event.stopPropagation()
              onClose(node.id)
            }}
            aria-label="关闭节点窗口"
            title="关闭"
          >
            <X className="h-2 w-2" />
          </button>
          <button
            type="button"
            className="flex h-3 w-3 items-center justify-center rounded-full border border-[#dea123] bg-[#ffbd2e] text-transparent transition hover:text-black/50"
            onClick={(event) => {
              event.stopPropagation()
              onMinimize(node.id)
            }}
            aria-label="最小化节点窗口"
            title="最小化"
          >
            <Minus className="h-2 w-2" />
          </button>
          <button
            type="button"
            className="flex h-3 w-3 items-center justify-center rounded-full border border-[#1aab29] bg-[#27c93f] text-transparent transition hover:text-black/50"
            onClick={(event) => {
              event.stopPropagation()
              toggleMaximize()
            }}
            aria-label={maximized ? '还原节点窗口' : '放大节点窗口'}
            title={maximized ? '还原' : '放大'}
          >
            {maximized ? <Minimize2 className="h-2 w-2" /> : <Maximize2 className="h-2 w-2" />}
          </button>
        </div>
        <div
          className={cn(
            'ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
            node.kind === 'note'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-slate-100 text-slate-700',
          )}
        >
          {node.kind === 'note' ? <PanelRight className="h-4 w-4" /> : <ThoughtActionIcon actionId={node.action.id} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium leading-none text-slate-700">
            {node.kind === 'note' ? '笔记' : node.action.label}
          </div>
          <div className="mt-0.5 truncate text-[10px] text-slate-400">
            {node.status === 'streaming' ? '正在生成...' : node.sourceText}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onSendToSidebar(node.id)}
            aria-label="切到侧栏"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onMinimize(node.id)}
            aria-label="最小化"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleMaximize}
            aria-label={maximized ? '还原' : '放大'}
          >
            {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onClose(node.id)}
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div
        ref={bodyRef}
        data-thought-window-body
        className="min-h-0 flex-1 overflow-auto px-4 py-3 text-sm leading-6 text-slate-700"
        onPointerUp={captureWindowSelection}
        onKeyUp={captureWindowSelection}
      >
        {node.kind === 'ai-result' && node.status === 'pending' ? (
          <p className="text-muted-foreground">正在排队生成...</p>
        ) : null}
        {node.kind === 'ai-result' && node.error ? (
          <p className="text-destructive">{node.error}</p>
        ) : null}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {node.contentMarkdown || (node.kind === 'note' ? node.sourceText : '')}
          </ReactMarkdown>
        </div>
      </div>

      {onResize ? (
        <div
          data-spatial-interactive
          className="absolute bottom-0 right-0 h-6 w-6 cursor-nwse-resize"
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.preventDefault()
            event.stopPropagation()
            onBringToFront(node.id)
            setMaximized(false)
            restoreFrameRef.current = null
            setResizing(true)
            resizeStartRef.current = { x: event.clientX, y: event.clientY }
            sizeStartRef.current = size
          }}
          aria-label="调整窗口大小"
          title="调整大小"
        >
          <div className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-br-[3px] border-b-2 border-r-2 border-slate-400/70" />
        </div>
      ) : null}
    </section>
  )
}
