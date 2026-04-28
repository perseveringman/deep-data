import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('SharedReader lets users enter a free-view mode and resume auto-follow explicitly', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/media-reader/shared-reader.tsx'),
    'utf8',
  )

  assert.match(source, /const \[autoFollowMode, setAutoFollowMode\] = useState<'following' \| 'free'>\('following'\)/)
  assert.match(source, /const isAutoFollowPaused = autoFollowMode === 'free'/)
  assert.match(source, /const programmaticScrollRef = useRef\(false\)/)
  assert.match(source, /const handleScrollContainerScroll = useCallback\(/)
  assert.match(source, /if \(!isPlaying \|\| programmaticScrollRef\.current\) return/)
  assert.match(source, /setAutoFollowMode\('free'\)/)
  assert.match(source, /const resumeAutoFollow = useCallback\(/)
  assert.match(source, /setAutoFollowMode\('following'\)/)
  assert.match(source, /scrollActiveItemIntoView\(\)/)
  assert.match(source, /const scrollSettledFrameRef = useRef<number \| null>\(null\)/)
  assert.match(source, /const unlockProgrammaticScroll = useCallback\(\(\) =>/)
  assert.match(source, /window\.cancelAnimationFrame\(scrollSettledFrameRef\.current\)/)
  assert.match(source, /programmaticScrollRef\.current = false/)
  assert.match(source, /正在自由查看/)
  assert.match(source, /回到自动滚动/)
  assert.match(source, /onScroll=\{handleScrollContainerScroll\}/)
  assert.match(source, /if \(!isPlaying \|\| isAutoFollowPaused \|\| !scrollContainerRef\.current \|\| !activeItemRef\.current\) return/)
})

test('SharedReader renders the free-view hint as a compact top-right overlay outside the scroll flow', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/media-reader/shared-reader.tsx'),
    'utf8',
  )

  assert.match(source, /className="relative flex-1 overflow-y-auto"/)
  assert.match(source, /className="pointer-events-none absolute right-2 top-2 z-10 flex justify-end"/)
  assert.match(source, /className="pointer-events-auto max-w-\[220px\] rounded-md border bg-background\/95 px-2\.5 py-2 shadow-sm backdrop-blur"/)
})

test('SharedReader resumes auto-follow when a transcript or chapter seek is explicitly chosen', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/media-reader/shared-reader.tsx'),
    'utf8',
  )

  assert.match(source, /const handleSeekIntent = useCallback\(/)
  assert.match(source, /setAutoFollowMode\('following'\)/)
  assert.match(source, /onClick=\{\(\) => handleSeekIntent\(chapter\.seconds \* 1000\)\}/)
  assert.match(source, /onClick=\{\(\) => handleSeekIntent\(segment\.startMs\)\}/)
})
