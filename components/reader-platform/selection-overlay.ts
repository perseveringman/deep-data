import type { ReaderAnalysisContext } from './analysis'
import type { ReaderSelection, ReaderSelectionAnchorRect } from './core'

export type SelectionOverlayMode =
  | 'closed'
  | 'actions'
  | 'translate'
  | 'ai'
  | 'note'

export interface SelectionOverlayPlacement {
  left: number
  top: number
  placement: 'top' | 'bottom'
  anchor: 'selection' | 'surface'
}

interface RectLike {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface SelectionAiPreview {
  summary: string
  detail: string
  quote: string
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

function hasValidAnchorRect(
  anchorRect: ReaderSelectionAnchorRect | null | undefined,
): anchorRect is ReaderSelectionAnchorRect {
  return Boolean(
    anchorRect &&
      Number.isFinite(anchorRect.top) &&
      Number.isFinite(anchorRect.left) &&
      Number.isFinite(anchorRect.right) &&
      Number.isFinite(anchorRect.bottom),
  )
}

export function hasTextSelection(selection?: ReaderSelection | null): boolean {
  return Boolean(selection?.text.trim())
}

export function buildSelectionOverlayKey(selection?: ReaderSelection | null): string | null {
  if (!hasTextSelection(selection)) {
    return null
  }

  return JSON.stringify({
    text: selection?.text.trim(),
    start: selection?.range.start,
    quote: selection?.range.quote?.exact,
  })
}

export function resolveSelectionOverlayPlacement({
  anchorRect,
  surfaceRect,
  mountRect,
  overlayRect,
  offset = 12,
  padding = 8,
}: {
  anchorRect?: ReaderSelectionAnchorRect | null
  surfaceRect: RectLike
  mountRect: RectLike
  overlayRect: Pick<RectLike, 'width' | 'height'>
  offset?: number
  padding?: number
}): SelectionOverlayPlacement {
  const overlayWidth = Math.max(overlayRect.width, 0)
  const overlayHeight = Math.max(overlayRect.height, 0)
  const hasAnchor = hasValidAnchorRect(anchorRect)
  const fallbackCenterX = surfaceRect.left + surfaceRect.width / 2
  const targetRect = hasAnchor
    ? anchorRect
    : {
        top: surfaceRect.top,
        left: fallbackCenterX,
        right: fallbackCenterX,
        bottom: surfaceRect.top,
        width: 0,
        height: 0,
      }

  const minLeft = surfaceRect.left - mountRect.left + padding
  const maxLeft = surfaceRect.right - mountRect.left - overlayWidth - padding
  const preferredLeft = hasAnchor
    ? targetRect.right - mountRect.left - overlayWidth
    : surfaceRect.left - mountRect.left + surfaceRect.width / 2 - overlayWidth / 2

  const minTop = surfaceRect.top - mountRect.top + padding
  const maxTop = surfaceRect.bottom - mountRect.top - overlayHeight - padding
  const topAbove = targetRect.top - mountRect.top - overlayHeight - offset
  const fitsAbove = topAbove >= minTop
  const topBelow = targetRect.bottom - mountRect.top + offset

  return {
    left: clamp(preferredLeft, minLeft, maxLeft),
    top: clamp(fitsAbove ? topAbove : topBelow, minTop, maxTop),
    placement: fitsAbove ? 'top' : 'bottom',
    anchor: hasAnchor ? 'selection' : 'surface',
  }
}

export function buildSelectionAiPreview(
  context?: ReaderAnalysisContext | null,
): SelectionAiPreview | null {
  const quote = context?.selection?.text.trim()
  if (!quote) {
    return null
  }

  const resolvedContext = context
  const activeLabel =
    resolvedContext?.activeUnit?.title?.trim() ||
    resolvedContext?.document.title?.trim() ||
    '当前内容'
  const visibleCount =
    resolvedContext?.visibleContent.filter((slice) => slice.text.trim()).length ?? 0
  const annotationCount = resolvedContext?.annotations?.length ?? 0

  return {
    summary: `AI 将围绕这段选区继续分析，并复用当前 reader 上下文。`,
    detail: `${activeLabel} · ${visibleCount} 段可见上下文 · ${annotationCount} 条现有注释`,
    quote,
  }
}
