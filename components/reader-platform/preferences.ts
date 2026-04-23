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

function getThemePalette(preferences: ReaderPreferences) {
  const mode = preferences.theme.mode
  const highContrast = preferences.theme.contrast === 'high'

  switch (mode) {
    case 'light':
      return {
        canvas: 'oklch(0.985 0 0)',
        surface: 'oklch(1 0 0)',
        text: highContrast ? 'oklch(0.06 0 0)' : 'oklch(0.12 0 0)',
        mutedSurface: 'oklch(0.965 0 0)',
        mutedText: highContrast ? 'oklch(0.18 0 0)' : 'oklch(0.42 0 0)',
        border: highContrast ? 'oklch(0.62 0 0)' : 'oklch(0.88 0 0)',
      }
    case 'dark':
      return {
        canvas: 'oklch(0.08 0 0)',
        surface: 'oklch(0.13 0 0)',
        text: highContrast ? 'oklch(0.99 0 0)' : 'oklch(0.95 0 0)',
        mutedSurface: 'oklch(0.18 0 0)',
        mutedText: highContrast ? 'oklch(0.88 0 0)' : 'oklch(0.7 0 0)',
        border: highContrast ? 'oklch(0.78 0 0)' : 'oklch(0.28 0 0)',
      }
    case 'sepia':
      return {
        canvas: 'oklch(0.96 0.02 82)',
        surface: 'oklch(0.985 0.015 82)',
        text: highContrast ? 'oklch(0.2 0.03 68)' : 'oklch(0.3 0.02 68)',
        mutedSurface: 'oklch(0.94 0.02 82)',
        mutedText: highContrast ? 'oklch(0.32 0.02 70)' : 'oklch(0.48 0.02 70)',
        border: highContrast ? 'oklch(0.55 0.02 75)' : 'oklch(0.85 0.02 80)',
      }
    case 'system':
    default:
      return {
        canvas: 'var(--background)',
        surface: 'var(--card)',
        text: 'var(--card-foreground)',
        mutedSurface: 'var(--muted)',
        mutedText: highContrast ? 'var(--foreground)' : 'var(--muted-foreground)',
        border: highContrast ? 'var(--foreground)' : 'var(--border)',
      }
  }
}

function getSurfaceShadow(preferences: ReaderPreferences): string {
  switch (preferences.theme.surfaceStyle) {
    case 'flat':
      return 'none'
    case 'elevated':
      return preferences.theme.mode === 'dark'
        ? '0 18px 48px rgba(0, 0, 0, 0.35)'
        : '0 18px 48px rgba(15, 23, 42, 0.12)'
    case 'paper':
    default:
      return preferences.theme.mode === 'dark'
        ? '0 8px 24px rgba(0, 0, 0, 0.22)'
        : '0 8px 24px rgba(15, 23, 42, 0.06)'
  }
}

export function getReaderPreferenceCssVariables(preferences: ReaderPreferences): Record<string, string> {
  const palette = getThemePalette(preferences)
  const compactDensity = preferences.layout.density === 'compact'

  return {
    '--reader-accent': preferences.theme.accentColor ?? 'hsl(var(--primary))',
    '--reader-accent-soft': `color-mix(in oklch, ${preferences.theme.accentColor ?? 'hsl(var(--primary))'} 14%, transparent)`,
    '--reader-canvas-background': palette.canvas,
    '--reader-surface-background': palette.surface,
    '--reader-surface-foreground': palette.text,
    '--reader-muted-background': palette.mutedSurface,
    '--reader-muted-foreground': palette.mutedText,
    '--reader-border-color': palette.border,
    '--reader-surface-shadow': getSurfaceShadow(preferences),
    '--reader-font-family': preferences.typography.fontFamily ?? 'var(--font-sans, ui-sans-serif)',
    '--reader-font-size': `${preferences.typography.fontSize ?? 16}px`,
    '--reader-body-font-size': `calc(${preferences.typography.fontSize ?? 16}px * 0.78)`,
    '--reader-meta-font-size': `calc(${preferences.typography.fontSize ?? 16}px * 0.66)`,
    '--reader-title-font-size': `calc(${preferences.typography.fontSize ?? 16}px * 0.72)`,
    '--reader-line-height': `${preferences.typography.lineHeight ?? 1.7}`,
    '--reader-letter-spacing': `${preferences.typography.letterSpacing ?? 0}px`,
    '--reader-paragraph-spacing': `${preferences.typography.paragraphSpacing ?? 1}rem`,
    '--reader-text-align': preferences.typography.textAlign ?? 'start',
    '--reader-content-width':
      preferences.typography.contentWidth === 'narrow'
        ? '42rem'
        : preferences.typography.contentWidth === 'wide'
          ? '72rem'
          : preferences.typography.contentWidth === 'full'
            ? '100%'
            : '56rem',
    '--reader-page-gap': `${preferences.layout.pageGap ?? 16}px`,
    '--reader-grid-gap': compactDensity ? '0.75rem' : '1rem',
    '--reader-panel-padding': compactDensity ? '0.75rem' : '1rem',
    '--reader-toolbar-padding': compactDensity ? '0.75rem' : '1rem',
    '--reader-sidebar-width': compactDensity ? '18rem' : '20rem',
    '--reader-nav-width': compactDensity ? '16rem' : '18rem',
  }
}
