
import { Vector2Like, Vector3Like } from '../types'

export const clamp = (x: number, min: number, max: number) => {
  return x < min ? min : x > max ? max : x
}

export const clamp01 = (x: number) => {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

export const signedClamp = (x: number, max: number) => {
  return x < -max ? -max : x > max ? max : x
}

export const lerp = (a: number, b: number, x: number) => {
  return a + (b - a) * clamp01(x)
}

export const lerpUnclamped = (a: number, b: number, x: number) => {
  return a + (b - a) * x
}

export const inverseLerp = (a: number, b: number, x: number) => {
  return clamp01((x - a) / (b - a))
}

export const inverseLerpUnclamped = (a: number, b: number, x: number) => {
  return (b - x) / (b - a)
}

export const round = (x: number, base = 1) => {
  return Math.round(x / base) * base
}

export const roundPowerOfTwo = (x: number) => {
  return Math.pow(2, Math.round(Math.log2(x)))
}

export const floor = (x: number, base = 1) => {
  return Math.floor(x / base) * base
}

export const floorPowerOfTwo = (x: number) => {
  return Math.pow(2, Math.floor(Math.log2(x)))
}

export const ceil = (x: number, base = 1) => {
  return Math.ceil(x / base) * base
}

export const ceilPowerOfTwo = (x: number) => {
  return Math.pow(2, Math.ceil(Math.log2(x)))
}

export const toff = (x: number) => {
  return clamp(Math.floor(0x100 * x), 0, 0xff)
}

export const limited = (x: number, limit: number) => {
  return x * limit / (x + limit)
}

export const signedLimited = (x: number, limit: number) => {
  return x < 0 ? -limited(-x, limit) : limited(x, limit)
}

/**
 * Returns the "positive" modulo of "x".
 * ```
 * positiveModulo(-2, 10) // -> 8
 * ```
 */
export const positiveModulo = (x: number, base: number) => {
  x %= base
  return x < 0 ? x + base : x
}

/**
 * Return an half-positive-half-negative-modulo, eg:
 * ```
 * middleModulo(190, 360) // -> -170
 * middleModulo(-190, 360) // -> 170
 * middleModulo(370, 360) // -> 10
 * ```
 */
export const middleModulo = (x: number, modulo: number) => {
  x %= modulo
  return x < -modulo / 2 ? x + modulo : x > modulo / 2 ? x - modulo : x
}

/**
 * Clamps a value with progressive limit. Useful for user "drag" feedbacks.
 * https://www.desmos.com/calculator/vssiyqze6q
 */
export const limitedClamp = (x: number, min: number, minLimit: number, max: number, maxLimit: number) => {
  let limit = 0, delta = 0
  return (
    x < min ? min + (limit = minLimit - min) * (delta = x - min) / (limit + delta) :
      x > max ? max + (limit = maxLimit - max) * (delta = x - max) / (limit + delta) :
        x
  )
}

/**
 * Converts a 1D index to a 2D position.
 */
export const index2 = (index: number, width: number) => {
  const y = Math.floor(index / width)
  return [index - y * width, y]
}

/**
 * Converts a 1D index to a 3D position.
 */
export const index3 = (index: number, width: number, height: number) => {
  const z = Math.floor(index / (width * height))
  const rest = index - z * width * height
  const y = Math.floor(rest / width)
  return [rest - y * width, y, z]
}

export const distance2 = (x: number, y: number) => {
  return Math.sqrt(x * x + y * y)
}

export const distance3 = (x: number, y: number, z: number) => {
  return Math.sqrt(x * x + y * y + z * z)
}

export function distance(a: Vector2Like | Vector3Like, b: Vector2Like | Vector3Like): number
export function distance(x: number, y: number, z: number): number
export function distance(...args: any[]) {
  if (args.length === 2) {
    const [a, b] = args
    return ('z' in a
      ? distance3(a.x - b.x, a.y - b.y, a.z - b.z)
      : distance2(a.x - b.x, a.y - b.y))
  }
  const [x, y, z] = args
  return (z !== undefined
    ? distance3(x.x, x.y, x.z)
    : distance2(x, y))
}