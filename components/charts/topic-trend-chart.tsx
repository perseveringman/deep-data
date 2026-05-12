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
import type { TopicTrend } from '@/lib/data-loaders/common'

interface TopicTrendChartProps {
  compact?: boolean
  data?: TopicTrend[]
}

export function TopicTrendChart({ compact = false, data = [] }: TopicTrendChartProps) {
  const displayTrends = data.slice(0, 3)
  const chartData = displayTrends[0]?.data.map((item, index) => {
    const row: Record<string, string | number> = { date: item.date.slice(5) }
    displayTrends.forEach((trend) => {
      row[trend.topic] = trend.data[index]?.mentions || 0
    })
    return row
  }) || []
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']

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
          {displayTrends.map((trend, index) => (
            <Line
              key={trend.topic}
              type="monotone"
              dataKey={trend.topic}
              stroke={colors[index]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
