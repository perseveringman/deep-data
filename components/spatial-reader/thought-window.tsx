'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Grip, Maximize2, Minus, PanelRight, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { ThoughtActionIcon } from './thought-action-bar'
import type { ThoughtNode, ThoughtPoint, ThoughtSourceSelection } from './thought-graph'
import { getThoughtWindowElementId } from './thought-graph'

export function ThoughtWindow({
  node,
  onBringToFront,
  onMove,
  onMinimize,
  onClose,
  onSendToSidebar,
  onWindowSelection,
}: {
  node: ThoughtNode
  onBringToFront: (nodeId: string) => void
  onMove: (nodeId: string, position: ThoughtPoint) => void
  onMinimize: (nodeId: string) => void
  onClose: (nodeId: string) => void
  onSendToSidebar: (nodeId: string) => void
  onWindowSelection: (selection: ThoughtSourceSelection, sourceNode: ThoughtNode) => void
}) {
  const [dragging, setDragging] = useState(false)
  const dragStartRef = useRef<ThoughtPoint>({ x: 0, y: 0 })
  const positionStartRef = useRef<ThoughtPoint>(node.view.position ?? { x: 80, y: 120 })
  const bodyRef = useRef<HTMLDivElement>(null)
  const position = node.view.position ?? { x: 80, y: 120 }
  const size = node.view.size ?? { width: 380, height: 300 }

  useEffect(() => {
    if (!dragging) return

    const handlePointerMove = (event: PointerEvent) => {
      onMove(node.id, {
        x: positionStartRef.current.x + event.clientX - dragStartRef.current.x,
        y: positionStartRef.current.y + event.clientY - dragStartRef.current.y,
      })
    }

    const handlePointerUp = () => setDragging(false)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging, node.id, onMove])

  const captureWindowSelection = () => {
    window.requestAnimationFrame(() => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return

      const range = selection.getRangeAt(0)
      const body = bodyRef.current
      if (!body || !body.contains(range.commonAncestorContainer)) return

      const text = selection.toString().trim()
      if (!text) return

      const rect = range.getBoundingClientRect()
      onWindowSelection(
        {
          text,
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
            quote: {
              exact: text,
            },
          },
        },
        node,
      )
    })
  }

  return (
    <section
      id={getThoughtWindowElementId(node.id)}
      className="pointer-events-auto fixed overflow-hidden rounded-2xl border bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/85"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        minHeight: 180,
        maxHeight: size.height,
        zIndex: node.view.zIndex,
      }}
      onPointerDown={() => onBringToFront(node.id)}
    >
      <header
        className="flex cursor-grab items-center gap-2 border-b bg-muted/40 px-2 py-2 active:cursor-grabbing"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return
          setDragging(true)
          dragStartRef.current = { x: event.clientX, y: event.clientY }
          positionStartRef.current = position
          onBringToFront(node.id)
        }}
      >
        <Grip className="h-4 w-4 text-muted-foreground" />
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-white',
            node.kind === 'note' ? 'bg-yellow-500' : 'bg-primary',
          )}
        >
          {node.kind === 'note' ? <PanelRight className="h-4 w-4" /> : <ThoughtActionIcon actionId={node.action.id} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {node.kind === 'note' ? '笔记' : node.action.label}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
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
            onClick={() => onBringToFront(node.id)}
            aria-label="置顶"
          >
            <Maximize2 className="h-4 w-4" />
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
        className="max-h-[240px] overflow-auto px-4 py-3 text-sm leading-6"
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
    </section>
  )
}

