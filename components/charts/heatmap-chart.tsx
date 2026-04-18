'use client'

import { crossAnalysisData } from '@/lib/mock-data'

interface HeatmapChartProps {
  compact?: boolean
}

export function HeatmapChart({ compact = false }: HeatmapChartProps) {
  const { channels, matrix } = crossAnalysisData

  const getColor = (value: number) => {
    // 使用灰度色阶
    if (value === 100) return 'bg-foreground text-background'
    if (value >= 70) return 'bg-foreground/80 text-background'
    if (value >= 50) return 'bg-foreground/60 text-background'
    if (value >= 30) return 'bg-foreground/40 text-foreground'
    return 'bg-foreground/20 text-foreground'
  }

  const cellSize = compact ? 'w-12 h-10' : 'w-20 h-14'
  const labelWidth = compact ? 'w-24' : 'w-32'
  const fontSize = compact ? 'text-[10px]' : 'text-sm'
  const labelSize = compact ? 'text-[10px]' : 'text-xs'

  return (
    <div className="overflow-x-auto">
      <div className={compact ? "min-w-[400px]" : "min-w-[600px]"}>
        {/* Header Row */}
        <div className="flex">
          <div className={`${labelWidth} shrink-0`} />
          {channels.map((channel) => (
            <div
              key={channel}
              className={`${cellSize.split(' ')[0]} shrink-0 px-0.5 py-1 text-center`}
            >
              <span className={`block truncate ${labelSize} font-medium`} title={channel}>
                {channel.length > (compact ? 5 : 8) ? channel.slice(0, compact ? 5 : 8) + '..' : channel}
              </span>
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {matrix.map((row, rowIndex) => (
          <div key={channels[rowIndex]} className="flex">
            <div className={`flex ${labelWidth} shrink-0 items-center px-1 py-0.5`}>
              <span className={`truncate ${labelSize} font-medium`} title={channels[rowIndex]}>
                {channels[rowIndex]}
              </span>
            </div>
            {row.map((value, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex ${cellSize} shrink-0 items-center justify-center border border-background font-mono ${fontSize} ${getColor(value)}`}
                title={`${channels[rowIndex]} - ${channels[colIndex]}: ${value}%`}
              >
                {value}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={`mt-3 flex items-center justify-center gap-3 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <span className="text-muted-foreground">重合度:</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <div className="h-3 w-3 bg-foreground/20" />
            <span>低</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="h-3 w-3 bg-foreground/60" />
            <span>中</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="h-3 w-3 bg-foreground" />
            <span>高</span>
          </div>
        </div>
      </div>
    </div>
  )
}
