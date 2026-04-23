import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('useReaderRuntime uses a stable empty annotation default', async () => {
  const hookPath = path.join(
    process.cwd(),
    'components/reader-platform/hooks/use-reader-runtime.ts',
  )
  const source = await readFile(hookPath, 'utf8')

  assert.match(source, /const EMPTY_ANNOTATIONS: ReaderAnnotation\[\] = \[\]/)
  assert.doesNotMatch(source, /initialAnnotations = \[\]/)
  assert.match(source, /initialAnnotations = EMPTY_ANNOTATIONS/)
})
