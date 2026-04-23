import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
          <h1 className="text-xl font-semibold">Reader 调试台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            这里直接加载 <code>content/</code> 下的五种本地样本，便于逐个检查
            YouTube、Podcast、Markdown、PDF 和 EPUB reader 的实际渲染结果。
          </p>
        </div>

        <ReaderDebugShell fixtures={fixtures} />
      </div>
    </>
  )
}
