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

async function importRuntime() {
  return import(moduleUrl('components/reader-platform/runtime.ts'))
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

test('buildReaderTranslationRequest uses selection scope from the current snapshot', async () => {
  const { buildReaderTranslationRequest } = await importRuntime()

  const request = buildReaderTranslationRequest({
    provider: 'llm',
    targetLang: 'zh-CN',
    scope: 'selection',
    snapshot: {
      document: { readerType: 'markdown', documentId: 'doc-1', title: 'Alpha' },
      location: { kind: 'anchor', anchor: 'intro' },
      selection: {
        text: 'Hello world',
        range: {
          start: { kind: 'anchor', anchor: 'intro' },
          quote: { exact: 'Hello world' },
        },
      },
      visibleContent: [
        { id: 'intro', text: 'Hello world and more', locator: { kind: 'anchor', anchor: 'intro' } },
      ],
    },
  })

  assert.equal(request.scope, 'selection')
  assert.equal(request.segments.length, 1)
  assert.equal(request.segments[0].text, 'Hello world')
  assert.deepEqual(request.readerSnapshot.location, { kind: 'anchor', anchor: 'intro' })
})

test('buildReaderTranslationRequest uses active unit and visible content scopes', async () => {
  const { buildReaderTranslationRequest } = await importRuntime()

  const snapshot = {
    document: { readerType: 'pdf', documentId: 'doc-2', title: 'Paper' },
    location: { kind: 'page', page: 8 },
    visibleContent: [
      { id: 'page-8-a', text: 'First visible block', locator: { kind: 'page', page: 8 } },
      { id: 'page-8-b', text: 'Second visible block', locator: { kind: 'page', page: 8 } },
    ],
  } as const

  const activeRequest = buildReaderTranslationRequest({
    provider: 'llm',
    targetLang: 'zh-CN',
    scope: 'active-unit',
    snapshot,
    activeUnit: {
      id: 'page-8',
      title: 'Page 8',
      text: 'Current page text',
      locator: { kind: 'page', page: 8 },
    },
  })

  assert.equal(activeRequest.segments.length, 1)
  assert.equal(activeRequest.segments[0].id, 'page-8')
  assert.equal(activeRequest.segments[0].text, 'Current page text')

  const visibleRequest = buildReaderTranslationRequest({
    provider: 'llm',
    targetLang: 'zh-CN',
    scope: 'visible',
    snapshot,
  })

  assert.equal(visibleRequest.segments.length, 2)
  assert.equal(visibleRequest.segments[1].text, 'Second visible block')
})

test('buildReaderAnalysisContext merges live reader state into canonical context', async () => {
  const { buildReaderAnalysisContext } = await importRuntime()
  const { defaultReaderCapabilities, defaultReaderPreferences } = await importPreferences()

  const context = buildReaderAnalysisContext({
    snapshot: {
      document: { readerType: 'epub', documentId: 'book-1', title: 'Book' },
      location: { kind: 'cfi', cfi: 'epubcfi(/6/2)' },
      progress: 0.42,
      selection: {
        text: 'Selected quote',
        range: {
          start: { kind: 'cfi', cfi: 'epubcfi(/6/2)' },
          quote: { exact: 'Selected quote' },
        },
      },
      visibleContent: [
        { id: 'section-1', text: 'Visible body text', locator: { kind: 'cfi', cfi: 'epubcfi(/6/2)' } },
      ],
    },
    activeUnit: {
      id: 'section-1',
      title: 'Chapter 1',
      text: 'Visible body text',
      locator: { kind: 'cfi', cfi: 'epubcfi(/6/2)' },
    },
    annotations: [
      {
        id: 'ann-1',
        documentId: 'book-1',
        readerType: 'epub',
        color: 'yellow',
        createdAt: '2026-04-22T00:00:00Z',
        range: {
          start: { kind: 'cfi', cfi: 'epubcfi(/6/2)' },
          quote: { exact: 'Selected quote' },
        },
      },
    ],
    preferences: defaultReaderPreferences,
    capabilities: { ...defaultReaderCapabilities, aiContext: true, annotations: true, translation: true },
  })

  assert.equal(context.document.documentId, 'book-1')
  assert.equal(context.location.progress, 0.42)
  assert.equal(context.selection?.text, 'Selected quote')
  assert.equal(context.activeUnit?.title, 'Chapter 1')
  assert.equal(context.visibleContent.length, 1)
  assert.equal(context.annotations?.length, 1)
  assert.equal(context.capabilities.aiContext, true)
})
