/**
 * PodAdmin (DataHub) API client
 *
 * Connects to the podadmin backend to fetch podcast / YouTube / multi-channel
 * document data. Set PODADMIN_API_URL and PODADMIN_API_KEY in your environment
 * (or .env.local) to point at the running instance.
 */

const API_BASE = process.env.PODADMIN_API_URL || 'http://localhost:8000'
const API_KEY = process.env.PODADMIN_API_KEY || ''

async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'X-API-Key': API_KEY,
      'Accept': 'application/json',
      ...(init?.headers || {}),
    },
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  })
  if (!res.ok) {
    throw new Error(`PodAdmin API error: ${res.status} ${res.statusText} — ${url}`)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Types (aligned with podadmin schemas)
// ---------------------------------------------------------------------------

export interface DocumentItem {
  id: number
  doc_id: string
  source_type: string    // "podcast" | "youtube" | "twitter" | …
  source: string | null
  title: string
  podcast_title: string | null
  published_at: string | null
  duration_seconds: number | null
  tags: string[]
  summary_excerpt: string | null
  cover_url: string | null
  audio_url: string | null
  has_transcript: boolean
  file_path: string | null
  file_size: number | null
  content_sha256: string | null
  cos_url: string | null
  cos_sync_status: string | null
  created_at: string | null
  updated_at: string | null
  archived_at: string | null
  parent_doc_id: string | null
  enrichment_kind: string | null
  enriched_at: string | null
  // included when ?include=body
  body?: string
  body_error?: string | null
}

export interface DocumentListResponse {
  items: DocumentItem[]
  next_cursor: string | null
  limit: number
}

export interface ChannelInfo {
  value: string   // source_type slug
  label: string   // display name (Chinese)
  icon: string    // emoji
  count: number
}

export interface ChannelsResponse {
  channels: ChannelInfo[]
  total: number
}

export interface SourceInfo {
  source_type: string
  source: string
  count: number
}

export interface SourcesResponse {
  sources: SourceInfo[]
}

export interface TagInfo {
  tag: string
  count: number
}

export interface TagsResponse {
  tags: TagInfo[]
}

export interface SearchResponse {
  items: any[]
  total: number
  page: number
  page_size: number
  query: string
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** List documents with optional filters */
export async function listDocuments(params?: {
  source_type?: string
  source?: string
  tag?: string
  q?: string
  cursor?: string
  limit?: number
}): Promise<DocumentListResponse> {
  const sp = new URLSearchParams()
  if (params?.source_type) sp.set('source_type', params.source_type)
  if (params?.source) sp.set('source', params.source)
  if (params?.tag) sp.set('tag', params.tag)
  if (params?.q) sp.set('q', params.q)
  if (params?.cursor) sp.set('cursor', params.cursor)
  if (params?.limit) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  return apiFetch<DocumentListResponse>(`/documents${qs ? `?${qs}` : ''}`)
}

/** Get a single document by id or doc_id. Pass include='body' for markdown body. */
export async function getDocument(ref: string | number, includeBody = false): Promise<DocumentItem> {
  const qs = includeBody ? '?include=body' : ''
  return apiFetch<DocumentItem>(`/documents/${ref}${qs}`)
}

/** Get raw markdown content of a document */
export async function getDocumentRaw(ref: string | number): Promise<string> {
  const url = `${API_BASE}/api/v1/documents/${ref}/raw`
  const res = await fetch(url, {
    headers: {
      'X-API-Key': API_KEY,
    },
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`PodAdmin API error: ${res.status} — ${url}`)
  }
  return res.text()
}

/** List channel (source_type) catalog with counts */
export async function listChannels(): Promise<ChannelsResponse> {
  return apiFetch<ChannelsResponse>('/channels')
}

/** List sources (per-channel breakdown) */
export async function listSources(source_type?: string): Promise<SourcesResponse> {
  const qs = source_type ? `?source_type=${source_type}` : ''
  return apiFetch<SourcesResponse>(`/sources${qs}`)
}

/** List most-used tags */
export async function listTags(params?: {
  source_type?: string
  limit?: number
}): Promise<TagsResponse> {
  const sp = new URLSearchParams()
  if (params?.source_type) sp.set('source_type', params.source_type)
  if (params?.limit) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  return apiFetch<TagsResponse>(`/tags${qs ? `?${qs}` : ''}`)
}

/** Full-text search documents */
export async function searchDocuments(params: {
  q: string
  source_type?: string[]
  tag?: string
  page?: number
  page_size?: number
}): Promise<SearchResponse> {
  const sp = new URLSearchParams()
  sp.set('q', params.q)
  sp.set('type', 'document')
  if (params.source_type) {
    params.source_type.forEach(st => sp.append('source_type', st))
  }
  if (params.tag) sp.set('tag', params.tag)
  if (params.page != null) sp.set('page', String(params.page))
  if (params.page_size) sp.set('page_size', String(params.page_size))
  return apiFetch<SearchResponse>(`/search?${sp.toString()}`)
}

// ---------------------------------------------------------------------------
// Helpers — convert podadmin data to deep-data's ContentItem shape
// ---------------------------------------------------------------------------

import type { ContentItem } from './mock-data'

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Map a podadmin DocumentItem → deep-data ContentItem */
export function docToContentItem(doc: DocumentItem): ContentItem {
  const type: 'youtube' | 'podcast' = doc.source_type === 'youtube' ? 'youtube' : 'podcast'
  return {
    id: String(doc.id),
    type,
    title: doc.title || '(无标题)',
    channelId: doc.source || doc.source_type,
    channelName: doc.podcast_title || doc.source || doc.source_type,
    publishedAt: doc.published_at ? doc.published_at.slice(0, 10) : '',
    duration: formatDuration(doc.duration_seconds),
    durationSeconds: doc.duration_seconds || 0,
    coverUrl: doc.cover_url || undefined,
    audioUrl: doc.audio_url || undefined,
    tags: doc.tags || [],
    summary: doc.summary_excerpt || '',
    hasTranscript: doc.has_transcript,
    contentFile: '',
  }
}
