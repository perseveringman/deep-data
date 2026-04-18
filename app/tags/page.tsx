'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { level1Tags, level2Tags, getChildTags, type Tag } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  FileText,
  Radio,
  Users,
  ChevronRight,
  ChevronDown,
  Hash,
  Flame,
  X,
  LayoutGrid,
  List,
} from 'lucide-react'

type TrendFilter = 'all' | 'up' | 'down' | 'stable'
type SortMode = 'content' | 'recent' | 'name'

function TrendBadge({ trend, size = 'sm' }: { trend: 'up' | 'down' | 'stable'; size?: 'sm' | 'xs' }) {
  const cls = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'
  if (trend === 'up')
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
        <TrendingUp className={cls} />
        上升
      </span>
    )
  if (trend === 'down')
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
        <TrendingDown className={cls} />
        下降
      </span>
    )
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Minus className={cls} />
      平稳
    </span>
  )
}

function StatIcon({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof FileText
  value: number
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span className="tabular-nums">{value.toLocaleString()}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

function TagGroup({
  tag,
  children,
  defaultExpanded = true,
  trendFilter,
  sortMode,
}: {
  tag: Tag
  children: Tag[]
  defaultExpanded?: boolean
  trendFilter: TrendFilter
  sortMode: SortMode
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const visibleChildren = useMemo(() => {
    let list = trendFilter === 'all' ? children : children.filter(c => c.trending === trendFilter)
    if (sortMode === 'content') list = [...list].sort((a, b) => b.contentCount - a.contentCount)
    else if (sortMode === 'recent')
      list = [...list].sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )
    else if (sortMode === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [children, trendFilter, sortMode])

  return (
    <Card
      className="overflow-hidden border-l-4 p-0"
      style={{ borderLeftColor: tag.color }}
    >
      {/* 父标签头 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={expanded ? '收起' : '展开'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <Link href={`/tags/${tag.slug}`} className="flex min-w-0 flex-1 items-center gap-3 group">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name.charAt(0)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-serif text-base font-semibold group-hover:underline">
                {tag.name}
              </h3>
              <TrendBadge trend={tag.trending} />
              <span className="text-xs text-muted-foreground">
                {visibleChildren.length}/{children.length} 子标签
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">{tag.description}</p>
          </div>
        </Link>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <StatIcon icon={FileText} value={tag.contentCount} label="关联内容数" />
          <StatIcon icon={Radio} value={tag.channelCount} label="关联频道数" />
          <StatIcon icon={Users} value={tag.personCount} label="关联人物数" />
        </div>
      </div>

      {/* 子标签 */}
      {expanded && visibleChildren.length > 0 && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleChildren.map(child => (
              <Link key={child.id} href={`/tags/${child.slug}`}>
                <div className="group flex items-center gap-2 rounded-md border border-transparent bg-background px-2.5 py-2 transition-all hover:border-border hover:shadow-sm">
                  <Hash className="h-3.5 w-3.5 shrink-0" style={{ color: child.color }} />
                  <span className="truncate text-sm font-medium">{child.name}</span>
                  <TrendBadge trend={child.trending} size="xs" />
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                    {child.contentCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {expanded && visibleChildren.length === 0 && (
        <div className="border-t bg-muted/30 px-4 py-4 text-center text-xs text-muted-foreground">
          没有匹配的子标签
        </div>
      )}
    </Card>
  )
}

export default function TagsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('content')
  const [allExpanded, setAllExpanded] = useState(true)

  // 过滤标签
  const { displayLevel1, matchedChildIds } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return { displayLevel1: level1Tags, matchedChildIds: null as Set<string> | null }
    }
    const matchedL2 = level2Tags.filter(
      t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    )
    const matchedL1 = level1Tags.filter(
      t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    )
    const parentIds = new Set(matchedL2.map(t => t.parentId).filter(Boolean) as string[])
    const merged = level1Tags.filter(t => matchedL1.some(m => m.id === t.id) || parentIds.has(t.id))
    return { displayLevel1: merged, matchedChildIds: new Set(matchedL2.map(t => t.id)) }
  }, [searchQuery])

  const totalContent = level1Tags.reduce((s, t) => s + t.contentCount, 0)
  const trendingUpCount = [...level1Tags, ...level2Tags].filter(t => t.trending === 'up').length

  const trendingTags = useMemo(
    () =>
      [...level1Tags, ...level2Tags]
        .filter(t => t.trending === 'up')
        .sort((a, b) => b.contentCount - a.contentCount)
        .slice(0, 8),
    []
  )

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {/* 标题 */}
        <header>
          <h1 className="font-serif text-2xl font-bold">标签系统</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            按主题浏览全站内容、频道与人物，点击任意标签查看详情
          </p>
        </header>

        {/* 统计 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">一级标签</div>
            <div className="mt-1 font-serif text-2xl font-bold tabular-nums">{level1Tags.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">二级标签</div>
            <div className="mt-1 font-serif text-2xl font-bold tabular-nums">{level2Tags.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">关联内容</div>
            <div className="mt-1 font-serif text-2xl font-bold tabular-nums">
              {totalContent.toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-500" />
              热度上升
            </div>
            <div className="mt-1 font-serif text-2xl font-bold tabular-nums text-green-600 dark:text-green-500">
              {trendingUpCount}
            </div>
          </Card>
        </div>

        {/* 热门标签快捷入口 */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>热门标签</span>
            <span className="text-xs text-muted-foreground">点击直达</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map(tag => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer gap-1.5 px-2.5 py-1 text-sm transition-colors hover:bg-muted"
                  style={{ borderColor: tag.color }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  <span className="text-xs text-muted-foreground">{tag.contentCount}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* 筛选工具栏 */}
        <div className="sticky top-0 z-10 -mx-4 space-y-3 border-y bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索标签名称或描述..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="清除"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 趋势筛选 */}
              <div className="flex rounded-md border bg-background p-0.5">
                {([
                  { v: 'all', l: '全部' },
                  { v: 'up', l: '上升' },
                  { v: 'stable', l: '平稳' },
                  { v: 'down', l: '下降' },
                ] as const).map(o => (
                  <button
                    key={o.v}
                    onClick={() => setTrendFilter(o.v)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      trendFilter === o.v
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>

              {/* 排序 */}
              <div className="flex rounded-md border bg-background p-0.5">
                {([
                  { v: 'content', l: '内容数' },
                  { v: 'recent', l: '最近更新' },
                  { v: 'name', l: '名称' },
                ] as const).map(o => (
                  <button
                    key={o.v}
                    onClick={() => setSortMode(o.v)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      sortMode === o.v
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>

              {/* 全部展开/收起 */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setAllExpanded(!allExpanded)}
              >
                {allExpanded ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                {allExpanded ? '全部收起' : '全部展开'}
              </Button>
            </div>
          </div>

          {searchQuery && (
            <div className="text-xs text-muted-foreground">
              找到 {displayLevel1.length} 个分组
              {matchedChildIds && `，${matchedChildIds.size} 个子标签`}
            </div>
          )}
        </div>

        {/* 标签分组 */}
        <div className="space-y-3">
          {displayLevel1.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">没有找到匹配的标签</p>
              <Button variant="link" size="sm" onClick={() => setSearchQuery('')}>
                清除搜索
              </Button>
            </Card>
          ) : (
            displayLevel1.map(tag => {
              const allChildren = getChildTags(tag.id)
              const parentMatches = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tag.description.toLowerCase().includes(searchQuery.toLowerCase())
              const children = matchedChildIds && !parentMatches
                ? allChildren.filter(c => matchedChildIds.has(c.id))
                : allChildren
              return (
                <TagGroup
                  key={`${tag.id}-${allExpanded}`}
                  tag={tag}
                  children={children}
                  defaultExpanded={allExpanded}
                  trendFilter={trendFilter}
                  sortMode={sortMode}
                />
              )
            })
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
