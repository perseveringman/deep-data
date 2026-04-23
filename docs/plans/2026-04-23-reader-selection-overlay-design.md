# Reader Selection Overlay Design

## Summary

Introduce a shared selection overlay for all five readers so users can act on selected text in place. The overlay should appear near the current selection, support the most common follow-up actions, and preserve the existing right sidebar as the destination for detailed results, history, and deeper editing.

The interaction model is:

1. User selects text.
2. A compact floating action bar appears near the selection.
3. The user can translate, run AI analysis, or enter the shared highlight-and-note flow without moving focus away from the reading surface.
4. Rich results and long-form editing continue in the existing `ReaderWorkspacePanel`.

This keeps the reading flow fast while avoiding a second full workspace inside the overlay.

## Current State

The reader platform already has the core shared state needed for this feature:

- `useReaderRuntime()` centralizes selection-driven translation, annotation creation, analysis context, and session snapshots.
- `ReaderWorkspacePanel` renders the current selection, translation controls, annotation list, and AI context in the right sidebar.
- All five readers already publish a normalized `selection` and `activeUnit`.
- `DocumentShell` provides a common shell pattern for document readers, while media readers render the same workspace panel directly.

Today the selection follow-up flow requires the user to move attention from the selected text to the right sidebar. That is functional, but too indirect for high-frequency actions like quick translation, quick highlight, and short note capture.

## Product Goals

- Make selection follow-up actions available directly at the selection point.
- Keep the interaction model consistent across Markdown, PDF, EPUB, YouTube, and Podcast readers.
- Preserve the right sidebar as the source of truth for history, long-form editing, and full results.
- Reuse existing reader-platform state and actions instead of adding reader-specific logic.

## Non-Goals

- Replacing the existing `ReaderWorkspacePanel`.
- Building a full annotation editor inside the floating overlay.
- Introducing reader-specific overlay behavior unless required by rendering constraints.
- Supporting document-level actions from the overlay; this layer is only for selection-local actions.

## Interaction Model

### Base Flow

After a non-empty selection stabilizes, show a compact floating action bar close to the selection anchor. The action bar exposes three primary actions:

- Translate
- AI
- Highlight/Note

This first state should be intentionally small and low-distraction. It behaves like a context action strip rather than a modal.

### Expanded Flow

Selecting one of the actions expands the floating action bar into a small preview card.

- **Translate**: show loading, then a short translation preview and an entry point to open the full result in the right sidebar.
- **AI**: show loading, then a short analysis summary or first response chunk and an entry point to open the full result in the right sidebar.
- **Highlight/Note**: immediately create the highlight, expand into a compact note composer with the current quote, keep quick color switching available while drafting, and leave long-form Markdown editing to the sidebar.

The overlay is optimized for capture and preview, not for long workflows. Detailed review and editing stay in the sidebar.

## UX Rules

### Visibility

Show the overlay only when:

- the current selection has non-empty text
- the selection is stable enough to interact with
- the selection anchor is still in the active reading surface

Hide the overlay when:

- the selection is cleared
- the user clicks elsewhere in the reading surface
- the user presses `Esc`
- the selection anchor fully leaves the viewport

If the overlay is already expanded, allow a short sticky window so the user can move from selection to overlay without it collapsing immediately.

### Positioning

Position the overlay relative to the current selection rectangle when available.

Rules:

- Prefer the end or top edge of the selection.
- Flip below the selection if there is not enough space above.
- Clamp horizontally inside the reading surface.
- If the selected range cannot provide a reliable rectangle, fall back to the active content container anchor.

This should be implemented as container-aware positioning rather than global viewport-only positioning so the overlay behaves correctly inside the reader surface.

### Keyboard Support

Support at minimum:

- `Esc` to dismiss
- shortcut to trigger selection translation
- shortcut to trigger AI analysis on selection

Keyboard shortcuts should only act when a valid reader selection exists.

## Division of Responsibilities

### Floating Overlay

Owns:

- immediate actions on the current selection
- temporary loading states
- short translation or AI previews
- quick highlight creation
- short note capture

Does not own:

- annotation history
- full translation history
- full AI response thread
- long-form note editing

### Right Sidebar

Owns:

- detailed translation results
- AI context and full analysis output
- annotation browsing and editing
- post-creation note refinement

The sidebar remains the durable workspace. The overlay is the fast entry point.

## Proposed Architecture

### New Shared Components

Add the following reader-platform UI pieces:

- `ReaderSelectionOverlayHost`
- `SelectionActionBar`
- `SelectionPreviewCard`
- `SelectionOverlayPortal` or equivalent positioning wrapper

Recommended responsibility split:

- `ReaderSelectionOverlayHost`: subscribes to shared runtime state, computes visibility, placement, and mode transitions.
- `SelectionActionBar`: renders the compact four-action bar.
- `SelectionPreviewCard`: renders the expanded view for `translate`, `ai`, `highlight`, or `note`.
- `SelectionOverlayPortal`: handles portal mounting and container-relative positioning.

### New Shared Interaction Hook

Add a hook such as `useSelectionOverlayState()` that wraps existing runtime capabilities with overlay-local UI state.

Suggested responsibilities:

- track current overlay mode: `closed | actions | translate | ai | note | highlight`
- manage sticky dismissal timing
- hold temporary preview state
- connect overlay events to `useReaderRuntime()` actions
- provide focus restoration and dismissal helpers

This hook should not duplicate the canonical reader state already owned by `useReaderRuntime()`.

## Integration Strategy

### Shared Runtime Reuse

The overlay should call the existing shared actions whenever possible:

- translation uses `runtime.translation.requestTranslation('selection')`
- highlight uses `runtime.createAnnotation(...)` or `runtime.createAnnotationFromSelection(...)`
- note uses annotation creation with initial `bodyMarkdown`
- AI uses the existing reader analysis context plus a new selection-triggered request path

The overlay should consume:

- current `selection`
- current `activeUnit`
- translation state
- analysis context
- annotations
- active annotation selection callback

### Reader Integration

Readers should not implement custom overlay logic. They should only continue to expose stable shared state.

Integration target:

- document readers: mount the overlay host inside `DocumentShell` so it can position relative to the reading surface
- media readers: mount the same overlay host adjacent to the content surface and pass the same shared runtime inputs

This keeps the five readers on one UX contract.

## Component Placement

### Document Readers

`DocumentShell` should become the primary mounting point for the overlay host for Markdown, PDF, and EPUB. The overlay host should receive:

- the content container ref
- the current `selection`
- overlay actions
- any optional container metrics needed for positioning

This keeps layout ownership centralized for document-based readers.

### Media Readers

YouTube and Podcast readers already embed `ReaderWorkspacePanel` directly, so they should mount the same overlay host around the transcript or visible content region.

The important rule is that the overlay host always attaches to the selection-producing surface, not to the outer page shell.

## State Model

### Canonical State

Continue to treat the following as canonical shared state:

- `selection`
- `activeUnit`
- annotations
- translation result
- analysis context
- reader session snapshot

### Overlay-Local State

Keep only ephemeral UI state inside the overlay layer:

- current overlay mode
- current placement rectangle
- preview visibility
- note draft input
- sticky-open state

This separation prevents the overlay from destabilizing the broader reader runtime.

## Detailed Action Flows

### Quick Translate

1. User selects text.
2. Overlay action bar appears.
3. User clicks `Translate`.
4. Overlay switches to translate preview mode.
5. Translation request runs on `selection`.
6. Preview shows a short result.
7. User can expand the result to the right sidebar.

### Quick AI Analysis

1. User selects text.
2. User clicks `AI`.
3. Overlay sends the current selection plus active reader context into the analysis path.
4. Overlay shows a compact summary preview.
5. User can open the full result in the sidebar.

### Quick Highlight / Note

1. User selects text.
2. User clicks `Highlight/Note`.
3. A default highlight is created immediately and the overlay stays open.
4. User can switch highlight color in place while drafting a short note.
5. Saving updates the same highlight-backed annotation with `bodyMarkdown`.
6. Sidebar focuses the created annotation for further Markdown refinement if needed.

## Error Handling

- If translation is unavailable, keep the action visible but disabled with a clear reason.
- If AI analysis is unavailable, do the same.
- If annotation creation fails, keep the overlay open and show the error inline.
- If the selection becomes invalid before action completion, dismiss the overlay gracefully and avoid writing partial state.
- Overlay errors must not reset reader selection or destabilize the reading surface.

## Performance and Stability Requirements

- The overlay must not cause the PDF or EPUB text layer to re-render on every selection update.
- Overlay state changes should not mutate reader content container identity.
- Positioning updates should be throttled to stable events, not tied to noisy selection churn.
- The overlay should prefer shared stable events already adopted in the reader fixes, especially for PDF and EPUB.

This is critical because the recent debugging work showed that noisy selection-driven rerenders can break the reading experience.

## Accessibility Requirements

- Overlay actions must be keyboard reachable.
- The expanded card must manage focus intentionally.
- Dismissal must be available via keyboard.
- Buttons must have clear labels, not icon-only semantics unless labeled with accessible text.
- The overlay should respect dark mode and high-contrast themes already supported by reader preferences.

## Testing Strategy

### Unit and Structural Tests

Add reader-platform tests for:

- overlay visibility rules
- overlay mode transitions
- quick note creation flow
- translation preview routing
- sidebar handoff behavior
- dismissal rules

### Reader Regression Tests

Add targeted tests to ensure:

- PDF selection still remains stable when overlay state changes
- EPUB selection is not cleared when the overlay opens
- Markdown heading-based active unit logic still works with overlay usage
- YouTube and Podcast selections still map into shared selection actions correctly

### Manual Debug Workbench Verification

Use `/debug/readers` to verify:

- overlay placement across all five reader types
- action latency and sticky behavior
- translation preview visibility
- note capture and sidebar focus handoff
- highlight creation without losing selection context

## Implementation Phases

### Phase 1: Overlay Shell

- introduce shared overlay host and positioning wrapper
- mount it into `DocumentShell`
- mount the same host into YouTube and Podcast readers
- show the compact action bar for stable non-empty selections

### Phase 2: Quick Actions

- wire translate preview
- wire AI preview
- wire immediate highlight creation
- wire short note capture

### Phase 3: Sidebar Handoff

- open detailed translation in sidebar
- focus created annotation after highlight or note
- ensure AI preview can expand into the sidebar experience

### Phase 4: Hardening

- regression coverage across all readers
- keyboard support
- dismissal edge cases
- positioning polish

## Recommended Initial Scope

For the first implementation pass, keep scope intentionally narrow:

- support one compact overlay
- support four actions
- use preview-only results for translation and AI
- support short note capture only
- rely on the existing sidebar for all durable detail views

Do not add tabs, history, or long-form editing into the overlay in the first version.

## Open Questions

- whether AI preview should show a summary sentence, bullet points, or the first response chunk
- whether highlight should default to one color or remember the last-used color beyond the current session

These do not block the initial architecture and can be resolved during implementation planning.

## Implementation Report

### Status

The first-pass shared selection overlay has been implemented across all five readers.

### What Landed

#### Shared Overlay Layer

Added the following shared reader-platform pieces:

- `ReaderSelectionOverlayHost`
- `SelectionActionBar`
- `SelectionPreviewCard`
- `useSelectionOverlayState()`
- shared overlay placement and preview helpers
- shared workspace section id helpers for sidebar handoff

The overlay now owns the local ephemeral interaction state described in this design:

- mode transitions: `closed | actions | translate | ai | highlight | note`
- sticky-open dismissal timing
- temporary translation preview state
- note draft state
- inline action error state

#### Selection Positioning

`ReaderSelection` now carries an optional `anchorRect` so the overlay can position against a captured viewport rect instead of depending entirely on live browser selection state.

That is used in:

- Markdown, PDF, YouTube, and Podcast readers through the shared `getScopedSelection()` path
- EPUB reader through a translated iframe selection rect captured from the rendition contents window

If a reliable rect is unavailable, placement falls back to the active reader surface anchor and stays clamped inside the reading surface.

#### Reader Integration

The same overlay host is now mounted in both shared reader shells:

- document readers mount through `DocumentShell.contentOverlay`
- media readers mount through `SharedReader.overlay`

This keeps the overlay outside the text-rendering internals while still positioning relative to the selection-producing surface.

#### Action Wiring

Implemented the four first-pass actions from the recommended initial scope:

- **Translate**: calls `runtime.translation.requestTranslation('selection')`, shows a compact preview in place, and hands off to the translation area in the right sidebar
- **AI**: uses the canonical `analysisContext` to produce a compact preview/handoff card and jumps to the AI section in the right sidebar
- **Highlight/Note**: the overlay now treats highlight and note as one flow: opening note mode immediately creates a default yellow highlight, opens the short-note composer, allows in-place color switching while drafting, and hands off to the annotation area for deeper Markdown editing in the sidebar

`useReaderRuntime()` was extended so selection-based annotation creation can reuse the existing `createAnnotation()` path while optionally supplying `bodyMarkdown`, tags, or anchors.

#### Sidebar Handoff

`ReaderWorkspacePanel` now exposes stable section ids for:

- translation
- AI context
- annotations

The overlay scrolls/focuses these sections so the right sidebar remains the durable workspace while the overlay stays lightweight.

#### Keyboard and Dismissal Behavior

Implemented:

- `Esc` to dismiss the overlay
- `Alt+T` to trigger selection translation when available
- `Alt+A` to open the AI preview when available

The overlay also keeps a short sticky-open window so pointer travel from the selection to the floating card does not collapse the UI immediately.

### Scope Decisions Taken During Implementation

- AI preview uses the existing canonical `analysisContext` rather than a new remote analysis executor because the repository does not yet expose a separate shared AI request API.
- Default quick highlight color is `yellow`.
- Quick note and highlight are unified into one action. Entering note mode creates the highlight immediately; the overlay then supports color switching plus short-note capture, while the right sidebar remains the place for long-form Markdown writing.
- The first implementation keeps long-form Markdown editing out of the floating card; the overlay only handles quick color switching plus short-note capture.

### Tests and Verification

Added targeted structural coverage for the overlay layer in `tests/reader-selection-overlay.test.ts`, including:

- overlay placement behavior
- AI preview summarization
- shared reader-shell mounting
- EPUB rect capture fallback behavior
- note-overlay persistence after highlight creation even when the browser selection collapses

Extended shared reader coverage to protect the highlight path as well:

- `tests/reader-platform.test.ts` now exercises whitespace-normalized repeated quote matching and guards the one-baseline highlight planning path
- `tests/media-reader-runtime-stability.test.ts` now verifies media readers scope selection/highlight work to the content surface instead of the whole shared shell

Existing reader regression coverage remained green, including the PDF and EPUB selection stability tests.

Validation results after the final highlight hotfix:

- `node --test tests/*.test.ts` passed
- `npm run build` passed

Post-implementation hotfix:

- narrowed `ReaderSelectionOverlayHost` placement and keyboard effect dependencies away from the entire overlay state object
- added placement equality guarding before `setPlacement`
- added structural regression coverage so the host does not reintroduce the same maximum update depth loop
- kept unified note mode open after highlight creation even when the browser selection collapses, so the quick-note composer no longer flashes closed immediately after activation

Post-implementation highlight user-journey hardening:

- reworked `renderReaderQuoteHighlights()` to match quotes against one whitespace-normalized baseline text snapshot instead of requiring the entire quote to live inside a single text node
- applied DOM highlight wrapping from the end of the document toward the start so multi-node and repeated-quote annotations can coexist without corrupting later matches
- narrowed YouTube and Podcast selection/highlight scoping from the whole `SharedReader` shell to the actual content surface so sidebar text can no longer steal highlight matches
- preserved EPUB on its rendition-native annotation path; the DOM matcher hardening primarily fixes Markdown, PDF, and transcript-style surfaces with fragmented text nodes

Known baseline issues outside this implementation scope:

- `npm run lint` currently fails because `eslint` is not available in the environment (`sh: eslint: command not found`)
- `./node_modules/.bin/tsc --noEmit` still reports pre-existing repository errors unrelated to this overlay work:
  - `app/channels/[id]/page.tsx` missing `avatarUrl` on a `ChannelDetail`
  - `components/readers/youtube-reader.tsx` accesses `content.language` though `ContentItem` does not declare it
  - `components/readers/podcast-reader.tsx` accesses `content.language` though `ContentItem` does not declare it
  - `lib/reader-debug-fixtures.ts` imports `./mock-data.ts` with a `.ts` extension
