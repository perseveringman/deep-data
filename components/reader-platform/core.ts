export type ReaderType = 'podcast' | 'youtube' | 'markdown' | 'epub' | 'pdf'

export interface ReaderDocumentIdentity {
  readerType: ReaderType
  documentId: string
  sourceUrl?: string
  contentVersion?: string
  title?: string
  language?: string
  metadata?: Record<string, unknown>
}

export interface ReaderTimeLocator {
  kind: 'time'
  timeMs: number
}

export interface ReaderPageLocator {
  kind: 'page'
  page: number
  offset?: number
}

export interface ReaderCfiLocator {
  kind: 'cfi'
  cfi: string
}

export interface ReaderAnchorLocator {
  kind: 'anchor'
  anchor: string
}

export type ReaderLocator =
  | ReaderTimeLocator
  | ReaderPageLocator
  | ReaderCfiLocator
  | ReaderAnchorLocator

export interface ReaderQuoteAnchor {
  exact?: string
  prefix?: string
  suffix?: string
}

export interface ReaderRange {
  start: ReaderLocator
  end?: ReaderLocator
  quote?: ReaderQuoteAnchor
}

export interface ReaderProgressState {
  documentId: string
  locator: ReaderLocator
  progress?: number
  lastReadAt?: string
}

export interface ReaderTocItem {
  id: string
  title: string
  locator: ReaderLocator
  level?: number
  children?: ReaderTocItem[]
}

export interface ReaderSearchResult {
  id: string
  text: string
  locator: ReaderLocator
  contextBefore?: string
  contextAfter?: string
}

export interface ReaderSelectionAnchorRect {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface ReaderSelection {
  text: string
  markdown?: string
  html?: string
  anchorRect?: ReaderSelectionAnchorRect
  range: ReaderRange
}

export interface ReaderActiveUnit {
  id?: string
  title?: string
  text?: string
  markdown?: string
  locator: ReaderLocator
}

export interface ReaderContentSlice {
  id: string
  text: string
  markdown?: string
  locator: ReaderLocator
}

export interface ReaderCapabilities {
  textSelection: boolean
  translation: boolean
  annotations: boolean
  aiContext: boolean
  toc: boolean
  search: boolean
  bookmarks: boolean
  paginatedNavigation: boolean
  continuousScroll: boolean
  jumpToLocator: boolean
  extractVisibleText: boolean
}

export const defaultReaderCapabilities: ReaderCapabilities = {
  textSelection: false,
  translation: false,
  annotations: false,
  aiContext: false,
  toc: false,
  search: false,
  bookmarks: false,
  paginatedNavigation: false,
  continuousScroll: false,
  jumpToLocator: true,
  extractVisibleText: false,
}

export interface ReaderSessionSnapshot {
  document: ReaderDocumentIdentity
  location: ReaderLocator
  progress?: number
  selection?: ReaderSelection
  activeTocItemId?: string
  visibleContent?: ReaderContentSlice[]
  annotationsCount?: number
}

export type ReaderEvent =
  | { type: 'location-changed'; locator: ReaderLocator }
  | { type: 'selection-changed'; selection: ReaderSelection | null }
  | { type: 'annotation-created'; annotationId: string }
  | { type: 'annotation-updated'; annotationId: string }
  | { type: 'annotation-deleted'; annotationId: string }
  | { type: 'preferences-changed'; keys: string[] }
  | { type: 'search-executed'; query: string; resultCount: number }
  | { type: 'translation-requested'; scope: string; provider: string }
  | { type: 'analysis-context-exported' }

export type ReaderEventHandler = (event: ReaderEvent) => void

export interface ReaderNavigationApi {
  jumpTo(locator: ReaderLocator): void
  jumpToRange(range: ReaderRange): void
  getCurrentLocator(): ReaderLocator
}

export interface ReaderExtractionApi {
  getSelection(): ReaderSelection | null
  getVisibleContent(): ReaderContentSlice[]
  getActiveUnit(): ReaderActiveUnit | null
}

export interface ReaderPersistenceEvents {
  onProgressChange?: (payload: ReaderProgressState) => void
  onSessionSnapshotChange?: (payload: ReaderSessionSnapshot) => void
}

export function locatorEquals(a: ReaderLocator | null | undefined, b: ReaderLocator | null | undefined): boolean {
  if (!a || !b || a.kind !== b.kind) return false

  switch (a.kind) {
    case 'time':
      return a.timeMs === (b as ReaderTimeLocator).timeMs
    case 'page':
      return a.page === (b as ReaderPageLocator).page && a.offset === (b as ReaderPageLocator).offset
    case 'cfi':
      return a.cfi === (b as ReaderCfiLocator).cfi
    case 'anchor':
      return a.anchor === (b as ReaderAnchorLocator).anchor
  }
}

export function formatLocatorLabel(locator: ReaderLocator): string {
  switch (locator.kind) {
    case 'time':
      return `t:${locator.timeMs}`
    case 'page':
      return `p:${locator.page}${locator.offset ? `:${locator.offset}` : ''}`
    case 'cfi':
      return `cfi:${locator.cfi}`
    case 'anchor':
      return `a:${locator.anchor}`
  }
}
