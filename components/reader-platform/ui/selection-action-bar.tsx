'use client'

import type { MouseEvent } from 'react'
import { Languages, NotebookPen, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

function preserveSelection(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

interface SelectionActionBarProps {
  translateDisabledReason?: string | null
  aiDisabledReason?: string | null
  onTranslate: () => void
  onAi: () => void
  onNote: () => void
}

export function SelectionActionBar({
  translateDisabledReason,
  aiDisabledReason,
  onTranslate,
  onAi,
  onNote,
}: SelectionActionBarProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onMouseDown={preserveSelection}
        onClick={onTranslate}
        disabled={Boolean(translateDisabledReason)}
        title={translateDisabledReason ?? 'Alt+T'}
        aria-label="翻译选中内容"
      >
        <Languages className="h-4 w-4" />
        翻译
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onMouseDown={preserveSelection}
        onClick={onAi}
        disabled={Boolean(aiDisabledReason)}
        title={aiDisabledReason ?? 'Alt+A'}
        aria-label="基于选区打开 AI 预览"
      >
        <Sparkles className="h-4 w-4" />
        AI
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onMouseDown={preserveSelection}
        onClick={onNote}
        aria-label="高亮选中内容并添加笔记"
      >
        <NotebookPen className="h-4 w-4" />
        高亮/笔记
      </Button>
    </div>
  )
}
