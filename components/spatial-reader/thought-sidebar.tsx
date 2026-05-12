'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Maximize2, PanelRight, Trash2, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { ThoughtActionIcon } from './thought-action-bar'
import type { ThoughtNode } from './thought-graph'
import { getThoughtNodeSummary } from './thought-graph'

export function ThoughtSidebar({
  nodes,
  onOpenNode,
  onSendNodeToSidebar,
  onCloseNode,
  onDeleteNode,
}: {
  nodes: ThoughtNode[]
  onOpenNode: (nodeId: string) => void
  onSendNodeToSidebar: (nodeId: string) => void
  onCloseNode: (nodeId: string) => void
  onDeleteNode: (nodeId: string) => void
}) {
  const activeNodes = nodes.filter((node) => node.view.status !== 'closed')

  return (
    <aside className="flex h-full min-h-[640px] w-[360px] shrink-0 flex-col border-l bg-background">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Thought Workspace</h2>
            <p className="text-xs text-muted-foreground">
              画布节点的列表视图，可与浮窗互切。
            </p>
          </div>
          <Badge variant="secondary">{activeNodes.length}</Badge>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3 pb-24">
          {activeNodes.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              在正文里选中文字，然后点击翻译、解释、公式或关联来创建第一个 ThoughtNode。
            </div>
          ) : null}
          {activeNodes.map((node) => (
            <article
              key={node.id}
              className={cn(
                'rounded-xl border bg-card p-3 shadow-sm',
                node.view.mode === 'sidebar-card' && 'ring-1 ring-primary/20',
              )}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {node.kind === 'note' ? (
                    <PanelRight className="h-4 w-4" />
                  ) : (
                    <ThoughtActionIcon actionId={node.action.id} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">
                      {node.kind === 'note' ? '笔记' : node.action.label}
                    </h3>
                    <Badge variant={node.status === 'error' ? 'destructive' : 'outline'}>
                      {node.status}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {node.sourceText}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs leading-5">
                {node.contentMarkdown ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {getThoughtNodeSummary(node)}
                  </ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground">等待生成结果...</span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenNode(node.id)}
                >
                  <Maximize2 className="h-4 w-4" />
                  浮窗
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSendNodeToSidebar(node.id)}
                >
                  <PanelRight className="h-4 w-4" />
                  侧栏
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onCloseNode(node.id)}
                  aria-label="关闭节点"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDeleteNode(node.id)}
                  aria-label="删除节点"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}

