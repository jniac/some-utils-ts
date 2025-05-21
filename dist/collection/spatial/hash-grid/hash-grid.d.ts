type Entry2<T> = [x: number, y: number, value: T];
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
    constructor(cellSize?: number);
    clear(): void;
    hasCell(x: number, y: number): boolean;
    has(x: number, y: number): boolean;
    get(x: number, y: number): T | undefined;
    set(x: number, y: number, value: T | undefined): void;
    delete(x: number, y: number): boolean;
    /**
     * Returns a generator of all values in the cell at (x, y).
     */
    cellEntries(x: number, y: number): Generator<Entry2<T>, void, unknown>;
    cellFirstEntry(x: number, y: number): Entry2<T> | undefined;
    cellNeighborEntries(x: number, y: number, neighborExtent?: number): Generator<Entry2<T>, void, unknown>;
    entries(): Generator<Entry2<T>, void, unknown>;
    cellValues(x: number, y: number): Generator<T, void, unknown>;
    values(): Generator<T, void, unknown>;
    mapEntries<V>(fn: (x: number, y: number, value: T) => V): V[];
    /**
     * Returns a generator of all the entries in the grid that are within a circle of
     * radius `radius` centered at (x, y).
     */
    query(x: number, y: number, radius: number): Generator<Entry2<T>, void, unknown>;
    /**
     * Returns the first entry in the grid that is within a circle of radius
     * `radius` centered at (x, y).
     *
     * Note: The first entry is not necessarily the closest one.
     */
    queryFirst(x: number, y: number, radius: number): Entry2<T> | undefined;
    /**
     * Returns the closest entry in the grid that is within a circle of radius
     * `radius` centered at (x, y).
     */
    queryNearest(x: number, y: number, radius: number): Entry2<T> | undefined;
    get cellCount(): number;
    get valueCount(): number;
    get cellSize(): number;
    /**
     * The same hash function that is used to store the values in the grid (based
     * on the cell size).
     */
    get cellHash(): (x: number, y: number) => number;
    floor(x: number): number;
    ceil(x: number): number;
    round(x: number): number;
    computeMaxValueCountPerCell(): number;
}
export {};
//# sourceMappingURL=hash-grid.d.ts.map