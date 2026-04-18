'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  LayoutDashboard,
  Radio,
  GitCompare,
  Newspaper,
  FileText,
  Hash,
  MessageSquare,
  User,
  Users,
  Tags,
  Library,
} from 'lucide-react'
import { channels, keywords, persons, level1Tags, level2Tags, contentItems } from '@/lib/mock-data'

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      
      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 p-4">
        <div className="overflow-hidden rounded-lg border border-border bg-background shadow-2xl">
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="搜索话题、频道、关键词..."
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              未找到相关结果
            </Command.Empty>

            {/* 快捷导航 */}
            <Command.Group heading="快捷导航" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <Command.Item
                value="首页 dashboard"
                onSelect={() => runCommand(() => router.push('/'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                首页
              </Command.Item>
              <Command.Item
                value="内容库 contents library"
                onSelect={() => runCommand(() => router.push('/contents'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Library className="h-4 w-4" />
                内容库
              </Command.Item>
              <Command.Item
                value="内容源 channels"
                onSelect={() => runCommand(() => router.push('/channels'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Radio className="h-4 w-4" />
                内容源
              </Command.Item>
              <Command.Item
                value="交叉分析 compare"
                onSelect={() => runCommand(() => router.push('/compare'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <GitCompare className="h-4 w-4" />
                交叉分析
              </Command.Item>
              <Command.Item
                value="日报 reports"
                onSelect={() => runCommand(() => router.push('/reports'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Newspaper className="h-4 w-4" />
                日报
              </Command.Item>
              <Command.Item
                value="深度报告 deep reports"
                onSelect={() => runCommand(() => router.push('/deep-reports'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <FileText className="h-4 w-4" />
                深度报告
              </Command.Item>
              <Command.Item
                value="人物图谱 persons"
                onSelect={() => runCommand(() => router.push('/persons'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Users className="h-4 w-4" />
                人物图谱
              </Command.Item>
              <Command.Item
                value="标签系统 tags"
                onSelect={() => runCommand(() => router.push('/tags'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Tags className="h-4 w-4" />
                标签系统
              </Command.Item>
            </Command.Group>

            {/* 频道 */}
            <Command.Group heading="频道" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {channels.slice(0, 5).map((channel) => (
                <Command.Item
                  key={channel.id}
                  value={`${channel.name} ${channel.tags.join(' ')}`}
                  onSelect={() => runCommand(() => router.push(`/channels/${channel.id}`))}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <User className="h-4 w-4" />
                  <span>{channel.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{channel.platform}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* 标签 */}
            <Command.Group heading="标签" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {level1Tags.slice(0, 3).map((tag) => (
                <Command.Item
                  key={tag.id}
                  value={`${tag.name} ${tag.description}`}
                  onSelect={() => runCommand(() => router.push(`/tags/${tag.slug}`))}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <span className="h-3 w-3 rounded" style={{ backgroundColor: tag.color }} />
                  <span>{tag.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{tag.contentCount} 内容</span>
                </Command.Item>
              ))}
              {level2Tags.slice(0, 3).map((tag) => (
                <Command.Item
                  key={tag.id}
                  value={`${tag.name} ${tag.description}`}
                  onSelect={() => runCommand(() => router.push(`/tags/${tag.slug}`))}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Hash className="h-4 w-4" style={{ color: tag.color }} />
                  <span>{tag.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{tag.contentCount} 内容</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* 热门话题 */}
            <Command.Group heading="热门话题" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {keywords.slice(0, 5).map((keyword) => (
                <Command.Item
                  key={keyword.word}
                  value={keyword.word}
                  onSelect={() => runCommand(() => router.push(`/search?q=${encodeURIComponent(keyword.word)}`))}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Hash className="h-4 w-4" />
                  <span>{keyword.word}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {keyword.trend === 'up' && '↑'}
                    {keyword.trend === 'down' && '↓'}
                    {keyword.trend === 'stable' && '→'}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* 人物 */}
            <Command.Group heading="人物" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {persons.slice(0, 5).map((person) => (
                <Command.Item
                  key={person.id}
                  value={`${person.name} ${person.organization} ${person.tags.join(' ')}`}
                  onSelect={() => runCommand(() => router.push(`/persons/${person.id}`))}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Users className="h-4 w-4" />
                  <span>{person.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{person.organization}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* 搜索观点 */}
            <Command.Group heading="搜索观点" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <Command.Item
                value="搜索所有观点 opinions"
                onSelect={() => runCommand(() => router.push('/search?type=opinions'))}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                浏览所有观点
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t border-border px-4 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-muted px-1">↵</kbd>
                  选择
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-muted px-1">↑↓</kbd>
                  导航
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1">esc</kbd>
                关闭
              </span>
            </div>
          </div>
        </div>
      </div>
    </Command.Dialog>
  )
}
