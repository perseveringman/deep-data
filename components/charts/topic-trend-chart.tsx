'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { topicTrends } from '@/lib/mock-data'

// 将数据转换为图表格式
const chartData = topicTrends[0].data.map((item, index) => ({
  date: item.date.slice(5), // 只显示月-日
  'AI 大模型': topicTrends[0].data[index].mentions,
  '创业融资': topicTrends[1].data[index].mentions,
  '量子计算': topicTrends[2].data[index].mentions,
}))

const colors = {
  'AI 大模型': 'var(--chart-1)',
  '创业融资': 'var(--chart-2)',
  '量子计算': 'var(--chart-3)',
}

interface TopicTrendChartProps {
  compact?: boolean
}

export function TopicTrendChart({ compact = false }: TopicTrendChartProps) {
  return (
    <div className={compact ? "h-full w-full" : "h-[300px] w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={compact ? { top: 5, right: 10, left: -15, bottom: 0 } : { top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: compact ? 9 : 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval={compact ? 2 : 1}
          />
          <YAxis
            tick={{ fontSize: compact ? 9 : 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={compact ? 25 : 40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              fontSize: '11px',
              padding: '4px 8px',
            }}
          />
          {!compact && (
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="AI 大模型"
            stroke={colors['AI 大模型']}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="创业融资"
            stroke={colors['创业融资']}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="量子计算"
            stroke={colors['量子计算']}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
