const PRIME1 = 48271
const PRIME2 = 2246822519
const PRIME3 = 3266489917
const PRIME4 = 668265263
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

  return (
    mix(x1, 3, PRIME1) ^
    mix(y1, 17, PRIME2)) ^ (
      mix(x2, 13, PRIME3) ^
      mix(y2, 27, PRIME4))
}
