import { HashGrid2 } from '../collection/spatial/hash-grid'
import { fromVector2Declaration, Vector2Declaration } from '../declaration'
import { Vector2Like } from '../types'

function rangeModulo(x: number, min: number, max: number) {
  const range = max - min
  return ((x - min) % range + range) % range + min
}

const defaultParams = {
  /**
   * The minimum distance between samples.
   * @default 1
   */
  radius: 1,
  /**
   * The maximum distance between samples.
   * @default 1
   */
  radiusRatioMax: 1,
  /**
   * The maximum number of samples to generate.
   * @default 1000
   */
  maxCount: 1000,
  /**
   * The random function to use. By default, Math.random is used.
   * @default Math.random
   */
  random: Math.random,
  /**
   * The starting point (included in the samples).
   * @default [0, 0]
   */
  start: <Vector2Declaration>[0, 0],
  /**
   * A delegate function to check if a sample is valid (e.g. inside a polygon).
   */
  isValid: (x: number, y: number) => true,
  /**
   * The maximum number of attempts to find a valid sample.
   * @default 23
   */
  maxAttempts: 23,

  /**
   * If defined, the samples will be generated with periodicity in the given 
   * dimensions. This enables seamless tiling of the samples.
   */
  period: null as null | { x: number, y: number },
}

// Note: The StringHashGrid is not used in the current implementation.
// It is kept here for reference and can be used if needed.
// Same performance as HashGrid2, perhaps a very little bit faster (but less future proof).
// class StringHashGrid {
//   #map = new Map<string, { x: number, y: number, value: number }>()
//   #cellSize: number

//   constructor(cellSize = 0) {
//     this.#cellSize = cellSize
//   }

//   hash(x: number, y: number): string {
//     if (this.#cellSize === 0)
//       return `${x},${y}`

//     x = Math.floor(x / this.#cellSize)
//     y = Math.floor(y / this.#cellSize)
//     return `${x},${y}`
//   }

//   hasCell(x: number, y: number): boolean {
//     return this.#map.has(this.hash(x, y))
//   }

//   get(x: number, y: number): number | undefined {
//     return this.#map.get(this.hash(x, y))?.value
//   }

//   set(x: number, y: number, value: number): void {
//     if (value === undefined) {
//       this.delete(x, y)
//       return
//     }

//     this.#map.set(this.hash(x, y), { x, y, value })
//   }

//   delete(x: number, y: number): boolean {
//     return this.#map.delete(this.hash(x, y))
//   }

//   cellNeighborEntries(x: number, y: number, extent: number): [number, number, number][] {
//     const entries: [number, number, number][] = []
//     x = Math.floor(x / this.#cellSize)
//     y = Math.floor(y / this.#cellSize)

//     for (let i = -extent; i <= extent; i++) {
//       for (let j = -extent; j <= extent; j++) {
//         const key = `${x + i},${y + j}`
//         const value = this.#map.get(key)
//         if (value !== undefined) {
//           entries.push([value.x, value.y, value.value])
//         }
//       }
//     }

//     return entries
//   }
// }

/**
 * Generates 2D Poisson-disc samples within an infinite plane.
 *
 * @param incomingParams - Parameters to configure the sampling process.
 * @returns An object containing the generated samples, the spatial grid, and the used parameters.
 * 
 * @example
 * ```ts
 * import { generatePoissonDiscSamples2 } from 'some-utils-ts/experimental/poisson-disc-sampling'
 * 
 * const { samples, grid, params } = generatePoissonDiscSamples2({
 *   radius: 5,
 *   maxCount: 500,
 *   start: [10, 10],
 *   isValid: (x, y) => {
 *     // Example: Only allow samples within a circle of radius 50 centered at (0, 0)
 *     return (x * x + y * y) <= (50 * 50)
 *   },
 * })
 * console.log('Generated samples:', samples)
 * ```
 */
export function generatePoissonDiscSamples2(incomingParams?: Partial<typeof defaultParams>): {
  samples: Vector2Like[]
  grid: HashGrid2<number>
  params: typeof defaultParams
} {
  const params = { ...defaultParams, ...incomingParams }
  const {
    radius,
    radiusRatioMax,
    maxCount,
    random,
    start,
    isValid,
    maxAttempts,
    period,
  } = params

  if (radius <= 0)
    throw new Error('Radius must be greater than 0')

  if (radiusRatioMax < 1)
    throw new Error('Radius ratio max must be greater than or equal to 1')

  const cellSize = radius / Math.sqrt(2)
  const grid =
    // true ? new StringHashGrid(cellSize) :
    new HashGrid2<number>(cellSize)

  const startSample = fromVector2Declaration(start)

  if (!isValid(startSample.x, startSample.y))
    throw new Error('First sample is not valid')

  const active = [startSample]
  grid.set(startSample.x, startSample.y, 0)

  const samples = [startSample]

  const pushSample = (x: number, y: number) => {
    const sample = { x, y }
    samples.push(sample)
    active.push(sample)
    grid.set(x, y, samples.length - 1)
  }

  const pushSampleClone = (x: number, y: number) => {
    grid.set(x, y, samples.length - 1)
  }

  while (active.length > 0 && samples.length < maxCount) {
    const sampleIndex = Math.floor(random() * active.length)
    const sample = active[sampleIndex]
    let found = false

    const angleOffset = random() * Math.PI * 2
    for (let i = 0; i < maxAttempts; i++) {
      const angle = angleOffset + i / maxAttempts * Math.PI * 2
      const r = radius * (1 + random() * (radiusRatioMax - 1))
      let x = sample.x + Math.cos(angle) * r
      let y = sample.y + Math.sin(angle) * r

      if (period !== null) {
        x = rangeModulo(x, startSample.x - period.x / 2, startSample.x + period.x / 2)
        y = rangeModulo(y, startSample.y - period.y / 2, startSample.y + period.y / 2)
      }

      if (!isValid(x, y))
        continue

      if (grid.hasCell(x, y))
        continue

      if (period !== null) {
        if (grid.hasCell(x + period.x, y) || grid.hasCell(x - period.x, y))
          continue
        if (grid.hasCell(x, y + period.y) || grid.hasCell(x, y - period.y))
          continue
      }

      let farEnough = true
      // Fast / easy check for the 24 neighbors thanks to the grid
      for (const [nx, ny, n] of grid.cellNeighborEntries(x, y, 2)) {
        const dx = x - nx
        const dy = y - ny
        const d = Math.sqrt(dx * dx + dy * dy)

        if (d < radius) {
          farEnough = false
          break
        }
      }

      if (farEnough === false)
        continue

      found = true
      pushSample(x, y)

      if (period !== null) {
        pushSampleClone(x + period.x, y - period.y)
        pushSampleClone(x + period.x, y)
        pushSampleClone(x + period.x, y + period.y)
        pushSampleClone(x, y + period.y)
        pushSampleClone(x - period.x, y + period.y)
        pushSampleClone(x - period.x, y)
        pushSampleClone(x - period.x, y - period.y)
        pushSampleClone(x, y - period.y)
      }

      break
    }

    if (found === false) {
      active.splice(sampleIndex, 1)
    }
  }

  return {
    samples,
    grid,
    params,
  }
}