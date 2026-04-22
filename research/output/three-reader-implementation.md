# Markdown / EPUB / PDF Readers Implementation Document

## 1. Purpose

This document defines the implementation plan for adding three new React-based readers to the reusable reader library:

- `MarkdownReader`
- `EpubReader`
- `PdfReader`

It covers:

- engine selection and trade-offs
- public API design
- internal architecture
- shared shell requirements
- per-format data models
- rollout order
- technical risks and mitigation

This document is implementation-oriented. It is intended to be used as the reference when the next development phase starts.

---

## 2. Context

The existing reusable reader library already covers:

- `PodcastReader`
- `YouTubeReader`

Those two readers proved that a **high-level React component API** is the right direction:

- consumers should render a complete reader with a single component
- the library should own shared layout and interaction logic
- host apps should not be forced to assemble many low-level primitives

The next step is to extend the library into document-reading formats without losing that same product philosophy.

---

## 3. Goals

### 3.1 Primary goals

1. Add three new high-level readers that other applications can adopt quickly.
2. Keep the implementation React-only.
3. Reuse one shared **document-reader shell** across Markdown, EPUB, and PDF.
4. Preserve format-specific rendering engines where needed instead of over-normalizing.
5. Keep the public API stable, high-level, and host-app friendly.

### 3.2 Secondary goals

1. Prepare the architecture for later shared enhancements:
   - translation
   - highlights + notes
   - AI analysis bridge
   - shared reader preferences
2. Keep Next.js-specific behavior outside the reusable core.
3. Keep persistence, credentials, and business-specific storage in host applications.

### 3.3 Non-goals

1. Do not build one universal renderer for all document formats.
2. Do not force one locator model to behave identically across all formats.
3. Do not embed translation vendors, AI vendors, or storage vendors into the core readers.

---

## 4. Design principles

### 4.1 Shared shell, format-specific engines

The library should standardize:

- chrome
- navigation UI
- loading / error states
- preferences
- selection / annotation contracts
- context export

The library should **not** standardize the actual rendering engine into a single abstraction that hides important format differences.

### 4.2 High-level external API

Each reader should expose a complete, usable component:

- `MarkdownReader`
- `EpubReader`
- `PdfReader`

Consumers should not be required to wire internal renderer primitives manually.

### 4.3 Canonical internal model

The core library should own one internal canonical format for:

- document identity
- locators
- progress
- annotations
- preferences
- analysis context

All host-specific models must be adapted at the boundary.

### 4.4 Host-owned integrations

The host app must continue to own:

- storage
- sync
- auth
- API keys
- translation execution
- AI execution
- analytics backends

The library owns rendering and interaction, not application infrastructure.

---

## 5. Reader family architecture

## 5.1 Current library shape

There are now effectively two reader families:

### Media readers

- `PodcastReader`
- `YouTubeReader`

These are time-based readers with transcripts and structured side content.

### Document readers

- `MarkdownReader`
- `EpubReader`
- `PdfReader`

These are page/section-based readers with document navigation and reading preferences.

## 5.2 Recommended code layout

```txt
components/
  media-reader/
    ...existing media readers...

  document-reader/
    index.ts

    core/
      types.ts
      identity.ts
      locators.ts
      progress.ts
      search.ts
      shell-state.ts

    shared/
      document-shell.tsx
      toolbar.tsx
      toc-panel.tsx
      search-panel.tsx
      loading-state.tsx
      error-state.tsx
      theme-provider.tsx

    markdown/
      markdown-reader.tsx
      markdown-renderer.tsx
      markdown-search.ts
      markdown-toc.ts
      markdown-locators.ts

    epub/
      epub-reader.tsx
      epub-engine.ts
      epub-theme.ts
      epub-selection.ts
      epub-locators.ts

    pdf/
      pdf-reader.tsx
      pdf-engine.tsx
      pdf-worker.ts
      pdf-search.ts
      pdf-locators.ts

    adapters/
      react-pdf-viewer-adapter.tsx
```

The `document-reader` family should be separate from `media-reader`, but it should share higher-level protocols through future common modules.

---

## 6. Shared document-reader shell

Markdown, EPUB, and PDF should share one shell with the following responsibilities.

## 6.1 Required shell capabilities

1. Toolbar
2. TOC sidebar
3. Search sidebar / search results panel
4. Loading / empty / error states
5. Theme and typography integration
6. Persisted location hooks
7. Capability-aware control visibility
8. Extension slots for future features

## 6.2 Shell responsibilities

The shell should own:

- layout structure
- visible chrome state
- sidebar open/close state
- toolbar actions
- preference application at shell level
- capability-based feature gating

The shell should not own:

- raw document parsing
- EPUB rendition internals
- PDF page rendering internals
- format-specific location math

## 6.3 Shell extension points

The shell should expose at least:

- `toolbarStart`
- `toolbarEnd`
- `leftSidebarTabs`
- `rightSidebarTabs`
- `selectionMenu`
- `footerInfo`

These extension points are required for future translation, annotations, AI actions, and host-specific UI.

---

## 7. Canonical document-reader types

The document-reader family should be built on shared canonical types.

## 7.1 Document identity

```ts
type ReaderDocumentIdentity = {
  readerType: 'markdown' | 'epub' | 'pdf'
  documentId: string
  sourceUrl?: string
  contentVersion?: string
  title?: string
  language?: string
  metadata?: Record<string, unknown>
}
```

## 7.2 TOC item

```ts
type ReaderTocItem = {
  id: string
  title: string
  locator: ReaderLocator
  level?: number
  children?: ReaderTocItem[]
}
```

## 7.3 Search result

```ts
type ReaderSearchResult = {
  id: string
  text: string
  locator: ReaderLocator
  contextBefore?: string
  contextAfter?: string
}
```

## 7.4 Progress

```ts
type ReaderProgressState = {
  documentId: string
  locator: ReaderLocator
  progress?: number
  lastReadAt?: string
}
```

---

## 8. Locator model for new document readers

The shell must standardize interfaces for navigation, but each format keeps a specific locator representation.

## 8.1 Canonical locator

```ts
type ReaderLocator =
  | { kind: 'anchor'; anchor: string }
  | { kind: 'cfi'; cfi: string }
  | { kind: 'page'; page: number; offset?: number }
```

## 8.2 Per-format mapping

### Markdown

- `kind: 'anchor'`
- primary value: heading anchor or block anchor
- optional block offset if needed later

### EPUB

- `kind: 'cfi'`
- primary value: canonical fragment identifier

### PDF

- `kind: 'page'`
- primary value: page number
- optional scroll offset for smoother restore

## 8.3 Navigation surface

```ts
type ReaderNavigationApi = {
  jumpTo(locator: ReaderLocator): void
  getCurrentLocator(): ReaderLocator
}
```

This API should exist for all three readers, even though the internal implementation differs.

---

## 9. Engine selection and rationale

## 9.1 Markdown

### Selected stack

- `react-markdown`
- `remark-gfm`
- `rehype-sanitize`
- optional `rehype-raw` in trusted-only mode
- optional code highlighting integration
- optional virtualization layer for large documents

### Why this stack

1. Mature React-first rendering model
2. Safe by default
3. Strong plugin ecosystem
4. Strong support for custom React component mapping
5. Clear separation between markdown parsing and UI rendering

### Rejected alternatives

#### Raw HTML rendering as default

Rejected because:

- lower safety
- larger attack surface
- defeats the main reason to use `react-markdown`

#### MDX as the default content model

Rejected because:

- heavier authoring/runtime assumptions
- mixes execution and content too early
- not required for the reader use case

#### A fully custom markdown parser

Rejected because:

- unnecessary maintenance burden
- weaker ecosystem
- no meaningful product advantage

## 9.2 EPUB

### Selected engine

- `epub.js`

### Integration posture

- own the React wrapper in this library
- use `epub.js` only as the document engine

### Why this is the selected path

1. `epub.js` is the core browser engine with the right primitives
2. It supports:
   - pagination
   - continuous scrolling
   - iframe rendering
   - hooks
   - theming
   - annotations
   - CFI navigation
3. It is flexible enough for long-term product ownership

### Why `react-reader` is not the final architecture

`react-reader` is a useful accelerator and proof of concept, but it is not the ideal long-term abstraction boundary because:

1. it carries its own UI assumptions
2. the important extensibility still lives in `epub.js`
3. shared platform behavior is easier if this library owns the wrapper

### Acceptable temporary use

If implementation speed matters more than long-term shape in an early milestone, `react-reader` may be used temporarily to reduce initial wrapper work, but the target architecture remains an owned wrapper over `epub.js`.

## 9.3 PDF

### Default selected path

- `react-pdf`

### Optional path

- `react-pdf-viewer` adapter if commercial licensing is accepted

### Why `react-pdf` is the default

1. open, common, and flexible
2. close to PDF.js primitives without forcing full viewer UI
3. better fit for a library that already owns shell/chrome
4. lower product lock-in

### Why `react-pdf-viewer` is optional only

1. it offers excellent built-in viewer functionality
2. but the README currently points to commercial licensing
3. it is more opinionated as a full viewer surface
4. it should remain a host/product decision, not the default library dependency

---

## 10. MarkdownReader implementation

## 10.1 Responsibilities

`MarkdownReader` should provide:

- markdown rendering
- GFM support
- TOC extraction from headings
- in-document navigation
- search over document content
- reading preferences
- selection and later annotations
- analysis-context extraction

## 10.2 Supported inputs

```ts
type MarkdownReaderSource =
  | { markdown: string }
  | { url: string }

type MarkdownReaderProps = {
  identity: ReaderDocumentIdentity
  source: MarkdownReaderSource
  toc?: boolean
  search?: boolean
  allowRawHtml?: boolean
  syntaxHighlighting?: boolean
  preferences?: Partial<ReaderPreferences>
  onProgressChange?: (state: ReaderProgressState) => void
}
```

For host safety and caching control, the library should prefer `markdown` text input. URL-loading should be optional and easy to disable in some applications.

## 10.3 Rendering pipeline

### Default pipeline

1. parse markdown with `react-markdown`
2. enable GFM with `remark-gfm`
3. sanitize rendered HTML via `rehype-sanitize`
4. map tags to library-owned components

### Optional pipeline additions

- code highlighting
- math support later
- trusted raw HTML via `rehype-raw`

## 10.4 Security defaults

### Default

- `allowRawHtml = false`
- safe URL transform
- sanitization on

### Trusted mode

Trusted mode may allow raw HTML, but only as an explicit opt-in prop and only after documenting that it is not appropriate for arbitrary user content.

## 10.5 TOC extraction

Headings should be parsed into:

- `ReaderTocItem[]`
- anchors for navigation
- progress sections for "current section" tracking

## 10.6 Search

Search should index block-level content:

- headings
- paragraphs
- list items
- table text
- blockquote text

Search results should map to `ReaderSearchResult` with anchor locators.

## 10.7 Location and progress

Progress should be derived from:

- active visible heading/block anchor
- scroll position
- optional section ratio for finer progress

## 10.8 Performance

### Default behavior

Render the full document for normal-sized markdown.

### Large-document fallback

For large documents:

- chunk by block or section
- optionally virtualize visible chunks
- use `react-window` or a similar virtualization layer only when needed

Virtualization should be behind:

- automatic thresholding, or
- explicit host opt-in

## 10.9 Preferences mapping

Markdown is the most complete format for reader preferences:

- theme
- font family
- font size
- line height
- paragraph spacing
- width
- alignment
- density

These should be implemented primarily through CSS variables.

---

## 11. EpubReader implementation

## 11.1 Responsibilities

`EpubReader` should provide:

- EPUB loading from URL, file, or binary data
- paginated and scrolled reading modes
- TOC navigation
- CFI-based persisted location
- theme injection into rendition content
- text selection support
- future annotation integration

## 11.2 Supported inputs

```ts
type EpubReaderSource =
  | { url: string }
  | { file: File }
  | { arrayBuffer: ArrayBuffer }

type EpubReaderProps = {
  identity: ReaderDocumentIdentity
  source: EpubReaderSource
  initialLocation?: string
  mode?: 'paginated' | 'scrolled'
  preferences?: Partial<ReaderPreferences>
  onLocationChange?: (cfi: string) => void
  onProgressChange?: (state: ReaderProgressState) => void
}
```

## 11.3 Engine wrapper

The library should create its own engine wrapper with the following jobs:

1. instantiate `epub.js`
2. create and manage `book`
3. create and manage `rendition`
4. bind events for:
   - ready
   - relocation
   - selection
   - TOC load
   - error
5. expose a clean React-friendly adapter API

## 11.4 Modes

### Default mode

- paginated

### Optional mode

- scrolled / continuous

### Rationale

Paginated mode is the better default because:

- it matches book-reading expectations
- it simplifies progress mental model
- it aligns better with future notes/highlight UX

Scrolled mode should still be available because some content and users prefer it.

## 11.5 Location model

CFI is the canonical locator and persisted position format.

Required behaviors:

- update location on relocation
- expose `onLocationChange`
- support `jumpTo({ kind: 'cfi' })`
- restore last location reliably

## 11.6 TOC

TOC should come from EPUB navigation data and be mapped to `ReaderTocItem[]`.

## 11.7 Selection and annotations

Because EPUB content lives in an iframe, selection support must be integrated through the engine wrapper rather than through normal DOM selection assumptions in React.

The wrapper should own:

- selection extraction
- quote capture
- CFI range capture
- future highlight rendering hooks

## 11.8 Theming

Preferences must be translated into rendition theme rules:

- font family
- font size
- line height
- paragraph spacing
- colors
- background
- width behavior where supported

This is the main reason the wrapper must be owned by the library.

## 11.9 Security

### Default policy

- `allowScriptedContent = false`
- no popup permissions by default
- keep sandbox tight

### Notes

EPUB content is effectively packaged web content. Script execution must remain an explicit, exceptional mode and not a normal product path.

## 11.10 Error handling

The wrapper must surface recoverable, host-visible errors for:

- invalid EPUB files
- malformed internal content
- CORS failures
- fetch failures
- theme injection failures where possible

## 11.11 Performance constraints

Known realities from the underlying ecosystem:

- total page count is not equivalent to native readers
- rendering performance varies by book quality
- chapter rendering is iframe-based

The implementation should not promise native-reader parity.

---

## 12. PdfReader implementation

## 12.1 Responsibilities

`PdfReader` should provide:

- PDF loading
- page rendering
- page navigation
- zoom control
- text selection
- TOC/outline when available
- progress by page
- search integration
- future annotation support

## 12.2 Supported inputs

```ts
type PdfReaderSource =
  | { url: string }
  | { file: File }
  | { data: Uint8Array }

type PdfReaderProps = {
  identity: ReaderDocumentIdentity
  source: PdfReaderSource
  initialPage?: number
  preferences?: Partial<ReaderPreferences>
  onPageChange?: (page: number) => void
  onProgressChange?: (state: ReaderProgressState) => void
}
```

## 12.3 Open-source default architecture

The default implementation should be:

- `react-pdf` for document/page rendering
- library-owned shell for controls, layout, and interaction

## 12.4 Worker setup

The PDF worker must be configured in the same module that renders `react-pdf` usage, because module ordering can otherwise reset the worker source.

The implementation should centralize this in the library’s PDF engine wrapper.

## 12.5 Required assets

The default implementation must explicitly handle:

- text layer CSS
- annotation layer CSS
- cMaps for robust multilingual rendering

## 12.6 SSR strategy

PDF rendering should be treated as client-side where required.

The host-facing implementation should support:

- lazy loading
- no-SSR wrappers in SSR-heavy hosts
- shell-level loading placeholders

## 12.7 Search

### Baseline implementation

Provide page-based search with extracted text layer content when feasible.

### Notes

Search will be less turnkey than `react-pdf-viewer`, so the implementation should explicitly scope expectations:

- first ship page navigation and text layer support
- then add text extraction/indexing as a dedicated follow-up

## 12.8 TOC / outline

If outline data is available from the PDF, map it to `ReaderTocItem[]`.

If not, the TOC panel should gracefully disappear or show an unavailable state.

## 12.9 Preferences mapping

PDF cannot support typography the same way as Markdown or EPUB.

Supported preferences should primarily map to:

- theme mode for shell/background
- page fit / zoom
- page gap
- density
- shell chrome visibility

Typography controls like font family are usually not meaningful for PDF page content and must be disabled via capability declarations.

## 12.10 Optional premium adapter

If the product approves commercial licensing, the library may provide:

- `PdfReaderPremiumAdapter`
- internally powered by `react-pdf-viewer`

This should remain additive, not the default.

---

## 13. Capability expectations by format

| Capability | Markdown | EPUB | PDF |
|---|---:|---:|---:|
| TOC | Strong | Strong | Conditional |
| Search | Strong | Strong | Medium |
| Typography control | Strong | Strong | Weak |
| Theme control | Strong | Strong | Medium |
| Exact persisted location | Strong | Strong | Strong |
| Selection support | Strong | Medium/iframe-bound | Strong |
| Annotation support path | Strong | Medium | Strong |
| Raw content safety | Strong | Medium | Strong |

---

## 14. Public API strategy

## 14.1 External API posture

Each reader should follow the same external shape:

1. `identity`
2. `source`
3. `preferences`
4. persistence/event hooks
5. extension slots

## 14.2 Controlled vs uncontrolled state

Each reader should support:

- `default...` behavior for simple adoption
- controlled props for host-managed state

Examples:

- `initialLocation` + `onLocationChange`
- `initialPage` + `onPageChange`
- `defaultPreferences` + `preferences` + `onPreferencesChange`

---

## 15. Rollout order

## 15.1 Phase 1 — MarkdownReader

Reason:

- lowest technical risk
- strongest preference support
- easiest shared-shell validation

Deliverables:

- rendering
- TOC
- search
- preferences
- progress

## 15.2 Phase 2 — PdfReader

Reason:

- strong product value
- worker/text-layer complexity is manageable
- validates page-based document shell behavior

Deliverables:

- page navigation
- TOC if available
- zoom/page fit
- progress
- selection

## 15.3 Phase 3 — EpubReader

Reason:

- highest wrapper complexity
- iframe-specific selection and styling concerns
- more fragile source quality

Deliverables:

- CFI persistence
- TOC
- paginated/scrolled modes
- theme integration
- selection support

## 15.4 Phase 4 — Optional premium PDF adapter

Only if licensing and product direction justify it.

---

## 16. Testing strategy

## 16.1 Unit-level

- locator encoding/decoding
- TOC extraction
- search indexing
- preference mapping
- progress calculation

## 16.2 Component-level

- shell state
- sidebar rendering
- capability-based control hiding
- event emission

## 16.3 Integration-level

### Markdown

- GFM rendering
- safe HTML defaults
- trusted raw HTML opt-in behavior

### EPUB

- location persistence via CFI
- TOC navigation
- theme injection
- invalid file handling

### PDF

- worker configuration
- text layer rendering
- page change events
- multilingual PDF rendering with cMaps

---

## 17. Technical risks and mitigation

## 17.1 Markdown performance on huge documents

Mitigation:

- chunking
- optional virtualization
- explicit thresholding

## 17.2 EPUB variability and malformed content

Mitigation:

- explicit error states
- defensive wrapper design
- permissive but observable failure handling

## 17.3 PDF worker and asset setup complexity

Mitigation:

- central library wrapper
- clear docs for host bundlers
- example integrations

## 17.4 PDF feature gap versus full viewers

Mitigation:

- ship a scoped open-source baseline
- treat richer search/thumb/toolbar features as phased work
- keep premium adapter path open

## 17.5 Over-normalization

Mitigation:

- shared shell only
- format-specific locators and engine adapters
- capability declarations

---

## 18. Implementation deliverables

The implementation for the three new readers should produce:

1. `MarkdownReader`
2. `EpubReader`
3. `PdfReader`
4. shared document-reader shell
5. canonical document-reader core types
6. navigation, TOC, search, and progress contracts
7. host-facing documentation/examples

---

## 19. Final implementation stance

The mature path is:

- **Markdown:** fully owned reader built on `react-markdown`
- **EPUB:** owned React wrapper over `epub.js`
- **PDF:** library-owned shell with `react-pdf` as the default engine
- **Optional premium PDF:** isolated adapter for `react-pdf-viewer`

This provides a sustainable React reader platform that remains high-level for host apps while preserving the engine-specific behavior required for correctness.
