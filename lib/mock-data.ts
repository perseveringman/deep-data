// ========== 内容条目数据 ==========
export interface ContentItem {
  id: string
  type: 'youtube' | 'podcast'
  title: string
  channelId: string
  channelName: string
  channelAvatar?: string
  publishedAt: string
  duration: string
  durationSeconds: number
  viewCount?: number
  likeCount?: number
  coverUrl?: string
  videoUrl?: string
  audioUrl?: string
  tags: string[]
  summary: string
  hasTranscript: boolean
  contentFile: string // markdown 文件路径
}

export interface TranscriptSegment {
  speaker?: string
  startMs: number
  text: string
}

export const contentItems: ContentItem[] = [
  {
    id: 'content-yt-1',
    type: 'youtube',
    title: '@Asianometry & Dylan Patel — How the semiconductor industry actually works',
    channelId: 'ch-dwarkesh',
    channelName: 'Dwarkesh Patel',
    publishedAt: '2024-10-02',
    duration: '2:10:53',
    durationSeconds: 7853,
    viewCount: 352017,
    likeCount: 7954,
    videoUrl: 'https://www.youtube.com/watch?v=pE3KKUKXcTM',
    coverUrl: 'https://i.ytimg.com/vi/pE3KKUKXcTM/maxresdefault.jpg',
    tags: ['芯片', 'AI', '半导体', '中国', '台湾'],
    summary: 'Dylan Patel（SemiAnalysis）和 Jon Y（Asianometry）深入讨论半导体行业的运作方式，包括台积电与三星的竞争、中国芯片产业的挑战、AI 对芯片需求的影响等。',
    hasTranscript: true,
    contentFile: '/content/youtube-semiconductor.md'
  },
  {
    id: 'content-pod-1',
    type: 'podcast',
    title: '【Agent发展史】从 Prompt 到 Context 再到 Harness，六层架构 + Claude 实战案例',
    channelId: 'ch-lujing',
    channelName: '人工智能AI课堂-卢菁博士',
    publishedAt: '2026-04-13',
    duration: '28:00',
    durationSeconds: 1680,
    audioUrl: 'https://www.youtube.com/watch?v=UPGxDxY7fpw',
    coverUrl: 'https://i.ytimg.com/vi/UPGxDxY7fpw/default.jpg',
    tags: ['Agent', 'Prompt Engineering', 'Claude', 'RAG', 'AI'],
    summary: 'Agent 技术的发展演进历经提示词工程、上下文工程与 Harness 工程三个核心阶段，标志着智能体从单纯的指令理解向系统化、稳定化运行的范式转变。',
    hasTranscript: true,
    contentFile: '/content/podcast-agent.md'
  },
  {
    id: 'content-yt-2',
    type: 'youtube',
    title: 'The Future of AI Infrastructure',
    channelId: 'ch-3',
    channelName: 'Lex Fridman Podcast',
    publishedAt: '2024-01-10',
    duration: '3:15:42',
    durationSeconds: 11742,
    viewCount: 1250000,
    likeCount: 45000,
    videoUrl: 'https://www.youtube.com/watch?v=example2',
    coverUrl: 'https://i.ytimg.com/vi/example2/maxresdefault.jpg',
    tags: ['AI', 'Infrastructure', 'Data Center'],
    summary: '深入探讨 AI 基础设施的未来发展，包括数据中心、能源需求、芯片供应链等关键议题。',
    hasTranscript: true,
    contentFile: '/content/youtube-semiconductor.md'
  },
  {
    id: 'content-pod-2',
    type: 'podcast',
    title: '创业者如何理解 AI Agent 机会',
    channelId: 'ch-5',
    channelName: '商业就是这样',
    publishedAt: '2024-01-08',
    duration: '45:30',
    durationSeconds: 2730,
    audioUrl: 'https://example.com/podcast2.mp3',
    coverUrl: 'https://example.com/cover2.jpg',
    tags: ['创业', 'AI', 'Agent'],
    summary: '从创业者视角分析 AI Agent 带来的商业机会，探讨如何在这波浪潮中找到切入点。',
    hasTranscript: true,
    contentFile: '/content/podcast-agent.md'
  }
]

export const getContentById = (id: string): ContentItem | null => {
  return contentItems.find(c => c.id === id) || null
}

export const getContentByType = (type: 'youtube' | 'podcast'): ContentItem[] => {
  return contentItems.filter(c => c.type === type)
}

// ========== 分级标签系统 ==========
export interface Tag {
  id: string
  name: string
  slug: string
  level: 1 | 2  // 1=一级大类, 2=二级细分
  parentId?: string  // 二级标签的父级ID
  color: string  // 标签颜色
  description: string
  contentCount: number  // 关联内容数量
  channelCount: number  // 关联频道数量
  personCount: number   // 关联人物数量
  trending: 'up' | 'down' | 'stable'
  lastUpdated: string
}

export interface TagRelation {
  tagId: string
  entityType: 'channel' | 'content' | 'person' | 'opinion' | 'report'
  entityId: string
}

// 一级标签（大类）
export const level1Tags: Tag[] = [
  {
    id: 'tag-ai',
    name: 'AI',
    slug: 'ai',
    level: 1,
    color: '#2563eb',
    description: '人工智能相关技术、产品、公司与趋势',
    contentCount: 456,
    channelCount: 6,
    personCount: 8,
    trending: 'up',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'tag-startup',
    name: '创业',
    slug: 'startup',
    level: 1,
    color: '#16a34a',
    description: '创业公司、融资、商业模式与创业方法论',
    contentCount: 234,
    channelCount: 5,
    personCount: 4,
    trending: 'stable',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'tag-tech',
    name: '科技',
    slug: 'tech',
    level: 1,
    color: '#9333ea',
    description: '硬件、软件、互联网与前沿科技',
    contentCount: 389,
    channelCount: 6,
    personCount: 6,
    trending: 'up',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'tag-investment',
    name: '投资',
    slug: 'investment',
    level: 1,
    color: '#ea580c',
    description: '风险投资、股市、投资策略与市场分析',
    contentCount: 178,
    channelCount: 4,
    personCount: 3,
    trending: 'down',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'tag-business',
    name: '商业',
    slug: 'business',
    level: 1,
    color: '#0891b2',
    description: '商业模式、企业管理、市场营销与商业案例',
    contentCount: 267,
    channelCount: 5,
    personCount: 5,
    trending: 'stable',
    lastUpdated: '2024-01-15'
  }
]

// 二级标签（持续跟踪的细分领域）
export const level2Tags: Tag[] = [
  // AI 子标签
  {
    id: 'tag-llm',
    name: 'LLM',
    slug: 'llm',
    level: 2,
    parentId: 'tag-ai',
    color: '#3b82f6',
    description: '大语言模型技术、产品与应用',
    contentCount: 189,
    channelCount: 5,
    personCount: 6,
    trending: 'up',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'tag-rag',
    name: 'RAG',
    slug: 'rag',
    level: 2,
    parentId: 'tag-ai',
    color: '#60a5fa',
    description: '检索增强生成技术与知识库应用',
    contentCount: 67,
    channelCount: 4,
    personCount: 3,
    trending: 'up',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'tag-agent',
    name: 'Agent',
    slug: 'agent',
    level: 2,
    parentId: 'tag-ai',
    color: '#93c5fd',
    description: 'AI Agent、自动化工作流与智能助手',
    contentCount: 82,
    channelCount: 4,
    personCount: 4,
    trending: 'up',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'tag-multimodal',
    name: '多模态',
    slug: 'multimodal',
    level: 2,
    parentId: 'tag-ai',
    color: '#2563eb',
    description: '多模态模型、视觉语言模型与跨模态应用',
    contentCount: 58,
    channelCount: 3,
    personCount: 3,
    trending: 'up',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'tag-ai-safety',
    name: 'AI 安全',
    slug: 'ai-safety',
    level: 2,
    parentId: 'tag-ai',
    color: '#1d4ed8',
    description: 'AI 安全、对齐问题与风险治理',
    contentCount: 45,
    channelCount: 3,
    personCount: 4,
    trending: 'stable',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'tag-agi',
    name: 'AGI',
    slug: 'agi',
    level: 2,
    parentId: 'tag-ai',
    color: '#1e40af',
    description: '通用人工智能研究与展望',
    contentCount: 38,
    channelCount: 4,
    personCount: 5,
    trending: 'up',
    lastUpdated: '2024-01-15'
  },
  // 创业子标签
  {
    id: 'tag-funding',
    name: '融资',
    slug: 'funding',
    level: 2,
    parentId: 'tag-startup',
    color: '#22c55e',
    description: '种子轮、A轮、B轮及各类融资事件',
    contentCount: 89,
    channelCount: 4,
    personCount: 2,
    trending: 'down',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'tag-growth',
    name: '增长',
    slug: 'growth',
    level: 2,
    parentId: 'tag-startup',
    color: '#4ade80',
    description: '用户增长、PMF、增长策略与运营',
    contentCount: 56,
    channelCount: 3,
    personCount: 2,
    trending: 'stable',
    lastUpdated: '2024-01-13'
  },
  {
    id: 'tag-founder',
    name: '创始人',
    slug: 'founder',
    level: 2,
    parentId: 'tag-startup',
    color: '#86efac',
    description: '创始人故事、创业经验与领导力',
    contentCount: 78,
    channelCount: 4,
    personCount: 6,
    trending: 'stable',
    lastUpdated: '2024-01-15'
  },
  // 科技子标签
  {
    id: 'tag-chip',
    name: '芯片',
    slug: 'chip',
    level: 2,
    parentId: 'tag-tech',
    color: '#a855f7',
    description: '半导体、GPU、芯片设计与制造',
    contentCount: 98,
    channelCount: 4,
    personCount: 3,
    trending: 'up',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'tag-ev',
    name: '电动车',
    slug: 'ev',
    level: 2,
    parentId: 'tag-tech',
    color: '#c084fc',
    description: '电动汽车、电池技术与智能驾驶',
    contentCount: 72,
    channelCount: 3,
    personCount: 2,
    trending: 'stable',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'tag-vr-ar',
    name: 'VR/AR',
    slug: 'vr-ar',
    level: 2,
    parentId: 'tag-tech',
    color: '#d8b4fe',
    description: '虚拟现实、增强现实与空间计算',
    contentCount: 54,
    channelCount: 3,
    personCount: 2,
    trending: 'down',
    lastUpdated: '2024-01-12'
  },
  {
    id: 'tag-quantum',
    name: '量子计算',
    slug: 'quantum',
    level: 2,
    parentId: 'tag-tech',
    color: '#7c3aed',
    description: '量子计算机、量子算法与应用前景',
    contentCount: 34,
    channelCount: 2,
    personCount: 2,
    trending: 'up',
    lastUpdated: '2024-01-13'
  },
  // 投资子标签
  {
    id: 'tag-vc',
    name: 'VC',
    slug: 'vc',
    level: 2,
    parentId: 'tag-investment',
    color: '#f97316',
    description: '风险投资、投资机构与投资逻辑',
    contentCount: 67,
    channelCount: 3,
    personCount: 2,
    trending: 'stable',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'tag-valuation',
    name: '估值',
    slug: 'valuation',
    level: 2,
    parentId: 'tag-investment',
    color: '#fb923c',
    description: '公司估值、泡沫分析与价值判断',
    contentCount: 45,
    channelCount: 3,
    personCount: 2,
    trending: 'down',
    lastUpdated: '2024-01-13'
  },
  // 商业子标签
  {
    id: 'tag-strategy',
    name: '战略',
    slug: 'strategy',
    level: 2,
    parentId: 'tag-business',
    color: '#06b6d4',
    description: '企业战略、竞争策略与商业决策',
    contentCount: 89,
    channelCount: 4,
    personCount: 3,
    trending: 'stable',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'tag-case-study',
    name: '案例分析',
    slug: 'case-study',
    level: 2,
    parentId: 'tag-business',
    color: '#22d3ee',
    description: '公司案例、成功与失败的商业故事',
    contentCount: 112,
    channelCount: 5,
    personCount: 4,
    trending: 'up',
    lastUpdated: '2024-01-15'
  }
]

// 合并所有标签
export const allTags: Tag[] = [...level1Tags, ...level2Tags]

// 获取标签详情
export const getTagById = (id: string): Tag | null => {
  return allTags.find(t => t.id === id) || null
}

// 获取标签的子标签
export const getChildTags = (parentId: string): Tag[] => {
  return level2Tags.filter(t => t.parentId === parentId)
}

// 获取标签的父标签
export const getParentTag = (tagId: string): Tag | null => {
  const tag = allTags.find(t => t.id === tagId)
  if (!tag || !tag.parentId) return null
  return allTags.find(t => t.id === tag.parentId) || null
}

// 根据 slug 获取标签
export const getTagBySlug = (slug: string): Tag | null => {
  return allTags.find(t => t.slug === slug) || null
}

// 标签关联的内容
export interface TaggedContent {
  id: string
  type: 'video' | 'podcast' | 'opinion' | 'report'
  title: string
  channelId: string
  channelName: string
  date: string
  snippet: string
  tags: string[] // tag ids
}

export const getContentByTag = (tagId: string): TaggedContent[] => {
  // Mock data - 实际应从数据库查询
  const tag = getTagById(tagId)
  if (!tag) return []
  
  const mockContent: TaggedContent[] = [
    {
      id: 'tc-1',
      type: 'video',
      title: 'GPT-5 将如何改变科技行业',
      channelId: 'ch-1',
      channelName: '硅谷王川',
      date: '2024-01-15',
      snippet: '深度解析 GPT-5 的技术突破与行业影响...',
      tags: ['tag-ai', 'tag-llm', 'tag-agi']
    },
    {
      id: 'tc-2',
      type: 'podcast',
      title: 'RAG 技术深度解析：从原理到实践',
      channelId: 'ch-3',
      channelName: 'Lex Fridman Podcast',
      date: '2024-01-14',
      snippet: '探讨检索增强生成技术的最新进展...',
      tags: ['tag-ai', 'tag-rag', 'tag-llm']
    },
    {
      id: 'tc-3',
      type: 'video',
      title: 'AI Agent 开发实战指南',
      channelId: 'ch-6',
      channelName: 'Y Combinator',
      date: '2024-01-13',
      snippet: '如何构建可靠的 AI Agent 应用...',
      tags: ['tag-ai', 'tag-agent', 'tag-startup']
    },
    {
      id: 'tc-4',
      type: 'opinion',
      title: 'AGI 不会很快到来',
      channelId: 'ch-3',
      channelName: 'Lex Fridman Podcast',
      date: '2024-01-14',
      snippet: 'Yann LeCun 认为当前 LLM 缺乏真正的推理能力...',
      tags: ['tag-ai', 'tag-agi', 'tag-llm', 'tag-ai-safety']
    },
    {
      id: 'tc-5',
      type: 'video',
      title: '英伟达市值超越谷歌的背后逻辑',
      channelId: 'ch-5',
      channelName: '商业就是这样',
      date: '2024-01-08',
      snippet: 'AI 芯片需求推动英伟达市值飙升...',
      tags: ['tag-tech', 'tag-chip', 'tag-ai', 'tag-investment']
    },
    {
      id: 'tc-6',
      type: 'report',
      title: '2024 年 AI 创业融资报告',
      channelId: 'ch-6',
      channelName: 'Y Combinator',
      date: '2024-01-10',
      snippet: 'AI 领域融资趋势与投资热点分析...',
      tags: ['tag-ai', 'tag-startup', 'tag-funding', 'tag-vc']
    }
  ]
  
  // 过滤出包含当前标签的内容
  return mockContent.filter(c => c.tags.includes(tagId))
}

// 获取标签趋势数据
export const getTagTrend = (tagId: string): { date: string; count: number }[] => {
  // Mock 趋势数据
  return [
    { date: '2024-01-01', count: Math.floor(Math.random() * 20) + 10 },
    { date: '2024-01-02', count: Math.floor(Math.random() * 20) + 12 },
    { date: '2024-01-03', count: Math.floor(Math.random() * 20) + 15 },
    { date: '2024-01-04', count: Math.floor(Math.random() * 20) + 18 },
    { date: '2024-01-05', count: Math.floor(Math.random() * 20) + 20 },
    { date: '2024-01-06', count: Math.floor(Math.random() * 20) + 22 },
    { date: '2024-01-07', count: Math.floor(Math.random() * 20) + 25 },
    { date: '2024-01-08', count: Math.floor(Math.random() * 20) + 28 },
    { date: '2024-01-09', count: Math.floor(Math.random() * 20) + 30 },
    { date: '2024-01-10', count: Math.floor(Math.random() * 20) + 32 },
    { date: '2024-01-11', count: Math.floor(Math.random() * 20) + 35 },
    { date: '2024-01-12', count: Math.floor(Math.random() * 20) + 38 },
    { date: '2024-01-13', count: Math.floor(Math.random() * 20) + 40 },
    { date: '2024-01-14', count: Math.floor(Math.random() * 20) + 42 },
    { date: '2024-01-15', count: Math.floor(Math.random() * 20) + 45 },
  ]
}

// ========== 内容源/频道数据 ==========
// 内容源/频道数据
export interface Channel {
  id: string
  name: string
  platform: 'youtube' | 'podcast'
  avatarUrl: string
  subscriberCount: number
  videoCount: number
  lastUpdated: string
  description: string
  tags: string[]
}

export const channels: Channel[] = [
  {
    id: 'ch-1',
    name: '硅谷王川',
    platform: 'youtube',
    avatarUrl: '/avatars/channel-1.jpg',
    subscriberCount: 125000,
    videoCount: 342,
    lastUpdated: '2024-01-15',
    description: '深度解析硅谷科技趋势，投资逻辑与创业洞察',
    tags: ['科技', '投资', '创业']
  },
  {
    id: 'ch-2',
    name: '得到·逻辑思维',
    platform: 'podcast',
    avatarUrl: '/avatars/channel-2.jpg',
    subscriberCount: 890000,
    videoCount: 1024,
    lastUpdated: '2024-01-14',
    description: '罗振宇的知识分享节目，每天一条知识',
    tags: ['知识', '商业', '思维']
  },
  {
    id: 'ch-3',
    name: 'Lex Fridman Podcast',
    platform: 'podcast',
    avatarUrl: '/avatars/channel-3.jpg',
    subscriberCount: 3200000,
    videoCount: 420,
    lastUpdated: '2024-01-15',
    description: 'Conversations about AI, science, technology, history, philosophy and nature of intelligence',
    tags: ['AI', 'Science', 'Philosophy']
  },
  {
    id: 'ch-4',
    name: '李永乐老师',
    platform: 'youtube',
    avatarUrl: '/avatars/channel-4.jpg',
    subscriberCount: 2100000,
    videoCount: 680,
    lastUpdated: '2024-01-13',
    description: '用通俗易懂的方式讲解科学知识',
    tags: ['科普', '教育', '物理']
  },
  {
    id: 'ch-5',
    name: '商业就是这样',
    platform: 'podcast',
    avatarUrl: '/avatars/channel-5.jpg',
    subscriberCount: 450000,
    videoCount: 256,
    lastUpdated: '2024-01-15',
    description: '聊聊商业世界里的有趣故事',
    tags: ['商业', '创业', '科技']
  },
  {
    id: 'ch-6',
    name: 'Y Combinator',
    platform: 'youtube',
    avatarUrl: '/avatars/channel-6.jpg',
    subscriberCount: 1500000,
    videoCount: 890,
    lastUpdated: '2024-01-14',
    description: 'Startup advice and founder stories from Y Combinator',
    tags: ['Startup', 'VC', 'Tech']
  }
]

// 话题趋势数据
export interface TopicTrend {
  topic: string
  data: { date: string; mentions: number }[]
}

export const topicTrends: TopicTrend[] = [
  {
    topic: 'AI 大模型',
    data: [
      { date: '2024-01-01', mentions: 12 },
      { date: '2024-01-02', mentions: 18 },
      { date: '2024-01-03', mentions: 15 },
      { date: '2024-01-04', mentions: 22 },
      { date: '2024-01-05', mentions: 28 },
      { date: '2024-01-06', mentions: 35 },
      { date: '2024-01-07', mentions: 42 },
      { date: '2024-01-08', mentions: 38 },
      { date: '2024-01-09', mentions: 45 },
      { date: '2024-01-10', mentions: 52 },
      { date: '2024-01-11', mentions: 48 },
      { date: '2024-01-12', mentions: 55 },
      { date: '2024-01-13', mentions: 62 },
      { date: '2024-01-14', mentions: 58 },
      { date: '2024-01-15', mentions: 65 },
    ]
  },
  {
    topic: '创业融资',
    data: [
      { date: '2024-01-01', mentions: 8 },
      { date: '2024-01-02', mentions: 12 },
      { date: '2024-01-03', mentions: 10 },
      { date: '2024-01-04', mentions: 15 },
      { date: '2024-01-05', mentions: 18 },
      { date: '2024-01-06', mentions: 14 },
      { date: '2024-01-07', mentions: 20 },
      { date: '2024-01-08', mentions: 22 },
      { date: '2024-01-09', mentions: 25 },
      { date: '2024-01-10', mentions: 28 },
      { date: '2024-01-11', mentions: 24 },
      { date: '2024-01-12', mentions: 30 },
      { date: '2024-01-13', mentions: 32 },
      { date: '2024-01-14', mentions: 28 },
      { date: '2024-01-15', mentions: 35 },
    ]
  },
  {
    topic: '量子计算',
    data: [
      { date: '2024-01-01', mentions: 3 },
      { date: '2024-01-02', mentions: 5 },
      { date: '2024-01-03', mentions: 4 },
      { date: '2024-01-04', mentions: 8 },
      { date: '2024-01-05', mentions: 12 },
      { date: '2024-01-06', mentions: 10 },
      { date: '2024-01-07', mentions: 15 },
      { date: '2024-01-08', mentions: 18 },
      { date: '2024-01-09', mentions: 14 },
      { date: '2024-01-10', mentions: 20 },
      { date: '2024-01-11', mentions: 22 },
      { date: '2024-01-12', mentions: 18 },
      { date: '2024-01-13', mentions: 25 },
      { date: '2024-01-14', mentions: 28 },
      { date: '2024-01-15', mentions: 24 },
    ]
  }
]

// 关键词数据
export interface Keyword {
  word: string
  weight: number
  trend: 'up' | 'down' | 'stable'
}

export const keywords: Keyword[] = [
  { word: 'GPT-5', weight: 100, trend: 'up' },
  { word: '多模态', weight: 88, trend: 'up' },
  { word: 'Agent', weight: 82, trend: 'up' },
  { word: '估值泡沫', weight: 75, trend: 'down' },
  { word: 'RAG', weight: 72, trend: 'stable' },
  { word: '芯片战争', weight: 68, trend: 'up' },
  { word: '开源模型', weight: 65, trend: 'up' },
  { word: '降本增效', weight: 62, trend: 'stable' },
  { word: 'Sora', weight: 58, trend: 'up' },
  { word: '苹果Vision Pro', weight: 55, trend: 'down' },
  { word: '自动驾驶', weight: 52, trend: 'stable' },
  { word: '人形机器人', weight: 48, trend: 'up' },
  { word: 'Web3', weight: 42, trend: 'down' },
  { word: '元宇宙', weight: 35, trend: 'down' },
  { word: '碳中和', weight: 32, trend: 'stable' },
]

// 观点数据
export interface Opinion {
  id: string
  channelId: string
  channelName: string
  content: string
  topic: string
  sentiment: 'positive' | 'negative' | 'neutral'
  timestamp: string
  videoTitle: string
}

export const opinions: Opinion[] = [
  {
    id: 'op-1',
    channelId: 'ch-1',
    channelName: '硅谷王川',
    content: 'GPT-5 的发布将彻底改变软件开发的方式，未来三年内，80%的代码将由 AI 生成。这不是威胁，而是程序员升级的机会。',
    topic: 'AI 大模型',
    sentiment: 'positive',
    timestamp: '2024-01-15T10:30:00Z',
    videoTitle: 'GPT-5 将如何改变科技行业'
  },
  {
    id: 'op-2',
    channelId: 'ch-3',
    channelName: 'Lex Fridman Podcast',
    content: 'AGI is not around the corner. We are still missing fundamental understanding of how intelligence works. Current LLMs are impressive but they lack true reasoning.',
    topic: 'AI 大模型',
    sentiment: 'neutral',
    timestamp: '2024-01-14T15:00:00Z',
    videoTitle: 'Interview with Yann LeCun'
  },
  {
    id: 'op-3',
    channelId: 'ch-2',
    channelName: '得到·逻辑思维',
    content: '现在市场上 90% 的 AI 创业公司都会在两年内消失。真正能活下来的，是那些找到真实场景、解决真实痛点的公司。',
    topic: '创业融资',
    sentiment: 'negative',
    timestamp: '2024-01-13T08:00:00Z',
    videoTitle: 'AI 创业的冷思考'
  },
  {
    id: 'op-4',
    channelId: 'ch-6',
    channelName: 'Y Combinator',
    content: 'The best time to start an AI company was 2 years ago. The second best time is now. But focus on solving real problems, not building another chatbot wrapper.',
    topic: '创业融资',
    sentiment: 'positive',
    timestamp: '2024-01-12T12:00:00Z',
    videoTitle: 'AI Startup Playbook 2024'
  },
  {
    id: 'op-5',
    channelId: 'ch-4',
    channelName: '李永乐老师',
    content: '量子计算真正能够商业化应用，可能还需要10-15年。目前的量子比特数量和纠错能力都还远��不够。',
    topic: '量子计算',
    sentiment: 'neutral',
    timestamp: '2024-01-11T09:30:00Z',
    videoTitle: '量子计算到底是什么'
  },
  {
    id: 'op-6',
    channelId: 'ch-5',
    channelName: '商业就是这样',
    content: '中国的芯片自主化进程比预期要快。虽然最先进制程还有差距，但成熟制程已经能够满足大部分需求。',
    topic: '芯片战争',
    sentiment: 'positive',
    timestamp: '2024-01-10T14:00:00Z',
    videoTitle: '芯片战争两周年回顾'
  }
]

// 频道详情数据
export interface ChannelDetail extends Channel {
  topics: { name: string; count: number }[]
  recentVideos: {
    id: string
    title: string
    publishedAt: string
    views: number
    duration: string
    topics: string[]
  }[]
  engagementData: { date: string; views: number; likes: number; comments: number }[]
}

export const getChannelDetail = (id: string): ChannelDetail | null => {
  const channel = channels.find(c => c.id === id)
  if (!channel) return null
  
  return {
    ...channel,
    topics: [
      { name: 'AI 大模型', count: 45 },
      { name: '创业投资', count: 32 },
      { name: '芯片半导体', count: 28 },
      { name: '科技趋势', count: 25 },
      { name: '产品设计', count: 18 },
    ],
    recentVideos: [
      {
        id: 'v-1',
        title: 'GPT-5 发布会深度解读：这次真的不一样',
        publishedAt: '2024-01-15',
        views: 125000,
        duration: '32:15',
        topics: ['AI 大模型', 'GPT-5']
      },
      {
        id: 'v-2',
        title: '2024 年 AI 创业还有机会吗？硅谷一线观察',
        publishedAt: '2024-01-12',
        views: 98000,
        duration: '28:42',
        topics: ['创业融资', 'AI']
      },
      {
        id: 'v-3',
        title: 'Apple Vision Pro 体验两周：失望与惊喜',
        publishedAt: '2024-01-08',
        views: 156000,
        duration: '45:20',
        topics: ['苹果', 'VR/AR']
      },
      {
        id: 'v-4',
        title: '英伟达市值超越谷歌的背后逻辑',
        publishedAt: '2024-01-05',
        views: 112000,
        duration: '25:30',
        topics: ['芯片', '投资']
      },
      {
        id: 'v-5',
        title: '深度对话：一位 AI 创业者的真实困境',
        publishedAt: '2024-01-02',
        views: 87000,
        duration: '52:10',
        topics: ['创业', 'AI', '访谈']
      },
    ],
    engagementData: [
      { date: '2024-01-01', views: 45000, likes: 3200, comments: 450 },
      { date: '2024-01-02', views: 52000, likes: 3800, comments: 520 },
      { date: '2024-01-03', views: 48000, likes: 3500, comments: 480 },
      { date: '2024-01-04', views: 61000, likes: 4200, comments: 580 },
      { date: '2024-01-05', views: 58000, likes: 4000, comments: 540 },
      { date: '2024-01-06', views: 42000, likes: 3000, comments: 380 },
      { date: '2024-01-07', views: 38000, likes: 2800, comments: 320 },
      { date: '2024-01-08', views: 75000, likes: 5200, comments: 720 },
      { date: '2024-01-09', views: 68000, likes: 4800, comments: 650 },
      { date: '2024-01-10', views: 62000, likes: 4400, comments: 580 },
      { date: '2024-01-11', views: 55000, likes: 3900, comments: 510 },
      { date: '2024-01-12', views: 72000, likes: 5000, comments: 680 },
      { date: '2024-01-13', views: 48000, likes: 3400, comments: 420 },
      { date: '2024-01-14', views: 52000, likes: 3700, comments: 480 },
      { date: '2024-01-15', views: 85000, likes: 6000, comments: 820 },
    ]
  }
}

// 日报数据
export interface DailyReport {
  date: string
  summary: string
  highlights: string[]
  newContentCount: number
  hotTopics: { topic: string; change: number }[]
  channelHighlights: { channelId: string; channelName: string; highlight: string }[]
  anomalies: string[]
}

export const dailyReports: DailyReport[] = [
  {
    date: '2024-01-15',
    summary: '今日 AI 领域热度持续攀升，GPT-5 相关讨论占据主导。多位创作者对 AI Agent 的发展前景发表看法，整体情绪偏乐观。',
    highlights: [
      'GPT-5 相关内容创历史新高，单日提及 65 次',
      '硅谷王川发布重磅解读视频，播放量破 12 万',
      'AI Agent 话题热度环比上涨 35%'
    ],
    newContentCount: 18,
    hotTopics: [
      { topic: 'GPT-5', change: 45 },
      { topic: 'AI Agent', change: 35 },
      { topic: '创业融资', change: 15 },
      { topic: '芯片战争', change: -8 }
    ],
    channelHighlights: [
      { channelId: 'ch-1', channelName: '硅谷王川', highlight: '发布 GPT-5 深度解读，引发大量讨论' },
      { channelId: 'ch-6', channelName: 'Y Combinator', highlight: '分享 AI 创业最新趋势观察' }
    ],
    anomalies: ['元宇宙话题热度创近半年新低']
  },
  {
    date: '2024-01-14',
    summary: 'Lex Fridman 与 Yann LeCun 的对话引发关于 AGI 时间线的广泛讨论。创业投资话题保持稳定热度。',
    highlights: [
      'Lex Fridman 新访谈播放量突破 200 万',
      '中���创作者对 AGI 时间线看法出现分歧',
      '量子计算话题热度小幅上升'
    ],
    newContentCount: 15,
    hotTopics: [
      { topic: 'AGI', change: 28 },
      { topic: 'AI 安全', change: 22 },
      { topic: '创业融资', change: 5 },
      { topic: 'Vision Pro', change: -15 }
    ],
    channelHighlights: [
      { channelId: 'ch-3', channelName: 'Lex Fridman Podcast', highlight: 'Yann LeCun 访谈引发热议' },
      { channelId: 'ch-2', channelName: '得到·逻辑思维', highlight: '发布 AI 创业冷思考系列' }
    ],
    anomalies: []
  },
  {
    date: '2024-01-13',
    summary: '周末内容更新放缓，但 AI 相关讨论热度不减。多个频道发布对 2024 年科技趋势的预测。',
    highlights: [
      '2024 科技预测类内容集中发布',
      '李永乐老师量子计算科普视频引关注',
      '芯片话题热度持续上升'
    ],
    newContentCount: 12,
    hotTopics: [
      { topic: '2024 预测', change: 40 },
      { topic: '量子计算', change: 18 },
      { topic: '芯片战争', change: 12 },
      { topic: 'Web3', change: -25 }
    ],
    channelHighlights: [
      { channelId: 'ch-4', channelName: '李永乐老师', highlight: '量子计算入门视频播放破百万' },
      { channelId: 'ch-5', channelName: '商业就是这样', highlight: '芯片战争系列收官篇' }
    ],
    anomalies: ['Web3 话题连续第 5 天下滑']
  }
]

// 交叉分析数据 - 话题重合热力图
export interface CrossAnalysisData {
  channels: string[]
  matrix: number[][] // 两两频道之间的话题重合度 (0-100)
}

export const crossAnalysisData: CrossAnalysisData = {
  channels: ['硅谷王川', '得到·逻辑思维', 'Lex Fridman', '李永乐老师', '商业就是这样', 'Y Combinator'],
  matrix: [
    [100, 45, 68, 32, 55, 72],
    [45, 100, 38, 48, 62, 42],
    [68, 38, 100, 28, 35, 58],
    [32, 48, 28, 100, 25, 22],
    [55, 62, 35, 25, 100, 48],
    [72, 42, 58, 22, 48, 100]
  ]
}

// 搜索结果数据
export interface SearchResult {
  id: string
  type: 'channel' | 'topic' | 'keyword' | 'opinion'
  title: string
  snippet: string
  relevance: number
  channelId?: string
  channelName?: string
}

export const searchMockResults: SearchResult[] = [
  {
    id: 'sr-1',
    type: 'topic',
    title: 'AI 大模型',
    snippet: '过去 30 天被提及 456 次，涉及 6 个频道，热度持续上升',
    relevance: 98
  },
  {
    id: 'sr-2',
    type: 'channel',
    title: '硅谷王川',
    snippet: '专注硅谷科技与投资分析，近期重点关注 AI 领域',
    relevance: 92,
    channelId: 'ch-1',
    channelName: '硅谷王川'
  },
  {
    id: 'sr-3',
    type: 'opinion',
    title: 'GPT-5 将彻底改变软件开发',
    snippet: '硅谷王川认为未来三年 80% 代码将由 AI 生成',
    relevance: 88,
    channelId: 'ch-1',
    channelName: '硅��王川'
  },
  {
    id: 'sr-4',
    type: 'keyword',
    title: 'Agent',
    snippet: '近两周热度上升 35%，主要与 AI 自动化相关',
    relevance: 85
  }
]

// 深度报告数据
export interface DeepReport {
  id: string
  title: string
  subtitle: string
  coverImage: string
  category: 'topic-analysis' | 'creator-profile' | 'industry-comparison' | 'trend-tracking'
  tags: string[]
  relatedChannels: string[]
  publishedAt: string
  readingTime: number
  status: 'latest' | 'featured' | 'popular' | 'normal'
  summary: string[]
  methodology: {
    scope: string
    sources: string[]
    timeRange: string
  }
  sections: {
    title: string
    content: string
    charts?: { type: string; data: unknown }[]
    quotes?: { text: string; source: string }[]
  }[]
  conclusions: string[]
  relatedReports: string[]
}

export const deepReports: DeepReport[] = [
  {
    id: 'dr-1',
    title: '2024 年 AI 内容创作趋势报告',
    subtitle: '从 GPT-4 到 GPT-5：创作者如何应对 AI 浪潮',
    coverImage: '/reports/ai-content-2024.jpg',
    category: 'topic-analysis',
    tags: ['AI', '内容创作', '趋势分析'],
    relatedChannels: ['ch-1', 'ch-3', 'ch-6'],
    publishedAt: '2024-01-15',
    readingTime: 15,
    status: 'featured',
    summary: [
      'AI 相关内容在过去 90 天增长 156%，成为所有话题中增长最快的领域',
      '头部创作者开始分化：技术解读派 vs 商业应用派',
      '中文创作者在 AI 工具使用方面的内容产出明显增加',
      '预计 2024 年 AI 将成为 80% 以上科技频道的核心话题'
    ],
    methodology: {
      scope: '分析了 50+ 个科技/商业频道的 2000+ 条内容',
      sources: ['YouTube', 'Podcast', '微信公众号'],
      timeRange: '2023年10月 - 2024年1月'
    },
    sections: [
      {
        title: '一、AI 内容的爆发式增长',
        content: '自 ChatGPT 发布以来，AI 相关内容的产出量呈现指数级增长。在我们监测的 50 个头部频道中，AI 话题的提及频次从 2023 年初的平均每周 45 次，增长到 2024 年初的每周 180 次，增幅达到 300%。',
        quotes: [
          { text: 'AI 不是一个话题，而是这个时代的底层叙事。', source: '硅谷王川' },
          { text: '每个创作者都需要思考如何与 AI 共处。', source: '商业就是这样' }
        ]
      },
      {
        title: '二、创作者生态的分化',
        content: '我们观察到创作者群体正在形成明显的分化：一类专注于技术深度解读，如 Lex Fridman 的长访谈；另一类则聚焦商业应用场景，如得到系列的知识付费内容。两种路线都有各自的受众群体。'
      },
      {
        title: '三、2024 年展望',
        content: '基于当前趋势外推，我们预测 2024 年将出现以下变化：1) AI 工具类内容将大量涌现；2) 垂直领域的 AI 应用解读将成为新增长点；3) AI 伦理与监管话题将获得更多关注。'
      }
    ],
    conclusions: [
      'AI 已从新兴话题演变为内容创作的核心主题',
      '创作者需要建立 AI 知识储备以保持竞争力',
      '差异化定位（技术 vs 应用）是突围关键'
    ],
    relatedReports: ['dr-2', 'dr-4']
  },
  {
    id: 'dr-2',
    title: '科技领域 Top 10 博主内容策略分析',
    subtitle: '解码头部创作者的成功密码',
    coverImage: '/reports/top-creators.jpg',
    category: 'creator-profile',
    tags: ['创作者分析', '内容策略', '增长'],
    relatedChannels: ['ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5', 'ch-6'],
    publishedAt: '2024-01-10',
    readingTime: 20,
    status: 'popular',
    summary: [
      '头部创作者平均每周发布 2.3 条内容，但质量远比数量重要',
      '选题时效性与深度分析的平衡是关键成功因素',
      '跨平台分发策略可提升整体触达率 40-60%',
      '与受众的互动频率与粉丝增长呈正相关'
    ],
    methodology: {
      scope: '深度分析 10 个头部科���/商业频道',
      sources: ['YouTube Analytics', '播客平台数据', '社交媒体'],
      timeRange: '2023年全年'
    },
    sections: [
      {
        title: '一、内容发布策略',
        content: '我们分析的 10 位头部创作者在内容发布频率上存在较大差异，但都遵循一个共同原则：保证每一条内容的质量。硅谷王川平均每周发布 3 条，而 Lex Fridman 平均每周仅 1 条，但两者的单条内容平均播放量都保持在较高水平。'
      },
      {
        title: '二、选题方法论',
        content: '成功的选题需要平衡三个维度：时效性、深度、独特视角。以 GPT-4 发布为例，头部创作者普遍选择延迟 2-3 天发布，以提供更深入的分析，而非追求首发速度。'
      }
    ],
    conclusions: [
      '质量优先于数量是头部创作者的共同选择',
      '建立独特的内容风格比追热点更重要',
      '持续的受众互动是长期增长的基础'
    ],
    relatedReports: ['dr-1', 'dr-3']
  },
  {
    id: 'dr-3',
    title: 'YouTube vs 播客：科技内容生态对比',
    subtitle: '两大平台的内容形态与用户偏好差异',
    coverImage: '/reports/youtube-vs-podcast.jpg',
    category: 'industry-comparison',
    tags: ['平台分析', 'YouTube', '播客'],
    relatedChannels: ['ch-1', 'ch-2', 'ch-3'],
    publishedAt: '2024-01-05',
    readingTime: 12,
    status: 'normal',
    summary: [
      'YouTube 用户更偏好 10-20 分钟的中等时长内容',
      '播客听众对长内容（60分钟+）的接受度更高',
      '视觉呈现对 YouTube 内容的影响权重约为 30%',
      '播客的完播率平均比 YouTube 高 25%'
    ],
    methodology: {
      scope: '对比分析两个平台上的 100+ 个科技频道',
      sources: ['YouTube', 'Apple Podcasts', 'Spotify'],
      timeRange: '2023年下半年'
    },
    sections: [
      {
        title: '一、内容形态差异',
        content: 'YouTube 作为视频平台，对内容的视觉呈现有更高要求。我们的分析显示，配备高质量图表、动画的视频，其平均播放时长比纯口播视频高出 45%。而播客作为纯音频媒介，内容深度和嘉宾质量是更关键的因素。'
      }
    ],
    conclusions: [
      '两个平台服务不同的内容消费场景',
      '跨平台运营需要针对性的内容改编',
      '播客在深度内容领域具有独特优势'
    ],
    relatedReports: ['dr-2']
  },
  {
    id: 'dr-4',
    title: 'GPT-5 发布舆情追踪报告',
    subtitle: '从预热到发布：一周内的舆论演变',
    coverImage: '/reports/gpt5-tracking.jpg',
    category: 'trend-tracking',
    tags: ['GPT-5', '舆情分析', '热点追踪'],
    relatedChannels: ['ch-1', 'ch-3', 'ch-6'],
    publishedAt: '2024-01-14',
    readingTime: 8,
    status: 'latest',
    summary: [
      '发布后 24 小时内产生 200+ 条相关内容',
      '正面情绪占比 65%，中性 28%，负面 7%',
      '中文创作者的反应速度较英文创作者平均慢 6-12 小时',
      '技术细节解读类内容获得最高互动率'
    ],
    methodology: {
      scope: '追踪 GPT-5 相关的所有内容',
      sources: ['全平台监测'],
      timeRange: '2024年1月8日 - 1月14日'
    },
    sections: [
      {
        title: '一、舆论发酵曲线',
        content: '我们将 GPT-5 相关舆论分为四个阶段：预热期（发布前 48 小时）、爆发期（发布后 24 小时）、解读期（发布后 2-4 天）、沉淀期（发布后 5-7 天）。每个阶段的内容形态和情绪特征都有明显差异。'
      }
    ],
    conclusions: [
      '重大发布事件的舆论周期约为一周',
      '差异化解读是获得关注的关键',
      '负面声音主要集中在对现实应用的担忧'
    ],
    relatedReports: ['dr-1']
  }
]

export const getDeepReportDetail = (id: string): DeepReport | null => {
  return deepReports.find(r => r.id === id) || null
}

// 人物数据
export interface Person {
  id: string
  name: string
  title: string // 职位/身份
  organization: string // 所属组织
  avatar: string
  tags: string[] // 标签：领域、特点等
  mentionCount: number // 被提及次数
  firstMentioned: string // 首次被提及日期
  lastMentioned: string // 最近被提及日期
  description: string // 简介
}

export interface PersonRelation {
  sourceId: string
  targetId: string
  relationType: 'colleague' | 'competitor' | 'mentor' | 'collaborator' | 'critic' | 'supporter'
  strength: number // 关系强度 1-100
  evidence: {
    contentId: string
    channelName: string
    snippet: string
    date: string
  }[]
}

export interface PersonMention {
  id: string
  personId: string
  channelId: string
  channelName: string
  contentTitle: string
  snippet: string // 提及的上下文
  sentiment: 'positive' | 'negative' | 'neutral'
  date: string
  topics: string[]
}

export const persons: Person[] = [
  {
    id: 'p-1',
    name: 'Sam Altman',
    title: 'CEO',
    organization: 'OpenAI',
    avatar: '/avatars/sam-altman.jpg',
    tags: ['AI', 'AGI', '创业', '投资'],
    mentionCount: 156,
    firstMentioned: '2023-01-15',
    lastMentioned: '2024-01-15',
    description: 'OpenAI CEO，GPT 系列产品的主要推动者，Y Combinator 前总裁'
  },
  {
    id: 'p-2',
    name: 'Elon Musk',
    title: 'CEO',
    organization: 'Tesla / SpaceX / xAI',
    avatar: '/avatars/elon-musk.jpg',
    tags: ['AI', '电动车', '太空', '社交媒体'],
    mentionCount: 203,
    firstMentioned: '2023-01-01',
    lastMentioned: '2024-01-14',
    description: '连续创业者，特斯拉、SpaceX、xAI 创始人，OpenAI 早期投资人'
  },
  {
    id: 'p-3',
    name: 'Jensen Huang',
    title: 'CEO',
    organization: 'NVIDIA',
    avatar: '/avatars/jensen-huang.jpg',
    tags: ['芯片', 'AI', 'GPU', '硬件'],
    mentionCount: 89,
    firstMentioned: '2023-02-10',
    lastMentioned: '2024-01-12',
    description: '英伟达创始人兼 CEO，AI 芯片领域的关键人物'
  },
  {
    id: 'p-4',
    name: 'Yann LeCun',
    title: 'Chief AI Scientist',
    organization: 'Meta',
    avatar: '/avatars/yann-lecun.jpg',
    tags: ['AI', '深度学习', '学术', 'AGI'],
    mentionCount: 67,
    firstMentioned: '2023-03-20',
    lastMentioned: '2024-01-14',
    description: '图灵奖得主，深度学习三巨头之一，Meta 首席 AI 科学家'
  },
  {
    id: 'p-5',
    name: 'Demis Hassabis',
    title: 'CEO',
    organization: 'Google DeepMind',
    avatar: '/avatars/demis-hassabis.jpg',
    tags: ['AI', 'AGI', 'AlphaGo', '科研'],
    mentionCount: 52,
    firstMentioned: '2023-04-05',
    lastMentioned: '2024-01-10',
    description: 'Google DeepMind CEO，AlphaGo 之父，诺贝尔化学奖得主'
  },
  {
    id: 'p-6',
    name: 'Satya Nadella',
    title: 'CEO',
    organization: 'Microsoft',
    avatar: '/avatars/satya-nadella.jpg',
    tags: ['AI', '云计算', '企业软件', '投资'],
    mentionCount: 78,
    firstMentioned: '2023-01-20',
    lastMentioned: '2024-01-13',
    description: '微软 CEO，主导了微软对 OpenAI 的投资和 AI 战略转型'
  },
  {
    id: 'p-7',
    name: 'Dario Amodei',
    title: 'CEO',
    organization: 'Anthropic',
    avatar: '/avatars/dario-amodei.jpg',
    tags: ['AI', 'AI安全', 'Claude', '创业'],
    mentionCount: 45,
    firstMentioned: '2023-05-15',
    lastMentioned: '2024-01-11',
    description: 'Anthropic CEO��前 OpenAI 研究副总裁，Claude 的创造者'
  },
  {
    id: 'p-8',
    name: '李开复',
    title: 'CEO',
    organization: '零一万物',
    avatar: '/avatars/kai-fu-lee.jpg',
    tags: ['AI', '创业', '投资', '中国科技'],
    mentionCount: 62,
    firstMentioned: '2023-02-01',
    lastMentioned: '2024-01-09',
    description: '零一万物创始人，创新工场董事长，前微软、Google 高管'
  },
  {
    id: 'p-9',
    name: '黄仁勋',
    title: 'CEO',
    organization: 'NVIDIA',
    avatar: '/avatars/jensen-huang.jpg',
    tags: ['芯片', 'AI', 'GPU'],
    mentionCount: 89,
    firstMentioned: '2023-02-10',
    lastMentioned: '2024-01-12',
    description: '英伟达创始人，AI 时代最重要的硬件公司掌门人'
  },
  {
    id: 'p-10',
    name: 'Ilya Sutskever',
    title: 'Co-founder',
    organization: 'Safe Superintelligence Inc',
    avatar: '/avatars/ilya-sutskever.jpg',
    tags: ['AI', '深度学习', 'AGI', 'AI安全'],
    mentionCount: 48,
    firstMentioned: '2023-03-10',
    lastMentioned: '2024-01-08',
    description: 'OpenAI 联合创始人兼前首席科学家，深度学习先驱'
  },
  {
    id: 'p-11',
    name: 'Andrej Karpathy',
    title: 'AI Educator & Researcher',
    organization: '独立',
    avatar: '/avatars/andrej-karpathy.jpg',
    tags: ['AI', '教育', '自动驾驶', '深度学习'],
    mentionCount: 41,
    firstMentioned: '2023-04-20',
    lastMentioned: '2024-01-07',
    description: '前特斯拉 AI 总监，前 OpenAI 研究员，知名 AI 教育者'
  },
  {
    id: 'p-12',
    name: '王兴',
    title: 'CEO',
    organization: '美团',
    avatar: '/avatars/wang-xing.jpg',
    tags: ['创业', '本地生活', '投资', '互联网'],
    mentionCount: 35,
    firstMentioned: '2023-05-01',
    lastMentioned: '2024-01-05',
    description: '美团创始人兼 CEO，连续创业者，校内网、饭否创始人'
  }
]

export const personRelations: PersonRelation[] = [
  {
    sourceId: 'p-1', // Sam Altman
    targetId: 'p-2', // Elon Musk
    relationType: 'critic',
    strength: 75,
    evidence: [
      {
        contentId: 'c-1',
        channelName: '硅谷王川',
        snippet: 'Elon Musk 和 Sam Altman 之间的公开争执愈演愈烈，Musk 指责 OpenAI 背离了最初的开源使命...',
        date: '2024-01-10'
      },
      {
        contentId: 'c-2',
        channelName: 'Lex Fridman Podcast',
        snippet: 'The tension between Musk and Altman represents a fundamental disagreement about AI safety and openness...',
        date: '2024-01-08'
      }
    ]
  },
  {
    sourceId: 'p-1', // Sam Altman
    targetId: 'p-6', // Satya Nadella
    relationType: 'collaborator',
    strength: 92,
    evidence: [
      {
        contentId: 'c-3',
        channelName: '商业就是这样',
        snippet: '微软与 OpenAI 的合作关系是科技史上最重要的战略联盟之一，Nadella 和 Altman 共同塑造了 AI 时代的格局...',
        date: '2024-01-12'
      }
    ]
  },
  {
    sourceId: 'p-1', // Sam Altman
    targetId: 'p-7', // Dario Amodei
    relationType: 'competitor',
    strength: 68,
    evidence: [
      {
        contentId: 'c-4',
        channelName: '硅谷王川',
        snippet: 'Dario Amodei 从 OpenAI 出走创立 Anthropic，两家公司在 AI 安全和商业化路径上形成了直接竞争...',
        date: '2024-01-05'
      }
    ]
  },
  {
    sourceId: 'p-1', // Sam Altman
    targetId: 'p-10', // Ilya Sutskever
    relationType: 'colleague',
    strength: 85,
    evidence: [
      {
        contentId: 'c-5',
        channelName: 'Lex Fridman Podcast',
        snippet: 'The board crisis at OpenAI revealed the complex dynamics between Altman and Sutskever, two visionaries with different views on AI development pace...',
        date: '2023-11-25'
      }
    ]
  },
  {
    sourceId: 'p-3', // Jensen Huang
    targetId: 'p-1', // Sam Altman
    relationType: 'collaborator',
    strength: 78,
    evidence: [
      {
        contentId: 'c-6',
        channelName: '硅谷王川',
        snippet: 'NVIDIA 和 OpenAI 的合作关系推动了整个 AI 行业的发展，黄仁勋多次强调 OpenAI 是最重要的客户之一...',
        date: '2024-01-03'
      }
    ]
  },
  {
    sourceId: 'p-4', // Yann LeCun
    targetId: 'p-1', // Sam Altman
    relationType: 'critic',
    strength: 62,
    evidence: [
      {
        contentId: 'c-7',
        channelName: 'Lex Fridman Podcast',
        snippet: 'LeCun 对 OpenAI 的闭源策略和 AGI 时间表提出了尖锐批评，认为当前的 LLM 范式存在根本性局限...',
        date: '2024-01-14'
      }
    ]
  },
  {
    sourceId: 'p-4', // Yann LeCun
    targetId: 'p-5', // Demis Hassabis
    relationType: 'colleague',
    strength: 55,
    evidence: [
      {
        contentId: 'c-8',
        channelName: '李永乐老师',
        snippet: '作为深度学习领域的两位巨头，LeCun 和 Hassabis 在学术上互相尊重，但在 AGI 路径上有不同见解...',
        date: '2023-12-20'
      }
    ]
  },
  {
    sourceId: 'p-2', // Elon Musk
    targetId: 'p-3', // Jensen Huang
    relationType: 'collaborator',
    strength: 65,
    evidence: [
      {
        contentId: 'c-9',
        channelName: '商业就是这样',
        snippet: '特斯拉是 NVIDIA 的重要客户，尽管 Musk 一直在推进自研芯片，但两家公司在 AI 领域保持着合作关系...',
        date: '2023-12-15'
      }
    ]
  },
  {
    sourceId: 'p-8', // 李开复
    targetId: 'p-1', // Sam Altman
    relationType: 'competitor',
    strength: 45,
    evidence: [
      {
        contentId: 'c-10',
        channelName: '得到·逻辑思维',
        snippet: '零一万物的 Yi 系列模型正在与 GPT 系列展开竞争，李开复认为中国 AI 需要走出自己的路...',
        date: '2024-01-02'
      }
    ]
  },
  {
    sourceId: 'p-10', // Ilya Sutskever
    targetId: 'p-7', // Dario Amodei
    relationType: 'colleague',
    strength: 58,
    evidence: [
      {
        contentId: 'c-11',
        channelName: 'Y Combinator',
        snippet: 'Both Sutskever and Amodei share deep concerns about AI safety, having worked together at OpenAI before taking different paths...',
        date: '2023-11-30'
      }
    ]
  },
  {
    sourceId: 'p-11', // Andrej Karpathy
    targetId: 'p-2', // Elon Musk
    relationType: 'colleague',
    strength: 72,
    evidence: [
      {
        contentId: 'c-12',
        channelName: '硅谷王川',
        snippet: 'Karpathy 在特斯拉领导自动驾驶 AI 团队多年，与 Musk 建立了深厚的工作关系...',
        date: '2023-10-15'
      }
    ]
  },
  {
    sourceId: 'p-11', // Andrej Karpathy
    targetId: 'p-1', // Sam Altman
    relationType: 'colleague',
    strength: 68,
    evidence: [
      {
        contentId: 'c-13',
        channelName: 'Lex Fridman Podcast',
        snippet: 'Karpathy 短暂回归 OpenAI 期间与 Altman 共事，对公司的教育使命有着共同愿景...',
        date: '2023-09-20'
      }
    ]
  }
]

export const personMentions: PersonMention[] = [
  {
    id: 'pm-1',
    personId: 'p-1',
    channelId: 'ch-1',
    channelName: '硅谷王川',
    contentTitle: 'GPT-5 将如何改变科技行业',
    snippet: 'Sam Altman 在发布会上暗示 GPT-5 将具备真正的推理能力，这可能是通往 AGI 的关键一步...',
    sentiment: 'positive',
    date: '2024-01-15',
    topics: ['AI 大模型', 'GPT-5', 'AGI']
  },
  {
    id: 'pm-2',
    personId: 'p-1',
    channelId: 'ch-3',
    channelName: 'Lex Fridman Podcast',
    contentTitle: 'The Future of AI with Sam Altman',
    snippet: 'In this conversation, Altman shares his vision for AGI and the challenges OpenAI faces in balancing safety with capability...',
    sentiment: 'neutral',
    date: '2024-01-10',
    topics: ['AGI', 'AI 安全']
  },
  {
    id: 'pm-3',
    personId: 'p-2',
    channelId: 'ch-1',
    channelName: '硅谷王川',
    contentTitle: 'Elon Musk vs OpenAI：一场关于 AI 未来的战争',
    snippet: 'Musk 对 OpenAI 的批评越来越尖锐，他认为公司已经偏离了最初的开源使命，变成了微软的附庸...',
    sentiment: 'negative',
    date: '2024-01-12',
    topics: ['AI', 'OpenAI', '开源']
  },
  {
    id: 'pm-4',
    personId: 'p-3',
    channelId: 'ch-5',
    channelName: '商业就是这样',
    contentTitle: '英伟达市值超越谷歌的背后逻辑',
    snippet: '黄仁勋带领英伟达成为 AI 时代最大的赢家，公司市值一度超过谷歌，成为全球第三大科技公司...',
    sentiment: 'positive',
    date: '2024-01-08',
    topics: ['芯片', '投资', 'AI']
  },
  {
    id: 'pm-5',
    personId: 'p-4',
    channelId: 'ch-3',
    channelName: 'Lex Fridman Podcast',
    contentTitle: 'Interview with Yann LeCun',
    snippet: 'LeCun argues that current LLMs are hitting a wall, and we need fundamentally new approaches to achieve true AGI...',
    sentiment: 'neutral',
    date: '2024-01-14',
    topics: ['AI 大模型', 'AGI', '深度学习']
  },
  {
    id: 'pm-6',
    personId: 'p-6',
    channelId: 'ch-6',
    channelName: 'Y Combinator',
    contentTitle: 'Microsoft AI Strategy Deep Dive',
    snippet: 'Nadella transformed Microsoft into an AI-first company through the OpenAI partnership, proving that big tech can still innovate...',
    sentiment: 'positive',
    date: '2024-01-06',
    topics: ['AI', '企业战略', '投资']
  },
  {
    id: 'pm-7',
    personId: 'p-8',
    channelId: 'ch-2',
    channelName: '得到·逻辑思维',
    contentTitle: '中国 AI 创业的机会在哪里',
    snippet: '李开复认为中国 AI 需要在应用层发力，零一万物的策略是先做好基础模型，再向垂直领域渗透...',
    sentiment: 'positive',
    date: '2024-01-04',
    topics: ['AI', '创业', '中国科技']
  }
]

export const getPersonDetail = (id: string): Person | null => {
  return persons.find(p => p.id === id) || null
}

export const getPersonRelations = (personId: string): PersonRelation[] => {
  return personRelations.filter(r => r.sourceId === personId || r.targetId === personId)
}

export const getPersonMentions = (personId: string): PersonMention[] => {
  return personMentions.filter(m => m.personId === personId)
}
