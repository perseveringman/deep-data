import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

async function readSource(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), 'utf8')
}

for (const relativePath of [
  'components/media-reader/youtube-reader.tsx',
  'components/media-reader/podcast-reader.tsx',
]) {
  test(`${relativePath} memoizes runtime inputs used by snapshot effects`, async () => {
    const source = await readSource(relativePath)

    assert.match(source, /const mergedMessages = useMemo\(\(\) => resolveReaderMessages\(messages\), \[messages\]\)/)
    assert.match(source, /const resolvedPreferences = (useMemo\(|managedPreferences\.preferences)/)
    assert.match(source, /preferences: resolvedPreferences/)
    assert.match(source, /const activeUnit = useMemo\(/)
    assert.match(source, /const contentSurfaceRef = useRef<HTMLDivElement>\(null\)/)
    assert.match(source, /root: contentSurfaceRef\.current/)
    assert.match(source, /renderReaderQuoteHighlights\(contentSurfaceRef\.current, runtime\.annotations\)/)
    assert.match(source, /surfaceRef=\{contentSurfaceRef\}/)
  })
}
