import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function moduleUrl(relativePath: string): string {
  const url = pathToFileURL(path.join(process.cwd(), relativePath))
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

async function importWindowLayout() {
  return import(moduleUrl('components/spatial-reader/window-layout.ts'))
}

test('resolveNestedThoughtWindowLayout docks children beside the source when room exists', async () => {
  const { resolveNestedThoughtWindowLayout } = await importWindowLayout()

  const layout = resolveNestedThoughtWindowLayout({
    sourceFrame: { x: 80, y: 80, width: 360, height: 280 },
    selectionRect: { x: 180, y: 150, width: 90, height: 24 },
    visibleBounds: { x: 0, y: 0, width: 1000, height: 720 },
  })

  assert.ok(layout.position.x >= 460)
  assert.ok(layout.position.y >= 18)
})

test('resolveNestedThoughtWindowLayout avoids covering the nested selection in tight viewports', async () => {
  const { resolveNestedThoughtWindowLayout } = await importWindowLayout()

  const selectionRect = { x: 250, y: 180, width: 100, height: 26 }
  const layout = resolveNestedThoughtWindowLayout({
    sourceFrame: { x: 80, y: 80, width: 430, height: 430 },
    selectionRect,
    visibleBounds: { x: 0, y: 0, width: 760, height: 600 },
    siblingIndex: 1,
  })

  const childFrame = {
    x: layout.position.x,
    y: layout.position.y,
    width: layout.size.width,
    height: layout.size.height,
  }

  const overlapsSelection =
    childFrame.x < selectionRect.x + selectionRect.width &&
    selectionRect.x < childFrame.x + childFrame.width &&
    childFrame.y < selectionRect.y + selectionRect.height &&
    selectionRect.y < childFrame.y + childFrame.height

  assert.equal(overlapsSelection, false)
  assert.ok(childFrame.x >= 18)
  assert.ok(childFrame.x + childFrame.width <= 760 - 18)
})
