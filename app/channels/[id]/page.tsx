import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { EngagementChart } from '@/components/charts/engagement-chart'
import { getChannelDetail, opinions, type ChannelDetail } from '@/lib/mock-data'
import { ArrowLeft, Youtube, Podcast, ExternalLink, Play, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const API_BASE = process.env.PODADMIN_API_URL || 'http://localhost:8000'
const API_KEY = process.env.PODADMIN_API_KEY || ''

async function fetchChannelFromAPI(id: string): Promise<ChannelDetail | null> {
  try {
    // id format from channels page: "podcast-sourceName" or "youtube-sourceName"
    const parts = id.split('-')
    const sourceType = parts[0]
    const source = parts.slice(1).join('-')

    // Fetch documents for this source to build channel detail
    const res = await fetch(
      `${API_BASE}/api/v1/documents?source_type=${sourceType}&source=${encodeURIComponent(source)}&limit=20`,
      { headers: { 'X-API-Key': API_KEY }, next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const docs = data.items || []
    if (docs.length === 0) return null

    // Extract tags distribution
    const tagCounts: Record<string, number> = {}
    docs.forEach((d: any) => {
      (d.tags || []).forEach((t: string) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1
      })
    })
    const topics = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // Map recent docs to recentVideos
    const recentVideos = docs.slice(0, 5).map((d: any) => ({
      id: String(d.id),
      title: d.title || '',
      publishedAt: d.published_at ? d.published_at.slice(0, 10) : '',
      views: 0,
      duration: d.duration_seconds
        ? `${Math.floor(d.duration_seconds / 60)}:${String(d.duration_seconds % 60).padStart(2, '0')}`
        : '',
      topics: (d.tags || []).slice(0, 3),
    }))

    // Fetch total count from sources endpoint
    const srcRes = await fetch(
      `${API_BASE}/api/v1/sources?source_type=${sourceType}`,
      { headers: { 'X-API-Key': API_KEY }, next: { revalidate: 60 } }
    )
    const srcData = srcRes.ok ? await srcRes.json() : { sources: [] }
    const matchedSource = (srcData.sources || []).find((s: any) => s.source === source)
    const totalCount = matchedSource?.count || docs.length

    return {
      id,
      name: docs[0]?.podcast_title || source || sourceType,
      platform: sourceType === 'youtube' ? 'youtube' : 'podcast',
      description: '',
      subscriberCount: 0,
      videoCount: totalCount,
      tags: topics.slice(0, 5).map(t => t.name),
      lastUpdated: docs[0]?.published_at?.slice(0, 10) || '',
      topics,
      recentVideos,
      engagementData: [],
    }
  } catch {
    return null
  }
}

interface ChannelDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ChannelDetailPage({ params }: ChannelDetailPageProps) {
  const { id } = await params

  // Try podadmin API first, then fall back to mock data
  let channel = await fetchChannelFromAPI(id)
  if (!channel) {
    channel = getChannelDetail(id) as ChannelDetail | null
  }

  if (!channel) {
    notFound()
  }

  const channelOpinions = opinions.filter((op) => op.channelId === id)

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K'
    }
    return num.toString()
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <Link
            href="/channels"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回列表
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Channel Header + Stats */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Channel Info */}
          <div className="lg:col-span-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-foreground/20 bg-muted">
                {channel.platform === 'youtube' ? (
                  <Youtube className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <Podcast className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl font-bold truncate">{channel.name}</h1>
                  <span className="nyt-tag shrink-0">{channel.platform === 'youtube' ? 'YouTube' : '播客'}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{channel.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-medium">{formatNumber(channel.subscriberCount)} 订阅</span>
                  <span className="text-border">|</span>
                  <span>{channel.videoCount} 内容</span>
                  <span className="text-border">|</span>
                  <span>最后更新: {channel.lastUpdated}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {channel.tags.map((tag) => (
                    <span key={tag} className="nyt-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
              <div className="border border-border p-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">总内容</span>
                <p className="font-serif text-lg font-bold">{channel.videoCount}</p>
              </div>
              <div className="border border-border p-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">话题数</span>
                <p className="font-serif text-lg font-bold">{channel.topics.length}</p>
              </div>
              <div className="border border-border p-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">观点数</span>
                <p className="font-serif text-lg font-bold">{channelOpinions.length}</p>
              </div>
              <div className="border border-border p-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">订阅者</span>
                <p className="font-serif text-lg font-bold">{formatNumber(channel.subscriberCount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Engagement Chart */}
          <div className="lg:col-span-7">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">互动数据趋势</h2>
            </div>
            <div className="mt-2 h-[200px]">
              <EngagementChart data={channel.engagementData} compact />
            </div>
          </div>

          {/* Topics Distribution */}
          <div className="lg:col-span-5">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">话题分布</h2>
            </div>
            <div className="mt-2 space-y-1.5">
              {channel.topics.map((topic) => (
                <div key={topic.name} className="flex items-center gap-2">
                  <span className="flex-1 text-xs truncate">{topic.name}</span>
                  <div className="h-1.5 w-20 bg-muted">
                    <div
                      className="h-full bg-foreground"
                      style={{ width: `${(topic.count / channel.topics[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
                    {topic.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Opinions + Videos Row */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Opinions */}
          <div className="lg:col-span-5">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">提取的观点</h2>
            </div>
            <div className="mt-2 space-y-2">
              {channelOpinions.length > 0 ? (
                channelOpinions.slice(0, 6).map((opinion) => (
                  <article key={opinion.id} className="border-l-2 border-foreground/30 pl-2 py-1">
                    <blockquote className="text-xs leading-relaxed line-clamp-2">
                      {`"${opinion.content}"`}
                    </blockquote>
                    <footer className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="nyt-tag !py-0 !text-[9px]">{opinion.topic}</span>
                      <time dateTime={opinion.timestamp}>
                        {formatDistanceToNow(new Date(opinion.timestamp), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </time>
                    </footer>
                  </article>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">暂无提取的观点</p>
              )}
            </div>
          </div>

          {/* Recent Videos */}
          <div className="lg:col-span-7">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">近期内容</h2>
            </div>
            <div className="mt-2 divide-y divide-border border border-border">
              {channel.recentVideos.map((video) => (
                <article key={video.id} className="flex items-center gap-3 p-2">
                  <div className="flex h-12 w-20 shrink-0 items-center justify-center bg-muted">
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xs font-medium">{video.title}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>{video.publishedAt}</span>
                      <span>·</span>
                      <span>{formatNumber(video.views)} 播放</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {video.duration}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {video.topics.slice(0, 2).map((topic) => (
                        <span key={topic} className="nyt-tag !py-0 !text-[9px]">{topic}</span>
                      ))}
                    </div>
                  </div>
                  <button className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
