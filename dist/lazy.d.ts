/**
 * `lazy()` is for saving resources by waiting for a first request before
 * initialization of the required values.
 *
 * Usage:
 * ```
 * const resources = lazy(() => {
 *   const data = heavyProcess()
 *   return {
 *     data,
 *   }
 * })
 * // somewhere else
 * doSomethingWith(resources().data)
 * ```
 */
export declare const lazy: <T extends unknown>(callback: () => T) => () => T;
//# sourceMappingURL=lazy.d.ts.map