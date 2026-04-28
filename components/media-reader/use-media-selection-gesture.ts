'use client'

import { useCallback, useMemo, useRef } from 'react'

function hasActiveTextSelection() {
  if (typeof window === 'undefined') return false

  const selection = window.getSelection()
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim())
}

export function useMediaSelectionGesture() {
  const hadSelectionOnPointerDownRef = useRef(false)
  const suppressSeekRef = useRef(false)

  const syncAfterGesture = useCallback(() => {
    window.requestAnimationFrame(() => {
      const hasSelection = hasActiveTextSelection()
      suppressSeekRef.current = hasSelection || hadSelectionOnPointerDownRef.current
      hadSelectionOnPointerDownRef.current = false
    })
  }, [])

  const handlePointerDownCapture = useCallback(() => {
    const hasSelection = hasActiveTextSelection()
    hadSelectionOnPointerDownRef.current = hasSelection
    suppressSeekRef.current = hasSelection
  }, [])

  const handlePointerUpCapture = useCallback(() => {
    syncAfterGesture()
  }, [syncAfterGesture])

  const handleKeyUpCapture = useCallback(() => {
    syncAfterGesture()
  }, [syncAfterGesture])

  const shouldSuppressSeek = useCallback(() => {
    return suppressSeekRef.current || hasActiveTextSelection()
  }, [])

  return useMemo(
    () => ({
      handlePointerDownCapture,
      handlePointerUpCapture,
      handleKeyUpCapture,
      shouldSuppressSeek,
      syncAfterGesture,
    }),
    [
      handleKeyUpCapture,
      handlePointerDownCapture,
      handlePointerUpCapture,
      shouldSuppressSeek,
      syncAfterGesture,
    ],
  )
}
