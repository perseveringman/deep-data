'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { persons, personRelations } from '@/lib/mock-data'
import { PersonNetwork } from '@/components/charts/person-network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ArrowUpRight, Search, TrendingUp, Users, MessageSquare } from 'lucide-react'

type SortKey = 'mentions' | 'relations' | 'recent'

export default function PersonsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('mentions')
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)

  const filteredPersons = persons.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const sortedPersons = [...filteredPersons].sort((a, b) => {
    if (sortBy === 'mentions') return b.mentionCount - a.mentionCount
    if (sortBy === 'relations') {
      const aRelations = personRelations.filter(r => r.sourceId === a.id || r.targetId === a.id).length
      const bRelations = personRelations.filter(r => r.sourceId === b.id || r.targetId === b.id).length
      return bRelations - aRelations
    }
    return new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime()
  })

  const getPersonRelationCount = (personId: string) => {
    return personRelations.filter(r => r.sourceId === personId || r.targetId === personId).length
  }

  const handlePersonClick = (personId: string) => {
    if (selectedPerson === personId) {
      router.push(`/persons/${personId}`)
    } else {
      setSelectedPerson(personId)
    }
  }

  // 统计数据
  const totalMentions = persons.reduce((sum, p) => sum + p.mentionCount, 0)
  const totalRelations = personRelations.length

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-10 items-center gap-3 border-b border-border bg-background px-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-sm font-bold">人物图谱</h1>
          <span className="text-xs text-muted-foreground">跨内容人物关系发现与分析</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
          <span><strong className="text-foreground">{persons.length}</strong> 人物</span>
          <span><strong className="text-foreground">{totalMentions}</strong> 提及</span>
          <span><strong className="text-foreground">{totalRelations}</strong> 关系</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {/* 关系网络图 */}
        <Card>
          <CardContent className="p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="font-serif text-xs font-semibold">关系网络</h2>
              <p className="text-[9px] text-muted-foreground">
                点击节点查看详情，节点大小表示提及次数，双击进入人物页面
              </p>
            </div>
            <PersonNetwork
              persons={persons}
              relations={personRelations}
              onPersonClick={handlePersonClick}
              selectedPersonId={selectedPerson || undefined}
              compact
            />
          </CardContent>
        </Card>

        {/* 筛选和统计 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索人物、组织或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {[
              { key: 'mentions' as SortKey, label: '提及次数', icon: MessageSquare },
              { key: 'relations' as SortKey, label: '关系数量', icon: Users },
              { key: 'recent' as SortKey, label: '最近提及', icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] transition-colors ${
                  sortBy === key
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-2.5 w-2.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 人物列表 */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedPersons.map((person) => {
            const relationCount = getPersonRelationCount(person.id)
            const isSelected = selectedPerson === person.id
            
            return (
              <Link
                key={person.id}
                href={`/persons/${person.id}`}
                className={`group block rounded border p-2 transition-all hover:border-foreground ${
                  isSelected ? 'border-foreground bg-muted/50' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* 头像占位 */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-serif text-sm font-bold">
                    {person.name.charAt(0)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="truncate font-serif text-xs font-semibold group-hover:underline">
                        {person.name}
                      </h3>
                      <ArrowUpRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="truncate text-[9px] text-muted-foreground">
                      {person.title} · {person.organization}
                    </p>
                  </div>
                </div>
                
                <div className="mt-1.5 flex flex-wrap gap-0.5">
                  {person.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="h-3.5 rounded px-1 text-[8px] font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {person.tags.length > 2 && (
                    <span className="text-[8px] text-muted-foreground">+{person.tags.length - 2}</span>
                  )}
                </div>
                
                <div className="mt-1.5 flex items-center gap-2 border-t border-border pt-1.5 text-[9px] text-muted-foreground">
                  <span>
                    <strong className="font-medium text-foreground">{person.mentionCount}</strong> 提及
                  </span>
                  <span>
                    <strong className="font-medium text-foreground">{relationCount}</strong> 关系
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {filteredPersons.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            未找到匹配的人物
          </div>
        )}
      </div>
    </div>
  )
}
