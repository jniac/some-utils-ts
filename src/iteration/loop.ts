import { Vector3Like } from '../types'

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
export function* loop3(size: Vector3Like | [number, number, number]) {
  if (Array.isArray(size)) {
    size = { x: size[0], y: size[1], z: size[2] }
  }
  const out = {
    i: 0,
    x: 0,
    y: 0,
    z: 0,
  }
  let i = 0
  for (let z = 0; z < size.z; z++) {
    for (let y = 0; y < size.y; y++) {
      for (let x = 0; x < size.x; x++) {
        out.i = i++
        out.x = x
        out.y = y
        out.z = z
        yield out
      }
    }
  }
}
