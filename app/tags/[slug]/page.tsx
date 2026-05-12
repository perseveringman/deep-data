import { loadTagDetail } from '@/lib/data-loaders/tag-detail'
import { TagDetailClient } from './tag-detail-client'

export const dynamic = 'force-dynamic'

export default async function TagDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await loadTagDetail(slug)
  return <TagDetailClient data={data} />
}
