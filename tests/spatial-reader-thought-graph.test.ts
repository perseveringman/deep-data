import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function moduleUrl(relativePath: string): string {
  const url = pathToFileURL(path.join(process.cwd(), relativePath))
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

async function importThoughtGraph() {
  return import(moduleUrl('components/spatial-reader/thought-graph.ts'))
}

test('getThoughtAnnotations keeps closed nodes highlighted so hidden windows keep their source association', async () => {
  const { getThoughtAnnotations } = await importThoughtGraph()

  const annotations = getThoughtAnnotations([
    {
      id: 'related-1',
      kind: 'ai-result',
      documentId: 'doc-1',
      readerType: 'markdown',
      sourceRange: {
        start: { kind: 'anchor', anchor: 'intro' },
        quote: { exact: 'Alpha' },
      },
      sourceText: 'Alpha',
      action: {
        id: 'related',
        label: '关联',
        color: 'pink',
      },
      contentMarkdown: 'Beta',
      status: 'done',
      view: {
        mode: 'window',
        status: 'closed',
        zIndex: 1,
      },
      createdAt: '2026-04-29T00:00:00.000Z',
      updatedAt: '2026-04-29T00:00:00.000Z',
    },
  ])

  assert.equal(annotations.length, 1)
  assert.equal(annotations[0].id, 'related-1')
  assert.deepEqual(annotations[0].range.quote, { exact: 'Alpha' })
})
