import { listTags } from '@/lib/api'
import { normalizeTag, withDevFallback, type Tag } from './common'

export interface TagsPageData {
  level1Tags: Tag[]
  level2Tags: Tag[]
}

export async function loadTagsPageData(): Promise<TagsPageData> {
  return withDevFallback(
    async () => {
      const { tags } = await listTags({ limit: 200 })
      const normalized = tags.map(normalizeTag)
      const level1Tags = normalized.filter((tag) => tag.level === 1)
      const rest = normalized.filter((tag) => tag.level === 2)
      const other: Tag = {
        id: 'tag-other',
        name: '其他',
        slug: 'other',
        level: 1,
        color: '#64748b',
        description: '其他 DataHub 标签',
        contentCount: rest.reduce((sum, tag) => sum + tag.contentCount, 0),
        channelCount: 0,
        personCount: 0,
        trending: 'stable',
        lastUpdated: new Date().toISOString().slice(0, 10),
      }
      return {
        level1Tags: rest.length > 0 ? [...level1Tags, other] : level1Tags,
        level2Tags: rest,
      }
    },
    async () => {
      const { level1Tags, level2Tags } = await import('@/lib/__mocks__')
      return { level1Tags, level2Tags }
    },
  )
}
