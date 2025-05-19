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