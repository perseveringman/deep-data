import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

async function readSource(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), 'utf8')
}

for (const relativePath of [
  'components/spatial-reader/spatial-reader-frame.tsx',
  'components/spatial-reader/spatial-markdown-reader.tsx',
]) {
  test(`${relativePath} reopens highlighted nodes as windows and hides window close into the workspace`, async () => {
    const source = await readSource(relativePath)

    assert.match(source, /graph\.setNodeMode\(nodeId, 'window'\)\s*graph\.bringNodeToFront\(nodeId\)/)
    assert.match(source, /onCloseNode=\{\(nodeId\) => graph\.setNodeMode\(nodeId, 'sidebar-card'\)\}/)
  })
}

test('nested connection lines still render when the source window is above the child window', async () => {
  const source = await readSource('components/spatial-reader/connection-lines.tsx')

  assert.match(source, /function getThoughtConnectionZIndex/)
  assert.match(source, /targetZIndex < sourceZIndex\s*\?\s*Math\.max\(0, targetZIndex - 1\)/)
  assert.doesNotMatch(source, /node\.view\.zIndex < source\.zIndex/)
})

test('highlight pointer down opens the target before a parent window can steal focus', async () => {
  const source = await readSource('components/spatial-reader/thought-canvas.tsx')

  assert.match(source, /onPointerDownCapture=\{\(event\) =>/)
  assert.match(source, /openedHighlightOnPointerDownRef\.current = nodeId/)
  assert.match(source, /openHighlightedNode\(nodeId\)/)
})

test('new thought nodes start as highlights instead of auto-opening windows', async () => {
  const frameSource = await readSource('components/spatial-reader/spatial-reader-frame.tsx')
  const markdownReaderSource = await readSource('components/spatial-reader/spatial-markdown-reader.tsx')

  assert.match(frameSource, /createAiNode\(prepareRootSelection\(sourceSelection\), action, \{ mode: 'inline' \}\)/)
  assert.match(frameSource, /createAiNodes\(prepareRootSelection\(sourceSelection\), actions, \{ mode: 'inline' \}\)/)
  assert.match(frameSource, /createAiNode\(sourceSelection, action, \{\s*mode: 'inline'/)
  assert.match(frameSource, /createAiNodes\(sourceSelection, actions, \{\s*mode: 'inline'/)

  assert.match(markdownReaderSource, /createAiNode\(sourceSelection, action, \{ mode: 'inline' \}\)/)
  assert.match(markdownReaderSource, /createAiNodes\(sourceSelection, actions, \{ mode: 'inline' \}\)/)
  assert.match(markdownReaderSource, /createAiNode\(sourceSelection, action, \{\s*mode: 'inline'/)
  assert.match(markdownReaderSource, /createAiNodes\(sourceSelection, actions, \{\s*mode: 'inline'/)
})

test('thought graph z-index counter starts above seeded windows', async () => {
  const source = await readSource('components/spatial-reader/use-thought-graph.ts')

  assert.match(source, /useRef\(\s*Math\.max\(220, \.\.\.initialNodes\.map\(\(node\) => node\.view\.zIndex\)\)/)
})

test('view-only thought updates do not force highlight rerenders', async () => {
  const graphSource = await readSource('components/spatial-reader/use-thought-graph.ts')
  const thoughtGraphSource = await readSource('components/spatial-reader/thought-graph.ts')
  const frameSource = await readSource('components/spatial-reader/spatial-reader-frame.tsx')
  const markdownReaderSource = await readSource('components/spatial-reader/spatial-markdown-reader.tsx')
  const thoughtWindowSource = await readSource('components/spatial-reader/thought-window.tsx')

  const updateNodeViewBody = graphSource.match(
    /const updateNodeView = useCallback\([\s\S]*?\n  \)/,
  )?.[0]

  assert.ok(updateNodeViewBody)
  assert.doesNotMatch(updateNodeViewBody, /updatedAt: new Date\(\)\.toISOString\(\)/)
  assert.match(thoughtGraphSource, /getThoughtAnnotationFingerprint/)
  assert.match(frameSource, /thoughtAnnotationFingerprint/)
  assert.match(frameSource, /initialAnnotations: thoughtAnnotations/)
  assert.match(markdownReaderSource, /thoughtAnnotationFingerprint/)
  assert.match(thoughtWindowSource, /childAnnotationFingerprint/)
})

test('reader immersive mode keeps clean reader chrome while preserving graph anchors', async () => {
  const frameSource = await readSource('components/spatial-reader/spatial-reader-frame.tsx')
  const windowSource = await readSource('components/spatial-reader/spatial-reader-window.tsx')
  const canvasSource = await readSource('components/spatial-reader/thought-canvas.tsx')
  const connectionSource = await readSource('components/spatial-reader/connection-lines.tsx')

  assert.match(windowSource, /isImmersive\?: boolean/)
  assert.match(windowSource, /function getImmersiveFrame/)
  assert.match(windowSource, /data-spatial-reader-immersive/)
  assert.match(windowSource, /ReaderChromeActionsProvider target=\{isImmersive \? null : chromeActionsTarget\}/)
  assert.match(frameSource, /chromeHidden=\{Boolean\(immersiveReaderWindowId\)\}/)
  assert.match(frameSource, /readerWindowIds=\{visibleReaderWindowIds\}/)
  assert.match(frameSource, /renderedReaderWindows\.map/)
  assert.match(canvasSource, /chromeHidden = false/)
  assert.match(canvasSource, /showCanvasChrome/)
  assert.match(connectionSource, /!readerWindowIds\.includes\(node\.sourceReaderWindowId\)/)
})
