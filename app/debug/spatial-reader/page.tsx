import Link from 'next/link'
import { ArrowLeft, Network } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { getReaderDebugFixtures } from '@/lib/reader-debug-fixtures'
import { loadXFeedItems } from '@/lib/data-loaders/x-feed'
import { SpatialReaderWorkbench } from './spatial-reader-workbench'

interface SpatialReaderDebugPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

export default async function SpatialReaderDebugPage({
  searchParams,
}: SpatialReaderDebugPageProps) {
  const [fixtures, xFeedItems] = await Promise.all([
    getReaderDebugFixtures(),
    loadXFeedItems(),
  ])
  const params = await searchParams
  const e2e = Boolean(params?.e2e ?? params?.verify)
  const fixtureParam = params?.fixture
  const initialFixtureId = Array.isArray(fixtureParam) ? fixtureParam[0] : fixtureParam

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
        <SpatialReaderWorkbench
          fixtures={fixtures}
          xFeedItems={xFeedItems}
          initialFixtureId={initialFixtureId}
          e2e={e2e}
        />
      </div>
    </>
  )
}
