import type { ReaderLocator, ReaderSessionSnapshot } from './core'

export type TranslationProvider = 'google' | 'deepl' | 'llm'
export type TranslationScope = 'selection' | 'active-unit' | 'visible' | 'document'
export type TranslationDisplayMode = 'inline' | 'side-by-side' | 'popover'

export interface TranslationSegment {
  id: string
  text: string
  locator?: ReaderLocator
}

export interface TranslationRequest {
  provider: TranslationProvider
  sourceLang?: string
  targetLang: string
  scope: TranslationScope
  segments: TranslationSegment[]
  readerSnapshot: ReaderSessionSnapshot
}

export interface TranslationResponse {
  provider: TranslationProvider
  targetLang: string
  segments: Array<{
    id: string
    translatedText: string
  }>
}

export type TranslationExecutor = (
  request: TranslationRequest,
) => Promise<TranslationResponse>

export interface ReaderTranslationProps {
  translationExecutor?: TranslationExecutor
  defaultProvider?: TranslationProvider
  defaultTargetLang?: string
  translationDisplayMode?: TranslationDisplayMode
}
