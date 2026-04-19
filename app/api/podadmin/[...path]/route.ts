import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PODADMIN_API_URL || 'http://localhost:8000'
const API_KEY = process.env.PODADMIN_API_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const upstream = `${API_BASE}/api/v1/${path.join('/')}`
  const url = new URL(upstream)

  // Forward query params
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))

  try {
    const res = await fetch(url.toString(), {
      headers: { 'X-API-Key': API_KEY },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unreachable' }, { status: 502 })
  }
}
