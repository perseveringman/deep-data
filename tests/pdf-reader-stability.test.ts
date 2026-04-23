import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('PdfReader memoizes Document file and options props', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/pdf/pdf-reader.tsx'),
    'utf8',
  )

  assert.match(source, /const documentFile = useMemo\(\(\) => sourceToFile\(source\), \[source\]\)/)
  assert.match(source, /const documentOptions = useMemo\(/)
  assert.match(source, /file=\{documentFile\}/)
  assert.match(source, /options=\{documentOptions\}/)
})

test('PdfReader ignores stale async load results after a newer document load starts', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/pdf/pdf-reader.tsx'),
    'utf8',
  )

  assert.match(source, /const loadTaskIdRef = useRef\(0\)/)
  assert.match(source, /const loadTaskId = \+\+loadTaskIdRef\.current/)
  assert.match(source, /if \(loadTaskId !== loadTaskIdRef\.current\) return/)
})
