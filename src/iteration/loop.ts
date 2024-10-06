import { Vector2Like, Vector3Like } from '../types'

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
   * The normalized x coordinate (0 to 1).
   */
  tx: number
  /**
   * The normalized y coordinate (0 to 1).
   */
  ty: number
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
    get tx() { return x / (sx - 1) },
    get ty() { return y / (sy - 1) },
  }
  for (y = 0; y < sy; y++) {
    for (x = 0; x < sx; x++) {
      yield out
      i++
    }
  }
}

type Loop3Yield = { i: number, x: number, y: number, z: number, tx: number, ty: number, tz: number }

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
    get tx() { return x / (sx - 1) },
    get ty() { return y / (sy - 1) },
    get tz() { return z / (sz - 1) },
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
