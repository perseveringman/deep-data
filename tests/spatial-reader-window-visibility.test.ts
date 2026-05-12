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
