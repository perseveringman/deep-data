'use client'

import type { MouseEvent } from 'react'
import { BookOpenText, Braces, Languages, Link2, NotebookPen, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ThoughtActionDefinition } from './thought-graph'

const actionIconMap = {
  translate: Languages,
  explain: Sparkles,
  formula: Braces,
  related: Link2,
} as const

function preserveSelection(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

export function ThoughtActionIcon({
  actionId,
  className,
}: {
  actionId: string
  className?: string
}) {
  const Icon = actionIconMap[actionId as keyof typeof actionIconMap] ?? BookOpenText
  return <Icon className={cn('h-4 w-4', className)} />
}

export function ThoughtActionBar({
  actions,
  compact = false,
  onRunAction,
  onRunAll,
  onCreateNote,
  className,
}: {
  actions: ThoughtActionDefinition[]
  compact?: boolean
  onRunAction: (action: ThoughtActionDefinition) => void
  onRunAll?: () => void
  onCreateNote?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80',
        className,
      )}
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          size="sm"
          variant="secondary"
          onMouseDown={preserveSelection}
          onClick={() => onRunAction(action)}
          title={action.description}
          aria-label={action.label}
        >
          <ThoughtActionIcon actionId={action.id} />
          {!compact ? action.label : null}
        </Button>
      ))}
      {onRunAll ? (
        <Button
          type="button"
          size="sm"
          variant="default"
          onMouseDown={preserveSelection}
          onClick={onRunAll}
          aria-label="全部展开"
        >
          <Sparkles className="h-4 w-4" />
          {!compact ? '全部展开' : null}
        </Button>
      ) : null}
      {onCreateNote ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onMouseDown={preserveSelection}
          onClick={onCreateNote}
          aria-label="保存为笔记"
        >
          <NotebookPen className="h-4 w-4" />
          {!compact ? '笔记' : null}
        </Button>
      ) : null}
    </div>
  )
}

