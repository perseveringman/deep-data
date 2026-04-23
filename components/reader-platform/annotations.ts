import type { ReaderDocumentIdentity, ReaderRange, ReaderType } from './core'

export type ReaderHighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple'

export interface ReaderAnnotation {
  id: string
  documentId: string
  readerType: ReaderType
  color: ReaderHighlightColor
  createdAt: string
  updatedAt?: string
  range: ReaderRange
  bodyMarkdown?: string
  anchors?: Record<string, unknown>
  tags?: string[]
}

export interface ReaderAnnotationChange {
  type: 'create' | 'update' | 'delete'
  annotation: ReaderAnnotation
}

export interface ReaderAnnotationEvents {
  onAnnotationChange?: (change: ReaderAnnotationChange) => void
}

function quoteYaml(value?: string): string | undefined {
  if (value === undefined) return undefined
  return JSON.stringify(value)
}

function stringifyRange(range: ReaderRange): string {
  return JSON.stringify(range, null, 2)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')
}

function stringifyAnchors(anchors?: Record<string, unknown>): string | undefined {
  if (!anchors) return undefined
  return JSON.stringify(anchors, null, 2)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')
}

export function serializeAnnotationToMarkdown(annotation: ReaderAnnotation): string {
  const anchorsBlock = stringifyAnchors(annotation.anchors)

  return [
    '---',
    `id: ${annotation.id}`,
    `documentId: ${annotation.documentId}`,
    `readerType: ${annotation.readerType}`,
    `color: ${annotation.color}`,
    `createdAt: ${annotation.createdAt}`,
    annotation.updatedAt ? `updatedAt: ${annotation.updatedAt}` : undefined,
    'range:',
    stringifyRange(annotation.range),
    anchorsBlock ? 'anchors:' : undefined,
    anchorsBlock,
    annotation.tags && annotation.tags.length > 0 ? `tags: ${quoteYaml(annotation.tags.join(', '))}` : undefined,
    '---',
    '',
    annotation.bodyMarkdown ?? '',
    '',
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n')
}

export function createEmptyAnnotation(identity: ReaderDocumentIdentity, range: ReaderRange, color: ReaderHighlightColor = 'yellow'): ReaderAnnotation {
  const timestamp = new Date().toISOString()

  return {
    id: `${identity.documentId}-${timestamp}`,
    documentId: identity.documentId,
    readerType: identity.readerType,
    color,
    createdAt: timestamp,
    range,
  }
}
