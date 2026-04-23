# Mature Proposal for Markdown, EPUB, and PDF Readers

## Executive recommendation

Add a second library family alongside the existing media readers:

- `MarkdownReader`
- `EpubReader`
- `PdfReader`

Do **not** force them into one low-level universal rendering abstraction. Instead, share a **document-reader shell** and keep format engines separate:

- Markdown engine: `react-markdown` + `remark-gfm` + `rehype-sanitize`
- EPUB engine: `epub.js` (own React wrapper)
- PDF engine: `react-pdf` by default
- Optional premium PDF adapter: `react-pdf-viewer` if commercial licensing is approved

## Why this is the mature path

### Markdown

Markdown is the easiest format to fully own in your library. The unified ecosystem is mature, secure, and designed for composition.

Recommended defaults:

- `react-markdown`
- `remark-gfm`
- `rehype-sanitize`
- custom `components` mapping for code blocks, links, images, headings, tables

Recommended policies:

- `allowRawHtml = false` by default
- expose an escape hatch for trusted content only
- support TOC extraction from headings
- support optional syntax highlighting
- add virtualization only for large documents, behind a threshold or explicit prop

### EPUB

EPUB is where you want to control the wrapper but not reinvent the engine.

Recommendation:

- build on `epub.js`
- expose your own React component and state model
- use CFI as the canonical persisted location
- use `rendition.themes`, `rendition.display`, and `rendition.annotations` as your engine-level primitives

Why not stop at `react-reader`?

- it is good for an MVP, but it comes with its own UI assumptions
- the real extensibility still lives in `epub.js`
- long-term product features such as integrated bookmarks, highlights, side panels, and unified theming are easier if your library owns the wrapper

Recommended defaults:

- `allowScriptedContent = false`
- paginated mode by default
- optional scrolled mode
- object-URL support for local files
- explicit error surface for invalid EPUBs and CORS failures

### PDF

PDF is the one format where licensing and scope should drive the technical choice.

#### Default open-source path

Use `react-pdf` and build your own shell around it.

Why:

- open, common, and easy to integrate into your current component library style
- enough for page rendering, zoom, page navigation, text layer, annotation layer
- compatible with a progressive rollout

Required implementation details:

- configure the worker in the same module as the PDF component usage
- import text and annotation layer CSS
- include cMaps for non-Latin text fidelity
- lazy-load on the client in SSR-heavy hosts

#### Optional premium path

Offer a second adapter package for teams willing to adopt `react-pdf-viewer`.

Why:

- built-in search
- thumbnails
- TOC
- toolbar/layout plugins
- theming/full-screen/print

Why it should stay optional:

- current README states commercial licensing is required
- it will be harder to make it feel like a native part of your design system

## Recommended library architecture

### Public API

Keep the exported API high-level, similar to what you already did for podcast and YouTube:

```ts
type MarkdownReaderProps = {
  source: { markdown?: string; url?: string }
  className?: string
  theme?: ReaderTheme
  toc?: boolean
  search?: boolean
  allowRawHtml?: boolean
}

type EpubReaderProps = {
  source: { url?: string; file?: File; arrayBuffer?: ArrayBuffer }
  initialLocation?: string
  onLocationChange?: (cfi: string) => void
  mode?: 'paginated' | 'scrolled'
  theme?: ReaderTheme
}

type PdfReaderProps = {
  source: { url?: string; file?: File; data?: Uint8Array }
  initialPage?: number
  onPageChange?: (page: number) => void
  theme?: ReaderTheme
}
```

### Shared shell

Build a new shared internal shell for document readers:

- toolbar
- loading / error / empty states
- left sidebar for TOC / thumbnails / bookmarks
- right drawer for metadata / notes / search results
- theme and typography tokens
- persisted location hooks

Shared types that are worth standardizing:

- `ReaderTheme`
- `ReaderTocItem`
- `ReaderSearchResult`
- `ReaderBookmark`
- `ReaderSelection`

Do **not** over-normalize current position into one universal type. Keep format-specific locations:

- Markdown: heading anchor or block id
- EPUB: CFI
- PDF: page number + optional scroll offset

## Rollout order

1. **MarkdownReader first**
   - lowest risk
   - fastest win
   - sets up shared shell patterns

2. **PdfReader second**
   - strong demand
   - worker/text-layer concerns are manageable
   - good fit for your reusable reader package

3. **EpubReader third**
   - higher complexity
   - iframe, CFI, and book-quality variability require more product hardening

## Product-quality safeguards

- Markdown:
  - sanitize by default
  - raw HTML opt-in only
  - lazy/virtual rendering only for large docs

- EPUB:
  - sandbox aggressively
  - scripts off by default
  - persist CFI on every location change
  - expose recoverable parse/CORS errors

- PDF:
  - configure worker locally
  - keep rendering client-only where needed
  - support cMaps for multilingual documents
  - feature-gate advanced search/thumbs if you stay on `react-pdf`

## Final recommendation

If you want a solution that is both reusable and sustainable:

- **Markdown:** own it fully with `react-markdown` pipeline
- **EPUB:** own the React wrapper, use `epub.js` as the engine
- **PDF:** default to `react-pdf`; add `react-pdf-viewer` only as an optional licensed adapter

That gives you a mature React component library without locking the whole design into one third-party viewer’s limitations.
