# Reader Research Findings

## High-confidence findings

### Markdown

- `react-markdown` is the mature React-first base for Markdown rendering. It is safe by default, avoids `dangerouslySetInnerHTML`, supports custom component mapping, and exposes `remarkPlugins`, `rehypePlugins`, `skipHtml`, and `urlTransform`.
- The recommended Markdown pipeline is `react-markdown` + `remark-gfm` + `rehype-sanitize`.
- `remark-gfm` adds the GitHub-flavored features users expect in real content: autolinks, footnotes, strikethrough, tables, and task lists.
- `react-markdown` can render raw HTML via `rehype-raw`, but its own docs position that as trusted-content-only and note a meaningful bundle-size cost. Default behavior should stay safe.
- `rehype-sanitize` should run after unsafe transforms, and its schema needs explicit allowances for syntax-highlighting or math classes when those features are enabled.
- `react-markdown` exposes async variants (`MarkdownAsync`, `MarkdownHooks`) for async plugin pipelines, but the default synchronous component is enough for most reader scenarios.
- Very large Markdown documents may need virtualization/chunking. `react-window` is a mature option, but it works best when row heights are known or can be estimated ahead of time.

### EPUB

- `epub.js` is the browser rendering engine to build on. It supports pagination, continuous scrolling, hooks, iframe-based rendering, and sandboxed content.
- `epub.js` defaults to disabling scripted EPUB content. Enabling `allowScriptedContent` weakens sandboxing and should stay off by default.
- `epub.js` supports both paginated and scrolled flows. Continuous/scrolled rendering gives smoother reading but is less performant than the default single-section manager.
- `react-reader` is a practical React wrapper over `epub.js` and already exposes the key integration points needed in product code: `location`, `locationChanged`, `tocChanged`, `getRendition`, `epubInitOptions`, and `epubOptions`.
- `react-reader` documents real limitations that matter for product design:
  - it renders chapters in an iframe, not a native React tree;
  - total book pages are not knowable in the same way as native readers;
  - performance is worse than native readers;
  - some swipe interactions conflict with text selection;
  - EPUB files must be publicly fetchable or served with proper CORS unless you convert them to local object URLs.
- For advanced features like annotations/highlights, the actual power lives in `epub.js` via `rendition` and `annotations`; `react-reader` is a convenience wrapper, not the long-term abstraction boundary.

### PDF

- `pdf.js` is the underlying rendering engine. It clearly separates core, display, and viewer layers, and recommends using a worker plus a real server rather than `file://`.
- `react-pdf` is the open React wrapper around PDF.js for rendering existing PDF documents via `<Document>` and `<Page>`.
- `react-pdf` requires explicit worker configuration in the same module that renders the PDF components. It also requires separate CSS imports for text and annotation layers, and optional cMaps for reliable non-Latin rendering.
- `react-pdf-viewer` offers a much more complete ready-made viewer surface than `react-pdf`, including search, thumbnails, TOC navigation, theming, dark mode, full-screen, and a customizable toolbar through plugins.
- The important trade-off: the current `react-pdf-viewer` README states that it requires a commercial license. That makes it a product decision, not just a technical one.

## Architectural implications

- Markdown should be implemented as a first-class reader inside your library, not as a thin wrapper over a third-party full reader. The rendering pipeline is composable and easy to own.
- EPUB should use `epub.js` as the engine. `react-reader` is useful as an MVP accelerator, but a mature library should own the wrapper so styling, state, persistence, and future annotation features are under your control.
- PDF has two viable mature paths:
  1. **Open/default path:** `react-pdf` + your own reader shell.
  2. **Premium/optional path:** `react-pdf-viewer` adapter if you accept the commercial license and want a faster full-featured PDF surface.
- The shared abstraction between Markdown/EPUB/PDF should be a **document-reader shell** (toolbar, TOC, search, theme, persisted location, loading/error states), not a single universal rendering engine.

## Practical recommendation

- Build one new `document-reader` family in your component library.
- Ship three high-level components:
  - `MarkdownReader`
  - `EpubReader`
  - `PdfReader`
- Keep the internal engine choices format-specific:
  - Markdown: `react-markdown` + unified plugins
  - EPUB: `epub.js`
  - PDF: `react-pdf` by default, optional `react-pdf-viewer` adapter later
