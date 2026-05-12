import { listArtifacts } from '@/lib/api'
import { normalizeDailyReport, withDevFallback, type DailyReport } from './common'

export async function loadReports(): Promise<DailyReport[]> {
  return withDevFallback(
    async () => {
      const { items } = await listArtifacts({
        subject_kind: 'daily',
        artifact_type: 'digest',
        visibility: 'public',
        limit: 30,
      })
      return items
        .filter((item) => item.status === 'done')
        .map(normalizeDailyReport)
        .sort((a, b) => b.date.localeCompare(a.date))
    },
    async () => {
      const { dailyReports } = await import('@/lib/__mocks__')
      return dailyReports
    },
  )
}
