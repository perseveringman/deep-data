import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function moduleUrl(relativePath: string): string {
  const url = pathToFileURL(path.join(process.cwd(), relativePath))
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

async function importHelpers() {
  return import(moduleUrl('components/media-reader/helpers.ts'))
}

test('getYouTubeVideoId extracts ids from common YouTube URLs', async () => {
  const { getYouTubeVideoId } = await importHelpers()

  assert.equal(getYouTubeVideoId('https://www.youtube.com/watch?v=abc123XYZ'), 'abc123XYZ')
  assert.equal(getYouTubeVideoId('https://youtu.be/abc123XYZ?t=30'), 'abc123XYZ')
  assert.equal(getYouTubeVideoId('https://www.youtube.com/embed/abc123XYZ'), 'abc123XYZ')
})

test('canRenderAudioSource rejects YouTube URLs', async () => {
  const { canRenderAudioSource } = await importHelpers()

  assert.equal(canRenderAudioSource('https://cdn.example.com/episode.mp3'), true)
  assert.equal(canRenderAudioSource('https://www.youtube.com/watch?v=abc123XYZ'), false)
  assert.equal(canRenderAudioSource(undefined), false)
})

test('findActiveChapterIndex tracks the current chapter', async () => {
  const { findActiveChapterIndex } = await importHelpers()

  const index = findActiveChapterIndex(95_000, [
    { time: '0:00', seconds: 0, title: 'Intro' },
    { time: '1:00', seconds: 60, title: 'Main' },
    { time: '2:00', seconds: 120, title: 'Outro' },
  ])

  assert.equal(index, 1)
})

test('formatTime renders hour and minute durations', async () => {
  const { formatTime } = await importHelpers()

  assert.equal(formatTime(65_000), '1:05')
  assert.equal(formatTime(3_725_000), '1:02:05')
})
