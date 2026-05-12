import Link from 'next/link'
import { ArrowLeft, Network } from 'lucide-react'

import { ReaderDebugShell } from './reader-debug-shell'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { getReaderDebugFixtures } from '@/lib/reader-debug-fixtures'

export default async function ReaderDebugPage() {
  const fixtures = await getReaderDebugFixtures()

  return (
    <>
      <header className="sticky top-0 z-10 flex h-10 items-center gap-3 border-b border-border bg-background px-4">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <Link
          href="/contents"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          返回内容库
        </Link>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground">Reader Debug</span>
      </header>

      <div className="space-y-4 px-4 py-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Reader 调试台</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                这里直接加载 <code>content/</code> 下的五种本地样本，便于逐个检查
                YouTube、Podcast、Markdown、PDF 和 EPUB reader 的实际渲染结果。
              </p>
            </div>
            <Link
              href="/debug/spatial-reader"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Network className="h-4 w-4" />
              打开融合版 Spatial Reader
            </Link>
          </div>
        </div>

        <ReaderDebugShell fixtures={fixtures} />
      </div>
    </>
  )
}
