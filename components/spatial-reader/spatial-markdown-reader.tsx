'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
  parseMarkdownDocument,
  remarkHeadingIdPlugin,
} from '@/components/document-reader/markdown/parser'
import {
  buildReaderAnalysisContext,
  defaultReaderCapabilities,
  getScopedSelection,
  renderReaderQuoteHighlights,
  type ReaderContentSlice,
  type ReaderDocumentIdentity,
  type ReaderSelection,
  type ReaderSessionSnapshot,
} from '@/components/reader-platform'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { defaultThoughtActions } from './actions'
import {
  clearStoredThoughtGraph,
  readStoredThoughtGraph,
  writeStoredThoughtGraph,
} from './persistence'
import { SpatialSelectionOverlay } from './spatial-selection-overlay'
import { ThoughtCanvas } from './thought-canvas'
import { ThoughtDock } from './thought-dock'
import { ThoughtSidebar } from './thought-sidebar'
import type {
  ThoughtActionDefinition,
  ThoughtActionExecutor,
  ThoughtNode,
  ThoughtNodeChange,
  ThoughtPoint,
  ThoughtSourceSelection,
} from './thought-graph'
import {
  getThoughtAnnotations,
  getThoughtHighlightElementId,
} from './thought-graph'
import { useThoughtGraph } from './use-thought-graph'

export interface SpatialMarkdownReaderProps {
  identity: ReaderDocumentIdentity
  markdown: string
  actions?: ThoughtActionDefinition[]
  actionExecutor?: ThoughtActionExecutor
  initialNodes?: ThoughtNode[]
  onThoughtNodeChange?: (change: ThoughtNodeChange) => void
}

function findNearestAnchor(
  node: Node | null,
  root: HTMLElement | null,
  fallbackAnchor: string,
): string {
  let current: HTMLElement | null =
    node instanceof HTMLElement ? node : node?.parentElement ?? null

  while (current) {
    if (current.id) return current.id
    current = current.parentElement
  }

  const element = node instanceof HTMLElement ? node : node?.parentElement ?? null
  if (!root || !element) return fallbackAnchor

  const headings = Array.from(
    root.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'),
  )

  let nearestAnchor = fallbackAnchor
  for (const heading of headings) {
    const relation = heading.compareDocumentPosition(element)
    if (relation & Node.DOCUMENT_POSITION_FOLLOWING) {
      nearestAnchor = heading.id
      continue
    }

    if (relation & Node.DOCUMENT_POSITION_PRECEDING) break
  }

  return nearestAnchor
}

function decorateThoughtHighlights({
  root,
  nodes,
  onOpenNode,
}: {
  root: HTMLElement | null
  nodes: ThoughtNode[]
  onOpenNode: (nodeId: string) => void
}) {
  if (!root) return

  const nodeIds = new Set(nodes.map((node) => node.id))
  const seen = new Set<string>()
  root.querySelectorAll<HTMLElement>('[data-reader-annotation-id]').forEach((element) => {
    const nodeId = element.dataset.readerAnnotationId
    if (!nodeId || !nodeIds.has(nodeId)) return

    element.dataset.readerThoughtId = nodeId
    element.classList.add('cursor-pointer', 'ring-1', 'ring-primary/20')
    element.title = '点击打开对应 ThoughtNode'
    if (!seen.has(nodeId)) {
      element.id = getThoughtHighlightElementId(nodeId)
      seen.add(nodeId)
    }
    element.onclick = (event) => {
      event.stopPropagation()
      onOpenNode(nodeId)
    }
  })
}

export function SpatialMarkdownReader({
  identity,
  markdown,
  actions = defaultThoughtActions,
  actionExecutor,
  initialNodes,
  onThoughtNodeChange,
}: SpatialMarkdownReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeAnchor, setActiveAnchor] = useState('document-start')
  const [selection, setSelection] = useState<ReaderSelection | null>(null)
  const [canvasHidden, setCanvasHidden] = useState(false)
  const [storageReady, setStorageReady] = useState(Boolean(initialNodes))
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const parsed = useMemo(() => parseMarkdownDocument(markdown), [markdown])
  const activeSectionIndex = Math.max(
    0,
    parsed.sections.findIndex((section) => section.id === activeAnchor),
  )
  const activeSection = parsed.sections[activeSectionIndex] ?? parsed.sections[0] ?? null
  const visibleSections = useMemo(
    () => parsed.sections.slice(activeSectionIndex, activeSectionIndex + 3),
    [activeSectionIndex, parsed.sections],
  )
  const capabilities = useMemo(
    () => ({
      ...defaultReaderCapabilities,
      textSelection: true,
      translation: true,
      annotations: true,
      aiContext: true,
      toc: true,
      search: false,
      continuousScroll: true,
      jumpToLocator: true,
      extractVisibleText: true,
    }),
    [],
  )
  const visibleContent = useMemo<ReaderContentSlice[]>(
    () =>
      visibleSections.map((section) => ({
        id: section.id,
        text: section.text,
        markdown: section.text,
        locator: { kind: 'anchor', anchor: section.id },
      })),
    [visibleSections],
  )
  const snapshot = useMemo<ReaderSessionSnapshot>(
    () => ({
      document: identity,
      location: { kind: 'anchor', anchor: activeAnchor },
      progress:
        parsed.headingIds.length > 0
          ? Math.max(0, parsed.headingIds.indexOf(activeAnchor)) / parsed.headingIds.length
          : 0,
      selection: selection ?? undefined,
      activeTocItemId: activeAnchor,
      visibleContent,
    }),
    [activeAnchor, identity, parsed.headingIds, selection, visibleContent],
  )
  const analysisContext = useMemo(
    () =>
      buildReaderAnalysisContext({
        snapshot,
        activeUnit: activeSection
          ? {
              id: activeSection.id,
              title: activeSection.title,
              text: activeSection.text,
              markdown: activeSection.text,
              locator: { kind: 'anchor', anchor: activeSection.id },
            }
          : null,
        visibleContent,
        annotations: [],
        capabilities,
      }),
    [activeSection, capabilities, snapshot, visibleContent],
  )
  const graph = useThoughtGraph({
    identity,
    analysisContext,
    initialNodes,
    actionExecutor,
    onThoughtNodeChange,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || initialNodes) return

    try {
      const stored = readStoredThoughtGraph(window.localStorage, identity)
      if (stored) graph.replaceNodes(stored.nodes)
      setPersistenceError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setPersistenceError(`无法读取本地 ThoughtGraph：${message}`)
    } finally {
      setStorageReady(true)
    }
  }, [graph.replaceNodes, identity, initialNodes])

  useEffect(() => {
    if (typeof window === 'undefined' || initialNodes || !storageReady) return

    try {
      writeStoredThoughtGraph(window.localStorage, identity, graph.nodes)
      setPersistenceError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setPersistenceError(`无法保存本地 ThoughtGraph：${message}`)
    }
  }, [graph.nodes, identity, initialNodes, storageReady])

  const clearSelection = useCallback(() => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  const syncSelection = useCallback(() => {
    window.requestAnimationFrame(() => {
      setSelection(
        getScopedSelection({
          root: contentRef.current,
          buildRange: (text, domRange) => ({
            start: {
              kind: 'anchor',
              anchor: findNearestAnchor(domRange.startContainer, contentRef.current, activeAnchor),
            },
            quote: { exact: text },
          }),
        }),
      )
    })
  }, [activeAnchor])

  useEffect(() => {
    document.addEventListener('pointerup', syncSelection)
    document.addEventListener('keyup', syncSelection)
    return () => {
      document.removeEventListener('pointerup', syncSelection)
      document.removeEventListener('keyup', syncSelection)
    }
  }, [syncSelection])

  useEffect(() => {
    if (!contentRef.current) return

    const headings = Array.from(
      contentRef.current.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'),
    )
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const nextAnchor = visible[0]?.target.getAttribute('id')
        if (nextAnchor) setActiveAnchor(nextAnchor)
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0, 0.5, 1],
      },
    )

    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [markdown])

  useEffect(() => {
    renderReaderQuoteHighlights(contentRef.current, getThoughtAnnotations(graph.nodes))
    decorateThoughtHighlights({
      root: contentRef.current,
      nodes: graph.nodes,
      onOpenNode: (nodeId) => {
        graph.setNodeMode(nodeId, 'window')
        graph.bringNodeToFront(nodeId)
      },
    })
  }, [graph.bringNodeToFront, graph.nodes, graph.setNodeMode, markdown])

  const runAction = useCallback(
    (sourceSelection: ThoughtSourceSelection, action: ThoughtActionDefinition) => {
      graph.createAiNode(sourceSelection, action, { mode: 'window' })
      clearSelection()
    },
    [clearSelection, graph],
  )

  const runAllActions = useCallback(
    (sourceSelection: ThoughtSourceSelection) => {
      graph.createAiNodes(sourceSelection, actions, { mode: 'window' })
      clearSelection()
    },
    [actions, clearSelection, graph],
  )

  const createNote = useCallback(
    (sourceSelection: ThoughtSourceSelection) => {
      graph.createNoteNode(sourceSelection, { mode: 'sidebar-card' })
      clearSelection()
    },
    [clearSelection, graph],
  )

  const moveNode = useCallback(
    (nodeId: string, position: ThoughtPoint) => {
      graph.updateNodeView(nodeId, { position })
    },
    [graph],
  )

  const clearGraph = useCallback(() => {
    graph.clearNodes()
    if (typeof window !== 'undefined') {
      clearStoredThoughtGraph(window.localStorage, identity)
    }
  }, [graph, identity])

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] overflow-hidden rounded-xl border bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{identity.title ?? 'Spatial Reader'}</h1>
                <Badge variant="secondary">{identity.readerType}</Badge>
                <Badge variant="outline">Spatial Fusion</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                选中文本即可展开 AI 浮窗；结果节点可在画布、Dock 与侧栏之间切换。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCanvasHidden((value) => !value)}
              >
                {canvasHidden ? '显示画布' : '隐藏画布'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearGraph}
                disabled={graph.nodes.length === 0}
              >
                清空节点
              </Button>
            </div>
          </div>
          {persistenceError ? (
            <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {persistenceError}
            </div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-64 shrink-0 border-r bg-muted/20 p-3 lg:block">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Table of contents
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-1 pr-3">
                {parsed.toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'block w-full rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-muted',
                      item.id === activeAnchor && 'bg-muted font-medium text-foreground',
                    )}
                    style={{ paddingLeft: `${Math.max(0, (item.level ?? 1) - 1) * 12 + 8}px` }}
                    onClick={() => {
                      const anchor = item.locator.kind === 'anchor' ? item.locator.anchor : null
                      if (!anchor) return
                      document.getElementById(anchor)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                      setActiveAnchor(anchor)
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </nav>

          <main className="relative min-w-0 flex-1 overflow-auto">
            <article
              ref={contentRef}
              className={cn(
                'mx-auto max-w-3xl px-6 py-10 pb-40 text-base leading-8',
                '[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic',
                '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5',
                '[&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-bold',
                '[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold',
                '[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold',
                '[&_li]:my-1 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6',
                '[&_p]:mb-5 [&_pre]:mb-5 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4',
                '[&_table]:mb-5 [&_table]:w-full [&_table]:border-collapse',
                '[&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-muted [&_th]:p-2',
                '[&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6',
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkHeadingIdPlugin]}>
                {markdown}
              </ReactMarkdown>
            </article>
          </main>
        </div>
      </div>

      <ThoughtSidebar
        nodes={graph.nodes}
        onOpenNode={(nodeId) => {
          graph.setNodeMode(nodeId, 'window')
          graph.bringNodeToFront(nodeId)
        }}
        onSendNodeToSidebar={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
        onCloseNode={(nodeId) => graph.updateNodeView(nodeId, { status: 'closed' })}
        onDeleteNode={graph.deleteNode}
      />

      <SpatialSelectionOverlay
        selection={selection}
        actions={actions}
        onRunAction={runAction}
        onRunAll={runAllActions}
        onCreateNote={createNote}
        onDismiss={clearSelection}
      />

      <ThoughtCanvas
        nodes={graph.nodes}
        actions={actions}
        hidden={canvasHidden}
        onMoveNode={moveNode}
        onBringNodeToFront={graph.bringNodeToFront}
        onMinimizeNode={(nodeId) => graph.updateNodeView(nodeId, { status: 'minimized' })}
        onCloseNode={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
        onSendNodeToSidebar={(nodeId) => graph.setNodeMode(nodeId, 'sidebar-card')}
        onCreateChildNode={(sourceSelection, action, sourceNode) => {
          graph.createAiNode(sourceSelection, action, {
            mode: 'window',
            sourceNode,
          })
        }}
        onCreateChildNodes={(sourceSelection, sourceNode) => {
          graph.createAiNodes(sourceSelection, actions, {
            mode: 'window',
            sourceNode,
          })
        }}
      />

      <ThoughtDock
        nodes={graph.nodes}
        canvasHidden={canvasHidden}
        onToggleCanvas={() => setCanvasHidden((value) => !value)}
        onOpenNode={(nodeId) => {
          graph.setNodeMode(nodeId, 'window')
          graph.bringNodeToFront(nodeId)
        }}
        onClear={clearGraph}
      />
    </div>
  )
}
