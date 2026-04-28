import type { ReaderAnnotation } from './annotations'

const HIGHLIGHT_SELECTOR = '[data-reader-annotation-id]'

const highlightClassByColor: Record<ReaderAnnotation['color'], string> = {
  yellow: 'rounded bg-yellow-200/80 px-0.5 text-inherit',
  green: 'rounded bg-emerald-200/80 px-0.5 text-inherit',
  blue: 'rounded bg-sky-200/80 px-0.5 text-inherit',
  pink: 'rounded bg-pink-200/80 px-0.5 text-inherit',
  purple: 'rounded bg-violet-200/80 px-0.5 text-inherit',
}

const pdfHighlightColorByColor: Record<ReaderAnnotation['color'], string> = {
  yellow: 'rgba(253, 224, 71, 0.45)',
  green: 'rgba(110, 231, 183, 0.45)',
  blue: 'rgba(125, 211, 252, 0.45)',
  pink: 'rgba(249, 168, 212, 0.45)',
  purple: 'rgba(196, 181, 253, 0.45)',
}

type ReaderHighlightRenderVariant = 'default' | 'pdf-text-layer'

function clearReaderHighlights(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(HIGHLIGHT_SELECTOR).forEach((node) => {
    const parent = node.parentNode
    if (!parent) return

    parent.replaceChild(document.createTextNode(node.textContent ?? ''), node)
    parent.normalize()
  })
}

interface HighlightTextSegment {
  node: Text
  text: string
  start: number
  end: number
}

interface NormalizedHighlightText {
  text: string
  map: Array<{
    rawStart: number
    rawEnd: number
  }>
}

interface HighlightMatchRange {
  start: number
  end: number
}

function collectHighlightTextSegments(root: HTMLElement): HighlightTextSegment[] {
  const segments: HighlightTextSegment[] = []
  let offset = 0

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
    segments.push({
      node,
      text,
      start: offset,
      end: offset + text.length,
    })
    offset += text.length
  }

  return segments
}

export function normalizeHighlightText(text: string): NormalizedHighlightText {
  const normalizedChars: string[] = []
  const map: NormalizedHighlightText['map'] = []

  let index = 0
  while (index < text.length) {
    const char = text[index]
    if (/\s/.test(char)) {
      let whitespaceEnd = index + 1
      while (whitespaceEnd < text.length && /\s/.test(text[whitespaceEnd])) {
        whitespaceEnd += 1
      }

      if (normalizedChars.length > 0 && whitespaceEnd < text.length) {
        normalizedChars.push(' ')
        map.push({
          rawStart: index,
          rawEnd: whitespaceEnd,
        })
      }

      index = whitespaceEnd
      continue
    }

    normalizedChars.push(char)
    map.push({
      rawStart: index,
      rawEnd: index + 1,
    })
    index += 1
  }

  return {
    text: normalizedChars.join(''),
    map,
  }
}

function rangesOverlap(a: HighlightMatchRange, b: HighlightMatchRange) {
  return a.start < b.end && b.start < a.end
}

export function findHighlightQuoteMatch(
  contentText: string,
  quote: string,
  claimedRanges: HighlightMatchRange[] = [],
): HighlightMatchRange | null {
  const normalizedContent = normalizeHighlightText(contentText)
  const normalizedQuote = normalizeHighlightText(quote).text

  if (!normalizedQuote || normalizedContent.text.length === 0) {
    return null
  }

  let searchStart = 0
  while (searchStart < normalizedContent.text.length) {
    const matchIndex = normalizedContent.text.indexOf(normalizedQuote, searchStart)
    if (matchIndex === -1) {
      return null
    }

    const first = normalizedContent.map[matchIndex]
    const last = normalizedContent.map[matchIndex + normalizedQuote.length - 1]
    const match = {
      start: first.rawStart,
      end: last.rawEnd,
    }

    if (!claimedRanges.some((claimed) => rangesOverlap(claimed, match))) {
      return match
    }

    searchStart = matchIndex + 1
  }

  return null
}

function wrapHighlightSegment(
  node: Text,
  annotation: ReaderAnnotation,
  startOffset: number,
  endOffset: number,
  variant: ReaderHighlightRenderVariant,
) {
  if (!node.parentNode || startOffset >= endOffset) {
    return
  }

  const targetNode = startOffset > 0 ? node.splitText(startOffset) : node
  const trailingOffset = endOffset - startOffset
  targetNode.splitText(trailingOffset)

  const highlight =
    variant === 'pdf-text-layer'
      ? document.createElement('span')
      : document.createElement('mark')
  highlight.dataset.readerAnnotationId = annotation.id
  if (variant === 'pdf-text-layer') {
    highlight.className = 'highlight appended reader-pdf-annotation-highlight'
    highlight.style.setProperty('--highlight-bg-color', pdfHighlightColorByColor[annotation.color])
    highlight.style.setProperty('--highlight-selected-bg-color', pdfHighlightColorByColor[annotation.color])
  } else {
    highlight.className = highlightClassByColor[annotation.color]
  }
  highlight.textContent = targetNode.textContent

  targetNode.parentNode?.replaceChild(highlight, targetNode)
}

function applyHighlightMatch(
  segments: HighlightTextSegment[],
  annotation: ReaderAnnotation,
  match: HighlightMatchRange,
  variant: ReaderHighlightRenderVariant,
) {
  segments
    .filter((segment) => segment.end > match.start && segment.start < match.end)
    .sort((a, b) => b.start - a.start)
    .forEach((segment) => {
      const localStart = Math.max(0, match.start - segment.start)
      const localEnd = Math.min(segment.text.length, match.end - segment.start)
      wrapHighlightSegment(segment.node, annotation, localStart, localEnd, variant)
    })
}

export function renderReaderQuoteHighlights(
  root: HTMLElement | null,
  annotations: ReaderAnnotation[],
  { variant = 'default' }: { variant?: ReaderHighlightRenderVariant } = {},
) {
  if (!root) return

  clearReaderHighlights(root)
  const segments = collectHighlightTextSegments(root)
  const contentText = segments.map((segment) => segment.text).join('')
  const claimedRanges: HighlightMatchRange[] = []
  const plannedHighlights = annotations
    .map((annotation) => {
      const quote = annotation.range.quote?.exact?.trim()
      if (!quote) return null

      const match = findHighlightQuoteMatch(contentText, quote, claimedRanges)
      if (!match) return null

      claimedRanges.push(match)
      return { annotation, match }
    })
    .filter((planned): planned is { annotation: ReaderAnnotation; match: HighlightMatchRange } => Boolean(planned))
    .sort((a, b) => b.match.start - a.match.start)

  plannedHighlights.forEach(({ annotation, match }) => {
    applyHighlightMatch(segments, annotation, match, variant)
  })
}

export function renderPdfQuoteHighlights(root: HTMLElement | null, annotations: ReaderAnnotation[]) {
  renderReaderQuoteHighlights(root, annotations, { variant: 'pdf-text-layer' })
}
