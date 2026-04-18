'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface EngagementData {
  date: string
  views: number
  likes: number
  comments: number
}

interface EngagementChartProps {
  data: EngagementData[]
  compact?: boolean
}

export function EngagementChart({ data, compact = false }: EngagementChartProps) {
  const chartData = data.map((item) => ({
    date: item.date.slice(5), // 只显示月-日
    播放量: item.views,
    点赞数: item.likes,
    评论数: item.comments,
  }))

  return (
    <div className={compact ? "h-full w-full" : "h-[300px] w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
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
            width={compact ? 30 : 40}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
              return value.toString()
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              fontSize: '11px',
              padding: '4px 8px',
            }}
            formatter={(value: number) => {
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
              return value
            }}
          />
          {!compact && <Legend wrapperStyle={{ fontSize: '11px' }} />}
          <Area
            type="monotone"
            dataKey="播放量"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="点赞数"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="评论数"
            stroke="var(--chart-3)"
            fill="var(--chart-3)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
