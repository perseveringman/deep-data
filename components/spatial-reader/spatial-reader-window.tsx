'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BookOpenText, Copy, Fullscreen, Maximize2, Minimize2, Minus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReaderChromeActionsProvider } from '@/components/reader-platform/ui/reader-chrome-actions'
import { cn } from '@/lib/utils'

import type { SpatialCanvasViewport } from './thought-canvas'
import type { ThoughtPoint, ThoughtSize } from './thought-graph'
import { getSpatialReaderWindowElementId } from './thought-graph'

export interface SpatialReaderWindowState {
  id: string
  title: string
  subtitle?: string
  metadata?: Record<string, unknown>
  position: ThoughtPoint
  size: ThoughtSize
  status: 'open' | 'minimized' | 'closed'
  isMaximized: boolean
  isImmersive?: boolean
  zIndex: number
}

const MAXIMIZED_SIDE_MARGIN = 18
const MAXIMIZED_TOP_MARGIN = 76
const DOCK_RESERVED_SPACE = 104
const MIN_READER_WINDOW_WIDTH = 620
const MIN_READER_WINDOW_HEIGHT = 420
const IMMERSIVE_READER_Z_INDEX = 160

type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

const RESIZE_HANDLES: Array<{
  handle: ResizeHandle
  className: string
  label: string
}> = [
  {
    handle: 'n',
    className: 'left-4 right-4 top-0 h-2 cursor-n-resize',
    label: '从上边缘调整阅读窗口大小',
  },
  {
    handle: 'e',
    className: 'bottom-4 right-0 top-4 w-2 cursor-e-resize',
    label: '从右边缘调整阅读窗口大小',
  },
  {
    handle: 's',
    className: 'bottom-0 left-4 right-4 h-2 cursor-s-resize',
    label: '从下边缘调整阅读窗口大小',
  },
  {
    handle: 'w',
    className: 'bottom-4 left-0 top-4 w-2 cursor-w-resize',
    label: '从左边缘调整阅读窗口大小',
  },
  {
    handle: 'nw',
    className: 'left-0 top-0 h-4 w-4 cursor-nwse-resize',
    label: '从左上角调整阅读窗口大小',
  },
  {
    handle: 'ne',
    className: 'right-0 top-0 h-4 w-4 cursor-nesw-resize',
    label: '从右上角调整阅读窗口大小',
  },
  {
    handle: 'se',
    className: 'bottom-0 right-0 h-6 w-6 cursor-nwse-resize',
    label: '从右下角调整阅读窗口大小',
  },
  {
    handle: 'sw',
    className: 'bottom-0 left-0 h-4 w-4 cursor-nesw-resize',
    label: '从左下角调整阅读窗口大小',
  },
]

function getCanvasScale(viewport: SpatialCanvasViewport) {
  return Math.max(0.2, viewport.zoom)
}

function getMaximizedFrame({
  viewport,
  workspaceSize,
}: {
  viewport: SpatialCanvasViewport
  workspaceSize: ThoughtSize
}) {
  const zoom = getCanvasScale(viewport)
  const width = Math.max(680, (workspaceSize.width - MAXIMIZED_SIDE_MARGIN * 2) / zoom)
  const height = Math.max(
    460,
    (workspaceSize.height - MAXIMIZED_TOP_MARGIN - DOCK_RESERVED_SPACE) / zoom,
  )

  return {
    x: (-viewport.x + MAXIMIZED_SIDE_MARGIN) / zoom,
    y: (-viewport.y + MAXIMIZED_TOP_MARGIN) / zoom,
    width,
    height,
  }
}

function getImmersiveFrame({
  viewport,
  workspaceSize,
}: {
  viewport: SpatialCanvasViewport
  workspaceSize: ThoughtSize
}) {
  const zoom = getCanvasScale(viewport)

  return {
    x: -viewport.x / zoom,
    y: -viewport.y / zoom,
    width: workspaceSize.width / zoom,
    height: workspaceSize.height / zoom,
  }
}

function getResizedFrame({
  handle,
  startPosition,
  startSize,
  delta,
}: {
  handle: ResizeHandle
  startPosition: ThoughtPoint
  startSize: ThoughtSize
  delta: ThoughtPoint
}) {
  let x = startPosition.x
  let y = startPosition.y
  let width = startSize.width
  let height = startSize.height

  if (handle.includes('w')) {
    width = Math.max(MIN_READER_WINDOW_WIDTH, startSize.width - delta.x)
    x = startPosition.x + startSize.width - width
  } else if (handle.includes('e')) {
    width = Math.max(MIN_READER_WINDOW_WIDTH, startSize.width + delta.x)
  }

  if (handle.includes('n')) {
    height = Math.max(MIN_READER_WINDOW_HEIGHT, startSize.height - delta.y)
    y = startPosition.y + startSize.height - height
  } else if (handle.includes('s')) {
    height = Math.max(MIN_READER_WINDOW_HEIGHT, startSize.height + delta.y)
  }

  return {
    position: { x, y },
    size: { width, height },
  }
}

export function SpatialReaderWindow({
  window: readerWindow,
  viewport,
  workspaceSize,
  children,
  canClose,
  onActivate,
  onMove,
  onResize,
  onMinimize,
  onClose,
  onToggleMaximize,
  onToggleImmersive,
  onDuplicate,
}: {
  window: SpatialReaderWindowState
  viewport: SpatialCanvasViewport
  workspaceSize: ThoughtSize
  children: ReactNode
  canClose: boolean
  onActivate: (windowId: string) => void
  onMove: (windowId: string, position: ThoughtPoint) => void
  onResize: (windowId: string, size: ThoughtSize) => void
  onMinimize: (windowId: string) => void
  onClose: (windowId: string) => void
  onToggleMaximize: (windowId: string) => void
  onToggleImmersive: (windowId: string) => void
  onDuplicate: (windowId: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)
  const [chromeActionsTarget, setChromeActionsTarget] = useState<HTMLElement | null>(null)
  const dragStartRef = useRef<ThoughtPoint>({ x: 0, y: 0 })
  const resizeStartRef = useRef<ThoughtPoint>({ x: 0, y: 0 })
  const positionStartRef = useRef<ThoughtPoint>(readerWindow.position)
  const sizeStartRef = useRef<ThoughtSize>(readerWindow.size)
  const isImmersive = Boolean(readerWindow.isImmersive)
  const frame = useMemo(
    () =>
      isImmersive
        ? getImmersiveFrame({ viewport, workspaceSize })
        : readerWindow.isMaximized
        ? getMaximizedFrame({ viewport, workspaceSize })
        : {
            x: readerWindow.position.x,
            y: readerWindow.position.y,
            width: readerWindow.size.width,
            height: readerWindow.size.height,
        },
    [
      isImmersive,
      viewport,
      readerWindow.isMaximized,
      readerWindow.position.x,
      readerWindow.position.y,
      readerWindow.size.height,
      readerWindow.size.width,
      workspaceSize,
    ],
  )

  useEffect(() => {
    if (!dragging) return

    const handlePointerMove = (event: PointerEvent) => {
      const zoom = getCanvasScale(viewport)
      onMove(readerWindow.id, {
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
  }, [dragging, onMove, viewport, readerWindow.id])

  useEffect(() => {
    if (!resizeHandle) return

    const handlePointerMove = (event: PointerEvent) => {
      const zoom = getCanvasScale(viewport)
      const nextFrame = getResizedFrame({
        handle: resizeHandle,
        startPosition: positionStartRef.current,
        startSize: sizeStartRef.current,
        delta: {
          x: (event.clientX - resizeStartRef.current.x) / zoom,
          y: (event.clientY - resizeStartRef.current.y) / zoom,
        },
      })

      if (
        nextFrame.position.x !== positionStartRef.current.x ||
        nextFrame.position.y !== positionStartRef.current.y
      ) {
        onMove(readerWindow.id, nextFrame.position)
      }
      onResize(readerWindow.id, nextFrame.size)
    }

    const handlePointerUp = () => setResizeHandle(null)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [onMove, onResize, resizeHandle, viewport, readerWindow.id])

  if (readerWindow.status !== 'open') return null

  return (
    <section
      id={getSpatialReaderWindowElementId(readerWindow.id)}
      data-spatial-window
      data-spatial-interactive
      data-spatial-reader-immersive={isImmersive ? 'true' : undefined}
      className={cn(
        'pointer-events-auto absolute flex flex-col overflow-hidden bg-white text-slate-950',
        isImmersive
          ? 'min-h-0 min-w-0 rounded-none border-0 shadow-none transition-opacity duration-200'
          : 'min-h-[420px] min-w-[620px] rounded-xl border border-slate-200 shadow-[0_28px_70px_-34px_rgba(15,23,42,0.55),0_0_0_1px_rgba(226,232,240,0.7)] transition-[box-shadow,opacity] duration-200',
        (dragging || resizeHandle) && 'transition-none',
        readerWindow.isMaximized && !isImmersive && 'rounded-b-xl rounded-t-lg',
      )}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        zIndex: isImmersive ? IMMERSIVE_READER_Z_INDEX : readerWindow.zIndex,
      }}
      onPointerDownCapture={() => onActivate(readerWindow.id)}
    >
      {!isImmersive ? (
        <header
          className="flex h-9 shrink-0 items-center border-b border-slate-200 bg-white px-3"
          onDoubleClick={(event) => {
            event.preventDefault()
            onToggleMaximize(readerWindow.id)
          }}
        >
          <div className="mr-3 flex items-center gap-1.5" onDoubleClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={cn(
                'flex h-3 w-3 items-center justify-center rounded-full border border-[#e0443e] bg-[#ff5f56] text-transparent transition hover:text-black/50',
                !canClose && 'cursor-default opacity-35 hover:text-transparent',
              )}
              onClick={(event) => {
                event.stopPropagation()
                if (canClose) onClose(readerWindow.id)
              }}
              aria-label="关闭阅读窗口"
            >
              <X className="h-2 w-2" />
            </button>
            <button
              type="button"
              className="flex h-3 w-3 items-center justify-center rounded-full border border-[#dea123] bg-[#ffbd2e] text-transparent transition hover:text-black/50"
              onClick={(event) => {
                event.stopPropagation()
                onMinimize(readerWindow.id)
              }}
              aria-label="最小化阅读窗口"
            >
              <Minus className="h-2 w-2" />
            </button>
            <button
              type="button"
              className="flex h-3 w-3 items-center justify-center rounded-full border border-[#1aab29] bg-[#27c93f] text-transparent transition hover:text-black/50"
              onClick={(event) => {
                event.stopPropagation()
                onToggleMaximize(readerWindow.id)
              }}
              aria-label={readerWindow.isMaximized ? '还原阅读窗口' : '放大阅读窗口'}
            >
              {readerWindow.isMaximized ? <Minimize2 className="h-2 w-2" /> : <Maximize2 className="h-2 w-2" />}
            </button>
          </div>

          <div
            className={cn(
              'flex h-full min-w-0 flex-1 cursor-grab items-center justify-center gap-2 active:cursor-grabbing',
              readerWindow.isMaximized && 'cursor-default active:cursor-default',
            )}
            onPointerDown={(event) => {
              if (event.button !== 0 || readerWindow.isMaximized) return
              if ((event.target as HTMLElement).closest('button')) return
              event.preventDefault()
              event.stopPropagation()
              onActivate(readerWindow.id)
              setDragging(true)
              dragStartRef.current = { x: event.clientX, y: event.clientY }
              positionStartRef.current = readerWindow.position
            }}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <BookOpenText className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 text-center">
              <div className="truncate text-[13px] font-medium leading-none text-slate-600">
                {readerWindow.title}
              </div>
              {readerWindow.subtitle ? (
                <div className="mt-0.5 truncate text-[10px] uppercase tracking-[0.08em] text-slate-400">
                  {readerWindow.subtitle}
                </div>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-2 h-7 w-7 text-slate-500 hover:bg-slate-100 hover:text-slate-900 [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={(event) => {
              event.stopPropagation()
              onToggleImmersive(readerWindow.id)
            }}
            aria-label="进入沉浸阅读"
            title="沉浸阅读"
          >
            <Fullscreen className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-slate-500 hover:bg-slate-100 hover:text-slate-900 [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={(event) => {
              event.stopPropagation()
              onDuplicate(readerWindow.id)
            }}
            aria-label="复制一个阅读窗口"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <div
            ref={setChromeActionsTarget}
            data-reader-chrome-actions
            className="ml-1 flex items-center gap-1"
            onDoubleClick={(event) => event.stopPropagation()}
          />
        </header>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        <div data-spatial-reader-viewport className="h-full min-h-0 overflow-auto">
          <ReaderChromeActionsProvider target={isImmersive ? null : chromeActionsTarget}>
            {children}
          </ReaderChromeActionsProvider>
        </div>
      </div>

      {!readerWindow.isMaximized && !isImmersive
        ? RESIZE_HANDLES.map((handle) => (
            <div
              key={handle.handle}
              data-spatial-interactive
              className={cn('absolute z-10 touch-none', handle.className)}
              onPointerDown={(event) => {
                if (event.button !== 0) return
                event.preventDefault()
                event.stopPropagation()
                onActivate(readerWindow.id)
                setResizeHandle(handle.handle)
                resizeStartRef.current = { x: event.clientX, y: event.clientY }
                positionStartRef.current = readerWindow.position
                sizeStartRef.current = readerWindow.size
              }}
              aria-label={handle.label}
              title="调整大小"
            >
              {handle.handle === 'se' ? (
                <div className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-br-[3px] border-b-2 border-r-2 border-slate-400/70" />
              ) : null}
            </div>
          ))
        : null}
    </section>
  )
}
