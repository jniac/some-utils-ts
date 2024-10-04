import { Vector2Like, Vector3Like } from '../types'

type Loop2Yield = { i: number, x: number, y: number, tx: number, ty: number }
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
export function loop3(width: number, height: number, depth: number): Generator<{ i: number, x: number, y: number, z: number }>
export function loop3(size: Vector3Like | [number, number, number]): Generator<{ i: number, x: number, y: number, z: number }>
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
  const out = {
    i: 0,
    x: 0,
    y: 0,
    z: 0,
  }
  let i = 0
  for (let z = 0; z < sz; z++) {
    for (let y = 0; y < sy; y++) {
      for (let x = 0; x < sx; x++) {
        out.i = i++
        out.x = x
        out.y = y
        out.z = z
        yield out
      }
    }
  }
}
