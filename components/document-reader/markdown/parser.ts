import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'

import type { ReaderSearchResult, ReaderTocItem } from '@/components/reader-platform'

interface MarkdownSection {
  id: string
  title: string
  depth: number
  text: string
}

export interface ParsedMarkdownDocument {
  toc: ReaderTocItem[]
  sections: MarkdownSection[]
  headingIds: string[]
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section'
}

function walk(node: any, visitor: (node: any) => void) {
  visitor(node)
  if (Array.isArray(node?.children)) {
    for (const child of node.children) {
      walk(child, visitor)
    }
  }
}

export function remarkHeadingIdPlugin() {
  return (tree: any) => {
    const seen = new Map<string, number>()

    walk(tree, (node) => {
      if (node.type !== 'heading') return

      const text = toString(node)
      const base = slugifyHeading(text)
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count + 1}`

      node.data = node.data ?? {}
      node.data.hProperties = {
        ...(node.data.hProperties ?? {}),
        id,
      }
    })
  }
}

export function parseMarkdownDocument(markdown: string): ParsedMarkdownDocument {
  const ast = unified().use(remarkParse).parse(markdown) as any
  const toc: ReaderTocItem[] = []
  const sections: MarkdownSection[] = []
  const stack: ReaderTocItem[] = []
  const seen = new Map<string, number>()

  let currentSection: MarkdownSection | null = null

  for (const node of ast.children ?? []) {
    if (node.type === 'heading') {
      const title = toString(node).trim()
      const base = slugifyHeading(title)
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count + 1}`
      const depth = node.depth ?? 1

      const tocItem: ReaderTocItem = {
        id,
        title,
        level: depth,
        locator: {
          kind: 'anchor',
          anchor: id,
        },
        children: [],
      }

      while (stack.length > 0 && (stack[stack.length - 1].level ?? 1) >= depth) {
        stack.pop()
      }

      if (stack.length === 0) {
        toc.push(tocItem)
      } else {
        stack[stack.length - 1].children = stack[stack.length - 1].children ?? []
        stack[stack.length - 1].children?.push(tocItem)
      }

      stack.push(tocItem)

      currentSection = {
        id,
        title,
        depth,
        text: title,
      }
      sections.push(currentSection)
      continue
    }

    const text = toString(node).trim()
    if (!text) continue

    if (!currentSection) {
      currentSection = {
        id: 'document-start',
        title: 'Introduction',
        depth: 0,
        text: '',
      }
      sections.push(currentSection)
    }

    currentSection.text = currentSection.text ? `${currentSection.text}\n\n${text}` : text
  }

  return {
    toc,
    sections,
    headingIds: sections.map((section) => section.id),
  }
}

export function searchMarkdownDocument(markdown: string, query: string): ReaderSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  const parsed = parseMarkdownDocument(markdown)

  return parsed.sections
    .filter((section) => section.text.toLowerCase().includes(normalizedQuery))
    .map((section, index) => {
      const lower = section.text.toLowerCase()
      const matchIndex = lower.indexOf(normalizedQuery)
      const start = Math.max(0, matchIndex - 48)
      const end = Math.min(section.text.length, matchIndex + normalizedQuery.length + 48)

      return {
        id: `${section.id}-${index}`,
        text: section.text.slice(matchIndex, matchIndex + normalizedQuery.length),
        locator: { kind: 'anchor', anchor: section.id },
        contextBefore: section.text.slice(start, matchIndex).trim(),
        contextAfter: section.text.slice(matchIndex + normalizedQuery.length, end).trim(),
      }
    })
}
