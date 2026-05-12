import { getArtifact, listArtifacts } from '@/lib/api'
import { normalizeDeepReport, withDevFallback, type DeepReport } from './common'

async function loadDeepReportArtifacts() {
  const primary = await listArtifacts({
    artifact_type: 'deep_report',
    visibility: 'published',
    limit: 30,
  })
  const published = primary.items.filter((item) => item.status === 'done')
  if (published.length > 0) return published

  const fallback = await listArtifacts({
    subject_kind: 'daily',
    artifact_type: 'digest',
    visibility: 'public',
    limit: 10,
  })
  return fallback.items.filter((item) => item.status === 'done')
}

export async function loadDeepReports(): Promise<DeepReport[]> {
  return withDevFallback(
    async () => {
      const artifacts = await loadDeepReportArtifacts()
      return artifacts
        .map((artifact, index) => normalizeDeepReport(artifact, index))
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    },
    async () => {
      const { deepReports } = await import('@/lib/__mocks__')
      return deepReports
    },
  )
}

export async function loadDeepReportDetail(id: string): Promise<{
  report: DeepReport | null
  reports: DeepReport[]
}> {
  return withDevFallback(
    async () => {
      const numericId = Number(id)
      if (Number.isFinite(numericId)) {
        const artifact = await getArtifact(numericId, true)
        const reports = await loadDeepReports()
        return {
          report: normalizeDeepReport(artifact),
          reports,
        }
      }
      const reports = await loadDeepReports()
      return {
        report: reports.find((report) => report.id === id) || null,
        reports,
      }
    },
    async () => {
      const { deepReports, getDeepReportDetail } = await import('@/lib/__mocks__')
      return { report: getDeepReportDetail(id), reports: deepReports }
    },
  )
}
