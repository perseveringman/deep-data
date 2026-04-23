export type ReaderThemeMode = 'light' | 'dark' | 'sepia' | 'system'

function mergePreferencesValue<T>(...values: Array<Partial<T> | undefined>): T {
  const result: Record<string, unknown> = {}

  for (const value of values) {
    if (!value) continue

    for (const [key, nextValue] of Object.entries(value)) {
      const prevValue = result[key]

      if (
        nextValue &&
        typeof nextValue === 'object' &&
        !Array.isArray(nextValue) &&
        prevValue &&
        typeof prevValue === 'object' &&
        !Array.isArray(prevValue)
      ) {
        result[key] = mergePreferencesValue(
          prevValue as Record<string, unknown>,
          nextValue as Record<string, unknown>,
        )
      } else if (nextValue !== undefined) {
        result[key] = nextValue
      }
    }
  }

  return result as T
}

export interface ReaderThemePreferences {
  mode: ReaderThemeMode
  accentColor?: string
  surfaceStyle?: 'flat' | 'paper' | 'elevated'
  contrast?: 'normal' | 'high'
}

export interface ReaderTypographyPreferences {
  fontFamily?: string
  fontSize?: number
  lineHeight?: number
  letterSpacing?: number
  paragraphSpacing?: number
  contentWidth?: 'narrow' | 'medium' | 'wide' | 'full'
  textAlign?: 'start' | 'justify'
}

export interface ReaderLayoutPreferences {
  tocVisible?: boolean
  sidebarVisible?: boolean
  sidebarSide?: 'left' | 'right'
  pageGap?: number
  density?: 'comfortable' | 'compact'
}

export interface ReaderBehaviorPreferences {
  scrollMode?: 'paginated' | 'scrolled'
  autoSaveProgress?: boolean
  reduceMotion?: boolean
  selectionMenu?: boolean
  rememberLastLocation?: boolean
}

export interface ReaderPreferences {
  theme: ReaderThemePreferences
  typography: ReaderTypographyPreferences
  layout: ReaderLayoutPreferences
  behavior: ReaderBehaviorPreferences
}

export interface ReaderPreferencesPatch {
  theme?: Partial<ReaderThemePreferences>
  typography?: Partial<ReaderTypographyPreferences>
  layout?: Partial<ReaderLayoutPreferences>
  behavior?: Partial<ReaderBehaviorPreferences>
}

export interface ReaderPreferenceCapabilities {
  theme: {
    mode: boolean
    accentColor: boolean
    contrast: boolean
  }
  typography: {
    fontFamily: boolean
    fontSize: boolean
    lineHeight: boolean
    letterSpacing: boolean
    paragraphSpacing: boolean
    contentWidth: boolean
    textAlign: boolean
  }
  layout: {
    tocVisible: boolean
    sidebarVisible: boolean
    sidebarSide: boolean
    pageGap: boolean
    density: boolean
  }
  behavior: {
    scrollMode: boolean
    autoSaveProgress: boolean
    reduceMotion: boolean
    selectionMenu: boolean
    rememberLastLocation: boolean
  }
}

export type ReaderPresetId = 'default' | 'book' | 'paper' | 'compact' | 'focus'

export interface ReaderPresetDefinition {
  id: ReaderPresetId
  label: string
  preferences: ReaderPreferencesPatch
}

export interface ReaderConfiguration {
  preferences: ReaderPreferences
  capabilities: ReaderPreferenceCapabilities
  presets?: ReaderPresetDefinition[]
}

export interface ReaderPreferencesLayers {
  systemDefaults: ReaderPreferences
  appDefaults?: ReaderPreferencesPatch
  userDefaults?: ReaderPreferencesPatch
  documentOverrides?: ReaderPreferencesPatch
}

export interface ReaderPreferencesChangeEvent {
  next: ReaderPreferences
  previous: ReaderPreferences
  changedKeys: string[]
  source: 'user' | 'programmatic' | 'reset'
}

export interface ReaderPreferencesProps {
  preferences?: ReaderPreferencesPatch
  defaultPreferences?: ReaderPreferencesPatch
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
}

export interface ReaderConfigController {
  getPreferences(): ReaderPreferences
  updatePreferences(patch: ReaderPreferencesPatch): void
  resetPreferences(): void
  applyPreset(presetId: string): void
}

export const defaultReaderPreferences: ReaderPreferences = {
  theme: {
    mode: 'system',
    accentColor: 'hsl(var(--primary))',
    surfaceStyle: 'paper',
    contrast: 'normal',
  },
  typography: {
    fontFamily: 'var(--font-sans, ui-sans-serif)',
    fontSize: 16,
    lineHeight: 1.7,
    letterSpacing: 0,
    paragraphSpacing: 1,
    contentWidth: 'medium',
    textAlign: 'start',
  },
  layout: {
    tocVisible: true,
    sidebarVisible: true,
    sidebarSide: 'left',
    pageGap: 16,
    density: 'comfortable',
  },
  behavior: {
    scrollMode: 'paginated',
    autoSaveProgress: true,
    reduceMotion: false,
    selectionMenu: true,
    rememberLastLocation: true,
  },
}

export const defaultReaderPreferenceCapabilities: ReaderPreferenceCapabilities = {
  theme: {
    mode: true,
    accentColor: true,
    contrast: true,
  },
  typography: {
    fontFamily: true,
    fontSize: true,
    lineHeight: true,
    letterSpacing: true,
    paragraphSpacing: true,
    contentWidth: true,
    textAlign: true,
  },
  layout: {
    tocVisible: true,
    sidebarVisible: true,
    sidebarSide: true,
    pageGap: true,
    density: true,
  },
  behavior: {
    scrollMode: true,
    autoSaveProgress: true,
    reduceMotion: true,
    selectionMenu: true,
    rememberLastLocation: true,
  },
}

export const defaultReaderPresets: ReaderPresetDefinition[] = [
  { id: 'default', label: '默认', preferences: {} },
  {
    id: 'book',
    label: 'Book',
    preferences: {
      theme: { mode: 'sepia', surfaceStyle: 'paper' },
      typography: { fontFamily: 'Georgia, Cambria, "Times New Roman", serif', lineHeight: 1.9, contentWidth: 'narrow' },
    },
  },
  {
    id: 'paper',
    label: 'Paper',
    preferences: {
      theme: { mode: 'light', surfaceStyle: 'flat' },
      typography: { contentWidth: 'medium', lineHeight: 1.75, textAlign: 'justify' },
    },
  },
  {
    id: 'compact',
    label: 'Compact',
    preferences: {
      typography: { fontSize: 14, lineHeight: 1.5, paragraphSpacing: 0.75, contentWidth: 'wide' },
      layout: { density: 'compact', pageGap: 8 },
    },
  },
  {
    id: 'focus',
    label: 'Focus',
    preferences: {
      theme: { contrast: 'high' },
      typography: { contentWidth: 'narrow', lineHeight: 1.85 },
    },
  },
]

export function resolveReaderPreferences(
  layers: ReaderPreferencesLayers,
  runtime?: ReaderPreferencesPatch,
): ReaderPreferences {
  return mergePreferencesValue(
    layers.systemDefaults,
    layers.appDefaults,
    layers.userDefaults,
    layers.documentOverrides,
    runtime,
  ) as ReaderPreferences
}

export function getPresetById(presetId: string, presets: ReaderPresetDefinition[] = defaultReaderPresets): ReaderPresetDefinition | undefined {
  return presets.find((preset) => preset.id === presetId)
}

export function getReaderPreferenceCssVariables(preferences: ReaderPreferences): Record<string, string> {
  return {
    '--reader-accent': preferences.theme.accentColor ?? 'hsl(var(--primary))',
    '--reader-font-family': preferences.typography.fontFamily ?? 'var(--font-sans, ui-sans-serif)',
    '--reader-font-size': `${preferences.typography.fontSize ?? 16}px`,
    '--reader-line-height': `${preferences.typography.lineHeight ?? 1.7}`,
    '--reader-letter-spacing': `${preferences.typography.letterSpacing ?? 0}px`,
    '--reader-paragraph-spacing': `${preferences.typography.paragraphSpacing ?? 1}rem`,
    '--reader-content-width':
      preferences.typography.contentWidth === 'narrow'
        ? '42rem'
        : preferences.typography.contentWidth === 'wide'
          ? '72rem'
          : preferences.typography.contentWidth === 'full'
            ? '100%'
            : '56rem',
    '--reader-page-gap': `${preferences.layout.pageGap ?? 16}px`,
  }
}
