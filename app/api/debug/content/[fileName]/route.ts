import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'

import { resolveDebugContentAssetPath } from '@/lib/reader-debug-fixtures'

function getContentType(fileName: string): string {
  switch (path.extname(fileName).toLowerCase()) {
    case '.pdf':
      return 'application/pdf'
    case '.epub':
      return 'application/epub+zip'
    case '.md':
      return 'text/markdown; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> },
) {
  const { fileName } = await params
  const decodedFileName = decodeURIComponent(fileName)
  const filePath = resolveDebugContentAssetPath(decodedFileName)

  if (!filePath) {
    return NextResponse.json({ error: 'Debug fixture not found' }, { status: 404 })
  }

  try {
    const file = await readFile(filePath)
    return new NextResponse(file, {
      headers: {
        'Content-Type': getContentType(decodedFileName),
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Debug fixture unreadable' }, { status: 404 })
  }
}
