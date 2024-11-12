import { Vector2Like, Vector3Like } from '../types'

type LoopYield = {
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
}

export function* loop(size: number): Generator<LoopYield> {
  let i = 0
  const out = {
    get i() { return i },
    get t() { return i / size },
    get p() { return i / (size - 1) },
  }
  for (i = 0; i < size; i++) {
    yield out
  }
}

type Loop2Yield = {
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
   * The normalized "progress" x coordinate (0 to 1).
   */
  px: number
  /**
   * The normalized "progress" y coordinate (0 to 1).
   */
  py: number
}
export function loop2(width: number, height: number): Generator<Loop2Yield>
export function loop2(size: Vector2Like | [number, number]): Generator<Loop2Yield>
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
  const out = {
    get i() { return i },
    get x() { return x },
    get y() { return y },
    get tx() { return x / sx },
    get ty() { return y / sy },
    get px() { return x / (sx - 1) },
    get py() { return y / (sy - 1) },
  }
  for (y = 0; y < sy; y++) {
    for (x = 0; x < sx; x++) {
      yield out
      i++
    }
  }
}

type Loop3Yield = {
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
}

/**
 * Allows declarative iteration over a 3D space.
 * 
 * Usage:
 * ```
 * for (const { i, x, y, z } of loop3([10, 10, 10])) {
 *   console.log(i, x, y, z)
 * }
 * ```
 */
export function loop3(width: number, height: number, depth: number): Generator<Loop3Yield>
export function loop3(size: Vector3Like | [number, number, number]): Generator<Loop3Yield>
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
  const out = {
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
