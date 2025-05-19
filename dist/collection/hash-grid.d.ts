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
/**
 * A hash grid that uses a hash function to map 2D coordinates (x, y) to a 32-bit
 * integer map.
 *
 * It uses internally a linked list to handle collisions.
 *
 * The hash function is very fast and has a very low collision rate.
 *
 * Hash grids are useful for spatial partitioning, for example in games or
 * simulations, to run spatial algorithms like raycasting, pathfinding, random
 * sampling, etc.
 */
export declare class HashGrid2<T> {
    #private;
    get mapSize(): number;
    get size(): number;
    clear(): void;
    has(x: number, y: number): boolean;
    get(x: number, y: number): T | undefined;
    set(x: number, y: number, value: T | undefined): void;
    delete(x: number, y: number): boolean;
}
//# sourceMappingURL=hash-grid.d.ts.map