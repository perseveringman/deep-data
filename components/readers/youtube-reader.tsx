'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Eye, ThumbsUp, Clock, Calendar, ExternalLink, List, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { parseYouTubeContent } from '@/lib/content-parser'
import type { ContentItem } from '@/lib/mock-data'

interface YouTubeReaderProps {
  content: ContentItem
  markdownContent: string
}

function getYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match ? match[1] : null
}

export function YouTubeReader({ content, markdownContent }: YouTubeReaderProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState<'chapters' | 'transcript'>('chapters')
  const transcriptRef = useRef<HTMLDivElement>(null)
  const activeSegmentRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const [playerReady, setPlayerReady] = useState(false)

  // 解析结构化内容
  const parsedContent = parseYouTubeContent(markdownContent)
  const { metadata, description, timestamps, transcript } = parsedContent

  const videoId = content.videoUrl ? getYouTubeVideoId(content.videoUrl) : null

  useEffect(() => {
    if (!videoId) return

    if (window.YT && window.YT.Player) {
      initPlayer()
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    ;(window as any).onYouTubeIframeAPIReady = () => {
      initPlayer()
    }

    return () => {
      ;(window as any).onYouTubeIframeAPIReady = null
    }
  }, [videoId])

  const initPlayer = useCallback(() => {
    if (!videoId || playerRef.current) return

    playerRef.current = new window.YT.Player('youtube-player', {
      videoId,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: () => setPlayerReady(true),
        onStateChange: (event: YT.OnStateChangeEvent) => {
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
        },
      },
    })
  }, [videoId])

  useEffect(() => {
    if (!playerReady || !playerRef.current) return

    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime()
        setCurrentTime(time * 1000)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [playerReady])

  useEffect(() => {
    if (activeSegmentRef.current && transcriptRef.current && isPlaying) {
      const container = transcriptRef.current
      const element = activeSegmentRef.current
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      
      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentTime, isPlaying])

  const seekTo = (timeMs: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(timeMs / 1000, true)
      setCurrentTime(timeMs)
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 找到当前激活的字幕索引
  const activeTranscriptIndex = transcript.findIndex((seg, i) => {
    const nextSeg = transcript[i + 1]
    return currentTime >= seg.startMs && (!nextSeg || currentTime < nextSeg.startMs)
  })

  // 找到当前激活的章节索引
  const activeChapterIndex = timestamps.findIndex((ts, i) => {
    const nextTs = timestamps[i + 1]
    const currentSec = currentTime / 1000
    return currentSec >= ts.seconds && (!nextTs || currentSec < nextTs.seconds)
  })

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* 左侧：视频播放器 + 时间轴 */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-2 h-[calc(100vh-80px)]">
        {/* 视频播放器 */}
        <div className="aspect-video w-full overflow-hidden rounded bg-black">
          {videoId ? (
            <div id="youtube-player" className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-white text-sm">
              视频加载失败
            </div>
          )}
        </div>

        {/* 视频元数据 */}
        <div className="space-y-1 border-b border-border pb-2">
          <h1 className="font-serif text-sm font-bold leading-tight">{metadata.title || content.title}</h1>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">{metadata.channelName || content.channelName}</span>
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {format(new Date(metadata.publishedAt || content.publishedAt), 'yyyy/M/d', { locale: zhCN })}
            </span>
            <span className="flex items-center gap-0.5">
              <Eye className="h-2.5 w-2.5" />
              {(metadata.viewCount || content.viewCount || 0).toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="h-2.5 w-2.5" />
              {(metadata.likeCount || content.likeCount || 0).toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {metadata.durationHuman || content.duration}
            </span>
            {content.videoUrl && (
              <a
                href={content.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-primary hover:underline"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                YouTube
              </a>
            )}
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1">
            {metadata.categories && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary font-medium">
                {metadata.categories}
              </span>
            )}
            {content.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 章节和字幕时间轴 */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tab 切换 */}
          <div className="mb-1.5 flex items-center gap-2 border-b border-border pb-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                activeTab === 'chapters'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <List className="h-3 w-3" />
              章节 ({timestamps.length})
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                activeTab === 'transcript'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <FileText className="h-3 w-3" />
              字幕 ({transcript.length})
            </button>
            <span className="ml-auto font-mono text-[9px] text-muted-foreground">
              {formatTime(currentTime)}
            </span>
          </div>

          <div
            ref={transcriptRef}
            className="flex-1 overflow-y-auto"
          >
            {activeTab === 'chapters' ? (
              /* 章节列表 */
              <div className="space-y-0.5">
                {timestamps.length > 0 ? (
                  timestamps.map((chapter, index) => {
                    const isActive = index === activeChapterIndex
                    return (
                      <div
                        key={index}
                        onClick={() => seekTo(chapter.seconds * 1000)}
                        className={`cursor-pointer rounded px-2 py-1 transition-colors ${
                          isActive
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`font-mono text-[9px] ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {chapter.time}
                          </span>
                          <span className={`flex-1 text-[10px] leading-snug ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {chapter.title}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-4 text-center text-[10px] text-muted-foreground">
                    暂无章节信息
                  </div>
                )}
              </div>
            ) : (
              /* 字幕时间轴 */
              <div className="space-y-0.5">
                {transcript.map((segment, index) => {
                  const isActive = index === activeTranscriptIndex
                  return (
                    <div
                      key={index}
                      ref={isActive ? activeSegmentRef : null}
                      onClick={() => seekTo(segment.startMs)}
                      className={`cursor-pointer rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span className={`mr-1 font-mono text-[8px] ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                        {formatTime(segment.startMs)}
                      </span>
                      <span className="leading-snug">{segment.text}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：结构化内容 */}
      <div className="col-span-12 lg:col-span-4">
        <div className="sticky top-12 space-y-2 h-[calc(100vh-80px)] overflow-y-auto">
          {/* 内容摘要 */}
          <div className="rounded border border-border bg-muted/30 p-2">
            <h2 className="mb-1 font-serif text-[10px] font-bold text-primary">内容摘要</h2>
            <p className="text-[10px] leading-relaxed text-muted-foreground">{content.summary}</p>
          </div>

          {/* 视频简介 */}
          {description && (
            <div className="rounded border border-border bg-muted/30 p-2">
              <h2 className="mb-1 font-serif text-[10px] font-bold text-primary">视频简介</h2>
              <p className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* 元信息 */}
          <div className="rounded border border-border bg-muted/30 p-2">
            <h2 className="mb-1 font-serif text-[10px] font-bold text-primary">详细信息</h2>
            <dl className="space-y-1 text-[9px]">
              {metadata.language && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">语言</dt>
                  <dd className="font-medium">{metadata.language.toUpperCase()}</dd>
                </div>
              )}
              {metadata.categories && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">分类</dt>
                  <dd className="font-medium">{metadata.categories}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">时长</dt>
                <dd className="font-medium">{metadata.durationHuman || content.duration}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">播放量</dt>
                <dd className="font-medium">{(metadata.viewCount || content.viewCount || 0).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">点赞数</dt>
                <dd className="font-medium">{(metadata.likeCount || content.likeCount || 0).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, any>
          events?: {
            onReady?: () => void
            onStateChange?: (event: YT.OnStateChangeEvent) => void
          }
        }
      ) => YT.Player
      PlayerState: {
        PLAYING: number
      }
    }
  }
  namespace YT {
    interface Player {
      getCurrentTime(): number
      seekTo(seconds: number, allowSeekAhead: boolean): void
      playVideo(): void
      pauseVideo(): void
    }
    interface OnStateChangeEvent {
      data: number
    }
  }
}
