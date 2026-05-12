import { loadPersonsPageData } from '@/lib/data-loaders/persons'
import { PersonsClient } from './persons-client'

export const dynamic = 'force-dynamic'

export default async function PersonsPage() {
  const data = await loadPersonsPageData()
  return <PersonsClient {...data} />
}
