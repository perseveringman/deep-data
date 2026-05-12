import Link from 'next/link'
import { ArrowLeft, Network } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { getReaderDebugFixtures } from '@/lib/reader-debug-fixtures'
import { SpatialReaderWorkbench } from './spatial-reader-workbench'

export default async function SpatialReaderDebugPage() {
  const fixtures = await getReaderDebugFixtures()

  return (
    <>
      <header className="sticky top-0 z-50 flex h-10 items-center gap-3 border-b border-border bg-background px-4">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <Link
          href="/debug/readers"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          返回 Reader 调试台
        </Link>
        <div className="h-4 w-px bg-border" />
        <Network className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">Spatial Reader Debug</span>
      </header>

      <div className="space-y-4 px-4 py-3">
        <div className="rounded-lg border bg-card p-4">
          <h1 className="text-xl font-semibold">融合版 Spatial Reader</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            该页面把 Deep-Data 的 Locator/Selection/Highlight 基座与 Shadow Reader 的浮窗、Dock、贝塞尔连线融合在一起。
            五类 reader 都通过同一个 SpatialFrame 接入：选中文本后可创建 AI ThoughtNode，并在窗口内容里继续选中文字发散子节点。
          </p>
        </div>

        <SpatialReaderWorkbench fixtures={fixtures} />
      </div>
    </>
  )
}
