import Link from 'next/link'
import type { Channel } from '@/lib/mock-data'
import { Youtube, Podcast } from 'lucide-react'

interface ChannelCardProps {
  channel: Channel
  compact?: boolean
}

export function ChannelCard({ channel, compact = false }: ChannelCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K'
    }
    return num.toString()
  }

  if (compact) {
    return (
      <Link
        href={`/channels/${channel.id}`}
        className="group flex items-center gap-2 border border-border p-2 transition-colors hover:border-foreground"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-foreground/20 bg-muted">
          {channel.platform === 'youtube' ? (
            <Youtube className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Podcast className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-medium group-hover:underline">
            {channel.name}
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{formatNumber(channel.subscriberCount)}</span>
            <span>·</span>
            <span>{channel.videoCount}内容</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/channels/${channel.id}`}
      className="group block border border-border p-4 transition-colors hover:border-foreground"
    >
      <div className="flex items-start gap-4">
        {/* Avatar placeholder */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-foreground/20 bg-muted">
          {channel.platform === 'youtube' ? (
            <Youtube className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Podcast className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-serif text-base font-semibold group-hover:underline">
              {channel.name}
            </h3>
          </div>

          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {channel.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatNumber(channel.subscriberCount)} 订阅</span>
            <span className="text-border">|</span>
            <span>{channel.videoCount} 内容</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {channel.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="nyt-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
