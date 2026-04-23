import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('PdfReader pins workerSrc to react-pdf pdfjs.version', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/pdf/pdf-reader.tsx'),
    'utf8',
  )

  assert.match(source, /pdfjs\.GlobalWorkerOptions\.workerSrc = `https:\/\/unpkg\.com\/pdfjs-dist@\$\{pdfjs\.version\}\/build\/pdf\.worker\.min\.mjs`/)
  assert.doesNotMatch(source, /new URL\(\s*'pdfjs-dist\/build\/pdf\.worker\.min\.mjs'/)
})
