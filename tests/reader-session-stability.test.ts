import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('useReaderSession skips state updates for equivalent snapshots', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'components/reader-platform/hooks/use-reader-session.ts'),
    'utf8',
  )

  assert.match(source, /export function readerSessionSnapshotEquals\(/)
  assert.match(source, /setSnapshot\(\(current\) =>/)
  assert.match(source, /readerSessionSnapshotEquals\(current, nextSnapshot\) \? current : nextSnapshot/)
})
