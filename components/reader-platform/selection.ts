import type { ReaderRange, ReaderSelection } from './core'

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
    range: buildRange(text, range),
  }
}
