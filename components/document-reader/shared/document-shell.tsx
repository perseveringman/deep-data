'use client'

import { BookOpenText, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import type {
  ReaderCapabilities,
  ReaderLocator,
  ReaderSearchResult,
  ReaderTocItem,
} from '@/components/reader-platform'
import {
  defaultReaderCapabilities,
  defaultReaderPreferenceCapabilities,
  defaultReaderPreferences,
  getReaderPreferenceCssVariables,
  resolveReaderPreferences,
  deepMerge,
  type ReaderPreferenceCapabilities,
  type ReaderPreferences,
  type ReaderPreferencesPatch,
  type ReaderPreferencesChangeEvent,
} from '@/components/reader-platform'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import { ReaderSettingsPanel } from './settings-panel'

export interface DocumentShellProps {
  title?: string
  subtitle?: string
  capabilities?: Partial<ReaderCapabilities>
  preferenceCapabilities?: Partial<ReaderPreferenceCapabilities>
  preferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
  toc?: ReaderTocItem[]
  activeTocId?: string
  onTocSelect?: (item: ReaderTocItem) => void
  searchQuery?: string
  onSearchQueryChange?: (query: string) => void
  searchResults?: ReaderSearchResult[]
  onSearchResultSelect?: (item: ReaderSearchResult) => void
  onPrev?: () => void
  onNext?: () => void
  leftSidebarExtra?: ReactNode
  rightSidebarExtra?: ReactNode
  toolbarStart?: ReactNode
  toolbarEnd?: ReactNode
  content: ReactNode
  footerInfo?: ReactNode
  className?: string
}

function mergePreferenceCapabilities(
  overrides?: Partial<ReaderPreferenceCapabilities>,
): ReaderPreferenceCapabilities {
  return {
    ...defaultReaderPreferenceCapabilities,
    ...overrides,
    theme: { ...defaultReaderPreferenceCapabilities.theme, ...overrides?.theme },
    typography: { ...defaultReaderPreferenceCapabilities.typography, ...overrides?.typography },
    layout: { ...defaultReaderPreferenceCapabilities.layout, ...overrides?.layout },
    behavior: { ...defaultReaderPreferenceCapabilities.behavior, ...overrides?.behavior },
  }
}

function renderTocItems(
  items: ReaderTocItem[],
  {
    activeTocId,
    onTocSelect,
    depth = 0,
  }: {
    activeTocId?: string
    onTocSelect?: (item: ReaderTocItem) => void
    depth?: number
  },
): ReactNode {
  return items.map((item) => (
    <div key={item.id} className="space-y-1">
      <button
        onClick={() => onTocSelect?.(item)}
        className={cn(
          'flex w-full items-start rounded px-2 py-1 text-left text-sm transition-colors hover:bg-muted',
          activeTocId === item.id && 'bg-muted font-medium text-foreground',
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {item.title}
      </button>

      {item.children?.length
        ? renderTocItems(item.children, {
            activeTocId,
            onTocSelect,
            depth: depth + 1,
          })
        : null}
    </div>
  ))
}

export function DocumentShell({
  title,
  subtitle,
  capabilities,
  preferenceCapabilities,
  preferences,
  onPreferencesChange,
  toc = [],
  activeTocId,
  onTocSelect,
  searchQuery = '',
  onSearchQueryChange,
  searchResults = [],
  onSearchResultSelect,
  onPrev,
  onNext,
  leftSidebarExtra,
  rightSidebarExtra,
  toolbarStart,
  toolbarEnd,
  content,
  footerInfo,
  className,
}: DocumentShellProps) {
  const mergedCapabilities = { ...defaultReaderCapabilities, ...capabilities }
  const mergedPreferenceCapabilities = mergePreferenceCapabilities(preferenceCapabilities)
  const mergedPreferences = resolveReaderPreferences({ systemDefaults: defaultReaderPreferences }, preferences)
  const cssVars = getReaderPreferenceCssVariables(mergedPreferences) as CSSProperties

  const emitPreferencePatch = (patch: ReaderPreferencesPatch) => {
    if (!onPreferencesChange) return
    const next = deepMerge(mergedPreferences, patch) as ReaderPreferences
    onPreferencesChange({
      next,
      previous: mergedPreferences,
      changedKeys: Object.keys(patch),
      source: 'user',
    })
  }

  return (
    <div
      className={cn(
        'grid min-h-[calc(100vh-80px)] grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)_20rem]',
        className,
      )}
      style={cssVars}
      data-reader-theme={mergedPreferences.theme.mode}
    >
      <aside className="hidden min-h-0 rounded-lg border bg-card lg:flex lg:flex-col">
        <Tabs defaultValue={mergedCapabilities.toc ? 'toc' : 'search'} className="h-full gap-0">
          <TabsList className="m-3 grid grid-cols-2">
            {mergedCapabilities.toc ? <TabsTrigger value="toc">目录</TabsTrigger> : null}
            {mergedCapabilities.search ? <TabsTrigger value="search">搜索</TabsTrigger> : null}
          </TabsList>

          {mergedCapabilities.toc ? (
            <TabsContent value="toc" className="min-h-0 flex-1">
              <ScrollArea className="h-[calc(100vh-180px)] px-3 pb-3">
                <div className="space-y-1">{renderTocItems(toc, { activeTocId, onTocSelect })}</div>
              </ScrollArea>
            </TabsContent>
          ) : null}

          {mergedCapabilities.search ? (
            <TabsContent value="search" className="min-h-0 flex-1 space-y-3 px-3 pb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange?.(event.target.value)}
                  placeholder="搜索当前内容"
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-2 pr-3">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => onSearchResultSelect?.(result)}
                      className="w-full rounded border p-2 text-left hover:bg-muted"
                    >
                      <p className="text-xs text-muted-foreground">{result.contextBefore}</p>
                      <p className="text-sm">{result.text}</p>
                      <p className="text-xs text-muted-foreground">{result.contextAfter}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ) : null}
        </Tabs>

        {leftSidebarExtra ? <div className="border-t p-3">{leftSidebarExtra}</div> : null}
      </aside>

      <main className="min-w-0 space-y-3">
        <header className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
          <div className="min-w-0 flex-1">
            {subtitle ? <p className="text-xs uppercase tracking-wide text-muted-foreground">{subtitle}</p> : null}
            {title ? <h1 className="truncate text-lg font-semibold">{title}</h1> : null}
          </div>

          {toolbarStart}

          {onPrev ? (
            <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : null}

          {onNext ? (
            <Button variant="outline" size="icon" onClick={onNext} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}

          <ReaderSettingsPanel
            preferences={mergedPreferences}
            capabilities={mergedPreferenceCapabilities}
            onPreferencesChange={emitPreferencePatch}
          />

          {toolbarEnd}
        </header>

        <div
          className={cn(
            'rounded-lg border bg-card',
            mergedPreferences.theme.mode === 'sepia' && 'bg-amber-50/70 dark:bg-amber-950/20',
          )}
        >
          {content}
        </div>

        {footerInfo ? <footer className="text-sm text-muted-foreground">{footerInfo}</footer> : null}
      </main>

      <aside className="hidden min-h-0 rounded-lg border bg-card lg:flex lg:flex-col">
        <div className="border-b p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpenText className="h-4 w-4" />
            阅读上下文
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-180px)] p-3">
          {rightSidebarExtra ?? (
            <p className="text-sm text-muted-foreground">
              这里将用于渲染注释、翻译、AI 分析和其它扩展面板。
            </p>
          )}
        </ScrollArea>
      </aside>
    </div>
  )
}
