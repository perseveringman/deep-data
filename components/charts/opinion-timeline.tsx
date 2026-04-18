'use client'

import Link from 'next/link'
import { opinions } from '@/lib/mock-data'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const getSentimentStyle = (sentiment: 'positive' | 'negative' | 'neutral') => {
  switch (sentiment) {
    case 'positive':
      return 'border-l-foreground'
    case 'negative':
      return 'border-l-accent'
    case 'neutral':
      return 'border-l-muted-foreground'
  }
}

const getSentimentLabel = (sentiment: 'positive' | 'negative' | 'neutral') => {
  switch (sentiment) {
    case 'positive':
      return '积极'
    case 'negative':
      return '消极'
    case 'neutral':
      return '中性'
  }
}

interface OpinionTimelineProps {
  limit?: number
  compact?: boolean
}

export function OpinionTimeline({ limit = 5, compact = false }: OpinionTimelineProps) {
  const displayOpinions = opinions.slice(0, limit)

  if (compact) {
    return (
      <div className="space-y-2">
        {displayOpinions.map((opinion) => (
          <article
            key={opinion.id}
            className={`border-l-2 pl-2 py-1 ${getSentimentStyle(opinion.sentiment)}`}
          >
            <blockquote className="text-xs leading-relaxed line-clamp-2">
              {`"${opinion.content}"`}
            </blockquote>
            <footer className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Link
                href={`/channels/${opinion.channelId}`}
                className="font-medium text-foreground hover:underline"
              >
                {opinion.channelName}
              </Link>
              <span>·</span>
              <span className="nyt-tag !py-0 !text-[9px]">{opinion.topic}</span>
              <span>·</span>
              <time dateTime={opinion.timestamp}>
                {formatDistanceToNow(new Date(opinion.timestamp), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </time>
            </footer>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayOpinions.map((opinion) => (
        <article
          key={opinion.id}
          className={`border-l-2 pl-4 ${getSentimentStyle(opinion.sentiment)}`}
        >
          <blockquote className="font-serif text-sm leading-relaxed">
            {`"${opinion.content}"`}
          </blockquote>
          <footer className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={`/channels/${opinion.channelId}`}
              className="font-medium text-foreground hover:underline"
            >
              {opinion.channelName}
            </Link>
            <span className="nyt-tag">{opinion.topic}</span>
            <span className="nyt-tag">{getSentimentLabel(opinion.sentiment)}</span>
            <time dateTime={opinion.timestamp}>
              {formatDistanceToNow(new Date(opinion.timestamp), {
                addSuffix: true,
                locale: zhCN,
              })}
            </time>
          </footer>
        </article>
      ))}
    </div>
  )
}
