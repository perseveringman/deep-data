'use client'

import type { ReaderAnalysisContext } from '@/components/reader-platform/analysis'

import type {
  ThoughtActionDefinition,
  ThoughtActionExecutor,
  ThoughtActionPromptInput,
} from './thought-graph'

function contextLine(context?: ReaderAnalysisContext | null) {
  if (!context) return ''

  const visibleCount = context.visibleContent.length
  const activeUnit = context.activeUnit?.title
    ? `当前单元：${context.activeUnit.title}`
    : '当前单元：未识别'
  const location = `位置：${context.location.locator.kind}`

  return `\n\n上下文：${activeUnit}；${location}；可见片段 ${visibleCount} 个。`
}

function quote(input: ThoughtActionPromptInput) {
  return `选区：\n\n${input.sourceText}${contextLine(input.analysisContext)}`
}

export const defaultThoughtActions: ThoughtActionDefinition[] = [
  {
    id: 'translate',
    label: '翻译',
    description: '把选区翻译成流畅中文',
    color: 'blue',
    prompt: (input) => `请将以下学术/技术文本翻译成流畅中文，保留关键术语：\n\n${quote(input)}`,
  },
  {
    id: 'explain',
    label: '解释',
    description: '解释概念、背景与隐含逻辑',
    color: 'purple',
    prompt: (input) => `请解释以下文本中的核心概念、背景和逻辑递进，用要点输出：\n\n${quote(input)}`,
  },
  {
    id: 'formula',
    label: '公式/结构',
    description: '拆解公式、结构或论证链',
    color: 'green',
    prompt: (input) => `请拆解以下文本中的公式、结构或论证链；如果没有公式，请抽取它的结构化逻辑：\n\n${quote(input)}`,
  },
  {
    id: 'related',
    label: '关联',
    description: '给出相关文献、关键词或延展问题',
    color: 'pink',
    prompt: (input) => `请基于以下文本给出相关文献方向、关键词和 3 个可继续追问的问题：\n\n${quote(input)}`,
  },
]

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export const mockThoughtActionExecutor: ThoughtActionExecutor = async (
  { action, prompt, node, analysisContext },
  { onChunk },
) => {
  const chunks = [
    `## ${action.label}\n\n`,
    `> ${node.sourceText}\n\n`,
    `**生成说明**：这是本地 mock executor 的流式结果。真实接入时只需要替换 \`actionExecutor\`，空间画布、连线和持久化不需要改。\n\n`,
    `**上下文摘要**：当前 reader 为 \`${analysisContext?.document.readerType ?? node.readerType}\`，文档为 \`${analysisContext?.document.title ?? node.documentId}\`。\n\n`,
    `**Prompt 片段**：\n\n\`\`\`text\n${prompt.slice(0, 520)}${prompt.length > 520 ? '...' : ''}\n\`\`\`\n\n`,
    `**下一步**：可以把这个节点切到侧栏、最小化到 Dock，或在窗口内容里继续选中文字发散出子节点。`,
  ]

  for (const chunk of chunks) {
    await sleep(80)
    onChunk(chunk)
  }
}

