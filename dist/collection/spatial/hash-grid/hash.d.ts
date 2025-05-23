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
export declare function hash2(x: number, y: number): number;
export declare function hash3(x: number, y: number, z: number): number;
export declare function hashN(...args: number[]): number;
/**
 * Convenient function to hash a vector or a list of numbers.
 *
 * Note:
 * - If a single argument is passed and it is an object, it will be converted to
 *   an array of numbers.
 * - Uses internal hash2 and hash3 functions to hash 2D and 3D vectors.
 */
export declare function hashX(vector: unknown): number;
export declare function hashX(...args: number[]): number;
//# sourceMappingURL=hash.d.ts.map