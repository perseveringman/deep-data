'use client'

import { useEffect, useState } from 'react'
import { Languages, Sparkles, WandSparkles } from 'lucide-react'

import type { ReaderAnalysisContext } from '@/components/reader-platform/analysis'
import {
  readerHighlightColors,
  type ReaderAnnotation,
  type ReaderHighlightColor,
} from '@/components/reader-platform/annotations'
import type { ReaderActiveUnit, ReaderCapabilities, ReaderSelection } from '@/components/reader-platform/core'
import type { TranslationProvider, TranslationResponse, TranslationScope } from '@/components/reader-platform/translation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { listArtifacts, type ArtifactItem } from '@/lib/api'

import { AnnotationSidebar } from './annotation-sidebar'
import {
  getReaderWorkspaceRootId,
  getReaderWorkspaceSectionId,
} from './reader-workspace-ids'

interface ReaderWorkspacePanelProps {
  idPrefix?: string
  capabilities: ReaderCapabilities
  selection?: ReaderSelection | null
  activeUnit?: ReaderActiveUnit | null
  annotations: ReaderAnnotation[]
  activeAnnotationId?: string
  provider: TranslationProvider
  targetLang: string
  canTranslate: boolean
  isTranslating: boolean
  translationResponse?: TranslationResponse | null
  translationError?: Error | null
  analysisContext?: ReaderAnalysisContext | null
  analysisArtifact?: ArtifactItem | null
  analysisError?: Error | null
  isAnalyzing?: boolean
  onRunAnalysis?: () => void
  onProviderChange: (provider: TranslationProvider) => void
  onTargetLangChange: (targetLang: string) => void
  onTranslate: (scope: TranslationScope) => void
  onCreateAnnotation: (color: ReaderHighlightColor) => void
  onSelectAnnotation?: (annotation: ReaderAnnotation) => void
  onUpdateAnnotationBody?: (annotationId: string, bodyMarkdown: string) => void
  onDeleteAnnotation?: (annotationId: string) => void
}

function scopeEnabled(scope: TranslationScope, selection?: ReaderSelection | null, activeUnit?: ReaderActiveUnit | null, capabilities?: ReaderCapabilities) {
  if (!capabilities?.translation) return false

  switch (scope) {
    case 'selection':
      return Boolean(selection?.text.trim())
    case 'active-unit':
      return Boolean(activeUnit?.text?.trim() || activeUnit?.markdown?.trim())
    case 'visible':
    case 'document':
      return true
  }
}

export function ReaderWorkspacePanel({
  idPrefix = 'reader-workspace',
  capabilities,
  selection,
  activeUnit,
  annotations,
  activeAnnotationId,
  provider,
  targetLang,
  canTranslate,
  isTranslating,
  translationResponse,
  translationError,
  analysisContext,
  analysisArtifact,
  analysisError,
  isAnalyzing = false,
  onRunAnalysis,
  onProviderChange,
  onTargetLangChange,
  onTranslate,
  onCreateAnnotation,
  onSelectAnnotation,
  onUpdateAnnotationBody,
  onDeleteAnnotation,
}: ReaderWorkspacePanelProps) {
  const documentId = analysisContext?.document.documentId
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([])
  const [artifactError, setArtifactError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) {
      setArtifacts([])
      return
    }

    let cancelled = false
    listArtifacts({ subject: `document:${documentId}`, limit: 20 })
      .then((response) => {
        if (!cancelled) {
          setArtifacts(response.items)
          setArtifactError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setArtifactError(error instanceof Error ? error.message : 'Failed to load artifacts')
        }
      })

    return () => {
      cancelled = true
    }
  }, [documentId])

  return (
    <div id={getReaderWorkspaceRootId(idPrefix)} className="space-y-3">
      <div className="rounded border p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <WandSparkles className="h-4 w-4" />
          当前上下文
        </div>

        {selection ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">当前选区</p>
            <blockquote className="rounded border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-sm">
              {selection.text}
            </blockquote>
            <div className="flex flex-wrap gap-2">
              {readerHighlightColors.map((color) => (
                <Button key={color} size="sm" variant="outline" onClick={() => onCreateAnnotation(color)}>
                  高亮 {color}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">选中内容后即可创建高亮、发起翻译。</p>
        )}

        {activeUnit ? (
          <div className="mt-3 rounded border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">当前单元</p>
            <p className="mt-1 text-sm font-medium">{activeUnit.title ?? activeUnit.id ?? '当前内容'}</p>
            {(activeUnit.text ?? activeUnit.markdown) ? (
              <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">
                {activeUnit.text ?? activeUnit.markdown}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        id={getReaderWorkspaceSectionId(idPrefix, 'translation')}
        tabIndex={-1}
        className="rounded border p-3 outline-none"
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Languages className="h-4 w-4" />
          翻译
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <Input value={targetLang} onChange={(event) => onTargetLangChange(event.target.value)} placeholder="目标语言，如 zh-CN" />
          <Select value={provider} onValueChange={(value) => onProviderChange(value as TranslationProvider)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llm">LLM</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="deepl">DeepL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(['selection', 'active-unit', 'visible'] as const).map((scope) => (
            <Button
              key={scope}
              size="sm"
              variant="outline"
              disabled={!canTranslate || isTranslating || !scopeEnabled(scope, selection, activeUnit, capabilities)}
              onClick={() => onTranslate(scope)}
            >
              翻译 {scope}
            </Button>
          ))}
        </div>

        {!canTranslate ? (
          <p className="mt-2 text-xs text-muted-foreground">未配置 translation executor，按钮已禁用。</p>
        ) : null}

        {translationError ? (
          <p className="mt-2 text-xs text-destructive">{translationError.message}</p>
        ) : null}

        {translationResponse ? (
          <div className="mt-3 space-y-2 rounded border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">最新翻译结果</p>
              <Badge variant="secondary">{translationResponse.targetLang}</Badge>
            </div>

            {translationResponse.segments.map((segment) => (
              <div key={segment.id} className="rounded bg-background p-2 text-sm">
                {segment.translatedText}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div
        id={getReaderWorkspaceSectionId(idPrefix, 'ai')}
        tabIndex={-1}
        className="rounded border p-3 outline-none"
      >
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          AI Context Bridge
        </div>
        <div className="mb-2 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={!onRunAnalysis || isAnalyzing} onClick={onRunAnalysis}>
            {isAnalyzing ? '分析中…' : '运行 DataHub 分析'}
          </Button>
        </div>
        {analysisError ? <p className="mb-2 text-xs text-destructive">{analysisError.message}</p> : null}
        {analysisArtifact ? (
          <div className="mb-2 rounded border bg-muted/30 p-2 text-xs">
            <div className="font-medium">最新产物：{analysisArtifact.artifact_type}</div>
            <div className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-muted-foreground">
              {analysisArtifact.body || analysisArtifact.summary || analysisArtifact.status}
            </div>
          </div>
        ) : null}
        <pre
          className={cn(
            'max-h-64 overflow-auto rounded bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground',
            !analysisContext && 'text-center',
          )}
        >
          {analysisContext
            ? JSON.stringify(analysisContext, null, 2)
            : '上下文生成中…'}
        </pre>
      </div>

      <div className="rounded border p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <WandSparkles className="h-4 w-4" />
          文档产物
        </div>
        {!documentId ? (
          <p className="text-sm text-muted-foreground">等待文档上下文。</p>
        ) : artifactError ? (
          <p className="text-xs text-destructive">{artifactError}</p>
        ) : artifacts.length > 0 ? (
          <div className="space-y-1.5">
            {artifacts.map((artifact) => (
              <div key={artifact.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
                <span className="font-medium">{artifact.artifact_type}</span>
                <Badge variant={artifact.visibility === 'published' ? 'default' : 'secondary'}>
                  {artifact.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无文档产物。</p>
        )}
      </div>

      <div
        id={getReaderWorkspaceSectionId(idPrefix, 'annotations')}
        tabIndex={-1}
        className="h-[28rem] min-h-0 rounded border outline-none"
      >
        <AnnotationSidebar
          annotations={annotations}
          activeAnnotationId={activeAnnotationId}
          onSelect={onSelectAnnotation}
          onUpdateBody={onUpdateAnnotationBody}
          onDelete={onDeleteAnnotation}
        />
      </div>
    </div>
  )
}
