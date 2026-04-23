import type { ReaderAnnotation } from './annotations'

const HIGHLIGHT_SELECTOR = 'mark[data-reader-annotation-id]'

const highlightClassByColor: Record<ReaderAnnotation['color'], string> = {
  yellow: 'rounded bg-yellow-200/80 px-0.5',
  green: 'rounded bg-emerald-200/80 px-0.5',
  blue: 'rounded bg-sky-200/80 px-0.5',
  pink: 'rounded bg-pink-200/80 px-0.5',
  purple: 'rounded bg-violet-200/80 px-0.5',
}

function clearReaderHighlights(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(HIGHLIGHT_SELECTOR).forEach((node) => {
    const parent = node.parentNode
    if (!parent) return

    parent.replaceChild(document.createTextNode(node.textContent ?? ''), node)
    parent.normalize()
  })
}

function highlightSingleQuote(root: HTMLElement, annotation: ReaderAnnotation) {
  const quote = annotation.range.quote?.exact?.trim()
  if (!quote) return

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT

      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (parent.closest(HIGHLIGHT_SELECTOR)) return NodeFilter.FILTER_REJECT
      if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT

      return NodeFilter.FILTER_ACCEPT
    },
  })

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const text = node.textContent ?? ''
    const start = text.indexOf(quote)
    if (start === -1) continue

    const matchedNode = node.splitText(start)
    matchedNode.splitText(quote.length)

    const highlight = document.createElement('mark')
    highlight.dataset.readerAnnotationId = annotation.id
    highlight.className = highlightClassByColor[annotation.color]
    highlight.textContent = matchedNode.textContent

    matchedNode.parentNode?.replaceChild(highlight, matchedNode)
    return
  }
}

export function renderReaderQuoteHighlights(root: HTMLElement | null, annotations: ReaderAnnotation[]) {
  if (!root) return

  clearReaderHighlights(root)
  annotations.forEach((annotation) => highlightSingleQuote(root, annotation))
}
