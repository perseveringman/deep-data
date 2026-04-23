export function deepMerge<T>(...values: Array<Partial<T> | undefined>): T {
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
        result[key] = deepMerge(prevValue as Record<string, unknown>, nextValue as Record<string, unknown>)
      } else if (nextValue !== undefined) {
        result[key] = nextValue
      }
    }
  }

  return result as T
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
