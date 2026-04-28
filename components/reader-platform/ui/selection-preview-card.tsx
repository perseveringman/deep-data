'use client'

import type { FocusEvent, MouseEvent } from 'react'
import { ChevronLeft, Languages, NotebookPen, Sparkles, X } from 'lucide-react'

import {
  readerHighlightColors,
  type ReaderHighlightColor,
} from '@/components/reader-platform/annotations'
import type {
  SelectionAiPreview,
  SelectionOverlayMode,
} from '@/components/reader-platform/selection-overlay'
import type { TranslationResponse } from '@/components/reader-platform/translation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface SelectionPreviewCardProps {
  mode: Extract<SelectionOverlayMode, 'translate' | 'ai' | 'note'>
  selectionText: string
  actionError?: string | null
  isTranslationPending: boolean
  translationPreview?: TranslationResponse | null
  aiPreview?: SelectionAiPreview | null
  noteDraft: string
  noteColor: ReaderHighlightColor
  onNoteDraftChange: (value: string) => void
  onNoteColorChange: (color: ReaderHighlightColor) => void
  onSaveNote: () => void
  onBack: () => void
  onDismiss: () => void
  onOpenSidebar: (section: 'translation' | 'ai' | 'annotations') => void
  onStickyStart: () => void
  onStickyEnd: () => void
}

function preserveSelection(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

function handleFocus(onStickyStart: () => void) {
  return (_event: FocusEvent<HTMLTextAreaElement>) => {
    onStickyStart()
  }
}

function handleBlur(onStickyEnd: () => void) {
  return (_event: FocusEvent<HTMLTextAreaElement>) => {
    onStickyEnd()
  }
}

export function SelectionPreviewCard({
  mode,
  selectionText,
  actionError,
  isTranslationPending,
  translationPreview,
  aiPreview,
  noteDraft,
  noteColor,
  onNoteDraftChange,
  onNoteColorChange,
  onSaveNote,
  onBack,
  onDismiss,
  onOpenSidebar,
  onStickyStart,
  onStickyEnd,
}: SelectionPreviewCardProps) {
  const quote = selectionText.trim()
  const title =
    mode === 'translate'
      ? '翻译预览'
      : mode === 'ai'
        ? 'AI 预览'
        : '快速笔记'
  const Icon =
    mode === 'translate'
      ? Languages
      : mode === 'ai'
        ? Sparkles
        : NotebookPen

  return (
    <div className="w-80 max-w-[min(20rem,calc(100vw-1rem))] rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">围绕当前选区就地处理，完整内容仍在右侧侧栏。</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onMouseDown={preserveSelection}
            onClick={onBack}
            aria-label="返回操作栏"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onMouseDown={preserveSelection}
            onClick={onDismiss}
            aria-label="关闭选区浮层"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {quote ? (
        <blockquote className="mt-3 rounded-lg border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-sm line-clamp-4">
          {quote}
        </blockquote>
      ) : null}

      {mode === 'translate' ? (
        <div className="mt-3 space-y-3">
          {isTranslationPending ? (
            <p className="text-sm text-muted-foreground">正在翻译当前选区…</p>
          ) : translationPreview ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">结果预览</p>
                <Badge variant="secondary">{translationPreview.targetLang}</Badge>
              </div>
              <div className="space-y-2">
                {translationPreview.segments.map((segment) => (
                  <div key={segment.id} className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                    {segment.translatedText}
                  </div>
                ))}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => onOpenSidebar('translation')}>
                在右侧查看完整结果
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">当前还没有可展示的翻译结果。</p>
          )}
        </div>
      ) : null}

      {mode === 'ai' ? (
        <div className="mt-3 space-y-3">
          {aiPreview ? (
            <>
              <div className="rounded-lg border bg-muted/20 px-3 py-2">
                <p className="text-sm">{aiPreview.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">{aiPreview.detail}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => onOpenSidebar('ai')}>
                在右侧展开 AI 上下文
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">当前选区的 AI 上下文还未准备好。</p>
          )}
        </div>
      ) : null}

      {mode === 'note' ? (
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">高亮颜色</p>
              <Badge variant="outline">{noteColor}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {readerHighlightColors.map((color) => (
                <Button
                  key={color}
                  type="button"
                  size="sm"
                  variant={color === noteColor ? 'default' : 'outline'}
                  onMouseDown={preserveSelection}
                  onClick={() => onNoteColorChange(color)}
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>
          <Textarea
            value={noteDraft}
            onChange={(event) => onNoteDraftChange(event.target.value)}
            onFocus={handleFocus(onStickyStart)}
            onBlur={handleBlur(onStickyEnd)}
            placeholder="输入简短笔记..."
            className="min-h-24 text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              已自动创建高亮。这里适合记短注，完整编辑仍可稍后在右侧进行。
            </p>
            <Button type="button" size="sm" onClick={onSaveNote}>
              {noteDraft.trim() ? '保存笔记' : '保存高亮'}
            </Button>
          </div>
        </div>
      ) : null}

      {actionError ? (
        <p className="mt-3 text-xs text-destructive">{actionError}</p>
      ) : null}
    </div>
  )
}
