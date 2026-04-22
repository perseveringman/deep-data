## Loop 1 — 2026-04-22T23:35:00+08:00
- Read: `research/sources/source-001.md`, `source-002.md`, `source-003.md`, `source-004.md`, `source-005.md`
- Did: extracted the recommended Markdown pipeline, EPUB engine/wrapper split, and EPUB limitations that affect product design
- Wrote: `research/notes/findings.md` (Markdown + EPUB findings draft)
- Next: review PDF and performance sources, then converge on the recommended architecture

## Loop 2 — 2026-04-22T23:40:00+08:00
- Read: `research/sources/source-006.md`, `source-007.md`, `source-008.md`, `source-009.md`, `research/sources/index.json`
- Did: compared PDF.js layer model, `react-pdf` setup requirements, `react-pdf-viewer` feature/licensing trade-offs, and virtualization applicability
- Wrote: expanded `research/notes/findings.md`; refreshed `research/notes/plan.md`
- Next: write the final proposal with library structure, engine choices, and rollout order

## Loop 3 — 2026-04-22T23:46:00+08:00
- Read: `research/notes/findings.md`, `research/notes/plan.md`, all source entries in `research/sources/index.json`
- Did: synthesized the mature recommendation for `MarkdownReader`, `EpubReader`, and `PdfReader`, including open-source default path and optional premium path
- Wrote: `research/output/reader-proposal.md`
- Next: update session plan and present the recommendation concisely in chat

## Loop 4 — 2026-04-23T00:20:00+08:00
- Read: `research/output/reader-proposal.md`, `research/notes/findings.md`, session `plan.md`, and the subsequent design decisions captured in the conversation about translation, annotations, AI context, preferences, capabilities, snapshots, and codecs
- Did: expanded the earlier proposal into two implementation-grade documents, one for the three new document readers and one for the full five-reader common layer
- Wrote: `research/output/three-reader-implementation.md`, `research/output/five-reader-common-layer-implementation.md`
- Next: hand off the document paths and summarize what each one covers
