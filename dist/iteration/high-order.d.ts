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
export declare function split<T>(array: T[], predicate: (value: T) => number): (T[] | undefined)[];
export declare function split<T>(array: T[], predicate: (value: T) => number, count: number): T[][];
