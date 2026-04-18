import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { getDeepReportDetail, deepReports, channels } from '@/lib/mock-data'
import { ArrowLeft, Clock, Calendar, Radio, BookOpen, ArrowRight } from 'lucide-react'

interface DeepReportDetailPageProps {
  params: Promise<{ id: string }>
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'topic-analysis':
      return '主题分析'
    case 'creator-profile':
      return '创作者画像'
    case 'industry-comparison':
      return '行业对比'
    case 'trend-tracking':
      return '热点追踪'
    default:
      return category
  }
}

export default async function DeepReportDetailPage({ params }: DeepReportDetailPageProps) {
  const { id } = await params
  const report = getDeepReportDetail(id)

  if (!report) {
    notFound()
  }

  const relatedReports = report.relatedReports
    .map((rid) => deepReports.find((r) => r.id === rid))
    .filter(Boolean)

  const relatedChannels = report.relatedChannels
    .map((cid) => channels.find((c) => c.id === cid))
    .filter(Boolean)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <Link
            href="/deep-reports"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回列表
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <article className="px-4 py-4">
        {/* Two Column Layout */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Report Header */}
            <header className="border-b border-border pb-4">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="uppercase tracking-wider">{getCategoryLabel(report.category)}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" />
                  {report.publishedAt}
                </span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {report.readingTime}分钟
                </span>
              </div>
              <h1 className="mt-2 font-serif text-2xl font-bold leading-tight">{report.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{report.subtitle}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {report.tags.map((tag) => (
                  <span key={tag} className="nyt-tag !py-0 !text-[9px]">{tag}</span>
                ))}
              </div>
            </header>

            {/* Executive Summary */}
            <section className="mt-4 border border-foreground bg-muted/30 p-3">
              <h2 className="flex items-center gap-1.5 text-xs font-bold">
                <BookOpen className="h-3.5 w-3.5" />
                核心发现
              </h2>
              <ul className="mt-2 space-y-1.5">
                {report.summary.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center border border-foreground text-[9px] font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Methodology */}
            <section className="mt-3 border-l-2 border-muted-foreground pl-3">
              <p className="text-[10px] text-muted-foreground">
                <strong>研究方法:</strong> {report.methodology.scope} | 
                数据来源: {report.methodology.sources.join(', ')} | 
                时间范围: {report.methodology.timeRange}
              </p>
            </section>

            {/* Main Content Sections */}
            <div className="mt-4 space-y-4">
              {report.sections.map((section, index) => (
                <section key={index}>
                  <h2 className="border-b border-border pb-1 font-serif text-base font-bold">
                    {section.title}
                  </h2>
                  <div className="mt-2">
                    <p className="text-sm leading-relaxed">{section.content}</p>

                    {/* Quotes */}
                    {section.quotes && section.quotes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {section.quotes.map((quote, qIndex) => (
                          <blockquote
                            key={qIndex}
                            className="border-l-2 border-foreground pl-3"
                          >
                            <p className="text-xs italic leading-relaxed">{`"${quote.text}"`}</p>
                            <footer className="mt-1 text-[10px] text-muted-foreground not-italic">
                              —— {quote.source}
                            </footer>
                          </blockquote>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>

            {/* Conclusions */}
            <section className="mt-4 border-t-2 border-foreground pt-4">
              <h2 className="font-serif text-base font-bold">结论与展望</h2>
              <ul className="mt-2 space-y-2">
                {report.conclusions.map((conclusion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-foreground" />
                    <span className="text-sm leading-relaxed">{conclusion}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Related Channels */}
            {relatedChannels.length > 0 && (
              <section>
                <div className="border-b border-border pb-1">
                  <h2 className="font-serif text-sm font-bold">相关频道</h2>
                </div>
                <div className="mt-2 space-y-1.5">
                  {relatedChannels.map((channel) => (
                    <Link
                      key={channel!.id}
                      href={`/channels/${channel!.id}`}
                      className="flex items-center gap-2 border border-border p-2 transition-colors hover:border-foreground"
                    >
                      <Radio className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{channel!.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related Reports */}
            {relatedReports.length > 0 && (
              <section>
                <div className="border-b border-border pb-1">
                  <h2 className="font-serif text-sm font-bold">相关报告</h2>
                </div>
                <div className="mt-2 space-y-1.5">
                  {relatedReports.map((r) => (
                    <Link
                      key={r!.id}
                      href={`/deep-reports/${r!.id}`}
                      className="group flex items-center justify-between border border-border p-2 transition-colors hover:border-foreground"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          {getCategoryLabel(r!.category)}
                        </p>
                        <h3 className="text-xs font-medium group-hover:underline line-clamp-1">{r!.title}</h3>
                      </div>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* More Reports */}
            <section>
              <div className="border-b border-border pb-1">
                <h2 className="font-serif text-sm font-bold">更多报告</h2>
              </div>
              <div className="mt-2 space-y-1.5">
                {deepReports
                  .filter((r) => r.id !== report.id && !report.relatedReports.includes(r.id))
                  .slice(0, 3)
                  .map((r) => (
                    <Link
                      key={r.id}
                      href={`/deep-reports/${r.id}`}
                      className="group block border-b border-dashed border-border pb-1.5"
                    >
                      <p className="text-[9px] text-muted-foreground">
                        {getCategoryLabel(r.category)} · {r.readingTime}分钟
                      </p>
                      <h3 className="text-xs font-medium group-hover:underline line-clamp-1">{r.title}</h3>
                    </Link>
                  ))}
              </div>
            </section>
          </div>
        </div>
      </article>
    </div>
  )
}
