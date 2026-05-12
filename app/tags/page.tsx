import { loadTagsPageData } from '@/lib/data-loaders/tags'
import { TagsClient } from './tags-client'

export const dynamic = 'force-dynamic'

export default async function TagsPage() {
  const data = await loadTagsPageData()
  return <TagsClient {...data} />
}
