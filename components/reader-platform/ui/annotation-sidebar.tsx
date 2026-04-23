'use client'

import { Highlighter, NotebookPen, Trash2 } from 'lucide-react'

import type { ReaderAnnotation, ReaderHighlightColor } from '@/components/reader-platform/annotations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface AnnotationSidebarProps {
  annotations: ReaderAnnotation[]
  activeAnnotationId?: string
  onSelect?: (annotation: ReaderAnnotation) => void
  onUpdateBody?: (annotationId: string, bodyMarkdown: string) => void
  onDelete?: (annotationId: string) => void
}

const colorClassMap: Record<ReaderHighlightColor, string> = {
  yellow: 'bg-yellow-100 text-yellow-900 border-yellow-200',
  green: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  blue: 'bg-sky-100 text-sky-900 border-sky-200',
  pink: 'bg-pink-100 text-pink-900 border-pink-200',
  purple: 'bg-violet-100 text-violet-900 border-violet-200',
}

export function AnnotationSidebar({
  annotations,
  activeAnnotationId,
  onSelect,
  onUpdateBody,
  onDelete,
}: AnnotationSidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <NotebookPen className="h-4 w-4" />
          注释与高亮
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={cn(
                'space-y-3 rounded-lg border p-3 transition-colors',
                activeAnnotationId === annotation.id && 'border-primary bg-primary/5',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelect?.(annotation)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Highlighter className="h-4 w-4 text-muted-foreground" />
                  <Badge
                    variant="outline"
                    className={cn('border', colorClassMap[annotation.color])}
                  >
                    {annotation.color}
                  </Badge>
                </button>

                {onDelete ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(annotation.id)}
                    aria-label="Delete annotation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              {annotation.range.quote?.exact ? (
                <blockquote className="rounded border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {annotation.range.quote.exact}
                </blockquote>
              ) : null}

              <Textarea
                value={annotation.bodyMarkdown ?? ''}
                onChange={(event) => onUpdateBody?.(annotation.id, event.target.value)}
                placeholder="输入 Markdown 笔记..."
                className="min-h-24"
              />
            </div>
          ))}

          {annotations.length === 0 ? (
            <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              当前还没有高亮或笔记
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
