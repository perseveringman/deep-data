import { SidebarTrigger } from '@/components/ui/sidebar'
import { ChannelCard } from '@/components/channel-card'
import { channels as mockChannels, type Channel } from '@/lib/mock-data'
import { Youtube, Podcast } from 'lucide-react'

const API_BASE = process.env.PODADMIN_API_URL || 'http://localhost:8000'
const API_KEY = process.env.PODADMIN_API_KEY || ''

async function fetchChannels(): Promise<Channel[]> {
  try {
    // Fetch channel catalog from podadmin
    const res = await fetch(`${API_BASE}/api/v1/channels`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 60 },
    })
    if (!res.ok) return mockChannels

    const data = await res.json()
    const channelInfos = data.channels || []

    // Also fetch per-source breakdown
    const srcRes = await fetch(`${API_BASE}/api/v1/sources`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 60 },
    })
    const srcData = srcRes.ok ? await srcRes.json() : { sources: [] }
    const sources = srcData.sources || []

    // Build Channel objects from sources
    const mapped: Channel[] = sources.map((s: any, idx: number) => ({
      id: `${s.source_type}-${s.source || idx}`,
      name: s.source || s.source_type,
      platform: s.source_type === 'youtube' ? 'youtube' : 'podcast',
      description: '',
      subscriberCount: 0,
      videoCount: s.count || 0,
      tags: [],
      lastUpdated: '',
      topics: [],
      recentVideos: [],
      engagementData: [],
    }))

    return mapped.length > 0 ? mapped : mockChannels
  } catch {
    return mockChannels
  }
}

export default async function ChannelsPage() {
  const channels = await fetchChannels()
  const youtubeChannels = channels.filter(c => c.platform === 'youtube')
  const podcastChannels = channels.filter(c => c.platform === 'podcast')

  const totalSubscribers = channels.reduce((sum, c) => sum + (c.subscriberCount || 0), 0)
  const totalContent = channels.reduce((sum, c) => sum + c.videoCount, 0)

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
          <div className="flex-1">
            <h1 className="font-serif text-base font-semibold">内容源</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="border border-border p-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">总频道</span>
            <p className="font-serif text-xl font-bold">{channels.length}</p>
          </div>
          <div className="border border-border p-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">YouTube</span>
            <p className="font-serif text-xl font-bold">{youtubeChannels.length}</p>
          </div>
          <div className="border border-border p-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">播客</span>
            <p className="font-serif text-xl font-bold">{podcastChannels.length}</p>
          </div>
          <div className="border border-border p-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">总内容</span>
            <p className="font-serif text-xl font-bold">{formatNumber(totalContent)}</p>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* YouTube Channels */}
          <section>
            <div className="border-b border-border pb-1">
              <div className="flex items-center gap-1.5">
                <Youtube className="h-4 w-4" />
                <h2 className="font-serif text-sm font-bold">YouTube 频道</h2>
                <span className="text-xs text-muted-foreground">({youtubeChannels.length})</span>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {youtubeChannels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} compact />
              ))}
            </div>
          </section>

          {/* Podcast Channels */}
          <section>
            <div className="border-b border-border pb-1">
              <div className="flex items-center gap-1.5">
                <Podcast className="h-4 w-4" />
                <h2 className="font-serif text-sm font-bold">播客节目</h2>
                <span className="text-xs text-muted-foreground">({podcastChannels.length})</span>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {podcastChannels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} compact />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
