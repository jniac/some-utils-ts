import { Vector2Like, Vector3Like } from '../types'

export type LoopResult = {
  /**
   * The current iteration index.
   */
  i: number
  /**
   * The normalized "time" coordinate (0 to (size - 1) / size).
   */
  t: number
  /**
   * The normalized "time" coordinate (0 to 1).
   */
  p: number
  /**
   * Clone the current yield object (save the reference).
   */
  clone(): LoopResult
}

/**
 * Loop over a range of numbers (one-dimensional).
 * 
 * Important: The yield object is mutable, for performance reasons it is reused 
 * on each iteration. If you need to store the values, you should clone the object,
 * or use the {@link loopArray} function.
 * 
 * Usage:
 * ```
 * for (const { i, t, p } of loop(10)) {
 *   console.log(i, t, p)
 * }
 * ```
 */
export function* loop(size: number): Generator<LoopResult> {
  let i = 0
  const out: LoopResult = {
    get i() { return i },
    get t() { return i / size },
    get p() { return i / (size - 1) },
    clone() { return { ...this } }
  }
  for (i = 0; i < size; i++) {
    yield out
  }
}

/**
 * Loop over a range of numbers (one-dimensional) and store the results in an array.
 * 
 * Usage:
 * ```
 * const results = loopArray(10)
 * ```
 */
export function loopArray<T = LoopResult>(size: number, map?: (it: LoopResult) => T): T[] {
  const out: T[] = []
  // @ts-ignore
  for (const item of loop(size)) {
    const it = item.clone()
    out.push(map ? map(it) : it as T)
  }
  return out
}

export type Loop2Result = {
  /**
   * The current iteration index.
   */
  i: number
  /**
   * The current x coordinate.
   */
  x: number
  /**
   * The current y coordinate.
   */
  y: number
  /**
   * The normalized "time" x coordinate (0 to (size - 1) / size).
   */
  tx: number
  /**
   * The normalized "time" y coordinate (0 to (size - 1) / size).
   */
  ty: number
  /**
   * The normalized "progress" x coordinate (0 to 1).
   */
  px: number
  /**
   * The normalized "progress" y coordinate (0 to 1).
   */
  py: number
  /**
   * Clone the current yield object (save the reference).
   */
  clone(): Loop2Result
}

/**
 * Allows declarative iteration over a 2D space.
 * 
 * Important: The yield object is mutable, for performance reasons it is reused
 * on each iteration. If you need to store the values, you should clone the object,
 * or use the {@link loop2Array} function.
 * 
 * Usage:
 * ```
 * for (const { i, x, y } of loop2(10, 10)) {
 *  console.log(i, x, y)
 * }
 * ```
 */
export function loop2(width: number, height: number): Generator<Loop2Result>
export function loop2(size: Vector2Like | [number, number]): Generator<Loop2Result>
export function* loop2(...args: any[]) {
  let sx = 0, sy = 0
  if (args.length === 2) {
    sx = args[0]
    sy = args[1]
  } else {
    if (Array.isArray(args[0])) {
      sx = args[0][0]
      sy = args[0][1]
    } else {
      sx = args[0].x
      sy = args[0].y
    }
  }
  let i = 0
  let x = 0
  let y = 0
  const out: Loop2Result = {
    get i() { return i },
    get x() { return x },
    get y() { return y },
    get tx() { return x / sx },
    get ty() { return y / sy },
    get px() { return x / (sx - 1) },
    get py() { return y / (sy - 1) },
    clone() { return { ...this } }
  }
  for (y = 0; y < sy; y++) {
    for (x = 0; x < sx; x++) {
      yield out
      i++
    }
  }
}

/**
 * Allows declarative iteration over a 2D space and store the results in an array.
 * 
 * Usage:
 * ```
 * const results = loop2Array(10, 10)
 * ```
 */
export function loop2Array(width: number, height: number): Loop2Result[]
export function loop2Array(size: Vector2Like | [number, number]): Loop2Result[]
export function loop2Array(...args: any[]) {
  const out: Loop2Result[] = []
  // @ts-ignore
  for (const item of loop2(...args)) {
    out.push(item.clone())
  }
  return out
}

export type Loop3Result = {
  /**
   * The current iteration index.
   */
  i: number
  /**
   * The current x coordinate.
   */
  x: number
  /**
   * The current y coordinate.
   */
  y: number
  /**
   * The current z coordinate.
   */
  z: number
  /**
   * The normalized "time" x coordinate (0 to (size - 1) / size).
   */
  tx: number
  /**
   * The normalized "time" y coordinate (0 to (size - 1) / size).
   */
  ty: number
  /**
   * The normalized "time" z coordinate (0 to (size - 1) / size).
   */
  tz: number
  /**
   * The normalized "progress" x coordinate (0 to 1).
   */
  px: number
  /**
   * The normalized "progress" y coordinate (0 to 1).
   */
  py: number
  /**
   * The normalized "progress" z coordinate (0 to 1).
   */
  pz: number
  /**
   * Clone the current yield object (save the reference).
   */
  clone(): Loop3Result
}

/**
 * Allows declarative iteration over a 3D space.
 * 
 * Important: The yield object is mutable, for performance reasons it is reused
 * on each iteration. If you need to store the values, you should clone the object,
 * or use the {@link loop3Array} function.
 * 
 * Usage:
 * ```
 * for (const { i, x, y, z } of loop3([10, 10, 10])) {
 *   console.log(i, x, y, z)
 * }
 * ```
 */
export function loop3(width: number, height: number, depth: number): Generator<Loop3Result>
export function loop3(size: Vector3Like | [number, number, number]): Generator<Loop3Result>
export function* loop3(...args: any[]) {
  let sx = 0, sy = 0, sz = 0
  if (args.length === 3) {
    sx = args[0]
    sy = args[1]
    sz = args[2]
  } else {
    if (Array.isArray(args[0])) {
      sx = args[0][0]
      sy = args[0][1]
      sz = args[0][2]
    } else {
      sx = args[0].x
      sy = args[0].y
      sz = args[0].z
    }
  }
  let i = 0
  let x = 0
  let y = 0
  let z = 0
  const out: Loop3Result = {
    get i() { return i },
    get x() { return x },
    get y() { return y },
    get z() { return z },
    get tx() { return x / sx },
    get ty() { return y / sy },
    get tz() { return z / sz },
    get px() { return x / (sx - 1) },
    get py() { return y / (sy - 1) },
    get pz() { return z / (sz - 1) },
    clone() { return { ...this } }
  }
  for (z = 0; z < sz; z++) {
    for (y = 0; y < sy; y++) {
      for (x = 0; x < sx; x++) {
        yield out
        i++
      }
    }
  }
}

/**
 * Allows declarative iteration over a 3D space and store the results in an array.
 * 
 * Usage:
 * ```
 * const results = loop3Array(10, 10, 10)
 * ```
 */
export function loop3Array(width: number, height: number, depth: number): Loop3Result[]
export function loop3Array(size: Vector3Like | [number, number, number]): Loop3Result[]
export function loop3Array(...args: any[]) {
  const out: Loop3Result[] = []
  // @ts-ignore
  for (const item of loop3(...args)) {
    out.push(item.clone())
  }
  return out
}
