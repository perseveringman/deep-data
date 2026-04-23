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

async function importContentParser() {
  return import(moduleUrl('lib/content-parser.ts'))
}

test('content-parser stays shared between server and client code', async () => {
  const source = await readFile(path.join(process.cwd(), 'lib/content-parser.ts'), 'utf8')

  assert.equal(
    /^\s*["']use client["']/.test(source),
    false,
    'lib/content-parser.ts must remain server-importable for app routes'
  )
})

test('parseYouTubeContent extracts chapters from common timestamp lines in Description', async () => {
  const { parseYouTubeContent } = await importContentParser()

  const content = parseYouTubeContent(`---
video_id: abc123
title: Chaptered Video
---

# Chaptered Video

## Description

0:00 Intro
12:34 Main topic
1:02:03 Wrap up

## Transcript

00:00:05 - This is transcript text, not a chapter.
`)

  assert.deepEqual(content.timestamps, [
    { time: '0:00', seconds: 0, title: 'Intro' },
    { time: '12:34', seconds: 754, title: 'Main topic' },
    { time: '1:02:03', seconds: 3723, title: 'Wrap up' },
  ])
})

test('parseYouTubeContent excludes transcript markers from Description', async () => {
  const { parseYouTubeContent } = await importContentParser()

  const content = parseYouTubeContent(`---
video_id: abc123
title: Marker-free Description
---

# Marker-free Description

## Description

Example description

<!-- YOUTUBE_TRANSCRIPT_START -->
## Transcript

00:00:05.120 --> 00:00:07.000
Hello world

<!-- YOUTUBE_TRANSCRIPT_END -->
`)

  assert.equal(content.description, 'Example description')
})

test('parseYouTubeContent extracts timed subtitle cues from Transcript', async () => {
  const { parseYouTubeContent } = await importContentParser()

  const content = parseYouTubeContent(`---
video_id: abc123
title: Timed Transcript Video
---

# Timed Transcript Video

## Description

Example description

## Transcript

00:00:05.120 --> 00:00:07.000
Hello world

00:00:07.000 --> 00:00:09.250
Subtitle cue two

<!-- YOUTUBE_TRANSCRIPT_END -->
`)

  assert.deepEqual(content.transcript, [
    { startMs: 5120, text: 'Hello world' },
    { startMs: 7000, text: 'Subtitle cue two' },
  ])
})

test('parseYouTubeContent extracts second-precision subtitle cues from Transcript', async () => {
  const { parseYouTubeContent } = await importContentParser()

  const content = parseYouTubeContent(`---
video_id: abc123
title: Second Precision Transcript Video
---

# Second Precision Transcript Video

## Description

Example description

## Transcript

00:00:05 --> 00:00:07
Hello world

00:00:07 --> 00:00:10
Subtitle cue two

<!-- YOUTUBE_TRANSCRIPT_END -->
`)

  assert.deepEqual(content.transcript, [
    { startMs: 5000, text: 'Hello world' },
    { startMs: 7000, text: 'Subtitle cue two' },
  ])
})

test('parseYouTubeContent ignores transcript end marker for legacy paragraph transcripts', async () => {
  const { parseYouTubeContent } = await importContentParser()

  const content = parseYouTubeContent(`---
video_id: legacy123
title: Legacy Transcript Video
---

# Legacy Transcript Video

## Description

Example description

## Transcript

Legacy paragraph transcript

<!-- YOUTUBE_TRANSCRIPT_END -->
`)

  assert.deepEqual(content.transcript, [
    { startMs: 0, text: 'Legacy paragraph transcript' },
  ])
})
