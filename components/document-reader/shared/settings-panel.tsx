'use client'

import { Settings2 } from 'lucide-react'
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
  presets?: ReaderPresetDefinition[]
}

function numberValue(value: number | undefined, fallback: number): number[] {
  return [value ?? fallback]
}

export function ReaderSettingsPanel({
  preferences,
  capabilities,
  onPreferencesChange,
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

      <SheetContent className="w-[24rem] overflow-y-auto sm:max-w-[24rem]">
        <SheetHeader>
          <SheetTitle>阅读器设置</SheetTitle>
          <SheetDescription>所有设置会即时作用在当前阅读器上。</SheetDescription>
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
                <h3 className="text-sm font-semibold">预设</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availablePresets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => onPreferencesChange(preset.preferences)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </section>

              {capabilities.theme.mode ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">主题</h3>
                  <Select
                    value={preferences.theme.mode}
                    onValueChange={(value) =>
                      onPreferencesChange({ theme: { ...preferences.theme, mode: value as ReaderPreferences['theme']['mode'] } })
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

              {capabilities.theme.contrast ? (
                <div className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="text-sm font-medium">高对比度</p>
                    <p className="text-xs text-muted-foreground">增强文字和背景的对比度</p>
                  </div>
                  <Switch
                    checked={preferences.theme.contrast === 'high'}
                    onCheckedChange={(checked) =>
                      onPreferencesChange({ theme: { ...preferences.theme, contrast: checked ? 'high' : 'normal' } })
                    }
                  />
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              {capabilities.typography.fontSize ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>字号</span>
                    <span>{preferences.typography.fontSize ?? 16}px</span>
                  </div>
                  <Slider
                    value={numberValue(preferences.typography.fontSize, 16)}
                    min={12}
                    max={24}
                    step={1}
                    onValueChange={(value) =>
                      onPreferencesChange({ typography: { ...preferences.typography, fontSize: value[0] } })
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
                      onPreferencesChange({ typography: { ...preferences.typography, lineHeight: value[0] } })
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
                      onPreferencesChange({ typography: { ...preferences.typography, contentWidth: value as ReaderPreferences['typography']['contentWidth'] } })
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
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              {capabilities.layout.tocVisible ? (
                <div className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="text-sm font-medium">目录面板</p>
                    <p className="text-xs text-muted-foreground">显示左侧目录导航</p>
                  </div>
                  <Switch
                    checked={preferences.layout.tocVisible ?? true}
                    onCheckedChange={(checked) =>
                      onPreferencesChange({ layout: { ...preferences.layout, tocVisible: checked } })
                    }
                  />
                </div>
              ) : null}

              {capabilities.layout.pageGap ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>页面间距</span>
                    <span>{preferences.layout.pageGap ?? 16}px</span>
                  </div>
                  <Slider
                    value={numberValue(preferences.layout.pageGap, 16)}
                    min={0}
                    max={40}
                    step={2}
                    onValueChange={(value) =>
                      onPreferencesChange({ layout: { ...preferences.layout, pageGap: value[0] } })
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
                      onPreferencesChange({ behavior: { ...preferences.behavior, scrollMode: value as ReaderPreferences['behavior']['scrollMode'] } })
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

              {capabilities.behavior.rememberLastLocation ? (
                <div className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="text-sm font-medium">记住上次位置</p>
                    <p className="text-xs text-muted-foreground">重新打开时恢复到上次阅读位置</p>
                  </div>
                  <Switch
                    checked={preferences.behavior.rememberLastLocation ?? true}
                    onCheckedChange={(checked) =>
                      onPreferencesChange({ behavior: { ...preferences.behavior, rememberLastLocation: checked } })
                    }
                  />
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
