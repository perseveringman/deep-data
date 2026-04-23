import type {
  ReaderActiveUnit,
  ReaderCapabilities,
  ReaderContentSlice,
  ReaderDocumentIdentity,
  ReaderLocator,
  ReaderRange,
} from './core'
import type { ReaderAnnotation } from './annotations'
import type { ReaderPreferences } from './preferences'

export interface ReaderAnalysisContext {
  document: ReaderDocumentIdentity
  location: {
    locator: ReaderLocator
    progress?: number
  }
  selection?: {
    text: string
    markdown?: string
    range: ReaderRange
  }
  activeUnit?: ReaderActiveUnit
  visibleContent: ReaderContentSlice[]
  surroundingContext?: {
    before?: string
    after?: string
  }
  annotations?: ReaderAnnotation[]
  preferences?: ReaderPreferences
  capabilities: ReaderCapabilities
}

export interface AnalysisContextProvider {
  getAnalysisContext(): ReaderAnalysisContext
}

export interface ReaderAnalysisEvents {
  onAnalysisContextChange?: (context: ReaderAnalysisContext) => void
}
