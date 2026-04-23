import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function moduleUrl(relativePath: string): string {
  const url = pathToFileURL(path.join(process.cwd(), relativePath))
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

async function importPersistence() {
  return import(moduleUrl('components/reader-platform/persistence.ts'))
}

function createStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

test('reader persistence stores preferences and locators under one document key', async () => {
  const {
    clearStoredReaderLocator,
    readStoredReaderLocator,
    readStoredReaderPreferences,
    writeStoredReaderLocator,
    writeStoredReaderPreferences,
  } = await importPersistence()

  const storage = createStorage()
  const identity = {
    readerType: 'markdown' as const,
    documentId: 'doc-1',
    contentVersion: 'v2',
  }

  writeStoredReaderPreferences(storage, identity, {
    typography: { fontSize: 18, lineHeight: 1.9 },
  })
  writeStoredReaderLocator(storage, identity, {
    kind: 'anchor',
    anchor: 'chapter-2',
  })

  assert.deepEqual(readStoredReaderPreferences(storage, identity), {
    typography: { fontSize: 18, lineHeight: 1.9 },
  })
  assert.deepEqual(readStoredReaderLocator(storage, identity), {
    kind: 'anchor',
    anchor: 'chapter-2',
  })

  clearStoredReaderLocator(storage, identity)

  assert.equal(readStoredReaderLocator(storage, identity), null)
  assert.deepEqual(readStoredReaderPreferences(storage, identity), {
    typography: { fontSize: 18, lineHeight: 1.9 },
  })
})

test('ReaderSettingsPanel exposes the full reader preference surface', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/document-reader/shared/settings-panel.tsx'),
    'utf8',
  )

  assert.match(source, /accentColorOptions/)
  assert.match(source, /surfaceStyle/)
  assert.match(source, /fontFamilyOptions/)
  assert.match(source, /paragraphSpacing/)
  assert.match(source, /sidebarVisible/)
  assert.match(source, /autoSaveProgress/)
  assert.match(source, /reduceMotion/)
  assert.match(source, /selectionMenu/)
})

test('readers wire settings persistence and runtime behavior into shared surfaces', async () => {
  const markdownSource = await readFile(
    path.join(process.cwd(), 'components/document-reader/markdown/markdown-reader.tsx'),
    'utf8',
  )
  const pdfSource = await readFile(
    path.join(process.cwd(), 'components/document-reader/pdf/pdf-reader.tsx'),
    'utf8',
  )
  const shellSource = await readFile(
    path.join(process.cwd(), 'components/document-reader/shared/document-shell.tsx'),
    'utf8',
  )
  const sharedSource = await readFile(
    path.join(process.cwd(), 'components/media-reader/shared-reader.tsx'),
    'utf8',
  )

  assert.match(markdownSource, /useManagedReaderPreferences/)
  assert.match(markdownSource, /writeStoredReaderLocator/)
  assert.match(pdfSource, /scrollMode === 'scrolled'/)
  assert.match(pdfSource, /Array\.from\(\{ length: numPages \|\| 0 \}/)
  assert.match(shellSource, /onPreferencesChange\?: \(patch: ReaderPreferencesPatch\) => void/)
  assert.match(shellSource, /onPreferencesChange=\{\(patch\) => onPreferencesChange\?\.\(patch\)\}/)
  assert.match(sharedSource, /ReaderSettingsPanel/)
  assert.match(sharedSource, /preferences=\{resolvedPreferences\}/)
})
