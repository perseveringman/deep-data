# Five-Reader Common Layer Implementation Document

## 1. Purpose

This document defines the shared platform layer that should sit above all five readers:

- `PodcastReader`
- `YouTubeReader`
- `MarkdownReader`
- `EpubReader`
- `PdfReader`

It captures the complete set of common protocols, capabilities, data models, integration boundaries, and extension points discussed so far.

The goal is to ensure that:

1. the readers evolve as one platform rather than five disconnected components
2. future capabilities are added once and reused across formats
3. host applications can integrate the readers without forcing their business formats into the library core

---

## 2. Scope

This document includes all currently discussed common-layer concerns:

1. canonical platform architecture
2. document identity and versioning
3. locators, ranges, and navigation
4. progress and resume
5. TOC, search, and navigation
6. selection and content extraction
7. reader preferences / reader settings
8. translation capability
9. highlights + notes
10. AI analysis bridge
11. persistence boundaries
12. capability declarations
13. session snapshots
14. extension slots / plugin surfaces
15. accessibility and keyboard support
16. offline / cache / prefetch
17. export / migration format
18. telemetry / event bus
19. external format compatibility layer

Nothing in this document is selective. It is intentionally comprehensive.

---

## 3. Design goals

### 3.1 Platform goals

1. One shared protocol layer across all five readers
2. Format-specific rendering engines under a common platform contract
3. Stable, host-friendly public APIs
4. Clear separation between:
   - library-owned canonical state
   - host-owned business state

### 3.2 Product goals

1. Unified UX for shared capabilities
2. Predictable data contracts for persistence and sync
3. Extensibility for translation, annotations, and AI without redesigning the readers later

### 3.3 Engineering goals

1. Minimize internal branching on host-specific schemas
2. Avoid credential and storage coupling
3. Make new shared capabilities additive rather than invasive

---

## 4. Core principles

## 4.1 Canonical-inside, adapted-at-the-edge

The library core owns one canonical format.

Host application formats are converted through codecs/adapters at the boundary.

## 4.2 Shared interaction, not shared physics

The five readers should share:

- settings UI
- note/highlight UX
- translation flows
- AI action surfaces

But they should not pretend that:

- time
- page
- CFI
- anchor

are physically identical location systems.

## 4.3 Library does not own app infrastructure

The library should never own:

- translation API keys
- AI API keys
- persistence backend
- analytics backend
- auth and authorization

## 4.4 Capability-driven UI

Every shared control must be gated by explicit capability declarations.

## 4.5 Data-first extensibility

Shared platform capabilities should be designed around:

- data contracts
- events
- adapters

not just around visible UI components.

---

## 5. Shared platform architecture

The common layer should be implemented as several reusable modules.

```txt
reader-platform/
  identity/
  locators/
  ranges/
  progress/
  toc-search/
  selection/
  preferences/
  annotations/
  translation/
  analysis-bridge/
  capabilities/
  persistence/
  session/
  events/
  extensions/
  codecs/
```

Each reader plugs into this platform via a format adapter.

---

## 6. Canonical shared types

## 6.1 Reader type

```ts
type ReaderType = 'podcast' | 'youtube' | 'markdown' | 'epub' | 'pdf'
```

## 6.2 Document identity

```ts
type ReaderDocumentIdentity = {
  readerType: ReaderType
  documentId: string
  sourceUrl?: string
  contentVersion?: string
  title?: string
  language?: string
  metadata?: Record<string, unknown>
}
```

This is the global primary key for:

- progress
- annotations
- translation cache
- AI context
- session snapshots

## 6.3 Locator

```ts
type ReaderLocator =
  | { kind: 'time'; timeMs: number }
  | { kind: 'page'; page: number; offset?: number }
  | { kind: 'cfi'; cfi: string }
  | { kind: 'anchor'; anchor: string }
```

## 6.4 Range

```ts
type ReaderRange = {
  start: ReaderLocator
  end?: ReaderLocator
  quote?: {
    exact?: string
    prefix?: string
    suffix?: string
  }
}
```

## 6.5 Navigation API

```ts
type ReaderNavigationApi = {
  jumpTo(locator: ReaderLocator): void
  jumpToRange(range: ReaderRange): void
  getCurrentLocator(): ReaderLocator
}
```

## 6.6 Progress

```ts
type ReaderProgressState = {
  documentId: string
  locator: ReaderLocator
  progress?: number
  lastReadAt?: string
}
```

## 6.7 TOC item

```ts
type ReaderTocItem = {
  id: string
  title: string
  locator: ReaderLocator
  level?: number
  children?: ReaderTocItem[]
}
```

## 6.8 Search result

```ts
type ReaderSearchResult = {
  id: string
  text: string
  locator: ReaderLocator
  contextBefore?: string
  contextAfter?: string
}
```

## 6.9 Selection

```ts
type ReaderSelection = {
  text: string
  markdown?: string
  html?: string
  range: ReaderRange
}
```

## 6.10 Active unit

```ts
type ReaderActiveUnit = {
  id?: string
  title?: string
  text?: string
  markdown?: string
  locator: ReaderLocator
}
```

## 6.11 Visible content slice

```ts
type ReaderContentSlice = {
  id: string
  text: string
  markdown?: string
  locator: ReaderLocator
}
```

---

## 7. Reader capabilities

Every reader must declare what it can actually do.

```ts
type ReaderCapabilities = {
  textSelection: boolean
  translation: boolean
  annotations: boolean
  aiContext: boolean
  toc: boolean
  search: boolean
  bookmarks: boolean
  paginatedNavigation: boolean
  continuousScroll: boolean
  jumpToLocator: boolean
  extractVisibleText: boolean
}
```

Capabilities must drive:

- toolbar visibility
- settings panel visibility
- context menu visibility
- extension slot availability
- host integration assumptions

---

## 8. Reader adapter contract

Each reader should integrate with the common layer through an adapter.

```ts
type ReaderAdapter = {
  readerType: ReaderType
  capabilities: ReaderCapabilities

  getSnapshot(): ReaderSessionSnapshot
  getSelection(): ReaderSelection | null
  getVisibleContent(): ReaderContentSlice[]
  getActiveUnit(): ReaderActiveUnit | null

  jumpTo(locator: ReaderLocator): void

  applyHighlights(input: ReaderAnnotation[]): void
  clearHighlights(): void

  translateScope(scope: TranslationScope, result: TranslationResponse): void
}
```

This is the bridge between reader-specific rendering and shared platform features.

---

## 9. Reader preferences / reader settings

This is the full shared preferences system.

## 9.1 Canonical preferences model

```ts
type ReaderConfiguration = {
  preferences: ReaderPreferences
  capabilities: ReaderPreferenceCapabilities
  presets?: ReaderPresetDefinition[]
}
```

```ts
type ReaderPreferences = {
  theme: ReaderThemePreferences
  typography: ReaderTypographyPreferences
  layout: ReaderLayoutPreferences
  behavior: ReaderBehaviorPreferences
}
```

## 9.2 Theme preferences

```ts
type ReaderThemeMode = 'light' | 'dark' | 'sepia' | 'system'

type ReaderThemePreferences = {
  mode: ReaderThemeMode
  accentColor?: string
  surfaceStyle?: 'flat' | 'paper' | 'elevated'
  contrast?: 'normal' | 'high'
}
```

## 9.3 Typography preferences

```ts
type ReaderTypographyPreferences = {
  fontFamily?: string
  fontSize?: number
  lineHeight?: number
  letterSpacing?: number
  paragraphSpacing?: number
  contentWidth?: 'narrow' | 'medium' | 'wide' | 'full'
  textAlign?: 'start' | 'justify'
}
```

## 9.4 Layout preferences

```ts
type ReaderLayoutPreferences = {
  tocVisible?: boolean
  sidebarVisible?: boolean
  sidebarSide?: 'left' | 'right'
  pageGap?: number
  density?: 'comfortable' | 'compact'
}
```

## 9.5 Behavior preferences

```ts
type ReaderBehaviorPreferences = {
  scrollMode?: 'paginated' | 'scrolled'
  autoSaveProgress?: boolean
  reduceMotion?: boolean
  selectionMenu?: boolean
  rememberLastLocation?: boolean
}
```

## 9.6 Preference capabilities

```ts
type ReaderPreferenceCapabilities = {
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
```

## 9.7 Presets

```ts
type ReaderPresetId = 'default' | 'book' | 'paper' | 'compact' | 'focus'

type ReaderPresetDefinition = {
  id: ReaderPresetId
  label: string
  preferences: Partial<ReaderPreferences>
}
```

## 9.8 Preference layers

```ts
type ReaderPreferencesLayers = {
  systemDefaults: ReaderPreferences
  appDefaults?: Partial<ReaderPreferences>
  userDefaults?: Partial<ReaderPreferences>
  documentOverrides?: Partial<ReaderPreferences>
}
```

Final preferences are resolved by layered merge.

## 9.9 Preference controller

```ts
type ReaderConfigController = {
  getPreferences(): ReaderPreferences
  updatePreferences(patch: Partial<ReaderPreferences>): void
  resetPreferences(): void
  applyPreset(presetId: string): void
}
```

## 9.10 Preference persistence

```ts
type ReaderPreferencesChangeEvent = {
  next: ReaderPreferences
  previous: ReaderPreferences
  changedKeys: string[]
  source: 'user' | 'programmatic' | 'reset'
}

type ReaderPreferencesProps = {
  preferences?: Partial<ReaderPreferences>
  defaultPreferences?: Partial<ReaderPreferences>
  onPreferencesChange?: (event: ReaderPreferencesChangeEvent) => void
}
```

The library must apply preferences and emit changes. The host app owns storage.

## 9.11 Preference UI

Provide shared UI:

- `ReaderSettingsPanel`
- `ReaderSettingsTrigger`

The panel must group settings into:

1. appearance
2. text
3. layout
4. behavior

Unsupported options must be hidden or disabled based on capabilities.

## 9.12 Reader-specific preference mapping

### Markdown

Use CSS variables for almost all typography and theme preferences.

### EPUB

Map preferences into `epub.js rendition.themes`.

### PDF

Map preferences into shell/background/page fit/zoom/page gap, not document typography.

### Podcast / YouTube

Apply preferences to transcript, summary, note, and sidebar reading surfaces, not to media players themselves.

---

## 10. Translation capability

Translation is a shared capability, but the library must never own API keys.

## 10.1 Core rule

The library receives an executor. The host app owns credentials and vendor selection.

## 10.2 Supported providers

By design, the system must support:

- Google Translate
- DeepL
- LLM-based translation

The library should model them as provider options, not SDK dependencies.

## 10.3 Translation types

```ts
type TranslationProvider = 'google' | 'deepl' | 'llm'

type TranslationScope = 'selection' | 'active-unit' | 'visible' | 'document'

type TranslationSegment = {
  id: string
  text: string
  locator?: ReaderLocator
}

type TranslationRequest = {
  provider: TranslationProvider
  sourceLang?: string
  targetLang: string
  scope: TranslationScope
  segments: TranslationSegment[]
  readerSnapshot: ReaderSessionSnapshot
}

type TranslationResponse = {
  provider: TranslationProvider
  targetLang: string
  segments: Array<{
    id: string
    translatedText: string
  }>
}

type TranslationExecutor = (
  request: TranslationRequest
) => Promise<TranslationResponse>
```

## 10.4 Scope semantics across five readers

The same scopes must exist for all readers, even though their meaning differs.

### `selection`

- selected transcript range
- selected markdown text
- selected EPUB text
- selected PDF text

### `active-unit`

- podcast/youtube: current transcript window or segment cluster
- markdown: current heading section or active block group
- epub: current page/chapter viewport
- pdf: current page

### `visible`

- currently visible transcript blocks
- currently visible markdown content
- currently visible EPUB viewport content
- currently visible PDF page content if text layer is available

### `document`

Whole document or full text corpus, where technically and product-wise appropriate.

Large documents should not auto-translate by default.

## 10.5 Rendering modes

The platform should support multiple presentation modes:

- `inline`
- `side-by-side`
- `popover`

Recommended defaults:

- document readers: `side-by-side` or inline block translation
- media readers: popover or local transcript expansion

## 10.6 Caching

The host app should own caching, but the cache key design should be standardized:

- `documentId`
- `contentVersion`
- `provider`
- `targetLang`
- `scope`
- `sourceTextHash`

## 10.7 Key security

The library must never accept raw vendor keys as a first-class API. Hosts must pass an executor or service bridge.

---

## 11. Highlights + notes

This is a universal feature across all five readers.

## 11.1 UX goals

The interaction pattern should be consistent:

1. user selects text or a time-based text region
2. selection menu appears
3. user chooses highlight color and/or adds note
4. annotation is rendered in place
5. annotation appears in a shared list
6. clicking annotation list item jumps back to its source location

## 11.2 Canonical annotation model

```ts
type ReaderHighlightColor =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'pink'
  | 'purple'

type ReaderAnnotation = {
  id: string
  documentId: string
  readerType: ReaderType
  color: ReaderHighlightColor
  createdAt: string
  updatedAt?: string
  range: ReaderRange
  bodyMarkdown?: string
  anchors?: Record<string, unknown>
  tags?: string[]
}
```

## 11.3 Markdown body, structured locator

The annotation body must be Markdown.

The annotation location must remain structured JSON, not plain markdown text.

This split is required because:

- note content should be portable and editable
- location must remain precise enough for jump/re-anchor

## 11.4 Storage/export shape

The system should support a markdown-centered export format:

```md
---
id: ann_001
readerType: pdf
documentId: book_123
color: yellow
createdAt: 2026-04-22T23:00:00Z
range:
  start:
    kind: page
    page: 12
  quote:
    exact: "Large language models are..."
    prefix: "In practice, "
    suffix: " for downstream tasks."
anchors:
  pdf:
    page: 12
    rects:
      - [120, 300, 240, 320]
---

This is my **Markdown** note.
```

## 11.5 Reader-specific anchoring

### Markdown

- heading/block anchor
- text offsets
- quote anchoring

### EPUB

- CFI range
- quote anchoring

### PDF

- page
- rects
- quote anchoring

### Podcast / YouTube

- segment id
- time range
- transcript offsets
- quote anchoring

## 11.6 Annotation change contract

```ts
type ReaderAnnotationChange = {
  type: 'create' | 'update' | 'delete'
  annotation: ReaderAnnotation
}

type ReaderAnnotationEvents = {
  onAnnotationChange?: (change: ReaderAnnotationChange) => void
}
```

The library owns creation/edit/render. The host owns storage and sync.

---

## 12. AI analysis bridge

The platform should expose context to external AI systems. It should not embed one built-in AI agent.

## 12.1 Core rule

This is an **AI context bridge**, not an AI implementation.

## 12.2 Access patterns

Support both pull and push.

```ts
type AnalysisContextProvider = {
  getAnalysisContext(): ReaderAnalysisContext
}
```

```ts
type ReaderAnalysisEvents = {
  onAnalysisContextChange?: (context: ReaderAnalysisContext) => void
}
```

## 12.3 Analysis context model

```ts
type ReaderAnalysisContext = {
  document: ReaderDocumentIdentity

  location: {
    locator: ReaderLocator
    progress?: number
  }

  selection?: {
    text: string
    markdown?: string
    range: ReaderRange
  }

  activeUnit?: {
    id?: string
    title?: string
    text?: string
    markdown?: string
    locator: ReaderLocator
  }

  visibleContent: ReaderContentSlice[]

  surroundingContext?: {
    before?: string
    after?: string
  }

  annotations?: ReaderAnnotation[]

  preferences: ReaderPreferences
  capabilities: ReaderCapabilities
}
```

## 12.4 Minimum expectations per reader

### Podcast / YouTube

- current time locator
- active transcript window
- selected transcript text

### Markdown

- current anchor
- active section
- visible block content
- selected text

### EPUB

- current CFI
- current chapter/page viewport
- selected text

### PDF

- current page
- selected text
- current visible page content when available

---

## 13. Progress and resume

Every reader must support persisted progress.

## 13.1 Shared contract

```ts
type ReaderProgressEvents = {
  onProgressChange?: (state: ReaderProgressState) => void
}
```

## 13.2 Required behaviors

1. report last meaningful location
2. support resume at last location
3. surface approximate progress where possible
4. allow host-owned auto-save strategy

## 13.3 Format-specific progress notes

### Podcast / YouTube

- time-based progress

### Markdown

- anchor/scroll-based progress

### EPUB

- CFI-based progress

### PDF

- page-based progress

---

## 14. TOC, search, and navigation

These are not optional platform afterthoughts. They are first-class common capabilities.

## 14.1 Shared TOC surface

```ts
type ReaderTocApi = {
  getToc(): ReaderTocItem[]
}
```

## 14.2 Shared search surface

```ts
type ReaderSearchApi = {
  search(query: string): Promise<ReaderSearchResult[]>
}
```

## 14.3 Shared navigation surface

Already defined through `ReaderNavigationApi`.

## 14.4 Reader-specific sources

### Podcast / YouTube

- chapters
- transcript text

### Markdown

- headings
- block text

### EPUB

- EPUB TOC
- chapter text

### PDF

- outline if available
- page text layer / extracted text

---

## 15. Selection and content extraction

Many shared features depend on these APIs.

## 15.1 Shared extraction API

```ts
type ReaderExtractionApi = {
  getSelection(): ReaderSelection | null
  getVisibleContent(): ReaderContentSlice[]
  getActiveUnit(): ReaderActiveUnit | null
}
```

## 15.2 Why this matters

This powers:

- translation
- annotations
- AI analysis
- context menus
- future summarization or assistant flows

---

## 16. Persistence boundary

The host app may already have its own storage model. The common layer must formalize the boundary rather than owning persistence.

## 16.1 Shared persistence events

```ts
type ReaderPersistenceEvents = {
  onProgressChange?: (payload: ReaderProgressState) => void
  onAnnotationChange?: (payload: ReaderAnnotationChange) => void
  onPreferencesChange?: (payload: ReaderPreferencesChangeEvent) => void
  onSessionSnapshotChange?: (payload: ReaderSessionSnapshot) => void
}
```

## 16.2 Library responsibilities

- apply state
- emit state
- render state

## 16.3 Host responsibilities

- persistence
- sync
- authorization
- multi-device reconciliation

---

## 17. Session snapshots

The platform should support full-session snapshots for:

- AI context
- restore
- debugging
- analytics

## 17.1 Snapshot model

```ts
type ReaderSessionSnapshot = {
  document: ReaderDocumentIdentity
  location: ReaderLocator
  progress?: number
  selection?: ReaderSelection
  activeTocItemId?: string
  visibleContent?: ReaderContentSlice[]
  annotationsCount?: number
  preferences?: ReaderPreferences
}
```

---

## 18. Event bus and telemetry

A unified event model is needed for analytics and host integrations.

## 18.1 Shared event shape

```ts
type ReaderEvent =
  | { type: 'location-changed'; locator: ReaderLocator }
  | { type: 'selection-changed'; selection: ReaderSelection | null }
  | { type: 'annotation-created'; annotationId: string }
  | { type: 'annotation-updated'; annotationId: string }
  | { type: 'annotation-deleted'; annotationId: string }
  | { type: 'preferences-changed'; keys: string[] }
  | { type: 'search-executed'; query: string; resultCount: number }
  | { type: 'translation-requested'; scope: TranslationScope; provider: TranslationProvider }
  | { type: 'analysis-context-exported' }

type ReaderEventHandler = (event: ReaderEvent) => void
```

## 18.2 Usage

This event model should power:

- analytics
- host logging
- automation
- auto-save triggers

---

## 19. Accessibility and keyboard support

This must be a first-class platform concern.

## 19.1 Accessibility requirements

1. keyboard-navigable toolbar
2. keyboard-navigable sidebars
3. readable focus states
4. high-contrast support
5. reduced-motion support
6. meaningful ARIA on shell and controls

## 19.2 Keyboard shortcuts

The platform should standardize shortcuts where possible:

- next/previous unit
- open settings
- open search
- toggle TOC
- create note on selection where sensible

Each reader can extend these if needed.

---

## 20. Offline, caching, and prefetch

Not all readers need identical offline behavior, but the common layer should define the policy surface.

## 20.1 Suggested API

```ts
type ReaderCachePolicy = {
  allowOffline?: boolean
  prefetchScope?: 'none' | 'next-unit' | 'visible' | 'document'
}
```

## 20.2 Notes by format

### EPUB

- local files and object URLs matter

### PDF

- prefetch and binary caching can matter for large files

### Markdown

- whole-document caching is straightforward

### Media readers

- transcript/metadata caching is more important than media asset caching

---

## 21. Export and migration formats

The platform should make future migration possible.

## 21.1 Export targets

1. annotations
2. bookmarks
3. progress
4. preferences
5. session snapshots

## 21.2 Recommended export approach

- annotations: markdown + frontmatter
- progress/preferences/session: versioned JSON

## 21.3 Versioning

```ts
type VersionedPayload<T> = {
  version: string
  data: T
}
```

Versioning is especially important for:

- annotations
- progress
- preferences
- session snapshots

---

## 22. External format compatibility layer

Host applications may already have their own shapes for:

- documents
- locators
- annotations
- progress
- preferences
- AI context

The platform should support that through codecs/adapters, not through core type sprawl.

## 22.1 Rule

Internal core uses canonical format only. Compatibility happens at the edge.

## 22.2 Generic codec

```ts
type ReaderCodec<TExternal, TCanonical> = {
  encode(input: TCanonical): TExternal
  decode(input: TExternal): TCanonical
}
```

## 22.3 Required codec families

1. `DocumentCodec`
2. `LocatorCodec`
3. `AnnotationCodec`
4. `PreferencesCodec`
5. `SessionSnapshotCodec`

## 22.4 Reader integration adapter

```ts
type ReaderIntegrationAdapter<TSource> = {
  content: {
    toIdentity(source: TSource): ReaderDocumentIdentity
    toReaderData(source: TSource): unknown
  }

  state?: {
    locator?: ReaderCodec<unknown, ReaderLocator>
    annotations?: ReaderCodec<unknown, ReaderAnnotation>
    progress?: ReaderCodec<unknown, ReaderProgressState>
    preferences?: ReaderCodec<unknown, ReaderPreferences>
    session?: ReaderCodec<unknown, ReaderSessionSnapshot>
  }

  analysis?: {
    transformContext?: (ctx: ReaderAnalysisContext) => unknown
  }
}
```

## 22.5 Why this is required

Without this layer, the core library will accumulate host-specific branches and become unmaintainable.

---

## 23. Extension and plugin surfaces

Shared capabilities will continue to grow. The platform must expose extension slots.

## 23.1 UI slots

- `toolbarStart`
- `toolbarEnd`
- `selectionMenu`
- `leftSidebarTabs`
- `rightSidebarTabs`
- `footerInfo`

## 23.2 Why this matters

These are required for:

- translation buttons
- AI buttons
- note lists
- glossary cards
- enterprise host extensions

---

## 24. Reader capability matrix (high-level)

| Capability | Podcast | YouTube | Markdown | EPUB | PDF |
|---|---:|---:|---:|---:|---:|
| Theme mode | ✅ | ✅ | ✅ | ✅ | ✅ |
| Typography control | Transcript only | Transcript only | ✅ | ✅ | Limited |
| TOC | Weak | Weak | ✅ | ✅ | Conditional |
| Search | Transcript | Transcript | ✅ | ✅ | Medium |
| Translation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Highlights + notes | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI context export | ✅ | ✅ | ✅ | ✅ | ✅ |
| Jump to locator | Time | Time | Anchor | CFI | Page |

This matrix must drive capabilities, not assumptions.

---

## 25. Implementation order for the common layer

## 25.1 Phase 1 — Foundation contracts

Define and implement:

1. `ReaderDocumentIdentity`
2. `ReaderLocator`
3. `ReaderRange`
4. `ReaderCapabilities`
5. `ReaderSessionSnapshot`

These are the minimum stable foundations.

## 25.2 Phase 2 — Reader preferences

Implement:

- preferences model
- capability-aware settings panel
- CSS variable mapping
- EPUB/PDF/Media preference adapters

## 25.3 Phase 3 — Progress, TOC, search, selection

Implement the shared surfaces that power most higher-level features.

## 25.4 Phase 4 — Annotations and analysis bridge

These build directly on locators, ranges, and extraction APIs.

## 25.5 Phase 5 — Translation

Translation should come after selection, visible-content extraction, and host executors are already stable.

## 25.6 Phase 6 — Compatibility codecs

Formalize adapters/codecs once the canonical model is stable enough to be worth freezing.

---

## 26. Final platform stance

The five-reader platform should be built around:

1. a single canonical internal protocol layer
2. reader-specific rendering engines
3. host-owned infrastructure and credentials
4. capability-driven shared UX
5. adapter/codecs at the host boundary

This approach allows the library to grow from a set of readers into a reusable reading platform without collapsing under format differences or host-specific business schemas.
