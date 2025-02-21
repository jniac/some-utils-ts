export type Promisified<T> = T & PromiseLike<T>;
/**
 * Turns an object into a promise-like object.
 *
 * The following methods will be added:
 *
 * The following methods will be added:
 * - then (promise-like implementation)
 * - catch (promise-like implementation)
 * - finally (promise-like implementation)
 * - resolve (controls the promise)
 * - reject (controls the promise)
 *
 * Usage:
 * ```
 * const value = promisify({ x: 1 })
 * setTimeout(() => {
 *   value.x = 2
 *   value.resolve()
 * }, 1000)
 * console.log(value.x) // 1
 * await value
 * console.log(value.x) // 2
 * ```
 *
 * NOTE: Since the object is modified in-place, it is recommended to use this
 */
export declare function promisify<T extends object>(value: T): Promisified<T> & {
    resolve: () => void;
    reject: (reason?: any) => void;
};
