'use client'

import {
  BarChart3,
  BadgeCheck,
  Bookmark,
  Ellipsis,
  ExternalLink,
  Heart,
  Link2,
  MessageCircle,
  Repeat2,
  Share2,
  Twitter,
} from 'lucide-react'

import type { XFeedItem } from '@/lib/types'
import { cn } from '@/lib/utils'

export const sourceLabels: Record<XFeedItem['sourceKind'], string> = {
  profile: 'Profile',
  'for-you': 'For You',
  following: 'Following',
  timeline: 'Timeline',
}

const avatarStyles = [
  'bg-sky-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-zinc-950',
  'bg-rose-500 text-white',
  'bg-violet-500 text-white',
  'bg-cyan-500 text-zinc-950',
]

const tokenPattern = /(https?:\/\/[^\s)]+|[@#][A-Za-z0-9_]+)/g

function formatCompactCount(value: number) {
  if (!value) return ''
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`
  return String(value)
}

function formatTweetTime(value: string) {
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return ''

  const diffMs = Date.now() - time
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'now'
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m`
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h`
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d`

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatAbsoluteTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function avatarClass(handle: string) {
  const index = Array.from(handle).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarStyles[index % avatarStyles.length]
}

function firstAvatarLetter(item: XFeedItem) {
  return (item.authorHandle || item.authorName || 'X').charAt(0).toUpperCase()
}

function shouldCollapse(text: string) {
  return text.length > 520 || text.split('\n').length > 9
}

function TweetText({ text }: { text: string }) {
  const parts = text.split(tokenPattern)

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null
        if (/^https?:\/\//.test(part)) {
          const cleanUrl = part.replace(/[.,;!?]+$/, '')
          return (
            <a
              key={`${part}-${index}`}
              href={cleanUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#1d9bf0] hover:underline"
            >
              {cleanUrl}
            </a>
          )
        }
        if (/^[@#]/.test(part)) {
          return (
            <span key={`${part}-${index}`} className="font-medium text-[#1d9bf0]">
              {part}
            </span>
          )
        }
        return part
      })}
    </>
  )
}

function LinkPreview({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex min-h-16 items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
        <Link2 className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {getDomain(url)}
        </span>
        <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-500">
          {url}
        </span>
      </span>
      <ExternalLink className="size-4 shrink-0 text-zinc-400" />
    </a>
  )
}

function ActionMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof MessageCircle
  value?: number
  label: string
}) {
  return (
    <button
      type="button"
      className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-zinc-500 transition-colors hover:text-[#1d9bf0] dark:text-zinc-500"
      aria-label={label}
    >
      <Icon className="size-5" />
      {Boolean(value) && <span className="text-sm leading-none">{formatCompactCount(value || 0)}</span>}
    </button>
  )
}

export function XReaderCard({
  item,
  expanded,
  onToggleExpanded,
  className,
}: {
  item: XFeedItem
  expanded: boolean
  onToggleExpanded: () => void
  className?: string
}) {
  const canCollapse = shouldCollapse(item.text)

  return (
    <article
      className={cn(
        'rounded-lg border border-zinc-200 bg-white px-4 py-4 text-zinc-950 shadow-sm transition-colors dark:border-zinc-800 dark:bg-black dark:text-zinc-100',
        className,
      )}
    >
      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 sm:grid-cols-[56px_minmax(0,1fr)]">
        <div
          className={cn(
            'flex size-12 items-center justify-center rounded-full text-lg font-bold sm:size-14',
            avatarClass(item.authorHandle),
          )}
          aria-hidden="true"
        >
          {firstAvatarLetter(item)}
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <a
                  href={`https://x.com/${item.authorHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-[15px] font-extrabold leading-tight hover:underline sm:text-base"
                >
                  {item.authorName}
                </a>
                <BadgeCheck className="size-4 shrink-0 fill-[#1d9bf0] text-white" aria-label="verified" />
                <span className="truncate text-[15px] leading-tight text-zinc-500">@{item.authorHandle}</span>
                <span className="text-zinc-500">·</span>
                <time
                  dateTime={item.publishedAt}
                  title={formatAbsoluteTime(item.publishedAt)}
                  className="text-[15px] leading-tight text-zinc-500"
                  suppressHydrationWarning
                >
                  {formatTweetTime(item.publishedAt)}
                </time>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>{sourceLabels[item.sourceKind]}</span>
                {item.isReply ? (
                  <>
                    <span>·</span>
                    <span>Reply</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 text-zinc-500">
              <Twitter className="size-5" />
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md p-1 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                aria-label="Open on X"
              >
                <Ellipsis className="size-5" />
              </a>
            </div>
          </div>

          <div className="mt-3 text-[15px] leading-relaxed sm:text-[17px]">
            <div
              className={cn(
                'relative whitespace-pre-wrap break-words',
                canCollapse && !expanded && 'max-h-[15.5rem] overflow-hidden',
              )}
            >
              <TweetText text={item.text} />
              {canCollapse && !expanded ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-white/0 dark:from-black dark:to-black/0" />
              ) : null}
            </div>

            {canCollapse ? (
              <button
                type="button"
                onClick={onToggleExpanded}
                className="mt-1 text-[15px] font-medium text-[#1d9bf0] hover:underline"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            ) : null}
          </div>

          {item.externalUrls[0] ? <LinkPreview url={item.externalUrls[0]} /> : null}

          <div className="mt-4 flex items-center justify-between gap-2">
            <ActionMetric icon={MessageCircle} value={item.replyCount} label="Replies" />
            <ActionMetric icon={Repeat2} value={item.retweetCount} label="Reposts" />
            <ActionMetric icon={Heart} value={item.likeCount} label="Likes" />
            <ActionMetric icon={BarChart3} value={item.viewCount} label="Views" />
            <div className="ml-auto flex items-center gap-2 text-zinc-500">
              <button
                type="button"
                className="rounded-md p-1 transition-colors hover:text-[#1d9bf0]"
                aria-label="Bookmark"
              >
                <Bookmark className="size-5" />
              </button>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md p-1 transition-colors hover:text-[#1d9bf0]"
                aria-label="Share"
              >
                <Share2 className="size-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
