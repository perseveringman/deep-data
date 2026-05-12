import { loadPersonDetail } from '@/lib/data-loaders/person-detail'
import { PersonDetailClient } from './person-detail-client'

export const dynamic = 'force-dynamic'

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadPersonDetail(id)
  return <PersonDetailClient id={id} data={data} />
}
