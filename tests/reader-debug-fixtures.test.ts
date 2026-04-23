import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function moduleUrl(relativePath: string): string {
  const url = pathToFileURL(path.join(process.cwd(), relativePath))
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

async function importReaderDebugFixtures() {
  return import(moduleUrl('lib/reader-debug-fixtures.ts'))
}

test('getReaderDebugFixtures exposes one fixture for each supported reader', async () => {
  const { getReaderDebugFixtures } = await importReaderDebugFixtures()

  const fixtures = await getReaderDebugFixtures()

  assert.equal(fixtures.length, 5)
  assert.deepEqual(
    fixtures.map((fixture: { type: string }) => fixture.type),
    ['youtube', 'podcast', 'markdown', 'pdf', 'epub'],
  )

  const markdownFixture = fixtures.find((fixture: { type: string }) => fixture.type === 'markdown')
  assert.equal(typeof markdownFixture.markdownContent, 'string')
  assert.equal(markdownFixture.markdownContent.includes('#'), true)

  const pdfFixture = fixtures.find((fixture: { type: string }) => fixture.type === 'pdf')
  assert.match(pdfFixture.source.url, /^\/api\/debug\/content\//)
  assert.match(pdfFixture.source.url, /The_Innovators_Dilemma/)

  const epubFixture = fixtures.find((fixture: { type: string }) => fixture.type === 'epub')
  assert.match(epubFixture.source.url, /^\/api\/debug\/content\//)
  assert.match(epubFixture.source.url, /Pitch_Perfect/)

  const youtubeFixture = fixtures.find((fixture: { type: string }) => fixture.type === 'youtube')
  assert.equal(youtubeFixture.content.type, 'youtube')
  assert.equal(youtubeFixture.markdownContent.length > 0, true)

  const podcastFixture = fixtures.find((fixture: { type: string }) => fixture.type === 'podcast')
  assert.equal(podcastFixture.content.type, 'podcast')
  assert.equal(podcastFixture.markdownContent.length > 0, true)
})

test('getDebugContentAssetUrl safely encodes unusual filenames', async () => {
  const { getDebugContentAssetUrl } = await importReaderDebugFixtures()

  const url = getDebugContentAssetUrl('Pitch Perfect, demo.epub')

  assert.equal(url, '/api/debug/content/Pitch%20Perfect%2C%20demo.epub')
})
