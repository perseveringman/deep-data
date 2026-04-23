'use client'

import { useCallback, useState } from 'react'

import {
  locatorEquals,
  type ReaderContentSlice,
  type ReaderDocumentIdentity,
  type ReaderRange,
  type ReaderSelection,
  type ReaderSessionSnapshot,
} from '@/components/reader-platform/core'

function readerDocumentIdentityEquals(
  current: ReaderDocumentIdentity | undefined,
  next: ReaderDocumentIdentity | undefined,
): boolean {
  if (!current || !next) return current === next

  return (
    current.readerType === next.readerType &&
    current.documentId === next.documentId &&
    current.sourceUrl === next.sourceUrl &&
    current.contentVersion === next.contentVersion &&
    current.title === next.title &&
    current.language === next.language &&
    JSON.stringify(current.metadata ?? null) === JSON.stringify(next.metadata ?? null)
  )
}

function readerRangeEquals(current: ReaderRange | undefined, next: ReaderRange | undefined): boolean {
  if (!current || !next) return current === next

  return (
    locatorEquals(current.start, next.start) &&
    locatorEquals(current.end, next.end) &&
    JSON.stringify(current.quote ?? null) === JSON.stringify(next.quote ?? null)
  )
}

function readerSelectionEquals(
  current: ReaderSelection | undefined,
  next: ReaderSelection | undefined,
): boolean {
  if (!current || !next) return current === next

  return (
    current.text === next.text &&
    current.markdown === next.markdown &&
    current.html === next.html &&
    readerRangeEquals(current.range, next.range)
  )
}

function readerContentSliceEquals(
  current: ReaderContentSlice | undefined,
  next: ReaderContentSlice | undefined,
): boolean {
  if (!current || !next) return current === next

  return (
    current.id === next.id &&
    current.text === next.text &&
    current.markdown === next.markdown &&
    locatorEquals(current.locator, next.locator)
  )
}

function readerVisibleContentEquals(
  current: ReaderContentSlice[] | undefined,
  next: ReaderContentSlice[] | undefined,
): boolean {
  if (!current || !next) return current === next
  if (current.length !== next.length) return false

  return current.every((slice, index) => readerContentSliceEquals(slice, next[index]))
}

export function readerSessionSnapshotEquals(
  current: ReaderSessionSnapshot | undefined,
  next: ReaderSessionSnapshot | undefined,
): boolean {
  if (!current || !next) return current === next

  return (
    readerDocumentIdentityEquals(current.document, next.document) &&
    locatorEquals(current.location, next.location) &&
    Object.is(current.progress, next.progress) &&
    readerSelectionEquals(current.selection, next.selection) &&
    current.activeTocItemId === next.activeTocItemId &&
    readerVisibleContentEquals(current.visibleContent, next.visibleContent) &&
    current.annotationsCount === next.annotationsCount
  )
}

export function useReaderSession(initialSnapshot?: ReaderSessionSnapshot) {
  const [snapshot, setSnapshot] = useState<ReaderSessionSnapshot | undefined>(initialSnapshot)

  const updateSnapshot = useCallback((nextSnapshot: ReaderSessionSnapshot) => {
    setSnapshot((current) => (readerSessionSnapshotEquals(current, nextSnapshot) ? current : nextSnapshot))
  }, [])

  return {
    snapshot,
    updateSnapshot,
  }
}
