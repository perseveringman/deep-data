import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { XFeedItem } from '@/lib/types'

const DEFAULT_FEEDS_DIR = '/Users/ryanbzhou/myvault2/feeds'
const DEFAULT_X_FEED_LIMIT = 240
const TWEET_URL_PATTERN = /^https?:\/\/(?:x|twitter)\.com\/[^/]+\/status\/\d+/i
const EXTERNAL_URL_PATTERN = /https?:\/\/[^\s)]+/g

interface FeedSourceRecord {
  id: string
  title?: string
  kind?: string
  metadata?: {
    provider?: string
    x_source_type?: string
    x_timeline_type?: string
  }
}

interface FeedItemRecord {
  id: string
  source_id?: string
  title?: string
  url?: string
  canonical_url?: string
  author?: string
  published_at?: string
  fetched_at?: string
  summary?: string
  excerpt?: string
  metadata?: {
    provider?: string
    source_url?: string
    x_source_type?: string
    x_timeline_type?: string
    x_handle?: string
    author_handle?: string
    is_reply?: boolean
    like_count?: number
    view_count?: number
    retweet_count?: number
    reply_count?: number
    outbound_url?: string
    x_urls?: Array<{
      url?: string
      expanded_url?: string
    }>
  }
}

function feedsDirectory() {
  return process.env.FEEDS_DIR || DEFAULT_FEEDS_DIR
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(/* turbopackIgnore: true */ filePath, 'utf8')) as T
  } catch {
    return null
  }
}

function normalizeHandle(value?: string) {
  return (value || '').trim().replace(/^@/, '')
}

function sourceKind(source?: FeedSourceRecord, item?: FeedItemRecord): XFeedItem['sourceKind'] {
  const timeline = item?.metadata?.x_timeline_type || source?.metadata?.x_timeline_type
  const sourceType = item?.metadata?.x_source_type || source?.metadata?.x_source_type

  if (timeline === 'for-you') return 'for-you'
  if (timeline === 'following') return 'following'
  if (sourceType === 'profile') return 'profile'
  return 'timeline'
}

function sourceTitle(source?: FeedSourceRecord, kind?: XFeedItem['sourceKind']) {
  if (source?.title) return source.title
  if (kind === 'for-you') return 'X For You'
  if (kind === 'following') return 'X Following'
  if (kind === 'profile') return 'X Profile'
  return 'X Timeline'
}

function displayNameFromHandle(handle: string) {
  if (!handle) return 'Unknown'
  return handle
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || handle
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractExternalUrls(item: FeedItemRecord, text: string, tweetUrl: string) {
  const textUrls = text.match(EXTERNAL_URL_PATTERN) || []
  const metadataUrls = [
    item.metadata?.outbound_url,
    ...(item.metadata?.x_urls || []).flatMap((url) => [url.expanded_url, url.url]),
  ]
  const urls = [...textUrls, ...metadataUrls].filter((url): url is string => Boolean(url))

  return Array.from(new Set(urls.map((url) => url.replace(/[.,;!?]+$/, '')))).filter(
    (url) => url !== tweetUrl && url !== item.canonical_url && !TWEET_URL_PATTERN.test(url),
  )
}

function isXItem(item: FeedItemRecord, source?: FeedSourceRecord) {
  return (
    item.metadata?.provider === 'x' ||
    source?.metadata?.provider === 'x' ||
    source?.kind === 'twitter' ||
    TWEET_URL_PATTERN.test(item.url || '') ||
    TWEET_URL_PATTERN.test(item.canonical_url || '')
  )
}

function mapItem(item: FeedItemRecord, source?: FeedSourceRecord): XFeedItem | null {
  if (!item.id || !isXItem(item, source)) return null

  const handle = normalizeHandle(item.metadata?.author_handle || item.metadata?.x_handle || item.author)
  const text = decodeHtmlEntities((item.summary || item.excerpt || item.title || '').trim())
  const url = item.url || item.canonical_url || ''
  const kind = sourceKind(source, item)

  if (!text || !url) return null

  return {
    id: item.id,
    sourceId: item.source_id || source?.id || '',
    sourceTitle: sourceTitle(source, kind),
    sourceKind: kind,
    authorHandle: handle,
    authorName: displayNameFromHandle(handle),
    text,
    url,
    canonicalUrl: item.canonical_url || url,
    publishedAt: item.published_at || item.fetched_at || new Date(0).toISOString(),
    fetchedAt: item.fetched_at,
    isReply: Boolean(item.metadata?.is_reply),
    replyCount: item.metadata?.reply_count || 0,
    retweetCount: item.metadata?.retweet_count || 0,
    likeCount: item.metadata?.like_count || 0,
    viewCount: item.metadata?.view_count || 0,
    externalUrls: extractExternalUrls(item, text, url),
  }
}

function applyLimit(items: XFeedItem[], limit: number) {
  if (!Number.isFinite(limit) || limit <= 0) return items
  return items.slice(0, limit)
}

export async function loadXFeedItems(limit = DEFAULT_X_FEED_LIMIT): Promise<XFeedItem[]> {
  const root = feedsDirectory()
  const sources = await readJson<FeedSourceRecord[]>(path.join(/* turbopackIgnore: true */ root, '_sources.json'))
  const sourceById = new Map((sources || []).map((source) => [source.id, source]))
  let entries
  try {
    entries = await readdir(/* turbopackIgnore: true */ root, { withFileTypes: true })
  } catch {
    return []
  }
  const sourceDirs = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith('feed-source-'))

  const itemsBySource = await Promise.all(
    sourceDirs.map(async (dir) => {
      const dirPath = path.join(/* turbopackIgnore: true */ root, dir.name)
      let files
      try {
        files = await readdir(/* turbopackIgnore: true */ dirPath, { withFileTypes: true })
      } catch {
        return []
      }
      const jsonFiles = files.filter((file) => file.isFile() && /^feed-item-.+\.json$/.test(file.name))

      return Promise.all(
        jsonFiles.map(async (file) => {
          const record = await readJson<FeedItemRecord>(path.join(/* turbopackIgnore: true */ dirPath, file.name))
          return record ? mapItem(record, sourceById.get(record.source_id || dir.name)) : null
        }),
      )
    }),
  )

  const items = itemsBySource
    .flat(2)
    .filter((item): item is XFeedItem => Boolean(item))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return applyLimit(items, limit)
}
