import type { Locale } from 'date-fns'
import type {
  ReaderDocumentIdentity,
  ReaderPersistenceEvents,
  ReaderPreferencesChangeEvent,
  ReaderPreferencesPatch,
  ReaderRuntimeProps,
} from '@/components/reader-platform'

export interface ReaderChapter {
  id?: string
  time: string
  seconds: number
  title: string
}

export interface ReaderTranscriptSegment {
  id?: string
  startMs: number
  text: string
  speaker?: string
}

export type ReaderSectionTone = 'default' | 'primary' | 'amber' | 'emerald'
export type ReaderSectionIcon = 'summary' | 'takeaways' | 'keywords' | 'notes' | 'description' | 'details'

interface ReaderSidebarSectionBase {
  id: string
  title: string
  icon?: ReaderSectionIcon
  tone?: ReaderSectionTone
}

export interface ReaderTextSection extends ReaderSidebarSectionBase {
  type: 'text'
  content: string
  multiline?: boolean
}

export interface ReaderListSection extends ReaderSidebarSectionBase {
  type: 'list'
  items: string[]
  ordered?: boolean
  pill?: boolean
}

export interface ReaderFactsSection extends ReaderSidebarSectionBase {
  type: 'facts'
  items: Array<{
    label: string
    value: string
  }>
}

export type ReaderSidebarSection =
  | ReaderTextSection
  | ReaderListSection
  | ReaderFactsSection

export interface ReaderMessages {
  chapters: string
  transcript: string
  noChapters: string
  noTranscript: string
  sourceLink: string
  audioUnavailable: string
  summarySection: string
  takeawaysSection: string
  keywordsSection: string
  notesSection: string
  descriptionSection: string
  detailsSection: string
  languageLabel: string
  categoryLabel: string
  durationLabel: string
  viewsLabel: string
  likesLabel: string
}

export interface ReaderChromeProps {
  className?: string
  contentHeightClassName?: string
  sidebarStickyTopClassName?: string
  dateLocale?: Locale
  dateFormat?: string
  messages?: Partial<ReaderMessages>
}

export interface PodcastReaderData {
  title: string
  podcastTitle?: string
  publishedAt?: string
  durationText?: string
  durationMs?: number
  audioUrl?: string
  coverUrl?: string
  externalUrl?: string
  tags?: string[]
  summary?: string
  description?: string
  notes?: string
  takeaways?: string[]
  keywords?: string[]
  chapters?: ReaderChapter[]
  transcript?: ReaderTranscriptSegment[]
}

export interface YouTubeReaderData {
  title: string
  channelName?: string
  publishedAt?: string
  durationText?: string
  durationMs?: number
  videoUrl?: string
  videoId?: string
  categories?: string
  language?: string
  viewCount?: number
  likeCount?: number
  tags?: string[]
  summary?: string
  description?: string
  chapters?: ReaderChapter[]
  transcript?: ReaderTranscriptSegment[]
}

export interface PodcastReaderProps extends ReaderChromeProps, ReaderRuntimeProps, ReaderPersistenceEvents {
  identity: ReaderDocumentIdentity
  data: PodcastReaderData
  preferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
}

export interface YouTubeReaderProps extends ReaderChromeProps, ReaderRuntimeProps, ReaderPersistenceEvents {
  identity: ReaderDocumentIdentity
  data: YouTubeReaderData
  preferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
}
