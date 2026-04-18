import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { deepReports } from '@/lib/mock-data'
import { Clock, Star, TrendingUp, Flame } from 'lucide-react'

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'featured':
      return <Star className="h-2.5 w-2.5" />
    case 'popular':
      return <Flame className="h-2.5 w-2.5" />
    case 'latest':
      return <TrendingUp className="h-2.5 w-2.5" />
    default:
      return null
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'featured':
      return '精选'
    case 'popular':
      return '热门'
    case 'latest':
      return '最新'
    default:
      return null
  }
}

export default function DeepReportsPage() {
  const featuredReport = deepReports.find((r) => r.status === 'featured')
  const otherReports = deepReports.filter((r) => r.id !== featuredReport?.id)

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'topic-analysis', label: '主题分析' },
    { id: 'creator-profile', label: '创作者画像' },
    { id: 'industry-comparison', label: '行业对比' },
    { id: 'trend-tracking', label: '热点追踪' },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="font-serif text-base font-semibold">深度报告</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Stats + Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Stats */}
          <div className="flex gap-3 text-xs">
            <span><strong>{deepReports.length}</strong> 报告</span>
            <span className="text-muted-foreground">|</span>
            <span><strong>{deepReports.filter((r) => r.category === 'topic-analysis').length}</strong> 主题分析</span>
            <span className="text-muted-foreground">|</span>
            <span><strong>{deepReports.filter((r) => r.category === 'creator-profile').length}</strong> 创作者画像</span>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`px-2 py-1 text-[10px] transition-colors ${
                  cat.id === 'all'
                    ? 'bg-foreground text-background'
                    : 'border border-border hover:border-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Featured Report */}
          {featuredReport && (
            <div className="lg:col-span-5">
              <div className="border-b-2 border-foreground pb-1 mb-2">
                <h2 className="font-serif text-sm font-bold">精选报告</h2>
              </div>
              <Link
                href={`/deep-reports/${featuredReport.id}`}
                className="group block border border-border p-3 transition-colors hover:border-foreground"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5 bg-foreground px-1.5 py-0.5 text-background">
                    <Star className="h-2.5 w-2.5" />
                    精选
                  </span>
                  <span className="uppercase tracking-wider">{getCategoryLabel(featuredReport.category)}</span>
                  <span>·</span>
                  <span>{featuredReport.readingTime}分钟</span>
                </div>
                <h3 className="mt-2 font-serif text-lg font-bold leading-tight group-hover:underline">
                  {featuredReport.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{featuredReport.subtitle}</p>
                <ul className="mt-2 space-y-1">
                  {featuredReport.summary.slice(0, 3).map((point, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-[11px]">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground" />
                      <span className="line-clamp-1">{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-1">
                  {featuredReport.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="nyt-tag !py-0 !text-[9px]">{tag}</span>
                  ))}
                </div>
              </Link>
            </div>
          )}

          {/* Other Reports Grid */}
          <div className={featuredReport ? "lg:col-span-7" : "lg:col-span-12"}>
            <div className="border-b border-border pb-1 mb-2">
              <h2 className="font-serif text-sm font-bold">全部报告</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {otherReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/deep-reports/${report.id}`}
                  className="group block border border-border p-2 transition-colors hover:border-foreground"
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {getStatusIcon(report.status) && (
                      <span className="flex items-center gap-0.5 border border-foreground/20 px-1 py-0.5">
                        {getStatusIcon(report.status)}
                        {getStatusLabel(report.status)}
                      </span>
                    )}
                    <span className="uppercase tracking-wider">{getCategoryLabel(report.category)}</span>
                  </div>
                  <h3 className="mt-1.5 text-xs font-medium leading-tight group-hover:underline line-clamp-2">
                    {report.title}
                  </h3>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{report.publishedAt}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {report.readingTime}分钟
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
