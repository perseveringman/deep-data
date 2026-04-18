import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { dailyReports, channels } from '@/lib/mock-data'
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, AlertTriangle, Radio, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface ReportDetailPageProps {
  params: Promise<{ date: string }>
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { date } = await params
  const report = dailyReports.find((r) => r.date === date)

  if (!report) {
    notFound()
  }

  const getChannelById = (id: string) => channels.find((c) => c.id === id)
  const currentIndex = dailyReports.findIndex((r) => r.date === date)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <Link
            href="/reports"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回列表
          </Link>
          {/* Quick Nav */}
          <div className="ml-auto flex items-center gap-2 text-xs">
            {currentIndex < dailyReports.length - 1 && (
              <Link
                href={`/reports/${dailyReports[currentIndex + 1].date}`}
                className="text-muted-foreground hover:text-foreground"
              >
                前一天
              </Link>
            )}
            {currentIndex > 0 && currentIndex < dailyReports.length - 1 && (
              <span className="text-border">|</span>
            )}
            {currentIndex > 0 && (
              <Link
                href={`/reports/${dailyReports[currentIndex - 1].date}`}
                className="text-muted-foreground hover:text-foreground"
              >
                后一天
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Report Header + Stats Row */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <time dateTime={report.date}>
                {new Date(report.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </time>
            </div>
            <h1 className="mt-1 font-serif text-xl font-bold">内容日报</h1>
            <p className="mt-2 text-sm leading-relaxed">{report.summary}</p>
          </div>
          <div className="lg:col-span-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="border border-border p-2 text-center">
                <p className="font-serif text-lg font-bold">{report.newContentCount}</p>
                <p className="text-[10px] text-muted-foreground">新增</p>
              </div>
              <div className="border border-border p-2 text-center">
                <p className="font-serif text-lg font-bold">
                  {report.hotTopics.filter((t) => t.change > 0).length}
                </p>
                <p className="text-[10px] text-muted-foreground">上升</p>
              </div>
              <div className="border border-border p-2 text-center">
                <p className="font-serif text-lg font-bold">
                  {report.hotTopics.filter((t) => t.change < 0).length}
                </p>
                <p className="text-[10px] text-muted-foreground">下降</p>
              </div>
              <div className="border border-border p-2 text-center">
                <p className="font-serif text-lg font-bold">{report.channelHighlights.length}</p>
                <p className="text-[10px] text-muted-foreground">动态</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Left: Highlights + Topics */}
          <div className="lg:col-span-5 space-y-4">
            {/* Highlights */}
            <section>
              <div className="border-b border-border pb-1">
                <h2 className="font-serif text-sm font-bold">今日要点</h2>
              </div>
              <ul className="mt-2 space-y-2">
                {report.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-foreground text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Hot Topics */}
            <section>
              <div className="border-b border-border pb-1">
                <h2 className="font-serif text-sm font-bold">话题热度变化</h2>
              </div>
              <div className="mt-2 space-y-1.5">
                {report.hotTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      {topic.change > 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-foreground" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="font-medium">{topic.topic}</span>
                    </div>
                    <span
                      className={`font-mono ${
                        topic.change > 0 ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {topic.change > 0 ? '+' : ''}
                      {topic.change}%
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Anomalies */}
            {report.anomalies.length > 0 && (
              <section>
                <div className="border-b border-border pb-1">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <h2 className="font-serif text-sm font-bold">异常提醒</h2>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {report.anomalies.map((anomaly, index) => (
                    <div key={index} className="border-l-2 border-accent pl-2 py-1">
                      <p className="text-xs">{anomaly}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: Channel Highlights */}
          <div className="lg:col-span-7">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">频道动态</h2>
            </div>
            <div className="mt-2 space-y-2">
              {report.channelHighlights.map((item) => {
                const channel = getChannelById(item.channelId)
                return (
                  <Link
                    key={item.channelId}
                    href={`/channels/${item.channelId}`}
                    className="flex items-start gap-2 border border-border p-2 transition-colors hover:border-foreground"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-foreground/20 bg-muted">
                      <Radio className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-medium">{item.channelName}</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{item.highlight}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
