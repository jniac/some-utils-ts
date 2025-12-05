
/**
 * Evaluates a value on a track defined by keyframes at a given time t.
 */
export function evaluateTrack(t: number, keyframes: [time: number, value: number][]): number {
  if (keyframes.length === 0)
    throw new Error("remap() requires at least one keyframe.")

  // Ensure keyframes are sorted by time
  const sorted = [...keyframes].sort((a, b) => a[0] - b[0])

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  // Clamp outside range
  if (t <= first[0])
    return first[1]

  if (t >= last[0])
    return last[1]

  // Find the interval containing t
  for (let i = 0; i < sorted.length - 1; i++) {
    const [t1, v1] = sorted[i]
    const [t2, v2] = sorted[i + 1]

    if (t >= t1 && t <= t2) {
      const range = t2 - t1

      // Avoid divide-by-zero (flat time span)
      if (range === 0)
        return v1

      const alpha = (t - t1) / range
      return v1 + (v2 - v1) * alpha
    }
  }

  throw new Error('Unreachable code in trackRemap()')
}

/**
 * Applies Gaussian filtering to a function to produce a smoothed version.
 * 
 * Usage:
 * ```ts
 * const fn = (t: number) => t < 10 ? 0 : 10
 * const smoothFn = (t: number) => gaussianFilter(fn, t, { samples: 19, spread: 8 })
 * ```
 */
export function gaussianFilter(fn: (t: number) => number, t: number, {
  samples = 9,
  spread = .1,
} = {}): number {
  let totalWeight = 0
  let totalValue = 0

  const n = Math.ceil((samples - 1) / 2)
  for (let i = 0; i <= n; i++) {
    const dev = i / (n + 1)
    const sampleT0 = t - dev * spread
    const sampleT1 = t + dev * spread
    const weight = Math.exp(-.5 * (dev * 3) ** 2) // Gaussian weight
    totalWeight += weight * 2
    totalValue += fn(sampleT0) * weight
    totalValue += fn(sampleT1) * weight
  }

  return totalValue / totalWeight
}