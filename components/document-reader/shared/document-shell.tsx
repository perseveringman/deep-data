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
  type ReaderPreferenceCapabilities,
  type ReaderPreferencesPatch,
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
  onPreferencesChange?: (patch: ReaderPreferencesPatch) => void
  onPreferencesReset?: () => void
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
  contentOverlay?: ReactNode
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
          activeTocId === item.id && 'font-medium',
        )}
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          ...(activeTocId === item.id
            ? {
                backgroundColor: 'var(--reader-accent-soft)',
                color: 'var(--reader-accent)',
              }
            : {}),
        }}
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
  onPreferencesReset,
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
  contentOverlay,
  footerInfo,
  className,
}: DocumentShellProps) {
  const mergedCapabilities = { ...defaultReaderCapabilities, ...capabilities }
  const mergedPreferenceCapabilities = mergePreferenceCapabilities(preferenceCapabilities)
  const mergedPreferences = resolveReaderPreferences({ systemDefaults: defaultReaderPreferences }, preferences)
  const cssVars = getReaderPreferenceCssVariables(mergedPreferences) as CSSProperties
  const showNavigationPanel =
    mergedPreferences.layout.tocVisible !== false && (mergedCapabilities.toc || mergedCapabilities.search)
  const showContextSidebar = mergedPreferences.layout.sidebarVisible !== false
  const contextSidebarOnLeft = showContextSidebar && mergedPreferences.layout.sidebarSide === 'left'
  const panelStyle = {
    backgroundColor: 'var(--reader-surface-background)',
    color: 'var(--reader-surface-foreground)',
    borderColor: 'var(--reader-border-color)',
    boxShadow: 'var(--reader-surface-shadow)',
  } satisfies CSSProperties
  const mutedPanelStyle = {
    backgroundColor: 'var(--reader-muted-background)',
    color: 'var(--reader-muted-foreground)',
    borderColor: 'var(--reader-border-color)',
  } satisfies CSSProperties

  return (
    <div
      className={cn(
        'grid min-h-[calc(100vh-80px)] grid-cols-1 gap-[var(--reader-grid-gap)]',
        showNavigationPanel && showContextSidebar
          ? contextSidebarOnLeft
            ? 'lg:grid-cols-[var(--reader-sidebar-width)_minmax(0,1fr)_var(--reader-nav-width)]'
            : 'lg:grid-cols-[var(--reader-nav-width)_minmax(0,1fr)_var(--reader-sidebar-width)]'
          : showNavigationPanel
            ? 'lg:grid-cols-[var(--reader-nav-width)_minmax(0,1fr)]'
            : showContextSidebar
              ? contextSidebarOnLeft
                ? 'lg:grid-cols-[var(--reader-sidebar-width)_minmax(0,1fr)]'
                : 'lg:grid-cols-[minmax(0,1fr)_var(--reader-sidebar-width)]'
              : 'lg:grid-cols-[minmax(0,1fr)]',
        className,
      )}
      style={{
        ...cssVars,
        backgroundColor: 'var(--reader-canvas-background)',
        color: 'var(--reader-surface-foreground)',
      }}
      data-reader-theme={mergedPreferences.theme.mode}
    >
      {showNavigationPanel && !contextSidebarOnLeft ? (
        <aside className="hidden min-h-0 rounded-lg border lg:flex lg:flex-col" style={panelStyle}>
          <Tabs defaultValue={mergedCapabilities.toc ? 'toc' : 'search'} className="h-full gap-0">
            <TabsList className="m-3 grid grid-cols-2" style={mutedPanelStyle}>
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
                        className="w-full rounded border p-2 text-left hover:bg-muted/70"
                        style={mutedPanelStyle}
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

          {leftSidebarExtra ? (
            <div className="border-t p-[var(--reader-panel-padding)]" style={{ borderColor: 'var(--reader-border-color)' }}>
              {leftSidebarExtra}
            </div>
          ) : null}
        </aside>
      ) : null}

      {showContextSidebar && contextSidebarOnLeft ? (
        <aside className="hidden min-h-0 rounded-lg border lg:flex lg:flex-col" style={panelStyle}>
          <div
            className="border-b p-[var(--reader-panel-padding)]"
            style={{ borderColor: 'var(--reader-border-color)' }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpenText className="h-4 w-4" />
              阅读上下文
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-180px)] p-[var(--reader-panel-padding)]">
            {rightSidebarExtra ?? (
              <p className="text-sm text-muted-foreground">
                这里将用于渲染注释、翻译、AI 分析和其它扩展面板。
              </p>
            )}
          </ScrollArea>
        </aside>
      ) : null}

      <main className="min-w-0 space-y-3">
        <header
          className="flex flex-wrap items-center gap-2 rounded-lg border p-[var(--reader-toolbar-padding)]"
          style={panelStyle}
        >
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
            onPreferencesChange={(patch) => onPreferencesChange?.(patch)}
            onReset={onPreferencesReset}
          />

          {toolbarEnd}
        </header>

        <div
          className={cn(
            'relative rounded-lg border',
          )}
          style={panelStyle}
        >
          {content}
          {contentOverlay}
        </div>

        {footerInfo ? <footer className="text-sm text-muted-foreground">{footerInfo}</footer> : null}
      </main>

      {showNavigationPanel && contextSidebarOnLeft ? (
        <aside className="hidden min-h-0 rounded-lg border lg:flex lg:flex-col" style={panelStyle}>
          <Tabs defaultValue={mergedCapabilities.toc ? 'toc' : 'search'} className="h-full gap-0">
            <TabsList className="m-3 grid grid-cols-2" style={mutedPanelStyle}>
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
                        className="w-full rounded border p-2 text-left hover:bg-muted/70"
                        style={mutedPanelStyle}
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

          {leftSidebarExtra ? (
            <div className="border-t p-[var(--reader-panel-padding)]" style={{ borderColor: 'var(--reader-border-color)' }}>
              {leftSidebarExtra}
            </div>
          ) : null}
        </aside>
      ) : null}

      {showContextSidebar && !contextSidebarOnLeft ? (
        <aside className="hidden min-h-0 rounded-lg border lg:flex lg:flex-col" style={panelStyle}>
          <div
            className="border-b p-[var(--reader-panel-padding)]"
            style={{ borderColor: 'var(--reader-border-color)' }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpenText className="h-4 w-4" />
              阅读上下文
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-180px)] p-[var(--reader-panel-padding)]">
            {rightSidebarExtra ?? (
              <p className="text-sm text-muted-foreground">
                这里将用于渲染注释、翻译、AI 分析和其它扩展面板。
              </p>
            )}
          </ScrollArea>
        </aside>
      ) : null}
    </div>
  )
}
