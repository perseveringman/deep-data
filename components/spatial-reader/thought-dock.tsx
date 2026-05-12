'use client'

import { Boxes, Eye, EyeOff, Network, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { ThoughtActionIcon } from './thought-action-bar'
import type { ThoughtNode } from './thought-graph'

export function ThoughtDock({
  nodes,
  canvasHidden,
  onToggleCanvas,
  onOpenNode,
  onClear,
}: {
  nodes: ThoughtNode[]
  canvasHidden: boolean
  onToggleCanvas: () => void
  onOpenNode: (nodeId: string) => void
  onClear: () => void
}) {
  const activeNodes = nodes.filter((node) => node.view.status !== 'closed')
  const minimizedNodes = activeNodes.filter(
    (node) => node.view.mode === 'window' && node.view.status === 'minimized',
  )

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex max-w-[min(92vw,980px)] -translate-x-1/2 items-center gap-2 rounded-2xl border bg-background/90 px-3 py-2 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggleCanvas}
        className="gap-2"
      >
        {canvasHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        {canvasHidden ? '显示画布' : '隐藏画布'}
      </Button>
      <div className="h-6 w-px bg-border" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Network className="h-4 w-4" />
        ThoughtGraph
        <Badge variant="secondary">{activeNodes.length}</Badge>
      </div>
      <div className="h-6 w-px bg-border" />
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {minimizedNodes.length === 0 ? (
          <span className="px-2 text-xs text-muted-foreground">没有最小化节点</span>
        ) : (
          minimizedNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={cn(
                'flex h-9 min-w-9 items-center justify-center rounded-xl border bg-muted/50 px-2 text-xs transition hover:bg-muted',
              )}
              onClick={() => onOpenNode(node.id)}
              title={node.sourceText}
            >
              {node.kind === 'note' ? (
                <Boxes className="h-4 w-4" />
              ) : (
                <ThoughtActionIcon actionId={node.action.id} />
              )}
              <span className="ml-1 max-w-24 truncate">
                {node.kind === 'note' ? '笔记' : node.action.label}
              </span>
            </button>
          ))
        )}
      </div>
      <div className="h-6 w-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onClear}
        disabled={activeNodes.length === 0}
        aria-label="清空 ThoughtGraph"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

