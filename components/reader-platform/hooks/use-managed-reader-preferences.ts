'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ReaderDocumentIdentity } from '@/components/reader-platform/core'
import {
  defaultReaderPreferences,
  type ReaderPreferences,
  type ReaderPreferencesChangeEvent,
  type ReaderPreferencesPatch,
  resolveReaderPreferences,
} from '@/components/reader-platform/preferences'
import {
  getReaderStorageKey,
  readStoredReaderPreferences,
  writeStoredReaderPreferences,
} from '@/components/reader-platform/persistence'
import { deepMerge } from '@/components/reader-platform/utils'

interface UseManagedReaderPreferencesOptions {
  identity: ReaderDocumentIdentity
  basePreferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
}

interface ManagedReaderPreferences {
  preferences: ReaderPreferences
  preferencePatch: ReaderPreferencesPatch
  runtimePreferences: ReaderPreferencesPatch
  updatePreferences: (patch: ReaderPreferencesPatch) => void
  resetPreferences: () => void
}

function resolveWithRuntime(
  basePreferences: ReaderPreferencesPatch | undefined,
  runtimePreferences: ReaderPreferencesPatch,
): ReaderPreferences {
  return resolveReaderPreferences(
    {
      systemDefaults: defaultReaderPreferences,
      documentOverrides: basePreferences,
    },
    runtimePreferences,
  )
}

function getChangedKeys(patch: ReaderPreferencesPatch): string[] {
  return Object.keys(patch)
}

export function useManagedReaderPreferences({
  identity,
  basePreferences,
  onPreferencesChange,
}: UseManagedReaderPreferencesOptions): ManagedReaderPreferences {
  const [runtimePreferences, setRuntimePreferences] = useState<ReaderPreferencesPatch>({})
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false)
  const storageKey = useMemo(() => getReaderStorageKey(identity), [identity.contentVersion, identity.documentId, identity.readerType])
  const stableIdentity = useMemo(() => identity, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setRuntimePreferences(readStoredReaderPreferences(window.localStorage, stableIdentity))
    setHasLoadedStorage(true)
  }, [stableIdentity, storageKey])

  useEffect(() => {
    if (!hasLoadedStorage || typeof window === 'undefined') return
    writeStoredReaderPreferences(window.localStorage, stableIdentity, runtimePreferences)
  }, [hasLoadedStorage, runtimePreferences, stableIdentity, storageKey])

  const preferences = useMemo(
    () => resolveWithRuntime(basePreferences, runtimePreferences),
    [basePreferences, runtimePreferences],
  )

  const preferencePatch = useMemo(
    () => deepMerge(basePreferences ?? {}, runtimePreferences) as ReaderPreferencesPatch,
    [basePreferences, runtimePreferences],
  )

  const updatePreferences = useCallback(
    (patch: ReaderPreferencesPatch) => {
      setRuntimePreferences((current) => {
        const nextRuntime = deepMerge(current, patch) as ReaderPreferencesPatch

        onPreferencesChange?.({
          next: resolveWithRuntime(basePreferences, nextRuntime),
          previous: resolveWithRuntime(basePreferences, current),
          changedKeys: getChangedKeys(patch),
          source: 'user',
        })

        return nextRuntime
      })
    },
    [basePreferences, onPreferencesChange],
  )

  const resetPreferences = useCallback(() => {
    setRuntimePreferences((current) => {
      onPreferencesChange?.({
        next: resolveWithRuntime(basePreferences, {}),
        previous: resolveWithRuntime(basePreferences, current),
        changedKeys: getChangedKeys(current),
        source: 'reset',
      })

      return {}
    })
  }, [basePreferences, onPreferencesChange])

  return {
    preferences,
    preferencePatch,
    runtimePreferences,
    updatePreferences,
    resetPreferences,
  }
}
