import { SidebarTrigger } from '@/components/ui/sidebar'
import { HeatmapChart } from '@/components/charts/heatmap-chart'
import { crossAnalysisData } from '@/lib/mock-data'

export default function ComparePage() {
  // 找出最相似和最不同的频道对
  const pairs: { channels: [string, string]; value: number }[] = []
  const { channels: channelNames, matrix } = crossAnalysisData

  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      pairs.push({
        channels: [channelNames[i], channelNames[j]],
        value: matrix[i][j],
      })
    }
  }

  const sortedPairs = [...pairs].sort((a, b) => b.value - a.value)
  const mostSimilar = sortedPairs.slice(0, 3)
  const mostDifferent = sortedPairs.slice(-3).reverse()

  // 共同话题统计
  const commonTopics = [
    { topic: 'AI 大模型', channelCount: 5, totalMentions: 156 },
    { topic: '创业融资', channelCount: 4, totalMentions: 98 },
    { topic: '科技趋势', channelCount: 6, totalMentions: 87 },
    { topic: '芯片半导体', channelCount: 3, totalMentions: 65 },
    { topic: '产品设计', channelCount: 2, totalMentions: 42 },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="font-serif text-base font-semibold">交叉分析</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Top Row: Heatmap + Insights */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Heatmap */}
          <div className="lg:col-span-7">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">话题重合度矩阵</h2>
            </div>
            <div className="mt-2 border border-border p-3">
              <HeatmapChart compact />
            </div>
          </div>

          {/* Similar & Different */}
          <div className="lg:col-span-5 grid gap-4 content-start">
            {/* Most Similar */}
            <div>
              <div className="border-b border-border pb-1">
                <h2 className="font-serif text-sm font-bold">内容最相似</h2>
              </div>
              <div className="mt-2 space-y-1.5">
                {mostSimilar.map((pair, index) => (
                  <div
                    key={`${pair.channels[0]}-${pair.channels[1]}`}
                    className="flex items-center justify-between border border-border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center border border-foreground text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="text-xs">
                        <p className="font-medium">{pair.channels[0]}</p>
                        <p className="text-muted-foreground">与 {pair.channels[1]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-lg font-bold">{pair.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Different */}
            <div>
              <div className="border-b border-border pb-1">
                <h2 className="font-serif text-sm font-bold">内容最差异</h2>
              </div>
              <div className="mt-2 space-y-1.5">
                {mostDifferent.map((pair, index) => (
                  <div
                    key={`${pair.channels[0]}-${pair.channels[1]}`}
                    className="flex items-center justify-between border border-border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center border border-muted-foreground text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="text-xs">
                        <p className="font-medium">{pair.channels[0]}</p>
                        <p className="text-muted-foreground">与 {pair.channels[1]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-lg font-bold text-muted-foreground">{pair.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Common Topics + Insights */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Common Topics Table */}
          <div className="lg:col-span-8">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">跨频道热门话题</h2>
            </div>
            <div className="mt-2 divide-y divide-border border border-border text-xs">
              <div className="grid grid-cols-4 gap-2 bg-muted p-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>话题</span>
                <span className="text-center">频道数</span>
                <span className="text-center">提及次数</span>
                <span className="text-right">热度</span>
              </div>
              {commonTopics.map((topic) => (
                <div key={topic.topic} className="grid grid-cols-4 gap-2 items-center p-2">
                  <span className="font-medium">{topic.topic}</span>
                  <span className="text-center font-mono">{topic.channelCount}</span>
                  <span className="text-center font-mono">{topic.totalMentions}</span>
                  <div className="flex justify-end">
                    <div className="h-1.5 w-16 bg-muted">
                      <div
                        className="h-full bg-foreground"
                        style={{ width: `${(topic.totalMentions / 156) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Insights */}
          <div className="lg:col-span-4">
            <div className="border-b border-border pb-1">
              <h2 className="font-serif text-sm font-bold">分析洞察</h2>
            </div>
            <div className="mt-2 space-y-2">
              <div className="border-l-2 border-foreground pl-2 py-1">
                <p className="text-xs leading-relaxed">
                  硅谷王川与 Y Combinator 话题重合度最高（72%），两者都聚焦于硅谷科技创业生态。
                </p>
              </div>
              <div className="border-l-2 border-foreground pl-2 py-1">
                <p className="text-xs leading-relaxed">
                  李永乐老师与 Y Combinator 差异最大（22%），前者偏科普教育，后者偏商业创投。
                </p>
              </div>
              <div className="border-l-2 border-foreground pl-2 py-1">
                <p className="text-xs leading-relaxed">
                  AI 大模型是唯一覆盖 5 个以上频道的话题，显示其在科技内容领域的主导地位。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
