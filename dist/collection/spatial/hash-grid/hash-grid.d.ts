/**
 * A hash grid that uses a hash function to map 2D coordinates (x, y) to a 32-bit
 * integer map.
 *
 * Hash grids are useful for spatial partitioning, for example in games or
 * simulations, to run spatial algorithms like raycasting, pathfinding, random
 * sampling, etc.
 *
 * A cell size can be specified to group values into cells. If the cell size is 0,
 * the hash function will use the exact coordinates, otherwise it will use the
 * coordinates divided by the cell size.
 *
 * The hash function is very fast and has a very low collision rate.
 *
 * Note:
 * - Cell size can be omitted or set to 0 for exact coordinates, it's ok.
 * - The grid is memory-optimized and use linked lists only when there are more
 *   than 1 value in the same cell.
 */
export declare class HashGrid2<T> {
    #private;
    get cellCount(): number;
    get valueCount(): number;
    get cellSize(): number;
    constructor(cellSize?: number);
    clear(): void;
    hasCell(x: number, y: number): boolean;
    has(x: number, y: number): boolean;
    get(x: number, y: number): T | undefined;
    set(x: number, y: number, value: T | undefined): void;
    delete(x: number, y: number): boolean;
    cellValues(x: number, y: number): Generator<T, void, unknown>;
    values(): Generator<T, void, unknown>;
    entries(): Generator<[x: number, y: number, value: T], void, unknown>;
    mapEntries<V>(fn: (x: number, y: number, value: T) => V): V[];
}
//# sourceMappingURL=hash-grid.d.ts.map