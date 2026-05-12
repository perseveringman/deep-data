'use client'

import type { ReaderAnalysisContext } from '@/components/reader-platform/analysis'
import type {
  ReaderAnnotation,
  ReaderHighlightColor,
} from '@/components/reader-platform/annotations'
import type {
  ReaderDocumentIdentity,
  ReaderRange,
  ReaderSelection,
} from '@/components/reader-platform/core'

export type ThoughtViewMode = 'window' | 'sidebar-card' | 'inline'
export type ThoughtNodeStatus = 'pending' | 'streaming' | 'done' | 'error'

export interface ThoughtPoint {
  x: number
  y: number
}

export interface ThoughtSize {
  width: number
  height: number
}

export interface ThoughtView {
  mode: ThoughtViewMode
  position?: ThoughtPoint
  size?: ThoughtSize
  status: 'open' | 'minimized' | 'closed'
  zIndex: number
}

export interface ThoughtActionSnapshot {
  id: string
  label: string
  description?: string
  color: ReaderHighlightColor
}

export interface ThoughtActionDefinition extends ThoughtActionSnapshot {
  prompt: (input: ThoughtActionPromptInput) => string
}

export interface ThoughtActionPromptInput {
  sourceText: string
  analysisContext?: ReaderAnalysisContext | null
  sourceNode?: ThoughtNode | null
}

export interface ThoughtSourceSelection {
  text: string
  range: ReaderRange
  anchorRect?: ReaderSelection['anchorRect']
  sourceNodeId?: string
}

export interface ThoughtAiNode {
  id: string
  kind: 'ai-result'
  documentId: string
  readerType: ReaderDocumentIdentity['readerType']
  sourceRange: ReaderRange
  sourceText: string
  sourceNodeId?: string
  action: ThoughtActionSnapshot
  contentMarkdown: string
  status: ThoughtNodeStatus
  error?: string
  view: ThoughtView
  createdAt: string
  updatedAt: string
}

export interface ThoughtNoteNode {
  id: string
  kind: 'note'
  documentId: string
  readerType: ReaderDocumentIdentity['readerType']
  sourceRange: ReaderRange
  sourceText: string
  sourceNodeId?: string
  color: ReaderHighlightColor
  contentMarkdown: string
  status: 'done'
  view: ThoughtView
  createdAt: string
  updatedAt: string
}

export type ThoughtNode = ThoughtAiNode | ThoughtNoteNode

export interface ThoughtGraphSnapshot {
  document: ReaderDocumentIdentity
  nodes: ThoughtNode[]
  canvas: {
    viewport: {
      x: number
      y: number
      zoom: number
    }
  }
}

export interface ThoughtNodeChange {
  type: 'create' | 'update' | 'delete'
  node: ThoughtNode
}

export interface ThoughtActionExecutionInput {
  node: ThoughtAiNode
  action: ThoughtActionDefinition
  prompt: string
  analysisContext?: ReaderAnalysisContext | null
  sourceNode?: ThoughtNode | null
}

export interface ThoughtActionExecutionHandlers {
  onChunk: (deltaMarkdown: string) => void
}

export type ThoughtActionExecutor = (
  input: ThoughtActionExecutionInput,
  handlers: ThoughtActionExecutionHandlers,
) => Promise<void>

export function createThoughtId(prefix = 'thought') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function snapshotThoughtAction(action: ThoughtActionDefinition): ThoughtActionSnapshot {
  return {
    id: action.id,
    label: action.label,
    description: action.description,
    color: action.color,
  }
}

export function getThoughtHighlightElementId(nodeId: string) {
  return `spatial-highlight-${nodeId}`
}

export function getThoughtWindowElementId(nodeId: string) {
  return `spatial-window-${nodeId}`
}

export function getThoughtAnnotations(nodes: ThoughtNode[]): ReaderAnnotation[] {
  return nodes
    .map((node) => ({
      id: node.id,
      documentId: node.documentId,
      readerType: node.readerType,
      color: node.kind === 'note' ? node.color : node.action.color,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      range: node.sourceRange,
      bodyMarkdown: node.contentMarkdown,
      tags: [node.kind],
    }))
}

export function getThoughtEdges(nodes: ThoughtNode[]) {
  return nodes
    .filter((node) => Boolean(node.sourceNodeId))
    .map((node) => ({
      from: node.sourceNodeId as string,
      to: node.id,
    }))
}

export function buildSourceSelectionFromReaderSelection(
  selection: ReaderSelection,
): ThoughtSourceSelection {
  return {
    text: selection.text,
    range: selection.range,
    anchorRect: selection.anchorRect,
  }
}

export function getThoughtNodeSummary(node: ThoughtNode) {
  const text = node.contentMarkdown.trim() || node.sourceText
  return text.length > 96 ? `${text.slice(0, 96)}...` : text
}
