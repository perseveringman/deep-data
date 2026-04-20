import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

type DocumentLike = {
  id: number
  doc_id: string
  source_type: string
  source: string | null
  title: string
  podcast_title: string | null
  published_at: string | null
  duration_seconds: number | null
  tags: string[]
  summary_excerpt: string | null
  cover_url: string | null
  audio_url: string | null
  source_url_canonical: string | null
  playback_url: string | null
  playback_kind: 'video' | 'audio' | 'none' | null
  has_transcript: boolean
  file_path: string | null
  file_size: number | null
  content_sha256: string | null
  cos_url: string | null
  cos_sync_status: string | null
  created_at: string | null
  updated_at: string | null
  archived_at: string | null
  parent_doc_id: string | null
  enrichment_kind: string | null
  enriched_at: string | null
  body?: string
  body_error?: string | null
}

function moduleUrl(relativePath: string): string {
  const url = pathToFileURL(path.join(process.cwd(), relativePath))
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

async function importApiModule() {
  return import(moduleUrl('lib/api.ts'))
}

function buildDocument(overrides: Partial<DocumentLike> = {}): DocumentLike {
  return {
    id: 42,
    doc_id: 'youtube:abc123',
    source_type: 'youtube',
    source: 'yt-subtitle-fetcher',
    title: 'Stable document reference',
    podcast_title: null,
    published_at: '2026-04-20T00:00:00Z',
    duration_seconds: 123,
    tags: ['security'],
    summary_excerpt: 'summary',
    cover_url: null,
    audio_url: null,
    source_url_canonical: null,
    playback_url: null,
    playback_kind: null,
    has_transcript: true,
    file_path: null,
    file_size: null,
    content_sha256: null,
    cos_url: null,
    cos_sync_status: null,
    created_at: null,
    updated_at: null,
    archived_at: null,
    parent_doc_id: null,
    enrichment_kind: null,
    enriched_at: null,
    ...overrides,
  }
}

test('docToContentItem uses stable doc_id for external content routes', async () => {
  const { docToContentItem } = await importApiModule()
  const item = docToContentItem(buildDocument())

  assert.equal(item.id, 'youtube:abc123')
})

test('docToContentItem maps podadmin playback fields into the right content URLs', async () => {
  const { docToContentItem } = await importApiModule()

  const youtubeItem = docToContentItem(buildDocument({
    source_type: 'youtube',
    source_url_canonical: 'https://www.youtube.com/watch?v=abc123',
    playback_url: 'https://www.youtube.com/watch?v=abc123',
    playback_kind: 'video',
  }))
  assert.equal(youtubeItem.playbackUrl, 'https://www.youtube.com/watch?v=abc123')
  assert.equal(youtubeItem.playbackKind, 'video')
  assert.equal(youtubeItem.videoUrl, 'https://www.youtube.com/watch?v=abc123')
  assert.equal(youtubeItem.audioUrl, undefined)

  const podcastItem = docToContentItem(buildDocument({
    doc_id: 'podcast:ep-1',
    source_type: 'podcast',
    source_url_canonical: 'https://podcasts.example.com/episodes/ep-1',
    playback_url: 'https://cdn.example.com/audio/ep-1.mp3',
    playback_kind: 'audio',
  }))
  assert.equal(podcastItem.playbackUrl, 'https://cdn.example.com/audio/ep-1.mp3')
  assert.equal(podcastItem.playbackKind, 'audio')
  assert.equal(podcastItem.audioUrl, 'https://cdn.example.com/audio/ep-1.mp3')
  assert.equal(podcastItem.videoUrl, undefined)
})

test('lib/api exports read headers that use the read key', async () => {
  process.env.PODADMIN_API_URL = 'https://podadmin.example.com'
  process.env.PODADMIN_API_KEY = 'read-key'
  process.env.DATAHUB_API_KEY = 'write-key'

  const api = await importApiModule()
  assert.equal(typeof api.getReadApiHeaders, 'function')

  const headers = new Headers(api.getReadApiHeaders())
  assert.equal(headers.get('X-API-Key'), 'read-key')
  assert.equal(headers.get('X-DataHub-Api-Key'), null)
  assert.equal(headers.get('Accept'), 'application/json')
})

test('lib/api falls back to DATAHUB_API_KEY for reads when no dedicated read key is configured', async () => {
  process.env.PODADMIN_API_URL = 'https://podadmin.example.com'
  process.env.PODADMIN_API_KEY = ''
  process.env.DATAHUB_API_KEY = 'legacy-shared-key'

  const api = await importApiModule()
  const headers = new Headers(api.getReadApiHeaders())

  assert.equal(headers.get('X-API-Key'), 'legacy-shared-key')
  assert.equal(headers.get('Accept'), 'application/json')
})

test('lib/api exports upload headers that use the upload key', async () => {
  process.env.PODADMIN_API_URL = 'https://podadmin.example.com'
  process.env.PODADMIN_API_KEY = 'read-key'
  process.env.DATAHUB_API_KEY = 'write-key'

  const api = await importApiModule()
  assert.equal(typeof api.getUploadApiHeaders, 'function')

  const headers = new Headers(api.getUploadApiHeaders({ 'Content-Type': 'application/json' }))
  assert.equal(headers.get('X-DataHub-Api-Key'), 'write-key')
  assert.equal(headers.get('X-API-Key'), null)
  assert.equal(headers.get('Content-Type'), 'application/json')
})
