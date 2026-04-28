import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

async function readSource(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), 'utf8')
}

test('SharedReader suppresses seek when the current interaction produced a text selection', async () => {
  const sharedSource = await readSource('components/media-reader/shared-reader.tsx')

  assert.match(sharedSource, /useMediaSelectionGesture/)
  assert.match(sharedSource, /const selectionGesture = useMediaSelectionGesture\(\)/)
  assert.match(sharedSource, /const handleSeekIntent = useCallback\(/)
  assert.match(sharedSource, /if \(selectionGesture\.shouldSuppressSeek\(\)\) \{/)
  assert.match(sharedSource, /selectionGesture\.syncAfterGesture\(\)/)
  assert.match(sharedSource, /onPointerDownCapture=\{selectionGesture\.handlePointerDownCapture\}/)
  assert.match(sharedSource, /onPointerUpCapture=\{selectionGesture\.handlePointerUpCapture\}/)
  assert.match(sharedSource, /onKeyUpCapture=\{selectionGesture\.handleKeyUpCapture\}/)
  assert.match(sharedSource, /onClick=\{\(\) => handleSeekIntent\(chapter\.seconds \* 1000\)\}/)
  assert.match(sharedSource, /onClick=\{\(\) => handleSeekIntent\(segment\.startMs\)\}/)
  assert.doesNotMatch(sharedSource, /onClick=\{\(\) => onSeek\(chapter\.seconds \* 1000\)\}/)
  assert.doesNotMatch(sharedSource, /onClick=\{\(\) => onSeek\(segment\.startMs\)\}/)
})

for (const relativePath of [
  'components/media-reader/youtube-reader.tsx',
  'components/media-reader/podcast-reader.tsx',
]) {
  test(`${relativePath} captures selection after stable pointer and keyboard events`, async () => {
    const source = await readSource(relativePath)

    assert.match(source, /const syncSelection = useCallback\(/)
    assert.match(source, /window\.requestAnimationFrame\(/)
    assert.match(source, /document\.addEventListener\('pointerup', syncSelection\)/)
    assert.match(source, /document\.addEventListener\('keyup', syncSelection\)/)
    assert.doesNotMatch(source, /document\.addEventListener\('selectionchange'/)
  })
}
