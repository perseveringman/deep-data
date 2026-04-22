# Research Plan

## Question

Design a mature React-only solution for adding Markdown, EPUB, and PDF readers to the reusable reader component library so that other apps can adopt them quickly.

## Key Findings

- Markdown has a clear best-practice stack: `react-markdown` + `remark-gfm` + `rehype-sanitize`, with raw HTML disabled by default.
- EPUB is fundamentally an iframe/sandboxed browser-rendering problem, and `epub.js` is the engine-level standard. `react-reader` is useful for fast React integration but is not the ideal long-term abstraction boundary for a custom component library.
- PDF is fundamentally a PDF.js problem. `react-pdf` is the permissive open wrapper for custom UI; `react-pdf-viewer` is the richer off-the-shelf viewer but currently introduces a commercial-license decision.
- These three formats should share a shell and product conventions, but not a single internal rendering pipeline.

## Source Index

- `research/sources/source-001.md` — `react-markdown` README covering API, architecture, component overrides, raw HTML, and security guidance.
- `research/sources/source-002.md` — `remark-gfm` README covering GitHub-flavored Markdown feature support and integration points.
- `research/sources/source-003.md` — `rehype-sanitize` README covering safe HTML handling, schema control, and plugin ordering.
- `research/sources/source-004.md` — `epub.js` README covering rendering methods, flow modes, hooks, and scripting constraints.
- `research/sources/source-005.md` — `react-reader` README covering React integration, TOC/location APIs, styling, and real-world limitations.
- `research/sources/source-006.md` — PDF.js getting-started documentation covering core/display/viewer layers and worker/build layout.
- `research/sources/source-007.md` — `react-pdf` package README covering worker setup, text/annotation layers, cMaps, and client usage.
- `research/sources/source-008.md` — `react-pdf-viewer` README covering out-of-box viewer features, plugin model, and commercial licensing note.
- `research/sources/source-009.md` — `react-window` README covering virtualization primitives for large content surfaces.

## Phase 2 Work Plan

1. Compare the three reader families by engine maturity, React integration quality, styling control, and licensing constraints.
2. Define the recommended library architecture for shared shell vs. format-specific engines.
3. Decide the default recommendation for each format and note acceptable fallback or premium alternatives.
4. Write a concrete implementation proposal with API shapes, rollout order, and risk controls.

## Known Gaps

- The `react-pdf-viewer` website docs were not materialized due fetch issues, so the local snapshot relies on the project README instead of its full docs site.
- The `react-pdf` README is focused on setup/rendering primitives, so comparisons with richer viewer shells should be framed carefully as “documented surface area” rather than absolute capability claims.
