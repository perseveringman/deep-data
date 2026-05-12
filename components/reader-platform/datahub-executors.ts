import {
  createChatThread,
  runArtifact,
  sendChatMessage,
  type ArtifactItem,
} from '@/lib/api'
import type { ReaderAnalysisContext } from './analysis'
import type { TranslationExecutor, TranslationRequest, TranslationResponse } from './translation'

export interface DataHubAnalysisRequest {
  context: ReaderAnalysisContext
  artifactType?: 'summary' | 'key_points' | 'entities'
}

export interface DataHubAnalysisResponse {
  artifact: ArtifactItem
}

function documentRefFromSnapshot(request: TranslationRequest): string {
  return request.readerSnapshot.document.documentId
}

function artifactBodyOrThrow(artifact: ArtifactItem): string {
  if (artifact.status === 'failed') {
    throw new Error(artifact.error_message || 'DataHub artifact generation failed')
  }
  return artifact.body || ''
}

export function createDataHubTranslationExecutor(): TranslationExecutor {
  return async (request: TranslationRequest): Promise<TranslationResponse> => {
    if (request.scope !== 'document') {
      const joined = request.segments.map((segment) => segment.text).join('\n\n')
      const thread = await createChatThread({
        subject_kind: 'document',
        subject_ref: documentRefFromSnapshot(request),
      })
      const reply = await sendChatMessage(
        thread.id,
        `Translate these selected segments to ${request.targetLang}:\n\n${joined}`,
      )
      const body = reply.message.content
      return {
        provider: 'llm',
        targetLang: request.targetLang,
        segments: request.segments.map((segment) => ({ id: segment.id, translatedText: body })),
      }
    }

    const artifact = await runArtifact({
      subject_kind: 'document',
      subject_ref: documentRefFromSnapshot(request),
      artifact_type: `translation:${request.targetLang}`,
      params: { target_lang: request.targetLang },
    })
    const translated = artifactBodyOrThrow(artifact)
    return {
      provider: 'llm',
      targetLang: request.targetLang,
      segments: request.segments.map((segment) => ({ id: segment.id, translatedText: translated })),
    }
  }
}

export async function runDataHubAnalysis(
  request: DataHubAnalysisRequest,
): Promise<DataHubAnalysisResponse> {
  const artifact = await runArtifact({
    subject_kind: 'document',
    subject_ref: request.context.document.documentId,
    artifact_type: request.artifactType || 'summary',
  })
  return { artifact }
}
