import type { ReaderDocumentIdentity, ReaderLocator } from './core'
import type { ReaderPreferencesPatch } from './preferences'

interface StoredReaderState {
  preferences?: ReaderPreferencesPatch
  locator?: ReaderLocator
}

const STORAGE_PREFIX = 'deep-data.reader'

function getReaderDocumentKey(identity: ReaderDocumentIdentity): string {
  const parts = [identity.readerType, identity.documentId]

  if (identity.contentVersion) {
    parts.push(identity.contentVersion)
  }

  return parts.join(':')
}

function parseStoredReaderState(raw: string | null): StoredReaderState {
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as StoredReaderState | null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStoredReaderState(
  storage: Storage,
  identity: ReaderDocumentIdentity,
  nextState: StoredReaderState,
) {
  const key = getReaderStorageKey(identity)

  if (!nextState.preferences && !nextState.locator) {
    storage.removeItem(key)
    return
  }

  storage.setItem(key, JSON.stringify(nextState))
}

export function getReaderStorageKey(identity: ReaderDocumentIdentity): string {
  return `${STORAGE_PREFIX}:${getReaderDocumentKey(identity)}`
}

export function readStoredReaderState(
  storage: Storage,
  identity: ReaderDocumentIdentity,
): StoredReaderState {
  return parseStoredReaderState(storage.getItem(getReaderStorageKey(identity)))
}

export function readStoredReaderPreferences(
  storage: Storage,
  identity: ReaderDocumentIdentity,
): ReaderPreferencesPatch {
  return readStoredReaderState(storage, identity).preferences ?? {}
}

export function writeStoredReaderPreferences(
  storage: Storage,
  identity: ReaderDocumentIdentity,
  preferences: ReaderPreferencesPatch,
) {
  const current = readStoredReaderState(storage, identity)
  const hasPreferences = Object.keys(preferences).length > 0

  writeStoredReaderState(storage, identity, {
    ...current,
    preferences: hasPreferences ? preferences : undefined,
  })
}

export function readStoredReaderLocator(
  storage: Storage,
  identity: ReaderDocumentIdentity,
): ReaderLocator | null {
  return readStoredReaderState(storage, identity).locator ?? null
}

export function writeStoredReaderLocator(
  storage: Storage,
  identity: ReaderDocumentIdentity,
  locator: ReaderLocator,
) {
  const current = readStoredReaderState(storage, identity)
  writeStoredReaderState(storage, identity, { ...current, locator })
}

export function clearStoredReaderLocator(storage: Storage, identity: ReaderDocumentIdentity) {
  const current = readStoredReaderState(storage, identity)
  writeStoredReaderState(storage, identity, {
    ...current,
    locator: undefined,
  })
}
