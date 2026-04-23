import type { ReaderAnalysisContext, ReaderAnalysisEvents } from './analysis'
import type { ReaderAnnotation, ReaderAnnotationEvents } from './annotations'
import type {
  ReaderActiveUnit,
  ReaderCapabilities,
  ReaderContentSlice,
  ReaderSelection,
  ReaderSessionSnapshot,
} from './core'
import type { ReaderPreferences } from './preferences'
import type {
  ReaderTranslationProps,
  TranslationProvider,
  TranslationRequest,
  TranslationScope,
} from './translation'

export interface ReaderRuntimeProps
  extends ReaderAnnotationEvents,
    ReaderAnalysisEvents,
    ReaderTranslationProps {
  initialAnnotations?: ReaderAnnotation[]
}

interface BuildReaderTranslationRequestInput {
  provider: TranslationProvider
  targetLang: string
  scope: TranslationScope
  snapshot: ReaderSessionSnapshot
  activeUnit?: ReaderActiveUnit | null
  visibleContent?: ReaderContentSlice[]
  sourceLang?: string
}

interface BuildReaderAnalysisContextInput {
  snapshot: ReaderSessionSnapshot
  activeUnit?: ReaderActiveUnit | null
  visibleContent?: ReaderContentSlice[]
  annotations?: ReaderAnnotation[]
  preferences?: ReaderPreferences
  capabilities: ReaderCapabilities
}

function getVisibleContent(
  snapshot: ReaderSessionSnapshot,
  visibleContent?: ReaderContentSlice[],
): ReaderContentSlice[] {
  return visibleContent && visibleContent.length > 0
    ? visibleContent
    : snapshot.visibleContent ?? []
}

function getSelectionSegment(selection: ReaderSelection | undefined) {
  const text = selection?.text.trim()
  if (!text || !selection) {
    throw new Error('Selection scope requires a current text selection')
  }

  return {
    id: 'selection',
    text,
    locator: selection.range.start,
  }
}

function getActiveUnitSegment(activeUnit?: ReaderActiveUnit | null) {
  const text = activeUnit?.markdown?.trim() || activeUnit?.text?.trim()
  if (!text || !activeUnit) {
    throw new Error('Active-unit scope requires a current reader unit')
  }

  return {
    id: activeUnit.id ?? 'active-unit',
    text,
    locator: activeUnit.locator,
  }
}

function getVisibleSegments(
  snapshot: ReaderSessionSnapshot,
  visibleContent?: ReaderContentSlice[],
) {
  const slices = getVisibleContent(snapshot, visibleContent)
    .filter((slice) => slice.text.trim().length > 0)
    .map((slice) => ({
      id: slice.id,
      text: slice.markdown?.trim() || slice.text.trim(),
      locator: slice.locator,
    }))

  if (slices.length === 0) {
    throw new Error('Visible scope requires visible reader content')
  }

  return slices
}

export function buildReaderTranslationRequest({
  provider,
  targetLang,
  scope,
  snapshot,
  activeUnit,
  visibleContent,
  sourceLang,
}: BuildReaderTranslationRequestInput): TranslationRequest {
  let segments: TranslationRequest['segments']

  switch (scope) {
    case 'selection':
      segments = [getSelectionSegment(snapshot.selection)]
      break
    case 'active-unit':
      segments = [getActiveUnitSegment(activeUnit)]
      break
    case 'visible':
    case 'document':
      segments = getVisibleSegments(snapshot, visibleContent)
      break
    default: {
      const exhaustiveCheck: never = scope
      throw new Error(`Unsupported translation scope: ${exhaustiveCheck}`)
    }
  }

  return {
    provider,
    sourceLang,
    targetLang,
    scope,
    segments,
    readerSnapshot: snapshot,
  }
}

export function buildReaderAnalysisContext({
  snapshot,
  activeUnit,
  visibleContent,
  annotations,
  preferences,
  capabilities,
}: BuildReaderAnalysisContextInput): ReaderAnalysisContext {
  return {
    document: snapshot.document,
    location: {
      locator: snapshot.location,
      progress: snapshot.progress,
    },
    selection: snapshot.selection
      ? {
          text: snapshot.selection.text,
          markdown: snapshot.selection.markdown,
          range: snapshot.selection.range,
        }
      : undefined,
    activeUnit: activeUnit ?? undefined,
    visibleContent: getVisibleContent(snapshot, visibleContent),
    annotations,
    preferences,
    capabilities,
  }
}
