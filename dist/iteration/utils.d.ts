/**
 * Same as `Array.prototype.some` but for iterables
 */
export declare function some<T>(values: Iterable<T>, predicate: (value: T) => boolean): boolean;
/**
 * Same as `Array.prototype.every` but for iterables
 */
export declare function every<T>(values: Iterable<T>, predicate: (value: T) => boolean): boolean;
/**
 * Split an array into multiple arrays based on a predicate.
 *
 * Warning:
 * - If `count` is provided, the result will be an array of arrays with the length
 * of `count`, where each array contains the values that match the predicate.
 *
 * - If `count` is not provided, the result will be an array of arrays where there
 * may be `undefined` values if there are no values that match the predicate.
 */
export declare function distribute<T>(array: T[], predicate: (value: T) => number): (T[] | undefined)[];
export declare function distribute<T>(array: T[], predicate: (value: T) => number, count: number): T[][];
/**
 * Allows you to iterate over pairs of values in an iterable.
 *
 * Usage:
 * ```
 * for (const [a, b] of pairwise([1, 2, 3, 4])) {
 *   console.log(a, b) // 1 2, 2 3, 3 4
 * }
 * ```
 */
export declare function pairwise<T>(values: Iterable<T>): Generator<[T, T]>;
export declare function findMaxBy<T>(items: Iterable<T>, score: (item: T) => number): T | undefined;
export declare function uniqueBy<T>(keyFn: (item: T) => any): (item: T) => boolean;
