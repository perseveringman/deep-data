import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function moduleUrl(relativePath: string): string {
  const url = pathToFileURL(path.join(process.cwd(), relativePath))
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

async function importSelectionOverlay() {
  return import(moduleUrl('components/reader-platform/selection-overlay.ts'))
}

async function readSource(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), 'utf8')
}

test('resolveSelectionOverlayPlacement prefers the selection anchor and clamps within the reader surface', async () => {
  const { resolveSelectionOverlayPlacement } = await importSelectionOverlay()

  const placement = resolveSelectionOverlayPlacement({
    anchorRect: {
      top: 380,
      left: 560,
      right: 640,
      bottom: 404,
      width: 80,
      height: 24,
    },
    surfaceRect: {
      top: 100,
      left: 50,
      right: 850,
      bottom: 700,
      width: 800,
      height: 600,
    },
    mountRect: {
      top: 100,
      left: 50,
      right: 850,
      bottom: 700,
      width: 800,
      height: 600,
    },
    overlayRect: {
      width: 320,
      height: 180,
    },
  })

  assert.equal(placement.anchor, 'selection')
  assert.equal(placement.placement, 'top')
  assert.equal(placement.left, 270)
  assert.equal(placement.top, 88)
})

test('resolveSelectionOverlayPlacement falls back to the reader surface when no selection rect is available', async () => {
  const { resolveSelectionOverlayPlacement } = await importSelectionOverlay()

  const placement = resolveSelectionOverlayPlacement({
    surfaceRect: {
      top: 40,
      left: 0,
      right: 600,
      bottom: 440,
      width: 600,
      height: 400,
    },
    mountRect: {
      top: 40,
      left: 0,
      right: 600,
      bottom: 440,
      width: 600,
      height: 400,
    },
    overlayRect: {
      width: 280,
      height: 120,
    },
  })

  assert.equal(placement.anchor, 'surface')
  assert.equal(placement.left, 160)
  assert.equal(placement.top, 12)
})

test('buildSelectionAiPreview summarizes the canonical selection context', async () => {
  const { buildSelectionAiPreview } = await importSelectionOverlay()

  const preview = buildSelectionAiPreview({
    document: {
      readerType: 'markdown',
      documentId: 'doc-1',
      title: 'Selection Overlay Doc',
    },
    location: {
      locator: { kind: 'anchor', anchor: 'section-1' },
      progress: 0.25,
    },
    selection: {
      text: 'Selected quote',
      range: {
        start: { kind: 'anchor', anchor: 'section-1' },
      },
    },
    activeUnit: {
      id: 'section-1',
      title: 'Section 1',
      text: 'Visible content',
      locator: { kind: 'anchor', anchor: 'section-1' },
    },
    visibleContent: [
      { id: 'section-1', text: 'Visible content', locator: { kind: 'anchor', anchor: 'section-1' } },
      { id: 'section-2', text: 'More visible content', locator: { kind: 'anchor', anchor: 'section-2' } },
    ],
    annotations: [
      {
        id: 'ann-1',
        documentId: 'doc-1',
        readerType: 'markdown',
        color: 'yellow',
        createdAt: '2026-04-23T00:00:00Z',
        range: {
          start: { kind: 'anchor', anchor: 'section-1' },
        },
      },
    ],
    capabilities: {
      textSelection: true,
      translation: true,
      annotations: true,
      aiContext: true,
      toc: true,
      search: true,
      bookmarks: false,
      paginatedNavigation: false,
      continuousScroll: true,
      jumpToLocator: true,
      extractVisibleText: true,
    },
  })

  assert.ok(preview)
  assert.match(preview.summary, /AI 将围绕这段选区继续分析/)
  assert.match(preview.detail, /Section 1 · 2 段可见上下文 · 1 条现有注释/)
  assert.equal(preview.quote, 'Selected quote')
})

test('document and media readers mount the shared selection overlay host', async () => {
  const documentShell = await readSource('components/document-reader/shared/document-shell.tsx')
  const sharedReader = await readSource('components/media-reader/shared-reader.tsx')
  const overlayHost = await readSource('components/reader-platform/ui/reader-selection-overlay-host.tsx')
  const actionBar = await readSource('components/reader-platform/ui/selection-action-bar.tsx')
  const previewCard = await readSource('components/reader-platform/ui/selection-preview-card.tsx')

  assert.match(documentShell, /contentOverlay\?: ReactNode/)
  assert.match(documentShell, /\{contentOverlay\}/)
  assert.match(sharedReader, /overlay\?: ReactNode/)
  assert.match(sharedReader, /\{overlay\}/)
  assert.doesNotMatch(overlayHost, /\}, \[overlay, surfaceRef\]\)/)
  assert.doesNotMatch(overlayHost, /\}, \[overlay\]\)/)
  assert.match(overlayHost, /const \{\s*actionError,/)
  assert.match(actionBar, /高亮\/笔记/)
  assert.doesNotMatch(actionBar, /aria-label="高亮选中内容"/)
  assert.match(previewCard, /已自动创建高亮。这里适合记短注，完整编辑仍可稍后在右侧进行。/)
  assert.match(previewCard, /onNoteColorChange/)
  assert.match(overlayHost, /useSelectionOverlayState/)

  for (const relativePath of [
    'components/document-reader/markdown/markdown-reader.tsx',
    'components/document-reader/pdf/pdf-reader.tsx',
    'components/document-reader/epub/epub-reader.tsx',
    'components/media-reader/youtube-reader.tsx',
    'components/media-reader/podcast-reader.tsx',
  ]) {
    const source = await readSource(relativePath)
    assert.match(source, /ReaderSelectionOverlayHost/)
    assert.match(source, /workspacePanelIdPrefix=\{workspacePanelId\}/)
    assert.match(source, /idPrefix=\{workspacePanelId\}/)
    assert.match(source, /updateNoteBody=\{runtime\.updateAnnotationBody\}/)
    assert.match(source, /updateHighlightColor=\{runtime\.updateAnnotationColor\}/)
  }
})

test('EpubReader preserves a translated viewport rect for overlay fallback positioning', async () => {
  const source = await readSource('components/document-reader/epub/epub-reader.tsx')

  assert.match(source, /const baseAnchorRect = getRangeAnchorRect\(selectedRange\)/)
  assert.match(source, /offsetSelectionAnchorRect\(baseAnchorRect, \{/)
  assert.match(source, /anchorRect,/)
})

test('note overlay remains open after highlight creation even if browser selection collapses', async () => {
  const source = await readSource('components/reader-platform/hooks/use-selection-overlay-state.ts')

  assert.match(source, /const persistsWithoutSelection =\s*mode === 'note' && Boolean\(noteAnnotation\)/)
  assert.match(source, /if \(persistsWithoutSelection\) {\s*clearCloseTimer\(\)\s*return/s)
  assert.match(source, /if \(!hasTextSelection\(selection\) && !persistsWithoutSelection\)/)
})

test('saving a note closes the overlay instead of showing a saved confirmation card', async () => {
  const previewCard = await readSource('components/reader-platform/ui/selection-preview-card.tsx')
  const overlayState = await readSource('components/reader-platform/hooks/use-selection-overlay-state.ts')

  assert.doesNotMatch(previewCard, /笔记已保存/)
  assert.doesNotMatch(previewCard, /高亮已创建/)
  assert.doesNotMatch(previewCard, /在右侧继续编辑/)
  assert.match(overlayState, /const persistsWithoutSelection =\s*mode === 'note' && Boolean\(noteAnnotation\)/)
  assert.match(overlayState, /setNoteDraft\(''\)\s*[\r\n\s]*dismiss\(\)/)
  assert.doesNotMatch(overlayState, /setLastAction\(/)
  assert.doesNotMatch(overlayState, /onOpenSidebarSection\?\.\('annotations'\)/)
})
