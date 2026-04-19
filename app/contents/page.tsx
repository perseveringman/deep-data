'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Youtube, Podcast, Clock, Eye, ThumbsUp, Play, LayoutGrid, List, FileText, Tag, ChevronDown, X, Loader2 } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { contentItems as mockContentItems, type ContentItem } from '@/lib/mock-data'

type FilterType = 'all' | 'youtube' | 'podcast'
type ViewType = 'grid' | 'list'

// Proxy through Next.js API route to avoid CORS / exposing key
const PODADMIN_API = ''

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ContentsPage() {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [channelFilter, setChannelFilter] = useState<string | null>(null)
  const [view, setView] = useState<ViewType>('list')
  const [showChannelDropdown, setShowChannelDropdown] = useState(false)

  // Remote data state
  const [contentItems, setContentItems] = useState<ContentItem[]>(mockContentItems)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocs() {
      try {
        // Fetch podcast + youtube documents from podadmin
        const sourceTypes = typeFilter === 'all'
          ? ['podcast', 'youtube']
          : [typeFilter]

        const results = await Promise.all(
          sourceTypes.map(st =>
            fetch(`${PODADMIN_API}/api/podadmin/documents?source_type=${st}&limit=100`)
              .then(r => r.ok ? r.json() : null)
          )
        )

        const docs = results.flatMap(r => r?.items || [])

        if (docs.length > 0) {
          const mapped: ContentItem[] = docs.map((doc: any) => ({
            id: String(doc.id),
            type: doc.source_type === 'youtube' ? 'youtube' : 'podcast',
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
          }))
          setContentItems(mapped)
        }
      } catch {
        // Fall back to mock data (already set as default)
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [typeFilter])

  // 获取所有频道列表，按类型分组
  const channelsByType = useMemo(() => {
    const youtubeChannels = new Map<string, { name: string; count: number }>()
    const podcastChannels = new Map<string, { name: string; count: number }>()
    
    contentItems.forEach(item => {
      const map = item.type === 'youtube' ? youtubeChannels : podcastChannels
      const existing = map.get(item.channelId)
      if (existing) {
        existing.count++
      } else {
        map.set(item.channelId, { name: item.channelName, count: 1 })
      }
    })
    
    return {
      youtube: Array.from(youtubeChannels.entries()).map(([id, data]) => ({ id, ...data })),
      podcast: Array.from(podcastChannels.entries()).map(([id, data]) => ({ id, ...data }))
    }
  }, [contentItems])

  // 所有频道扁平列表
  const allChannels = useMemo(() => {
    const channels = new Map<string, { name: string; count: number; type: 'youtube' | 'podcast' }>()
    contentItems.forEach(item => {
      const existing = channels.get(item.channelId)
      if (existing) {
        existing.count++
      } else {
        channels.set(item.channelId, { name: item.channelName, count: 1, type: item.type })
      }
    })
    return Array.from(channels.entries()).map(([id, data]) => ({ id, ...data }))
  }, [contentItems])

  // 过滤内容
  const filteredItems = useMemo(() => {
    let items = contentItems
    
    // 按类型过滤 (already filtered in the fetch, but still filter locally for channel)
    if (typeFilter !== 'all') {
      items = items.filter(item => item.type === typeFilter)
    }
    
    // 按频道过滤
    if (channelFilter) {
      items = items.filter(item => item.channelId === channelFilter)
    }
    
    return items
  }, [contentItems, typeFilter, channelFilter])
  
  const youtubeCount = contentItems.filter(c => c.type === 'youtube').length
  const podcastCount = contentItems.filter(c => c.type === 'podcast').length

  const selectedChannel = channelFilter 
    ? allChannels.find(c => c.id === channelFilter) 
    : null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="font-serif text-base font-semibold">内容库</h1>
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded border border-border p-0.5">
            <button
              onClick={() => setView('grid')}
              className={`rounded p-1 transition-colors ${
                view === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="卡片视图"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`rounded p-1 transition-colors ${
                view === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="列表视图"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            共 {filteredItems.length} 条
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-3">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
          {/* Type Filter Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                typeFilter === 'all'
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              全部 ({contentItems.length})
            </button>
            <button
              onClick={() => setTypeFilter('youtube')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                typeFilter === 'youtube'
                  ? 'bg-red-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Youtube className="h-3 w-3" />
              YouTube ({youtubeCount})
            </button>
            <button
              onClick={() => setTypeFilter('podcast')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                typeFilter === 'podcast'
                  ? 'bg-purple-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Podcast className="h-3 w-3" />
              播客 ({podcastCount})
            </button>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-border" />

          {/* Channel Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowChannelDropdown(!showChannelDropdown)}
              className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-colors ${
                channelFilter 
                  ? 'border-foreground bg-foreground text-background' 
                  : 'border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground'
              }`}
            >
              {selectedChannel ? (
                <>
                  {selectedChannel.type === 'youtube' ? (
                    <Youtube className="h-3 w-3" />
                  ) : (
                    <Podcast className="h-3 w-3" />
                  )}
                  <span className="max-w-[120px] truncate">{selectedChannel.name}</span>
                </>
              ) : (
                <span>选择频道</span>
              )}
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Dropdown Menu */}
            {showChannelDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowChannelDropdown(false)} 
                />
                <div className="absolute left-0 top-full z-50 mt-1 max-h-80 w-64 overflow-auto rounded border border-border bg-background shadow-lg">
                  {/* All Channels Option */}
                  <button
                    onClick={() => {
                      setChannelFilter(null)
                      setShowChannelDropdown(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted ${
                      !channelFilter ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    全部频道
                  </button>
                  
                  {/* YouTube Channels */}
                  {(typeFilter === 'all' || typeFilter === 'youtube') && channelsByType.youtube.length > 0 && (
                    <>
                      <div className="border-t border-border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        YouTube 频道
                      </div>
                      {channelsByType.youtube.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => {
                            setChannelFilter(channel.id)
                            setShowChannelDropdown(false)
                          }}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted ${
                            channelFilter === channel.id ? 'bg-muted font-medium' : ''
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Youtube className="h-3 w-3 text-red-500" />
                            <span className="truncate">{channel.name}</span>
                          </span>
                          <span className="text-muted-foreground">{channel.count}</span>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {/* Podcast Channels */}
                  {(typeFilter === 'all' || typeFilter === 'podcast') && channelsByType.podcast.length > 0 && (
                    <>
                      <div className="border-t border-border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        播客节目
                      </div>
                      {channelsByType.podcast.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => {
                            setChannelFilter(channel.id)
                            setShowChannelDropdown(false)
                          }}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted ${
                            channelFilter === channel.id ? 'bg-muted font-medium' : ''
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Podcast className="h-3 w-3 text-purple-500" />
                            <span className="truncate">{channel.name}</span>
                          </span>
                          <span className="text-muted-foreground">{channel.count}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Active Filters Display */}
          {channelFilter && (
            <button
              onClick={() => setChannelFilter(null)}
              className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80"
            >
              <X className="h-3 w-3" />
              清除频道筛选
            </button>
          )}
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/contents/${item.id}`}
                className="group flex flex-col border border-border bg-card transition-colors hover:bg-muted/30"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {item.type === 'youtube' ? (
                        <Youtube className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <Podcast className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {item.duration}
                  </div>
                  <div className="absolute left-1.5 top-1.5">
                    {item.type === 'youtube' ? (
                      <span className="flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        <Youtube className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        <Podcast className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                    <Play className="h-8 w-8 text-white" fill="white" />
                  </div>
                </div>

                {/* Content Info */}
                <div className="flex flex-1 flex-col p-2">
                  <div className="mb-1 text-[10px] text-muted-foreground">
                    {item.channelName} · {format(new Date(item.publishedAt), 'MM/dd', { locale: zhCN })}
                  </div>
                  <h3 className="line-clamp-2 flex-1 text-xs font-medium leading-snug group-hover:text-primary">
                    {item.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    {item.viewCount && (
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        {item.viewCount >= 10000 
                          ? `${(item.viewCount / 10000).toFixed(1)}万` 
                          : item.viewCount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="mt-3">
            {/* Table Header */}
            <div className="hidden border-b border-border pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-3">
              <div className="col-span-5">内容</div>
              <div className="col-span-2">来源</div>
              <div className="col-span-2">标签</div>
              <div className="col-span-1 text-center">时长</div>
              <div className="col-span-1 text-center">播放</div>
              <div className="col-span-1 text-right">日期</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-border">
              {filteredItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/contents/${item.id}`}
                  className="group grid items-center gap-3 py-2.5 transition-colors hover:bg-muted/30 md:grid-cols-12"
                >
                  {/* Content - Title, Summary, Type */}
                  <div className="col-span-5 flex gap-3">
                    {/* Thumbnail - Small */}
                    <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {item.coverUrl ? (
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {item.type === 'youtube' ? (
                            <Youtube className="h-6 w-6 text-muted-foreground" />
                          ) : (
                            <Podcast className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      {/* Type Badge */}
                      <div className="absolute left-1 top-1">
                        {item.type === 'youtube' ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-red-600">
                            <Youtube className="h-2.5 w-2.5 text-white" />
                          </span>
                        ) : (
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-purple-600">
                            <Podcast className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      {/* Duration on thumbnail */}
                      <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-medium text-white">
                        {item.duration}
                      </div>
                    </div>
                    {/* Title & Summary */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <h3 className="line-clamp-1 text-sm font-medium leading-tight group-hover:text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {item.summary}
                      </p>
                      {/* Mobile: Show all info inline */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground md:hidden">
                        <span>{item.channelName}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </span>
                        {item.viewCount && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-3 w-3" />
                              {item.viewCount >= 10000 
                                ? `${(item.viewCount / 10000).toFixed(1)}万` 
                                : item.viewCount.toLocaleString()}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>{format(new Date(item.publishedAt), 'yyyy/MM/dd', { locale: zhCN })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Channel */}
                  <div className="col-span-2 hidden md:block">
                    <div className="text-xs font-medium">{item.channelName}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {item.hasTranscript && (
                        <span className="flex items-center gap-0.5">
                          <FileText className="h-3 w-3" />
                          有字幕
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="col-span-2 hidden md:block">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="col-span-1 hidden text-center md:block">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.duration}
                    </span>
                  </div>

                  {/* Views & Likes */}
                  <div className="col-span-1 hidden text-center md:block">
                    {item.viewCount ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-center gap-0.5 text-xs">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {item.viewCount >= 10000 
                            ? `${(item.viewCount / 10000).toFixed(1)}万` 
                            : item.viewCount.toLocaleString()}
                        </div>
                        {item.likeCount && (
                          <div className="flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
                            <ThumbsUp className="h-2.5 w-2.5" />
                            {item.likeCount >= 10000 
                              ? `${(item.likeCount / 10000).toFixed(1)}万` 
                              : item.likeCount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="col-span-1 hidden text-right md:block">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.publishedAt), 'MM/dd', { locale: zhCN })}
                    </span>
                    <div className="text-[10px] text-muted-foreground">
                      {format(new Date(item.publishedAt), 'yyyy', { locale: zhCN })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">没有找到符合条件的内容</p>
                <button
                  onClick={() => {
                    setTypeFilter('all')
                    setChannelFilter(null)
                  }}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  清除所有筛选
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
