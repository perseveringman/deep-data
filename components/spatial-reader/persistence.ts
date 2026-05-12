'use client'

import type { ReaderDocumentIdentity } from '@/components/reader-platform/core'

import type { ThoughtGraphSnapshot, ThoughtNode } from './thought-graph'

function getStorageKey(identity: ReaderDocumentIdentity) {
  const version = identity.contentVersion ? `:${identity.contentVersion}` : ''
  return `deep-data.spatial-reader:${identity.readerType}:${identity.documentId}${version}`
}

export function readStoredThoughtGraph(
  storage: Storage,
  identity: ReaderDocumentIdentity,
): ThoughtGraphSnapshot | null {
  const raw = storage.getItem(getStorageKey(identity))
  if (!raw) return null

  const parsed = JSON.parse(raw) as ThoughtGraphSnapshot
  if (!parsed || !Array.isArray(parsed.nodes)) {
    throw new Error('Stored thought graph is invalid')
  }

  return parsed
}

export function writeStoredThoughtGraph(
  storage: Storage,
  identity: ReaderDocumentIdentity,
  nodes: ThoughtNode[],
) {
  const snapshot: ThoughtGraphSnapshot = {
    document: identity,
    nodes,
    canvas: {
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    },
  }

  storage.setItem(getStorageKey(identity), JSON.stringify(snapshot))
}

export function clearStoredThoughtGraph(storage: Storage, identity: ReaderDocumentIdentity) {
  storage.removeItem(getStorageKey(identity))
}

