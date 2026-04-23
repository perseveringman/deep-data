'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  defaultReaderPreferences,
  defaultReaderPresets,
  getPresetById,
  resolveReaderPreferences,
  type ReaderConfigController,
  type ReaderPreferences,
  type ReaderPreferencesLayers,
  type ReaderPreferencesPatch,
  type ReaderPresetDefinition,
} from '@/components/reader-platform/preferences'
import { deepMerge } from '@/components/reader-platform/utils'

interface UseReaderPreferencesOptions {
  layers?: Partial<ReaderPreferencesLayers>
  runtime?: ReaderPreferencesPatch
  presets?: ReaderPresetDefinition[]
  onChange?: (next: ReaderPreferences) => void
}

export function useReaderPreferences({
  layers,
  runtime,
  presets = defaultReaderPresets,
  onChange,
}: UseReaderPreferencesOptions = {}): ReaderConfigController & {
  preferences: ReaderPreferences
  runtimePreferences: ReaderPreferencesPatch
} {
  const [runtimePreferences, setRuntimePreferences] = useState<ReaderPreferencesPatch>(runtime ?? {})

  const resolvedLayers: ReaderPreferencesLayers = useMemo(
    () => ({
      systemDefaults: defaultReaderPreferences,
      ...layers,
    }),
    [layers],
  )

  const preferences = useMemo(
    () => resolveReaderPreferences(resolvedLayers, runtimePreferences),
    [resolvedLayers, runtimePreferences],
  )

  const updatePreferences = useCallback(
    (patch: ReaderPreferencesPatch) => {
      setRuntimePreferences((current) => {
        const nextRuntime = deepMerge(current, patch) as ReaderPreferencesPatch
        onChange?.(resolveReaderPreferences(resolvedLayers, nextRuntime))
        return nextRuntime
      })
    },
    [onChange, resolvedLayers],
  )

  const resetPreferences = useCallback(() => {
    setRuntimePreferences({})
    onChange?.(resolveReaderPreferences(resolvedLayers, {}))
  }, [onChange, resolvedLayers])

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = getPresetById(presetId, presets)
      if (!preset) return
      updatePreferences(preset.preferences)
    },
    [presets, updatePreferences],
  )

  return {
    preferences,
    runtimePreferences,
    getPreferences: () => preferences,
    updatePreferences,
    resetPreferences,
    applyPreset,
  }
}
