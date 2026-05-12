import { getPerson, listGlobalPersonRelations, listPersonMentions, listPersonRelations, listPersons } from '@/lib/api'
import {
  normalizePerson,
  normalizePersonMention,
  normalizePersonRelation,
  withDevFallback,
  type Person,
  type PersonMention,
  type PersonRelation,
} from './common'

export interface PersonDetailData {
  person: Person | null
  persons: Person[]
  relations: PersonRelation[]
  mentions: PersonMention[]
  personRelations: PersonRelation[]
}

export async function loadPersonDetail(id: string): Promise<PersonDetailData> {
  return withDevFallback(
    async () => {
      const [person, personsResponse, relationsResponse, mentionsResponse, globalRelationsResponse] = await Promise.all([
        getPerson(id),
        listPersons({ limit: 200 }),
        listPersonRelations(id),
        listPersonMentions(id, { limit: 50 }),
        listGlobalPersonRelations(),
      ])
      return {
        person: normalizePerson(person),
        persons: personsResponse.items.map(normalizePerson),
        relations: relationsResponse.items.map(normalizePersonRelation),
        mentions: mentionsResponse.items.map(normalizePersonMention),
        personRelations: globalRelationsResponse.items.map(normalizePersonRelation),
      }
    },
    async () => {
      const { getPersonDetail, getPersonMentions, getPersonRelations, persons, personRelations } = await import('@/lib/__mocks__')
      return {
        person: getPersonDetail(id),
        persons,
        relations: getPersonRelations(id),
        mentions: getPersonMentions(id),
        personRelations,
      }
    },
  )
}
