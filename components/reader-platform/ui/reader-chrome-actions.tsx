'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const ReaderChromeActionsContext = createContext<HTMLElement | null | undefined>(undefined)

export function ReaderChromeActionsProvider({
  target,
  children,
}: {
  target: HTMLElement | null
  children: ReactNode
}) {
  return (
    <ReaderChromeActionsContext.Provider value={target}>
      {children}
    </ReaderChromeActionsContext.Provider>
  )
}

export function useReaderChromeActionsTarget() {
  return useContext(ReaderChromeActionsContext)
}

export function ReaderChromeActions({ children }: { children: ReactNode }) {
  const target = useReaderChromeActionsTarget()

  if (target === undefined) return <>{children}</>
  if (!target) return null

  return createPortal(children, target)
}
