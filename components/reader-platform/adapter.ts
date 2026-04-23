import type { ReaderAnalysisContext } from './analysis'
import type { ReaderAnnotation } from './annotations'
import type {
  ReaderActiveUnit,
  ReaderCapabilities,
  ReaderContentSlice,
  ReaderLocator,
  ReaderSelection,
  ReaderSessionSnapshot,
  ReaderType,
} from './core'
import type { TranslationResponse, TranslationScope } from './translation'

export interface ReaderAdapter {
  readerType: ReaderType
  capabilities: ReaderCapabilities

  getSnapshot(): ReaderSessionSnapshot
  getSelection(): ReaderSelection | null
  getVisibleContent(): ReaderContentSlice[]
  getActiveUnit(): ReaderActiveUnit | null
  getAnalysisContext?(): ReaderAnalysisContext

  jumpTo(locator: ReaderLocator): void

  applyHighlights?(input: ReaderAnnotation[]): void
  clearHighlights?(): void

  translateScope?(scope: TranslationScope, result: TranslationResponse): void
}
