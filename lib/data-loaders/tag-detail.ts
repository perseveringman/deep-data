import { listDocuments, listTags } from '@/lib/api'
import {
  normalizeDocumentAsTaggedContent,
  normalizeTag,
  withDevFallback,
  type Channel,
  type Person,
  type Tag,
  type TaggedContent,
} from './common'

export interface TagDetailData {
  tag: Tag | null
  parentTag: Tag | null
  childTags: Tag[]
  tagContent: TaggedContent[]
  trendData: { date: string; count: number }[]
  relatedChannels: Channel[]
  relatedPersons: Person[]
}

function buildTrend(count: number) {
  const today = new Date()
  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (14 - index))
    return {
      date: date.toISOString().slice(0, 10),
      count: Math.max(0, Math.round((count / 15) * (0.5 + index / 14))),
    }
  })
}

export async function loadTagDetail(slug: string): Promise<TagDetailData> {
  return withDevFallback(
    async () => {
      const decoded = decodeURIComponent(slug)
      const [{ tags }, docs] = await Promise.all([
        listTags({ limit: 200 }),
        listDocuments({ tag: decoded, limit: 30 }),
      ])
      const allTags = tags.map(normalizeTag)
      const tag = allTags.find((item) => item.slug === slug || item.name === decoded) || null
      return {
        tag,
        parentTag: null,
        childTags: [],
        tagContent: docs.items.map(normalizeDocumentAsTaggedContent),
        trendData: buildTrend(tag?.contentCount || docs.items.length),
        relatedChannels: [],
        relatedPersons: [],
      }
    },
    async () => {
      const {
        getChildTags,
        getContentByTag,
        getParentTag,
        getTagBySlug,
        getTagTrend,
        channels,
        persons,
      } = await import('@/lib/__mocks__')
      const tag = getTagBySlug(slug)
      return {
        tag,
        parentTag: tag ? getParentTag(tag.id) : null,
        childTags: tag ? getChildTags(tag.id) : [],
        tagContent: tag ? getContentByTag(tag.id) : [],
        trendData: tag ? getTagTrend(tag.id) : [],
        relatedChannels: channels.slice(0, 4),
        relatedPersons: persons.slice(0, 4),
      }
    },
  )
}
