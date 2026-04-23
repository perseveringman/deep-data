import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('debug reader singular route redirects to the plural workbench path', async () => {
  const routePath = path.join(process.cwd(), 'app/debug/reader/page.tsx')
  const source = await readFile(routePath, 'utf8')

  assert.match(source, /from 'next\/navigation'/)
  assert.match(source, /redirect\('\/debug\/readers'\)/)
})
