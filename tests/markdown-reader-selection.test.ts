import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('MarkdownReader derives active unit from the current selection anchor before scroll anchor', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/markdown/markdown-reader.tsx'),
    'utf8',
  )

  assert.match(source, /const selectedAnchor = selection\?\.range\.start\.kind === 'anchor' \? selection\.range\.start\.anchor : null/)
  assert.match(source, /const activeSectionAnchor = selectedAnchor \?\? activeAnchor/)
  assert.match(source, /findIndex\(\(section\) => section\.id === activeSectionAnchor\)/)
})

test('MarkdownReader resolves selection anchors from the nearest preceding heading in the document', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/markdown/markdown-reader.tsx'),
    'utf8',
  )

  assert.match(source, /function findNearestAnchor\(node: Node \| null, root: HTMLElement \| null, fallbackAnchor: string\)/)
  assert.match(source, /root\.querySelectorAll<HTMLElement>\('h1\[id\], h2\[id\], h3\[id\], h4\[id\], h5\[id\], h6\[id\]'\)/)
  assert.match(source, /findNearestAnchor\(domRange\.startContainer, contentRef\.current, activeAnchor\)/)
})

test('MarkdownReader captures selection after stable pointer and keyboard events', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/markdown/markdown-reader.tsx'),
    'utf8',
  )

  assert.match(source, /const syncSelection = useCallback\(/)
  assert.match(source, /window\.requestAnimationFrame\(/)
  assert.match(source, /document\.addEventListener\('pointerup', syncSelection\)/)
  assert.match(source, /document\.addEventListener\('keyup', syncSelection\)/)
  assert.doesNotMatch(source, /document\.addEventListener\('selectionchange'/)
})
