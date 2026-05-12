import { listArtifacts } from '@/lib/api'
import { parseArtifactBody, withDevFallback, type CrossAnalysisData } from './common'

export interface ComparePageData {
  crossAnalysisData: CrossAnalysisData
  commonTopics: { topic: string; channelCount: number; totalMentions: number }[]
  insights: string[]
}

export async function loadComparePageData(): Promise<ComparePageData> {
  return withDevFallback(
    async () => {
      const { items } = await listArtifacts({
        subject_kind: 'daily',
        artifact_type: 'overlap_matrix',
        visibility: 'public',
        limit: 1,
      })
      const parsed = parseArtifactBody<Partial<ComparePageData> & Partial<CrossAnalysisData>>(items[0])
      const crossAnalysisData = parsed?.crossAnalysisData || {
        channels: parsed?.channels || [],
        matrix: parsed?.matrix || [],
      }
      return {
        crossAnalysisData,
        commonTopics: parsed?.commonTopics || [],
        insights: parsed?.insights || [],
      }
    },
    async () => {
      const { crossAnalysisData } = await import('@/lib/__mocks__')
      return {
        crossAnalysisData,
        commonTopics: [
          { topic: 'AI 大模型', channelCount: 5, totalMentions: 156 },
          { topic: '创业融资', channelCount: 4, totalMentions: 98 },
          { topic: '科技趋势', channelCount: 6, totalMentions: 87 },
          { topic: '芯片半导体', channelCount: 3, totalMentions: 65 },
          { topic: '产品设计', channelCount: 2, totalMentions: 42 },
        ],
        insights: [
          '硅谷王川与 Y Combinator 话题重合度最高（72%），两者都聚焦于硅谷科技创业生态。',
          '李永乐老师与 Y Combinator 差异最大（22%），前者偏科普教育，后者偏商业创投。',
          'AI 大模型是唯一覆盖 5 个以上频道的话题，显示其在科技内容领域的主导地位。',
        ],
      }
    },
  )
}
