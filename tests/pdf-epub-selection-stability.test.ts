import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('PdfReader captures selection after stable pointer/keyboard events and keeps text layer callback stable', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/pdf/pdf-reader.tsx'),
    'utf8',
  )

  assert.match(source, /const syncSelection = useCallback\(/)
  assert.match(source, /document\.addEventListener\('pointerup', syncSelection\)/)
  assert.match(source, /document\.addEventListener\('keyup', syncSelection\)/)
  assert.doesNotMatch(source, /document\.addEventListener\('selectionchange'/)
  assert.match(source, /const handleTextLayerRenderSuccess = useCallback\(/)
  assert.match(source, /const documentContent = useMemo\(/)
  assert.match(source, /content=\{documentContent\}/)
  assert.match(source, /onRenderTextLayerSuccess=\{handleTextLayerRenderSuccess\}/)
})

test('EpubReader does not clear the browser selection immediately after capturing it', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/epub/epub-reader.tsx'),
    'utf8',
  )

  assert.doesNotMatch(source, /removeAllRanges\?\.\(\)/)
  assert.match(source, /rendition\.hooks\.content\.register\(/)
  assert.match(source, /const syncSelection = \(\) =>/)
  assert.match(source, /contents\.document\.addEventListener\('pointerup', syncSelection\)/)
  assert.match(source, /contents\.document\.addEventListener\('keyup', syncSelection\)/)
  assert.match(source, /setSelection\(null\)/)
})
