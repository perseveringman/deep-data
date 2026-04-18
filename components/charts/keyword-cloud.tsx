'use client'

import { keywords } from '@/lib/mock-data'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KeywordCloudProps {
  compact?: boolean
}

export function KeywordCloud({ compact = false }: KeywordCloudProps) {
  // 按权重排序
  const sortedKeywords = [...keywords].sort((a, b) => b.weight - a.weight)
  const displayKeywords = compact ? sortedKeywords.slice(0, 12) : sortedKeywords

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-2.5 w-2.5 text-foreground" />
      case 'down':
        return <TrendingDown className="h-2.5 w-2.5 text-muted-foreground" />
      case 'stable':
        return <Minus className="h-2.5 w-2.5 text-muted-foreground" />
    }
  }

  const getSize = (weight: number, isCompact: boolean) => {
    if (isCompact) {
      if (weight >= 80) return 'text-sm font-semibold'
      if (weight >= 60) return 'text-xs font-medium'
      return 'text-[11px]'
    }
    if (weight >= 80) return 'text-xl font-semibold'
    if (weight >= 60) return 'text-base font-medium'
    if (weight >= 40) return 'text-sm'
    return 'text-xs text-muted-foreground'
  }

  return (
    <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-3'}`}>
      {displayKeywords.map((keyword) => (
        <button
          key={keyword.word}
          className={`group flex items-center gap-1 border border-transparent px-1.5 py-0.5 transition-colors hover:border-foreground ${getSize(keyword.weight, compact)}`}
        >
          <span>{keyword.word}</span>
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            {getTrendIcon(keyword.trend)}
          </span>
        </button>
      ))}
    </div>
  )
}
