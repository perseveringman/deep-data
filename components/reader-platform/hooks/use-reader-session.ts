'use client'

import { useCallback, useState } from 'react'

import type { ReaderSessionSnapshot } from '@/components/reader-platform/core'

export function useReaderSession(initialSnapshot?: ReaderSessionSnapshot) {
  const [snapshot, setSnapshot] = useState<ReaderSessionSnapshot | undefined>(initialSnapshot)

  const updateSnapshot = useCallback((nextSnapshot: ReaderSessionSnapshot) => {
    setSnapshot(nextSnapshot)
  }, [])

  return {
    snapshot,
    updateSnapshot,
  }
}
