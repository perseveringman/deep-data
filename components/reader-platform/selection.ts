import type {
  ReaderRange,
  ReaderSelection,
  ReaderSelectionAnchorRect,
} from './core'

function containsNode(root: HTMLElement | null, node: Node | null): boolean {
  if (!root || !node) return false
  return root.contains(node.nodeType === Node.TEXT_NODE ? node.parentNode : node)
}

function serializeSelectionHtml(range: Range): string | undefined {
  const fragment = range.cloneContents()
  const container = document.createElement('div')
  container.appendChild(fragment)
  const html = container.innerHTML.trim()
  return html || undefined
}

export function toReaderSelectionAnchorRect(
  rect:
    | DOMRect
    | DOMRectReadOnly
    | {
        top: number
        left: number
        right: number
        bottom: number
        width?: number
        height?: number
      },
): ReaderSelectionAnchorRect | undefined {
  const width = rect.width ?? rect.right - rect.left
  const height = rect.height ?? rect.bottom - rect.top
  const normalized = {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width,
    height,
  }

  if (!Object.values(normalized).every((value) => Number.isFinite(value))) {
    return undefined
  }

  if (normalized.width <= 0 && normalized.height <= 0) {
    return undefined
  }

  return normalized
}

export function getRangeAnchorRect(range: Range): ReaderSelectionAnchorRect | undefined {
  return toReaderSelectionAnchorRect(range.getBoundingClientRect())
}

export function offsetSelectionAnchorRect(
  rect: ReaderSelectionAnchorRect | undefined,
  offset: { top: number; left: number },
): ReaderSelectionAnchorRect | undefined {
  if (!rect) return undefined

  return {
    ...rect,
    top: rect.top + offset.top,
    bottom: rect.bottom + offset.top,
    left: rect.left + offset.left,
    right: rect.right + offset.left,
  }
}

export function getScopedSelection({
  root,
  buildRange,
}: {
  root: HTMLElement | null
  buildRange: (text: string, domRange: Range) => ReaderRange
}): ReaderSelection | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null

  const range = selection.getRangeAt(0)
  if (!containsNode(root, range.commonAncestorContainer)) return null

  const text = selection.toString().trim()
  if (!text) return null

  return {
    text,
    html: serializeSelectionHtml(range),
    anchorRect: getRangeAnchorRect(range),
    range: buildRange(text, range),
  }
}
