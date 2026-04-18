'use client'

import { useState } from 'react'
import Link from 'next/link'
import { level1Tags, level2Tags, getChildTags, type Tag } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search,
  FileText,
  Radio,
  Users,
  ChevronRight,
  Hash
} from 'lucide-react'

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-600" />
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-600" />
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

function TagCard({ tag, children }: { tag: Tag; children?: Tag[] }) {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div className="space-y-1">
      {/* 一级标签卡片 */}
      <Link href={`/tags/${tag.slug}`}>
        <Card className="group cursor-pointer border-l-4 p-3 transition-colors hover:bg-muted/50"
          style={{ borderLeftColor: tag.color }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span 
                  className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name.charAt(0)}
                </span>
                <h3 className="font-serif text-base font-semibold">{tag.name}</h3>
                <TrendIcon trend={tag.trending} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{tag.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{tag.contentCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Radio className="h-3 w-3" />
                <span>{tag.channelCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{tag.personCount}</span>
              </div>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Card>
      </Link>
      
      {/* 二级标签 */}
      {children && children.length > 0 && expanded && (
        <div className="ml-4 grid grid-cols-2 gap-1 border-l-2 border-muted pl-3 sm:grid-cols-3 lg:grid-cols-4">
          {children.map(child => (
            <Link key={child.id} href={`/tags/${child.slug}`}>
              <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{child.name}</span>
                <TrendIcon trend={child.trending} />
                <span className="ml-auto text-xs text-muted-foreground">{child.contentCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TagsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  // 过滤标签
  const filteredLevel1 = level1Tags.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredLevel2 = level2Tags.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // 如果搜索二级标签，显示其父标签
  const matchedParentIds = new Set(filteredLevel2.map(t => t.parentId))
  const displayLevel1 = searchQuery 
    ? [...new Set([...filteredLevel1, ...level1Tags.filter(t => matchedParentIds.has(t.id))])]
    : level1Tags

  return (
    <div className="space-y-4 p-4">
      {/* 页面标题 */}
      <header className="border-b border-border pb-3">
        <h1 className="font-serif text-xl font-bold">标签系统</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          全站统一的分级标签体系，覆盖所有内容、频道和人物
        </p>
      </header>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="搜索标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-3 text-center">
          <div className="font-serif text-xl font-bold">{level1Tags.length}</div>
          <div className="text-xs text-muted-foreground">一级标签</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="font-serif text-xl font-bold">{level2Tags.length}</div>
          <div className="text-xs text-muted-foreground">二级标签</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="font-serif text-xl font-bold">
            {level1Tags.reduce((sum, t) => sum + t.contentCount, 0)}
          </div>
          <div className="text-xs text-muted-foreground">关联内容</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="font-serif text-xl font-bold">
            {level2Tags.filter(t => t.trending === 'up').length}
          </div>
          <div className="text-xs text-muted-foreground">热度上升</div>
        </Card>
      </div>

      {/* 标签层级展示 */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-medium">
          <span className="h-4 w-1 bg-foreground" />
          标签层级
        </h2>
        
        <div className="space-y-3">
          {displayLevel1.map(tag => {
            const children = searchQuery 
              ? getChildTags(tag.id).filter(c => 
                  filteredLevel2.some(f => f.id === c.id) || !searchQuery
                )
              : getChildTags(tag.id)
            
            return (
              <TagCard key={tag.id} tag={tag} children={children} />
            )
          })}
        </div>
      </div>

      {/* 热门标签 */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-medium">
          <span className="h-4 w-1 bg-foreground" />
          热度上升最快
        </h2>
        <div className="flex flex-wrap gap-2">
          {[...level1Tags, ...level2Tags]
            .filter(t => t.trending === 'up')
            .sort((a, b) => b.contentCount - a.contentCount)
            .slice(0, 10)
            .map(tag => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer gap-1.5 px-2 py-1 transition-colors hover:bg-muted"
                  style={{ borderColor: tag.color }}
                >
                  <span 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </Badge>
              </Link>
            ))}
        </div>
      </div>

      {/* 最近更新 */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-medium">
          <span className="h-4 w-1 bg-foreground" />
          最近更新
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {[...level1Tags, ...level2Tags]
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
            .slice(0, 8)
            .map(tag => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Card className="cursor-pointer p-2 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm font-medium">{tag.name}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{tag.lastUpdated}</span>
                    <span>+{tag.contentCount} 内容</span>
                  </div>
                </Card>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
