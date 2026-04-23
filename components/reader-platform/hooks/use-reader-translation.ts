'use client'

import { useCallback, useMemo, useState } from 'react'

import type { TranslationExecutor, TranslationRequest, TranslationResponse } from '@/components/reader-platform/translation'

interface UseReaderTranslationOptions {
  executor?: TranslationExecutor
}

export function useReaderTranslation({ executor }: UseReaderTranslationOptions = {}) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [lastResponse, setLastResponse] = useState<TranslationResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const canTranslate = useMemo(() => Boolean(executor), [executor])

  const runTranslation = useCallback(
    async (request: TranslationRequest) => {
      if (!executor) {
        throw new Error('Translation executor is not configured')
      }

      setIsTranslating(true)
      setError(null)

      try {
        const response = await executor(request)
        setLastResponse(response)
        return response
      } catch (translationError) {
        const normalizedError =
          translationError instanceof Error
            ? translationError
            : new Error('Translation execution failed')
        setError(normalizedError)
        throw normalizedError
      } finally {
        setIsTranslating(false)
      }
    },
    [executor],
  )

  return {
    canTranslate,
    isTranslating,
    lastResponse,
    error,
    runTranslation,
  }
}
