import { getDailyDigest, listArtifacts, listChannels, type ArtifactItem } from '@/lib/api'
import { normalizeChannel, normalizeDailyReport, parseArtifactBody, withDevFallback, type Channel, type DailyReport } from './common'
import { loadReports } from './reports'

export interface ReportDetailData {
  report: DailyReport | null
  reports: DailyReport[]
  channels: Channel[]
  artifacts: ArtifactItem[]
}

function mergeDailyArtifacts(digest: ArtifactItem, artifacts: ArtifactItem[]): DailyReport {
  const report = normalizeDailyReport(digest)
  const byType = new Map(artifacts.map((artifact) => [artifact.artifact_type, artifact]))
  const hotTopics = parseArtifactBody<{ items?: DailyReport['hotTopics'] } | DailyReport['hotTopics']>(byType.get('hot_topics'))
  if (Array.isArray(hotTopics)) report.hotTopics = hotTopics
  else if (hotTopics?.items) report.hotTopics = hotTopics.items
  return report
}

export async function loadReportDetail(date: string): Promise<ReportDetailData> {
  return withDevFallback<ReportDetailData>(
    async () => {
      const [digest, allArtifacts, reports, channelResponse] = await Promise.all([
        getDailyDigest(date),
        listArtifacts({ subject: `daily:${date}` }),
        loadReports(),
        listChannels(),
      ])
      return {
        report: mergeDailyArtifacts(digest, allArtifacts.items),
        reports,
        channels: channelResponse.channels.map(normalizeChannel),
        artifacts: allArtifacts.items,
      }
    },
    async () => {
      const { channels, dailyReports } = await import('@/lib/__mocks__')
      return {
        report: dailyReports.find((item) => item.date === date) || null,
        reports: dailyReports,
        channels,
        artifacts: [],
      }
    },
  )
}
