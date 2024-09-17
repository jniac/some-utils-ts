import { DEFAULT_SEED, MAX, init, map, next } from './algorithm/parkmiller-c-iso'

let state = 123456

const identity = (x: number) => x

const defaultPickOptions = {
  /**
   * If true, the weights are assumed to be normalized, otherwise they will be 
   * normalized internally before picking.
   */
  weightsAreNormalized: false,
  /**
   * If non-zero, the index will be offset by this value and wrapped around the
   * number of options.
   * 
   * NOTE: 
   * - This is useful to shift the index range to a different starting point
   * essentially in graphics applications where the offset is used to select a 
   * preferred sequence of colors or other options.
   * - This will not work if weights are provided.
   */
  indexOffset: 0,
}

type PickOptions = typeof defaultPickOptions

/**
 * Pseudo Random Number Generator
 */
export class PRNG {
  static readonly defaultSeed = DEFAULT_SEED
  static readonly seedMax = MAX

  static seed(seed: number | string = DEFAULT_SEED): typeof PRNG {
    if (typeof seed === 'string') {
      seed = seed.split('').reduce((acc, char) => acc * 7 + char.charCodeAt(0), 0)
    }
    state = init(seed)
    state = next(next(state)) // warm up
    return PRNG
  }

  /**
   * Similar to `PRNG.seed`, but here the seed is set to the default seed.
   */
  static reset(): typeof PRNG {
    state = DEFAULT_SEED
    return PRNG
  }

  /**
   * @deprecated Use `PRNG.seed` instead.
   */
  static init = PRNG.seed

  static random(): number {
    state = next(state)
    return map(state)
  }

  // sugar-syntax:
  private static solveBetweenParameters(parameters: any[]): [number, number, (x: number) => number] {
    switch (parameters.length) {
      default: {
        return [0, 1, identity]
      }
      case 1: {
        return [0, parameters[0], identity]
      }
      case 2: {
        return [parameters[0], parameters[1], identity]
      }
      case 3: {
        return [parameters[0], parameters[1], parameters[2]]
      }
    }
  }
  static between(): number
  static between(max: number): number
  static between(min: number, max: number): number
  static between(min: number, max: number, distribution: (x: number) => number): number
  static between(...args: any[]): number {
    const [min, max, distribution] = PRNG.solveBetweenParameters(args)
    return min + (max - min) * distribution(PRNG.random())
  }

  /**
   * @deprecated Use `PRNG.between` instead.
   */
  static range = PRNG.between // backward compatibility

  static int(maxExclusive: number): number
  static int(min: number, maxExclusive: number): number
  static int(min: number, maxExclusive: number, distribution: (x: number) => number): number
  static int(...args: any[]): number {
    const [min, maxExclusive, distribution] = PRNG.solveBetweenParameters(args)
    return min + Math.floor(distribution(PRNG.random()) * (maxExclusive - min))
  }

  static chance(probability: number): boolean {
    return PRNG.random() < probability
  }

  static shuffle<T>(array: Iterable<T>, out = [...array]): T[] {
    const length = out.length
    for (let i = 0; i < length; i++) {
      const j = Math.floor(length * PRNG.random())
      const temp = out[i]
      out[i] = out[j]
      out[j] = temp
    }
    return out
  }

  static pick<T>(
    items: T[],
    weights?: number[] | null,
    pickOptions?: Partial<PickOptions>,
  ): T
  static pick<T>(
    items: Record<string, T>,
    weights?: Record<string, number> | null,
    pickOptions?: Partial<PickOptions>,
  ): T
  static pick<T>(...args: any[]): T {
    function solveArgs(args: any[]): [options: T[], weights: null | number[], pickOptions: PickOptions] {
      const [items, weights = null, pickOptionsArg] = args
      const pickOptions = { ...defaultPickOptions, ...pickOptionsArg }
      if (Array.isArray(items)) {
        return [items, weights, pickOptions]
      } else if (typeof items === 'object') {
        return [
          Object.values(items) as T[],
          weights ? Object.values(weights) : null,
          pickOptions,
        ]
      }
      throw new Error('PRNG.pick: unsupported options type')
    }

    let [options, weights, { weightsAreNormalized, indexOffset }] = solveArgs(args)
    // If no weights are provided, choose uniformly. Simple.
    if (weights === null) {
      let index = Math.floor(PRNG.random() * options.length)
      if (indexOffset) {
        index += indexOffset
        index %= options.length
        if (index < 0) {
          index += options.length
        }
      }
      return options[index]
    }

    // If weights, normalize them if necessary.
    if (!weightsAreNormalized) {
      const sum = weights.reduce((acc, weight) => acc + weight, 0)
      weights = weights.map(weight => weight / sum)
    }

    // Choose among the options.
    const r = PRNG.random()
    let sum = 0
    for (let i = 0; i < options.length; i++) {
      sum += weights[i]
      if (r < sum) {
        return options[i]
      }
    }
    throw new Error('PRNG.among: unreachable')
  }

  /** 
   * @deprecated Use `PRNG.pick` instead.
   */
  static among = PRNG.pick // backward compatibility

  /**
   * Facilitates picking an option from a list of options with associated weights.
   * 
   * e.g.
   * ```
   * const picker = PRNG.createPicker([
   *   ['red', 1],
   *   ['green', 2],
   *   ['blue', 3],
   * ])
   * 
   * PRNG.seed(56789) // optional (seed can be set at any time)
   * const color = picker() // 50% chance of blue, 33% chance of green, 17% chance of red
   * ```
   */
  static createPicker<T>(
    entries: [T, number][],
  ): () => T {
    const options = entries.map(([entry]) => entry)
    const weights = entries.map(([_, weight]) => weight)
    const sum = weights.reduce((acc, weight) => acc + weight, 0)
    for (const [i, weight] of weights.entries()) {
      weights[i] = weight / sum
    }
    return () => PRNG.pick(options, weights, { weightsAreNormalized: true })
  }

  /**
   * Returns the given vector with each component set to a random value between min and max.
   * 
   * - min, max (defaults to [0, 1]).
   * 
   * Usage:
   * ```
   * PRNG.vector([0, 0, 0]) // e.g. [0.123, 0.456, 0.789]
   * PRNG.vector(new Vector3(), { min: -1, max: 1 }) // e.g. Vector3(-0.123, 0.456, -0.789)
   * ```
   */
  static vector<T>(out: T, options?: [min: number, max: number]): T
  static vector<T>(out: T, options?: { min: number, max: number }): T
  static vector<T>(out: T, options?: any): T {
    const [min = 0, max = 1] =
      Array.isArray(options) ? options : [options?.min, options?.max]
    for (const key of Object.keys(out as any)) {
      (out as any)[key] = PRNG.between(min, max)
    }
    return out
  }

  /**
   * Same as `PRNG.vector`, but the resulting vector is normalized.
   * 
   * - min, max default to [-1, 1].
   */
  static unitVector<T>(out: T, options?: [min: number, max: number]): T
  static unitVector<T>(out: T, options?: { min: number, max: number }): T
  static unitVector<T>(out: T, options?: any): T {
    const [min = -1, max = 1] =
      Array.isArray(options) ? options : [options?.min, options?.max]
    const keys = Object.keys(out as any)
    const values = keys.map(() => PRNG.between(min, max))
    const length = Math.sqrt(values.reduce((acc, value) => acc + value * value, 0))
    for (const [index, key] of keys.entries()) {
      (out as any)[key] = values[index] / length
    }
    return out
  }
}
