import { listGlobalPersonRelations, listPersons } from '@/lib/api'
import { normalizePerson, normalizePersonRelation, withDevFallback, type Person, type PersonRelation } from './common'

export interface PersonsPageData {
  persons: Person[]
  personRelations: PersonRelation[]
}

export async function loadPersonsPageData(): Promise<PersonsPageData> {
  return withDevFallback(
    async () => {
      const [personResponse, relationResponse] = await Promise.all([
        listPersons({ limit: 200 }),
        listGlobalPersonRelations(),
      ])
      return {
        persons: personResponse.items.map(normalizePerson),
        personRelations: relationResponse.items.map(normalizePersonRelation),
      }
    },
    async () => {
      const { persons, personRelations } = await import('@/lib/__mocks__')
      return { persons, personRelations }
    },
  )
}
