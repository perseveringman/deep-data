'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Clock, Calendar, ExternalLink, Lightbulb, Hash, FileText, List } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Slider } from '@/components/ui/slider'
import { parsePodcastContent } from '@/lib/content-parser'
import type { ContentItem } from '@/lib/mock-data'

interface PodcastReaderProps {
  content: ContentItem
  markdownContent: string
}

export function PodcastReader({ content, markdownContent }: PodcastReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [activeTab, setActiveTab] = useState<'chapters' | 'transcript'>('chapters')
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const activeSegmentRef = useRef<HTMLDivElement>(null)

  // 解析结构化内容
  const parsedContent = parsePodcastContent(markdownContent)
  const { metadata, description, shownotes, chapters, shownotesExtra, summary, takeaways, keywords, transcript } = parsedContent

  // 如果没有章节，默认显示转写
  useEffect(() => {
    if (chapters.length === 0) setActiveTab('transcript')
  }, [chapters.length])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime * 1000)
    const handleDurationChange = () => setDuration(audio.duration * 1000)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

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

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const seekTo = (timeMs: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = timeMs / 1000
    setCurrentTime(timeMs)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    const vol = value[0]
    audio.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isMuted) {
      audio.volume = volume || 1
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const changePlaybackRate = () => {
    const audio = audioRef.current
    if (!audio) return
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]
    audio.playbackRate = newRate
    setPlaybackRate(newRate)
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

  const activeIndex = transcript.findIndex((seg, i) => {
    const nextSeg = transcript[i + 1]
    return currentTime >= seg.startMs && (!nextSeg || currentTime < nextSeg.startMs)
  })

  const activeChapterIndex = chapters.findIndex((ch, i) => {
    const nextCh = chapters[i + 1]
    const currentSec = currentTime / 1000
    return currentSec >= ch.seconds && (!nextCh || currentSec < nextCh.seconds)
  })

  const audioSrc = content.audioUrl?.includes('youtube.com') 
    ? undefined 
    : content.audioUrl

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* 左侧：播放器 + 转写时间轴 */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-2 h-[calc(100vh-80px)]">
        {/* 播客封面和播放器 */}
        <div className="rounded border border-border bg-card p-3">
          <div className="flex gap-3">
            {/* 封面 */}
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
              {(metadata.coverUrl || content.coverUrl) ? (
                <img
                  src={metadata.coverUrl || content.coverUrl}
                  alt={content.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">
                  🎙️
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className="flex flex-1 flex-col justify-between py-0.5">
              <div>
                <p className="text-[10px] text-muted-foreground">{metadata.podcastTitle || content.channelName}</p>
                <h1 className="font-serif text-sm font-bold leading-tight line-clamp-2">{metadata.title || content.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {format(new Date(metadata.publishedAt || content.publishedAt), 'yyyy/M/d', { locale: zhCN })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {content.duration}
                </span>
                {(metadata.audioUrl || content.audioUrl) && (
                  <a
                    href={metadata.audioUrl || content.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    原链接
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 音频播放器 */}
          <div className="mt-3 space-y-1.5">
            {audioSrc && <audio ref={audioRef} src={audioSrc} preload="metadata" />}

            {/* 进度条 */}
            <div className="flex items-center gap-2">
              <span className="w-8 text-right font-mono text-[9px] text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || content.durationSeconds * 1000}
                step={1000}
                onValueChange={(value) => seekTo(value[0])}
                className="flex-1"
              />
              <span className="w-8 font-mono text-[9px] text-muted-foreground">
                {formatTime(duration || content.durationSeconds * 1000)}
              </span>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-16"
                />
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => skip(-15)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="rounded-full bg-foreground p-1.5 text-background hover:bg-foreground/90"
                  disabled={!audioSrc}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" fill="currentColor" />
                  ) : (
                    <Play className="h-4 w-4" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={() => skip(15)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={changePlaybackRate}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {playbackRate}x
              </button>
            </div>

            {!audioSrc && (
              <p className="text-center text-[10px] text-muted-foreground">
                音频源为 YouTube 链接，请点击原链接播放
              </p>
            )}
          </div>

          {/* 标签 */}
          <div className="mt-2 flex flex-wrap gap-1">
            {(metadata.tags.length > 0 ? metadata.tags : content.tags).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 章节 & 转写时间轴 */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tab 切换 */}
          <div className="mb-1.5 flex items-center gap-2 border-b border-border pb-1 flex-shrink-0">
            {chapters.length > 0 && (
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  activeTab === 'chapters'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <List className="h-3 w-3" />
                章节 ({chapters.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                activeTab === 'transcript'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <FileText className="h-3 w-3" />
              转写 ({transcript.length})
            </button>
            <span className="ml-auto font-mono text-[9px] text-muted-foreground">
              {formatTime(currentTime)}
            </span>
          </div>

          <div
            ref={transcriptRef}
            className="flex-1 overflow-y-auto"
          >
            {activeTab === 'chapters' && chapters.length > 0 ? (
              /* 章节列表 */
              <div className="space-y-0.5">
                {chapters.map((chapter, index) => {
                  const isActive = index === activeChapterIndex
                  return (
                    <div
                      key={index}
                      ref={isActive ? activeSegmentRef : null}
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
                })}
              </div>
            ) : (
              /* 转写时间轴 */
              transcript.length > 0 ? (
                <div className="space-y-0.5">
                  {transcript.map((segment, index) => {
                    const isActive = index === activeIndex
                    return (
                      <div
                        key={index}
                        ref={isActive ? activeSegmentRef : null}
                        onClick={() => seekTo(segment.startMs)}
                        className={`cursor-pointer rounded px-1.5 py-1 text-[11px] transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <span className={`mr-1.5 font-mono text-[9px] ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                          {formatTime(segment.startMs)}
                        </span>
                        {segment.speaker && (
                          <span className={`mr-1 text-[10px] ${isActive ? 'text-primary font-medium' : 'text-muted-foreground/80'}`}>
                            [{segment.speaker}]
                          </span>
                        )}
                        <span className="leading-snug">{segment.text}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-[11px] text-muted-foreground">
                  暂无转写内容
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* 右侧：结构化内容 */}
      <div className="col-span-12 lg:col-span-4">
        <div className="sticky top-12 space-y-2 h-[calc(100vh-80px)] overflow-y-auto">
          {/* Summary 摘要 */}
          {summary && (
            <div className="rounded border border-border bg-muted/30 p-2">
              <h2 className="mb-1 flex items-center gap-1 font-serif text-[10px] font-bold text-primary">
                <FileText className="h-3 w-3" />
                内容摘要
              </h2>
              <p className="text-[10px] leading-relaxed text-muted-foreground">{summary}</p>
            </div>
          )}

          {/* Takeaways 要点 */}
          {takeaways.length > 0 && (
            <div className="rounded border border-border bg-muted/30 p-2">
              <h2 className="mb-1.5 flex items-center gap-1 font-serif text-[10px] font-bold text-amber-600">
                <Lightbulb className="h-3 w-3" />
                核心要点
              </h2>
              <ol className="space-y-1">
                {takeaways.map((item, index) => (
                  <li key={index} className="flex gap-1.5 text-[10px] leading-relaxed">
                    <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Keywords 关键词 */}
          {keywords.length > 0 && (
            <div className="rounded border border-border bg-muted/30 p-2">
              <h2 className="mb-1 flex items-center gap-1 font-serif text-[10px] font-bold text-primary">
                <Hash className="h-3 w-3" />
                关键词
              </h2>
              <div className="flex flex-wrap gap-1">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Shownotes 补充信息 */}
          {shownotesExtra && (
            <div className="rounded border border-border bg-muted/30 p-2">
              <h2 className="mb-1 flex items-center gap-1 font-serif text-[10px] font-bold text-emerald-600">
                <List className="h-3 w-3" />
                节目笔记
              </h2>
              <p className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {shownotesExtra}
              </p>
            </div>
          )}

          {/* Description 简介 */}
          {description && (
            <div className="rounded border border-border bg-muted/30 p-2">
              <h2 className="mb-1 font-serif text-[10px] font-bold text-primary">节目简介</h2>
              <p className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
