'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  getTagBySlug, 
  getChildTags, 
  getParentTag, 
  getContentByTag,
  getTagTrend,
  channels,
  persons,
  type Tag 
} from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronRight,
  FileText,
  Radio,
  Users,
  ArrowLeft,
  Video,
  Headphones,
  MessageSquare,
  BookOpen,
  Hash,
  ExternalLink
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-600" />
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-600" />
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

function ContentTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'video': return <Video className="h-3 w-3" />
    case 'podcast': return <Headphones className="h-3 w-3" />
    case 'opinion': return <MessageSquare className="h-3 w-3" />
    case 'report': return <BookOpen className="h-3 w-3" />
    default: return <FileText className="h-3 w-3" />
  }
}

export default function TagDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const tag = getTagBySlug(slug)
  
  if (!tag) {
    notFound()
  }
  
  const parentTag = getParentTag(tag.id)
  const childTags = getChildTags(tag.id)
  const tagContent = getContentByTag(tag.id)
  const trendData = getTagTrend(tag.id)
  
  // 关联的频道和人物（Mock）
  const relatedChannels = channels.slice(0, 4)
  const relatedPersons = persons.slice(0, 4)
  
  const [activeTab, setActiveTab] = useState('content')

  return (
    <div className="space-y-4 p-4">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/tags" className="hover:text-foreground">标签系统</Link>
        <ChevronRight className="h-3 w-3" />
        {parentTag && (
          <>
            <Link href={`/tags/${parentTag.slug}`} className="hover:text-foreground">
              {parentTag.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-foreground">{tag.name}</span>
      </nav>

      {/* 标签头部 */}
      <header className="border-b border-border pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span 
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name.charAt(0)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-bold">{tag.name}</h1>
                {tag.level === 2 && parentTag && (
                  <Badge variant="outline" className="text-xs">
                    {parentTag.name}
                  </Badge>
                )}
                <TrendIcon trend={tag.trending} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{tag.description}</p>
            </div>
          </div>
          <Link 
            href="/tags" 
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            返回
          </Link>
        </div>
        
        {/* 统计数据 */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <Card className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="font-serif text-lg font-bold">{tag.contentCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">相关内容</div>
          </Card>
          <Card className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Radio className="h-3 w-3 text-muted-foreground" />
              <span className="font-serif text-lg font-bold">{tag.channelCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">关联频道</div>
          </Card>
          <Card className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="font-serif text-lg font-bold">{tag.personCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">相关人物</div>
          </Card>
          <Card className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="font-serif text-lg font-bold">{childTags.length}</span>
            </div>
            <div className="text-xs text-muted-foreground">子标签</div>
          </Card>
        </div>
      </header>

      {/* 子标签（如果是一级标签） */}
      {childTags.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <span className="h-4 w-1 bg-foreground" />
            子标签
          </h2>
          <div className="flex flex-wrap gap-2">
            {childTags.map(child => (
              <Link key={child.id} href={`/tags/${child.slug}`}>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer gap-1.5 px-2 py-1 transition-colors hover:bg-muted"
                  style={{ borderColor: child.color }}
                >
                  <span 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: child.color }}
                  />
                  {child.name}
                  <span className="text-muted-foreground">{child.contentCount}</span>
                  <TrendIcon trend={child.trending} />
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 趋势图 */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <span className="h-4 w-1 bg-foreground" />
          内容趋势（近 15 天）
        </h2>
        <Card className="p-3">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke={tag.color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 内容/频道/人物 Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="text-xs">
            相关内容 ({tag.contentCount})
          </TabsTrigger>
          <TabsTrigger value="channels" className="text-xs">
            关联频道 ({tag.channelCount})
          </TabsTrigger>
          <TabsTrigger value="persons" className="text-xs">
            相关人物 ({tag.personCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-2">
          {tagContent.length > 0 ? (
            tagContent.map(content => (
              <Card key={content.id} className="p-3 transition-colors hover:bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                    <ContentTypeIcon type={content.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{content.channelName}</span>
                      <span className="text-xs text-muted-foreground">{content.date}</span>
                    </div>
                    <h3 className="font-medium text-sm line-clamp-1">{content.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{content.snippet}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Card>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              暂无相关内容
            </div>
          )}
        </TabsContent>

        <TabsContent value="channels" className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {relatedChannels.map(channel => (
              <Link key={channel.id} href={`/channels/${channel.id}`}>
                <Card className="p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-serif text-sm font-bold">
                      {channel.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium line-clamp-1">{channel.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {channel.platform === 'youtube' ? 'YouTube' : 'Podcast'}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="persons" className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {relatedPersons.map(person => (
              <Link key={person.id} href={`/persons/${person.id}`}>
                <Card className="p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-serif text-sm font-bold">
                      {person.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium line-clamp-1">{person.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {person.organization}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 相关标签推荐 */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <span className="h-4 w-1 bg-foreground" />
          相关标签
        </h2>
        <div className="flex flex-wrap gap-2">
          {(parentTag ? [parentTag, ...getChildTags(parentTag.id)] : childTags)
            .filter(t => t.id !== tag.id)
            .slice(0, 6)
            .map(relatedTag => (
              <Link key={relatedTag.id} href={`/tags/${relatedTag.slug}`}>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer gap-1.5 px-2 py-1 transition-colors hover:bg-muted"
                >
                  <span 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: relatedTag.color }}
                  />
                  {relatedTag.name}
                </Badge>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
