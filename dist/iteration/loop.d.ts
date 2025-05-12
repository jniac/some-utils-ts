import { Vector2Like, Vector3Like } from '../types';
export type LoopResult = {
    /**
     * The current iteration index.
     */
    i: number;
    /**
     * The normalized "time" coordinate (0 to (size - 1) / size).
     */
    t: number;
    /**
     * The normalized "time" coordinate (0 to 1).
     */
    p: number;
    /**
     * The size of the loop.
     */
    size: number;
    /**
     * Clone the current yield object (save the reference).
     */
    clone(): LoopResult;
};
/**
 * Loop over a range of numbers (one-dimensional).
 *
 * Important: The yield object is mutable, for performance reasons it is reused
 * on each iteration. If you need to store the values, you should clone the object,
 * or use the {@link loopArray} function.
 *
 * Usage:
 * ```
 * for (const { i, t, p } of loop(10)) {
 *   console.log(i, t, p)
 * }
 * ```
 */
export declare function loop(size: number): Generator<LoopResult>;
/**
 * Loop over a range of numbers (one-dimensional) and store the results in an array.
 *
 * Usage:
 * ```
 * const results = loopArray(10)
 * ```
 */
export declare function loopArray<T = LoopResult>(size: number, map?: (it: LoopResult) => T): T[];
export type Loop2Result = {
    /**
     * The current iteration index.
     */
    i: number;
    /**
     * The current x coordinate.
     */
    x: number;
    /**
     * The current y coordinate.
     */
    y: number;
    /**
     * The normalized "time" x coordinate (0 to (size - 1) / size).
     */
    tx: number;
    /**
     * The normalized "time" y coordinate (0 to (size - 1) / size).
     */
    ty: number;
    /**
     * The normalized "progress" x coordinate (0 to 1).
     */
    px: number;
    /**
     * The normalized "progress" y coordinate (0 to 1).
     */
    py: number;
    /**
     * The x size of the loop.
     */
    sizeX: number;
    /**
     * The y size of the loop.
     */
    sizeY: number;
    /**
     * Clone the current yield object (save the reference).
     */
    clone(): Loop2Result;
};
/**
 * Allows declarative iteration over a 2D space.
 *
 * Important: The yield object is mutable, for performance reasons it is reused
 * on each iteration. If you need to store the values, you should clone the object,
 * or use the {@link loop2Array} function.
 *
 * Usage:
 * ```
 * for (const { i, x, y } of loop2(10, 10)) {
 *  console.log(i, x, y)
 * }
 * ```
 */
export declare function loop2(width: number, height: number): Generator<Loop2Result>;
export declare function loop2(size: Vector2Like | [number, number]): Generator<Loop2Result>;
/**
 * Allows declarative iteration over a 2D space and store the results in an array.
 *
 * Usage:
 * ```
 * const results = loop2Array(10, 10)
 * ```
 */
export declare function loop2Array<T = Loop2Result>(width: number, height: number, map?: (it: Loop2Result) => T): T[];
export declare function loop2Array<T = Loop2Result>(size: Vector2Like | [number, number], map?: (it: Loop2Result) => T): T[];
export type Loop3Result = {
    /**
     * The current iteration index.
     */
    i: number;
    /**
     * The current x coordinate.
     */
    x: number;
    /**
     * The current y coordinate.
     */
    y: number;
    /**
     * The current z coordinate.
     */
    z: number;
    /**
     * The normalized "time" x coordinate (0 to (size - 1) / size).
     */
    tx: number;
    /**
     * The normalized "time" y coordinate (0 to (size - 1) / size).
     */
    ty: number;
    /**
     * The normalized "time" z coordinate (0 to (size - 1) / size).
     */
    tz: number;
    /**
     * The normalized "progress" x coordinate (0 to 1).
     */
    px: number;
    /**
     * The normalized "progress" y coordinate (0 to 1).
     */
    py: number;
    /**
     * The normalized "progress" z coordinate (0 to 1).
     */
    pz: number;
    /**
     * Clone the current yield object (save the reference).
     */
    clone(): Loop3Result;
};
/**
 * Allows declarative iteration over a 3D space.
 *
 * Important: The yield object is mutable, for performance reasons it is reused
 * on each iteration. If you need to store the values, you should clone the object,
 * or use the {@link loop3Array} function.
 *
 * Usage:
 * ```
 * for (const { i, x, y, z } of loop3([10, 10, 10])) {
 *   console.log(i, x, y, z)
 * }
 * ```
 */
export declare function loop3(width: number, height: number, depth: number): Generator<Loop3Result>;
export declare function loop3(size: Vector3Like | [number, number, number]): Generator<Loop3Result>;
/**
 * Allows declarative iteration over a 3D space and store the results in an array.
 *
 * Usage:
 * ```
 * const results = loop3Array(10, 10, 10)
 * ```
 */
export declare function loop3Array(width: number, height: number, depth: number): Loop3Result[];
export declare function loop3Array(size: Vector3Like | [number, number, number]): Loop3Result[];
//# sourceMappingURL=loop.d.ts.map