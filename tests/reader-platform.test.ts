import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function moduleUrl(relativePath: string): string {
  const url = pathToFileURL(path.join(process.cwd(), relativePath))
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

async function importPreferences() {
  return import(moduleUrl('components/reader-platform/preferences.ts'))
}

async function importAnnotations() {
  return import(moduleUrl('components/reader-platform/annotations.ts'))
}

async function importMarkdownParser() {
  return import(moduleUrl('components/document-reader/markdown/parser.ts'))
}

test('resolveReaderPreferences merges layered values', async () => {
  const { defaultReaderPreferences, resolveReaderPreferences } = await importPreferences()

  const resolved = resolveReaderPreferences(
    {
      systemDefaults: defaultReaderPreferences,
      appDefaults: { theme: { mode: 'light' } },
      userDefaults: { typography: { fontSize: 18 } },
      documentOverrides: { typography: { contentWidth: 'narrow' } },
    },
    { behavior: { rememberLastLocation: false } },
  )

  assert.equal(resolved.theme.mode, 'light')
  assert.equal(resolved.typography.fontSize, 18)
  assert.equal(resolved.typography.contentWidth, 'narrow')
  assert.equal(resolved.behavior.rememberLastLocation, false)
})

test('serializeAnnotationToMarkdown writes frontmatter plus markdown body', async () => {
  const { serializeAnnotationToMarkdown } = await importAnnotations()

  const markdown = serializeAnnotationToMarkdown({
    id: 'ann-1',
    documentId: 'doc-1',
    readerType: 'markdown',
    color: 'yellow',
    createdAt: '2026-04-22T00:00:00Z',
    range: {
      start: { kind: 'anchor', anchor: 'intro' },
      quote: { exact: 'Hello world' },
    },
    bodyMarkdown: 'This is a **note**.',
  })

  assert.match(markdown, /^---/)
  assert.match(markdown, /documentId: doc-1/)
  assert.match(markdown, /readerType: markdown/)
  assert.match(markdown, /This is a \*\*note\*\*\./)
})

test('parseMarkdownDocument builds stable heading ids and TOC', async () => {
  const { parseMarkdownDocument } = await importMarkdownParser()

  const parsed = parseMarkdownDocument(`# Intro\n\nHello\n\n## Intro\n\nWorld`)

  assert.equal(parsed.toc.length, 1)
  assert.equal(parsed.toc[0].id, 'intro')
  assert.equal(parsed.toc[0].children?.[0].id, 'intro-2')
})

test('searchMarkdownDocument finds section matches', async () => {
  const { searchMarkdownDocument } = await importMarkdownParser()

  const results = searchMarkdownDocument(`# Alpha\n\nBeta Gamma\n\n# Delta\n\nEpsilon`, 'gamma')

  assert.equal(results.length, 1)
  assert.equal(results[0].locator.kind, 'anchor')
})
