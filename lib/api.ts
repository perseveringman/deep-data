/**
 * PodAdmin (DataHub) API client
 *
 * Connects to the podadmin backend to fetch podcast / YouTube / multi-channel
 * document data. Set PODADMIN_API_URL and PODADMIN_API_KEY in your environment
 * (or .env.local) to point at the running instance. For backward compatibility,
 * read requests also fall back to DATAHUB_API_KEY when no dedicated read key
 * is configured yet.
 */

export const PODADMIN_API_BASE = process.env.PODADMIN_API_URL || 'http://localhost:8000'
const READ_API_KEY = process.env.PODADMIN_API_KEY || process.env.DATAHUB_API_KEY || ''
const UPLOAD_API_KEY = process.env.DATAHUB_API_KEY || ''

function apiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return `/api/podadmin${path}`
  }
  return `${PODADMIN_API_BASE}/api/v1${path}`
}

export function getReadApiHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    'X-API-Key': READ_API_KEY,
    'Accept': 'application/json',
    ...headers,
  }
}

export function getUploadApiHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    'X-DataHub-Api-Key': UPLOAD_API_KEY,
    ...headers,
  }
}

async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = apiUrl(path)
  const res = await fetch(url, {
    ...init,
    headers: getReadApiHeaders(init?.headers || {}),
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  })
  if (!res.ok) {
    throw new Error(`PodAdmin API error: ${res.status} ${res.statusText} — ${url}`)
  }
  return res.json() as Promise<T>
}

async function apiText(path: string, init?: RequestInit): Promise<string> {
  const url = apiUrl(path)
  const res = await fetch(url, {
    ...init,
    headers: getReadApiHeaders(init?.headers || {}),
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`PodAdmin API error: ${res.status} ${res.statusText} — ${url}`)
  }
  return res.text()
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
  video_url: string | null
  audio_url: string | null
  source_url_canonical: string | null
  playback_url: string | null
  playback_kind: 'video' | 'audio' | 'none' | null
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

export interface ArtifactItem {
  id: number
  subject_kind: string
  subject_ref: string
  artifact_type: string
  version_key: string
  visibility: 'public' | 'private' | 'published'
  owner_user_id: string | null
  file_path: string
  status: 'pending' | 'generating' | 'done' | 'failed'
  error_message: string | null
  model_used: string | null
  tokens_input: number | null
  tokens_output: number | null
  source_doc_ids: string[]
  created_at: string
  updated_at: string
  title?: string | null
  subtitle?: string | null
  summary?: string | null
  category?: string | null
  status_tag?: string | null
  statusTag?: string | null
  cover_image?: string | null
  coverImage?: string | null
  summary_points?: string[] | null
  summaryPoints?: string[] | null
  related_channels?: string[] | null
  relatedChannels?: string[] | null
  tags?: string[] | null
  published_at?: string | null
  reading_time?: number | null
  reading_time_minutes?: number | null
  metadata?: Record<string, unknown> | null
  body?: string
  body_error?: string
}

export interface ArtifactListResponse {
  items: ArtifactItem[]
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  ts?: string
  model?: string
}

export interface ChatThread extends ArtifactItem {
  messages?: ChatMessage[]
}

export interface PersonItem {
  id: string
  name: string
  title?: string | null
  organization?: string | null
  avatar?: string | null
  tags?: string[]
  mention_count?: number
  mentionCount?: number
  first_mentioned?: string | null
  firstMentioned?: string | null
  last_mentioned?: string | null
  lastMentioned?: string | null
  description?: string | null
}

export interface PersonListResponse {
  items: PersonItem[]
  total?: number
}

export interface PersonRelationItem {
  source_id?: string
  sourceId?: string
  target_id?: string
  targetId?: string
  relation_type?: 'colleague' | 'competitor' | 'mentor' | 'collaborator' | 'critic' | 'supporter' | string
  relationType?: 'colleague' | 'competitor' | 'mentor' | 'collaborator' | 'critic' | 'supporter' | string
  strength?: number
  evidence?: {
    content_id?: string
    contentId?: string
    channel_name?: string
    channelName?: string
    snippet?: string
    date?: string
  }[]
}

export interface PersonMentionItem {
  id: string
  person_id?: string
  personId?: string
  channel_id?: string
  channelId?: string
  channel_name?: string
  channelName?: string
  content_title?: string
  contentTitle?: string
  snippet?: string
  sentiment?: 'positive' | 'negative' | 'neutral' | string
  date?: string
  topics?: string[]
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

/** Get a single document by stable doc_id. Pass include='body' for markdown body. */
export async function getDocument(ref: string, includeBody = false): Promise<DocumentItem> {
  const qs = includeBody ? '?include=body' : ''
  return apiFetch<DocumentItem>(`/documents/${ref}${qs}`)
}

/** Get raw markdown content of a document */
export async function getDocumentRaw(ref: string): Promise<string> {
  const url = apiUrl(`/documents/${ref}/raw`)
  const res = await fetch(url, {
    headers: getReadApiHeaders(),
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

export async function listArtifacts(params: {
  subject?: string
  subject_kind?: string
  subject_ref?: string
  artifact_type?: string
  visibility?: 'public' | 'private' | 'published'
  limit?: number
  cursor?: string
}): Promise<ArtifactListResponse> {
  const sp = new URLSearchParams()
  if (params.subject) sp.set('subject', params.subject)
  if (params.subject_kind) sp.set('subject_kind', params.subject_kind)
  if (params.subject_ref) sp.set('subject_ref', params.subject_ref)
  if (params.artifact_type) sp.set('artifact_type', params.artifact_type)
  if (params.visibility) sp.set('visibility', params.visibility)
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.cursor) sp.set('cursor', params.cursor)
  const qs = sp.toString()
  return apiFetch<ArtifactListResponse>(`/artifacts${qs ? `?${qs}` : ''}`)
}

export async function getArtifact(id: number, includeBody = true): Promise<ArtifactItem> {
  return apiFetch<ArtifactItem>(`/artifacts/${id}${includeBody ? '' : ''}`)
}

export async function getArtifactRaw(id: number): Promise<string> {
  return apiText(`/artifacts/${id}/raw`)
}

export async function getArtifactRawBySubject(params: {
  subject: string
  artifact_type: string
}): Promise<string> {
  const artifacts = await listArtifacts(params)
  const artifact = artifacts.items[0]
  if (!artifact) {
    throw new Error(`Artifact not found: ${params.subject} ${params.artifact_type}`)
  }
  return getArtifactRaw(artifact.id)
}

export async function runArtifact(body: {
  subject_kind: string
  subject_ref: string
  artifact_type: string
  params?: Record<string, unknown>
}): Promise<ArtifactItem> {
  return apiFetch<ArtifactItem>('/artifacts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getDailyDigest(day: string): Promise<ArtifactItem> {
  return apiFetch<ArtifactItem>(`/daily/${day}`)
}

export async function createChatThread(body: {
  subject_kind: string
  subject_ref: string
  messages?: ChatMessage[]
}): Promise<ChatThread> {
  return apiFetch<ChatThread>('/chat/threads', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getChatThread(threadId: number): Promise<ChatThread> {
  return apiFetch<ChatThread>(`/chat/threads/${threadId}`)
}

export async function sendChatMessage(threadId: number, content: string): Promise<{
  thread: ArtifactItem
  message: ChatMessage
}> {
  return apiFetch(`/chat/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function publishChatThread(threadId: number): Promise<ArtifactItem> {
  return apiFetch<ArtifactItem>(`/chat/threads/${threadId}/publish`, { method: 'POST' })
}

export async function forkChatThread(threadId: number): Promise<ChatThread> {
  return apiFetch<ChatThread>(`/chat/threads/${threadId}/fork`, { method: 'POST' })
}

export async function listPersons(params?: {
  q?: string
  tag?: string
  limit?: number
}): Promise<PersonListResponse> {
  const sp = new URLSearchParams()
  if (params?.q) sp.set('q', params.q)
  if (params?.tag) sp.set('tag', params.tag)
  if (params?.limit) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  return apiFetch<PersonListResponse>(`/persons${qs ? `?${qs}` : ''}`)
}

export async function getPerson(id: string): Promise<PersonItem> {
  return apiFetch<PersonItem>(`/persons/${encodeURIComponent(id)}`)
}

export async function listPersonMentions(id: string, params?: { limit?: number }): Promise<{ items: PersonMentionItem[] }> {
  const qs = params?.limit ? `?limit=${params.limit}` : ''
  return apiFetch<{ items: PersonMentionItem[] }>(`/persons/${encodeURIComponent(id)}/mentions${qs}`)
}

export async function listPersonRelations(id: string): Promise<{ items: PersonRelationItem[] }> {
  return apiFetch<{ items: PersonRelationItem[] }>(`/persons/${encodeURIComponent(id)}/relations`)
}

export async function listGlobalPersonRelations(): Promise<{ items: PersonRelationItem[] }> {
  return apiFetch<{ items: PersonRelationItem[] }>('/persons/relations')
}

// ---------------------------------------------------------------------------
// Helpers — convert podadmin data to deep-data's ContentItem shape
// ---------------------------------------------------------------------------

import type { ContentItem } from './types'

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Map a podadmin DocumentItem → deep-data ContentItem */
export function getDocumentRouteId(doc: Pick<DocumentItem, 'doc_id' | 'id'>): string {
  return doc.doc_id || String(doc.id)
}

function getPlayback(doc: DocumentItem): {
  playbackUrl?: string
  playbackKind: 'video' | 'audio' | 'none'
} {
  const playbackKind =
    doc.playback_kind ||
    (doc.source_type === 'youtube' ? 'video' : doc.audio_url ? 'audio' : 'none')

  const playbackUrl =
    doc.playback_url ||
    (playbackKind === 'video'
      ? doc.video_url || doc.source_url_canonical || undefined
      : playbackKind === 'audio'
        ? doc.audio_url || undefined
        : undefined)

  return { playbackUrl, playbackKind }
}

/** Map a podadmin DocumentItem → deep-data ContentItem */
export function docToContentItem(doc: DocumentItem): ContentItem {
  const type: 'youtube' | 'podcast' = doc.source_type === 'youtube' ? 'youtube' : 'podcast'
  const { playbackUrl, playbackKind } = getPlayback(doc)

  return {
    id: getDocumentRouteId(doc),
    type,
    title: doc.title || '(无标题)',
    channelId: doc.source || doc.source_type,
    channelName: doc.podcast_title || doc.source || doc.source_type,
    publishedAt: doc.published_at ? doc.published_at.slice(0, 10) : '',
    duration: formatDuration(doc.duration_seconds),
    durationSeconds: doc.duration_seconds || 0,
    coverUrl: doc.cover_url || undefined,
    playbackUrl,
    playbackKind,
    videoUrl: type === 'youtube' ? playbackUrl : undefined,
    audioUrl: type === 'podcast' && playbackKind === 'audio' ? playbackUrl : undefined,
    tags: doc.tags || [],
    summary: doc.summary_excerpt || '',
    hasTranscript: doc.has_transcript,
    contentFile: '',
  }
}
