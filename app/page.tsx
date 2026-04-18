import Link from 'next/link'
import { ArrowRight, TrendingUp, Radio, FileText, Newspaper, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { TopicTrendChart } from '@/components/charts/topic-trend-chart'
import { KeywordCloud } from '@/components/charts/keyword-cloud'
import { OpinionTimeline } from '@/components/charts/opinion-timeline'
import { ChannelCard } from '@/components/channel-card'
import { channels, dailyReports, deepReports, opinions } from '@/lib/mock-data'

export default function DashboardPage() {
  const latestReport = dailyReports[0]
  const featuredDeepReport = deepReports.find(r => r.status === 'featured') || deepReports[0]
  const recentOpinions = opinions.slice(0, 6)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="font-serif text-base font-semibold">首页</h1>
          </div>
          <time className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </time>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Top Section - 3 Column Layout */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left Column - Today Summary */}
          <div className="lg:col-span-5">
            <div className="border-b-2 border-foreground pb-1">
              <h2 className="font-serif text-lg font-bold">今日要闻</h2>
            </div>
            <div className="mt-3">
              <p className="font-serif text-sm leading-relaxed">
                {latestReport.summary}
              </p>
              <ul className="mt-3 space-y-1.5">
                {latestReport.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground" />
                    <span className="leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/reports/${latestReport.date}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                阅读完整日报
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Stats Row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="border border-border p-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">新增内容</span>
                <p className="font-serif text-xl font-bold">{latestReport.newContentCount}</p>
              </div>
              <div className="border border-border p-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">监控频道</span>
                <p className="font-serif text-xl font-bold">{channels.length}</p>
              </div>
              <div className="border border-border p-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">深度报告</span>
                <p className="font-serif text-xl font-bold">{deepReports.length}</p>
              </div>
            </div>
          </div>

          {/* Middle Column - Topic Trends */}
          <div className="lg:col-span-4">
            <div className="border-b border-border pb-1">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-sm font-bold">话题趋势</h2>
                <span className="text-[10px] text-muted-foreground">15天</span>
              </div>
            </div>
            <div className="mt-2 h-[180px]">
              <TopicTrendChart compact />
            </div>
            
            {/* Hot Topics */}
            <div className="mt-3 border-t border-border pt-2">
              <h3 className="text-xs font-medium text-muted-foreground">热度变化</h3>
              <div className="mt-2 space-y-1">
                {latestReport.hotTopics.slice(0, 5).map((topic) => (
                  <div key={topic.topic} className="flex items-center justify-between text-xs">
                    <span className="truncate">{topic.topic}</span>
                    <span className={`flex items-center gap-0.5 font-mono ${topic.change > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {topic.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(topic.change)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Keywords */}
          <div className="lg:col-span-3">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">热门关键词</h2>
            </div>
            <div className="mt-2">
              <KeywordCloud compact />
            </div>
          </div>
        </div>

        {/* Second Row - Featured Report + Opinions */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Featured Deep Report */}
          <div className="lg:col-span-5">
            <div className="border-b border-border pb-1">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-sm font-bold">精选深度报告</h2>
                <Link href="/deep-reports" className="text-[10px] text-muted-foreground hover:underline">
                  查看全部
                </Link>
              </div>
            </div>
            <Link
              href={`/deep-reports/${featuredDeepReport.id}`}
              className="group mt-2 block border border-border p-3 transition-colors hover:border-foreground"
            >
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Newspaper className="h-3 w-3" />
                <span className="uppercase tracking-wider">
                  {featuredDeepReport.category === 'topic-analysis' && '主题分析'}
                  {featuredDeepReport.category === 'creator-profile' && '创作者画像'}
                  {featuredDeepReport.category === 'industry-comparison' && '行业对比'}
                  {featuredDeepReport.category === 'trend-tracking' && '热点追踪'}
                </span>
                <span>·</span>
                <span>{featuredDeepReport.readingTime}分钟</span>
              </div>
              <h3 className="mt-1.5 font-serif text-base font-bold leading-tight group-hover:underline">
                {featuredDeepReport.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {featuredDeepReport.subtitle}
              </p>
              <ul className="mt-2 space-y-1">
                {featuredDeepReport.summary.slice(0, 2).map((point, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-[11px]">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground" />
                    <span className="line-clamp-1">{point}</span>
                  </li>
                ))}
              </ul>
            </Link>

            {/* More Reports */}
            <div className="mt-2 space-y-1.5">
              {deepReports.slice(1, 4).map((report) => (
                <Link
                  key={report.id}
                  href={`/deep-reports/${report.id}`}
                  className="group flex items-start gap-2 py-1 border-b border-dashed border-border last:border-0"
                >
                  <span className="text-[10px] text-muted-foreground shrink-0 w-14">
                    {report.readingTime}分钟
                  </span>
                  <span className="text-xs font-medium group-hover:underline line-clamp-1">{report.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Latest Opinions */}
          <div className="lg:col-span-7">
            <div className="border-b border-border pb-1">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-sm font-bold">最新观点</h2>
                <Link href="/search?type=opinions" className="text-[10px] text-muted-foreground hover:underline">
                  查看全部
                </Link>
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {recentOpinions.map((opinion) => (
                <article key={opinion.id} className="border-l-2 border-foreground/30 pl-2 py-1">
                  <blockquote className="text-xs leading-relaxed line-clamp-2">
                    {`"${opinion.content}"`}
                  </blockquote>
                  <footer className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{opinion.channelName}</span>
                    <span>·</span>
                    <span className="nyt-tag !py-0 !text-[9px]">{opinion.topic}</span>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Third Row - Timeline + Channels */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Opinion Timeline */}
          <div className="lg:col-span-5">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">观点时间线</h2>
            </div>
            <div className="mt-2">
              <OpinionTimeline limit={6} compact />
            </div>
          </div>

          {/* Channels Grid */}
          <div className="lg:col-span-7">
            <div className="border-b border-border pb-1">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-sm font-bold">内容源</h2>
                <Link href="/channels" className="text-[10px] text-muted-foreground hover:underline">
                  管理全部
                </Link>
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {channels.slice(0, 6).map((channel) => (
                <ChannelCard key={channel.id} channel={channel} compact />
              ))}
            </div>
          </div>
        </div>

        {/* Fourth Row - Daily Reports */}
        <div className="mt-4">
          <div className="border-b border-border pb-1">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-sm font-bold">往期日报</h2>
              <Link href="/reports" className="text-[10px] text-muted-foreground hover:underline">
                查看全部
              </Link>
            </div>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {dailyReports.slice(1, 5).map((report) => (
              <Link
                key={report.date}
                href={`/reports/${report.date}`}
                className="group border border-border p-2 hover:border-foreground transition-colors"
              >
                <div className="text-[10px] text-muted-foreground">
                  {new Date(report.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </div>
                <h3 className="mt-1 text-xs font-medium group-hover:underline line-clamp-2">
                  {report.summary.slice(0, 50)}...
                </h3>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>+{report.newContentCount} 内容</span>
                  <span>·</span>
                  <span>{report.hotTopics.length} 热门话题</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
