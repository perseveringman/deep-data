import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { dailyReports } from '@/lib/mock-data'
import { ArrowRight, Calendar, FileText, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="font-serif text-base font-semibold">日报</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Reports Grid */}
        <div className="grid gap-3 lg:grid-cols-2">
          {dailyReports.map((report, index) => (
            <Link
              key={report.date}
              href={`/reports/${report.date}`}
              className="group block border border-border transition-colors hover:border-foreground"
            >
              {/* Report Header */}
              <div className="border-b border-border p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <time dateTime={report.date}>
                      {new Date(report.date).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </time>
                    {index === 0 && (
                      <span className="bg-foreground px-1.5 py-0.5 text-[9px] font-medium text-background">
                        最新
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-xs leading-relaxed line-clamp-2">
                  {report.summary}
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="p-2 text-center">
                  <p className="font-serif text-lg font-bold">{report.newContentCount}</p>
                  <p className="text-[10px] text-muted-foreground">新增</p>
                </div>
                <div className="p-2 text-center">
                  <p className="font-serif text-lg font-bold">
                    {report.hotTopics.filter((t) => t.change > 0).length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">上升话题</p>
                </div>
                <div className="p-2 text-center">
                  <p className="font-serif text-lg font-bold">{report.anomalies.length}</p>
                  <p className="text-[10px] text-muted-foreground">异常</p>
                </div>
              </div>

              {/* Hot Topics Preview */}
              <div className="border-t border-dashed border-border p-2">
                <div className="flex flex-wrap gap-1.5">
                  {report.hotTopics.slice(0, 4).map((topic) => (
                    <span
                      key={topic.topic}
                      className="inline-flex items-center gap-0.5 text-[10px]"
                    >
                      <span className="nyt-tag !py-0">{topic.topic}</span>
                      <span className={topic.change > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                        {topic.change > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
