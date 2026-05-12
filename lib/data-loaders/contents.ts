import { docToContentItem, listDocuments } from '@/lib/api'
import type { ContentItem } from '@/lib/types'

export type ContentFilterType = 'all' | 'youtube' | 'podcast'

async function fetchBySourceType(sourceType: 'youtube' | 'podcast'): Promise<ContentItem[]> {
  const items: ContentItem[] = []
  let cursor: string | undefined
  do {
    const response = await listDocuments({ source_type: sourceType, cursor, limit: 100 })
    items.push(...response.items.map(docToContentItem))
    cursor = response.next_cursor || undefined
  } while (cursor)
  return items
}

export async function loadContentItems(typeFilter: ContentFilterType): Promise<ContentItem[]> {
  try {
    const sourceTypes = typeFilter === 'all' ? ['podcast', 'youtube'] as const : [typeFilter]
    const results = await Promise.all(sourceTypes.map(fetchBySourceType))
    return results.flat()
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error
    const { contentItems } = await import('@/lib/__mocks__')
    return typeFilter === 'all' ? contentItems : contentItems.filter((item) => item.type === typeFilter)
  }
}
