'use client'

import { RotateCcw, Settings2 } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  defaultReaderPresets,
  type ReaderPreferenceCapabilities,
  type ReaderPreferences,
  type ReaderPreferencesPatch,
  type ReaderPresetDefinition,
} from '@/components/reader-platform'

interface ReaderSettingsPanelProps {
  preferences: ReaderPreferences
  capabilities: ReaderPreferenceCapabilities
  onPreferencesChange: (patch: ReaderPreferencesPatch) => void
  onReset?: () => void
  presets?: ReaderPresetDefinition[]
}

const accentColorOptions = [
  { label: '默认', value: 'hsl(var(--primary))' },
  { label: '蓝色', value: 'oklch(0.58 0.19 255)' },
  { label: '青色', value: 'oklch(0.68 0.15 205)' },
  { label: '绿色', value: 'oklch(0.68 0.18 145)' },
  { label: '紫色', value: 'oklch(0.62 0.21 305)' },
  { label: '红色', value: 'oklch(0.61 0.23 25)' },
] as const

const fontFamilyOptions = [
  { label: '无衬线', value: 'var(--font-sans, ui-sans-serif)' },
  { label: '衬线', value: 'var(--font-serif, Georgia, serif)' },
  { label: '等宽', value: 'var(--font-mono, ui-monospace)' },
  { label: '图书', value: 'Georgia, Cambria, "Times New Roman", serif' },
] as const

function numberValue(value: number | undefined, fallback: number): number[] {
  return [value ?? fallback]
}

function preferencePatchMatches(
  patch: ReaderPreferencesPatch,
  preferences: ReaderPreferences,
): boolean {
  if (Object.keys(patch).length === 0) {
    return false
  }

  return Object.entries(patch).every(([groupKey, groupValue]) => {
    if (!groupValue || typeof groupValue !== 'object') return true

    return Object.entries(groupValue).every(([key, value]) => {
      const currentGroup = preferences[groupKey as keyof ReaderPreferences]
      if (!currentGroup || typeof currentGroup !== 'object') return false
      return currentGroup[key as keyof typeof currentGroup] === value
    })
  })
}

function SettingSwitch({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded border p-3">
      <div className="pr-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function ReaderSettingsPanel({
  preferences,
  capabilities,
  onPreferencesChange,
  onReset,
  presets = defaultReaderPresets,
}: ReaderSettingsPanelProps) {
  const availablePresets = useMemo(
    () => presets.filter((preset) => Object.keys(preset.preferences).length > 0 || preset.id === 'default'),
    [presets],
  )

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Reader settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[28rem] overflow-y-auto sm:max-w-[28rem]">
        <SheetHeader className="gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>阅读器设置</SheetTitle>
              <SheetDescription>所有设置会即时作用在当前阅读器上。</SheetDescription>
            </div>

            {onReset ? (
              <Button variant="outline" size="sm" onClick={onReset}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                恢复默认
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="px-4 pb-4">
          <Tabs defaultValue="appearance" className="gap-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="appearance">外观</TabsTrigger>
              <TabsTrigger value="text">文字</TabsTrigger>
              <TabsTrigger value="layout">布局</TabsTrigger>
              <TabsTrigger value="behavior">行为</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4">
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">预设</h3>
                  <span className="text-xs text-muted-foreground">一键切换常用阅读风格</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {availablePresets.map((preset) => {
                    const isActive = preferencePatchMatches(preset.preferences, preferences)
                    return (
                      <Button
                        key={preset.id}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPreferencesChange(preset.preferences)}
                      >
                        {preset.label}
                      </Button>
                    )
                  })}
                </div>
              </section>

              {capabilities.theme.mode ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">主题</h3>
                  <Select
                    value={preferences.theme.mode}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        theme: {
                          ...preferences.theme,
                          mode: value as ReaderPreferences['theme']['mode'],
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">跟随系统</SelectItem>
                      <SelectItem value="light">浅色</SelectItem>
                      <SelectItem value="dark">深色</SelectItem>
                      <SelectItem value="sepia">护眼</SelectItem>
                    </SelectContent>
                  </Select>
                </section>
              ) : null}

              {capabilities.theme.accentColor ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">强调色</h3>
                    <span className="text-xs text-muted-foreground">用于链接与选中态</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {accentColorOptions.map((option) => {
                      const isActive = (preferences.theme.accentColor ?? 'hsl(var(--primary))') === option.value
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            onPreferencesChange({
                              theme: { ...preferences.theme, accentColor: option.value },
                            })
                          }
                          className="justify-start gap-2"
                        >
                          <span
                            className="h-3 w-3 rounded-full border"
                            style={{ backgroundColor: option.value }}
                          />
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                </section>
              ) : null}

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">表面样式</h3>
                <Select
                  value={preferences.theme.surfaceStyle ?? 'paper'}
                  onValueChange={(value) =>
                    onPreferencesChange({
                      theme: {
                        ...preferences.theme,
                        surfaceStyle: value as NonNullable<ReaderPreferences['theme']['surfaceStyle']>,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">平面</SelectItem>
                    <SelectItem value="paper">纸张</SelectItem>
                    <SelectItem value="elevated">浮起</SelectItem>
                  </SelectContent>
                </Select>
              </section>

              {capabilities.theme.contrast ? (
                <SettingSwitch
                  title="高对比度"
                  description="增强文字与背景对比，提升可读性"
                  checked={preferences.theme.contrast === 'high'}
                  onCheckedChange={(checked) =>
                    onPreferencesChange({
                      theme: { ...preferences.theme, contrast: checked ? 'high' : 'normal' },
                    })
                  }
                />
              ) : null}
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              {capabilities.typography.fontFamily ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">字体</h3>
                  <Select
                    value={preferences.typography.fontFamily ?? 'var(--font-sans, ui-sans-serif)'}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        typography: { ...preferences.typography, fontFamily: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>
              ) : null}

              {capabilities.typography.fontSize ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>字号</span>
                    <span>{preferences.typography.fontSize ?? 16}px</span>
                  </div>
                  <Slider
                    value={numberValue(preferences.typography.fontSize, 16)}
                    min={12}
                    max={28}
                    step={1}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        typography: { ...preferences.typography, fontSize: value[0] },
                      })
                    }
                  />
                </section>
              ) : null}

              {capabilities.typography.lineHeight ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>行高</span>
                    <span>{preferences.typography.lineHeight ?? 1.7}</span>
                  </div>
                  <Slider
                    value={numberValue(preferences.typography.lineHeight, 1.7)}
                    min={1.2}
                    max={2.4}
                    step={0.05}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        typography: { ...preferences.typography, lineHeight: value[0] },
                      })
                    }
                  />
                </section>
              ) : null}

              {capabilities.typography.letterSpacing ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>字间距</span>
                    <span>{preferences.typography.letterSpacing ?? 0}px</span>
                  </div>
                  <Slider
                    value={numberValue(preferences.typography.letterSpacing, 0)}
                    min={-0.5}
                    max={3}
                    step={0.1}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        typography: { ...preferences.typography, letterSpacing: value[0] },
                      })
                    }
                  />
                </section>
              ) : null}

              {capabilities.typography.paragraphSpacing ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>段落间距</span>
                    <span>{preferences.typography.paragraphSpacing ?? 1}rem</span>
                  </div>
                  <Slider
                    value={numberValue(preferences.typography.paragraphSpacing, 1)}
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        typography: { ...preferences.typography, paragraphSpacing: value[0] },
                      })
                    }
                  />
                </section>
              ) : null}

              {capabilities.typography.contentWidth ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">内容宽度</h3>
                  <Select
                    value={preferences.typography.contentWidth}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        typography: {
                          ...preferences.typography,
                          contentWidth: value as ReaderPreferences['typography']['contentWidth'],
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="narrow">窄</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="wide">宽</SelectItem>
                      <SelectItem value="full">全宽</SelectItem>
                    </SelectContent>
                  </Select>
                </section>
              ) : null}

              {capabilities.typography.textAlign ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">对齐方式</h3>
                  <Select
                    value={preferences.typography.textAlign ?? 'start'}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        typography: {
                          ...preferences.typography,
                          textAlign: value as NonNullable<ReaderPreferences['typography']['textAlign']>,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">左对齐</SelectItem>
                      <SelectItem value="justify">两端对齐</SelectItem>
                    </SelectContent>
                  </Select>
                </section>
              ) : null}
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              {capabilities.layout.tocVisible ? (
                <SettingSwitch
                  title="导航面板"
                  description="显示目录与搜索等左侧导航面板"
                  checked={preferences.layout.tocVisible ?? true}
                  onCheckedChange={(checked) =>
                    onPreferencesChange({
                      layout: { ...preferences.layout, tocVisible: checked },
                    })
                  }
                />
              ) : null}

              {capabilities.layout.sidebarVisible ? (
                <SettingSwitch
                  title="上下文侧栏"
                  description="显示注释、翻译与 AI 上下文侧栏"
                  checked={preferences.layout.sidebarVisible ?? true}
                  onCheckedChange={(checked) =>
                    onPreferencesChange({
                      layout: { ...preferences.layout, sidebarVisible: checked },
                    })
                  }
                />
              ) : null}

              {capabilities.layout.sidebarSide ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">侧栏位置</h3>
                  <Select
                    value={preferences.layout.sidebarSide ?? 'right'}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        layout: {
                          ...preferences.layout,
                          sidebarSide: value as NonNullable<ReaderPreferences['layout']['sidebarSide']>,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">左侧</SelectItem>
                      <SelectItem value="right">右侧</SelectItem>
                    </SelectContent>
                  </Select>
                </section>
              ) : null}

              {capabilities.layout.density ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">界面密度</h3>
                  <Select
                    value={preferences.layout.density ?? 'comfortable'}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        layout: {
                          ...preferences.layout,
                          density: value as NonNullable<ReaderPreferences['layout']['density']>,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comfortable">舒适</SelectItem>
                      <SelectItem value="compact">紧凑</SelectItem>
                    </SelectContent>
                  </Select>
                </section>
              ) : null}

              {capabilities.layout.pageGap ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>页面/面板间距</span>
                    <span>{preferences.layout.pageGap ?? 16}px</span>
                  </div>
                  <Slider
                    value={numberValue(preferences.layout.pageGap, 16)}
                    min={0}
                    max={40}
                    step={2}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        layout: { ...preferences.layout, pageGap: value[0] },
                      })
                    }
                  />
                </section>
              ) : null}
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              {capabilities.behavior.scrollMode ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">阅读模式</h3>
                  <Select
                    value={preferences.behavior.scrollMode}
                    onValueChange={(value) =>
                      onPreferencesChange({
                        behavior: {
                          ...preferences.behavior,
                          scrollMode: value as ReaderPreferences['behavior']['scrollMode'],
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paginated">分页</SelectItem>
                      <SelectItem value="scrolled">滚动</SelectItem>
                    </SelectContent>
                  </Select>
                </section>
              ) : null}

              {capabilities.behavior.autoSaveProgress ? (
                <SettingSwitch
                  title="自动保存进度"
                  description="把当前阅读位置保存到本地，供下次恢复"
                  checked={preferences.behavior.autoSaveProgress ?? true}
                  onCheckedChange={(checked) =>
                    onPreferencesChange({
                      behavior: { ...preferences.behavior, autoSaveProgress: checked },
                    })
                  }
                />
              ) : null}

              {capabilities.behavior.selectionMenu ? (
                <SettingSwitch
                  title="选区快捷菜单"
                  description="选择文本后显示翻译、高亮与笔记快捷操作"
                  checked={preferences.behavior.selectionMenu ?? true}
                  onCheckedChange={(checked) =>
                    onPreferencesChange({
                      behavior: { ...preferences.behavior, selectionMenu: checked },
                    })
                  }
                />
              ) : null}

              {capabilities.behavior.reduceMotion ? (
                <SettingSwitch
                  title="减少动效"
                  description="关闭平滑滚动等动画，降低视觉干扰"
                  checked={preferences.behavior.reduceMotion ?? false}
                  onCheckedChange={(checked) =>
                    onPreferencesChange({
                      behavior: { ...preferences.behavior, reduceMotion: checked },
                    })
                  }
                />
              ) : null}

              {capabilities.behavior.rememberLastLocation ? (
                <SettingSwitch
                  title="记住上次位置"
                  description="重新打开内容时优先恢复到上次阅读位置"
                  checked={preferences.behavior.rememberLastLocation ?? true}
                  onCheckedChange={(checked) =>
                    onPreferencesChange({
                      behavior: { ...preferences.behavior, rememberLastLocation: checked },
                    })
                  }
                />
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
