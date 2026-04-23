import type { ReaderAnalysisContext } from './analysis'
import type { ReaderAnnotation } from './annotations'
import type {
  ReaderDocumentIdentity,
  ReaderLocator,
  ReaderProgressState,
  ReaderSessionSnapshot,
} from './core'
import type { ReaderPreferences } from './preferences'

export interface ReaderCodec<TExternal, TCanonical> {
  encode(input: TCanonical): TExternal
  decode(input: TExternal): TCanonical
}

export type DocumentCodec<TExternal> = ReaderCodec<TExternal, ReaderDocumentIdentity>
export type LocatorCodec<TExternal> = ReaderCodec<TExternal, ReaderLocator>
export type AnnotationCodec<TExternal> = ReaderCodec<TExternal, ReaderAnnotation>
export type PreferencesCodec<TExternal> = ReaderCodec<TExternal, ReaderPreferences>
export type SessionSnapshotCodec<TExternal> = ReaderCodec<TExternal, ReaderSessionSnapshot>
export type ProgressCodec<TExternal> = ReaderCodec<TExternal, ReaderProgressState>

export interface ReaderIntegrationAdapter<TSource> {
  content: {
    toIdentity(source: TSource): ReaderDocumentIdentity
    toReaderData(source: TSource): unknown
  }
  state?: {
    locator?: LocatorCodec<unknown>
    annotations?: AnnotationCodec<unknown>
    progress?: ProgressCodec<unknown>
    preferences?: PreferencesCodec<unknown>
    session?: SessionSnapshotCodec<unknown>
  }
  analysis?: {
    transformContext?: (ctx: ReaderAnalysisContext) => unknown
  }
}
