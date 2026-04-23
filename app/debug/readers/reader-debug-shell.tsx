'use client'

import dynamic from 'next/dynamic'

import type { ReaderDebugFixture } from '@/lib/reader-debug-fixtures'

const ReaderDebugWorkbench = dynamic(
  () =>
    import('./reader-debug-workbench').then(
      (module) => module.ReaderDebugWorkbench,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        正在加载 reader 调试工作台…
      </div>
    ),
  },
)

export function ReaderDebugShell({
  fixtures,
}: {
  fixtures: ReaderDebugFixture[]
}) {
  return <ReaderDebugWorkbench fixtures={fixtures} />
}
