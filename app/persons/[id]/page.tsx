'use client'

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getPersonDetail,
  getPersonRelations,
  getPersonMentions,
  persons,
  personRelations,
  PersonRelation,
} from '@/lib/mock-data'
import { PersonNetwork } from '@/components/charts/person-network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  ExternalLink,
} from 'lucide-react'

const relationTypeLabels: Record<PersonRelation['relationType'], string> = {
  colleague: '同事关系',
  competitor: '竞争关系',
  mentor: '导师关系',
  collaborator: '合作关系',
  critic: '批评/质疑',
  supporter: '支持关系',
}

const relationTypeColors: Record<PersonRelation['relationType'], string> = {
  colleague: 'bg-gray-100 text-gray-700',
  competitor: 'bg-red-50 text-red-700',
  mentor: 'bg-green-50 text-green-700',
  collaborator: 'bg-blue-50 text-blue-700',
  critic: 'bg-orange-50 text-orange-700',
  supporter: 'bg-purple-50 text-purple-700',
}

const sentimentLabels = {
  positive: { text: '正面', class: 'text-green-600' },
  negative: { text: '负面', class: 'text-red-600' },
  neutral: { text: '中性', class: 'text-gray-600' },
}

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const person = getPersonDetail(id)

  if (!person) {
    notFound()
  }

  const relations = getPersonRelations(id)
  const mentions = getPersonMentions(id)

  // 获取与该人物相关的所有人物
  const relatedPersonIds = new Set<string>()
  relations.forEach(r => {
    relatedPersonIds.add(r.sourceId)
    relatedPersonIds.add(r.targetId)
  })
  const relatedPersons = persons.filter(p => relatedPersonIds.has(p.id))
  const filteredRelations = personRelations.filter(
    r => relatedPersonIds.has(r.sourceId) && relatedPersonIds.has(r.targetId)
  )

  // 按关系类型分组
  const relationsByType = relations.reduce((acc, r) => {
    if (!acc[r.relationType]) acc[r.relationType] = []
    acc[r.relationType].push(r)
    return acc
  }, {} as Record<PersonRelation['relationType'], PersonRelation[]>)

  // 统计情感分布
  const sentimentCounts = mentions.reduce(
    (acc, m) => {
      acc[m.sentiment]++
      return acc
    },
    { positive: 0, negative: 0, neutral: 0 }
  )

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-10 items-center gap-3 border-b border-border bg-background px-4">
        <SidebarTrigger />
        <Link
          href="/persons"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          人物图谱
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-serif text-sm font-bold">{person.name}</span>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {/* 人物头部信息 */}
        <div className="flex gap-3 border-b border-border pb-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-muted font-serif text-xl font-bold">
            {person.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-serif text-lg font-bold tracking-tight">{person.name}</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{person.title}</span>
                  <span>·</span>
                  <span>{person.organization}</span>
                </div>
              </div>
              <div className="flex gap-4 text-right text-[10px]">
                <div>
                  <div className="text-base font-bold">{person.mentionCount}</div>
                  <div className="text-muted-foreground">总提及</div>
                </div>
                <div>
                  <div className="text-base font-bold">{relations.length}</div>
                  <div className="text-muted-foreground">关系数</div>
                </div>
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {person.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="h-4 text-[9px]">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground line-clamp-2">{person.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          {/* 左侧：关系网络和关系列表 */}
          <div className="col-span-12 space-y-3 lg:col-span-7">
            {/* 关系网络图 */}
            <Card>
              <CardContent className="p-2">
                <h2 className="mb-1.5 font-serif text-xs font-semibold">关系网络</h2>
                <PersonNetwork
                  persons={relatedPersons}
                  relations={filteredRelations}
                  selectedPersonId={id}
                  compact
                />
              </CardContent>
            </Card>

            {/* 关系详情 */}
            <Card>
              <CardContent className="p-2">
                <h2 className="mb-2 font-serif text-xs font-semibold">关系详情</h2>
                <div className="space-y-2">
                  {Object.entries(relationsByType).map(([type, rels]) => (
                    <div key={type}>
                      <div className="mb-1 flex items-center gap-1.5">
                        <Badge
                          className={`h-4 text-[9px] ${relationTypeColors[type as PersonRelation['relationType']]}`}
                        >
                          {relationTypeLabels[type as PersonRelation['relationType']]}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">
                          {rels.length} 条
                        </span>
                      </div>
                      <div className="space-y-1.5 pl-2">
                        {rels.map((rel, i) => {
                          const otherPersonId = rel.sourceId === id ? rel.targetId : rel.sourceId
                          const otherPerson = persons.find(p => p.id === otherPersonId)
                          if (!otherPerson) return null

                          return (
                            <div key={i} className="border-l-2 border-border pl-2">
                              <Link
                                href={`/persons/${otherPersonId}`}
                                className="group flex items-center gap-1 font-medium hover:underline"
                              >
                                <span className="text-[10px]">{otherPerson.name}</span>
                                <ArrowUpRight className="h-2.5 w-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                              </Link>
                              <p className="text-[9px] text-muted-foreground">
                                {otherPerson.title} · {otherPerson.organization}
                              </p>
                              {rel.evidence.slice(0, 1).map((ev, j) => (
                                <div key={j} className="mt-1 rounded bg-muted/50 p-1.5">
                                  <p className="text-[9px] italic text-muted-foreground line-clamp-2">
                                    &ldquo;{ev.snippet}&rdquo;
                                  </p>
                                  <p className="mt-0.5 text-[8px] text-muted-foreground">
                                    — {ev.channelName} · {ev.date}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：提及统计和提及列表 */}
          <div className="col-span-12 space-y-3 lg:col-span-5">
            {/* 提及统计 */}
            <Card>
              <CardContent className="p-2">
                <h2 className="mb-1.5 font-serif text-xs font-semibold">提及分析</h2>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded border border-border p-1.5 text-center">
                    <div className="text-base font-bold text-green-600">{sentimentCounts.positive}</div>
                    <div className="text-[9px] text-muted-foreground">正面</div>
                  </div>
                  <div className="rounded border border-border p-1.5 text-center">
                    <div className="text-base font-bold text-gray-600">{sentimentCounts.neutral}</div>
                    <div className="text-[9px] text-muted-foreground">中性</div>
                  </div>
                  <div className="rounded border border-border p-1.5 text-center">
                    <div className="text-base font-bold text-red-600">{sentimentCounts.negative}</div>
                    <div className="text-[9px] text-muted-foreground">负面</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>首次：{person.firstMentioned}</span>
                  <span>·</span>
                  <span>最近：{person.lastMentioned}</span>
                </div>
              </CardContent>
            </Card>

            {/* 提及列表 */}
            <Card>
              <CardContent className="p-2">
                <h2 className="mb-1.5 font-serif text-xs font-semibold">内容提及</h2>
                <div className="space-y-1.5">
                  {mentions.map((mention) => (
                    <div
                      key={mention.id}
                      className="rounded border border-border p-1.5 transition-colors hover:border-foreground/50"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <h3 className="text-[10px] font-medium truncate">{mention.contentTitle}</h3>
                          <p className="text-[9px] text-muted-foreground">
                            {mention.channelName} · {mention.date}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 h-3.5 text-[8px] ${sentimentLabels[mention.sentiment].class}`}
                        >
                          {sentimentLabels[mention.sentiment].text}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground line-clamp-2">
                        {mention.snippet}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {mention.topics.slice(0, 3).map((topic) => (
                          <Badge
                            key={topic}
                            variant="outline"
                            className="h-3 rounded px-0.5 text-[7px] font-normal"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {mentions.length === 0 && (
                  <p className="py-3 text-center text-[10px] text-muted-foreground">
                    暂无提及记录
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 相关话题 */}
            <Card>
              <CardContent className="p-2">
                <h2 className="mb-1.5 font-serif text-xs font-semibold">相关话题</h2>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(mentions.flatMap(m => m.topics))).map((topic) => (
                    <Link
                      key={topic}
                      href={`/search?q=${encodeURIComponent(topic)}`}
                      className="flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[9px] transition-colors hover:border-foreground hover:bg-muted"
                    >
                      {topic}
                      <ExternalLink className="h-2 w-2 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
