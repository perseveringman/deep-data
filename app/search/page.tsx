'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { searchMockResults, channels, keywords, opinions } from '@/lib/mock-data'
import { Hash, User, MessageSquare, TrendingUp, Radio, Search } from 'lucide-react'
import { Suspense } from 'react'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'

  // 模拟搜索结果过滤
  const filteredResults = query
    ? searchMockResults.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.snippet.toLowerCase().includes(query.toLowerCase())
      )
    : searchMockResults

  // 如果是查看所有观点
  const showAllOpinions = type === 'opinions'

  const getTypeIcon = (resultType: string) => {
    switch (resultType) {
      case 'channel':
        return <User className="h-3.5 w-3.5" />
      case 'topic':
        return <TrendingUp className="h-3.5 w-3.5" />
      case 'keyword':
        return <Hash className="h-3.5 w-3.5" />
      case 'opinion':
        return <MessageSquare className="h-3.5 w-3.5" />
      default:
        return <Search className="h-3.5 w-3.5" />
    }
  }

  const getTypeLabel = (resultType: string) => {
    switch (resultType) {
      case 'channel':
        return '频道'
      case 'topic':
        return '话题'
      case 'keyword':
        return '关键词'
      case 'opinion':
        return '观点'
      default:
        return '结果'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="font-serif text-base font-semibold">
              {showAllOpinions ? '所有观点' : '搜索结果'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {showAllOpinions ? (
          // 显示所有观点
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">共 {opinions.length} 条观点</span>
            </div>

            <div className="grid gap-2 lg:grid-cols-2">
              {opinions.map((opinion) => (
                <article
                  key={opinion.id}
                  className="border border-border p-3"
                >
                  <blockquote className="text-xs leading-relaxed line-clamp-3">
                    {`"${opinion.content}"`}
                  </blockquote>
                  <footer className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <Link
                      href={`/channels/${opinion.channelId}`}
                      className="font-medium hover:underline"
                    >
                      {opinion.channelName}
                    </Link>
                    <span className="nyt-tag !py-0 !text-[9px]">{opinion.topic}</span>
                    <span className="nyt-tag !py-0 !text-[9px]">
                      {opinion.sentiment === 'positive' && '积极'}
                      {opinion.sentiment === 'negative' && '消极'}
                      {opinion.sentiment === 'neutral' && '中性'}
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          </>
        ) : (
          // 显示搜索结果
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Main Results */}
            <div className="lg:col-span-8">
              {query && (
                <p className="mb-3 text-xs text-muted-foreground">
                  搜索 <span className="font-medium text-foreground">{`"${query}"`}</span> 的结果
                </p>
              )}

              {filteredResults.length > 0 ? (
                <div className="space-y-2">
                  {filteredResults.map((result) => (
                    <Link
                      key={result.id}
                      href={
                        result.type === 'channel' && result.channelId
                          ? `/channels/${result.channelId}`
                          : `/search?q=${encodeURIComponent(result.title)}`
                      }
                      className="flex items-start gap-2 border border-border p-2 transition-colors hover:border-foreground"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-foreground/20 bg-muted">
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-medium">{result.title}</h3>
                          <span className="nyt-tag !py-0 !text-[9px]">{getTypeLabel(result.type)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{result.snippet}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {result.relevance}%
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">未找到相关结果</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              {/* Hot Keywords */}
              <section>
                <div className="border-b border-border pb-1">
                  <h2 className="font-serif text-sm font-bold">热门搜索</h2>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {keywords.slice(0, 10).map((keyword) => (
                    <Link
                      key={keyword.word}
                      href={`/search?q=${encodeURIComponent(keyword.word)}`}
                      className="nyt-tag !py-0 !text-[10px] hover:border-foreground"
                    >
                      {keyword.word}
                    </Link>
                  ))}
                </div>
              </section>

              {/* Quick Links */}
              <section>
                <div className="border-b border-border pb-1">
                  <h2 className="font-serif text-sm font-bold">快速访问</h2>
                </div>
                <div className="mt-2 space-y-1.5">
                  <Link
                    href="/channels"
                    className="flex items-center gap-2 border border-border p-2 text-xs transition-colors hover:border-foreground"
                  >
                    <Radio className="h-3.5 w-3.5" />
                    <span>浏览所有频道</span>
                  </Link>
                  <Link
                    href="/search?type=opinions"
                    className="flex items-center gap-2 border border-border p-2 text-xs transition-colors hover:border-foreground"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>查看所有观点</span>
                  </Link>
                  <Link
                    href="/compare"
                    className="flex items-center gap-2 border border-border p-2 text-xs transition-colors hover:border-foreground"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>交叉分析</span>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-12 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="font-serif text-base font-semibold">搜索结果</h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-8">
          <p className="text-xs text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
