import type { ThoughtNode, ThoughtPoint, ThoughtSize } from './thought-graph'

export interface SpatialLayoutRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ThoughtWindowLayout {
  position: ThoughtPoint
  size: ThoughtSize
}

const DEFAULT_THOUGHT_WINDOW_SIZE: ThoughtSize = { width: 380, height: 300 }
const MIN_NESTED_WIDTH = 300
const MAX_NESTED_WIDTH = 360
const MIN_NESTED_HEIGHT = 240
const MAX_NESTED_HEIGHT = 300
const VIEWPORT_MARGIN = 18
const WINDOW_GAP = 20
const STAGGER_STEP = 22

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toRect(position: ThoughtPoint, size: ThoughtSize): SpatialLayoutRect {
  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  }
}

function overlapArea(a: SpatialLayoutRect, b: SpatialLayoutRect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return width * height
}

function overflowDistance(rect: SpatialLayoutRect, bounds: SpatialLayoutRect) {
  const minX = bounds.x + VIEWPORT_MARGIN
  const minY = bounds.y + VIEWPORT_MARGIN
  const maxX = bounds.x + bounds.width - VIEWPORT_MARGIN
  const maxY = bounds.y + bounds.height - VIEWPORT_MARGIN

  return (
    Math.max(0, minX - rect.x) +
    Math.max(0, minY - rect.y) +
    Math.max(0, rect.x + rect.width - maxX) +
    Math.max(0, rect.y + rect.height - maxY)
  )
}

function clampRectToBounds(rect: SpatialLayoutRect, bounds: SpatialLayoutRect): SpatialLayoutRect {
  const minX = bounds.x + VIEWPORT_MARGIN
  const minY = bounds.y + VIEWPORT_MARGIN
  const maxX = Math.max(minX, bounds.x + bounds.width - rect.width - VIEWPORT_MARGIN)
  const maxY = Math.max(minY, bounds.y + bounds.height - rect.height - VIEWPORT_MARGIN)

  return {
    ...rect,
    x: clamp(rect.x, minX, maxX),
    y: clamp(rect.y, minY, maxY),
  }
}

function getNestedWindowSize(visibleBounds: SpatialLayoutRect): ThoughtSize {
  return {
    width: clamp(Math.round(visibleBounds.width * 0.42), MIN_NESTED_WIDTH, MAX_NESTED_WIDTH),
    height: clamp(Math.round(visibleBounds.height * 0.44), MIN_NESTED_HEIGHT, MAX_NESTED_HEIGHT),
  }
}

export function getThoughtNodeFrame(node: ThoughtNode): SpatialLayoutRect {
  return toRect(
    node.view.position ?? { x: 80, y: 120 },
    node.view.size ?? DEFAULT_THOUGHT_WINDOW_SIZE,
  )
}

export function resolveNestedThoughtWindowLayout({
  sourceFrame,
  selectionRect,
  visibleBounds,
  existingFrames = [],
  siblingIndex = 0,
}: {
  sourceFrame: SpatialLayoutRect
  selectionRect?: SpatialLayoutRect
  visibleBounds: SpatialLayoutRect
  existingFrames?: SpatialLayoutRect[]
  siblingIndex?: number
}): ThoughtWindowLayout {
  const size = getNestedWindowSize(visibleBounds)
  const stagger = (siblingIndex % 4) * STAGGER_STEP
  const anchorX = selectionRect
    ? selectionRect.x + selectionRect.width / 2
    : sourceFrame.x + sourceFrame.width / 2
  const anchorY = selectionRect
    ? selectionRect.y + selectionRect.height / 2
    : sourceFrame.y + 48
  const anchorTop = selectionRect?.y ?? sourceFrame.y + 32

  const candidates: Array<SpatialLayoutRect & { intent: string }> = [
    {
      intent: 'right',
      x: sourceFrame.x + sourceFrame.width + WINDOW_GAP + stagger,
      y: anchorTop - 44 + stagger,
      width: size.width,
      height: size.height,
    },
    {
      intent: 'left',
      x: sourceFrame.x - size.width - WINDOW_GAP - stagger,
      y: anchorTop - 44 + stagger,
      width: size.width,
      height: size.height,
    },
    {
      intent: 'below',
      x: anchorX - size.width / 2 + stagger,
      y: sourceFrame.y + sourceFrame.height + WINDOW_GAP + stagger,
      width: size.width,
      height: size.height,
    },
    {
      intent: 'above',
      x: anchorX - size.width / 2 - stagger,
      y: sourceFrame.y - size.height - WINDOW_GAP - stagger,
      width: size.width,
      height: size.height,
    },
    {
      intent: 'viewport-right',
      x: visibleBounds.x + visibleBounds.width - size.width - VIEWPORT_MARGIN,
      y: anchorY - 52 + stagger,
      width: size.width,
      height: size.height,
    },
    {
      intent: 'viewport-left',
      x: visibleBounds.x + VIEWPORT_MARGIN,
      y: anchorY - 52 + stagger,
      width: size.width,
      height: size.height,
    },
  ]

  const scored = candidates.map((candidate, index) => {
    const rect = clampRectToBounds(candidate, visibleBounds)
    const sourceOverlap = overlapArea(rect, sourceFrame)
    const selectionOverlap = selectionRect ? overlapArea(rect, selectionRect) : 0
    const siblingOverlap = existingFrames.reduce(
      (sum, frame) => sum + overlapArea(rect, frame),
      0,
    )
    const overflow = overflowDistance(candidate, visibleBounds)
    const distance = Math.hypot(rect.x - sourceFrame.x, rect.y - sourceFrame.y)
    const intentBias = candidate.intent === 'right' || candidate.intent === 'left' ? 0 : 180

    return {
      rect,
      score:
        selectionOverlap * 40 +
        sourceOverlap * 8 +
        siblingOverlap * 2 +
        overflow * 10 +
        distance * 0.08 +
        intentBias +
        index * 0.01,
    }
  })

  const best = scored.reduce((currentBest, candidate) =>
    candidate.score < currentBest.score ? candidate : currentBest,
  )

  return {
    position: {
      x: Math.round(best.rect.x),
      y: Math.round(best.rect.y),
    },
    size,
  }
}
