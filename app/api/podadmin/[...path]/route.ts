import { NextRequest, NextResponse } from 'next/server'
import { PODADMIN_API_BASE, getReadApiHeaders, getUploadApiHeaders } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const upstream = `${PODADMIN_API_BASE}/api/v1/${path.join('/')}`
  const url = new URL(upstream)

  // Forward query params
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))

  try {
    const res = await fetch(url.toString(), {
      headers: getReadApiHeaders(),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unreachable' }, { status: 502 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const upstream = `${PODADMIN_API_BASE}/api/v1/${path.join('/')}`
  const url = new URL(upstream)

  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const contentType = request.headers.get('content-type') || 'application/json'
  const body = await request.arrayBuffer()

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: getUploadApiHeaders({
        'Content-Type': contentType,
      }),
      body,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unreachable' }, { status: 502 })
  }
}
