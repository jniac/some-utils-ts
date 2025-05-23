const map = new WeakMap();
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
export const lazy = (callback) => {
    return () => {
        const value = map.get(callback);
        if (value === undefined) {
            const value = callback();
            map.set(callback, value);
            return value;
        }
        return value;
    };
};
//# sourceMappingURL=lazy.js.map