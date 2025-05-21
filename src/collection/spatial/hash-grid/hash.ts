const PRIME1 = 48271
const PRIME2 = 2246822519
const PRIME3 = 3266489917
const PRIME4 = 668265263
const PRIME5 = 374761393
const PRIME6 = 2654435761

function mix(x: number, shift = 2, factor = 6329): number {
  x = Math.imul(x, factor)
  return (x << shift) | (x >>> (32 - shift))
}

const f64 = new Float64Array(1)
const i32 = new Int32Array(f64.buffer)

/**
 * An hash function that takes two numbers (x, y) and returns a 32-bit integer.
 *
 * Collision rate is very, very low:
 *
 * Here are the results of tests with 16_000_000 random & sequential pairs of numbers:
 * - random pairs: collision ratio: 0.19% (one collision every 5000 pairs)
 * - sequential pairs: collision ratio: 0.02% (one collision every 50_000 pairs)
 * ```
 * {
 *   method: 'hash2:random',
 *   elapsed: 0.27758300000004965,
 *   hashPerMillisecond: 36025,
 *   collisionCount: 29896,
 *   totalCount: 16000000,
 *   collisionRatio: 0.0018685,
 *   maxCollisionForHash: 2
 * }
 * {
 *   method: 'hash2:sequential',
 *   elapsed: 0.29354199999943376,
 *   hashPerMillisecond: 34066,
 *   collisionCount: 3248,
 *   totalCount: 16000000,
 *   collisionRatio: 0.000203,
 *   maxCollisionForHash: 1
 * }
 *  ```
 */
export function hash2(x: number, y: number): number {
  f64[0] = x
  const x1 = i32[0]
  const x2 = i32[1]

  f64[0] = y
  const y1 = i32[0]
  const y2 = i32[1]

  return 0b00010011000111100110001110111101 ^ (
    (mix(x1, 3, PRIME1) ^ mix(x2, 17, PRIME2)) ^
    (mix(y1, 13, PRIME3) ^ mix(y2, 27, PRIME4))
  )
}

export function hash3(x: number, y: number, z: number): number {
  f64[0] = x
  const x1 = i32[0]
  const x2 = i32[1]

  f64[0] = y
  const y1 = i32[0]
  const y2 = i32[1]

  f64[0] = z
  const z1 = i32[0]
  const z2 = i32[1]

  return 0b10011010010110000110000001010111 ^ (
    (mix(x1, 3, PRIME1) ^ mix(x2, 17, PRIME2)) ^
    (mix(y1, 13, PRIME3) ^ mix(y2, 27, PRIME4)) ^
    (mix(z1, 5, PRIME5) ^ mix(z2, 19, PRIME6))
  )
}

export function hashN(...args: number[]): number {
  let h = 0b10010110110101010000111011011111
  let i = 0
  for (; i < args.length - 1; i += 2)
    h = hash3(h, args[i], args[i + 1])
  for (; i < args.length; i++)
    h = hash2(h, args[i])
  return h
}

/**
 * Convenient function to hash a vector or a list of numbers.
 * 
 * Note:
 * - If a single argument is passed and it is an object, it will be converted to 
 *   an array of numbers.
 * - Uses internal hash2 and hash3 functions to hash 2D and 3D vectors.
 */
export function hashX(vector: unknown): number
export function hashX(...args: number[]): number
export function hashX(...args: any[]): number {
  if (args.length === 1 && typeof args[0] === 'object')
    args = Object.values(args[0]).filter(v => typeof v === 'number')

  switch (args.length) {
    case 2: return hash2(args[0], args[1])
    case 3: return hash3(args[0], args[1], args[2])
    default: return hashN(...args)
  }
}
