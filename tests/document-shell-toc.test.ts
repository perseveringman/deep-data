import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('DocumentShell renders nested TOC items recursively', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/shared/document-shell.tsx'),
    'utf8',
  )

  assert.match(source, /function renderTocItems\(/)
  assert.match(source, /item\.children\?\.length/)
  assert.match(source, /renderTocItems\(item\.children/)
})
