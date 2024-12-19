import { Vector2Like, Vector3Like, Vector4Like } from '../types'
import {
  DEFAULT_SEED,
  MAX,
  init as _init,
  map as _map,
  next as _next
} from './algorithm/parkmiller-c-iso'

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
  /**
   * If non-empty, the items in this array will be forbidden. 
   * 
   * If all items are forbidden, the function will throw an error.
   */
  forbiddenItems: [] as any[],
}

type PickOptions<T> = typeof defaultPickOptions & {
  forbiddenItems: T[]
}

type Core = ReturnType<typeof create>

function create() {
  let state = _next(_next(_init(DEFAULT_SEED)))

  function seed(seed: number | string = DEFAULT_SEED): Core {
    if (typeof seed === 'string') {
      seed = seed.split('').reduce((acc, char) => acc * 7 + char.charCodeAt(0), 0)
    }
    state = _next(_next(_init(seed))) // warm up
    return prng
  }

  function seedMax() {
    return MAX
  }

  /**
   * Similar to `seed`, but here the seed is set to the default seed.
   */
  function reset(): Core {
    seed(DEFAULT_SEED)
    return prng
  }

  /**
   * Consumes the next random number in the sequence.
   */
  function next(): Core {
    state = _next(state)
    return prng
  }

  /**
   * Returns a random number.
   */
  function random(): number {
    state = _next(state)
    return _map(state)
  }

  // sugar-syntax:
  function solveBetweenParameters(parameters: any[]): [number, number, (x: number) => number] {
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
  /**
   * Returns a random number between min and max.
   */
  function between(): number
  function between(max: number): number
  function between(min: number, max: number): number
  function between(min: number, max: number, distribution: (x: number) => number): number
  function between(...args: any[]): number {
    const [min, max, distribution] = solveBetweenParameters(args)
    return min + (max - min) * distribution(random())
  }

  /**
   * Returns a random number between -extent and extent.
   * 
   * If distribution is provided, it will be used to transform the random value 
   * "around" the center (0) value.
   */
  function around(): number
  function around(extent: number): number
  function around(extent: number, distribution: (x: number) => number): number
  function around(...args: any[]): number {
    const [extent = 1, distribution = identity] = args
    const value = random() * 2
    const sign = value > 1 ? 1 : -1
    return sign * distribution(value > 1 ? value - 1 : value) * extent
  }

  function int(maxExclusive: number): number
  function int(min: number, maxExclusive: number): number
  function int(min: number, maxExclusive: number, distribution: (x: number) => number): number
  function int(...args: any[]): number {
    const [min, maxExclusive, distribution] = solveBetweenParameters(args)
    return min + Math.floor(distribution(random()) * (maxExclusive - min))
  }

  function chance(probability: number): boolean {
    return random() < probability
  }

  /**
   * Shuffles the items of an array into a new one.
   * 
   * To mutate the original array, use the option `mutate = true`.
   * 
   * NOTE: If mutate is set to true, and the source is not an array (but anything
   * else iterable), it will return a copy instead (only array can be mutated).
   */
  function shuffle<T>(array: Iterable<T>, { mutate = false } = {}): T[] {
    const result = mutate && Array.isArray(array) ? array : [...array]
    const length = result.length
    for (let i = 0; i < length; i++) {
      const j = Math.floor(length * random())
      const temp = result[i]
      result[i] = result[j]
      result[j] = temp
    }
    return result
  }

  /**
   * Returns a random item from the given list of items.
   * 
   * If weights are provided, the items will be picked with the given weights.
   * @param items The list of items to pick from.
   * @param weights The list of weights associated with the items (optional).
   * @param pickOptions Some options to control the behavior of the function (optional).
   */
  function pick<T>(
    items: T[],
    weights?: number[] | null,
    pickOptions?: Partial<PickOptions<T>>,
  ): T
  function pick<T>(
    items: Record<string, T>,
    weights?: Record<string, number> | null,
    pickOptions?: Partial<PickOptions<T>>,
  ): T
  function pick<T>(...args: any[]): T {
    function solveArgs(args: any[]): [options: T[], weights: null | number[], pickOptions: PickOptions<T>] {
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
      throw new Error('pick: unsupported options type')
    }

    let [options, weights, { weightsAreNormalized, indexOffset, forbiddenItems }] = solveArgs(args)

    if (forbiddenItems.length > 0) {
      const forbiddenIndexes = new Set<number>()
      for (const item of forbiddenItems) {
        const index = options.indexOf(item)
        if (index >= 0) {
          forbiddenIndexes.add(index)
        }
      }

      options = options.filter((_, index) => !forbiddenIndexes.has(index))
      weights = weights?.filter((_, index) => !forbiddenIndexes.has(index)) ?? null

      if (options.length === 0) {
        throw new Error('pick: all items are forbidden')
      }
    }

    // If no weights are provided, choose uniformly. Simple.
    if (weights === null) {
      let index = Math.floor(random() * options.length)
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
    const r = random()
    let sum = 0
    for (let i = 0; i < options.length; i++) {
      sum += weights[i]
      if (r < sum) {
        return options[i]
      }
    }
    throw new Error('among: unreachable')
  }

  /**
   * Facilitates picking an option from a list of options with associated weights.
   * 
   * e.g.
   * ```
   * const picker = createPicker([
   *   ['red', 1],
   *   ['green', 2],
   *   ['blue', 3],
   * ])
   * 
   * seed(56789) // optional (seed can be set at any time)
   * const color = picker() // 50% chance of blue, 33% chance of green, 17% chance of red
   * ```
   */
  function createPicker<T>(
    entries: [T, number][],
  ): () => T {
    const options = entries.map(([entry]) => entry)
    const weights = entries.map(([_, weight]) => weight)
    const sum = weights.reduce((acc, weight) => acc + weight, 0)
    for (const [i, weight] of weights.entries()) {
      weights[i] = weight / sum
    }
    return () => pick(options, weights, { weightsAreNormalized: true })
  }

  /**
   * Returns the given vector with each component set to a random value between min and max.
   * 
   * - min, max (defaults to [0, 1]).
   * 
   * Usage:
   * ```
   * vector([0, 0, 0]) // e.g. [0.123, 0.456, 0.789]
   * vector(new Vector3(), { min: -1, max: 1 }) // e.g. Vector3(-0.123, 0.456, -0.789)
   * ```
   */
  function vector<T>(out: T, options?: [min: number, max: number]): T
  function vector<T>(out: T, options?: { min: number, max: number }): T
  function vector<T>(out: T, options?: any): T {
    const [min = 0, max = 1] =
      Array.isArray(options) ? options : [options?.min, options?.max]
    for (const key of Object.keys(out as any)) {
      (out as any)[key] = between(min, max)
    }
    return out
  }

  /**
   * Generates a truly random vector (i.e. each component is normally distributed, no box artifacts).
   * 
   * The length of the vector is distributed according to the normal distribution with mean = 0 and standard deviation = 1.
   */
  function normalVector<T>(out: T): T {
    const keys = Object.keys(out as any)
    const max = keys.length
    const d = Math.sqrt(max)
    const value = out as any
    for (let i = 0; i < max; i += 2) {
      const [u, v] = boxMuller()
      value[keys[i]] = u / d
      if (i + 1 < max) {
        value[keys[i + 1]] = v / d
      }
    }
    return out
  }

  /**
   * Same as `vector`, but the resulting vector is normalized (whatever its dimension).
   * 
   * Similar to `normalVector`, but with normalization for any dimension.
   */
  function unitVector<T>(out: T): T {
    const keys = Object.keys(out as any)
    const max = keys.length
    let d = 0
    const value = out as any
    for (let i = 0; i < max; i += 2) {
      const [u, v] = boxMuller()
      value[keys[i]] = u
      d += u * u
      if (i + 1 < max) {
        value[keys[i + 1]] = v
        d += v * v
      }
    }
    d = Math.sqrt(d)
    for (let i = 0; i < max; i++) {
      (out as any)[keys[i]] /= d
    }
    return out
  }

  function unitVector2<T extends Vector2Like>(out: T): T {
    const u = random()
    const phi = 2 * Math.PI * u

    out.x = Math.cos(phi)
    out.y = Math.sin(phi)

    return out
  }

  function unitVector3<T extends Vector3Like>(out: T): T {
    const u = random()
    const v = random()

    const phi = 2 * Math.PI * u // Azimuthal angle
    const theta = Math.acos(1 - 2 * v) // Polar angle

    out.x = Math.sin(theta) * Math.cos(phi)
    out.y = Math.sin(theta) * Math.sin(phi)
    out.z = Math.cos(theta)

    return out
  }

  /**
   * https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
   */
  function boxMuller(mean = 0, stdDev = 1): [number, number] {
    const u1 = random()
    const u2 = random()
    const r = Math.sqrt(-2 * Math.log(u1))
    const theta = 2 * Math.PI * u2
    const z0 = mean + stdDev * r * Math.cos(theta)
    const z1 = mean + stdDev * r * Math.sin(theta)
    return [z0, z1]
  }

  function quaternion<T extends Vector4Like>(out: T): T {
    const u1 = random()
    const u2 = random()
    const u3 = random()

    const sqrt1MinusU1 = Math.sqrt(1 - u1)
    const sqrtU1 = Math.sqrt(u1)

    out.x = sqrt1MinusU1 * Math.sin(2 * Math.PI * u2)
    out.y = sqrt1MinusU1 * Math.cos(2 * Math.PI * u2)
    out.z = sqrtU1 * Math.sin(2 * Math.PI * u3)
    out.w = sqrtU1 * Math.cos(2 * Math.PI * u3)

    return out
  }

  const prng = {
    seed,
    seedMax,
    reset,
    next,

    random,
    between,
    around,
    int,
    chance,
    shuffle,
    pick,
    createPicker,
    vector,
    unitVector2,
    unitVector3,
    normalVector,
    unitVector,
    boxMuller,
    quaternion,
  }

  return prng
}

type PRNG = Core & (new (seed?: number) => Core)

/**
 * A pseudo-random number generator based on Park-Miller algorithm.
 * 
 * It can be used:
 * - as a static class, 
 * - or through instance (for seed encapsulation).
 * 
 * ```
 * // Static usage:
 * PRNG.seed(123456789)
 * console.log(PRNG.random()) // 0.114580294689704
 * console.log(PRNG.shuffle([...'abcd'])) // ['b', 'c', 'a', 'd']
 * 
 * // Instance usage:
 * const r = new PRNG(123456789)
 * console.log(r.random()) // 0.114580294689704
 * console.log(r.shuffle([...'abcd'])) // ['b', 'c', 'a', 'd']
 * ```
 */
const _PRNG = class {
  constructor(seed: number) {
    Object.assign(this, create().seed(seed))
  }
} as PRNG

Object.assign(_PRNG, create())

export { _PRNG as PRNG }
